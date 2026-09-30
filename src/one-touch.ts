/**
 * One-Touch / First-Passage Probability via the Brownian Motion Reflection Principle.
 *
 * Models the probability that an asset's continuous price path S(t) touches (hits or exceeds)
 * a strike barrier K within a remaining time window T, given current price S_0,
 * strike K, remaining seconds T, and realized volatility sigma.
 *
 * Unlike order-book depth imbalance (which is a transient microstructural reading)
 * or European digital options (which settle only on terminal price S_T >= K),
 * this models continuous one-touch/barrier settlement under Brownian first-passage theory:
 *
 * Reflection Principle (Desiré André, 1887; Karatzas & Shreve):
 * For driftless Brownian motion, every path that reaches barrier b and ends below b
 * has a one-to-one reflected counterpart that ends above b. Therefore:
 *   P(touch K before T) = 2 · P(S_T >= K) = 2 · Φ( -|ln(K / S_0)| / (σ · √T) )
 *                       = 2 · (1 - Φ( |ln(K / S_0)| / (σ · √T) ))
 *
 * For non-zero drift μ, the generalized first-passage distribution is:
 *   P(τ_b <= T) = Φ((-b + μ·T) / (σ·√T)) + exp(2·μ·b / σ²) · Φ((-b - μ·T) / (σ·√T))
 */

import { normalCdf } from "./btc15m-predictor.ts";

export type TouchBarrierType = "high" | "low" | "auto";
export type VolatilityUnit = "per_second" | "per_minute" | "annual";

export interface OneTouchProbabilityOptions {
  /**
   * Time unit of the supplied realized volatility.
   * - "per_second": standard deviation of 1-second log returns (default)
   * - "per_minute": standard deviation of 1-minute log returns (scaled by 1 / √60)
   * - "annual": 365.25-day annualized volatility (scaled by 1 / √(365.25 * 86400))
   */
  volatilityUnit?: VolatilityUnit;

  /**
   * Barrier touch direction:
   * - "auto": inferred from strike vs currentPrice ("high" if strike >= price, "low" if strike < price).
   * - "high": probability running maximum M_T >= strike. If currentPrice >= strike, returns 1.0.
   * - "low": probability running minimum m_T <= strike. If currentPrice <= strike, returns 1.0.
   */
  barrierType?: TouchBarrierType;

  /**
   * Optional drift term μ in log-returns per unit of time (matching volatilityUnit).
   * Defaults to 0 (pure reflection principle: P = 2 · Φ(-d)).
   */
  drift?: number;
}

export interface OneTouchProbabilityInput extends OneTouchProbabilityOptions {
  currentPrice: number;
  strike: number;
  remainingSeconds: number;
  realizedVolatility: number;
}

/**
 * Scale volatility from the specified unit to per-second (σ_sec).
 */
export function scaleVolatilityToPerSecond(volatility: number, unit: VolatilityUnit = "per_second"): number {
  if (volatility <= 0) return 0;
  switch (unit) {
    case "per_minute":
      return volatility / Math.sqrt(60);
    case "annual":
      return volatility / Math.sqrt(365.25 * 86_400);
    case "per_second":
    default:
      return volatility;
  }
}

/**
 * Scale drift from the specified unit to per-second (μ_sec).
 */
export function scaleDriftToPerSecond(drift: number, unit: VolatilityUnit = "per_second"): number {
  if (drift === 0) return 0;
  switch (unit) {
    case "per_minute":
      return drift / 60;
    case "annual":
      return drift / (365.25 * 86_400);
    case "per_second":
    default:
      return drift;
  }
}

/**
 * Computes the one-touch / reflection-principle probability that BTC's high or low
 * touches a strike within the remaining window time.
 *
 * Supports both object signature `oneTouchProbability({ ... })` and
 * positional signature `oneTouchProbability(currentPrice, strike, remainingSeconds, realizedVolatility, options)`.
 *
 * @param inputOrPrice Input object or current asset price.
 * @param strikeArg Strike price barrier.
 * @param remainingSecondsArg Seconds remaining in the market window.
 * @param realizedVolatilityArg Realized log-return volatility.
 * @param optionsArg Additional options (volatilityUnit, barrierType, drift).
 * @returns Probability in range [0.0, 1.0].
 */
