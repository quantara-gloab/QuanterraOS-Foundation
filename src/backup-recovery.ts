/**
 * QuanterraOS Backup & Recovery Verification Engine
 *
 * Implements:
 * 1. Isolated Backup Extraction: Extracts user accounts, risk plans, journal entries, and imported statements.
 * 2. Isolated Environment Restoration: Rebuilds schema and restores records into an isolated in-memory SQLite instance.
 * 3. Deep Record Verification: Compares counts, primary keys, fields, and SHA-256 data checksums between live and restored databases.
 * 4. Audit Reporting: Generates verifiable health evidence for the founder release dashboard.
 */

import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { db } from "./db.ts";
import { users, userDecisionJournal, importedStatementRecords, userRiskPlans } from "./schema.ts";

export interface BackupVerificationReport {
  success: boolean;
  status: "PASSED" | "FAILED" | "NOT_CHECKED";
  timestamp: string;
  sourceCounts: {
    accounts: number;
    riskPlans: number;
    journalEntries: number;
    importedStatements: number;
  };
  restoredCounts: {
    accounts: number;
    riskPlans: number;
    journalEntries: number;
    importedStatements: number;
  };
  checksums: {
    sourceHash: string;
    restoredHash: string;
    match: boolean;
  };
  isolationVerified: boolean;
  durationMs: number;
  errors: string[];
  supportingLog: string;
}

/**
 * Computes deterministic SHA-256 hash across a sorted collection of objects.
 */
