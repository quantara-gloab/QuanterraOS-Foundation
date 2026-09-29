/**
 * Fitted fair-value model vs. market price, chronological walk-forward.
 *
 * Features at each checkpoint minute (no lookahead; Coinbase 1m closes up to that minute):
 *   z = ln(S/S_open) / (σ·√τ), ln(S/S_open)·1e3, σ·1e3
 * Variant A fits logistic regression on those alone. Variant B adds logit(market mid)
 * to test whether the features carry information the price doesn't already have.
 *
 * Verdict rule, fixed before running:
 *   tradable   — beats market Brier on every fold AND pooled held-out Brier-difference
 *                95% CI < 0 AND pooled held-out trading profit 95% CI > 0 after fees
 *   not proven — beats market on pooled Brier but fails any of the above
 *   no edge    — does not beat market on pooled held-out Brier
 */
import fs from "node:fs";
import { perMinuteVolatility, takerFee } from "./btc15m-predictor.ts";

const csvPath = "data/kalshi-btc15m-candles.csv";
const spotPath = "data/coinbase-btc-1m.csv";
const checkpoints = [4, 7, 10, 13];
const trainFractions = [0.5, 0.6, 0.7, 0.8, 0.9];
const foldWidth = 0.1;
const bootstrapSeeds = [1, 2, 3, 4, 5];
const bootstrapResamples = 2000;

type Row = { x: number[]; marketP: number; yes: boolean; yesAsk: number; noAsk: number };

function loadMarkets() {
  const [header, ...lines] = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
  const cols = header.split(",");
  const at = (name: string) => cols.indexOf(name);
  const markets = new Map<string, { open: number; result: string; quotes: Map<number, { bid: number; ask: number }> }>();
  for (const line of lines) {
    const v = line.split(",");
    const m = markets.get(v[at("ticker")]) ?? { open: Number(v[at("open_time")]), result: v[at("result")], quotes: new Map() };
    const bid = Number(v[at("yes_bid")]), ask = Number(v[at("yes_ask")]);
    if (Number.isFinite(bid) && Number.isFinite(ask) && ask > 0) m.quotes.set(Number(v[at("timestamp")]), { bid, ask });
    markets.set(v[at("ticker")], m);
  }
  return [...markets.values()].sort((a, b) => a.open - b.open);
}

function loadSpot() {
  if (!fs.existsSync(spotPath)) throw new Error(`Missing ${spotPath}; run src/btc15m-predictor-backtest.ts once to download it.`);
  const closes = new Map<number, number>();
  for (const line of fs.readFileSync(spotPath, "utf8").trim().split(/\r?\n/).slice(1)) {
    const [t, c] = line.split(",").map(Number);
    closes.set(t, c);
  }
  return closes;
}

const clampP = (p: number) => Math.min(0.999, Math.max(0.001, p));
const logit = (p: number) => Math.log(clampP(p) / (1 - clampP(p)));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Ridge-regularized logistic regression via Newton/IRLS on standardized features. */
function fitLogistic(rows: Row[], useMarket: boolean) {
  const feats = (r: Row) => (useMarket ? [...r.x, logit(r.marketP)] : r.x);
  const k = feats(rows[0]).length;
  const mean = Array(k).fill(0), sd = Array(k).fill(0);
  for (const r of rows) feats(r).forEach((v, j) => (mean[j] += v / rows.length));
  for (const r of rows) feats(r).forEach((v, j) => (sd[j] += (v - mean[j]) ** 2 / rows.length));
  for (let j = 0; j < k; j++) sd[j] = Math.sqrt(sd[j]) || 1;
  const design = (r: Row) => [1, ...feats(r).map((v, j) => (v - mean[j]) / sd[j])];
  const w = Array(k + 1).fill(0);
  const lambda = 1e-3;
  for (let iter = 0; iter < 50; iter++) {
    const grad = Array(k + 1).fill(0);
    const hess = Array.from({ length: k + 1 }, () => Array(k + 1).fill(0));
    for (const r of rows) {
      const x = design(r);
      const p = sigmoid(x.reduce((s, v, j) => s + v * w[j], 0));
      const err = p - (r.yes ? 1 : 0);
      for (let a = 0; a <= k; a++) {
        grad[a] += err * x[a];
        for (let b = 0; b <= k; b++) hess[a][b] += p * (1 - p) * x[a] * x[b];
      }
    }
    for (let a = 1; a <= k; a++) { grad[a] += lambda * w[a]; hess[a][a] += lambda; }
    const step = solve(hess, grad);
    let moved = 0;
    for (let a = 0; a <= k; a++) { w[a] -= step[a]; moved = Math.max(moved, Math.abs(step[a])); }
    if (moved < 1e-9) break;
  }
  return (r: Row) => clampP(sigmoid(design(r).reduce((s, v, j) => s + v * w[j], 0)));
}

function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    [m[c], m[pivot]] = [m[pivot], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let j = c; j <= n; j++) m[r][j] -= f * m[c][j];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Widest (most conservative) 95% percentile CI of the mean across bootstrap seeds. */
function bootstrapCi(values: number[]) {
  if (values.length < 2) return null;
  let lo = Infinity, hi = -Infinity;
  for (const seed of bootstrapSeeds) {
    const rand = mulberry32(seed);
    const means: number[] = [];
    for (let b = 0; b < bootstrapResamples; b++) {
      let sum = 0;
      for (let i = 0; i < values.length; i++) sum += values[Math.floor(rand() * values.length)];
      means.push(sum / values.length);
    }
    means.sort((x, y) => x - y);
    lo = Math.min(lo, means[Math.floor(0.025 * bootstrapResamples)]);
    hi = Math.max(hi, means[Math.floor(0.975 * bootstrapResamples)]);
  }
  return [Number(lo.toFixed(5)), Number(hi.toFixed(5))];
}

