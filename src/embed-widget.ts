import { renderMarketEvidenceCardHtml, type MarketEvidenceCardOptions } from "./market-evidence-card.ts";
import { calculateKalshiOrderFee } from "./polymarket-engine.ts";

export interface EmbedWidgetOptions {
  theme?: "dark" | "light";
  whiteLabel?: boolean;
  price?: number;
  count?: number;
  series?: "15m" | "1h";
  spotPrice?: number;
  ticker?: string;
  venue?: "kalshi-15m" | "kalshi-1h" | "polymarket";
}

/**
 * Common CSS tokens helper for Dark and Light widget themes.
 */
function getWidgetThemeCss(theme: "dark" | "light" = "dark"): string {
  if (theme === "light") {
    return `
      :root {
        --bg: #F8FAFC;
        --panel: #FFFFFF;
        --panel-border: rgba(201, 162, 74, 0.35);
        --text: #0F172A;
        --muted: #64748B;
        --accent: #B8860B;
        --accent-light: #D4AF37;
        --card-bg: #F1F5F9;
        --card-border: rgba(148, 163, 184, 0.25);
        --green: #059669;
        --rose: #E11D48;
        --amber: #D97706;
        --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --font-mono: "IBM Plex Mono", ui-monospace, monospace;
      }
    `;
  }
  return `
    :root {
      --bg: #06070A;
      --panel: #0E121B;
      --panel-border: rgba(212, 175, 55, 0.22);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --card-bg: rgba(0, 0, 0, 0.35);
      --card-border: rgba(255, 255, 255, 0.06);
      --green: #10B981;
      --rose: #F43F5E;
      --amber: #F59E0B;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, monospace;
    }
  `;
}

/**
 * Renders the "Powered by QuanterraOS" backlink or suppresses it if whiteLabel is enabled.
 */
function renderBrandingFooter(targetUrl: string, whiteLabel: boolean = false, customLabel: string = "Powered by QuanterraOS"): string {
  if (whiteLabel) {
    return `<div class="whitelabel-watermark" style="font-size:0.68rem; color:var(--muted); font-family:var(--font-mono); letter-spacing:0.04em;">Audited Neutral Telemetry &bull; Rule B5 Locked</div>`;
  }
  return `<div class="powered-by-brand">
    <a href="${targetUrl}" target="_blank" rel="noopener" class="powered-by-link" style="color:var(--muted); text-decoration:none; font-size:0.72rem; display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); transition:color 0.15s;">
      <span style="width:6px; height:6px; border-radius:50%; background:var(--accent); display:inline-block; box-shadow:0 0 5px var(--accent);"></span>
      <span style="font-weight:600; color:var(--text);">${customLabel}</span>
      <span style="color:var(--accent);">&nearr;</span>
    </a>
  </div>`;
}

// ============================================================================
// 1. WIDGET: Kalshi Fee & Breakeven Calculator (/embed/calculator)
// ============================================================================
export function renderEmbedCalculatorHtml(options: EmbedWidgetOptions = {}): string {
  const theme = options.theme === "light" ? "light" : "dark";
  const whiteLabel = Boolean(options.whiteLabel);
  const initialPrice = options.price ?? 50;
  const initialCount = options.count ?? 10;
  const backlinkUrl = "https://quanterraos.com/check";
  const brandTitle = whiteLabel ? "Prediction Market Cost Calculator" : "QuanterraOS Cost Calculator";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle} Widget</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${getWidgetThemeCss(theme)}
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
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      max-width: 540px;
      margin: 0 auto;
    }
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      border-bottom: 1px solid var(--panel-border);
      padding-bottom: 10px;
    }
    .brand-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text);
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
      font-weight: 600;
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
      background: var(--card-bg);
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
      background: var(--card-bg);
      border: 1px solid var(--panel-border);
      border-radius: 4px;
      color: var(--text);
      padding: 6px 10px;
      font-size: 0.78rem;
      font-family: var(--font-mono);
    }
    .results-panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
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
      border-bottom: 1px solid var(--card-border);
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
    .danger-zone-alert {
      display: none;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 12px;
      font-size: 0.72rem;
      color: var(--amber);
      font-family: var(--font-mono);
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
    .widget-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid var(--card-border);
      flex-wrap: wrap;
      gap: 6px;
    }
    .disclaimer {
      font-size: 0.65rem;
      color: var(--muted);
      text-align: center;
      margin-top: 10px;
      line-height: 1.3;
    }
  </style>
