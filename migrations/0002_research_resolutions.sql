-- Outcome-resolution tables. Idempotent so this can be applied to databases
-- that already received the foundation migration.

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