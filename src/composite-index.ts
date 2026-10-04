/**
 * Quanterra BTC Composite Index Engine v0.1
 * 
 * Spec: HANDOFF.md Section F1, F2, F3 & docs/venues.md
 * Methodology v0.1: Volume-weighted median of eligible venues' mid-prices,
 * excluding Draco-flagged ticks (stale >5s, outlier >0.5% deviation from median).
 * Minimum 3 venues required or the value is SUPPRESSED (null).
 */
import Database from "better-sqlite3";

export const COMPOSITE_METHODOLOGY_VERSION = "0.1";

export interface VenueTick {
  venue: string;
  asset: string;
  price: number;
  volume?: number;
  observedAt: number; // Unix ms
  stale: boolean;
  outlier?: boolean;
}

export interface CompositeCalculationResult {
  asset: string;
  methodologyVersion: string;
  compositePrice: number | null;
  status: "ACTIVE" | "SUPPRESSED" | "DEGRADED";
  medianPrice: number | null;
  venuesUsed: string[];
  venuesRejected: Array<{
    venue: string;
    price: number;
    reason: "STALE" | "OUTLIER" | "MISSING_DATA";
    deviationPct?: number;
  }>;
  computedAt: string;
  timestampMs: number;
  sampleSize: number;
  disclaimer: string;
}

/**
 * Pure calculation of the Quanterra Composite Index v0.1 from a list of venue ticks.
 * 
 * @param ticks List of candidate venue ticks
 * @param options Configuration options
 */
export function computeCompositeV01(
  ticks: VenueTick[],
  options: {
    nowMs?: number;
    staleThresholdMs?: number;
    maxDeviationPct?: number;
    minVenues?: number;
  } = {}
): CompositeCalculationResult {
  const nowMs = options.nowMs ?? Date.now();
  const staleThresholdMs = options.staleThresholdMs ?? 5_000; // 5 seconds per Draco D3
  const maxDeviationPct = options.maxDeviationPct ?? 0.5;     // 0.5% (50 bps) per Draco D3
  const minVenues = options.minVenues ?? 3;                  // 3 venues per F1

  const asset = ticks.length > 0 ? ticks[0].asset : "BTC";
  const rejected: CompositeCalculationResult["venuesRejected"] = [];
  const freshTicks: VenueTick[] = [];

  // Step 1: Draco Freshness Gate
  for (const t of ticks) {
    const age = nowMs - t.observedAt;
    if (age > staleThresholdMs || t.stale) {
      rejected.push({
        venue: t.venue,
        price: t.price,
        reason: "STALE",
      });
    } else {
      freshTicks.push(t);
    }
  }

  if (freshTicks.length === 0) {
    return {
      asset,
      methodologyVersion: COMPOSITE_METHODOLOGY_VERSION,
      compositePrice: null,
      status: "SUPPRESSED",
      medianPrice: null,
      venuesUsed: [],
      venuesRejected: rejected,
      computedAt: new Date(nowMs).toISOString(),
      timestampMs: nowMs,
      sampleSize: 0,
      disclaimer: "Quanterra BTC Composite is an empirical approximation of spot conditions. Kalshi settles against official CME CF BRTI.",
    };
  }

  // Step 2: Compute cross-venue median
  const prices = freshTicks.map((t) => t.price).sort((a, b) => a - b);
  const midIndex = Math.floor(prices.length / 2);
  const medianPrice = prices.length % 2 === 0
    ? (prices[midIndex - 1] + prices[midIndex]) / 2
    : prices[midIndex];

  // Step 3: Draco Outlier Gate (> 0.5% deviation from cross-venue median)
  const nonOutlierTicks: VenueTick[] = [];
  for (const t of freshTicks) {
    const devPct = medianPrice === 0 ? 0 : (Math.abs(t.price - medianPrice) / medianPrice) * 100;
    if (devPct > maxDeviationPct) {
      rejected.push({
        venue: t.venue,
        price: t.price,
        reason: "OUTLIER",
        deviationPct: Math.round(devPct * 1000) / 1000,
      });
    } else {
      nonOutlierTicks.push(t);
    }
  }

  // Step 4: Quorum Verification (minimum 3 venues per F1)
  if (nonOutlierTicks.length < minVenues) {
    return {
      asset,
      methodologyVersion: COMPOSITE_METHODOLOGY_VERSION,
      compositePrice: null,
      status: "SUPPRESSED",
      medianPrice,
      venuesUsed: nonOutlierTicks.map((t) => t.venue),
      venuesRejected: rejected,
      computedAt: new Date(nowMs).toISOString(),
      timestampMs: nowMs,
      sampleSize: nonOutlierTicks.length,
      disclaimer: "Quanterra BTC Composite is an empirical approximation of spot conditions. Kalshi settles against official CME CF BRTI.",
    };
  }

  // Step 5: Volume-Weighted Composite Price
  // Default equal weighting if volume not provided, otherwise volume-weighted
  let totalVolume = 0;
  for (const t of nonOutlierTicks) {
    totalVolume += (t.volume && t.volume > 0) ? t.volume : 1;
  }

  let weightedSum = 0;
  for (const t of nonOutlierTicks) {
    const weight = (t.volume && t.volume > 0) ? t.volume : 1;
    weightedSum += t.price * weight;
  }

  const compositePrice = Math.round((weightedSum / totalVolume) * 100) / 100;

  return {
    asset,
    methodologyVersion: COMPOSITE_METHODOLOGY_VERSION,
    compositePrice,
    status: "ACTIVE",
    medianPrice: Math.round(medianPrice * 100) / 100,
    venuesUsed: nonOutlierTicks.map((t) => t.venue),
    venuesRejected: rejected,
    computedAt: new Date(nowMs).toISOString(),
    timestampMs: nowMs,
    sampleSize: nonOutlierTicks.length,
    disclaimer: "Quanterra BTC Composite is an empirical approximation of spot conditions. Kalshi settles against official CME CF BRTI.",
  };
}

