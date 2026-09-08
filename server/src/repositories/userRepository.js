import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/db.js';

const db = getDb();

const SALT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 8;
const MAX_EMAIL_LENGTH = 254;
const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_NAME_LENGTH = 80;
// Basic structural check (local-part@domain-with-a-dot), not a full RFC 5322
// validator — good enough to reject obviously malformed/malicious input
// without rejecting legitimate addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    displayName: row.display_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
}

export function getUserById(userId) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

export function toPublicUser(row) {
  return mapUserRow(row);
}

export function createUser({ email, password, firstName = '', lastName = '' }) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(normalizedEmail)) {
    const error = new Error('Email must be a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    const error = new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    error.statusCode = 400;
    throw error;
  }
  const normalizedFirstName = String(firstName ?? '').trim();
  const normalizedLastName = String(lastName ?? '').trim();
  if (normalizedFirstName.length > MAX_NAME_LENGTH || normalizedLastName.length > MAX_NAME_LENGTH) {
    const error = new Error(`First and last names must be at most ${MAX_NAME_LENGTH} characters long.`);
    error.statusCode = 400;
    throw error;
  }

  if (getUserByEmail(normalizedEmail)) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const now = new Date().toISOString();
  const userId = randomUUID();

  try {
    db.prepare(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, normalizedEmail, passwordHash, normalizedFirstName, normalizedLastName, now, now);
  } catch (insertError) {
    // Guards against a race where two concurrent registrations for the same
    // email both pass the getUserByEmail check above before either inserts;
    // the unique index on `email` still enforces correctness, we just need
    // to surface it as a clean 409 instead of a raw SQLite constraint error.
    if (insertError.code === 'SQLITE_CONSTRAINT_UNIQUE' || insertError.code === 'SQLITE_CONSTRAINT') {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }
    throw insertError;
  }

  return getUserById(userId);
}

export function verifyPassword(user, password) {
  if (!user || !password) {
    return false;
  }

  return bcrypt.compareSync(password, user.password_hash);
}

/**
 * Updates a user's display name. Passing an empty/whitespace-only value
 * clears it back to `null`, which falls back to the email address wherever
 * a display name is shown (trip members, edit-lock holders, etc).
 */
export function updateDisplayName(userId, displayName) {
  const trimmed = String(displayName ?? '').trim();
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    const error = new Error(`Display name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters long.`);
    error.statusCode = 400;
    throw error;
  }

  db.prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?')
    .run(trimmed || null, new Date().toISOString(), userId);
  return getUserById(userId);
}

export function updateNames(userId, firstName = '', lastName = '') {
  const first = String(firstName ?? '').trim();
  const last = String(lastName ?? '').trim();
  if (first.length > MAX_NAME_LENGTH || last.length > MAX_NAME_LENGTH) {
    const error = new Error(`First and last names must be at most ${MAX_NAME_LENGTH} characters long.`);
    error.statusCode = 400;
    throw error;
  }
  db.prepare('UPDATE users SET first_name = ?, last_name = ?, updated_at = ? WHERE id = ?')
    .run(first, last, new Date().toISOString(), userId);
  return getUserById(userId);
}

export function updatePasswordHash(userId, password) {
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    const error = new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(passwordHash, new Date().toISOString(), userId);
  return getUserById(userId);
}
