/**
 * QuanterraOS Personal Risk Plan & Pre-Save Advisory Controls Module
 * 
 * Required Behavior:
 * 1. User-set limits: Let users choose spending limit (daily max outlay), maximum position size (single-trade outlay & contract count), and review reminder.
 * 2. Pre-save risk check: Compares proposed cost with limits and recorded exposure.
 * 3. Related-position warning: Flags multiple recorded positions tied to the same event or underlying asset.
 * 4. Pause option: Offers "Save for later" and optional cooling-off reminder when a limit is exceeded.
 * 5. Explain the warning: Shows which records and assumptions triggered it; lets users correct incomplete data.
 * 6. Advisory controls label: Prominently labels all checks as advisory controls: "QuanterraOS cannot claim to block exchange trading unless an integration actually enforces that restriction."
 * 7. Non-interference: Skipped checks (decision_action = 'skipped') do NOT count as exposure. Incomplete imports show uncertainty.
 */

import { randomUUID } from "node:crypto";
import { eq, and, gte } from "drizzle-orm";
import { db } from "./db.ts";
import { userRiskPlans, userDecisionJournal, importedStatementRecords } from "./schema.ts";
import { logEvent } from "./metrics.ts";

export const ADVISORY_CONTROL_DISCLAIMER =
  "Advisory Control: QuanterraOS cannot claim to block exchange trading unless an integration actually enforces that restriction. All limits, reminders, and alerts are voluntary personal boundaries.";

export interface UserRiskPlan {
  id: string;
  userId: string;
  dailyMaxOutlay: number; // Spending limit ($)
  singleTradeMaxOutlay: number; // Maximum position size ($)
  maxContractsPerTrade: number; // Maximum contracts per trade (count)
  maxConcurrentPositions: number;
  correlatedMarketAlert: boolean;
  reviewReminder: "settlement" | "daily" | "weekly" | "off";
  coolingOffMinutes: number; // Cooling-off reminder duration
  updatedAt: string;
}

export type RiskPlan = UserRiskPlan;

export const DEFAULT_RISK_PLAN: Omit<UserRiskPlan, "id" | "userId" | "updatedAt"> = {
  dailyMaxOutlay: 50.0,
  singleTradeMaxOutlay: 25.0,
  maxContractsPerTrade: 50,
  maxConcurrentPositions: 3,
  correlatedMarketAlert: true,
  reviewReminder: "settlement",
  coolingOffMinutes: 15,
};

export interface RiskAdvisoryWarning {
  type: "single_trade_cap" | "daily_spending_limit" | "contract_count_cap" | "related_position" | "uncertain_exposure";
  title: string;
  message: string;
  severity: "advisory" | "warning";
  triggerRecords?: Array<{
    id: string;
    ticker: string;
    outlay: number;
    action: string;
    createdAt: string;
    settled: boolean;
  }>;
  assumptions?: {
    assumedPrice: number;
    assumedCount: number;
    assumedCost: number;
    assumedFee: number;
    totalProposedOutlay: number;
    basis: string;
  };
}

export interface PreSaveRiskCheckResult {
  isExceeded: boolean;
  canProceedWithAdvisory: boolean;
  advisoryDisclaimer: string;
  status: "WITHIN_LIMITS" | "LIMIT_EXCEEDED";
  // Direct access properties for compatibility
  singleTradeLimit: number;
  dailyLimit: number;
  currentTradeOutlay: number;
  projectedDailyOutlay: number;
  warnings: string[];
  warningDetails: RiskAdvisoryWarning[];
  limits: {
    dailySpendingLimit: number;
    singleTradeMaxOutlay: number;
    maxContractsPerTrade: number;
    reviewReminder: string;
    coolingOffMinutes: number;
  };
  exposure: {
    recordedPast24hOutlay: number;
    proposedTradeOutlay: number;
    projectedTotalOutlay: number;
    activePositionsCount: number;
    relatedPositionsCount: number;
    relatedAsset: string;
    skippedChecksExcludedCount: number;
  };
  hasIncompleteImports: boolean;
  incompleteImportCount: number;
  uncertaintyNotice?: string;
  pauseOption: {
    available: boolean;
    label: string;
    coolingOffMinutes: number;
    recommendedUntil: string;
  };
}

