import { DatabaseSync } from "node:sqlite";
import { probabilityYes, perMinuteVolatility, minuteCloses, type TimestampedPrice, oneTouchFromPriceSeries } from "../src/one-touch.ts";
import { takerFee } from "../src/btc15m-predictor.ts";

const db = new DatabaseSync("quanterraos.db", { readonly: true });

// Get ALL KXBTC15M settlements
const settlements = db.prepare(
  "SELECT market_ticker, strike_price, open_time, close_time, result FROM market_outcomes WHERE market_ticker LIKE 'KXBTC15M%' AND result IS NOT NULL AND result != '' ORDER BY close_time"
).all();

console.log("Total KXBTC15M settlements:", settlements.length);

// Result distribution
const results = settlements.reduce((acc: Record<string, number>, s: Record<string, unknown>) => {
  const result = s.result as string;
  acc[result] = (acc[result] || 0) + 1;
  return acc;
}, {});
console.log("Result distribution:", JSON.stringify(results));

// Check time ranges
console.log("First settlement:", new Date((settlements[0] as { close_time: number }).close_time).toISOString());
console.log("Last settlement:", new Date((settlements[settlements.length - 1] as { close_time: number }).close_time).toISOString());

// BTC tick time range
const btcRange = db.prepare(
  "SELECT MIN(received_at) as earliest, MAX(received_at) as latest FROM btc_index_ticks WHERE asset = 'BTC'"
).get();
console.log("\nBTC tick range:", new Date(btcRange.earliest).toISOString(), "to", new Date(btcRange.latest).toISOString());

// For each settlement, get ticks before close_time (no-lookahead)
interface SettlementWithTicks {
  market_ticker: string;
  strike_price: number;
  open_time: number;
  close_time: number;
  result: string;
  ticks: TimestampedPrice[];
  tickCount: number;
}

const resultsWithTicks: SettlementWithTicks[] = settlements.map((m: {
  market_ticker: string;
  strike_price: number;
  open_time: number;
  close_time: number;
  result: string;
}) => {
  const closeMs = m.close_time;
  const openMs = m.open_time;

  const ticks = db.prepare(
    "SELECT received_at AS at, CAST(raw_value AS REAL) AS value FROM btc_index_ticks WHERE asset = 'BTC' AND received_at >= ? AND received_at < ? ORDER BY received_at ASC"
  ).all(openMs - 5 * 60_000, closeMs).map((t: { at: number; value: number }) => ({
    at: t.at,
    value: t.value,
  })).filter((t) => Number.isFinite(t.value) && t.value > 0) as TimestampedPrice[];

  return {
    ...m,
    ticks,
    tickCount: ticks.length,
  };
});

const withTicks = resultsWithTicks.filter((r) => r.tickCount >= 10);
console.log("\nContracts with enough BTC tick data (>=10):", withTicks.length);

const tickCounts = withTicks.map((r) => r.tickCount);
console.log("Min ticks:", Math.min(...tickCounts));
console.log("Max ticks:", Math.max(...tickCounts));
console.log("Avg ticks:", Math.round(tickCounts.reduce((a, b) => a + b, 0) / tickCounts.length));

// Sample a few
console.log("\nSample settlements with ticks:");
for (const r of withTicks.slice(0, 5)) {
  console.log(`  ${r.market_ticker}  close: ${new Date(r.close_time).toISOString()}  result: ${r.result}  strike: ${r.strike_price}  ticks: ${r.tickCount}`);
}

db.close();
