// models/client.model.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true
  },
  phone: String,
  company: String,
  industry: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  contactPerson: {
    name: String,
    position: String,
    email: String,
    phone: String
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  notes: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'lead', 'prospect'],
    default: 'lead'
  },
  source: {
    type: String,
    enum: ['referral', 'website', 'social', 'ads', 'event', 'other']
  },
  // Add missing fields from your controller
  website: String,
  taxId: String,
  paymentTerms: String,
  currency: {
    type: String,
    default: 'MAD'
  },
  creditLimit: Number,
  clientCode: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

module.exports = Client;