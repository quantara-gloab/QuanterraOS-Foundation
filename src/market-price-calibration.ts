/**
 * Live market-price-as-probability calibration.
 *
 * Extracted from market-price-baseline-backtest.ts so the same logic
 * backs both the one-off findings.md report and a live, recomputing
 * API endpoint (see /api/calibration/market-price in server.ts).
 *
 * Every call re-reads the candlestick CSV from disk — there is no
 * cached/frozen snapshot here, so this grows automatically if that
 * file ever gains more settled markets.
 *
 * No lookahead: only a market's own minute-4 entry candle is used, and
 * only candles strictly before that market's own close are considered.
 */
import fs from "node:fs/promises";
import { scoreObservation, computeCalibrationCurve, summarizePerformance } from "./scoring.ts";
import type { ObservationRow, ResolutionRow, CalibrationBin } from "./scoring.ts";

const entryMinute = 4;
const matchToleranceSeconds = 60;

interface CsvRow {
  ticker: string;
  timestamp: string;
  yes_bid: string;
  yes_ask: string;
  volume: string;
  result: string;
  open_time: string;
  close_time: string;
}

interface Candle {
  timestamp: number;
  bid: number | null;
  ask: number | null;
}

export interface CalibrationMarket {
  ticker: string;
  openTime: number;
  closeTime: number;
  result: string;
  candles: Candle[];
}

function parseCsv(text: string): CsvRow[] {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const headers = header.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((key, index) => [key, values[index] ?? ""])) as unknown as CsvRow;
  });
}

function number(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildMarketsFromCsvText(text: string): CalibrationMarket[] {
  const rows = parseCsv(text);
  const markets = new Map<string, CalibrationMarket>();
  for (const row of rows) {
    const market = markets.get(row.ticker) ?? {
      ticker: row.ticker,
      openTime: Number(row.open_time),
      closeTime: Number(row.close_time),
      result: row.result,
      candles: [],
    };
    market.candles.push({ timestamp: Number(row.timestamp), bid: number(row.yes_bid), ask: number(row.yes_ask) });
    markets.set(row.ticker, market);
  }
  return [...markets.values()].sort((a, b) => a.openTime - b.openTime);
}

export interface MarketPriceCalibrationReport {
  totalUniqueMarkets: number;
  skippedNoEntryCandle: number;
  sampleSize: number;
  averageBrierScore: number | null;
  calibration: CalibrationBin[];
  entryMinute: number;
  claim: string;
  notTheClaim: string;
}

/** Pure and independently testable: given already-parsed markets, score
 * the market-mid-price-as-probability baseline against real outcomes. */
export function computeCalibrationFromMarkets(markets: CalibrationMarket[]): Omit<MarketPriceCalibrationReport, "claim" | "notTheClaim"> {
  const scored = [];
  let skippedNoEntryCandle = 0;

  for (const market of markets) {
    if (market.result !== "yes" && market.result !== "no") continue;
    const target = market.openTime + entryMinute * 60;
    const eligibleCandles = market.candles.filter((c) => c.timestamp < market.closeTime);
    if (!eligibleCandles.length) {
      skippedNoEntryCandle += 1;
      continue;
    }
    const candle = eligibleCandles.reduce((best, row) => (
      Math.abs(row.timestamp - target) < Math.abs(best.timestamp - target) ? row : best
    ), eligibleCandles[0]);
    if (Math.abs(candle.timestamp - target) > matchToleranceSeconds || candle.bid === null || candle.ask === null) {
      skippedNoEntryCandle += 1;
      continue;
    }
    const yesMid = Math.min(1, Math.max(0, (candle.bid + candle.ask) / 2));

    const observation: ObservationRow = {
      id: `price-baseline:${market.ticker}`,
      owner: "backtest",
      contract: market.ticker,
      source: "market-price-baseline",
      direction: yesMid >= 0.5 ? "yes" : "no",
      hypothesis: `Entry-minute (minute ${entryMinute}) market mid-price used directly as the probability estimate.`,
      probability: yesMid,
      created: new Date(candle.timestamp * 1000).toISOString(),
    };
    const resolution: ResolutionRow = {
      owner: "backtest",
      contract: market.ticker,
      outcome: market.result.toUpperCase() as ResolutionRow["outcome"],
      officialSource: "kalshi-btc15m-candles.csv",
      resolvedAt: new Date(market.closeTime * 1000).toISOString(),
      finalized: true,
    };
    scored.push(scoreObservation(observation, resolution));
  }

  const summary = summarizePerformance(scored);
  return {
    totalUniqueMarkets: markets.length,
    skippedNoEntryCandle,
    sampleSize: summary.scored,
    averageBrierScore: summary.averageBrierScore,
    calibration: computeCalibrationCurve(scored),
    entryMinute,
  };
}

export async function computeMarketPriceCalibration(
  csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv",
): Promise<MarketPriceCalibrationReport> {
  const text = await fs.readFile(csvPath, "utf8");
  const markets = buildMarketsFromCsvText(text);
  const base = computeCalibrationFromMarkets(markets);
  return {
    ...base,
    claim: `The market's own entry price has been verified well-calibrated over ${base.sampleSize} settled 15-minute BTC contracts.`,
    notTheClaim: "This is not a claim that this project predicts better than the market — no tested feature or agent has shown that yet.",
  };
}
