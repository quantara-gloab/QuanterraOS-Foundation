/**
 * Route handlers for Falcon (Opportunity Intel).
 *
 * Falcon only ever writes to falcon_recommendations directly. The one
 * path into research_observations (a real, scored forecast) is the
 * exact same handleObserve() a manually-typed forecast uses — reused
 * here, not reimplemented — and only runs after a human decision.
 * Falcon never calls anything resolution/settlement-related.
 */
import {
  computeFalconRecommendation,
  type OrderbookEvidence,
} from "../agents/falcon.ts";
import { computeFalconJevRecommendation } from "../agents/falcon-jev.ts";
import { handleObserve, type ObserveDeps } from "./workspace.ts";
import {
  suggestPaperTrade,
  buildPaperTradeRow,
  recommendPaperTrade,
  type PaperTradeRow,
  type MarketQuote,
} from "../paper-trading.ts";

export interface FalconRecommendationRow {
  id: string;
  owner: string;
  contract: string;
  suggestedProbability: number;
  rationale: string;
  evidenceJson: string;
  status: "proposed" | "accepted" | "edited" | "rejected";
  finalProbability: number | null;
  observationId: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface RecommendInput {
  owner: string;
  contract: string;
  evidence: OrderbookEvidence[];
}

export interface RecommendDeps {
  generateId: () => string;
  saveRecommendation: (row: FalconRecommendationRow) => Promise<void>;
}

export async function handleFalconRecommend(
  input: RecommendInput,
  deps: RecommendDeps,
): Promise<{ status: 200; body: FalconRecommendationRow }> {
  const recommendation = computeFalconRecommendation(
    input.contract,
    input.evidence,
  );
  const row: FalconRecommendationRow = {
    id: deps.generateId(),
    owner: input.owner,
    contract: input.contract,
    suggestedProbability: recommendation.suggestedProbability,
    rationale: recommendation.rationale,
    evidenceJson: JSON.stringify(recommendation.evidence),
    status: "proposed",
    finalProbability: null,
    observationId: null,
    createdAt: recommendation.generatedAt,
    decidedAt: null,
  };
  await deps.saveRecommendation(row);
  return { status: 200, body: row };
}

export interface FalconJevRecommendInput {
  owner: string;
  contract: string;
  strike?: number;
  barrierType?: "high" | "low" | "auto";
  remainingSeconds?: number;
  pricesOrTicks?:
    | number[]
    | { at?: number; timestamp?: number; value?: number; price?: number }[];
  evidence?: OrderbookEvidence[];
}

export async function handleFalconJevRecommend(
  input: FalconJevRecommendInput,
  deps: RecommendDeps,
): Promise<{ status: 200; body: FalconRecommendationRow }> {
  const strike = input.strike ?? 100_000;
  const remainingSeconds = input.remainingSeconds ?? 900;
  const pricesOrTicks = input.pricesOrTicks ?? [
    strike * 0.999,
    strike * 1.0005,
    strike * 0.9998,
  ];
  const latestEvidence = input.evidence?.at(0) ?? null;

  const recommendation = await computeFalconJevRecommendation({
    contract: input.contract,
    strike,
    barrierType: input.barrierType ?? "auto",
    remainingSeconds,
    pricesOrTicks,
    orderbookEvidence: latestEvidence,
  });

  const row: FalconRecommendationRow = {
    id: deps.generateId(),
    owner: input.owner,
    contract: input.contract,
    suggestedProbability: recommendation.suggestedProbability,
    rationale: recommendation.rationale,
    evidenceJson: JSON.stringify(recommendation.curatedFeatures),
    status: "proposed",
    finalProbability: null,
    observationId: null,
    createdAt: recommendation.generatedAt,
    decidedAt: null,
  };
  await deps.saveRecommendation(row);
  return { status: 200, body: row };
}

export interface DecisionInput {
  owner: string;
  recommendationId: string;
  action: "accept" | "edit" | "reject";
  /** Required when action is "edit"; ignored otherwise. */
  probability?: number;
  hypothesis?: string;
}

export interface DecisionDeps {
  getRecommendation: (id: string) => Promise<FalconRecommendationRow | null>;
  updateRecommendation: (row: FalconRecommendationRow) => Promise<void>;
  observeDeps: ObserveDeps;
}

export async function handleFalconDecision(
  input: DecisionInput,
  deps: DecisionDeps,
): Promise<{ status: 200 | 400 | 404 | 409; body: unknown }> {
  const recommendation = await deps.getRecommendation(input.recommendationId);
  if (!recommendation || recommendation.owner !== input.owner) {
    return { status: 404, body: { error: "recommendation_not_found" } };
  }
  if (recommendation.status !== "proposed") {
    return {
      status: 409,
      body: { error: "already_decided", status: recommendation.status },
    };
  }

  if (input.action === "reject") {
    const updated: FalconRecommendationRow = {
      ...recommendation,
      status: "rejected",
      decidedAt: new Date().toISOString(),
    };
    await deps.updateRecommendation(updated);
    return { status: 200, body: updated };
  }

  if (
    input.action === "edit" &&
    (input.probability === undefined || input.probability === null)
  ) {
    return { status: 400, body: { error: "probability_required_for_edit" } };
  }

  const finalProbability =
    input.action === "edit"
      ? (input.probability as number)
      : recommendation.suggestedProbability;

  const observationResult = await handleObserve(
    {
      owner: recommendation.owner,
      contract: recommendation.contract,
      source: "falcon",
      direction: finalProbability >= 0.5 ? "yes" : "no",
      hypothesis: input.hypothesis ?? recommendation.rationale,
      probability: finalProbability,
    },
    deps.observeDeps,
  );

  const updated: FalconRecommendationRow = {
    ...recommendation,
    status: input.action === "edit" ? "edited" : "accepted",
    finalProbability,
    observationId: observationResult.body.id,
    decidedAt: new Date().toISOString(),
  };
  await deps.updateRecommendation(updated);
  return {
    status: 200,
    body: { recommendation: updated, observation: observationResult.body },
  };
}

// ---------------------------------------------------------------------------
// Paper trading — high/low barrier model
// ---------------------------------------------------------------------------

export interface PaperTradeRequest {
  owner: string;
  contract: string;
  modelProbability: number;
  modelSource: "quant" | "jev";
  barrierType: "high" | "low";
  market: MarketQuote;
  edgeThreshold?: number;
}

export interface PaperTradeDeps {
  savePaperTrade: (row: PaperTradeRow) => Promise<void>;
  generateId: () => string;
}

export async function handlePaperTrade(
  input: PaperTradeRequest,
  deps: PaperTradeDeps,
): Promise<{ status: 200; body: PaperTradeRow }> {
  const decision = suggestPaperTrade({
    owner: input.owner,
    contract: input.contract,
    modelProbability: input.modelProbability,
    modelSource: input.modelSource,
    barrierType: input.barrierType,
    market: input.market,
    edgeThreshold: input.edgeThreshold,
  });

  const row = buildPaperTradeRow(
    {
      owner: input.owner,
      contract: input.contract,
      modelProbability: input.modelProbability,
      modelSource: input.modelSource,
      barrierType: input.barrierType,
      market: input.market,
      edgeThreshold: input.edgeThreshold,
    },
    decision,
    deps.generateId,
  );

  await deps.savePaperTrade(row);
  return { status: 200, body: row };
}
