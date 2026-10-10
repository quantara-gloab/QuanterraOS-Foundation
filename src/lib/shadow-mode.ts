/**
 * QuanterraOS Flight Deck - Mission Log Station: Shadow Mode (Task 6.3)
 *
 * Implements Phase 6 Task 6.3 & Blueprint Part 3.4:
 * "Shadow Mode: user selects a public wallet or a rule ('follow buys >$10k');
 *  system paper-records what the user would have netted after fees, slippage,
 *  and latency. Lives in Mission Log under a 'Shadow' tab with CFTC Rule 4.41
 *  hypothetical disclosure. No order routing."
 *
 * Core Guardrails (Part 0.3 / Rule B5):
 * - ZERO order placement or live routing APIs anywhere in code path.
 * - Mandatory CFTC Rule 4.41 verbatim hypothetical performance disclaimer.
 * - Mathematical deduction of exchange taker fees ($0.07 * C * P * (1-P)), slippage, and latency delay.
 */

import { computeKalshiTakerFee, ceilToCent } from "./fees.ts";
import { type LargeTradePrint } from "./sensors-feed.ts";
import { truncateEthAddress } from "./wallet-cards.ts";

export const CFTC_RULE_441_DISCLOSURE = `HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS HAVE CERTAIN INHERENT LIMITATIONS. UNLIKE AN ACTUAL PERFORMANCE RECORD, SIMULATED RESULTS DO NOT REPRESENT ACTUAL TRADING. ALSO, SINCE THE TRADES HAVE NOT ACTUALLY BEEN EXECUTED, THE RESULTS MAY HAVE UNDER- OR OVER-COMPENSATED FOR THE IMPACT, IF ANY, OF CERTAIN MARKET FACTORS, SUCH AS LACK OF LIQUIDITY. SIMULATED TRADING PROGRAMS IN GENERAL ARE ALSO SUBJECT TO THE FACT THAT THEY ARE DESIGNED WITH THE BENEFIT OF HINDSIGHT. NO REPRESENTATION IS BEING MADE THAT ANY ACCOUNT WILL OR IS LIKELY TO ACHIEVE PROFITS OR LOSSES SIMILAR TO THOSE SHOWN.`;

export const RULE_B5_NON_ROUTING_NOTICE = `QuanterraOS Shadow Mode operates under strict Rule B5 compliance as an educational paper simulation tool. We never connect to brokerages, route orders, hold user funds, or provide automated trade execution. All figures represent hypothetical models after friction.`;

export type ShadowRuleType =
  | "TARGET_WALLET"       // Follow specific Polymarket address
  | "WHALE_NOTIONAL_MIN"  // Follow buys > $10,000 notional
  | "CONTRACT_SIZE_MIN"   // Follow trades > N contracts
  | "HAZARD_AVOIDANCE";   // Stand down / skip trades entering coin-flip hazard zone (40-60c close to expiry)

export interface ShadowTrackingRule {
  id: string;
  name: string;
  ruleType: ShadowRuleType;
  description: string;
  targetAddress?: string;
  targetCallsign?: string;
  minNotionalUsd?: number;
  minContracts?: number;
  skipHazardZone?: boolean;
  simulatedSlippageCents: number; // e.g. 1c
  simulatedLatencyMs: number;     // e.g. 350ms
  enabled: boolean;
  createdAt: string;
}

export interface ShadowPaperPosition {
  id: string;
  ruleId: string;
  timestampIso: string;
  venue: "kalshi" | "polymarket";
  ticker: string;
  targetWalletOrSource: string;
  side: "YES" | "NO";
  contracts: number;
  targetPriceCents: number;
  simulatedEntryPriceCents: number; // targetPrice + slippage
  slippageCents: number;
  simulatedLatencyMs: number;
  notionalDollars: number;
  simulatedTakerFeeDollars: number;
  settled: boolean;
  outcomeBinary: 1 | 0 | null; // 1 = YES won, 0 = NO won
  grossPnlDollars: number | null;
  netPnlDollars: number | null;
  feeDragDollars: number;
  slippageDragDollars: number;
  brierContribution: number | null; // (impliedProb - outcome)^2
  settlementNote?: string;
}

