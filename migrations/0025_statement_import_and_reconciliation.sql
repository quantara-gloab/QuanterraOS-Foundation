-- 0025_statement_import_and_reconciliation.sql
-- Statement import, duplicate prevention, and reconciliation for Kalshi exports.
-- Preserves original user-entered check values while attaching verified statement figures.

CREATE TABLE IF NOT EXISTS imported_statement_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  external_trade_id TEXT,
  fingerprint TEXT NOT NULL,
  venue TEXT NOT NULL DEFAULT 'kalshi',
  contract_ticker TEXT NOT NULL,
  side TEXT NOT NULL DEFAULT 'yes',
  action TEXT NOT NULL DEFAULT 'buy',
  quantity INTEGER NOT NULL,
  fill_price REAL NOT NULL,
  fees REAL NOT NULL,
  total_cost REAL NOT NULL,
  exit_proceeds REAL,
  realized_pnl REAL,
  settled INTEGER NOT NULL DEFAULT 1,
  executed_at TEXT NOT NULL,
  matched_journal_id TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'imported',
  raw_csv_row TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS imported_stmt_user_id_idx ON imported_statement_records (user_id);
CREATE INDEX IF NOT EXISTS imported_stmt_fingerprint_idx ON imported_statement_records (fingerprint);
CREATE INDEX IF NOT EXISTS imported_stmt_batch_id_idx ON imported_statement_records (batch_id);
CREATE INDEX IF NOT EXISTS imported_stmt_matched_journal_idx ON imported_statement_records (matched_journal_id);

ALTER TABLE user_decision_journal ADD COLUMN reconciliation_status TEXT DEFAULT 'user_entered';
ALTER TABLE user_decision_journal ADD COLUMN matched_statement_id TEXT;
ALTER TABLE user_decision_journal ADD COLUMN statement_reconciled_at TEXT;
ALTER TABLE user_decision_journal ADD COLUMN original_contract_price REAL;
ALTER TABLE user_decision_journal ADD COLUMN original_contract_count INTEGER;
ALTER TABLE user_decision_journal ADD COLUMN original_exchange_fee REAL;
