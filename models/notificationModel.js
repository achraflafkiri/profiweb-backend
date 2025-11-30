const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Sender/initiator of the action
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Related group (if applicable)
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },

  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },

  // Notification type (predefined types)
  type: {
    type: String,
    required: true,
    enum: [
      // Group
      'JOIN_REQUEST_GROUP',
      'APPROVED_REQUEST_GROUP',
      'REFUSE_REQUEST_GROUP',
      'USER_JOINED_GROUP',
      
      // Event
      'JOIN_REQUEST_EVENT',
      'APPROVED_REQUEST_EVENT',
      'REJECTED_REQUEST_EVENT',
    ]
  },

  // Notification content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },

  // Additional metadata
  metadata: {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }
  },

  // Read status
  isRead: {
    type: Boolean,
    default: false
  },

  // Action status (for join requests, etc.)
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
notificationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);