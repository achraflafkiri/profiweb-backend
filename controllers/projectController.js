const catchAsync = require("../utils/catchAsync");
const Project = require("../models/project.model");
const Client = require("../models/client.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

const createProject = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    clientId,
    category,
    startDate,
    endDate,
    budget,
    cost,
    priority = "standard",
    tags
  } = req.body;

  // Validate required fields
  if (!title || !description || !clientId || !category || !startDate || !endDate || !budget) {
    return next(new AppError("Please provide all required fields", 400));
  }

  // Check if client exists
  const client = await Client.findById(clientId);
  if (!client) {
    return next(new AppError("Client not found", 404));
  }

  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set start date to beginning of day
  start.setHours(0, 0, 0, 0);

  // Set end date to end of day
  end.setHours(23, 59, 59, 999);

  // Validate dates
  if (start >= end) {
    return next(new AppError("End date must be after start date", 400));
  }

  // Create project
  const project = await Project.create({
    title,
    description,
    client: {
      name: client.name,
      id: client._id,
      contactPerson: client.contactPerson
    },
    category,
    status: 'planning',
    priority,
    startDate: start,
    endDate: end,
    budget,
    currency: 'MAD',
    projectManager: req.user.id,
    progress: 0,
    cost: cost || {
      estimated: budget,
      actual: 0,
      expenses: []
    },
    createdBy: req.user.id,
    isActive: true,
    tags
  });

  // Add project to client's projects list
  await Client.findByIdAndUpdate(clientId, {
    $push: { projects: project._id }
  });

  // Get populated project for response
  const populatedProject = await Project.findById(project._id)
    .populate('projectManager', 'name email')
    .populate('client.id', 'name email')

  res.status(201).json({
    status: 'success',
    message: 'Project created successfully',
    data: {
      project: populatedProject
    }
  });
});

const getProjectById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find project by ID with selective population
  const project = await Project.findById(id)
    .select('-__v')
    .populate({
      path: 'projectManager',
      select: 'name email role avatar'
    })
    .populate({
      path: 'client.id',
      select: 'name email company phone address contactPerson'
    })
    .populate({
      path: 'createdBy',
      select: 'name email'
    })
    .populate({
      path: 'tasks',
      select: 'title status dueDate assignedTo priority',
      options: { limit: 10, sort: { dueDate: 1 } }
    });

  // Check if project exists
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Authorization check
  const userRole = req.user.role;
  const userId = req.user.id;

  const canViewProject =
    userRole === 'admin' ||
    userRole === 'manager' ||
    project.projectManager.toString() === userId.toString() ||
    project.createdBy.toString() === userId.toString() ||
    project.teamMembers.some(member => member.user._id.toString() === userId.toString());

  if (!canViewProject && !project.isPublic) {
    return next(new AppError('You do not have permission to view this project', 403));
  }

  // Calculate additional project metrics
  const projectData = project.toObject();

  // Add virtual fields if not already included
  projectData.duration = project.duration;
  projectData.isOverdue = project.isOverdue;
  projectData.daysRemaining = project.daysRemaining;

  // Calculate completion rate of milestones
  if (projectData.milestones && projectData.milestones.length > 0) {
    const completedMilestones = projectData.milestones.filter(m => m.status === 'completed').length;
    projectData.milestoneCompletionRate = Math.round((completedMilestones / projectData.milestones.length) * 100);
  }

  res.status(200).json({
    status: 'success',
    data: {
      project: projectData
    }
  });
});

const deleteProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find the project
  const project = await Project.findById(id);

  // Check if project exists
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Authorization check
  const userRole = req.user.role;
  const userId = req.user.id;

  const canDeleteProject =
    userRole === 'admin' ||
    (userRole === 'manager' && project.createdBy.toString() === userId.toString()) ||
    project.createdBy.toString() === userId.toString();

  if (!canDeleteProject) {
    return next(new AppError('You do not have permission to delete this project', 403));
  }

  // Check project status for deletion restrictions
  const restrictedStatuses = ['active', 'completed'];
  if (restrictedStatuses.includes(project.status)) {
    return next(new AppError(
      `Cannot delete a project with status "${project.status}". Please change status to "cancelled" or "archived" first.`,
      400
    ));
  }

  // Get team member IDs before deletion for cleanup
  const teamMemberIds = project.teamMembers.map(member => member.user);

  // Remove project from client's projects list
  await Client.findByIdAndUpdate(project.client.id, {
    $pull: { projects: project._id }
  });

  // Remove project from team members' assigned projects
  await User.updateMany(
    { _id: { $in: teamMemberIds } },
    { $pull: { assignedProjects: project._id } }
  );

  // Soft delete: Mark as inactive instead of hard delete
  project.isActive = false;
  project.status = 'archived';
  project.updatedBy = req.user.id;
  await project.save();

  // OR for hard delete (uncomment if you want permanent deletion):
  // await Project.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Project archived successfully',
    data: null
  });
});

// Additional helper function: Get all projects with filtering
const getAllProjects = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    client,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { isActive: true };

  if (status) query.status = status;
  if (category) query.category = category;
  if (client) query['client.id'] = client;

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by user's projects if not admin
  // if (req.user.role !== 'admin') {
  //   query.$or = [
  //     { projectManager: req.user.id },
  //     { createdBy: req.user.id },
  //   ];
  // }

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const projects = await Project.find(query)
    // .select('title description status category priority progress startDate endDate budget client projectManager')
    .populate('projectManager', 'name email')
    .populate('client.id', 'name company')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Project.countDocuments(query);

  // Calculate stats
  const stats = await Project.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
      pagination: {
        currentPage: page * 1,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit * 1
      },
      stats
    }
  });
});

module.exports = {
  createProject,
  getProjectById,
  deleteProject,
  getAllProjects
};