import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateCoinFlipZone,
  computeConstituentDispersion,
  computeTwapWindowStatus,
  generateNavigationStrikeLadder,
  type ConstituentQuote,
} from "../lib/navigation.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 4 Task 4.3 Acceptance: Navigation Station (Settlement Radar & Coin-Flip Zone)", () => {
  const html = renderFlightDeckPageHtml({ initialStation: "navigation" });

  describe("Coin-Flip Zone Hazard Logic", () => {
    test("Spot within $50 and <= 180s triggers CRITICAL_HAZARD with +20 XP reward", () => {
      const hazard = evaluateCoinFlipZone(1.50, 138);

      assert.equal(hazard.inZone, true, "Must be inside coin-flip zone");
      assert.equal(hazard.severity, "CRITICAL_HAZARD");
      assert.equal(hazard.xpReward, 20, "Standing down must award +20 XP discipline");
      assert.match(hazard.disciplineAction, /Stand down/i);
      assert.match(hazard.message, /HAZARD ACTIVE/i);
    });

    test("Spot outside $50 band at 138s is not in critical hazard zone", () => {
      const watch = evaluateCoinFlipZone(65.0, 138);

      assert.equal(watch.inZone, false, "Must not be in critical zone");
      assert.equal(watch.severity, "WATCH");
      assert.equal(watch.xpReward, 10);
    });

    test("Spot within $50 but with ample time (> 180s) is in watch status, not hazard", () => {
      const early = evaluateCoinFlipZone(25.0, 450);

      assert.equal(early.inZone, false, "Must not be critical hazard with 450s remaining");
      assert.equal(early.severity, "WATCH");
    });

    test("Distant spot (> $75) with ample time (> 300s) is SAFE", () => {
      const safe = evaluateCoinFlipZone(250.0, 500);

      assert.equal(safe.inZone, false);
      assert.equal(safe.severity, "SAFE");
      assert.equal(safe.xpReward, 0);
    });

    test("Settled contract (0s remaining) returns SAFE with zero remaining hazard", () => {
      const settled = evaluateCoinFlipZone(0.0, 0);

      assert.equal(settled.inZone, false);
      assert.equal(settled.severity, "SAFE");
      assert.match(settled.message, /settlement is determined/i);
    });
  });

  describe("Constituent Spot Consensus & Dispersion", () => {
    const quotes: ConstituentQuote[] = [
      { venue: "Coinbase", price: 91249.20, weightPct: 0.35, status: "ONLINE" },
      { venue: "Kraken", price: 91247.80, weightPct: 0.28, status: "ONLINE" },
      { venue: "Bitstamp", price: 91248.50, weightPct: 0.22, status: "ONLINE" },
      { venue: "Gemini", price: 91248.10, weightPct: 0.15, status: "ONLINE" },
    ];

    test("Computes volume-weighted index consensus across 4 venues", () => {
      const consensus = computeConstituentDispersion(quotes);

      assert.equal(consensus.quorumMet, true);
      assert.equal(consensus.constituents.length, 4);
      assert.ok(consensus.indexPrice >= 91247.80 && consensus.indexPrice <= 91249.20);
      assert.equal(consensus.dispersionStatus, "NOMINAL", "Dispersion under 5 bps is NOMINAL");
      assert.ok(consensus.dispersionBps < 5.0, "Dispersion should be ~1.53 bps");
    });

    test("Detects divergent exchange feeds when spread exceeds 15 bps", () => {
      const divergentQuotes: ConstituentQuote[] = [
        { venue: "Coinbase", price: 91400.00, weightPct: 0.50, status: "ONLINE" },
        { venue: "Kraken", price: 91100.00, weightPct: 0.50, status: "ONLINE" },
      ];
      const consensus = computeConstituentDispersion(divergentQuotes);

      assert.equal(consensus.dispersionStatus, "DIVERGENT", "Spread of $300 at $91k is > 30 bps");
      assert.ok(consensus.dispersionBps > 15.0);
    });

    test("Cites CF Benchmarks and CME CF BRTI licensing attribution (Rule B10)", () => {
      const consensus = computeConstituentDispersion(quotes);

      assert.match(consensus.licensingNotice, /CME CF BRTI/i);
      assert.match(consensus.licensingNotice, /CF Benchmarks/i);
      assert.match(consensus.licensingNotice, /Coinbase.*Kraken.*Bitstamp.*Gemini/i);
    });
  });

  describe("60-Second TWAP Oracle Averaging Engine", () => {
    test("Calculates TWAP sub-intervals during final 60 seconds (seconds 840–900)", () => {
      // 45 seconds remaining means 15s elapsed in TWAP -> sub-interval 3 (15s / 5s) + 1 = sub-interval 4
      const twap = computeTwapWindowStatus(45);

      assert.equal(twap.isTwapActive, true);
      assert.equal(twap.oraclePhase, "TWAP_SAMPLING_ACTIVE");
      assert.equal(twap.subIntervalIndex, 4, "Second 15 of 60 falls in sub-interval 4");
      assert.equal(twap.totalSubIntervals, 12);
      assert.equal(twap.subIntervalDurationSec, 5);
    });

    test("Identifies PRE_SETTLEMENT phase when time is between 61s and 180s", () => {
      const twap = computeTwapWindowStatus(138);

      assert.equal(twap.isTwapActive, false);
      assert.equal(twap.oraclePhase, "PRE_SETTLEMENT");
    });

    test("Identifies REGULAR_TRADING phase when time > 180s", () => {
      const twap = computeTwapWindowStatus(420);

      assert.equal(twap.isTwapActive, false);
      assert.equal(twap.oraclePhase, "REGULAR_TRADING");
    });

    test("Identifies SETTLED phase when time reaches 0s", () => {
      const twap = computeTwapWindowStatus(0);

      assert.equal(twap.oraclePhase, "SETTLED");
      assert.equal(twap.subIntervalIndex, 12);
    });
  });

  describe("Strike Ladder Microstructure Generation", () => {
    test("Generates 5 strikes with ATM strike correctly marked and evaluated", () => {
      const ladder = generateNavigationStrikeLadder(91248.50, 138);

      assert.equal(ladder.length, 5);
      const atm = ladder.find((s) => s.isAtm);
      assert.ok(atm, "Must contain an ATM strike");
      assert.equal(atm.strike, 91250);
      assert.equal(atm.coinFlip.inZone, true, "ATM strike within $1.50 with 138s left must be in coin-flip zone");
      assert.equal(atm.coinFlip.xpReward, 20);
      assert.ok(atm.takerFeeCents > 0, "Taker fee must be calculated");
      assert.ok(atm.topOfBookSize > 0);
      assert.ok(atm.liquidityWallContracts > 0);
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=navigation)", () => {
    test("Navigation Station panel is active and contains header", () => {
      assert.match(html, /<section[^>]*id=["']station-panel-navigation["'][^>]*class=["'][^"']*active[^"']*["']|<section[^>]*class=["'][^"']*active[^"']*["'][^>]*id=["']station-panel-navigation["']/i);
      assert.match(html, /Navigation Station/i);
      assert.match(html, /Live Settlement Radar and oracle trajectory/i);
    });

    test("Pro cockpit telemetry ribbon is rendered", () => {
      assert.match(html, /PRO COCKPIT TELEMETRY: REAL-TIME/i);
      assert.match(html, /Signed-out visitors receive 20-min delayed telemetry/i);
    });

    test("Top 3 telemetry cards exist (Settlement Target, Expiry Countdown, ATM Hazard)", () => {
      assert.match(html, /id=["']nav-target-price["']/i);
      assert.match(html, /id=["']deck-nav-countdown["']/i);
      assert.match(html, /id=["']nav-hazard-status-pill["']/i);
      assert.match(html, /Coinbase/i);
      assert.match(html, /Kraken/i);
      assert.match(html, /Bitstamp/i);
      assert.match(html, /Gemini/i);
    });

    test("Coin-Flip Hazard Zone overlay banner is rendered with Stand Down button", () => {
      assert.match(html, /id=["']nav-coinflip-banner["']/i);
      assert.match(html, /ACTIVE COIN-FLIP HAZARD OVERLAY/i);
      assert.match(html, /id=["']btn-nav-stand-down["']/i);
      assert.match(html, /Stand Down from Coin-Flip Entry \(\+20 XP\)/i);
      assert.match(html, /id=["']nav-stand-down-feedback["']/i);
    });

    test("60-Second TWAP Oracle Radar HUD contains 12 sub-interval indicator blocks", () => {
      assert.match(html, /id=["']nav-twap-radar["']/i);
      assert.match(html, /id=["']twap-block-1["']/i);
      assert.match(html, /id=["']twap-block-6["']/i);
      assert.match(html, /id=["']twap-block-12["']/i);
      assert.match(html, /id=["']nav-licensing-notice["']/i);
      assert.match(html, /CME CF Bitcoin Real-Time Index/i);
    });

    test("Active strike ladder table is rendered with ATM indicator and hazard status", () => {
      assert.match(html, /id=["']nav-strike-ladder["']/i);
      assert.match(html, /id=["']nav-ladder-tbody["']/i);
      assert.match(html, /ATM/i);
      assert.match(html, /COIN-FLIP HAZARD/i);
      assert.match(html, /TAKER FEE DRAG/i);
    });

    test("Client-side interactive JavaScript functions are defined", () => {
      assert.match(html, /function\s+standDownCoinFlip\s*\(/i);
      assert.match(html, /function\s+setNavCountdown\s*\(/i);
    });
  });
});
