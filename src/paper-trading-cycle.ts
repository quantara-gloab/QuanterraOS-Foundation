/**
 * End-to-end cycle: High/Low barrier recommendation → paper-trade decision
 * → persistent log.
 *
 * Pipeline:
 *   computeHighLowRecommendation(contract)
 *    → suggestPaperTrade(input with market quote)
 *     → buildPaperTradeRow(input, decision)
 *      → insertPaperTrade(db, row)
 *
 * The market quote (yesAsk/yesBid/noAsk/noBid) is required to compute the
 * entry price and breakeven; it must come from a real source — in this
 * sandbox that means synthetic data with a realistic spread. When swapping
 * in a live feed, supply the real quote alongside the same contract ticks.
 */
import type { DatabaseSync } from "node:sqlite";
import {
  computeHighLowRecommendation,
  type OpenHighLowContract,
  type HighLowRecommendation,
} from "./agents/falcon-highlow.ts";
import {
  suggestPaperTrade,
  buildPaperTradeRow,
  insertPaperTrade,
  type PaperTradeRow,
  type PaperTradeInput,
  type MarketQuote,
} from "./paper-trading.ts";

export type { HighLowRecommendation };

export interface PaperTradeCycleInput {
  contract: OpenHighLowContract;
  market: MarketQuote;
  owner: string;
  modelSource: "quant" | "jev";
  edgeThreshold?: number;
  createdAt?: string;
}

export interface PaperTradeCycleResult {
  recommendation: HighLowRecommendation;
  paperTrade: PaperTradeRow;
}

/**
 * Runs the full cycle: compute the barrier-touch recommendation, decide
 * YES / NO / SKIP, build the row, and persist it. Returns null if the
 * recommendation cannot be computed (e.g. insufficient price data).
 */
export function runPaperTradingCycle(
  db: DatabaseSync,
  input: PaperTradeCycleInput,
): PaperTradeCycleResult | null {
  const recommendation = computeHighLowRecommendation(
    input.contract,
    new Date(input.createdAt ?? new Date().toISOString()),
  );

  const ptInput: PaperTradeInput = {
    owner: input.owner,
    contract: input.contract.ticker,
    modelProbability: recommendation.probability,
    modelSource: input.modelSource,
    barrierType: input.contract.barrierType,
    market: input.market,
    edgeThreshold: input.edgeThreshold,
    createdAt: input.createdAt,
  };

  const decision = suggestPaperTrade(ptInput);
  const row = buildPaperTradeRow(ptInput, decision);
  insertPaperTrade(db, row);

  return { recommendation, paperTrade: row };
}
