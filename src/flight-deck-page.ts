/**
 * QuanterraOS Flight Deck (Celestial Spacecraft Cockpit Terminal)
 *
 * Implements Phase 4 Task 4.1:
 * "/deck shell: stations (2.3), bottom tabs (mobile), left rail (desktop), celestial theme (Part 5)."
 *
 * Requirements (Parts 0.3, 2.3, 5):
 * - 7 Stations: Bridge, Navigation, Engineering, Mission Log, Sensors, Crew, Hangar.
 * - Celestial Mode Theme:
 *   --space-900 (#05060B), --space-800 (#080B14), --space-700 (#0D1120),
 *   --hud-cyan (#4FD1E8), --hud-gold (#C9A24A), --alert-red (#E5484D),
 *   --ok-green (#30A46C), --glass (rgba(255,255,255,0.06)), scanline overlay.
 * - Desktop: Left HUD rail with station badges and telemetry status.
 * - Mobile: Bottom navigation tab bar with touch-friendly 44px tap targets.
 * - Guardrails (Part 0.3):
 *   Rule B5 locked ($0.00 capital deployed, no live execution endpoints).
 *   Anti-volume discipline gamification: XP tied to pre-flight checks, thesis writing,
 *   maker orders, and calibration scoring (never volume or P&L).
 */

import {
  computeTrueCostCheck,
  computeMakerTakerSaver,
  computeRoundingOptimizer,
  computeCrossVenueNetSpread,
  computeKalshiTakerFee,
  ceilToCent,
} from "./lib/fees.ts";

export type FlightDeckStationId =
  | "bridge"
  | "navigation"
  | "engineering"
  | "mission-log"
  | "sensors"
  | "crew"
  | "hangar";

export interface FlightDeckStationMeta {
  id: FlightDeckStationId;
  name: string;
  shipMetaphor: string;
  tagline: string;
  iconSvg: string;
}

export const FLIGHT_DECK_STATIONS: FlightDeckStationMeta[] = [
  {
    id: "bridge",
    name: "Bridge",
    shipMetaphor: "Main Viewscreen",
    tagline: "Today's missions, pilot rank, hull/fuel gauges, and Aria ship's computer",
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>`,
  },
  {
    id: "navigation",
    name: "Navigation",
    shipMetaphor: "Star Map",
    tagline: "Live Settlement Radar, CME CF BRTI vs Spot, strikes, time-to-expiry & coin-flip hazard",
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  },
  {
    id: "engineering",
    name: "Engineering",
    shipMetaphor: "Fuel & Reactor",
    tagline: "True Cost Engine, Maker/Taker Saver, Rounding Optimizer & Cross-Venue Spread",
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  },
  {
    id: "mission-log",
    name: "Mission Log",
    shipMetaphor: "Captain's Log",
    tagline: "Thesis → Trade → Settlement journal, Kalshi CSV importer & Personal Brier calibration",
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  },
  {
    id: "sensors",
    name: "Sensors",
    shipMetaphor: "Long-Range Scanners",
    tagline: "Whale flow feed with net-after-fees and settlement basis context; Shadow Mode",
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"/><path d="M20 12a8 8 0 0 1-16 0"/><path d="M4 12a8 8 0 0 1 16 0"/><circle cx="12" cy="12" r="2"/></svg>`,
  },
  {
    id: "crew",
    name: "Crew",
    shipMetaphor: "Crew Quarters",
    tagline: "8 AI crew specialists (non-advisory) + human Flight Instructor booking",
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    id: "hangar",
    name: "Hangar",
    shipMetaphor: "Ship Config",
    tagline: "Account profile, voluntary limits, tilt controls, sound toggles, widgets & API keys",
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  },
];

export interface FlightDeckRenderOptions {
  initialStation?: FlightDeckStationId;
  user?: {
    email?: string;
    callsign?: string;
    rank?: string;
    xp?: number;
    streakDays?: number;
  } | null;
}

