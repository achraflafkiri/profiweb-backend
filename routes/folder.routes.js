// routes/pdf.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  createFolder,
  getFolders
} = require("../controllers/folderController");

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getFolders)
  .post(createFolder);

module.exports = router;