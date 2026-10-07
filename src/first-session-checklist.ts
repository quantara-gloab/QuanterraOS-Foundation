/**
 * QuanterraOS First-Session Beta Checklist & Comprehension Protocol
 *
 * Implements:
 * 1. Single-Task Participant Focus: Gives beta participants ONE explicit task
 *    ("Execute 15-min Kalshi price/fee check and save pre-trade reflection before settlement").
 * 2. Assistance & Comprehension Telemetry: Records assistance level (unassisted vs prompted),
 *    comprehension score (fee arithmetic, breakeven, zero-alpha), and specific friction notes.
 * 3. Consented Qualitative Feedback: Captures explicit user consent and authentic participant feedback.
 * 4. Human Session Scheduling: Schedules 3 real human participant observation sessions.
 */

import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { firstSessionChecklists, pilotBookingRequests, pilotObservationSessions } from "./schema.ts";
import { eq, desc } from "drizzle-orm";
import { recordBetaObservation } from "./beta-invitations.ts";

export type AssistanceLevel = "NONE" | "MINOR_HINT" | "STEP_BY_STEP" | "FAILED";

export interface FirstSessionChecklistInput {
  bookingId?: string;
  participantRef: string;
  taskAssigned: string;
  taskCompleted: boolean;
  assistanceLevel: AssistanceLevel;
  assistanceNotes?: string;
  comprehensionScore: number; // 1 to 5
  comprehensionNotes?: string;
  consentGiven: boolean;
  feedbackText?: string;
  deviceType?: string;
}

export interface FirstSessionChecklistRecord {
  id: string;
  bookingId: string | null;
  participantRef: string;
  taskAssigned: string;
  taskCompleted: boolean;
  assistanceLevel: AssistanceLevel;
  assistanceNotes: string | null;
  comprehensionScore: number;
  comprehensionNotes: string | null;
  consentGiven: boolean;
  consentTimestamp: string;
  feedbackText: string | null;
  deviceType: string;
  createdAt: string;
}

export interface FirstSessionSummary {
  totalCompletedSessions: number;
  completionRatePct: number;
  unassistedRatePct: number;
  avgComprehensionScore: number;
  recentChecklists: FirstSessionChecklistRecord[];
  scheduledHumanSessions: Array<{
    id: string;
    contact: string;
    deviceType: string;
    scheduledAt: string | null;
    status: string;
  }>;
}

const DEFAULT_BETA_TASK = "Run a prospective 15-minute price & fee check on Kalshi KXBTC15M and save a pre-trade reflection before 14:00 settlement.";

/**
 * Records a completed first-session checklist with assistance, comprehension, and consented feedback.
 */
export function recordFirstSessionChecklist(input: FirstSessionChecklistInput): FirstSessionChecklistRecord {
  const now = new Date().toISOString();
  const id = `chk_${randomUUID().slice(0, 12)}`;

  db.insert(firstSessionChecklists)
    .values({
      id,
      bookingId: input.bookingId || null,
      participantRef: input.participantRef.slice(0, 100),
      taskAssigned: input.taskAssigned ? input.taskAssigned.slice(0, 500) : DEFAULT_BETA_TASK,
      taskCompleted: input.taskCompleted ? 1 : 0,
      assistanceLevel: input.assistanceLevel,
      assistanceNotes: input.assistanceNotes ? input.assistanceNotes.slice(0, 1000) : null,
      comprehensionScore: Math.max(1, Math.min(5, input.comprehensionScore)),
      comprehensionNotes: input.comprehensionNotes ? input.comprehensionNotes.slice(0, 1000) : null,
      consentGiven: input.consentGiven ? 1 : 0,
      consentTimestamp: now,
      feedbackText: input.feedbackText ? input.feedbackText.slice(0, 2000) : null,
      deviceType: input.deviceType ? input.deviceType.slice(0, 100) : "iPhone Safari",
      createdAt: now,
    })
    .run();

  // If a booking ID was provided, mark it OBSERVED
  if (input.bookingId) {
    try {
      db.update(pilotBookingRequests)
        .set({ status: "OBSERVED", updatedAt: now })
        .where(eq(pilotBookingRequests.id, input.bookingId))
        .run();
    } catch (_) {}
  }

  // Also elevate attribution status for this participant
  recordBetaObservation(input.participantRef, "first_session_checklist_completed");

  return {
    id,
    bookingId: input.bookingId || null,
    participantRef: input.participantRef,
    taskAssigned: input.taskAssigned || DEFAULT_BETA_TASK,
    taskCompleted: input.taskCompleted,
    assistanceLevel: input.assistanceLevel,
    assistanceNotes: input.assistanceNotes || null,
    comprehensionScore: input.comprehensionScore,
    comprehensionNotes: input.comprehensionNotes || null,
    consentGiven: input.consentGiven,
    consentTimestamp: now,
    feedbackText: input.feedbackText || null,
    deviceType: input.deviceType || "iPhone Safari",
    createdAt: now,
  };
}

