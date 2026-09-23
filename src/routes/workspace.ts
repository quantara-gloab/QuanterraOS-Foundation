/**
 * Route handlers to extend your real /api/workspace with:
 *   - POST /api/workspace/resolve      record a contract's real outcome
 *   - POST /api/workspace/edge-score   compute and store an edge score
 *
 * Written framework-agnostic (plain async functions taking parsed
 * input, returning plain objects) so it drops into Express, Hono,
 * Next.js route handlers, etc. with a thin adapter. Auth (your real
 * getChatGPTUser()) is NOT included here — call it in the adapter and
 * pass the resulting owner id in.
 */
import { scoreEdge, type Bucket } from "../edge-score.ts";
import { scoreObservation, type ObservationRow, type ResolutionRow } from "../scoring.ts";

export interface ResolveInput {
  owner: string;
  contract: string;
  outcome: "YES" | "NO" | "VOID";
  officialSource: string;
  isCorrection?: boolean;
  correctionReason?: string;
}

export interface ResolveDeps {
  /** Look up an existing resolution row for (owner, contract), or null. */
  getExistingResolution: (owner: string, contract: string) => Promise<ResolutionRow | null>;
  /** Upsert the resolution and append to the history table — implement
   * this as a single transaction against research_resolutions and
   * research_resolution_history. */
  saveResolution: (row: ResolutionRow & { correctionReason?: string | null }) => Promise<void>;
}

/** Mirrors the recordResolution vs. correctResolution split described
 * in the merge patch: a second call for an already-resolved contract
 * is rejected unless explicitly marked as a correction. */
export async function handleResolve(
  input: ResolveInput,
  deps: ResolveDeps
): Promise<{ status: 200 | 409; body: unknown }> {
  const existing = await deps.getExistingResolution(input.owner, input.contract);

  if (existing && !input.isCorrection) {
    return {
      status: 409,
      body: {
        error: "already_resolved",
        message:
          "This contract already has a resolution. Pass isCorrection: true with a correctionReason to override it.",
      },
    };
  }

  if (existing && input.isCorrection && !input.correctionReason) {
    return {
      status: 409,
      body: { error: "correction_reason_required" },
    };
  }

  const row: ResolutionRow & { correctionReason?: string | null } = {
    owner: input.owner,
    contract: input.contract,
    outcome: input.outcome,
    officialSource: input.officialSource,
    resolvedAt: new Date().toISOString(),
    correctionOf: existing?.resolvedAt ?? null,
    finalized: true,
    correctionReason: input.correctionReason ?? null,
  };

  await deps.saveResolution(row);
  return { status: 200, body: row };
}

export interface EdgeScoreRequest {
  owner: string;
  contract: string;
  bucket: Bucket;
  recentCompositePrices: number[];
  marketAsk: number;
}

export interface EdgeScoreDeps {
  saveEdgeScore: (row: ReturnType<typeof scoreEdge>) => Promise<void>;
}

export async function handleEdgeScore(
  input: EdgeScoreRequest,
  deps: EdgeScoreDeps
): Promise<{ status: 200; body: unknown }> {
  const result = scoreEdge(input);
  await deps.saveEdgeScore(result);
  return { status: 200, body: result };
}

/** Convenience wrapper for the calibration page: score one observation
 * against its resolution using the existing scoring.ts logic. */
export function scoreOne(observation: ObservationRow, resolution: ResolutionRow) {
  return scoreObservation(observation, resolution);
}
