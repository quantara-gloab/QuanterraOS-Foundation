/**
 * Autopilot Engine: Autonomous Paper-Trading Loop (Rule B5 Enforced)
 *
 * Implements the Phase 2 spec:
 * - Runs on the normal cycle (hooked to the 15s/debounced pipeline).
 * - Writes simulated orders to paper_trades table with:
 *     capital: "$0.00"
 *     mode: "PAPER"
 * - Zero execution paths to live capital (Rule B5 circuit lock).
 * - Tracks simulated cumulative P&L against the market baseline.
 */
import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { paperTrades } from "./schema.ts";
import { eq, desc } from "drizzle-orm";
import {
  suggestPaperTrade,
  estimateFee,
  type MarketQuote,
  type PaperTradeRow,
  type PaperTradeDecision,
  type PaperTradeSide,
} from "./paper-trading.ts";

export interface AutopilotTradeRecord {
  id: string;
  marketId: string;
  timestamp: string;
  mode: "PAPER";
  capital: "$0.00";
  size: number; // e.g. 100 contracts ($100 max payout)
  side: PaperTradeSide | null;
  decision: PaperTradeDecision;
  entryPrice: number | null;
  modelProbability: number;
  breakevenProbability: number;
  edge: number;
  feeEstimate: number;
  status: "proposed" | "resolved";
  outcome: "YES" | "NO" | "VOID" | null;
  pnl: number | null;
  baselinePnl: number | null;
  cumulativePnl: number;
  cumulativeBaselinePnl: number;
  rationale: string;
}

export interface AutopilotSummary {
  mode: "PAPER";
  capital: "$0.00";
  ruleB5Locked: true;
  tier: string;
  feedMode: string;
  delayMinutes: number;
  totalDecisions: number;
  buyCount: number;
  skipCount: number;
  resolvedCount: number;
  winCount: number;
  lossCount: number;
  winRatePct: number | null;
  cumulativePnl: number;
  cumulativeBaselinePnl: number;
  averageFeeDrag: number;
  trades: AutopilotTradeRecord[];
}

/**
 * Execute an automated paper-trading step for a market.
 * Strictly paper only; live order routing is hardcoded to impossible ($0.00).
 */
export function executeAutopilotPaperStep(input: {
  contract: string;
  modelProbability: number;
  marketQuote: MarketQuote;
  modelSource?: "quant" | "jev";
  barrierType?: "high" | "low";
  size?: number;
  edgeThreshold?: number;
}): AutopilotTradeRecord {
  if (!input.contract || typeof input.contract !== "string" || input.contract.toUpperCase().endsWith("-CURRENT")) {
    throw new Error(
      `Invalid contract identifier: Placeholder tickers ending in -CURRENT are strictly rejected at write time (${input.contract}).`
    );
  }
  const size = input.size ?? 100;
  const decision = suggestPaperTrade({
    owner: "autopilot-agent",
    contract: input.contract,
    modelProbability: input.modelProbability,
    modelSource: input.modelSource ?? "quant",
    barrierType: input.barrierType ?? "high",
    market: input.marketQuote,
    edgeThreshold: input.edgeThreshold ?? 0.02,
  });

  const id = `pt_${randomUUID().slice(0, 12)}`;
  const now = new Date().toISOString();

  const evidence = {
    mode: "PAPER",
    capital: "$0.00",
    size,
    ruleB5: "LOCKED",
    marketQuote: input.marketQuote,
    modelProbability: input.modelProbability,
  };

  db.insert(paperTrades)
    .values({
      id,
      owner: "autopilot-agent",
      contract: input.contract,
      modelProbability: input.modelProbability,
      modelSource: input.modelSource ?? "quant",
      barrierType: input.barrierType ?? "high",
      side: decision.side,
      decision: decision.decision,
      entryPrice: decision.entryPrice,
      breakevenProbability: decision.breakevenProbability,
      edge: decision.edge,
      feeEstimate: decision.feeEstimate,
      rationale: decision.rationale,
      evidenceJson: JSON.stringify(evidence),
      status: "proposed",
      createdAt: now,
    })
    .run();

  return {
    id,
    marketId: input.contract,
    timestamp: now,
    mode: "PAPER",
    capital: "$0.00",
    size,
    side: decision.side,
    decision: decision.decision,
    entryPrice: decision.entryPrice,
    modelProbability: input.modelProbability,
    breakevenProbability: decision.breakevenProbability,
    edge: decision.edge,
    feeEstimate: decision.feeEstimate,
    status: "proposed",
    outcome: null,
    pnl: null,
    baselinePnl: null,
    cumulativePnl: 0,
    cumulativeBaselinePnl: 0,
    rationale: decision.rationale,
  };
}

/**
 * Resolve an autopilot trade when official outcome settles.
 */