export function oneTouchProbability(
  inputOrPrice: number | OneTouchProbabilityInput,
  strikeArg?: number,
  remainingSecondsArg?: number,
  realizedVolatilityArg?: number,
  optionsArg?: OneTouchProbabilityOptions
): number {
  let currentPrice: number;
  let strike: number;
  let remainingSeconds: number;
  let realizedVolatility: number;
  let options: OneTouchProbabilityOptions = {};

  if (typeof inputOrPrice === "object" && inputOrPrice !== null) {
    currentPrice = inputOrPrice.currentPrice;
    strike = inputOrPrice.strike;
    remainingSeconds = inputOrPrice.remainingSeconds;
    realizedVolatility = inputOrPrice.realizedVolatility;
    options = inputOrPrice;
  } else {
    currentPrice = inputOrPrice;
    strike = strikeArg!;
    remainingSeconds = remainingSecondsArg!;
    realizedVolatility = realizedVolatilityArg!;
    options = optionsArg ?? {};
  }

  // 1. Validate pricing domain
  if (currentPrice <= 0 || strike <= 0) {
    return 0;
  }

  // 2. Resolve barrier direction ("high" vs "low")
  const barrierType = options.barrierType ?? "auto";
  const effectiveBarrier: "high" | "low" =
    barrierType === "auto"
      ? (strike >= currentPrice ? "high" : "low")
      : barrierType;

  // 3. Check if barrier has already been touched
  if (effectiveBarrier === "high" && currentPrice >= strike) {
    return 1.0;
  }
  if (effectiveBarrier === "low" && currentPrice <= strike) {
    return 1.0;
  }

  // 4. If time has expired without touching, probability is 0
  if (remainingSeconds <= 0) {
    return 0.0;
  }

  // 5. Scale volatility and drift to per-second units
  const volUnit = options.volatilityUnit ?? "per_second";
  const sigmaSec = scaleVolatilityToPerSecond(realizedVolatility, volUnit);
  const muSec = scaleDriftToPerSecond(options.drift ?? 0, volUnit);

  // 6. Zero volatility boundary: deterministic trajectory
  if (sigmaSec <= 0) {
    if (muSec === 0) return 0.0;
    const projectedPrice = currentPrice * Math.exp(muSec * remainingSeconds);
    if (effectiveBarrier === "high") {
      return (muSec > 0 && projectedPrice >= strike) ? 1.0 : 0.0;
    } else {
      return (muSec < 0 && projectedPrice <= strike) ? 1.0 : 0.0;
    }
  }

  // 7. Distance in log-space: b > 0
  const b = effectiveBarrier === "high"
    ? Math.log(strike / currentPrice)
    : Math.log(currentPrice / strike);

  if (b <= 0) {
    return 1.0;
  }

  // Directional drift: positive towards the barrier
  const directionalMu = effectiveBarrier === "high" ? muSec : -muSec;
  const sqrtT = Math.sqrt(remainingSeconds);
  const sigmaRootT = sigmaSec * sqrtT;

  // 8. Standard Driftless Reflection Principle: P = 2 · Φ(-b / (σ · √T))
  if (directionalMu === 0) {
    const d = b / sigmaRootT;
    const p = 2 * normalCdf(-d);
    return Math.min(1.0, Math.max(0.0, p));
  }

  // 9. Generalized First-Passage Formula with Drift
  // P(τ_b <= T) = Φ((-b + μ·T) / (σ·√T)) + exp(2·μ·b / σ²) · Φ((-b - μ·T) / (σ·√T))
  const z1 = (-b + directionalMu * remainingSeconds) / sigmaRootT;
  const z2 = (-b - directionalMu * remainingSeconds) / sigmaRootT;
  const term1 = normalCdf(z1);

  const exponent = (2 * directionalMu * b) / (sigmaSec * sigmaSec);

  let term2 = 0;
  if (exponent < -700) {
    term2 = 0;
  } else if (exponent > 700) {
    // If drift towards barrier is overwhelmingly large, probability approaches 1
    return 1.0;
  } else {
    term2 = Math.exp(exponent) * normalCdf(z2);
  }

  const prob = term1 + term2;
  return Math.min(1.0, Math.max(0.0, prob));
}

/**
 * Convenience helper for the probability that BTC's high touches an upper strike.
 */
export function oneTouchHighProbability(
  currentPrice: number,
  strike: number,
  remainingSeconds: number,
  realizedVolatility: number,
  options?: Omit<OneTouchProbabilityOptions, "barrierType">
): number {
  return oneTouchProbability(currentPrice, strike, remainingSeconds, realizedVolatility, {
    ...options,
    barrierType: "high",
  });
}

/**
 * Convenience helper for the probability that BTC's low touches a lower strike.
 */
export function oneTouchLowProbability(
  currentPrice: number,
  strike: number,
  remainingSeconds: number,
  realizedVolatility: number,
  options?: Omit<OneTouchProbabilityOptions, "barrierType">
): number {
  return oneTouchProbability(currentPrice, strike, remainingSeconds, realizedVolatility, {
    ...options,
    barrierType: "low",
  });
}

/**
 * Helper using 1-minute realized volatility (such as from `perMinuteVolatility`).
 */
