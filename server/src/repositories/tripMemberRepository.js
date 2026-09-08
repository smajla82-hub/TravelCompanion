import { getDb } from '../db/db.js';

const db = getDb();

function mapMemberRow(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getTripMember(tripId, userId) {
  const member = mapMemberRow(
    db.prepare(
      `SELECT trip_members.*, users.email
       FROM trip_members JOIN users ON users.id = trip_members.user_id
       WHERE trip_id = ? AND user_id = ?`,
    ).get(tripId, userId),
  );
  if (member) {
    return member;
  }

  // Trips created before authentication have no accountable owner. Do not
  // assign the first caller as owner; expose them only to authenticated users
  // as ownerless shared editor data, keeping destructive/owner actions closed.
  const ownerlessTrip = db.prepare(
    'SELECT 1 FROM trips WHERE id = ? AND user_id IS NULL',
  ).get(tripId);
  return ownerlessTrip ? { userId, role: 'editor', legacyOwnerless: true } : null;
}

export function listTripMembers(tripId) {
  return db.prepare(
    `SELECT trip_members.*, users.email
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
