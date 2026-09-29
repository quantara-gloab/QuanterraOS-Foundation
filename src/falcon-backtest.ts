/**
 * Falcon backtest: score computeFalconRecommendation() against real,
 * already-settled Kalshi 15-minute contracts, using only order-book
 * evidence that existed before each contract closed.
 *
 * IMPORTANT SCOPE CAVEAT: Kalshi's candlestick/historical endpoints
 * (the 712-market CSV used elsewhere in this project) do not include
 * order-book depth/imbalance data — see docs/findings.md. The only
 * order-book history that exists anywhere is what orderbook-collector.mjs
 * has gathered since the corrected best-bid-extraction fix (the
 * data/orderbook-valid-from-ms.txt cutoff). This backtest is therefore
 * limited to that live-collected window, not months of history, and
 * that limitation is reported honestly below rather than hidden.
 *
 * No train/held-out split is performed: Falcon's heuristic has no
 * parameters fit to this data (the 0.3 sensitivity and probability caps
 * are fixed a priori, not learned), so every eligible settled market is
 * scored directly. computeFalconRecommendation() never receives the
 * settlement outcome, so this is a genuine out-of-sample evaluation.
 *
 * Results are printed only — nothing here writes to falcon_recommendations,
 * so backtested results can never be mixed into the live UI's track record.
 */
import fs from "node:fs";
import Database from "better-sqlite3";
import { computeFalconRecommendation, scoreFalconRecommendation, type OrderbookEvidence } from "./agents/falcon.ts";
import type { ResolutionRow } from "./scoring.ts";

const asset = process.env.FALCON_BACKTEST_ASSET ?? "BTC";
const dbPath = process.env.DB_PATH ?? "quanterraos.db";
const entryMinuteMs = 4 * 60 * 1000;
const matchToleranceMs = 60_000;
const evidenceWindow = 5;

const validFromPath = "data/orderbook-valid-from-ms.txt";
if (!fs.existsSync(validFromPath)) throw new Error(`Missing clean-data cutoff marker: ${validFromPath}`);
const validFromMs = Number(fs.readFileSync(validFromPath, "utf8").trim());
if (!Number.isSafeInteger(validFromMs) || validFromMs <= 0) throw new Error(`Invalid clean-data cutoff in ${validFromPath}`);

interface SettledMarket {
  market_ticker: string;
  open_time: number;
  close_time: number;
  result: "yes" | "no" | "void" | string;
}

interface SnapshotRow {
  market_ticker: string;
  captured_at: number;
  best_yes_price: number | null;
  best_no_price: number | null;
  top_imbalance: number | null;
  depth_imbalance: number | null;
}

const db = new Database(dbPath, { readonly: true });
const markets = db
  .prepare(
    `SELECT market_ticker, open_time, close_time, result FROM market_outcomes
     WHERE asset = ? AND market_ticker LIKE ? AND result IN ('yes', 'no')
     ORDER BY close_time`,
  )
  .all(asset, `KX${asset}15M-%`) as SettledMarket[];

const tickers = markets.map((m) => m.market_ticker);
const snapshotsByMarket = new Map<string, SnapshotRow[]>();
if (tickers.length) {
  const placeholders = tickers.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT market_ticker, captured_at, best_yes_price, best_no_price, top_imbalance, depth_imbalance
       FROM orderbook_snapshots WHERE captured_at >= ? AND market_ticker IN (${placeholders}) ORDER BY captured_at`,
    )
    .all(validFromMs, ...tickers) as SnapshotRow[];
  for (const row of rows) {
    const list = snapshotsByMarket.get(row.market_ticker) ?? [];
    list.push(row);
    snapshotsByMarket.set(row.market_ticker, list);
  }
}
db.close();

interface BacktestResult {
  contract: string;
  closeTime: number;
  falconProbability: number;
  entryYesPrice: number;
  outcome: "yes" | "no";
  falconBrier: number;
  baselineHalfBrier: number;
  baselinePriceBrier: number;
}

const results: BacktestResult[] = [];
let skippedNoEvidence = 0;

for (const market of markets) {
  const candidates = (snapshotsByMarket.get(market.market_ticker) ?? [])
    // Never let Falcon see anything at or after the market closed.
    .filter((row) => row.captured_at < market.close_time);
  if (!candidates.length) {
    skippedNoEvidence += 1;
    continue;
  }
  const target = market.open_time + entryMinuteMs;
  const nearest = candidates.reduce((best, row) => (
    Math.abs(row.captured_at - target) < Math.abs(best.captured_at - target) ? row : best
  ), candidates[0]);
  if (Math.abs(nearest.captured_at - target) > matchToleranceMs) {
    skippedNoEvidence += 1;
    continue;
  }
  // Evidence available "as of" the entry snapshot: the last few
  // snapshots at or before it, exactly what a live call would have seen.
  const evidence: OrderbookEvidence[] = candidates
    .filter((row) => row.captured_at <= nearest.captured_at)
    .sort((a, b) => b.captured_at - a.captured_at)
    .slice(0, evidenceWindow)
    .map((row) => ({
      marketTicker: row.market_ticker,
      capturedAt: row.captured_at,
      bestYesPrice: row.best_yes_price,
      bestNoPrice: row.best_no_price,
      topImbalance: row.top_imbalance,
      depthImbalance: row.depth_imbalance,
    }));

  let recommendation;
  try {
    recommendation = computeFalconRecommendation(market.market_ticker, evidence, new Date(nearest.captured_at));
  } catch {
    skippedNoEvidence += 1;
    continue;
  }

  const resolution: ResolutionRow = {
    owner: "backtest",
    contract: market.market_ticker,
    outcome: market.result.toUpperCase() as ResolutionRow["outcome"],
    officialSource: "market_outcomes",
    resolvedAt: new Date(market.close_time).toISOString(),
    finalized: true,
  };
  const scored = scoreFalconRecommendation(
    { owner: "backtest", contract: market.market_ticker, suggestedProbability: recommendation.suggestedProbability, rationale: recommendation.rationale, createdAt: recommendation.generatedAt },
    resolution,
  );
  if (!scored.scorable || scored.brierScore === null) continue;

  const entryYesPrice = nearest.best_yes_price ?? 0.5;
  const actual = market.result === "yes" ? 1 : 0;
  results.push({
    contract: market.market_ticker,
    closeTime: market.close_time,
    falconProbability: recommendation.suggestedProbability,
    entryYesPrice,
    outcome: market.result as "yes" | "no",
    falconBrier: scored.brierScore,
    baselineHalfBrier: (0.5 - actual) ** 2,
    baselinePriceBrier: (Math.min(1, Math.max(0, entryYesPrice)) - actual) ** 2,
  });
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

const report = {
  source: "falcon-backtest",
  asset,
  validFromMs,
  validFromIso: new Date(validFromMs).toISOString(),
  settledMarketsConsidered: markets.length,
  skippedNoEvidence,
  sampleSize: results.length,
  dateRange: results.length
    ? { earliest: new Date(results[0].closeTime).toISOString(), latest: new Date(results[results.length - 1].closeTime).toISOString() }
    : null,
  falconAverageBrier: average(results.map((r) => r.falconBrier)),
  naiveFiftyFiftyAverageBrier: average(results.map((r) => r.baselineHalfBrier)),
  naiveEntryPriceAverageBrier: average(results.map((r) => r.baselinePriceBrier)),
  note: "Order-book history only exists since the corrected collector's valid-from cutoff (~4.5 hours as of this run), not months of candlestick history, which lacks book depth entirely. Small sample size is a real constraint, not withheld data.",
};

console.log(JSON.stringify(report, null, 2));
