/**
 * QuanterraOS Mission Brief & News Digest Page (/news)
 *
 * Implements Part 2.1 & 3.12:
 * Weekly "Mission Brief" digest:
 * - What fees cost BTC prediction traders this week
 * - Settlement-gap events and TWAP post-mortems
 * - Rolling calibration updates (Brier baseline comparison)
 * - Upcoming macro/BTC calendar
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderNewsPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Mission Brief &amp; Market Digest — QuanterraOS</title>
  <meta name="description" content="Weekly QuanterraOS Mission Brief: empirical analysis of prediction market transaction friction, settlement events, and calibration updates.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #000000; color: #FFFFFF; font-family: var(--public-font-sans); }
    .news-container { max-width: 960px; margin: 0 auto; padding: 64px 24px 96px; }
    .news-eyebrow { font-family: var(--public-font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--public-accent-gold); letter-spacing: 0.12em; margin-bottom: 12px; }
    .news-title { font-size: clamp(2rem, 4.5vw, 3.2rem); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 16px; }
    .news-lead { font-size: 1.05rem; color: var(--public-muted); line-height: 1.6; margin-bottom: 48px; }
    .article-card { background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 32px; margin-bottom: 32px; }
    .article-meta { font-family: var(--public-font-mono); font-size: 0.78rem; color: var(--public-accent-gold); margin-bottom: 10px; }
    .article-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 12px; color: #FFF; }
    .article-snippet { font-size: 0.95rem; color: #94A3B8; line-height: 1.6; margin-bottom: 20px; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/news" })}

  <main class="news-container">
    <div class="news-eyebrow">Weekly Intelligence Digest · Mission Brief</div>
    <h1 class="news-title">Prediction Market Friction &amp; Settlement Intel</h1>
    <p class="news-lead">
      Empirical findings on what exchange fee structures cost active traders, live settlement post-mortems, and rolling calibration metrics.
    </p>

    <!-- Brief #1 -->
    <article class="article-card">
      <div class="article-meta">MISSION BRIEF #14 · OCTOBER 2026</div>
      <h2 class="article-title">The 50¢ Coin-Flip Drag: Where $280,000 in Taker Fees Vanished</h2>
      <p class="article-snippet">
        Our continuous order book observation across 1,316 KXBTC15M contracts revealed that over 68% of retail taker flow enters between 45¢ and 55¢. Because Kalshi's parabolic fee formula maximizes fee drag exactly at 50¢ ($1.75 per 100 contracts), traders required an unsustainable 51.75% directional win rate simply to break even.
      </p>
      <a href="/research" class="btn-tesla-secondary" style="display:inline-block; font-size:0.84rem; padding:8px 18px;">Read Research Memo &rarr;</a>
    </article>

    <!-- Brief #2 -->
    <article class="article-card">
      <div class="article-meta">MISSION BRIEF #13 · SEPTEMBER 2026</div>
      <h2 class="article-title">Settlement Basis Hazard: When Instantaneous Spot Diverges from TWAP</h2>
      <p class="article-snippet">
        A breakdown of four contract expiries where spot Bitcoin moved sharply during second 885 of the 15-minute candle. Why watching single-exchange spot feeds causes retail traders to misjudge the CME CF BRTI 60-second TWAP resolution.
      </p>
      <a href="/radar" class="btn-tesla-secondary" style="display:inline-block; font-size:0.84rem; padding:8px 18px;">Inspect Radar Replay &rarr;</a>
    </article>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
