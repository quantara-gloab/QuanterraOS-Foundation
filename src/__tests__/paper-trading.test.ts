import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  suggestPaperTrade,
  computeEdges,
  estimateFee,
  buildPaperTradeRow,
  scorePaperTrade,
  computePaperTrackRecord,
  type PaperTradeRow,
  type PaperTradeInput,
  type MarketQuote,
} from "../paper-trading.ts";
import type { ResolutionRow } from "../scoring.ts";

const now = new Date("2026-09-29T20:00:00.000Z");

function marketQuote(overrides: Partial<MarketQuote> = {}): MarketQuote {
  return {
    yesAsk: 0.48,
    yesBid: 0.46,
    noAsk: 0.54,
    noBid: 0.52,
    ...overrides,
  };
}

function paperInput(overrides: Partial<PaperTradeInput> = {}): PaperTradeInput {
  return {
    owner: "trader",
    contract: "KXBTC-TEST-HIGH",
    modelProbability: 0.7,
    modelSource: "quant",
    barrierType: "high",
    market: marketQuote(),
    ...overrides,
  };
}

function resolutionFor(outcome: "YES" | "NO" | "VOID"): ResolutionRow {
  return {
    owner: "trader",
    contract: "KXBTC-TEST-HIGH",
    outcome,
    officialSource: "kalshi",
    resolvedAt: "2026-09-29T20:15:00.000Z",
    finalized: true,
  };
}

// ---------------------------------------------------------------------------
// estimateFee
// ---------------------------------------------------------------------------

describe("estimateFee", () => {
  test("peaks near 50/50 odds", () => {
    assert.equal(estimateFee(0.5), 0.07 * 0.5 * 0.5);
  });

  test("is zero at the extremes", () => {
    assert.equal(estimateFee(0), 0);
    assert.equal(estimateFee(1), 0);
  });

  test("clamps values outside [0, 1]", () => {
    assert.equal(estimateFee(1.5), 0);
    assert.equal(estimateFee(-0.5), 0);
  });
});

// ---------------------------------------------------------------------------
// computeEdges
// ---------------------------------------------------------------------------

describe("computeEdges", () => {
  test("returns positive YES edge when model probability exceeds breakeven", () => {
    const edges = computeEdges(0.75, marketQuote({ yesAsk: 0.5 }));
    assert.ok(edges.yesEdge > 0);
    assert.equal(edges.yesBreakeven, 0.5 + estimateFee(0.5));
    assert.equal(edges.yesFee, estimateFee(0.5));
  });

  test("returns negative YES edge when model probability is below breakeven", () => {
    const edges = computeEdges(0.3, marketQuote({ yesAsk: 0.6 }));
    assert.ok(edges.yesEdge < 0);
  });

  test("YES and NO edges are equal at P=0.5 with symmetric quotes", () => {
    const edges = computeEdges(0.5, {
      yesAsk: 0.5,
      yesBid: 0.5,
      noAsk: 0.5,
      noBid: 0.5,
    });
    assert.ok(Math.abs(edges.yesEdge - edges.noEdge) < 0.001);
  });
});

// ---------------------------------------------------------------------------
// suggestPaperTrade
// ---------------------------------------------------------------------------

describe("suggestPaperTrade", () => {
  test("suggests BUY YES when yes-edge clears threshold", () => {
    const input = paperInput({
      modelProbability: 0.8,
      market: marketQuote({ yesAsk: 0.48, noAsk: 0.54 }),
    });
    const result = suggestPaperTrade(input);
    assert.equal(result.decision, "buy");
    assert.equal(result.side, "yes");
    assert.ok(result.edge > 0);
    assert.ok(result.entryPrice !== null);
  });

  test("suggests BUY NO when no-edge clears threshold", () => {
    const input = paperInput({
      modelProbability: 0.2,
      market: marketQuote({ yesAsk: 0.48, noBid: 0.52, noAsk: 0.54 }),
    });
    const result = suggestPaperTrade(input);
    assert.equal(result.decision, "buy");
    assert.equal(result.side, "no");
    assert.ok(result.edge > 0);
  });

  test("suggests SKIP when neither edge clears threshold", () => {
    const input = paperInput({
      modelProbability: 0.5,
      market: marketQuote({ yesAsk: 0.48, noAsk: 0.54 }),
    });
    const result = suggestPaperTrade(input);
    assert.equal(result.decision, "skip");
    assert.equal(result.side, null);
    assert.equal(result.entryPrice, null);
  });

  test("respects custom edgeThreshold", () => {
    const easyInput = paperInput({
      modelProbability: 0.65,
      market: marketQuote({ yesAsk: 0.55 }),
    });
    const strictInput = paperInput({
      modelProbability: 0.65,
      market: marketQuote({ yesAsk: 0.55 }),
      edgeThreshold: 0.1,
    });

    const easy = suggestPaperTrade(easyInput);
    const strict = suggestPaperTrade(strictInput);

    assert.equal(easy.decision, "buy");
    assert.equal(strict.decision, "skip");
  });

  test("prefers the side with higher edge when both clear", () => {
    const input = paperInput({
      modelProbability: 0.95,
      market: marketQuote({ yesAsk: 0.5, noAsk: 0.55 }),
    });
    const result = suggestPaperTrade(input);
    assert.equal(result.side, "yes");
  });

  test("rationale is always non-empty", () => {
    const buyResult = suggestPaperTrade(
      paperInput({
        modelProbability: 0.9,
        market: marketQuote({ yesAsk: 0.45 }),
      }),
    );
    const skipResult = suggestPaperTrade(
      paperInput({
        modelProbability: 0.5,
        market: marketQuote({ yesAsk: 0.48 }),
      }),
    );

    assert.ok(buyResult.rationale.length > 0);
    assert.ok(skipResult.rationale.length > 0);
  });
});

