import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeFrictionTeardown,
  computeCrossVenueSpreadTeardown,
  computeCalibrationAdjustedKelly,
  decodeWhaleFlow,
  generateTrustOsAuditPreview,
  renderTrustOsPageHtml,
  COMPETITOR_BENCHMARK_ROWS,
  COMPETITOR_DOSSIER_LIST,
  generateBenchmarkSvgReceipt,
  renderBenchmarkWidgetHtml,
  renderBenchmarkPageHtml,
} from "../competitive-benchmark.ts";

describe("Competitive Benchmark & Truth vs. Hype Engine (2026 Strategy)", () => {
  it("1. Friction Teardown Arithmetic: verifies exact taker fee and breakeven hurdle vs competitor illusion", () => {
    // 51c price, 55% win rate over 100 contracts
    const teardown = computeFrictionTeardown({
      nominalPriceCents: 51,
      userStatedWinRatePct: 55,
      contracts: 100,
    });

    assert.equal(teardown.nominalPriceCents, 51);
    assert.equal(teardown.userStatedWinRatePct, 55);
    assert.equal(teardown.contracts, 100);

    // Competitor naive claim (Verso / Predly)
    assert.equal(teardown.competitorClaimedEdgePct, 4.00);
    assert.equal(teardown.competitorNominalGrossEV, 4.00);

    // QuanterraOS exact reality check
    assert.equal(teardown.exactTakerFeeUsd, 1.75); // $0.0175 * 100
    assert.equal(teardown.trueBreakevenHurdlePct, 52.75);
    assert.equal(teardown.netRealizedExpectedProfitUsd, 2.25);
    assert.ok(Math.abs(teardown.feeDragRatioPctOfProfit - 43.75) <= 0.1, "Fee drag ratio should be ~43.8%");
    assert.equal(teardown.provenanceHash.length, 64);
  });

  it("2. Architectural Benchmark Rows: audits all 6 dimensions against Dome, Oddpool, Verso, Predly", () => {
    assert.equal(COMPETITOR_BENCHMARK_ROWS.length, 6);

    const neutrality = COMPETITOR_BENCHMARK_ROWS.find((r) => r.dimension.includes("Neutrality"))!;
    assert.match(neutrality.competitors, /Polymarket/);
    assert.match(neutrality.competitors, /Kalshi/);
    assert.equal(neutrality.verdict, "SUPERIOR");

    const taker = COMPETITOR_BENCHMARK_ROWS.find((r) => r.dimension.includes("Taker Fee"))!;
    assert.match(taker.quanterraos, /parabolic curve/);
    assert.equal(taker.verdict, "SUPERIOR");

    const oracle = COMPETITOR_BENCHMARK_ROWS.find((r) => r.dimension.includes("Settlement Oracle"))!;
    assert.match(oracle.quanterraos, /60-block/);
    assert.match(oracle.quanterraos, /CME CF BRTI/);

    const mcp = COMPETITOR_BENCHMARK_ROWS.find((r) => r.dimension.includes("Model Context Protocol"))!;
    assert.match(mcp.quanterraos, /\/api\/mcp\/manifest/);
  });

  it("3. Institutional SVG Receipt: produces valid XML with dark mode aesthetics", () => {
    const teardown = computeFrictionTeardown({ nominalPriceCents: 50, userStatedWinRatePct: 56, contracts: 50 });
    const svg = generateBenchmarkSvgReceipt(teardown);

    assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(svg.includes("<svg width=\"640\" height=\"760\""));
    assert.ok(svg.includes(teardown.provenanceHash));
    assert.ok(svg.includes("RULE B5: $0.00 CAPITAL DEPLOYED"));
    assert.ok(svg.endsWith("</svg>"));
  });

  it("4. Embeddable Widget: renders clean iframe with side-by-side comparison", () => {
    const teardown = computeFrictionTeardown({ nominalPriceCents: 48, userStatedWinRatePct: 54 });
    const widget = renderBenchmarkWidgetHtml(teardown);

    assert.ok(widget.includes("<!DOCTYPE html>"));
    assert.ok(widget.includes("widget-box"));
    assert.ok(widget.includes("COMPETITOR CLAIM"));
    assert.ok(widget.includes("QuanterraOS"));
    assert.ok(widget.includes('href="/why"'));
  });

  it("5. Full Benchmark Page & Regulatory Guardrails: satisfies Rule B4, B5, and B10", () => {
    const teardown = computeFrictionTeardown({ nominalPriceCents: 51, userStatedWinRatePct: 55, contracts: 100 });
    const html = renderBenchmarkPageHtml(teardown);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("The Independent Truth Layer vs. Competitor Hype"));
    assert.ok(html.includes("$0.00"));
    assert.ok(html.includes("CME CF BRTI"));
    assert.ok(html.includes("Kalshi"));
    assert.ok(html.includes("Polymarket"));

    // Banned language audit (Rule B4)
    const banned = [
      /\balpha\b/i,
      /\bguaranteed\b/i,
      /\bbeat the market\b/i,
      /\barbitrage opportunity\b/i,
      /\bmispriced opportunities\b/i,
    ];
    for (const pat of banned) {
      assert.doesNotMatch(html, pat, `Benchmark page must not contain banned pattern: ${pat}`);
    }
  });

  it("6. Strategic Move #2: Cross-Venue Spread Teardown uncovers hidden fees & oracle hazard", () => {
    // 48c Kalshi Yes vs 49c Polymarket No across 1,000 contracts
    const result = computeCrossVenueSpreadTeardown({
      venueAPriceCents: 48,
      venueBPriceCents: 49,
      contracts: 1000,
      venueBGasFeeUsd: 1.50,
    });

    assert.equal(result.venueAPriceCents, 48);
    assert.equal(result.venueBPriceCents, 49);
    assert.equal(result.claimedNominalSpreadCents, 3.00); // 100 - (48 + 49) = 3c
    assert.equal(result.claimedGrossProfitUsd, 30.00); // $0.03 * 1000

    // Deductions
    assert.equal(result.venueATakerFeeUsd, 17.50); // Kalshi fee
    assert.equal(result.venueBGasAndFrictionUsd, 6.50); // $1.50 gas + $5.00 friction
    assert.equal(result.totalTransactionFrictionUsd, 24.00);
    assert.equal(result.netRealizedProfitUsd, 6.00); // $30 - $24.00
    assert.ok(result.feeDragRatioPct > 70.0, "Fee drag should consume over 70% of gross spread");

    // Provenance & Oracle Risk
    assert.equal(result.provenanceHash.length, 64);
    assert.ok(result.oracleRiskWarning.includes("CME CF BRTI 60-second TWAP"));
    assert.ok(result.oracleRiskWarning.includes("UMA"));

    // When order count is small (100 contracts), gas and taker fees completely destroy nominal spread
    const smallOrder = computeCrossVenueSpreadTeardown({
      venueAPriceCents: 48,
      venueBPriceCents: 49,
      contracts: 100,
      venueBGasFeeUsd: 1.50,
    });
    assert.equal(smallOrder.claimedGrossProfitUsd, 3.00);
    assert.ok(smallOrder.netRealizedProfitUsd < 1.0, "Small orders must see spread completely consumed");
    assert.equal(smallOrder.verdict, "ILLUSORY_SPREAD_DESTROYED");
  });

  it("7. Competitor Dossier: audits all 12 market incumbents across prediction markets and AI governance", () => {
    assert.ok(COMPETITOR_DOSSIER_LIST.length >= 10, "Must contain all 10+ competitor dossiers");

    const names = COMPETITOR_DOSSIER_LIST.map((c) => c.name);
    assert.ok(names.includes("Verso"));
    assert.ok(names.includes("Oddpool"));
    assert.ok(names.includes("Dome"));
    assert.ok(names.includes("Predly"));
    assert.ok(names.includes("Stand.Trade"));
    assert.ok(names.includes("Unusual Whales"));
    assert.ok(names.includes("The 7 Oracles"));
    assert.ok(names.includes("PillarLab AI"));
    assert.ok(names.includes("OddsPipe"));
    assert.ok(names.includes("Credo AI"));
    assert.ok(names.includes("Fiddler AI"));
    assert.ok(names.includes("Trustible"));

    for (const dossier of COMPETITOR_DOSSIER_LIST) {
      assert.ok(dossier.domain.length > 3);
      assert.ok(dossier.claim.length > 5);
      assert.ok(dossier.targetUser.length > 5);
      assert.ok(dossier.vulnerability.length > 20);
      assert.ok(dossier.quanterraAdvantage.length > 20);
    }
  });

  it("8. Strategic Move #4: Calibration-Adjusted Fractional Kelly sizing protects against over-betting", () => {
    // 50c contract, user thinks they have 60% win rate on $1,000 bankroll
    const kelly = computeCalibrationAdjustedKelly({
      nominalPriceCents: 50,
      userStatedWinRatePct: 60,
      bankrollUsd: 1000,
      shrinkageFactor: 0.35,
    });

    assert.equal(kelly.nominalPriceCents, 50);
    assert.equal(kelly.userStatedWinRatePct, 60);
    assert.equal(kelly.bankrollUsd, 1000);

    // Competitor Naive Kelly (The 7 Oracles): bets 20% of bankroll = $200
    assert.equal(kelly.competitorNaiveFullKellyPct, 20.0);
    assert.equal(kelly.competitorNaiveRecommendedContracts, 400);
    assert.ok(kelly.competitorRuinRiskProbabilityPct > 30.0, "Naive Kelly ruin risk must be high");

    // QuanterraOS Calibrated Kelly:
    // Shrinks 60% towards 50% baseline -> 53.5%
    assert.equal(kelly.calibratedWinRatePct, 53.5);
    // Exact Kalshi taker fee is 1.75c, effective cost is 51.75c
    assert.equal(kelly.exactTakerFeePerContractUsd, 0.0175);
    assert.equal(kelly.effectivePurchaseCostUsd, 0.5175);

    // Quarter-Kelly fraction is ~0.9%
    assert.ok(kelly.calibratedQuarterKellyPct < 2.0, "Quarter-Kelly allocation must be disciplined");
    assert.ok(kelly.recommendedQuarterKellyContracts > 0 && kelly.recommendedQuarterKellyContracts <= 25);
    assert.ok(kelly.maximumCapitalAtRiskUsd < 20.0, "Capital at risk must be <$20 on $1,000 bankroll");
    assert.ok(kelly.ruinRiskProbabilityPct < 2.5, "Calibrated ruin risk must be negligible");
    assert.equal(kelly.circuitBreakerStatus, "LOCKED_RULE_B5_ZERO_LIVE_RISK");
    assert.equal(kelly.provenanceHash.length, 64);
  });

  it("9. Strategic Move #5: Whale Forensics uncovers basis hedges and taker fee drag", () => {
    // 5,000 contracts @ 51c executed ATM
    const whale = decodeWhaleFlow({
      contractTicker: "KXBTC15M-SAMPLE",
      venue: "kalshi",
      priceCents: 51,
      contracts: 5000,
      spotPriceUsd: 68485,
      strikePriceUsd: 68500,
      timeRemainingSeconds: 180,
    });

    assert.equal(whale.contracts, 5000);
    assert.equal(whale.priceCents, 51);
    assert.equal(whale.notionalUsd, 2550.00);
    assert.equal(whale.takerFeePaidUsd, 87.50); // $0.0175 * 5000
    assert.ok(whale.feeDragPctOfTrade > 3.0, "Fee drag should exceed 3% of notional");
    assert.equal(whale.intentClassification, "DELTA_NEUTRAL_BASIS_HEDGE");
    assert.ok(whale.counterIntelligenceWarning.includes("Unusual Whales"));
    assert.equal(whale.provenanceHash.length, 64);
  });

  it("10. Strategic Move #6: TrustOS Mathematical Audit Dossier generates statutory proof", () => {
    const audit = generateTrustOsAuditPreview({
      institutionName: "Apex Regional Mutual",
      modelDomain: "algorithmic_underwriting",
      sampleDecisionsCount: 1316,
      targetBrierScore: 0.2001,
    });

    assert.equal(audit.institutionName, "Apex Regional Mutual");
    assert.equal(audit.modelDomain, "algorithmic_underwriting");
    assert.equal(audit.sampleDecisionsCount, 1316);
    assert.equal(audit.brierScore, 0.2001);
    assert.equal(audit.statutoryCompliance.coloradoSb26189, "PASS");
    assert.equal(audit.statutoryCompliance.naicModelBulletin, "PASS");
    assert.equal(audit.statutoryCompliance.ecoaRegulationB, "PASS");
    assert.equal(audit.commercialPilotTerms.fixedFeeUsd, 20000);
    assert.equal(audit.commercialPilotTerms.durationWeeks, 6);
    assert.equal(audit.auditSealSha256.length, 64);
  });

  it("11. Dedicated TrustOS Page renders compliant HTML meeting Rule B4/B5/B10", () => {
    const audit = generateTrustOsAuditPreview({
      institutionName: "Frontier Risk Analytics",
      modelDomain: "algorithmic_underwriting",
    });
    const html = renderTrustOsPageHtml(audit);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("TrustOS: Empirical Mathematical AI Governance"));
    assert.ok(html.includes("$20,000"));
    assert.ok(html.includes("Colorado SB 26-189"));
    assert.ok(html.includes("NAIC AI Model Bulletin"));
    assert.ok(html.includes(audit.auditSealSha256));

    // Banned language check
    assert.doesNotMatch(html, /\bguaranteed\b/i);
    assert.doesNotMatch(html, /\bbeat the market\b/i);
  });
});

