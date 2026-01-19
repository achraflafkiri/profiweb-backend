// controllers/adminController.js
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError"); 

// Get all admins (superadmin only)
exports.getAllAdmins = catchAsync(async (req, res, next) => {
  const { search, isActive, page = 1, limit = 20 } = req.query;

  // Query for admin users
  let query = { role: { $in: ['superadmin', 'admin'] } };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } }
    ];
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const admins = await User.find(query)
    .select('-password -passwordConfirm')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName email');

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: admins.length,
    total,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    data: {
      admins
    }
  });
});

// Get specific admin
exports.getAdmin = catchAsync(async (req, res, next) => {
  const { adminId } = req.params;

  const admin = await User.findById(adminId)
    .select('-password -passwordConfirm')
    .populate('createdBy', 'firstName lastName email');

  if (!admin) {
    return next(new AppError('Admin not found', 404));
  }

  // Only superadmin can access other admins
  if (req.user.role !== 'superadmin' && admin._id.toString() !== req.user.id) {
    return next(new AppError('Access denied', 403));
  }

  res.status(200).json({
    success: true,
    data: {
      admin
    }
  });
});