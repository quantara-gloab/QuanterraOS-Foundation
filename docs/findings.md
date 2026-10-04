# KXBTC15M Research Findings Baseline

Status: baseline assembled from the recorded analyses through 2026-09-26. No tested rule below has established positive, tradable held-out expectancy. The order-book result is not part of this baseline: its earlier 27-market run used an incorrectly extracted bid and is void.

## Method and Evidence Limits

The candle-feature preregistration used 712 settled KXBTC15M markets, minute-4 entry quotes, chronological midpoint train/held-out split, thresholds learned on training data, actual YES/NO asks, and the fee approximation `0.07 * price * (1 - price)`. The minute sweep tested 15 offsets and reported Bonferroni alpha `0.05 / 15 = 0.003333`.

The saved analysis record does not include a bootstrap interval for every feature. Intervals are included below only where the recorded run supplies them. Volume and spread-width results should be treated as small point estimates, not formal evidence of equivalence. The volatility run had no eligible overlapping data and is unevaluable, not a negative finding. The latency capture was an executable-event study, not a chronological held-out experiment.

## Hypotheses

### 1. Market-price direction at a fixed entry minute

At minute 13, predict YES when the market midpoint is at least 0.50, otherwise NO. Across the 712-market historical set, this achieved a 90.73% win rate but lost `$0.006025` per contract (`-$4.289453` total) after fees. With fees removed it still lost `$0.001424` per contract (`-$1.014` total). The high hit rate reflects an already-expensive market price; it does not imply positive expectancy.

### 2. Minute-of-cycle timing

An exploratory sweep over 15 entry minutes selected minutes 4 and 9 on the full sample, with totals of `+$6.148986` and `+$5.696844`. That selection is not an out-of-sample result. In the chronological first-half sweep, minutes 4 and 6 were selected instead. Minute 4's second-half total was `+$5.678914` (`+$0.015952` per contract); minute 6's was `+$2.337819` (`+$0.006567` per contract). Bootstrap intervals computed on the full sample were `[-$16.995625, +$30.210596]` for minute 4 and `[-$13.441985, +$24.660828]` for minute 9. Both include zero, and neither met the 15-test Bonferroni threshold. The selected minute was unstable and the apparent gains were too uncertain.

### 3. Short-window volatility direction

The preregistered test required live BRTI volatility overlapping the historical candle markets. The candle set had 712 markets, but the BRTI collector began later: training and held-out both had 0 eligible markets (356 skipped each), and the learned threshold was null. This test produced no statistic and supports no conclusion. Kalshi's candle response also lacks the bid/ask sizes needed to test depth imbalance.

### 4. Entry-minute volume

On 356 held-out markets, the training-only median volume threshold was `106,540.375`. Held-out win rate was 50.28%, average profit was `-$0.006731` per contract, and total profit was `-$2.396098`. No bootstrap interval was preserved in the result record; the observed loss is small and is not by itself proof of negative expectancy.

### 5. Entry-minute spread width

The training-only median was `$0.01`. Training YES-outcome rates were 62.50% in the low-width group and 50.97% in the high-width group. On 356 held-out markets, win rate was 50.28%, average profit was `+$0.001157` per contract, and total profit was `+$0.411966`. This near-zero total is not meaningful evidence of an edge; no bootstrap interval was preserved in the result record.

### 6. Coinbase short-term momentum / lead-lag

The public Coinbase candle proxy used the one-minute close-to-close move before the minute-4 boundary; it is not the originally desired 10-30-second signal. With an assumed `$0.50` entry, held-out win rate was 57.30% (204/356), average profit `+$0.055534`, total `+$19.77`. Repricing with actual Kalshi asks changed the held-out result to `-$0.025719` per contract and `-$9.15609` total. The 1,000-resample 95% bootstrap interval was `[-$26.52792, +$8.787456]`. The directional proxy did not demonstrate tradable expectancy after actual entry costs.

