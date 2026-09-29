import fs from "node:fs/promises";
import dotenv from "dotenv";

dotenv.config();

const csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const productId = "BTC-USD";
const granularity = 60;
const chunkSeconds = 300 * granularity;
const requestSpacingMs = 250;
const entryMinute = 4;
const feeRate = Number(process.env.KALSHI_FEE_RATE ?? 0.07);
const bootstrapIterations = 1000;

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

async function fetchCandles(start, end) {
  await new Promise((resolve) => setTimeout(resolve, requestSpacingMs));
  const url = new URL(`https://api.exchange.coinbase.com/products/${productId}/candles`);
  url.searchParams.set("granularity", String(granularity));
  url.searchParams.set("start", new Date(start * 1000).toISOString());
  url.searchParams.set("end", new Date(end * 1000).toISOString());
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Coinbase ${response.status}: ${await response.text()}`);
  return response.json();
}

const rows = parseCsv(await fs.readFile(csvPath, "utf8"));
const markets = [...new Map(rows.map((row) => [row.ticker, {
  ticker: row.ticker,
  openTime: Number(row.open_time),
  result: row.result,
  candles: rows.filter((candidate) => candidate.ticker === row.ticker).map((candidate) => ({
    timestamp: Number(candidate.timestamp),
    yesBid: Number(candidate.yes_bid),
    yesAsk: Number(candidate.yes_ask),
  })),
}])).values()].sort((left, right) => left.openTime - right.openTime);
const start = Math.min(...markets.map((market) => market.openTime)) - 600;
const end = Math.max(...markets.map((market) => market.openTime + 15 * 60)) + 600;
const candles = new Map();
for (let cursor = start; cursor < end; cursor += chunkSeconds) {
  const chunk = await fetchCandles(cursor, Math.min(cursor + chunkSeconds, end));
  for (const [timestamp, low, high, open, close, volume] of chunk) {
    candles.set(Number(timestamp), { timestamp: Number(timestamp), open: Number(open), close: Number(close), volume: Number(volume) });
  }
  console.log(`Coinbase candles fetched through ${new Date(Math.min(cursor + chunkSeconds, end) * 1000).toISOString()}`);
}

function nearestCandle(timestamp) {
  let best = null;
  for (const candle of candles.values()) {
    if (!best || Math.abs(candle.timestamp - timestamp) < Math.abs(best.timestamp - timestamp)) best = candle;
  }
  return best;
}

function signalFor(market) {
  const boundary = market.openTime + entryMinute * 60;
  const current = nearestCandle(boundary - 60);
  const previous = nearestCandle(boundary - 120);
  if (!current || !previous || Math.abs(current.timestamp - (boundary - 60)) > 60 || Math.abs(previous.timestamp - (boundary - 120)) > 60) return null;
  const move = current.close - previous.close;
  if (move === 0) return null;
  const entryTarget = market.openTime + 4 * 60;
  const entry = market.candles.reduce((best, candle) => Math.abs(candle.timestamp - entryTarget) < Math.abs(best.timestamp - entryTarget) ? candle : best, market.candles[0]);
  if (!entry || Math.abs(entry.timestamp - entryTarget) > 60 || !Number.isFinite(entry.yesBid) || !Number.isFinite(entry.yesAsk)) return null;
  return { prediction: move > 0 ? "yes" : "no", move, entryPrice: move > 0 ? entry.yesAsk : 1 - entry.yesBid };
}

function evaluate(subset) {
  let total = 0;
  let correct = 0;
  let profit = 0;
  let skipped = 0;
  for (const market of subset) {
    const signal = signalFor(market);
    if (!signal) { skipped += 1; continue; }
    total += 1;
    const won = signal.prediction === market.result;
    correct += won ? 1 : 0;
    profit += (won ? 1 : 0) - signal.entryPrice - feeRate * signal.entryPrice * (1 - signal.entryPrice);
  }
  return {
    correct,
    total,
    skipped,
    winRate: total ? Number((correct / total * 100).toFixed(2)) : 0,
    averageProfitPerContract: total ? Number((profit / total).toFixed(6)) : 0,
    totalProfit: Number(profit.toFixed(6)),
  };
}

function heldOutProfits(subset) {
  const profits = [];
  for (const market of subset) {
    const signal = signalFor(market);
    if (!signal) continue;
    const won = signal.prediction === market.result;
    profits.push((won ? 1 : 0) - signal.entryPrice - feeRate * signal.entryPrice * (1 - signal.entryPrice));
  }
  return profits;
}

function bootstrapInterval(samples) {
  const totals = [];
  for (let iteration = 0; iteration < bootstrapIterations; iteration += 1) {
    let total = 0;
    for (let index = 0; index < samples.length; index += 1) total += samples[Math.floor(Math.random() * samples.length)];
    totals.push(total);
  }
  totals.sort((left, right) => left - right);
  return { low: Number(totals[Math.floor(bootstrapIterations * 0.025)].toFixed(6)), high: Number(totals[Math.floor(bootstrapIterations * 0.975)].toFixed(6)) };
}

const split = Math.floor(markets.length / 2);
const heldOutProfitsForBootstrap = heldOutProfits(markets.slice(split));
console.log(JSON.stringify({
  productId,
  markets: markets.length,
  trainMarkets: split,
  heldOutMarkets: markets.length - split,
  signal: "Coinbase one-minute close change immediately before the minute-4 boundary; exact 10-30-second resolution is unavailable from the public candle API",
  feeModel: "0.07 * actual_entry_price * (1 - actual_entry_price)",
  training: evaluate(markets.slice(0, split)),
  heldOut: evaluate(markets.slice(split)),
  heldOutBootstrap: { iterations: bootstrapIterations, samples: heldOutProfitsForBootstrap.length, totalProfit: Number(heldOutProfitsForBootstrap.reduce((sum, value) => sum + value, 0).toFixed(6)), confidenceInterval95: bootstrapInterval(heldOutProfitsForBootstrap) },
}, null, 2));
