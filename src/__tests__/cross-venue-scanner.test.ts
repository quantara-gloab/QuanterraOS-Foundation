import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getCrossVenueDiscrepancies,
  computeCustomCrossVenueSpread,
  renderCrossVenueScannerPageHtml,
} from "../cross-venue-scanner.ts";

describe("Strategic Move #10 — Cross-Platform Discrepancy & Net Spread Scanner", () => {
  it("1. Canonical Discrepancies: accurately computes gross spreads and deducts multi-venue fees", () => {
    const list = getCrossVenueDiscrepancies();
    assert.strictEqual(list.length, 4);

    const fedCut = list.find(d => d.id === "MACRO-FED-CUT-NEXT");
    assert.ok(fedCut);
    assert.strictEqual(fedCut?.grossSpreadCents, 5.0);
    assert.ok(fedCut?.kalshiTakerFeeCents > 1.0);
    assert.ok(fedCut?.polymarketGasAndSlippageCents > 0.5);
    assert.strictEqual(fedCut?.netDiscrepancyCents, 2.6);
    assert.strictEqual(fedCut?.isRealizedNetPositive, true);
    assert.strictEqual(fedCut?.provenanceHash.length, 64);
  });

  it("2. Fee Trap Detection: flags apparent gross spreads that yield negative net returns after friction", () => {
    const btc15m = getCrossVenueDiscrepancies().find(d => d.id === "CRYPTO-BTC-15M-T91250");
    assert.ok(btc15m);
    assert.strictEqual(btc15m?.grossSpreadCents, 2.0);
    // Combined fees = 1.75¢ Kalshi + 0.85¢ Polymarket = 2.6¢ -> net is -0.6¢
    assert.strictEqual(btc15m?.isRealizedNetPositive, false);
    assert.strictEqual(btc15m?.netDiscrepancyCents, -0.6);
    assert.strictEqual(btc15m?.settlementMismatch.hazardLevel, "HIGH");
  });

  it("3. Custom Spread Calculator: accurately models custom contract inputs", () => {
    const calc = computeCustomCrossVenueSpread({
      kalshiPriceCents: 65,
      polymarketPriceCents: 58,
      settlementMatchCategory: "oracle_difference"
    });

    assert.strictEqual(calc.grossSpreadCents, 7.0);
    assert.ok(calc.kalshiFeeCents > 1.5);
    assert.ok(calc.netSpreadCents > 4.0);
    assert.strictEqual(calc.isNetViable, true);
    assert.ok(calc.hazardAssessment.includes("Differing settlement oracles"));
    assert.strictEqual(calc.provenanceHash.length, 64);
  });

  it("4. Category Filtering: filters pairs by macro, crypto, or elections", () => {
    const macroOnly = getCrossVenueDiscrepancies("macro");
    assert.strictEqual(macroOnly.length, 2);
    assert.ok(macroOnly.every(d => d.category === "macro"));

    const cryptoOnly = getCrossVenueDiscrepancies("crypto");
    assert.strictEqual(cryptoOnly.length, 1);
  });

  it("5. Scanner HTML Rendering & Regulatory Standard Compliance", () => {
    const html = renderCrossVenueScannerPageHtml();

    assert.ok(html.includes("Cross-Platform Discrepancy Scanner"));
    assert.ok(html.includes("Retail Quantitative Cockpit"));
    assert.ok(html.includes("Polymarket (USDC)"));
    assert.ok(html.includes("Kalshi (CFTC USD)"));

    // Rule B5 check: Zero live capital deployed
    assert.ok(html.includes("$0.00 exposure under permanent standby circuit breaker lock"));

    // Rule B10 check: Third-party marks attribution
    assert.ok(html.includes("Polymarket is a trademark"));
    assert.ok(html.includes("Kalshi is a trademark"));

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
        `Scanner HTML violates Rule B4 with banned pattern: ${pattern}`
      );
    }
  });
});
