import { DatabaseSync } from "node:sqlite";
import { computeRealizedVolatility, oneTouchProbability, type TimestampedPrice } from "../src/one-touch.ts";

const db = new DatabaseSync("quanterraos.db", { readonly: true });

interface Settlement {
  ticker: string;
  strike: number;
  open_time: number;
  close_time: number;
  result: "yes" | "no";
}

interface Prediction {
  ticker: string;
  modelProbability: number;
  brierScore: number;
  won: boolean;
  pnl: number;
}

function loadSettlements(): Settlement[] {
  const rows = db.prepare(
    "SELECT market_ticker, strike_price, open_time, close_time, result FROM market_outcomes WHERE market_ticker LIKE 'KXBTC15M%' AND result IS NOT NULL AND result != '' ORDER BY close_time"
  ).all() as {
    market_ticker: string;
    strike_price: number;
    open_time: number;
    close_time: number;
    result: string;
  }[];

  return rows.map((r) => ({
    ticker: r.market_ticker,
    strike: r.strike_price,
    open_time: r.open_time,
    close_time: r.close_time,
    result: r.result.toLowerCase() as "yes" | "no",
  }));
}

function getTicksUpTo(midpoint: number, windowMinutes: number): TimestampedPrice[] {
  return db.prepare(
    "SELECT received_at AS at, CAST(raw_value AS REAL) AS value FROM btc_index_ticks WHERE asset = 'BTC' AND received_at >= ? AND received_at <= ? ORDER BY received_at ASC"
  ).all(midpoint - windowMinutes * 60_000, midpoint).map((t: { at: number; value: number }) => ({
    at: t.at,
    value: t.value,
  })).filter((t) => Number.isFinite(t.value) && t.value > 0) as TimestampedPrice[];
}

function evaluateAtMidpoint(
  settlement: Settlement,
  windowMinutes: number,
  jevAdjustment: 0 | 0.02 | -0.02, // Step 4c: test Jev contribution
): Prediction | null {
  const midpoint = Math.floor((settlement.open_time + settlement.close_time) / 2);
  const remainingSeconds = Math.floor((settlement.close_time - midpoint) / 1000);
  const ticks = getTicksUpTo(midpoint, windowMinutes);

  if (ticks.length < 10) return null;

  const volResult = computeRealizedVolatility(ticks);
  if (!volResult || volResult.perSecond <= 0) return null;

  const latestPrice = ticks[ticks.length - 1].value;

  let p = oneTouchProbability({
    currentPrice: latestPrice,
    strike: settlement.strike,
    remainingSeconds,
    realizedVolatility: volResult.perSecond,
    barrierType: "high",
  });

  // Apply Jev calibration adjustment (simulating what falcon-jev.ts would do)
  p = Math.min(0.999, Math.max(0.001, p + jevAdjustment));

  const actualYes = settlement.result === "yes" ? 1 : 0;
  const brier = (p - actualYes) ** 2;
  const fee = 0.07 * p * (1 - p);
  const won = (p >= 0.5) === (settlement.result === "yes");
  const pnl = (won ? 1 : 0) - p - fee;

  return { ticker: settlement.ticker, modelProbability: p, brierScore: brier, won, pnl };
}

function computeMetrics(predictions: Prediction[], settlements: Settlement[]): {
  total: number;
  winRate: number;
  avgBrier: number;
  totalPnl: number;
  avgPnl: number;
  winningTrades: number;
  losingTrades: number;
} {
  const total = predictions.length;
  if (total === 0) return { total: 0, winRate: 0, avgBrier: 0, totalPnl: 0, avgPnl: 0, winningTrades: 0, losingTrades: 0 };

  const predTickers = new Set(predictions.map((p) => p.ticker));
  const matched = settlements.filter((s) => predTickers.has(s.ticker));

  const avgBrier = predictions.reduce((s, p) => s + p.brierScore, 0) / total;
  const winCount = predictions.filter((p) => {
    const s = matched.find((m) => m.ticker === p.ticker);
    return s ? (p.modelProbability >= 0.5) === (s.result === "yes") : false;
  }).length;

  const totalPnl = predictions.reduce((s, p) => s + p.pnl, 0);
  const winning = predictions.filter((p) => p.won).length;

  return {
    total,
    winRate: winCount / total,
    avgBrier,
    totalPnl,
    avgPnl: totalPnl / total,
    winningTrades: winning,
    losingTrades: total - winning,
  };
}

console.log("==== STEP 4c: Jev contribution test (15-min window, midpoint, tuning period) ====\n");

const allSettlements = loadSettlements();
const sorted = allSettlements.sort((a, b) => a.close_time - b.close_time);
const splitIdx = Math.floor(sorted.length * 0.8);
const tuningSettlements = sorted.slice(0, splitIdx);
const heldOutSettlements = sorted.slice(splitIdx);

// Test quant-only vs quant + Jev-like adjustment (+0.02 = Jev says "higher than quant")
for (const [label, jevAdj] of [
  ["quant-only (baseline)", 0 as const],
  ["quant + Jev (+0.02)", 0.02 as const],
  ["quant + Jev (-0.02)", -0.02 as const],
] as const) {
  const preds = tuningSettlements
    .map((s) => evaluateAtMidpoint(s, 15, jevAdj))
    .filter((p): p is Prediction => p !== null);
  const m = computeMetrics(preds, tuningSettlements);

  console.log(`${label}:`);
  console.log(`  Contracts: ${m.total}`);
  console.log(`  Win rate:  ${(m.winRate * 100).toFixed(1)}%`);
  console.log(`  Brier:     ${m.avgBrier.toFixed(6)}`);
  console.log(`  P&L:       $${m.totalPnl.toFixed(4)} total, $${m.avgPnl.toFixed(4)}/contract`);
  console.log(`  W/L:       ${m.winningTrades}W / ${m.losingTrades}L`);
}

// STEP 5: Run best config (15-min window, midpoint, quant-only) against held-out
console.log("\n==== STEP 5: Held-out period evaluation ====\n");
console.log("Best tuning config: 15-min window, midpoint eval, quant-only\n");

const heldOutPreds = heldOutSettlements
  .map((s) => evaluateAtMidpoint(s, 15, 0))
  .filter((p): p is Prediction => p !== null);

const heldOutMetrics = computeMetrics(heldOutPreds, heldOutSettlements);

console.log("=== HELD-OUT RESULTS (15-min window, midpoint, quant-only) ===");
console.log("Contracts evaluated:", heldOutMetrics.total);
console.log("Win rate:", (heldOutMetrics.winRate * 100).toFixed(1) + "%");
console.log("Average Brier score:", heldOutMetrics.avgBrier.toFixed(6));
console.log("Naive 50% Brier: 0.250000");
console.log("Total P&L: $", heldOutMetrics.totalPnl.toFixed(4));
console.log("Avg P&L per contract: $", heldOutMetrics.avgPnl.toFixed(4));
console.log("Winning trades:", heldOutMetrics.winningTrades);
console.log("Losing trades:", heldOutMetrics.losingTrades);

db.close();
