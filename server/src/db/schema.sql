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
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trips_active ON trips (is_active);
CREATE INDEX IF NOT EXISTS idx_trips_updated_at ON trips (updated_at);

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
