/**
 * Swing-Event Strategy Backtest (Quantum Fox Empirical Evaluation)
 *
 * Evaluates whether sudden price swings (moves >= ±8 percentage points in 5 minutes)
 * in Kalshi KXBTC15M contracts contain tradable held-out expectancy or directional edge.
 *
 * Rules tested:
 *   1. Momentum (Continuation): Follow the direction of the swing (Buy YES on upward swing, Buy NO on downward swing).
 *   2. Mean Reversion (Fade): Counter the swing (Buy NO on upward swing, Buy YES on downward swing).
 *   3. Post-Swing Market Price Baseline: Probability = post-swing price (does market price beat both rules?).
 *
 * Validation standard (matching findings.md section 11):
 *   - Strictly chronological train/held-out split (5-fold walk-forward: 50%, 60%, 70%, 80%, 90% train; next 10% test).
 *   - Plus a 50/50 chronological split baseline.
 *   - Kalshi taker fee applied: 0.07 * price * (1 - price).
 *   - 95% bootstrap confidence interval (2,000 resamples across seeds 1–5, widest interval reported).
 *   - Verdict rule:
 *       tradable   — beats market Brier on every fold AND pooled Brier-difference CI < 0 AND after-fee profit CI > 0.
 *       not proven — beats market on pooled Brier but fails any of the above.
 *       no edge    — does not beat market on pooled held-out Brier.
 */

import fs from "node:fs";
import path from "node:path";
import { readSwingEventsCsv, type SwingEvent } from "./swing-event-logger.ts";