export function renderFlightDeckPageHtml(options: FlightDeckRenderOptions = {}): string {
  const activeStation = options.initialStation || "bridge";
  const user = options.user || {
    email: "cadet@quanterraos.com",
    callsign: "CADET-7",
    rank: "Cadet",
    xp: 140,
    streakDays: 3,
  };

  // Pre-calculate initial Engineering station metrics (10 contracts @ $0.51 ask on Kalshi KXBTC15M)
  const initialCost = computeTrueCostCheck({
    venue: "kalshi",
    product: "KXBTC15M",
    price: 0.51,
    contracts: 10,
    userAssumedProbability: 0.55,
  });
  const initialSaver = computeMakerTakerSaver(10, 0.51, "KXBTC15M", 50);
  const initialRounding = computeRoundingOptimizer(10, 5, 0.51);
  const initialSpread = computeCrossVenueNetSpread({
    kalshiPrice: 0.51,
    polymarketPrice: 0.53,
    contracts: 10,
  });

  const navItemsDesktopHtml = FLIGHT_DECK_STATIONS.map((station) => {
    const isActive = station.id === activeStation;
    return `
      <button
        type="button"
        class="deck-nav-item ${isActive ? "active" : ""}"
        id="deck-nav-${station.id}"
        data-station="${station.id}"
        onclick="switchStation('${station.id}')"
        aria-label="Switch to ${station.name} station (${station.shipMetaphor})"
      >
        <span class="deck-nav-icon">${station.iconSvg}</span>
        <span class="deck-nav-text">
          <span class="deck-nav-name">${station.name}</span>
          <span class="deck-nav-sub">${station.shipMetaphor}</span>
        </span>
        <span class="deck-nav-pill"></span>
      </button>
    `;
  }).join("\n");

  const navItemsMobileHtml = FLIGHT_DECK_STATIONS.map((station) => {
    const isActive = station.id === activeStation;
    return `
      <button
        type="button"
        class="deck-mobile-tab ${isActive ? "active" : ""}"
        id="deck-tab-${station.id}"
        data-station="${station.id}"
        onclick="switchStation('${station.id}')"
        aria-label="Station: ${station.name}"
      >
        <span class="deck-mobile-tab-icon">${station.iconSvg}</span>
        <span class="deck-mobile-tab-label">${station.name}</span>
      </button>
    `;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#05060B">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Flight Deck Cockpit — QuanterraOS</title>
  <meta name="description" content="Celestial spacecraft terminal for short-duration prediction markets. Discipline-driven telemetry across 7 ship stations.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/index.css">
  <style>
    :root {
      --space-900: #05060B;
      --space-800: #080B14;
      --space-700: #0D1120;
      --space-600: #141A2E;
      --hud-cyan: #4FD1E8;
      --hud-cyan-dim: rgba(79, 209, 232, 0.15);
      --hud-cyan-glow: rgba(79, 209, 232, 0.35);
      --hud-gold: #C9A24A;
      --hud-gold-dim: rgba(201, 162, 74, 0.15);
      --alert-red: #E5484D;
      --ok-green: #30A46C;
      --fg-primary: #FFFFFF;
      --fg-muted: #8A8F98;
      --glass-panel: rgba(13, 17, 32, 0.78);
      --glass-border: rgba(79, 209, 232, 0.22);
      --glass-border-subtle: rgba(255, 255, 255, 0.08);
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--space-900);
      color: var(--fg-primary);
      font-family: var(--font-sans);
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Subtle Cockpit Scanline & Starfield HUD Texture */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 100% 70% at 50% 0%, rgba(79, 209, 232, 0.07), transparent 75%),
        linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      background-size: 100% 100%, 100% 4px;
      pointer-events: none;
      z-index: 1;
    }

    /* Accessibility Focus Outlines */
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
      outline: 2px solid var(--hud-cyan) !important;
      outline-offset: 2px !important;
    }

    /* Top HUD Cockpit Telemetry Bar */
    .cockpit-top-bar {
      position: sticky;
      top: 0;
      left: 0;
      width: 100%;
      height: 56px;
      background: rgba(5, 6, 11, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--glass-border);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .cockpit-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #FFFFFF;
    }

    .cockpit-ship-crest {
      width: 26px;
      height: 26px;
      border-radius: 4px;
      border: 1px solid var(--hud-cyan);
      background: var(--hud-cyan-dim);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hud-cyan);
    }
    .cockpit-ship-crest svg { width: 16px; height: 16px; }

    .cockpit-ship-name {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #FFFFFF;
    }

    .cockpit-ship-callsign {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--hud-cyan);
      letter-spacing: 0.1em;
      margin-left: 4px;
    }

    .cockpit-telemetry-cluster {
      display: flex;
      align-items: center;
      gap: 20px;
      font-family: var(--font-mono);
      font-size: 0.74rem;
    }

    .telemetry-node {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--fg-muted);
    }

    .telemetry-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ok-green);
      box-shadow: 0 0 6px var(--ok-green);
    }

    .telemetry-node strong {
      color: #FFFFFF;
    }

    .cockpit-exit-link {
      color: var(--fg-muted);
      text-decoration: none;
      font-size: 0.78rem;
      transition: color 0.15s;
    }
    .cockpit-exit-link:hover { color: #FFFFFF; }

    /* Cockpit Main Frame */
    .cockpit-frame {
      display: flex;
      flex: 1;
      position: relative;
      z-index: 10;
      min-height: calc(100vh - 56px);
    }

    /* Left Navigation Rail (Desktop) */
    .cockpit-rail {
      width: 250px;
      background: rgba(8, 11, 20, 0.85);
      border-right: 1px solid var(--glass-border-subtle);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px 12px;
      position: sticky;
      top: 56px;
      height: calc(100vh - 56px);
    }

    .deck-nav-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .deck-nav-group-title {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      color: #64748B;
      text-transform: uppercase;
      padding: 8px 12px 4px;
    }

    .deck-nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 6px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--fg-muted);
      cursor: pointer;
      text-align: left;
      font-family: var(--font-sans);
      transition: all 0.15s ease;
      position: relative;
      width: 100%;
    }

    .deck-nav-item:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #FFFFFF;
      border-color: rgba(255, 255, 255, 0.06);
    }

    .deck-nav-item.active {
      background: var(--hud-cyan-dim);
      border-color: var(--glass-border);
      color: #FFFFFF;
      box-shadow: 0 0 18px rgba(79, 209, 232, 0.08);
    }

    .deck-nav-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      flex-shrink: 0;
    }
    .deck-nav-icon svg { width: 18px; height: 18px; }

    .deck-nav-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .deck-nav-name {
      font-size: 0.88rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .deck-nav-sub {
      font-size: 0.68rem;
      font-family: var(--font-mono);
      color: var(--fg-muted);
      letter-spacing: 0.02em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .deck-nav-item.active .deck-nav-sub {
      color: var(--hud-cyan);
    }

    .deck-nav-pill {
      margin-left: auto;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: transparent;
    }
    .deck-nav-item.active .deck-nav-pill {
      background: var(--hud-cyan);
      box-shadow: 0 0 8px var(--hud-cyan);
    }

    /* Pilot Rank HUD Box */
    .cockpit-pilot-card {
      background: rgba(5, 6, 11, 0.9);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 12px 14px;
    }

    .pilot-rank-label {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--hud-gold);
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .pilot-rank-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }

    .pilot-xp-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      margin: 8px 0 4px;
      overflow: hidden;
    }
    .pilot-xp-fill {
      height: 100%;
      width: 45%;
      background: var(--hud-gold);
      box-shadow: 0 0 8px var(--hud-gold);
    }

    .pilot-xp-note {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--fg-muted);
    }

    /* Station Content Stage */
    .cockpit-stage {
      flex: 1;
      padding: 32px 36px 80px;
      max-width: 1360px;
      margin: 0 auto;
      width: 100%;
    }

    .station-panel {
      display: none;
    }
    .station-panel.active {
      display: block;
      animation: stationFade 0.25s ease-out;
    }
    @keyframes stationFade {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .station-header {
      margin-bottom: 28px;
      border-bottom: 1px solid var(--glass-border-subtle);
      padding-bottom: 20px;
    }

    .station-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--hud-cyan);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .station-title {
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      margin-bottom: 6px;
    }

    .station-desc {
      font-size: 0.92rem;
      color: var(--fg-muted);
      max-width: 820px;
      line-height: 1.5;
    }

    /* Station Cards & HUD Gauges */
    .deck-grid-2 {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .deck-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }
    .deck-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }

    .hud-card {
      background: var(--glass-panel);
      border: 1px solid var(--glass-border-subtle);
      border-radius: 8px;
      padding: 22px;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      position: relative;
    }
    .hud-card.accent-cyan { border-color: var(--glass-border); }
    .hud-card.accent-gold { border-color: var(--hud-gold-dim); }

    .hud-card-title {
      font-family: var(--font-mono);
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--hud-cyan);
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .hud-stat-val {
      font-family: var(--font-mono);
      font-size: 2.1rem;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.1;
    }

    .hud-stat-label {
      font-size: 0.78rem;
      color: var(--fg-muted);
      margin-top: 6px;
    }

    /* Aria Interactive Prompt Box */
    .aria-console-box {
      background: rgba(5, 6, 11, 0.95);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .aria-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .aria-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--hud-cyan-dim);
      border: 1.5px solid var(--hud-cyan);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--hud-cyan);
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.8rem;
      box-shadow: 0 0 10px var(--hud-cyan-glow);
    }

    .aria-prompt-quote {
      font-size: 0.88rem;
      line-height: 1.5;
      color: #E2E8F0;
      font-style: italic;
      padding: 10px 14px;
      background: rgba(79, 209, 232, 0.05);
      border-left: 2px solid var(--hud-cyan);
      border-radius: 0 4px 4px 0;
      margin-bottom: 14px;
    }

    .aria-quick-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-aria-action {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--glass-border-subtle);
      color: #FFFFFF;
      padding: 8px 14px;
      border-radius: 4px;
      font-size: 0.78rem;
      font-family: var(--font-mono);
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-aria-action:hover {
      background: var(--hud-cyan-dim);
      border-color: var(--hud-cyan);
      color: var(--hud-cyan);
    }

    /* Mission Checklist (Discipline-First Gamification) */
    .mission-checklist {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .mission-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
    }

    .mission-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mission-check {
      width: 18px;
      height: 18px;
      border-radius: 3px;
      border: 1.5px solid var(--fg-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ok-green);
      font-size: 0.75rem;
    }
    .mission-item.done .mission-check {
      border-color: var(--ok-green);
      background: rgba(48, 164, 108, 0.15);
    }

    .mission-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: #FFFFFF;
    }
    .mission-item.done .mission-name {
      color: var(--fg-muted);
      text-decoration: line-through;
    }

    .mission-xp-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--hud-gold);
      background: var(--hud-gold-dim);
      padding: 3px 8px;
      border-radius: 3px;
    }

    /* Mobile Bottom Navigation Bar */
    .cockpit-mobile-tabs {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 64px;
      background: rgba(5, 6, 11, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--glass-border);
      z-index: 1000;
      padding: 0 6px;
      box-sizing: border-box;
      overflow-x: auto;
      white-space: nowrap;
    }

    .cockpit-mobile-tabs-inner {
      display: flex;
      align-items: center;
      justify-content: space-around;
      width: 100%;
      min-width: 360px;
      height: 100%;
    }

    .deck-mobile-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      background: transparent;
      border: none;
      color: var(--fg-muted);
      min-width: 44px;
      min-height: 48px;
      cursor: pointer;
      padding: 4px 6px;
      font-family: var(--font-sans);
      transition: color 0.15s;
    }

    .deck-mobile-tab.active {
      color: var(--hud-cyan);
    }

    .deck-mobile-tab-icon svg {
      width: 20px;
      height: 20px;
      stroke: currentColor;
    }

    .deck-mobile-tab-label {
      font-size: 0.65rem;
      font-weight: 500;
      line-height: 1;
    }

    /* Mobile 375px responsive adjustments */
    @media (max-width: 900px) {
      .cockpit-rail { display: none; }
      .cockpit-mobile-tabs { display: flex; }
      .cockpit-stage { padding: 20px 16px 84px; }
      .deck-grid-2, .deck-grid-3, .deck-grid-4 {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .cockpit-telemetry-cluster { display: none; }
      .station-title { font-size: 1.55rem; }
    }
  </style>
</head>
<body>

  <!-- Top Cockpit Telemetry Bar -->
  <header class="cockpit-top-bar" id="cockpit-top-bar" aria-label="Cockpit telemetry status bar">
    <a href="/deck" class="cockpit-brand" aria-label="QuanterraOS Flight Deck">
      <div class="cockpit-ship-crest">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 19 21 12 17 5 21 12 2"/>
        </svg>
      </div>
      <div>
        <span class="cockpit-ship-name">QUANTERRAOS</span>
        <span class="cockpit-ship-callsign">// FLIGHT DECK</span>
      </div>
    </a>

    <!-- Telemetry Cluster -->
    <div class="cockpit-telemetry-cluster" aria-label="System status telemetry">
      <div class="telemetry-node">
        <span class="telemetry-dot"></span>
        <span>BRTI SYNC: <strong>NOMINAL</strong></span>
      </div>
      <div class="telemetry-node">
        <span>LATENCY: <strong>1.1ms</strong></span>
      </div>
      <div class="telemetry-node">
        <span>STATUS: <strong style="color:var(--hud-cyan);">RULE B5 LOCKED ($0 RISK)</strong></span>
      </div>
    </div>

    <!-- Exit to Public Site -->
    <div style="display:flex; align-items:center; gap:16px;">
      <a href="/check" class="cockpit-exit-link" style="color:var(--hud-cyan);">Check &rarr;</a>
      <a href="/" class="cockpit-exit-link">Exit Cockpit</a>
    </div>
  </header>

  <!-- Cockpit Frame -->
  <div class="cockpit-frame">

    <!-- Left Navigation Rail (Desktop) -->
    <nav class="cockpit-rail" id="cockpit-desktop-rail" aria-label="Flight Deck ship stations">
      <div>
        <div class="deck-nav-group-title">Ship Stations (7)</div>
        <div class="deck-nav-group">
          ${navItemsDesktopHtml}
        </div>
      </div>

      <!-- Pilot Rank HUD Badge -->
      <div class="cockpit-pilot-card">
        <div class="pilot-rank-label">
          <span>PILOT RANK</span>
          <span>${user.streakDays ?? 3}D STREAK</span>
        </div>
        <div class="pilot-rank-title">${user.rank ?? "Cadet"} · ${user.callsign ?? "CADET-7"}</div>
        <div class="pilot-xp-bar">
          <div class="pilot-xp-fill"></div>
        </div>
        <div class="pilot-xp-note">Discipline XP: 140 / 300 to Officer</div>
      </div>
    </nav>

    <!-- Main Station Stage -->
    <main class="cockpit-stage" id="cockpit-station-stage">

      <!-- ===================================================================
           STATION 1: BRIDGE (Main Viewscreen)
           =================================================================== -->
      <section class="station-panel ${activeStation === "bridge" ? "active" : ""}" id="station-panel-bridge" aria-label="Bridge Station">
        <div class="station-header">
          <div class="station-eyebrow">STATION 1 OF 7 // MAIN VIEWSCREEN</div>
          <h1 class="station-title">Bridge Station</h1>
          <p class="station-desc">
            Primary command cockpit. Monitor daily discipline missions, ship hull &amp; fuel telemetry, active alerts, and consult Aria for non-advisory operational calculations.
          </p>
        </div>

        <!-- Aria Computer Console Box -->
        <div class="aria-console-box">
          <div class="aria-header">
            <div class="aria-avatar">A</div>
            <div>
              <div style="font-family:var(--font-mono); font-size:0.82rem; font-weight:700; color:#FFFFFF;">ARIA // SHIP'S COMPUTER</div>
              <div style="font-size:0.7rem; color:var(--hud-cyan); font-family:var(--font-mono);">Non-Advisory Analytical Engine · Rule B5 Compliant</div>
            </div>
          </div>
          <div class="aria-prompt-quote">
            "I cannot tell you what to trade, but I can show you exactly what any contract costs, where exchange taker fees peak, and how it settles. What contract shall we inspect?"
          </div>
          <div class="aria-quick-actions">
            <button type="button" class="btn-aria-action" onclick="switchStation('engineering')">✦ Inspect 50¢ Kalshi Fee Drag</button>
            <button type="button" class="btn-aria-action" onclick="switchStation('navigation')">✦ Check KXBTC15M Settlement Window</button>
            <button type="button" class="btn-aria-action" onclick="switchStation('mission-log')">✦ Review Personal Brier Calibration</button>
          </div>
        </div>

        <!-- Bridge Gauges Grid -->
        <div class="deck-grid-4">
          <div class="hud-card accent-cyan">
            <div class="hud-card-title">
              <span>HULL INTEGRITY</span>
              <span>🛡️</span>
            </div>
            <div class="hud-stat-val" style="color:var(--ok-green);">100%</div>
            <div class="hud-stat-label">Loss Limit: $0 / $50 utilized</div>
          </div>

          <div class="hud-card accent-gold">
            <div class="hud-card-title">
              <span>FUEL RESERVE</span>
              <span>⚡</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-gold);">84%</div>
            <div class="hud-stat-label">Voluntary fee budget intact</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>BRIER CALIBRATION</span>
              <span>🎯</span>
            </div>
            <div class="hud-stat-val">0.2001</div>
            <div class="hud-stat-label">Outperforming market (0.2063)</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>DISCIPLINE XP</span>
              <span>⭐</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-cyan);">140</div>
            <div class="hud-stat-label">+20 XP for pre-flight check</div>
          </div>
        </div>

        <!-- Today's Discipline Missions -->
        <div class="hud-card">
          <div class="hud-card-title">
            <span>TODAY'S DISCIPLINE MISSIONS</span>
            <span style="color:var(--hud-gold);">ANTI-VOLUME REWARDS</span>
          </div>
          <p style="font-size:0.78rem; color:var(--fg-muted); margin-bottom:14px;">
            XP is awarded exclusively for planning, testing, thesis writing, and post-trade reflection. No XP is ever awarded for trade count, volume, or winning.
          </p>
          <ul class="mission-checklist">
            <li class="mission-item done">
              <div class="mission-info">
                <span class="mission-check">✓</span>
                <div>
                  <div class="mission-name">Pre-Flight Fee Check</div>
                  <div style="font-size:0.7rem; color:var(--fg-muted);">Audited aggregate order taker fee drag before submission</div>
                </div>
              </div>
              <span class="mission-xp-badge">+20 XP</span>
            </li>
            <li class="mission-item done">
              <div class="mission-info">
                <span class="mission-check">✓</span>
                <div>
                  <div class="mission-name">Written Thesis Required</div>
                  <div style="font-size:0.7rem; color:var(--fg-muted);">Logged falsifiable observation reason in captain's log</div>
                </div>
              </div>
              <span class="mission-xp-badge">+30 XP</span>
            </li>
            <li class="mission-item">
              <div class="mission-info">
                <span class="mission-check"></span>
                <div>
                  <div class="mission-name">Maker Limit Order Placed</div>
                  <div style="font-size:0.7rem; color:var(--fg-muted);">Saved 100% taker fee friction by providing passive liquidity</div>
                </div>
              </div>
              <span class="mission-xp-badge">+40 XP</span>
            </li>
            <li class="mission-item">
              <div class="mission-info">
                <span class="mission-check"></span>
                <div>
                  <div class="mission-name">Post-Settlement Calibration Review</div>
                  <div style="font-size:0.7rem; color:var(--fg-muted);">Reconciled outcome against assessed probability</div>
                </div>
              </div>
              <span class="mission-xp-badge">+50 XP</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- ===================================================================
           STATION 2: NAVIGATION (Star Map)
           =================================================================== -->
      <section class="station-panel ${activeStation === "navigation" ? "active" : ""}" id="station-panel-navigation" aria-label="Navigation Station">
        <div class="station-header">
          <div class="station-eyebrow">STATION 2 OF 7 // STAR MAP</div>
          <h2 class="station-title">Navigation Station</h2>
          <p class="station-desc">
            Settlement radar and oracle trajectory. Track the 60-second CME CF BRTI TWAP averaging window, constituent spot consensus (Coinbase, Kraken, Bitstamp, Gemini), and coin-flip danger zones.
          </p>
        </div>

        <div class="deck-grid-3">
          <div class="hud-card accent-cyan">
            <div class="hud-card-title">
              <span>SETTLEMENT TARGET</span>
              <span>CME CF BRTI</span>
            </div>
            <div class="hud-stat-val">$91,248.50</div>
            <div class="hud-stat-label">Constituent consensus across 4 venues</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>SERIES EXPIRY COUNTDOWN</span>
              <span>KXBTC15M</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-cyan);" id="deck-nav-countdown">04:12</div>
            <div class="hud-stat-label">Seconds 840–900 determine resolution</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>COIN-FLIP ZONE HAZARD</span>
              <span>WARNING</span>
            </div>
            <div class="hud-stat-val" style="color:var(--ok-green);">NOMINAL</div>
            <div class="hud-stat-label">Spot $48 away from ATM strike ($91,200)</div>
          </div>
        </div>

        <div class="hud-card">
          <div class="hud-card-title">
            <span>LIVE SETTLEMENT RADAR VIEWPORT</span>
            <a href="/radar" style="color:var(--hud-cyan); font-size:0.75rem; text-decoration:none;">Open Full Radar &rarr;</a>
          </div>
          <div style="background:rgba(5,6,11,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:24px; text-align:center;">
            <div style="font-family:var(--font-mono); font-size:0.9rem; color:#FFFFFF; margin-bottom:8px;">
              60-Second TWAP Oracle Averaging Grid Active
            </div>
            <div style="font-size:0.8rem; color:var(--fg-muted); max-width:540px; margin:0 auto 16px;">
              Kalshi KXBTC15M contracts resolve against the regulated UK FCA / US CFTC benchmark, not your mobile app spot.
            </div>
            <a href="/radar" class="btn-aria-action" style="display:inline-block; text-decoration:none; padding:10px 20px;">
              Launch Dedicated Microstructure Radar &rarr;
            </a>
          </div>
        </div>
      </section>

      <!-- ===================================================================
           STATION 3: ENGINEERING (Fuel & Reactor)
           =================================================================== -->
      <section class="station-panel ${activeStation === "engineering" ? "active" : ""}" id="station-panel-engineering" aria-label="Engineering Station">
        <div class="station-header">
          <div class="station-eyebrow">STATION 3 OF 7 // FUEL &amp; REACTOR</div>
          <h2 class="station-title">Engineering Station</h2>
          <p class="station-desc">
            True-Cost calculation reactor. Audit exchange taker fee curves, Maker/Taker savings, aggregate order rounding consolidation, and cross-venue net spread.
          </p>
        </div>

        <!-- Interactive Reactor Control Pod -->
        <div class="hud-card accent-cyan" style="margin-bottom:24px;">
          <div class="hud-card-title">
            <span>REACTOR CONTROL POD // ORDER SPECIFICATIONS</span>
            <span style="color:var(--hud-cyan); font-family:var(--font-mono);">RULE B5 LOCKED ($0.00 LIVE RISK)</span>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:18px;">
            <!-- Contract Price -->
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.78rem;">
                <label for="eng-input-price" style="color:#FFFFFF; font-weight:600;">Contract Ask Price</label>
                <span id="eng-label-price" style="color:var(--hud-gold); font-family:var(--font-mono); font-weight:700;">51¢ ($0.51)</span>
              </div>
              <input type="range" id="eng-slider-price" min="1" max="99" value="51" aria-label="Contract price in cents" style="width:100%; accent-color:var(--hud-gold);" oninput="syncEngPriceFromSlider(this.value)">
              <div style="display:flex; gap:6px; margin-top:6px;">
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem;" onclick="setEngPrice(10)">10¢</button>
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem;" onclick="setEngPrice(25)">25¢</button>
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem;" onclick="setEngPrice(50)">50¢</button>
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem; border-color:var(--hud-gold); color:var(--hud-gold);" onclick="setEngPrice(51)">51¢</button>
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem;" onclick="setEngPrice(75)">75¢</button>
              </div>
            </div>

            <!-- Contract Quantity -->
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.78rem;">
                <label for="eng-input-count" style="color:#FFFFFF; font-weight:600;">Order Quantity (Contracts)</label>
                <span id="eng-label-count" style="color:#FFFFFF; font-family:var(--font-mono); font-weight:700;">10 ct</span>
              </div>
              <input type="range" id="eng-slider-count" min="1" max="250" value="10" aria-label="Order contract quantity" style="width:100%; accent-color:var(--hud-cyan);" oninput="syncEngCountFromSlider(this.value)">
              <div style="display:flex; gap:6px; margin-top:6px;">
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem;" onclick="setEngCount(1)">1 ct</button>
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem; border-color:var(--hud-cyan); color:var(--hud-cyan);" onclick="setEngCount(10)">10 ct</button>
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem;" onclick="setEngCount(50)">50 ct</button>
                <button type="button" class="btn-aria-action" style="padding:2px 8px; font-size:0.7rem;" onclick="setEngCount(100)">100 ct</button>
              </div>
            </div>

            <!-- User Assumed Probability -->
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.78rem;">
                <label for="eng-input-prob" style="color:#FFFFFF; font-weight:600;">Assessed Win Probability</label>
                <span id="eng-label-prob" style="color:#38BDF8; font-family:var(--font-mono); font-weight:700;">55.0%</span>
              </div>
              <input type="range" id="eng-slider-prob" min="1" max="99" value="55" aria-label="Assessed win probability percentage" style="width:100%; accent-color:#38BDF8;" oninput="syncEngProbFromSlider(this.value)">
              <div style="font-size:0.68rem; color:var(--fg-muted); margin-top:6px;">
                Strictly labeled <strong style="color:var(--hud-gold);">your assumption</strong> (not an automated model forecast).
              </div>
            </div>

            <!-- Venue Selection -->
            <div>
              <label for="eng-select-venue" style="display:block; margin-bottom:6px; font-size:0.78rem; color:#FFFFFF; font-weight:600;">Execution Venue</label>
              <select id="eng-select-venue" aria-label="Execution venue selection" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); font-size:0.8rem; padding:8px 10px; border-radius:4px;" onchange="recalculateEngineering()">
                <option value="kalshi-15m" selected>Kalshi 15M (KXBTC15M)</option>
                <option value="kalshi-1h">Kalshi 1H (KXBTCD)</option>
                <option value="polymarket-15m">Polymarket 15M (Crypto)</option>
              </select>
              <div style="font-size:0.68rem; color:var(--fg-muted); margin-top:6px;">
                Settles on <span id="eng-settlement-label" style="color:var(--hud-cyan);">${initialCost.settlementSource}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4 Primary Reactor Friction Gauges -->
        <div class="deck-grid-4">
          <div class="hud-card">
            <div class="hud-card-title">
              <span>PURCHASE OUTLAY</span>
              <span>CAPITAL</span>
            </div>
            <div class="hud-stat-val" id="eng-stat-outlay">$${initialCost.executableCost.toFixed(2)}</div>
            <div class="hud-stat-label" id="eng-stat-outlay-sub">10 contracts @ $0.51</div>
          </div>

          <div class="hud-card accent-gold">
            <div class="hud-card-title">
              <span>EXCHANGE TAKER FEE</span>
              <span id="eng-stat-fee-badge" style="color:var(--alert-red);">PEAK DRAG</span>
            </div>
            <div class="hud-stat-val" style="color:var(--alert-red);" id="eng-stat-fee">$${initialCost.fee.toFixed(2)}</div>
            <div class="hud-stat-label" id="eng-stat-fee-rate">1.80¢ / contract (3.53% outlay drag)</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>REQUIRED BREAKEVEN</span>
              <span>HURDLE RATE</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-gold);" id="eng-stat-breakeven">${initialCost.discreteBreakevenPct.toFixed(2)}%</div>
            <div class="hud-stat-label" id="eng-stat-raw-breakeven">Raw: ${initialCost.rawBreakevenPct.toFixed(2)}% (Hurdle: +${(initialCost.discreteBreakevenPct - 51).toFixed(2)}%)</div>
          </div>

          <div class="hud-card accent-cyan">
            <div class="hud-card-title">
              <span>NET EXPECTED VALUE</span>
              <span>YOUR ASSUMPTION</span>
            </div>
            <div class="hud-stat-val" style="color:var(--ok-green);" id="eng-stat-ev">+$${initialCost.expectedValue.toFixed(2)}</div>
            <div class="hud-stat-label" id="eng-stat-ev-contract">+${initialCost.expectedValuePerContractCents?.toFixed(2) ?? "2.20"}¢ net expectancy / ct</div>
          </div>
        </div>

        <!-- 3 Core Sub-Modules: Saver, Rounding, Cross-Venue -->
        <div style="display:flex; flex-direction:column; gap:24px;">

          <!-- SUB-MODULE 1: MAKER VS TAKER SAVER -->
          <div class="hud-card accent-gold" id="eng-module-saver">
            <div class="hud-card-title">
              <span style="display:flex; align-items:center; gap:8px;">
                <span style="color:var(--hud-gold);">⚡</span>
                <span>MAKER VS. TAKER SAVER // PASSIVE LIQUIDITY ACCELERATOR</span>
              </span>
              <span style="color:var(--ok-green); font-family:var(--font-mono);">100% TAKER FEE SAVED</span>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:16px;">
              <div style="background:rgba(5,6,11,0.6); padding:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--fg-muted); text-transform:uppercase;">Taker Execution Fee</div>
                <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:var(--alert-red); margin-top:2px;" id="eng-saver-taker-fee">$${initialSaver.takerFee.toFixed(2)}</div>
                <div style="font-size:0.7rem; color:var(--fg-muted);">Pays exchange crossing toll</div>
              </div>

              <div style="background:rgba(5,6,11,0.6); padding:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--fg-muted); text-transform:uppercase;">Maker Limit Order Fee</div>
                <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:var(--ok-green); margin-top:2px;" id="eng-saver-maker-fee">$${initialSaver.makerFee.toFixed(2)}</div>
                <div style="font-size:0.7rem; color:var(--fg-muted);">Posts passive book liquidity</div>
              </div>

              <div style="background:rgba(5,6,11,0.6); padding:12px; border-radius:6px; border:1px solid var(--hud-gold-dim);">
                <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--hud-gold); text-transform:uppercase;">Instant Dollar Savings</div>
                <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:var(--hud-gold); margin-top:2px;" id="eng-saver-dollars">$${initialSaver.dollarSavings.toFixed(2)}</div>
                <div style="font-size:0.7rem; color:var(--hud-gold);" id="eng-saver-bps">+${initialSaver.savingsBps} bps preserved</div>
              </div>

              <div style="background:rgba(5,6,11,0.6); padding:12px; border-radius:6px; border:1px solid rgba(79,209,232,0.2);">
                <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--hud-cyan); text-transform:uppercase;">Hurdle Reduction</div>
                <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:var(--hud-cyan); margin-top:2px;" id="eng-saver-hurdle">-${initialSaver.hurdleReductionPct.toFixed(2)}%</div>
                <div style="font-size:0.7rem; color:var(--fg-muted);">Direct win-rate threshold drop</div>
              </div>
            </div>

            <div style="font-size:0.78rem; color:#E2E8F0; line-height:1.5; padding:10px 14px; background:rgba(0,0,0,0.4); border-radius:6px; border-left:3px solid var(--hud-gold);" id="eng-saver-method-note">
              <strong>Methodology Note:</strong> ${initialSaver.methodologyNote} Estimated fill probability from orderbook depth: <strong style="color:var(--hud-cyan);" id="eng-saver-fill-prob">~${initialSaver.estimatedFillProbabilityPct}%</strong>.
            </div>
          </div>

          <!-- SUB-MODULE 2: ROUNDING OPTIMIZER -->
          <div class="hud-card" id="eng-module-rounding">
            <div class="hud-card-title">
              <span style="display:flex; align-items:center; gap:8px;">
                <span style="color:var(--hud-cyan);">⚙️</span>
                <span>ROUNDING OPTIMIZER // CEIL() FRICTION AUDITOR</span>
              </span>
              <span style="color:var(--hud-cyan); font-family:var(--font-mono);">DISCRETE CENT ARITHMETIC</span>
            </div>

            <p style="font-size:0.8rem; color:var(--fg-muted); margin-bottom:14px;">
              Kalshi rounds taker fees up to the nearest full cent per order: <code>ceil(0.07 × Count × P × (1 − P))</code>. Placing discrete small orders creates severe fractional-cent penalties that vanish upon consolidation.
            </p>

            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; font-family:var(--font-mono); font-size:0.75rem; text-align:center; margin-bottom:16px;">
              <div style="background:rgba(5,6,11,0.6); padding:10px; border-radius:4px; border:1px solid rgba(244,63,94,0.3);">
                <div style="color:var(--fg-muted);">1 Contract @ 51¢</div>
                <div style="color:var(--alert-red); font-size:0.95rem; font-weight:700; margin:4px 0;">2¢ Fee</div>
                <div style="font-size:0.68rem; color:#FDA4AF;">+0.25¢ drag (14.3% penalty)</div>
              </div>
              <div style="background:rgba(5,6,11,0.6); padding:10px; border-radius:4px; border:1px solid rgba(201,162,74,0.3);">
                <div style="color:var(--fg-muted);">10 Contracts @ 51¢</div>
                <div style="color:var(--hud-gold); font-size:0.95rem; font-weight:700; margin:4px 0;">18¢ Fee</div>
                <div style="font-size:0.68rem; color:var(--hud-gold);">+0.05¢ drag (1.80¢/ct)</div>
              </div>
              <div style="background:rgba(5,6,11,0.6); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">
                <div style="color:var(--fg-muted);">50 Contracts @ 51¢</div>
                <div style="color:#FFFFFF; font-size:0.95rem; font-weight:700; margin:4px 0;">88¢ Fee</div>
                <div style="font-size:0.68rem; color:var(--fg-muted);">+0.01¢ drag (1.76¢/ct)</div>
              </div>
              <div style="background:rgba(5,6,11,0.6); padding:10px; border-radius:4px; border:1px solid rgba(48,164,108,0.3);">
                <div style="color:var(--fg-muted);">100 Contracts @ 50¢</div>
                <div style="color:var(--ok-green); font-size:0.95rem; font-weight:700; margin:4px 0;">$1.75 Fee</div>
                <div style="font-size:0.68rem; color:var(--ok-green);">0.00¢ drag (Exact 1.75¢/ct)</div>
              </div>
            </div>

            <div style="background:rgba(79,209,232,0.06); border:1px solid var(--glass-border); padding:12px 14px; border-radius:6px; font-size:0.8rem; color:#E2E8F0;" id="eng-rounding-recommendation">
              <strong>Consolidation Recommendation:</strong> ${initialRounding.recommendation}
            </div>
          </div>

          <!-- SUB-MODULE 3: CROSS-VENUE NET SPREAD -->
          <div class="hud-card" id="eng-module-spread">
            <div class="hud-card-title">
              <span style="display:flex; align-items:center; gap:8px;">
                <span style="color:var(--hud-gold);">⚖️</span>
                <span>CROSS-VENUE NET SPREAD // KALSHI VS. POLYMARKET</span>
              </span>
              <span style="color:var(--fg-muted); font-family:var(--font-mono);">NET FRICTION DEDUCTION</span>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:16px;">
              <div style="background:rgba(5,6,11,0.6); padding:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--fg-muted);">Kalshi KXBTC15M Price</div>
                <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:#FFFFFF; margin-top:2px;">51.0¢</div>
                <div style="font-size:0.7rem; color:var(--alert-red);">Taker Fee: 1.80¢ / ct</div>
              </div>

              <div style="background:rgba(5,6,11,0.6); padding:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--fg-muted);">Polymarket BTC 15m Price</div>
                <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:#FFFFFF; margin-top:2px;">53.0¢</div>
                <div style="font-size:0.7rem; color:var(--ok-green);">Protocol Fee: 0.00¢ / ct</div>
              </div>

              <div style="background:rgba(5,6,11,0.6); padding:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--fg-muted);">Gross Quoted Spread</div>
                <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:var(--fg-muted); margin-top:2px;" id="eng-spread-gross">${initialSpread.grossSpreadCents.toFixed(2)}¢</div>
                <div style="font-size:0.7rem; color:var(--fg-muted);">Apparent price difference</div>
              </div>

              <div style="background:rgba(5,6,11,0.6); padding:12px; border-radius:6px; border:1px solid var(--glass-border);">
                <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--hud-cyan);">Net Spread (After Both Fees)</div>
                <div style="font-family:var(--font-mono); font-size:1.25rem; font-weight:700; color:var(--hud-cyan); margin-top:2px;" id="eng-spread-net">${initialSpread.netSpreadCents.toFixed(2)}¢</div>
                <div style="font-size:0.7rem; color:var(--hud-cyan);" id="eng-spread-viable">Taker friction consumes 90% of spread</div>
              </div>
            </div>

            <!-- Settlement Source Basis Mismatch Alert -->
            <div style="background:rgba(229,72,77,0.08); border:1px solid rgba(229,72,77,0.3); border-radius:6px; padding:12px 16px; font-size:0.78rem; line-height:1.5; color:#FECDD3;" id="eng-spread-mismatch-notice">
              <strong style="color:var(--alert-red);">Settlement Risk Hazard:</strong> ${initialSpread.settlementMismatchNotice}
            </div>
          </div>

        </div>
      </section>

      <!-- ===================================================================
           STATION 4: MISSION LOG (Captain's Log)
           =================================================================== -->
      <section class="station-panel ${activeStation === "mission-log" ? "active" : ""}" id="station-panel-mission-log" aria-label="Mission Log Station">
        <div class="station-header">
          <div class="station-eyebrow">STATION 4 OF 7 // CAPTAIN'S LOG</div>
          <h2 class="station-title">Mission Log Station</h2>
          <p class="station-desc">
            Captain's observation journal and trade accountability ledger. Track the complete lifecycle: Written Thesis → Executed Trade → Verified Settlement with automated Kalshi CSV import.
          </p>
        </div>

        <div class="deck-grid-3">
          <div class="hud-card">
            <div class="hud-card-title">
              <span>RECORDED MISSIONS</span>
              <span>JOURNAL</span>
            </div>
            <div class="hud-stat-val">28</div>
            <div class="hud-stat-label">100% verified against CME CF BRTI</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>TAKER FEES AVOIDED</span>
              <span>MAKER DISCIPLINE</span>
            </div>
            <div class="hud-stat-val" style="color:var(--ok-green);">$14.20</div>
            <div class="hud-stat-label">Cumulative savings via maker orders</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>PERSONAL BRIER</span>
              <span>CALIBRATION</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-cyan);">0.1982</div>
            <div class="hud-stat-label">Strict calibration score (n=28)</div>
          </div>
        </div>

        <div class="hud-card">
          <div class="hud-card-title">
            <span>KALSHI CSV FILL IMPORTER</span>
            <span style="color:var(--fg-muted);">1-CLICK INGEST</span>
          </div>
          <div style="background:rgba(5,6,11,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:24px; text-align:center;">
            <div style="font-family:var(--font-mono); font-size:0.9rem; color:#FFFFFF; margin-bottom:8px;">
              Import Official Kalshi Trade History &amp; Settlement Fills
            </div>
            <div style="font-size:0.8rem; color:var(--fg-muted); max-width:540px; margin:0 auto 16px;">
              Reconciles historical fees paid vs fees avoidable, flags unhedged hazard contracts, and updates your personal Brier calibration score.
            </div>
            <button type="button" class="btn-aria-action" onclick="alert('Kalshi CSV Importer ready. Select fill file to ingest.');">
              📂 Select Kalshi CSV File &rarr;
            </button>
          </div>
        </div>
      </section>

      <!-- ===================================================================
           STATION 5: SENSORS (Long-Range Scanners)
           =================================================================== -->
      <section class="station-panel ${activeStation === "sensors" ? "active" : ""}" id="station-panel-sensors" aria-label="Sensors Station">
        <div class="station-header">
          <div class="station-eyebrow">STATION 5 OF 7 // LONG-RANGE SCANNERS</div>
          <h2 class="station-title">Sensors Station</h2>
          <p class="station-desc">
            Whale order flow scanners and market microstructure telemetry with net-after-fees and settlement basis context. Includes Shadow Mode observation tracking.
          </p>
        </div>

        <div class="deck-grid-3">
          <div class="hud-card">
            <div class="hud-card-title">
              <span>WHALE PRINTS (24H)</span>
              <span>&gt; 500 CT</span>
            </div>
            <div class="hud-stat-val">14</div>
            <div class="hud-stat-label">Net taker fee paid: $245.00</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>SHADOW MODE</span>
              <span>PAPER SIM</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-cyan);">ACTIVE</div>
            <div class="hud-stat-label">Simulating order fills with 0 live capital</div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>CROSS-VENUE BASIS</span>
              <span>KALSHI VS POLY</span>
            </div>
            <div class="hud-stat-val">±$14.20</div>
            <div class="hud-stat-label">BRTI vs UMA resolution delta</div>
          </div>
        </div>

        <div class="hud-card">
          <div class="hud-card-title">
            <span>LIVE FLOW TELEMETRY</span>
            <span style="color:var(--ok-green);">● STREAMING</span>
          </div>
          <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--fg-muted); line-height:1.8;">
            <div style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between;">
              <span>KXBTC15M-26OCT09-91250</span>
              <span style="color:#FFFFFF;">100ct @ 51¢</span>
              <span style="color:var(--alert-red);">Taker Fee: $1.75</span>
              <span style="color:var(--hud-cyan);">Breakeven: 52.75%</span>
            </div>
            <div style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between;">
              <span>KXBTC15M-26OCT09-91200</span>
              <span style="color:#FFFFFF;">50ct @ 75¢</span>
              <span style="color:var(--alert-red);">Taker Fee: $0.66</span>
              <span style="color:var(--hud-cyan);">Breakeven: 76.32%</span>
            </div>
            <div style="padding:6px 0; display:flex; justify-content:space-between;">
              <span>KXBTC15M-26OCT09-91300</span>
              <span style="color:#FFFFFF;">250ct @ 25¢</span>
              <span style="color:var(--ok-green);">Maker Limit ($0.00 fee)</span>
              <span style="color:var(--hud-gold);">Maker Saved: $3.29</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ===================================================================
           STATION 6: CREW (Crew Quarters)
           =================================================================== -->
      <section class="station-panel ${activeStation === "crew" ? "active" : ""}" id="station-panel-crew" aria-label="Crew Station">
        <div class="station-header">
          <div class="station-eyebrow">STATION 6 OF 7 // CREW QUARTERS</div>
          <h2 class="station-title">Crew Station</h2>
          <p class="station-desc">
            8 initial AI crew members operating under strict non-advisory tool scopes. Meet your flight support crew or book a private 1-on-1 session with a human Flight Instructor.
          </p>
        </div>

        <div class="deck-grid-4">
          <div class="hud-card">
            <div class="hud-card-title">
              <span>NAVIGATOR</span>
              <span>AI</span>
            </div>
            <div style="font-weight:700; color:#FFFFFF; margin-bottom:4px;">Vega-1</div>
            <div style="font-size:0.75rem; color:var(--fg-muted); line-height:1.4;">
              Settlement basis &amp; TWAP window countdown tracking.
            </div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>CHIEF ENGINEER</span>
              <span>AI</span>
            </div>
            <div style="font-weight:700; color:#FFFFFF; margin-bottom:4px;">Torque</div>
            <div style="font-size:0.75rem; color:var(--fg-muted); line-height:1.4;">
              Exchange fee curves, Maker Saver &amp; rounding consolidation.
            </div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>RADAR OFFICER</span>
              <span>AI</span>
            </div>
            <div style="font-weight:700; color:#FFFFFF; margin-bottom:4px;">Echo</div>
            <div style="font-size:0.75rem; color:var(--fg-muted); line-height:1.4;">
              Constituent exchange spot consensus &amp; depth analysis.
            </div>
          </div>

          <div class="hud-card">
            <div class="hud-card-title">
              <span>SAFETY OFFICER</span>
              <span>AI</span>
            </div>
            <div style="font-weight:700; color:#FFFFFF; margin-bottom:4px;">Aegis</div>
            <div style="font-size:0.75rem; color:var(--fg-muted); line-height:1.4;">
              Tilt detection, 15-minute cooling off &amp; loss-limit tracking.
            </div>
          </div>
        </div>

        <!-- Human Flight Instructor Booking -->
        <div class="hud-card accent-gold">
          <div class="hud-card-title">
            <span>HUMAN FLIGHT INSTRUCTOR SESSIONS</span>
            <span style="color:var(--hud-gold);">PROCESS COACHING ONLY</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="font-weight:600; color:#FFFFFF; margin-bottom:4px;">Book a 45-Minute Pre-Trade Calibration Flight Check</div>
              <div style="font-size:0.78rem; color:var(--fg-muted); max-width:620px;">
                Review your personal Brier score, fee friction drag, and cognitive bias log with an experienced quant flight instructor. We do not provide buy/sell signals or financial advice.
              </div>
            </div>
            <a href="/learn" class="btn-aria-action" style="text-decoration:none; padding:10px 18px; border-color:var(--hud-gold); color:var(--hud-gold);">
              Browse Flight School &rarr;
            </a>
          </div>
        </div>
      </section>

      <!-- ===================================================================
           STATION 7: HANGAR (Ship Config)
           =================================================================== -->
      <section class="station-panel ${activeStation === "hangar" ? "active" : ""}" id="station-panel-hangar" aria-label="Hangar Station">
        <div class="station-header">
          <div class="station-eyebrow">STATION 7 OF 7 // SHIP CONFIG</div>
          <h2 class="station-title">Hangar Station</h2>
          <p class="station-desc">
            Pilot profile, responsible trading boundaries (18+ gate, session limits, tilt cooldown), telemetry acoustic controls, embed widgets, and developer API keys.
          </p>
        </div>

        <div class="deck-grid-2">
          <!-- Responsible Trading Config Box -->
          <div class="hud-card accent-cyan">
            <div class="hud-card-title">
              <span>RESPONSIBLE-TRADING CONTROLS</span>
              <span>MANDATORY GUARDRAILS</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:14px; font-size:0.82rem;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="color:#FFFFFF; font-weight:600;">18+ Age Attestation</div>
                  <div style="font-size:0.72rem; color:var(--fg-muted);">Kalshi requires age 18+. Verified boolean on file.</div>
                </div>
                <span style="color:var(--ok-green); font-family:var(--font-mono); font-weight:700;">VERIFIED ✓</span>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="color:#FFFFFF; font-weight:600;">Daily Loss Limit Boundary</div>
                  <div style="font-size:0.72rem; color:var(--fg-muted);">Alert triggers if cumulative loss exceeds boundary</div>
                </div>
                <input type="text" value="$50.00" aria-label="Daily Loss Limit" style="width:80px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); padding:4px 8px; border-radius:4px; text-align:right;">
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="color:#FFFFFF; font-weight:600;">Tilt Detection Cooldown</div>
                  <div style="font-size:0.72rem; color:var(--fg-muted);">15-minute system cooldown after 3 rapid losses</div>
                </div>
                <span style="color:var(--hud-cyan); font-family:var(--font-mono); font-weight:700;">ENABLED (15m)</span>
              </div>
            </div>
          </div>

          <!-- Developer API & Widgets Box -->
          <div class="hud-card">
            <div class="hud-card-title">
              <span>DEVELOPER API &amp; WIDGETS</span>
              <a href="/developers" style="color:var(--hud-cyan); font-size:0.72rem; text-decoration:none;">Docs &rarr;</a>
            </div>
            <div style="font-size:0.82rem; color:var(--fg-muted); line-height:1.5; margin-bottom:14px;">
              Access programmatic true-cost calculation endpoints, raw Brier calibration telemetry, and embeddable iframe widgets.
            </div>
            <div style="font-family:var(--font-mono); font-size:0.75rem; background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.08); margin-bottom:14px; word-break:break-all;">
              API KEY: <span style="color:var(--hud-gold);">qt_live_99f2b84...locked</span>
            </div>
            <a href="/developers" class="btn-aria-action" style="display:inline-block; text-decoration:none;">
              Generate Developer Key &rarr;
            </a>
          </div>
        </div>
      </section>

    </main>
  </div>

  <!-- Mobile Bottom Navigation Tab Bar -->
  <nav class="cockpit-mobile-tabs" id="cockpit-mobile-tabs" aria-label="Flight Deck mobile stations">
    <div class="cockpit-mobile-tabs-inner">
      ${navItemsMobileHtml}
    </div>
  </nav>

  <!-- Station Switching Engine -->
  <script>
    function switchStation(stationId) {
      if (!stationId) return;

      // Update URL search param without page reload
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('station', stationId);
        window.history.replaceState({}, '', url);
      } catch (_) {}

      // Update Desktop Nav items
      const navItems = document.querySelectorAll('.deck-nav-item');
      navItems.forEach(item => {
        if (item.getAttribute('data-station') === stationId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Update Mobile Tab items
      const mobileTabs = document.querySelectorAll('.deck-mobile-tab');
      mobileTabs.forEach(tab => {
        if (tab.getAttribute('data-station') === stationId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      // Update Station Panels
      const panels = document.querySelectorAll('.station-panel');
      panels.forEach(panel => {
        if (panel.id === 'station-panel-' + stationId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });

      // Scroll to top of stage
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Auto-select station from URL query on load
    (function() {
      try {
        const params = new URLSearchParams(window.location.search);
        const qStation = params.get('station');
        if (qStation && document.getElementById('station-panel-' + qStation)) {
          switchStation(qStation);
        }
      } catch (_) {}
    })();

    // Engineering Station Live Reactor Engine
    function ceilToCent(val) {
      if (val <= 0) return 0.0;
      return Math.ceil(Number((val - 1e-9).toFixed(6)) * 100) / 100;
    }

    function recalculateEngineering() {
      const priceSlider = document.getElementById('eng-slider-price');
      const countSlider = document.getElementById('eng-slider-count');
      const probSlider = document.getElementById('eng-slider-prob');
      const venueSelect = document.getElementById('eng-select-venue');
      if (!priceSlider || !countSlider || !probSlider) return;

      const priceCents = parseInt(priceSlider.value, 10);
      const price = priceCents / 100;
      const count = parseInt(countSlider.value, 10);
      const prob = parseFloat(probSlider.value) / 100;
      const venue = venueSelect ? venueSelect.value : 'kalshi-15m';

      let takerFee = 0;
      let makerFee = 0;
      const isKalshi = venue.startsWith('kalshi');
      if (isKalshi) {
        takerFee = ceilToCent(0.07 * count * price * (1.0 - price));
        makerFee = 0.00;
      } else {
        takerFee = 0.00;
        makerFee = 0.00;
      }

      const outlay = count * price;
      const maxLoss = outlay + takerFee;
      const rawBreakevenPct = (price + 0.07 * price * (1.0 - price)) * 100;
      const discreteBreakevenPct = (maxLoss / count) * 100;
      const expectedValue = (prob * count * 1.0) - maxLoss;
      const evPerContractCents = (expectedValue / count) * 100;

      // Update gauges
      const outlayEl = document.getElementById('eng-stat-outlay');
      if (outlayEl) outlayEl.textContent = '$' + outlay.toFixed(2);
      const outlaySubEl = document.getElementById('eng-stat-outlay-sub');
      if (outlaySubEl) outlaySubEl.textContent = count + ' contracts @ $' + price.toFixed(2);

      const feeEl = document.getElementById('eng-stat-fee');
      if (feeEl) feeEl.textContent = '$' + takerFee.toFixed(2);
      const feeRateEl = document.getElementById('eng-stat-fee-rate');
      if (feeRateEl) feeRateEl.textContent = ((takerFee / count) * 100).toFixed(2) + '¢ / contract (' + ((takerFee / outlay) * 100).toFixed(2) + '% outlay drag)';

      const breakevenEl = document.getElementById('eng-stat-breakeven');
      if (breakevenEl) breakevenEl.textContent = discreteBreakevenPct.toFixed(2) + '%';
      const rawBreakevenEl = document.getElementById('eng-stat-raw-breakeven');
      if (rawBreakevenEl) rawBreakevenEl.textContent = 'Raw: ' + rawBreakevenPct.toFixed(2) + '% (Hurdle: +' + (discreteBreakevenPct - priceCents).toFixed(2) + '%)';

      const evEl = document.getElementById('eng-stat-ev');
      if (evEl) {
        evEl.textContent = (expectedValue >= 0 ? '+' : '') + '$' + expectedValue.toFixed(2);
        evEl.style.color = expectedValue >= 0 ? 'var(--ok-green)' : 'var(--alert-red)';
      }
      const evContractEl = document.getElementById('eng-stat-ev-contract');
      if (evContractEl) evContractEl.textContent = (evPerContractCents >= 0 ? '+' : '') + evPerContractCents.toFixed(2) + '¢ net expectancy / ct';

      // Sub-module 1: Maker vs Taker Saver
      const saverTakerFeeEl = document.getElementById('eng-saver-taker-fee');
      if (saverTakerFeeEl) saverTakerFeeEl.textContent = '$' + takerFee.toFixed(2);
      const saverMakerFeeEl = document.getElementById('eng-saver-maker-fee');
      if (saverMakerFeeEl) saverMakerFeeEl.textContent = '$' + makerFee.toFixed(2);
      const dollarSavings = takerFee - makerFee;
      const saverDollarsEl = document.getElementById('eng-saver-dollars');
      if (saverDollarsEl) saverDollarsEl.textContent = '$' + dollarSavings.toFixed(2);
      const saverBpsEl = document.getElementById('eng-saver-bps');
      if (saverBpsEl) {
        const bps = outlay > 0 ? Math.round((dollarSavings / outlay) * 10000) : 0;
        saverBpsEl.textContent = '+' + bps + ' bps preserved';
      }
      const saverHurdleEl = document.getElementById('eng-saver-hurdle');
      if (saverHurdleEl) {
        const hurdleReduction = discreteBreakevenPct - priceCents;
        saverHurdleEl.textContent = '-' + hurdleReduction.toFixed(2) + '%';
      }

      // Sub-module 2: Rounding Optimizer
      const singleFee = ceilToCent(0.07 * 1 * price * (1.0 - price));
      const separate10 = singleFee * count;
      const roundingDrag = Math.max(0, separate10 - takerFee);
      const roundingDragEl = document.getElementById('eng-rounding-recommendation');
      if (roundingDragEl) {
        roundingDragEl.innerHTML = '<strong>Consolidation Recommendation:</strong> ' + (
          roundingDrag > 0
            ? 'Consolidating ' + count + ' separate 1-contract orders into 1 single order of ' + count + ' contracts saves $' + roundingDrag.toFixed(2) + ' in fractional cent round-up drag.'
            : 'Order sizing of ' + count + ' contracts is already mathematically optimized against cent rounding drag.'
        );
      }

      // Sub-module 3: Cross-Venue Net Spread
      const polyPrice = Math.min(0.99, price + 0.02);
      const grossSpreadCents = Math.abs(price - polyPrice) * 100;
      const polyFee = 0.00;
      const totalFeesPerContract = (takerFee / count) + polyFee;
      const netSpreadCents = grossSpreadCents - (totalFeesPerContract * 100);
      const grossSpreadEl = document.getElementById('eng-spread-gross');
      if (grossSpreadEl) grossSpreadEl.textContent = grossSpreadCents.toFixed(2) + '¢';
      const netSpreadEl = document.getElementById('eng-spread-net');
      if (netSpreadEl) {
        netSpreadEl.textContent = netSpreadCents.toFixed(2) + '¢';
        netSpreadEl.style.color = netSpreadCents > 0 ? 'var(--hud-cyan)' : 'var(--alert-red)';
      }
    }

    function setEngPrice(cents) {
      const slider = document.getElementById('eng-slider-price');
      if (slider) {
        slider.value = cents;
        syncEngPriceFromSlider(cents);
      }
    }

    function setEngCount(count) {
      const slider = document.getElementById('eng-slider-count');
      if (slider) {
        slider.value = count;
        syncEngCountFromSlider(count);
      }
    }

    function syncEngPriceFromSlider(val) {
      const label = document.getElementById('eng-label-price');
      if (label) label.textContent = val + '¢ ($' + (val / 100).toFixed(2) + ')';
      recalculateEngineering();
    }

    function syncEngCountFromSlider(val) {
      const label = document.getElementById('eng-label-count');
      if (label) label.textContent = val + ' ct';
      recalculateEngineering();
    }

    function syncEngProbFromSlider(val) {
      const label = document.getElementById('eng-label-prob');
      if (label) label.textContent = parseFloat(val).toFixed(1) + '%';
      recalculateEngineering();
    }
  </script>
</body>
</html>`;
}
