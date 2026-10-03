-- Paper-trade log for the high/low barrier model.
-- Every BUY/SKIP decision is recorded unconditionally so the track record
-- shows flag rate alongside hit rate. Mirrors falcon_recommendations'
-- "log always, score later" convention.
CREATE TABLE IF NOT EXISTS `paper_trades` (
  `id` text PRIMARY KEY NOT NULL,
  `owner` text NOT NULL,
  `contract` text NOT NULL,
  `model_probability` real NOT NULL,
  `model_source` text NOT NULL, -- 'quant' | 'jev'
  `barrier_type` text NOT NULL, -- 'high' | 'low'
  `side` text,                  -- 'yes' | 'no' | null (null = skip)
  `decision` text NOT NULL,     -- 'buy' | 'skip'
  `entry_price` real,           -- null when skipped
  `breakeven_probability` real NOT NULL,
  `edge` real NOT NULL,
  `fee_estimate` real NOT NULL,
  `rationale` text NOT NULL,
  `evidence_json` text NOT NULL,
  `status` text NOT NULL DEFAULT 'proposed', -- 'proposed' | 'resolved'
  `resolved_at` text,
  `outcome` text,               -- 'YES' | 'NO' | 'VOID' | null
  `brier_score` real,
  `pnl` real,
  `created_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `paper_trades_owner_contract`
  ON `paper_trades` (`owner`, `contract`);

CREATE INDEX IF NOT EXISTS `paper_trades_status`
  ON `paper_trades` (`status`);
