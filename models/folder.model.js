// models/Folder.js
const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
}, {
  timestamps: true
});

// Index for faster user queries
folderSchema.index({ user: 1 });

const Folder = mongoose.model('Folder', folderSchema);
module.exports = Folder;