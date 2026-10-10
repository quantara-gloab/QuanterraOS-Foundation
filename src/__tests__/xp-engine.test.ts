import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  XP_ACTION_AWARDS,
  FORBIDDEN_XP_PATTERNS,
  PILOT_RANKS,
  MISSIONS_ROSTER,
  validateXpActionGuardrails,
  recordDisciplineXpEvent,
  computeUserXpState,
  clearInMemoryXpEvents,
  DisciplineGuardrailViolationError,
  type XpActionType,
} from "../lib/xp-engine.ts";

describe("Phase 5 Task 5.2 Acceptance: Event-Sourced XP Engine & Anti-Volume Gamification", () => {
  beforeEach(() => {
    clearInMemoryXpEvents();
  });

  describe("Discipline XP Award Matrix (Part 3.5)", () => {
    it("matches exact XP values defined in Blueprint Part 3.5", () => {
      assert.strictEqual(XP_ACTION_AWARDS.PRE_FLIGHT_CHECK.xp, 10);
      assert.strictEqual(XP_ACTION_AWARDS.WRITTEN_THESIS.xp, 15);
      assert.strictEqual(XP_ACTION_AWARDS.MAKER_SAVER_DISCIPLINE.xp, 10);
      assert.strictEqual(XP_ACTION_AWARDS.COIN_FLIP_STAND_DOWN.xp, 20);
      assert.strictEqual(XP_ACTION_AWARDS.FLIGHT_SCHOOL_LESSON.xp, 25);
      assert.strictEqual(XP_ACTION_AWARDS.WEEKLY_DEBRIEF.xp, 30);
      assert.strictEqual(XP_ACTION_AWARDS.BRIER_CALIBRATION_IMPROVEMENT.xp, 100);
      assert.strictEqual(XP_ACTION_AWARDS.TILT_COOLDOWN_RESPECTED.xp, 25);
    });

    it("records valid discipline XP events in append-only log", () => {
      const e1 = recordDisciplineXpEvent("pilot-101", "PRE_FLIGHT_CHECK");
      const e2 = recordDisciplineXpEvent("pilot-101", "WRITTEN_THESIS");
      const e3 = recordDisciplineXpEvent("pilot-101", "COIN_FLIP_STAND_DOWN");

      assert.strictEqual(e1.xpAmount, 10);
      assert.strictEqual(e2.xpAmount, 15);
      assert.strictEqual(e3.xpAmount, 20);

      const state = computeUserXpState("pilot-101");
      assert.strictEqual(state.totalXp, 45);
      assert.strictEqual(state.actionCounts.PRE_FLIGHT_CHECK, 1);
      assert.strictEqual(state.actionCounts.WRITTEN_THESIS, 1);
      assert.strictEqual(state.actionCounts.COIN_FLIP_STAND_DOWN, 1);
    });
  });

  describe("Anti-Volume Guardrails (Part 0.3 Proof: Zero XP from Volume, Trades, P&L, Wins)", () => {
    it("strictly throws DisciplineGuardrailViolationError for forbidden volume and trade metrics", () => {
      for (const forbidden of FORBIDDEN_XP_PATTERNS) {
        assert.throws(
          () => validateXpActionGuardrails(forbidden),
          DisciplineGuardrailViolationError,
          `Engine must reject forbidden action ${forbidden}`
        );
      }
    });

    it("rejects attempts to pass trading volume, size, P&L, or win metadata", () => {
      assert.throws(
        () =>
          recordDisciplineXpEvent("pilot-test", "PRE_FLIGHT_CHECK", {
            tradeVolume: 50000,
          }),
        DisciplineGuardrailViolationError
      );

      assert.throws(
        () =>
          recordDisciplineXpEvent("pilot-test", "WRITTEN_THESIS", {
            pnlDollarProfit: 1250,
          }),
        DisciplineGuardrailViolationError
      );

      assert.throws(
        () =>
          recordDisciplineXpEvent("pilot-test", "COIN_FLIP_STAND_DOWN", {
            winningTradeStreak: 5,
          }),
        DisciplineGuardrailViolationError
      );
    });

    it("guarantees 100 consecutive trades with massive profit earn zero XP without discipline actions", () => {
      const state = computeUserXpState("trader-whale");
      assert.strictEqual(state.totalXp, 0);
      assert.strictEqual(state.currentRank.rankName, "Cadet");
    });
  });

  describe("Rank Progression & Cosmetic Unlocks", () => {
    it("defines 6 calibration and discipline ranks with correct XP thresholds", () => {
      assert.strictEqual(PILOT_RANKS.length, 6);
      assert.strictEqual(PILOT_RANKS[0].rankName, "Cadet");
      assert.strictEqual(PILOT_RANKS[0].minXp, 0);

      assert.strictEqual(PILOT_RANKS[1].rankName, "Pilot");
      assert.strictEqual(PILOT_RANKS[1].minXp, 50);

      assert.strictEqual(PILOT_RANKS[2].rankName, "Lieutenant");
      assert.strictEqual(PILOT_RANKS[2].minXp, 150);

      assert.strictEqual(PILOT_RANKS[3].rankName, "Commander");
      assert.strictEqual(PILOT_RANKS[3].minXp, 350);

      assert.strictEqual(PILOT_RANKS[4].rankName, "Captain");
      assert.strictEqual(PILOT_RANKS[4].minXp, 700);

      assert.strictEqual(PILOT_RANKS[5].rankName, "Admiral");
      assert.strictEqual(PILOT_RANKS[5].minXp, 1200);
    });

    it("progresses user rank as discipline events are recorded", () => {
      // 0 XP -> Cadet
      let state = computeUserXpState("pilot-progress");
      assert.strictEqual(state.currentRank.rankName, "Cadet");
      assert.strictEqual(state.nextRank?.rankName, "Pilot");

      // 5 pre-flight checks (50 XP) -> Pilot
      for (let i = 0; i < 5; i++) {
        recordDisciplineXpEvent("pilot-progress", "PRE_FLIGHT_CHECK");
      }
      state = computeUserXpState("pilot-progress");
      assert.strictEqual(state.totalXp, 50);
      assert.strictEqual(state.currentRank.rankName, "Pilot");
      assert.strictEqual(state.nextRank?.rankName, "Lieutenant");

      // Earn Brier improvement (+100 XP) -> 150 XP -> Lieutenant
      recordDisciplineXpEvent("pilot-progress", "BRIER_CALIBRATION_IMPROVEMENT");
      state = computeUserXpState("pilot-progress");
      assert.strictEqual(state.totalXp, 150);
      assert.strictEqual(state.currentRank.rankName, "Lieutenant");

      // Reach 1200 XP -> Fleet Admiral
      recordDisciplineXpEvent("pilot-progress", "BRIER_CALIBRATION_IMPROVEMENT"); // 250
      recordDisciplineXpEvent("pilot-progress", "BRIER_CALIBRATION_IMPROVEMENT"); // 350 -> Commander
      for (let i = 0; i < 9; i++) {
        recordDisciplineXpEvent("pilot-progress", "BRIER_CALIBRATION_IMPROVEMENT");
      }
      state = computeUserXpState("pilot-progress");
      assert.strictEqual(state.totalXp, 1250);
      assert.strictEqual(state.currentRank.rankName, "Admiral");
      assert.strictEqual(state.nextRank, null);
      assert.strictEqual(state.xpToNextRank, 0);
    });

    it("proves rank unlocks are strictly cosmetic (ship skins, HUD themes, portraits)", () => {
      const allCosmetics = PILOT_RANKS.flatMap((r) => r.cosmetics);
      assert.ok(allCosmetics.length >= 18);

      for (const cosmetic of allCosmetics) {
        assert.ok(
          ["ship_skin", "hud_theme", "crew_portrait"].includes(cosmetic.category),
          `Cosmetic ${cosmetic.id} has invalid category ${cosmetic.category}`
        );

        // Guardrail: verify no trading execution unlocks or fee rebates
        const nameAndDesc = (cosmetic.name + " " + cosmetic.description).toLowerCase();
        assert.ok(!nameAndDesc.includes("discount"));
        assert.ok(!nameAndDesc.includes("rebate"));
        assert.ok(!nameAndDesc.includes("leverage"));
        assert.ok(!nameAndDesc.includes("order routing"));
        assert.ok(!nameAndDesc.includes("trade fee"));
      }
    });
  });

  describe("Missions Roster (Daily, Weekly, Campaign)", () => {
    it("defines missions that never require placing live market orders", () => {
      for (const mission of MISSIONS_ROSTER) {
        const text = (mission.title + " " + mission.description).toLowerCase();
        assert.ok(!text.includes("place a trade"));
        assert.ok(!text.includes("deposit"));
        assert.ok(!text.includes("win a trade"));
        assert.ok(!text.includes("profitable"));
      }
    });

    it("evaluates mission completion from recorded event streams", () => {
      // Complete daily preflight (3 checks)
      recordDisciplineXpEvent("pilot-missions", "PRE_FLIGHT_CHECK");
      recordDisciplineXpEvent("pilot-missions", "PRE_FLIGHT_CHECK");
      recordDisciplineXpEvent("pilot-missions", "PRE_FLIGHT_CHECK");

      const state = computeUserXpState("pilot-missions");
      const preflightMission = state.activeMissions.find((m) => m.id === "daily-preflight-3");
      assert.ok(preflightMission);
      assert.strictEqual(preflightMission.currentProgress, 3);
      assert.strictEqual(preflightMission.isCompleted, true);

      const thesisMission = state.activeMissions.find((m) => m.id === "weekly-thesis-5");
      assert.ok(thesisMission);
      assert.strictEqual(thesisMission.currentProgress, 0);
      assert.strictEqual(thesisMission.isCompleted, false);
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=bridge - Ranks & Cosmetics)", () => {
    it("renders Cosmetic Unlocks card with anti-volume rewards badge", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "bridge" });

      assert.ok(html.includes('id="cosmetic-unlocks-card"'));
      assert.ok(html.includes("PILOT RANKS &amp; COSMETIC UNLOCKS"));
      assert.ok(html.includes("ANTI-VOLUME REWARDS ONLY"));
      assert.ok(html.includes("Level up from Cadet to Admiral strictly by pre-flight checks"));
    });

    it("renders rank stepper showing all 6 ranks", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "bridge" });

      assert.ok(html.includes("Cadet"));
      assert.ok(html.includes("Pilot"));
      assert.ok(html.includes("Lieutenant"));
      assert.ok(html.includes("Commander"));
      assert.ok(html.includes("Captain"));
      assert.ok(html.includes("Admiral"));
    });

    it("renders cosmetic inventory items", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "bridge" });

      assert.ok(html.includes("Void Black Hull"));
      assert.ok(html.includes("Monospace Amber Telemetry"));
      assert.ok(html.includes("Ensign Insignia"));
      assert.ok(html.includes("UNLOCKED"));
    });
  });
});

