import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { renderEmbedCalculatorHtml, renderEmbedCardHtml } from "../embed-widget.ts";

describe("QuanterraOS Embeddable Widget Suite", () => {
  test("renders embeddable calculator widget with required controls and safety disclosures", () => {
    const html = renderEmbedCalculatorHtml();

    // Check essential UI controls
    assert.ok(html.includes("QuanterraOS Cost Calculator"));
    assert.ok(html.includes('id="select-venue"'));
    assert.ok(html.includes('id="input-count"'));
    assert.ok(html.includes('id="slider-price"'));
    assert.ok(html.includes('id="res-breakeven"'));
    assert.ok(html.includes('id="res-fee"'));
    assert.ok(html.includes('id="res-outlay"'));

    // Check CFTC formula adherence
    assert.ok(html.includes("0.07 * count * price * (1 - price)"));
    assert.ok(html.includes("CME CF BRTI 60s TWAP"));

    // Check Rule B4 compliance: NO banned superlatives
    assert.strictEqual(/\bguaranteed profit\b/i.test(html), false);
    assert.strictEqual(/\bbeat the market\b/i.test(html), false);
    assert.strictEqual(/\barbitrage opportunity\b/i.test(html), false);
    assert.strictEqual(/\border routing\b/i.test(html), false);

    // Check Rule B5 compliance: permanent $0 live exposure
    assert.ok(html.includes("Rule B5"));
    assert.ok(html.includes("$0 live capital"));
  });

  test("renders embeddable market evidence card with parameter overrides", () => {
    const html = renderEmbedCardHtml({
      ticker: "KXBTC15M",
      venue: "kalshi-15m",
      currentAsk: 0.52,
      contractCount: 20,
    });

    assert.ok(html.includes("KXBTC15M"));
    assert.ok(html.includes("CFTC REGULATED"));
    assert.ok(html.includes("52¢"));
    assert.ok(html.includes("CME CF Bitcoin Real-Time Index (BRTI 60s TWAP)"));
    assert.ok(html.includes("Empirical Calibration Benchmark"));
  });
});
