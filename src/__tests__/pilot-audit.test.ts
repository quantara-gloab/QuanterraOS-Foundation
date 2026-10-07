import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runMigrations, db } from "../db.ts";

runMigrations();

import { pilotObservationSessions, events } from "../schema.ts";
import { eq, desc } from "drizzle-orm";
import { renderPilotAuditPageHtml } from "../pilot-audit-page.ts";

describe("Pilot Audit Console & Session Intake Infrastructure", () => {
  it("persists authentic participant observation session into database", () => {
    const testId = `test_ps_${Date.now()}`;
    const testRef = `P-TEST-${Date.now().toString().slice(-4)}`;

    db.insert(pilotObservationSessions)
      .values({
        id: testId,
        participantRef: testRef,
        channel: "Crypto Prediction Discord",
        device: "iPhone 16 Safari",
        durationMinutes: 2.25,
        unassisted: "YES",
        assistanceDetails: null,
        persistenceStatus: "VERIFIED",
        confusionNotes: "Brief pause reading Kalshi round-up fee note",
        comprehensionCostFee: "Purchase cost $5.10, fee $0.18, max loss $5.28",
        comprehensionBreakeven: "Breakeven is 52.8% because of exchange fee hurdle",
        comprehensionZeroAlpha: "Confirmed no guarantee or market beating edge",
        operatorNotes: "Flawless unassisted execution",
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
      })
      .run();

    const retrieved = db
      .select()
      .from(pilotObservationSessions)
      .where(eq(pilotObservationSessions.id, testId))
      .all();

    assert.strictEqual(retrieved.length, 1);
    assert.strictEqual(retrieved[0].participantRef, testRef);
    assert.strictEqual(retrieved[0].unassisted, "YES");
    assert.strictEqual(retrieved[0].persistenceStatus, "VERIFIED");
    assert.strictEqual(retrieved[0].durationMinutes, 2.25);
  });

  it("renders pilot audit console HTML with required intake controls and segregation banners", () => {
    const html = renderPilotAuditPageHtml({
      customerFunnel: {
        checks_completed: 0,
        signups: 0,
        checks_saved: 0,
        journal_views: 0,
        journal_exports: 0,
      },
      internalFunnel: {
        checks_completed: 12,
        signups: 4,
        checks_saved: 8,
        journal_views: 15,
        journal_exports: 2,
      },
      recentJournalEntries: [],
      recordedSessions: [
        {
          id: "ps_rec_01",
          participantRef: "P-01",
          channel: "Discord",
          device: "Safari",
          durationMinutes: 2.1,
          unassisted: "YES",
          persistenceStatus: "VERIFIED",
          status: "COMPLETED",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    // Check title and headers
    assert.ok(html.includes("Usability Pilot Observation &amp; Audit Console"));
    assert.ok(html.includes("Customer Funnel (Real Participants)"));
    assert.ok(html.includes("Internal / Engineering Test Runs"));

    // Check observation intake form controls
    assert.ok(html.includes('id="obs-id"'));
    assert.ok(html.includes('id="obs-channel"'));
    assert.ok(html.includes('id="obs-device"'));
    assert.ok(html.includes('id="obs-duration"'));
    assert.ok(html.includes('id="obs-unassisted"'));
    assert.ok(html.includes('id="obs-persistence"'));
    assert.ok(html.includes('id="obs-comprehension"'));

    // Check API sync hook and export action
    assert.ok(html.includes("/api/audit/pilot/session"));
    assert.ok(html.includes("/api/audit/pilot/export"));
  });
});
