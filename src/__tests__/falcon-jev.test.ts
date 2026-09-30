import { test } from "node:test";
import assert from "node:assert/strict";
import { JevClient, createJevClient } from "../jev-client.ts";
import {
  buildCuratedTouchFeatures,
  formatJevCuratedState,
  computeFalconJevRecommendation,
  scoreFalconJevRecommendation,
} from "../agents/falcon-jev.ts";
import type { ResolutionRow } from "../scoring.ts";

test("JevClient unconfigured path returns clean abstain response", async () => {
  const client = new JevClient({ apiKey: undefined });
  assert.equal(client.isConfigured(), false);

  const res = await client.predict({
    contract: "KXBTC15M-TEST",
    state: { test: true },
  });

  assert.equal(res.configured, false);
  assert.equal(res.prediction, null);
  assert.ok(res.error?.includes("no TYPESAFE_API_KEY set"));
});

test("JevClient handles mock responses and parses calibrated probability", async () => {
  const mockFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({
        calibrated_probability: 0.42,
        delta: +0.04,
        confidence: 0.85,
        rationale: "Elevated bid depth imbalance suggests upward touch probability.",
        model: "jev-1.13.0",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const client = new JevClient({ apiKey: "test-key", fetchFn: mockFetch });
  assert.equal(client.isConfigured(), true);

  const res = await client.predict({
    contract: "KXBTC15M-TEST",
    state: { sample: 123 },
    quantBaseline: { probability: 0.38, model: "reflection_principle" },
  });

  assert.equal(res.configured, true);
  assert.ok(res.prediction !== null);
  assert.equal(res.prediction?.suggestedProbability, 0.42);
  assert.equal(res.prediction?.calibratedAdjustment, 0.04);
  assert.ok(res.prediction?.rationale.includes("bid depth imbalance"));
});

test("JevClient retries on HTTP 429 and succeeds on subsequent attempt", async () => {
  let callCount = 0;
  const mockFetch: typeof fetch = async () => {
    callCount++;
    if (callCount === 1) {
      return new Response("Too many requests", { status: 429 });
    }
    return new Response(
      JSON.stringify({
        suggested_probability: 0.55,
        rationale: "Recovered after rate limit.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const client = new JevClient({
    apiKey: "test-key",
    fetchFn: mockFetch,
    maxRetries: 2,
    backoffBaseMs: 10,
  });

  const res = await client.predict({
    contract: "KXBTC15M-TEST",
    state: {},
  });

  assert.equal(callCount, 2);
  assert.equal(res.prediction?.suggestedProbability, 0.55);
});

test("buildCuratedTouchFeatures extracts quant distance in std devs, vol, and order-book signals", () => {
  const baseTime = 1727500000000;
  const ticks = [
    { at: baseTime, value: 100_000 },
    { at: baseTime + 1_000, value: 100_040 },
    { at: baseTime + 2_000, value: 99_990 },
    { at: baseTime + 3_000, value: 100_030 },
  ];

  const orderbook = {
    marketTicker: "KXBTC15M-TEST",
    capturedAt: baseTime + 3_000,
    bestYesPrice: 0.45,
    bestNoPrice: 0.51,
    topImbalance: 0.1,
    depthImbalance: 0.25,
  };

  const features = buildCuratedTouchFeatures({
    contract: "KXBTC15M-TEST",
    strike: 100_200,
    remainingSeconds: 600, // 10 minutes
    pricesOrTicks: ticks,
    orderbookEvidence: orderbook,
  });

  assert.equal(features.contract, "KXBTC15M-TEST");
  assert.equal(features.currentPrice, 100_030);
  assert.equal(features.strike, 100_200);
  assert.equal(features.barrierType, "high");
  assert.equal(features.runningHighSoFar, 100_040);
  assert.equal(features.runningLowSoFar, 99_990);
  assert.equal(features.alreadyTouched, false);
  assert.equal(features.minutesRemaining, 10);
  assert.ok(features.distanceToStrikeStdDevs > 0);
  assert.ok(features.quantModelProbability > 0 && features.quantModelProbability < 1.0);

  assert.equal(features.orderbookSignals.depthImbalance, 0.25);
  assert.equal(features.orderbookSignals.topImbalance, 0.1);
  assert.equal(features.orderbookSignals.bestYesPrice, 0.45);
  assert.equal(features.orderbookSignals.bestNoPrice, 0.51);
  assert.equal(features.orderbookSignals.spread, 0.04);
});

test("formatJevCuratedState produces curated state object without raw order-book dump", () => {
  const features = buildCuratedTouchFeatures({
    contract: "KXBTC15M-TEST",
    strike: 100_100,
    remainingSeconds: 300,
    pricesOrTicks: [100_000, 100_050],
    orderbookEvidence: {
      marketTicker: "KXBTC15M-TEST",
      capturedAt: 1,
      bestYesPrice: 0.5,
      bestNoPrice: 0.48,
      topImbalance: 0.05,
      depthImbalance: 0.15,
    },
  });

  const formatted = formatJevCuratedState(features);
  assert.equal(formatted.contract, "KXBTC15M-TEST");
  assert.equal(formatted.strike, 100_100);
  assert.equal(formatted.current_price, 100_050);
  assert.ok("distance_to_strike_std_devs" in formatted);
  assert.ok("quant_model_probability" in formatted);
  assert.ok("realized_volatility" in formatted);
  assert.ok("secondary_orderbook_signals" in formatted);
});

test("computeFalconJevRecommendation returns pure quant baseline when Jev is unconfigured", async () => {
  const unconfiguredClient = new JevClient({ apiKey: undefined });

  const rec = await computeFalconJevRecommendation({
    contract: "KXBTC15M-TEST",
    strike: 100_200,
    remainingSeconds: 600,
    pricesOrTicks: [100_000, 100_020, 100_010],
    jevClient: unconfiguredClient,
  });

  assert.equal(rec.source, "falcon-jev-live");
  assert.equal(rec.jevConfigured, false);
  assert.equal(rec.jevAdjustment, 0);
  assert.equal(rec.suggestedProbability, rec.quantBaselineProbability);
  assert.ok(rec.rationale.includes("Quant baseline P="));
  assert.ok(rec.rationale.includes("Jev not configured"));
});

test("computeFalconJevRecommendation returns 1.0 immediately when barrier already touched", async () => {
  const rec = await computeFalconJevRecommendation({
    contract: "KXBTC15M-TEST",
    strike: 100_100,
    remainingSeconds: 600,
    // Price reached 100_150 earlier in the window
    pricesOrTicks: [100_000, 100_150, 100_050],
  });

  assert.equal(rec.suggestedProbability, 1.0);
  assert.equal(rec.quantBaselineProbability, 1.0);
  assert.ok(rec.rationale.includes("already touched"));
});

test("computeFalconJevRecommendation adjusts quant baseline with Jev prediction when configured", async () => {
  const mockFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({
        calibrated_probability: 0.35,
        rationale: "Heavy sell wall at 100,180 dampens upper barrier touch probability.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const configuredClient = new JevClient({ apiKey: "valid-key", fetchFn: mockFetch });

  const rec = await computeFalconJevRecommendation({
    contract: "KXBTC15M-TEST",
    strike: 100_200,
    remainingSeconds: 600,
    pricesOrTicks: [100_000, 100_020],
    jevClient: configuredClient,
  });

  assert.equal(rec.source, "falcon-jev-live");
  assert.equal(rec.jevConfigured, true);
  assert.equal(rec.suggestedProbability, 0.35);
  assert.ok(rec.rationale.includes("Jev calibrated: P=0.3500"));
  assert.ok(rec.rationale.includes("Heavy sell wall"));
});

test("scoreFalconJevRecommendation scores with distinct falcon-jev-live source", () => {
  const rec = {
    contract: "KXBTC15M-TEST",
    suggestedProbability: 0.45,
    generatedAt: "2026-09-29T20:00:00Z",
  };

  const resolution: ResolutionRow = {
    owner: "system",
    contract: "KXBTC15M-TEST",
    outcome: "NO",
    officialSource: "kalshi",
    resolvedAt: "2026-09-29T20:15:00Z",
    finalized: true,
  };

  const scored = scoreFalconJevRecommendation(rec, resolution);
  assert.equal(scored.observation.source, "falcon-jev-live");
  assert.equal(scored.observation.probability, 0.45);
  assert.equal(scored.observation.direction, "NO");
  assert.ok(scored.brierScore !== null);
  // (0.45 - 0)^2 = 0.2025
  assert.ok(Math.abs((scored.brierScore ?? 0) - 0.2025) < 1e-4);
});
