# BTC 15-Minute Feature Test Preregistration

Status: fixed before the next analysis run.

## Hypothesis

At a minute-4 entry, the sign of the prior five-minute BRTI return contains useful information about the KXBTC15M settlement direction when recent realized volatility is elevated.

## Strategy

- Asset/series: BTC / `KXBTC15M`
- Entry: minute 4 after market open
- Feature window: BRTI observations in the five minutes ending at the minute-4 entry timestamp
- Direction: predict `YES` when the latest BRTI value is above the first BRTI value in that window; otherwise predict `NO`
- Volatility filter: trade only when five-minute realized volatility is at or above the median five-minute realized volatility calculated from the training half
- Realized volatility: standard deviation of one-minute log returns within the five-minute BRTI window; no annualization
- Entry price: YES ask for a YES prediction; `1 -` NO-side bid proxy (`1 - yes_bid`) for a NO prediction
- Fees: `0.07 * entry_price * (1 - entry_price)`
- Outcome: Kalshi market `result` (`yes` or `no`)

## Evaluation Protocol

1. Sort settled markets chronologically by close time.
2. Split once at the midpoint: first half is training, second half is held out.
3. Learn only the volatility median from the training half.
4. Evaluate the fixed minute-4 strategy once on the untouched held-out half.
5. Report number of eligible trades, win rate, average net profit per contract, total net profit, and skipped markets.

No minute sweep, threshold sweep, or alternative entry time is permitted in this test. Candle data contains no bid/ask sizes, so order-book depth imbalance is not tested.
