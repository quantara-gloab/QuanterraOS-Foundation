import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getProspectiveStudyCohort,
  summarizeStudyCohort,
  getAnonymizedStudyObservations,
  generateStudySvgReceipt,
  renderStudyWidgetHtml,
  renderStudyPageHtml,
} from "../know-your-costs-study.ts";
import {
  getActiveEducatorPartners,
  summarizeEducatorProgram,
  generateEducatorSvgReceipt,
  renderEducatorWidgetHtml,
  renderEducatorPageHtml,
} from "../educator-portal.ts";

describe("Prospective 'Know Your Costs' Study & Cohort Portal (Growth Strategy Section 6.4)", () => {
  it("1. Study Cohort Telemetry: verifies sample size, awareness delta, and 64-char SHA-256 provenance", () => {
    const participants = getProspectiveStudyCohort();
    assert.equal(participants.length, 142);

    const summary = summarizeStudyCohort(participants);
    assert.equal(summary.targetEnrollment, 300);
    assert.equal(summary.currentEnrolled, 142);
    assert.ok(summary.week4RetentionPct >= 35.0, "Week-4 retention must meet or exceed target 35%");
    assert.ok(summary.awarenessGainPp > 50, "Fee awareness delta must demonstrate significant gain");
    assert.equal(summary.funnelMetrics.length, 6, "Must track all 6 target pilot funnel stages");
    assert.equal(summary.provenanceHash.length, 64, "Must generate valid 64-character SHA-256 provenance hash");
    assert.match(summary.settlementOracleReference, /CME CF/);
  });

  it("2. Anonymized Prospective Observations: verifies pre-trade reflections and friction checks", () => {
    const observations = getAnonymizedStudyObservations();
    assert.ok(observations.length >= 5);

    for (const obs of observations) {
      assert.ok(obs.id.startsWith("obs_"));
      assert.match(obs.contractTicker, /^KXBTC15M-/);
      assert.ok(obs.participantPseudonym.startsWith("PARTICIPANT-"));
      assert.ok(obs.estimatedFeeUsd > 0.01 && obs.estimatedFeeUsd < 0.02);
      assert.equal(obs.frictionChecked, true);
      assert.ok(obs.statedHypothesis.length > 10);
    }
  });

  it("3. Institutional SVG Receipt & Embeddable Widget: produces valid XML and HTML", () => {
    const participants = getProspectiveStudyCohort();
    const summary = summarizeStudyCohort(participants);

    const svg = generateStudySvgReceipt(summary);
    assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(svg.includes("<svg width=\"640\" height=\"760\""));
    assert.ok(svg.includes(summary.provenanceHash));
    assert.ok(svg.includes("RULE B5: $0.00 CAPITAL DEPLOYED"));
    assert.ok(svg.endsWith("</svg>"));

    const widget = renderStudyWidgetHtml(summary);
    assert.ok(widget.includes("<!DOCTYPE html>"));
    assert.ok(widget.includes("widget-box"));
    assert.ok(widget.includes("Fee Awareness Delta"));
    assert.ok(widget.includes('href="/study"'));
  });

  it("4. Full Study Page & Rule B4/B5/B10 Compliance: validates regulatory constraints", () => {
    const participants = getProspectiveStudyCohort();
    const summary = summarizeStudyCohort(participants);
    const observations = getAnonymizedStudyObservations();
    const html = renderStudyPageHtml(summary, observations);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("Prospective \"Know Your Costs\" Study"));
    assert.ok(html.includes("$0.00"));
    assert.ok(html.includes("CME CF BRTI"));
    assert.ok(html.includes("Kalshi"));

    // Banned language checks
    const banned = [
      /\balpha\b/i,
      /\bguaranteed\b/i,
      /\bbeat the market\b/i,
      /\barbitrage opportunity\b/i,
      /\bmispriced opportunities\b/i,
    ];
    for (const pat of banned) {
      assert.doesNotMatch(html, pat, `Study page must not contain banned pattern: ${pat}`);
    }
  });
});

describe("Educator & Distribution Partner Portal (Growth Strategy Section 6.2)", () => {
  it("1. Educator Program Roster & Anti-Volume Policy: verifies non-volumetric terms and capacity", () => {
    const partners = getActiveEducatorPartners();
    assert.equal(partners.length, 7);

    const summary = summarizeEducatorProgram(partners);
    assert.equal(summary.pilotCapacity, 20);
    assert.equal(summary.activePartners, 7);
    assert.equal(summary.availableSlots, 13);
    assert.ok(summary.totalQualifiedActivations > 300);
    assert.ok(summary.totalRetainedSubscriptions > 100);
    assert.ok(summary.aggregateRetentionRatePct >= 30.0);
    assert.equal(summary.provenanceHash.length, 64);
    assert.match(summary.qualificationCriteria.volumeRebatePolicy, /Strictly \$0\.00 volume kickbacks/);
  });

  it("2. Institutional SVG Receipt & Embeddable Widget: produces valid XML and HTML", () => {
    const partners = getActiveEducatorPartners();
    const summary = summarizeEducatorProgram(partners);

    const svg = generateEducatorSvgReceipt(summary);
    assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(svg.includes("<svg width=\"640\" height=\"760\""));
    assert.ok(svg.includes(summary.provenanceHash));
    assert.ok(svg.includes("RULE B5: $0.00 CAPITAL DEPLOYED"));
    assert.ok(svg.endsWith("</svg>"));

    const widget = renderEducatorWidgetHtml(summary);
    assert.ok(widget.includes("<!DOCTYPE html>"));
    assert.ok(widget.includes("widget-box"));
    assert.ok(widget.includes("Total Activations"));
    assert.ok(widget.includes('href="/educators"'));
  });

  it("3. Full Educator Page & Rule B4/B5/B10 Compliance: validates non-volumetric terms and safety", () => {
    const partners = getActiveEducatorPartners();
    const summary = summarizeEducatorProgram(partners);
    const html = renderEducatorPageHtml(summary, partners);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("Educator &amp; Distribution Partner Pilot"));
    assert.ok(html.includes("volume-based rebates") || html.includes("Zero Volume") || html.includes("zero commissions"));
    assert.ok(html.includes("$0.00"));
    assert.ok(html.includes("CME CF BRTI"));

    const banned = [
      /\balpha\b/i,
      /\bguaranteed\b/i,
      /\bbeat the market\b/i,
      /\barbitrage opportunity\b/i,
      /\bmispriced opportunities\b/i,
    ];
    for (const pat of banned) {
      assert.doesNotMatch(html, pat, `Educator page must not contain banned pattern: ${pat}`);
    }
  });
});
