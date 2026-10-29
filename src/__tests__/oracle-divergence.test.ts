import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeOracleDivergence } from "../lib/oracle-divergence.ts";

describe("Oracle Settlement Divergence Monitor", () => {
  test("Detects basis divergence and oracle disconnect across strike", () => {
    const now = 1700000000000;
    const result = computeOracleDivergence({
      asset: "BTC",
      oracleType: "CF_BENCHMARK_BRTI",
      oraclePriceUsd: 99900,
      spotPriceUsd: 100100, // Spot moved above 100k, benchmark still lagging
      strikePriceUsd: 100000,
      oracleTimestampMs: now - 5000, // 5s ago
      currentTimestampMs: now,
      maxStalenessToleranceMs: 30000,
    });

    assert.equal(result.basisDivergenceUsd, 200);
    assert.equal(result.basisDivergenceBps, 20); // ~20 bps spread
    assert.equal(result.isOracleStale, false);
    assert.equal(result.actionableSignal, true);
    assert.match(result.signalReason, /ORACLE ARBITRAGE SIGNAL/);
  });

  test("Suppresses actionable signal when oracle is stale", () => {
    const now = 1700000000000;
    const result = computeOracleDivergence({
      asset: "ETH",
      oracleType: "CHAINLINK_AGGREGATOR",
      oraclePriceUsd: 3500,
      spotPriceUsd: 3550,
      strikePriceUsd: 3520,
      oracleTimestampMs: now - 45000, // 45s ago (exceeds 30s tolerance)
      currentTimestampMs: now,
      maxStalenessToleranceMs: 30000,
    });

    assert.equal(result.isOracleStale, true);
    assert.equal(result.actionableSignal, false);
    assert.match(result.signalReason, /EXECUTION BLOCKED/);
  });
});
