// models/messageModel.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required']
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For file messages
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  // For reply functionality (future feature)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isDeleted: 1 });

// Virtual for formatted creation time
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString();
});

// Don't return deleted messages in normal queries
messageSchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
});

module.exports = mongoose.model('Message', messageSchema);