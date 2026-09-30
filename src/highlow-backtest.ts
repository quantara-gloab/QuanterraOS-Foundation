/**
 * High/Low Barrier-Touch Backtest
 *
 * Scores `computeHighLowRecommendation()` against settled KXBTC15M markets
 * by simulating high/low barrier contracts on Coinbase 1-minute prices.
 *
 * This is a **simulation backtest** with three important caveats:
 * 1. Kalshi's KXBTC15M contracts settle on price-at-close, not barrier-touch.
 *    We simulate what a HIGH/LOW barrier contract on the *same* strike would
 *    have settled, using Coinbase's running high/low during the window.
 * 2. Coinbase is a BRTI constituent, not BRTI itself (verified proxy, ~$0.10
 *    median difference at open — see findings.md §10).
 * 3. Kalshi high/low contracts may sample continuously (every tick) rather than
 *    at 1-minute granularity; our synthetic settlement uses 1-minute closes,
 *    which is conservative (understates touch probability slightly).
 *
 * Despite these caveats, this backtest directly validates the *math* of the
 * one-touch reflection-principle model: does the model's probability match
 * the empirical touch frequency? If the model is well-calibrated, its Brier
 * score should approach the market-mid baseline (~0.20).
 *
 * Usage:
 *   npm run highlow-backtest
 *   # or directly:
 *   node --experimental-strip-types src/highlow-backtest.ts
 */
import fs from "node:fs";
import {
  computeHighLowRecommendation,
  type OpenHighLowContract,
} from "./agents/falcon-highlow.ts";
import { computeRealizedVolatility } from "./barrier-touch.ts";

const kalshiCsv =
  process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const coinbaseCsv = "data/coinbase-btc-1m.csv";

interface KalshiMarket {
  ticker: string;
  openTime: number; // seconds
  closeTime: number; // seconds
  strike: number;
  result: "yes" | "no";
  yesBid: number;
  yesAsk: number;
}

/** Brier score: (predicted_prob - outcome)^2 */
function brier(p: number, outcome: boolean): number {
  const o = outcome ? 1 : 0;
  return (p - o) ** 2;
}

/**
 * Load settled KXBTC15M markets from the Kalshi candle CSV.
 * Each unique ticker maps to one market with an open/close window and strike.
 */
function loadKalshiMarkets(): KalshiMarket[] {
  const [header, ...lines] = fs
    .readFileSync(kalshiCsv, "utf8")
    .trim()
    .split(/\r?\n/);
  const cols = header.split(",");
  const idx = (name: string) => cols.indexOf(name);

  const markets = new Map<string, KalshiMarket>();
  for (const line of lines) {
    const v = line.split(",");
    const ticker = v[idx("ticker")];
    if (!ticker) continue;

    const existing = markets.get(ticker);
    const m: KalshiMarket = existing ?? {
      ticker,
      openTime: Number(v[idx("open_time")]),
      closeTime: Number(v[idx("close_time")]),
      strike: Number(v[idx("strike_price")]),
      result: v[idx("result")] as "yes" | "no",
      yesBid: Number(v[idx("yes_bid")]),
      yesAsk: Number(v[idx("yes_ask")]),
    };

    // Keep the last (most recent) candle quote for this market
    const ts = Number(v[idx("timestamp")]);
    if (!existing || ts > existing.openTime + 1) {
      m.yesBid = Number(v[idx("yes_bid")]);
      m.yesAsk = Number(v[idx("yes_ask")]);
    }
    markets.set(ticker, m);
  }

  return [...markets.values()].sort((a, b) => a.openTime - b.openTime);
}

/**
 * Load Coinbase 1-minute closes. Returns a sorted array of [timestamp, price].
 */
function loadCoinbaseCloses(): [number, number][] {
  const [, ...lines] = fs
    .readFileSync(coinbaseCsv, "utf8")
    .trim()
    .split(/\r?\n/);
  const rows: [number, number][] = [];
  for (const line of lines) {
    const [t, c] = line.split(",").map(Number);
    if (Number.isFinite(t) && Number.isFinite(c) && c > 0) {
      rows.push([t, c]);
    }
  }
  rows.sort((a, b) => a[0] - b[0]);
  return rows;
}

/**
 * Extract price ticks (as { at, value } arrays) from Coinbase closes
 * that fall within [fromSec, toSec].
 */
function ticksInWindow(
  closes: [number, number][],
  fromSec: number,
  toSec: number,
): { at: number; value: number }[] {
  return closes
    .filter(([t]) => t >= fromSec && t <= toSec)
    .map(([t, c]) => ({ at: t, value: c }));
}

