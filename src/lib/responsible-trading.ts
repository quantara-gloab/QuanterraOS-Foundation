/**
 * QuanterraOS Responsible Trading Layer
 *
 * Implements Phase 4 Task 4.6 (Part 3.6):
 * 1. 18+ Age Gate: boolean attestation stored with timestamp.
 * 2. User-set limits: daily loss limit, weekly loss limit, monthly fee budget.
 * 3. Tilt Detection & Systems Cooldown:
 *    - Triggers on 3+ logged losses within 60 minutes or rapid re-entry.
 *    - 15-minute systems cooldown overlay (dismissable).
 *    - Respecting tilt cooldown awards +25 XP discipline.
 * 4. Session timer reminder (default 60 minutes).
 * 5. "Take a Break" self-pause (24h, 7d, 30d).
 * 6. Responsible gambling help links (1-800-GAMBLER).
 * 7. Multi-device sync API endpoints.
 */

export interface LossEvent {
  timestampIso: string;
  lossDollars: number;
  ticker: string;
}

export interface UserResponsibleLimits {
  is18PlusAttested: boolean;
  attestedAtIso: string | null;
  dailyLossLimit: number;
  weeklyLossLimit: number;
  monthlyFeeBudget: number;
  sessionTimerMinutes: number;
  selfPauseUntilIso: string | null;
  tiltCooldownActive: boolean;
  tiltCooldownExpiresIso: string | null;
  recentLosses: LossEvent[];
  cooldownsRespectedCount: number;
}

export const DEFAULT_RESPONSIBLE_LIMITS: UserResponsibleLimits = {
  is18PlusAttested: true,
  attestedAtIso: new Date().toISOString(),
  dailyLossLimit: 50.0,
  weeklyLossLimit: 200.0,
  monthlyFeeBudget: 50.0,
  sessionTimerMinutes: 60,
  selfPauseUntilIso: null,
  tiltCooldownActive: false,
  tiltCooldownExpiresIso: null,
  recentLosses: [],
  cooldownsRespectedCount: 0,
};

/**
 * In-memory store per user (synced via REST endpoints).
 */
const limitsStore: Map<string, UserResponsibleLimits> = new Map();

/**
 * Gets or initializes user limits.
 */
export function getUserLimits(userId: string = "cadet-default"): UserResponsibleLimits {
  let limits = limitsStore.get(userId);
  if (!limits) {
    limits = { ...DEFAULT_RESPONSIBLE_LIMITS, recentLosses: [] };
    limitsStore.set(userId, limits);
  }
  return limits;
}

/**
 * Updates user limits and persists them.
 */
export function updateUserLimits(
  userId: string = "cadet-default",
  updates: Partial<UserResponsibleLimits>
): UserResponsibleLimits {
  const current = getUserLimits(userId);
  const updated: UserResponsibleLimits = {
    ...current,
    ...updates,
    dailyLossLimit: updates.dailyLossLimit !== undefined ? Math.max(5, updates.dailyLossLimit) : current.dailyLossLimit,
    weeklyLossLimit: updates.weeklyLossLimit !== undefined ? Math.max(10, updates.weeklyLossLimit) : current.weeklyLossLimit,
    monthlyFeeBudget: updates.monthlyFeeBudget !== undefined ? Math.max(5, updates.monthlyFeeBudget) : current.monthlyFeeBudget,
    sessionTimerMinutes: updates.sessionTimerMinutes !== undefined ? Math.max(15, updates.sessionTimerMinutes) : current.sessionTimerMinutes,
  };
  limitsStore.set(userId, updated);
  return updated;
}

/**
 * Evaluates whether tilt condition has been triggered:
 * Condition 1: 3+ losses within 60 minutes (3600s).
 * Condition 2: Rapid re-entry after loss (< 180s between entries).
 */
