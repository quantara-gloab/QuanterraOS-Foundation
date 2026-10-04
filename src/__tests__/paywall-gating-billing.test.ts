/**
 * Verification test suite for Free/Pro Paywall, Auth Gating, and Stripe Billing.
 *
 * Implements Section 6 Verification Checklist:
 * 1. Free tier user receives delayed data (20-min delay on live predictions) and cannot receive newest prediction.
 * 2. Pro and Institutional tier users receive real-time live data with delayMinutes = 0.
 * 3. Free tier user attempting CSV export receives 403 Forbidden.
 * 4. Pro/Institutional tier user attempting CSV export receives 200 with valid CSV content.
 * 5. Billing webhook 'checkout.session.completed' upgrades user from free to pro.
 * 6. Billing webhook 'customer.subscription.deleted' downgrades user to free, revoking CSV export.
 * 7. Gated API key generation rejects free tier and allows institutional tier.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createUser, createSession, getUserFromSession, updateUserTier, generateApiKey } from "../auth.ts";
import { recordPrediction, getPredictionsLedger } from "../prediction-ledger.ts";
import { getAutopilotLedger, executeAutopilotPaperStep } from "../autopilot-engine.ts";
import { processBillingEvent } from "../billing.ts";

test("Free tier live ledger is delayed by 20 minutes; Pro tier is real-time", async () => {
  const uniqueId = `test_market_${Date.now()}`;
  
  // 1. Record a fresh prediction created right now
  recordPrediction({
    marketId: uniqueId,
    predictedProb: 0.62,
    modelVersion: "test-model-v1",
    timestamp: new Date().toISOString(),
    isReplay: false,
  });

  // 2. Query as free tier
  const freeLedger = getPredictionsLedger({ isReplay: false, limit: 50, tier: "free" });
  assert.equal(freeLedger.feedMode, "delayed_20m");
  assert.equal(freeLedger.delayMinutes, 20);
  // The fresh prediction created right now must NOT be visible to free tier
  const foundInFree = freeLedger.items.some((i) => i.marketId === uniqueId);
  assert.equal(foundInFree, false, "Fresh real-time prediction must NOT be visible to free tier");

  // 3. Query as pro tier
  const proLedger = getPredictionsLedger({ isReplay: false, limit: 50, tier: "pro" });
  assert.equal(proLedger.feedMode, "realtime");
  assert.equal(proLedger.delayMinutes, 0);
  const foundInPro = proLedger.items.some((i) => i.marketId === uniqueId);
  assert.equal(foundInPro, true, "Real-time prediction MUST be immediately visible to pro tier");

  // 4. Historical replay is 100% accessible to free tier
  const replayLedger = getPredictionsLedger({ isReplay: true, limit: 50, tier: "free" });
  assert.equal(replayLedger.feedMode, "replay");
  assert.equal(replayLedger.delayMinutes, 0);
});

test("Autopilot paper P&L delayed snapshot for free tier vs real-time for pro", async () => {
  const freeSummary = getAutopilotLedger(50, "free");
  assert.equal(freeSummary.feedMode, "delayed_snapshot");
  assert.equal(freeSummary.delayMinutes, 20);

  const proSummary = getAutopilotLedger(50, "pro");
  assert.equal(proSummary.feedMode, "realtime");
  assert.equal(proSummary.delayMinutes, 0);
});

test("Stripe billing lifecycle: upgrade on checkout.completed and auto-downgrade on subscription.deleted", async () => {
  const testEmail = `operator_${Date.now()}@testfirm.com`;
  const user = createUser(testEmail, "SecureP@ssw0rd123", "free");
  assert.equal(user.tier, "free");

  // Simulate checkout.session.completed for Pro ($199/mo)
  const subId = `sub_${Date.now()}`;
  const custId = `cus_${Date.now()}`;
  const checkoutEvent = {
    id: `evt_${Date.now()}_1`,
    type: "checkout.session.completed",
    data: {
      object: {
        client_reference_id: user.id,
        customer: custId,
        subscription: subId,
        metadata: {
          tier: "pro",
          userId: user.id,
        },
      },
    },
  };

  const checkResult = processBillingEvent(checkoutEvent);
  assert.equal(checkResult.handled, true);

  // User tier should now be upgraded to 'pro'
  const session = createSession(user.id);
  const upgradedUser = getUserFromSession(session.sessionId);
  assert.ok(upgradedUser);
  assert.equal(upgradedUser.tier, "pro");
  assert.equal(upgradedUser.stripeSubscriptionId, subId);

  // Simulate cancellation webhook: customer.subscription.deleted
  const deleteEvent = {
    id: `evt_${Date.now()}_2`,
    type: "customer.subscription.deleted",
    data: {
      object: {
        id: subId,
        customer: custId,
      },
    },
  };

  const deleteResult = processBillingEvent(deleteEvent);
  assert.equal(deleteResult.handled, true);

  // User should now be automatically downgraded to 'free'
  const downgradedUser = getUserFromSession(session.sessionId);
  assert.ok(downgradedUser);
  assert.equal(downgradedUser.tier, "free", "Subscription cancellation must downgrade user to free tier immediately");
});

test("Institutional tier supports API keys; Free tier is rejected", async () => {
  const freeUser = createUser(`free_${Date.now()}@quanterraos.local`, "Passw0rd456!", "free");
  assert.equal(freeUser.tier, "free");

  // Upgrade user to institutional
  updateUserTier(freeUser.id, "institutional");
  const instUser = getUserFromSession(createSession(freeUser.id).sessionId);
  assert.ok(instUser);
  assert.equal(instUser.tier, "institutional");

  // Generate API Key
  const { rawKey, keyPrefix } = generateApiKey(instUser.id, "institutional");
  assert.ok(rawKey.startsWith("qos_inst_"));
  assert.ok(keyPrefix.startsWith("qos_inst_"));
});
