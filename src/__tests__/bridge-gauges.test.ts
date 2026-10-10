import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeFuelGauge,
  computeHullGauge,
  computeNavAccuracyGauge,
  computeDisciplineGauge,
  computeBridgeGauges,
} from "../lib/bridge-gauges.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 4 Task 4.5 Acceptance: Bridge Ship Gauges (Fuel, Hull, Nav Accuracy, Discipline)", () => {
  const html = renderFlightDeckPageHtml({ initialStation: "bridge" });

  describe("Fuel Reserve Gauge Engine", () => {
    test("Calculates remaining voluntary fee budget and nominal burn rate", () => {
      // $50 budget, $8 consumed at day 9 of 30 (16% burn vs 30% month elapsed = nominal)
      const fuel = computeFuelGauge(50, 8, 9, 30);

      assert.equal(fuel.budgetDollars, 50);
      assert.equal(fuel.consumedDollars, 8);
      assert.equal(fuel.remainingDollars, 42);
      assert.equal(fuel.remainingPct, 84);
      assert.equal(fuel.burnRateStatus, "NOMINAL");
      assert.equal(fuel.warningMessage, null);
    });

    test("Flags BURNING_FAST when fee burn greatly outpaces month runway", () => {
      // $50 budget, $35 consumed (70% burn) at day 5 of 30 (16% month elapsed)
      const fuel = computeFuelGauge(50, 35, 5, 30);

      assert.equal(fuel.burnRateStatus, "BURNING_FAST");
      assert.match(fuel.warningMessage ?? "", /Burning fee fuel faster than planned runway/i);
    });

    test("Flags EXHAUSTED when fee budget is depleted", () => {
      const fuel = computeFuelGauge(50, 50);

      assert.equal(fuel.remainingDollars, 0);
      assert.equal(fuel.remainingPct, 0);
      assert.equal(fuel.burnRateStatus, "EXHAUSTED");
      assert.match(fuel.warningMessage ?? "", /Monthly fee budget exhausted/i);
    });
  });

  describe("Hull Integrity & Loss-Limit Headroom Engine", () => {
    test("Nominal hull integrity when loss is well within limits (> 50%)", () => {
      // $50 limit, $10 loss -> $40 headroom (80% integrity)
      const hull = computeHullGauge(50, 10);

      assert.equal(hull.maxLossLimitDollars, 50);
      assert.equal(hull.currentLossDollars, 10);
      assert.equal(hull.headroomDollars, 40);
      assert.equal(hull.integrityPct, 80);
      assert.equal(hull.status, "NOMINAL");
      assert.equal(hull.securityChiefAlert, null);
    });

    test("Under 30% triggers CRITICAL_STAND_DOWN alert from Security Chief", () => {
      // $50 limit, $38 loss -> $12 headroom (24% integrity < 30%)
      const hull = computeHullGauge(50, 38);

      assert.equal(hull.integrityPct, 24);
      assert.equal(hull.status, "CRITICAL_STAND_DOWN");
      assert.ok(hull.securityChiefAlert !== null, "Security Chief alert must be populated");
      assert.match(hull.securityChiefAlert, /SECURITY CHIEF ALERT/i);
      assert.match(hull.securityChiefAlert, /below 30%/i);
      assert.match(hull.securityChiefAlert, /Standing down immediately is recommended/i);
    });
  });

  describe("Navigation Accuracy Calibration Engine", () => {
    test("Scores rolling personal Brier as SHARP when outperforming market midpoint (0.2001)", () => {
      const nav = computeNavAccuracyGauge(0.1982);

      assert.equal(nav.personalBrier, 0.1982);
      assert.equal(nav.marketMidpointBrier, 0.2001);
      assert.equal(nav.coinFlipBrier, 0.2500);
      assert.equal(nav.status, "SHARP");
      assert.match(nav.ratingLabel, /Sharp \(Beating Market\)/i);
      assert.ok(nav.outperformingMarketBps > 0, "Outperformance bps must be positive");
      assert.ok(nav.outperformingCoinFlipBps > 2000, "Outperformance over coin-flip should be > 20%");
    });

    test("Scores UNCALIBRATED when personal Brier underperforms coin-flip (>= 0.2500)", () => {
      const nav = computeNavAccuracyGauge(0.2650);

      assert.equal(nav.status, "UNCALIBRATED");
      assert.match(nav.ratingLabel, /Underperforming Coin-Flip/i);
    });
  });

  describe("Discipline Gauge Engine (Anti-Volume XP)", () => {
    test("Calculates discipline percentage and rank progression without trade volume", () => {
      const disc = computeDisciplineGauge(20, 19, 140);

      assert.equal(disc.disciplinePct, 95, "19 of 20 with thesis = 95% discipline");
      assert.equal(disc.totalDisciplineXp, 140);
      assert.equal(disc.rankName, "Cadet");
      assert.ok(disc.rankProgressPct > 0);
    });

    test("Transitions to Pilot at 300 XP and Lieutenant at 700 XP", () => {
      const pilot = computeDisciplineGauge(30, 30, 350);
      assert.equal(pilot.rankName, "Pilot");

      const lieut = computeDisciplineGauge(50, 50, 800);
      assert.equal(lieut.rankName, "Lieutenant");
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=bridge)", () => {
    test("Bridge Station panel is active and contains header", () => {
      assert.match(html, /<section[^>]*id=["']station-panel-bridge["'][^>]*class=["'][^"']*active[^"']*["']|<section[^>]*class=["'][^"']*active[^"']*["'][^>]*id=["']station-panel-bridge["']/i);
      assert.match(html, /Bridge Station/i);
      assert.match(html, /Main Viewscreen/i);
    });

    test("All 4 Bridge gauges are rendered with identifiers", () => {
      assert.match(html, /id=["']gauge-card-hull["']/i);
      assert.match(html, /id=["']bridge-hull-val["']/i);
      assert.match(html, /id=["']bridge-hull-bar["']/i);

      assert.match(html, /id=["']gauge-card-fuel["']/i);
      assert.match(html, /id=["']bridge-fuel-val["']/i);
      assert.match(html, /id=["']bridge-fuel-bar["']/i);

      assert.match(html, /id=["']gauge-card-brier["']/i);
      assert.match(html, /id=["']bridge-brier-val["']/i);
      assert.match(html, /id=["']bridge-brier-badge["']/i);

      assert.match(html, /id=["']gauge-card-discipline["']/i);
      assert.match(html, /id=["']bridge-discipline-val["']/i);
      assert.match(html, /id=["']bridge-discipline-xp["']/i);
    });

    test("Security Chief Alert container (#bridge-security-chief-alert) is present with Stand Down button", () => {
      assert.match(html, /id=["']bridge-security-chief-alert["']/i);
      assert.match(html, /SECURITY CHIEF ALERT/i);
      assert.match(html, /id=["']btn-bridge-stand-down["']/i);
      assert.match(html, /Stand Down &amp; Activate Cooldown/i);
    });

    test("Voluntary Limits & Ship Calibration Pod (#bridge-limits-pod) is rendered with sliders", () => {
      assert.match(html, /id=["']bridge-limits-pod["']/i);
      assert.match(html, /id=["']bridge-input-loss-limit["']/i);
      assert.match(html, /id=["']bridge-input-current-loss["']/i);
      assert.match(html, /id=["']bridge-input-fee-budget["']/i);
      assert.match(html, /id=["']bridge-input-incurred-fees["']/i);
    });

    test("Client-side interactive JavaScript functions are defined", () => {
      assert.match(html, /function\s+recalculateBridgeGauges\s*\(/i);
      assert.match(html, /function\s+testNominalHull\s*\(/i);
      assert.match(html, /function\s+testTriggerSecurityChief\s*\(/i);
      assert.match(html, /function\s+standDownFromHullAlert\s*\(/i);
    });
  });
});
