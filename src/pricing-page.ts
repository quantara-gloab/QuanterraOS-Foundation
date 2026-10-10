/**
 * QuanterraOS Pricing Page (/pricing)
 *
 * Implements QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md (Part 4) &
 * QuanterraOS Competitive Product, Pricing and Merchandise Handoff (Oct 10, 2026):
 * - Page headline: "Choose your Flight Deck"
 * - Monthly/Annual switch with exact annual arithmetic: $349/year (Save $119 per year compared with monthly billing)
 * - 2 Consumer Cards: Cadet (Free to start) & Pilot (Monthly / Annual)
 * - Concise Comparison Table (Free vs Pilot)
 * - Business & Developer Section: Commander ("Discuss desk access"), Builder API ("View API plans"), Institutional ("Discuss data access")
 * - Billing FAQ: What is free, live meaning, cancellation, annual renewal, gear separation, zero trading execution, PWA
 * - Independent tool notice & Rule B5 permanent $0.00 risk lock
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { PRICING_PLANS, COACHING_ADDON, type PricingPlan } from "./config/pricing.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS
} from "./components/public-layout.ts";

export function renderPricingPageHtml(userTier: string = "free"): string {
  const cadet = PRICING_PLANS.find((p) => p.id === "cadet")!;
  const pilot = PRICING_PLANS.find((p) => p.id === "pilot")!;
  const commander = PRICING_PLANS.find((p) => p.id === "commander")!;
  const builder = PRICING_PLANS.find((p) => p.id === "builder")!;
  const institutional = PRICING_PLANS.find((p) => p.id === "institutional")!;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Pricing &amp; Subscriptions — QuanterraOS</title>
  <meta name="description" content="Choose your Flight Deck. Transparent, single-source pricing for QuanterraOS prediction market cost checks, settlement radar, and research APIs.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-highlight: #111624;
      --border: rgba(212, 175, 55, 0.16);
      --border-accent: rgba(223, 184, 67, 0.5);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --gold-glow: rgba(223, 184, 67, 0.35);
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --warning: #F43F5E;
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

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px 24px 0;
    }

    .hero-header {
      text-align: center;
      max-width: 820px;
      margin: 0 auto 40px;
    }
    .hero-tag {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 12px;
      background: rgba(223, 184, 67, 0.08);
      display: inline-block;
      padding: 4px 14px;
      border-radius: 999px;
      border: 1px solid rgba(223, 184, 67, 0.25);
    }
    .hero-header h1 {
      font-size: clamp(2.2rem, 4vw, 3.2rem);
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 14px;
      color: #FFFFFF;
    }
    .hero-subtitle {
      font-size: 1.05rem;
      color: var(--text-dim);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .honest-callout {
      background: rgba(14, 20, 32, 0.7);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 20px;
      font-size: 0.85rem;
      color: #CBD5E1;
      display: inline-block;
      text-align: left;
    }
    .honest-callout strong { color: var(--accent-light); }

    /* Billing Toggle Switch */
    .billing-toggle-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin: 32px 0 40px;
    }
    .billing-toggle-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--text-dim);
      font-family: var(--font-mono);
      font-size: 0.82rem;
      padding: 8px 18px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .billing-toggle-btn.active {
      background: var(--accent);
      color: #06070A;
      font-weight: 700;
      border-color: var(--accent);
      box-shadow: 0 0 16px rgba(223, 184, 67, 0.35);
    }
    .savings-badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #10B981;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 6px;
    }

    /* Consumer Cards (Side-by-side, Stack at <= 768px) */
    .consumer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 56px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
    }
    .pricing-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 36px 30px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 12px 28px rgba(0, 0, 0, 0.4);
    }
    .pricing-card.featured {
      background: linear-gradient(180deg, rgba(20, 26, 40, 0.95) 0%, rgba(13, 17, 26, 0.98) 100%);
      border-color: var(--border-accent);
      box-shadow: inset 0 1px 0 0 rgba(247, 231, 180, 0.4), 0 0 35px rgba(223, 184, 67, 0.18), 0 16px 36px rgba(0, 0, 0, 0.5);
    }
    .tier-name {
      font-size: 1.4rem;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 6px;
    }
    .tier-desc {
      font-size: 0.86rem;
      color: var(--text-dim);
      min-height: 48px;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .price-box {
      margin-bottom: 22px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
    }
    .price-amount {
      font-size: 2.6rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: #FFFFFF;
      line-height: 1.1;
    }
    .price-period {
      font-size: 0.8rem;
      color: var(--text-dim);
      font-family: var(--font-mono);
      margin-top: 4px;
    }
    .annual-savings-note {
      font-size: 0.76rem;
      color: #10B981;
      font-family: var(--font-mono);
      font-weight: 600;
      margin-top: 4px;
    }

    .features-list {
      list-style: none;
      margin-bottom: 32px;
      flex-grow: 1;
    }
    .features-list li {
      font-size: 0.84rem;
      color: #CBD5E1;
      margin-bottom: 11px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      line-height: 1.45;
    }
    .check-icon {
      color: var(--accent);
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.9rem;
      line-height: 1.2;
    }

    .action-btn {
      width: 100%;
      padding: 14px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-family: var(--font-mono);
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      display: block;
      box-sizing: border-box;
    }
    .btn-free {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-free:hover {
      background: rgba(212, 175, 55, 0.12);
      border-color: rgba(212, 175, 55, 0.4);
      color: #FFFFFF;
    }
    .btn-pro {
      background: linear-gradient(180deg, #FAF1D4 0%, #DFB843 35%, #B88E28 100%);
      color: #07080B;
      box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.6);
    }
    .btn-pro:hover {
      background: linear-gradient(180deg, #FFFFFF 0%, #F5DE94 35%, #C99E2E 100%);
      box-shadow: 0 6px 24px rgba(223, 184, 67, 0.5);
    }

    /* Comparison Table */
    .comparison-section {
      margin: 64px auto;
      max-width: 960px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px 28px;
    }
    .comparison-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
      text-align: center;
    }
    .comparison-sub {
      font-size: 0.84rem;
      color: var(--text-dim);
      text-align: center;
      margin-bottom: 24px;
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
      text-align: left;
    }
    .comp-table th {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
    }
    .comp-table td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #CBD5E1;
    }
    .comp-table tr:hover td {
      background: rgba(223, 184, 67, 0.03);
    }

    /* Business & Developer Subsection */
    .business-section {
      margin: 64px auto;
      max-width: 1100px;
    }
    .business-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .business-header h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 6px;
    }
    .business-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    /* Billing FAQ Section */
    .faq-section {
      margin: 64px auto 32px;
      max-width: 860px;
    }
    .faq-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .faq-header h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 6px;
    }
    .faq-item {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px 22px;
      margin-bottom: 12px;
    }
    .faq-question {
      font-size: 0.95rem;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 6px;
    }
    .faq-answer {
      font-size: 0.84rem;
      color: var(--text-dim);
      line-height: 1.6;
    }

    /* Mobile Adaptations (320px - 430px) */
    @media (max-width: 768px) {
      .container { padding: 32px 16px 0; }
      .consumer-grid { grid-template-columns: 1fr; }
      .comp-table { font-size: 0.78rem; }
      .comp-table th, .comp-table td { padding: 10px 8px; }
      .price-amount { font-size: 2.2rem; }
    }
    ${PUBLIC_LAYOUT_CSS}
  </style>
