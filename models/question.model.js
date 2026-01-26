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
  
  // Input type - expanded to include new types
  type: {
    type: String,
    required: true,
    enum: ['text', 'textarea', 'email', 'number', 'select', 'radio', 'checkbox', 'date', 'tel', 'url', 'multiselect'],
    default: 'text'
  },
  
  // Options for select/radio/checkbox/multiselect
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
  
  // User's answer - Mixed type to handle different data types
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
    max: Number, // For numbers
    maxLength: Number // For text/textarea fields
  }
}, {
  timestamps: true
});

// Index for faster queries
questionSchema.index({ project: 1, questionKey: 1 }, { unique: true });
questionSchema.index({ project: 1, section: 1, order: 1 });
questionSchema.index({ projectType: 1 });

// Pre-save middleware to handle array answers for multiselect/checkbox
questionSchema.pre('save', function(next) {
  // If type is checkbox/multiselect and answer is array, convert to string
  if ((this.type === 'checkbox' || this.type === 'multiselect') && Array.isArray(this.answer)) {
    this.answer = this.answer.join(', ');
  }
  
  // If answer is empty string or null, set status to pending
  if (this.answer === '' || this.answer === null || this.answer === undefined) {
    this.status = 'pending';
  } else {
    this.status = 'answered';
  }
  
  next();
});

// Method to get answer as array for multiselect/checkbox types
questionSchema.methods.getAnswerArray = function() {
  if (this.type === 'checkbox' || this.type === 'multiselect') {
    if (typeof this.answer === 'string') {
      return this.answer.split(',').map(item => item.trim()).filter(item => item);
    } else if (Array.isArray(this.answer)) {
      return this.answer;
    }
  }
  return [this.answer];
};

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

module.exports = Question;