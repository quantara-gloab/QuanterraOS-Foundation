-- Settled Kalshi KXBTCD market outcomes used for direction backtests.
CREATE TABLE IF NOT EXISTS `market_outcomes` (
  `id` text PRIMARY KEY NOT NULL,
  `market_ticker` text NOT NULL UNIQUE,
  `strike_price` real,
  `open_time` integer NOT NULL,
  `close_time` integer NOT NULL,
  `result` text NOT NULL,
  `fetched_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `market_outcomes_close_time`
  ON `market_outcomes` (`close_time`);
