/**
 * Paper-trading module for high/low barrier contracts.
 *
 * Given a recommendation (quant or Jev-calibrated probability) and the market's
 * current implied price, decides whether to take a paper position (BUY YES or
 * BUY NO) or SKIP based on whether the model's edge clears a threshold after
 * fees and spread. Every decision is logged to `paper_trades` for later
 * scoring against resolution — no real capital is ever at risk.
 *
 * The scoring path reuses `scoreObservation()` from scoring.ts, so paper-trade
 * calibration and Brier scores are directly comparable to human forecasts and
 * accepted agent recommendations.
 *
 * Conventions mirror falcon_recommendations:
 *   - Logs unconditionally (BUY or SKIP), so the track record shows flag rate
 *     alongside hit rate.
 *   - Stores full evidence_json for audit.
 *   - Uses the same fee approximation (0.07 * p * (1-p)) as edge-score.ts.
 *
 * Usage:
 *   import { suggestPaperTrade, scorePaperTrade, computePaperTrackRecord } from "./paper-trading.ts";
 */
import type { DatabaseSync } from "node:sqlite";
import {
  scoreObservation,
  type ObservationRow,
  type ResolutionRow,
} from "./scoring.ts";
import type { HighLowRecommendation } from "./agents/falcon-highlow.ts";

export type PaperTradeSide = "yes" | "no";
export type PaperTradeDecision = "buy" | "skip";
export type PaperTradeStatus = "proposed" | "resolved";
export type ModelSource = "quant" | "jev";

export interface MarketQuote {
  yesAsk: number;
  yesBid: number;
  noAsk: number;
  noBid: number;
}

export interface PaperTradeInput {
  owner: string;
  contract: string;
  modelProbability: number;
  modelSource: ModelSource;
  barrierType: "high" | "low";
  market: MarketQuote;
  edgeThreshold?: number;
  createdAt?: string;
}

export interface PaperTradeRow {
  id: string;
  owner: string;
  contract: string;
  modelProbability: number;
  modelSource: ModelSource;
  barrierType: "high" | "low";
  side: PaperTradeSide | null;
  decision: PaperTradeDecision;
  entryPrice: number | null;
  breakevenProbability: number;
  edge: number;
  feeEstimate: number;
  rationale: string;
  evidenceJson: string;
  status: PaperTradeStatus;
  resolvedAt: string | null;
  outcome: "YES" | "NO" | "VOID" | null;
  brierScore: number | null;
  pnl: number | null;
  createdAt: string;
}

export interface PaperTrackRecord {
  total: number;
  buy: number;
  skip: number;
  resolved: number;
  winRate: number | null;
  averageBrierScore: number | null;
  averagePnl: number | null;
  totalPnl: number | null;
  yesTrades: number;
  noTrades: number;
  bestTrade: number | null;
  worstTrade: number | null;
}

const DEFAULT_EDGE_THRESHOLD = 0.03;

/**
 * Estimates Kalshi-style fee: 0.07 * p * (1 - p), the same formula
 * used in edge-score.ts. This is an approximation — verify against
 * Kalshi's current published fee schedule for real trading.
 */
export function estimateFee(price: number): number {
  const p = Math.min(1, Math.max(0, price));
  return 0.07 * p * (1 - p);
}

/**
 * Computes the edge for both YES and NO sides.
 *
 * YES edge  = modelProbability - (yesAsk + fee(yesAsk))
 * NO  edge  = (1 - modelProbability) - (noAsk + fee(noAsk))
 *
 * Positive edge means the model probability clears the breakeven
 * price-plus-fee, i.e. there is expected value in taking that side.
 */
export function computeEdges(
  modelProbability: number,
  market: MarketQuote,
): {
  yesEdge: number;
  noEdge: number;
  yesBreakeven: number;
  noBreakeven: number;
  yesFee: number;
  noFee: number;
} {
  const yesFee = estimateFee(market.yesAsk);
  const noFee = estimateFee(market.noAsk);
  const yesBreakeven = market.yesAsk + yesFee;
  const noBreakeven = market.noAsk + noFee;
  return {
    yesEdge: modelProbability - yesBreakeven,
    noEdge: 1 - modelProbability - noBreakeven,
    yesBreakeven,
    noBreakeven,
    yesFee,
    noFee,
  };
}

/**
 * Given a recommendation and market quote, decide whether to BUY YES,
 * BUY NO, or SKIP — based on whether either side's edge clears the
 * threshold after fees.
 *
 * The decision picks the side with the higher edge if it clears the
 * threshold; otherwise it skips. This is a pure function with no side
 * effects.
 */
