import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNetBinaryExpectedProfit,
  assignNeutralStatusLabel,
  evaluateForecastComparison,
  getMockProspectiveStudyCohort,
  summarizeCohortEvaluation,
  generateForecastComparisonSvgReceipt,
  renderForecastComparisonWidgetHtml,
  renderForecastComparisonPageHtml,
} from "../forecast-comparison.ts";

describe("Validated Forecast Comparison — Prospective Outcome Evaluation Engine (90-Day Plan #6)", () => {
  it("1. Expected Profit Arithmetic & Neutral Labels: strictly follows Strategy Section 4 formula", () => {
    // Strategy Section 4 test case:
    // "At $0.51 purchase price and $0.0175 fee, breakeven is 52.75%; a genuine 55% win rate implies $0.0225 expected profit"
    const p = 0.55;
    const execPrice = 0.51;
    const fee = 0.0175;
    const netEV = calculateNetBinaryExpectedProfit(p, execPrice, fee);
    assert.equal(netEV, 0.0225);

    // Negative EV case: 50% probability at 51c + fee
    const negativeEV = calculateNetBinaryExpectedProfit(0.50, execPrice, fee);
    assert.equal(negativeEV, -0.0275);

    // Neutral label assignment checks
    assert.equal(assignNeutralStatusLabel(0.01, 0.002, 0.0175), "Costs checked");
    assert.equal(assignNeutralStatusLabel(-0.01, 0.015, 0.0175), "Friction exceeds divergence");
    assert.equal(assignNeutralStatusLabel(-0.02, 0.05, 0.0175), "No validated edge");
    assert.equal(assignNeutralStatusLabel(0.03, 0.08, 0.0175), "Uncertainty high");
  });

  it("2. Multi-Source Forecast Evaluation: benchmarks user against market mid, lognormal model, and 50/50", () => {
    const result = evaluateForecastComparison({
      userProbability: 0.60,
      spotPrice: 87500,
      strike: 87500,
      minutesToExpiry: 10,
      yesBid: 0.48,
      yesAsk: 0.52,
      annualizedVol: 0.50,
    });

    assert.equal(result.marketContext.marketTicker, "KXBTC15M-SIMULATED");
    assert.equal(result.comparisons.length, 4);

    const user = result.comparisons.find((c) => c.source === "user")!;
    assert.equal(user.forecastProbability, 0.60);
    assert.equal(user.executablePrice, 0.52); // Buy YES at Ask
    assert.ok(user.takerFee > 0.015 && user.takerFee < 0.02);
    assert.equal(user.decisionSignal, "YES");

    const mid = result.comparisons.find((c) => c.source === "market_mid")!;
    assert.equal(mid.forecastProbability, 0.50);

    const model = result.comparisons.find((c) => c.source === "lognormal_model")!;
    assert.ok(model.forecastProbability > 0.45 && model.forecastProbability < 0.55);

    // Provenance verification
    assert.equal(result.provenanceHash.length, 64);
    assert.equal(result.settlementSource, "CME CF BRTI 60s TWAP");
    assert.match(result.canonicalEvidenceSummary, /1,316/);
  });

  it("3. Prospective Study Cohort & Out-of-Sample Resolution: measures empirical Brier scores", () => {
    const records = getMockProspectiveStudyCohort();
    assert.ok(records.length >= 5);

    const resolved = records.filter((r) => r.resolvedOutcome !== null);
    assert.ok(resolved.length >= 4);

    const summary = summarizeCohortEvaluation(records);
    assert.equal(summary.totalForecasts, records.length);
    assert.equal(summary.resolvedCount, resolved.length);
    assert.ok(summary.userMeanBrier > 0 && summary.userMeanBrier < 1);
    assert.ok(summary.marketMidMeanBrier > 0 && summary.marketMidMeanBrier < 1);
    assert.ok(summary.sampleProvenanceHash.length === 64);
    assert.ok(summary.empiricalVerdict.length > 20);
  });

  it("4. Institutional SVG Verification Receipt: produces valid XML with dark mode aesthetics", () => {
    const result = evaluateForecastComparison({ userProbability: 0.58 });
    const svg = generateForecastComparisonSvgReceipt(result);

    assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(svg.includes("<svg width=\"640\" height=\"720\""));
    assert.ok(svg.includes(result.provenanceHash));
    assert.ok(svg.includes("CME CF Bitcoin Real-Time Index (BRTI)"));
    assert.ok(svg.includes("STANDBY: $0.00"));
    assert.ok(svg.endsWith("</svg>"));
  });

  it("5. Embeddable HTML Widget: renders clean iframe widget with deep link", () => {
    const result = evaluateForecastComparison({ userProbability: 0.62 });
    const html = renderForecastComparisonWidgetHtml(result);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("widget-container"));
    assert.ok(html.includes("User Forecast"));
    assert.ok(html.includes("62.0%"));
    assert.ok(html.includes('href="/compare"'));
  });

  it("6. Rule B4, B5, and B10 Compliance: enforces regulatory and marketing guardrails", () => {
    const result = evaluateForecastComparison({ userProbability: 0.56 });
    const records = getMockProspectiveStudyCohort();
    const summary = summarizeCohortEvaluation(records);
    const html = renderForecastComparisonPageHtml(result, summary, records);

    // Rule B5: $0.00 live exposure
    assert.ok(html.includes("$0.00") || html.includes("STANDBY"));

    // Rule B10: CME CF BRTI and Kalshi marks notices
    assert.ok(html.includes("CME CF Bitcoin Real-Time Index (BRTI)"));
    assert.ok(html.includes("Kalshi Inc."));

    // Rule B4: Banned language audit
    const bannedPhrases = [
      /\balpha\b/i,
      /\bguaranteed\b/i,
      /\bbeat the market\b/i,
      /\barbitrage opportunity\b/i,
      /\bmispriced opportunities\b/i,
    ];

    for (const pattern of bannedPhrases) {
      assert.doesNotMatch(html, pattern, `Page HTML must not contain banned pattern: ${pattern}`);
    }
  });
});
