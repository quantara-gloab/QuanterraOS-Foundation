import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasFeature,
  isPlanEligible,
  getPlanQuota,
  renderPaywallNoticeHtml,
  requireFeatureGate,
  PLAN_FEATURES,
  type Plan,
  type Feature,
} from "../plan.ts";
import { PRICING_PLANS } from "../config/pricing.ts";

describe("Phase 7 Task 7.1 Acceptance: Clerk Billing Plans + Gates (Part 4)", () => {
  describe("Plan Alignment with Single Source of Truth (Part 4 / pricing.ts)", () => {
    it("supports all five Part 4 Clerk Billing plans", () => {
      const planIds = PRICING_PLANS.map(p => p.id);
      assert.deepEqual(planIds.sort(), ["builder", "cadet", "commander", "institutional", "pilot"].sort());
    });

    it("verifies Cadet ($0) features & gates", () => {
      // Cadet has 0 paid features
      assert.equal(hasFeature("cadet", "radar:realtime"), false);
      assert.equal(hasFeature("cadet", "shadow:mode"), false);
      assert.equal(hasFeature("cadet", "scanner:cross-venue"), false);
      assert.equal(hasFeature("cadet", "api:mcp-developer"), false);

      const quota = getPlanQuota("cadet");
      assert.equal(quota.monthlyApiRequests, 1000);
      assert.equal(quota.webSocketAccess, false);
      assert.equal(quota.shadowModeEnabled, false);
    });

    it("verifies Pilot ($39/mo) unlocks all core flight deck features", () => {
      assert.equal(hasFeature("pilot", "radar:realtime"), true);
      assert.equal(hasFeature("pilot", "saver:true-cost"), true);
      assert.equal(hasFeature("pilot", "rounding:optimizer"), true);
      assert.equal(hasFeature("pilot", "journal:cloud"), true);
      assert.equal(hasFeature("pilot", "csv:kalshi-import"), true);
      assert.equal(hasFeature("pilot", "shadow:mode"), true);
      assert.equal(hasFeature("pilot", "crew:full"), true);
      assert.equal(hasFeature("pilot", "missions:all-ranks"), true);
      assert.equal(hasFeature("pilot", "support:priority-24h"), true);

      // But does NOT unlock Commander desk features
      assert.equal(hasFeature("pilot", "scanner:cross-venue"), false);
      assert.equal(hasFeature("pilot", "feed:websocket-live"), false);
      assert.equal(hasFeature("pilot", "exports:tick-ledger"), false);

      const quota = getPlanQuota("pilot");
      assert.equal(quota.supportSlaHours, 24);
      assert.equal(quota.shadowModeEnabled, true);
      assert.equal(quota.crewOfficersCount, 8);
    });

    it("verifies Commander ($399/mo) unlocks desk scanner, WS feed, and coaching", () => {
      assert.equal(hasFeature("commander", "scanner:cross-venue"), true);
      assert.equal(hasFeature("commander", "feed:websocket-live"), true);
      assert.equal(hasFeature("commander", "exports:tick-ledger"), true);
      assert.equal(hasFeature("commander", "coaching:monthly-session"), true);
      assert.equal(hasFeature("commander", "support:desk-4h"), true);

      const quota = getPlanQuota("commander");
      assert.equal(quota.supportSlaHours, 4);
      assert.equal(quota.webSocketAccess, true);
    });

    it("verifies Builder ($49/mo) unlocks MCP developer tools & 50k API quota", () => {
      assert.equal(hasFeature("builder", "api:mcp-developer"), true);
      assert.equal(hasFeature("builder", "shadow:mode"), false);

      const quota = getPlanQuota("builder");
      assert.equal(quota.monthlyApiRequests, 50000);
    });

    it("verifies Institutional tier unlocks unmetered access & 1h SLA", () => {
      assert.equal(hasFeature("institutional", "institutional:unmetered"), true);
      assert.equal(hasFeature("institutional", "scanner:cross-venue"), true);

      const quota = getPlanQuota("institutional");
      assert.equal(quota.supportSlaHours, 1);
      assert.equal(quota.webSocketAccess, true);
    });
  });

  describe("Plan Hierarchy & Eligibility Gating", () => {
    it("evaluates plan eligibility according to hierarchy tier", () => {
      assert.equal(isPlanEligible("cadet", "cadet"), true);
      assert.equal(isPlanEligible("cadet", "pilot"), false);
      assert.equal(isPlanEligible("pilot", "cadet"), true);
      assert.equal(isPlanEligible("pilot", "commander"), false);
      assert.equal(isPlanEligible("commander", "pilot"), true);
      assert.equal(isPlanEligible("institutional", "commander"), true);
    });
  });

  describe("Paywall Gate Middleware & Response Formats", () => {
    it("renders valid HTML paywall modal with Tesla styling and pricing link", () => {
      const html = renderPaywallNoticeHtml("shadow:mode", "pilot", "cadet");
      assert.ok(html.includes("Upgrade Required"));
      assert.ok(html.includes("PILOT TIER"));
      assert.ok(html.includes("Unlock shadow:mode"));
      assert.ok(html.includes("/pricing?plan=pilot"));
    });

    it("enforces feature gating in express middleware for JSON requests", async () => {
      const middleware = requireFeatureGate("scanner:cross-venue", "commander");

      let nextCalled = false;
      const fakeReq: any = {
        headers: {},
        accepts: (type: string) => type === "json",
      };

      let statusReceived = 0;
      let jsonPayload: any = null;

      const fakeRes: any = {
        status: (code: number) => {
          statusReceived = code;
          return fakeRes;
        },
        json: (data: any) => {
          jsonPayload = data;
          return fakeRes;
        },
        type: () => fakeRes,
        send: () => fakeRes,
      };

      await middleware(fakeReq, fakeRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false, "next() should not be called for unauthorized cadet user");
      assert.equal(statusReceived, 403, "returns HTTP 403 Forbidden");
      assert.equal(jsonPayload?.error, "upgrade_required");
      assert.equal(jsonPayload?.requiredPlan, "commander");
    });
  });
});
