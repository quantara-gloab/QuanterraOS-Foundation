import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { suggestPaperTrade, buildPaperTradeRow } from "../paper-trading.ts";
import { executeAutopilotPaperStep } from "../autopilot-engine.ts";
import { simulateRealisticPaperOrder } from "../realistic-paper-mode.ts";

describe("Phase 2 Task 2.3 Acceptance: Paper entries require real ask price; no $0.00 buys", () => {
  it("suggestPaperTrade refuses to buy when ask price is $0.00 or unquoted, skipping safely", () => {
    // High model probability (0.90) would normally trigger buy, but ask is 0.00
    const decisionZero = suggestPaperTrade({
      contract: "KXBTC15M-26OCT092030-30",
      modelProbability: 0.90,
      market: {
        yesBid: 0.00,
        yesAsk: 0.00,
        noBid: 0.00,
        noAsk: 0.00,
      },
      barrierType: "high",
      modelSource: "quant",
    });

    assert.strictEqual(decisionZero.decision, "skip");
    assert.strictEqual(decisionZero.side, null);
    assert.strictEqual(decisionZero.entryPrice, null);
    assert.match(decisionZero.rationale, /Real ask price required/i);
  });

  it("suggestPaperTrade requires real ask price within $0.01 to $0.99", () => {
    // Valid ask price (0.45) with edge triggers BUY
    const decisionValid = suggestPaperTrade({
      contract: "KXBTC15M-26OCT092030-30",
      modelProbability: 0.70,
      market: {
        yesBid: 0.44,
        yesAsk: 0.45,
        noBid: 0.54,
        noAsk: 0.55,
      },
      barrierType: "high",
      modelSource: "quant",
    });

    assert.strictEqual(decisionValid.decision, "buy");
    assert.strictEqual(decisionValid.side, "yes");
    assert.strictEqual(decisionValid.entryPrice, 0.45);
    assert.ok((decisionValid.entryPrice ?? 0) >= 0.01);
  });

  it("buildPaperTradeRow throws an error if an attempt is made to build a buy row with $0.00 entryPrice", () => {
    assert.throws(
      () => {
        buildPaperTradeRow(
          {
            contract: "KXBTC15M-26OCT092030-30",
            modelProbability: 0.85,
            market: { yesBid: 0, yesAsk: 0, noBid: 0, noAsk: 0 },
            barrierType: "high",
            modelSource: "quant",
          },
          {
            decision: "buy",
            side: "yes",
            edge: 0.40,
            entryPrice: 0.0, // illegal $0.00 buy
            breakevenProbability: 0.0,
            feeEstimate: 0.0,
            rationale: "Fake zero buy",
          }
        );
      },
      /Real ask price required for buy decision/
    );
  });

  it("simulateRealisticPaperOrder throws an error if order requested price is <= 0 cents", () => {
    assert.throws(
      () => {
        simulateRealisticPaperOrder({
          ticker: "KXBTC15M-26OCT092030-30",
          side: "YES",
          orderType: "LIMIT",
          limitPriceCents: 0, // illegal 0 cents
          contracts: 10,
        });
      },
      /Real ask price required/
    );
  });
});