export function oneTouchFromMinuteVol(
  currentPrice: number,
  strike: number,
  remainingSeconds: number,
  sigmaPerMinute: number,
  options?: Omit<OneTouchProbabilityOptions, "volatilityUnit">
): number {
  return oneTouchProbability(currentPrice, strike, remainingSeconds, sigmaPerMinute, {
    ...options,
    volatilityUnit: "per_minute",
  });
}

// ---------------------------------------------------------------------------
// Short-Horizon Realized Volatility Estimation
// ---------------------------------------------------------------------------

export interface TimestampedPrice {
  /** Timestamp in milliseconds or seconds (values > 1e11 are treated as milliseconds). */
  timestamp?: number;
  /** Alternate key for timestamp (matching BRTI / predictor ticks { at: number; value: number }). */
  at?: number;
  /** Price value. */
  price?: number;
  /** Alternate key for price (matching index / predictor ticks { at: number; value: number }). */
  value?: number;
}

export type PriceSeriesInput =
  | readonly number[]
  | readonly TimestampedPrice[];

export interface RealizedVolatilityOptions {
  /**
   * Time interval in seconds between consecutive price points when passing a number[] of prices.
   * Defaults to 1 (1-second sampling).
   * For 1-minute close prices, set this to 60.
   * If passing timestamped ticks, this is ignored as actual time deltas are used.
   */
  intervalSeconds?: number;

  /**
   * Minimum number of price observations required. Defaults to 2.
   * Returns null if fewer observations are supplied.
   */
  minSamples?: number;

  /**
   * Whether to demean log returns (sample variance with Bessel's correction N - 1)
   * or assume zero mean. Over short horizons (seconds to minutes), zero-mean
   * assumption can reduce estimator noise. Defaults to true.
   */
  demean?: boolean;

  /**
   * Days per year for annualization.
   * Defaults to 365.25 for continuous 24/7/365 crypto markets.
   */
  daysPerYear?: number;
}

export interface RealizedVolatilityResult {
  /**
   * Realized volatility scaled to per-second (σ_sec).
   * This is the exact input required by `oneTouchProbability`.
   */
  perSecond: number;

  /**
   * Realized volatility scaled to per-minute (σ_min = σ_sec · √60).
   * Directly matches `perMinuteVolatility` in KXBTC15M predictor.
   */
  perMinute: number;

  /**
   * Annualized realized volatility (σ_annual = σ_sec · √(daysPerYear · 86400)).
   * E.g. 0.65 corresponds to 65% annualized BTC volatility.
   */
  annualized: number;

  /**
   * Raw standard deviation of log returns per step.
   */
  rawStdev: number;

  /**
   * Sample variance of log returns per step.
   */
  rawVariance: number;

  /**
   * Mean log return per step (sample drift estimate).
   */
  meanReturn: number;

  /**
   * Annualized drift estimate (μ_annual).
   */
  annualizedDrift: number;

  /**
   * Total number of valid return observations used.
   */
  sampleCount: number;

  /**
   * Total elapsed time in seconds across the sample.
   */
  elapsedSeconds: number;
}

interface NormalizedPoint {
  t: number; // in seconds
  p: number; // price > 0
}

function normalizePriceSeries(prices: PriceSeriesInput, defaultInterval: number): NormalizedPoint[] {
  const points: NormalizedPoint[] = [];
  const n = prices.length;
  for (let i = 0; i < n; i++) {
    const item = prices[i];
    if (typeof item === "number") {
      if (item > 0 && Number.isFinite(item)) {
        points.push({ t: i * defaultInterval, p: item });
      }
    } else if (item && typeof item === "object") {
      const p = item.price ?? item.value;
      const rawT = item.timestamp ?? item.at;
      if (p !== undefined && p > 0 && Number.isFinite(p) && rawT !== undefined && Number.isFinite(rawT)) {
        // Values > 1e11 are epoch milliseconds (e.g. 1727500000000); convert to seconds
        const t = rawT > 1e11 ? rawT / 1000 : rawT;
        points.push({ t, p });
      }
    }
  }
  return points.sort((a, b) => a.t - b.t);
}

/**
 * Computes short-horizon realized volatility from a chronological price series or timestamped ticks.
 *
 * Evaluates:
 * - Per-second volatility (σ_sec): required input for barrier-touch & continuous first-passage models.
 * - Per-minute volatility (σ_min = σ_sec · √60).
 * - Annualized volatility (σ_annual) for 24/7/365 crypto markets.
 * - Drift estimates (mean return & annualized drift).
 *
 * Works with both:
 * - Uniform price arrays `number[]` (e.g. 1-second ticks, 1-minute closes)
 * - Timestamped ticks `{ timestamp | at, price | value }[]` with irregular intervals.
 *
 * @param prices Array of prices or timestamped tick objects.
 * @param options Configuration options (intervalSeconds, minSamples, demean, daysPerYear).
 * @returns RealizedVolatilityResult or null if insufficient valid points exist.
 */
