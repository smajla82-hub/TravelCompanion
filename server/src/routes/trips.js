import express from 'express';
import rateLimit from 'express-rate-limit';
import * as repo from '../repositories/tripRepository.js';
import * as members from '../repositories/tripMemberRepository.js';
import * as invitations from '../repositories/invitationRepository.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTripRole } from '../middleware/tripRole.js';
import { config } from '../config.js';
import { RATE_LIMIT_WINDOW_MS } from '../middleware/rateLimitWindow.js';

const router = express.Router();

// General-purpose limiter for all authenticated Trip/itinerary routes, to
// avoid unbounded request volume from a single client.
const tripsLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(tripsLimiter);
router.use(requireAuth);

function ensureExists(value, message) {
  if (!value) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }
}

router.get('/', (req, res) => {
  const trips = repo.listTrips(req.user.id);
  res.json(trips);
});

router.get('/active', (req, res) => {
  const activeTrip = repo.getActiveTrip(req.user.id);
  if (!activeTrip) {
    return res.status(404).json({ message: 'No active trip selected.' });
  }
  return res.json(activeTrip);
});

router.put('/:id/active', requireTripRole(['owner', 'editor']), (req, res) => {
  const activeTrip = repo.setActiveTrip(req.params.id, req.user.id);
  return res.json(activeTrip);
});

router.post('/', (req, res) => {
  const trip = repo.createTrip(req.body, req.user.id);
  return res.status(201).json(trip);
});

router.get('/:id', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
  const trip = repo.getTripById(req.params.id, req.user.id);
  ensureExists(trip, 'Trip not found.');
  return res.json(trip);
});

router.put('/:id', requireTripRole(['owner', 'editor']), (req, res) => {
  const trip = repo.updateTrip(req.params.id, req.body, req.user.id);
  return res.json(trip);
});

router.delete('/:id', requireTripRole(['owner']), (req, res) => {
  const deletedTrip = repo.deleteTrip(req.params.id, req.user.id);
  return res.json({ deleted: true, trip: deletedTrip });
});

router.get('/:tripId/itinerary', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
  const days = repo.listItineraryDaysForTrip(req.params.tripId);
  const items = repo.listItemsForTrip(req.params.tripId);

  const enrichedDays = days.map((day) => ({
    ...day,
    items: items.filter((item) => item.day_id === day.id),
  }));

  return res.json({ tripId: req.params.tripId, days: enrichedDays });
});

router.post('/:tripId/itinerary/days', requireTripRole(['owner', 'editor']), (req, res) => {
  const day = repo.createItineraryDay(req.params.tripId, req.body, req.user.id);
  return res.status(201).json(day);
});

router.get('/:tripId/itinerary/days/:dayId', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
  const day = repo.getDayById(req.params.tripId, req.params.dayId);
  ensureExists(day, 'Itinerary day not found.');
  const items = repo.listItemsForDay(req.params.tripId, req.params.dayId);
  return res.json({ ...day, items });
});

router.put('/:tripId/itinerary/days/:dayId', requireTripRole(['owner', 'editor']), (req, res) => {
  const day = repo.updateItineraryDay(req.params.tripId, req.params.dayId, req.body);
  return res.json(day);
});

router.delete('/:tripId/itinerary/days/:dayId', requireTripRole(['owner', 'editor']), (req, res) => {
  const deletedDay = repo.deleteItineraryDay(req.params.tripId, req.params.dayId);
  return res.json({ deleted: true, day: deletedDay });
});

router.get('/:tripId/itinerary/days/:dayId/items', requireTripRole(['owner', 'editor', 'viewer']), (req, res) => {
  const day = repo.getDayById(req.params.tripId, req.params.dayId);
  ensureExists(day, 'Itinerary day not found.');
  const items = repo.listItemsForDay(req.params.tripId, req.params.dayId);
  return res.json(items);
});

router.post('/:tripId/itinerary/days/:dayId/items', requireTripRole(['owner', 'editor']), (req, res) => {
  const item = repo.createItineraryItem(req.params.tripId, req.params.dayId, req.body);
  return res.status(201).json(item);
});

router.put('/:tripId/itinerary/days/:dayId/items/:itemId', requireTripRole(['owner', 'editor']), (req, res) => {
  const item = repo.updateItineraryItem(req.params.tripId, req.params.dayId, req.params.itemId, req.body);
  return res.json(item);
});

router.delete('/:tripId/itinerary/days/:dayId/items/:itemId', requireTripRole(['owner', 'editor']), (req, res) => {
  const deletedItem = repo.deleteItineraryItem(req.params.tripId, req.params.dayId, req.params.itemId);
  return res.json({ deleted: true, item: deletedItem });
});

router.post('/:tripId/invitations', requireTripRole(['owner']), (req, res) => {
  const email = String(req.body.email ?? '').trim();
  const role = req.body.role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'A valid email and an editor or viewer role are required.' });
  }
  const expiresAt = new Date(Date.now() + config.invitationExpiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const invitation = invitations.createInvitation(req.params.tripId, email, role, req.user.id, expiresAt);
  return res.status(201).json({ ...invitation, acceptLink: `/invitations/${invitation.token}/accept` });
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

export default router;
