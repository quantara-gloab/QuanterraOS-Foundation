import crypto from "node:crypto";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { db, runMigrations, closeDb } from "./db.ts";
import { marketOutcomes } from "./schema.ts";

dotenv.config();

const apiBaseUrl = "https://external-api.kalshi.com";
const marketsPath = "/trade-api/v2/markets";
const series = {
  BTC: { ticker: "KXBTC15M", frequency: "fifteen_min" },
  ETH: { ticker: "KXETH15M", frequency: "fifteen_min" },
  SOL: { ticker: "KXSOL15M", frequency: "fifteen_min" },
  XRP: { ticker: "KXXRP15M", frequency: "fifteen_min" },
};
const pollIntervalMs = 60000;
const requestTimeoutMs = 15000;
const keyId = process.env.KALSHI_KEY_ID;
const configuredKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH;

if (!keyId || !configuredKeyPath) {
  throw new Error("KALSHI_KEY_ID and KALSHI_PRIVATE_KEY_PATH must be set in .env");
}

const privateKeyPath = configuredKeyPath.replace(
  /^%USERPROFILE%/i,
  process.env.USERPROFILE ?? "",
);
const privateKey = fs.readFileSync(privateKeyPath);

function signRequest(method, path) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}${method}${path}`;
  const signature = crypto.sign("sha256", Buffer.from(message), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });
  return {
    "KALSHI-ACCESS-KEY": keyId,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
    "KALSHI-ACCESS-SIGNATURE": signature.toString("base64"),
  };
}

async function fetchSettledMarkets(seriesTicker) {
  const maxSettledTs = Math.floor(Date.now() / 1000);
  const query = new URLSearchParams({
    series_ticker: seriesTicker,
    status: "settled",
    max_settled_ts: String(maxSettledTs),
    limit: "1000",
  });
  const path = `${marketsPath}?${query}`;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: signRequest("GET", path),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Kalshi markets request failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function parseMarket(market, asset, fetchedAt) {
  if (!market?.ticker || market.result !== "yes" && market.result !== "no") {
    return null;
  }
  const strike = market.floor_strike ?? market.cap_strike ?? null;
  const openTime = Date.parse(market.open_time);
  const closeTime = Date.parse(market.close_time);
  if (!Number.isFinite(openTime) || !Number.isFinite(closeTime)) {
    return null;
  }
  return {
    id: randomUUID(),
    asset,
    marketTicker: market.ticker,
    strikePrice: strike == null ? null : Number(strike),
    openTime,
    closeTime,
    result: market.result,
    fetchedAt,
  };
}

async function poll() {
  const fetchedAt = Date.now();
  for (const [asset, config] of Object.entries(series)) {
    const payload = await fetchSettledMarkets(config.ticker);
    const markets = Array.isArray(payload.markets) ? payload.markets : [];
    let inserted = 0;
    for (const market of markets) {
      const outcome = parseMarket(market, asset, fetchedAt);
      if (!outcome) continue;
      const result = db.insert(marketOutcomes).values(outcome).onConflictDoNothing({
        target: marketOutcomes.marketTicker,
      }).run();
      inserted += result.changes;
    }
    console.log(`Outcome tracker: ${asset} fetched ${markets.length}, inserted ${inserted} settled ${config.ticker} markets`);
  }
}

runMigrations();
let stopping = false;
let timer;

async function runPoll() {
  if (stopping) return;
  try {
    await poll();
  } catch (error) {
    console.error(`Outcome tracker failed: ${error.message}`);
  }
  if (!stopping) timer = setTimeout(runPoll, pollIntervalMs);
}

function stop() {
  stopping = true;
  if (timer) clearTimeout(timer);
  closeDb();
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
runPoll();
