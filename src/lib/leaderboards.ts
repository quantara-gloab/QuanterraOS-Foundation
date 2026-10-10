/**
 * QuanterraOS Flight Deck — Opt-In Pseudonymous Leaderboard Engine
 *
 * Implements Phase 5 Task 5.3 & Blueprint Part 0.3 & 3.5:
 * - Ranked strictly by CALIBRATION (min n=30 settled logs) and FEES SAVED.
 * - NEVER ranked by profit, ROI, P&L, win rate, or contract volume.
 * - Strictly opt-in and pseudonymous (callsigns only, no emails/wallets).
 * - Gatekeeper: minimum n=30 settled logs required for Calibration rank to prevent small-sample luck.
 */

export interface LeaderboardEntry {
  rank: number;
  callsign: string;
  pilotRank: string;
  settledLogCount: number;
  brierScore: number;
  feesSavedDollars: number;
  makerOrderRatioPct: number;
  thesisAdherencePct: number;
  optedInAt: string;
  isEligibleForCalibrationRank: boolean;
}

export interface UserLeaderboardProfile {
  userId: string;
  callsign: string;
  isOptedIn: boolean;
  settledLogCount: number;
  brierScore: number;
  feesSavedDollars: number;
  makerOrderRatioPct: number;
  thesisAdherencePct: number;
  updatedAt: string;
}

export const MIN_CALIBRATION_SAMPLE_SIZE = 30;

export const FORBIDDEN_LEADERBOARD_METRICS = [
  "PROFIT",
  "PNL",
  "ROI",
  "WIN_RATE",
  "WINNING_TRADES",
  "VOLUME",
  "TURNOVER",
  "CONTRACT_COUNT",
  "TRADE_SIZE",
  "ACCOUNT_BALANCE",
] as const;

export class LeaderboardGuardrailViolationError extends Error {
  constructor(metric: string) {
    super(
      `[Part 0.3 Guardrail Violation] Leaderboards cannot be ranked by '${metric}'. QuanterraOS leaderboards are ranked exclusively by Calibration (Brier score) and Fees Saved.`
    );
    this.name = "LeaderboardGuardrailViolationError";
  }
}

// Pseudonymous seed pilots representing fleet leaders
const fleetLeaderboardStore: UserLeaderboardProfile[] = [
  {
    userId: "pilot-aurora-7",
    callsign: "AURORA-7",
    isOptedIn: true,
    settledLogCount: 64,
    brierScore: 0.1782,
    feesSavedDollars: 482.5,
    makerOrderRatioPct: 88,
    thesisAdherencePct: 96,
    updatedAt: "2026-10-09T18:00:00Z",
  },
  {
    userId: "pilot-chronos-9",
    callsign: "CHRONOS-9",
    isOptedIn: true,
    settledLogCount: 52,
    brierScore: 0.1845,
    feesSavedDollars: 395.0,
    makerOrderRatioPct: 82,
    thesisAdherencePct: 94,
    updatedAt: "2026-10-09T18:00:00Z",
  },
  {
    userId: "pilot-polaris-3",
    callsign: "POLARIS-3",
    isOptedIn: true,
    settledLogCount: 41,
    brierScore: 0.1912,
    feesSavedDollars: 310.25,
    makerOrderRatioPct: 79,
    thesisAdherencePct: 91,
    updatedAt: "2026-10-09T18:00:00Z",
  },
  {
    userId: "pilot-hyperion-2",
    callsign: "HYPERION-2",
    isOptedIn: true,
    settledLogCount: 38,
    brierScore: 0.1978,
    feesSavedDollars: 265.0,
    makerOrderRatioPct: 75,
    thesisAdherencePct: 88,
    updatedAt: "2026-10-09T18:00:00Z",
  },
  {
    userId: "pilot-zenith-5",
    callsign: "ZENITH-5",
    isOptedIn: true,
    settledLogCount: 32,
    brierScore: 0.2014,
    feesSavedDollars: 215.75,
    makerOrderRatioPct: 71,
    thesisAdherencePct: 85,
    updatedAt: "2026-10-09T18:00:00Z",
  },
  {
    userId: "pilot-cadet-nova",
    callsign: "NOVA-CADET",
    isOptedIn: true,
    settledLogCount: 18, // Below min n=30 gate
    brierScore: 0.165, // Looks artificially great due to small sample
    feesSavedDollars: 95.0,
    makerOrderRatioPct: 65,
    thesisAdherencePct: 80,
    updatedAt: "2026-10-09T18:00:00Z",
  },
  {
    userId: "pilot-stealth-user",
    callsign: "GHOST-1",
    isOptedIn: false, // Opted OUT
    settledLogCount: 85,
    brierScore: 0.1802,
    feesSavedDollars: 620.0,
    makerOrderRatioPct: 90,
    thesisAdherencePct: 98,
    updatedAt: "2026-10-09T18:00:00Z",
  },
];

/**
 * Validates that requested sorting metric complies with non-profit guardrails.
 */