</head>
<body class="theme-${theme}">
  <div class="widget-container">
    <div class="widget-header">
      <div class="brand-title">
        <span class="brand-dot"></span>
        <span id="header-brand-name">${brandTitle}</span>
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
        <input type="number" id="input-count" class="num-input" value="${initialCount}" min="1" max="1000" oninput="calc()">
      </div>
    </div>

    <div class="form-group">
      <div class="form-label-row">
        <span>Executable Ask Price</span>
        <span class="form-val" id="val-price">${initialPrice}&cent; ($${(initialPrice / 100).toFixed(2)})</span>
      </div>
      <input type="range" id="slider-price" min="1" max="99" value="${initialPrice}" oninput="calc()">
    </div>

    <div class="danger-zone-alert" id="danger-alert">
      &#9888; <strong>Coin-Flip Hazard Zone (40&cent;&ndash;60&cent;):</strong> Taker fees create maximum percentage drag here. At 50&cent; you need 51.75%+ just to break even.
    </div>

    <div class="results-panel">
      <div class="result-row">
        <span style="color:var(--muted);">Total Purchase Outlay:</span>
        <span class="form-val" id="res-outlay">$5.00</span>
      </div>
      <div class="result-row">
        <span style="color:var(--muted);">Exchange Taker Fee:</span>
        <span class="fee-val" id="res-fee">$0.18 (1.8&cent;/ct)</span>
      </div>
      <div class="result-row">
        <span style="color:var(--muted);">Required Breakeven Win Rate:</span>
        <span class="highlight-val" id="res-breakeven">51.80%</span>
      </div>
      <div class="result-row">
        <span style="color:var(--muted);">Settlement Oracle:</span>
        <span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text);" id="res-oracle">CME CF BRTI 60s TWAP</span>
      </div>
    </div>

    <a href="${backlinkUrl}" target="_blank" rel="noopener" class="cta-btn" id="cta-link">
      ANALYZE FULL EVIDENCE &amp; LOG TO JOURNAL &rarr;
    </a>

    <div class="widget-footer">
      ${renderBrandingFooter(backlinkUrl, whiteLabel, "Powered by QuanterraOS")}
      <span style="font-size:0.68rem; font-family:var(--font-mono); color:var(--muted);">Rule B5 &bull; $0 live capital</span>
    </div>

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

      document.getElementById('val-price').textContent = priceCents + '\u00A2 ($' + price.toFixed(2) + ')';

      // Coin-flip zone warning (40c - 60c)
      const alertEl = document.getElementById('danger-alert');
      if (priceCents >= 40 && priceCents <= 60) {
        alertEl.style.display = 'block';
      } else {
        alertEl.style.display = 'none';
      }

      let fee = 0;
      let oracle = "CME CF BRTI 60s TWAP";
      if (venue.startsWith('kalshi')) {
        // Kalshi official formula: ceil(0.07 * count * price * (1 - price) * 100) / 100
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
      document.getElementById('res-fee').textContent = '$' + fee.toFixed(2) + ' (' + feePerContract.toFixed(2) + '\u00A2/ct)';
      document.getElementById('res-breakeven').textContent = breakevenPct.toFixed(2) + '%';
      document.getElementById('res-oracle').textContent = oracle;
    }
    calc();
  </script>
