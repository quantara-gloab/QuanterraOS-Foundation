/**
 * QuanterraOS — Embedded Cost & Risk Widget Catalog (/widgets, /embeds)
 *
 * Implements Master Blueprint v2 Part 3.9 (Widgets Distribution Engine):
 * 1. Kalshi fee & breakeven calculator (/embed/calculator)
 * 2. BRTI-vs-spot dispersion ticker (/embed/dispersion)
 * 3. Live 15-min BTC countdown with strike distance (/embed/countdown)
 * 4. "Market vs model" calibration badge (/embed/calibration)
 * 5. Kalshi vs Polymarket net-price comparator (single market) (/embed/comparator)
 *
 * Capabilities:
 * - Embed via <script> + iframe fallback; responsive, light/dark themes, white-label partner flag.
 * - 1-Click interactive code generation (HTML <iframe>, JavaScript <script>, Markdown, Direct URL).
 * - Strict Rule B4 (zero superlatives), Rule B5 ($0.00 capital risk lock), and Rule B10 marks notices.
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { renderBetaFeedbackWidgetHtml } from "./feedback-widget.ts";

export interface WidgetDefinition {
  id: string;
  title: string;
  category: "friction" | "microstructure" | "education";
  categoryLabel: string;
  badgeText: string;
  description: string;
  embedUrl: string;
  cardSvgUrl?: string;
  exportCsvUrl?: string;
  defaultWidth: string;
  defaultHeight: string;
  targetAudience: string;
  keyFeatures: string[];
}

/**
 * Master Blueprint v2 Part 3.9: 5 Canonical Distribution Widgets
 */
export const CANONICAL_V2_WIDGETS: WidgetDefinition[] = [
  {
    id: "friction-calculator",
    title: "Kalshi Fee & Breakeven Calculator",
    category: "friction",
    categoryLabel: "Friction & Cost Auditing",
    badgeText: "Distribution Core",
    description: "Embeddable interactive calculator uncovering Kalshi's parabolic taker fee ($0.07 × p × (1-p)) and required breakeven win rate (52.75% on 51¢ contracts) before users risk capital.",
    embedUrl: "/embed/calculator",
    defaultWidth: "540px",
    defaultHeight: "460px",
    targetAudience: "Trading education blogs, financial newsletters, CFD/options communities.",
    keyFeatures: [
      "Dynamic price and contract quantity sliders",
      "Real-time CFTC non-linear taker fee calculation",
      "True breakeven hurdle percentage calculation",
      "Zero registration required for readers",
    ],
  },
  {
    id: "dispersion-ticker",
    title: "BRTI-vs-Spot Dispersion Ticker",
    category: "microstructure",
    categoryLabel: "Settlement & Microstructure",
    badgeText: "Microstructure Radar",
    description: "Real-time surveillance monitoring price dispersion across constituent spot exchanges (Coinbase, Kraken, Bitstamp, Gemini) vs the CME CF BRTI 60-second TWAP settlement benchmark.",
    embedUrl: "/embed/dispersion",
    defaultWidth: "580px",
    defaultHeight: "360px",
    targetAudience: "Quantitative traders, market microstructure researchers, crypto media.",
    keyFeatures: [
      "Constituent exchange live quote dispersion in basis points",
      "CME CF BRTI 60s TWAP benchmark proxy comparison",
      "Normal (<15 bps) vs elevated dispersion alert state",
      "Settlement truth reminder against instantaneous spot illusion",
    ],
  },
  {
    id: "countdown-ticker",
    title: "Live 15-Min BTC Countdown & Strike Distance",
    category: "microstructure",
    categoryLabel: "Settlement & Microstructure",
    badgeText: "Cockpit HUD",
    description: "Dynamic countdown timer ticking down to nearest 15-minute resolution (:00, :15, :30, :45) with ATM strike delta and coin-flip hazard zone warnings.",
    embedUrl: "/embed/countdown",
    defaultWidth: "540px",
    defaultHeight: "340px",
    targetAudience: "Active event contract traders, financial substacks, live stream overlays.",
    keyFeatures: [
      "Real-time countdown timer to contract settlement",
      "ATM strike distance delta (+$X / -$X)",
      "Coin-flip hazard zone overlay within 3 minutes of expiry",
      "Rule B5 $0 live capital circuit breaker",
    ],
  },
  {
    id: "calibration-badge",
    title: "Market vs Model Calibration Badge",
    category: "education",
    categoryLabel: "Calibration & Governance",
    badgeText: "Empirical Proof",
    description: "Audited calibration scorecard displaying empirical Brier score performance across 1,316 settled BTC15M windows proving the market mid beats proprietary models.",
    embedUrl: "/embed/calibration",
    defaultWidth: "520px",
    defaultHeight: "320px",
    targetAudience: "Forecasting communities, Substack journalists, academic researchers.",
    keyFeatures: [
      "Kalshi Market Mid Brier Score (0.2001) calibration",
      "QuanterraOS Model Brier Score (0.2063) comparison",
      "Naive coin-flip benchmark (0.2500)",
      "Transparent unvarnished reporting when market beats our model",
    ],
  },
  {
    id: "cross-venue-comparator",
    title: "Kalshi vs Polymarket Net-Price Comparator",
    category: "friction",
    categoryLabel: "Friction & Cost Auditing",
    badgeText: "Cross-Venue Referee",
    description: "Side-by-side single market fee, breakeven, and oracle settlement disparity comparison between CFTC-regulated Kalshi and decentralized Polymarket.",
    embedUrl: "/embed/comparator",
    defaultWidth: "580px",
    defaultHeight: "380px",
    targetAudience: "Prediction market comparison sites, crypto derivatives reviewers, educators.",
    keyFeatures: [
      "Kalshi parabolic taker fee vs Polymarket dynamic fee + gas",
      "True breakeven win rate percentage comparison",
      "Oracle basis divergence warning (CME CF BRTI 60s TWAP vs UMA)",
      "Unconflicted referee stance ($0 exchange referral incentives)",
    ],
  },
];

