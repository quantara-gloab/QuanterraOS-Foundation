import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeTrueCostCheck,
  computeMakerTakerSaver,
  computeRoundingOptimizer,
  computeCrossVenueNetSpread,
  computeKalshiTakerFee,
} from "../lib/fees.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 4 Task 4.2 Acceptance: Engineering Station (Maker/Taker Saver, Rounding, Net Spread)", () => {
  const html = renderFlightDeckPageHtml({ initialStation: "engineering" });

  describe("Part 3.1 Mathematical Acceptance Criteria", () => {
    test("10 contracts @ $0.51 yields exactly $0.18 fee and 52.80% discrete breakeven", () => {
      const result = computeTrueCostCheck({
        venue: "kalshi",
        product: "KXBTC15M",
        price: 0.51,
        contracts: 10,
        userAssumedProbability: 0.55,
      });

      assert.equal(result.fee, 0.18, "10 contracts @ 51¢ must have fee = $0.18");
      assert.equal(result.executableCost, 5.10, "Executable outlay must be $5.10");
      assert.equal(result.maxLoss, 5.28, "Max loss must be $5.28 ($5.10 + $0.18)");
      assert.equal(result.discreteBreakevenPct, 52.80, "Discrete breakeven must be 52.80%");
      assert.equal(result.rawBreakevenPct, 52.75, "Raw breakeven at 51¢ must be 52.75%");
    });

    test("100 contracts @ $0.50 yields exactly $1.75 fee and 51.75% breakeven", () => {
      const result = computeTrueCostCheck({
        venue: "kalshi",
        product: "KXBTC15M",
        price: 0.50,
        contracts: 100,
        userAssumedProbability: 0.55,
      });

      assert.equal(result.fee, 1.75, "100 contracts @ 50¢ must have fee = $1.75");
      assert.equal(result.executableCost, 50.00, "Executable outlay must be $50.00");
      assert.equal(result.maxLoss, 51.75, "Max loss must be $51.75 ($50.00 + $1.75)");
      assert.equal(result.discreteBreakevenPct, 51.75, "Breakeven must be 51.75%");
    });

    test("Maker vs Taker Saver saves 100% of exchange taker fee on Kalshi", () => {
      const saver = computeMakerTakerSaver(10, 0.51, "KXBTC15M", 50);

      assert.equal(saver.takerFee, 0.18, "Taker fee is $0.18");
      assert.equal(saver.makerFee, 0.00, "Maker fee is $0.00");
      assert.equal(saver.dollarSavings, 0.18, "Dollar savings is $0.18");
      assert.equal(saver.hurdleReductionPct, 1.80, "Hurdle reduction must be 1.80%");
      assert.ok(saver.estimatedFillProbabilityPct > 0, "Fill probability estimate must be positive");
      assert.match(saver.methodologyNote, /Maker orders on Kalshi incur \$0\.00 fee/i);
    });

    test("Rounding Optimizer calculates discrete ceil() drag across small separate orders", () => {
      // 5 separate 10-contract orders vs 1 consolidated 50-contract order
      const opt = computeRoundingOptimizer(10, 5, 0.51);

      // Single 10-contract order fee = $0.18 -> 5 separate orders = $0.90
      // 50-contract single order fee = ceil(0.07 * 50 * 0.51 * 0.49) = ceil(0.87465) = $0.88
      // Rounding drag = $0.90 - $0.88 = $0.02 (2¢)
      assert.equal(opt.currentFee, 0.90, "5 separate 10ct orders fee must be $0.90");
      assert.equal(opt.consolidatedFee, 0.88, "1 consolidated 50ct order fee must be $0.88");
      assert.equal(opt.roundingDragCents, 2, "Consolidation savings must be 2 cents");
      assert.match(opt.recommendation, /saves \$0\.02/i);
    });

    test("Cross-Venue Net Spread deducts both venue fees and warns of settlement mismatch", () => {
      const spread = computeCrossVenueNetSpread({
        kalshiPrice: 0.51,
        polymarketPrice: 0.53,
        contracts: 10,
      });

      assert.equal(spread.grossSpreadCents, 2.00, "Gross spread between 51¢ and 53¢ must be 2.00¢");
      assert.equal(spread.kalshiTakerFee, 0.18, "Kalshi taker fee must be $0.18 (1.80¢/ct)");
      assert.equal(spread.polymarketTakerFee, 0.00, "Polymarket protocol fee must be $0.00");
      assert.equal(spread.netSpreadCents, 0.20, "Net spread after 1.80¢ Kalshi fee must be 0.20¢");
      assert.match(spread.settlementMismatchNotice, /CME CF BRTI/i);
      assert.match(spread.settlementMismatchNotice, /UMA/i);
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=engineering)", () => {
    test("Engineering Station panel is marked active and contains header", () => {
      assert.match(html, /<section[^>]*id=["']station-panel-engineering["'][^>]*class=["'][^"']*active[^"']*["']|<section[^>]*class=["'][^"']*active[^"']*["'][^>]*id=["']station-panel-engineering["']/i);
      assert.match(html, /Engineering Station/i);
      assert.match(html, /True-Cost calculation reactor/i);
    });

    test("Interactive Control Pod is rendered with sliders and inputs", () => {
      assert.match(html, /id=["']eng-slider-price["']/i, "Price slider must exist");
      assert.match(html, /id=["']eng-slider-count["']/i, "Count slider must exist");
      assert.match(html, /id=["']eng-slider-prob["']/i, "Probability slider must exist");
      assert.match(html, /id=["']eng-select-venue["']/i, "Venue selector must exist");
    });

    test("4 Core Friction Gauges are present", () => {
      assert.match(html, /id=["']eng-stat-outlay["']/i, "Outlay gauge must exist");
      assert.match(html, /id=["']eng-stat-fee["']/i, "Fee gauge must exist");
      assert.match(html, /id=["']eng-stat-breakeven["']/i, "Breakeven hurdle gauge must exist");
      assert.match(html, /id=["']eng-stat-ev["']/i, "Net EV gauge must exist");
    });

    test("Sub-module 1: Maker vs Taker Saver card is rendered", () => {
      assert.match(html, /id=["']eng-module-saver["']/i, "Maker/Taker Saver module card must exist");
      assert.match(html, /id=["']eng-saver-dollars["']/i, "Dollar savings element must exist");
      assert.match(html, /id=["']eng-saver-hurdle["']/i, "Hurdle reduction element must exist");
      assert.match(html, /id=["']eng-saver-fill-prob["']/i, "Fill probability element must exist");
      assert.match(html, /id=["']eng-saver-method-note["']/i, "Methodology note must be visible");
    });

    test("Sub-module 2: Rounding Optimizer card is rendered", () => {
      assert.match(html, /id=["']eng-module-rounding["']/i, "Rounding Optimizer module card must exist");
      assert.match(html, /id=["']eng-rounding-recommendation["']/i, "Rounding recommendation must exist");
      assert.match(html, /ceil\(0\.07 × Count × P × \(1 − P\)\)/i, "Kalshi round-up formula must be documented");
    });

    test("Sub-module 3: Cross-Venue Net Spread card is rendered with basis warning", () => {
      assert.match(html, /id=["']eng-module-spread["']/i, "Cross-Venue Spread module card must exist");
      assert.match(html, /id=["']eng-spread-gross["']/i, "Gross spread element must exist");
      assert.match(html, /id=["']eng-spread-net["']/i, "Net spread element must exist");
      assert.match(html, /id=["']eng-spread-mismatch-notice["']/i, "Settlement mismatch risk notice must exist");
    });

    test("Part 0.3 Guardrail labels are prominently displayed", () => {
      assert.match(html, /RULE B5 LOCKED \(\$0\.00 LIVE RISK\)/i);
      assert.match(html, /strictly labeled .*your assumption/i);
    });

    test("Client-side recalculateEngineering JavaScript function is included", () => {
      assert.match(html, /function\s+recalculateEngineering\s*\(/i);
      assert.match(html, /function\s+setEngPrice\s*\(/i);
      assert.match(html, /function\s+setEngCount\s*\(/i);
    });
  });
});
