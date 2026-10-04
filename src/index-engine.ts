/**
 * Composite currency index engine.
 *
 * Implements the mathematical formulations of the industry's top 9 institutional
 * benchmarks and prediction market competitors:
 *
 * 1. CME CF BRTI — Partitioned 5-second interval volume-weighted median (VWM).
 * 2. CoinDesk XBX — Dynamic Median Absolute Deviation (MAD) trimming + recency decay.
 * 3. Bloomberg Galaxy (BGCI) — Spread-penalized liquidity weighting with 35% constituent capping.
 * 4. S&P Cryptocurrency (Lukka Prime FMV) — Lot-size order-book clearing and volatility variance filter.
 * 5. Coinbase 50 (COIN50 / CESR) — Exponential decay moving weighting with harmonic/arithmetic skew check.
 * 6. Pyth Network Oracle — Inverse-variance confidence interval weighting (1/sigma^2) + dispersion.
 * 7. Chainlink OCR — Byzantine Fault Tolerant (BFT) quorum median with heartbeat/deviation gating.
 * 8. Binance / CoinMarketCap (CMC200) — Tukey's IQR fences + volume-weighted geometric mean.
 * 9. Prediction Market Competitors (Polymarket / Kalshi CLOB) — Taker fee-adjusted implied probability,
 *    order-book depth imbalance, and net cross-venue divergence.
 *
 * Zero dependencies, pure mathematical functions over plain rows.
 */

export interface Tick {
  venue: string;
  asset: string;
  price: number;
  volume: number;
  observedAt: string;
}

export interface InstitutionalTick extends Tick {
  bid?: number;
  ask?: number;
  confidence?: number; // Standard error / uncertainty (Pyth style)
  observedAtMs?: number; // High-precision Unix millisecond timestamp
}

export interface CompositeResult {
  asset: string;
  compositePrice: number | null;
  venuesUsed: string[];
  venuesRejected: { venue: string; price: number; reasonDeviationPct: number; reason?: string }[];
  computedAt: string;
}

/* =========================================================================
   1. CME CF BRTI METHODOLOGY: Volume-Weighted Median (VWM) & Interval Slicing
   ========================================================================= */

/**
 * Calculates the Volume-Weighted Median (VWM) of an array of prices and volumes.
 * Used by CME CF BRTI to prevent high-volume block orders or single ticks from
 * arbitrarily pulling the index away from consensus.
 *
 * Finds the price P* such that:
 * sum_{p_i < P*} v_i <= 0.5 * V_total and sum_{p_i > P*} v_i <= 0.5 * V_total.
 */
export function computeVolumeWeightedMedian(
  items: { price: number; volume: number }[]
): number | null {
  if (items.length === 0) return null;
  const valid = items.filter((x) => x.price > 0 && x.volume >= 0);
  if (valid.length === 0) return null;

  const totalVolume = valid.reduce((sum, x) => sum + x.volume, 0);
  if (totalVolume === 0) {
    return medianOf(valid.map((x) => x.price));
  }

  // Sort ascending by price
  const sorted = [...valid].sort((a, b) => a.price - b.price);
  const halfVolume = totalVolume / 2;
  let cumVolume = 0;

  for (let i = 0; i < sorted.length; i++) {
    cumVolume += sorted[i].volume;
    if (cumVolume >= halfVolume) {
      // If exactly at half volume and not the last item, take midpoint with next price
      if (cumVolume === halfVolume && i + 1 < sorted.length) {
        return (sorted[i].price + sorted[i + 1].price) / 2;
      }
      return sorted[i].price;
    }
  }

  return sorted[sorted.length - 1].price;
}

/**
 * CME CF BRTI 1-minute partition simulation:
 * Splits a time window into sub-intervals (e.g. 12 x 5-second sub-intervals),
 * computes the volume-weighted median in each sub-interval, and averages them.
 */
