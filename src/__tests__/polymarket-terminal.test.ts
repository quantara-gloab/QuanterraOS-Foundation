/**
 * Test Suite: Polymarket Intelligence Terminal & Wallet Calibration (/polymarket, /wallet)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderPolymarketTerminalHtml } from "../polymarket-terminal-page.ts";

describe("Polymarket Intelligence & Wallet Calibration Terminal (/polymarket, /wallet)", () => {
  it("renders Polymarket terminal HTML with wallet search, benchmarks, and UMA risk metrics", () => {
    const html = renderPolymarketTerminalHtml({
      initialAddress: "0x71c83497c385a8efb54a2221dc371e549d4fc70a",
    });

    // Verify title and headers
    assert.ok(html.includes("Polymarket Intelligence Terminal"));
    assert.ok(html.includes("Audited Calibration &amp; UMA Oracle Risk"));

    // Verify wallet auditor elements
    assert.ok(html.includes('id="wallet-input"'));
    assert.ok(html.includes("0x71c83497c385a8efb54a2221dc371e549d4fc70a"));
    assert.ok(html.includes("auditWallet()"));
    assert.ok(html.includes("selectBenchmark"));

    // Verify curated benchmarks
    assert.ok(html.includes("Pilot-71c"));
    assert.ok(html.includes("Whale-94b"));
    assert.ok(html.includes("Trader-32e"));

    // Verify 3 Microstructure Pillars
    assert.ok(html.includes("UMA Optimistic Oracle Risk"));
    assert.ok(html.includes("Cross-Venue Net Price Arbitrage"));
    assert.ok(html.includes("The Favorite-Chaser Paradox"));

    // Verify compliance: Rule B5 ($0.00 capital deployed) and CFTC Rule 4.41
    assert.ok(html.includes("CFTC RULE 4.41 HYPOTHETICAL DISCLAIMER"));
    assert.ok(html.includes("Rule B5 permanent circuit breakers: $0.00 live capital deployed"));

    // Verify Rule B4: zero banned marketing superlatives
    const lower = html.toLowerCase();
    assert.ok(!lower.includes("guaranteed win"));
    assert.ok(!lower.includes("guaranteed profit"));
    assert.ok(!lower.includes("free money"));
    assert.ok(!lower.includes("unlimited alpha"));
  });
});