export function validateLeaderboardSortingMetric(metric: string): "calibration" | "fees_saved" {
  const normalized = metric.trim().toUpperCase();

  for (const forbidden of FORBIDDEN_LEADERBOARD_METRICS) {
    if (normalized.includes(forbidden)) {
      throw new LeaderboardGuardrailViolationError(metric);
    }
  }

  if (normalized === "CALIBRATION" || normalized === "BRIER") {
    return "calibration";
  }
  if (normalized === "FEES_SAVED" || normalized === "FEES" || normalized === "SAVINGS") {
    return "fees_saved";
  }

  throw new LeaderboardGuardrailViolationError(metric);
}

/**
 * Computes the Calibration Leaderboard:
 * - Ranked by lowest Brier score (best calibration).
 * - Minimum sample size filter strictly enforced (n >= 30).
 * - Only opted-in pseudonymous users.
 */
export function getCalibrationLeaderboard(
  minSampleSize = MIN_CALIBRATION_SAMPLE_SIZE,
  profiles: UserLeaderboardProfile[] = fleetLeaderboardStore
): {
  rankedLeaders: LeaderboardEntry[];
  calibratingPilots: Array<LeaderboardEntry & { logsRemainingForRank: number }>;
  marketMidBenchmarkBrier: number;
  climatologyBrier: number;
} {
  // Filter for opted-in pilots
  const optedIn = profiles.filter((p) => p.isOptedIn);

  // Eligible: settledLogCount >= minSampleSize
  const eligible = optedIn.filter((p) => p.settledLogCount >= minSampleSize);
  eligible.sort((a, b) => a.brierScore - b.brierScore);

  const rankedLeaders: LeaderboardEntry[] = eligible.map((p, idx) => ({
    rank: idx + 1,
    callsign: p.callsign,
    pilotRank: p.brierScore < 0.19 ? "Commander" : "Lieutenant",
    settledLogCount: p.settledLogCount,
    brierScore: Number(p.brierScore.toFixed(4)),
    feesSavedDollars: p.feesSavedDollars,
    makerOrderRatioPct: p.makerOrderRatioPct,
    thesisAdherencePct: p.thesisAdherencePct,
    optedInAt: p.updatedAt,
    isEligibleForCalibrationRank: true,
  }));

  // In training: settledLogCount < minSampleSize
  const calibrating = optedIn.filter((p) => p.settledLogCount < minSampleSize);
  const calibratingPilots = calibrating.map((p) => ({
    rank: 0,
    callsign: p.callsign,
    pilotRank: "Cadet",
    settledLogCount: p.settledLogCount,
    brierScore: Number(p.brierScore.toFixed(4)),
    feesSavedDollars: p.feesSavedDollars,
    makerOrderRatioPct: p.makerOrderRatioPct,
    thesisAdherencePct: p.thesisAdherencePct,
    optedInAt: p.updatedAt,
    isEligibleForCalibrationRank: false,
    logsRemainingForRank: minSampleSize - p.settledLogCount,
  }));

  return {
    rankedLeaders,
    calibratingPilots,
    marketMidBenchmarkBrier: 0.2001,
    climatologyBrier: 0.2500,
  };
}

/**
 * Computes the Fees Saved (Friction Avoidance) Leaderboard:
 * - Ranked by highest dollar friction avoided via Maker Limit orders and Rounding consolidation.
 * - Only opted-in pseudonymous users.
 */
export function getFeesSavedLeaderboard(
  profiles: UserLeaderboardProfile[] = fleetLeaderboardStore
): LeaderboardEntry[] {
  const optedIn = profiles.filter((p) => p.isOptedIn);
  optedIn.sort((a, b) => b.feesSavedDollars - a.feesSavedDollars);

  return optedIn.map((p, idx) => ({
    rank: idx + 1,
    callsign: p.callsign,
    pilotRank: p.feesSavedDollars >= 400 ? "Captain" : "Pilot",
    settledLogCount: p.settledLogCount,
    brierScore: Number(p.brierScore.toFixed(4)),
    feesSavedDollars: Number(p.feesSavedDollars.toFixed(2)),
    makerOrderRatioPct: p.makerOrderRatioPct,
    thesisAdherencePct: p.thesisAdherencePct,
    optedInAt: p.updatedAt,
    isEligibleForCalibrationRank: p.settledLogCount >= MIN_CALIBRATION_SAMPLE_SIZE,
  }));
}

/**
 * Updates a user's leaderboard opt-in status and pseudonymous callsign.
 */
export function updatePilotLeaderboardOptIn(
  userId: string,
  isOptedIn: boolean,
  callsign?: string
): UserLeaderboardProfile {
  let profile = fleetLeaderboardStore.find((p) => p.userId === userId);

  if (!profile) {
    profile = {
      userId,
      callsign: callsign || "PILOT-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
      isOptedIn,
      settledLogCount: 0,
      brierScore: 0.25,
      feesSavedDollars: 0,
      makerOrderRatioPct: 0,
      thesisAdherencePct: 0,
      updatedAt: new Date().toISOString(),
    };
    fleetLeaderboardStore.push(profile);
  } else {
    profile.isOptedIn = isOptedIn;
    if (callsign) profile.callsign = callsign.trim().toUpperCase();
    profile.updatedAt = new Date().toISOString();
  }

  return profile;
}