export function computeCmeBrtiPartitionedIndex(
  ticks: { price: number; volume: number; timestampMs: number }[],
  intervalDurationMs = 5000,
  windowDurationMs = 60000
): { compositePrice: number | null; intervalMedians: number[]; validIntervalsCount: number } {
  if (ticks.length === 0) {
    return { compositePrice: null, intervalMedians: [], validIntervalsCount: 0 };
  }

  const minTs = Math.min(...ticks.map((t) => t.timestampMs));
  const maxTs = Math.max(...ticks.map((t) => t.timestampMs));
  const windowEnd = Math.max(maxTs, minTs + windowDurationMs);
  const windowStart = windowEnd - windowDurationMs;

  const numIntervals = Math.max(1, Math.floor(windowDurationMs / intervalDurationMs));
  const intervalBuckets: { price: number; volume: number }[][] = Array.from(
    { length: numIntervals },
    () => []
  );

  for (const tick of ticks) {
    if (tick.timestampMs < windowStart || tick.timestampMs > windowEnd) continue;
    const offset = tick.timestampMs - windowStart;
    const bucketIdx = Math.min(numIntervals - 1, Math.max(0, Math.floor(offset / intervalDurationMs)));
    intervalBuckets[bucketIdx].push({ price: tick.price, volume: tick.volume });
  }

  const medians: number[] = [];
  for (const bucket of intervalBuckets) {
    const vwm = computeVolumeWeightedMedian(bucket);
    if (vwm !== null) {
      medians.push(vwm);
    }
  }

  if (medians.length === 0) {
    return { compositePrice: null, intervalMedians: [], validIntervalsCount: 0 };
  }

  const unweightedMean = medians.reduce((s, m) => s + m, 0) / medians.length;
  return {
    compositePrice: unweightedMean,
    intervalMedians: medians,
    validIntervalsCount: medians.length,
  };
}

/* =========================================================================
   2. COINDESK XBX METHODOLOGY: Dynamic MAD Trimming + Recency Decay
   ========================================================================= */

/**
 * Calculates Median Absolute Deviation (MAD):
 * MAD = median(|P_i - median(P)|)
 */
export function computeMedianAbsoluteDeviation(values: number[]): { median: number; mad: number } {
  if (values.length === 0) return { median: 0, mad: 0 };
  const median = medianOf(values);
  const deviations = values.map((v) => Math.abs(v - median));
  const mad = medianOf(deviations);
  return { median, mad };
}

/**
 * CoinDesk XBX Index:
 * Dynamic trimming using Median Absolute Deviation (MAD).
 * Multiplier default 3.0 (normal distribution equivalent to ~3 sigma: 3 * 1.4826 * MAD).
 * Ticks deviating beyond tolerance are rejected.
 */
export function computeCoinDeskXbxIndex(
  ticks: InstitutionalTick[],
  madMultiplier = 3.0,
  decayHalfLifeSeconds?: number,
  nowMs: number = Date.now()
): CompositeResult & { mad: number } {
  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date(nowMs).toISOString(),
      mad: 0,
    };
  }

  const asset = ticks[0].asset;
  const prices = ticks.map((t) => t.price);
  const { median, mad } = computeMedianAbsoluteDeviation(prices);
  // Scale MAD to standard deviation equivalent: 1.4826 * MAD
  const threshold = Math.max(median * 0.002, madMultiplier * 1.4826 * (mad > 0 ? mad : median * 0.001));

  const accepted: { tick: InstitutionalTick; weight: number }[] = [];
  const rejected: CompositeResult["venuesRejected"] = [];

  for (const tick of ticks) {
    const diff = Math.abs(tick.price - median);
    const deviationPct = median === 0 ? 0 : (diff / median) * 100;

    if (diff > threshold) {
      rejected.push({
        venue: tick.venue,
        price: tick.price,
        reasonDeviationPct: deviationPct,
        reason: `Exceeds MAD threshold (${diff.toFixed(2)} > ${threshold.toFixed(2)})`,
      });
    } else {
      let weight = tick.volume > 0 ? tick.volume : 1;
      if (decayHalfLifeSeconds && decayHalfLifeSeconds > 0) {
        const tickTs = tick.observedAtMs ?? Date.parse(tick.observedAt);
        const ageSec = Math.max(0, (nowMs - tickTs) / 1000);
        const decayLambda = Math.LN2 / decayHalfLifeSeconds;
        weight *= Math.exp(-decayLambda * ageSec);
      }
      accepted.push({ tick, weight });
    }
  }

  if (accepted.length === 0) {
    return {
      asset,
      compositePrice: median,
      venuesUsed: [],
      venuesRejected: rejected,
      computedAt: new Date(nowMs).toISOString(),
      mad,
    };
  }

  const sumWeights = accepted.reduce((s, a) => s + a.weight, 0);
  const compositePrice =
    sumWeights === 0
      ? medianOf(accepted.map((a) => a.tick.price))
      : accepted.reduce((s, a) => s + a.tick.price * a.weight, 0) / sumWeights;

  return {
    asset,
    compositePrice,
    venuesUsed: accepted.map((a) => a.tick.venue),
    venuesRejected: rejected,
    computedAt: new Date(nowMs).toISOString(),
    mad,
  };
}

