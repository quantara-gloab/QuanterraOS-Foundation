import { test } from "node:test";
import assert from "node:assert/strict";
import { normalCdf, perMinuteVolatility, probabilityYes, minuteCloses, buildPrediction } from "../btc15m-predictor.ts";

test("normalCdf matches known values", () => {
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-7);
  assert.ok(Math.abs(normalCdf(1.96) - 0.975) < 1e-3);
  assert.ok(Math.abs(normalCdf(-1.96) - 0.025) < 1e-3);
});

test("probabilityYes reflects Ito convexity at the strike and moves with distance and time", () => {
  const base = { strike: 100_000, sigmaPerMinute: 0.0005 };
  const atStrike = probabilityYes({ ...base, price: 100_000, minutesLeft: 10 });
  // With Ito correction -0.5*sigma^2*tau, P is slightly below 0.5 (median < mean in lognormal)
  assert.ok(Math.abs(atStrike - 0.5) < 1e-3);
  assert.ok(atStrike < 0.5);
  const above = probabilityYes({ ...base, price: 100_100, minutesLeft: 10 });
  assert.ok(above > 0.5);
  assert.ok(probabilityYes({ ...base, price: 100_100, minutesLeft: 1 }) > above);
  assert.equal(probabilityYes({ ...base, price: 99_000, minutesLeft: 0 }), 0);
});

test("minuteCloses takes the last tick at or before each boundary", () => {
  const now = 10 * 60_000;
  const ticks = Array.from({ length: 11 }, (_, m) => ({ at: m * 60_000 - 1, value: 100 + m }));
  assert.deepEqual(minuteCloses(ticks, now, 3), [107, 108, 109, 110]);
});

test("perMinuteVolatility needs enough history", () => {
  assert.equal(perMinuteVolatility([1, 2, 3]), null);
  assert.ok((perMinuteVolatility(Array.from({ length: 30 }, (_, i) => 100 + (i % 2))) ?? 0) > 0);
});

test("buildPrediction headlines the market price and falls back cleanly on stale BRTI", () => {
  const now = Date.parse("2026-09-28T23:40:00Z");
  const market = {
    ticker: "KXBTC15M-TEST", open_time: "2026-09-28T23:30:00Z", close_time: "2026-09-28T23:45:00Z", floor_strike: 100_000,
    yes_bid_dollars: "0.60", yes_ask_dollars: "0.62", no_bid_dollars: "0.38", no_ask_dollars: "0.40",
  };
  const stale = buildPrediction(market, [{ at: now - 120_000, value: 100_050 }], now);
  assert.equal(stale.prediction?.pHigher, 0.61);
  assert.ok(!("lean" in (stale.prediction ?? {})));
  assert.equal(stale.model, null);
  assert.equal(stale.brti?.fresh, false);

  const history = Array.from({ length: 61 }, (_, i) => ({ at: now - (60 - i) * 60_000, value: 100_000 + (i % 2 ? 40 : -40) }));
  history.push({ at: now - 1_000, value: 100_050 });
  const fresh = buildPrediction(market, history, now);
  assert.equal(fresh.brti?.fresh, true);
  assert.ok(fresh.model && fresh.model.pHigher > 0.5 && fresh.model.pHigher < 1);
  assert.equal(fresh.prediction?.source, "market mid-price");
});
