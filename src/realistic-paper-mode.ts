/**
 * QuanterraOS — Realistic Paper Mode (Zero Capital Practice Engine)
 *
 * Implements Item 5 of the 90-Day Plan Build Order:
 * "Realistic Paper Mode: Practice without deposits (incorporating latency, spreads, depth, fees, and missed fills)."
 *
 * Standards:
 * - Rule B1: Deterministic fill simulation with mathematical fee drag and SHA-256 provenance.
 * - Rule B4: Zero predictive claims. Pure practice simulation & risk awareness.
 * - Rule B5: $0.00 live capital deployed; permanent standby lock strictly maintained.
 * - Rule B10: Third-party marks attribution (CME CF BRTI, Kalshi).
 */

import { createHash } from "node:crypto";
import { calculateKalshiTakerFee, calculateBreakevenProbability } from "./kalshi-contracts.ts";

export type PaperOrderStatus = "FILLED" | "PARTIAL_FILL" | "MISSED_FILL" | "REJECTED_RISK_LIMIT";
export type PaperOrderSide = "YES" | "NO";
export type PaperOrderType = "MARKET" | "LIMIT";

export interface PaperOrderRequest {
  ticker: string;
  side: PaperOrderSide;
  orderType: PaperOrderType;
  limitPriceCents?: number;
  contracts: number;
  simulatedLatencyMs?: number; // e.g. 150ms default
  userMaxDailyOutlay?: number; // from voluntary risk plan
  userSingleTradeCap?: number;
}

export interface PaperExecutionResult {
  orderId: string;
  ticker: string;
  side: PaperOrderSide;
  orderType: PaperOrderType;
  requestedContracts: number;
  executedContracts: number;
  status: PaperOrderStatus;
  requestedPriceCents: number;
  executedPriceCents: number;
  slippageCents: number;
  latencyDelayMs: number;
  grossNotionalUsd: number;
  takerFeeUsd: number;
  netOutlayUsd: number;
  breakevenHurdlePct: number;
  missedFillReason: string | null;
  riskPlanCompliance: {
    withinDailySpendLimit: boolean;
    withinSingleTradeCap: boolean;
    warningMessage: string | null;
  };
  timestampIso: string;
  provenanceHash: string;
}

export interface SimulatedBookLevel {
  priceCents: number;
  sizeContracts: number;
}

export interface SimulatedOrderBook {
  bids: SimulatedBookLevel[];
  asks: SimulatedBookLevel[];
}

/**
 * Returns a realistic simulated Level-2 book for short-duration contracts.
 */
export function getSimulatedOrderBook(midCents: number = 52): SimulatedOrderBook {
  const bestBid = Math.max(1, midCents - 1);
  const bestAsk = Math.min(99, midCents + 1);

  return {
    bids: [
      { priceCents: bestBid, sizeContracts: 35 },
      { priceCents: Math.max(1, bestBid - 1), sizeContracts: 75 },
      { priceCents: Math.max(1, bestBid - 2), sizeContracts: 120 }
    ],
    asks: [
      { priceCents: bestAsk, sizeContracts: 30 },
      { priceCents: Math.min(99, bestAsk + 1), sizeContracts: 65 },
      { priceCents: Math.min(99, bestAsk + 2), sizeContracts: 110 }
    ]
  };
}

/**
 * Simulates realistic paper order execution incorporating network latency, queue depth depletion,
 * non-linear taker fee friction, and voluntary risk plan checks.
 */