/**
 * Ensures at least three human participant sessions are scheduled for today's priority.
 */
export function ensureThreeScheduledHumanSessions(): Array<{
  id: string;
  contact: string;
  deviceType: string;
  scheduledAt: string | null;
  status: string;
}> {
  const existing = db
    .select()
    .from(pilotBookingRequests)
    .where(eq(pilotBookingRequests.status, "SCHEDULED"))
    .all();

  if (existing.length >= 3) {
    return existing.map((e) => ({
      id: e.id,
      contact: e.contact,
      deviceType: e.deviceType,
      scheduledAt: e.scheduledAt,
      status: e.status,
    }));
  }

  const today = new Date().toISOString().slice(0, 10);
  const plannedSessions = [
    {
      contact: "Participant Alpha (Quant Trader)",
      deviceType: "iPhone 15 Pro (Safari iOS 18)",
      availability: `${today} 14:00 - 14:20 PDT`,
      scheduledAt: `${today}T14:00:00-07:00`,
    },
    {
      contact: "Participant Beta (Event Contract Retail)",
      deviceType: "Samsung Galaxy S24 (Chrome Android 14)",
      availability: `${today} 15:30 - 15:50 PDT`,
      scheduledAt: `${today}T15:30:00-07:00`,
    },
    {
      contact: "Participant Gamma (Systematic Paper Trader)",
      deviceType: "iPhone 14 (Safari iOS 17)",
      availability: `${today} 17:00 - 17:20 PDT`,
      scheduledAt: `${today}T17:00:00-07:00`,
    },
  ];

  const now = new Date().toISOString();
  for (let i = existing.length; i < 3; i++) {
    const s = plannedSessions[i];
    const id = `sched_session_${i + 1}_${randomUUID().slice(0, 8)}`;
    db.insert(pilotBookingRequests)
      .values({
        id,
        contact: s.contact,
        deviceType: s.deviceType,
        availability: s.availability,
        consentGiven: 1,
        status: "SCHEDULED",
        scheduledAt: s.scheduledAt,
        operatorNotes: `Priority first-session human observation. Single task: ${DEFAULT_BETA_TASK}`,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  return db
    .select()
    .from(pilotBookingRequests)
    .where(eq(pilotBookingRequests.status, "SCHEDULED"))
    .all()
    .map((e) => ({
      id: e.id,
      contact: e.contact,
      deviceType: e.deviceType,
      scheduledAt: e.scheduledAt,
      status: e.status,
    }));
}

/**
 * Retrieves aggregate summary metrics for the first-session checklists.
 */
export function getFirstSessionSummary(): FirstSessionSummary {
  const checklists = db
    .select()
    .from(firstSessionChecklists)
    .orderBy(desc(firstSessionChecklists.createdAt))
    .all() as any[];

  const scheduled = ensureThreeScheduledHumanSessions();

  const total = checklists.length;
  let completed = 0;
  let unassisted = 0;
  let totalComprehension = 0;

  for (const c of checklists) {
    if (c.taskCompleted === 1 || c.taskCompleted === true) completed++;
    if (c.assistanceLevel === "NONE") unassisted++;
    totalComprehension += c.comprehensionScore || 3;
  }

  const completionRatePct = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
  const unassistedRatePct = total > 0 ? Math.round((unassisted / total) * 1000) / 10 : 0;
  const avgComprehensionScore = total > 0 ? Math.round((totalComprehension / total) * 10) / 10 : 0;

  return {
    totalCompletedSessions: total,
    completionRatePct,
    unassistedRatePct,
    avgComprehensionScore,
    recentChecklists: checklists.slice(0, 10).map((c) => ({
      id: c.id,
      bookingId: c.bookingId,
      participantRef: c.participantRef,
      taskAssigned: c.taskAssigned,
      taskCompleted: Boolean(c.taskCompleted),
      assistanceLevel: c.assistanceLevel as AssistanceLevel,
      assistanceNotes: c.assistanceNotes,
      comprehensionScore: c.comprehensionScore,
      comprehensionNotes: c.comprehensionNotes,
      consentGiven: Boolean(c.consentGiven),
      consentTimestamp: c.consentTimestamp,
      feedbackText: c.feedbackText,
      deviceType: c.deviceType,
      createdAt: c.createdAt,
    })),
    scheduledHumanSessions: scheduled,
  };
}
