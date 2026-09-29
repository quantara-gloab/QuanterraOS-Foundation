# BTC Candle-Feature Test Preregistration

Status: fixed before the next analysis run.

- Dataset: existing `data/kalshi-btc15m-candles.csv`
- Series: `KXBTC15M`
- Entry: minute 4
- Split: chronological midpoint; first half trains, second half is held out
- Features: YES spread width (`yes_ask - yes_bid`) and one-minute volume
- Threshold: feature median learned from training half only
- For each feature, compare held-out YES outcome rates for low-feature versus high-feature markets
- Direction rule: the training-half group with the higher YES rate defines the held-out prediction for that feature group
- Trading price: YES ask for a YES prediction; `1 - yes_bid` for a NO prediction
- Fee: `0.07 * entry_price * (1 - entry_price)`
- No feature sweep, threshold sweep, or post-hoc selection is permitted
- Order-book depth is not tested because candle data has no bid/ask sizes