/**
 * Sovereign Catalog List (Retained with 8 items for backward compatibility)
 */
export const WIDGET_CATALOG_LIST: WidgetDefinition[] = [
  {
    id: "friction-calculator",
    title: "True-Cost & Breakeven Calculator",
    category: "friction",
    categoryLabel: "Friction & Cost Auditing",
    badgeText: "Most Popular",
    description: "Embeddable interactive calculator uncovering Kalshi's parabolic taker fee ($0.07 × p × (1-p)) and required breakeven win rate (52.75% on 51¢ contracts) before users risk capital.",
    embedUrl: "/embed/calculator",
    defaultWidth: "520px",
    defaultHeight: "440px",
    targetAudience: "Trading education blogs, financial newsletters, CFD/options communities.",
    keyFeatures: [
      "Dynamic price and contract quantity sliders",
      "Real-time CFTC non-linear taker fee calculation",
      "True breakeven hurdle percentage calculation",
      "Zero registration required for readers",
    ],
  },
  {
    id: "competitive-referee",
    title: "2026 Competitive Teardown Referee",
    category: "friction",
    categoryLabel: "Friction & Cost Auditing",
    badgeText: "2026 Strategy",
    description: "Side-by-side empirical comparison proving how competitor apps conceal taker friction to advertise gross edges, contrasted against QuanterraOS's unconflicted referee net EV.",
    embedUrl: "/embed/benchmark",
    cardSvgUrl: "/api/benchmark/card.svg",
    defaultWidth: "700px",
    defaultHeight: "460px",
    targetAudience: "Financial journalists, Substack authors, prediction market review portals.",
    keyFeatures: [
      "Competitor naive claim vs QuanterraOS audited net",
      "43.8% fee drag ratio transparency",
      "Cryptographic 64-char SHA-256 provenance hash",
      "Neutral referee status (unconflicted by exchange ownership)",
    ],
  },
  {
    id: "transparency-audit",
    title: "Periodic Market Friction & Outcome Audit",
    category: "friction",
    categoryLabel: "Friction & Cost Auditing",
    badgeText: "Audited Empirical Data",
    description: "Canonical 10-decile probability calibration breakdown and fee drag distribution across 1,316 settled BTC15M windows (19,740 1-minute observations) with academic citations.",
    embedUrl: "/embed/transparency",
    cardSvgUrl: "/api/reports/friction/card.svg",
    exportCsvUrl: "/api/reports/friction/export.csv",
    defaultWidth: "680px",
    defaultHeight: "440px",
    targetAudience: "Academic researchers, institutional quants, investigative financial media.",
    keyFeatures: [
      "Empirical Brier score calibration (0.2001 mid-price)",
      "Decile-by-decile outcome rates (10¢ to 90¢)",
      "WSJ, Roosevelt Institute, and Vanderbilt University citations",
      "RFC 4180 downloadable CSV dataset",
    ],
  },
  {
    id: "settlement-radar",
    title: "CME CF BRTI 60-Second TWAP Radar",
    category: "microstructure",
    categoryLabel: "Settlement & Microstructure",
    badgeText: "Settlement Truth",
    description: "Real-time settlement surveillance monitoring the 60-second TWAP window across constituent spot exchanges (Coinbase, Kraken, Bitstamp, Gemini) vs instantaneous Kalshi quotes.",
    embedUrl: "/embed/radar",
    cardSvgUrl: "/api/settlement/dissection/card.svg",
    defaultWidth: "660px",
    defaultHeight: "420px",
    targetAudience: "Active event contract scalpers, market makers, quantitative researchers.",
    keyFeatures: [
      "Constituent exchange live dispersion matrix",
      "Real-time 60-second sliding TWAP settlement accumulator",
      "Latency arbitrage and basis mismatch alerts",
      "Sub-second micro-divergence indicators",
    ],
  },
  {
    id: "cross-venue-divergence",
    title: "Cross-Venue Divergence Monitor",
    category: "microstructure",
    categoryLabel: "Settlement & Microstructure",
    badgeText: "Arbitrage Friction",
    description: "Side-by-side surveillance of identical BTC resolution outcomes across Kalshi (CFTC regulated) and Polymarket (Polygon decentralized) accounting for all-in friction.",
    embedUrl: "/embed/divergence",
    defaultWidth: "660px",
    defaultHeight: "380px",
    targetAudience: "Statistical arbitrageurs, basis traders, crypto macro hedge funds.",
    keyFeatures: [
      "Kalshi non-linear taker fee vs Polymarket dynamic fee + gas",
      "True breakeven probability difference",
      "Resolution oracle divergence risk (CME CF BRTI vs UMA)",
      "Instantaneous cross-exchange spread calculation",
    ],
  },
  {
    id: "prospective-study",
    title: "Prospective 1,316-Window Calibration Corpus",
    category: "education",
    categoryLabel: "Education & Governance",
    badgeText: "Academic Research",
    description: "Public empirical validation corpus detailing actual win rates and Brier score resolution accuracy for event contracts across 1,316 settled BTC15M windows.",
    embedUrl: "/embed/study",
    cardSvgUrl: "/api/study/summary/card.svg",
    exportCsvUrl: "/api/study/corpus.csv",
    defaultWidth: "680px",
    defaultHeight: "450px",
    targetAudience: "University economics departments, quantitative finance researchers, regulators.",
    keyFeatures: [
      "Peer-review ready prospective observation methodology",
      "Strict Brier score decomposition (reliability vs resolution)",
      "Demonstrates exchange house edge via taker fee drag",
      "Cryptographic timestamping across all 1,316 settled windows",
    ],
  },
  {
    id: "educator-portal",
    title: "Trading Educator & Newsletter Embed Pack",
    category: "education",
    categoryLabel: "Education & Governance",
    badgeText: "Educator Pack",
    description: "Pre-configured suite of risk education cards for financial newsletters, Substacks, and trading educators warning students about negative EV coin-flip markets.",
    embedUrl: "/embed/educators",
    defaultWidth: "600px",
    defaultHeight: "420px",
    targetAudience: "Financial YouTubers, Substack authors, trading course instructors.",
    keyFeatures: [
      "Breakeven hurdle infographics",
      "Negative EV coin-flip contract visualizers",
      "No affiliate marketing or trading commission kickbacks",
      "Strict Rule B4 zero-hype educational compliance",
    ],
  },
  {
    id: "realistic-paper",
    title: "Realistic Execution Simulation Sandbox",
    category: "education",
    categoryLabel: "Education & Governance",
    badgeText: "Simulated Training",
    description: "Simulated practice environment accounting for realistic venue latency, order-book depth, exchange taker fees, and missed fills without real capital risk.",
    embedUrl: "/embed/paper",
    defaultWidth: "640px",
    defaultHeight: "460px",
    targetAudience: "Novice prediction market participants, quantitative finance students.",
    keyFeatures: [
      "Zero deposit requirement ($0.00 capital risk)",
      "Realistic fill probability based on order-book depth",
      "Automatic deduction of parabolic taker fees",
      "Encrypted sovereign journal integration",
    ],
  },
];

