/**
 * QuanterraOS Bridge Ship Gauges Engine
 *
 * Implements Phase 4 Task 4.5:
 * 1. Fuel Gauge: Monthly voluntary fee budget remaining. Burning faster than plan -> warning.
 * 2. Hull Integrity: Loss-limit headroom (user-set daily/weekly max loss).
 *    Under 30% -> Security Chief suggests standing down.
 * 3. Navigation Accuracy: Rolling personal Brier score benchmarked against Kalshi mid (0.2001) & coin-flip (0.2500).
 * 4. Discipline: % of logged trades with a pre-flight check and written thesis + anti-volume XP tracking.
 *
 * Compliance:
 * - Part 0.3 Guardrails: Anti-volume gamification (XP for checks, thesis, maker, calibration; 0 XP for volume or P&L).
 * - Rule B5: $0.00 capital deployed, no live execution endpoints.
 */

export interface FuelGaugeState {
  budgetDollars: number;
  consumedDollars: number;
  remainingDollars: number;
  remainingPct: number;
  burnRateStatus: "NOMINAL" | "BURNING_FAST" | "EXHAUSTED";
  warningMessage: string | null;
}

export interface HullGaugeState {
  maxLossLimitDollars: number;
  currentLossDollars: number;
  headroomDollars: number;
  integrityPct: number;
  status: "NOMINAL" | "WARNING" | "CRITICAL_STAND_DOWN";
  securityChiefAlert: string | null;
}

export interface NavAccuracyGaugeState {
  personalBrier: number;
  marketMidpointBrier: number;
  coinFlipBrier: number;
  outperformingMarketBps: number;
  outperformingCoinFlipBps: number;
  status: "SHARP" | "NOMINAL" | "UNCALIBRATED";
  ratingLabel: string;
}

export interface DisciplineGaugeState {
  loggedTradesCount: number;
  tradesWithThesisCount: number;
  disciplinePct: number;
  totalDisciplineXp: number;
  rankName: string;
  rankProgressPct: number;
}

export interface BridgeGaugesState {
  fuel: FuelGaugeState;
  hull: HullGaugeState;
  navAccuracy: NavAccuracyGaugeState;
  discipline: DisciplineGaugeState;
}

/**
 * Computes Fuel Gauge state based on voluntary fee budget and actual fee burn.
 */
export function computeFuelGauge(
  budgetDollars: number,
  consumedDollars: number,
  dayOfMonth: number = 9,
  daysInMonth: number = 30
): FuelGaugeState {
  const safeBudget = Math.max(1, budgetDollars);
  const safeConsumed = Math.max(0, consumedDollars);
  const remainingDollars = Math.max(0, safeBudget - safeConsumed);
  const remainingPct = Math.round((remainingDollars / safeBudget) * 100);

  // Expected runway burn vs calendar month progression
  const expectedBurnPct = (dayOfMonth / daysInMonth) * 100;
  const actualBurnPct = 100 - remainingPct;

  let burnRateStatus: "NOMINAL" | "BURNING_FAST" | "EXHAUSTED" = "NOMINAL";
  let warningMessage: string | null = null;

  if (remainingDollars <= 0) {
    burnRateStatus = "EXHAUSTED";
    warningMessage = "Monthly fee budget exhausted. Switch strictly to maker limit orders to avoid crossing tolls.";
  } else if (actualBurnPct > expectedBurnPct * 1.5 && actualBurnPct > 30) {
    burnRateStatus = "BURNING_FAST";
    warningMessage = `Burning fee fuel faster than planned runway (${actualBurnPct}% consumed at day ${dayOfMonth} of ${daysInMonth}). Use Maker/Taker Saver.`;
  }

  return {
    budgetDollars: safeBudget,
    consumedDollars: Math.round(safeConsumed * 100) / 100,
    remainingDollars: Math.round(remainingDollars * 100) / 100,
    remainingPct,
    burnRateStatus,
    warningMessage,
  };
}

/**
 * Computes Hull Integrity based on user-set loss limit headroom.
 * Critical criterion: Under 30% -> Security Chief suggests standing down.
 */
export function computeHullGauge(
  maxLossLimitDollars: number,
  currentLossDollars: number
): HullGaugeState {
  const safeLimit = Math.max(1, maxLossLimitDollars);
  const safeLoss = Math.max(0, currentLossDollars);
  const headroomDollars = Math.max(0, safeLimit - safeLoss);
  const integrityPct = Math.round((headroomDollars / safeLimit) * 100);

  let status: "NOMINAL" | "WARNING" | "CRITICAL_STAND_DOWN" = "NOMINAL";
  let securityChiefAlert: string | null = null;

  if (integrityPct < 30) {
    status = "CRITICAL_STAND_DOWN";
    securityChiefAlert =
      "SECURITY CHIEF ALERT: Hull integrity has fallen below 30% of your voluntary loss limit. Standing down immediately is recommended to prevent cognitive tilt.";
  } else if (integrityPct < 50) {
    status = "WARNING";
    securityChiefAlert =
      "SECURITY ADVISORY: Hull headroom at " + integrityPct + "%. Reduce contract sizing or switch to observation mode.";
  }

  return {
    maxLossLimitDollars: safeLimit,
    currentLossDollars: Math.round(safeLoss * 100) / 100,
    headroomDollars: Math.round(headroomDollars * 100) / 100,
    integrityPct,
    status,
    securityChiefAlert,
  };
}

