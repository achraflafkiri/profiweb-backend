// utils/cloudinary.js - Simplified for FormData uploads
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dzfq8aauj",
  api_key: "656824355495154",
  api_secret: "xFTg97f9PjtNvpv5EFdjPn-yOEo",
});

// Function to upload file path to Cloudinary
exports.uploadToCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;
    
    console.log("Uploading to Cloudinary:", filePath);
        
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'user-profiles',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    });

    console.log("Cloudinary upload result:", result.secure_url);

    // Delete the temporary file after successful upload
    try {
      await unlinkAsync(filePath);
      console.log("Temp file deleted:", filePath);
    } catch (deleteError) {
      console.error("Error deleting temp file:", deleteError);
    }
        
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    
    // Delete the temporary file if upload fails
    try {
      if (filePath && fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
        console.log("Temp file cleaned up after error:", filePath);
      }
    } catch (deleteError) {
      console.error("Error cleaning up temp file:", deleteError);
    }
    
    throw error;
  }
};

// Function to delete image from Cloudinary
exports.deleteImageFromCloudinary = async (publicId) => {
  try {
    console.log("Deleting from Cloudinary:", publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary delete result:', result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};