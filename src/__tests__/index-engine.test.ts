import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeCompositeIndex,
  realizedVolatility,
  computeVolumeWeightedMedian,
  computeCmeBrtiPartitionedIndex,
  computeMedianAbsoluteDeviation,
  computeCoinDeskXbxIndex,
  computeBloombergBgciIndex,
  computeLukkaPrimeFmvIndex,
  computeCoinbaseDecayIndex,
  computePythConfidenceIndex,
  computeChainlinkOcrIndex,
  bftMinimumCommitteeSize,
  bftMaxFaults,
  computeTukeyIqrFences,
  computeBinanceCmcIndex,
  computePredictionMarketDivergence,
  computeInstitutionalBenchmark,
} from "../index-engine.ts";
import type { Tick, InstitutionalTick } from "../index-engine.ts";

function tick(overrides: Partial<InstitutionalTick> = {}): InstitutionalTick {
  return {
    venue: "coinbase",
    asset: "BTC",
    price: 60000,
    volume: 10,
    observedAt: "2026-09-21T12:00:00Z",
    ...overrides,
  };
}

describe("1. CME CF BRTI — Volume-Weighted Median & Partitioning", () => {
  test("computes correct volume-weighted median", () => {
    // 3 venues: price 100 with vol 10, price 105 with vol 50, price 110 with vol 10
    // Total vol = 70. 50% = 35. Price 105 holds cum volume from 10 to 60 -> VWM is 105
    const items = [
      { price: 100, volume: 10 },
      { price: 110, volume: 10 },
      { price: 105, volume: 50 },
    ];
    const vwm = computeVolumeWeightedMedian(items);
    assert.equal(vwm, 105);
  });

  test("partitions 12 x 5-second intervals correctly", () => {
    const ticks = [
      { price: 60000, volume: 5, timestampMs: 1000 },
      { price: 60020, volume: 10, timestampMs: 6000 },
      { price: 60040, volume: 8, timestampMs: 12000 },
    ];
    const result = computeCmeBrtiPartitionedIndex(ticks, 5000, 60000);
    assert.ok(result.compositePrice !== null);
    assert.equal(result.validIntervalsCount >= 2, true);
  });
});

describe("2. CoinDesk XBX — MAD Dynamic Trimming + Decay", () => {
  test("computes MAD and filters extreme outliers", () => {
    const prices = [100, 102, 101, 99, 100, 103, 101];
    const { median, mad } = computeMedianAbsoluteDeviation(prices);
    assert.equal(median, 101);
    assert.ok(mad >= 1);

    const ticks = [
      tick({ venue: "coinbase", price: 60000, volume: 10 }),
      tick({ venue: "kraken", price: 60050, volume: 10 }),
      tick({ venue: "bitstamp", price: 59980, volume: 10 }),
      tick({ venue: "outlier-venue", price: 75000, volume: 10 }), // Wild spike
    ];
    const res = computeCoinDeskXbxIndex(ticks, 3.0);
    assert.equal(res.venuesUsed.includes("outlier-venue"), false);
    assert.equal(res.venuesRejected.length, 1);
    assert.equal(res.venuesRejected[0].venue, "outlier-venue");
  });
});

describe("3. Bloomberg Galaxy (BGCI) — Spread Penalty & Constituent Cap", () => {
  test("downweights wide-spread venue and caps at 35%", () => {
    const ticks = [
      tick({ venue: "venueA", price: 60000, volume: 100, bid: 59995, ask: 60005 }), // Tight 1.6 bps spread
      tick({ venue: "venueB", price: 60000, volume: 100, bid: 59000, ask: 61000 }), // Wide 333 bps spread -> penalized
      tick({ venue: "venueC", price: 60010, volume: 100, bid: 59995, ask: 60005 }),
      tick({ venue: "venueD", price: 60010, volume: 100, bid: 59995, ask: 60005 }),
    ];
    const res = computeBloombergBgciIndex(ticks, 0.35);
    assert.ok(res.effectiveWeights["venueA"] <= 0.3501);
    assert.ok(res.effectiveWeights["venueB"] < res.effectiveWeights["venueA"]);
  });
});

describe("4. S&P / Lukka Prime FMV — Lot Size & Volatility Fence", () => {
  test("enforces standard lot size and volatility fence", () => {
    const ticks = [
      tick({ venue: "venueA", price: 60000, volume: 0.1 }), // Below lot size -> upgraded to 5.0
      tick({ venue: "venueB", price: 60020, volume: 10 }),
      tick({ venue: "venueC", price: 60010, volume: 5 }),
    ];
    const res = computeLukkaPrimeFmvIndex(ticks, 5.0);
    assert.ok(res.compositePrice !== null);
    assert.equal(res.lotSizeUsed, 5.0);
  });
});

