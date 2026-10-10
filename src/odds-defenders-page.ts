/**
 * QuanterraOS Odds Defenders Campaign Page & Components
 *
 * Campaign: "Destroy confusion. Decode the odds."
 * Visuals: Kalshi Destroyer & Polymarket Terminator
 * Scope: Independent cost verification & receipt generation across Kalshi and Polymarket.
 */

import {
  ODDS_DEFENDERS_COPY,
  isCampaignEnabled,
} from "./config/campaign.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";

export function renderOddsDefendersPageHtml(): string {
  const c = ODDS_DEFENDERS_COPY;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>The Odds Defenders — Destroy Confusion. Decode the Odds | QuanterraOS</title>
  <meta name="description" content="QuanterraOS presents the Odds Defenders: Kalshi Destroyer & Polymarket Terminator. Check fees, spreads, and settlement rules before you trade. Independent analytics. 18+.">
  
  <!-- Open Graph & Social -->
  <meta property="og:title" content="The Odds Defenders — Destroy Confusion. Decode the Odds">
  <meta property="og:description" content="Check fees, execution price and settlement assumptions on Kalshi and Polymarket before choosing a side. Independent & venue-neutral.">
  <meta property="og:image" content="/assets/campaign-receipt.png">
  <meta property="og:type" content="website">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    ${PUBLIC_LAYOUT_CSS}

    /* Page-Specific Campaign Tokens */
    :root {
      --def-emerald: #10B981;
      --def-emerald-glow: rgba(16, 185, 129, 0.25);
      --def-cobalt: #3B82F6;
      --def-cobalt-glow: rgba(59, 130, 246, 0.25);
      --def-gold: #F59E0B;
    }

    body {
      background: #080B18;
      color: #F4F5FF;
      margin: 0;
      padding: 0;
      font-family: var(--public-font-sans);
      overflow-x: hidden;
    }

    .campaign-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Hero Section */
    .campaign-hero {
      padding: 64px 0 48px;
      text-align: center;
      position: relative;
    }

    .campaign-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--public-accent-purple);
      background: rgba(148, 104, 255, 0.1);
      border: 1px solid var(--public-border-purple);
      padding: 6px 16px;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    .campaign-headline {
      font-size: clamp(2.2rem, 5vw, 3.8rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin: 0 auto 20px;
      max-width: 900px;
      background: linear-gradient(135deg, #FFFFFF 0%, #AFB6CE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .campaign-support {
      font-size: clamp(1rem, 2vw, 1.15rem);
      line-height: 1.65;
      color: var(--public-muted);
      max-width: 780px;
      margin: 0 auto 32px;
    }

    .campaign-btn-row {
      display: flex;
      gap: 16px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }

    .btn-camp-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #9468FF 0%, #7B42FF 100%);
      color: #FFFFFF;
      font-weight: 700;
      font-size: 1rem;
      padding: 14px 28px;
      border-radius: 10px;
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;
      min-height: 44px;
      box-shadow: 0 4px 20px rgba(148, 104, 255, 0.35);
    }
    .btn-camp-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(148, 104, 255, 0.5);
    }

    .btn-camp-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(18, 23, 43, 0.8);
      border: 1px solid rgba(175, 182, 206, 0.3);
      color: #F4F5FF;
      font-weight: 600;
      font-size: 1rem;
      padding: 14px 28px;
      border-radius: 10px;
      text-decoration: none;
      transition: background 0.15s, border-color 0.15s;
      min-height: 44px;
    }
    .btn-camp-secondary:hover {
      background: rgba(148, 104, 255, 0.15);
      border-color: var(--public-accent-purple);
    }

    /* Champions Cards Grid */
    .champions-section {
      padding: 40px 0 60px;
    }

    .section-title {
      font-size: 2rem;
      font-weight: 800;
      text-align: center;
      margin-bottom: 36px;
      letter-spacing: -0.02em;
    }

    .champions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 32px;
      margin-bottom: 40px;
    }

    .champion-card {
      background: #12172B;
      border: 1px solid rgba(175, 182, 206, 0.18);
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .champion-card.kalshi:hover {
      transform: translateY(-4px);
      border-color: var(--def-emerald);
      box-shadow: 0 12px 30px var(--def-emerald-glow);
    }
    .champion-card.polymarket:hover {
      transform: translateY(-4px);
      border-color: var(--def-cobalt);
      box-shadow: 0 12px 30px var(--def-cobalt-glow);
    }

    .champion-img-wrap {
      width: 100%;
      aspect-ratio: 1 / 1;
      background: #080B18;
      position: relative;
      overflow: hidden;
    }

    .champion-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .champion-badge {
      position: absolute;
      top: 14px;
      left: 14px;
      font-family: var(--public-font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-kalshi {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid var(--def-emerald);
      color: #86F94A;
    }
    .badge-polymarket {
      background: rgba(59, 130, 246, 0.2);
      border: 1px solid var(--def-cobalt);
      color: #59DDEC;
    }

    .champion-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .champion-title {
      font-size: 1.4rem;
      font-weight: 800;
      margin: 0 0 10px;
      letter-spacing: -0.01em;
    }

    .champion-body {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--public-muted);
      margin-bottom: 24px;
      flex-grow: 1;
    }

    .btn-champion-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      min-height: 44px;
      transition: all 0.15s;
    }
    .btn-kalshi-action {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--def-emerald);
      color: #86F94A;
    }
    .btn-kalshi-action:hover {
      background: var(--def-emerald);
      color: #080B18;
    }
    .btn-polymarket-action {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid var(--def-cobalt);
      color: #59DDEC;
    }
    .btn-polymarket-action:hover {
      background: var(--def-cobalt);
      color: #FFFFFF;
    }

    .campaign-bridge {
      text-align: center;
      font-family: var(--public-font-mono);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--public-fg);
      background: rgba(18, 23, 43, 0.6);
      border: 1px solid rgba(175, 182, 206, 0.15);
      padding: 16px 24px;
      border-radius: 12px;
      max-width: 680px;
      margin: 0 auto;
    }

    /* How It Works Steps */
    .how-it-works-section {
      padding: 60px 0;
      border-top: 1px solid rgba(175, 182, 206, 0.12);
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-top: 36px;
    }

    .step-card {
      background: rgba(18, 23, 43, 0.5);
      border: 1px solid rgba(175, 182, 206, 0.15);
      border-radius: 16px;
      padding: 24px;
    }

    .step-num {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--public-accent-purple);
      color: #FFFFFF;
      font-family: var(--public-font-mono);
      font-weight: 700;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .step-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .step-desc {
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--public-muted);
    }

    /* Interactive Supported Intake Card */
    .campaign-intake-card {
      background: #12172B;
      border: 1px solid var(--public-border-purple);
      border-radius: 20px;
      padding: 32px;
      max-width: 800px;
      margin: 50px auto 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }

    .intake-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn-tab {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(175, 182, 206, 0.2);
      color: var(--public-muted);
      padding: 10px 18px;
      border-radius: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      min-height: 44px;
    }
    .btn-tab.active {
      background: rgba(148, 104, 255, 0.2);
      border-color: var(--public-accent-purple);
      color: #FFFFFF;
    }

    .intake-input-row {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }

    .intake-input {
      flex: 1;
      background: #080B18;
      border: 1px solid rgba(175, 182, 206, 0.25);
      border-radius: 8px;
      padding: 12px 16px;
      font-family: var(--public-font-mono);
      font-size: 0.95rem;
      color: #FFFFFF;
      outline: none;
    }
    .intake-input:focus {
      border-color: var(--public-accent-purple);
      box-shadow: 0 0 0 2px rgba(148, 104, 255, 0.25);
    }

    .btn-resolve {
      background: linear-gradient(135deg, #9468FF 0%, #7B42FF 100%);
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      min-height: 44px;
    }

    .intake-helpers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 0.78rem;
      color: var(--public-muted);
      font-family: var(--public-font-mono);
    }

    /* Live Sample Receipt Card */
    .receipt-preview-box {
      margin-top: 24px;
      background: #080B18;
      border: 1px solid rgba(148, 104, 255, 0.35);
      border-radius: 12px;
      padding: 20px;
      display: none;
    }
    .receipt-preview-box.visible {
      display: block;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(175, 182, 206, 0.1);
      font-size: 0.85rem;
    }
    .receipt-row:last-child {
      border-bottom: none;
    }
    .receipt-row.highlight {
      font-weight: 700;
      color: var(--public-accent-purple);
      font-size: 0.95rem;
      padding-top: 12px;
    }

    /* FAQ Section */
    .faq-section {
      padding: 40px 0 60px;
      border-top: 1px solid rgba(175, 182, 206, 0.12);
    }

    .faq-grid {
      display: grid;
      gap: 16px;
      max-width: 800px;
      margin: 0 auto;
    }

    .faq-item {
      background: #12172B;
      border: 1px solid rgba(175, 182, 206, 0.15);
      border-radius: 12px;
      padding: 20px;
    }

    .faq-q {
      font-weight: 700;
      font-size: 1.05rem;
      margin-bottom: 8px;
      color: #FFFFFF;
    }

    .faq-a {
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--public-muted);
    }

    /* Mandatory Disclosures Box */
    .campaign-disclosure-box {
      background: rgba(18, 23, 43, 0.5);
      border: 1px solid rgba(175, 182, 206, 0.15);
      border-radius: 12px;
      padding: 20px;
      margin: 40px auto 60px;
      max-width: 800px;
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      line-height: 1.6;
      color: #8A8F98;
      text-align: center;
    }

    @media (max-width: 768px) {
      .champions-grid {
        grid-template-columns: 1fr;
      }
      .intake-input-row {
        flex-direction: column;
      }
      .btn-resolve {
        width: 100%;
      }
    }
  </style>
