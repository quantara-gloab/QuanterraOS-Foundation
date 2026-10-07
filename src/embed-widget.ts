import { renderMarketEvidenceCardHtml, type MarketEvidenceCardOptions } from "./market-evidence-card.ts";

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
