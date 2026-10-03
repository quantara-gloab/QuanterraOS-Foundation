import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("quanterraos.db", { readonly: true });

// Check raw data in btc_index_ticks
const latest = db.prepare(
  "SELECT id, received_at, logged_at, raw_value, CAST(raw_value AS REAL) as value, asset FROM btc_index_ticks ORDER BY received_at DESC LIMIT 20"
).all();

console.log("Latest btc_index_ticks rows:");
console.log(JSON.stringify(latest, null, 2));

// Check column types
console.log("\nColumn info:");
const cols = db.prepare("PRAGMA table_info(btc_index_ticks)").all();
console.log(cols);

db.close();
