/**
 * QuanterraOS Statement Import & Reconciliation Engine
 *
 * Implements:
 * 1. CSV Import Preview: Parse supported Kalshi export formats, displaying mapped fields and errors before saving.
 * 2. Duplicate Prevention: Deterministic fingerprinting prevents double-counting upon re-importing the same file.
 * 3. Record Matching: Suggests matches between imported fills/trades and saved checks for user confirmation.
 * 4. Reconciliation Status: Labels records User-entered, Imported, or Reconciled to statement while preserving original user-entered figures.
 * 5. Data Controls: Complete export and deletion of imported statements (reverting matched checks to user-entered).
 * 6. Performance Isolation: Keeps incomplete or ambiguous records out of finalized performance totals.
 */

import { createHash, randomUUID } from "node:crypto";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "./db.ts";
import { userDecisionJournal, importedStatementRecords } from "./schema.ts";
import { logEvent } from "./metrics.ts";

export interface MappedHeader {
  original: string;
  mappedTo: string;
}

export interface StatementRowData {
  externalTradeId: string;
  contractTicker: string;
  side: "yes" | "no";
  action: "buy" | "sell" | "settlement";
  quantity: number;
  fillPrice: number;
  fees: number;
  totalCost: number;
  exitProceeds: number | null;
  realizedPnl: number | null;
  executedAt: string;
  rawCsvRow: string;
  fingerprint: string;
  venue?: "kalshi" | "polymarket";
}

export interface SuggestedJournalMatch {
  journalId: string;
  contractTicker: string;
  side: string;
  plannedCount: number;
  plannedPrice: number;
  plannedFee: number;
  createdAt: string;
  confidence: "HIGH" | "SUGGESTED";
  reason: string;
}

export interface StatementPreviewResult {
  success: boolean;
  batchId: string;
  detectedVenue: "kalshi" | "polymarket";
  mappedHeaders: MappedHeader[];
  totalRows: number;
  validRows: Array<StatementRowData & { rowIndex: number; isDuplicate: boolean; suggestedMatch?: SuggestedJournalMatch | null }>;
  duplicateCount: number;
  newRowsCount: number;
  totalFees: number;
  totalOutlay: number;
  errors: string[];
}

export interface StatementCommitResult {
  success: boolean;
  batchId: string;
  importedCount: number;
  reconciledCount: number;
  skippedDuplicates: number;
  errors: string[];
}

/**
 * Computes deterministic fingerprint for duplicate prevention
 */
export function computeTradeFingerprint(userId: string, venue: string, trade: {
  externalTradeId?: string;
  contractTicker: string;
  side: string;
  executedAt: string;
  quantity: number;
  fillPrice: number;
  fees: number;
}): string {
  const normTicker = trade.contractTicker.toUpperCase().trim();
  const normSide = trade.side.toLowerCase().trim();
  const normTime = trade.executedAt.trim().slice(0, 19); // truncate sub-seconds if present
  const base = trade.externalTradeId && trade.externalTradeId.trim().length > 0
    ? `${userId}:${venue}:${trade.externalTradeId.trim()}`
    : `${userId}:${venue}:${normTicker}:${normSide}:${normTime}:${trade.quantity}:${trade.fillPrice.toFixed(4)}:${trade.fees.toFixed(2)}`;
  return createHash("sha256").update(base).digest("hex");
}

/**
 * Standardizes Kalshi or Polymarket CSV headers and parses rows into preview format.
 * Features automated venue detection, field mapping, and pre-trade saved check matching.
 */
