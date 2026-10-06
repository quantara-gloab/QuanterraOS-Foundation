/**
 * Live BTC 15-min paper-trading cycle.
 *
 * Wires the live data sources into the paper-trading decision engine:
 * 1. Fetch open KXBTC15M contracts from the Kalshi API
 * 2. Fetch recent BTC index ticks (BRTI) from the local DB
 * 3. Compute model probability via btc15m-predictor.ts (fair-value model)
 * 4. Build a MarketQuote from the contract's yes/no bid/ask
 * 5. Run suggestPaperTrade → buildPaperTradeRow → insertPaperTrade
 *
 * The barrier for these contracts is "BTC price above floor_strike at close",
 * so direction is always mapped as barrierType="high" (YES wins if BRTI >= strike).
 *
 * Uses node:sqlite (DatabaseSync) from store.ts — same as the rest of the
 * paper-trading module.
 */
import { DatabaseSync } from "node:sqlite";
import { buildPrediction, type LiveMarket } from "./btc15m-predictor.ts";
import {
  suggestPaperTrade,
  buildPaperTradeRow,
  insertPaperTrade,
  type PaperTradeRow,
  type PaperTradeInput,
  type MarketQuote,
} from "./paper-trading.ts";
import { loadRecentBtcTicks } from "./btc-data.ts";

export interface KalshiLiveMarket extends LiveMarket {
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  no_bid_dollars: string;
  no_ask_dollars: string;
}

function toMarketQuote(market: KalshiLiveMarket): MarketQuote {
  return {
    yesAsk: Number(market.yes_ask_dollars),
    yesBid: Number(market.yes_bid_dollars),
    noAsk: Number(market.no_ask_dollars),
    noBid: Number(market.no_bid_dollars),
  };
}

export interface BtcPaperTradeCycleDeps {
  db: DatabaseSync;
  kalshiUrl?: string;
  fetchMarkets?: () => Promise<KalshiLiveMarket[]> | KalshiLiveMarket[];
  fetchBtcTicks: (nowMs: number, windowMinutes?: number) => { at: number; value: number }[];
}

export interface BtcPaperTradeCycleOptions {
  owner: string;
  edgeThreshold?: number;
  onlyWhen?: "open" | "flagged";
}

export interface BtcPaperTradeCycleResult {
  recommendation: {
    ticker: string;
    probability: number;
    model: "fair-value";
    marketMid: number;
    edge: number;
  };
  paperTrade: PaperTradeRow;
}

/**
 * Runs one cycle of the BTC 15-min paper-trader:
 * fetches open contracts, computes model probability for each,
 * decides YES/NO/SKIP, and logs every decision to the store.
 *
 * Returns only the flagged (BUY) trades. To see ALL decisions
 * including SKIPs, query the paper_trades table by owner.
 */
export async function runBtcPaperTradingCycle(
  deps: BtcPaperTradeCycleDeps,
  options: BtcPaperTradeCycleOptions,
): Promise<BtcPaperTradeCycleResult[]> {
  const now = Date.now();
  let markets: KalshiLiveMarket[];

  if (deps.fetchMarkets) {
    markets = await deps.fetchMarkets();
  } else {
    const kalshiUrl = deps.kalshiUrl ??
      "https://external-api.kalshi.com/trade-api/v2/markets?series_ticker=KXBTC15M&status=open&limit=20";
    const response = await fetch(kalshiUrl, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Kalshi markets ${response.status}`);
    markets = ((await response.json()).markets ?? []) as KalshiLiveMarket[];
  }

  // Only act on contracts that haven't closed yet
  const openMarkets = markets.filter((m) => Date.parse(m.close_time) > now);

  const ticks = deps.fetchBtcTicks(now, 60);

  const results: BtcPaperTradeCycleResult[] = [];

  for (const market of openMarkets) {
    const prediction = buildPrediction(market, ticks, now);

    // The model provides pHigher; market mid is the headline
    const marketMid =
      market.yes_bid_dollars && market.yes_ask_dollars
        ? (Number(market.yes_bid_dollars) + Number(market.yes_ask_dollars)) / 2
        : null;

    if (!prediction.model || marketMid === null) {
      continue; // Not enough data — skip this contract
    }

    const marketQuote: MarketQuote = toMarketQuote(market);

    // For KXBTC15M contracts: YES = price goes UP (high barrier)
    const ptInput: PaperTradeInput = {
      owner: options.owner,
      contract: market.ticker,
      modelProbability: prediction.model.pHigher,
      modelSource: "quant",
      barrierType: "high",
      market: marketQuote,
      edgeThreshold: options.edgeThreshold,
      createdAt: new Date().toISOString(),
    };

    const decision = suggestPaperTrade(ptInput);
    const row = buildPaperTradeRow(ptInput, decision);

    const marketEdge = prediction.model.expectedValuePerContract
      ? { yes: prediction.model.expectedValuePerContract.yes, no: prediction.model.expectedValuePerContract.no }
      : undefined;

    insertPaperTrade(deps.db, row);

    results.push({
      recommendation: {
        ticker: market.ticker,
        probability: prediction.model.pHigher,
        model: "fair-value",
        marketMid,
        edge: marketEdge?.yes ?? 0,
      },
      paperTrade: row,
    });
  }

  return results;
}

/**
 * Fetches recent BTC index ticks from the local store DB.
 * Same data source as btc15m-predictor.ts's /api/fair-value/btc15m endpoint.
 */
export function createLiveBtcTickFetcher(dbPath: string) {
  return function fetchBtcTicks(nowMs: number, windowMinutes = 60) {
    return loadRecentBtcTicks(dbPath, nowMs, windowMinutes);
  };
}
