import { randomUUID } from 'node:crypto';
import { getDb } from '../db/db.js';
import { addTripMember } from './tripMemberRepository.js';

const db = getDb();

// Hard product limits for day-scoped Recommended Venues/Parking Locations
// (see FP-2 plan). Enforced here (not just client-side) so they cannot be
// bypassed via direct API calls.
const MAX_VENUES_PER_DAY = 6;
const MAX_PARKING_PER_DAY = 8;
const PARKING_CODES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];

function isValidParkingCode(code) {
  return PARKING_CODES.includes(code);
}

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

function mapVenueRow(row) {
  if (!row) {
    return null;
  }

  const mapped = {
    ...row,
    tripId: row.trip_id,
    dayId: row.day_id,
    mealType: row.meal_type,
    smartChip: row.smart_chip,
    mapLink: row.map_link,
    sortOrder: row.sort_order,
  };

  delete mapped.trip_id;
  delete mapped.day_id;
  delete mapped.meal_type;
  delete mapped.smart_chip;
  delete mapped.map_link;
  delete mapped.sort_order;

  return mapped;
}

function mapParkingLocationRow(row) {
  if (!row) {
    return null;
  }

  const mapped = {
    ...row,
    tripId: row.trip_id,
    dayId: row.day_id,
    mapLink: row.map_link,
    sortOrder: row.sort_order,
  };

  delete mapped.trip_id;
  delete mapped.day_id;
  delete mapped.map_link;
  delete mapped.sort_order;

  return mapped;
}

function normalizeVenuePayload(payload = {}) {
  return {
    priority: payload.priority ?? null,
    type: payload.type ?? null,
    mealType: payload.mealType ?? payload.meal_type ?? null,
    subtype: payload.subtype ?? null,
    name: String(payload.name ?? '').trim(),
    smartChip: payload.smartChip ?? payload.smart_chip ?? null,
    mapLink: payload.mapLink ?? payload.map_link ?? null,
    recommendation: payload.recommendation ?? null,
    price: payload.price ?? null,
    reservation: payload.reservation ?? null,
    sortOrder: Number(payload.sortOrder ?? payload.sort_order ?? 0),
  };
}

