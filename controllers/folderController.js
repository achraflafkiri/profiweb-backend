// controllers/folderController.js
const Folder = require('../models/folder.model');
const File = require('../models/file.model');
const catchAsync = require('../utils/catchAsync');

// Create a new folder
const createFolder = catchAsync(async (req, res) => {
    try {
        const { name, projectId } = req.body;
        const userId = req.user._id;

        // Check if folder with same name exists for this user
        const existingFolder = await Folder.findOne({
            user: userId,
            name: name
        });

        if (existingFolder) {
            return res.status(400).json({
                status: 'error',
                message: 'You already have a folder with this name'
            });
        }

        const folder = await Folder.create({
            name,
            user: userId,
            project: projectId || null
        });

        res.status(201).json({
            status: 'success',
            message: 'Folder created successfully',
            data: { folder }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

const getFolders = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const folders = await Folder.find({
        user: userId
    }).sort({ createdAt: -1 });

    const files = await File.findOne({
        folder: folders._id
    });

    console.log("files: ", files);
    console.log("folders: ", folders);
    
    res.status(200).json({
        status: 'success',
        data: { 
            folders,
            count: folders.length
        }
    });
});

const getFolderFiles = catchAsync(async (req, res) => {
    const {folderId} = req.params;
    const file = await File.findOne({
        folder: folderId
    });
    res.status(200).json({
        status: "success",
        data: {file},
        message: "Fetching folder files successsfully!"
    })
});

module.exports = {
    createFolder,
    getFolders,
    getFolderFiles
};