// ---------------------------------------------------------------------------
// buildPaperTradeRow
// ---------------------------------------------------------------------------

describe("buildPaperTradeRow", () => {
  test("builds a complete row with generated id and proposed status", () => {
    const input = paperInput();
    const decision = suggestPaperTrade(input);
    const row = buildPaperTradeRow(input, decision, () => "fixed-id");

    assert.equal(row.id, "fixed-id");
    assert.equal(row.owner, "trader");
    assert.equal(row.contract, "KXBTC-TEST-HIGH");
    assert.equal(row.modelSource, "quant");
    assert.equal(row.barrierType, "high");
    assert.equal(row.status, "proposed");
    assert.equal(row.decision, decision.decision);
    assert.equal(row.side, decision.side);
    assert.equal(row.entryPrice, decision.entryPrice);
    assert.ok(Number.isFinite(row.edge));
    assert.ok(row.evidenceJson.length > 0);
    assert.ok(row.rationale.length > 0);
    assert.equal(row.resolvedAt, null);
    assert.equal(row.outcome, null);
    assert.equal(row.brierScore, null);
    assert.equal(row.pnl, null);
  });

  test("evidenceJson contains barrier type and model source", () => {
    const input = paperInput({ modelSource: "jev", barrierType: "low" });
    const decision = suggestPaperTrade(input);
    const row = buildPaperTradeRow(input, decision, () => "test-id");
    const evidence = JSON.parse(row.evidenceJson);

    assert.equal(evidence.barrierType, "low");
    assert.equal(evidence.modelSource, "jev");
    assert.equal(evidence.modelProbability, input.modelProbability);
  });

  test("skip decisions have null side and entryPrice", () => {
    const input = paperInput({ modelProbability: 0.5, market: marketQuote() });
    const decision = suggestPaperTrade(input);
    const row = buildPaperTradeRow(input, decision, () => "skip-id");

    assert.equal(row.decision, "skip");
    assert.equal(row.side, null);
    assert.equal(row.entryPrice, null);
  });
});

// ---------------------------------------------------------------------------
// scorePaperTrade
// ---------------------------------------------------------------------------

describe("scorePaperTrade", () => {
  function makeTrade(overrides: Partial<PaperTradeRow> = {}): PaperTradeRow {
    const input = paperInput();
    const decision = suggestPaperTrade(input);
    return {
      ...buildPaperTradeRow(input, decision, () => "trade-1"),
      ...overrides,
    };
  }

  test("computes Brier score and P&L when YES trade wins", () => {
    const trade = makeTrade({
      modelProbability: 0.8,
      side: "yes",
      entryPrice: 0.5,
      feeEstimate: 0.025,
      status: "proposed",
    });
    const scored = scorePaperTrade(trade, resolutionFor("YES"));

    assert.equal(scored.scorable, true);
    assert.ok(scored.brierScore !== null);
    assert.ok(Math.abs((scored.brierScore ?? 0) - 0.04) < 0.001); // (0.8 - 1)^2 = 0.04
    assert.ok(scored.pnl !== null);
    assert.ok((scored.pnl ?? 0) > 0); // won: 1 - 0.5 - 0.025 = 0.475
  });

  test("computes negative P&L when YES trade loses", () => {
    const trade = makeTrade({
      modelProbability: 0.8,
      side: "yes",
      entryPrice: 0.5,
      feeEstimate: 0.025,
    });
    const scored = scorePaperTrade(trade, resolutionFor("NO"));

    assert.equal(scored.scorable, true);
    assert.ok(scored.pnl !== null);
    assert.ok((scored.pnl ?? 0) < 0); // lost: 0 - 0.5 - 0.025 = -0.525
  });

  test("scores NO trades against NO outcomes as wins", () => {
    const trade = makeTrade({
      modelProbability: 0.2,
      side: "no",
      entryPrice: 0.5,
      feeEstimate: 0.025,
    });
    const scored = scorePaperTrade(trade, resolutionFor("NO"));

    assert.equal(scored.scorable, true);
    assert.ok((scored.pnl ?? 0) > 0); // won: 1 - 0.5 - 0.025 = 0.475
  });

  test("does not score skipped (no-side) trades", () => {
    const trade = makeTrade({ decision: "skip", side: null, entryPrice: null });
    const scored = scorePaperTrade(trade, resolutionFor("YES"));

    assert.equal(scored.scorable, false);
    assert.equal(scored.brierScore, null);
    assert.equal(scored.pnl, null);
  });

  test("does not score VOID resolutions but remains visible", () => {
    const trade = makeTrade({
      modelProbability: 0.8,
      side: "yes",
      entryPrice: 0.5,
      feeEstimate: 0.025,
    });
    const scored = scorePaperTrade(trade, resolutionFor("VOID"));

    assert.equal(scored.scorable, false);
    assert.equal(scored.brierScore, null);
    assert.equal(scored.pnl, null);
  });

  test("NO trade P&L is negated relative to YES at same price", () => {
    const yesTrade = makeTrade({
      modelProbability: 0.3,
      side: "yes",
      entryPrice: 0.4,
      feeEstimate: 0.02,
    });
    const noTrade = makeTrade({
      modelProbability: 0.3,
      side: "no",
      entryPrice: 0.4,
      feeEstimate: 0.02,
    });

    const yesScored = scorePaperTrade(yesTrade, resolutionFor("YES"));
    const noScored = scorePaperTrade(noTrade, resolutionFor("YES"));

    assert.ok(yesScored.pnl !== null && noScored.pnl !== null);
    // YES wins, NO loses — opposite P&L
    assert.ok((yesScored.pnl ?? 0) > 0);
    assert.ok((noScored.pnl ?? 0) < 0);
  });
});