export function computeRealizedVolatility(
  prices: PriceSeriesInput,
  options?: RealizedVolatilityOptions
): RealizedVolatilityResult | null {
  const minSamples = options?.minSamples ?? 2;
  const intervalSeconds = Math.max(1e-6, options?.intervalSeconds ?? 1);
  const demean = options?.demean ?? true;
  const daysPerYear = options?.daysPerYear ?? 365.25;
  const secondsPerYear = daysPerYear * 86_400;

  const points = normalizePriceSeries(prices, intervalSeconds);
  if (points.length < minSamples) {
    return null;
  }

  const returns: number[] = [];
  const scaledReturns: number[] = []; // r_i / √Δt_i (expected stdev = σ_sec)
  let elapsedSeconds = 0;

  for (let i = 1; i < points.length; i++) {
    const dt = points[i].t - points[i - 1].t;
    if (dt <= 0) continue; // skip identical or decreasing timestamps
    const r = Math.log(points[i].p / points[i - 1].p);
    returns.push(r);
    scaledReturns.push(r / Math.sqrt(dt));
    elapsedSeconds += dt;
  }

  const N = returns.length;
  if (N < 1 || elapsedSeconds <= 0) {
    return null;
  }

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / N;

  // Raw variance across consecutive steps
  let rawVariance = 0;
  if (N > 1) {
    rawVariance = demean
      ? returns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / (N - 1)
      : returns.reduce((sum, r) => sum + r ** 2, 0) / N;
  } else {
    rawVariance = returns[0] ** 2;
  }
  const rawStdev = Math.sqrt(Math.max(0, rawVariance));

  // Per-second volatility from dt-normalized log returns
  let perSecond = 0;
  if (N > 1) {
    const meanScaled = scaledReturns.reduce((sum, u) => sum + u, 0) / N;
    const scaledVariance = demean
      ? scaledReturns.reduce((sum, u) => sum + (u - meanScaled) ** 2, 0) / (N - 1)
      : scaledReturns.reduce((sum, u) => sum + u ** 2, 0) / N;
    perSecond = Math.sqrt(Math.max(0, scaledVariance));
  } else {
    perSecond = Math.abs(scaledReturns[0]);
  }

  const perMinute = perSecond * Math.sqrt(60);
  const annualized = perSecond * Math.sqrt(secondsPerYear);

  // Overall drift rate per second
  const overallLogChange = Math.log(points[points.length - 1].p / points[0].p);
  const muPerSecond = overallLogChange / elapsedSeconds;
  const annualizedDrift = muPerSecond * secondsPerYear;

  return {
    perSecond,
    perMinute,
    annualized,
    rawStdev,
    rawVariance,
    meanReturn,
    annualizedDrift,
    sampleCount: N,
    elapsedSeconds,
  };
}

/**
 * Returns just the per-second realized volatility (σ_sec) from a price series,
 * ready to plug directly into `oneTouchProbability`.
 */
export function realizedVolatilityPerSecond(
  prices: PriceSeriesInput,
  options?: RealizedVolatilityOptions
): number | null {
  return computeRealizedVolatility(prices, options)?.perSecond ?? null;
}

/**
 * Returns the annualized realized volatility (σ_annual) from a price series.
 */
export function annualizedRealizedVolatility(
  prices: PriceSeriesInput,
  options?: RealizedVolatilityOptions
): number | null {
  return computeRealizedVolatility(prices, options)?.annualized ?? null;
}

/**
 * End-to-end convenience: computes short-horizon realized volatility directly from a price series
 * and calculates the one-touch barrier probability using the latest price as current price.
 *
 * @param prices Chronological array of prices or timestamped ticks.
 * @param strike Strike barrier.
 * @param remainingSeconds Seconds remaining in the market window.
 * @param options Additional options for volatility calculation and one-touch barrier.
 * @returns One-touch probability [0.0, 1.0] or null if insufficient price data exists.
 */
export function oneTouchFromPriceSeries(
  prices: PriceSeriesInput,
  strike: number,
  remainingSeconds: number,
  options?: RealizedVolatilityOptions & Omit<OneTouchProbabilityOptions, "volatilityUnit">
): number | null {
  const volResult = computeRealizedVolatility(prices, options);
  if (!volResult) return null;

  // Extract latest price
  const points = normalizePriceSeries(prices, options?.intervalSeconds ?? 1);
  if (points.length === 0) return null;
  const currentPrice = points[points.length - 1].p;

  return oneTouchProbability({
    currentPrice,
    strike,
    remainingSeconds,
    realizedVolatility: volResult.perSecond,
    volatilityUnit: "per_second",
    barrierType: options?.barrierType,
    drift: options?.drift,
  });
}

