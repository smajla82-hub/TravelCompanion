import express from 'express';
import rateLimit from 'express-rate-limit';
import * as repo from '../repositories/tripRepository.js';
import * as members from '../repositories/tripMemberRepository.js';
import * as invitations from '../repositories/invitationRepository.js';
import * as locks from '../repositories/tripLockRepository.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTripRole } from '../middleware/tripRole.js';
import { requireActiveLock } from '../middleware/tripLock.js';
import { config } from '../config.js';
import { RATE_LIMIT_WINDOW_MS } from '../middleware/rateLimitWindow.js';

function ensureExists(value, message) {
  if (!value) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }
}

function isValidEmail(email) {
  if (email.length > 254 || /\s/.test(email)) {
    return false;
  }
  const [local, domain, extra] = email.split('@');
  return Boolean(local && domain && !extra && domain.includes('.'));
}

function lockExpiry() {
  return new Date(Date.now() + config.tripLockTtlMs).toISOString();
}

function currentTrip(req) {
  return repo.getTripById(req.params.tripId ?? req.params.id, req.user.id);
}

function currentDay(req) {
  return repo.getDayById(req.params.tripId, req.params.dayId);
}

function currentItem(req) {
  return repo.getItemById(req.params.tripId, req.params.itemId);
}

function currentVenue(req) {
  return repo.getVenueById(req.params.tripId, req.params.venueId);
}

function currentParking(req) {
  return repo.getParkingLocationById(req.params.tripId, req.params.parkingId);
}

