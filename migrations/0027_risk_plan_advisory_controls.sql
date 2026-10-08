-- Migration 0027: Risk Plan advisory controls, review reminders, cooling-off pause, and uncertainty tracking
-- Adds review reminders, cooling-off intervals, contract caps, and cooling-off timestamps.

CREATE TABLE IF NOT EXISTS user_risk_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  daily_max_outlay REAL NOT NULL DEFAULT 50.0,
  single_trade_max_outlay REAL NOT NULL DEFAULT 25.0,
  max_concurrent_positions INTEGER NOT NULL DEFAULT 3,
  correlated_market_alert INTEGER NOT NULL DEFAULT 1,
  max_contracts_per_trade INTEGER NOT NULL DEFAULT 50,
  review_reminder TEXT NOT NULL DEFAULT 'settlement',
  cooling_off_minutes INTEGER NOT NULL DEFAULT 15,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS user_risk_plans_user_id_idx ON user_risk_plans(user_id);
