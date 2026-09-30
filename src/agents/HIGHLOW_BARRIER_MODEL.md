# High/Low Barrier Touch Model

## Purpose

`falcon-highlow.ts` evaluates Kalshi-style **one-touch high/low barrier contracts** — options that settle as long/touch (YES) if the underlying asset's running high (for a HIGH contract) or running low (for a LOW contract) crosses the strike barrier at any point before expiry.

It uses a **purely quant, no-AI pipeline**: the same deterministic Brownian first-passage model used by `falcon-jev.ts` but with the Jev AI calibration layer removed entirely, making output fully transparent and testable.

## Architecture

```
OpenHighLowContract
      │
      ▼
buildCuratedTouchFeatures()  ──► CuratedTouchFeatures
      │                            (vol surface, distance, running H/L, etc.)
      ▼
quantModelProbability         ──► HighLowRecommendation
      │                            (probability, edge, absEdge, rationale)
      ▼
oneTouchProbability()         ──► P ∈ [0, 1]
```

### Data flow

1. Caller supplies `OpenHighLowContract[]` (ticker, barrierType, strike, remainingSeconds, priceTicks).
2. `runHighLowBatch()` loops over each contract and calls `computeHighLowRecommendation()`.
3. Each recommendation calls `buildCuratedTouchFeatures()` (from `falcon-jev.ts`) which:
   - Computes **realized volatility** from price ticks (per-second, per-minute, annualized).
   - Extracts **current price**, **running high**, **running low** from tick history.
   - Computes **distance-to-strike** in dollars, basis points, and log-space standard deviations.
   - Checks **alreadyTouched** — whether the running high/low already crossed the barrier.
   - Calls `oneTouchProbability()` for the quant baseline when the barrier hasn't been touched.
4. `computeHighLowRecommendation()` maps the quant probability to:
   - `edge = probability - 0.5` (signed).
   - `absEdge = |edge|` (used for ranking).
5. `runHighLowBatch()` sorts results by `absEdge` descending, splits into `alreadyTouched`, `flagged`, and `skipped`.

## Mathematical Model

### Brownian Motion with Drift

The underlying price is modeled as a geometric Brownian motion:

```
S(t) = S₀ · exp((μ - σ²/2)·t + σ·W(t))
```

Where:
- `S₀` — current price (latest tick)
- `μ` — drift rate (defaults to 0 in falcon-highlow, no drift signal used)
- `σ` — realized volatility (per-second, estimated from log returns)
- `W(t)` — standard Brownian motion

### Reflection Principle (Driftless Case)

For zero-drift Brownian motion, every path that reaches barrier `b` and ends below `b` has a one-to-one reflected counterpart that ends above `b`. The one-touch probability is:

```
P(touch | drift = 0) = 2 · Φ( d )    where d = -|ln(K/S₀)| / (σ·√T)
                     = 2 · (1 - Φ( |ln(K/S₀)| / (σ·√T) ))
```

Where:
- `K` — strike barrier
- `S₀` — current price
- `σ` — per-second realized volatility
- `T` — remaining seconds
- `Φ` — standard normal CDF

The factor of 2 arises because touch can occur on either the "going up" or "going down" leg of the random walk before the final time.

### Generalized First-Passage Formula (With Drift)

When drift `μ` is non-zero and directed toward the barrier:

```
P(τ_b ≤ T) = Φ( (-b + μ·T) / (σ·√T) ) + exp( 2·μ·b / σ² ) · Φ( (-b - μ·T) / (σ·√T) )
```

Where `b = |ln(K/S₀)|` is the log-distance to the barrier.

The second term `exp(2·μ·b/σ²) · Φ(⋯)` is the **reflection correction** accounting for paths that cross the barrier, reflect, and cross back. The exponential factor weights these reflected paths.

### Edge Cases

| Condition | Return |
|---|---|
| `currentPrice >= strike` (HIGH barrier) | `1.0` — already touched |
| `currentPrice <= strike` (LOW barrier) | `1.0` — already touched |
| `runningHigh >= strike` (from tick history) | `1.0` — already touched |
| `runningLow <= strike` (from tick history) | `1.0` — already touched |
| `remainingSeconds <= 0` and not touched | `0.0` — no time left |
| `sigma ≈ 0` (zero volatility) and no drift | `0.0` — deterministic, never moves |
| `sigma ≈ 0` and drift toward barrier | `1.0` if projected price crosses |

## Volatility Estimation

### Input

`priceTicks: readonly number[] | readonly { at: number; value: number }[]`

- **Plain `number[]`** — assumes 1-second uniform spacing.
- **Timestamped ticks** — uses actual `Δt` between consecutive points.