export type RiskAdvisoryCheck = PreSaveRiskCheckResult;

export function extractAssetFromTicker(ticker: string = ""): string {
  const t = ticker.toUpperCase();
  if (t.includes("BTC")) return "BTC";
  if (t.includes("ETH")) return "ETH";
  if (t.includes("SOL")) return "SOL";
  if (t.includes("DOGE")) return "DOGE";
  return "BTC"; // Default canonical asset
}

export function getUserRiskPlan(userId: string): UserRiskPlan {
  const existing = db
    .select()
    .from(userRiskPlans)
    .where(eq(userRiskPlans.userId, userId))
    .get();

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      dailyMaxOutlay: existing.dailyMaxOutlay,
      singleTradeMaxOutlay: existing.singleTradeMaxOutlay,
      maxContractsPerTrade: (existing as any).maxContractsPerTrade ?? DEFAULT_RISK_PLAN.maxContractsPerTrade,
      maxConcurrentPositions: existing.maxConcurrentPositions,
      correlatedMarketAlert: Boolean(existing.correlatedMarketAlert),
      reviewReminder: ((existing as any).reviewReminder as any) ?? DEFAULT_RISK_PLAN.reviewReminder,
      coolingOffMinutes: (existing as any).coolingOffMinutes ?? DEFAULT_RISK_PLAN.coolingOffMinutes,
      updatedAt: existing.updatedAt,
    };
  }

  const newPlan: UserRiskPlan = {
    id: `plan_${randomUUID().slice(0, 12)}`,
    userId,
    ...DEFAULT_RISK_PLAN,
    updatedAt: new Date().toISOString(),
  };

  try {
    db.insert(userRiskPlans)
      .values({
        id: newPlan.id,
        userId: newPlan.userId,
        dailyMaxOutlay: newPlan.dailyMaxOutlay,
        singleTradeMaxOutlay: newPlan.singleTradeMaxOutlay,
        maxConcurrentPositions: newPlan.maxConcurrentPositions,
        correlatedMarketAlert: newPlan.correlatedMarketAlert ? 1 : 0,
        maxContractsPerTrade: newPlan.maxContractsPerTrade,
        reviewReminder: newPlan.reviewReminder,
        coolingOffMinutes: newPlan.coolingOffMinutes,
        updatedAt: newPlan.updatedAt,
      })
      .run();
  } catch (_) {}

  return newPlan;
}

export function saveUserRiskPlan(userId: string, updates: Partial<UserRiskPlan>): UserRiskPlan {
  const current = getUserRiskPlan(userId);
  const updated: UserRiskPlan = {
    ...current,
    dailyMaxOutlay: typeof updates.dailyMaxOutlay === "number" && updates.dailyMaxOutlay > 0 ? updates.dailyMaxOutlay : current.dailyMaxOutlay,
    singleTradeMaxOutlay: typeof updates.singleTradeMaxOutlay === "number" && updates.singleTradeMaxOutlay > 0 ? updates.singleTradeMaxOutlay : current.singleTradeMaxOutlay,
    maxContractsPerTrade: typeof updates.maxContractsPerTrade === "number" && updates.maxContractsPerTrade > 0 ? updates.maxContractsPerTrade : current.maxContractsPerTrade,
    maxConcurrentPositions: typeof updates.maxConcurrentPositions === "number" && updates.maxConcurrentPositions > 0 ? updates.maxConcurrentPositions : current.maxConcurrentPositions,
    correlatedMarketAlert: typeof updates.correlatedMarketAlert === "boolean" ? updates.correlatedMarketAlert : current.correlatedMarketAlert,
    reviewReminder: updates.reviewReminder ?? current.reviewReminder,
    coolingOffMinutes: typeof updates.coolingOffMinutes === "number" && updates.coolingOffMinutes > 0 ? updates.coolingOffMinutes : current.coolingOffMinutes,
    updatedAt: new Date().toISOString(),
  };

  try {
    db.update(userRiskPlans)
      .set({
        dailyMaxOutlay: updated.dailyMaxOutlay,
        singleTradeMaxOutlay: updated.singleTradeMaxOutlay,
        maxConcurrentPositions: updated.maxConcurrentPositions,
        correlatedMarketAlert: updated.correlatedMarketAlert ? 1 : 0,
        maxContractsPerTrade: updated.maxContractsPerTrade,
        reviewReminder: updated.reviewReminder,
        coolingOffMinutes: updated.coolingOffMinutes,
        updatedAt: updated.updatedAt,
      })
      .where(eq(userRiskPlans.userId, userId))
      .run();

    logEvent("risk_plan_updated", userId, {
      dailyMaxOutlay: updated.dailyMaxOutlay,
      singleTradeMaxOutlay: updated.singleTradeMaxOutlay,
      maxContractsPerTrade: updated.maxContractsPerTrade,
      coolingOffMinutes: updated.coolingOffMinutes,
    });
  } catch (_) {}

  return updated;
}

