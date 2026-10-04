CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  predicted_prob REAL NOT NULL,
  model_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  outcome TEXT,
  brier_score REAL,
  settled_at TEXT,
  is_replay INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS predictions_market_id_idx ON predictions(market_id);
CREATE INDEX IF NOT EXISTS predictions_status_idx ON predictions(status);
CREATE INDEX IF NOT EXISTS predictions_is_replay_idx ON predictions(is_replay);
CREATE INDEX IF NOT EXISTS predictions_timestamp_idx ON predictions(timestamp);
