CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_name TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
CREATE INDEX IF NOT EXISTS events_name_idx ON events(event_name);
CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events(timestamp);
