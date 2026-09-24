import crypto from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import WebSocket from "ws";

dotenv.config();

const apiBaseUrl = "https://external-api.kalshi.com";
const balancePath = "/trade-api/v2/portfolio/balance";
const websocketPath = "/trade-api/ws/v2";
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
console.log(`Private key loaded successfully (${privateKey.length} bytes)`);

function signRequest(method, path) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}${method}${path}`;
  const signature = crypto.sign(
    "sha256",
    Buffer.from(message),
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    },
  );
  return {
    "KALSHI-ACCESS-KEY": keyId,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
    "KALSHI-ACCESS-SIGNATURE": signature.toString("base64"),
  };
}

async function checkBalance() {
  const response = await fetch(`${apiBaseUrl}${balancePath}`, {
    method: "GET",
    headers: signRequest("GET", balancePath),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.text();
  try {
    console.log(`Balance response (${response.status}):`);
    console.log(JSON.stringify(JSON.parse(body), null, 2));
  } catch {
    console.log(`Balance response (${response.status}): ${body}`);
  }
}

function checkWebsocket() {
  return new Promise((resolve, reject) => {
    let messageCount = 0;
    const websocket = new WebSocket(`wss://external-api-ws.kalshi.com${websocketPath}`, {
      headers: signRequest("GET", websocketPath),
    });

    websocket.once("open", () => {
      websocket.send(JSON.stringify({
        id: 1,
        cmd: "subscribe",
        params: {
          channels: ["cfbenchmarks_value"],
          index_ids: ["all"],
        },
      }));
    });

    websocket.on("message", (message) => {
      if (messageCount >= 5) {
        return;
      }
      messageCount += 1;
      console.log(message.toString());
      if (messageCount === 5) {
        websocket.close();
        resolve();
      }
    });

    websocket.once("error", reject);
    websocket.once("close", (code, reason) => {
      if (messageCount < 5) {
        reject(new Error(`Websocket closed before 5 messages (${code}): ${reason.toString()}`));
      }
    });
  });
}

try {
  await checkBalance();
  await checkWebsocket();
} catch (error) {
  console.error(`Kalshi feed check failed: ${error.message}`);
  process.exitCode = 1;
}