/**
 * Executes Pre-Save Advisory Risk Check comparing proposed trade with user limits and recorded exposure.
 */
export function checkTradeAgainstRiskPlan(
  userId: string,
  trade: { ticker: string; price: number; count: number; purchaseCost: number; exchangeFee: number }
): PreSaveRiskCheckResult {
  const plan = getUserRiskPlan(userId);
  const proposedOutlay = Number((trade.purchaseCost + trade.exchangeFee).toFixed(2));
  const proposedCount = trade.count || 1;
  const asset = extractAssetFromTicker(trade.ticker);

  const stringWarnings: string[] = [];
  const warningDetails: RiskAdvisoryWarning[] = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Retrieve existing journal entries for past 24 hours
  // EXCLUDE skipped checks (decisionAction = 'skipped') and paused cooling-off drafts ('saved_for_later')
  const allRecentJournal = db
    .select({
      id: userDecisionJournal.id,
      contractTicker: userDecisionJournal.contractTicker,
      purchaseCost: userDecisionJournal.purchaseCost,
      exchangeFee: userDecisionJournal.exchangeFee,
      decisionAction: userDecisionJournal.decisionAction,
      status: userDecisionJournal.status,
      outcome: userDecisionJournal.outcome,
      createdAt: userDecisionJournal.createdAt,
    })
    .from(userDecisionJournal)
    .where(
      and(
        eq(userDecisionJournal.userId, userId),
        gte(userDecisionJournal.createdAt, oneDayAgo)
      )
    )
    .all();

  const activeEntries = allRecentJournal.filter(
    (e) => e.decisionAction !== "skipped" && e.decisionAction !== "saved_for_later" && e.status !== "saved_for_later"
  );

  const skippedCount = allRecentJournal.filter((e) => e.decisionAction === "skipped").length;

  const recordedPast24hOutlay = Number(
    activeEntries.reduce((sum, e) => sum + (e.purchaseCost + e.exchangeFee), 0).toFixed(2)
  );
  const projectedTotalOutlay = Number((recordedPast24hOutlay + proposedOutlay).toFixed(2));

  // 1. Single Trade Max Outlay Warning
  if (proposedOutlay > plan.singleTradeMaxOutlay) {
    const msg = `Voluntary Cap: Outlay of $${proposedOutlay.toFixed(2)} exceeds your configured single-trade cap of $${plan.singleTradeMaxOutlay.toFixed(2)}.`;
    stringWarnings.push(msg);
    warningDetails.push({
      type: "single_trade_cap",
      title: "Position Size Cap Exceeded",
      severity: "warning",
      message: msg,
      assumptions: {
        assumedPrice: trade.price,
        assumedCount: trade.count,
        assumedCost: trade.purchaseCost,
        assumedFee: trade.exchangeFee,
        totalProposedOutlay: proposedOutlay,
        basis: "executable_ask",
      },
    });
  }

  // 2. Maximum Contracts Per Trade Warning
  if (proposedCount > plan.maxContractsPerTrade) {
    const msg = `Position Quantity Cap: Proposed order of ${proposedCount} contracts exceeds your voluntary position limit of ${plan.maxContractsPerTrade} contracts per trade.`;
    stringWarnings.push(msg);
    warningDetails.push({
      type: "contract_count_cap",
      title: "Contract Quantity Limit Exceeded",
      severity: "warning",
      message: msg,
      assumptions: {
        assumedPrice: trade.price,
        assumedCount: trade.count,
        assumedCost: trade.purchaseCost,
        assumedFee: trade.exchangeFee,
        totalProposedOutlay: proposedOutlay,
        basis: "executable_ask",
      },
    });
  }

  // 3. Daily Spending Limit Warning
  if (projectedTotalOutlay > plan.dailyMaxOutlay) {
    const triggerRecords = activeEntries.map((e) => ({
      id: e.id,
      ticker: e.contractTicker,
      outlay: Number((e.purchaseCost + e.exchangeFee).toFixed(2)),
      action: e.decisionAction,
      createdAt: e.createdAt,
      settled: e.outcome === "WON" || e.outcome === "LOST",
    }));

    const msg = `Daily Outlay Advisory: 24h allocation of $${projectedTotalOutlay.toFixed(2)} ($${recordedPast24hOutlay.toFixed(2)} recorded + $${proposedOutlay.toFixed(2)} proposed) exceeds your voluntary daily cap of $${plan.dailyMaxOutlay.toFixed(2)}.`;
    stringWarnings.push(msg);
    warningDetails.push({
      type: "daily_spending_limit",
      title: "Daily Spending Limit Exceeded",
      severity: "warning",
      message: msg,
      triggerRecords,
      assumptions: {
        assumedPrice: trade.price,
        assumedCount: trade.count,
        assumedCost: trade.purchaseCost,
        assumedFee: trade.exchangeFee,
        totalProposedOutlay: proposedOutlay,
        basis: "cumulative_24h_outlay",
      },
    });
  }

  // 4. Related-Position Warning (multiple positions tied to same event / asset)
  const relatedPositions = activeEntries.filter((e) => {
    const entryAsset = extractAssetFromTicker(e.contractTicker);
    return entryAsset === asset || e.contractTicker.toUpperCase() === trade.ticker.toUpperCase();
  });

  if (plan.correlatedMarketAlert && relatedPositions.length > 0) {
    const relatedTotalOutlay = relatedPositions.reduce((acc, e) => acc + (e.purchaseCost + e.exchangeFee), 0);
    const msg = `Related Positions Warning: You have ${relatedPositions.length} active recorded position(s) tied to ${asset} (total recorded outlay: $${relatedTotalOutlay.toFixed(2)}). Market movements will impact all related positions simultaneously.`;
    stringWarnings.push(msg);
    warningDetails.push({
      type: "related_position",
      title: `Related Positions Detected (${asset})`,
      severity: "advisory",
      message: msg,
      triggerRecords: relatedPositions.map((e) => ({
        id: e.id,
        ticker: e.contractTicker,
        outlay: Number((e.purchaseCost + e.exchangeFee).toFixed(2)),
        action: e.decisionAction,
        createdAt: e.createdAt,
        settled: e.outcome === "WON" || e.outcome === "LOST",
      })),
      assumptions: {
        assumedPrice: trade.price,
        assumedCount: trade.count,
        assumedCost: trade.purchaseCost,
        assumedFee: trade.exchangeFee,
        totalProposedOutlay: proposedOutlay,
        basis: "asset_correlation",
      },
    });
  }

  // 5. Incomplete Imports & Data Uncertainty Detection
  let hasIncompleteImports = false;
  let incompleteImportCount = 0;
  try {
    const incompleteStmt = db
      .select({ id: importedStatementRecords.id })
      .from(importedStatementRecords)
      .where(
        and(
          eq(importedStatementRecords.userId, userId),
          eq(importedStatementRecords.settled, 0)
        )
      )
      .all();

    const incompleteJournal = db
      .select({ id: userDecisionJournal.id })
      .from(userDecisionJournal)
      .where(
        and(
          eq(userDecisionJournal.userId, userId),
          eq(userDecisionJournal.outcomeStatus, "incomplete")
        )
      )
      .all();

    incompleteImportCount = incompleteStmt.length + incompleteJournal.length;
    if (incompleteImportCount > 0) {
      hasIncompleteImports = true;
      const msg = `Uncertainty Notice: ${incompleteImportCount} imported or recorded position(s) contain incomplete pricing or unsettled statement data. Recorded exposure totals carry uncertainty until reconciled.`;
      stringWarnings.push(msg);
      warningDetails.push({
        type: "uncertain_exposure",
        title: "Exposure Uncertainty Notice",
        severity: "advisory",
        message: msg,
      });
    }
  } catch (_) {}

  const isExceeded = warningDetails.some(
    (w) => w.type === "single_trade_cap" || w.type === "daily_spending_limit" || w.type === "contract_count_cap"
  );

  const coolingOffRecommendedUntil = new Date(Date.now() + plan.coolingOffMinutes * 60 * 1000).toISOString();

  return {
    isExceeded,
    canProceedWithAdvisory: true, // Always voluntary
    advisoryDisclaimer: ADVISORY_CONTROL_DISCLAIMER,
    status: isExceeded ? "LIMIT_EXCEEDED" : "WITHIN_LIMITS",
    singleTradeLimit: plan.singleTradeMaxOutlay,
    dailyLimit: plan.dailyMaxOutlay,
    currentTradeOutlay: proposedOutlay,
    projectedDailyOutlay: projectedTotalOutlay,
    warnings: stringWarnings,
    warningDetails,
    limits: {
      dailySpendingLimit: plan.dailyMaxOutlay,
      singleTradeMaxOutlay: plan.singleTradeMaxOutlay,
      maxContractsPerTrade: plan.maxContractsPerTrade,
      reviewReminder: plan.reviewReminder,
      coolingOffMinutes: plan.coolingOffMinutes,
    },
    exposure: {
      recordedPast24hOutlay,
      proposedTradeOutlay: proposedOutlay,
      projectedTotalOutlay,
      activePositionsCount: activeEntries.length,
      relatedPositionsCount: relatedPositions.length,
      relatedAsset: asset,
      skippedChecksExcludedCount: skippedCount,
    },
    hasIncompleteImports,
    incompleteImportCount,
    uncertaintyNotice: hasIncompleteImports
      ? `Uncertainty Notice: ${incompleteImportCount} unconfirmed or incomplete record(s) detected. Exposure may differ from actual broker statement until reconciled.`
      : undefined,
    pauseOption: {
      available: true,
      label: `Save for Later (${plan.coolingOffMinutes}-min Cooling-Off)`,
      coolingOffMinutes: plan.coolingOffMinutes,
      recommendedUntil: coolingOffRecommendedUntil,
    },
  };
}