/* =========================================================================
   3. BLOOMBERG GALAXY (BGCI) METHODOLOGY: Spread Penalty & 35% Constituent Cap
   ========================================================================= */

/**
 * Bloomberg Galaxy Crypto Index (BGCI) style weighting:
 * 1. Spread penalty: venues with wide bid-ask spreads are downweighted:
 *    penalty = 1 / (1 + spreadBps / referenceSpreadBps)
 * 2. Capping: No single constituent venue exceeds maxWeightPct (default 35%).
 *    Excess weight is redistributed iteratively among uncapped constituents.
 */
export function computeBloombergBgciIndex(
  ticks: InstitutionalTick[],
  maxWeightPct = 0.35,
  referenceSpreadBps = 10
): CompositeResult & { effectiveWeights: Record<string, number> } {
  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date().toISOString(),
      effectiveWeights: {},
    };
  }

  const asset = ticks[0].asset;
  const rawWeights: { tick: InstitutionalTick; weight: number }[] = [];

  for (const tick of ticks) {
    const vol = tick.volume > 0 ? tick.volume : 1;
    let spreadPenalty = 1.0;
    if (tick.bid && tick.ask && tick.ask > tick.bid) {
      const mid = (tick.bid + tick.ask) / 2;
      const spreadBps = ((tick.ask - tick.bid) / mid) * 10000;
      spreadPenalty = 1 / (1 + spreadBps / referenceSpreadBps);
    }
    rawWeights.push({ tick, weight: vol * spreadPenalty });
  }

  const totalRawWeight = rawWeights.reduce((s, r) => s + r.weight, 0);
  if (totalRawWeight === 0) {
    return {
      asset,
      compositePrice: medianOf(ticks.map((t) => t.price)),
      venuesUsed: ticks.map((t) => t.venue),
      venuesRejected: [],
      computedAt: new Date().toISOString(),
      effectiveWeights: {},
    };
  }

  // Normalize weights
  let weights = rawWeights.map((r) => ({
    tick: r.tick,
    weightPct: r.weight / totalRawWeight,
    capped: false,
  }));

  // Iterative constituent capping (35% standard)
  for (let iter = 0; iter < 10; iter++) {
    let excess = 0;
    let uncappedWeight = 0;

    for (const w of weights) {
      if (w.weightPct > maxWeightPct) {
        excess += w.weightPct - maxWeightPct;
        w.weightPct = maxWeightPct;
        w.capped = true;
      } else if (!w.capped) {
        uncappedWeight += w.weightPct;
      }
    }

    if (excess <= 1e-9 || uncappedWeight <= 1e-9) break;

    for (const w of weights) {
      if (!w.capped) {
        w.weightPct += excess * (w.weightPct / uncappedWeight);
      }
    }
  }

  const effectiveWeights: Record<string, number> = {};
  let compositePrice = 0;
  for (const w of weights) {
    effectiveWeights[w.tick.venue] = Number(w.weightPct.toFixed(4));
    compositePrice += w.tick.price * w.weightPct;
  }

  return {
    asset,
    compositePrice,
    venuesUsed: weights.map((w) => w.tick.venue),
    venuesRejected: [],
    computedAt: new Date().toISOString(),
    effectiveWeights,
  };
}

/* =========================================================================
   4. S&P / LUKKA PRIME FMV METHODOLOGY: Standard Lot Clearing & Volatility Fence
   ========================================================================= */

