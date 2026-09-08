import fs from 'node:fs';
import { createHash } from 'node:crypto';
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

// Migration: add `display_name` to `users` for databases created before FP-7
// (Account email/profile). Additive/nullable — existing accounts simply fall
// back to their email address for display until they set a name.
const userColumns = db.prepare("PRAGMA table_info(users)").all();
if (!userColumns.some((column) => column.name === 'display_name')) {
  db.exec('ALTER TABLE users ADD COLUMN display_name TEXT');
}
if (!userColumns.some((column) => column.name === 'first_name')) {
  db.exec("ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT ''");
}
if (!userColumns.some((column) => column.name === 'last_name')) {
  db.exec("ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT ''");
}

// Migration: replace the pre-FP-7 raw reset-token column with a one-way hash.
const resetTokenColumns = db.prepare("PRAGMA table_info(password_reset_tokens)").all();
if (resetTokenColumns.some((column) => column.name === 'token')) {
  db.exec('ALTER TABLE password_reset_tokens ADD COLUMN token_hash TEXT');
  const legacyTokens = db.prepare('SELECT id, token FROM password_reset_tokens WHERE token_hash IS NULL').all();
  const updateTokenHash = db.prepare('UPDATE password_reset_tokens SET token_hash = ? WHERE id = ?');
  for (const row of legacyTokens) {
    updateTokenHash.run(createHash('sha256').update(row.token).digest('hex'), row.id);
  }
  db.exec(`
    CREATE TABLE password_reset_tokens_hashed (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    INSERT INTO password_reset_tokens_hashed (id, user_id, token_hash, expires_at, used_at, created_at)
      SELECT id, user_id, token_hash, expires_at, used_at, created_at FROM password_reset_tokens;
    DROP TABLE password_reset_tokens;
    ALTER TABLE password_reset_tokens_hashed RENAME TO password_reset_tokens;
    CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
    CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens (token_hash);
  `);
}
db.exec('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens (token_hash)');

// Normalize known historical country names to ISO 3166-1 alpha-2 codes.
// Unknown values are deliberately preserved for later user correction.
const countryAliases = {
  'united states': 'US', usa: 'US', 'united states of america': 'US',
  'czech republic': 'CZ', czechia: 'CZ', 'united kingdom': 'GB', uk: 'GB',
  'great britain': 'GB', italia: 'IT', italy: 'IT',
};
const countryRows = db.prepare('SELECT id, country FROM trips').all();
const updateCountry = db.prepare('UPDATE trips SET country = ? WHERE id = ?');
for (const trip of countryRows) {
  const normalized = countryAliases[String(trip.country ?? '').trim().toLowerCase()];
  if (normalized && normalized !== trip.country) {
    updateCountry.run(normalized, trip.id);
  }
}

// Migration: retain access to trips created before shared memberships existed.
// INSERT OR IGNORE makes this safe on every startup and preserves member rows.
db.exec(
  `INSERT OR IGNORE INTO trip_members (trip_id, user_id, role, created_at, updated_at)
   SELECT id, user_id, 'owner', created_at, updated_at
   FROM trips
   WHERE user_id IS NOT NULL`,
);

// Migration: create the short-lived per-Trip edit lock table for existing
// databases. This is idempotent and deliberately needs no expiry cron job.
db.exec(`
  CREATE TABLE IF NOT EXISTS trip_locks (
    trip_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    acquired_at TEXT NOT NULL,
    last_heartbeat_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_trip_locks_expires_at ON trip_locks (expires_at);
`);

// Migration: add `price`/`note` to `parking_locations` for databases created
// before FP-2 (Venue & Parking management). Additive/nullable, so existing
// rows are unaffected; round-trips the RoadBook "Cena"/"Poznámka" parking
// columns that were previously displayed/imported but never persisted.
const parkingLocationColumns = db.prepare("PRAGMA table_info(parking_locations)").all();
const hasParkingPrice = parkingLocationColumns.some((column) => column.name === 'price');
if (!hasParkingPrice) {
  db.exec('ALTER TABLE parking_locations ADD COLUMN price TEXT');
}
const hasParkingNote = parkingLocationColumns.some((column) => column.name === 'note');
if (!hasParkingNote) {
  db.exec('ALTER TABLE parking_locations ADD COLUMN note TEXT');
}
const hasParkingSmartChip = parkingLocationColumns.some((column) => column.name === 'smart_chip');
if (!hasParkingSmartChip) {
  db.exec('ALTER TABLE parking_locations ADD COLUMN smart_chip TEXT');
}