/**
 * Saves a check into the decision journal with a paused / cooling-off status, ensuring it does NOT count as active exposure.
 */
export function saveCheckForLater(
  userId: string,
  check: {
    contractTicker: string;
    price: number;
    count: number;
    purchaseCost: number;
    exchangeFee: number;
    breakevenWinProb?: number;
    assessedWinProb?: number;
    reasoning?: string;
    coolingOffMinutes?: number;
  }
): { id: string; status: string; coolingOffUntil: string } {
  const plan = getUserRiskPlan(userId);
  const minutes = check.coolingOffMinutes || plan.coolingOffMinutes || 15;
  const coolingOffUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  const id = `jrn_pause_${randomUUID().slice(0, 10)}`;

  const now = new Date().toISOString();
  const price = check.price || 0.51;
  const count = check.count || 10;
  const cost = check.purchaseCost || price * count;
  const fee = check.exchangeFee || 0.18;

  db.insert(userDecisionJournal)
    .values({
      id,
      userId,
      venue: (check as any).venue || "kalshi-15m",
      contractTicker: check.contractTicker || "KXBTC15M",
      contractType: "binary_above_below",
      side: "yes",
      pricingBasis: "executable_ask",
      contractPrice: price,
      contractCount: count,
      purchaseCost: cost,
      exchangeFee: fee,
      halfSpreadDrag: 0.0,
      totalDrag: fee,
      breakevenWinProb: check.breakevenWinProb || 52.8,
      assessedWinProb: check.assessedWinProb || 55.0,
      netExpectedValue: 0.0,
      settlementSource: "CME CF BRTI 60s TWAP",
      reasoning: check.reasoning || "Paused for voluntary cooling-off reflection",
      decisionAction: "saved_for_later",
      status: "saved_for_later",
      coolingOffUntil,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logEvent("check_paused_cooling_off", userId, {
    journalId: id,
    coolingOffMinutes: minutes,
    coolingOffUntil,
  });

  return { id, status: "saved_for_later", coolingOffUntil };
}

/**
 * Renders the HTML settings component for the Personal Risk Plan in /account.
 */
export function renderRiskPlanSettingsHtml(plan: UserRiskPlan): string {
  return `
  <div class="risk-plan-card" id="risk-plan-settings-card" style="background: rgba(14, 20, 30, 0.75); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 24px; margin-top: 24px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
      <div>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent); text-transform:uppercase; letter-spacing:0.06em;">Voluntary Risk Governance</div>
        <h3 style="font-size:1.1rem; font-weight:700; color:#FFFFFF; margin-top:2px;">Personal Risk Plan &amp; Advisory Controls</h3>
      </div>
      <div>
        <span class="status-badge" style="font-family:var(--font-mono); font-size:0.72rem; padding:4px 10px; border-radius:4px; font-weight:700; background:rgba(212,175,55,0.15); color:var(--accent); border:1px solid rgba(212,175,55,0.3);">
          ADVISORY CONTROLS
        </span>
      </div>
    </div>

    <div style="font-size:0.82rem; color:var(--muted); background:rgba(0,0,0,0.35); padding:10px 14px; border-radius:6px; margin-bottom:20px; border-left:3px solid var(--accent); line-height:1.45;">
      <strong>Advisory Disclaimer:</strong> QuanterraOS cannot claim to block exchange trading unless an integration actually enforces that restriction. All limits, reminders, and alerts are voluntary personal boundaries to protect decision quality.
    </div>

    <form id="risk-plan-form" onsubmit="event.preventDefault(); saveRiskPlanSettings();" style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
      <div>
        <label style="display:block; font-family:var(--font-mono); font-size:0.78rem; color:var(--text-dim); margin-bottom:6px;">
          Daily Spending Limit ($)
        </label>
        <div style="position:relative;">
          <span style="position:absolute; left:12px; top:10px; color:var(--muted); font-family:var(--font-mono);">$</span>
          <input type="number" id="rp-daily-limit" min="1" step="1" value="${plan.dailyMaxOutlay}" style="width:100%; background:#06090E; border:1px solid rgba(212,175,55,0.25); color:#FFFFFF; padding:8px 12px 8px 28px; border-radius:4px; font-family:var(--font-mono); font-size:0.9rem;" required>
        </div>
        <span style="font-size:0.72rem; color:var(--muted); display:block; margin-top:4px;">Cumulative 24-hour total outlay cap across all contracts.</span>
      </div>

      <div>
        <label style="display:block; font-family:var(--font-mono); font-size:0.78rem; color:var(--text-dim); margin-bottom:6px;">
          Maximum Position Size ($)
        </label>
        <div style="position:relative;">
          <span style="position:absolute; left:12px; top:10px; color:var(--muted); font-family:var(--font-mono);">$</span>
          <input type="number" id="rp-single-limit" min="1" step="1" value="${plan.singleTradeMaxOutlay}" style="width:100%; background:#06090E; border:1px solid rgba(212,175,55,0.25); color:#FFFFFF; padding:8px 12px 8px 28px; border-radius:4px; font-family:var(--font-mono); font-size:0.9rem;" required>
        </div>
        <span style="font-size:0.72rem; color:var(--muted); display:block; margin-top:4px;">Maximum capital allocation for any single contract check.</span>
      </div>

      <div>
        <label style="display:block; font-family:var(--font-mono); font-size:0.78rem; color:var(--text-dim); margin-bottom:6px;">
          Max Contracts Per Order
        </label>
        <input type="number" id="rp-max-contracts" min="1" step="1" value="${plan.maxContractsPerTrade}" style="width:100%; background:#06090E; border:1px solid rgba(212,175,55,0.25); color:#FFFFFF; padding:8px 12px; border-radius:4px; font-family:var(--font-mono); font-size:0.9rem;" required>
        <span style="font-size:0.72rem; color:var(--muted); display:block; margin-top:4px;">Cap on contract quantity for a single decision check.</span>
      </div>

      <div>
        <label style="display:block; font-family:var(--font-mono); font-size:0.78rem; color:var(--text-dim); margin-bottom:6px;">
          Cooling-Off Pause (Minutes)
        </label>
        <input type="number" id="rp-cooling-minutes" min="1" max="1440" step="1" value="${plan.coolingOffMinutes}" style="width:100%; background:#06090E; border:1px solid rgba(212,175,55,0.25); color:#FFFFFF; padding:8px 12px; border-radius:4px; font-family:var(--font-mono); font-size:0.9rem;" required>
        <span style="font-size:0.72rem; color:var(--muted); display:block; margin-top:4px;">Pause timer duration when limit is exceeded or check saved for later.</span>
      </div>

      <div style="grid-column: 1 / -1;">
        <label style="display:block; font-family:var(--font-mono); font-size:0.78rem; color:var(--text-dim); margin-bottom:6px;">
          Discipline Review Reminder
        </label>
        <select id="rp-review-reminder" style="width:100%; background:#06090E; border:1px solid rgba(212,175,55,0.25); color:#FFFFFF; padding:8px 12px; border-radius:4px; font-family:var(--font-mono); font-size:0.9rem;">
          <option value="settlement" ${plan.reviewReminder === 'settlement' ? 'selected' : ''}>Immediately post-settlement (15-min cadence)</option>
          <option value="daily" ${plan.reviewReminder === 'daily' ? 'selected' : ''}>Daily evening reconciliation</option>
          <option value="weekly" ${plan.reviewReminder === 'weekly' ? 'selected' : ''}>Weekly Sunday calibration digest</option>
          <option value="off" ${plan.reviewReminder === 'off' ? 'selected' : ''}>Off (Manual review only)</option>
        </select>
      </div>

      <div style="grid-column: 1 / -1;">
        <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer;">
          <input type="checkbox" id="rp-correlated-alert" ${plan.correlatedMarketAlert ? 'checked' : ''} style="margin-top:3px; accent-color:var(--accent); width:16px; height:16px;">
          <div>
            <strong style="font-size:0.86rem; color:var(--text); display:block;">Related-Position &amp; Correlated Exposure Alert</strong>
            <span style="font-size:0.76rem; color:var(--muted);">Warn when multiple active recorded checks exist on the same underlying asset (e.g. BTC 15M + BTC Hourly).</span>
          </div>
        </label>
      </div>

      <div style="grid-column: 1 / -1; display:flex; justify-content:flex-end; gap:12px; margin-top:10px;">
        <button type="submit" class="btn btn-outline" style="padding:8px 20px; font-size:0.84rem; font-weight:700; font-family:var(--font-mono); color:var(--accent); border-color:var(--accent);">
          SAVE RISK PLAN LIMITS
        </button>
      </div>
    </form>
    <div id="risk-plan-save-status" style="margin-top:12px; font-size:0.82rem; font-family:var(--font-mono); display:none;"></div>
  </div>

  <script>
    function saveRiskPlanSettings() {
      var daily = parseFloat(document.getElementById('rp-daily-limit').value);
      var single = parseFloat(document.getElementById('rp-single-limit').value);
      var contracts = parseInt(document.getElementById('rp-max-contracts').value, 10);
      var cooling = parseInt(document.getElementById('rp-cooling-minutes').value, 10);
      var reminder = document.getElementById('rp-review-reminder').value;
      var correlated = document.getElementById('rp-correlated-alert').checked;
      var statusEl = document.getElementById('risk-plan-save-status');

      fetch('/api/account/risk-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyMaxOutlay: daily,
          singleTradeMaxOutlay: single,
          maxContractsPerTrade: contracts,
          coolingOffMinutes: cooling,
          reviewReminder: reminder,
          correlatedMarketAlert: correlated
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (statusEl) {
          statusEl.style.display = 'block';
          if (res.success) {
            statusEl.style.color = '#10B981';
            statusEl.innerText = '✓ Voluntary risk plan limits updated successfully.';
          } else {
            statusEl.style.color = '#F43F5E';
            statusEl.innerText = 'Error: ' + (res.error || 'Failed to update plan.');
          }
          setTimeout(function() { statusEl.style.display = 'none'; }, 4000);
        }
      })
      .catch(function(err) {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.color = '#F43F5E';
          statusEl.innerText = 'Network error saving risk plan.';
        }
      });
    }
  </script>
  `;
}

/**
 * Renders the HTML component for the Pre-Save Risk Check card shown on the Calculator page.
 */
export function renderPreSaveRiskCheckHtml(): string {
  return `
  <div class="pre-save-risk-card" id="pre-save-risk-box" style="display:none; background: rgba(14, 20, 32, 0.95); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 20px; margin-top: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:1rem;">🛡️</span>
        <strong style="font-family:var(--font-mono); font-size:0.85rem; color:#FFFFFF; text-transform:uppercase; letter-spacing:0.04em;">Pre-Save Advisory Risk Check</strong>
      </div>
      <span class="status-badge" id="risk-check-status-badge" style="font-family:var(--font-mono); font-size:0.7rem; padding:3px 8px; border-radius:4px; font-weight:700;">
        CALCULATING...
      </span>
    </div>

    <!-- Advisory Control Disclaimer -->
    <div style="font-size:0.75rem; color:var(--muted); line-height:1.4; margin-bottom:14px; padding:8px 10px; background:rgba(0,0,0,0.4); border-radius:4px; border-left:2px solid var(--accent);">
      <strong>Advisory Control:</strong> QuanterraOS cannot claim to block exchange trading unless an integration actually enforces that restriction. All limits are voluntary personal boundaries.
    </div>

    <!-- Comparison Metrics Grid -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
      <div style="background:rgba(6,9,14,0.7); padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
        <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Proposed Trade Outlay</div>
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
          <span id="risk-val-trade-outlay" style="font-family:var(--font-mono); font-size:1rem; font-weight:700; color:#FFFFFF;">$0.00</span>
          <span style="font-size:0.72rem; color:var(--muted);">Cap: <strong id="risk-val-single-cap" style="color:var(--text);">$25.00</strong></span>
        </div>
      </div>

      <div style="background:rgba(6,9,14,0.7); padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
        <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--muted); text-transform:uppercase;">Projected 24h Outlay</div>
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
          <span id="risk-val-projected-outlay" style="font-family:var(--font-mono); font-size:1rem; font-weight:700; color:#FFFFFF;">$0.00</span>
          <span style="font-size:0.72rem; color:var(--muted);">Limit: <strong id="risk-val-daily-limit" style="color:var(--text);">$50.00</strong></span>
        </div>
      </div>
    </div>

    <!-- Warning / Advisory Details Area -->
    <div id="risk-warning-container" style="display:none; margin-bottom:16px;">
      <div id="risk-warning-list" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>

    <!-- Uncertainty Notice Area -->
    <div id="risk-uncertainty-box" style="display:none; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); padding:10px; border-radius:6px; margin-bottom:14px; font-size:0.78rem; color:#FBBF24;">
      <span id="risk-uncertainty-text"></span>
      <div style="margin-top:6px;">
        <a href="/account" style="color:#FBBF24; text-decoration:underline; font-weight:600;">Correct incomplete data in Account &rarr;</a>
      </div>
    </div>

    <!-- Action Buttons (Save for Later Pause vs Commit) -->
    <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
      <button type="button" id="btn-save-for-later" class="btn" onclick="saveCheckForLaterAction()" style="background:rgba(212,175,55,0.12); color:var(--accent); border:1px solid rgba(212,175,55,0.3); padding:8px 14px; font-size:0.8rem; font-weight:700; font-family:var(--font-mono); border-radius:4px;">
        ⏸ SAVE FOR LATER (COOLING-OFF)
      </button>
      <button type="button" id="btn-proceed-save" class="btn btn-gold" onclick="executeProceedSaveCheck()" style="padding:8px 16px; font-size:0.8rem; font-weight:700; font-family:var(--font-mono); border-radius:4px;">
        PROCEED TO SAVE &rarr;
      </button>
    </div>
  </div>
  `;
}