function normalizeParkingLocationPayload(payload = {}) {
  return {
    code: String(payload.code ?? '').trim(),
    name: String(payload.name ?? '').trim(),
    mapLink: payload.mapLink ?? payload.map_link ?? null,
    price: payload.price ?? null,
    note: payload.note ?? null,
    sortOrder: Number(payload.sortOrder ?? payload.sort_order ?? 0),
  };
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

function timeValue(time) {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return undefined;
  }

  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function resequenceDayItems(tripId, dayId) {
  const items = listItemsForDay(tripId, dayId)
    .map((item, index) => ({ item, index, time: timeValue(item.time) }))
    .sort((left, right) => {
      if (left.time === undefined && right.time === undefined) return left.index - right.index;
      if (left.time === undefined) return 1;
      if (right.time === undefined) return -1;
      return left.time - right.time || left.index - right.index;
    });
  const updateSortOrder = db.prepare(
    'UPDATE itinerary_items SET sort_order = ? WHERE trip_id = ? AND day_id = ? AND id = ?',
  );

  items.forEach(({ item }, sortOrder) => {
    updateSortOrder.run(sortOrder, tripId, dayId, item.id);
  });
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

export function listVenuesForTrip(tripId) {
  return db.prepare('SELECT * FROM venues WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC').all(tripId).map(mapVenueRow);
}

export function listParkingLocationsForTrip(tripId) {
  return db.prepare('SELECT * FROM parking_locations WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC').all(tripId).map(mapParkingLocationRow);
}

export function getItinerary(tripId) {
  const days = listItineraryDaysForTrip(tripId);
  const items = listItemsForTrip(tripId);
  const venues = listVenuesForTrip(tripId);
  const parkingLocations = listParkingLocationsForTrip(tripId);

  return {
    tripId,
    days: days.map((day) => ({
      ...day,
      // `mapItemRow`/`mapVenueRow`/`mapParkingLocationRow` rename `day_id` to
      // `dayId`; grouping on the raw column name silently produced empty days.
      items: items.filter((item) => item.dayId === day.id),
      venues: venues.filter((venue) => venue.dayId === day.id),
      parkingLocations: parkingLocations.filter((location) => location.dayId === day.id),
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
    const venues = Array.isArray(day?.venues) ? day.venues : [];
    const parkingLocations = Array.isArray(day?.parkingLocations) ? day.parkingLocations : [];

    if (venues.length > MAX_VENUES_PER_DAY) {
      const error = new Error(`A day may have at most ${MAX_VENUES_PER_DAY} recommended venues.`);
      error.statusCode = 400;
      throw error;
    }

    if (parkingLocations.length > MAX_PARKING_PER_DAY) {
      const error = new Error(`A day may have at most ${MAX_PARKING_PER_DAY} parking locations.`);
      error.statusCode = 400;
      throw error;
    }

    const parkingCodes = parkingLocations.map((location) => String(location?.code ?? '').trim());
    if (new Set(parkingCodes).size !== parkingCodes.length) {
      const error = new Error('Duplicate parking codes are not allowed within the same day.');
      error.statusCode = 400;
      throw error;
    }

    return {
      ...dayData,
      items: items.map((item, index) => {
        // Import order is authoritative: an itinerary sent as a whole keeps the
        // position of every activity inside its day.
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

        return itemData;
      }),
      // Recommended venues carry no cross-references from `itinerary_items`,
      // so persisting them is order-preserving but otherwise independent of
      // the day's activities.
      venues: venues.map((venue, index) => {
        const venueData = normalizeVenuePayload({ ...venue, sortOrder: index });

        if (!venueData.name) {
          const error = new Error('Recommended venue name is required.');
          error.statusCode = 400;
          throw error;
        }

        return venueData;
      }),
      // `code` is the stable, user-facing key that `itinerary_items.parking`
      // references (see schema.sql); it must be preserved exactly as
      // imported/edited so existing P1-P8 references keep resolving.
      parkingLocations: parkingLocations.map((location, index) => {
        const locationData = normalizeParkingLocationPayload({ ...location, sortOrder: index });

        if (!locationData.code || !locationData.name) {
          const error = new Error('Parking location code and name are required.');
          error.statusCode = 400;
          throw error;
        }

        if (!isValidParkingCode(locationData.code)) {
          const error = new Error('Parking code must be one of P1-P8.');
          error.statusCode = 400;
          throw error;
        }

        return locationData;
      }),
    };
  });

  const insertDay = db.prepare(
    'INSERT INTO itinerary_days (id, trip_id, date, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertItem = db.prepare(
    `INSERT INTO itinerary_items (
      id, trip_id, day_id, date, time, title, location, description, goal, activity_type, priority, parking,
      smart_chip, map_link, price, note, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertVenue = db.prepare(
    `INSERT INTO venues (
      id, trip_id, day_id, priority, type, meal_type, subtype, name, smart_chip, map_link, recommendation,
      price, reservation, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertParkingLocation = db.prepare(
    `INSERT INTO parking_locations (
      id, trip_id, day_id, code, name, map_link, price, note, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  db.transaction(() => {
    db.prepare('DELETE FROM itinerary_days WHERE trip_id = ?').run(tripId);
    db.prepare('DELETE FROM itinerary_items WHERE trip_id = ?').run(tripId);
    db.prepare('DELETE FROM venues WHERE trip_id = ?').run(tripId);
    db.prepare('DELETE FROM parking_locations WHERE trip_id = ?').run(tripId);

    for (const day of normalizedDays) {
      const dayId = randomUUID();
      insertDay.run(dayId, tripId, day.date, day.title, now, now);

      for (const item of day.items) {
        insertItem.run(
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

      for (const venue of day.venues) {
        insertVenue.run(
          randomUUID(),
          tripId,
          dayId,
          venue.priority,
          venue.type,
          venue.mealType,
          venue.subtype,
          venue.name,
          venue.smartChip,
          venue.mapLink,
          venue.recommendation,
          venue.price,
          venue.reservation,
          venue.sortOrder,
          now,
          now,
        );
      }

      for (const location of day.parkingLocations) {
        insertParkingLocation.run(
          randomUUID(),
          tripId,
          dayId,
          location.code,
          location.name,
          location.mapLink,
          location.price,
          location.note,
          location.sortOrder,
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

  db.transaction(() => {
    // The final `sort_order` is always recomputed by `resequenceDayItems`
    // right after the insert, but that resequencing tie-breaks activities
    // sharing the same (or no) time by their current relative order. A new
    // Activity must therefore start out *after* every existing Activity in
    // that ordering, or it can jump ahead of an already-positioned Activity
    // it happens to collide with (e.g. the default `sortOrder` of `0`
    // colliding with the day's first Activity) and appear to reorder
    // unrelated Activities.
    const insertSortOrder = listItemsForDay(tripId, dayId).length;

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
    insertSortOrder,
    now,
      now,
    );
    resequenceDayItems(tripId, dayId);
  })();

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

  db.transaction(() => {
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
    if (Object.hasOwn(payload, 'time')) {
      resequenceDayItems(tripId, dayId);
    }
  })();

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

export function getVenueById(tripId, venueId) {
  return mapVenueRow(db.prepare('SELECT * FROM venues WHERE trip_id = ? AND id = ?').get(tripId, venueId));
}

export function createVenue(tripId, dayId, payload = {}) {
  const day = getDayById(tripId, dayId);
  if (!day) {
    const error = new Error('Itinerary day not found.');
    error.statusCode = 404;
    throw error;
  }

  const existingVenues = listVenuesForTrip(tripId).filter((venue) => venue.dayId === dayId);
  if (existingVenues.length >= MAX_VENUES_PER_DAY) {
    const error = new Error(`A day may have at most ${MAX_VENUES_PER_DAY} recommended venues.`);
    error.statusCode = 409;
    throw error;
  }

  const data = normalizeVenuePayload({ ...payload, sortOrder: existingVenues.length });
  if (!data.name) {
    const error = new Error('Recommended venue name is required.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const venueId = randomUUID();

  db.prepare(
    `INSERT INTO venues (
      id, trip_id, day_id, priority, type, meal_type, subtype, name, smart_chip, map_link, recommendation,
      price, reservation, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    venueId, tripId, dayId, data.priority, data.type, data.mealType, data.subtype, data.name,
    data.smartChip, data.mapLink, data.recommendation, data.price, data.reservation, data.sortOrder,
    now, now,
  );

  return getVenueById(tripId, venueId);
}

export function updateVenue(tripId, dayId, venueId, payload = {}) {
  const existing = getVenueById(tripId, venueId);
  if (!existing) {
    const error = new Error('Recommended venue not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing.dayId !== dayId) {
    const error = new Error('Recommended venue does not belong to the supplied day.');
    error.statusCode = 400;
    throw error;
  }

  const data = normalizeVenuePayload({ ...existing, ...payload, sortOrder: existing.sortOrder });
  if (!data.name) {
    const error = new Error('Recommended venue name is required.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();

  db.prepare(
    `UPDATE venues
     SET priority = ?, type = ?, meal_type = ?, subtype = ?, name = ?, smart_chip = ?, map_link = ?,
         recommendation = ?, price = ?, reservation = ?, updated_at = ?
     WHERE trip_id = ? AND day_id = ? AND id = ?`,
  ).run(
    data.priority, data.type, data.mealType, data.subtype, data.name, data.smartChip, data.mapLink,
    data.recommendation, data.price, data.reservation, now,
    tripId, dayId, venueId,
  );

  return getVenueById(tripId, venueId);
}

export function deleteVenue(tripId, dayId, venueId) {
  const existing = getVenueById(tripId, venueId);
  if (!existing) {
    const error = new Error('Recommended venue not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing.dayId !== dayId) {
    const error = new Error('Recommended venue does not belong to the supplied day.');
    error.statusCode = 400;
    throw error;
  }

  // Venues carry no cross-references from `itinerary_items` (see schema.sql),
  // so deletion is always safe and immediate.
  db.prepare('DELETE FROM venues WHERE trip_id = ? AND day_id = ? AND id = ?').run(tripId, dayId, venueId);
  return existing;
}

export function getParkingLocationById(tripId, parkingId) {
  return mapParkingLocationRow(
    db.prepare('SELECT * FROM parking_locations WHERE trip_id = ? AND id = ?').get(tripId, parkingId),
  );
}

export function createParkingLocation(tripId, dayId, payload = {}) {
  const day = getDayById(tripId, dayId);
  if (!day) {
    const error = new Error('Itinerary day not found.');
    error.statusCode = 404;
    throw error;
  }

  const data = normalizeParkingLocationPayload(payload);
  if (!data.code || !data.name) {
    const error = new Error('Parking location code and name are required.');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidParkingCode(data.code)) {
    const error = new Error('Parking code must be one of P1-P8.');
    error.statusCode = 400;
    throw error;
  }

  const existingParking = listParkingLocationsForTrip(tripId).filter((location) => location.dayId === dayId);

  if (existingParking.some((location) => location.code === data.code)) {
    const error = new Error(`Parking code ${data.code} is already used on this day.`);
    error.statusCode = 409;
    throw error;
  }

  if (existingParking.length >= MAX_PARKING_PER_DAY) {
    const error = new Error(`A day may have at most ${MAX_PARKING_PER_DAY} parking locations.`);
    error.statusCode = 409;
    throw error;
  }

  const now = new Date().toISOString();
  const parkingId = randomUUID();

  db.prepare(
    `INSERT INTO parking_locations (
      id, trip_id, day_id, code, name, map_link, price, note, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    parkingId, tripId, dayId, data.code, data.name, data.mapLink, data.price, data.note,
    existingParking.length, now, now,
  );

  return getParkingLocationById(tripId, parkingId);
}

export function updateParkingLocation(tripId, dayId, parkingId, payload = {}) {
  const existing = getParkingLocationById(tripId, parkingId);
  if (!existing) {
    const error = new Error('Parking location not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing.dayId !== dayId) {
    const error = new Error('Parking location does not belong to the supplied day.');
    error.statusCode = 400;
    throw error;
  }

  // The parking `code` is read-only after creation: changing it would
  // require rewriting every `itinerary_items.parking` reference for the day,
  // which this feature intentionally does not support (FP-2 decision). Any
  // `code` in `payload` is ignored in favor of the existing code.
  const data = normalizeParkingLocationPayload({
    ...existing,
    ...payload,
    code: existing.code,
    sortOrder: existing.sortOrder,
  });

  if (!data.name) {
    const error = new Error('Parking location name is required.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();

  db.prepare(
    `UPDATE parking_locations
     SET name = ?, map_link = ?, price = ?, note = ?, updated_at = ?
     WHERE trip_id = ? AND day_id = ? AND id = ?`,
  ).run(data.name, data.mapLink, data.price, data.note, now, tripId, dayId, parkingId);

  return getParkingLocationById(tripId, parkingId);
}

/**
 * Deletes a parking location. When `clearReferences` is falsy and the code
 * is still referenced by an activity in the same day, the deletion is
 * rejected instead of silently orphaning `itinerary_items.parking` values.
 * When `clearReferences` is truthy, the parking location is removed and
 * every referencing activity's `parking` field is cleared atomically.
 */
export function deleteParkingLocation(tripId, dayId, parkingId, { clearReferences = false } = {}) {
  const existing = getParkingLocationById(tripId, parkingId);
  if (!existing) {
    const error = new Error('Parking location not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing.dayId !== dayId) {
    const error = new Error('Parking location does not belong to the supplied day.');
    error.statusCode = 400;
    throw error;
  }

  const referencingItems = db
    .prepare('SELECT * FROM itinerary_items WHERE trip_id = ? AND day_id = ? AND parking = ?')
    .all(tripId, dayId, existing.code)
    .map(mapItemRow);

  if (referencingItems.length > 0 && !clearReferences) {
    const error = new Error(
      `Parking ${existing.code} is referenced by ${referencingItems.length} activity/activities. `
      + 'Remove or reassign them before deleting, or delete and clear references.',
    );
    error.statusCode = 409;
    error.referencingItems = referencingItems;
    throw error;
  }

  db.transaction(() => {
    if (clearReferences && referencingItems.length > 0) {
      db.prepare(
        'UPDATE itinerary_items SET parking = NULL WHERE trip_id = ? AND day_id = ? AND parking = ?',
      ).run(tripId, dayId, existing.code);
    }

    db.prepare('DELETE FROM parking_locations WHERE trip_id = ? AND day_id = ? AND id = ?').run(tripId, dayId, parkingId);
  })();

  return existing;
}

