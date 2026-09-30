import { test } from "node:test";
import assert from "node:assert/strict";
import {
  oneTouchProbability,
  oneTouchHighProbability,
  oneTouchLowProbability,
  oneTouchFromMinuteVol,
  scaleVolatilityToPerSecond,
  scaleDriftToPerSecond,
  computeRealizedVolatility,
  realizedVolatilityPerSecond,
  annualizedRealizedVolatility,
  oneTouchFromPriceSeries,
} from "../barrier-touch.ts";

import { normalCdf } from "../btc15m-predictor.ts";

test("oneTouchProbability matches theoretical reflection principle: P = 2 * (1 - Phi(d))", () => {
  const currentPrice = 100_000;
  const strike = 100_500; // b = ln(100500/100000) ~ 0.0049875
  const remainingSeconds = 900; // 15 minutes
  const sigmaPerSecond = 0.0001; // 0.01% per second

  const b = Math.log(strike / currentPrice);
  const sigmaRootT = sigmaPerSecond * Math.sqrt(remainingSeconds);
  const d = b / sigmaRootT;
  const expectedProb = 2 * (1 - normalCdf(d));

  const calculatedProb = oneTouchProbability({
    currentPrice,
    strike,
    remainingSeconds,
    realizedVolatility: sigmaPerSecond,
  });

  assert.ok(Math.abs(calculatedProb - expectedProb) < 1e-12);
  // Also verify touch probability is exactly twice the digital terminal probability
  const terminalProb = 1 - normalCdf(d);
  assert.ok(Math.abs(calculatedProb - 2 * terminalProb) < 1e-12);
});

test("oneTouchProbability is 1.0 when price is already at or past the strike", () => {
  // At-the-money
  assert.equal(oneTouchProbability(100_000, 100_000, 300, 0.0001), 1.0);

  // High touch: price already higher than strike
  assert.equal(oneTouchProbability(100_200, 100_000, 300, 0.0001, { barrierType: "high" }), 1.0);
  assert.equal(oneTouchHighProbability(100_200, 100_000, 300, 0.0001), 1.0);

  // Low touch: price already lower than strike
  assert.equal(oneTouchProbability(99_800, 100_000, 300, 0.0001, { barrierType: "low" }), 1.0);
  assert.equal(oneTouchLowProbability(99_800, 100_000, 300, 0.0001), 1.0);
});

test("oneTouchProbability drops to 0 when remaining seconds is 0 without touch", () => {
  assert.equal(oneTouchProbability(100_000, 101_000, 0, 0.0001), 0.0);
  assert.equal(oneTouchProbability(100_000, 99_000, -5, 0.0001), 0.0);
});

test("oneTouchProbability is 0 when realized volatility is 0 and no drift exists", () => {
  assert.equal(oneTouchProbability(100_000, 100_500, 600, 0), 0.0);
});

test("oneTouchProbability increases monotonically with remaining time", () => {
  const p1m = oneTouchProbability(100_000, 100_500, 60, 0.0001);
  const p5m = oneTouchProbability(100_000, 100_500, 300, 0.0001);
  const p15m = oneTouchProbability(100_000, 100_500, 900, 0.0001);

  assert.ok(p1m < p5m);
  assert.ok(p5m < p15m);
});

test("oneTouchProbability increases monotonically with realized volatility", () => {
  const lowVol = oneTouchProbability(100_000, 101_000, 600, 0.00005);
  const medVol = oneTouchProbability(100_000, 101_000, 600, 0.0001);
  const highVol = oneTouchProbability(100_000, 101_000, 600, 0.0002);

  assert.ok(lowVol < medVol);
  assert.ok(medVol < highVol);
});

test("oneTouchProbability exhibits log-symmetry for equidistant upper and lower strikes", () => {
  const price = 100_000;
  const ratio = 1.01;
  const strikeHigh = price * ratio;
  const strikeLow = price / ratio;
  const seconds = 900;
  const vol = 0.0001;

  const pHigh = oneTouchProbability(price, strikeHigh, seconds, vol, { barrierType: "high" });
  const pLow = oneTouchProbability(price, strikeLow, seconds, vol, { barrierType: "low" });

  assert.ok(Math.abs(pHigh - pLow) < 1e-12);
});

