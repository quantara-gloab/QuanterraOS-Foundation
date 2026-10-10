/**
 * QuanterraOS Flight Instructors & Human Process Coaching Engine
 *
 * Implements Master Blueprint v2 Part 3.8 & Part 4:
 * - Human coaches as process coaches (journal review, cost discipline, risk limits, calibration)
 * - Strict non-advisory boundary: zero trade recommendations, picks, sides, or sizing advice
 * - Client consent-gated Mission Log read-only console
 * - Session notes & homework mission assignments
 * - Coach "Do Not Advise" written policy flow and signature acknowledgment
 */

export type CoachFocusArea =
  | "journal-review"
  | "cost-discipline"
  | "risk-limits"
  | "calibration-practice"
  | "tool-mastery";

export interface CoachProfile {
  id: string;
  name: string;
  callsign: string;
  bio: string;
  specialty: string;
  policyAcknowledgedAt: string | null;
  policySignature: string | null;
  isCertified: boolean;
}

export interface CoachSessionBooking {
  bookingId: string;
  pilotUserId: string;
  pilotEmail: string;
  coachId: string;
  durationMinutes: 30 | 60;
  focusArea: CoachFocusArea;
  scheduledTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  clientAcknowledgedNonAdvisory: boolean;
  costUsd: number;
  isPlanIncluded: boolean;
  createdAt: string;
}

export interface ClientCoachConsent {
  pilotUserId: string;
  coachId: string;
  consentGranted: boolean;
  grantedAt: string;
  revokedAt?: string;
  allowedStations: ("mission-log" | "calibration" | "limits")[];
}

export interface CoachSessionNote {
  noteId: string;
  bookingId: string;
  coachId: string;
  pilotUserId: string;
  createdAt: string;
  processObservations: string;
  avoidableFeeObservations: string;
  assignedHomeworkMissions: string[];
  signedByCoach: boolean;
}

/**
 * Written Non-Advisory Policy for Human Flight Instructors (Part 3.8)
 */
export const COACH_DO_NOT_ADVISE_POLICY = {
  version: "2026-v2",
  title: "Flight Instructor Process Coaching Code of Conduct & Do-Not-Advise Policy",
  clauses: [
    "Clause 1 (Process Only): Coaches strictly evaluate trading process, post-trade journals, risk limits, and fee discipline. Coaches NEVER recommend specific contracts, markets, expiration windows, sides (YES/NO), or position sizes.",
    "Clause 2 (No Edge Claims): Coaches never state or imply that any strategy or forecasting methodology beats the market or guarantees positive returns. The public Brier calibration audit must be cited.",
    "Clause 3 (Consent & Privacy): Coaches access client Mission Logs strictly under active, explicit client consent in read-only mode. Client trade data is strictly confidential.",
    "Clause 4 (No Broker/Advisor Relationship): Coaching does not establish a Commodity Trading Advisor (CTA), broker-dealer, or investment advisor relationship. QuanterraOS enforces a permanent $0 live capital circuit breaker (Rule B5).",
    "Clause 5 (Immediate Revocation): Any violation of the non-advisory policy results in immediate termination of Flight Instructor credentials and platform expulsion.",
  ],
};

// Initial roster of certified flight instructors
export const CERTIFIED_INSTRUCTORS: CoachProfile[] = [
  {
    id: "coach_sarah_chen",
    name: "Commander Sarah Chen",
    callsign: "Vanguard",
    bio: "Former options market maker turned decision scientist. Specializes in non-linear taker fee audits and tilt recovery.",
    specialty: "Cost Discipline & Execution Hygiene",
    policyAcknowledgedAt: "2026-09-15T12:00:00Z",
    policySignature: "Sarah Chen, CTA-Compliant Process Coach",
    isCertified: true,
  },
  {
    id: "coach_marcus_vance",
    name: "Captain Marcus Vance",
    callsign: "Aegis",
    bio: "Quantitative risk modeler focusing on Murphy-decomposed Brier calibration, coin-flip avoidance, and position limits.",
    specialty: "Risk Limits & Calibration Debriefs",
    policyAcknowledgedAt: "2026-09-20T10:00:00Z",
    policySignature: "Marcus Vance, Certified Instructor",
    isCertified: true,
  },
];

// In-memory state stores
const CONSENTS_MAP = new Map<string, ClientCoachConsent>();
const BOOKINGS_STORE: CoachSessionBooking[] = [];
const SESSION_NOTES_STORE: CoachSessionNote[] = [];

function makeConsentKey(pilotUserId: string, coachId: string): string {
  return `${pilotUserId}::${coachId}`;
}

/**
 * Grant or revoke client consent for a coach to view their Mission Log.
 */
export function setClientCoachConsent(
  pilotUserId: string,
  coachId: string,
  consentGranted: boolean,
  allowedStations: ("mission-log" | "calibration" | "limits")[] = ["mission-log", "calibration"]
): ClientCoachConsent {
  const key = makeConsentKey(pilotUserId, coachId);
  const now = new Date().toISOString();

  const record: ClientCoachConsent = {
    pilotUserId,
    coachId,
    consentGranted,
    grantedAt: consentGranted ? now : CONSENTS_MAP.get(key)?.grantedAt || now,
    revokedAt: consentGranted ? undefined : now,
    allowedStations,
  };

  CONSENTS_MAP.set(key, record);
  return record;
}

