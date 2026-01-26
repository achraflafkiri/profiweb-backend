// controllers/pdfController.js
const catchAsync = require("../utils/catchAsync");
const Project = require("../models/project.model");
const PDFGenerator = require("../utils/pdfGenerator");
const AppError = require("../utils/AppError");
const fs = require("fs");
const path = require("path");

const getProjectPDFs = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      documents: project.documents || [],
      project: {
        id: project._id,
        title: project.title
      }
    }
  });
});

const downloadPDF = catchAsync(async (req, res, next) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads/pdfs", filename);

  if (!fs.existsSync(filePath)) {
    return next(new AppError("File not found", 404));
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Download error:", err);
      return next(new AppError("Error downloading file", 500));
    }
  });
});

const generatePDFsForProject = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  // Get all questions for the project
  const questions = await Question.find({ project: projectId })
    .sort({ order: 1 });

  if (!questions || questions.length === 0) {
    return next(new AppError("No questions found for this project", 400));
  }

  // Generate PDFs
  const pdfResults = await PDFGenerator.generateBothPDFs(project, questions);

  // Update project with PDF info
  await Project.findByIdAndUpdate(projectId, {
    $push: {
      documents: {
        $each: [
          {
            type: "doc-infos",
            filename: pdfResults.documents.docInfos.filename,
            url: pdfResults.documents.docInfos.url,
            generatedAt: new Date()
          },
          {
            type: "ai-structured",
            filename: pdfResults.documents.aiStructured.filename,
            url: pdfResults.documents.aiStructured.url,
            generatedAt: new Date()
          }
        ]
      }
    }
  });

  res.status(201).json({
    status: "success",
    message: "PDFs generated successfully",
    data: pdfResults
  });
});

const deletePDF = catchAsync(async (req, res, next) => {
  const { filename } = req.params;
  
  const result = await PDFGenerator.deletePDFs(`/uploads/pdfs/${filename}`);
  
  if (result.deleted > 0) {
    // Remove from project documents
    await Project.updateMany(
      { "documents.filename": filename },
      { $pull: { documents: { filename } } }
    );
    
    res.status(200).json({
      status: "success",
      message: "PDF deleted successfully"
    });
  } else {
    res.status(404).json({
      status: "error",
      message: "PDF not found or could not be deleted"
    });
  }
});

module.exports = {
  getProjectPDFs,
  downloadPDF,
  generatePDFsForProject,
  deletePDF
};