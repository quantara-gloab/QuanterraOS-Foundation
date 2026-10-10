import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  triggerDisciplineCelebration,
  FORBIDDEN_CELEBRATION_TRIGGERS,
  CelebrationGuardrailViolationError,
} from "../lib/celebrations.ts";

describe("Phase 5 Task 5.4 Acceptance: Celebrations for Discipline (Never for Wins)", () => {
  describe("Allowed Discipline Celebrations", () => {
    it("fires promotion celebration on rank-up", () => {
      const cel = triggerDisciplineCelebration("RANK_UP", {
        rankName: "Lieutenant",
        unlockName: "Solar Gold Canopy",
      });

      assert.strictEqual(cel.trigger, "RANK_UP");
      assert.ok(cel.headline.includes("Lieutenant"));
      assert.ok(cel.detail.includes("Solar Gold Canopy"));
      assert.strictEqual(cel.soundCueId, "rank_up_fanfare");
    });

    it("fires mission completion celebration without trading requirement", () => {
      const cel = triggerDisciplineCelebration("MISSION_COMPLETE", {
        missionTitle: "Pre-Flight Rigor",
        xp: 30,
      });

      assert.strictEqual(cel.trigger, "MISSION_COMPLETE");
      assert.ok(cel.headline.includes("Pre-Flight Rigor"));
      assert.strictEqual(cel.xpEarned, 30);
      assert.ok(cel.detail.includes("No trades required"));
    });

    it("fires calibration improvement celebration on Brier score drop", () => {
      const cel = triggerDisciplineCelebration("CALIBRATION_IMPROVEMENT", {
        priorBrier: 0.225,
        currentBrier: 0.185,
      });

      assert.strictEqual(cel.trigger, "CALIBRATION_IMPROVEMENT");
      assert.ok(cel.headline.includes("0.1850"));
      assert.strictEqual(cel.xpEarned, 100);
      assert.ok(cel.detail.includes("0.2500"));
    });

    it("fires celebration when respecting a tilt cooldown", () => {
      const cel = triggerDisciplineCelebration("TILT_COOLDOWN_RESPECTED");

      assert.strictEqual(cel.trigger, "TILT_COOLDOWN_RESPECTED");
      assert.ok(cel.headline.includes("15-Minute Cooldown Respected"));
      assert.strictEqual(cel.xpEarned, 25);
    });
  });

  describe("Anti-Win & Anti-Profit Guardrails (Part 0.3 Proof)", () => {
    it("strictly forbids celebrations for winning trades, profit, P&L, or streaks", () => {
      for (const forbidden of FORBIDDEN_CELEBRATION_TRIGGERS) {
        assert.throws(
          () => triggerDisciplineCelebration(forbidden),
          CelebrationGuardrailViolationError,
          `Celebration must reject forbidden trigger ${forbidden}`
        );
      }
    });

    it("rejects celebration payloads containing profit, P&L, or win attributes", () => {
      assert.throws(
        () =>
          triggerDisciplineCelebration("RANK_UP", {
            pnlDollars: 500,
          }),
        CelebrationGuardrailViolationError
      );

      assert.throws(
        () =>
          triggerDisciplineCelebration("MISSION_COMPLETE", {
            winningTradesCount: 10,
          }),
        CelebrationGuardrailViolationError
      );
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck - Celebration Overlay)", () => {
    it("renders Celebration Overlay modal with badge, canvas, and dismiss button", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml();

      assert.ok(html.includes('id="celebration-overlay"'));
      assert.ok(html.includes('id="celebration-canvas"'));
      assert.ok(html.includes('id="celebration-badge-slot"'));
      assert.ok(html.includes('id="celebration-title"'));
      assert.ok(html.includes('id="celebration-headline"'));
      assert.ok(html.includes('id="celebration-detail"'));
      assert.ok(html.includes('id="celebration-xp-slot"'));
      assert.ok(html.includes('id="btn-dismiss-celebration"'));
      assert.ok(
        html.includes(
          "QuanterraOS Anti-Volume Guardrail: Celebrations fire exclusively for procedural discipline, never for winning trades."
        )
      );
    });

    it("includes client-side interactive JavaScript functions for celebrations", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml();

      assert.ok(html.includes("function triggerCelebrationModal("));
      assert.ok(html.includes("function dismissCelebrationModal("));
      assert.ok(html.includes("/api/deck/celebration/trigger"));
    });
  });
});

