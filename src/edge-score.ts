/**
 * Edge-score engine — the core of the "fair-value gate" product.
 *
 * For a single short-duration contract (15min/1hr/1day direction bet),
 * answers: does the fair probability of the underlying move clear the
 * true breakeven probability once spread and fees are netted out?
 *
 * IMPORTANT — model assumptions that must be validated before this
 * drives real recommendations:
 *   - `feeEstimate` approximates Kalshi's published fee formula
 *     (roughly 0.07 * price * (1-price), highest near 50/50 odds).
 *     Verify against Kalshi's current official fee schedule before
 *     using this for real trades — fee schedules change.
 *   - `fairProbability` uses a momentum-drift-over-volatility model
 *     (a simple, disclosed heuristic, not a proven predictive edge).
 *     It should be backtested against the calibration/resolution data
 *     (research_resolutions) before being trusted, and the calibration
 *     curve — not this code — is the actual source of truth on whether
 *     it works.
 *
 * Zero dependencies, pure functions, same pattern as scoring.ts and
 * index-engine.ts.
 */

export type Bucket = "15min" | "1hr" | "1day";

export interface EdgeInput {
  owner: string;
  contract: string;
  bucket: Bucket;
  /** Composite index prices leading up to now, most recent last. */
  recentCompositePrices: number[];
  /** Kalshi's current ask price for the YES side, 0-1. */
  marketAsk: number;
  computedAt?: string;
}

export interface EdgeResult {
  owner: string;
  contract: string;
  bucket: Bucket;
  fairProbability: number;
  breakevenProbability: number;
  edge: number;
  flagged: boolean;
  marketAsk: number;
  feeEstimate: number;
  computedAt: string;
}

/** Edge must clear this margin above pure breakeven before we flag a
 * contract as worth trading — covers model uncertainty, not just fees. */
const DEFAULT_EDGE_THRESHOLD = 0.03;

export function estimateFee(askPrice: number): number {
  const p = clamp01(askPrice);
  // Approximates Kalshi's formula-based fee, which peaks near 50/50
  // odds and shrinks toward the extremes. Round up to the nearest cent
  // per $1 notional, matching how per-contract fees are typically
  // rounded in practice.
  const raw = 0.07 * p * (1 - p);
  return Math.ceil(raw * 100) / 100;
}

/** Fair probability of "YES" from recent composite-index prices, using
 * a momentum-drift-over-volatility heuristic. Returns 0.5 (no edge) if
 * there isn't enough history to estimate drift or volatility. */
export function estimateFairProbability(recentCompositePrices: number[]): number {
  if (recentCompositePrices.length < 3) return 0.5;

  const logReturns: number[] = [];
  for (let i = 1; i < recentCompositePrices.length; i++) {
    const prev = recentCompositePrices[i - 1];
    const cur = recentCompositePrices[i];
    if (prev <= 0 || cur <= 0) continue;
    logReturns.push(Math.log(cur / prev));
  }
  if (logReturns.length < 2) return 0.5;

  const mean = logReturns.reduce((s, r) => s + r, 0) / logReturns.length;
  const variance =
    logReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (logReturns.length - 1);
  const stdev = Math.sqrt(variance);
  if (stdev === 0) return 0.5;

  // Standardized drift, fed through the normal CDF to get a probability.
  const z = mean / stdev;
  return clamp01(normalCdf(z));
}

export function scoreEdge(
  input: EdgeInput,
  threshold = DEFAULT_EDGE_THRESHOLD,
  now: () => string = () => new Date().toISOString()
): EdgeResult {
  const fairProbability = estimateFairProbability(input.recentCompositePrices);
  const feeEstimate = estimateFee(input.marketAsk);
  const breakevenProbability = clamp01(input.marketAsk + feeEstimate);
  const edge = fairProbability - breakevenProbability;

  return {
    owner: input.owner,
    contract: input.contract,
    bucket: input.bucket,
    fairProbability,
    breakevenProbability,
    edge,
    flagged: edge > threshold,
    marketAsk: input.marketAsk,
    feeEstimate,
    computedAt: input.computedAt ?? now(),
  };
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Abramowitz-Stegun approximation of the standard normal CDF. */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) prob = 1 - prob;
  return prob;
}
