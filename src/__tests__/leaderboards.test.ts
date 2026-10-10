import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getCalibrationLeaderboard,
  getFeesSavedLeaderboard,
  validateLeaderboardSortingMetric,
  updatePilotLeaderboardOptIn,
  MIN_CALIBRATION_SAMPLE_SIZE,
  FORBIDDEN_LEADERBOARD_METRICS,
  LeaderboardGuardrailViolationError,
  type UserLeaderboardProfile,
} from "../lib/leaderboards.ts";

describe("Phase 5 Task 5.3 Acceptance: Opt-in Leaderboards (Calibration & Fees Saved)", () => {
  describe("Calibration Leaderboard & Min n=30 Gate", () => {
    it("enforces minimum n=30 settled logs requirement for ranked standings", () => {
      assert.strictEqual(MIN_CALIBRATION_SAMPLE_SIZE, 30);

      const board = getCalibrationLeaderboard(30);

      // Ranked pilots must all have >= 30 settled logs
      for (const pilot of board.rankedLeaders) {
        assert.ok(
          pilot.settledLogCount >= 30,
          `Pilot ${pilot.callsign} has only ${pilot.settledLogCount} logs, must be >= 30`
        );
        assert.strictEqual(pilot.isEligibleForCalibrationRank, true);
      }

      // Pilot with <30 logs (e.g. NOVA-CADET n=18) must be in calibrating status
      const nova = board.calibratingPilots.find((p) => p.callsign === "NOVA-CADET");
      assert.ok(nova, "NOVA-CADET must be placed in calibrating list");
      assert.strictEqual(nova.settledLogCount, 18);
      assert.strictEqual(nova.isEligibleForCalibrationRank, false);
      assert.strictEqual(nova.logsRemainingForRank, 12);
    });

    it("ranks eligible pilots by Brier score ascending (lower is better)", () => {
      const board = getCalibrationLeaderboard();
      const scores = board.rankedLeaders.map((p) => p.brierScore);

      for (let i = 1; i < scores.length; i++) {
        assert.ok(
          scores[i] >= scores[i - 1],
          `Rank ${i + 1} score (${scores[i]}) is lower than rank ${i} (${scores[i - 1]})`
        );
      }

      // Benchmarks must cite market mid (0.2001) and coin flip (0.2500)
      assert.strictEqual(board.marketMidBenchmarkBrier, 0.2001);
      assert.strictEqual(board.climatologyBrier, 0.2500);
    });
  });

  describe("Fees Saved (Friction Avoidance) Leaderboard", () => {
    it("ranks pilots by cumulative fees saved descending", () => {
      const board = getFeesSavedLeaderboard();
      const savings = board.map((p) => p.feesSavedDollars);

      for (let i = 1; i < savings.length; i++) {
        assert.ok(
          savings[i] <= savings[i - 1],
          `Rank ${i + 1} savings (${savings[i]}) is greater than rank ${i} (${savings[i - 1]})`
        );
      }

      // Top saver should have highest savings
      assert.ok(board[0].feesSavedDollars >= board[1].feesSavedDollars);
    });
  });

  describe("Anti-Profit & Anti-Volume Guardrails (Part 0.3)", () => {
    it("strictly forbids sorting leaderboards by profit, P&L, ROI, volume, or win rate", () => {
      for (const metric of FORBIDDEN_LEADERBOARD_METRICS) {
        assert.throws(
          () => validateLeaderboardSortingMetric(metric),
          LeaderboardGuardrailViolationError,
          `Must throw violation error for metric ${metric}`
        );
      }
    });

    it("permits sorting strictly by calibration or fees_saved", () => {
      assert.strictEqual(validateLeaderboardSortingMetric("CALIBRATION"), "calibration");
      assert.strictEqual(validateLeaderboardSortingMetric("BRIER"), "calibration");
      assert.strictEqual(validateLeaderboardSortingMetric("FEES_SAVED"), "fees_saved");
      assert.strictEqual(validateLeaderboardSortingMetric("SAVINGS"), "fees_saved");
    });
  });

  describe("Opt-In Privacy & Pseudonymous Callsigns", () => {
    it("excludes users who have not opted in from all leaderboards", () => {
      const calBoard = getCalibrationLeaderboard();
      const feeBoard = getFeesSavedLeaderboard();

      // GHOST-1 is opted out (isOptedIn = false)
      const foundInCal = calBoard.rankedLeaders.some((p) => p.callsign === "GHOST-1");
      const foundInCalibrating = calBoard.calibratingPilots.some((p) => p.callsign === "GHOST-1");
      const foundInFee = feeBoard.some((p) => p.callsign === "GHOST-1");

      assert.strictEqual(foundInCal, false, "Opted-out pilot must not appear in ranked leaders");
      assert.strictEqual(foundInCalibrating, false, "Opted-out pilot must not appear in calibrating");
      assert.strictEqual(foundInFee, false, "Opted-out pilot must not appear in fee board");
    });

    it("verifies identifiers are pseudonymous callsigns, never email or wallets", () => {
      const board = getFeesSavedLeaderboard();
      for (const pilot of board) {
        assert.ok(!pilot.callsign.includes("@"), "Callsign must not contain email");
        assert.ok(!pilot.callsign.startsWith("0x"), "Callsign must not contain crypto wallet address");
        assert.ok(pilot.callsign.length >= 3);
      }
    });

    it("allows pilot to toggle opt-in status and update callsign", () => {
      const updated = updatePilotLeaderboardOptIn("pilot-toggle-test", true, "SOLARIS-1");
      assert.strictEqual(updated.isOptedIn, true);
      assert.strictEqual(updated.callsign, "SOLARIS-1");

      const optedOut = updatePilotLeaderboardOptIn("pilot-toggle-test", false);
      assert.strictEqual(optedOut.isOptedIn, false);
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=bridge - Fleet Leaderboards)", () => {
    it("renders Fleet Discipline Leaderboards card with opt-in status", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "bridge" });

      assert.ok(html.includes('id="fleet-leaderboards-card"'));
      assert.ok(html.includes("FLEET DISCIPLINE LEADERBOARDS"));
      assert.ok(html.includes("OPT-IN &amp; PSEUDONYMOUS"));
      assert.ok(html.includes("minimum n=30 settled logs"));
    });

    it("renders tab buttons for Calibration and Fees Saved", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "bridge" });

      assert.ok(html.includes('id="btn-tab-leaderboard-cal"'));
      assert.ok(html.includes('id="btn-tab-leaderboard-fees"'));
      assert.ok(html.includes('id="leaderboard-tab-calibration"'));
      assert.ok(html.includes('id="leaderboard-tab-fees"'));
    });

    it("renders calibration benchmarks and qualifying gate", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "bridge" });

      assert.ok(html.includes("KALSHI MARKET MID: 0.2001"));
      assert.ok(html.includes("COIN-FLIP RANDOM: 0.2500"));
      assert.ok(html.includes("MINIMUM 30 SETTLED LOGS"));
      assert.ok(html.includes("PILOTS IN CALIBRATION"));
    });

    it("includes client-side interactive JavaScript functions for leaderboards", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "bridge" });

      assert.ok(html.includes("function showLeaderboardTab("));
      assert.ok(html.includes("function toggleLeaderboardOptIn("));
      assert.ok(html.includes("/api/deck/leaderboard/opt-in"));
    });
  });
});

