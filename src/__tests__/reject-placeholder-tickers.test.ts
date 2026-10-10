import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recordPrediction } from "../prediction-ledger.ts";
import { validateContractIdentifier } from "../data-quality-engine.ts";
import { placeKalshi15mBid } from "../kalshi-api.ts";
import { executeAutopilotPaperStep } from "../autopilot-engine.ts";

describe("Phase 2 Task 2.2 Acceptance: Reject placeholder tickers (*-CURRENT) at write", () => {
  it("rejects placeholder tickers ending in -CURRENT in validateContractIdentifier", () => {
    assert.strictEqual(validateContractIdentifier("KXBTC15M-CURRENT"), false);
    assert.strictEqual(validateContractIdentifier("KXBTC15M-26OCT09-CURRENT"), false);
    assert.strictEqual(validateContractIdentifier("BTC-CURRENT"), false);
    assert.strictEqual(validateContractIdentifier("KXBTCD-CURRENT"), false);

    // Valid standard tickers must still pass
    assert.strictEqual(validateContractIdentifier("KXBTC15M-26OCT092030-30"), true);
    assert.strictEqual(validateContractIdentifier("KXBTC15M-24OCT07-T91250"), true);
  });

  it("throws an error when attempting to record a prediction with a *-CURRENT ticker", () => {
    assert.throws(
      () => {
        recordPrediction({
          marketId: "KXBTC15M-26OCT09-CURRENT",
          predictedProb: 0.55,
          modelVersion: "test-v2",
        });
      },
      /Placeholder tickers ending in -CURRENT are strictly rejected/
    );

    assert.throws(
      () => {
        recordPrediction({
          marketId: "KXBTC15M-CURRENT",
          predictedProb: 0.55,
          modelVersion: "test-v2",
        });
      },
      /Placeholder tickers ending in -CURRENT are strictly rejected/
    );
  });

  it("throws an error when attempting to place a bid with a *-CURRENT ticker", async () => {
    await assert.rejects(
      async () => {
        await placeKalshi15mBid({
          userId: "test-user",
          ticker: "KXBTC15M-CURRENT",
          side: "yes",
          price: 0.52,
          count: 5,
          mode: "sandbox",
        });
      },
      /Placeholder tickers ending in -CURRENT are strictly rejected/
    );
  });

  it("throws an error when autopilot attempts to log a paper trade with a *-CURRENT ticker", () => {
    assert.throws(
      () => {
        executeAutopilotPaperStep({
          contract: "KXBTC15M-CURRENT",
          modelProbability: 0.60,
          marketQuote: {
            yesBid: 0.48,
            yesAsk: 0.50,
            noBid: 0.50,
            noAsk: 0.52,
          },
        });
      },
      /Placeholder tickers ending in -CURRENT are strictly rejected/
    );
  });
});