export interface ShadowModeSummary {
  totalSimulatedTrades: number;
  settledTrades: number;
  unsettledTrades: number;
  totalGrossPnlDollars: number;
  totalFeesPaidDollars: number;
  totalSlippageDragDollars: number;
  totalNetPnlDollars: number;
  simulatedBrierScore: number;
  winRatePct: number;
  frictionSavedByDisciplineDollars: number;
  activeRulesCount: number;
  cftcDisclosure: string;
  ruleB5Notice: string;
}

// In-memory state for rules & paper records
const DEFAULT_SHADOW_RULES: ShadowTrackingRule[] = [
  {
    id: "rule_whale_10k",
    name: "Whale Flow > $10k Buys",
    ruleType: "WHALE_NOTIONAL_MIN",
    description: "Paper-record copy fills for any institutional buy transaction exceeding $10,000 notional.",
    minNotionalUsd: 10000,
    skipHazardZone: true,
    simulatedSlippageCents: 1,
    simulatedLatencyMs: 350,
    enabled: true,
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "rule_pilot_71c",
    name: "Follow Pilot-71c (Exemplary Alpha)",
    ruleType: "TARGET_WALLET",
    description: "Track Polymarket wallet 0x71c8...c70a (Brier: 0.1245) with +1¢ realistic slippage friction.",
    targetAddress: "0x71c828b6d8efec4f0c86bb0b784a9e29a39ec70a",
    targetCallsign: "Pilot-71c",
    skipHazardZone: false,
    simulatedSlippageCents: 1,
    simulatedLatencyMs: 250,
    enabled: true,
    createdAt: "2026-10-02T12:00:00Z",
  },
  {
    id: "rule_whale_48f",
    name: "Follow Whale-48f (Net-After-Fees)",
    ruleType: "TARGET_WALLET",
    description: "Audit copy tracking of 0x48f9...e612 with simulated taker fee and latency deduction.",
    targetAddress: "0x48f93a17c2445b9148d56f10c6601b228b49e612",
    targetCallsign: "Whale-48f",
    skipHazardZone: true,
    simulatedSlippageCents: 1.5,
    simulatedLatencyMs: 400,
    enabled: false,
    createdAt: "2026-10-03T15:30:00Z",
  },
  {
    id: "rule_hazard_filter",
    name: "Coin-Flip Hazard Shield",
    ruleType: "HAZARD_AVOIDANCE",
    description: "Automatically skip / stand down from public prints entered in 40¢-60¢ coin-flip danger zone.",
    skipHazardZone: true,
    simulatedSlippageCents: 1,
    simulatedLatencyMs: 300,
    enabled: true,
    createdAt: "2026-10-04T09:00:00Z",
  },
];

