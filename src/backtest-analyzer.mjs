import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DB_PATH ?? "quanterraos.db";
const maxMatchDifferenceMs = 5000;
const assetArg = process.argv.indexOf("--asset") >= 0
  ? process.argv[process.argv.indexOf("--asset") + 1]
  : "BTC";
const seriesByAsset = { BTC: "KXBTC15M", ETH: "KXETH15M", SOL: "KXSOL15M", XRP: "KXXRP15M" };
const seriesPrefix = seriesByAsset[assetArg];
if (!seriesPrefix) throw new Error(`Unsupported asset: ${assetArg}`);
const sqlite = new Database(dbPath, { readonly: true });
const outcomes = sqlite.prepare(`
  SELECT market_ticker, strike_price, open_time, close_time, result
  FROM market_outcomes
  WHERE asset = ? AND market_ticker LIKE ?
  ORDER BY close_time
`).all(assetArg, `${seriesPrefix}-%`);
const brti = sqlite.prepare(`
  SELECT received_at AS timestamp, CAST(raw_value AS REAL) AS price
  FROM btc_index_ticks
  WHERE raw_value IS NOT NULL AND asset = ?
  ORDER BY received_at
`).all(assetArg);
const exchangeRows = sqlite.prepare(`
  SELECT exchange_name AS exchange, fetched_at AS timestamp, price
  FROM exchange_prices
  WHERE asset = ?
  ORDER BY fetched_at
`).all(assetArg);
sqlite.close();

function nearest(rows, timestamp) {
  if (rows.length === 0) return null;
  return rows.reduce((best, row) => (
    Math.abs(row.timestamp - timestamp) < Math.abs(best.timestamp - timestamp)
      ? row
      : best
  ));
}

function priceAt(rows, timestamp) {
  const row = nearest(rows, timestamp);
  return row && Math.abs(row.timestamp - timestamp) <= maxMatchDifferenceMs ? row : null;
}

const exchanges = [...new Set(exchangeRows.map(row => row.exchange))];
const exchangeByName = new Map(exchanges.map(exchange => [
  exchange,
  exchangeRows.filter(row => row.exchange === exchange),
]));
const scores = new Map([
  ["BRTI", { correct: 0, total: 0, skipped: 0 }],
  ...exchanges.map(exchange => [exchange, { correct: 0, total: 0, skipped: 0 }]),
]);

for (const outcome of outcomes) {
  const openBrti = priceAt(brti, outcome.open_time);
  const closeBrti = priceAt(brti, outcome.close_time);
  const brtiScore = scores.get("BRTI");
  if (!openBrti || !closeBrti) {
    brtiScore.skipped += 1;
  } else {
    const prediction = closeBrti.price >= openBrti.price ? "yes" : "no";
    brtiScore.total += 1;
    if (prediction === outcome.result) brtiScore.correct += 1;
  }

  for (const exchange of exchanges) {
    const prices = exchangeByName.get(exchange);
    const open = priceAt(prices, outcome.open_time);
    const close = priceAt(prices, outcome.close_time);
    const score = scores.get(exchange);
    if (!open || !close) {
      score.skipped += 1;
      continue;
    }
    const prediction = close.price >= open.price ? "yes" : "no";
    score.total += 1;
    if (prediction === outcome.result) score.correct += 1;
  }
}

console.log(JSON.stringify({
  settledMarkets: outcomes.length,
  asset: assetArg,
  maxMatchDifferenceMs,
  methodology: "Signal is YES when close price is at or above open price, otherwise NO; actual result is Kalshi market result.",
  winRates: Object.fromEntries([...scores.entries()].map(([name, score]) => [name, {
    correct: score.correct,
    total: score.total,
    skipped: score.skipped,
    winRate: score.total === 0 ? 0 : Number((score.correct / score.total * 100).toFixed(2)),
  }])),
}, null, 2));
