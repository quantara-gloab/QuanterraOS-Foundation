/**
 * CLI report wrapper around computeMarketPriceCalibration() — same logic
 * that now also backs the live GET /api/calibration/market-price
 * endpoint in server.ts. Kept as a standalone script for reproducing the
 * findings.md write-up on demand.
 */
import { computeMarketPriceCalibration } from "./market-price-calibration.ts";

const csvPath = process.env.KALSHI_BACKTEST_CSV ?? "data/kalshi-btc15m-candles.csv";
const report = await computeMarketPriceCalibration(csvPath);

console.log(JSON.stringify({
  source: "market-price-baseline-backtest",
  coverage: `Covers the ${report.totalUniqueMarkets} unique markets with recorded price history in ${csvPath}; compare against the settled count in market_outcomes before citing this as full coverage.`,
  ...report,
}, null, 2));

