/**
 * Falcon-HighLow Agent: Batch High/Low Barrier Probability Engine.
 *
 * Evaluates all supplied open high/low contracts at once and returns a
 * ranked list of recommendations ordered by edge (how far the quant
 * probability deviates from 0.5).
 *
 * Each recommendation is produced by the same deterministic Brownian
 * first-passage pipeline used by falcon-jev — but without the Jev AI
 * calibration layer, so the output is fully transparent and testable
 * with no external dependencies.
 *
 * Typical callers:
 *   - A scheduled scanner that runs once per minute and POSTs results
 *     to a dashboard endpoint.
 *   - A backtest harness that replays historical tick snapshots.
 *
 * No DB reads live here. Callers supply the contract descriptors and
 * price ticks; this module is purely functional.
 */

import {
  buildCuratedTouchFeatures,
  type CuratedTouchFeatures,
  type BuildCuratedFeaturesInput,
} from "./falcon-jev.ts";
import type { OrderbookEvidence } from "./falcon.ts";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type HighLowBarrierType = "high" | "low";

export interface OpenHighLowContract {
  /** Kalshi-style market ticker, e.g. "KXBTC-25SEP2926-T100000-HIGH". */
  ticker: string;
  /** Barrier direction. */
  barrierType: HighLowBarrierType;
  /** Strike price in dollars. */
  strike: number;
  /** Seconds remaining until market close. */
  remainingSeconds: number;
  /**
   * Recent BTC price ticks for realized-volatility estimation.
   * Accepts either a plain number[] (uniform 1-second spacing) or
   * timestamped { at: number; value: number }[] ticks.
   */
  priceTicks: readonly number[] | readonly { at: number; value: number }[];
  /** Latest order-book snapshot, if available. Used for spread/imbalance only. */
  orderbookEvidence?: OrderbookEvidence | null;
}

export interface HighLowRecommendation {
  ticker: string;
  barrierType: HighLowBarrierType;
  strike: number;
  /** Quant reflection-principle probability [0, 1]. */
  probability: number;
  /**
   * Signed edge: probability - 0.5.
   * Positive → barrier is favored to touch.
   * Negative → barrier is not expected to touch.
   */
  edge: number;
  /** Absolute edge magnitude — used for ranking. */
  absEdge: number;
  /** Whether the barrier has already been touched by the running high/low. */
  alreadyTouched: boolean;
  /** Full curated feature set for downstream inspection or logging. */
  features: CuratedTouchFeatures;
  /** Human-readable rationale string. */
  rationale: string;
  /** ISO timestamp of computation. */
  generatedAt: string;
}

export interface HighLowBatchResult {
  /** All recommendations, sorted by absEdge descending (highest conviction first). */
  ranked: HighLowRecommendation[];
  /** Subset that have already touched their barrier (probability = 1.0). */
  alreadyTouched: HighLowRecommendation[];
  /** Subset with edge > edgeThreshold (default 0.1). */
  flagged: HighLowRecommendation[];
  /** Contracts skipped due to insufficient price data or zero remaining time. */
  skipped: { ticker: string; reason: string }[];
  /** ISO timestamp of the batch run. */
  generatedAt: string;
}

export interface BatchOptions {
  /**
   * Minimum absolute edge to flag a recommendation.
   * Defaults to 0.1 (probability must be < 0.4 or > 0.6).
   */
  edgeThreshold?: number;
  /** Wall-clock override for deterministic testing. */
  now?: Date;
}

// ---------------------------------------------------------------------------
// Core pure functions
// ---------------------------------------------------------------------------

/**
 * Computes a single HighLowRecommendation from an open contract descriptor.
 * Throws if price data is insufficient to compute realized volatility.
 */
export function computeHighLowRecommendation(
  contract: OpenHighLowContract,
  now: Date = new Date(),
): HighLowRecommendation {
  if (contract.remainingSeconds <= 0) {
    throw new Error(
      `Contract "${contract.ticker}" has no time remaining (remainingSeconds=${contract.remainingSeconds})`,
    );
  }
  if (!contract.priceTicks.length) {
    throw new Error(`Contract "${contract.ticker}" supplied no price ticks`);
  }

  const input: BuildCuratedFeaturesInput = {
    contract: contract.ticker,
    strike: contract.strike,
    barrierType: contract.barrierType,
    remainingSeconds: contract.remainingSeconds,
    pricesOrTicks: contract.priceTicks,
    orderbookEvidence: contract.orderbookEvidence ?? null,
  };

  const features = buildCuratedTouchFeatures(input);
  const probability = features.quantModelProbability;
  const edge = Number((probability - 0.5).toFixed(4));
  const absEdge = Math.abs(edge);

  const rationale = features.alreadyTouched
    ? `Barrier already touched (${features.barrierType} ${features.strike} reached by running ${features.barrierType === "high" ? features.runningHighSoFar : features.runningLowSoFar}).`
    : `Quant baseline P=${probability.toFixed(4)} ` +
      `(z=${features.distanceToStrikeStdDevs}σ from strike, ` +
      `vol=${(features.realizedVolatility.annualized * 100).toFixed(1)}% ann, ` +
      `${features.minutesRemaining}m left, ` +
      `edge=${edge >= 0 ? "+" : ""}${edge.toFixed(4)}).`;

  return {
    ticker: contract.ticker,
    barrierType: contract.barrierType,
    strike: contract.strike,
    probability,
    edge,
    absEdge,
    alreadyTouched: features.alreadyTouched,
    features,
    rationale,
    generatedAt: now.toISOString(),
  };
}

/**
 * Evaluates all supplied open high/low contracts and returns a ranked batch
 * result. Contracts that fail validation or have insufficient data are
 * collected in `skipped` rather than throwing.
 *
 * @param contracts Array of open high/low contract descriptors.
 * @param options   Optional edge threshold and wall-clock override.
 * @returns         HighLowBatchResult with ranked recommendations and metadata.
 */
export function runHighLowBatch(
  contracts: OpenHighLowContract[],
  options: BatchOptions = {},
): HighLowBatchResult {
  const edgeThreshold = options.edgeThreshold ?? 0.1;
  const now = options.now ?? new Date();
  const generatedAt = now.toISOString();

  const ranked: HighLowRecommendation[] = [];
  const skipped: { ticker: string; reason: string }[] = [];

  for (const contract of contracts) {
    try {
      const rec = computeHighLowRecommendation(contract, now);
      ranked.push(rec);
    } catch (err) {
      skipped.push({
        ticker: contract.ticker,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Sort by absEdge descending; break ties by ticker alphabetically
  ranked.sort(
    (a, b) => b.absEdge - a.absEdge || a.ticker.localeCompare(b.ticker),
  );

  return {
    ranked,
    alreadyTouched: ranked.filter((r) => r.alreadyTouched),
    flagged: ranked.filter(
      (r) => !r.alreadyTouched && r.absEdge >= edgeThreshold,
    ),
    skipped,
    generatedAt,
  };
}

/**
 * Convenience: given a pair of high and low contracts for the same market
 * window (common in 15-minute BTC markets), returns both recommendations
 * with the higher-confidence one first.
 */
export function evaluateHighLowPair(
  highContract: Omit<OpenHighLowContract, "barrierType">,
  lowContract: Omit<OpenHighLowContract, "barrierType">,
  options: BatchOptions = {},
): HighLowBatchResult {
  return runHighLowBatch(
    [
      { ...highContract, barrierType: "high" },
      { ...lowContract, barrierType: "low" },
    ],
    options,
  );
}
