/**
 * Route handlers for Falcon (Opportunity Intel).
 *
 * Falcon only ever writes to falcon_recommendations directly. The one
 * path into research_observations (a real, scored forecast) is the
 * exact same handleObserve() a manually-typed forecast uses — reused
 * here, not reimplemented — and only runs after a human decision.
 * Falcon never calls anything resolution/settlement-related.
 */
import { computeFalconRecommendation, type OrderbookEvidence } from "../agents/falcon.ts";
import { handleObserve, type ObserveDeps } from "./workspace.ts";

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
  deps: RecommendDeps
): Promise<{ status: 200; body: FalconRecommendationRow }> {
  const recommendation = computeFalconRecommendation(input.contract, input.evidence);
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
  deps: DecisionDeps
): Promise<{ status: 200 | 400 | 404 | 409; body: unknown }> {
  const recommendation = await deps.getRecommendation(input.recommendationId);
  if (!recommendation || recommendation.owner !== input.owner) {
    return { status: 404, body: { error: "recommendation_not_found" } };
  }
  if (recommendation.status !== "proposed") {
    return { status: 409, body: { error: "already_decided", status: recommendation.status } };
  }

  if (input.action === "reject") {
    const updated: FalconRecommendationRow = { ...recommendation, status: "rejected", decidedAt: new Date().toISOString() };
    await deps.updateRecommendation(updated);
    return { status: 200, body: updated };
  }

  if (input.action === "edit" && (input.probability === undefined || input.probability === null)) {
    return { status: 400, body: { error: "probability_required_for_edit" } };
  }

  const finalProbability = input.action === "edit" ? (input.probability as number) : recommendation.suggestedProbability;

  const observationResult = await handleObserve(
    {
      owner: recommendation.owner,
      contract: recommendation.contract,
      source: "falcon",
      direction: finalProbability >= 0.5 ? "yes" : "no",
      hypothesis: input.hypothesis ?? recommendation.rationale,
      probability: finalProbability,
    },
    deps.observeDeps
  );

  const updated: FalconRecommendationRow = {
    ...recommendation,
    status: input.action === "edit" ? "edited" : "accepted",
    finalProbability,
    observationId: observationResult.body.id,
    decidedAt: new Date().toISOString(),
  };
  await deps.updateRecommendation(updated);
  return { status: 200, body: { recommendation: updated, observation: observationResult.body } };
}
