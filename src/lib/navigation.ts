/**
 * QuanterraOS Navigation Engine & Settlement Radar Logic
 *
 * Implements Phase 4 Task 4.3:
 * - Live Settlement Radar (60-second TWAP window, constituent consensus: Coinbase, Kraken, Bitstamp, Gemini).
 * - Dispersion in basis points across constituent venues.
 * - Active KXBTC15M strike ladder with distance, seconds left, fee drag, top-of-book.
 * - "Coin-flip zone" hazard evaluation (within last N minutes and within $X of strike).
 * - Non-advisory guardrails: Avoidance of coin-flip zone yields discipline XP (+20 XP).
 * - Attribution (Rule B10): CME CF BRTI licensing proxy notice.
 */

import { computeKalshiTakerFee } from "./fees.ts";

export interface ConstituentQuote {
  venue: "Coinbase" | "Kraken" | "Bitstamp" | "Gemini";
  price: number;
  weightPct: number;
  status: "ONLINE" | "DELAYED" | "DISPERSED";
}

export interface ConstituentConsensus {
  indexPrice: number;
  constituents: ConstituentQuote[];
  dispersionBps: number;
  dispersionStatus: "NOMINAL" | "ELEVATED" | "DIVERGENT";
  quorumMet: boolean;
  licensingNotice: string;
}

export interface CoinFlipZoneConfig {
  distanceThresholdDollars: number; // default $50
  timeThresholdSeconds: number;     // default 180s (3 minutes)
}

export interface CoinFlipZoneResult {
  inZone: boolean;
  severity: "SAFE" | "WATCH" | "CRITICAL_HAZARD";
  distanceDollars: number;
  secondsRemaining: number;
  message: string;
  disciplineAction: string;
  xpReward: number;
}

export interface TwapWindowStatus {
  secondsRemaining: number;
  isTwapActive: boolean;
  subIntervalIndex: number; // 0..12
  totalSubIntervals: number; // 12
  subIntervalDurationSec: number; // 5
  elapsedTwapSeconds: number; // 0..60
  oraclePhase: "REGULAR_TRADING" | "PRE_SETTLEMENT" | "TWAP_SAMPLING_ACTIVE" | "SETTLED";
}

export interface NavigationStrikeItem {
  ticker: string;
  strike: number;
  distanceDollars: number;
  distanceBps: number;
  secondsRemaining: number;
  yesBid: number;
  yesAsk: number;
  spreadCents: number;
  takerFeeCents: number;
  topOfBookSize: number;
  liquidityWallContracts: number;
  coinFlip: CoinFlipZoneResult;
  isAtm: boolean;
}

export const DEFAULT_COIN_FLIP_CONFIG: CoinFlipZoneConfig = {
  distanceThresholdDollars: 50.0,
  timeThresholdSeconds: 180, // 3 minutes
};

/**
 * Evaluates whether a contract is inside the "Coin-Flip Hazard Zone".
 * Condition: spot is within $X of strike AND remaining time <= N seconds.
 */