</body>
</html>`;
}

// ============================================================================
// 2. WIDGET: BRTI-vs-Spot Dispersion Ticker (/embed/dispersion)
// ============================================================================
export function renderEmbedDispersionHtml(options: EmbedWidgetOptions = {}): string {
  const theme = options.theme === "light" ? "light" : "dark";
  const whiteLabel = Boolean(options.whiteLabel);
  const spotPrice = options.spotPrice ?? 91250;
  const backlinkUrl = "https://quanterraos.com/radar";
  const brandTitle = whiteLabel ? "CME CF BRTI vs Spot Dispersion Ticker" : "QuanterraOS Dispersion Ticker";

  const coinbasePrice = spotPrice - 2.5;
  const krakenPrice = spotPrice + 1.8;
  const bitstampPrice = spotPrice - 4.1;
  const geminiPrice = spotPrice + 3.2;
  const dispersionBps = 8.4;
  const isElevated = dispersionBps >= 15;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${getWidgetThemeCss(theme)}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      padding: 14px;
      line-height: 1.4;
    }
    .dispersion-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      max-width: 580px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 10px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text);
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
    }
    .status-badge {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
      background: ${isElevated ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.15)"};
      color: ${isElevated ? "var(--rose)" : "var(--green)"};
      border: 1px solid ${isElevated ? "rgba(244, 63, 94, 0.3)" : "rgba(16, 185, 129, 0.3)"};
      text-transform: uppercase;
    }
    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }
    .metric-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 10px;
    }
    .metric-lbl {
      font-size: 0.65rem;
      color: var(--muted);
      text-transform: uppercase;
      font-family: var(--font-mono);
      margin-bottom: 3px;
    }
    .metric-val {
      font-size: 1.15rem;
      font-weight: 800;
      font-family: var(--font-mono);
      color: var(--text);
    }
    .spot-pool-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 12px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
    }
    .spot-item {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 4px;
      padding: 6px 8px;
      text-align: center;
    }
    .spot-name { color: var(--muted); font-size: 0.62rem; }
    .spot-px { font-weight: 600; color: var(--text); margin-top: 2px; }
    .settlement-note {
      font-size: 0.72rem;
      color: var(--muted);
      background: rgba(223, 184, 67, 0.06);
      border-left: 2px solid var(--accent);
      padding: 6px 10px;
      border-radius: 0 4px 4px 0;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--card-border);
      padding-top: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .action-btn {
      background: linear-gradient(180deg, #F7E7B4 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.72rem;
      font-family: var(--font-mono);
      display: inline-block;
    }
  </style>
</head>
<body class="theme-${theme}">
  <div class="dispersion-card">
    <div class="header">
      <div class="brand">
        <span class="dot"></span>
        <span>${brandTitle}</span>
      </div>
      <span class="status-badge">${isElevated ? "Elevated Spread" : "Normal Dispersion"}</span>
    </div>

    <div class="telemetry-grid">
      <div class="metric-box">
        <div class="metric-lbl">Composite Spot</div>
        <div class="metric-val" id="val-spot">$${spotPrice.toLocaleString()}</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">BRTI 60s TWAP Proxy</div>
        <div class="metric-val" id="val-brti" style="color:var(--accent);">$${(spotPrice - 3.4).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">Dispersion Spread</div>
        <div class="metric-val" id="val-dispersion" style="color:${isElevated ? 'var(--rose)' : 'var(--green)'};">+${dispersionBps.toFixed(1)} bps</div>
      </div>
    </div>

    <div class="spot-pool-row">
      <div class="spot-item">
        <div class="spot-name">Coinbase</div>
        <div class="spot-px">$${coinbasePrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</div>
      </div>
      <div class="spot-item">
        <div class="spot-name">Kraken</div>
        <div class="spot-px">$${krakenPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</div>
      </div>
      <div class="spot-item">
        <div class="spot-name">Bitstamp</div>
        <div class="spot-px">$${bitstampPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</div>
      </div>
      <div class="spot-item">
        <div class="spot-name">Gemini</div>
        <div class="spot-px">$${geminiPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</div>
      </div>
    </div>

    <div class="settlement-note">
      <strong>Settlement Truth:</strong> Kalshi BTC contracts settle on the 60-second TWAP of the CME CF BRTI index, not instantaneous spot or single-exchange orderbooks.
    </div>

    <div class="footer">
      ${renderBrandingFooter(backlinkUrl, whiteLabel, "Powered by QuanterraOS")}
      <a href="${backlinkUrl}" target="_blank" rel="noopener" class="action-btn">Open Live Settlement Radar &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// 3. WIDGET: Live 15-Min BTC Countdown with Strike Distance (/embed/countdown)
// ============================================================================
export function renderEmbedCountdownHtml(options: EmbedWidgetOptions = {}): string {
  const theme = options.theme === "light" ? "light" : "dark";
  const whiteLabel = Boolean(options.whiteLabel);
  const spotPrice = options.spotPrice ?? 91250;
  const atmStrike = Math.round(spotPrice / 250) * 250;
  const delta = spotPrice - atmStrike;
  const backlinkUrl = "https://quanterraos.com/radar";
  const brandTitle = whiteLabel ? "BTC 15-Minute Expiry Countdown" : "QuanterraOS 15-Min BTC Countdown";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${getWidgetThemeCss(theme)}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      padding: 14px;
      line-height: 1.4;
    }
    .countdown-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      max-width: 540px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text);
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
    }
    .active-badge {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      background: rgba(16, 185, 129, 0.15);
      color: var(--green);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }
    .main-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .metric-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    .metric-lbl {
      font-size: 0.65rem;
      color: var(--muted);
      text-transform: uppercase;
      font-family: var(--font-mono);
      margin-bottom: 2px;
    }
    .timer-display {
      font-size: 1.55rem;
      font-weight: 800;
      font-family: var(--font-mono);
      color: var(--accent);
      letter-spacing: 0.05em;
    }
    .val-display {
      font-size: 1.15rem;
      font-weight: 800;
      font-family: var(--font-mono);
      color: var(--text);
    }
    .hazard-banner {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.72rem;
      font-family: var(--font-mono);
      color: var(--amber);
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--card-border);
      padding-top: 8px;
      font-size: 0.72rem;
      color: var(--muted);
      flex-wrap: wrap;
      gap: 8px;
    }
    .action-btn {
      background: linear-gradient(180deg, #F7E7B4 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.72rem;
      font-family: var(--font-mono);
    }
  </style>
</head>
<body class="theme-${theme}">
  <div class="countdown-card">
    <div class="header">
      <div class="brand">
        <span class="dot"></span>
        <span>${brandTitle}</span>
      </div>
      <span class="active-badge" id="contract-badge">KXBTC15M &bull; ACTIVE</span>
    </div>

    <div class="main-grid">
      <div class="metric-box">
        <div class="metric-lbl">Window Expiry In</div>
        <div class="timer-display" id="timer-val">04:28</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">Spot Proxy</div>
        <div class="val-display" id="spot-val">$${spotPrice.toLocaleString()}</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">Strike Delta</div>
        <div class="val-display" id="delta-val" style="color:${delta >= 0 ? 'var(--green)' : 'var(--rose)'};">
          ${delta >= 0 ? '+' : ''}$${delta.toFixed(0)}
        </div>
      </div>
    </div>

    <div class="hazard-banner" id="hazard-banner">
      <span style="font-size:1rem;">&#9888;</span>
      <div>
        <strong>Coin-Flip Zone Alert:</strong> Contracts within $50 of strike inside &lt;3 min suffer severe fee drag relative to random price drift.
      </div>
    </div>

    <div class="footer">
      ${renderBrandingFooter(backlinkUrl, whiteLabel, "Powered by QuanterraOS")}
      <a href="${backlinkUrl}" target="_blank" rel="noopener" class="action-btn">Launch Cockpit Radar &rarr;</a>
    </div>
  </div>

  <script>
    // Live ticking countdown to the next 15-minute interval (:00, :15, :30, :45)
    function tickCountdown() {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const nextWindowMinute = (Math.floor(minutes / 15) + 1) * 15;
      const totalSecondsLeft = (nextWindowMinute * 60) - (minutes * 60 + seconds);

      const m = Math.floor(totalSecondsLeft / 60);
      const s = totalSecondsLeft % 60;
      const formatted = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

      const timerEl = document.getElementById('timer-val');
      if (timerEl) {
        timerEl.textContent = formatted;
        if (totalSecondsLeft < 180) {
          timerEl.style.color = 'var(--rose)';
        } else {
          timerEl.style.color = 'var(--accent)';
        }
      }
    }
    setInterval(tickCountdown, 1000);
    tickCountdown();
  </script>
</body>
</html>`;
}

