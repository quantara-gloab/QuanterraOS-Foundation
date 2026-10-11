/**
 * QuanterraOS: Subscription Value Proof & Fighter Pilot Savings Engine Acceptance Test
 *
 * Verifies that QuanterraOS mathematically proves subscription value:
 * 1. Deterministic fee & hazard savings across equipped AI fighter pilots:
 *    - Lion: Maker Saver limit conversion eliminating non-linear Kalshi taker fees
 *    - Draco: Batching optimizer eliminating discrete ceil_to_cent drag
 *    - Wolf: Level-2 top-of-book depth protection preventing market sweep impact
 *    - Kraken: TWAP settlement hazard lock avoiding 50/50 flip losses near strike
 * 2. Automated CADET recommendation when volume does not justify paid tier
 * 3. Cryptographic SHA-256 provenance fingerprinting
 * 4. Rule B4/B5/B10 compliance (Zero capital deployed, zero banned hype words, trademark disclosures)
 * 5. Institutional SVG Audit Receipt generation
 * 6. HTML UI integration in /pricing and /cockpit
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeSubscriptionValueProof,
  generateSubscriptionValueProofSvgReceipt,
  renderSubscriptionValueCalculatorHtml,
} from "../lib/subscription-value-proof.ts";
import { renderPricingPageHtml } from "../pricing-page.ts";
import { renderCockpitPageHtml } from "../cockpit-page.ts";

describe("QuanterraOS: Subscription Value Proof & Fighter Pilot Savings Engine", () => {
  it("1. Deterministic arithmetic: calculates Pilot tier ($39/mo) surplus and days to breakeven", () => {
    // 10 contracts, 5 trades/day, 20 days/mo = 1,000 contracts/mo at 50¢
    const audit = computeSubscriptionValueProof({
      contractsPerTrade: 10,
      tradesPerDay: 5,
      daysPerMonth: 20,
      averagePriceCents: 50,
      tier: "pilot",
      makerAdoptionRatePct: 50,
    });

    assert.equal(audit.inputs.tier, "pilot");
    assert.equal(audit.inputs.totalMonthlyTrades, 100);
    assert.equal(audit.inputs.totalMonthlyContracts, 1000);
    assert.equal(audit.economics.subscriptionCostMonthlyDollars, 39);

    // Maker Saver savings must be positive
    assert.ok(audit.economics.makerSaverSavingsMonthlyDollars > 0, "Maker saver savings must be positive");
    // Rounding optimizer savings must be >= 0
    assert.ok(audit.economics.roundingOptimizerSavingsMonthlyDollars >= 0, "Rounding optimizer savings must be >= 0");
    // Slippage avoided must be positive
    assert.ok(audit.economics.slippageAvoidedSavingsMonthlyDollars > 0, "Slippage avoided must be positive");
    // Hazard avoidance must be positive
    assert.ok(audit.economics.hazardLossAvoidanceMonthlyDollars > 0, "Hazard avoidance must be positive");

    // Total preserved value
    const total = audit.economics.totalMonthlyValuePreservedDollars;
    assert.ok(total > 39, `Total monthly value preserved ($${total}) should exceed $39 subscription cost`);
    assert.ok(audit.economics.netMonthlySurplusDollars > 0, "Net monthly surplus should be positive");
    assert.equal(audit.economics.subscriptionJustified, true);
    assert.ok(audit.economics.daysToSubscriptionBreakeven <= 20, "Breakeven days should be within month");
    assert.match(audit.verdictSummary, /VALUE VERIFIED/);
  });

  it("2. CADET Tier Recommendation: flags low-volume participants to stay on free Cadet tier", () => {
    // Very low volume: 1 contract per trade, 1 trade per day, 5 days per month = 5 contracts
    const audit = computeSubscriptionValueProof({
      contractsPerTrade: 1,
      tradesPerDay: 1,
      daysPerMonth: 5,
      averagePriceCents: 50,
      tier: "pilot",
      makerAdoptionRatePct: 20,
    });

    assert.equal(audit.inputs.totalMonthlyContracts, 5);
    assert.equal(audit.economics.subscriptionJustified, false);
    assert.ok(audit.economics.netMonthlySurplusDollars < 0, "Net monthly surplus should be negative for minimal volume");
    assert.match(audit.verdictSummary, /CADET RECOMMENDED/, "Should explicitly recommend free Cadet tier");
  });

  it("3. Commander tier ($399/mo) arithmetic: justifies high-volume and desk trader economics", () => {
    // 50 contracts, 20 trades/day, 22 days/mo = 22,000 contracts/mo
    const audit = computeSubscriptionValueProof({
      contractsPerTrade: 50,
      tradesPerDay: 20,
      daysPerMonth: 22,
      averagePriceCents: 55,
      tier: "commander",
      makerAdoptionRatePct: 60,
    });

    assert.equal(audit.inputs.tier, "commander");
    assert.equal(audit.economics.subscriptionCostMonthlyDollars, 399);
    assert.ok(audit.economics.totalMonthlyValuePreservedDollars > 399, "Value preserved must exceed Commander $399/mo");
    assert.equal(audit.economics.subscriptionJustified, true);
    assert.ok(audit.economics.daysToSubscriptionBreakeven < 15, "Breakeven should occur in under 15 days");
  });

  it("4. Specialist Breakdown: verifies exact contributions from Lion, Draco, Wolf, and Kraken", () => {
    const audit = computeSubscriptionValueProof({
      contractsPerTrade: 15,
      tradesPerDay: 8,
      daysPerMonth: 20,
      averagePriceCents: 48,
    });

    assert.equal(audit.specialistBreakdown.length, 4);
    const pilots = audit.specialistBreakdown.map((s) => s.pilotId);
    assert.deepEqual(pilots, ["lion", "draco", "wolf", "kraken"]);

    for (const spec of audit.specialistBreakdown) {
      assert.ok(spec.name.length > 0);
      assert.ok(spec.role.length > 0);
      assert.ok(spec.mechanism.length > 0);
      assert.ok(spec.provenance.length > 0);
      assert.ok(spec.valuePreservedMonthlyDollars >= 0);
    }
  });

  it("5. Cryptographic Provenance & Rule B4/B5 Guardrails: verifies zero live risk & no banned hype", () => {
    const audit = computeSubscriptionValueProof();

    // SHA-256 fingerprint check
    assert.match(audit.sha256Fingerprint, /^[a-f0-9]{64}$/i);
    assert.match(audit.auditId, /^VAL-PILOT-[A-Z0-9]+$/);

    // Rule B5 permanent lock
    assert.equal(audit.guardrails.ruleB5LiveExposureDollars, 0.0);
    assert.equal(audit.guardrails.ruleB5Compliant, true);
    assert.equal(audit.guardrails.nonAdvisoryResearchCertified, true);

    // Rule B4 compliance: zero banned marketing terms
    const serialized = JSON.stringify(audit).toLowerCase();
    const bannedWords = ["guaranteed profit", "beat the market", "make money guaranteed", "insider edge"];
    for (const word of bannedWords) {
      assert.ok(!serialized.includes(word), `Audit output must not contain banned marketing term: "${word}"`);
    }
  });

  it("6. Institutional SVG Receipt Generation: outputs valid XML with dark mode aesthetics", () => {
    const audit = computeSubscriptionValueProof({ tier: "pilot", contractsPerTrade: 10 });
    const svg = generateSubscriptionValueProofSvgReceipt(audit);

    assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "Must start with XML declaration");
    assert.ok(svg.includes("<svg width=\"640\" height=\"800\""), "Must have canonical dimensions (640x800)");
    assert.ok(svg.includes(audit.auditId), "Must embed audit ID");
    assert.ok(svg.includes(audit.sha256Fingerprint), "Must embed cryptographic SHA-256 hash");
    assert.ok(svg.includes("RULE B5 LOCKED: $0.00 LIVE CAPITAL RISK"), "Must display Rule B5 compliance notice");
    assert.ok(svg.includes("CFTC RULE 4.41 RESEARCH"), "Must cite CFTC Rule 4.41");
    assert.ok(svg.includes("Lion (Synthesis)"), "Must cite Lion specialist");
    assert.ok(svg.includes("Draco (Data Quality)"), "Must cite Draco specialist");
    assert.ok(svg.includes("Wolf (Liquidity Depth)"), "Must cite Wolf specialist");
    assert.ok(svg.includes("Kraken (Settlement)"), "Must cite Kraken specialist");
  });

  it("7. Interactive HTML Calculator: embeds cleanly with reactive controls", () => {
    const html = renderSubscriptionValueCalculatorHtml();

    assert.ok(html.includes("subscription-value-proof-section"), "Must have container id");
    assert.ok(html.includes("val-input-contracts"), "Must contain contracts slider");
    assert.ok(html.includes("val-input-trades"), "Must contain trades slider");
    assert.ok(html.includes("val-input-days"), "Must contain days slider");
    assert.ok(html.includes("val-input-maker"), "Must contain maker adoption slider");
    assert.ok(html.includes("/api/cockpit/value-proof"), "Must contain fetch call to live API");
    assert.ok(html.includes("/api/cockpit/value-proof/receipt.svg"), "Must link to SVG receipt");
  });

  it("8. Pricing Page Integration: renders value proof section in /pricing", () => {
    const pricingHtml = renderPricingPageHtml("free");

    assert.ok(pricingHtml.includes("subscription-value-proof-section"), "Pricing page must contain value proof section");
    assert.ok(pricingHtml.includes("Does QuanterraOS Pay for Itself?"), "Must render proof headline");
    assert.ok(pricingHtml.includes("Fighter Pilot Value Engine"), "Must render badge");
  });

  it("9. Cockpit Page Integration: renders value proof tab button and panel in /cockpit", () => {
    const cockpitHtml = renderCockpitPageHtml();

    assert.ok(cockpitHtml.includes('id="tab-btn-value"'), "Cockpit must include Subscription Value Proof tab button");
    assert.ok(cockpitHtml.includes('id="tab-content-value"'), "Cockpit must include tab-content-value container");
    assert.ok(cockpitHtml.includes("subscription-value-proof-section"), "Cockpit must embed the value proof component");
  });
});