export function resolveAutopilotTrade(
  tradeIdOrContract: string,
  outcome: "YES" | "NO" | "VOID",
  resolvedAt?: string
): void {
  const trade = db
    .select()
    .from(paperTrades)
    .where(eq(paperTrades.id, tradeIdOrContract))
    .get() ?? db
    .select()
    .from(paperTrades)
    .where(eq(paperTrades.contract, tradeIdOrContract))
    .get();

  if (!trade || trade.status === "resolved") return;

  const now = resolvedAt ?? new Date().toISOString();
  let pnl: number | null = null;
  let brierScore: number | null = null;

  if (trade.decision === "buy" && trade.side && trade.entryPrice !== null) {
    if (outcome === "YES" || outcome === "NO") {
      const won = (trade.side === "yes" && outcome === "YES") || (trade.side === "no" && outcome === "NO");
      const payout = won ? 1.0 : 0.0;
      // PnL per contract: payout - entryPrice - feeEstimate
      pnl = Number((payout - trade.entryPrice - trade.feeEstimate).toFixed(4));

      const actual = outcome === "YES" ? 1.0 : 0.0;
      brierScore = Number(Math.pow(trade.modelProbability - actual, 2).toFixed(4));
    }
  }

  db.update(paperTrades)
    .set({
      status: "resolved",
      outcome,
      pnl,
      brierScore,
      resolvedAt: now,
    })
    .where(eq(paperTrades.id, trade.id))
    .run();
}

/**
 * Retrieve the full autopilot paper ledger and cumulative performance stats.
 */
export function getAutopilotLedger(limit = 100, tier: "free" | "plus" | "pro" | "institutional" = "free"): AutopilotSummary {
  const isPaid = tier === "pro" || tier === "institutional";
  let rows = db
    .select()
    .from(paperTrades)
    .where(eq(paperTrades.owner, "autopilot-agent"))
    .orderBy(desc(paperTrades.createdAt))
    .all() as PaperTradeRow[];

  let delayMinutes = 0;
  if (!isPaid) {
    delayMinutes = 20;
    const cutoff = Date.now() - 20 * 60 * 1000;
    rows = rows.filter((r) => Date.parse(r.createdAt) <= cutoff);
  }

  const feedMode = isPaid ? "realtime" : "delayed_snapshot";


  let buyCount = 0;
  let skipCount = 0;
  let resolvedCount = 0;
  let winCount = 0;
  let lossCount = 0;
  let totalPnl = 0;
  let totalBaselinePnl = 0;
  let totalFeeDrag = 0;

  // Process rows in chronological order to compute cumulative PnLs
  const chronological = [...rows].reverse();
  const enhancedMap = new Map<string, { cumPnl: number; cumBase: number; basePnl: number | null }>();

  for (const row of chronological) {
    if (row.decision === "buy") {
      buyCount++;
      totalFeeDrag += row.feeEstimate * 100;
    } else {
      skipCount++;
    }

    let tradeBasePnl: number | null = null;

    if (row.status === "resolved" && row.outcome && row.outcome !== "VOID") {
      resolvedCount++;
      if (row.pnl !== null) {
        // Multiply by 100 contract size for dollar terms
        const dollarPnl = Number((row.pnl * 100).toFixed(2));
        totalPnl += dollarPnl;
        if (dollarPnl > 0) winCount++;
        else lossCount++;

        // Baseline comparison: passive market mid buyer PnL
        const won = row.outcome === "YES";
        const basePayout = won ? 100 : 0;
        const baseEntry = (row.breakevenProbability - row.feeEstimate) * 100;
        tradeBasePnl = Number((basePayout - baseEntry - row.feeEstimate * 100).toFixed(2));
        totalBaselinePnl += tradeBasePnl;
      }
    }

    enhancedMap.set(row.id, {
      cumPnl: Number(totalPnl.toFixed(2)),
      cumBase: Number(totalBaselinePnl.toFixed(2)),
      basePnl: tradeBasePnl,
    });
  }

  const trades: AutopilotTradeRecord[] = rows.slice(0, limit).map((r) => {
    const meta = enhancedMap.get(r.id) ?? { cumPnl: 0, cumBase: 0, basePnl: null };
    return {
      id: r.id,
      marketId: r.contract,
      timestamp: r.createdAt,
      mode: "PAPER",
      capital: "$0.00",
      size: 100,
      side: r.side,
      decision: r.decision,
      entryPrice: r.entryPrice,
      modelProbability: r.modelProbability,
      breakevenProbability: r.breakevenProbability,
      edge: r.edge,
      feeEstimate: r.feeEstimate,
      status: r.status,
      outcome: r.outcome,
      pnl: r.pnl !== null ? Number((r.pnl * 100).toFixed(2)) : null,
      baselinePnl: meta.basePnl,
      cumulativePnl: meta.cumPnl,
      cumulativeBaselinePnl: meta.cumBase,
      rationale: r.rationale,
    };
  });

  const winRatePct =
    resolvedCount > 0 && winCount + lossCount > 0
      ? Number(((winCount / (winCount + lossCount)) * 100).toFixed(1))
      : null;

  return {
    mode: "PAPER",
    capital: "$0.00",
    ruleB5Locked: true,
    tier,
    feedMode,
    delayMinutes,
    totalDecisions: rows.length,
    buyCount,
    skipCount,
    resolvedCount,
    winCount,
    lossCount,
    winRatePct,
    cumulativePnl: Number(totalPnl.toFixed(2)),
    cumulativeBaselinePnl: Number(totalBaselinePnl.toFixed(2)),
    averageFeeDrag: buyCount > 0 ? Number((totalFeeDrag / buyCount).toFixed(2)) : 0,
    trades,
  };
}
