/**
 * Test Suite: QuanterraOS Transfer Gateway (/transfer)
 * Verifies the customer acquisition engine from Kalshi and Polymarket.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderTransferPageHtml } from "../transfer-page.ts";

describe("Customer Acquisition & Migration Gateway (Kalshi & Polymarket -> QuanterraOS)", () => {
  it("renders transfer gateway HTML with required educational invariants and controls", () => {
    const html = renderTransferPageHtml();

    // Check title and SEO headers
    assert.ok(html.includes("Transfer From Kalshi &amp; Polymarket"));
    assert.ok(html.includes("Stop Donating 35% Fee Friction"));

    // Check instant link paste scanner
    assert.ok(html.includes('id="market-url-input"'));
    assert.ok(html.includes("auditInputUrl()"));
    assert.ok(html.includes('id="scanner-results"'));

    // Check the 3 educational invariants
    assert.ok(html.includes("The Parabolic Taker Fee Trap"));
    assert.ok(html.includes("Settlement Pin Risk vs TWAP"));
    assert.ok(html.includes("Calibrated Honesty"));

    // Check monthly savings calculator
    assert.ok(html.includes('id="volume-slider"'));
    assert.ok(html.includes("updateSavings(this.value)"));
    assert.ok(html.includes('id="calc-donated-fees"'));
    assert.ok(html.includes('id="calc-preserved-capital"'));
    assert.ok(html.includes('id="calc-annual-value"'));

    // Check CTA links
    assert.ok(html.includes('href="/account"'));
    assert.ok(html.includes('href="/cockpit"'));
    assert.ok(html.includes('href="/mobile"'));

    // Verify regulatory compliance: Rule B5 ($0.00 capital deployed) and CFTC Rule 4.41
    assert.ok(html.includes("CFTC RULE 4.41 HYPOTHETICAL DISCLAIMER"));
    assert.ok(html.includes("Rule B5 permanent circuit breakers: $0.00 live capital deployed"));

    // Verify Rule B4: zero banned superlatives
    const lower = html.toLowerCase();
    assert.ok(!lower.includes("guaranteed profit"));
    assert.ok(!lower.includes("guaranteed win"));
    assert.ok(!lower.includes("free money"));
    assert.ok(!lower.includes("unlimited alpha"));
  });
});
