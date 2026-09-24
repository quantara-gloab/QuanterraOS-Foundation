import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { db, runMigrations, closeDb } from "./db.ts";
import { exchangePrices } from "./schema.ts";

dotenv.config();

const pollIntervalMs = 5000;
const requestTimeoutMs = 10000;

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchCoinbase() {
  const data = await fetchJson("https://api.coinbase.com/v2/prices/BTC-USD/spot");
  return Number(data.data.amount);
}

async function fetchKraken() {
  const data = await fetchJson("https://api.kraken.com/0/public/Ticker?pair=XBTUSD");
  const ticker = Object.values(data.result)[0];
  return Number(ticker.c[0]);
}

const exchanges = [
  ["coinbase", fetchCoinbase],
  ["kraken", fetchKraken],
];

async function poll() {
  const fetchedAt = Date.now();
  const results = await Promise.allSettled(
    exchanges.map(async ([exchangeName, fetchPrice]) => ({
      exchangeName,
      price: await fetchPrice(),
    })),
  );
  const stored = [];

  for (const result of results) {
    if (result.status === "fulfilled" && Number.isFinite(result.value.price)) {
      const { exchangeName, price } = result.value;
      db.insert(exchangePrices).values({
        id: randomUUID(),
        exchangeName,
        price,
        fetchedAt,
      }).run();
      stored.push(`${exchangeName}=${price.toFixed(2)}`);
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

async function runPoll() {
  if (stopping) {
    return;
  }
  try {
    await poll();
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
  closeDb();
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);

runPoll();
