/**
 * Portable SQLite store using Node's built-in node:sqlite (DatabaseSync).
 *
 * One file = one company-controlled, portable record. No external service
 * or npm dependency required to read or back it up — this uses only
 * Node's built-in `node:sqlite` module (Node 22.5+). See README
 * "Founder access and recovery".
 *
 * Schema mirrors quanteraos-research-core/src/store.ts, with an added
 * `paper_trades` table for the high/low barrier paper-trading module.
 *
 * All tables use `CREATE TABLE IF NOT EXISTS` so this is safe to call
 * on every startup.
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export { DatabaseSync };

export function openDb(filePath: string): DatabaseSync {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      series_id TEXT NOT NULL,
      market TEXT NOT NULL,
      description TEXT NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      settlement_source TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      source TEXT NOT NULL,
      observed_at TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      note TEXT NOT NULL,
      value REAL
    );

    CREATE TABLE IF NOT EXISTS forecasts (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      recorded_at TEXT NOT NULL,
      probability REAL,
      abstained INTEGER NOT NULL DEFAULT 0,
      rationale TEXT NOT NULL,
      evidence_snapshot TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resolutions (
      contract_id TEXT PRIMARY KEY REFERENCES contracts(id),
      outcome TEXT NOT NULL,
      official_source TEXT NOT NULL,
      resolved_at TEXT NOT NULL,
      correction_of TEXT,
      correction_reason TEXT,
      finalized INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS resolution_history (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      outcome TEXT NOT NULL,
      official_source TEXT NOT NULL,
      resolved_at TEXT NOT NULL,
      reason TEXT,
      finalized INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS resolution_attempts (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      attempted_at TEXT NOT NULL,
      succeeded INTEGER NOT NULL,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS falcon_recommendations (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      generated_at TEXT NOT NULL,
      probability REAL,
      abstain_reason TEXT,
      basis TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'falcon-live',
      decision TEXT,
      decided_at TEXT,
      final_probability REAL,
      forecast_id TEXT
    );

    CREATE TABLE IF NOT EXISTS paper_trades (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      contract TEXT NOT NULL,
      model_probability REAL NOT NULL,
      model_source TEXT NOT NULL,
      barrier_type TEXT NOT NULL,
      side TEXT,
      decision TEXT NOT NULL,
      entry_price REAL,
      breakeven_probability REAL NOT NULL,
      edge REAL NOT NULL,
      fee_estimate REAL NOT NULL,
      rationale TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'proposed',
      resolved_at TEXT,
      outcome TEXT,
      brier_score REAL,
      pnl REAL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS paper_trades_owner_contract
      ON paper_trades (owner, contract);

    CREATE INDEX IF NOT EXISTS paper_trades_status
      ON paper_trades (status);
  `);

  return db;
}
