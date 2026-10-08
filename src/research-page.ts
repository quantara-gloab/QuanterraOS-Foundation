/**
 * QuanterraOS Research Hub (/research)
 * 
 * Spec: HANDOFF.md Section I
 * All published findings, empirical backtests, and negative results.
 * Also hosts the Sovereign Agent Architecture and Eight Council Specialists
 * moved from the consumer homepage.
 */
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { getCouncilAgentsData } from "./agents/council-data.ts";
import { renderSpecialistIcon, SPECIALIST_ICONS_CSS } from "./specialist-icons.ts";

export function renderResearchPageHtml(): string {
  const councilAgents = getCouncilAgentsData();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Research, Sovereign Architecture &amp; Empirical Findings — QuanterraOS</title>
  <meta name="description" content="Published research papers, backtest results, negative findings, and 3-layer sovereign agent architecture on short-duration BTC prediction markets.">
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
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-left { display: flex; align-items: center; gap: 36px; }
    .nav-brand-container { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .nav-brand-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(135deg, rgba(223, 184, 67, 0.2), rgba(6, 8, 14, 0.9));
      border: 1px solid rgba(223, 184, 67, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-brand-icon svg { width: 14px; height: 14px; stroke: var(--accent); }
    .nav-brand-text { display: flex; flex-direction: column; }
    .nav-brand-title { font-size: 0.96rem; font-weight: 700; letter-spacing: 0.02em; color: #FFFFFF; font-family: var(--font-mono); }
    .nav-brand-sub { font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); font-family: var(--font-mono); }
    .nav-links { display: flex; gap: 22px; align-items: center; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: color 0.15s; }
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
      background: rgba(223, 184, 67, 0.08);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-outline:hover {
      border-color: var(--accent);
      background: rgba(223, 184, 67, 0.18);
      color: #FFFFFF;
    }

    .container { max-width: 1040px; margin: 0 auto; padding: 48px 32px 0; }

    /* Header Eyebrow */
    .blueprint-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent);
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.2);
      padding: 4px 10px;
      border-radius: 2px;
      margin-bottom: 16px;
    }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
    h1 { font-size: 2.2rem; font-weight: 600; letter-spacing: -0.02em; color: var(--text); margin-bottom: 12px; line-height: 1.2; }
    p.lead { color: var(--muted); font-size: 0.98rem; max-width: 820px; margin-bottom: 36px; line-height: 1.6; }

    /* Paper Cards */
    .paper-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      padding: 28px;
      margin-bottom: 20px;
      transition: border-color 0.15s;
    }
    .paper-card:hover { border-color: rgba(223, 184, 67, 0.3); }
    .paper-meta { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; font-family: var(--font-mono); }
    .paper-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 12px; color: var(--text); text-decoration: none; display: block; letter-spacing: -0.01em; }
    .paper-title:hover { color: var(--accent); }
    .paper-summary { font-size: 0.9rem; color: var(--muted); margin-bottom: 20px; line-height: 1.65; }
    .paper-tags-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .paper-tag { display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 3px 8px; border-radius: 2px; font-family: var(--font-mono); letter-spacing: 0.05em; }
    .tag-negative { background: rgba(198, 93, 74, 0.1); color: var(--warning); border: 1px solid rgba(198, 93, 74, 0.3); }
    .tag-calibration { background: rgba(223, 184, 67, 0.1); color: var(--accent); border: 1px solid rgba(223, 184, 67, 0.3); }
    .tag-research { background: rgba(232, 234, 237, 0.05); color: var(--muted); border: 1px solid var(--panel-border); }
    .read-paper-link { color: var(--accent); font-size: 0.82rem; text-decoration: none; font-weight: 500; font-family: var(--font-mono); margin-left: auto; display: inline-flex; align-items: center; gap: 4px; }
    .read-paper-link:hover { text-decoration: underline; }

    /* Specialist Grid */
    .specialist-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    @media (max-width: 1080px) { .specialist-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .specialist-grid { grid-template-columns: 1fr; } }

    .spec-card {
      border: 1px solid rgba(212, 175, 55, 0.16);
      background: linear-gradient(180deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 19, 0.9) 100%);
      box-shadow: inset 0 1px 0 0 rgba(255, 245, 215, 0.12), 0 12px 30px -10px rgba(0, 0, 0, 0.6);
      border-radius: 6px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 18px;
      text-align: left;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }
    .spec-card:hover {
      border-color: rgba(223, 184, 67, 0.45);
      transform: translateY(-2px);
    }
    .spec-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .spec-icon-box {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(223, 184, 67, 0.05);
      border: 1px solid rgba(223, 184, 67, 0.2);
      border-radius: 6px;
      flex-shrink: 0;
    }
    .spec-header-text { flex: 1; min-width: 0; }
    .spec-name-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
    .spec-name { font-size: 0.95rem; font-weight: 700; color: #FFFFFF; }
    .spec-badge { font-family: var(--font-mono); font-size: 0.65rem; padding: 2px 6px; border-radius: 3px; }
    .spec-badge.accent { color: var(--accent); background: rgba(223, 184, 67, 0.12); border: 1px solid rgba(223, 184, 67, 0.35); }
    .spec-badge.warning { color: var(--warning); background: rgba(198, 93, 74, 0.1); border: 1px solid rgba(198, 93, 74, 0.25); }
    .spec-badge.muted { color: var(--muted); background: rgba(255, 255, 255, 0.05); border: 1px solid var(--panel-border); }
    .spec-role { font-size: 0.75rem; color: var(--muted); }
    .spec-metric-row { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--panel-border); padding-top: 10px; margin-bottom: 8px; }
    .spec-large-number { font-family: var(--font-mono); font-size: 1.35rem; font-weight: 700; }
    .spec-large-number.accent { color: var(--accent); }
    .spec-large-number.warning { color: var(--warning); }
    .spec-large-number.muted { color: var(--muted); }
    .spec-detail { font-size: 0.8rem; color: var(--muted); line-height: 1.45; }
    .spec-actions { display: flex; justify-content: space-between; border-top: 1px solid var(--panel-border); padding-top: 12px; margin-top: 8px; }
    .spec-link-btn { color: var(--muted); background: none; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 0.72rem; transition: color 0.15s; }
    .spec-link-btn:hover { color: var(--accent); }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
      display: none; align-items: center; justify-content: center; z-index: 500; padding: 20px;
    }
    .modal-backdrop.open { display: flex; }
    .modal-dialog {
      background: #0C1018; border: 1px solid rgba(223, 184, 67, 0.35); border-radius: 8px;
      max-width: 620px; width: 100%; box-shadow: 0 25px 60px rgba(0,0,0,0.9); overflow: hidden;
    }
    .modal-header {
      padding: 18px 24px; border-bottom: 1px solid rgba(212, 175, 55, 0.15);
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .modal-title { font-size: 1.1rem; font-weight: 700; color: #FFFFFF; }
    .modal-close-btn { background: none; border: none; color: var(--muted); font-size: 1.4rem; cursor: pointer; }
    .modal-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2); }
    .modal-tab-btn {
      padding: 10px 18px; font-family: var(--font-mono); font-size: 0.78rem; background: none;
      border: none; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent;
    }
    .modal-tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
    .modal-body { padding: 22px 24px; max-height: 480px; overflow-y: auto; }
    .telemetry-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-family: var(--font-mono); font-size: 0.8rem; }
    .telemetry-item-key { color: var(--muted); }
    .telemetry-item-val { color: var(--text); font-weight: 600; }
    .modal-chat-form { display: flex; gap: 8px; margin-top: 10px; }
    .modal-chat-input {
      flex: 1; background: #06080E; border: 1px solid rgba(212, 175, 55, 0.2); color: #fff;
      padding: 8px 12px; font-family: var(--font-mono); font-size: 0.8rem; border-radius: 4px; outline: none;
    }
    .modal-chat-send {
      padding: 8px 16px; background: linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%);
      color: #06070A; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 0.78rem;
    }

    ${SPECIALIST_ICONS_CSS}

    footer {
      border-top: 1px solid var(--panel-border);
      padding-top: 24px;
      margin-top: 40px;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.6;
      font-family: var(--font-mono);
    }
  </style>
