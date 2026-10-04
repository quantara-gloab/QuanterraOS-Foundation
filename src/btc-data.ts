/**
 * Reads BTC index tick data from the local store using node:sqlite.
 *
 * Used by the paper-trading cycle to get recent BRTI price history
 * for volatility estimation and model probability calculation.
 *
 * The DB here is the same quanterraos.db that the collector populates,
 * opened read-only via DatabaseSync (same approach as store.ts).
 */
import { DatabaseSync } from "node:sqlite";

export interface BtcTick {
  at: number;
  value: number;
}

/**
 * Loads recent BTC index ticks (BRTI) from the local store DB.
 *
 * @param dbPath  Path to the SQLite file (default: "quanterraos.db")
 * @param nowMs   Current timestamp in milliseconds
 * @param windowMinutes  How far back to fetch (default 60 min)
 * @returns       Sorted array of { at: epochMs, value: price } ticks
 */
export function loadRecentBtcTicks(
  dbPath: string = "quanterraos.db",
  nowMs: number,
  windowMinutes = 60,
): BtcTick[] {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const rows = db
      .prepare(
        `SELECT received_at AS at, CAST(raw_value AS REAL) AS value
         FROM btc_index_ticks
         WHERE asset = 'BTC'
           AND raw_value IS NOT NULL
           AND received_at >= ?
         ORDER BY received_at ASC`,
      )
      .all(nowMs - windowMinutes * 60_000) as unknown as BtcTick[];
    return rows.filter((r) => Number.isFinite(r.value));
  } finally {
    db.close();
  }
}

/**
 * Returns the latest BTC index price, or null if no data exists.
 */
export function getLatestBtcPrice(
  dbPath: string = "quanterraos.db",
): number | null {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const row = db
      .prepare(
        `SELECT CAST(raw_value AS REAL) AS value
         FROM btc_index_ticks
         WHERE asset = 'BTC' AND raw_value IS NOT NULL
         ORDER BY received_at DESC LIMIT 1`,
      )
      .get() as { value: number } | undefined;
    return row ? row.value : null;
  } finally {
    db.close();
  }
}