/**
 * Checks if a coach has active consent to view a client's Mission Log.
 */
export function isCoachAccessGranted(pilotUserId: string, coachId: string): boolean {
  const record = CONSENTS_MAP.get(makeConsentKey(pilotUserId, coachId));
  return Boolean(record && record.consentGranted);
}

/**
 * Books a coaching session with mandatory non-advisory policy acknowledgment.
 */
export function bookCoachSession(input: {
  pilotUserId: string;
  pilotEmail: string;
  coachId: string;
  durationMinutes: 30 | 60;
  focusArea: CoachFocusArea;
  scheduledTime: string;
  clientAcknowledgedNonAdvisory: boolean;
  planId?: string;
}): { success: boolean; booking?: CoachSessionBooking; error?: string } {
  if (!input.pilotUserId || !input.coachId) {
    return { success: false, error: "Pilot ID and Coach ID are required." };
  }

  if (!input.clientAcknowledgedNonAdvisory) {
    return {
      success: false,
      error: "You must acknowledge that Flight Instructors teach process only and do not provide trade recommendations.",
    };
  }

  const coach = CERTIFIED_INSTRUCTORS.find((c) => c.id === input.coachId);
  if (!coach || !coach.isCertified) {
    return { success: false, error: "The selected Flight Instructor is not currently certified." };
  }

  // Check Commander plan perk: 1 session/month included
  const isCommander = input.planId === "commander" || input.planId === "desk";
  const costUsd = isCommander ? 0 : input.durationMinutes === 60 ? 149 : 89;

  const booking: CoachSessionBooking = {
    bookingId: "book_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
    pilotUserId: input.pilotUserId,
    pilotEmail: input.pilotEmail,
    coachId: input.coachId,
    durationMinutes: input.durationMinutes,
    focusArea: input.focusArea,
    scheduledTime: input.scheduledTime,
    status: "SCHEDULED",
    clientAcknowledgedNonAdvisory: true,
    costUsd,
    isPlanIncluded: isCommander,
    createdAt: new Date().toISOString(),
  };

  BOOKINGS_STORE.push(booking);
  return { success: true, booking };
}

/**
 * Records session debrief notes and assigns homework missions.
 */
export function recordCoachSessionNote(input: {
  bookingId: string;
  coachId: string;
  pilotUserId: string;
  processObservations: string;
  avoidableFeeObservations: string;
  assignedHomeworkMissions: string[];
}): { success: boolean; note?: CoachSessionNote; error?: string } {
  // Guardrail: verify coach has active consent
  if (!isCoachAccessGranted(input.pilotUserId, input.coachId)) {
    return {
      success: false,
      error: "ACCESS_DENIED: Client has not granted explicit read-only Mission Log access.",
    };
  }

  if (!input.processObservations || input.processObservations.trim().length < 10) {
    return {
      success: false,
      error: "Process observations must be at least 10 characters detailing disciplined execution.",
    };
  }

  const note: CoachSessionNote = {
    noteId: "note_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
    bookingId: input.bookingId,
    coachId: input.coachId,
    pilotUserId: input.pilotUserId,
    createdAt: new Date().toISOString(),
    processObservations: input.processObservations.trim(),
    avoidableFeeObservations: input.avoidableFeeObservations.trim(),
    assignedHomeworkMissions: input.assignedHomeworkMissions || [],
    signedByCoach: true,
  };

  SESSION_NOTES_STORE.push(note);
  return { success: true, note };
}

/**
 * Flight Instructor signs the mandatory "Do Not Advise" policy agreement.
 */
export function acknowledgeCoachPolicy(coachId: string, signatureText: string): boolean {
  const coach = CERTIFIED_INSTRUCTORS.find((c) => c.id === coachId);
  if (!coach || !signatureText || signatureText.trim().length < 3) {
    return false;
  }

  coach.policyAcknowledgedAt = new Date().toISOString();
  coach.policySignature = signatureText.trim();
  coach.isCertified = true;
  return true;
}

/**
 * Retrieves client Mission Log data for a coach, strictly enforcing consent gate.
 */
export function getClientJournalForCoach(coachId: string, pilotUserId: string): {
  authorized: boolean;
  reason?: string;
  clientTelemetry?: {
    pilotUserId: string;
    brierScore: number;
    disciplineScorePct: number;
    avoidableFeesPaidUsd: number;
    loggedTradesCount: number;
  };
} {
  if (!isCoachAccessGranted(pilotUserId, coachId)) {
    return {
      authorized: false,
      reason: "CONSENT_REQUIRED: Pilot has not granted explicit consent to view Mission Log records.",
    };
  }

  return {
    authorized: true,
    clientTelemetry: {
      pilotUserId,
      brierScore: 0.2085,
      disciplineScorePct: 82.5,
      avoidableFeesPaidUsd: 14.50,
      loggedTradesCount: 18,
    },
  };
}

export function getAllBookings(): CoachSessionBooking[] {
  return [...BOOKINGS_STORE];
}

export function getAllSessionNotes(): CoachSessionNote[] {
  return [...SESSION_NOTES_STORE];
}
