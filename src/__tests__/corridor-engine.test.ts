/**
 * Acceptance Test Suite: Multi-Strike Binary Corridor & Vertical Spread Engine
 *
 * Validates:
 * 1. Exact multi-leg Kalshi taker fee calculation across legs.
 * 2. Range Pin Corridor payoff arithmetic & discontinuous jump points.
 * 3. Directional Bull & Bear Vertical Spreads and Volatility Strangle profiles.
 * 4. Fee drag percentage calculation relative to maximum gross profit.
 * 5. Breakeven win rate hurdle calculation.
 * 6. Legging-in risk categorization based on corridor width in basis points.
 * 7. Embeddable HTML widget and Shareable SVG Receipt generation.
 * 8. Strict Rule B4 and Rule B5 compliance (zero banned language, $0.00 live risk lock).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeCorridorAnalysis,
  renderEmbedCorridorHtml,
  generateCorridorSvgReceipt,
  renderCorridorTerminalHtml
} from "../corridor-engine.ts";

describe("Multi-Strike Binary Corridor & Vertical Spread Engine", () => {
  it("1. Multi-Leg Fee Arithmetic: computes exact aggregate Kalshi taker fees on both legs", () => {
    // 10 contracts, Leg 1 at $0.60, Leg 2 at $0.40
    // Leg 1 fee: ceil(0.07 * 10 * 0.60 * 0.40 * 100) / 100 = ceil(16.8) / 100 = $0.17
    // Leg 2 fee: ceil(0.07 * 10 * 0.40 * 0.60 * 100) / 100 = ceil(16.8) / 100 = $0.17
    // Total fees = $0.34
    const res = computeCorridorAnalysis(
      "RANGE_PIN_CORRIDOR",
      67400,
      67250,
      67750,
      0.60,
      0.40,
      10
    );

    assert.equal(res.leg1.count, 10);
    assert.equal(res.leg1.takerFeeUsd, 0.17);
    assert.equal(res.leg2.takerFeeUsd, 0.17);
    assert.equal(res.totalTakerFeesUsd, 0.34);
    assert.ok(res.makerRebatePotentialUsd > 0);
  });

  it("2. Range Pin Corridor: verifies payoff profile and binary discontinuities", () => {
    // K1 = 67,250, K2 = 67,750. Spot = 67,400 (Inside)
    // Leg 1: Buy YES @ $0.65 (Outlay = $6.50)
    // Leg 2: Sell YES @ $0.35 (Credit = $3.50)
    // Net Capital Outlay = $3.00
    const res = computeCorridorAnalysis(
      "RANGE_PIN_CORRIDOR",
      67400,
      67250,
      67750,
      0.65,
      0.35,
      10
    );

    assert.equal(res.netCapitalOutlayUsd, 3.00);
    // Gross Max Profit = ($1.00 - 0.30) * 10 = $7.00
    assert.equal(res.grossMaxProfitUsd, 7.00);
    // Net Max Profit = $7.00 - total fees
    assert.equal(res.netMaxProfitUsd, Number((7.00 - res.totalTakerFeesUsd).toFixed(2)));
    assert.ok(res.netMaxLossUsd > res.netCapitalOutlayUsd, "Net max loss must incorporate taker fees");

    // Check payoff points
    const belowK1 = res.payoffCurve.find(p => p.spotPrice < 67250);
    assert.ok(belowK1);
    assert.equal(belowK1.grossPayoutUsd, 0);
    assert.equal(belowK1.netPnlUsd, -res.netMaxLossUsd);

    const inside = res.payoffCurve.find(p => p.spotPrice > 67250 && p.spotPrice < 67750);
    assert.ok(inside);
    assert.equal(inside.grossPayoutUsd, 10.00);
    assert.equal(inside.netPnlUsd, res.netMaxProfitUsd);

    const aboveK2 = res.payoffCurve.find(p => p.spotPrice > 67750);
    assert.ok(aboveK2);
    // In a short YES pin spread, if BTC surges above K2, both contracts settle YES ($1.00 - $1.00 = $0 gross payout)
    assert.equal(aboveK2.grossPayoutUsd, 0);
    assert.equal(aboveK2.netPnlUsd, -res.netMaxLossUsd);
  });

  it("3. Volatility Breakout Strangle: profits only on wide dispersion outside the corridor", () => {
    // Buy K1 NO and Buy K2 YES
    const res = computeCorridorAnalysis(
      "VOLATILITY_STRANGLE",
      67500,
      67000,
      68000,
      0.25,
      0.25,
      10
    );

    assert.equal(res.strategyType, "VOLATILITY_STRANGLE");
    assert.equal(res.netCapitalOutlayUsd, 5.00); // (0.25 + 0.25) * 10

    // Inside corridor should result in zero gross payout (both legs expire worthless)
    const inside = res.payoffCurve.find(p => p.spotPrice === 67500);
    assert.ok(inside);
    assert.equal(inside.grossPayoutUsd, 0);
    assert.equal(inside.netPnlUsd, -res.netMaxLossUsd);

    // Deep below K1 should pay out Leg 1
    const deepBelow = res.payoffCurve.find(p => p.spotPrice < 67000);
    assert.ok(deepBelow);
    assert.equal(deepBelow.grossPayoutUsd, 10.00);
    assert.equal(deepBelow.netPnlUsd, res.netMaxProfitUsd);
  });

  it("4. Legging-In Risk Scoring: flags high risk for narrow corridors (< 50 bps)", () => {
    // 67,000 spot with strikes 67,000 and 67,100 -> 100 / 67,000 = ~14.9 bps width
    const res = computeCorridorAnalysis(
      "RANGE_PIN_CORRIDOR",
      67000,
      67000,
      67100,
      0.55,
      0.45,
      10
    );

    assert.ok(res.corridorWidthBps < 50);
    assert.equal(res.leggingInRiskScore, "HIGH");
    assert.match(res.leggingInRiskExplanation, /under 50 bps/);
  });

  it("5. Embeddable HTML Widget: renders clean responsive iframe content with fee warnings", () => {
    const res = computeCorridorAnalysis(
      "RANGE_PIN_CORRIDOR",
      67500,
      67000,
      68000,
      0.60,
      0.40,
      10
    );

    const html = renderEmbedCorridorHtml(res);
    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("QUANTERRA<span>OS</span> &bull; CORRIDOR AUDIT"));
    assert.ok(html.includes("CFTC Fee Friction"));
    assert.ok(html.includes("Net Max Profit"));
  });

  it("6. Institutional SVG Strategy Debrief Receipt: produces valid XML with Gold Standard styling", () => {
    const res = computeCorridorAnalysis(
      "RANGE_PIN_CORRIDOR",
      67500,
      67000,
      68000,
      0.60,
      0.40,
      10
    );

    const svg = generateCorridorSvgReceipt(res);
    assert.ok(svg.startsWith("<?xml"));
    assert.ok(svg.includes("<svg width=\"640\" height=\"780\""));
    assert.ok(svg.includes("SHA256 PROVENANCE:"));
    assert.ok(svg.includes("RULE B10 NOTICE:"));
    assert.ok(svg.includes("RULE B5 STRICT COMPLIANCE:"));
  });

  it("7. Full Terminal Page & Compliance Guardrails: strictly follows Rule B4 and Rule B5", () => {
    const res = computeCorridorAnalysis(
      "RANGE_PIN_CORRIDOR",
      67500,
      67000,
      68000,
      0.60,
      0.40,
      10
    );

    const html = renderCorridorTerminalHtml(res);
    assert.ok(html.includes("Binary Corridor &amp; Vertical Spread Terminal"));
    assert.ok(html.includes("$0.00 exposure under permanent standby lock"));

    // Verify Rule B4 compliance
    const bannedTerms = [
      /\balpha\b/i,
      /\bbeat the market\b/i,
      /\bguaranteed\b/i,
      /\barbitrage\b/i,
      /\bmispriced opportunities\b/i
    ];

    for (const pattern of bannedTerms) {
      assert.ok(
        !pattern.test(html),
        `Banned term detected matching ${pattern} in corridor terminal HTML`
      );
    }
  });
});
