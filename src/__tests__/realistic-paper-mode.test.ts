import { describe, it } from "node:test";
import assert from "node:assert";
import {
  simulateRealisticPaperOrder,
  generatePaperExecutionSvgReceipt,
  renderRealisticPaperWidgetHtml,
  renderRealisticPaperPageHtml,
  getSimulatedOrderBook
} from "../realistic-paper-mode.ts";

describe("Realistic Paper Mode — Practice Without Deposits Engine", () => {
  it("1. Clean Market Fill: fills small order at top of book and calculates exact taker fee", () => {
    const book = getSimulatedOrderBook(52); // Ask = 53c (30 contracts)
    const result = simulateRealisticPaperOrder(
      {
        ticker: "KXBTC15M-TEST",
        side: "YES",
        orderType: "MARKET",
        contracts: 10,
        simulatedLatencyMs: 100
      },
      book
    );

    assert.strictEqual(result.status, "FILLED");
    assert.strictEqual(result.executedContracts, 10);
    assert.strictEqual(result.executedPriceCents, 53);
    assert.strictEqual(result.slippageCents, 0);

    // Gross = 10 * 0.53 = $5.30
    assert.strictEqual(result.grossNotionalUsd, 5.30);

    // Fee = 0.07 * 0.53 * 0.47 = 0.017437 -> 0.0174 per contract * 10 = $0.17
    assert.strictEqual(result.takerFeeUsd, 0.17);
    assert.strictEqual(result.netOutlayUsd, 5.47);

    // Breakeven hurdle > 53%
    assert.ok(result.breakevenHurdlePct > 53.0);
    assert.strictEqual(result.provenanceHash.length, 64);
  });

  it("2. Queue Sweeping & Slippage: models slippage when order exceeds top-of-book depth", () => {
    const book = getSimulatedOrderBook(52); // Asks: 53c (30 ct), 54c (65 ct)
    // Order 50 contracts: sweeps 30 ct @ 53c and 20 ct @ 54c
    const result = simulateRealisticPaperOrder(
      {
        ticker: "KXBTC15M-TEST",
        side: "YES",
        orderType: "MARKET",
        contracts: 50,
        simulatedLatencyMs: 150
      },
      book
    );

    assert.strictEqual(result.status, "FILLED");
    assert.strictEqual(result.executedContracts, 50);

    // Average price: (30 * 53 + 20 * 54) / 50 = (1590 + 1080) / 50 = 2670 / 50 = 53.40c
    assert.strictEqual(result.executedPriceCents, 53.4);
    assert.strictEqual(result.slippageCents, 0.4);
  });

  it("3. Voluntary Risk Plan Enforcement: flags and blocks trade exceeding spending limit", () => {
    const book = getSimulatedOrderBook(52);
    // Request 100 contracts @ 53c = $53.00, user cap is $25.00
    const result = simulateRealisticPaperOrder(
      {
        ticker: "KXBTC15M-TEST",
        side: "YES",
        orderType: "MARKET",
        contracts: 100,
        userSingleTradeCap: 25.0
      },
      book
    );

    assert.strictEqual(result.status, "REJECTED_RISK_LIMIT");
    assert.strictEqual(result.executedContracts, 0);
    assert.strictEqual(result.riskPlanCompliance.withinSingleTradeCap, false);
    assert.ok(result.missedFillReason?.includes("exceeds voluntary cap"));
  });

  it("4. Institutional SVG Verification Receipt: produces valid XML with Gold Standard styling", () => {
    const result = simulateRealisticPaperOrder({
      ticker: "KXBTC15M-24OCT07-T91250",
      side: "YES",
      orderType: "MARKET",
      contracts: 10
    });
    const svg = generatePaperExecutionSvgReceipt(result);

    assert.ok(svg.startsWith("<?xml"));
    assert.ok(svg.includes("<svg width=\"640\" height=\"720\""));
    assert.ok(svg.includes(result.provenanceHash));
    assert.ok(svg.includes("QUANTERRA // REALISTIC PAPER MODE"));
    assert.ok(svg.includes("Simulated Execution Receipt ($0.00 Risk)"));
  });

  it("5. Embeddable HTML Widget: renders clean iframe widget with deep link", () => {
    const widgetHtml = renderRealisticPaperWidgetHtml();

    assert.ok(widgetHtml.includes("Realistic Paper Mode"));
    assert.ok(widgetHtml.includes("$0.00 Risk Locked"));
    assert.ok(widgetHtml.includes("Rule B5 Standby Lock Active"));
    assert.ok(widgetHtml.includes("/paper"));
  });

  it("6. Full Terminal HTML & Rule Compliance: strictly enforces Rule B4, Rule B5, and Rule B10", () => {
    const pageHtml = renderRealisticPaperPageHtml();

    assert.ok(pageHtml.includes("Practice Without Deposits"));
    assert.ok(pageHtml.includes("90-Day Plan Build Order #5"));

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
