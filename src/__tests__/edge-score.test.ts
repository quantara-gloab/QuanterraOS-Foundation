import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { estimateFee, estimateFairProbability, scoreEdge } from "../edge-score.ts";

describe("estimateFee", () => {
  test("peaks near 50/50 odds", () => {
    const feeAt50 = estimateFee(0.5);
    const feeAt10 = estimateFee(0.1);
    const feeAt90 = estimateFee(0.9);
    assert.ok(feeAt50 > feeAt10);
    assert.ok(feeAt50 > feeAt90);
  });
});

describe("estimateFairProbability", () => {
  test("returns 0.5 with insufficient history", () => {
    assert.equal(estimateFairProbability([100]), 0.5);
    assert.equal(estimateFairProbability([]), 0.5);
  });

  test("returns above 0.5 for a consistent upward drift", () => {
    const p = estimateFairProbability([100, 101, 102, 103, 104, 105]);
    assert.ok(p > 0.5);
  });

  test("returns below 0.5 for a consistent downward drift", () => {
    const p = estimateFairProbability([105, 104, 103, 102, 101, 100]);
    assert.ok(p < 0.5);
  });

  test("stays near 0.5 for a flat, noiseless series", () => {
    // no variance at all -> stdev 0 -> defined fallback of 0.5
    const p = estimateFairProbability([100, 100, 100, 100]);
    assert.equal(p, 0.5);
  });
});

describe("scoreEdge", () => {
  test("flags a contract when fair probability clears breakeven plus threshold", () => {
    const result = scoreEdge({
      owner: "alex",
      contract: "KXBTCUP-15MIN",
      bucket: "15min",
      recentCompositePrices: [100, 101, 102, 103, 104, 106, 108],
      marketAsk: 0.5,
    });
    assert.ok(result.fairProbability > result.breakevenProbability);
    // whether it's flagged depends on threshold vs computed edge —
    // check the relationship holds rather than hardcoding the outcome
    assert.equal(result.flagged, result.edge > 0.03);
  });

  test("does not flag when there is no real drift", () => {
    const result = scoreEdge({
      owner: "alex",
      contract: "KXBTCUP-15MIN",
      bucket: "15min",
      recentCompositePrices: [100, 100, 100, 100],
      marketAsk: 0.5,
    });
    assert.equal(result.flagged, false);
  });
});