export function suggestPaperTrade(input: PaperTradeInput): {
  decision: PaperTradeDecision;
  side: PaperTradeSide | null;
  edge: number;
  entryPrice: number | null;
  breakevenProbability: number;
  feeEstimate: number;
  rationale: string;
} {
  const threshold = input.edgeThreshold ?? DEFAULT_EDGE_THRESHOLD;
  const p = Math.min(0.999, Math.max(0.001, input.modelProbability));
  const edges = computeEdges(p, input.market);

  const yesAsk = input.market?.yesAsk;
  const noAsk = input.market?.noAsk;
  const hasRealYesAsk = typeof yesAsk === "number" && !isNaN(yesAsk) && yesAsk >= 0.01 && yesAsk <= 0.99;
  const hasRealNoAsk = typeof noAsk === "number" && !isNaN(noAsk) && noAsk >= 0.01 && noAsk <= 0.99;

  if (hasRealYesAsk && edges.yesEdge > threshold && edges.yesEdge >= edges.noEdge) {
    return {
      decision: "buy",
      side: "yes",
      edge: Number(edges.yesEdge.toFixed(6)),
      entryPrice: Number(yesAsk.toFixed(6)),
      breakevenProbability: Number(edges.yesBreakeven.toFixed(6)),
      feeEstimate: Number(edges.yesFee.toFixed(6)),
      rationale: `YES edge ${Number(edges.yesEdge.toFixed(4))} clears threshold ${threshold} (P=${p.toFixed(4)} vs breakeven ${edges.yesBreakeven.toFixed(4)}).`,
    };
  }

  if (hasRealNoAsk && edges.noEdge > threshold) {
    return {
      decision: "buy",
      side: "no",
      edge: Number(edges.noEdge.toFixed(6)),
      entryPrice: Number(noAsk.toFixed(6)),
      breakevenProbability: Number(edges.noBreakeven.toFixed(6)),
      feeEstimate: Number(edges.noFee.toFixed(6)),
      rationale: `NO edge ${Number(edges.noEdge.toFixed(4))} clears threshold ${threshold} (P=${p.toFixed(4)} vs breakeven ${edges.noBreakeven.toFixed(4)}).`,
    };
  }

  const unquotedNotice = (!hasRealYesAsk && edges.yesEdge > threshold) || (!hasRealNoAsk && edges.noEdge > threshold)
    ? " Real ask price required ($0.01 - $0.99); unquoted or $0.00 ask rejected."
    : "";

  return {
    decision: "skip",
    side: null,
    edge: Math.max(edges.yesEdge, edges.noEdge),
    entryPrice: null,
    breakevenProbability: Math.min(edges.yesBreakeven, edges.noBreakeven),
    feeEstimate: edges.yesEdge >= edges.noEdge ? edges.yesFee : edges.noFee,
    rationale: `No edge clears threshold ${threshold} (YES edge ${Number(edges.yesEdge.toFixed(4))}, NO edge ${Number(edges.noEdge.toFixed(4))}).${unquotedNotice} Skipped.`,
  };
}

/**
 * Builds the full PaperTradeRow to persist, including the model-side
 * evidence JSON (barrier type, model probability, model source, market quote).
 */
export function buildPaperTradeRow(
  input: PaperTradeInput,
  decision: ReturnType<typeof suggestPaperTrade>,
  generateId: () => string = () => crypto.randomUUID(),
): PaperTradeRow {
  const now = input.createdAt ?? new Date().toISOString();
  const evidence = {
    barrierType: input.barrierType,
    modelSource: input.modelSource,
    modelProbability: input.modelProbability,
    marketQuote: input.market,
    edgeThreshold: input.edgeThreshold ?? DEFAULT_EDGE_THRESHOLD,
  };

  if (decision.decision === "buy" && (decision.entryPrice === null || decision.entryPrice <= 0 || isNaN(decision.entryPrice))) {
    throw new Error(
      "Paper trade violation: Real ask price required for buy decision ($0.01 - $0.99). $0.00 buys are strictly prohibited."
    );
  }

  return {
    id: generateId(),
    owner: input.owner,
    contract: input.contract,
    modelProbability: input.modelProbability,
    modelSource: input.modelSource,
    barrierType: input.barrierType,
    side: decision.side,
    decision: decision.decision,
    entryPrice: decision.entryPrice,
    breakevenProbability: decision.breakevenProbability,
    edge: decision.edge,
    feeEstimate: decision.feeEstimate,
    rationale: decision.rationale,
    evidenceJson: JSON.stringify(evidence),
    status: "proposed",
    resolvedAt: null,
    outcome: null,
    brierScore: null,
    pnl: null,
    createdAt: now,
  };
}

