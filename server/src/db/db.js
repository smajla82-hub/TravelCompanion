import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { config } from '../config.js';

const dataDir = path.dirname(config.dbPath);
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url));
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

// Migration: add `user_id` to `trips` for databases created before Feature 10.2
// (Authentication). Safe to run on every startup: `better-sqlite3` throws if the
// column already exists, so we only apply it when missing. Existing 10.1-era
// trips are left with a NULL user_id (unowned) until backfilled.
const tripColumns = db.prepare("PRAGMA table_info(trips)").all();
const hasUserId = tripColumns.some((column) => column.name === 'user_id');
if (!hasUserId) {
  db.exec('ALTER TABLE trips ADD COLUMN user_id TEXT REFERENCES users (id) ON DELETE SET NULL');
  db.exec('CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips (user_id)');
}

// Migration: retain access to trips created before shared memberships existed.
// INSERT OR IGNORE makes this safe on every startup and preserves member rows.
db.exec(
  `INSERT OR IGNORE INTO trip_members (trip_id, user_id, role, created_at, updated_at)
   SELECT id, user_id, 'owner', created_at, updated_at
   FROM trips
   WHERE user_id IS NOT NULL`,
);

export function getDb() {
  return db;
}

export function closeDb() {
  db.close();
}
