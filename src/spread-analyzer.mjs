import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DB_PATH ?? "quanterraos.db";
const maxMatchDifferenceMs = 5000;
const assetArg = process.argv.indexOf("--asset") >= 0
  ? process.argv[process.argv.indexOf("--asset") + 1]
  : "BTC";
const sqlite = new Database(dbPath, { readonly: true });

const kalshiTicks = sqlite.prepare(`
  SELECT received_at, CAST(raw_value AS REAL) AS kalshi_brti
  FROM btc_index_ticks
  WHERE raw_value IS NOT NULL AND asset = ?
  ORDER BY received_at
`).all(assetArg);
const exchangeRows = sqlite.prepare(`
  SELECT exchange_name, fetched_at, price
  FROM exchange_prices
  WHERE asset = ?
  ORDER BY fetched_at
`).all(assetArg);

sqlite.close();

const rows = [];
const skippedByExchange = new Map();
for (const exchangeRow of exchangeRows) {
  const nearest = kalshiTicks.reduce((best, tick) => (
    Math.abs(tick.received_at - exchangeRow.fetched_at) < Math.abs(best.received_at - exchangeRow.fetched_at)
      ? tick
      : best
  ));
  const timeDifferenceMs = Math.abs(nearest.received_at - exchangeRow.fetched_at);
  if (timeDifferenceMs > maxMatchDifferenceMs) {
    skippedByExchange.set(
      exchangeRow.exchange_name,
      (skippedByExchange.get(exchangeRow.exchange_name) ?? 0) + 1,
    );
    continue;
  }

  rows.push({
    kalshi_received_at: nearest.received_at,
    kalshi_brti: nearest.kalshi_brti,
    exchange_name: exchangeRow.exchange_name,
    fetched_at: exchangeRow.fetched_at,
    exchange_price: exchangeRow.price,
    time_difference_ms: timeDifferenceMs,
  });
}

const byExchange = new Map();
for (const row of rows) {
  const samples = byExchange.get(row.exchange_name) ?? [];
  samples.push(row);
  byExchange.set(row.exchange_name, samples);
}

console.log(`Asset ${assetArg} matched ticks: ${rows.length}`);
for (const [exchangeName, samples] of byExchange) {
  let spreadTotal = 0;
  let maxSpread = Number.NEGATIVE_INFINITY;
  let directionComparisons = 0;
  let wrongDirection = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const spread = sample.exchange_price - sample.kalshi_brti;
    spreadTotal += spread;
    maxSpread = Math.max(maxSpread, Math.abs(spread));

    if (index === 0) {
      continue;
    }
    const previous = samples[index - 1];
    const kalshiMove = Math.sign(sample.kalshi_brti - previous.kalshi_brti);
    const exchangeMove = Math.sign(sample.exchange_price - previous.exchange_price);
    if (kalshiMove !== 0 && exchangeMove !== 0) {
      directionComparisons += 1;
      if (kalshiMove !== exchangeMove) {
        wrongDirection += 1;
      }
    }
  }

  console.log(JSON.stringify({
    exchange: exchangeName,
    samples: samples.length,
    skippedRows: skippedByExchange.get(exchangeName) ?? 0,
    maxMatchDifferenceMs,
    averageSpread: Number((spreadTotal / samples.length).toFixed(6)),
    maxAbsoluteSpread: Number(maxSpread.toFixed(6)),
    wrongDirection,
    directionComparisons,
    wrongDirectionRate: directionComparisons === 0
      ? 0
      : Number((wrongDirection / directionComparisons * 100).toFixed(2)),
  }, null, 2));
}