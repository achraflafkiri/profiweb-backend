const express = require("express");
const {
  login,
  register,
  getMe,
  updateProfile,
  logout
} = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (all logged-in users)
router.use(protect); // All routes below require authentication

router.get("/me", getMe);
router.put("/update-profile", updateProfile);
router.post("/logout", logout);

module.exports = router;