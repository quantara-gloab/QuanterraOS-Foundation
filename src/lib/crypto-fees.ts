export type CryptoVenue = "KALSHI" | "POLYMARKET";

export interface CryptoTradeFrictionInput {
  venue: CryptoVenue;
  asset: "BTC" | "ETH" | "SOL";
  strikePrice: number;
  contractPriceCents: number; // 1 to 99
  quantity: number;
  isTaker: boolean;
  estimatedSlippageCents?: number;
  relayerGasFeeCents?: number; // Polymarket Polygon gas equivalent
}

export interface CryptoTradeFrictionOutput {
  nominalExposureCents: number;
  tradingFeeCents: number;
  executionOverheadCents: number;
  totalCostCents: number;
  grossWinningPayoutCents: number;
  netProfitIfWonCents: number;
  netLossIfLostCents: number;
  breakEvenProbability: number;
  dragBps: number;
}

export function computeKalshiCryptoTakerFee(priceCents: number, quantity: number): number {
  // Parabolic CFTC fee formula: 7% of implied variance P * (100 - P)
  const rawPerContract = Math.ceil((0.07 * priceCents * (100 - priceCents)) / 100);
  // Cap at 2 cents per contract for retail crypto books
  const perContract = Math.min(Math.max(rawPerContract, 1), 2);
  return perContract * quantity;
}

export function calculateCryptoTrueCost(input: CryptoTradeFrictionInput): CryptoTradeFrictionOutput {
  if (input.contractPriceCents < 1 || input.contractPriceCents > 99) {
    throw new Error("Contract price must be between 1c and 99c");
  }
  if (input.quantity <= 0 || !Number.isInteger(input.quantity)) {
    throw new Error("Quantity must be a positive integer");
  }

  const nominalExposureCents = input.contractPriceCents * input.quantity;
  let tradingFeeCents = 0;
  let executionOverheadCents = input.estimatedSlippageCents || 0;

  if (input.venue === "KALSHI") {
    if (input.isTaker) {
      tradingFeeCents = computeKalshiCryptoTakerFee(input.contractPriceCents, input.quantity);
    }
  } else if (input.venue === "POLYMARKET") {
    // Zero trade fee baseline on CTF exchange; relayer execution cost added
    tradingFeeCents = 0;
    executionOverheadCents += (input.relayerGasFeeCents || 1); // default 1c gas buffer
  }

  const totalCostCents = nominalExposureCents + tradingFeeCents + executionOverheadCents;
  const grossWinningPayoutCents = 100 * input.quantity;
  const netProfitIfWonCents = grossWinningPayoutCents - totalCostCents;
  const netLossIfLostCents = totalCostCents;
  const breakEvenProbability = Number((totalCostCents / grossWinningPayoutCents).toFixed(4));
  const dragBps = Math.round(((totalCostCents - nominalExposureCents) / nominalExposureCents) * 10000);

  return {
    nominalExposureCents,
    tradingFeeCents,
    executionOverheadCents,
    totalCostCents,
    grossWinningPayoutCents,
    netProfitIfWonCents,
    netLossIfLostCents: -netLossIfLostCents,
    breakEvenProbability,
    dragBps,
  };
}
