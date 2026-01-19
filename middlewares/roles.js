const AppError = require('../utils/AppError');

// Check if user has required role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

// Check if user is superadmin
exports.isSuperAdmin = (req, res, next) => {
  console.log("req.user ==> ", req.user.role);
  
  if (!req.user || req.user.role !== 'superadmin') {
    return next(new AppError('Super admin access required', 403));
  }
  next();
};

// Check if user is admin or superadmin
exports.isAdmin = (req, res, next) => {
  if (!req.user || !['superadmin', 'admin'].includes(req.user.role)) {
    return next(new AppError('Admin access required', 403));
  }
  next();
};