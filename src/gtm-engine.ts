/**
 * QuanterraOS Go-To-Market (GTM) Engine
 * 
 * Implements the 4 narrow, tool-grounded GTM agents specified in ai-marketing-sales-team-spec.md:
 * 1. Content & Copy Agent (Drafts strictly from verified telemetry; human review required; Rule B4 guardrails)
 * 2. Ad Platform Agent (Hard code-enforced daily/monthly spend caps via Rule B5 circuit lock pattern)
 * 3. CRM & Outreach Agent (Lead tracking, non-manipulative template follow-ups, hands off to human)
 * 4. Sales Pipeline Agent ($750/mo Institutional tier; research dossiers; strictly blocks automated outreach)
 */

import { randomUUID } from "node:crypto";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db.ts";
import {
  leads,
  adSpendCaps,
  adSpendLedger,
  contentDrafts,
  institutionalPipeline,
} from "./schema.ts";

// Banned words & manipulative marketing patterns (Rule B4 + Spec)
export const BANNED_MARKETING_TERMS = [
  "beat the market",
  "beats the market",
  "beating the market",
  "arbitrage",
  "guaranteed",
  "alpha",
  "working your capital",
  "mispriced opportunities",
  "verified trustworthy",
  "blackstone",
  "citadel",
  "bridgewater",
  "goldman",
  "secret sauce",
  "act now",
  "only 2 spots left",
  "limited time only",
  "countdown",
];

export const VERIFIED_CANONICAL_FIGURES = {
  settledWindows: 1316,
  marketBrierScore: 0.2001,
  coinFlipBaseline: 0.2500,
  capitalDeployedUsd: 0.00,
  proMonthlyUsd: 199,
  institutionalMonthlyUsd: 750,
  trustOsPilotUsd: 20000,
};

// ============================================================================
// 1. CONTENT & COPY AGENT
// ============================================================================

export interface DraftContentInput {
  category: "weekly_ledger" | "findings_faq" | "predictions_social" | "blog";
  customTopic?: string;
}

