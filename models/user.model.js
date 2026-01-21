const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // BASIC INFORMATION
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters'],
    immutable: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email address'],
    immutable: true
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match'
    },
    select: false
  },

  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name must be less than 50 characters']
  },

  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name must be less than 50 characters']
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function (v) {
        return /^\+?[\d\s\-\(\)]{8,20}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },

  // ROLE SYSTEM
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'user'],
    default: 'user'
  },

  // IS DELETED
  isDeleted: {
    type: Boolean,
    default: false
  },

  // DEPARTMENT (Required for users, optional for admins)
  department: {
    type: String,
    enum: ['informations', null],
    default: null,
    validate: {
      validator: function(value) {
        // Users must have a department, admins/superadmins can be null
        if (this.role === 'user') {
          return value !== null;
        }
        return true;
      },
      message: 'Users must be assigned to a department'
    }
  },

  // MANAGED DEPARTMENTS (For admins only)
  // managedDepartments: {
  //   type: [{
  //     type: String,
  //     enum: ['integration', 'design', 'it', 'informations']
  //   }],
  //   default: [],
  //   validate: {
  //     validator: function(arr) {
  //       // Admins must manage at least one department
  //       if (this.role === 'admin') {
  //         return arr && arr.length > 0;
  //       }
  //       // Superadmins and users don't need managedDepartments
  //       return true;
  //     },
  //     message: 'Admins must manage at least one department'
  //   }
  // },

  // // PERMISSIONS
  // permissions: {
  //   type: [String],
  //   enum: [
  //     // User management
  //     'users.create',
  //     'users.read',
  //     'users.update',
  //     'users.deactivate',
      
  //     // Department access
  //     'department.integration',
  //     'department.design',
  //     'department.it', 
  //     'department.informations',
      
  //     // Content
  //     'content.create',
  //     'content.read',
  //     'content.update',
  //     'content.delete',
      
  //     // Reports
  //     'reports.view',
  //     'reports.generate',
      
  //     // System
  //     'system.settings'
  //   ],
  //   default: []
  // },

  // ACCOUNT STATUS
  isActive: {
    type: Boolean,
    default: true
  },

  lastLogin: {
    type: Date
  },

  passwordChangedAt: Date,

  failedLoginAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  lockUntil: {
    type: Date,
    select: false
  },

  // AUDIT TRAIL
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Activated By 
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Date 
  activatedAt: {
    type: Date,
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // PROFILE
  profileImage: {
    type: String,
    default: null
  },

  bio: {
    type: String,
    maxlength: [500, 'Bio must be less than 500 characters'],
    default: ''
  }

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.passwordConfirm;
      delete ret.__v;
      delete ret.failedLoginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// INDEXES
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ 'managedDepartments': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// VIRTUALS
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('departmentName').get(function () {
  if (!this.department) return 'Not Assigned';
  
  const names = {
    'integration': 'Integration Department',
    'design': 'Design Department',
    'it': 'IT Department',
    'informations': 'Information Department'
  };
  
  return names[this.department] || this.department;
});

userSchema.virtual('roleName').get(function () {
  const names = {
    'superadmin': 'Super Administrator',
    'admin': 'Administrator',
    'user': 'User'
  };
  
  return names[this.role] || this.role;
});

// PRE-SAVE MIDDLEWARE
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();

  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  
  // Set passwordChangedAt
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  
  next();
});

// INSTANCE METHODS
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;