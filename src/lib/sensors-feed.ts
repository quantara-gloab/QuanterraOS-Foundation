/**
 * QuanterraOS Flight Deck — Sensors Large-Trade Feed Engine
 *
 * Implements Phase 6 Task 6.1 & Blueprint Part 3.4:
 * - "Large-trade feed for Kalshi (trade size, price, time — no identities) and Polymarket (on-chain wallet).
 * - Every row shows NET-AFTER-FEES and SETTLEMENT CONTEXT, not just raw trade size."
 */

import { computeKalshiTakerFee, ceilToCent } from "./fees.ts";

export type PredictionVenue = "kalshi" | "polymarket";

export interface LargeTradePrint {
  id: string;
  timestamp: string;
  venue: PredictionVenue;
  ticker: string;
  marketTitle: string;
  side: "YES" | "NO";
  contracts: number;
  priceCents: number;
  priceDollars: number;
  notionalDollars: number;
  orderType: "taker" | "maker";
  takerFeeDollars: number;
  netPayoutIfWinDollars: number;
  netLossIfLoseDollars: number;
  feeDragBps: number;
  requiredBreakevenPct: number;
  settlementSource: "CME CF BRTI (60s TWAP)" | "UMA Decentralized Oracle";
  strikePrice: number;
  currentSpot: number;
  strikeDistanceDollars: number;
  secondsToExpiry: number;
  settlementRiskLevel: "HAZARD_COIN_FLIP" | "HIGH_VOLATILITY" | "MODERATE" | "SAFE";
  walletIdentifier: string; // Truncated on-chain wallet for Polymarket, "CFTC-PUBLIC-TAPE" for Kalshi
}

export interface LargeTradeFeedFilter {
  venue?: "all" | PredictionVenue;
  minContracts?: number;
  minNotional?: number;
  riskLevel?: "all" | LargeTradePrint["settlementRiskLevel"];
}

/**
 * Computes net-after-fees and settlement context metrics for an observed trade event.
 */
export function enrichLargeTradePrint(input: {
  id: string;
  timestamp: string;
  venue: PredictionVenue;
  ticker: string;
  marketTitle: string;
  side: "YES" | "NO";
  contracts: number;
  priceDollars: number;
  orderType: "taker" | "maker";
  strikePrice: number;
  currentSpot: number;
  secondsToExpiry: number;
  walletIdentifier?: string;
}): LargeTradePrint {
  const {
    id,
    timestamp,
    venue,
    ticker,
    marketTitle,
    side,
    contracts,
    priceDollars,
    orderType,
    strikePrice,
    currentSpot,
    secondsToExpiry,
  } = input;

  const notionalDollars = Number((contracts * priceDollars).toFixed(2));
  const priceCents = Math.round(priceDollars * 100);

  // Compute exact taker fee drag
  let takerFeeDollars = 0;
  if (orderType === "taker") {
    if (venue === "kalshi") {
      takerFeeDollars = computeKalshiTakerFee(contracts, priceDollars);
    } else {
      // Polymarket category schedule (2% of profit or 0.02 * C * P * (1-P))
      takerFeeDollars = ceilToCent(0.02 * contracts * priceDollars * (1 - priceDollars));
    }
  }

  // Net payout: (contracts * $1.00) - notional - fee
  const grossPayoutIfWin = contracts * 1.0;
  const netPayoutIfWinDollars = Number((grossPayoutIfWin - notionalDollars - takerFeeDollars).toFixed(2));
  const netLossIfLoseDollars = Number((notionalDollars + takerFeeDollars).toFixed(2));

  // Effective breakeven probability including fee friction
  const requiredBreakevenPct =
    notionalDollars > 0
      ? Number((((notionalDollars + takerFeeDollars) / grossPayoutIfWin) * 100).toFixed(2))
      : priceCents;

  const feeDragBps =
    notionalDollars > 0 ? Math.round((takerFeeDollars / notionalDollars) * 10000) : 0;

  // Settlement Context
  const settlementSource =
    venue === "kalshi" ? "CME CF BRTI (60s TWAP)" : "UMA Decentralized Oracle";

  const strikeDistanceDollars = Number(Math.abs(currentSpot - strikePrice).toFixed(2));

  let settlementRiskLevel: LargeTradePrint["settlementRiskLevel"] = "SAFE";
  if (strikeDistanceDollars <= 50 && secondsToExpiry <= 180) {
    settlementRiskLevel = "HAZARD_COIN_FLIP";
  } else if (strikeDistanceDollars <= 100 && secondsToExpiry <= 600) {
    settlementRiskLevel = "HIGH_VOLATILITY";
  } else if (secondsToExpiry <= 1200) {
    settlementRiskLevel = "MODERATE";
  }

  const walletIdentifier =
    venue === "polymarket"
      ? input.walletIdentifier || "0x7a3...e91"
      : "CFTC-PUBLIC-TAPE";

  return {
    id,
    timestamp,
    venue,
    ticker,
    marketTitle,
    side,
    contracts,
    priceCents,
    priceDollars,
    notionalDollars,
    orderType,
    takerFeeDollars,
    netPayoutIfWinDollars,
    netLossIfLoseDollars,
    feeDragBps,
    requiredBreakevenPct,
    settlementSource,
    strikePrice,
    currentSpot,
    strikeDistanceDollars,
    secondsToExpiry,
    settlementRiskLevel,
    walletIdentifier,
  };
}

