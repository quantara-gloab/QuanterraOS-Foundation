import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { executeFighterPilotVerification } from "../lib/fighter-pilots-verifier.ts";
import { renderCockpitPageHtml } from "../cockpit-page.ts";

describe("AI Fighter Pilots & Quantitative Model Verification Proof", () => {
  describe("1. Verification Engine Core & Deterministic Mathematical Models", () => {
    it("executes across all 11 Elite Eleven crew members and returns valid SHA-256 fingerprint", () => {
      const result = executeFighterPilotVerification({
        ticker: "KXBTC15M-26OCT11-91250",
        venue: "kalshi",
        side: "YES",
        contracts: 10,
        priceCents: 52,
        spotPrice: 91230,
        strikePrice: 91250,
        expirySeconds: 340,
        equippedPilotIds: [
          "draco", "wolf", "falcon", "quantum-fox", "sentinel", "kraken", "lion", "phoenix",
          "quanta", "quantana", "michael"
        ],
      });

      assert.ok(result.missionId.startsWith("MISSION-"));
      assert.equal(result.sha256Fingerprint.length, 64);
      assert.match(result.sha256Fingerprint, /^[0-9a-f]{64}$/i);
      assert.equal(result.overallStatus, "PASS");
      assert.ok(result.decisionReceiptSeal.sha256Short.length >= 8);
      assert.equal(result.decisionReceiptSeal.ruleB5Compliant, true);

      // Verify all 11 crew identities exist in pilot results
      const expectedIds = ["draco", "wolf", "falcon", "quantum-fox", "sentinel", "kraken", "lion", "phoenix", "quanta", "quantana", "michael"];
      for (const id of expectedIds) {
        assert.ok(result.pilots[id], `Pilot '${id}' must be present in verification output`);
        assert.equal(result.pilots[id].id, id);
        assert.ok(result.pilots[id].summary.length > 20);
        assert.ok(result.pilots[id].mathematicalModel.length > 10);
        assert.ok(result.pilots[id].provenanceSource.length > 5);
      }
    });

    it("verifies Draco: 19,740 candle rows, 1,316 settled windows, zero corrupted NaN ticks", () => {
      const result = executeFighterPilotVerification();
      const draco = result.pilots["draco"];

      assert.equal(draco.name, "Draco");
      assert.equal(draco.role, "Data Quality Specialist");
      assert.equal(draco.status, "VERIFIED");
      assert.equal(draco.telemetryMetrics.corruptedTicks, 0);
      assert.equal(draco.telemetryMetrics.pipelineHealthScore, 100);
      assert.equal(draco.telemetryMetrics.ingestionQualityPassed, true);
      assert.ok(draco.provenanceSource.includes("kalshi-btc15m-candles.csv"));
      assert.ok(draco.summary.includes("19,740"));
      assert.ok(draco.summary.includes("1,316 settled windows"));
    });

    it("verifies Wolf: Level-2 queue depth, tight 1.0¢ spread, and queue-sweep slippage", () => {
      const result = executeFighterPilotVerification({ contracts: 25, priceCents: 52 });
      const wolf = result.pilots["wolf"];

      assert.equal(wolf.name, "Wolf");
      assert.equal(wolf.role, "Liquidity Specialist");
      assert.equal(wolf.status, "NOMINAL");
      assert.equal(wolf.telemetryMetrics.spreadDollars, 0.01);
      assert.equal(wolf.telemetryMetrics.liquidityPassed, true);
      assert.equal(wolf.telemetryMetrics.queueSweepSlippageCents, 0.0);
      assert.ok(wolf.summary.includes("250 contracts"));
    });

    it("verifies Falcon: honest out-of-sample backtest disclosure (Brier 0.2736, n=31)", () => {
      const result = executeFighterPilotVerification();
      const falcon = result.pilots["falcon"];

      assert.equal(falcon.name, "Falcon");
      assert.equal(falcon.role, "Research Specialist");
      assert.equal(falcon.status, "RESEARCH_AUDITED");
      assert.equal(falcon.telemetryMetrics.falconAverageBrier, 0.2736);
      assert.equal(falcon.telemetryMetrics.naiveBaselineBrier, 0.2500);
      assert.equal(falcon.telemetryMetrics.marketMidBaselineBrier, 0.2106);
      assert.ok(falcon.summary.includes("0.2736"));
      assert.ok(falcon.findingsNotes.includes("Honest negative finding published"));
    });

    it("verifies Quantum Fox: Murphy (1973) Brier score decomposition & lognormal calibration", () => {
      const result = executeFighterPilotVerification({ spotPrice: 91231.5, strikePrice: 91250, priceCents: 51, expirySeconds: 300 });
      const fox = result.pilots["quantum-fox"];

      assert.equal(fox.name, "Quantum Fox");
      assert.equal(fox.role, "Validation Specialist");
      assert.equal(fox.status, "VERIFIED");
      assert.equal(fox.telemetryMetrics.kalshiMarketMidBrier, 0.2001);
      assert.equal(fox.telemetryMetrics.proprietaryModelBrier, 0.2063);
      assert.equal(fox.telemetryMetrics.brierDifference95CI, "[+0.0041, +0.0139]");
      assert.equal(fox.telemetryMetrics.tradableEdgeDetected, false);
      assert.ok(fox.mathematicalModel.includes("Murphy (1973) Brier Score Decomposition"));
      assert.ok(fox.summary.includes("0.2001"));
    });

    it("verifies Sentinel: feed freshness uptime, socket health, and Rule B5 permanent circuit lock", () => {
      const result = executeFighterPilotVerification();
      const sentinel = result.pilots["sentinel"];

      assert.equal(sentinel.name, "Sentinel");
      assert.equal(sentinel.role, "Feed Monitor Specialist");
      assert.equal(sentinel.status, "NOMINAL");
      assert.equal(sentinel.telemetryMetrics.droppedPacketsCount, 0);
      assert.equal(sentinel.telemetryMetrics.circuitBreakerState, "LOCKED_RULE_B5");
      assert.equal(sentinel.telemetryMetrics.liveCapitalExposedUsd, 0.0);
    });

    it("verifies Kraken: CME CF BRTI 60s TWAP basis and triggers HAZARD flag in tight proximity near expiration", () => {
      // Nominal condition
      const nominalResult = executeFighterPilotVerification({ spotPrice: 91500, strikePrice: 91250, expirySeconds: 600 });
      assert.equal(nominalResult.pilots["kraken"].status, "NOMINAL");
      assert.equal(nominalResult.overallStatus, "PASS");

      // Hazard condition: within $25 and expiry <= 180s
      const hazardResult = executeFighterPilotVerification({ spotPrice: 91240, strikePrice: 91250, expirySeconds: 90 });
      const krakenHazard = hazardResult.pilots["kraken"];
      assert.equal(krakenHazard.status, "HAZARD");
      assert.equal(krakenHazard.telemetryMetrics.twapDangerZoneActive, true);
      assert.equal(hazardResult.overallStatus, "WARNING_COIN_FLIP");
      assert.ok(hazardResult.consensusVerdict.includes("Settlement proximity hazard"));
    });

    it("verifies Lion: deterministic regulatory taker fee calculation and breakeven win rate shift", () => {
      const contracts = 10;
      const priceCents = 52;
      const result = executeFighterPilotVerification({ contracts, priceCents, venue: "kalshi" });
      const lion = result.pilots["lion"];

      // Kalshi taker fee: ceil(0.07 * 10 * 0.52 * 0.48 * 100) / 100 = ceil(17.472) / 100 = $0.18
      assert.equal(result.contract.grossOutlayDollars, 5.20);
      assert.equal(result.contract.regulatoryFeeDollars, 0.18);
      assert.equal(result.contract.totalRiskDollars, 5.38);
      assert.equal(result.contract.maxPayoutDollars, 10.00);
      assert.equal(result.contract.netPayoffDollars, 4.62);
      assert.equal(result.contract.breakevenWinProbPct, 53.8);

      assert.equal(lion.name, "Lion");
      assert.equal(lion.status, "NOMINAL");
      assert.equal(lion.telemetryMetrics.feeHurdleDragPct, 1.8);
      assert.equal(lion.telemetryMetrics.capitalPreservedIfSkipDollars, 5.38);
    });

    it("verifies Phoenix: zero customer risk of ruin and local persistence failover", () => {
      const result = executeFighterPilotVerification();
      const phoenix = result.pilots["phoenix"];

      assert.equal(phoenix.name, "Phoenix");
      assert.equal(phoenix.role, "Recovery Specialist");
      assert.equal(phoenix.telemetryMetrics.zeroCapitalRuinRiskProven, true);
      assert.equal(phoenix.telemetryMetrics.executionGateStatus, "LOCKED_ZERO_EXPOSURE");
      assert.ok(phoenix.summary.includes("mathematically zero ($0.00)"));
    });

    it("verifies Leaders (Quanta & Quantana) and Founder (Michael Quanterra)", () => {
      const result = executeFighterPilotVerification();

      const quanta = result.pilots["quanta"];
      assert.equal(quanta.name, "Quanta");
      assert.equal(quanta.role, "Assistant & Galactic Leader");

      const quantana = result.pilots["quantana"];
      assert.equal(quantana.name, "Quantana");
      assert.equal(quantana.role, "Queen & Companion");

      const michael = result.pilots["michael"];
      assert.equal(michael.name, "Michael Quanterra");
      assert.equal(michael.role, "Founder & Creator");
      assert.equal(michael.telemetryMetrics.nonAdvisoryAttestation, true);
      assert.ok(michael.summary.includes("Capital M on helmet forehead"));
    });

    it("resolves pilot alias lookups (fox -> quantum-fox, michael-quanterra -> michael)", () => {
      const result = executeFighterPilotVerification({
        equippedPilotIds: ["fox", "michael-quanterra"],
      });
      assert.ok(result.pilots["quantum-fox"]);
      assert.ok(result.pilots["fox"]);
      assert.equal(result.pilots["fox"].id, "quantum-fox");
      assert.ok(result.pilots["michael"]);
      assert.ok(result.pilots["michael-quanterra"]);
      assert.equal(result.pilots["michael-quanterra"].id, "michael");
    });
  });

  describe("2. HTTP Server API Endpoints Wiring Audit", () => {
    it("verifies server.ts registers /api/cockpit/verify-mission, /api/cockpit/verify, and telemetry endpoints", () => {
      const serverCode = fs.readFileSync(path.resolve("src/server.ts"), "utf-8");

      assert.ok(
        serverCode.includes('app.post(["/api/cockpit/verify-mission", "/api/cockpit/verify"]'),
        "server.ts must register /api/cockpit/verify-mission and /api/cockpit/verify"
      );

      assert.ok(
        serverCode.includes('app.get("/api/cockpit/specialist-telemetry/:pilotId"'),
        "server.ts must register /api/cockpit/specialist-telemetry/:pilotId"
      );

      assert.ok(
        serverCode.includes('app.get("/api/cockpit/specialists-telemetry"'),
        "server.ts must register /api/cockpit/specialists-telemetry batch endpoint"
      );

      assert.ok(
        serverCode.includes("executeFighterPilotVerification"),
        "server.ts must import and call executeFighterPilotVerification"
      );
    });
  });

  describe("3. Cockpit UI Wiring & Decision Receipt Verification", () => {
    it("renders Mission Action Bar, station-evidence-box, Quanta Decision Receipt seal, and telemetry modal", () => {
      const html = renderCockpitPageHtml({
        venue: "kalshi",
        side: "YES",
        ticker: "KXBTC15M-SAMPLE",
      });

      // Verification Mission Action Bar
      assert.ok(html.includes('id="btn-verify-mission"'));
      assert.ok(html.includes("AI Fighter Pilots Live Model Verification Mission"));
      assert.ok(html.includes('id="mission-status-pill"'));

      // Dynamic Station Evidence Box
      assert.ok(html.includes('id="station-evidence-box"'));
      assert.ok(html.includes("Draco"));
      assert.ok(html.includes("Wolf"));
      assert.ok(html.includes("Kraken"));
      assert.ok(html.includes("Sentinel"));
      assert.ok(html.includes("Inspect Telemetry ↗"));

      // Quanta Decision Receipt Seal Box
      assert.ok(html.includes('id="receipt-seal-box"'));
      assert.ok(html.includes("QUANTA DECISION RECEIPT SEAL"));
      assert.ok(html.includes('id="receipt-seal-hash"'));
      assert.ok(html.includes("Live capital deployed:"));
      assert.ok(html.includes("$0.00"));

      // Telemetry Modal
      assert.ok(html.includes('id="pilot-telemetry-modal"'));
      assert.ok(html.includes('id="modal-pilot-title"'));
      assert.ok(html.includes('id="modal-pilot-metrics"'));
      assert.ok(html.includes('id="modal-pilot-provenance"'));

      // Client-side Script methods
      assert.ok(html.includes("function runMissionVerification"));
      assert.ok(html.includes("function inspectPilotTelemetry"));
      assert.ok(html.includes("function renderStationEvidence"));
      assert.ok(html.includes("function toggleStation"));
    });
  });

  describe("4. Non-Negotiable Guardrails (Rules B1, B4, B5, B10)", () => {
    it("adheres to Rule B5: $0.00 live exposure, zero automated order routing across all outputs", () => {
      const result = executeFighterPilotVerification();
      assert.equal(result.decisionReceiptSeal.ruleB5Compliant, true);
      assert.equal(result.pilots["sentinel"].telemetryMetrics.liveCapitalExposedUsd, 0.0);
      assert.equal(result.pilots["phoenix"].telemetryMetrics.executionGateStatus, "LOCKED_ZERO_EXPOSURE");
      assert.equal(result.pilots["phoenix"].telemetryMetrics.zeroCapitalRuinRiskProven, true);
    });

    it("adheres to Rule B4: telemetry summaries and verdicts contain zero banned words", () => {
      const result = executeFighterPilotVerification();
      const bannedWordsRegex = /\b(guaranteed profit|beat the market|guaranteed return|free money)\b/i;

      assert.ok(!bannedWordsRegex.test(result.consensusVerdict), "Consensus verdict contains banned promotional language");

      for (const [id, pilot] of Object.entries(result.pilots)) {
        assert.ok(!bannedWordsRegex.test(pilot.summary), `Pilot ${id} summary contains banned language`);
        assert.ok(!bannedWordsRegex.test(pilot.findingsNotes), `Pilot ${id} notes contain banned language`);
      }
    });

    it("adheres to Rule B10: properly attributes Kalshi, Polymarket, CME CF BRTI trademarks", () => {
      const html = renderCockpitPageHtml();
      assert.ok(html.includes("Kalshi"));
      assert.ok(html.includes("Polymarket"));
      assert.ok(html.includes("CME CF Bitcoin Real-Time Index (BRTI)") || html.includes("BRTI"));
    });
  });
});