export function takerFee(p: number): number {
  const clamped = Math.max(0.01, Math.min(0.99, p));
  return 0.07 * clamped * (1 - clamped);
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootstrapCi(values: number[], seeds: number[] = [1, 2, 3, 4, 5], resamples: number = 2000): [number, number] | null {
  if (values.length < 2) return null;
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;

  for (const seed of seeds) {
    const rand = mulberry32(seed);
    const means: number[] = [];
    for (let b = 0; b < resamples; b++) {
      let sum = 0;
      for (let i = 0; i < values.length; i++) {
        sum += values[Math.floor(rand() * values.length)];
      }
      means.push(sum / values.length);
    }
    means.sort((x, y) => x - y);
    lo = Math.min(lo, means[Math.floor(0.025 * resamples)]);
    hi = Math.max(hi, means[Math.floor(0.975 * resamples)]);
  }

  return [Number(lo.toFixed(5)), Number(hi.toFixed(5))];
}

export interface SettledSwingRecord {
  ticker: string;
  triggerTime: string;
  minutesLeft: number;
  priceBefore: number;
  priceAfter: number;
  spotPrice: number | null;
  outcomeYes: boolean; // true = YES, false = NO
  swingDelta: number; // priceAfter - priceBefore
  direction: "UP" | "DOWN";
}

export interface RuleEvaluationResult {
  ruleName: string;
  trades: number;
  wins: number;
  winRate: number;
  grossProfitTotal: number;
  netProfitTotal: number;
  netProfitPerContract: number;
  profitCi: [number, number] | null;
  averageBrier: number;
  brierDifferenceVsMarket: number;
  brierDifferenceCi: [number, number] | null;
}

export interface FoldResult {
  foldIndex: number;
  trainSize: number;
  testSize: number;
  marketBrier: number;
  momentumBrier: number;
  fadeBrier: number;
  momentumBeatsMarket: boolean;
  fadeBeatsMarket: boolean;
  momentumNetPerContract: number;
  fadeNetPerContract: number;
}

export interface SwingBacktestReport {
  timestamp: string;
  datasetPath: string;
  totalEventsInCsv: number;
  settledSampleN: number;
  dateRange: { earliest: string; latest: string };
  baselines: {
    coinFlipBrier: number;
    marketPostSwingBrier: number;
  };
  fullSample: {
    momentum: RuleEvaluationResult;
    fade: RuleEvaluationResult;
  };
  chronological5050Split: {
    trainN: number;
    testN: number;
    momentumHeldOutNet: number;
    fadeHeldOutNet: number;
  };
  walkForward: {
    folds: FoldResult[];
    pooledHeldOutN: number;
    pooledMarketBrier: number;
    pooledMomentumBrier: number;
    pooledFadeBrier: number;
    momentumFoldsBeatingMarket: string;
    fadeFoldsBeatingMarket: string;
    momentumPooledProfitCi: [number, number] | null;
    fadePooledProfitCi: [number, number] | null;
    momentumBrierDiffCi: [number, number] | null;
    fadeBrierDiffCi: [number, number] | null;
    verdictMomentum: "tradable" | "not proven" | "no edge";
    verdictFade: "tradable" | "not proven" | "no edge";
  };
}

export function loadSettledSwingRecords(csvPath: string = path.resolve("data/swing-events.csv")): SettledSwingRecord[] {
  const events = readSwingEventsCsv(csvPath);
  const settled: SettledSwingRecord[] = [];

  for (const e of events) {
    if (!e.settlement_outcome) continue;
    const outcomeUpper = e.settlement_outcome.toUpperCase();
    if (outcomeUpper !== "YES" && outcomeUpper !== "NO") continue;

    const delta = e.price_after - e.price_before;
    settled.push({
      ticker: e.ticker,
      triggerTime: e.trigger_time,
      minutesLeft: e.minutes_left,
      priceBefore: e.price_before,
      priceAfter: e.price_after,
      spotPrice: e.spot_price,
      outcomeYes: outcomeUpper === "YES",
      swingDelta: delta,
      direction: delta >= 0 ? "UP" : "DOWN",
    });
  }

  // Sort strictly chronologically
  settled.sort((a, b) => new Date(a.triggerTime).getTime() - new Date(b.triggerTime).getTime());
  return settled;
}

export function evaluateRuleOnSet(
  records: SettledSwingRecord[],
  rule: "momentum" | "fade"
): RuleEvaluationResult {
  if (records.length === 0) {
    return {
      ruleName: rule,
      trades: 0,
      wins: 0,
      winRate: 0,
      grossProfitTotal: 0,
      netProfitTotal: 0,
      netProfitPerContract: 0,
      profitCi: null,
      averageBrier: 0,
      brierDifferenceVsMarket: 0,
      brierDifferenceCi: null,
    };
  }

  let wins = 0;
  let grossProfit = 0;
  let netProfit = 0;
  const netProfits: number[] = [];
  const brierDiffs: number[] = [];
  let ruleBrierSum = 0;
  let marketBrierSum = 0;

  for (const r of records) {
    // If momentum: UP swing -> predict YES (buy YES at priceAfter), DOWN swing -> predict NO (buy NO at 1 - priceAfter)
    // If fade: UP swing -> predict NO (buy NO at 1 - priceAfter), DOWN swing -> predict YES (buy YES at priceAfter)
    const isUp = r.direction === "UP";
    const buyYes = rule === "momentum" ? isUp : !isUp;

    const entryPrice = buyYes ? r.priceAfter : 1 - r.priceAfter;
    const fee = takerFee(entryPrice);
    const win = buyYes === r.outcomeYes;

    if (win) wins++;
    const payout = win ? 1.0 : 0.0;
    const gross = payout - entryPrice;
    const net = payout - entryPrice - fee;

    grossProfit += gross;
    netProfit += net;
    netProfits.push(net);

    // Rule probability estimate: if buyYes, high prob (e.g. max(priceAfter, 0.55)); otherwise (1 - priceAfter)
    // Or pure directional probability: 1.0 if buyYes, 0.0 if buyNo
    // For proper probabilistic Brier score, we benchmark against market mid (priceAfter)
    const ruleProb = buyYes ? Math.max(r.priceAfter, 0.6) : Math.min(r.priceAfter, 0.4);
    const actual = r.outcomeYes ? 1.0 : 0.0;
    const ruleBrier = (ruleProb - actual) ** 2;
    const marketBrier = (r.priceAfter - actual) ** 2;

    ruleBrierSum += ruleBrier;
    marketBrierSum += marketBrier;
    brierDiffs.push(ruleBrier - marketBrier);
  }

  const n = records.length;
  const winRate = Number((wins / n).toFixed(4));
  const netPerContract = Number((netProfit / n).toFixed(5));
  const profitCi = bootstrapCi(netProfits);
  const avgBrier = Number((ruleBrierSum / n).toFixed(5));
  const brierDiff = Number(((ruleBrierSum - marketBrierSum) / n).toFixed(5));
  const brierDiffCi = bootstrapCi(brierDiffs);

  return {
    ruleName: rule,
    trades: n,
    wins,
    winRate,
    grossProfitTotal: Number(grossProfit.toFixed(4)),
    netProfitTotal: Number(netProfit.toFixed(4)),
    netProfitPerContract: netPerContract,
    profitCi,
    averageBrier: avgBrier,
    brierDifferenceVsMarket: brierDiff,
    brierDifferenceCi: brierDiffCi,
  };
}

export function runSwingBacktest(csvPath: string = path.resolve("data/swing-events.csv")): SwingBacktestReport {
  const allEvents = readSwingEventsCsv(csvPath);
  const records = loadSettledSwingRecords(csvPath);

  if (records.length < 30) {
    throw new Error(`Insufficient settled swing events (found ${records.length}, required >= 30)`);
  }

  const earliest = records[0].triggerTime;
  const latest = records[records.length - 1].triggerTime;

  // Compute market post-swing baseline Brier across full set
  let marketBrierSum = 0;
  for (const r of records) {
    const actual = r.outcomeYes ? 1.0 : 0.0;
    marketBrierSum += (r.priceAfter - actual) ** 2;
  }
  const marketPostSwingBrier = Number((marketBrierSum / records.length).toFixed(4));

  // Full sample evaluation
  const fullMomentum = evaluateRuleOnSet(records, "momentum");
  const fullFade = evaluateRuleOnSet(records, "fade");

  // Chronological 50/50 split
  const half = Math.floor(records.length * 0.5);
  const test50 = records.slice(half);
  const test50Momentum = evaluateRuleOnSet(test50, "momentum");
  const test50Fade = evaluateRuleOnSet(test50, "fade");

  // 5-fold walk-forward
  const trainFractions = [0.5, 0.6, 0.7, 0.8, 0.9];
  const foldWidth = 0.1;
  const folds: FoldResult[] = [];

  const pooledMomentumProfits: number[] = [];
  const pooledFadeProfits: number[] = [];
  const pooledMomentumBrierDiffs: number[] = [];
  const pooledFadeBrierDiffs: number[] = [];

  let pooledMarketBrierSum = 0;
  let pooledMomentumBrierSum = 0;
  let pooledFadeBrierSum = 0;
  let pooledN = 0;

  let momentumFoldsWon = 0;
  let fadeFoldsWon = 0;

  for (let i = 0; i < trainFractions.length; i++) {
    const frac = trainFractions[i];
    const cut = Math.floor(records.length * frac);
    const end = Math.min(records.length, Math.floor(records.length * (frac + foldWidth)));
    const testSet = records.slice(cut, end);
    if (testSet.length === 0) continue;

    const mRes = evaluateRuleOnSet(testSet, "momentum");
    const fRes = evaluateRuleOnSet(testSet, "fade");

    let foldMarketBrier = 0;
    for (const r of testSet) {
      const act = r.outcomeYes ? 1.0 : 0.0;
      foldMarketBrier += (r.priceAfter - act) ** 2;
    }
    foldMarketBrier = Number((foldMarketBrier / testSet.length).toFixed(4));

    const momBeats = mRes.averageBrier < foldMarketBrier;
    const fadeBeats = fRes.averageBrier < foldMarketBrier;
    if (momBeats) momentumFoldsWon++;
    if (fadeBeats) fadeFoldsWon++;

    folds.push({
      foldIndex: i + 1,
      trainSize: cut,
      testSize: testSet.length,
      marketBrier: foldMarketBrier,
      momentumBrier: mRes.averageBrier,
      fadeBrier: fRes.averageBrier,
      momentumBeatsMarket: momBeats,
      fadeBeatsMarket: fadeBeats,
      momentumNetPerContract: mRes.netProfitPerContract,
      fadeNetPerContract: fRes.netProfitPerContract,
    });

    for (const r of testSet) {
      pooledN++;
      const act = r.outcomeYes ? 1.0 : 0.0;
      const mB = (r.priceAfter - act) ** 2;
      pooledMarketBrierSum += mB;

      // Momentum
      const isUp = r.direction === "UP";
      const momBuyYes = isUp;
      const momPrice = momBuyYes ? r.priceAfter : 1 - r.priceAfter;
      const momFee = takerFee(momPrice);
      const momWin = momBuyYes === r.outcomeYes;
      const momNet = (momWin ? 1.0 : 0.0) - momPrice - momFee;
      const momProb = momBuyYes ? Math.max(r.priceAfter, 0.6) : Math.min(r.priceAfter, 0.4);
      const momB = (momProb - act) ** 2;
      pooledMomentumProfits.push(momNet);
      pooledMomentumBrierDiffs.push(momB - mB);
      pooledMomentumBrierSum += momB;

      // Fade
      const fadeBuyYes = !isUp;
      const fadePrice = fadeBuyYes ? r.priceAfter : 1 - r.priceAfter;
      const fadeFee = takerFee(fadePrice);
      const fadeWin = fadeBuyYes === r.outcomeYes;
      const fadeNet = (fadeWin ? 1.0 : 0.0) - fadePrice - fadeFee;
      const fadeProb = fadeBuyYes ? Math.max(r.priceAfter, 0.6) : Math.min(r.priceAfter, 0.4);
      const fadeB = (fadeProb - act) ** 2;
      pooledFadeProfits.push(fadeNet);
      pooledFadeBrierDiffs.push(fadeB - mB);
      pooledFadeBrierSum += fadeB;
    }
  }

  const pMarketBrier = Number((pooledMarketBrierSum / pooledN).toFixed(4));
  const pMomBrier = Number((pooledMomentumBrierSum / pooledN).toFixed(4));
  const pFadeBrier = Number((pooledFadeBrierSum / pooledN).toFixed(4));

  const momProfitCi = bootstrapCi(pooledMomentumProfits);
  const fadeProfitCi = bootstrapCi(pooledFadeProfits);
  const momBrierDiffCi = bootstrapCi(pooledMomentumBrierDiffs);
  const fadeBrierDiffCi = bootstrapCi(pooledFadeBrierDiffs);

  // Apply verdict rule
  const verdictRule = (
    foldsWon: number,
    totalFolds: number,
    pooledBrier: number,
    marketB: number,
    brierDiffCi: [number, number] | null,
    profitCi: [number, number] | null
  ): "tradable" | "not proven" | "no edge" => {
    if (pooledBrier >= marketB) return "no edge";
    const beatsAllFolds = foldsWon === totalFolds;
    const brierCiBelowZero = brierDiffCi !== null && brierDiffCi[1] < 0;
    const profitCiAboveZero = profitCi !== null && profitCi[0] > 0;
    if (beatsAllFolds && brierCiBelowZero && profitCiAboveZero) return "tradable";
    return "not proven";
  };

  const verdictMom = verdictRule(momentumFoldsWon, folds.length, pMomBrier, pMarketBrier, momBrierDiffCi, momProfitCi);
  const verdictFade = verdictRule(fadeFoldsWon, folds.length, pFadeBrier, pMarketBrier, fadeBrierDiffCi, fadeProfitCi);

  return {
    timestamp: new Date().toISOString(),
    datasetPath: csvPath,
    totalEventsInCsv: allEvents.length,
    settledSampleN: records.length,
    dateRange: { earliest, latest },
    baselines: {
      coinFlipBrier: 0.25,
      marketPostSwingBrier,
    },
    fullSample: {
      momentum: fullMomentum,
      fade: fullFade,
    },
    chronological5050Split: {
      trainN: half,
      testN: records.length - half,
      momentumHeldOutNet: test50Momentum.netProfitPerContract,
      fadeHeldOutNet: test50Fade.netProfitPerContract,
    },
    walkForward: {
      folds,
      pooledHeldOutN: pooledN,
      pooledMarketBrier: pMarketBrier,
      pooledMomentumBrier: pMomBrier,
      pooledFadeBrier: pFadeBrier,
      momentumFoldsBeatingMarket: `${momentumFoldsWon}/${folds.length}`,
      fadeFoldsBeatingMarket: `${fadeFoldsWon}/${folds.length}`,
      momentumPooledProfitCi: momProfitCi,
      fadePooledProfitCi: fadeProfitCi,
      momentumBrierDiffCi: momBrierDiffCi,
      fadeBrierDiffCi: fadeBrierDiffCi,
      verdictMomentum: verdictMom,
      verdictFade: verdictFade,
    },
  };
}

// Direct CLI execution
const isDirectCli =
  process.argv[1] &&
  (process.argv[1].endsWith("swing-event-backtest.ts") || process.argv[1].endsWith("swing-event-backtest.js"));

if (isDirectCli) {
  console.log("Running QuanterraOS Swing-Event Backtest...");
  const report = runSwingBacktest();
  console.log(JSON.stringify(report, null, 2));

  // Write report to reports/
  const dateStr = new Date().toISOString().split("T")[0];
  const reportPath = path.resolve(`reports/swing-event-backtest-${dateStr}.txt`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Report successfully written to ${reportPath}`);
}