// Migration: venue parking is a user-facing string just like an item's parking
// code. Keep it nullable so historical venue rows remain readable.
const venueColumns = db.prepare('PRAGMA table_info(venues)').all();
if (!venueColumns.some((column) => column.name === 'parking')) {
  db.exec('ALTER TABLE venues ADD COLUMN parking TEXT');
}

// A former global active flag is copied once to each existing member. For a
// user with multiple old active rows, the newest trip (then id) wins
// deterministically. New selections only use `user_active_trips`.
db.exec(`
  INSERT OR IGNORE INTO user_active_trips (user_id, trip_id, created_at, updated_at)
  SELECT member.user_id, trip.id, trip.created_at, trip.updated_at
  FROM trip_members AS member
  JOIN trips AS trip ON trip.id = member.trip_id
  WHERE trip.is_active = 1
    AND NOT EXISTS (
      SELECT 1
      FROM trip_members AS newer_member
      JOIN trips AS newer_trip ON newer_trip.id = newer_member.trip_id
      WHERE newer_member.user_id = member.user_id
        AND newer_trip.is_active = 1
        AND (
          newer_trip.updated_at > trip.updated_at
          OR (newer_trip.updated_at = trip.updated_at AND newer_trip.id > trip.id)
        )
    );
`);

// Enforce new same-day keys at the database boundary without making a legacy
// database containing old duplicates fail to open. Clean databases get unique
// indexes; triggers still prevent new duplicates when old rows make an index
// impossible. Existing duplicate rows are intentionally left readable.
const hasDuplicateDayDates = db.prepare(
  `SELECT 1 FROM itinerary_days GROUP BY trip_id, date HAVING COUNT(*) > 1 LIMIT 1`,
).get();
if (!hasDuplicateDayDates) {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_itinerary_days_trip_date ON itinerary_days (trip_id, date)');
}
const hasDuplicateParkingCodes = db.prepare(
  `SELECT 1 FROM parking_locations GROUP BY day_id, code HAVING COUNT(*) > 1 LIMIT 1`,
).get();
if (!hasDuplicateParkingCodes) {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_parking_locations_day_code ON parking_locations (day_id, code)');
}
db.exec(`
  CREATE TRIGGER IF NOT EXISTS prevent_duplicate_itinerary_day_date
  BEFORE INSERT ON itinerary_days
  FOR EACH ROW WHEN EXISTS (
    SELECT 1 FROM itinerary_days WHERE trip_id = NEW.trip_id AND date = NEW.date
  )
  BEGIN
    SELECT RAISE(ABORT, 'Duplicate itinerary day date.');
  END;

  CREATE TRIGGER IF NOT EXISTS prevent_changed_duplicate_itinerary_day_date
  BEFORE UPDATE OF trip_id, date ON itinerary_days
  FOR EACH ROW WHEN (NEW.trip_id <> OLD.trip_id OR NEW.date <> OLD.date)
    AND EXISTS (
      SELECT 1 FROM itinerary_days
      WHERE trip_id = NEW.trip_id AND date = NEW.date AND id <> OLD.id
    )
  BEGIN
    SELECT RAISE(ABORT, 'Duplicate itinerary day date.');
  END;

  CREATE TRIGGER IF NOT EXISTS prevent_duplicate_parking_location_code
  BEFORE INSERT ON parking_locations
  FOR EACH ROW WHEN EXISTS (
    SELECT 1 FROM parking_locations WHERE day_id = NEW.day_id AND code = NEW.code
  )
  BEGIN
    SELECT RAISE(ABORT, 'Duplicate parking code within a day.');
  END;

  CREATE TRIGGER IF NOT EXISTS prevent_changed_duplicate_parking_location_code
  BEFORE UPDATE OF day_id, code ON parking_locations
  FOR EACH ROW WHEN (NEW.day_id <> OLD.day_id OR NEW.code <> OLD.code)
    AND EXISTS (
      SELECT 1 FROM parking_locations
      WHERE day_id = NEW.day_id AND code = NEW.code AND id <> OLD.id
    )
  BEGIN
    SELECT RAISE(ABORT, 'Duplicate parking code within a day.');
  END;
`);

export function getDb() {
  return db;
}

export function closeDb() {
  db.close();
}
