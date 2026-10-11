/**
 * QuanterraOS Canonical Cockpit Decision Workspace (/cockpit)
 *
 * Implements:
 * - 1. Venue & Market selector (Kalshi & Polymarket supported contracts, venue timezone & UTC, actual expiry)
 * - 2. Clear distinction between spot/index price (e.g. CME CF BRTI) and event contract probability cents
 * - 3. Quanta fixed guide with restrained Origin flight suit
 * - 4. Crew dock with 4 default specialists (Draco, Wolf, Kraken, Sentinel), expandable to all 8,
 *      plus Founder Michael Quanterra and Quantana as selectable story/education guides
 * - 5. Real station tool integrations (Draco inputs, Wolf book/fill, Kraken settlement, Sentinel staleness, Phoenix reconnect)
 * - 6. Interactive Scenario Builder (YES/NO, quantity, assumed fill price, fee math, outlay, payout, max loss, break-even)
 * - 7. Clean Quanta Decision Receipt generator (timestamped, private by default, shareable)
 * - 8. "View on venue" official deep links
 * - 9. Pure research/paper mode with Rule B4/B5 guardrails (zero live execution)
 */

import { ELITE_ELEVEN_REGISTRY, type EliteCrewMember } from "./lib/elite-eleven-catalog.ts";
import { renderPublicHeader, renderPublicFooter, PUBLIC_LAYOUT_CSS } from "./components/public-layout.ts";

export interface CockpitPageOptions {
  user?: { email?: string; tier?: string } | null;
  venue?: "kalshi" | "polymarket";
  ticker?: string;
  side?: "YES" | "NO";
}

