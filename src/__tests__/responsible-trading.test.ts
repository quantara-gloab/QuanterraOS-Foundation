import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateTiltCondition,
  recordLossAndCheckTilt,
  respectTiltCooldown,
  applySelfPause,
  attestAge18,
  getUserLimits,
  updateUserLimits,
  type LossEvent,
} from "../lib/responsible-trading.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 4 Task 4.6 Acceptance: Responsible-Trading Layer & Tilt Cooldown", () => {
  const html = renderFlightDeckPageHtml({ initialStation: "hangar" });

  describe("Tilt Detection & Systems Cooldown Logic", () => {
    test("3 losses within 60 minutes triggers 15-minute systems cooldown", () => {
      const now = Date.now();
      const losses: LossEvent[] = [
        { timestampIso: new Date(now - 10 * 60 * 1000).toISOString(), lossDollars: 10, ticker: "KXBTC15M-91250" },
        { timestampIso: new Date(now - 25 * 60 * 1000).toISOString(), lossDollars: 15, ticker: "KXBTC15M-91000" },
        { timestampIso: new Date(now - 40 * 60 * 1000).toISOString(), lossDollars: 20, ticker: "KXBTC15M-91500" },
      ];

      const result = evaluateTiltCondition(losses, now);
      assert.equal(result.isTiltTriggered, true, "3 losses within 60m must trigger tilt");
      assert.equal(result.cooldownSeconds, 900, "Must engage 15-minute (900s) cooldown");
      assert.match(result.reason ?? "", /3 losses recorded in the last 60 minutes/i);
    });

    test("2 losses within 60 minutes with spaced entries does not trigger tilt", () => {
      const now = Date.now();
      const losses: LossEvent[] = [
        { timestampIso: new Date(now - 15 * 60 * 1000).toISOString(), lossDollars: 10, ticker: "KXBTC15M-91250" },
        { timestampIso: new Date(now - 45 * 60 * 1000).toISOString(), lossDollars: 12, ticker: "KXBTC15M-91000" },
      ];

      const result = evaluateTiltCondition(losses, now);
      assert.equal(result.isTiltTriggered, false);
      assert.equal(result.cooldownSeconds, 0);
    });

    test("Rapid re-entry after loss (< 180s apart) triggers tilt mitigation", () => {
      const now = Date.now();
      const losses: LossEvent[] = [
        { timestampIso: new Date(now - 60 * 1000).toISOString(), lossDollars: 15, ticker: "KXBTC15M-91250" },
        { timestampIso: new Date(now - 120 * 1000).toISOString(), lossDollars: 15, ticker: "KXBTC15M-91250" }, // 60s apart!
      ];

      const result = evaluateTiltCondition(losses, now);
      assert.equal(result.isTiltTriggered, true, "Rapid re-entry under 3 minutes must trigger tilt");
      assert.match(result.reason ?? "", /Rapid re-entry after loss/i);
    });

    test("Losses older than 60 minutes are not counted in rolling hourly window", () => {
      const now = Date.now();
      const losses: LossEvent[] = [
        { timestampIso: new Date(now - 70 * 60 * 1000).toISOString(), lossDollars: 20, ticker: "KXBTC15M-91250" },
        { timestampIso: new Date(now - 80 * 60 * 1000).toISOString(), lossDollars: 20, ticker: "KXBTC15M-91250" },
        { timestampIso: new Date(now - 90 * 60 * 1000).toISOString(), lossDollars: 20, ticker: "KXBTC15M-91250" },
      ];

      const result = evaluateTiltCondition(losses, now);
      assert.equal(result.isTiltTriggered, false, "Losses older than 60m must not trigger tilt");
    });

    test("Respecting tilt cooldown awards +25 XP discipline", () => {
      const testUser = "qa-tilt-user";
      const res = respectTiltCooldown(testUser);

      assert.equal(res.xpAwarded, 25, "Respecting cooldown must award +25 XP");
      assert.ok(res.limits.cooldownsRespectedCount >= 1);
    });
  });

  describe("User Limits & Self-Regulation Features", () => {
    const testUser = "qa-limits-user";

    test("Retrieves default limits and updates them across devices", () => {
      const initial = getUserLimits(testUser);
      assert.equal(initial.dailyLossLimit, 50.0);
      assert.equal(initial.weeklyLossLimit, 200.0);
      assert.equal(initial.monthlyFeeBudget, 50.0);
      assert.equal(initial.sessionTimerMinutes, 60);

      const updated = updateUserLimits(testUser, {
        dailyLossLimit: 75.0,
        weeklyLossLimit: 250.0,
        monthlyFeeBudget: 60.0,
        sessionTimerMinutes: 90,
      });

      assert.equal(updated.dailyLossLimit, 75.0);
      assert.equal(updated.weeklyLossLimit, 250.0);
      assert.equal(updated.monthlyFeeBudget, 60.0);
      assert.equal(updated.sessionTimerMinutes, 90);
    });

    test("Apply self-pause sets expiration timestamp in future", () => {
      const paused = applySelfPause(testUser, 24);
      assert.ok(paused.selfPauseUntilIso !== null);
      const diffMs = new Date(paused.selfPauseUntilIso!).getTime() - Date.now();
      assert.ok(diffMs > 23 * 3600 * 1000 && diffMs <= 24 * 3600 * 1000);
    });

    test("18+ age attestation stores boolean verification", () => {
      const verified = attestAge18(testUser);
      assert.equal(verified.is18PlusAttested, true);
      assert.ok(verified.attestedAtIso !== null);
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=hangar)", () => {
    test("Hangar Station panel is active and contains header", () => {
      assert.match(html, /<section[^>]*id=["']station-panel-hangar["'][^>]*class=["'][^"']*active[^"']*["']|<section[^>]*class=["'][^"']*active[^"']*["'][^>]*id=["']station-panel-hangar["']/i);
      assert.match(html, /Hangar Station/i);
      assert.match(html, /Ship Config/i);
    });

    test("Responsible-trading limits card (#hangar-limits-card) is rendered with inputs", () => {
      assert.match(html, /id=["']hangar-limits-card["']/i);
      assert.match(html, /id=["']hangar-age-gate-status["']/i);
      assert.match(html, /id=["']hangar-daily-loss-limit["']/i);
      assert.match(html, /id=["']hangar-weekly-loss-limit["']/i);
      assert.match(html, /id=["']hangar-fee-budget["']/i);
      assert.match(html, /id=["']hangar-session-timer["']/i);
      assert.match(html, /id=["']btn-save-limits["']/i);
    });

    test("Tilt detection card (#hangar-tilt-card) and QA test button are present", () => {
      assert.match(html, /id=["']hangar-tilt-card["']/i);
      assert.match(html, /id=["']btn-test-trigger-tilt["']/i);
      assert.match(html, /Simulate 3 Rapid Losses/i);
      assert.match(html, /id=["']hangar-respected-count["']/i);
    });

    test("Take a Break self-pause card (#hangar-self-pause-card) with pause options is present", () => {
      assert.match(html, /id=["']hangar-self-pause-card["']/i);
      assert.match(html, /id=["']btn-pause-24h["']/i);
      assert.match(html, /id=["']btn-pause-7d["']/i);
      assert.match(html, /id=["']btn-pause-30d["']/i);
      assert.match(html, /id=["']hangar-pause-status["']/i);
    });

    test("Responsible gambling resources card (#hangar-resources-card) cites 1-800-GAMBLER", () => {
      assert.match(html, /id=["']hangar-resources-card["']/i);
      assert.match(html, /1-800-GAMBLER/i);
      assert.match(html, /1-800-522-4700/i);
      assert.match(html, /gamblersanonymous\.org/i);
    });

    test("Tilt Cooldown Overlay modal (#tilt-cooldown-overlay) is rendered with countdown and actions", () => {
      assert.match(html, /id=["']tilt-cooldown-overlay["']/i);
      assert.match(html, /SYSTEMS COOLDOWN ENGAGED/i);
      assert.match(html, /id=["']tilt-countdown-timer["']/i);
      assert.match(html, /id=["']btn-respect-tilt-cooldown["']/i);
      assert.match(html, /Respect 15-Minute Cooldown \(\+25 XP/i);
      assert.match(html, /id=["']btn-dismiss-tilt-cooldown["']/i);
    });

    test("18+ Age Gate Attestation modal (#age-gate-modal) is present", () => {
      assert.match(html, /id=["']age-gate-modal["']/i);
      assert.match(html, /id=["']btn-attest-age["']/i);
      assert.match(html, /CFTC PREDICTION MARKET COMPLIANCE/i);
    });

    test("Client-side interactive JavaScript functions are defined", () => {
      assert.match(html, /function\s+triggerTiltCooldownUI\s*\(/i);
      assert.match(html, /function\s+respectTiltCooldownAction\s*\(/i);
      assert.match(html, /function\s+dismissTiltCooldownUI\s*\(/i);
      assert.match(html, /function\s+simulateRapidLossesQA\s*\(/i);
      assert.match(html, /function\s+saveLimitsToCloud\s*\(/i);
      assert.match(html, /function\s+activateSelfPauseAction\s*\(/i);
      assert.match(html, /function\s+attestAge18Action\s*\(/i);
    });
  });
});
