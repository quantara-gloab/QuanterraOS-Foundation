import { describe, it } from "node:test";
import assert from "node:assert";
import {
  computeLognormalBinaryProb,
  computeDepthMatrixSnapshot,
  generateDepthMatrixSvgReceipt,
  renderDepthMatrixWidgetHtml,
  renderDepthMatrixPageHtml
} from "../depth-matrix.ts";

describe("All-Strike Cross-Section Matrix & Liquidity Wall Engine", () => {
  it("1. Lognormal Binary Model: computes standard lognormal probabilities with Itô correction", () => {
    // At expiry tau = 0
    assert.strictEqual(computeLognormalBinaryProb(91500, 91250, 0, 0.55), 1.0);
    assert.strictEqual(computeLognormalBinaryProb(91000, 91250, 0, 0.55), 0.0);

    // ATM probability with 5 minutes remaining (5 / (365.25 * 1440) years)
    const tau = 5 / (365.25 * 1440);
    const atmProb = computeLognormalBinaryProb(91250, 91250, tau, 0.55);
    // ATM binary call is slightly below 0.50 due to negative drift from Ito term (-0.5 * sigma^2 * tau)
    assert.ok(atmProb >= 0.49 && atmProb <= 0.51, `ATM probability should be ~0.50, got ${atmProb}`);
  });

  it("2. Multi-Strike Matrix Snapshot: computes consistent cross-section across all strikes", () => {
    const snapshot = computeDepthMatrixSnapshot({
      spotPrice: 91250,
      timeRemainingMinutes: 5,
      annualizedVol: 0.55
    });

    assert.strictEqual(snapshot.rows.length, 5);
    assert.strictEqual(snapshot.spotPrice, 91250);

    // Verify contract sums
    const calculatedBids = snapshot.rows.reduce((acc, r) => acc + r.totalBidContracts, 0);
    const calculatedAsks = snapshot.rows.reduce((acc, r) => acc + r.totalAskContracts, 0);
    assert.strictEqual(snapshot.totalBidContracts, calculatedBids);
    assert.strictEqual(snapshot.totalAskContracts, calculatedAsks);
    assert.strictEqual(snapshot.totalCrossSectionContracts, calculatedBids + calculatedAsks);

    // Verify order imbalance ratio
    const expectedRatio = Number((calculatedBids / (calculatedBids + calculatedAsks)).toFixed(3));
    assert.strictEqual(snapshot.overallBidRatio, expectedRatio);

    // Verify provenance hash format
    assert.strictEqual(snapshot.provenanceHash.length, 64);
    assert.match(snapshot.provenanceHash, /^[0-9a-f]{64}$/);
  });

  it("3. Liquidity Wall Scanner: flags heavy resting inventory clusters", () => {
    const snapshot = computeDepthMatrixSnapshot({
      spotPrice: 91250,
      timeRemainingMinutes: 5
    });

    // In our deterministic builder, walls are placed on wing strikes
    assert.ok(snapshot.activeLiquidityWalls.length > 0, "Should detect at least one resting liquidity wall");
    for (const wall of snapshot.activeLiquidityWalls) {
      assert.ok(wall.sizeContracts >= 50, `Wall size should be substantial, got ${wall.sizeContracts}`);
      assert.ok(wall.summary.includes("contracts"), "Wall summary should specify contracts");
    }
  });

  it("4. Institutional SVG Verification Receipt: produces valid XML with Gold Standard styling", () => {
    const snapshot = computeDepthMatrixSnapshot({ spotPrice: 91250 });
    const svg = generateDepthMatrixSvgReceipt(snapshot);

    assert.ok(svg.startsWith("<?xml"));
    assert.ok(svg.includes("<svg width=\"640\" height=\"760\""));
    assert.ok(svg.includes(snapshot.provenanceHash));
    assert.ok(svg.includes("QUANTERRA // CROSS-SECTION MATRIX"));
    assert.ok(svg.includes("All-Strike Level-2 Depth"));
  });

  it("5. Embeddable HTML Widget: renders clean iframe widget with deep link", () => {
    const snapshot = computeDepthMatrixSnapshot({ spotPrice: 91250 });
    const widgetHtml = renderDepthMatrixWidgetHtml(snapshot);

    assert.ok(widgetHtml.includes("All-Strike Depth Matrix"));
    assert.ok(widgetHtml.includes("Spot: $91,250"));
    assert.ok(widgetHtml.includes("Audit Cross-Section &rarr;"));
    assert.ok(widgetHtml.includes("/matrix"));
  });

  it("6. Full Terminal HTML & Rule Compliance: strictly enforces Rule B4, Rule B5, and Rule B10", () => {
    const snapshot = computeDepthMatrixSnapshot({ spotPrice: 91250 });
    const pageHtml = renderDepthMatrixPageHtml(snapshot);

    assert.ok(pageHtml.includes("All-Strike Cross-Section Matrix"));
    assert.ok(pageHtml.includes("Total Book Liquidity"));

    // Rule B5 check: Zero live capital deployed
    assert.ok(pageHtml.includes("$0.00 capital deployed"), "Must state $0.00 capital deployed per Rule B5");
    assert.ok(pageHtml.includes("standby lock"), "Must state standby lock per Rule B5");

    // Rule B10 check: Third-party marks attribution
    assert.ok(pageHtml.includes("CF Benchmarks Ltd"), "Must attribute CF Benchmarks per Rule B10");
    assert.ok(pageHtml.includes("Kalshi is a trademark"), "Must attribute Kalshi per Rule B10");

    // Rule B4 check: Strictly ban hype and predictive language
    const bannedPatterns = [
      /\balpha\b/i,
      /\bbeat the market\b/i,
      /\bguaranteed\b/i,
      /\barbitrage\b/i,
      /\bmispriced opportunities\b/i
    ];
    for (const pattern of bannedPatterns) {
      assert.strictEqual(
        pattern.test(pageHtml),
        false,
        `Page HTML violates Rule B4 with banned pattern: ${pattern}`
      );
    }
  });
});