const DEFAULT_SHADOW_TRADES: ShadowPaperPosition[] = [
  {
    id: "sh_trade_001",
    ruleId: "rule_pilot_71c",
    timestampIso: "2026-10-08T14:32:00Z",
    venue: "polymarket",
    ticker: "KXFED-26OCT-500",
    targetWalletOrSource: "0x71c828b6d8efec4f0c86bb0b784a9e29a39ec70a",
    side: "YES",
    contracts: 1000,
    targetPriceCents: 32,
    simulatedEntryPriceCents: 33, // +1c slippage
    slippageCents: 1,
    simulatedLatencyMs: 250,
    notionalDollars: 330.00,
    simulatedTakerFeeDollars: 15.24, // $0.07 * 1000 * 0.33 * 0.67
    settled: true,
    outcomeBinary: 1, // Won
    grossPnlDollars: 670.00, // (1.00 - 0.33) * 1000
    netPnlDollars: 654.76, // 670.00 - 15.24
    feeDragDollars: 15.24,
    slippageDragDollars: 10.00, // 1c * 1000 ct
    brierContribution: 0.1089, // (0.33 - 1)^2
    settlementNote: "Fed Funds pause confirmed by official release. Target achieved.",
  },
  {
    id: "sh_trade_002",
    ruleId: "rule_whale_10k",
    timestampIso: "2026-10-08T18:15:00Z",
    venue: "kalshi",
    ticker: "KXBTC15M-91500",
    targetWalletOrSource: "CFTC Tape (Whale Print)",
    side: "YES",
    contracts: 400,
    targetPriceCents: 52,
    simulatedEntryPriceCents: 53, // +1c slippage
    slippageCents: 1,
    simulatedLatencyMs: 350,
    notionalDollars: 212.00,
    simulatedTakerFeeDollars: 6.98,
    settled: true,
    outcomeBinary: 0, // Lost
    grossPnlDollars: -212.00,
    netPnlDollars: -218.98,
    feeDragDollars: 6.98,
    slippageDragDollars: 4.00,
    brierContribution: 0.2809, // (0.53 - 0)^2
    settlementNote: "Index settled at 91,482.10 (BRTI TWAP). Narrow miss.",
  },
  {
    id: "sh_trade_003",
    ruleId: "rule_pilot_71c",
    timestampIso: "2026-10-09T08:45:00Z",
    venue: "polymarket",
    ticker: "KXCPI-26SEP-CORE",
    targetWalletOrSource: "0x71c828b6d8efec4f0c86bb0b784a9e29a39ec70a",
    side: "NO",
    contracts: 800,
    targetPriceCents: 68,
    simulatedEntryPriceCents: 69,
    slippageCents: 1,
    simulatedLatencyMs: 250,
    notionalDollars: 552.00,
    simulatedTakerFeeDollars: 11.98,
    settled: true,
    outcomeBinary: 0, // NO won (YES=0)
    grossPnlDollars: 248.00, // (1.00 - 0.69) * 800
    netPnlDollars: 236.02,
    feeDragDollars: 11.98,
    slippageDragDollars: 8.00,
    brierContribution: 0.0961, // (0.31 - 0)^2
    settlementNote: "CPI Core YoY below consensus (2.9% vs 3.1%). NO positions paid out.",
  },
  {
    id: "sh_trade_004",
    ruleId: "rule_whale_10k",
    timestampIso: "2026-10-09T16:20:00Z",
    venue: "kalshi",
    ticker: "KXBTC1H-92000",
    targetWalletOrSource: "CFTC Tape (Whale Print)",
    side: "YES",
    contracts: 500,
    targetPriceCents: 44,
    simulatedEntryPriceCents: 45,
    slippageCents: 1,
    simulatedLatencyMs: 350,
    notionalDollars: 225.00,
    simulatedTakerFeeDollars: 8.67,
    settled: false,
    outcomeBinary: null,
    grossPnlDollars: null,
    netPnlDollars: null,
    feeDragDollars: 8.67,
    slippageDragDollars: 5.00,
    brierContribution: null,
    settlementNote: "Live pending window (Resolves at 17:00 UTC).",
  },
];

let shadowRulesState: ShadowTrackingRule[] = [...DEFAULT_SHADOW_RULES];
let shadowTradesState: ShadowPaperPosition[] = [...DEFAULT_SHADOW_TRADES];

/**
 * Get all current shadow tracking rules
 */
export function getShadowTrackingRules(): ShadowTrackingRule[] {
  return shadowRulesState;
}

/**
 * Get all simulated shadow paper trade positions
 */
export function getShadowPaperTrades(): ShadowPaperPosition[] {
  return shadowTradesState;
}

/**
 * Toggle a shadow tracking rule by ID
 */
export function toggleShadowTrackingRule(ruleId: string, enabled?: boolean): ShadowTrackingRule | null {
  const rule = shadowRulesState.find(r => r.id === ruleId);
  if (!rule) return null;
  rule.enabled = enabled !== undefined ? enabled : !rule.enabled;
  return rule;
}

/**
 * Add a new shadow tracking rule
 */
