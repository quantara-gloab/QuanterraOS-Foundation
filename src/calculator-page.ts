import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

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
        <a href="/kalshi">kalshi 15m</a>
        <a href="/calculator" class="active" style="color:var(--accent);font-weight:600;">ev calculator</a>
        <a href="/calibration">calibration</a>
        <a href="/index">composite index</a>
        <a href="/spread">spread monitor</a>
        <a href="/research">research</a>
        <a href="/pricing">pricing</a>
      </div>
    </div>
    <div>
      <a href="/kalshi" class="nav-cta">LIVE 15M DESK &rarr;</a>
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
          <div class="input-label-row">
            <label for="slider-price">Quoted Market Mid-Price</label>
            <span id="label-price">50¢ ($0.50)</span>
          </div>
          <input type="range" id="slider-price" min="1" max="99" value="50" oninput="recalc()">
        </div>

        <div class="input-group">
          <div class="input-label-row">
            <label for="slider-prob">Your Assessed Probability of Winning</label>
            <span id="label-prob">55.0%</span>
          </div>
          <input type="range" id="slider-prob" min="1" max="99" value="55" oninput="recalc()">
        </div>

        <div class="input-group">
          <div class="input-label-row">
            <label for="slider-spread">Observed Bid-Ask Spread</label>
            <span id="label-spread">2.0¢</span>
          </div>
          <input type="range" id="slider-spread" min="1" max="10" value="2" oninput="recalc()">
        </div>

        <div class="input-row-flex">
          <div class="input-group">
            <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:6px;">Contract Count</label>
            <input type="number" id="input-count" class="number-input" value="100" min="1" max="10000" oninput="recalc()">
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
          <strong>Why this matters on Kalshi 15M &amp; 1H:</strong> At 50¢ on Kalshi, exchange taker fees peak at exactly <strong>1.75¢ per contract</strong> ($0.07 × P × (1 − P)). Combined with a typical 2¢ spread (1¢ half-spread drag), you sacrifice <strong>2.75¢ of edge</strong> on entry. Picking the winner 52% of the time still produces a guaranteed financial loss.
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
        <div class="stat-row">
          <span class="stat-label">Expected Drag over 100 trades</span>
          <span class="stat-val" style="color:var(--rose);" id="val-100-drag">-$275.00</span>
        </div>

        <div style="margin-top:20px; text-align:center;">
          <a href="/kalshi" class="nav-cta" style="width:100%; justify-content:center; padding:10px;">TEST AGAINST LIVE KALSHI BTC DESK &rarr;</a>
        </div>
      </div>
    </div>
  </main>

  <script>
    var currentSide = 'above';

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
      const price = Number(document.getElementById('slider-price').value) / 100;
      const prob = Number(document.getElementById('slider-prob').value) / 100;
      const spread = Number(document.getElementById('slider-spread').value) / 100;
      const count = Math.max(1, Number(document.getElementById('input-count').value) || 1);
      const contractType = document.getElementById('select-contract').value;

      document.getElementById('label-price').textContent = (price * 100).toFixed(0) + '¢ ($' + price.toFixed(2) + ')';
      document.getElementById('label-prob').textContent = (prob * 100).toFixed(1) + '%';
      document.getElementById('label-spread').textContent = (spread * 100).toFixed(1) + '¢';

      let feePerContract = 0;
      let benchmark = "CME CF BRTI 60s TWAP";
      let cadence = "15-Minute Intraday (KXBTC15M)";

      if (contractType === 'kalshi-15m') {
        feePerContract = Math.ceil(0.07 * price * (1 - price) * 100) / 100;
        benchmark = "CME CF BRTI 60s TWAP";
        cadence = "15-Minute Intraday (KXBTC15M)";
        document.getElementById('contract-note').innerHTML = "<strong>Why this matters on Kalshi 15M:</strong> At 50¢ on Kalshi, exchange taker fees peak at exactly <strong>1.75¢ per contract</strong> ($0.07 × P × (1 − P)). Combined with a typical 2¢ spread (1¢ half-spread drag), you sacrifice <strong>2.75¢ of edge</strong> on entry. Picking the winner 52% of the time still produces a guaranteed financial loss.";
      } else if (contractType === 'kalshi-1h') {
        feePerContract = Math.ceil(0.07 * price * (1 - price) * 100) / 100;
        benchmark = "CME CF BRTI Hourly TWAP";
        cadence = "1-Hour Fixed Strike (KXBTCD)";
        document.getElementById('contract-note').innerHTML = "<strong>Why this matters on Kalshi 1H:</strong> On hourly fixed-strike contracts ($K or above), directional bets have a 60-minute drift horizon. At the 50¢ moneyness inflection, taker fee drag is <strong>1.75¢ per contract</strong>. Theta decay and fee friction require a strict >52.75% directional hit rate to break even.";
      } else {
        // Polymarket ~2% of profit when won
        feePerContract = prob * (1 - price) * 0.02;
        benchmark = "Chainlink / Binance Settlement";
        cadence = "15-Minute Polymarket";
        document.getElementById('contract-note').innerHTML = "<strong>Polymarket Fee Structure:</strong> Dynamic ~2% winner fee on positive payout. Note that off-chain cross-venue basis risk between Binance/Chainlink and the CME CF BRTI reference can cause divergent settlement outcomes.";
      }

      const halfSpreadDrag = spread / 2;
      const totalDrag = feePerContract + halfSpreadDrag;
      const grossEdge = prob - price;
      const netEvContract = grossEdge - totalDrag;
      const totalPnl = netEvContract * count;
      const breakevenProb = price + totalDrag;

      const isPositive = netEvContract > 0;
      const color = isPositive ? 'var(--green)' : 'var(--rose)';
      const sign = isPositive ? '+' : '';

      const heroVal = document.getElementById('val-net-ev-contract');
      heroVal.textContent = sign + '$' + netEvContract.toFixed(4);
      heroVal.style.color = color;

      const totalPnlEl = document.getElementById('val-total-pnl');
      totalPnlEl.textContent = sign + '$' + totalPnl.toFixed(2) + ' net expectancy on ' + count + ' contracts';
      totalPnlEl.style.color = isPositive ? 'var(--green)' : 'var(--muted)';

      document.getElementById('val-fee').textContent = (feePerContract * 100).toFixed(2) + '¢';
      document.getElementById('val-spread-drag').textContent = (halfSpreadDrag * 100).toFixed(2) + '¢';
      document.getElementById('val-gross-edge').textContent = (grossEdge >= 0 ? '+' : '') + (grossEdge * 100).toFixed(2) + '¢';
      document.getElementById('val-total-drag').textContent = '-' + (totalDrag * 100).toFixed(2) + '¢';
      document.getElementById('val-breakeven').textContent = (breakevenProb * 100).toFixed(2) + '%';
      document.getElementById('val-benchmark').textContent = benchmark;
      document.getElementById('val-cadence').textContent = cadence;
      document.getElementById('val-100-drag').textContent = '-$' + (totalDrag * count * 10).toFixed(2);

      const badge = document.getElementById('badge-verdict');
      badge.textContent = isPositive ? 'POSITIVE EDGE' : 'NEGATIVE DRAG';
      badge.style.background = isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)';
      badge.style.color = isPositive ? 'var(--green)' : 'var(--rose)';
      badge.style.border = '1px solid ' + (isPositive ? 'var(--green)' : 'var(--rose)');
    }

    recalc();
  </script>
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
