import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PRICING_PLANS, COACHING_ADDON } from "../config/pricing.ts";
import { renderPricingPageHtml } from "../pricing-page.ts";

describe("Phase 1 Task 1.3 Acceptance: Single Source of Truth Pricing (Part 4)", () => {
  it("exports exact canonical tiers defined in Handoff v2 Part 4", () => {
    assert.strictEqual(PRICING_PLANS.length, 5, "Must declare exactly 5 core plans");

    const [cadet, pilot, commander, builder, institutional] = PRICING_PLANS;

    // 1. Cadet (Free)
    assert.strictEqual(cadet.id, "cadet");
    assert.strictEqual(cadet.priceMonthly, 0);
    assert.strictEqual(cadet.priceDisplay, "$0");

    // 2. Pilot (Pro)
    assert.strictEqual(pilot.id, "pilot");
    assert.strictEqual(pilot.priceMonthly, 39);
    assert.strictEqual(pilot.priceAnnual, 349);
    assert.strictEqual(pilot.trialDays, 14);
    assert.strictEqual(pilot.priceDisplay, "$39");
    assert.strictEqual(pilot.isPopular, true);

    // 3. Commander (Desk)
    assert.strictEqual(commander.id, "commander");
    assert.strictEqual(commander.priceMonthly, 399);
    assert.strictEqual(commander.priceDisplay, "$399");

    // 4. Builder API
    assert.strictEqual(builder.id, "builder");
    assert.strictEqual(builder.priceMonthly, 49);
    assert.strictEqual(builder.priceDisplay, "$49");

    // 5. Institutional / Data
    assert.strictEqual(institutional.id, "institutional");
    assert.strictEqual(institutional.priceDisplay, "Custom");
    assert.ok(institutional.billingPeriod.includes("$1,500"));

    // Coaching Addon
    assert.strictEqual(COACHING_ADDON.id, "flight-instructor");
    assert.ok(COACHING_ADDON.priceDisplay.includes("$149"));
    assert.ok(COACHING_ADDON.priceDisplay.includes("$399"));
  });

  it("renders /pricing HTML dynamically from PRICING_PLANS without stale hardcoded tiers", () => {
    const html = renderPricingPageHtml();

    // Check all plan names and prices are rendered
    assert.ok(html.includes("Cadet"), "Cadet rendered");
    assert.ok(html.includes("Pilot"), "Pilot rendered");
    assert.ok(html.includes("Commander"), "Commander rendered");
    assert.ok(html.includes("Builder API"), "Builder rendered");
    assert.ok(html.includes("Institutional"), "Institutional rendered");
    assert.ok(html.includes("$39"), "$39 Pilot rendered");
    assert.ok(html.includes("$399"), "$399 Commander rendered");
    assert.ok(html.includes("$49"), "$49 Builder rendered");

    // Check that stale retired prices from v1 ($199/mo, $750/mo, $15/mo) do NOT appear
    assert.strictEqual(html.includes("$199"), false, "Must not contain retired $199 Pro price");
    assert.strictEqual(html.includes("$750"), false, "Must not contain retired $750 Institutional price");
    assert.strictEqual(html.includes("$15"), false, "Must not contain retired $15 Plus price");
  });
});
