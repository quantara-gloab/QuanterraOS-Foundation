-- Public BTC/USD prices captured from comparison exchanges.
CREATE TABLE IF NOT EXISTS `exchange_prices` (
  `id` text PRIMARY KEY NOT NULL,
  `exchange_name` text NOT NULL,
  `price` real NOT NULL,
  `fetched_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `exchange_prices_exchange_time`
  ON `exchange_prices` (`exchange_name`, `fetched_at`);