test("positional and object calling conventions produce identical results", () => {
  const objResult = oneTouchProbability({
    currentPrice: 95_000,
    strike: 96_000,
    remainingSeconds: 450,
    realizedVolatility: 0.00015,
    volatilityUnit: "per_second",
  });

  const posResult = oneTouchProbability(95_000, 96_000, 450, 0.00015, {
    volatilityUnit: "per_second",
  });

  assert.equal(objResult, posResult);
});

test("volatilityUnit conversion correctly scales per_minute volatility", () => {
  const price = 100_000;
  const strike = 100_800;
  const seconds = 600;
  const sigmaMin = 0.001; // 0.1% per minute
  const sigmaSec = sigmaMin / Math.sqrt(60);

  const probFromMinute = oneTouchProbability(price, strike, seconds, sigmaMin, {
    volatilityUnit: "per_minute",
  });

  const probFromSec = oneTouchProbability(price, strike, seconds, sigmaSec, {
    volatilityUnit: "per_second",
  });

  const probHelper = oneTouchFromMinuteVol(price, strike, seconds, sigmaMin);

  assert.ok(Math.abs(probFromMinute - probFromSec) < 1e-12);
  assert.equal(probFromMinute, probHelper);
});

test("drift impacts first-passage probability in the expected direction", () => {
  const price = 100_000;
  const upperStrike = 101_000;
  const seconds = 900;
  const volPerSec = 0.0001;

  const pNoDrift = oneTouchProbability(price, upperStrike, seconds, volPerSec, { drift: 0 });
  const pUpwardDrift = oneTouchProbability(price, upperStrike, seconds, volPerSec, { drift: 0.00005 });
  const pDownwardDrift = oneTouchProbability(price, upperStrike, seconds, volPerSec, { drift: -0.00005 });

  // Upward drift makes hitting the upper barrier more likely
  assert.ok(pUpwardDrift > pNoDrift);
  assert.ok(pDownwardDrift < pNoDrift);
});

test("scaleVolatilityToPerSecond and scaleDriftToPerSecond work across units", () => {
  assert.equal(scaleVolatilityToPerSecond(0.06, "per_minute"), 0.06 / Math.sqrt(60));
  assert.equal(scaleVolatilityToPerSecond(0.8, "annual"), 0.8 / Math.sqrt(365.25 * 86_400));
  assert.equal(scaleVolatilityToPerSecond(0.001, "per_second"), 0.001);

  assert.equal(scaleDriftToPerSecond(0.06, "per_minute"), 0.06 / 60);
  assert.equal(scaleDriftToPerSecond(0.5, "annual"), 0.5 / (365.25 * 86_400));
});

test("handles edge cases cleanly without NaN or exceptions", () => {
  // Non-positive prices
  assert.equal(oneTouchProbability(0, 100_000, 300, 0.0001), 0.0);
  assert.equal(oneTouchProbability(100_000, -100, 300, 0.0001), 0.0);

  // Very large inputs / deep OTM
  const deepOtm = oneTouchProbability(100_000, 500_000, 60, 0.00001);
  assert.ok(deepOtm >= 0.0 && deepOtm < 1e-10);

  // Huge drift
  const hugeDrift = oneTouchProbability(100_000, 100_100, 60, 0.0001, { drift: 100 });
  assert.equal(hugeDrift, 1.0);
});

test("computeRealizedVolatility computes zero volatility on a flat price series", () => {
  const flatPrices = [100_000, 100_000, 100_000, 100_000, 100_000];
  const res = computeRealizedVolatility(flatPrices, { intervalSeconds: 1 });
  assert.ok(res !== null);
  assert.equal(res.perSecond, 0);
  assert.equal(res.perMinute, 0);
  assert.equal(res.annualized, 0);
  assert.equal(res.rawStdev, 0);
  assert.equal(res.sampleCount, 4);
});

