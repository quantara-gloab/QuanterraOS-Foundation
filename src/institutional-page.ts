/**
 * QuanterraOS Institutional Desks & Enterprise Data Page (/institutional)
 *
 * Implements Part 2.1 & 3.10:
 * Segmented by 4 buyer types:
 * 1. Market Makers & Liquidity Providers
 * 2. Proprietary Trading Desks
 * 3. Funds & Macro Research
 * 4. Media & Distribution Partners
 * Each with 4 concrete bullets, API/WebSocket overview, and "Book a Call".
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderInstitutionalPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Institutional Desks &amp; Enterprise Telemetry — QuanterraOS</title>
  <meta name="description" content="Sub-millisecond prediction market microstructure feeds, CME CF BRTI constituent dispersion tapes, and Model Context Protocol endpoints for trading desks.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #000000; color: #FFFFFF; font-family: var(--public-font-sans); }
    .inst-container { max-width: 1140px; margin: 0 auto; padding: 64px 24px 96px; }
    .inst-hero { text-align: center; max-width: 780px; margin: 0 auto 56px; }
    .inst-eyebrow { font-family: var(--public-font-mono); font-size: 0.78rem; text-transform: uppercase; color: var(--public-accent-gold); letter-spacing: 0.12em; margin-bottom: 14px; }
    .inst-title { font-size: clamp(2.2rem, 5vw, 3.6rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 20px; }
    .inst-subtitle { font-size: 1.1rem; color: var(--public-muted); line-height: 1.6; margin-bottom: 32px; }
    .inst-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 56px; }
    .inst-card { background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 28px; }
    .inst-card h3 { font-size: 1.15rem; font-weight: 600; margin-bottom: 14px; color: #FFF; }
    .inst-card ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.88rem; color: #CBD5E1; }
    .inst-card li { display: flex; gap: 8px; align-items: flex-start; }
    .inst-card li::before { content: "▪"; color: var(--public-accent-gold); font-size: 1rem; line-height: 1.2; }
    .inst-cta-box { background: linear-gradient(180deg, rgba(20, 24, 34, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%); border: 1px solid var(--public-border-gold); border-radius: 12px; padding: 36px; text-align: center; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/institutional" })}

  <main class="inst-container">
    <div class="inst-hero">
      <div class="inst-eyebrow">Enterprise Solutions · Institutional Infrastructure</div>
      <h1 class="inst-title">Neutral Telemetry for Trading Desks &amp; Funds</h1>
      <p class="inst-subtitle">
        Low-latency order book snapshots, cross-venue spread feeds, and cryptographically verified settlement histories across regulated prediction markets.
      </p>
      <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
        <a href="mailto:institutional@quanterraos.com?subject=Enterprise%20Telemetry%20Inquiry" class="btn-tesla-primary">Book an Engineering Call &rarr;</a>
        <a href="/developers" class="btn-tesla-secondary">API &amp; MCP Documentation</a>
      </div>
    </div>

    <div class="inst-grid">
      <!-- 1. Market Makers -->
      <div class="inst-card">
        <h3>Market Makers &amp; LPs</h3>
        <ul>
          <li>Tick-by-tick order-book depth and liquidity wall telemetry.</li>
          <li>Cross-venue Polymarket vs Kalshi basis divergence alerts.</li>
          <li>Fee-aware net spread calculations across non-linear maker schedules.</li>
          <li>Direct WebSocket streams from 9 global exchange colocation nodes.</li>
        </ul>
      </div>

      <!-- 2. Prop Desks -->
      <div class="inst-card">
        <h3>Proprietary Trading Desks</h3>
        <ul>
          <li>CME CF BRTI 60-second TWAP oracle resolution monitoring.</li>
          <li>Historical tick archives across 1,316 settled Bitcoin contract windows.</li>
          <li>Deterministic settlement post-mortems and dispute risk scoring.</li>
          <li>Private dedicated instance deployment with custom SLA guarantees.</li>
        </ul>
      </div>

      <!-- 3. Funds & Macro Research -->
      <div class="inst-card">
        <h3>Funds &amp; Macro Research</h3>
        <ul>
          <li>Empirical Brier score calibration surface across all market strikes.</li>
          <li>Parquet dataset downloads for Python, DuckDB, and R research pipelines.</li>
          <li>Standardized OpenAPI 3.1 REST specifications and SDKs.</li>
          <li>Independent, conflict-free data: zero exchange kickbacks accepted.</li>
        </ul>
      </div>

      <!-- 4. Media & Partners -->
      <div class="inst-card">
        <h3>Media &amp; Distribution Partners</h3>
        <ul>
          <li>Embeddable responsive widgets with real-time settlement telemetry.</li>
          <li>White-label embed licensing for high-traffic financial publications.</li>
          <li>Authoritative citation data on prediction market fee structures.</li>
          <li>Weekly syndication digest and institutional research reports.</li>
        </ul>
      </div>
    </div>

    <div class="inst-cta-box">
      <h2 style="font-size:1.6rem; font-weight:700; margin-bottom:12px; color:#FFF;">Deploy Enterprise Infrastructure</h2>
      <p style="font-size:0.95rem; color:var(--public-muted); max-width:620px; margin:0 auto 24px; line-height:1.6;">
        Custom deployment, dedicated WebSocket channels, raw tick parquet export, and SLA guarantees for desks trading significant volume.
      </p>
      <a href="mailto:institutional@quanterraos.com?subject=Institutional%20Desk%20Access" class="btn-tesla-primary" style="display:inline-block;">Inquire Enterprise Access &rarr;</a>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
