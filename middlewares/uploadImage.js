// middlewares/uploadImage.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ Created uploads directory: ${uploadsDir}`);
}

// Create subdirectories for different file types
const createUploadsSubdirs = () => {
    const subdirs = ['logos', 'images', 'photos', 'profiles', 'general'];
    subdirs.forEach(dir => {
        const dirPath = path.join(uploadsDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Created directory: ${dirPath}`);
        }
    });
};
createUploadsSubdirs();

// Configure multer for memory storage (process before saving)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new AppError('Only image files are allowed (jpeg, jpg, png, webp, gif)', 400));
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 10 // Max 10 files
    }
}).fields([
    { name: 'logo', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
    { name: 'profileImages', maxCount: 10 },
    { name: 'images', maxCount: 10 }
]);

// Save image locally and return URL path
const saveImageLocally = async (buffer, folder, filename, format = 'jpeg', quality = 85) => {
    try {
        const folderPath = path.join(uploadsDir, folder);
        
        // Ensure folder exists
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Add format extension if not present
        const ext = path.extname(filename);
        if (!ext) {
            filename = `${filename}.${format}`;
        }

        const filePath = path.join(folderPath, filename);
        
        // Write file to disk
        await fs.promises.writeFile(filePath, buffer);
        
        console.log(`✅ Image saved: ${filePath}`);
        
        // Return relative URL path for API access
        return `/uploads/${folder}/${filename}`;
    } catch (error) {
        console.error('❌ Error saving image locally:', error);
        throw new AppError('Failed to save image', 500);
    }
};

// Generate unique filename
const generateFilename = (originalName, prefix = 'image') => {
    const ext = path.extname(originalName) || '.jpeg';
    return `${prefix}-${uuidv4()}${ext}`;
};

// Process and resize single image
const processImage = async (file, options = {}) => {
    const {
        folder = 'images',
        prefix = 'image',
        width = 800,
        height = 600,
        fit = 'inside',
        format = 'jpeg',
        quality = 85
    } = options;

    try {
        // Process image with sharp
        let sharpInstance = sharp(file.buffer);
        
        // Resize if dimensions provided
        if (width && height) {
            sharpInstance = sharpInstance.resize(width, height, {
                fit: fit,
                withoutEnlargement: true
            });
        }

        // Convert to specified format
        if (format === 'jpeg' || format === 'jpg') {
            sharpInstance = sharpInstance.jpeg({ quality: quality });
        } else if (format === 'png') {
            sharpInstance = sharpInstance.png({ quality: Math.min(quality, 100) });
        } else if (format === 'webp') {
            sharpInstance = sharpInstance.webp({ quality: quality });
        }

        // Process image
        const buffer = await sharpInstance.toBuffer();
        
        // Generate filename
        const filename = generateFilename(file.originalname, prefix);
        
        // Save locally
        const imageUrl = await saveImageLocally(buffer, folder, filename, format, quality);
        
        return {
            url: imageUrl,
            filename: filename,
            originalName: file.originalname,
            size: buffer.length,
            mimeType: `image/${format}`
        };
    } catch (error) {
        console.error('❌ Error processing image:', error);
        throw new AppError('Failed to process image', 500);
    }
};

// Resize and save all uploaded images
const resizeImages = async (req) => {
    try {
        if (!req.files) {
            return;
        }

        console.log('📁 Processing uploaded files:', Object.keys(req.files));

        // Process logo (if exists)
        if (req.files['logo'] && req.files['logo'][0]) {
            console.log('🖼️ Processing logo...');
            const result = await processImage(req.files['logo'][0], {
                folder: 'logos',
                prefix: 'logo',
                width: 400,
                height: 400,
                fit: 'cover',
                quality: 90
            });
            req.body.logo = result.url;
            console.log(`✅ Logo saved: ${result.url}`);
        }

        // Process main image (if exists)
        if (req.files['image'] && req.files['image'][0]) {
            console.log('🖼️ Processing main image...');
            const result = await processImage(req.files['image'][0], {
                folder: 'images',
                prefix: 'image',
                width: 1200,
                height: 800,
                fit: 'inside',
                quality: 85
            });
            req.body.image = result.url;
            console.log(`✅ Main image saved: ${result.url}`);
        }

        // Process photo (if exists)
        if (req.files['photo'] && req.files['photo'][0]) {
            console.log('🖼️ Processing photo...');
            const result = await processImage(req.files['photo'][0], {
                folder: 'photos',
                prefix: 'photo',
                width: 500,
                height: 500,
                fit: 'cover',
                quality: 90
            });
            req.body.photo = result.url;
            console.log(`✅ Photo saved: ${result.url}`);
        }

        // Process profile image (if exists)
        if (req.files['profileImage'] && req.files['profileImage'][0]) {
            console.log('🖼️ Processing profile image...');
            const result = await processImage(req.files['profileImage'][0], {
                folder: 'profiles',
                prefix: 'profile',
                width: 300,
                height: 300,
                fit: 'cover',
                quality: 90
            });
            req.body.profileImage = result.url;
            console.log(`✅ Profile image saved: ${result.url}`);
        }

        // Process multiple profile images (if exists)
        if (req.files['profileImages'] && req.files['profileImages'].length > 0) {
            console.log(`🖼️ Processing ${req.files['profileImages'].length} profile images...`);
            req.body.profileImages = [];
            
            for (let i = 0; i < req.files['profileImages'].length; i++) {
                const file = req.files['profileImages'][i];
                const result = await processImage(file, {
                    folder: 'profiles',
                    prefix: `profile-${i + 1}`,
                    width: 800,
                    height: 600,
                    fit: 'inside',
                    quality: 80
                });
                req.body.profileImages.push(result.url);
                console.log(`✅ Profile image ${i + 1} saved: ${result.url}`);
            }
        }

        // Process multiple general images (if exists)
        if (req.files['images'] && req.files['images'].length > 0) {
            console.log(`🖼️ Processing ${req.files['images'].length} general images...`);
            req.body.images = [];
            
            for (let i = 0; i < req.files['images'].length; i++) {
                const file = req.files['images'][i];
                const result = await processImage(file, {
                    folder: 'images',
                    prefix: `img-${i + 1}`,
                    width: 1024,
                    height: 768,
                    fit: 'inside',
                    quality: 80
                });
                req.body.images.push(result.url);
                console.log(`✅ General image ${i + 1} saved: ${result.url}`);
            }
        }

        console.log('✅ All images processed successfully');
    } catch (error) {
        console.error('❌ Error in resizeImages:', error);
        throw error;
    }
};

// Delete image from local storage
const deleteImageLocally = async (imageUrl) => {
    try {
        if (!imageUrl || typeof imageUrl !== 'string') {
            console.log('⚠️ No image URL provided for deletion');
            return false;
        }

        // Convert URL to file path
        // Expected URL format: /uploads/folder/filename.ext
        const urlParts = imageUrl.split('/');
        if (urlParts.length < 4 || urlParts[1] !== 'uploads') {
            console.log(`⚠️ Invalid image URL format: ${imageUrl}`);
            return false;
        }

        const folder = urlParts[2];
        const filename = urlParts[3];
        const filePath = path.join(uploadsDir, folder, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ File not found: ${filePath}`);
            return false;
        }

        // Delete the file
        await fs.promises.unlink(filePath);
        console.log(`✅ Deleted file: ${filePath}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting image:', error);
        return false;
    }
};

// Delete multiple images
const deleteMultipleImages = async (imageUrls) => {
    try {
        if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
            return;
        }

        console.log(`🗑️ Deleting ${imageUrls.length} images...`);
        
        const deletePromises = imageUrls.map(url => deleteImageLocally(url));
        const results = await Promise.allSettled(deletePromises);
        
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.length - successful;
        
        console.log(`✅ Deleted ${successful} images, failed: ${failed}`);
    } catch (error) {
        console.error('❌ Error deleting multiple images:', error);
    }
};

// Get image information
const getImageInfo = async (imageUrl) => {
    try {
        if (!imageUrl) return null;

        const urlParts = imageUrl.split('/');
        if (urlParts.length < 4 || urlParts[1] !== 'uploads') {
            return null;
        }

        const folder = urlParts[2];
        const filename = urlParts[3];
        const filePath = path.join(uploadsDir, folder, filename);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const stats = await fs.promises.stat(filePath);
        const metadata = await sharp(filePath).metadata();

        return {
            url: imageUrl,
            path: filePath,
            size: stats.size,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            created: stats.birthtime,
            modified: stats.mtime,
            isFile: stats.isFile(),
            folder: folder
        };
    } catch (error) {
        console.error('Error getting image info:', error);
        return null;
    }
};

// Optimize existing image
const optimizeImage = async (imageUrl, options = {}) => {
    try {
        const {
            width = 800,
            height = 600,
            quality = 80,
            format = 'jpeg'
        } = options;

        const urlParts = imageUrl.split('/');
        if (urlParts.length < 4 || urlParts[1] !== 'uploads') {
            throw new Error('Invalid image URL');
        }

        const folder = urlParts[2];
        const filename = urlParts[3];
        const filePath = path.join(uploadsDir, folder, filename);

        if (!fs.existsSync(filePath)) {
            throw new Error('Image not found');
        }

        // Read and process image
        const buffer = await sharp(filePath)
            .resize(width, height, { fit: 'inside', withoutEnlargement: true })
            .toFormat(format)
            .toBuffer();

        // Save optimized version
        await fs.promises.writeFile(filePath, buffer);

        console.log(`✅ Optimized image: ${filePath}`);
        return imageUrl;
    } catch (error) {
        console.error('Error optimizing image:', error);
        throw error;
    }
};

// Upload single image (simplified version)
const uploadSingleImage = (fieldName = 'image') => {
    return multer({
        storage: multer.memoryStorage(),
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB
        }
    }).single(fieldName);
};

// Upload multiple images (simplified version)
const uploadMultipleImages = (fieldName = 'images', maxCount = 10) => {
    return multer({
        storage: multer.memoryStorage(),
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB per file
        }
    }).array(fieldName, maxCount);
};

module.exports = {
    upload,
    resizeImages,
    deleteImageLocally,
    deleteMultipleImages,
    getImageInfo,
    optimizeImage,
    processImage,
    uploadSingleImage,
    uploadMultipleImages,
    saveImageLocally
};