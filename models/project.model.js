// models/project.model.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  // Client Information
  client: {
    name: {
      type: String,
      required: [true, 'Client name is required']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    contactPerson: {
      name: String,
      email: String,
      phone: String
    }
  },
  
  // Project Details
  category: {
    type: String,
    required: true,
    enum: [
      'Web Development',
      'Mobile App Development',
      'E-commerce Development',
      'UI/UX Design',
      'Digital Marketing',
      'SEO Services',
      'Social Media Marketing',
      'Branding',
      'Content Creation',
      'Video Production',
      'Custom Software',
      'Cyber Security',
      'IT Consulting',
      'Other'
    ]
  },
  
  subcategory: String,
  
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Status & Timeline
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled', 'archived'],
    default: 'planning'
  },
  
  priority: {
    type: String,
    enum: ['standard', 'express', '24-hours'],
    default: 'standard'
  },
  
  startDate: {
    type: Date,
    required: true
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  actualStartDate: Date,
  actualEndDate: Date,
  
  // Financial Information
  budget: {
    type: Number,
    required: [true, 'Project budget is required'],
    min: [0, 'Budget cannot be negative']
  },
  
  currency: {
    type: String,
    default: 'MAD',
    enum: ['MAD', 'EUR']
  },
  
  cost: {
    estimated: Number,
    actual: Number,
    expenses: [{
      description: String,
      amount: Number,
      date: Date,
      category: String
    }]
  },
  
  // Team & Assignments
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Progress Tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPublic: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for project duration in days
projectSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for overdue status
projectSchema.virtual('isOverdue').get(function() {
  if (this.endDate && new Date() > this.endDate && this.status !== 'completed') {
    return true;
  }
  return false;
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (this.endDate) {
    const diffTime = this.endDate - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Middleware to generate slug
projectSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Indexes for better query performance
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });
projectSchema.index({ status: 1, priority: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

module.exports = Project;