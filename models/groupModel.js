const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [50, 'Group name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    default: 'account-group'
  },
  iconColor: {
    type: String,
    required: true,
    default: '#E85A4F'
  },
  rules: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  pendingMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
});

// Update the updatedAt field before saving
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Group', groupSchema);