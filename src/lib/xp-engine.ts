/**
 * QuanterraOS Flight Deck — Anti-Volume XP Engine & Progression Architecture
 *
 * Implements Phase 5 Task 5.2 & Blueprint Part 0.3 & 3.5:
 * - Event-sourced progression engine (xp_events)
 * - XP earned ONLY for discipline, checks, thesis writing, maker orders,
 *   standing down from hazard zones, debriefs, and calibration improvements.
 * - XP is NEVER earned for trade counts, volume, trade size, P&L, or winning trades.
 * - Ranks (Cadet → Pilot → Lieutenant → Commander → Captain → Admiral).
 * - Cosmetic unlocks only (ship skins, HUD themes, crew portraits) — never execution or discounts.
 * - Daily, weekly, and campaign missions that never require trading live capital.
 */

export type XpActionType =
  | "PRE_FLIGHT_CHECK"
  | "WRITTEN_THESIS"
  | "MAKER_SAVER_DISCIPLINE"
  | "COIN_FLIP_STAND_DOWN"
  | "FLIGHT_SCHOOL_LESSON"
  | "WEEKLY_DEBRIEF"
  | "BRIER_CALIBRATION_IMPROVEMENT"
  | "TILT_COOLDOWN_RESPECTED";

/**
 * Strict XP Award Matrix from Blueprint Part 3.5
 */
export const XP_ACTION_AWARDS: Record<XpActionType, { xp: number; description: string }> = {
  PRE_FLIGHT_CHECK: {
    xp: 10,
    description: "Run a pre-flight Check before a logged trade",
  },
  WRITTEN_THESIS: {
    xp: 15,
    description: "Write a thesis + max-loss before entry",
  },
  MAKER_SAVER_DISCIPLINE: {
    xp: 10,
    description: "Choose maker/limit when Saver showed savings",
  },
  COIN_FLIP_STAND_DOWN: {
    xp: 20,
    description: "Avoid a flagged coin-flip-zone entry (dismiss with 'standing down')",
  },
  FLIGHT_SCHOOL_LESSON: {
    xp: 25,
    description: "Complete a Flight School lesson / quiz",
  },
  WEEKLY_DEBRIEF: {
    xp: 30,
    description: "Weekly debrief completed",
  },
  BRIER_CALIBRATION_IMPROVEMENT: {
    xp: 100,
    description: "Improve 30-day Brier vs prior 30 days",
  },
  TILT_COOLDOWN_RESPECTED: {
    xp: 25,
    description: "Respect a tilt cooldown",
  },
};

/**
 * Disallowed event types that violate Part 0.3 & Part 3.5 anti-volume rules.
 */
export const FORBIDDEN_XP_PATTERNS = [
  "TRADE_PLACED",
  "ORDER_EXECUTED",
  "TRADE_COUNT",
  "TRADE_VOLUME",
  "TRADE_SIZE",
  "DOLLAR_PROFIT",
  "PNL_WIN",
  "WIN_STREAK",
  "WINNING_TRADE",
  "POSITION_OPENED",
  "DAILY_TURNOVER",
  "CONTRACTS_TRADED",
] as const;

export class DisciplineGuardrailViolationError extends Error {
  constructor(reason: string) {
    super(`[Part 0.3 Guardrail Violation] ${reason}`);
    this.name = "DisciplineGuardrailViolationError";
  }
}

