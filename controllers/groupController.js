const catchAsync = require("../utils/catchAsync");
const Group = require("../models/groupModel");
const AppError = require("../utils/AppError");
const Notification = require("../models/notificationModel");

// Predefined lists for validation
// const validIcons = [
//   'account-group', 'baby-carriage', 'chef-hat',
//   'book-open-variant', 'medical-bag', 'gamepad-variant',
//   'human-male-girl', 'human-female-girl', 'heart',
//   'school', 'lightbulb-on'
// ];

const validColors = [
  '#E85A4F', '#4FC3F7', '#66BB6A', '#FFB74D',
  '#AB47BC', '#FF8A65', '#7986CB', '#4DB6AC'
];

const createGroup = catchAsync(async (req, res, next) => {
  try {
    console.log("======");

    // 1) Extract data from request body
    const {
      name,
      description,
      category,
      icon,
      iconColor,
      rules,
      isPublic
    } = req.body;

    console.log(req.body);


    // 2) Validate required fields
    if (!name || !category || !icon || !iconColor || !rules) {
      return next(new AppError('Veuillez renseigner tous les champs obligatoires', 400));
    }

    // 3) Validate icon is from allowed list
    // if (!validIcons.includes(icon)) {
    //   return next(new AppError("Sélection d'icône invalide", 400));
    // }

    // 4) Validate color is from allowed list
    if (!validColors.includes(iconColor)) {
      return next(new AppError("Couleur d'icône invalide", 400));
    }

    // 5) Get creator ID from authenticated user
    const createdBy = req.user._id;

    console.log("createdBy: ", createdBy);


    // 6) Create the group
    const newGroup = await Group.create({
      name,
      description,
      category,
      icon,
      iconColor,
      rules,
      isPublic: isPublic !== undefined ? isPublic : true, // default to true if not provided
      createdBy,
      members: [createdBy], // Automatically add creator as first member
    });

    // 7) Send response
    res.status(201).json({
      success: true,
      data: {
        group: newGroup
      }
    });
  } catch (error) {
    console.error(error);
  }
});

const getAllGroups = catchAsync(async (req, res, next) => {
  const groups = await Group.find();
  res.status(200).json({
    success: true,
    data: {
      groups,
      length: groups.length,
    }
  });
});

const askToJoin = catchAsync(async (req, res, next) => {
  const { groupId, userId } = req.params;

  // 1) Find the group
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new AppError('Groupe introuvable', 404));
  }

  // 2) Check if the user is already a member or a pending member
  // if (group.members.includes(userId) || group.pendingMembers.includes(userId)) {
  if (group.members.includes(userId)) {
    return next(new AppError('Utilisateur déjà membre ou inscription en cours', 400));
  }

  // 3) Add the user to pendingMembers
  // group.pendingMembers.push(userId);
  group.members.push(userId); // push users directly to members array

  // 4) Save the updated group
  await group.save();

  // 5) Send Notification
  // await Notification.create({
  //   recipient: group.createdBy,
  //   sender: userId,
  //   group: groupId,
  //   type: 'JOIN_REQUEST_GROUP',
  //   title: "Demande d’adhésion",
  //   message: `${req.user.firstName} a demandé à rejoindre votre groupe ${group.name}.`
  // });
  // Notified the group creator about the new member request
  await Notification.create({
    recipient: group.createdBy,                
    sender: userId,                            
    group: groupId,
    type: 'USER_JOINED_GROUP',                 
    title: "Nouvel utilisateur",
    message: `${req.user.firstName} a rejoint votre groupe ${group.name}.`,
  });  

  // 6) Send response
  res.status(200).json({
    success: true,
    data: {
      group
    }
  });
});

