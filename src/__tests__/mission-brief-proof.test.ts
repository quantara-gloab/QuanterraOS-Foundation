/**
 * Acceptance Test Suite: Phase 7 Task 7.8
 * Weekly Mission Brief email + monthly Proof Report automation + Press Kit (Part 3.12)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getLatestMissionBrief,
  getAllMissionBriefs,
  generateWeeklyMissionBriefHtml,
  generateWeeklyMissionBriefText,
  generateMonthlyProofReport,
  generateMonthlyProofReportHtml,
  generateMonthlyProofReportMarkdown,
  subscribeToMissionBrief,
} from "../lib/mission-brief.ts";
import { renderNewsPageHtml } from "../news-page.ts";
import { renderPressPageHtml } from "../press-page.ts";

describe("Phase 7 Task 7.8 Acceptance: Weekly Mission Brief, Monthly Proof Automation & Press Kit", () => {
  describe("1. Weekly Mission Brief Data & Structure (Part 3.12)", () => {
    it("provides the canonical latest Mission Brief with all 4 required sections", () => {
      const brief = getLatestMissionBrief();
      assert.ok(brief, "Mission brief must exist");
      assert.strictEqual(brief.issueNumber, 14);
      assert.ok(brief.weekIdentifier.includes("2026-W"), "Must include ISO week identifier");

      // Section 1: What fees cost BTC traders this week
      assert.ok(brief.feesCostAnalysis, "Must include feesCostAnalysis");
      assert.strictEqual(brief.feesCostAnalysis.coinFlipZoneFeeDragPct, 1.75);
      assert.strictEqual(brief.feesCostAnalysis.breakevenRequiredWinRatePct, 51.75);
      assert.ok(brief.feesCostAnalysis.totalTakerFeesEstimatedUsd > 100000);
      assert.ok(brief.feesCostAnalysis.keyTakeaway.includes("51.75%"));

      // Section 2: Settlement-gap events & TWAP post-mortems
      assert.ok(brief.settlementGapEvents.length >= 2, "Must contain at least 2 settlement gap events");
      const event1 = brief.settlementGapEvents[0];
      assert.ok(event1.contractTicker.startsWith("KXBTC15M"));
      assert.ok(event1.postMortemLesson.includes("CME CF BRTI 60-second TWAP"));

      // Section 3: Rolling calibration update
      assert.ok(brief.rollingCalibration, "Must include rollingCalibration");
      assert.strictEqual(brief.rollingCalibration.corpusSampleSize, 1316);
      assert.strictEqual(brief.rollingCalibration.internalModelBrier, 0.2063);
      assert.strictEqual(brief.rollingCalibration.kalshiMarketMidBrier, 0.2001);
      assert.ok(
        brief.rollingCalibration.transparencyStatement.includes("Kalshi market mid (Brier 0.2001) beats our internal model"),
        "Must include mandatory transparency disclosure"
      );

      // Section 4: Upcoming macro & BTC calendar
      assert.ok(brief.upcomingMacroCalendar.length >= 3, "Must include upcoming catalysts");
      assert.ok(brief.upcomingMacroCalendar.some((m) => m.event.includes("CPI")));
      assert.ok(brief.upcomingMacroCalendar.some((m) => m.event.includes("FOMC")));
    });

    it("maintains historical archive of previous briefs", () => {
      const all = getAllMissionBriefs();
      assert.ok(all.length >= 2, "Should maintain multiple issues");
      assert.ok(all.some((b) => b.issueNumber === 13));
    });
  });

  describe("2. Email Template Generation (HTML & Multipart Text)", () => {
    it("generates an email HTML document with inline CSS and all 4 sections", () => {
      const html = generateWeeklyMissionBriefHtml();

      // Check structure & sections
      assert.ok(html.includes("QUANTERRAOS MISSION BRIEF"), "Header tag missing");
      assert.ok(html.includes("What Fees Cost BTC Prediction Traders This Week"), "Section 1 missing");
      assert.ok(html.includes("Settlement-Gap Events &amp; TWAP Post-Mortems"), "Section 2 missing");
      assert.ok(html.includes("Rolling Calibration Update"), "Section 3 missing");
      assert.ok(html.includes("Upcoming Macro &amp; BTC Schedule"), "Section 4 missing");

      // Check key data points
      assert.ok(html.includes("51.75%"), "Required breakeven rate missing");
      assert.ok(html.includes("0.2001"), "Market benchmark Brier missing");
      assert.ok(html.includes("0.2063"), "Internal model Brier missing");
      assert.ok(html.includes("Kalshi market mid (Brier 0.2001) beats our internal model"), "Transparency quote missing");

      // Check Part 7 verbatim disclaimer
      assert.ok(
        html.includes("QuanterraOS is an independent analytics tool by Quantara Global LLC"),
        "Part 7 compliance footer missing"
      );
    });

    it("generates multipart plain text version matching the email content", () => {
      const text = generateWeeklyMissionBriefText();
      assert.ok(text.includes("QUANTERRAOS WEEKLY MISSION BRIEF #14"));
      assert.ok(text.includes("1. TAKER FEE FRICTION ANALYSIS"));
      assert.ok(text.includes("2. SETTLEMENT-GAP EVENTS & TWAP POST-MORTEMS"));
      assert.ok(text.includes("3. ROLLING CALIBRATION UPDATE"));
      assert.ok(text.includes("4. UPCOMING MACRO & BTC SCHEDULE"));
      assert.ok(text.includes("Kalshi Market Mid Brier: 0.2001"));
      assert.ok(text.includes("QuanterraOS Internal Model Brier: 0.2063"));
    });
  });

  describe("3. Monthly Proof Report Automation (Part 3.12)", () => {
    it("computes monthly proof report data directly from the audited ledger", () => {
      const report = generateMonthlyProofReport({ month: "October 2026" });
      assert.strictEqual(report.reportPeriod, "October 2026");
      assert.ok(report.sampleSize >= 1316, "Corpus must have at least 1,316 settled windows");
      assert.strictEqual(report.modelBrier, 0.2063);
      assert.strictEqual(report.marketMidBrier, 0.2001);
      assert.strictEqual(report.coinFlipBrier, 0.2500);

      // Murphy decomposition
      assert.strictEqual(report.murphyDecomposition.reliability, 0.0094);
      assert.strictEqual(report.murphyDecomposition.resolution, 0.0593);
      assert.strictEqual(report.murphyDecomposition.uncertainty, 0.2500);

      // Decile calibration table
      assert.strictEqual(report.decileBreakdown.length, 10, "Must have 10 deciles (0.0-1.0)");
      assert.strictEqual(report.decileBreakdown[0].decileRange, "0.00 – 0.10");
      assert.strictEqual(report.decileBreakdown[9].decileRange, "0.90 – 1.00");

      // Transparency statement
      assert.ok(report.transparencyStatement.includes("beats our internal model"));
      assert.ok(report.provenanceHash.length === 64, "Must have 64-char SHA-256 hash");
    });

    it("generates an audited HTML monthly proof report document", () => {
      const html = generateMonthlyProofReportHtml();
      assert.ok(html.includes("Calibration Proof Report"));
      assert.ok(html.includes("Mandatory Transparency Statement (Part 0.3)"));
      assert.ok(html.includes("Murphy/Yates Resolution &amp; Reliability Decomposition"));
      assert.ok(html.includes("Decile Reliability &amp; Empirical Frequency"));
      assert.ok(html.includes("Cryptographic Provenance Hash"));
      assert.ok(html.includes("Download Raw Corpus CSV"));
    });

    it("generates exportable Markdown format for researchers & quants", () => {
      const md = generateMonthlyProofReportMarkdown();
      assert.ok(md.includes("# QuanterraOS Monthly Proof Report — October 2026"));
      assert.ok(md.includes("## 1. Transparency Statement (Part 0.3 Mandatory Disclosure)"));
      assert.ok(md.includes("## 2. Brier Baseline Comparison"));
      assert.ok(md.includes("## 3. Murphy/Yates Decomposition"));
      assert.ok(md.includes("## 4. Decile Calibration Table"));
    });
  });

  describe("4. Newsletter Subscription Intake", () => {
    it("subscribes valid email addresses and handles duplicates cleanly", () => {
      const testEmail = "trader_accept_test@example.com";
      const res1 = subscribeToMissionBrief(testEmail);
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.email, testEmail);

      // Duplicate submission does not crash or error
      const res2 = subscribeToMissionBrief(testEmail);
      assert.strictEqual(res2.success, true);
    });

    it("rejects invalid emails gracefully", () => {
      const badRes1 = subscribeToMissionBrief("");
      assert.strictEqual(badRes1.success, false);

      const badRes2 = subscribeToMissionBrief("not-an-email");
      assert.strictEqual(badRes2.success, false);
    });
  });

  describe("5. HTML Pages UI Integration (/news & /press)", () => {
    it("renders the /news page with Mission Brief #14 and subscription form", () => {
      const html = renderNewsPageHtml();
      assert.ok(html.includes("Prediction Market Friction &amp; Settlement Intel"));
      assert.ok(html.includes("Get the Weekly Mission Brief"));
      assert.ok(html.includes("id=\"subscribe-email\""));
      assert.ok(html.includes("What Fees Cost BTC Prediction Traders This Week"));
      assert.ok(html.includes("CME CF BRTI 60-Second TWAP"));
      assert.ok(html.includes("Monthly Proof Report"));
      assert.ok(html.includes("/press"));
    });

    it("renders the /press kit page with media fast facts and citation guide", () => {
      const html = renderPressPageHtml();
      assert.ok(html.includes("QuanterraOS Press Kit"));
      assert.ok(html.includes("100%"));
      assert.ok(html.includes("$0.00"));
      assert.ok(html.includes("1,316+"));
      assert.ok(html.includes("Media Citation Guidelines"));
      assert.ok(html.includes("Citing Taker Fee Friction &amp; Breakeven Probabilities"));
      assert.ok(html.includes("Citing Settlement Basis &amp; TWAP Divergence"));
      assert.ok(html.includes("press@quanterraos.com"));
    });
  });

  describe("6. Compliance & Guardrails (Rule B4 & Rule B5)", () => {
    it("strictly adheres to Rule B4 (zero superlatives) and Rule B5 ($0 live capital)", () => {
      const emailHtml = generateWeeklyMissionBriefHtml();
      const reportHtml = generateMonthlyProofReportHtml();
      const pressHtml = renderPressPageHtml();
      const combined = (emailHtml + reportHtml + pressHtml).toLowerCase();

      // Rule B4: No advice or claims of winning
      assert.ok(!combined.includes("guaranteed profit"), "Forbidden superlative 'guaranteed profit'");
      assert.ok(!combined.includes("beat the market\" to buy"), "No advisory edge claims");
      assert.ok(!combined.includes("100% win rate"), "Forbidden win rate claim");

      // Rule B5: $0.00 capital deployed
      assert.ok(combined.includes("$0.00"), "Must state $0.00 capital deployed");
    });
  });
});
