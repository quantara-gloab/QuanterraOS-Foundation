/**
 * QuanterraOS Interactive 15-Minute High/Low Kalshi Bidding Terminal
 *
 * Provides a live, interactive execution desk for Kalshi KXBTC15M prediction contracts:
 * 1. Live market feed: Active 15m strike, live countdown timer, and orderbook (YES/NO bids & asks)
 * 2. Interactive Bidding Ticket:
 *    - Buy YES / Buy NO toggle
 *    - Sandbox ($10,000 paper wallet) vs Live Kalshi API ($100.29 real balance)
 *    - Limit price selector with Bid / Mid / Ask shortcuts
 *    - Contract quantity chips (1, 5, 10, 25, 50, 100)
 *    - Real-time cost & potential payout calculator
 *    - One-click order execution with audio & visual feedback
 * 3. Active positions & trade ledger table
 * 4. Aria Virtual Desk Assistant integration with voice toggle
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderKalshiTerminalHtml(userEmail?: string, userTier: string = "pro"): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>QuanterraOS — Kalshi 15M High/Low Bidding Terminal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06070A;
    --card: #0C0F17;
    --card-hover: #121722;
    --border: rgba(212, 175, 55, 0.18);
    --accent: #DFB843;
    --accent-light: #F7E7B4;
    --accent-glow: rgba(223, 184, 67, 0.28);
    --gold-bullion: #D4AF37;
    --green: #10B981;
    --green-glow: rgba(16, 185, 129, 0.25);
    --rose: #F43F5E;
    --rose-glow: rgba(244, 63, 94, 0.25);
    --text: #F8FAFC;
    --text-dim: #94A3B8;
    --muted: #64748B;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "IBM Plex Mono", monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse 90% 50% at 50% -10%, rgba(223, 184, 67, 0.1), transparent 70%), var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    min-height: 100vh;
    padding-bottom: 80px;
    line-height: 1.5;
  }

  /* Nav */
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px;
    background: rgba(12, 15, 23, 0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-left { display: flex; align-items: baseline; gap: 12px; }
  .brand-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.02em;
  }
  .brand-sub {
    font-family: var(--font-mono);
    font-size: 0.76rem;
    color: var(--accent);
    padding: 2px 8px;
    background: rgba(223, 184, 67, 0.1);
    border: 1px solid rgba(223, 184, 67, 0.25);
    border-radius: 4px;
  }
  .nav-links { display: flex; gap: 18px; align-items: center; }
  .nav-links a {
    color: var(--text-dim);
    text-decoration: none;
    font-size: 0.84rem;
    transition: color 0.15s;
  }
  .nav-links a:hover, .nav-links a.active { color: var(--text); }
  .nav-links a.active { color: var(--accent); }
  .user-badge {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--accent-light);
    background: rgba(223, 184, 67, 0.12);
    border: 1px solid rgba(223, 184, 67, 0.35);
    padding: 4px 10px;
    border-radius: 4px;
  }

  /* Main Container */
  main { max-width: 1140px; margin: 28px auto 0; padding: 0 20px; }

  /* Header Hero */
  .terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }
  h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; color: #FFFFFF; }
  .subtitle { font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-dim); margin-top: 4px; }
  
  .mode-pill-wrap {
    display: flex;
    gap: 8px;
    background: rgba(14, 19, 26, 0.8);
    border: 1px solid var(--border);
    padding: 4px;
    border-radius: 8px;
  }
  .mode-btn {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--muted);
  }
  .mode-btn.active-sandbox {
    background: rgba(16, 185, 129, 0.18);
    color: #34D399;
    border: 1px solid rgba(16, 185, 129, 0.4);
    font-weight: 600;
  }
  .mode-btn.active-live {
    background: rgba(244, 63, 94, 0.18);
    color: #FB7185;
    border: 1px solid rgba(244, 63, 94, 0.4);
    font-weight: 600;
  }

  /* Grid Layout */
  .grid-layout {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 22px;
  }
  @media (max-width: 900px) {
    .grid-layout { grid-template-columns: 1fr; }
  }

  /* Panels */
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 22px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }
  .panel-title {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Market HUD */
  .ticker-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    margin-bottom: 18px;
  }
  .contract-ticker {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: 700;
    color: #FFFFFF;
  }
  .contract-target {
    font-size: 0.85rem;
    color: var(--text-dim);
    margin-top: 2px;
  }
  .timer-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(223, 184, 67, 0.1);
    border: 1px solid rgba(223, 184, 67, 0.35);
    padding: 6px 14px;
    border-radius: 20px;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent-light);
  }
  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent);
    animation: blink 1.2s infinite ease-in-out;
  }
  @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

  /* Spot vs Strike Bar */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .stat-box {
    background: rgba(18, 23, 34, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 8px;
  }
  .stat-label { font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted); text-transform: uppercase; }
  .stat-val { font-family: var(--font-mono); font-size: 1.15rem; font-weight: 700; color: #FFFFFF; margin-top: 4px; }

  /* Orderbook depth display */
  .orderbook-box {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 20px;
  }
  .depth-side {
    background: rgba(14, 19, 28, 0.8);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px;
    text-align: center;
  }
  .depth-side.yes { border-color: rgba(16, 185, 129, 0.3); }
  .depth-side.no { border-color: rgba(244, 63, 94, 0.3); }
  .side-tag { font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.05em; }
  .side-tag.yes { color: var(--green); }
  .side-tag.no { color: var(--rose); }
  .price-spread {
    display: flex;
    justify-content: space-around;
    margin-top: 10px;
    font-family: var(--font-mono);
  }
  .quote-col { font-size: 0.76rem; color: var(--muted); }
  .quote-num { font-size: 1.1rem; font-weight: 700; color: #FFFFFF; }

  /* Model Fair Value Banner */
  .fair-value-banner {
    background: linear-gradient(90deg, rgba(223, 184, 67, 0.12) 0%, rgba(223, 184, 67, 0.04) 100%);
    border: 1px solid rgba(223, 184, 67, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
  }

  /* Bidding Slip Panel */
  .bidding-slip {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .side-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .side-btn {
    padding: 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }
  .side-btn.selected-yes {
    background: rgba(16, 185, 129, 0.18);
    border-color: var(--green);
    color: #34D399;
    box-shadow: 0 0 16px rgba(16, 185, 129, 0.3);
  }
  .side-btn.selected-no {
    background: rgba(244, 63, 94, 0.18);
    border-color: var(--rose);
    color: #FB7185;
    box-shadow: 0 0 16px rgba(244, 63, 94, 0.3);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-label {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    color: var(--text-dim);
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
  }
  .price-input-wrap {
    display: flex;
    gap: 8px;
  }
  .price-input {
    flex: 1;
    background: #06080E;
    border: 1px solid var(--border);
    color: #FFFFFF;
    font-family: var(--font-mono);
    font-size: 1.1rem;
    font-weight: 700;
    padding: 10px 14px;
    border-radius: 6px;
  }
  .step-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0 12px;
    border-radius: 6px;
    cursor: pointer;
  }
  .step-btn:hover { background: rgba(255, 255, 255, 0.12); }

  .quick-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .chip-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
  }
  .chip-btn:hover { border-color: var(--accent); color: var(--text); }

  /* Calculations preview */
  .order-summary-box {
    background: rgba(18, 23, 34, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 12px 16px;
    font-family: var(--font-mono);
    font-size: 0.82rem;
  }
  .summary-line {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .summary-line:last-child { margin-bottom: 0; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.06); font-weight: 700; }

  /* Submit Button */
  .btn-submit-bid {
    width: 100%;
    padding: 16px;
    background: linear-gradient(180deg, #FAF1D4 0%, #DFB843 40%, #B88E28 100%);
    color: #07080B;
    border: 1px solid #DFB843;
    border-radius: 8px;
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 20px rgba(223, 184, 67, 0.35);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .btn-submit-bid:hover {
    transform: translateY(-2px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 6px 28px rgba(223, 184, 67, 0.5);
  }
  .btn-submit-bid:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Positions Table */
  .positions-panel {
    margin-top: 24px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.82rem;
  }
  th, td {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    text-align: left;
  }
  th { color: var(--muted); font-size: 0.74rem; text-transform: uppercase; }
  .badge-filled {
    color: #34D399;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 2px 8px;
    border-radius: 4px;
  }

  /* Execution notification toast */
  #toast {
    display: none;
    position: fixed;
    top: 24px;
    right: 24px;
    background: #0E1524;
    border: 1px solid var(--accent);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7), 0 0 20px var(--accent-glow);
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 1000;
    max-width: 420px;
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }
</style>
</head>
<body>

  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="brand-title">QUANTERRAOS</a>
      <span class="brand-sub">KALSHI 15M DESK</span>
    </div>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/kalshi" class="active">15m Bidding</a>
      <a href="/predictions">Predictions</a>
      <a href="/autopilot">Autopilot</a>
      <a href="/calibration">Calibration</a>
      <a href="/wallet">Wallet ($)</a>
      <a href="/account" class="user-badge" id="nav-user-label">${userEmail ? userEmail : "Guest Operator"} (${userTier.toUpperCase()})</a>
    </div>
  </nav>

  <main>
    <div class="terminal-header">
      <div>
        <h1>Kalshi Above/Below Desk (15M &amp; 1H)</h1>
        <p class="subtitle">Live continuous orderbook, Quanterra spot composite proxy, and dual-mode execution.</p>
      </div>

      <div class="mode-pill-wrap">
        <button id="mode-sandbox" class="mode-btn active-sandbox" onclick="setMode('sandbox')">
          🟢 SANDBOX ($10k Paper Wallet)
        </button>
        <button id="mode-live" class="mode-btn" onclick="setMode('live')">
          🔴 LIVE KALSHI API ($100.29 Real)
        </button>
      </div>
    </div>

    <div class="grid-layout">
      <!-- Left Column: Market HUD -->
      <div class="panel">
        <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="panel-series-title">KALSHI CONTRACT TELEMETRY</span>
            <div style="display:inline-flex; gap:4px; margin-left:6px;">
              <button type="button" id="btn-tf-15m" class="chip active" style="padding:2px 8px; font-size:0.72rem; cursor:pointer;" onclick="switchTimeframe('15m')">15M (KXBTC15M)</button>
              <button type="button" id="btn-tf-1h" class="chip" style="padding:2px 8px; font-size:0.72rem; cursor:pointer;" onclick="switchTimeframe('1h')">1H (KXBTCD)</button>
            </div>
          </div>
          <span id="market-status-badge" style="color:var(--green);">● ACTIVE</span>
        </div>

        <div class="ticker-row">
          <div>
            <div class="contract-ticker" id="market-ticker">KXBTC15M-LOADING…</div>
            <div class="contract-target" id="market-target">Settlement strike: $—</div>
          </div>
          <div class="timer-pill">
            <span class="pulse-dot"></span>
            <span id="countdown-timer">--:-- left</span>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-label" title="Quanterra BTC Spot Composite (Coinbase/Kraken/Bitstamp median proxy). Official CME CF BRTI requires an institutional license.">SPOT COMPOSITE (BRTI PROXY)</div>
            <div class="stat-val" id="brti-spot">$—</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">STRIKE GAP</div>
            <div class="stat-val" id="strike-gap">—</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">ESTIMATED VOL (15M)</div>
            <div class="stat-val">0.42%</div>
          </div>
        </div>

        <div class="orderbook-box">
          <div class="depth-side yes">
            <div class="side-tag yes">BUY YES (Settles ≥ Strike)</div>
            <div class="price-spread">
              <div>
                <div class="quote-col">BID</div>
                <div class="quote-num" id="yes-bid">—¢</div>
              </div>
              <div>
                <div class="quote-col">ASK</div>
                <div class="quote-num" id="yes-ask">—¢</div>
              </div>
            </div>
          </div>

          <div class="depth-side no">
            <div class="side-tag no">BUY NO (Settles &lt; Strike)</div>
            <div class="price-spread">
              <div>
                <div class="quote-col">BID</div>
                <div class="quote-num" id="no-bid">—¢</div>
              </div>
              <div>
                <div class="quote-col">ASK</div>
                <div class="quote-num" id="no-ask">—¢</div>
              </div>
            </div>
          </div>
        </div>

        <div class="fair-value-banner">
          <div>
            <strong>Falcon Fair-Value Cross-Check:</strong>
            <span id="model-prob" style="color:var(--accent); font-family:var(--font-mono); font-weight:700; margin-left:6px;">--% P(YES)</span>
          </div>
          <div id="model-edge" style="font-family:var(--font-mono); font-size:0.78rem; color:var(--text-dim);">
            Scoring on 1,316 settled windows
          </div>
        </div>
      </div>

      <!-- Right Column: Bidding Ticket -->
      <div class="panel">
        <div class="panel-title">
          <span>PLACE 15M BID</span>
          <span id="balance-pill" style="font-size:0.75rem; color:var(--text-dim);">Balance: Loading…</span>
        </div>

        <div class="bidding-slip">
          <!-- Side Selection -->
          <div class="side-selector">
            <button id="btn-side-yes" class="side-btn selected-yes" onclick="selectSide('yes')">
              BUY YES<br><span style="font-size:0.75rem; font-weight:400;">P(≥ Strike)</span>
            </button>
            <button id="btn-side-no" class="side-btn" onclick="selectSide('no')">
              BUY NO<br><span style="font-size:0.75rem; font-weight:400;">P(&lt; Strike)</span>
            </button>
          </div>

          <!-- Limit Price -->
          <div class="form-group">
            <div class="form-label">
              <span>LIMIT BID PRICE</span>
              <span id="price-cents-label">50¢ ($0.50)</span>
            </div>
            <div class="price-input-wrap">
              <input type="number" id="input-price" class="price-input" min="1" max="99" value="50" oninput="updateCalculations()">
              <button class="step-btn" onclick="stepPrice(-1)">-1¢</button>
              <button class="step-btn" onclick="stepPrice(1)">+1¢</button>
            </div>
            <div class="quick-chips">
              <button class="chip-btn" onclick="setPriceShortcut('bid')">Best Bid</button>
              <button class="chip-btn" onclick="setPriceShortcut('mid')">Mid Price</button>
              <button class="chip-btn" onclick="setPriceShortcut('ask')">Best Ask</button>
            </div>
          </div>

          <!-- Quantity -->
          <div class="form-group">
            <div class="form-label">
              <span>CONTRACTS COUNT</span>
              <span id="contracts-label">10 contracts</span>
            </div>
            <input type="number" id="input-count" class="price-input" min="1" max="1000" value="10" oninput="updateCalculations()">
            <div class="quick-chips">
              <button class="chip-btn" onclick="setCount(1)">1</button>
              <button class="chip-btn" onclick="setCount(5)">5</button>
              <button class="chip-btn" onclick="setCount(10)">10</button>
              <button class="chip-btn" onclick="setCount(25)">25</button>
              <button class="chip-btn" onclick="setCount(50)">50</button>
              <button class="chip-btn" onclick="setCount(100)">100</button>
            </div>
          </div>

          <!-- Order Summary Box -->
          <div class="order-summary-box">
            <div class="summary-line">
              <span style="color:var(--muted);">Total Cost:</span>
              <span id="summary-cost" style="color:#FFFFFF;">$5.00</span>
            </div>
            <div class="summary-line">
              <span style="color:var(--muted);">Payout at Settle:</span>
              <span id="summary-payout" style="color:#FFFFFF;">$10.00 ($1.00/contract)</span>
            </div>
            <div class="summary-line">
              <span style="color:var(--muted);">Potential Return:</span>
              <span id="summary-return" style="color:var(--green);">+$5.00 (+100%)</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button id="btn-submit" class="btn-submit-bid" onclick="submitBid()">
            ⚡ PLACE 15M BID (SANDBOX)
          </button>
        </div>
      </div>
    </div>

    <!-- Active Bids Table -->
    <div class="panel positions-panel">
      <div class="panel-title">
        <span>MY ACTIVE 15-MINUTE BIDS &amp; POSITIONS</span>
        <button class="chip-btn" onclick="loadUserBids()">↻ Refresh</button>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Order ID</th>
              <th>Contract</th>
              <th>Side</th>
              <th>Price</th>
              <th>Count</th>
              <th>Total Cost</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody id="bids-table-body">
            <tr>
              <td colspan="10" style="text-align:center; color:var(--muted); padding:24px;">
                No bids placed yet tonight. Select your side and place your first 15m bid above!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Settlement & Benchmark Disclaimer -->
    <div style="margin-top:24px; padding:16px 20px; border-radius:8px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); font-size:0.75rem; color:var(--muted); line-height:1.6;">
      <strong style="color:var(--text); display:block; margin-bottom:4px; letter-spacing:0.04em;">BENCHMARK &amp; SETTLEMENT DESIGNATION</strong>
      Kalshi event contracts (<code>KXBTC15M</code> and <code>KXBTCD</code>) settle against the official <strong>CME CF Bitcoin Real-Time Index (BRTI)</strong> 60-second TWAP prior to close. The spot index displayed on this terminal is the <strong>Quanterra BTC Spot Composite</strong> (real-time median of Tier 1 spot venues: Coinbase, Kraken, Bitstamp) serving as an empirical proxy. QuanterraOS does not represent its composite index as the official BRTI or CME benchmark, which requires an institutional feed license and is never synthesized.
    </div>
  </main>

  <div id="toast">
    <div id="toast-title" style="font-weight:700; color:var(--accent); margin-bottom:4px;">ORDER BROADCASTED</div>
    <div id="toast-body" style="color:var(--text-dim); line-height:1.4;">Your bid was placed successfully.</div>
  </div>

  ${ASSISTANT_WIDGET_HTML}

<script>
let currentMode = 'sandbox';
let currentSide = 'yes';
let activeMarket = null;
let userBalance = { sandbox: 10000, live: 100.29 };
let closeTimeMs = 0;

// Audio Chime (Web Audio API)
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

function showToast(title, body) {
  const t = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-body').textContent = body;
  t.style.display = 'block';
  playChime();
  setTimeout(() => { t.style.display = 'none'; }, 4500);
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-sandbox').className = 'mode-btn ' + (mode === 'sandbox' ? 'active-sandbox' : '');
  document.getElementById('mode-live').className = 'mode-btn ' + (mode === 'live' ? 'active-live' : '');
  const btn = document.getElementById('btn-submit');
  btn.textContent = mode === 'sandbox' ? '⚡ PLACE 15M BID (SANDBOX)' : '⚡ PLACE REAL KALSHI BID';
  updateBalanceDisplay();
}

function selectSide(side) {
  currentSide = side;
  document.getElementById('btn-side-yes').className = 'side-btn ' + (side === 'yes' ? 'selected-yes' : '');
  document.getElementById('btn-side-no').className = 'side-btn ' + (side === 'no' ? 'selected-no' : '');
  if (activeMarket) {
    const priceInput = document.getElementById('input-price');
    if (side === 'yes') {
      priceInput.value = Math.round((activeMarket.yes_bid || 0.50) * 100);
    } else {
      priceInput.value = Math.round((activeMarket.no_bid || 0.50) * 100);
    }
  }
  updateCalculations();
}

function stepPrice(cents) {
  const p = document.getElementById('input-price');
  p.value = Math.max(1, Math.min(99, Number(p.value) + cents));
  updateCalculations();
}

function setPriceShortcut(type) {
  if (!activeMarket) return;
  const p = document.getElementById('input-price');
  if (currentSide === 'yes') {
    if (type === 'bid') p.value = Math.round(activeMarket.yes_bid * 100);
    if (type === 'mid') p.value = Math.round(((activeMarket.yes_bid + activeMarket.yes_ask) / 2) * 100);
    if (type === 'ask') p.value = Math.round(activeMarket.yes_ask * 100);
  } else {
    if (type === 'bid') p.value = Math.round(activeMarket.no_bid * 100);
    if (type === 'mid') p.value = Math.round(((activeMarket.no_bid + activeMarket.no_ask) / 2) * 100);
    if (type === 'ask') p.value = Math.round(activeMarket.no_ask * 100);
  }
  updateCalculations();
}

function setCount(count) {
  document.getElementById('input-count').value = count;
  updateCalculations();
}

function updateCalculations() {
  const price = Math.max(1, Math.min(99, Number(document.getElementById('input-price').value || 50))) / 100;
  const count = Math.max(1, Number(document.getElementById('input-count').value || 1));
  const cost = price * count;
  const payout = 1.00 * count;
  const profit = payout - cost;
  const roi = Math.round((profit / cost) * 100);

  document.getElementById('price-cents-label').textContent = Math.round(price * 100) + '¢ ($' + price.toFixed(2) + ')';
  document.getElementById('contracts-label').textContent = count + ' contracts';
  document.getElementById('summary-cost').textContent = '$' + cost.toFixed(2);
  document.getElementById('summary-payout').textContent = '$' + payout.toFixed(2) + ' ($1.00/contract)';
  document.getElementById('summary-return').textContent = '+$' + profit.toFixed(2) + ' (+' + roi + '%)';
}

function updateBalanceDisplay() {
  const pill = document.getElementById('balance-pill');
  if (currentMode === 'sandbox') {
    pill.textContent = 'Sandbox Wallet: $' + Number(userBalance.sandbox).toLocaleString(undefined, { minimumFractionDigits: 2 });
  } else {
    pill.textContent = 'Kalshi Real Cash: $' + Number(userBalance.live).toLocaleString(undefined, { minimumFractionDigits: 2 });
  }
}

// Timeframe toggle state: '15m' or '1h'
var currentTimeframe = '15m';

function switchTimeframe(tf) {
  currentTimeframe = tf;
  const btn15m = document.getElementById('btn-tf-15m');
  const btn1h = document.getElementById('btn-tf-1h');
  if (btn15m && btn1h) {
    if (tf === '15m') {
      btn15m.classList.add('active');
      btn1h.classList.remove('active');
      document.getElementById('panel-series-title').textContent = '15M CONTRACT TELEMETRY';
    } else {
      btn1h.classList.add('active');
      btn15m.classList.remove('active');
      document.getElementById('panel-series-title').textContent = '1H CONTRACT TELEMETRY';
    }
  }
  document.getElementById('market-ticker').textContent = 'SWITCHING...';
  fetchMarket();
}

// Polling live market data
async function fetchMarket() {
  try {
    const res = await fetch('/api/kalshi/active?timeframe=' + currentTimeframe);
    if (!res.ok) return;
    const m = await res.json();
    if (!m || !m.ticker) return;
    activeMarket = m;
    closeTimeMs = Date.parse(m.close_time);

    document.getElementById('market-ticker').textContent = m.ticker;
    const strikeText = m.subtitle ? m.subtitle : ('Settlement strike: $' + Number(m.floor_strike).toLocaleString());
    document.getElementById('market-target').textContent = strikeText;
    document.getElementById('yes-bid').textContent = Math.round(m.yes_bid * 100) + '¢';
    document.getElementById('yes-ask').textContent = Math.round(m.yes_ask * 100) + '¢';
    document.getElementById('no-bid').textContent = Math.round(m.no_bid * 100) + '¢';
    document.getElementById('no-ask').textContent = Math.round(m.no_ask * 100) + '¢';

    if (m.spot) {
      document.getElementById('brti-spot').textContent = '$' + Number(m.spot).toLocaleString();
      const diff = m.spot - m.floor_strike;
      document.getElementById('strike-gap').textContent = (diff >= 0 ? '+' : '') + '$' + diff.toFixed(2);
      document.getElementById('strike-gap').style.color = diff >= 0 ? 'var(--green)' : 'var(--rose)';
    }

    if (m.model_prob !== undefined) {
      document.getElementById('model-prob').textContent = Math.round(m.model_prob * 100) + '% P(YES)';
    }
  } catch (e) {
    console.warn('Failed to poll market:', e);
  }
}

// Countdown timer
function tickTimer() {
  if (!closeTimeMs) return;
  const now = Date.now();
  const left = Math.max(0, Math.floor((closeTimeMs - now) / 1000));
  const mins = Math.floor(left / 60);
  const secs = left % 60;
  document.getElementById('countdown-timer').textContent = 
    String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0') + ' left';
  if (left === 0) {
    fetchMarket();
    loadUserBids();
  }
}
setInterval(tickTimer, 1000);

async function loadBalances() {
  try {
    const res = await fetch('/api/kalshi/balance');
    if (res.ok) {
      const data = await res.json();
      userBalance.sandbox = data.sandbox_usd || 10000;
      userBalance.live = data.live_usd || 100.29;
      updateBalanceDisplay();
    }
  } catch (e) {}
}

async function loadUserBids() {
  try {
    const res = await fetch('/api/kalshi/bids');
    if (!res.ok) return;
    const bids = await res.json();
    const tbody = document.getElementById('bids-table-body');
    if (!bids || bids.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--muted); padding:24px;">No bids placed yet tonight. Select your side and place your first 15m bid above!</td></tr>';
      return;
    }

    tbody.innerHTML = bids.map(b => {
      const timeStr = new Date(b.timestamp).toLocaleTimeString();
      const isYes = (b.side || '').toUpperCase() === 'YES';
      const sideClass = isYes ? 'color:var(--green); font-weight:700;' : 'color:var(--rose); font-weight:700;';
      const cost = Number(b.entryPrice || 0.5) * Number(b.size || 1);
      return '<tr>' +
        '<td>' + timeStr + '</td>' +
        '<td style="color:var(--muted);">' + b.id.slice(0, 14) + '…</td>' +
        '<td><strong>' + b.marketId + '</strong></td>' +
        '<td style="' + sideClass + '">' + (b.side || '').toUpperCase() + '</td>' +
        '<td>$' + Number(b.entryPrice).toFixed(2) + '</td>' +
        '<td>' + b.size + '</td>' +
        '<td>$' + cost.toFixed(2) + '</td>' +
        '<td><span style="font-size:0.75rem; color:' + (b.mode === 'PAPER' ? 'var(--green)' : 'var(--rose)') + ';">' + (b.mode === 'PAPER' ? 'SANDBOX' : 'LIVE') + '</span></td>' +
        '<td><span class="badge-filled">' + b.status + '</span></td>' +
        '<td>' + (b.pnl ? '$' + b.pnl : '—') + '</td>' +
      '</tr>';
    }).join('');
  } catch (e) {}
}

async function submitBid() {
  const btn = document.getElementById('btn-submit');
  if (!activeMarket) {
    alert('Still connecting to live Kalshi 15m stream. Please try again in a few seconds.');
    return;
  }

  const price = Number(document.getElementById('input-price').value) / 100;
  const count = Number(document.getElementById('input-count').value);

  if (currentMode === 'live') {
    const confirmLive = confirm('Confirm real Kalshi order: ' + count + ' contracts of ' + currentSide.toUpperCase() + ' @ $' + price.toFixed(2) + ' (Total cost: $' + (price * count).toFixed(2) + ' from real Kalshi balance)?');
    if (!confirmLive) return;
  }

  btn.disabled = true;
  btn.textContent = 'SUBMITTING TO KALSHI…';

  try {
    const res = await fetch('/api/kalshi/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: activeMarket.ticker,
        side: currentSide,
        price,
        count,
        mode: currentMode,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Bid rejected');
    }

    showToast('BID CONFIRMED & FILLED', data.message || ('Filled ' + count + 'x ' + currentSide.toUpperCase() + ' @ $' + price.toFixed(2)));
    loadBalances();
    loadUserBids();
  } catch (err) {
    alert('Failed to place bid: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = currentMode === 'sandbox' ? '⚡ PLACE 15M BID (SANDBOX)' : '⚡ PLACE REAL KALSHI BID';
  }
}

// Initial load
fetchMarket();
loadBalances();
loadUserBids();
updateCalculations();
setInterval(fetchMarket, 4000);
</script>
</body>
</html>`;
}
