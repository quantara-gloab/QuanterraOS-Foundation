/**
 * QuanterraOS Mission Brief & News Digest Page (/news)
 *
 * Implements Part 2.1 & 3.12:
 * Weekly "Mission Brief" digest:
 * 1. What fees cost BTC traders this week (taker fee friction analysis)
 * 2. Settlement-gap events and TWAP post-mortems (CME CF BRTI 60s TWAP vs spot)
 * 3. Rolling calibration updates (Brier baseline comparison + "market beats our model" transparency)
 * 4. Upcoming macro/BTC calendar
 *
 * Plus:
 * - Monthly Proof Report automation downloads & viewer links
 * - Press Kit banner & media citation links
 * - Email subscription intake form
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
import {
  getLatestMissionBrief,
  getAllMissionBriefs,
} from "./lib/mission-brief.ts";

export function renderNewsPageHtml(): string {
  const latest = getLatestMissionBrief();
  const allBriefs = getAllMissionBriefs();

  const calendarRows = latest.upcomingMacroCalendar
    .map(
      (m) => `
    <tr>
      <td style="padding:10px 14px; font-family:var(--public-font-mono); font-size:0.8rem; color:var(--public-accent-gold); white-space:nowrap; border-bottom:1px solid rgba(255,255,255,0.06);">${m.date}</td>
      <td style="padding:10px 14px; font-weight:600; color:#FFF; border-bottom:1px solid rgba(255,255,255,0.06);">${m.event}</td>
      <td style="padding:10px 14px; font-family:var(--public-font-mono); font-size:0.75rem; color:${m.impactLevel === "CRITICAL" ? "#EF4444" : "#F59E0B"}; font-weight:700; border-bottom:1px solid rgba(255,255,255,0.06);">${m.impactLevel}</td>
      <td style="padding:10px 14px; font-size:0.85rem; color:#94A3B8; border-bottom:1px solid rgba(255,255,255,0.06);">${m.briefingNote}</td>
    </tr>
  `
    )
    .join("");

  const settlementCards = latest.settlementGapEvents
    .map(
      (e) => `
    <div class="settlement-card">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span style="font-family:var(--public-font-mono); font-size:0.85rem; color:#4FD1E8; font-weight:700;">${e.contractTicker}</span>
        <span style="font-family:var(--public-font-mono); font-size:0.78rem; color:#64748B;">${e.eventDate}</span>
      </div>
      <p style="font-size:0.9rem; color:#CBD5E1; margin:0 0 10px; line-height:1.5;">${e.summary}</p>
      <div class="post-mortem-box">
        <strong style="color:var(--public-accent-gold);">Settlement Post-Mortem:</strong> ${e.postMortemLesson}
      </div>
    </div>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Mission Brief &amp; Market Digest — QuanterraOS</title>
  <meta name="description" content="Weekly QuanterraOS Mission Brief: empirical analysis of prediction market transaction friction, settlement events, and rolling calibration updates.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #000000; color: #FFFFFF; font-family: var(--public-font-sans); }
    .news-container { max-width: 980px; margin: 0 auto; padding: 64px 24px 96px; }
    .news-eyebrow { font-family: var(--public-font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--public-accent-gold); letter-spacing: 0.12em; margin-bottom: 12px; }
    .news-title { font-size: clamp(2rem, 4.5vw, 3.2rem); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 16px; }
    .news-lead { font-size: 1.1rem; color: var(--public-muted); line-height: 1.6; margin-bottom: 36px; max-width: 760px; }
    
    /* Email Subscribe Box */
    .subscribe-banner { background: linear-gradient(180deg, #111827 0%, #090C14 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px 32px; margin-bottom: 48px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
    .sub-input-wrap { display: flex; gap: 10px; flex-wrap: wrap; max-width: 440px; width: 100%; }
    .sub-input { flex: 1; min-width: 220px; background: #06080E; border: 1px solid #1E293B; border-radius: 6px; padding: 10px 14px; font-size: 0.9rem; color: #FFF; outline: none; }
    .sub-input:focus { border-color: var(--public-accent-gold); }
    .btn-gold { background: var(--public-accent-gold); color: #000; font-weight: 600; font-size: 0.88rem; border: none; border-radius: 6px; padding: 10px 20px; cursor: pointer; transition: opacity 0.15s; }
    .btn-gold:hover { opacity: 0.9; }

    /* Mission Brief Main Card */
    .brief-main { background: rgba(18, 22, 34, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 36px; margin-bottom: 48px; }
    .brief-badge-strip { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .brief-issue-tag { font-family: var(--public-font-mono); font-size: 0.8rem; color: var(--public-accent-gold); text-transform: uppercase; letter-spacing: 0.1em; }
    .brief-headline { font-size: 1.9rem; font-weight: 700; margin: 0 0 14px; color: #FFF; letter-spacing: -0.01em; }
    .brief-summary { font-size: 1.05rem; color: #CBD5E1; line-height: 1.6; margin-bottom: 32px; }

    /* 4 Sections Inside Brief */
    .section-box { background: #0A0D16; border: 1px solid #1E293B; border-radius: 10px; padding: 24px; margin-bottom: 28px; }
    .sec-eyebrow { font-family: var(--public-font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--public-accent-gold); letter-spacing: 0.1em; margin-bottom: 8px; }
    .sec-title { font-size: 1.25rem; font-weight: 700; color: #FFF; margin-bottom: 16px; }
    
    .stats-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .stat-pill { background: #05070C; border: 1px solid #1E293B; border-radius: 8px; padding: 14px; }
    .stat-pill-label { font-size: 0.75rem; color: #64748B; font-family: var(--public-font-mono); margin-bottom: 4px; }
    .stat-pill-val { font-size: 1.5rem; font-weight: 700; font-family: var(--public-font-mono); }

    .settlement-card { background: #06080E; border: 1px solid #1E293B; border-radius: 8px; padding: 18px; margin-bottom: 14px; }
    .post-mortem-box { background: rgba(201, 162, 74, 0.08); border-left: 3px solid var(--public-accent-gold); padding: 10px 14px; font-size: 0.85rem; color: #E2E8F0; line-height: 1.4; border-radius: 0 4px 4px 0; }

    /* Transparency Box */
    .transparency-callout { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .transparency-title { font-size: 0.82rem; font-weight: 700; color: #10B981; font-family: var(--public-font-mono); text-transform: uppercase; margin-bottom: 4px; }
    .transparency-quote { font-size: 0.95rem; color: #F1F5F9; font-weight: 500; }

    /* Secondary Split: Proof Reports & Press Kit */
    .split-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 48px; }
    .card-secondary { background: rgba(18, 22, 34, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 28px; }
    
    .btn-tesla-secondary { display: inline-block; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #FFF; font-size: 0.84rem; padding: 8px 18px; border-radius: 6px; text-decoration: none; transition: background 0.15s; }
    .btn-tesla-secondary:hover { background: rgba(255,255,255,0.06); }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/news" })}

  <main class="news-container">
    <div class="news-eyebrow">Weekly Intelligence Digest · Mission Brief</div>
    <h1 class="news-title">Prediction Market Friction &amp; Settlement Intel</h1>
    <p class="news-lead">
      Empirical findings on what exchange fee structures cost active traders, live settlement post-mortems, and rolling calibration updates.
    </p>

    <!-- Email Subscription Intake Banner -->
    <div class="subscribe-banner">
      <div>
        <div style="font-size: 1.15rem; font-weight: 700; color: #FFF; margin-bottom: 4px;">Get the Weekly Mission Brief</div>
        <div style="font-size: 0.85rem; color: #94A3B8;">Delivered every Friday morning. No spam, zero picks, arithmetic only.</div>
      </div>
      <form id="subscribe-form" class="sub-input-wrap" onsubmit="handleSubscribe(event)">
        <input type="email" id="subscribe-email" class="sub-input" placeholder="trader@domain.com" required>
        <button type="submit" class="btn-gold" id="subscribe-btn">Subscribe</button>
      </form>
    </div>
    <div id="subscribe-alert" style="display:none; padding:12px 18px; border-radius:6px; margin:-32px 0 36px; font-size:0.88rem;"></div>

    <!-- Main Current Mission Brief (Issue #14) -->
    <article class="brief-main">
      <div class="brief-badge-strip">
        <span class="brief-issue-tag">MISSION BRIEF #${latest.issueNumber} · ${latest.weekIdentifier}</span>
        <span style="font-family:var(--public-font-mono); font-size:0.8rem; color:#10B981;">AUDITED CORNER</span>
      </div>
      
      <h2 class="brief-headline">${latest.title}</h2>
      <p class="brief-summary">${latest.editorialSummary}</p>

      <!-- 1. Taker Fee Friction Analysis -->
      <div class="section-box">
        <div class="sec-eyebrow">1. Taker Fee Friction Analysis</div>
        <div class="sec-title">What Fees Cost BTC Prediction Traders This Week</div>
        
        <div class="stats-strip">
          <div class="stat-pill">
            <div class="stat-pill-label">EST. RETAIL TAKER FEES</div>
            <div class="stat-pill-val" style="color:#EF4444;">$${latest.feesCostAnalysis.totalTakerFeesEstimatedUsd.toLocaleString()}</div>
          </div>
          <div class="stat-pill">
            <div class="stat-pill-label">50¢ COIN-FLIP DRAG</div>
            <div class="stat-pill-val" style="color:#F59E0B;">${latest.feesCostAnalysis.coinFlipZoneFeeDragPct}%</div>
          </div>
          <div class="stat-pill">
            <div class="stat-pill-label">REQUIRED BREAKEVEN</div>
            <div class="stat-pill-val" style="color:#4FD1E8;">${latest.feesCostAnalysis.breakevenRequiredWinRatePct}%</div>
          </div>
        </div>

        <p style="font-size:0.92rem; color:#CBD5E1; line-height:1.5; margin:0 0 12px;">
          ${latest.feesCostAnalysis.keyTakeaway}
        </p>
        <div style="font-size:0.85rem; color:#10B981; font-family:var(--public-font-mono);">
          &bull; ${latest.feesCostAnalysis.avoidableLossRetailTotal}
        </div>
      </div>

      <!-- 2. Settlement-Gap Events & TWAP Post-Mortems -->
      <div class="section-box">
        <div class="sec-eyebrow">2. Settlement-Gap Events &amp; TWAP Post-Mortems</div>
        <div class="sec-title">CME CF BRTI 60-Second TWAP vs. Instantaneous Spot Disconnects</div>
        ${settlementCards}
      </div>

      <!-- 3. Rolling Calibration Update -->
      <div class="section-box">
        <div class="sec-eyebrow">3. Rolling Calibration Update &bull; n = ${latest.rollingCalibration.corpusSampleSize} Settled Windows</div>
        <div class="sec-title">Audited Brier Baseline Performance</div>

        <div class="transparency-callout">
          <div class="transparency-title">Transparency Disclosure (Part 0.3 Guardrail)</div>
          <div class="transparency-quote">"${latest.rollingCalibration.transparencyStatement}"</div>
        </div>

        <table style="width:100%; border-collapse:collapse; font-family:var(--public-font-mono); font-size:0.85rem;">
          <tr style="color:#64748B; border-bottom:1px solid #1E293B;">
            <th style="text-align:left; padding:8px 0;">Benchmark</th>
            <th style="text-align:right; padding:8px 0;">Brier Score</th>
            <th style="text-align:right; padding:8px 0;">Note</th>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
            <td style="padding:10px 0; color:#FFF;">Kalshi Market Mid</td>
            <td style="text-align:right; padding:10px 0; color:#10B981; font-weight:700;">${latest.rollingCalibration.kalshiMarketMidBrier.toFixed(4)}</td>
            <td style="text-align:right; padding:10px 0; color:#94A3B8;">Benchmark Leader</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
            <td style="padding:10px 0; color:#FFF;">QuanterraOS Model</td>
            <td style="text-align:right; padding:10px 0; color:var(--public-accent-gold); font-weight:700;">${latest.rollingCalibration.internalModelBrier.toFixed(4)}</td>
            <td style="text-align:right; padding:10px 0; color:#94A3B8;">Reliability: ${latest.rollingCalibration.reliabilityScore}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; color:#FFF;">50/50 Coin-Flip</td>
            <td style="text-align:right; padding:10px 0; color:#EF4444; font-weight:700;">${latest.rollingCalibration.uncalibratedCoinFlipBrier.toFixed(4)}</td>
            <td style="text-align:right; padding:10px 0; color:#94A3B8;">Uncalibrated baseline</td>
          </tr>
        </table>
      </div>

      <!-- 4. Upcoming Macro/BTC Calendar -->
      <div class="section-box" style="margin-bottom:0;">
        <div class="sec-eyebrow">4. Upcoming Macro &amp; BTC Schedule</div>
        <div class="sec-title">Key Volatility Catalysts</div>
        <table style="width:100%; border-collapse:collapse;">
          ${calendarRows}
        </table>
      </div>
    </article>

    <!-- Secondary Split: Monthly Proof Report Automation & Press Kit -->
    <div class="split-grid">
      <!-- Monthly Proof Report Automation -->
      <div class="card-secondary" id="proof-reports">
        <div class="sec-eyebrow">Monthly Automated Audit</div>
        <h3 style="font-size:1.3rem; font-weight:700; color:#FFF; margin-bottom:10px;">Monthly Proof Report</h3>
        <p style="font-size:0.9rem; color:#94A3B8; line-height:1.5; margin-bottom:20px;">
          Auto-generated monthly calibration dossiers from our continuous 1,316-window settlement ledger, including decile calibration tables and Murphy/Yates decompositions.
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <a href="/proof/monthly-report" class="btn-tesla-secondary" style="background:#C9A24A; color:#000; font-weight:600; border:none;">View October Report &rarr;</a>
          <a href="/api/proof/monthly-report.md" class="btn-tesla-secondary">Download .MD</a>
          <a href="/proof" class="btn-tesla-secondary">Proof Ledger</a>
        </div>
      </div>

      <!-- Press Kit Section -->
      <div class="card-secondary" id="press-kit">
        <div class="sec-eyebrow">Media Citations &amp; Assets</div>
        <h3 style="font-size:1.3rem; font-weight:700; color:#FFF; margin-bottom:10px;">Press Kit &amp; Citation Guide</h3>
        <p style="font-size:0.9rem; color:#94A3B8; line-height:1.5; margin-bottom:20px;">
          Resources for financial journalists, market researchers, and editors covering prediction market microstructure, taker fees, and settlement TWAP basis.
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <a href="/press" class="btn-tesla-secondary" style="background:#C9A24A; color:#000; font-weight:600; border:none;">Open Press Kit &rarr;</a>
          <a href="/api/track-record/card.svg" class="btn-tesla-secondary" target="_blank">SVG Receipt</a>
        </div>
      </div>
    </div>

    <!-- Brief Archive List -->
    <section>
      <h3 style="font-size:1.3rem; font-weight:700; margin-bottom:16px;">Previous Mission Briefs</h3>
      ${allBriefs
        .slice(1)
        .map(
          (b) => `
        <div style="background:rgba(18,22,34,0.5); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:20px 24px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--public-accent-gold); margin-bottom:4px;">ISSUE #${b.issueNumber} &bull; ${b.publishedDate}</div>
            <div style="font-size:1.05rem; font-weight:600; color:#FFF;">${b.title}</div>
          </div>
          <a href="/news?issue=${b.issueNumber}" class="btn-tesla-secondary">Read Brief &rarr;</a>
        </div>
      `
        )
        .join("")}
    </section>
  </main>

  <script>
    async function handleSubscribe(e) {
      e.preventDefault();
      const input = document.getElementById('subscribe-email');
      const btn = document.getElementById('subscribe-btn');
      const alert = document.getElementById('subscribe-alert');
      const email = input.value;
      btn.disabled = true;
      btn.textContent = 'Subscribing...';
      try {
        const res = await fetch('/api/news/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        alert.style.display = 'block';
        if (data.success) {
          alert.style.background = 'rgba(16, 185, 129, 0.15)';
          alert.style.border = '1px solid #10B981';
          alert.style.color = '#10B981';
          alert.textContent = data.message || 'Subscribed successfully!';
          input.value = '';
        } else {
          alert.style.background = 'rgba(239, 68, 68, 0.15)';
          alert.style.border = '1px solid #EF4444';
          alert.style.color = '#EF4444';
          alert.textContent = data.message || 'Failed to subscribe.';
        }
      } catch (err) {
        alert.style.display = 'block';
        alert.style.background = 'rgba(239, 68, 68, 0.15)';
        alert.style.border = '1px solid #EF4444';
        alert.style.color = '#EF4444';
        alert.textContent = 'Connection error. Please try again.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    }
  </script>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