/**
 * Seed telemetry prints across Kalshi & Polymarket representing realistic whale flow.
 */
export const SAMPLE_LARGE_TRADE_PRINTS: LargeTradePrint[] = [
  enrichLargeTradePrint({
    id: "print-kal-01",
    timestamp: new Date(Date.now() - 45000).toISOString(),
    venue: "kalshi",
    ticker: "KXBTC15M-26OCT09-91250",
    marketTitle: "Bitcoin > $91,250 @ 19:15 UTC",
    side: "YES",
    contracts: 1000,
    priceDollars: 0.51,
    orderType: "taker",
    strikePrice: 91250,
    currentSpot: 91242,
    secondsToExpiry: 120, // Inside Coin-Flip Hazard Zone
  }),
  enrichLargeTradePrint({
    id: "print-poly-01",
    timestamp: new Date(Date.now() - 110000).toISOString(),
    venue: "polymarket",
    ticker: "POLY-BTC-91500-1H",
    marketTitle: "Will BTC reach $91,500 by 20:00 UTC?",
    side: "YES",
    contracts: 2500,
    priceDollars: 0.44,
    orderType: "maker", // Maker limit order
    strikePrice: 91500,
    currentSpot: 91320,
    secondsToExpiry: 1800,
    walletIdentifier: "0x3f9d...88c2",
  }),
  enrichLargeTradePrint({
    id: "print-kal-02",
    timestamp: new Date(Date.now() - 195000).toISOString(),
    venue: "kalshi",
    ticker: "KXBTC15M-26OCT09-91100",
    marketTitle: "Bitcoin > $91,100 @ 19:15 UTC",
    side: "NO",
    contracts: 500,
    priceDollars: 0.22,
    orderType: "taker",
    strikePrice: 91100,
    currentSpot: 91240,
    secondsToExpiry: 270,
  }),
  enrichLargeTradePrint({
    id: "print-poly-02",
    timestamp: new Date(Date.now() - 320000).toISOString(),
    venue: "polymarket",
    ticker: "POLY-FED-RATE-NOV",
    marketTitle: "Fed cuts 25bps in November 2026?",
    side: "YES",
    contracts: 8000,
    priceDollars: 0.82,
    orderType: "taker",
    strikePrice: 100,
    currentSpot: 100,
    secondsToExpiry: 86400 * 14,
    walletIdentifier: "0x82a1...4410",
  }),
  enrichLargeTradePrint({
    id: "print-kal-03",
    timestamp: new Date(Date.now() - 480000).toISOString(),
    venue: "kalshi",
    ticker: "KXBTC15M-26OCT09-91300",
    marketTitle: "Bitcoin > $91,300 @ 19:15 UTC",
    side: "YES",
    contracts: 1500,
    priceDollars: 0.35,
    orderType: "maker",
    strikePrice: 91300,
    currentSpot: 91240,
    secondsToExpiry: 560,
  }),
];

/**
 * Queries large-trade feed with filter criteria.
 */
export function queryLargeTradeFeed(
  filter: LargeTradeFeedFilter = {},
  prints: LargeTradePrint[] = SAMPLE_LARGE_TRADE_PRINTS
): LargeTradePrint[] {
  return prints.filter((p) => {
    if (filter.venue && filter.venue !== "all" && p.venue !== filter.venue) {
      return false;
    }
    if (filter.minContracts && p.contracts < filter.minContracts) {
      return false;
    }
    if (filter.minNotional && p.notionalDollars < filter.minNotional) {
      return false;
    }
    if (filter.riskLevel && filter.riskLevel !== "all" && p.settlementRiskLevel !== filter.riskLevel) {
      return false;
    }
    return true;
  });
}
