import { randomUUID } from 'node:crypto';
import { getDb } from '../db/db.js';

const db = getDb();

function mapTripRow(row) {
  if (!row) {
    return null;
  }

  const mapped = {
    ...row,
    startDate: row.start_date,
    endDate: row.end_date,
    coverImage: row.cover_image,
    isActive: Boolean(row.is_active),
  };

  delete mapped.start_date;
  delete mapped.end_date;
  delete mapped.cover_image;
  delete mapped.is_active;

  return mapped;
}

function mapDayRow(row) {
  if (!row) {
    return null;
  }

  const mapped = {
    ...row,
    tripId: row.trip_id,
  };

  delete mapped.trip_id;
  return mapped;
}

function mapItemRow(row) {
  if (!row) {
    return null;
  }

  const mapped = {
    ...row,
    tripId: row.trip_id,
    dayId: row.day_id,
    activityType: row.activity_type,
    smartChip: row.smart_chip,
    mapLink: row.map_link,
    sortOrder: row.sort_order,
  };

  delete mapped.trip_id;
  delete mapped.day_id;
  delete mapped.activity_type;
  delete mapped.smart_chip;
  delete mapped.map_link;
  delete mapped.sort_order;

  return mapped;
}

function normalizeTripPayload(payload = {}) {
  return {
    name: String(payload.name ?? '').trim(),
    destination: String(payload.destination ?? '').trim(),
    country: String(payload.country ?? '').trim(),
    startDate: payload.startDate ?? payload.start_date ?? '',
    endDate: payload.endDate ?? payload.end_date ?? '',
    travellers: Number(payload.travellers ?? 1),
    coverImage: payload.coverImage ?? payload.cover_image ?? null,
    status: payload.status ?? 'planning',
    isActive: Number(Boolean(payload.isActive ?? payload.is_active ?? false)),
  };
}

function normalizeItineraryDayPayload(payload = {}) {
  return {
    date: payload.date ?? '',
    title: String(payload.title ?? '').trim(),
  };
}

function normalizeItineraryItemPayload(payload = {}) {
  return {
    date: payload.date ?? '',
    time: payload.time ?? null,
    title: String(payload.title ?? '').trim(),
    location: payload.location ?? null,
    description: payload.description ?? null,
    goal: payload.goal ?? null,
    activityType: payload.activityType ?? payload.activity_type ?? null,
    priority: payload.priority ?? null,
    parking: payload.parking ?? null,
    smartChip: payload.smartChip ?? payload.smart_chip ?? null,
    mapLink: payload.mapLink ?? payload.map_link ?? null,
    price: payload.price ?? null,
    note: payload.note ?? null,
    sortOrder: Number(payload.sortOrder ?? payload.sort_order ?? 0),
  };
}

export function listTrips() {
  return db.prepare('SELECT * FROM trips ORDER BY updated_at DESC').all().map(mapTripRow);
}

export function getTripById(tripId) {
  return mapTripRow(db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId));
}

export function getActiveTrip() {
  return mapTripRow(db.prepare('SELECT * FROM trips WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1').get());
}

