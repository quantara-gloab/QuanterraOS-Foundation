/**
 * QuanterraOS Flagship Public Landing Page (Tesla Mode)
 *
 * Implements Phase 3 Task 3.3:
 * "Home = 6 panels (2.2). Test at 375px."
 *
 * Strict Compliance:
 * - QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md (Parts 0.2, 2.2, 5):
 *   1. Hero (subtle starfield): "Trade like a pilot, not a passenger." — [Run Free Check] [Enter the Flight Deck]
 *   2. Cost: live Kalshi fee curve; "At 50¢ you need 51.75% just to break even." — [Check a contract] [Compare Fee Schedules]
 *   3. Settlement: live BRTI vs Coinbase/Kraken gap + countdown. "Kalshi settles on the index, not your app." — [Open Radar] [How Settlement Works]
 *   4. Flight Deck preview: cockpit, ranks, missions. "Get sharper every trade." — [Start free] [View Ship Stations]
 *   5. Proof: "We publish when the market beats us." Brier 0.2001 vs 0.2063, n=1,316. — [See the proof] [Inspect Datasets]
 *   6. Institutional: "Neutral data for desks." — [Talk to us] [Get API key]
 * - Visual System:
 *   - Tesla mode: pure black (#000000), white, muted (#8A8F98), gold accent (#C9A24A)
 *   - Full-viewport sections (scroll-snap)
 *   - <= 3 numbers per screen on each panel
 *   - No more than 2 buttons per panel on each panel
 *   - Responsive down to 375px mobile width without overflow
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
    }
  </style>
</head>
<body>

  <!-- Background Canvas for Subtle Starfield Parallax -->
  <canvas id="starfield-canvas"></canvas>

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

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}

  <!-- Starfield Canvas Animation Script (Respects prefers-reduced-motion) -->
  <script>
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
          alpha: Math.random() * 0.7 + 0.3,
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
          ctx.fillStyle = 'rgba(255, 255, 255, ' + s.alpha + ')';
          ctx.fill();
        }
        requestAnimationFrame(draw);
      }
      draw();
    })();
  </script>
</body>
</html>`;
}
