/**
 * QuanterraOS True-Cost & Settlement Fee Engine
 *
 * Implements Part 3.1 & Phase 2 Task 2.5:
 * - Config-driven fee schedules carrying source_url and effective_date
 * - Kalshi general: fee = ceil_to_cent(0.07 × C × P × (1 − P)) per order
 * - Polymarket: category-based fee schedule
 * - Executable cost, exchange fee, max loss, breakeven probability, EV at user's p
 * - Maker vs Taker Saver: fee savings posting limit vs taking, fill-probability estimate
 * - Rounding Optimizer: consolidation savings across discrete order sizes
 * - Cross-Venue Net Spread: net after both venues' fees and settlement mismatch note
 *
 * Strict Compliance:
 * - Rule B1: Mathematical rigor, round-trip invariant testing
 * - Rule B4: No promises of edge or profit; labeled "your assumption" and "house edge"
 * - Rule B5: $0.00 capital deployed; advisory cost audit
 */

import { getBrtiDisplayMetadata } from "../config/licensing.ts";

export interface FeeScheduleConfig {
  venue: "kalshi" | "polymarket";
  product: string;
  source_url: string;
  effective_date: string;
  makerFeeRate: number; // e.g. 0.00 for Kalshi maker
  takerFeeMultiplier: number; // e.g. 0.07
  settlementSource: string;
}

export const KALSHI_FEE_SCHEDULES: Record<string, FeeScheduleConfig> = {
  general: {
    venue: "kalshi",
    product: "general",
    source_url: "https://kalshi.com/regulatory/fee-schedule",
    effective_date: "2024-01-01",
    makerFeeRate: 0.0,
    takerFeeMultiplier: 0.07,
    settlementSource: "CME CF BRTI 60s TWAP",
  },
  "KXBTC15M": {
    venue: "kalshi",
    product: "KXBTC15M",
    source_url: "https://kalshi.com/regulatory/fee-schedule",
    effective_date: "2024-01-01",
    makerFeeRate: 0.0,
    takerFeeMultiplier: 0.07,
    settlementSource: "CME CF BRTI 60s TWAP",
  },
  "KXBTCD": {
    venue: "kalshi",
    product: "KXBTCD",
    source_url: "https://kalshi.com/regulatory/fee-schedule",
    effective_date: "2024-01-01",
    makerFeeRate: 0.0,
    takerFeeMultiplier: 0.07,
    settlementSource: "CME CF BRTI 60s TWAP",
  },
};

export const POLYMARKET_FEE_SCHEDULES: Record<string, FeeScheduleConfig> = {
  general: {
    venue: "polymarket",
    product: "general",
    source_url: "https://docs.polymarket.com/#fees",
    effective_date: "2024-01-01",
    makerFeeRate: 0.0,
    takerFeeMultiplier: 0.0, // standard Polymarket CTF zero protocol fee
    settlementSource: "UMA Decentralized Oracle",
  },
  crypto: {
    venue: "polymarket",
    product: "crypto",
    source_url: "https://docs.polymarket.com/#fees",
    effective_date: "2024-01-01",
    makerFeeRate: 0.0,
    takerFeeMultiplier: 0.0,
    settlementSource: "UMA Decentralized Oracle / Pyth Feed",
  },
  politics: {
    venue: "polymarket",
    product: "politics",
    source_url: "https://docs.polymarket.com/#fees",
    effective_date: "2024-01-01",
    makerFeeRate: 0.0,
    takerFeeMultiplier: 0.0,
    settlementSource: "UMA Decentralized Oracle",
  },
};

/**
 * Rounds a dollar amount up to the nearest integer cent ($0.01).
 * e.g., 0.17493 -> 0.18
 */
export function ceilToCent(amountDollars: number): number {
  if (amountDollars <= 0) return 0.0;
  // Use epsilon to prevent floating point inaccuracies like 1.7500000000000002
  return Math.ceil(Number((amountDollars - 1e-9).toFixed(6)) * 100) / 100;
}