export function createTrip(payload = {}) {
  const data = normalizeTripPayload(payload);
  if (!data.name || !data.startDate || !data.endDate) {
    const error = new Error('Trip name, startDate and endDate are required.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const tripId = randomUUID();

  db.prepare(
    `INSERT INTO trips (id, name, destination, country, start_date, end_date, travellers, cover_image, status, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    tripId,
    data.name,
    data.destination,
    data.country,
    data.startDate,
    data.endDate,
    data.travellers,
    data.coverImage,
    data.status,
    data.isActive,
    now,
    now,
  );

  return getTripById(tripId);
}

export function updateTrip(tripId, payload = {}) {
  const existing = getTripById(tripId);
  if (!existing) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  const data = normalizeTripPayload({ ...existing, ...payload });
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE trips
     SET name = ?, destination = ?, country = ?, start_date = ?, end_date = ?, travellers = ?, cover_image = ?, status = ?, is_active = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    data.name,
    data.destination,
    data.country,
    data.startDate,
    data.endDate,
    data.travellers,
    data.coverImage,
    data.status,
    data.isActive,
    now,
    tripId,
  );

  return getTripById(tripId);
}

export function deleteTrip(tripId) {
  const existing = getTripById(tripId);
  if (!existing) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);
  return existing;
}

export function setActiveTrip(tripId) {
  const trip = getTripById(tripId);
  if (!trip) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  db.prepare('UPDATE trips SET is_active = 0').run();
  db.prepare('UPDATE trips SET is_active = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), tripId);
  return getTripById(tripId);
}

export function listItineraryDaysForTrip(tripId) {
  return db.prepare('SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY date ASC, created_at ASC').all(tripId).map(mapDayRow);
}

export function getDayById(tripId, dayId) {
  return mapDayRow(db.prepare('SELECT * FROM itinerary_days WHERE trip_id = ? AND id = ?').get(tripId, dayId));
}

export function createItineraryDay(tripId, payload = {}) {
  const trip = getTripById(tripId);
  if (!trip) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  const data = normalizeItineraryDayPayload(payload);
  if (!data.date) {
    const error = new Error('Itinerary day requires a date.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const dayId = randomUUID();

  db.prepare(
    'INSERT INTO itinerary_days (id, trip_id, date, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(dayId, tripId, data.date, data.title, now, now);

  return getDayById(tripId, dayId);
}

export function updateItineraryDay(tripId, dayId, payload = {}) {
  const existing = getDayById(tripId, dayId);
  if (!existing) {
    const error = new Error('Itinerary day not found.');
    error.statusCode = 404;
    throw error;
  }

  const data = normalizeItineraryDayPayload({ ...existing, ...payload });
  const now = new Date().toISOString();

  db.prepare(
    'UPDATE itinerary_days SET date = ?, title = ?, updated_at = ? WHERE trip_id = ? AND id = ?'
  ).run(data.date, data.title, now, tripId, dayId);

  return getDayById(tripId, dayId);
}

export function deleteItineraryDay(tripId, dayId) {
  const existing = getDayById(tripId, dayId);
  if (!existing) {
    const error = new Error('Itinerary day not found.');
    error.statusCode = 404;
    throw error;
  }

  db.prepare('DELETE FROM itinerary_days WHERE trip_id = ? AND id = ?').run(tripId, dayId);
  return existing;
}

export function listItemsForDay(tripId, dayId) {
  return db.prepare('SELECT * FROM itinerary_items WHERE trip_id = ? AND day_id = ? ORDER BY sort_order ASC, created_at ASC').all(tripId, dayId).map(mapItemRow);
}

export function listItemsForTrip(tripId) {
  return db.prepare('SELECT * FROM itinerary_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC').all(tripId).map(mapItemRow);
}

export function getItemById(tripId, itemId) {
  return mapItemRow(db.prepare('SELECT * FROM itinerary_items WHERE trip_id = ? AND id = ?').get(tripId, itemId));
}

export function createItineraryItem(tripId, dayId, payload = {}) {
  const day = getDayById(tripId, dayId);
  if (!day) {
    const error = new Error('Itinerary day not found.');
    error.statusCode = 404;
    throw error;
  }

  const data = normalizeItineraryItemPayload(payload);
  if (!data.title) {
    const error = new Error('Itinerary item title is required.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const itemId = randomUUID();

  db.prepare(
    `INSERT INTO itinerary_items (
      id, trip_id, day_id, date, time, title, location, description, goal, activity_type, priority, parking,
      smart_chip, map_link, price, note, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    itemId,
    tripId,
    dayId,
    data.date,
    data.time,
    data.title,
    data.location,
    data.description,
    data.goal,
    data.activityType,
    data.priority,
    data.parking,
    data.smartChip,
    data.mapLink,
    data.price,
    data.note,
    data.sortOrder,
    now,
    now,
  );

  return getItemById(tripId, itemId);
}

export function updateItineraryItem(tripId, dayId, itemId, payload = {}) {
  const existing = getItemById(tripId, itemId);
  if (!existing) {
    const error = new Error('Itinerary item not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing.dayId !== dayId) {
    const error = new Error('Itinerary item does not belong to the supplied day.');
    error.statusCode = 400;
    throw error;
  }

  const data = normalizeItineraryItemPayload({ ...existing, ...payload });
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE itinerary_items
     SET date = ?, time = ?, title = ?, location = ?, description = ?, goal = ?, activity_type = ?, priority = ?, parking = ?,
         smart_chip = ?, map_link = ?, price = ?, note = ?, sort_order = ?, updated_at = ?
     WHERE trip_id = ? AND day_id = ? AND id = ?`
  ).run(
    data.date,
    data.time,
    data.title,
    data.location,
    data.description,
    data.goal,
    data.activityType,
    data.priority,
    data.parking,
    data.smartChip,
    data.mapLink,
    data.price,
    data.note,
    data.sortOrder,
    now,
    tripId,
    dayId,
    itemId,
  );

  return getItemById(tripId, itemId);
}

export function deleteItineraryItem(tripId, dayId, itemId) {
  const existing = getItemById(tripId, itemId);
  if (!existing) {
    const error = new Error('Itinerary item not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing.dayId !== dayId) {
    const error = new Error('Itinerary item does not belong to the supplied day.');
    error.statusCode = 400;
    throw error;
  }

  db.prepare('DELETE FROM itinerary_items WHERE trip_id = ? AND day_id = ? AND id = ?').run(tripId, dayId, itemId);
  return existing;
}