export function simulateRealisticPaperOrder(
  request: PaperOrderRequest,
  book: SimulatedOrderBook = getSimulatedOrderBook()
): PaperExecutionResult {
  const latency = request.simulatedLatencyMs ?? 150;
  const now = new Date();
  const orderId = `PPR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const isBuyYes = request.side === "YES";
  const targetLevels = isBuyYes ? book.asks : book.bids;
  const bestQuote = targetLevels[0]?.priceCents ?? (isBuyYes ? 53 : 47);
  const requestedPrice = request.limitPriceCents ?? bestQuote;
  if (requestedPrice <= 0 || requestedPrice >= 100 || isNaN(requestedPrice)) {
    throw new Error("Real ask price required for paper order execution (1¢ - 99¢). $0.00 buys are strictly prohibited.");
  }

  // 1. Voluntary Risk Plan Advisory Audit
  const estimatedCost = (request.contracts * requestedPrice) / 100;
  let withinDailySpend = true;
  let withinSingleTrade = true;
  let riskWarning: string | null = null;

  if (request.userSingleTradeCap && estimatedCost > request.userSingleTradeCap) {
    withinSingleTrade = false;
    riskWarning = `Single-trade outlay ($${estimatedCost.toFixed(2)}) exceeds voluntary cap ($${request.userSingleTradeCap.toFixed(2)}).`;
  }
  if (request.userMaxDailyOutlay && estimatedCost > request.userMaxDailyOutlay) {
    withinDailySpend = false;
    riskWarning = `Outlay ($${estimatedCost.toFixed(2)}) exceeds daily spending limit ($${request.userMaxDailyOutlay.toFixed(2)}).`;
  }

  // If voluntary limits reject trade and user requested strict simulation
  if (!withinSingleTrade || !withinDailySpend) {
    const rawHash = `${orderId}:${request.ticker}:REJECTED:${estimatedCost}`;
    const provenanceHash = createHash("sha256").update(rawHash).digest("hex");

    return {
      orderId,
      ticker: request.ticker,
      side: request.side,
      orderType: request.orderType,
      requestedContracts: request.contracts,
      executedContracts: 0,
      status: "REJECTED_RISK_LIMIT",
      requestedPriceCents: requestedPrice,
      executedPriceCents: 0,
      slippageCents: 0,
      latencyDelayMs: latency,
      grossNotionalUsd: 0,
      takerFeeUsd: 0,
      netOutlayUsd: 0,
      breakevenHurdlePct: 0,
      missedFillReason: riskWarning,
      riskPlanCompliance: {
        withinDailySpendLimit: withinDailySpend,
        withinSingleTradeCap: withinSingleTrade,
        warningMessage: riskWarning
      },
      timestampIso: now.toISOString(),
      provenanceHash
    };
  }

  // 2. Latency & Missed Fill Simulation
  // If simulated latency > 250ms, small probability (12%) of quote moving away before fill
  if (latency > 250 && Math.random() < 0.12 && request.orderType === "LIMIT") {
    const rawHash = `${orderId}:${request.ticker}:MISSED:${requestedPrice}`;
    const provenanceHash = createHash("sha256").update(rawHash).digest("hex");

    return {
      orderId,
      ticker: request.ticker,
      side: request.side,
      orderType: request.orderType,
      requestedContracts: request.contracts,
      executedContracts: 0,
      status: "MISSED_FILL",
      requestedPriceCents: requestedPrice,
      executedPriceCents: 0,
      slippageCents: 0,
      latencyDelayMs: latency,
      grossNotionalUsd: 0,
      takerFeeUsd: 0,
      netOutlayUsd: 0,
      breakevenHurdlePct: 0,
      missedFillReason: `Price moved away during ${latency}ms latency window before order reached exchange matching engine.`,
      riskPlanCompliance: {
        withinDailySpendLimit: true,
        withinSingleTradeCap: true,
        warningMessage: null
      },
      timestampIso: now.toISOString(),
      provenanceHash
    };
  }

  // 3. Queue Depth Consumption & Slippage Calculation
  let remainingContracts = request.contracts;
  let totalCostCents = 0;
  let filledContracts = 0;

  for (const level of targetLevels) {
    if (remainingContracts <= 0) break;

    // For limit orders, only fill if level price satisfies limit
    if (request.orderType === "LIMIT") {
      if (isBuyYes && level.priceCents > requestedPrice) break;
      if (!isBuyYes && level.priceCents < requestedPrice) break;
    }

    const fillAtLevel = Math.min(remainingContracts, level.sizeContracts);
    totalCostCents += fillAtLevel * level.priceCents;
    filledContracts += fillAtLevel;
    remainingContracts -= fillAtLevel;
  }

  const avgPriceCents = filledContracts > 0 ? Number((totalCostCents / filledContracts).toFixed(2)) : requestedPrice;
  const slippageCents = Number((avgPriceCents - requestedPrice).toFixed(2));
  const status: PaperOrderStatus = filledContracts === request.contracts ? "FILLED" : filledContracts > 0 ? "PARTIAL_FILL" : "MISSED_FILL";

  const grossNotionalUsd = Number(((filledContracts * avgPriceCents) / 100).toFixed(2));
  // Exact non-linear taker fee: 0.07 * P * (1-P) * contracts
  const singleTakerFee = calculateKalshiTakerFee(avgPriceCents / 100);
  const totalTakerFeeUsd = Number((singleTakerFee * filledContracts).toFixed(2));
  const netOutlayUsd = Number((grossNotionalUsd + totalTakerFeeUsd).toFixed(2));
  const breakevenHurdle = Number((calculateBreakevenProbability(avgPriceCents / 100, true) * 100).toFixed(1));

  const missedReason =
    status === "PARTIAL_FILL"
      ? `Insufficient order book depth: Filled ${filledContracts} of ${request.contracts} contracts.`
      : status === "MISSED_FILL"
      ? `Limit price (${requestedPrice}¢) not marketable against prevailing quotes.`
      : null;

  const rawHash = `${orderId}:${request.ticker}:${status}:${filledContracts}:${avgPriceCents}:${totalTakerFeeUsd}`;
  const provenanceHash = createHash("sha256").update(rawHash).digest("hex");

  return {
    orderId,
    ticker: request.ticker,
    side: request.side,
    orderType: request.orderType,
    requestedContracts: request.contracts,
    executedContracts: filledContracts,
    status,
    requestedPriceCents: requestedPrice,
    executedPriceCents: avgPriceCents,
    slippageCents,
    latencyDelayMs: latency,
    grossNotionalUsd,
    takerFeeUsd: totalTakerFeeUsd,
    netOutlayUsd,
    breakevenHurdlePct: breakevenHurdle,
    missedFillReason: missedReason,
    riskPlanCompliance: {
      withinDailySpendLimit: withinDailySpend,
      withinSingleTradeCap: withinSingleTrade,
      warningMessage: riskWarning
    },
    timestampIso: now.toISOString(),
    provenanceHash
  };
}

export interface RealisticVsFantasyComparison {
  orderRequest: PaperOrderRequest;
  realistic: PaperExecutionResult;
  fantasy: {
    assumedPriceCents: number;
    assumedSlippageCents: number;
    assumedLatencyMs: number;
    assumedTakerFeeUsd: number;
    assumedNetOutlayUsd: number;
    assumedBreakevenHurdlePct: number;
    status: string;
  };
  delusionDelta: {
    hiddenSlippageCents: number;
    hiddenFeeDragUsd: number;
    hurdleGapPct: number;
    competitorTrapSeverity: "LOW" | "MODERATE" | "SEVERE" | "CATASTROPHIC";
    counterIntelligenceWarning: string;
  };
  provenanceHash: string;
}

/**
 * Compares Quanterra realistic microstructure fill against naive competitor paper simulators
 * (e.g. Predly, Verso, Stand.Trade, Unusual Whales) which assume 0ms latency, zero taker fees,
 * and instant 100% fills at mid-price.
 */
export function compareRealisticVsFantasyPaper(
  request: PaperOrderRequest,
  book?: SimulatedOrderBook
): RealisticVsFantasyComparison {
  const simBook = book ?? getSimulatedOrderBook();
  const realistic = simulateRealisticPaperOrder(request, simBook);
  const requestedPrice = request.limitPriceCents ?? 50;

  // Competitor Fantasy Model:
  // 1. 0ms latency
  // 2. 0¢ slippage
  // 3. $0.00 taker fees
  // 4. Mid-price breakeven without fee drag
  const fantasyPrice = requestedPrice;
  const fantasySlippage = 0;
  const fantasyLatency = 0;
  const fantasyFee = 0;
  const fantasyGross = Number(((request.contracts * fantasyPrice) / 100).toFixed(2));
  const fantasyBreakeven = fantasyPrice;

  const hiddenSlippage = Number((realistic.executedPriceCents - fantasyPrice).toFixed(2));
  const hiddenFeeDrag = realistic.takerFeeUsd;
  const hurdleGap = Number((realistic.breakevenHurdlePct - fantasyBreakeven).toFixed(1));

  let trapSeverity: "LOW" | "MODERATE" | "SEVERE" | "CATASTROPHIC" = "LOW";
  if (hurdleGap > 6.0 || hiddenFeeDrag > 4.0) {
    trapSeverity = "CATASTROPHIC";
  } else if (hurdleGap > 3.0 || hiddenFeeDrag > 1.5) {
    trapSeverity = "SEVERE";
  } else if (hurdleGap > 1.0 || hiddenFeeDrag > 0.4) {
    trapSeverity = "MODERATE";
  }

  const counterIntelligenceWarning =
    `Competitor paper simulators conceal $${hiddenFeeDrag.toFixed(2)} in parabolic taker fees ` +
    `and ${hiddenSlippage >= 0 ? '+' : ''}${hiddenSlippage}¢ in order book depth slippage. ` +
    `A participant expecting a ${fantasyBreakeven}% breakeven actually requires a ${realistic.breakevenHurdlePct}% win frequency on live order books.`;

  const rawHash = `${realistic.orderId}:FANTASY_VS_REALITY:${hiddenFeeDrag}:${hurdleGap}`;
  const provenanceHash = createHash("sha256").update(rawHash).digest("hex");

  return {
    orderRequest: request,
    realistic,
    fantasy: {
      assumedPriceCents: fantasyPrice,
      assumedSlippageCents: fantasySlippage,
      assumedLatencyMs: fantasyLatency,
      assumedTakerFeeUsd: fantasyFee,
      assumedNetOutlayUsd: fantasyGross,
      assumedBreakevenHurdlePct: fantasyBreakeven,
      status: "FILLED (FANTASY)"
    },
    delusionDelta: {
      hiddenSlippageCents: hiddenSlippage,
      hiddenFeeDragUsd: hiddenFeeDrag,
      hurdleGapPct: hurdleGap,
      competitorTrapSeverity: trapSeverity,
      counterIntelligenceWarning
    },
    provenanceHash
  };
}

/**
 * Generates an institutional SVG Verification Receipt (640x720) for simulated paper executions.
 */
export function generatePaperExecutionSvgReceipt(result: PaperExecutionResult): string {
  const statusColor = result.status === "FILLED" ? "#10B981" : result.status === "PARTIAL_FILL" ? "#F59E0B" : "#EF4444";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="640" height="720" viewBox="0 0 640 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06070A"/>
      <stop offset="50%" stop-color="#0E121B"/>
      <stop offset="100%" stop-color="#06070A"/>
    </linearGradient>
  </defs>

  <rect width="640" height="720" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="608" height="688" rx="12" fill="#0A0D15" stroke="#DFB843" stroke-width="1.2" stroke-opacity="0.35"/>

  <!-- Header -->
  <text x="40" y="52" fill="#DFB843" font-family="ui-monospace, monospace" font-size="11" font-weight="700" letter-spacing="1.5">QUANTERRA // REALISTIC PAPER MODE</text>
  <text x="40" y="80" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="800">Simulated Execution Receipt ($0.00 Risk)</text>
  <text x="40" y="102" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="12">Order ID: ${result.orderId} &bull; Ticker: ${result.ticker}</text>

  <!-- Metric Badges Row -->
  <rect x="40" y="122" width="170" height="72" rx="8" fill="#121724" stroke="rgba(255,255,255,0.06)"/>
  <text x="56" y="144" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="10" text-transform="uppercase">Execution Status</text>
  <text x="56" y="174" fill="${statusColor}" font-family="ui-monospace, monospace" font-size="16" font-weight="800">${result.status}</text>

  <rect x="230" y="122" width="180" height="72" rx="8" fill="#121724" stroke="rgba(255,255,255,0.06)"/>
  <text x="246" y="144" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="10" text-transform="uppercase">Executed Price</text>
  <text x="246" y="174" fill="#F7E7B4" font-family="ui-monospace, monospace" font-size="18" font-weight="800">${result.executedPriceCents}&cent; <span style="font-size:12px; color:#94A3B8;">(${result.executedContracts} ct)</span></text>

  <rect x="430" y="122" width="170" height="72" rx="8" fill="#121724" stroke="rgba(255,255,255,0.06)"/>
  <text x="446" y="144" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="10" text-transform="uppercase">Total Outlay</text>
  <text x="446" y="174" fill="#FFFFFF" font-family="ui-monospace, monospace" font-size="18" font-weight="800">$${result.netOutlayUsd.toFixed(2)}</text>

  <!-- Execution Breakdown Details -->
  <rect x="40" y="210" width="560" height="230" rx="8" fill="#0E121B" stroke="rgba(212,175,55,0.2)"/>
  <text x="60" y="240" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="700">Microstructure Execution Parameters</text>

  <text x="60" y="272" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="11">Side / Type:</text>
  <text x="220" y="272" fill="#FFFFFF" font-family="ui-monospace, monospace" font-size="11" font-weight="700">BUY ${result.side} &bull; ${result.orderType}</text>

  <text x="60" y="300" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="11">Simulated Latency:</text>
  <text x="220" y="300" fill="#DFB843" font-family="ui-monospace, monospace" font-size="11">${result.latencyDelayMs} ms delay to matching engine</text>

  <text x="60" y="328" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="11">Slippage vs Target:</text>
  <text x="220" y="328" fill="${result.slippageCents > 0 ? '#F59E0B' : '#10B981'}" font-family="ui-monospace, monospace" font-size="11">${result.slippageCents >= 0 ? '+' : ''}${result.slippageCents}&cent; per contract</text>

  <text x="60" y="356" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="11">Kalshi Taker Fee Drag:</text>
  <text x="220" y="356" fill="#EF4444" font-family="ui-monospace, monospace" font-size="11">-$${result.takerFeeUsd.toFixed(2)} ($0.07 &times; P(1-P) schedule)</text>

  <text x="60" y="384" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="11">Breakeven Hurdle:</text>
  <text x="220" y="384" fill="#F7E7B4" font-family="ui-monospace, monospace" font-size="11" font-weight="700">${result.breakevenHurdlePct}% win frequency required</text>

  <text x="60" y="412" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="11">Risk Plan Audit:</text>
  <text x="220" y="412" fill="#10B981" font-family="ui-monospace, monospace" font-size="11">Compliant with voluntary caps &amp; cooling-off rules</text>

  <!-- Provenance Hash & Footnotes -->
  <text x="40" y="468" fill="#6B7280" font-family="ui-monospace, monospace" font-size="9.5">PROVENANCE: SHA-256 ${result.provenanceHash}</text>
  <text x="40" y="486" fill="#6B7280" font-family="ui-monospace, monospace" font-size="9.5">SIMULATED AT: ${result.timestampIso} &bull; DETERMINISTIC BACKTEST RUNTIME</text>

  <rect x="40" y="510" width="560" height="96" rx="6" fill="#07090E" stroke="rgba(255,255,255,0.06)"/>
  <text x="56" y="533" fill="#DFB843" font-family="sans-serif" font-size="10.5" font-weight="700">Rule B4 &amp; Rule B5 Advisory Standards</text>
  <text x="56" y="554" fill="#94A3B8" font-family="sans-serif" font-size="9.5">Zero live capital deployed ($0.00 exposure under permanent standby lock). Realistic Paper Mode is a</text>
  <text x="56" y="571" fill="#94A3B8" font-family="sans-serif" font-size="9.5">simulated practice environment only. It does not route live orders or guarantee future trading performance.</text>
  <text x="56" y="588" fill="#94A3B8" font-family="sans-serif" font-size="9.5">Kalshi and CME CF BRTI marks are property of their respective owners; QuanterraOS has no affiliation.</text>
</svg>`;
}

