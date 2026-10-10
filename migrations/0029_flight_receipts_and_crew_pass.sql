-- Migration 0029: Flight Receipts & Free Crew Pass (Flight Deck Pilot Redesign)
CREATE TABLE IF NOT EXISTS flight_receipts (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE,
  user_id TEXT,
  venue TEXT NOT NULL,
  venue_product TEXT NOT NULL,
  market_id TEXT NOT NULL,
  market_title TEXT NOT NULL,
  side TEXT NOT NULL,
  quantity TEXT NOT NULL,
  entry_price TEXT NOT NULL,
  fee TEXT NOT NULL,
  outlay TEXT NOT NULL,
  breakeven_probability TEXT NOT NULL,
  data_status TEXT NOT NULL DEFAULT 'fresh',
  quote_as_of TEXT NOT NULL,
  fee_schedule_version TEXT NOT NULL,
  rule_url TEXT NOT NULL,
  reference_status TEXT NOT NULL DEFAULT 'unknown',
  assumptions_json TEXT NOT NULL,
  sides_json TEXT NOT NULL,
  public_sharing INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS flight_receipts_public_id_idx ON flight_receipts(public_id);
CREATE INDEX IF NOT EXISTS flight_receipts_user_id_idx ON flight_receipts(user_id);
CREATE INDEX IF NOT EXISTS flight_receipts_market_id_idx ON flight_receipts(market_id);

CREATE TABLE IF NOT EXISTS crew_passes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  pass_tier TEXT NOT NULL DEFAULT 'free_crew_pass',
  selected_skin TEXT NOT NULL DEFAULT 'genesis',
  unlocked_skins_json TEXT NOT NULL,
  claimed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS crew_passes_user_id_idx ON crew_passes(user_id);
