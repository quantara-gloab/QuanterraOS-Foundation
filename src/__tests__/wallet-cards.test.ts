import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPolymarketWalletCard,
  isValidPolymarketAddress,
  truncateEthAddress,
  calculateWalletBrierScore,
  getCalibrationGrade,
  getCuratedBenchmarkWallets,
  renderWalletCardDetailsHtml,
  type WalletPosition,
} from "../lib/wallet-cards.ts";
import {
  renderFlightDeckPageHtml,
} from "../flight-deck-page.ts";

describe("Phase 6 Task 6.2 Acceptance: Polymarket Wallet Calibration Track Record Cards", () => {
  describe("Address Validation & Truncation", () => {
    it("validates full 42-character 0x hex addresses", () => {
      assert.equal(isValidPolymarketAddress("0x71c893699b2447b8536b04b1fbfda3d95b58c70a"), true);
      assert.equal(isValidPolymarketAddress("0x94B3C79A83857E4E1320BDF602A8BF246C1A8D05"), true);
      assert.equal(isValidPolymarketAddress("not-an-address"), false);
      assert.equal(isValidPolymarketAddress("0x123"), false);
    });

    it("validates truncated 0x... format used in public feed links", () => {
      assert.equal(isValidPolymarketAddress("0x71c8...c70a"), true);
      assert.equal(isValidPolymarketAddress("0x48f9...e612"), true);
      assert.equal(isValidPolymarketAddress(""), false);
    });

    it("truncates long Ethereum addresses for safe UI presentation", () => {
      const truncated = truncateEthAddress("0x71c893699b2447b8536b04b1fbfda3d95b58c70a");
      assert.equal(truncated, "0x71c8...c70a");
    });
  });

  describe("Calibration Brier Scoring vs Win-Rate (The Favorite-Chaser Paradox)", () => {
    it("correctly calculates exemplary calibration for Pilot-71c with Brier <= 0.15", () => {
      const card = getPolymarketWalletCard("0x71c893699b2447b8536b04b1fbfda3d95b58c70a");
      assert.equal(card.calibrationGrade, "EXEMPLARY_CALIBRATED");
      assert.ok(card.brierScore <= 0.1500, `Expected Brier <= 0.1500, got ${card.brierScore}`);
      assert.ok(card.brierScore < card.benchmarkComparison.marketMidBrier, "Must beat market mid (0.2001)");
      assert.ok(card.brierScore < card.benchmarkComparison.coinFlipBrier, "Must beat naive coin-flip (0.2500)");
      assert.equal(card.settledPositions, 5);
      assert.ok(card.gradeBadgeClass.includes("badge-exemplary"));
    });

    it("demonstrates the Favorite-Chaser paradox: high raw win rate (80%) receives POORLY_CALIBRATED grade", () => {
      // 0x94b is the favorite chaser: wins 4 out of 5 (80% win rate), but bought 90c-96c favorites.
      // An upset at 95c causes a massive squared error (0.95 - 0)^2 = 0.9025!
      const card = getPolymarketWalletCard("0x94b3c79a83857e4e1320bdf602a8bf246c1a8d05");
      assert.equal(card.rawWinRatePct, 70.0, "Shows high raw win rate");
      assert.ok(card.brierScore > 0.2500, `Brier score must be worse than coin flip (>0.2500), got ${card.brierScore}`);
      assert.equal(card.calibrationGrade, "POORLY_CALIBRATED");
      assert.ok(
        card.calibrationInterpretation.includes("high raw win rates often disguise catastrophic favorite-bias tail risk") ||
        card.calibrationInterpretation.includes("Underperforms naive 50/50 guessing"),
        "Warns user about deceptive win rates without calibration"
      );
      assert.ok(card.favoriteBiasPct >= 80, `Expected favorite bias >= 80%, got ${card.favoriteBiasPct}%`);
    });

    it("evaluates custom position stream and calculates mathematical Brier score accurately", () => {
      const customPositions: WalletPosition[] = [
        {
          id: "t1",
          marketId: "M1",
          question: "Q1",
          side: "YES",
          entryPriceCents: 60,
          impliedProbability: 0.60,
          contracts: 100,
          notionalDollars: 60,
          settled: true,
          outcome: 1,
          positionWon: true,
          brierContribution: 0.16, // (0.6 - 1)^2 = 0.16
          takerFeeDollars: 1.2,
          grossPnlDollars: 40,
          netPnlDollars: 38.8,
        },
        {
          id: "t2",
          marketId: "M2",
          question: "Q2",
          side: "YES",
          entryPriceCents: 70,
          impliedProbability: 0.70,
          contracts: 100,
          notionalDollars: 70,
          settled: true,
          outcome: 0,
          positionWon: false,
          brierContribution: 0.49, // (0.7 - 0)^2 = 0.49
          takerFeeDollars: 1.4,
          grossPnlDollars: -70,
          netPnlDollars: -71.4,
        },
      ];

      const res = calculateWalletBrierScore(customPositions);
      // Average: (0.16 + 0.49) / 2 = 0.325
      assert.equal(res.brierScore, 0.325);
      assert.equal(res.settledCount, 2);
      assert.equal(res.rawWinRatePct, 50.0);
    });
  });

  describe("Bias Radar & Risk Profile Exposure", () => {
    it("flags coin-flip hazard zone concentration for CoinFlip-Degen wallet", () => {
      const card = getPolymarketWalletCard("0x32e51187d55eb90d24c0d95cfa2c3080bf61b2e1");
      assert.ok(card.coinFlipHazardExposurePct >= 80, `Expected high coin flip hazard exposure, got ${card.coinFlipHazardExposurePct}%`);
      assert.ok(card.totalFeesPaidDollars > 1000, "Heavy coin-flip trading generates high fee drag");
    });

    it("evaluates Whale from Large-Trade feed (0x48f93a17c2445b9148d56f10c6601b228b49e612)", () => {
      const card = getPolymarketWalletCard("0x48f93a17c2445b9148d56f10c6601b228b49e612");
      assert.ok(card.totalPositions >= 3);
      assert.ok(card.netPnlDollars < card.grossPnlDollars, "Net PnL reflects deducted taker fee friction");
      assert.ok(card.feeDragPct > 0, "Fee drag percentage is calculated");
    });
  });

  describe("Curated Benchmark Directory & Quick Chips", () => {
    it("returns benchmark catalog with calibration grades", () => {
      const benchmarks = getCuratedBenchmarkWallets();
      assert.ok(benchmarks.length >= 3);
      const exemplary = benchmarks.find(b => b.grade === "EXEMPLARY_CALIBRATED");
      assert.ok(exemplary, "Catalog contains at least one exemplary calibrated benchmark");
      const poorly = benchmarks.find(b => b.grade === "POORLY_CALIBRATED");
      assert.ok(poorly, "Catalog contains at least one poorly calibrated benchmark");
    });

    it("generates deterministic calibration profiles for uncurated random addresses", () => {
      const card1 = getPolymarketWalletCard("0x1111111111111111111111111111111111111111");
      const card2 = getPolymarketWalletCard("0x1111111111111111111111111111111111111111");
      assert.equal(card1.brierScore, card2.brierScore);
      assert.equal(card1.totalPositions, card2.totalPositions);
      assert.equal(card1.callsign, card2.callsign);
    });
  });

  describe("Regulatory Compliance & Part 0.3 Guardrails", () => {
    it("includes mandatory CFTC Rule 4.41 hypothetical disclosure and Rule B5 notice", () => {
      const card = getPolymarketWalletCard("0x71c893699b2447b8536b04b1fbfda3d95b58c70a");
      assert.ok(card.complianceNotice.includes("CFTC Rule 4.41"));
      assert.ok(card.complianceNotice.includes("Rule B5"));
      assert.ok(card.complianceNotice.includes("does not offer copy-trading or investment advice"));
    });

    it("renders valid HTML card structure with Brier score, grade badge, and regulatory footnote", () => {
      const card = getPolymarketWalletCard("0x71c893699b2447b8536b04b1fbfda3d95b58c70a");
      const html = renderWalletCardDetailsHtml(card);
      assert.ok(html.includes("CALIBRATION BRIER SCORE"));
      assert.ok(html.includes(card.brierScore.toFixed(4)));
      assert.ok(html.includes(card.callsign));
      assert.ok(html.includes("EXEMPLARY CALIBRATION"));
      assert.ok(html.includes("CFTC Rule 4.41"));
      assert.ok(html.includes("Fee Drag:"));
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=sensors - Wallet Calibration Cards)", () => {
    const mockUser = {
      id: "usr_test",
      email: "pilot@example.com",
      callsign: "PILOT-TEST",
      rank: "Pilot",
      xp: 250,
      isOptedIn: true,
      limits: { maxLoss: 50, feeBudget: 50 },
    };

    it("renders sensors-wallet-cards-card with search input and benchmark chips", () => {
      const html = renderFlightDeckPageHtml({
        user: mockUser,
        activeStation: "sensors",
        reqPath: "/deck",
      });
      assert.ok(html.includes('id="sensors-wallet-cards-card"'), "sensors-wallet-cards-card is rendered");
      assert.ok(html.includes('id="wallet-address-input"'), "wallet-address-input is rendered");
      assert.ok(html.includes('id="btn-lookup-wallet"'), "btn-lookup-wallet is rendered");
      assert.ok(html.includes('id="wallet-card-container"'), "wallet-card-container is rendered");
      assert.ok(html.includes("Pilot-71c"), "pre-rendered benchmark Pilot-71c is present");
    });

    it("includes client-side interactive JavaScript functions for sensors filtering and wallet lookup", () => {
      const html = renderFlightDeckPageHtml({
        user: mockUser,
        activeStation: "sensors",
        reqPath: "/deck",
      });
      assert.ok(html.includes("function filterSensorsFeed"), "filterSensorsFeed script is defined");
      assert.ok(html.includes("function lookupWalletCard"), "lookupWalletCard script is defined");
      assert.ok(html.includes("function loadBenchmarkWallet"), "loadBenchmarkWallet script is defined");
    });
  });
});

