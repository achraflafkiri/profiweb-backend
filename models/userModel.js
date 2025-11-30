const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Authentication fields
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [30, 'Le nom d\'utilisateur doit contenir moins de 30 caractères']
  },

  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer une adresse email valide']
  },

  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },

  bio: {
    type: String,
    default: "",
  },

  // Add this field to track password changes
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },

  // Personal Information
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    maxlength: [50, 'Le prénom doit contenir moins de 50 caractères']
  },

  lastName: {
    type: String,
    required: [true, 'Le nom de famille est requis'],
    trim: true,
    maxlength: [50, 'Le nom de famille doit contenir moins de 50 caractères']
  },

  phone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    trim: true,
    // match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },

  // Profile photo/avatar (optional)
  photo: {
    type: String, // URL or base64 string
    default: null
  },

  // Age
  age: {
    type: Number,
    required: [true, 'L\'âge est requis'],
    min: [18, 'L\'utilisateur doit avoir au moins 18 ans'],
    max: [120, 'L\'âge doit être réaliste']
  },

  // Status
  status: {
    type: String,
    required: [true, 'Le statut est requis'],
    enum: {
      values: ['célibataire', 'en couple', 'divorcée'],
      message: 'Le statut doit être "célibataire", "en couple" ou "divorcée"'
    }
  },

  // Profession
  profession: {
    type: String,
    trim: true,
    maxlength: [100, 'La profession doit contenir moins de 100 caractères']
  },

  // Hobbies/Preferred activities - using icons/pictos
  hobbies: [{
    type: String,
    // enum: ['jardinage', 'bricolage', 'sport', 'voyage', 'lecture', 'cuisine', 'musique', 'art']
  }],

  // Children information
  children: {
    type: Number,
    required: [true, 'Le nombre d\'enfants est requis'],
    min: [0, 'Le nombre d\'enfants ne peut pas être négatif'],
    max: [20, 'Le nombre d\'enfants doit être réaliste'],
    default: 0
  },

  childrenAges: [{
    type: String,
    enum: ['0-6', '7-11', '12-15', '16-18', '18+']
  }],

  // Custody mode
  custody: {
    type: String,
    enum: {
      values: ['classique', '1week-end sur deux', 'alternée', 'autre'],
      message: 'Le mode de garde doit être "classique", "1week-end sur deux", "alternée" ou "autre"'
    },
    default: 'classique'
  },

  // Additional custody details when "autre" is selected
  custodyDetails: {
    type: String,
    trim: true,
    maxlength: [200, 'Les détails de garde doivent contenir moins de 200 caractères'],
    required: function () { return this.custody === 'autre'; }
  },

  // Community conduct agreement
  conductAgreement: {
    type: Boolean,
    required: [true, 'L\'accord de conduite communautaire est requis'],
    default: true
  },

  // User Role
  role: {
    type: String,
    enum: {
      values: ['parent', 'admin'],
      message: 'Le rôle doit être "parent" ou "admin"'
    },
    default: 'parent'
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  lastLogin: {
    type: Date,
    default: Date.now
  },

  isPublic: {
    type: Boolean,
    default: true // Default to public profile
  },

  // Location
  latitude: {
    type: Number,
    default: null // or a default valu
  },
  longitude: {
    type: Number,
    default: null // or a default valu
  },

  // Verification Code
  verificationCode: {
    type: String,
    default: undefined
  },
  verificationCodeExpires: {
    type: Date,
    default: undefined
  },

  // Locations
  city: {
    type: String,
    default: null
  },

  country: {
    type: String,
    default: null
  },
  
  locationSource: {
    type: String,
    default: null
  },

  locationUpdatedAt: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      // Remove password from JSON output
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;

    // Set passwordChangedAt to current time when password is modified
    // But not for new documents (isNew)
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure JWT is created after password change
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to validate children ages array
userSchema.pre('save', function (next) {
  if (this.children > 0 && (!this.childrenAges || this.childrenAges.length !== this.children)) {
    return next(new Error('Number of children ages must match number of children'));
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }

  // False means password was not changed after JWT was issued
  return false;
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function (emailOrUsername) {
  return this.findOne({
    $or: [
      { email: emailOrUsername },
      { username: emailOrUsername }
    ]
  });
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;