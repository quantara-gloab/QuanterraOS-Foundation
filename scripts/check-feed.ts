import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("quanterraos.db");

// Check market_outcomes columns
const cols = db.prepare("PRAGMA table_info(market_outcomes)").all();
console.log("market_outcomes columns:", cols.map((c: { name: string }) => c.name).join(", "));

// Check for BTC contracts
const btcMarkets = db.prepare(
  "SELECT * FROM market_outcomes WHERE market_ticker LIKE 'KXBTC%' ORDER BY close_time DESC LIMIT 10"
).all();
console.log("\nBTC market_outcomes:");
console.log(JSON.stringify(btcMarkets, null, 2));

// Check for any HIGH contracts
const highMarkets = db.prepare(
  "SELECT * FROM market_outcomes WHERE market_ticker LIKE '%HIGH' ORDER BY close_time DESC LIMIT 5"
).all();
console.log("\nHIGH markets:");
console.log(JSON.stringify(highMarkets, null, 2));

db.close();
