import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CERTIFIED_INSTRUCTORS,
  COACH_DO_NOT_ADVISE_POLICY,
  setClientCoachConsent,
  isCoachAccessGranted,
  bookCoachSession,
  recordCoachSessionNote,
  acknowledgeCoachPolicy,
  getClientJournalForCoach,
  getAllBookings,
} from "../lib/flight-instructor.ts";
import {
  renderCoachBookingPageHtml,
  renderCoachConsolePageHtml,
} from "../coach-console-page.ts";

describe("Phase 7 Task 7.7 Acceptance: Flight Instructors, Booking Flow & Consent-Gated Coach Console", () => {
  const testPilotId = "pilot_test_8472";
  const testCoachId = "coach_sarah_chen";

  describe("1. Coach Roster & 'Do Not Advise' Policy Framework (Part 3.8)", () => {
    it("roster includes certified coaches with specialties and signatures", () => {
      assert.ok(CERTIFIED_INSTRUCTORS.length >= 2, "Must contain certified coach roster");
      const sarah = CERTIFIED_INSTRUCTORS.find((c) => c.id === "coach_sarah_chen");
      assert.ok(sarah, "Must include Commander Sarah Chen");
      assert.equal(sarah.isCertified, true);
      assert.ok(sarah.specialty.includes("Cost Discipline"));

      const marcus = CERTIFIED_INSTRUCTORS.find((c) => c.id === "coach_marcus_vance");
      assert.ok(marcus, "Must include Captain Marcus Vance");
      assert.equal(marcus.isCertified, true);
    });

    it("enforces all five clauses of the mandatory non-advisory policy", () => {
      assert.equal(COACH_DO_NOT_ADVISE_POLICY.clauses.length, 5);
      const allClauses = COACH_DO_NOT_ADVISE_POLICY.clauses.join(" ");
      assert.ok(allClauses.includes("Process Only"));
      assert.ok(allClauses.includes("NEVER recommend specific contracts"));
      assert.ok(allClauses.includes("No Edge Claims"));
      assert.ok(allClauses.includes("Consent & Privacy"));
      assert.ok(allClauses.includes("Rule B5"));
      assert.ok(allClauses.includes("Immediate Revocation"));
    });

    it("records coach signature on policy acknowledgment", () => {
      const ackResult = acknowledgeCoachPolicy("coach_sarah_chen", "Commander Sarah Chen, Verified");
      assert.equal(ackResult, true);
      const coach = CERTIFIED_INSTRUCTORS.find((c) => c.id === "coach_sarah_chen");
      assert.equal(coach?.policySignature, "Commander Sarah Chen, Verified");
      assert.ok(coach?.policyAcknowledgedAt);
    });
  });

  describe("2. Consent-Gating Mechanism for Client Mission Logs", () => {
    it("denies coach access when consent has not been granted", () => {
      setClientCoachConsent(testPilotId, testCoachId, false);
      assert.equal(isCoachAccessGranted(testPilotId, testCoachId), false);

      const journalRes = getClientJournalForCoach(testCoachId, testPilotId);
      assert.equal(journalRes.authorized, false);
      assert.ok(journalRes.reason?.includes("CONSENT_REQUIRED"));

      // Note recording should fail if consent is not granted
      const noteRes = recordCoachSessionNote({
        bookingId: "book_test_1",
        coachId: testCoachId,
        pilotUserId: testPilotId,
        processObservations: "Great thesis adherence and pre-flight check routine.",
        avoidableFeeObservations: "Saved $8.50 by utilizing maker limit orders.",
        assignedHomeworkMissions: ["Complete 3 pre-flight checks"],
      });
      assert.equal(noteRes.success, false);
      assert.ok(noteRes.error?.includes("ACCESS_DENIED"));
    });

    it("grants read-only access and permits debrief note recording when consent is active", () => {
      setClientCoachConsent(testPilotId, testCoachId, true, ["mission-log", "calibration"]);
      assert.equal(isCoachAccessGranted(testPilotId, testCoachId), true);

      const journalRes = getClientJournalForCoach(testCoachId, testPilotId);
      assert.equal(journalRes.authorized, true);
      assert.ok(journalRes.clientTelemetry);
      assert.equal(journalRes.clientTelemetry.pilotUserId, testPilotId);

      const noteRes = recordCoachSessionNote({
        bookingId: "book_test_1",
        coachId: testCoachId,
        pilotUserId: testPilotId,
        processObservations: "Outstanding execution discipline. Respects tilt cooldowns.",
        avoidableFeeObservations: "Avoided coin-flip hazard zone in 90% of trades.",
        assignedHomeworkMissions: ["Run pre-flight check before entry"],
      });
      assert.equal(noteRes.success, true);
      assert.ok(noteRes.note);
      assert.equal(noteRes.note.signedByCoach, true);
    });
  });

  describe("3. Session Booking & Non-Advisory Client Gate", () => {
    it("books session with Commander tier inclusion perk ($0)", () => {
      const res = bookCoachSession({
        pilotUserId: testPilotId,
        pilotEmail: "pilot@commander.com",
        coachId: testCoachId,
        durationMinutes: 60,
        focusArea: "cost-discipline",
        scheduledTime: "2026-10-15T15:00:00Z",
        clientAcknowledgedNonAdvisory: true,
        planId: "commander",
      });

      assert.equal(res.success, true);
      assert.ok(res.booking);
      assert.equal(res.booking.costUsd, 0, "Commander includes 1 session/month");
      assert.equal(res.booking.isPlanIncluded, true);
      assert.equal(res.booking.clientAcknowledgedNonAdvisory, true);
    });

    it("books session as paid add-on for Cadet tier ($149 for 60 min, $89 for 30 min)", () => {
      const res60 = bookCoachSession({
        pilotUserId: testPilotId,
        pilotEmail: "pilot@cadet.com",
        coachId: testCoachId,
        durationMinutes: 60,
        focusArea: "journal-review",
        scheduledTime: "2026-10-16T15:00:00Z",
        clientAcknowledgedNonAdvisory: true,
        planId: "cadet",
      });
      assert.equal(res60.success, true);
      assert.equal(res60.booking?.costUsd, 149);

      const res30 = bookCoachSession({
        pilotUserId: testPilotId,
        pilotEmail: "pilot@cadet.com",
        coachId: testCoachId,
        durationMinutes: 30,
        focusArea: "risk-limits",
        scheduledTime: "2026-10-17T15:00:00Z",
        clientAcknowledgedNonAdvisory: true,
        planId: "cadet",
      });
      assert.equal(res30.success, true);
      assert.equal(res30.booking?.costUsd, 89);
    });

    it("strictly blocks booking if client refuses non-advisory acknowledgment", () => {
      const res = bookCoachSession({
        pilotUserId: testPilotId,
        pilotEmail: "pilot@cadet.com",
        coachId: testCoachId,
        durationMinutes: 60,
        focusArea: "journal-review",
        scheduledTime: "2026-10-18T15:00:00Z",
        clientAcknowledgedNonAdvisory: false,
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes("acknowledge"));
    });
  });

  describe("4. HTML UI Rendering Integrity (/book-coach & /coach console)", () => {
    it("renders booking portal with coach roster, duration picker, and non-advisory checkbox", () => {
      const html = renderCoachBookingPageHtml("commander");
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("Certified Flight Instructors"));
      assert.ok(html.includes("Commander Sarah Chen"));
      assert.ok(html.includes("Captain Marcus Vance"));
      assert.ok(html.includes("1 Monthly Session Included (Commander Desk)"));
      assert.ok(html.includes("chk-non-advisory"));
      assert.ok(html.includes("Mandatory Non-Advisory Acknowledgment"));
      assert.ok(html.includes("btn-submit-booking"));
    });

    it("renders Coach Console with certification banner, client roster, and gated overlay", () => {
      const html = renderCoachConsolePageHtml("coach_sarah_chen");
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("Flight Instructor Console"));
      assert.ok(html.includes("CERTIFIED PROCESS COACH"));
      assert.ok(html.includes("Strict Non-Advisory Protocol Active"));
      assert.ok(html.includes("Active Assigned Pilots"));
      assert.ok(html.includes("locked-overlay"));
      assert.ok(html.includes("Mission Log Read-Only Access Gated"));
      assert.ok(html.includes("Process &amp; Hygiene Observations"));
      assert.ok(html.includes("Avoidable Fee Observations"));
      assert.ok(html.includes("Save Debrief Notes &amp; Assign Homework Missions"));
    });

    it("strictly enforces Rule B4 (no edge/profit claims) and Rule B5 ($0 live capital)", () => {
      const bookingHtml = renderCoachBookingPageHtml();
      const consoleHtml = renderCoachConsolePageHtml();
      const combinedLower = (bookingHtml + consoleHtml).toLowerCase();

      assert.strictEqual(combinedLower.includes("guaranteed profit"), false);
      assert.strictEqual(combinedLower.includes("beat the market"), false);
      assert.strictEqual(combinedLower.includes("alpha generation"), false);

      assert.ok(bookingHtml.includes("LOCKED_RULE_B5 ($0.00 CAPITAL RISK)"));
      assert.ok(bookingHtml.includes("process educators, not registered Commodity Trading Advisors"));
    });
  });
});
