import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  recordInstitutionalInquiry,
  getInstitutionalInquiries,
  getBuyerTypeLabel,
  type InstitutionalBuyerType,
} from "../lib/institutional-inquiry.ts";
import { renderInstitutionalPageHtml } from "../institutional-page.ts";
import { PRICING_PLANS } from "../config/pricing.ts";

describe("Phase 7 Task 7.6 Acceptance: Institutional Segmented Page (/institutional) & Book-a-Call", () => {
  describe("1. Buyer Segmentation (Part 1 & Part 3.10)", () => {
    it("renders all four required institutional buyer segments in HTML", () => {
      const html = renderInstitutionalPageHtml();
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("Neutral Telemetry for Trading Desks &amp; Funds"));

      // Segment 1: Market Makers
      assert.ok(html.includes("Market Makers &amp; LPs"));
      assert.ok(html.includes("Tick-by-tick order-book depth"));
      assert.ok(html.includes("Cross-venue Polymarket vs Kalshi basis divergence"));
      assert.ok(html.includes("Fee-aware net spread calculations"));
      assert.ok(html.includes("Direct WebSocket streams"));
      assert.ok(html.includes("Book Market Maker Call"));

      // Segment 2: Prop Desks
      assert.ok(html.includes("Proprietary Trading Desks"));
      assert.ok(html.includes("CME CF BRTI 60-second TWAP oracle resolution"));
      assert.ok(html.includes("Historical tick archives across 1,316 settled Bitcoin contract windows"));
      assert.ok(html.includes("Deterministic settlement post-mortems"));
      assert.ok(html.includes("Private dedicated instance deployment"));
      assert.ok(html.includes("Book Prop Desk Call"));

      // Segment 3: Funds & Macro Research
      assert.ok(html.includes("Funds &amp; Macro Research"));
      assert.ok(html.includes("Empirical Brier score calibration surface"));
      assert.ok(html.includes("Parquet dataset downloads for Python, DuckDB, and R"));
      assert.ok(html.includes("Standardized OpenAPI 3.1 REST specifications"));
      assert.ok(html.includes("Independent, conflict-free data: zero exchange kickbacks"));
      assert.ok(html.includes("Book Macro Research Call"));

      // Segment 4: Media & Distribution Partners
      assert.ok(html.includes("Media &amp; Distribution Partners"));
      assert.ok(html.includes("Embeddable responsive widgets with real-time settlement"));
      assert.ok(html.includes("White-label embed licensing"));
      assert.ok(html.includes("Authoritative citation data on prediction market fee structures"));
      assert.ok(html.includes("Weekly syndication digest and institutional research reports"));
      assert.ok(html.includes("Book Media Partnership Call"));
    });
  });

  describe("2. Enterprise Pricing Anchor & Features Alignment", () => {
    it("anchors institutional tier at $1,500+/mo matching pricing.ts", () => {
      const instPlan = PRICING_PLANS.find((p) => p.id === "institutional");
      assert.ok(instPlan, "Institutional plan must exist in pricing.ts");
      assert.equal(instPlan.priceMonthly, 1500, "Must anchor at $1,500/mo");

      const html = renderInstitutionalPageHtml();
      assert.ok(html.includes("Institutional / Data Tier"));
      assert.ok(html.includes("anchor $1,500+/mo"));
      assert.ok(html.includes("Unmetered dedicated WebSocket"));
      assert.ok(html.includes("1,316-window canonical calibration corpus"));
      assert.ok(html.includes("White-label embeddable widgets"));
      assert.ok(html.includes("Dedicated Slack / Microsoft Teams engineering channel"));
      assert.ok(html.includes("Service Level Agreement (99.9%)"));
    });
  });

  describe("3. Lead Intake & Enterprise SLA Tagging (<1h)", () => {
    it("records valid institutional inquiries with <1h SLA tagging", () => {
      const buyerTypes: InstitutionalBuyerType[] = [
        "market-maker",
        "prop-desk",
        "macro-fund",
        "media-partner",
      ];

      for (const bType of buyerTypes) {
        const res = recordInstitutionalInquiry({
          fullName: `Quantitative Lead (${bType})`,
          workEmail: `desk@${bType}.example.com`,
          firmName: "Apex Alpha Capital",
          buyerType: bType,
          estimatedVolumeOrAum: "$25M monthly",
          notes: "Need sub-millisecond WebSocket L2 depth feed",
        });

        assert.equal(res.success, true, `Inquiry for ${bType} should succeed`);
        assert.ok(res.inquiry);
        assert.equal(res.inquiry.buyerType, bType);
        assert.equal(res.inquiry.slaHours, 1, "Must tag with <1h response SLA");
        assert.equal(res.inquiry.status, "RECEIVED");
        assert.ok(res.inquiry.id.startsWith("inst_"));
      }

      const all = getInstitutionalInquiries();
      assert.ok(all.length >= 4, "Should record all 4 inquiries");
    });

    it("rejects incomplete or invalid institutional inquiry inputs", () => {
      const noName = recordInstitutionalInquiry({
        fullName: "",
        workEmail: "test@fund.com",
        firmName: "Firm",
        buyerType: "macro-fund",
      });
      assert.equal(noName.success, false);
      assert.ok(noName.error?.includes("name"));

      const badEmail = recordInstitutionalInquiry({
        fullName: "Trader",
        workEmail: "not-an-email",
        firmName: "Firm",
        buyerType: "prop-desk",
      });
      assert.equal(badEmail.success, false);
      assert.ok(badEmail.error?.includes("email"));

      const badSegment = recordInstitutionalInquiry({
        fullName: "Trader",
        workEmail: "trader@prop.com",
        firmName: "Firm",
        buyerType: "retail" as any,
      });
      assert.equal(badSegment.success, false);
    });

    it("provides human-readable labels for buyer types", () => {
      assert.equal(getBuyerTypeLabel("market-maker"), "Market Maker & Liquidity Provider");
      assert.equal(getBuyerTypeLabel("prop-desk"), "Proprietary Trading Desk");
      assert.equal(getBuyerTypeLabel("macro-fund"), "Fund & Macro Research");
      assert.equal(getBuyerTypeLabel("media-partner"), "Media & Distribution Partner");
    });
  });

  describe("4. Interactive Intake Modal & HTML UI Integrity", () => {
    it("renders modal structure, form fields, and response confirmation panels", () => {
      const html = renderInstitutionalPageHtml();
      assert.ok(html.includes("id=\"book-call-modal\""));
      assert.ok(html.includes("id=\"inst-intake-form\""));
      assert.ok(html.includes("id=\"inp-fullname\""));
      assert.ok(html.includes("id=\"inp-email\""));
      assert.ok(html.includes("id=\"inp-firm\""));
      assert.ok(html.includes("id=\"sel-buyer-type\""));
      assert.ok(html.includes("id=\"modal-success-view\""));
      assert.ok(html.includes("&lt;1 Hour"));
      assert.ok(html.includes("openBookCallModal"));
      assert.ok(html.includes("/api/institutional/book-call"));
    });
  });

  describe("5. Compliance & Non-Advisory Guardrails (Rule B4 & Rule B5)", () => {
    it("strictly adheres to Rule B4 (zero superlatives) and Rule B5 ($0 live capital)", () => {
      const html = renderInstitutionalPageHtml();
      const lower = html.toLowerCase();
      assert.strictEqual(lower.includes("guaranteed profit"), false);
      assert.strictEqual(lower.includes("beat the market"), false);
      assert.strictEqual(lower.includes("alpha generation"), false);

      assert.ok(html.includes("LOCKED_RULE_B5 ($0.00 CAPITAL RISK)"));
      assert.ok(html.includes("CFTC RULE 4.41"));
      assert.ok(html.includes("Rule B10"));
      assert.ok(html.includes("Kalshi"));
      assert.ok(html.includes("CME Group"));
      assert.ok(html.includes("Polymarket"));
    });
  });
});
