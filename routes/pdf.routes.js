// routes/pdf.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth");
const { 
  getProjectPDFs,
  downloadPDF,
  generatePDFsForProject,
  deletePDF 
} = require("../controllers/pdfController.js");

const router = express.Router();

router.use(protect);

router.route("/project/:projectId")
  .get(getProjectPDFs)
  .post(generatePDFsForProject);

router.route("/:filename")
  .get(downloadPDF)
  .delete(deletePDF);

module.exports = router;