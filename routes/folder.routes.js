// routes/pdf.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  createFolder,
  getFolders,
  getFolderFiles
} = require("../controllers/folderController");

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getFolders)
  .post(createFolder);

// GET THE FOLDER FILES
router.route("/:folderId")
  .get(getFolderFiles)

module.exports = router;