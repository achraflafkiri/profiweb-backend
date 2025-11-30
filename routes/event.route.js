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
} = require('../controllers/eventController');

// ⚠️ ORDRE TRÈS IMPORTANT !
// Les routes SPÉCIFIQUES doivent venir AVANT les routes avec paramètres dynamiques

// Public routes (no authentication needed)
router.get('/types', getAllEventTypes);  // Spécifique - doit venir en premier
router.get('/', getAllEvents);

// Protected routes (require authentication)
router.use(protect); // All routes below require authentication

// User's events - DOIT venir AVANT /:eventId
router.get('/users', getAllEventsByUser);  // ✅ Route spécifique AVANT

// Event creation and management
router.post('/', AddEvent);

// Event by ID - DOIT venir APRÈS les routes spécifiques
router.get('/:eventId', getEventById);  // ✅ Route paramétrée APRÈS
router.put('/:eventId', updateEvent);
router.delete('/:eventId', deleteEventById);

// Participation management
router.post('/:eventId/join', joinToEvent);
router.post('/:eventId/leave', leaveEvent);

// Organizer management (approval/rejection/removal)
router.post('/:eventId/approve/:userId', approveParticipant);
router.post('/:eventId/reject/:userId', rejectParticipant);
router.delete('/:eventId/participant/:userId', removeParticipant);

module.exports = router;