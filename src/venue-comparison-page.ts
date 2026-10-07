/**
 * QuanterraOS Cross-Venue Friction & Risk Comparison Terminal (/compare)
 *
 * Side-by-side microstructure comparison between:
 * 1. Kalshi (CFTC regulated, USD ACH, CME CF BRTI 60s TWAP, non-linear round-up taker fee)
 * 2. Polymarket (Polygon USDC, UMA Optimistic Oracle, amortized gas/bridge friction)
 *
 * Adheres strictly to:
 * - Rule B4: Strictly empirical, zero superlatives.
 * - Rule B5: $0.00 capital risk, decision and risk companion.
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { VENUE_SPECS } from "./polymarket-engine.ts";

export function renderVenueComparisonPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Cross-Venue Friction &amp; Risk Comparison — QuanterraOS</title>
  <meta name="description" content="Side-by-side transaction cost and settlement risk comparison between Kalshi and Polymarket prediction contracts.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --border: rgba(212, 175, 55, 0.2);
      --border-subtle: rgba(212, 175, 55, 0.08);
      --accent: #DFB843;
      --green: #10B981;
      --rose: #F43F5E;
      --cyan: #38BDF8;
      --text: #F8FAFC;
      --muted: #64748B;
      --text-dim: #94A3B8;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.5;
      font-size: 15px;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }

    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 24px;
      background: rgba(6, 7, 10, 0.92);
      border-bottom: 1px solid var(--border);
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
    .btn-gold {
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
      text-decoration: none;
      cursor: pointer;
    }

    .container { max-width: 1140px; margin: 0 auto; padding: 40px 24px 0; }
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
    h1 { font-size: 2.1rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 10px; }
    .lead { color: var(--muted); font-size: 0.95rem; max-width: 780px; margin-bottom: 32px; }

    .control-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .input-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }
    .input-label-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 0.82rem;
    }
    .input-label-row label { color: var(--muted); font-weight: 500; }
    .input-label-row span { font-family: var(--font-mono); font-weight: 700; }
    input[type="range"] {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }
    .number-input {
      width: 100%;
      background: rgba(6, 9, 14, 0.85);
      border: 1px solid var(--border);
      color: #FFFFFF;
      padding: 8px 12px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      border-radius: 4px;
      outline: none;
    }
    .preset-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .preset-btn:hover {
      background: rgba(223, 184, 67, 0.15);
      color: #FFFFFF;
    }

    /* Comparison Grid */
    .compare-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    @media (max-width: 820px) {
      .compare-grid { grid-template-columns: 1fr; }
    }

    .venue-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      position: relative;
    }
    .venue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .venue-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .venue-tag {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: 600;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.85rem;
    }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { color: var(--muted); }
    .stat-val { font-family: var(--font-mono); font-weight: 600; color: #FFFFFF; }

    .verdict-box {
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.08) 0%, rgba(12, 15, 23, 0.95) 100%);
      border: 1px solid rgba(223, 184, 67, 0.3);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: center;
    }
  </style>
