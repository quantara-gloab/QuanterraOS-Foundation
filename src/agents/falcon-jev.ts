/**
 * Falcon-Jev Agent: Calibrated High/Low Probability Engine.
 *
 * Replaces raw order-book guessing with a two-tier quantitative pipeline:
 *
 * Tier 1: Quant Baseline (Deterministic Brownian Motion First-Passage)
 *   Calculates the continuous one-touch reflection-principle probability:
 *     P_quant = 2 · Φ( -|ln(K / S_0)| / (σ · √T) )
 *   Derived from realized volatility (per-second/annualized) and strike distance.
 *
 * Tier 2: Jev AI Calibration (TypeSafe jev-1.13.0)
 *   Instead of guessing from noisy raw order-book JSON, Jev receives curated
 *   quantitative features:
 *   - distance-to-strike in standard deviations
 *   - minutes remaining in market window
 *   - realized volatility (per-second and annualized)
 *   - running high/low so far in the window
 *   - baseline one-touch quant probability
 *   - order-book depth & top imbalance as a secondary microstructural signal
 *
 * Jev's role is to calibrate/adjust the quant baseline given microstructural flow,
 * rather than fabricating probabilities from noise.
 */

import { oneTouchProbability, computeRealizedVolatility, type TimestampedPrice } from "../barrier-touch.ts";
import { JevClient, createJevClient } from "../jev-client.ts";
import { scoreObservation, type ObservationRow, type ResolutionRow, type ScoredObservation } from "../scoring.ts";
import type { OrderbookEvidence } from "./falcon.ts";

export interface CuratedTouchFeatures {
  contract: string;
  currentPrice: number;
  strike: number;
  barrierType: "high" | "low";
  /** Distance to strike in standard deviations: |ln(K / S_0)| / (σ · √T). */
  distanceToStrikeStdDevs: number;
  /** Distance in dollars: strike - currentPrice. */
  distanceDollars: number;
  /** Distance in basis points: ((strike - currentPrice) / currentPrice) * 10,000. */
  distanceBps: number;
  /** Minutes remaining in market window: T_sec / 60. */
  minutesRemaining: number;
  /** Exact seconds remaining in market window. */
  secondsRemaining: number;
  /** Realized volatility metrics. */
  realizedVolatility: {
    perSecond: number;
    perMinute: number;
    annualized: number;
  };
  /** Running high observed so far in the window. */
  runningHighSoFar: number | null;
  /** Running low observed so far in the window. */
  runningLowSoFar: number | null;
  /** Whether the running high/low has already touched the strike barrier. */
  alreadyTouched: boolean;
  /**
   * Baseline quantitative probability from Brownian motion reflection principle:
   * P_quant = 2 · (1 - Φ(d)).
   */
  quantModelProbability: number;
  /**
   * Order-book imbalance and depth metrics, treated as secondary microstructural flow.
   */
  orderbookSignals: {
    depthImbalance: number | null;
    topImbalance: number | null;
    bestYesPrice: number | null;
    bestNoPrice: number | null;
    spread: number | null;
    capturedAt: number | null;
  };
}

export interface FalconJevRecommendation {
  contract: string;
  suggestedProbability: number;
  source: "falcon-jev-live";
  quantBaselineProbability: number;
  jevAdjustment: number;
  curatedFeatures: CuratedTouchFeatures;
  rationale: string;
  jevConfigured: boolean;
  generatedAt: string;
}

export interface BuildCuratedFeaturesInput {
  contract: string;
  strike: number;
  barrierType?: "high" | "low" | "auto";
  currentPrice?: number;
  remainingSeconds: number;
  pricesOrTicks: readonly number[] | readonly TimestampedPrice[];
  orderbookEvidence?: OrderbookEvidence | null;
}

/**
 * Extracts and calculates the curated feature set from price history,
 * order-book snapshots, and the market strike barrier.
 */
