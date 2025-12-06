const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const Event = require("../models/eventModel");
const Notification = require("../models/notificationModel");

const AddEvent = catchAsync(async (req, res, next) => {
    const {
        title,
        description,
        activityType,
        outdoorActivity,
        indoorActivity,
        otherActivity,
        childrenAgeGroup,
        childAgeGroups,
        startDate,
        endDate,
        startTime,
        endTime,
        city,
        address,
        location, // ✨ NEW: location field
        maxParticipants,
        contactInfo,
        additionalNotes,
        eventType,
        registrationType,
        allowChildren,
        parentResponsibilities
    } = req.body;

    console.log("registrationType", registrationType);
    console.log("childAgeGroups received:", childAgeGroups);
    console.log("location received:", location); // ✨ NEW: log location

    // ✨ NEW: Validate location coordinates
    if (!location || !location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return next(new AppError('Les coordonnées de localisation sont requises. Format attendu: { coordinates: [longitude, latitude] }', 400));
    }

    const [longitude, latitude] = location.coordinates;
    
    // ✨ NEW: Validate coordinate ranges
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        return next(new AppError('Les coordonnées doivent être des nombres', 400));
    }
    
    if (longitude < -180 || longitude > 180) {
        return next(new AppError(`Longitude invalide: ${longitude}. Doit être entre -180 et 180`, 400));
    }
    
    if (latitude < -90 || latitude > 90) {
        return next(new AppError(`Latitude invalide: ${latitude}. Doit être entre -90 et 90`, 400));
    }

    // Convert string dates/times to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const startTimeObj = new Date(startTime);
    const endTimeObj = new Date(endTime);

    // Combine date and time fields properly
    const startDateTime = new Date(startDateObj);
    startDateTime.setHours(startTimeObj.getHours(), startTimeObj.getMinutes(), 0, 0);

    const endDateTime = new Date(endDateObj);
    endDateTime.setHours(endTimeObj.getHours(), endTimeObj.getMinutes(), 0, 0);

    // Determine the actual activity based on type and selection
    let finalOutdoorActivity, finalIndoorActivity;

    if (activityType === 'outdoor') {
        finalOutdoorActivity = outdoorActivity === 'other' ? otherActivity : outdoorActivity;
        finalIndoorActivity = undefined;
    } else {
        finalIndoorActivity = indoorActivity === 'other' ? otherActivity : indoorActivity;
        finalOutdoorActivity = undefined;
    }

    // Validate registration type
    if (!['open', 'approval'].includes(registrationType)) {
        return next(new AppError('Invalid registration type. Must be either "open" or "approval"', 400));
    }

    console.log("eventType: ", eventType);

    // ✨ Create new event with location
    const newEvent = await Event.create({
        title,
        description,
        activityType,
        outdoorActivity: finalOutdoorActivity,
        indoorActivity: finalIndoorActivity,
        otherActivity: (outdoorActivity === 'other' || indoorActivity === 'other') ? otherActivity : undefined,
        childrenAgeGroup,
        childAgeGroups: childAgeGroups && childAgeGroups.length > 0 ? childAgeGroups : [childrenAgeGroup],
        startDate: startDateTime,
        endDate: endDateTime,
        startTime: startTimeObj,
        endTime: endTimeObj,
        city,
        address,
        location: {
            type: 'Point',
            coordinates: [longitude, latitude] // ✨ NEW: [longitude, latitude] format for GeoJSON
        },
        maxParticipants,
        contactInfo,
        additionalNotes,
        eventType,
        registrationType,
        allowChildren: allowChildren !== undefined ? allowChildren : true,
        parentResponsibilities,
        creatorId: req.user._id,
        status: 'active'
    });

    res.status(201).json({
        success: true,
        message: 'Event created successfully!',
        data: {
            event: newEvent
        }
    });
});

