/**
 * Framework-agnostic scoring and calibration logic, adapted from
 * quanteraos-research-core/src/scoring.ts and calibration.ts to operate
 * directly on your actual column names (research_observations.hypothesis
 * /probability/contract, research_resolutions.outcome/finalized) instead
 * of a separate domain model — so this drops into your /api/workspace
 * handler with no translation layer.
 *
 * Zero dependencies. No framework assumptions. Pure functions over plain
 * rows, same as the research-core project.
 */

export interface ObservationRow {
  id: string;
  owner: string;
  contract: string;
  source: string;
  direction: string;
  hypothesis: string;
  probability: number | null; // null/absent = abstained, matching your schema's nullable column
  created: string;
}

export interface ResolutionRow {
  owner: string;
  contract: string;
  outcome: "YES" | "NO" | "VOID";
  officialSource: string;
  resolvedAt: string;
  correctionOf?: string | null;
  finalized: boolean;
}

export interface ScoredObservation {
  observation: ObservationRow;
  resolution: ResolutionRow;
  brierScore: number | null;
  scorable: boolean;
  reason?: string;
  provisional: boolean;
}

/** Same exclusion rules as the research-core project: abstentions
 * (no probability committed) and VOID outcomes are never scored, but
 * are always returned so they stay visible in performance history. */
export function scoreObservation(observation: ObservationRow, resolution: ResolutionRow): ScoredObservation {
  const provisional = !resolution.finalized;
  if (observation.probability === null || observation.probability === undefined) {
    return { observation, resolution, brierScore: null, scorable: false, reason: "abstained", provisional };
  }
  if (resolution.outcome === "VOID") {
    return { observation, resolution, brierScore: null, scorable: false, reason: "contract voided", provisional };
  }
  // If `probability` is stored as an integer 0-100 (plausible for a
  // sqlite `integer` column), normalize to 0-1 before scoring. Adjust
  // this line if your column is already 0-1.
  const p = observation.probability > 1 ? observation.probability / 100 : observation.probability;
  const actual = resolution.outcome === "YES" ? 1 : 0;
  return { observation, resolution, brierScore: (p - actual) ** 2, scorable: true, provisional };
}

export interface PerformanceSummary {
  total: number;
  scored: number;
  abstained: number;
  voided: number;
  provisional: number;
  averageBrierScore: number | null;
}

export function summarizePerformance(scored: ScoredObservation[]): PerformanceSummary {
  const abstained = scored.filter((s) => s.reason === "abstained").length;
  const voided = scored.filter((s) => s.reason === "contract voided").length;
  const scorable = scored.filter((s) => s.scorable && s.brierScore !== null);
  const provisional = scored.filter((s) => s.provisional).length;
  const averageBrierScore =
    scorable.length === 0 ? null : scorable.reduce((sum, s) => sum + (s.brierScore as number), 0) / scorable.length;
  return { total: scored.length, scored: scorable.length, abstained, voided, provisional, averageBrierScore };
}

export interface CalibrationBin {
  label: string;
  rangeStart: number;
  rangeEnd: number;
  count: number;
  actualYesRate: number | null;
  ciLower?: number | null;
  ciUpper?: number | null;
  insufficientSample?: boolean;
}

/**
 * Wilson score interval with continuity correction for binomial proportions.
 * Used for calibration curve deciles per HANDOFF.md E2.
 */
export function computeWilsonInterval(
  successes: number,
  total: number,
  z = 1.96
): { lower: number; upper: number; pointEstimate: number } {
  if (total <= 0) return { lower: 0, upper: 0, pointEstimate: 0 };
  const p = successes / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denom;

  return {
    lower: Math.max(0, Number((center - margin).toFixed(4))),
    upper: Math.min(1, Number((center + margin).toFixed(4))),
    pointEstimate: Number(p.toFixed(4)),
  };
}

export function computeCalibrationCurve(scored: ScoredObservation[], binCount = 10): CalibrationBin[] {
  const binSize = 1 / binCount;
  const yesCounts = new Array(binCount).fill(0);
  const totalCounts = new Array(binCount).fill(0);

  for (const s of scored) {
    if (!s.scorable || s.observation.probability === null || s.observation.probability === undefined) continue;
    if (s.resolution.outcome === "VOID") continue;
    const raw = s.observation.probability;
    const p = raw > 1 ? raw / 100 : raw;
    const binIndex = Math.min(binCount - 1, Math.floor(p * binCount));
    totalCounts[binIndex]++;
    if (s.resolution.outcome === "YES") yesCounts[binIndex]++;
  }

  return Array.from({ length: binCount }, (_, i) => {
    const rangeStart = i * binSize;
    const rangeEnd = (i + 1) * binSize;
    const count = totalCounts[i];
    const yesCount = yesCounts[i];
    const actualYesRate = count === 0 ? null : yesCount / count;
    const interval = count > 0 ? computeWilsonInterval(yesCount, count) : null;

    return {
      label: `${Math.round(rangeStart * 100)}-${Math.round(rangeEnd * 100)}%`,
      rangeStart,
      rangeEnd,
      count,
      actualYesRate,
      ciLower: interval ? interval.lower : null,
      ciUpper: interval ? interval.upper : null,
      insufficientSample: count < 30, // HANDOFF.md E2 standard: n < 30 labeled insufficient
    };
  });
}

