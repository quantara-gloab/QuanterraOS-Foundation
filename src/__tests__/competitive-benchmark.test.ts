import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeFrictionTeardown,
  COMPETITOR_BENCHMARK_ROWS,
  generateBenchmarkSvgReceipt,
  renderBenchmarkWidgetHtml,
  renderBenchmarkPageHtml,
} from "../competitive-benchmark.ts";

describe("Competitive Benchmark & Truth vs. Hype Engine (2026 Strategy)", () => {
  it("1. Friction Teardown Arithmetic: verifies exact taker fee and breakeven hurdle vs competitor illusion", () => {
    // 51c price, 55% win rate over 100 contracts
    const teardown = computeFrictionTeardown({
      nominalPriceCents: 51,
      userStatedWinRatePct: 55,
      contracts: 100,
    });

    assert.equal(teardown.nominalPriceCents, 51);
    assert.equal(teardown.userStatedWinRatePct, 55);
    assert.equal(teardown.contracts, 100);

    // Competitor naive claim (Verso / Predly)
    assert.equal(teardown.competitorClaimedEdgePct, 4.00);
    assert.equal(teardown.competitorNominalGrossEV, 4.00);

    // QuanterraOS exact reality check
    assert.equal(teardown.exactTakerFeeUsd, 1.75); // $0.0175 * 100
    assert.equal(teardown.trueBreakevenHurdlePct, 52.75);
    assert.equal(teardown.netRealizedExpectedProfitUsd, 2.25);
    assert.ok(Math.abs(teardown.feeDragRatioPctOfProfit - 43.75) <= 0.1, "Fee drag ratio should be ~43.8%");
    assert.equal(teardown.provenanceHash.length, 64);
  });

  it("2. Architectural Benchmark Rows: audits all 6 dimensions against Dome, Oddpool, Verso, Predly", () => {
    assert.equal(COMPETITOR_BENCHMARK_ROWS.length, 6);

    const neutrality = COMPETITOR_BENCHMARK_ROWS.find((r) => r.dimension.includes("Neutrality"))!;
    assert.match(neutrality.competitors, /Polymarket/);
    assert.match(neutrality.competitors, /Kalshi/);
    assert.equal(neutrality.verdict, "SUPERIOR");

    const taker = COMPETITOR_BENCHMARK_ROWS.find((r) => r.dimension.includes("Taker Fee"))!;
    assert.match(taker.quanterraos, /parabolic curve/);
    assert.equal(taker.verdict, "SUPERIOR");

    const oracle = COMPETITOR_BENCHMARK_ROWS.find((r) => r.dimension.includes("Settlement Oracle"))!;
    assert.match(oracle.quanterraos, /60-block/);
    assert.match(oracle.quanterraos, /CME CF BRTI/);

    const mcp = COMPETITOR_BENCHMARK_ROWS.find((r) => r.dimension.includes("Model Context Protocol"))!;
    assert.match(mcp.quanterraos, /\/api\/mcp\/manifest/);
  });

  it("3. Institutional SVG Receipt: produces valid XML with dark mode aesthetics", () => {
    const teardown = computeFrictionTeardown({ nominalPriceCents: 50, userStatedWinRatePct: 56, contracts: 50 });
    const svg = generateBenchmarkSvgReceipt(teardown);

    assert.ok(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(svg.includes("<svg width=\"640\" height=\"760\""));
    assert.ok(svg.includes(teardown.provenanceHash));
    assert.ok(svg.includes("RULE B5: $0.00 CAPITAL DEPLOYED"));
    assert.ok(svg.endsWith("</svg>"));
  });

  it("4. Embeddable Widget: renders clean iframe with side-by-side comparison", () => {
    const teardown = computeFrictionTeardown({ nominalPriceCents: 48, userStatedWinRatePct: 54 });
    const widget = renderBenchmarkWidgetHtml(teardown);

    assert.ok(widget.includes("<!DOCTYPE html>"));
    assert.ok(widget.includes("widget-box"));
    assert.ok(widget.includes("Competitor Claim"));
    assert.ok(widget.includes("QuanterraOS Reality"));
    assert.ok(widget.includes('href="/why"'));
  });

  it("5. Full Benchmark Page & Regulatory Guardrails: satisfies Rule B4, B5, and B10", () => {
    const teardown = computeFrictionTeardown({ nominalPriceCents: 51, userStatedWinRatePct: 55, contracts: 100 });
    const html = renderBenchmarkPageHtml(teardown);

    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("The Independent Truth Layer vs. Competitor Hype"));
    assert.ok(html.includes("$0.00"));
    assert.ok(html.includes("CME CF BRTI"));
    assert.ok(html.includes("Kalshi"));
    assert.ok(html.includes("Polymarket"));

    // Banned language audit (Rule B4)
    const banned = [
      /\balpha\b/i,
      /\bguaranteed\b/i,
      /\bbeat the market\b/i,
      /\barbitrage opportunity\b/i,
      /\bmispriced opportunities\b/i,
    ];
    for (const pat of banned) {
      assert.doesNotMatch(html, pat, `Benchmark page must not contain banned pattern: ${pat}`);
    }
  });
});