</head>
<body>

  ${renderPublicHeader({ activePath: "/odds-defenders" })}

  <main class="campaign-container">
    
    <!-- Hero Section -->
    <section class="campaign-hero" aria-label="Odds Defenders Campaign Hero">
      <div class="campaign-eyebrow">
        <span>⚡</span> ${c.eyebrow}
      </div>

      <h1 class="campaign-headline">${c.headline}</h1>

      <p class="campaign-support">${c.support}</p>

      <div class="campaign-btn-row">
        <a href="#intake-anchor" class="btn-camp-primary">${c.primaryCta} &rarr;</a>
        <a href="#defenders-anchor" class="btn-camp-secondary">${c.secondaryCta}</a>
      </div>

      <div style="font-family:var(--public-font-mono); font-size:0.78rem; color:#8A8F98;">
        Independent &bull; Venue-Neutral &bull; $0.00 Live Risk (Rule B5) &bull; 18+
      </div>
    </section>

    <!-- Two Legends Section -->
    <section class="champions-section" id="defenders-anchor" aria-label="Two Legends Section">
      <h2 class="section-title">${c.sectionHeading}</h2>

      <div class="champions-grid">
        <!-- Card 1: Kalshi Destroyer -->
        <article class="champion-card kalshi" id="card-kalshi-destroyer">
          <div class="champion-img-wrap">
            <img src="${c.card1.image}" alt="${c.card1.alt}" class="champion-img" loading="lazy">
            <span class="champion-badge badge-kalshi">${c.card1.badge}</span>
          </div>
          <div class="champion-content">
            <h3 class="champion-title" style="color:#86F94A;">${c.card1.title}</h3>
            <p class="champion-body">${c.card1.body}</p>
            <a href="/check?venue=kalshi&campaign=odds-defenders" class="btn-champion-action btn-kalshi-action" onclick="recordClick('kalshi')">
              ${c.card1.cta} &rarr;
            </a>
          </div>
        </article>

        <!-- Card 2: Polymarket Terminator -->
        <article class="champion-card polymarket" id="card-polymarket-terminator">
          <div class="champion-img-wrap">
            <img src="${c.card2.image}" alt="${c.card2.alt}" class="champion-img" loading="lazy">
            <span class="champion-badge badge-polymarket">${c.card2.badge}</span>
          </div>
          <div class="champion-content">
            <h3 class="champion-title" style="color:#59DDEC;">${c.card2.title}</h3>
            <p class="champion-body">${c.card2.body}</p>
            <a href="/check?venue=polymarket&campaign=odds-defenders" class="btn-champion-action btn-polymarket-action" onclick="recordClick('polymarket')">
              ${c.card2.cta} &rarr;
            </a>
          </div>
        </article>
      </div>

      <div class="campaign-bridge">
        ${c.bridge}
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works-section" aria-label="How It Works">
      <h2 class="section-title">${c.howItWorksHeading}</h2>

      <div class="steps-grid">
        ${c.steps.map(s => `
          <div class="step-card">
            <div class="step-num">${s.num}</div>
            <div class="step-title">${s.title}</div>
            <div class="step-desc">${s.desc}</div>
          </div>
        `).join("")}
      </div>

      <div style="text-align:center; margin: 32px 0 40px;">
        <a href="#intake-anchor" class="btn-camp-primary" style="padding:14px 32px; font-size:1.05rem;">Start your cost check &rarr;</a>
        <div style="font-family:var(--public-font-mono); font-size:0.85rem; color:#AFAEC2; margin-top:12px;">
          Your exchange. Your decision. Your Flight Deck.
        </div>
      </div>

      <!-- Interactive Supported Intake Component -->
      <div class="campaign-intake-card" id="intake-anchor">
        <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--public-accent-purple); font-weight:700; margin-bottom:12px; letter-spacing:0.1em; text-transform:uppercase;">
          Live Supported Intake // Inspect Costs
        </div>

        <div class="intake-tabs">
          <button type="button" class="btn-tab active" id="tab-kalshi" onclick="setVenue('kalshi')">Kalshi Contract</button>
          <button type="button" class="btn-tab" id="tab-poly" onclick="setVenue('polymarket')">Polymarket Market</button>
        </div>

        <div class="intake-input-row">
          <input type="text" id="campaign-market-input" class="intake-input" placeholder="e.g. KXBTC15M or https://kalshi.com/markets/kxbtc15m" value="KXBTC15M">
          <button type="button" class="btn-resolve" onclick="resolveCampaignMarket()">Inspect Costs &rarr;</button>
        </div>

        <div class="intake-helpers">
          <span>Supported: Kalshi event contracts, Polymarket crypto/event markets.</span>
          <button type="button" onclick="loadSampleReceipt()" style="background:none; border:none; color:var(--public-accent-purple); font-family:var(--public-font-mono); font-size:0.78rem; cursor:pointer; text-decoration:underline;">
            Load Illustrative Sample
          </button>
        </div>

        <!-- Dynamic Output Box -->
        <div class="receipt-preview-box" id="campaign-receipt-output">
          <div style="display:flex; justify-content:space-between; font-family:var(--public-font-mono); font-size:0.75rem; color:var(--public-muted); margin-bottom:12px;">
            <span id="out-tag" style="color:var(--public-accent-purple); font-weight:700;">ILLUSTRATIVE FLIGHT RECEIPT</span>
            <span id="out-status">● VERIFIED CANONICAL FIXTURE</span>
          </div>

          <div class="receipt-row">
            <span>Market Identifier</span>
            <strong id="out-ticker" style="font-family:var(--public-font-mono);">KXBTC15M</strong>
          </div>
          <div class="receipt-row">
            <span>Entry Order Specification</span>
            <strong id="out-order">10 contracts @ $0.51 ask</strong>
          </div>
          <div class="receipt-row">
            <span>Calculated Venue Taker Fee</span>
            <strong id="out-fee">$0.18 (1.80¢/ct)</strong>
          </div>
          <div class="receipt-row">
            <span>Actual Acquisition Outlay</span>
            <strong id="out-outlay">$5.10</strong>
          </div>
          <div class="receipt-row">
            <span>Total Max Loss (Outlay + Fee)</span>
            <strong id="out-loss">$5.28</strong>
          </div>
          <div class="receipt-row highlight">
            <span>Required Breakeven Win Rate</span>
            <strong id="out-hurdle" style="color:var(--public-accent-purple);">52.80%</strong>
          </div>

          <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
            <a href="/check" class="btn-camp-primary" style="font-size:0.85rem; padding:10px 18px;" id="out-check-link">
              Launch Full Receipt &rarr;
            </a>
            <a href="/pass" class="btn-camp-secondary" style="font-size:0.85rem; padding:10px 18px;">
              Claim Free Crew Pass
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section" aria-label="Frequently Asked Questions">
      <h2 class="section-title">Odds Defenders &bull; Key Questions</h2>

      <div class="faq-grid">
        <div class="faq-item">
          <div class="faq-q">Does QuanterraOS tell me which side to trade?</div>
          <div class="faq-a">
            No. The Odds Defenders and Quanta carry equal green up-arrow and pink down-arrow eyes representing two possible directions, never a trade call. We reveal entry drag, maker savings, and settlement rules so you make your own informed decision.
          </div>
        </div>

        <div class="faq-item">
          <div class="faq-q">Is QuanterraOS affiliated with Kalshi or Polymarket?</div>
          <div class="faq-a">
            No. QuanterraOS is an independent, venue-neutral analytics platform built by Quantara Global LLC. We take zero exchange referral kickbacks or volume rebates.
          </div>
        </div>

        <div class="faq-item">
          <div class="faq-q">Are the Kalshi Destroyer and Polymarket Terminator NFTs?</div>
          <div class="faq-a">
            No. They are unofficial collectible character concepts and digital cosmetic themes. No blockchain mint, cryptocurrency deposit, or token purchase is required to use QuanterraOS.
          </div>
        </div>

        <div class="faq-item">
          <div class="faq-q">How does private saving and sharing work?</div>
          <div class="faq-a">
            Saving your check keeps your reasoning in your personal private mission log. Nothing is published publicly until you explicitly review a preview and click "Publish card". You can unpublish or delete your card at any time.
          </div>
        </div>
      </div>
    </section>

    <!-- Mandatory Disclosures Box -->
    <div class="campaign-disclosure-box">
      <strong>MANDATORY DISCLOSURE &bull; REGULATORY COMPLIANCE:</strong><br>
      ${c.disclosure}<br>
      Rule B5 locked: zero live capital exposure ($0.00). All market data and settlement references are subject to venue API availability and timing.
    </div>

  </main>

  ${renderPublicFooter()}

  <script>
    let activeVenue = 'kalshi';

    function setVenue(v) {
      activeVenue = v;
      document.getElementById('tab-kalshi').classList.toggle('active', v === 'kalshi');
      document.getElementById('tab-poly').classList.toggle('active', v === 'polymarket');
      const input = document.getElementById('campaign-market-input');
      if (v === 'kalshi') {
        input.placeholder = "e.g. KXBTC15M or https://kalshi.com/markets/kxbtc15m";
        input.value = "KXBTC15M";
      } else {
        input.placeholder = "e.g. 0x... or https://polymarket.com/event/...";
        input.value = "https://polymarket.com/event/bitcoin-above-100k";
      }
    }

    function recordClick(v) {
      try {
        fetch('/api/campaign/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: 'defender_card_clicked', venue: v })
        }).catch(() => {});
      } catch(e) {}
    }

    function resolveCampaignMarket() {
      const val = document.getElementById('campaign-market-input').value.trim();
      const output = document.getElementById('campaign-receipt-output');
      if (!val) {
        alert("Please enter a supported market URL or ticker.");
        return;
      }

      fetch('/api/receipts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlOrTicker: val, venue: activeVenue })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.receipt) {
          const r = data.receipt;
          const side = r.sides.yes || r.sides.no;
          document.getElementById('out-tag').innerText = "CANONICAL FLIGHT RECEIPT";
          document.getElementById('out-status').innerText = "● LIVE QUOTE (" + (r.dataStatus || "fresh").toUpperCase() + ")";
          document.getElementById('out-ticker').innerText = r.marketId;
          document.getElementById('out-order').innerText = r.quantity + " contracts @ $" + (side ? side.entryPrice : "0.50");
          document.getElementById('out-fee').innerText = "$" + (side ? side.fee : "0.18");
          document.getElementById('out-outlay').innerText = "$" + (side ? side.purchaseAmount : "5.10");
          document.getElementById('out-loss').innerText = "$" + (side ? side.outlay : "5.28");
          document.getElementById('out-hurdle').innerText = (side ? side.breakevenPercent : "52.80%");
          document.getElementById('out-check-link').href = "/check?market=" + encodeURIComponent(r.marketId) + "&venue=" + r.venue;
          output.classList.add('visible');
        } else {
          loadSampleReceipt();
        }
      })
      .catch(() => {
        loadSampleReceipt();
      });
    }

    function loadSampleReceipt() {
      const output = document.getElementById('campaign-receipt-output');
      document.getElementById('out-tag').innerText = "ILLUSTRATIVE FLIGHT RECEIPT";
      document.getElementById('out-status').innerText = "● VERIFIED CANONICAL FIXTURE";
      document.getElementById('out-ticker').innerText = activeVenue === 'kalshi' ? "KXBTC15M" : "PM-BTC-DEC26";
      document.getElementById('out-order').innerText = "10 contracts @ $0.51 ask";
      document.getElementById('out-fee').innerText = "$0.18 (1.80¢/ct)";
      document.getElementById('out-outlay').innerText = "$5.10";
      document.getElementById('out-loss').innerText = "$5.28";
      document.getElementById('out-hurdle').innerText = "52.80%";
      document.getElementById('out-check-link').href = "/check?venue=" + activeVenue + "&campaign=odds-defenders";
      output.classList.add('visible');
    }
  </script>
