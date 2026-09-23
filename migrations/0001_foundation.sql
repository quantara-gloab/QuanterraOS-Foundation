-- QuanterraOS foundation migration.
-- Assumes founder_audit, founder_controls, research_observations already
-- exist (per the 2026-09-20 merge patch's notes). This migration adds:
--   1. Outcome resolution (research_resolutions, research_resolution_history)
--   2. Currency-index ingestion (exchange_ticks, composite_index_ticks)
--   3. The edge-score product table (edge_scores)
-- Verify table/column names against your real schema before running.

CREATE TABLE IF NOT EXISTS `research_resolutions` (
  `owner` text NOT NULL,
  `contract` text NOT NULL,
  `outcome` text NOT NULL,
  `official_source` text NOT NULL,
  `resolved_at` text NOT NULL,
  `correction_of` text,
  `correction_reason` text,
  `finalized` integer NOT NULL DEFAULT 1,
  PRIMARY KEY (`owner`, `contract`)
);

CREATE TABLE IF NOT EXISTS `research_resolution_history` (
  `id` text PRIMARY KEY NOT NULL,
  `owner` text NOT NULL,
  `contract` text NOT NULL,
  `outcome` text NOT NULL,
  `official_source` text NOT NULL,
  `resolved_at` text NOT NULL,
  `reason` text,
  `finalized` integer NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS `resolution_history_owner_contract`
  ON `research_resolution_history` (`owner`, `contract`);

CREATE TABLE IF NOT EXISTS `exchange_ticks` (
  `id` text PRIMARY KEY NOT NULL,
  `venue` text NOT NULL,
  `asset` text NOT NULL,
  `price` real NOT NULL,
  `volume` real NOT NULL,
  `observed_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `exchange_ticks_asset_time`
  ON `exchange_ticks` (`asset`, `observed_at`);

CREATE TABLE IF NOT EXISTS `composite_index_ticks` (
  `id` text PRIMARY KEY NOT NULL,
  `asset` text NOT NULL,
  `composite_price` real NOT NULL,
  `venues_used` integer NOT NULL,
  `venues_rejected` integer NOT NULL DEFAULT 0,
  `computed_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `composite_index_asset_time`
  ON `composite_index_ticks` (`asset`, `computed_at`);

CREATE TABLE IF NOT EXISTS `edge_scores` (
  `id` text PRIMARY KEY NOT NULL,
  `owner` text NOT NULL,
  `contract` text NOT NULL,
  `bucket` text NOT NULL,
  `fair_probability` real NOT NULL,
  `breakeven_probability` real NOT NULL,
  `edge` real NOT NULL,
  `flagged` integer NOT NULL,
  `market_ask` real NOT NULL,
  `fee_estimate` real NOT NULL,
  `computed_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `edge_scores_owner_contract`
  ON `edge_scores` (`owner`, `contract`);
CREATE INDEX IF NOT EXISTS `edge_scores_bucket`
  ON `edge_scores` (`bucket`);
