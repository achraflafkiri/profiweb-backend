// controllers/uploadController.js
const Project = require("../models/project.model");
const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { getFileInfo } = require("../middlewares/uploadFiles");

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

    // Group files by type to organize into sub-folders
    const fileGroups = {
        images: [],
        documents: [],
        pdfs: [],
        others: []
    };

    req.files.forEach(file => {
        const mimetype = file.mimetype;
        if (mimetype.startsWith('image/')) {
            fileGroups.images.push(file);
        } else if (mimetype.includes('pdf')) {
            fileGroups.pdfs.push(file);
        } else if (mimetype.includes('word') || mimetype.includes('excel') || mimetype.includes('powerpoint')) {
            fileGroups.documents.push(file);
        } else {
            fileGroups.others.push(file);
        }
    });

    // Main project folder
    let mainFolder = null;
    if (projectId) {
        mainFolder = await Folder.findOne({
            project: projectId,
            user: req.user.id,
        });

        if (!mainFolder) {
            const project = await Project.findById(projectId);
            const folderName = project ? `${project.name} - Project` : 'Main Project Folder';
            
            mainFolder = await Folder.create({
                name: folderName,
                user: req.user.id,
                project: projectId,
            });
        }
    }

    const uploadedFiles = [];
    const createdFiles = [];

    // Process each file group
    for (const [fileType, files] of Object.entries(fileGroups)) {
        if (files.length === 0) continue;

        let typeFolder = null;
        if (mainFolder && fileType !== 'others') {
            // Create or find sub-folder for this file type
            typeFolder = await Folder.findOne({
                project: projectId,
                user: req.user.id,
            });

            if (!typeFolder) {
                typeFolder = await Folder.create({
                    name: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)}`,
                    user: req.user.id,
                    project: projectId,
                });
            }
        }

        // Process files in this group
        for (const file of files) {
            const fileInfo = getFileInfo(file, projectId);
            uploadedFiles.push(fileInfo);

            const newFile = await File.create({
                filename: fileInfo.filename,
                path: fileInfo.path,
                size: fileInfo.size,
                project: projectId,
                user: req.user.id,
                folder: typeFolder ? typeFolder._id : (mainFolder ? mainFolder._id : null),
            });

            createdFiles.push(newFile);
        }
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

    res.status(200).json({
        status: 'success',
        message: 'Files uploaded successfully',
        count: uploadedFiles.length,
        mainFolder: mainFolder ? {
            id: mainFolder._id,
            name: mainFolder.name
        } : null,
        files: uploadedFiles,
        createdFiles: createdFiles.map(file => ({
            id: file._id,
            filename: file.filename,
            originalName: file.originalName,
            url: file.url,
            size: file.size,
            mimetype: file.mimetype,
            fileType: file.fileType,
            folder: file.folder
        }))
    });
});

module.exports = {
    uploadFiles
};