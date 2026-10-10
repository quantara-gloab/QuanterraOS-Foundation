/**
 * QuanterraOS Pricing Page (/pricing)
 *
 * Implements QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md (Part 4):
 * Single Source of Truth: src/config/pricing.ts
 *
 * Tiers:
 * 1. Cadet (Free) — $0
 * 2. Pilot (Pro) — $39/mo · $349/yr (14-day trial)
 * 3. Commander (Desk) — $399/mo (annual commitment)
 * 4. Builder API — $49/mo
 * 5. Institutional / Data — Custom (anchor $1,500+/mo)
 * + Flight Instructor Human Coaching Add-on ($149/session or $399/mo)
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { PRICING_PLANS, COACHING_ADDON, type PricingPlan } from "./config/pricing.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS
} from "./components/public-layout.ts";

export function renderPricingPageHtml(userTier: string = "free"): string {
  const planCardsHtml = PRICING_PLANS.map((plan: PricingPlan) => {
    const isFeatured = plan.isPopular;
    const badgeHtml = plan.badge ? `<div class="featured-badge">${plan.badge}</div>` : "";
    const isCurrent = userTier.toLowerCase() === plan.id;

    const featuresHtml = plan.features
      .map(
        (f) => `<li><span class="check-icon">✓</span> <span>${f}</span></li>`
      )
      .join("\n          ");

    const actionBtnHtml = `<a href="${plan.ctaHref}" class="action-btn ${isFeatured ? "btn-pro" : "btn-free"}">
            ${isCurrent ? "Current Plan (Active)" : plan.ctaText}
          </a>`;

    return `
      <div class="pricing-card ${isFeatured ? "featured" : ""}">
        ${badgeHtml}
        <div class="tier-name">${plan.name}</div>
        <div class="tier-desc">${plan.description}</div>
        <div class="price-box">
          <div class="price-amount">${plan.priceDisplay}</div>
          <div class="price-period">${plan.billingPeriod}</div>
        </div>
        <ul class="features-list">
          ${featuresHtml}
        </ul>
        ${actionBtnHtml}
      </div>
    `;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Pricing & Subscriptions — QuanterraOS</title>
  <meta name="description" content="Transparent, single-source-of-truth pricing for QuanterraOS Flight Deck, Settlement Radar, and developer APIs.">
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

    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 36px;
      border-bottom: 1px solid var(--border);
      background: rgba(6, 7, 10, 0.88);
      backdrop-filter: blur(20px) saturate(180%);
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
      font-size: 1rem;
      letter-spacing: -0.01em;
      font-family: var(--font-mono);
    }
    .nav-brand span { color: var(--accent); font-size: 0.8rem; font-weight: 400; }
    .nav-links { display: flex; gap: 18px; align-items: center; }
    .nav-links a { color: var(--text-dim); text-decoration: none; font-size: 0.84rem; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .btn-account {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      text-decoration: none;
      background: rgba(212, 175, 55, 0.06);
      border: 1px solid var(--border);
      color: var(--text);
      transition: border-color 0.15s, background-color 0.15s;
    }
    .btn-account:hover {
      background: rgba(212, 175, 55, 0.15);
      border-color: var(--accent);
      color: #FFFFFF;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 48px 24px 0;
    }

    .hero-header {
      text-align: center;
      max-width: 780px;
      margin: 0 auto 48px;
    }
    .hero-tag {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
      background: rgba(223, 184, 67, 0.08);
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid rgba(223, 184, 67, 0.25);
    }
    .hero-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 14px;
      background: linear-gradient(180deg, #FFFFFF 40%, #A0AEC0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
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

    /* Pricing Grid */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 56px;
    }

    .pricing-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 12px 28px rgba(0, 0, 0, 0.4);
    }
    .pricing-card:hover {
      border-color: rgba(212, 175, 55, 0.35);
      transform: translateY(-2px);
    }
    .pricing-card.featured {
      background: linear-gradient(180deg, rgba(20, 26, 40, 0.95) 0%, rgba(13, 17, 26, 0.98) 100%);
      border-color: var(--border-accent);
      box-shadow: inset 0 1px 0 0 rgba(247, 231, 180, 0.4), 0 0 35px rgba(223, 184, 67, 0.18), 0 16px 36px rgba(0, 0, 0, 0.5);
    }
    .featured-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(180deg, #FBF3D5 0%, #DFB843 40%, #B88E28 100%);
      color: #07080B;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4);
      white-space: nowrap;
    }
    .tier-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 6px;
    }
    .tier-desc {
      font-size: 0.82rem;
      color: var(--muted);
      min-height: 48px;
      margin-bottom: 18px;
      line-height: 1.45;
    }
    .price-box {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .price-amount {
      font-size: 2.2rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: #FFFFFF;
    }
    .price-period {
      font-size: 0.78rem;
      color: var(--muted);
      font-family: var(--font-mono);
    }

    .features-list {
      list-style: none;
      margin-bottom: 28px;
      flex-grow: 1;
    }
    .features-list li {
      font-size: 0.82rem;
      color: #CBD5E1;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.4;
    }
    .check-icon {
      color: var(--accent);
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.85rem;
      line-height: 1.2;
    }

    .action-btn {
      width: 100%;
      padding: 12px;
      border-radius: 6px;
      font-size: 0.84rem;
      font-family: var(--font-mono);
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      display: block;
    }
    .action-btn:hover {
      transform: translateY(-1px);
    }
    .btn-free {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-free:hover {
      background: rgba(212, 175, 55, 0.1);
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

    /* Coaching Addon Box */
    .coaching-addon-card {
      background: linear-gradient(180deg, rgba(20, 26, 40, 0.7) 0%, rgba(10, 14, 22, 0.85) 100%);
      border: 1px solid rgba(223, 184, 67, 0.3);
      border-radius: 12px;
      padding: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 56px;
    }
    .coaching-info h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .coaching-info p {
      font-size: 0.85rem;
      color: var(--text-dim);
      max-width: 720px;
      line-height: 1.5;
    }
    .coaching-price-box {
      text-align: right;
    }
    .coaching-price {
      font-family: var(--font-mono);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 6px;
    }

    /* Footer & Compliance */
    .pricing-footer {
      border-top: 1px solid var(--border);
      padding-top: 24px;
      font-family: var(--font-mono);
      font-size: 0.76rem;
      color: var(--muted);
      text-align: center;
      line-height: 1.6;
    }
    .pricing-footer span { color: var(--accent); }
    ${PUBLIC_LAYOUT_CSS}
  </style>
</head>
<body>

  ${renderPublicHeader({ activePath: "/pricing" })}

  <main class="container">
    <div class="hero-header">
      <div class="hero-tag">Single Source of Truth · Transparent Plans</div>
      <h1>Predictable, Transparent Pricing</h1>
      <p class="hero-subtitle">
        Trade like a pilot, not a passenger. Free essential checks and transparent upgrades for real-time telemetry, mission logging, and institutional data.
      </p>
      <div class="honest-callout">
        <strong>The Independence Guarantee:</strong> QuanterraOS takes zero exchange volume kickbacks or referral fees. You pay only for real-time immediacy and research tooling.
      </div>
    </div>

    <!-- 5 Core Plans Grid -->
    <div class="pricing-grid">
      ${planCardsHtml}
    </div>

    <!-- Coaching Addon Card -->
    <div class="coaching-addon-card">
      <div class="coaching-info">
        <h3><span>🧑‍✈️</span> ${COACHING_ADDON.name}</h3>
        <p>${COACHING_ADDON.description}</p>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-light); margin-top:6px;">
          ${COACHING_ADDON.sessions}
        </div>
      </div>
      <div class="coaching-price-box">
        <div class="coaching-price">${COACHING_ADDON.priceDisplay}</div>
        <a href="/account?addon=coaching" class="action-btn btn-pro" style="padding:10px 20px; display:inline-block;">
          Inquire Coaching
        </a>
      </div>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