/**
 * Fetch latest quotes from database and calculate current composite index.
 */
export function getLatestCompositeIndex(
  asset = "BTC",
  dbPath = "quanterraos.db",
  options?: { nowMs?: number; minVenues?: number }
): CompositeCalculationResult {
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db
      .prepare(
        `SELECT exchange_name as venue, price, fetched_at as observedAt 
         FROM exchange_prices 
         WHERE asset = ? 
         GROUP BY exchange_name 
         HAVING fetched_at = MAX(fetched_at) 
         ORDER BY exchange_name`
      )
      .all(asset) as Array<{ venue: string; price: number; observedAt: number }>;

    const ticks: VenueTick[] = rows.map((r) => ({
      venue: r.venue,
      asset,
      price: r.price,
      observedAt: r.observedAt,
      stale: false,
    }));

    // If options.nowMs not specified, take the maximum observedAt as epoch base for offline reproduction
    const nowMs = options?.nowMs ?? (ticks.length > 0 ? Math.max(...ticks.map((t) => t.observedAt)) : Date.now());

    return computeCompositeV01(ticks, {
      nowMs,
      minVenues: options?.minVenues,
    });
  } finally {
    db.close();
  }
}

/**
 * History query supporting pagination and time windows.
 */
export function getCompositeIndexHistory(
  asset = "BTC",
  dbPath = "quanterraos.db",
  fromMs?: number,
  toMs?: number,
  limit = 100
): Array<{ timestamp: number; price: number; asset: string }> {
  const db = new Database(dbPath, { readonly: true });
  try {
    const queryFrom = fromMs ?? Date.now() - 24 * 3600 * 1000;
    const queryTo = toMs ?? Date.now();

    const rows = db
      .prepare(
        `SELECT received_at as timestamp, CAST(raw_value AS REAL) as price, asset 
         FROM btc_index_ticks 
         WHERE asset = ? AND received_at >= ? AND received_at <= ? 
         ORDER BY received_at DESC 
         LIMIT ?`
      )
      .all(asset, queryFrom, queryTo, limit) as Array<{ timestamp: number; price: number; asset: string }>;

    return rows;
  } finally {
    db.close();
  }
}
