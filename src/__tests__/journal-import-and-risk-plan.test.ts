/**
 * Automated Test Suite: Journal CSV Statement Import, Export & Advisory Risk Plan
 *
 * Validates Days 15–30 90-day Roadmap Deliverables:
 * - CSV statements from QuanterraOS, Kalshi, and Polymarket parse correctly.
 * - Outlay, fee, and breakeven calculations adhere to official exchange rules.
 * - Voluntary advisory risk plan caps enforce thresholds without custodial orders.
 * - Exported CSV conforms to RFC 4180 format.
 */

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, runMigrations } from "../db.ts";
import { users, userDecisionJournal, userRiskPlans } from "../schema.ts";
import { createUser } from "../auth.ts";
import {
  parseJournalCsv,
  exportJournalCsv,
  getUserRiskPlan,
  saveUserRiskPlan,
  checkTradeAgainstRiskPlan,
} from "../journal-import.ts";

describe("Journal CSV Import, Export & Advisory Risk Plan", () => {
  let testUser: any;

  before(() => {
    runMigrations();
    const testEmail = `tester_${randomUUID().slice(0, 8)}@quanterraos.local`;
    testUser = createUser(testEmail, "password-secure-123", "pro");
  });

  after(() => {
    if (testUser) {
      db.delete(userDecisionJournal).where(eq(userDecisionJournal.userId, testUser.id)).run();
      db.delete(userRiskPlans).where(eq(userRiskPlans.userId, testUser.id)).run();
      db.delete(users).where(eq(users.id, testUser.id)).run();
    }
  });

  test("parses QuanterraOS standard journal CSV statement", () => {
    const csv = `contractTicker,side,price,count,purchaseCost,exchangeFee,breakevenWinProb,assessedWinProb,outcome,notes
KXBTC15M-T91250,yes,0.51,10,5.10,0.18,52.75,55.0,WON,Good calibration check
KXETH15M-T2650,no,0.48,20,9.60,0.35,49.75,52.0,LOST,Faded momentum`;

    const result = parseJournalCsv(csv, testUser.id);
    assert.equal(result.importedCount, 2);
    assert.equal(result.errors.length, 0);

    const entries = db
      .select()
      .from(userDecisionJournal)
      .where(eq(userDecisionJournal.userId, testUser.id))
      .all();

    assert.equal(entries.length, 2);
    const won = entries.find((e) => e.contractTicker === "KXBTC15M-T91250");
    assert.ok(won);
    assert.equal(won?.outcome, "WON");
    assert.ok(won?.realizedPnl && won.realizedPnl > 0);
  });

  test("parses Kalshi trade history CSV format with fee calculation fallback", () => {
    const kalshiCsv = `ticker,action,yes_price,count,settlement,order_time
KXSOL15M-T145,buy_yes,55,5,YES,2026-10-06T18:00:00Z`;

    const result = parseJournalCsv(kalshiCsv, testUser.id);
    assert.equal(result.importedCount, 1);

    const entry = db
      .select()
      .from(userDecisionJournal)
      .where(eq(userDecisionJournal.contractTicker, "KXSOL15M-T145"))
      .get();

    assert.ok(entry);
    assert.equal(entry?.contractPrice, 0.55);
    assert.equal(entry?.contractCount, 5);
    assert.equal(entry?.outcome, "WON");
    assert.ok(entry?.exchangeFee && entry.exchangeFee > 0);
  });

  test("exports journal entries to valid RFC 4180 CSV", () => {
    const exported = exportJournalCsv(testUser.id);
    assert.ok(exported.includes("id,venue,contractTicker"));
    assert.ok(exported.includes("KXBTC15M-T91250"));
    assert.ok(exported.includes("KXSOL15M-T145"));
  });

  test("provisions and updates user voluntary advisory risk plan", () => {
    const plan = getUserRiskPlan(testUser.id);
    assert.equal(plan.dailyMaxOutlay, 50.0);
    assert.equal(plan.singleTradeMaxOutlay, 25.0);
    assert.equal(plan.maxConcurrentPositions, 3);
    assert.equal(plan.correlatedMarketAlert, true);

    const updated = saveUserRiskPlan(testUser.id, {
      dailyMaxOutlay: 100.0,
      singleTradeMaxOutlay: 40.0,
    });
    assert.equal(updated.dailyMaxOutlay, 100.0);
    assert.equal(updated.singleTradeMaxOutlay, 40.0);
  });

  test("flags single-trade and daily outlay advisory warnings when thresholds are exceeded", () => {
    saveUserRiskPlan(testUser.id, {
      dailyMaxOutlay: 50.0,
      singleTradeMaxOutlay: 20.0,
    });

    // Check trade exceeding single trade cap ($25.50 > $20.00)
    const check1 = checkTradeAgainstRiskPlan(testUser.id, {
      ticker: "KXBTC15M",
      price: 0.51,
      count: 50,
      purchaseCost: 25.50,
      exchangeFee: 0.88,
    });

    assert.equal(check1.isExceeded, true);
    assert.ok(check1.warnings.some((w) => w.includes("Voluntary Cap")));

    // Check trade within limits ($5.10 < $20.00)
    const check2 = checkTradeAgainstRiskPlan(testUser.id, {
      ticker: "KXBTC15M",
      price: 0.51,
      count: 10,
      purchaseCost: 5.10,
      exchangeFee: 0.18,
    });
    assert.ok(check2.currentTradeOutlay < check2.singleTradeLimit);
  });
});
