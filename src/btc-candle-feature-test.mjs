import fs from "node:fs/promises";
import dotenv from "dotenv";

dotenv.config();

const csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const feeRate = Number(process.env.KALSHI_FEE_RATE ?? 0.07);
const entryMinute = 4;

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

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function fee(price) {
  return feeRate * price * (1 - price);
}

function buildMarkets(rows) {
  const markets = new Map();
  for (const row of rows) {
    const market = markets.get(row.ticker) ?? {
      ticker: row.ticker,
      openTime: Number(row.open_time),
      result: row.result,
      candles: [],
    };
    market.candles.push({
      timestamp: Number(row.timestamp),
      bid: number(row.yes_bid),
      ask: number(row.yes_ask),
      volume: number(row.volume),
    });
    markets.set(row.ticker, market);
  }
  return [...markets.values()].sort((left, right) => left.openTime - right.openTime);
}

function entryFor(market) {
  const target = market.openTime + entryMinute * 60;
  const candle = market.candles.reduce((best, row) => (
    Math.abs(row.timestamp - target) < Math.abs(best.timestamp - target) ? row : best
  ), market.candles[0]);
  if (!candle || Math.abs(candle.timestamp - target) > 60 || candle.bid === null || candle.ask === null) return null;
  return {
    result: market.result,
    spreadWidth: candle.ask - candle.bid,
    volume: candle.volume,
    yesMid: (candle.bid + candle.ask) / 2,
    yesAsk: candle.ask,
    noAsk: 1 - candle.bid,
  };
}

function groupStats(entries, feature, threshold) {
  const groups = { low: [], high: [] };
  for (const entry of entries) {
    const value = entry[feature];
    if (value === null || value === undefined) continue;
    groups[value < threshold ? "low" : "high"].push(entry);
  }
  return Object.fromEntries(Object.entries(groups).map(([name, values]) => [name, {
    markets: values.length,
    yesRate: values.length ? Number((values.filter((entry) => entry.result === "yes").length / values.length * 100).toFixed(2)) : null,
  }]));
}

function evaluateHeldOut(entries, feature, threshold, trainingGroups) {
  const lowPrediction = trainingGroups.low.yesRate >= trainingGroups.high.yesRate ? "yes" : "no";
  const highPrediction = trainingGroups.high.yesRate > trainingGroups.low.yesRate ? "yes" : "no";
  const result = { markets: 0, wins: 0, totalProfit: 0 };
  for (const entry of entries) {
    const value = entry[feature];
    if (value === null || value === undefined) continue;
    const prediction = value < threshold ? lowPrediction : highPrediction;
    const entryPrice = prediction === "yes" ? entry.yesAsk : entry.noAsk;
    const won = prediction === entry.result;
    result.markets += 1;
    result.wins += won ? 1 : 0;
    result.totalProfit += (won ? 1 : 0) - entryPrice - fee(entryPrice);
  }
  result.winRate = result.markets ? Number((result.wins / result.markets * 100).toFixed(2)) : 0;
  result.averageProfitPerContract = result.markets ? Number((result.totalProfit / result.markets).toFixed(6)) : 0;
  result.totalProfit = Number(result.totalProfit.toFixed(6));
  return result;
}

const rows = parseCsv(await fs.readFile(csvPath, "utf8"));
const entries = buildMarkets(rows).map(entryFor).filter(Boolean);
const splitIndex = Math.floor(entries.length / 2);
const training = entries.slice(0, splitIndex);
const heldOut = entries.slice(splitIndex);
const results = {};
for (const feature of ["volume", "spreadWidth"]) {
  const threshold = median(training.map((entry) => entry[feature]).filter((value) => value !== null));
  const trainingGroups = groupStats(training, feature, threshold);
  results[feature] = {
    trainingMarkets: training.length,
    heldOutMarkets: heldOut.length,
    trainingMedian: threshold,
    trainingGroups,
    heldOut: evaluateHeldOut(heldOut, feature, threshold, trainingGroups),
  };
}

console.log(JSON.stringify({
  preregistration: "docs/btc-candle-feature-preregistration.md",
  csvPath,
  totalEligibleMarkets: entries.length,
  entryMinute,
  feeRate,
  results,
}, null, 2));
