// routes/event.route.js
const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');
const {
    AddEvent,
    updateEvent,
    getAllEvents,
    joinToEvent,
    approveParticipant,
    rejectParticipant,
    removeParticipant,
    getEventById,
    getAllEventTypes,
    leaveEvent,
    getAllEventsByUser,
    deleteEventById,
    getEventsNearLocation,
    getEventsByDistance, // ✨ NEW: Import the new function
} = require('../controllers/eventController');

// Public routes (no authentication needed)
router.get('/types', getAllEventTypes);
router.get('/nearby', getEventsNearLocation);
router.get('/distance', getEventsByDistance); // ✨ NEW: Filter by distance
router.get('/', getAllEvents);

// Protected routes (require authentication)
router.use(protect);

// User's events
router.get('/users', getAllEventsByUser);

// Event creation and management
router.post('/', AddEvent);

// Event by ID
router.get('/:eventId', getEventById);
router.put('/:eventId', updateEvent);
router.delete('/:eventId', deleteEventById);

// Participation management
router.post('/:eventId/join', joinToEvent);
router.post('/:eventId/leave', leaveEvent);

// Organizer management
router.post('/:eventId/approve/:userId', approveParticipant);
router.post('/:eventId/reject/:userId', rejectParticipant);
router.delete('/:eventId/participant/:userId', removeParticipant);

module.exports = router;