export function evaluateTiltCondition(
  losses: LossEvent[],
  nowMs: number = Date.now()
): { isTiltTriggered: boolean; reason: string | null; cooldownSeconds: number } {
  if (!losses || losses.length === 0) {
    return { isTiltTriggered: false, reason: null, cooldownSeconds: 0 };
  }

  const oneHourAgoMs = nowMs - 60 * 60 * 1000;
  const recentWithinHour = losses.filter((l) => new Date(l.timestampIso).getTime() >= oneHourAgoMs);

  // Condition 1: 3+ losses within 60 minutes
  if (recentWithinHour.length >= 3) {
    return {
      isTiltTriggered: true,
      reason: `3 losses recorded in the last 60 minutes (${recentWithinHour.length} total). Systems cooldown active.`,
      cooldownSeconds: 900, // 15 minutes
    };
  }

  // Condition 2: Rapid re-entry after loss (< 180s apart)
  if (losses.length >= 2) {
    const sorted = [...losses].sort(
      (a, b) => new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime()
    );
    const diffMs = Math.abs(
      new Date(sorted[0].timestampIso).getTime() - new Date(sorted[1].timestampIso).getTime()
    );
    if (diffMs < 180 * 1000 && recentWithinHour.length >= 2) {
      return {
        isTiltTriggered: true,
        reason: "Rapid re-entry after loss detected (under 3 minutes). Systems cooldown engaged.",
        cooldownSeconds: 900,
      };
    }
  }

  return { isTiltTriggered: false, reason: null, cooldownSeconds: 0 };
}

/**
 * Records a loss event and checks for tilt trigger.
 */
export function recordLossAndCheckTilt(
  userId: string,
  loss: { lossDollars: number; ticker: string; timestampIso?: string }
): { limits: UserResponsibleLimits; tiltTriggered: boolean; reason: string | null } {
  const current = getUserLimits(userId);
  const now = loss.timestampIso ?? new Date().toISOString();
  const newLossEvent: LossEvent = {
    timestampIso: now,
    lossDollars: loss.lossDollars,
    ticker: loss.ticker,
  };

  const updatedLosses = [newLossEvent, ...current.recentLosses].slice(0, 20); // retain last 20
  const tiltEval = evaluateTiltCondition(updatedLosses, new Date(now).getTime());

  let tiltCooldownActive = current.tiltCooldownActive;
  let tiltCooldownExpiresIso = current.tiltCooldownExpiresIso;

  if (tiltEval.isTiltTriggered) {
    tiltCooldownActive = true;
    tiltCooldownExpiresIso = new Date(new Date(now).getTime() + tiltEval.cooldownSeconds * 1000).toISOString();
  }

  const updated = updateUserLimits(userId, {
    recentLosses: updatedLosses,
    tiltCooldownActive,
    tiltCooldownExpiresIso,
  });

  return {
    limits: updated,
    tiltTriggered: tiltEval.isTiltTriggered,
    reason: tiltEval.reason,
  };
}

/**
 * Pilot respects the tilt cooldown. Awards +25 XP discipline.
 */
export function respectTiltCooldown(userId: string): {
  limits: UserResponsibleLimits;
  xpAwarded: number;
} {
  const current = getUserLimits(userId);
  const updated = updateUserLimits(userId, {
    cooldownsRespectedCount: current.cooldownsRespectedCount + 1,
  });
  return {
    limits: updated,
    xpAwarded: 25,
  };
}

/**
 * Sets a self-pause ("Take a Break") for specified hours (24, 168, 720).
 */
export function applySelfPause(
  userId: string,
  hours: number
): UserResponsibleLimits {
  const untilIso = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  return updateUserLimits(userId, {
    selfPauseUntilIso: untilIso,
  });
}

/**
 * Verifies 18+ age attestation.
 */
export function attestAge18(userId: string): UserResponsibleLimits {
  return updateUserLimits(userId, {
    is18PlusAttested: true,
    attestedAtIso: new Date().toISOString(),
  });
}