/**
 * Convenience: turn a HighLowRecommendation (from computeHighLowRecommendation
 * or computeFalconJevRecommendation) plus a market quote into a full
 * PaperTradeRow, ready to insert. This is the one-call bridge from the
 * barrier model to the paper-trading log.
 */
export function recommendPaperTrade(
  recommendation: HighLowRecommendation,
  market: MarketQuote,
  owner: string,
  options?: {
    edgeThreshold?: number;
    createdAt?: string;
    generateId?: () => string;
  },
): PaperTradeRow {
  const input: PaperTradeInput = {
    owner,
    contract: recommendation.ticker,
    modelProbability: recommendation.probability,
    modelSource: "quant",
    barrierType: recommendation.barrierType,
    market,
    edgeThreshold: options?.edgeThreshold,
    createdAt: options?.createdAt,
  };
  const decision = suggestPaperTrade(input);
  const generateId = options?.generateId ?? (() => crypto.randomUUID());
  return buildPaperTradeRow(input, decision, generateId);
}

/**
 * Scores a paper trade against its resolution, computing the Brier score
 * and simulated P&L using the same scoring.ts logic as human/agent forecasts.
 *
 * P&L = (outcome - entryPrice - fee) for the side taken.
 * VOID or abstained trades are not scored but remain visible.
 */
export function scorePaperTrade(
  trade: PaperTradeRow,
  resolution: ResolutionRow,
): {
  brierScore: number | null;
  pnl: number | null;
  scorable: boolean;
  reason?: string;
} {
  const observation: ObservationRow = {
    id: `paper:${trade.id}`,
    owner: trade.owner,
    contract: trade.contract,
    source: `paper-${trade.modelSource}`,
    direction:
      trade.side === "yes" ? "yes" : trade.side === "no" ? "no" : "abstain",
    hypothesis: trade.rationale,
    probability:
      trade.side === "yes"
        ? trade.modelProbability
        : trade.side === "no"
          ? 1 - trade.modelProbability
          : null,
    created: trade.createdAt,
  };

  const scored = scoreObservation(observation, resolution);

  if (trade.side === null || trade.entryPrice === null || !scored.scorable) {
    return {
      brierScore: null,
      pnl: null,
      scorable: false,
      reason: scored.reason,
    };
  }

  const won = resolution.outcome === (trade.side === "yes" ? "YES" : "NO");
  const payout = won ? 1 : 0;
  const pnl = Number(
    (payout - trade.entryPrice! - trade.feeEstimate).toFixed(6),
  );

  return {
    brierScore: scored.brierScore,
    pnl,
    scorable: true,
  };
}

/**
 * Aggregates a paper trade's full history into a track record.
 * Mirrors the honesty rules from computeFalconTrackRecord:
 * - Un-resolved trades are counted but not scored.
 * - VOID resolutions are not scored.
 * - Skipped (no-position) trades are counted but never produce P&L.
 *
 * Uses the same `scoreObservation` pathway so Brier scores are
 * directly comparable to human/agent forecasts.
 */
export function computePaperTrackRecord(
  trades: PaperTradeRow[],
  resolutionsByContract: Map<string, ResolutionRow>,
): PaperTrackRecord {
  const record: PaperTrackRecord = {
    total: trades.length,
    buy: 0,
    skip: 0,
    resolved: 0,
    winRate: null,
    averageBrierScore: null,
    averagePnl: null,
    totalPnl: null,
    yesTrades: 0,
    noTrades: 0,
    bestTrade: null,
    worstTrade: null,
  };

  const pnls: number[] = [];
  const brierScores: number[] = [];

  for (const trade of trades) {
    if (trade.decision === "buy") {
      record.buy++;
      if (trade.side === "yes") record.yesTrades++;
      if (trade.side === "no") record.noTrades++;
    } else {
      record.skip++;
    }

    if (trade.status !== "resolved") continue;
    record.resolved++;

    if (trade.brierScore !== null && trade.pnl !== null) {
      brierScores.push(trade.brierScore);
      pnls.push(trade.pnl);
    }
  }

  if (pnls.length > 0) {
    record.winRate = Number(
      (pnls.filter((p) => p > 0).length / pnls.length).toFixed(4),
    );
    record.averagePnl = Number(
      (pnls.reduce((a, b) => a + b, 0) / pnls.length).toFixed(6),
    );
    record.totalPnl = Number(pnls.reduce((a, b) => a + b, 0).toFixed(4));
    record.bestTrade = Number(Math.max(...pnls).toFixed(4));
    record.worstTrade = Number(Math.min(...pnls).toFixed(4));
  }

  if (brierScores.length > 0) {
    record.averageBrierScore = Number(
      (brierScores.reduce((a, b) => a + b, 0) / brierScores.length).toFixed(6),
    );
  }

  return record;
}