// ============================================================================
// 4. WIDGET: Market vs Model Calibration Badge (/embed/calibration)
// ============================================================================
export function renderEmbedCalibrationHtml(options: EmbedWidgetOptions = {}): string {
  const theme = options.theme === "light" ? "light" : "dark";
  const whiteLabel = Boolean(options.whiteLabel);
  const backlinkUrl = "https://quanterraos.com/proof";
  const brandTitle = whiteLabel ? "Prediction Market Calibration Scorecard" : "QuanterraOS Calibration Badge";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${getWidgetThemeCss(theme)}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      padding: 12px;
      line-height: 1.4;
    }
    .badge-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      max-width: 520px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text);
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
    }
    .sample-pill {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--muted);
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 2px 6px;
      border-radius: 3px;
    }
    .proof-banner {
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.25);
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 12px;
      font-size: 0.75rem;
      line-height: 1.35;
    }
    .scoreboard {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .score-item {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 10px 8px;
      text-align: center;
    }
    .score-lbl { font-size: 0.62rem; color: var(--muted); font-family: var(--font-mono); text-transform: uppercase; margin-bottom: 3px; }
    .score-val { font-size: 1.2rem; font-weight: 800; font-family: var(--font-mono); }
    .score-note { font-size: 0.6rem; color: var(--muted); margin-top: 2px; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--card-border);
      padding-top: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .action-btn {
      background: linear-gradient(180deg, #F7E7B4 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.7rem;
      font-family: var(--font-mono);
    }
  </style>
</head>
<body class="theme-${theme}">
  <div class="badge-card">
    <div class="header">
      <div class="brand">
        <span class="dot"></span>
        <span>${brandTitle}</span>
      </div>
      <span class="sample-pill">n=1,316 SETTLED WINDOWS</span>
    </div>

    <div class="proof-banner">
      <strong style="color:var(--accent);">Market Beats Our Model:</strong> Brier score audit proves Kalshi market mid (0.2001) is superior to proprietary prediction model (0.2063). We publish the truth when the market wins.
    </div>

    <div class="scoreboard">
      <div class="score-item" style="border-color:rgba(16,185,129,0.35);">
        <div class="score-lbl" style="color:var(--green);">Kalshi Market Mid</div>
        <div class="score-val" style="color:var(--green);">0.2001</div>
        <div class="score-note">Best Calibration</div>
      </div>
      <div class="score-item" style="border-color:rgba(223,184,67,0.35);">
        <div class="score-lbl" style="color:var(--accent);">QuanterraOS Model</div>
        <div class="score-val" style="color:var(--accent);">0.2063</div>
        <div class="score-note">+0.0062 Delta</div>
      </div>
      <div class="score-item">
        <div class="score-lbl">Naive Coin-Flip</div>
        <div class="score-val" style="color:var(--muted);">0.2500</div>
        <div class="score-note">Random Baseline</div>
      </div>
    </div>

    <div class="footer">
      ${renderBrandingFooter(backlinkUrl, whiteLabel, "Powered by QuanterraOS")}
      <a href="${backlinkUrl}" target="_blank" rel="noopener" class="action-btn">Inspect Public Audit Ledger &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// 5. WIDGET: Kalshi vs Polymarket Net-Price Comparator (/embed/comparator)
// ============================================================================
export function renderEmbedComparatorHtml(options: EmbedWidgetOptions = {}): string {
  const theme = options.theme === "light" ? "light" : "dark";
  const whiteLabel = Boolean(options.whiteLabel);
  const price = options.price ?? 0.51;
  const count = options.count ?? 10;
  const backlinkUrl = "https://quanterraos.com/check";
  const brandTitle = whiteLabel ? "Cross-Venue Net Cost Comparator" : "QuanterraOS Net-Price Comparator";

  const kalshiFee = calculateKalshiOrderFee(price, count).totalFeeUsd;
  const polyFee = Number(((0.02 * (1 - price) * count) + 0.10).toFixed(2));
  const kalshiBreakeven = ((price * count + kalshiFee) / count * 100).toFixed(2);
  const polyBreakeven = ((price * count + polyFee) / count * 100).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${getWidgetThemeCss(theme)}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      padding: 14px;
      line-height: 1.4;
    }
    .compare-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      max-width: 580px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text);
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
    }
    .spec-pill {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--muted);
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 2px 6px;
      border-radius: 3px;
    }
    .venues-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .venue-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 12px;
    }
    .v-title {
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--card-border);
    }
    .k-color { color: var(--accent); }
    .p-color { color: #38BDF8; }
    .stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.74rem;
      margin-bottom: 5px;
      font-family: var(--font-mono);
    }
    .stat-row:last-child { margin-bottom: 0; }
    .hazard-note {
      font-size: 0.72rem;
      color: var(--muted);
      background: rgba(245, 158, 11, 0.08);
      border-left: 2px solid var(--amber);
      padding: 6px 10px;
      border-radius: 0 4px 4px 0;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--card-border);
      padding-top: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .action-btn {
      background: linear-gradient(180deg, #F7E7B4 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.72rem;
      font-family: var(--font-mono);
    }
  </style>
</head>
<body class="theme-${theme}">
  <div class="compare-card">
    <div class="header">
      <div class="brand">
        <span class="dot"></span>
        <span>${brandTitle}</span>
      </div>
      <span class="spec-pill">Order: ${(price * 100).toFixed(0)}&cent; &bull; ${count} contracts</span>
    </div>

    <div class="venues-grid">
      <!-- Kalshi Column -->
      <div class="venue-box">
        <div class="v-title">
          <span class="k-color">Kalshi</span>
          <span style="font-size:0.65rem; color:var(--muted); font-family:var(--font-mono);">CFTC DCM</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">Taker Fee:</span>
          <strong style="color:var(--rose);">$${kalshiFee.toFixed(2)}</strong>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">Breakeven:</span>
          <strong style="color:var(--accent);">${kalshiBreakeven}%</strong>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">Oracle Basis:</span>
          <span>BRTI 60s TWAP</span>
        </div>
      </div>

      <!-- Polymarket Column -->
      <div class="venue-box">
        <div class="v-title">
          <span class="p-color">Polymarket</span>
          <span style="font-size:0.65rem; color:var(--muted); font-family:var(--font-mono);">Polygon</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">Fee + Gas:</span>
          <strong style="color:var(--rose);">$${polyFee.toFixed(2)}</strong>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">Breakeven:</span>
          <strong style="color:#38BDF8;">${polyBreakeven}%</strong>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">Oracle Basis:</span>
          <span>UMA Optimistic</span>
        </div>
      </div>
    </div>

    <div class="hazard-note">
      <strong>Oracle Settlement Disparity:</strong> Kalshi settles strictly on the CME CF BRTI 60-second TWAP index, while Polymarket resolves via UMA tokenholder votes. Cross-venue arbitrage carries settlement-source risk.
    </div>

    <div class="footer">
      ${renderBrandingFooter(backlinkUrl, whiteLabel, "Powered by QuanterraOS")}
      <a href="${backlinkUrl}" target="_blank" rel="noopener" class="action-btn">Launch True-Cost Check &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// 6. JAVASCRIPT EMBED LOADER SCRIPT (/embed/widget.js)
// ============================================================================
export function renderEmbedLoaderJs(): string {
  return `/**
 * QuanterraOS Universal Widget Embed Loader
 * https://quanterraos.com
 */
(function() {
  'use strict';

  function initWidgets() {
    var elements = document.querySelectorAll('[data-quanterraos-widget], [data-quanterra-widget], [data-widget]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.getAttribute('data-quanterra-loaded')) continue;
      el.setAttribute('data-quanterra-loaded', 'true');

      var widgetType = el.getAttribute('data-quanterraos-widget') || el.getAttribute('data-quanterra-widget') || el.getAttribute('data-widget') || 'calculator';
      var theme = el.getAttribute('data-theme') || 'dark';
      var whiteLabel = el.getAttribute('data-whitelabel') === 'true' || el.getAttribute('data-white-label') === 'true';
      var price = el.getAttribute('data-price') || '';
      var count = el.getAttribute('data-count') || '';
      var height = el.getAttribute('data-height') || '460px';

      // Map widget alias to embed endpoint
      var endpoint = '/embed/calculator';
      if (widgetType === 'dispersion') endpoint = '/embed/dispersion';
      else if (widgetType === 'countdown') endpoint = '/embed/countdown';
      else if (widgetType === 'calibration') endpoint = '/embed/calibration';
      else if (widgetType === 'comparator' || widgetType === 'divergence') endpoint = '/embed/comparator';

      var query = '?theme=' + encodeURIComponent(theme);
      if (whiteLabel) query += '&whiteLabel=true';
      if (price) query += '&price=' + encodeURIComponent(price);
      if (count) query += '&count=' + encodeURIComponent(count);

      var host = 'https://quanterraos.com';
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        host = window.location.origin;
      }

      var iframe = document.createElement('iframe');
      iframe.src = host + endpoint + query;
      iframe.width = '100%';
      iframe.height = height;
      iframe.frameBorder = '0';
      iframe.scrolling = 'no';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.style.overflow = 'hidden';
      iframe.style.display = 'block';
      iframe.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
      iframe.title = 'QuanterraOS ' + widgetType + ' Widget';

      el.innerHTML = '';
      el.appendChild(iframe);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }

  // Handle postMessage auto-resizing if dispatched by child widgets
  window.addEventListener('message', function(event) {
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'quanterra:widget:resize' && event.data.height) {
      var iframes = document.querySelectorAll('iframe');
      for (var j = 0; j < iframes.length; j++) {
        if (iframes[j].contentWindow === event.source) {
          iframes[j].style.height = event.data.height + 'px';
        }
      }
    }
  });
})();
`;
}

// ============================================================================
// Legacy & Extended Widget Endpoints (Preserved for compatibility)
// ============================================================================

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
export function renderEmbedRadarHtml(options?: { series?: "15m" | "1h"; spotPrice?: number; theme?: "dark" | "light"; whiteLabel?: boolean }): string {
  const series = options?.series || "15m";
  const spotPrice = options?.spotPrice || 91250;
  const atmStrike = Math.round(spotPrice / 250) * 250;
  const delta = spotPrice - atmStrike;
  const theme = options?.theme === "light" ? "light" : "dark";
  const whiteLabel = Boolean(options?.whiteLabel);
  const backlinkUrl = "https://quanterraos.com/radar";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuanterraOS Expiry Radar Widget</title>
  <style>
    ${getWidgetThemeCss(theme)}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px;
      line-height: 1.4;
    }
    .embed-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text);
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
      color: var(--green);
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
      background: var(--card-bg);
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--card-border);
    }
    .lbl { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; font-family: var(--font-mono); }
    .val { font-size: 1.15rem; font-weight: 800; font-family: var(--font-mono); margin-top: 2px; }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      color: var(--muted);
      border-top: 1px solid var(--card-border);
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
<body class="theme-${theme}">
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
      ${renderBrandingFooter(backlinkUrl, whiteLabel, "Powered by QuanterraOS")}
      <a href="https://quanterraos.com/radar" target="_blank" class="btn">Full Radar &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders an embeddable Cross-Venue Divergence Widget
 */
