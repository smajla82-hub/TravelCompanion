import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/db.js';

const db = getDb();

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
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

export function createUser({ email, password }) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    const error = new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
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
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, normalizedEmail, passwordHash, now, now);
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
