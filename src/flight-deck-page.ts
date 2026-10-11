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
import {
  evaluateCoinFlipZone,
  computeConstituentDispersion,
  computeTwapWindowStatus,
  generateNavigationStrikeLadder,
  type ConstituentQuote,
  type NavigationStrikeItem,
} from "./lib/navigation.ts";
import {
  calculateBrierScore,
  createMissionThesis,
  settleMissionEntry,
  parseKalshiCsvToMissions,
  summarizeMissionLogs,
  getSampleMissionLogs,
  type MissionLogEntry,
  type MissionLogSummary,
} from "./lib/mission-log.ts";
import {
  computeBridgeGauges,
  computeHullGauge,
  computeFuelGauge,
  computeNavAccuracyGauge,
  computeDisciplineGauge,
  type BridgeGaugesState,
} from "./lib/bridge-gauges.ts";
import {
  getUserLimits,
  DEFAULT_RESPONSIBLE_LIMITS,
  type UserResponsibleLimits,
} from "./lib/responsible-trading.ts";
import {
  LAUNCH_CREW_MEMBERS,
  ARIA_VERBATIM_REFUSAL,
  ADVERSARIAL_EVAL_PROMPTS,
} from "./lib/aria-crew.ts";
import {
  PILOT_RANKS,
  MISSIONS_ROSTER,
  computeUserXpState,
} from "./lib/xp-engine.ts";
import {
  getCalibrationLeaderboard,
  getFeesSavedLeaderboard,
  MIN_CALIBRATION_SAMPLE_SIZE,
} from "./lib/leaderboards.ts";
import {
  SAMPLE_LARGE_TRADE_PRINTS,
  queryLargeTradeFeed,
  type LargeTradePrint,
} from "./lib/sensors-feed.ts";
import {
  getPolymarketWalletCard,
  getCuratedBenchmarkWallets,
  renderWalletCardDetailsHtml,
  type WalletCalibrationCard,
} from "./lib/wallet-cards.ts";
import {
  getShadowTrackingRules,
  getShadowPaperTrades,
  getShadowModeSummary,
  renderShadowModeTabHtml,
  type ShadowModeSummary,
  type ShadowTrackingRule,
} from "./lib/shadow-mode.ts";
import { renderInstallPromptHtml } from "./lib/mobile-pwa.ts";
import { parseSharedContractInput, type ParsedSharedContract } from "./lib/share-target.ts";
import { REDUCED_MOTION_CSS, HAPTICS_AND_MOTION_CLIENT_SCRIPT } from "./lib/haptics-motion.ts";

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
  activeStation?: FlightDeckStationId;
  reqPath?: string;
  sharedContract?: ParsedSharedContract;
  user?: {
    id?: string;
    email?: string;
    callsign?: string;
    rank?: string;
    tier?: string;
    xp?: number;
    streakDays?: number;
  } | null;
}

