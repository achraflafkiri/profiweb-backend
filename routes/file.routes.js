// routes/pdf.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  uploadFile,
  getFile,
  downloadFile,
  deleteFile,
  getUserFiles,
  getFilesByFolderId
} = require("../controllers/fileController");

const router = express.Router();

// router.use(protect);

router.route("/:folderId")
  .get(getFilesByFolderId)

module.exports = router;