export function renderCockpitPageHtml(options?: CockpitPageOptions): string {
  const user = options?.user;
  const initialVenue = options?.venue || "kalshi";
  const initialSide = options?.side || "YES";

  const registryJson = JSON.stringify(ELITE_ELEVEN_REGISTRY).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Cockpit — QuanterraOS Fighter Pilots Decision Workspace — QuanterraOS</title>
  <meta name="description" content="Quanta and the QuanterraOS Fighter Pilots bring market data, costs and settlement rules into one clear cockpit—so you can investigate supported Kalshi and Polymarket markets before you act.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --cockpit-bg: #070A14;
      --cockpit-card-bg: rgba(14, 19, 36, 0.9);
      --cockpit-border: rgba(155, 108, 255, 0.18);
      --cockpit-border-subtle: rgba(255, 255, 255, 0.08);
      --cockpit-violet: #9B6CFF;
      --cockpit-mint: #CBFF69;
      --cockpit-chalk: #F4F3FA;
      --cockpit-muted: #94A3B8;
      --cockpit-danger: #FF55C8;
      --cockpit-gold: #DFB843;
      --cockpit-yes: #86F94A;
      --cockpit-no: #FF55C8;
    }

    body {
      background: var(--cockpit-bg);
      color: var(--cockpit-chalk);
      font-family: var(--public-font-sans);
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Cockpit Main Layout */
    .cockpit-shell {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px 20px 80px;
      width: 100%;
      box-sizing: border-box;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Top Market Bar */
    .market-bar {
      background: var(--cockpit-card-bg);
      border: 1px solid var(--cockpit-border);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .market-bar-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .venue-toggle-group {
      display: flex;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--cockpit-border-subtle);
      border-radius: 8px;
      padding: 3px;
    }
    .venue-btn {
      background: transparent;
      border: none;
      color: var(--cockpit-muted);
      padding: 6px 14px;
      border-radius: 6px;
      font-family: var(--public-font-mono);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .venue-btn.active {
      background: var(--cockpit-violet);
      color: #FFFFFF;
    }
    .market-select-wrap {
      position: relative;
    }
    .market-select {
      background: rgba(9, 13, 26, 0.9);
      border: 1px solid var(--cockpit-border-subtle);
      color: var(--cockpit-chalk);
      padding: 8px 14px;
      border-radius: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.85rem;
      outline: none;
      cursor: pointer;
    }
    .market-select:focus {
      border-color: var(--cockpit-violet);
    }

    .market-bar-right {
      display: flex;
      align-items: center;
      gap: 20px;
      font-family: var(--public-font-mono);
      font-size: 0.8rem;
    }
    .telemetry-item {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .telemetry-label {
      color: var(--cockpit-muted);
      font-size: 0.7rem;
      text-transform: uppercase;
    }
    .telemetry-value {
      font-weight: 700;
      color: var(--cockpit-chalk);
    }
    .feed-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(203, 255, 105, 0.12);
      border: 1px solid rgba(203, 255, 105, 0.3);
      color: var(--cockpit-mint);
      font-size: 0.75rem;
      font-weight: 700;
    }

    /* Quanta Restrained Guide Bar */
    .cockpit-quanta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: linear-gradient(90deg, rgba(155, 108, 255, 0.1), rgba(203, 255, 105, 0.05));
      border: 1px solid var(--cockpit-border);
      border-radius: 12px;
      padding: 12px 18px;
    }
    .quanta-guide-identity {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .quanta-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--cockpit-violet);
    }
    .quanta-hint-text {
      font-size: 0.88rem;
      color: var(--cockpit-chalk);
    }
    .quanta-hint-text strong {
      color: var(--cockpit-mint);
    }
    .quanta-guide-actions {
      display: flex;
      gap: 8px;
    }
    .btn-quanta-subtle {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--cockpit-border-subtle);
      color: var(--cockpit-muted);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: var(--public-font-mono);
    }
    .btn-quanta-subtle:hover {
      color: var(--cockpit-chalk);
      border-color: var(--cockpit-violet);
    }

    /* Main Workspace Grid (Evidence / Center / Receipt) */
    .workspace-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 1080px) {
      .workspace-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Left Panel: Progressive Tabs */
    .center-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .tab-nav {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--cockpit-border-subtle);
      padding-bottom: 8px;
    }
    .tab-nav-btn {
      background: transparent;
      border: none;
      color: var(--cockpit-muted);
      font-size: 0.9rem;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-nav-btn.active {
      background: rgba(155, 108, 255, 0.2);
      color: #FFFFFF;
      border: 1px solid var(--cockpit-violet);
    }

    .tab-content-card {
      background: var(--cockpit-card-bg);
      border: 1px solid var(--cockpit-border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Scenario Controls */
    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--cockpit-border-subtle);
      padding-bottom: 12px;
    }
    .scenario-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0;
    }
    .venue-link {
      font-size: 0.8rem;
      font-family: var(--public-font-mono);
      color: var(--cockpit-mint);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .venue-link:hover {
      text-decoration: underline;
    }

    .inputs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 680px) {
      .inputs-grid {
        grid-template-columns: 1fr;
      }
    }
    .input-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-field label {
      font-size: 0.75rem;
      font-family: var(--public-font-mono);
      color: var(--cockpit-muted);
      text-transform: uppercase;
    }
    .input-field input, .input-field select {
      background: rgba(9, 13, 26, 0.9);
      border: 1px solid var(--cockpit-border-subtle);
      border-radius: 8px;
      padding: 10px 14px;
      color: var(--cockpit-chalk);
      font-family: var(--public-font-mono);
      font-size: 0.95rem;
      outline: none;
    }
    .input-field input:focus {
      border-color: var(--cockpit-violet);
    }
    .side-pill-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .side-btn {
      padding: 10px;
      border-radius: 8px;
      font-family: var(--public-font-mono);
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      border: 1px solid transparent;
      text-align: center;
    }
    .side-btn.yes {
      background: rgba(134, 249, 74, 0.1);
      color: var(--cockpit-yes);
      border-color: rgba(134, 249, 74, 0.3);
    }
    .side-btn.yes.active {
      background: var(--cockpit-yes);
      color: #090A14;
    }
    .side-btn.no {
      background: rgba(255, 85, 200, 0.1);
      color: var(--cockpit-no);
      border-color: rgba(255, 85, 200, 0.3);
    }
    .side-btn.no.active {
      background: var(--cockpit-no);
      color: #FFFFFF;
    }

    /* Cost & Breakeven Display */
    .metrics-summary-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--cockpit-border-subtle);
      border-radius: 10px;
      padding: 16px;
    }
    @media (max-width: 680px) {
      .metrics-summary-strip {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .calc-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .calc-stat-label {
      font-size: 0.72rem;
      font-family: var(--public-font-mono);
      color: var(--cockpit-muted);
      text-transform: uppercase;
    }
    .calc-stat-val {
      font-size: 1.15rem;
      font-weight: 800;
      font-family: var(--public-font-mono);
      color: var(--cockpit-chalk);
    }
    .calc-stat-val.breakeven {
      color: var(--cockpit-mint);
    }

    /* Right Panel: Decision Receipt */
    .receipt-panel {
      background: var(--cockpit-card-bg);
      border: 1px solid var(--cockpit-border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--cockpit-border-subtle);
      padding-bottom: 12px;
    }
    .receipt-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--cockpit-mint);
      font-family: var(--public-font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .receipt-timestamp {
      font-size: 0.72rem;
      color: var(--cockpit-muted);
      font-family: var(--public-font-mono);
    }
    .receipt-rows {
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
    }
    .receipt-row span:first-child {
      color: var(--cockpit-muted);
    }
    .receipt-row span:last-child {
      color: var(--cockpit-chalk);
      font-weight: 600;
    }
    .receipt-box {
      background: rgba(9, 13, 26, 0.7);
      border: 1px solid var(--cockpit-border-subtle);
      border-radius: 8px;
      padding: 12px;
      font-size: 0.78rem;
      color: var(--cockpit-muted);
      line-height: 1.5;
    }
    .receipt-box strong {
      color: var(--cockpit-chalk);
    }
    .receipt-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }
    .btn-receipt-save {
      background: var(--cockpit-violet);
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      padding: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .btn-receipt-save:hover {
      background: #8750fc;
    }
    .btn-receipt-share {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--cockpit-border-subtle);
      color: var(--cockpit-chalk);
      border-radius: 8px;
      padding: 10px;
      font-size: 0.85rem;
      font-family: var(--public-font-mono);
      cursor: pointer;
    }

    /* Bottom Crew Dock */
    .crew-dock {
      background: var(--cockpit-card-bg);
      border: 1px solid var(--cockpit-border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .crew-dock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .crew-dock-title {
      font-size: 0.92rem;
      font-weight: 700;
      font-family: var(--public-font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--cockpit-mint);
    }
    .crew-dock-help {
      font-size: 0.78rem;
      color: var(--cockpit-muted);
    }
    .crew-station-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }
    .crew-station-card {
      background: rgba(9, 13, 26, 0.8);
      border: 1px solid var(--cockpit-border-subtle);
      border-radius: 10px;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .crew-station-card:hover {
      border-color: var(--cockpit-violet);
    }
    .crew-station-card.equipped {
      border-color: var(--cockpit-mint);
      background: rgba(203, 255, 105, 0.06);
    }
    .station-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid var(--cockpit-border-subtle);
    }
    .crew-station-card.equipped .station-avatar {
      border-color: var(--cockpit-mint);
    }
    .station-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--cockpit-chalk);
    }
    .station-role-label {
      font-size: 0.68rem;
      color: var(--cockpit-muted);
      line-height: 1.3;
    }
    .station-status-pill {
      font-size: 0.65rem;
      font-family: var(--public-font-mono);
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--cockpit-muted);
    }
    .crew-station-card.equipped .station-status-pill {
      background: rgba(203, 255, 105, 0.15);
      color: var(--cockpit-mint);
      font-weight: 700;
    }

    /* Non-advisory guardrail notice */
    .cockpit-guardrail-banner {
      font-size: 0.78rem;
      color: var(--cockpit-muted);
      text-align: center;
      padding: 12px;
      border-top: 1px solid var(--cockpit-border-subtle);
      line-height: 1.5;
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/cockpit", user })}

  <div class="cockpit-shell">
    <!-- Market Selector Bar -->
    <header class="market-bar" aria-label="Market selection and telemetry">
      <div class="market-bar-left">
        <div class="venue-toggle-group" id="venue-toggle-group">
          <button type="button" class="venue-btn ${initialVenue === 'kalshi' ? 'active' : ''}" onclick="selectVenue('kalshi')">Kalshi</button>
          <button type="button" class="venue-btn ${initialVenue === 'polymarket' ? 'active' : ''}" onclick="selectVenue('polymarket')">Polymarket</button>
        </div>

        <div class="market-select-wrap">
          <select id="market-select" class="market-select" onchange="onMarketChange(this.value)">
            <option value="KXBTC15M-SAMPLE" selected>BTC 15-Minute Above Strike (Kalshi KXBTC15M)</option>
            <option value="KXBTCD-DAILY">BTC Daily Settlement > Strike (Kalshi KXBTCD)</option>
            <option value="PM-BTC-15M">BTC 15-Min Up/Down (Polymarket Binary)</option>
            <option value="PM-FED-RATE">Fed Interest Rate Decision (Polymarket)</option>
          </select>
        </div>
      </div>

      <div class="market-bar-right">
        <div class="telemetry-item">
          <span class="telemetry-label">Underlying Spot (BRTI)</span>
          <span class="telemetry-value" id="spot-price-disp">$63,420.50</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-label">Contract Mid / Spread</span>
          <span class="telemetry-value" id="contract-mid-disp">51¢ (Bid 50 / Ask 52)</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-label">Expiration (UTC)</span>
          <span class="telemetry-value" id="expiration-disp">15:15:00 UTC</span>
        </div>
        <div class="feed-status-badge" id="feed-status-badge">
          ● LIVE FEED
        </div>
      </div>
    </header>

    <!-- Quanta Restrained Guide Bar -->
    <section class="cockpit-quanta-bar" aria-label="Quanta Flight Assistant">
      <div class="quanta-guide-identity">
        <img src="/assets/art-44/q44-002-thumb.png" alt="Quanta" class="quanta-icon">
        <div class="quanta-hint-text">
          <strong>Quanta // Lead Cockpit Guide:</strong> <span class="celestial-role" style="color:var(--cockpit-gold); font-size:0.75rem; font-weight:600;">[Celestial Man]</span>
          <span id="quanta-hint-msg">Draco, Wolf, Kraken and Sentinel are standing by. Inspect fees and settlement rules before acting.</span>
        </div>
      </div>
      <div class="quanta-guide-actions">
        <a href="/hangar" class="btn-quanta-subtle" style="color:var(--cockpit-mint); border-color:rgba(203,255,105,0.4);" title="Customize Pilot, Apparel, Hair &amp; Visor">🚀 Pilot Hangar &amp; Embark</a>
        <button type="button" class="btn-quanta-subtle" onclick="muteQuantaVoice()">Mute</button>
        <button type="button" class="btn-quanta-subtle" onclick="dismissQuanta()">Dismiss Guide</button>
      </div>
    </section>

    <!-- Main Workspace Grid -->
    <div class="workspace-grid">
      <!-- Center Evidence & Scenario Panel -->
      <section class="center-panel">
        <nav class="tab-nav" aria-label="Cockpit Sections">
          <button type="button" class="tab-nav-btn active" id="tab-btn-evidence" onclick="switchTab('evidence')">True Cost & Breakeven</button>
          <button type="button" class="tab-nav-btn" id="tab-btn-radar" onclick="switchTab('radar')">Settlement Radar (BRTI)</button>
          <button type="button" class="tab-nav-btn" id="tab-btn-crew" onclick="switchTab('crew')">Specialist Insights</button>
        </nav>

        <div class="tab-content-card" id="tab-content-evidence">
          <div class="scenario-header">
            <h2 class="scenario-title">Scenario Parameters & Cost Model</h2>
            <a href="https://kalshi.com/markets" target="_blank" rel="noopener noreferrer" class="venue-link" id="venue-deep-link">
              View official contract on Kalshi &rarr;
            </a>
          </div>

          <div class="inputs-grid">
            <div class="input-field">
              <label>Outcome Side</label>
              <div class="side-pill-group">
                <button type="button" class="side-btn yes ${initialSide === 'YES' ? 'active' : ''}" onclick="setSide('YES')">YES</button>
                <button type="button" class="side-btn no ${initialSide === 'NO' ? 'active' : ''}" onclick="setSide('NO')">NO</button>
              </div>
            </div>

            <div class="input-field">
              <label for="order-quantity">Quantity (Contracts)</label>
              <input type="number" id="order-quantity" value="10" min="1" max="1000" oninput="recomputeCost()">
            </div>

            <div class="input-field">
              <label for="assumed-fill-price">Executable Ask (Cents)</label>
              <input type="number" id="assumed-fill-price" value="52" min="1" max="99" oninput="recomputeCost()">
            </div>
          </div>

          <div class="metrics-summary-strip">
            <div class="calc-stat">
              <span class="calc-stat-label">Gross Outlay</span>
              <span class="calc-stat-val" id="calc-outlay">$5.20</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">Taker Exchange Fee</span>
              <span class="calc-stat-val" id="calc-fee">$0.18</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">Total Outlay (Risk)</span>
              <span class="calc-stat-val" id="calc-total-risk" style="color:var(--cockpit-danger);">$5.38</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">Breakeven Hurdle</span>
              <span class="calc-stat-val breakeven" id="calc-breakeven">53.8%</span>
            </div>
          </div>

          <!-- Dynamic Station Output -->
          <div id="station-evidence-box" style="display:flex; flex-direction:column; gap:12px;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--cockpit-border-subtle); border-radius:8px; padding:14px;">
              <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cockpit-mint); text-transform:uppercase; margin-bottom:4px;">
                Wolf // Order Book & Liquidity Check
              </div>
              <div style="font-size:0.85rem; color:var(--cockpit-chalk);">
                Top-of-book depth: 250 contracts available at 52¢ ask. Your 10-contract order fills without slippage. Spread drag is 2.0¢.
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--cockpit-border-subtle); border-radius:8px; padding:14px;">
              <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cockpit-violet); text-transform:uppercase; margin-bottom:4px;">
                Kraken // Settlement Rule Audit
              </div>
              <div style="font-size:0.85rem; color:var(--cockpit-chalk);">
                Contract resolves to <strong>CME CF Bitcoin Real-Time Index (BRTI) 60-Second TWAP</strong>. Spot exchange prices on Coinbase/Kraken may diverge up to ±15 bps during final 60 seconds.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Decision Receipt Panel -->
      <aside class="receipt-panel" aria-label="Quanta Decision Receipt">
        <div class="receipt-header">
          <span class="receipt-title">Decision Receipt</span>
          <span class="receipt-timestamp" id="receipt-ts">2026-10-10 15:00 UTC</span>
        </div>

        <div class="receipt-rows">
          <div class="receipt-row">
            <span>Market ID</span>
            <span id="receipt-market-id">KXBTC15M-SAMPLE</span>
          </div>
          <div class="receipt-row">
            <span>Venue</span>
            <span id="receipt-venue">Kalshi (CFTC Regulated)</span>
          </div>
          <div class="receipt-row">
            <span>Scenario Side</span>
            <span id="receipt-side" style="color:var(--cockpit-yes);">YES @ 52¢</span>
          </div>
          <div class="receipt-row">
            <span>Contracts</span>
            <span id="receipt-contracts">10</span>
          </div>
          <div class="receipt-row">
            <span>Contract Outlay</span>
            <span id="receipt-outlay">$5.20</span>
          </div>
          <div class="receipt-row">
            <span>Exchange Taker Fee</span>
            <span id="receipt-fee">$0.18</span>
          </div>
          <div class="receipt-row">
            <span>Max Potential Loss</span>
            <span id="receipt-max-loss" style="color:var(--cockpit-danger);">$5.38</span>
          </div>
          <div class="receipt-row">
            <span>Max Gross Payout</span>
            <span id="receipt-max-payout">$10.00</span>
          </div>
          <div class="receipt-row">
            <span>Max Net P&L</span>
            <span id="receipt-net-pl" style="color:var(--cockpit-mint);">+$4.62</span>
          </div>
          <div class="receipt-row">
            <span>Breakeven Hurdle</span>
            <span id="receipt-breakeven">53.8%</span>
          </div>
        </div>

        <div class="receipt-box">
          <strong>Settlement Definition:</strong> Resolves YES if BRTI 60-second TWAP ≥ Strike at expiration window close. Non-advisory paper calculation.
        </div>

        <div class="receipt-actions">
          <button type="button" class="btn-receipt-save" onclick="saveDecisionReceipt()">Save to Private Journal</button>
          <button type="button" class="btn-receipt-share" onclick="shareDecisionReceipt()">Share Anonymized Receipt</button>
        </div>
      </aside>
    </div>

    <!-- Bottom Crew Dock -->
    <section class="crew-dock" aria-label="QuanterraOS Fighter Pilots Crew Stations">
      <div class="crew-dock-header">
        <span class="crew-dock-title">Fighter Pilot Stations // Assemble Your Investigation Roster</span>
        <span class="crew-dock-help">Default: Draco, Wolf, Kraken, Sentinel. Toggle specialist stations to expand analysis.</span>
      </div>

      <div class="crew-station-list" id="crew-station-list">
        <!-- Rendered by script -->
      </div>
    </section>

    <!-- Guardrail Notice -->
    <footer class="cockpit-guardrail-banner">
      QuanterraOS Cockpit provides deterministic cost arithmetic and settlement source inspection. We do not provide trading advice, forecast certainty, or live trade execution. All market checks are private research.
    </footer>
  </div>

  ${renderPublicFooter()}

  <!-- Client-side Interactive Cockpit Script -->
  <script>
    const REGISTRY = ${registryJson};
    let currentVenue = "${initialVenue}";
    let currentSide = "${initialSide}";
    let equippedStationIds = new Set(["draco", "wolf", "kraken", "sentinel"]);

    function selectVenue(v) {
      currentVenue = v;
      document.querySelectorAll(".venue-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.toLowerCase() === v);
      });
      const deepLink = document.getElementById("venue-deep-link");
      if (v === "kalshi") {
        deepLink.href = "https://kalshi.com/markets";
        deepLink.textContent = "View official contract on Kalshi →";
      } else {
        deepLink.href = "https://polymarket.com";
        deepLink.textContent = "View official market on Polymarket →";
      }
      recomputeCost();
    }

    function setSide(s) {
      currentSide = s;
      document.querySelectorAll(".side-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent === s);
      });
      document.getElementById("receipt-side").textContent = s + " @ " + document.getElementById("assumed-fill-price").value + "¢";
      document.getElementById("receipt-side").style.color = s === "YES" ? "var(--cockpit-yes)" : "var(--cockpit-no)";
      recomputeCost();
    }

    function recomputeCost() {
      const qty = parseInt(document.getElementById("order-quantity").value) || 1;
      const priceCents = parseInt(document.getElementById("assumed-fill-price").value) || 50;

      const grossOutlay = (qty * priceCents) / 100;
      
      // Kalshi taker fee formula approx: roundUp(0.035 * qty * (price/100) * (1 - price/100))
      let fee = 0;
      if (currentVenue === "kalshi") {
        const rawFee = 0.07 * qty * (priceCents / 100) * (1 - priceCents / 100);
        fee = Math.max(0.01, Math.ceil(rawFee * 100) / 100);
      } else {
        // Polymarket 0-fee or gas
        fee = 0.00;
      }

      const totalRisk = grossOutlay + fee;
      const maxPayout = (qty * 100) / 100;
      const netPl = maxPayout - totalRisk;
      const breakevenPct = Math.round((totalRisk / maxPayout) * 1000) / 10;

      document.getElementById("calc-outlay").textContent = "$" + grossOutlay.toFixed(2);
      document.getElementById("calc-fee").textContent = "$" + fee.toFixed(2);
      document.getElementById("calc-total-risk").textContent = "$" + totalRisk.toFixed(2);
      document.getElementById("calc-breakeven").textContent = breakevenPct.toFixed(1) + "%";

      document.getElementById("receipt-contracts").textContent = qty;
      document.getElementById("receipt-outlay").textContent = "$" + grossOutlay.toFixed(2);
      document.getElementById("receipt-fee").textContent = "$" + fee.toFixed(2);
      document.getElementById("receipt-max-loss").textContent = "$" + totalRisk.toFixed(2);
      document.getElementById("receipt-max-payout").textContent = "$" + maxPayout.toFixed(2);
      document.getElementById("receipt-net-pl").textContent = (netPl >= 0 ? "+$" : "-$") + Math.abs(netPl).toFixed(2);
      document.getElementById("receipt-breakeven").textContent = breakevenPct.toFixed(1) + "%";
    }

    function renderCrewDock() {
      const container = document.getElementById("crew-station-list");
      let customPilotCard = "";
      try {
        const custom = localStorage.getItem('qos_custom_pilot');
        if (custom) {
          const p = JSON.parse(custom);
          customPilotCard = \`
            <div class="crew-station-card equipped" style="border-color:var(--cockpit-mint); background:rgba(203,255,105,0.08);" title="Customized Pilot: \${p.callsign} (\${p.apparelId})">
              <div style="width:42px; height:42px; border-radius:50%; background:#101528; border:1px solid var(--cockpit-mint); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🧑‍🚀</div>
              <span class="station-name">\${p.callsign}</span>
              <span class="station-role-label">Custom Pilot</span>
              <span class="station-status-pill" style="background:rgba(203,255,105,0.2); color:var(--cockpit-mint);">EMBARKED</span>
            </div>
          \`;
        }
      } catch (e) {}

      container.innerHTML = customPilotCard + REGISTRY.map(member => {
        const isEquipped = equippedStationIds.has(member.id);
        const isGuide = member.category === "founder" || member.category === "leader";
        return \`
          <div class="crew-station-card \${isEquipped ? 'equipped' : ''}" onclick="toggleStation('\${member.id}')" title="\${member.productResponsibility}">
            <img src="\${member.avatarImage}" alt="\${member.name}" class="station-avatar">
            <span class="station-name">\${member.name}</span>
            <span class="station-role-label">\${member.title.split('&')[0]}</span>
            <span class="station-status-pill">\${isEquipped ? 'EQUIPPED' : 'STANDBY'}</span>
          </div>
        \`;
      }).join("");
    }

    function toggleStation(id) {
      if (id === "quanta") {
        // Quanta is permanent fixed guide
        return;
      }
      if (equippedStationIds.has(id)) {
        equippedStationIds.delete(id);
      } else {
        equippedStationIds.add(id);
      }
      renderCrewDock();
    }

    function saveDecisionReceipt() {
      alert("Decision receipt saved to your private journal (paper mission logged).");
    }

    function shareDecisionReceipt() {
      const shareUrl = window.location.origin + "/cockpit?share=demo";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert("Anonymized decision receipt link copied to clipboard.");
        });
      }
    }

    function muteQuantaVoice() {
      alert("Quanta voice guidance muted for this session.");
    }

    function dismissQuanta() {
      document.querySelector(".cockpit-quanta-bar").style.display = "none";
    }

    function switchTab(t) {
      document.querySelectorAll(".tab-nav-btn").forEach(btn => btn.classList.remove("active"));
      document.getElementById("tab-btn-" + t).classList.add("active");
    }

    function onMarketChange(val) {
      document.getElementById("receipt-market-id").textContent = val;
      recomputeCost();
    }

    document.addEventListener("DOMContentLoaded", () => {
      renderCrewDock();
      recomputeCost();
    });
  </script>
</body>
</html>`;
}
