// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');
const { isSuperAdmin, isAdmin } = require('../middlewares/roles');

// All admin routes require authentication
router.use(protect);

// ========== SUPERADMIN ONLY ROUTES ==========
// These routes are ONLY for superadmin
router.get('', isSuperAdmin, adminController.getAllAdmins);
router.get('/:adminId', isSuperAdmin, adminController.getAdmin);
// router.post('/add-admin', isSuperAdmin, adminController.createAdmin);

// ========== ADMIN & SUPERADMIN ROUTES ==========
// These routes can be accessed by BOTH admin and superadmin
router.get('/users/all', isAdmin, adminController.getAllUsers);
// router.get('/users/:userId', isAdmin, adminController.getUser);
router.post('/users/add', isAdmin, adminController.createUser);
// router.put('/users/:userId', isAdmin, adminController.updateUser);
// router.delete('/users/:userId', isAdmin, adminController.deleteUser);

module.exports = router;