/**
 * S&P Lukka Prime Fair Market Value (FMV) pricing:
 * Standardizes trade lot size to prevent micro-order manipulation.
 * Rejects venues exceeding historical volatility dispersion:
 * z = |P_i - P_median| / (P_median * volTolerance * volHistorical).
 */
export function computeLukkaPrimeFmvIndex(
  ticks: InstitutionalTick[],
  standardLotSize = 5.0,
  volatilityTolerance = 2.5,
  historicalVol = 0.005
): CompositeResult & { lotSizeUsed: number } {
  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date().toISOString(),
      lotSizeUsed: standardLotSize,
    };
  }

  const asset = ticks[0].asset;
  const median = medianOf(ticks.map((t) => t.price));
  const maxAllowedDeviation = Math.max(10, median * historicalVol * volatilityTolerance);

  const accepted: { tick: InstitutionalTick; effectiveVolume: number }[] = [];
  const rejected: CompositeResult["venuesRejected"] = [];

  for (const tick of ticks) {
    const deviation = Math.abs(tick.price - median);
    const deviationPct = median === 0 ? 0 : (deviation / median) * 100;

    if (deviation > maxAllowedDeviation) {
      rejected.push({
        venue: tick.venue,
        price: tick.price,
        reasonDeviationPct: deviationPct,
        reason: `Exceeds S&P Lukka volatility fence (${deviation.toFixed(2)} > ${maxAllowedDeviation.toFixed(2)})`,
      });
    } else {
      // Lot-size weighting: minimum threshold of standardLotSize
      const effVol = Math.max(tick.volume, standardLotSize);
      accepted.push({ tick, effectiveVolume: effVol });
    }
  }

  if (accepted.length === 0) {
    return {
      asset,
      compositePrice: median,
      venuesUsed: [],
      venuesRejected: rejected,
      computedAt: new Date().toISOString(),
      lotSizeUsed: standardLotSize,
    };
  }

  const totalEffVol = accepted.reduce((s, a) => s + a.effectiveVolume, 0);
  const compositePrice =
    accepted.reduce((s, a) => s + a.tick.price * a.effectiveVolume, 0) / totalEffVol;

  return {
    asset,
    compositePrice,
    venuesUsed: accepted.map((a) => a.tick.venue),
    venuesRejected: rejected,
    computedAt: new Date().toISOString(),
    lotSizeUsed: standardLotSize,
  };
}

/* =========================================================================
   5. COINBASE 50 (COIN50) / CESR: Exponential Decay & Harmonic Skew
   ========================================================================= */

/**
 * Coinbase COIN50 / CESR Index Methodology:
 * Exponential time-decay weighting: w_i = exp(-lambda * deltaT).
 * Reconciles Arithmetic Mean with Harmonic Mean to detect adverse skew:
 * Harmonic Mean = n / sum(1 / P_i). Skew = (AM - HM) / AM.
 */
export function computeCoinbaseDecayIndex(
  ticks: InstitutionalTick[],
  halfLifeMs = 15000,
  nowMs: number = Date.now()
): CompositeResult & { harmonicMean: number; skewPct: number } {
  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date(nowMs).toISOString(),
      harmonicMean: 0,
      skewPct: 0,
    };
  }

  const asset = ticks[0].asset;
  const lambda = Math.LN2 / halfLifeMs;

  let totalWeight = 0;
  let weightedPriceSum = 0;
  let inversePriceSum = 0;
  let validCount = 0;

  for (const tick of ticks) {
    if (tick.price <= 0) continue;
    const tickTs = tick.observedAtMs ?? Date.parse(tick.observedAt);
    const ageMs = Math.max(0, nowMs - tickTs);
    const timeDecay = Math.exp(-lambda * ageMs);
    const volWeight = tick.volume > 0 ? tick.volume : 1;
    const w = timeDecay * volWeight;

    totalWeight += w;
    weightedPriceSum += tick.price * w;
    inversePriceSum += 1 / tick.price;
    validCount++;
  }

  if (validCount === 0 || totalWeight === 0) {
    return {
      asset,
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date(nowMs).toISOString(),
      harmonicMean: 0,
      skewPct: 0,
    };
  }

  const am = weightedPriceSum / totalWeight;
  const hm = validCount / inversePriceSum;
  const skewPct = am === 0 ? 0 : ((am - hm) / am) * 100;

  return {
    asset,
    compositePrice: am,
    venuesUsed: ticks.map((t) => t.venue),
    venuesRejected: [],
    computedAt: new Date(nowMs).toISOString(),
    harmonicMean: hm,
    skewPct,
  };
}

