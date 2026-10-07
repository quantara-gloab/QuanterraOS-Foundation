CREATE TABLE IF NOT EXISTS pilot_observation_sessions (
  id TEXT PRIMARY KEY,
  participant_ref TEXT NOT NULL,
  channel TEXT NOT NULL,
  device TEXT NOT NULL,
  duration_minutes REAL NOT NULL,
  unassisted TEXT NOT NULL,
  assistance_details TEXT,
  persistence_status TEXT NOT NULL,
  confusion_notes TEXT,
  comprehension_cost_fee TEXT,
  comprehension_breakeven TEXT,
  comprehension_zero_alpha TEXT,
  operator_notes TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS pilot_sessions_participant_ref_idx ON pilot_observation_sessions (participant_ref);
CREATE INDEX IF NOT EXISTS pilot_sessions_created_at_idx ON pilot_observation_sessions (created_at);
