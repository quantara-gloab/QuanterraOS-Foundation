import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  enrichLargeTradePrint,
  queryLargeTradeFeed,
  SAMPLE_LARGE_TRADE_PRINTS,
} from "../lib/sensors-feed.ts";

describe("Phase 6 Task 6.1 Acceptance: Large-Trade Feed (Net-After-Fees & Settlement Context)", () => {
  describe("Net-After-Fees Deduction Accuracy", () => {
    it("deducts exact Kalshi taker fee and shifts breakeven hurdle", () => {
      // 1,000 contracts @ 51¢ ask -> Kalshi taker fee: ceil(0.07 * 1000 * 0.51 * 0.49) = ceil(17.493) = $17.50
      const print = enrichLargeTradePrint({
        id: "test-kalshi-taker",
        timestamp: new Date().toISOString(),
        venue: "kalshi",
        ticker: "KXBTC15M-26OCT09-91250",
        marketTitle: "Bitcoin > $91,250",
        side: "YES",
        contracts: 1000,
        priceDollars: 0.51,
        orderType: "taker",
        strikePrice: 91250,
        currentSpot: 91200,
        secondsToExpiry: 600,
      });

      assert.strictEqual(print.notionalDollars, 510.0);
      assert.strictEqual(print.takerFeeDollars, 17.5);
      assert.strictEqual(print.netLossIfLoseDollars, 527.5);
      assert.strictEqual(print.netPayoutIfWinDollars, 472.5); // 1000 - 510 - 17.50

      // Required breakeven: (510 + 17.5) / 1000 = 52.75%
      assert.strictEqual(print.requiredBreakevenPct, 52.75);
      assert.ok(print.feeDragBps > 0);
    });

    it("records zero fee for maker limit orders", () => {
      const print = enrichLargeTradePrint({
        id: "test-maker-print",
        timestamp: new Date().toISOString(),
        venue: "kalshi",
        ticker: "KXBTC15M-26OCT09-91300",
        marketTitle: "Bitcoin > $91,300",
        side: "YES",
        contracts: 1500,
        priceDollars: 0.35,
        orderType: "maker",
        strikePrice: 91300,
        currentSpot: 91240,
        secondsToExpiry: 560,
      });

      assert.strictEqual(print.takerFeeDollars, 0.0);
      assert.strictEqual(print.netLossIfLoseDollars, 525.0);
      assert.strictEqual(print.netPayoutIfWinDollars, 975.0); // 1500 - 525
      assert.strictEqual(print.requiredBreakevenPct, 35.0);
    });
  });

  describe("Settlement Context & Hazard Zone Annotation", () => {
    it("flags Coin-Flip Hazard Zone when spot is within $50 and <= 180s", () => {
      const hazardPrint = enrichLargeTradePrint({
        id: "test-hazard-whale",
        timestamp: new Date().toISOString(),
        venue: "kalshi",
        ticker: "KXBTC15M-26OCT09-91250",
        marketTitle: "Bitcoin > $91,250",
        side: "YES",
        contracts: 500,
        priceDollars: 0.5,
        orderType: "taker",
        strikePrice: 91250,
        currentSpot: 91245, // $5 away from strike
        secondsToExpiry: 90, // <= 180s
      });

      assert.strictEqual(hazardPrint.settlementRiskLevel, "HAZARD_COIN_FLIP");
      assert.strictEqual(hazardPrint.strikeDistanceDollars, 5);
      assert.strictEqual(hazardPrint.settlementSource, "CME CF BRTI (60s TWAP)");
    });

    it("identifies safe settlement context when distant from strike with ample time", () => {
      const safePrint = enrichLargeTradePrint({
        id: "test-safe-whale",
        timestamp: new Date().toISOString(),
        venue: "polymarket",
        ticker: "POLY-BTC-95000",
        marketTitle: "Bitcoin > $95,000",
        side: "NO",
        contracts: 2000,
        priceDollars: 0.85,
        orderType: "maker",
        strikePrice: 95000,
        currentSpot: 91000, // $4,000 away
        secondsToExpiry: 86400, // 24 hours
        walletIdentifier: "0x4b2...19a",
      });

      assert.strictEqual(safePrint.settlementRiskLevel, "SAFE");
      assert.strictEqual(safePrint.settlementSource, "UMA Decentralized Oracle");
      assert.strictEqual(safePrint.walletIdentifier, "0x4b2...19a");
    });
  });

  describe("Venue Identity Separation (CFTC Anonymous Tape vs On-Chain Wallet)", () => {
    it("maintains anonymous CFTC tape identity for Kalshi trades", () => {
      const kalPrint = enrichLargeTradePrint({
        id: "test-kal-id",
        timestamp: new Date().toISOString(),
        venue: "kalshi",
        ticker: "KXBTC15M-91250",
        marketTitle: "Bitcoin > $91,250",
        side: "YES",
        contracts: 100,
        priceDollars: 0.5,
        orderType: "taker",
        strikePrice: 91250,
        currentSpot: 91200,
        secondsToExpiry: 600,
      });

      assert.strictEqual(kalPrint.walletIdentifier, "CFTC-PUBLIC-TAPE");
    });

    it("displays truncated on-chain wallet address for Polymarket prints", () => {
      const polyPrint = enrichLargeTradePrint({
        id: "test-poly-id",
        timestamp: new Date().toISOString(),
        venue: "polymarket",
        ticker: "POLY-FED",
        marketTitle: "Fed rate cut",
        side: "YES",
        contracts: 500,
        priceDollars: 0.75,
        orderType: "taker",
        strikePrice: 100,
        currentSpot: 100,
        secondsToExpiry: 3600,
        walletIdentifier: "0x82a1...4410",
      });

      assert.ok(polyPrint.walletIdentifier.startsWith("0x"));
    });
  });

  describe("Feed Filtering & Querying", () => {
    it("filters feed by venue, minimum contracts, and hazard risk level", () => {
      const kalshiOnly = queryLargeTradeFeed({ venue: "kalshi" });
      for (const p of kalshiOnly) {
        assert.strictEqual(p.venue, "kalshi");
      }

      const largeOnly = queryLargeTradeFeed({ minContracts: 1500 });
      for (const p of largeOnly) {
        assert.ok(p.contracts >= 1500);
      }

      const hazardOnly = queryLargeTradeFeed({ riskLevel: "HAZARD_COIN_FLIP" });
      for (const p of hazardOnly) {
        assert.strictEqual(p.settlementRiskLevel, "HAZARD_COIN_FLIP");
      }
    });
  });
});