// ---------------------------------------------------------------------------
// Database store methods
// ---------------------------------------------------------------------------

export interface PaperTradeStoreDeps {
  generateId?: () => string;
  now?: () => string;
}

/** Insert a paper trade row into the database. */
export function insertPaperTrade(
  db: DatabaseSync,
  row: PaperTradeRow,
): PaperTradeRow {
  db.prepare(
    `INSERT INTO paper_trades (
      id, owner, contract, model_probability, model_source, barrier_type,
      side, decision, entry_price, breakeven_probability, edge, fee_estimate,
      rationale, evidence_json, status, resolved_at, outcome, brier_score, pnl, created_at
    ) VALUES (
      @id, @owner, @contract, @modelProbability, @modelSource, @barrierType,
      @side, @decision, @entryPrice, @breakevenProbability, @edge, @feeEstimate,
      @rationale, @evidenceJson, @status, @resolvedAt, @outcome, @brierScore, @pnl, @createdAt
    )`,
  ).run({
    id: row.id,
    owner: row.owner,
    contract: row.contract,
    modelProbability: row.modelProbability,
    modelSource: row.modelSource,
    barrierType: row.barrierType,
    side: row.side,
    decision: row.decision,
    entryPrice: row.entryPrice,
    breakevenProbability: row.breakevenProbability,
    edge: row.edge,
    feeEstimate: row.feeEstimate,
    rationale: row.rationale,
    evidenceJson: row.evidenceJson,
    status: row.status,
    resolvedAt: row.resolvedAt,
    outcome: row.outcome,
    brierScore: row.brierScore,
    pnl: row.pnl,
    createdAt: row.createdAt,
  });
  return row;
}

/** Look up a paper trade by id. */
export function getPaperTrade(
  db: DatabaseSync,
  id: string,
): PaperTradeRow | null {
  const row = db
    .prepare(
      `SELECT id, owner, contract, model_probability AS modelProbability,
            model_source AS modelSource, barrier_type AS barrierType,
            side, decision, entry_price AS entryPrice,
            breakeven_probability AS breakevenProbability, edge, fee_estimate AS feeEstimate,
            rationale, evidence_json AS evidenceJson, status, resolved_at AS resolvedAt,
            outcome, brier_score AS brierScore, pnl, created_at AS createdAt
     FROM paper_trades WHERE id = ?`,
    )
    .get(id) as PaperTradeRow | undefined;
  return row ?? null;
}

/**
 * Resolve a paper trade with an outcome, computing and storing
 * the Brier score and simulated P&L in a single transaction.
 */
export function resolvePaperTrade(
  db: DatabaseSync,
  id: string,
  resolution: ResolutionRow,
): PaperTradeRow | null {
  const trade = getPaperTrade(db, id);
  if (!trade || trade.status === "resolved") {
    return null;
  }

  const { brierScore, pnl, scorable } = scorePaperTrade(trade, resolution);
  const now = resolution.resolvedAt;

  const updated: PaperTradeRow = {
    ...trade,
    status: "resolved",
    resolvedAt: now,
    outcome: resolution.outcome,
    brierScore,
    pnl: scorable ? pnl : null,
  };

  db.prepare(
    `UPDATE paper_trades SET
      status = @status, resolved_at = @resolvedAt, outcome = @outcome,
      brier_score = @brierScore, pnl = @pnl
     WHERE id = @id`,
  ).run({
    id: updated.id,
    status: updated.status,
    resolvedAt: updated.resolvedAt,
    outcome: updated.outcome,
    brierScore: updated.brierScore,
    pnl: updated.pnl,
  });

  return updated;
}

/**
 * Load all paper trades for an owner for track-record aggregation.
 * Resolved trades already carry their scored brier_score and pnl.
 */
export function loadPaperTrades(
  db: DatabaseSync,
  owner: string,
): PaperTradeRow[] {
  return db
    .prepare(
      `SELECT id, owner, contract, model_probability AS modelProbability,
            model_source AS modelSource, barrier_type AS barrierType,
            side, decision, entry_price AS entryPrice,
            breakeven_probability AS breakevenProbability, edge, fee_estimate AS feeEstimate,
            rationale, evidence_json AS evidenceJson, status, resolved_at AS resolvedAt,
            outcome, brier_score AS brierScore, pnl, created_at AS createdAt
     FROM paper_trades WHERE owner = ? ORDER BY created_at`,
    )
    .all(owner) as unknown as PaperTradeRow[];
}
