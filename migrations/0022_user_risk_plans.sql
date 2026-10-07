CREATE TABLE IF NOT EXISTS user_risk_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  daily_max_outlay REAL NOT NULL DEFAULT 50.0,
  single_trade_max_outlay REAL NOT NULL DEFAULT 25.0,
  max_concurrent_positions INTEGER NOT NULL DEFAULT 3,
  correlated_market_alert INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS user_risk_plans_user_id_idx ON user_risk_plans(user_id);
