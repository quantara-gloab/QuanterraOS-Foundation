-- Council pipeline coordination runs.
-- Every execution of the 8-agent council pipeline is logged here unconditionally,
-- providing a persistent, auditable record of agent coordination, health,
-- telemetry, and Lion's synthesized calibration verdict.
CREATE TABLE IF NOT EXISTS `council_pipeline_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `run_at` text NOT NULL,
  `cycle_number` integer NOT NULL,
  `lion_verdict` text NOT NULL,
  `lion_verdict_code` text NOT NULL,
  `market_calibrated` integer NOT NULL DEFAULT 1,
  `signal_validated` integer NOT NULL DEFAULT 0,
  `execution_authorized` integer NOT NULL DEFAULT 0,
  `phoenix_status` text NOT NULL,
  `draco_status` text NOT NULL,
  `wolf_status` text NOT NULL,
  `falcon_status` text NOT NULL,
  `quantum_fox_status` text NOT NULL,
  `sentinel_status` text NOT NULL,
  `kraken_status` text NOT NULL,
  `market_ticker` text,
  `market_quote_json` text,
  `all_agents_json` text NOT NULL,
  `created_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `council_pipeline_runs_run_at`
  ON `council_pipeline_runs` (`run_at`);

CREATE INDEX IF NOT EXISTS `council_pipeline_runs_cycle`
  ON `council_pipeline_runs` (`cycle_number`);