export function buildCuratedTouchFeatures(input: BuildCuratedFeaturesInput): CuratedTouchFeatures {
  const { contract, strike, remainingSeconds, pricesOrTicks, orderbookEvidence } = input;

  // 1. Compute realized volatility
  const volResult = computeRealizedVolatility(pricesOrTicks, { intervalSeconds: 1 });
  const sigmaPerSecond = volResult?.perSecond ?? 0.0001; // default fallback ~58% annual vol
  const sigmaPerMinute = volResult?.perMinute ?? (sigmaPerSecond * Math.sqrt(60));
  const sigmaAnnualized = volResult?.annualized ?? (sigmaPerSecond * Math.sqrt(365.25 * 86_400));

  // 2. Extract current price and running high / low
  let currentPrice = input.currentPrice;
  let runningHigh: number | null = null;
  let runningLow: number | null = null;

  for (const item of pricesOrTicks) {
    const p = typeof item === "number" ? item : (item.price ?? item.value);
    if (p !== undefined && p > 0 && Number.isFinite(p)) {
      if (runningHigh === null || p > runningHigh) runningHigh = p;
      if (runningLow === null || p < runningLow) runningLow = p;
      currentPrice = p; // latest item in series
    }
  }

  const effectivePrice = currentPrice ?? strike;

  // 3. Resolve barrier type
  const barrierType: "high" | "low" =
    input.barrierType && input.barrierType !== "auto"
      ? input.barrierType
      : (strike >= effectivePrice ? "high" : "low");

  // 4. Check if already touched
  const alreadyTouched =
    barrierType === "high"
      ? (runningHigh !== null && runningHigh >= strike) || effectivePrice >= strike
      : (runningLow !== null && runningLow <= strike) || effectivePrice <= strike;

  // 5. Distance metrics
  const distanceDollars = Number((strike - effectivePrice).toFixed(2));
  const distanceBps = Number((((strike - effectivePrice) / effectivePrice) * 10_000).toFixed(1));
  const logDistance = Math.abs(Math.log(strike / effectivePrice));
  const sqrtT = Math.sqrt(Math.max(1, remainingSeconds));
  const distanceToStrikeStdDevs = Number((logDistance / (sigmaPerSecond * sqrtT)).toFixed(2));

  // 6. Quantitative Brownian reflection-principle probability baseline
  const quantModelProbability = alreadyTouched
    ? 1.0
    : oneTouchProbability({
        currentPrice: effectivePrice,
        strike,
        remainingSeconds,
        realizedVolatility: sigmaPerSecond,
        barrierType,
      });

  // 7. Order-book secondary signals
  let spread: number | null = null;
  if (orderbookEvidence?.bestYesPrice !== null && orderbookEvidence?.bestNoPrice !== null &&
      orderbookEvidence?.bestYesPrice !== undefined && orderbookEvidence?.bestNoPrice !== undefined) {
    spread = Number((1.0 - (orderbookEvidence.bestYesPrice + orderbookEvidence.bestNoPrice)).toFixed(4));
  }

  const orderbookSignals = {
    depthImbalance: orderbookEvidence?.depthImbalance ?? null,
    topImbalance: orderbookEvidence?.topImbalance ?? null,
    bestYesPrice: orderbookEvidence?.bestYesPrice ?? null,
    bestNoPrice: orderbookEvidence?.bestNoPrice ?? null,
    spread,
    capturedAt: orderbookEvidence?.capturedAt ?? null,
  };

  return {
    contract,
    currentPrice: effectivePrice,
    strike,
    barrierType,
    distanceToStrikeStdDevs,
    distanceDollars,
    distanceBps,
    minutesRemaining: Number((remainingSeconds / 60).toFixed(2)),
    secondsRemaining: remainingSeconds,
    realizedVolatility: {
      perSecond: sigmaPerSecond,
      perMinute: sigmaPerMinute,
      annualized: sigmaAnnualized,
    },
    runningHighSoFar: runningHigh,
    runningLowSoFar: runningLow,
    alreadyTouched,
    quantModelProbability: Number(quantModelProbability.toFixed(4)),
    orderbookSignals,
  };
}

/**
 * Serializes the curated state into the prompt payload for Jev.
 */
export function formatJevCuratedState(features: CuratedTouchFeatures): Record<string, unknown> {
  return {
    task: "touch_contract_calibration",
    contract: features.contract,
    strike: features.strike,
    current_price: features.currentPrice,
    barrier_type: features.barrierType,
    distance_to_strike_std_devs: features.distanceToStrikeStdDevs,
    distance_dollars: features.distanceDollars,
    distance_bps: features.distanceBps,
    minutes_remaining: features.minutesRemaining,
    realized_volatility: {
      per_second: Number(features.realizedVolatility.perSecond.toFixed(8)),
      per_minute: Number(features.realizedVolatility.perMinute.toFixed(6)),
      annualized: Number(features.realizedVolatility.annualized.toFixed(4)),
    },
    running_high_so_far: features.runningHighSoFar,
    running_low_so_far: features.runningLowSoFar,
    already_touched: features.alreadyTouched,
    quant_model_probability: features.quantModelProbability,
    secondary_orderbook_signals: {
      depth_imbalance: features.orderbookSignals.depthImbalance,
      top_imbalance: features.orderbookSignals.topImbalance,
      best_yes_price: features.orderbookSignals.bestYesPrice,
      best_no_price: features.orderbookSignals.bestNoPrice,
      spread: features.orderbookSignals.spread,
    },
  };
}

export interface FalconJevInput extends BuildCuratedFeaturesInput {
  jevClient?: JevClient;
  now?: Date;
}

