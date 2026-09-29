// Additive fill: fetch candles only for settled KXBTC15M markets in market_outcomes
// that have no rows in the candle CSV, and append them. Existing rows are never rewritten.
import crypto from "node:crypto";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import dotenv from "dotenv";

dotenv.config();

const apiBaseUrl = "https://external-api.kalshi.com";
const apiPrefix = "/trade-api/v2";
const seriesTicker = "KXBTC15M";
const csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const dbPath = process.env.DB_PATH ?? "quanterraos.db";
const requestSpacingMs = 250;
const headers = ["ticker", "timestamp", "yes_bid", "yes_ask", "volume", "result", "open_time", "close_time", "strike_price", "source"];

const keyId = process.env.KALSHI_KEY_ID;
const configuredKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH;
if (!keyId || !configuredKeyPath) throw new Error("KALSHI_KEY_ID and KALSHI_PRIVATE_KEY_PATH must be set in .env");
const privateKey = fs.readFileSync(configuredKeyPath.replace(/^%USERPROFILE%/i, process.env.USERPROFILE ?? ""));

function signHeaders(method, pathWithQuery) {
  const timestamp = Date.now().toString();
  const signature = crypto.sign("sha256", Buffer.from(`${timestamp}${method}${pathWithQuery.split("?")[0]}`), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString("base64");
  return { "KALSHI-ACCESS-KEY": keyId, "KALSHI-ACCESS-TIMESTAMP": timestamp, "KALSHI-ACCESS-SIGNATURE": signature };
}

async function getJson(pathWithQuery) {
  await new Promise((resolve) => setTimeout(resolve, requestSpacingMs));
  const response = await fetch(`${apiBaseUrl}${pathWithQuery}`, {
    headers: signHeaders("GET", pathWithQuery),
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.text();
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return getJson(pathWithQuery);
  }
  if (!response.ok) throw new Error(`${response.status} ${body}`);
  return JSON.parse(body);
}

const unixSeconds = (value) => Math.floor(new Date(value).getTime() / 1000);

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csvText = fs.readFileSync(csvPath, "utf8");
const [headerLine, ...existingLines] = csvText.trim().split(/\r?\n/);
if (headerLine !== headers.join(",")) throw new Error(`Unexpected CSV header: ${headerLine}`);
const existingTickers = new Set(existingLines.map((line) => line.split(",")[0]));

const db = new DatabaseSync(dbPath, { readOnly: true });
const outcomes = db.prepare(
  "SELECT market_ticker, result FROM market_outcomes WHERE asset = 'BTC' AND result IN ('yes','no') AND market_ticker LIKE ? ORDER BY close_time",
).all(`${seriesTicker}-%`);
db.close();

const missing = outcomes.filter((row) => !existingTickers.has(row.market_ticker));
console.log(`Settled ${seriesTicker} outcomes in DB: ${outcomes.length}; already in CSV: ${outcomes.length - missing.length}; to fetch: ${missing.length}`);

const cutoff = unixSeconds((await getJson(`${apiPrefix}/historical/cutoff`)).market_settled_ts);
const report = { appended: [], empty: [], failed: [], resultMismatch: [] };
const newLines = [];

for (const [index, outcome] of missing.entries()) {
  const ticker = outcome.market_ticker;
  try {
    let market;
    let historical = false;
    try {
      market = (await getJson(`${apiPrefix}/markets/${encodeURIComponent(ticker)}`)).market;
    } catch {
      market = (await getJson(`${apiPrefix}/historical/markets/${encodeURIComponent(ticker)}`)).market;
      historical = true;
    }
    const openSeconds = unixSeconds(market.open_time);
    const closeSeconds = unixSeconds(market.close_time);
    historical ||= unixSeconds(market.settlement_ts ?? market.close_time) < cutoff;
    if (market.result !== outcome.result) report.resultMismatch.push({ ticker, db: outcome.result, api: market.result });

    const endpoint = historical
      ? `${apiPrefix}/historical/markets/${encodeURIComponent(ticker)}/candlesticks`
      : `${apiPrefix}/series/${seriesTicker}/markets/${encodeURIComponent(ticker)}/candlesticks`;
    const query = new URLSearchParams({ start_ts: String(openSeconds), end_ts: String(closeSeconds), period_interval: "1" });
    const candles = (await getJson(`${endpoint}?${query}`)).candlesticks ?? [];
    if (!candles.length) {
      report.empty.push(ticker);
      continue;
    }
    for (const candle of candles) {
      const row = {
        ticker,
        timestamp: candle.end_period_ts,
        yes_bid: candle.yes_bid?.close_dollars ?? candle.yes_bid?.close ?? "",
        yes_ask: candle.yes_ask?.close_dollars ?? candle.yes_ask?.close ?? "",
        volume: candle.volume_fp ?? candle.volume ?? "",
        result: market.result,
        open_time: openSeconds,
        close_time: closeSeconds,
        strike_price: market.floor_strike ?? market.cap_strike ?? "",
        source: historical ? "historical" : "live",
      };
      newLines.push(headers.map((key) => csvEscape(row[key])).join(","));
    }
    report.appended.push(ticker);
  } catch (error) {
    report.failed.push({ ticker, error: error.message.slice(0, 200) });
  }
  if ((index + 1) % 50 === 0) console.log(`Processed ${index + 1}/${missing.length}`);
}

if (newLines.length) {
  const prefix = csvText.endsWith("\n") ? "" : "\n";
  fs.appendFileSync(csvPath, `${prefix}${newLines.join("\n")}\n`);
}

const finalTickers = new Set(fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/).slice(1).map((line) => line.split(",")[0]));
console.log(JSON.stringify({
  csvPath,
  outcomesInDb: outcomes.length,
  tickersBefore: existingTickers.size,
  attempted: missing.length,
  appendedMarkets: report.appended.length,
  appendedRows: newLines.length,
  emptyCandleMarkets: report.empty,
  failed: report.failed,
  resultMismatch: report.resultMismatch,
  tickersAfter: finalTickers.size,
  shortfallVsDb: outcomes.length - finalTickers.size,
}, null, 2));
