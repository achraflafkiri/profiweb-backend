const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // Reference to project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Unique identifier for the question
  questionKey: {
    type: String,
    required: true
  },
  
  // Question text
  question: {
    type: String,
    required: true,
    trim: true
  },
  
  // Input type
  type: {
    type: String,
    required: true,
    enum: ['text', 'textarea', 'email', 'number', 'select', 'radio', 'date'],
    default: 'text'
  },
  
  // Options for select/radio
  options: [{
    value: String,
    label: String
  }],
  
  // Placeholder text
  placeholder: {
    type: String,
    default: ''
  },
  
  // Section grouping
  section: {
    type: String,
    required: true,
    default: 'general'
  },
  
  // Section display name
  sectionName: {
    type: String,
    required: true,
    default: 'General'
  },
  
  // Order within section
  order: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Required field
  isRequired: {
    type: Boolean,
    default: false
  },
  
  // User's answer
  answer: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Project type
  projectType: {
    type: String,
    default: 'wordpress'
  },
  
  // Is this a custom field?
  isCustom: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'answered'],
    default: 'pending'
  },
  
  // Additional settings
  settings: {
    rows: Number, // For textareas
    min: Number, // For numbers
    max: Number // For numbers
  }
}, {
  timestamps: true
});

// Index for faster queries
questionSchema.index({ project: 1, questionKey: 1 }, { unique: true });
questionSchema.index({ project: 1, section: 1, order: 1 });
questionSchema.index({ projectType: 1 });

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

module.exports = Question;