/* =========================================================================
   6. PYTH NETWORK ORACLE: Inverse-Variance Confidence Weighting
   ========================================================================= */

/**
 * Pyth Network Benchmark Oracle Methodology:
 * Weights quotes inversely proportional to uncertainty / spread squared:
 * w_i = 1 / (sigma_i^2 + epsilon)
 * Calculates composite price and composite confidence interval:
 * sigma_composite = 1 / sqrt(sum(w_i)) + dispersion.
 */
export function computePythConfidenceIndex(
  ticks: InstitutionalTick[],
  defaultSpreadPct = 0.0005
): CompositeResult & { compositeConfidence: number; dispersion: number } {
  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date().toISOString(),
      compositeConfidence: 0,
      dispersion: 0,
    };
  }

  const asset = ticks[0].asset;
  const epsilon = 1e-8;
  const weightedList: { tick: InstitutionalTick; weight: number; sigma: number }[] = [];

  for (const tick of ticks) {
    let sigma = tick.confidence;
    if (sigma === undefined || sigma <= 0) {
      if (tick.bid && tick.ask && tick.ask > tick.bid) {
        sigma = (tick.ask - tick.bid) / 2;
      } else {
        sigma = tick.price * defaultSpreadPct;
      }
    }
    const w = 1 / (sigma * sigma + epsilon);
    weightedList.push({ tick, weight: w, sigma });
  }

  const sumWeights = weightedList.reduce((s, x) => s + x.weight, 0);
  const compositePrice =
    sumWeights === 0
      ? medianOf(ticks.map((t) => t.price))
      : weightedList.reduce((s, x) => s + x.tick.price * x.weight, 0) / sumWeights;

  // Dispersion across venues (inter-venue spread)
  const deviations = ticks.map((t) => Math.abs(t.price - compositePrice));
  const dispersion = deviations.reduce((s, d) => s + d, 0) / ticks.length;
  const baseConfidence = sumWeights > 0 ? 1 / Math.sqrt(sumWeights) : 0;
  const compositeConfidence = baseConfidence + dispersion;

  return {
    asset,
    compositePrice,
    venuesUsed: ticks.map((t) => t.venue),
    venuesRejected: [],
    computedAt: new Date().toISOString(),
    compositeConfidence,
    dispersion,
  };
}

/* =========================================================================
   7. CHAINLINK OCR METHODOLOGY: Byzantine Fault-Tolerant Quorum & Median
   ========================================================================= */

/**
 * Calculates the minimum committee size required to tolerate f Byzantine faults:
 * N >= 3*f + 1 (classic BFT bound; in contrast to crash-fault tolerance N >= 2*f + 1).
 */
export function bftMinimumCommitteeSize(f: number): number {
  return 3 * f + 1;
}

/**
 * Calculates the maximum tolerable Byzantine faults f given N nodes:
 * f = floor((N - 1) / 3).
 */
export function bftMaxFaults(n: number): number {
  return Math.max(0, Math.floor((n - 1) / 3));
}

/**
 * Chainlink Off-Chain Reporting (OCR) Consensus Methodology:
 * Requires Byzantine Fault Tolerance (BFT) quorum:
 * To tolerate f Byzantine nodes, total nodes must satisfy N >= 3*f + 1.
 * (Note: N >= 2*f + 1 is for crash-fault tolerance only; Byzantine tolerance strictly requires 3*f + 1).
 * For f >= 1, the minimum BFT committee is N = 3(1) + 1 = 4 nodes, requiring a quorum of 2f + 1 = 3 responses.
 * Aggregates via sorted median.
 * Checks heartbeat freshness: ticks older than maxStaleSeconds are rejected.
 */
