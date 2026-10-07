/**
 * Polymarket & Multi-Venue Prediction-Market Risk Engine
 *
 * Provides institutional and consumer microstructure comparison between:
 * 1. Kalshi (CFTC Regulated, cash settlement, CME CF BRTI TWAP, fixed/sliding taker fee)
 * 2. Polymarket (Polygon USDC, UMA Optimistic Oracle resolution, gas/slippage friction)
 *
 * Adheres strictly to:
 * - Rule B4: Honest empirical benchmarking, zero banned superlatives.
 * - Rule B5: Zero live capital deployed ($0.00 exposure under Standby Lock).
 */

export interface VenueParameters {
  venueId: "kalshi" | "polymarket";
  name: string;
  regulator: string;
  settlementCurrency: string;
  settlementSource: string;
  resolutionMechanism: string;
  takerFeeFormulaDescription: string;
  typicalTakerFeePerContract: number; // in USD
  gasAndBridgeFrictionUsd: number;
  averageResolutionDelayHours: number;
  disputeRiskRatePct: number; // Historical UMA dispute probability
}

export interface VenueComparisonResult {
  contractPrice: number;
  contractCount: number;
  assessedWinProb: number;
  kalshi: {
    venue: string;
    purchaseCost: number;
    exchangeFee: number;
    feePerContract: number;
    maxLoss: number;
    breakevenWinProb: number;
    feeHurdleBps: number;
    netEv: number;
    settlementSource: string;
    settlementRiskLevel: "LOW" | "MODERATE" | "HIGH";
  };
  polymarket: {
    venue: string;
    purchaseCost: number;
    exchangeFee: number;
    gasAndBridgeFriction: number;
    totalFriction: number;
    feePerContract: number;
    maxLoss: number;
    breakevenWinProb: number;
    feeHurdleBps: number;
    netEv: number;
    settlementSource: string;
    settlementRiskLevel: "LOW" | "MODERATE" | "HIGH";
    umaDisputeWindowHours: number;
  };
  divergence: {
    cheaperVenue: "kalshi" | "polymarket" | "identical";
    feeDeltaUsd: number;
    breakevenDeltaPct: number;
    riskRecommendation: string;
  };
}

export const VENUE_SPECS: Record<"kalshi" | "polymarket", VenueParameters> = {
  kalshi: {
    venueId: "kalshi",
    name: "Kalshi",
    regulator: "CFTC (Designated Contract Market)",
    settlementCurrency: "USD (Direct Bank ACH / Wire)",
    settlementSource: "CME CF Bitcoin Real Time Index (BRTI) 60-Second TWAP",
    resolutionMechanism: "Deterministic Index TWAP Calculation",
    takerFeeFormulaDescription: "Ceil(0.07 * P * (1 - P)) per contract (capped at 1.75¢)",
    typicalTakerFeePerContract: 0.0175,
    gasAndBridgeFrictionUsd: 0.0,
    averageResolutionDelayHours: 0.05, // ~3 minutes post expiry
    disputeRiskRatePct: 0.0, // Regulated exchange rulebook
  },
  polymarket: {
    venueId: "polymarket",
    name: "Polymarket",
    regulator: "Offshore / Decentralized (Polygon Network)",
    settlementCurrency: "USDC (Bridged on Polygon)",
    settlementSource: "Binance / Coinbase Composite Spot via UMA Oracle",
    resolutionMechanism: "UMA Optimistic Oracle (Tokenholder Voting upon Dispute)",
    takerFeeFormulaDescription: "0.0% protocol taker fee on selected order books; dynamic maker rebates",
    typicalTakerFeePerContract: 0.005, // Effective spread & maker/taker slippage
    gasAndBridgeFrictionUsd: 0.15, // Polygon gas + USDC bridge amortization
    averageResolutionDelayHours: 2.0, // Standard 2-hour liveness period
    disputeRiskRatePct: 0.35, // ~0.35% of ambiguous markets enter UMA dispute
  },
};

/**
 * Calculates Kalshi taker fee per contract based on contract price (0.01 - 0.99)
 * for a single contract, rounding up to the nearest cent.
 */
export function calculateKalshiFee(price: number): number {
  const p = Math.max(0.01, Math.min(0.99, price));
  return Math.ceil(0.07 * p * (1 - p) * 100) / 100;
}

/**
 * Calculates official Kalshi taker fee for a specified order quantity and purchase price.
 * Under Kalshi exchange rules, the fee is calculated on the aggregate order and rounded up to the nearest whole cent:
 * totalFee = ceil(0.07 * count * price * (1 - price) * 100) / 100
 */
export function calculateKalshiOrderFee(price: number, count: number): {
  totalFeeUsd: number;
  feePerContractUsd: number;
  rawFeeUsd: number;
} {
  const p = Math.max(0.01, Math.min(0.99, price));
  const c = Math.max(1, count);
  const rawFeeUsd = 0.07 * c * p * (1 - p);
  // Protect against IEEE 754 precision drift (e.g. 175.00000000000003 cents) before ceil
  const feeCents = Number((rawFeeUsd * 100).toFixed(6));
  const totalFeeUsd = Math.ceil(feeCents) / 100;
  const feePerContractUsd = Number((totalFeeUsd / c).toFixed(4));
  return { totalFeeUsd, feePerContractUsd, rawFeeUsd };
}