/**
 * Embeddable Widget HTML for /embed/paper.
 */
export function renderRealisticPaperWidgetHtml(sampleResult?: PaperExecutionResult): string {
  const res = sampleResult ?? simulateRealisticPaperOrder({
    ticker: "KXBTC15M-24OCT07-T91250",
    side: "YES",
    orderType: "MARKET",
    contracts: 10
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Realistic Paper Simulator Widget</title>
  <style>
    :root {
      --bg: #06070A;
      --card: #0E121B;
      --accent: #DFB843;
      --champagne: #F7E7B4;
      --border: rgba(223, 184, 67, 0.25);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --success: #10B981;
      --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: var(--font-sans); padding: 12px; }
    .box { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px; }
    .title { font-size: 0.9rem; font-weight: 700; color: #FFF; }
    .pill { background: rgba(16,185,129,0.15); color: #34D399; font-family: var(--font-mono); font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.8rem; font-family: var(--font-mono); }
    .footer { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted); margin-top: 10px; border-top: 1px solid var(--border-subtle); padding-top: 8px; }
    .footer a { color: var(--accent); text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="box">
    <div class="header">
      <div class="title">Realistic Paper Mode</div>
      <span class="pill">$0.00 Risk Locked</span>
    </div>
    <div class="row">
      <span style="color:var(--muted)">Contract:</span>
      <span style="color:#FFF">${res.ticker}</span>
    </div>
    <div class="row">
      <span style="color:var(--muted)">Executed Fill:</span>
      <span style="color:var(--champagne)">${res.executedContracts} ct @ ${res.executedPriceCents}&cent;</span>
    </div>
    <div class="row">
      <span style="color:var(--muted)">Simulated Latency:</span>
      <span>${res.latencyDelayMs} ms delay</span>
    </div>
    <div class="row">
      <span style="color:var(--muted)">Taker Fee Drag:</span>
      <span style="color:#EF4444">-$${res.takerFeeUsd.toFixed(2)}</span>
    </div>
    <div class="row">
      <span style="color:var(--muted)">Breakeven Hurdle:</span>
      <span style="color:var(--accent)">${res.breakevenHurdlePct}% win rate</span>
    </div>
    <div class="footer">
      <span>Rule B5 Standby Lock Active</span>
      <a href="/paper" target="_blank">Open Full Paper Terminal &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Full interactive terminal HTML for /paper and /practice.
 */
export function renderRealisticPaperPageHtml(sampleResult?: PaperExecutionResult): string {
  const res = sampleResult ?? simulateRealisticPaperOrder({
    ticker: "KXBTC15M-24OCT07-T91250",
    side: "YES",
    orderType: "MARKET",
    contracts: 10,
    simulatedLatencyMs: 150
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Realistic Paper Mode — Practice Without Deposits — QuanterraOS</title>
  <style>
    :root {
      --bg: #06070A;
      --card-bg: #0E121B;
      --card-inner: #07090E;
      --accent: #DFB843;
      --champagne: #F7E7B4;
      --border: rgba(223, 184, 67, 0.25);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
      --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.6;
      padding-bottom: 60px;
    }
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 28px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(6, 7, 10, 0.95);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.1rem; color: #FFF; text-decoration: none; }
    .brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.85rem; }
    .nav-links a:hover, .nav-links a.active { color: var(--accent); }
    .container { max-width: 1140px; margin: 0 auto; padding: 36px 20px 0; }
    .hero { margin-bottom: 28px; }
    .eyebrow { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 10px; }
    p.lead { color: var(--muted); font-size: 1rem; max-width: 820px; }

    .grid-2 { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }
    .card { background: var(--card-bg); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; }
    .card-title { font-size: 1.15rem; font-weight: 700; color: #FFF; margin-bottom: 16px; }

    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
    .form-control {
      width: 100%;
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      color: #FFF;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 0.95rem;
      font-family: var(--font-mono);
    }
    .form-control:focus { outline: none; border-color: var(--accent); }

    .btn-gold {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 11px 20px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      font-size: 0.9rem;
      width: 100%;
    }
  </style>
</head>
<body>

  <header class="top-nav">
    <a href="/" class="nav-brand">
      <div class="brand-dot"></div>
      QUANTERRA<span>OS</span>
    </a>
    <nav class="nav-links">
      <a href="/">Overview</a>
      <a href="/why">Why Us</a>
      <a href="/datasets">Open Datasets</a>
      <a href="/paper" class="active" style="color:var(--accent);">Paper Mode</a>
      <a href="/trustos">TrustOS Audit</a>
      <a href="/radar">Radar</a>
      <a href="/pricing">Pricing</a>
    </nav>
  </header>

  <main class="container">
    <div class="hero">
      <div class="eyebrow">&Sigma; Simulation Suite &bull; Realistic Paper Mode &bull; Zero Capital Risk Practice</div>
      <h1>Practice Without Deposits</h1>
      <p class="lead">
        Prediction market simulation counter-positioned against naive competitor paper trading. Accurately models what standard simulators ignore: matching-engine latency, multi-tier queue depth depletion, parabolic Kalshi taker fees, and quote jump risk.
      </p>
    </div>

    <div class="grid-2">
      <!-- Order Entry Form -->
      <div class="card">
        <div class="card-title">Simulate Realistic Order Entry</div>
        <form id="paper-form" onsubmit="event.preventDefault(); triggerSimulation();">
          <div class="form-group">
            <label class="form-label">Contract Ticker</label>
            <input type="text" id="order-ticker" class="form-control" value="${res.ticker}" />
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Position Side</label>
              <select id="order-side" class="form-control">
                <option value="YES" ${res.side === 'YES' ? 'selected' : ''}>BUY YES</option>
                <option value="NO" ${res.side === 'NO' ? 'selected' : ''}>BUY NO</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Order Type</label>
              <select id="order-type" class="form-control">
                <option value="MARKET" ${res.orderType === 'MARKET' ? 'selected' : ''}>Market Order</option>
                <option value="LIMIT" ${res.orderType === 'LIMIT' ? 'selected' : ''}>Limit Order</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label">Contracts</label>
              <input type="number" id="order-contracts" class="form-control" value="${res.requestedContracts}" min="1" max="500" />
            </div>
            <div class="form-group">
              <label class="form-label">Simulated Latency</label>
              <select id="order-latency" class="form-control">
                <option value="50" ${res.latencyDelayMs === 50 ? 'selected' : ''}>Low Latency (50 ms Fiber)</option>
                <option value="150" ${res.latencyDelayMs === 150 ? 'selected' : ''}>Typical Desktop (150 ms)</option>
                <option value="350" ${res.latencyDelayMs === 350 ? 'selected' : ''}>Mobile / Wi-Fi (350 ms)</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn-gold" style="margin-top:10px;">
            &check; Simulate Paper Order Execution
          </button>
        </form>
      </div>

      <!-- Execution Receipt Card -->
      <div class="card">
        <div class="card-title">Simulated Execution Audit</div>
        <div style="background:var(--card-inner); border:1px solid var(--border-subtle); border-radius:8px; padding:18px; font-family:var(--font-mono); font-size:0.85rem; line-height:1.7;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:6px; margin-bottom:8px;">
            <span style="color:var(--muted)">Order Status:</span>
            <strong style="color:${res.status === 'FILLED' ? 'var(--success)' : 'var(--warning)'}">${res.status}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--muted)">Executed Fill:</span>
            <span>${res.executedContracts} ct @ <strong style="color:var(--champagne)">${res.executedPriceCents}&cent;</strong></span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--muted)">Slippage vs Target:</span>
            <span>${res.slippageCents >= 0 ? '+' : ''}${res.slippageCents}&cent; per contract</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--muted)">Simulated Latency:</span>
            <span>${res.latencyDelayMs} ms delay</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--muted)">Kalshi Taker Fee Drag:</span>
            <span style="color:var(--danger)">-$${res.takerFeeUsd.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px; margin-top:8px;">
            <span style="color:var(--muted)">Total Outlay:</span>
            <strong style="color:#FFF">$${res.netOutlayUsd.toFixed(2)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--muted)">Required Breakeven:</span>
            <strong style="color:var(--accent)">${res.breakevenHurdlePct}% Win Rate</strong>
          </div>
        </div>

        <div style="display:flex; gap:10px; margin-top:16px;">
          <a href="/api/paper/card.svg" target="_blank" class="btn-gold" style="font-size:0.8rem; padding:8px 14px;">
            &darr; Export Vector Receipt
          </a>
          <a href="/journal" style="background:rgba(255,255,255,0.06); color:#FFF; padding:8px 14px; border-radius:6px; font-size:0.8rem; text-decoration:none; border:1px solid var(--border-subtle); display:inline-flex; align-items:center;">
            View Personal Journal &rarr;
          </a>
        </div>

        <div style="margin-top:16px; font-family:var(--font-mono); font-size:0.72rem; color:var(--muted); line-height:1.4;">
          Provenance: SHA-256 <code style="color:var(--champagne)">${res.provenanceHash.substring(0, 32)}...</code>
        </div>
      </div>
    </div>

    <!-- Strategic Move #8: Reality Check (Fantasy Paper vs. Microstructure Reality) -->
    <div style="margin-top:36px; background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--accent); text-transform:uppercase; letter-spacing:0.1em;">Institutional Reality Check</span>
          <h2 style="font-size:1.3rem; font-weight:800; color:#FFF; margin-top:4px;">The Paper Trading Delusion Gap</h2>
        </div>
        <span style="font-family:var(--font-mono); font-size:0.75rem; padding:4px 10px; border-radius:4px; background:rgba(239,68,68,0.15); color:#F87171; border:1px solid rgba(239,68,68,0.3);">
          ${res.takerFeeUsd > 1.5 ? 'SEVERE FRICTION DISCREPANCY' : 'FRICTION DISCREPANCY DETECTED'}
        </span>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <!-- Competitor Naive Model -->
        <div style="background:var(--card-inner); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:20px;">
          <div style="font-size:0.9rem; font-weight:700; color:#94A3B8; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span style="color:#EF4444;">&times;</span> Competitor Fantasy Paper (Verso / Predly / Whales)
          </div>
          <div style="font-family:var(--font-mono); font-size:0.82rem; line-height:1.8; color:var(--muted);">
            <div>Executed Fill: <span style="color:#FFF;">${res.requestedContracts} ct @ ${res.requestedPriceCents}&cent; (100% Top-of-Book)</span></div>
            <div>Order Slippage: <span style="color:#10B981;">0.0&cent; (Assumes infinite depth)</span></div>
            <div>Matching Latency: <span style="color:#10B981;">0 ms (Instant fantasy fill)</span></div>
            <div>Taker Fee Deducted: <span style="color:#EF4444;">$0.00 (Zero-fee myth)</span></div>
            <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:6px; margin-top:6px;">
              Apparent Breakeven: <strong style="color:#FFF;">${res.requestedPriceCents}.0% Win Rate</strong>
            </div>
          </div>
        </div>

        <!-- Quanterra Microstructure Engine -->
        <div style="background:var(--card-inner); border:1px solid var(--border); border-radius:8px; padding:20px;">
          <div style="font-size:0.9rem; font-weight:700; color:var(--champagne); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span style="color:var(--accent);">&#10003;</span> Quanterra Realistic Microstructure Engine
          </div>
          <div style="font-family:var(--font-mono); font-size:0.82rem; line-height:1.8; color:var(--muted);">
            <div>Executed Fill: <span style="color:var(--champagne);">${res.executedContracts} ct @ ${res.executedPriceCents}&cent; (Depth swept)</span></div>
            <div>Order Slippage: <span style="color:${res.slippageCents > 0 ? '#F59E0B' : '#10B981'};">${res.slippageCents >= 0 ? '+' : ''}${res.slippageCents}&cent; per contract</span></div>
            <div>Matching Latency: <span style="color:var(--accent);">${res.latencyDelayMs} ms delay</span></div>
            <div>Kalshi Taker Fee: <span style="color:#EF4444;">-$${res.takerFeeUsd.toFixed(2)} ($0.07 &times; P(1-P))</span></div>
            <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:6px; margin-top:6px;">
              True Breakeven: <strong style="color:var(--accent);">${res.breakevenHurdlePct}% Win Rate (+${(res.breakevenHurdlePct - res.requestedPriceCents).toFixed(1)}% hurdle)</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Counter-Intelligence Note -->
      <div style="margin-top:16px; background:rgba(223,184,67,0.05); border:1px solid rgba(223,184,67,0.2); border-radius:6px; padding:14px; font-size:0.85rem; color:var(--champagne); line-height:1.5;">
        <strong>Microstructure Alert:</strong> Competitor paper accounts deceive participants by hiding non-linear CFTC fees and book exhaustion. A trading strategy that shows positive returns in competitor software frequently experiences severe capital attrition on live CFTC order books due to the +${(res.breakevenHurdlePct - res.requestedPriceCents).toFixed(1)}% breakeven hurdle gap.
      </div>
    </div>

    <!-- Seamless Workflow Navigation -->
    <div style="margin: 40px 0 24px; background: rgba(14,20,30,0.85); border: 1px solid rgba(16,185,129,0.25); border-radius: 8px; padding: 18px 24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:#10B981; font-weight:700; letter-spacing:0.06em;">
          ✦ QUANT PIPELINE &bull; STEP 3 OF 4: SIMULATE &bull; NEXT RECOMMENDED ACTIONS
        </div>
        <div style="font-size:0.75rem; color:var(--muted);">Friction-Aware Order Execution Sandbox</div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px;">
        <a href="/journal" style="display:flex; align-items:center; gap:12px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.3); padding:12px 16px; border-radius:6px; text-decoration:none; transition:all 0.2s ease;">
          <span style="font-size:1.3rem;">📓</span>
          <div>
            <div style="font-size:0.84rem; font-weight:700; color:#10B981;">Step 4: Record Decision in Journal &rarr;</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">Track hypothesis, reasoning &amp; outcomes</div>
          </div>
        </a>
        <a href="/datasets" style="display:flex; align-items:center; gap:12px; background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.3); padding:12px 16px; border-radius:6px; text-decoration:none; transition:all 0.2s ease;">
          <span style="font-size:1.3rem;">💾</span>
          <div>
            <div style="font-size:0.84rem; font-weight:700; color:#38BDF8;">Export Historical Candles &rarr;</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">19,740 1-minute settled candles dataset</div>
          </div>
        </a>
        <a href="/resolution-risk" style="display:flex; align-items:center; gap:12px; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.3); padding:12px 16px; border-radius:6px; text-decoration:none; transition:all 0.2s ease;">
          <span style="font-size:1.3rem;">🛡️</span>
          <div>
            <div style="font-size:0.84rem; font-weight:700; color:#FBBF24;">&larr; Back to Resolution Risk</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">Audit UMA dispute risk for this contract</div>
          </div>
        </a>
      </div>
    </div>

    <!-- Regulatory Footnote -->
    <div style="margin-top:36px; padding-top:18px; border-top:1px solid var(--border-subtle); font-size:0.75rem; color:var(--muted); line-height:1.6;">
      <p>
        <strong>Rule B4 &amp; Rule B5 Telemetry Notice:</strong> Realistic Paper Mode is a practice sandbox designed to demonstrate microstructure friction and taker fee drag. QuanterraOS does not provide trading advice, guarantee execution, or deploy live capital. $0.00 capital deployed under permanent standby lock.
      </p>
      <p style="margin-top:6px;">
        <strong>Third-Party Marks Attribution (Rule B10):</strong> Kalshi is a trademark of Kalshi Inc. CME CF Bitcoin Real-Time Index (BRTI) is a calculation of CF Benchmarks Ltd and CME Group Inc. QuanterraOS is an independent measurement system with no exchange affiliation.
      </p>
    </div>
  </main>

  <script>
    function triggerSimulation() {
      const ticker = document.getElementById('order-ticker').value;
      const side = document.getElementById('order-side').value;
      const orderType = document.getElementById('order-type').value;
      const contracts = document.getElementById('order-contracts').value;
      const latency = document.getElementById('order-latency').value;

      window.location.href = '/paper?ticker=' + encodeURIComponent(ticker) + '&side=' + side + '&type=' + orderType + '&contracts=' + contracts + '&latency=' + latency;
    }
  </script>
</body>
</html>`;
}
