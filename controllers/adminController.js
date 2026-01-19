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

// Add new user
exports.createUser = catchAsync(async (req, res, next) => {
  const {
    username,
    email,
    password,
    passwordConfirm,
    firstName,
    lastName,
    phone,
    department
  } = req.body;

  console.log("🛠️ Creating new user - Request from:", req.user.role);
  console.log("📝 User data received:", { username, email, firstName, lastName, phone, department });

  // 1. Check all required fields
  const requiredFields = ['username', 'email', 'password', 'passwordConfirm', 'firstName', 'lastName', 'phone'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }

  // 2. Check if passwords match
  if (password !== passwordConfirm) {
    return next(new AppError("Passwords do not match", 400));
  }

  // 3. Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username }
    ]
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      return next(new AppError("Email already registered", 400));
    }
    if (existingUser.username === username) {
      return next(new AppError("Username already taken", 400));
    }
  }

  // 4. Handle department based on admin role
  let userDepartment = department;
  
  if (req.user.role === 'admin') {
    // Admin can only create users in 'informations' department
    if (userDepartment && userDepartment !== 'informations') {
      return next(new AppError("You can only create users in the 'informations' department", 403));
    }
    userDepartment = 'informations'; // Force informations department
  } 
  else if (req.user.role === 'superadmin') {
    // Superadmin can create users with specified department or default to informations
    if (!userDepartment) {
      userDepartment = 'informations';
    }
  }

  // 5. Validate department
  const validDepartments = ['informations'];
  if (!validDepartments.includes(userDepartment)) {
    return next(new AppError(`Invalid department. Must be one of: ${validDepartments.join(', ')}`, 400));
  }

  // 6. Create the user (always as 'user' role)
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password,
    passwordConfirm,
    firstName,
    lastName,
    phone,
    role: 'user', // Always create as regular user
    department: userDepartment,
    isActive: true,
    createdBy: req.user._id
  });

  console.log("✅ User created successfully:", user.email);

  // 7. Prepare response (remove sensitive data)
  const userResponse = {
    id: user._id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    roleName: user.roleName,
    department: user.department,
    departmentName: user.departmentName,
    isActive: user.isActive,
    createdAt: user.createdAt,
    createdBy: req.user.username
  };

  res.status(201).json({
    success: true,
    message: "New user has been created successfully!",
    data: userResponse
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  console.log("📋 Fetching all users - Request from:", req.user.role);

  // 1. Build base query based on requester's role
  let query = {};

  if (req.user.role === 'admin') {
    // Admin can only see users in 'informations' department
    query = {
      role: 'user',
      department: 'informations'
    };
  } 
  else if (req.user.role === 'superadmin') {
    // Superadmin can see all non-superadmin users
    query = {
      role: { $ne: 'superadmin' }
    };
  } 
  else {
    return next(new AppError("Unauthorized access", 403));
  }

  // 2. Apply filters from query parameters
  const { 
    role, 
    department, 
    isActive, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Role filter
  if (role && ['user', 'admin'].includes(role)) {
    query.role = role;
  }

  // Department filter
  if (department && ['informations'].includes(department)) {
    query.department = department;
  }

  // Active status filter
  if (isActive !== undefined) {
    query.isActive = isActive === 'true' || isActive === true;
  }

  // Search filter (searches in name, email, username)
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } }
    ];
  }

  // 3. Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // 4. Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // 5. Execute query with pagination
  const users = await User.find(query)
    .select('-password -passwordConfirm -__v')
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  // 6. Get total count for pagination info
  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limitNum);

  // 7. Prepare response data
  const usersResponse = users.map(user => ({
    id: user._id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    roleName: user.roleName,
    department: user.department,
    departmentName: user.departmentName,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));

  // 8. Send response
  res.status(200).json({
    success: true,
    count: users.length,
    total: totalUsers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    },
    data: usersResponse
  });
});