export function evaluateCoinFlipZone(
  distanceDollars: number,
  secondsRemaining: number,
  config: Partial<CoinFlipZoneConfig> = {}
): CoinFlipZoneResult {
  const distThreshold = config.distanceThresholdDollars ?? DEFAULT_COIN_FLIP_CONFIG.distanceThresholdDollars;
  const timeThreshold = config.timeThresholdSeconds ?? DEFAULT_COIN_FLIP_CONFIG.timeThresholdSeconds;

  const absDist = Math.abs(distanceDollars);

  if (secondsRemaining <= 0) {
    return {
      inZone: false,
      severity: "SAFE",
      distanceDollars: Math.round(distanceDollars * 100) / 100,
      secondsRemaining: 0,
      message: "Window has closed and settlement is determined.",
      disciplineAction: "Review settlement in Mission Log",
      xpReward: 0,
    };
  }

  // Inside critical hazard zone: within $distThreshold and <= timeThreshold seconds
  if (absDist <= distThreshold && secondsRemaining <= timeThreshold) {
    return {
      inZone: true,
      severity: "CRITICAL_HAZARD",
      distanceDollars: Math.round(distanceDollars * 100) / 100,
      secondsRemaining,
      message: `HAZARD ACTIVE: Spot is within $${absDist.toFixed(2)} of strike with only ${secondsRemaining}s remaining. Pricing degenerates toward random binary pin risk.`,
      disciplineAction: "Stand down from coin-flip entry",
      xpReward: 20,
    };
  }

  // Watch zone: approaching danger threshold
  if (absDist <= distThreshold * 1.5 || secondsRemaining <= timeThreshold + 120) {
    return {
      inZone: false,
      severity: "WATCH",
      distanceDollars: Math.round(distanceDollars * 100) / 100,
      secondsRemaining,
      message: `CAUTION: Approaching danger corridor ($${absDist.toFixed(2)} distance, ${secondsRemaining}s left).`,
      disciplineAction: "Monitor without market order commitment",
      xpReward: 10,
    };
  }

  return {
    inZone: false,
    severity: "SAFE",
    distanceDollars: Math.round(distanceDollars * 100) / 100,
    secondsRemaining,
    message: `NOMINAL: Distance $${absDist.toFixed(2)} outside $${distThreshold} hazard band.`,
    disciplineAction: "Standard pre-flight checklist",
    xpReward: 0,
  };
}

/**
 * Computes constituent spot dispersion across Coinbase, Kraken, Bitstamp, Gemini.
 */
export function computeConstituentDispersion(quotes: ConstituentQuote[]): ConstituentConsensus {
  if (!quotes || quotes.length === 0) {
    return {
      indexPrice: 0,
      constituents: [],
      dispersionBps: 0,
      dispersionStatus: "NOMINAL",
      quorumMet: false,
      licensingNotice: "No constituent feeds available.",
    };
  }

  let totalWeightedPrice = 0;
  let totalWeight = 0;
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const q of quotes) {
    totalWeightedPrice += q.price * q.weightPct;
    totalWeight += q.weightPct;
    if (q.price < minPrice) minPrice = q.price;
    if (q.price > maxPrice) maxPrice = q.price;
  }

  const indexPrice = totalWeight > 0 ? totalWeightedPrice / totalWeight : quotes[0].price;
  const spread = maxPrice - minPrice;
  const dispersionBps = indexPrice > 0 ? (spread / indexPrice) * 10000 : 0;

  let dispersionStatus: "NOMINAL" | "ELEVATED" | "DIVERGENT" = "NOMINAL";
  if (dispersionBps > 15.0) {
    dispersionStatus = "DIVERGENT";
  } else if (dispersionBps > 5.0) {
    dispersionStatus = "ELEVATED";
  }

  return {
    indexPrice: Math.round(indexPrice * 100) / 100,
    constituents: quotes,
    dispersionBps: Math.round(dispersionBps * 100) / 100,
    dispersionStatus,
    quorumMet: quotes.length >= 3,
    licensingNotice:
      "Calculated from constituent spot order books (Coinbase, Kraken, Bitstamp, Gemini) as a licensed proxy indicator. CME CF BRTI (CME CF Bitcoin Real-Time Index) is an independent trademark of CME Group and CF Benchmarks Ltd. QuanterraOS does not distribute the raw proprietary benchmark feed.",
  };
}

/**
 * Computes the 60-second TWAP averaging window progression for 15-minute contracts.
 */