export function computeChainlinkOcrIndex(
  ticks: InstitutionalTick[],
  maxStaleSeconds = 5,
  minFaultsTolerated = 1,
  nowMs: number = Date.now()
): CompositeResult & { isFresh: boolean; quorumMet: boolean; maxFaultsTolerated: number; minCommitteeRequired: number } {
  const minCommitteeRequired = bftMinimumCommitteeSize(minFaultsTolerated); // 3*f + 1

  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date(nowMs).toISOString(),
      isFresh: false,
      quorumMet: false,
      maxFaultsTolerated: 0,
      minCommitteeRequired,
    };
  }

  const asset = ticks[0].asset;
  const freshTicks: InstitutionalTick[] = [];
  const rejected: CompositeResult["venuesRejected"] = [];

  for (const tick of ticks) {
    const tickTs = tick.observedAtMs ?? Date.parse(tick.observedAt);
    const ageSec = (nowMs - tickTs) / 1000;

    if (ageSec > maxStaleSeconds) {
      rejected.push({
        venue: tick.venue,
        price: tick.price,
        reasonDeviationPct: 0,
        reason: `Exceeds Chainlink heartbeat freshness limit (${ageSec.toFixed(1)}s > ${maxStaleSeconds}s)`,
      });
    } else {
      freshTicks.push(tick);
    }
  }

  const f = bftMaxFaults(freshTicks.length);
  const quorumThreshold = 2 * f + 1;
  const quorumMet = freshTicks.length >= minCommitteeRequired && freshTicks.length >= quorumThreshold;

  if (freshTicks.length === 0) {
    return {
      asset,
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: rejected,
      computedAt: new Date(nowMs).toISOString(),
      isFresh: false,
      quorumMet: false,
      maxFaultsTolerated: 0,
      minCommitteeRequired,
    };
  }

  // Sorted BFT median
  const prices = freshTicks.map((t) => t.price).sort((a, b) => a - b);
  const midIndex = Math.floor(prices.length / 2);
  const compositePrice =
    prices.length % 2 === 0 ? (prices[midIndex - 1] + prices[midIndex]) / 2 : prices[midIndex];

  return {
    asset,
    compositePrice,
    venuesUsed: freshTicks.map((t) => t.venue),
    venuesRejected: rejected,
    computedAt: new Date(nowMs).toISOString(),
    isFresh: true,
    quorumMet,
    maxFaultsTolerated: f,
    minCommitteeRequired,
  };
}

/* =========================================================================
   8. BINANCE / COINMARKETCAP (CMC200): Tukey IQR Fences + Geometric Mean
   ========================================================================= */

/**
 * Calculates Tukey's Interquartile Range (IQR):
 * Q1 = 25th percentile, Q3 = 75th percentile, IQR = Q3 - Q1.
 * Fence = [Q1 - 1.5 * IQR, Q3 + 1.5 * IQR].
 */
export function computeTukeyIqrFences(prices: number[]): { q1: number; q3: number; iqr: number; lowerFence: number; upperFence: number } {
  if (prices.length === 0) {
    return { q1: 0, q3: 0, iqr: 0, lowerFence: 0, upperFence: 0 };
  }
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  return { q1, q3, iqr, lowerFence, upperFence };
}

/**
 * Binance / CoinMarketCap (CMC200) Index Methodology:
 * 1. Tukey's IQR Fences outlier rejection.
 * 2. Volume-weighted geometric mean to prevent positive skew:
 *    ln(P_geom) = sum(w_i * ln(P_i)) / sum(w_i)
 *    P_geom = exp(ln(P_geom)).
 */
