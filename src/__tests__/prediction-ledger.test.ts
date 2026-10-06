import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  recordPrediction,
  scoreSettledPrediction,
  getPredictionsLedger,
  seedHistoricalReplay,
} from "../prediction-ledger.ts";
import {
  executeAutopilotPaperStep,
  getAutopilotLedger,
  resolveAutopilotTrade,
} from "../autopilot-engine.ts";
import { renderPredictionsPage } from "../predictions-page.ts";
import { renderAutopilotPage } from "../autopilot-page.ts";
import { db, runMigrations } from "../db.ts";
import { predictions } from "../schema.ts";
import { eq } from "drizzle-orm";

describe("Phase 1 & Phase 2: Prediction Ledger & Autopilot Engine", () => {
  before(() => {
    runMigrations();
  });

  const testMarketId = `KXBTC15M-TEST-${Date.now()}`;

  it("Phase 1: writes immutable prediction record before settlement", () => {
    const record = recordPrediction({
      marketId: testMarketId,
      predictedProb: 0.65,
      modelVersion: "falcon-highlow-v0.1",
      notes: "Pre-settlement test forecast",
    });

    assert.equal(record.marketId, testMarketId);
    assert.equal(record.predictedProb, 0.65);
    assert.equal(record.status, "PENDING");
    assert.equal(record.outcome, null);
    assert.equal(record.brierScore, null);

    // Verify immutability: attempting to record again with same ID must fail
    assert.throws(() => {
      recordPrediction({
        id: record.id,
        marketId: testMarketId,
        predictedProb: 0.90, // Attempted cheat
        modelVersion: "falcon-highlow-v0.1",
      });
    }, /Immutable prediction ledger violation/);
  });

  it("Phase 1: settlement scorer accurately computes Brier contribution and marks SETTLED", () => {
    const settled = scoreSettledPrediction(testMarketId, "YES");
    assert.ok(settled, "Settlement record must exist");
    assert.equal(settled.status, "SETTLED");
    assert.equal(settled.outcome, "YES");

    // Predicted: 0.65, Actual: 1.0 -> (0.65 - 1.0)^2 = 0.1225
    assert.equal(settled.brierScore, 0.1225);
    assert.equal(settled.predictedProb, 0.65); // Prediction must remain unchanged

    // Attempting to rescore must be a no-op / immutable
    const rescored = scoreSettledPrediction(testMarketId, "NO");
    assert.equal(rescored?.outcome, "YES", "Settled outcome must never be overwritten");
    assert.equal(rescored?.brierScore, 0.1225);
  });

  it("Phase 1: historical replay is strictly partitioned with is_replay = 1 and labeled", async () => {
    const res = await seedHistoricalReplay("data/kalshi-btc15m-candles.csv");
    assert.ok(res.totalInCorpus > 0, "Corpus must contain backtest records");

    const replayLedger = getPredictionsLedger({ isReplay: true, limit: 10 });
    assert.ok(replayLedger.total > 0, "Replay ledger must have rows");
    for (const item of replayLedger.items) {
      assert.equal(item.isReplay, 1, "Must be tagged isReplay = 1");
      assert.match(item.notes ?? "", /Backtest replay/i, "Must have Backtest replay note");
    }

    const liveLedger = getPredictionsLedger({ isReplay: false, limit: 10 });
    for (const item of liveLedger.items) {
      assert.equal(item.isReplay, 0, "Live ledger must only contain isReplay = 0");
    }
  });

  it("Phase 2: Autopilot paper-trading engine enforces Rule B5 $0.00 capital and mode: PAPER", () => {
    const marketTicker = `KXBTC15M-AUTO-${Date.now()}`;
    const step = executeAutopilotPaperStep({
      contract: marketTicker,
      modelProbability: 0.62,
      marketQuote: {
        yesAsk: 0.45,
        yesBid: 0.43,
        noAsk: 0.57,
        noBid: 0.55,
      },
    });

    assert.equal(step.mode, "PAPER");
    assert.equal(step.capital, "$0.00");
    assert.equal(step.decision, "buy");
    assert.equal(step.side, "yes");

    // Resolve the paper trade
    resolveAutopilotTrade(step.id, "YES");

    // Free tier delays recent trades by 20 minutes (clean DB has no historical trades)
    const freeSummary = getAutopilotLedger(10, "free");
    assert.equal(freeSummary.feedMode, "delayed_snapshot");

    // Pro tier provides immediate real-time ledger access
    const summary = getAutopilotLedger(10, "pro");
    assert.equal(summary.mode, "PAPER");
    assert.equal(summary.capital, "$0.00");
    assert.equal(summary.ruleB5Locked, true);
    assert.ok(summary.totalDecisions > 0);
  });

  it("Phase 1 & 2 UI templates render valid HTML without unproven claims", () => {
    const liveHtml = renderPredictionsPage({ isReplay: false });
    const replayHtml = renderPredictionsPage({ isReplay: true });
    const autopilotHtml = renderAutopilotPage();

    assert.match(liveHtml, /Prediction Ledger/i);
    assert.match(liveHtml, /Rule B5/i);
    assert.match(replayHtml, /Backtest replay \(historical, not live\)/i);

    assert.match(autopilotHtml, /Autopilot — Paper Trading/i);
    assert.match(autopilotHtml, /MODE: PAPER/i);
    assert.match(autopilotHtml, /CAPITAL: \$0\.00/i);
    assert.match(autopilotHtml, /Rule B5/i);
  });
});
