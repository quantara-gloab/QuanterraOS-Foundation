import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeCalibrationFromMarkets, buildMarketsFromCsvText, type CalibrationMarket } from "../market-price-calibration.ts";

function market(overrides: Partial<CalibrationMarket> = {}): CalibrationMarket {
  return {
    ticker: "KXBTC15M-TEST",
    openTime: 1000,
    closeTime: 1900,
    result: "yes",
    candles: [{ timestamp: 1240, bid: 0.8, ask: 0.82 }],
    ...overrides,
  };
}

describe("computeCalibrationFromMarkets", () => {
  test("scores a well-predicted market with a low Brier score", () => {
    const result = computeCalibrationFromMarkets([market({ result: "yes", candles: [{ timestamp: 1240, bid: 0.9, ask: 0.92 }] })]);
    assert.equal(result.sampleSize, 1);
    assert.ok((result.averageBrierScore ?? 1) < 0.02);
  });

  test("skips markets with no candle before their own close", () => {
    const result = computeCalibrationFromMarkets([market({ closeTime: 1200, candles: [{ timestamp: 1500, bid: 0.5, ask: 0.5 }] })]);
    assert.equal(result.skippedNoEntryCandle, 1);
    assert.equal(result.sampleSize, 0);
  });

  test("skips markets with no candle near the minute-4 entry target", () => {
    const result = computeCalibrationFromMarkets([market({ candles: [{ timestamp: 1000, bid: 0.5, ask: 0.5 }] })]);
    assert.equal(result.skippedNoEntryCandle, 1);
  });

  test("ignores void/unresolved results entirely", () => {
    const result = computeCalibrationFromMarkets([market({ result: "void" })]);
    assert.equal(result.sampleSize, 0);
    assert.equal(result.totalUniqueMarkets, 1);
  });

  test("never uses a candle at or after the market's own close", () => {
    const result = computeCalibrationFromMarkets([
      market({
        openTime: 1000,
        closeTime: 1300,
        candles: [
          { timestamp: 1240, bid: 0.5, ask: 0.5 },
          { timestamp: 1300, bid: 0.99, ask: 0.99 }, // at close: must never be used
        ],
      }),
    ]);
    assert.equal(result.sampleSize, 1);
    // If the post-close candle leaked in, this would score near 0 instead.
    assert.ok((result.averageBrierScore ?? 0) > 0.2);
  });
});

describe("buildMarketsFromCsvText", () => {
  test("groups rows by ticker and sorts by open time", () => {
    const csv = [
      "ticker,timestamp,yes_bid,yes_ask,volume,result,open_time,close_time,strike_price,source",
      "KXBTC15M-B,200,0.4,0.42,100,no,200,1100,80000,live",
      "KXBTC15M-A,100,0.6,0.62,100,yes,100,1000,80000,live",
    ].join("\n");
    const markets = buildMarketsFromCsvText(csv);
    assert.equal(markets.length, 2);
    assert.equal(markets[0].ticker, "KXBTC15M-A");
    assert.equal(markets[1].ticker, "KXBTC15M-B");
  });
});