/**
 * Computes raw unrounded Kalshi taker fee per contract.
 * fee = 0.07 * P * (1 - P)
 */
export function computeRawKalshiFeePerContract(price: number, schedule = KALSHI_FEE_SCHEDULES.general): number {
  const p = Math.max(0.0, Math.min(1.0, price));
  return schedule.takerFeeMultiplier * p * (1.0 - p);
}

/**
 * Computes total Kalshi taker fee for an order of C contracts at price P.
 * fee = ceil_to_cent(0.07 * C * P * (1 - P))
 */
export function computeKalshiTakerFee(contracts: number, price: number, product = "general"): number {
  const c = Math.max(1, Math.floor(contracts));
  const p = Math.max(0.01, Math.min(0.99, price));
  const schedule = KALSHI_FEE_SCHEDULES[product] ?? KALSHI_FEE_SCHEDULES.general;
  const rawTotal = schedule.takerFeeMultiplier * c * p * (1.0 - p);
  return ceilToCent(rawTotal);
}

export interface TrueCostCheckInput {
  venue?: "kalshi" | "polymarket";
  product?: string;
  price: number; // in dollars (0.01 - 0.99)
  contracts: number; // contract count C
  userAssumedProbability?: number; // p from user thesis (0.01 - 0.99)
  orderType?: "taker" | "maker";
}

export interface TrueCostCheckOutput {
  venue: "kalshi" | "polymarket";
  product: string;
  price: number;
  contracts: number;
  orderType: "taker" | "maker";
  executableCost: number; // total outlay ($)
  fee: number; // exchange fee ($)
  totalOutlay: number; // executableCost + fee ($)
  maxLoss: number; // maximum dollar loss
  rawBreakevenPct: number; // theoretical continuous breakeven (%)
  discreteBreakevenPct: number; // actual breakeven including rounded fee (%)
  assumedProbabilityPct: number;
  expectedValue: number; // EV ($) labeled "your assumption"
  expectedValuePerContractCents: number;
  settlementSource: string;
  dangerZoneFlag: boolean; // coin-flip zone 45¢ - 55¢ where fee drag is maximal
  dangerZoneNotice?: string;
  effectiveFeeRatePct: number;
}

/**
 * Runs a complete True-Cost and Breakeven audit for a prospective trade.
 */
