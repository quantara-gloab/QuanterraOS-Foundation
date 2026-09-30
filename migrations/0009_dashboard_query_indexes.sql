CREATE INDEX IF NOT EXISTS `btc_index_ticks_asset_received_at`
  ON `btc_index_ticks` (`asset`, `received_at`);

CREATE INDEX IF NOT EXISTS `btc_index_ticks_dashboard_lookup`
  ON `btc_index_ticks` (`asset`, `received_at`, `raw_value`);