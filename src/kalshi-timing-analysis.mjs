import fs from "node:fs/promises";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const feeRate = Number(process.env.KALSHI_FEE_RATE ?? 0.07);
const dbPath = process.env.DB_PATH ?? "quanterraos.db";

function parseCsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const headers = header.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((key, index) => [key, values[index] ?? ""]));
  });
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fee(price, rate = feeRate) {
  return rate * price * (1 - price);
}

function strategyResult(candle, result, strategy, rate) {
  const bid = number(candle.yes_bid);
  const ask = number(candle.yes_ask);
  if (bid === null || ask === null) return null;
  const mid = (bid + ask) / 2;
  let side;
  if (strategy === "alwaysYes") side = "yes";
  else if (strategy === "contrarian") side = mid < 0.5 ? "yes" : "no";
  else side = mid >= 0.5 ? "yes" : "no";
  const entryPrice = side === "yes" ? ask : 1 - bid;
  const won = side === result;
  const profit = (won ? 1 : 0) - entryPrice - fee(entryPrice, rate);
  return { profit, won, entryPrice };
}

function evaluate(markets, minute, strategy, rate) {
  let marketsTested = 0;
  let wins = 0;
  let profit = 0;
  for (const market of markets) {
    const target = market.open_time + minute * 60;
    const candle = market.candles.reduce((best, row) => (
      Math.abs(row.timestamp - target) < Math.abs(best.timestamp - target) ? row : best
    ), market.candles[0]);
    if (!candle || Math.abs(candle.timestamp - target) > 60) continue;
    const result = strategyResult(candle, market.result, strategy, rate);
    if (!result) continue;
    marketsTested += 1;
    wins += result.won ? 1 : 0;
    profit += result.profit;
  }
  return {
    markets: marketsTested,
    wins,
    winRate: marketsTested ? Number((wins / marketsTested * 100).toFixed(2)) : 0,
    averageProfitPerContract: marketsTested ? Number((profit / marketsTested).toFixed(6)) : 0,
    totalProfit: Number(profit.toFixed(6)),
  };
}

function profitSamples(markets, minute, rate) {
  const profits = [];
  for (const market of markets) {
    const target = market.open_time + minute * 60;
    const candle = market.candles.reduce((best, row) => (
      Math.abs(row.timestamp - target) < Math.abs(best.timestamp - target) ? row : best
    ), market.candles[0]);
    if (!candle || Math.abs(candle.timestamp - target) > 60) continue;
    const result = strategyResult(candle, market.result, "rule", rate);
    if (result) profits.push(result.profit);
  }
  return profits;
}

function bootstrapInterval(samples, iterations = 1000) {
  if (samples.length === 0) return { low: 0, high: 0 };
  const totals = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let total = 0;
    for (let index = 0; index < samples.length; index += 1) {
      total += samples[Math.floor(Math.random() * samples.length)];
    }
    totals.push(total);
  }
  totals.sort((left, right) => left - right);
  return {
    low: Number(totals[Math.floor(iterations * 0.025)].toFixed(6)),
    high: Number(totals[Math.floor(iterations * 0.975)].toFixed(6)),
  };
}

const rows = parseCsv(await fs.readFile(csvPath, "utf8"));
const marketMap = new Map();
for (const row of rows) {
  const market = marketMap.get(row.ticker) ?? {
    ticker: row.ticker,
    open_time: Number(row.open_time),
    close_time: Number(row.close_time),
    result: row.result,
    candles: [],
  };
  market.candles.push({
    timestamp: Number(row.timestamp),
    yes_bid: row.yes_bid,
    yes_ask: row.yes_ask,
  });
  marketMap.set(row.ticker, market);
}
const markets = [...marketMap.values()];
const noFeeTiming = [2, 13].map((minute) => ({
  minute,
  withFees: evaluate(markets, minute, "rule", feeRate),
  withoutFees: evaluate(markets, minute, "rule", 0),
}));
const sweep = Array.from({ length: 15 }, (_, minute) => ({
  minute,
  ...evaluate(markets, minute, "rule", feeRate),
})).sort((left, right) => right.averageProfitPerContract - left.averageProfitPerContract);
const baselines = ["rule", "alwaysYes", "contrarian"].map((strategy) => ({
  strategy,
  ...evaluate(markets, 13, strategy, feeRate),
})).sort((left, right) => right.averageProfitPerContract - left.averageProfitPerContract);
const splitIndex = Math.floor(markets.length / 2);
const firstHalf = markets.slice(0, splitIndex);
const secondHalf = markets.slice(splitIndex);
const firstSweep = Array.from({ length: 15 }, (_, minute) => ({
  minute,
  ...evaluate(firstHalf, minute, "rule", feeRate),
})).sort((left, right) => right.averageProfitPerContract - left.averageProfitPerContract);
const selectedMinutes = firstSweep.slice(0, 2).map((entry) => entry.minute);
const walkForward = selectedMinutes.map((minute) => ({
  minute,
  firstHalf: firstSweep.find((entry) => entry.minute === minute),
  secondHalf: evaluate(secondHalf, minute, "rule", feeRate),
}));
const bootstrap = [4, 9].map((minute) => {
  const samples = profitSamples(markets, minute, feeRate);
  const totalProfit = samples.reduce((sum, value) => sum + value, 0);
  return { minute, samples: samples.length, totalProfit: Number(totalProfit.toFixed(6)), bootstrap95PercentCI: bootstrapInterval(samples) };
});
const yesRate = markets.length ? markets.filter((market) => market.result === "yes").length / markets.length * 100 : 0;
const sqlite = new Database(dbPath, { readonly: true });
const first = markets.reduce((value, market) => Math.min(value, market.open_time), Infinity);
const last = markets.reduce((value, market) => Math.max(value, market.close_time), -Infinity);
const brti = sqlite.prepare("SELECT received_at, CAST(raw_value AS REAL) AS value FROM btc_index_ticks WHERE asset = 'BTC' AND received_at BETWEEN ? AND ? ORDER BY received_at").all(first * 1000, last * 1000);
sqlite.close();
const drift = brti.length > 1 ? {
  firstTimestamp: brti[0].received_at,
  lastTimestamp: brti.at(-1).received_at,
  firstValue: brti[0].value,
  lastValue: brti.at(-1).value,
  change: Number((brti.at(-1).value - brti[0].value).toFixed(6)),
  changePercent: Number(((brti.at(-1).value - brti[0].value) / brti[0].value * 100).toFixed(4)),
} : null;

console.log(JSON.stringify({
  csvPath,
  markets: markets.length,
  feeRate,
  yesOutcomeRate: Number(yesRate.toFixed(2)),
  brtiDrift: drift,
  feeComparison: noFeeTiming,
  minuteSweepSortedByAverageProfit: sweep,
  minute13BaselinesSortedByAverageProfit: baselines,
  walkForward: { firstHalfMarkets: firstHalf.length, secondHalfMarkets: secondHalf.length, selectedMinutes, results: walkForward },
  multipleComparisons: { tests: 15, alpha: 0.05, bonferroniAlpha: Number((0.05 / 15).toFixed(6)) },
  bootstrap: { iterations: 1000, results: bootstrap },
}, null, 2));
