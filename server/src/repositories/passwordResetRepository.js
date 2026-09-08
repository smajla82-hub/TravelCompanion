import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getDb } from '../db/db.js';

const db = getDb();

function mapTokenRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Invalidates any previously issued, still-unused reset tokens for a user.
 * Called before issuing a new one so at most one token is ever usable at a
 * time — an older, possibly-leaked email link stops working the moment a
 * newer reset is requested.
 */
export function invalidateUserTokens(userId) {
  db.prepare(
    'UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL',
  ).run(new Date().toISOString(), userId);
}

export function createResetToken(userId, expiresAt) {
  invalidateUserTokens(userId);

  const id = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, userId, tokenHash, expiresAt, now);

  return { ...mapTokenRow(db.prepare('SELECT * FROM password_reset_tokens WHERE id = ?').get(id)), token };
}

/** Returns the token row only if it is unused and not yet expired. */
export function getValidResetToken(token) {
  const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ?').get(hashToken(token));
  if (!row || row.used_at || new Date(row.expires_at) <= new Date()) {
    return null;
  }
  return mapTokenRow(row);
}

export function markResetTokenUsed(id) {
  db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?')
    .run(new Date().toISOString(), id);
}
