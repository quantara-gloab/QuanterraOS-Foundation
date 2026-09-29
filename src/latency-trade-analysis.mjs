import fs from "node:fs";

const inputDir = process.env.LATENCY_CAPTURE_DIR ?? "data/latency";
const coinbase = fs.readFileSync(`${inputDir}/coinbase-trades.ndjson`, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const kalshi = fs.readFileSync(`${inputDir}/kalshi-quotes.ndjson`, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const feeRate = Number(process.env.KALSHI_FEE_RATE ?? 0.07);
const windowMs = 5000;

function fee(price) {
  return feeRate * price * (1 - price);
}

const matched = [];
for (let index = 1; index < coinbase.length; index += 1) {
  const move = coinbase[index].price - coinbase[index - 1].price;
  if (move === 0) continue;
  const moveAt = coinbase[index].received_at_ms;
  const before = [...kalshi].reverse().find((quote) => quote.received_at_ms <= moveAt);
  const after = kalshi.find((quote) => quote.received_at_ms > moveAt && quote.received_at_ms <= moveAt + windowMs);
  if (!before || !after) continue;
  const direction = move > 0 ? "yes" : "no";
  const entryAsk = direction === "yes" ? before.yes_ask : 1 - before.yes_bid;
  const exitBid = direction === "yes" ? after.yes_bid : 1 - after.yes_ask;
  const waitedAsk = direction === "yes" ? after.yes_ask : 1 - after.yes_bid;
  matched.push({
    lagMs: after.received_at_ms - moveAt,
    direction,
    entryAsk,
    waitedAsk,
    exitBid,
    markToAskChange: waitedAsk - entryAsk,
    executableGross: exitBid - entryAsk,
    executableNet: exitBid - entryAsk - fee(entryAsk) - fee(exitBid),
  });
}

function summarize(values) {
  const positive = values.filter((value) => value > 0).length;
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    samples: values.length,
    positive,
    positiveRate: values.length ? Number((positive / values.length * 100).toFixed(2)) : 0,
    average: values.length ? Number((total / values.length).toFixed(6)) : 0,
    total: Number(total.toFixed(6)),
  };
}

console.log(JSON.stringify({
  matchedEvents: matched.length,
  feeModel: "fee = 0.07 * price * (1 - price), applied to entry and exit",
  lagMs: summarize(matched.map((event) => event.lagMs)),
  markToAskChange: summarize(matched.map((event) => event.markToAskChange)),
  executableGross: summarize(matched.map((event) => event.executableGross)),
  executableNet: summarize(matched.map((event) => event.executableNet)),
}, null, 2));
