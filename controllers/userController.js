const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { deleteImageFromCloudinary } = require("../utils/cloudinary");

// Helper function to extract public_id from Cloudinary URL
function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}

const updateUserById = catchAsync(async (req, res, next) => {
  try {
    console.log("updateUserById - Direct Cloudinary URL approach");

    const userId = req.user._id;
    const currentUser = await User.findById(userId);

    console.log("userId", userId);

    if (!currentUser) {
      return next(new AppError("Utilisateur introuvable.", 404));
    }

    let photoUrl = currentUser.photo;

    console.log("photoUrl: ", photoUrl);
    console.log("req.body.photo: ", req.body.photo);

    // Handle photo update/removal
    if (req.body.photo !== undefined) {
      if (req.body.photo && req.body.photo.startsWith('http')) {
        // New Cloudinary URL provided
        photoUrl = req.body.photo;

        // Delete old photo if it's different and from Cloudinary
        if (currentUser.photo &&
          currentUser.photo.includes('cloudinary.com') &&
          currentUser.photo !== req.body.photo) {
          const publicId = extractPublicIdFromUrl(currentUser.photo);
          if (publicId) {
            await deleteImageFromCloudinary(publicId);
          }
        }
      } else if (req.body.photo === '' || req.body.photo === null) {
        // Handle photo removal
        if (currentUser.photo && currentUser.photo.includes('cloudinary.com')) {
          const publicId = extractPublicIdFromUrl(currentUser.photo);
          if (publicId) {
            await deleteImageFromCloudinary(publicId);
          }
        }
        photoUrl = null;
      }
    }

    // Parse arrays if they're strings
    let hobbies = req.body.hobbies;
    if (typeof hobbies === 'string') {
      try {
        hobbies = JSON.parse(hobbies);
      } catch (e) {
        hobbies = [];
      }
    }

    let childrenAges = req.body.childrenAges;
    if (typeof childrenAges === 'string') {
      try {
        childrenAges = JSON.parse(childrenAges);
      } catch (e) {
        childrenAges = [];
      }
    }

    // Parse boolean values
    const conductAgreement = req.body.conductAgreement === 'true' || req.body.conductAgreement === true;
    const isPublic = req.body.isPublic === 'true' || req.body.isPublic === true;

    // console.log("isPublic: ", isPublic);

    // Create update data
    const updateData = {
      username: req.body.username,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio || '',
      phone: req.body.phone,
      age: parseInt(req.body.age) || undefined,
      status: req.body.status,
      profession: req.body.profession || '',
      hobbies: hobbies,
      children: parseInt(req.body.children) || 0,
      childrenAges: childrenAges || [],
      custody: req.body.custody || currentUser.custody,
      custodyDetails: req.body.custodyDetails || currentUser.custodyDetails,
      conductAgreement,
      isPublic: isPublic,
      photo: photoUrl,
      latitude: req.body.latitude || currentUser.latitude,
      longitude: req.body.longitude || currentUser.longitude,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
        context: 'query' // This helps with some validation issues
      }
    ).select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires');

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur mis à jour avec succès',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error("Error in updateUserById:", error);

    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      return next(new AppError(`Invalid input data: ${errors.join('. ')}`, 400));
    }

    // Handle duplicate field errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new AppError(`${field} already exists. Please use another value.`, 400));
    }

    next(error);
  }
});

const getUserById = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Find user and explicitly exclude sensitive fields
    const user = await User.findById(userId).select(
      '-password -__v -passwordChangedAt -isVerified -lastLogin -role -isActive'
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    // Return all user data except the excluded fields
    res.status(200).json({
      status: 'success',
      message: 'Utilisateur récupéré avec succès',
      data: {
        user
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

const getAllUsers = catchAsync(async (req, res, next) => {
  try {
    const users = await User.find().select('-password -__v -passwordChangedAt -isVerified -lastLogin -role -isActive');
    res.status(200).json({
      status: 'success',
      message: 'Utilisateurs récupérés avec succès',
      data: {
        users: users
      }
    })
  } catch (error) {
    console.error(error);
    next(error);
  }
});

const getAllPublicUsers = catchAsync(async (req, res, next) => {
  try {
    const users = await User.find({ isPublic: true }).select('-password -__v -passwordChangedAt -isVerified -lastLogin -role -isActive');
    res.status(200).json({
      status: 'success',
      message: 'Utilisateurs récupérés avec succès',
      data: {
        users: users
      }
    })
  } catch (error) {
    console.error(error);
    next(error);
  }
})

module.exports = {
  updateUserById,
  getUserById,
  getAllUsers,
  getAllPublicUsers
};