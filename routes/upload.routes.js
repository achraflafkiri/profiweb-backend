// routes/upload.routes.js
const express = require("express");
const { uploadFiles } = require("../controllers/uploadController");
const { protect } = require("../middlewares/auth");
const { uploadFiles: uploadMiddleware } = require("../middlewares/uploadFiles");

const router = express.Router({ mergeParams: true });

router.use(protect);

// Public routes
router.route("/")
    .post(uploadMiddleware, uploadFiles)

module.exports = router;