/**
 * Computes Navigation Accuracy from rolling personal Brier score.
 */
export function computeNavAccuracyGauge(personalBrier: number = 0.1982): NavAccuracyGaugeState {
  const marketMid = 0.2001;
  const coinFlip = 0.2500;

  const outMarket = Math.round(((marketMid - personalBrier) / marketMid) * 10000);
  const outCoin = Math.round(((coinFlip - personalBrier) / coinFlip) * 10000);

  let status: "SHARP" | "NOMINAL" | "UNCALIBRATED" = "NOMINAL";
  let ratingLabel = "Calibrated";

  if (personalBrier < marketMid) {
    status = "SHARP";
    ratingLabel = "Sharp (Beating Market)";
  } else if (personalBrier >= coinFlip) {
    status = "UNCALIBRATED";
    ratingLabel = "Underperforming Coin-Flip";
  }

  return {
    personalBrier: Math.round(personalBrier * 10000) / 10000,
    marketMidpointBrier: marketMid,
    coinFlipBrier: coinFlip,
    outperformingMarketBps: outMarket,
    outperformingCoinFlipBps: outCoin,
    status,
    ratingLabel,
  };
}

/**
 * Computes Discipline score based on pre-flight checks, written thesis adherence, and anti-volume XP.
 */
export function computeDisciplineGauge(
  loggedTradesCount: number = 20,
  tradesWithThesisCount: number = 19,
  totalDisciplineXp: number = 140
): DisciplineGaugeState {
  const total = Math.max(1, loggedTradesCount);
  const withThesis = Math.max(0, Math.min(total, tradesWithThesisCount));
  const disciplinePct = Math.round((withThesis / total) * 100);

  // Ranks: Cadet (0-299) -> Pilot (300-699) -> Lieutenant (700-1499) -> Commander (1500-2999) -> Captain (3000-5999) -> Admiral (6000+)
  let rankName = "Cadet";
  let nextRankXp = 300;
  let baseRankXp = 0;

  if (totalDisciplineXp >= 6000) {
    rankName = "Admiral";
    nextRankXp = 10000;
    baseRankXp = 6000;
  } else if (totalDisciplineXp >= 3000) {
    rankName = "Captain";
    nextRankXp = 6000;
    baseRankXp = 3000;
  } else if (totalDisciplineXp >= 1500) {
    rankName = "Commander";
    nextRankXp = 3000;
    baseRankXp = 1500;
  } else if (totalDisciplineXp >= 700) {
    rankName = "Lieutenant";
    nextRankXp = 1500;
    baseRankXp = 700;
  } else if (totalDisciplineXp >= 300) {
    rankName = "Pilot";
    nextRankXp = 700;
    baseRankXp = 300;
  }

  const rankProgressPct = Math.min(
    100,
    Math.round(((totalDisciplineXp - baseRankXp) / (nextRankXp - baseRankXp)) * 100)
  );

  return {
    loggedTradesCount: total,
    tradesWithThesisCount: withThesis,
    disciplinePct,
    totalDisciplineXp,
    rankName,
    rankProgressPct,
  };
}

/**
 * Computes all 4 Bridge gauges simultaneously.
 */
export function computeBridgeGauges(params: {
  feeBudgetDollars?: number;
  consumedFeesDollars?: number;
  maxLossLimitDollars?: number;
  currentLossDollars?: number;
  personalBrier?: number;
  loggedTradesCount?: number;
  tradesWithThesisCount?: number;
  totalDisciplineXp?: number;
} = {}): BridgeGaugesState {
  return {
    fuel: computeFuelGauge(params.feeBudgetDollars ?? 50.0, params.consumedFeesDollars ?? 8.0),
    hull: computeHullGauge(params.maxLossLimitDollars ?? 50.0, params.currentLossDollars ?? 10.0),
    navAccuracy: computeNavAccuracyGauge(params.personalBrier ?? 0.1982),
    discipline: computeDisciplineGauge(
      params.loggedTradesCount ?? 20,
      params.tradesWithThesisCount ?? 19,
      params.totalDisciplineXp ?? 140
    ),
  };
}
