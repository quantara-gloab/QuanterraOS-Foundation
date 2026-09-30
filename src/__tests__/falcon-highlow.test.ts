import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeHighLowRecommendation,
  runHighLowBatch,
  evaluateHighLowPair,
  type OpenHighLowContract,
} from "../agents/falcon-highlow.ts";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const NOW = new Date("2026-09-29T20:00:00.000Z");

/** 30 flat price ticks at 100,000 — zero realized volatility. */
const FLAT_TICKS = Array.from({ length: 30 }, () => 100_000);

/** 30 mildly oscillating ticks around 100,000 — realistic low volatility. */
const LIVE_TICKS: number[] = [];
{
  let p = 100_000;
  for (let i = 0; i < 30; i++) {
    LIVE_TICKS.push(p);
    p += i % 2 === 0 ? 12 : -9;
  }
}

function makeContract(
  overrides: Partial<OpenHighLowContract> = {},
): OpenHighLowContract {
  return {
    ticker: "KXBTC-TEST-T100200-HIGH",
    barrierType: "high",
    strike: 100_200,
    remainingSeconds: 600,
    priceTicks: LIVE_TICKS,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeHighLowRecommendation
// ---------------------------------------------------------------------------

describe("computeHighLowRecommendation", () => {
  test("returns a valid recommendation for a basic high-touch contract", () => {
    const rec = computeHighLowRecommendation(makeContract(), NOW);

    assert.equal(rec.ticker, "KXBTC-TEST-T100200-HIGH");
    assert.equal(rec.barrierType, "high");
    assert.equal(rec.strike, 100_200);
    assert.ok(rec.probability >= 0 && rec.probability <= 1);
    assert.ok(Number.isFinite(rec.edge));
    assert.ok(Number.isFinite(rec.absEdge));
    assert.equal(rec.absEdge, Math.abs(rec.edge));
    assert.equal(rec.generatedAt, NOW.toISOString());
    assert.ok(rec.rationale.length > 0);
    assert.ok(rec.features !== null && typeof rec.features === "object");
  });

  test("returns a valid recommendation for a basic low-touch contract", () => {
    const rec = computeHighLowRecommendation(
      makeContract({
        ticker: "KXBTC-TEST-T99800-LOW",
        barrierType: "low",
        strike: 99_800,
      }),
      NOW,
    );

    assert.equal(rec.barrierType, "low");
    assert.equal(rec.strike, 99_800);
    assert.ok(rec.probability >= 0 && rec.probability <= 1);
  });

  test("returns probability = 1.0 and alreadyTouched = true when high barrier already breached", () => {
    // Running high will be 100_300, which is >= strike 100_200
    const ticks = [100_000, 100_300, 100_050];
    const rec = computeHighLowRecommendation(
      makeContract({ priceTicks: ticks, strike: 100_200, barrierType: "high" }),
      NOW,
    );

    assert.equal(rec.probability, 1.0);
    assert.equal(rec.alreadyTouched, true);
    assert.ok(rec.rationale.includes("already touched"));
  });

  test("returns probability = 1.0 and alreadyTouched = true when low barrier already breached", () => {
    // Running low will be 99_700, which is <= strike 99_800
    const ticks = [100_000, 99_700, 100_050];
    const rec = computeHighLowRecommendation(
      makeContract({
        ticker: "KXBTC-TEST-T99800-LOW",
        priceTicks: ticks,
        strike: 99_800,
        barrierType: "low",
      }),
      NOW,
    );

    assert.equal(rec.probability, 1.0);
    assert.equal(rec.alreadyTouched, true);
  });

  test("throws when remainingSeconds is zero or negative", () => {
    assert.throws(
      () =>
        computeHighLowRecommendation(
          makeContract({ remainingSeconds: 0 }),
          NOW,
        ),
      /no time remaining/,
    );
    assert.throws(
      () =>
        computeHighLowRecommendation(
          makeContract({ remainingSeconds: -10 }),
          NOW,
        ),
      /no time remaining/,
    );
  });

  test("throws when priceTicks is empty", () => {
    assert.throws(
      () => computeHighLowRecommendation(makeContract({ priceTicks: [] }), NOW),
      /no price ticks/,
    );
  });

  test("probability is higher for a strike closer to current price (less distance = more likely to touch)", () => {
    const nearby = computeHighLowRecommendation(
      makeContract({ strike: 100_100 }),
      NOW,
    );
    const faraway = computeHighLowRecommendation(
      makeContract({ strike: 101_000 }),
      NOW,
    );
    assert.ok(nearby.probability > faraway.probability);
  });

  test("probability is higher with more remaining time for same strike", () => {
    const short = computeHighLowRecommendation(
      makeContract({ remainingSeconds: 60 }),
      NOW,
    );
    const long = computeHighLowRecommendation(
      makeContract({ remainingSeconds: 900 }),
      NOW,
    );
    assert.ok(long.probability > short.probability);
  });

  test("rationale includes quant probability and vol for untouched barrier", () => {
    const rec = computeHighLowRecommendation(makeContract(), NOW);
    assert.ok(rec.rationale.includes("Quant baseline P="));
    assert.ok(rec.rationale.includes("ann"));
    assert.ok(rec.rationale.includes("edge="));
  });

  test("exposes full CuratedTouchFeatures on the recommendation", () => {
    const rec = computeHighLowRecommendation(makeContract(), NOW);
    assert.ok(rec.features.realizedVolatility.perSecond >= 0);
    assert.ok(rec.features.distanceToStrikeStdDevs >= 0);
    assert.equal(rec.features.contract, rec.ticker);
  });
});

// ---------------------------------------------------------------------------
// runHighLowBatch
// ---------------------------------------------------------------------------

describe("runHighLowBatch", () => {
  test("evaluates multiple contracts and returns them all in ranked", () => {
    const contracts: OpenHighLowContract[] = [
      makeContract({ ticker: "A-HIGH", strike: 100_200 }),
      makeContract({ ticker: "B-LOW", barrierType: "low", strike: 99_800 }),
      makeContract({ ticker: "C-HIGH", strike: 100_500 }),
    ];

    const result = runHighLowBatch(contracts, { now: NOW });

    assert.equal(result.ranked.length, 3);
    assert.equal(result.skipped.length, 0);
    assert.equal(result.generatedAt, NOW.toISOString());
  });

  test("ranked list is sorted by absEdge descending", () => {
    const contracts: OpenHighLowContract[] = [
      makeContract({ ticker: "FAR", strike: 101_000 }), // low prob, low absEdge
      makeContract({ ticker: "NEAR", strike: 100_050 }), // high prob, high absEdge
      makeContract({ ticker: "MID", strike: 100_300 }),
    ];

    const { ranked } = runHighLowBatch(contracts, { now: NOW });

    for (let i = 1; i < ranked.length; i++) {
      assert.ok(ranked[i - 1].absEdge >= ranked[i].absEdge);
    }
  });

  test("already-touched contracts appear in alreadyTouched subset", () => {
    const contracts: OpenHighLowContract[] = [
      makeContract({ ticker: "UNTOUCHED", strike: 100_300 }),
      makeContract({
        ticker: "TOUCHED",
        strike: 100_200,
        priceTicks: [100_000, 100_250, 100_100],
      }),
    ];

    const result = runHighLowBatch(contracts, { now: NOW });

    assert.equal(result.alreadyTouched.length, 1);
    assert.equal(result.alreadyTouched[0].ticker, "TOUCHED");
  });

  test("flagged subset only contains contracts with absEdge >= edgeThreshold", () => {
    const contracts: OpenHighLowContract[] = [
      makeContract({ ticker: "A", strike: 100_050 }), // very close — high absEdge
      makeContract({ ticker: "B", strike: 102_000 }), // very far — low absEdge
    ];

    const result = runHighLowBatch(contracts, { now: NOW, edgeThreshold: 0.1 });

    for (const rec of result.flagged) {
      assert.ok(rec.absEdge >= 0.1);
      assert.equal(rec.alreadyTouched, false);
    }
  });

  test("invalid contracts are collected in skipped, not thrown", () => {
    const contracts: OpenHighLowContract[] = [
      makeContract({ ticker: "VALID" }),
      makeContract({ ticker: "NO-TIME", remainingSeconds: 0 }),
      makeContract({ ticker: "NO-TICKS", priceTicks: [] }),
    ];

    const result = runHighLowBatch(contracts, { now: NOW });

    assert.equal(result.ranked.length, 1);
    assert.equal(result.skipped.length, 2);
    assert.ok(result.skipped.some((s) => s.ticker === "NO-TIME"));
    assert.ok(result.skipped.some((s) => s.ticker === "NO-TICKS"));
    assert.ok(result.skipped[0].reason.length > 0);
  });

  test("empty input returns empty ranked list without throwing", () => {
    const result = runHighLowBatch([], { now: NOW });
    assert.equal(result.ranked.length, 0);
    assert.equal(result.skipped.length, 0);
    assert.equal(result.flagged.length, 0);
    assert.equal(result.alreadyTouched.length, 0);
  });

  test("respects custom edgeThreshold", () => {
    const contracts: OpenHighLowContract[] = [
      makeContract({ ticker: "A", strike: 100_050 }),
      makeContract({ ticker: "B", strike: 100_200 }),
      makeContract({ ticker: "C", strike: 101_000 }),
    ];

    const strict = runHighLowBatch(contracts, { now: NOW, edgeThreshold: 0.4 });
    const loose = runHighLowBatch(contracts, { now: NOW, edgeThreshold: 0.01 });

    assert.ok(loose.flagged.length >= strict.flagged.length);
  });
});

// ---------------------------------------------------------------------------
// evaluateHighLowPair
// ---------------------------------------------------------------------------

describe("evaluateHighLowPair", () => {
  test("evaluates a matched high/low pair and returns exactly 2 recommendations", () => {
    const base = {
      ticker: "KXBTC-TEST",
      strike: 100_200,
      remainingSeconds: 600,
      priceTicks: LIVE_TICKS,
    };

    const result = evaluateHighLowPair(
      { ...base, ticker: "KXBTC-TEST-HIGH" },
      { ...base, ticker: "KXBTC-TEST-LOW", strike: 99_800 },
      { now: NOW },
    );

    assert.equal(result.ranked.length, 2);
    const types = result.ranked.map((r) => r.barrierType);
    assert.ok(types.includes("high"));
    assert.ok(types.includes("low"));
  });

  test("pair result is sorted with higher-absEdge contract first", () => {
    // High strike at 100_050 (very close) vs. low strike at 98_000 (very far)
    const highContract = {
      ticker: "HIGH",
      strike: 100_050,
      remainingSeconds: 600,
      priceTicks: LIVE_TICKS,
    };
    const lowContract = {
      ticker: "LOW",
      strike: 98_000,
      remainingSeconds: 600,
      priceTicks: LIVE_TICKS,
    };

    const { ranked } = evaluateHighLowPair(highContract, lowContract, {
      now: NOW,
    });
    assert.equal(ranked.length, 2);
    assert.ok(ranked[0].absEdge >= ranked[1].absEdge);
  });
});
