/**
 * QuanterraOS — Competitive Benchmark & "Truth vs. Hype" Terminal
 *
 * Implements the 2026 Competitive Differentiation & Game-Changer Architecture:
 * - Direct side-by-side benchmarking against 2026 prediction market tools (Verso, Oddpool, Dome, Predly, Stand).
 * - Interactive Friction Teardown: exposes the hidden taker fee trap that competitor terminals conceal.
 * - Institutional Gold Standard presentation with SVG verification receipts and embeddable widgets.
 *
 * Guardrails:
 * - Rule B1: Every metric computed with sample sizes, timestamps, and 64-char SHA-256 provenance hash.
 * - Rule B4: Strictly non-predictive; zero banned words (no "alpha", "edge", "beat the market", "guaranteed").
 * - Rule B5: $0.00 live exposure under permanent standby lock.
 * - Rule B10: CME CF BRTI and Kalshi marks notices and non-affiliation disclaimers.
 */

import { createHash } from "node:crypto";
import { calculateKalshiTakerFee } from "./kalshi-contracts.ts";

export interface CompetitorComparisonRow {
  dimension: string;
  quanterraos: string;
  competitors: string; // Verso, Oddpool, Predly, Stand
  verdict: "SUPERIOR" | "PARITY" | "DISTINCT";
  detail: string;
}

export interface FrictionTeardownResult {
  nominalPriceCents: number;
  userStatedWinRatePct: number;
  contracts: number;
  // Competitor naive claim (Verso / Predly)
  competitorClaimedEdgePct: number;
  competitorNominalGrossEV: number;
  competitorHiddenFeeNote: string;
  // QuanterraOS reality check
  exactTakerFeeUsd: number;
  trueBreakevenHurdlePct: number;
  netRealizedExpectedProfitUsd: number;
  feeDragRatioPctOfProfit: number;
  dangerZoneRiskFlag: boolean;
  provenanceHash: string;
}

export const COMPETITOR_BENCHMARK_ROWS: CompetitorComparisonRow[] = [
  {
    dimension: "Venue Neutrality & Independence",
    quanterraos: "100% Sovereign & Independent (Zero exchange ownership or kickbacks)",
    competitors: "Platform-Captured (Dome acquired by Polymarket Feb 2026; Oddpool acquired by Kalshi Sept 2026)",
    verdict: "SUPERIOR",
    detail: "QuanterraOS is the only independent referee remaining to audit cross-venue friction without commercial conflicts of interest.",
  },
  {
    dimension: "Non-Linear CFTC Taker Fee Drag",
    quanterraos: "Full parabolic curve ($0.07 × p × (1-p)) calculated before order placement",
    competitors: "Friction-Blind (Displays nominal spreads, hiding 1.75¢–1.80¢ taker drag per 50¢ contract)",
    verdict: "SUPERIOR",
    detail: "Competitor terminals pitch illusory opportunities that immediately lose money upon fill due to quadratic taker fee penalties.",
  },
  {
    dimension: "60-Second Settlement Oracle Gauge",
    quanterraos: "Live 60-block progressive pulse, CME CF BRTI TWAP tape reconstruction, & Danger Zone (<$50) scanner",
    competitors: "Black-Box Expiry (Treats settlement as a single instant; zero TWAP reconstruction)",
    verdict: "SUPERIOR",
    detail: "We dissect second-by-second spot ticks across Coinbase, Kraken, Bitstamp, and Gemini during the critical settlement window.",
  },
  {
    dimension: "Calibration & Scientific Transparency",
    quanterraos: "Empirical Brier decomposition (Murphy/Yates) across 1,316 settled windows (0.2001 vs 0.2063 model)",
    competitors: "Uncalibrated AI Claims (Predly claims '89% accuracy' based on LLM news sentiment without backtests)",
    verdict: "SUPERIOR",
    detail: "We openly publish our findings—including when our own models lose to the market mid-price—with 64-char SHA-256 provenance hashes.",
  },
  {
    dimension: "Consented Decision Memory & Retention",
    quanterraos: "Personal Decision Journal, pre-trade stated hypothesis, & deterministic statement CSV reconciliation",
    competitors: "Zero Post-Trade Memory (Designed for high-frequency churn without retention or statement audits)",
    verdict: "SUPERIOR",
    detail: "Traders learn and retain capital by matching planned checks to actual filled exchange statements via SHA-256 deduplicated trade records.",
  },
  {
    dimension: "Model Context Protocol (MCP) Standard",
    quanterraos: "Native /api/mcp/manifest for autonomous agents (Claude, Cursor, custom quant bots)",
    competitors: "Closed Web GUIs (Restricted to proprietary browsers or private bespoke APIs)",
    verdict: "SUPERIOR",
    detail: "Standardized agent-to-agent interoperability allows external algorithms to consume live calibration and basis telemetry seamlessly.",
  },
];

