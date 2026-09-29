import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { runHeldOutTest } from "./held-out-test.mjs";

const dbPath = process.env.DB_PATH ?? "quanterraos.db";
const feeRate = Number(process.env.KALSHI_FEE_RATE ?? 0.07);
const entryMinuteMs = 4 * 60 * 1000;
const matchToleranceMs = 60000;
const bootstrapIterations = 1000;
const asset = "BTC";
const validFromPath = path.resolve("data", "orderbook-valid-from-ms.txt");
if (!fs.existsSync(validFromPath)) throw new Error(`Missing clean-data cutoff marker: ${validFromPath}`);
const validFromMs = Number(fs.readFileSync(validFromPath, "utf8").trim());
if (!Number.isSafeInteger(validFromMs) || validFromMs <= 0) throw new Error(`Invalid clean-data cutoff in ${validFromPath}`);

const db = new Database(dbPath, { readonly: true });
const outcomes = db.prepare(`
  SELECT market_ticker, open_time, close_time, result
  FROM market_outcomes
  WHERE asset = ? AND market_ticker LIKE 'KXBTC15M-%'
  ORDER BY close_time
`).all(asset);
const snapshots = db.prepare(`
  SELECT market_ticker, captured_at, best_yes_price, best_no_price, top_imbalance, depth_imbalance
  FROM orderbook_snapshots
  WHERE asset = ? AND captured_at >= ?
  ORDER BY captured_at
`).all(asset, validFromMs);
db.close();

const snapshotsByMarket = new Map();
for (const row of snapshots) {
  const list = snapshotsByMarket.get(row.market_ticker) ?? [];
  list.push(row);
  snapshotsByMarket.set(row.market_ticker, list);
}

function featureFor(market) {
  const candidates = snapshotsByMarket.get(market.market_ticker);
  if (!candidates || !candidates.length) return null;
  const target = market.open_time + entryMinuteMs;
  const nearest = candidates.reduce((best, row) => (
    Math.abs(row.captured_at - target) < Math.abs(best.captured_at - target) ? row : best
  ), candidates[0]);
  if (Math.abs(nearest.captured_at - target) > matchToleranceMs) return null;
  if (nearest.best_yes_price == null || nearest.best_no_price == null) return null;
  if (nearest.top_imbalance == null || nearest.depth_imbalance == null) return null;
  return {
    result: market.result,
    topImbalance: nearest.top_imbalance,
    depthImbalance: nearest.depth_imbalance,
    yesAsk: 1 - nearest.best_no_price,
    noAsk: 1 - nearest.best_yes_price,
    matchDiffMs: Math.abs(nearest.captured_at - target),
  };
}

const eligible = outcomes.map((market) => ({ market, feature: featureFor(market) })).filter((row) => row.feature);

const results = {};
for (const featureKey of ["depthImbalance", "topImbalance"]) {
  const data = eligible.map(({ market, feature }) => ({
    ...feature,
    result: market.result,
    [featureKey]: feature[featureKey],
  }));
  results[featureKey] = runHeldOutTest(featureKey, data, {
    featureKey,
    feeRate,
    bootstrapIterations,
    comparisonCount: 2,
  });
}

console.log(JSON.stringify({
  asset,
  settledMarkets: outcomes.length,
  eligibleMarkets: eligible.length,
  validSnapshotsAfterMs: validFromMs,
  validSnapshotsAfter: new Date(validFromMs).toISOString(),
  entryMinute: 4,
  matchToleranceMs,
  feeRate,
  note: "Snapshot rows before validSnapshotsAfterMs are excluded. Features use chronological midpoint split, training-only median thresholds, real entry prices, fees, bootstrap intervals, and Bonferroni adjustment.",
  results,
}, null, 2));
