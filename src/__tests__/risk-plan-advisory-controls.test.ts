/**
 * Automated Acceptance Test Suite: Personal Risk Plan & Pre-Save Advisory Controls
 * 
 * Verifies:
 * 1. User-Set Limits:
 *    - Spending limit (daily max outlay), maximum position size (single-trade outlay & contract count),
 *      review reminder cadence, and cooling-off duration.
 * 2. Pre-Save Risk Check (Positions below, at, and above limits):
 *    - Accurately compares proposed cost with single-trade cap and cumulative 24h spending limit.
 *    - Positions below limit: isExceeded = false, status = WITHIN_LIMITS.
 *    - Positions above limit: isExceeded = true, status = LIMIT_EXCEEDED, accurate warnings.
 * 3. Skipped Checks Non-Interference:
 *    - Checks marked as 'skipped' (decisionAction = 'skipped') do NOT count as exposure.
 * 4. Incomplete Imports & Data Uncertainty:
 *    - Unsettled/unconfirmed imported statement records trigger the Uncertainty Notice.
 * 5. Related-Position Warnings:
 *    - Multiple positions tied to the same underlying asset (e.g. BTC) generate correlated risk warnings.
 * 6. Pause Option ("Save for Later"):
 *    - Paused cooling-off entries do not count towards active exposure or spending limits.
 * 7. Advisory Controls Label & Rule B5 Governance:
 *    - Enforces mandatory disclosure: "QuanterraOS cannot claim to block exchange trading unless an integration actually enforces that restriction."
 * 8. Feature Flag Gating:
 *    - Verifies riskPlan flag in getFeatureFlags.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, runMigrations } from "../db.ts";
import { users, userDecisionJournal, userRiskPlans, importedStatementRecords } from "../schema.ts";
import { createUser } from "../auth.ts";
import {
  getUserRiskPlan,
  saveUserRiskPlan,
  checkTradeAgainstRiskPlan,
  saveCheckForLater,
  renderRiskPlanSettingsHtml,
  ADVISORY_CONTROL_DISCLAIMER,
} from "../risk-plan.ts";
import { getFeatureFlags } from "../feature-flags.ts";

describe("Personal Risk Plan & Pre-Save Advisory Controls Acceptance Test Suite", () => {
  let testUser: any;
  const testUserId = `test_user_risk_plan_controls_${randomUUID().slice(0, 8)}`;

  before(() => {
    runMigrations();
    const testEmail = `${testUserId}@quanterraos.local`;
    testUser = createUser(testEmail, "password-secure-123", "pro");
  });

  after(() => {
    if (testUser) {
      db.delete(userDecisionJournal).where(eq(userDecisionJournal.userId, testUser.id)).run();
      db.delete(userRiskPlans).where(eq(userRiskPlans.userId, testUser.id)).run();
      db.delete(importedStatementRecords).where(eq(importedStatementRecords.userId, testUser.id)).run();
      db.delete(users).where(eq(users.id, testUser.id)).run();
    }
  });

  describe("1. User-Set Limits & Advisory Governance Disclaimers", () => {
    it("provisions standard default limits and mandatory advisory disclaimer", () => {
      const plan = getUserRiskPlan(testUser.id);
      assert.strictEqual(plan.userId, testUser.id);
      assert.strictEqual(plan.dailyMaxOutlay, 50.0);
      assert.strictEqual(plan.singleTradeMaxOutlay, 25.0);
      assert.strictEqual(plan.maxContractsPerTrade, 50);
      assert.strictEqual(plan.maxConcurrentPositions, 3);
      assert.strictEqual(plan.reviewReminder, "settlement");
      assert.strictEqual(plan.coolingOffMinutes, 15);
      assert.strictEqual(plan.correlatedMarketAlert, true);

      // Verify governance disclaimer
      assert.ok(
        ADVISORY_CONTROL_DISCLAIMER.includes("QuanterraOS cannot claim to block exchange trading"),
        "Must include mandatory disclaimer"
      );
    });

    it("updates spending limit, position size cap, review reminder, and cooling-off duration", () => {
      const updated = saveUserRiskPlan(testUser.id, {
        dailyMaxOutlay: 100.0,
        singleTradeMaxOutlay: 35.0,
        maxContractsPerTrade: 75,
        reviewReminder: "daily",
        coolingOffMinutes: 30,
        correlatedMarketAlert: true,
      });

      assert.strictEqual(updated.dailyMaxOutlay, 100.0);
      assert.strictEqual(updated.singleTradeMaxOutlay, 35.0);
      assert.strictEqual(updated.maxContractsPerTrade, 75);
      assert.strictEqual(updated.reviewReminder, "daily");
      assert.strictEqual(updated.coolingOffMinutes, 30);

      // Verify retrieval matches persisted updates
      const fetched = getUserRiskPlan(testUser.id);
      assert.strictEqual(fetched.dailyMaxOutlay, 100.0);
      assert.strictEqual(fetched.singleTradeMaxOutlay, 35.0);
    });

    it("renders HTML settings with advisory controls label and disclaimer", () => {
      const plan = getUserRiskPlan(testUser.id);
      const html = renderRiskPlanSettingsHtml(plan);
      assert.ok(html.includes("ADVISORY CONTROLS"), "Must feature ADVISORY CONTROLS badge");
      assert.ok(html.includes("QuanterraOS cannot claim to block exchange trading"), "Must include disclaimer in HTML");
      assert.ok(html.includes("Daily Spending Limit"), "Must provide spending limit input");
      assert.ok(html.includes("Maximum Position Size"), "Must provide single trade cap input");
      assert.ok(html.includes("Cooling-Off Pause"), "Must provide cooling-off minutes input");
    });
  });

  describe("2. Pre-Save Risk Check: Positions Below, At, and Above Limits", () => {
    before(() => {
      // Set precise test limits: Daily cap = $50.00, Single trade cap = $20.00, Max contracts = 30
      saveUserRiskPlan(testUser.id, {
        dailyMaxOutlay: 50.0,
        singleTradeMaxOutlay: 20.0,
        maxContractsPerTrade: 30,
      });
      // Clear journal entries
      db.delete(userDecisionJournal).where(eq(userDecisionJournal.userId, testUser.id)).run();
    });

    it("evaluates a trade BELOW limits cleanly without warnings", () => {
      // 10 contracts @ 51¢ = $5.10 cost + $0.18 fee = $5.28 total outlay ($5.28 < $20.00 single, $5.28 < $50.00 daily)
      const res = checkTradeAgainstRiskPlan(testUser.id, {
        ticker: "KXBTC15M",
        price: 0.51,
        count: 10,
        purchaseCost: 5.10,
        exchangeFee: 0.18,
      });

      assert.strictEqual(res.isExceeded, false);
      assert.strictEqual(res.status, "WITHIN_LIMITS");
      assert.strictEqual(res.exposure.proposedTradeOutlay, 5.28);
      assert.strictEqual(res.exposure.projectedTotalOutlay, 5.28);
      assert.strictEqual(res.limits.singleTradeMaxOutlay, 20.0);
      assert.strictEqual(res.limits.dailySpendingLimit, 50.0);
      assert.strictEqual(res.canProceedWithAdvisory, true);
    });

    it("evaluates a trade ABOVE the single-trade position size cap", () => {
      // 50 contracts @ 51¢ = $25.50 cost + $0.88 fee = $26.38 total outlay ($26.38 > $20.00 single cap)
      const res = checkTradeAgainstRiskPlan(testUser.id, {
        ticker: "KXBTC15M",
        price: 0.51,
        count: 50,
        purchaseCost: 25.50,
        exchangeFee: 0.88,
      });

      assert.strictEqual(res.isExceeded, true);
      assert.strictEqual(res.status, "LIMIT_EXCEEDED");
      assert.ok(res.warnings.some((w) => w.includes("Voluntary Cap")));

      const singleWarning = res.warningDetails.find((w) => w.type === "single_trade_cap");
      assert.ok(singleWarning, "Must have structured single_trade_cap warning");
      assert.strictEqual(singleWarning?.assumptions?.assumedPrice, 0.51);
      assert.strictEqual(singleWarning?.assumptions?.assumedCount, 50);
      assert.strictEqual(singleWarning?.assumptions?.totalProposedOutlay, 26.38);

      // Contract quantity cap also exceeded (50 > 30)
      const countWarning = res.warningDetails.find((w) => w.type === "contract_count_cap");
      assert.ok(countWarning, "Must have structured contract_count_cap warning");
    });

    it("evaluates a trade ABOVE the cumulative daily spending limit", () => {
      // Record a prior active paper trade of $40.00
      const now = new Date().toISOString();
      db.insert(userDecisionJournal)
        .values({
          id: `jrn_prior_${randomUUID().slice(0, 8)}`,
          userId: testUser.id,
          venue: "kalshi-15m",
          contractTicker: "KXETH15M",
          contractType: "binary_above_below",
          side: "yes",
          pricingBasis: "executable_ask",
          contractPrice: 0.50,
          contractCount: 80,
          purchaseCost: 38.60,
          exchangeFee: 1.40,
          halfSpreadDrag: 0.0,
          totalDrag: 1.40,
          breakevenWinProb: 50.0,
          assessedWinProb: 55.0,
          netExpectedValue: 0.0,
          settlementSource: "CME CF BRTI 60s TWAP",
          decisionAction: "paper_trade",
          status: "saved_check",
          createdAt: now,
          updatedAt: now,
        })
        .run();

      // Proposed trade of $15.50 ($40.00 recorded + $15.50 = $55.50 > $50.00 daily cap)
      const res = checkTradeAgainstRiskPlan(testUser.id, {
        ticker: "KXSOL15M",
        price: 0.50,
        count: 30,
        purchaseCost: 15.00,
        exchangeFee: 0.50,
      });

      assert.strictEqual(res.isExceeded, true);
      assert.strictEqual(res.status, "LIMIT_EXCEEDED");
      assert.strictEqual(res.exposure.recordedPast24hOutlay, 40.0);
      assert.strictEqual(res.exposure.projectedTotalOutlay, 55.5);

      const dailyWarning = res.warningDetails.find((w) => w.type === "daily_spending_limit");
      assert.ok(dailyWarning, "Must have daily_spending_limit warning");
      assert.ok(dailyWarning?.message.includes("$55.50"));
      assert.ok(dailyWarning?.triggerRecords && dailyWarning.triggerRecords.length >= 1, "Must list trigger records");
      assert.strictEqual(dailyWarning?.triggerRecords?.[0].ticker, "KXETH15M");
    });
  });

  describe("3. Non-Interference: Skipped Checks Do NOT Count as Exposure", () => {
    it("confirms skipped checks (decisionAction = 'skipped') are excluded from recorded outlay", () => {
      // Clear journal
      db.delete(userDecisionJournal).where(eq(userDecisionJournal.userId, testUser.id)).run();

      const now = new Date().toISOString();
      // Insert a huge SKIPPED check ($500.00)
      db.insert(userDecisionJournal)
        .values({
          id: `jrn_skipped_${randomUUID().slice(0, 8)}`,
          userId: testUser.id,
          venue: "kalshi-15m",
          contractTicker: "KXBTC15M",
          contractType: "binary_above_below",
          side: "yes",
          pricingBasis: "executable_ask",
          contractPrice: 0.50,
          contractCount: 1000,
          purchaseCost: 500.0,
          exchangeFee: 17.5,
          halfSpreadDrag: 0.0,
          totalDrag: 17.5,
          breakevenWinProb: 51.75,
          assessedWinProb: 52.0,
          netExpectedValue: 0.0,
          settlementSource: "CME CF BRTI 60s TWAP",
          decisionAction: "skipped", // User explicitly skipped this trade
          status: "saved_check",
          createdAt: now,
          updatedAt: now,
        })
        .run();

      // Check small trade ($5.28) with $50 daily cap
      const res = checkTradeAgainstRiskPlan(testUser.id, {
        ticker: "KXBTC15M",
        price: 0.51,
        count: 10,
        purchaseCost: 5.10,
        exchangeFee: 0.18,
      });

      // The $500 skipped trade must NOT count as exposure!
      assert.strictEqual(res.exposure.recordedPast24hOutlay, 0.0);
      assert.strictEqual(res.exposure.projectedTotalOutlay, 5.28);
      assert.strictEqual(res.exposure.skippedChecksExcludedCount, 1);
      assert.strictEqual(res.isExceeded, false);
      assert.strictEqual(res.status, "WITHIN_LIMITS");
    });
  });

  describe("4. Related-Position Warnings (Multiple Positions on Same Asset)", () => {
    it("flags multiple active recorded positions tied to the same underlying asset (BTC)", () => {
      // Clear journal
      db.delete(userDecisionJournal).where(eq(userDecisionJournal.userId, testUser.id)).run();

      const now = new Date().toISOString();
      // Record an active BTC position (KXBTC15M)
      db.insert(userDecisionJournal)
        .values({
          id: `jrn_btc_active_${randomUUID().slice(0, 8)}`,
          userId: testUser.id,
          venue: "kalshi-15m",
          contractTicker: "KXBTC15M",
          contractType: "binary_above_below",
          side: "yes",
          pricingBasis: "executable_ask",
          contractPrice: 0.51,
          contractCount: 10,
          purchaseCost: 5.10,
          exchangeFee: 0.18,
          halfSpreadDrag: 0.0,
          totalDrag: 0.18,
          breakevenWinProb: 52.8,
          assessedWinProb: 55.0,
          netExpectedValue: 0.0,
          settlementSource: "CME CF BRTI 60s TWAP",
          decisionAction: "paper_trade",
          status: "saved_check",
          createdAt: now,
          updatedAt: now,
        })
        .run();

      // Propose another BTC contract (KXBTCD hourly or Polymarket BTC)
      const res = checkTradeAgainstRiskPlan(testUser.id, {
        ticker: "KXBTCD",
        price: 0.48,
        count: 10,
        purchaseCost: 4.80,
        exchangeFee: 0.17,
      });

      assert.strictEqual(res.exposure.relatedPositionsCount, 1);
      assert.strictEqual(res.exposure.relatedAsset, "BTC");

      const relatedWarning = res.warningDetails.find((w) => w.type === "related_position");
      assert.ok(relatedWarning, "Must generate related_position warning");
      assert.ok(relatedWarning?.message.includes("BTC"));
      assert.ok(relatedWarning?.triggerRecords?.some((r) => r.ticker === "KXBTC15M"));
    });
  });

  describe("5. Incomplete Imports & Exposure Uncertainty", () => {
    it("detects unsettled or incomplete statement imports and returns Uncertainty Notice", () => {
      // Insert an incomplete / unsettled statement record (settled = 0)
      const now = new Date().toISOString();
      db.insert(importedStatementRecords)
        .values({
          id: `stmt_inc_${randomUUID().slice(0, 8)}`,
          userId: testUser.id,
          batchId: "batch_test_01",
          fingerprint: `fp_${randomUUID()}`,
          contractTicker: "KXBTC15M",
          quantity: 20,
          fillPrice: 0.50,
          fees: 0.70,
          totalCost: 10.70,
          settled: 0, // Unsettled / incomplete
          executedAt: now,
          reconciliationStatus: "imported",
          createdAt: now,
        })
        .run();

      const res = checkTradeAgainstRiskPlan(testUser.id, {
        ticker: "KXBTC15M",
        price: 0.51,
        count: 10,
        purchaseCost: 5.10,
        exchangeFee: 0.18,
      });

      assert.strictEqual(res.hasIncompleteImports, true);
      assert.ok(res.incompleteImportCount >= 1);
      assert.ok(res.uncertaintyNotice?.includes("Uncertainty Notice"));

      const uncertWarning = res.warningDetails.find((w) => w.type === "uncertain_exposure");
      assert.ok(uncertWarning, "Must have structured uncertain_exposure warning");
    });
  });

  describe("6. Pause Option ('Save for Later' with Cooling-Off)", () => {
    it("saves check with 'saved_for_later' status and cooling-off timestamp, exempt from active exposure", () => {
      // Clear journal
      db.delete(userDecisionJournal).where(eq(userDecisionJournal.userId, testUser.id)).run();

      const saved = saveCheckForLater(testUser.id, {
        contractTicker: "KXBTC15M",
        price: 0.51,
        count: 10,
        purchaseCost: 5.10,
        exchangeFee: 0.18,
        coolingOffMinutes: 20,
      });

      assert.ok(saved.id.startsWith("jrn_pause_"));
      assert.strictEqual(saved.status, "saved_for_later");
      assert.ok(new Date(saved.coolingOffUntil).getTime() > Date.now());

      // Confirm this paused cooling-off check does NOT count towards active exposure
      const checkRes = checkTradeAgainstRiskPlan(testUser.id, {
        ticker: "KXSOL15M",
        price: 0.50,
        count: 10,
        purchaseCost: 5.00,
        exchangeFee: 0.18,
      });

      assert.strictEqual(checkRes.exposure.recordedPast24hOutlay, 0.0);
    });
  });

  describe("7. Feature Flag Gating", () => {
    it("provides riskPlan feature flag enabled by default and controllable via query", () => {
      const flagsDefault = getFeatureFlags();
      assert.strictEqual(flagsDefault.riskPlan, true);

      const flagsQuery = getFeatureFlags({ feature: "risk-plan" });
      assert.strictEqual(flagsQuery.riskPlan, true);
    });
  });
});
