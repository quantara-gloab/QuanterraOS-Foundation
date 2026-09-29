import fs from "node:fs/promises";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const dbPath = process.env.DB_PATH ?? "quanterraos.db";
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

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function standardDeviation(values) {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
}

function fee(price) {
  return feeRate * price * (1 - price);
}

const rows = parseCsv(await fs.readFile(csvPath, "utf8"));
const marketsByTicker = new Map();
for (const row of rows) {
  const market = marketsByTicker.get(row.ticker) ?? {
    ticker: row.ticker,
    openTime: Number(row.open_time),
    closeTime: Number(row.close_time),
    result: row.result,
    candles: [],
  };
  market.candles.push({ timestamp: Number(row.timestamp), bid: numeric(row.yes_bid), ask: numeric(row.yes_ask) });
  marketsByTicker.set(row.ticker, market);
}
const markets = [...marketsByTicker.values()].sort((left, right) => left.closeTime - right.closeTime);
const splitIndex = Math.floor(markets.length / 2);
const trainingMarkets = markets.slice(0, splitIndex);
const heldOutMarkets = markets.slice(splitIndex);

const sqlite = new Database(dbPath, { readonly: true });
const brtiTicks = sqlite.prepare("SELECT received_at, CAST(raw_value AS REAL) AS value FROM btc_index_ticks WHERE asset = 'BTC' ORDER BY received_at").all();
sqlite.close();

function nearestTick(timestamp) {
  if (!brtiTicks.length) return null;
  return brtiTicks.reduce((best, tick) => Math.abs(tick.received_at - timestamp) < Math.abs(best.received_at - timestamp) ? tick : best);
}

function featureFor(market) {
  const entryTimestampMs = (market.openTime + entryMinute * 60) * 1000;
  const window = brtiTicks.filter((tick) => tick.received_at >= entryTimestampMs - 300000 && tick.received_at <= entryTimestampMs);
  if (window.length < 3) return null;
  const returns = [];
  for (let index = 1; index < window.length; index += 1) {
    if (window[index].value > 0 && window[index - 1].value > 0) returns.push(Math.log(window[index].value / window[index - 1].value));
  }
  const volatility = standardDeviation(returns);
  if (volatility === null) return null;
  const entryBRTI = nearestTick(entryTimestampMs);
  if (!entryBRTI || Math.abs(entryBRTI.received_at - entryTimestampMs) > 5000) return null;
  const candle = market.candles.reduce((best, row) => Math.abs(row.timestamp - (market.openTime + entryMinute * 60)) < Math.abs(best.timestamp - (market.openTime + entryMinute * 60)) ? row : best, market.candles[0]);
  if (!candle || Math.abs(candle.timestamp - (market.openTime + entryMinute * 60)) > 60 || candle.bid === null || candle.ask === null) return null;
  const first = window[0].value;
  const last = window.at(-1).value;
  return { volatility, direction: last >= first ? "yes" : "no", bid: candle.bid, ask: candle.ask };
}

const trainingFeatures = trainingMarkets.map(featureFor).filter(Boolean);
const volatilityThreshold = median(trainingFeatures.map((feature) => feature.volatility));

function evaluate(marketsToScore) {
  const result = { markets: 0, wins: 0, totalProfit: 0, skipped: 0 };
  if (volatilityThreshold === null) {
    result.skipped = marketsToScore.length;
    result.winRate = 0;
    result.averageProfitPerContract = 0;
    result.totalProfit = 0;
    return result;
  }
  for (const market of marketsToScore) {
    const feature = featureFor(market);
    if (!feature || feature.volatility < volatilityThreshold) {
      result.skipped += 1;
      continue;
    }
    const entryPrice = feature.direction === "yes" ? feature.ask : 1 - feature.bid;
    const won = feature.direction === market.result;
    result.markets += 1;
    result.wins += won ? 1 : 0;
    result.totalProfit += (won ? 1 : 0) - entryPrice - fee(entryPrice);
  }
  result.winRate = result.markets ? Number((result.wins / result.markets * 100).toFixed(2)) : 0;
  result.averageProfitPerContract = result.markets ? Number((result.totalProfit / result.markets).toFixed(6)) : 0;
  result.totalProfit = Number(result.totalProfit.toFixed(6));
  return result;
}

console.log(JSON.stringify({
  preregistration: "docs/btc-volatility-preregistration.md",
  csvPath,
  totalMarkets: markets.length,
  trainingMarkets: trainingMarkets.length,
  heldOutMarkets: heldOutMarkets.length,
  entryMinute,
  volatilityThreshold,
  feeRate,
  depthImbalance: "not available: candle payload has no bid/ask sizes",
  training: evaluate(trainingMarkets),
  heldOut: evaluate(heldOutMarkets),
}, null, 2));
