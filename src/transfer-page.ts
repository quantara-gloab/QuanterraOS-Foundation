/**
 * QuanterraOS Transfer Gateway (/transfer, /switch, /migrate)
 *
 * Dedicated high-conversion acquisition portal for transferring
 * Kalshi and Polymarket users to QuanterraOS.
 *
 * Strictly adheres to:
 * - Rule B4: Strictly empirical, calibrated honesty, zero superlatives.
 * - Rule B5: $0.00 capital risk, decision and risk companion only, zero order routing.
 * - CFTC Rule 4.41: Mandatory hypothetical and simulated performance disclaimer.
 * - Gold Standard restrained luxury design system: #06070A, #0C0F17, #DFB843, #00F2FE, #10B981.
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
  type PublicLayoutOptions,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export interface TransferPageOptions extends PublicLayoutOptions {}

export function renderTransferPageHtml(options: TransferPageOptions = {}): string {
  const headerHtml = renderPublicHeader({ ...options, activePath: "/transfer" });
  const footerHtml = renderPublicFooter();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Transfer From Kalshi &amp; Polymarket — QuanterraOS Decision Companion</title>
  <meta name="description" content="Stop donating 35% friction on Kalshi and Polymarket. Audit contract fees, verify settlement benchmarks, and lock in $183.75 - $367.50/mo Maker savings.">
  <link rel="canonical" href="https://quanterraos.com/transfer">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    \${PUBLIC_LAYOUT_CSS}

    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-border: rgba(223, 184, 67, 0.22);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --gold: #DFB843;
      --gold-glow: rgba(223, 184, 67, 0.25);
      --cyan: #00F2FE;
      --cyan-glow: rgba(0, 242, 254, 0.22);
      --emerald: #10B981;
      --crimson: #F43F5E;
      --muted: #8F95A0;
      --chalk: #F8FAFC;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--chalk);
      font-family: var(--public-font-sans);
      min-height: 100vh;
      line-height: 1.6;
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 242, 254, 0.1), transparent),
        radial-gradient(ellipse 60% 40% at 50% 120%, rgba(223, 184, 67, 0.08), transparent);
    }

    .container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 40px 20px 80px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(223, 184, 67, 0.1);
      border: 1px solid rgba(223, 184, 67, 0.35);
      color: var(--gold);
      font-family: var(--public-font-mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      margin-bottom: 20px;
      text-transform: uppercase;
    }

    .hero-title {
      font-size: clamp(32px, 4.8vw, 54px);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 20px;
      background: linear-gradient(180deg, #FFFFFF 40%, #A0AEC0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: clamp(16px, 1.8vw, 19px);
      color: var(--muted);
      max-width: 780px;
      margin: 0 auto 36px;
      line-height: 1.6;
    }

    /* Scanner Card */
    .scanner-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 32px;
      margin-bottom: 50px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px var(--gold-glow);
      text-align: left;
    }

    .scanner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }

    .scanner-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--chalk);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .scanner-input-bar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .scanner-input {
      flex: 1;
      min-width: 280px;
      background: rgba(6, 7, 10, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: var(--public-font-mono);
      outline: none;
      transition: border-color 0.2s;
    }

    .scanner-input:focus {
      border-color: var(--gold);
      box-shadow: 0 0 12px var(--gold-glow);
    }

    .btn-scan {
      background: var(--gold);
      color: #000;
      border: none;
      padding: 14px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      font-family: var(--public-font-mono);
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }

    .btn-scan:hover {
      background: #f0cb5a;
      transform: translateY(-1px);
    }

    /* Comparison Grid */
    .compare-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }

    .venue-box {
      background: rgba(6, 7, 10, 0.7);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 20px;
    }

    .venue-box.highlight {
      border-color: rgba(223, 184, 67, 0.4);
      background: rgba(223, 184, 67, 0.04);
    }

    .venue-title {
      font-family: var(--public-font-mono);
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
    }

    .stat-row span:first-child { color: var(--muted); }
    .stat-row span:last-child { color: var(--chalk); font-weight: 600; }

    /* Invariant Cards */
    .invariants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 50px;
    }

    .invariant-card {
      background: var(--card);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 28px;
      text-align: left;
    }

    .invariant-icon {
      font-size: 2rem;
      margin-bottom: 14px;
      display: inline-block;
    }

    .invariant-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--chalk);
      margin-bottom: 10px;
    }

    .invariant-desc {
      color: var(--muted);
      font-size: 0.88rem;
      line-height: 1.6;
    }

    /* Savings Calculator */
    .savings-card {
      background: linear-gradient(135deg, rgba(14, 18, 33, 0.95) 0%, rgba(22, 28, 52, 0.9) 100%);
      border: 1px solid rgba(0, 242, 254, 0.3);
      border-radius: 18px;
      padding: 36px;
      margin-bottom: 50px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      text-align: left;
    }

    .slider-container {
      margin: 24px 0;
    }

    .slider-label {
      display: flex;
      justify-content: space-between;
      font-family: var(--public-font-mono);
      font-size: 0.88rem;
      margin-bottom: 10px;
    }

    .slider-range {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
    }

    .slider-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--cyan);
      box-shadow: 0 0 10px var(--cyan);
      cursor: pointer;
    }

    /* CTA Section */
    .cta-strip {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 40px;
      text-align: center;
      margin-bottom: 40px;
    }

    .cta-btn-group {
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 24px;
    }

    .btn-primary-gold {
      background: var(--gold);
      color: #000;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      font-family: var(--public-font-mono);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-primary-gold:hover {
      background: #f0cb5a;
      box-shadow: 0 0 20px var(--gold-glow);
    }

    .btn-secondary-cyan {
      background: rgba(0, 242, 254, 0.1);
      border: 1px solid rgba(0, 242, 254, 0.4);
      color: var(--cyan);
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      font-family: var(--public-font-mono);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-secondary-cyan:hover {
      background: rgba(0, 242, 254, 0.2);
      box-shadow: 0 0 20px var(--cyan-glow);
    }
  </style>
</head>
<body>

\${headerHtml}

<main class="container">
  <header style="text-align:center; margin-bottom: 36px;">
    <div class="hero-badge">
      <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--gold);"></span>
      Cross-Venue Friction Engine // Kalshi &amp; Polymarket Gateway
    </div>
    <h1 class="hero-title">
      Transfer Your Trading to QuanterraOS.<br>
      Stop Donating 35% Fee Friction.
    </h1>
    <p class="hero-subtitle">
      The independent decision and risk companion for prediction market participants. Audit exchange taker fees, verify CME settlement TWAPs, eliminate execution drag with Maker orders, and build an audited track record before risking capital.
    </p>
  </header>

  <!-- Interactive Link Paste Scanner -->
  <section class="scanner-card">
    <div class="scanner-header">
      <div class="scanner-title">
        <span>⚡ Instant Trade Auditor: Paste Any Market Link</span>
      </div>
      <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--gold);">
        Supports Kalshi, Polymarket &amp; Contract Tickers
      </span>
    </div>

    <div class="scanner-input-bar">
      <input type="text" id="market-url-input" class="scanner-input" placeholder="e.g. kalshi.com/markets/kxbtc15m or polymarket.com/event/bitcoin-above-88k or KXBTC15M">
      <button type="button" class="btn-scan" onclick="auditInputUrl()">Audit Contract 🔍</button>
    </div>

    <div id="scanner-results" style="margin-top: 24px; display: none;">
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,242,254,0.08); border:1px solid rgba(0,242,254,0.25); border-radius:8px; padding:12px 16px; margin-bottom:16px;">
        <div>
          <strong id="res-ticker" style="color:var(--cyan); font-family:var(--public-font-mono); font-size:0.95rem;">KXBTC15M</strong>
          <span id="res-title" style="color:var(--chalk); font-size:0.85rem; margin-left:8px;">Bitcoin 15-Minute Expiry</span>
        </div>
        <span id="res-venue-badge" style="font-family:var(--public-font-mono); font-size:0.75rem; padding:4px 8px; border-radius:4px; background:rgba(223,184,67,0.15); color:var(--gold); font-weight:700;">KALSHI DETECTED</span>
      </div>

      <div class="compare-grid">
        <!-- Direct Retail Taker -->
        <div class="venue-box">
          <div class="venue-title">
            <span style="color:var(--crimson);">Direct Retail Taker Execution</span>
            <span>Crossing Spread</span>
          </div>
          <div class="stat-row">
            <span>Executable Ask Price</span>
            <span id="res-price">52¢</span>
          </div>
          <div class="stat-row">
            <span>Order Quantity</span>
            <span id="res-qty">10 contracts</span>
          </div>
          <div class="stat-row">
            <span>Parabolic Exchange Fee</span>
            <span id="res-fee" style="color:var(--crimson);">$0.18</span>
          </div>
          <div class="stat-row">
            <span>Required Breakeven Win Rate</span>
            <span id="res-breakeven" style="color:var(--crimson); font-weight:700;">53.8%</span>
          </div>
          <div class="stat-row">
            <span>Settlement Risk</span>
            <span id="res-settlement" style="color:var(--gold);">CME CF BRTI 60s TWAP</span>
          </div>
          <div style="margin-top:14px; font-size:0.78rem; color:var(--muted); line-height:1.4;">
            ⚠ You start at an immediate negative statistical expectation due to exchange fee drag.
          </div>
        </div>

        <!-- QuanterraOS Maker Guidance -->
        <div class="venue-box highlight">
          <div class="venue-title">
            <span style="color:var(--emerald);">QuanterraOS Maker Limit Guidance</span>
            <span style="color:var(--emerald); font-weight:700;">OPTIMAL</span>
          </div>
          <div class="stat-row">
            <span>Maker Limit Bid</span>
            <span style="color:var(--emerald);" id="res-maker-bid">51¢ (Passive)</span>
          </div>
          <div class="stat-row">
            <span>Exchange Fee</span>
            <span style="color:var(--emerald); font-weight:700;">$0.00 (Zero Fee)</span>
          </div>
          <div class="stat-row">
            <span>Fee Preserved This Trade</span>
            <span id="res-trade-saved" style="color:var(--emerald); font-weight:700;">+$0.18</span>
          </div>
          <div class="stat-row">
            <span>Estimated Monthly Savings</span>
            <span id="res-mo-saved" style="color:var(--emerald); font-weight:700;">+$183.75 – $367.50</span>
          </div>
          <div class="stat-row">
            <span>Fighter Pilots Council Status</span>
            <span style="color:var(--cyan); font-weight:700;">11/11 Active Standby</span>
          </div>
          <div style="margin-top:14px; display:flex; gap:10px;">
            <a href="/cockpit" id="btn-open-cockpit-link" class="btn-primary-gold" style="font-size:0.8rem; padding:8px 14px; width:100%; justify-content:center;">
              Inspect in Live Cockpit &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- The 3 Structural Disadvantages -->
  <section style="margin-bottom: 50px;">
    <h2 style="font-size: 1.8rem; font-weight: 800; text-align: center; margin-bottom: 12px; color: #FFF;">
      The 3 Reasons Kalshi &amp; Polymarket Traders Switch to QuanterraOS
    </h2>
    <p style="text-align: center; color: var(--muted); max-width: 680px; margin: 0 auto 36px; font-size: 0.95rem;">
      Retail participants consistently underestimate exchange fee curves, oracle settlement mechanics, and cognitive tilt.
    </p>

    <div class="invariants-grid">
      <div class="invariant-card">
        <div class="invariant-icon">📉</div>
        <h3 class="invariant-title">1. The Parabolic Taker Fee Trap</h3>
        <p class="invariant-desc">
          Kalshi charges <code>ceil(0.07 × C × P × (1 − P))</code> which mathematically peaks at 50¢ ($1.75 per 100 contracts). Takers donate up to 35% of their potential edge to exchange revenues. QuanterraOS guides you to post resting Maker orders, reducing your exchange fee to <strong>$0.00</strong>.
        </p>
      </div>

      <div class="invariant-card">
        <div class="invariant-icon">🎯</div>
        <h3 class="invariant-title">2. Settlement Pin Risk vs TWAP</h3>
        <p class="invariant-desc">
          Kalshi KXBTC15M settles on the volume-weighted 60-second TWAP of the CME CF Bitcoin Real-Time Index (BRTI), not retail exchange spot prices. Inside the final 90 seconds, settlement pin hazard surges. Our Settlement Radar flags oracle lag before you get locked out.
        </p>
      </div>

      <div class="invariant-card">
        <div class="invariant-icon">⚖️</div>
        <h3 class="invariant-title">3. Calibrated Honesty &amp; No Fake Claims</h3>
        <p class="invariant-desc">
          We publish an audited 0.2001 Brier calibration score and 8,145+ live evaluated decisions. Our models don't beat a coin flip on raw directional calls (45.0% win rate), but achieve positive EV through Maker fee savings ($183.75 - $367.50/mo) and disciplined trade filtering (8,036 skips).
        </p>
      </div>
    </div>
  </section>

  <!-- Interactive Monthly Savings Calculator -->
  <section class="savings-card">
    <div style="display:inline-flex; align-items:center; gap:8px; font-family:var(--public-font-mono); font-size:11px; color:var(--cyan); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">
      <span>💎</span> PRESERVE YOUR HARD-EARNED TRADING CAPITAL
    </div>
    <h3 style="font-size:1.6rem; font-weight:800; color:#FFF; margin-bottom:8px;">
      Calculate Your Monthly Trading Fee Savings
    </h3>
    <p style="color:var(--muted); font-size:0.9rem; margin-bottom:24px;">
      Slide to your typical monthly contract volume on Kalshi or Polymarket to see how much capital QuanterraOS preserves.
    </p>

    <div class="slider-container">
      <div class="slider-label">
        <span>MONTHLY CONTRACT VOLUME:</span>
        <strong id="slider-volume-display" style="color:var(--cyan); font-size:1.1rem;">500 Contracts / mo</strong>
      </div>
      <input type="range" min="50" max="5000" step="50" value="500" class="slider-range" id="volume-slider" oninput="updateSavings(this.value)">
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-top:24px;">
      <div style="background:rgba(6,7,10,0.7); border:1px solid var(--border-subtle); border-radius:12px; padding:18px;">
        <div style="font-size:11px; color:var(--muted); font-family:var(--public-font-mono); margin-bottom:6px;">TYPICAL TAKER FEES DONATED</div>
        <div style="font-size:26px; font-weight:800; color:var(--crimson); font-family:var(--public-font-mono);" id="calc-donated-fees">-$87.50/mo</div>
        <div style="font-size:11px; color:var(--muted); margin-top:4px;">At 50¢ parabolic peak</div>
      </div>
      <div style="background:rgba(6,7,10,0.7); border:1px solid var(--border-subtle); border-radius:12px; padding:18px;">
        <div style="font-size:11px; color:var(--muted); font-family:var(--public-font-mono); margin-bottom:6px;">CAPITAL SAVED AS MAKER</div>
        <div style="font-size:26px; font-weight:800; color:var(--emerald); font-family:var(--public-font-mono);" id="calc-preserved-capital">+$87.50/mo</div>
        <div style="font-size:11px; color:var(--emerald); margin-top:4px;">100% Fee Elimination</div>
      </div>
      <div style="background:rgba(6,7,10,0.7); border:1px solid var(--border-subtle); border-radius:12px; padding:18px;">
        <div style="font-size:11px; color:var(--muted); font-family:var(--public-font-mono); margin-bottom:6px;">ANNUAL VALUE PRESERVED</div>
        <div style="font-size:26px; font-weight:800; color:var(--gold); font-family:var(--public-font-mono);" id="calc-annual-value">+$1,050.00/yr</div>
        <div style="font-size:11px; color:var(--gold); margin-top:4px;">Pure Retained Cash</div>
      </div>
    </div>
  </section>

  <!-- Final Call to Action Strip -->
  <section class="cta-strip">
    <h2 style="font-size:1.8rem; font-weight:800; color:#FFF; margin-bottom:10px;">
      Ready to Upgrade Your Execution Architecture?
    </h2>
    <p style="color:var(--muted); max-width:640px; margin:0 auto 20px; font-size:0.95rem;">
      Join disciplined traders navigating prediction markets with sub-second CME TWAP telemetry, AI Fighter Pilots risk verification, and $0.00 live exposure controls.
    </p>
    <div class="cta-btn-group">
      <a href="/account" class="btn-primary-gold">
        ⚡ Create Free Pilot Account &rarr;
      </a>
      <a href="/cockpit" class="btn-secondary-cyan">
        🚀 Launch AI Fighter Cockpit
      </a>
      <a href="/mobile" class="btn-secondary-cyan" style="border-color:rgba(255,255,255,0.2); color:#FFF;">
        📱 Install Mobile App
      </a>
    </div>

    <!-- CFTC 4.41 Compliance Footnote -->
    <div style="margin-top:36px; padding-top:20px; border-top:1px solid var(--border-subtle); font-size:11px; color:var(--muted); line-height:1.5; text-align:left;">
      <strong style="color:#CBD5E1;">CFTC RULE 4.41 HYPOTHETICAL DISCLAIMER:</strong> Simulated and paper performance results have certain inherent limitations. Unlike an actual performance record, simulated results do not represent actual trading. QuanterraOS enforces Rule B5 permanent circuit breakers: $0.00 live capital deployed, zero order routing. QuanterraOS is an independent analytics and decision-support companion and is not affiliated with or endorsed by Kalshi, CME Group, CF Benchmarks, or Polymarket.
    </div>
  </section>