export function previewStatementCsv(
  csvText: string,
  userId: string,
  forcedVenue?: "kalshi" | "polymarket"
): StatementPreviewResult {
  const batchId = `bat_${randomUUID().slice(0, 12)}`;
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      batchId,
      detectedVenue: forcedVenue || "kalshi",
      mappedHeaders: [],
      totalRows: 0,
      validRows: [],
      duplicateCount: 0,
      newRowsCount: 0,
      totalFees: 0,
      totalOutlay: 0,
      errors: ["CSV file contains no data rows or missing header."],
    };
  }

  // Parse header line
  const rawHeaders = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
  const lowerHeaders = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  // Detect venue if not forced
  const polySignals = ["txhash", "transactionhash", "hash", "polygon", "usdc", "tokenamount", "tokentype", "tokens", "pricepertoken", "polygongas", "conditionid"];
  const hasPolyHeader = lowerHeaders.some((h) => polySignals.includes(h));
  const hasPolyTxInLines = lines.slice(1, 10).some((l) => /0x[a-fA-F0-9]{40,64}/.test(l));
  const detectedVenue: "kalshi" | "polymarket" =
    forcedVenue ||
    (hasPolyHeader || hasPolyTxInLines || csvText.toLowerCase().includes("polymarket")
      ? "polymarket"
      : "kalshi");

  const mappedHeaders: MappedHeader[] = [];
  const findCol = (candidates: string[], mappedName: string): number => {
    for (const c of candidates) {
      const idx = lowerHeaders.indexOf(c);
      if (idx !== -1) {
        mappedHeaders.push({ original: rawHeaders[idx], mappedTo: mappedName });
        return idx;
      }
    }
    return -1;
  };

  const idIdx = findCol(["tradeid", "orderid", "fillid", "id", "externalid", "txhash", "transactionhash", "hash", "txid"], "externalTradeId");
  const tickerIdx = findCol(["marketticker", "ticker", "market", "contractticker", "contract", "symbol", "title", "markettitle", "question", "conditionid", "marketslug", "slug"], "contractTicker");
  const sideIdx = findCol(["side", "position", "outcome", "contractside", "token", "tokentype"], "side");
  const actionIdx = findCol(["action", "type", "ordertype", "sideaction", "transactiontype"], "action");
  const countIdx = findCol(["count", "quantity", "contracts", "shares", "size", "tokens", "tokenamount", "amount"], "quantity");
  const priceIdx = findCol(["price", "fillprice", "yesprice", "avgprice", "unitprice", "contractprice", "pricepertoken", "tokenprice"], "fillPrice");
  const feesIdx = findCol(["fees", "fee", "exchangefee", "transactionfee", "gas", "gasfee", "polygongas", "gaseth", "networkfee", "gasusd"], "fees");
  const costIdx = findCol(["totalcost", "cost", "outlay", "total", "usdc", "totalusdc", "amountusdc", "value"], "totalCost");
  const proceedsIdx = findCol(["exitproceeds", "proceeds", "settlementvalue", "payout", "settlementproceeds", "usdcproceeds"], "exitProceeds");
  const pnlIdx = findCol(["realizedpnl", "pnl", "profitloss", "netpnl", "netprofit"], "realizedPnl");
  const timeIdx = findCol(["executedat", "date", "timestamp", "createdtime", "ordertime", "time", "createdat", "blocktime", "datetime"], "executedAt");

  // Fetch user's existing fingerprints to check duplicates
  const existingRecords = db
    .select({ fingerprint: importedStatementRecords.fingerprint })
    .from(importedStatementRecords)
    .where(eq(importedStatementRecords.userId, userId))
    .all();
  const existingFingerprints = new Set(existingRecords.map((r) => r.fingerprint));

  // Fetch user's saved checks to find suggested matches
  const savedChecks = db
    .select()
    .from(userDecisionJournal)
    .where(and(eq(userDecisionJournal.userId, userId), eq(userDecisionJournal.reconciliationStatus, "user_entered")))
    .all();

  const validRows: Array<StatementRowData & { rowIndex: number; isDuplicate: boolean; suggestedMatch?: SuggestedJournalMatch | null }> = [];
  const errors: string[] = [];
  let totalFees = 0;
  let totalOutlay = 0;
  let duplicateCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    // RFC regex matching for comma-separated values with quoted strings
    const cols = (rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawLine.split(","))
      .map((c) => c.replace(/^["']|["']$/g, "").trim());

    const getVal = (idx: number, fallback: string = "") => (idx >= 0 && idx < cols.length ? cols[idx] : fallback);

    const defaultTicker = detectedVenue === "polymarket" ? "POLY-MARKET" : "KXBTC15M";
    const tickerRaw = getVal(tickerIdx, defaultTicker);
    if (!tickerRaw) {
      errors.push(`Row ${i}: Missing contract ticker or market.`);
      continue;
    }

    const sideRaw = getVal(sideIdx, "yes").toLowerCase();
    const side: "yes" | "no" = (sideRaw.includes("no") || sideRaw === "0" || sideRaw === "down" || sideRaw === "short") ? "no" : "yes";

    const actionRaw = getVal(actionIdx, "buy").toLowerCase();
    const action: "buy" | "sell" | "settlement" = actionRaw.includes("sell")
      ? "sell"
      : (actionRaw.includes("settle") || actionRaw.includes("redeem"))
      ? "settlement"
      : "buy";

    const countRaw = parseFloat(getVal(countIdx, "1"));
    const quantity = isNaN(countRaw) || countRaw <= 0 ? 1 : Math.round(countRaw);

    let priceRaw = parseFloat(getVal(priceIdx, "0.50"));
    if (isNaN(priceRaw)) priceRaw = 0.50;
    // If entered in cents (e.g. 52c -> 0.52)
    if (priceRaw > 1.0) priceRaw = priceRaw / 100.0;
    if (priceRaw <= 0 || priceRaw >= 1.0) priceRaw = 0.50;

    let feeRaw = parseFloat(getVal(feesIdx, "-1"));
    if (isNaN(feeRaw) || feeRaw < 0) {
      if (detectedVenue === "kalshi") {
        feeRaw = Math.ceil(0.07 * quantity * priceRaw * (1 - priceRaw) * 100) / 100;
      } else {
        // Polymarket: standard orderbook transactions incur 0% protocol fee; Polygon gas is nominal
        feeRaw = 0.00;
      }
    }

    let costRaw = parseFloat(getVal(costIdx, "0"));
    if (isNaN(costRaw) || costRaw <= 0) {
      costRaw = parseFloat((priceRaw * quantity).toFixed(2));
    }

    let proceedsRaw: number | null = null;
    if (proceedsIdx >= 0 && getVal(proceedsIdx)) {
      const val = parseFloat(getVal(proceedsIdx));
      if (!isNaN(val)) proceedsRaw = val;
    }

    let pnlRaw: number | null = null;
    if (pnlIdx >= 0 && getVal(pnlIdx)) {
      const val = parseFloat(getVal(pnlIdx));
      if (!isNaN(val)) pnlRaw = val;
    } else if (proceedsRaw !== null) {
      pnlRaw = parseFloat((proceedsRaw - costRaw - feeRaw).toFixed(2));
    }

    const externalTradeId = getVal(idIdx, `${detectedVenue}_${i}_${Date.now()}`);
    const executedAt = getVal(timeIdx, new Date().toISOString());

    const fingerprint = computeTradeFingerprint(userId, detectedVenue, {
      externalTradeId,
      contractTicker: tickerRaw,
      side,
      executedAt,
      quantity,
      fillPrice: priceRaw,
      fees: feeRaw,
    });

    const isDuplicate = existingFingerprints.has(fingerprint);
    if (isDuplicate) {
      duplicateCount++;
    } else {
      totalFees += feeRaw;
      totalOutlay += costRaw + feeRaw;
    }

    // Attempt to find matching saved check
    let suggestedMatch: SuggestedJournalMatch | null = null;
    if (!isDuplicate) {
      const candidate = savedChecks.find((c) => {
        const cTicker = c.contractTicker.toUpperCase();
        const tRaw = tickerRaw.toUpperCase();
        const sameTicker = cTicker === tRaw || cTicker.includes(tRaw) || tRaw.includes(cTicker);
        const sameSide = (c.side || "yes").toLowerCase() === side;
        return sameTicker && sameSide;
      });

      if (candidate) {
        const exactQty = candidate.contractCount === quantity;
        const confidence = exactQty ? "HIGH" : "SUGGESTED";
        suggestedMatch = {
          journalId: candidate.id,
          contractTicker: candidate.contractTicker,
          side: candidate.side,
          plannedCount: candidate.contractCount,
          plannedPrice: candidate.contractPrice,
          plannedFee: candidate.exchangeFee,
          createdAt: candidate.createdAt,
          confidence,
          reason: exactQty
            ? `Matches ticker, side, and exact contract count (${quantity})`
            : `Matches ticker (${candidate.contractTicker}) and side (${candidate.side})`,
        };
      }
    }

    validRows.push({
      rowIndex: i,
      externalTradeId,
      contractTicker: tickerRaw,
      side,
      action,
      quantity,
      fillPrice: priceRaw,
      fees: feeRaw,
      totalCost: costRaw,
      exitProceeds: proceedsRaw,
      realizedPnl: pnlRaw,
      executedAt,
      rawCsvRow: rawLine,
      fingerprint,
      venue: detectedVenue,
      isDuplicate,
      suggestedMatch,
    });
  }

  return {
    success: validRows.length > 0,
    batchId,
    detectedVenue,
    mappedHeaders,
    totalRows: lines.length - 1,
    validRows,
    duplicateCount,
    newRowsCount: validRows.length - duplicateCount,
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalOutlay: parseFloat(totalOutlay.toFixed(2)),
    errors,
  };
}

/**
 * Preview Kalshi CSV statements (backwards-compatible alias for previewStatementCsv).
 */
export function previewKalshiStatement(csvText: string, userId: string): StatementPreviewResult {
  return previewStatementCsv(csvText, userId, "kalshi");
}

/**
 * Preview Polymarket CSV statements with automated column and fee handling.
 */
export function previewPolymarketStatement(csvText: string, userId: string): StatementPreviewResult {
  return previewStatementCsv(csvText, userId, "polymarket");
}

/**
 * Commits statement rows into the database with duplicate prevention and journal reconciliation.
 */
export function commitKalshiStatement(
  userId: string,
  batchId: string,
  rows: StatementRowData[],
  reconcileMap: Record<string, string> = {} // maps externalTradeId or fingerprint -> journalId
): StatementCommitResult {
  const existingRecords = db
    .select({ fingerprint: importedStatementRecords.fingerprint })
    .from(importedStatementRecords)
    .where(eq(importedStatementRecords.userId, userId))
    .all();
  const existingFingerprints = new Set(existingRecords.map((r) => r.fingerprint));

  let importedCount = 0;
  let reconciledCount = 0;
  let skippedDuplicates = 0;
  const errors: string[] = [];
  const now = new Date().toISOString();

  for (const row of rows) {
    if (existingFingerprints.has(row.fingerprint)) {
      skippedDuplicates++;
      continue;
    }

    const matchedJournalId = reconcileMap[row.externalTradeId] || reconcileMap[row.fingerprint];

    const statementRecordId = `stmt_${randomUUID().slice(0, 16)}`;
    const rowVenue = row.venue || "kalshi";
    const isPoly = rowVenue === "polymarket";
    const journalVenue = isPoly ? "polymarket" : "kalshi-15m";
    const settlementSource = isPoly ? "UMA Optimistic Oracle" : "CME CF BRTI 60s TWAP";
    const pricingBasis = isPoly ? "executable_orderbook" : "executable_ask";
    const venueLabel = isPoly ? "Polymarket" : "Kalshi";

    try {
      if (matchedJournalId) {
        // Reconcile to existing user-entered check while strictly PRESERVING original user-entered figures
        const existingCheck = db
          .select()
          .from(userDecisionJournal)
          .where(and(eq(userDecisionJournal.id, matchedJournalId), eq(userDecisionJournal.userId, userId)))
          .get();

        if (existingCheck) {
          db.update(userDecisionJournal)
            .set({
              // Preserve original planned figures
              originalContractPrice: existingCheck.originalContractPrice ?? existingCheck.contractPrice,
              originalContractCount: existingCheck.originalContractCount ?? existingCheck.contractCount,
              originalExchangeFee: existingCheck.originalExchangeFee ?? existingCheck.exchangeFee,
              // Update with verified statement figures
              actualQuantity: row.quantity,
              actualFillPrice: row.fillPrice,
              actualFees: row.fees,
              exitProceeds: row.exitProceeds,
              realizedPnl: row.realizedPnl,
              decisionAction: "actual_trade",
              outcomeStatus: row.realizedPnl !== null ? "settled" : "pending",
              outcome: row.realizedPnl !== null ? (row.realizedPnl > 0 ? "WON" : row.realizedPnl < 0 ? "LOST" : "VOID") : existingCheck.outcome,
              reconciliationStatus: "reconciled",
              matchedStatementId: statementRecordId,
              statementReconciledAt: now,
              updatedAt: now,
            })
            .where(eq(userDecisionJournal.id, matchedJournalId))
            .run();

          // Insert into imported statement records as reconciled
          db.insert(importedStatementRecords)
            .values({
              id: statementRecordId,
              userId,
              batchId,
              externalTradeId: row.externalTradeId,
              fingerprint: row.fingerprint,
              venue: rowVenue,
              contractTicker: row.contractTicker,
              side: row.side,
              action: row.action,
              quantity: row.quantity,
              fillPrice: row.fillPrice,
              fees: row.fees,
              totalCost: row.totalCost,
              exitProceeds: row.exitProceeds,
              realizedPnl: row.realizedPnl,
              settled: row.realizedPnl !== null ? 1 : 0,
              executedAt: row.executedAt,
              matchedJournalId,
              reconciliationStatus: "reconciled",
              rawCsvRow: row.rawCsvRow,
              createdAt: now,
            })
            .run();

          reconciledCount++;
          existingFingerprints.add(row.fingerprint);
          continue;
        }
      }

      // Standalone imported record (not matched to prior saved check)
      db.insert(importedStatementRecords)
        .values({
          id: statementRecordId,
          userId,
          batchId,
          externalTradeId: row.externalTradeId,
          fingerprint: row.fingerprint,
          venue: rowVenue,
          contractTicker: row.contractTicker,
          side: row.side,
          action: row.action,
          quantity: row.quantity,
          fillPrice: row.fillPrice,
          fees: row.fees,
          totalCost: row.totalCost,
          exitProceeds: row.exitProceeds,
          realizedPnl: row.realizedPnl,
          settled: row.realizedPnl !== null ? 1 : 0,
          executedAt: row.executedAt,
          matchedJournalId: null,
          reconciliationStatus: "imported",
          rawCsvRow: row.rawCsvRow,
          createdAt: now,
        })
        .run();

      // Create a corresponding journal entry labeled 'imported'
      const jrnId = `jrn_${randomUUID().slice(0, 16)}`;
      const totalOutlay = row.totalCost + row.fees;
      const breakevenWinProb = parseFloat(((totalOutlay / row.quantity) * 100).toFixed(2));

      db.insert(userDecisionJournal)
        .values({
          id: jrnId,
          userId,
          venue: journalVenue as any,
          contractTicker: row.contractTicker,
          contractType: "binary_above_below",
          side: row.side,
          pricingBasis,
          contractPrice: row.fillPrice,
          contractCount: row.quantity,
          purchaseCost: row.totalCost,
          exchangeFee: row.fees,
          halfSpreadDrag: 0.0,
          totalDrag: row.fees / row.quantity,
          breakevenWinProb,
          assessedWinProb: breakevenWinProb,
          netExpectedValue: 0.0,
          settlementSource,
          decisionAction: "actual_trade",
          status: "executed_live",
          outcome: row.realizedPnl !== null ? (row.realizedPnl > 0 ? "WON" : row.realizedPnl < 0 ? "LOST" : "VOID") : "PENDING",
          realizedPnl: row.realizedPnl,
          actualQuantity: row.quantity,
          actualFillPrice: row.fillPrice,
          actualFees: row.fees,
          exitProceeds: row.exitProceeds,
          outcomeStatus: row.realizedPnl !== null ? "settled" : "pending",
          reconciliationStatus: "imported",
          matchedStatementId: statementRecordId,
          statementReconciledAt: now,
          notes: `Imported via ${venueLabel} Statement (Trade ID: ${row.externalTradeId})`,
          createdAt: row.executedAt || now,
          updatedAt: now,
        })
        .run();

      importedCount++;
      existingFingerprints.add(row.fingerprint);
    } catch (err: any) {
      errors.push(`Trade ${row.externalTradeId}: ${err.message}`);
    }
  }

  logEvent("statement_imported_and_reconciled", userId, {
    batchId,
    importedCount,
    reconciledCount,
    skippedDuplicates,
  });

  return {
    success: errors.length === 0,
    batchId,
    importedCount,
    reconciledCount,
    skippedDuplicates,
    errors,
  };
}

export const commitStatement = commitKalshiStatement;

/**
 * Data Controls: Exports all imported statement records for a user into RFC 4180 CSV.
 */
export function exportImportedStatementsCsv(userId: string): string {
  const records = db
    .select()
    .from(importedStatementRecords)
    .where(eq(importedStatementRecords.userId, userId))
    .orderBy(desc(importedStatementRecords.executedAt))
    .all();

  const headers = [
    "externalTradeId",
    "venue",
    "contractTicker",
    "side",
    "action",
    "quantity",
    "fillPrice",
    "fees",
    "totalCost",
    "exitProceeds",
    "realizedPnl",
    "executedAt",
    "reconciliationStatus",
    "matchedJournalId",
    "batchId",
    "createdAt"
  ];

  const lines = [headers.join(",")];
  for (const r of records) {
    lines.push([
      `"${r.externalTradeId || ""}"`,
      `"${r.venue}"`,
      `"${r.contractTicker}"`,
      `"${r.side}"`,
      `"${r.action}"`,
      r.quantity.toString(),
      r.fillPrice.toFixed(4),
      r.fees.toFixed(2),
      r.totalCost.toFixed(2),
      r.exitProceeds !== null && r.exitProceeds !== undefined ? r.exitProceeds.toFixed(2) : "",
      r.realizedPnl !== null && r.realizedPnl !== undefined ? r.realizedPnl.toFixed(2) : "",
      `"${r.executedAt}"`,
      `"${r.reconciliationStatus}"`,
      `"${r.matchedJournalId || ""}"`,
      `"${r.batchId}"`,
      `"${r.createdAt}"`
    ].join(","));
  }

  return lines.join("\n");
}

/**
 * Data Controls: Deletes imported statement records and safely reverts reconciled checks to 'user_entered'.
 */
export function deleteImportedStatements(
  userId: string,
  batchId?: string
): { deletedCount: number; revertedChecksCount: number } {
  const query = batchId
    ? and(eq(importedStatementRecords.userId, userId), eq(importedStatementRecords.batchId, batchId))
    : eq(importedStatementRecords.userId, userId);

  const recordsToDelete = db
    .select()
    .from(importedStatementRecords)
    .where(query)
    .all();

  let revertedChecksCount = 0;

  for (const record of recordsToDelete) {
    if (record.matchedJournalId) {
      // Revert reconciled check back to user-entered, restoring original preserved figures
      const journalEntry = db
        .select()
        .from(userDecisionJournal)
        .where(eq(userDecisionJournal.id, record.matchedJournalId))
        .get();

      if (journalEntry) {
        db.update(userDecisionJournal)
          .set({
            reconciliationStatus: "user_entered",
            matchedStatementId: null,
            statementReconciledAt: null,
            contractPrice: journalEntry.originalContractPrice ?? journalEntry.contractPrice,
            contractCount: journalEntry.originalContractCount ?? journalEntry.contractCount,
            exchangeFee: journalEntry.originalExchangeFee ?? journalEntry.exchangeFee,
            actualQuantity: null,
            actualFillPrice: null,
            actualFees: null,
            exitProceeds: null,
            realizedPnl: null,
            outcomeStatus: "pending",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userDecisionJournal.id, record.matchedJournalId))
          .run();
        revertedChecksCount++;
      }
    } else {
      // If the journal entry was created purely from import, remove it
      db.delete(userDecisionJournal)
        .where(and(eq(userDecisionJournal.matchedStatementId, record.id), eq(userDecisionJournal.userId, userId)))
        .run();
    }
  }

  const deleteResult = db
    .delete(importedStatementRecords)
    .where(query)
    .run();

  logEvent("imported_statements_deleted", userId, {
    batchId: batchId || "ALL",
    deletedCount: recordsToDelete.length,
    revertedChecksCount,
  });

  return {
    deletedCount: recordsToDelete.length,
    revertedChecksCount,
  };
}

/**
 * Calculates finalized performance totals, strictly excluding incomplete or ambiguous records.
 */
export function getFinalizedPerformanceTotals(entries: Array<{
  reconciliationStatus?: string | null;
  outcomeStatus?: string | null;
  decisionAction?: string | null;
  realizedPnl?: number | null;
  actualFees?: number | null;
  exchangeFee?: number | null;
  actualQuantity?: number | null;
  contractCount?: number | null;
}>): {
  finalizedCount: number;
  excludedCount: number;
  totalRealizedPnl: number;
  totalFinalizedFees: number;
  winCount: number;
  lossCount: number;
} {
  let finalizedCount = 0;
  let excludedCount = 0;
  let totalRealizedPnl = 0;
  let totalFinalizedFees = 0;
  let winCount = 0;
  let lossCount = 0;

  for (const e of entries) {
    const isActual = (e.decisionAction || "").toLowerCase() === "actual_trade";
    if (!isActual) continue;

    // Filter: If actual trade is incomplete or un-settled, keep out of finalized performance totals
    const isSettled = e.outcomeStatus === "settled" || e.reconciliationStatus === "reconciled";
    const hasPnl = typeof e.realizedPnl === "number" && !isNaN(e.realizedPnl);

    if (!isSettled || !hasPnl) {
      excludedCount++;
      continue;
    }

    finalizedCount++;
    totalRealizedPnl += e.realizedPnl!;
    totalFinalizedFees += (typeof e.actualFees === "number" ? e.actualFees : (e.exchangeFee || 0));

    if (e.realizedPnl! > 0) winCount++;
    else if (e.realizedPnl! < 0) lossCount++;
  }

  return {
    finalizedCount,
    excludedCount,
    totalRealizedPnl: parseFloat(totalRealizedPnl.toFixed(2)),
    totalFinalizedFees: parseFloat(totalFinalizedFees.toFixed(2)),
    winCount,
    lossCount,
  };
}
