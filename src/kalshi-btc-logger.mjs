import crypto from "node:crypto";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import WebSocket from "ws";
import { db, runMigrations, closeDb } from "./db.ts";
import { btcIndexTicks } from "./schema.ts";

dotenv.config();

const websocketPath = "/trade-api/ws/v2";
const websocketUrl = `wss://external-api-ws.kalshi.com${websocketPath}`;
const keyId = process.env.KALSHI_KEY_ID;
const configuredKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH;
const reconnectBaseMs = 1000;
const reconnectMaxMs = 30000;
const heartbeatIntervalMs = 300000;
const websocketSilenceMs = 30000;
const indexAssets = {
  BRTI: "BTC",
  ETHUSD_RTI: "ETH",
  SOLUSD_RTI: "SOL",
  XRPUSD_RTI: "XRP",
  DOGEUSD_RTI: "DOGE",
  AAVEUSD_RTI: "AAVE",
  ADAUSD_RTI: "ADA",
  BCHUSD_RTI: "BCH",
  BNBUSD_RTI: "BNB",
  DOTUSD_RTI: "DOT",
  HBARUSD_RTI: "HBAR",
  HYPEUSD_RTI: "HYPE",
  LINKUSD_RTI: "LINK",
  LTCUSD_RTI: "LTC",
  NEARUSD_RTI: "NEAR",
  SHIBUSD_RTI: "SHIB",
  SUIUSD_RTI: "SUI",
  VVVUSD_RTI: "VVV",
  WLDUSD_RTI: "WLD",
  XLMUSD_RTI: "XLM",
  ZECUSD_RTI: "ZEC",
};

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

function localTimestamp() {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const minutes = String(absoluteOffset % 60).padStart(2, "0");
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .replace("Z", "");
  return `${local}${sign}${hours}:${minutes}`;
}

function parseTick(messageText) {
  let message;
  try {
    message = JSON.parse(messageText);
  } catch {
    return null;
  }

  const indexId = message?.msg?.index_id;
  if (message?.type !== "cfbenchmarks_value" || !indexAssets[indexId]) {
    return null;
  }

  const payload = message.msg;
  let rawValue = payload.data;
  try {
    rawValue = JSON.parse(payload.data).value ?? payload.data;
  } catch {
    // Keep the upstream data string when it is not JSON.
  }

  return {
    id: randomUUID(),
    asset: indexAssets[indexId],
    receivedAt: payload.received_at,
    loggedAt: localTimestamp(),
    rawValue: String(rawValue),
    trailing60sAvg: payload.avg_60s_data?.value == null
      ? null
      : String(payload.avg_60s_data.value),
    rawJson: messageText,
    displayValue: String(rawValue),
    displayTimestamp: String(payload.received_at),
  };
}

function startConnection(onClosed) {
  const websocket = new WebSocket(websocketUrl, {
    headers: signRequest("GET", websocketPath),
  });
  let silenceTimer;
  let closedHandled = false;

  const handleClosed = (code, reason) => {
    if (closedHandled) {
      return;
    }
    closedHandled = true;
    clearTimeout(silenceTimer);
    onClosed(websocket, code, reason);
  };

  const resetSilenceTimer = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      console.error("Kalshi websocket silent for 30 seconds; reconnecting...");
      handleClosed("SILENCE", "no messages received");
      websocket.terminate();
    }, websocketSilenceMs);
  };

  websocket.once("open", () => {
    websocket.send(JSON.stringify({
      id: 1,
      cmd: "subscribe",
      params: {
        channels: ["cfbenchmarks_value"],
        index_ids: ["all"],
      },
    }));
    resetSilenceTimer();
  });

  websocket.on("message", (message) => {
    resetSilenceTimer();
    const tick = parseTick(message.toString());
    if (!tick) {
      return;
    }

    db.insert(btcIndexTicks).values({
      id: tick.id,
      asset: tick.asset,
      receivedAt: tick.receivedAt,
      loggedAt: tick.loggedAt,
      rawValue: tick.rawValue,
      trailing60sAvg: tick.trailing60sAvg,
      rawJson: tick.rawJson,
    }).run();
    ticksCaptured += 1;
    console.log(`${tick.displayTimestamp} ${tick.asset} ${tick.displayValue}`);
  });

  websocket.once("error", (error) => {
    console.error(`Kalshi websocket error: ${error.message}`);
  });
  websocket.once("close", (code, reason) => {
    handleClosed(code, reason.toString());
  });

  return websocket;
}

runMigrations();
let reconnectAttempt = 0;
let stopping = false;
let reconnectTimer;
let heartbeatTimer;
let ticksCaptured = 0;

function connect() {
  if (stopping) {
    return;
  }

  startConnection(() => {
    if (stopping) {
      return;
    }
    const delay = Math.min(
      reconnectBaseMs * 2 ** reconnectAttempt,
      reconnectMaxMs,
    );
    reconnectAttempt += 1;
    console.error("Reconnecting to Kalshi websocket...");
    console.error(`Kalshi websocket closed; reconnecting in ${delay}ms`);
    reconnectTimer = setTimeout(connect, delay);
  });
}

function stop() {
  stopping = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  closeDb();
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);

connect();
heartbeatTimer = setInterval(() => {
  console.log(`Logger running, ${ticksCaptured} ticks captured so far`);
}, heartbeatIntervalMs);