</head>
<body>

  <nav class="top-nav">
    <a href="/" class="nav-brand">
      <span class="brand-dot"></span>
      QUANTERRAOS
      <span>/ VENUES</span>
    </a>
    <div class="nav-links">
      <a href="/calculator">Calculator</a>
      <a href="/compare" class="active" style="color:var(--accent); font-weight:600;">Venues</a>
      <a href="/journal">Journal</a>
      <a href="/dashboard">Terminal</a>
    </div>
    <div>
      <a href="/calculator" class="btn-gold">+ True-Cost Check</a>
    </div>
  </nav>

  <main class="container">
    <div class="eyebrow">Microstructure Intelligence · Cross-Venue Arbitrage</div>
    <h1>Kalshi vs. Polymarket Comparison</h1>
    <p class="lead">
      Real-time friction and settlement comparison across CFTC-regulated exchange contracts and decentralized on-chain prediction markets.
    </p>

    <!-- Interactive Parameter Card -->
    <div class="control-card">
      <div class="input-grid">
        <!-- Contract Ask Price -->
        <div>
          <div class="input-label-row">
            <label for="slider-price" style="color:#FFFFFF; font-weight:600;">Contract Ask Price</label>
            <span id="label-price" style="color:#DFB843;">51¢ ($0.51)</span>
          </div>
          <input type="range" id="slider-price" min="1" max="99" value="51" oninput="handleSliderSnap('slider-price', [10,25,50,51,75,90]); recalcCompare();" style="accent-color:#DFB843;">
          <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
            <button type="button" class="preset-btn" onclick="setPrice(10)">10¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(25)">25¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(50)">50¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(51)" style="border-color:#DFB843; color:#DFB843;">51¢ (Std)</button>
            <button type="button" class="preset-btn" onclick="setPrice(75)">75¢</button>
            <button type="button" class="preset-btn" onclick="setPrice(90)">90¢</button>
          </div>
        </div>

        <!-- Contract Count -->
        <div>
          <div class="input-label-row">
            <label for="input-count" style="color:#FFFFFF; font-weight:600;">Contract Count (Order Size)</label>
            <span id="label-count" style="color:#38BDF8;">10 contracts</span>
          </div>
          <input type="number" id="input-count" class="number-input" value="10" min="1" max="10000" oninput="recalcCompare()">
          <div style="display:flex; gap:6px; margin-top:6px;">
            <button type="button" class="preset-btn" onclick="setCount(1)">1 ct</button>
            <button type="button" class="preset-btn" onclick="setCount(10)">10 ct</button>
            <button type="button" class="preset-btn" onclick="setCount(100)">100 ct</button>
            <button type="button" class="preset-btn" onclick="setCount(1000)">1,000 ct</button>
          </div>
        </div>

        <!-- Assessed Probability -->
        <div>
          <div class="input-label-row">
            <label for="slider-prob" style="color:#FFFFFF; font-weight:600;">Your Assessed Win Prob</label>
            <span id="label-prob" style="color:#38BDF8;">55.0%</span>
          </div>
          <input type="range" id="slider-prob" min="1" max="99" value="55" oninput="handleSliderSnap('slider-prob', [35,50,55,65,75]); recalcCompare();" style="accent-color:#38BDF8;">
          <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
            <button type="button" class="preset-btn" onclick="setProb(35)">35%</button>
            <button type="button" class="preset-btn" onclick="setProb(50)">50% (Coin)</button>
            <button type="button" class="preset-btn" onclick="setProb(55)" style="border-color:#38BDF8; color:#38BDF8;">55% (Std)</button>
            <button type="button" class="preset-btn" onclick="setProb(65)">65%</button>
            <button type="button" class="preset-btn" onclick="setProb(75)">75%</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparative Verdict Card -->
    <div class="verdict-box" id="verdict-card">
      <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">
        CROSS-VENUE ARBITRAGE &amp; FRICTION VERDICT
      </div>
      <div style="font-size:1.5rem; font-weight:700; color:#FFFFFF; margin-bottom:6px;" id="verdict-title">
        Analyzing Venues...
      </div>
      <div style="font-size:0.85rem; color:var(--text-dim); max-width:680px; margin:0 auto;" id="verdict-desc">
        Calculating transaction drag, round-up friction, and settlement risk differential...
      </div>
    </div>

    <!-- Side-by-Side Comparison Grid -->
    <div class="compare-grid">
      <!-- Kalshi Card -->
      <div class="venue-card" style="border-color:rgba(223,184,67,0.35);">
        <div class="venue-header">
          <div>
            <div class="venue-name">Kalshi</div>
            <div style="font-size:0.75rem; color:var(--muted);">CFTC-Designated Contract Market</div>
          </div>
          <span class="venue-tag" style="background:rgba(223,184,67,0.15); border:1px solid #DFB843; color:#DFB843;">
            CFTC REGULATED
          </span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Initial Capital Outlay</span>
          <span class="stat-val" id="kalshi-cost">$5.10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Exchange Taker Fee</span>
          <span class="stat-val" style="color:var(--rose);" id="kalshi-fee">$0.18 (1.8¢/ct)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Gas &amp; Bridge Friction</span>
          <span class="stat-val" style="color:var(--green);">$0.00 (Zero Web3 Gas)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">All-In Maximum Loss</span>
          <span class="stat-val" id="kalshi-max-loss">$5.28</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Required Breakeven Win Rate</span>
          <span class="stat-val" style="color:var(--accent); font-weight:700;" id="kalshi-breakeven">52.80%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Settlement Oracle</span>
          <span class="stat-val mono" style="font-size:0.75rem;">CME CF BRTI 60s TWAP</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Resolution Mechanism</span>
          <span class="stat-val" style="color:var(--green); font-size:0.8rem;">Deterministic Math (0.0% Dispute)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Net EV Expectancy</span>
          <span class="stat-val" id="kalshi-net-ev">+$0.22</span>
        </div>

        <div style="margin-top:20px;">
          <button type="button" onclick="saveVenueCheck('kalshi-15m')" class="btn-gold" style="width:100%; justify-content:center;">
            Save Kalshi Check to Journal &rarr;
          </button>
        </div>
      </div>

      <!-- Polymarket Card -->
      <div class="venue-card" style="border-color:rgba(56,189,248,0.35);">
        <div class="venue-header">
          <div>
            <div class="venue-name">Polymarket</div>
            <div style="font-size:0.75rem; color:var(--muted);">Decentralized Order Book (Polygon)</div>
          </div>
          <span class="venue-tag" style="background:rgba(56,189,248,0.15); border:1px solid #38BDF8; color:#38BDF8;">
            WEB3 / POLYGON
          </span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Initial Capital Outlay</span>
          <span class="stat-val" id="poly-cost">$5.10</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Protocol / Spread Friction</span>
          <span class="stat-val" style="color:var(--rose);" id="poly-fee">$0.05 (0.5¢/ct)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Polygon Gas &amp; Bridge Drag</span>
          <span class="stat-val" style="color:var(--rose);" id="poly-gas">+$0.15 (Amortized Gas)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">All-In Maximum Loss</span>
          <span class="stat-val" id="poly-max-loss">$5.30</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Required Breakeven Win Rate</span>
          <span class="stat-val" style="color:var(--cyan); font-weight:700;" id="poly-breakeven">53.00%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Settlement Oracle</span>
          <span class="stat-val mono" style="font-size:0.75rem;">Binance / Chainlink Spot</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Resolution Mechanism</span>
          <span class="stat-val" style="color:var(--rose); font-size:0.8rem;">UMA Optimistic (2h Dispute Window)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Net EV Expectancy</span>
          <span class="stat-val" id="poly-net-ev">+$0.20</span>
        </div>

        <div style="margin-top:20px;">
          <button type="button" onclick="saveVenueCheck('polymarket-15m')" class="btn-gold" style="width:100%; justify-content:center; background:linear-gradient(180deg, #E0F2FE 0%, #38BDF8 100%); border-color:#38BDF8;">
            Save Polymarket Check to Journal &rarr;
          </button>
        </div>
      </div>
    <!-- Compliance & Rule B5 Safeguards -->
    <div style="margin-top:40px; padding:20px; border-radius:8px; background:rgba(212,175,55,0.04); border:1px solid var(--border-subtle); text-align:center;">
      <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent); font-weight:700; margin-bottom:6px;">
        DECISION &amp; RISK COMPANION · $0.00 CAPITAL RISK
      </div>
      <div style="font-size:0.8rem; color:var(--text-dim); max-width:760px; margin:0 auto; line-height:1.6;">
        QuanterraOS evaluates market transaction friction, order-level fee ceilings, and settlement mechanisms. Under Rule B5 Standby Lock, all simulated evaluations execute with $0.00 live financial exposure. Neither Kalshi nor Polymarket calculations constitute financial advice or guarantee trading performance.
      </div>
    </div>
  </main>

  <script>
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
      recalcCompare();
    }

    function setProb(pr) {
      triggerHaptic();
      document.getElementById('slider-prob').value = pr;
      recalcCompare();
    }

    function setCount(n) {
      triggerHaptic();
      document.getElementById('input-count').value = n;
      recalcCompare();
    }

    function recalcCompare() {
      const price = Number(document.getElementById('slider-price').value) / 100;
      const count = Math.max(1, Number(document.getElementById('input-count').value) || 1);
      const prob = Number(document.getElementById('slider-prob').value) / 100;

      document.getElementById('label-price').textContent = (price * 100).toFixed(0) + '¢ ($' + price.toFixed(2) + ')';
      document.getElementById('label-count').textContent = count + ' contract' + (count > 1 ? 's' : '');
      document.getElementById('label-prob').textContent = (prob * 100).toFixed(1) + '%';

      // 1. Kalshi Math
      const rawKalshiFee = 0.07 * count * price * (1 - price);
      const kalshiTotalFee = Math.ceil(Number((rawKalshiFee * 100).toFixed(6))) / 100;
      const kalshiFeePerCt = kalshiTotalFee / count;
      const kalshiCost = Number((price * count).toFixed(2));
      const kalshiMaxLoss = Number((kalshiCost + kalshiTotalFee).toFixed(2));
      const kalshiBreakeven = Number(((price + kalshiFeePerCt) * 100).toFixed(2));
      const kalshiNetEv = Number(((prob - price - kalshiFeePerCt) * count).toFixed(2));

      document.getElementById('kalshi-cost').textContent = '$' + kalshiCost.toFixed(2);
      document.getElementById('kalshi-fee').textContent = '$' + kalshiTotalFee.toFixed(2) + ' (' + (kalshiFeePerCt * 100).toFixed(2) + '¢/ct)';
      document.getElementById('kalshi-max-loss').textContent = '$' + kalshiMaxLoss.toFixed(2);
      document.getElementById('kalshi-breakeven').textContent = kalshiBreakeven.toFixed(2) + '%';
      document.getElementById('kalshi-net-ev').textContent = (kalshiNetEv >= 0 ? '+' : '') + '$' + kalshiNetEv.toFixed(2);
      document.getElementById('kalshi-net-ev').style.color = kalshiNetEv >= 0 ? 'var(--green)' : 'var(--rose)';

      // 2. Polymarket Math
      const polyFeePerCt = 0.005;
      const polyExchangeFee = Number((polyFeePerCt * count).toFixed(2));
      const polyGas = count >= 50 ? 0.08 : 0.15;
      const polyTotalFriction = Number((polyExchangeFee + polyGas).toFixed(2));
      const polyCost = Number((price * count).toFixed(2));
      const polyEffectiveFeePerCt = polyTotalFriction / count;
      const polyMaxLoss = Number((polyCost + polyTotalFriction).toFixed(2));
      const polyBreakeven = Number(((price + polyEffectiveFeePerCt) * 100).toFixed(2));
      const polyNetEv = Number(((prob - price - polyEffectiveFeePerCt) * count).toFixed(2));

      document.getElementById('poly-cost').textContent = '$' + polyCost.toFixed(2);
      document.getElementById('poly-fee').textContent = '$' + polyExchangeFee.toFixed(2) + ' (0.50¢/ct)';
      document.getElementById('poly-gas').textContent = '+$' + polyGas.toFixed(2) + ' gas';
      document.getElementById('poly-max-loss').textContent = '$' + polyMaxLoss.toFixed(2);
      document.getElementById('poly-breakeven').textContent = polyBreakeven.toFixed(2) + '%';
      document.getElementById('poly-net-ev').textContent = (polyNetEv >= 0 ? '+' : '') + '$' + polyNetEv.toFixed(2);
      document.getElementById('poly-net-ev').style.color = polyNetEv >= 0 ? 'var(--green)' : 'var(--rose)';

      // 3. Verdict
      const titleEl = document.getElementById('verdict-title');
      const descEl = document.getElementById('verdict-desc');
      if (kalshiTotalFee < polyTotalFriction) {
        const delta = (polyTotalFriction - kalshiTotalFee).toFixed(2);
        const bps = Math.round(((polyBreakeven - kalshiBreakeven)) * 100);
        titleEl.textContent = 'Kalshi is Cheaper (Save $' + delta + ' / ' + bps + ' bps)';
        titleEl.style.color = 'var(--accent)';
        descEl.textContent = 'For an order of ' + count + ' contracts, Kalshi exhibits lower all-in friction ($' + kalshiTotalFee.toFixed(2) + ' vs $' + polyTotalFriction.toFixed(2) + ') because Web3 gas drag on Polygon outweighs exchange fees. Kalshi also settles deterministically via CME CF BRTI TWAP without UMA dispute risk.';
      } else if (polyTotalFriction < kalshiTotalFee) {
        const delta = (kalshiTotalFee - polyTotalFriction).toFixed(2);
        const bps = Math.round(((kalshiBreakeven - polyBreakeven)) * 100);
        titleEl.textContent = 'Polymarket is Cheaper (Save $' + delta + ' / ' + bps + ' bps)';
        titleEl.style.color = 'var(--cyan)';
        descEl.textContent = 'For a position of ' + count + ' contracts, Polymarket’s low order-book spread fee saves $' + delta + ' compared to Kalshi’s aggregate taker fee. Note: Polymarket introduces an optimistic 2-hour UMA oracle challenge window.';
      } else {
        titleEl.textContent = 'Friction is Identical';
        titleEl.style.color = '#FFFFFF';
        descEl.textContent = 'All-in transaction friction between both venues is identical for this lot size. Select Kalshi for CFTC cash settlement or Polymarket for self-custodial on-chain tokens.';
      }
    }

    function saveVenueCheck(venue) {
      const price = Number(document.getElementById('slider-price').value) / 100;
      const count = Math.max(1, Number(document.getElementById('input-count').value) || 1);
      const prob = Number(document.getElementById('slider-prob').value) / 100;

      const rawFee = venue.startsWith('kalshi') 
        ? Math.ceil(Number((0.07 * count * price * (1 - price) * 100).toFixed(6))) / 100 
        : Number(((0.005 * count) + (count >= 50 ? 0.08 : 0.15)).toFixed(2));
      const feePerCt = rawFee / count;
      const breakeven = Number(((price + feePerCt) * 100).toFixed(2));

      const checkData = {
        venue: venue,
        pricingBasis: 'executable_ask',
        price: price,
        count: count,
        contractTicker: venue.startsWith('kalshi') ? 'KXBTC15M' : 'POLY-BTC15M',
        purchaseCost: Number((price * count).toFixed(2)),
        exchangeFee: rawFee,
        halfSpreadDrag: 0.0,
        totalDrag: Number(feePerCt.toFixed(4)),
        breakevenWinProb: breakeven,
        assessedWinProb: Number((prob * 100).toFixed(2)),
        netExpectedValue: Number(((prob - price - feePerCt) * count).toFixed(2)),
        settlementSource: venue.startsWith('kalshi') ? 'CME CF BRTI 60s TWAP' : 'Binance / Chainlink Spot via UMA'
      };

      try {
        localStorage.setItem('quanterraos_pending_check', JSON.stringify(checkData));
        fetch('/api/analytics/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkData)
        }).catch(function() {});
      } catch (_) {}

      window.location.href = '/journal';
    }

    recalcCompare();
  </script>
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
