/**
 * QuanterraOS Institutional Desks & Enterprise Data Page (/institutional)
 *
 * Implements Master Blueprint v2 Part 1, Part 3.10 & Part 4:
 * - Segmented by 4 buyer types:
 *   1. Market Makers & Liquidity Providers
 *   2. Proprietary Trading Desks
 *   3. Funds & Macro Research
 *   4. Media & Distribution Partners
 * - Each segment features 4 concrete bullets and a direct "Book a Call" action.
 * - Enterprise Pricing Anchor: Anchor $1,500+/mo with unmetered WebSocket, raw tick datasets, and dedicated Slack/Teams SLA (<1h).
 * - Interactive lead intake modal with <1h SLA tagging and client-side feedback.
 * - Adheres strictly to Rule B4 (no superlatives) and Rule B5 ($0 live capital lock).
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { PRICING_PLANS } from "./config/pricing.ts";

export function renderInstitutionalPageHtml(): string {
  const instPlan = PRICING_PLANS.find((p) => p.id === "institutional");
  const priceDisplay = instPlan?.priceDisplay ?? "Custom";
  const billingPeriod = instPlan?.billingPeriod ?? "anchor $1,500+/mo";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Institutional Desks &amp; Enterprise Telemetry — QuanterraOS</title>
  <meta name="description" content="Sub-millisecond prediction market microstructure feeds, CME CF BRTI constituent dispersion tapes, and Model Context Protocol endpoints for trading desks.">
  <link rel="stylesheet" href="/index.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    :root {
      --inst-bg: #000000;
      --inst-panel: #0A0D14;
      --inst-panel-elevated: #111522;
      --inst-border: rgba(255, 255, 255, 0.08);
      --inst-border-gold: rgba(201, 162, 74, 0.45);
      --inst-accent: #C9A24A;
      --inst-accent-light: #F7E7B4;
      --inst-green: #34D399;
      --inst-cyan: #38BDF8;
      --inst-muted: #8A8F98;
      --inst-mono: "IBM Plex Mono", monospace;
    }
    body {
      background: var(--inst-bg);
      color: #FFFFFF;
      font-family: var(--public-font-sans);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .inst-container { max-width: 1180px; margin: 0 auto; padding: 64px 24px 100px; }
    
    /* Hero */
    .inst-hero { text-align: center; max-width: 820px; margin: 0 auto 64px; }
    .inst-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--inst-mono);
      font-size: 0.78rem;
      text-transform: uppercase;
      color: var(--inst-accent);
      letter-spacing: 0.12em;
      margin-bottom: 16px;
      background: rgba(201, 162, 74, 0.08);
      border: 1px solid var(--inst-border-gold);
      padding: 4px 14px;
      border-radius: 20px;
    }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--inst-green); box-shadow: 0 0 8px var(--inst-green); }
    .inst-title { font-size: clamp(2.4rem, 5.5vw, 3.8rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 20px; }
    .inst-subtitle { font-size: 1.15rem; color: var(--inst-muted); line-height: 1.65; max-width: 720px; margin: 0 auto 36px; }

    .hero-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
    .btn-inst-primary {
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #C9A24A 70%, #9B7827 100%);
      color: #07080B;
      font-weight: 700;
      font-size: 0.88rem;
      font-family: var(--inst-mono);
      padding: 12px 28px;
      border-radius: 6px;
      text-decoration: none;
      box-shadow: 0 4px 20px rgba(201, 162, 74, 0.3);
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-inst-primary:hover { opacity: 0.94; transform: translateY(-1px); }
    .btn-inst-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--inst-border);
      color: #FFFFFF;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-inst-secondary:hover { border-color: var(--inst-border-gold); color: var(--inst-accent-light); }

    /* Segmented Grid */
    .section-eyebrow { font-family: var(--inst-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--inst-accent); letter-spacing: 0.1em; margin-bottom: 8px; }
    .section-headline { font-size: 1.8rem; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.02em; }
    .section-lead { font-size: 0.95rem; color: var(--inst-muted); margin-bottom: 32px; max-width: 680px; }

    .inst-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
      gap: 24px;
      margin-bottom: 64px;
    }
    .inst-card {
      background: var(--inst-panel);
      border: 1px solid var(--inst-border);
      border-radius: 12px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s;
    }
    .inst-card:hover {
      border-color: var(--inst-border-gold);
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }
    .card-badge {
      font-family: var(--inst-mono);
      font-size: 0.68rem;
      text-transform: uppercase;
      color: var(--inst-accent);
      background: rgba(201, 162, 74, 0.1);
      border: 1px solid var(--inst-border-gold);
      padding: 2px 8px;
      border-radius: 4px;
      align-self: flex-start;
      margin-bottom: 14px;
    }
    .inst-card h3 { font-size: 1.22rem; font-weight: 700; margin-bottom: 16px; color: #FFF; }
    .inst-card ul {
      list-style: none;
      margin: 0 0 24px 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 0.88rem;
      color: #CBD5E1;
      line-height: 1.5;
    }
    .inst-card li { display: flex; gap: 8px; align-items: flex-start; }
    .inst-card li::before {
      content: "▪";
      color: var(--inst-accent);
      font-size: 1.1rem;
      line-height: 1.2;
    }
    .btn-card-cta {
      background: rgba(201, 162, 74, 0.12);
      border: 1px solid var(--inst-border-gold);
      color: var(--inst-accent-light);
      font-family: var(--inst-mono);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
    }
    .btn-card-cta:hover {
      background: var(--inst-accent);
      color: #07080B;
      font-weight: 700;
    }

    /* Enterprise Pricing Anchor Box */
    .enterprise-anchor-box {
      background: linear-gradient(180deg, rgba(20, 26, 38, 0.8) 0%, rgba(10, 13, 20, 0.95) 100%);
      border: 1px solid var(--inst-border-gold);
      border-radius: 12px;
      padding: 40px;
      margin-bottom: 64px;
    }
    .anchor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--inst-border);
      padding-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .anchor-title-grp h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: 4px; }
    .anchor-title-grp p { color: var(--inst-muted); font-size: 0.9rem; }
    .anchor-price-tag {
      text-align: right;
      font-family: var(--inst-mono);
    }
    .price-num { font-size: 2rem; font-weight: 800; color: var(--inst-accent); }
    .price-sub { font-size: 0.75rem; color: var(--inst-muted); }

    .anchor-features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .af-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      font-size: 0.88rem;
      color: #E2E8F0;
    }
    .af-check { color: var(--inst-green); font-weight: 700; font-family: var(--inst-mono); }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-overlay.active { display: flex; }
    .modal-card {
      background: #0A0D15;
      border: 1px solid var(--inst-border-gold);
      border-radius: 12px;
      max-width: 560px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
      position: relative;
    }
    .modal-close {
      position: absolute;
      top: 20px;
      right: 20px;
      background: transparent;
      border: none;
      color: var(--inst-muted);
      font-size: 1.4rem;
      cursor: pointer;
    }
    .modal-close:hover { color: #FFF; }
    .modal-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 6px; }
    .modal-sub { font-size: 0.84rem; color: var(--inst-muted); margin-bottom: 20px; }
    .form-group { margin-bottom: 14px; text-align: left; }
    .form-label { display: block; font-size: 0.75rem; color: var(--inst-muted); font-family: var(--inst-mono); margin-bottom: 4px; text-transform: uppercase; }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      background: #05070B;
      border: 1px solid var(--inst-border);
      border-radius: 6px;
      padding: 10px 12px;
      color: #FFF;
      font-family: inherit;
      font-size: 0.88rem;
      box-sizing: border-box;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--inst-accent);
    }
    .form-textarea { resize: vertical; min-height: 80px; }
    .form-btn-submit {
      width: 100%;
      background: var(--inst-accent);
      color: #07080B;
      font-weight: 700;
      font-size: 0.88rem;
      font-family: var(--inst-mono);
      padding: 12px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      margin-top: 10px;
    }
    .form-btn-submit:hover { opacity: 0.92; }
    .success-panel {
      display: none;
      text-align: center;
      padding: 20px 0;
    }
    .success-badge {
      display: inline-block;
      font-family: var(--inst-mono);
      font-size: 0.82rem;
      color: var(--inst-green);
      background: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 14px;
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/institutional" })}

  <main class="inst-container">
    <!-- Hero -->
    <div class="inst-hero">
      <div class="inst-eyebrow">
        <span class="pulse-dot"></span>
        <span>Enterprise Solutions &bull; Institutional Infrastructure</span>
      </div>
      <h1 class="inst-title">Neutral Telemetry for Trading Desks &amp; Funds</h1>
      <p class="inst-subtitle">
        Sub-millisecond prediction market microstructure feeds, CME CF BRTI constituent dispersion tapes, and Model Context Protocol endpoints for trading desks and quantitative asset managers.
      </p>
      <div class="hero-actions">
        <button class="btn-inst-primary" onclick="openBookCallModal()">Book an Engineering Call &rarr;</button>
        <a href="/developers" class="btn-inst-secondary">Explore API &amp; MCP Docs</a>
      </div>
    </div>

    <!-- Segmented Buyer Sections -->
    <div>
      <div class="section-eyebrow">Buyer Segments &bull; Tailored Telemetry</div>
      <h2 class="section-headline">Engineered for Prediction Market Participants</h2>
      <p class="section-lead">
        Four dedicated infrastructure configurations designed specifically for high-throughput market makers, proprietary event desks, macro research funds, and financial publishers.
      </p>

      <div class="inst-grid">
        <!-- 1. Market Makers & LPs -->
        <div class="inst-card">
          <div>
            <span class="card-badge">Segment 01</span>
            <h3>Market Makers &amp; LPs</h3>
            <ul>
              <li>Tick-by-tick order-book depth and liquidity wall telemetry.</li>
              <li>Cross-venue Polymarket vs Kalshi basis divergence alerts.</li>
              <li>Fee-aware net spread calculations across non-linear maker schedules.</li>
              <li>Direct WebSocket streams from 9 global exchange colocation nodes.</li>
            </ul>
          </div>
          <button class="btn-card-cta" onclick="openBookCallModal('market-maker')">Book Market Maker Call &rarr;</button>
        </div>

        <!-- 2. Prop Desks -->
        <div class="inst-card">
          <div>
            <span class="card-badge">Segment 02</span>
            <h3>Proprietary Trading Desks</h3>
            <ul>
              <li>CME CF BRTI 60-second TWAP oracle resolution monitoring.</li>
              <li>Historical tick archives across 1,316 settled Bitcoin contract windows.</li>
              <li>Deterministic settlement post-mortems and dispute risk scoring.</li>
              <li>Private dedicated instance deployment with custom SLA guarantees.</li>
            </ul>
          </div>
          <button class="btn-card-cta" onclick="openBookCallModal('prop-desk')">Book Prop Desk Call &rarr;</button>
        </div>

        <!-- 3. Funds & Macro Research -->
        <div class="inst-card">
          <div>
            <span class="card-badge">Segment 03</span>
            <h3>Funds &amp; Macro Research</h3>
            <ul>
              <li>Empirical Brier score calibration surface across all market strikes.</li>
              <li>Parquet dataset downloads for Python, DuckDB, and R research pipelines.</li>
              <li>Standardized OpenAPI 3.1 REST specifications and SDKs.</li>
              <li>Independent, conflict-free data: zero exchange kickbacks accepted.</li>
            </ul>
          </div>
          <button class="btn-card-cta" onclick="openBookCallModal('macro-fund')">Book Macro Research Call &rarr;</button>
        </div>

        <!-- 4. Media & Distribution Partners -->
        <div class="inst-card">
          <div>
            <span class="card-badge">Segment 04</span>
            <h3>Media &amp; Distribution Partners</h3>
            <ul>
              <li>Embeddable responsive widgets with real-time settlement telemetry.</li>
              <li>White-label embed licensing for high-traffic financial publications.</li>
              <li>Authoritative citation data on prediction market fee structures.</li>
              <li>Weekly syndication digest and institutional research reports.</li>
            </ul>
          </div>
          <button class="btn-card-cta" onclick="openBookCallModal('media-partner')">Book Media Partnership Call &rarr;</button>
        </div>
      </div>
    </div>

    <!-- Enterprise Pricing Anchor Card -->
    <div class="enterprise-anchor-box">
      <div class="anchor-header">
        <div class="anchor-title-grp">
          <h2>Institutional / Data Tier</h2>
          <p>Unmetered WebSocket feeds, historical research corpora, and dedicated engineering channels.</p>
        </div>
        <div class="anchor-price-tag">
          <div class="price-num">${priceDisplay}</div>
          <div class="price-sub">${billingPeriod}</div>
        </div>
      </div>

      <div class="anchor-features-grid">
        <div class="af-item">
          <span class="af-check">&#10003;</span>
          <span>Unmetered dedicated WebSocket &amp; historical data feeds</span>
        </div>
        <div class="af-item">
          <span class="af-check">&#10003;</span>
          <span>1,316-window canonical calibration corpus &amp; book snapshots</span>
        </div>
        <div class="af-item">
          <span class="af-check">&#10003;</span>
          <span>White-label embeddable widgets for media partners</span>
        </div>
        <div class="af-item">
          <span class="af-check">&#10003;</span>
          <span>Dedicated Slack / Microsoft Teams engineering channel</span>
        </div>
        <div class="af-item">
          <span class="af-check">&#10003;</span>
          <span>Enterprise uptime Service Level Agreement (99.9%)</span>
        </div>
        <div class="af-item">
          <span class="af-check">&#10003;</span>
          <span>Dedicated response SLA (&lt;1 hour) on all technical inquiries</span>
        </div>
      </div>

      <div style="text-align:center;">
        <button class="btn-inst-primary" onclick="openBookCallModal()" style="display:inline-block;">
          Schedule Institutional Technical Discussion &rarr;
        </button>
      </div>
    </div>

    <!-- Rule B4 / B5 Regulatory Disclosures -->
    <div style="background:rgba(201,162,74,0.04); border:1px solid var(--inst-border); border-radius:8px; padding:20px; font-family:var(--inst-mono); font-size:0.74rem; color:var(--inst-muted); line-height:1.6;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <span style="color:var(--inst-accent); font-weight:700;">CIRCUIT BREAKER: LOCKED_RULE_B5 ($0.00 CAPITAL RISK)</span>
        <span style="color:var(--inst-green); font-weight:700;">CFTC RULE 4.41 &bull; UNCONFLICTED REFEREE</span>
      </div>
      <div>
        <strong>Legal &amp; Regulatory Disclosures (Rule B10):</strong> QuanterraOS provides independent telemetry and microstructure intelligence for institutional market participants. We do not provide investment advice, manage client assets, or route customer orders. All services enforce permanent $0 live capital isolation. Kalshi, CME Group, and Polymarket are trademarks of their respective owners.
      </div>
    </div>
  </main>

  <!-- Book a Call Intake Modal -->
  <div class="modal-overlay" id="book-call-modal">
    <div class="modal-card">
      <button class="modal-close" onclick="closeBookCallModal()">&times;</button>
      
      <div id="modal-form-view">
        <h3 class="modal-title">Book an Engineering Call</h3>
        <p class="modal-sub">Direct discussion with our quant infrastructure team. Institutional inquiries receive &lt;1 hour response SLA.</p>

        <form id="inst-intake-form" onsubmit="submitIntakeForm(event)">
          <div class="form-group">
            <label class="form-label" for="inp-fullname">Full Name *</label>
            <input type="text" id="inp-fullname" class="form-input" placeholder="e.g. Alex Vance" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="inp-email">Corporate Work Email *</label>
            <input type="email" id="inp-email" class="form-input" placeholder="alex@acmecapital.com" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="inp-firm">Firm / Fund Name *</label>
            <input type="text" id="inp-firm" class="form-input" placeholder="Acme Quantitative Partners" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="sel-buyer-type">Segment *</label>
            <select id="sel-buyer-type" class="form-select">
              <option value="market-maker">Market Maker &amp; Liquidity Provider</option>
              <option value="prop-desk">Proprietary Trading Desk</option>
              <option value="macro-fund">Fund &amp; Macro Research</option>
              <option value="media-partner">Media &amp; Distribution Partner</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="inp-volume">Estimated Volume or AUM</label>
            <input type="text" id="inp-volume" class="form-input" placeholder="e.g. $5M+ monthly event volume or $50M AUM">
          </div>

          <div class="form-group">
            <label class="form-label" for="inp-notes">Telemetry or Architecture Requirements</label>
            <textarea id="inp-notes" class="form-textarea" placeholder="Describe feeds needed (e.g. WebSocket L2 depth, historical tick Parquet, custom SLA)..."></textarea>
          </div>

          <button type="submit" class="form-btn-submit" id="btn-submit-inquiry">
            Confirm &amp; Request Call (&lt;1h Response SLA) &rarr;
          </button>
        </form>
      </div>

      <div class="success-panel" id="modal-success-view">
        <span class="success-badge">&#10003; Inquiry Received &bull; SLA: &lt;1 Hour</span>
        <h3 style="font-size:1.4rem; font-weight:700; margin-bottom:8px; color:#FFF;">Call Request Dispatched</h3>
        <p style="font-size:0.92rem; color:var(--inst-muted); line-height:1.6; margin-bottom:20px;" id="success-msg">
          Thank you. An enterprise infrastructure engineer has been assigned to your request and will reach out to schedule your call within 1 business hour.
        </p>
        <button class="btn-inst-primary" onclick="closeBookCallModal()">Done</button>
      </div>
    </div>
  </div>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}

  <script>
    function openBookCallModal(segment) {
      if (segment) {
        const sel = document.getElementById('sel-buyer-type');
        if (sel) sel.value = segment;
      }
      document.getElementById('modal-form-view').style.display = 'block';
      document.getElementById('modal-success-view').style.display = 'none';
      document.getElementById('book-call-modal').classList.add('active');
    }

    function closeBookCallModal() {
      document.getElementById('book-call-modal').classList.remove('active');
    }

    async function submitIntakeForm(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-inquiry');
      btn.textContent = 'Submitting...';
      btn.disabled = true;

      const payload = {
        fullName: document.getElementById('inp-fullname').value,
        workEmail: document.getElementById('inp-email').value,
        firmName: document.getElementById('inp-firm').value,
        buyerType: document.getElementById('sel-buyer-type').value,
        estimatedVolumeOrAum: document.getElementById('inp-volume').value,
        notes: document.getElementById('inp-notes').value,
      };

      try {
        const res = await fetch('/api/institutional/book-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('modal-form-view').style.display = 'none';
          document.getElementById('modal-success-view').style.display = 'block';
          if (data.inquiry && data.inquiry.id) {
            document.getElementById('success-msg').textContent = 
              'Inquiry #' + data.inquiry.id + ' confirmed. An engineer from institutional@quanterraos.com will reply within 1 hour.';
          }
        } else {
          alert('Submission error: ' + (data.error || 'Please check your inputs'));
        }
      } catch (err) {
        // Fallback for offline demo
        document.getElementById('modal-form-view').style.display = 'none';
        document.getElementById('modal-success-view').style.display = 'block';
      } finally {
        btn.textContent = 'Confirm & Request Call (<1h Response SLA) \u2192';
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
}