/**
 * Performs side-by-side venue friction and risk comparison
 */
export function compareVenues(params: {
  price: number;
  count: number;
  userProb: number;
}): VenueComparisonResult {
  const price = Math.max(0.01, Math.min(0.99, params.price));
  const count = Math.max(1, params.count);
  const prob = Math.max(0.01, Math.min(0.99, params.userProb));

  // 1. Kalshi Calculation with exact order-level round-up rules
  const { totalFeeUsd: kalshiTotalFee, feePerContractUsd: kalshiFeePerCt } = calculateKalshiOrderFee(price, count);
  const kalshiPurchaseCost = Number((price * count).toFixed(2));
  const kalshiMaxLoss = Number((kalshiPurchaseCost + kalshiTotalFee).toFixed(2));
  const kalshiBreakevenProb = Number((price + kalshiFeePerCt).toFixed(4));
  const kalshiNetEv = Number(((prob - price - kalshiFeePerCt) * count).toFixed(2));
  const kalshiFeeBps = Math.round((kalshiFeePerCt / price) * 10000);

  // 2. Polymarket Calculation
  // Polymarket has low order book fees (~0.5¢ per contract spread/fee) + amortized gas/bridge friction
  const polyFeePerCt = 0.005;
  const polyPurchaseCost = Number((price * count).toFixed(2));
  const polyExchangeFee = Number((polyFeePerCt * count).toFixed(2));
  const polyGas = count >= 50 ? 0.08 : 0.15; // Amortized gas on Polygon
  const polyTotalFriction = Number((polyExchangeFee + polyGas).toFixed(2));
  const polyEffectiveFeePerCt = polyTotalFriction / count;
  const polyMaxLoss = Number((polyPurchaseCost + polyTotalFriction).toFixed(2));
  const polyBreakevenProb = Number((price + polyEffectiveFeePerCt).toFixed(4));
  const polyNetEv = Number(((prob - price - polyEffectiveFeePerCt) * count).toFixed(2));
  const polyFeeBps = Math.round((polyEffectiveFeePerCt / price) * 10000);

  // 3. Divergence Analysis
  const feeDelta = Number((kalshiTotalFee - polyTotalFriction).toFixed(2));
  const breakevenDelta = Number(((kalshiBreakevenProb - polyBreakevenProb) * 100).toFixed(2));

  let cheaperVenue: "kalshi" | "polymarket" | "identical" = "identical";
  if (kalshiTotalFee < polyTotalFriction) cheaperVenue = "kalshi";
  else if (polyTotalFriction < kalshiTotalFee) cheaperVenue = "polymarket";

  let recommendation = "";
  if (count <= 10) {
    recommendation =
      "For small trade sizes (<= 10 contracts), Kalshi exhibits lower all-in friction because Polygon gas/bridge overhead outweighs exchange fees.";
  } else if (count >= 100) {
    recommendation =
      "For larger position sizes (>= 100 contracts), Polymarket's zero-protocol-fee model reduces total transaction drag, but introduces UMA 2-hour oracle resolution risk.";
  } else {
    recommendation =
      "Friction between venues is balanced. Choose Kalshi for CFTC regulatory clarity and deterministic TWAP settlement, or Polymarket for on-chain non-custodial execution.";
  }

  return {
    contractPrice: price,
    contractCount: count,
    assessedWinProb: prob,
    kalshi: {
      venue: "Kalshi (CFTC Regulated)",
      purchaseCost: kalshiPurchaseCost,
      exchangeFee: kalshiTotalFee,
      feePerContract: kalshiFeePerCt,
      maxLoss: kalshiMaxLoss,
      breakevenWinProb: Number((kalshiBreakevenProb * 100).toFixed(2)),
      feeHurdleBps: kalshiFeeBps,
      netEv: kalshiNetEv,
      settlementSource: VENUE_SPECS.kalshi.settlementSource,
      settlementRiskLevel: "LOW",
    },
    polymarket: {
      venue: "Polymarket (Polygon / UMA)",
      purchaseCost: polyPurchaseCost,
      exchangeFee: polyExchangeFee,
      gasAndBridgeFriction: polyGas,
      totalFriction: polyTotalFriction,
      feePerContract: Number(polyEffectiveFeePerCt.toFixed(4)),
      maxLoss: polyMaxLoss,
      breakevenWinProb: Number((polyBreakevenProb * 100).toFixed(2)),
      feeHurdleBps: polyFeeBps,
      netEv: polyNetEv,
      settlementSource: VENUE_SPECS.polymarket.settlementSource,
      settlementRiskLevel: "MODERATE", // UMA dispute window
      umaDisputeWindowHours: VENUE_SPECS.polymarket.averageResolutionDelayHours,
    },
    divergence: {
      cheaperVenue,
      feeDeltaUsd: Math.abs(feeDelta),
      breakevenDeltaPct: Math.abs(breakevenDelta),
      riskRecommendation: recommendation,
    },
  };
}
