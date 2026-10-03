import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("quanterraos.db", { readonly: true });

// Check all BTC ticks over all time
const count = db.prepare("SELECT COUNT(*) as n FROM btc_index_ticks WHERE asset = 'BTC'").get();
console.log("Total BTC rows:", count.n);

// Check time range
const range = db.prepare(
  "SELECT MIN(received_at) as earliest, MAX(received_at) as latest FROM btc_index_ticks WHERE asset = 'BTC'"
).get();
console.log("BTC time range:");
console.log("  Earliest:", new Date(range.earliest).toISOString());
console.log("  Latest:", new Date(range.latest).toISOString());
console.log("  Latest age:", Math.round((Date.now() - range.latest) / 60000), "minutes");

// Check last 10 BTC ticks
const latest = db.prepare(
  "SELECT received_at, CAST(raw_value AS REAL) as value FROM btc_index_ticks WHERE asset = 'BTC' ORDER BY received_at DESC LIMIT 10"
).all();

console.log("\nLast 10 BTC ticks:");
for (const row of latest) {
  console.log(`  ${new Date(row.received_at).toISOString()}  ${row.value}`);
}

// Check market_outcomes for KXBTC15M settlements
const settlements = db.prepare(
  "SELECT market_ticker, close_time, result, strike_price FROM market_outcomes WHERE market_ticker LIKE 'KXBTC15M%' ORDER BY close_time DESC LIMIT 20"
).all();
console.log("\nRecent KXBTC15M settlements:", settlements.length);
for (const s of settlements) {
  console.log(`  ${s.market_ticker}  close: ${new Date(s.close_time)}  result: ${s.result}  strike: ${s.strike_price}`);
}

db.close();
