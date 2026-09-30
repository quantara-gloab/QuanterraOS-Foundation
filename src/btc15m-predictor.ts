/**
 * KXBTC15M fair-value model. YES settles when the 60s-average BRTI at close is
 * >= the strike, so P(YES) is modeled as a driftless lognormal digital:
 *   P = Φ( ln(S/K) / (σ·√τ) ), σ = realized per-minute log-return volatility.
 * The model says nothing about direction beyond where price sits vs. the strike.
 */

export function normalCdf(x: number): number {
  // Abramowitz–Stegun 7.1.26 approximation of erf, max error ~1.5e-7.
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Std-dev of 1-minute log returns from a chronological series of per-minute prices. */
export function perMinuteVolatility(prices: number[]): number | null {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > 0 && prices[i - 1] > 0) returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  if (returns.length < 10) return null;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

export function probabilityYes(input: { price: number; strike: number; minutesLeft: number; sigmaPerMinute: number }): number {
  const { price, strike, minutesLeft, sigmaPerMinute } = input;
  if (minutesLeft <= 0 || sigmaPerMinute <= 0) return price >= strike ? 1 : 0;
  const p = normalCdf(Math.log(price / strike) / (sigmaPerMinute * Math.sqrt(minutesLeft)));
  return Math.min(0.999, Math.max(0.001, p));
}

export const takerFee = (price: number) => 0.07 * price * (1 - price);

/** Per-contract expected value of buying each side at its ask, if the model probability were true. */
export function expectedValues(pYes: number, yesAsk: number, noAsk: number) {
  return {
    yes: pYes - yesAsk - takerFee(yesAsk),
    no: (1 - pYes) - noAsk - takerFee(noAsk),
  };
}

/** Last tick at or before each minute boundary over the trailing window, oldest first. */
export function minuteCloses(ticks: { at: number; value: number }[], nowMs: number, windowMinutes: number): number[] {
  const closes: number[] = [];
  let i = 0;
  for (let m = windowMinutes; m >= 0; m--) {
    const boundary = nowMs - m * 60_000;
    while (i + 1 < ticks.length && ticks[i + 1].at <= boundary) i++;
    if (ticks[i] && ticks[i].at <= boundary) closes.push(ticks[i].value);
  }
  return closes;
}

export interface LiveMarket {
  ticker: string;
  open_time: string;
  close_time: string;
  floor_strike: number;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  no_bid_dollars: string;
  no_ask_dollars: string;
}

// Measured by src/btc15m-predictor-backtest.ts on 2026-09-28 over 1,316 settled markets.
export const BACKTEST_EVIDENCE = {
  run: "2026-09-28",
  markets: 1316,
  brierByMinute: {
    4: { market: 0.2001, model: 0.2063 },
    7: { market: 0.1685, model: 0.1755 },
    10: { market: 0.1248, model: 0.1333 },
    13: { market: 0.0731, model: 0.0835 },
  },
  tradingOnModelDisagreement: "lost money at minutes 4, 7 and 10; roughly break-even (+0.4¢) at minute 13",
};

export function buildPrediction(market: LiveMarket, ticks: { at: number; value: number }[], nowMs: number) {
  const closeMs = Date.parse(market.close_time);
  const minutesLeft = Math.max(0, (closeMs - nowMs) / 60_000);
  const yesBid = Number(market.yes_bid_dollars), yesAsk = Number(market.yes_ask_dollars);
  const noAsk = Number(market.no_ask_dollars);
  const marketP = yesAsk > 0 ? (yesBid + yesAsk) / 2 : null;
  const latest = ticks.at(-1) ?? null;
  const sigma = perMinuteVolatility(minuteCloses(ticks, nowMs, 60));
  const brtiFresh = latest !== null && nowMs - latest.at < 30_000;
  const modelP = brtiFresh && sigma
    ? probabilityYes({ price: latest.value, strike: market.floor_strike, minutesLeft, sigmaPerMinute: sigma })
    : null;
  // The market price out-scored the model at every minute tested, so it is the headline estimate.
  const best = marketP ?? modelP;
  return {
    ticker: market.ticker,
    openTime: market.open_time,
    closeTime: market.close_time,
    minutesLeft: Number(minutesLeft.toFixed(2)),
    target: market.floor_strike,
    brti: latest ? { value: latest.value, ageSeconds: Number(((nowMs - latest.at) / 1000).toFixed(1)), fresh: brtiFresh } : null,
    quotes: { yesBid, yesAsk, noBid: Number(market.no_bid_dollars), noAsk },
    prediction: best === null ? null : {
      pHigher: Number(best.toFixed(4)),
      source: marketP !== null ? "market mid-price" : "fair-value model (no two-sided quote)",
    },
    model: modelP === null ? null : {
      pHigher: Number(modelP.toFixed(4)),
      sigmaPerMinute: sigma,
      expectedValuePerContract: yesAsk > 0 ? expectedValues(modelP, yesAsk, noAsk) : null,
    },
    edge: "None measured. Neither the model nor any tested rule has beaten the market's own price out of sample.",
    evidence: BACKTEST_EVIDENCE,
  };
}

export {
  oneTouchProbability,
  oneTouchHighProbability,
  oneTouchLowProbability,
  oneTouchFromMinuteVol,
  computeRealizedVolatility,
  realizedVolatilityPerSecond,
  annualizedRealizedVolatility,
  oneTouchFromPriceSeries,
  type OneTouchProbabilityInput,
  type OneTouchProbabilityOptions,
  type RealizedVolatilityOptions,
  type RealizedVolatilityResult,
  type PriceSeriesInput,
  type TimestampedPrice,
} from "./barrier-touch.ts";


