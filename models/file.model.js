// models/file.model.js
const mongoose = require('mongoose');

// Optional additions if needed later
const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('File', fileSchema);