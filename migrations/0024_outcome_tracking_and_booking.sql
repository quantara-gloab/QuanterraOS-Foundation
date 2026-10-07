-- 0024_outcome_tracking_and_booking.sql
-- Adds detailed outcome tracking for actual trades (fill price, actual fees, exit proceeds, incompleteness tracking)
-- and consent-based beta booking requests (Interested -> Scheduled -> Observed lifecycle).

ALTER TABLE user_decision_journal ADD COLUMN actual_quantity INTEGER;
ALTER TABLE user_decision_journal ADD COLUMN actual_fill_price REAL;
ALTER TABLE user_decision_journal ADD COLUMN actual_fees REAL;
ALTER TABLE user_decision_journal ADD COLUMN exit_proceeds REAL;
ALTER TABLE user_decision_journal ADD COLUMN outcome_status TEXT DEFAULT 'pending';
ALTER TABLE user_decision_journal ADD COLUMN outcome_notes TEXT;

CREATE TABLE IF NOT EXISTS pilot_booking_requests (
  id TEXT PRIMARY KEY,
  contact TEXT NOT NULL,
  device_type TEXT NOT NULL,
  availability TEXT NOT NULL,
  consent_given INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'INTERESTED',
  scheduled_at TEXT,
  operator_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS pilot_booking_status_idx ON pilot_booking_requests (status);
CREATE INDEX IF NOT EXISTS pilot_booking_created_at_idx ON pilot_booking_requests (created_at);
