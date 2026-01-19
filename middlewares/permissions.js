const AppError = require('../utils/AppError');

// Check if user has specific permission
exports.hasPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Superadmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      req.user.hasPermission(permission)
    );

    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Check if admin can manage specific department
exports.canManageDepartment = (departmentParam = 'department') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Get department from request
    const department = req.body[departmentParam] || req.params[departmentParam];
    
    if (!department) {
      return next(new AppError('Department is required', 400));
    }

    // Check if user can manage this department
    if (!req.user.canManageDepartment(department)) {
      return next(new AppError(`You cannot manage the ${department} department`, 403));
    }

    next();
  };
};