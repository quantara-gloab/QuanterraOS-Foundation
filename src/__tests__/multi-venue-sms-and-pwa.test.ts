import { describe, it } from "node:test";
import assert from "node:assert";
import { compareVenues, calculateKalshiFee, VENUE_SPECS } from "../polymarket-engine.ts";
import { buildDailySmsBriefText, getSmsIntelligenceTelemetry } from "../sms-dispatch.ts";
import { validateSmsCopy } from "../sms-marketing.ts";

describe("Vector 2: Polymarket & Multi-Venue Engine", () => {
  it("calculates Kalshi taker fee correctly using non-linear formula", () => {
    const fee50 = calculateKalshiFee(0.5);
    assert.ok(fee50 >= 0.01 && fee50 <= 0.02, `Expected fee between 0.01 and 0.02, got ${fee50}`);

    const fee10 = calculateKalshiFee(0.1);
    assert.ok(fee10 < fee50, `Expected fee10 (${fee10}) to be less than fee50 (${fee50})`);
  });

  it("compares Kalshi and Polymarket side-by-side with accurate friction", () => {
    const comp = compareVenues({ price: 0.51, count: 10, userProb: 0.55 });
    assert.ok(comp.kalshi.venue.includes("Kalshi"));
    assert.ok(comp.polymarket.venue.includes("Polymarket"));
    assert.ok(comp.kalshi.breakevenWinProb > 51.0);
    assert.ok(comp.polymarket.breakevenWinProb > 51.0);
    assert.strictEqual(comp.polymarket.settlementRiskLevel, "MODERATE"); // UMA dispute window
    assert.strictEqual(comp.kalshi.settlementRiskLevel, "LOW");
    assert.ok(comp.divergence.riskRecommendation.length > 20);
  });

  it("handles high contract count where Polymarket scale economies kick in", () => {
    const comp = compareVenues({ price: 0.5, count: 500, userProb: 0.55 });
    assert.strictEqual(comp.divergence.cheaperVenue, "polymarket");
    assert.ok(comp.divergence.riskRecommendation.includes("Polymarket"));
  });

  it("verifies venue specifications have regulatory clarity", () => {
    assert.ok(VENUE_SPECS.kalshi.regulator.includes("CFTC"));
    assert.ok(VENUE_SPECS.polymarket.resolutionMechanism.includes("UMA"));
  });
});

describe("Vector 3: Automated SMS Daily Intelligence Dispatch", () => {
  it("generates compliant SMS brief <= 160 characters", () => {
    const brief = buildDailySmsBriefText({
      brierBaseline: 0.2001,
      internalModelBrier: 0.2063,
      breakevenHurdlePct: 52.75,
      sampleCount: 1316,
    });

    assert.ok(brief.length <= 160, `Brief length ${brief.length} exceeds 160 chars`);
    assert.ok(brief.includes("QuanterraOS:"));
    assert.ok(brief.includes("0.2001"));
    assert.ok(brief.includes("52.75%"));
    assert.ok(brief.includes("Rule B5: $0.00"));
    assert.ok(brief.toLowerCase().includes("stop to cancel"));

    const copyCheck = validateSmsCopy(brief);
    assert.strictEqual(copyCheck.valid, true);
    assert.strictEqual(copyCheck.errors.length, 0);
  });

  it("provides active telemetry counts without error", () => {
    const tel = getSmsIntelligenceTelemetry();
    assert.ok(tel.complianceStatus.includes("TCPA"));
    assert.strictEqual(tel.mandatoryOptOutSupported, true);
    assert.strictEqual(typeof tel.activeSubscribers, "number");
  });
});