const brier = (p: number, yes: boolean) => (p - (yes ? 1 : 0)) ** 2;
const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN);
const r4 = (x: number) => Number(x.toFixed(4));

function tradeProfit(p: number, r: Row): number | null {
  const evYes = p - r.yesAsk - takerFee(r.yesAsk);
  const evNo = 1 - p - r.noAsk - takerFee(r.noAsk);
  if (evYes <= 0 && evNo <= 0) return null;
  const buyYes = evYes >= evNo;
  const price = buyYes ? r.yesAsk : r.noAsk;
  return (buyYes === r.yes ? 1 : 0) - price - takerFee(price);
}

const markets = loadMarkets();
const spot = loadSpot();
const results: Record<string, unknown> = {};

for (const minute of checkpoints) {
  const rows: Row[] = [];
  let skipped = 0;
  for (const m of markets) {
    const t = m.open + minute * 60;
    const quote = m.quotes.get(t);
    const sOpen = spot.get(m.open), sNow = spot.get(t);
    const history: number[] = [];
    for (let s = t - 3600; s <= t; s += 60) { const c = spot.get(s); if (c) history.push(c); }
    const sigma = perMinuteVolatility(history);
    if (!quote || !sOpen || !sNow || !sigma) { skipped++; continue; }
    const logMove = Math.log(sNow / sOpen);
    rows.push({
      x: [logMove / (sigma * Math.sqrt(15 - minute)), logMove * 1e3, sigma * 1e3],
      marketP: (quote.bid + quote.ask) / 2,
      yes: m.result === "yes",
      yesAsk: quote.ask,
      noAsk: 1 - quote.bid,
    });
  }

  const variants: Record<string, unknown> = {};
  for (const [name, useMarket] of [["A_featuresOnly", false], ["B_featuresPlusMarket", true]] as const) {
    const folds = [];
    const pooledDiff: number[] = [];
    const pooledProfit: number[] = [];
    let pooledModel = 0, pooledMarket = 0, pooledN = 0;
    for (const frac of trainFractions) {
      const cut = Math.floor(rows.length * frac);
      const end = Math.min(rows.length, Math.floor(rows.length * (frac + foldWidth)));
      const predict = fitLogistic(rows.slice(0, cut), useMarket);
      const test = rows.slice(cut, end);
      const diffs = test.map((r) => brier(predict(r), r.yes) - brier(r.marketP, r.yes));
      const profits = test.map((r) => tradeProfit(predict(r), r)).filter((p): p is number => p !== null);
      const modelB = mean(test.map((r) => brier(predict(r), r.yes)));
      const marketB = mean(test.map((r) => brier(r.marketP, r.yes)));
      folds.push({ train: cut, heldOut: test.length, modelBrier: r4(modelB), marketBrier: r4(marketB), beatsMarket: modelB < marketB, trades: profits.length, avgProfit: profits.length ? r4(mean(profits)) : null });
      pooledDiff.push(...diffs);
      pooledProfit.push(...profits);
      pooledModel += modelB * test.length; pooledMarket += marketB * test.length; pooledN += test.length;
    }
    // Plain 50/50 split, reported alongside the walk-forward folds.
    const half = Math.floor(rows.length / 2);
    const predictHalf = fitLogistic(rows.slice(0, half), useMarket);
    const heldHalf = rows.slice(half);
    const halfModel = mean(heldHalf.map((r) => brier(predictHalf(r), r.yes)));
    const halfMarket = mean(heldHalf.map((r) => brier(r.marketP, r.yes)));

    const diffCi = bootstrapCi(pooledDiff);
    const profitCi = bootstrapCi(pooledProfit);
    const beatsPooled = pooledModel / pooledN < pooledMarket / pooledN;
    const everyFold = folds.every((f) => f.beatsMarket);
    const verdict = !beatsPooled ? "no edge"
      : everyFold && diffCi && diffCi[1] < 0 && profitCi && profitCi[0] > 0 ? "tradable" : "not proven";
    variants[name] = {
      split50_50: { train: half, heldOut: heldHalf.length, modelBrier: r4(halfModel), marketBrier: r4(halfMarket) },
      walkForwardFolds: folds,
      pooledHeldOut: {
        n: pooledN,
        modelBrier: r4(pooledModel / pooledN),
        marketBrier: r4(pooledMarket / pooledN),
        brierDiffCi95: diffCi,
        trades: pooledProfit.length,
        avgProfitPerContract: pooledProfit.length ? r4(mean(pooledProfit)) : null,
        profitCi95: profitCi,
      },
      verdict,
    };
  }
  results[`minute${minute}`] = { eligible: rows.length, skipped, ...variants };
}

console.log(JSON.stringify({
  markets: markets.length,
  split: "chronological by market open time",
  walkForward: trainFractions.map((f) => `train first ${f * 100}% -> test next ${foldWidth * 100}%`),
  bootstrap: `${bootstrapResamples} resamples x seeds ${bootstrapSeeds.join(",")}, widest CI reported`,
  results,
}, null, 2));
