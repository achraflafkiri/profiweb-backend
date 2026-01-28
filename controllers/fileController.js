// controllers/fileController.js
const File = require('../models/file.model');
const Folder = require('../models/folder.model');
const path = require('path');
const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Upload file to folder
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }

        const { folderId } = req.body;
        const userId = req.user._id;

        // Validate folder exists and belongs to user
        if (folderId) {
            const folder = await Folder.findOne({
                _id: folderId,
                user: userId
            });

            if (!folder) {
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);
                return res.status(404).json({
                    status: 'error',
                    message: 'Folder not found'
                });
            }
        }

        // Create file record
        const file = await File.create({
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: `/uploads/${userId}/${folderId || 'root'}/${req.file.filename}`,
            folder: folderId || null,
            user: userId
        });

        res.status(201).json({
            status: 'success',
            message: 'File uploaded successfully',
            data: { file }
        });

    } catch (error) {
        // Clean up on error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get file details
const getFile = async (req, res) => {
    try {
        const userId = req.user._id;
        const fileId = req.params.id;

        const file = await File.findOne({
            _id: fileId,
            user: userId
        }).populate('folder', 'name');

        if (!file) {
            return res.status(404).json({
                status: 'error',
                message: 'File not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { file }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Download file
const downloadFile = async (req, res) => {
    try {
        const userId = req.user._id;
        const fileId = req.params.id;

        const file = await File.findOne({
            _id: fileId,
            user: userId
        });

        if (!file) {
            return res.status(404).json({
                status: 'error',
                message: 'File not found'
            });
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json({
                status: 'error',
                message: 'File not found on server'
            });
        }

        // Update download count
        await File.findByIdAndUpdate(fileId, {
            $inc: { downloadCount: 1 }
        });

        // Send file
        res.download(file.path, file.originalname);

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete file
const deleteFile = async (req, res) => {
    try {
        const userId = req.user._id;
        const fileId = req.params.id;

        const file = await File.findOne({
            _id: fileId,
            user: userId
        });

        if (!file) {
            return res.status(404).json({
                status: 'error',
                message: 'File not found'
            });
        }

        // Delete physical file
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Delete from database
        await File.findByIdAndDelete(fileId);

        res.status(200).json({
            status: 'success',
            message: 'File deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get user's files
const getUserFiles = async (req, res) => {
    try {
        const userId = req.user._id;
        const { folderId } = req.query;

        const query = { user: userId };
        if (folderId) query.folder = folderId;

        const files = await File.find(query)
            .sort({ createdAt: -1 })
            .populate('folder', 'name');

        res.status(200).json({
            status: 'success',
            data: { files }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

const getFilesByFolderId = catchAsync(async (req, res, next) => {
  const { folderId } = req.params;
  
  // Check if folder exists
  const folder = await Folder.findById(folderId);
  
  if (!folder) {
    return next(new AppError('Folder not found', 404));
  }

  // Get all files in this folder
  const files = await File.find({ folder: folderId })
    .sort({ createdAt: -1 })
    .lean();  // Returns plain JavaScript objects instead of mongoose documents

  // Return the data
  res.status(200).json({
    status: 'success',
    data: {
      folder: {
        id: folder._id,
        name: folder.name
      },
      files: files,
      count: files.length
    }
  });
});

module.exports = {
    uploadFile,
    getFile,
    downloadFile,
    deleteFile,
    getUserFiles,
    getFilesByFolderId
};