</body>
</html>`;
}

/**
 * Compact homepage campaign module for Odds Defenders
 */
export function renderHomepageCampaignModule(): string {
  if (!isCampaignEnabled("campaign_odds_defenders")) {
    return "";
  }

  const c = ODDS_DEFENDERS_COPY;

  return `
  <!-- =======================================================================
       COMPACT CAMPAIGN MODULE: THE ODDS DEFENDERS
       ======================================================================= -->
  <section class="odds-defenders-home-strip" style="background: linear-gradient(180deg, rgba(8,11,24,0) 0%, rgba(18,23,43,0.85) 50%, rgba(8,11,24,0) 100%); border-top: 1px solid rgba(148,104,255,0.2); border-bottom: 1px solid rgba(148,104,255,0.2); padding: 48px 24px; margin: 32px 0;">
    <div style="max-width: 1140px; margin: 0 auto; text-align: center;">
      <div style="display: inline-flex; align-items: center; gap: 8px; font-family: var(--public-font-mono); font-size: 0.72rem; font-weight: 700; color: var(--public-accent-purple); letter-spacing: 0.12em; text-transform: uppercase; background: rgba(148, 104, 255, 0.1); border: 1px solid var(--public-border-purple); padding: 4px 12px; border-radius: 14px; margin-bottom: 12px;">
        <span>⚡</span> ${c.eyebrow}
      </div>

      <h2 style="font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; margin-bottom: 12px;">
        ${c.headline}
      </h2>

      <p style="font-size: 0.95rem; color: var(--public-muted); max-width: 680px; margin: 0 auto 32px; line-height: 1.6;">
        Trade on Kalshi or Polymarket? Bring your next decision into focus with Quanta and the Flight Crew. Check supported markets, inspect fee curves, and verify settlement rules.
      </p>

      <!-- Two Champion Cards Side by Side -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 840px; margin: 0 auto 28px; text-align: left;">
        
        <!-- Kalshi Destroyer Mini Card -->
        <div style="background: #080B18; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 20px; display: flex; gap: 16px; align-items: center;">
          <img src="${c.card1.image}" alt="${c.card1.alt}" style="width: 72px; height: 72px; border-radius: 10px; object-fit: cover; border: 1px solid var(--def-emerald);">
          <div>
            <div style="font-family: var(--public-font-mono); font-size: 0.65rem; color: #86F94A; font-weight: 700; text-transform: uppercase;">Kalshi Specialist</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin: 2px 0 4px;">${c.card1.title}</div>
            <a href="/check?venue=kalshi&campaign=odds-defenders" style="color: #86F94A; font-size: 0.8rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              ${c.card1.cta} &rarr;
            </a>
          </div>
        </div>

        <!-- Polymarket Terminator Mini Card -->
        <div style="background: #080B18; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 14px; padding: 20px; display: flex; gap: 16px; align-items: center;">
          <img src="${c.card2.image}" alt="${c.card2.alt}" style="width: 72px; height: 72px; border-radius: 10px; object-fit: cover; border: 1px solid var(--def-cobalt);">
          <div>
            <div style="font-family: var(--public-font-mono); font-size: 0.65rem; color: #59DDEC; font-weight: 700; text-transform: uppercase;">Polymarket Specialist</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #FFF; margin: 2px 0 4px;">${c.card2.title}</div>
            <a href="/check?venue=polymarket&campaign=odds-defenders" style="color: #59DDEC; font-size: 0.8rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              ${c.card2.cta} &rarr;
            </a>
          </div>
        </div>

      </div>

      <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
        <a href="/odds-defenders" style="display: inline-flex; align-items: center; background: rgba(148, 104, 255, 0.15); border: 1px solid var(--public-accent-purple); color: #FFF; font-weight: 600; font-size: 0.85rem; padding: 8px 18px; border-radius: 8px; text-decoration: none;">
          Meet the Odds Defenders &rarr;
        </a>
        <a href="/check?campaign=odds-defenders" style="display: inline-flex; align-items: center; background: var(--public-accent-purple); color: #FFF; font-weight: 700; font-size: 0.85rem; padding: 8px 18px; border-radius: 8px; text-decoration: none;">
          Start Cost Check
        </a>
      </div>
    </div>
  </section>
  `;
}