export function computeTrueCostCheck(input: TrueCostCheckInput): TrueCostCheckOutput {
  const venue = input.venue ?? "kalshi";
  const product = input.product ?? "general";
  const price = Math.max(0.01, Math.min(0.99, Number(input.price)));
  const contracts = Math.max(1, Math.floor(Number(input.contracts)));
  const orderType = input.orderType ?? "taker";
  const userP = input.userAssumedProbability !== undefined
    ? Math.max(0.01, Math.min(0.99, Number(input.userAssumedProbability)))
    : price;

  const schedule = venue === "kalshi"
    ? (KALSHI_FEE_SCHEDULES[product] ?? KALSHI_FEE_SCHEDULES.general)
    : (POLYMARKET_FEE_SCHEDULES[product] ?? POLYMARKET_FEE_SCHEDULES.general);

  const executableCost = Number((contracts * price).toFixed(2));

  let fee = 0.0;
  if (venue === "kalshi") {
    fee = orderType === "maker"
      ? 0.0 // Maker orders pay $0 fee on Kalshi
      : computeKalshiTakerFee(contracts, price, product);
  } else {
    // Polymarket standard
    fee = orderType === "maker" ? 0.0 : ceilToCent(contracts * price * schedule.takerFeeMultiplier);
  }

  const totalOutlay = Number((executableCost + fee).toFixed(2));
  const maxLoss = totalOutlay;

  // Raw theoretical breakeven: Price + raw fee
  const rawFeePerContract = computeRawKalshiFeePerContract(price, schedule);
  const rawBreakevenPct = Number(((price + (orderType === "maker" ? 0 : rawFeePerContract)) * 100).toFixed(2));

  // Discrete breakeven for exact contracts: totalOutlay / (contracts * $1.00 payout)
  const discreteBreakevenPct = Number(((totalOutlay / contracts) * 100).toFixed(2));

  // Expected Value calculation: (userP * $1.00 payout * contracts) - totalOutlay
  const totalPayoutIfWon = contracts * 1.0;
  const expectedValue = Number(((userP * totalPayoutIfWon) - totalOutlay).toFixed(2));
  const expectedValuePerContractCents = Number(((expectedValue / contracts) * 100).toFixed(2));

  // Danger zone flag: contracts near 50¢ (45¢ - 55¢) where variance is highest and fees consume peak % of margin
  const dangerZoneFlag = price >= 0.45 && price <= 0.55;
  const dangerZoneNotice = dangerZoneFlag
    ? "Coin-Flip Danger Zone (45¢–55¢): Exchange fee drag is mathematically maximized at 50¢ ($1.75/100ct). Requires higher directional edge just to overcome transaction friction."
    : undefined;

  const effectiveFeeRatePct = executableCost > 0 ? Number(((fee / executableCost) * 100).toFixed(2)) : 0;

  return {
    venue,
    product,
    price,
    contracts,
    orderType,
    executableCost,
    fee,
    totalOutlay,
    maxLoss,
    rawBreakevenPct,
    discreteBreakevenPct,
    assumedProbabilityPct: Number((userP * 100).toFixed(2)),
    expectedValue,
    expectedValuePerContractCents,
    settlementSource: schedule.venue === "kalshi"
      ? getBrtiDisplayMetadata().settlementSourceLabel
      : schedule.settlementSource,
    dangerZoneFlag,
    dangerZoneNotice,
    effectiveFeeRatePct,
  };
}

export interface MakerTakerSaverResult {
  takerFee: number;
  makerFee: number;
  dollarSavings: number;
  savingsBps: number;
  hurdleReductionPct: number;
  estimatedFillProbabilityPct: number;
  methodologyNote: string;
}

/**
 * Maker vs Taker Saver: Computes fee savings and hurdle reduction when
 * posting a limit/maker order instead of taking.
 */
export function computeMakerTakerSaver(
  contracts: number,
  price: number,
  product = "general",
  depthContractsAtBid: number = 50
): MakerTakerSaverResult {
  const taker = computeTrueCostCheck({ venue: "kalshi", product, price, contracts, orderType: "taker" });
  const maker = computeTrueCostCheck({ venue: "kalshi", product, price, contracts, orderType: "maker" });

  const dollarSavings = Number((taker.fee - maker.fee).toFixed(2));
  const savingsBps = taker.executableCost > 0 ? Math.round((dollarSavings / taker.executableCost) * 10000) : 0;
  const hurdleReductionPct = Number((taker.discreteBreakevenPct - maker.discreteBreakevenPct).toFixed(2));

  // Heuristic fill probability estimation based on queue queue position
  const queueRatio = contracts / Math.max(1, depthContractsAtBid + contracts);
  const estimatedFillProbabilityPct = Math.max(30, Math.min(95, Math.round((1.0 - queueRatio * 0.4) * 100)));

  return {
    takerFee: taker.fee,
    makerFee: maker.fee,
    dollarSavings,
    savingsBps,
    hurdleReductionPct,
    estimatedFillProbabilityPct,
    methodologyNote: "Maker orders on Kalshi incur $0.00 fee. Fill probability estimate is derived from top-of-book depth queue size and does not guarantee execution.",
  };
}

export interface RoundingOptimizerResult {
  currentContracts: number;
  currentFee: number;
  consolidatedContracts: number;
  consolidatedFee: number;
  roundingDragCents: number;
  optimalBatchSize: number;
  recommendation: string;
}

