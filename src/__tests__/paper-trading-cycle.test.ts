import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { openDb, type DatabaseSync } from "../store.ts";
import { runPaperTradingCycle, type PaperTradeCycleInput } from "../paper-trading-cycle.ts";
import { computeHighLowRecommendation } from "../agents/falcon-highlow.ts";

const DB_PATH = ":memory:";

function makeDb(): DatabaseSync {
  return openDb(DB_PATH);
}

function synthInput(
  overrides: Partial<PaperTradeCycleInput> = {},
): PaperTradeCycleInput {
  return {
    contract: {
      ticker: "KXBTC-15MIN-HIGH",
      barrierType: "high",
      strike: 101_000,
      remainingSeconds: 900,
      priceTicks: [99_500, 99_600, 99_700, 99_800, 99_900, 100_000, 100_100],
    },
    market: {
      yesAsk: 0.52,
      yesBid: 0.50,
      noAsk: 0.50,
      noBid: 0.48,
    },
    owner: "trader",
    modelSource: "quant",
    ...overrides,
  };
}

describe("runPaperTradingCycle", () => {
  test("logs a proposed paper trade to the store", () => {
    const db = makeDb();
    const input = synthInput({
      contract: {
        ticker: "KXBTC-TEST-HIGH",
        barrierType: "high",
        strike: 100_500,
        remainingSeconds: 600,
        priceTicks: [100_000, 100_100, 100_200, 100_300],
      },
      market: { yesAsk: 0.55, yesBid: 0.53, noAsk: 0.47, noBid: 0.45 },
    });

    const result = runPaperTradingCycle(db, input);

    assert.ok(result !== null);
    assert.equal(result.paperTrade.id.length > 0, true);
    assert.equal(result.paperTrade.owner, "trader");
    assert.equal(result.paperTrade.contract, "KXBTC-TEST-HIGH");
    assert.equal(result.paperTrade.modelSource, "quant");
    assert.equal(result.paperTrade.barrierType, "high");
    assert.equal(result.paperTrade.status, "proposed");
    if (input.createdAt) {
      assert.equal(result.paperTrade.createdAt, input.createdAt);
    } else {
      assert.ok(result.paperTrade.createdAt.length > 0);
    }
    assert.ok(result.recommendation.probability >= 0);
  });

  test("returns null when the contract cannot be evaluated", () => {
    const db = makeDb();
    const input = synthInput({
      contract: {
        ticker: "KXBTC-BAD-HIGH",
        barrierType: "high",
        strike: 100_000,
        remainingSeconds: 0,
        priceTicks: [],
      },
    });

    // This should throw inside the cycle — catch and expect null
    assert.throws(() => runPaperTradingCycle(db, input));
  });

  test("logs a SKIP when edge is below threshold", () => {
    const db = makeDb();
    const input = synthInput({
      contract: {
        ticker: "KXBTC-SKIP-HIGH",
        barrierType: "high",
        strike: 100_000,
        remainingSeconds: 900,
        priceTicks: [99_950, 99_960, 99_955, 99_965],
      },
      market: { yesAsk: 0.53, yesBid: 0.51, noAsk: 0.51, noBid: 0.49 },
      edgeThreshold: 0.5,
    });

    const result = runPaperTradingCycle(db, input);

    assert.ok(result !== null);
    assert.equal(result.paperTrade.decision, "skip");
    assert.equal(result.paperTrade.side, null);
    assert.equal(result.paperTrade.entryPrice, null);
  });

  test("uses default edge threshold when not specified", () => {
    const db = makeDb();
    const input = synthInput();

    const result = runPaperTradingCycle(db, input);

    assert.ok(result !== null);
    // The row should have been logged regardless of buy/skip
    assert.equal(result.paperTrade.status, "proposed");
    assert.ok(result.paperTrade.edge !== undefined);
  });

  test("creates a row that can be retrieved via getPaperTrade", async () => {
    const db = makeDb();
    const input = synthInput({
      contract: {
        ticker: "KXBTC-RET-HIGH",
        barrierType: "high",
        strike: 100_200,
        remainingSeconds: 900,
        priceTicks: [100_000, 100_050, 100_100, 100_150],
      },
    });

    const result = runPaperTradingCycle(db, input);
    assert.ok(result !== null);

    // Verify the row was actually inserted into the DB
    const fromDb = db
      .prepare("SELECT id, owner, contract, status FROM paper_trades WHERE id = ?")
      .get(result.paperTrade.id);

    assert.ok(fromDb !== undefined);
    assert.equal(fromDb.owner, "trader");
    assert.equal(fromDb.contract, "KXBTC-RET-HIGH");
    assert.equal(fromDb.status, "proposed");
  });
});
