import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const collectorPath = path.join(projectRoot, "src", "orderbook-collector.mjs");
const dbPath = process.env.DB_PATH ?? path.join(projectRoot, "quanterraos.db");
const logPath = path.join(projectRoot, "orderbook-watchdog.log");
const collectorOutPath = path.join(projectRoot, "orderbook-collector.out.log");
const collectorErrPath = path.join(projectRoot, "orderbook-collector.err.log");
const validFromPath = path.join(projectRoot, "data", "orderbook-valid-from-ms.txt");
const pollIntervalMs = 30000;
const staleAfterMs = 180000;
const startupGraceMs = 120000;
const restartDelayMs = 5000;
const db = new Database(dbPath, { readonly: true });
const latestSnapshotQuery = db.prepare("SELECT MAX(captured_at) AS captured_at FROM orderbook_snapshots");
const validFromArg = process.argv.indexOf("--valid-from-ms");
const requestedValidFromMs = validFromArg >= 0 ? Number(process.argv[validFromArg + 1]) : null;

fs.mkdirSync(path.dirname(validFromPath), { recursive: true });
if (requestedValidFromMs !== null && (!Number.isSafeInteger(requestedValidFromMs) || requestedValidFromMs <= 0)) {
  throw new Error("--valid-from-ms must be a positive integer timestamp in milliseconds");
}
if (!fs.existsSync(validFromPath)) fs.writeFileSync(validFromPath, `${requestedValidFromMs ?? Date.now()}\n`);

let collector = null;
let restartTimer = null;
let stopping = false;
let staleAlerted = false;

function log(message, alert = false) {
  const line = `${new Date().toISOString()} ${alert ? "ALERT " : ""}${message}\n`;
  fs.appendFileSync(logPath, line);
  if (alert) fs.appendFileSync(path.join(projectRoot, "orderbook-watchdog-alert.txt"), line);
  process.stdout.write(line);
}

function appendOutput(filePath, chunk) {
  fs.appendFileSync(filePath, chunk);
}

function launchCollector() {
  if (stopping || collector) return;
  log("Starting orderbook collector");
  const child = spawn(process.execPath, [collectorPath], {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  collector = child;
  child.stdout.on("data", (chunk) => appendOutput(collectorOutPath, chunk));
  child.stderr.on("data", (chunk) => appendOutput(collectorErrPath, chunk));
  child.once("error", (error) => log(`Collector launch failed: ${error.message}`, true));
  child.once("exit", (code, signal) => {
    if (collector === child) collector = null;
    if (stopping) return;
    log(`Collector exited (code=${code}, signal=${signal}); restarting in ${restartDelayMs}ms`, true);
    restartTimer = setTimeout(launchCollector, restartDelayMs);
  });
}

function monitor() {
  if (stopping) return;
  try {
    const latest = latestSnapshotQuery.get()?.captured_at ?? null;
    const now = Date.now();
    const startupGraceOver = now - Number(fs.readFileSync(validFromPath, "utf8").trim()) > startupGraceMs;
    if (latest !== null && latest >= now - staleAfterMs) {
      staleAlerted = false;
      return;
    }
    if (!startupGraceOver) return;
    if (!staleAlerted) {
      const lastSeen = latest === null ? "none" : new Date(latest).toISOString();
      log(`No fresh orderbook snapshot; latest captured_at=${lastSeen}. Restarting collector.`, true);
      staleAlerted = true;
    }
    if (collector) collector.kill();
  } catch (error) {
    log(`Heartbeat check failed: ${error.message}`, true);
  }
}

function stop() {
  stopping = true;
  if (restartTimer) clearTimeout(restartTimer);
  if (collector) collector.kill();
  db.close();
  log("Watchdog stopped");
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
launchCollector();
setInterval(monitor, pollIntervalMs);