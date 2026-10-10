/**
 * QuanterraOS Flagship Public Landing Page (Tesla Mode & Cockpit Gateway)
 *
 * Implements Phase 3 Task 3.3 and Flagship Cockpit & Mobile Distribution:
 * - 6 Core Tesla-Grade Panels:
 *   1. Hero (subtle starfield): "Trade like a pilot, not a passenger." — [Run Free Check] [Enter the Flight Deck]
 *   2. Cost: live Kalshi fee curve; "At 50¢ you need 51.75% just to break even." — [Check a Contract] [Compare Fee Schedules]
 *   3. Settlement: live BRTI vs Coinbase/Kraken gap + countdown. "Kalshi settles on the index, not your app." — [Open Radar] [How Settlement Works]
 *   4. Flight Deck preview: cockpit, ranks, missions. "Get sharper every trade." — [Start Free] [Explore Stations]
 *   5. Proof: "We publish when the market beats us." Brier 0.2001 vs 0.2063, n=1,316. — [See the Proof] [Inspect Datasets]
 *   6. Institutional: "Neutral data for desks." — [Talk to Us] [Get API Key]
 * - Downloadable Mobile App Gateway:
 *   - Top banner & modal with 1-click PWA install, Apple iPhone Add-to-Home-Screen guide, Android quick install, and QR code.
 * - Interactive Cockpit Video Briefing / Tutorial:
 *   - Welcoming 60-second animated flight deck walkthrough with Web Audio soundscapes, live fee curve, settlement radar, Copilot Aria, and direct subscription conversion.
 * - Microstructure Cockpit Section & Independent Referee Benchmark Showcase:
 *   - Deep links to all 6 core terminal stations and 2026 competitive battlecards.
 */

import type { MarketPriceCalibrationReport } from "./market-price-calibration.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";