### 7. Measured repricing latency

The event study matched 1,101 Coinbase moves to Kalshi quotes. Average observed lag was about 516 ms. Positive mark-to-ask movement occurred in 35.15% of events; only 23.52% were positive before fees after crossing the spread, and 12.62% were positive after fees. Mean executable net was `-$0.019789` per event, total `-$21.78782`. This was not a held-out test and no bootstrap interval was reported. It demonstrates measurable delay, not an executable trading edge after spread and fees.

### 8. Falcon (order-book imbalance heuristic) backtest

`src/falcon-backtest.ts` scored Falcon's fixed depth/top-imbalance heuristic against every settled BTC 15-minute market whose entry-minute order-book evidence exists in the clean (post-bugfix) collection window. Falcon has no parameters fit to this data, so no train/held-out split was needed; `computeFalconRecommendation()` never receives the settlement outcome.

Sample size is small and the limitation is structural, not withheld: Kalshi's candlestick history has no order-book depth data at all, so this backtest can only use snapshots gathered since the corrected collector started (`2026-09-26T13:10:27.689Z`), about 4.5 hours as of the initial run. Of 1,324 settled BTC markets considered, 1,293 were skipped due to lack of pre-cutoff book evidence, leaving 31 markets with clean entry-minute snapshots (`reports/falcon-backtest-2026-10-03.txt`, covering 2026-09-26T13:30:00Z to 2026-09-29T01:00:00Z).

**Result over those 31 markets (sample grown from preliminary n=6 to n=31):**
- Falcon average Brier score: **`0.2736`**
- Naive always-50% coin-flip baseline: **`0.2500`**
- Naive market entry-price baseline: **`0.2106`**

The result got worse, not better. Falcon now underperforms **both** baselines—it is less calibrated than random chance (0.2500) and significantly worse than the market's own entry price (0.2106). Alongside the preliminary caveat that n=31 remains too small to be statistically definitive (Falcon remains strictly research-only), the early empirical read is not merely inconclusive—it is actively negative and trending in the wrong direction. Building automated execution or second agents on this imbalance heuristic is not supported. Falcon's role remains strictly restricted to order-book depth monitoring for research, with zero live capital deployment authorized.

### 9. Market-price-as-probability baseline (properly powered)

The Falcon backtest's naive-entry-price baseline badly beat both Falcon and a coin flip, which raised the question of whether the raw market price is itself well-calibrated. `src/market-price-baseline-backtest.ts` tests that directly at a real sample size, using only recorded candlestick history (no order-book depth needed) and reusing `scoreObservation`/`computeCalibrationCurve` for direct comparability with the terminal's human-forecast view.

**Premise correction**: the request asked for this against "all 1,102 settled BTC markets," but only 712 unique markets had recorded price history in the initial `data/kalshi-btc15m-candles.csv`; the other ~390 settled markets in `market_outcomes` had a result but no recorded candle export anywhere in this project. That initial baseline honestly covered 712, not 1,102 — that gap was a real data-coverage limit, not a shortcut.

