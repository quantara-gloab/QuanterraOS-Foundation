import { renderMarketEvidenceCardHtml, type MarketEvidenceCardOptions } from "./market-evidence-card.ts";
import { calculateKalshiOrderFee } from "./polymarket-engine.ts";

/**
 * QuanterraOS Standalone Embeddable Cost & Friction Widget
 *
 * Designed for third-party websites, financial educators, newsletters, and blogs.
 * Displays real-time prediction market taker fees, spread drag, and breakeven hurdles.
 * Strictly adheres to HANDOFF.md Rule B4 and Rule B5.
 */
export function renderEmbedCalculatorHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuanterraOS Prediction Market Fee &amp; Breakeven Calculator Widget</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --panel: #0E121B;
      --panel-border: rgba(212, 175, 55, 0.22);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --accent: #DFB843;
      --green: #10B981;
      --rose: #F43F5E;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.5;
      padding: 16px;
      -webkit-font-smoothing: antialiased;
    }
    .widget-container {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      max-width: 540px;
      margin: 0 auto;
    }
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.12);
      padding-bottom: 10px;
    }
    .brand-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
    }
    .venue-badge {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--accent);
      background: rgba(223, 184, 67, 0.1);
      border: 1px solid rgba(223, 184, 67, 0.3);
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .form-group {
      margin-bottom: 12px;
    }
    .form-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-size: 0.75rem;
      color: var(--muted);
    }
    .form-val {
      font-family: var(--font-mono);
      font-weight: 600;
      color: var(--text);
    }
    input[type=range] {
      width: 100%;
      height: 6px;
      background: #1E293B;
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
      accent-color: var(--accent);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .select-input, .num-input {
      width: 100%;
      background: #080C14;
      border: 1px solid var(--panel-border);
      border-radius: 4px;
      color: var(--text);
      padding: 6px 10px;
      font-size: 0.78rem;
      font-family: var(--font-mono);
    }
    .results-panel {
      background: rgba(6, 9, 14, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 14px;
    }
    .result-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 0.76rem;
    }
    .result-row:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .highlight-val {
      font-family: var(--font-mono);
      font-weight: 700;
      color: var(--accent);
      font-size: 0.95rem;
    }
    .fee-val {
      font-family: var(--font-mono);
      color: var(--rose);
      font-weight: 600;
    }
    .cta-btn {
      display: block;
      width: 100%;
      text-align: center;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      color: #07080B;
      font-weight: 700;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      padding: 8px 12px;
      border-radius: 4px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
      transition: opacity 0.15s;
    }
    .cta-btn:hover {
      opacity: 0.92;
    }
    .disclaimer {
      font-size: 0.65rem;
      color: #64748B;
      text-align: center;
      margin-top: 10px;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="widget-header">
      <div class="brand-title">
        <span class="brand-dot"></span>
        QuanterraOS Cost Calculator
      </div>
      <span class="venue-badge" id="badge-venue">CFTC Formula</span>
    </div>

    <div class="grid-2">
      <div>
        <label for="select-venue" class="form-label-row"><span>Venue</span></label>
        <select id="select-venue" class="select-input" onchange="calc()">
          <option value="kalshi-15m" selected>Kalshi 15M (KXBTC15M)</option>
          <option value="kalshi-1h">Kalshi 1-Hour (KXBTCD)</option>
          <option value="polymarket">Polymarket 15M</option>
        </select>
      </div>
      <div>
        <label for="input-count" class="form-label-row"><span>Contracts</span></label>
        <input type="number" id="input-count" class="num-input" value="10" min="1" max="1000" oninput="calc()">
      </div>
    </div>

    <div class="form-group">
      <div class="form-label-row">
        <span>Executable Ask Price</span>
        <span class="form-val" id="val-price">50¢ ($0.50)</span>
      </div>
      <input type="range" id="slider-price" min="1" max="99" value="50" oninput="calc()">
    </div>

    <div class="results-panel">
      <div class="result-row">
        <span style="color:var(--muted);">Total Purchase Outlay:</span>
        <span class="form-val" id="res-outlay">$5.00</span>
      </div>
      <div class="result-row">
        <span style="color:var(--muted);">Exchange Taker Fee:</span>
        <span class="fee-val" id="res-fee">$0.18 (1.8¢/ct)</span>
      </div>
      <div class="result-row">
        <span style="color:var(--muted);">Required Breakeven Win Rate:</span>
        <span class="highlight-val" id="res-breakeven">51.80%</span>
      </div>
      <div class="result-row">
        <span style="color:var(--muted);">Settlement Oracle:</span>
        <span style="font-family:var(--font-mono); font-size:0.7rem; color:#FFFFFF;" id="res-oracle">CME CF BRTI 60s TWAP</span>
      </div>
    </div>

    <a href="https://quanterraos.com/calculator" target="_blank" rel="noopener" class="cta-btn" id="cta-link">
      ANALYZE FULL EVIDENCE &amp; LOG TO JOURNAL &rarr;
    </a>

    <div class="disclaimer">
      Independent friction analysis. Does not constitute financial advice or establish a forecasting advantage. Permanent $0 live capital circuit (Rule B5).
    </div>
  </div>

  <script>
    function calc() {
      const venue = document.getElementById('select-venue').value;
      const count = Math.max(1, parseInt(document.getElementById('input-count').value, 10) || 1);
      const priceCents = parseInt(document.getElementById('slider-price').value, 10);
      const price = priceCents / 100;

      document.getElementById('val-price').textContent = priceCents + '¢ ($' + price.toFixed(2) + ')';

      let fee = 0;
      let oracle = "CME CF BRTI 60s TWAP";
      if (venue.startsWith('kalshi')) {
        // Kalshi official formula: ceil(0.07 * count * P * (1-P) * 100) / 100
        const raw = 0.07 * count * price * (1 - price);
        fee = Math.ceil(Number((raw * 100).toFixed(6))) / 100;
        oracle = venue === 'kalshi-1h' ? 'CME CF BRTI Hourly TWAP' : 'CME CF BRTI 60s TWAP';
        document.getElementById('badge-venue').textContent = 'CFTC FORMULA';
      } else {
        fee = Number(((0.02 * (1 - price) * count) + 0.10).toFixed(2));
        oracle = 'UMA Optimistic Oracle';
        document.getElementById('badge-venue').textContent = 'DECENTRALIZED';
      }

      const outlay = Number((price * count).toFixed(2));
      const totalCost = outlay + fee;
      const breakevenPct = Number(((totalCost / count) * 100).toFixed(2));
      const feePerContract = (fee / count) * 100;

      document.getElementById('res-outlay').textContent = '$' + outlay.toFixed(2);
      document.getElementById('res-fee').textContent = '$' + fee.toFixed(2) + ' (' + feePerContract.toFixed(2) + '¢/ct)';
      document.getElementById('res-breakeven').textContent = breakevenPct.toFixed(2) + '%';
      document.getElementById('res-oracle').textContent = oracle;
    }
    calc();
  </script>
</body>
</html>`;
}

/**
 * Renders an embeddable Market Evidence Card
 */
export function renderEmbedCardHtml(opts: MarketEvidenceCardOptions = {}): string {
  const cardHtml = renderMarketEvidenceCardHtml(opts);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuanterraOS Verified Market Evidence Card</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      background: #06070A;
      margin: 0;
      padding: 12px;
      font-family: 'Inter', -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  ${cardHtml}
</body>
</html>`;
}

/**
 * Renders an embeddable Expiry Radar & Microstructure Widget
 */
export function renderEmbedRadarHtml(options?: { series?: "15m" | "1h"; spotPrice?: number }): string {
  const series = options?.series || "15m";
  const spotPrice = options?.spotPrice || 91250;
  const atmStrike = Math.round(spotPrice / 250) * 250;
  const delta = spotPrice - atmStrike;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuanterraOS Expiry Radar Widget</title>
  <style>
    :root {
      --bg: #06070A;
      --card: #0E121B;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --border: rgba(212, 175, 55, 0.22);
      --muted: #94A3B8;
      --text: #F8FAFC;
      --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px;
      line-height: 1.4;
    }
    .embed-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.12);
      padding-bottom: 8px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
    }
    .badge {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .metric {
      background: rgba(0,0,0,0.3);
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .lbl { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; font-family: var(--font-mono); }
    .val { font-size: 1.15rem; font-weight: 800; font-family: var(--font-mono); margin-top: 2px; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      color: var(--muted);
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 8px;
    }
    .btn {
      background: linear-gradient(180deg, #F7E7B4 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.7rem;
    }
  </style>
</head>
<body>
  <div class="embed-card">
    <div class="header">
      <div class="brand">
        <span class="dot"></span> QUANTERRAOS <span style="color:var(--accent);">RADAR (${series.toUpperCase()})</span>
      </div>
      <span class="badge">60s TWAP ACTIVE</span>
    </div>
    <div class="grid">
      <div class="metric">
        <div class="lbl">Spot Proxy</div>
        <div class="val">$${spotPrice.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="lbl">ATM Strike</div>
        <div class="val">$${atmStrike.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="lbl">Delta</div>
        <div class="val" style="color:${delta >= 0 ? '#10B981' : '#F43F5E'};">${delta >= 0 ? '+' : ''}$${delta.toFixed(0)}</div>
      </div>
    </div>
    <div class="footer">
      <span>Settlement Target: CME CF BRTI 60s TWAP</span>
      <a href="https://quanterraos.com/radar" target="_blank" class="btn">Full Radar &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders an embeddable Cross-Venue Divergence Widget
 */
export function renderEmbedDivergenceHtml(options?: { price?: number; count?: number }): string {
  const price = options?.price || 0.51;
  const count = options?.count || 10;
  const kalshiFee = calculateKalshiOrderFee(price, count).totalFeeUsd;
  const polyFee = Number(((0.005 * count) + 0.15).toFixed(2));
  const kalshiBreakeven = ((price * count + kalshiFee) / count * 100).toFixed(1);
  const polyBreakeven = ((price * count + polyFee) / count * 100).toFixed(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuanterraOS Cross-Venue Divergence Widget</title>
  <style>
    :root {
      --bg: #06070A;
      --card: #0E121B;
      --accent: #DFB843;
      --border: rgba(212, 175, 55, 0.22);
      --muted: #94A3B8;
      --text: #F8FAFC;
      --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px;
      font-size: 13px;
    }
    .embed-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(212, 175, 55, 0.12);
      padding-bottom: 8px;
    }
    .brand { font-size: 0.8rem; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
    .compare-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .v-box {
      background: rgba(0,0,0,0.3);
      padding: 10px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .v-title { font-weight: 700; font-size: 0.85rem; margin-bottom: 4px; display: flex; justify-content: space-between; }
    .row { display: flex; justify-content: space-between; font-size: 0.72rem; margin-top: 3px; font-family: var(--font-mono); }
    .k-color { color: var(--accent); }
    .p-color { color: #38BDF8; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.7rem;
      color: var(--muted);
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 8px;
    }
    .btn {
      background: linear-gradient(180deg, #F7E7B4 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.7rem;
    }
  </style>
</head>
<body>
  <div class="embed-card">
    <div class="header">
      <div class="brand">
        <span class="dot"></span> QUANTERRAOS <span style="color:var(--accent);">CROSS-VENUE DIVERGENCE</span>
      </div>
      <span style="font-family:var(--font-mono); font-size:0.65rem; color:var(--muted);">Price: ${(price*100).toFixed(0)}&cent; &bull; ${count} cts</span>
    </div>
    <div class="compare-grid">
      <div class="v-box">
        <div class="v-title"><span class="k-color">Kalshi</span> <span style="font-size:0.65rem; color:var(--muted);">CFTC</span></div>
        <div class="row"><span>Taker Fee:</span> <strong style="color:#F43F5E;">$${kalshiFee.toFixed(2)}</strong></div>
        <div class="row"><span>Breakeven:</span> <strong>${kalshiBreakeven}%</strong></div>
        <div class="row"><span>Oracle:</span> <span>CME CF BRTI</span></div>
      </div>
      <div class="v-box">
        <div class="v-title"><span class="p-color">Polymarket</span> <span style="font-size:0.65rem; color:var(--muted);">Polygon</span></div>
        <div class="row"><span>Friction+Gas:</span> <strong style="color:#F43F5E;">$${polyFee.toFixed(2)}</strong></div>
        <div class="row"><span>Breakeven:</span> <strong>${polyBreakeven}%</strong></div>
        <div class="row"><span>Oracle:</span> <span>UMA (0.35% disp)</span></div>
      </div>
    </div>
    <div class="footer">
      <span>Divergence accounts for all-in friction &bull; Rule B5 $0 live capital</span>
      <a href="https://quanterraos.com/divergence" target="_blank" class="btn">Full Terminal &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

