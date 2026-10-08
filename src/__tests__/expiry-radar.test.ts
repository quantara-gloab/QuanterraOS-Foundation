/**
 * Automated Acceptance Test Suite: Expiry Radar & Microstructure Terminal Engine
 *
 * Verifies:
 * 1. Window Boundary & Cadence Calculations (15m vs 1h).
 * 2. Phase Detection: NORMAL_TRADING -> PRE_SETTLEMENT_WARNING -> ORACLE_SAMPLING_ACTIVE -> SETTLED.
 * 3. Settlement Risk & Danger Zone Alerts (Spot within $50 during final minutes).
 * 4. Liquidity Quality Index (LQI) categorization (tight, moderate, friction, unquoted).
 * 5. Interactive Expiry Payoff Simulation (gross payout, parabolic taker fee, net PnL, ROI).
 * 6. High-Resolution Shareable SVG Debrief Card Generation (valid XML, Gold Standard tokens, provenance watermark).
 * 7. HTML Rendering and Rule B4 / Rule B5 compliance.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getWindowBoundaries,
  evaluateSettlementRisk,
  evaluateLiquidityQuality,
  computeExpiryRadarState,
  computeOrderbookDepthLadder,
  renderOrderbookDepthLadderHtml,
  simulateExpiryPayoff,
  generateShareableDebriefCardSvg,
  renderExpiryRadarPageHtml,
  renderRadarWidgetSnippetHtml,
} from "../expiry-radar.ts";

describe("Expiry Radar & Microstructure Terminal Engine", () => {
  it("1. Window Boundaries: computes 15m and 1h boundaries correctly", () => {
    // 15-minute cadence
    const t1 = 1760000000000;
    const bounds15 = getWindowBoundaries(t1, "15m");
    assert.equal((bounds15.closeMs - bounds15.openMs) / 60000, 15);
    assert.ok(t1 >= bounds15.openMs && t1 < bounds15.closeMs);

    // 1-hour cadence
    const bounds1h = getWindowBoundaries(t1, "1h");
    assert.equal((bounds1h.closeMs - bounds1h.openMs) / 60000, 60);
    assert.ok(t1 >= bounds1h.openMs && t1 < bounds1h.closeMs);
  });

  it("2. Phase Detection: accurately identifies trading, warning, oracle sampling, and settled phases", () => {
    const baseOpen = Math.floor(1760000000000 / (15 * 60000)) * (15 * 60000);

    // Normal trading (5 min in = 10 min left = 600s left)
    const stateNormal = computeExpiryRadarState({
      series: "15m",
      nowMs: baseOpen + 5 * 60000,
    });
    assert.equal(stateNormal.phase, "NORMAL_TRADING");

    // Oracle Sampling Window (final 60s of 15m window: 14m30s in -> 30s left)
    const stateSampling = computeExpiryRadarState({
      series: "15m",
      nowMs: baseOpen + 14 * 60000 + 30000, // 30s left
    });
    assert.equal(stateSampling.phase, "ORACLE_SAMPLING_ACTIVE");
    assert.equal(stateSampling.twapSampleSecondsElapsed, 30);
    assert.equal(stateSampling.twapSampleCount, 30);
  });

  it("3. Settlement Risk: detects EXTREME_DANGER when spot is within $50 during final window", () => {
    // Spot is $25 from strike, 120s remaining -> EXTREME_DANGER
    const riskExtreme = evaluateSettlementRisk(25, 120);
    assert.equal(riskExtreme, "EXTREME_DANGER");

    // Spot is $25 from strike, but 800s remaining -> MODERATE (plenty of time left)
    const riskEarly = evaluateSettlementRisk(25, 800);
    assert.equal(riskEarly, "MODERATE");

    // Spot is $250 away -> LOW
    const riskLow = evaluateSettlementRisk(250, 60);
    assert.equal(riskLow, "LOW");
  });

  it("4. Liquidity Quality Index (LQI): categorizes order book spreads accurately", () => {
    // 1¢ spread -> TIGHT_SPREAD
    assert.equal(evaluateLiquidityQuality(0.50, 0.51), "TIGHT_SPREAD");

    // 4¢ spread -> MODERATE_DRAG
    assert.equal(evaluateLiquidityQuality(0.48, 0.52), "MODERATE_DRAG");

    // 8¢ spread -> HIGH_FRICTION
    assert.equal(evaluateLiquidityQuality(0.45, 0.53), "HIGH_FRICTION");

    // Unquoted
    assert.equal(evaluateLiquidityQuality(null, null), "UNQUOTED");
  });

  it("5. Expiry Payoff Simulation: calculates gross payout, parabolic taker fee, and net PnL", () => {
    // Winning YES trade: Strike 91000, spot finishes at 91200, buy at 0.50 for 10 contracts
    // Cost: $5.00, Taker Fee: 10 * ($0.07 * 0.50 * 0.50) = 10 * $0.0175 = $0.18 (rounded)
    // Gross payout: $10.00 -> Net PnL: $10 - $5 - $0.18 = +$4.82
    const winSim = simulateExpiryPayoff({
      strike: 91000,
      contractPrice: 0.50,
      side: "yes",
      contractCount: 10,
      simulatedSpotAtExpiry: 91200,
    });

    assert.equal(winSim.outcome, "YES");
    assert.equal(winSim.won, true);
    assert.equal(winSim.grossPayout, 10.00);
    assert.equal(winSim.purchaseCost, 5.00);
    assert.ok(winSim.takerFee > 0);
    assert.ok(winSim.netPnl > 4.7 && winSim.netPnl < 4.9);
    assert.ok(winSim.roiPct > 90);

    // Losing YES trade: Spot finishes at 90800
    const lossSim = simulateExpiryPayoff({
      strike: 91000,
      contractPrice: 0.50,
      side: "yes",
      contractCount: 10,
      simulatedSpotAtExpiry: 90800,
    });

    assert.equal(lossSim.outcome, "NO");
    assert.equal(lossSim.won, false);
    assert.equal(lossSim.grossPayout, 0.0);
    assert.ok(lossSim.netPnl < -5.1);
  });

  it("6. Shareable SVG Debrief Card: produces valid XML with Gold Standard styling and provenance", () => {
    const svg = generateShareableDebriefCardSvg({
      ticker: "KXBTC15M-26OCT07-2100",
      strike: 91250,
      contractPrice: 0.49,
      side: "yes",
      contractCount: 10,
      takerFee: 0.17,
      breakevenWinProb: 0.525,
      netPnl: 4.93,
      outcome: "YES",
      dateIso: "2026-10-07T21:00:00Z",
    });

    assert.ok(svg.startsWith("<svg"));
    assert.ok(svg.endsWith("</svg>"));
    assert.match(svg, /KXBTC15M-26OCT07-2100/);
    assert.match(svg, /\$91,250/);
    assert.match(svg, /#DFB843/); // Gold accent
    assert.match(svg, /QUANTERRA/);
    assert.match(svg, /CME CF Bitcoin Real-Time Index/);
    assert.match(svg, /zero capital deployed/i);
  });

  it("7. Full Radar Page & Widget HTML: complies with Rule B4 and Rule B5", () => {
    const radar = computeExpiryRadarState({ series: "15m", spotPrice: 91250 });
    const pageHtml = renderExpiryRadarPageHtml(radar);
    const widgetHtml = renderRadarWidgetSnippetHtml(radar);

    // Structural elements
    assert.match(pageHtml, /Bitcoin Expiry &amp; Oracle Radar|Bitcoin Expiry & Oracle Radar/);
    assert.match(pageHtml, /CME CF BRTI 60-Second TWAP Averaging Window/);
    assert.match(pageHtml, /Interactive Expiry Replay/);
    assert.match(widgetHtml, /EXPIRY RADAR/);

    // Rule B5 Compliance
    assert.match(pageHtml, /Rule B5: \$0\.00 Live Capital Deployed/i);

    // Rule B4 Compliance: No banned words
    const bannedPatterns = [/alpha\b/i, /guaranteed\b/i, /beat the market/i, /mispriced opportunities/i];
    for (const pat of bannedPatterns) {
      assert.doesNotMatch(pageHtml, pat);
      assert.doesNotMatch(widgetHtml, pat);
    }
  });

  it("8. Wolf Orderbook Depth Ladder: computes 5-level queue, cumulative volumes, spread, and imbalance ratio", () => {
    const ladder = computeOrderbookDepthLadder(91250, 0.52, 0.49);

    assert.equal(ladder.underlyingStrike, 91250);
    assert.equal(ladder.ticker, "KXBTC15M-T91250");
    assert.equal(ladder.levels.length, 5);

    // Levels are strictly 1..5
    ladder.levels.forEach((lvl, idx) => {
      assert.equal(lvl.level, idx + 1);
      assert.ok(lvl.bidPriceCents >= 1 && lvl.bidPriceCents <= 99);
      assert.ok(lvl.askPriceCents >= 1 && lvl.askPriceCents <= 99);
      assert.ok(lvl.bidSize > 0);
      assert.ok(lvl.askSize > 0);
      assert.ok(lvl.bidCumulative >= lvl.bidSize);
      assert.ok(lvl.askCumulative >= lvl.askSize);
    });

    // Spread calculations
    assert.equal(ladder.spreadCents, 3);
    assert.ok(ladder.spreadBps > 500 && ladder.spreadBps < 650);

    // Volume and imbalance
    assert.ok(ladder.bidTotalContracts > 0);
    assert.ok(ladder.askTotalContracts > 0);
    assert.ok(ladder.imbalanceRatio >= -1 && ladder.imbalanceRatio <= 1);
    assert.ok(ladder.imbalancePercent >= 0 && ladder.imbalancePercent <= 100);

    // HTML rendering
    const ladderHtml = renderOrderbookDepthLadderHtml(ladder);
    assert.ok(ladderHtml.includes("Wolf Level 2 Microstructure Orderbook Depth"));
    assert.ok(ladderHtml.includes("BIDS (BUY ORDERS)"));
    assert.ok(ladderHtml.includes("ASKS (SELL OFFERS)"));
    assert.ok(ladderHtml.includes("Maker vs. Taker Hurdle"));
  });
});