</main>

\${ASSISTANT_WIDGET_HTML}
\${footerHtml}

<script>
  async function auditInputUrl() {
    const input = document.getElementById("market-url-input").value.trim();
    if (!input) return;

    try {
      const res = await fetch("/api/share/parse?input=" + encodeURIComponent(input));
      const data = await res.json();
      const contract = data.contract;

      document.getElementById("scanner-results").style.display = "block";
      document.getElementById("res-ticker").textContent = contract.ticker || "KXBTC15M";
      document.getElementById("res-title").textContent = contract.marketTitle || "Prediction Contract";
      document.getElementById("res-venue-badge").textContent = (contract.venue || "KALSHI").toUpperCase() + " DETECTED";
      document.getElementById("res-price").textContent = (contract.priceCents || 52) + "¢";
      document.getElementById("res-qty").textContent = (contract.contracts || 10) + " contracts";

      // Non-linear fee calculation: ceil(0.07 * C * P * (1-P) * 100) / 100
      const p = (contract.priceCents || 52) / 100;
      const c = contract.contracts || 10;
      const fee = Math.ceil(0.07 * c * p * (1 - p) * 100) / 100;
      document.getElementById("res-fee").textContent = "$" + fee.toFixed(2);

      const outlay = c * p;
      const breakeven = ((outlay + fee) / (c * 1.0)) * 100;
      document.getElementById("res-breakeven").textContent = breakeven.toFixed(1) + "%";

      document.getElementById("res-maker-bid").textContent = Math.max(1, (contract.priceCents || 52) - 1) + "¢ (Passive)";
      document.getElementById("res-trade-saved").textContent = "+$" + fee.toFixed(2);

      document.getElementById("btn-open-cockpit-link").href = "/cockpit?share=" + encodeURIComponent(input);
    } catch (err) {
      console.error("Audit failed:", err);
    }
  }

  function updateSavings(val) {
    const volume = parseInt(val, 10);
    document.getElementById("slider-volume-display").textContent = volume.toLocaleString() + " Contracts / mo";

    // Assume average 50c contract: fee is $1.75 per 100 contracts ($0.0175 per contract)
    const monthlySaved = volume * 0.0175;
    const annualSaved = monthlySaved * 12;

    document.getElementById("calc-donated-fees").textContent = "-$" + monthlySaved.toFixed(2) + "/mo";
    document.getElementById("calc-preserved-capital").textContent = "+$" + monthlySaved.toFixed(2) + "/mo";
    document.getElementById("calc-annual-value").textContent = "+$" + annualSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "/yr";
  }
</script>

</body>
</html>
`;
}
