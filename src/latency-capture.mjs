import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();

const kalshiHost = "https://external-api.kalshi.com";
const kalshiWsHost = "wss://external-api-ws.kalshi.com";
const kalshiPath = "/trade-api/ws/v2";
const seriesTicker = "KXBTC15M";
const durationMs = Number(process.env.LATENCY_CAPTURE_MS ?? 60 * 60 * 1000);
const outputDir = process.env.LATENCY_CAPTURE_DIR ?? "data/latency";
const coinbaseFile = path.join(outputDir, "coinbase-trades.ndjson");
const kalshiFile = path.join(outputDir, "kalshi-quotes.ndjson");
const keyId = process.env.KALSHI_KEY_ID;
const configuredKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH;

if (!keyId || !configuredKeyPath) {
  throw new Error("KALSHI_KEY_ID and KALSHI_PRIVATE_KEY_PATH must be set in .env");
}

const privateKeyPath = configuredKeyPath.replace(/^%USERPROFILE%/i, process.env.USERPROFILE ?? "");
const privateKey = fs.readFileSync(privateKeyPath);
await mkdir(outputDir, { recursive: true });
await writeFile(coinbaseFile, "");
await writeFile(kalshiFile, "");

function signHeaders(method, requestPath) {
  const timestamp = Date.now().toString();
  const signature = crypto.sign("sha256", Buffer.from(`${timestamp}${method}${requestPath}`), {
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

async function getOpenMarkets() {
  const query = new URLSearchParams({ series_ticker: seriesTicker, status: "open", limit: "1000" });
  const requestPath = `/trade-api/v2/markets?${query}`;
  const response = await fetch(`${kalshiHost}${requestPath}`, { headers: signHeaders("GET", requestPath) });
  if (!response.ok) throw new Error(`Kalshi market discovery failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  return (body.markets ?? []).map((market) => market.ticker).filter(Boolean);
}

async function append(file, value) {
  await appendFile(file, `${JSON.stringify(value)}\n`);
}

const marketTickers = await getOpenMarkets();
console.log(`Latency capture: discovered ${marketTickers.length} open ${seriesTicker} markets`);
if (!marketTickers.length) throw new Error(`No open ${seriesTicker} markets found`);

let coinbaseMessages = 0;
let kalshiMessages = 0;
let stopped = false;
const sockets = [];

function startCoinbase() {
  const socket = new WebSocket("wss://ws-feed.exchange.coinbase.com");
  sockets.push(socket);
  socket.once("open", () => {
    socket.send(JSON.stringify({ type: "subscribe", product_ids: ["BTC-USD"], channels: ["matches"] }));
  });
  socket.on("message", async (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.type !== "match" || message.product_id !== "BTC-USD") return;
    coinbaseMessages += 1;
    await append(coinbaseFile, {
      received_at_ms: Date.now(),
      exchange_time: message.time,
      price: Number(message.price),
      size: Number(message.size),
      trade_id: message.trade_id,
    });
  });
  socket.on("error", (error) => console.error(`Coinbase websocket: ${error.message}`));
}

function startKalshi() {
  const socket = new WebSocket(`${kalshiWsHost}${kalshiPath}`, { headers: signHeaders("GET", kalshiPath) });
  sockets.push(socket);
  socket.once("open", () => {
    socket.send(JSON.stringify({
      id: 1,
      cmd: "subscribe",
      params: { channels: ["ticker"], market_tickers: marketTickers },
    }));
  });
  socket.on("message", async (raw) => {
    const message = JSON.parse(raw.toString());
    if (message.type !== "ticker" || !message.msg) return;
    kalshiMessages += 1;
    await append(kalshiFile, {
      received_at_ms: Date.now(),
      ts_ms: message.msg.ts_ms,
      market_ticker: message.msg.market_ticker,
      yes_bid: Number(message.msg.yes_bid_dollars),
      yes_ask: Number(message.msg.yes_ask_dollars),
      yes_bid_size: Number(message.msg.yes_bid_size_fp),
      yes_ask_size: Number(message.msg.yes_ask_size_fp),
    });
  });
  socket.on("error", (error) => console.error(`Kalshi websocket: ${error.message}`));
}

startCoinbase();
startKalshi();
const endAt = Date.now() + durationMs;
const timer = setInterval(() => {
  const remainingMinutes = Math.max(0, Math.ceil((endAt - Date.now()) / 60000));
  console.log(`Latency capture running: Coinbase ${coinbaseMessages}, Kalshi ${kalshiMessages}, about ${remainingMinutes}m remaining`);
}, 5 * 60 * 1000);

function stop() {
  if (stopped) return;
  stopped = true;
  clearInterval(timer);
  for (const socket of sockets) socket.close();
  console.log(JSON.stringify({ coinbaseMessages, kalshiMessages, coinbaseFile, kalshiFile }, null, 2));
}

setTimeout(stop, durationMs).unref();
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
