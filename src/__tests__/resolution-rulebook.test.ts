import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getAllResolutionAudits,
  getResolutionAudit,
  analyzeCustomResolutionText,
  renderResolutionRiskPageHtml,
} from "../resolution-rulebook-engine.ts";

describe("Strategic Move #9 — The Resolution Rulebook Engine (Anti-Dispute AI)", () => {
  it("1. Canonical Contract Audits: provides audited resolution risk profiles for high-volume contracts", () => {
    const audits = getAllResolutionAudits();
    assert.strictEqual(audits.length, 4);

    const fomc = getResolutionAudit("FED-FUNDS-RATE-CUT-2026");
    assert.ok(fomc);
    assert.strictEqual(fomc?.disputeRiskSeverity, "LOW");
    assert.strictEqual(fomc?.primarySourceAuthority.sourceType, "GOVERNMENT_AGENCY");
    assert.strictEqual(fomc?.provenanceHash.length, 64);

    const ceasefire = getResolutionAudit("GEOPOLITICAL-CEASEFIRE-DEC26");
    assert.ok(ceasefire);
    assert.strictEqual(ceasefire?.disputeRiskSeverity, "CRITICAL");
    assert.ok(ceasefire?.ambiguityScore >= 70);
    assert.ok(ceasefire?.umaDisputeProbabilityPct > 20);
    assert.ok(ceasefire?.identifiedLoopholes.some(l => l.vulnerabilityType === "SUBMITTER_DISCRETION"));
  });

  it("2. Custom Clause Analysis: detects vague media consensus and revision ambiguities", () => {
    const result = analyzeCustomResolutionText({
      title: "US Unemployment Rate In October 2026",
      resolutionText: "Resolves based on major news consensus reporting credible figures by end of month on Polymarket with UMA optimistic oracle.",
      venue: "polymarket"
    });

    assert.ok(result.ambiguityScore >= 50);
    assert.ok(["HIGH", "CRITICAL"].includes(result.disputeRiskSeverity));
    assert.ok(result.identifiedLoopholes.some(l => l.vulnerabilityType === "DEFINITION_HAZARD"));
    assert.ok(result.identifiedLoopholes.some(l => l.vulnerabilityType === "TIMEZONE_DISCREPANCY"));
    assert.strictEqual(result.provenanceHash.length, 64);
  });

  it("3. HTML Portal Rendering & Rule B4/B5/B10 Compliance", () => {
    const html = renderResolutionRiskPageHtml();

    // Structural elements
    assert.ok(html.includes("The Resolution Rulebook Engine"));
    assert.ok(html.includes("Retail Quantitative Cockpit"));
    assert.ok(html.includes("Anti-Dispute AI"));
    assert.ok(html.includes("Identified Clause Loopholes"));

    // Rule B5 check: Zero live capital deployed
    assert.ok(html.includes("$0.00 exposure under permanent standby circuit breaker lock"));

    // Rule B10 check: Third-party marks attribution
    assert.ok(html.includes("Polymarket is a trademark"));
    assert.ok(html.includes("Kalshi is a trademark"));
    assert.ok(html.includes("CME CF Bitcoin Real-Time Index (BRTI)"));

    // Rule B4 check: Strictly ban hype and predictive language
    const bannedPatterns = [
      /\balpha\b/i,
      /\bbeat the market\b/i,
      /\bguaranteed\b/i,
      /\barbitrage\b/i,
      /\bmispriced opportunities\b/i
    ];
    for (const pattern of bannedPatterns) {
      assert.strictEqual(
        pattern.test(html),
        false,
        `Resolution HTML violates Rule B4 with banned pattern: ${pattern}`
      );
    }
  });
});
