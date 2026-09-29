/**
 * Scores the btc15m-predictor fair-value model against every settled market in
 * the candle CSV, next to the market's own mid-price at the same minute.
 * The model has no fitted parameters, so there is nothing to overfit; the only
 * inputs are Coinbase 1-minute closes up to the scoring minute (no lookahead).
 * Coinbase is a BRTI constituent, not BRTI itself, so the model compares
 * Coinbase now against Coinbase at market open rather than against the strike.
 */
import fs from "node:fs";
import { perMinuteVolatility, probabilityYes, expectedValues } from "./btc15m-predictor.ts";

const csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const spotPath = "data/coinbase-btc-1m.csv";
const volWindowMinutes = 60;
const scoringMinutes = [4, 7, 10, 13];

type Market = { ticker: string; open: number; close: number; strike: number; result: "yes" | "no"; candles: Map<number, { bid: number; ask: number }> };

function loadMarkets(): Market[] {
  const [header, ...lines] = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
  const cols = header.split(",");
  const idx = (name: string) => cols.indexOf(name);
  const markets = new Map<string, Market>();
  for (const line of lines) {
    const v = line.split(",");
    const ticker = v[idx("ticker")];
    const market = markets.get(ticker) ?? {
      ticker, open: Number(v[idx("open_time")]), close: Number(v[idx("close_time")]), strike: Number(v[idx("strike_price")]),
      result: v[idx("result")] as "yes" | "no", candles: new Map(),
    };
    const bid = Number(v[idx("yes_bid")]), ask = Number(v[idx("yes_ask")]);
    if (Number.isFinite(bid) && Number.isFinite(ask) && ask > 0) market.candles.set(Number(v[idx("timestamp")]), { bid, ask });
    markets.set(ticker, market);
  }
  return [...markets.values()].sort((a, b) => a.open - b.open);
}

async function loadSpot(fromSec: number, toSec: number): Promise<Map<number, number>> {
  const closes = new Map<number, number>();
  if (fs.existsSync(spotPath)) {
    for (const line of fs.readFileSync(spotPath, "utf8").trim().split(/\r?\n/).slice(1)) {
      const [t, c] = line.split(",").map(Number);
      closes.set(t, c);
    }
  }
  const have = [...closes.keys()];
  if (have.length && Math.min(...have) <= fromSec && Math.max(...have) >= toSec - 60) return closes;
  // Coinbase public candles: max 300 per request; each row is [start, low, high, open, close, volume].
  for (let start = fromSec; start < toSec; start += 300 * 60) {
    const end = Math.min(toSec, start + 300 * 60);
    const url = `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`;
    const response = await fetch(url, { headers: { "User-Agent": "quanterraos-backtest" }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Coinbase candles ${response.status}: ${await response.text()}`);
    for (const [t, , , , c] of (await response.json()) as number[][]) closes.set(t + 60, c);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  const rows = [...closes.entries()].sort((a, b) => a[0] - b[0]).map(([t, c]) => `${t},${c}`);
  fs.writeFileSync(spotPath, `close_at,close\n${rows.join("\n")}\n`);
  return closes;
}

const brier = (p: number, yes: boolean) => (p - (yes ? 1 : 0)) ** 2;

const markets = loadMarkets();
const spot = await loadSpot(markets[0].open - (volWindowMinutes + 5) * 60, markets.at(-1)!.close + 60);

const report: Record<string, unknown> = {};
for (const minute of scoringMinutes) {
  let n = 0, modelBrier = 0, marketBrier = 0, blendBrier = 0, skipped = 0;
  const trades: number[] = [];
  const split = { first: { n: 0, model: 0, market: 0 }, second: { n: 0, model: 0, market: 0 } };
  markets.forEach((m, i) => {
    const t = m.open + minute * 60;
    const quote = m.candles.get(t);
    const sOpen = spot.get(m.open), sNow = spot.get(t);
    const history: number[] = [];
    for (let s = t - volWindowMinutes * 60; s <= t; s += 60) { const c = spot.get(s); if (c) history.push(c); }
    const sigma = perMinuteVolatility(history);
    if (!quote || !sOpen || !sNow || !sigma || !(m.strike > 0)) { skipped++; return; }
    // Strike = BRTI 60s average at open (verified to ~$0.10), so on Coinbase's scale it is the open price.
    const pModel = probabilityYes({ price: sNow, strike: sOpen, minutesLeft: 15 - minute, sigmaPerMinute: sigma });
    const pMarket = (quote.bid + quote.ask) / 2;
    const yes = m.result === "yes";
    n++;
    modelBrier += brier(pModel, yes);
    marketBrier += brier(pMarket, yes);
    blendBrier += brier((pModel + pMarket) / 2, yes);
    const half = i < markets.length / 2 ? split.first : split.second;
    half.n++; half.model += brier(pModel, yes); half.market += brier(pMarket, yes);
    const ev = expectedValues(pModel, quote.ask, 1 - quote.bid);
    if (ev.yes > 0 || ev.no > 0) {
      const side = ev.yes >= ev.no ? "yes" : "no";
      const price = side === "yes" ? quote.ask : 1 - quote.bid;
      trades.push((side === m.result ? 1 : 0) - price - 0.07 * price * (1 - price));
    }
  });
  const avg = (x: number, k: number) => (k ? Number((x / k).toFixed(4)) : null);
  report[`minute${minute}`] = {
    scored: n, skipped,
    brier: { model: avg(modelBrier, n), market: avg(marketBrier, n), blend50_50: avg(blendBrier, n) },
    brierByHalf: {
      older: { n: split.first.n, model: avg(split.first.model, split.first.n), market: avg(split.first.market, split.first.n) },
      newer: { n: split.second.n, model: avg(split.second.model, split.second.n), market: avg(split.second.market, split.second.n) },
    },
    tradeWhenModelEvPositive: {
      trades: trades.length,
      winRate: trades.length ? Number((trades.filter((p) => p > 0).length / trades.length).toFixed(4)) : null,
      avgProfitPerContract: trades.length ? Number((trades.reduce((a, b) => a + b, 0) / trades.length).toFixed(4)) : null,
    },
  };
}
console.log(JSON.stringify({ markets: markets.length, volWindowMinutes, spotSource: "Coinbase BTC-USD 1m closes", report }, null, 2));
