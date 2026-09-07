import { randomUUID } from 'node:crypto';
import { getDb } from '../db/db.js';
import { addTripMember } from './tripMemberRepository.js';

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

export function listTrips(userId) {
  return db.prepare(
    `SELECT trips.* FROM trips
     JOIN trip_members ON trip_members.trip_id = trips.id
     WHERE trip_members.user_id = ?
     ORDER BY trips.updated_at DESC`,
  ).all(userId).map(mapTripRow);
}

export function getTripById(tripId, userId) {
  return mapTripRow(db.prepare(
    `SELECT trips.* FROM trips
     JOIN trip_members ON trip_members.trip_id = trips.id
     WHERE trips.id = ? AND trip_members.user_id = ?`,
  ).get(tripId, userId));
}

export function getActiveTrip(userId) {
  return mapTripRow(db.prepare(
    `SELECT trips.* FROM trips
     JOIN trip_members ON trip_members.trip_id = trips.id
     WHERE trips.is_active = 1 AND trip_members.user_id = ?
     ORDER BY trips.updated_at DESC LIMIT 1`,
  ).get(userId));
}

export function createTrip(payload = {}, userId) {
  const data = normalizeTripPayload(payload);
  if (!data.name || !data.startDate || !data.endDate) {
    const error = new Error('Trip name, startDate and endDate are required.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const tripId = randomUUID();

  db.transaction(() => {
    db.prepare(
      `INSERT INTO trips (id, name, destination, country, start_date, end_date, travellers, cover_image, status, is_active, user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      tripId, data.name, data.destination, data.country, data.startDate, data.endDate,
      data.travellers, data.coverImage, data.status, data.isActive, userId, now, now,
    );
    addTripMember(tripId, userId, 'owner');
  })();

  return getTripById(tripId, userId);
}

export function updateTrip(tripId, payload = {}, userId) {
  const existing = getTripById(tripId, userId);
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

  return getTripById(tripId, userId);
}

export function deleteTrip(tripId, userId) {
  const existing = getTripById(tripId, userId);
  if (!existing) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);
  return existing;
}

export function setActiveTrip(tripId, userId) {
  const trip = getTripById(tripId, userId);
  if (!trip) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  db.prepare(
    `UPDATE trips SET is_active = 0
     WHERE id IN (SELECT trip_id FROM trip_members WHERE user_id = ?)`,
  ).run(userId);
  db.prepare('UPDATE trips SET is_active = 1, updated_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    tripId,
  );
  return getTripById(tripId, userId);
}

export function touchTrip(tripId) {
  db.prepare('UPDATE trips SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), tripId);
}

export function listItineraryDaysForTrip(tripId) {
  return db.prepare('SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY date ASC, created_at ASC').all(tripId).map(mapDayRow);
}

export function getDayById(tripId, dayId) {
  return mapDayRow(db.prepare('SELECT * FROM itinerary_days WHERE trip_id = ? AND id = ?').get(tripId, dayId));
}

export function createItineraryDay(tripId, payload = {}, userId) {
  const trip = getTripById(tripId, userId);
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

export function getItinerary(tripId) {
  const days = listItineraryDaysForTrip(tripId);
  const items = listItemsForTrip(tripId);

  return {
    tripId,
    days: days.map((day) => ({
      ...day,
      // `mapItemRow` renames `day_id` to `dayId`; grouping on the raw column
      // name silently produced empty days.
      items: items.filter((item) => item.dayId === day.id),
    })),
  };
}

/**
 * Replaces the whole itinerary of a Trip in a single transaction. Either every
 * day and activity is persisted, or nothing is changed, so an interrupted or
 * invalid import can never leave a half-written itinerary behind.
 */
export function replaceItinerary(tripId, days, userId) {
  const trip = getTripById(tripId, userId);
  if (!trip) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(days)) {
    const error = new Error('An itinerary days array is required.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const normalizedDays = days.map((day) => {
    const dayData = normalizeItineraryDayPayload(day);
    if (!dayData.date) {
      const error = new Error('Itinerary day requires a date.');
      error.statusCode = 400;
      throw error;
    }

    const items = Array.isArray(day?.items) ? day.items : [];

    return {
      ...dayData,
      items: items.map((item, index) => {
        const itemData = normalizeItineraryItemPayload({
          ...item,
          date: item?.date || dayData.date,
          sortOrder: index,
        });

        if (!itemData.title) {
          const error = new Error('Itinerary item title is required.');
          error.statusCode = 400;
          throw error;
        }

        // Import order is authoritative: an itinerary sent as a whole keeps the
        // position of every activity inside its day.
        return { ...itemData, sortOrder: index };
      }),
    };
  });

  db.transaction(() => {
    db.prepare('DELETE FROM itinerary_days WHERE trip_id = ?').run(tripId);
    db.prepare('DELETE FROM itinerary_items WHERE trip_id = ?').run(tripId);

    for (const day of normalizedDays) {
      const dayId = randomUUID();
      db.prepare(
        'INSERT INTO itinerary_days (id, trip_id, date, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(dayId, tripId, day.date, day.title, now, now);

      for (const item of day.items) {
        db.prepare(
          `INSERT INTO itinerary_items (
            id, trip_id, day_id, date, time, title, location, description, goal, activity_type, priority, parking,
            smart_chip, map_link, price, note, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          randomUUID(),
          tripId,
          dayId,
          item.date,
          item.time,
          item.title,
          item.location,
          item.description,
          item.goal,
          item.activityType,
          item.priority,
          item.parking,
          item.smartChip,
          item.mapLink,
          item.price,
          item.note,
          item.sortOrder,
          now,
          now,
        );
      }
    }

    db.prepare('UPDATE trips SET updated_at = ? WHERE id = ?').run(now, tripId);
  })();

  return getItinerary(tripId);
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
