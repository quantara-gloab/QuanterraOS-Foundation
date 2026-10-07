/**
 * Prediction Ledger: Immutable Proof-of-Prediction Architecture
 *
 * Implements the Phase 1 spec:
 * 1. Immutable Prediction Ledger:
 *    Every time a specialist or model produces a probability for an active market,
 *    write a row with { market_id, timestamp, predicted_prob, model_version }
 *    BEFORE the market settles. Immutable once written (no probability edits allowed).
 * 2. Settlement Scorer:
 *    Once a market settles, joins stored prediction to official outcome and computes
 *    Brier contribution ((predicted_prob - outcome)^2). Never recomputes or edits a
 *    prediction row after the fact.
 * 3. Historical Replay:
 *    Seeded from the canonical 1,316-market corpus, strictly tagged is_replay = 1
 *    and labeled "Backtest replay (historical, not live)".
 */
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { predictions } from "./schema.ts";
import { eq, desc, and } from "drizzle-orm";
import { buildMarketsFromCsvText } from "./market-price-calibration.ts";

export interface PredictionRecord {
  id: string;
  marketId: string;
  timestamp: string;
  predictedProb: number;
  modelVersion: string;
  status: "PENDING" | "SETTLED";
  outcome: "YES" | "NO" | "VOID" | null;
  brierScore: number | null;
  settledAt: string | null;
  isReplay: number;
  notes: string | null;
}

export interface PredictionLedgerSummary {
  total: number;
  pending: number;
  settled: number;
  averageBrierScore: number | null;
  directionalAccuracyPct: number | null;
  items: PredictionRecord[];
}

/**
 * Record a prediction into the immutable ledger before market resolution.
 * Rejects attempts to overwrite or modify an existing prediction's probability.
 */
export function recordPrediction(input: {
  marketId: string;
  predictedProb: number;
  modelVersion: string;
  timestamp?: string;
  id?: string;
  isReplay?: boolean;
  notes?: string;
}): PredictionRecord {
  const prob = Math.min(0.9999, Math.max(0.0001, input.predictedProb));
  const recordId = input.id ?? `pred_${randomUUID().slice(0, 12)}`;
  const now = input.timestamp ?? new Date().toISOString();

  // Ensure immutability: check if ID exists
  const existing = db
    .select()
    .from(predictions)
    .where(eq(predictions.id, recordId))
    .get();

  if (existing) {
    throw new Error(
      `Immutable prediction ledger violation: Prediction ${recordId} already exists. Updates to predictions are strictly forbidden.`
    );
  }

  const row: typeof predictions.$inferInsert = {
    id: recordId,
    marketId: input.marketId,
    timestamp: now,
    predictedProb: Number(prob.toFixed(4)),
    modelVersion: input.modelVersion,
    status: "PENDING",
    outcome: null,
    brierScore: null,
    settledAt: null,
    isReplay: input.isReplay ? 1 : 0,
    notes: input.notes ?? null,
  };

  db.insert(predictions).values(row).run();

  return {
    id: row.id,
    marketId: row.marketId,
    timestamp: row.timestamp,
    predictedProb: row.predictedProb,
    modelVersion: row.modelVersion,
    status: "PENDING",
    outcome: null,
    brierScore: null,
    settledAt: null,
    isReplay: input.isReplay ? 1 : 0,
    notes: row.notes ?? null,
  };
}

/**
 * Settlement scorer: joins stored prediction with official settlement outcome,
 * computes exact Brier contribution: (predicted_prob - y)^2, and updates outcome.
 * Never recomputes or modifies the predicted_prob.
 */
export function scoreSettledPrediction(
  marketIdOrPredictionId: string,
  outcome: "YES" | "NO" | "VOID",
  settledAt?: string
): PredictionRecord | null {
  const target = db
    .select()
    .from(predictions)
    .where(
      eq(predictions.id, marketIdOrPredictionId)
    )
    .get() ?? db
    .select()
    .from(predictions)
    .where(
      eq(predictions.marketId, marketIdOrPredictionId)
    )
    .orderBy(desc(predictions.timestamp))
    .get();

  if (!target) {
    return null;
  }

  if (target.status === "SETTLED") {
    // Immutable: Never recompute or edit a prediction row after the fact
    return target as PredictionRecord;
  }

  const now = settledAt ?? new Date().toISOString();
  let brierScore: number | null = null;

  if (outcome === "YES" || outcome === "NO") {
    const actual = outcome === "YES" ? 1.0 : 0.0;
    brierScore = Number(Math.pow(target.predictedProb - actual, 2).toFixed(4));
  }

  db.update(predictions)
    .set({
      status: "SETTLED",
      outcome,
      brierScore,
      settledAt: now,
    })
    .where(eq(predictions.id, target.id))
    .run();

  return {
    ...target,
    status: "SETTLED",
    outcome,
    brierScore,
    settledAt: now,
  } as PredictionRecord;
}