/**
 * Determine the synthetic settlement outcome for a high/low barrier contract.
 * Settles YES if the running high (HIGH) or running low (LOW) touched the
 * strike at any point during the *full* 15-minute window.
 */
function syntheticSettlement(
  windowTicks: { at: number; value: number }[],
  strike: number,
  barrierType: "high" | "low",
): boolean {
  if (windowTicks.length === 0) return false;
  const runningHigh = Math.max(...windowTicks.map((t) => t.value));
  const runningLow = Math.min(...windowTicks.map((t) => t.value));
  return barrierType === "high" ? runningHigh >= strike : runningLow <= strike;
}

interface BacktestResult {
  ticker: string;
  barrierType: "high" | "low";
  scoreMinute: number;
  modelProbability: number;
  marketMid: number;
  outcome: boolean;
  brier: { model: number; market: number };
  vol: number | null;
  contract: OpenHighLowContract;
}

const SCORING_MINUTES = [4, 7, 10, 13];
const VOL_WINDOW_MINUTES = 60;
const FEE_RATE = 0.07;

function runBacktest(): void {
  const markets = loadKalshiMarkets();
  const closes = loadCoinbaseCloses();

  const results: BacktestResult[] = [];
  let skipped = 0;

  for (const m of markets) {
    const fullWindowTicks = ticksInWindow(closes, m.openTime, m.closeTime);
    if (fullWindowTicks.length < 2) {
      skipped++;
      continue;
    }

    // Synthetic settlement (full window — ground truth)
    const highOutcome = syntheticSettlement(fullWindowTicks, m.strike, "high");
    const lowOutcome = syntheticSettlement(fullWindowTicks, m.strike, "low");

    for (const minute of SCORING_MINUTES) {
      const scoreTimestamp = m.openTime + minute * 60;
      if (scoreTimestamp > m.closeTime) continue;

      const scoringTicks = ticksInWindow(closes, m.openTime, scoreTimestamp);
      if (scoringTicks.length < 2) continue;

      // Trailing volatility from the 60 minutes before the scoring point
      const volFromSec = scoreTimestamp - VOL_WINDOW_MINUTES * 60;
      const volTicks = ticksInWindow(closes, volFromSec, scoreTimestamp);
      const volResult = computeRealizedVolatility(volTicks, {
        intervalSeconds: 60,
      });
      const sigmaPerSecond = volResult?.perSecond ?? 0.0001;

      const remainingSeconds = m.closeTime - scoreTimestamp;
      if (remainingSeconds <= 0) continue;

      for (const barrierType of ["high", "low"] as const) {
        const contract: OpenHighLowContract = {
          ticker: `${m.ticker}-${barrierType.toUpperCase()}`,
          barrierType,
          strike: m.strike,
          remainingSeconds,
          priceTicks: scoringTicks,
        };

        try {
          const rec = computeHighLowRecommendation(
            contract,
            new Date(scoreTimestamp * 1000),
          );
          const outcome = barrierType === "high" ? highOutcome : lowOutcome;
          const marketMid = (m.yesBid + m.yesAsk) / 2;

          results.push({
            ticker: m.ticker,
            barrierType,
            scoreMinute: minute,
            modelProbability: rec.probability,
            marketMid,
            outcome,
            brier: {
              model: brier(rec.probability, outcome),
              market: brier(marketMid, outcome),
            },
            vol: volResult?.annualized ?? null,
            contract,
          });
        } catch {
          // skip contracts with insufficient data
        }
      }
    }
  }

  // Aggregate by scoring minute
  const byMinute = new Map<number, BacktestResult[]>();
  for (const r of results) {
    const arr = byMinute.get(r.scoreMinute) ?? [];
    arr.push(r);
    byMinute.set(r.scoreMinute, arr);
  }

  const report: Record<string, unknown> = {};
  const overall: { model: number[]; market: number[]; trades: number[] } = {
    model: [],
    market: [],
    trades: [],
  };

  for (const minute of SCORING_MINUTES) {
    const group = byMinute.get(minute) ?? [];
    if (group.length === 0) continue;

    const n = group.length;
    overall.model.push(...group.map((r) => r.brier.model));
    overall.market.push(...group.map((r) => r.brier.market));

    const modelBrierSum = group.reduce((s, r) => s + r.brier.model, 0);
    const marketBrierSum = group.reduce((s, r) => s + r.brier.market, 0);
    const coinFlipBrier = 0.25; // always predict 0.5

    // Directional accuracy
    const highGroup = group.filter((r) => r.barrierType === "high");
    const lowGroup = group.filter((r) => r.barrierType === "low");
    const highOutcomes = highGroup.filter((r) => r.outcome);
    const lowOutcomes = lowGroup.filter((r) => r.outcome);

    // Trading simulation: take the YES or NO side when model EV > 0
    const trades: number[] = [];
    for (const r of group) {
      const yesEv =
        r.modelProbability -
        r.marketMid -
        FEE_RATE * r.marketMid * (1 - r.marketMid);
      const noEv =
        1 -
        r.modelProbability -
        (1 - r.marketMid) -
        FEE_RATE * (1 - r.marketMid) * r.marketMid;

      if (yesEv > 0.005 || noEv > 0.005) {
        const side = yesEv >= noEv ? "yes" : "no";
        const price = side === "yes" ? r.marketMid : 1 - r.marketMid;
        const won = side === "yes" ? r.outcome : !r.outcome;
        const pnl = (won ? 1 : 0) - price - FEE_RATE * price * (1 - price);
        trades.push(pnl);
        overall.trades.push(pnl);
      }
    }

    // Calibration: bucket by 10% increments
    const bins: Record<string, { n: number; sum: number }> = {};
    for (let b = 0; b <= 9; b++) {
      bins[`${b * 10}-${(b + 1) * 10}`] = { n: 0, sum: 0 };
    }
    for (const r of group) {
      const b = Math.min(9, Math.floor(r.modelProbability * 10));
      const key = `${b * 10}-${(b + 1) * 10}`;
      bins[key].n++;
      bins[key].sum += r.outcome ? 1 : 0;
    }

    const calib: Record<string, { count: number; actualRate: number | null }> =
      {};
    for (const [key, v] of Object.entries(bins)) {
      calib[key] = {
        count: v.n,
        actualRate: v.n > 0 ? Number((v.sum / v.n).toFixed(4)) : null,
      };
    }

    const tradeResults =
      trades.length > 0
        ? {
            trades: trades.length,
            winRate: Number(
              (trades.filter((t) => t > 0).length / trades.length).toFixed(4),
            ),
            avgProfitCents: Number(
              (
                (trades.reduce((a, b) => a + b, 0) / trades.length) *
                100
              ).toFixed(4),
            ),
            totalProfit: Number(trades.reduce((a, b) => a + b, 0).toFixed(4)),
          }
        : null;

    report[`minute${minute}`] = {
      scored: n,
      brier: {
        model: Number((modelBrierSum / n).toFixed(4)),
        market: Number((marketBrierSum / n).toFixed(4)),
        coinflip: coinFlipBrier,
      },
      calibration: calib,
      high: {
        markets: highGroup.length,
        touched: highOutcomes.length,
        touchRate: Number((highOutcomes.length / highGroup.length).toFixed(4)),
      },
      low: {
        markets: lowGroup.length,
        touched: lowOutcomes.length,
        touchRate: Number((lowOutcomes.length / lowGroup.length).toFixed(4)),
      },
      trades: tradeResults,
    };
  }

  const totalTrades = overall.trades.length;
  const totalModelBrier =
    overall.model.reduce((a, b) => a + b, 0) / overall.model.length;

  console.log(
    JSON.stringify(
      {
        source: "highlow-backtest",
        model: "falcon-highlow (reflection principle, no Jev calibration)",
        data: {
          kalshiCsv,
          coinbaseCsv,
          markets: markets.length,
          scoringMinutes: SCORING_MINUTES,
          volWindowMinutes: VOL_WINDOW_MINUTES,
          feeRate: FEE_RATE,
        },
        summary: {
          totalObservations: results.length,
          marketsScored: results.filter(
            (r, i, a) => a.findIndex((x) => x.ticker === r.ticker) === i,
          ).length,
          skipped,
          overallModelBrier: Number(totalModelBrier.toFixed(4)),
          overallMarketBrier: Number(
            (
              overall.market.reduce((a, b) => a + b, 0) / overall.market.length
            ).toFixed(4),
          ),
          coinflipBrier: 0.25,
          totalTrades: totalTrades,
          overallTradeProfit: totalTrades
            ? {
                winRate: Number(
                  (
                    overall.trades.filter((t) => t > 0).length / totalTrades
                  ).toFixed(4),
                ),
                avgProfitCents: Number(
                  (
                    (overall.trades.reduce((a, b) => a + b, 0) / totalTrades) *
                    100
                  ).toFixed(4),
                ),
              }
            : null,
        },
        byMinute: report,
      },
      null,
      2,
    ),
  );
}

runBacktest();
