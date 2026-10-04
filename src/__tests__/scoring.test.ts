import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  scoreObservation,
  summarizePerformance,
  computeCalibrationCurve,
  computeStreak,
  computeWilsonInterval,
  computeMurphyDecomposition,
  computeBrierSkillScore,
  computeLogLoss,
} from "../scoring.ts";
import type { ObservationRow, ResolutionRow } from "../scoring.ts";

function obs(overrides: Partial<ObservationRow> = {}): ObservationRow {
  return {
    id: "o1",
    owner: "chatgpt-user-1",
    contract: "KXBTCD-TEST",
    source: "manual",
    direction: "up",
    hypothesis: "test",
    probability: 0.7,
    created: "2026-09-19T18:00:00Z",
    ...overrides,
  };
}

function res(overrides: Partial<ResolutionRow> = {}): ResolutionRow {
  return {
    owner: "chatgpt-user-1",
    contract: "KXBTCD-TEST",
    outcome: "YES",
    officialSource: "test",
    resolvedAt: "2026-09-19T18:15:00Z",
    finalized: true,
    ...overrides,
  };
}

describe("scoreObservation", () => {
  test("scores a correct confident forecast near zero", () => {
    const s = scoreObservation(obs({ probability: 0.9 }), res({ outcome: "YES" }));
    assert.equal(s.scorable, true);
    assert.ok(Math.abs((s.brierScore as number) - 0.01) < 1e-9);
  });

  test("normalizes an integer 0-100 probability column automatically", () => {
    const s = scoreObservation(obs({ probability: 90 }), res({ outcome: "YES" }));
    assert.ok(Math.abs((s.brierScore as number) - 0.01) < 1e-9);
  });

  test("never scores a null probability (abstained), but keeps it visible", () => {
    const s = scoreObservation(obs({ probability: null }), res({ outcome: "YES" }));
    assert.equal(s.scorable, false);
    assert.equal(s.reason, "abstained");
  });

  test("never scores a VOID outcome, but keeps it visible", () => {
    const s = scoreObservation(obs({ probability: 0.5 }), res({ outcome: "VOID" }));
    assert.equal(s.scorable, false);
    assert.equal(s.reason, "contract voided");
  });

  test("flags a score as provisional when the resolution isn't finalized", () => {
    const s = scoreObservation(obs(), res({ finalized: false }));
    assert.equal(s.provisional, true);
  });
});

describe("summarizePerformance", () => {
  test("counts every category without dropping anything", () => {
    const scored = [
      scoreObservation(obs({ probability: 0.9 }), res({ outcome: "YES" })),
      scoreObservation(obs({ probability: null }), res({ outcome: "YES" })),
      scoreObservation(obs({ probability: 0.5 }), res({ outcome: "VOID", finalized: false })),
    ];
    const summary = summarizePerformance(scored);
    assert.equal(summary.total, 3);
    assert.equal(summary.scored, 1);
    assert.equal(summary.abstained, 1);
    assert.equal(summary.voided, 1);
    assert.equal(summary.provisional, 1);
  });
});

describe("computeCalibrationCurve", () => {
  test("bins a 0-100 integer probability the same as a 0-1 float", () => {
    const scoredFloat = [scoreObservation(obs({ probability: 0.75 }), res({ outcome: "YES" }))];
    const scoredInt = [scoreObservation(obs({ probability: 75 }), res({ outcome: "YES" }))];
    const curveFloat = computeCalibrationCurve(scoredFloat);
    const curveInt = computeCalibrationCurve(scoredInt);
    assert.deepEqual(curveFloat, curveInt);
  });
});

describe("computeStreak", () => {
  test("counts consecutive days from research_observations.created", () => {
    const today = new Date("2026-09-19T20:00:00Z");
    const { currentStreak } = computeStreak(
      ["2026-09-17T10:00:00Z", "2026-09-18T09:00:00Z", "2026-09-19T08:00:00Z"],
      today
    );
    assert.equal(currentStreak, 3);
  });
});

describe("computeWilsonInterval", () => {
  test("computes valid binomial confidence bounds", () => {
    const interval = computeWilsonInterval(75, 100);
    assert.equal(interval.pointEstimate, 0.75);
    assert.ok(interval.lower < 0.75);
    assert.ok(interval.upper > 0.75);
    assert.ok(interval.lower >= 0 && interval.upper <= 1);
  });
});

describe("computeMurphyDecomposition", () => {
  test("satisfies Murphy identity: Brier === Reliability - Resolution + Uncertainty", () => {
    const scored = [
      scoreObservation(obs({ probability: 0.8 }), res({ outcome: "YES" })),
      scoreObservation(obs({ probability: 0.8 }), res({ outcome: "YES" })),
      scoreObservation(obs({ probability: 0.2 }), res({ outcome: "NO" })),
      scoreObservation(obs({ probability: 0.3 }), res({ outcome: "YES" })),
      scoreObservation(obs({ probability: 0.9 }), res({ outcome: "NO" })),
    ];
    const decomp = computeMurphyDecomposition(scored);
    assert.ok(decomp !== null);
    assert.equal(decomp.sampleSize, 5);

    // Verify identity: Reliability - Resolution + Uncertainty ~ Brier
    const reconstructedBrier = decomp.reliability - decomp.resolution + decomp.uncertainty;
    assert.ok(Math.abs(reconstructedBrier - decomp.brierScore) < 0.005);
  });
});

describe("computeBrierSkillScore", () => {
  test("computes skill score relative to coin flip or climatology", () => {
    // 0.2001 vs 0.2500 coin flip
    const bssCoin = computeBrierSkillScore(0.2001, 0.2500);
    assert.equal(bssCoin, 0.1996);

    // Negative skill when underperforming reference
    const bssBad = computeBrierSkillScore(0.3000, 0.2500);
    assert.equal(bssBad, -0.2);
  });
});

describe("computeLogLoss", () => {
  test("computes cross-entropy on binary resolutions", () => {
    const scored = [
      scoreObservation(obs({ probability: 0.9 }), res({ outcome: "YES" })),
      scoreObservation(obs({ probability: 0.1 }), res({ outcome: "NO" })),
    ];
    const loss = computeLogLoss(scored);
    assert.ok(loss !== null);
    // Both confident & correct -> loss should be very low (~0.1054)
    assert.ok(loss < 0.2);
  });
});
