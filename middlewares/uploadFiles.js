// middlewares/uploadFiles.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');

// Ensure uploads directory exists with subdirectories
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ Created uploads directory: ${uploadsDir}`);
}

// Create subdirectories for different file types
const createUploadsSubdirs = () => {
    const subdirs = ['documents', 'images', 'pdfs', 'videos', 'archives', 'others'];
    subdirs.forEach(dir => {
        const dirPath = path.join(uploadsDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Created directory: ${dirPath}`);
        }
    });
};
createUploadsSubdirs();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'others';
        
        // Determine folder based on file type
        if (file.mimetype.startsWith('image/')) {
            folder = 'images';
        } else if (file.mimetype.includes('pdf')) {
            folder = 'pdfs';
        } else if (file.mimetype.includes('word') || file.mimetype.includes('excel') || file.mimetype.includes('powerpoint')) {
            folder = 'documents';
        } else if (file.mimetype.startsWith('video/')) {
            folder = 'videos';
        } else if (file.mimetype.includes('zip') || file.mimetype.includes('rar') || file.mimetype.includes('compressed')) {
            folder = 'archives';
        }
        
        const dirPath = path.join(uploadsDir, folder);
        
        // Ensure folder exists
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        cb(null, dirPath);
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname);
        const filename = `${path.basename(file.originalname, extension)}-${uniqueId}${extension}`;
        cb(null, filename);
    }
});

// File filter function - accept all file types
const fileFilter = (req, file, cb) => {
    // Accept all files
    cb(null, true);
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
        files: 10 // Max 10 files
    }
});

// Upload multiple files middleware
const uploadFiles = upload.array('files', 10);

// Get file info
const getFileInfo = (file, projectId) => {
    return {
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        destination: file.destination,
        url: `/uploads/${path.relative(uploadsDir, file.path).replace(/\\/g, '/')}`,
        projectId: projectId,
        uploadedAt: new Date()
    };
};

// Delete file from local storage
const deleteFileLocally = async (filePath) => {
    try {
        if (!filePath || typeof filePath !== 'string') {
            console.log('⚠️ No file path provided for deletion');
            return false;
        }

        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(uploadsDir, filePath);
        
        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
            console.log(`⚠️ File not found: ${absolutePath}`);
            return false;
        }

        // Delete the file
        await fs.promises.unlink(absolutePath);
        console.log(`✅ Deleted file: ${absolutePath}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting file:', error);
        return false;
    }
};

module.exports = {
    uploadFiles,
    getFileInfo,
    deleteFileLocally
};