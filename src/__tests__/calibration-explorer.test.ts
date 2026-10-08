/**
 * Acceptance Test Suite: Calibration Explorer & Brier Decomposition Engine
 *
 * Validates:
 * 1. Mathematical identity of Yates/Murphy 3-component decomposition:
 *    Brier = Reliability - Resolution + Uncertainty
 * 2. Brier Skill Score (BSS) calculation relative to climatological base rate.
 * 3. Multi-dimensional filtering by Macro Session, Moneyness, and Volatility.
 * 4. SVG Reliability Diagram generation with 45-degree perfect-calibration diagonal.
 * 5. Full terminal HTML rendering and strict Rule B4 / Rule B5 compliance.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeBrierDecomposition,
  computeCalibrationExplorer,
  generateCalibrationCurveSvg,
  renderCalibrationExplorerHtml
} from "../calibration-explorer.ts";
import type { CalibrationBin } from "../scoring.ts";

describe("Calibration Explorer & Brier Decomposition Engine", () => {
  it("1. Mathematical Identity: verifies Brier = Reliability - Resolution + Uncertainty", () => {
    // Construct sample bins matching CalibrationBin interface
    const testBins: CalibrationBin[] = [
      { label: "0-20%", rangeStart: 0.0, rangeEnd: 0.2, count: 50, actualYesRate: 0.12 },
      { label: "20-40%", rangeStart: 0.2, rangeEnd: 0.4, count: 50, actualYesRate: 0.28 },
      { label: "40-60%", rangeStart: 0.4, rangeEnd: 0.6, count: 100, actualYesRate: 0.52 },
      { label: "60-80%", rangeStart: 0.6, rangeEnd: 0.8, count: 50, actualYesRate: 0.68 },
      { label: "80-100%", rangeStart: 0.8, rangeEnd: 1.0, count: 50, actualYesRate: 0.89 }
    ];

    const decomp = computeBrierDecomposition(testBins);

    // Check exact identity within float tolerance
    const calculated = decomp.reliability - decomp.resolution + decomp.uncertainty;
    assert.ok(
      Math.abs(decomp.totalBrierScore - calculated) < 0.0001,
      `Brier (${decomp.totalBrierScore}) must equal Rel (${decomp.reliability}) - Res (${decomp.resolution}) + Unc (${decomp.uncertainty}) = ${calculated}`
    );

    assert.ok(decomp.reliability >= 0, "Reliability must be non-negative");
    assert.ok(decomp.resolution >= 0, "Resolution must be non-negative");
    assert.ok(decomp.uncertainty > 0, "Uncertainty must be positive");
    assert.ok(decomp.brierSkillScore > 0, "Well-sorted forecasts must have positive skill score");
  });

  it("2. Filter Simulation: slices baseline across sessions and moneyness brackets", async () => {
    // US Session ATM Only
    const resUsAtm = await computeCalibrationExplorer("US_SESSION", "ATM_ONLY", "ALL");
    assert.equal(resUsAtm.sessionFilter, "US_SESSION");
    assert.equal(resUsAtm.moneynessFilter, "ATM_ONLY");
    assert.ok(resUsAtm.eligibleSampleSize < resUsAtm.totalSampleSize);

    // Verify only ATM bins (mid between 0.40 and 0.60) have positive count
    for (const b of resUsAtm.bins) {
      const mid = (b.rangeStart + b.rangeEnd) / 2;
      if (mid < 0.40 || mid > 0.60) {
        assert.equal(b.count, 0);
      } else {
        assert.ok(b.count > 0);
      }
    }
  });

  it("3. SVG Reliability Curve: renders SVG with 45-degree diagonal and empirical line", async () => {
    const res = await computeCalibrationExplorer("ALL", "ALL", "ALL");
    const svg = generateCalibrationCurveSvg(res);

    assert.ok(svg.startsWith("<svg"));
    assert.ok(svg.includes("stroke-dasharray=\"4 4\""), "Must include 45-degree perfect-calibration dashed diagonal");
    assert.ok(svg.includes("<path d="), "Must include empirical curve path");
    assert.ok(svg.includes("Observed Event Rate"), "Must include axis labels");
  });

  it("4. Full HTML Terminal & Compliance: verifies Rule B4 and Rule B5 static compliance", async () => {
    const res = await computeCalibrationExplorer("ALL", "ALL", "ALL");
    const html = renderCalibrationExplorerHtml(res);

    assert.ok(html.includes("Calibration Explorer &amp; Resolution Decomposition"));
    assert.ok(html.includes("Total Brier Score"));
    assert.ok(html.includes("Reliability (Error)"));
    assert.ok(html.includes("Resolution (Power)"));
    assert.ok(html.includes("Rule B4 &amp; B5 Strict Compliance"));
    assert.ok(html.includes("$0.00 Live Risk Lock"));

    // Verify Rule B4 compliance
    const banned = [
      /\balpha\b/i,
      /\bbeat the market\b/i,
      /\bguaranteed\b/i,
      /\barbitrage\b/i,
      /\bmispriced opportunities\b/i
    ];

    for (const pat of banned) {
      assert.ok(!pat.test(html), `Found banned phrase matching ${pat} in calibration explorer`);
    }
  });
});
