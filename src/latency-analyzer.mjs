import fs from "node:fs/promises";

const inputDir = process.env.LATENCY_CAPTURE_DIR ?? "data/latency";
const coinbasePath = `${inputDir}/coinbase-trades.ndjson`;
const kalshiPath = `${inputDir}/kalshi-quotes.ndjson`;
const windowMs = Number(process.env.LATENCY_MOVE_WINDOW_MS ?? 10000);

async function readNdjson(file) {
  const text = await fs.readFile(file, "utf8");
  return text.trim() ? text.trim().split(/\r?\n/).map((line) => JSON.parse(line)) : [];
}

const coinbase = await readNdjson(coinbasePath);
const kalshi = await readNdjson(kalshiPath);
const events = [];
for (let index = 1; index < coinbase.length; index += 1) {
  const move = coinbase[index].price - coinbase[index - 1].price;
  if (move === 0) continue;
  const start = coinbase[index].received_at_ms;
  const match = kalshi.find((quote) => quote.received_at_ms >= start && quote.received_at_ms <= start + windowMs);
  if (match) events.push({
    coinbase_move_ms: start,
    kalshi_quote_ms: match.received_at_ms,
    lag_ms: match.received_at_ms - start,
    price_move: move,
    market_ticker: match.market_ticker,
  });
}
const lags = events.map((event) => event.lag_ms).sort((left, right) => left - right);
const imbalance = kalshi.map((quote) => {
  const denominator = quote.yes_bid_size + quote.yes_ask_size;
  return denominator ? (quote.yes_bid_size - quote.yes_ask_size) / denominator : null;
}).filter((value) => value !== null);
const percentile = (values, fraction) => values.length ? values[Math.min(values.length - 1, Math.floor(values.length * fraction))] : null;
console.log(JSON.stringify({
  coinbaseTrades: coinbase.length,
  kalshiQuotes: kalshi.length,
  matchedMoves: events.length,
  lagMs: {
    median: percentile(lags, 0.5),
    p95: percentile(lags, 0.95),
    minimum: lags[0] ?? null,
    maximum: lags.at(-1) ?? null,
  },
  depthImbalance: {
    samples: imbalance.length,
    median: percentile([...imbalance].sort((left, right) => left - right), 0.5),
  },
}, null, 2));