/**
 * Computes a calibrated Falcon-Jev recommendation.
 *
 * 1. Derives the curated quantitative features and reflection-principle baseline.
 * 2. If already touched, immediately returns 1.0.
 * 3. If Jev is configured, prompts Jev to calibrate the quantitative baseline
 *    using secondary order-book microstructure.
 * 4. If Jev is not configured, cleanly serves the transparent quant baseline
 *    without fabrication.
 */
export async function computeFalconJevRecommendation(
  input: FalconJevInput
): Promise<FalconJevRecommendation> {
  const now = input.now ?? new Date();
  const features = buildCuratedTouchFeatures(input);
  const client = input.jevClient ?? createJevClient();

  // If barrier already touched, probability is 1.0 deterministically
  if (features.alreadyTouched) {
    return {
      contract: features.contract,
      suggestedProbability: 1.0,
      source: "falcon-jev-live",
      quantBaselineProbability: 1.0,
      jevAdjustment: 0,
      curatedFeatures: features,
      rationale: `Barrier already touched (${features.barrierType} barrier ${features.strike} reached by running ${features.barrierType === "high" ? features.runningHighSoFar : features.runningLowSoFar}).`,
      jevConfigured: client.isConfigured(),
      generatedAt: now.toISOString(),
    };
  }

  // If Jev is unconfigured, return the clean quantitative baseline
  if (!client.isConfigured()) {
    const rationale = `Quant baseline P=${features.quantModelProbability.toFixed(4)} `
      + `(Brownian reflection principle at z=${features.distanceToStrikeStdDevs}σ, `
      + `vol=${(features.realizedVolatility.annualized * 100).toFixed(1)}% ann, `
      + `${features.minutesRemaining}m left). Jev not configured — no TYPESAFE_API_KEY set.`;

    return {
      contract: features.contract,
      suggestedProbability: features.quantModelProbability,
      source: "falcon-jev-live",
      quantBaselineProbability: features.quantModelProbability,
      jevAdjustment: 0,
      curatedFeatures: features,
      rationale,
      jevConfigured: false,
      generatedAt: now.toISOString(),
    };
  }

  // Query Jev for calibration adjustment
  const response = await client.predict({
    contract: features.contract,
    task: "touch_contract_calibration",
    state: formatJevCuratedState(features),
    quantBaseline: {
      probability: features.quantModelProbability,
      model: "brownian_reflection_principle",
      distanceStdDevs: features.distanceToStrikeStdDevs,
      realizedVolAnnualized: features.realizedVolatility.annualized,
    },
  });

  if (response.prediction) {
    const suggestedProbability = response.prediction.suggestedProbability;
    const jevAdjustment = Number((suggestedProbability - features.quantModelProbability).toFixed(4));
    const rationale = `Jev calibrated: P=${suggestedProbability.toFixed(4)} `
      + `(baseline=${features.quantModelProbability.toFixed(4)}, adjustment=${jevAdjustment >= 0 ? "+" : ""}${jevAdjustment.toFixed(4)}). `
      + `${response.prediction.rationale}`;

    return {
      contract: features.contract,
      suggestedProbability,
      source: "falcon-jev-live",
      quantBaselineProbability: features.quantModelProbability,
      jevAdjustment,
      curatedFeatures: features,
      rationale,
      jevConfigured: true,
      generatedAt: now.toISOString(),
    };
  }

  // Fallback if Jev returned error
  return {
    contract: features.contract,
    suggestedProbability: features.quantModelProbability,
    source: "falcon-jev-live",
    quantBaselineProbability: features.quantModelProbability,
    jevAdjustment: 0,
    curatedFeatures: features,
    rationale: `Quant baseline: ${response.error ?? "Jev failed to respond"}. Serving theoretical baseline.`,
    jevConfigured: true,
    generatedAt: now.toISOString(),
  };
}

/**
 * Scores Falcon-Jev recommendations under the distinct "falcon-jev-live" source tag.
 */
export function scoreFalconJevRecommendation(
  recommendation: { contract: string; suggestedProbability: number; generatedAt?: string },
  resolution: ResolutionRow
): ScoredObservation {
  const obs: ObservationRow = {
    id: `falcon-jev:${recommendation.contract}:${recommendation.generatedAt ?? resolution.resolvedAt}`,
    owner: "system",
    contract: recommendation.contract,
    source: "falcon-jev-live",
    direction: recommendation.suggestedProbability >= 0.5 ? "YES" : "NO",
    hypothesis: `Falcon-Jev suggested ${recommendation.suggestedProbability.toFixed(4)}`,
    probability: recommendation.suggestedProbability,
    created: recommendation.generatedAt ?? resolution.resolvedAt,
  };
  return scoreObservation(obs, resolution);
}
