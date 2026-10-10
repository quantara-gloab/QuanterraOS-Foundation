/**
 * QuanterraOS — Embedded Cost & Risk Widget Catalog (/widgets, /embeds)
 *
 * Implements Section 6.3 & 6.5 of QuanterraOS_Global_Growth_Strategy.md:
 * "6.3. Shareable Educational Cards: Clean summary cards without balances or sensational earnings claims."
 * "6.5. Embedded Cost/Risk Widgets: Distribution cards for third-party frontends."
 *
 * Capabilities:
 * - Central showcase for financial publishers, Substack journalists, educators, and quant developers.
 * - Live interactive previews of 8 sovereign QuanterraOS embeddable widgets & SVG verification cards.
 * - 1-Click responsive HTML <iframe> and Markdown badge copy functionality.
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
    defaultWidth: "640px",
    defaultHeight: "380px",
    targetAudience: "Crypto technical analysts, microstructure traders, quant blogs.",
    keyFeatures: [
      "Settlement index vs spot exchange basis monitor",
      "60-second rolling TWAP reconstruction",
      "Sub-penny strike proximity alerts",
      "Constituent exchange weighting breakdown",
    ],
  },
  {
    id: "cross-venue-divergence",
    title: "Cross-Venue Basis & Divergence Monitor",
    category: "microstructure",
    categoryLabel: "Settlement & Microstructure",
    badgeText: "Multi-Venue",
    description: "Real-time price, spread, and net fee friction comparison between Kalshi (CFTC regulated) and Polymarket (Polygon on-chain UMA oracle) pricing identical windows.",
    embedUrl: "/embed/divergence",
    defaultWidth: "620px",
    defaultHeight: "380px",
    targetAudience: "Cross-platform traders, crypto researchers, web3 market commentators.",
    keyFeatures: [
      "Side-by-side contract pricing comparison",
      "Gas and on-chain friction vs Kalshi taker fees",
      "Resolution oracle divergence risk indicator",
      "Rule B5 $0.00 live exposure safeguard",
    ],
  },
  {
    id: "prospective-study",
    title: "Know Your Costs Pilot Study (#6.4)",
    category: "education",
    categoryLabel: "Education & Governance",
    badgeText: "Research Study",
    description: "Live telemetry card from the 100–300 opt-in user cohort tracking pre-trade awareness delta, friction checks, and objective outcome calibration.",
    embedUrl: "/embed/study",
    cardSvgUrl: "/api/study/card.svg",
    defaultWidth: "700px",
    defaultHeight: "450px",
    targetAudience: "Behavioral finance educators, university trading clubs, risk officers.",
    keyFeatures: [
      "Pre-trade fee awareness delta (+28.4%)",
      "6-stage target pilot funnel telemetry",
      "Anonymized participant decision telemetry",
      "Cryptographic 64-char SHA-256 provenance verification",
    ],
  },
  {
    id: "educator-portal",
    title: "Educator & Distribution Partner Roster",
    category: "education",
    categoryLabel: "Education & Governance",
    badgeText: "Partner Program",
    description: "Ethical distribution partner roster paying educators for verified risk literacy and retained subscribers — strictly prohibiting trading volume commissions.",
    embedUrl: "/embed/educators",
    cardSvgUrl: "/api/educators/card.svg",
    defaultWidth: "680px",
    defaultHeight: "440px",
    targetAudience: "Financial YouTube creators, Substack publishers, podcast hosts.",
    keyFeatures: [
      "Strict anti-volumetric commission policy",
      "Retention & literacy milestone compensation",
      "Live cohort capacity and active educator roster",
      "Rule B10 non-affiliation compliance standards",
    ],
  },
  {
    id: "realistic-paper",
    title: "Realistic Microstructure Paper Mode",
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
 * Renders the full interactive Widget & Embed Hub (/widgets, /embeds).
 */