export interface XpEvent {
  id: string;
  userId: string;
  eventType: XpActionType;
  xpAmount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CosmeticUnlock {
  id: string;
  category: "ship_skin" | "hud_theme" | "crew_portrait";
  name: string;
  description: string;
  unlockedAtRank: string;
  previewAsset: string;
}

export interface PilotRank {
  rankName: string;
  tier: number;
  minXp: number;
  tagline: string;
  badgeSvg: string;
  cosmetics: CosmeticUnlock[];
}

export const PILOT_RANKS: PilotRank[] = [
  {
    rankName: "Cadet",
    tier: 1,
    minXp: 0,
    tagline: "Flight Academy Trainee — Standard cockpit orientation",
    badgeSvg: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#8A8F98" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="16" stroke="#8A8F98" stroke-width="2"/></svg>`,
    cosmetics: [
      {
        id: "skin-void-black",
        category: "ship_skin",
        name: "Void Black Hull",
        description: "Standard matte carbon finish for training cruisers.",
        unlockedAtRank: "Cadet",
        previewAsset: "#0A0D14",
      },
      {
        id: "hud-amber-mono",
        category: "hud_theme",
        name: "Monospace Amber Telemetry",
        description: "Classic monochrome cockpit heads-up display.",
        unlockedAtRank: "Cadet",
        previewAsset: "#C9A24A",
      },
      {
        id: "portrait-cadet",
        category: "crew_portrait",
        name: "Ensign Insignia",
        description: "Standard Flight Academy cadet flight crest.",
        unlockedAtRank: "Cadet",
        previewAsset: "badge-cadet",
      },
    ],
  },
  {
    rankName: "Pilot",
    tier: 2,
    minXp: 50,
    tagline: "Qualified Pilot — Certified for live settlement radar operations",
    badgeSvg: `<svg viewBox="0 0 24 24" fill="none"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" stroke="#4FD1E8" stroke-width="1.5"/></svg>`,
    cosmetics: [
      {
        id: "skin-nebula-cyan",
        category: "ship_skin",
        name: "Nebula Cyan Plating",
        description: "Reflective atmospheric shielding with cyan hull accents.",
        unlockedAtRank: "Pilot",
        previewAsset: "#4FD1E8",
      },
      {
        id: "hud-cyan-glow",
        category: "hud_theme",
        name: "Cyan Glow HUD",
        description: "High-contrast telemetry with enhanced TWAP indicator block contrast.",
        unlockedAtRank: "Pilot",
        previewAsset: "rgba(79,209,232,0.2)",
      },
      {
        id: "portrait-pilot",
        category: "crew_portrait",
        name: "Aviator Wings",
        description: "Earned by completing pre-flight checks and thesis discipline.",
        unlockedAtRank: "Pilot",
        previewAsset: "badge-pilot",
      },
    ],
  },
  {
    rankName: "Lieutenant",
    tier: 3,
    minXp: 150,
    tagline: "Squadron Officer — High maker order discipline and loss-limit hygiene",
    badgeSvg: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#C9A24A" stroke-width="1.5"/></svg>`,
    cosmetics: [
      {
        id: "skin-solar-gold",
        category: "ship_skin",
        name: "Solar Gold Canopy",
        description: "Gold nano-coated anti-radiation hull armor.",
        unlockedAtRank: "Lieutenant",
        previewAsset: "#C9A24A",
      },
      {
        id: "hud-solar-grid",
        category: "hud_theme",
        name: "Solar Vector Grid",
        description: "Monospace telemetry numerals with gold-accented risk brackets.",
        unlockedAtRank: "Lieutenant",
        previewAsset: "#E8C15A",
      },
      {
        id: "portrait-lieutenant",
        category: "crew_portrait",
        name: "Officer Cap Crest",
        description: "Commissioned bridge officer insignia.",
        unlockedAtRank: "Lieutenant",
        previewAsset: "badge-lt",
      },
    ],
  },
  {
    rankName: "Commander",
    tier: 4,
    minXp: 350,
    tagline: "Bridge Commander — Calibration excellence and disciplined debrief cadence",
    badgeSvg: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#30A46C" stroke-width="2"/><polygon points="12,6 16,14 8,14" fill="#30A46C"/></svg>`,
    cosmetics: [
      {
        id: "skin-titanium-deep",
        category: "ship_skin",
        name: "Deep Space Titanium",
        description: "Hardened brushed titanium plating engineered for deep orbital drift.",
        unlockedAtRank: "Commander",
        previewAsset: "#2B3641",
      },
      {
        id: "hud-quantum-grid",
        category: "hud_theme",
        name: "Quantum HUD Grid",
        description: "Low-noise cockpit glass with 60fps micro-scanline optics.",
        unlockedAtRank: "Commander",
        previewAsset: "rgba(48,164,108,0.2)",
      },
      {
        id: "portrait-commander",
        category: "crew_portrait",
        name: "Command Star",
        description: "Awarded to pilots with rolling personal Brier scores beating random noise.",
        unlockedAtRank: "Commander",
        previewAsset: "badge-commander",
      },
    ],
  },
  {
    rankName: "Captain",
    tier: 5,
    minXp: 700,
    tagline: "Vessel Captain — Master of fee friction avoidance and risk boundaries",
    badgeSvg: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#DFB843" stroke-width="2"/><polygon points="12,4 14,9 20,9 15,13 17,19 12,15 7,19 9,13 4,9 10,9" fill="#DFB843"/></svg>`,
    cosmetics: [
      {
        id: "skin-pulsar-iridescent",
        category: "ship_skin",
        name: "Pulsar Iridescent Shroud",
        description: "Chameleon optical coating that shimmers under cosmic rays.",
        unlockedAtRank: "Captain",
        previewAsset: "linear-gradient(135deg, #4FD1E8, #C9A24A)",
      },
      {
        id: "hud-cyber-tactical",
        category: "hud_theme",
        name: "Cyber-Tactical Monolith",
        description: "Subtle radar sweep visualization with real-time dispersion dials.",
        unlockedAtRank: "Captain",
        previewAsset: "rgba(223,184,67,0.2)",
      },
      {
        id: "portrait-captain",
        category: "crew_portrait",
        name: "Captain Gold Crest",
        description: "Distinguished vessel commander crest with gold laurels.",
        unlockedAtRank: "Captain",
        previewAsset: "badge-captain",
      },
    ],
  },
  {
    rankName: "Admiral",
    tier: 6,
    minXp: 1200,
    tagline: "Fleet Admiral — Top-tier calibration benchmark & zero-tilt mastery",
    badgeSvg: `<svg viewBox="0 0 24 24" fill="none"><polygon points="12,1 15,8 23,9 17,15 19,23 12,19 5,23 7,15 1,9 9,8" stroke="#FFFFFF" stroke-width="2" fill="#C9A24A"/></svg>`,
    cosmetics: [
      {
        id: "skin-celestial-chrome",
        category: "ship_skin",
        name: "Celestial Chrome Mirror",
        description: "Pure mirror-polish quantum alloy reflecting stellar constellations.",
        unlockedAtRank: "Admiral",
        previewAsset: "linear-gradient(45deg, #E8EDF2, #8A8F98, #C9A24A)",
      },
      {
        id: "hud-starlight-canopy",
        category: "hud_theme",
        name: "Starlight Canopy HUD",
        description: "Panoramic starlight bridge projection with minimal UI HUD clutter.",
        unlockedAtRank: "Admiral",
        previewAsset: "#FFFFFF",
      },
      {
        id: "portrait-admiral",
        category: "crew_portrait",
        name: "Fleet Admiral Emblem",
        description: "Highest rank in the QuanterraOS Fleet.",
        unlockedAtRank: "Admiral",
        previewAsset: "badge-admiral",
      },
    ],
  },
];

export interface MissionDefinition {
  id: string;
  category: "daily" | "weekly" | "campaign";
  title: string;
  description: string;
  targetCount: number;
  xpReward: number;
  actionRequired: XpActionType;
}

export const MISSIONS_ROSTER: MissionDefinition[] = [
  {
    id: "daily-preflight-3",
    category: "daily",
    title: "Pre-Flight Rigor",
    description: "Run 3 pre-flight checks in Engineering before staging trades.",
    targetCount: 3,
    xpReward: 30,
    actionRequired: "PRE_FLIGHT_CHECK",
  },
  {
    id: "daily-flight-school",
    category: "daily",
    title: "Flight School Drill",
    description: "Complete 1 Flight School lesson or quiz on fee friction.",
    targetCount: 1,
    xpReward: 25,
    actionRequired: "FLIGHT_SCHOOL_LESSON",
  },
  {
    id: "daily-stand-down",
    category: "daily",
    title: "Hazard Avoidance",
    description: "Dismiss 1 flagged Coin-Flip Hazard Zone by standing down.",
    targetCount: 1,
    xpReward: 20,
    actionRequired: "COIN_FLIP_STAND_DOWN",
  },
  {
    id: "weekly-thesis-5",
    category: "weekly",
    title: "Thesis Discipline",
    description: "Log 5 trades accompanied by a written thesis and max loss.",
    targetCount: 5,
    xpReward: 75,
    actionRequired: "WRITTEN_THESIS",
  },
  {
    id: "weekly-debrief-review",
    category: "weekly",
    title: "Debrief Audit",
    description: "Complete your weekly debrief reviewing avoidable taker fees.",
    targetCount: 1,
    xpReward: 30,
    actionRequired: "WEEKLY_DEBRIEF",
  },
  {
    id: "campaign-settlement-mastery",
    category: "campaign",
    title: "Settlement Mastery",
    description: "Complete 4 calibration lessons and improve 30-day Brier score.",
    targetCount: 4,
    xpReward: 100,
    actionRequired: "FLIGHT_SCHOOL_LESSON",
  },
];

export interface UserXpState {
  userId: string;
  totalXp: number;
  currentRank: PilotRank;
  nextRank: PilotRank | null;
  xpToNextRank: number;
  progressPercent: number;
  unlockedCosmetics: CosmeticUnlock[];
  actionCounts: Record<XpActionType, number>;
  activeMissions: Array<MissionDefinition & { currentProgress: number; isCompleted: boolean }>;
}

// In-memory event log for test and fast local retrieval
const inMemoryXpEvents: XpEvent[] = [];

/**
 * Validates that an XP award request complies strictly with Part 0.3 Guardrails.
 * Throws DisciplineGuardrailViolationError if an attempt is made to award XP
 * for volume, trade sizes, P&L, wins, or trading activity.
 */
export function validateXpActionGuardrails(
  action: string,
  metadata?: Record<string, unknown>
): XpActionType {
  // Check forbidden action strings
  for (const forbidden of FORBIDDEN_XP_PATTERNS) {
    if (action.toUpperCase().includes(forbidden)) {
      throw new DisciplineGuardrailViolationError(
        `Attempted to award XP for forbidden trading metric '${action}'. Part 0.3 forbids volume/P&L XP.`
      );
    }
  }

  // Check forbidden metadata fields (e.g. contracts, size, volume, pnl, win)
  if (metadata) {
    const keys = Object.keys(metadata).map((k) => k.toLowerCase());
    const forbiddenMetaKeys = ["volume", "tradesize", "pnl", "profit", "win", "tradecount", "streak"];
    for (const fKey of forbiddenMetaKeys) {
      if (keys.some((k) => k.includes(fKey))) {
        throw new DisciplineGuardrailViolationError(
          `Disallowed metadata field containing '${fKey}' passed to XP engine. XP cannot scale with volume or P&L.`
        );
      }
    }
  }

  if (!(action in XP_ACTION_AWARDS)) {
    throw new DisciplineGuardrailViolationError(
      `Unknown or unauthorized action '${action}'. XP is only awarded for explicit discipline actions.`
    );
  }

  return action as XpActionType;
}

/**
 * Records an immutable event in the event-sourced log.
 */
export function recordDisciplineXpEvent(
  userId: string,
  rawAction: string,
  metadata?: Record<string, unknown>
): XpEvent {
  const actionType = validateXpActionGuardrails(rawAction, metadata);
  const award = XP_ACTION_AWARDS[actionType];

  const event: XpEvent = {
    id: "xp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8),
    userId,
    eventType: actionType,
    xpAmount: award.xp,
    metadata,
    createdAt: new Date().toISOString(),
  };

  inMemoryXpEvents.push(event);
  return event;
}

/**
 * Computes user XP, rank, cosmetics, and active mission progression
 * from an event-sourced stream of XpEvent logs.
 */
export function computeUserXpState(userId: string, events?: XpEvent[]): UserXpState {
  const userEvents = events ?? inMemoryXpEvents.filter((e) => e.userId === userId);

  // Initialize action counts
  const actionCounts: Record<XpActionType, number> = {
    PRE_FLIGHT_CHECK: 0,
    WRITTEN_THESIS: 0,
    MAKER_SAVER_DISCIPLINE: 0,
    COIN_FLIP_STAND_DOWN: 0,
    FLIGHT_SCHOOL_LESSON: 0,
    WEEKLY_DEBRIEF: 0,
    BRIER_CALIBRATION_IMPROVEMENT: 0,
    TILT_COOLDOWN_RESPECTED: 0,
  };

  let totalXp = 0;

  for (const e of userEvents) {
    if (e.eventType in actionCounts) {
      actionCounts[e.eventType]++;
      totalXp += e.xpAmount;
    }
  }

  // Determine current Rank
  let currentRank = PILOT_RANKS[0];
  let nextRank: PilotRank | null = PILOT_RANKS[1];

  for (let i = PILOT_RANKS.length - 1; i >= 0; i--) {
    if (totalXp >= PILOT_RANKS[i].minXp) {
      currentRank = PILOT_RANKS[i];
      nextRank = i < PILOT_RANKS.length - 1 ? PILOT_RANKS[i + 1] : null;
      break;
    }
  }

  const xpToNextRank = nextRank ? Math.max(0, nextRank.minXp - totalXp) : 0;
  let progressPercent = 100;

  if (nextRank) {
    const range = nextRank.minXp - currentRank.minXp;
    const progress = totalXp - currentRank.minXp;
    progressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((progress / range) * 100))) : 0;
  }

  // Aggregate all unlocked cosmetics up to current rank tier
  const unlockedCosmetics: CosmeticUnlock[] = [];
  for (const r of PILOT_RANKS) {
    if (r.tier <= currentRank.tier) {
      unlockedCosmetics.push(...r.cosmetics);
    }
  }

  // Compute Active Missions Progress
  const activeMissions = MISSIONS_ROSTER.map((m) => {
    const count = actionCounts[m.actionRequired] || 0;
    const currentProgress = Math.min(m.targetCount, count);
    const isCompleted = count >= m.targetCount;
    return {
      ...m,
      currentProgress,
      isCompleted,
    };
  });

  return {
    userId,
    totalXp,
    currentRank,
    nextRank,
    xpToNextRank,
    progressPercent,
    unlockedCosmetics,
    actionCounts,
    activeMissions,
  };
}

/**
 * Resets the in-memory event store (used in unit testing).
 */
export function clearInMemoryXpEvents(): void {
  inMemoryXpEvents.length = 0;
}
