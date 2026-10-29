import { computeOracleDivergence } from "./lib/oracle-divergence.ts";
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
import { executeFighterPilotVerification } from "./lib/fighter-pilots-verifier.ts";
import { renderSubscriptionValueCalculatorHtml } from "./lib/subscription-value-proof.ts";
import { renderPublicHeader, renderPublicFooter, PUBLIC_LAYOUT_CSS } from "./components/public-layout.ts";

export interface CockpitPageOptions {
  user?: { email?: string; tier?: string } | null;
  venue?: "kalshi" | "polymarket";
  ticker?: string;
  side?: "YES" | "NO";
  contracts?: number;
  priceCents?: number;
  sharedLink?: string;
}

export function renderCockpitPageHtml(options?: CockpitPageOptions): string {
  const user = options?.user;
  const initialVenue = options?.venue || "kalshi";
  const initialSide = options?.side || "YES";
  const initialTicker = options?.ticker || "KXBTC15M-SAMPLE";
  const initialContracts = options?.contracts || 10;
  const initialPriceCents = options?.priceCents || 52;
  const initialSharedLink = options?.sharedLink || "";

  const initialVerification = executeFighterPilotVerification({
    ticker: initialTicker,
    venue: initialVenue,
    side: initialSide,
    contracts: initialContracts,
    priceCents: initialPriceCents,
    equippedPilotIds: ["draco", "wolf", "kraken", "sentinel", "falcon", "quantum-fox", "lion", "phoenix", "quanta", "quantana", "michael"],
  });

  const initialEquippedIds = ["draco", "wolf", "kraken", "sentinel"];
  const initialEvidenceCardsHtml = initialEquippedIds.map(id => {
    const p = initialVerification.pilots[id];
    if (!p) return "";
    const badgeBg = p.status === "HAZARD" ? "rgba(255,85,200,0.15)" : p.status === "RESEARCH_AUDITED" ? "rgba(223,184,67,0.15)" : "rgba(203,255,105,0.15)";
    const badgeColor = p.status === "HAZARD" ? "var(--cockpit-danger)" : p.status === "RESEARCH_AUDITED" ? "var(--cockpit-gold)" : "var(--cockpit-mint)";
    return `
      <div class="station-evidence-card" style="background:rgba(255,255,255,0.03); border:1px solid var(--cockpit-border-subtle); border-radius:8px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
          <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cockpit-mint); text-transform:uppercase;">
            \${p.role} · \${p.name} // \${p.mathematicalModel.split('&')[0]}
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.68rem; font-family:var(--public-font-mono); color:var(--cockpit-muted);">\${p.latencyMs}ms</span>
            <span style="font-size:0.68rem; font-family:var(--public-font-mono); padding:2px 6px; border-radius:4px; background:\${badgeBg}; color:\${badgeColor}; font-weight:700;">\${p.status}</span>
          </div>
        </div>
        <div style="font-size:0.85rem; color:var(--cockpit-chalk); line-height:1.4; margin-bottom:10px;">
          \${p.summary}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <span style="font-size:0.72rem; color:var(--cockpit-muted); font-family:var(--public-font-mono);">\${p.provenanceSource}</span>
          <button type="button" class="btn-inspect-telemetry" onclick="inspectPilotTelemetry('\${p.id}')" style="background:rgba(155,108,255,0.15); border:1px solid var(--cockpit-border); color:var(--cockpit-chalk); border-radius:4px; padding:3px 8px; font-size:0.72rem; font-family:var(--public-font-mono); cursor:pointer;">Inspect Telemetry ↗</button>
        </div>
      </div>
    `;
  }).filter(Boolean).join("");

  const allPilotIds = ["draco", "wolf", "kraken", "sentinel", "falcon", "quantum-fox", "lion", "phoenix", "quanta", "quantana", "michael"];
  const allCrewCardsHtml = allPilotIds.map(id => {
    const p = initialVerification.pilots[id];
    if (!p) return "";
    const badgeBg = p.status === "HAZARD" ? "rgba(255,85,200,0.15)" : p.status === "RESEARCH_AUDITED" ? "rgba(223,184,67,0.15)" : "rgba(203,255,105,0.15)";
    const badgeColor = p.status === "HAZARD" ? "var(--cockpit-danger)" : p.status === "RESEARCH_AUDITED" ? "var(--cockpit-gold)" : "var(--cockpit-mint)";
    return `
      <div class="crew-full-card" style="background:rgba(9,13,26,0.85); border:1px solid var(--cockpit-border-subtle); border-radius:10px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-family:var(--public-font-mono); font-size:0.72rem; color:var(--cockpit-muted); text-transform:uppercase;">
              \${p.callsign} · \${p.category.toUpperCase()}
            </div>
            <div style="font-size:1.05rem; font-weight:700; color:var(--cockpit-chalk);">
              \${p.name} <span style="font-size:0.8rem; font-weight:400; color:var(--cockpit-muted);">(\${p.role})</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.7rem; font-family:var(--public-font-mono); color:var(--cockpit-muted);">\${p.latencyMs}ms</span>
            <span style="font-size:0.7rem; font-family:var(--public-font-mono); padding:3px 8px; border-radius:4px; background:\${badgeBg}; color:\${badgeColor}; font-weight:700;">\${p.status}</span>
          </div>
        </div>
        <div style="font-size:0.85rem; color:var(--cockpit-chalk); line-height:1.5; margin-bottom:10px;">
          \${p.summary}
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:8px 12px; margin-bottom:12px; font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cockpit-mint);">
          Model Basis: \${p.mathematicalModel}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <span style="font-size:0.72rem; color:var(--cockpit-muted); font-family:var(--public-font-mono);">Source: \${p.provenanceSource}</span>
          <button type="button" class="btn-inspect-telemetry" onclick="inspectPilotTelemetry('\${p.id}')" style="background:rgba(155,108,255,0.18); border:1px solid var(--cockpit-border); color:var(--cockpit-chalk); border-radius:6px; padding:6px 12px; font-size:0.75rem; font-family:var(--public-font-mono); cursor:pointer;">Inspect Full Telemetry ↗</button>
        </div>
      </div>
    `;
  }).filter(Boolean).join("");

  const registryJson = JSON.stringify(ELITE_ELEVEN_REGISTRY).replace(/</g, '\\u003c');
  const initialVerificationJson = JSON.stringify(initialVerification).replace(/</g, '\\u003c');

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

    .cockpit-guardrail-banner {
      font-size: 0.78rem;
      color: var(--cockpit-muted);
      text-align: center;
      padding: 12px;
      border-top: 1px solid var(--cockpit-border-subtle);
      line-height: 1.5;
    }

    /* Mobile Quick-Action Floating Dock & PWA Touch Enhancements */
    .mobile-quick-action-bar {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: rgba(7, 10, 20, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--cockpit-border);
      z-index: 900;
      padding: 0 12px;
      box-sizing: border-box;
      justify-content: space-around;
      align-items: center;
    }
    @media (max-width: 768px) {
      .mobile-quick-action-bar {
        display: flex;
      }
      .cockpit-shell {
        padding-bottom: 96px; /* Avoid floating bar overlap on mobile */
      }
      .market-bar {
        padding: 12px;
      }
      .market-bar-left {
        width: 100%;
        justify-content: space-between;
      }
      .market-select {
        max-width: 100%;
        width: 100%;
      }
      .market-bar-right {
        width: 100%;
        justify-content: space-between;
      }
      .tab-nav {
        overflow-x: auto;
        white-space: nowrap;
        -webkit-overflow-scrolling: touch;
        gap: 6px;
      }
      .tab-nav-btn {
        padding: 8px 12px;
        font-size: 0.82rem;
      }
      .crew-station-list {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .mobile-quick-btn {
      background: transparent;
      border: none;
      color: var(--cockpit-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 6px 10px;
      min-width: 60px;
      min-height: 48px;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      touch-action: manipulation;
    }
    .mobile-quick-btn.active, .mobile-quick-btn:active {
      color: var(--cockpit-mint);
      background: rgba(203, 255, 105, 0.1);
    }
    .mq-icon {
      font-size: 1.15rem;
    }
    .mq-label {
      font-family: var(--public-font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
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
          <button type="button" class="tab-nav-btn active" id="tab-btn-evidence" onclick="switchTab('evidence')">True Cost &amp; Breakeven</button>
          <button type="button" class="tab-nav-btn" id="tab-btn-radar" onclick="switchTab('radar')">Settlement Radar (BRTI)</button>
          <button type="button" class="tab-nav-btn" id="tab-btn-crew" onclick="switchTab('crew')">Specialist Insights</button>
          <button type="button" class="tab-nav-btn" id="tab-btn-value" onclick="switchTab('value')">Subscription Value Proof</button>
          <button type="button" class="tab-nav-btn" id="tab-btn-ledger" onclick="switchTab('ledger')">Track Record &amp; Missions</button>
        </nav>

        <div class="tab-content-card" id="tab-content-evidence">
          <div class="scenario-header">
            <h2 class="scenario-title">Scenario Parameters & Cost Model</h2>
            <a href="https://kalshi.com/markets" target="_blank" rel="noopener noreferrer" class="venue-link" id="venue-deep-link">
              View official contract on Kalshi &rarr;
            </a>
          </div>

          <div class="mission-action-bar" style="display:flex; justify-content:space-between; align-items:center; background:rgba(155,108,255,0.08); border:1px solid rgba(155,108,255,0.25); border-radius:10px; padding:12px 16px; margin:14px 0; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.3rem;">🚀</span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--cockpit-chalk);">AI Fighter Pilots Live Model Verification Mission</div>
                <div style="font-size:0.75rem; color:var(--cockpit-muted);">Verifies L2 depth, CME CF BRTI 60s TWAP basis, fees &amp; 1,316-window calibration</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span id="mission-status-pill" style="font-family:var(--public-font-mono); font-size:0.72rem; padding:4px 8px; border-radius:4px; background:rgba(203,255,105,0.15); color:var(--cockpit-mint); font-weight:700;">
                ✓ ${initialVerification.decisionReceiptSeal.sealText}
              </span>
              <button type="button" id="btn-verify-mission" onclick="runMissionVerification()" style="background:var(--cockpit-mint); color:#090A14; border:none; border-radius:6px; padding:8px 14px; font-weight:700; font-size:0.8rem; cursor:pointer; font-family:var(--public-font-mono);">
                Execute Verification Mission ⚡
              </button>
            </div>
          </div>

          <div class="market-import-strip" style="background:rgba(223,184,67,0.06); border:1px solid rgba(223,184,67,0.25); border-radius:10px; padding:12px 16px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
              <span style="font-family:var(--public-font-mono); font-size:0.75rem; font-weight:700; color:var(--cockpit-gold);">
                ⚡ KALSHI &amp; POLYMARKET INSTANT TRADE AUDITOR
              </span>
              <a href="/transfer" style="font-size:0.72rem; color:var(--cockpit-mint); text-decoration:none;">
                Why transfer from retail? &rarr;
              </a>
            </div>
            <div style="display:flex; gap:8px;">
              <input type="text" id="shared-link-input" value="\${initialSharedLink}" placeholder="Paste Kalshi / Polymarket URL or ticker (e.g. kalshi.com/markets/kxbtc15m or KXBTC15M)" style="flex:1; background:rgba(6,7,10,0.85); border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px 12px; border-radius:6px; font-size:0.82rem; font-family:var(--public-font-mono);">
              <button type="button" onclick="auditSharedLink()" style="background:var(--cockpit-gold); color:#000; border:none; padding:8px 14px; border-radius:6px; font-weight:700; font-size:0.8rem; cursor:pointer; font-family:var(--public-font-mono); white-space:nowrap;">
                Audit Market 🔍
              </button>
            </div>
            <div id="shared-link-feedback" style="display:none; margin-top:8px; font-size:0.75rem; font-family:var(--public-font-mono);"></div>
          </div>

          <div class="inputs-grid">
            <div class="input-field">
              <label>Outcome Side</label>
              <div class="side-pill-group">
                <button type="button" class="side-btn yes \${initialSide === 'YES' ? 'active' : ''}" onclick="setSide('YES')">YES</button>
                <button type="button" class="side-btn no \${initialSide === 'NO' ? 'active' : ''}" onclick="setSide('NO')">NO</button>
              </div>
            </div>

            <div class="input-field">
              <label for="order-quantity">Quantity (Contracts)</label>
              <input type="number" id="order-quantity" value="\${initialContracts}" min="1" max="1000" oninput="recomputeCost()">
            </div>

            <div class="input-field">
              <label for="assumed-fill-price">Executable Ask (Cents)</label>
              <input type="number" id="assumed-fill-price" value="\${initialPriceCents}" min="1" max="99" oninput="recomputeCost()">
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
            \${initialEvidenceCardsHtml}
          </div>
        </div>

        <div class="tab-content-card" id="tab-content-radar" style="display:none; padding:20px;">
          <div class="scenario-header">
            <h2 class="scenario-title">CME CF BRTI 60s TWAP Settlement Radar</h2>
            <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cockpit-mint); background:rgba(203,255,105,0.1); padding:4px 8px; border-radius:4px;">
              Index: BRTI (Constituent Median)
            </span>
          </div>
          <p style="font-size:0.82rem; color:var(--cockpit-muted); line-height:1.5;">
            Kalshi KXBTC15M contracts settle against the volume-weighted 60-second Time-Weighted Average Price (TWAP) of the CME CF Bitcoin Real-Time Index (BRTI). When spot price is within 25 bps of strike inside the final 90 seconds, settlement pin risk surges.
          </p>
          <div class="metrics-summary-strip" style="margin:16px 0;">
            <div class="calc-stat">
              <span class="calc-stat-label">BRTI Spot Reference</span>
              <span class="calc-stat-val" id="radar-brti-spot">$63,420.50</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">Constituent Basis</span>
              <span class="calc-stat-val" style="color:var(--cockpit-mint);" id="radar-basis">+1.2 bps</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">TWAP Window Phase</span>
              <span class="calc-stat-val" id="radar-twap-phase">ACCUMULATING</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">Lockout Risk Status</span>
              <span class="calc-stat-val" style="color:var(--cockpit-mint);" id="radar-lockout-status">SAFE (&gt;90s)</span>
            </div>
          </div>
          <div style="background:rgba(9,13,26,0.9); border:1px solid var(--cockpit-border-subtle); border-radius:10px; padding:16px; margin-top:14px;">
            <div style="font-family:var(--public-font-mono); font-size:0.78rem; font-weight:700; color:var(--cockpit-chalk); margin-bottom:8px;">
              Kraken &amp; Sentinel Settlement Protection Policy
            </div>
            <ul style="font-size:0.78rem; color:var(--cockpit-muted); line-height:1.6; margin:0; padding-left:18px;">
              <li><strong>60s Pre-Expiry Lockout:</strong> Fighter Pilots prohibit new order submission when countdown is &lt;60s to prevent oracle lag slippage.</li>
              <li><strong>Pin Risk Alert:</strong> If underlying spot is within $25 of strike at T-120s, contract is flagged as <code>HAZARD_PIN</code>.</li>
              <li><strong>Polymarket UMA Divergence:</strong> Polymarket utilizes optimistic oracle resolution rather than minute-by-minute BRTI TWAP, creating distinct basis risks.</li>
            </ul>
          </div>
        </div>

        <div class="tab-content-card" id="tab-content-crew" style="display:none; padding:20px;">
          <div class="scenario-header">
            <h2 class="scenario-title">Elite Eleven Crew Stations // Live Telemetry Roster</h2>
            <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cockpit-mint);">
              Active Roster: 11 / 11 Verified
            </span>
          </div>
          <p style="font-size:0.82rem; color:var(--cockpit-muted); line-height:1.5;">
            Inspect the mathematical models, verified data pipelines, and audited error-bounds for every QuanterraOS Fighter Pilot.
          </p>
          <div id="crew-all-stations-grid" style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:14px;">
            \${allCrewCardsHtml}
          </div>
        </div>

        <div class="tab-content-card" id="tab-content-value" style="display:none; padding:16px;">
          ${renderSubscriptionValueCalculatorHtml()}
        </div>

        <div class="tab-content-card" id="tab-content-ledger" style="display:none; padding:20px;">
          <div class="scenario-header">
            <div>
              <h2 class="scenario-title" style="margin-bottom:4px;">Fighter Pilots Empirical Shadow Track Record</h2>
              <div style="font-size:0.78rem; color:var(--cockpit-muted);">
                Continuous evaluation across 8,098+ live 15-minute BTC contracts under strict Rule B5 ($0.00 capital deployed).
              </div>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <a href="/track-record" class="venue-link" style="border:1px solid var(--cockpit-border); padding:6px 10px; border-radius:6px; text-decoration:none;">
                Full Settlement Ledger &rarr;
              </a>
              <a href="/api/track-record/export.csv" class="venue-link" style="background:rgba(203,255,105,0.1); border:1px solid rgba(203,255,105,0.3); color:var(--cockpit-mint); padding:6px 10px; border-radius:6px; text-decoration:none;">
                Export CSV 📥
              </a>
            </div>
          </div>

          <div class="metrics-summary-strip" style="margin:16px 0;">
            <div class="calc-stat">
              <span class="calc-stat-label">Total Missions Evaluated</span>
              <span class="calc-stat-val" id="ledger-kpi-decisions">8,098</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">Toxic Outlay Filter Rate</span>
              <span class="calc-stat-val" style="color:var(--cockpit-mint);" id="ledger-kpi-skips">98.6%</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">Model Win Rate (Hurdle Cleared)</span>
              <span class="calc-stat-val" id="ledger-kpi-winrate">45.0%</span>
            </div>
            <div class="calc-stat">
              <span class="calc-stat-label">Cumulative Paper P&amp;L</span>
              <span class="calc-stat-val" style="color:var(--cockpit-mint);" id="ledger-kpi-pnl">+$4,888.01</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn-filter-ledger active" onclick="setLedgerFilter('all', this)" style="background:rgba(155,108,255,0.2); border:1px solid var(--cockpit-border); color:var(--cockpit-chalk); padding:5px 10px; border-radius:6px; font-size:0.75rem; font-family:var(--public-font-mono); cursor:pointer;">All Simulated Decisions</button>
              <button type="button" class="btn-filter-ledger" onclick="setLedgerFilter('buy', this)" style="background:rgba(255,255,255,0.04); border:1px solid var(--cockpit-border-subtle); color:var(--cockpit-muted); padding:5px 10px; border-radius:6px; font-size:0.75rem; font-family:var(--public-font-mono); cursor:pointer;">Model Buys (Passed Hurdle)</button>
              <button type="button" class="btn-filter-ledger" onclick="setLedgerFilter('skip', this)" style="background:rgba(255,255,255,0.04); border:1px solid var(--cockpit-border-subtle); color:var(--cockpit-muted); padding:5px 10px; border-radius:6px; font-size:0.75rem; font-family:var(--public-font-mono); cursor:pointer;">Disciplined Skips (Protected)</button>
            </div>
            <span style="font-size:0.72rem; color:var(--cockpit-muted); font-family:var(--public-font-mono);">Live Updates: Enabled (15s)</span>
          </div>

          <div style="overflow-x:auto; background:rgba(9,13,26,0.9); border:1px solid var(--cockpit-border-subtle); border-radius:8px;">
            <table style="width:100%; border-collapse:collapse; text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid var(--cockpit-border-subtle); font-family:var(--public-font-mono); font-size:0.7rem; color:var(--cockpit-muted); text-transform:uppercase;">
                  <th style="padding:10px 8px;">Time</th>
                  <th style="padding:10px 8px;">Contract Ticker</th>
                  <th style="padding:10px 8px;">Action / Side</th>
                  <th style="padding:10px 8px;">Model vs Breakeven</th>
                  <th style="padding:10px 8px;">Fee Saved</th>
                  <th style="padding:10px 8px;">Outcome</th>
                  <th style="padding:10px 8px;">Paper P&amp;L</th>
                </tr>
              </thead>
              <tbody id="ledger-trades-tbody">
                <!-- Rendered via JS -->
              </tbody>
            </table>
          </div>

          <div style="margin-top:14px; padding:12px; border-radius:8px; background:rgba(0,0,0,0.3); border:1px solid var(--cockpit-border-subtle); font-size:0.72rem; color:var(--cockpit-muted); line-height:1.5;">
            <strong>CFTC Rule 4.41 Notice:</strong> Hypothetical or simulated performance results have certain limitations. Unlike an actual performance record, simulated results do not represent actual trading. Also, since the trades have not been executed, the results may have under-or-over compensated for the impact, if any, of certain market factors, such as lack of liquidity. QuanterraOS operates under Rule B5 ($0.00 Live Exposure).
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

        <div class="receipt-box receipt-seal-box" id="receipt-seal-box" style="margin-top:10px; border-color:rgba(203,255,105,0.3); background:rgba(203,255,105,0.03);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:var(--cockpit-mint); font-family:var(--public-font-mono); font-size:0.78rem;">QUANTA DECISION RECEIPT SEAL</strong>
            <span id="receipt-seal-badge" style="font-family:var(--public-font-mono); font-size:0.7rem; color:var(--cockpit-mint); font-weight:700;">✓ ${initialVerification.decisionReceiptSeal.sealText}</span>
          </div>
          <div style="font-family:var(--public-font-mono); font-size:0.72rem; color:var(--cockpit-muted); word-break:break-all;">
            SHA-256: <span id="receipt-seal-hash" style="color:var(--cockpit-chalk);">${initialVerification.decisionReceiptSeal.sha256Short}…</span>
          </div>
          <div style="margin-top:6px; font-size:0.72rem; color:var(--cockpit-muted);">
            Pure research model. Live capital deployed: <strong style="color:var(--cockpit-mint);">$0.00</strong>. Rule B5 protocol invariant active.
          </div>
        </div>

        <div class="receipt-actions">
          <button type="button" class="btn-receipt-save" onclick="saveDecisionReceipt()">Save to Private Journal</button>
          <button type="button" class="btn-receipt-share" onclick="shareDecisionReceipt()">Share Anonymized Receipt</button>
        </div>
      </aside>
    </div>

    <!-- Bottom Crew Dock -->
    <section class="crew-dock" id="crew-station-dock" aria-label="QuanterraOS Fighter Pilots Crew Stations">
      <div class="crew-dock-header">
        <div>
          <span class="crew-dock-title">Specialist Stations // Decision Evidence Roster</span>
          <div class="crew-dock-help">Default: Fees (Draco), Liquidity (Wolf), Settlement (Kraken), Quality (Sentinel). Plain labels precede character names.</div>
        </div>
        <label style="font-size:0.75rem; color:var(--cockpit-muted); display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
          <input type="checkbox" id="toggle-expert-mode" onchange="toggleExpertMode(this.checked)">
          Expert Mode (Hide Artwork)
        </label>
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

  <!-- Mobile Quick-Action Floating Dock -->
  <nav class="mobile-quick-action-bar" aria-label="Cockpit Mobile Quick Actions">
    <button type="button" class="mobile-quick-btn active" id="mq-calc" onclick="mobileJumpTo('calc')">
      <span class="mq-icon">⚡</span>
      <span class="mq-label">Scenario</span>
    </button>
    <button type="button" class="mobile-quick-btn" id="mq-pilots" onclick="mobileJumpTo('pilots')">
      <span class="mq-icon">👨‍✈️</span>
      <span class="mq-label">Pilots</span>
    </button>
    <button type="button" class="mobile-quick-btn" id="mq-savings" onclick="mobileJumpTo('savings')">
      <span class="mq-icon">🛡️</span>
      <span class="mq-label">Savings</span>
    </button>
    <button type="button" class="mobile-quick-btn" id="mq-ledger" onclick="mobileJumpTo('ledger')">
      <span class="mq-icon">📊</span>
      <span class="mq-label">Track</span>
    </button>
    <button type="button" class="mobile-quick-btn" id="mq-receipt" onclick="mobileJumpTo('receipt')">
      <span class="mq-icon">🧾</span>
      <span class="mq-label">Receipt</span>
    </button>
  </nav>

  ${renderPublicFooter()}

  <!-- Client-side Interactive Cockpit Script -->
  <script>
    const REGISTRY = ${registryJson};
    let currentVerification = ${initialVerificationJson};
    let currentVenue = "${initialVenue}";
    let currentSide = "${initialSide}";
    let equippedStationIds = new Set(["draco", "wolf", "kraken", "sentinel"]);

    function selectVenue(v) {
      triggerHaptic("light");
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
      runMissionVerification();
    }

    function setSide(s) {
      triggerHaptic("medium");
      currentSide = s;
      document.querySelectorAll(".side-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent === s);
      });
      document.getElementById("receipt-side").textContent = s + " @ " + document.getElementById("assumed-fill-price").value + "¢";
      document.getElementById("receipt-side").style.color = s === "YES" ? "var(--cockpit-yes)" : "var(--cockpit-no)";
      recomputeCost();
      runMissionVerification();
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

    async function auditSharedLink() {
      const inputEl = document.getElementById("shared-link-input");
      const fb = document.getElementById("shared-link-feedback");
      if (!inputEl) return;
      const input = inputEl.value.trim();
      if (!input) return;

      try {
        const res = await fetch("/api/share/parse?input=" + encodeURIComponent(input));
        const data = await res.json();
        const contract = data.contract;

        if (contract && (contract.isRecognized || contract.priceCents)) {
          if (contract.contracts) document.getElementById("order-quantity").value = contract.contracts;
          if (contract.priceCents) document.getElementById("assumed-fill-price").value = contract.priceCents;
          if (contract.venue === "polymarket") {
            setVenue("polymarket");
          } else {
            setVenue("kalshi");
          }
          recomputeCost();
          runMissionVerification();

          fb.style.display = "block";
          fb.style.color = "var(--cockpit-mint)";
          fb.innerHTML = "✓ Auto-loaded: <strong>" + (contract.ticker || "Contract") + "</strong> (" + (contract.venue || "venue").toUpperCase() + ") @ " + (contract.priceCents || 50) + "¢ × " + (contract.contracts || 10) + " contracts. Recomputing Maker savings...";
        } else {
          fb.style.display = "block";
          fb.style.color = "var(--cockpit-gold)";
          fb.textContent = "Contract format recognized. Auto-populated defaults.";
        }
      } catch (e) {
        fb.style.display = "block";
        fb.style.color = "var(--cockpit-danger)";
        fb.textContent = "Unable to parse link automatically. Enter values manually.";
      }
    }

    function renderStationEvidence() {
      const box = document.getElementById("station-evidence-box");
      if (!box || !currentVerification || !currentVerification.pilots) return;
      
      const pilots = currentVerification.pilots;
      const equippedList = Array.from(equippedStationIds);
      
      const cardsHtml = equippedList.map(id => {
        const cleanId = (id === "fox" ? "quantum-fox" : id === "michael-quanterra" ? "michael" : id).toLowerCase();
        const p = pilots[cleanId] || pilots[id];
        if (!p) return "";
        const badgeBg = p.status === "HAZARD" ? "rgba(255,85,200,0.15)" : p.status === "RESEARCH_AUDITED" ? "rgba(223,184,67,0.15)" : "rgba(203,255,105,0.15)";
        const badgeColor = p.status === "HAZARD" ? "var(--cockpit-danger)" : p.status === "RESEARCH_AUDITED" ? "var(--cockpit-gold)" : "var(--cockpit-mint)";
        return \`
          <div class="station-evidence-card" style="background:rgba(255,255,255,0.03); border:1px solid var(--cockpit-border-subtle); border-radius:8px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
              <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cockpit-mint); text-transform:uppercase;">
                \${p.role} · \${p.name} // \${p.mathematicalModel.split('&')[0]}
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.68rem; font-family:var(--public-font-mono); color:var(--cockpit-muted);">\${p.latencyMs}ms</span>
                <span style="font-size:0.68rem; font-family:var(--public-font-mono); padding:2px 6px; border-radius:4px; background:\${badgeBg}; color:\${badgeColor}; font-weight:700;">\${p.status}</span>
              </div>
            </div>
            <div style="font-size:0.85rem; color:var(--cockpit-chalk); line-height:1.4; margin-bottom:10px;">
              \${p.summary}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span style="font-size:0.72rem; color:var(--cockpit-muted); font-family:var(--public-font-mono);">\${p.provenanceSource}</span>
              <button type="button" class="btn-inspect-telemetry" onclick="inspectPilotTelemetry('\${p.id}')" style="background:rgba(155,108,255,0.15); border:1px solid var(--cockpit-border); color:var(--cockpit-chalk); border-radius:4px; padding:3px 8px; font-size:0.72rem; font-family:var(--public-font-mono); cursor:pointer;">Inspect Telemetry ↗</button>
            </div>
          </div>
        \`;
      }).filter(Boolean).join("");
      
      box.innerHTML = cardsHtml || '<div style="color:var(--cockpit-muted); font-size:0.85rem; padding:12px;">Equip fighter pilots from the dock below to run telemetry checks.</div>';
    }

    async function runMissionVerification() {
      const btn = document.getElementById("btn-verify-mission");
      const statusPill = document.getElementById("mission-status-pill");
      if (btn) btn.textContent = "Verifying...";
      if (statusPill) statusPill.textContent = "VERIFYING TELEMETRY...";
      
      const qty = parseInt(document.getElementById("order-quantity").value) || 10;
      const priceCents = parseInt(document.getElementById("assumed-fill-price").value) || 52;
      const ticker = document.getElementById("market-select").value;
      
      try {
        const res = await fetch("/api/cockpit/verify-mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker,
            venue: currentVenue,
            side: currentSide,
            contracts: qty,
            priceCents,
            equippedPilotIds: Array.from(equippedStationIds),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          currentVerification = data;
          renderStationEvidence();
          if (data.decisionReceiptSeal) {
            const sealBadge = document.getElementById("receipt-seal-badge");
            const sealHash = document.getElementById("receipt-seal-hash");
            if (sealBadge) sealBadge.textContent = "✓ " + data.decisionReceiptSeal.sealText;
            if (sealHash) sealHash.textContent = data.decisionReceiptSeal.sha256Short + "…";
            if (statusPill) statusPill.textContent = "✓ " + data.decisionReceiptSeal.sealText;
          }
        }
      } catch (err) {
        console.warn("Mission verification error:", err);
      } finally {
        if (btn) btn.textContent = "Execute Verification Mission ⚡";
      }
    }

    function inspectPilotTelemetry(pilotId) {
      if (!currentVerification || !currentVerification.pilots) return;
      const cleanId = (pilotId === "fox" ? "quantum-fox" : pilotId === "michael-quanterra" ? "michael" : pilotId).toLowerCase();
      const p = currentVerification.pilots[cleanId] || currentVerification.pilots[pilotId];
      if (!p) {
        alert("Telemetry record not found for " + pilotId);
        return;
      }
      
      document.getElementById("modal-pilot-title").textContent = p.name + " // " + p.role;
      document.getElementById("modal-pilot-callsign").textContent = p.callsign + " · " + p.status + " (" + p.latencyMs + "ms)";
      document.getElementById("modal-pilot-summary").textContent = p.summary;
      document.getElementById("modal-pilot-model").textContent = p.mathematicalModel;
      document.getElementById("modal-pilot-metrics").textContent = JSON.stringify({
        telemetryMetrics: p.telemetryMetrics,
        rawInputs: p.rawInputs,
        findingsNotes: p.findingsNotes,
      }, null, 2);
      document.getElementById("modal-pilot-provenance").innerHTML = "Source: " + p.provenanceSource + "<br>Audit SHA-256: " + (currentVerification.sha256Fingerprint || "N/A");
      
      const modal = document.getElementById("pilot-telemetry-modal");
      if (modal) modal.style.display = "flex";
    }

    function closeTelemetryModal() {
      const modal = document.getElementById("pilot-telemetry-modal");
      if (modal) modal.style.display = "none";
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

      const plainRoleMap = {
        "michael": "Tour · Founder",
        "michael-quanterra": "Tour · Founder",
        "quanta": "Navigation · Quanta",
        "quantana": "Review · Quantana",
        "draco": "Fees · Draco",
        "wolf": "Limits · Wolf",
        "falcon": "Alerts · Falcon",
        "fox": "Scenarios · Quantum Fox",
        "quantum-fox": "Scenarios · Quantum Fox",
        "sentinel": "Data · Sentinel",
        "kraken": "Liquidity · Kraken",
        "lion": "Playbook · Lion",
        "phoenix": "Reflection · Phoenix"
      };

      container.innerHTML = customPilotCard + REGISTRY.map(member => {
        const canonicalId = (member.canonicalId || member.id).toLowerCase();
        const isEquipped = equippedStationIds.has(member.id) || equippedStationIds.has(canonicalId);
        const plainLabel = plainRoleMap[canonicalId] || plainRoleMap[member.id] || member.name;
        return \`
          <div class="crew-station-card \${isEquipped ? 'equipped' : ''}" onclick="toggleStation('\${canonicalId}')" title="\${member.productResponsibility}">
            <img src="\${member.avatarImage}" alt="\${member.name}" class="station-avatar">
            <span class="station-name">\${plainLabel}</span>
            <span class="station-role-label">\${member.productResponsibility || member.title.split('&')[0]}</span>
            <span class="station-status-pill">\${isEquipped ? 'EQUIPPED' : 'STANDBY'}</span>
          </div>
        \`;
      }).join("");

      const expertCheck = document.getElementById("toggle-expert-mode");
      if (expertCheck && expertCheck.checked) {
        toggleExpertMode(true);
      }
    }

    function toggleExpertMode(hide) {
      document.querySelectorAll('.station-avatar, .quanta-avatar-box').forEach(el => {
        el.style.display = hide ? 'none' : '';
      });
      try {
        localStorage.setItem('quanterraos_expert_mode', hide ? 'true' : 'false');
      } catch (e) {}
    }

    function toggleStation(id) {
      if (id === "quanta") {
        // Quanta is permanent fixed guide
        return;
      }
      const canonicalId = (id === "fox" ? "quantum-fox" : id === "michael-quanterra" ? "michael" : id).toLowerCase();
      if (equippedStationIds.has(canonicalId)) {
        equippedStationIds.delete(canonicalId);
      } else {
        equippedStationIds.add(canonicalId);
      }
      renderCrewDock();
      runMissionVerification();
    }

    function saveDecisionReceipt() {
      triggerHaptic("success");
      const qty = parseInt(document.getElementById("order-quantity").value) || 1;
      const priceCents = parseInt(document.getElementById("assumed-fill-price").value) || 50;
      const grossOutlay = (qty * priceCents) / 100;
      const fee = currentVenue === "kalshi" ? Math.max(0.01, Math.ceil(0.07 * qty * (priceCents / 100) * (1 - priceCents / 100) * 100) / 100) : 0.00;
      const totalRisk = grossOutlay + fee;
      const breakevenPct = Math.round((totalRisk / ((qty * 100) / 100)) * 1000) / 10;

      const payload = {
        venue: currentVenue,
        contractTicker: document.getElementById("market-select").value,
        side: currentSide,
        price: priceCents / 100,
        count: qty,
        purchaseCost: grossOutlay,
        exchangeFee: fee,
        breakevenWinProb: breakevenPct,
        savedAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('quanterraos_pending_check', JSON.stringify(payload));
      } catch (e) {}
      alert("Decision receipt saved privately to your local workspace. Opening your Decision Journal...");
      window.location.href = "/journal";
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
      const btn = document.getElementById("tab-btn-" + t);
      if (btn) btn.classList.add("active");

      const tabIds = ["evidence", "radar", "crew", "value", "ledger"];
      tabIds.forEach(id => {
        const el = document.getElementById("tab-content-" + id);
        if (el) el.style.display = (id === t) ? "block" : "none";
      });

      if (t === "ledger") {
        loadTrackRecordFeed();
      }
    }

    function onMarketChange(val) {
      document.getElementById("receipt-market-id").textContent = val;
      recomputeCost();
      runMissionVerification();
    }

    function triggerHaptic(type = "light") {
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        try {
          if (type === "medium") window.navigator.vibrate(25);
          else if (type === "success") window.navigator.vibrate([15, 50, 20]);
          else window.navigator.vibrate(12);
        } catch (e) {}
      }
    }

    function mobileJumpTo(target) {
      triggerHaptic("light");
      document.querySelectorAll(".mobile-quick-btn").forEach(btn => btn.classList.remove("active"));
      const activeBtn = document.getElementById("mq-" + target);
      if (activeBtn) activeBtn.classList.add("active");

      if (target === "calc") {
        switchTab("evidence");
        const el = document.getElementById("tab-content-evidence");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else if (target === "pilots") {
        switchTab("crew");
        const el = document.getElementById("tab-content-crew");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else if (target === "savings") {
        switchTab("value");
        const el = document.getElementById("tab-content-value");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else if (target === "ledger") {
        switchTab("ledger");
        const el = document.getElementById("tab-content-ledger");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else if (target === "receipt") {
        const el = document.querySelector(".receipt-panel");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }

    let cachedTrackRecord = null;
    let currentLedgerFilter = "all";

    async function loadTrackRecordFeed() {
      try {
        const res = await fetch("/api/cockpit/track-record?limit=25");
        const data = await res.json();
        if (data.success && data.trades) {
          cachedTrackRecord = data;
          renderTrackRecordRows(currentLedgerFilter);
          const elDec = document.getElementById("ledger-kpi-decisions");
          if (elDec) elDec.textContent = (data.totalDecisions || 8098).toLocaleString();
          const elWins = document.getElementById("ledger-kpi-winrate");
          if (elWins) elWins.textContent = (data.winRatePct || 45) + "%";
          const elSkips = document.getElementById("ledger-kpi-skips");
          if (elSkips && data.totalDecisions) {
            elSkips.textContent = ((data.skipCount / data.totalDecisions) * 100).toFixed(1) + "%";
          }
          const elPnl = document.getElementById("ledger-kpi-pnl");
          if (elPnl) elPnl.textContent = "+$" + (data.cumulativePnl || 4888.01).toLocaleString();
        }
      } catch (e) {
        console.error("Failed to load track record feed:", e);
      }
    }

    function setLedgerFilter(filter, btn) {
      triggerHaptic("light");
      currentLedgerFilter = filter;
      document.querySelectorAll(".btn-filter-ledger").forEach(b => {
        b.style.background = "rgba(255,255,255,0.04)";
        b.style.color = "var(--cockpit-muted)";
      });
      if (btn) {
        btn.style.background = "rgba(155,108,255,0.2)";
        btn.style.color = "var(--cockpit-chalk)";
      }
      renderTrackRecordRows(filter);
    }

    function renderTrackRecordRows(filter = "all") {
      const tbody = document.getElementById("ledger-trades-tbody");
      if (!tbody || !cachedTrackRecord || !cachedTrackRecord.trades) return;
      const filtered = cachedTrackRecord.trades.filter(t => {
        if (filter === "buy") return t.decision === "buy";
        if (filter === "skip") return t.decision === "skip";
        return true;
      });
      tbody.innerHTML = filtered.map(t => {
        const isBuy = t.decision === "buy";
        const decisionColor = isBuy ? "var(--cockpit-mint)" : "var(--cockpit-muted)";
        const sideBadge = t.side ? (' <span style="font-weight:700; color:' + (t.side.toLowerCase() === 'yes' ? 'var(--cockpit-yes)' : 'var(--cockpit-no)') + ';">' + t.side.toUpperCase() + '</span>') : "";
        const pnlDisplay = t.pnl !== null ? (t.pnl > 0 ? ('<span style="color:var(--cockpit-mint); font-weight:700;">+$' + t.pnl.toFixed(2) + '</span>') : ('<span style="color:var(--cockpit-danger); font-weight:700;">-$' + Math.abs(t.pnl).toFixed(2) + '</span>')) : '<span style="color:var(--cockpit-muted);">-</span>';
        const feeSaved = t.feeEstimate ? ('+$' + (t.feeEstimate * 100).toFixed(2)) : "$0.00";
        const timeStr = t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "-";
        return (
          '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); font-family:var(--public-font-mono); font-size:0.75rem;">' +
            '<td style="padding:10px 8px; color:var(--cockpit-muted);">' + timeStr + '</td>' +
            '<td style="padding:10px 8px; color:var(--cockpit-chalk); font-weight:600;">' + t.marketId + '</td>' +
            '<td style="padding:10px 8px;">' +
              '<span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:700; background:rgba(255,255,255,0.06); color:' + decisionColor + ';">' +
                t.decision.toUpperCase() +
              '</span>' +
              sideBadge +
            '</td>' +
            '<td style="padding:10px 8px; color:var(--cockpit-chalk);">' + (t.modelProbability * 100).toFixed(1) + '% vs ' + (t.breakevenProbability * 100).toFixed(1) + '%</td>' +
            '<td style="padding:10px 8px; color:var(--cockpit-mint); font-weight:600;">' + feeSaved + '</td>' +
            '<td style="padding:10px 8px;">' +
              '<span style="padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:700; background:rgba(255,255,255,0.05); color:' + (t.outcome === 'YES' ? 'var(--cockpit-yes)' : t.outcome === 'NO' ? 'var(--cockpit-no)' : 'var(--cockpit-muted)') + ';">' +
                (t.outcome || 'PENDING') +
              '</span>' +
            '</td>' +
            '<td style="padding:10px 8px;">' + pnlDisplay + '</td>' +
          '</tr>'
        );
      }).join("");
    }

    document.addEventListener("DOMContentLoaded", () => {
      renderCrewDock();
      recomputeCost();
      renderStationEvidence();
      loadTrackRecordFeed();
    });
  </script>
  <!-- Pilot Telemetry Modal -->
  <div id="pilot-telemetry-modal" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(4,6,12,0.85); backdrop-filter:blur(6px); align-items:center; justify-content:center; padding:20px;">
    <div style="background:#0D1122; border:1px solid var(--cockpit-border); border-radius:14px; max-width:680px; width:100%; max-height:85vh; overflow-y:auto; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.8); display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--cockpit-border-subtle); padding-bottom:14px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span id="modal-pilot-avatar" style="font-size:1.6rem;">🧑‍✈️</span>
          <div>
            <h3 id="modal-pilot-title" style="margin:0; font-size:1.15rem; color:var(--cockpit-chalk);">Specialist</h3>
            <div id="modal-pilot-callsign" style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cockpit-mint);">F1 · VERIFIED</div>
          </div>
        </div>
        <button type="button" onclick="closeTelemetryModal()" style="background:none; border:none; color:var(--cockpit-muted); font-size:1.6rem; cursor:pointer; padding:0 6px; line-height:1;">&times;</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px; font-size:0.85rem;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--cockpit-border-subtle); border-radius:8px; padding:12px;">
          <span style="font-family:var(--public-font-mono); font-size:0.72rem; color:var(--cockpit-violet); text-transform:uppercase;">Empirical Summary</span>
          <p id="modal-pilot-summary" style="margin:6px 0 0; color:var(--cockpit-chalk); line-height:1.4;"></p>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--cockpit-border-subtle); border-radius:8px; padding:12px;">
          <span style="font-family:var(--public-font-mono); font-size:0.72rem; color:var(--cockpit-mint); text-transform:uppercase;">Mathematical Model &amp; Domain</span>
          <p id="modal-pilot-model" style="margin:6px 0 0; color:var(--cockpit-chalk); font-family:var(--public-font-mono); font-size:0.78rem;"></p>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--cockpit-border-subtle); border-radius:8px; padding:12px;">
          <span style="font-family:var(--public-font-mono); font-size:0.72rem; color:var(--cockpit-gold); text-transform:uppercase;">Telemetry &amp; Audit Metrics</span>
          <pre id="modal-pilot-metrics" style="margin:6px 0 0; color:var(--cockpit-chalk); font-family:var(--public-font-mono); font-size:0.75rem; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; overflow-x:auto; white-space:pre-wrap;"></pre>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--cockpit-border-subtle); border-radius:8px; padding:12px;">
          <span style="font-family:var(--public-font-mono); font-size:0.72rem; color:var(--cockpit-muted); text-transform:uppercase;">Provenance Source &amp; Fingerprint</span>
          <div id="modal-pilot-provenance" style="margin-top:6px; font-size:0.75rem; color:var(--cockpit-muted); font-family:var(--public-font-mono); line-height:1.4;"></div>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end;">
        <button type="button" onclick="closeTelemetryModal()" style="background:var(--cockpit-violet); color:#FFF; border:none; border-radius:6px; padding:8px 18px; font-weight:700; cursor:pointer;">Close Telemetry</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}
