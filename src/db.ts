/**
 * Real database connection for local development.
 *
 * Uses better-sqlite3 — a single file on your computer, no server to
 * run or pay for. This is the right choice for one founder building
 * an MVP; when you have real concurrent users you'll likely migrate
 * to a hosted Postgres (the README's "suggested build order" flags
 * this), but that's a later problem, not a now problem.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as schema from "./schema.ts";

const dbPath = process.env.DB_PATH ?? "quanterraos.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

/** Runs the SQL migration file directly against the open connection.
 * Safe to call every startup — every statement uses IF NOT EXISTS. */
export function runMigrations(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.join(here, "..", "migrations");
  for (const migration of [
    "0001_foundation.sql",
    "0002_research_resolutions.sql",
    "0003_btc_index_ticks.sql",
    "0004_exchange_prices.sql",
    "0005_market_outcomes.sql",
    "0006_multi_asset.sql",
    "0007_orderbook_snapshots.sql",
    "0008_falcon_recommendations.sql",
    "0009_dashboard_query_indexes.sql",
    "0010_paper_trades.sql",
    "0011_council_pipeline.sql",
    "0012_council_chat_log.sql",
    "0013_prediction_ledger.sql",
    "0014_user_accounts_and_billing.sql",
    "0015_events_and_metrics.sql",
    "0016_subscriber_wallets.sql",
    "0017_gtm_agents_and_pipeline.sql",
    "0018_sms_marketing_and_compliance.sql",
    "0019_autonomous_learning.sql",
    "0020_decision_journal.sql",
    "0021_pilot_observation_sessions.sql",
    "0022_user_risk_plans.sql",
    "0023_journal_details_and_feedback.sql",
    "0024_outcome_tracking_and_booking.sql",
    "0025_statement_import_and_reconciliation.sql",
    "0026_beta_attribution_support_and_drills.sql",
    "0027_risk_plan_advisory_controls.sql",
    "0028_predictions_checkpoint_minute.sql",
    "0029_flight_receipts_and_crew_pass.sql",
  ]) {
    const migrationPath = path.join(migrationsDir, migration);
    if (migration === "0006_multi_asset.sql") {
      for (const table of [
        "btc_index_ticks",
        "exchange_prices",
        "market_outcomes",
      ]) {
        const columns = sqlite
          .prepare(`PRAGMA table_info(${table})`)
          .all() as Array<{ name: string }>;
        if (!columns.some((column) => column.name === "asset")) {
          sqlite.exec(
            `ALTER TABLE ${table} ADD COLUMN asset text NOT NULL DEFAULT 'BTC'`,
          );
        }
      }
      sqlite.exec(
        readFileSync(migrationPath, "utf-8")
          .split(/ALTER TABLE[^;]+;/)
          .slice(-1)[0],
      );
      continue;
    }
    if (migration === "0018_sms_marketing_and_compliance.sql") {
      const userCols = sqlite.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
      if (!userCols.some((col) => col.name === "phone")) {
        sqlite.exec("ALTER TABLE users ADD COLUMN phone text");
      }
    }
    if (migration === "0023_journal_details_and_feedback.sql") {
      const journalCols = sqlite.prepare("PRAGMA table_info(user_decision_journal)").all() as Array<{ name: string }>;
      if (!journalCols.some((col) => col.name === "decision_action")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN decision_action TEXT NOT NULL DEFAULT 'paper_trade'");
      }
      if (!journalCols.some((col) => col.name === "reasoning")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN reasoning TEXT");
      }
      if (!journalCols.some((col) => col.name === "is_example")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN is_example INTEGER NOT NULL DEFAULT 0");
      }
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS beta_feedback (
          id TEXT PRIMARY KEY,
          page TEXT NOT NULL,
          app_version TEXT NOT NULL DEFAULT '0.1.0-pilot',
          category TEXT NOT NULL,
          comment TEXT NOT NULL,
          device_info TEXT,
          contact_email TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS beta_feedback_created_at_idx ON beta_feedback (created_at);
      `);
      continue;
    }
    if (migration === "0024_outcome_tracking_and_booking.sql") {
      const journalCols = sqlite.prepare("PRAGMA table_info(user_decision_journal)").all() as Array<{ name: string }>;
      if (!journalCols.some((col) => col.name === "actual_quantity")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN actual_quantity INTEGER");
      }
      if (!journalCols.some((col) => col.name === "actual_fill_price")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN actual_fill_price REAL");
      }
      if (!journalCols.some((col) => col.name === "actual_fees")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN actual_fees REAL");
      }
      if (!journalCols.some((col) => col.name === "exit_proceeds")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN exit_proceeds REAL");
      }
      if (!journalCols.some((col) => col.name === "outcome_status")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN outcome_status TEXT DEFAULT 'pending'");
      }
      if (!journalCols.some((col) => col.name === "outcome_notes")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN outcome_notes TEXT");
      }
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS pilot_booking_requests (
          id TEXT PRIMARY KEY,
          contact TEXT NOT NULL,
          device_type TEXT NOT NULL,
          availability TEXT NOT NULL,
          consent_given INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'INTERESTED',
          scheduled_at TEXT,
          operator_notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS pilot_booking_status_idx ON pilot_booking_requests (status);
        CREATE INDEX IF NOT EXISTS pilot_booking_created_at_idx ON pilot_booking_requests (created_at);
      `);
      continue;
    }
    if (migration === "0025_statement_import_and_reconciliation.sql") {
      const journalCols = sqlite.prepare("PRAGMA table_info(user_decision_journal)").all() as Array<{ name: string }>;
      if (!journalCols.some((col) => col.name === "reconciliation_status")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN reconciliation_status TEXT DEFAULT 'user_entered'");
      }
      if (!journalCols.some((col) => col.name === "matched_statement_id")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN matched_statement_id TEXT");
      }
      if (!journalCols.some((col) => col.name === "statement_reconciled_at")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN statement_reconciled_at TEXT");
      }
      if (!journalCols.some((col) => col.name === "original_contract_price")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN original_contract_price REAL");
      }
      if (!journalCols.some((col) => col.name === "original_contract_count")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN original_contract_count INTEGER");
      }
      if (!journalCols.some((col) => col.name === "original_exchange_fee")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN original_exchange_fee REAL");
      }
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS imported_statement_records (
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
        CREATE INDEX IF NOT EXISTS imported_stmt_user_id_idx ON imported_statement_records (user_id);
        CREATE INDEX IF NOT EXISTS imported_stmt_fingerprint_idx ON imported_statement_records (fingerprint);
        CREATE INDEX IF NOT EXISTS imported_stmt_batch_id_idx ON imported_statement_records (batch_id);
        CREATE INDEX IF NOT EXISTS imported_stmt_matched_journal_idx ON imported_statement_records (matched_journal_id);
      `);
      continue;
    }
    if (migration === "0027_risk_plan_advisory_controls.sql") {
      const rpCols = sqlite.prepare("PRAGMA table_info(user_risk_plans)").all() as Array<{ name: string }>;
      if (!rpCols.some((col) => col.name === "max_contracts_per_trade")) {
        sqlite.exec("ALTER TABLE user_risk_plans ADD COLUMN max_contracts_per_trade INTEGER NOT NULL DEFAULT 50");
      }
      if (!rpCols.some((col) => col.name === "review_reminder")) {
        sqlite.exec("ALTER TABLE user_risk_plans ADD COLUMN review_reminder TEXT NOT NULL DEFAULT 'settlement'");
      }
      if (!rpCols.some((col) => col.name === "cooling_off_minutes")) {
        sqlite.exec("ALTER TABLE user_risk_plans ADD COLUMN cooling_off_minutes INTEGER NOT NULL DEFAULT 15");
      }
      const journalCols = sqlite.prepare("PRAGMA table_info(user_decision_journal)").all() as Array<{ name: string }>;
      if (!journalCols.some((col) => col.name === "cooling_off_until")) {
        sqlite.exec("ALTER TABLE user_decision_journal ADD COLUMN cooling_off_until TEXT");
      }
      continue;
    }
    if (migration === "0028_predictions_checkpoint_minute.sql") {
      const predCols = sqlite.prepare("PRAGMA table_info(predictions)").all() as Array<{ name: string }>;
      if (!predCols.some((col) => col.name === "checkpoint_minute")) {
        sqlite.exec("ALTER TABLE predictions ADD COLUMN checkpoint_minute INTEGER");
      }
      sqlite.exec("CREATE INDEX IF NOT EXISTS predictions_market_checkpoint_idx ON predictions(market_id, checkpoint_minute)");
      continue;
    }
    sqlite.exec(readFileSync(migrationPath, "utf-8"));
  }
}

/**
 * Auto-initialization guard:
 * If the database connection connects to a newly created / empty SQLite file (e.g. during isolated
 * tests or a fresh cold-start container), automatically apply migrations so schema tables exist.
 */
try {
  if (!sqlite.readonly) {
    runMigrations();
  }
} catch (err: any) {
  const isReadOnly =
    sqlite.readonly ||
    err?.code === "SQLITE_READONLY" ||
    err?.code === "SQLITE_READONLY_RECOVERY" ||
    /readonly/i.test(err?.message ?? "");

  if (isReadOnly) {
    // Expected in read-only operational modes — skip migration execution
  } else {
    // Genuine corruption, disk/IO failure, or permission failure: rethrow to fail fast
    console.error("[db] Critical database initialization failure:", err);
    throw err;
  }
}

export function closeDb(): void {
  sqlite.close();
}