const acceptRequest = catchAsync(async (req, res, next) => {
  const { groupId, userId } = req.params;
  const { notificationId } = req.body;

  // 1) Find the group
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new AppError('Groupe introuvable.', 404));
  }

  // Debug logging
  console.log("userId:", userId, "type:", typeof userId);
  console.log("pendingMembers:", group.pendingMembers.map(id => id.toString()));

  // 2) Check if the user is a pending member
  const isPending = group.pendingMembers.some(id => id.toString() === userId.toString());
  if (!isPending) {
    return next(new AppError('L\'utilisateur n\'est pas en attente d\'approbation', 400));
  }

  await Notification.findByIdAndDelete(notificationId);

  // 3) Remove the user from pendingMembers and add to members
  group.pendingMembers = group.pendingMembers.filter(
    id => id.toString() !== userId.toString()
  );

  // Alternative method:
  // group.pendingMembers.pull(userId);

  // check if the user already exists in members
  const isMember = group.members.some(id => id.toString() === userId.toString());
  if (isMember) {
    return next(new AppError("L'utilisateur est déjà membre.", 400));
  }
  group.members.push(userId);

  // 4) Save the updated group
  await group.save({ validateBeforeSave: true });

  // 5) Send Notification
  await Notification.create({
    recipient: userId,
    sender: group.createdBy,
    group: groupId,
    type: 'APPROVED_REQUEST_GROUP',
    title: "Demande d'adhésion acceptée",
    message: `${req.user.firstName} a accepté votre demande d'adhésion au groupe ${group.name}.`
  });

  res.status(200).json({
    success: true,
    data: { group }
  });
});

const getGroupById = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.groupId)
    .populate("members", "firstName lastName photo username")
    .populate("createdBy", "firstName lastName username");
  if (!group) {
    return next(new AppError('Groupe introuvable', 404));
  }
  res.status(200).json({
    success: true,
    data: {
      group
    }
  });
})

const getAllGroupsCategories = catchAsync(async (req, res, next) => {
  const categories = await Group.distinct('category');
  res.status(200).json({
    success: true,
    data: {
      categories
    }
  });
});

const refuseRequest = catchAsync(async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;
    const { notificationId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError('Groupe introuvable', 404));
    }

    if (!group.pendingMembers.some(id => id.toString() === userId.toString())) {
      return next(new AppError("L'utilisateur n'est pas en attente de validation", 400));
    }

    await Notification.findByIdAndDelete(notificationId);

    group.pendingMembers = group.pendingMembers.filter(
      id => id.toString() !== userId.toString()
    );

    await group.save();

    await Notification.create({
      recipient: userId,
      sender: group.createdBy,
      group: groupId,
      type: 'REFUSE_REQUEST_GROUP',
      title: "Demande d'adhésion refusée",
      message: `${req.user.firstName} a refusé votre demande d'adhésion au groupe ${group.name}.`
    });

    res.status(200).json({
      success: true,
      data: {
        group
      }
    });
  } catch (error) {
    console.error(error);
    return next(new AppError('Erreur interne du serveur', 500));
  }
});

const leaveGroup = catchAsync(async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError('Groupe introuvable', 404));

    }

    // Check if the user is a member
    if (!group.members.includes(userId)) {
      return next(new AppError("L'utilisateur n'est pas membre.", 400));
    }

    // Remove the user from the members array
    group.members = group.members.filter(id => id !== userId);

    // Save the updated group
    await group.save();

    res.status(200).json({
      success: true,
      data: {
        group
      },
      message: "Vous avez quitté le groupe avec succès"
    });
  } catch (error) {
    console.error(error);
  }
});

const getAllGroupMembers = catchAsync(async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members');
    if (!group) {
      return next(new AppError('Groupe introuvable.', 404));
    }
    res.status(200).json({
      success: true,
      data: {
        groupMembers: group.members
      }
    });
  } catch (error) {
    console.error(error);
  }
});

const deleteGroupById = catchAsync(async (req, res, next) => {
  try {
    const deletedGroup = await Group.findByIdAndDelete(req.params.groupId);
    if (!deletedGroup) {
      return next(new AppError('Groupe introuvable.', 404));
    }
    res.status(200).json({
      success: true,
      message: "Groupe supprimé avec succès.",
      data: {
        deletedGroup
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
})

module.exports = {
  getAllGroups,
  createGroup,
  askToJoin,
  acceptRequest,
  getGroupById,
  getAllGroupsCategories,
  refuseRequest,
  leaveGroup,
  getAllGroupMembers,
  deleteGroupById
};