</head>
<body>
  <!-- Top Live Telemetry Ticker Strip -->
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>LIVE QUANTITATIVE CORE TELEMETRY</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SECTION: RESEARCH &amp; FINDINGS</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">AUDIT HORIZON: 1,316 SETTLED MARKETS</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SAFETY GATE: RULE B5 LOCKED ($0.00 CAPITAL)</span>
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
        <a href="/calculator">Check</a>
        <a href="/journal">Journal</a>
        <a href="/learn">Learn</a>
        <a href="/research" class="active">Research</a>
        <a href="/access">Institutional</a>
      </div>
    </div>
    <div class="nav-right">
      <a href="/council" class="btn-outline">Launch Terminal &rarr;</a>
    </div>
  </nav>

  <main class="container">
    <div class="blueprint-eyebrow">
      <span class="pulse-dot"></span>
      <span>Empirical Research Archive · Reproducible Standards</span>
    </div>

    <h1>Empirical Research &amp; Findings</h1>
    <p class="lead">
      We publish full backtest reports, data corpora, and negative findings. Losing to the market is a scientific finding we display, not hide.
    </p>

    <!-- Published Papers -->
    <div class="paper-card" style="border-color: rgba(223, 184, 67, 0.45); background: linear-gradient(180deg, rgba(20, 26, 38, 0.85) 0%, rgba(12, 15, 23, 0.95) 100%);">
      <div class="paper-meta">// Research Paper · 4 October 2026 · Featured</div>
      <a href="/research/two-strategies-lost" class="paper-title" style="color: var(--accent);">We tested two trading strategies against the market. Both lost.</a>
      <p class="paper-summary">
        Most trading products lead with their best quarter. We're leading with a negative result, because it's real, and a positive-sounding version wouldn't be. An empirical examination of momentum and fade heuristics across 131 conditioned price-swing events on Kalshi 15-minute BTC prediction markets.
      </p>
      <div class="paper-tags-row">
        <span class="paper-tag tag-negative">EMPIRICAL LOSS AUDIT</span>
        <span class="paper-tag tag-calibration">SWING EVENTS n=131</span>
        <a href="/research/two-strategies-lost" class="read-paper-link">Read Full Post &rarr;</a>
      </div>
    </div>

    <div class="paper-card" style="border-color: rgba(223, 184, 67, 0.35); background: linear-gradient(180deg, rgba(20, 26, 38, 0.85) 0%, rgba(12, 15, 23, 0.95) 100%);">
      <div class="paper-meta">// Research Paper · 7 October 2026 · Frequency &amp; Vibration</div>
      <a href="/research/market-rhythm" class="paper-title" style="color: var(--accent);">Market Rhythm: Fourier Frequency Analysis, Welch’s PSD &amp; Fee-Adjusted Baselines</a>
      <p class="paper-summary">
        An empirical examination of cyclical oscillation in short-duration BTC prediction markets using Welch’s Power Spectral Density method. While spectral decomposition measures historical frequency concentration, walk-forward testing confirms cyclical patterns do not produce exploitable trading alpha after Kalshi exchange taker fees (1.80¢/ct).
      </p>
      <div class="paper-tags-row">
        <span class="paper-tag tag-negative">NEGATIVE RESULT</span>
        <span class="paper-tag tag-research">FOURIER &amp; WELCH PSD</span>
        <span class="paper-tag tag-calibration">FEE-ADJUSTED</span>
        <a href="/research/market-rhythm" class="read-paper-link">Read Full Paper &rarr;</a>
      </div>
    </div>

    <div class="paper-card">
      <div class="paper-meta">// Working Paper · 4 October 2026</div>
      <a href="/research/kalshi-calibration-response" class="paper-title">Is Kalshi's BTC Market Actually Calibrated? We Checked.</a>
      <p class="paper-summary">
        An empirical audit of 1,316 consecutive settled 15-minute BTC contracts (19,740 1-minute candles) resolving against the CME CF Bitcoin Real-Time Index (BRTI). Demonstrates that Kalshi market entry prices achieve a 0.2001 Brier score, tracking the 45° calibration line across all 10 deciles.
      </p>
      <div class="paper-tags-row">
        <span class="paper-tag tag-calibration">CALIBRATION AUDIT</span>
        <span class="paper-tag tag-research">CORPUS n=1,316</span>
        <a href="/research/kalshi-calibration-response" class="read-paper-link">Read Full Paper &rarr;</a>
      </div>
    </div>

    <!-- 3-Layer Sovereign Architecture Section (Moved from Consumer Homepage) -->
    <section id="architecture" style="margin-top: 56px; border-top: 1px solid var(--panel-border); padding-top: 40px;">
      <div class="blueprint-eyebrow">
        <span class="pulse-dot"></span>
        <span>Sovereign Machine Architecture</span>
      </div>
      <h2 style="font-size: 1.8rem; font-weight: 700; color: #FFFFFF; margin-bottom: 8px;">The 3-Layer Sovereign AI Governance Stack</h2>
      <p style="color: var(--muted); font-size: 0.95rem; max-width: 820px; margin-bottom: 28px;">
        Engineered for institutional desks, prop firms, and autonomous agent swarms requiring deterministic settlement verification, transaction friction accounting, and air-gapped readiness.
      </p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <!-- Layer 1 -->
        <div style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 6px; padding: 24px; display: flex; flex-direction: column;">
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">LAYER 1 // FOUNDATION</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF; margin-bottom: 10px;">Intelligence Spine</h3>
          <p style="font-size: 0.86rem; color: var(--muted); line-height: 1.6; margin-bottom: 16px; flex-grow: 1;">
            Deterministic multi-venue ingestion, order-book L2 microstructure, and settlement target verification.
          </p>
          <ul style="list-style: none; font-family: var(--font-mono); font-size: 0.76rem; color: #CBD5E1; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--panel-border-subtle); padding-top: 14px;">
            <li><span style="color:var(--accent);">▸</span> Spot Dispersion &amp; Settlement Basis Engine</li>
            <li><span style="color:var(--accent);">▸</span> Composite Spot Index (Coinbase, Kraken, Bitstamp)</li>
            <li><span style="color:var(--accent);">▸</span> 19,740 Audited Minute Candles (1,316 Windows)</li>
            <li><span style="color:var(--accent);">▸</span> Minute-by-Minute (1–14) Calibration Surface</li>
          </ul>
        </div>

        <!-- Layer 2 -->
        <div style="background: linear-gradient(180deg, rgba(20, 26, 40, 0.9) 0%, rgba(13, 17, 26, 0.95) 100%); border: 1px solid rgba(223, 184, 67, 0.45); border-radius: 6px; padding: 24px; display: flex; flex-direction: column;">
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-light); margin-bottom: 8px; text-transform: uppercase;">LAYER 2 // GOVERNANCE</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF; margin-bottom: 10px;">Trust &amp; Control Plane</h3>
          <p style="font-size: 0.86rem; color: var(--muted); line-height: 1.6; margin-bottom: 16px; flex-grow: 1;">
            Model Context Protocol (MCP) server, 8-agent council audit trails, and strict mathematical circuit breakers.
          </p>
          <ul style="list-style: none; font-family: var(--font-mono); font-size: 0.76rem; color: #CBD5E1; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--panel-border-subtle); padding-top: 14px;">
            <li><span style="color:var(--accent);">▸</span> Model Context Protocol (MCP) Live Tools</li>
            <li><span style="color:var(--accent);">▸</span> Agent-to-Agent (A2A) Telemetry Handshake</li>
            <li><span style="color:var(--accent);">▸</span> Rule B5 Permanent Circuit Lock ($0.00 Capital)</li>
            <li><span style="color:var(--accent);">▸</span> Decile Reliability with 95% Wilson CIs</li>
          </ul>
        </div>

        <!-- Layer 3 -->
        <div style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 6px; padding: 24px; display: flex; flex-direction: column;">
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent); margin-bottom: 8px; text-transform: uppercase;">LAYER 3 // WORKFLOW</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF; margin-bottom: 10px;">Execution Mesh</h3>
          <p style="font-size: 0.86rem; color: var(--muted); line-height: 1.6; margin-bottom: 16px; flex-grow: 1;">
            Friction-aware expectancy modeling, transaction cost analysis, and private container deployments.
          </p>
          <ul style="list-style: none; font-family: var(--font-mono); font-size: 0.76rem; color: #CBD5E1; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--panel-border-subtle); padding-top: 14px;">
            <li><span style="color:var(--accent);">▸</span> True Cost &amp; Net Expected Value (EV) Engine</li>
            <li><span style="color:var(--accent);">▸</span> Kalshi Variable Taker Fee Drag ($0.07×P×(1-P))</li>
            <li><span style="color:var(--accent);">▸</span> Cross-Venue Basis Surveillance (Kalshi vs Poly)</li>
            <li><span style="color:var(--accent);">▸</span> Sovereign On-Prem / Air-Gapped Readiness</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- The Eight Council Specialists Section (Moved from Consumer Homepage) -->
    <section id="specialists" style="margin-top: 56px; border-top: 1px solid var(--panel-border); padding-top: 40px;">
      <div class="blueprint-eyebrow">
        <span class="pulse-dot"></span>
        <span>Machine Intelligence Specialists</span>
      </div>
      <h2 style="font-size: 1.8rem; font-weight: 700; color: #FFFFFF; margin-bottom: 8px;">The Eight Council Specialists</h2>
      <p style="color: var(--muted); font-size: 0.95rem; max-width: 820px; margin-bottom: 28px;">
        Each specialist monitors, verifies, or audits a distinct layer of market microstructure. We publish real metrics, including out-of-sample underperformance, adhering to absolute transparency.
      </p>

      <div class="specialist-grid">
        <!-- 1. Falcon -->
        <div class="spec-card" onclick="openSpecialistModal('falcon')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('falcon')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row"><span class="spec-name">Falcon</span><span class="spec-badge warning">research</span></div>
                <div class="spec-role">Order-book depth monitoring</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number warning">0.2736</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">out-of-sample Brier (n=31)</div>
            </div>
            <div class="spec-detail">Underperforms both 50/50 baseline (0.2500) and entry-price (0.2106). Strict research designation.</div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('falcon', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('falcon', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 2. Quantum Fox -->
        <div class="spec-card" onclick="openSpecialistModal('quantum-fox')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('quantum-fox')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row"><span class="spec-name">Quantum Fox</span><span class="spec-badge accent">baseline</span></div>
                <div class="spec-role">Market baseline validation</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number accent">0.2001</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">market-mid Brier (n=1,316)</div>
            </div>
            <div class="spec-detail">Audits minute-4 mid-price against fair-value model. Market mid beat our model across all checkpoints.</div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('quantum-fox', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('quantum-fox', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 3. Phoenix -->
        <div class="spec-card" onclick="openSpecialistModal('phoenix')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('phoenix')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row"><span class="spec-name">Phoenix</span><span class="spec-badge warning">locked</span></div>
                <div class="spec-role">Execution circuit breaker</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number warning">$0.00</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">live capital deployed</div>
            </div>
            <div class="spec-detail">Rule B5 locked. Standby mode enforced. Zero automated orders permitted until statistical edge is proven.</div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('phoenix', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('phoenix', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 4. Draco -->
        <div class="spec-card" onclick="openSpecialistModal('draco')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('draco')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row"><span class="spec-name">Draco</span><span class="spec-badge accent">verified</span></div>
                <div class="spec-role">Data integrity &amp; quality gate</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number accent">19,740</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">audited candle rows</div>
            </div>
            <div class="spec-detail">Verifies zero corrupted timestamps across 1,316 settled windows. Rejects lookahead and stale data.</div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('draco', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('draco', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 5. Sentinel -->
        <div class="spec-card" onclick="openSpecialistModal('sentinel')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('sentinel')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row"><span class="spec-name">Sentinel</span><span class="spec-badge muted">nominal</span></div>
                <div class="spec-role">Calibration drift surveillance</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number muted">0 alerts</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">continuous surveillance</div>
            </div>
            <div class="spec-detail">Surveils upstream pipeline stages and monitors drift against recorded baselines.</div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('sentinel', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('sentinel', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 6. Wolf -->
        <div class="spec-card" onclick="openSpecialistModal('wolf')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('wolf')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row"><span class="spec-name">Wolf</span><span class="spec-badge accent">tracking</span></div>
                <div class="spec-role">Order-book dynamics</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number accent">+0.0350</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">queue depth imbalance</div>
            </div>
            <div class="spec-detail">Evaluates L2 order-book snapshots from SQLite, tracking spread compression and queue imbalance.</div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('wolf', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('wolf', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 7. Kraken -->
        <div class="spec-card" onclick="openSpecialistModal('kraken')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('kraken')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row"><span class="spec-name">Kraken</span><span class="spec-badge warning">locked</span></div>
                <div class="spec-role">Risk governance &amp; spot basis</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number warning">$0.00</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">authorized exposure</div>
            </div>
            <div class="spec-detail">Enforces zero live capital exposure under Rule B5 while monitoring spot dispersion and basis divergence.</div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('kraken', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('kraken', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 8. Lion -->
        <div class="spec-card" onclick="openSpecialistModal('lion')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('lion')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row"><span class="spec-name">Lion</span><span class="spec-badge accent">consensus</span></div>
                <div class="spec-role">Consensus synthesis</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number accent">10 bins</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">decile verification</div>
            </div>
            <div class="spec-detail">Synthesizes multi-specialist calibration evidence and certifies the single source of truth verdict.</div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('lion', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('lion', 'chat');">query specialist</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Specialist Inspection Modal -->
    <div class="modal-backdrop" id="specialist-modal-backdrop" aria-hidden="true" role="dialog">
      <div class="modal-dialog">
        <div class="modal-header">
          <div>
            <div class="modal-title" id="modal-agent-name">Specialist</div>
            <div style="font-size: 0.78rem; color: var(--muted); margin-top: 2px;" id="modal-agent-role">Role</div>
          </div>
          <button type="button" class="modal-close-btn" onclick="closeSpecialistModal()">&times;</button>
        </div>

        <div class="modal-tabs">
          <button type="button" class="modal-tab-btn active" id="modal-tab-telemetry-btn" onclick="switchModalTab('telemetry')">Audited Telemetry</button>
          <button type="button" class="modal-tab-btn" id="modal-tab-chat-btn" onclick="switchModalTab('chat')">Live Query</button>
        </div>

        <div class="modal-body">
          <div id="modal-pane-telemetry">
            <p style="font-size: 0.85rem; color: var(--muted); line-height: 1.5; margin-bottom: 18px;" id="modal-agent-desc">
              Description
            </p>
            <div id="modal-telemetry-stats"></div>
          </div>

          <div id="modal-pane-chat" style="display: none;">
            <div id="modal-chat-stream" style="display: flex; flex-direction: column; gap: 10px; max-height: 220px; overflow-y: auto; font-size: 0.82rem; margin-bottom: 14px;">
              <div style="color: var(--muted);">Standing by. You may query our verified benchmarks and findings.</div>
            </div>
            <form class="modal-chat-form" onsubmit="event.preventDefault(); submitModalChat();">
              <input type="text" class="modal-chat-input" id="modal-chat-input" placeholder="Query specialist...">
              <button type="submit" class="modal-chat-send" id="modal-chat-send-btn">submit</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <footer>
      <p>
        <strong>Attribution &amp; Legal Disclaimers (Rule B10):</strong> Kalshi, CME Group, CF Benchmarks, Coinbase, Kraken, Bitstamp, and Gemini are trademarks of their respective owners. QuanterraOS is an independent measurement system. Rule B5 locked: zero live capital deployed.
      </p>
    </footer>
  </main>

  <script>
  let activeAgentId = null;
  const councilAgents = ${JSON.stringify(councilAgents)};

  function openSpecialistModal(agentId, initialTab = 'telemetry') {
    activeAgentId = agentId;
    const agent = councilAgents.find(a => a.id === agentId);
    const backdrop = document.getElementById('specialist-modal-backdrop');
    if (!agent || !backdrop) return;

    document.getElementById('modal-agent-name').textContent = agent.name;
    document.getElementById('modal-agent-role').textContent = agent.role;
    document.getElementById('modal-agent-desc').textContent = agent.expandedDesc;

    const statsContainer = document.getElementById('modal-telemetry-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '';
      agent.stats.forEach(s => {
        const item = document.createElement('div');
        item.className = 'telemetry-item';
        item.innerHTML = '<span class="telemetry-item-key">' + escapeHtml(s.label) + '</span><span class="telemetry-item-val">' + escapeHtml(s.value) + '</span>';
        statsContainer.appendChild(item);
      });
    }

    switchModalTab(initialTab);
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSpecialistModal() {
    const backdrop = document.getElementById('specialist-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  function switchModalTab(tab) {
    const telemetryBtn = document.getElementById('modal-tab-telemetry-btn');
    const chatBtn = document.getElementById('modal-tab-chat-btn');
    const telemetryPane = document.getElementById('modal-pane-telemetry');
    const chatPane = document.getElementById('modal-pane-chat');

    if (tab === 'telemetry') {
      if (telemetryBtn) telemetryBtn.classList.add('active');
      if (chatBtn) chatBtn.classList.remove('active');
      if (telemetryPane) telemetryPane.style.display = 'block';
      if (chatPane) chatPane.style.display = 'none';
    } else {
      if (telemetryBtn) telemetryBtn.classList.remove('active');
      if (chatBtn) chatBtn.classList.add('active');
      if (telemetryPane) telemetryPane.style.display = 'none';
      if (chatPane) chatPane.style.display = 'block';
      const input = document.getElementById('modal-chat-input');
      if (input) setTimeout(() => input.focus(), 60);
    }
  }

  async function submitModalChat() {
    const input = document.getElementById('modal-chat-input');
    const stream = document.getElementById('modal-chat-stream');
    const btn = document.getElementById('modal-chat-send-btn');
    if (!input || !stream || !activeAgentId) return;
    const text = input.value.trim();
    if (!text) return;

    const userDiv = document.createElement('div');
    userDiv.style.color = 'var(--text)';
    userDiv.innerHTML = '<strong>You:</strong> ' + escapeHtml(text);
    stream.appendChild(userDiv);
    input.value = '';
    if (btn) btn.disabled = true;

    const waitDiv = document.createElement('div');
    waitDiv.id = 'modal-wait-msg';
    waitDiv.style.color = 'var(--muted)';
    waitDiv.textContent = 'Auditing against stored records...';
    stream.appendChild(waitDiv);
    stream.scrollTop = stream.scrollHeight;

    try {
      const res = await fetch('/api/executives/' + activeAgentId + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const wait = document.getElementById('modal-wait-msg');
      if (wait) wait.remove();

      const specDiv = document.createElement('div');
      specDiv.style.color = 'var(--text)';
      specDiv.style.borderLeft = '2px solid var(--accent)';
      specDiv.style.paddingLeft = '8px';
      let citations = '';
      if (Array.isArray(data.citations) && data.citations.length > 0) {
        citations = '<div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--muted); margin-top:4px;">citation: ' + data.citations.map(c => escapeHtml(c)).join(', ') + '</div>';
      }
      specDiv.innerHTML = '<strong>' + escapeHtml(data.agentName || activeAgentId) + ':</strong> ' + escapeHtml(data.reply || '') + citations;
      stream.appendChild(specDiv);
    } catch (_e) {
      const wait = document.getElementById('modal-wait-msg');
      if (wait) wait.remove();
      const errDiv = document.createElement('div');
      errDiv.style.color = 'var(--warning)';
      errDiv.textContent = 'Error connecting to specialist service.';
      stream.appendChild(errDiv);
    } finally {
      if (btn) btn.disabled = false;
      stream.scrollTop = stream.scrollHeight;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSpecialistModal();
  });
  const backdrop = document.getElementById('specialist-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSpecialistModal();
    });
  }
  </script>

  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