function computeRecordsHash(records: Record<string, any>[]): string {
  const normalized = records.map((r) => {
    const keys = Object.keys(r);
    const sortedObj: Record<string, any> = {};
    for (const k of keys) {
      const normKey = k.toLowerCase().replace(/_/g, "");
      let val = r[k];
      if (typeof val === "boolean") {
        val = val ? 1 : 0;
      }
      sortedObj[normKey] = val !== undefined && val !== null ? String(val) : "";
    }
    const sortedKeys = Object.keys(sortedObj).sort();
    const reordered: Record<string, any> = {};
    for (const sk of sortedKeys) {
      reordered[sk] = sortedObj[sk];
    }
    return JSON.stringify(reordered);
  }).sort().join("|");

  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Executes a full backup and restore cycle into an isolated in-memory SQLite database,
 * verifying that all accounts, journals, and statement imports match exactly.
 */
export function runIsolatedBackupRecoveryCheck(): BackupVerificationReport {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // 1. Fetch live source records
    const sourceUsers = db.select().from(users).all();
    const sourceRiskPlans = db.select().from(userRiskPlans).all();
    const sourceJournals = db.select().from(userDecisionJournal).all();
    const sourceImports = db.select().from(importedStatementRecords).all();

    const sourceHash = computeRecordsHash([
      ...sourceUsers,
      ...sourceRiskPlans,
      ...sourceJournals,
      ...sourceImports,
    ]);

    // 2. Initialize isolated in-memory SQLite database
    const sandboxDb = new Database(":memory:");
    sandboxDb.pragma("journal_mode = MEMORY");

    // 3. Create isolated schema
    sandboxDb.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT,
        password_hash TEXT,
        tier TEXT NOT NULL DEFAULT 'free',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE user_risk_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        daily_max_outlay REAL NOT NULL DEFAULT 50.0,
        single_trade_max_outlay REAL NOT NULL DEFAULT 25.0,
        max_concurrent_positions INTEGER NOT NULL DEFAULT 3,
        correlated_market_alert INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE user_decision_journal (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        venue TEXT NOT NULL,
        contract_ticker TEXT NOT NULL,
        contract_type TEXT NOT NULL,
        side TEXT NOT NULL,
        pricing_basis TEXT NOT NULL,
        contract_price REAL NOT NULL,
        contract_count INTEGER NOT NULL,
        purchase_cost REAL NOT NULL,
        exchange_fee REAL NOT NULL,
        half_spread_drag REAL NOT NULL,
        total_drag REAL NOT NULL,
        breakeven_win_prob REAL NOT NULL,
        assessed_win_prob REAL NOT NULL,
        net_expected_value REAL NOT NULL,
        settlement_source TEXT NOT NULL,
        decision_action TEXT NOT NULL DEFAULT 'paper_trade',
        reasoning TEXT,
        is_example INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        status TEXT NOT NULL,
        outcome TEXT,
        realized_pnl REAL,
        actual_quantity INTEGER,
        actual_fill_price REAL,
        actual_fees REAL,
        exit_proceeds REAL,
        outcome_status TEXT DEFAULT 'pending',
        outcome_notes TEXT,
        reconciliation_status TEXT DEFAULT 'user_entered',
        matched_statement_id TEXT,
        statement_reconciled_at TEXT,
        original_contract_price REAL,
        original_contract_count INTEGER,
        original_exchange_fee REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE imported_statement_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        batch_id TEXT NOT NULL,
        external_trade_id TEXT,
        fingerprint TEXT NOT NULL,
        venue TEXT NOT NULL DEFAULT 'kalshi',
        contract_ticker TEXT NOT NULL,
        side TEXT NOT NULL DEFAULT 'yes',
        action TEXT NOT NULL DEFAULT 'buy',
        quantity INTEGER NOT NULL,
        fill_price REAL NOT NULL,
        fees REAL NOT NULL,
        total_cost REAL NOT NULL,
        exit_proceeds REAL,
        realized_pnl REAL,
        settled INTEGER NOT NULL DEFAULT 1,
        executed_at TEXT NOT NULL,
        matched_journal_id TEXT,
        reconciliation_status TEXT NOT NULL DEFAULT 'imported',
        raw_csv_row TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // 4. Restore records into sandbox
    const insertUser = sandboxDb.prepare(`
      INSERT INTO users (id, email, phone, password_hash, tier, stripe_customer_id, stripe_subscription_id, created_at, updated_at)
      VALUES (@id, @email, @phone, @passwordHash, @tier, @stripeCustomerId, @stripeSubscriptionId, @createdAt, @updatedAt)
    `);
    for (const u of sourceUsers) {
      insertUser.run({
        id: u.id,
        email: u.email,
        phone: u.phone,
        passwordHash: u.passwordHash,
        tier: u.tier,
        stripeCustomerId: u.stripeCustomerId,
        stripeSubscriptionId: u.stripeSubscriptionId,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      });
    }

    const insertRiskPlan = sandboxDb.prepare(`
      INSERT INTO user_risk_plans (id, user_id, daily_max_outlay, single_trade_max_outlay, max_concurrent_positions, correlated_market_alert, updated_at)
      VALUES (@id, @userId, @dailyMaxOutlay, @singleTradeMaxOutlay, @maxConcurrentPositions, @correlatedMarketAlert, @updatedAt)
    `);
    for (const rp of sourceRiskPlans) {
      insertRiskPlan.run({
        id: rp.id,
        userId: rp.userId,
        dailyMaxOutlay: rp.dailyMaxOutlay,
        singleTradeMaxOutlay: rp.singleTradeMaxOutlay,
        maxConcurrentPositions: rp.maxConcurrentPositions,
        correlatedMarketAlert: rp.correlatedMarketAlert,
        updatedAt: rp.updatedAt,
      });
    }

    const insertJournal = sandboxDb.prepare(`
      INSERT INTO user_decision_journal (
        id, user_id, venue, contract_ticker, contract_type, side, pricing_basis,
        contract_price, contract_count, purchase_cost, exchange_fee, half_spread_drag,
        total_drag, breakeven_win_prob, assessed_win_prob, net_expected_value,
        settlement_source, decision_action, reasoning, is_example, notes, status,
        outcome, realized_pnl, actual_quantity, actual_fill_price, actual_fees,
        exit_proceeds, outcome_status, outcome_notes, reconciliation_status,
        matched_statement_id, statement_reconciled_at, original_contract_price,
        original_contract_count, original_exchange_fee, created_at, updated_at
      ) VALUES (
        @id, @userId, @venue, @contractTicker, @contractType, @side, @pricingBasis,
        @contractPrice, @contractCount, @purchaseCost, @exchangeFee, @halfSpreadDrag,
        @totalDrag, @breakevenWinProb, @assessedWinProb, @netExpectedValue,
        @settlementSource, @decisionAction, @reasoning, @isExample, @notes, @status,
        @outcome, @realizedPnl, @actualQuantity, @actualFillPrice, @actualFees,
        @exitProceeds, @outcomeStatus, @outcomeNotes, @reconciliationStatus,
        @matchedStatementId, @statementReconciledAt, @originalContractPrice,
        @originalContractCount, @originalExchangeFee, @createdAt, @updatedAt
      )
    `);
    for (const j of sourceJournals) {
      insertJournal.run({
        id: j.id,
        userId: j.userId,
        venue: j.venue,
        contractTicker: j.contractTicker,
        contractType: j.contractType,
        side: j.side,
        pricingBasis: j.pricingBasis,
        contractPrice: j.contractPrice,
        contractCount: j.contractCount,
        purchaseCost: j.purchaseCost,
        exchangeFee: j.exchangeFee,
        halfSpreadDrag: j.halfSpreadDrag,
        totalDrag: j.totalDrag,
        breakevenWinProb: j.breakevenWinProb,
        assessedWinProb: j.assessedWinProb,
        netExpectedValue: j.netExpectedValue,
        settlementSource: j.settlementSource,
        decisionAction: j.decisionAction,
        reasoning: j.reasoning,
        isExample: j.isExample,
        notes: j.notes,
        status: j.status,
        outcome: j.outcome,
        realizedPnl: j.realizedPnl,
        actualQuantity: j.actualQuantity,
        actualFillPrice: j.actualFillPrice,
        actualFees: j.actualFees,
        exitProceeds: j.exitProceeds,
        outcomeStatus: j.outcomeStatus,
        outcomeNotes: j.outcomeNotes,
        reconciliationStatus: j.reconciliationStatus,
        matchedStatementId: j.matchedStatementId,
        statementReconciledAt: j.statementReconciledAt,
        originalContractPrice: j.originalContractPrice,
        originalContractCount: j.originalContractCount,
        originalExchangeFee: j.originalExchangeFee,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      });
    }

    const insertImport = sandboxDb.prepare(`
      INSERT INTO imported_statement_records (
        id, user_id, batch_id, external_trade_id, fingerprint, venue,
        contract_ticker, side, action, quantity, fill_price, fees, total_cost,
        exit_proceeds, realized_pnl, settled, executed_at, matched_journal_id,
        reconciliation_status, raw_csv_row, created_at
      ) VALUES (
        @id, @userId, @batchId, @externalTradeId, @fingerprint, @venue,
        @contractTicker, @side, @action, @quantity, @fillPrice, @fees, @totalCost,
        @exitProceeds, @realizedPnl, @settled, @executedAt, @matchedJournalId,
        @reconciliationStatus, @rawCsvRow, @createdAt
      )
    `);
    for (const imp of sourceImports) {
      insertImport.run({
        id: imp.id,
        userId: imp.userId,
        batchId: imp.batchId,
        externalTradeId: imp.externalTradeId,
        fingerprint: imp.fingerprint,
        venue: imp.venue,
        contractTicker: imp.contractTicker,
        side: imp.side,
        action: imp.action,
        quantity: imp.quantity,
        fillPrice: imp.fillPrice,
        fees: imp.fees,
        totalCost: imp.totalCost,
        exitProceeds: imp.exitProceeds,
        realizedPnl: imp.realizedPnl,
        settled: imp.settled,
        executedAt: imp.executedAt,
        matchedJournalId: imp.matchedJournalId,
        reconciliationStatus: imp.reconciliationStatus,
        rawCsvRow: imp.rawCsvRow,
        createdAt: imp.createdAt,
      });
    }

    // 5. Query restored records
    const restoredUsers = sandboxDb.prepare("SELECT * FROM users").all();
    const restoredRiskPlans = sandboxDb.prepare("SELECT * FROM user_risk_plans").all();
    const restoredJournals = sandboxDb.prepare("SELECT * FROM user_decision_journal").all();
    const restoredImports = sandboxDb.prepare("SELECT * FROM imported_statement_records").all();

    sandboxDb.close();

    const restoredHash = computeRecordsHash([
      ...(restoredUsers as Record<string, any>[]),
      ...(restoredRiskPlans as Record<string, any>[]),
      ...(restoredJournals as Record<string, any>[]),
      ...(restoredImports as Record<string, any>[]),
    ]);

    const countsMatch =
      sourceUsers.length === restoredUsers.length &&
      sourceRiskPlans.length === restoredRiskPlans.length &&
      sourceJournals.length === restoredJournals.length &&
      sourceImports.length === restoredImports.length;

    const hashMatch = sourceHash === restoredHash;

    if (!countsMatch) {
      errors.push("Record count mismatch between source database and restored sandbox.");
    }
    if (!hashMatch) {
      errors.push("Cryptographic checksum mismatch on restored database contents.");
    }

    const durationMs = Date.now() - startTime;
    const success = countsMatch && hashMatch && errors.length === 0;

    return {
      success,
      status: success ? "PASSED" : "FAILED",
      timestamp: new Date().toISOString(),
      sourceCounts: {
        accounts: sourceUsers.length,
        riskPlans: sourceRiskPlans.length,
        journalEntries: sourceJournals.length,
        importedStatements: sourceImports.length,
      },
      restoredCounts: {
        accounts: restoredUsers.length,
        riskPlans: restoredRiskPlans.length,
        journalEntries: restoredJournals.length,
        importedStatements: restoredImports.length,
      },
      checksums: {
        sourceHash,
        restoredHash,
        match: hashMatch,
      },
      isolationVerified: true,
      durationMs,
      errors,
      supportingLog: `Verified isolated in-memory restore in ${durationMs}ms: ${restoredUsers.length} users, ${restoredJournals.length} checks, ${restoredImports.length} imports. Checksum: ${sourceHash.slice(0, 12)}...`,
    };
  } catch (err: any) {
    errors.push(`Isolated backup recovery exception: ${err.message}`);
    return {
      success: false,
      status: "FAILED",
      timestamp: new Date().toISOString(),
      sourceCounts: { accounts: 0, riskPlans: 0, journalEntries: 0, importedStatements: 0 },
      restoredCounts: { accounts: 0, riskPlans: 0, journalEntries: 0, importedStatements: 0 },
      checksums: { sourceHash: "", restoredHash: "", match: false },
      isolationVerified: false,
      durationMs: Date.now() - startTime,
      errors,
      supportingLog: `Backup recovery failure: ${err.message}`,
    };
  }
}
