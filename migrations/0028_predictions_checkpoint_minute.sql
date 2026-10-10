-- Migration 0028: Add checkpoint_minute to predictions ledger
-- Enforces Task 2.4: One prediction per market per checkpoint (min 4/7/10/13)

ALTER TABLE predictions ADD COLUMN checkpoint_minute INTEGER;
CREATE INDEX IF NOT EXISTS predictions_market_checkpoint_idx ON predictions(market_id, checkpoint_minute);
