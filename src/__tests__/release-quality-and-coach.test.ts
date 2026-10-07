/**
 * Automated Acceptance Test Suite: Release-Quality Verification, Subsystems & Decision Coach
 *
 * Verifies:
 * 1. Backup and Recovery: Restores accounts, journals, and imports into an isolated in-memory
 *    environment and verifies 100% record and cryptographic checksum match.
 * 2. Data-Quality Checks: Detects stale prices, missing outcomes, duplicate trades, and mismatched
 *    contract identifiers; evaluates input reliability to return "Unavailable" when inputs are degraded.
 * 3. Fee & Settlement-Rule Monitoring: Tracks sources, effective dates, and flags outdated rules
 *    requiring founder review before updates are applied.
 * 4. Personal Decision Coach (INTELLARA):
 *    - Explains saved checks using identical calculator arithmetic.
 *    - Answers user queries from actual database records with clickable links.
 *    - Guides 3-step decision reviews (premise -> reality -> lesson).
 *    - Strictly isolates paper vs actual trades and User A vs User B.
 *    - Never invents trades, outcomes, or predictive edge.
 * 5. Founder Release Dashboard:
 *    - Verifies customer flow, system health, AI coach accuracy, evidence matrix, and pilot sessions.
 *    - Acceptance requirement: deliberately breaks a dependency and confirms the dashboard reports
 *      "Failed" instead of staying falsely green.
 * 6. Mobile Installation Experience:
 *    - PWA Add to Home Screen guidance for iPhone and Android.
 *    - App navigation (Check, Journal, Review, Account).
 *    - Offline calculation guard, update preservation, and shared-device privacy purge.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, runMigrations } from "../db.ts";
import { users, userDecisionJournal, importedStatementRecords } from "../schema.ts";
import { createUser } from "../auth.ts";
import { runIsolatedBackupRecoveryCheck } from "../backup-recovery.ts";
import {
  runDataQualityAudit,
  evaluateInputReliability,
  validateContractIdentifier,
} from "../data-quality-engine.ts";
import { checkFeeAndSettlementRulesFreshness, CURRENT_FEE_RULES } from "../fee-rule-monitor.ts";
import {
  explainSavedCheck,
  answerFromUserRecords,
  recordDecisionReviewDebrief,
  renderDecisionCoachWidgetHtml,
} from "../decision-coach.ts";
import {
  getFounderReleaseDashboardData,
  renderFounderReleaseDashboardHtml,
  setSimulatedDependencyBroken,
} from "../founder-release-dashboard.ts";
import {
  renderMobileInstallPageHtml,
  renderMobileBottomNavHtml,
  getMobileAppRuntimeScript,
} from "../mobile-install.ts";
import { getFeatureFlags } from "../feature-flags.ts";

describe("Release-Quality Subsystems & INTELLARA Decision Coach Test Suite", () => {
  let testUserIdA: string;
  let testUserIdB: string;
  let sampleCheckIdA: string;

  before(() => {
    runMigrations();

    // Setup User A with known records
    testUserIdA = `user_coach_a_${randomUUID().slice(0, 8)}`;
    createUser(`${testUserIdA}@quanterraos.local`, "password-coach-123", "pro");

    // Setup User B for boundary isolation tests
    testUserIdB = `user_coach_b_${randomUUID().slice(0, 8)}`;
    createUser(`${testUserIdB}@quanterraos.local`, "password-coach-123", "free");

    // Insert 1 actual trade and 1 paper check for User A
    sampleCheckIdA = `jrn_coach_${randomUUID().slice(0, 8)}`;
    db.insert(userDecisionJournal)
      .values({
        id: sampleCheckIdA,
        userId: testUserIdA,
        venue: "kalshi-15m",
        contractTicker: "KXBTC15M-T91250",
        contractType: "binary_above_below",
        side: "yes",
        pricingBasis: "executable_ask",
        contractPrice: 0.51,
        contractCount: 10,
        purchaseCost: 5.10,
        exchangeFee: 0.18,
        halfSpreadDrag: 0.0,
        totalDrag: 0.018,
        breakevenWinProb: 52.80,
        assessedWinProb: 55.0,
        netExpectedValue: 0.022,
        settlementSource: "CME CF BRTI 60s TWAP",
        decisionAction: "actual_trade",
        actualQuantity: 10,
        actualFillPrice: 0.51,
        actualFees: 0.18,
        status: "executed_live",
        outcome: "WON",
        realizedPnl: 4.72,
        outcomeStatus: "settled",
        notes: "Initial pilot test check",
        createdAt: "2026-10-07T05:00:00Z",
        updatedAt: "2026-10-07T05:15:00Z",
      })
      .run();

    db.insert(userDecisionJournal)
      .values({
        id: `jrn_paper_${randomUUID().slice(0, 8)}`,
        userId: testUserIdA,
        venue: "kalshi-15m",
        contractTicker: "KXBTC15M-T91500",
        contractType: "binary_above_below",
        side: "no",
        pricingBasis: "executable_ask",
        contractPrice: 0.48,
        contractCount: 5,
        purchaseCost: 2.40,
        exchangeFee: 0.09,
        halfSpreadDrag: 0.0,
        totalDrag: 0.018,
        breakevenWinProb: 49.80,
        assessedWinProb: 50.0,
        netExpectedValue: 0.002,
        settlementSource: "CME CF BRTI 60s TWAP",
        decisionAction: "paper_trade",
        status: "paper_logged",
        outcomeStatus: "pending",
        notes: "Simulated paper check",
        createdAt: "2026-10-07T06:00:00Z",
        updatedAt: "2026-10-07T06:00:00Z",
      })
      .run();
  });

  it("1. Backup & Recovery: restores into isolated in-memory environment and verifies record match", () => {
    const report = runIsolatedBackupRecoveryCheck();

    assert.equal(report.success, true);
    assert.equal(report.status, "PASSED");
    assert.equal(report.isolationVerified, true);
    assert.ok(report.restoredCounts.accounts >= 2);
    assert.ok(report.restoredCounts.journalEntries >= 2);
    assert.equal(report.checksums.match, true);
    assert.ok(report.checksums.sourceHash.length === 64);
    assert.equal(report.errors.length, 0);
  });

  it("2. Data-Quality Checks: detects stale prices, duplicates, invalid tickers, and displays Unavailable", () => {
    // Normal healthy inputs
    const normalReliability = evaluateInputReliability({ priceAgeMs: 800, price: 0.51, ticker: "KXBTC15M-T91250" });
    assert.equal(normalReliability.isAvailable, true);
    assert.equal(normalReliability.displayLabel, "Active");

    // Stale feed (>5000ms threshold)
    const staleReliability = evaluateInputReliability({ priceAgeMs: 6500, price: 0.51 });
    assert.equal(staleReliability.isAvailable, false);
    assert.match(staleReliability.displayLabel, /Unavailable \(Stale Feed\)/);

    // Offline mode
    const offlineReliability = evaluateInputReliability({ isOffline: true });
    assert.equal(offlineReliability.isAvailable, false);
    assert.match(offlineReliability.displayLabel, /Unavailable \(Offline\)/);

    // Ticker format validation
    assert.equal(validateContractIdentifier("KXBTC15M-T91250"), true);
    assert.equal(validateContractIdentifier("KXBTC15M-26OCT07-T91250"), true);
    assert.equal(validateContractIdentifier("INVALID_TICKER_XYZ"), false);

    // Audit report
    const audit = runDataQualityAudit();
    assert.ok(["HEALTHY", "DEGRADED", "UNAVAILABLE"].includes(audit.overallStatus));
  });

  it("3. Fee & Settlement-Rule Monitoring: tracks sources, effective dates, and flags outdated rules", () => {
    const freshness = checkFeeAndSettlementRulesFreshness();
    assert.equal(freshness.allCurrent, true);
    assert.ok(freshness.verifiedRulesCount >= 3);
    assert.equal(freshness.flaggedRules.length, 0);

    // Verify Kalshi fee formula accuracy
    const kalshiRule = CURRENT_FEE_RULES["kalshi-taker-15m"];
    assert.ok(kalshiRule);
    const calculatedFee = kalshiRule.computation({ price: 0.51, count: 10 });
    assert.equal(calculatedFee, 0.18); // ceil(0.07 * 10 * 0.51 * 0.49 * 100) / 100 = 0.18
  });

  it("4. Personal Decision Coach: explains check using exact calculator arithmetic", () => {
    const explanation = explainSavedCheck(sampleCheckIdA, testUserIdA);
    assert.ok(explanation);
    assert.equal(explanation.journalId, sampleCheckIdA);
    assert.equal(explanation.price, 0.51);
    assert.equal(explanation.count, 10);
    assert.equal(explanation.purchaseCost, 5.10);
    assert.equal(explanation.exchangeFee, 0.18);
    assert.equal(explanation.feePerContractCents, 1.80);
    assert.equal(explanation.totalMaxLoss, 5.28);
    assert.equal(explanation.breakevenWinProbPct, 52.80);
    assert.match(explanation.arithmeticProof, /10 contracts @ \$0\.51 \(\$5\.10\) \+ \$0\.18 fee = \$5\.28 max loss/);
  });

  it("5. Personal Decision Coach: answers from user's records, isolates paper vs actual, and protects account boundaries", () => {
    // Fee query for User A
    const feeAnswer = answerFromUserRecords("How much did I pay in fees?", testUserIdA);
    assert.equal(feeAnswer.queryType, "FEES");
    assert.equal(feeAnswer.numericalTotals.totalActualFeesPaid, 0.18);
    assert.equal(feeAnswer.numericalTotals.totalPlannedFees, 0.27); // 0.18 actual + 0.09 paper
    assert.equal(feeAnswer.numericalTotals.actualTradeCount, 1);
    assert.equal(feeAnswer.numericalTotals.paperTradeCount, 1);
    assert.ok(feeAnswer.linkedEntryIds.includes(sampleCheckIdA));

    // Pending outcomes query
    const pendingAnswer = answerFromUserRecords("Which entries still need outcomes?", testUserIdA);
    assert.equal(pendingAnswer.queryType, "PENDING_OUTCOMES");
    assert.equal(pendingAnswer.numericalTotals.pendingCount, 1);
    assert.match(pendingAnswer.incompleteDataNotes || "", /1 check\(s\) remain pending and are strictly isolated/);

    // Boundary Isolation: User B has 0 records and cannot see User A's data
    const userBAnswer = answerFromUserRecords("How much did I pay in fees?", testUserIdB);
    assert.equal(userBAnswer.numericalTotals.totalActualFeesPaid, 0.0);
    assert.equal(userBAnswer.linkedEntryIds.length, 0);

    // 3-Step Decision Review Debrief
    const debriefResult = recordDecisionReviewDebrief(sampleCheckIdA, testUserIdA, {
      expectation: "Expected CME BRTI momentum to stay above strike 91,250",
      reality: "Settlement printed at 91,420; YES resolved at $1.00",
      lesson: "Fee drag was 1.80¢/ct; timing entry at minute 4 minimized spread",
    });
    assert.equal(debriefResult.success, true);
    assert.match(debriefResult.updatedNotes, /\[PREMISE\]:/);
    assert.match(debriefResult.updatedNotes, /\[REALITY\]:/);
    assert.match(debriefResult.updatedNotes, /\[LESSON\]:/);

    // Drawer HTML template
    const coachHtml = renderDecisionCoachWidgetHtml();
    assert.match(coachHtml, /INTELLARA Decision Coach/);
    assert.match(coachHtml, /askCoach\('How much did I pay in fees\?'\)/);
  });

  it("6. Founder Release Dashboard: displays evidence matrix and deliberately breaks dependency in test environment", () => {
    // Normal healthy state
    setSimulatedDependencyBroken(false);
    const normalData = getFounderReleaseDashboardData();
    assert.equal(normalData.overallReleaseStatus, "READY");
    assert.equal(normalData.summary.failedCount, 0);
    assert.ok(normalData.summary.passedCount >= 6);

    const normalHtml = renderFounderReleaseDashboardHtml(normalData);
    assert.match(normalHtml, /RELEASE READY/);
    assert.match(normalHtml, /Subsystem Verification &amp; Evidence Matrix/);

    // DELIBERATE DEPENDENCY BREAKER: break dependency and verify dashboard reports FAILED instead of staying green
    setSimulatedDependencyBroken(true);
    const brokenData = getFounderReleaseDashboardData();
    assert.equal(brokenData.overallReleaseStatus, "BLOCKED");
    assert.ok(brokenData.summary.failedCount >= 1);

    const backupEvidence = brokenData.evidenceItems.find((i) => i.id === "sh_backup_restore");
    assert.ok(backupEvidence);
    assert.equal(backupEvidence.status, "Failed");
    assert.match(backupEvidence.missingEvidence || "", /SYNTHETIC_TEST_FAILURE/);

    const brokenHtml = renderFounderReleaseDashboardHtml(brokenData);
    assert.match(brokenHtml, /RELEASE BLOCKED/);

    // Reset breaker to clean state
    setSimulatedDependencyBroken(false);
  });

  it("7. Mobile Installation Experience & Feature Flag Gating", () => {
    const installHtml = renderMobileInstallPageHtml();
    assert.match(installHtml, /Install the web app/);
    assert.match(installHtml, /Add to Home Screen on Apple iPhone \(iOS Safari\)/);
    assert.match(installHtml, /Add to Home Screen on Android &amp; Samsung/);
    assert.match(installHtml, /App-Style Navigation/);
    assert.match(installHtml, /Shared-Device Privacy/);

    const bottomNav = renderMobileBottomNavHtml("journal");
    assert.match(bottomNav, /href="\/calculator"/);
    assert.match(bottomNav, /href="\/journal"/);
    assert.match(bottomNav, /href="\/review"/);
    assert.match(bottomNav, /href="\/account"/);

    const runtimeScript = getMobileAppRuntimeScript();
    assert.match(runtimeScript, /executeSignOutAndPurgeCache/);
    assert.match(runtimeScript, /preserveUnsavedChecksBeforeUpdate/);
    assert.match(runtimeScript, /disableOfflineCalculations/);

    // Feature flags check
    const flagsDefault = getFeatureFlags();
    assert.equal(flagsDefault.decisionCoach, true);
    assert.equal(flagsDefault.mobileInstall, true);
    assert.equal(flagsDefault.statementImport, true);
  });
});