export function computeTwapWindowStatus(secondsRemainingIn15m: number): TwapWindowStatus {
  const clampedSecs = Math.max(0, Math.min(900, Math.floor(secondsRemainingIn15m)));

  if (clampedSecs === 0) {
    return {
      secondsRemaining: 0,
      isTwapActive: false,
      subIntervalIndex: 12,
      totalSubIntervals: 12,
      subIntervalDurationSec: 5,
      elapsedTwapSeconds: 60,
      oraclePhase: "SETTLED",
    };
  }

  // Final 60 seconds (seconds 840–900 of the 900-second cycle)
  if (clampedSecs <= 60) {
    const elapsedTwapSeconds = 60 - clampedSecs;
    const subIntervalIndex = Math.min(12, Math.floor(elapsedTwapSeconds / 5) + 1);
    return {
      secondsRemaining: clampedSecs,
      isTwapActive: true,
      subIntervalIndex,
      totalSubIntervals: 12,
      subIntervalDurationSec: 5,
      elapsedTwapSeconds,
      oraclePhase: "TWAP_SAMPLING_ACTIVE",
    };
  }

  if (clampedSecs <= 180) {
    return {
      secondsRemaining: clampedSecs,
      isTwapActive: false,
      subIntervalIndex: 0,
      totalSubIntervals: 12,
      subIntervalDurationSec: 5,
      elapsedTwapSeconds: 0,
      oraclePhase: "PRE_SETTLEMENT",
    };
  }

  return {
    secondsRemaining: clampedSecs,
    isTwapActive: false,
    subIntervalIndex: 0,
    totalSubIntervals: 12,
    subIntervalDurationSec: 5,
    elapsedTwapSeconds: 0,
    oraclePhase: "REGULAR_TRADING",
  };
}

/**
 * Builds the strike ladder for Navigation Station around current index price.
 */
export function generateNavigationStrikeLadder(
  indexPrice: number,
  secondsRemaining: number,
  config: Partial<CoinFlipZoneConfig> = {}
): NavigationStrikeItem[] {
  // Strikes are spaced in $250 increments for KXBTC15M
  const baseStrike = Math.round(indexPrice / 250) * 250;
  const offsets = [-500, -250, 0, 250, 500];

  return offsets.map((offset) => {
    const strike = baseStrike + offset;
    const distanceDollars = Math.round((indexPrice - strike) * 100) / 100;
    const distanceBps = indexPrice > 0 ? Math.round((distanceDollars / indexPrice) * 10000 * 10) / 10 : 0;
    const isAtm = offset === 0;

    // Approximate quote ladder based on distance
    let yesBid = 0.50;
    let yesAsk = 0.52;
    let topOfBookSize = 45;
    let liquidityWallContracts = 250;

    if (distanceDollars > 300) {
      yesBid = 0.88;
      yesAsk = 0.90;
      topOfBookSize = 120;
      liquidityWallContracts = 850;
    } else if (distanceDollars > 100) {
      yesBid = 0.70;
      yesAsk = 0.72;
      topOfBookSize = 85;
      liquidityWallContracts = 520;
    } else if (distanceDollars >= -100) {
      yesBid = 0.49;
      yesAsk = 0.51;
      topOfBookSize = 150;
      liquidityWallContracts = 1200;
    } else if (distanceDollars >= -300) {
      yesBid = 0.28;
      yesAsk = 0.30;
      topOfBookSize = 75;
      liquidityWallContracts = 480;
    } else {
      yesBid = 0.08;
      yesAsk = 0.10;
      topOfBookSize = 90;
      liquidityWallContracts = 640;
    }

    const spreadCents = Math.round((yesAsk - yesBid) * 100);
    const takerFee = computeKalshiTakerFee(1, yesAsk);
    const takerFeeCents = Math.round(takerFee * 100);

    const coinFlip = evaluateCoinFlipZone(distanceDollars, secondsRemaining, config);

    return {
      ticker: `KXBTC15M-${strike}`,
      strike,
      distanceDollars,
      distanceBps,
      secondsRemaining,
      yesBid,
      yesAsk,
      spreadCents,
      takerFeeCents,
      topOfBookSize,
      liquidityWallContracts,
      coinFlip,
      isAtm,
    };
  });
}