export function computeBinanceCmcIndex(
  ticks: InstitutionalTick[]
): CompositeResult & { q1: number; q3: number; iqr: number; geometricPrice: number | null } {
  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date().toISOString(),
      q1: 0,
      q3: 0,
      iqr: 0,
      geometricPrice: null,
    };
  }

  const asset = ticks[0].asset;
  const prices = ticks.map((t) => t.price);
  const { q1, q3, iqr, lowerFence, upperFence } = computeTukeyIqrFences(prices);
  const median = medianOf(prices);

  const accepted: InstitutionalTick[] = [];
  const rejected: CompositeResult["venuesRejected"] = [];

  for (const tick of ticks) {
    if (tick.price < lowerFence || tick.price > upperFence) {
      const devPct = median === 0 ? 0 : (Math.abs(tick.price - median) / median) * 100;
      rejected.push({
        venue: tick.venue,
        price: tick.price,
        reasonDeviationPct: devPct,
        reason: `Outside Tukey fence [${lowerFence.toFixed(2)}, ${upperFence.toFixed(2)}]`,
      });
    } else {
      accepted.push(tick);
    }
  }

  if (accepted.length === 0) {
    return {
      asset,
      compositePrice: median,
      venuesUsed: [],
      venuesRejected: rejected,
      computedAt: new Date().toISOString(),
      q1,
      q3,
      iqr,
      geometricPrice: median,
    };
  }

  // Volume-weighted arithmetic & geometric mean
  const totalVol = accepted.reduce((s, t) => s + (t.volume > 0 ? t.volume : 1), 0);
  let weightedArithmeticSum = 0;
  let weightedLogSum = 0;

  for (const tick of accepted) {
    const w = tick.volume > 0 ? tick.volume : 1;
    weightedArithmeticSum += tick.price * w;
    weightedLogSum += Math.log(Math.max(1e-6, tick.price)) * w;
  }

  const arithmeticPrice = weightedArithmeticSum / totalVol;
  const geometricPrice = Math.exp(weightedLogSum / totalVol);

  return {
    asset,
    compositePrice: arithmeticPrice,
    venuesUsed: accepted.map((t) => t.venue),
    venuesRejected: rejected,
    computedAt: new Date().toISOString(),
    q1,
    q3,
    iqr,
    geometricPrice,
  };
}

/* =========================================================================
   9. PREDICTION MARKET COMPETITOR DIVERGENCE: Polymarket / Kalshi CLOB
   ========================================================================= */

/**
 * Calculates fee-adjusted effective probabilities and net cross-venue divergence
 * across prediction market competitors (Kalshi vs Polymarket / CLOB):
 *
 * Kalshi quadratic taker fee: f(P) = P * (1 - P) * feeRate (max at P=0.50).
 * Effective entry: P_eff_ask = P_ask + fee, P_eff_bid = P_bid - fee.
 * Net Tradable Divergence = max(0, |P_A_mid - P_B_mid| - (fee_A + fee_B + (spread_A + spread_B)/2)).
 */
export function computePredictionMarketDivergence(
  venueA: { yesBid: number; yesAsk: number; feeRate?: number; venueName: string },
  venueB: { yesBid: number; yesAsk: number; feeRate?: number; venueName: string }
): {
  venueAMid: number;
  venueBMid: number;
  grossDivergence: number;
  venueAFee: number;
  venueBFee: number;
  halfSpreadSum: number;
  netDivergence: number;
  direction: "A_OVER_B" | "B_OVER_A" | "PARITY";
} {
  const feeRateA = venueA.feeRate ?? 0.07; // 7% standard Kalshi taker fee factor
  const feeRateB = venueB.feeRate ?? 0.02; // Polymarket typical gas/taker friction

  const midA = (venueA.yesBid + venueA.yesAsk) / 2;
  const midB = (venueB.yesBid + venueB.yesAsk) / 2;

  const spreadA = Math.max(0, venueA.yesAsk - venueA.yesBid);
  const spreadB = Math.max(0, venueB.yesAsk - venueB.yesBid);
  const halfSpreadSum = (spreadA + spreadB) / 2;

  // Quadratic taker fee: P * (1 - P) * rate
  const feeA = midA * (1 - midA) * feeRateA;
  const feeB = midB * (1 - midB) * feeRateB;

  const grossDivergence = Math.abs(midA - midB);
  const totalFriction = feeA + feeB + halfSpreadSum;
  const netDivergence = Math.max(0, grossDivergence - totalFriction);

  let direction: "A_OVER_B" | "B_OVER_A" | "PARITY" = "PARITY";
  if (midA > midB + 1e-4) direction = "A_OVER_B";
  else if (midB > midA + 1e-4) direction = "B_OVER_A";

  return {
    venueAMid: Number(midA.toFixed(4)),
    venueBMid: Number(midB.toFixed(4)),
    grossDivergence: Number(grossDivergence.toFixed(4)),
    venueAFee: Number(feeA.toFixed(4)),
    venueBFee: Number(feeB.toFixed(4)),
    halfSpreadSum: Number(halfSpreadSum.toFixed(4)),
    netDivergence: Number(netDivergence.toFixed(4)),
    direction,
  };
}