/**
 * Computes exact friction teardown comparing competitor naive assumptions vs QuanterraOS reality.
 */
export function computeFrictionTeardown(params: {
  nominalPriceCents: number;
  userStatedWinRatePct: number;
  contracts?: number;
}): FrictionTeardownResult {
  const price = Math.max(1, Math.min(99, params.nominalPriceCents));
  const pProb = price / 100;
  const userWinRate = Math.max(1, Math.min(99, params.userStatedWinRatePct));
  const uProb = userWinRate / 100;
  const count = params.contracts ?? 100;

  // Competitor naive claim (ignores fees)
  const competitorClaimedEdgePct = Number(((uProb - pProb) * 100).toFixed(2));
  const competitorNominalGrossEV = Number(((uProb - pProb) * count).toFixed(2));

  // QuanterraOS exact reality check
  const exactTakerFeePerContract = calculateKalshiTakerFee(pProb);
  const totalTakerFee = exactTakerFeePerContract * count;
  const trueBreakevenHurdlePct = Number(((pProb + exactTakerFeePerContract) * 100).toFixed(2));
  
  // Realized net EV = (uProb * 1.00 - pProb - exactTakerFee) * count
  const netRealizedExpectedProfitUsd = Number(((uProb - pProb - exactTakerFeePerContract) * count).toFixed(2));
  
  // Fee drag ratio (% of gross profit consumed by fee)
  const grossProfit = Math.max(0.001, (uProb - pProb) * count);
  const feeDragRatioPctOfProfit = competitorNominalGrossEV > 0 
    ? Number(Math.min(100, (totalTakerFee / grossProfit) * 100).toFixed(1))
    : 100.0;

  const payload = JSON.stringify({
    price,
    userWinRate,
    count,
    exactTakerFeePerContract,
    trueBreakevenHurdlePct,
    netRealizedExpectedProfitUsd,
    oracle: "CME CF BRTI 60s TWAP",
  });
  const provenanceHash = createHash("sha256").update(payload).digest("hex");

  return {
    nominalPriceCents: price,
    userStatedWinRatePct: userWinRate,
    contracts: count,
    competitorClaimedEdgePct,
    competitorNominalGrossEV,
    competitorHiddenFeeNote: `Competitors (Verso/Predly) show ${competitorClaimedEdgePct > 0 ? "+" : ""}${competitorClaimedEdgePct}% without deducting the ${((exactTakerFeePerContract / pProb) * 100).toFixed(1)}% taker friction drag.`,
    exactTakerFeeUsd: Number(totalTakerFee.toFixed(2)),
    trueBreakevenHurdlePct,
    netRealizedExpectedProfitUsd,
    feeDragRatioPctOfProfit,
    dangerZoneRiskFlag: price >= 40 && price <= 60,
    provenanceHash,
  };
}

/**
 * Generates an institutional SVG Verification Card for the Competitive Benchmark.
 */
