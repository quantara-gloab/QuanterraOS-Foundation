/**
 * Swing Event Logger (Quantum Fox / Sentinel Research)
 *
 * Watches Kalshi 15m BTC price quotes for sudden moves exceeding a configurable
 * threshold (default: ±8 percentage points in yes-price within a 5-minute window).
 *
 * On each detected swing, logs:
 *   - ticker
 *   - trigger_time (ISO string)
 *   - minutes_left (minutes left in market at trigger)
 *   - price_before
 *   - price_after
 *   - spot_price (BRTI from btc_index_ticks, falling back to Coinbase spot)
 *   - settlement_outcome (eventual settlement outcome once market closes, or null if open)
 *
 * Appends each event as a row to data/swing-events.csv with schema:
 *   ticker,trigger_time,minutes_left,price_before,price_after,spot_price,settlement_outcome
 *
 * Designed to run continuously as a background service or callable via functions.
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export interface SwingEvent {
  ticker: string;
  trigger_time: string;
  minutes_left: number;
  price_before: number;
  price_after: number;
  spot_price: number | null;
  settlement_outcome: string | null;
}

export interface SwingDetectionOptions {
  threshold?: number; // default: 0.08 (8 percentage points)
  windowMs?: number; // default: 5 * 60 * 1000 (5 minutes)
  cooldownMs?: number; // default: 2 * 60 * 1000 (2 minutes per ticker)
  csvPath?: string;
  dbPath?: string;
}

const DEFAULT_CSV_PATH = path.resolve("data/swing-events.csv");
const DEFAULT_DB_PATH = path.resolve("quanterraos.db");
const CSV_HEADER = "ticker,trigger_time,minutes_left,price_before,price_after,spot_price,settlement_outcome";

/**
 * Parse an existing swing-events.csv into SwingEvent objects.
 */
export function readSwingEventsCsv(csvPath: string = DEFAULT_CSV_PATH): SwingEvent[] {
  if (!fs.existsSync(csvPath)) return [];
  const content = fs.readFileSync(csvPath, "utf8").trim();
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  if (lines.length <= 1) return [];

  const events: SwingEvent[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 7) continue;

    const [ticker, trigger_time, minutes_left, price_before, price_after, spot_price, settlement_outcome] = parts;
    events.push({
      ticker: ticker.trim(),
      trigger_time: trigger_time.trim(),
      minutes_left: Number.parseFloat(minutes_left),
      price_before: Number.parseFloat(price_before),
      price_after: Number.parseFloat(price_after),
      spot_price: spot_price && spot_price !== "null" ? Number.parseFloat(spot_price) : null,
      settlement_outcome: settlement_outcome && settlement_outcome !== "null" ? settlement_outcome.trim().toUpperCase() : null,
    });
  }

  return events;
}

/**
 * Write a list of SwingEvent objects to swing-events.csv.
 */