Using the minute-4 entry mid-price (`(yes_bid + yes_ask) / 2`, the same entry point used throughout this project's other candle tests) as the probability estimate, over all 712 eligible markets: **average Brier score `0.1988`**, clearly better than the naive always-50% baseline (`0.25`) and dramatically better than every trading-rule result in sections 1–8. The 10-bin calibration curve is tight across the well-populated middle bins (e.g. 40–50% bin: 121 markets, actual YES rate 39.7%; 60–70% bin: 104 markets, actual YES rate 66.3%; 70–80% bin: 87 markets, actual YES rate 75.9%), with more noise only in the thin tail bins (n=9 and n=10).

**What this means for the product, stated plainly**: the market's own price is already close to well-calibrated. That makes "our AI predicts better than the market" a much harder, and currently unsupported, bar (see sections 1–8 and the Falcon result above). It does *not* undercut the project's other real thesis — a kept, auditable record proving the price is verifiably reliable (the "Confidence Calibration / Outcome Resolution" idea this project is already built around) — if anything, this result is evidence *for* that thesis, not against it. This is a different, and better-supported, pitch than "we beat the market," and should be treated as the stronger claim going forward unless a future feature test overturns it.

This result neither validates nor invalidates Falcon specifically — it is a separate, better-powered data point about where the real edge (if any) actually lives.

#### 9b. Same baseline at full coverage (n=1,316, run 2026-09-28)

The n=712 result above is kept as recorded; this is an additional run, not a replacement.

**Sample-size correction**: By the time historical data collection was completed, the canonical corpus reached **1,316 of 1,332 theoretical 15-minute windows (16 missing)** (`data/kalshi-btc15m-candles.csv`, spanning 2026-09-15T02:00:00Z to 2026-09-28T22:45:00Z, with 19,740 1-minute rows as audited in `reports/csv-range-2026-10-03.txt`).

**How the data was completed (additive, provenance-preserving)**: `scripts/kalshi-fill-missing-candles.mjs` fetched 1-minute candles only for the 604 settled markets with no CSV rows and appended them (9,060 rows) to `data/kalshi-btc15m-candles.csv`. It fetched 604 of 604 markets, with 0 empty, 0 failed and 0 mismatches between the API result and the `market_outcomes` result. Ticker count after the append: 1,316 = DB settled count (shortfall 0). The pre-append file is saved as `data/kalshi-btc15m-candles.backup-2026-09-28-n712.csv`. It is a byte-identical prefix of the new CSV, and rerunning the backtest on it still gives n=712, Brier `0.1988`.

The method is unchanged: minute-4 entry mid-price, with only candles before the market's own close eligible. Over all 1,316 markets (0 skipped for a missing entry candle): **average Brier score `0.2001`**. That is essentially the same as the n=712 result and still clearly better than the always-50% baseline (`0.25`).

| Price bin | Markets | Actual YES rate |
|---|---|---|
| 0–10% | 18 | 11.1% |
| 10–20% | 79 | 19.0% |
| 20–30% | 150 | 20.0% |
| 30–40% | 183 | 33.3% |
| 40–50% | 211 | 43.6% |
| 50–60% | 187 | 58.8% |
| 60–70% | 211 | 64.9% |
| 70–80% | 157 | 77.1% |
| 80–90% | 101 | 89.1% |
| 90–100% | 19 | 89.5% |

Every bin's actual YES rate falls within or just beside its price range. The one mild miss is the 20–30% bin (20.0%, at the bottom edge), and the thin tails (n=18, n=19) remain the noisiest. The conclusion in section 9 holds at the larger sample: the market's entry price is close to well-calibrated.

### 10. Fair-value (lognormal digital) model vs. market price (n=1,316 of 1,332 theoretical windows, 16 missing)

**Settlement rules (verified):** a market settles YES when the BRTI 60-second average at close is ≥ the strike; this matched the result on all 58 settled markets with BRTI coverage. The strike is the BRTI 60-second average at open (median difference $0.10 over the same 58).

`src/btc15m-predictor-backtest.ts` scores P(YES) = Φ(ln(S/K) / (σ√τ)), where σ is the realized volatility of 1-minute log returns over the trailing 60 minutes across the canonical corpus of 1,316 windows (`reports/btc15m-predictor-backtest-2026-10-03.txt`).
- It has no fitted parameters.
- BRTI covers only 58 settled markets, so the backtest uses Coinbase 1-minute closes (`data/coinbase-btc-1m.csv`), a BRTI constituent, and measures S against the Coinbase price at open.

| Minute | Market Brier | Model Brier | 50/50 blend | Trade when model EV > 0 (avg ¢/contract after fee) |
|---|---|---|---|---|
| 4 | 0.2001 | 0.2063 | 0.2020 | −2.15¢ (n=1,027) |
| 7 | 0.1685 | 0.1755 | 0.1707 | −1.88¢ (n=1,057) |
| 10 | 0.1248 | 0.1333 | 0.1273 | −0.92¢ (n=1,173) |
| 13 | 0.0731 | 0.0835 | 0.0754 | +0.42¢ (n=1,127) |

The market beats the model at every minute and in both the older and newer halves. Blending with the model makes the market worse, not better. Trading where the model disagrees with the market loses money, except for a small +0.42¢ at minute 13. That one positive number was picked out of four tested minutes and has not been checked on held-out data, so it is not evidence of an edge.

**Consequence:** the internal `/fair-value/btc15m` research tool (not a subscriber page) leads with the market mid-price as its probability and shows the model only as a cross-check.

### 11. Fitted fair-value model, chronological held-out (n=1,316, run 2026-09-28)

`src/btc15m-fitted-model-test.ts` fits the section 10 model instead of using the fixed formula. It is a ridge-regularized logistic regression on three inputs: z = ln(S/S_open)/(σ√τ), ln(S/S_open), and σ (Coinbase 1-minute closes up to the checkpoint, no lookahead). Two variants were fitted:
- **A** uses those three features alone.
- **B** adds logit(market mid), to test whether the features carry information the price doesn't already have.

**Validation:** markets are split by open time, never randomly.
- **Walk-forward:** five folds, each trained on the first 50/60/70/80/90% and tested on the next 10%; the pooled held-out set is 658 markets.
- **Plain split:** a 50/50 train/test split is reported alongside.
- **Bootstrap:** 95% CIs use 2,000 resamples for each of seeds 1–5, and the widest interval is reported. The fit is deterministic (Newton/IRLS), so the seeds apply to resampling, not to the fit itself.

**Verdict rule, fixed before running:**
- **tradable:** beats market Brier on every fold, *and* the pooled Brier-difference CI is below 0, *and* the pooled after-fee profit CI is above 0.
- **not proven:** beats the market on pooled Brier but fails any of the above.
- **no edge:** does not beat the market on pooled Brier.

| Minute | Market Brier (pooled held-out) | A: fitted features | A folds beating market | B: features + market | B folds beating market | Verdict (A / B) |
|---|---|---|---|---|---|---|
| 4 | 0.1987 | 0.2077 (diff CI +0.0041…+0.0139) | 1/5 | 0.1992 (CI −0.0015…+0.0025) | 2/5 | no edge / no edge |
| 7 | 0.1644 | 0.1742 (CI +0.0046…+0.0149) | 0/5 | 0.1647 (CI −0.0011…+0.0018) | 3/5 | no edge / no edge |
| 10 | 0.1194 | 0.1308 (CI +0.0063…+0.0168) | 0/5 | 0.1200 (CI −0.0006…+0.0019) | 1/5 | no edge / no edge |
| 13 | 0.0668 | 0.0826 (CI +0.0085…+0.0234) | 0/5 | 0.0690 (CI +0.0003…+0.0042) | 1/5 | no edge / no edge |

Held-out trading on the model's positive-EV signals (at the asks, after fees) had a negative average at every checkpoint for both variants:
- **A:** −4.03, −2.64, −2.60 and −0.66¢ per contract at minutes 4, 7, 10 and 13.
- **B:** −2.37, −0.97, −1.75 and −1.10¢.

Every profit CI includes zero or sits mostly below it. The unfitted section 10 model's +0.42¢ at minute 13 does not survive held-out testing (A: −0.66¢, B: −1.10¢).

**Reading:**
- Fitting the distance/volatility/time features makes them clearly *worse* than the market price out of sample (A's CIs are entirely above 0).
- Adding them to the market price (B) is statistically indistinguishable from the price alone, at best, and slightly worse at minute 13. They add no usable information.
- Together with sections 9–10, this further supports the market price itself being the calibrated product. A model built on these features does not beat it.
- The `/fair-value/btc15m` page is unchanged by this result.

### 12. Sudden Price-Swing Event Backtest (Quantum Fox, n=131 settled events, run 2026-10-04)

Context: A dramatic Kalshi 15m BTC market percentage swing was observed live but not acted on, per findings.md's established bar: no tested rule has beaten the market's own price out of sample (sections 1–11), and ad hoc reactions to price moves (section 1) lost money despite high win rates. Rather than trading this swing, we turned it into a logged, empirical test case (`data/swing-events.csv`, capturing moves >= ±8 percentage points in yes-price within a 5-minute window).

Of 245 total logged swing events spanning 2026-09-26T06:29:06Z to 2026-10-03T17:35:02Z, 131 had settled outcomes in the clean collection window (`reports/swing-event-backtest-2026-10-04.txt`).

Two candidate execution rules were evaluated:
- **Momentum (Continuation):** Follow the swing (Buy YES on upward swing, Buy NO on downward swing at post-swing price).
- **Fade (Mean Reversion):** Counter the swing (Buy NO on upward swing, Buy YES on downward swing).
- **Benchmark:** The market's own post-swing price as probability.

Validation standard (matching section 11):
- 5-fold walk-forward split (50%, 60%, 70%, 80%, 90% train; next 10% test, pooled held-out n=66).
- Chronological 50/50 split (65 train, 66 test).
- Kalshi taker fee: `0.07 * p * (1 - p)`.
- 2,000 bootstrap resamples across seeds 1–5 (widest 95% interval reported).
- Verdict rule matching section 11: tradable only if beats market Brier on every fold AND pooled Brier-difference CI < 0 AND pooled profit CI > 0.

| Rule | Full Sample Win Rate (n=131) | Full Sample Net Profit (¢/contract) | Walk-Forward Folds Beating Market | Pooled Held-Out Market Brier | Pooled Held-Out Rule Brier | Pooled Profit 95% CI (¢/contract) | Verdict |
|---|---|---|---|---|---|---|---|
| **Momentum** | 75.57% (99/131) | +12.72¢ | 2/5 | 0.1838 | 0.1863 | −6.70¢ … +14.66¢ | **no edge** |
| **Fade** | 24.43% (32/131) | −15.37¢ | 0/5 | 0.1838 | 0.3083 | −17.19¢ … +4.15¢ | **no edge** |

**Reading:**
- Like section 1 (minute-13 momentum), following a sudden price swing exhibits an apparent high hit rate (75.6%) in-sample because the contract is already expensive, but out-of-sample walk-forward testing demonstrates that the market's own post-swing price beats the momentum rule on Brier score (0.1838 vs. 0.1863), and the held-out profit interval spans zero (`[-$0.06695, +$0.14662]`).
- Mean reversion (fading the swing) performs worse than random chance, losing on 0 of 5 folds with an average loss of over 15¢ per contract.
- The market rapidly incorporates information during sudden swings. Neither chasing nor fading price swings beats the calibrated market price. Phoenix execution gate remains strictly locked.

## Data-Quality Notes

Coinbase's dashboard wrong-direction rate (50.37%, vs. 35.43% for Kraken) was not a code bug: `exchange-price-poller.mjs` originally used Coinbase's `/v2/prices/{product}/spot` endpoint, which returned an identical stale price on 84.6% of 5-second polls, versus 46.2% for Kraken's live ticker. Fixed by switching Coinbase to the live Exchange ticker endpoint (`api.exchange.coinbase.com/products/{product}/ticker`). Rows collected before this fix remain noisy and should not be used to judge Coinbase divergence.

## Current Interpretation

The historical evidence does not support a profitable BTC 15-minute rule among these candidates. The evidence is strongest where the result includes actual executable prices; apparent direction accuracy alone was repeatedly insufficient. Keep the original data window and methodology attached to any future comparison. In particular, exclude every order-book snapshot captured before the corrected best-bid extraction became active, and do not reuse the void 27-market result.