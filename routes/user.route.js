const { Router } = require("express");
const { updateUserById, getUserById, getAllUsers, getAllPublicUsers } = require("../controllers/userController");
const protect = require("../middlewares/protect");

const router = Router();

router.route("/").get(getAllUsers);
router.route("/public").get(getAllPublicUsers);
router.route("/:id").get(getUserById);

// Simple route - no multer needed since we receive Cloudinary URL directly
router.patch('/update-profile', protect, updateUserById);

module.exports = router;