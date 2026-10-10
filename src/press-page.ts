/**
 * QuanterraOS Press Kit & Media Citations Page (/press, /press-kit)
 * Implements Part 3.12:
 * "Press kit page for media citations" (acquire Kalshinomics' strength — cited in WSJ, Verge, Blockworks).
 *
 * Provides:
 * - Media fast facts (independence, non-advisory, $0 capital deployed Rule B5, n=1,316 calibration dataset).
 * - Official corporate boilerplate & founder quotes.
 * - Citation guide for financial journalists & academic researchers (citing settlement TWAP & fee drag).
 * - Downloadable brand vector assets & verification seals.
 * - Direct press contact inquiry intake.
 *
 * Strict Compliance:
 * - Rule B4: Zero superlatives ("alpha", "guaranteed", "beat the market").
 * - Rule B5: $0.00 capital deployed; zero order routing.
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderPressPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Press Kit &amp; Media Citations — QuanterraOS</title>
  <meta name="description" content="Official media kit, empirical research citation guidelines, and verified data assets for financial journalists covering prediction markets.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #000000; color: #FFFFFF; font-family: var(--public-font-sans); }
    .press-wrap { max-width: 980px; margin: 0 auto; padding: 64px 24px 96px; }
    .press-eyebrow { font-family: var(--public-font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--public-accent-gold); letter-spacing: 0.12em; margin-bottom: 12px; }
    .press-title { font-size: clamp(2rem, 4.5vw, 3.2rem); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 16px; }
    .press-lead { font-size: 1.1rem; color: var(--public-muted); line-height: 1.6; margin-bottom: 48px; max-width: 760px; }
    
    .fast-facts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 56px; }
    .fact-card { background: rgba(18, 22, 34, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 24px; }
    .fact-metric { font-family: var(--public-font-mono); font-size: 1.8rem; font-weight: 700; color: #FFFFFF; margin-bottom: 6px; }
    .fact-label { font-size: 0.85rem; color: var(--public-accent-gold); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .fact-desc { font-size: 0.82rem; color: #94A3B8; line-height: 1.4; }

    .press-section { margin-bottom: 56px; }
    .press-section h2 { font-size: 1.6rem; font-weight: 700; margin-bottom: 20px; color: #FFFFFF; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; }
    
    .citation-card { background: #0A0D16; border: 1px solid #1E293B; border-radius: 10px; padding: 24px; margin-bottom: 20px; }
    .citation-type { font-family: var(--public-font-mono); font-size: 0.75rem; color: var(--public-accent-gold); text-transform: uppercase; margin-bottom: 8px; }
    .citation-example { font-family: var(--public-font-mono); font-size: 0.85rem; background: #04060A; border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 14px; color: #E2E8F0; line-height: 1.5; margin: 12px 0; }
    
    .asset-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
    .asset-card { background: #0E1422; border: 1px solid #1E293B; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; }
    .asset-title { font-size: 1.1rem; font-weight: 600; color: #FFF; margin-bottom: 8px; }
    .asset-meta { font-size: 0.82rem; color: #94A3B8; margin-bottom: 16px; }
    
    .btn-press { display: inline-block; background: #C9A24A; color: #000; font-weight: 600; font-size: 0.85rem; text-decoration: none; padding: 8px 18px; border-radius: 6px; text-align: center; }
    .btn-press-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #FFF; }
    .btn-press-outline:hover { background: rgba(255,255,255,0.06); }
    
    .contact-card { background: linear-gradient(180deg, #111827 0%, #090C14 100%); border: 1px solid #C9A24A; border-radius: 12px; padding: 32px; text-align: center; margin-top: 48px; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/press" })}

  <main class="press-wrap">
    <div class="press-eyebrow">QuanterraOS Press Kit · Media Citations &amp; Fast Facts</div>
    <h1 class="press-title">Independent Prediction Market Intelligence</h1>
    <p class="press-lead">
      Empirical transaction cost auditing, settlement-index radar, and published calibration data for journalists, financial editors, and market researchers.
    </p>

    <!-- Fast Facts Strip -->
    <div class="fast-facts-grid">
      <div class="fact-card">
        <div class="fact-label">Independence</div>
        <div class="fact-metric">100%</div>
        <div class="fact-desc">Zero exchange equity, zero affiliate kickbacks, and no custody or trade routing.</div>
      </div>
      <div class="fact-card">
        <div class="fact-label">Capital Exposure</div>
        <div class="fact-metric">$0.00</div>
        <div class="fact-desc">Strict Rule B5 lock: pure decision-support software, non-custodial, no execution.</div>
      </div>
      <div class="fact-card">
        <div class="fact-label">Corpus Size</div>
        <div class="fact-metric">1,316+</div>
        <div class="fact-desc">Settled 15-minute windows (19,740 candles) audited in public calibration ledger.</div>
      </div>
      <div class="fact-card">
        <div class="fact-label">Settlement Index</div>
        <div class="fact-metric">60s TWAP</div>
        <div class="fact-desc">Real-time tracking of CME CF BRTI index vs. instantaneous retail spot feeds.</div>
      </div>
    </div>

    <!-- Official Boilerplate -->
    <section class="press-section">
      <h2>Company Overview &amp; Boilerplate</h2>
      <div class="citation-card">
        <div class="citation-type">Standard Media Description (50 Words)</div>
        <div class="citation-example">
          QuanterraOS is an independent prediction-market intelligence platform developed by Quantara Global LLC. It provides empirical transaction-fee auditing, settlement-index telemetry across Kalshi and Polymarket, and an audited calibration proof ledger. QuanterraOS does not execute trades, manage funds, or provide investment advice.
        </div>
      </div>

      <div class="citation-card">
        <div class="citation-type">Executive Quote for Attribution</div>
        <div class="citation-example">
          "Every prediction market platform tells traders what others are betting. QuanterraOS is the first to measure what a contract actually costs in fee friction, how it settles under institutional TWAP benchmarks, and whether the trader's calibration is improving over time." — QuanterraOS Research Desk
        </div>
      </div>
    </section>

    <!-- Citation Guidelines -->
    <section class="press-section">
      <h2>Media Citation Guidelines</h2>
      <p style="color: #94A3B8; font-size: 0.95rem; margin-bottom: 24px;">
        When citing QuanterraOS findings in market commentary (WSJ, Bloomberg, CoinDesk, Verge, Blockworks format):
      </p>

      <div class="citation-card">
        <div class="citation-type">Citing Taker Fee Friction &amp; Breakeven Probabilities</div>
        <div class="citation-example">
          "According to data from prediction-market analytics platform QuanterraOS, retail traders entering 50¢ contracts on Kalshi face a 1.75% taker fee drag, requiring a 51.75% directional win rate to break even."
        </div>
        <p style="font-size: 0.8rem; color: #64748B; margin: 0;">Link attribution: <a href="https://quanterraos.com/check" style="color: #C9A24A;">quanterraos.com/check</a></p>
      </div>

      <div class="citation-card">
        <div class="citation-type">Citing Settlement Basis &amp; TWAP Divergence</div>
        <div class="citation-example">
          "Research from QuanterraOS demonstrates that Kalshi Bitcoin contracts settle on the 60-second CME CF BRTI TWAP, creating basis divergence of up to 28 basis points against instantaneous spot exchange feeds during volatile expiry windows."
        </div>
        <p style="font-size: 0.8rem; color: #64748B; margin: 0;">Link attribution: <a href="https://quanterraos.com/radar" style="color: #C9A24A;">quanterraos.com/radar</a></p>
      </div>

      <div class="citation-card">
        <div class="citation-type">Citing Model Calibration &amp; Brier Scores</div>
        <div class="citation-example">
          "QuanterraOS maintains an audited public proof ledger tracking over 1,316 settled contracts, publishing when market consensus outperforms predictive models (Kalshi market mid Brier score 0.2001 vs internal model 0.2063)."
        </div>
        <p style="font-size: 0.8rem; color: #64748B; margin: 0;">Link attribution: <a href="https://quanterraos.com/proof" style="color: #C9A24A;">quanterraos.com/proof</a></p>
      </div>
    </section>

    <!-- Downloadable Assets -->
    <section class="press-section">
      <h2>Media Assets &amp; Verification Badges</h2>
      <div class="asset-grid">
        <div class="asset-card">
          <div>
            <div class="asset-title">Audited Settlement SVG Receipt</div>
            <div class="asset-meta">Vector SVG · High-DPI receipt with SHA-256 provenance hash</div>
          </div>
          <div style="margin-top: 16px;">
            <a href="/api/track-record/card.svg" target="_blank" class="btn-press">View SVG Receipt</a>
          </div>
        </div>

        <div class="asset-card">
          <div>
            <div class="asset-title">Full 1,316-Window Corpus</div>
            <div class="asset-meta">RFC 4180 CSV · Complete settled predictions with Brier scores</div>
          </div>
          <div style="margin-top: 16px;">
            <a href="/api/track-record/export.csv" class="btn-press">Download CSV</a>
          </div>
        </div>

        <div class="asset-card">
          <div>
            <div class="asset-title">Monthly Proof Report (Markdown)</div>
            <div class="asset-meta">Formatted report · Decile calibration breakdown &amp; Murphy decomposition</div>
          </div>
          <div style="margin-top: 16px;">
            <a href="/api/proof/monthly-report.md" class="btn-press">Download Markdown</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Box -->
    <div class="contact-card">
      <h3 style="font-size: 1.4rem; font-weight: 700; color: #FFFFFF; margin-bottom: 8px;">Press &amp; Research Inquiries</h3>
      <p style="font-size: 0.95rem; color: #94A3B8; max-width: 540px; margin: 0 auto 20px;">
        For custom data pulls, embargoed research briefings, or background commentary on prediction market microstructure:
      </p>
      <div style="font-family: var(--public-font-mono); font-size: 1.1rem; color: var(--public-accent-gold); font-weight: 700; margin-bottom: 16px;">
        press@quanterraos.com
      </div>
      <div style="font-size: 0.82rem; color: #64748B;">
        Quantara Global LLC · Response turnaround within 4 business hours for credentialed press.
      </div>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