/**
 * Unified all-widgets map for gallery previews
 */
const ALL_GALLERY_WIDGETS: WidgetDefinition[] = [
  ...CANONICAL_V2_WIDGETS,
  ...WIDGET_CATALOG_LIST.filter(w => !CANONICAL_V2_WIDGETS.some(c => c.id === w.id || c.embedUrl === w.embedUrl)),
];

/**
 * Renders the full interactive Widget & Embed Hub (/widgets, /embeds).
 */
export function renderWidgetCatalogHtml(): string {
  const initialWidget = CANONICAL_V2_WIDGETS[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <title>Embedded Widgets &amp; Distribution Cards — QuanterraOS</title>
  <meta name="description" content="Embeddable prediction market fee calculators, settlement dispersion tickers, live countdowns, calibration badges, and cross-venue comparators.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-elevated: #111624;
      --border: rgba(212, 175, 55, 0.18);
      --border-accent: rgba(223, 184, 67, 0.45);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --emerald: #10B981;
      --rose: #F43F5E;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
      padding: 16px 48px;
      border-bottom: 1px solid var(--border);
      background: rgba(6, 7, 10, 0.92);
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
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .brand-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.84rem; font-weight: 500; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--accent); }
    
    .container { max-width: 1240px; margin: 0 auto; padding: 40px 24px; }
    .header-banner { text-align: center; max-width: 820px; margin: 0 auto 36px; }
    .header-banner .badge {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      background: rgba(223, 184, 67, 0.1);
      border: 1px solid var(--border-accent);
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 16px;
    }
    .header-banner h1 {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 14px;
      color: #FFFFFF;
    }
    .header-banner .subtitle {
      color: var(--text-dim);
      font-size: 1rem;
      line-height: 1.6;
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .filter-pill {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text-dim);
      padding: 8px 18px;
      border-radius: 24px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .filter-pill:hover { border-color: var(--accent); color: var(--text); }
    .filter-pill.active {
      background: rgba(223, 184, 67, 0.15);
      border-color: var(--accent);
      color: var(--accent-light);
    }

    /* Layout */
    .catalog-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 960px) {
      .catalog-layout { grid-template-columns: 1fr; }
      .top-nav { padding: 14px 20px; }
    }

    /* Left Roster */
    .widget-roster {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 820px;
      overflow-y: auto;
      padding-right: 8px;
    }
    .widget-roster::-webkit-scrollbar { width: 6px; }
    .widget-roster::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    .widget-item-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      text-align: left;
    }
    .widget-item-card:hover {
      border-color: var(--border-accent);
      transform: translateY(-1px);
    }
    .widget-item-card.selected {
      background: var(--card-elevated);
      border-color: var(--accent);
      box-shadow: 0 0 16px rgba(223, 184, 67, 0.15);
    }
    .widget-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .widget-badge {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--accent);
      background: rgba(223, 184, 67, 0.12);
      border: 1px solid rgba(223, 184, 67, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .widget-title { font-weight: 700; font-size: 0.94rem; color: #FFFFFF; margin-bottom: 6px; }
    .widget-summary { font-size: 0.78rem; color: var(--text-dim); line-height: 1.4; margin-bottom: 10px; }
    .widget-meta {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--muted);
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 8px;
    }

    /* Right Preview & Code Panel */
    .preview-panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 24px;
      position: sticky;
      top: 90px;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .preview-title { font-size: 1.25rem; font-weight: 700; color: #FFFFFF; }

    /* Customizer Bar (Theme, White-Label & Viewports) */
    .customizer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .control-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.74rem;
    }
    .ctrl-label { color: var(--muted); text-transform: uppercase; font-size: 0.68rem; }
    .toggle-btn-group {
      display: inline-flex;
      background: #080B12;
      border: 1px solid var(--border);
      border-radius: 4px;
      overflow: hidden;
    }
    .toggle-btn {
      background: transparent;
      border: none;
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      padding: 4px 10px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .toggle-btn:hover { color: var(--text); }
    .toggle-btn.active {
      background: rgba(223, 184, 67, 0.2);
      color: var(--accent-light);
      font-weight: 600;
    }

    .iframe-wrapper {
      background: #05060A;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
      min-height: 380px;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 12px;
      transition: all 0.2s;
    }
    .preview-iframe {
      width: 100%;
      height: 440px;
      border: none;
      border-radius: 6px;
      transition: width 0.3s ease;
      background: transparent;
    }

    /* Snippet Box */
    .snippet-section {
      background: #080B12;
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .snippet-tabs {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--border);
      padding: 6px 12px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tab-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .code-tab {
      background: transparent;
      border: none;
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.74rem;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .code-tab.active { background: rgba(223, 184, 67, 0.15); color: var(--accent); font-weight: 600; }
    .copy-btn {
      background: rgba(223, 184, 67, 0.12);
      border: 1px solid var(--border-accent);
      color: var(--accent-light);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .copy-btn:hover { background: var(--accent); color: #000000; font-weight: 700; }
    .code-content {
      padding: 14px;
      font-family: var(--font-mono);
      font-size: 0.76rem;
      color: #E2E8F0;
      background: #06080E;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }
    .feature-item {
      font-size: 0.75rem;
      color: var(--text-dim);
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .feature-check { color: var(--emerald); font-weight: 700; font-family: var(--font-mono); }

    .direct-links {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
      font-family: var(--font-mono);
      font-size: 0.74rem;
    }
    .direct-links a { color: var(--accent); text-decoration: underline; }
  </style>
</head>
<body>

  <!-- Top Navigation -->
  <nav class="top-nav">
    <div style="display:flex; align-items:center; gap:32px;">
      <a href="/" class="nav-brand"><span class="brand-dot"></span> QUANTERRAOS</a>
      <div class="nav-links">
        <a href="/check">Check</a>
        <a href="/radar">Radar</a>
        <a href="/deck">Flight Deck</a>
        <a href="/proof">Proof</a>
        <a href="/institutional">Institutional</a>
        <a href="/pricing">Pricing</a>
        <a href="/widgets" class="active">Widgets</a>
      </div>
    </div>
    <div>
      <a href="/check" style="background:rgba(212,175,55,0.1); border:1px solid var(--border); color:var(--accent-light); font-family:var(--font-mono); font-size:0.75rem; padding:6px 14px; border-radius:4px; text-decoration:none;">
        Free Check &rarr;
      </a>
    </div>
  </nav>

  <main class="container">
    <header class="header-banner">
      <div class="badge">Master Blueprint Part 3.9 &bull; Distribution Engine</div>
      <h1>Distribution Cards &amp; Embeddable Widgets</h1>
      <p class="subtitle">
        Empower your readers with independent, real-time prediction market telemetry. Embed sovereign fee teardown calculators, settlement TWAP radars, live BTC expiry countdowns, calibration badges, and cross-venue net comparators directly into your Substack, blog, or quant terminal.
      </p>
    </header>

    <!-- Category Filter Bar -->
    <div class="filter-bar" id="filter-bar">
      <button class="filter-pill active" onclick="filterWidgets('all', this)" id="btn-filter-all">All Widgets (${ALL_GALLERY_WIDGETS.length})</button>
      <button class="filter-pill" onclick="filterWidgets('canonical', this)" id="btn-filter-canonical">Canonical v2 (5)</button>
      <button class="filter-pill" onclick="filterWidgets('friction', this)" id="btn-filter-friction">Friction &amp; Cost Auditing</button>
      <button class="filter-pill" onclick="filterWidgets('microstructure', this)" id="btn-filter-microstructure">Settlement &amp; Microstructure</button>
      <button class="filter-pill" onclick="filterWidgets('education', this)" id="btn-filter-education">Education &amp; Governance</button>
    </div>

    <!-- Catalog Layout -->
    <div class="catalog-layout">
      <!-- Left Roster -->
      <div class="widget-roster" id="widget-roster">
        ${ALL_GALLERY_WIDGETS.map((w, idx) => `
          <div class="widget-item-card ${idx === 0 ? "selected" : ""}" 
               data-id="${w.id}" 
               data-category="${w.category}" 
               data-canonical="${CANONICAL_V2_WIDGETS.some(c => c.id === w.id) ? "true" : "false"}"
               onclick="selectWidget('${w.id}', this)"
               id="widget-card-${w.id}">
            <div class="widget-header-row">
              <span class="widget-badge">${w.badgeText}</span>
              <span style="font-family:var(--font-mono); font-size:0.68rem; color:var(--muted);">${w.categoryLabel}</span>
            </div>
            <div class="widget-title">${w.title}</div>
            <div class="widget-summary">${w.description}</div>
            <div class="widget-meta">
              <span>Default: ${w.defaultWidth} &times; ${w.defaultHeight}</span>
              <span style="color:var(--accent);">Inspect &amp; Copy &rarr;</span>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Right Preview & Code Panel -->
      <div class="preview-panel" id="preview-panel">
        <div class="panel-header">
          <div>
            <div class="preview-title" id="panel-title">${initialWidget.title}</div>
            <div style="font-size:0.75rem; color:var(--text-dim);" id="panel-audience">Audience: ${initialWidget.targetAudience}</div>
          </div>
        </div>

        <!-- Customizer Bar -->
        <div class="customizer-bar">
          <!-- Theme Switcher -->
          <div class="control-group">
            <span class="ctrl-label">Theme:</span>
            <div class="toggle-btn-group">
              <button class="toggle-btn active" id="btn-theme-dark" onclick="setTheme('dark', this)">Dark</button>
              <button class="toggle-btn" id="btn-theme-light" onclick="setTheme('light', this)">Light</button>
            </div>
          </div>

          <!-- White-Label Switcher -->
          <div class="control-group">
            <span class="ctrl-label">Branding:</span>
            <div class="toggle-btn-group">
              <button class="toggle-btn active" id="btn-wl-standard" onclick="setWhiteLabel(false, this)">Powered By</button>
              <button class="toggle-btn" id="btn-wl-active" onclick="setWhiteLabel(true, this)">White-Label</button>
            </div>
          </div>

          <!-- Viewport Switcher -->
          <div class="control-group">
            <span class="ctrl-label">Viewport:</span>
            <div class="toggle-btn-group">
              <button class="toggle-btn active" onclick="setViewport('100%', this)" id="btn-vp-full">100%</button>
              <button class="toggle-btn" onclick="setViewport('640px', this)" id="btn-vp-tablet">Tablet</button>
              <button class="toggle-btn" onclick="setViewport('380px', this)" id="btn-vp-mobile">Mobile</button>
            </div>
          </div>
        </div>

        <!-- Live Iframe Preview -->
        <div class="iframe-wrapper" id="iframe-wrapper">
          <iframe src="${initialWidget.embedUrl}?theme=dark" 
                  id="preview-iframe" 
                  class="preview-iframe" 
                  title="${initialWidget.title} Live Preview"
                  loading="lazy"></iframe>
        </div>

        <!-- Features Checklist -->
        <div class="features-grid" id="panel-features">
          ${initialWidget.keyFeatures.map((f) => `
            <div class="feature-item">
              <span class="feature-check">&#10003;</span>
              <span>${f}</span>
            </div>
          `).join("")}
        </div>

        <!-- Code Snippet Box -->
        <div class="snippet-section">
          <div class="snippet-tabs">
            <div class="tab-group">
              <button class="code-tab active" onclick="switchCodeTab('iframe', this)" id="tab-iframe">HTML &lt;iframe&gt;</button>
              <button class="code-tab" onclick="switchCodeTab('script', this)" id="tab-script">JS &lt;script&gt;</button>
              <button class="code-tab" onclick="switchCodeTab('markdown', this)" id="tab-markdown">Markdown Badge</button>
              <button class="code-tab" onclick="switchCodeTab('direct', this)" id="tab-direct">Direct URL</button>
            </div>
            <button class="copy-btn" onclick="copySnippet()" id="btn-copy-snippet">
              <span id="copy-btn-text">Copy Code</span>
            </button>
          </div>
          <pre class="code-content" id="code-content">&lt;iframe src="https://quanterraos.com${initialWidget.embedUrl}?theme=dark" width="100%" height="${initialWidget.defaultHeight}" frameborder="0" style="border:1px solid rgba(212,175,55,0.22); border-radius:8px; overflow:hidden;" title="${initialWidget.title}"&gt;&lt;/iframe&gt;</pre>
        </div>

        <!-- Direct Links -->
        <div class="direct-links" id="panel-direct-links">
          <span>Direct Endpoints:</span>
          <a href="${initialWidget.embedUrl}" target="_blank" id="link-direct-embed">Open Live Embed &nearr;</a>
          ${initialWidget.cardSvgUrl ? `<a href="${initialWidget.cardSvgUrl}" target="_blank" id="link-direct-svg">Download SVG Card &nearr;</a>` : ""}
          ${initialWidget.exportCsvUrl ? `<a href="${initialWidget.exportCsvUrl}" target="_blank" id="link-direct-csv">Download CSV Data &nearr;</a>` : ""}
        </div>
      </div>
    </div>

    <!-- Regulatory Footnote -->
    <div style="background:rgba(212,175,55,0.04); border:1px solid var(--border); border-radius:8px; padding:20px; font-family:var(--font-mono); font-size:0.74rem; color:var(--muted); line-height:1.6; margin-top:40px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <span style="color:var(--accent); font-weight:700;">QUANTERRAOS EMBED PROTOCOL // ZERO HOSTED COOKIES</span>
        <span style="color:var(--emerald); font-weight:700;">CIRCUIT BREAKER: LOCKED_RULE_B5 ($0.00 CAPITAL RISK)</span>
      </div>
      <div>
        <strong>Legal &amp; Regulatory Disclosures (Rule B10):</strong> QuanterraOS embeddable widgets are independent computational and risk education tools. They do not accept deposits, route transactions, or provide investment advice. All widgets strictly respect host page permissions and execute sandboxed CSS/JS without third-party tracking cookies. Kalshi, CME Group, and Polymarket are trademarks of their respective owners.
      </div>
    </div>
  </main>

  <script>
    const WIDGETS_MAP = ${JSON.stringify(
      ALL_GALLERY_WIDGETS.reduce((acc, w) => {
        acc[w.id] = w;
        return acc;
      }, {} as Record<string, WidgetDefinition>)
    )};

    let currentWidgetId = "${initialWidget.id}";
    let currentCodeFormat = "iframe";
    let currentTheme = "dark";
    let currentWhiteLabel = false;

    function selectWidget(id, cardEl) {
      currentWidgetId = id;
      const w = WIDGETS_MAP[id];
      if (!w) return;

      document.querySelectorAll('.widget-item-card').forEach(el => el.classList.remove('selected'));
      if (cardEl) cardEl.classList.add('selected');

      document.getElementById('panel-title').textContent = w.title;
      document.getElementById('panel-audience').textContent = 'Audience: ' + w.targetAudience;

      updateIframeUrl();

      const featuresEl = document.getElementById('panel-features');
      featuresEl.innerHTML = w.keyFeatures.map(f => 
        '<div class="feature-item"><span class="feature-check">&#10003;</span><span>' + f + '</span></div>'
      ).join('');

      const linksContainer = document.getElementById('panel-direct-links');
      let linksHtml = '<span>Direct Endpoints:</span> <a href="' + w.embedUrl + '" target="_blank">Open Live Embed &nearr;</a>';
      if (w.cardSvgUrl) {
        linksHtml += ' <a href="' + w.cardSvgUrl + '" target="_blank">Download SVG Card &nearr;</a>';
      }
      if (w.exportCsvUrl) {
        linksHtml += ' <a href="' + w.exportCsvUrl + '" target="_blank">Download CSV Data &nearr;</a>';
      }
      linksContainer.innerHTML = linksHtml;

      updateCodeSnippet();
    }

    function setTheme(theme, btnEl) {
      currentTheme = theme;
      document.querySelectorAll('#btn-theme-dark, #btn-theme-light').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      updateIframeUrl();
      updateCodeSnippet();
    }

    function setWhiteLabel(wl, btnEl) {
      currentWhiteLabel = Boolean(wl);
      document.querySelectorAll('#btn-wl-standard, #btn-wl-active').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      updateIframeUrl();
      updateCodeSnippet();
    }

    function updateIframeUrl() {
      const w = WIDGETS_MAP[currentWidgetId];
      if (!w) return;

      let url = w.embedUrl + '?theme=' + currentTheme;
      if (currentWhiteLabel) url += '&whiteLabel=true';

      const iframe = document.getElementById('preview-iframe');
      iframe.src = url;
      iframe.title = w.title + ' Live Preview';
    }

    function switchCodeTab(format, tabEl) {
      currentCodeFormat = format;
      document.querySelectorAll('.code-tab').forEach(el => el.classList.remove('active'));
      if (tabEl) tabEl.classList.add('active');
      updateCodeSnippet();
    }

    function updateCodeSnippet() {
      const w = WIDGETS_MAP[currentWidgetId];
      if (!w) return;

      const codeBox = document.getElementById('code-content');
      let queryParams = '?theme=' + currentTheme;
      if (currentWhiteLabel) queryParams += '&whiteLabel=true';

      if (currentCodeFormat === 'iframe') {
        codeBox.textContent = '<iframe src="https://quanterraos.com' + w.embedUrl + queryParams + '" width="100%" height="' + w.defaultHeight + '" frameborder="0" style="border:1px solid rgba(212,175,55,0.22); border-radius:8px; overflow:hidden;" title="' + w.title + '"></iframe>';
      } else if (currentCodeFormat === 'script') {
        const widgetAlias = w.embedUrl.replace('/embed/', '');
        codeBox.textContent = '<div data-quanterraos-widget="' + widgetAlias + '" data-theme="' + currentTheme + '" data-whitelabel="' + currentWhiteLabel + '"></div>\\n<script src="https://quanterraos.com/embed/widget.js" async><\\/script>';
      } else if (currentCodeFormat === 'markdown') {
        const svgUrl = w.cardSvgUrl ? 'https://quanterraos.com' + w.cardSvgUrl : 'https://quanterraos.com/api/benchmark/card.svg';
        codeBox.textContent = '[![QuanterraOS Audit](' + svgUrl + ')](https://quanterraos.com' + w.embedUrl + queryParams + ')';
      } else if (currentCodeFormat === 'direct') {
        codeBox.textContent = 'https://quanterraos.com' + w.embedUrl + queryParams;
      }
    }

    function copySnippet() {
      const codeText = document.getElementById('code-content').textContent;
      navigator.clipboard.writeText(codeText).then(() => {
        const btnText = document.getElementById('copy-btn-text');
        const orig = btnText.textContent;
        btnText.textContent = 'Copied!';
        setTimeout(() => { btnText.textContent = orig; }, 2000);
      });
    }

    function setViewport(width, btnEl) {
      document.querySelectorAll('#btn-vp-full, #btn-vp-tablet, #btn-vp-mobile').forEach(el => el.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      const iframe = document.getElementById('preview-iframe');
      iframe.style.width = width;
    }

    function filterWidgets(cat, pillEl) {
      document.querySelectorAll('.filter-pill').forEach(el => el.classList.remove('active'));
      if (pillEl) pillEl.classList.add('active');

      const cards = document.querySelectorAll('.widget-item-card');
      let firstVisible = null;

      cards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        const isCanonical = card.getAttribute('data-canonical') === 'true';

        let matches = false;
        if (cat === 'all') matches = true;
        else if (cat === 'canonical') matches = isCanonical;
        else if (cat === cardCat) matches = true;

        if (matches) {
          card.style.display = 'block';
          if (!firstVisible) firstVisible = card;
        } else {
          card.style.display = 'none';
        }
      });

      if (firstVisible) {
        const id = firstVisible.getAttribute('data-id');
        selectWidget(id, firstVisible);
      }
    }
  </script>

  ${ASSISTANT_WIDGET_HTML}
  ${renderBetaFeedbackWidgetHtml()}
</body>
</html>`;
}
