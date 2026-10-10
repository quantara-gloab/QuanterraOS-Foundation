import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseMarketCloseTime,
  reconcilePendingSettlements,
  getSettlementReconciliationStatus,
} from "../settlement-reconciler.ts";
import { recordPrediction, getPredictionsLedger } from "../prediction-ledger.ts";
import { db } from "../db.ts";
import { predictions } from "../schema.ts";
import { eq } from "drizzle-orm";

describe("Phase 2 Task 2.1 Acceptance: Settlement Reconciler & Backfill", () => {
  it("parses market close time accurately across various Kalshi ticker conventions", () => {
    // 1. Full timestamp ticker: 26OCT092030-30 -> Oct 9, 2026 20:30 UTC
    const t1 = parseMarketCloseTime("KXBTC15M-26OCT092030-30");
    const d1 = new Date(t1);
    assert.strictEqual(d1.getUTCFullYear(), 2026);
    assert.strictEqual(d1.getUTCMonth(), 9); // Oct is month index 9
    assert.strictEqual(d1.getUTCDate(), 9);
    assert.strictEqual(d1.getUTCHours(), 20);
    assert.strictEqual(d1.getUTCMinutes(), 30);

    // 2. Dash separated hour-minute: 26OCT07-1415 -> Oct 7, 2026 14:15 UTC
    const t2 = parseMarketCloseTime("KXBTC15M-26OCT07-1415");
    const d2 = new Date(t2);
    assert.strictEqual(d2.getUTCFullYear(), 2026);
    assert.strictEqual(d2.getUTCHours(), 14);
    assert.strictEqual(d2.getUTCMinutes(), 15);

    // 3. Test market with epoch timestamp
    const epochMs = 1791591678000;
    const t3 = parseMarketCloseTime(`test_market_${epochMs}`);
    assert.strictEqual(t3, epochMs);
  });

  it("reconciles closed pending predictions and achieves 100% settlement for closed >30m markets", () => {
    const testPastId = `pred_test_closed_${Date.now()}`;
    const testClosedTicker = "KXBTC15M-26OCT011200-00"; // definitely closed > 30 min ago

    // Insert a pending prediction for a market that closed in the past
    recordPrediction({
      id: testPastId,
      marketId: testClosedTicker,
      predictedProb: 0.65,
      modelVersion: "test-model-v2",
      timestamp: new Date("2026-10-01T11:45:00Z").toISOString(),
    });

    // Verify it starts as PENDING
    const initial = db.select().from(predictions).where(eq(predictions.id, testPastId)).get();
    assert.strictEqual(initial?.status, "PENDING");
    assert.strictEqual(initial?.outcome, null);

    // Run reconciliation
    const report = reconcilePendingSettlements();

    // Verify the closed row is now 100% SETTLED with outcome and Brier score
    const settled = db.select().from(predictions).where(eq(predictions.id, testPastId)).get();
    assert.strictEqual(settled?.status, "SETTLED");
    assert.ok(settled?.outcome === "YES" || settled?.outcome === "NO");
    assert.ok(typeof settled?.brierScore === "number");
    assert.ok(settled?.settledAt !== null);

    // Clean up test prediction
    db.delete(predictions).where(eq(predictions.id, testPastId)).run();
  });

  it("verifies the acceptance standard: closed >30 min = 100% settled across the entire database", () => {
    // Run reconciler to ensure all pending rows for closed markets are settled
    reconcilePendingSettlements();

    const status = getSettlementReconciliationStatus();
    assert.strictEqual(
      status.pendingOver30Minutes,
      0,
      `Expected 0 pending predictions for markets closed >30m, found ${status.pendingOver30Minutes}`
    );
    assert.strictEqual(
      status.complianceRatePct,
      100.0,
      `Expected 100% compliance rate, but got ${status.complianceRatePct}%`
    );
  });
});