export function validateCopyGuardrails(text: string): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  const lower = text.toLowerCase();

  for (const term of BANNED_MARKETING_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      violations.push(`Contains banned term: "${term}"`);
    }
  }

  // Check for fake urgency or countdown timers
  if (/\b(ends in \d+|hurry|don't miss out|spots? filling fast)\b/i.test(text)) {
    violations.push("Contains manufactured urgency / scarcity language");
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function draftContentPiece(input: DraftContentInput) {
  let title = "";
  let draftText = "";
  let provenanceSources: string[] = [];

  if (input.category === "weekly_ledger") {
    title = `Weekly Telemetry Audit: ${VERIFIED_CANONICAL_FIGURES.settledWindows} Settled Contracts on the Record`;
    draftText = `Across ${VERIFIED_CANONICAL_FIGURES.settledWindows} settled 15-minute Bitcoin contracts, the market mid-price maintained a Brier score of ${VERIFIED_CANONICAL_FIGURES.marketBrierScore} versus the ${VERIFIED_CANONICAL_FIGURES.coinFlipBaseline} coin-flip baseline.\n\nUnder internal governance Rule B5, live capital remains at $${VERIFIED_CANONICAL_FIGURES.capitalDeployedUsd.toFixed(2)}. We measure calibration continuously and publish every backtest at quanterraos.com/calibration.`;
    provenanceSources = [
      "quanterraos.com/calibration",
      "reports/btc15m-predictor-backtest-2026-10-03.txt",
      "HANDOFF.md Section A",
    ];
  } else if (input.category === "findings_faq") {
    title = "Calibration vs Prediction: The QuanterraOS FAQ";
    draftText = `Q: Does QuanterraOS promise a trading edge?\nA: No. Live backtests across ${VERIFIED_CANONICAL_FIGURES.settledWindows} markets show the market mid-price outperformed our fair-value models at minutes 4, 7, and 10. Our value is empirical measurement and calibration audit, not directional prediction.\n\nQ: Is user capital at risk?\nA: Zero capital is deployed ($0.00). All telemetry serves as an independent truth layer for prediction markets and enterprise AI model risk.`;
    provenanceSources = [
      "docs/findings.md",
      "src/agents/council-data.ts",
      "quanterraos.com/research",
    ];
  } else if (input.category === "predictions_social") {
    title = "Live Ledger Telemetry Update";
    draftText = `New prediction market calibration benchmarks are live on QuanterraOS. Check the 10-bin reliability curve and inspect every settled contract directly on the record: quanterraos.com/predictions (Rule B5 locked: $0.00 live exposure).`;
    provenanceSources = [
      "quanterraos.com/predictions",
      "quanterraos.com/calibration/market-price",
    ];
  } else {
    title = input.customTopic ?? "The Value of Continuous Model Calibration";
    draftText = `Why annual model validation falls short: calibration drift happens continuously between regulatory cycles. TrustOS audits production AI decision models on real outcomes across finance and insurance. Review our public prediction market baseline at quanterraos.com/trustos.`;
    provenanceSources = [
      "docs/trustos-pilot-offer.md",
      "quanterraos.com/trustos",
    ];
  }

  const guardrailCheck = validateCopyGuardrails(draftText);
  const id = "draft-" + randomUUID();
  const now = new Date().toISOString();

  const record = {
    id,
    title,
    category: input.category,
    draftText,
    provenanceSources: JSON.stringify(provenanceSources),
    guardrailStatus: guardrailCheck.passed ? "PASSED" : "FLAGGED",
    guardrailViolations: guardrailCheck.violations.length ? JSON.stringify(guardrailCheck.violations) : null,
    reviewStatus: "PENDING_HUMAN_APPROVAL",
    createdAt: now,
  };

  db.insert(contentDrafts).values(record).run();
  return record;
}

export function approveContentDraft(draftId: string, approvedBy: string) {
  const draft = db.select().from(contentDrafts).where(eq(contentDrafts.id, draftId)).get();
  if (!draft) throw new Error(`Draft ${draftId} not found`);
  if (draft.guardrailStatus !== "PASSED") {
    throw new Error(`Cannot approve draft ${draftId} because it failed copy guardrails`);
  }

  const now = new Date().toISOString();
  db.update(contentDrafts)
    .set({ reviewStatus: "APPROVED", approvedAt: now })
    .where(eq(contentDrafts.id, draftId))
    .run();

  return { id: draftId, status: "APPROVED", approvedBy, approvedAt: now };
}

export function listContentDrafts() {
  return db.select().from(contentDrafts).orderBy(desc(contentDrafts.createdAt)).all();
}

// ============================================================================
// 2. AD PLATFORM AGENT (Rule B5 Hard Spend Cap Pattern)
// ============================================================================

export function getOrCreateAdSpendCaps(platform: "google" | "meta") {
  let cap = db.select().from(adSpendCaps).where(eq(adSpendCaps.platform, platform)).get();
  if (!cap) {
    const now = new Date().toISOString();
    cap = {
      id: "cap-" + platform,
      platform,
      dailyCapUsd: 100.0,
      monthlyCapUsd: 2500.0,
      currentDaySpendUsd: 0.0,
      currentMonthSpendUsd: 0.0,
      circuitLocked: 1, // Rule B5 locked by default
      approvedBy: "Founder / CEO",
      updatedAt: now,
    };
    db.insert(adSpendCaps).values(cap).run();
  }
  return cap;
}

export function resetAdSpendCaps(platform: "google" | "meta") {
  db.update(adSpendCaps)
    .set({ currentDaySpendUsd: 0.0, currentMonthSpendUsd: 0.0, updatedAt: new Date().toISOString() })
    .where(eq(adSpendCaps.platform, platform))
    .run();
}

export interface EvaluateAdSpendInput {
  platform: "google" | "meta";
  campaignName: string;
  targetUrl: string;
  amountUsd: number;
}

export function evaluateAndLogAdSpend(input: EvaluateAdSpendInput) {
  const cap = getOrCreateAdSpendCaps(input.platform);
  const now = new Date().toISOString();
  const ledgerId = "ad-" + randomUUID();

  // Guardrail 1: Target URL must strictly match verified honest platform routes
  const validUrlPrefixes = [
    "https://quanterraos.com/pricing",
    "https://quanterraos.com/research",
    "https://quanterraos.com/calibration",
    "https://quanterraos.com/trustos",
    "https://quanterraos.com/preview",
    "/pricing",
    "/research",
    "/calibration",
    "/trustos",
    "/preview",
  ];

  const urlMatches = validUrlPrefixes.some((p) => input.targetUrl.startsWith(p));
  if (!urlMatches) {
    const reason = `Target URL ${input.targetUrl} does not match verified honest landing page routes`;
    db.insert(adSpendLedger).values({
      id: ledgerId,
      platform: input.platform,
      campaignName: input.campaignName,
      targetUrl: input.targetUrl,
      amountUsd: input.amountUsd,
      status: "BLOCKED_GUARDRAIL_VIOLATION",
      reason,
      createdAt: now,
    }).run();

    return { allowed: false, reason, ledgerId };
  }

  // Guardrail 2: Hard Code-Enforced Cap (Rule B5 Pattern)
  if (cap.circuitLocked === 1 && (cap.currentDaySpendUsd + input.amountUsd > cap.dailyCapUsd)) {
    const reason = `Daily ad spend cap ($${cap.dailyCapUsd.toFixed(2)}) exceeded by requested amount ($${input.amountUsd.toFixed(2)})`;
    db.insert(adSpendLedger).values({
      id: ledgerId,
      platform: input.platform,
      campaignName: input.campaignName,
      targetUrl: input.targetUrl,
      amountUsd: input.amountUsd,
      status: "BLOCKED_CAP_EXCEEDED",
      reason,
      createdAt: now,
    }).run();

    return { allowed: false, reason, ledgerId };
  }

  if (cap.currentMonthSpendUsd + input.amountUsd > cap.monthlyCapUsd) {
    const reason = `Monthly ad spend ceiling ($${cap.monthlyCapUsd.toFixed(2)}) exceeded`;
    db.insert(adSpendLedger).values({
      id: ledgerId,
      platform: input.platform,
      campaignName: input.campaignName,
      targetUrl: input.targetUrl,
      amountUsd: input.amountUsd,
      status: "BLOCKED_CAP_EXCEEDED",
      reason,
      createdAt: now,
    }).run();

    return { allowed: false, reason, ledgerId };
  }

  // Approved spend: update caps and write to ledger
  const updatedDaySpend = cap.currentDaySpendUsd + input.amountUsd;
  const updatedMonthSpend = cap.currentMonthSpendUsd + input.amountUsd;

  db.update(adSpendCaps)
    .set({
      currentDaySpendUsd: updatedDaySpend,
      currentMonthSpendUsd: updatedMonthSpend,
      updatedAt: now,
    })
    .where(eq(adSpendCaps.id, cap.id))
    .run();

  db.insert(adSpendLedger).values({
    id: ledgerId,
    platform: input.platform,
    campaignName: input.campaignName,
    targetUrl: input.targetUrl,
    amountUsd: input.amountUsd,
    status: "APPROVED",
    reason: "Spend within authorized limits",
    createdAt: now,
  }).run();

  return {
    allowed: true,
    amountApproved: input.amountUsd,
    currentDaySpendUsd: updatedDaySpend,
    currentMonthSpendUsd: updatedMonthSpend,
    ledgerId,
  };
}

// ============================================================================
// 3. CRM & OUTREACH AGENT
// ============================================================================

export interface IngestLeadInput {
  email: string;
  name?: string;
  company?: string;
  title?: string;
  source: string;
  tierInterest?: "free" | "pro" | "institutional" | "pilot";
  notes?: string;
}

export function ingestLead(input: IngestLeadInput) {
  const normEmail = input.email.trim().toLowerCase();
  const existing = db.select().from(leads).where(eq(leads.email, normEmail)).get();
  const now = new Date().toISOString();

  if (existing) {
    db.update(leads)
      .set({
        name: input.name ?? existing.name,
        company: input.company ?? existing.company,
        title: input.title ?? existing.title,
        tierInterest: input.tierInterest ?? existing.tierInterest,
        notes: input.notes ? `${existing.notes ?? ""}\n${input.notes}`.trim() : existing.notes,
        updatedAt: now,
      })
      .where(eq(leads.id, existing.id))
      .run();
    return { ...existing, isNew: false };
  }

  const id = "lead-" + randomUUID();
  const newLead = {
    id,
    email: normEmail,
    name: input.name ?? null,
    company: input.company ?? null,
    title: input.title ?? null,
    source: input.source,
    status: "new",
    tierInterest: input.tierInterest ?? "free",
    touches: 0,
    lastContactAt: null,
    nextFollowupAt: now,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(leads).values(newLead).run();
  return { ...newLead, isNew: true };
}

export function generateLeadOutreachMessage(leadId: string, type: "welcome" | "checkin_day7" | "pro_nudge") {
  const lead = db.select().from(leads).where(eq(leads.id, leadId)).get();
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const recipientName = lead.name || "there";
  let subject = "";
  let body = "";

  if (type === "welcome") {
    subject = "Welcome to QuanterraOS: Calibration Data & Telemetry Access";
    body = `Hi ${recipientName},\n\nThank you for joining QuanterraOS. Your account gives you access to our live calibration benchmarks across ${VERIFIED_CANONICAL_FIGURES.settledWindows} settled prediction market windows, live CME CF BRTI composite indices, and the Council specialists.\n\nAll historical backtests and audit proofs are accessible anytime at quanterraos.com/calibration.\n\nIf you have any questions about our methodology or data exports, reply directly to this email.\n\nBest,\nMichael Quantara\nFounder & CEO, Quantara Global LLC`;
  } else if (type === "checkin_day7") {
    subject = "QuanterraOS Telemetry Check-in";
    body = `Hi ${recipientName},\n\nFollowing up to see how you're finding the live calibration feeds and spread telemetry. The platform updates settled outcomes continuously.\n\nIf your team is evaluating continuous AI decision monitoring under NAIC or Regulation B guidelines, you can inspect our TrustOS pilot overview at quanterraos.com/trustos.\n\nBest,\nMichael Quantara\nFounder & CEO, Quantara Global LLC`;
  } else {
    subject = "Pro Terminal Telemetry: Real-time Recompute & Extended History";
    body = `Hi ${recipientName},\n\nNotice you've been active on our Explorer tier. If you require sub-second live feeds rather than the 20-minute delayed stream, along with full 10-bin breakdown access, the Pro Terminal is available at $${VERIFIED_CANONICAL_FIGURES.proMonthlyUsd}/month.\n\nDetails and unhurried feature breakdown are at quanterraos.com/pricing.\n\nBest,\nMichael Quantara\nFounder & CEO, Quantara Global LLC`;
  }

  // Validate output against banned superlatives and fake urgency
  const guard = validateCopyGuardrails(body);
  if (!guard.passed) {
    throw new Error(`Generated message failed copy guardrails: ${guard.violations.join(", ")}`);
  }

  return { leadId, type, subject, body, guardrailCheck: "PASSED" };
}

// ============================================================================
// 4. SALES PIPELINE AGENT ($750/mo Institutional Tier)
// ============================================================================

export interface CreateOpportunityInput {
  leadId: string;
  targetDesk: string;
  targetTier?: string;
  dealValueMonthlyUsd?: number;
  researchDossier?: Record<string, any>;
}

export function createInstitutionalOpportunity(input: CreateOpportunityInput) {
  const lead = db.select().from(leads).where(eq(leads.id, input.leadId)).get();
  if (!lead) throw new Error(`Lead ${input.leadId} not found`);

  const id = "opp-" + randomUUID();
  const now = new Date().toISOString();

  const opp = {
    id,
    leadId: input.leadId,
    targetDesk: input.targetDesk,
    targetTier: input.targetTier ?? "INSTITUTIONAL",
    stage: "IDENTIFIED",
    researchDossier: input.researchDossier ? JSON.stringify(input.researchDossier) : null,
    autoSendBlocked: 1, // HARD RULE: Institutional outreach CANNOT be auto-sent
    owner: "Michael Quantara",
    dealValueMonthlyUsd: input.dealValueMonthlyUsd ?? 750.0,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(institutionalPipeline).values(opp).run();
  return opp;
}

export function generateDeskResearchBrief(targetDesk: string, company: string, regulatoryHook: string) {
  return {
    targetDesk,
    company,
    regulatoryHook,
    recommendedAgenda: [
      "Review current model risk management framework (SR 11-7 / NAIC Model Bulletin)",
      "Demonstrate 1,316-market calibration audit proof and reliability curves",
      "Discuss read-only VPC deployment or de-identified data intake protocol",
      "Scope 6-week TrustOS pilot ($20,000 fixed, 50% success-guaranteed milestone)",
    ],
    verifiedBackgroundNotes: `Entity operates automated decisioning models. Outreach must be human-led by Michael Quantara. No automated cold blasts allowed under Spec Section 4.`,
    autoSendDisallowed: true,
  };
}

export function listInstitutionalPipeline() {
  return db
    .select({
      id: institutionalPipeline.id,
      leadId: institutionalPipeline.leadId,
      targetDesk: institutionalPipeline.targetDesk,
      targetTier: institutionalPipeline.targetTier,
      stage: institutionalPipeline.stage,
      autoSendBlocked: institutionalPipeline.autoSendBlocked,
      owner: institutionalPipeline.owner,
      dealValueMonthlyUsd: institutionalPipeline.dealValueMonthlyUsd,
      createdAt: institutionalPipeline.createdAt,
      updatedAt: institutionalPipeline.updatedAt,
      leadEmail: leads.email,
      leadCompany: leads.company,
      leadName: leads.name,
    })
    .from(institutionalPipeline)
    .leftJoin(leads, eq(institutionalPipeline.leadId, leads.id))
    .orderBy(desc(institutionalPipeline.createdAt))
    .all();
}

export function updatePipelineStage(
  opportunityId: string,
  newStage: "IDENTIFIED" | "PREPARED" | "CONTACTED_MANUAL" | "DEMOED" | "PROPOSAL" | "CLOSED_WON" | "CLOSED_LOST"
) {
  const opp = db.select().from(institutionalPipeline).where(eq(institutionalPipeline.id, opportunityId)).get();
  if (!opp) throw new Error(`Opportunity ${opportunityId} not found`);

  const now = new Date().toISOString();
  db.update(institutionalPipeline)
    .set({ stage: newStage, updatedAt: now })
    .where(eq(institutionalPipeline.id, opportunityId))
    .run();

  return { id: opportunityId, previousStage: opp.stage, newStage, updatedAt: now };
}

// ============================================================================
// GTM SYSTEM SUMMARY / METRICS
// ============================================================================

export function getGtmSummary() {
  const allLeads = db.select().from(leads).all();
  const allDrafts = db.select().from(contentDrafts).all();
  const googleCap = getOrCreateAdSpendCaps("google");
  const metaCap = getOrCreateAdSpendCaps("meta");
  const pipeline = listInstitutionalPipeline();

  return {
    contentAgent: {
      totalDrafts: allDrafts.length,
      pendingApproval: allDrafts.filter((d) => d.reviewStatus === "PENDING_HUMAN_APPROVAL").length,
      approved: allDrafts.filter((d) => d.reviewStatus === "APPROVED").length,
    },
    adPlatformAgent: {
      google: {
        dailyCapUsd: googleCap.dailyCapUsd,
        currentDaySpendUsd: googleCap.currentDaySpendUsd,
        monthlyCapUsd: googleCap.monthlyCapUsd,
        currentMonthSpendUsd: googleCap.currentMonthSpendUsd,
        circuitLocked: googleCap.circuitLocked === 1,
      },
      meta: {
        dailyCapUsd: metaCap.dailyCapUsd,
        currentDaySpendUsd: metaCap.currentDaySpendUsd,
        monthlyCapUsd: metaCap.monthlyCapUsd,
        currentMonthSpendUsd: metaCap.currentMonthSpendUsd,
        circuitLocked: metaCap.circuitLocked === 1,
      },
    },
    crmAgent: {
      totalLeads: allLeads.length,
      byTier: {
        free: allLeads.filter((l) => l.tierInterest === "free").length,
        pro: allLeads.filter((l) => l.tierInterest === "pro").length,
        institutional: allLeads.filter((l) => l.tierInterest === "institutional").length,
        pilot: allLeads.filter((l) => l.tierInterest === "pilot").length,
      },
    },
    salesPipelineAgent: {
      institutionalOpportunities: pipeline.length,
      pipelineValueMonthlyUsd: pipeline.reduce((sum, p) => sum + (p.dealValueMonthlyUsd ?? 0), 0),
      autoSendEnforced: true,
    },
  };
}
