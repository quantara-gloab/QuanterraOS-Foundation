/**
 * Composite currency index engine.
 *
 * Zero dependencies, pure functions over plain rows — same pattern as
 * scoring.ts. Takes raw ticks from multiple venues for one asset at
 * roughly the same timestamp, rejects outliers (a venue whose price is
 * too far from the cross-venue median), and produces a single
 * volume-weighted composite price so one bad feed can't skew the
 * "clock" the whole product is named after.
 */

export interface Tick {
  venue: string;
  asset: string;
  price: number;
  volume: number;
  observedAt: string;
}

export interface CompositeResult {
  asset: string;
  compositePrice: number | null;
  venuesUsed: string[];
  venuesRejected: { venue: string; price: number; reasonDeviationPct: number }[];
  computedAt: string;
}

/**
 * @param ticks          Ticks for a single asset, one per venue, from
 *                        roughly the same moment.
 * @param maxDeviationPct A venue is rejected if its price differs from
 *                        the cross-venue median by more than this
 *                        percentage. Default 1.5% — wide enough to
 *                        allow normal cross-venue spread, tight enough
 *                        to catch a stale or broken feed.
 */
export function computeCompositeIndex(
  ticks: Tick[],
  maxDeviationPct = 1.5,
  now: () => string = () => new Date().toISOString()
): CompositeResult {
  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: now(),
    };
  }

  const asset = ticks[0].asset;
  const median = medianOf(ticks.map((t) => t.price));

  const accepted: Tick[] = [];
  const rejected: CompositeResult["venuesRejected"] = [];

  for (const tick of ticks) {
    const deviationPct = median === 0 ? 0 : (Math.abs(tick.price - median) / median) * 100;
    if (deviationPct > maxDeviationPct) {
      rejected.push({ venue: tick.venue, price: tick.price, reasonDeviationPct: deviationPct });
    } else {
      accepted.push(tick);
    }
  }

  // If everything got rejected (e.g. all venues disagree wildly), fall
  // back to the raw median rather than returning nothing — a degraded
  // signal beats a missing one, but venuesUsed stays empty so callers
  // can see this happened and treat the value as low-confidence.
  if (accepted.length === 0) {
    return {
      asset,
      compositePrice: median,
      venuesUsed: [],
      venuesRejected: rejected,
      computedAt: now(),
    };
  }

  const totalVolume = accepted.reduce((sum, t) => sum + t.volume, 0);
  const compositePrice =
    totalVolume === 0
      ? medianOf(accepted.map((t) => t.price))
      : accepted.reduce((sum, t) => sum + t.price * t.volume, 0) / totalVolume;

  return {
    asset,
    compositePrice,
    venuesUsed: accepted.map((t) => t.venue),
    venuesRejected: rejected,
    computedAt: now(),
  };
}

/** Realized volatility (stdev of log returns) over a series of
 * composite prices, annualization left to the caller since the right
 * scaling factor depends on tick frequency. */
export function realizedVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const logReturns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] <= 0 || prices[i] <= 0) continue;
    logReturns.push(Math.log(prices[i] / prices[i - 1]));
  }
  if (logReturns.length < 2) return 0;
  const mean = logReturns.reduce((s, r) => s + r, 0) / logReturns.length;
  const variance =
    logReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (logReturns.length - 1);
  return Math.sqrt(variance);
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
