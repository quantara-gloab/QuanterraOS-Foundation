CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_tier_idx ON users(tier);
CREATE INDEX IF NOT EXISTS users_stripe_cust_idx ON users(stripe_customer_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'institutional',
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys(key_hash);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  stripe_event_id TEXT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS billing_events_user_id_idx ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS billing_events_type_idx ON billing_events(event_type);
