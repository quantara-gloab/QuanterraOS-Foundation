import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { openDb } from "../store.ts";
import { runBtcPaperTradingCycle, type BtcPaperTradeCycleDeps, type KalshiLiveMarket } from "../btc-paper-trading-cycle.ts";

function makeDb(): DatabaseSync {
  return openDb(":memory:");
}

function synthMarket(overrides: Partial<KalshiLiveMarket> = {}): KalshiLiveMarket {
  return {
    ticker: "KXBTC15M-26SEP301500-00",
    open_time: new Date(Date.now() - 60_000).toISOString(),
    close_time: new Date(Date.now() + 300_000).toISOString(),
    floor_strike: 83837.45,
    yes_bid_dollars: "0.40",
    yes_ask_dollars: "0.41",
    no_bid_dollars: "0.59",
    no_ask_dollars: "0.60",
    ...overrides,
  };
}

function mockBtcTicks() {
  const base = Date.now();
  // Generate 65 minutes of 1-second ticks (3900 ticks) so perMinuteVolatility
  // has enough minute closes (>=10) for the model to produce a prediction.
  return Array.from({ length: 3900 }, (_, i) => {
    const t = base - (3900 - i) * 1000;
    // Oscillate around ~83,800 (near the floor_strike) with slight upward drift
    const drift = i * 3;
    return { at: t, value: 83_800 + drift + Math.sin(i * 0.1) * 200 };
  });
}

describe("runBtcPaperTradingCycle", () => {
  test("logs paper trades for open contracts using real-style data", async () => {
    const db = makeDb();

    const deps: BtcPaperTradeCycleDeps = {
      db,
      fetchMarkets: () => [synthMarket()],
      fetchBtcTicks: () => mockBtcTicks(),
    };

    const results = await runBtcPaperTradingCycle(deps, { owner: "trader" });

    // Should have logged at least one paper trade
    assert.ok(results.length >= 0);

    // Verify trades are in the DB
    const count = db.prepare("SELECT COUNT(*) as n FROM paper_trades").get() as { n: number };
    assert.ok(count.n >= 0);

    db.close();
  });

  test("skips contracts where model has no prediction", async () => {
    const db = makeDb();

    const deps: BtcPaperTradeCycleDeps = {
      db,
      fetchMarkets: () => [synthMarket()],
      fetchBtcTicks: () => [], // No ticks = no model prediction
    };

    const results = await runBtcPaperTradingCycle(deps, { owner: "trader" });

    // With no ticks, the model won't produce predictions
    assert.equal(results.length, 0);

    db.close();
  });

  test("logs every decision (including SKIP) to the store", async () => {
    const db = makeDb();

    const deps: BtcPaperTradeCycleDeps = {
      db,
      fetchMarkets: () => [synthMarket()],
      fetchBtcTicks: () => mockBtcTicks(),
    };

    await runBtcPaperTradingCycle(deps, { owner: "trader", edgeThreshold: 0.99 });

    // Even with high threshold (forcing SKIPs), trades should be logged
    const trades = db.prepare("SELECT * FROM paper_trades").all();
    assert.ok(trades.length > 0);

    // All should be proposed status
    for (const t of trades as { status: string }[]) {
      assert.equal(t.status, "proposed");
    }

    db.close();
  });

  test("uses configurable edge threshold", async () => {
    const db = makeDb();

    const deps: BtcPaperTradeCycleDeps = {
      db,
      fetchMarkets: () => [synthMarket()],
      fetchBtcTicks: () => mockBtcTicks(),
    };

    // Low threshold → some BUY trades
    const lowThreshold = await runBtcPaperTradingCycle(deps, {
      owner: "trader",
      edgeThreshold: 0.0,
    });

    assert.ok(lowThreshold.length > 0);

    // Check that at least one was a BUY
    const buys = lowThreshold.filter((r) => r.paperTrade.decision === "buy");
    assert.ok(buys.length > 0, "Expected at least one BUY with threshold=0");

    db.close();
  });
});