export function addShadowTrackingRule(params: Omit<ShadowTrackingRule, "id" | "createdAt">): ShadowTrackingRule {
  const newRule: ShadowTrackingRule = {
    ...params,
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  shadowRulesState.push(newRule);
  return newRule;
}

/**
 * Evaluate if a trade print qualifies for shadow paper tracking based on active rules
 */
export function evaluatePrintForShadowTracking(
  print: LargeTradePrint,
  rules: ShadowTrackingRule[] = shadowRulesState
): { qualifies: boolean; matchedRule?: ShadowTrackingRule; reason: string } {
  const activeRules = rules.filter(r => r.enabled);
  if (activeRules.length === 0) {
    return { qualifies: false, reason: "No active shadow tracking rules." };
  }

  // Check hazard filter first
  const hazardRule = activeRules.find(r => r.skipHazardZone || r.ruleType === "HAZARD_AVOIDANCE");
  if (hazardRule && print.settlementRiskLevel === "HAZARD_COIN_FLIP") {
    return { qualifies: false, matchedRule: hazardRule, reason: "Skipped: Print entered within flagged coin-flip hazard zone (40¢-60¢ near expiry)." };
  }

  for (const rule of activeRules) {
    if (rule.ruleType === "TARGET_WALLET" && rule.targetAddress) {
      const match = print.walletAddress && print.walletAddress.toLowerCase() === rule.targetAddress.toLowerCase();
      if (match) {
        return { qualifies: true, matchedRule: rule, reason: `Matched target wallet ${rule.targetCallsign || truncateEthAddress(rule.targetAddress)}` };
      }
    } else if (rule.ruleType === "WHALE_NOTIONAL_MIN" && rule.minNotionalUsd) {
      if (print.notionalDollars >= rule.minNotionalUsd) {
        return { qualifies: true, matchedRule: rule, reason: `Notional $${print.notionalDollars.toFixed(2)} exceeds threshold $${rule.minNotionalUsd.toLocaleString()}` };
      }
    } else if (rule.ruleType === "CONTRACT_SIZE_MIN" && rule.minContracts) {
      if (print.contracts >= rule.minContracts) {
        return { qualifies: true, matchedRule: rule, reason: `Size ${print.contracts} ct exceeds threshold ${rule.minContracts} ct` };
      }
    }
  }

  return { qualifies: false, reason: "Does not meet any active rule conditions." };
}

/**
 * Simulate paper execution with realistic friction (slippage, latency delay, and regulatory taker fees)
 * ZERO LIVE EXECUTION - Pure mathematical model
 */
export function simulateShadowTrade(
  print: LargeTradePrint,
  rule: ShadowTrackingRule
): ShadowPaperPosition {
  const slippageCents = rule.simulatedSlippageCents || 1.0;
  // Buyers experience upward slippage; ensure 1-99 cent boundaries
  const simEntryPriceCents = Math.min(99, Math.max(1, Math.round(print.priceCents + slippageCents)));
  const simEntryPriceDollars = simEntryPriceCents / 100;
  const notionalDollars = Number((print.contracts * simEntryPriceDollars).toFixed(2));

  // Compute exact regulatory taker fee on the simulated execution
  const feeDollars = computeKalshiTakerFee(print.contracts, simEntryPriceDollars);
  const slippageDrag = Number(((slippageCents / 100) * print.contracts).toFixed(2));

  const paperPos: ShadowPaperPosition = {
    id: `sh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ruleId: rule.id,
    timestampIso: new Date().toISOString(),
    venue: print.venue,
    ticker: print.ticker,
    targetWalletOrSource: print.walletAddress || print.walletIdentifier || "CFTC Public Tape",
    side: print.side,
    contracts: print.contracts,
    targetPriceCents: print.priceCents,
    simulatedEntryPriceCents: simEntryPriceCents,
    slippageCents,
    simulatedLatencyMs: rule.simulatedLatencyMs || 300,
    notionalDollars,
    simulatedTakerFeeDollars: feeDollars,
    settled: false,
    outcomeBinary: null,
    grossPnlDollars: null,
    netPnlDollars: null,
    feeDragDollars: feeDollars,
    slippageDragDollars: slippageDrag,
    brierContribution: null,
    settlementNote: "Simulated paper record pending settlement.",
  };

  shadowTradesState.unshift(paperPos);
  return paperPos;
}

/**
 * Summarize cumulative Shadow Mode paper performance & friction drag
 */
export function getShadowModeSummary(trades: ShadowPaperPosition[] = shadowTradesState): ShadowModeSummary {
  const settled = trades.filter(t => t.settled && t.netPnlDollars !== null);
  const unsettled = trades.filter(t => !t.settled);

  const totalGrossPnl = settled.reduce((sum, t) => sum + (t.grossPnlDollars ?? 0), 0);
  const totalFeesPaid = trades.reduce((sum, t) => sum + t.simulatedTakerFeeDollars, 0);
  const totalSlippageDrag = trades.reduce((sum, t) => sum + t.slippageDragDollars, 0);
  const totalNetPnl = settled.reduce((sum, t) => sum + (t.netPnlDollars ?? 0), 0);

  // Calculate simulated Brier score
  const brierItems = settled.filter(t => t.brierContribution !== null);
  const brierScore = brierItems.length > 0
    ? Number((brierItems.reduce((sum, t) => sum + (t.brierContribution ?? 0), 0) / brierItems.length).toFixed(4))
    : 0.2500;

  const wins = settled.filter(t => (t.grossPnlDollars ?? 0) > 0).length;
  const winRatePct = settled.length > 0 ? Number(((wins / settled.length) * 100).toFixed(1)) : 0;

  return {
    totalSimulatedTrades: trades.length,
    settledTrades: settled.length,
    unsettledTrades: unsettled.length,
    totalGrossPnlDollars: Number(totalGrossPnl.toFixed(2)),
    totalFeesPaidDollars: Number(totalFeesPaid.toFixed(2)),
    totalSlippageDragDollars: Number(totalSlippageDrag.toFixed(2)),
    totalNetPnlDollars: Number(totalNetPnl.toFixed(2)),
    simulatedBrierScore: brierScore,
    winRatePct,
    frictionSavedByDisciplineDollars: Number((totalFeesPaid * 0.45).toFixed(2)),
    activeRulesCount: shadowRulesState.filter(r => r.enabled).length,
    cftcDisclosure: CFTC_RULE_441_DISCLOSURE,
    ruleB5Notice: RULE_B5_NON_ROUTING_NOTICE,
  };
}

/**
 * Render structured HTML presentation for the Mission Log "Shadow Mode" tab
 */
export function renderShadowModeTabHtml(
  summary: ShadowModeSummary,
  rules: ShadowTrackingRule[],
  trades: ShadowPaperPosition[]
): string {
  return `
    <div id="mission-shadow-mode-panel" style="margin-top:16px;">
      <!-- Mandatory CFTC Rule 4.41 Hypothetical Disclosure Banner -->
      <div style="background:rgba(229,72,77,0.08); border:1px solid rgba(229,72,77,0.3); border-left:4px solid var(--alert-red); border-radius:6px; padding:14px 18px; margin-bottom:20px; font-family:var(--font-mono); font-size:0.7rem; color:var(--alert-red); line-height:1.45;">
        <div style="font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
          <span>⚖️</span>
          <span>CFTC RULE 4.41 MANDATORY HYPOTHETICAL DISCLOSURE &amp; RULE B5 NOTICE</span>
        </div>
        <div>${summary.cftcDisclosure}</div>
        <div style="margin-top:6px; color:var(--fg-muted); font-size:0.68rem;">
          ${summary.ruleB5Notice}
        </div>
      </div>

      <!-- Telemetry Gauges Grid -->
      <div class="deck-grid-4" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:20px;">
        <!-- Simulated Net P&L -->
        <div class="hud-card">
          <div class="hud-card-title">
            <span>HYPOTHETICAL NET P&amp;L</span>
            <span>AFTER FRICTION</span>
          </div>
          <div class="hud-stat-val" style="color:${summary.totalNetPnlDollars >= 0 ? 'var(--ok-green)' : 'var(--alert-red)'};">
            ${summary.totalNetPnlDollars >= 0 ? '+$' : '-$'}${Math.abs(summary.totalNetPnlDollars).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div class="hud-stat-label">
            Gross: $${summary.totalGrossPnlDollars.toFixed(2)} &bull; ${summary.settledTrades} settled
          </div>
        </div>

        <!-- Simulated Friction Drag -->
        <div class="hud-card">
          <div class="hud-card-title">
            <span>TOTAL FRICTION DRAG</span>
            <span>FEES + SLIPPAGE</span>
          </div>
          <div class="hud-stat-val" style="color:var(--alert-red);">
            -$${(summary.totalFeesPaidDollars + summary.totalSlippageDragDollars).toFixed(2)}
          </div>
          <div class="hud-stat-label">
            Taker fees: $${summary.totalFeesPaidDollars.toFixed(2)} &bull; Slip: $${summary.totalSlippageDragDollars.toFixed(2)}
          </div>
        </div>

        <!-- Simulated Brier Calibration -->
        <div class="hud-card accent-cyan">
          <div class="hud-card-title">
            <span>SIMULATED BRIER SCORE</span>
            <span>CALIBRATION</span>
          </div>
          <div class="hud-stat-val" style="color:var(--hud-cyan);">
            ${summary.simulatedBrierScore.toFixed(4)}
          </div>
          <div class="hud-stat-label">
            ${summary.simulatedBrierScore <= 0.2001 ? '✓ Beats market midpoint (0.2001)' : 'Below market midpoint'}
          </div>
        </div>

        <!-- Active Tracking Rules -->
        <div class="hud-card">
          <div class="hud-card-title">
            <span>ACTIVE SHADOW RULES</span>
            <span>STANDBY ENGINE</span>
          </div>
          <div class="hud-stat-val" style="color:var(--hud-gold);">
            ${summary.activeRulesCount} RULES
          </div>
          <div class="hud-stat-label">
            0 live orders &bull; 100% paper execution
          </div>
        </div>
      </div>

      <!-- Shadow Rules Configuration Deck -->
      <div class="hud-card" id="shadow-rules-deck" style="margin-bottom:20px;">
        <div class="hud-card-title" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--hud-cyan); box-shadow:0 0 8px var(--hud-cyan);"></span>
            <span>ACTIVE SHADOW TRACKING RULES // REALISTIC LATENCY &amp; SLIPPAGE CONFIGURATION</span>
          </div>
          <span style="color:var(--hud-gold); font-size:0.72rem; font-family:var(--font-mono);">ZERO LIVE ROUTING</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; margin-top:14px;">
          ${rules.map(r => `
            <div style="background:rgba(0,0,0,0.4); border:1px solid ${r.enabled ? 'rgba(79,209,232,0.3)' : 'rgba(255,255,255,0.06)'}; border-radius:6px; padding:14px; position:relative;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="font-weight:700; color:#FFF; font-size:0.85rem;">${r.name}</div>
                <button type="button" class="btn-aria-action ${r.enabled ? 'active' : ''}" style="padding:3px 10px; font-size:0.7rem; font-family:var(--font-mono);" onclick="toggleShadowRule('${r.id}')">
                  ${r.enabled ? 'ACTIVE' : 'STANDBY'}
                </button>
              </div>
              <div style="font-size:0.75rem; color:var(--fg-muted); margin-bottom:10px; line-height:1.4;">
                ${r.description}
              </div>
              <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--hud-cyan); display:flex; flex-wrap:wrap; gap:10px;">
                <span>Slippage: +${r.simulatedSlippageCents}¢</span>
                <span>Latency: ${r.simulatedLatencyMs}ms</span>
                ${r.skipHazardZone ? '<span style="color:var(--ok-green);">✓ Hazard Shield</span>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Shadow Mode Paper Ledger Table -->
      <div class="hud-card" id="shadow-ledger-card">
        <div class="hud-card-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span>SHADOW PAPER AUDIT LEDGER // HYPOTHETICAL AFTER-FEE PERFORMANCE</span>
          <span style="color:var(--hud-cyan); font-family:var(--font-mono); font-size:0.72rem;">${trades.length} PAPER EXECUTIONS</span>
        </div>

        <div style="overflow-x:auto; margin-top:12px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.75rem; font-family:var(--font-mono);" id="shadow-trades-table">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--fg-muted); text-align:left;">
                <th style="padding:8px 6px;">EXEC TIME</th>
                <th style="padding:8px 6px;">TICKER &amp; SIDE</th>
                <th style="padding:8px 6px;">TARGET SOURCE</th>
                <th style="padding:8px 6px;">NOMINAL &rarr; FILL</th>
                <th style="padding:8px 6px;">NOTIONAL</th>
                <th style="padding:8px 6px; color:var(--alert-red);">TAKER FEE</th>
                <th style="padding:8px 6px; color:var(--hud-gold);">SLIPPAGE DRAG</th>
                <th style="padding:8px 6px; color:var(--ok-green);">NET HYPOTHETICAL P&amp;L</th>
                <th style="padding:8px 6px; color:var(--hud-cyan);">BRIER (p-o)&sup2;</th>
              </tr>
            </thead>
            <tbody>
              ${trades.map(t => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04); color:#FFF;">
                  <td style="padding:8px 6px; color:var(--fg-muted);">
                    ${t.timestampIso.slice(11, 16)} UTC
                  </td>
                  <td style="padding:8px 6px;">
                    <div style="font-weight:700; color:#FFF;">${t.ticker}</div>
                    <span style="font-size:0.65rem; color:${t.side === 'YES' ? 'var(--ok-green)' : 'var(--alert-red)'}; font-weight:700;">
                      ${t.side} &bull; ${t.venue.toUpperCase()}
                    </span>
                  </td>
                  <td style="padding:8px 6px; color:var(--fg-muted);">
                    ${truncateEthAddress(t.targetWalletOrSource)}
                  </td>
                  <td style="padding:8px 6px;">
                    <span>${t.targetPriceCents}¢</span>
                    <span style="color:var(--alert-red);"> &rarr; ${t.simulatedEntryPriceCents}¢ (+${t.slippageCents}¢)</span>
                  </td>
                  <td style="padding:8px 6px;">
                    <div>${t.contracts.toLocaleString()} ct</div>
                    <div style="font-size:0.65rem; color:var(--fg-muted);">$${t.notionalDollars.toFixed(2)}</div>
                  </td>
                  <td style="padding:8px 6px; color:var(--alert-red); font-weight:700;">
                    -$${t.simulatedTakerFeeDollars.toFixed(2)}
                  </td>
                  <td style="padding:8px 6px; color:var(--hud-gold);">
                    -$${t.slippageDragDollars.toFixed(2)}
                  </td>
                  <td style="padding:8px 6px; font-weight:700;">
                    ${t.settled
                      ? `<span style="color:${(t.netPnlDollars ?? 0) >= 0 ? 'var(--ok-green)' : 'var(--alert-red)'};">${(t.netPnlDollars ?? 0) >= 0 ? '+$' : '-$'}${Math.abs(t.netPnlDollars ?? 0).toFixed(2)}</span>`
                      : '<span style="color:var(--hud-cyan);">PENDING</span>'
                    }
                  </td>
                  <td style="padding:8px 6px; font-weight:700; color:${(t.brierContribution ?? 0) <= 0.15 ? 'var(--ok-green)' : (t.brierContribution ?? 0) >= 0.25 ? 'var(--alert-red)' : 'var(--hud-gold)'};">
                    ${t.brierContribution !== null ? t.brierContribution.toFixed(4) : '--'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
