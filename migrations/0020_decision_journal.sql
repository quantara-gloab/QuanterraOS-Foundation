-- Migration 0020: User Decision & Outcome Journal
-- Supports the complete consumer acquisition flow: check -> register -> save -> journal

CREATE TABLE IF NOT EXISTS user_decision_journal (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  venue TEXT NOT NULL,
  contract_ticker TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'binary_above_below',
  side TEXT NOT NULL DEFAULT 'yes',
  pricing_basis TEXT NOT NULL DEFAULT 'executable_ask',
  contract_price REAL NOT NULL,
  contract_count INTEGER NOT NULL DEFAULT 1,
  purchase_cost REAL NOT NULL,
  exchange_fee REAL NOT NULL,
  half_spread_drag REAL NOT NULL DEFAULT 0.0,
  total_drag REAL NOT NULL,
  breakeven_win_prob REAL NOT NULL,
  assessed_win_prob REAL NOT NULL,
  net_expected_value REAL NOT NULL,
  settlement_source TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'saved_check',
  outcome TEXT,
  realized_pnl REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS user_decision_journal_user_id_idx ON user_decision_journal(user_id);
CREATE INDEX IF NOT EXISTS user_decision_journal_created_at_idx ON user_decision_journal(created_at);
