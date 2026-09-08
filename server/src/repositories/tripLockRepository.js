import { getDb } from '../db/db.js';

const db = getDb();

function mapLockRow(row) {
  if (!row) {
    return null;
  }

  return {
    tripId: row.trip_id,
    userId: row.user_id,
    acquiredAt: row.acquired_at,
    lastHeartbeatAt: row.last_heartbeat_at,
    expiresAt: row.expires_at,
    ...(row.email ? {
      email: row.email,
      firstName: row.first_name ?? '',
      lastName: row.last_name ?? '',
      displayName: [row.first_name, row.last_name].filter(Boolean).join(' ') || row.display_name || row.email,
    } : {}),
  };
}

function getLockRow(tripId) {
  return db.prepare(
    `SELECT trip_locks.*, users.email, users.first_name, users.last_name, users.display_name
     FROM trip_locks JOIN users ON users.id = trip_locks.user_id
     WHERE trip_locks.trip_id = ?`,
  ).get(tripId);
}

export function getActiveLock(tripId, now = new Date().toISOString()) {
  const row = getLockRow(tripId);
  if (row && row.expires_at <= now) {
    db.prepare('DELETE FROM trip_locks WHERE trip_id = ? AND expires_at <= ?').run(tripId, now);
    return null;
  }
  return mapLockRow(row);
}

export function acquireLock(tripId, userId, now, expiresAt) {
  return db.transaction(() => {
    const current = getActiveLock(tripId, now);
    if (current && current.userId !== userId) {
      return { lock: current, acquired: false };
    }

    if (current) {
      db.prepare(
        'UPDATE trip_locks SET last_heartbeat_at = ?, expires_at = ? WHERE trip_id = ?',
      ).run(now, expiresAt, tripId);
    } else {
      db.prepare(
        `INSERT INTO trip_locks (trip_id, user_id, acquired_at, last_heartbeat_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(tripId, userId, now, now, expiresAt);
    }
    return { lock: getActiveLock(tripId, now), acquired: true };
  })();
}

export function heartbeatLock(tripId, userId, now, expiresAt) {
  const lock = getActiveLock(tripId, now);
  if (!lock || lock.userId !== userId) {
    return null;
  }
  db.prepare(
    'UPDATE trip_locks SET last_heartbeat_at = ?, expires_at = ? WHERE trip_id = ? AND user_id = ?',
  ).run(now, expiresAt, tripId, userId);
  return getActiveLock(tripId, now);
}

export function releaseLock(tripId, userId, force = false) {
  const lock = getActiveLock(tripId);
  if (!lock || (!force && lock.userId !== userId)) {
    return null;
  }
  db.prepare('DELETE FROM trip_locks WHERE trip_id = ?').run(tripId);
  return lock;
}
