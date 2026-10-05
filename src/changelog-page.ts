/**
 * QuanterraOS Release Changelog Page (/changelog)
 * 
 * Spec: HANDOFF.md Section I
 * Architectural blueprint aesthetic:
 * Gold Standard palette (#06070A, #0C0F17, #DFB843, #F43F5E), Inter + IBM Plex Mono.
 */
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderChangelogPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Release Changelog — QuanterraOS</title>
  <meta name="description" content="Dated engineering releases, methodology changes, and audit history for QuanterraOS.">
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
      border-radius: 6px;
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

    .container { max-width: 900px; margin: 0 auto; padding: 48px 32px 0; }

    /* Header Eyebrow */
    .blueprint-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent-light);
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.15) 0%, rgba(163, 125, 36, 0.05) 100%);
      border: 1px solid rgba(223, 184, 67, 0.35);
      padding: 5px 12px;
      border-radius: 3px;
      margin-bottom: 16px;
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25);
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--text);
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

    /* Timeline Releases */
    .timeline {
      position: relative;
      padding-left: 28px;
      border-left: 1px solid var(--panel-border);
      margin-bottom: 48px;
    }
    .release-item {
      position: relative;
      margin-bottom: 36px;
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      padding: 24px;
    }
    .release-dot {
      position: absolute;
      left: -34px;
      top: 26px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid var(--bg);
    }
    .release-date {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 6px;
    }
    .release-version {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    .release-notes {
      font-size: 0.88rem;
      color: var(--muted);
      line-height: 1.65;
    }
    .release-notes ul {
      list-style: none;
    }
    .release-notes li {
      margin-bottom: 8px;
      padding-left: 18px;
      position: relative;
    }
    .release-notes li::before {
      content: "—";
      position: absolute;
      left: 0;
      color: var(--accent);
    }
    .release-notes strong { color: var(--text); }
    .release-notes code {
      font-family: var(--font-mono);
      font-size: 0.85em;
      background: rgba(232, 234, 237, 0.05);
      border: 1px solid var(--panel-border);
      padding: 1px 5px;
      border-radius: 2px;
      color: var(--accent);
    }

    footer {
      border-top: 1px solid var(--panel-border);
      padding-top: 24px;
      margin-top: 48px;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.6;
      font-family: var(--font-mono);
    }

    @media (max-width: 820px) {
      .top-nav { padding: 16px 20px; flex-direction: column; align-items: flex-start; gap: 12px; }
      .container { padding: 32px 20px 0; }
      h1 { font-size: 1.8rem; }
    }
  </style>
</head>
<body>
  <!-- Top Live Telemetry Ticker Strip -->
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>LIVE QUANTITATIVE CORE TELEMETRY</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SECTION: ENGINEERING CHANGELOG</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">AUDIT HORIZON: 1,316 SETTLED MARKETS</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SAFETY GATE: RULE B5 LOCKED ($0.00 CAPITAL)</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">RULE B4 GUARDRAIL: ACTIVE</span>
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
        <a href="/council">Council Terminal</a>
        <a href="/index">Composite Index</a>
        <a href="/spread">Spread Monitor</a>
        <a href="/status">System Status</a>
        <a href="/methodology">Methodology</a>
        <a href="/research" class="active">Research</a>
        <a href="/legal">Legal &amp; Terms</a>
      </div>
    </div>
    <div class="nav-right">
      <a href="/council" class="btn-outline">Launch Terminal →</a>
    </div>
  </nav>

  <main class="container">
    <div class="blueprint-eyebrow">
      <span class="pulse-dot"></span>
      <span>System Changelog · Release Provenance</span>
    </div>

    <h1>Release Changelog</h1>
    <p class="lead">
      Dated release history, methodology versions, and infrastructure improvements across QuanterraOS.
    </p>

    <div class="timeline">
      <div class="release-item">
        <div class="release-dot"></div>
        <div class="release-date">// 4 October 2026</div>
        <div class="release-version">v0.4.0 — Composite Index v0.1 &amp; Observability Infrastructure</div>
        <div class="release-notes">
          <ul>
            <li><strong>Quanterra BTC Composite v0.1:</strong> Implemented volume-weighted median spot index across Tier 1 US-accessible exchanges (Coinbase, Kraken, Bitstamp, Gemini).</li>
            <li><strong>Draco Quality Gate:</strong> Enforced sub-5s freshness and &plusmn;0.50% outlier filter with automated quorum suppression.</li>
            <li><strong>Production Endpoints:</strong> Shipped <code>GET /api/index/btc/latest</code> and <code>/api/index/btc/history</code> with Clerk plan gating.</li>
            <li><strong>Healthcheck &amp; Observability:</strong> Added robust <code>GET /healthz</code> endpoint with database ping and uptime tracking.</li>
            <li><strong>Falcon Pre-Registration:</strong> Committed formal hypothesis protocol in <code>docs/falcon-preregistration.md</code> and daily evaluation timer.</li>
            <li><strong>Truth &amp; Copy Guardrails:</strong> CI static analysis test suite enforcing Rule B4 against banned marketing superlatives.</li>
          </ul>
        </div>
      </div>

      <div class="release-item">
        <div class="release-dot"></div>
        <div class="release-date">// 3 October 2026</div>
        <div class="release-version">v0.3.0 — Flagship Calibration Proof &amp; Response Paper</div>
        <div class="release-notes">
          <ul>
            <li><strong>Flagship /calibration Proof Page:</strong> Shipped dynamic 10-bin SVG calibration curve and Brier score evaluation against coin-flip baseline.</li>
            <li><strong>Vanderbilt Debate Essay:</strong> Published <em>"Is Kalshi's BTC Market Actually Calibrated? We Checked."</em> analyzing 1,316 settled windows.</li>
            <li><strong>Truth Audit (Phase 0):</strong> Re-computed canonical 1,316-market backtest, confirming market mid beats structural fair-value model at all checkpoints.</li>
            <li><strong>Role Audit:</strong> Falcon designated as "Order-Book Depth Monitoring (research)" with n=31 underperformance disclosed.</li>
          </ul>
        </div>
      </div>

      <div class="release-item">
        <div class="release-dot"></div>
        <div class="release-date">// 30 September 2026</div>
        <div class="release-version">v0.1.0 — Foundation Engine &amp; Ingestion Architecture</div>
        <div class="release-notes">
          <ul>
            <li><strong>Multi-Asset Ticker Feed:</strong> Real-time WebSocket collection into SQLite storage layer with WAL mode.</li>
            <li><strong>Scoring Engine:</strong> Implemented Brier scoring, Murphy decomposition, and Wilson confidence intervals in <code>scoring.ts</code>.</li>
          </ul>
        </div>
      </div>
    </div>

    <footer>
      <p>
        Kalshi, CME Group, CF Benchmarks, Coinbase, Kraken, Bitstamp, and Gemini are trademarks of their respective owners. QuanterraOS is an independent measurement system. Rule B5 locked: zero live capital deployed.
      </p>
    </footer>
  </main>
${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
