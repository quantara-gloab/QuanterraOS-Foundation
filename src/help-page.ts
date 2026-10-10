/**
 * QuanterraOS Help Center & Support Page (/help)
 *
 * Implements Part 2.1:
 * Help Center:
 * - FAQs on fee calculations, maker savings, and settlement TWAP
 * - Account, billing, and subscription support
 * - Responsible trading features (loss limits, tilt cooldown)
 * - Direct contact / support dispatch
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderHelpPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Help Center &amp; Support — QuanterraOS</title>
  <meta name="description" content="QuanterraOS Help Center: documentation and FAQs on fee schedules, settlement radar, Flight Deck stations, and support.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #000000; color: #FFFFFF; font-family: var(--public-font-sans); }
    .help-container { max-width: 900px; margin: 0 auto; padding: 64px 24px 96px; }
    .help-eyebrow { font-family: var(--public-font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--public-accent-gold); letter-spacing: 0.12em; margin-bottom: 12px; }
    .help-title { font-size: clamp(2rem, 4.5vw, 3.2rem); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 16px; }
    .help-lead { font-size: 1.05rem; color: var(--public-muted); line-height: 1.6; margin-bottom: 48px; }
    .faq-item { background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 24px; margin-bottom: 20px; }
    .faq-q { font-size: 1.15rem; font-weight: 600; color: #FFF; margin-bottom: 10px; }
    .faq-a { font-size: 0.92rem; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/help" })}

  <main class="help-container">
    <div class="help-eyebrow">Support &amp; Documentation</div>
    <h1 class="help-title">Help Center &amp; Platform Guides</h1>
    <p class="help-lead">
      Find quick answers about true-cost formulas, settlement TWAP mechanisms, and responsible trading protections.
    </p>

    <div class="faq-item">
      <div class="faq-q">Does QuanterraOS execute orders or custody funds?</div>
      <div class="faq-a">
        No. Under Rule B5, QuanterraOS live capital exposure is permanently locked at $0.00. We do not provide automated execution, hold deposit balances, or give buy/sell investment advice. You trade directly on your own CFTC-regulated or decentralized exchange.
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-q">How does the Maker/Taker Saver work?</div>
      <div class="faq-a">
        Kalshi charges $0.00 in trading fees for resting maker/limit orders. If you cross the spread as a taker, you pay a parabolic fee peaking at $1.75 per 100 contracts at 50¢. The Maker Saver calculates exactly how much money you save on every order by posting a limit rather than taking market quotes.
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-q">What is the 60-Second TWAP Settlement Radar?</div>
      <div class="faq-a">
        Kalshi KXBTC15M contracts settle based on the 60-second Time-Weighted Average Price of the CME CF Bitcoin Real-Time Index (BRTI), sampled across seconds 840–900 of the 15-minute candle. QuanterraOS tracks all 4 constituent spot exchanges (Coinbase, Kraken, Bitstamp, Gemini) in real time so you are never surprised by basis divergence.
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-q">How can I contact technical support?</div>
      <div class="faq-a">
        Pilot (Pro) and Commander subscribers receive priority support via email (<a href="mailto:support@quanterraos.com" style="color:var(--public-accent-gold);">support@quanterraos.com</a>) with response times under 24 hours and 4 hours respectively.
      </div>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
