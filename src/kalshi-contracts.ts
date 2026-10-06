/**
 * QuanterraOS Kalshi Specialization Engine: 15-Minute & 1-Hour Above/Below
 *
 * Formalized contract specifications, strike ladder parsing, and fee modeling for:
 * 1. 15-Minute Above/Below: Series 'KXBTC15M' (Settles on 15m close vs open strike)
 * 2. 1-Hour Above/Below:    Series 'KXBTCD'   (Settles on hourly close vs fixed strike)
 *
 * Both settle strictly against the 60-second TWAP of CME CF Bitcoin Real-Time Index (BRTI).
 * Enforces Rule B5: Zero live capital deployed ($0.00).
 */

export type KalshiTimeframe = "15m" | "1h";

export interface KalshiContractSpec {
  seriesTicker: "KXBTC15M" | "KXBTCD";
  timeframe: KalshiTimeframe;
  name: string;
  description: string;
  cadenceMinutes: number;
  strikeStructure: "at_open_relative" | "fixed_strike_ladder";
  settlementSource: "CME CF BRTI 60s TWAP";
  takerFeeFormula: "$0.07 * P * (1 - P)";
}

export const KALSHI_CONTRACT_SPECS: Record<KalshiTimeframe, KalshiContractSpec> = {
  "15m": {
    seriesTicker: "KXBTC15M",
    timeframe: "15m",
    name: "15-Minute Bitcoin Above/Below",
    description: "Binary prediction on whether BTC CME CF BRTI at the 15-minute close is above or below the strike established at open.",
    cadenceMinutes: 15,
    strikeStructure: "at_open_relative",
    settlementSource: "CME CF BRTI 60s TWAP",
    takerFeeFormula: "$0.07 * P * (1 - P)",
  },
  "1h": {
    seriesTicker: "KXBTCD",
    timeframe: "1h",
    name: "1-Hour Bitcoin Above/Below",
    description: "Binary prediction on whether BTC CME CF BRTI at the top of the hour is above or below a designated dollar strike level.",
    cadenceMinutes: 60,
    strikeStructure: "fixed_strike_ladder",
    settlementSource: "CME CF BRTI 60s TWAP",
    takerFeeFormula: "$0.07 * P * (1 - P)",
  },
};

export interface KalshiContractData {
  ticker: string;
  seriesTicker: string;
  timeframe: KalshiTimeframe;
  title: string;
  subtitle: string;
  strike: number;
  strikeType: "greater" | "less" | "above" | "below";
  closeTime: string;
  openTime: string;
  minutesLeft: number;
  yesBid: number; // in dollars (0.00 - 1.00)
  yesAsk: number; // in dollars (0.00 - 1.00)
  noBid: number;  // in dollars (0.00 - 1.00)
  noAsk: number;  // in dollars (0.00 - 1.00)
  lastPrice: number;
  takerFeeYes: number; // in dollars
  takerFeeNo: number;  // in dollars
  breakevenYes: number; // required win probability for YES
  breakevenNo: number;  // required win probability for NO
  status: string;
}

export interface KalshiStrikeLadderEntry {
  ticker: string;
  strike: number;
  subtitle: string;
  distanceFromSpot: number; // Spot - Strike in dollars
  distanceBps: number;
  yesBid: number | null;
  yesAsk: number | null;
  impliedProb: number | null;
  takerFee: number | null;
  netEvAtFiftyPctWin: number | null;
  closeTime?: string;
}

/**
 * Safely parses price quotes from Kalshi payloads.
 * Handles both dollar strings/floats ("0.48") and integer cents (48 -> 0.48).
 * Returns null if missing or 0 to avoid fabricating fake prices.
 */
