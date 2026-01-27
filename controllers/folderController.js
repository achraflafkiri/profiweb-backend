// controllers/folderController.js
const Folder = require('../models/folder.model');
const File = require('../models/file.model');

// Create a new folder
const createFolder = async (req, res) => {
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
};

// Get all folders for current user
const getUserFolders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { projectId } = req.query;

        const query = { user: userId };
        if (projectId) query.project = projectId;

        const folders = await Folder.find(query)
            .sort({ createdAt: -1 })
            .populate('project', 'title');

        res.status(200).json({
            status: 'success',
            data: { folders }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get single folder with its files
const getFolder = async (req, res) => {
    try {
        const userId = req.user._id;
        const folderId = req.params.id;

        // Get folder
        const folder = await Folder.findOne({
            _id: folderId,
            user: userId
        });

        if (!folder) {
            return res.status(404).json({
                status: 'error',
                message: 'Folder not found'
            });
        }

        // Get files in this folder
        const files = await File.find({
            folder: folderId,
            user: userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: {
                folder,
                files
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete folder (and its files)
const deleteFolder = async (req, res) => {
    try {
        const userId = req.user._id;
        const folderId = req.params.id;

        // Find folder
        const folder = await Folder.findOne({
            _id: folderId,
            user: userId
        });

        if (!folder) {
            return res.status(404).json({
                status: 'error',
                message: 'Folder not found'
            });
        }

        // First, delete all files in this folder
        const files = await File.find({ folder: folderId });

        // Delete physical files
        const fs = require('fs');
        const path = require('path');

        for (const file of files) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            await File.findByIdAndDelete(file._id);
        }

        // Delete folder from database
        await Folder.findByIdAndDelete(folderId);

        res.status(200).json({
            status: 'success',
            message: 'Folder and all its files deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update folder
const updateFolder = async (req, res) => {
    try {
        const userId = req.user._id;
        const folderId = req.params.id;
        const { name } = req.body;

        // Check if new name already exists
        if (name) {
            const existingFolder = await Folder.findOne({
                user: userId,
                name: name,
                _id: { $ne: folderId }
            });

            if (existingFolder) {
                return res.status(400).json({
                    status: 'error',
                    message: 'You already have a folder with this name'
                });
            }
        }

        const folder = await Folder.findOneAndUpdate(
            { _id: folderId, user: userId },
            { name },
            { new: true, runValidators: true }
        );

        if (!folder) {
            return res.status(404).json({
                status: 'error',
                message: 'Folder not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Folder updated successfully',
            data: { folder }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = {
    createFolder,
    getUserFolders,
    getFolder,
    deleteFolder,
    updateFolder
};