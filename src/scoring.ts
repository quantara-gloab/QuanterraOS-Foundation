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
    return {
      label: `${Math.round(rangeStart * 100)}-${Math.round(rangeEnd * 100)}%`,
      rangeStart,
      rangeEnd,
      count: totalCounts[i],
      actualYesRate: totalCounts[i] === 0 ? null : yesCounts[i] / totalCounts[i],
    };
  });
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
