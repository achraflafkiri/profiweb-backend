// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');
const { isSuperAdmin, isAdmin } = require('../middlewares/roles');
const { hasPermission } = require('../middlewares/permissions');

// All admin routes require authentication
router.use(protect);

// SUPERADMIN ROUTES
router.get('', isSuperAdmin, adminController.getAllAdmins);
router.get('/:adminId', isSuperAdmin, adminController.getAdmin);

module.exports = router;