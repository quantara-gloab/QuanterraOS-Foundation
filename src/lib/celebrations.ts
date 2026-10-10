/**
 * QuanterraOS Flight Deck — Discipline Celebration Engine
 *
 * Implements Phase 5 Task 5.4 & Blueprint Part 0.3 & 3.5:
 * - "Celebration animations fire for rank-ups, mission completion, and calibration improvement —
 *    NOT for winning trades. No confetti/celebration on wins."
 * - Respects prefers-reduced-motion.
 * - Sound is off by default with opt-in audio telemetry blips.
 */

export type AllowedCelebrationTrigger =
  | "RANK_UP"
  | "MISSION_COMPLETE"
  | "CALIBRATION_IMPROVEMENT"
  | "TILT_COOLDOWN_RESPECTED";

export const FORBIDDEN_CELEBRATION_TRIGGERS = [
  "WINNING_TRADE",
  "TRADE_WIN",
  "WIN_STREAK",
  "PROFIT_TARGET",
  "POSITIVE_PNL",
  "PORTFOLIO_GAIN",
  "TRADE_PLACED",
  "BIG_WIN",
  "MONEY_MADE",
  "DOLLAR_GAIN",
] as const;

export class CelebrationGuardrailViolationError extends Error {
  constructor(trigger: string) {
    super(
      `[Part 0.3 Guardrail Violation] Celebrations are strictly forbidden for '${trigger}'. QuanterraOS fires celebrations exclusively for rank-ups, mission completion, and calibration improvements — never for winning trades or P&L.`
    );
    this.name = "CelebrationGuardrailViolationError";
  }
}

export interface CelebrationConfig {
  trigger: AllowedCelebrationTrigger;
  title: string;
  headline: string;
  detail: string;
  badgeSvg: string;
  accentColor: string;
  xpEarned: number;
  unlockedItemName?: string;
  soundCueId: string;
}

export const CELEBRATION_PRESETS: Record<AllowedCelebrationTrigger, (payload?: Record<string, unknown>) => CelebrationConfig> = {
  RANK_UP: (payload = {}) => {
    const rankName = (payload.rankName as string) || "Pilot";
    const unlockName = (payload.unlockName as string) || "Nebula Cyan Hull Plating";
    return {
      trigger: "RANK_UP",
      title: "PROMOTION CEREMONY // NEW FLEET RANK ACHIEVED",
      headline: `Promoted to ${rankName}`,
      detail: `Your disciplined pre-flight rigor and calibration progress have earned you the rank of ${rankName}. New cosmetic unlock available in the hangar: ${unlockName}.`,
      badgeSvg: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#4FD1E8" stroke-width="2"/><polygon points="24,8 29,19 41,20 32,28 35,40 24,33 13,40 16,28 7,20 19,19" fill="#C9A24A"/></svg>`,
      accentColor: "var(--hud-cyan)",
      xpEarned: 0,
      unlockedItemName: unlockName,
      soundCueId: "rank_up_fanfare",
    };
  },
  MISSION_COMPLETE: (payload = {}) => {
    const missionTitle = (payload.missionTitle as string) || "Pre-Flight Rigor";
    const xp = (payload.xp as number) || 30;
    return {
      trigger: "MISSION_COMPLETE",
      title: "DISCIPLINE MISSION FULFILLED",
      headline: missionTitle,
      detail: `All required verification checks completed. No trades required. Rewarded strictly for procedural diligence.`,
      badgeSvg: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#30A46C" stroke-width="2"/><path d="M14 24 L21 31 L34 17" stroke="#30A46C" stroke-width="3" stroke-linecap="round"/></svg>`,
      accentColor: "var(--ok-green)",
      xpEarned: xp,
      soundCueId: "mission_complete_chime",
    };
  },
  CALIBRATION_IMPROVEMENT: (payload = {}) => {
    const priorBrier = (payload.priorBrier as number) || 0.2185;
    const currentBrier = (payload.currentBrier as number) || 0.1872;
    const bpsImproved = Math.round((priorBrier - currentBrier) * 10000);
    return {
      trigger: "CALIBRATION_IMPROVEMENT",
      title: "CALIBRATION MILESTONE // ERROR REDUCTION",
      headline: `Brier Score Improved to ${currentBrier.toFixed(4)}`,
      detail: `Your 30-day forecast accuracy improved by +${(bpsImproved / 100).toFixed(1)}% vs your prior window. You are outperforming the random coin-flip benchmark (0.2500) through rigorous assessment.`,
      badgeSvg: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#DFB843" stroke-width="2"/><path d="M12 36 L24 16 L36 28 L42 12" stroke="#DFB843" stroke-width="3" stroke-linecap="round"/><circle cx="42" cy="12" r="3" fill="#4FD1E8"/></svg>`,
      accentColor: "var(--hud-gold)",
      xpEarned: 100,
      soundCueId: "calibration_milestone_tone",
    };
  },
  TILT_COOLDOWN_RESPECTED: (payload = {}) => {
    return {
      trigger: "TILT_COOLDOWN_RESPECTED",
      title: "EMOTIONAL TILT MITIGATED // SYSTEM DEFENSE",
      headline: "15-Minute Cooldown Respected",
      detail: `You stood down during high variance, protected your voluntary loss limit, and preserved your risk capital. Emotional discipline is the mark of a true pilot.`,
      badgeSvg: `<svg viewBox="0 0 48 48" fill="none"><path d="M24 6 L38 12 V24 C38 34 24 42 24 42 C24 42 10 34 10 24 V12 Z" stroke="#E5484D" stroke-width="2" fill="none"/><line x1="24" y1="16" x2="24" y2="26" stroke="#E5484D" stroke-width="3"/><circle cx="24" cy="32" r="2" fill="#E5484D"/></svg>`,
      accentColor: "var(--alert-red)",
      xpEarned: 25,
      soundCueId: "cooldown_respected_ping",
    };
  },
};

/**
 * Validates and produces a celebration configuration, enforcing that winning trades
 * or profit events are strictly rejected.
 */
export function triggerDisciplineCelebration(
  trigger: string,
  payload?: Record<string, unknown>
): CelebrationConfig {
  const normalized = trigger.trim().toUpperCase();

  // Guardrail enforcement: forbid win/profit celebrations
  for (const forbidden of FORBIDDEN_CELEBRATION_TRIGGERS) {
    if (normalized.includes(forbidden)) {
      throw new CelebrationGuardrailViolationError(trigger);
    }
  }

  // Check payload for forbidden profit keys
  if (payload) {
    const keys = Object.keys(payload).map((k) => k.toLowerCase());
    for (const fKey of ["win", "profit", "pnl", "gain", "trade"]) {
      if (keys.some((k) => k.includes(fKey))) {
        throw new CelebrationGuardrailViolationError(`${trigger} with payload.${fKey}`);
      }
    }
  }

  if (!(normalized in CELEBRATION_PRESETS)) {
    throw new CelebrationGuardrailViolationError(trigger);
  }

  const factory = CELEBRATION_PRESETS[normalized as AllowedCelebrationTrigger];
  return factory(payload);
}