describe("5. Coinbase 50 (COIN50) — Exponential Decay & Skew", () => {
  test("decays older ticks and computes harmonic/arithmetic skew", () => {
    const now = Date.now();
    const ticks = [
      tick({ venue: "recent", price: 60100, volume: 10, observedAtMs: now - 1000 }),
      tick({ venue: "stale", price: 59000, volume: 10, observedAtMs: now - 60000 }), // 60s old
    ];
    const res = computeCoinbaseDecayIndex(ticks, 10000, now);
    // Recent tick has overwhelmingly higher weight due to 10s half-life
    assert.ok(res.compositePrice! > 60000);
    assert.ok(res.harmonicMean > 0);
  });
});

describe("6. Pyth Network Oracle — Inverse-Variance Weighting", () => {
  test("weights quotes inversely proportional to confidence variance", () => {
    const ticks = [
      tick({ venue: "tight-spread", price: 60000, confidence: 5 }), // Small uncertainty -> high weight
      tick({ venue: "wide-spread", price: 60500, confidence: 500 }), // Huge uncertainty -> low weight
    ];
    const res = computePythConfidenceIndex(ticks);
    // Weighted strongly toward 60000
    assert.ok(res.compositePrice! < 60050);
    assert.ok(res.compositeConfidence > 0);
  });
});

describe("7. Chainlink OCR — Byzantine Fault-Tolerant Quorum & Heartbeat", () => {
  test("asserts BFT quorum committee bound is strictly 3*f + 1, not 2*f + 1 (CFT bound)", () => {
    // For f=1 Byzantine fault tolerance, committee must be 3(1) + 1 = 4, not 2(1) + 1 = 3
    assert.equal(bftMinimumCommitteeSize(1), 4);
    assert.equal(bftMinimumCommitteeSize(2), 7);
    assert.equal(bftMinimumCommitteeSize(3), 10);
    // Explicit assertion that BFT is NOT crash-fault tolerance (2f + 1)
    assert.notEqual(bftMinimumCommitteeSize(1), 2 * 1 + 1);
    assert.notEqual(bftMinimumCommitteeSize(2), 2 * 2 + 1);

    // Fault calculations
    assert.equal(bftMaxFaults(4), 1);
    assert.equal(bftMaxFaults(3), 0); // 3 nodes can tolerate 0 Byzantine faults
  });

  test("requires BFT quorum of 3*f + 1 nodes and calculates BFT median", () => {
    const now = Date.now();
    // 3 nodes cannot tolerate f=1 Byzantine fault: 3 < 3(1) + 1
    const threeNodes = [
      tick({ venue: "node1", price: 60000, observedAtMs: now - 1000 }),
      tick({ venue: "node2", price: 60010, observedAtMs: now - 2000 }),
      tick({ venue: "node3", price: 60020, observedAtMs: now - 3000 }),
    ];
    const resThree = computeChainlinkOcrIndex(threeNodes, 5, 1, now);
    assert.equal(resThree.quorumMet, false); // Fails BFT 3f+1 requirement (needs 4)

    // 4 fresh nodes meet 3(1)+1 requirement and tolerate f=1
    const fourNodes = [
      ...threeNodes,
      tick({ venue: "node4", price: 60030, observedAtMs: now - 1500 }),
      tick({ venue: "nodeStale", price: 59000, observedAtMs: now - 20000 }), // 20s old -> stale (>5s)
    ];
    const resFour = computeChainlinkOcrIndex(fourNodes, 5, 1, now);
    assert.equal(resFour.quorumMet, true);
    assert.equal(resFour.venuesUsed.includes("nodeStale"), false);
    assert.equal(resFour.maxFaultsTolerated, 1);
    assert.equal(resFour.minCommitteeRequired, 4);
    assert.equal(resFour.compositePrice, 60015); // median of 60000, 60010, 60020, 60030
  });
});

describe("8. Binance / CoinMarketCap (CMC200) — Tukey IQR Fences & Geometric Mean", () => {
  test("computes Tukey IQR fences and geometric mean", () => {
    const prices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const { iqr, lowerFence, upperFence } = computeTukeyIqrFences(prices);
    assert.ok(iqr > 0);
    assert.ok(lowerFence < 25);
    assert.ok(upperFence > 75);

    const ticks = [
      tick({ venue: "a", price: 100, volume: 10 }),
      tick({ venue: "b", price: 102, volume: 10 }),
      tick({ venue: "c", price: 101, volume: 10 }),
    ];
    const res = computeBinanceCmcIndex(ticks);
    assert.ok(res.geometricPrice !== null);
    assert.ok(Math.abs(res.geometricPrice! - 101) < 1);
  });
});

