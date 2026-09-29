import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeFalconRecommendation,
  scoreFalconRecommendation,
  computeFalconTrackRecord,
  type OrderbookEvidence,
  type FalconTrackRecordRow,
} from "../agents/falcon.ts";
import type { ResolutionRow } from "../scoring.ts";

const now = new Date("2026-09-27T00:00:00.000Z");

function evidenceRow(overrides: Partial<OrderbookEvidence> = {}): OrderbookEvidence {
  return {
    marketTicker: "KXBTC15M-TEST",
    capturedAt: 1_790_000_000_000,
    bestYesPrice: 0.48,
    bestNoPrice: 0.5,
    topImbalance: 0,
    depthImbalance: 0,
    ...overrides,
  };
}

describe("computeFalconRecommendation", () => {
  test("throws rather than fabricating a result when there is no evidence", () => {
    assert.throws(() => computeFalconRecommendation("KXBTC15M-TEST", []), /No order-book evidence/);
  });

  test("throws when the latest snapshot has no usable imbalance reading", () => {
    const evidence = [evidenceRow({ topImbalance: null, depthImbalance: null })];
    assert.throws(() => computeFalconRecommendation("KXBTC15M-TEST", evidence), /no usable imbalance reading/);
  });

  test("positive depth imbalance pushes the suggested probability above 0.5", () => {
    const evidence = [evidenceRow({ depthImbalance: 0.4 })];
    const recommendation = computeFalconRecommendation("KXBTC15M-TEST", evidence, now);
    assert.ok(recommendation.suggestedProbability > 0.5);
  });

  test("negative depth imbalance pushes the suggested probability below 0.5", () => {
    const evidence = [evidenceRow({ depthImbalance: -0.4 })];
    const recommendation = computeFalconRecommendation("KXBTC15M-TEST", evidence, now);
    assert.ok(recommendation.suggestedProbability < 0.5);
  });

  test("zero imbalance suggests exactly 0.5", () => {
    const evidence = [evidenceRow({ depthImbalance: 0 })];
    const recommendation = computeFalconRecommendation("KXBTC15M-TEST", evidence, now);
    assert.equal(recommendation.suggestedProbability, 0.5);
  });

  test("clamps extreme imbalance within the conservative probability bounds", () => {
    const evidence = [evidenceRow({ depthImbalance: 5 })];
    const recommendation = computeFalconRecommendation("KXBTC15M-TEST", evidence, now);
    assert.ok(recommendation.suggestedProbability <= 0.95);
  });

  test("falls back to top_imbalance when depth_imbalance is missing", () => {
    const evidence = [evidenceRow({ depthImbalance: null, topImbalance: 0.5 })];
    const recommendation = computeFalconRecommendation("KXBTC15M-TEST", evidence, now);
    assert.ok(recommendation.suggestedProbability > 0.5);
    assert.match(recommendation.rationale, /top_imbalance/);
  });

  test("uses the most recent snapshot when several are supplied out of order", () => {
    const evidence = [
      evidenceRow({ capturedAt: 1, depthImbalance: 0.4 }),
      evidenceRow({ capturedAt: 3, depthImbalance: -0.4 }),
      evidenceRow({ capturedAt: 2, depthImbalance: 0.1 }),
    ];
    const recommendation = computeFalconRecommendation("KXBTC15M-TEST", evidence, now);
    assert.ok(recommendation.suggestedProbability < 0.5);
  });

  test("returns the evidence rows passed in, unmodified in shape", () => {
    const evidence = [evidenceRow()];
    const recommendation = computeFalconRecommendation("KXBTC15M-TEST", evidence, now);
    assert.equal(recommendation.evidence.length, 1);
    assert.equal(recommendation.evidence[0].marketTicker, "KXBTC15M-TEST");
  });
});

describe("scoreFalconRecommendation", () => {
  test("scores Falcon's suggested probability the same way a human forecast is scored", () => {
    const recommendation = {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      suggestedProbability: 0.9,
      rationale: "test",
      createdAt: now.toISOString(),
    };
    const resolution: ResolutionRow = {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      outcome: "YES",
      officialSource: "manual",
      resolvedAt: now.toISOString(),
      finalized: true,
    };
    const scored = scoreFalconRecommendation(recommendation, resolution);
    assert.equal(scored.scorable, true);
    assert.ok(Math.abs((scored.brierScore ?? 1) - 0.01) < 1e-9);
  });

  test("is still scorable even if a human would go on to reject the recommendation", () => {
    const recommendation = {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      suggestedProbability: 0.2,
      rationale: "test",
      createdAt: now.toISOString(),
    };
    const resolution: ResolutionRow = {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      outcome: "YES",
      officialSource: "manual",
      resolvedAt: now.toISOString(),
      finalized: true,
    };
    const scored = scoreFalconRecommendation(recommendation, resolution);
    assert.equal(scored.scorable, true);
    assert.ok((scored.brierScore ?? 0) > 0.5);
  });
});

describe("computeFalconTrackRecord", () => {
  function trackRow(overrides: Partial<FalconTrackRecordRow> = {}): FalconTrackRecordRow {
    return {
      status: "accepted",
      contract: "KXBTC15M-A",
      owner: "alex",
      suggestedProbability: 0.9,
      rationale: "test",
      createdAt: now.toISOString(),
      ...overrides,
    };
  }
  function resolutionFor(contract: string, outcome: ResolutionRow["outcome"]): ResolutionRow {
    return { owner: "alex", contract, outcome, officialSource: "manual", resolvedAt: now.toISOString(), finalized: true };
  }

  test("counts every status, even when nothing is scorable yet", () => {
    const rows = [
      trackRow({ status: "proposed", contract: "A" }),
      trackRow({ status: "accepted", contract: "B" }),
      trackRow({ status: "edited", contract: "C" }),
      trackRow({ status: "rejected", contract: "D" }),
    ];
    const record = computeFalconTrackRecord(rows, new Map());
    assert.equal(record.proposed, 4);
    assert.equal(record.accepted, 1);
    assert.equal(record.edited, 1);
    assert.equal(record.rejected, 1);
    assert.equal(record.scored, 0);
    assert.equal(record.averageBrierScore, null);
  });

  test("scores accepted and edited recommendations that have a resolution", () => {
    const rows = [
      trackRow({ status: "accepted", contract: "A", suggestedProbability: 0.9 }),
      trackRow({ status: "edited", contract: "B", suggestedProbability: 0.1 }),
    ];
    const resolutions = new Map([
      ["A", resolutionFor("A", "YES")],
      ["B", resolutionFor("B", "NO")],
    ]);
    const record = computeFalconTrackRecord(rows, resolutions);
    assert.equal(record.scored, 2);
    assert.ok(Math.abs((record.averageBrierScore ?? 1) - 0.01) < 1e-9);
  });

  test("never scores rejected recommendations even if a resolution exists", () => {
    const rows = [trackRow({ status: "rejected", contract: "A", suggestedProbability: 0.9 })];
    const resolutions = new Map([["A", resolutionFor("A", "YES")]]);
    const record = computeFalconTrackRecord(rows, resolutions);
    assert.equal(record.scored, 0);
    assert.equal(record.averageBrierScore, null);
  });

  test("skips accepted/edited recommendations that have no resolution yet", () => {
    const rows = [trackRow({ status: "accepted", contract: "A" })];
    const record = computeFalconTrackRecord(rows, new Map());
    assert.equal(record.scored, 0);
    assert.equal(record.averageBrierScore, null);
  });
});
