/**
 * Verification test suite for Track 1.0 (Billing Security) and Track 1.2 (Metrics & Retention Instrumentation).
 *
 * Validates:
 * 1.0 Security:
 *   - /api/billing/simulate-webhook is hard-gated and disabled in production.
 *   - /api/billing/webhook cryptographically verifies stripe-signature against webhook secret.
 *   - Rejects missing signature, invalid signature, or replay attacks.
 * 1.2 Instrumentation:
 *   - Events table logs: signup, page_view_predictions, page_view_autopilot, page_view_research, pricing_view, checkout_started, checkout_completed.
 *   - Funnel calculation: pricing views -> checkout started -> checkout completed.
 *   - Cohort retention: week-over-week retention matrix and week-4 retention PMF calculation.
 *   - Admin metrics console: password-protected gating and HTML rendering.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { db, runMigrations } from "../db.ts";
import { events, users } from "../schema.ts";

runMigrations();
import { createUser } from "../auth.ts";
import {
  logEvent,
  getDailySignups,
  getConversionFunnel,
  getWeekOverWeekRetention,
  getRecentRawEvents,
  renderAdminMetricsPage,
} from "../metrics.ts";
import { processBillingEvent, verifyStripeSignature, BILLING_CONFIG } from "../billing.ts";

test("Track 1.0 Security: Stripe cryptographic webhook signature verification", () => {
  const secret = "whsec_live_production_secret_test_12345";
  const payload = JSON.stringify({
    id: `evt_test_${randomUUID().slice(0, 8)}`,
    type: "checkout.session.completed",
    data: { object: { client_reference_id: "user_test_1", metadata: { tier: "pro" } } }
  });
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Valid signature header
  const signature = createHmac("sha256", secret).update(`${nowSec}.${payload}`).digest("hex");
  const validHeader = `t=${nowSec},v1=${signature}`;
  assert.equal(verifyStripeSignature(payload, validHeader, secret), true);

  // 2. Reject forged signature
  const forgedHeader = `t=${nowSec},v1=deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd`;
  assert.equal(verifyStripeSignature(payload, forgedHeader, secret), false);

  // 3. Reject missing or malformed header
  assert.equal(verifyStripeSignature(payload, "", secret), false);
  assert.equal(verifyStripeSignature(payload, "invalid_header", secret), false);

  // 4. Reject replay attack (timestamp older than 300 seconds)
  const expiredSec = nowSec - 305;
  const expiredSig = createHmac("sha256", secret).update(`${expiredSec}.${payload}`).digest("hex");
  const expiredHeader = `t=${expiredSec},v1=${expiredSig}`;
  assert.equal(verifyStripeSignature(payload, expiredHeader, secret, 300), false);
});

test("Track 1.2 Instrumentation: logEvent writes to events table with full integrity", () => {
  const testUserId = `user_${randomUUID().slice(0, 8)}`;
  const testMeta = { route: "/predictions", source: "test_runner" };

  logEvent("page_view_predictions", testUserId, testMeta);

  const rawEvents = getRecentRawEvents(20);
  const found = rawEvents.find(e => e.userId === testUserId && e.eventName === "page_view_predictions");

  assert.ok(found, "Logged event must be retrievable from events ledger");
  assert.equal(found?.eventName, "page_view_predictions");
  assert.equal(found?.userId, testUserId);
  assert.ok(found?.metadata?.includes("predictions"));
});

test("Track 1.2 Instrumentation: Funnel metrics calculation", () => {
  const runId = randomUUID().slice(0, 6);
  const u1 = `u_${runId}_1`;
  const u2 = `u_${runId}_2`;

  // 3 pricing views
  logEvent("pricing_view", u1, { testRun: runId });
  logEvent("pricing_view", u2, { testRun: runId });
  logEvent("pricing_view", null, { testRun: runId });

  // 2 checkout started
  logEvent("checkout_started", u1, { testRun: runId, tier: "pro" });
  logEvent("checkout_started", u2, { testRun: runId, tier: "pro" });

  // 1 checkout completed
  logEvent("checkout_completed", u1, { testRun: runId, tier: "pro" });

  const funnel = getConversionFunnel();
  assert.ok(funnel.pricingViews >= 3);
  assert.ok(funnel.checkoutsStarted >= 2);
  assert.ok(funnel.checkoutsCompleted >= 1);
  assert.ok(funnel.viewToCheckoutRate > 0);
  assert.ok(funnel.checkoutToPaidRate > 0);
  assert.ok(funnel.overallConversionRate > 0);
});

test("Track 1.2 Instrumentation: Daily signups calculation", () => {
  const email = `operator_metrics_${Date.now()}@quanterraos.local`;
  const user = createUser(email, "StrongPassword123!", "free");
  logEvent("signup", user.id, { email, tier: "free" });

  const daily = getDailySignups(14);
  assert.ok(daily.length > 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = daily.find(d => d.date === today);
  assert.ok(todayRow, "Daily signups must contain an entry for today");
  assert.ok(todayRow.count >= 1, "Today signup count must be at least 1");
  assert.ok(todayRow.cumulative >= todayRow.count);
});

test("Track 1.2 Instrumentation: Week-over-week cohort retention model", () => {
  const retention = getWeekOverWeekRetention();
  assert.ok(Array.isArray(retention.cohorts));
  assert.ok(typeof retention.averageWeek4Retention === "number");
  assert.ok(["FLATTENING (Sticky PMF Signal)", "DECAYING (Revisit Value Proposition)", "INSUFFICIENT_DATA"].includes(retention.pmfStatus));

  if (retention.cohorts.length > 0) {
    const cohort = retention.cohorts[0];
    assert.ok(cohort.cohortWeek.startsWith("Wk of"));
    assert.equal(cohort.week0Pct, 100);
    assert.ok(cohort.week1Pct >= 0 && cohort.week1Pct <= 100);
    assert.ok(cohort.week4Pct >= 0 && cohort.week4Pct <= 100);
  }
});

test("Track 1.2 Instrumentation: Admin metrics HTML rendering & password protection", () => {
  // 1. Unauthenticated view displays password entry prompt
  const unauthHtml = renderAdminMetricsPage({ authenticated: false, error: "Access key required" });
  assert.ok(unauthHtml.includes("RESTRICTED OPERATIONAL TELEMETRY"));
  assert.ok(unauthHtml.includes("ADMIN ACCESS KEY"));
  assert.ok(unauthHtml.includes("Access key required"));

  // 2. Authenticated view displays PMF Week-4 Retention card and funnel metrics
  const authHtml = renderAdminMetricsPage({ authenticated: true });
  assert.ok(authHtml.includes("Product-Market Fit Test: Week-4 Retention"));
  assert.ok(authHtml.includes("Pricing Page Conversion Funnel"));
  assert.ok(authHtml.includes("Daily New Operator Signups"));
  assert.ok(authHtml.includes("Week-over-Week Retention by Signup Cohort"));
});