export function renderEmbedDivergenceHtml(options?: { price?: number; count?: number; theme?: "dark" | "light"; whiteLabel?: boolean }): string {
  const price = options?.price || 0.51;
  const count = options?.count || 10;
  const kalshiFee = calculateKalshiOrderFee(price, count).totalFeeUsd;
  const polyFee = Number(((0.005 * count) + 0.15).toFixed(2));
  const kalshiBreakeven = ((price * count + kalshiFee) / count * 100).toFixed(1);
  const polyBreakeven = ((price * count + polyFee) / count * 100).toFixed(1);
  const theme = options?.theme === "light" ? "light" : "dark";
  const whiteLabel = Boolean(options?.whiteLabel);
  const backlinkUrl = "https://quanterraos.com/divergence";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuanterraOS Cross-Venue Divergence Widget</title>
  <style>
    ${getWidgetThemeCss(theme)}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px;
      font-size: 13px;
    }
    .embed-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
    }
    .brand { font-size: 0.8rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 6px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
    .compare-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .v-box {
      background: var(--card-bg);
      padding: 10px;
      border-radius: 6px;
      border: 1px solid var(--card-border);
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
      border-top: 1px solid var(--card-border);
      padding-top: 8px;
      flex-wrap: wrap;
      gap: 8px;
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
<body class="theme-${theme}">
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
        <div class="row"><span>Taker Fee:</span> <strong style="color:var(--rose);">$${kalshiFee.toFixed(2)}</strong></div>
        <div class="row"><span>Breakeven:</span> <strong>${kalshiBreakeven}%</strong></div>
        <div class="row"><span>Oracle:</span> <span>CME CF BRTI</span></div>
      </div>
      <div class="v-box">
        <div class="v-title"><span class="p-color">Polymarket</span> <span style="font-size:0.65rem; color:var(--muted);">Polygon</span></div>
        <div class="row"><span>Friction+Gas:</span> <strong style="color:var(--rose);">$${polyFee.toFixed(2)}</strong></div>
        <div class="row"><span>Breakeven:</span> <strong>${polyBreakeven}%</strong></div>
        <div class="row"><span>Oracle:</span> <span>UMA (0.35% disp)</span></div>
      </div>
    </div>
    <div class="footer">
      <span>Divergence accounts for all-in friction &bull; Rule B5 $0 live capital</span>
      ${renderBrandingFooter(backlinkUrl, whiteLabel, "Powered by QuanterraOS")}
      <a href="https://quanterraos.com/divergence" target="_blank" class="btn">Full Terminal &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

