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

  // Add index for better query performance
  eventSchema.index({ city: 1, startDate: 1, eventType: 1 });

  // Add geospatial index for location queries
  eventSchema.index({ location: '2dsphere' });

  // Keep your existing indexes
  eventSchema.index({ city: 1, startDate: 1, eventType: 1 });

  const Event = mongoose.model('Event', eventSchema);

  module.exports = Event;