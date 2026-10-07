-- 0023_journal_details_and_feedback.sql
-- Enables decision action marking (skipped, paper_trade, actual_trade),
-- user reasoning edits, example check segregation, and beta feedback collection.

ALTER TABLE user_decision_journal ADD COLUMN decision_action TEXT NOT NULL DEFAULT 'paper_trade';
ALTER TABLE user_decision_journal ADD COLUMN reasoning TEXT;
ALTER TABLE user_decision_journal ADD COLUMN is_example INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS beta_feedback (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  app_version TEXT NOT NULL DEFAULT '0.1.0-pilot',
  category TEXT NOT NULL,
  comment TEXT NOT NULL,
  device_info TEXT,
  contact_email TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS beta_feedback_created_at_idx ON beta_feedback (created_at);
