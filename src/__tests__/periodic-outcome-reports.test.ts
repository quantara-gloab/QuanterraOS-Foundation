import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDecileOutcomeRows,
  getPeriodicFrictionReport,
  generatePeriodicFrictionReceiptSvg,
  renderPeriodicFrictionWidgetHtml,
  exportPeriodicFrictionReportCsv,
  renderPeriodicFrictionReportPageHtml,
} from "../periodic-outcome-reports.ts";

describe("Periodic Outcome & Market Friction Reports Engine (Section 6.6)", () => {
  it("1. Decile Breakdown: audits 10 empirical deciles matching findings.md Section 9b exactly", () => {
    const deciles = getDecileOutcomeRows();

    assert.equal(deciles.length, 10, "Must have exactly 10 deciles (0-10% through 90-100%)");

    const totalSettled = deciles.reduce((acc, d) => acc + d.settledMarkets, 0);
    assert.equal(totalSettled, 1316, "Total settled markets across all deciles must equal 1,316 canonical windows");

    // Verify first and last deciles
    const first = deciles[0];
    assert.equal(first.decileRange, "0–10%");
    assert.equal(first.settledMarkets, 18);
    assert.equal(first.actualYesOutcomePct, 11.1);
    assert.equal(first.averageQuotedAskCents, 6.5);

    const fifth = deciles[4];
    assert.equal(fifth.decileRange, "40–50%");
    assert.equal(fifth.settledMarkets, 211);
    assert.equal(fifth.actualYesOutcomePct, 43.6);
    assert.equal(fifth.averageQuotedAskCents, 45.3);

    const tenth = deciles[9];
    assert.equal(tenth.decileRange, "90–100%");
    assert.equal(tenth.settledMarkets, 19);
    assert.equal(tenth.actualYesOutcomePct, 89.5);
    assert.equal(tenth.averageQuotedAskCents, 93.8);

    // Verify taker fee is non-linear and parabolic (highest at mid-market ~50c)
    assert.ok(fifth.averageTakerFeeCents > first.averageTakerFeeCents, "Mid-market taker fee must exceed tail fee");
    assert.ok(fifth.averageTakerFeeCents > tenth.averageTakerFeeCents, "Mid-market taker fee must exceed tail fee");
    assert.ok(fifth.averageTrueBreakevenPct > fifth.averageQuotedAskCents, "True breakeven hurdle must exceed quoted ask");
  });

  it("2. Periodic Friction Report: compiles Brier score, fee drag, and SHA-256 provenance hash", () => {
    const report = getPeriodicFrictionReport();

    assert.equal(report.reportId, "Q3-2026-MARKET-FRICTION-AUDIT");
    assert.equal(report.totalSettledMarkets, 1316);
    assert.equal(report.marketMidBrierScore, 0.2001);
    assert.equal(report.modelBrierScore, 0.2063);
    assert.equal(report.coinFlipBrierScore, 0.2500);

    assert.ok(report.averageTakerFeeCents >= 1.45 && report.averageTakerFeeCents <= 1.80, `Average taker fee must be in realistic range (actual: ${report.averageTakerFeeCents}c)`);
    assert.ok(report.overallFeeDragRatioPct >= 40.0 && report.overallFeeDragRatioPct <= 45.0, "Overall fee drag must be ~43.6%");

    // Cryptographic provenance (Rule B1)
    assert.equal(report.provenanceHash.length, 64, "Provenance hash must be a 64-char SHA-256 hex string");
    assert.match(report.provenanceHash, /^[0-9a-f]{64}$/);
    assert.equal(report.ruleB5CircuitStatus, "LOCKED_RULE_B5");
  });

  it("3. Academic Research Contexts: includes WSJ, Roosevelt Institute, and Vanderbilt citations", () => {
    const report = getPeriodicFrictionReport();
    const sources = report.academicContexts.map((c) => c.source);

    assert.ok(sources.some((s) => s.includes("Wall Street Journal")), "Must cite WSJ investigation");
    assert.ok(sources.some((s) => s.includes("Roosevelt Institute")), "Must cite Roosevelt Institute study");
    assert.ok(sources.some((s) => s.includes("Vanderbilt")), "Must cite Vanderbilt study");

    for (const citation of report.academicContexts) {
      assert.ok(citation.period.length > 0);
      assert.ok(citation.finding.length > 10);
      assert.ok(citation.methodologicalNote.length > 10);
      assert.ok(citation.quanterraosAuditResponse.length > 10);
    }
  });

  it("4. Institutional SVG Verification Card: generates valid vector receipt", () => {
    const report = getPeriodicFrictionReport();
    const svg = generatePeriodicFrictionReceiptSvg(report);

    assert.ok(svg.includes("<svg"), "Must contain <svg>");
    assert.ok(svg.includes("QUANTERRAOS // MARKET FRICTION &amp; OUTCOME AUDIT"));
    assert.ok(svg.includes("1,316 mkts"));
    assert.ok(svg.includes("0.2001"));
    assert.ok(svg.includes("43.6%"));
    assert.ok(svg.includes(report.provenanceHash.slice(0, 16)));
    assert.ok(svg.includes("RULE B5 LOCKED"));
    assert.ok(svg.endsWith("</svg>"));
  });

  it("5. Embeddable Widget: renders lightweight iframe card", () => {
    const report = getPeriodicFrictionReport();
    const html = renderPeriodicFrictionWidgetHtml(report);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("QUANTERRAOS // MARKET FRICTION AUDIT"));
    assert.ok(html.includes("0.2001"));
    assert.ok(html.includes("43.6%"));
    assert.ok(html.includes('href="/transparency"'));
  });

  it("6. RFC 4180 CSV Export: formats valid tabular dataset with headers and 10 rows", () => {
    const report = getPeriodicFrictionReport();
    const csv = exportPeriodicFrictionReportCsv(report);

    const lines = csv.split("\r\n");
    assert.equal(lines.length, 11, "Must have header line plus 10 decile rows");

    const header = lines[0];
    assert.ok(header.includes("decile_range"));
    assert.ok(header.includes("settled_markets"));
    assert.ok(header.includes("actual_yes_pct"));
    assert.ok(header.includes("fee_drag_ratio_pct"));

    // Check first decile line
    assert.ok(lines[1].startsWith('"0–10%"'));
    assert.ok(lines[1].includes("18"));
    assert.ok(lines[1].includes("11.1"));
  });

  it("7. Interactive Report Page HTML: contains full analysis, calibration table, and disclaimers", () => {
    const report = getPeriodicFrictionReport();
    const html = renderPeriodicFrictionReportPageHtml(report);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("Prediction Market Friction &amp; Outcome Transparency"));
    assert.ok(html.includes("1,316 settled Kalshi 15-minute Bitcoin contracts"));
    assert.ok(html.includes("0.2001"));
    assert.ok(html.includes("43.6%"));
    assert.ok(html.includes("Wall Street Journal"));
    assert.ok(html.includes("Roosevelt Institute"));
    assert.ok(html.includes("Vanderbilt University"));
    assert.ok(html.includes(report.provenanceHash));
    assert.ok(html.includes("LOCKED_RULE_B5"));
    assert.ok(html.includes("Legal &amp; Regulatory Disclosures"));
  });

  it("8. Safety & Compliance Rules B4, B5, and B10", () => {
    const report = getPeriodicFrictionReport();
    const pageHtml = renderPeriodicFrictionReportPageHtml(report);

    // Rule B4: No banned superlatives
    const lower = pageHtml.toLowerCase();
    assert.ok(!lower.includes("guaranteed profit"), "Rule B4 violation: guaranteed profit");
    assert.ok(!lower.includes("beat the market"), "Rule B4 violation: beat the market");

    // Rule B5: $0.00 capital deployed
    assert.equal(report.ruleB5CircuitStatus, "LOCKED_RULE_B5");

    // Rule B10: Marks notice
    assert.ok(report.legalNotice.includes("Kalshi"));
    assert.ok(report.legalNotice.includes("CME CF BRTI"));
  });
});