export function parseQuotePrice(dollarsVal: any, centsVal: any): number | null {
  if (dollarsVal !== undefined && dollarsVal !== null && dollarsVal !== "") {
    const parsed = parseFloat(dollarsVal);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1.0) {
      return Math.round(parsed * 10000) / 10000;
    }
  }
  if (centsVal !== undefined && centsVal !== null && centsVal !== "") {
    const parsedCents = parseFloat(centsVal);
    if (!isNaN(parsedCents) && parsedCents > 0) {
      const dollars = parsedCents >= 1 ? parsedCents / 100 : parsedCents;
      if (dollars > 0 && dollars <= 1.0) {
        return Math.round(dollars * 10000) / 10000;
      }
    }
  }
  return null;
}

/**
 * Calculates the exact Kalshi non-linear taker fee for a given contract price.
 * Fee(P) = $0.07 * P * (1 - P)
 * Maximum fee is $0.0175 at P = 0.50.
 */
export function calculateKalshiTakerFee(priceDollars: number): number {
  const p = Math.max(0, Math.min(1, priceDollars));
  const fee = 0.07 * p * (1 - p);
  return Math.round(fee * 10000) / 10000;
}

/**
 * Calculates net breakeven probability including exchange taker fee.
 */
export function calculateBreakevenProbability(entryPrice: number, isYes: boolean): number {
  const fee = calculateKalshiTakerFee(entryPrice);
  const totalCost = entryPrice + fee;
  // A win pays $1.00 gross. Breakeven occurs when P_win * $1.00 = totalCost.
  return Math.max(0, Math.min(1, Math.round(totalCost * 10000) / 10000));
}

/**
 * Parses raw Kalshi market payload into a normalized KalshiContractData object.
 */
export function normalizeKalshiContract(raw: any, timeframe: KalshiTimeframe): KalshiContractData {
  const now = Date.now();
  const closeMs = Date.parse(raw.close_time || "");
  const minutesLeft = Math.max(0, Math.round(((closeMs - now) / 60000) * 10) / 10);

  const yesAsk = parseQuotePrice(raw.yes_ask_dollars, raw.yes_ask);
  const yesBid = parseQuotePrice(raw.yes_bid_dollars, raw.yes_bid);
  const noAsk = parseQuotePrice(raw.no_ask_dollars, raw.no_ask);
  const noBid = parseQuotePrice(raw.no_bid_dollars, raw.no_bid);

  const strike = raw.floor_strike ?? raw.cap_strike ?? 0;
  const takerFeeYes = yesAsk !== null ? calculateKalshiTakerFee(yesAsk) : 0;
  const takerFeeNo = noAsk !== null ? calculateKalshiTakerFee(noAsk) : 0;

  return {
    ticker: raw.ticker || `KXBTC${timeframe === "15m" ? "15M" : "D"}-SIMULATED`,
    seriesTicker: raw.series_ticker || (timeframe === "15m" ? "KXBTC15M" : "KXBTCD"),
    timeframe,
    title: raw.title || `Bitcoin price ${timeframe === "15m" ? "in next 15 mins?" : "at close?"}`,
    subtitle: raw.subtitle || (strike > 0 ? `$${strike.toLocaleString()} or above` : "Above or Below"),
    strike,
    strikeType: raw.strike_type || "greater",
    closeTime: raw.close_time || new Date(now + (timeframe === "15m" ? 15 : 60) * 60000).toISOString(),
    openTime: raw.open_time || new Date(now).toISOString(),
    minutesLeft,
    yesBid: yesBid ?? 0,
    yesAsk: yesAsk ?? 0,
    noBid: noBid ?? 0,
    noAsk: noAsk ?? 0,
    lastPrice: parseQuotePrice(raw.last_price_dollars, raw.last_price) ?? 0,
    takerFeeYes,
    takerFeeNo,
    breakevenYes: yesAsk !== null ? calculateBreakevenProbability(yesAsk, true) : 0,
    breakevenNo: noAsk !== null ? calculateBreakevenProbability(noAsk, false) : 0,
    status: raw.status || "active",
  };
}

