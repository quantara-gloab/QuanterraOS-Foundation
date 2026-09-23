import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeCompositeIndex, realizedVolatility } from "../index-engine.ts";
import type { Tick } from "../index-engine.ts";

function tick(overrides: Partial<Tick> = {}): Tick {
  return {
    venue: "coinbase",
    asset: "BTC",
    price: 60000,
    volume: 10,
    observedAt: "2026-09-21T12:00:00Z",
    ...overrides,
  };
}

describe("computeCompositeIndex", () => {
  test("volume-weights agreeing venues", () => {
    const ticks = [
      tick({ venue: "coinbase", price: 60000, volume: 10 }),
      tick({ venue: "binance", price: 60010, volume: 30 }),
    ];
    const result = computeCompositeIndex(ticks);
    // weighted toward binance's larger volume
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
});

describe("realizedVolatility", () => {
  test("zero for a flat price series", () => {
    assert.equal(realizedVolatility([100, 100, 100, 100]), 0);
  });

  test("positive for a moving series", () => {
    assert.ok(realizedVolatility([100, 102, 99, 105, 98]) > 0);
  });
});
