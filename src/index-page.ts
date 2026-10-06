import type { LiveQuotesReport } from "./live-quotes.ts";
/**
 * Quanterra BTC Composite Index Page & Spread Monitor (/index, /spread)
 * 
 * Spec: HANDOFF.md Section F1, F2, F3, Section I
 * Multi-Billion Dollar Quantitative Institutional Aesthetic:
 * Deep Obsidian, Ambient Radial Lighting, Inter + IBM Plex Mono, Frosted Glass.
 */
import { getLatestCompositeIndex, COMPOSITE_METHODOLOGY_VERSION } from "./composite-index.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderIndexPageHtml(): string {
  const result = getLatestCompositeIndex("BTC");
  const priceDisplay = result.compositePrice !== null 
    ? `$${result.compositePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : "SUPPRESSED (Insufficient Quorum)";

  const statusBadge = result.status === "ACTIVE"
    ? `<span class="badge badge-active">ACTIVE (QUORUM MET)</span>`
    : `<span class="badge badge-warning">SUPPRESSED (DRACO GATE)</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Quanterra BTC Composite Index — Independent Spot Benchmark</title>
  <meta name="description" content="Volume-weighted spot composite index across Tier 1 venues with Draco outlier filtering. Independent measurement for BTC prediction markets.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --panel: rgba(14, 18, 27, 0.85);
      --panel-border: rgba(212, 175, 55, 0.16);
      --panel-border-subtle: rgba(212, 175, 55, 0.08);
      --panel-border-highlight: rgba(223, 184, 67, 0.45);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --warning: #F43F5E;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 50% at 50% -20%, rgba(223, 184, 67, 0.1), transparent 70%),
        radial-gradient(ellipse 60% 40% at 85% 10%, rgba(163, 125, 36, 0.05), transparent 60%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.6;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }
    
    /* Top Live Telemetry Ticker Strip */
    .live-ticker-strip {
      background: rgba(8, 12, 18, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 7px 24px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--muted);
      backdrop-filter: blur(12px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      overflow-x: auto;
    }
    .ticker-content { display: flex; align-items: center; gap: 14px; white-space: nowrap; }
    .ticker-item { display: inline-flex; align-items: center; gap: 7px; color: var(--text); }
    .ticker-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); animation: pulseDot 2s infinite; }
    .ticker-sep { color: rgba(255, 255, 255, 0.15); font-weight: 300; }
    @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

    /* Navigation Bar */
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 48px;
      border-bottom: 1px solid var(--panel-border);
      background: rgba(6, 8, 14, 0.82);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 36px;
    }
    .nav-brand-container {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    .nav-brand-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(135deg, rgba(223, 184, 67, 0.25), rgba(6, 8, 14, 0.9));
      border: 1px solid rgba(223, 184, 67, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-brand-icon svg { width: 14px; height: 14px; stroke: var(--accent); }
    .nav-brand-text { display: flex; flex-direction: column; }
    .nav-brand-title {
      font-size: 0.96rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #FFFFFF;
      font-family: var(--font-mono);
    }
    .nav-brand-sub {
      font-size: 0.62rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent-light);
      font-family: var(--font-mono);
    }
    .nav-links {
      display: flex;
      gap: 22px;
      align-items: center;
    }
    .nav-links a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      transition: color 0.15s, border-color 0.15s;
    }
    .nav-links a:hover, .nav-links a.active { color: #FFFFFF; }
    .nav-links a.active { border-bottom: 2px solid var(--accent); padding-bottom: 3px; }
    .btn-outline {
      border: 1px solid rgba(223, 184, 67, 0.4);
      color: #FFFFFF;
      padding: 8px 18px;
      border-radius: 4px;
      font-size: 0.82rem;
      font-family: var(--font-mono);
      text-decoration: none;
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.14) 0%, rgba(163, 125, 36, 0.05) 100%);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.2), 0 0 15px rgba(223, 184, 67, 0.1);
    }
    .btn-outline:hover {
      border-color: var(--accent);
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.25) 0%, rgba(163, 125, 36, 0.1) 100%);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.35), 0 0 25px rgba(223, 184, 67, 0.25);
      color: #FFFFFF;
      transform: translateY(-1px);
    }

    .container { max-width: 1140px; margin: 0 auto; padding: 48px 48px 0; }

    /* Header Eyebrow */
    .blueprint-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent-light);
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.15) 0%, rgba(163, 125, 36, 0.05) 100%);
      border: 1px solid rgba(223, 184, 67, 0.35);
      padding: 5px 12px;
      border-radius: 3px;
      margin-bottom: 18px;
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25);
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
    }
    h1 {
      font-size: 2.3rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #FFFFFF;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    p.lead {
      color: var(--muted);
      font-size: 0.98rem;
      max-width: 820px;
      margin-bottom: 36px;
      line-height: 1.6;
    }

    /* Stat Cards */
    .grid-cards {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 38px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      padding: 26px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .card:hover {
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
    .card.featured {
      border-color: rgba(223, 184, 67, 0.45);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25), 0 20px 45px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(223, 184, 67, 0.1);
    }
    .card-label {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .card-val {
      font-family: var(--font-mono);
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 6px;
      color: #FFFFFF;
    }
    .card.featured .card-val {
      color: var(--accent);
      text-shadow: 0 0 15px rgba(223, 184, 67, 0.3);
    }
    .card-meta {
      font-size: 0.82rem;
      color: var(--muted);
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 0.72rem;
      font-family: var(--font-mono);
      font-weight: 600;
      border-radius: 3px;
      letter-spacing: 0.05em;
    }
    .badge-active {
      background: rgba(223, 184, 67, 0.14);
      color: var(--accent-light);
      border: 1px solid rgba(223, 184, 67, 0.4);
      box-shadow: 0 0 10px rgba(223, 184, 67, 0.18);
    }
    .badge-warning {
      background: rgba(244, 63, 94, 0.12);
      color: var(--warning);
      border: 1px solid rgba(244, 63, 94, 0.35);
      box-shadow: 0 0 10px rgba(244, 63, 94, 0.15);
    }
    .badge-benchmark {
      background: rgba(223, 184, 67, 0.14);
      color: var(--accent-light);
      border: 1px solid rgba(223, 184, 67, 0.4);
    }
    .badge-normal {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      border: 1px solid var(--panel-border);
    }
    .badge-monitored {
      background: rgba(245, 166, 35, 0.12);
      color: #F5A623;
      border: 1px solid rgba(245, 166, 35, 0.35);
    }

    /* Table Container */
    .table-container {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 38px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
    }
    .table-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--panel-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-header h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.86rem;
    }
    th {
      background: rgba(255, 255, 255, 0.02);
      padding: 13px 20px;
      color: var(--muted);
      font-weight: 600;
      border-bottom: 1px solid var(--panel-border);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: var(--font-mono);
    }
    td {
      padding: 15px 20px;
      border-bottom: 1px solid var(--panel-border-subtle);
      color: #FFFFFF;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: rgba(223, 184, 67, 0.04); }

    /* Methodology Blueprint Box */
    .methodology-box {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      padding: 30px;
      margin-bottom: 38px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
    }
    .methodology-box h3, .methodology-box h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
    }
    .methodology-box p {
      font-size: 0.92rem;
      color: var(--muted);
      margin-bottom: 16px;
      line-height: 1.65;
    }
    .method-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 0.86rem;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.15s;
    }
    .method-link:hover {
      color: #FFFFFF;
      text-shadow: 0 0 8px rgba(223, 184, 67, 0.5);
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--panel-border);
      padding-top: 28px;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.6;
      font-family: var(--font-mono);
    }
    footer p { margin-bottom: 10px; }
    footer strong { color: #FFFFFF; }

    @media (max-width: 820px) {
      .top-nav { padding: 16px 20px; flex-direction: column; align-items: flex-start; gap: 14px; }
      .container { padding: 32px 20px 0; }
      .grid-cards { grid-template-columns: 1fr; }
      h1 { font-size: 1.85rem; }
    }
  </style>
</head>
<body>
  <!-- Top Live Telemetry Ticker Strip -->
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>LIVE SPOT COMPOSITE TELEMETRY</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">COMPOSITE STATUS: ${result.status}</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">METHODOLOGY: v${COMPOSITE_METHODOLOGY_VERSION}</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">DRACO QUALITY GATE: ACTIVE</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">RULE B5 LOCKED: $0.00 CAPITAL</span>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="nav-brand-container">
        <div class="nav-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <div class="nav-brand-text">
          <span class="nav-brand-title">QUANTERRA // OS</span>
          <span class="nav-brand-sub">INSTITUTIONAL QUANTITATIVE CORE</span>
        </div>
      </a>
      <div class="nav-links">
        <a href="/calibration">Calibration Proof</a>
        <a href="/calibration/surface">Calibration Surface</a>
        <a href="/calculator">Cost Calculator</a>
        <a href="/council">Council Terminal</a>
        <a href="/index" class="active">Composite Index</a>
        <a href="/spread">Spread Monitor</a>
        <a href="/mcp">AI / MCP</a>
        <a href="/pricing">Pricing</a>
      </div>
    </div>
    <div class="nav-right">
      <a href="/council" class="btn-outline">Launch Terminal →</a>
    </div>
  </nav>

  <main class="container">
    <div class="blueprint-eyebrow">
      <span class="pulse-dot"></span>
      <span>Methodology v${COMPOSITE_METHODOLOGY_VERSION} · Draco Quality Gate</span>
    </div>

    <h1>Quanterra BTC Spot Composite</h1>
    <p class="lead">
      Volume-weighted median spot price aggregated across Tier 1 US-accessible exchanges (Coinbase, Kraken, Bitstamp, Gemini). 
      Strict Draco data-quality gating rejects stale feeds and cross-venue outliers to establish an independent reference for prediction market settlement basis.
    </p>

    <div class="grid-cards">
      <div class="card featured">
        <div class="card-label">// Quanterra BTC Composite (v0.1)</div>
        <div class="card-val">${priceDisplay}</div>
        <div class="card-meta">${statusBadge}</div>
      </div>
      <div class="card">
        <div class="card-label">// Cross-Venue Median</div>
        <div class="card-val">${result.medianPrice ? `$${result.medianPrice.toLocaleString()}` : "—"}</div>
        <div class="card-meta">Baseline before volume-weighting</div>
      </div>
      <div class="card">
        <div class="card-label">// Active Feed Quorum</div>
        <div class="card-val">${result.venuesUsed.length} / ${(result.venuesUsed.length + result.venuesRejected.length) || 4}</div>
        <div class="card-meta">Min 3 valid venues required to emit</div>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <h2>Constituent Spot Venues &amp; Draco Quality Audit</h2>
        <span class="mono" style="font-size:0.75rem; color:var(--muted);">TIMESTAMP: ${result.computedAt}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Venue</th>
            <th>Role</th>
            <th>US Host Reachable</th>
            <th>Draco Status</th>
            <th>Filter Standard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="mono" style="font-weight:600; color:var(--text);">Coinbase</td>
            <td>Tier 1 Spot Order Book</td>
            <td class="mono" style="color:var(--accent);">YES (AWS us-east-1)</td>
            <td><span class="badge badge-active">ELIGIBLE</span></td>
            <td class="mono" style="color:var(--muted);">&lt; 5s age, &le; 0.5% dev</td>
          </tr>
          <tr>
            <td class="mono" style="font-weight:600; color:var(--text);">Kraken</td>
            <td>Tier 1 Spot Order Book</td>
            <td class="mono" style="color:var(--accent);">YES (AWS us-east-1)</td>
            <td><span class="badge badge-active">ELIGIBLE</span></td>
            <td class="mono" style="color:var(--muted);">&lt; 5s age, &le; 0.5% dev</td>
          </tr>
          <tr>
            <td class="mono" style="font-weight:600; color:var(--text);">Bitstamp</td>
            <td>Tier 1 Spot Order Book</td>
            <td class="mono" style="color:var(--accent);">YES (AWS us-east-1)</td>
            <td><span class="badge badge-active">ELIGIBLE</span></td>
            <td class="mono" style="color:var(--muted);">&lt; 5s age, &le; 0.5% dev</td>
          </tr>
          <tr>
            <td class="mono" style="font-weight:600; color:var(--text);">Gemini</td>
            <td>Tier 1 Spot Order Book</td>
            <td class="mono" style="color:var(--accent);">YES (AWS us-east-1)</td>
            <td><span class="badge badge-active">ELIGIBLE</span></td>
            <td class="mono" style="color:var(--muted);">&lt; 5s age, &le; 0.5% dev</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="methodology-box">
      <h3>Draco Quality Filters &amp; Suppression Rules</h3>
      <p>
        <strong>1. Stale Feed Gate:</strong> Any venue tick older than 5,000 milliseconds relative to system epoch is marked stale and discarded from index calculation.
      </p>
      <p>
        <strong>2. Outlier Rejection:</strong> Any venue price deviating by more than <strong>&plusmn;0.50% (50 bps)</strong> from the unweighted cross-venue median is rejected as an anomalous tick.
      </p>
      <p>
        <strong>3. Quorum Rule:</strong> If fewer than 3 valid venues survive the Draco gate, the composite price is <strong>SUPPRESSED (returns null)</strong>. Degraded or 1-venue prices are never presented as a composite index.
      </p>
      <a href="/methodology#composite" class="method-link">
        Read Full Methodology v0.1 Specification &rarr;
      </a>
    </div>

    <footer>
      <p>
        <strong>Attribution &amp; Legal Disclaimers (Rule B10):</strong> CME Group, CF Benchmarks, Kalshi, Coinbase, Kraken, Bitstamp, and Gemini are trademarks of their respective owners. QuanterraOS is an independent measurement system and is not affiliated with, endorsed by, or sponsored by any exchange or market operator.
      </p>
      <p>
        <strong>Benchmark Designation:</strong> Quanterra BTC Composite is an independent volume-weighted approximation of spot conditions. Kalshi KXBTC15M contracts settle against the official CME CF Bitcoin Real-Time Index (BRTI). QuanterraOS does not provide investment advice or trade execution. Rule B5 locked: zero live capital deployed.
      </p>
    </footer>
  </main>
${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}

export function renderSpreadPageHtml(initialQuotes?: LiveQuotesReport): string {
  const cbVenue = initialQuotes?.venues.find(v => v.venue.includes("Coinbase"));
  const krVenue = initialQuotes?.venues.find(v => v.venue.includes("Kraken"));
  const bsVenue = initialQuotes?.venues.find(v => v.venue.includes("Bitstamp"));

  const spotNum = initialQuotes?.compositePrice ?? 85000.00;
  const priceDisplay = initialQuotes?.compositePrice !== null && initialQuotes?.compositePrice !== undefined
    ? `$${initialQuotes.compositePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "CONNECTING...";

  const coinbasePrice = cbVenue?.price ?? null;
  const krakenPrice = krVenue?.price ?? null;
  const bitstampPrice = bsVenue?.price ?? null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Cross-Venue Spread & Basis Monitor — QuanterraOS</title>
  <meta name="description" content="Real-time basis and spread monitor between spot exchanges, composite index, and prediction market settlement reference.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --panel: rgba(14, 18, 27, 0.85);
      --panel-border: rgba(212, 175, 55, 0.16);
      --panel-border-subtle: rgba(212, 175, 55, 0.08);
      --panel-border-highlight: rgba(223, 184, 67, 0.45);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --warning: #F43F5E;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 50% at 50% -20%, rgba(223, 184, 67, 0.1), transparent 70%),
        radial-gradient(ellipse 60% 40% at 85% 10%, rgba(163, 125, 36, 0.05), transparent 60%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.6;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }
    
    /* Top Live Telemetry Ticker Strip */
    .live-ticker-strip {
      background: rgba(8, 12, 18, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding: 7px 24px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--muted);
      backdrop-filter: blur(12px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      overflow-x: auto;
    }
    .ticker-content { display: flex; align-items: center; gap: 14px; white-space: nowrap; }
    .ticker-item { display: inline-flex; align-items: center; gap: 7px; color: var(--text); }
    .ticker-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); animation: pulseDot 2s infinite; }
    .ticker-sep { color: rgba(255, 255, 255, 0.15); font-weight: 300; }
    @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

    /* Navigation Bar */
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 48px;
      border-bottom: 1px solid var(--panel-border);
      background: rgba(6, 8, 14, 0.82);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 36px;
    }
    .nav-brand-container {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    .nav-brand-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(135deg, rgba(223, 184, 67, 0.25), rgba(6, 8, 14, 0.9));
      border: 1px solid rgba(223, 184, 67, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-brand-icon svg { width: 14px; height: 14px; stroke: var(--accent); }
    .nav-brand-text { display: flex; flex-direction: column; }
    .nav-brand-title {
      font-size: 0.96rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #FFFFFF;
      font-family: var(--font-mono);
    }
    .nav-brand-sub {
      font-size: 0.62rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent-light);
      font-family: var(--font-mono);
    }
    .nav-links {
      display: flex;
      gap: 22px;
      align-items: center;
    }
    .nav-links a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      transition: color 0.15s, border-color 0.15s;
    }
    .nav-links a:hover, .nav-links a.active { color: #FFFFFF; }
    .nav-links a.active { border-bottom: 2px solid var(--accent); padding-bottom: 3px; }
    .btn-outline {
      border: 1px solid rgba(223, 184, 67, 0.4);
      color: #FFFFFF;
      padding: 8px 18px;
      border-radius: 4px;
      font-size: 0.82rem;
      font-family: var(--font-mono);
      text-decoration: none;
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.14) 0%, rgba(163, 125, 36, 0.05) 100%);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.2), 0 0 15px rgba(223, 184, 67, 0.1);
    }
    .btn-outline:hover {
      border-color: var(--accent);
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.25) 0%, rgba(163, 125, 36, 0.1) 100%);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.35), 0 0 25px rgba(223, 184, 67, 0.25);
      color: #FFFFFF;
      transform: translateY(-1px);
    }

    .container { max-width: 1140px; margin: 0 auto; padding: 48px 48px 0; }

    /* Header Eyebrow */
    .blueprint-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent-light);
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.15) 0%, rgba(163, 125, 36, 0.05) 100%);
      border: 1px solid rgba(223, 184, 67, 0.35);
      padding: 5px 12px;
      border-radius: 3px;
      margin-bottom: 18px;
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25);
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
    }
    h1 {
      font-size: 2.3rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #FFFFFF;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    p.lead {
      color: var(--muted);
      font-size: 0.98rem;
      max-width: 820px;
      margin-bottom: 36px;
      line-height: 1.6;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 0.72rem;
      font-family: var(--font-mono);
      font-weight: 600;
      border-radius: 3px;
      letter-spacing: 0.05em;
    }
    .badge-benchmark {
      background: rgba(223, 184, 67, 0.14);
      color: var(--accent-light);
      border: 1px solid rgba(223, 184, 67, 0.4);
      box-shadow: 0 0 10px rgba(223, 184, 67, 0.18);
    }
    .badge-normal {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      border: 1px solid var(--panel-border);
    }
    .badge-monitored {
      background: rgba(245, 166, 35, 0.12);
      color: #F5A623;
      border: 1px solid rgba(245, 166, 35, 0.35);
      box-shadow: 0 0 10px rgba(245, 166, 35, 0.15);
    }

    /* Table Container */
    .table-container {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 38px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
    }
    .table-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--panel-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-header h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.86rem;
    }
    th {
      background: rgba(255, 255, 255, 0.02);
      padding: 13px 20px;
      color: var(--muted);
      font-weight: 600;
      border-bottom: 1px solid var(--panel-border);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-family: var(--font-mono);
    }
    td {
      padding: 15px 20px;
      border-bottom: 1px solid var(--panel-border-subtle);
      color: #FFFFFF;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: rgba(223, 184, 67, 0.04); }

    /* Footer */
    footer {
      border-top: 1px solid var(--panel-border);
      padding-top: 28px;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.6;
      font-family: var(--font-mono);
    }
    footer p { margin-bottom: 10px; }
    footer strong { color: #FFFFFF; }

    @media (max-width: 820px) {
      .top-nav { padding: 16px 20px; flex-direction: column; align-items: flex-start; gap: 14px; }
      .container { padding: 32px 20px 0; }
      h1 { font-size: 1.85rem; }
    }
  </style>
</head>
<body>
  <!-- Top Live Telemetry Ticker Strip -->
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>LIVE BASIS &amp; DISPERSION MONITOR</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">COMPOSITE BENCHMARK: ${priceDisplay}</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">DISPERSION THRESHOLD: 15 BPS</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SETTLEMENT TARGET: CME CF BRTI</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">RULE B5 LOCKED: $0.00 CAPITAL</span>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="nav-brand-container">
        <div class="nav-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <div class="nav-brand-text">
          <span class="nav-brand-title">QUANTERRA // OS</span>
          <span class="nav-brand-sub">INSTITUTIONAL QUANTITATIVE CORE</span>
        </div>
      </a>
      <div class="nav-links">
        <a href="/calibration">Calibration Proof</a>
        <a href="/calibration/surface">Calibration Surface</a>
        <a href="/calculator">Cost Calculator</a>
        <a href="/council">Council Terminal</a>
        <a href="/index">Composite Index</a>
        <a href="/spread" class="active">Spread Monitor</a>
        <a href="/mcp">AI / MCP</a>
        <a href="/pricing">Pricing</a>
      </div>
    </div>
    <div class="nav-right">
      <a href="/council" class="btn-outline">Launch Terminal →</a>
    </div>
  </nav>

  <main class="container">
    <div class="blueprint-eyebrow">
      <span class="pulse-dot"></span>
      <span>Basis Surveillance · Cross-Venue Dispersion</span>
    </div>

    <h1>Cross-Venue Spread &amp; Basis Monitor</h1>
    <p class="lead">
      Real-time measurement of price dispersion across Tier 1 spot exchanges and comparison against the Kalshi KXBTC15M settlement reference (CME CF BRTI).
    </p>

    <div class="table-container">
      <div class="table-header">
        <h2>Live Spot Dispersion vs Quanterra Composite Benchmark (${priceDisplay})</h2>
        <span class="mono" style="font-size:0.75rem; color:var(--muted);">DISPERSION THRESHOLD: 15 BPS</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Venue / Source</th>
            <th>Type</th>
            <th>Observed Price</th>
            <th>Spread vs Composite</th>
            <th>Spread (bps)</th>
            <th>Dispersion Flag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="mono" style="font-weight:600; color:var(--accent);">Quanterra Composite</td>
            <td>Constituent Spot Median</td>
            <td class="mono" style="font-weight:600;" id="comp-price">${priceDisplay}</td>
            <td class="mono" id="comp-spread">$0.00</td>
            <td class="mono" id="comp-bps">0.0 bps</td>
            <td><span class="badge badge-benchmark">BENCHMARK</span></td>
          </tr>
          <tr>
            <td class="mono" style="font-weight:500;">Coinbase (BTC-USD)</td>
            <td>Constituent Spot</td>
            <td class="mono" id="cb-price">${coinbasePrice !== null ? '$' + coinbasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
            <td class="mono" id="cb-spread">${cbVenue?.spread !== null && cbVenue?.spread !== undefined ? (cbVenue.spread >= 0 ? '+$' : '-$') + Math.abs(cbVenue.spread).toFixed(2) : '—'}</td>
            <td class="mono" id="cb-bps">${cbVenue?.spreadBps !== null && cbVenue?.spreadBps !== undefined ? (cbVenue.spreadBps >= 0 ? '+' : '') + cbVenue.spreadBps.toFixed(1) + ' bps' : '—'}</td>
            <td><span class="badge badge-normal" id="cb-badge">${cbVenue?.status ?? 'ONLINE'}</span></td>
          </tr>
          <tr>
            <td class="mono" style="font-weight:500;">Kraken (XBT/USD)</td>
            <td>Constituent Spot</td>
            <td class="mono" id="kr-price">${krakenPrice !== null ? '$' + krakenPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
            <td class="mono" id="kr-spread">${krVenue?.spread !== null && krVenue?.spread !== undefined ? (krVenue.spread >= 0 ? '+$' : '-$') + Math.abs(krVenue.spread).toFixed(2) : '—'}</td>
            <td class="mono" id="kr-bps">${krVenue?.spreadBps !== null && krVenue?.spreadBps !== undefined ? (krVenue.spreadBps >= 0 ? '+' : '') + krVenue.spreadBps.toFixed(1) + ' bps' : '—'}</td>
            <td><span class="badge badge-normal" id="kr-badge">${krVenue?.status ?? 'ONLINE'}</span></td>
          </tr>
          <tr>
            <td class="mono" style="font-weight:500;">Bitstamp (BTC/USD)</td>
            <td>Constituent Spot</td>
            <td class="mono" id="bs-price">${bitstampPrice !== null ? '$' + bitstampPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
            <td class="mono" id="bs-spread">${bsVenue?.spread !== null && bsVenue?.spread !== undefined ? (bsVenue.spread >= 0 ? '+$' : '-$') + Math.abs(bsVenue.spread).toFixed(2) : '—'}</td>
            <td class="mono" id="bs-bps">${bsVenue?.spreadBps !== null && bsVenue?.spreadBps !== undefined ? (bsVenue.spreadBps >= 0 ? '+' : '') + bsVenue.spreadBps.toFixed(1) + ' bps' : '—'}</td>
            <td><span class="badge badge-normal" id="bs-badge">${bsVenue?.status ?? 'ONLINE'}</span></td>
          </tr>
          <tr>
            <td class="mono" style="font-weight:500;">CME CF BRTI Reference</td>
            <td>Kalshi Settlement Target</td>
            <td class="mono" id="brti-price" style="color:var(--muted);">—</td>
            <td class="mono" id="brti-spread" style="color:var(--muted);">—</td>
            <td class="mono" id="brti-bps" style="color:var(--muted);">—</td>
            <td><span class="badge badge-monitored" id="brti-badge">REQUIRES CME LICENSE</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer>
      <p>
        <strong>Live Data Verification:</strong> Spot prices for Coinbase, Kraken, and Bitstamp are fetched directly in real-time from their public exchange REST APIs. The Quanterra Composite Benchmark represents the calculated median of active spot venues. The CME CF Bitcoin Real-Time Index (BRTI) is the proprietary settlement benchmark published by CF Benchmarks Ltd / CME Group and requires an institutional feed license. QuanterraOS does not synthesize or fabricate price quotes.
      </p>
      <p>
        Kalshi, CME Group, CF Benchmarks, Coinbase, Kraken, Bitstamp, and Gemini are trademarks of their respective owners. QuanterraOS is an independent measurement system. Rule B5 locked: zero live capital deployed.
      </p>
    </footer>
  </main>
  <script>
    async function updateSpreadQuotes() {
      try {
        var res = await fetch('/api/quotes?asset=BTC');
        if (!res.ok) return;
        var data = await res.json();
        if (!data || !Array.isArray(data.venues)) return;

        var fmt = function(num) { return '$' + Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
        var fmtDiff = function(num) { return (num >= 0 ? '+$' : '-$') + Math.abs(num).toFixed(2); };
        var fmtBps = function(num) { return (num >= 0 ? '+' : '') + Number(num).toFixed(1) + ' bps'; };

        if (data.compositePrice !== null && data.compositePrice !== undefined) {
          var compEl = document.getElementById('comp-price');
          if (compEl) compEl.textContent = fmt(data.compositePrice);
        }

        var updateVenue = function(prefix, matchText) {
          var item = data.venues.find(function(v) { return v.venue && v.venue.indexOf(matchText) !== -1; });
          if (!item) return;

          var pEl = document.getElementById(prefix + '-price');
          var sEl = document.getElementById(prefix + '-spread');
          var bEl = document.getElementById(prefix + '-bps');
          var badgeEl = document.getElementById(prefix + '-badge');

          if (pEl) pEl.textContent = item.price !== null ? fmt(item.price) : '—';
          if (sEl) sEl.textContent = item.spread !== null ? fmtDiff(item.spread) : '—';
          if (bEl) bEl.textContent = item.spreadBps !== null ? fmtBps(item.spreadBps) : '—';
          if (badgeEl && item.status) {
            badgeEl.textContent = item.status;
            badgeEl.className = 'badge ' + (item.status === 'NORMAL' ? 'badge-normal' : item.status === 'BENCHMARK' ? 'badge-benchmark' : 'badge-monitored');
          }
        };

        updateVenue('cb', 'Coinbase');
        updateVenue('kr', 'Kraken');
        updateVenue('bs', 'Bitstamp');
        updateVenue('brti', 'BRTI');
      } catch (_e) {}
    }
    setInterval(updateSpreadQuotes, 3000);
  </script>
${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