### Algorithm (`computeRealizedVolatility`)

1. **Normalize** price series to `{ t, p }` points sorted chronologically.
2. **Compute log returns** for consecutive pairs: `rᵢ = ln(pᵢ / pᵢ₋₁)`.
3. **Scale by √Δt**: `uᵢ = rᵢ / √Δt` — this gives the per-second-normalized return.
4. **Sample variance** of scaled returns (Bessel-corrected, N-1):
   ```
   σ²_sec = (Σ(uᵢ - ū)²) / (N - 1)
   σ_sec = √σ²_sec
   ```
5. **Scale up**:
   - `σ_min = σ_sec · √60`
   - `σ_annual = σ_sec · √(365.25 × 86400)`
6. **Fallback**: if too few samples (default `< 2`), `falcon-highlow.ts` falls back to `0.0001` per-second volatility (~58% annualized), ensuring a non-degenerate probability.

## Feature Engineering

`buildCuratedTouchFeatures()` produces a `CuratedTouchFeatures` object with:

| Feature | Meaning |
|---|---|
| `currentPrice` | Latest tick price (or currentPrice override). |
| `strike` | Barrier level. |
| `barrierType` | `"high"` or `"low"`. |
| `distanceToStrikeStdDevs` | `|ln(K/S₀)| / (σ·√T)` — normalized distance. |
| `distanceDollars` | `K - S₀`. |
| `distanceBps` | `((K - S₀) / S₀) × 10,000`. |
| `minutesRemaining` | `T / 60`. |
| `secondsRemaining` | `T`. |
| `realizedVolatility.perSecond` | σ per second. |
| `realizedVolatility.perMinute` | σ per minute. |
| `realizedVolatility.annualized` | σ annualized. |
| `runningHighSoFar` | Max of price ticks so far. |
| `runningLowSoFar` | Min of price ticks so far. |
| `alreadyTouched` | Boolean: barrier hit by current price or running H/L. |
| `quantModelProbability` | Final one-touch probability [0, 1]. |
| `orderbookSignals` | Optional order-book depth/imbalance signals (secondary). |

## Ranking and Recommendation

### Edge

```
edge = probability - 0.5
```

- `edge > 0` → barrier **favored** to touch (long/YES side).
- `edge < 0` → barrier **not favored** to touch (short/NO side).
- `edge ≈ 0` → near-neutral (coin-flip territory).

### absEdge

```
absEdge = |edge|
```

Used for ranking conviction. Higher `absEdge` = stronger signal.

### Rationale string

When **not** already touched:

```
Quant baseline P={probability.toFixed(4)} (z={distanceToStrikeStdDevs}σ from strike, vol={annualized*100}ann, {minutesRemaining}m left, edge={edge}).
```

When already touched:

```
Barrier already touched ({barrierType} {strike} reached by running {runningHigh|runningLow}).
```

## Batch Processing

`runHighLowBatch()` processes multiple contracts:

1. Iterates contracts, calling `computeHighLowRecommendation()` for each.
2. Catches errors (e.g., zero `remainingSeconds`, empty `priceTicks`) and collects them in `skipped` with ticket + reason.
3. Sorts `ranked` by `absEdge` descending (ties broken by ticker alphabetically).
4. Partitions into:
   - `alreadyTouched` — `probability === 1.0` (barrier already hit).
   - `flagged` — `!alreadyTouched && absEdge >= edgeThreshold` (default `0.1`).

### `evaluateHighLowPair()`

Convenience for matched high/low pairs (common in 15-minute BTC markets):

- Takes two contract descriptors (without `barrierType`).
- Applies `"high"` to first, `"low"` to second.
- Returns `HighLowBatchResult` with the higher-confidence contract ranked first.

## Comparison to Falcon-Jev

| Aspect | falcon-highlow | falcon-jev |
|---|---|---|
| Volatility | Realized from ticks | Same realized volatility |
| Drift | 0 (driftless reflection principle) | Same (zero drift) |
| Jev AI calibration | **None** — pure quant baseline | Two-tier: quant + Jev calibration |
| `quantModelProbability` | Identical formula | Identical as baseline |
| `probability` field | Equals quant baseline | May differ if Jev is configured |
| `alreadyTouched` | Same detection | Same detection |
| Orderbook signals | Curated features only | Jev receives orderbook signals too |

`falcon-highlow.ts` is the **transparent, deterministic reference** against which `falcon-jev.ts` calibrated outputs can be compared — the quant baseline is shared between both, so any deviation in Jev's output is attributable to the microstructural calibration layer.
