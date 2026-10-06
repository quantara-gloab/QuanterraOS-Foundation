import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { runMigrations } from "../db.ts";
import {
  validateCopyGuardrails,
  draftContentPiece,
  approveContentDraft,
  listContentDrafts,
  getOrCreateAdSpendCaps,
  resetAdSpendCaps,
  evaluateAndLogAdSpend,
  ingestLead,
  generateLeadOutreachMessage,
  createInstitutionalOpportunity,
  generateDeskResearchBrief,
  listInstitutionalPipeline,
  updatePipelineStage,
  getGtmSummary,
  BANNED_MARKETING_TERMS,
} from "../gtm-engine.ts";

describe("Go-To-Market (GTM) Agents Engine (ai-marketing-sales-team-spec.md)", () => {
  before(() => {
    runMigrations();
  });

  // ==========================================================================
  // 1. Content & Copy Agent
  // ==========================================================================
  describe("1. Content & Copy Agent", () => {
    it("flags banned superlatives, competitor comparisons, and fake scarcity", () => {
      const cleanCheck = validateCopyGuardrails(
        "Across 1,316 settled contracts, market mid-price Brier score was 0.2001. Capital remains at $0.00."
      );
      assert.strictEqual(cleanCheck.passed, true);
      assert.strictEqual(cleanCheck.violations.length, 0);

      const competitorCheck = validateCopyGuardrails(
        "Unlike Citadel or Goldman, our model beats the market with guaranteed alpha."
      );
      assert.strictEqual(competitorCheck.passed, false);
      assert.ok(competitorCheck.violations.some((v) => v.includes("citadel")));
      assert.ok(competitorCheck.violations.some((v) => v.includes("beats the market") || v.includes("beat the market")));
      assert.ok(competitorCheck.violations.some((v) => v.includes("guaranteed")));

      const urgencyCheck = validateCopyGuardrails(
        "Hurry! Only 2 spots left before this exclusive offer ends in 24 hours!"
      );
      assert.strictEqual(urgencyCheck.passed, false);
      assert.ok(urgencyCheck.violations.some((v) => v.includes("urgency")));
    });

    it("drafts content grounded strictly in verified telemetry with pending human review", () => {
      const draft = draftContentPiece({ category: "weekly_ledger" });
      assert.ok(draft.id.startsWith("draft-"));
      assert.strictEqual(draft.category, "weekly_ledger");
      assert.ok(draft.draftText.includes("1316"));
      assert.ok(draft.draftText.includes("0.2001"));
      assert.ok(draft.draftText.includes("$0.00"));
      assert.strictEqual(draft.guardrailStatus, "PASSED");
      assert.strictEqual(draft.reviewStatus, "PENDING_HUMAN_APPROVAL");

      // Verify draft is stored in database
      const all = listContentDrafts();
      assert.ok(all.some((d) => d.id === draft.id));

      // Approve draft
      const approved = approveContentDraft(draft.id, "Michael Quantara");
      assert.strictEqual(approved.status, "APPROVED");
    });
  });

  // ==========================================================================
  // 2. Ad Platform Agent (Rule B5 Hard Spend Cap Pattern)
  // ==========================================================================
  describe("2. Ad Platform Agent (Hard Spend Caps)", () => {
    it("enforces Rule B5 pattern: blocks spend if daily or monthly cap is exceeded", () => {
      resetAdSpendCaps("google");
      const cap = getOrCreateAdSpendCaps("google");
      assert.ok(cap.dailyCapUsd > 0);
      assert.ok(cap.monthlyCapUsd > 0);
      assert.strictEqual(cap.circuitLocked, 1, "Ad budget circuit lock active by default");

      // Valid spend under daily cap
      const validSpend = evaluateAndLogAdSpend({
        platform: "google",
        campaignName: "calibration-truth-search-q4",
        targetUrl: "https://quanterraos.com/calibration",
        amountUsd: 25.0,
      });
      assert.strictEqual(validSpend.allowed, true);
      assert.strictEqual(validSpend.amountApproved, 25.0);

      // Spend exceeding daily cap ($100 cap, requesting $200)
      const excessiveSpend = evaluateAndLogAdSpend({
        platform: "google",
        campaignName: "excessive-test-campaign",
        targetUrl: "https://quanterraos.com/pricing",
        amountUsd: 200.0,
      });
      assert.strictEqual(excessiveSpend.allowed, false);
      assert.ok(excessiveSpend.reason.includes("Daily ad spend cap"));

      // Spend targeting an unverified landing page is blocked by guardrail
      const unverifiedUrlSpend = evaluateAndLogAdSpend({
        platform: "google",
        campaignName: "unverified-promo",
        targetUrl: "https://quanterraos.com/get-rich-quick",
        amountUsd: 10.0,
      });
      assert.strictEqual(unverifiedUrlSpend.allowed, false);
      assert.ok(unverifiedUrlSpend.reason.includes("does not match verified honest landing page routes"));
    });
  });

  // ==========================================================================
  // 3. CRM & Outreach Agent
  // ==========================================================================
  describe("3. CRM & Outreach Agent", () => {
    const testEmail = `prospect-${Date.now()}@apexcredit.com`;

    it("ingests and tracks leads with tier interest and contact milestones", () => {
      const lead = ingestLead({
        email: testEmail,
        name: "Marcus Vance",
        company: "Apex Credit Technologies",
        title: "Chief Risk Officer",
        source: "trustos_pilot_form",
        tierInterest: "pilot",
        notes: "Interested in 6-week model validation under NAIC Model Bulletin",
      });

      assert.strictEqual(lead.isNew, true);
      assert.strictEqual(lead.email, testEmail);
      assert.strictEqual(lead.tierInterest, "pilot");
      assert.strictEqual(lead.status, "new");

      // Updating lead retains history
      const updated = ingestLead({
        email: testEmail,
        company: "Apex Credit Tech Inc.",
      });
      assert.strictEqual(updated.isNew, false);
    });

    it("generates honest, non-manipulative follow-up templates passing guardrails", () => {
      const lead = ingestLead({
        email: `founder-${Date.now()}@fintech.io`,
        name: "Elena Rostova",
        source: "growth_form",
        tierInterest: "free",
      });

      const welcome = generateLeadOutreachMessage(lead.id, "welcome");
      assert.strictEqual(welcome.guardrailCheck, "PASSED");
      assert.ok(welcome.body.includes("1316"));
      assert.ok(welcome.body.includes("quanterraos.com/calibration"));
      assert.ok(!welcome.body.includes("act now") && !welcome.body.includes("guaranteed"));

      const proNudge = generateLeadOutreachMessage(lead.id, "pro_nudge");
      assert.strictEqual(proNudge.guardrailCheck, "PASSED");
      assert.ok(proNudge.body.includes("$199"));
    });
  });

  // ==========================================================================
  // 4. Sales Pipeline Agent ($750/mo Institutional Tier)
  // ==========================================================================
  describe("4. Sales Pipeline Agent (Institutional $750/mo)", () => {
    it("strictly blocks automated outreach and supports human-led sales conversations", () => {
      const lead = ingestLead({
        email: `desk.head-${Date.now()}@quantfund.com`,
        name: "David Kim",
        company: "Sigma Quant Capital",
        title: "Head of Systematic Trading",
        source: "manual",
        tierInterest: "institutional",
      });

      const opp = createInstitutionalOpportunity({
        leadId: lead.id,
        targetDesk: "Systematic Stat-Arb Desk",
        dealValueMonthlyUsd: 750.0,
      });

      assert.strictEqual(opp.autoSendBlocked, 1, "Hard rule: automated sending to institutional desks must be blocked");
      assert.strictEqual(opp.stage, "IDENTIFIED");
      assert.strictEqual(opp.dealValueMonthlyUsd, 750.0);

      // Verify desk research brief generator
      const brief = generateDeskResearchBrief(opp.targetDesk, "Sigma Quant Capital", "SR 11-7 Model Risk");
      assert.strictEqual(brief.autoSendDisallowed, true);
      assert.ok(brief.recommendedAgenda.length >= 3);

      // Update stage
      const progressed = updatePipelineStage(opp.id, "DEMOED");
      assert.strictEqual(progressed.newStage, "DEMOED");

      const pipeline = listInstitutionalPipeline();
      assert.ok(pipeline.some((p) => p.id === opp.id));
    });

    it("computes comprehensive GTM system summary", () => {
      const summary = getGtmSummary();
      assert.ok(summary.contentAgent.totalDrafts >= 1);
      assert.ok(summary.adPlatformAgent.google.dailyCapUsd > 0);
      assert.ok(summary.crmAgent.totalLeads >= 1);
      assert.strictEqual(summary.salesPipelineAgent.autoSendEnforced, true);
    });
  });
});
