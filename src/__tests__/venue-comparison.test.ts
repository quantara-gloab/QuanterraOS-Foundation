import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareVenues, calculateKalshiOrderFee, VENUE_SPECS } from "../polymarket-engine.ts";
import { renderVenueComparisonPageHtml } from "../venue-comparison-page.ts";

describe("Cross-Venue Friction & Risk Engine (Kalshi vs Polymarket)", () => {
  it("computes accurate order-level fees and breakeven probabilities across venues", () => {
    // 10 contracts at $0.51 ask, 55% user probability
    const result = compareVenues({
      price: 0.51,
      count: 10,
      userProb: 0.55,
    });

    assert.strictEqual(result.contractPrice, 0.51);
    assert.strictEqual(result.contractCount, 10);
    assert.strictEqual(result.assessedWinProb, 0.55);

    // Kalshi calculations
    // Cost: 10 * 0.51 = $5.10
    assert.strictEqual(result.kalshi.purchaseCost, 5.10);
    // Fee: ceil(0.07 * 10 * 0.51 * 0.49 * 100) / 100 = ceil(17.493) / 100 = $0.18
    assert.strictEqual(result.kalshi.exchangeFee, 0.18);
    assert.strictEqual(result.kalshi.feePerContract, 0.018);
    // Max loss: 5.10 + 0.18 = $5.28
    assert.strictEqual(result.kalshi.maxLoss, 5.28);
    // Breakeven win prob percentage: 52.8%
    assert.strictEqual(result.kalshi.breakevenWinProb, 52.8);
    // Fee hurdle bps: (0.018 / 0.51) * 10,000 = 352.94 bps -> ~353 bps
    assert.ok(result.kalshi.feeHurdleBps > 350 && result.kalshi.feeHurdleBps < 360);
    // Settlement source: CME CF BRTI 60s TWAP
    assert.ok(result.kalshi.settlementSource.includes("CME CF Bitcoin Real Time Index"));
    assert.strictEqual(result.kalshi.settlementRiskLevel, "LOW");

    // Polymarket calculations
    // Cost: 10 * 0.51 = $5.10
    assert.strictEqual(result.polymarket.purchaseCost, 5.10);
    // Fee: 10 * 0.005 = $0.05
    assert.strictEqual(result.polymarket.exchangeFee, 0.05);
    // Gas/bridge friction: $0.15 flat
    assert.strictEqual(result.polymarket.gasAndBridgeFriction, 0.15);
    // Total friction: 0.05 + 0.15 = $0.20
    assert.strictEqual(result.polymarket.totalFriction, 0.20);
    // Max loss: 5.10 + 0.20 = $5.30
    assert.strictEqual(result.polymarket.maxLoss, 5.30);
    // Breakeven: 53.0%
    assert.strictEqual(result.polymarket.breakevenWinProb, 53.0);
    // Settlement risk: MODERATE (UMA Optimistic Oracle)
    assert.strictEqual(result.polymarket.settlementRiskLevel, "MODERATE");

    // Divergence: for 10 contracts, Kalshi total friction ($0.18) is lower than Polymarket ($0.20) due to on-chain gas overhead
    assert.strictEqual(result.divergence.cheaperVenue, "kalshi");
    assert.strictEqual(result.divergence.feeDeltaUsd, 0.02);
  });

  it("handles large order sizes where on-chain fixed gas is diluted", () => {
    // 100 contracts at $0.50 ask
    const result = compareVenues({
      price: 0.50,
      count: 100,
      userProb: 0.60,
    });

    // Kalshi: 100 * 0.50 = $50.00, fee = ceil(0.07 * 100 * 0.25) = $1.75
    assert.strictEqual(result.kalshi.exchangeFee, 1.75);

    // Polymarket: 100 * 0.005 ($0.50) + $0.08 gas (for count >= 50) = $0.58 total friction
    assert.strictEqual(result.polymarket.totalFriction, 0.58);

    // For 100 contracts, Polymarket total friction ($0.58) is lower than Kalshi ($1.75)
    assert.strictEqual(result.divergence.cheaperVenue, "polymarket");
    assert.strictEqual(result.divergence.feeDeltaUsd, 1.17);
  });

  it("renders comparison terminal HTML with compliant copy and required controls", () => {
    const html = renderVenueComparisonPageHtml();

    // Check title and meta
    assert.ok(html.includes("Cross-Venue Friction &amp; Risk Comparison"));
    assert.ok(html.includes("Kalshi vs. Polymarket Comparison"));

    // Check interactive inputs
    assert.ok(html.includes('id="slider-price"'));
    assert.ok(html.includes('id="input-count"'));
    assert.ok(html.includes('id="slider-prob"'));

    // Check venue cards and tags
    assert.ok(html.includes("CFTC REGULATED"));
    assert.ok(html.includes("WEB3 / POLYGON"));
    assert.ok(html.includes("CME CF BRTI 60s TWAP"));
    assert.ok(html.includes("UMA Optimistic"));

    // Check 1-click journal saving hooks
    assert.ok(html.includes("saveVenueCheck('kalshi-15m')"));
    assert.ok(html.includes("saveVenueCheck('polymarket-15m')"));

    // Verify Rule B5 zero capital disclaimer
    assert.ok(html.includes("DECISION &amp; RISK COMPANION · $0.00 CAPITAL RISK"));
    assert.ok(html.includes("Rule B5 Standby Lock"));

    // Verify Rule B4 compliance: no banned superlatives
    const lowerHtml = html.toLowerCase();
    assert.ok(!lowerHtml.includes("guaranteed profit"));
    assert.ok(!lowerHtml.includes("free money"));
    assert.ok(!lowerHtml.includes("unlimited alpha"));
    assert.ok(!lowerHtml.includes("citadel"));
    assert.ok(!lowerHtml.includes("tesla"));
  });
});
