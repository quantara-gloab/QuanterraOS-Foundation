import { test, describe, beforeEach, afterEach, mock } from "node:test";
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
  let markets: KalshiLiveMarket[];

  beforeEach(() => {
    mock.method(Date, "now", () => Date.parse("2026-09-30T15:00:00Z"));
    markets = [synthMarket()];
    mock.method(globalThis, "fetch", async () => Response.json({ markets }));
  });

  afterEach(() => mock.restoreAll());

  test("logs paper trades for open contracts using real-style data", async (t) => {
    const db = makeDb();
    t.after(() => db.close());

    const deps: BtcPaperTradeCycleDeps = {
      db,
      fetchBtcTicks: () => mockBtcTicks(),
    };

    const results = await runBtcPaperTradingCycle(deps, { owner: "trader" });

    assert.equal(results.length, 1);
    assert.equal(results[0].paperTrade.contract, synthMarket().ticker);
    assert.equal(results[0].paperTrade.owner, "trader");
    assert.equal(results[0].paperTrade.status, "proposed");

    // Verify trades are in the DB
    const count = db.prepare("SELECT COUNT(*) as n FROM paper_trades").get() as { n: number };
    assert.equal(count.n, 1);
  });

  test("skips contracts where model has no prediction", async (t) => {
    const db = makeDb();
    t.after(() => db.close());

    const deps: BtcPaperTradeCycleDeps = {
      db,
      fetchBtcTicks: () => [], // No ticks = no model prediction
    };

    const results = await runBtcPaperTradingCycle(deps, { owner: "trader" });

    // With no ticks, the model won't produce predictions
    assert.equal(results.length, 0);

    const count = db.prepare("SELECT COUNT(*) as n FROM paper_trades").get() as { n: number };
    assert.equal(count.n, 0);
  });

  test("logs every decision (including SKIP) to the store", async (t) => {
    const db = makeDb();
    t.after(() => db.close());

    const deps: BtcPaperTradeCycleDeps = {
      db,
      fetchBtcTicks: () => mockBtcTicks(),
    };

    await runBtcPaperTradingCycle(deps, { owner: "trader", edgeThreshold: 1 });

    // Even with high threshold (forcing SKIPs), trades should be logged
    const trades = db.prepare("SELECT * FROM paper_trades").all();
    assert.equal(trades.length, 1);

    // All should be proposed status
    for (const t of trades) {
      assert.equal(t.status, "proposed");
      assert.equal(t.decision, "skip");
      assert.equal(t.side, null);
    }
  });

  test("uses configurable edge threshold", async (t) => {
    const db = makeDb();
    t.after(() => db.close());

    const deps: BtcPaperTradeCycleDeps = {
      db,
      fetchBtcTicks: () => mockBtcTicks(),
    };

    // Low threshold → some BUY trades
    const lowThreshold = await runBtcPaperTradingCycle(deps, {
      owner: "trader",
      edgeThreshold: 0.0,
    });

    assert.equal(lowThreshold.length, 1);

    // Check that at least one was a BUY
    const buys = lowThreshold.filter((r) => r.paperTrade.decision === "buy");
    assert.ok(buys.length > 0, "Expected at least one BUY with threshold=0");

    const highThreshold = await runBtcPaperTradingCycle(deps, {
      owner: "trader",
      edgeThreshold: 1,
    });
    assert.equal(highThreshold.length, 1);
    assert.equal(highThreshold[0].paperTrade.decision, "skip");
  });

  test("does not log closed contracts", async (t) => {
    const db = makeDb();
    t.after(() => db.close());
    markets = [synthMarket({ close_time: new Date(Date.now() - 1).toISOString() })];

    const results = await runBtcPaperTradingCycle(
      { db, fetchBtcTicks: () => mockBtcTicks() },
      { owner: "trader" },
    );

    assert.equal(results.length, 0);
    const count = db.prepare("SELECT COUNT(*) as n FROM paper_trades").get() as { n: number };
    assert.equal(count.n, 0);
  });
});
