/**
 * QuanterraOS Educational Discovery Pages Module
 * 
 * Implements Days 8–14 of the 90-Day Sprint:
 * - /learn/fees: Clear guide to prediction market fees, taker friction & scaling
 * - /learn/breakeven: Clear guide to true breakeven win rates vs stated price
 * - /learn/settlement: Clear guide to settlement mechanisms (CME CF BRTI 60s TWAP vs UMA Oracle)
 * - /learn/journal: Clear guide to systematic pre-trade journaling and statement reconciliation
 * 
 * Each page includes a relevant interactive Free Check with source attribution.
 * Adheres to Rule B4 (zero marketing superlatives) and Rule B5 ($0.00 capital lock).
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export type EducationTopic = "fees" | "breakeven" | "settlement" | "journal";

interface TopicContent {
  title: string;
  subtitle: string;
  badge: string;
  summary: string;
  sourceAttribution: string;
  sections: Array<{
    heading: string;
    body: string;
    bullets?: string[];
  }>;
  interactiveDefaultPrice: number;
  interactiveDefaultProb: number;
  interactiveDefaultVenue: string;
  exampleExplanation: string;
}

const TOPICS_DATA: Record<EducationTopic, TopicContent> = {
  fees: {
    title: "Prediction Market Fees: The Mathematical Drag of Taker Friction",
    subtitle: "Why trading contracts at nominal prices erodes capital without active fee awareness",
    badge: "Exchange Microstructure · Fee Drag Analysis",
    summary: "Exchange fees in binary prediction markets are not flat percentages like equity brokerages. On Kalshi, taker fees follow a parabolic curve based on contract probability, while on Polymarket, fees include fixed base network gas and dynamic liquidity fees.",
    sourceAttribution: "Kalshi Rulebook Chapter 3 (CFTC Regulated Exchange Fee Schedule) & CME CF Bitcoin Reference Rate Methodology",
    interactiveDefaultPrice: 51,
    interactiveDefaultProb: 55,
    interactiveDefaultVenue: "kalshi-15m",
    exampleExplanation: "On Kalshi, taker fees follow the formula Fee = $0.07 × P × (1 - P). For a 50¢ or 51¢ contract, this equals approximately 1.75¢ to 1.80¢ per contract (a 3.5% immediate friction penalty on entry).",
    sections: [
      {
        heading: "1. The Parabolic Taker Fee Curve",
        body: "Contracts trading near 50¢ maximize outcome uncertainty and carry the highest absolute taker fees (1.75¢–1.80¢ per contract). Contracts trading near 5¢ or 95¢ carry lower absolute fees (around 0.33¢), but represent a massive percentage of the capital at risk for deep out-of-the-money positions.",
        bullets: [
          "50¢ contract: Fee is ~$0.0175/ct (3.5% transaction friction)",
          "20¢ contract: Fee is ~$0.0112/ct (5.6% transaction friction)",
          "10¢ contract: Fee is ~$0.0063/ct (6.3% transaction friction)",
          "5¢ contract: Fee is ~$0.0033/ct (6.6% transaction friction)"
        ]
      },
      {
        heading: "2. The Maker vs Taker Asymmetry",
        body: "Resting limit orders (makers) pay zero taker fees or earn passive maker rebates during liquidity campaigns. Traders executing aggressive market orders or crossing the spread pay the full taker fee immediately upon fill. Over 100 trades, crossing the spread at 50¢ incurs $180 in fee drag per 100 contracts.",
        bullets: [
          "Always audit whether an aggressive entry is required or if a resting limit bid is feasible.",
          "Factor the fee into your minimum required price before clicking submit.",
          "Never assume a 50/50 coin flip requires a 50% win rate to break even."
        ]
      }
    ]
  },
  breakeven: {
    title: "The True Breakeven Probability: Why a 50% Win Rate Guarantees Loss",
    subtitle: "Understanding how exchange fees shift your required mathematical hurdle rate",
    badge: "Probability & Risk Architecture",
    summary: "In prediction markets, winning half your trades does not mean you break even. To calculate your actual breakeven win probability, you must add total fee drag directly to your purchase cost.",
    sourceAttribution: "QuanterraOS Mathematical Calibration Ledger & Empirical Decile Verification (1,316 settled windows)",
    interactiveDefaultPrice: 50,
    interactiveDefaultProb: 54,
    interactiveDefaultVenue: "kalshi-15m",
    exampleExplanation: "Buying a contract at 50¢ with a 1.75¢ taker fee means your total cost is 51.75¢. If a winning payout is $1.00, your required breakeven win rate is (50 + 1.75)% = 51.75%. Any trader winning only 50% will lose 1.75¢ per contract traded.",
    sections: [
      {
        heading: "1. The True Breakeven Equation",
        body: "The required breakeven probability ($p_{be}$) for any binary contract resolving to $1.00 is defined as: p_be = Price_ask + Fee_taker + Slippage. If your assessed win probability does not comfortably exceed this hurdle rate, entering the contract produces negative arithmetic expected value.",
        bullets: [
          "Purchased at 51¢ + 1.80¢ Fee = 52.80% Required Breakeven",
          "Purchased at 60¢ + 1.68¢ Fee = 61.68% Required Breakeven",
          "Purchased at 75¢ + 1.31¢ Fee = 76.31% Required Breakeven"
        ]
      },
      {
        heading: "2. The Mirage of 'Cheap' Edge",
        body: "Many retail participants believe that forecasting an outcome with 53% confidence gives them a 3% edge over a 50¢ market price. In reality, after paying the 1.75¢ fee, the net edge is only 53% - 51.75% = 1.25%. If execution slips by even 1¢, the expected profit drops to virtually zero.",
        bullets: [
          "Always verify your hurdle rate prior to placing an order.",
          "Independent calculation isolates your real hurdle from marketing illusions.",
          "Use the True-Cost Check tool below to verify any price point."
        ]
      }
    ]
  },
  settlement: {
    title: "Settlement Reference Architecture: CME CF BRTI vs UMA Oracle",
    subtitle: "How reference prices are aggregated, windowed, and verified at expiration",
    badge: "Settlement Oracles & Verification",
    summary: "Prediction contracts settle based on external index sources. Kalshi BTC contracts resolve against the CME CF Bitcoin Real-Time Index (BRTI) using a 60-second Time-Weighted Average Price (TWAP), while Polymarket resolves using the UMA Optimistic Oracle with a 2-hour dispute window.",
    sourceAttribution: "CME CF BRTI Benchmark Methodology (UK BMR Regulated) & UMA Protocol Optimistic Oracle v3 Specification",
    interactiveDefaultPrice: 52,
    interactiveDefaultProb: 56,
    interactiveDefaultVenue: "kalshi-15m",
    exampleExplanation: "The CME CF BRTI gathers spot trade executions from Coinbase, Kraken, Bitstamp, and Gemini across 12 consecutive 5-second sub-intervals during the final minute before contract expiry.",
    sections: [
      {
        heading: "1. Kalshi: CME CF BRTI 60-Second TWAP",
        body: "Kalshi does not look at a single exchange or an instantaneous snapshot. The BRTI settlement price is calculated by observing trades on regulated constituent exchanges during the final 60 seconds of the contract window (minute 14:00 to 15:00 for 15-minute contracts).",
        bullets: [
          "Constituent exchanges: Coinbase, Kraken, Bitstamp, Gemini",
          "Partitioning: 12 five-second observation partitions",
          "Resistant to single-exchange flash crashes or manipulation attempts"
        ]
      },
      {
        heading: "2. Polymarket: UMA Optimistic Oracle",
        body: "Polymarket contracts resolve on the Polygon blockchain via UMA's Optimistic Oracle. A proposer submits an answer with a bond. If no dispute occurs within the 2-hour challenge period, the answer is finalized. If challenged, UMA tokenholders vote on the dispute.",
        bullets: [
          "Challenge period: Typically 2 hours post-market close",
          "Dispute resolution: Decentralized tokenholder escalation vote",
          "Currency basis: Settled in USDC on Polygon network"
        ]
      }
    ]
  },
  journal: {
    title: "Systematic Decision Journaling: The Discipline of Recording Your Premise",
    subtitle: "Why professional risk managers separate pre-trade hypothesis from outcome luck",
    badge: "Cognitive Science & Risk Governance",
    summary: "A decision journal is not a spreadsheet of past wins and losses. It is a pre-commitment tool designed to capture your exact reasoning, confidence level, and risk boundary before market noise can retroactively rewrite your memory.",
    sourceAttribution: "QuanterraOS Decision Science Framework & Cognitive Bias Auditing Standards",
    interactiveDefaultPrice: 51,
    interactiveDefaultProb: 55,
    interactiveDefaultVenue: "kalshi-15m",
    exampleExplanation: "By writing down 'I expect BTC to hold $63,480 support with 55% probability because CME spot basis is compressed' before entering, you prevent hindsight bias from convincing you that a win was obvious or that a loss was someone else's fault.",
    sections: [
      {
        heading: "1. Overcoming Hindsight & Outcome Bias",
        body: "In short-duration prediction markets, bad decisions frequently win and great decisions frequently lose due to probabilistic variance. If you judge decisions solely by P&L, you reinforce erratic habits. The Decision Journal audits the quality of your reasoning before the outcome is known.",
        bullets: [
          "Record your explicit stated probability (p) before order entry",
          "Quantify the exact fee hurdle and maximum loss risk",
          "Note external market conditions (spot basis, spread width, momentum)"
        ]
      },
      {
        heading: "2. Reconciling Statement Proof with Realized Calibration",
        body: "When your broker statement is imported, QuanterraOS reconciles your executed fill price and fees against your original check. Over 50 to 100 trades, your personal calibration curve is computed, showing whether you are consistently overconfident, underconfident, or well-calibrated.",
        bullets: [
          "Track personal Brier score across settled contracts",
          "Audit whether fee drag eroded otherwise sound directional ideas",
          "Receive optional weekly reviews to maintain discipline"
        ]
      }
    ]
  }
};

export function renderEducationalPageHtml(topic: EducationTopic): string {
  const content = TOPICS_DATA[topic] || TOPICS_DATA.fees;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS Learn">
  <title>${content.title} — QuanterraOS Discovery</title>
  <meta name="description" content="${content.subtitle}. Educational reference with interactive friction calculator and empirical calibration verification.">
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
      --gold-bullion: #D4AF37;
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --warning: #F43F5E;
      --success: #10B981;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 50% at 50% -10%, rgba(223, 184, 67, 0.1), transparent 70%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.6;
      font-size: 15px;
      padding-bottom: 80px;
    }

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
    .btn-nav-cta {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-family: var(--font-mono);
      font-weight: 700;
      background: linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%);
      color: #06070A;
      border: 1px solid #DFB843;
      text-decoration: none;
    }

    .container {
      max-width: 900px;
      margin: 40px auto 0;
      padding: 0 24px;
    }

    .topic-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--accent);
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.2);
      padding: 4px 10px;
      border-radius: 3px;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    h1 {
      font-size: 2.1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.25;
      margin-bottom: 12px;
      color: #FFFFFF;
    }
    .lead {
      font-size: 1.05rem;
      color: var(--text-dim);
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .source-box {
      background: rgba(14, 20, 30, 0.6);
      border: 1px solid rgba(212, 175, 55, 0.18);
      border-radius: 6px;
      padding: 12px 18px;
      margin-bottom: 32px;
      font-family: var(--font-mono);
      font-size: 0.76rem;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
    }
    .source-box strong { color: var(--accent-light); }

    /* Topic Navigation Sub-Bar */
    .topic-subnav {
      display: flex;
      gap: 10px;
      margin-bottom: 36px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 14px;
      overflow-x: auto;
      white-space: nowrap;
    }
    .topic-tab {
      padding: 6px 14px;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      border-radius: 4px;
      text-decoration: none;
      color: var(--muted);
      border: 1px solid transparent;
      transition: all 0.15s;
    }
    .topic-tab:hover { color: var(--text); background: rgba(255,255,255,0.04); }
    .topic-tab.active {
      color: var(--accent-light);
      background: rgba(223, 184, 67, 0.1);
      border-color: rgba(223, 184, 67, 0.3);
      font-weight: 600;
    }

    /* Content Card */
    .guide-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 32px;
      margin-bottom: 32px;
    }
    .guide-card h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .guide-card p {
      color: var(--text-dim);
      font-size: 0.94rem;
      line-height: 1.65;
      margin-bottom: 16px;
    }
    .guide-bullets {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }
    .guide-bullets li {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      color: #CBD5E1;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .guide-bullets li::before {
      content: "▸";
      color: var(--accent);
    }

    /* Embedded Interactive Free Check */
    .embedded-check-wrap {
      background: linear-gradient(180deg, rgba(16, 22, 34, 0.9) 0%, rgba(9, 13, 20, 0.96) 100%);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 8px;
      padding: 28px;
      margin: 40px 0;
      box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.7);
    }
    .check-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .check-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .check-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: #10B981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 3px 8px;
      border-radius: 4px;
    }
    .check-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 768px) {
      .check-grid { grid-template-columns: 1fr; }
    }
    .field-row {
      margin-bottom: 14px;
    }
    .field-label {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .field-label span:last-child { color: var(--text); font-weight: 600; }
    .input-range {
      width: 100%;
      accent-color: var(--accent);
      cursor: pointer;
    }
    .num-input {
      background: #06090E;
      border: 1px solid rgba(212, 175, 55, 0.25);
      color: var(--text);
      padding: 8px 12px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      border-radius: 4px;
      width: 100%;
      outline: none;
    }

    .output-card {
      background: rgba(6, 9, 14, 0.88);
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 6px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .out-metric-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-family: var(--font-mono);
      font-size: 0.82rem;
    }
    .out-key { color: var(--muted); }
    .out-val { color: var(--text); font-weight: 600; }

    footer {
      border-top: 1px solid var(--border);
      padding-top: 24px;
      margin-top: 50px;
      font-size: 0.76rem;
      color: var(--muted);
      font-family: var(--font-mono);
      line-height: 1.6;
    }
  </style>
</head>
<body>

  <!-- Top Navigation -->
  <nav class="top-nav">
    <div style="display:flex; align-items:center; gap:24px;">
      <a href="/" class="nav-brand">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981;"></span>
        quanterraos
      </a>
      <div class="nav-links">
        <a href="/calculator">Check</a>
        <a href="/journal">Journal</a>
        <a href="/learn" class="active">Learn</a>
        <a href="/access">Sign in</a>
      </div>
    </div>
    <div>
      <a href="/calculator" class="btn-nav-cta">FREE CHECK &rarr;</a>
    </div>
  </nav>

  <main class="container">
    <div class="topic-eyebrow">
      <span>●</span>
      <span>${content.badge}</span>
    </div>

    <h1>${content.title}</h1>
    <p class="lead">${content.subtitle}</p>

    <div class="source-box">
      <span>📌</span>
      <span><strong>Source &amp; Methodology Attribution:</strong> ${content.sourceAttribution}</span>
    </div>

    <!-- Navigation between educational discovery guides -->
    <div class="topic-subnav">
      <a href="/learn/fees" class="topic-tab ${topic === 'fees' ? 'active' : ''}">01 / Taker Fees</a>
      <a href="/learn/breakeven" class="topic-tab ${topic === 'breakeven' ? 'active' : ''}">02 / Breakeven Hurdle</a>
      <a href="/learn/settlement" class="topic-tab ${topic === 'settlement' ? 'active' : ''}">03 / Settlement Oracles</a>
      <a href="/learn/journal" class="topic-tab ${topic === 'journal' ? 'active' : ''}">04 / Decision Journal</a>
    </div>

    <!-- Guide Content Sections -->
    ${content.sections.map(s => `
      <div class="guide-card">
        <h2>${s.heading}</h2>
        <p>${s.body}</p>
        ${s.bullets ? `
          <ul class="guide-bullets">
            ${s.bullets.map(b => `<li>${b}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}

    <!-- Relevant Interactive Free Check -->
    <div class="embedded-check-wrap">
      <div class="check-header">
        <div>
          <div class="check-title">Live Interactive Check: ${content.title.split(':')[0]}</div>
          <div style="font-size:0.8rem; color:var(--muted); margin-top:2px;">
            ${content.exampleExplanation}
          </div>
        </div>
        <div>
          <span class="check-badge">No Registration Required</span>
        </div>
      </div>

      <div class="check-grid">
        <!-- Inputs -->
        <div>
          <div class="field-row">
            <div class="field-label">
              <span>Executable Ask Price</span>
              <span id="edu-price-display">${content.interactiveDefaultPrice}¢ ($${(content.interactiveDefaultPrice / 100).toFixed(2)})</span>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <input type="range" class="input-range" id="edu-price-slider" min="1" max="99" value="${content.interactiveDefaultPrice}" oninput="recalcEduCheck()">
              <input type="number" class="num-input" id="edu-price-num" min="1" max="99" value="${content.interactiveDefaultPrice}" style="width:68px; text-align:center;" oninput="syncEduPriceNum(this.value)">
            </div>
          </div>

          <div class="field-row">
            <div class="field-label">
              <span>Contract Count</span>
              <span id="edu-count-display">10 contracts</span>
            </div>
            <input type="number" class="num-input" id="edu-count-input" value="10" min="1" max="5000" oninput="recalcEduCheck()">
          </div>

          <div class="field-row">
            <div class="field-label">
              <span>Your Assessed Win Rate (p)</span>
              <span id="edu-prob-display">${content.interactiveDefaultProb.toFixed(1)}%</span>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <input type="range" class="input-range" id="edu-prob-slider" min="1" max="99" value="${content.interactiveDefaultProb}" oninput="recalcEduCheck()">
              <input type="number" class="num-input" id="edu-prob-num" min="1" max="99" value="${content.interactiveDefaultProb}" style="width:68px; text-align:center;" oninput="syncEduProbNum(this.value)">
            </div>
          </div>
        </div>

        <!-- Calculated Output -->
        <div class="output-card">
          <div>
            <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-light); font-weight:700; margin-bottom:12px; text-transform:uppercase;">
              Calculated Decision Friction
            </div>
            <div class="out-metric-row">
              <span class="out-key">Purchase Cost:</span>
              <span class="out-val" id="edu-out-cost">$5.10</span>
            </div>
            <div class="out-metric-row">
              <span class="out-key">Kalshi Taker Fee:</span>
              <span class="out-val" style="color:var(--warning);" id="edu-out-fee">+$0.18 (1.80¢/ct)</span>
            </div>
            <div class="out-metric-row">
              <span class="out-key">Max Potential Loss:</span>
              <span class="out-val" style="color:var(--warning);" id="edu-out-maxloss">$5.28</span>
            </div>
            <div class="out-metric-row">
              <span class="out-key">Required Breakeven Win Rate:</span>
              <span class="out-val" style="color:var(--accent); font-weight:700;" id="edu-out-breakeven">52.80%</span>
            </div>
            <div class="out-metric-row">
              <span class="out-key">Settlement Reference:</span>
              <span class="out-val" style="font-size:0.75rem; color:var(--text-dim);" id="edu-out-source">CME CF BRTI 60s TWAP</span>
            </div>
          </div>

          <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
            <a href="/account?flow=save-check" onclick="saveEduCheckToJournal(event)" class="btn-nav-cta" style="flex:1; text-align:center; padding:10px 14px;">
              Save Check &amp; Start Journal &rarr;
            </a>
            <a href="/calculator" style="padding:10px 14px; font-size:0.8rem; font-family:var(--font-mono); color:var(--text); border:1px solid rgba(255,255,255,0.2); border-radius:4px; text-decoration:none;">
              Open Full Calculator
            </a>
          </div>
        </div>
      </div>
    </div>

    <footer>
      <p>
        <strong>Legal &amp; Regulatory Disclaimers (Rule B5 &amp; B10):</strong> QuanterraOS does not provide investment or financial advice. Kalshi, CME Group, CF Benchmarks, and Polymarket are trademarks of their respective owners. QuanterraOS is an independent measurement companion with $0.00 live financial exposure.
      </p>
    </footer>
  </main>

  <script>
  function syncEduPriceNum(val) {
    const num = Math.min(99, Math.max(1, parseInt(val) || 50));
    const slider = document.getElementById('edu-price-slider');
    if (slider) slider.value = num;
    recalcEduCheck();
  }

  function syncEduProbNum(val) {
    const num = Math.min(99, Math.max(1, parseInt(val) || 50));
    const slider = document.getElementById('edu-prob-slider');
    if (slider) slider.value = num;
    recalcEduCheck();
  }

  function recalcEduCheck() {
    const priceSlider = document.getElementById('edu-price-slider');
    const priceNum = document.getElementById('edu-price-num');
    const probSlider = document.getElementById('edu-prob-slider');
    const probNum = document.getElementById('edu-prob-num');
    const countInput = document.getElementById('edu-count-input');
    if (!priceSlider || !probSlider || !countInput) return;

    const priceCents = parseInt(priceSlider.value) || 50;
    if (priceNum && document.activeElement !== priceNum) priceNum.value = priceCents;
    const price = priceCents / 100;

    const probVal = parseInt(probSlider.value) || 50;
    if (probNum && document.activeElement !== probNum) probNum.value = probVal;
    const prob = probVal / 100;

    const count = Math.max(1, parseInt(countInput.value) || 1);

    document.getElementById('edu-price-display').textContent = priceCents + '¢ ($' + price.toFixed(2) + ')';
    document.getElementById('edu-count-display').textContent = count + ' contracts';
    document.getElementById('edu-prob-display').textContent = probVal.toFixed(1) + '%';

    const rawFee = 0.07 * count * price * (1 - price);
    const totalFee = Math.ceil(rawFee * 100) / 100;
    const feePerCt = totalFee / count;

    const purchaseCost = price * count;
    const maxLoss = purchaseCost + totalFee;
    const breakevenPct = (price + feePerCt) * 100;

    document.getElementById('edu-out-cost').textContent = '$' + purchaseCost.toFixed(2);
    document.getElementById('edu-out-fee').textContent = '+$' + totalFee.toFixed(2) + ' (' + (feePerCt * 100).toFixed(2) + '¢/ct)';
    document.getElementById('edu-out-maxloss').textContent = '$' + maxLoss.toFixed(2);
    document.getElementById('edu-out-breakeven').textContent = breakevenPct.toFixed(2) + '%';

    window.__pendingEduCheck = {
      venue: 'kalshi-15m',
      pricingBasis: 'executable_ask',
      contractTicker: 'KXBTC15M',
      side: 'yes',
      price: price,
      count: count,
      purchaseCost: Number(purchaseCost.toFixed(2)),
      exchangeFee: Number(totalFee.toFixed(2)),
      totalDrag: Number(feePerCt.toFixed(4)),
      breakevenWinProb: Number(breakevenPct.toFixed(2)),
      assessedWinProb: Number((prob * 100).toFixed(2)),
      settlementSource: 'CME CF BRTI 60s TWAP'
    };
  }

  function saveEduCheckToJournal(e) {
    e.preventDefault();
    if (!window.__pendingEduCheck) recalcEduCheck();
    try {
      localStorage.setItem('quanterraos_pending_check', JSON.stringify(window.__pendingEduCheck));
      fetch('/api/analytics/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(window.__pendingEduCheck)
      }).catch(function() {});
    } catch (_) {}
    window.location.href = '/account?flow=save-check';
  }

  document.addEventListener('DOMContentLoaded', recalcEduCheck);
  </script>

  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