/**
 * Murphy Decomposition of the Brier Score:
 * Brier = Reliability - Resolution + Uncertainty.
 *
 * Reliability = sum(n_k / N * (p_k - o_bar_k)^2) -> Lower is better (0 = perfect calibration).
 * Resolution  = sum(n_k / N * (o_bar_k - o_bar)^2) -> Higher is better (ability to separate outcomes).
 * Uncertainty = o_bar * (1 - o_bar) -> Intrinsic difficulty of the dataset.
 */
export interface MurphyDecomposition {
  reliability: number;
  resolution: number;
  uncertainty: number;
  brierScore: number;
  sampleSize: number;
}

export function computeMurphyDecomposition(
  scored: ScoredObservation[],
  binCount = 10
): MurphyDecomposition | null {
  const valid = scored.filter(
    (s) =>
      s.scorable &&
      s.observation.probability !== null &&
      s.observation.probability !== undefined &&
      s.resolution.outcome !== "VOID"
  );

  if (valid.length === 0) return null;
  const N = valid.length;

  const binSize = 1 / binCount;
  const binTotal = new Array(binCount).fill(0);
  const binYes = new Array(binCount).fill(0);
  const binProbSum = new Array(binCount).fill(0);

  let totalYes = 0;
  let totalBrier = 0;

  for (const s of valid) {
    const raw = s.observation.probability as number;
    const p = raw > 1 ? raw / 100 : raw;
    const y = s.resolution.outcome === "YES" ? 1 : 0;
    const binIdx = Math.min(binCount - 1, Math.floor(p * binCount));

    binTotal[binIdx]++;
    if (y === 1) {
      binYes[binIdx]++;
      totalYes++;
    }
    binProbSum[binIdx] += p;
    totalBrier += (p - y) ** 2;
  }

  const baseRate = totalYes / N;
  const uncertainty = baseRate * (1 - baseRate);

  let reliability = 0;
  let resolution = 0;

  for (let k = 0; k < binCount; k++) {
    const nk = binTotal[k];
    if (nk === 0) continue;
    const pkMean = binProbSum[k] / nk;
    const okMean = binYes[k] / nk;

    reliability += (nk / N) * ((pkMean - okMean) ** 2);
    resolution += (nk / N) * ((okMean - baseRate) ** 2);
  }

  const brierScore = totalBrier / N;

  return {
    reliability: Number(reliability.toFixed(5)),
    resolution: Number(resolution.toFixed(5)),
    uncertainty: Number(uncertainty.toFixed(5)),
    brierScore: Number(brierScore.toFixed(5)),
    sampleSize: N,
  };
}

/**
 * Computes Brier Skill Score (BSS) relative to a reference benchmark:
 * BSS = 1 - (Brier / ReferenceBrier).
 * BSS > 0 means the forecast outperforms the benchmark.
 */
export function computeBrierSkillScore(
  brierScore: number,
  referenceBrierScore: number
): number {
  if (referenceBrierScore <= 0) return 0;
  return Number((1 - brierScore / referenceBrierScore).toFixed(4));
}

/**
 * Log Loss (Cross-Entropy) for binary probabilistic forecasts:
 * LogLoss = -1/N * sum(y * ln(p) + (1 - y) * ln(1 - p)).
 */
export function computeLogLoss(scored: ScoredObservation[], epsilon = 1e-6): number | null {
  const valid = scored.filter(
    (s) =>
      s.scorable &&
      s.observation.probability !== null &&
      s.observation.probability !== undefined &&
      s.resolution.outcome !== "VOID"
  );

  if (valid.length === 0) return null;

  let totalLoss = 0;
  for (const s of valid) {
    const raw = s.observation.probability as number;
    let p = raw > 1 ? raw / 100 : raw;
    p = Math.min(1 - epsilon, Math.max(epsilon, p));
    const y = s.resolution.outcome === "YES" ? 1 : 0;

    totalLoss += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
  }

  return Number((totalLoss / valid.length).toFixed(4));
}

/** Daily ritual streak over research_observations.created timestamps
 * for one owner — showing up (an observation logged, forecast or
 * abstention) counts, not trading volume. */
export function computeStreak(
  createdTimestamps: string[],
  today: Date = new Date()
): { currentStreak: number; longestStreak: number } {
  const days = new Set(createdTimestamps.map((ts) => new Date(ts).toISOString().slice(0, 10)));
  const sortedDays = Array.from(days).sort();

  let longestStreak = 0;
  let run = 0;
  let prevDay: string | null = null;
  for (const day of sortedDays) {
    run = prevDay !== null && daysBetween(prevDay, day) === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prevDay = day;
  }

  let currentStreak = 0;
  const todayStr = today.toISOString().slice(0, 10);
  let cursor = days.has(todayStr) ? todayStr : shiftDay(todayStr, -1);
  while (days.has(cursor)) {
    currentStreak++;
    cursor = shiftDay(cursor, -1);
  }

  return { currentStreak, longestStreak };
}

function daysBetween(aIso: string, bIso: string): number {
  return Math.round((Date.parse(bIso + "T00:00:00Z") - Date.parse(aIso + "T00:00:00Z")) / 86_400_000);
}

function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
