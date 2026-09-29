/**
 * Falcon (Opportunity Intel) — the first agent from the "AI financial
 * team" roadmap, scoped to data this project actually collects.
 *
 * Falcon reads real order-book snapshots (see orderbook-collector.mjs
 * and the orderbook_snapshots table) for a contract and turns them
 * into a suggested probability, plus the exact evidence rows it used —
 * reusing the orderbook_snapshots row shape rather than inventing a
 * new evidence schema.
 *
 * Falcon does NOT trade and does NOT resolve/settle contracts. It only
 * proposes a probability; a human must accept, edit, or reject before
 * anything is recorded as a real forecast (see routes/falcon.ts).
 *
 * IMPORTANT: this project's own preregistered held-out test of
 * depth_imbalance/top_imbalance (docs/findings.md) has not yet shown
 * validated positive expectancy — the only completed run was voided by
 * a data bug, and it's unresolved either way. Falcon's mapping below is
 * a transparent, capped heuristic on real evidence, not a proven edge.
 * Keep probabilities conservative (capped near 0.5) until a real
 * held-out test says otherwise.
 */
import Database from "better-sqlite3";
import { scoreObservation, type ObservationRow, type ResolutionRow } from "../scoring.ts";

/** Mirrors orderbook_snapshots' real columns — deliberately not a new shape. */
export interface OrderbookEvidence {
  marketTicker: string;
  capturedAt: number;
  bestYesPrice: number | null;
  bestNoPrice: number | null;
  topImbalance: number | null;
  depthImbalance: number | null;
}

export interface FalconRecommendation {
  contract: string;
  suggestedProbability: number;
  evidence: OrderbookEvidence[];
  rationale: string;
  generatedAt: string;
}

const minProbability = 0.05;
const maxProbability = 0.95;
/** How strongly imbalance moves the estimate away from 0.5. Small and
 * conservative on purpose — see the caveat above. */
const sensitivity = 0.3;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/**
 * Pure function: given real evidence rows for one contract (most recent
 * first or last, order doesn't matter — the newest capturedAt wins),
 * compute a suggested YES probability. Throws rather than fabricating a
 * result when there is no usable evidence.
 */
export function computeFalconRecommendation(
  contract: string,
  evidence: OrderbookEvidence[],
  now: Date = new Date(),
): FalconRecommendation {
  if (!evidence.length) {
    throw new Error(`No order-book evidence available for contract "${contract}"`);
  }
  const latest = [...evidence].sort((a, b) => b.capturedAt - a.capturedAt)[0];
  const signal = latest.depthImbalance ?? latest.topImbalance;
  if (signal === null || signal === undefined || !Number.isFinite(signal)) {
    throw new Error(`Latest evidence for "${contract}" has no usable imbalance reading`);
  }

  const suggestedProbability = clamp(0.5 + signal * sensitivity, minProbability, maxProbability);
  const featureUsed = latest.depthImbalance !== null && latest.depthImbalance !== undefined ? "depth_imbalance" : "top_imbalance";
  const rationale = `Based on ${featureUsed}=${signal.toFixed(4)} at ${new Date(latest.capturedAt).toISOString()} `
    + `(unvalidated heuristic; see docs/findings.md before treating this as a proven edge).`;

  return {
    contract,
    suggestedProbability,
    evidence: [...evidence].sort((a, b) => b.capturedAt - a.capturedAt),
    rationale,
    generatedAt: now.toISOString(),
  };
}

/** Real data reader: latest order-book snapshots for a market ticker.
 * Returns an empty array (not fabricated evidence) if nothing has been
 * collected yet for this contract. */
export function latestOrderbookEvidence(
  marketTicker: string,
  dbPath = "quanterraos.db",
  limit = 5,
): OrderbookEvidence[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    return db
      .prepare(
        `SELECT market_ticker AS marketTicker, captured_at AS capturedAt, best_yes_price AS bestYesPrice,
                best_no_price AS bestNoPrice, top_imbalance AS topImbalance, depth_imbalance AS depthImbalance
         FROM orderbook_snapshots WHERE market_ticker = ? ORDER BY captured_at DESC LIMIT ?`,
      )
      .all(marketTicker, limit) as OrderbookEvidence[];
  } finally {
    db.close();
  }
}

/**
 * Scores Falcon's own suggested probability against a resolution, using
 * the exact same Brier-score logic as a human forecast — so Falcon's
 * calibration is directly comparable, whether or not a human ended up
 * accepting, editing, or rejecting the suggestion.
 */
export function scoreFalconRecommendation(
  recommendation: { owner: string; contract: string; suggestedProbability: number; rationale: string; createdAt: string },
  resolution: ResolutionRow,
) {
  const observation: ObservationRow = {
    id: `falcon:${recommendation.contract}:${recommendation.createdAt}`,
    owner: recommendation.owner,
    contract: recommendation.contract,
    source: "falcon",
    direction: recommendation.suggestedProbability >= 0.5 ? "yes" : "no",
    hypothesis: recommendation.rationale,
    probability: recommendation.suggestedProbability,
    created: recommendation.createdAt,
  };
  return scoreObservation(observation, resolution);
}

export interface FalconTrackRecordRow {
  status: "proposed" | "accepted" | "edited" | "rejected";
  contract: string;
  owner: string;
  suggestedProbability: number;
  rationale: string;
  createdAt: string;
}

export interface FalconTrackRecord {
  proposed: number;
  accepted: number;
  edited: number;
  rejected: number;
  /** Recommendations a human acted on (accepted or edited) that also have a
   * resolved outcome, so Falcon's own probability could be scored. */
  scored: number;
  /** Falcon's Brier score on its own suggestedProbability, never on a
   * human-edited final value, and never on rejected recommendations. */
  averageBrierScore: number | null;
}

/**
 * Pure aggregation over Falcon's full recommendation history plus
 * whatever resolutions exist for those contracts. Only accepted/edited
 * recommendations with a resolved outcome are scored — rejected
 * recommendations were never allowed to act against reality, so they
 * are counted but never scored.
 */
export function computeFalconTrackRecord(
  recommendations: FalconTrackRecordRow[],
  resolutionsByContract: Map<string, ResolutionRow>,
): FalconTrackRecord {
  const record: FalconTrackRecord = { proposed: 0, accepted: 0, edited: 0, rejected: 0, scored: 0, averageBrierScore: null };
  const brierScores: number[] = [];
  for (const row of recommendations) {
    record.proposed += 1;
    if (row.status === "accepted") record.accepted += 1;
    if (row.status === "edited") record.edited += 1;
    if (row.status === "rejected") record.rejected += 1;
    if (row.status !== "accepted" && row.status !== "edited") continue;
    const resolution = resolutionsByContract.get(row.contract);
    if (!resolution) continue;
    const scored = scoreFalconRecommendation(row, resolution);
    if (scored.scorable && scored.brierScore !== null) brierScores.push(scored.brierScore);
  }
  record.scored = brierScores.length;
  record.averageBrierScore = brierScores.length ? brierScores.reduce((sum, score) => sum + score, 0) / brierScores.length : null;
  return record;
}