/**
 * Seed historical replay view from canonical 1,316-market backtest corpus.
 * Strictly labeled is_replay = 1 ("Backtest replay (historical, not live)").
 * Idempotent.
 */
export async function seedHistoricalReplay(
  csvPath = "data/kalshi-btc15m-candles.csv"
): Promise<{ seeded: number; totalInCorpus: number }> {
  // Check if historical replay is already seeded
  const existingCountRow = db
    .select()
    .from(predictions)
    .where(eq(predictions.isReplay, 1))
    .all();

  if (existingCountRow.length >= 1000) {
    return { seeded: 0, totalInCorpus: existingCountRow.length };
  }

  try {
    const text = await fs.readFile(csvPath, "utf8");
    const markets = buildMarketsFromCsvText(text);
    let seeded = 0;

    for (const m of markets) {
      if (m.result !== "yes" && m.result !== "no") continue;
      const targetTime = m.openTime + 4 * 60; // minute 4 entry
      const eligible = m.candles.filter((c) => c.timestamp < m.closeTime);
      if (!eligible.length) continue;

      const candle = eligible.reduce((best, row) => (
        Math.abs(row.timestamp - targetTime) < Math.abs(best.timestamp - targetTime) ? row : best
      ), eligible[0]);

      if (Math.abs(candle.timestamp - targetTime) > 60 || candle.bid === null || candle.ask === null) {
        continue;
      }

      const yesMid = Math.min(1, Math.max(0, (candle.bid + candle.ask) / 2));
      const outcome = m.result.toUpperCase() as "YES" | "NO";
      const actual = outcome === "YES" ? 1.0 : 0.0;
      const brierScore = Number(Math.pow(yesMid - actual, 2).toFixed(4));
      const predId = `replay_${m.ticker}`;

      // Insert directly as settled replay record
      db.insert(predictions)
        .values({
          id: predId,
          marketId: m.ticker,
          timestamp: new Date(candle.timestamp * 1000).toISOString(),
          predictedProb: Number(yesMid.toFixed(4)),
          modelVersion: "v0.1-historical-corpus",
          status: "SETTLED",
          outcome,
          brierScore,
          settledAt: new Date(m.closeTime * 1000).toISOString(),
          isReplay: 1,
          notes: "Backtest replay (historical, not live)",
        })
        .onConflictDoNothing()
        .run();

      seeded++;
    }

    return { seeded, totalInCorpus: seeded + existingCountRow.length };
  } catch (err) {
    console.error("Failed to seed historical replay:", err);
    return { seeded: 0, totalInCorpus: existingCountRow.length };
  }
}

/**
 * Query predictions ledger with aggregated statistics.
 */
export function getPredictionsLedger(options?: {
  isReplay?: boolean;
  limit?: number;
  tier?: "free" | "plus" | "pro" | "institutional";
}): PredictionLedgerSummary & { tier: string; feedMode: string; delayMinutes: number } {
  const isReplayVal = options?.isReplay ? 1 : 0;
  const limitVal = options?.limit ?? 50;
  const tier = options?.tier ?? "free";
  const isPaid = tier === "pro" || tier === "institutional";

  let query = db
    .select()
    .from(predictions)
    .where(eq(predictions.isReplay, isReplayVal))
    .orderBy(desc(predictions.timestamp));

  let allRows = query.all() as PredictionRecord[];

  // Free-tier gating: If viewing live ledger (not replay) on free tier, delay by 20 minutes
  let delayMinutes = 0;
  if (!options?.isReplay && !isPaid) {
    delayMinutes = 20;
    const cutoff = Date.now() - 20 * 60 * 1000;
    allRows = allRows.filter((r) => Date.parse(r.timestamp) <= cutoff);
  }

  const feedMode = options?.isReplay ? "replay" : (isPaid ? "realtime" : "delayed_20m");


  const total = allRows.length;
  const pending = allRows.filter((r) => r.status === "PENDING").length;
  const settledRows = allRows.filter(
    (r) => r.status === "SETTLED" && r.brierScore !== null
  );
  const settled = settledRows.length;

  let averageBrierScore: number | null = null;
  let directionalAccuracyPct: number | null = null;

  if (settled > 0) {
    const sumBrier = settledRows.reduce((acc, r) => acc + (r.brierScore ?? 0), 0);
    averageBrierScore = Number((sumBrier / settled).toFixed(4));

    const correctDirection = settledRows.filter((r) => {
      if (r.outcome === "YES" && r.predictedProb >= 0.5) return true;
      if (r.outcome === "NO" && r.predictedProb < 0.5) return true;
      return false;
    }).length;

    directionalAccuracyPct = Number(((correctDirection / settled) * 100).toFixed(1));
  }

  return {
    tier,
    feedMode,
    delayMinutes,
    total,
    pending,
    settled,
    averageBrierScore,
    directionalAccuracyPct,
    items: allRows.slice(0, limitVal),
  };
}
