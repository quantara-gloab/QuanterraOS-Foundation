-- Authenticated order-book snapshots for feature research.
CREATE TABLE IF NOT EXISTS `orderbook_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `asset` text NOT NULL,
  `market_ticker` text NOT NULL,
  `captured_at` integer NOT NULL,
  `best_yes_price` real,
  `best_no_price` real,
  `best_yes_size` real,
  `best_no_size` real,
  `top_imbalance` real,
  `depth_imbalance` real,
  `yes_levels_json` text NOT NULL,
  `no_levels_json` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `orderbook_snapshots_asset_market_time`
  ON `orderbook_snapshots` (`asset`, `market_ticker`, `captured_at`);