/**
 * Selects the optimal At-The-Money (ATM) contract from a list of open hourly markets.
 * Strictly scopes to the nearest hourly event window so different expiries are never mixed.
 */
export function selectAtmHourlyMarket(markets: any[], currentSpot: number): any | null {
  if (!markets || markets.length === 0) return null;
  const now = Date.now();
  const valid = markets.filter(m => Date.parse(m.close_time) > now);
  if (valid.length === 0) return null;

  // Filter to the nearest event window
  const minCloseMs = Math.min(...valid.map(m => Date.parse(m.close_time)));
  const nearestMarkets = valid.filter(m => Math.abs(Date.parse(m.close_time) - minCloseMs) < 10 * 60000);

  // Find contract whose floor_strike is closest to currentSpot
  let best = nearestMarkets[0];
  let minDiff = Infinity;

  for (const m of nearestMarkets) {
    const strike = m.floor_strike ?? m.cap_strike ?? 0;
    if (strike <= 0) continue;
    const diff = Math.abs(currentSpot - strike);
    if (diff < minDiff) {
      minDiff = diff;
      best = m;
    }
  }

  return best;
}

/**
 * Builds an ordered strike ladder around current spot price for 1-hour contracts.
 * Strictly filters to the nearest hourly expiry so different hours are never mixed.
 * Preserves null for empty books to prevent displaying fabricated quotes.
 */
export function buildStrikeLadder(markets: any[], currentSpot: number): KalshiStrikeLadderEntry[] {
  const now = Date.now();
  const allFuture = (markets || []).filter(
    m => Date.parse(m.close_time) > now && (m.floor_strike || m.cap_strike)
  );

  if (allFuture.length === 0) return [];

  // Filter strictly to the nearest hourly event window
  const minCloseMs = Math.min(...allFuture.map(m => Date.parse(m.close_time)));
  const nearestHourMarkets = allFuture.filter(
    m => Math.abs(Date.parse(m.close_time) - minCloseMs) < 10 * 60000
  );

  const sorted = nearestHourMarkets.sort(
    (a, b) => (b.floor_strike ?? b.cap_strike ?? 0) - (a.floor_strike ?? a.cap_strike ?? 0)
  );

  return sorted.map(m => {
    const strike = m.floor_strike ?? m.cap_strike ?? 0;
    const yesAsk = parseQuotePrice(m.yes_ask_dollars, m.yes_ask);
    const yesBid = parseQuotePrice(m.yes_bid_dollars, m.yes_bid);

    const hasAsk = yesAsk !== null && yesAsk > 0;
    const hasBid = yesBid !== null && yesBid > 0;

    let impliedProb: number | null = null;
    if (hasAsk && hasBid) {
      impliedProb = Math.round(((yesAsk! + yesBid!) / 2) * 100) / 100;
    } else if (hasAsk) {
      impliedProb = yesAsk;
    } else if (hasBid) {
      impliedProb = yesBid;
    }

    const takerFee = hasAsk ? calculateKalshiTakerFee(yesAsk!) : null;
    const dist = Math.round((currentSpot - strike) * 100) / 100;
    const distBps = currentSpot > 0 ? Math.round((dist / currentSpot) * 10000 * 10) / 10 : 0;

    // EV of a trade with an assumed 50% true win rate: 0.50 * $1.00 - (yesAsk + fee)
    const netEvAtFiftyPctWin =
      hasAsk && takerFee !== null
        ? Math.round((0.50 - (yesAsk! + takerFee)) * 10000) / 10000
        : null;

    return {
      ticker: m.ticker,
      strike,
      subtitle: m.subtitle || `$${strike.toLocaleString()} or above`,
      distanceFromSpot: dist,
      distanceBps: distBps,
      yesBid,
      yesAsk,
      impliedProb,
      takerFee,
      netEvAtFiftyPctWin,
      closeTime: m.close_time,
    };
  });
}
