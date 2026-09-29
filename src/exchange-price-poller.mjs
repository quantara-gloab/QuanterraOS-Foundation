import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { db, runMigrations, closeDb } from "./db.ts";
import { exchangePrices } from "./schema.ts";

dotenv.config();

const pollIntervalMs = 5000;
const requestTimeoutMs = 10000;
const heartbeatIntervalMs = 300000;
const assets = [
  { asset: "BTC", coinbase: "BTC-USD", kraken: "XBTUSD" },
  { asset: "ETH", coinbase: "ETH-USD", kraken: "ETHUSD" },
  { asset: "SOL", coinbase: "SOL-USD", kraken: "SOLUSD" },
  { asset: "XRP", coinbase: "XRP-USD", kraken: "XRPUSD" },
];

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: { Accept: "application/json", "User-Agent": "quanterraos-foundation-research/1.0" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

// Exchange ticker (real last-trade price), not the /v2/prices spot endpoint, which
// updates far less often and made Coinbase's direction agreement look near-random.
async function fetchCoinbase(product) {
  const data = await fetchJson(`https://api.exchange.coinbase.com/products/${product}/ticker`);
  return Number(data.price);
}

async function fetchKraken(pair) {
  const data = await fetchJson(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
  const ticker = Object.values(data.result)[0];
  return Number(ticker.c[0]);
}

const requests = assets.flatMap((config) => [
  [config.asset, "coinbase", () => fetchCoinbase(config.coinbase)],
  [config.asset, "kraken", () => fetchKraken(config.kraken)],
]);

async function poll() {
  const fetchedAt = Date.now();
  const results = await Promise.allSettled(
    requests.map(async ([asset, exchangeName, fetchPrice]) => ({
      asset,
      exchangeName,
      price: await fetchPrice(),
    })),
  );
  const stored = [];

  for (const result of results) {
    if (result.status === "fulfilled" && Number.isFinite(result.value.price)) {
      const { asset, exchangeName, price } = result.value;
      db.insert(exchangePrices).values({
        id: randomUUID(),
        asset,
        exchangeName,
        price,
        fetchedAt,
      }).run();
      stored.push(`${asset}/${exchangeName}=${price.toFixed(2)}`);
    } else if (result.status === "rejected") {
      console.error(`Exchange price fetch failed: ${result.reason.message}`);
    }
  }

  if (stored.length > 0) {
    console.log(`${fetchedAt} ${stored.join(" ")}`);
  }
}

runMigrations();
let stopping = false;
let pollTimer;
let heartbeatTimer;
let pollsCompleted = 0;

async function runPoll() {
  if (stopping) {
    return;
  }
  try {
    await poll();
    pollsCompleted += 1;
  } catch (error) {
    console.error(`Exchange poll failed: ${error.message}`);
  }
  if (!stopping) {
    pollTimer = setTimeout(runPoll, pollIntervalMs);
  }
}

function stop() {
  stopping = true;
  if (pollTimer) {
    clearTimeout(pollTimer);
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  closeDb();
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);

runPoll();
heartbeatTimer = setInterval(() => {
  console.log(`Poller running, ${pollsCompleted} polls completed so far`);
}, heartbeatIntervalMs);
