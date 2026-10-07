import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runMigrations } from "../db.ts";

runMigrations();

import {
  runAutonomousLearningCycle,
  getLatestLearningCycle,
  get90DayAccelerationStatus,
} from "../agents/autonomous-learning-engine.ts";
import { validateCopyGuardrails } from "../gtm-engine.ts";

describe("Autonomous Executive AI Self-Training Engine", () => {
  it("executes an autonomous continuous learning cycle across all 5 phases", async () => {
    const cycle = await runAutonomousLearningCycle();

    assert.ok(cycle.id.startsWith("learn_"));
    assert.ok(cycle.cycleNumber >= 1);
    assert.strictEqual(typeof cycle.durationMs, "number");
    assert.strictEqual(cycle.brierBaseline, 0.2001);
    assert.strictEqual(cycle.internalModelBrier, 0.2063);
    assert.ok(cycle.modelDivergence > 0);

    // Verify Phase 2 hypotheses
    assert.ok(cycle.hypotheses.length >= 3);
    const wolfHyp = cycle.hypotheses.find((h) => h.agent === "Wolf");
    assert.ok(wolfHyp);
    assert.strictEqual(wolfHyp.passed, true);

    // Verify Phase 3 stress tests strictly enforce Rule B5
    assert.ok(cycle.stressScenarios.length >= 3);
    for (const shock of cycle.stressScenarios) {
      assert.strictEqual(shock.ruleB5Enforced, true);
      assert.ok(shock.capitalAtRisk.includes("$0.00"));
      assert.strictEqual(shock.status, "PASSED");
    }

    // Verify Phase 4 funnel optimization
    assert.strictEqual(cycle.funnelInsights.advisoryBudgetSafetyCheck, "PASSED");
    assert.ok(cycle.funnelInsights.educationalExplainersDrafted >= 1);

    // Verify Phase 5 acceleration & brief
    assert.ok(cycle.accelerationScore >= 2.0);
    assert.ok(cycle.daysSaved >= 50);
    assert.ok(cycle.projectedCompletionDays <= 35);
    assert.ok(cycle.executiveBriefMarkdown.includes("RULE B5 LOCKED"));
  });

  it("ensures Lion executive brief complies with Rule B4 static copy guardrails", async () => {
    const cycle = await runAutonomousLearningCycle();
    const guard = validateCopyGuardrails(cycle.executiveBriefMarkdown);

    assert.strictEqual(guard.passed, true);
    assert.strictEqual(guard.violations.length, 0);

    // Explicit check for forbidden words
    const lower = cycle.executiveBriefMarkdown.toLowerCase();
    assert.ok(!lower.includes("tesla"));
    assert.ok(!lower.includes("citadel"));
    assert.ok(!lower.includes("guaranteed"));
    assert.ok(!lower.includes("beat the market"));
    assert.ok(!lower.includes("alpha"));
  });

  it("retrieves latest learning cycle from database without errors", async () => {
    const latest = await getLatestLearningCycle();
    assert.ok(latest);
    assert.ok(latest.cycleNumber >= 1);
    assert.strictEqual(latest.brierBaseline, 0.2001);
  });

  it("computes 90-day acceleration milestones compressing window to ~32 days", () => {
    const status = get90DayAccelerationStatus();
    assert.strictEqual(status.baselineDays, 90);
    assert.ok(status.acceleratedDays <= 35);
    assert.ok(status.daysSaved >= 50);
    assert.ok(status.accelerationFactor.includes("2.8x"));
    assert.strictEqual(status.milestones.length, 4);

    const gate1 = status.milestones[0];
    assert.strictEqual(gate1.status, "COMPLETED");
    assert.strictEqual(gate1.automatedProgressPct, 100);
  });
});
