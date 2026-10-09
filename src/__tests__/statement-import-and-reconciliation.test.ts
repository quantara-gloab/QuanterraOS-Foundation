/**
 * Automated Acceptance Test Suite: Statement Import and Reconciliation
 *
 * Verifies the full user scope:
 * 1. CSV import preview: Supported Kalshi export format, shows mapped fields and errors before saving.
 * 2. Duplicate prevention: Importing the same file twice does not create additional trades; totals remain unchanged.
 * 3. Record matching: Suggests matches between imported trades and saved checks; lets users confirm matches.
 * 4. Reconciliation status: Labels records User-entered, Imported, or Reconciled to statement; preserves original source values.
 * 5. Data controls: Exports and deletes imported records, cleanly reverting reconciled checks.
 * 6. Finalized performance totals: Keeps incomplete or ambiguous records out of finalized performance totals.
 * 7. Feature flag gating: Ensures the feature is safely gated behind FEATURE_STATEMENT_IMPORT / query flags.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db, runMigrations } from "../db.ts";
import { users, userDecisionJournal, importedStatementRecords } from "../schema.ts";
import { createUser } from "../auth.ts";
import {
  previewKalshiStatement,
  previewPolymarketStatement,
  previewStatementCsv,
  commitKalshiStatement,
  commitStatement,
  exportImportedStatementsCsv,
  deleteImportedStatements,
  getFinalizedPerformanceTotals,
} from "../statement-reconciliation.ts";
import { getFeatureFlags } from "../feature-flags.ts";

describe("Statement Import and Reconciliation Acceptance Test Suite", () => {
  let testUserId: string;
  let savedCheckId: string;

  const sampleKalshiCsv = `trade_id,market_ticker,side,action,count,price,fees,total_cost,settlement_value,realized_pnl,date
kalshi_tx_101,KXBTC15M-T91250,yes,buy,10,0.51,0.18,5.10,10.00,4.72,2026-10-07T01:00:00Z
kalshi_tx_102,KXETH15M-T2650,no,buy,20,0.48,0.35,9.60,0.00,-9.95,2026-10-07T01:05:00Z
kalshi_tx_103,KXSOL15M-T145,yes,buy,5,0.55,0.09,2.75,5.00,2.16,2026-10-07T01:10:00Z`;

  before(() => {
    runMigrations();
    testUserId = `test_user_${randomUUID().slice(0, 8)}`;
    const email = `${testUserId}@quanterraos.local`;
    createUser(email, "password-12345", "pro");

    // Create an existing saved check for user (planned before trade)
    savedCheckId = `jrn_pre_${randomUUID().slice(0, 8)}`;
    db.insert(userDecisionJournal)
      .values({
        id: savedCheckId,
        userId: testUserId,
        venue: "kalshi-15m",
        contractTicker: "KXBTC15M-T91250",
        contractType: "binary_above_below",
        side: "yes",
        pricingBasis: "executable_ask",
        contractPrice: 0.50, // User originally entered 0.50
        contractCount: 10,   // User planned 10 contracts
        purchaseCost: 5.00,
        exchangeFee: 0.17,   // User planned 0.17 fee
        halfSpreadDrag: 0.0,
        totalDrag: 0.017,
        breakevenWinProb: 51.70,
        assessedWinProb: 55.0,
        netExpectedValue: 0.33,
        settlementSource: "CME CF BRTI 60s TWAP",
        decisionAction: "paper_trade",
        status: "saved_check",
        reconciliationStatus: "user_entered",
        createdAt: "2026-10-07T00:50:00Z",
        updatedAt: "2026-10-07T00:50:00Z",
      })
      .run();
  });

  after(() => {
    deleteImportedStatements(testUserId);
    db.delete(userDecisionJournal).where(eq(userDecisionJournal.userId, testUserId)).run();
    db.delete(users).where(eq(users.id, testUserId)).run();
  });

  it("1. CSV import preview: standard Kalshi format, mapped fields and suggested match", () => {
    const preview = previewKalshiStatement(sampleKalshiCsv, testUserId);

    assert.equal(preview.success, true);
    assert.equal(preview.totalRows, 3);
    assert.equal(preview.validRows.length, 3);
    assert.equal(preview.duplicateCount, 0);
    assert.equal(preview.newRowsCount, 3);
    assert.equal(preview.totalFees, 0.62); // 0.18 + 0.35 + 0.09
    assert.equal(preview.totalOutlay, 18.07); // (5.10+0.18) + (9.60+0.35) + (2.75+0.09)

    // Verify mapped fields
    const mappedOriginals = preview.mappedHeaders.map((m) => m.original);
    assert.ok(mappedOriginals.includes("market_ticker"));
    assert.ok(mappedOriginals.includes("trade_id"));
    assert.ok(mappedOriginals.includes("fees"));

    // Verify suggested match for the saved check
    const btcRow = preview.validRows.find((r) => r.externalTradeId === "kalshi_tx_101");
    assert.ok(btcRow);
    assert.ok(btcRow.suggestedMatch);
    assert.equal(btcRow.suggestedMatch.journalId, savedCheckId);
    assert.equal(btcRow.suggestedMatch.confidence, "HIGH");
    assert.equal(btcRow.suggestedMatch.plannedPrice, 0.50);
  });

  it("2. Commits statement, reconciles saved check, and preserves original source figures", () => {
    const preview = previewKalshiStatement(sampleKalshiCsv, testUserId);
    const reconcileMap = {
      kalshi_tx_101: savedCheckId, // Reconcile first trade with saved check
    };

    const commitResult = commitKalshiStatement(testUserId, preview.batchId, preview.validRows, reconcileMap);

    assert.equal(commitResult.success, true);
    assert.equal(commitResult.importedCount, 2); // 2 standalone trades (102 and 103)
    assert.equal(commitResult.reconciledCount, 1); // 1 reconciled trade (101)
    assert.equal(commitResult.skippedDuplicates, 0);

    // Verify reconciled check has 'reconciled' status and preserved original user-entered values
    const reconciledCheck = db
      .select()
      .from(userDecisionJournal)
      .where(eq(userDecisionJournal.id, savedCheckId))
      .get();

    assert.ok(reconciledCheck);
    assert.equal(reconciledCheck.reconciliationStatus, "reconciled");
    assert.equal(reconciledCheck.decisionAction, "actual_trade");
    assert.equal(reconciledCheck.actualQuantity, 10);
    assert.equal(reconciledCheck.actualFillPrice, 0.51); // updated from statement fill price
    assert.equal(reconciledCheck.actualFees, 0.18);
    assert.equal(reconciledCheck.realizedPnl, 4.72);
    // Preserved source values
    assert.equal(reconciledCheck.originalContractPrice, 0.50);
    assert.equal(reconciledCheck.originalContractCount, 10);
    assert.equal(reconciledCheck.originalExchangeFee, 0.17);

    // Verify imported standalone rows
    const importedStandalone = db
      .select()
      .from(userDecisionJournal)
      .where(and(eq(userDecisionJournal.userId, testUserId), eq(userDecisionJournal.reconciliationStatus, "imported")))
      .all();

    assert.equal(importedStandalone.length, 2);
  });

  it("3. Duplicate prevention: re-importing identical statement does not create additional trades or change totals", () => {
    // Attempt re-import of same CSV
    const preview2 = previewKalshiStatement(sampleKalshiCsv, testUserId);

    assert.equal(preview2.duplicateCount, 3);
    assert.equal(preview2.newRowsCount, 0);

    const commitResult2 = commitKalshiStatement(testUserId, preview2.batchId, preview2.validRows, {});

    assert.equal(commitResult2.importedCount, 0);
    assert.equal(commitResult2.reconciledCount, 0);
    assert.equal(commitResult2.skippedDuplicates, 3);

    // Verify database counts remain strictly unchanged
    const totalRecords = db
      .select()
      .from(importedStatementRecords)
      .where(eq(importedStatementRecords.userId, testUserId))
      .all();

    assert.equal(totalRecords.length, 3);
  });

  it("4. Data controls: exports statement to RFC 4180 CSV and deletes imported records with clean reversion", () => {
    // Export CSV
    const exportedCsv = exportImportedStatementsCsv(testUserId);
    assert.ok(exportedCsv.startsWith("externalTradeId,venue,contractTicker"));
    assert.ok(exportedCsv.includes("kalshi_tx_101"));
    assert.ok(exportedCsv.includes("kalshi_tx_102"));
    assert.ok(exportedCsv.includes("kalshi_tx_103"));
    assert.ok(exportedCsv.includes('"reconciled"'));
    assert.ok(exportedCsv.includes('"imported"'));

    // Delete imported records
    const deleteRes = deleteImportedStatements(testUserId);
    assert.equal(deleteRes.deletedCount, 3);
    assert.equal(deleteRes.revertedChecksCount, 1);

    // Reconciled check reverts to user-entered with original figures restored
    const revertedCheck = db
      .select()
      .from(userDecisionJournal)
      .where(eq(userDecisionJournal.id, savedCheckId))
      .get();

    assert.ok(revertedCheck);
    assert.equal(revertedCheck.reconciliationStatus, "user_entered");
    assert.equal(revertedCheck.contractPrice, 0.50);
    assert.equal(revertedCheck.contractCount, 10);
    assert.equal(revertedCheck.exchangeFee, 0.17);
    assert.equal(revertedCheck.actualFillPrice, null);
    assert.equal(revertedCheck.realizedPnl, null);

    // Standalone imported checks were removed
    const remainingImported = db
      .select()
      .from(userDecisionJournal)
      .where(and(eq(userDecisionJournal.userId, testUserId), eq(userDecisionJournal.reconciliationStatus, "imported")))
      .all();
    assert.equal(remainingImported.length, 0);
  });

  it("5. Finalized performance isolation: keeps incomplete or ambiguous records out of performance totals", () => {
    const mixedEntries = [
      // 1. Fully finalized reconciled trade
      {
        decisionAction: "actual_trade",
        outcomeStatus: "settled",
        reconciliationStatus: "reconciled",
        realizedPnl: 4.72,
        actualFees: 0.18,
      },
      // 2. Finalized loss
      {
        decisionAction: "actual_trade",
        outcomeStatus: "settled",
        reconciliationStatus: "imported",
        realizedPnl: -9.95,
        actualFees: 0.35,
      },
      // 3. Incomplete / un-settled actual trade (must be EXCLUDED)
      {
        decisionAction: "actual_trade",
        outcomeStatus: "incomplete",
        reconciliationStatus: "user_entered",
        realizedPnl: null,
        actualFees: null,
      },
      // 4. Pending actual trade (must be EXCLUDED)
      {
        decisionAction: "actual_trade",
        outcomeStatus: "pending",
        reconciliationStatus: "user_entered",
        realizedPnl: null,
        actualFees: 0.10,
      },
      // 5. Paper trade (must be EXCLUDED)
      {
        decisionAction: "paper_trade",
        outcomeStatus: "settled",
        reconciliationStatus: "user_entered",
        realizedPnl: 10.00,
        actualFees: 0.15,
      },
    ];

    const totals = getFinalizedPerformanceTotals(mixedEntries);

    assert.equal(totals.finalizedCount, 2);
    assert.equal(totals.excludedCount, 2);
    assert.equal(totals.totalRealizedPnl, -5.23); // 4.72 - 9.95
    assert.equal(totals.totalFinalizedFees, 0.53); // 0.18 + 0.35
    assert.equal(totals.winCount, 1);
    assert.equal(totals.lossCount, 1);
  });

  it("6. Feature flag gating: feature is gated by environment and override query parameter", () => {
    // Override feature flag to false
    process.env.FEATURE_STATEMENT_IMPORT = "false";

    const flagsDisabled = getFeatureFlags({});
    assert.equal(flagsDisabled.statementImport, false);

    const flagsOverrideBeta = getFeatureFlags({ beta: "1" });
    assert.equal(flagsOverrideBeta.statementImport, true);

    const flagsOverrideFeature = getFeatureFlags({ feature: "statement-import" });
    assert.equal(flagsOverrideFeature.statementImport, true);

    // Restore feature flag
    process.env.FEATURE_STATEMENT_IMPORT = "true";
    const flagsEnabled = getFeatureFlags({});
    assert.equal(flagsEnabled.statementImport, true);
  });

  it("7. Polymarket CSV import preview: detects venue, maps tokens/USDC/gas, and prevents duplicate hash collisions", () => {
    // Insert a Polymarket-oriented saved check
    const polyCheckId = `jrn_poly_${randomUUID().slice(0, 8)}`;
    db.insert(userDecisionJournal)
      .values({
        id: polyCheckId,
        userId: testUserId,
        venue: "polymarket",
        contractTicker: "WILL-BTC-HIT-100K",
        contractType: "binary_above_below",
        side: "yes",
        pricingBasis: "executable_orderbook",
        contractPrice: 0.52,
        contractCount: 50,
        purchaseCost: 26.00,
        exchangeFee: 0.01,
        halfSpreadDrag: 0.0,
        totalDrag: 0.0002,
        breakevenWinProb: 52.02,
        assessedWinProb: 58.0,
        netExpectedValue: 0.06,
        settlementSource: "UMA Optimistic Oracle",
        decisionAction: "paper_trade",
        status: "saved_check",
        reconciliationStatus: "user_entered",
        createdAt: "2026-10-07T00:55:00Z",
        updatedAt: "2026-10-07T00:55:00Z",
      })
      .run();

    const samplePolymarketCsv = `txHash,market,outcome,type,tokens,price,usdc,fee,date
0x3a91f82c0192e478b123,WILL-BTC-HIT-100K,Yes,BUY,50,0.52,26.00,0.01,2026-10-07T01:30:00Z
0x8c72190bb4129d23a542,ETH-ABOVE-4K-2026,No,BUY,25,0.47,11.75,0.01,2026-10-07T01:35:00Z`;

    // Test automatic venue detection via previewStatementCsv
    const preview = previewStatementCsv(samplePolymarketCsv, testUserId);
    assert.equal(preview.success, true);
    assert.equal(preview.detectedVenue, "polymarket");
    assert.equal(preview.totalRows, 2);
    assert.equal(preview.validRows.length, 2);
    assert.equal(preview.validRows[0].venue, "polymarket");
    assert.equal(preview.validRows[0].externalTradeId, "0x3a91f82c0192e478b123");
    assert.equal(preview.validRows[0].quantity, 50);
    assert.equal(preview.validRows[0].fillPrice, 0.52);
    assert.equal(preview.validRows[0].fees, 0.01);
    assert.equal(preview.totalFees, 0.02);
    assert.equal(preview.totalOutlay, 37.77); // (26.00+0.01) + (11.75+0.01) = 37.77

    // Verify suggested match to polyCheckId
    assert.ok(preview.validRows[0].suggestedMatch);
    assert.equal(preview.validRows[0].suggestedMatch?.journalId, polyCheckId);
    assert.equal(preview.validRows[0].suggestedMatch?.confidence, "HIGH");

    // Also verify dedicated previewPolymarketStatement function
    const polyPreviewDirect = previewPolymarketStatement(samplePolymarketCsv, testUserId);
    assert.equal(polyPreviewDirect.detectedVenue, "polymarket");
    assert.equal(polyPreviewDirect.validRows.length, 2);
  });

  it("8. Multi-venue commit: commits Polymarket trades, attributes UMA oracle, prevents re-import duplicates", () => {
    const polyTxCsv = `txHash,market,outcome,type,tokens,price,usdc,fee,date
0xdeadbeef101,SOL-ABOVE-200-OCT26,Yes,BUY,100,0.60,60.00,0.02,2026-10-07T02:00:00Z`;

    const preview = previewPolymarketStatement(polyTxCsv, testUserId);
    assert.equal(preview.validRows.length, 1);

    const commitResult = commitStatement(testUserId, preview.batchId, preview.validRows);
    assert.equal(commitResult.success, true);
    assert.equal(commitResult.importedCount, 1);
    assert.equal(commitResult.skippedDuplicates, 0);

    // Verify database record has venue: "polymarket" and settlementSource: "UMA Optimistic Oracle"
    const importedRow = db
      .select()
      .from(importedStatementRecords)
      .where(and(eq(importedStatementRecords.userId, testUserId), eq(importedStatementRecords.externalTradeId, "0xdeadbeef101")))
      .get();
    assert.ok(importedRow);
    assert.equal(importedRow.venue, "polymarket");
    assert.equal(importedRow.quantity, 100);
    assert.equal(importedRow.fillPrice, 0.60);
    assert.equal(importedRow.fees, 0.02);

    const journalRow = db
      .select()
      .from(userDecisionJournal)
      .where(and(eq(userDecisionJournal.userId, testUserId), eq(userDecisionJournal.contractTicker, "SOL-ABOVE-200-OCT26")))
      .get();
    assert.ok(journalRow);
    assert.equal(journalRow.venue, "polymarket");
    assert.equal(journalRow.settlementSource, "UMA Optimistic Oracle");
    assert.equal(journalRow.pricingBasis, "executable_orderbook");

    // Test re-import duplicate prevention for Polymarket
    const reimportPreview = previewPolymarketStatement(polyTxCsv, testUserId);
    assert.equal(reimportPreview.duplicateCount, 1);
    assert.equal(reimportPreview.newRowsCount, 0);
    assert.equal(reimportPreview.validRows[0].isDuplicate, true);

    const reimportCommit = commitStatement(testUserId, reimportPreview.batchId, reimportPreview.validRows);
    assert.equal(reimportCommit.importedCount, 0);
    assert.equal(reimportCommit.skippedDuplicates, 1);

    // Clean up created records
    deleteImportedStatements(testUserId, preview.batchId);
  });
});
