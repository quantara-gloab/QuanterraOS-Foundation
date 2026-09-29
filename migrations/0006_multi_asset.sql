-- Add asset identity to the existing BTC-era tables without invalidating prior rows.
ALTER TABLE `btc_index_ticks` ADD COLUMN `asset` text NOT NULL DEFAULT 'BTC';
ALTER TABLE `exchange_prices` ADD COLUMN `asset` text NOT NULL DEFAULT 'BTC';
ALTER TABLE `market_outcomes` ADD COLUMN `asset` text NOT NULL DEFAULT 'BTC';

CREATE INDEX IF NOT EXISTS `btc_index_ticks_asset_received_at`
  ON `btc_index_ticks` (`asset`, `received_at`);
CREATE INDEX IF NOT EXISTS `exchange_prices_asset_fetched_at`
  ON `exchange_prices` (`asset`, `fetched_at`);
CREATE INDEX IF NOT EXISTS `market_outcomes_asset_close_time`
  ON `market_outcomes` (`asset`, `close_time`);