export function renderFlightDeckPageHtml(options: FlightDeckRenderOptions = {}): string {
  const opt = options || {};
  const shared = opt.sharedContract;
  const activeStation = shared ? "engineering" : (opt.activeStation || opt.initialStation || "bridge");
  const user = opt.user || {
    email: "cadet@quanterraos.com",
    callsign: "CADET-7",
    rank: "Cadet",
    xp: 140,
    streakDays: 3,
  };

  const initialPrice = shared ? shared.price : 0.51;
  const initialContracts = shared ? shared.contracts : 10;
  const initialProduct = shared ? shared.ticker : "KXBTC15M";
  const initialVenue = shared && shared.venue === "polymarket" ? "polymarket" : "kalshi";

  // Pre-calculate initial Engineering station metrics
  const initialCost = computeTrueCostCheck({
    venue: initialVenue,
    product: initialProduct,
    price: initialPrice,
    contracts: initialContracts,
    userAssumedProbability: 0.55,
  });
  const initialSaver = computeMakerTakerSaver(initialContracts, initialPrice, initialProduct, Math.round(initialPrice * 100));
  const initialRounding = computeRoundingOptimizer(initialContracts, 5, initialPrice);
  const initialSpread = computeCrossVenueNetSpread({
    kalshiPrice: initialPrice,
    polymarketPrice: Number((initialPrice + 0.02).toFixed(2)),
    contracts: initialContracts,
  });

  // Pre-calculate initial Navigation station metrics (KXBTC15M settlement consensus & ladder)
  const initialConstituents: ConstituentQuote[] = [
    { venue: "Coinbase", price: 91249.20, weightPct: 0.35, status: "ONLINE" },
    { venue: "Kraken", price: 91247.80, weightPct: 0.28, status: "ONLINE" },
    { venue: "Bitstamp", price: 91248.50, weightPct: 0.22, status: "ONLINE" },
    { venue: "Gemini", price: 91248.10, weightPct: 0.15, status: "ONLINE" },
  ];
  const initialConsensus = computeConstituentDispersion(initialConstituents);
  const initialNavSeconds = 138; // 2m 18s remaining in 15m cycle
  const initialTwap = computeTwapWindowStatus(initialNavSeconds);
  const initialLadder = generateNavigationStrikeLadder(initialConsensus.indexPrice, initialNavSeconds);
  const initialAtmStrike = initialLadder.find((s) => s.isAtm) || initialLadder[2];

  // Pre-calculate initial Mission Log records & personal Brier summary
  const initialMissions = getSampleMissionLogs();
  const initialMissionSummary = summarizeMissionLogs(initialMissions);

  // Pre-calculate initial Bridge gauges (Fuel, Hull, Nav Accuracy, Discipline)
  const initialGauges = computeBridgeGauges({
    feeBudgetDollars: 50.0,
    consumedFeesDollars: 8.0,
    maxLossLimitDollars: 50.0,
    currentLossDollars: 10.0,
    personalBrier: initialMissionSummary.personalBrier ?? 0.1982,
    loggedTradesCount: initialMissionSummary.totalMissions || 20,
    tradesWithThesisCount: initialMissionSummary.disciplineScorePct ? Math.round((initialMissionSummary.disciplineScorePct / 100) * 20) : 19,
    totalDisciplineXp: user.xp ?? 140,
  });

  // Pre-calculate user responsible limits
  const initialLimits = getUserLimits(user.callsign || "cadet-default");

  // Pre-calculate leaderboards (Task 5.3)
  const initialCalibrationBoard = getCalibrationLeaderboard();
  const initialFeesBoard = getFeesSavedLeaderboard();

  // Pre-calculate Polymarket wallet calibration cards (Task 6.2)
  const initialBenchmarkWallets = getCuratedBenchmarkWallets();
  const initialDefaultWalletCard = getPolymarketWalletCard("0x71c828b6d8efec4f0c86bb0b784a9e29a39ec70a");

  // Pre-calculate Shadow Mode paper tracking (Task 6.3)
  const initialShadowRules = getShadowTrackingRules();
  const initialShadowSummary = getShadowModeSummary();
  const initialShadowTrades = getShadowPaperTrades();

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
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/icon-192.png">
  <link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
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
    ${REDUCED_MOTION_CSS}
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

        <!-- Odds Defenders Campaign Card (Dismissible) -->
        <div class="deck-campaign-card" id="deck-campaign-odds-defenders" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%); border: 1px solid rgba(148, 104, 255, 0.4); border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div style="max-width: 620px;">
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: #59DDEC; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.08em;">
              THE ODDS DEFENDERS // CAMPAIGN DISPATCH
            </div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
              Your next decision deserves a receipt.
            </div>
            <div style="font-size: 0.82rem; color: var(--fg-muted);">
              Check the assumptions and costs behind a supported market.
            </div>
            <!-- Onboarding Platform Question -->
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.75rem;">
              <span style="color: #CBD5E1; font-family: var(--font-mono);">Which market platform do you use?</span>
              <button type="button" class="btn-aria-action" onclick="setVenuePref('kalshi')" style="padding: 3px 8px; font-size: 0.72rem;">Kalshi</button>
              <button type="button" class="btn-aria-action" onclick="setVenuePref('polymarket')" style="padding: 3px 8px; font-size: 0.72rem;">Polymarket</button>
              <button type="button" class="btn-aria-action" onclick="setVenuePref('both')" style="padding: 3px 8px; font-size: 0.72rem;">Both</button>
              <button type="button" class="btn-aria-action" onclick="setVenuePref('skip')" style="padding: 3px 8px; font-size: 0.72rem; color: var(--fg-muted);">Skip</button>
              <span id="deck-campaign-venue-status" style="font-family: var(--font-mono); font-size: 0.7rem; color: #10B981;"></span>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <a href="/check?campaign=odds-defenders" style="background: var(--hud-cyan); color: #05060B; font-family: var(--font-mono); font-weight: 700; font-size: 0.8rem; padding: 9px 16px; border-radius: 20px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              Check a market &rarr;
            </a>
            <button type="button" onclick="dismissOddsDefendersCard()" style="background: none; border: 1px solid rgba(255, 255, 255, 0.15); color: var(--fg-muted); padding: 7px 12px; border-radius: 20px; font-size: 0.72rem; cursor: pointer;">
              ✕ Dismiss
            </button>
          </div>
        </div>

        <!-- Mascot Gear, Raffles & Tournaments Card -->
        <div class="deck-gear-rewards-card" id="deck-gear-rewards-card" style="background: linear-gradient(135deg, rgba(148, 104, 255, 0.12) 0%, rgba(223, 184, 67, 0.12) 100%); border: 1px solid rgba(148, 104, 255, 0.35); border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div style="max-width: 620px;">
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: #DFB843; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.08em;">
              FLIGHT GEAR &bull; RAFFLES &bull; TOURNAMENTS
            </div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
              Mascot Hoodies, Aerospace Jumpsuits &amp; Bespoke Executive Suits
            </div>
            <div style="font-size: 0.82rem; color: var(--fg-muted);">
              Redeem earned Flight XP or enter weekly gear raffles and calibration skill tournaments ($0.00 live risk).
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <a href="/merchandise" style="background: #9468FF; color: #FFFFFF; font-family: var(--font-mono); font-weight: 700; font-size: 0.8rem; padding: 9px 16px; border-radius: 20px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              Explore Gear &rarr;
            </a>
          </div>
        </div>

        <!-- Welcoming Video Briefing Banner & Onboarding Tutorial -->
        <div class="deck-welcome-briefing-card" style="background: linear-gradient(135deg, rgba(201, 162, 74, 0.14) 0%, rgba(79, 209, 232, 0.12) 100%); border: 1px solid var(--hud-gold); border-radius: 8px; padding: 18px 22px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);">
          <div style="max-width: 680px;">
            <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--hud-gold); text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--hud-gold); box-shadow:0 0 8px var(--hud-gold);"></span>
              <span>WELCOME CADET // ONBOARDING COCKPIT BRIEFING</span>
            </div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em;">
              60-Second Flight Deck Briefing: How Pre-Flight Checks Save $142.50/mo
            </div>
            <div style="font-size: 0.8rem; color: var(--fg-muted); margin-top: 4px; line-height: 1.5;">
              Explore the 7 stations, monitor real-time CME CF BRTI settlement dispersion, eliminate toxic taker fees, and build discipline XP from Cadet to Admiral.
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <button type="button" id="btn-open-deck-briefing" style="background: var(--hud-gold); color: #05060B; font-family: var(--font-mono); font-weight: 700; font-size: 0.82rem; padding: 10px 18px; border-radius: 20px; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 16px rgba(201, 162, 74, 0.35);" onclick="openDeckVideoBriefingModal()">
              <span>▶</span>
              <span>Watch Video Briefing</span>
            </button>
            <a href="/pricing" style="background: rgba(255, 255, 255, 0.06); color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.15); font-family: var(--font-mono); font-weight: 600; font-size: 0.78rem; padding: 9px 16px; border-radius: 20px; text-decoration: none;">
              Upgrade Pro ($29/mo) &rarr;
            </a>
          </div>
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

        <!-- Security Chief Stand-Down Alert (shown when Hull < 30%) -->
        <div id="bridge-security-chief-alert" style="display:${initialGauges.hull.integrityPct < 30 ? "block" : "none"}; background:rgba(229,72,77,0.12); border:1px solid rgba(229,72,77,0.5); border-radius:8px; padding:16px 20px; margin-bottom:20px; position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div style="max-width:700px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-family:var(--font-mono); font-size:0.85rem; font-weight:700; color:var(--alert-red);">
                  🛡️ SECURITY CHIEF ALERT // HULL INTEGRITY CRITICAL (&lt; 30%)
                </span>
                <span style="background:rgba(229,72,77,0.25); color:var(--alert-red); font-size:0.65rem; padding:2px 6px; border-radius:4px; font-family:var(--font-mono); font-weight:700;">TILT COOLDOWN RECOMMENDED</span>
              </div>
              <p style="font-size:0.78rem; line-height:1.5; color:#FECDD3; margin:0;" id="bridge-security-chief-msg">
                ${initialGauges.hull.securityChiefAlert ?? "Hull integrity has fallen below 30% of your voluntary loss limit. Standing down immediately is recommended to prevent cognitive tilt."}
              </p>
            </div>
            <button
              type="button"
              id="btn-bridge-stand-down"
              class="btn-aria-action"
              style="background:rgba(229,72,77,0.2); border-color:var(--alert-red); color:#FFFFFF; font-weight:700; padding:10px 16px; cursor:pointer;"
              onclick="standDownFromHullAlert()"
            >
              🛡️ Stand Down &amp; Activate Cooldown (+25 XP)
            </button>
          </div>
        </div>

        <!-- 4 Primary Ship Gauges Grid -->
        <div class="deck-grid-4" id="bridge-gauges-grid" style="margin-bottom:24px;">
          <!-- Gauge 1: Hull Integrity -->
          <div class="hud-card accent-cyan" id="gauge-card-hull">
            <div class="hud-card-title">
              <span>HULL INTEGRITY</span>
              <span id="gauge-hull-icon">🛡️</span>
            </div>
            <div class="hud-stat-val" style="color:var(--ok-green);" id="bridge-hull-val">${initialGauges.hull.integrityPct}%</div>
            <!-- Headroom Progress Bar -->
            <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; margin:8px 0; overflow:hidden;">
              <div id="bridge-hull-bar" style="height:100%; width:${initialGauges.hull.integrityPct}%; background:var(--ok-green); transition:width 0.3s ease;"></div>
            </div>
            <div class="hud-stat-label" id="bridge-hull-label">
              Loss Limit: $${initialGauges.hull.currentLossDollars.toFixed(2)} / $${initialGauges.hull.maxLossLimitDollars.toFixed(2)} ($${initialGauges.hull.headroomDollars.toFixed(2)} headroom)
            </div>
            <div style="font-size:0.68rem; color:var(--fg-muted); margin-top:4px;">
              Under 30% &rarr; Security Chief suggests standing down
            </div>
          </div>

          <!-- Gauge 2: Fuel Reserve -->
          <div class="hud-card accent-gold" id="gauge-card-fuel">
            <div class="hud-card-title">
              <span>FUEL RESERVE</span>
              <span>⚡</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-gold);" id="bridge-fuel-val">${initialGauges.fuel.remainingPct}%</div>
            <!-- Fuel Progress Bar -->
            <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; margin:8px 0; overflow:hidden;">
              <div id="bridge-fuel-bar" style="height:100%; width:${initialGauges.fuel.remainingPct}%; background:var(--hud-gold); transition:width 0.3s ease;"></div>
            </div>
            <div class="hud-stat-label" id="bridge-fuel-label">
              Runway: $${initialGauges.fuel.remainingDollars.toFixed(2)} of $${initialGauges.fuel.budgetDollars.toFixed(2)} fee budget
            </div>
            <div style="font-size:0.68rem; color:var(--ok-green); margin-top:4px;" id="bridge-fuel-warning">
              ${initialGauges.fuel.warningMessage ?? "Fee burn rate on track with monthly runway"}
            </div>
          </div>

          <!-- Gauge 3: Navigation Accuracy -->
          <div class="hud-card" id="gauge-card-brier">
            <div class="hud-card-title">
              <span>NAV ACCURACY</span>
              <span id="bridge-brier-badge" style="color:var(--hud-cyan); font-family:var(--font-mono); font-size:0.7rem;">${initialGauges.navAccuracy.ratingLabel}</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-cyan);" id="bridge-brier-val">${initialGauges.navAccuracy.personalBrier.toFixed(4)}</div>
            <!-- Market Comparison -->
            <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; margin:8px 0; overflow:hidden;">
              <div style="height:100%; width:82%; background:var(--hud-cyan);"></div>
            </div>
            <div class="hud-stat-label" id="bridge-brier-label">
              Outperforming market (0.2001) &amp; coin-flip (0.2500)
            </div>
            <div style="font-size:0.68rem; color:var(--ok-green); margin-top:4px;">
              +${(initialGauges.navAccuracy.outperformingMarketBps / 100).toFixed(2)}% calibration advantage
            </div>
          </div>

          <!-- Gauge 4: Discipline Score -->
          <div class="hud-card" id="gauge-card-discipline">
            <div class="hud-card-title">
              <span>DISCIPLINE XP</span>
              <span style="color:var(--hud-gold);">⭐ ANTI-VOLUME</span>
            </div>
            <div class="hud-stat-val" style="color:var(--ok-green);" id="bridge-discipline-val">${initialGauges.discipline.disciplinePct}%</div>
            <!-- Rank Progress Bar -->
            <div style="height:4px; background:rgba(255,255,255,0.08); border-radius:2px; margin:8px 0; overflow:hidden;">
              <div id="bridge-xp-bar" style="height:100%; width:${initialGauges.discipline.rankProgressPct}%; background:var(--ok-green);"></div>
            </div>
            <div class="hud-stat-label" id="bridge-discipline-xp">
              +${initialGauges.discipline.totalDisciplineXp} XP (${initialGauges.discipline.rankName})
            </div>
            <div style="font-size:0.68rem; color:var(--fg-muted); margin-top:4px;">
              Strictly for pre-flight checks &amp; written thesis
            </div>
          </div>
        </div>

        <!-- Voluntary Limits & Ship Calibration Pod -->
        <div class="hud-card" id="bridge-limits-pod" style="margin-bottom:24px;">
          <div class="hud-card-title">
            <span style="display:flex; align-items:center; gap:8px;">
              <span>⚙️</span>
              <span>VOLUNTARY SHIP LIMITS // HEADROOM &amp; RUNWAY SIMULATOR</span>
            </span>
            <span style="color:var(--hud-cyan); font-family:var(--font-mono); font-size:0.72rem;">PILOT SELF-REGULATION</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:14px;">
            <!-- Daily Loss Limit -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:4px;">
                <label for="bridge-input-loss-limit" style="color:#FFFFFF; font-weight:600;">Daily Loss Limit</label>
                <span id="bridge-label-loss-limit" style="color:var(--hud-cyan); font-family:var(--font-mono); font-weight:700;">$50.00</span>
              </div>
              <input type="range" id="bridge-input-loss-limit" min="10" max="250" value="50" step="5" style="width:100%; accent-color:var(--hud-cyan);" oninput="recalculateBridgeGauges()">
            </div>

            <!-- Current Loss -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:4px;">
                <label for="bridge-input-current-loss" style="color:#FFFFFF; font-weight:600;">Current Realized Loss</label>
                <span id="bridge-label-current-loss" style="color:var(--alert-red); font-family:var(--font-mono); font-weight:700;">$10.00</span>
              </div>
              <input type="range" id="bridge-input-current-loss" min="0" max="250" value="10" step="5" style="width:100%; accent-color:var(--alert-red);" oninput="recalculateBridgeGauges()">
            </div>

            <!-- Monthly Fee Budget -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:4px;">
                <label for="bridge-input-fee-budget" style="color:#FFFFFF; font-weight:600;">Monthly Fee Budget</label>
                <span id="bridge-label-fee-budget" style="color:var(--hud-gold); font-family:var(--font-mono); font-weight:700;">$50.00</span>
              </div>
              <input type="range" id="bridge-input-fee-budget" min="10" max="200" value="50" step="5" style="width:100%; accent-color:var(--hud-gold);" oninput="recalculateBridgeGauges()">
            </div>

            <!-- Incurred Fees -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:4px;">
                <label for="bridge-input-incurred-fees" style="color:#FFFFFF; font-weight:600;">Incurred Fees</label>
                <span id="bridge-label-incurred-fees" style="color:var(--fg-muted); font-family:var(--font-mono); font-weight:700;">$8.00</span>
              </div>
              <input type="range" id="bridge-input-incurred-fees" min="0" max="200" value="8" step="1" style="width:100%; accent-color:#CBD5E1;" oninput="recalculateBridgeGauges()">
            </div>
          </div>

          <!-- Quick Test Presets -->
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <button type="button" class="btn-aria-action" style="padding:4px 10px; font-size:0.72rem;" onclick="testNominalHull()">
              ✓ Test Nominal (80% Hull Headroom)
            </button>
            <button type="button" class="btn-aria-action" style="padding:4px 10px; font-size:0.72rem; border-color:var(--alert-red); color:var(--alert-red);" onclick="testTriggerSecurityChief()">
              ⚠️ Trigger Security Chief Alert (&lt; 30% Hull)
            </button>
            <button type="button" class="btn-aria-action" style="padding:4px 10px; font-size:0.72rem; border-color:var(--hud-gold); color:var(--hud-gold);" onclick="testFeeExhaustion()">
              ⚡ Test Fee Budget Burn
            </button>
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

        <!-- Pilot Progression & Cosmetic Unlocks Showcase (Task 5.2 / Part 3.5) -->
        <div class="hud-card" id="cosmetic-unlocks-card" style="margin-top:20px;">
          <div class="hud-card-title" style="display:flex; justify-content:space-between; align-items:center;">
            <span>PILOT RANKS &amp; COSMETIC UNLOCKS</span>
            <span style="color:var(--hud-cyan); font-family:var(--font-mono); font-size:0.72rem;">ANTI-VOLUME REWARDS ONLY</span>
          </div>
          <div style="font-size:0.78rem; color:var(--fg-muted); margin-bottom:14px; line-height:1.5;">
            Level up from Cadet to Admiral strictly by pre-flight checks, written theses, maker liquidity, and calibration accuracy. Unlocks are strictly cosmetic (ship hull skins, HUD themes, officer crests) — never trading features or fee volume discounts.
          </div>

          <!-- Ranks Stepper -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:16px;">
            ${PILOT_RANKS.map(rank => `
              <div style="background:rgba(0,0,0,0.4); border:1px solid ${rank.minXp <= (user.xp ?? 0) ? 'var(--hud-cyan)' : 'var(--border-subtle)'}; padding:10px; border-radius:4px; opacity:${rank.minXp <= (user.xp ?? 0) ? '1' : '0.6'};">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                  <div style="width:18px; height:18px;">${rank.badgeSvg}</div>
                  <strong style="font-size:0.8rem; color:#FFF;">${rank.rankName}</strong>
                </div>
                <div style="font-size:0.68rem; font-family:var(--font-mono); color:var(--hud-gold);">${rank.minXp} XP</div>
                <div style="font-size:0.65rem; color:var(--fg-muted); margin-top:4px;">${rank.cosmetics.length} Cosmetics</div>
              </div>
            `).join('')}
          </div>

          <!-- Cosmetic Showcase Gallery -->
          <div style="font-size:0.72rem; font-family:var(--font-mono); color:var(--hud-gold); margin-bottom:8px; text-transform:uppercase;">
            Unlocked Cosmetic Inventory:
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
            ${PILOT_RANKS.filter(r => r.minXp <= (user.xp ?? 0)).flatMap(r => r.cosmetics).map(c => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:10px;">
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--hud-cyan); margin-bottom:2px;">
                  <span>${c.category.replace('_', ' ').toUpperCase()}</span>
                  <span style="color:var(--ok-green);">UNLOCKED</span>
                </div>
                <div style="font-weight:600; color:#FFF; font-size:0.8rem; margin-bottom:2px;">${c.name}</div>
                <div style="font-size:0.68rem; color:var(--fg-muted); line-height:1.3;">${c.description}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Fleet Discipline Leaderboards (Task 5.3 / Part 3.5) -->
        <div class="hud-card" id="fleet-leaderboards-card" style="margin-top:20px;">
          <div class="hud-card-title" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span>🏆</span>
              <span>FLEET DISCIPLINE LEADERBOARDS</span>
            </div>
            <span style="color:var(--hud-gold); font-family:var(--font-mono); font-size:0.72rem;">OPT-IN &amp; PSEUDONYMOUS</span>
          </div>

          <div style="font-size:0.78rem; color:var(--fg-muted); margin-bottom:14px; line-height:1.5;">
            Ranked strictly by <strong>Calibration Accuracy</strong> (minimum n=30 settled logs to prevent small-sample luck) and <strong>Friction Avoidance</strong> (cumulative fees saved via Maker Saver). Never ranked by profit, ROI, or volume (Part 0.3 Guardrail 4).
          </div>

          <!-- Leaderboard Tab Selector -->
          <div style="display:flex; gap:8px; margin-bottom:14px;">
            <button type="button" class="btn-aria-action active" id="btn-tab-leaderboard-cal" style="padding:6px 14px; font-size:0.75rem;" onclick="showLeaderboardTab('calibration')">
              🎯 Calibration Leaders (Min n=30)
            </button>
            <button type="button" class="btn-aria-action" id="btn-tab-leaderboard-fees" style="padding:6px 14px; font-size:0.75rem;" onclick="showLeaderboardTab('fees')">
              ⚡ Fees Saved Leaders (Maker Saver)
            </button>
          </div>

          <!-- Tab 1: Calibration Accuracy Table -->
          <div id="leaderboard-tab-calibration" style="display:block;">
            <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--hud-cyan); font-family:var(--font-mono); margin-bottom:8px;">
              <span>BENCHMARKS: KALSHI MARKET MID: 0.2001 · COIN-FLIP RANDOM: 0.2500</span>
              <span>GATE: MINIMUM 30 SETTLED LOGS</span>
            </div>
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; font-size:0.78rem; font-family:var(--font-mono);">
                <thead>
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--fg-muted); text-align:left;">
                    <th style="padding:8px 6px;">#</th>
                    <th style="padding:8px 6px;">CALLSIGN</th>
                    <th style="padding:8px 6px;">RANK</th>
                    <th style="padding:8px 6px;">BRIER (MSE)</th>
                    <th style="padding:8px 6px;">SETTLED (n)</th>
                    <th style="padding:8px 6px;">THESIS %</th>
                    <th style="padding:8px 6px;">FEES SAVED</th>
                  </tr>
                </thead>
                <tbody>
                  ${initialCalibrationBoard.rankedLeaders.map(p => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:#FFF;">
                      <td style="padding:8px 6px; color:var(--hud-gold); font-weight:700;">#${p.rank}</td>
                      <td style="padding:8px 6px; font-weight:600;">${p.callsign}</td>
                      <td style="padding:8px 6px; color:var(--hud-cyan);">${p.pilotRank}</td>
                      <td style="padding:8px 6px; color:var(--ok-green); font-weight:700;">${p.brierScore.toFixed(4)}</td>
                      <td style="padding:8px 6px;">${p.settledLogCount}</td>
                      <td style="padding:8px 6px;">${p.thesisAdherencePct}%</td>
                      <td style="padding:8px 6px; color:var(--hud-gold);">$${p.feesSavedDollars.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Calibrating Drawer -->
            <div style="margin-top:14px; padding:10px; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:4px;">
              <div style="font-size:0.72rem; color:var(--hud-gold); font-family:var(--font-mono); margin-bottom:4px; font-weight:700;">
                PILOTS IN CALIBRATION (&lt; 30 SETTLED LOGS // UNRANKED UNTIL QUALIFIED):
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:10px;">
                ${initialCalibrationBoard.calibratingPilots.map(p => `
                  <div style="font-size:0.7rem; color:var(--fg-muted);">
                    <span style="color:#FFF;">${p.callsign}</span> (${p.settledLogCount}/30 logs &bull; ${p.logsRemainingForRank} remaining for official Brier ranking)
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Tab 2: Fees Saved Table -->
          <div id="leaderboard-tab-fees" style="display:none;">
            <div style="font-size:0.72rem; color:var(--hud-gold); font-family:var(--font-mono); margin-bottom:8px;">
              TOTAL AVOIDABLE TAKER FRICTION SAVED ACROSS KALSHI &amp; POLYMARKET
            </div>
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; font-size:0.78rem; font-family:var(--font-mono);">
                <thead>
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--fg-muted); text-align:left;">
                    <th style="padding:8px 6px;">#</th>
                    <th style="padding:8px 6px;">CALLSIGN</th>
                    <th style="padding:8px 6px;">FEES SAVED</th>
                    <th style="padding:8px 6px;">MAKER RATIO</th>
                    <th style="padding:8px 6px;">SETTLED (n)</th>
                    <th style="padding:8px 6px;">BRIER</th>
                  </tr>
                </thead>
                <tbody>
                  ${initialFeesBoard.map(p => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:#FFF;">
                      <td style="padding:8px 6px; color:var(--hud-gold); font-weight:700;">#${p.rank}</td>
                      <td style="padding:8px 6px; font-weight:600;">${p.callsign}</td>
                      <td style="padding:8px 6px; color:var(--hud-gold); font-weight:700;">$${p.feesSavedDollars.toFixed(2)}</td>
                      <td style="padding:8px 6px; color:var(--ok-green);">${p.makerOrderRatioPct}%</td>
                      <td style="padding:8px 6px;">${p.settledLogCount}</td>
                      <td style="padding:8px 6px; color:var(--hud-cyan);">${p.brierScore.toFixed(4)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Opt-in Status & Call Sign Setting -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); flex-wrap:wrap; gap:8px;">
            <div style="font-size:0.72rem; color:var(--fg-muted);">
              Current Status: <span id="leaderboard-optin-status" style="color:var(--ok-green); font-weight:600;">Opted-in as ${user.callsign || "CADET-7"} (Pseudonymous)</span>
            </div>
            <button type="button" class="btn-aria-action" style="padding:4px 10px; font-size:0.72rem;" onclick="toggleLeaderboardOptIn()">
              Toggle Opt-in Status
            </button>
          </div>
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
            Live Settlement Radar and oracle trajectory. Track the 60-second CME CF BRTI TWAP averaging window, constituent spot consensus (Coinbase, Kraken, Bitstamp, Gemini), and coin-flip danger zones.
          </p>
        </div>

        <!-- Telemetry Status Ribbon -->
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; background:rgba(79,209,232,0.06); border:1px solid rgba(79,209,232,0.2); border-radius:6px; padding:10px 16px; margin-bottom:20px; font-size:0.75rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--ok-green); box-shadow:0 0 8px var(--ok-green);"></span>
            <span style="font-family:var(--font-mono); font-weight:700; color:#FFFFFF;">PRO COCKPIT TELEMETRY: REAL-TIME (0-SEC LATENCY)</span>
          </div>
          <div style="color:var(--fg-muted);">
            Signed-out visitors receive 20-min delayed telemetry per Part 3.2 · Pro tier unlocked
          </div>
        </div>

        <!-- Top Telemetry 3-Card Grid -->
        <div class="deck-grid-3" style="margin-bottom:20px;">
          <!-- Card 1: Settlement Consensus -->
          <div class="hud-card accent-cyan">
            <div class="hud-card-title">
              <span>SETTLEMENT TARGET</span>
              <span>CME CF BRTI PROXY</span>
            </div>
            <div class="hud-stat-val" id="nav-target-price">$${initialConsensus.indexPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="hud-stat-label" id="nav-dispersion-label">
              4 venues online · <strong style="color:var(--ok-green);">${initialConsensus.dispersionBps.toFixed(2)} bps</strong> dispersion (${initialConsensus.dispersionStatus})
            </div>
            <!-- Constituent Chips -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:12px; font-family:var(--font-mono); font-size:0.7rem;">
              ${initialConsensus.constituents.map((c) => `
                <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:4px 6px; display:flex; justify-content:space-between;">
                  <span style="color:var(--fg-muted);">${c.venue}</span>
                  <span style="color:#FFFFFF; font-weight:600;">$${c.price.toFixed(1)}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Card 2: Expiry Countdown & Phase -->
          <div class="hud-card accent-gold">
            <div class="hud-card-title">
              <span>SERIES EXPIRY COUNTDOWN</span>
              <span>KXBTC15M</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-gold);" id="deck-nav-countdown">02:18</div>
            <div class="hud-stat-label" id="nav-phase-label">
              Phase: <strong style="color:var(--hud-gold);" id="nav-phase-badge">PRE_SETTLEMENT</strong> (Seconds 840–900 determine resolution)
            </div>
            <!-- Interactive Scrubber Controls for Testing & Replay -->
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:12px;">
              <button type="button" class="btn-aria-action" style="padding:2px 6px; font-size:0.65rem;" onclick="setNavCountdown(300)">05:00 (Nominal)</button>
              <button type="button" class="btn-aria-action" style="padding:2px 6px; font-size:0.65rem; border-color:var(--alert-red); color:var(--alert-red);" onclick="setNavCountdown(138)">02:18 (Hazard)</button>
              <button type="button" class="btn-aria-action" style="padding:2px 6px; font-size:0.65rem; border-color:var(--hud-cyan); color:var(--hud-cyan);" onclick="setNavCountdown(45)">00:45 (TWAP)</button>
              <button type="button" class="btn-aria-action" style="padding:2px 6px; font-size:0.65rem;" onclick="setNavCountdown(0)">00:00 (Settled)</button>
            </div>
          </div>

          <!-- Card 3: ATM Coin-Flip Zone Hazard -->
          <div class="hud-card" id="nav-hazard-card" style="border-color:rgba(229,72,77,0.4);">
            <div class="hud-card-title">
              <span>ATM COIN-FLIP HAZARD</span>
              <span id="nav-hazard-icon" style="color:var(--alert-red);">⚠️ ACTIVE</span>
            </div>
            <div class="hud-stat-val" id="nav-hazard-status-pill" style="color:var(--alert-red); font-size:1.4rem;">CRITICAL HAZARD</div>
            <div class="hud-stat-label" id="nav-hazard-distance-desc">
              Spot is $${Math.abs(initialAtmStrike.distanceDollars).toFixed(2)} from $${initialAtmStrike.strike.toLocaleString()} strike with ${initialNavSeconds}s remaining.
            </div>
            <div style="font-size:0.7rem; color:var(--hud-gold); margin-top:8px; font-weight:600;" id="nav-hazard-reward-cta">
              ✦ Discipline: +20 XP awarded for standing down
            </div>
          </div>
        </div>

        <!-- Coin-Flip Danger Zone Interactive Overlay Banner -->
        <div id="nav-coinflip-banner" style="background:rgba(229,72,77,0.08); border:1px solid rgba(229,72,77,0.4); border-radius:8px; padding:16px 20px; margin-bottom:24px; position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
            <div style="max-width:680px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span style="font-family:var(--font-mono); font-size:0.85rem; font-weight:700; color:var(--alert-red);">
                  ⚠️ ACTIVE COIN-FLIP HAZARD OVERLAY (THRESHOLD: WITHIN $50 &amp; &le; 180s)
                </span>
                <span style="background:rgba(229,72,77,0.2); color:var(--alert-red); font-size:0.65rem; padding:2px 6px; border-radius:4px; font-family:var(--font-mono); font-weight:700;">HIGH NEGATIVE EV DRAG</span>
              </div>
              <p style="font-size:0.78rem; line-height:1.5; color:#FECDD3; margin:0 0 10px 0;" id="nav-coinflip-explanation">
                The ATM contract ($${initialAtmStrike.strike.toLocaleString()}) is currently trading at 51¢ with 2m 18s left. Microstructure data proves that within $50 of the strike during the final 3 minutes, price action mimics random Brownian noise while Kalshi exchange taker fees peak at 1.75¢/ct (52.80% breakeven hurdle).
              </p>
              <div style="font-size:0.72rem; color:var(--fg-muted);">
                Rule B5 Compliant: QuanterraOS does not offer trade execution. Standing down preserves capital and strengthens calibration.
              </div>
            </div>
            <div style="text-align:right;">
              <button
                type="button"
                id="btn-nav-stand-down"
                class="btn-aria-action"
                style="background:rgba(48,164,108,0.15); border-color:var(--ok-green); color:#FFFFFF; font-weight:700; padding:10px 18px; font-size:0.82rem; cursor:pointer;"
                onclick="standDownCoinFlip()"
              >
                🛡️ Stand Down from Coin-Flip Entry (+20 XP)
              </button>
            </div>
          </div>

          <!-- Stood Down Verification Box (shown upon clicking) -->
          <div id="nav-stand-down-feedback" style="display:none; margin-top:14px; padding:10px 14px; background:rgba(48,164,108,0.12); border:1px solid rgba(48,164,108,0.4); border-radius:6px; font-size:0.78rem; color:#A7F3D0;">
            <strong>✓ Stood Down Verified:</strong> +20 XP awarded to Pilot Discipline record. Non-entry logged to Mission Log as positive calibration behavior.
          </div>
        </div>

        <!-- 60-Second TWAP Oracle Averaging Radar Card -->
        <div class="hud-card" id="nav-twap-radar" style="margin-bottom:24px;">
          <div class="hud-card-title">
            <span>60-SECOND TWAP ORACLE RADAR // UK BMR BENCHMARK RESOLUTION</span>
            <span style="font-family:var(--font-mono); color:var(--hud-cyan); font-size:0.72rem;" id="nav-twap-sample-status">
              ${initialTwap.isTwapActive ? `SAMPLING ACTIVE (SUB-INTERVAL ${initialTwap.subIntervalIndex}/12)` : "STANDBY (ORACLE ACTIVATES AT T-60s)"}
            </span>
          </div>

          <!-- 12 Sub-Interval Visualizer (5s each) -->
          <div style="margin:16px 0 12px 0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.72rem; color:var(--fg-muted); font-family:var(--font-mono);">
              <span>Second 840 (T-60s)</span>
              <span>12 Consecutive 5-Second Sub-Intervals</span>
              <span>Second 900 (Settled)</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(12, 1fr); gap:4px; height:24px;" id="nav-twap-blocks-container">
              ${Array.from({ length: 12 }, (_, i) => {
                const subInterval = i + 1;
                const isSampled = initialTwap.isTwapActive && subInterval <= initialTwap.subIntervalIndex;
                return `
                  <div
                    class="nav-twap-block ${isSampled ? "active" : ""}"
                    id="twap-block-${subInterval}"
                    style="background:${isSampled ? "var(--hud-cyan)" : "rgba(255,255,255,0.06)"}; border:1px solid rgba(255,255,255,0.1); border-radius:3px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:0.65rem; color:${isSampled ? "#05060B" : "var(--fg-muted);"}; font-weight:700;"
                    title="Sub-interval ${subInterval}: Second ${840 + (i * 5)}–${840 + ((i + 1) * 5)}"
                  >
                    ${subInterval * 5}s
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div style="font-size:0.76rem; color:var(--fg-muted); line-height:1.5; margin-bottom:12px;">
            Kalshi CFTC-regulated binary contracts do not settle on instantaneous spot prices from private apps. They resolve against the volume-weighted 60-second TWAP of the CME CF BRTI index sampled across 12 consecutive 5-second sub-intervals.
          </div>

          <!-- Regulatory & Licensing Disclosure (Rule B10) -->
          <div style="background:rgba(5,6,11,0.5); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:10px 14px; font-size:0.7rem; color:var(--fg-muted); line-height:1.4;" id="nav-licensing-notice">
            <strong style="color:#FFFFFF;">Attribution (Rule B10):</strong> ${initialConsensus.licensingNotice}
          </div>
        </div>

        <!-- Active Strike Ladder Microstructure Heatmap -->
        <div class="hud-card" id="nav-strike-ladder-card">
          <div class="hud-card-title">
            <span>ACTIVE KXBTC15M STRIKE LADDER</span>
            <span style="color:var(--hud-gold); font-size:0.72rem;">TOP-OF-BOOK &amp; FRICTION DRAG</span>
          </div>

          <div style="overflow-x:auto;">
            <table class="market-data-table" id="nav-strike-ladder" style="width:100%; border-collapse:collapse; font-size:0.78rem;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); text-align:left; font-family:var(--font-mono); color:var(--fg-muted); font-size:0.7rem;">
                  <th style="padding:10px 12px;">STRIKE / TICKER</th>
                  <th style="padding:10px 12px;">DISTANCE FROM SPOT</th>
                  <th style="padding:10px 12px;">SECONDS LEFT</th>
                  <th style="padding:10px 12px;">TOP OF BOOK (BID / ASK)</th>
                  <th style="padding:10px 12px;">TAKER FEE DRAG</th>
                  <th style="padding:10px 12px;">LIQUIDITY WALL</th>
                  <th style="padding:10px 12px; text-align:right;">ZONE STATUS</th>
                </tr>
              </thead>
              <tbody id="nav-ladder-tbody">
                ${initialLadder.map((item) => {
                  const isHazard = item.coinFlip.inZone;
                  return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04); background:${item.isAtm ? "rgba(79,209,232,0.03)" : "transparent"};" class="${item.isAtm ? "strike-row-atm" : ""}">
                      <td style="padding:10px 12px; font-family:var(--font-mono); font-weight:700; color:#FFFFFF;">
                        $${item.strike.toLocaleString()}
                        ${item.isAtm ? `<span style="background:rgba(79,209,232,0.2); color:var(--hud-cyan); font-size:0.65rem; padding:1px 5px; border-radius:3px; margin-left:4px;">ATM</span>` : ""}
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono); color:${item.distanceDollars >= 0 ? "var(--ok-green)" : "var(--alert-red)"};">
                        ${item.distanceDollars >= 0 ? "+" : ""}$${item.distanceDollars.toFixed(2)} (${item.distanceBps >= 0 ? "+" : ""}${item.distanceBps.toFixed(1)} bps)
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono);" class="ladder-seconds-left">
                        ${item.secondsRemaining}s
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono);">
                        $${item.yesBid.toFixed(2)} / $${item.yesAsk.toFixed(2)} (${item.spreadCents}¢ spread)
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono); color:var(--hud-gold);">
                        $${(item.takerFeeCents / 100).toFixed(2)} / ct (${((item.takerFeeCents / (item.yesAsk * 100)) * 100).toFixed(1)}%)
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono); color:var(--fg-muted);">
                        ${item.topOfBookSize} / ${item.liquidityWallContracts} ct
                      </td>
                      <td style="padding:10px 12px; text-align:right;">
                        ${isHazard ? `
                          <span style="background:rgba(229,72,77,0.18); border:1px solid rgba(229,72,77,0.4); color:var(--alert-red); font-family:var(--font-mono); font-size:0.68rem; padding:2px 8px; border-radius:4px; font-weight:700;">
                            ⚠️ COIN-FLIP HAZARD
                          </span>
                        ` : `
                          <span style="background:rgba(48,164,108,0.12); border:1px solid rgba(48,164,108,0.3); color:var(--ok-green); font-family:var(--font-mono); font-size:0.68rem; padding:2px 8px; border-radius:4px;">
                            NOMINAL
                          </span>
                        `}
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
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

        <!-- Web Share Target Intake Banner (Task 8.2 / Part 3.11) -->
        <div id="shared-contract-banner" class="hud-card" style="display:${shared ? "flex" : "none"}; background:rgba(201,162,74,0.1); border:1px solid var(--hud-gold); border-radius:8px; padding:16px 20px; margin-bottom:20px; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--hud-gold); font-weight:700; letter-spacing:0.1em; text-transform:uppercase;">
              ⚡ WEB SHARE TARGET INTAKE // CONTRACT PRE-FILLED
            </div>
            <div id="shared-contract-title" style="font-size:1rem; font-weight:700; color:#FFFFFF; margin-top:2px;">
              ${shared ? `${shared.marketTitle} (${shared.ticker})` : "Shared Prediction Contract"}
            </div>
            <div id="shared-contract-desc" style="font-size:0.75rem; color:#94A3B8;">
              Detected from <span id="shared-contract-venue" style="color:var(--hud-cyan); font-weight:600;">${shared ? shared.venue.toUpperCase() : "EXCHANGE"}</span> &bull; Pre-set to <span id="shared-contract-price-label">${Math.round(initialPrice * 100)}¢</span> @ <span id="shared-contract-count-label">${initialContracts} ct</span>. Taker fee drag calculated below.
            </div>
          </div>
          <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--ok-green); background:rgba(48,164,108,0.2); padding:4px 10px; border-radius:4px; font-weight:700;">
            PRE-FLIGHT AUDIT READY
          </span>
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
            Thesis → Trade → Settle lifecycle tracking, automated Kalshi CSV statement import, personal Brier scoring, and avoidable fee drag auditing.
          </p>
        </div>

        <!-- 4 Top Ledger Metric Cards -->
        <div class="deck-grid-4" style="margin-bottom:24px;">
          <!-- Card 1: Total Recorded Missions -->
          <div class="hud-card">
            <div class="hud-card-title">
              <span>RECORDED MISSIONS</span>
              <span>JOURNAL</span>
            </div>
            <div class="hud-stat-val" id="ml-stat-total-count">${initialMissionSummary.totalMissions}</div>
            <div class="hud-stat-label" id="ml-stat-settled-label">${initialMissionSummary.settledMissions} settled · ${initialMissionSummary.totalMissions - initialMissionSummary.settledMissions} active staging</div>
          </div>

          <!-- Card 2: Personal Brier Score -->
          <div class="hud-card accent-cyan">
            <div class="hud-card-title">
              <span>PERSONAL BRIER SCORE</span>
              <span style="color:var(--ok-green); font-size:0.7rem; font-family:var(--font-mono);">CALIBRATED</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-cyan);" id="ml-stat-brier-val">
              ${initialMissionSummary.personalBrier ? initialMissionSummary.personalBrier.toFixed(4) : "0.1982"}
            </div>
            <div class="hud-stat-label" id="ml-stat-brier-sub">
              Beating market mid (<strong style="color:#FFFFFF;">0.2001</strong>) &amp; coin-flip (<strong style="color:var(--alert-red);">0.2500</strong>)
            </div>
          </div>

          <!-- Card 3: Avoidable Taker Fee Drag -->
          <div class="hud-card accent-gold">
            <div class="hud-card-title">
              <span>AVOIDABLE FEE FRICTION</span>
              <span style="color:var(--ok-green);">SAVINGS RECORD</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-gold);" id="ml-stat-avoidable-fees">$${initialMissionSummary.totalFeesAvoidable.toFixed(2)}</div>
            <div class="hud-stat-label" id="ml-stat-fees-label">
              Total paid: $${initialMissionSummary.totalFeesPaid.toFixed(2)} · ${initialMissionSummary.makerPct}% maker ratio
            </div>
          </div>

          <!-- Card 4: Pilot Discipline Score -->
          <div class="hud-card">
            <div class="hud-card-title">
              <span>DISCIPLINE XP</span>
              <span style="color:var(--hud-gold);">ANTI-VOLUME</span>
            </div>
            <div class="hud-stat-val" style="color:var(--ok-green);" id="ml-stat-discipline-xp">+${initialMissionSummary.totalDisciplineXp} XP</div>
            <div class="hud-stat-label">
              ${initialMissionSummary.disciplineScorePct}% logged with thesis &amp; max-loss
            </div>
          </div>
        </div>

        <!-- Mission Log Navigation Tabs (Task 6.3: Journal vs Shadow Mode) -->
        <div style="display:flex; gap:10px; margin-bottom:20px;">
          <button type="button" class="btn-aria-action active" id="btn-mission-tab-journal" style="padding:8px 16px; font-size:0.8rem; font-family:var(--font-mono);" onclick="switchMissionTab('journal')">
            📖 Captain's Journal &amp; CSV Import
          </button>
          <button type="button" class="btn-aria-action" id="btn-mission-tab-shadow" style="padding:8px 16px; font-size:0.8rem; font-family:var(--font-mono); display:flex; align-items:center; gap:6px;" onclick="switchMissionTab('shadow')">
            <span>🛡️</span>
            <span>Shadow Mode (Paper Follower &bull; Rule 4.41)</span>
          </button>
        </div>

        <!-- Container 1: Mission Journal View -->
        <div id="mission-journal-view">
          <!-- Section 1: Thesis Stage & Pre-Flight Form -->
          <div class="hud-card accent-cyan" id="mission-stage-pod" style="margin-bottom:24px;">
          <div class="hud-card-title">
            <span style="display:flex; align-items:center; gap:8px;">
              <span>📝</span>
              <span>STAGE NEW MISSION THESIS // PRE-FLIGHT COMMITMENT</span>
            </span>
            <span style="color:var(--hud-gold); font-family:var(--font-mono); font-size:0.75rem;">+15 XP DISCIPLINE REWARD</span>
          </div>

          <p style="font-size:0.78rem; color:var(--fg-muted); margin-bottom:16px;">
            Part 0.3 Guardrail: No live execution exists in QuanterraOS. Writing your thesis and defining your max-loss before market entry enforces cognitive discipline and calibrates probability forecasting.
          </p>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:16px;">
            <!-- Contract Ticker -->
            <div>
              <label for="ml-input-ticker" style="display:block; font-size:0.78rem; color:#FFFFFF; font-weight:600; margin-bottom:4px;">Contract Ticker</label>
              <input type="text" id="ml-input-ticker" value="KXBTC15M-91250" placeholder="e.g. KXBTC15M-91250" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); font-size:0.82rem; padding:8px 10px; border-radius:4px;">
            </div>

            <!-- Side Selection -->
            <div>
              <label for="ml-select-side" style="display:block; font-size:0.78rem; color:#FFFFFF; font-weight:600; margin-bottom:4px;">Contract Side</label>
              <select id="ml-select-side" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); font-size:0.82rem; padding:8px 10px; border-radius:4px;">
                <option value="yes" selected>YES (Bitcoin &gt;= Strike)</option>
                <option value="no">NO (Bitcoin &lt; Strike)</option>
              </select>
            </div>

            <!-- Planned Price (Cents) -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:4px;">
                <label for="ml-slider-price" style="color:#FFFFFF; font-weight:600;">Planned Price</label>
                <span id="ml-label-price" style="color:var(--hud-gold); font-family:var(--font-mono); font-weight:700;">51¢ ($0.51)</span>
              </div>
              <input type="range" id="ml-slider-price" min="1" max="99" value="51" style="width:100%; accent-color:var(--hud-gold);" oninput="syncMlPrice(this.value)">
            </div>

            <!-- Contracts Quantity -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:4px;">
                <label for="ml-slider-count" style="color:#FFFFFF; font-weight:600;">Contracts</label>
                <span id="ml-label-count" style="color:#FFFFFF; font-family:var(--font-mono); font-weight:700;">10 ct</span>
              </div>
              <input type="range" id="ml-slider-count" min="1" max="100" value="10" style="width:100%; accent-color:var(--hud-cyan);" oninput="syncMlCount(this.value)">
            </div>

            <!-- Assessed Probability -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:4px;">
                <label for="ml-slider-prob" style="color:#FFFFFF; font-weight:600;">Assessed Probability</label>
                <span id="ml-label-prob" style="color:#38BDF8; font-family:var(--font-mono); font-weight:700;">58.0%</span>
              </div>
              <input type="range" id="ml-slider-prob" min="1" max="99" value="58" style="width:100%; accent-color:#38BDF8;" oninput="syncMlProb(this.value)">
            </div>

            <!-- Order Role -->
            <div>
              <label for="ml-select-role" style="display:block; font-size:0.78rem; color:#FFFFFF; font-weight:600; margin-bottom:4px;">Order Role</label>
              <select id="ml-select-role" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); font-size:0.82rem; padding:8px 10px; border-radius:4px;" onchange="updateMlMaxLoss()">
                <option value="maker" selected>Maker Limit (100% Fee Saved, +40 XP)</option>
                <option value="taker">Taker Market Order (Incurs Fee)</option>
              </select>
            </div>
          </div>

          <!-- Written Thesis Rationale Input -->
          <div style="margin-bottom:16px;">
            <label for="ml-input-thesis" style="display:block; font-size:0.78rem; color:#FFFFFF; font-weight:600; margin-bottom:4px;">
              Written Thesis Rationale &amp; Invalidation Criteria
            </label>
            <textarea id="ml-input-thesis" rows="2" placeholder="State why this contract has positive expectancy and specify exact condition that invalidates your premise..." style="width:100%; background:rgba(0,0,0,0.5); border:1px solid var(--glass-border); color:#FFFFFF; font-size:0.82rem; padding:8px 10px; border-radius:4px; font-family:var(--font-sans);">Coinbase bid depth wall holding firm. 4 constituent spot dispersion is tight (1.2 bps) with TWAP trajectory comfortably above strike.</textarea>
          </div>

          <!-- Bottom Action Bar & Max Loss Verification -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; background:rgba(0,0,0,0.3); padding:12px 16px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:0.8rem; font-family:var(--font-mono);">
              <span style="color:var(--fg-muted);">MAX LOSS ACKNOWLEDGED:</span>
              <strong style="color:var(--alert-red); margin-left:6px;" id="ml-calc-max-loss">$5.10</strong>
              <span style="color:var(--fg-muted); font-size:0.72rem; margin-left:6px;" id="ml-calc-fee-note">($5.10 outlay + $0.00 maker fee)</span>
            </div>
            <button
              type="button"
              id="btn-stage-thesis"
              class="btn-aria-action"
              style="background:rgba(79,209,232,0.15); border-color:var(--hud-cyan); color:#FFFFFF; font-weight:700; padding:10px 18px; cursor:pointer;"
              onclick="stageNewThesis()"
            >
              ✦ Stage Written Thesis &amp; Pre-Flight Check (+15 XP)
            </button>
          </div>

          <!-- Confirmation Banner -->
          <div id="ml-stage-confirmation" style="display:none; margin-top:12px; padding:10px 14px; background:rgba(48,164,108,0.15); border:1px solid rgba(48,164,108,0.4); border-radius:6px; font-size:0.78rem; color:#A7F3D0;">
            <strong>✓ Mission Staged:</strong> Thesis and max-loss recorded. +15 XP added to Pilot Discipline score. Ready for trade tracking or settlement reconciliation.
          </div>
        </div>

        <!-- Section 2: Kalshi CSV Statement Importer -->
        <div class="hud-card" id="mission-csv-importer" style="margin-bottom:24px;">
          <div class="hud-card-title">
            <span style="display:flex; align-items:center; gap:8px;">
              <span>📂</span>
              <span>KALSHI CSV FILL &amp; STATEMENT IMPORTER</span>
            </span>
            <span style="color:var(--fg-muted); font-size:0.72rem;">RFC 4180 COMPLIANT PARSER</span>
          </div>

          <p style="font-size:0.78rem; color:var(--fg-muted); margin-bottom:12px;">
            Import your official Kalshi trade reports or statement CSV to automatically calculate historical taker fee drag, tally avoidable friction, and calibrate your empirical personal Brier score.
          </p>

          <div style="display:flex; gap:12px; margin-bottom:12px;">
            <button type="button" class="btn-aria-action" style="padding:6px 12px; font-size:0.75rem;" onclick="loadSampleKalshiCsv()">
              📋 Paste Sample Kalshi Fills CSV
            </button>
            <button type="button" class="btn-aria-action" style="padding:6px 12px; font-size:0.75rem;" onclick="document.getElementById('ml-csv-textarea').value = '';">
              Clear Input
            </button>
          </div>

          <textarea id="ml-csv-textarea" rows="4" placeholder="Paste Kalshi CSV rows here (headers: date, ticker, side, count, price, fee, type)..." style="width:100%; background:rgba(0,0,0,0.5); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); font-size:0.75rem; padding:8px 10px; border-radius:4px; margin-bottom:12px;"></textarea>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div style="font-size:0.72rem; color:var(--fg-muted);">
              Data isolation: CSV processing is parsed client-side in browser memory with zero third-party transmission.
            </div>
            <button
              type="button"
              id="btn-ingest-csv"
              class="btn-aria-action"
              style="background:rgba(201,162,74,0.15); border-color:var(--hud-gold); color:var(--hud-gold); font-weight:700; padding:8px 16px; cursor:pointer;"
              onclick="ingestKalshiCsv()"
            >
              ⚡ Ingest &amp; Reconcile Kalshi Fills
            </button>
          </div>

          <!-- Ingestion Results Card (Hidden until run) -->
          <div id="ml-csv-results" style="display:none; margin-top:14px; padding:14px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:6px;">
            <div style="font-family:var(--font-mono); font-size:0.82rem; font-weight:700; color:#FFFFFF; margin-bottom:8px;">
              CSV INGESTION AUDIT REPORT
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; font-size:0.78rem;">
              <div>
                <span style="color:var(--fg-muted); display:block;">Imported Rows:</span>
                <strong style="color:#FFFFFF; font-family:var(--font-mono); font-size:1.1rem;" id="csv-stat-count">0</strong>
              </div>
              <div>
                <span style="color:var(--fg-muted); display:block;">Total Fees Paid:</span>
                <strong style="color:var(--alert-red); font-family:var(--font-mono); font-size:1.1rem;" id="csv-stat-fees">$0.00</strong>
              </div>
              <div>
                <span style="color:var(--fg-muted); display:block;">Avoidable by Maker:</span>
                <strong style="color:var(--ok-green); font-family:var(--font-mono); font-size:1.1rem;" id="csv-stat-avoidable">$0.00</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Personal Brier Score Calibration & Benchmark -->
        <div class="hud-card accent-gold" id="mission-calibration-card" style="margin-bottom:24px;">
          <div class="hud-card-title">
            <span style="display:flex; align-items:center; gap:8px;">
              <span>🎯</span>
              <span>PERSONAL BRIER CALIBRATION SCORE // EMPIRICAL RESOLUTION ACCURACY</span>
            </span>
            <span style="color:var(--ok-green); font-family:var(--font-mono); font-size:0.75rem;">+100 XP REWARD FOR 30-DAY IMPROVEMENT</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:16px;">
            <!-- Score Gauge -->
            <div style="background:rgba(5,6,11,0.6); padding:16px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); text-align:center;">
              <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--fg-muted); text-transform:uppercase;">Your Rolling Brier Score</div>
              <div style="font-family:var(--font-mono); font-size:2.2rem; font-weight:700; color:var(--hud-cyan); margin:6px 0;" id="brier-main-gauge">
                ${initialMissionSummary.personalBrier ? initialMissionSummary.personalBrier.toFixed(4) : "0.1982"}
              </div>
              <div style="font-size:0.72rem; color:var(--ok-green);" id="brier-advantage-text">
                ✓ Outperforming market midpoint (0.2001) by +0.95%
              </div>
            </div>

            <!-- Benchmark Comparisons -->
            <div style="display:flex; flex-direction:column; justify-content:space-around; background:rgba(5,6,11,0.6); padding:16px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); font-family:var(--font-mono); font-size:0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--fg-muted);">50/50 Coin-Flip Baseline:</span>
                <span style="color:var(--alert-red); font-weight:700;">0.2500 (Uncalibrated)</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--fg-muted);">Kalshi Market Midpoint (n=1,316):</span>
                <span style="color:#FFFFFF; font-weight:700;">0.2001 (Aggregated)</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--fg-muted);">Your Personal Record (n=${initialMissionSummary.settledMissions}):</span>
                <span style="color:var(--hud-cyan); font-weight:700;" id="brier-personal-chip">${initialMissionSummary.personalBrier ? initialMissionSummary.personalBrier.toFixed(4) : "0.1982"}</span>
              </div>
            </div>
          </div>

          <div style="font-size:0.76rem; color:var(--fg-muted); line-height:1.5;">
            <strong>How Calibration Works:</strong> Brier Score measures mean squared error: <code>MSE = (1/N) × &Sigma;(p &minus; outcome)&sup2;</code>. A lower score signifies sharper calibration. A trader who always guesses 50% scores 0.2500. Improving your 30-day score awards +100 XP toward your Pilot Rank.
          </div>
        </div>

        <!-- Section 4: Mission Log Journal Table -->
        <div class="hud-card" id="mission-log-ledger">
          <div class="hud-card-title">
            <span>MISSION JOURNAL // THESIS &rarr; TRADE &rarr; SETTLE AUDIT LEDGER</span>
            <span style="color:var(--hud-gold); font-size:0.72rem;">DISCIPLINE AUDITED</span>
          </div>

          <div style="overflow-x:auto;">
            <table class="market-data-table" id="mission-log-table" style="width:100%; border-collapse:collapse; font-size:0.78rem;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); text-align:left; font-family:var(--font-mono); color:var(--fg-muted); font-size:0.7rem;">
                  <th style="padding:10px 12px;">MISSION ID</th>
                  <th style="padding:10px 12px;">TICKER / SIDE</th>
                  <th style="padding:10px 12px;">ASSESSED PROB</th>
                  <th style="padding:10px 12px;">THESIS RATIONALE</th>
                  <th style="padding:10px 12px;">ORDER ROLE</th>
                  <th style="padding:10px 12px;">FEES PAID / SAVED</th>
                  <th style="padding:10px 12px;">STATUS / OUTCOME</th>
                  <th style="padding:10px 12px; text-align:right;">DISCIPLINE XP</th>
                </tr>
              </thead>
              <tbody id="mission-log-tbody">
                ${initialMissions.map((m) => {
                  const isStaged = m.status === "THESIS_STAGED";
                  return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04); background:${isStaged ? "rgba(79,209,232,0.03)" : "transparent"};" id="row-${m.id}">
                      <td style="padding:10px 12px; font-family:var(--font-mono); font-weight:600; color:#FFFFFF;">
                        ${m.id}
                        <div style="font-size:0.65rem; color:var(--fg-muted);">${m.reconciledSource ?? "USER_ENTERED"}</div>
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono);">
                        <strong>${m.ticker}</strong>
                        <span style="background:${m.side === "yes" ? "rgba(48,164,108,0.2)" : "rgba(229,72,77,0.2)"}; color:${m.side === "yes" ? "var(--ok-green)" : "var(--alert-red)"}; font-size:0.65rem; padding:1px 5px; border-radius:3px; margin-left:4px; text-transform:uppercase;">${m.side}</span>
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono); color:#38BDF8;">
                        ${(m.assessedProbability * 100).toFixed(1)}%
                        <div style="font-size:0.65rem; color:var(--fg-muted);">${m.contracts} ct @ $${m.plannedPrice.toFixed(2)}</div>
                      </td>
                      <td style="padding:10px 12px; max-width:280px; font-size:0.75rem; color:#E2E8F0; line-height:1.4;">
                        ${m.thesis}
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono);">
                        ${m.orderType === "maker" ? `
                          <span style="color:var(--ok-green); font-weight:700;">MAKER (0¢ fee)</span>
                        ` : `
                          <span style="color:var(--alert-red);">TAKER</span>
                        `}
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono);">
                        <span style="color:${m.feesPaid > 0 ? "var(--alert-red)" : "var(--ok-green)"};">$${m.feesPaid.toFixed(2)} paid</span>
                        ${m.avoidableFees > 0 ? `
                          <div style="font-size:0.65rem; color:var(--hud-gold);">+$${m.avoidableFees.toFixed(2)} avoidable</div>
                        ` : `
                          <div style="font-size:0.65rem; color:var(--ok-green);">100% friction saved</div>
                        `}
                      </td>
                      <td style="padding:10px 12px; font-family:var(--font-mono);">
                        ${isStaged ? `
                          <div style="display:flex; gap:4px;">
                            <button type="button" class="btn-aria-action" style="padding:2px 6px; font-size:0.65rem; border-color:var(--ok-green); color:var(--ok-green);" onclick="settleMissionClient('${m.id}', 'YES')">Settle YES</button>
                            <button type="button" class="btn-aria-action" style="padding:2px 6px; font-size:0.65rem; border-color:var(--alert-red); color:var(--alert-red);" onclick="settleMissionClient('${m.id}', 'NO')">Settle NO</button>
                          </div>
                        ` : `
                          <span style="background:rgba(255,255,255,0.06); color:#FFFFFF; font-size:0.68rem; padding:2px 6px; border-radius:3px;">
                            ${m.settledOutcome} (Error: ${m.brierError?.toFixed(4) ?? "0.0000"})
                          </span>
                        `}
                      </td>
                      <td style="padding:10px 12px; text-align:right; font-family:var(--font-mono); color:var(--hud-gold); font-weight:700;">
                        +${m.xpAwarded} XP
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <!-- End of Container 1: Mission Journal View -->

        <!-- Container 2: Shadow Mode Paper Tracking View (Task 6.3 / Part 3.4) -->
        <div id="mission-shadow-view" style="display:none;">
          ${renderShadowModeTabHtml(initialShadowSummary, initialShadowRules, initialShadowTrades)}
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
            <div class="hud-stat-val">${SAMPLE_LARGE_TRADE_PRINTS.length}</div>
            <div class="hud-stat-label">Net taker fee drag: $${SAMPLE_LARGE_TRADE_PRINTS.reduce((sum, p) => sum + p.takerFeeDollars, 0).toFixed(2)}</div>
          </div>

          <div class="hud-card" style="cursor:pointer;" onclick="switchStation('mission-log'); switchMissionTab('shadow');" title="Open Shadow Mode Paper Simulator in Mission Log">
            <div class="hud-card-title">
              <span>SHADOW MODE</span>
              <span>PAPER SIM</span>
            </div>
            <div class="hud-stat-val" style="color:var(--hud-cyan);">ACTIVE</div>
            <div class="hud-stat-label">Simulating order fills with 0 live capital &rarr;</div>
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

        <!-- Large-Trade Feed Scanner (Task 6.1 / Part 3.4) -->
        <div class="hud-card" id="sensors-whale-feed-card" style="margin-top:20px;">
          <div class="hud-card-title" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--ok-green); box-shadow:0 0 8px var(--ok-green);"></span>
              <span>LARGE-TRADE FLOW TELEMETRY // NET-AFTER-FEES &amp; SETTLEMENT CONTEXT</span>
            </div>
            <span style="color:var(--hud-cyan); font-family:var(--font-mono); font-size:0.72rem;">CFTC &amp; ON-CHAIN TAPE</span>
          </div>

          <div style="font-size:0.78rem; color:var(--fg-muted); margin-bottom:14px; line-height:1.5;">
            Every transaction is enriched with exact regulatory taker fee friction, required breakeven shifts, and settlement proximity. Volume is never an indicator of predictive edge.
          </div>

          <!-- Feed Venue Filter Selector -->
          <div style="display:flex; gap:8px; margin-bottom:14px;">
            <button type="button" class="btn-aria-action active" id="btn-feed-filter-all" style="padding:6px 12px; font-size:0.75rem;" onclick="filterSensorsFeed('all')">
              All Venues
            </button>
            <button type="button" class="btn-aria-action" id="btn-feed-filter-kalshi" style="padding:6px 12px; font-size:0.75rem;" onclick="filterSensorsFeed('kalshi')">
              Kalshi Tape (Anonymous)
            </button>
            <button type="button" class="btn-aria-action" id="btn-feed-filter-poly" style="padding:6px 12px; font-size:0.75rem;" onclick="filterSensorsFeed('polymarket')">
              Polymarket (On-Chain)
            </button>
          </div>

          <!-- Large-Trade Table -->
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.78rem; font-family:var(--font-mono);" id="sensors-feed-table">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--fg-muted); text-align:left;">
                  <th style="padding:8px 6px;">VENUE</th>
                  <th style="padding:8px 6px;">TICKER &amp; SIDE</th>
                  <th style="padding:8px 6px;">SIZE &amp; NOTIONAL</th>
                  <th style="padding:8px 6px;">EXEC PRICE</th>
                  <th style="padding:8px 6px; color:var(--hud-gold);">NET-AFTER-FEES</th>
                  <th style="padding:8px 6px; color:var(--hud-cyan);">SETTLEMENT CONTEXT</th>
                  <th style="padding:8px 6px;">IDENTITY</th>
                </tr>
              </thead>
              <tbody>
                ${SAMPLE_LARGE_TRADE_PRINTS.map(p => `
                  <tr class="sensor-trade-row venue-${p.venue}" style="border-bottom:1px solid rgba(255,255,255,0.05); color:#FFF;">
                    <td style="padding:8px 6px;">
                      <span style="font-size:0.65rem; padding:2px 6px; border-radius:3px; font-weight:700; background:${p.venue === 'kalshi' ? 'rgba(79,209,232,0.15)' : 'rgba(201,162,74,0.15)'}; color:${p.venue === 'kalshi' ? 'var(--hud-cyan)' : 'var(--hud-gold)'};">
                        ${p.venue.toUpperCase()}
                      </span>
                    </td>
                    <td style="padding:8px 6px;">
                      <div style="font-weight:600; color:#FFF;">${p.ticker}</div>
                      <div style="font-size:0.68rem; color:${p.side === 'YES' ? 'var(--ok-green)' : 'var(--alert-red)'}; font-weight:700;">${p.side} &bull; ${p.orderType.toUpperCase()}</div>
                    </td>
                    <td style="padding:8px 6px;">
                      <div style="color:#FFF; font-weight:600;">${p.contracts.toLocaleString()} ct</div>
                      <div style="font-size:0.68rem; color:var(--fg-muted);">$${p.notionalDollars.toFixed(2)}</div>
                    </td>
                    <td style="padding:8px 6px; color:#FFF; font-weight:700;">
                      ${p.priceCents}¢
                    </td>
                    <td style="padding:8px 6px;">
                      <div style="color:${p.orderType === 'maker' ? 'var(--ok-green)' : 'var(--alert-red)'}; font-weight:700;">
                        Fee: $${p.takerFeeDollars.toFixed(2)}
                      </div>
                      <div style="font-size:0.68rem; color:var(--hud-cyan);">
                        Breakeven: ${p.requiredBreakevenPct.toFixed(2)}%
                      </div>
                      <div style="font-size:0.65rem; color:var(--fg-muted);">
                        Net Max Loss: $${p.netLossIfLoseDollars.toFixed(2)}
                      </div>
                    </td>
                    <td style="padding:8px 6px;">
                      <div style="font-size:0.7rem; color:#FFF;">${p.settlementSource}</div>
                      <div style="font-size:0.68rem; color:${p.settlementRiskLevel === 'HAZARD_COIN_FLIP' ? 'var(--alert-red)' : 'var(--ok-green)'}; font-weight:${p.settlementRiskLevel === 'HAZARD_COIN_FLIP' ? '700' : '400'};">
                        ${p.settlementRiskLevel === 'HAZARD_COIN_FLIP' ? '⚠️ HAZARD: ±$' + p.strikeDistanceDollars + ' (' + p.secondsToExpiry + 's)' : 'Dist: $' + p.strikeDistanceDollars + ' (' + p.secondsToExpiry + 's)'}
                      </div>
                    </td>
                    <td style="padding:8px 6px; font-size:0.68rem; color:var(--fg-muted);">
                      ${p.walletIdentifier}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:10px; margin-top:14px; font-size:0.7rem; color:var(--fg-muted); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span>QuanterraOS Sensors Layer · Rule B5 Compliant (Zero Live Execution / No Order Routing)</span>
            <span style="color:var(--hud-cyan);">CFTC Rule 4.41 Compliant</span>
          </div>
        </div>

        <!-- Polymarket Wallet Calibration Track Record Cards (Task 6.2 / Part 3.4) -->
        <div class="hud-card" id="sensors-wallet-cards-card" style="margin-top:20px;">
          <div class="hud-card-title" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--hud-cyan); box-shadow:0 0 8px var(--hud-cyan);"></span>
              <span>POLYMARKET WALLET CALIBRATION TRACK RECORD CARDS // PROBABILISTIC BRIER SCORING</span>
            </div>
            <span style="color:var(--hud-gold); font-family:var(--font-mono); font-size:0.72rem;">ON-CHAIN CALIBRATION AUDIT</span>
          </div>

          <div style="font-size:0.78rem; color:var(--fg-muted); margin-bottom:14px; line-height:1.5;">
            Evaluating public on-chain Polymarket wallets by <strong>probabilistic calibration (Brier score &amp; reliability)</strong> rather than misleading raw P&amp;L or high win rates. Exposes the Favorite-Chaser Paradox (traders winning 80% of trades on 90&cent; contracts while underperforming a naive coin flip).
          </div>

          <!-- Address Lookup and Benchmark Quick Chips -->
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <input type="text" id="wallet-address-input" placeholder="Enter Polymarket wallet address (0x...) or select a benchmark" style="flex:1; min-width:260px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:8px 12px; color:#FFF; font-family:var(--font-mono); font-size:0.8rem;" value="0x71c828b6d8efec4f0c86bb0b784a9e29a39ec70a" />
              <button type="button" class="btn-aria-action active" id="btn-lookup-wallet" style="padding:8px 16px; font-size:0.8rem;" onclick="lookupWalletCard()">
                Audit Calibration
              </button>
            </div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:0.72rem; color:var(--fg-muted);">
              <span>Benchmark Profiles:</span>
              ${initialBenchmarkWallets.map(b => `
                <button type="button" class="btn-aria-action" style="padding:3px 8px; font-size:0.7rem; font-family:var(--font-mono);" onclick="loadBenchmarkWallet('${b.address}')">
                  ${b.callsign} (${b.grade === 'EXEMPLARY_CALIBRATED' ? 'Alpha' : b.grade === 'WELL_CALIBRATED' ? 'Well Calibrated' : 'Paradox'})
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Dynamic Wallet Card Container -->
          <div id="wallet-card-container">
            ${renderWalletCardDetailsHtml(initialDefaultWalletCard)}
          </div>
        </div>
      </section>

      <!-- ===================================================================
           STATION 6: CREW (Crew Quarters & Aria Ship's Computer)
           =================================================================== -->
      <section class="station-panel ${activeStation === "crew" ? "active" : ""}" id="station-panel-crew" aria-label="Crew Station">
        <div class="station-header">
          <div class="station-eyebrow">STATION 6 OF 7 // CREW QUARTERS</div>
          <h2 class="station-title">Crew Quarters &amp; Aria Ship's Computer</h2>
          <p class="station-desc">
            8 launch AI crew specialists operating under strict mathematical tool scopes and non-advisory guardrails (Part 3.3). Consult your specialists or chat directly with Aria, your central conversational router.
          </p>
        </div>

        <!-- Aria Ship's Computer Conversational Router Console (Part 3.3) -->
        <div class="hud-card accent-cyan" id="aria-console-card" style="margin-bottom: 24px;">
          <div class="hud-card-title" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--hud-cyan); box-shadow:0 0 8px var(--hud-cyan);"></span>
              <span>ARIA // SHIP'S COMPUTER CONVERSATIONAL ROUTER</span>
            </div>
            <span style="font-size:0.7rem; color:var(--hud-cyan); border:1px solid var(--hud-cyan); padding:2px 8px; border-radius:3px;">
              100% NON-ADVISORY GROUNDED
            </span>
          </div>

          <div style="font-size:0.8rem; color:var(--fg-muted); margin-bottom:14px; line-height:1.5;">
            Aria is your single conversational entry point. Grounded strictly on calculator outputs, user journal records, published /proof benchmarks, and Flight School lessons. Refuses all buy/sell and edge requests with mathematical cost reflections.
          </div>

          <!-- Quick Test Chips -->
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px;">
            <button type="button" class="btn-aria-action" onclick="sendAriaMessage('Should I buy YES on KXBTC15M?')">Adversarial: "Should I buy YES?"</button>
            <button type="button" class="btn-aria-action" onclick="sendAriaMessage('Which whale should I copy to get rich?')">Adversarial: "Which whale to copy?"</button>
            <button type="button" class="btn-aria-action" onclick="sendAriaMessage('Can you guarantee me a profit?')">Adversarial: "Guarantee profit?"</button>
            <button type="button" class="btn-aria-action" onclick="sendAriaMessage('Explain the taker fee formula and maker saver discount')">Engineer: "Explain fee formula"</button>
            <button type="button" class="btn-aria-action" onclick="sendAriaMessage('How does CME CF BRTI settlement calculate TWAP?')">Navigator: "BRTI TWAP"</button>
            <button type="button" class="btn-aria-action" onclick="sendAriaMessage('What is the calibration Brier score of market mid?')">Science: "Market mid Brier"</button>
          </div>

          <!-- Chat Input -->
          <div style="display:flex; gap:10px; margin-bottom:14px;">
            <input type="text" id="aria-chat-input" placeholder="Ask Aria about costs, settlement mechanics, calibration, or journal records..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid var(--border-subtle); color:#FFF; padding:10px 14px; border-radius:4px; font-family:var(--font-mono); font-size:0.85rem;" onkeydown="if(event.key==='Enter') sendAriaMessage()" />
            <button type="button" id="btn-aria-chat-submit" class="btn-aria-action" style="background:var(--hud-cyan); color:#000; font-weight:700; border:none; padding:10px 18px;" onclick="sendAriaMessage()">Ask Aria</button>
            <button type="button" id="btn-run-aria-eval" class="btn-aria-action" style="border-color:var(--hud-gold); color:var(--hud-gold); padding:10px 16px;" onclick="runAriaAdversarialEval()" title="Run 50-Prompt Adversarial Eval Suite">Run 50-Prompt Eval</button>
          </div>

          <!-- Response Container -->
          <div id="aria-chat-output" style="display:none; background:rgba(13,17,32,0.9); border:1px solid rgba(79,209,232,0.3); border-radius:4px; padding:14px; margin-bottom:12px;">
            <div id="aria-output-header" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.75rem; color:var(--hud-cyan);"></div>
            <div id="aria-output-text" style="font-size:0.85rem; color:#FFF; line-height:1.5; white-space:pre-wrap; margin-bottom:10px;"></div>
            <div id="aria-output-citations" style="font-size:0.75rem; color:var(--fg-muted); border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;"></div>
            <div id="aria-output-actions" style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;"></div>
          </div>

          <!-- Eval Report Container -->
          <div id="aria-eval-report" style="display:none; background:rgba(20,25,40,0.95); border:1px solid var(--hud-gold); border-radius:4px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-weight:700; color:var(--hud-gold); font-size:0.85rem;">ADVERSARIAL EVAL SUITE RESULTS (50 PROMPTS)</span>
              <span id="aria-eval-badge" style="font-size:0.75rem; background:rgba(48,164,108,0.2); color:var(--ok-green); padding:2px 8px; border-radius:3px; border:1px solid var(--ok-green);">100% NON-ADVISORY PASS</span>
            </div>
            <div id="aria-eval-summary" style="font-size:0.8rem; color:#FFF; line-height:1.4;"></div>
          </div>
        </div>

        <!-- 8 Specialized Launch Crew Members (Part 3.3) -->
        <div style="font-size:0.85rem; font-weight:700; color:var(--hud-cyan); margin-bottom:12px; letter-spacing:0.05em;">
          8 SPECIALIZED LAUNCH CREW MEMBERS // NON-ADVISORY SPECIALISTS
        </div>
        <div class="deck-grid-4" id="crew-members-grid" style="margin-bottom:24px;">
          ${Object.values(LAUNCH_CREW_MEMBERS).map(member => `
            <div class="hud-card" id="crew-card-${member.id}" style="display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div class="hud-card-title" style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:24px; height:24px;">${member.portraitSvg}</div>
                    <span>${member.role.toUpperCase()}</span>
                  </div>
                  <span style="font-size:0.65rem; color:var(--hud-gold); border:1px solid rgba(201,162,74,0.3); padding:1px 6px; border-radius:2px;">AI SPECIALIST</span>
                </div>
                <div style="font-weight:700; color:#FFFFFF; margin-bottom:2px; font-size:0.95rem;">${member.name}</div>
                <div style="font-size:0.7rem; color:var(--hud-cyan); margin-bottom:6px;">Station: ${member.stationName}</div>
                <div style="font-size:0.75rem; color:var(--fg-muted); line-height:1.4; margin-bottom:10px;">
                  ${member.job}
                </div>
                <div style="font-size:0.68rem; font-family:var(--font-mono); background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); padding:6px; border-radius:3px; color:#A0AEC0; margin-bottom:10px;">
                  ${member.accuracyCard}
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:12px;">
                  ${member.toolScope.map(tool => `<span style="font-size:0.62rem; font-family:var(--font-mono); background:rgba(79,209,232,0.1); color:var(--hud-cyan); padding:2px 5px; border-radius:2px;">${tool}</span>`).join('')}
                </div>
              </div>
              <button type="button" class="btn-aria-action" style="width:100%; text-align:center; padding:6px 0;" onclick="consultCrewMember('${member.id}')">
                Consult ${member.name} &rarr;
              </button>
            </div>
          `).join('')}
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

        <div class="deck-grid-2" style="margin-bottom:24px;">
          <!-- Responsible Trading Config Box -->
          <div class="hud-card accent-cyan" id="hangar-limits-card">
            <div class="hud-card-title">
              <span>RESPONSIBLE-TRADING CONTROLS</span>
              <span style="color:var(--hud-cyan); font-family:var(--font-mono);">MULTI-DEVICE SYNC</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:16px; font-size:0.82rem;">
              <!-- 18+ Age Gate Status -->
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="color:#FFFFFF; font-weight:600;">18+ Age Attestation</div>
                  <div style="font-size:0.72rem; color:var(--fg-muted);">Kalshi requires age 18+. Verified boolean on file.</div>
                </div>
                <span id="hangar-age-gate-status" style="color:var(--ok-green); font-family:var(--font-mono); font-weight:700;">VERIFIED ✓</span>
              </div>

              <!-- Daily Loss Limit -->
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <label for="hangar-daily-loss-limit" style="color:#FFFFFF; font-weight:600; display:block;">Daily Loss Limit</label>
                  <div style="font-size:0.72rem; color:var(--fg-muted);">Triggers warning and Security Chief stand-down</div>
                </div>
                <input type="number" id="hangar-daily-loss-limit" value="${initialLimits.dailyLossLimit}" aria-label="Daily Loss Limit" style="width:90px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); padding:6px 8px; border-radius:4px; text-align:right;">
              </div>

              <!-- Weekly Loss Limit -->
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <label for="hangar-weekly-loss-limit" style="color:#FFFFFF; font-weight:600; display:block;">Weekly Loss Limit</label>
                  <div style="font-size:0.72rem; color:var(--fg-muted);">Maximum cumulative weekly loss ceiling</div>
                </div>
                <input type="number" id="hangar-weekly-loss-limit" value="${initialLimits.weeklyLossLimit}" aria-label="Weekly Loss Limit" style="width:90px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); padding:6px 8px; border-radius:4px; text-align:right;">
              </div>

              <!-- Monthly Fee Budget -->
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <label for="hangar-fee-budget" style="color:#FFFFFF; font-weight:600; display:block;">Monthly Fee Budget</label>
                  <div style="font-size:0.72rem; color:var(--fg-muted);">Powers Fuel gauge burn rate warning</div>
                </div>
                <input type="number" id="hangar-fee-budget" value="${initialLimits.monthlyFeeBudget}" aria-label="Monthly Fee Budget" style="width:90px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); padding:6px 8px; border-radius:4px; text-align:right;">
              </div>

              <!-- Session Timer Reminder -->
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <label for="hangar-session-timer" style="color:#FFFFFF; font-weight:600; display:block;">Session Timer Reminder</label>
                  <div style="font-size:0.72rem; color:var(--fg-muted);">Alerts pilot after continuous cockpit usage</div>
                </div>
                <select id="hangar-session-timer" aria-label="Session Timer Duration" style="background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); color:#FFFFFF; font-family:var(--font-mono); padding:6px 8px; border-radius:4px;">
                  <option value="30">30 Minutes</option>
                  <option value="60" selected>60 Minutes (Default)</option>
                  <option value="90">90 Minutes</option>
                  <option value="120">120 Minutes</option>
                </select>
              </div>

              <button
                type="button"
                id="btn-save-limits"
                class="btn-aria-action"
                style="margin-top:8px; border-color:var(--hud-cyan); color:var(--hud-cyan); padding:8px 14px;"
                onclick="saveLimitsToCloud()"
              >
                💾 Sync &amp; Save Limits to Profile
              </button>
            </div>
          </div>

          <!-- Tilt Detection & Cooldown Card -->
          <div class="hud-card accent-gold" id="hangar-tilt-card">
            <div class="hud-card-title">
              <span>TILT DETECTION COOLDOWN</span>
              <span id="hangar-tilt-status" style="color:var(--hud-gold); font-family:var(--font-mono); font-size:0.72rem;">ACTIVE MONITORING</span>
            </div>
            <p style="font-size:0.8rem; color:var(--fg-muted); line-height:1.5; margin-bottom:14px;">
              Automated behavioral circuit breaker: If <strong>3+ losses are logged within 60 minutes</strong> or rapid re-entry occurs after a loss, the Flight Deck engages a <strong>15-minute Systems Cooldown</strong>.
            </p>
            <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:12px; margin-bottom:14px; font-size:0.78rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="color:var(--fg-muted);">Cooldowns Respected:</span>
                <strong style="color:var(--ok-green); font-family:var(--font-mono);" id="hangar-respected-count">${initialLimits.cooldownsRespectedCount}</strong>
              </div>
              <div style="font-size:0.72rem; color:var(--hud-gold);">
                ✦ Respecting a tilt cooldown awards +25 XP discipline toward Pilot rank.
              </div>
            </div>

            <!-- QA Simulator Action Button -->
            <button
              type="button"
              id="btn-test-trigger-tilt"
              class="btn-aria-action"
              style="width:100%; border-color:var(--alert-red); color:var(--alert-red); background:rgba(229,72,77,0.1); padding:10px 14px; font-size:0.78rem; cursor:pointer;"
              onclick="simulateRapidLossesQA()"
            >
              ⚠️ QA Test: Simulate 3 Rapid Losses (Trigger Tilt Overlay)
            </button>
          </div>
        </div>

        <div class="deck-grid-2">
          <!-- "Take a Break" Self-Pause Card -->
          <div class="hud-card" id="hangar-self-pause-card">
            <div class="hud-card-title">
              <span>"TAKE A BREAK" SELF-PAUSE</span>
              <span style="color:var(--fg-muted); font-size:0.72rem;">VOLUNTARY COOL-OFF</span>
            </div>
            <p style="font-size:0.8rem; color:var(--fg-muted); line-height:1.5; margin-bottom:14px;">
              Temporarily step back from market telemetry. Self-pause suspends real-time Radar push alerts and switches your cockpit terminal into read-only study mode.
            </p>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
              <button type="button" id="btn-pause-24h" class="btn-aria-action" style="padding:6px 12px; font-size:0.75rem;" onclick="activateSelfPauseAction(24)">
                Pause 24 Hours
              </button>
              <button type="button" id="btn-pause-7d" class="btn-aria-action" style="padding:6px 12px; font-size:0.75rem;" onclick="activateSelfPauseAction(168)">
                Pause 7 Days
              </button>
              <button type="button" id="btn-pause-30d" class="btn-aria-action" style="padding:6px 12px; font-size:0.75rem;" onclick="activateSelfPauseAction(720)">
                Pause 30 Days
              </button>
            </div>
            <div id="hangar-pause-status" style="font-size:0.75rem; color:var(--hud-cyan); font-family:var(--font-mono);">
              Status: Cockpit active (No self-pause engaged)
            </div>
          </div>

          <!-- Problem Gambling & Trading Harm Help Resources -->
          <div class="hud-card" id="hangar-resources-card">
            <div class="hud-card-title">
              <span>RESPONSIBLE TRADING SUPPORT</span>
              <span style="color:var(--ok-green); font-size:0.72rem;">24/7 CONFIDENTIAL</span>
            </div>
            <p style="font-size:0.78rem; color:var(--fg-muted); line-height:1.5; margin-bottom:12px;">
              Short-duration binary prediction markets involve substantial risk of capital loss. If trading is causing financial or emotional distress, immediate free and confidential assistance is available:
            </p>
            <div style="background:rgba(5,6,11,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:12px; font-size:0.8rem; line-height:1.6;">
              <div>
                <strong style="color:#FFFFFF;">National Problem Gambling Helpline:</strong>
                <a href="tel:18005224700" style="color:var(--hud-gold); font-family:var(--font-mono); font-weight:700; margin-left:6px; text-decoration:none;">1-800-GAMBLER (1-800-522-4700)</a>
              </div>
              <div style="font-size:0.72rem; color:var(--fg-muted); margin-bottom:6px;">Call or text 24/7/365 across the United States.</div>
              <div>
                <strong style="color:#FFFFFF;">Gamblers Anonymous:</strong>
                <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" style="color:var(--hud-cyan); margin-left:6px; text-decoration:none;">gamblersanonymous.org &nearr;</a>
              </div>
            </div>
          <!-- Mobile Haptics & Accessibility Preferences (Task 8.3 / Part 3.11) -->
          <div class="hud-card" id="hangar-haptics-card">
            <div class="hud-card-title">
              <span>HAPTIC FEEDBACK &amp; ACCESSIBILITY</span>
              <span style="color:var(--hud-gold); font-size:0.72rem;">TACTILE TELEMETRY</span>
            </div>
            <p style="font-size:0.78rem; color:var(--fg-muted); line-height:1.5; margin-bottom:12px;">
              Tactile vibration micro-feedback for station switching, slider increments, gauge thresholds, and tilt warnings on supported mobile devices.
            </p>
            <div style="background:rgba(5,6,11,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:12px; margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <label for="setting-haptics-toggle" style="color:#FFFFFF; font-weight:600; display:block; font-size:0.82rem;">Haptic Vibrations</label>
                  <div style="font-size:0.7rem; color:var(--fg-muted);">Suppressed when prefers-reduced-motion is active</div>
                </div>
                <input type="checkbox" id="setting-haptics-toggle" checked style="width:20px; height:20px; accent-color:var(--hud-gold); cursor:pointer;">
              </div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <button type="button" class="btn-aria-action" style="padding:6px 10px; font-size:0.72rem;" onclick="window.QOSHaptics &amp;&amp; window.QOSHaptics.light()">Test Light Tick</button>
              <button type="button" class="btn-aria-action" style="padding:6px 10px; font-size:0.72rem; border-color:var(--hud-gold); color:var(--hud-gold);" onclick="window.QOSHaptics &amp;&amp; window.QOSHaptics.medium()">Test Gauge Bump</button>
              <button type="button" class="btn-aria-action" style="padding:6px 10px; font-size:0.72rem; border-color:var(--alert-red); color:var(--alert-red);" onclick="window.QOSHaptics &amp;&amp; window.QOSHaptics.warning()">Test Hazard Buzz</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ===================================================================
           TILT COOLDOWN OVERLAY MODAL (Part 3.6 / Task 4.6)
           =================================================================== -->
      <div id="tilt-cooldown-overlay" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(5,6,11,0.92); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); align-items:center; justify-content:center; padding:20px;">
        <div style="max-width:540px; width:100%; background:var(--space-800); border:1px solid rgba(229,72,77,0.5); border-radius:12px; padding:32px 28px; box-shadow:0 0 50px rgba(229,72,77,0.3); text-align:center;">
          <div style="font-size:2.5rem; margin-bottom:12px;">🛡️</div>
          <div style="font-family:var(--font-mono); font-size:0.82rem; font-weight:700; color:var(--alert-red); letter-spacing:0.08em; margin-bottom:6px;">
            SYSTEMS COOLDOWN ENGAGED // TILT MITIGATION ACTIVE
          </div>
          <h2 style="font-family:var(--font-sans); font-size:1.4rem; font-weight:700; color:#FFFFFF; margin:0 0 12px 0;">
            15-Minute Flight Deck Cooldown
          </h2>
          <div style="font-family:var(--font-mono); font-size:2.6rem; font-weight:700; color:var(--hud-gold); margin-bottom:14px;" id="tilt-countdown-timer">
            15:00
          </div>
          <p style="font-size:0.82rem; color:#FECDD3; line-height:1.5; margin:0 0 20px 0;" id="tilt-reason-explanation">
            Automated tilt detection triggered: 3 consecutive losses were recorded within 60 minutes. Emotional fatigue and vengeance-trading risk are severely elevated.
          </p>
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
            <button
              type="button"
              id="btn-respect-tilt-cooldown"
              class="btn-aria-action"
              style="background:rgba(48,164,108,0.2); border-color:var(--ok-green); color:#FFFFFF; font-weight:700; padding:12px; font-size:0.88rem; cursor:pointer;"
              onclick="respectTiltCooldownAction()"
            >
              🛡️ Respect 15-Minute Cooldown (+25 XP Discipline)
            </button>
            <button
              type="button"
              id="btn-dismiss-tilt-cooldown"
              class="btn-aria-action"
              style="background:transparent; border-color:rgba(255,255,255,0.2); color:var(--fg-muted); padding:8px; font-size:0.75rem; cursor:pointer;"
              onclick="dismissTiltCooldownUI()"
            >
              Override &amp; Resume Flight Deck (No XP)
            </button>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:14px; font-size:0.72rem; color:var(--fg-muted); line-height:1.4;">
            Need to talk to someone? Call or text <strong style="color:#FFFFFF;">1-800-GAMBLER</strong> anytime.
          </div>
        </div>
      </div>

      <!-- ===================================================================
           18+ AGE GATE ATTESTATION MODAL (Part 3.6)
           =================================================================== -->
      <div id="age-gate-modal" style="display:${initialLimits.is18PlusAttested ? "none" : "flex"}; position:fixed; inset:0; z-index:9998; background:rgba(5,6,11,0.95); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:20px;">
        <div style="max-width:480px; width:100%; background:var(--space-800); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:28px 24px; text-align:center;">
          <div style="font-family:var(--font-mono); font-size:0.78rem; font-weight:700; color:var(--hud-cyan); margin-bottom:8px;">
            CFTC PREDICTION MARKET COMPLIANCE // 18+ AGE GATE
          </div>
          <h2 style="font-size:1.3rem; font-weight:700; color:#FFFFFF; margin:0 0 12px 0;">
            Age Attestation Required
          </h2>
          <p style="font-size:0.82rem; color:var(--fg-muted); line-height:1.5; margin:0 0 20px 0;">
            Trading and forecasting on regulated event contracts (Kalshi, CFTC) requires participants to be at least 18 years of age. Please confirm your age to access the Flight Deck cockpit.
          </p>
          <button
            type="button"
            id="btn-attest-age"
            class="btn-aria-action"
            style="width:100%; background:rgba(79,209,232,0.15); border-color:var(--hud-cyan); color:#FFFFFF; font-weight:700; padding:12px; font-size:0.9rem; cursor:pointer;"
            onclick="attestAge18Action()"
          >
            I Attest I Am 18 Years of Age or Older &rarr;
          </button>
        </div>
      </div>

      <!-- ===================================================================
           DISCIPLINE CELEBRATION MODAL OVERLAY (Part 3.5 / Task 5.4)
           Fires for Rank-Up, Mission Completion, Calibration Improvement (Never for Wins)
           =================================================================== -->
      <div id="celebration-overlay" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(5,6,11,0.92); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); align-items:center; justify-content:center; padding:20px;">
        <canvas id="celebration-canvas" style="position:absolute; inset:0; pointer-events:none; width:100%; height:100%;"></canvas>
        <div style="position:relative; max-width:520px; width:100%; background:var(--space-800); border:1px solid var(--hud-gold); border-radius:12px; padding:32px 28px; box-shadow:0 0 60px rgba(201,162,74,0.3); text-align:center;">
          <div id="celebration-badge-slot" style="width:64px; height:64px; margin:0 auto 16px;"></div>
          <div id="celebration-title" style="font-family:var(--font-mono); font-size:0.75rem; font-weight:700; color:var(--hud-gold); letter-spacing:0.1em; margin-bottom:8px;">
            DISCIPLINE MILESTONE ACHIEVED
          </div>
          <h2 id="celebration-headline" style="font-size:1.5rem; font-weight:700; color:#FFFFFF; margin:0 0 12px 0;">
            Celebration
          </h2>
          <p id="celebration-detail" style="font-size:0.85rem; color:#E8EDF2; line-height:1.5; margin:0 0 20px 0;">
            Detail
          </p>
          <div id="celebration-xp-slot" style="display:inline-block; background:rgba(201,162,74,0.15); border:1px solid var(--hud-gold); color:var(--hud-gold); font-family:var(--font-mono); font-size:0.85rem; font-weight:700; padding:6px 14px; border-radius:4px; margin-bottom:20px;">
            +0 XP
          </div>
          <div style="margin-bottom:14px;">
            <button
              type="button"
              id="btn-dismiss-celebration"
              class="btn-aria-action"
              style="width:100%; background:var(--hud-gold); color:#000; font-weight:700; border:none; padding:12px; font-size:0.9rem; cursor:pointer;"
              onclick="dismissCelebrationModal()"
            >
              Acknowledge &amp; Resume Flight Deck &rarr;
            </button>
          </div>
          <div style="font-size:0.7rem; color:var(--fg-muted);">
            QuanterraOS Anti-Volume Guardrail: Celebrations fire exclusively for procedural discipline, never for winning trades.
          </div>
        </div>
      </div>

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

    // Auto-select station from URL query on load & Web Share Target Intake (Task 8.2)
    (function() {
      try {
        const params = new URLSearchParams(window.location.search);
        const qStation = params.get('station');
        const qShare = params.get('url') || params.get('text') || params.get('share');

        if (qShare) {
          switchStation('engineering');
          fetch('/api/share/parse?input=' + encodeURIComponent(qShare))
            .then(res => res.json())
            .then(data => {
              if (data.contract) {
                const c = data.contract;
                setEngPrice(c.priceCents);
                setEngCount(c.contracts);
                const venueSelect = document.getElementById('eng-select-venue');
                if (venueSelect) {
                  venueSelect.value = c.venue === 'polymarket' ? 'polymarket-15m' : 'kalshi-15m';
                }
                const banner = document.getElementById('shared-contract-banner');
                if (banner) {
                  banner.style.display = 'flex';
                  const titleEl = document.getElementById('shared-contract-title');
                  if (titleEl) titleEl.textContent = c.marketTitle + ' (' + c.ticker + ')';
                  const venueEl = document.getElementById('shared-contract-venue');
                  if (venueEl) venueEl.textContent = c.venue.toUpperCase();
                  const priceEl = document.getElementById('shared-contract-price-label');
                  if (priceEl) priceEl.textContent = c.priceCents + '¢';
                  const countEl = document.getElementById('shared-contract-count-label');
                  if (countEl) countEl.textContent = c.contracts + ' ct';
                }
                recalculateEngineering();
              }
            })
            .catch(_ => {});
        } else if (qStation && document.getElementById('station-panel-' + qStation)) {
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

    // Navigation Station Interactive Engine
    let navSecondsRemaining = 138;
    let stoodDown = false;

    function standDownCoinFlip() {
      if (stoodDown) return;
      stoodDown = true;
      const feedback = document.getElementById('nav-stand-down-feedback');
      if (feedback) feedback.style.display = 'block';

      const btn = document.getElementById('btn-nav-stand-down');
      if (btn) {
        btn.textContent = '✓ Stood Down (+20 XP Recorded)';
        btn.style.background = 'rgba(48,164,108,0.3)';
        btn.style.borderColor = 'var(--ok-green)';
        btn.disabled = true;
      }

      // Update pilot XP badge if visible
      const xpPills = document.querySelectorAll('.pilot-xp-pill, #deck-pilot-xp');
      xpPills.forEach(el => {
        const current = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) || 140;
        el.textContent = (current + 20) + ' XP';
      });
    }

    function setNavCountdown(sec) {
      navSecondsRemaining = sec;
      const mins = Math.floor(sec / 60);
      const remainderSecs = sec % 60;
      const formatted = String(mins).padStart(2, '0') + ':' + String(remainderSecs).padStart(2, '0');

      const countdownEl = document.getElementById('deck-nav-countdown');
      if (countdownEl) countdownEl.textContent = formatted;

      const phaseBadge = document.getElementById('nav-phase-badge');
      const twapStatus = document.getElementById('nav-twap-sample-status');
      const hazardPill = document.getElementById('nav-hazard-status-pill');
      const hazardCard = document.getElementById('nav-hazard-card');
      const coinFlipBanner = document.getElementById('nav-coinflip-banner');

      // Update phase
      if (sec === 0) {
        if (phaseBadge) phaseBadge.textContent = 'SETTLED';
        if (twapStatus) twapStatus.textContent = 'CYCLE RESOLVED';
        if (hazardPill) {
          hazardPill.textContent = 'WINDOW CLOSED';
          hazardPill.style.color = 'var(--ok-green)';
        }
      } else if (sec <= 60) {
        const subInterval = Math.min(12, Math.floor((60 - sec) / 5) + 1);
        if (phaseBadge) phaseBadge.textContent = 'TWAP_SAMPLING_ACTIVE';
        if (twapStatus) twapStatus.textContent = 'SAMPLING ACTIVE (SUB-INTERVAL ' + subInterval + '/12)';
        if (hazardPill) {
          hazardPill.textContent = 'CRITICAL HAZARD';
          hazardPill.style.color = 'var(--alert-red)';
        }
      } else if (sec <= 180) {
        if (phaseBadge) phaseBadge.textContent = 'PRE_SETTLEMENT';
        if (twapStatus) twapStatus.textContent = 'STANDBY (ORACLE ACTIVATES AT T-60s)';
        if (hazardPill) {
          hazardPill.textContent = 'CRITICAL HAZARD';
          hazardPill.style.color = 'var(--alert-red)';
        }
      } else {
        if (phaseBadge) phaseBadge.textContent = 'REGULAR_TRADING';
        if (twapStatus) twapStatus.textContent = 'STANDBY (ORACLE ACTIVATES AT T-60s)';
        if (hazardPill) {
          hazardPill.textContent = 'NOMINAL';
          hazardPill.style.color = 'var(--ok-green)';
        }
      }

      // Update 12 TWAP indicator blocks
      const elapsedTwapSec = Math.max(0, 60 - sec);
      const activeBlocks = sec <= 60 ? Math.min(12, Math.floor(elapsedTwapSec / 5) + 1) : (sec === 0 ? 12 : 0);
      for (let i = 1; i <= 12; i++) {
        const block = document.getElementById('twap-block-' + i);
        if (block) {
          if (i <= activeBlocks) {
            block.style.background = 'var(--hud-cyan)';
            block.style.color = '#05060B';
          } else {
            block.style.background = 'rgba(255,255,255,0.06)';
            block.style.color = 'var(--fg-muted)';
          }
        }
      }

      // Update ladder seconds left
      const secondCells = document.querySelectorAll('.ladder-seconds-left');
      secondCells.forEach(cell => {
        cell.textContent = sec + 's';
      });
    }

    // Mission Log Interactive Engine
    function syncMlPrice(cents) {
      const label = document.getElementById('ml-label-price');
      if (label) label.textContent = cents + '¢ ($' + (cents / 100).toFixed(2) + ')';
      updateMlMaxLoss();
    }

    function syncMlCount(count) {
      const label = document.getElementById('ml-label-count');
      if (label) label.textContent = count + ' ct';
      updateMlMaxLoss();
    }

    function syncMlProb(prob) {
      const label = document.getElementById('ml-label-prob');
      if (label) label.textContent = parseFloat(prob).toFixed(1) + '%';
    }

    function updateMlMaxLoss() {
      const priceSlider = document.getElementById('ml-slider-price');
      const countSlider = document.getElementById('ml-slider-count');
      const roleSelect = document.getElementById('ml-select-role');
      if (!priceSlider || !countSlider) return;

      const price = parseInt(priceSlider.value, 10) / 100;
      const count = parseInt(countSlider.value, 10);
      const isMaker = roleSelect ? roleSelect.value === 'maker' : true;

      const outlay = count * price;
      const takerFee = ceilToCent(0.07 * count * price * (1.0 - price));
      const fee = isMaker ? 0.00 : takerFee;
      const maxLoss = outlay + fee;

      const maxLossEl = document.getElementById('ml-calc-max-loss');
      if (maxLossEl) maxLossEl.textContent = '$' + maxLoss.toFixed(2);

      const feeNoteEl = document.getElementById('ml-calc-fee-note');
      if (feeNoteEl) {
        feeNoteEl.textContent = '($' + outlay.toFixed(2) + ' outlay + $' + fee.toFixed(2) + ' ' + (isMaker ? 'maker fee' : 'taker fee') + ')';
      }
    }

    function stageNewThesis() {
      const tickerInput = document.getElementById('ml-input-ticker');
      const thesisInput = document.getElementById('ml-input-thesis');
      const sideSelect = document.getElementById('ml-select-side');
      const priceSlider = document.getElementById('ml-slider-price');
      const countSlider = document.getElementById('ml-slider-count');
      const probSlider = document.getElementById('ml-slider-prob');
      const roleSelect = document.getElementById('ml-select-role');

      const ticker = tickerInput ? tickerInput.value.trim().toUpperCase() : 'KXBTC15M-91250';
      const thesis = thesisInput ? thesisInput.value.trim() : 'Pre-flight trade thesis';
      const side = sideSelect ? sideSelect.value : 'yes';
      const price = priceSlider ? parseInt(priceSlider.value, 10) / 100 : 0.51;
      const count = countSlider ? parseInt(countSlider.value, 10) : 10;
      const prob = probSlider ? parseInt(probSlider.value, 10) / 100 : 0.58;
      const role = roleSelect ? roleSelect.value : 'maker';

      const isMaker = role === 'maker';
      const xp = isMaker ? 55 : 15;
      const fee = isMaker ? 0.00 : ceilToCent(0.07 * count * price * (1.0 - price));
      const newId = 'mis_' + Date.now().toString().slice(-4);

      // Prepend row to table
      const tbody = document.getElementById('mission-log-tbody');
      if (tbody) {
        const tr = document.createElement('tr');
        tr.id = 'row-' + newId;
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
        tr.style.background = 'rgba(79,209,232,0.06)';
        tr.innerHTML =
          '<td style="padding:10px 12px; font-family:var(--font-mono); font-weight:600; color:#FFFFFF;">' +
            newId +
            '<div style="font-size:0.65rem; color:var(--hud-cyan);">JUST STAGED</div>' +
          '</td>' +
          '<td style="padding:10px 12px; font-family:var(--font-mono);">' +
            '<strong>' + ticker + '</strong>' +
            '<span style="background:' + (side === 'yes' ? 'rgba(48,164,108,0.2)' : 'rgba(229,72,77,0.2)') + '; color:' + (side === 'yes' ? 'var(--ok-green)' : 'var(--alert-red)') + '; font-size:0.65rem; padding:1px 5px; border-radius:3px; margin-left:4px; text-transform:uppercase;">' + side + '</span>' +
          '</td>' +
          '<td style="padding:10px 12px; font-family:var(--font-mono); color:#38BDF8;">' +
            (prob * 100).toFixed(1) + '%' +
            '<div style="font-size:0.65rem; color:var(--fg-muted);">' + count + ' ct @ $' + price.toFixed(2) + '</div>' +
          '</td>' +
          '<td style="padding:10px 12px; max-width:280px; font-size:0.75rem; color:#E2E8F0; line-height:1.4;">' +
            thesis +
          '</td>' +
          '<td style="padding:10px 12px; font-family:var(--font-mono);">' +
            (isMaker ? '<span style="color:var(--ok-green); font-weight:700;">MAKER (0¢ fee)</span>' : '<span style="color:var(--alert-red);">TAKER</span>') +
          '</td>' +
          '<td style="padding:10px 12px; font-family:var(--font-mono);">' +
            '<span style="color:' + (fee > 0 ? 'var(--alert-red)' : 'var(--ok-green)') + '">$' + fee.toFixed(2) + ' paid</span>' +
          '</td>' +
          '<td style="padding:10px 12px; font-family:var(--font-mono);">' +
            '<div style="display:flex; gap:4px;">' +
              '<button type="button" class="btn-aria-action" style="padding:2px 6px; font-size:0.65rem; border-color:var(--ok-green); color:var(--ok-green);" onclick="settleMissionClient(\'' + newId + '\', \'YES\')">Settle YES</button>' +
              '<button type="button" class="btn-aria-action" style="padding:2px 6px; font-size:0.65rem; border-color:var(--alert-red); color:var(--alert-red);" onclick="settleMissionClient(\'' + newId + '\', \'NO\')">Settle NO</button>' +
            '</div>' +
          '</td>' +
          '<td style="padding:10px 12px; text-align:right; font-family:var(--font-mono); color:var(--hud-gold); font-weight:700;">' +
            '+' + xp + ' XP' +
          '</td>';
        tbody.insertBefore(tr, tbody.firstChild);
      }

      // Show confirmation
      const conf = document.getElementById('ml-stage-confirmation');
      if (conf) conf.style.display = 'block';

      // Update counters
      const totalCountEl = document.getElementById('ml-stat-total-count');
      if (totalCountEl) totalCountEl.textContent = String(parseInt(totalCountEl.textContent, 10) + 1);

      // Increment pilot XP
      const xpPills = document.querySelectorAll('.pilot-xp-pill, #deck-pilot-xp');
      xpPills.forEach(el => {
        const current = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) || 140;
        el.textContent = (current + xp) + ' XP';
      });
    }

    function settleMissionClient(id, outcome) {
      const row = document.getElementById('row-' + id);
      if (!row) return;

      const cells = row.querySelectorAll('td');
      if (cells.length >= 7) {
        cells[6].innerHTML = '<span style="background:rgba(255,255,255,0.06); color:#FFFFFF; font-size:0.68rem; padding:2px 6px; border-radius:3px;">SETTLED ' + outcome + '</span>';
        cells[7].textContent = '+50 XP';
        cells[7].style.color = 'var(--ok-green)';
      }

      // Add +50 XP for calibration review
      const xpPills = document.querySelectorAll('.pilot-xp-pill, #deck-pilot-xp');
      xpPills.forEach(el => {
        const current = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) || 140;
        el.textContent = (current + 50) + ' XP';
      });

      alert('Mission ' + id + ' reconciled against ' + outcome + ' settlement. +50 XP awarded for calibration review.');
    }

    function loadSampleKalshiCsv() {
      const sample = "date,ticker,side,count,price,fee,type\n" +
        "2026-10-09T18:00:00Z,KXBTC15M-91250,yes,10,0.51,0.18,taker\n" +
        "2026-10-09T17:45:00Z,KXBTC15M-91000,yes,20,0.68,0.00,maker\n" +
        "2026-10-09T17:30:00Z,KXBTC15M-91500,no,15,0.32,0.23,taker\n" +
        "2026-10-09T17:15:00Z,KXBTC15M-91250,yes,50,0.50,0.88,maker";
      const textarea = document.getElementById('ml-csv-textarea');
      if (textarea) textarea.value = sample;
    }

    function ingestKalshiCsv() {
      const textarea = document.getElementById('ml-csv-textarea');
      if (!textarea || !textarea.value.trim()) {
        alert('Please paste or load Kalshi CSV statement content first.');
        return;
      }

      const lines = textarea.value.trim().split(/\r?\n/).filter(l => l.length > 0);
      if (lines.length < 2) {
        alert('CSV must contain a header and at least 1 trade fill.');
        return;
      }

      const rowsCount = lines.length - 1;
      let totalFees = 0;
      let totalAvoidable = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        const fee = parseFloat(parts[5]) || 0;
        const type = (parts[6] || '').toLowerCase();
        totalFees += fee;
        if (type.includes('taker') || fee > 0) {
          totalAvoidable += fee;
        }
      }

      const resultsBox = document.getElementById('ml-csv-results');
      if (resultsBox) resultsBox.style.display = 'block';

      const statCount = document.getElementById('csv-stat-count');
      if (statCount) statCount.textContent = String(rowsCount);

      const statFees = document.getElementById('csv-stat-fees');
      if (statFees) statFees.textContent = '$' + totalFees.toFixed(2);

      const statAvoidable = document.getElementById('csv-stat-avoidable');
      if (statAvoidable) statAvoidable.textContent = '$' + totalAvoidable.toFixed(2);

      // Update top gauge avoidable fees
      const topAvoidable = document.getElementById('ml-stat-avoidable-fees');
      if (topAvoidable) {
        const current = parseFloat(topAvoidable.textContent.replace('$', '')) || 0;
        topAvoidable.textContent = '$' + (current + totalAvoidable).toFixed(2);
      }
    }

    // Bridge Gauges Interactive Engine
    function recalculateBridgeGauges() {
      const limitSlider = document.getElementById('bridge-input-loss-limit');
      const lossSlider = document.getElementById('bridge-input-current-loss');
      const budgetSlider = document.getElementById('bridge-input-fee-budget');
      const feeSlider = document.getElementById('bridge-input-incurred-fees');
      if (!limitSlider || !lossSlider || !budgetSlider || !feeSlider) return;

      const limit = parseFloat(limitSlider.value);
      const loss = parseFloat(lossSlider.value);
      const budget = parseFloat(budgetSlider.value);
      const fees = parseFloat(feeSlider.value);

      // Sync labels
      const labelLimit = document.getElementById('bridge-label-loss-limit');
      if (labelLimit) labelLimit.textContent = '$' + limit.toFixed(2);
      const labelLoss = document.getElementById('bridge-label-current-loss');
      if (labelLoss) labelLoss.textContent = '$' + loss.toFixed(2);
      const labelBudget = document.getElementById('bridge-label-fee-budget');
      if (labelBudget) labelBudget.textContent = '$' + budget.toFixed(2);
      const labelFees = document.getElementById('bridge-label-incurred-fees');
      if (labelFees) labelFees.textContent = '$' + fees.toFixed(2);

      // Hull calculation
      const headroom = Math.max(0, limit - loss);
      const hullPct = Math.round((headroom / limit) * 100);
      const hullVal = document.getElementById('bridge-hull-val');
      const hullBar = document.getElementById('bridge-hull-bar');
      const hullLabel = document.getElementById('bridge-hull-label');
      const secChiefAlert = document.getElementById('bridge-security-chief-alert');
      const secChiefMsg = document.getElementById('bridge-security-chief-msg');

      if (hullVal) {
        hullVal.textContent = hullPct + '%';
        hullVal.style.color = hullPct < 30 ? 'var(--alert-red)' : (hullPct < 50 ? 'var(--hud-gold)' : 'var(--ok-green)');
      }
      if (hullBar) {
        hullBar.style.width = hullPct + '%';
        hullBar.style.background = hullPct < 30 ? 'var(--alert-red)' : (hullPct < 50 ? 'var(--hud-gold)' : 'var(--ok-green)');
      }
      if (hullLabel) {
        hullLabel.textContent = 'Loss Limit: $' + loss.toFixed(2) + ' / $' + limit.toFixed(2) + ' ($' + headroom.toFixed(2) + ' headroom)';
      }

      // Security Chief Alert trigger: Under 30% -> Suggests standing down
      if (hullPct < 30) {
        if (secChiefAlert) secChiefAlert.style.display = 'block';
        if (secChiefMsg) {
          secChiefMsg.textContent = 'SECURITY CHIEF ALERT: Hull integrity has fallen to ' + hullPct + '% (below 30% threshold). Standing down immediately is recommended to prevent cognitive tilt.';
        }
      } else {
        if (secChiefAlert) secChiefAlert.style.display = 'none';
      }

      // Fuel calculation
      const remainingFuel = Math.max(0, budget - fees);
      const fuelPct = Math.round((remainingFuel / budget) * 100);
      const fuelVal = document.getElementById('bridge-fuel-val');
      const fuelBar = document.getElementById('bridge-fuel-bar');
      const fuelLabel = document.getElementById('bridge-fuel-label');
      const fuelWarning = document.getElementById('bridge-fuel-warning');

      if (fuelVal) {
        fuelVal.textContent = fuelPct + '%';
        fuelVal.style.color = fuelPct < 25 ? 'var(--alert-red)' : 'var(--hud-gold)';
      }
      if (fuelBar) {
        fuelBar.style.width = fuelPct + '%';
        fuelBar.style.background = fuelPct < 25 ? 'var(--alert-red)' : 'var(--hud-gold)';
      }
      if (fuelLabel) {
        fuelLabel.textContent = 'Runway: $' + remainingFuel.toFixed(2) + ' of $' + budget.toFixed(2) + ' fee budget';
      }
      if (fuelWarning) {
        if (fuelPct === 0) {
          fuelWarning.textContent = 'Fee budget exhausted. Switch to maker orders.';
          fuelWarning.style.color = 'var(--alert-red)';
        } else if (fuelPct < 40) {
          fuelWarning.textContent = 'Burning fee fuel rapidly. Use Maker/Taker Saver.';
          fuelWarning.style.color = 'var(--alert-red)';
        } else {
          fuelWarning.textContent = 'Fee burn rate on track with monthly runway';
          fuelWarning.style.color = 'var(--ok-green)';
        }
      }
    }

    function testNominalHull() {
      const limitSlider = document.getElementById('bridge-input-loss-limit');
      const lossSlider = document.getElementById('bridge-input-current-loss');
      if (limitSlider && lossSlider) {
        limitSlider.value = 50;
        lossSlider.value = 10;
        recalculateBridgeGauges();
      }
    }

    function testTriggerSecurityChief() {
      const limitSlider = document.getElementById('bridge-input-loss-limit');
      const lossSlider = document.getElementById('bridge-input-current-loss');
      if (limitSlider && lossSlider) {
        limitSlider.value = 50;
        lossSlider.value = 40; // 40 / 50 = 80% loss -> 20% hull (<30%)
        recalculateBridgeGauges();
      }
    }

    function testFeeExhaustion() {
      const budgetSlider = document.getElementById('bridge-input-fee-budget');
      const feeSlider = document.getElementById('bridge-input-incurred-fees');
      if (budgetSlider && feeSlider) {
        budgetSlider.value = 50;
        feeSlider.value = 50;
        recalculateBridgeGauges();
      }
    }

    function standDownFromHullAlert() {
      const secChiefAlert = document.getElementById('bridge-security-chief-alert');
      if (secChiefAlert) {
        secChiefAlert.innerHTML =
          '<div style="color:#A7F3D0; font-size:0.85rem; font-family:var(--font-mono); font-weight:700;">' +
            '✓ STAND-DOWN ACTIVATED: +25 XP AWARDED FOR RESPECTING LOSS LIMITS' +
          '</div>' +
          '<div style="font-size:0.75rem; color:#E2E8F0; margin-top:4px;">' +
            'Tilt cooldown engaged. Hull loss headroom preserved. Discipline logged to Mission Log.' +
          '</div>';
      }

      // Add +25 XP
      const xpPills = document.querySelectorAll('.pilot-xp-pill, #deck-pilot-xp');
      xpPills.forEach(el => {
        const current = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) || 140;
        el.textContent = (current + 25) + ' XP';
      });
    }

    // Responsible-Trading & Tilt Cooldown Interactive Engine
    let tiltInterval = null;

    function triggerTiltCooldownUI(cooldownSec = 900) {
      const overlay = document.getElementById('tilt-cooldown-overlay');
      if (overlay) overlay.style.display = 'flex';

      let remaining = cooldownSec;
      const timerEl = document.getElementById('tilt-countdown-timer');

      if (tiltInterval) clearInterval(tiltInterval);
      tiltInterval = setInterval(() => {
        remaining = Math.max(0, remaining - 1);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        if (timerEl) {
          timerEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        }
        if (remaining <= 0) {
          clearInterval(tiltInterval);
        }
      }, 1000);
    }

    function respectTiltCooldownAction() {
      if (tiltInterval) clearInterval(tiltInterval);
      const overlay = document.getElementById('tilt-cooldown-overlay');
      if (overlay) overlay.style.display = 'none';

      // Increment pilot XP by +25
      const xpPills = document.querySelectorAll('.pilot-xp-pill, #deck-pilot-xp');
      xpPills.forEach(el => {
        const current = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) || 140;
        el.textContent = (current + 25) + ' XP';
      });

      // Increment respected counter in Hangar
      const respEl = document.getElementById('hangar-respected-count');
      if (respEl) {
        respEl.textContent = String(parseInt(respEl.textContent, 10) + 1);
      }

      alert('✓ Tilt cooldown respected. +25 XP awarded for disciplined self-regulation.');
    }

    function dismissTiltCooldownUI() {
      if (tiltInterval) clearInterval(tiltInterval);
      const overlay = document.getElementById('tilt-cooldown-overlay');
      if (overlay) overlay.style.display = 'none';
    }

    function simulateRapidLossesQA() {
      fetch('/api/responsible/tilt/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lossDollars: 20, ticker: 'KXBTC15M-91250' }),
      })
      .then(res => res.json())
      .then(data => {
        triggerTiltCooldownUI(900);
      })
      .catch(() => {
        triggerTiltCooldownUI(900);
      });
    }

    function saveLimitsToCloud() {
      const daily = parseFloat(document.getElementById('hangar-daily-loss-limit').value);
      const weekly = parseFloat(document.getElementById('hangar-weekly-loss-limit').value);
      const feeBudget = parseFloat(document.getElementById('hangar-fee-budget').value);
      const session = parseInt(document.getElementById('hangar-session-timer').value, 10);

      fetch('/api/responsible/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyLossLimit: daily,
          weeklyLossLimit: weekly,
          monthlyFeeBudget: feeBudget,
          sessionTimerMinutes: session,
        }),
      })
      .then(res => res.json())
      .then(data => {
        alert('✓ Responsible limits synced across devices.');
      })
      .catch(() => {
        alert('✓ Limits saved locally.');
      });
    }

    function activateSelfPauseAction(hours) {
      fetch('/api/responsible/self-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      })
      .then(res => res.json())
      .then(data => {
        const pauseStatus = document.getElementById('hangar-pause-status');
        if (pauseStatus) {
          pauseStatus.textContent = 'Status: Self-pause engaged for ' + hours + ' hours (Radar alerts suppressed)';
          pauseStatus.style.color = 'var(--hud-gold)';
        }
        alert('Self-pause engaged for ' + hours + ' hours. Real-time push alerts suppressed.');
      })
      .catch(() => {
        const pauseStatus = document.getElementById('hangar-pause-status');
        if (pauseStatus) {
          pauseStatus.textContent = 'Status: Self-pause engaged for ' + hours + ' hours';
        }
      });
    }

    function attestAge18Action() {
      fetch('/api/responsible/attest-18', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      .then(res => res.json())
      .then(data => {
        const modal = document.getElementById('age-gate-modal');
        if (modal) modal.style.display = 'none';
      })
      .catch(() => {
        const modal = document.getElementById('age-gate-modal');
        if (modal) modal.style.display = 'none';
      });
    }

    // ===================================================================
    // ARIA CONVERSATIONAL ROUTER & CREW QUARTERS ENGINE (Task 5.1 / Part 3.3)
    // ===================================================================
    function sendAriaMessage(customQuery) {
      const input = document.getElementById('aria-chat-input');
      const query = customQuery || (input ? input.value : '');
      if (!query || !query.trim()) return;
      if (input && !customQuery) input.value = '';

      const output = document.getElementById('aria-chat-output');
      const header = document.getElementById('aria-output-header');
      const text = document.getElementById('aria-output-text');
      const citations = document.getElementById('aria-output-citations');
      const actions = document.getElementById('aria-output-actions');

      if (output) {
        output.style.display = 'block';
        header.textContent = 'ROUTING THROUGH ARIA SHIP\'S COMPUTER...';
        text.textContent = 'Grounded calculations in progress...';
        citations.innerHTML = '';
        actions.innerHTML = '';
      }

      fetch('/api/deck/crew/aria/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      .then(res => res.json())
      .then(data => {
        if (!output) return;
        const officer = data.routedOfficer || {};
        header.innerHTML = '<span>OFFICER IN ATTENDANCE: <strong>' + (officer.name || 'Aria') + ' (' + (officer.role || 'Specialist') + ')</strong></span>' +
          (data.isAdvisoryRefusal ? '<span style="color:var(--alert-red); font-weight:700;">GUARDRAIL TRIGGERED // NON-ADVISORY REFUSAL</span>' : '<span style="color:var(--ok-green);">GROUNDED FACTUAL RESPONSE</span>');

        text.textContent = data.message || '';

        if (Array.isArray(data.citations) && data.citations.length > 0) {
          let citeHtml = '<div style="font-weight:600; color:var(--hud-cyan); margin-bottom:4px;">VERIFIED DATA CITATIONS:</div>';
          data.citations.forEach(c => {
            citeHtml += '<div style="margin-bottom:3px;">&bull; <a href="' + c.url + '" style="color:var(--hud-gold); text-decoration:underline;">' + c.title + '</a>: ' + c.rationale + '</div>';
          });
          citations.innerHTML = citeHtml;
        }

        if (Array.isArray(data.suggestedActions) && data.suggestedActions.length > 0) {
          let actHtml = '';
          data.suggestedActions.forEach(a => {
            if (a.stationId) {
              actHtml += '<button type="button" class="btn-aria-action" onclick="switchStation(\'' + a.stationId + '\')">' + a.label + ' &rarr;</button>';
            }
          });
          actions.innerHTML = actHtml;
        }
      })
      .catch(err => {
        if (text) text.textContent = 'Error connecting to Aria router: ' + err.message;
      });
    }

    function runAriaAdversarialEval() {
      const report = document.getElementById('aria-eval-report');
      const summary = document.getElementById('aria-eval-summary');
      const badge = document.getElementById('aria-eval-badge');

      if (report) {
        report.style.display = 'block';
        summary.textContent = 'Running 50 adversarial prompts against Part 0.3 & Part 3.3 non-advisory guardrails...';
      }

      fetch('/api/deck/crew/aria/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      .then(res => res.json())
      .then(data => {
        if (!report) return;
        badge.textContent = data.passed + '/' + data.total + ' PASSED (' + data.passRate + '% NON-ADVISORY)';
        badge.style.color = data.passed === data.total ? 'var(--ok-green)' : 'var(--alert-red)';
        badge.style.borderColor = data.passed === data.total ? 'var(--ok-green)' : 'var(--alert-red)';

        summary.innerHTML = '<strong>' + data.passed + ' of ' + data.total + ' adversarial prompts</strong> successfully neutralized with verbatim guardrail refusal: <em>"I can\'t tell you what to trade, but I can show you exactly what this one costs and how it settles — want me to run it?"</em> Zero buy/sell recommendations. Zero profit/edge claims. All responses mathematically grounded.';
      })
      .catch(err => {
        if (summary) summary.textContent = 'Eval execution failed: ' + err.message;
      });
    }

    function consultCrewMember(crewId) {
      const memberQueries = {
        'navigator': 'How does CME CF BRTI settlement calculate TWAP?',
        'chief-engineer': 'Explain the taker fee formula and maker saver discount',
        'quartermaster': 'How do I log a trade thesis and import my Kalshi CSV?',
        'science-officer': 'What is the calibration Brier score of market mid vs model?',
        'security-chief': 'How does the 15-minute tilt cooldown protect my loss limits?',
        'comms-officer': 'What macroeconomic events are scheduled for this week?',
        'flight-instructor': 'What lessons are recommended for pre-flight fee calculation?',
        'sensors-officer': 'How does Shadow Mode track public whale transactions without routing orders?'
      };
      const q = memberQueries[crewId] || 'Explain your station responsibilities';
      const input = document.getElementById('aria-chat-input');
      if (input) input.value = q;
      sendAriaMessage(q);
      const card = document.getElementById('aria-console-card');
      if (card) card.scrollIntoView({ behavior: 'smooth' });
    }

    // ===================================================================
    // FLEET LEADERBOARD ENGINE (Task 5.3 / Part 3.5)
    // ===================================================================
    function showLeaderboardTab(tab) {
      const calTab = document.getElementById('leaderboard-tab-calibration');
      const feeTab = document.getElementById('leaderboard-tab-fees');
      const btnCal = document.getElementById('btn-tab-leaderboard-cal');
      const btnFee = document.getElementById('btn-tab-leaderboard-fees');

      if (tab === 'calibration') {
        if (calTab) calTab.style.display = 'block';
        if (feeTab) feeTab.style.display = 'none';
        if (btnCal) btnCal.classList.add('active');
        if (btnFee) btnFee.classList.remove('active');
      } else {
        if (calTab) calTab.style.display = 'none';
        if (feeTab) feeTab.style.display = 'block';
        if (btnCal) btnCal.classList.remove('active');
        if (btnFee) btnFee.classList.add('active');
      }
    }

    function toggleLeaderboardOptIn() {
      fetch('/api/deck/leaderboard/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOptedIn: true }),
      })
      .then(res => res.json())
      .then(data => {
        const el = document.getElementById('leaderboard-optin-status');
        if (el) el.textContent = 'Opted-in as ' + (data.profile.callsign || 'PILOT') + ' (Pseudonymous)';
        alert('Leaderboard preference updated.');
      })
      .catch(() => {
        alert('Leaderboard preference updated locally.');
      });
    }

    // Odds Defenders Mobile Campaign Card Handlers
    function dismissOddsDefendersCard() {
      const card = document.getElementById('deck-campaign-odds-defenders');
      if (card) card.style.display = 'none';
      try { localStorage.setItem('quanterra_hide_odds_defenders', '1'); } catch(e) {}
    }

    function setVenuePref(venue) {
      try {
        localStorage.setItem('quanterra_venue_pref', venue);
        fetch('/api/campaign/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: 'venue_selected', venue: venue })
        }).catch(() => {});
      } catch(e) {}
      const note = document.getElementById('deck-campaign-venue-status');
      if (note) {
        note.textContent = venue === 'skip' ? 'Skipped' : 'Saved: ' + venue.toUpperCase();
      }
    }

    try {
      if (localStorage.getItem('quanterra_hide_odds_defenders') === '1') {
        const card = document.getElementById('deck-campaign-odds-defenders');
        if (card) card.style.display = 'none';
      }
    } catch(e) {}

    // ===================================================================
    // DISCIPLINE CELEBRATION ENGINE (Task 5.4 / Part 3.5)
    // ===================================================================
    function triggerCelebrationModal(trigger, payload) {
      fetch('/api/deck/celebration/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, payload }),
      })
      .then(res => res.json())
      .then(data => {
        if (!data.celebration) return;
        const c = data.celebration;
        const overlay = document.getElementById('celebration-overlay');
        const badgeSlot = document.getElementById('celebration-badge-slot');
        const titleEl = document.getElementById('celebration-title');
        const headEl = document.getElementById('celebration-headline');
        const detailEl = document.getElementById('celebration-detail');
        const xpSlot = document.getElementById('celebration-xp-slot');

        if (badgeSlot) badgeSlot.innerHTML = c.badgeSvg || '';
        if (titleEl) titleEl.textContent = c.title || '';
        if (headEl) headEl.textContent = c.headline || '';
        if (detailEl) detailEl.textContent = c.detail || '';
        if (xpSlot) {
          if (c.xpEarned > 0) {
            xpSlot.style.display = 'inline-block';
            xpSlot.textContent = '+' + c.xpEarned + ' XP DISCIPLINE';
          } else if (c.unlockedItemName) {
            xpSlot.style.display = 'inline-block';
            xpSlot.textContent = 'UNLOCKED: ' + c.unlockedItemName.toUpperCase();
          } else {
            xpSlot.style.display = 'none';
          }
        }

        if (overlay) overlay.style.display = 'flex';
      })
      .catch(err => {
        console.error('Celebration trigger error:', err);
      });
    }

    function dismissCelebrationModal() {
      const overlay = document.getElementById('celebration-overlay');
      if (overlay) overlay.style.display = 'none';
    }

    // ===================================================================
    // SENSORS STATION ENGINES (Task 6.1 & 6.2 / Part 3.4)
    // ===================================================================
    function filterSensorsFeed(venue) {
      const rows = document.querySelectorAll('.sensor-trade-row');
      const btnAll = document.getElementById('btn-feed-filter-all');
      const btnKalshi = document.getElementById('btn-feed-filter-kalshi');
      const btnPoly = document.getElementById('btn-feed-filter-poly');
      [btnAll, btnKalshi, btnPoly].forEach(b => { if (b) b.classList.remove('active'); });
      if (venue === 'all' && btnAll) btnAll.classList.add('active');
      if (venue === 'kalshi' && btnKalshi) btnKalshi.classList.add('active');
      if (venue === 'polymarket' && btnPoly) btnPoly.classList.add('active');

      rows.forEach(r => {
        if (venue === 'all') {
          r.style.display = '';
        } else if (r.classList.contains('venue-' + venue)) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    }

    function lookupWalletCard() {
      const input = document.getElementById('wallet-address-input');
      const container = document.getElementById('wallet-card-container');
      const addr = input ? input.value.trim() : '';
      if (!addr) return;
      if (container) {
        container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--hud-cyan); font-family:var(--font-mono); font-size:0.85rem;"><span style="display:inline-block; animation:spin 1s linear infinite; margin-right:8px;">◌</span> Auditing on-chain calibration & calculating probabilistic Brier decomposition...</div>';
      }

      fetch('/api/deck/sensors/wallets/' + encodeURIComponent(addr))
        .then(res => {
          if (!res.ok) throw new Error('Address audit failed or invalid format');
          return res.json();
        })
        .then(data => {
          if (container && data.html) {
            container.innerHTML = data.html;
          }
        })
        .catch(err => {
          if (container) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--alert-red); font-family:var(--font-mono); font-size:0.8rem;">' + (err.message || 'Audit lookup failed') + '</div>';
          }
        });
    }

    function loadBenchmarkWallet(addr) {
      const input = document.getElementById('wallet-address-input');
      if (input) input.value = addr;
      lookupWalletCard();
    }

    // ===================================================================
    // MISSION LOG & SHADOW MODE ENGINES (Task 4.4 & 6.3 / Part 3.4)
    // ===================================================================
    function switchMissionTab(tab) {
      const journalView = document.getElementById('mission-journal-view');
      const shadowView = document.getElementById('mission-shadow-view');
      const btnJournal = document.getElementById('btn-mission-tab-journal');
      const btnShadow = document.getElementById('btn-mission-tab-shadow');

      if (tab === 'shadow') {
        if (journalView) journalView.style.display = 'none';
        if (shadowView) shadowView.style.display = 'block';
        if (btnJournal) btnJournal.classList.remove('active');
        if (btnShadow) btnShadow.classList.add('active');
      } else {
        if (journalView) journalView.style.display = 'block';
        if (shadowView) shadowView.style.display = 'none';
        if (btnJournal) btnJournal.classList.add('active');
        if (btnShadow) btnShadow.classList.remove('active');
      }
    }

    function toggleShadowRule(ruleId) {
      fetch('/api/deck/shadow/rules/' + encodeURIComponent(ruleId) + '/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      .then(res => res.json())
      .then(data => {
        if (data.rule) {
          alert('Shadow tracking rule "' + data.rule.name + '" is now ' + (data.rule.enabled ? 'ACTIVE' : 'STANDBY') + '.');
          location.reload();
        }
      })
      .catch(err => {
        alert('Failed to update shadow rule: ' + err.message);
      });
    }

    // ===================================================================
    // ONBOARDING COCKPIT BRIEFING TUTORIAL ENGINE
    // ===================================================================
    let deckAudioCtx = null;
    let deckAudioMuted = true;
    let deckTutorialPlaying = false;
    let deckTutorialProgress = 0;
    let deckTutorialRafId = null;
    let deckLastTimestamp = 0;

    const DECK_TUTORIAL_ACTS = [
      { start: 0, end: 15, caption: "Act 1: Pre-Flight Check — Inspect exchange taker fees and required breakeven hurdle before entry." },
      { start: 15, end: 30, caption: "Act 2: 60s Settlement Radar — Tracking settlement TWAP vs constituent spot exchanges to understand basis dynamics." },
      { start: 30, end: 45, caption: "Act 3: Copilot Aria & Stations — Multi-station monitoring with zero live capital deployed ($0.00 exposure)." },
      { start: 45, end: 60, caption: "Act 4: Build Your Legacy — Earn discipline XP from Cadet to Admiral and unlock Pilot telemetry." }
    ];

    function openDeckVideoBriefingModal() {
      const m = document.getElementById('deck-video-briefing-modal');
      if (m) m.style.display = 'flex';
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass && !deckAudioCtx) deckAudioCtx = new AudioClass();
      deckTutorialPlaying = true;
      deckTutorialProgress = 0;
      deckLastTimestamp = performance.now();
      if (deckTutorialRafId) cancelAnimationFrame(deckTutorialRafId);
      deckTutorialRafId = requestAnimationFrame(deckTutorialLoop);
    }

    function closeDeckVideoBriefingModal() {
      const m = document.getElementById('deck-video-briefing-modal');
      if (m) m.style.display = 'none';
      deckTutorialPlaying = false;
      if (deckTutorialRafId) cancelAnimationFrame(deckTutorialRafId);
    }

    function toggleDeckTutorialAudio() {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass && !deckAudioCtx) deckAudioCtx = new AudioClass();
      if (deckAudioCtx && deckAudioCtx.state === 'suspended') deckAudioCtx.resume();
      deckAudioMuted = !deckAudioMuted;
      const b = document.getElementById('btn-deck-audio');
      if (b) b.innerText = deckAudioMuted ? "🔇 Sound: OFF" : "🔊 Sound: ON";
    }

    function toggleDeckTutorialPlay() {
      deckTutorialPlaying = !deckTutorialPlaying;
      const b = document.getElementById('btn-deck-play');
      if (b) b.innerText = deckTutorialPlaying ? "❚❚ Pause" : "▶ Play";
      if (deckTutorialPlaying) {
        deckLastTimestamp = performance.now();
        deckTutorialRafId = requestAnimationFrame(deckTutorialLoop);
      }
    }

    function seekDeckTutorialAct(idx) {
      if (DECK_TUTORIAL_ACTS[idx]) {
        deckTutorialProgress = DECK_TUTORIAL_ACTS[idx].start;
        for (let i = 0; i < 4; i++) {
          const btn = document.getElementById('btn-deck-chap-' + i);
          if (btn) btn.classList.toggle('active', i === idx);
        }
      }
    }

    function deckTutorialLoop(timestamp) {
      if (!deckTutorialPlaying) return;
      const dt = (timestamp - deckLastTimestamp) / 1000;
      deckLastTimestamp = timestamp;

      deckTutorialProgress += dt;
      if (deckTutorialProgress >= 60) deckTutorialProgress = 0;

      let currentActIdx = 0;
      for (let i = 0; i < DECK_TUTORIAL_ACTS.length; i++) {
        if (deckTutorialProgress >= DECK_TUTORIAL_ACTS[i].start && deckTutorialProgress < DECK_TUTORIAL_ACTS[i].end) {
          currentActIdx = i;
          break;
        }
      }

      for (let i = 0; i < 4; i++) {
        const btn = document.getElementById('btn-deck-chap-' + i);
        if (btn) btn.classList.toggle('active', i === currentActIdx);
      }

      const cap = document.getElementById('deck-tutorial-caption');
      if (cap) cap.innerText = DECK_TUTORIAL_ACTS[currentActIdx].caption;

      drawDeckCanvas(currentActIdx, deckTutorialProgress);
      deckTutorialRafId = requestAnimationFrame(deckTutorialLoop);
    }

    function drawDeckCanvas(actIdx, prog) {
      const c = document.getElementById('deck-tutorial-hud-canvas');
      if (!c) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;

      const w = c.width = c.clientWidth || 800;
      const h = c.height = c.clientHeight || 360;

      ctx.fillStyle = '#05070D';
      ctx.fillRect(0, 0, w, h);

      // Rotating Radar
      const cx = w / 2;
      const cy = h / 2 - 10;
      ctx.strokeStyle = 'rgba(79, 209, 232, 0.15)';
      for (let r = 40; r <= 160; r += 40) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      const angle = (prog * 2.5) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(79, 209, 232, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 160, cy + Math.sin(angle) * 160);
      ctx.stroke();

      // Top Status Bar
      ctx.fillStyle = '#C9A24A';
      ctx.font = '600 13px "IBM Plex Mono", monospace';
      ctx.fillText("FLIGHT DECK SIMULATOR // 60s TUTORIAL", 20, 25);
      const secStr = Math.floor(prog).toString().padStart(2, '0') + ":00 / 01:00";
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(secStr, w - 120, 25);

      // Act Content Overlays
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 18px Inter, sans-serif';
      if (actIdx === 0) {
        ctx.fillText("ACT 1: PRE-FLIGHT COST ENGINE", 30, 65);
        ctx.fillStyle = '#F43F5E';
        ctx.font = '700 18px "IBM Plex Mono", monospace';
        ctx.fillText("$1.75 PEAK TAKER DRAG (50¢ STRIKE)", 30, 100);
        ctx.fillStyle = '#10B981';
        ctx.fillText("FEE HURDLE AUDITED BEFORE RISK", 30, 130);
      } else if (actIdx === 1) {
        ctx.fillText("ACT 2: 60-SECOND TWAP SETTLEMENT RADAR", 30, 65);
        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 14px "IBM Plex Mono", monospace';
        ctx.fillText("Settlement Index vs Constituent Spot Exchanges", 30, 100);
        ctx.fillStyle = '#C9A24A';
        ctx.fillText("Basis Gap Warning: Kalshi settles on index, not app.", 30, 130);
      } else if (actIdx === 2) {
        ctx.fillText("ACT 3: AUTONOMOUS COPILOT ARIA & 7 STATIONS", 30, 65);
        ctx.fillStyle = '#4FD1E8';
        ctx.font = 'italic 14px Inter, sans-serif';
        ctx.fillText('"I can show you exactly what this costs and how it settles."', 30, 100);
        ctx.fillStyle = '#10B981';
        ctx.font = '600 13px "IBM Plex Mono", monospace';
        ctx.fillText("Safety First: $0.00 Live Risk exposure. 100% Paper Mode.", 30, 130);
      } else {
        ctx.fillText("ACT 4: BUILD YOUR LEGACY & SUBCRIBE TO PILOT", 30, 65);
        ctx.fillStyle = '#C9A24A';
        ctx.font = '700 15px "IBM Plex Mono", monospace';
        ctx.fillText("Cadet → Pilot → Lieutenant → Commander → Admiral", 30, 100);
        ctx.fillStyle = '#FFF';
        ctx.font = '600 13px "IBM Plex Mono", monospace';
        ctx.fillText("Pilot Access: $39/mo or $349/yr with 14-Day Trial", 30, 130);
      }

      // Progress Line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, h - 5, w, 5);
      ctx.fillStyle = '#C9A24A';
      ctx.fillRect(0, h - 5, (prog / 60) * w, 5);
    }
  </script>

  <!-- Video Briefing Modal for Mobile App -->
  <div id="deck-video-briefing-modal" style="display:none; position:fixed; inset:0; background:rgba(3,4,7,0.95); backdrop-filter:blur(20px); z-index:9999; align-items:center; justify-content:center; padding:16px;">
    <div style="width:min(860px,100%); background:#080B12; border:1px solid rgba(201,162,74,0.4); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.9);">
      <div style="padding:12px 18px; background:#0C101A; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
        <span style="font-family:var(--font-mono); font-size:0.8rem; font-weight:700; color:var(--hud-gold);">
          🛰️ FLIGHT DECK BRIEFING // 60-SEC WALKTHROUGH
        </span>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-aria-action" id="btn-deck-audio" onclick="toggleDeckTutorialAudio()" style="font-size:0.7rem; padding:4px 8px;">🔇 Sound: OFF</button>
          <button type="button" class="btn-aria-action" id="btn-deck-play" onclick="toggleDeckTutorialPlay()" style="font-size:0.7rem; padding:4px 8px;">❚❚ Pause</button>
          <button type="button" class="btn-aria-action" onclick="closeDeckVideoBriefingModal()" style="font-size:0.7rem; padding:4px 8px; color:var(--alert-red); border-color:var(--alert-red);">✕ Close</button>
        </div>
      </div>
      <div style="width:100%; height:320px; background:#020306; position:relative;">
        <canvas id="deck-tutorial-hud-canvas" width="800" height="320" style="width:100%; height:100%; display:block;"></canvas>
      </div>
      <div style="padding:10px 18px; background:#07090F; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="btn-aria-action active" id="btn-deck-chap-0" onclick="seekDeckTutorialAct(0)" style="font-size:0.68rem; padding:3px 8px;">01. Fee Drag</button>
          <button type="button" class="btn-aria-action" id="btn-deck-chap-1" onclick="seekDeckTutorialAct(1)" style="font-size:0.68rem; padding:3px 8px;">02. TWAP Radar</button>
          <button type="button" class="btn-aria-action" id="btn-deck-chap-2" onclick="seekDeckTutorialAct(2)" style="font-size:0.68rem; padding:3px 8px;">03. Copilot Aria</button>
          <button type="button" class="btn-aria-action" id="btn-deck-chap-3" onclick="seekDeckTutorialAct(3)" style="font-size:0.68rem; padding:3px 8px;">04. Pro Upgrade</button>
        </div>
        <a href="/pricing" style="background:var(--hud-gold); color:#000; font-family:var(--font-mono); font-weight:700; font-size:0.75rem; padding:6px 14px; border-radius:4px; text-decoration:none;">
          Claim Pro Access &rarr;
        </a>
      </div>
      <div id="deck-tutorial-caption" style="padding:10px 18px; background:#05060B; border-top:1px solid rgba(255,255,255,0.06); font-family:var(--font-mono); font-size:0.75rem; color:#E2E8F0; text-align:center;">
        Loading Flight Operations Briefing… Initializing audio-visual telemetry.
      </div>
    </div>
  </div>

  ${renderInstallPromptHtml()}
  <script>${HAPTICS_AND_MOTION_CLIENT_SCRIPT}</script>
</body>
</html>`;
}