describe("9. Prediction Market Competitor Divergence — Polymarket / Kalshi CLOB", () => {
  test("computes quadratic taker fee and net cross-venue divergence", () => {
    const kalshi = { yesBid: 0.50, yesAsk: 0.52, feeRate: 0.07, venueName: "Kalshi" };
    const polymarket = { yesBid: 0.58, yesAsk: 0.60, feeRate: 0.02, venueName: "Polymarket" };

    const div = computePredictionMarketDivergence(kalshi, polymarket);
    assert.equal(div.venueAMid, 0.51);
    assert.equal(div.venueBMid, 0.59);
    assert.equal(div.grossDivergence, 0.08);
    // Net divergence accounts for taker fees and half spread
    assert.ok(div.netDivergence < div.grossDivergence);
    assert.equal(div.direction, "B_OVER_A");
  });
});

describe("Flagship Unified Institutional Benchmark", () => {
  test("aggregates all constituent methodologies into institutional benchmark", () => {
    const now = Date.now();
    const ticks: InstitutionalTick[] = [
      tick({ venue: "coinbase", price: 60000, volume: 20, bid: 59995, ask: 60005, observedAtMs: now - 500 }),
      tick({ venue: "kraken", price: 60010, volume: 15, bid: 60005, ask: 60015, observedAtMs: now - 600 }),
      tick({ venue: "bitstamp", price: 60005, volume: 10, bid: 60000, ask: 60010, observedAtMs: now - 700 }),
      tick({ venue: "gemini", price: 60020, volume: 8, bid: 60015, ask: 60025, observedAtMs: now - 800 }),
    ];

    const benchmark = computeInstitutionalBenchmark(ticks);
    assert.ok(benchmark.compositePrice! >= 60000 && benchmark.compositePrice! <= 60020);
    assert.ok(benchmark.methodologyTelemetry.cmeBrtiMedian !== null);
    assert.ok(benchmark.methodologyTelemetry.coindeskMadTrimmedPrice !== null);
    assert.ok(benchmark.methodologyTelemetry.bloombergBgciCappedPrice !== null);
    assert.ok(benchmark.methodologyTelemetry.pythConfidencePrice !== null);
    assert.ok(benchmark.methodologyTelemetry.chainlinkOcrMedian !== null);
    assert.ok(benchmark.methodologyTelemetry.binanceCmcGeometricPrice !== null);
  });
});

describe("Legacy / Backwards Compatibility", () => {
  test("volume-weights agreeing venues", () => {
    const ticks = [
      tick({ venue: "coinbase", price: 60000, volume: 10 }),
      tick({ venue: "binance", price: 60010, volume: 30 }),
    ];
    const result = computeCompositeIndex(ticks);
    assert.ok(result.compositePrice! > 60005);
    assert.equal(result.venuesUsed.length, 2);
    assert.equal(result.venuesRejected.length, 0);
  });

  test("rejects a venue that deviates beyond the threshold", () => {
    const ticks = [
      tick({ venue: "coinbase", price: 60000, volume: 10 }),
      tick({ venue: "binance", price: 60050, volume: 10 }),
      tick({ venue: "broken-feed", price: 90000, volume: 10 }),
    ];
    const result = computeCompositeIndex(ticks, 1.5);
    assert.equal(result.venuesUsed.includes("broken-feed"), false);
    assert.equal(result.venuesRejected.length, 1);
    assert.equal(result.venuesRejected[0].venue, "broken-feed");
  });

  test("falls back to median with empty venuesUsed if everything disagrees", () => {
    const ticks = [
      tick({ venue: "a", price: 100, volume: 1 }),
      tick({ venue: "b", price: 200, volume: 1 }),
    ];
    const result = computeCompositeIndex(ticks, 1);
    assert.equal(result.venuesUsed.length, 0);
    assert.ok(result.compositePrice !== null);
  });

  test("returns null composite for empty input", () => {
    const result = computeCompositeIndex([]);
    assert.equal(result.compositePrice, null);
  });

  test("realizedVolatility zero for flat and positive for moving", () => {
    assert.equal(realizedVolatility([100, 100, 100, 100]), 0);
    assert.ok(realizedVolatility([100, 102, 99, 105, 98]) > 0);
  });
});
