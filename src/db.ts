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
