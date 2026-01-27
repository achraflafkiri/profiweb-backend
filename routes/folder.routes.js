// routes/pdf.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth");
const { 
  createFolder
} = require("../controllers/folderController");

const router = express.Router();

router.use(protect);

router.route("/")
  .post(createFolder);

module.exports = router;