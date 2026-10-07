import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { renderMarketEvidenceCardHtml } from "./market-evidence-card.ts";

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

  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="nav-brand"><span class="brand-dot"></span> quanterraos</a>
      <div class="nav-links">
        <a href="/calculator" class="active" style="color:var(--accent);font-weight:700;">true-cost calculator</a>
        <a href="/compare" style="color:#38BDF8;font-weight:600;">compare venues</a>
        <a href="/journal" style="color:#10B981;font-weight:600;">decision journal</a>
        <a href="/kalshi/15m">kalshi 15m</a>
        <a href="/kalshi/1h">kalshi 1h</a>
        <a href="/calibration">calibration</a>
        <a href="/index">composite index</a>
        <a href="/research">research</a>
      </div>
    </div>
    <div style="display:flex; gap:10px; align-items:center;">
      <a href="/compare" class="nav-cta" style="background:rgba(56,189,248,0.15); color:#38BDF8; border-color:rgba(56,189,248,0.4);">COMPARE VENUES &rarr;</a>
      <a href="/journal" class="nav-cta" style="background:rgba(16,185,129,0.15); color:#10B981; border-color:rgba(16,185,129,0.4);">MY JOURNAL &rarr;</a>
    </div>
  </nav>

  <main class="container">
    <div class="eyebrow">Transaction Friction · Probability Math</div>
    <h1>True Cost &amp; Net EV Calculator</h1>
    <p class="lead">
      Short-duration prediction markets are zero-sum before fees, and strictly negative-sum after fees and spreads. Compute your fee- and spread-adjusted expected value (EV) per contract to verify if your directional thesis actually overcomes market friction.
    </p>

    <div class="calc-grid">
      <!-- Left Column: Inputs -->
      <div class="card">
        <div class="card-title">
          <span>Contract &amp; Strategy Parameters</span>
          <span class="mono" style="font-size:0.75rem; color:var(--accent);">KXBTC15M MODEL</span>
        </div>

        <div class="input-group">
          <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:6px;">Pricing Basis</label>
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
              <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:#DFB843;"></span>
              <label for="slider-price" id="label-price-title" style="color:#FFFFFF; font-weight:600;">Contract Ask Price (Cost to Enter)</label>
            </div>
            <span id="label-price" style="color:#DFB843; font-weight:700;">51¢ ($0.51)</span>
          </div>
          <div style="font-size:0.72rem; color:var(--muted); margin-bottom:6px;">Exchange purchase price. Determines maximum dollar loss and initial entry cost.</div>
          <input type="range" id="slider-price" min="1" max="99" value="51" oninput="handleSliderSnap('slider-price', [10,25,50,51,75,90]); recalc();">
          <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <button type="button" class="preset-btn" onclick="setPrice(10)">10¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(25)">25¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(50)">50¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(51)" style="border-color:#DFB843; color:#DFB843;">51¢ (Std)</button>
            <button type="button" class="preset-btn" onclick="setPrice(75)">75¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(90)">90¢</button>
          </div>
        </div>

        <div class="input-group">
          <div class="input-label-row">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:#38BDF8;"></span>
              <label for="slider-prob" style="color:#FFFFFF; font-weight:600;">Your Assessed Win Probability (Subjective Thesis)</label>
            </div>
            <span id="label-prob" style="color:#38BDF8; font-weight:700;">55.0%</span>
          </div>
          <div style="font-size:0.72rem; color:var(--muted); margin-bottom:6px;">Your subjective assessment. This is your personal opinion, NOT an automated forecast.</div>
          <input type="range" id="slider-prob" min="1" max="99" value="55" oninput="handleSliderSnap('slider-prob', [35,50,52.8,55,65,75]); recalc();">
          <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <button type="button" class="preset-btn" onclick="setProb(35)">35%</button>
            <button type="button" class="preset-btn" onclick="setProb(50)">50% (Coin)</button>
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

        <div class="input-row-flex">
          <div class="input-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label style="font-size:0.8rem; color:var(--muted); margin:0;">Contract Count (Order Size)</label>
              <span style="font-size:0.7rem; color:var(--accent); font-family:var(--font-mono);">Hold Price Constant</span>
            </div>
            <input type="number" id="input-count" class="number-input" value="100" min="1" max="10000" oninput="recalc()">
            <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
              <button type="button" class="preset-btn" onclick="setCount(1)" title="1 contract: ceil(1.75¢) = 2¢ fee (+0.25¢ rounding drag)">1 ct (2.0¢/ct)</button>
              <button type="button" class="preset-btn" onclick="setCount(10)" title="10 contracts: ceil(17.5¢) = 18¢ fee (+0.05¢ rounding drag)">10 ct (1.8¢/ct)</button>
              <button type="button" class="preset-btn" onclick="setCount(100)" title="100 contracts: ceil(175¢) = $1.75 fee (exact 1.75¢/ct)">100 ct (1.75¢/ct)</button>
            </div>
          </div>
          <div class="input-group">
            <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:6px;">Contract Cadence &amp; Series</label>
            <select id="select-contract" class="number-input" onchange="recalc()">
              <option value="kalshi-15m" selected>Kalshi 15-Minute Above/Below (KXBTC15M)</option>
              <option value="kalshi-1h">Kalshi 1-Hour Above/Below (KXBTCD)</option>
              <option value="polymarket-15m">Polymarket 15-Minute (Binary)</option>
            </select>
          </div>
        </div>

        <div class="input-group" style="margin-top:14px;">
          <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:6px;">Directional Thesis (Above vs Below)</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <button type="button" id="btn-side-above" class="number-input" style="background:rgba(16,185,129,0.15); border:1px solid var(--green); color:var(--green); cursor:pointer; font-weight:600;" onclick="setSide('above')">▲ Above Strike (BUY YES)</button>
            <button type="button" id="btn-side-below" class="number-input" style="background:rgba(255,255,255,0.04); border:1px solid var(--panel-border); color:var(--muted); cursor:pointer; font-weight:600;" onclick="setSide('below')">▼ Below Strike (BUY NO)</button>
          </div>
        </div>

        <div class="banner-note" id="contract-note">
          <strong>Why this matters on Kalshi 15M:</strong> Taker fees are calculated on the aggregate order using Kalshi's official round-up rule: <code>ceil(0.07 × Count × P × (1 − P))</code>. For an executable ask of 50¢, the 1.75¢ taker fee establishes a <strong>51.75% breakeven hurdle</strong> (or 52.00% on a single contract due to cent rounding). Crossing the spread is already incorporated in the ask price.
        </div>
      </div>

      <!-- Right Column: Live Net Results -->
      <div class="card">
        <div class="card-title">
          <span>Net Mathematical Expected Value</span>
          <span id="badge-verdict" class="mono" style="font-size:0.75rem; padding:2px 8px; border-radius:3px;">CALCULATING</span>
        </div>

        <div class="result-hero" id="hero-box">
          <div class="result-hero-label">Net EV Per Contract</div>
          <div class="result-hero-value" id="val-net-ev-contract">+$0.0225</div>
          <div class="result-hero-sub" id="val-total-pnl">+$2.25 on 100 contracts</div>
        </div>

        <div class="friction-breakdown">
          <div class="friction-box">
            <div class="friction-label">Exchange Taker Fee</div>
            <div class="friction-val" id="val-fee">1.75¢</div>
          </div>
          <div class="friction-box">
            <div class="friction-label">Half-Spread Drag</div>
            <div class="friction-val" id="val-spread-drag">1.00¢</div>
          </div>
        </div>

        <div class="stat-row">
          <span class="stat-label">Gross Model Edge (before friction)</span>
          <span class="stat-val" id="val-gross-edge">+5.00¢</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Total Transaction Drag</span>
          <span class="stat-val" style="color:var(--rose);" id="val-total-drag">-2.75¢</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Required Breakeven Win Rate</span>
          <span class="stat-val" style="color:var(--accent);" id="val-breakeven">52.75%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Settlement Reference Benchmark</span>
          <span class="stat-val mono" style="color:#FFFFFF;" id="val-benchmark">CME CF BRTI 60s TWAP</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Contract Cadence &amp; Horizon</span>
          <span class="stat-val mono" style="color:var(--accent-light);" id="val-cadence">15-Minute Intraday (KXBTC15M)</span>
        </div>
        <div id="risk-plan-advisory-box" style="display:none; margin-top:14px; padding:10px 14px; background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.25); border-radius:4px; font-size:0.75rem;">
          <div style="display:flex; align-items:center; gap:6px; color:var(--rose); font-weight:700; margin-bottom:4px;">
            <span>⚠️ VOLUNTARY RISK PLAN ADVISORY</span>
          </div>
          <div id="risk-plan-advisory-text" style="color:var(--text); line-height:1.4;"></div>
          <div style="margin-top:6px;"><a href="/journal" style="color:var(--accent); text-decoration:underline; font-size:0.7rem;">Configure Voluntary Spending Caps in Journal &rarr;</a></div>
        </div>

        <div style="margin-top:20px; display:flex; flex-direction:column; gap:10px;">
          <button type="button" id="btn-save-journal" onclick="saveCheckToJournal()" class="nav-cta" style="width:100%; justify-content:center; padding:12px; font-size:0.85rem; font-weight:700; background:linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%); color:#07080B; border:1px solid #DFB843; cursor:pointer;">
            SAVE CHECK &amp; ACTIVATE JOURNAL &rarr;
          </button>
          <a href="/kalshi" class="btn-pricing" style="width:100%; text-align:center; padding:10px; font-size:0.8rem;">
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
    <div style="margin-bottom: 48px;">
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
        labelPriceTitle.textContent = 'Contract Ask Price (Cost to Enter)';
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
      document.getElementById('label-spread').textContent = (spread * 100).toFixed(1) + '¢';

      // Spread drag is ONLY present when evaluating from mid-price reference.
      // An executable ask price already incorporates the crossing cost.
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

      const isPositive = netEvContract > 0;
      const color = isPositive ? 'var(--green)' : 'var(--rose)';
      const sign = isPositive ? '+' : '';

      const heroVal = document.getElementById('val-net-ev-contract');
      heroVal.textContent = sign + '$' + netEvContract.toFixed(4);
      heroVal.style.color = color;

      const totalPnlEl = document.getElementById('val-total-pnl');
      totalPnlEl.textContent = sign + '$' + totalPnl.toFixed(2) + ' net expectancy on ' + count + ' contracts';
      totalPnlEl.style.color = isPositive ? 'var(--green)' : 'var(--muted)';

      document.getElementById('val-fee').textContent = (feePerContract * 100).toFixed(2) + '¢ ($' + totalFee.toFixed(2) + ' total)';
      document.getElementById('val-spread-drag').textContent = (halfSpreadDrag * 100).toFixed(2) + '¢' + (pricingMode === 'executable-ask' ? ' (in price)' : '');
      document.getElementById('val-gross-edge').textContent = (grossEdge >= 0 ? '+' : '') + (grossEdge * 100).toFixed(2) + '¢';
      document.getElementById('val-total-drag').textContent = '-' + (totalDrag * 100).toFixed(2) + '¢';
      document.getElementById('val-breakeven').textContent = (breakevenProb * 100).toFixed(2) + '%';
      document.getElementById('val-benchmark').textContent = benchmark;
      document.getElementById('val-cadence').textContent = cadence;
      document.getElementById('val-100-drag').textContent = '-$' + (totalDrag * count * 10).toFixed(2);

      const mobileBreakeven = document.getElementById('mobile-breakeven-val');
      if (mobileBreakeven) mobileBreakeven.textContent = (breakevenProb * 100).toFixed(2) + '%';

      const badge = document.getElementById('badge-verdict');
      badge.textContent = isPositive ? 'POSITIVE EDGE' : 'NEGATIVE DRAG';
      badge.style.background = isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)';
      badge.style.color = isPositive ? 'var(--green)' : 'var(--rose)';
      badge.style.border = '1px solid ' + (isPositive ? 'var(--green)' : 'var(--rose)');

      // Store current check state for 1-click journal save
      window.__latestCheck = {
        venue: contractType,
        pricingBasis: pricingMode,
        contractTicker: contractType === 'kalshi-1h' ? 'KXBTCD' : contractType === 'polymarket-15m' ? 'POLY-BTC15M' : 'KXBTC15M',
        side: currentSide,
        price: effectiveAsk,
        count: count,
        purchaseCost: Number((effectiveAsk * count).toFixed(2)),
        exchangeFee: Number(totalFee.toFixed(2)),
        halfSpreadDrag: Number(halfSpreadDrag.toFixed(4)),
        totalDrag: Number(totalDrag.toFixed(4)),
        breakevenWinProb: Number((breakevenProb * 100).toFixed(2)),
        assessedWinProb: Number((prob * 100).toFixed(2)),
        netExpectedValue: Number(totalPnl.toFixed(2)),
        settlementSource: benchmark
      };

      // Check voluntary risk plan thresholds
      if (window.__riskCheckTimer) clearTimeout(window.__riskCheckTimer);
      window.__riskCheckTimer = setTimeout(function() {
        if (!window.__latestCheck) return;
        fetch('/api/calculator/advisory-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticker: window.__latestCheck.contractTicker,
            venue: window.__latestCheck.venue,
            outlay: window.__latestCheck.purchaseCost,
            count: window.__latestCheck.count
          })
        })
        .then(function(r) { return r.json(); })
        .then(function(res) {
          var box = document.getElementById('risk-plan-advisory-box');
          var txt = document.getElementById('risk-plan-advisory-text');
          if (!box || !txt) return;
          var w = (res && res.warnings) || (res && res.advisory && res.advisory.warnings) || [];
          if (w.length > 0) {
            txt.innerHTML = w.map(function(item) { return '&bull; ' + item; }).join('<br>');
            box.style.display = 'block';
          } else {
            box.style.display = 'none';
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

    function setPrice(p) {
      triggerHaptic();
      document.getElementById('slider-price').value = p;
      recalc();
    }

    function setProb(pr) {
      triggerHaptic();
      document.getElementById('slider-prob').value = pr;
      recalc();
    }

    function setCount(n) {
      triggerHaptic();
      document.getElementById('input-count').value = n;
      recalc();
    }

    function saveCheckToJournal() {
      if (!window.__latestCheck) recalc();
      try {
        localStorage.setItem('quanterraos_pending_check', JSON.stringify(window.__latestCheck));
        fetch('/api/analytics/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(window.__latestCheck)
        }).catch(function() {});
      } catch (_) {}
      window.location.href = '/account?flow=save-check';
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

    recalc();
  </script>
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