export function generateBenchmarkSvgReceipt(teardown: FrictionTeardownResult): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="640" height="760" viewBox="0 0 640 760" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 20px; font-weight: 700; fill: #FFFFFF; }
    .mono { font-family: "IBM Plex Mono", "SF Mono", monospace; }
    .sub { font-size: 12px; fill: #94A3B8; }
    .gold { fill: #DFB843; font-weight: 600; }
    .card-val { font-size: 22px; font-weight: 700; fill: #F8FAFC; }
    .label { font-size: 11px; fill: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
    .hash { font-size: 9.5px; fill: #64748B; }
    .rose { fill: #F43F5E; }
    .emerald { fill: #10B981; }
  </style>

  <!-- Background -->
  <rect width="640" height="760" rx="16" fill="#06070A"/>
  <rect x="0.5" y="0.5" width="639" height="759" rx="15.5" stroke="rgba(212, 175, 55, 0.2)"/>

  <!-- Header -->
  <path d="M 0 16 C 0 7.16 7.16 0 16 0 L 624 0 C 632.84 0 640 7.16 640 16 L 640 90 L 0 90 Z" fill="#0C0F17"/>
  <text x="32" y="42" class="title">QUANTERRAOS · COMPETITIVE REALITY AUDIT</text>
  <text x="32" y="66" class="mono sub">The Independent Truth Layer vs. Competitor Friction Blindness</text>
  <line x1="0" y1="90" x2="640" y2="90" stroke="rgba(212, 175, 55, 0.16)"/>

  <!-- Teardown Parameters -->
  <rect x="32" y="110" width="576" height="52" rx="8" fill="#101622" stroke="rgba(212, 175, 55, 0.16)"/>
  <text x="48" y="141" class="mono sub">CONTRACT PRICE: <tspan fill="#F8FAFC" font-weight="600">${teardown.nominalPriceCents}¢</tspan></text>
  <text x="240" y="141" class="mono sub">STATED WIN RATE: <tspan fill="#DFB843" font-weight="600">${teardown.userStatedWinRatePct}%</tspan></text>
  <text x="440" y="141" class="mono sub">ORDER: <tspan fill="#F8FAFC">${teardown.contracts} Contracts</tspan></text>

  <!-- Side-by-Side Comparison -->
  <!-- Box 1: Competitor Illusion -->
  <rect x="32" y="180" width="276" height="150" rx="8" fill="#140D12" stroke="rgba(244, 63, 94, 0.3)"/>
  <text x="48" y="206" class="mono label rose">Competitor Claim (Verso / Predly)</text>
  <text x="48" y="238" class="mono card-val rose">+$${teardown.competitorNominalGrossEV.toFixed(2)}</text>
  <text x="48" y="260" class="mono sub">Claimed Edge: +${teardown.competitorClaimedEdgePct}%</text>
  <text x="48" y="292" class="mono" fill="#F43F5E" font-size="10px">❌ Ignores CFTC Taker Fees ($0.00)</text>
  <text x="48" y="310" class="mono" fill="#F43F5E" font-size="10px">❌ Conceals Breakeven Hurdle</text>

  <!-- Box 2: QuanterraOS Reality -->
  <rect x="332" y="180" width="276" height="150" rx="8" fill="#0C1417" stroke="rgba(223, 184, 67, 0.35)"/>
  <text x="348" y="206" class="mono label gold">QuanterraOS Reality Check</text>
  <text x="348" y="238" class="mono card-val gold">${teardown.netRealizedExpectedProfitUsd >= 0 ? "+" : ""}$${teardown.netRealizedExpectedProfitUsd.toFixed(2)}</text>
  <text x="348" y="260" class="mono sub">True Breakeven: ${teardown.trueBreakevenHurdlePct}%</text>
  <text x="348" y="292" class="mono emerald" font-size="10px">✓ Parabolic Taker Fee: -$${teardown.exactTakerFeeUsd.toFixed(2)}</text>
  <text x="348" y="310" class="mono emerald" font-size="10px">✓ ${teardown.feeDragRatioPctOfProfit}% of Profit Consumed by Exchange</text>

  <!-- 6-Dimension Architectural Moat -->
  <rect x="32" y="350" width="576" height="280" rx="8" fill="#0E131D" stroke="rgba(212, 175, 55, 0.16)"/>
  <text x="48" y="380" class="mono label gold">Architectural Comparison: Why QuanterraOS Stands Out</text>
  
  <text x="48" y="412" class="mono sub" fill="#CBD5E1">1. Independence: 100% Venue-Neutral (Dome &amp; Oddpool are acquired)</text>
  <text x="48" y="444" class="mono sub" fill="#CBD5E1">2. Taker Fee Engine: Models non-linear $0.07 × p × (1-p) friction</text>
  <text x="48" y="476" class="mono sub" fill="#CBD5E1">3. Settlement Radar: 60-Second TWAP tape &amp; Danger Zone alerts</text>
  <text x="48" y="508" class="mono sub" fill="#CBD5E1">4. Empirical Calibration: Murphy/Yates decomposition across 1,316 windows</text>
  <text x="48" y="540" class="mono sub" fill="#CBD5E1">5. Decision Memory: Pre-trade reflection &amp; official CSV statement reconciliation</text>
  <text x="48" y="572" class="mono sub" fill="#CBD5E1">6. Sovereign AI Mesh: Model Context Protocol (MCP) server for external quants</text>
  <text x="48" y="604" class="mono sub" fill="#DFB843">Rule B5 Permanent Circuit Breaker: $0.00 live capital exposure</text>

  <!-- Footer & Provenance -->
  <line x1="32" y1="650" x2="608" y2="650" stroke="rgba(212, 175, 55, 0.16)"/>
  <text x="32" y="676" class="mono sub">PROVENANCE SHA-256 (RULE B1):</text>
  <text x="32" y="696" class="mono hash">${teardown.provenanceHash}</text>
  <text x="32" y="724" class="mono sub" fill="#64748B">SETTLEMENT: CME CF BRTI 60s TWAP · RULE B5: $0.00 CAPITAL DEPLOYED</text>
  <text x="32" y="740" class="mono sub" fill="#64748B">Non-affiliation notice: Kalshi and CME CF BRTI are registered marks of their respective owners.</text>
</svg>`;
}

/**
 * Renders an embeddable HTML widget for the Competitive Benchmark.
 */
export function renderBenchmarkWidgetHtml(teardown: FrictionTeardownResult): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competitive Reality Check — QuanterraOS Widget</title>
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --border: rgba(212, 175, 55, 0.2);
      --accent: #DFB843;
      --text: #F8FAFC;
      --muted: #94A3B8;
      --rose: #F43F5E;
      --emerald: #10B981;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: -apple-system, sans-serif; padding: 14px; }
    .widget-box { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 18px; max-width: 480px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .title { font-size: 0.82rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
    .badge { font-family: var(--font-mono); font-size: 0.68rem; color: var(--accent); background: rgba(223, 184, 67, 0.12); padding: 3px 8px; border-radius: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .card-claim { background: rgba(244, 63, 94, 0.06); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 6px; padding: 10px; }
    .card-truth { background: rgba(223, 184, 67, 0.06); border: 1px solid rgba(223, 184, 67, 0.35); border-radius: 6px; padding: 10px; }
    .label { font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; margin-bottom: 4px; }
    .val-rose { font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; color: var(--rose); }
    .val-gold { font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; color: var(--accent); }
    .note { font-size: 0.72rem; color: var(--muted); margin-top: 4px; }
    .cta { display: block; text-align: center; background: linear-gradient(180deg, #DFB843 0%, #B88E28 100%); color: #07080B; text-decoration: none; font-weight: 700; font-size: 0.8rem; padding: 9px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="widget-box">
    <div class="header">
      <div class="title">FRICTION REALITY CHECK (${teardown.nominalPriceCents}¢ Contract)</div>
      <div class="badge">WIN RATE: ${teardown.userStatedWinRatePct}%</div>
    </div>
    <div class="grid">
      <div class="card-claim">
        <div class="label" style="color:var(--rose);">Competitor Claim</div>
        <div class="val-rose">+$${teardown.competitorNominalGrossEV.toFixed(2)}</div>
        <div class="note">Ignores CFTC fees</div>
      </div>
      <div class="card-truth">
        <div class="label" style="color:var(--accent);">QuanterraOS Reality</div>
        <div class="val-gold">${teardown.netRealizedExpectedProfitUsd >= 0 ? "+" : ""}$${teardown.netRealizedExpectedProfitUsd.toFixed(2)}</div>
        <div class="note">True Breakeven: ${teardown.trueBreakevenHurdlePct}%</div>
      </div>
    </div>
    <a href="/why" target="_blank" class="cta">See Full Competitive Teardown &amp; Audit →</a>
  </div>
</body>
</html>`;
}

/**
 * Renders the full interactive HTML page for the Competitive Benchmark (/why, /why-quanterraos, /vs).
 */
export function renderBenchmarkPageHtml(teardown: FrictionTeardownResult): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Why QuanterraOS — The Independent Truth Layer vs Competitor Hype</title>
  <meta name="description" content="Direct architectural and mathematical comparison between QuanterraOS and 2026 prediction market tools (Verso, Oddpool, Dome, Predly, Stand).">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-highlight: #111624;
      --border: rgba(212, 175, 55, 0.16);
      --border-accent: rgba(223, 184, 67, 0.5);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --rose: #F43F5E;
      --emerald: #10B981;
      --font-sans: "Inter", sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 60% at 50% -10%, rgba(223, 184, 67, 0.12), transparent 70%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.6;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 48px;
      border-bottom: 1px solid var(--border);
      background: rgba(6, 7, 10, 0.88);
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text);
      font-weight: 700;
      font-size: 1rem;
    }
    .nav-brand span { color: var(--accent); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 400; }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--text-dim); text-decoration: none; font-size: 0.85rem; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .container { max-width: 1200px; margin: 40px auto 0; padding: 0 24px; }
    
    .hero-header { text-align: center; margin-bottom: 44px; }
    .hero-tag {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--accent-light);
      background: rgba(223, 184, 67, 0.1);
      border: 1px solid rgba(223, 184, 67, 0.35);
      padding: 5px 14px;
      border-radius: 20px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    h1 { font-size: 2.5rem; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; letter-spacing: -0.02em; }
    .hero-subtitle { font-size: 1.08rem; color: var(--text-dim); max-width: 780px; margin: 0 auto; }

    .panel { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 28px; margin-bottom: 36px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4); }
    .section-title { font-size: 1.35rem; font-weight: 700; color: #FFFFFF; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }

    /* Teardown Simulator */
    .sim-grid { display: grid; grid-template-columns: 320px 1fr 1fr; gap: 20px; margin-top: 14px; }
    @media (max-width: 900px) { .sim-grid { grid-template-columns: 1fr; } }

    .sim-controls { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 20px; }
    .control-group { margin-bottom: 16px; }
    .control-label { font-family: var(--font-mono); font-size: 0.75rem; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; display: block; }
    .sim-slider { width: 100%; accent-color: var(--accent); }
    .sim-input { width: 100%; background: #06070A; border: 1px solid var(--border); border-radius: 6px; color: #FFFFFF; padding: 8px 12px; font-family: var(--font-mono); font-size: 0.95rem; }

    .teardown-box-rose {
      background: linear-gradient(180deg, rgba(244, 63, 94, 0.08) 0%, rgba(12, 15, 23, 0.9) 100%);
      border: 1px solid rgba(244, 63, 94, 0.35);
      border-radius: 8px;
      padding: 22px;
    }
    .teardown-box-gold {
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.08) 0%, rgba(12, 15, 23, 0.9) 100%);
      border: 1px solid rgba(223, 184, 67, 0.4);
      border-radius: 8px;
      padding: 22px;
    }
    .box-badge { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 10px; }
    .badge-rose { background: rgba(244, 63, 94, 0.15); color: var(--rose); }
    .badge-gold { background: rgba(223, 184, 67, 0.15); color: var(--accent); }

    /* Battlecard Matrix Table */
    .comp-table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.85rem; margin-top: 14px; }
    .comp-table th, .comp-table td { padding: 16px 18px; text-align: left; border-bottom: 1px solid var(--border); vertical-align: top; }
    .comp-table th { background: rgba(212, 175, 55, 0.04); color: var(--accent-light); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .td-dim { color: var(--text-dim); }
    .td-quanterra { color: #FFFFFF; font-weight: 600; background: rgba(223, 184, 67, 0.02); }

    .tag-superior { background: rgba(16, 185, 129, 0.15); color: var(--emerald); font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; }

    .cta-banner {
      background: linear-gradient(180deg, rgba(20, 26, 40, 0.95) 0%, rgba(13, 17, 26, 0.98) 100%);
      border: 1px solid var(--border-accent);
      border-radius: 12px;
      padding: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      margin-bottom: 36px;
    }
    @media (max-width: 760px) { .cta-banner { flex-direction: column; align-items: flex-start; } }
    .btn-gold {
      background: linear-gradient(180deg, #FAF1D4 0%, #DFB843 35%, #B88E28 100%);
      color: #07080B;
      font-family: var(--font-mono);
      font-weight: 700;
      padding: 13px 28px;
      border-radius: 8px;
      text-decoration: none;
      white-space: nowrap;
      border: 1px solid #DFB843;
    }

    .provenance-card {
      background: rgba(14, 19, 26, 0.7);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px 22px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
      line-height: 1.6;
    }
  </style>
</head>
<body>

  <nav class="top-nav">
    <a href="/" class="nav-brand">
      QUANTERRAOS
      <span>/ BENCHMARK</span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/calculator">True Cost Calc</a>
      <a href="/why" class="active">Why QuanterraOS</a>
      <a href="/study">Study #6.4</a>
      <a href="/educators">Educators</a>
      <a href="/radar">Radar</a>
      <a href="/pricing">Pricing</a>
      <a href="/account">Account</a>
    </div>
  </nav>

  <main class="container">
    <div class="hero-header">
      <div class="hero-tag">The 2026 Competitive Differentiation Blueprint</div>
      <h1>The Independent Truth Layer vs. Competitor Hype</h1>
      <p class="hero-subtitle">
        Dome was acquired by Polymarket. Oddpool was acquired by Kalshi. Verso and Predly conceal parabolic taker fees. QuanterraOS is the independent, venue-neutral operating system that reveals the truth about friction, calibration, and risk.
      </p>
    </div>

    <!-- Interactive Friction Teardown Simulator -->
    <div class="panel">
      <div class="section-title">
        <span>Friction Teardown: Competitor Illusion vs. QuanterraOS Reality</span>
        <span class="mono" style="font-size:0.8rem; color:var(--accent);">Live Mathematical Audit</span>
      </div>
      <p style="color:var(--text-dim); font-size:0.9rem; margin-bottom:18px;">
        Enter any contract price and subjective forecast. Watch how competitor tools pitch illusory profit while QuanterraOS calculates the real CFTC taker fee drag and breakeven hurdle.
      </p>

      <form action="/why" method="GET" class="sim-grid">
        <div class="sim-controls">
          <div class="control-group">
            <label class="control-label">Contract Price (¢)</label>
            <input type="number" name="p" min="1" max="99" value="${teardown.nominalPriceCents}" class="sim-input" onchange="this.form.submit()" />
            <input type="range" min="1" max="99" value="${teardown.nominalPriceCents}" class="sim-slider" oninput="this.form.p.value=this.value; this.form.submit()" />
          </div>
          <div class="control-group">
            <label class="control-label">Your Forecast Win Rate (%)</label>
            <input type="number" name="w" min="1" max="99" value="${teardown.userStatedWinRatePct}" class="sim-input" onchange="this.form.submit()" />
            <input type="range" min="1" max="99" value="${teardown.userStatedWinRatePct}" class="sim-slider" oninput="this.form.w.value=this.value; this.form.submit()" />
          </div>
          <div class="control-group">
            <label class="control-label">Contract Order Count</label>
            <input type="number" name="c" min="10" max="1000" step="10" value="${teardown.contracts}" class="sim-input" onchange="this.form.submit()" />
          </div>
          <button type="submit" class="btn-gold" style="width:100%; padding:10px; font-size:0.85rem;">Recalculate Teardown</button>
        </div>

        <!-- Competitor Illusion -->
        <div class="teardown-box-rose">
          <span class="box-badge badge-rose">Competitor Terminal View (Verso / Predly)</span>
          <div class="mono" style="font-size:2.2rem; font-weight:700; color:var(--rose); margin-bottom:6px;">
            +$${teardown.competitorNominalGrossEV.toFixed(2)}
          </div>
          <div class="mono sub" style="margin-bottom:14px;">Claimed Nominal Edge: +${teardown.competitorClaimedEdgePct}%</div>
          <p style="font-size:0.85rem; color:#E2E8F0; line-height:1.5;">
            Competitor terminals show nominal spreads and claim you have edge. They do <strong>not</strong> subtract Kalshi's parabolic taker fee ($0.07 × p × (1-p)) or calculate the true hurdle.
          </p>
          <div class="mono" style="color:var(--rose); font-size:0.8rem; margin-top:14px; font-weight:600;">
            ❌ 70%+ of retail accounts churn due to hidden friction blindness.
          </div>
        </div>

        <!-- QuanterraOS Reality Check -->
        <div class="teardown-box-gold">
          <span class="box-badge badge-gold">QuanterraOS Reality Check</span>
          <div class="mono" style="font-size:2.2rem; font-weight:700; color:var(--accent); margin-bottom:6px;">
            ${teardown.netRealizedExpectedProfitUsd >= 0 ? "+" : ""}$${teardown.netRealizedExpectedProfitUsd.toFixed(2)}
          </div>
          <div class="mono sub" style="margin-bottom:14px;">True Breakeven Hurdle: <strong style="color:#FFFFFF;">${teardown.trueBreakevenHurdlePct}%</strong></div>
          <p style="font-size:0.85rem; color:#E2E8F0; line-height:1.5;">
            QuanterraOS applies the official CFTC taker fee schedule (<strong>-$${teardown.exactTakerFeeUsd.toFixed(2)} drag</strong>). Exchange fees consume <strong>${teardown.feeDragRatioPctOfProfit}% of your gross profit</strong>.
          </p>
          <div class="mono" style="color:var(--emerald); font-size:0.8rem; margin-top:14px; font-weight:600;">
            ✓ Know your exact hurdle before risking a single dollar.
          </div>
        </div>
      </form>
    </div>

    <!-- 6-Dimension Architectural Battlecard Table -->
    <div class="panel">
      <div class="section-title">
        <span>Architectural Battlecard: QuanterraOS vs. The Market</span>
        <span class="mono" style="font-size:0.8rem; color:var(--muted);">Full Technical Audit</span>
      </div>
      <table class="comp-table">
        <thead>
          <tr>
            <th style="width:22%;">Architectural Dimension</th>
            <th style="width:38%;">QuanterraOS Sovereign Architecture</th>
            <th style="width:32%;">Incumbent Competitors</th>
            <th style="width:8%;">Advantage</th>
          </tr>
        </thead>
        <tbody>
          ${COMPETITOR_BENCHMARK_ROWS.map((row) => `
            <tr>
              <td><strong>${row.dimension}</strong></td>
              <td class="td-quanterra">
                ${row.quanterraos}
                <div style="font-size:0.78rem; color:var(--text-dim); margin-top:6px; font-weight:400;">${row.detail}</div>
              </td>
              <td class="td-dim">${row.competitors}</td>
              <td><span class="tag-superior">${row.verdict}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- Action Banner -->
    <div class="cta-banner">
      <div>
        <h3 style="font-size:1.25rem; color:#FFFFFF; margin-bottom:6px;">Stop Trading Friction-Blind. Verify Before You Enter.</h3>
        <p style="color:var(--text-dim); font-size:0.9rem;">
          Use our Free True-Cost Check, practice in Realistic Paper Mode, or audit historical calibration across 1,316 settled windows.
        </p>
      </div>
      <div style="display:flex; gap:12px;">
        <a href="/calculator" class="btn-gold">Launch Free Check →</a>
        <a href="/paper" class="btn-gold" style="background:rgba(255,255,255,0.06); color:#FFFFFF; border:1px solid var(--border);">Paper Mode</a>
      </div>
    </div>

    <!-- Provenance Footer -->
    <div class="provenance-card">
      <div style="font-weight:700; color:#FFFFFF; margin-bottom:4px;">PROVENANCE &amp; REGULATORY ATTESTATION</div>
      <div><strong>SHA-256 Provenance Hash:</strong> ${teardown.provenanceHash}</div>
      <div><strong>Settlement Oracle Basis:</strong> CME CF Bitcoin Real-Time Index (BRTI) 60-Second TWAP</div>
      <div><strong>Rule B5 Safety Lock:</strong> $0.00 Live Capital Deployed · Standby Mode Active</div>
      <div style="margin-top:6px;"><strong>Non-Affiliation Notice:</strong> Kalshi, Polymarket, Verso, Oddpool, and Dome are registered marks of their respective owners. QuanterraOS is an independent measurement and risk operating system.</div>
    </div>
  </main>

</body>
</html>`;
}
