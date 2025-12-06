// models/eventModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  activityType: { type: String, enum: ['outdoor', 'indoor'], required: true },
  outdoorActivity: String,
  indoorActivity: String,
  otherActivity: String,
  childrenAgeGroup: { type: String, required: true },
  childAgeGroups: [{ type: String }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  city: { type: String, required: true },
  address: String,
  
  // ✨ NEW: Location field with GeoJSON format for MongoDB geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(value) {
          // Ensure we have exactly 2 coordinates
          if (!Array.isArray(value) || value.length !== 2) return false;
          
          const [longitude, latitude] = value;
          
          // Validate longitude: -180 to 180
          if (longitude < -180 || longitude > 180) return false;
          
          // Validate latitude: -90 to 90
          if (latitude < -90 || latitude > 90) return false;
          
          return true;
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges: longitude (-180 to 180), latitude (-90 to 90)'
      }
    }
  },
  
  maxParticipants: { type: String, required: true },
  contactInfo: String,
  additionalNotes: String,
  eventType: { type: String, required: true },
  registrationType: { type: String, enum: ['open', 'approval'], required: true },
  allowChildren: { type: Boolean, default: true },
  parentResponsibilities: String,
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  pendingParticipants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✨ CRITICAL: 2dsphere index for geospatial queries (find events near a location)
eventSchema.index({ location: '2dsphere' });

// Compound index for better query performance
eventSchema.index({ city: 1, startDate: 1, eventType: 1 });

// Index for status queries
eventSchema.index({ status: 1, endDate: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;