// ---------------------------------------------------------------------------
// computePaperTrackRecord
// ---------------------------------------------------------------------------

describe("computePaperTrackRecord", () => {
  function tradeRow(overrides: Partial<PaperTradeRow> = {}): PaperTradeRow {
    return {
      id: "t1",
      owner: "trader",
      contract: "C1",
      modelProbability: 0.7,
      modelSource: "quant",
      barrierType: "high",
      side: "yes",
      decision: "buy",
      entryPrice: 0.5,
      breakevenProbability: 0.525,
      edge: 0.175,
      feeEstimate: 0.025,
      rationale: "test",
      evidenceJson: "{}",
      status: "resolved",
      resolvedAt: "2026-09-29T20:15:00.000Z",
      outcome: "YES",
      brierScore: 0.09,
      pnl: 0.475,
      createdAt: "2026-09-29T20:00:00.000Z",
      ...overrides,
    };
  }

  test("counts total, buy, and skip decisions", () => {
    const trades = [
      tradeRow({
        id: "buy-yes",
        decision: "buy",
        side: "yes",
        status: "proposed",
      }),
      tradeRow({
        id: "buy-no",
        decision: "buy",
        side: "no",
        status: "proposed",
      }),
      tradeRow({
        id: "skip1",
        decision: "skip",
        side: null,
        status: "proposed",
      }),
      tradeRow({
        id: "skip2",
        decision: "skip",
        side: null,
        status: "proposed",
      }),
    ];

    const record = computePaperTrackRecord(trades, new Map());
    assert.equal(record.total, 4);
    assert.equal(record.buy, 2);
    assert.equal(record.skip, 2);
    assert.equal(record.yesTrades, 1);
    assert.equal(record.noTrades, 1);
  });

  test("computes win rate, average P&L, and Brier from resolved trades", () => {
    const trades = [
      tradeRow({
        id: "w1",
        status: "resolved",
        outcome: "YES",
        brierScore: 0.01,
        pnl: 0.475,
        side: "yes",
      }),
      tradeRow({
        id: "l1",
        status: "resolved",
        outcome: "NO",
        brierScore: 0.81,
        pnl: -0.525,
        side: "yes",
      }),
      tradeRow({ id: "u1", status: "proposed", side: "yes" }),
    ];

    const record = computePaperTrackRecord(trades, new Map());
    assert.equal(record.resolved, 2);
    assert.equal(record.winRate, 0.5);
    assert.ok(Math.abs((record.averagePnl ?? 0) - -0.025) < 0.001);
    assert.ok(Math.abs((record.averageBrierScore ?? 0) - 0.41) < 0.001);
    assert.equal(record.bestTrade, 0.475);
    assert.equal(record.worstTrade, -0.525);
  });

  test("returns null stats when nothing is resolved yet", () => {
    const trades = [
      tradeRow({ id: "w1", status: "proposed" }),
      tradeRow({ id: "w2", status: "proposed" }),
    ];

    const record = computePaperTrackRecord(trades, new Map());
    assert.equal(record.resolved, 0);
    assert.equal(record.winRate, null);
    assert.equal(record.averagePnl, null);
    assert.equal(record.averageBrierScore, null);
  });

  test("never scores VOID-resolved trades", () => {
    const trades = [
      tradeRow({
        id: "v1",
        status: "resolved",
        outcome: "VOID",
        brierScore: null,
        pnl: null,
      }),
      tradeRow({
        id: "w1",
        status: "resolved",
        outcome: "YES",
        brierScore: 0.04,
        pnl: 0.475,
      }),
    ];

    const record = computePaperTrackRecord(trades, new Map());
    assert.equal(record.resolved, 2);
    assert.equal(record.winRate, 1);
    assert.ok(Math.abs((record.averageBrierScore ?? 0) - 0.04) < 0.001);
  });
});