export function writeSwingEventsCsv(events: SwingEvent[], csvPath: string = DEFAULT_CSV_PATH): void {
  const dir = path.dirname(csvPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const lines = [CSV_HEADER];
  for (const e of events) {
    const spotStr = e.spot_price !== null && Number.isFinite(e.spot_price) ? e.spot_price.toFixed(2) : "null";
    const outcomeStr = e.settlement_outcome ? e.settlement_outcome.toUpperCase() : "null";
    lines.push(
      `${e.ticker},${e.trigger_time},${e.minutes_left.toFixed(2)},${e.price_before.toFixed(4)},${e.price_after.toFixed(4)},${spotStr},${outcomeStr}`
    );
  }

  fs.writeFileSync(csvPath, lines.join("\n") + "\n", "utf8");
}

/**
 * Append a single SwingEvent to swing-events.csv.
 */
export function appendSwingEvent(event: SwingEvent, csvPath: string = DEFAULT_CSV_PATH): void {
  const dir = path.dirname(csvPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fileExists = fs.existsSync(csvPath);
  const spotStr = event.spot_price !== null && Number.isFinite(event.spot_price) ? event.spot_price.toFixed(2) : "null";
  const outcomeStr = event.settlement_outcome ? event.settlement_outcome.toUpperCase() : "null";
  const line = `${event.ticker},${event.trigger_time},${event.minutes_left.toFixed(2)},${event.price_before.toFixed(4)},${event.price_after.toFixed(4)},${spotStr},${outcomeStr}\n`;

  if (!fileExists) {
    fs.writeFileSync(csvPath, `${CSV_HEADER}\n${line}`, "utf8");
  } else {
    fs.appendFileSync(csvPath, line, "utf8");
  }
}

/**
 * Scan database orderbook snapshots for swing events and synchronize with swing-events.csv.
 * Can be run to bootstrap historical events or incrementally update.
 */
export function syncSwingEventsFromDb(options: SwingDetectionOptions = {}): {
  totalLogged: number;
  newLogged: number;
  settledCount: number;
} {
  const threshold = options.threshold ?? 0.08;
  const windowMs = options.windowMs ?? 5 * 60 * 1000;
  const cooldownMs = options.cooldownMs ?? 2 * 60 * 1000;
  const csvPath = options.csvPath ?? DEFAULT_CSV_PATH;
  const dbPath = options.dbPath ?? DEFAULT_DB_PATH;

  if (!fs.existsSync(dbPath)) {
    return { totalLogged: 0, newLogged: 0, settledCount: 0 };
  }

  const db = new Database(dbPath, { readonly: true });

  try {
    interface SnapRow {
      market_ticker: string;
      captured_at: number;
      best_yes_price: number;
    }

    interface OutcomeRow {
      market_ticker: string;
      open_time: number;
      close_time: number;
      result: string;
    }

    const snaps = db
      .prepare(
        `SELECT market_ticker, captured_at, best_yes_price 
         FROM orderbook_snapshots 
         WHERE asset='BTC' AND best_yes_price IS NOT NULL 
         ORDER BY market_ticker, captured_at ASC`
      )
      .all() as SnapRow[];

    const outcomes = db
      .prepare(
        `SELECT market_ticker, open_time, close_time, result 
         FROM market_outcomes 
         WHERE asset='BTC'`
      )
      .all() as OutcomeRow[];

    const outcomeMap = new Map<string, OutcomeRow>();
    for (const o of outcomes) {
      outcomeMap.set(o.market_ticker, o);
    }

    const byTicker = new Map<string, SnapRow[]>();
    for (const s of snaps) {
      if (!byTicker.has(s.market_ticker)) byTicker.set(s.market_ticker, []);
      byTicker.get(s.market_ticker)!.push(s);
    }

    const getBrtiStmt = db.prepare(
      `SELECT raw_value FROM btc_index_ticks WHERE asset='BTC' AND received_at <= ? ORDER BY received_at DESC LIMIT 1`
    );
    const getCoinbaseStmt = db.prepare(
      `SELECT price FROM exchange_prices WHERE asset='BTC' AND exchange_name='coinbase' AND fetched_at <= ? ORDER BY fetched_at DESC LIMIT 1`
    );

    // Existing events mapped by ticker + trigger_time
    const existingEvents = readSwingEventsCsv(csvPath);
    const existingKeySet = new Set(existingEvents.map((e) => `${e.ticker}_${e.trigger_time}`));
    const existingEventMap = new Map(existingEvents.map((e) => [`${e.ticker}_${e.trigger_time}`, e]));

    let newLogged = 0;
    const allDiscovered: SwingEvent[] = [];

    for (const [ticker, list] of byTicker.entries()) {
      const outcome = outcomeMap.get(ticker);
      let lastTriggeredAt = 0;

      for (let i = 0; i < list.length; i++) {
        const s1 = list[i];
        if (s1.captured_at < lastTriggeredAt + cooldownMs) continue;

        for (let j = i + 1; j < list.length; j++) {
          const s2 = list[j];
          const dt = s2.captured_at - s1.captured_at;
          if (dt > windowMs) break;

          const diff = s2.best_yes_price - s1.best_yes_price;
          if (Math.abs(diff) >= threshold) {
            let minutesLeft = 0;
            if (outcome) {
              minutesLeft = Number((Math.max(0, outcome.close_time - s2.captured_at) / 60000).toFixed(2));
            }

            const brtiRow = getBrtiStmt.get(s2.captured_at) as { raw_value: string } | undefined;
            let spotPrice: number | null = brtiRow ? Number.parseFloat(brtiRow.raw_value) : null;
            if (spotPrice === null || Number.isNaN(spotPrice)) {
              const cbRow = getCoinbaseStmt.get(s2.captured_at) as { price: number } | undefined;
              spotPrice = cbRow?.price ?? null;
            }

            const triggerIso = new Date(s2.captured_at).toISOString();
            const key = `${ticker}_${triggerIso}`;

            const resolvedOutcome = outcome?.result ? outcome.result.toUpperCase() : null;

            const swingEvent: SwingEvent = {
              ticker,
              trigger_time: triggerIso,
              minutes_left: minutesLeft,
              price_before: s1.best_yes_price,
              price_after: s2.best_yes_price,
              spot_price: spotPrice,
              settlement_outcome: resolvedOutcome,
            };

            allDiscovered.push(swingEvent);

            if (!existingKeySet.has(key)) {
              newLogged++;
            }

            lastTriggeredAt = s2.captured_at;
            break;
          }
        }
      }
    }

    // Sort chronologically by trigger_time
    allDiscovered.sort((a, b) => new Date(a.trigger_time).getTime() - new Date(b.trigger_time).getTime());

    // Update CSV with complete current list
    writeSwingEventsCsv(allDiscovered, csvPath);

    const settledCount = allDiscovered.filter((e) => e.settlement_outcome !== null).length;

    return {
      totalLogged: allDiscovered.length,
      newLogged,
      settledCount,
    };
  } finally {
    db.close();
  }
}

/**
 * Returns current statistics of the swing event dataset.
 */
export function getSwingEventsSummary(csvPath: string = DEFAULT_CSV_PATH): {
  totalLogged: number;
  settledCount: number;
  pendingCount: number;
  latestTriggerTime: string | null;
  minSampleTarget: number;
  hasSufficientSample: boolean;
} {
  const events = readSwingEventsCsv(csvPath);
  const settled = events.filter((e) => e.settlement_outcome !== null);
  const latest = events.length > 0 ? events[events.length - 1].trigger_time : null;

  return {
    totalLogged: events.length,
    settledCount: settled.length,
    pendingCount: events.length - settled.length,
    latestTriggerTime: latest,
    minSampleTarget: 30,
    hasSufficientSample: settled.length >= 30,
  };
}

/**
 * Active live watcher function: checks recent snapshots against active open contracts
 * and logs any newly observed swing in real time.
 */
export async function checkLiveSwingEvents(options: SwingDetectionOptions = {}): Promise<SwingEvent[]> {
  const threshold = options.threshold ?? 0.08;
  const windowMs = options.windowMs ?? 5 * 60 * 1000;
  const csvPath = options.csvPath ?? DEFAULT_CSV_PATH;
  const dbPath = options.dbPath ?? DEFAULT_DB_PATH;

  if (!fs.existsSync(dbPath)) return [];

  const db = new Database(dbPath, { readonly: true });
  try {
    const recentWindowStart = Date.now() - (windowMs + 60_000);

    interface RecentSnap {
      market_ticker: string;
      captured_at: number;
      best_yes_price: number;
    }

    const snaps = db
      .prepare(
        `SELECT market_ticker, captured_at, best_yes_price 
         FROM orderbook_snapshots 
         WHERE asset='BTC' AND captured_at >= ? AND best_yes_price IS NOT NULL 
         ORDER BY market_ticker, captured_at ASC`
      )
      .all(recentWindowStart) as RecentSnap[];

    if (snaps.length < 2) return [];

    const existingEvents = readSwingEventsCsv(csvPath);
    const existingKeys = new Set(existingEvents.map((e) => `${e.ticker}_${e.trigger_time}`));

    const byTicker = new Map<string, RecentSnap[]>();
    for (const s of snaps) {
      if (!byTicker.has(s.market_ticker)) byTicker.set(s.market_ticker, []);
      byTicker.get(s.market_ticker)!.push(s);
    }

    const newlyDetected: SwingEvent[] = [];

    for (const [ticker, list] of byTicker.entries()) {
      if (list.length < 2) continue;
      const s1 = list[0];
      const s2 = list[list.length - 1];
      const diff = s2.best_yes_price - s1.best_yes_price;

      if (Math.abs(diff) >= threshold) {
        const triggerIso = new Date(s2.captured_at).toISOString();
        const key = `${ticker}_${triggerIso}`;
        if (!existingKeys.has(key)) {
          // Check spot price
          const brtiRow = db
            .prepare(`SELECT raw_value FROM btc_index_ticks WHERE asset='BTC' AND received_at <= ? ORDER BY received_at DESC LIMIT 1`)
            .get(s2.captured_at) as { raw_value: string } | undefined;
          let spotPrice = brtiRow ? Number.parseFloat(brtiRow.raw_value) : null;
          if (spotPrice === null || Number.isNaN(spotPrice)) {
            const cbRow = db
              .prepare(
                `SELECT price FROM exchange_prices WHERE asset='BTC' AND exchange_name='coinbase' AND fetched_at <= ? ORDER BY fetched_at DESC LIMIT 1`
              )
              .get(s2.captured_at) as { price: number } | undefined;
            spotPrice = cbRow?.price ?? null;
          }

          const outcomeRow = db
            .prepare(`SELECT result, close_time FROM market_outcomes WHERE market_ticker = ?`)
            .get(ticker) as { result?: string; close_time?: number } | undefined;

          let minutesLeft = 0;
          if (outcomeRow?.close_time) {
            minutesLeft = Number((Math.max(0, outcomeRow.close_time - s2.captured_at) / 60000).toFixed(2));
          }

          const event: SwingEvent = {
            ticker,
            trigger_time: triggerIso,
            minutes_left: minutesLeft,
            price_before: s1.best_yes_price,
            price_after: s2.best_yes_price,
            spot_price: spotPrice,
            settlement_outcome: outcomeRow?.result ? outcomeRow.result.toUpperCase() : null,
          };

          appendSwingEvent(event, csvPath);
          newlyDetected.push(event);
        }
      }
    }

    return newlyDetected;
  } finally {
    db.close();
  }
}

// If invoked as a CLI script directly:
const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith("swing-event-logger.ts") || process.argv[1].endsWith("swing-event-logger.js"));

if (isDirectExecution) {
  console.log("QuanterraOS Swing Event Logger: Synchronizing historical and live orderbook events...");
  const syncResult = syncSwingEventsFromDb();
  console.log(`Synchronization complete: ${syncResult.totalLogged} total events (${syncResult.settledCount} settled, ${syncResult.newLogged} newly added).`);

  const summary = getSwingEventsSummary();
  console.log("Current dataset summary:", summary);

  // If --watch argument is passed, run continuously
  if (process.argv.includes("--watch")) {
    console.log("Starting continuous live watcher (30s polling cycle)...");
    setInterval(async () => {
      try {
        const detected = await checkLiveSwingEvents();
        if (detected.length > 0) {
          console.log(`[${new Date().toISOString()}] Detected ${detected.length} new swing events!`);
        }
      } catch (err) {
        console.error("Watcher polling error:", err);
      }
    }, 30_000);
  }
}
