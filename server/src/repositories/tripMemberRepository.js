import { getDb } from '../db/db.js';

const db = getDb();

function mapMemberRow(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    displayName: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.display_name || row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getTripMember(tripId, userId) {
  const member = mapMemberRow(
    db.prepare(
      `SELECT trip_members.*, users.email, users.first_name, users.last_name, users.display_name
       FROM trip_members JOIN users ON users.id = trip_members.user_id
       WHERE trip_id = ? AND user_id = ?`,
    ).get(tripId, userId),
  );
  if (member) {
    return member;
  }

  // Intentional family-data recovery policy: a pre-authentication trip with no
  // owner *and no explicit members* is recoverable shared data. Authenticated
  // callers receive editor-level access only; no ownership is invented and
  // owner-only operations remain closed. Once memberships exist, they are the
  // authoritative access policy.
  const ownerlessTrip = db.prepare(
    `SELECT 1 FROM trips
     WHERE id = ? AND user_id IS NULL
       AND NOT EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trips.id)`,
  ).get(tripId);
  return ownerlessTrip ? { userId, role: 'editor', legacyOwnerless: true } : null;
}

export function listTripMembers(tripId) {
  return db.prepare(
    `SELECT trip_members.*, users.email, users.first_name, users.last_name, users.display_name
     FROM trip_members JOIN users ON users.id = trip_members.user_id
     WHERE trip_id = ? ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, users.email`,
  ).all(tripId).map(mapMemberRow);
}

export function addTripMember(tripId, userId, role) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO trip_members (trip_id, user_id, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(tripId, userId, role, now, now);
  return getTripMember(tripId, userId);
}

export function updateTripMemberRole(tripId, userId, role) {
  const result = db.prepare(
    'UPDATE trip_members SET role = ?, updated_at = ? WHERE trip_id = ? AND user_id = ?',
  ).run(role, new Date().toISOString(), tripId, userId);
  return result.changes ? getTripMember(tripId, userId) : null;
}

export function removeTripMember(tripId, userId) {
  const member = getTripMember(tripId, userId);
  if (!member) {
    return null;
  }
  db.prepare('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?').run(tripId, userId);
  return member;
}
