import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateBrierScore,
  createMissionThesis,
  settleMissionEntry,
  parseKalshiCsvToMissions,
  summarizeMissionLogs,
  getSampleMissionLogs,
} from "../lib/mission-log.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 4 Task 4.4 Acceptance: Mission Log (Thesis, CSV Import, Fees Avoidable, Personal Brier)", () => {
  const html = renderFlightDeckPageHtml({ initialStation: "mission-log" });

  describe("Thesis → Trade → Settle Lifecycle", () => {
    test("Creating a thesis computes max loss and awards +15 XP discipline", () => {
      const entry = createMissionThesis({
        ticker: "KXBTC15M-91250",
        side: "yes",
        assessedProbability: 0.58,
        contracts: 10,
        price: 0.51,
        thesis: "Constituent orderbook bid depth wall holding firm.",
        orderType: "taker",
      });

      assert.equal(entry.status, "THESIS_STAGED");
      assert.equal(entry.ticker, "KXBTC15M-91250");
      assert.equal(entry.side, "yes");
      assert.equal(entry.contracts, 10);
      assert.equal(entry.plannedPrice, 0.51);
      assert.equal(entry.feesPaid, 0.18, "Taker fee for 10ct @ $0.51 is $0.18");
      assert.equal(entry.maxLoss, 5.28, "Max loss is outlay ($5.10) + fee ($0.18) = $5.28");
      assert.equal(entry.xpAwarded, 15, "+15 XP for pre-flight written thesis");
    });

    test("Maker order role saves 100% taker fee and awards maker discipline bonus (+40 XP)", () => {
      const entry = createMissionThesis({
        ticker: "KXBTC15M-91250",
        side: "yes",
        assessedProbability: 0.55,
        contracts: 10,
        price: 0.51,
        thesis: "Posting passive liquidity at 51¢ bid.",
        orderType: "maker",
      });

      assert.equal(entry.feesPaid, 0.00, "Maker limit order incurs $0.00 fee");
      assert.equal(entry.maxLoss, 5.10, "Max loss is strictly executable outlay ($5.10)");
      assert.equal(entry.xpAwarded, 55, "Thesis (+15 XP) + Maker limit bonus (+40 XP) = 55 XP");
    });

    test("Settling a mission computes squared Brier error and awards +50 XP calibration review", () => {
      const staged = createMissionThesis({
        ticker: "KXBTC15M-91250",
        side: "yes",
        assessedProbability: 0.60,
        contracts: 10,
        price: 0.50,
        thesis: "Test settlement",
      });

      const settledWin = settleMissionEntry(staged, "YES");
      assert.equal(settledWin.status, "SETTLED");
      assert.equal(settledWin.settledOutcome, "YES");
      // Brier error: (0.60 - 1.0)^2 = (-0.40)^2 = 0.1600
      assert.equal(settledWin.brierError, 0.1600);
      assert.equal(settledWin.xpAwarded, staged.xpAwarded + 50, "+50 XP for calibration review");

      const settledLoss = settleMissionEntry(staged, "NO");
      // Brier error on loss: (0.60 - 0.0)^2 = 0.3600
      assert.equal(settledLoss.brierError, 0.3600);
    });
  });

  describe("Personal Brier Scoring Calibration Engine", () => {
    test("Calculates Brier Score Mean Squared Error accurately", () => {
      const items: { assessedProb: number; outcome: 1 | 0 }[] = [
        { assessedProb: 0.70, outcome: 1 }, // (0.70 - 1)^2 = 0.09
        { assessedProb: 0.30, outcome: 0 }, // (0.30 - 0)^2 = 0.09
        { assessedProb: 0.80, outcome: 1 }, // (0.80 - 1)^2 = 0.04
        { assessedProb: 0.40, outcome: 0 }, // (0.40 - 0)^2 = 0.16
      ];
      // Mean = (0.09 + 0.09 + 0.04 + 0.16) / 4 = 0.38 / 4 = 0.0950
      const score = calculateBrierScore(items);
      assert.equal(score, 0.0950);
    });

    test("Empty items array returns null for Brier score", () => {
      assert.equal(calculateBrierScore([]), null);
    });
  });

  describe("Kalshi CSV Statement Importer", () => {
    test("Parses standard Kalshi trade CSV into MissionLogEntry records and tallies fees", () => {
      const csv = `date,ticker,side,count,price,fee,type
2026-10-09T18:00:00Z,KXBTC15M-91250,yes,10,0.51,0.18,taker
2026-10-09T17:45:00Z,KXBTC15M-91000,yes,20,0.68,0.00,maker
2026-10-09T17:30:00Z,KXBTC15M-91500,no,15,0.32,0.23,taker`;

      const result = parseKalshiCsvToMissions(csv);

      assert.equal(result.entries.length, 3);
      assert.equal(result.totalFeesPaid, 0.41, "$0.18 + $0.00 + $0.23 = $0.41");
      assert.equal(result.totalAvoidableFees, 0.41, "Taker fees could have been avoided via maker");
      assert.equal(result.entries[0].ticker, "KXBTC15M-91250");
      assert.equal(result.entries[0].orderType, "taker");
      assert.equal(result.entries[1].orderType, "maker");
      assert.equal(result.entries[1].feesPaid, 0.00);
      assert.equal(result.entries[0].reconciledSource, "KALSHI_CSV");
    });

    test("Rejects empty or invalid CSV files gracefully", () => {
      const result = parseKalshiCsvToMissions("just,one,line");
      assert.equal(result.entries.length, 0);
      assert.ok(result.errors.length > 0);
    });
  });

  describe("Mission Log Summary Metrics", () => {
    test("Computes correct aggregate stats for sample mission dataset", () => {
      const samples = getSampleMissionLogs();
      const summary = summarizeMissionLogs(samples);

      assert.equal(summary.totalMissions, 4);
      assert.equal(summary.settledMissions, 3);
      assert.ok(summary.personalBrier !== null && summary.personalBrier < 0.2500, "Personal Brier beats coin-flip");
      assert.equal(summary.coinFlipBrier, 0.2500);
      assert.equal(summary.marketMidpointBrier, 0.2001);
      assert.ok(summary.makerPct > 0);
      assert.ok(summary.disciplineScorePct > 0);
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=mission-log)", () => {
    test("Mission Log panel is active and contains header", () => {
      assert.match(html, /<section[^>]*id=["']station-panel-mission-log["'][^>]*class=["'][^"']*active[^"']*["']|<section[^>]*class=["'][^"']*active[^"']*["'][^>]*id=["']station-panel-mission-log["']/i);
      assert.match(html, /Mission Log Station/i);
      assert.match(html, /Captain's Log/i);
    });

    test("Top 4 ledger metric cards are present", () => {
      assert.match(html, /id=["']ml-stat-total-count["']/i);
      assert.match(html, /id=["']ml-stat-brier-val["']/i);
      assert.match(html, /id=["']ml-stat-avoidable-fees["']/i);
      assert.match(html, /id=["']ml-stat-discipline-xp["']/i);
      assert.match(html, /0\.2001/i, "Market mid benchmark must be displayed");
      assert.match(html, /0\.2500/i, "Coin-flip baseline must be displayed");
    });

    test("Stage New Mission Thesis card (#mission-stage-pod) is rendered with inputs and button", () => {
      assert.match(html, /id=["']mission-stage-pod["']/i);
      assert.match(html, /id=["']ml-input-ticker["']/i);
      assert.match(html, /id=["']ml-select-side["']/i);
      assert.match(html, /id=["']ml-slider-price["']/i);
      assert.match(html, /id=["']ml-slider-count["']/i);
      assert.match(html, /id=["']ml-slider-prob["']/i);
      assert.match(html, /id=["']ml-select-role["']/i);
      assert.match(html, /id=["']ml-input-thesis["']/i);
      assert.match(html, /id=["']ml-calc-max-loss["']/i);
      assert.match(html, /id=["']btn-stage-thesis["']/i);
      assert.match(html, /\+15 XP/i);
    });

    test("Kalshi CSV statement importer (#mission-csv-importer) is rendered", () => {
      assert.match(html, /id=["']mission-csv-importer["']/i);
      assert.match(html, /id=["']ml-csv-textarea["']/i);
      assert.match(html, /id=["']btn-ingest-csv["']/i);
      assert.match(html, /id=["']ml-csv-results["']/i);
      assert.match(html, /loadSampleKalshiCsv/i);
    });

    test("Personal Brier Calibration card (#mission-calibration-card) is rendered", () => {
      assert.match(html, /id=["']mission-calibration-card["']/i);
      assert.match(html, /id=["']brier-main-gauge["']/i);
      assert.match(html, /id=["']brier-personal-chip["']/i);
      assert.match(html, /\+100 XP REWARD FOR 30-DAY IMPROVEMENT/i);
    });

    test("Mission Log Journal Table (#mission-log-table) is rendered with rows", () => {
      assert.match(html, /id=["']mission-log-table["']/i);
      assert.match(html, /id=["']mission-log-tbody["']/i);
      assert.match(html, /KXBTC15M-91250/i);
      assert.match(html, /MAKER/i);
      assert.match(html, /TAKER/i);
    });

    test("Client-side interactive JavaScript functions are defined", () => {
      assert.match(html, /function\s+stageNewThesis\s*\(/i);
      assert.match(html, /function\s+settleMissionClient\s*\(/i);
      assert.match(html, /function\s+loadSampleKalshiCsv\s*\(/i);
      assert.match(html, /function\s+ingestKalshiCsv\s*\(/i);
    });
  });
});
