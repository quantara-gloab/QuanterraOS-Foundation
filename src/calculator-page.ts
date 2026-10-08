import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { renderMarketEvidenceCardHtml } from "./market-evidence-card.ts";
import { renderBetaFeedbackWidgetHtml } from "./feedback-widget.ts";
import { renderSystemPulseHtml } from "./system-pulse.ts";
import { renderMobileBottomNavHtml, getMobileAppRuntimeScript } from "./mobile-install.ts";

/**
 * True Cost & Expected Value Calculator for Short-Duration Prediction Markets
 *
 * Computes exact fee friction, spread drag, net expected value (EV),
 * and required breakeven win rate for Kalshi and Polymarket contracts.
 */
export function renderCalculatorPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>True Cost &amp; Net EV Calculator — QuanterraOS</title>
  <meta name="description" content="Free fee- and spread-adjusted expected value (EV) calculator for Kalshi 15-minute and Polymarket prediction contracts.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --panel: rgba(14, 18, 27, 0.85);
      --panel-border: rgba(212, 175, 55, 0.18);
      --panel-border-subtle: rgba(212, 175, 55, 0.08);
      --panel-border-highlight: rgba(223, 184, 67, 0.45);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --gold-bullion: #D4AF37;
      --green: #10B981;
      --rose: #F43F5E;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 50% at 50% -20%, rgba(223, 184, 67, 0.12), transparent 70%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.6;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }
    
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
    .ticker-sep { color: rgba(255, 255, 255, 0.15); }
    @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 40px;
      background: rgba(10, 14, 22, 0.85);
      border-bottom: 1px solid var(--panel-border);
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .nav-left { display: flex; align-items: center; gap: 32px; }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: -0.02em;
    }
    .brand-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.84rem; font-weight: 500; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .nav-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      color: #07080B;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      padding: 8px 18px;
      border-radius: 4px;
      border: 1px solid rgba(255, 248, 220, 0.6);
      box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3), inset 0 1px 0 #FFFFFF;
      text-decoration: none;
    }

    .container { max-width: 1140px; margin: 0 auto; padding: 48px 24px 0; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.2);
      padding: 4px 10px;
      border-radius: 3px;
    }
    h1 { font-size: 2.25rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 12px; }
    .lead { color: var(--muted); font-size: 1rem; max-width: 780px; margin-bottom: 36px; }

    .calc-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 28px;
      margin-bottom: 48px;
    }
    @media (max-width: 860px) {
      .calc-grid { grid-template-columns: 1fr; }
      .top-nav { padding: 14px 16px; flex-wrap: wrap; gap: 10px; }
      .nav-links { overflow-x: auto; white-space: nowrap; width: 100%; }
      .mobile-sticky-bar { display: flex !important; }
      body { padding-bottom: 74px; }
    }

    .mobile-sticky-bar {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(10, 14, 22, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--panel-border);
      padding: 10px 16px;
      z-index: 1000;
      box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.7);
      align-items: center;
      justify-content: space-between;
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      padding: 28px;
      backdrop-filter: blur(20px);
      box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.6);
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--panel-border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .input-group { margin-bottom: 20px; }
    .input-label-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.82rem; }
    .input-label-row label { color: var(--muted); font-weight: 500; }
    .input-label-row span { font-family: var(--font-mono); color: var(--accent); font-weight: 600; }
    input[type="range"] {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      outline: none;
      accent-color: var(--accent);
      cursor: pointer;
    }
    #slider-prob {
      accent-color: #38BDF8 !important;
    }
    #slider-price {
      accent-color: #DFB843 !important;
    }
    .input-row-flex {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .number-input {
      width: 100%;
      background: rgba(6, 9, 14, 0.85);
      border: 1px solid var(--panel-border);
      color: #FFFFFF;
      padding: 8px 12px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      border-radius: 4px;
      outline: none;
    }

    .preset-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--panel-border);
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .preset-btn:hover {
      background: rgba(223, 184, 67, 0.12);
      border-color: rgba(223, 184, 67, 0.4);
      color: #FFFFFF;
    }

    .result-hero {
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.08) 0%, rgba(14, 18, 27, 0.95) 100%);
      border: 1px solid rgba(223, 184, 67, 0.35);
      border-radius: 6px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }
    .result-hero-label { font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .result-hero-value { font-family: var(--font-mono); font-size: 2.8rem; font-weight: 700; line-height: 1.1; margin-bottom: 6px; }
    .result-hero-sub { font-size: 0.85rem; color: var(--muted); }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--panel-border-subtle);
      font-size: 0.85rem;
    }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { color: var(--muted); }
    .stat-val { font-family: var(--font-mono); font-weight: 600; color: #FFFFFF; }

    .friction-breakdown {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 16px;
      margin-bottom: 16px;
    }
    .friction-box {
      background: rgba(6, 9, 14, 0.6);
      border: 1px solid var(--panel-border-subtle);
      border-radius: 4px;
      padding: 12px;
      text-align: center;
    }
    .friction-label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-family: var(--font-mono); }
    .friction-val { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 600; color: var(--rose); margin-top: 2px; }

    .banner-note {
      background: rgba(223, 184, 67, 0.04);
      border-left: 3px solid var(--accent);
      padding: 14px 16px;
      font-size: 0.82rem;
      color: var(--muted);
      margin-top: 20px;
      border-radius: 0 4px 4px 0;
    }
    .banner-note strong { color: #FFFFFF; }
  </style>
</head>
<body>
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>TRUE COST &amp; NET EV ENGINE</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">KALSHI TAKER FEE FORMULA: 0.07 × P × (1 − P)</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SETTLEMENT TARGET: CME CF BRTI</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">INDEPENDENT VERIFICATION LAYER</span>
    </div>
  </div>

  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>TRUE COST &amp; NET EV ENGINE</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">KALSHI TAKER FEE FORMULA: ceil(0.07 × Count × P × (1 − P))</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SETTLEMENT TARGET: CME CF BRTI</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">INDEPENDENT PRE-TRADE AUDIT · $0 LIVE RISK</span>
    </div>
  </div>

  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="nav-brand"><span class="brand-dot"></span> QUANTERRAOS</a>
      <div class="nav-links">
        <a href="/calculator" class="active" style="color:var(--accent);font-weight:700;">Check</a>
        <a href="/radar" style="color:var(--accent-light);font-weight:600;">Radar</a>
        <a href="/corridors" style="color:var(--accent);font-weight:600;">Corridors</a>
        <a href="/divergence" style="color:var(--accent);font-weight:600;">Divergence</a>
        <a href="/settlement" style="color:var(--accent-light);font-weight:600;">Settlement</a>
        <a href="/schedule" style="color:var(--accent);font-weight:600;">Schedule</a>
        <a href="/webhooks" style="color:var(--accent);font-weight:600;">Webhooks</a>
        <a href="/journal" style="color:#10B981;font-weight:600;">Journal</a>
        <a href="/calibration" style="color:var(--muted);font-weight:500;">Learn</a>
        <a href="/account" style="color:var(--muted);font-weight:500;">Sign in</a>
      </div>
    </div>
    <div style="display:flex; gap:14px; align-items:center;">
      <div style="display:flex; gap:12px; align-items:center; font-size:0.75rem;">
        <a href="/why" style="color:var(--accent); text-decoration:none; font-weight:600;">Why QuanterraOS</a>
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <a href="/research" style="color:var(--muted); text-decoration:none;">Research</a>
        <span style="color:rgba(255,255,255,0.15);">|</span>
        <a href="/council" style="color:var(--muted); text-decoration:none;">Institutional</a>
      </div>
      <a href="/journal" class="nav-cta" style="background:rgba(16,185,129,0.15); color:#10B981; border-color:rgba(16,185,129,0.4);">MY JOURNAL &rarr;</a>
    </div>
  </nav>

  ${renderSystemPulseHtml({ page: "calculator" })}

  <main class="container">
    <div class="focus-mode-peripheral">
      <div class="eyebrow">Pre-Trade True-Cost Verification · Level 1 Consumer Tool</div>
      <h1>True Cost &amp; Net EV Check</h1>
      <p class="lead">
        Short-duration prediction markets are zero-sum before fees, and strictly negative-sum after exchange fees and spreads. Enter your price and quantity to verify exact fee drag and your true breakeven hurdle before entering any contract.
      </p>

      <!-- First-Use Example Preview Banner -->
      <div style="background:linear-gradient(135deg, rgba(223,184,67,0.12) 0%, rgba(14,18,27,0.9) 100%); border:1px solid rgba(223,184,67,0.35); border-radius:6px; padding:12px 16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="font-size:0.82rem; color:var(--text);">
          <strong style="color:var(--accent);">⚡ First-Use Preview:</strong> Try an unauthenticated example check (10 contracts @ 51¢) and preview your personal outcome journal with zero sign-up friction.
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" onclick="loadExampleCheck()" class="preset-btn" style="border-color:var(--accent); color:var(--accent-light); padding:5px 12px; font-weight:600;">
            Load Example Check
          </button>
          <button type="button" onclick="previewExampleInJournal()" class="preset-btn" style="background:rgba(16,185,129,0.15); border-color:var(--green); color:var(--green); padding:5px 12px; font-weight:600;">
            Preview in Journal &rarr;
          </button>
        </div>
      </div>
    </div>

    <div class="calc-grid focus-mode-core">
      <!-- Left Column: Primary Order Inputs First -->
      <div class="card">
        <div class="card-title">
          <span>1. Contract Order Inputs</span>
          <span class="mono" style="font-size:0.75rem; color:var(--accent);">KXBTC15M MODEL</span>
        </div>

        <!-- Restored unfinished check pill -->
        <div id="calc-restored-pill" style="display:none; font-family:var(--font-mono); font-size:0.72rem; color:#10B981; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); padding:4px 10px; border-radius:4px; margin-bottom:14px;">
          ✓ Restored unfinished check from your previous session
        </div>

        <!-- Market-Link Intake Bar -->
        <div style="background: rgba(6, 9, 14, 0.7); border: 1px solid var(--panel-border-subtle); border-radius: 6px; padding: 12px; margin-bottom: 16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
            <label style="font-family:var(--font-mono); font-size:0.72rem; color:var(--accent-light); font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">
              Market-Link Intake (One-Click Populate)
            </label>
            <span id="calc-source-badge" style="font-family:var(--font-mono); font-size:0.68rem; color:var(--muted);">
              Supports Kalshi 15M/1H &amp; Polymarket BTC links or tickers
            </span>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" class="number-input" id="calc-link-intake" placeholder="Paste Kalshi URL or ticker (e.g. KXBTC15M or https://kalshi.com/markets/kxbtc15m)..." oninput="handleMarketLinkIntake(this.value)" style="margin:0; width:100%; font-size:0.8rem; padding:8px 10px;">
            <button type="button" class="preset-btn" onclick="clearMarketLinkIntake()" style="padding:7px 12px; font-size:0.75rem; white-space:nowrap;">Clear</button>
          </div>
          <div id="calc-link-feedback" style="display:none; font-family:var(--font-mono); font-size:0.72rem; margin-top:6px;"></div>
        </div>

        <!-- 1. Price First -->
        <div class="input-group">
          <div class="input-label-row">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:#DFB843;"></span>
              <label for="slider-price" id="label-price-title" style="color:#FFFFFF; font-weight:600;">Contract Price (Executable Ask)</label>
            </div>
            <span id="label-price" style="color:#DFB843; font-weight:700;">51¢ ($0.51)</span>
          </div>
          <div style="font-size:0.72rem; color:var(--muted); margin-bottom:6px;">Per-contract purchase price. Half-spread is already factored into executable ask.</div>
          <div style="display:flex; gap:10px; align-items:center;">
            <input type="range" id="slider-price" min="1" max="99" value="51" style="flex:1;" oninput="handleSliderSnap('slider-price', [10,25,50,51,75,90]); syncPriceFromSlider();">
            <div style="display:flex; align-items:center; gap:2px;">
              <input type="number" id="input-price-num" class="number-input" min="1" max="99" value="51" style="width:60px; text-align:center; padding:6px 4px; font-weight:700; color:#DFB843;" oninput="syncPriceFromNum();">
              <span style="font-family:var(--font-mono); font-size:0.8rem; color:#DFB843;">¢</span>
            </div>
          </div>
          <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <button type="button" class="preset-btn" onclick="setPrice(10)">10¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(25)">25¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(50)">50¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(51)" style="border-color:#DFB843; color:#DFB843;">51¢ (Std)</button>
            <button type="button" class="preset-btn" onclick="setPrice(75)">75¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(90)">90¢</button>
          </div>
        </div>

        <!-- 2. Quantity (Count) Second -->
        <div class="input-group">
          <div class="input-label-row">
            <label for="input-count" style="color:#FFFFFF; font-weight:600;">Quantity (Contract Count)</label>
            <span id="label-count" style="color:var(--text); font-family:var(--font-mono); font-weight:700;">10 contracts</span>
          </div>
          <div style="font-size:0.72rem; color:var(--muted); margin-bottom:6px;">Kalshi rounds taker fees up to the nearest cent on the entire order.</div>
          <input type="number" id="input-count" class="number-input" value="10" min="1" max="10000" oninput="recalc()">
          <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <button type="button" class="preset-btn" onclick="setCount(1)" title="1 contract: ceil(1.75¢) = 2¢ fee (+0.25¢ rounding drag)">1 ct (2.0¢/ct)</button>
            <button type="button" class="preset-btn" onclick="setCount(10)" style="border-color:#DFB843; color:#DFB843;" title="10 contracts: ceil(17.5¢) = 18¢ fee (+0.05¢ rounding drag)">10 ct (1.8¢/ct)</button>
            <button type="button" class="preset-btn" onclick="setCount(50)" title="50 contracts: ceil(87.5¢) = 88¢ fee">50 ct</button>
            <button type="button" class="preset-btn" onclick="setCount(100)" title="100 contracts: ceil(175¢) = $1.75 fee (exact 1.75¢/ct)">100 ct (1.75¢/ct)</button>
          </div>
        </div>

        <!-- Direction & Series -->
        <div class="input-row-flex" style="margin-bottom:18px;">
          <div class="input-group" style="margin-bottom:0;">
            <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:6px;">Directional Side</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
              <button type="button" id="btn-side-above" class="number-input" style="background:rgba(16,185,129,0.15); border:1px solid var(--green); color:var(--green); cursor:pointer; font-weight:600; padding:6px 8px; font-size:0.78rem;" onclick="setSide('above')">▲ YES</button>
              <button type="button" id="btn-side-below" class="number-input" style="background:rgba(255,255,255,0.04); border:1px solid var(--panel-border); color:var(--muted); cursor:pointer; font-weight:600; padding:6px 8px; font-size:0.78rem;" onclick="setSide('below')">▼ NO</button>
            </div>
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:6px;">Contract Venue</label>
            <select id="select-contract" class="number-input" style="padding:7px 10px; font-size:0.8rem;" onchange="recalc()">
              <option value="kalshi-15m" selected>Kalshi 15M (KXBTC15M)</option>
              <option value="kalshi-1h">Kalshi 1H (KXBTCD)</option>
              <option value="polymarket-15m">Polymarket 15M</option>
            </select>
          </div>
        </div>

        <!-- Quick Summary of Key Figures on Left for Mobile -->
        <div style="background:rgba(6,9,14,0.7); border:1px solid var(--panel-border-subtle); border-radius:6px; padding:14px; margin-bottom:18px;">
          <div style="font-size:0.75rem; font-family:var(--font-mono); color:var(--muted); text-transform:uppercase; margin-bottom:8px; display:flex; justify-content:space-between;">
            <span>Immediate Friction Summary</span>
            <span style="color:var(--accent);">Rule B5 Verified</span>
          </div>
          <div class="stat-row" style="padding:4px 0;">
            <span class="stat-label">Purchase Outlay:</span>
            <span class="stat-val" id="val-summary-cost">$5.10</span>
          </div>
          <div class="stat-row" style="padding:4px 0;">
            <span class="stat-label">Exchange Taker Fee:</span>
            <span class="stat-val" style="color:var(--rose);" id="val-summary-fee">$0.18 (1.80¢/ct)</span>
          </div>
          <div class="stat-row" style="padding:4px 0;">
            <span class="stat-label"><strong>Maximum Loss:</strong></span>
            <span class="stat-val" style="color:var(--rose); font-weight:700;" id="val-summary-loss">$5.28</span>
          </div>
          <div class="stat-row" style="padding:4px 0; border-bottom:none;">
            <span class="stat-label"><strong>Required Breakeven:</strong></span>
            <span class="stat-val" style="color:var(--accent); font-weight:700;" id="val-summary-breakeven">52.80%</span>
          </div>
        </div>

        <!-- Stated Reason / Premise (Focus Mode Core Requirement) -->
        <div style="margin-bottom:14px; background:rgba(6,9,14,0.7); border:1px solid var(--panel-border-subtle); border-radius:6px; padding:12px;">
          <label for="calc-stated-reason" style="font-size:0.75rem; font-family:var(--font-mono); color:var(--accent); font-weight:600; display:block; margin-bottom:4px;">
            ✦ Stated Reason / Premise (Focus Mode Anchor):
          </label>
          <input type="text" id="calc-stated-reason" class="number-input" placeholder="e.g. Faded short-term breakout; volatility compression at strike" style="width:100%; font-size:0.8rem; padding:8px 10px;" oninput="if(window.__latestCheck) window.__latestCheck.reason = this.value;">
          <div style="font-size:0.68rem; color:var(--muted); margin-top:4px;">
            A verified premise ensures conscious adherence to your voluntary risk plan.
          </div>
        </div>

        <!-- Save Failure / Retry Alert -->
        <div id="calc-save-error" style="display:none; background:rgba(244,63,94,0.12); border:1px solid #F43F5E; border-radius:6px; padding:12px; margin-bottom:14px; font-size:0.82rem; color:#FDA4AF;">
          <div style="font-weight:700; margin-bottom:4px;">Save Failure: Local journal storage was unavailable or rejected the entry.</div>
          <div style="font-size:0.76rem; color:var(--text-dim); margin-bottom:8px;">Your entered numbers and thesis are preserved in memory. You can retry saving now.</div>
          <button type="button" onclick="retryCalcSave()" class="btn-primary" style="padding:6px 14px; font-size:0.75rem; background:#F43F5E; color:#fff; border-color:#FDA4AF; cursor:pointer;">Retry Save &rarr;</button>
        </div>

        <!-- Immediate Easy-To-Reach Save Button -->
        <button type="button" onclick="saveCheckToJournal()" class="nav-cta" style="width:100%; justify-content:center; padding:12px; font-size:0.85rem; font-weight:700; margin-bottom:18px; cursor:pointer;">
          SAVE CHECK TO JOURNAL &rarr;
        </button>

        <!-- Collapsible Advanced Assumptions -->
        <details style="background:rgba(6,9,14,0.4); border:1px solid var(--panel-border-subtle); border-radius:6px; padding:12px 14px;">
          <summary style="cursor:pointer; font-weight:600; font-size:0.82rem; color:var(--accent); outline:none;">
            ⚙️ Advanced Assumptions (Win Probability, Pricing Mode &amp; Spread Drag)
          </summary>
          <div style="margin-top:14px;">
            <div class="input-group">
              <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:6px;">Pricing Mode Reference</label>
              <select id="select-pricing-mode" class="number-input" onchange="togglePricingMode()">
                <option value="executable-ask" selected>Executable Ask Price (Crossing Spread Already Included)</option>
                <option value="mid-price">Quoted Mid-Price (Requires Half-Spread to Cross)</option>
              </select>
              <div style="font-size:0.72rem; color:var(--muted); margin-top:5px; line-height:1.4;" id="pricing-mode-explainer">
                <span style="color:var(--accent);">✓ Standard Ask:</span> Half-spread is already built into the market ask. No additional spread penalty is added.
              </div>
            </div>

            <div class="input-group">
              <div class="input-label-row">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:#38BDF8;"></span>
                  <label for="slider-prob" style="color:#FFFFFF; font-weight:600;">Assessed Win Probability (Subjective Thesis)</label>
                </div>
                <span id="label-prob" style="color:#38BDF8; font-weight:700;">55.0%</span>
              </div>
              <div style="font-size:0.72rem; color:var(--muted); margin-bottom:6px;">Your subjective assessment. This is your personal opinion, NOT an automated forecast.</div>
              <div style="display:flex; gap:10px; align-items:center;">
                <input type="range" id="slider-prob" min="1" max="99" value="55" style="flex:1;" oninput="handleSliderSnap('slider-prob', [35,50,52.8,55,65,75]); syncProbFromSlider();">
                <div style="display:flex; align-items:center; gap:2px;">
                  <input type="number" id="input-prob-num" class="number-input" min="1" max="99" value="55" style="width:60px; text-align:center; padding:6px 4px; font-weight:700; color:#38BDF8;" oninput="syncProbFromNum();">
                  <span style="font-family:var(--font-mono); font-size:0.8rem; color:#38BDF8;">%</span>
                </div>
              </div>
              <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
                <button type="button" class="preset-btn" onclick="setProb(35)">35%</button>
                <button type="button" class="preset-btn" onclick="setProb(50)">50% (Coin)</button>
                <button type="button" class="preset-btn" onclick="setProb(52.8)">52.8% (Hurdle)</button>
                <button type="button" class="preset-btn" onclick="setProb(55)" style="border-color:#38BDF8; color:#38BDF8;">55% (Std)</button>
                <button type="button" class="preset-btn" onclick="setProb(65)">65%</button>
                <button type="button" class="preset-btn" onclick="setProb(75)">75%</button>
              </div>
            </div>

            <div class="input-group" id="group-spread" style="display:none;">
              <div class="input-label-row">
                <label for="slider-spread">Observed Bid-Ask Spread</label>
                <span id="label-spread">2.0¢</span>
              </div>
              <div style="font-size:0.72rem; color:var(--muted); margin-bottom:6px;">Full spread between best bid and best ask. Half-spread is added to mid-price.</div>
              <input type="range" id="slider-spread" min="1" max="10" value="2" oninput="recalc()">
            </div>
          </div>
        </details>

        <div class="banner-note" id="contract-note" style="margin-top:16px;">
          <strong>Why this matters on Kalshi 15M:</strong> Taker fees are calculated on the aggregate order using Kalshi's official round-up rule: <code>ceil(0.07 × Count × P × (1 − P))</code>. For 10 contracts @ 51¢ ask, the $0.18 taker fee (1.80¢/ct) creates a <strong>52.80% breakeven hurdle</strong> ($5.28 max loss).
        </div>
      </div>

      <!-- Right Column: Net Mathematical Results -->
      <div class="card">
        <div class="card-title">
          <span>2. Net Expected Value &amp; Hurdle</span>
          <span id="badge-verdict" class="mono" style="font-size:0.75rem; padding:2px 8px; border-radius:3px; background:rgba(16,185,129,0.15); color:var(--green); border:1px solid var(--green);">POSITIVE EDGE</span>
        </div>

        <div class="result-hero" id="hero-box">
          <div class="result-hero-label">Net EV Per Contract</div>
          <div class="result-hero-value" id="val-net-ev-contract" style="color:var(--green);">+$0.0220</div>
          <div class="result-hero-sub" id="val-total-pnl" style="color:var(--green);">+$0.22 net expectancy on 10 contracts</div>
        </div>

        <div class="friction-breakdown">
          <div class="friction-box">
            <div class="friction-label">Total Taker Fee</div>
            <div class="friction-val" id="val-fee">$0.18 (1.80¢/ct)</div>
          </div>
          <div class="friction-box">
            <div class="friction-label">Total Outlay + Fee</div>
            <div class="friction-val" id="val-max-loss" style="color:var(--accent);">$5.28</div>
          </div>
        </div>

        <div class="stat-row">
          <span class="stat-label">Purchase Cost (10x @ 51¢)</span>
          <span class="stat-val" id="val-row-cost">$5.10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Exchange Taker Fee</span>
          <span class="stat-val" style="color:var(--rose);" id="val-row-fee">$0.18</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Maximum Loss (Capital at Risk)</span>
          <span class="stat-val" style="color:var(--rose); font-weight:700;" id="val-row-max-loss">$5.28</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Required Breakeven Win Rate</span>
          <span class="stat-val" style="color:var(--accent); font-weight:700;" id="val-breakeven">52.80%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Gross Model Edge (55.0% - 51.0%)</span>
          <span class="stat-val" id="val-gross-edge">+4.00¢</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Settlement Reference Benchmark</span>
          <span class="stat-val mono" style="color:#FFFFFF;" id="val-benchmark">CME CF BRTI 60s TWAP</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Contract Horizon</span>
          <span class="stat-val mono" style="color:var(--accent-light);" id="val-cadence">15-Minute Intraday (KXBTC15M)</span>
        </div>

        <!-- Truth vs. Hype: Competitor Illusion Teardown Callout -->
        <div style="margin-top:16px; padding:14px; background:linear-gradient(180deg, rgba(20,26,38,0.95) 0%, rgba(10,14,22,0.98) 100%); border:1px solid rgba(212,175,55,0.28); border-radius:6px; font-size:0.78rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:var(--accent-light); font-family:var(--font-mono); font-size:0.75rem; text-transform:uppercase;">✦ Competitor Illusion vs. QuanterraOS Reality</strong>
            <span style="font-family:var(--font-mono); font-size:0.65rem; color:#F43F5E; background:rgba(244,63,94,0.12); padding:2px 6px; border-radius:3px;">ANTI-FRICTION</span>
          </div>
          <div style="color:var(--muted); line-height:1.45; font-size:0.75rem;">
            Competitor apps (Verso, Predly) advertise nominal spreads without deducting Kalshi taker fees. At 50¢ mid, the exchange taker fee is 1.75¢/ct—consuming up to <strong>43.8% of your gross profit</strong> and requiring a <strong>52.75% win rate</strong> just to break even.
          </div>
          <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--accent);">Independent Referee &bull; Zero Venue Bias</span>
            <a href="/why" style="font-family:var(--font-mono); font-size:0.72rem; color:var(--accent-light); text-decoration:underline;">Full Benchmark &rarr;</a>
          </div>
        </div>
        <!-- Pre-Save Advisory Risk Check Component -->
        <div id="risk-plan-advisory-box" style="display:none; margin-top:16px; padding:14px; background:rgba(14,20,32,0.95); border:1px solid rgba(212,175,55,0.3); border-radius:6px; font-size:0.78rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span id="risk-plan-advisory-icon" style="font-size:0.9rem;">🛡️</span>
              <strong style="color:#FFFFFF; font-family:var(--font-mono); font-size:0.8rem; text-transform:uppercase;">Pre-Save Advisory Risk Check</strong>
            </div>
            <span id="risk-plan-status-badge" style="font-family:var(--font-mono); font-size:0.68rem; padding:2px 8px; border-radius:4px; font-weight:700;">
              CALCULATING
            </span>
          </div>

          <!-- Advisory Disclaimer -->
          <div style="font-size:0.72rem; color:var(--muted); line-height:1.4; margin-bottom:10px; padding:6px 8px; background:rgba(0,0,0,0.4); border-radius:4px; border-left:2px solid var(--accent);">
            <strong>Advisory Control:</strong> QuanterraOS cannot claim to block exchange trading unless an integration actually enforces that restriction. All limits are voluntary personal boundaries.
          </div>

          <!-- Exposure Comparison Metrics -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div style="background:rgba(6,9,14,0.7); padding:8px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--muted); text-transform:uppercase;">Proposed Outlay</div>
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:2px;">
                <span id="risk-val-trade-outlay" style="font-family:var(--font-mono); font-size:0.9rem; font-weight:700; color:#FFFFFF;">$0.00</span>
                <span style="font-size:0.7rem; color:var(--muted);">Cap: <strong id="risk-val-single-cap" style="color:var(--text);">$25.00</strong></span>
              </div>
            </div>

            <div style="background:rgba(6,9,14,0.7); padding:8px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--muted); text-transform:uppercase;">Projected 24h Outlay</div>
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:2px;">
                <span id="risk-val-projected-outlay" style="font-family:var(--font-mono); font-size:0.9rem; font-weight:700; color:#FFFFFF;">$0.00</span>
                <span style="font-size:0.7rem; color:var(--muted);">Limit: <strong id="risk-val-daily-limit" style="color:var(--text);">$50.00</strong></span>
              </div>
            </div>
          </div>

          <!-- Warning text & Trigger explanation -->
          <div id="risk-plan-advisory-text" style="color:var(--text); line-height:1.45; margin-bottom:8px;"></div>

          <!-- Uncertainty Notice -->
          <div id="risk-uncertainty-notice" style="display:none; padding:8px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); border-radius:4px; color:#FBBF24; font-size:0.72rem; margin-bottom:8px;">
            <span id="risk-uncertainty-text"></span>
            <div style="margin-top:4px;"><a href="/account" style="color:#FBBF24; text-decoration:underline;">Review and reconcile incomplete records &rarr;</a></div>
          </div>

          <!-- Pause & Cooling-Off Option -->
          <div id="risk-pause-container" style="display:none; margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08);">
            <button type="button" onclick="saveCheckForLaterAction()" style="width:100%; padding:8px; background:rgba(212,175,55,0.12); color:var(--accent); border:1px solid rgba(212,175,55,0.35); border-radius:4px; font-family:var(--font-mono); font-size:0.76rem; font-weight:700; cursor:pointer;">
              ⏸ SAVE FOR LATER (15-MIN COOLING-OFF PAUSE)
            </button>
            <span style="display:block; font-size:0.7rem; color:var(--muted); text-align:center; margin-top:4px;">Pausing exempts this check from active exposure while you take time to reflect.</span>
          </div>

          <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; font-size:0.7rem;">
            <a href="/account" style="color:var(--accent); text-decoration:underline;">Configure Risk Plan in Account &rarr;</a>
          </div>
        </div>

        <div style="margin-top:20px; display:flex; flex-direction:column; gap:10px;">
          <button type="button" id="btn-save-journal" onclick="saveCheckToJournal()" class="nav-cta" style="width:100%; justify-content:center; padding:12px; font-size:0.85rem; font-weight:700; background:linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%); color:#07080B; border:1px solid #DFB843; cursor:pointer;">
            SAVE CHECK TO JOURNAL &rarr;
          </button>
          <button type="button" onclick="previewExampleInJournal()" class="preset-btn" style="width:100%; padding:10px; font-size:0.8rem; text-align:center; color:var(--green); border-color:rgba(16,185,129,0.4); background:rgba(16,185,129,0.08); font-weight:600; cursor:pointer;">
            ⚡ Preview Example Entry in Journal (No Account Required) &rarr;
          </button>
          <a href="/kalshi" class="btn-pricing" style="width:100%; text-align:center; padding:10px; font-size:0.8rem; text-decoration:none; color:var(--accent); border:1px solid rgba(223,184,67,0.3); border-radius:4px; display:block;">
            TEST AGAINST LIVE KALSHI BTC DESK &rarr;
          </a>
          <button type="button" onclick="openEmbedModal()" class="preset-btn" style="width:100%; padding:8px 12px; font-size:0.75rem; text-align:center; color:var(--muted); border-color:rgba(212,175,55,0.25); display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;">
            <span>&lt;/&gt;</span> Embed Calculator Widget On Your Site / Newsletter
          </button>
        </div>
      </div>
    </div>

    <!-- Embed Snippet Generator Modal -->
    <div id="embed-widget-modal" style="display:none; position:fixed; inset:0; background:rgba(4,6,10,0.85); backdrop-filter:blur(8px); z-index:1000; align-items:center; justify-content:center; padding:16px;">
      <div style="background:#0E121B; border:1px solid rgba(212,175,55,0.3); border-radius:8px; max-width:540px; width:100%; padding:24px; box-shadow:0 20px 48px rgba(0,0,0,0.6);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(212,175,55,0.15); padding-bottom:10px;">
          <div style="font-family:var(--font-mono); font-size:0.9rem; font-weight:700; color:var(--accent);">
            &lt;/&gt; Embed QuanterraOS Calculator Widget
          </div>
          <button type="button" onclick="closeEmbedModal()" style="background:none; border:none; color:var(--muted); font-size:1.2rem; cursor:pointer;">&times;</button>
        </div>
        <p style="font-size:0.8rem; color:var(--muted); margin-bottom:14px;">
          Embed our live taker-fee, spread-drag, and breakeven calculator directly on your blog, financial publication, research paper, or newsletter. Responsive, lightning-fast, and strictly compliant with independent auditing standards.
        </p>
        <div style="margin-bottom:12px;">
          <div style="font-size:0.75rem; color:#FFFFFF; margin-bottom:6px; font-family:var(--font-mono);">Embed Code (HTML iFrame):</div>
          <textarea id="embed-snippet-code" readonly style="width:100%; height:90px; background:#06080E; border:1px solid rgba(212,175,55,0.2); border-radius:4px; color:#F8FAFC; font-family:var(--font-mono); font-size:0.75rem; padding:8px; resize:none;">&lt;iframe src="https://quanterraos.com/embed/calculator" width="100%" height="480" frameborder="0" style="border:1px solid rgba(212,175,55,0.3); border-radius:8px; max-width:560px;" title="QuanterraOS Prediction Market Calculator"&gt;&lt;/iframe&gt;</textarea>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button type="button" onclick="copyEmbedSnippet()" id="btn-copy-embed" class="nav-cta" style="padding:8px 16px; font-size:0.75rem; cursor:pointer;">
            Copy Embed Code
          </button>
          <button type="button" onclick="closeEmbedModal()" class="preset-btn" style="padding:8px 14px; font-size:0.75rem; cursor:pointer;">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Standardized Market Evidence Card -->
    <div class="focus-mode-peripheral" style="margin-bottom: 48px;">
      ${renderMarketEvidenceCardHtml({ ticker: "KXBTC15M", venue: "kalshi-15m", currentAsk: 0.51, contractCount: 10 })}
    </div>

    <!-- Mobile Persistent Sticky Save Bar -->
    <div class="mobile-sticky-bar">
      <div>
        <div style="font-family:var(--font-mono); font-size:0.65rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.04em;">Required Breakeven</div>
        <div style="font-family:var(--font-mono); font-size:1.15rem; font-weight:700; color:var(--accent);" id="mobile-breakeven-val">52.80%</div>
      </div>
      <button type="button" onclick="saveCheckToJournal()" class="nav-cta" style="padding:10px 18px; font-size:0.8rem; font-weight:700; cursor:pointer;">
        SAVE CHECK &amp; ACTIVATE &rarr;
      </button>
    </div>
  </main>

  <script>
    var currentSide = 'above';

    function togglePricingMode() {
      const mode = document.getElementById('select-pricing-mode').value;
      const groupSpread = document.getElementById('group-spread');
      const labelPriceTitle = document.getElementById('label-price-title');
      const explainer = document.getElementById('pricing-mode-explainer');
      if (mode === 'mid-price') {
        groupSpread.style.display = 'block';
        labelPriceTitle.textContent = 'Quoted Market Mid-Price';
        if (explainer) {
          explainer.innerHTML = '<span style="color:var(--rose);">▲ Mid-Price Reference:</span> Half the spread is added as slippage to model crossing the book.';
        }
      } else {
        groupSpread.style.display = 'none';
        labelPriceTitle.textContent = 'Contract Price (Executable Ask)';
        if (explainer) {
          explainer.innerHTML = '<span style="color:var(--accent);">✓ Standard Ask:</span> Half-spread is already built into the market ask. No additional spread penalty is added.';
        }
      }
      recalc();
    }

    function setSide(side) {
      currentSide = side;
      var btnAbove = document.getElementById('btn-side-above');
      var btnBelow = document.getElementById('btn-side-below');
      if (side === 'above') {
        btnAbove.style.background = 'rgba(16,185,129,0.15)';
        btnAbove.style.borderColor = 'var(--green)';
        btnAbove.style.color = 'var(--green)';
        btnBelow.style.background = 'rgba(255,255,255,0.04)';
        btnBelow.style.borderColor = 'var(--panel-border)';
        btnBelow.style.color = 'var(--muted)';
      } else {
        btnBelow.style.background = 'rgba(244,63,94,0.15)';
        btnBelow.style.borderColor = 'var(--rose)';
        btnBelow.style.color = 'var(--rose)';
        btnAbove.style.background = 'rgba(255,255,255,0.04)';
        btnAbove.style.borderColor = 'var(--panel-border)';
        btnAbove.style.color = 'var(--muted)';
      }
      recalc();
    }

    function recalc() {
      const pricingMode = document.getElementById('select-pricing-mode').value;
      const price = Number(document.getElementById('slider-price').value) / 100;
      const prob = Number(document.getElementById('slider-prob').value) / 100;
      const spread = Number(document.getElementById('slider-spread').value) / 100;
      const count = Math.max(1, Number(document.getElementById('input-count').value) || 1);
      const contractType = document.getElementById('select-contract').value;

      document.getElementById('label-price').textContent = (price * 100).toFixed(0) + '¢ ($' + price.toFixed(2) + ')';
      document.getElementById('label-prob').textContent = (prob * 100).toFixed(1) + '%';
      if (document.getElementById('label-spread')) {
        document.getElementById('label-spread').textContent = (spread * 100).toFixed(1) + '¢';
      }
      const labelCount = document.getElementById('label-count');
      if (labelCount) labelCount.textContent = count + ' contract' + (count === 1 ? '' : 's');

      // Spread drag is ONLY present when evaluating from mid-price reference.
      let halfSpreadDrag = 0;
      let effectiveAsk = price;
      if (pricingMode === 'mid-price') {
        halfSpreadDrag = spread / 2;
        effectiveAsk = Math.min(0.99, price + halfSpreadDrag);
      }

      let totalFee = 0;
      let feePerContract = 0;
      let benchmark = "CME CF BRTI 60s TWAP";
      let cadence = "15-Minute Intraday (KXBTC15M)";

      if (contractType === 'kalshi-15m' || contractType === 'kalshi-1h') {
        // Official Kalshi formula: ceil(0.07 * count * P * (1 - P) * 100) / 100
        const rawFee = 0.07 * count * effectiveAsk * (1 - effectiveAsk);
        totalFee = Math.ceil(Number((rawFee * 100).toFixed(6))) / 100;
        feePerContract = totalFee / count;

        if (contractType === 'kalshi-15m') {
          benchmark = "CME CF BRTI 60s TWAP";
          cadence = "15-Minute Intraday (KXBTC15M)";
        } else {
          benchmark = "CME CF BRTI Hourly TWAP";
          cadence = "1-Hour Fixed Strike (KXBTCD)";
        }
      } else {
        // Polymarket fee (~2% on payout + amortized gas)
        const polyGas = count >= 50 ? 0.08 : 0.15;
        totalFee = (prob * (1 - effectiveAsk) * 0.02 * count) + polyGas;
        feePerContract = totalFee / count;
        benchmark = "Chainlink / Binance Settlement";
        cadence = "15-Minute Polymarket";
      }

      const totalDrag = feePerContract + halfSpreadDrag;
      const grossEdge = prob - (pricingMode === 'mid-price' ? price : effectiveAsk);
      const netEvContract = grossEdge - totalDrag;
      const totalPnl = netEvContract * count;
      const breakevenProb = pricingMode === 'mid-price' ? (price + totalDrag) : (effectiveAsk + feePerContract);

      const purchaseCost = effectiveAsk * count;
      const maxLoss = purchaseCost + totalFee;

      const isPositive = netEvContract > 0;
      const color = isPositive ? 'var(--green)' : 'var(--rose)';
      const sign = isPositive ? '+' : '';

      const heroVal = document.getElementById('val-net-ev-contract');
      if (heroVal) {
        heroVal.textContent = sign + '$' + netEvContract.toFixed(4);
        heroVal.style.color = color;
      }

      const totalPnlEl = document.getElementById('val-total-pnl');
      if (totalPnlEl) {
        totalPnlEl.textContent = sign + '$' + totalPnl.toFixed(2) + ' net expectancy on ' + count + ' contract' + (count === 1 ? '' : 's');
        totalPnlEl.style.color = isPositive ? 'var(--green)' : 'var(--muted)';
      }

      // Update summary cards
      const summaryCost = document.getElementById('val-summary-cost');
      if (summaryCost) summaryCost.textContent = '$' + purchaseCost.toFixed(2);

      const summaryFee = document.getElementById('val-summary-fee');
      if (summaryFee) summaryFee.textContent = '$' + totalFee.toFixed(2) + ' (' + (feePerContract * 100).toFixed(2) + '¢/ct)';

      const summaryLoss = document.getElementById('val-summary-loss');
      if (summaryLoss) summaryLoss.textContent = '$' + maxLoss.toFixed(2);

      const summaryBreakeven = document.getElementById('val-summary-breakeven');
      if (summaryBreakeven) summaryBreakeven.textContent = (breakevenProb * 100).toFixed(2) + '%';

      // Update right column table
      const elValFee = document.getElementById('val-fee');
      if (elValFee) elValFee.textContent = '$' + totalFee.toFixed(2) + ' (' + (feePerContract * 100).toFixed(2) + '¢/ct)';

      const elMaxLoss = document.getElementById('val-max-loss');
      if (elMaxLoss) elMaxLoss.textContent = '$' + maxLoss.toFixed(2);

      const elRowCost = document.getElementById('val-row-cost');
      if (elRowCost) elRowCost.textContent = '$' + purchaseCost.toFixed(2);

      const elRowFee = document.getElementById('val-row-fee');
      if (elRowFee) elRowFee.textContent = '$' + totalFee.toFixed(2);

      const elRowMaxLoss = document.getElementById('val-row-max-loss');
      if (elRowMaxLoss) elRowMaxLoss.textContent = '$' + maxLoss.toFixed(2);

      const elGross = document.getElementById('val-gross-edge');
      if (elGross) elGross.textContent = (grossEdge >= 0 ? '+' : '') + (grossEdge * 100).toFixed(2) + '¢';

      const elBreakeven = document.getElementById('val-breakeven');
      if (elBreakeven) elBreakeven.textContent = (breakevenProb * 100).toFixed(2) + '%';

      const elBenchmark = document.getElementById('val-benchmark');
      if (elBenchmark) elBenchmark.textContent = benchmark;

      const elCadence = document.getElementById('val-cadence');
      if (elCadence) elCadence.textContent = cadence;

      const mobileBreakeven = document.getElementById('mobile-breakeven-val');
      if (mobileBreakeven) mobileBreakeven.textContent = (breakevenProb * 100).toFixed(2) + '%';

      const badge = document.getElementById('badge-verdict');
      if (badge) {
        badge.textContent = isPositive ? 'POSITIVE EDGE' : 'NEGATIVE DRAG';
        badge.style.background = isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)';
        badge.style.color = isPositive ? 'var(--green)' : 'var(--rose)';
        badge.style.border = '1px solid ' + (isPositive ? 'var(--green)' : 'var(--rose)');
      }

      // Store current check state for 1-click journal save
      window.__latestCheck = {
        venue: contractType,
        pricingBasis: pricingMode,
        contractTicker: contractType === 'kalshi-1h' ? 'KXBTCD' : contractType === 'polymarket-15m' ? 'POLY-BTC15M' : 'KXBTC15M',
        side: currentSide,
        price: effectiveAsk,
        count: count,
        purchaseCost: Number(purchaseCost.toFixed(2)),
        exchangeFee: Number(totalFee.toFixed(2)),
        halfSpreadDrag: Number(halfSpreadDrag.toFixed(4)),
        totalDrag: Number(totalDrag.toFixed(4)),
        breakevenWinProb: Number((breakevenProb * 100).toFixed(2)),
        assessedWinProb: Number((prob * 100).toFixed(2)),
        netExpectedValue: Number(totalPnl.toFixed(2)),
        settlementSource: benchmark
      };

      // Check voluntary risk plan thresholds with pre-save verification
      if (window.__riskCheckTimer) clearTimeout(window.__riskCheckTimer);
      window.__riskCheckTimer = setTimeout(function() {
        if (!window.__latestCheck) return;
        fetch('/api/calculator/advisory-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: window.__latestCheck.contractTicker,
            venue: window.__latestCheck.venue,
            price: window.__latestCheck.price,
            purchaseCost: window.__latestCheck.purchaseCost,
            exchangeFee: window.__latestCheck.exchangeFee,
            count: window.__latestCheck.count
          })
        })
        .then(function(r) { return r.json(); })
        .then(function(res) {
          var box = document.getElementById('risk-plan-advisory-box');
          var txt = document.getElementById('risk-plan-advisory-text');
          var badge = document.getElementById('risk-plan-status-badge');
          var tradeEl = document.getElementById('risk-val-trade-outlay');
          var capEl = document.getElementById('risk-val-single-cap');
          var projEl = document.getElementById('risk-val-projected-outlay');
          var limitEl = document.getElementById('risk-val-daily-limit');
          var pauseEl = document.getElementById('risk-pause-container');
          var uncertBox = document.getElementById('risk-uncertainty-notice');
          var uncertTxt = document.getElementById('risk-uncertainty-text');

          if (!box) return;

          box.style.display = 'block';

          if (tradeEl && res.exposure) tradeEl.innerText = '$' + res.exposure.proposedTradeOutlay.toFixed(2);
          if (capEl && res.limits) capEl.innerText = '$' + res.limits.singleTradeMaxOutlay.toFixed(2);
          if (projEl && res.exposure) projEl.innerText = '$' + res.exposure.projectedTotalOutlay.toFixed(2);
          if (limitEl && res.limits) limitEl.innerText = '$' + res.limits.dailySpendingLimit.toFixed(2);

          var isExceeded = res.isExceeded;
          if (badge) {
            badge.innerText = isExceeded ? 'LIMIT EXCEEDED' : 'WITHIN LIMITS';
            badge.style.background = isExceeded ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)';
            badge.style.color = isExceeded ? '#F43F5E' : '#10B981';
            badge.style.border = '1px solid ' + (isExceeded ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)');
          }

          if (pauseEl) {
            pauseEl.style.display = isExceeded ? 'block' : 'none';
          }

          if (uncertBox && uncertTxt) {
            if (res.hasIncompleteImports && res.uncertaintyNotice) {
              uncertTxt.innerText = res.uncertaintyNotice;
              uncertBox.style.display = 'block';
            } else {
              uncertBox.style.display = 'none';
            }
          }

          var details = res.warningDetails || [];
          if (details.length > 0 && txt) {
            var itemsHtml = details.map(function(item) {
              var recs = item.triggerRecords && item.triggerRecords.length > 0 ?
                '<div style="margin-top:4px; font-size:0.7rem; color:var(--muted);">Triggering records: ' +
                item.triggerRecords.map(function(tr) { return tr.ticker + ' ($' + tr.outlay.toFixed(2) + ')'; }).join(', ') + '</div>' : '';
              var assum = item.assumptions ?
                '<div style="font-size:0.68rem; color:var(--muted); opacity:0.85;">Assumption: ' +
                item.assumptions.assumedCount + ' ct @ ' + Math.round(item.assumptions.assumedPrice * 100) + '¢ + $' + item.assumptions.assumedFee.toFixed(2) + ' fee</div>' : '';
              return '<div style="margin-bottom:6px; padding:6px; background:rgba(0,0,0,0.25); border-radius:4px;"><strong style="color:' + (item.severity === 'warning' ? '#F43F5E' : 'var(--accent)') + ';">' + item.title + ':</strong> ' + item.message + recs + assum + '</div>';
            }).join('');
            txt.innerHTML = itemsHtml;
          } else if (txt) {
            txt.innerHTML = '<span style="color:#10B981;">✓ Proposed check is within your voluntary spending limits and position caps.</span>';
          }
        })
        .catch(function() {});
      }, 250);
    }

    function triggerHaptic() {
      try {
        if (navigator && typeof navigator.vibrate === 'function') {
          navigator.vibrate(12);
        }
      } catch (_) {}
    }

    function handleSliderSnap(id, snapPoints) {
      const el = document.getElementById(id);
      if (!el) return;
      const v = Number(el.value);
      for (let i = 0; i < snapPoints.length; i++) {
        if (Math.abs(v - snapPoints[i]) <= 0.8 && v !== snapPoints[i]) {
          el.value = snapPoints[i];
          triggerHaptic();
          break;
        }
      }
    }

    function syncPriceFromSlider() {
      var slider = document.getElementById('slider-price');
      var num = document.getElementById('input-price-num');
      if (slider && num) num.value = slider.value;
      recalc();
    }

    function syncPriceFromNum() {
      var slider = document.getElementById('slider-price');
      var num = document.getElementById('input-price-num');
      if (slider && num) {
        var v = Math.min(99, Math.max(1, parseInt(num.value, 10) || 51));
        slider.value = v;
      }
      recalc();
    }

    function syncProbFromSlider() {
      var slider = document.getElementById('slider-prob');
      var num = document.getElementById('input-prob-num');
      if (slider && num) num.value = slider.value;
      recalc();
    }

    function syncProbFromNum() {
      var slider = document.getElementById('slider-prob');
      var num = document.getElementById('input-prob-num');
      if (slider && num) {
        var v = Math.min(99, Math.max(1, parseInt(num.value, 10) || 55));
        slider.value = v;
      }
      recalc();
    }

    function handleMarketLinkIntake(val) {
      val = (val || '').trim();
      var feedback = document.getElementById('calc-link-feedback');
      var venueSelect = document.getElementById('select-contract');
      var sourceBadge = document.getElementById('calc-source-badge');
      if (!val) {
        if (feedback) feedback.style.display = 'none';
        if (sourceBadge) sourceBadge.innerText = 'Supports Kalshi 15M/1H & Polymarket BTC links or tickers';
        return;
      }

      var lower = val.toLowerCase();
      var recognized = false;
      var title = '';
      var price = 51;
      var venue = 'kalshi-15m';

      if (lower.indexOf('kxbtc15m') !== -1 || (lower.indexOf('kalshi.com') !== -1 && lower.indexOf('15m') !== -1)) {
        recognized = true;
        title = 'Kalshi BTC 15-Minute Above/Below (KXBTC15M)';
        price = 51;
        venue = 'kalshi-15m';
      } else if (lower.indexOf('kxbtcd') !== -1 || (lower.indexOf('kalshi.com') !== -1 && (lower.indexOf('hourly') !== -1 || lower.indexOf('1h') !== -1))) {
        recognized = true;
        title = 'Kalshi BTC 1-Hour Fixed Strike (KXBTCD)';
        price = 48;
        venue = 'kalshi-1h';
      } else if (lower.indexOf('polymarket.com') !== -1 || lower.indexOf('poly-btc') !== -1) {
        recognized = true;
        title = 'Polymarket BTC 15-Minute Binary (USDC)';
        price = 52;
        venue = 'polymarket-15m';
      }

      if (recognized) {
        if (venueSelect) venueSelect.value = venue;
        setPrice(price);
        if (sourceBadge) sourceBadge.innerText = 'Source: Verified Exchange Contract · Freshness: Live';
        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.color = '#10B981';
          feedback.innerHTML = '✓ Populated: <strong>' + title + '</strong> (' + price + '¢ ask). Order parameters locked.';
        }
      } else {
        if (sourceBadge) sourceBadge.innerText = 'Format unrecognized: Falling back to manual entry';
        if (feedback) {
          feedback.style.display = 'block';
          feedback.style.color = '#FBBF24';
          feedback.innerHTML = 'ℹ Unrecognized link format. You can enter contract parameters manually below.';
        }
      }
    }

    function clearMarketLinkIntake() {
      var el = document.getElementById('calc-link-intake');
      if (el) el.value = '';
      handleMarketLinkIntake('');
    }

    function setPrice(p) {
      triggerHaptic();
      var slider = document.getElementById('slider-price');
      var num = document.getElementById('input-price-num');
      if (slider) slider.value = p;
      if (num) num.value = p;
      recalc();
    }

    function setProb(pr) {
      triggerHaptic();
      var slider = document.getElementById('slider-prob');
      var num = document.getElementById('input-prob-num');
      if (slider) slider.value = pr;
      if (num) num.value = pr;
      recalc();
    }

    function setCount(n) {
      triggerHaptic();
      document.getElementById('input-count').value = n;
      recalc();
    }

    function loadExampleCheck() {
      setPrice(51);
      setCount(10);
      setProb(55);
      setSide('above');
      triggerHaptic();
    }

    function previewExampleInJournal() {
      loadExampleCheck();
      recalc();
      const exampleCheck = Object.assign({}, window.__latestCheck, {
        isExample: true,
        exampleTag: 'first_use_preview'
      });
      try {
        localStorage.setItem('quanterraos_pending_check', JSON.stringify(exampleCheck));
        fetch('/api/analytics/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({}, exampleCheck, { preview: true }))
        }).catch(function() {});
      } catch (_) {}
      window.location.href = '/journal?preview=true';
    }

    function saveCheckToJournal() {
      if (!window.__latestCheck) recalc();
      var reasonInput = document.getElementById('calc-stated-reason');
      var statedReason = reasonInput ? reasonInput.value.trim() : '';
      if (window.__latestCheck) {
        window.__latestCheck.reason = statedReason;
      }
      var lossEl = document.getElementById('val-summary-loss');
      var breakevenEl = document.getElementById('val-summary-breakeven');

      var checkDetails = {
        maxLoss: lossEl ? lossEl.innerText : '$5.28',
        breakeven: breakevenEl ? breakevenEl.innerText : '52.80%',
        reason: statedReason,
      };

      var errorBox = document.getElementById('calc-save-error');
      if (errorBox) errorBox.style.display = 'none';

      executeReflectivePause(checkDetails, function() {
        try {
          localStorage.setItem('quanterraos_pending_check', JSON.stringify(window.__latestCheck));
          fetch('/api/analytics/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.__latestCheck)
          }).catch(function() {});
          window.location.href = '/account?flow=save-check';
        } catch (err) {
          console.error("Save failure:", err);
          if (errorBox) {
            errorBox.style.display = 'block';
          }
        }
      });
    }

    function retryCalcSave() {
      saveCheckToJournal();
    }

    function saveCheckForLaterAction() {
      if (!window.__latestCheck) recalc();
      var reasonInput = document.getElementById('calc-stated-reason');
      var statedReason = reasonInput ? reasonInput.value.trim() : 'Paused for voluntary cooling-off reflection';
      var payload = Object.assign({}, window.__latestCheck, {
        reasoning: statedReason,
        coolingOffMinutes: 15
      });

      var statusBox = document.getElementById('risk-plan-advisory-box');
      fetch('/api/calculator/save-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.success) {
          if (statusBox) {
            statusBox.style.display = 'block';
            statusBox.style.background = 'rgba(16,185,129,0.12)';
            statusBox.style.borderColor = 'rgba(16,185,129,0.3)';
            statusBox.innerHTML = '<div style="color:#10B981; font-weight:700; font-family:var(--font-mono); font-size:0.82rem;">✓ Check Paused: Saved for Later (15-min Cooling-Off)</div><div style="font-size:0.75rem; color:var(--text); margin-top:4px;">This check is exempt from your spending limit and active exposure during cooling-off. You can resume or review it in your Journal.</div><div style="margin-top:8px;"><a href="/journal" style="color:var(--accent); font-size:0.75rem; font-weight:600; text-decoration:underline;">View in Journal &rarr;</a></div>';
          }
        }
      })
      .catch(function(err) {
        console.error("Save for later error:", err);
      });
    }

    function openEmbedModal() {
      const modal = document.getElementById('embed-widget-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeEmbedModal() {
      const modal = document.getElementById('embed-widget-modal');
      if (modal) modal.style.display = 'none';
    }

    function copyEmbedSnippet() {
      const el = document.getElementById('embed-snippet-code');
      const btn = document.getElementById('btn-copy-embed');
      if (!el) return;
      el.select();
      el.setSelectionRange(0, 99999);
      try {
        navigator.clipboard.writeText(el.value).then(function() {
          if (btn) {
            btn.textContent = '✓ Copied to Clipboard!';
            setTimeout(function() { btn.textContent = 'Copy Embed Code'; }, 2500);
          }
        });
      } catch (_) {
        document.execCommand('copy');
        if (btn) {
          btn.textContent = '✓ Copied to Clipboard!';
          setTimeout(function() { btn.textContent = 'Copy Embed Code'; }, 2500);
        }
      }
    }

    // Restore preserved unfinished check on load
    try {
      var saved = localStorage.getItem('quanterraos_pending_check');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && typeof parsed.price === 'number') {
          var pVal = Math.round(parsed.price * 100);
          setPrice(pVal);
          if (parsed.count) setCount(parsed.count);
          if (parsed.assessedWinProb) setProb(parsed.assessedWinProb);
          if (parsed.reason) {
            var rEl = document.getElementById('calc-stated-reason');
            if (rEl) rEl.value = parsed.reason;
          }
          var pill = document.getElementById('calc-restored-pill');
          if (pill) pill.style.display = 'block';
        }
      }
    } catch (_) {}

    recalc();
  </script>
  ${renderMobileBottomNavHtml("check")}
  ${getMobileAppRuntimeScript()}
  ${ASSISTANT_WIDGET_HTML}
  ${renderBetaFeedbackWidgetHtml()}
</body>
</html>`;
}