export function createTripRoutes() {
  const router = express.Router();

  // General-purpose limiter for all authenticated Trip/itinerary routes, to
  // avoid unbounded request volume from a single client.
  const tripsLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    // JSON so clients can surface the real reason instead of a generic failure.
    message: { error: 'Too many trip requests. Please wait a moment and try again.' },
  });

  router.use(tripsLimiter);
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const trips = repo.listTrips(req.user.id);
    res.json(trips);
  });

  router.get('/active', (req, res) => {
    const activeTrip = repo.getActiveTrip(req.user.id);
    if (!activeTrip) {
      return res.status(404).json({ error: 'No active trip selected.' });
    }
    return res.json(activeTrip);
  });

  router.put('/:id/active', requireTripRole(['owner', 'editor']), requireActiveLock(currentTrip), (req, res) => {
    const activeTrip = repo.setActiveTrip(req.params.id, req.user.id);
    return res.json(activeTrip);
  });

  router.post('/', (req, res) => {
    const trip = repo.createTrip(req.body, req.user.id);
    return res.status(201).json(trip);
  });

  router.get('/:id/lock', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
    const lock = locks.getActiveLock(req.params.id);
    return res.json(lock
      ? { locked: true, tripId: lock.tripId, userId: lock.userId, email: lock.email, displayName: lock.displayName, acquiredAt: lock.acquiredAt, expiresAt: lock.expiresAt }
      : { locked: false });
  });

  router.post('/:id/lock', requireTripRole(['owner', 'editor']), (req, res) => {
    const now = new Date().toISOString();
    const result = locks.acquireLock(req.params.id, req.user.id, now, lockExpiry());
    if (!result.acquired) {
      return res.status(409).json({
        error: 'Trip is currently being edited by another user.',
        lockedBy: { userId: result.lock.userId, email: result.lock.email, displayName: result.lock.displayName },
        expiresAt: result.lock.expiresAt,
      });
    }
    const { lock } = result;
    return res.json({ tripId: lock.tripId, userId: lock.userId, acquiredAt: lock.acquiredAt, expiresAt: lock.expiresAt });
  });

  router.put('/:id/lock/heartbeat', requireTripRole(['owner', 'editor']), (req, res) => {
    const lock = locks.heartbeatLock(req.params.id, req.user.id, new Date().toISOString(), lockExpiry());
    if (!lock) {
      return res.status(409).json({ error: 'You do not hold an active lock for this trip.' });
    }
    return res.json({ tripId: lock.tripId, userId: lock.userId, acquiredAt: lock.acquiredAt, expiresAt: lock.expiresAt });
  });

  router.delete('/:id/lock', requireTripRole(['owner', 'editor']), (req, res) => {
    const lock = locks.releaseLock(req.params.id, req.user.id, req.tripMember.role === 'owner');
    if (!lock) {
      return res.status(409).json({ error: 'You do not hold an active lock for this trip.' });
    }
    return res.json({ released: true, tripId: lock.tripId });
  });

  router.get('/:id', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
    const trip = repo.getTripById(req.params.id, req.user.id);
    ensureExists(trip, 'Trip not found.');
    return res.json(trip);
  });

  router.put('/:id', requireTripRole(['owner', 'editor']), requireActiveLock(currentTrip), (req, res) => {
    const trip = repo.updateTrip(req.params.id, req.body, req.user.id);
    return res.json(trip);
  });

  router.delete('/:id', requireTripRole(['owner']), (req, res) => {
    const deletedTrip = repo.deleteTrip(req.params.id, req.user.id);
    return res.json({ deleted: true, trip: deletedTrip });
  });

  router.get('/:tripId/itinerary', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
    return res.json(repo.getItinerary(req.params.tripId));
  });

  // Atomic full itinerary replacement, used by the RoadBook import so that a
  // whole imported itinerary is persisted (or rejected) in a single request.
  router.put('/:tripId/itinerary', requireTripRole(['owner', 'editor']), requireActiveLock(currentTrip), (req, res) => {
    const itinerary = repo.replaceItinerary(req.params.tripId, req.body?.days, req.user.id);
    return res.json(itinerary);
  });

  router.post('/:tripId/itinerary/days', requireTripRole(['owner', 'editor']), requireActiveLock(currentTrip), (req, res) => {
    const day = repo.createItineraryDay(req.params.tripId, req.body, req.user.id);
    repo.touchTrip(req.params.tripId);
    return res.status(201).json(day);
  });

  router.get('/:tripId/itinerary/days/:dayId', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
    const day = repo.getDayById(req.params.tripId, req.params.dayId);
    ensureExists(day, 'Itinerary day not found.');
    const items = repo.listItemsForDay(req.params.tripId, req.params.dayId);
    return res.json({ ...day, items });
  });

  router.put('/:tripId/itinerary/days/:dayId', requireTripRole(['owner', 'editor']), requireActiveLock(currentDay), (req, res) => {
    const day = repo.updateItineraryDay(req.params.tripId, req.params.dayId, req.body);
    repo.touchTrip(req.params.tripId);
    return res.json(day);
  });

  router.delete('/:tripId/itinerary/days/:dayId', requireTripRole(['owner', 'editor']), requireActiveLock(currentDay), (req, res) => {
    const deletedDay = repo.deleteItineraryDay(req.params.tripId, req.params.dayId);
    repo.touchTrip(req.params.tripId);
    return res.json({ deleted: true, day: deletedDay });
  });

  router.get('/:tripId/itinerary/days/:dayId/items', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
    const day = repo.getDayById(req.params.tripId, req.params.dayId);
    ensureExists(day, 'Itinerary day not found.');
    const items = repo.listItemsForDay(req.params.tripId, req.params.dayId);
    return res.json(items);
  });

  router.post('/:tripId/itinerary/days/:dayId/items', requireTripRole(['owner', 'editor']), requireActiveLock(currentDay), (req, res) => {
    const item = repo.createItineraryItem(req.params.tripId, req.params.dayId, req.body);
    repo.touchTrip(req.params.tripId);
    return res.status(201).json(item);
  });

  router.put('/:tripId/itinerary/days/:dayId/items/:itemId', requireTripRole(['owner', 'editor']), requireActiveLock(currentItem), (req, res) => {
    const item = repo.updateItineraryItem(req.params.tripId, req.params.dayId, req.params.itemId, req.body);
    repo.touchTrip(req.params.tripId);
    return res.json(item);
  });

  router.delete('/:tripId/itinerary/days/:dayId/items/:itemId', requireTripRole(['owner', 'editor']), requireActiveLock(currentItem), (req, res) => {
    const deletedItem = repo.deleteItineraryItem(req.params.tripId, req.params.dayId, req.params.itemId);
    repo.touchTrip(req.params.tripId);
    return res.json({ deleted: true, item: deletedItem });
  });

  router.post('/:tripId/itinerary/days/:dayId/venues', requireTripRole(['owner', 'editor']), requireActiveLock(currentDay), (req, res) => {
    const venue = repo.createVenue(req.params.tripId, req.params.dayId, req.body);
    repo.touchTrip(req.params.tripId);
    return res.status(201).json(venue);
  });

  router.put('/:tripId/itinerary/days/:dayId/venues/:venueId', requireTripRole(['owner', 'editor']), requireActiveLock(currentVenue), (req, res) => {
    const venue = repo.updateVenue(req.params.tripId, req.params.dayId, req.params.venueId, req.body);
    repo.touchTrip(req.params.tripId);
    return res.json(venue);
  });

  router.delete('/:tripId/itinerary/days/:dayId/venues/:venueId', requireTripRole(['owner', 'editor']), requireActiveLock(currentVenue), (req, res) => {
    const deletedVenue = repo.deleteVenue(req.params.tripId, req.params.dayId, req.params.venueId);
    repo.touchTrip(req.params.tripId);
    return res.json({ deleted: true, venue: deletedVenue });
  });

  router.post('/:tripId/itinerary/days/:dayId/parking', requireTripRole(['owner', 'editor']), requireActiveLock(currentDay), (req, res) => {
    const parking = repo.createParkingLocation(req.params.tripId, req.params.dayId, req.body);
    repo.touchTrip(req.params.tripId);
    return res.status(201).json(parking);
  });

  router.put('/:tripId/itinerary/days/:dayId/parking/:parkingId', requireTripRole(['owner', 'editor']), requireActiveLock(currentParking), (req, res) => {
    const parking = repo.updateParkingLocation(req.params.tripId, req.params.dayId, req.params.parkingId, req.body);
    repo.touchTrip(req.params.tripId);
    return res.json(parking);
  });

  router.delete('/:tripId/itinerary/days/:dayId/parking/:parkingId', requireTripRole(['owner', 'editor']), requireActiveLock(currentParking), (req, res, next) => {
    try {
      const deletedParking = repo.deleteParkingLocation(
        req.params.tripId,
        req.params.dayId,
        req.params.parkingId,
      );
      repo.touchTrip(req.params.tripId);
      return res.json({ deleted: true, parking: deletedParking });
    } catch (error) {
      if (error.referencingItems) {
        return res.status(error.statusCode ?? 409).json({
          error: error.message,
          referencingItems: error.referencingItems,
        });
      }
      return next(error);
    }
  });

  router.post('/:tripId/invitations', requireTripRole(['owner']), (req, res) => {
    const email = String(req.body.email ?? '').trim();
    const role = req.body.role;
    if (!isValidEmail(email) || !['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'A valid email and an editor or viewer role are required.' });
    }
    const expiresAt = new Date(Date.now() + config.invitationExpiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const invitation = invitations.createInvitation(req.params.tripId, email, role, req.user.id, expiresAt);
    return res.status(201).json({ ...invitation, acceptLink: `/accept-invite/${invitation.token}` });
  });

  router.get('/:tripId/invitations', requireTripRole(['owner']), (req, res) => {
    res.json(invitations.listInvitations(req.params.tripId));
  });

  router.delete('/:tripId/invitations/:invitationId', requireTripRole(['owner']), (req, res) => {
    const invitation = invitations.revokeInvitation(req.params.tripId, req.params.invitationId);
    if (!invitation) {
      return res.status(400).json({ error: 'Only pending invitations can be revoked.' });
    }
    return res.json(invitation);
  });

  router.get('/:tripId/members', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
    res.json(members.listTripMembers(req.params.tripId));
  });

  router.put('/:tripId/members/:userId', requireTripRole(['owner']), (req, res) => {
    const role = req.body.role;
    const member = members.getTripMember(req.params.tripId, req.params.userId);
    if (!member) {
      return res.status(404).json({ error: 'Trip member not found.' });
    }
    if (member.role === 'owner' || !['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Only non-owner members can be changed to editor or viewer.' });
    }
    return res.json(members.updateTripMemberRole(req.params.tripId, req.params.userId, role));
  });

  router.delete('/:tripId/members/:userId', requireTripRole(['owner']), (req, res) => {
    const member = members.getTripMember(req.params.tripId, req.params.userId);
    if (!member) {
      return res.status(404).json({ error: 'Trip member not found.' });
    }
    if (member.role === 'owner') {
      return res.status(400).json({ error: 'The trip owner cannot be removed.' });
    }
    return res.json({ deleted: true, member: members.removeTripMember(req.params.tripId, req.params.userId) });
  });

  return router;
}