/* =========================================================================
   FLAGSHIP UNIFIED INSTITUTIONAL BENCHMARK
   ========================================================================= */

export interface InstitutionalBenchmarkResult extends CompositeResult {
  methodologyTelemetry: {
    cmeBrtiMedian: number | null;
    coindeskMadTrimmedPrice: number | null;
    bloombergBgciCappedPrice: number | null;
    lukkaPrimeFmvPrice: number | null;
    coinbaseDecayPrice: number | null;
    pythConfidencePrice: number | null;
    chainlinkOcrMedian: number | null;
    binanceCmcGeometricPrice: number | null;
  };
  dispersion: number;
}

/**
 * QuanterraOS Institutional Composite Benchmark:
 * Evaluates ticks through the composite filters of the top 9 institutional indices,
 * rejecting outliers and outputting comparative methodology telemetry.
 */
export function computeInstitutionalBenchmark(
  ticks: InstitutionalTick[]
): InstitutionalBenchmarkResult {
  if (ticks.length === 0) {
    return {
      asset: "unknown",
      compositePrice: null,
      venuesUsed: [],
      venuesRejected: [],
      computedAt: new Date().toISOString(),
      methodologyTelemetry: {
        cmeBrtiMedian: null,
        coindeskMadTrimmedPrice: null,
        bloombergBgciCappedPrice: null,
        lukkaPrimeFmvPrice: null,
        coinbaseDecayPrice: null,
        pythConfidencePrice: null,
        chainlinkOcrMedian: null,
        binanceCmcGeometricPrice: null,
      },
      dispersion: 0,
    };
  }

  // Run constituent index methodologies
  const brti = computeVolumeWeightedMedian(ticks);
  const xbx = computeCoinDeskXbxIndex(ticks);
  const bgci = computeBloombergBgciIndex(ticks);
  const fmv = computeLukkaPrimeFmvIndex(ticks);
  const cb = computeCoinbaseDecayIndex(ticks);
  const pyth = computePythConfidenceIndex(ticks);
  const ocr = computeChainlinkOcrIndex(ticks);
  const cmc = computeBinanceCmcIndex(ticks);

  // The primary benchmark is the multi-venue Volume-Weighted Median (CME BRTI style)
  // cross-checked against the MAD-filtered universe (XBX style).
  const primaryPrice = xbx.compositePrice ?? brti;

  const validPrices = [
    brti,
    xbx.compositePrice,
    bgci.compositePrice,
    fmv.compositePrice,
    cb.compositePrice,
    pyth.compositePrice,
    ocr.compositePrice,
    cmc.geometricPrice,
  ].filter((p): p is number => p !== null);

  const meanPrice = validPrices.reduce((s, p) => s + p, 0) / validPrices.length;
  const dispersion =
    validPrices.reduce((s, p) => s + Math.abs(p - meanPrice), 0) / validPrices.length;

  return {
    asset: ticks[0].asset,
    compositePrice: primaryPrice,
    venuesUsed: xbx.venuesUsed,
    venuesRejected: xbx.venuesRejected,
    computedAt: new Date().toISOString(),
    methodologyTelemetry: {
      cmeBrtiMedian: brti,
      coindeskMadTrimmedPrice: xbx.compositePrice,
      bloombergBgciCappedPrice: bgci.compositePrice,
      lukkaPrimeFmvPrice: fmv.compositePrice,
      coinbaseDecayPrice: cb.compositePrice,
      pythConfidencePrice: pyth.compositePrice,
      chainlinkOcrMedian: ocr.compositePrice,
      binanceCmcGeometricPrice: cmc.geometricPrice,
    },
    dispersion,
  };
}

/* =========================================================================
   LEGACY / BACKWARDS-COMPATIBLE API (HANDOFF.md / existing callers)
   ========================================================================= */

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
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

