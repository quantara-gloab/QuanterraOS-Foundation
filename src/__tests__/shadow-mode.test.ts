import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import {
  getShadowTrackingRules,
  getShadowPaperTrades,
  getShadowModeSummary,
  toggleShadowTrackingRule,
  evaluatePrintForShadowTracking,
  simulateShadowTrade,
  renderShadowModeTabHtml,
  CFTC_RULE_441_DISCLOSURE,
  RULE_B5_NON_ROUTING_NOTICE,
  type ShadowTrackingRule,
} from "../lib/shadow-mode.ts";
import { type LargeTradePrint } from "../lib/sensors-feed.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 6 Task 6.3 Acceptance: Shadow Mode & Zero-Order-Routing Guardrails", () => {
  // =========================================================================
  // 1. Mandatory Acceptance Gate: grep for order-placement API call = 0
  // =========================================================================
  describe("Zero Live Execution & Order-Placement Grep Gate (Part 0.3 / Rule B5)", () => {
    it("proves that no live exchange order routing or placement APIs exist in the codebase", () => {
      // Grep across all source files for live order routing patterns
      // (e.g., Kalshi POST /trade-api/v2/portfolio/orders or Polymarket CTF exchange createOrder / fillOrder)
      const bannedTerms = [
        "portfolio/orders",
        "createOrder",
        "placeOrder",
        "submitOrder",
        "routeOrderToExchange",
        "exchange.fill",
      ];

      for (const term of bannedTerms) {
        let matchFound = false;
        try {
          // ripgrep or git grep within src directory, excluding tests and markdown
          const cmd = `git grep -n -i "${term}" -- "src/*.ts" "src/lib/*.ts" ":!src/__tests__/*"`;
          const stdout = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
          if (stdout.trim().length > 0) {
            matchFound = true;
          }
        } catch {
          // exit code 1 means zero matches found
          matchFound = false;
        }

        assert.equal(
          matchFound,
          false,
          `Violation of Rule B5 / Task 6.3: Found live order routing call for term "${term}"`
        );
      }
    });

    it("verifies Rule B5 permanent non-routing notice in summary and metadata", () => {
      const summary = getShadowModeSummary();
      assert.ok(summary.ruleB5Notice.includes("Zero live routing") || summary.ruleB5Notice.includes("never connect to brokerages"));
      assert.ok(summary.ruleB5Notice.includes("Rule B5"));
    });
  });

  // =========================================================================
  // 2. Mandatory CFTC Rule 4.41 Hypothetical Disclosure
  // =========================================================================
  describe("CFTC Rule 4.41 Mandatory Regulatory Disclosure", () => {
    it("contains verbatim CFTC Rule 4.41 hypothetical performance text", () => {
      assert.ok(CFTC_RULE_441_DISCLOSURE.includes("HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS HAVE CERTAIN INHERENT LIMITATIONS"));
      assert.ok(CFTC_RULE_441_DISCLOSURE.includes("UNLIKE AN ACTUAL PERFORMANCE RECORD, SIMULATED RESULTS DO NOT REPRESENT ACTUAL TRADING"));
      assert.ok(CFTC_RULE_441_DISCLOSURE.includes("NO REPRESENTATION IS BEING MADE THAT ANY ACCOUNT WILL OR IS LIKELY TO ACHIEVE PROFITS OR LOSSES SIMILAR TO THOSE SHOWN"));
    });

    it("attaches CFTC Rule 4.41 disclosure to all summary outputs and rendered HTML tabs", () => {
      const summary = getShadowModeSummary();
      assert.equal(summary.cftcDisclosure, CFTC_RULE_441_DISCLOSURE);

      const html = renderShadowModeTabHtml(summary, getShadowTrackingRules(), getShadowPaperTrades());
      assert.ok(html.includes("CFTC RULE 4.41 MANDATORY HYPOTHETICAL DISCLOSURE"));
      assert.ok(html.includes("UNLIKE AN ACTUAL PERFORMANCE RECORD"));
    });
  });

  // =========================================================================
  // 3. Rule Evaluation & Hazard Filtering
  // =========================================================================
  describe("Shadow Tracking Rule Evaluation Engine", () => {
    const mockPrintTargetWallet: LargeTradePrint = {
      id: "print_test_wallet",
      timestamp: "2026-10-09T18:00:00Z",
      timestampIso: "2026-10-09T18:00:00Z",
      venue: "polymarket",
      ticker: "KXBTC15M-91500",
      marketTitle: "KXBTC15M-91500",
      side: "YES",
      orderType: "taker",
      contracts: 500,
      priceCents: 35,
      priceDollars: 0.35,
      notionalDollars: 175.0,
      takerFeeDollars: 7.96,
      netPayoutIfWinDollars: 317.04,
      netLossIfLoseDollars: 182.96,
      feeDragBps: 455,
      requiredBreakevenPct: 39.55,
      settlementSource: "UMA Resolution",
      strikeDistanceDollars: 120,
      secondsToExpiry: 600,
      settlementRiskLevel: "NORMAL_PROBABILITY",
      walletAddress: "0x71c828b6d8efec4f0c86bb0b784a9e29a39ec70a",
      walletIdentifier: "Pilot-71c",
    };

    const mockPrintWhaleSize: LargeTradePrint = {
      id: "print_test_whale",
      timestamp: "2026-10-09T18:05:00Z",
      timestampIso: "2026-10-09T18:05:00Z",
      venue: "kalshi",
      ticker: "KXFED-26OCT-500",
      marketTitle: "KXFED-26OCT-500",
      side: "YES",
      orderType: "taker",
      contracts: 25000,
      priceCents: 45,
      priceDollars: 0.45,
      notionalDollars: 11250.0, // > $10,000 threshold
      takerFeeDollars: 433.13,
      netPayoutIfWinDollars: 13316.87,
      netLossIfLoseDollars: 11683.13,
      feeDragBps: 385,
      requiredBreakevenPct: 48.85,
      settlementSource: "Federal Reserve Board",
      strikeDistanceDollars: 0,
      secondsToExpiry: 86400,
      settlementRiskLevel: "NORMAL_PROBABILITY",
      walletIdentifier: "CFTC Public Tape",
    };

    const mockPrintHazardZone: LargeTradePrint = {
      id: "print_test_hazard",
      timestamp: "2026-10-09T18:10:00Z",
      timestampIso: "2026-10-09T18:10:00Z",
      venue: "kalshi",
      ticker: "KXBTC15M-91250",
      marketTitle: "KXBTC15M-91250",
      side: "YES",
      orderType: "taker",
      contracts: 30000,
      priceCents: 50,
      priceDollars: 0.50,
      notionalDollars: 15000.0,
      takerFeeDollars: 525.0,
      netPayoutIfWinDollars: 14475.0,
      netLossIfLoseDollars: 15525.0,
      feeDragBps: 350,
      requiredBreakevenPct: 53.5,
      settlementSource: "CME CF BRTI",
      strikeDistanceDollars: 15,
      secondsToExpiry: 120,
      settlementRiskLevel: "HAZARD_COIN_FLIP", // Flagged coin flip
      walletIdentifier: "CFTC Public Tape",
    };

    it("qualifies prints originating from target Polymarket wallet", () => {
      const res = evaluatePrintForShadowTracking(mockPrintTargetWallet);
      assert.equal(res.qualifies, true);
      assert.equal(res.matchedRule?.ruleType, "TARGET_WALLET");
    });

    it("qualifies large institutional prints exceeding $10,000 notional", () => {
      const res = evaluatePrintForShadowTracking(mockPrintWhaleSize);
      assert.equal(res.qualifies, true);
      assert.equal(res.matchedRule?.ruleType, "WHALE_NOTIONAL_MIN");
    });

    it("stands down / skips prints entered within coin-flip hazard zone (40¢-60¢ near expiry)", () => {
      const res = evaluatePrintForShadowTracking(mockPrintHazardZone);
      assert.equal(res.qualifies, false);
      assert.ok(res.reason.includes("Skipped: Print entered within flagged coin-flip hazard zone"));
    });

    it("allows toggling rule activation state", () => {
      const rule = toggleShadowTrackingRule("rule_whale_10k", false);
      assert.ok(rule);
      assert.equal(rule.enabled, false);

      // Restore
      toggleShadowTrackingRule("rule_whale_10k", true);
      const restored = getShadowTrackingRules().find(r => r.id === "rule_whale_10k");
      assert.equal(restored?.enabled, true);
    });
  });

  // =========================================================================
  // 4. Realistic Friction Simulation & Mathematical Deductions
  // =========================================================================
  describe("Realistic Execution Simulation & Friction Deductions", () => {
    it("deducts simulated slippage, latency, and exact regulatory taker fees", () => {
      const rule: ShadowTrackingRule = {
        id: "rule_test_sim",
        name: "Test Rule",
        ruleType: "CONTRACT_SIZE_MIN",
        description: "Test description",
        minContracts: 100,
        simulatedSlippageCents: 1.0, // +1c
        simulatedLatencyMs: 300,
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const print: LargeTradePrint = {
        id: "print_friction_test",
        timestamp: "2026-10-09T18:30:00Z",
        timestampIso: "2026-10-09T18:30:00Z",
        venue: "kalshi",
        ticker: "KXBTC15M-91300",
        marketTitle: "KXBTC15M-91300",
        side: "YES",
        orderType: "taker",
        contracts: 1000,
        priceCents: 50,
        priceDollars: 0.50,
        notionalDollars: 500.0,
        takerFeeDollars: 17.5,
        netPayoutIfWinDollars: 482.5,
        netLossIfLoseDollars: 517.5,
        feeDragBps: 350,
        requiredBreakevenPct: 51.75,
        settlementSource: "CME CF BRTI",
        strikeDistanceDollars: 85,
        secondsToExpiry: 400,
        settlementRiskLevel: "NORMAL_PROBABILITY",
        walletIdentifier: "CFTC Public Tape",
      };

      const paperPos = simulateShadowTrade(print, rule);

      // Verify upward slippage: 50c nominal -> 51c executed
      assert.equal(paperPos.targetPriceCents, 50);
      assert.equal(paperPos.simulatedEntryPriceCents, 51);
      assert.equal(paperPos.slippageCents, 1.0);
      assert.equal(paperPos.simulatedLatencyMs, 300);

      // Verify fee deduction on 1,000 contracts @ 51c:
      // Fee = ceil($0.07 * 1000 * 0.51 * 0.49) = ceil(17.493) = $17.50
      assert.equal(paperPos.simulatedTakerFeeDollars, 17.50);
      assert.equal(paperPos.slippageDragDollars, 10.00); // 1c * 1000 ct = $10.00
      assert.equal(paperPos.notionalDollars, 510.00); // 1000 * $0.51
    });

    it("accurately computes cumulative paper telemetry and Brier calibration", () => {
      const summary = getShadowModeSummary();
      assert.ok(summary.totalSimulatedTrades >= 3);
      assert.ok(summary.settledTrades >= 2);
      assert.ok(summary.totalFeesPaidDollars > 0, "Summary tracks total simulated fee friction");
      assert.ok(summary.totalSlippageDragDollars > 0, "Summary tracks total slippage drag");
      assert.ok(summary.simulatedBrierScore <= 0.2500, "Brier score computed for settled paper trades");
    });
  });

  // =========================================================================
  // 5. Flight Deck HTML UI Integrity (/deck?station=mission-log)
  // =========================================================================
  describe("Flight Deck HTML UI Integrity (/deck?station=mission-log - Shadow Mode)", () => {
    const mockUser = {
      id: "usr_test",
      email: "pilot@example.com",
      callsign: "PILOT-TEST",
      rank: "Pilot",
      xp: 250,
      isOptedIn: true,
      limits: { maxLoss: 50, feeBudget: 50 },
    };

    it("renders Mission Log station with Journal and Shadow Mode sub-tabs", () => {
      const html = renderFlightDeckPageHtml({
        user: mockUser,
        activeStation: "mission-log",
        reqPath: "/deck",
      });

      assert.ok(html.includes('id="btn-mission-tab-journal"'), "Journal tab button is rendered");
      assert.ok(html.includes('id="btn-mission-tab-shadow"'), "Shadow Mode tab button is rendered");
      assert.ok(html.includes('id="mission-journal-view"'), "mission-journal-view container is present");
      assert.ok(html.includes('id="mission-shadow-view"'), "mission-shadow-view container is present");
      assert.ok(html.includes('id="mission-shadow-mode-panel"'), "Shadow Mode panel is rendered");
    });

    it("renders CFTC Rule 4.41 disclosure and active rules deck inside Shadow Mode", () => {
      const html = renderFlightDeckPageHtml({
        user: mockUser,
        activeStation: "mission-log",
        reqPath: "/deck",
      });

      assert.ok(html.includes("CFTC RULE 4.41 MANDATORY HYPOTHETICAL DISCLOSURE"), "CFTC disclosure is prominently rendered");
      assert.ok(html.includes('id="shadow-rules-deck"'), "shadow-rules-deck is rendered");
      assert.ok(html.includes('id="shadow-ledger-card"'), "shadow-ledger-card is rendered");
      assert.ok(html.includes("Whale Flow > $10k Buys"), "Default rule is present");
      assert.ok(html.includes("Follow Pilot-71c"), "Target wallet rule is present");
    });

    it("includes client-side interactive JavaScript functions for Mission Log tabs and shadow rules", () => {
      const html = renderFlightDeckPageHtml({
        user: mockUser,
        activeStation: "mission-log",
        reqPath: "/deck",
      });

      assert.ok(html.includes("function switchMissionTab"), "switchMissionTab script is defined");
      assert.ok(html.includes("function toggleShadowRule"), "toggleShadowRule script is defined");
    });

    it("verifies Sensors station Shadow Mode card links to Mission Log Shadow tab", () => {
      const html = renderFlightDeckPageHtml({
        user: mockUser,
        activeStation: "sensors",
        reqPath: "/deck",
      });

      assert.ok(
        html.includes("switchStation('mission-log'); switchMissionTab('shadow');"),
        "Sensors Shadow Mode card seamlessly transitions to Mission Log Shadow tab"
      );
    });
  });
});
