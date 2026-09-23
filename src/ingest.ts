/**
 * First live data pull. Uses Coinbase's and Kraken's free PUBLIC price
 * endpoints — fine for local testing on your own machine (see the
 * README licensing note: this restriction is about redistributing to
 * paying customers in a live product, not about you running this
 * script yourself right now).
 *
 * Run with: npm run ingest
 *
 * This does three things, in order, so you can watch each one work:
 *   1. Fetches BTC price from two venues
 *   2. Stores both raw ticks in exchange_ticks
 *   3. Computes the composite and stores it in composite_index_ticks
 */
import { randomUUID } from "node:crypto";
import { db, runMigrations } from "./db.ts";
import { exchangeTicks, compositeIndexTicks } from "./schema.ts";
import { computeCompositeIndex, type Tick } from "./index-engine.ts";

runMigrations();

async function fetchCoinbaseBtc(): Promise<Tick> {
  const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot");
  if (!res.ok) throw new Error(`Coinbase request failed: ${res.status}`);
  const data = await res.json();
  return {
    venue: "coinbase",
    asset: "BTC",
    price: Number(data.data.amount),
    volume: 1, // Coinbase's free spot-price endpoint doesn't include volume;
    // treat this venue as unweighted (volume: 1) until a real
    // aggregator feed (which does include volume) replaces this script.
    observedAt: new Date().toISOString(),
  };
}

async function fetchKrakenBtc(): Promise<Tick> {
  const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD");
  if (!res.ok) throw new Error(`Kraken request failed: ${res.status}`);
  const data = await res.json();
  const result = data.result.XXBTZUSD;
  return {
    venue: "kraken",
    asset: "BTC",
    price: Number(result.c[0]), // last trade price
    volume: Number(result.v[1]), // 24h volume — real weighting for this venue
    observedAt: new Date().toISOString(),
  };
}

async function main() {
  console.log("Fetching live BTC price from Coinbase and Kraken...");

  const results = await Promise.allSettled([fetchCoinbaseBtc(), fetchKrakenBtc()]);

  const ticks: Tick[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      ticks.push(result.value);
      console.log(`  ${result.value.venue}: $${result.value.price}`);
    } else {
      console.warn(`  a venue failed: ${result.reason}`);
    }
  }

  if (ticks.length === 0) {
    console.error("Both venues failed — nothing to store. Check your internet connection.");
    process.exit(1);
  }

  for (const tick of ticks) {
    db.insert(exchangeTicks)
      .values({
        id: randomUUID(),
        venue: tick.venue,
        asset: tick.asset,
        price: tick.price,
        volume: tick.volume,
        observedAt: tick.observedAt,
      })
      .run();
  }
  console.log(`Stored ${ticks.length} raw tick(s) in exchange_ticks.`);

  const composite = computeCompositeIndex(ticks);
  if (composite.compositePrice !== null) {
    db.insert(compositeIndexTicks)
      .values({
        id: randomUUID(),
        asset: composite.asset,
        compositePrice: composite.compositePrice,
        venuesUsed: composite.venuesUsed.length,
        venuesRejected: composite.venuesRejected.length,
        computedAt: composite.computedAt,
      })
      .run();
    console.log(
      `Composite BTC price: $${composite.compositePrice.toFixed(2)} ` +
        `(from ${composite.venuesUsed.join(", ")})`
    );
  }
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