/**
 * Rounding Optimizer: Quantifies fee drag caused by discrete ceil_to_cent rounding
 * across multiple small orders vs single consolidated orders.
 */
export function computeRoundingOptimizer(
  singleOrderContracts: number,
  orderCount: number,
  price: number
): RoundingOptimizerResult {
  const singleFee = computeKalshiTakerFee(singleOrderContracts, price);
  const totalSeparateFees = Number((singleFee * orderCount).toFixed(2));

  const consolidatedContracts = singleOrderContracts * orderCount;
  const consolidatedFee = computeKalshiTakerFee(consolidatedContracts, price);

  const roundingDragDollars = Number((totalSeparateFees - consolidatedFee).toFixed(2));
  const roundingDragCents = Math.round(roundingDragDollars * 100);

  return {
    currentContracts: singleOrderContracts,
    currentFee: totalSeparateFees,
    consolidatedContracts,
    consolidatedFee,
    roundingDragCents,
    optimalBatchSize: consolidatedContracts,
    recommendation: roundingDragCents > 0
      ? `Consolidating ${orderCount} separate ${singleOrderContracts}-contract orders into 1 single order of ${consolidatedContracts} contracts saves $${roundingDragDollars.toFixed(2)} (${roundingDragCents}¢) in rounding friction.`
      : "Current order size is already mathematically optimal for cent rounding.",
  };
}

export interface CrossVenueNetSpreadResult {
  kalshiTicker: string;
  polymarketTicker: string;
  kalshiPrice: number;
  polymarketPrice: number;
  grossSpreadCents: number;
  kalshiTakerFee: number;
  polymarketTakerFee: number;
  totalRoundTripFee: number;
  netSpreadCents: number;
  isNetArbitrageViable: boolean;
  settlementMismatchNotice: string;
}

/**
 * Cross-Venue Net Spread: Calculates net disparity between Kalshi and Polymarket
 * after subtracting transaction fees from both venues and flagging settlement risk.
 */
export function computeCrossVenueNetSpread(params: {
  kalshiPrice: number;
  polymarketPrice: number;
  contracts?: number;
  kalshiProduct?: string;
  polymarketCategory?: string;
}): CrossVenueNetSpreadResult {
  const contracts = params.contracts ?? 100;
  const kalshiFee = computeKalshiTakerFee(contracts, params.kalshiPrice, params.kalshiProduct ?? "general");
  const polySchedule = POLYMARKET_FEE_SCHEDULES[params.polymarketCategory ?? "general"] ?? POLYMARKET_FEE_SCHEDULES.general;
  const polyFee = ceilToCent(contracts * params.polymarketPrice * polySchedule.takerFeeMultiplier);

  const totalFeeDollars = kalshiFee + polyFee;
  const totalFeePerContract = totalFeeDollars / contracts;

  const grossSpreadDollars = Math.abs(params.kalshiPrice - params.polymarketPrice);
  const grossSpreadCents = Number((grossSpreadDollars * 100).toFixed(2));

  const netSpreadDollars = grossSpreadDollars - totalFeePerContract;
  const netSpreadCents = Number((netSpreadDollars * 100).toFixed(2));

  return {
    kalshiTicker: "KXBTC15M",
    polymarketTicker: "POLY-BTC-15M",
    kalshiPrice: params.kalshiPrice,
    polymarketPrice: params.polymarketPrice,
    grossSpreadCents,
    kalshiTakerFee: kalshiFee,
    polymarketTakerFee: polyFee,
    totalRoundTripFee: totalFeeDollars,
    netSpreadCents,
    isNetArbitrageViable: netSpreadCents > 0,
    settlementMismatchNotice: "Settlement Risk Warning: Kalshi settles strictly against CME CF BRTI 60-second TWAP index. Polymarket settles via UMA decentralized oracle. Price differences may reflect settlement-mechanism divergence rather than actionable pricing error.",
  };
}