const updateEvent = catchAsync(async (req, res, next) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
        return next(new AppError('Événement introuvable', 404));
    }

    // Verify the requesting user is the event creator
    if (!event.creatorId.equals(userId)) {
        return next(new AppError("Seul le créateur de l'événement peut le modifier", 403));
    }

    // Extract fields that can be updated
    const {
        title,
        description,
        activityType,
        outdoorActivity,
        indoorActivity,
        otherActivity,
        childrenAgeGroup,
        childAgeGroups,
        startDate,
        endDate,
        startTime,
        endTime,
        city,
        address,
        location, // ✨ NEW: location field
        maxParticipants,
        contactInfo,
        additionalNotes,
        eventType,
        registrationType,
        allowChildren,
        parentResponsibilities,
        status,
        imageUrl
    } = req.body;

    // Prepare update object with only provided fields
    const updateData = {};

    // Basic fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (activityType !== undefined) updateData.activityType = activityType;
    if (childrenAgeGroup !== undefined) updateData.childrenAgeGroup = childrenAgeGroup;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (additionalNotes !== undefined) updateData.additionalNotes = additionalNotes;
    if (eventType !== undefined) updateData.eventType = eventType;
    if (allowChildren !== undefined) updateData.allowChildren = allowChildren;
    if (parentResponsibilities !== undefined) updateData.parentResponsibilities = parentResponsibilities;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // ✨ NEW: Handle location update
    if (location !== undefined) {
        if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return next(new AppError('Format de coordonnées invalide. Format attendu: { coordinates: [longitude, latitude] }', 400));
        }
        
        const [longitude, latitude] = location.coordinates;
        
        if (typeof longitude !== 'number' || typeof latitude !== 'number') {
            return next(new AppError('Les coordonnées doivent être des nombres', 400));
        }
        
        if (longitude < -180 || longitude > 180) {
            return next(new AppError(`Longitude invalide: ${longitude}. Doit être entre -180 et 180`, 400));
        }
        
        if (latitude < -90 || latitude > 90) {
            return next(new AppError(`Latitude invalide: ${latitude}. Doit être entre -90 et 90`, 400));
        }
        
        updateData.location = {
            type: 'Point',
            coordinates: [longitude, latitude]
        };
    }

    // Handle activity type updates
    if (activityType !== undefined) {
        if (activityType === 'outdoor') {
            updateData.outdoorActivity = outdoorActivity === 'other' ? otherActivity : outdoorActivity;
            updateData.indoorActivity = undefined;
        } else if (activityType === 'indoor') {
            updateData.indoorActivity = indoorActivity === 'other' ? otherActivity : indoorActivity;
            updateData.outdoorActivity = undefined;
        }

        if (outdoorActivity === 'other' || indoorActivity === 'other') {
            updateData.otherActivity = otherActivity;
        } else {
            updateData.otherActivity = undefined;
        }
    }

    // Handle child age groups
    if (childAgeGroups !== undefined) {
        updateData.childAgeGroups = childAgeGroups && childAgeGroups.length > 0
            ? childAgeGroups
            : (childrenAgeGroup ? [childrenAgeGroup] : event.childAgeGroups);
    }

    // Handle dates and times
    if (startDate !== undefined || startTime !== undefined) {
        const baseStartDate = startDate ? new Date(startDate) : new Date(event.startDate);
        const baseStartTime = startTime ? new Date(startTime) : new Date(event.startTime);

        const startDateTime = new Date(baseStartDate);
        startDateTime.setHours(baseStartTime.getHours(), baseStartTime.getMinutes(), 0, 0);

        updateData.startDate = startDateTime;
        if (startTime) updateData.startTime = baseStartTime;
    }

    if (endDate !== undefined || endTime !== undefined) {
        const baseEndDate = endDate ? new Date(endDate) : new Date(event.endDate);
        const baseEndTime = endTime ? new Date(endTime) : new Date(event.endTime);

        const endDateTime = new Date(baseEndDate);
        endDateTime.setHours(baseEndTime.getHours(), baseEndTime.getMinutes(), 0, 0);

        updateData.endDate = endDateTime;
        if (endTime) updateData.endTime = baseEndTime;
    }

    // Handle maxParticipants
    if (maxParticipants !== undefined) {
        if (maxParticipants !== 'unlimited' && parseInt(maxParticipants) < event.participants.length) {
            return next(new AppError(
                `Impossible de réduire le nombre maximum de participants en dessous du nombre actuel (${event.participants.length})`,
                400
            ));
        }
        updateData.maxParticipants = maxParticipants;
    }

    // Handle registrationType
    if (registrationType !== undefined) {
        if (!['open', 'approval'].includes(registrationType)) {
            return next(new AppError('Type d\'inscription invalide. Doit être "open" ou "approval"', 400));
        }

        if (event.registrationType === 'approval' && registrationType === 'open') {
            const pendingToMove = event.pendingParticipants || [];
            const availableSpots = maxParticipants === 'unlimited'
                ? Infinity
                : parseInt(maxParticipants || event.maxParticipants) - event.participants.length;

            const toMove = pendingToMove.slice(0, availableSpots);
            updateData.participants = [...event.participants, ...toMove];
            updateData.pendingParticipants = pendingToMove.slice(availableSpots);

            for (const participantId of toMove) {
                await Notification.create({
                    recipient: participantId,
                    sender: userId,
                    event: event._id,
                    type: 'APPROVED_REQUEST_EVENT',
                    title: 'Demande automatiquement approuvée',
                    message: `Votre demande pour rejoindre ${event.title} a été automatiquement approuvée suite au changement de type d'inscription.`,
                });
            }
        }

        updateData.registrationType = registrationType;
    }

    // Handle status
    if (status !== undefined) {
        if (!['active', 'cancelled', 'completed'].includes(status)) {
            return next(new AppError('Statut invalide. Doit être "active", "cancelled" ou "completed"', 400));
        }
        updateData.status = status;

        if (status === 'cancelled') {
            const allParticipants = [...event.participants, ...event.pendingParticipants];
            for (const participantId of allParticipants) {
                await Notification.create({
                    recipient: participantId,
                    sender: userId,
                    event: event._id,
                    type: 'EVENT_CANCELLED',
                    title: 'Événement annulé',
                    message: `L'événement ${event.title} a été annulé par l'organisateur.`,
                });
            }
        }
    }

    updateData.updatedAt = new Date();

    const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $set: updateData },
        { new: true, runValidators: true }
    )
        .populate('participants', 'firstName lastName')
        .populate('pendingParticipants', 'firstName lastName')
        .populate('creatorId', 'firstName lastName');

    if (!status || status === 'active') {
        const participantsToNotify = [...event.participants];
        for (const participantId of participantsToNotify) {
            await Notification.create({
                recipient: participantId,
                sender: userId,
                event: event._id,
                type: 'EVENT_UPDATED',
                title: 'Événement mis à jour',
                message: `L'événement ${event.title} a été mis à jour par l'organisateur.`,
            });
        }
    }

    res.status(200).json({
        success: true,
        message: 'Événement mis à jour avec succès',
        data: {
            event: updatedEvent
        }
    });
});

