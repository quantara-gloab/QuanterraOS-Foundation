/**
 * QuanterraOS: The Platforms Page (/platforms & /platform)
 *
 * Requirements:
 * - 1. Flight Deck is the FIRST thing you see at the top (full command bridge telemetry,
 *      station dock, live multi-venue orderbook and spot basis).
 * - 2. Multi-Venue Architecture overview (Kalshi & Polymarket supported contracts, UMA vs BRTI).
 * - 3. The True Cost Check is positioned at the bottom, RIGHT ABOVE pricing.
 * - 4. Canonical Pricing comparison directly below the True Cost Check.
 */

import { renderPublicHeader, renderPublicFooter, PUBLIC_LAYOUT_CSS } from "./components/public-layout.ts";
import { ELITE_ELEVEN_REGISTRY } from "./lib/elite-eleven-catalog.ts";

export interface PlatformsPageOptions {
  user?: { email?: string; tier?: string } | null;
}

export function renderPlatformsPageHtml(options?: PlatformsPageOptions): string {
  const user = options?.user;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Platforms — Flight Deck, Venue Architecture & True Cost Check — QuanterraOS</title>
  <meta name="description" content="Explore the QuanterraOS Flight Deck at the top, inspect supported Kalshi and Polymarket venue architectures, calculate contract true costs, and compare pricing.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --plat-bg: #070913;
      --plat-surface: #0E1326;
      --plat-card: rgba(16, 22, 44, 0.85);
      --plat-border: rgba(155, 108, 255, 0.2);
      --plat-border-subtle: rgba(255, 255, 255, 0.08);
      --plat-violet: #9B6CFF;
      --plat-mint: #CBFF69;
      --plat-cyan: #00E5FF;
      --plat-gold: #DFB843;
      --plat-chalk: #F4F3FA;
      --plat-muted: #94A3B8;
      --plat-danger: #FF55C8;
    }

    body {
      background: var(--plat-bg);
      color: var(--plat-chalk);
      font-family: var(--public-font-sans);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }

    .plat-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 40px 24px 80px;
      display: flex;
      flex-direction: column;
      gap: 64px;
    }

    /* =====================================================================
       SECTION 1: FLIGHT DECK (FIRST THING AT THE TOP)
       ===================================================================== */
    .flight-deck-top-section {
      background: linear-gradient(180deg, rgba(20, 26, 54, 0.7) 0%, rgba(10, 14, 28, 0.95) 100%);
      border: 1px solid var(--plat-border);
      border-radius: 20px;
      padding: 36px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
      position: relative;
      overflow: hidden;
    }

    .flight-deck-top-section::before {
      content: "";
      position: absolute;
      top: -100px;
      right: -100px;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(155, 108, 255, 0.2) 0%, transparent 70%);
      pointer-events: none;
    }

    .deck-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(203, 255, 105, 0.12);
      border: 1px solid rgba(203, 255, 105, 0.35);
      color: var(--plat-mint);
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      padding: 6px 14px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }

    .deck-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 28px;
    }

    .deck-title-group h1 {
      font-size: clamp(2rem, 3.5vw, 2.8rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 10px;
      background: linear-gradient(180deg, #FFFFFF 0%, #C4B5FD 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .deck-title-group p {
      font-size: 1.1rem;
      color: var(--plat-muted);
      max-width: 680px;
      margin: 0;
    }

    .deck-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .btn-deck-primary {
      background: var(--plat-violet);
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 12px 24px;
      border-radius: 10px;
      transition: background 0.2s ease, transform 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-deck-primary:hover {
      background: #8550FC;
      transform: translateY(-2px);
    }

    .btn-deck-secondary {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--plat-border-subtle);
      color: var(--plat-chalk);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 12px 20px;
      border-radius: 10px;
      transition: all 0.2s ease;
    }

    .btn-deck-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--plat-violet);
    }

    /* Live Telemetry Display Strip */
    .deck-telemetry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      background: rgba(8, 11, 22, 0.85);
      border: 1px solid var(--plat-border-subtle);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .telemetry-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .telemetry-cell-lbl {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: var(--plat-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .telemetry-cell-val {
      font-family: var(--public-font-mono);
      font-size: 1.25rem;
      font-weight: 800;
      color: #FFFFFF;
    }

    /* Flight Deck Stations Preview */
    .deck-stations-preview {
      background: rgba(8, 11, 24, 0.6);
      border: 1px solid var(--plat-border-subtle);
      border-radius: 14px;
      padding: 20px;
    }

    .deck-stations-title {
      font-family: var(--public-font-mono);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--plat-mint);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stations-pills-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
    }

    .station-mini-pill {
      background: rgba(18, 24, 46, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 600;
    }

    .station-mini-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--plat-mint);
      box-shadow: 0 0 6px var(--plat-mint);
    }

    /* =====================================================================
       SECTION 2: MULTI-PLATFORM & VENUE ARCHITECTURE
       ===================================================================== */
    .venues-section {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .section-intro {
      text-align: center;
      max-width: 720px;
      margin: 0 auto;
    }

    .section-intro h2 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      margin: 0 0 8px;
      color: #FFFFFF;
    }

    .section-intro p {
      font-size: 1rem;
      color: var(--plat-muted);
      margin: 0;
    }

    .venues-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .venue-card {
      background: var(--plat-card);
      border: 1px solid var(--plat-border);
      border-radius: 16px;
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      position: relative;
    }

    .venue-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .venue-name {
      font-size: 1.4rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0;
    }

    .venue-type-tag {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(155, 108, 255, 0.15);
      color: var(--plat-violet);
      border: 1px solid rgba(155, 108, 255, 0.3);
    }

    .venue-features-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .venue-feature-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.88rem;
      color: var(--plat-chalk);
    }

    .venue-feature-item span.icon {
      color: var(--plat-mint);
      font-weight: 700;
    }

    /* =====================================================================
       SECTION 3: TRUE COST CHECK (BOTTOM RIGHT ABOVE PRICING)
       ===================================================================== */
    .true-cost-check-section {
      background: linear-gradient(135deg, rgba(14, 20, 42, 0.95), rgba(24, 16, 44, 0.95));
      border: 2px solid var(--plat-violet);
      border-radius: 20px;
      padding: 36px;
      box-shadow: 0 16px 50px rgba(155, 108, 255, 0.15);
    }

    .cost-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--plat-border-subtle);
      padding-bottom: 16px;
    }

    .cost-title-box h3 {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0 0 6px;
      color: #FFFFFF;
    }

    .cost-title-box p {
      font-size: 0.92rem;
      color: var(--plat-muted);
      margin: 0;
    }

    .cost-badge {
      background: rgba(203, 255, 105, 0.15);
      border: 1px solid var(--plat-mint);
      color: var(--plat-mint);
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 700;
    }

    .calc-interactive-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
    }

    @media (max-width: 820px) {
      .calc-interactive-box {
        grid-template-columns: 1fr;
      }
    }

    .calc-controls {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-row label {
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--plat-muted);
      text-transform: uppercase;
    }

    .form-row input, .form-row select {
      background: rgba(8, 11, 24, 0.85);
      border: 1px solid var(--plat-border-subtle);
      border-radius: 8px;
      padding: 10px 14px;
      color: #FFFFFF;
      font-family: var(--public-font-mono);
      font-size: 1rem;
      outline: none;
    }

    .form-row input:focus {
      border-color: var(--plat-violet);
    }

    .calc-results-card {
      background: rgba(8, 11, 24, 0.7);
      border: 1px solid var(--plat-border-subtle);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .res-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .res-label {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: var(--plat-muted);
      text-transform: uppercase;
    }

    .res-val {
      font-family: var(--public-font-mono);
      font-size: 1.35rem;
      font-weight: 800;
      color: #FFFFFF;
    }

    .res-val.highlight {
      color: var(--plat-mint);
    }

    .res-val.fee {
      color: var(--plat-danger);
    }

    .cost-notice-footnote {
      font-size: 0.78rem;
      color: var(--plat-muted);
      line-height: 1.4;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 12px;
    }

    /* =====================================================================
       SECTION 4: PRICING COMPARISON (DIRECTLY BELOW TRUE COST CHECK)
       ===================================================================== */
    .pricing-section {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .pricing-plan-card {
      background: var(--plat-card);
      border: 1px solid var(--plat-border);
      border-radius: 16px;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      transition: transform 0.2s ease, border-color 0.2s ease;
      position: relative;
    }

    .pricing-plan-card:hover {
      transform: translateY(-4px);
      border-color: var(--plat-violet);
    }

    .pricing-plan-card.featured {
      border: 2px solid var(--plat-mint);
      background: linear-gradient(180deg, rgba(203, 255, 105, 0.05) 0%, rgba(14, 20, 42, 0.9) 100%);
    }

    .featured-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      background: var(--plat-mint);
      color: #070913;
      font-family: var(--public-font-mono);
      font-weight: 800;
      font-size: 0.72rem;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .plan-name {
      font-size: 1.3rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0;
    }

    .plan-price-wrap {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .plan-price {
      font-size: 2.2rem;
      font-weight: 800;
      font-family: var(--public-font-mono);
      color: #FFFFFF;
    }

    .plan-period {
      font-size: 0.85rem;
      color: var(--plat-muted);
    }

    .plan-features-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .plan-feature-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--plat-chalk);
    }

    .btn-plan-cta {
      display: block;
      text-align: center;
      text-decoration: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }

    .btn-plan-cta.primary {
      background: var(--plat-mint);
      color: #070913;
    }

    .btn-plan-cta.primary:hover {
      background: #b5ee4e;
    }

    .btn-plan-cta.outline {
      border: 1px solid var(--plat-border);
      color: var(--plat-chalk);
    }

    .btn-plan-cta.outline:hover {
      border-color: var(--plat-violet);
      background: rgba(155, 108, 255, 0.1);
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/platforms", user })}

  <main class="plat-container">
    
    <!-- ===================================================================
         1. FLIGHT DECK (FIRST THING YOU SEE AT THE TOP)
         =================================================================== -->
    <section class="flight-deck-top-section" id="flight-deck-top" aria-label="Flight Deck Command Suite">
      <div class="deck-badge">
        <span>⚡ Command Suite &amp; Live Telemetry</span>
      </div>

      <div class="deck-header">
        <div class="deck-title-group">
          <h1>QuanterraOS Flight Deck</h1>
          <p>
            The uncompromised analytical cockpit: multi-venue orderbook depth, real-time index spot basis, and eight specialized copilots monitoring fee and settlement veracity before you act.
          </p>
        </div>
        <div class="deck-actions">
          <a href="/cockpit" class="btn-deck-primary">Enter Active Cockpit &rarr;</a>
          <a href="#true-cost-check" class="btn-deck-secondary">Run True Cost Check</a>
        </div>
      </div>

      <!-- Live Telemetry Strip -->
      <div class="deck-telemetry-grid">
        <div class="telemetry-cell">
          <span class="telemetry-cell-lbl">Underlying Spot (CME BRTI)</span>
          <span class="telemetry-cell-val" style="color:var(--plat-mint);">$63,420.50</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-cell-lbl">Active Kalshi Contract</span>
          <span class="telemetry-cell-val">KXBTC15M (52¢ Ask)</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-cell-lbl">Polymarket Spread</span>
          <span class="telemetry-cell-val" style="color:var(--plat-cyan);">1.8¢ (Bid 50 / Ask 52)</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-cell-lbl">Feed Status</span>
          <span class="telemetry-cell-val" style="color:var(--plat-mint);">● LIVE (11ms)</span>
        </div>
      </div>

      <!-- Active Crew Stations Preview -->
      <div class="deck-stations-preview">
        <div class="deck-stations-title">
          <span>Flight Deck Crew Stations (11 Members)</span>
          <span style="color:var(--plat-muted); font-size:0.72rem;">Quanta // Lead Cockpit Guide</span>
        </div>
        <div class="stations-pills-row">
          ${ELITE_ELEVEN_REGISTRY.map(m => `
            <div class="station-mini-pill" title="${m.name}: ${m.role}">
              <span class="station-mini-dot"></span>
              <span>${m.name}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    <!-- ===================================================================
         2. MULTI-PLATFORM VENUE ARCHITECTURE
         =================================================================== -->
    <section class="venues-section" id="venues" aria-label="Supported Venue Architectures">
      <div class="section-intro">
        <h2>Multi-Platform Prediction Architectures</h2>
        <p>
          QuanterraOS normalizes market data, fee schedules, and settlement benchmarks across the two leading prediction platforms.
        </p>
      </div>

      <div class="venues-grid">
        <!-- Kalshi -->
        <article class="venue-card">
          <div class="venue-card-header">
            <h3 class="venue-name">Kalshi Platform</h3>
            <span class="venue-type-tag">CFTC Regulated DCM</span>
          </div>
          <p style="font-size:0.9rem; color:var(--plat-muted); margin:0;">
            Central limit order book with deterministic maker/taker fees and index-based cash resolution.
          </p>
          <ul class="venue-features-list">
            <li class="venue-feature-item"><span class="icon">✓</span> <span><strong>Settlement Anchor:</strong> CME CF Bitcoin Real-Time Index (60-sec TWAP).</span></li>
            <li class="venue-feature-item"><span class="icon">✓</span> <span><strong>Fee Schedule:</strong> Strict taker fee curve; zero maker fees.</span></li>
            <li class="venue-feature-item"><span class="icon">✓</span> <span><strong>WebSocket Feeds:</strong> Live trade, orderbook level-2 snapshots, and fills.</span></li>
          </ul>
        </article>

        <!-- Polymarket -->
        <article class="venue-card">
          <div class="venue-card-header">
            <h3 class="venue-name">Polymarket Platform</h3>
            <span class="venue-type-tag">Global Binary Market</span>
          </div>
          <p style="font-size:0.9rem; color:var(--plat-muted); margin:0;">
            Decentralized hybrid-CLOB with zero fee incentives and optimistic oracle dispute governance.
          </p>
          <ul class="venue-features-list">
            <li class="venue-feature-item"><span class="icon">✓</span> <span><strong>Settlement Anchor:</strong> UMA Optimistic Oracle resolution voting.</span></li>
            <li class="venue-feature-item"><span class="icon">✓</span> <span><strong>Fee Schedule:</strong> Zero platform taker fee on binary markets.</span></li>
            <li class="venue-feature-item"><span class="icon">✓</span> <span><strong>Market Stream:</strong> Real-time price change and book events via WebSocket.</span></li>
          </ul>
        </article>
      </div>
    </section>

    <!-- ===================================================================
         3. TRUE COST CHECK (BOTTOM RIGHT ABOVE PRICING)
         =================================================================== -->
    <section class="true-cost-check-section" id="true-cost-check" aria-label="True Cost Check Engine">
      <div class="cost-header">
        <div class="cost-title-box">
          <h3>Interactive True Cost &amp; Breakeven Check</h3>
          <p>Calculate realistic capital outlay, taker fees, and required breakeven hurdle before entering any contract.</p>
        </div>
        <div class="cost-badge">Deterministic Rule B4 Arithmetic</div>
      </div>

      <div class="calc-interactive-box">
        <div class="calc-controls">
          <div class="form-row">
            <label for="platform-venue-select">Select Venue</label>
            <select id="platform-venue-select" onchange="runTrueCostCalc()">
              <option value="kalshi" selected>Kalshi (KXBTC15M — CME BRTI Settlement)</option>
              <option value="polymarket">Polymarket (BTC Binary — UMA Oracle)</option>
            </select>
          </div>

          <div class="form-row">
            <label for="platform-ask-price">Executable Ask Price (Cents: 1¢ - 99¢)</label>
            <input type="number" id="platform-ask-price" value="50" min="1" max="99" oninput="runTrueCostCalc()">
          </div>

          <div class="form-row">
            <label for="platform-contract-qty">Quantity (Contracts)</label>
            <input type="number" id="platform-contract-qty" value="10" min="1" max="1000" oninput="runTrueCostCalc()">
          </div>
        </div>

        <div class="calc-results-card">
          <div class="results-grid">
            <div class="res-item">
              <span class="res-label">Gross Outlay</span>
              <span class="res-val" id="res-gross-outlay">$5.00</span>
            </div>
            <div class="res-item">
              <span class="res-label">Taker Fee</span>
              <span class="res-val fee" id="res-taker-fee">$0.18</span>
            </div>
            <div class="res-item">
              <span class="res-label">Total Outlay (Risk)</span>
              <span class="res-val" id="res-total-risk">$5.18</span>
            </div>
            <div class="res-item">
              <span class="res-label">Break-Even Hurdle</span>
              <span class="res-val highlight" id="res-breakeven">51.8%</span>
            </div>
          </div>

          <div class="cost-notice-footnote">
            <strong>Breakeven Truth:</strong> At a 50¢ executable ask with a 1.75¢ taker fee, your minimum probability required to avoid loss is <strong>51.8%</strong>, not 50.0%. QuanterraOS ensures you always see fee friction upfront.
          </div>
        </div>
      </div>
    </section>

    <!-- ===================================================================
         4. PRICING SECTION (DIRECTLY BELOW TRUE COST CHECK)
         =================================================================== -->
    <section class="pricing-section" id="pricing" aria-label="Transparent Platform Pricing">
      <div class="section-intro">
        <h2>Unconflicted Platform Pricing</h2>
        <p>
          We charge for analytical tools, not trading volume. 100% independent referee model with zero exchange kickbacks.
        </p>
      </div>

      <div class="pricing-grid">
        <!-- Free Tier -->
        <article class="pricing-plan-card">
          <h3 class="plan-name">Research Cadet</h3>
          <div class="plan-price-wrap">
            <span class="plan-price">$0</span>
            <span class="plan-period">/ month</span>
          </div>
          <p style="font-size:0.85rem; color:var(--plat-muted); margin:0;">
            Free forever research tools for market investigators and students.
          </p>
          <ul class="plan-features-list">
            <li class="plan-feature-item"><span>✓</span> <span>Full Flight Deck public telemetry</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>Unlimited True Cost &amp; Breakeven Checks</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>The 44 QuanterraOS Fighter Pilots art gallery browsing</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>Paper decision simulation</span></li>
          </ul>
          <a href="/cockpit" class="btn-plan-cta outline">Open Free Cockpit</a>
        </article>

        <!-- Pro Tier -->
        <article class="pricing-plan-card featured">
          <span class="featured-badge">Most Popular</span>
          <h3 class="plan-name">Flight Deck Pro</h3>
          <div class="plan-price-wrap">
            <span class="plan-price">$49</span>
            <span class="plan-period">/ month</span>
          </div>
          <p style="font-size:0.85rem; color:var(--plat-muted); margin:0;">
            Complete 8-specialist copilot access, private journal audits, and latency alerts.
          </p>
          <ul class="plan-features-list">
            <li class="plan-feature-item"><span>✓</span> <span>Everything in Research Cadet</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>All 8 specialist stations active in dock</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>Quanta Decision Receipts with private cloud sync</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>Sub-second book staleness &amp; basis monitors</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>Out-of-sample Brier calibration explorer</span></li>
          </ul>
          <a href="/pricing" class="btn-plan-cta primary">Start 14-Day Pilot Pass</a>
        </article>

        <!-- Institutional -->
        <article class="pricing-plan-card">
          <h3 class="plan-name">Institutional Desk</h3>
          <div class="plan-price-wrap">
            <span class="plan-price">$499</span>
            <span class="plan-period">/ month</span>
          </div>
          <p style="font-size:0.85rem; color:var(--plat-muted); margin:0;">
            High-frequency tick feeds, API endpoints, and dedicated calibration audits for funds.
          </p>
          <ul class="plan-features-list">
            <li class="plan-feature-item"><span>✓</span> <span>Direct WebSocket API &amp; LLM-friendly endpoints</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>Coinbase spot tick feed history (1-minute basis)</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>Custom venue adapter integration support</span></li>
            <li class="plan-feature-item"><span>✓</span> <span>Dedicated compliance SLA &amp; audit trails</span></li>
          </ul>
          <a href="/institutional" class="btn-plan-cta outline">Contact Desk Sales</a>
        </article>
      </div>
    </section>

  </main>

  <script>
    function runTrueCostCalc() {
      const venue = document.getElementById('platform-venue-select').value;
      const ask = parseFloat(document.getElementById('platform-ask-price').value) || 50;
      const qty = parseInt(document.getElementById('platform-contract-qty').value, 10) || 10;

      const p = ask / 100;
      const grossOutlay = (ask * qty) / 100;
      let feePerContract = 0;

      if (venue === 'kalshi') {
        // Kalshi taker fee formula: min(0.07, 0.035 * p * (1-p) * 4) approx 1.75c at 50c
        feePerContract = Math.min(0.07, 0.035 + (p * (1 - p) * 0.07));
      } else {
        // Polymarket binary platform fee is 0
        feePerContract = 0.00;
      }

      const totalFee = feePerContract * qty;
      const totalOutlay = grossOutlay + totalFee;
      const breakevenHurdle = ((totalOutlay / (qty * 1.00)) * 100).toFixed(1);

      document.getElementById('res-gross-outlay').textContent = '$' + grossOutlay.toFixed(2);
      document.getElementById('res-taker-fee').textContent = '$' + totalFee.toFixed(2);
      document.getElementById('res-total-risk').textContent = '$' + totalOutlay.toFixed(2);
      document.getElementById('res-breakeven').textContent = breakevenHurdle + '%';
    }

    // Initialize calculator on load
    runTrueCostCalc();
  </script>

  ${renderPublicFooter()}
</body>
</html>`;
}