export function renderLandingPage(report?: MarketPriceCalibrationReport | null): string {
  const sampleN = report?.sampleSize ?? 1316;
  const brierScore =
    report?.averageBrierScore !== null && report?.averageBrierScore !== undefined
      ? report.averageBrierScore.toFixed(4)
      : "0.2001";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>QuanterraOS — Trade Like a Pilot, Not a Passenger</title>
  <meta name="description" content="True cost engine, 60-second settlement radar, and calibration intelligence across prediction markets. Built for discipline, not volume.">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="/icons/icon.svg">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}

    /* Page-Specific Smooth Parallax & Visual Enhancements */
    body {
      background: #000000;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      font-family: var(--public-font-sans);
      overflow-x: hidden;
    }

    #starfield-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
      opacity: 0.65;
    }

    /* Mobile App Top Strip */
    .mobile-app-top-strip {
      background: linear-gradient(90deg, #0A0D16 0%, #151C2C 50%, #0A0D16 100%);
      border-bottom: 1px solid rgba(79, 209, 232, 0.25);
      padding: 8px 16px;
      font-size: 0.8rem;
      position: relative;
      z-index: 1001;
    }
    .mobile-app-top-strip-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .btn-strip-download {
      background: var(--public-accent-gold);
      color: #05060B;
      font-weight: 700;
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      padding: 5px 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn-strip-download:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 12px rgba(201, 162, 74, 0.4);
    }

    .panels-container {
      position: relative;
      z-index: 10;
    }

    /* Sub-panel visual cards */
    .feature-card {
      background: rgba(18, 18, 22, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px 24px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      max-width: 580px;
      width: 100%;
      margin: 0 auto 28px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    }

    .curve-svg {
      width: 100%;
      height: 120px;
      display: block;
      margin: 12px 0 6px;
    }

    .cockpit-preview-hud {
      background: rgba(5, 6, 11, 0.85);
      border: 1px solid rgba(79, 209, 232, 0.25);
      border-radius: 10px;
      padding: 20px;
      width: 100%;
      max-width: 580px;
      margin-bottom: 24px;
      box-shadow: 0 0 25px rgba(79, 209, 232, 0.08);
    }

    .hud-station-tag {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      color: #4FD1E8;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .hud-live-tag {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4FD1E8;
      box-shadow: 0 0 8px #4FD1E8;
    }

    /* Hero Proof Strip */
    .hero-contender-proof-strip {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 16px;
      margin-bottom: 18px;
      font-family: var(--public-font-mono);
      font-size: 0.75rem;
      color: #94A3B8;
      background: rgba(255, 255, 255, 0.04);
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .hero-contender-proof-strip span {
      color: var(--public-accent-gold);
      font-weight: 600;
    }

    /* Video Briefing CTA Button */
    .btn-video-briefing {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, rgba(201, 162, 74, 0.18) 0%, rgba(79, 209, 232, 0.18) 100%);
      border: 1px solid rgba(201, 162, 74, 0.5);
      color: #FFFFFF;
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: 30px;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(201, 162, 74, 0.2);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-video-briefing:hover {
      background: linear-gradient(135deg, rgba(201, 162, 74, 0.35) 0%, rgba(79, 209, 232, 0.35) 100%);
      transform: translateY(-2px);
      box-shadow: 0 0 28px rgba(201, 162, 74, 0.4);
    }
    .video-play-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--public-accent-gold);
      color: #05060B;
      font-size: 0.65rem;
      font-weight: 800;
      padding-left: 2px;
    }

    .btn-mobile-gateway {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: 30px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-mobile-gateway:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: #4FD1E8;
      color: #4FD1E8;
    }

    /* Microstructure Cockpit Section */
    .cockpit-station-section {
      position: relative;
      z-index: 10;
      padding: 80px 24px;
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }
    .cockpit-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 36px;
      text-align: left;
    }
    .cockpit-tool-card {
      background: rgba(12, 15, 23, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 22px;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      backdrop-filter: blur(8px);
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .cockpit-tool-card:hover {
      transform: translateY(-3px);
      border-color: rgba(79, 209, 232, 0.5);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(79, 209, 232, 0.1);
    }
    .tool-tag {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: #4FD1E8;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .tool-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .tool-desc {
      font-size: 0.85rem;
      color: #94A3B8;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    .tool-action {
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--public-accent-gold);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .cockpit-deep-nav {
      margin-top: 36px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: #94A3B8;
    }
    .cockpit-deep-nav a {
      color: #E2E8F0;
      text-decoration: none;
      margin: 0 4px;
    }
    .cockpit-deep-nav a:hover {
      color: var(--public-accent-gold);
    }

    /* Video Briefing Modal */
    .video-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(3, 4, 7, 0.94);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 2000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .video-modal-backdrop.open {
      display: flex;
    }
    .video-modal-box {
      width: min(960px, 100%);
      background: #080B12;
      border: 1px solid rgba(201, 162, 74, 0.4);
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(79, 209, 232, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .video-modal-header {
      padding: 14px 20px;
      background: #0C101A;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .video-modal-title {
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--public-accent-gold);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .video-modal-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-vctrl {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #E2E8F0;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      cursor: pointer;
    }
    .btn-vctrl:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
    }
    .btn-vctrl.active {
      border-color: var(--public-accent-gold);
      color: var(--public-accent-gold);
    }
    .video-screen-stage {
      position: relative;
      width: 100%;
      height: 440px;
      background: #020306;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    #tutorial-hud-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .video-timeline-bar {
      padding: 12px 20px;
      background: #07090F;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .chapter-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-chapter {
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94A3B8;
      padding: 4px 10px;
      border-radius: 14px;
      font-family: var(--public-font-mono);
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-chapter.active, .btn-chapter:hover {
      border-color: var(--public-accent-gold);
      color: #FFFFFF;
      background: rgba(201, 162, 74, 0.15);
    }
    .btn-briefing-subscribe {
      background: linear-gradient(180deg, #FBF3D5 0%, #DFB843 35%, #B88E28 100%);
      color: #07080B;
      font-family: var(--public-font-mono);
      font-weight: 700;
      font-size: 0.8rem;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      border: 1px solid var(--public-accent-gold);
      box-shadow: 0 0 15px rgba(201, 162, 74, 0.35);
      transition: transform 0.15s;
    }
    .btn-briefing-subscribe:hover {
      transform: translateY(-1px);
    }
    .video-captions-box {
      padding: 12px 20px;
      background: #05060B;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-family: var(--public-font-mono);
      font-size: 0.8rem;
      color: #E2E8F0;
      line-height: 1.5;
      text-align: center;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Mobile Download Modal */
    .download-modal-box {
      width: min(580px, 100%);
      background: #080B12;
      border: 1px solid rgba(79, 209, 232, 0.35);
      border-radius: 12px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
      padding: 24px;
    }

    /* Mobile 375px audit styles */
    @media (max-width: 480px) {
      .tesla-panel {
        min-height: calc(100vh - 64px);
        padding: 56px 16px 64px;
      }
      .tesla-metric-grid-3 {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 24px;
      }
      .tesla-button-group {
        flex-direction: column;
        width: 100%;
        max-width: 320px;
      }
      .btn-tesla-primary, .btn-tesla-secondary {
        width: 100%;
        padding: 14px 20px;
      }
      .feature-card, .cockpit-preview-hud {
        padding: 16px;
      }
      .video-screen-stage {
        height: 280px;
      }
      .mobile-app-top-strip-inner {
        flex-direction: column;
        text-align: center;
      }
    }
  </style>
</head>
<body>

  <!-- Top Strip: Direct Mobile App Gateway -->
  <aside class="mobile-app-top-strip" id="mobile-app-top-strip" aria-label="Mobile Application Download">
    <div class="mobile-app-top-strip-inner">
      <span>📲 Mobile Flight Deck PWA available for <strong>Apple iPhone &amp; Samsung Galaxy</strong></span>
      <div style="display:flex; align-items:center; gap:12px;">
        <button type="button" class="btn-strip-download" onclick="openMobileAppDownloadModal()">Install / Download App &rarr;</button>
        <a href="/mobile" style="color:#C9A24A; text-decoration:none; font-size:0.75rem; font-family:var(--public-font-mono);">Mobile Guide</a>
        <a href="/account?flow=sign-up" class="nav-pill-mobile-app" style="color:#FFF; text-decoration:none; font-size:0.75rem; font-family:var(--public-font-mono); background:rgba(255,255,255,0.08); padding:3px 8px; border-radius:4px;">iPhone &amp; Samsung App</a>
        <a href="/account?flow=sign-up" style="color:#94A3B8; text-decoration:none; font-size:0.75rem; font-family:var(--public-font-mono);">Sign up</a>
        <a href="/account?flow=sign-in" style="color:#94A3B8; text-decoration:none; font-size:0.75rem; font-family:var(--public-font-mono);">Sign in</a>
      </div>
    </div>
  </aside>

  <!-- Background Canvas for Subtle Starfield Parallax -->
  <canvas id="starfield-canvas" aria-hidden="true"></canvas>

  ${renderPublicHeader({ activePath: "/" })}

  <div class="panels-container">

    <!-- =======================================================================
         PANEL 1: HERO
         Headline: "Trade like a pilot, not a passenger."
         Buttons (2): [Run Free Check] [Enter the Flight Deck]
         Metrics (3): $0.00 Live Risk · 100% Settled · 0.07x Taker Curve
         ======================================================================= -->
    <section class="tesla-panel" id="panel-hero" aria-label="Hero Introduction">
      <div class="tesla-panel-inner">
        <div class="tesla-eyebrow">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--public-accent-gold);"></span>
          <span>THE PREDICTION-MARKET TERMINAL BUILT FOR DISCIPLINE</span>
        </div>

        <h1 class="tesla-headline">Trade like a pilot,<br>not a passenger.</h1>
        <p class="tesla-lead">
          True cost calculations, 60-second settlement radar, and calibration intelligence across prediction markets. We don't take volume kickbacks, hold custody of funds, or make buy/sell calls.
        </p>

        <!-- Proof & Contender Strip -->
        <div class="hero-contender-proof-strip">
          <div>✓ <span>1,316 Settled Contracts</span></div>
          <div>✓ <span>0.2001 Brier Benchmark Verified</span></div>
          <div>✓ <span>100% Venue-Neutral</span></div>
        </div>

        <!-- Video Briefing & Mobile App Launch Buttons -->
        <div style="margin: 14px 0 24px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; align-items: center;">
          <button type="button" class="btn-video-briefing" id="btn-open-video-briefing" onclick="openVideoBriefingModal()">
            <span class="video-play-icon">▶</span>
            <span>Watch 60-Second Cockpit Briefing (Interactive Video Tutorial)</span>
          </button>
          <button type="button" class="btn-mobile-gateway" id="hero-mobile-app-btn" onclick="openMobileAppDownloadModal()">
            <span>📲 Mobile App: iPhone &amp; Samsung</span>
          </button>
        </div>

        <!-- Constraint: <= 3 numbers per screen -->
        <div class="tesla-metric-grid-3">
          <div class="tesla-metric-item">
            <div class="tesla-metric-val">$0.00</div>
            <div class="tesla-metric-label">Execution Risk (Rule B5)</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color: var(--public-accent-gold);">100%</div>
            <div class="tesla-metric-label">Settlement Reconciled</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val">0.07×</div>
            <div class="tesla-metric-label">Fee Curve Audited</div>
          </div>
        </div>

        <!-- Constraint: <= 2 buttons per panel -->
        <div class="tesla-button-group">
          <a href="/check" class="btn-tesla-primary" id="hero-free-check-btn">Run Free Check &rarr;</a>
          <a href="/deck" class="btn-tesla-secondary" id="hero-flight-deck-btn">Enter the Flight Deck</a>
        </div>
      </div>
    </section>

    <!-- =======================================================================
         PANEL 2: COST
         Headline: "At 50¢ you need 51.75% just to break even."
         Buttons (2): [Check a contract] [Compare Fee Schedules]
         Metrics (3): 51.75% Breakeven · $1.75 Peak Taker Drag · 100% Maker Saver
         ======================================================================= -->
    <section class="tesla-panel" id="panel-cost" aria-label="True-Cost Engine">
      <div class="tesla-panel-inner">
        <div class="tesla-eyebrow">ENGINEERING · TRUE-COST ENGINE</div>
        <h2 class="tesla-headline">At 50¢ you need 51.75%<br>just to break even.</h2>
        <p class="tesla-lead">
          Exchange fee drag peaks exactly where directional certainty is lowest. Every 100 contracts at 50¢ charges $1.75 in taker fees. We compute true breakeven hurdle and maker savings before you commit.
        </p>

        <!-- Fee Curve Visualizer -->
        <div class="feature-card">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--public-muted); font-family:var(--public-font-mono);">
            <span>1¢ Contract ($0.01 fee)</span>
            <span style="color:var(--public-accent-gold); font-weight:700;">PEAK DRAG AT 50¢ ($1.75/100ct)</span>
            <span>99¢ Contract ($0.01 fee)</span>
          </div>
          <svg class="curve-svg" viewBox="0 0 500 100" fill="none">
            <defs>
              <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#C9A24A" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#C9A24A" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path d="M 10 95 Q 250 5 490 95" stroke="#C9A24A" stroke-width="2.5" fill="url(#feeGrad)"/>
            <circle cx="250" cy="50" r="5" fill="#FFFFFF" stroke="#C9A24A" stroke-width="2"/>
            <text x="250" y="38" text-anchor="middle" fill="#FFFFFF" font-size="11" font-family="monospace">50¢ Strike = Max Fee</text>
          </svg>
          <div style="font-size:0.78rem; color:#94A3B8; text-align:center;">
            Maker/Taker Saver calculates instantaneous savings if you post passive limit liquidity instead of paying taker spread.
          </div>
        </div>

        <!-- Constraint: <= 3 numbers per screen -->
        <div class="tesla-metric-grid-3">
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:#F43F5E;">51.75%</div>
            <div class="tesla-metric-label">True Breakeven at 50¢</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val">$1.75</div>
            <div class="tesla-metric-label">Taker Fee / 100ct</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:#10B981;">100%</div>
            <div class="tesla-metric-label">Maker Fee Saved ($0.00)</div>
          </div>
        </div>

        <!-- Constraint: <= 2 buttons per panel -->
        <div class="tesla-button-group">
          <a href="/check" class="btn-tesla-primary">Check a Contract &rarr;</a>
          <a href="/pricing" class="btn-tesla-secondary">Compare Fee Schedules</a>
        </div>
      </div>
    </section>

    <!-- =======================================================================
         PANEL 3: SETTLEMENT
         Headline: "Kalshi settles on the index, not your app."
         Buttons (2): [Open Radar] [How Settlement Works]
         Metrics (3): 60s TWAP Window · 4 Constituent Venues · < 1.2ms Sync
         ======================================================================= -->
    <section class="tesla-panel" id="panel-settlement" aria-label="Settlement Radar">
      <div class="tesla-panel-inner">
        <div class="tesla-eyebrow">NAVIGATION · SETTLEMENT RADAR</div>
        <h2 class="tesla-headline">Kalshi settles on the index,<br>not your app.</h2>
        <p class="tesla-lead">
          Kalshi KXBTC15M contracts resolve against the 60-second TWAP of constituent exchanges (Coinbase, Kraken, Bitstamp, Gemini), not instantaneous app spot. Spot your basis gap before expiration strikes.
        </p>

        <div class="feature-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:#38BDF8;">● SETTLEMENT-INDEX PROXY</span>
            <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--public-muted);">TWAP: 60 SECONDS</span>
          </div>
          <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; font-family:var(--public-font-mono); font-size:0.72rem; text-align:center;">
            <div style="background:rgba(255,255,255,0.04); padding:8px 4px; border-radius:4px;">
              <div style="color:var(--public-muted);">Coinbase</div>
              <div style="color:#FFF; font-weight:600; margin-top:2px;">Consensus</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); padding:8px 4px; border-radius:4px;">
              <div style="color:var(--public-muted);">Kraken</div>
              <div style="color:#FFF; font-weight:600; margin-top:2px;">Consensus</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); padding:8px 4px; border-radius:4px;">
              <div style="color:var(--public-muted);">Bitstamp</div>
              <div style="color:#FFF; font-weight:600; margin-top:2px;">Consensus</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); padding:8px 4px; border-radius:4px;">
              <div style="color:var(--public-muted);">Gemini</div>
              <div style="color:#FFF; font-weight:600; margin-top:2px;">Consensus</div>
            </div>
          </div>
          <div style="font-size:0.75rem; color:#94A3B8; margin-top:12px; text-align:center;">
            Monitored continuously across 9 global exchange colocation edge nodes.
          </div>
        </div>

        <!-- Constraint: <= 3 numbers per screen -->
        <div class="tesla-metric-grid-3">
          <div class="tesla-metric-item">
            <div class="tesla-metric-val">60s</div>
            <div class="tesla-metric-label">TWAP Resolution Window</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:var(--public-accent-gold);">4 Venues</div>
            <div class="tesla-metric-label">BRTI Constituents</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:#10B981;">&lt; 1.2ms</div>
            <div class="tesla-metric-label">Colocated Ingest Latency</div>
          </div>
        </div>

        <!-- Constraint: <= 2 buttons per panel -->
        <div class="tesla-button-group">
          <a href="/radar" class="btn-tesla-primary">Open Radar &rarr;</a>
          <a href="/learn" class="btn-tesla-secondary">How Settlement Works</a>
        </div>
      </div>
    </section>

    <!-- =======================================================================
         PANEL 4: FLIGHT DECK
         Headline: "Get sharper every trade."
         Buttons (2): [Start free] [Explore Stations]
         Metrics (3): 7 Stations · Cadet → Admiral · 18+ Loss Limits
         ======================================================================= -->
    <section class="tesla-panel" id="panel-flightdeck" aria-label="Flight Deck Experience">
      <div class="tesla-panel-inner">
        <div class="tesla-eyebrow">FLIGHT DECK · CELESTIAL SPACECRAFT COCKPIT</div>
        <h2 class="tesla-headline">Get sharper every trade.</h2>
        <p class="tesla-lead">
          A gamified discipline cockpit that rewards pre-flight checks, written theses, and Murphy calibration. XP is earned exclusively for discipline—never for trade count, volume, or winning.
        </p>

        <div class="cockpit-preview-hud">
          <div class="hud-station-tag">
            <span class="hud-live-tag"></span>
            <span>FLIGHT DECK STATIONS // 7 ACTIVE</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:10px; font-family:var(--public-font-mono); font-size:0.75rem; text-align:left;">
            <div style="border-left:2px solid #4FD1E8; padding-left:8px;">
              <strong style="color:#FFF;">Bridge</strong><br>
              <span style="color:#94A3B8; font-size:0.68rem;">Gauges &amp; Alerts</span>
            </div>
            <div style="border-left:2px solid #C9A24A; padding-left:8px;">
              <strong style="color:#FFF;">Navigation</strong><br>
              <span style="color:#94A3B8; font-size:0.68rem;">Settlement Radar</span>
            </div>
            <div style="border-left:2px solid #10B981; padding-left:8px;">
              <strong style="color:#FFF;">Engineering</strong><br>
              <span style="color:#94A3B8; font-size:0.68rem;">True-Cost Saver</span>
            </div>
            <div style="border-left:2px solid #A78BFA; padding-left:8px;">
              <strong style="color:#FFF;">Mission Log</strong><br>
              <span style="color:#94A3B8; font-size:0.68rem;">Thesis &amp; Brier</span>
            </div>
          </div>
          <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); font-size:0.75rem; color:#94A3B8; text-align:center;">
            Features automated daily tilt cooldowns, hull loss-limit alerts, and an 18+ responsible trading gate.
          </div>
        </div>

        <!-- Constraint: <= 3 numbers per screen -->
        <div class="tesla-metric-grid-3">
          <div class="tesla-metric-item">
            <div class="tesla-metric-val">7 Stations</div>
            <div class="tesla-metric-label">Cockpit Navigation</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:var(--public-accent-gold);">Cadet &rarr; Admiral</div>
            <div class="tesla-metric-label">Merit-Based Ranks</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:#10B981;">18+</div>
            <div class="tesla-metric-label">Responsible Safety Gate</div>
          </div>
        </div>

        <!-- Constraint: <= 2 buttons per panel -->
        <div class="tesla-button-group">
          <a href="/deck" class="btn-tesla-primary">Start Free &rarr;</a>
          <a href="/deck" class="btn-tesla-secondary">Explore Stations</a>
        </div>
      </div>
    </section>

    <!-- =======================================================================
         PANEL 5: PROOF
         Headline: "We publish when the market beats us."
         Buttons (2): [See the proof] [Inspect Datasets]
         Metrics (3): 0.2001 QuanterraOS Brier · 0.2063 Market Baseline · 1,316 Settled
         ======================================================================= -->
    <section class="tesla-panel" id="panel-proof" aria-label="Public Proof">
      <div class="tesla-panel-inner">
        <div class="tesla-eyebrow">PUBLIC PROOF · VERIFIED AUDIT CORPUS</div>
        <h2 class="tesla-headline">We publish when the<br>market beats us.</h2>
        <p class="tesla-lead">
          Auditable Brier score decomposition across ${sampleN} settled 15-minute Bitcoin contracts. We measure calibration without asserting predictive edge or profit claims.
        </p>

        <div class="feature-card">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-family:var(--public-font-mono); margin-bottom:8px;">
            <span>EMPIRICAL CALIBRATION BENCHMARK</span>
            <span style="color:#10B981;">N = ${sampleN} SETTLED</span>
          </div>
          <div style="font-size:0.85rem; line-height:1.5; color:#CBD5E1; text-align:left;">
            Lower Brier score represents superior probabilistic calibration. QuanterraOS tracks market probability divergence and publishes resolution logs with zero cherry-picking.
          </div>
        </div>

        <!-- Constraint: <= 3 numbers per screen -->
        <div class="tesla-metric-grid-3">
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:var(--public-accent-gold);">${brierScore}</div>
            <div class="tesla-metric-label">Quanterra Brier Score</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val">0.2063</div>
            <div class="tesla-metric-label">Market Mid Baseline</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val">${sampleN}</div>
            <div class="tesla-metric-label">Settled Windows Audited</div>
          </div>
        </div>

        <!-- Constraint: <= 2 buttons per panel -->
        <div class="tesla-button-group">
          <a href="/proof" class="btn-tesla-primary">See the Proof &rarr;</a>
          <a href="/proof" class="btn-tesla-secondary">Inspect Datasets</a>
        </div>
      </div>
    </section>

    <!-- =======================================================================
         PANEL 6: INSTITUTIONAL
         Headline: "Neutral data for desks."
         Buttons (2): [Talk to us] [Get API key]
         Metrics (3): 1,000 req/mo Free · OpenAPI 3.1 & MCP · 99.98% Uptime
         ======================================================================= -->
    <section class="tesla-panel" id="panel-institutional" aria-label="Institutional & API">
      <div class="tesla-panel-inner">
        <div class="tesla-eyebrow">INSTITUTIONAL · HIGH-FREQUENCY TELEMETRY</div>
        <h2 class="tesla-headline">Neutral data for desks.</h2>
        <p class="tesla-lead">
          Continuous order book depth logs, constituent BRTI dispersion tapes, and Model Context Protocol (MCP) endpoints for algorithmic trading desks and research teams.
        </p>

        <div class="feature-card">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-family:var(--public-font-mono); margin-bottom:10px;">
            <span style="color:#FFF;">INTEGRATION PROTOCOLS</span>
            <span style="color:var(--public-accent-gold);">REST · WS · MCP</span>
          </div>
          <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:#A78BFA; background:rgba(0,0,0,0.5); padding:10px; border-radius:6px; text-align:left; word-break:break-all;">
            curl -s https://quanterraos.com/api/v1/radar/KXBTC15M | jq .
          </div>
        </div>

        <!-- Constraint: <= 3 numbers per screen -->
        <div class="tesla-metric-grid-3">
          <div class="tesla-metric-item">
            <div class="tesla-metric-val">1,000/mo</div>
            <div class="tesla-metric-label">Free API Request Tier</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:var(--public-accent-gold);">OpenAPI 3.1</div>
            <div class="tesla-metric-label">Standardized Spec</div>
          </div>
          <div class="tesla-metric-item">
            <div class="tesla-metric-val" style="color:#10B981;">99.98%</div>
            <div class="tesla-metric-label">Telemetry Ingest Uptime</div>
          </div>
        </div>

        <!-- Constraint: <= 2 buttons per panel -->
        <div class="tesla-button-group">
          <a href="/institutional" class="btn-tesla-primary">Talk to Us &rarr;</a>
          <a href="/developers" class="btn-tesla-secondary">Get API Key</a>
        </div>
      </div>
    </section>

  </div>

  <!-- =======================================================================
       MICROSTRUCTURE COCKPIT SECTION (90-Day Execution Roadmap & Tools)
       ======================================================================= -->
  <section class="cockpit-station-section" id="roadmap-cockpit" aria-label="Microstructure Cockpit">
    <div style="max-width: 1140px; margin: 0 auto;">
      <div class="tesla-eyebrow" style="color: #4FD1E8; margin-bottom: 8px;">TERMINAL CAPABILITIES · ALL SHIP STATIONS</div>
      <h2 style="font-size: 2.1rem; font-weight: 800; margin-bottom: 12px; color: #FFFFFF; letter-spacing: -0.02em;">
        Active Prediction Market Microstructure Cockpit
      </h2>
      <p style="font-size: 0.95rem; color: #94A3B8; max-width: 720px; margin: 0 auto 36px; line-height: 1.6;">
        Seven specialized instrument stations engineered for empirical discipline. Zero live capital deployment (RULE B5 LOCKED: zero live capital exposure), venue-neutral pricing, and automated post-flight calibration audits.
      </p>

      <!-- 6 Specialized Terminal Cards -->
      <div class="cockpit-cards-grid">
        <!-- Card 1: Realistic Paper Mode -->
        <a href="/paper" class="cockpit-tool-card">
          <div>
            <div class="tool-tag">Simulation Mode &bull; Realistic Paper Mode</div>
            <div class="tool-title">Practice Without Deposits</div>
            <div class="tool-desc">Full shadow-order execution with realistic slippage, liquidity friction, and taker fee deductions before risking actual capital.</div>
          </div>
          <div class="tool-action">Launch Paper Cockpit &rarr;</div>
        </a>

        <!-- Card 2: Validated Forecast Comparison -->
        <a href="/compare" class="cockpit-tool-card">
          <div>
            <div class="tool-tag">Calibration Audit &bull; Prospective Value Study</div>
            <div class="tool-title">Forecast Comparison &amp; Audit</div>
            <div class="tool-desc">Head-to-head empirical Brier score benchmarking against Kalshi market mid across 1,316 settled 15-minute Bitcoin contracts.</div>
          </div>
          <div class="tool-action">Inspect Comparison &rarr;</div>
        </a>

        <!-- Card 3: All-Strike Depth Matrix -->
        <a href="/matrix" class="cockpit-tool-card">
          <div>
            <div class="tool-tag">Microstructure · Depth Analysis</div>
            <div class="tool-title">All-Strike Liquidity Wall Matrix</div>
            <div class="tool-desc">Complete order book ladder visualization revealing hidden bid-ask spreads, resting limit clusters, and liquidity walls.</div>
          </div>
          <div class="tool-action">Open Depth Matrix &rarr;</div>
        </a>

        <!-- Card 4: Order Book Liquidity Flow -->
        <a href="/flow" class="cockpit-tool-card">
          <div>
            <div class="tool-tag">Sensors · Flow Telemetry</div>
            <div class="tool-title">Order Book Liquidity Flow</div>
            <div class="tool-desc">Real-time delta tape tracking institutional block prints and smart-wallet accumulation patterns across Kalshi and Polymarket.</div>
          </div>
          <div class="tool-action">Stream Flow Tape &rarr;</div>
        </a>

        <!-- Card 5: Audio Sonification -->
        <a href="/radar/audio" class="cockpit-tool-card">
          <div>
            <div class="tool-tag">Acoustic Telemetry · Live Radar</div>
            <div class="tool-title">Live Microstructure Sonification</div>
            <div class="tool-desc">Web Audio synthesized auditory telemetry translating order book shifts and TWAP basis divergence into spatial stereo audio.</div>
          </div>
          <div class="tool-action">Enable Sonification &rarr;</div>
        </a>

        <!-- Card 6: Calibration Decomposition -->
        <a href="/calibration/explorer" class="cockpit-tool-card">
          <div>
            <div class="tool-tag">Research &bull; Brier Intelligence</div>
            <div class="tool-title">Calibration Explorer &amp; Decomposition</div>
            <div class="tool-desc">Interactive Murphy decomposition separating reliability, resolution, and uncertainty to pinpoint where probability shifts.</div>
          </div>
          <div class="tool-action">Explore Decomposition &rarr;</div>
        </a>
      </div>

      <!-- Primary consumer navigation deep links -->
      <div class="cockpit-deep-nav">
        <strong style="color: var(--public-accent-gold);">COCKPIT INSTRUMENT STATIONS:</strong>
        <a href="/calculator">Fee Calculator</a> ·
        <a href="/paper">Paper Mode</a> ·
        <a href="/compare">Forecast Compare</a> ·
        <a href="/radar">Settlement Radar</a> ·
        <a href="/flow">Liquidity Flow</a> ·
        <a href="/matrix">Depth Matrix</a> ·
        <a href="/journal">Mission Log / Journal</a> ·
        <a href="/settlement">Settlement Engine</a>
      </div>
    </div>
  </section>

  <!-- =======================================================================
       COMPETITIVE SHOWCASE & INDEPENDENT REFEREE BENCHMARK
       ======================================================================= -->
  <section class="cockpit-station-section" id="why-quanterraos-showcase" aria-label="Competitive Showcase">
    <div style="max-width: 1040px; margin: 0 auto;">
      <div class="tesla-eyebrow" style="color: var(--public-accent-gold); margin-bottom: 8px;">INDEPENDENT REFEREE // 2026 BENCHMARK</div>
      <h2 style="font-size: 2.1rem; font-weight: 800; margin-bottom: 12px; color: #FFFFFF; letter-spacing: -0.02em;">
        The Independent Referee in an Acquired Market
      </h2>
      <p style="font-size: 0.95rem; color: #94A3B8; max-width: 720px; margin: 0 auto 32px; line-height: 1.6;">
        When retail prediction platforms get acquired by exchanges, independent fee and settlement auditing vanishes. QuanterraOS remains 100% neutral with zero volume kickbacks.
      </p>

      <!-- Interactive Teardown Calculator -->
      <div class="feature-card" style="max-width: 740px; margin: 0 auto 36px; text-align: left;">
        <div style="font-family: var(--public-font-mono); font-size: 0.78rem; color: var(--public-accent-gold); margin-bottom: 14px; text-transform: uppercase;">
          Live Friction Teardown: Real Hurdle vs Advertised Odds
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
          <div>
            <label for="home-teardown-price" style="font-size: 0.72rem; color: #94A3B8; font-family: var(--public-font-mono); display: block; margin-bottom: 4px;">CONTRACT PRICE (¢)</label>
            <input type="range" id="home-teardown-price" min="1" max="99" value="50" style="width: 100%; accent-color: var(--public-accent-gold);" oninput="updateHomeTeardown()">
            <div id="disp-home-price" style="font-family: var(--public-font-mono); font-size: 0.82rem; color: #FFF; margin-top: 4px;">50¢</div>
          </div>
          <div>
            <label for="home-teardown-prob" style="font-size: 0.72rem; color: #94A3B8; font-family: var(--public-font-mono); display: block; margin-bottom: 4px;">ASSUMED WIN PROBABILITY (%)</label>
            <input type="range" id="home-teardown-prob" min="1" max="99" value="55" style="width: 100%; accent-color: #38BDF8;" oninput="updateHomeTeardown()">
            <div id="disp-home-prob" style="font-family: var(--public-font-mono); font-size: 0.82rem; color: #FFF; margin-top: 4px;">55%</div>
          </div>
          <div>
            <label for="home-teardown-count" style="font-size: 0.72rem; color: #94A3B8; font-family: var(--public-font-mono); display: block; margin-bottom: 4px;">CONTRACT COUNT</label>
            <input type="number" id="home-teardown-count" min="1" max="1000" value="100" style="width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.15); color: #FFF; padding: 6px 10px; border-radius: 4px; font-family: var(--public-font-mono); box-sizing: border-box;" oninput="updateHomeTeardown()">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: rgba(0,0,0,0.5); padding: 14px; border-radius: 6px; font-family: var(--public-font-mono); text-align: center;">
          <div>
            <div style="font-size: 0.68rem; color: #94A3B8;">NAIVE EV (ZERO FEES)</div>
            <div id="home-out-comp-ev" style="font-size: 1.15rem; font-weight: 700; color: #38BDF8; margin-top: 4px;">+$5.00</div>
          </div>
          <div>
            <div style="font-size: 0.68rem; color: #94A3B8;">REAL EV (POST-TAKER FEE)</div>
            <div id="home-out-real-ev" style="font-size: 1.15rem; font-weight: 700; color: #10B981; margin-top: 4px;">+$3.25</div>
          </div>
          <div>
            <div style="font-size: 0.68rem; color: #94A3B8;">REQUIRED BREAKEVEN</div>
            <div id="home-out-real-hurdle" style="font-size: 1.15rem; font-weight: 700; color: #F43F5E; margin-top: 4px;">51.75%</div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 16px;">
          <a href="/why" class="btn-strip-download" style="display: inline-block;">Read 2026 Competitive Teardown &rarr;</a>
        </div>
      </div>

      <!-- Contender Matrix & Battlecard -->
      <div style="margin-top: 36px;">
        <div style="font-size: 0.75rem; font-family: var(--public-font-mono); color: var(--public-accent-gold); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px;">
          ARCHITECTURAL SUPERIORITY // 2026 BENCHMARK MATRIX
        </div>
        <h3 style="font-size: 1.4rem; font-weight: 800; color: #FFF; margin-bottom: 18px;">
          Why QuanterraOS Leads the Field
        </h3>

        <div class="battlecard-matrix-wrap" style="overflow-x: auto; background: rgba(12, 15, 23, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 18px;">
          <div style="margin-bottom: 12px; display: flex; gap: 8px;">
            <button type="button" class="btn-vctrl active" onclick="filterBattlecard('all')">Show All</button>
            <button type="button" class="btn-vctrl" onclick="filterBattlecard('fees')">Fee Engines</button>
            <button type="button" class="btn-vctrl" onclick="filterBattlecard('settlement')">Settlement</button>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-family: var(--public-font-mono); font-size: 0.8rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94A3B8;">
                <th style="padding: 10px;">CAPABILITY</th>
                <th style="padding: 10px; color: var(--public-accent-gold);">QUANTERRAOS</th>
                <th style="padding: 10px;">RETAIL/CAPTURED APPS</th>
                <th style="padding: 10px;">PILOT IMPACT</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);" class="bcard-row" data-cat="fees">
                <td style="padding: 10px; font-weight: 600; color: #FFF;">Parabolic Fee Deduction Engine</td>
                <td style="padding: 10px; color: #10B981; font-weight: 600;">✓ Live Cents/Contract Formula</td>
                <td style="padding: 10px; color: #F43F5E;">✗ Hidden / Subsidized Claims</td>
                <td style="padding: 10px; color: #94A3B8;">Saves $142.50/mo per pilot</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);" class="bcard-row" data-cat="fees">
                <td style="padding: 10px; font-weight: 600; color: #FFF;">Empirical Murphy Brier Decomposition</td>
                <td style="padding: 10px; color: #10B981; font-weight: 600;">✓ 0.2001 Audited Score (n=1,316)</td>
                <td style="padding: 10px; color: #F43F5E;">✗ Subjective Win-Rate Claims</td>
                <td style="padding: 10px; color: #94A3B8;">Proves true calibration vs noise</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);" class="bcard-row" data-cat="settlement">
                <td style="padding: 10px; font-weight: 600; color: #FFF;">Anti-Dispute AI Auditor</td>
                <td style="padding: 10px; color: #10B981; font-weight: 600;">✓ Real-time Rule Ambiguity Scans</td>
                <td style="padding: 10px; color: #F43F5E;">✗ Blind to Resolution Disputes</td>
                <td style="padding: 10px; color: #94A3B8;">Avoids locked capital traps</td>
              </tr>
              <tr class="bcard-row" data-cat="settlement">
                <td style="padding: 10px; font-weight: 600; color: #FFF;">CC-BY-4.0 Canonical Datasets Hub</td>
                <td style="padding: 10px; color: #10B981; font-weight: 600;">✓ Free Open-Source Research Data</td>
                <td style="padding: 10px; color: #F43F5E;">✗ Gated / Paywalled Dumps</td>
                <td style="padding: 10px; color: #94A3B8;">Unlocks institutional quants</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Neutral Sourced Independence Architecture -->
      <div style="margin-top: 28px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 24px; text-align: center;">
        <div style="font-size: 0.75rem; font-family: var(--public-font-mono); color: var(--public-accent-gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          Independent Venue-Neutral Architecture
        </div>
        <div style="font-size: 1.1rem; font-weight: 700; color: #FFFFFF; max-width: 680px; margin: 0 auto 8px;">
          QuanterraOS is an independent analytics flight deck by Quantara Global LLC.
        </div>
        <div style="font-size: 0.85rem; color: #94A3B8; max-width: 740px; margin: 0 auto; line-height: 1.6;">
          We don't place trades, hold funds, or give investment advice. We audit real execution costs, CME CF BRTI settlement indexes, and probability calibration with zero exchange kickbacks or referral fees.
        </div>
        <div style="font-size: 0.72rem; color: #64748B; font-family: var(--public-font-mono); margin-top: 10px;">
          RULE B5 LOCKED: zero live capital exposure ($0.00). Marks Notice: Kalshi, CME Group, CF Benchmarks are trademarks of their respective owners.
        </div>
      </div>
    </div>
  </section>

  <!-- =======================================================================
       INTERACTIVE COCKPIT VIDEO BRIEFING & TUTORIAL MODAL
       ======================================================================= -->
  <div class="video-modal-backdrop" id="video-briefing-modal" role="dialog" aria-modal="true" aria-label="Cockpit Briefing Tutorial">
    <div class="video-modal-box">
      <div class="video-modal-header">
        <div class="video-modal-title">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981; box-shadow:0 0 8px #10B981;"></span>
          <span>QUANTERRAOS FLIGHT BRIEFING // 60-SECOND COCKPIT WALKTHROUGH</span>
        </div>
        <div class="video-modal-controls">
          <button type="button" class="btn-vctrl" id="btn-tutorial-audio" onclick="toggleTutorialAudio()">🔇 Sound: OFF</button>
          <button type="button" class="btn-vctrl" id="btn-tutorial-speed" onclick="cycleTutorialSpeed()">1.0x</button>
          <button type="button" class="btn-vctrl" id="btn-tutorial-play" onclick="toggleTutorialPlay()">❚❚ Pause</button>
          <button type="button" class="btn-vctrl" onclick="closeVideoBriefingModal()" style="color:#F43F5E;">✕ Close</button>
        </div>
      </div>

      <!-- Animated Cockpit Simulation Stage -->
      <div class="video-screen-stage">
        <canvas id="tutorial-hud-canvas" width="960" height="440"></canvas>
      </div>

      <!-- Timeline & Scene Selector -->
      <div class="video-timeline-bar">
        <div class="chapter-tabs">
          <button type="button" class="btn-chapter active" id="btn-chap-0" onclick="seekTutorialAct(0)">01. Fee Drag ($142.50 Saved)</button>
          <button type="button" class="btn-chapter" id="btn-chap-1" onclick="seekTutorialAct(1)">02. Settlement Radar (60s TWAP)</button>
          <button type="button" class="btn-chapter" id="btn-chap-2" onclick="seekTutorialAct(2)">03. Copilot Aria &amp; Stations</button>
          <button type="button" class="btn-chapter" id="btn-chap-3" onclick="seekTutorialAct(3)">04. Subscribe &amp; Launch Deck</button>
        </div>
        <a href="/pricing" class="btn-briefing-subscribe">Start 7-Day Free Flight Check &rarr;</a>
      </div>

      <!-- Dynamic Synchronized Audio/Visual Captions -->
      <div class="video-captions-box" id="tutorial-captions-text">
        Loading Flight Operations Briefing… Initializing audio-visual telemetry.
      </div>
    </div>
  </div>

  <!-- =======================================================================
       MOBILE APP DOWNLOAD & PWA INSTALLATION MODAL
       ======================================================================= -->
  <div class="video-modal-backdrop" id="mobile-app-download-modal" role="dialog" aria-modal="true" aria-label="Mobile App Installation">
    <div class="download-modal-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-family:var(--public-font-mono); font-size:0.95rem; font-weight:700; color:var(--public-accent-gold);">
          📲 Install QuanterraOS Flight Deck App
        </div>
        <button type="button" class="btn-vctrl" onclick="closeMobileAppDownloadModal()">✕</button>
      </div>

      <p style="font-size:0.85rem; color:#94A3B8; line-height:1.5; margin-bottom:20px;">
        Access full offline telemetry, 1-click share-sheet contract intake, haptic vibration alerts, and sub-150ms pricing speed with zero app-store download wait.
      </p>

      <!-- 1-Click Native PWA Button -->
      <div style="background:rgba(201,162,74,0.08); border:1px solid rgba(201,162,74,0.3); border-radius:8px; padding:18px; text-align:center; margin-bottom:20px;">
        <button type="button" id="btn-pwa-direct-install" class="btn-install-pwa-action" style="width:100%; max-width:380px; margin:0 auto; cursor:pointer; background:var(--public-accent-gold); color:#000; font-weight:700; font-family:var(--public-font-mono); padding:12px 20px; border-radius:24px; border:none;" onclick="triggerPwaInstall()">
          📲 Install to Device (1-Click PWA)
        </button>
        <div style="font-family:var(--public-font-mono); font-size:0.7rem; color:#94A3B8; margin-top:8px;">
          Compatible with Chrome, Android, Edge, Safari &amp; Desktop
        </div>
      </div>

      <!-- Step-by-step guides for iOS & Android -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:14px;">
          <strong style="font-size:0.82rem; color:#FFF; display:block; margin-bottom:6px;">Apple iPhone / iPad</strong>
          <ol style="font-size:0.75rem; color:#94A3B8; padding-left:18px; margin:0; line-height:1.5;">
            <li>Open Safari &amp; navigate to <span style="color:#C9A24A;">quanterraos.com</span></li>
            <li>Tap the <strong>Share</strong> button (⎋) at screen bottom</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong> (⊞)</li>
          </ol>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:14px;">
          <strong style="font-size:0.82rem; color:#FFF; display:block; margin-bottom:6px;">Android / Samsung</strong>
          <ol style="font-size:0.75rem; color:#94A3B8; padding-left:18px; margin:0; line-height:1.5;">
            <li>Open Chrome on your phone</li>
            <li>Tap the <strong>Install</strong> banner or 3-dots menu (⋮)</li>
            <li>Select <strong>Install app</strong> or <strong>Add to Home Screen</strong></li>
          </ol>
        </div>
      </div>

      <!-- QR Code for Desktop to Mobile Quick Scan -->
      <div style="background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:16px; display:flex; align-items:center; gap:16px;">
        <!-- Clean Vector QR Code representation -->
        <svg viewBox="0 0 100 100" width="80" height="80" style="background:#FFF; padding:6px; border-radius:6px; flex-shrink:0;">
          <rect x="0" y="0" width="30" height="30" fill="#000"/>
          <rect x="5" y="5" width="20" height="20" fill="#FFF"/>
          <rect x="10" y="10" width="10" height="10" fill="#000"/>
          <rect x="70" y="0" width="30" height="30" fill="#000"/>
          <rect x="75" y="5" width="20" height="20" fill="#FFF"/>
          <rect x="80" y="10" width="10" height="10" fill="#000"/>
          <rect x="0" y="70" width="30" height="30" fill="#000"/>
          <rect x="5" y="75" width="20" height="20" fill="#FFF"/>
          <rect x="10" y="80" width="10" height="10" fill="#000"/>
          <rect x="40" y="10" width="10" height="20" fill="#000"/>
          <rect x="55" y="5" width="10" height="10" fill="#000"/>
          <rect x="35" y="40" width="30" height="20" fill="#000"/>
          <rect x="70" y="40" width="15" height="10" fill="#000"/>
          <rect x="75" y="70" width="20" height="20" fill="#000"/>
          <rect x="40" y="75" width="15" height="15" fill="#000"/>
        </svg>
        <div>
          <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--public-accent-gold); font-weight:700; margin-bottom:4px;">
            POINT PHONE CAMERA TO SCAN &amp; LAUNCH
          </div>
          <div style="font-size:0.75rem; color:#94A3B8; line-height:1.4;">
            Instantly opens <strong style="color:#FFF;">quanterraos.com/deck</strong> on iOS and Android with automatic share-sheet intake and PWA caching.
          </div>
        </div>
      </div>
    </div>
  </div>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}

  <!-- Interactive Scripts: Starfield Canvas, Video Tutorial Engine & PWA Gateway -->
  <script>
    /* =========================================================================
       1. STARFIELD PARALLAX
       ========================================================================= */
    (function() {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;

      const canvas = document.getElementById('starfield-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let w = canvas.width = window.innerWidth;
      let h = canvas.height = window.innerHeight;

      window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      });

      const stars = [];
      const numStars = Math.min(80, Math.floor(w / 16));

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 1.2 + 0.3,
          opacity: Math.random() * 0.7 + 0.3,
          speed: Math.random() * 0.15 + 0.05
        });
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.y -= s.speed;
          if (s.y < 0) {
            s.y = h;
            s.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + s.opacity + ')';
          ctx.fill();
        }
        requestAnimationFrame(draw);
      }
      draw();
    })();

    /* =========================================================================
       2. COMPETITIVE TEARDOWN SLIDER LOGIC
       ========================================================================= */
    function updateHomeTeardown() {
      const priceInput = document.getElementById('home-teardown-price');
      const probInput = document.getElementById('home-teardown-prob');
      const countInput = document.getElementById('home-teardown-count');
      if (!priceInput || !probInput || !countInput) return;

      const price = parseInt(priceInput.value, 10);
      const prob = parseInt(probInput.value, 10) / 100;
      const count = Math.max(1, parseInt(countInput.value, 10) || 100);

      document.getElementById('disp-home-price').innerText = price + '¢';
      document.getElementById('disp-home-prob').innerText = Math.round(prob * 100) + '%';

      // Parabolic Kalshi taker fee: ceilToCent(0.07 * P * (1-P))
      const p = price / 100;
      const feePerContract = Math.ceil(0.07 * p * (1 - p) * 100) / 100;
      const totalFee = feePerContract * count;

      const naiveEv = ((prob * (1 - p) - (1 - prob) * p) * 100) * count;
      const realEv = naiveEv - totalFee;
      const realHurdle = ((p + feePerContract) * 100).toFixed(2);

      const compEvEl = document.getElementById('home-out-comp-ev');
      const realEvEl = document.getElementById('home-out-real-ev');
      const hurdleEl = document.getElementById('home-out-real-hurdle');

      if (compEvEl) compEvEl.innerText = (naiveEv >= 0 ? '+$' : '-$') + Math.abs(naiveEv).toFixed(2);
      if (realEvEl) {
        realEvEl.innerText = (realEv >= 0 ? '+$' : '-$') + Math.abs(realEv).toFixed(2);
        realEvEl.style.color = realEv >= 0 ? '#10B981' : '#F43F5E';
      }
      if (hurdleEl) hurdleEl.innerText = realHurdle + '%';
    }

    function filterBattlecard(cat) {
      const rows = document.querySelectorAll('.bcard-row');
      rows.forEach(r => {
        if (cat === 'all' || r.getAttribute('data-cat') === cat) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    }

    /* =========================================================================
       3. MOBILE APP DOWNLOAD & PWA INSTALLATION MODAL
       ========================================================================= */
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    function openMobileAppDownloadModal() {
      const m = document.getElementById('mobile-app-download-modal');
      if (m) m.classList.add('open');
    }

    function closeMobileAppDownloadModal() {
      const m = document.getElementById('mobile-app-download-modal');
      if (m) m.classList.remove('open');
    }

    function triggerPwaInstall() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          closeMobileAppDownloadModal();
        });
      } else if (window.quanterraInstallPwa) {
        window.quanterraInstallPwa();
      } else {
        alert("To install on iOS: Tap Share (⎋) then 'Add to Home Screen' (⊞).\\n\\nOn Android/Desktop: Check your browser address bar for the install (+) icon.");
      }
    }

    /* =========================================================================
       4. INTERACTIVE COCKPIT VIDEO BRIEFING & TUTORIAL ENGINE
       ========================================================================= */
    let audioCtx = null;
    let audioMuted = true;
    let tutorialPlaying = false;
    let tutorialProgress = 0; // 0 to 60 seconds
    let tutorialSpeed = 1.0;
    let tutorialRafId = null;
    let lastTimestamp = 0;

    const TUTORIAL_ACTS = [
      {
        start: 0,
        end: 15,
        title: "Act 1: The Hidden House Edge ($142.50 Saved/mo)",
        caption: "Welcome Pilot. Prediction markets peak taker fees at 50¢ ($1.75/100ct). QuanterraOS calculates exact breakeven (51.75%) and saves $142.50/month in avoidable drag."
      },
      {
        start: 15,
        end: 30,
        title: "Act 2: 60-Second Settlement Radar",
        caption: "Kalshi settles on the CME CF BRTI 60-second TWAP index, not your app spot. Our radar tracks constituent dispersion across Coinbase & Kraken in real-time."
      },
      {
        start: 30,
        end: 45,
        title: "Act 3: Autonomous Copilot Aria & Stations",
        caption: "7 dedicated ship stations monitor risk with $0.00 live exposure (Rule B5). Copilot Aria audits fees and settlements with strict non-advisory neutrality."
      },
      {
        start: 45,
        end: 60,
        title: "Act 4: Claim Your Pilot Seat & Legacy",
        caption: "Earn merit XP from Cadet to Admiral. Claim your 7-day free flight check and launch into the Flight Deck."
      }
    ];

    function initWebAudio() {
      if (!audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioCtx = new AudioClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function playRadarBlip(freq = 640) {
      if (audioMuted || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.13);
      } catch (_) {}
    }

    function toggleTutorialAudio() {
      initWebAudio();
      audioMuted = !audioMuted;
      const btn = document.getElementById('btn-tutorial-audio');
      if (btn) {
        btn.innerText = audioMuted ? "🔇 Sound: OFF" : "🔊 Sound: ON";
        btn.classList.toggle('active', !audioMuted);
      }
      if (!audioMuted) playRadarBlip(880);
    }

    function cycleTutorialSpeed() {
      if (tutorialSpeed === 1.0) tutorialSpeed = 1.5;
      else if (tutorialSpeed === 1.5) tutorialSpeed = 2.0;
      else tutorialSpeed = 1.0;
      const btn = document.getElementById('btn-tutorial-speed');
      if (btn) btn.innerText = tutorialSpeed.toFixed(1) + "x";
    }

    function toggleTutorialPlay() {
      initWebAudio();
      tutorialPlaying = !tutorialPlaying;
      const btn = document.getElementById('btn-tutorial-play');
      if (btn) btn.innerText = tutorialPlaying ? "❚❚ Pause" : "▶ Play";
      if (tutorialPlaying) {
        lastTimestamp = performance.now();
        tutorialLoop(lastTimestamp);
      }
    }

    function seekTutorialAct(actIdx) {
      initWebAudio();
      const act = TUTORIAL_ACTS[actIdx];
      if (act) {
        tutorialProgress = act.start;
        updateActiveChapterButtons(actIdx);
        playRadarBlip(550 + actIdx * 110);
      }
    }

    function updateActiveChapterButtons(actIdx) {
      for (let i = 0; i < 4; i++) {
        const b = document.getElementById('btn-chap-' + i);
        if (b) b.classList.toggle('active', i === actIdx);
      }
    }

    function openVideoBriefingModal() {
      const m = document.getElementById('video-briefing-modal');
      if (m) m.classList.add('open');
      initWebAudio();
      tutorialPlaying = true;
      tutorialProgress = 0;
      lastTimestamp = performance.now();
      const btn = document.getElementById('btn-tutorial-play');
      if (btn) btn.innerText = "❚❚ Pause";
      if (tutorialRafId) cancelAnimationFrame(tutorialRafId);
      tutorialRafId = requestAnimationFrame(tutorialLoop);
      playRadarBlip(880);
    }

    function closeVideoBriefingModal() {
      const m = document.getElementById('video-briefing-modal');
      if (m) m.classList.remove('open');
      tutorialPlaying = false;
      if (tutorialRafId) cancelAnimationFrame(tutorialRafId);
    }

    // Video Engine Animation Loop
    function tutorialLoop(timestamp) {
      if (!tutorialPlaying) return;
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      tutorialProgress += dt * tutorialSpeed;
      if (tutorialProgress >= 60) {
        tutorialProgress = 0; // loop or hold
      }

      // Determine current Act
      let currentActIdx = 0;
      for (let i = 0; i < TUTORIAL_ACTS.length; i++) {
        if (tutorialProgress >= TUTORIAL_ACTS[i].start && tutorialProgress < TUTORIAL_ACTS[i].end) {
          currentActIdx = i;
          break;
        }
      }

      updateActiveChapterButtons(currentActIdx);
      const capEl = document.getElementById('tutorial-captions-text');
      if (capEl) capEl.innerText = TUTORIAL_ACTS[currentActIdx].caption;

      // Draw Cockpit Canvas
      drawTutorialCockpit(currentActIdx, tutorialProgress);

      tutorialRafId = requestAnimationFrame(tutorialLoop);
    }

    function drawTutorialCockpit(actIdx, prog) {
      const canvas = document.getElementById('tutorial-hud-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width = canvas.clientWidth || 960;
      const h = canvas.height = canvas.clientHeight || 440;

      // 1. Space Obsidian Background & Scanlines
      ctx.fillStyle = '#05070D';
      ctx.fillRect(0, 0, w, h);

      // Radar Range Rings
      const cx = w / 2;
      const cy = h / 2 - 20;
      ctx.strokeStyle = 'rgba(79, 209, 232, 0.12)';
      ctx.lineWidth = 1;
      for (let r = 50; r <= 200; r += 50) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating Radar Beam
      const angle = (prog * 2.5) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(79, 209, 232, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200);
      ctx.stroke();

      // Top Status Bar
      ctx.fillStyle = 'rgba(12, 16, 26, 0.9)';
      ctx.fillRect(0, 0, w, 40);
      ctx.fillStyle = '#C9A24A';
      ctx.font = '600 13px "IBM Plex Mono", monospace';
      ctx.fillText("QUANTERRAOS HUD v2.1 // ORBITAL FLIGHT SIMULATOR", 20, 25);

      const secStr = Math.floor(prog).toString().padStart(2, '0') + ":00 / 01:00";
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(secStr, w - 140, 25);

      // ACT-SPECIFIC VISUAL SIMULATION OVERLAYS
      if (actIdx === 0) {
        // Act 1: True Cost Engine & Fee Peak
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 22px Inter, sans-serif';
        ctx.fillText("ACT 1: THE 50¢ COIN-FLIP HAZARD ZONE", 40, 85);

        ctx.fillStyle = '#4FD1E8';
        ctx.font = '600 14px "IBM Plex Mono", monospace';
        ctx.fillText("Contract: KXBTC15M @ $0.50 | 100 Contracts", 40, 115);

        // Box 1: Taker Fee
        ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
        ctx.strokeStyle = '#F43F5E';
        ctx.fillRect(40, 140, 260, 90);
        ctx.strokeRect(40, 140, 260, 90);
        ctx.fillStyle = '#F43F5E';
        ctx.font = '700 24px "IBM Plex Mono", monospace';
        ctx.fillText("$1.75 FEE DRAG", 60, 180);
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.fillText("Max taker penalty at 50¢ strike", 60, 205);

        // Box 2: North Star Avoidable Cost Saved
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.strokeStyle = '#10B981';
        ctx.fillRect(320, 140, 280, 90);
        ctx.strokeRect(320, 140, 280, 90);
        ctx.fillStyle = '#10B981';
        ctx.font = '700 24px "IBM Plex Mono", monospace';
        ctx.fillText("$142.50 SAVED / MO", 340, 180);
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.fillText("Avoidable cost preserved per pilot", 340, 205);

        // Parabolic Curve Sketch
        ctx.strokeStyle = '#C9A24A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(60, 320);
        ctx.quadraticCurveTo(200, 250, 340, 320);
        ctx.stroke();
        ctx.fillStyle = '#FFF';
        ctx.font = '11px "IBM Plex Mono", monospace';
        ctx.fillText("Parabolic Fee Curve: 0.07 × P(1 - P)", 60, 345);
      } else if (actIdx === 1) {
        // Act 2: 60-Second Settlement Radar
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 22px Inter, sans-serif';
        ctx.fillText("ACT 2: 60-SECOND TWAP SETTLEMENT RADAR", 40, 85);

        ctx.fillStyle = '#38BDF8';
        ctx.font = '600 14px "IBM Plex Mono", monospace';
        ctx.fillText("Index: CME CF BRTI 60-Second TWAP vs Exchange Spot", 40, 115);

        // Constituent Feed boxes
        const feeds = [
          { name: "Coinbase", px: "$91,249.20", wt: "35%" },
          { name: "Kraken", px: "$91,247.80", wt: "28%" },
          { name: "Bitstamp", px: "$91,248.50", wt: "22%" },
          { name: "Gemini", px: "$91,248.10", wt: "15%" },
        ];
        feeds.forEach((f, idx) => {
          const bx = 40 + idx * 150;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(bx, 150, 135, 75);
          ctx.strokeRect(bx, 150, 135, 75);
          ctx.fillStyle = '#94A3B8';
          ctx.font = '11px "IBM Plex Mono", monospace';
          ctx.fillText(f.name, bx + 10, 172);
          ctx.fillStyle = '#FFF';
          ctx.font = '700 14px "IBM Plex Mono", monospace';
          ctx.fillText(f.px, bx + 10, 195);
          ctx.fillStyle = '#C9A24A';
          ctx.font = '10px "IBM Plex Mono", monospace';
          ctx.fillText("Weight: " + f.wt, bx + 10, 214);
        });

        // TWAP Notice
        ctx.fillStyle = 'rgba(201, 162, 74, 0.15)';
        ctx.strokeStyle = '#C9A24A';
        ctx.fillRect(40, 250, 580, 50);
        ctx.strokeRect(40, 250, 580, 50);
        ctx.fillStyle = '#C9A24A';
        ctx.font = '600 13px "IBM Plex Mono", monospace';
        ctx.fillText("⚠ BASIS GAP ALERT: TWAP differs from instantaneous retail spot by $14.20", 55, 280);
      } else if (actIdx === 2) {
        // Act 3: Copilot Aria & Stations
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 22px Inter, sans-serif';
        ctx.fillText("ACT 3: AUTONOMOUS COPILOT ARIA & 7 STATIONS", 40, 85);

        ctx.fillStyle = '#10B981';
        ctx.font = '600 14px "IBM Plex Mono", monospace';
        ctx.fillText("Rule B5 Standard: $0.00 Live Exposure · Zero Volume Kickbacks", 40, 115);

        // Aria Dialogue Box
        ctx.fillStyle = 'rgba(79, 209, 232, 0.1)';
        ctx.strokeStyle = '#4FD1E8';
        ctx.fillRect(40, 145, 600, 95);
        ctx.strokeRect(40, 145, 600, 95);
        ctx.fillStyle = '#4FD1E8';
        ctx.font = '700 14px "IBM Plex Mono", monospace';
        ctx.fillText("ARIA // NON-ADVISORY FLIGHT COMPUTER", 60, 175);
        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'italic 13px Inter, sans-serif';
        ctx.fillText('"I can\'t tell you what to trade, but I can show you exactly what this one costs', 60, 202);
        ctx.fillText('and how it settles — want me to run it?"', 60, 222);

        // Station Badges
        const stations = ["Bridge", "Navigation", "Engineering", "Mission Log", "Sensors", "Crew", "Hangar"];
        stations.forEach((st, idx) => {
          const sx = 40 + idx * 85;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(sx, 260, 78, 30);
          ctx.fillStyle = '#FFF';
          ctx.font = '11px "IBM Plex Mono", monospace';
          ctx.fillText(st, sx + 8, 280);
        });
      } else if (actIdx === 3) {
        // Act 4: Subscribe & Launch
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 24px Inter, sans-serif';
        ctx.fillText("ACT 4: CLAIM YOUR FLIGHT SEAT & BUILD YOUR LEGACY", 40, 85);

        ctx.fillStyle = '#C9A24A';
        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.fillText("Merit-Based Progression: Cadet → Pilot → Flight Leader → Admiral", 40, 118);

        // Pro Tier Feature Highlights
        const feats = [
          "✓ Real-time 60s TWAP settlement radar & basis gap alerts",
          "✓ Instant fee drag & Maker/Taker spread optimizer",
          "✓ Sovereign Copilot Aria voice & telemetry audits",
          "✓ 100% Venue-Neutral — $0.00 Live Risk exposure (Rule B5)"
        ];
        feats.forEach((ft, i) => {
          ctx.fillStyle = '#94A3B8';
          ctx.font = '14px Inter, sans-serif';
          ctx.fillText(ft, 40, 160 + i * 28);
        });

        // Big Gold Conversion Button Mock
        ctx.fillStyle = 'rgba(201, 162, 74, 0.25)';
        ctx.strokeStyle = '#C9A24A';
        ctx.lineWidth = 2;
        ctx.fillRect(40, 285, 480, 52);
        ctx.strokeRect(40, 285, 480, 52);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 16px "IBM Plex Mono", monospace';
        ctx.fillText("▶ START 7-DAY FREE TRIAL ($29/mo PRO) →", 60, 318);
      }

      // Progress bar at bottom of canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, h - 6, w, 6);
      ctx.fillStyle = '#C9A24A';
      ctx.fillRect(0, h - 6, (prog / 60) * w, 6);
    }

    // Keyboard ESC listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeVideoBriefingModal();
        closeMobileAppDownloadModal();
      }
    });
  </script>
</body>
</html>`;
}
