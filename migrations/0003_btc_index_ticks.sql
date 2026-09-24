-- Raw BTC CF Benchmarks index ticks captured from the Kalshi WebSocket feed.
CREATE TABLE IF NOT EXISTS `btc_index_ticks` (
  `id` text PRIMARY KEY NOT NULL,
  `received_at` integer NOT NULL,
  `logged_at` text NOT NULL,
  `raw_value` text NOT NULL,
  `trailing_60s_avg` text,
  `raw_json` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `btc_index_ticks_received_at`
  ON `btc_index_ticks` (`received_at`);