// ✨ NEW: Get events near a location (bonus feature for future use)
const getEventsNearLocation = catchAsync(async (req, res, next) => {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters (default 10km)

    if (!longitude || !latitude) {
        return next(new AppError('Longitude et latitude sont requises', 400));
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lng) || isNaN(lat)) {
        return next(new AppError('Coordonnées invalides', 400));
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return next(new AppError('Coordonnées hors limites', 400));
    }

    // Find events near the specified location using MongoDB geospatial query
    const events = await Event.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: parseInt(maxDistance)
            }
        },
        status: 'active',
        endDate: { $gte: new Date() }
    })
    .populate('creatorId', 'firstName lastName')
    .limit(50);

    res.status(200).json({
        success: true,
        results: events.length,
        data: {
            events
        }
    });
});

// controllers/eventController.js

// ✨ NEW: Get events within a specific distance from user's location
const getEventsByDistance = catchAsync(async (req, res, next) => {
    const { longitude, latitude, distance = 5 } = req.query; // distance in km

    if (!longitude || !latitude) {
        return next(new AppError('Longitude et latitude sont requises', 400));
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const dist = parseFloat(distance);

    if (isNaN(lng) || isNaN(lat) || isNaN(dist)) {
        return next(new AppError('Coordonnées ou distance invalides', 400));
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return next(new AppError('Coordonnées hors limites', 400));
    }

    if (dist <= 0 || dist > 100) {
        return next(new AppError('Distance doit être entre 0 et 100 km', 400));
    }

    // Convert km to meters for MongoDB
    const distanceInMeters = dist * 1000;

    // Find active events near the specified location
    const events = await Event.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: distanceInMeters
            }
        },
        status: 'active',
        endDate: { $gte: new Date() }
    })
    .populate('creatorId', 'firstName lastName')
    .sort({ startDate: 1 })
    .limit(100);

    // Calculate actual distance for each event
    const eventsWithDistance = events.map(event => {
        const eventLng = event.location.coordinates[0];
        const eventLat = event.location.coordinates[1];
        
        // Haversine formula to calculate distance
        const R = 6371; // Earth radius in km
        const dLat = (eventLat - lat) * Math.PI / 180;
        const dLng = (eventLng - lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(eventLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const calculatedDistance = R * c;

        return {
            ...event.toObject(),
            distanceFromUser: Math.round(calculatedDistance * 10) / 10 // Round to 1 decimal
        };
    });

    res.status(200).json({
        success: true,
        results: eventsWithDistance.length,
        distance: dist,
        data: {
            events: eventsWithDistance
        }
    });
});

