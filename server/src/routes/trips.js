import express from 'express';
import * as repo from '../repositories/tripRepository.js';

const router = express.Router();

function ensureExists(value, message) {
  if (!value) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }
}

router.get('/', (_req, res) => {
  const trips = repo.listTrips();
  res.json(trips);
});

router.get('/active', (_req, res) => {
  const activeTrip = repo.getActiveTrip();
  if (!activeTrip) {
    return res.status(404).json({ message: 'No active trip selected.' });
  }
  return res.json(activeTrip);
});

router.put('/:id/active', (req, res) => {
  const activeTrip = repo.setActiveTrip(req.params.id);
  return res.json(activeTrip);
});

router.post('/', (req, res) => {
  const trip = repo.createTrip(req.body);
  return res.status(201).json(trip);
});

router.get('/:id', (req, res) => {
  const trip = repo.getTripById(req.params.id);
  ensureExists(trip, 'Trip not found.');
  return res.json(trip);
});

router.put('/:id', (req, res) => {
  const trip = repo.updateTrip(req.params.id, req.body);
  return res.json(trip);
});

router.delete('/:id', (req, res) => {
  const deletedTrip = repo.deleteTrip(req.params.id);
  return res.json({ deleted: true, trip: deletedTrip });
});

router.get('/:tripId/itinerary', (req, res) => {
  const trip = repo.getTripById(req.params.tripId);
  ensureExists(trip, 'Trip not found.');

  const days = repo.listItineraryDaysForTrip(req.params.tripId);
  const items = repo.listItemsForTrip(req.params.tripId);

  const enrichedDays = days.map((day) => ({
    ...day,
    items: items.filter((item) => item.day_id === day.id),
  }));

  return res.json({ tripId: req.params.tripId, days: enrichedDays });
});

router.post('/:tripId/itinerary/days', (req, res) => {
  const day = repo.createItineraryDay(req.params.tripId, req.body);
  return res.status(201).json(day);
});

router.get('/:tripId/itinerary/days/:dayId', (req, res) => {
  const day = repo.getDayById(req.params.tripId, req.params.dayId);
  ensureExists(day, 'Itinerary day not found.');
  const items = repo.listItemsForDay(req.params.tripId, req.params.dayId);
  return res.json({ ...day, items });
});

router.put('/:tripId/itinerary/days/:dayId', (req, res) => {
  const day = repo.updateItineraryDay(req.params.tripId, req.params.dayId, req.body);
  return res.json(day);
});

router.delete('/:tripId/itinerary/days/:dayId', (req, res) => {
  const deletedDay = repo.deleteItineraryDay(req.params.tripId, req.params.dayId);
  return res.json({ deleted: true, day: deletedDay });
});

router.get('/:tripId/itinerary/days/:dayId/items', (req, res) => {
  const day = repo.getDayById(req.params.tripId, req.params.dayId);
  ensureExists(day, 'Itinerary day not found.');
  const items = repo.listItemsForDay(req.params.tripId, req.params.dayId);
  return res.json(items);
});

router.post('/:tripId/itinerary/days/:dayId/items', (req, res) => {
  const item = repo.createItineraryItem(req.params.tripId, req.params.dayId, req.body);
  return res.status(201).json(item);
});

router.put('/:tripId/itinerary/days/:dayId/items/:itemId', (req, res) => {
  const item = repo.updateItineraryItem(req.params.tripId, req.params.dayId, req.params.itemId, req.body);
  return res.json(item);
});

router.delete('/:tripId/itinerary/days/:dayId/items/:itemId', (req, res) => {
  const deletedItem = repo.deleteItineraryItem(req.params.tripId, req.params.dayId, req.params.itemId);
  return res.json({ deleted: true, item: deletedItem });
});

export default router;
