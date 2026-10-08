import { describe, it } from "node:test";
import assert from "node:assert";
import {
  computeLiquidityFlowState,
  generateLiquidityFlowSvgReceipt,
  renderLiquidityFlowWidgetHtml,
  renderLiquidityFlowPageHtml,
  type OrderBookFlowTick
} from "../liquidity-flow.ts";

describe("Order Book Liquidity Flow & Microstructure Pressure Engine", () => {
  it("1. Mathematical Flow Arithmetic: computes exact replenishment vs drain velocities", () => {
    const customTicks: OrderBookFlowTick[] = [
      { id: "1", timestampIso: new Date().toISOString(), side: "BID", priceCents: 50, action: "ADD", sizeContracts: 100, notionalUsd: 50 },
      { id: "2", timestampIso: new Date().toISOString(), side: "ASK", priceCents: 52, action: "FILL", sizeContracts: 40, notionalUsd: 20.8 },
      { id: "3", timestampIso: new Date().toISOString(), side: "BID", priceCents: 50, action: "CANCEL", sizeContracts: 20, notionalUsd: 10 },
      { id: "4", timestampIso: new Date().toISOString(), side: "BID", priceCents: 51, action: "ADD", sizeContracts: 60, notionalUsd: 30.6 },
      { id: "5", timestampIso: new Date().toISOString(), side: "ASK", priceCents: 53, action: "FILL", sizeContracts: 20, notionalUsd: 10.6 }
    ];

    const state = computeLiquidityFlowState("KXBTC15M-TEST", {
      windowSeconds: 100,
      customTicks
    });

    assert.strictEqual(state.totalReplenishedContracts, 160); // 100 + 60
    assert.strictEqual(state.totalDrainedContracts, 60); // 40 + 20
    assert.strictEqual(state.totalCancelledContracts, 20);

    // Velocity = total / 100s
    assert.strictEqual(state.replenishmentVelocityCtSec, 1.6);
    assert.strictEqual(state.drainVelocityCtSec, 0.6);

    // Net pressure = (160 - 60) / (160 + 60) = 100 / 220 = 0.455
    assert.strictEqual(state.netMicrostructurePressure, 0.455);
    assert.strictEqual(state.pressureDirection, "NET_REPLENISHING");
  });

  it("2. Net Draining Direction: classifies correctly when taker fills exceed replenishment", () => {
    const drainingTicks: OrderBookFlowTick[] = [
      { id: "1", timestampIso: new Date().toISOString(), side: "BID", priceCents: 50, action: "ADD", sizeContracts: 20, notionalUsd: 10 },
      { id: "2", timestampIso: new Date().toISOString(), side: "ASK", priceCents: 52, action: "FILL", sizeContracts: 80, notionalUsd: 41.6 }
    ];

    const state = computeLiquidityFlowState("KXBTC15M-TEST", {
      windowSeconds: 60,
      customTicks: drainingTicks
    });

    assert.strictEqual(state.totalReplenishedContracts, 20);
    assert.strictEqual(state.totalDrainedContracts, 80);
    // (20 - 80) / 100 = -0.6
    assert.strictEqual(state.netMicrostructurePressure, -0.6);
    assert.strictEqual(state.pressureDirection, "NET_DRAINING");
  });

  it("3. Cryptographic Provenance Hash: generates 64-char SHA-256 hash", () => {
    const state = computeLiquidityFlowState("KXBTC15M-24OCT07-T91250");
    assert.strictEqual(state.provenanceHash.length, 64);
    assert.match(state.provenanceHash, /^[0-9a-f]{64}$/);
  });

  it("4. Institutional SVG Verification Receipt: produces valid XML with Gold Standard styling", () => {
    const state = computeLiquidityFlowState("KXBTC15M-24OCT07-T91250");
    const svg = generateLiquidityFlowSvgReceipt(state);

    assert.ok(svg.startsWith("<?xml"));
    assert.ok(svg.includes("<svg width=\"640\" height=\"720\""));
    assert.ok(svg.includes(state.ticker));
    assert.ok(svg.includes(state.provenanceHash));
    assert.ok(svg.includes("QUANTERRA // LIQUIDITY FLOW TELEMETRY"));
  });

  it("5. Embeddable HTML Widget: renders clean iframe widget with deep link", () => {
    const state = computeLiquidityFlowState("KXBTC15M-24OCT07-T91250");
    const widgetHtml = renderLiquidityFlowWidgetHtml(state);

    assert.ok(widgetHtml.includes("Microstructure Flow Velocity"));
    assert.ok(widgetHtml.includes(state.ticker));
    assert.ok(widgetHtml.includes(`/flow?ticker=${encodeURIComponent(state.ticker)}`));
    assert.ok(widgetHtml.includes("Sweep Risk"));
  });

  it("6. Full Terminal HTML & Rule Compliance: strictly enforces Rule B4, Rule B5, and Rule B10", () => {
    const state = computeLiquidityFlowState("KXBTC15M-24OCT07-T91250");
    const pageHtml = renderLiquidityFlowPageHtml(state);

    assert.ok(pageHtml.includes("Order Book Replenishment vs Drain"));
    assert.ok(pageHtml.includes(state.ticker));

    // Rule B5 check: Zero live capital deployed
    assert.ok(pageHtml.includes("$0.00 capital deployed"), "Must state $0.00 capital deployed per Rule B5");
    assert.ok(pageHtml.includes("standby lock"), "Must state standby lock per Rule B5");

    // Rule B10 check: Third-party marks attribution
    assert.ok(pageHtml.includes("CF Benchmarks Ltd"), "Must attribute CF Benchmarks per Rule B10");
    assert.ok(pageHtml.includes("Kalshi is a trademark"), "Must attribute Kalshi per Rule B10");

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
        pattern.test(pageHtml),
        false,
        `Page HTML violates Rule B4 with banned pattern: ${pattern}`
      );
    }
  });
});