const getAllEvents = catchAsync(async (req, res, next) => {
    const now = new Date();
    
    // Récupérer tous les événements
    const allEvents = await Event.find().sort({ createdAt: -1 });
    
    // Séparer les événements actifs et archivés
    const activeEvents = allEvents.filter(event => 
        new Date(event.endDate) >= now && event.status !== 'cancelled'
    );
    
    const archivedEvents = allEvents.filter(event => 
        new Date(event.endDate) < now || event.status === 'cancelled'
    );

    res.status(200).json({
        success: true,
        data: {
            events: activeEvents,
            length: activeEvents.length,
            archivedEvents: archivedEvents,
            archivedLength: archivedEvents.length
        }
    });
});

const getAllEventsByUser = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    console.log("userId ===========> ", userId);
    
    // Get current date (start of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find events where the user is the creator or a participant
    const events = await Event.find({
        $or: [
            { creatorId: userId },
            { participants: userId }
        ]
    }).sort({ createdAt: -1 });

    // Separate events into current and archived
    const currentEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today;
    });

    const archivedEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < today;
    });

    res.status(200).json({
        success: true,
        data: {
            events: currentEvents,
            archivedEvents: archivedEvents,
            length: events.length,
            currentCount: currentEvents.length,
            archivedCount: archivedEvents.length
        }
    });
});

const joinToEvent = catchAsync(async (req, res, next) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
        return next(new AppError('Événement non trouvé', 404));
    }

    // Condition 1: User who created the event cannot join
    if (event.creatorId.equals(userId)) {
        return next(new AppError("Vous êtes l'organisateur de cet événement et ne pouvez pas y participer", 400));
    }

    // Condition 2: User who already joined cannot join again
    if (event.participants.some(participantId => participantId.equals(userId))) {
        return next(new AppError('Vous avez déjà rejoint cet événement', 400));
    }

    // Condition 3: User who requested to join cannot request again
    if (event.pendingParticipants.some(pendingId => pendingId.equals(userId))) {
        return next(new AppError('Vous avez déjà demandé à rejoindre cet événement', 400));
    }

    // Check if event is active
    if (event.status !== 'active') {
        return next(new AppError("Cet événement n'accepte pas actuellement de participants", 400));
    }

    // Check if event has reached maximum participants
    if (event.participants.length >= parseInt(event.maxParticipants)) {
        return next(new AppError("Cet événement a atteint le nombre maximum de participants", 400));
    }

    // Condition 4: Handle open registration type
    if (event.registrationType === 'open') {
        // Directly add to participants
        event.participants.push(userId);
        await event.save();

        return res.status(200).json({
            success: true,
            message: "Vous avez rejoint l'événement avec succès!",
            data: { event }
        });
    }
    // Condition 5: Handle approval registration type
    else if (event.registrationType === 'approval') {
        // Add to pending participants
        event.pendingParticipants.push(userId);
        await event.save();

        // Send notification to participant
        await Notification.create({
            recipient: event.creatorId,
            sender: userId,
            event: event._id,
            type: 'JOIN_REQUEST_EVENT',
            title: 'Demande de participation',
            message: `Vous avez demandé à rejoindre ${event.title}. En attente de l'approbation de l'organisateur.`
        })

        return res.status(200).json({
            success: true,
            message: "Demande de participation envoyée. En attente de validation par l'organisateur.",
            data: { event }
        });
    } else {
        return next(new AppError("Type d'inscription invalide pour cet événement", 400));
    }
});

