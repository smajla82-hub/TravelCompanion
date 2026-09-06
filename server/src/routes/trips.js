import express from 'express';
import rateLimit from 'express-rate-limit';
import * as repo from '../repositories/tripRepository.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// General-purpose limiter for all authenticated Trip/itinerary routes, to
// avoid unbounded request volume from a single client.
const tripsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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

function ensureTripOwned(tripId, userId) {
  const trip = repo.getTripById(tripId, userId);
  ensureExists(trip, 'Trip not found.');
  return trip;
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

router.put('/:id/active', (req, res) => {
  const activeTrip = repo.setActiveTrip(req.params.id, req.user.id);
  return res.json(activeTrip);
});

router.post('/', (req, res) => {
  const trip = repo.createTrip(req.body, req.user.id);
  return res.status(201).json(trip);
});

router.get('/:id', (req, res) => {
  const trip = repo.getTripById(req.params.id, req.user.id);
  ensureExists(trip, 'Trip not found.');
  return res.json(trip);
});

router.put('/:id', (req, res) => {
  const trip = repo.updateTrip(req.params.id, req.body, req.user.id);
  return res.json(trip);
});

router.delete('/:id', (req, res) => {
  const deletedTrip = repo.deleteTrip(req.params.id, req.user.id);
  return res.json({ deleted: true, trip: deletedTrip });
});

router.get('/:tripId/itinerary', (req, res) => {
  ensureTripOwned(req.params.tripId, req.user.id);

  const days = repo.listItineraryDaysForTrip(req.params.tripId);
  const items = repo.listItemsForTrip(req.params.tripId);

  const enrichedDays = days.map((day) => ({
    ...day,
    items: items.filter((item) => item.day_id === day.id),
  }));

  return res.json({ tripId: req.params.tripId, days: enrichedDays });
});

router.post('/:tripId/itinerary/days', (req, res) => {
  const day = repo.createItineraryDay(req.params.tripId, req.body, req.user.id);
  return res.status(201).json(day);
});

router.get('/:tripId/itinerary/days/:dayId', (req, res) => {
  ensureTripOwned(req.params.tripId, req.user.id);
  const day = repo.getDayById(req.params.tripId, req.params.dayId);
  ensureExists(day, 'Itinerary day not found.');
  const items = repo.listItemsForDay(req.params.tripId, req.params.dayId);
  return res.json({ ...day, items });
});

router.put('/:tripId/itinerary/days/:dayId', (req, res) => {
  ensureTripOwned(req.params.tripId, req.user.id);
  const day = repo.updateItineraryDay(req.params.tripId, req.params.dayId, req.body);
  return res.json(day);
});

router.delete('/:tripId/itinerary/days/:dayId', (req, res) => {
  ensureTripOwned(req.params.tripId, req.user.id);
  const deletedDay = repo.deleteItineraryDay(req.params.tripId, req.params.dayId);
  return res.json({ deleted: true, day: deletedDay });
});

router.get('/:tripId/itinerary/days/:dayId/items', (req, res) => {
  ensureTripOwned(req.params.tripId, req.user.id);
  const day = repo.getDayById(req.params.tripId, req.params.dayId);
  ensureExists(day, 'Itinerary day not found.');
  const items = repo.listItemsForDay(req.params.tripId, req.params.dayId);
  return res.json(items);
});

router.post('/:tripId/itinerary/days/:dayId/items', (req, res) => {
  ensureTripOwned(req.params.tripId, req.user.id);
  const item = repo.createItineraryItem(req.params.tripId, req.params.dayId, req.body);
  return res.status(201).json(item);
});

router.put('/:tripId/itinerary/days/:dayId/items/:itemId', (req, res) => {
  ensureTripOwned(req.params.tripId, req.user.id);
  const item = repo.updateItineraryItem(req.params.tripId, req.params.dayId, req.params.itemId, req.body);
  return res.json(item);
});

router.delete('/:tripId/itinerary/days/:dayId/items/:itemId', (req, res) => {
  ensureTripOwned(req.params.tripId, req.user.id);
  const deletedItem = repo.deleteItineraryItem(req.params.tripId, req.params.dayId, req.params.itemId);
  return res.json({ deleted: true, item: deletedItem });
});

export default router;
