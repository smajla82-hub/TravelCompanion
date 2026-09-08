CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email COLLATE NOCASE);

-- Single-use password reset tokens (FP-7). A token is only ever valid until
-- `used_at` is set or `expires_at` passes; `POST /auth/forgot-password`
-- invalidates any earlier unused tokens for the same user before issuing a
-- new one, so at most one token per user is ever usable at a time.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  travellers INTEGER NOT NULL DEFAULT 1,
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  user_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_trips_active ON trips (is_active);
CREATE INDEX IF NOT EXISTS idx_trips_updated_at ON trips (updated_at);
-- idx_trips_user_id is created in db.js after the user_id migration runs, since
-- on pre-existing (10.1-era) databases the column may not exist yet when this
-- schema file is first executed.

CREATE TABLE IF NOT EXISTS trip_members (
  trip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (trip_id, user_id),
  FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON trip_members (user_id);

-- The current online trip is a per-user preference. The legacy `trips.is_active`
-- column remains for compatibility with pre-FP-6.1 databases.
CREATE TABLE IF NOT EXISTS user_active_trips (
  user_id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_active_trips_trip_id ON user_active_trips (trip_id);

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

CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked', 'expired')),
  invited_by_user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invitations_trip_id ON invitations (trip_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations (token);

CREATE TABLE IF NOT EXISTS itinerary_days (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_id ON itinerary_days (trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_date ON itinerary_days (date);

CREATE TABLE IF NOT EXISTS itinerary_items (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  day_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  title TEXT NOT NULL,
  location TEXT,
  description TEXT,
  goal TEXT,
  activity_type TEXT,
  priority TEXT,
  parking TEXT,
  smart_chip TEXT,
  map_link TEXT,
  price TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  FOREIGN KEY (day_id) REFERENCES itinerary_days (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_id ON itinerary_items (trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_id ON itinerary_items (day_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_sort ON itinerary_items (day_id, sort_order);

-- Recommended Venues are day-scoped, matching the offline `ItineraryDay.venues`
-- domain model. There is no relationship from `itinerary_items` to a venue
-- (unlike parking), so no reference integrity beyond the day FK is needed.
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  day_id TEXT NOT NULL,
  priority TEXT,
  type TEXT,
  meal_type TEXT,
  subtype TEXT,
  name TEXT NOT NULL,
  smart_chip TEXT,
  map_link TEXT,
  recommendation TEXT,
  price TEXT,
  parking TEXT,
  reservation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  FOREIGN KEY (day_id) REFERENCES itinerary_days (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_venues_trip_id ON venues (trip_id);
CREATE INDEX IF NOT EXISTS idx_venues_day_id ON venues (day_id);
CREATE INDEX IF NOT EXISTS idx_venues_sort ON venues (day_id, sort_order);

-- Parking locations are day-scoped. `code` (e.g. "P1"-"P8") is the existing
-- offline user-facing/reference key: `itinerary_items.parking` stores the
-- same string and is matched against `parking_locations.code` within the
-- same day at read time, exactly like the offline lookup. This phase keeps
-- that string-based reference; it does not migrate to `parking_locations.id`.
CREATE TABLE IF NOT EXISTS parking_locations (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  day_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  smart_chip TEXT,
  map_link TEXT,
  price TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  FOREIGN KEY (day_id) REFERENCES itinerary_days (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parking_locations_trip_id ON parking_locations (trip_id);
CREATE INDEX IF NOT EXISTS idx_parking_locations_day_id ON parking_locations (day_id);
CREATE INDEX IF NOT EXISTS idx_parking_locations_sort ON parking_locations (day_id, sort_order);

-- Day statistics are day-scoped label/value pairs imported from the RoadBook
-- ("Statistiky"), matching the offline `ItineraryDay.stats` domain model.
-- They carry no identity of their own, so `sort_order` preserves the imported
-- order and the row id exists only as a primary key.
CREATE TABLE IF NOT EXISTS day_stats (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  day_id TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  FOREIGN KEY (day_id) REFERENCES itinerary_days (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_day_stats_trip_id ON day_stats (trip_id);
CREATE INDEX IF NOT EXISTS idx_day_stats_day_id ON day_stats (day_id);
CREATE INDEX IF NOT EXISTS idx_day_stats_sort ON day_stats (day_id, sort_order);
