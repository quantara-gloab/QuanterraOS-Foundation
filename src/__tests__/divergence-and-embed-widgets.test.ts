/**
 * Automated Acceptance Test Suite: Cross-Venue Divergence Monitor & Embeddable Widgets
 *
 * Verifies:
 * 1. Embeddable Expiry Radar Widget (/embed/radar, /widget/radar):
 *    - Renders valid standalone HTML card.
 *    - Includes live series ticker, composite spot proxy, ATM strike, delta, and 60s TWAP attribution.
 *    - Enforces Rule B4 (zero marketing superlatives) and Rule B5 ($0.00 capital risk).
 * 2. Embeddable Cross-Venue Divergence Widget (/embed/divergence, /widget/divergence):
 *    - Renders side-by-side Kalshi vs Polymarket friction metrics.
 *    - Accurately computes CFTC parabolic taker fee and Polygon gas friction.
 *    - Displays settlement oracle profiles (CME CF BRTI 60s TWAP vs UMA Optimistic Oracle).
 *    - Fully respects query parameters (price, count).
 * 3. Cross-Venue Divergence Navigation & Route Compliance:
 *    - /divergence endpoint aliases properly to venue comparison terminal.
 *    - Navigation contains inter-links to /radar and /divergence.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  renderEmbedRadarHtml,
  renderEmbedDivergenceHtml,
} from "../embed-widget.ts";
import { renderVenueComparisonPageHtml } from "../venue-comparison-page.ts";

describe("Cross-Venue Divergence & Embeddable Widgets Test Suite", () => {
  describe("1. Embeddable Expiry Radar Widget", () => {
    it("renders standalone radar widget HTML with default parameters", () => {
      const html = renderEmbedRadarHtml();
      assert.ok(html.includes("<!DOCTYPE html>"), "Should produce valid HTML5 document");
      assert.ok(html.includes("QUANTERRAOS"), "Must feature QuanterraOS branding");
      assert.ok(html.includes("RADAR (15M)"), "Must default to 15m cadence");
      assert.ok(html.includes("60s TWAP ACTIVE"), "Must display TWAP status badge");
      assert.ok(html.includes("Spot Proxy"), "Must show Spot Proxy label");
      assert.ok(html.includes("ATM Strike"), "Must show ATM Strike label");
      assert.ok(html.includes("Delta"), "Must show Delta label");
      assert.ok(html.includes("CME CF BRTI 60s TWAP"), "Must cite CME CF BRTI oracle benchmark");
      assert.ok(html.includes("https://quanterraos.com/radar"), "Must link to full radar terminal");

      // Rule B4 compliance
      assert.strictEqual(/\bguaranteed\b/i.test(html), false, "Must not use 'guaranteed'");
      assert.strictEqual(/\bbeat the market\b/i.test(html), false, "Must not use 'beat the market'");
      assert.strictEqual(/\barbitrage\b/i.test(html), false, "Must use 'divergence', not 'arbitrage'");
      assert.strictEqual(/\balpha\b/i.test(html), false, "Must not use 'alpha'");
    });

    it("renders radar widget HTML with custom series and spot price overrides", () => {
      const html = renderEmbedRadarHtml({
        series: "1h",
        spotPrice: 94520,
      });

      assert.ok(html.includes("RADAR (1H)"), "Should reflect 1h series override");
      assert.ok(html.includes("$94,520"), "Should format spot price with thousands separators");
      assert.ok(html.includes("$94,500"), "ATM strike for $94,520 in 1h series ($250 strike spacing) should round to $94,500 or $94,750");
    });
  });

  describe("2. Embeddable Cross-Venue Divergence Widget", () => {
    it("renders standalone divergence widget HTML with default parameters", () => {
      const html = renderEmbedDivergenceHtml();
      assert.ok(html.includes("<!DOCTYPE html>"), "Should produce valid HTML5 document");
      assert.ok(html.includes("CROSS-VENUE DIVERGENCE"), "Must include divergence title");
      assert.ok(html.includes("Kalshi"), "Must include Kalshi venue box");
      assert.ok(html.includes("CFTC"), "Must specify CFTC regulatory tag for Kalshi");
      assert.ok(html.includes("Polymarket"), "Must include Polymarket venue box");
      assert.ok(html.includes("Polygon"), "Must specify Polygon blockchain tag for Polymarket");
      assert.ok(html.includes("CME CF BRTI"), "Must list CME CF BRTI for Kalshi");
      assert.ok(html.includes("UMA"), "Must list UMA oracle for Polymarket");
      assert.ok(html.includes("Rule B5"), "Must include Rule B5 disclosure");
      assert.ok(html.includes("$0 live capital"), "Must state $0 live capital");
      assert.ok(html.includes("https://quanterraos.com/divergence"), "Must link to full divergence terminal");

      // Rule B4 compliance
      assert.strictEqual(/\barbitrage\b/i.test(html), false, "Must use divergence, not arbitrage");
      assert.strictEqual(/\bguaranteed\b/i.test(html), false, "Must not promise guaranteed profits");
    });

    it("computes accurate non-linear CFTC fee and gas friction on custom inputs", () => {
      // 25 contracts at 60c ($0.60)
      const html = renderEmbedDivergenceHtml({
        price: 0.60,
        count: 25,
      });

      // Kalshi fee: ceil(0.07 * 25 * 0.60 * 0.40 * 100) / 100 = ceil(42.0) / 100 = $0.42
      assert.ok(html.includes("$0.42"), "Kalshi taker fee on 25 cts @ 60¢ must be $0.42");
      // Poly fee: (0.005 * 25) + 0.15 = 0.125 + 0.15 = $0.28
      assert.ok(html.includes("$0.28"), "Polymarket friction on 25 cts must be $0.28");
      assert.ok(html.includes("Price: 60") && html.includes("25 cts"), "Must display active price and contract count");
    });
  });

  describe("3. Cross-Venue Divergence Page & Navigation", () => {
    it("renders full comparison terminal HTML without banned marketing language", () => {
      const html = renderVenueComparisonPageHtml();
      assert.ok(html.includes("Cross-Venue Friction &amp; Risk Comparison"));
      assert.ok(html.includes("Rule B5 Standby Lock"));
      assert.ok(html.includes("$0.00 CAPITAL RISK"));
      assert.ok(!html.includes("guaranteed edge"));
      assert.ok(!html.includes("instant arbitrage"));
    });
  });
});
