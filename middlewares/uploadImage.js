const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');
const { s3 } = require('../config/s3.config');

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new AppError(400, "Images must be in JPEG or PNG format"));
        }
    },
    limits: {
        fields: 30,
        fileSize: 5 * 1024 * 1024
    }
}).fields([
    { name: 'logo', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'profileImages' }
]);

const uploadToS3 = async (buffer, filename) => {
    try {
        const params = {
            Bucket: "resact-1",
            Key: filename,
            Body: buffer,
            ContentType: 'image/jpeg',
            // ACL: 'public-read'
        };

        const result = await s3.upload(params).promise();
        return result.Location;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
};

const resizeImages = async (req) => {
    if (req.files && req.files['logo'] && req.files['logo'][0]) {
        const buffer = await sharp(req.files['logo'][0].buffer)
            .resize(400, 400)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer();
            
        const filename = `logo-${uuidv4()}.jpeg`;
        const imageUrl = await uploadToS3(buffer, filename);
        req.body.logo = imageUrl;
    }

    if (req.files && req.files['image'] && req.files['image'][0]) {
        const buffer = await sharp(req.files['image'][0].buffer)
            .resize(100, 600)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer();
            
        const filename = `image-${uuidv4()}.jpeg`;
        const imageUrl = await uploadToS3(buffer, filename);
        req.body.image = imageUrl;
    }

    if (req.files && req.files['photo'] && req.files['photo'][0]) {
        const buffer = await sharp(req.files['photo'][0].buffer)
            .resize(400, 400)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer();
        
        const filename = `photo-${uuidv4()}.jpeg`;
        const imageUrl = await uploadToS3(buffer, filename);
        req.body.photo = imageUrl;
    }

    if (req.files['profileImages'] && req.files['profileImages'].length > 0) {
        req.body.profileImages = [];
        for (const file of req.files['profileImages']) {
            const buffer = await sharp(file.buffer)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toBuffer();

            const filename = `profileImages-${uuidv4()}.jpeg`;
            const imageUrl = await uploadToS3(buffer, filename);
            req.body.profileImages.push(imageUrl);
        }
    }
};

// Helper function to delete image from S3
const deleteFromS3 = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('resact-1.s3')) return;
    
    const key = imageUrl.split('/').pop(); // Get filename from URL
    const params = {
        Bucket: "resact-1",
        Key: key
    };

    await s3.deleteObject(params).promise();
};

module.exports = { resizeImages, upload, deleteFromS3, uploadToS3 };