const approveParticipant = catchAsync(async (req, res, next) => {
    const { eventId, userId } = req.params;
    const organizerId = req.user._id;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
        return next(new AppError('Event not found', 404));
    }

    // Verify the requesting user is the event organizer
    if (!event.creatorId.equals(organizerId)) {
        return next(new AppError("Seul l'organisateur de l'événement peut approuver les participants.", 403));
    }

    // Check if user is in pending participants
    const pendingIndex = event.pendingParticipants.findIndex(id => id.equals(userId));
    if (pendingIndex === -1) {
        return next(new AppError("L'utilisateur n'a pas demandé à rejoindre cet événement.", 400));
    }

    // Check if event has reached maximum participants
    if (event.participants.length >= parseInt(event.maxParticipants)) {
        return next(new AppError('Cet événement a atteint le nombre maximum de participants.', 400));
    }

    // Move from pending to participants
    event.pendingParticipants.splice(pendingIndex, 1);
    event.participants.push(userId);
    await event.save();

    // Send notification to participant
    await Notification.create({
        recipient: userId,
        sender: organizerId,
        event: event._id,
        type: 'APPROVED_REQUEST_EVENT',
        title: 'Demande d\'adhésion approuvée',
        message: `Votre demande pour rejoindre ${event.title} a été approuvée.`,
    })

    res.status(200).json({
        success: true,
        message: 'Participant approuvé avec succès',
        data: { event }
    });
});

const rejectParticipant = catchAsync(async (req, res, next) => {
    const { eventId, userId } = req.params;
    const organizerId = req.user._id;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
        return next(new AppError('Événement introuvable', 404));
    }

    // Verify the requesting user is the event organizer
    if (!event.creatorId.equals(organizerId)) {
        return next(new AppError(`Seul l'organisateur de l'événement peut refuser des participants`, 403));
    }

    // Check if user is in pending participants
    const pendingIndex = event.pendingParticipants.findIndex(id => id.equals(userId));
    if (pendingIndex === -1) {
        return next(new AppError("L'utilisateur n'a pas demandé à rejoindre cet événement.", 400));
    }

    // Remove from pending
    event.pendingParticipants.splice(pendingIndex, 1);
    await event.save();

    // Send notification to participant
    await Notification.create({
        recipient: userId,
        sender: organizerId,
        event: event._id,
        type: 'REJECTED_REQUEST_EVENT',
        title: 'Demande d\'adhésion refusée',
        message: `Votre demande pour rejoindre ${event.title} a été refusée.`,
    })

    res.status(200).json({
        success: true,
        message: 'Demande de participation rejetée',
        data: { event }
    });
});

const removeParticipant = catchAsync(async (req, res, next) => {
    const { eventId, userId } = req.params;
    const organizerId = req.user._id;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
        return next(new AppError('Événement introuvable', 404));
    }

    // Verify the requesting user is the event organizer
    if (!event.creatorId.equals(organizerId)) {
        return next(new AppError(`Seul l'organisateur peut supprimer des participants`, 403));
    }

    // Check if user is a participant
    const participantIndex = event.participants.findIndex(id => id.equals(userId));
    if (participantIndex === -1) {
        return next(new AppError("L'utilisateur n'est pas participant à cet événement", 400));
    }

    // Remove from participants
    event.participants.splice(participantIndex, 1);
    await event.save();

    res.status(200).json({
        success: true,
        message: 'Participant supprimé avec succès.',
        data: { event }
    });
});

const getEventById = catchAsync(async (req, res, next) => {
    try {
        const { eventId } = req.params;

        console.log("events: ", eventId);

        // Find the event by ID
        const event = await Event.findById(eventId)
            .populate('participants', 'firstName lastName')
            .populate('pendingParticipants', 'firstName lastName')
            .populate("creatorId", 'firstName lastName')

        if (!event) {
            return next(new AppError('Événement introuvable.', 404));
        }

        res.status(200).json({
            success: true,
            data: {
                event
            }
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});

const getAllEventTypes = catchAsync(async (req, res, next) => {
    try {
        const eventTypes = await Event.distinct('eventType');

        res.status(200).json({
            success: true,
            data: {
                eventTypes
            }
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});

const leaveEvent = catchAsync(async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const userId = req.user._id;

        // Find the event
        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError('Événement introuvable.', 404));
        }

        // Check if user is a participant   
        const participantIndex = event.participants.findIndex(id => id.equals(userId));
        if (participantIndex === -1) {
            return next(new AppError('Cet utilisateur ne participe pas à cet événement', 400));
        }

        // Remove from participants
        event.participants.splice(participantIndex, 1);
        await event.save();

        res.status(200).json({
            success: true,
            message: 'Vous avez quitté l\'événement avec succès.',
            data: { event }
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

const deleteEventById = catchAsync(async (req, res, next) => {
    try {
        console.log("Am here ===> ");

        const deletedEvent = await Event.deleteOne({ _id: req.params.eventId });

        if (deletedEvent.deletedCount === 0) {
            return next(new AppError('Événement introuvable', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Événement supprimé avec succès.',
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = {
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
    getEventsByDistance
};