export function renderWidgetCatalogHtml(): string {
  const widgets = WIDGET_CATALOG_LIST;
  const initialWidget = widgets[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <title>Embedded Widgets &amp; Distribution Cards — QuanterraOS</title>
  <meta name="description" content="Embeddable prediction market fee calculators, 2026 competitive benchmarks, settlement TWAP radars, and outcome transparency cards for publishers and educators.">
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
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .container { max-width: 1240px; margin: 0 auto; padding: 40px 24px 0; }

    .header-banner { margin-bottom: 32px; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      background: rgba(223, 184, 67, 0.1);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF; margin-bottom: 8px; }
    .subtitle { color: var(--text-dim); font-size: 0.95rem; max-width: 840px; line-height: 1.6; }

    /* Category Filter Pills */
    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .filter-pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.78rem;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-pill:hover, .filter-pill.active {
      background: rgba(223, 184, 67, 0.14);
      border-color: var(--accent);
      color: var(--accent-light);
    }

    /* Main Workspace Layout */
    .catalog-layout {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .catalog-layout { grid-template-columns: 1fr; }
    }

    /* Left Sidebar: Widget Cards Roster */
    .widget-roster {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .widget-item-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .widget-item-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .widget-item-card.selected {
      border-color: var(--accent);
      background: var(--card-elevated);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.3), 0 12px 30px rgba(223, 184, 67, 0.12);
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
      font-weight: 700;
      color: var(--accent);
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.25);
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .widget-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 4px;
    }
    .widget-summary {
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.45;
      margin-bottom: 10px;
    }
    .widget-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--muted);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 8px;
    }

    /* Right Preview & Code Inspector Panel */
    .preview-panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      position: sticky;
      top: 90px;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 14px;
    }
    .preview-title { font-size: 1.2rem; font-weight: 700; color: #FFFFFF; }
    .viewport-toggles {
      display: flex;
      gap: 6px;
    }
    .viewport-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .viewport-btn.active {
      background: var(--accent);
      color: #06070A;
      font-weight: 700;
      border-color: var(--accent);
    }

    /* Live Preview Frame Container */
    .iframe-wrapper {
      background: #040508;
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 6px;
      padding: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
      min-height: 420px;
      transition: all 0.2s ease;
    }
    .preview-iframe {
      width: 100%;
      height: 420px;
      border: none;
      border-radius: 4px;
      background: #06070A;
      transition: width 0.2s ease;
    }

    /* Code Box & Snippet Tabs */
    .snippet-section {
      background: rgba(6, 9, 14, 0.85);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 18px;
    }
    .snippet-tabs {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .tab-group { display: flex; gap: 8px; }
    .code-tab {
      background: none;
      border: none;
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      cursor: pointer;
      padding: 2px 6px;
      border-bottom: 2px solid transparent;
    }
    .code-tab.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
      font-weight: 600;
    }
    .copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      color: #07080B;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 4px;
      border: 1px solid rgba(255, 248, 220, 0.8);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .copy-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
    }
    .code-content {
      font-family: var(--font-mono);
      font-size: 0.76rem;
      color: #CBD5E1;
      background: rgba(0, 0, 0, 0.5);
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Links & Features Grid */
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
        <a href="/calculator">Check</a>
        <a href="/transparency">Transparency</a>
        <a href="/why">Why QuanterraOS</a>
        <a href="/study">Study #6.4</a>
        <a href="/educators">Educators</a>
        <a href="/widgets" class="active" style="color:var(--accent); font-weight:700;">Widgets</a>
        <a href="/radar">Radar</a>
        <a href="/journal">Journal</a>
        <a href="/learn">Curriculum</a>
      </div>
    </div>
    <div>
      <a href="/calculator" style="background:rgba(212,175,55,0.1); border:1px solid var(--border); color:var(--accent-light); font-family:var(--font-mono); font-size:0.75rem; padding:6px 14px; border-radius:4px; text-decoration:none;">
        Open Free Calc &rarr;
      </a>
    </div>
  </nav>

  <main class="container">
    <header class="header-banner">
      <div class="badge">Growth Strategy Sections 6.3 &amp; 6.5 &bull; Embed Hub</div>
      <h1>Distribution Cards &amp; Embeddable Widgets</h1>
      <p class="subtitle">
        Empower your readers with independent, real-time prediction market telemetry. Embed sovereign fee teardown calculators, 2026 competitive benchmarks, settlement TWAP radars, and outcome transparency audits directly into your Substack, blog, or quant terminal.
      </p>
    </header>

    <!-- Category Filter Bar -->
    <div class="filter-bar" id="filter-bar">
      <button class="filter-pill active" onclick="filterWidgets('all', this)" id="btn-filter-all">All Widgets (${widgets.length})</button>
      <button class="filter-pill" onclick="filterWidgets('friction', this)" id="btn-filter-friction">Friction &amp; Cost Auditing (3)</button>
      <button class="filter-pill" onclick="filterWidgets('microstructure', this)" id="btn-filter-microstructure">Settlement &amp; Microstructure (2)</button>
      <button class="filter-pill" onclick="filterWidgets('education', this)" id="btn-filter-education">Education &amp; Governance (3)</button>
    </div>

    <!-- Catalog Layout -->
    <div class="catalog-layout">
      <!-- Left Roster -->
      <div class="widget-roster" id="widget-roster">
        ${widgets.map((w, idx) => `
          <div class="widget-item-card ${idx === 0 ? "selected" : ""}" 
               data-id="${w.id}" 
               data-category="${w.category}" 
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
          <div class="viewport-toggles">
            <button class="viewport-btn active" onclick="setViewport('100%', this)" id="btn-vp-full">Full Width</button>
            <button class="viewport-btn" onclick="setViewport('640px', this)" id="btn-vp-tablet">Tablet</button>
            <button class="viewport-btn" onclick="setViewport('380px', this)" id="btn-vp-mobile">Mobile</button>
          </div>
        </div>

        <!-- Live Iframe Preview -->
        <div class="iframe-wrapper" id="iframe-wrapper">
          <iframe src="${initialWidget.embedUrl}" 
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
              <button class="code-tab" onclick="switchCodeTab('markdown', this)" id="tab-markdown">Markdown Badge</button>
              <button class="code-tab" onclick="switchCodeTab('direct', this)" id="tab-direct">Direct URL</button>
            </div>
            <button class="copy-btn" onclick="copySnippet()" id="btn-copy-snippet">
              <span id="copy-btn-text">Copy Code</span>
            </button>
          </div>
          <pre class="code-content" id="code-content">&lt;iframe src="https://quanterraos.com${initialWidget.embedUrl}" width="100%" height="${initialWidget.defaultHeight}" frameborder="0" style="border:1px solid rgba(212,175,55,0.22); border-radius:8px; overflow:hidden;"&gt;&lt;/iframe&gt;</pre>
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
      WIDGET_CATALOG_LIST.reduce((acc, w) => {
        acc[w.id] = w;
        return acc;
      }, {} as Record<string, WidgetDefinition>)
    )};

    let currentWidgetId = "${initialWidget.id}";
    let currentCodeFormat = "iframe";

    function selectWidget(id, cardEl) {
      currentWidgetId = id;
      const w = WIDGETS_MAP[id];
      if (!w) return;

      // Update card selection styling
      document.querySelectorAll('.widget-item-card').forEach(el => el.classList.remove('selected'));
      if (cardEl) cardEl.classList.add('selected');

      // Update right panel header & features
      document.getElementById('panel-title').textContent = w.title;
      document.getElementById('panel-audience').textContent = 'Audience: ' + w.targetAudience;

      // Update iframe source
      const iframe = document.getElementById('preview-iframe');
      iframe.src = w.embedUrl;
      iframe.title = w.title + ' Live Preview';

      // Update features list
      const featuresEl = document.getElementById('panel-features');
      featuresEl.innerHTML = w.keyFeatures.map(f => 
        '<div class="feature-item"><span class="feature-check">&#10003;</span><span>' + f + '</span></div>'
      ).join('');

      // Update direct links
      const linksContainer = document.getElementById('panel-direct-links');
      let linksHtml = '<span>Direct Endpoints:</span> <a href="' + w.embedUrl + '" target="_blank">Open Live Embed &nearr;</a>';
      if (w.cardSvgUrl) {
        linksHtml += ' <a href="' + w.cardSvgUrl + '" target="_blank">Download SVG Card &nearr;</a>';
      }
      if (w.exportCsvUrl) {
        linksHtml += ' <a href="' + w.exportCsvUrl + '" target="_blank">Download CSV Data &nearr;</a>';
      }
      linksContainer.innerHTML = linksHtml;

      // Refresh snippet
      updateCodeSnippet();
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
      if (currentCodeFormat === 'iframe') {
        codeBox.textContent = '<iframe src="https://quanterraos.com' + w.embedUrl + '" width="100%" height="' + w.defaultHeight + '" frameborder="0" style="border:1px solid rgba(212,175,55,0.22); border-radius:8px; overflow:hidden;"></iframe>';
      } else if (currentCodeFormat === 'markdown') {
        const svgUrl = w.cardSvgUrl ? 'https://quanterraos.com' + w.cardSvgUrl : 'https://quanterraos.com/api/benchmark/card.svg';
        codeBox.textContent = '[![QuanterraOS Audit](' + svgUrl + ')](https://quanterraos.com' + w.embedUrl + ')';
      } else if (currentCodeFormat === 'direct') {
        codeBox.textContent = 'https://quanterraos.com' + w.embedUrl;
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
      document.querySelectorAll('.viewport-btn').forEach(el => el.classList.remove('active'));
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
        if (cat === 'all' || cardCat === cat) {
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