</head>
<body>

  ${renderPublicHeader({ activePath: "/pricing" })}

  <main class="container">
    <div class="hero-header">
      <div class="hero-tag">Transparent Plans · Single Source of Truth</div>
      <h1>Choose your Flight Deck</h1>
      <p class="hero-subtitle">
        QuanterraOS helps people make decisions they can explain, verify and learn from. Free essential checks and transparent upgrades for saved history, encrypted sync, and real-time monitoring.
      </p>
      <div class="honest-callout">
        <strong>The Independence Guarantee:</strong> QuanterraOS takes zero exchange volume kickbacks or referral fees. You pay only for real-time immediacy and research tooling. Rule B5 locked: zero live capital deployed ($0.00).
      </div>
    </div>

    <!-- Monthly / Annual Toggle Switch -->
    <div class="billing-toggle-wrap">
      <button type="button" id="btn-toggle-monthly" class="billing-toggle-btn active" onclick="setBillingCycle('monthly')">
        Monthly Billing ($39/mo)
      </button>
      <button type="button" id="btn-toggle-annual" class="billing-toggle-btn" onclick="setBillingCycle('annual')">
        Annual Billing ($349/yr)<span class="savings-badge">Save $119/yr</span>
      </button>
    </div>

    <!-- 2 Main Consumer Cards -->
    <div class="consumer-grid">
      <!-- Card 1: Cadet (Free) -->
      <div class="pricing-card">
        <div class="tier-name">${cadet.name}</div>
        <div class="tier-desc">${cadet.description}</div>
        <div class="price-box">
          <div class="price-amount">${cadet.priceDisplay}</div>
          <div class="price-period">${cadet.billingPeriod}</div>
        </div>
        <ul class="features-list">
          ${cadet.features.map((f) => `<li><span class="check-icon">✓</span> <span>${f}</span></li>`).join("\n          ")}
        </ul>
        <a href="${cadet.ctaHref}" class="action-btn btn-free">
          ${userTier === "free" ? "Start Free" : "Current Plan"}
        </a>
      </div>

      <!-- Card 2: Pilot (Consumer Pro) -->
      <div class="pricing-card featured" id="pilot-card">
        <div class="tier-name">${pilot.name}</div>
        <div class="tier-desc">${pilot.description}</div>
        <div class="price-box">
          <div class="price-amount" id="pilot-price-val">${pilot.priceDisplay}</div>
          <div class="price-period" id="pilot-period-val">per month</div>
          <div class="annual-savings-note" id="pilot-savings-note" style="display:none;">
            Save $119 per year compared with monthly billing ($349/yr vs $468/yr, 25.43% lower)
          </div>
        </div>
        <ul class="features-list">
          ${pilot.features.map((f) => `<li><span class="check-icon">✓</span> <span>${f}</span></li>`).join("\n          ")}
        </ul>
        <a href="${pilot.ctaHref}" class="action-btn btn-pro" id="pilot-cta-btn">
          ${userTier === "pilot" ? "Current Plan (Active)" : "Choose Pilot"}
        </a>
      </div>
    </div>

    <!-- Concise Feature Comparison Table -->
    <section class="comparison-section" aria-label="Feature Comparison">
      <h2 class="comparison-title">Concise Capability Comparison</h2>
      <p class="comparison-sub">Essential cost and settlement clarity is never paywalled. Paid value is convenience, saved history, and real-time monitoring.</p>
      <div style="overflow-x:auto;">
        <table class="comp-table">
          <thead>
            <tr>
              <th>Feature Dimension</th>
              <th>Cadet (Free)</th>
              <th>Pilot ($39/mo or $349/yr)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Supported Cost Checks</strong></td>
              <td>Unlimited instant calculations</td>
              <td>Unlimited instant calculations</td>
            </tr>
            <tr>
              <td><strong>Data Freshness</strong></td>
              <td>20-min delayed public telemetry</td>
              <td>Live real-time WebSocket feeds</td>
            </tr>
            <tr>
              <td><strong>Private Storage &amp; Sync</strong></td>
              <td>Local browser cache only (can be lost, does not sync)</td>
              <td>Encrypted cloud journal with cross-device sync</td>
            </tr>
            <tr>
              <td><strong>Watchlist &amp; Alert Limits</strong></td>
              <td>3 local saved markets</td>
              <td>Unlimited watchlists &amp; browser push telemetry</td>
            </tr>
            <tr>
              <td><strong>Statement Imports &amp; Exports</strong></td>
              <td>Manual entry</td>
              <td>Kalshi CSV statement import &amp; RFC 4180 export</td>
            </tr>
            <tr>
              <td><strong>Explanation Usage</strong></td>
              <td>Aria foundational arithmetic</td>
              <td>Full 8-specialist Council analysis stations</td>
            </tr>
            <tr>
              <td><strong>Paper Simulation Tools</strong></td>
              <td>Basic EV and hurdle calculators</td>
              <td>Realistic Shadow Mode with fee drag deduction</td>
            </tr>
            <tr>
              <td><strong>Support Channels</strong></td>
              <td>Documentation &amp; Flight School</td>
              <td>Email support (help@quanterraos.com, target &lt;24h)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Business & Developer Section -->
    <section class="business-section" aria-label="Business and Developer Offers">
      <div class="business-header">
        <div class="hero-tag">Desks &amp; Developers</div>
        <h2>Business &amp; API Infrastructure</h2>
        <p style="color:var(--text-dim); font-size:0.9rem;">High-throughput feeds, desk workflows, and dedicated institutional access.</p>
      </div>
      <div class="business-grid">
        <!-- Commander Card -->
        <div class="pricing-card">
          <div class="tier-name">${commander.name}</div>
          <div class="tier-desc">${commander.description}</div>
          <div class="price-box">
            <div class="price-amount">${commander.priceDisplay}</div>
            <div class="price-period">${commander.billingPeriod}</div>
          </div>
          <ul class="features-list">
            ${commander.features.map((f) => `<li><span class="check-icon">✓</span> <span>${f}</span></li>`).join("\n            ")}
          </ul>
          <a href="/institutional?tier=commander" class="action-btn btn-free">
            Discuss Desk Access
          </a>
        </div>

        <!-- Builder API Card -->
        <div class="pricing-card">
          <div class="tier-name">${builder.name}</div>
          <div class="tier-desc">${builder.description}</div>
          <div class="price-box">
            <div class="price-amount">${builder.priceDisplay}</div>
            <div class="price-period">${builder.billingPeriod}</div>
          </div>
          <ul class="features-list">
            ${builder.features.map((f) => `<li><span class="check-icon">✓</span> <span>${f}</span></li>`).join("\n            ")}
          </ul>
          <a href="${builder.ctaHref}" class="action-btn btn-free">
            View API Plans
          </a>
        </div>

        <!-- Institutional Card -->
        <div class="pricing-card">
          <div class="tier-name">${institutional.name}</div>
          <div class="tier-desc">${institutional.description}</div>
          <div class="price-box">
            <div class="price-amount">${institutional.priceDisplay}</div>
            <div class="price-period">${institutional.billingPeriod}</div>
          </div>
          <ul class="features-list">
            ${institutional.features.map((f) => `<li><span class="check-icon">✓</span> <span>${f}</span></li>`).join("\n            ")}
          </ul>
          <a href="${institutional.ctaHref}" class="action-btn btn-free">
            Discuss Data Access
          </a>
        </div>
      </div>
    </section>

    <!-- Optional Coaching Addon Disclosure -->
    <div style="max-width:860px; margin: 0 auto 48px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 18px 24px; font-size: 0.8rem; color: var(--text-dim); line-height: 1.5;">
      <strong style="color:#FFF;">🧑‍✈️ ${COACHING_ADDON.name} (${COACHING_ADDON.priceDisplay}):</strong> ${COACHING_ADDON.description}
    </div>

    <!-- Billing FAQ Section -->
    <section class="faq-section" aria-label="Billing Frequently Asked Questions">
      <div class="faq-header">
        <div class="hero-tag">Frequently Asked Questions</div>
        <h2>Billing &amp; Access FAQ</h2>
      </div>
      <div class="faq-item">
        <div class="faq-question">What is free?</div>
        <div class="faq-answer">True cost calculation, hurdle checks, and the 20-minute delayed settlement radar are completely free without requiring an account or credit card. We believe mathematical risk clarity should be universally accessible.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">What does "live" mean?</div>
        <div class="faq-answer">"Live" refers to real-time market data streaming and WebSocket telemetry feeds from supported exchanges. QuanterraOS does NOT connect to live brokerage execution accounts or deploy live capital (Rule B5 locked: $0.00 capital deployed).</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">How do I cancel?</div>
        <div class="faq-answer">You can cancel your Pilot subscription anytime with one click in your Account settings. Your access will continue until the end of your prepaid billing period, with zero recurring charges thereafter.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Does annual billing renew?</div>
        <div class="faq-answer">Yes, annual subscriptions renew automatically at $349/year unless canceled before the renewal date. Renewal reminders are sent 14 days before your billing anniversary.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Is gear included with software subscriptions?</div>
        <div class="faq-answer">No. Physical merchandise (hoodies, jumpsuits, caps, accessories) has separate unit economics, supplier fulfillment, and payment processing. Merchandise is never quietly billed to software subscriptions.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Does this place trades?</div>
        <div class="faq-answer">No. QuanterraOS is an independent analytical radar and decision journal. It never routes live orders, holds custody of customer funds, or executes trades on any venue.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Is it a native app or PWA?</div>
        <div class="faq-answer">QuanterraOS is an installable Progressive Web App (PWA) engineered with 44px touch targets and offline-cached snapshots for Apple iPhone (Safari) and Android Chrome. No App Store download is required.</div>
      </div>
    </section>

    <!-- Independent Tool Notice & CFTC 4.41 Statutory Disclaimer -->
    <div style="max-width:840px; margin: 36px auto 0; font-family:var(--font-mono); font-size:0.74rem; color:var(--muted); text-align:center; line-height:1.6; border-top:1px solid rgba(255,255,255,0.08); padding-top:20px;">
      INDEPENDENT TOOL NOTICE: QuanterraOS is operated by Quantara Global LLC, an independent Delaware entity. QuanterraOS has no affiliation with Kalshi, Polymarket, CME Group, or CF Benchmarks.
      CFTC RULE 4.41 NOTICE: HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS HAVE CERTAIN LIMITATIONS. UNLIKE AN ACTUAL PERFORMANCE RECORD, SIMULATED RESULTS DO NOT REPRESENT ACTUAL TRADING. ZERO CAPITAL DEPLOYED UNDER PERMANENT RULE B5 AUDIT LOCK. 18+.
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}

  <script>
    function setBillingCycle(cycle) {
      const btnMonthly = document.getElementById('btn-toggle-monthly');
      const btnAnnual = document.getElementById('btn-toggle-annual');
      const priceVal = document.getElementById('pilot-price-val');
      const periodVal = document.getElementById('pilot-period-val');
      const savingsNote = document.getElementById('pilot-savings-note');
      const ctaBtn = document.getElementById('pilot-cta-btn');

      if (cycle === 'annual') {
        btnMonthly.classList.remove('active');
        btnAnnual.classList.add('active');
        priceVal.textContent = '$349';
        periodVal.textContent = 'per year (about $29.08/mo)';
        savingsNote.style.display = 'block';
        ctaBtn.textContent = 'Choose Annual Pilot';
        ctaBtn.href = '/account?plan=pilot&interval=annual';
      } else {
        btnAnnual.classList.remove('active');
        btnMonthly.classList.add('active');
        priceVal.textContent = '$39';
        periodVal.textContent = 'per month';
        savingsNote.style.display = 'none';
        ctaBtn.textContent = 'Choose Pilot';
        ctaBtn.href = '/account?plan=pilot&interval=monthly';
      }
    }
  </script>
</body>
</html>`;
}