test("computeRealizedVolatility correctly scales per-second, per-minute, and annualized volatility", () => {
  // 60 prices with 1-second intervals (total 59 seconds)
  const prices: number[] = [];
  let p = 100_000;
  for (let i = 0; i < 60; i++) {
    prices.push(p);
    p *= (i % 2 === 0 ? 1.0005 : 0.9995); // ~5 bps oscillations
  }

  const res = computeRealizedVolatility(prices, { intervalSeconds: 1 });
  assert.ok(res !== null);
  assert.ok(res.perSecond > 0);

  // Check scale relationships:
  // σ_min = σ_sec * √60
  assert.ok(Math.abs(res.perMinute - res.perSecond * Math.sqrt(60)) < 1e-12);

  // σ_annual = σ_sec * √(365.25 * 86400)
  const secondsPerYear = 365.25 * 86_400;
  assert.ok(Math.abs(res.annualized - res.perSecond * Math.sqrt(secondsPerYear)) < 1e-12);

  // For ~5 bps/sec standard deviation, annualized volatility should be in a plausible range (e.g. > 100%)
  assert.ok(res.annualized > 1.0);
});

test("computeRealizedVolatility parses timestamped ticks with irregular intervals", () => {
  const baseTime = 1727500000000; // ms
  const ticks = [
    { at: baseTime, value: 65_000 },
    { at: baseTime + 1_000, value: 65_020 }, // 1s delta
    { at: baseTime + 3_000, value: 65_010 }, // 2s delta
    { at: baseTime + 6_000, value: 65_035 }, // 3s delta
  ];

  const res = computeRealizedVolatility(ticks);
  assert.ok(res !== null);
  assert.equal(res.sampleCount, 3);
  assert.equal(res.elapsedSeconds, 6);
  assert.ok(res.perSecond > 0);
  assert.ok(res.annualized > 0);
});

test("realizedVolatilityPerSecond and annualizedRealizedVolatility return the respective scalar metrics", () => {
  const prices = [100_000, 100_050, 99_980, 100_030, 100_010];
  const full = computeRealizedVolatility(prices, { intervalSeconds: 1 });
  const sec = realizedVolatilityPerSecond(prices, { intervalSeconds: 1 });
  const ann = annualizedRealizedVolatility(prices, { intervalSeconds: 1 });

  assert.equal(sec, full?.perSecond);
  assert.equal(ann, full?.annualized);
});

test("oneTouchFromPriceSeries calculates barrier probability directly from a historical series", () => {
  // Create 30 1-second price ticks hovering around 100,000 with realistic volatility
  const prices: number[] = [];
  let price = 100_000;
  for (let i = 0; i < 30; i++) {
    prices.push(price);
    price += (i % 2 === 0 ? 15 : -12);
  }

  // Upper strike at 100,200 with 10 minutes (600s) remaining
  const pTouchHigh = oneTouchFromPriceSeries(prices, 100_200, 600, { intervalSeconds: 1 });
  assert.ok(pTouchHigh !== null);
  assert.ok(pTouchHigh > 0 && pTouchHigh < 1.0);

  // Lower strike at 99,800 with 10 minutes remaining
  const pTouchLow = oneTouchFromPriceSeries(prices, 99_800, 600, { intervalSeconds: 1 });
  assert.ok(pTouchLow !== null);
  assert.ok(pTouchLow > 0 && pTouchLow < 1.0);

  // Strike already touched: latest price is ~100,057, so strike 100,100 for low touch is already touched
  const pAlreadyTouched = oneTouchFromPriceSeries(prices, 100_100, 600, {
    intervalSeconds: 1,
    barrierType: "low",
  });
  // Since latest price 100,057 <= 100,100, for low touch, price is already below strike -> 1.0
  assert.equal(pAlreadyTouched, 1.0);

});

test("computeRealizedVolatility returns null when given fewer than minSamples", () => {
  assert.equal(computeRealizedVolatility([], { minSamples: 2 }), null);
  assert.equal(computeRealizedVolatility([100], { minSamples: 2 }), null);
  assert.equal(computeRealizedVolatility([100, 101], { minSamples: 5 }), null);
});

