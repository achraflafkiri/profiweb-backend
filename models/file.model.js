// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  // File storage info
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  
  // Relationships
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
fileSchema.index({ user: 1 });
fileSchema.index({ folder: 1 });
fileSchema.index({ user: 1, folder: 1 }); // For queries like "user's files in folder X"

const File = mongoose.model('File', fileSchema);
module.exports = File;