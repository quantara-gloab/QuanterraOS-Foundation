import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const apiBaseUrl = "https://external-api.kalshi.com";
const apiPrefix = "/trade-api/v2";
const seriesTicker = process.env.KALSHI_BACKTEST_SERIES ?? "KXBTC15M";
const months = Number(process.env.KALSHI_BACKTEST_MONTHS ?? 3);
const feeRate = Number(process.env.KALSHI_FEE_RATE ?? 0.07);
const outputPath = process.env.KALSHI_BACKTEST_CSV ?? path.join("data", "kalshi-btc15m-candles.csv");
const requestTimeoutMs = 20000;
const pageSize = 1000;
const concurrency = 1;
const requestSpacingMs = 250;
const keyId = process.env.KALSHI_KEY_ID;
const configuredKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH;

if (!keyId || !configuredKeyPath) {
  throw new Error("KALSHI_KEY_ID and KALSHI_PRIVATE_KEY_PATH must be set in .env");
}

const privateKeyPath = configuredKeyPath.replace(/^%USERPROFILE%/i, process.env.USERPROFILE ?? "");
const privateKey = await fs.readFile(privateKeyPath);

function signHeaders(method, pathWithQuery) {
  const timestamp = Date.now().toString();
  const signature = crypto.sign("sha256", Buffer.from(`${timestamp}${method}${pathWithQuery}`), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString("base64");
  return {
    "KALSHI-ACCESS-KEY": keyId,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
    "KALSHI-ACCESS-SIGNATURE": signature,
  };
}

async function getJson(pathWithQuery) {
  await new Promise((resolve) => setTimeout(resolve, requestSpacingMs));
  const response = await fetch(`${apiBaseUrl}${pathWithQuery}`, {
    headers: signHeaders("GET", pathWithQuery),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const body = await response.text();
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return getJson(pathWithQuery);
  }
  if (!response.ok) throw new Error(`${response.status} ${body}`);
  return JSON.parse(body);
}

function unixSeconds(value) {
  return Math.floor(new Date(value).getTime() / 1000);
}

async function getCutoff() {
  const data = await getJson(`${apiPrefix}/historical/cutoff`);
  return {
    marketSettledTs: unixSeconds(data.market_settled_ts),
    raw: data,
  };
}

async function listMarkets(route, extraQuery) {
  const markets = [];
  let cursor = "";
  do {
    const query = new URLSearchParams({ ...extraQuery, limit: String(pageSize) });
    if (cursor) query.set("cursor", cursor);
    const data = await getJson(`${apiPrefix}/${route}?${query}`);
    markets.push(...(data.markets ?? []));
    cursor = data.cursor ?? "";
    console.log(`Market discovery ${route}: ${markets.length}`);
  } while (cursor);
  return markets;
}

async function discoverMarkets(cutoff, startSeconds, endSeconds) {
  const common = { series_ticker: seriesTicker };
  const live = await listMarkets("markets", {
    ...common,
    status: "settled",
    min_settled_ts: String(Math.max(startSeconds, cutoff.marketSettledTs)),
    max_settled_ts: String(endSeconds),
  });
  const archived = startSeconds < cutoff.marketSettledTs
    ? await listMarkets("historical/markets", common)
    : [];
  const all = [...live, ...archived].filter((market) => {
    const settled = market.settlement_ts ? unixSeconds(market.settlement_ts) : 0;
    return market.result === "yes" || market.result === "no"
      ? settled >= startSeconds && settled <= endSeconds
      : false;
  });
  const unique = new Map(all.map((market) => [market.ticker, market]));
  return [...unique.values()].sort((left, right) => Date.parse(left.close_time) - Date.parse(right.close_time));
}

function endpointFor(market, cutoff) {
  const settledSeconds = unixSeconds(market.settlement_ts ?? market.close_time);
  return settledSeconds < cutoff.marketSettledTs
    ? `${apiPrefix}/historical/markets/${encodeURIComponent(market.ticker)}/candlesticks`
    : `${apiPrefix}/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(market.ticker)}/candlesticks`;
}

async function fetchCandles(market, cutoff) {
  const openSeconds = unixSeconds(market.open_time);
  const closeSeconds = unixSeconds(market.close_time);
  const query = new URLSearchParams({
    start_ts: String(openSeconds),
    end_ts: String(closeSeconds),
    period_interval: "1",
  });
  const data = await getJson(`${endpointFor(market, cutoff)}?${query}`);
  return (data.candlesticks ?? []).map((candle) => ({
    ticker: market.ticker,
    timestamp: candle.end_period_ts,
    yes_bid: candle.yes_bid?.close_dollars ?? candle.yes_bid?.close ?? "",
    yes_ask: candle.yes_ask?.close_dollars ?? candle.yes_ask?.close ?? "",
    volume: candle.volume_fp ?? candle.volume ?? "",
    result: market.result,
    open_time: openSeconds,
    close_time: closeSeconds,
    strike_price: market.floor_strike ?? market.cap_strike ?? "",
    source: endpointFor(market, cutoff).includes("historical") ? "historical" : "live",
  }));
}

async function mapWithConcurrency(items, worker) {
  const output = [];
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return output;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(rows) {
  const headers = ["ticker", "timestamp", "yes_bid", "yes_ask", "volume", "result", "open_time", "close_time", "strike_price", "source"];
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((key) => csvEscape(row[key])).join(","));
  return fs.mkdir(path.dirname(outputPath), { recursive: true })
    .then(() => fs.writeFile(outputPath, `${lines.join("\n")}\n`));
}

function priceNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function feeDollars(price) {
  return feeRate * price * (1 - price);
}

function evaluateEntry(candles, minute) {
  if (candles.length === 0) return null;
  const target = candles[0].open_time + minute * 60;
  const candle = candles.reduce((best, row) => Math.abs(row.timestamp - target) < Math.abs(best.timestamp - target) ? row : best, candles[0]);
  if (!candle || Math.abs(candle.timestamp - target) > 60) return null;
  const bid = priceNumber(candle.yes_bid);
  const ask = priceNumber(candle.yes_ask);
  if (bid === null || ask === null) return null;
  const yesMid = (bid + ask) / 2;
  const side = yesMid >= 0.5 ? "yes" : "no";
  const entryPrice = side === "yes" ? ask : 1 - bid;
  const payout = (side === candle.result) ? 1 : 0;
  const profit = payout - entryPrice - feeDollars(entryPrice);
  return { side, entryPrice, payout, fee: feeDollars(entryPrice), profit, timestamp: candle.timestamp };
}

function backtest(markets, candlesByTicker) {
  const summary = { minute2: { markets: 0, wins: 0, profit: 0 }, minute13: { markets: 0, wins: 0, profit: 0 } };
  for (const market of markets) {
    const candles = candlesByTicker.get(market.ticker) ?? [];
    for (const [label, minute] of [["minute2", 2], ["minute13", 13]]) {
      const result = evaluateEntry(candles, minute);
      if (!result) continue;
      summary[label].markets += 1;
      summary[label].wins += result.payout === 1 ? 1 : 0;
      summary[label].profit += result.profit;
    }
  }
  for (const result of Object.values(summary)) {
    result.winRate = result.markets ? Number((result.wins / result.markets * 100).toFixed(2)) : 0;
    result.averageProfitPerContract = result.markets ? Number((result.profit / result.markets).toFixed(6)) : 0;
    result.totalProfit = Number(result.profit.toFixed(6));
  }
  return summary;
}

const endSeconds = Math.floor(Date.now() / 1000);
const startSeconds = endSeconds - Math.round(months * 30 * 24 * 60 * 60);
console.log(`Fetching ${seriesTicker} settled markets from ${new Date(startSeconds * 1000).toISOString()} onward`);
const cutoff = await getCutoff();
console.log(`Historical market_settled_ts: ${new Date(cutoff.marketSettledTs * 1000).toISOString()}`);
const markets = await discoverMarkets(cutoff, startSeconds, endSeconds);
console.log(`Settled markets found: ${markets.length}`);
const candleArrays = await mapWithConcurrency(markets, async (market, index) => {
  try {
    const candles = await fetchCandles(market, cutoff);
    if ((index + 1) % 25 === 0) console.log(`Candlesticks fetched: ${index + 1}/${markets.length}`);
    return candles;
  } catch (error) {
    console.error(`Candlestick fetch failed for ${market.ticker}: ${error.message}`);
    return [];
  }
});
const rows = candleArrays.flat();
await writeCsv(rows);
const candlesByTicker = new Map();
for (const row of rows) candlesByTicker.set(row.ticker, [...(candlesByTicker.get(row.ticker) ?? []), row]);
const summary = backtest(markets, candlesByTicker);
console.log(JSON.stringify({ seriesTicker, months, outputPath, markets: markets.length, candleRows: rows.length, feeModel: "fee = 0.07 * entry_price * (1 - entry_price)", summary }, null, 2));
