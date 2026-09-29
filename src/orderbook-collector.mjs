import crypto from "node:crypto";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { db, runMigrations, closeDb } from "./db.ts";
import { orderbookSnapshots } from "./schema.ts";

dotenv.config();

const apiBaseUrl = "https://external-api.kalshi.com";
const pollIntervalMs = 30000;
const requestTimeoutMs = 15000;
const validPriceSumBand = { min: 0.9, max: 1.1 };
const series = {
  BTC: "KXBTC15M",
  ETH: "KXETH15M",
  SOL: "KXSOL15M",
  XRP: "KXXRP15M",
};
const keyId = process.env.KALSHI_KEY_ID;
const configuredKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH;
if (!keyId || !configuredKeyPath) throw new Error("KALSHI_KEY_ID and KALSHI_PRIVATE_KEY_PATH must be set in .env");
const privateKeyPath = configuredKeyPath.replace(/^%USERPROFILE%/i, process.env.USERPROFILE ?? "");
const privateKey = fs.readFileSync(privateKeyPath);

function headers(method, requestPath) {
  const timestamp = Date.now().toString();
  const signature = crypto.sign("sha256", Buffer.from(`${timestamp}${method}${requestPath}`), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString("base64");
  return { "KALSHI-ACCESS-KEY": keyId, "KALSHI-ACCESS-TIMESTAMP": timestamp, "KALSHI-ACCESS-SIGNATURE": signature };
}

async function getJson(requestPath) {
  const response = await fetch(`${apiBaseUrl}${requestPath}`, { headers: headers("GET", requestPath), signal: AbortSignal.timeout(requestTimeoutMs) });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

function metrics(orderbook) {
  const yes = orderbook.yes_dollars ?? [];
  const no = orderbook.no_dollars ?? [];
  const yesLevels = yes.map(([price, size]) => [Number(price), Number(size)]).filter(([price, size]) => Number.isFinite(price) && Number.isFinite(size));
  const noLevels = no.map(([price, size]) => [Number(price), Number(size)]).filter(([price, size]) => Number.isFinite(price) && Number.isFinite(size));
  // Kalshi returns levels sorted ascending by price, so the best (highest) bid is the last entry.
  const bestYesLevel = yesLevels[yesLevels.length - 1];
  const bestNoLevel = noLevels[noLevels.length - 1];
  const yesSize = bestYesLevel?.[1] ?? null;
  const noSize = bestNoLevel?.[1] ?? null;
  const yesTotal = yesLevels.reduce((sum, [, size]) => sum + size, 0);
  const noTotal = noLevels.reduce((sum, [, size]) => sum + size, 0);
  return {
    yesLevels,
    noLevels,
    bestYesPrice: bestYesLevel?.[0] ?? null,
    bestNoPrice: bestNoLevel?.[0] ?? null,
    bestYesSize: yesSize,
    bestNoSize: noSize,
    topImbalance: yesSize === null || noSize === null || yesSize + noSize === 0 ? null : (yesSize - noSize) / (yesSize + noSize),
    depthImbalance: yesTotal + noTotal === 0 ? null : (yesTotal - noTotal) / (yesTotal + noTotal),
  };
}

async function openMarkets(asset, seriesTicker) {
  const query = new URLSearchParams({ series_ticker: seriesTicker, status: "open", limit: "1000" });
  const data = await getJson(`/trade-api/v2/markets?${query}`);
  return (data.markets ?? []).map((market) => market.ticker).filter(Boolean);
}

async function collect() {
  let snapshots = 0;
  let discarded = 0;
  for (const [asset, seriesTicker] of Object.entries(series)) {
    const tickers = await openMarkets(asset, seriesTicker);
    for (const ticker of tickers) {
      const requestPath = `/trade-api/v2/markets/${encodeURIComponent(ticker)}/orderbook?depth=100`;
      const payload = await getJson(requestPath);
      const book = payload.orderbook_fp ?? { yes_dollars: [], no_dollars: [] };
      const values = metrics(book);
      const priceSum = values.bestYesPrice === null || values.bestNoPrice === null
        ? null
        : values.bestYesPrice + values.bestNoPrice;
      // A healthy two-sided market has yes_bid + no_bid close to 1; anything outside
      // this band means the resting quotes are thin/stale and unusable for pricing.
      if (priceSum === null || priceSum < validPriceSumBand.min || priceSum > validPriceSumBand.max) {
        discarded += 1;
        continue;
      }
      db.insert(orderbookSnapshots).values({
        id: randomUUID(), asset, marketTicker: ticker, capturedAt: Date.now(),
        bestYesPrice: values.bestYesPrice, bestNoPrice: values.bestNoPrice,
        bestYesSize: values.bestYesSize, bestNoSize: values.bestNoSize,
        topImbalance: values.topImbalance, depthImbalance: values.depthImbalance,
        yesLevelsJson: JSON.stringify(values.yesLevels), noLevelsJson: JSON.stringify(values.noLevels),
      }).run();
      snapshots += 1;
    }
  }
  console.log(`Orderbook collector: stored ${snapshots} snapshots, discarded ${discarded} (yes_bid+no_bid outside ${validPriceSumBand.min}-${validPriceSumBand.max})`);
}

runMigrations();
let stopping = false;
let timer;
async function run() {
  if (stopping) return;
  try { await collect(); } catch (error) { console.error(`Orderbook collector failed: ${error.message}`); }
  if (!stopping) timer = setTimeout(run, pollIntervalMs);
}
function stop() { stopping = true; if (timer) clearTimeout(timer); closeDb(); }
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
run();
