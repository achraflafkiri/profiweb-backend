// controllers/uploadController.js - Updated with path normalization
const Project = require("../models/project.model");
const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { getFileInfo, normalizePath } = require("../middlewares/uploadFiles");

const uploadFiles = catchAsync(async (req, res, next) => {
    const { projectId } = req.body;

    if (!req.files || req.files.length === 0) {
        return next(new AppError('No files uploaded', 400));
    }

    // Validate project exists if projectId is provided
    if (projectId) {
        const project = await Project.findById(projectId);
        if (!project) {
            return next(new AppError('Project not found', 404));
        }
    }

    // Check if folder already exists for this project and user
    let projectFolder = await Folder.findOne({
        project: projectId,
        user: req.user.id,
        name: "Client Files"
    });

    // If folder doesn't exist, create ONE folder only
    if (!projectFolder && projectId) {
        const project = await Project.findById(projectId);
        const folderName = "Client Files";
        
        projectFolder = await Folder.create({
            name: folderName,
            user: req.user.id,
            project: projectId,
            description: `Folder for project files`
        });
        
        console.log(`✅ Created ONE folder: "${folderName}" for project ${projectId}`);
    } else if (projectFolder) {
        console.log(`✅ Using existing folder: "${projectFolder.name}" for project ${projectId}`);
    }

    const uploadedFiles = [];
    const createdFiles = [];

    // Process all files
    for (const file of req.files) {
        const fileInfo = getFileInfo(file, projectId);
        uploadedFiles.push(fileInfo);

        // Ensure the path is clean and consistent
        const cleanPath = normalizePath(fileInfo.path) || fileInfo.path;

        console.log("-----------------------------------> ",fileInfo.url)
        
        const newFile = await File.create({
            filename: fileInfo.filename,
            originalName: file.originalname,
            path: fileInfo.url, // This should be like "pdfs/filename.pdf"
            url: fileInfo.url, // This should be "/uploads/pdfs/filename.pdf"
            size: fileInfo.size,
            mimetype: file.mimetype,
            project: projectId,
            user: req.user.id,
            folder: projectFolder ? projectFolder._id : null,
            fileType: getFileType(file.mimetype)
        });

        createdFiles.push(newFile);
    }

    // Helper function to determine file type
    function getFileType(mimetype) {
        if (mimetype.startsWith('image/')) return 'images';
        if (mimetype.includes('pdf')) return 'pdfs';
        if (mimetype.includes('word') || mimetype.includes('excel') || mimetype.includes('powerpoint')) {
            return 'documents';
        }
        if (mimetype.startsWith('video/')) return 'videos';
        if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('compressed')) {
            return 'archives';
        }
        return 'others';
    }

    // Update project with file references
    if (projectId && createdFiles.length > 0) {
        await Project.findByIdAndUpdate(
            projectId,
            {
                $push: {
                    files: { $each: createdFiles.map(file => file._id) }
                },
                $inc: {
                    totalFiles: createdFiles.length,
                    totalSize: createdFiles.reduce((sum, file) => sum + (parseInt(file.size) || 0), 0)
                }
            },
            { new: true }
        );
    }

    // Update folder with file references if folder exists
    if (projectFolder && createdFiles.length > 0) {
        await Folder.findByIdAndUpdate(
            projectFolder._id,
            {
                $push: {
                    files: { $each: createdFiles.map(file => file._id) }
                },
                $inc: {
                    fileCount: createdFiles.length,
                    totalSize: createdFiles.reduce((sum, file) => sum + (parseInt(file.size) || 0), 0)
                }
            },
            { new: true }
        );
    }

    res.status(200).json({
        status: 'success',
        message: 'Files uploaded successfully',
        count: uploadedFiles.length,
        folder: projectFolder ? {
            id: projectFolder._id,
            name: projectFolder.name,
            existed: true
        } : null,
        files: uploadedFiles,
        createdFiles: createdFiles.map(file => ({
            id: file._id,
            filename: file.filename,
            originalName: file.originalName,
            path: file.path, // This should be like "pdfs/filename.pdf"
            url: file.url,   // This should be like "/uploads/pdfs/filename.pdf"
            size: file.size,
            mimetype: file.mimetype,
            fileType: file.fileType,
            folder: file.folder
        }))
    });
});

// Function to fix existing file paths in database
const fixFilePaths = catchAsync(async (req, res, next) => {
    // Get all files with absolute paths
    const files = await File.find({
        $or: [
            { path: { $regex: /^[A-Za-z]:\\/ } }, // Windows absolute paths like D:\
            { path: { $regex: /^\\/ } }, // Unix absolute paths like /home
            { path: { $regex: /uploads.*uploads/ } } // Contains uploads twice
        ]
    });

    let fixedCount = 0;
    const results = [];

    for (const file of files) {
        const oldPath = file.path;
        const normalizedPath = normalizePath(oldPath);
        
        if (normalizedPath && normalizedPath !== oldPath) {
            // Update the path
            file.path = normalizedPath;
            
            // Update the URL if it exists
            if (file.url) {
                file.url = `/uploads/${normalizedPath}`;
            } else {
                file.url = `/uploads/${normalizedPath}`;
            }
            
            await file.save();
            fixedCount++;
            results.push({
                id: file._id,
                oldPath: oldPath,
                newPath: normalizedPath,
                newUrl: file.url
            });
            
            console.log(`✅ Fixed path for file ${file.filename}: ${oldPath} → ${normalizedPath}`);
        }
    }

    res.status(200).json({
        status: 'success',
        message: `Fixed ${fixedCount} file paths`,
        fixedCount,
        results
    });
});

module.exports = {
    uploadFiles,
    fixFilePaths // Add this if you want to fix existing data
};