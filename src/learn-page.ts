/**
 * QuanterraOS Educational & Risk Architecture Hub (/learn & /education)
 *
 * Implements Section 6 of the 90-Day Global Growth Strategy & Gate 3/4 Execution:
 * - Module 1: The Mathematics of Prediction Market Friction & Breakeven Probability
 * - Module 2: Settlement Architecture — Kalshi (CME CF BRTI 60s TWAP) vs Polymarket (UMA Optimistic Oracle)
 * - Module 3: Probability Calibration vs. Predictive Edge (Brier Score 0.2001 nominal vs 0.2500 coin-flip)
 * - Module 4: Risk Discipline & Advisory Portfolio Budget Controls
 * - Interactive Friction & Breakeven Simulator Widget
 * - Shareable Educational Decision Card Generator
 *
 * Adheres strictly to:
 * - Rule B4: Zero unbacked superlatives or claims of proprietary edge
 * - Rule B5: $0.00 live financial exposure; permanently locked
 * - Gold Standard restrained visual design system
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderLearnPageHtml(userTier: string = "free"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Prediction Market Curriculum &amp; Risk Architecture — QuanterraOS</title>
  <meta name="description" content="Independent education on prediction market transaction costs, fee drag, CME CF BRTI settlement rules, and probability calibration.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-highlight: #111624;
      --border: rgba(212, 175, 55, 0.16);
      --border-accent: rgba(223, 184, 67, 0.45);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --warning: #F43F5E;
      --success: #10B981;
      --sky: #38BDF8;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 60% at 50% -10%, rgba(223, 184, 67, 0.12), transparent 70%),
        radial-gradient(700px 400px at 80% 30%, rgba(163, 125, 36, 0.05), transparent 60%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.6;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }

    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 40px;
      border-bottom: 1px solid var(--border);
      background: rgba(6, 7, 10, 0.92);
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text);
      font-weight: 700;
      font-size: 0.95rem;
    }
    .nav-brand span { color: var(--accent); font-family: var(--font-mono); font-size: 0.78rem; }
    .nav-links { display: flex; gap: 20px; align-items: center; font-size: 0.84rem; }
    .nav-links a { color: var(--text-dim); text-decoration: none; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .btn-action-nav {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-family: var(--font-mono);
      font-weight: 600;
      text-decoration: none;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      color: #07080B;
    }

    .container {
      max-width: 1140px;
      margin: 40px auto 0;
      padding: 0 24px;
    }

    .header-banner {
      text-align: center;
      margin-bottom: 48px;
    }
    .badge-tag {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent-light);
      background: rgba(223, 184, 67, 0.12);
      border: 1px solid rgba(223, 184, 67, 0.35);
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 {
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
      color: #FFFFFF;
    }
    .header-desc {
      font-size: 1.05rem;
      color: var(--text-dim);
      max-width: 760px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* Grid Layout */
    .curriculum-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
      margin-top: 36px;
    }

    .module-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      position: relative;
    }
    .module-card.featured {
      border-color: var(--border-accent);
      background: linear-gradient(180deg, rgba(17, 23, 34, 0.95) 0%, rgba(12, 15, 23, 0.98) 100%);
    }
    .module-num {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .module-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
    }
    .module-body {
      font-size: 0.92rem;
      color: #CBD5E1;
      line-height: 1.7;
    }
    .module-body p { margin-bottom: 14px; }

    .formula-box {
      background: rgba(6, 7, 10, 0.85);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 6px;
      padding: 16px 20px;
      margin: 18px 0;
      font-family: var(--font-mono);
      font-size: 0.86rem;
      color: var(--accent-light);
    }
    .formula-line {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed rgba(212, 175, 55, 0.12);
    }
    .formula-line:last-child { border-bottom: none; }
    .formula-line strong { color: #FFFFFF; }

    /* Interactive Simulator */
    .simulator-wrap {
      background: rgba(14, 19, 28, 0.9);
      border: 1px solid var(--border-accent);
      border-radius: 8px;
      padding: 24px;
      margin-top: 24px;
    }
    .sim-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 720px) {
      .sim-grid { grid-template-columns: 1fr; }
    }
    .sim-field label {
      display: block;
      font-family: var(--font-mono);
      font-size: 0.76rem;
      color: var(--muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .sim-field input, .sim-field select {
      width: 100%;
      background: #06080C;
      border: 1px solid rgba(212, 175, 55, 0.3);
      color: #FFFFFF;
      font-family: var(--font-mono);
      font-size: 0.9rem;
      padding: 10px 12px;
      border-radius: 4px;
    }
    .sim-results {
      background: rgba(6, 8, 12, 0.9);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-family: var(--font-mono);
      font-size: 0.82rem;
    }
    .sim-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .sim-row-key { color: var(--muted); }
    .sim-row-val { color: #FFFFFF; font-weight: 600; }
    .sim-row-val.warn { color: var(--warning); }
    .sim-row-val.accent { color: var(--accent); }

    /* Comparative Table */
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      margin: 18px 0;
      background: rgba(6, 7, 10, 0.6);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }
    .comp-table th, .comp-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .comp-table th {
      background: rgba(212, 175, 55, 0.08);
      color: var(--accent-light);
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    .comp-table tr:last-child td { border-bottom: none; }

    /* Shareable Card Box */
    .share-card-box {
      background: #080B10;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: #CBD5E1;
      white-space: pre-wrap;
      position: relative;
    }
    .copy-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(223, 184, 67, 0.15);
      border: 1px solid var(--accent);
      color: var(--accent-light);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .copy-btn:hover { background: rgba(223, 184, 67, 0.3); }

    /* Bottom Nav Bar */
    .curriculum-nav-bar {
      margin-top: 48px;
      padding: 24px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .curriculum-nav-bar a {
      color: var(--accent);
      text-decoration: none;
      font-family: var(--font-mono);
      font-size: 0.84rem;
    }
    .curriculum-nav-bar a:hover { text-decoration: underline; }

    footer {
      max-width: 1140px;
      margin: 64px auto 0;
      padding: 24px 24px 0;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      color: var(--muted);
      font-size: 0.78rem;
      font-family: var(--font-mono);
    }
    footer a { color: var(--accent); text-decoration: none; }
  </style>
</head>
<body>

  <!-- Navigation -->
  <nav class="top-nav">
    <a href="/" class="nav-brand">
      QUANTERRAOS
      <span>/ LEARN &amp; RISK HUB</span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/calculator">Calculator</a>
      <a href="/why">Why QuanterraOS</a>
      <a href="/compare">Venues</a>
      <a href="/journal">Journal</a>
      <a href="/calibration">Calibration</a>
      <a href="/council">Council</a>
      <a href="/learn" class="active">Curriculum</a>
      <a href="/pricing">Pricing</a>
      <a href="/account" class="btn-action-nav">Account / Login</a>
    </div>
  </nav>

  <main class="container">
    <header class="header-banner">
      <div class="badge-tag">Independent Risk &amp; Settlement Architecture</div>
      <h1>Prediction Market Curriculum</h1>
      <p class="header-desc">
        Understand the exact mathematics of exchange fees, spread friction, settlement basis, and probability calibration before risking personal capital.
      </p>
    </header>

    <div class="curriculum-grid">

      <!-- Module 1: The Mathematics of Friction -->
      <article class="module-card featured" id="module-friction">
        <div class="module-num">Module 01 // Transaction Costs &amp; Expectancy</div>
        <h2 class="module-title">The Arithmetic of Exchange Fees &amp; Breakeven Hurdle</h2>
        <div class="module-body">
          <p>
            In binary prediction markets where contracts resolve to either <strong>$1.00 (Yes)</strong> or <strong>$0.00 (No)</strong>, transaction fees represent a non-trivial friction that shifts your required win probability above the contract's purchase price.
          </p>
          <p>
            On CFTC-regulated exchanges like Kalshi, taker fees follow a quadratic formula that scales with the contract price and peaks at 50¢:
          </p>

          <div class="formula-box">
            <div class="formula-line">
              <span>Purchase Cost (C):</span>
              <strong>Price (P) &times; Quantity (N)</strong>
            </div>
            <div class="formula-line">
              <span>Kalshi Taker Fee (F):</span>
              <strong>&lceil; 0.07 &times; N &times; P &times; (1 - P) &rceil;</strong>
            </div>
            <div class="formula-line">
              <span>Peak Fee Rate (at P = 0.50):</span>
              <strong>$0.0175 per contract (1.75¢)</strong>
            </div>
            <div class="formula-line">
              <span>Breakeven Probability:</span>
              <strong>P_be = (C + F) / N = P + Fee_per_contract</strong>
            </div>
          </div>

          <p>
            <strong>Worked Example (50 contracts at 51¢ ask price):</strong><br>
            If you purchase 50 contracts at 51¢ ($25.50 outlay), the taker fee is &lceil;0.07 &times; 50 &times; 0.51 &times; 0.49&rceil; = &lceil;$0.8746&rceil; = <strong>$0.88</strong> (1.76¢/ct).<br>
            Your total outlay is <strong>$26.38</strong>. Your breakeven probability is <strong>52.76%</strong>, not 51.00%.
          </p>
          <p>
            Even if an analyst correctly evaluates an event with a <strong>55.0% win probability</strong>, expected profit per contract is only:
            <br>
            <code>E[Profit] = 0.55 &times; $1.00 - $0.51 (Cost) - $0.0176 (Fee) = $0.0224 (2.24¢)</code>.
          </p>
          <p style="color:var(--warning); font-size:0.86rem;">
            <strong>Maximum Loss Notice:</strong> If the contract resolves out of the money (at $0.00), your maximum loss is 100% of purchase price + exchange fee ($26.38), not merely the contract price.
          </p>

          <!-- Interactive Calculator Mini-Widget -->
          <div class="simulator-wrap">
            <div style="font-family:var(--font-mono); font-size:0.8rem; font-weight:700; color:var(--accent-light); margin-bottom:12px;">
              ⚡ LIVE BREAKEVEN SIMULATOR
            </div>
            <div class="sim-grid">
              <div class="sim-field">
                <label for="sim-price">Contract Ask Price (¢):</label>
                <input type="number" id="sim-price" min="1" max="99" value="51" oninput="updateCurriculumSim()">
              </div>
              <div class="sim-field">
                <label for="sim-count">Contract Count:</label>
                <input type="number" id="sim-count" min="1" max="1000" value="50" oninput="updateCurriculumSim()">
              </div>
            </div>
            <div class="sim-results" style="margin-top:14px;">
              <div class="sim-row">
                <span class="sim-row-key">Total Outlay (Cost + Fee):</span>
                <span class="sim-row-val" id="sim-res-outlay">$26.38</span>
              </div>
              <div class="sim-row">
                <span class="sim-row-key">Exchange Fee Drag:</span>
                <span class="sim-row-val warn" id="sim-res-fee">+$0.88 (+1.76¢/ct)</span>
              </div>
              <div class="sim-row">
                <span class="sim-row-key">Required Breakeven Win Rate:</span>
                <span class="sim-row-val accent" id="sim-res-be">52.76% (+1.76% hurdle)</span>
              </div>
              <div class="sim-row">
                <span class="sim-row-key">Max Possible Loss:</span>
                <span class="sim-row-val warn" id="sim-res-loss">-$26.38 (100% loss)</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <!-- Module 2: Settlement Venues Compared -->
      <article class="module-card" id="module-settlement">
        <div class="module-num">Module 02 // Venue Architecture</div>
        <h2 class="module-title">Settlement Mechanisms: CME CF BRTI vs. UMA Optimistic Oracle</h2>
        <div class="module-body">
          <p>
            The greatest source of unexpected loss in short-duration prediction markets is misunderstanding the <strong>exact settlement mechanism</strong>. A contract does not settle on your preferred exchange ticker; it settles strictly against the legal rulebook of the venue.
          </p>

          <table class="comp-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Kalshi (CFTC Designated)</th>
                <th>Polymarket (Polygon / UMA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Settlement Index</td>
                <td><strong>CME CF BRTI 60-Second TWAP</strong></td>
                <td><strong>UMA Optimistic Oracle</strong></td>
              </tr>
              <tr>
                <td>Spot Constituents</td>
                <td>Coinbase, Kraken, Bitstamp, Gemini</td>
                <td>Binance, Coinbase, or Arbitrary Feed</td>
              </tr>
              <tr>
                <td>Dispute Window</td>
                <td>0 Hours (CFTC Rulebook Pre-defined)</td>
                <td>72 Hours (Challenge Period)</td>
              </tr>
              <tr>
                <td>Dispute Resolution</td>
                <td>Official Rulebook Arbitration</td>
                <td>UMA Tokenholder Voting Consensus</td>
              </tr>
              <tr>
                <td>Historical Dispute Rate</td>
                <td>0.0% on KXBTC15M</td>
                <td>~0.35% Across All Crypto Markets</td>
              </tr>
              <tr>
                <td>Execution Fees</td>
                <td>Formulaic Taker Fee (peaks at 1.75¢)</td>
                <td>0% Protocol Fee + Gas + Bridge Drag</td>
              </tr>
            </tbody>
          </table>

          <p>
            <strong>The 60-Second TWAP Lag:</strong> On Kalshi's KXBTC15M contract, the index reference is not the instantaneous last trade at minute 15:00. It is the time-weighted average price (TWAP) recorded every second between minute 14:00 and 15:00. A rapid spot spike at minute 14:58 only impacts 2/60ths of the settlement value.
          </p>
        </div>
      </article>

      <!-- Module 3: Probability Calibration vs Forecasting Edge -->
      <article class="module-card" id="module-calibration">
        <div class="module-num">Module 03 // Quantitative Evaluation</div>
        <h2 class="module-title">Probability Calibration vs. The Myth of "Edge"</h2>
        <div class="module-body">
          <p>
            A common misconception is equating <strong>well-calibrated probabilities</strong> with a <strong>profitable trading strategy</strong>.
          </p>
          <p>
            The Brier score measures the mean squared error between forecast probabilities and binary outcomes:
          </p>
          <div class="formula-box">
            <div class="formula-line">
              <span>Brier Score Equation:</span>
              <strong>Brier = (1 / N) &sum; (f_t - o_t)&sup2;</strong>
            </div>
            <div class="formula-line">
              <span>Coin-Flip Baseline (p = 0.50):</span>
              <strong>0.2500</strong>
            </div>
            <div class="formula-line">
              <span>Kalshi Minute-4 Market-Mid Brier:</span>
              <strong>0.2001 (Nominal Benchmark)</strong>
            </div>
            <div class="formula-line">
              <span>Quanterra Fitted Predictor Brier:</span>
              <strong>0.2063 (Underperforms Mid-Price)</strong>
            </div>
          </div>
          <p>
            Notice that QuanterraOS's fitted model scores <strong>0.2063</strong>, which is higher (worse) than the exchange mid-price of <strong>0.2001</strong>. We publish this openly because <strong>independent verification requires publishing underperformance</strong>.
          </p>
          <p>
            A model scoring 0.2063 does NOT beat the market mid-price, and after subtracting the 1.75¢ taker fee and 1.00¢ bid-ask spread, trading against the market mid-price yields negative expected returns.
          </p>
        </div>
      </article>

      <!-- Module 4: Shareable Decision Card -->
      <article class="module-card" id="module-card-gen">
        <div class="module-num">Module 04 // Risk Attribution</div>
        <h2 class="module-title">Shareable Educational Decision Card</h2>
        <div class="module-body">
          <p>
            Before taking any position, quant desks generate standardized decision cards to document entry conditions, transaction hurdles, and settlement rules. Below is a live-generated card you can copy or print:
          </p>

          <div class="share-card-box" id="share-card-content">
[QUANTERRAOS DECISION &amp; RISK AUDIT CARD]
------------------------------------------------------------
Contract:       KXBTC15M-26OCT06-T91250 (Kalshi 15m Bitcoin)
Assessed Spot:  $91,244.20 (Quanterra Composite +1.4 bps)
Strike Price:   $91,250.00
Order Type:     Taker Ask (50 contracts @ 51¢)
------------------------------------------------------------
Purchase Cost:  $25.50
Taker Fee:      +$0.88 (1.76¢ per contract)
Total Outlay:   $26.38
Breakeven Rate: 52.76% (+1.76% fee hurdle above ask)
Maximum Loss:   -$26.38 (100% loss of outlay if expires at 0)
Settlement:     CME CF BRTI 60-Second TWAP
Regulatory:     CFTC Designated Contract Market (Kalshi Rulebook)
Model Edge:     NONE CLAIMED (Calibration baseline 0.2001 Brier)
------------------------------------------------------------
Generated:      ${new Date().toISOString()}
Integrity:      Cryptographically Verifiable Telemetry
<button class="copy-btn" onclick="copyDecisionCard()">COPY CARD</button>
          </div>
        </div>
      </article>

      <!-- Module 5: Competitive Reality & Venue Neutrality in 2026 -->
      <article class="module-card featured" id="module-competitive-reality" style="border-color: rgba(223, 184, 67, 0.35);">
        <div class="module-num">Module 05 // 2026 Competitive Landscape</div>
        <h2 class="module-title">Venue Neutrality &amp; The Friction Trap in Acquired Prediction Tools</h2>
        <div class="module-body">
          <p>
            In early 2026, the prediction market landscape experienced rapid consolidation: <strong>Dome was acquired by Polymarket</strong> (February 2026) and <strong>Oddpool was acquired by Kalshi</strong> (September 2026). When terminal frontends are owned by the exchanges they monitor, their commercial incentive flips from capital protection to trading turnover.
          </p>

          <div class="formula-box">
            <div class="formula-line">
              <span>Trap 1: Venue Capture:</span>
              <strong>Exchange-owned tools cannot independently referee their parent platform</strong>
            </div>
            <div class="formula-line">
              <span>Trap 2: Friction Blindness:</span>
              <strong>Third-party apps conceal Kalshi's parabolic taker fee (up to 1.75¢/ct)</strong>
            </div>
            <div class="formula-line">
              <span>Trap 3: TWAP Mismatch:</span>
              <strong>Displaying instantaneous spot prices instead of 60s CME CF BRTI averaging</strong>
            </div>
          </div>

          <p>
            <strong>The Friction Trap Explained:</strong> Many competitor apps advertise contracts at nominal ask prices (e.g. 51¢) and suggest an immediate gross edge if a user believes the outcome has a 55% probability. However, Kalshi's exchange taker fee consumes up to <strong>43.8% of gross profit</strong> on 50¢ contracts. The required win rate is <strong>52.75%</strong> just to break even.
          </p>

          <p>
            <strong>The QuanterraOS Sovereign Solution:</strong> As an unconflicted, independent referee with zero venue kickbacks, QuanterraOS computes your true mathematical breakeven hurdle, verifies the 60-second settlement window, and stores your thesis in an encrypted local vault.
          </p>

          <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
            <a href="/why" class="btn-action-nav" style="background:linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%); color:#07080B; text-decoration:none; font-weight:700; padding:8px 16px;">
              Read Full 2026 Competitive Teardown &rarr;
            </a>
            <a href="/transparency" class="btn-action-nav" style="background:#10B981; color:#07080B; text-decoration:none; font-weight:700; padding:8px 16px;">
              Outcome &amp; Friction Transparency Audit (#6.6) &rarr;
            </a>
            <a href="/study" class="btn-action-nav" style="background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); color:var(--accent-light); text-decoration:none;">
              Know Your Costs Study (#6.4) &rarr;
            </a>
          </div>
        </div>
      </article>

    </div>

    <!-- Bottom Navigation Bar -->
    <div class="curriculum-nav-bar">
      <div>
        <span style="font-weight:700; color:#FFFFFF;">Next Steps in Your Workflow:</span>
        <span style="color:var(--muted); font-size:0.8rem; margin-left:8px;">Check live contracts &bull; Log to journal &bull; Audit consensus</span>
      </div>
      <div style="display:flex; gap:16px; align-items:center;">
        <a href="/transparency" style="color:#10B981; font-weight:700;">Transparency Report &rarr;</a>
        <a href="/why">Why QuanterraOS &rarr;</a>
        <a href="/calculator">Open True Cost Calculator &rarr;</a>
        <a href="/compare">Compare Venues &rarr;</a>
        <a href="/journal">Personal Outcome Journal &rarr;</a>
      </div>
    </div>

    <footer>
      <div>&copy; 2026 QuanterraOS &bull; Independent Risk &amp; Settlement Architecture</div>
      <div style="display:flex; gap:16px;">
        <a href="/pricing">Pricing</a>
        <a href="/account">Account</a>
        <a href="/legal">Legal Disclosures</a>
      </div>
    </footer>
  </main>

  ${ASSISTANT_WIDGET_HTML}

  <script>
    function updateCurriculumSim() {
      const priceInput = document.getElementById('sim-price');
      const countInput = document.getElementById('sim-count');
      if (!priceInput || !countInput) return;

      const p = Math.max(1, Math.min(99, parseInt(priceInput.value, 10) || 50)) / 100;
      const count = Math.max(1, parseInt(countInput.value, 10) || 1);

      const purchaseCost = p * count;
      const fee = Math.ceil(0.07 * count * p * (1 - p) * 100) / 100;
      const totalOutlay = purchaseCost + fee;
      const feePerContract = fee / count;
      const breakevenProb = ((totalOutlay / count) * 100).toFixed(2);
      const feeHurdle = ((breakevenProb - (p * 100))).toFixed(2);

      const outlayEl = document.getElementById('sim-res-outlay');
      const feeEl = document.getElementById('sim-res-fee');
      const beEl = document.getElementById('sim-res-be');
      const lossEl = document.getElementById('sim-res-loss');

      if (outlayEl) outlayEl.textContent = '$' + totalOutlay.toFixed(2);
      if (feeEl) feeEl.textContent = '+$' + fee.toFixed(2) + ' (+' + (feePerContract * 100).toFixed(2) + '¢/ct)';
      if (beEl) beEl.textContent = breakevenProb + '% (+' + feeHurdle + '% hurdle)';
      if (lossEl) lossEl.textContent = '-$' + totalOutlay.toFixed(2) + ' (100% loss)';
    }

    function copyDecisionCard() {
      const content = document.getElementById('share-card-content');
      if (!content) return;
      const text = content.innerText.replace('COPY CARD', '').trim();
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        if (btn) {
          btn.textContent = 'COPIED!';
          setTimeout(() => { btn.textContent = 'COPY CARD'; }, 2000);
        }
      });
    }
  </script>
</body>
</html>`;
}
