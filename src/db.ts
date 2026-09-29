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
  ]) {
    const migrationPath = path.join(migrationsDir, migration);
    if (migration === "0006_multi_asset.sql") {
      for (const table of ["btc_index_ticks", "exchange_prices", "market_outcomes"]) {
        const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
        if (!columns.some((column) => column.name === "asset")) {
          sqlite.exec(`ALTER TABLE ${table} ADD COLUMN asset text NOT NULL DEFAULT 'BTC'`);
        }
      }
      sqlite.exec(readFileSync(migrationPath, "utf-8").split(/ALTER TABLE[^;]+;/).slice(-1)[0]);
      continue;
    }
    sqlite.exec(readFileSync(migrationPath, "utf-8"));
  }
}

export function closeDb(): void {
  sqlite.close();
}
