import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getTrackRecordData,
  renderTrackRecordPageHtml,
  generateTrackRecordReceiptSvg,
  formatTrackRecordCsv,
} from "../track-record-page.ts";
import { executeMcpTool, MCP_SERVER_MANIFEST } from "../mcp-server.ts";
import {
  createDiscrepancyAlert,
  createResolutionRiskAlert,
  formatXBroadcastPayload,
} from "../alert-dispatcher.ts";

describe("Verified Settlement Track Record Explorer (Strategic Move #11)", () => {
  describe("getTrackRecordData", () => {
    it("returns 1,316 settled windows with Murphy decomposition and $0.00 deployed capital", () => {
      const data = getTrackRecordData();
      assert.equal(data.totalSettled, 1316);
      assert.equal(data.capitalDeployed, "$0.00");
      assert.ok(Math.abs(data.averageBrierScore - 0.2063) < 0.001);
      assert.ok(Math.abs(data.marketBenchmarkBrier - 0.2001) < 0.001);
      assert.equal(data.randomBaselineBrier, 0.2500);
      assert.ok(Math.abs(data.murphyDecomposition.reliability - 0.0094) < 0.001);
      assert.ok(Math.abs(data.murphyDecomposition.resolution - 0.0593) < 0.001);
      assert.ok(Math.abs(data.murphyDecomposition.uncertainty - 0.2500) < 0.001);
      assert.ok(data.items.length > 0);
    });

    it("attaches 64-character hexadecimal SHA-256 provenance hashes to items", () => {
      const data = getTrackRecordData({ limit: 10 });
      assert.equal(data.items.length, 10);
      for (const item of data.items) {
        assert.match(item.provenanceHash, /^[a-f0-9]{64}$/);
        assert.ok(item.id);
        assert.ok(item.callTimestamp);
        assert.ok(item.settledTimestamp);
        assert.ok(["YES", "NO"].includes(item.outcome));
        assert.ok(item.brierScore >= 0 && item.brierScore <= 1);
      }
    });

    it("filters items by category correctly", () => {
      const cryptoData = getTrackRecordData({ category: "crypto", limit: 20 });
      assert.ok(cryptoData.items.length > 0);
      assert.ok(cryptoData.items.every((it) => it.category === "crypto"));

      const macroData = getTrackRecordData({ category: "macro", limit: 20 });
      assert.ok(macroData.items.length > 0);
      assert.ok(macroData.items.every((it) => it.category === "macro"));
    });

    it("filters items by outcome correctly", () => {
      const yesData = getTrackRecordData({ outcome: "YES", limit: 20 });
      assert.ok(yesData.items.length > 0);
      assert.ok(yesData.items.every((it) => it.outcome === "YES"));

      const noData = getTrackRecordData({ outcome: "NO", limit: 20 });
      assert.ok(noData.items.length > 0);
      assert.ok(noData.items.every((it) => it.outcome === "NO"));
    });
  });

  describe("formatTrackRecordCsv", () => {
    it("generates RFC 4180 compliant CSV string with expected headers", () => {
      const csv = formatTrackRecordCsv();
      const lines = csv.split("\r\n");
      assert.ok(lines.length > 10);
      const headers = lines[0].split(",");
      assert.ok(headers.includes("record_id"));
      assert.ok(headers.includes("market_ticker"));
      assert.ok(headers.includes("quoted_probability"));
      assert.ok(headers.includes("model_probability"));
      assert.ok(headers.includes("settlement_outcome"));
      assert.ok(headers.includes("provenance_sha256"));

      const secondLine = lines[1];
      assert.match(secondLine, /[a-f0-9]{64}/);
    });
  });

  describe("generateTrackRecordReceiptSvg", () => {
    it("generates valid standalone SVG receipt with required disclosures", () => {
      const svg = generateTrackRecordReceiptSvg();
      assert.ok(svg.includes("<svg"));
      assert.ok(svg.includes("</svg>"));
      assert.ok(svg.includes("QUANTERRAOS // AUDITED SETTLEMENT LEDGER"));
      assert.ok(svg.includes("1,316 SETTLED WINDOWS"));
      assert.ok(svg.includes("$0.00"));
      assert.ok(svg.includes("Rule B5 Locked"));
      assert.ok(svg.includes("Murphy Decomposition"));

      // Rule B10 marks attribution
      assert.ok(svg.includes("CME CF BRTI"));
      assert.ok(svg.includes("Kalshi"));
      assert.ok(svg.includes("Polymarket"));

      // Strict Rule B4: zero occurrences of banned words
      assert.doesNotMatch(svg, /\balpha\b/i);
      assert.doesNotMatch(svg, /\bguaranteed\b/i);
      assert.doesNotMatch(svg, /\bbeat the market\b/i);
      assert.doesNotMatch(svg, /\barbitrage\b/i);
    });
  });

  describe("renderTrackRecordPageHtml", () => {
    it("renders institutional HTML explorer with zero banned words", () => {
      const html = renderTrackRecordPageHtml();
      assert.ok(html.includes("<!doctype html>"));
      assert.ok(html.includes("Verified Settlement Track Record &amp; Proof Ledger"));
      assert.ok(html.includes("Murphy/Yates Mathematical Identity Audit"));
      assert.ok(html.includes("1,316"));
      assert.ok(html.includes("$0.00"));
      assert.ok(html.includes("Rule B5 locked standby"));
      assert.ok(html.includes("ledger-table"));
      assert.ok(html.includes("openVerifyModal"));
      assert.ok(html.includes("copyModalHash"));

      // Jump strip workflow navigation
      assert.ok(html.includes("QUANT PIPELINE"));
      assert.ok(html.includes("/scanner"));
      assert.ok(html.includes("/datasets"));
      assert.ok(html.includes("/journal"));

      // Rule B4 compliance
      assert.doesNotMatch(html, /\balpha\b/i);
      assert.doesNotMatch(html, /\bguaranteed\b/i);
      assert.doesNotMatch(html, /\bbeat the market\b/i);
      assert.doesNotMatch(html, /\barbitrage\b/i);

      // Rule B10 marks
      assert.ok(html.includes("CME CF BRTI"));
      assert.ok(html.includes("CF Benchmarks"));
    });
  });

  describe("MCP Tool query_verified_track_record", () => {
    it("is registered in MCP_SERVER_MANIFEST", () => {
      const toolDef = MCP_SERVER_MANIFEST.tools.find(
        (t) => t.name === "query_verified_track_record"
      );
      assert.ok(toolDef);
      assert.ok(toolDef?.description.includes("1,316"));
    });

    it("executes successfully and returns structured summary and items", async () => {
      const result = await executeMcpTool("query_verified_track_record", {
        category: "crypto",
        limit: 5,
      });

      assert.equal(result.success, true);
      assert.equal(result.summary.totalSettled, 1316);
      assert.equal(result.summary.capitalDeployed, "$0.00");
      assert.ok(Math.abs(result.summary.murphyDecomposition.reliability - 0.0094) < 0.001);
      assert.equal(result.itemCount, 5);
      assert.equal(result.items.length, 5);
      assert.equal(result.items[0].category, "crypto");
      assert.equal(result.verificationEndpoint, "https://quanterraos.com/track-record");
    });
  });

  describe("Alert Dispatcher Social Broadcast & Constructors (Move #12)", () => {
    it("formats discrepancy alert broadcast under 280 characters", () => {
      const alert = createDiscrepancyAlert({
        pairTicker: "FED-RATE-CUT-NOV26",
        grossSpreadCents: 7,
        netDiscrepancyCents: 4.8,
        kalshiPriceCents: 42,
        polymarketPriceCents: 49,
        hazardLevel: "LOW_SETTLEMENT_BASIS_HAZARD",
      });

      assert.equal(alert.eventType, "DISCREPANCY_SCANNER_DETECTED");
      const broadcast = formatXBroadcastPayload(alert);
      assert.ok(broadcast.charCount <= 280);
      assert.ok(broadcast.isWithinLimit);
      assert.ok(broadcast.text.includes("Falcon detected"));
      assert.ok(broadcast.text.includes("Kalshi & Polymarket"));
      assert.ok(broadcast.url.includes("quanterraos.com/scanner"));
    });

    it("formats resolution risk alert broadcast under 280 characters", () => {
      const alert = createResolutionRiskAlert({
        marketId: "US-CPI-HEADLINE-OCT26",
        title: "US CPI MoM Above 0.3% in October 2026",
        ambiguityScore: 78,
        severity: "HIGH",
        umaDisputeProbabilityPct: 34,
      });

      assert.equal(alert.eventType, "RESOLUTION_RISK_SPIKE");
      const broadcast = formatXBroadcastPayload(alert);
      assert.ok(broadcast.charCount <= 280);
      assert.ok(broadcast.isWithinLimit);
      assert.ok(broadcast.text.includes("Sentinel flagged HIGH dispute risk"));
      assert.ok(broadcast.text.includes("Score: 78/100"));
      assert.ok(broadcast.url.includes("quanterraos.com/resolution-risk"));
    });
  });
});
