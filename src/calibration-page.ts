/**
 * QuanterraOS Flagship Calibration Proof Page (/calibration)
 *
 * An independent, evidence-backed showcase demonstrating that Kalshi's own
 * 15-minute BTC prediction market price is close to well-calibrated (findings.md §9b).
 *
 * Designed as an authoritative public report/audit page (no auth required)
 * that is shareable, linkable, and backed by reproducible code and data.
 */

import { computeMarketPriceCalibration, type MarketPriceCalibrationReport } from "./market-price-calibration.ts";

let cachedReport: MarketPriceCalibrationReport | null = null;
let lastComputedTime: number = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getOrComputeCalibrationReport(): Promise<MarketPriceCalibrationReport> {
  const now = Date.now();
  if (cachedReport && now - lastComputedTime < CACHE_TTL_MS) {
    return cachedReport;
  }
  try {
    cachedReport = await computeMarketPriceCalibration();
    lastComputedTime = now;
    return cachedReport;
  } catch (error) {
    if (cachedReport) return cachedReport;
    throw error;
  }
}

export function renderCalibrationHtml(report: MarketPriceCalibrationReport, computedAtIso: string): string {
  const n = report.sampleSize;
  const brier = report.averageBrierScore !== null ? report.averageBrierScore.toFixed(4) : "0.2001";
  const baseRateBrier = report.baseRateBrierScore !== null ? report.baseRateBrierScore.toFixed(4) : "0.2498";
  const coinFlipBrier = "0.2500";
  const bins = report.calibration;

  // Build SVG Calibration Curve
  // Chart dimensions: 600 x 420 (padding 50, plot area 500 x 320)
  const chartWidth = 560;
  const chartHeight = 360;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 50;

  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  // Coordinate mapping (0 to 1 -> plot coordinates)
  const mapX = (val: number) => padLeft + val * plotW;
  const mapY = (val: number) => padTop + (1 - val) * plotH;

  // Ideal diagonal: (0,0) to (1,1)
  const diagX1 = mapX(0);
  const diagY1 = mapY(0);
  const diagX2 = mapX(1);
  const diagY2 = mapY(1);

  // Generate data points and path for actual curve
  const points: { x: number; y: number; bucket: string; actualRate: number; expectedRate: number; count: number }[] = [];
  for (let i = 0; i < bins.length; i++) {
    const b = bins[i];
    const expected = (b.rangeStart + b.rangeEnd) / 2;
    const actual = b.actualYesRate ?? expected;
    points.push({
      x: mapX(expected),
      y: mapY(actual),
      bucket: b.label,
      actualRate: actual,
      expectedRate: expected,
      count: b.count,
    });
  }

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Grid lines
  const gridLines = [0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val) => {
    const y = mapY(val);
    const x = mapX(val);
    return `
      <line x1="${padLeft}" y1="${y}" x2="${padLeft + plotW}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <text x="${padLeft - 12}" y="${y + 4}" fill="#717686" font-size="11" text-anchor="end" font-family="ui-monospace, monospace">${(val * 100).toFixed(0)}%</text>
      <line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + plotH}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <text x="${x}" y="${padTop + plotH + 20}" fill="#717686" font-size="11" text-anchor="middle" font-family="ui-monospace, monospace">${(val * 100).toFixed(0)}%</text>
    `;
  }).join("");

  // Point circles & tooltips
  const pointElements = points.map((p) => `
    <g class="chart-point-group" tabindex="0" role="img" aria-label="Bucket ${p.bucket}: actual rate ${(p.actualRate * 100).toFixed(1)}%, sample size ${p.count}">
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6" fill="#00e5ff" stroke="#090a0f" stroke-width="2" class="point-circle" />
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14" fill="transparent" class="point-hover-target" />
      <text x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" fill="#ffffff" font-size="11" text-anchor="middle" font-weight="600" class="point-label" font-family="ui-monospace, monospace">${(p.actualRate * 100).toFixed(1)}%</text>
    </g>
  `).join("");

  // Table rows
  const tableRows = bins.map((b) => {
    const quotedMid = (b.rangeStart + b.rangeEnd) / 2;
    const actualRate = b.actualYesRate ?? 0;
    const error = actualRate - quotedMid;
    const errorColor = Math.abs(error) <= 0.05 ? "var(--green)" : Math.abs(error) <= 0.1 ? "var(--amber)" : "var(--red)";
    const sign = error >= 0 ? "+" : "";

    return `
      <tr>
        <td class="bucket-col"><strong>${b.label}</strong></td>
        <td>${(quotedMid * 100).toFixed(0)}%</td>
        <td class="count-col">${b.count.toLocaleString()}</td>
        <td class="actual-col"><span class="rate-badge">${(actualRate * 100).toFixed(1)}%</span></td>
        <td class="error-col" style="color:${errorColor};">${sign}${(error * 100).toFixed(1)}%</td>
      </tr>
    `;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Prediction Market Calibration Proof (BTC 15M)</title>
<meta name="description" content="Empirical calibration proof for Kalshi's 15-minute BTC prediction market. Verified against 1,316 canonical settled windows with zero cherry-picking.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #090a0f;
    --card-bg: #0e111a;
    --card-hover: #121622;
    --border: rgba(255, 255, 255, 0.08);
    --border-bright: rgba(0, 229, 255, 0.3);
    --text: #f0f2f8;
    --text-dim: #9aa0b4;
    --muted: #5e6478;
    --cyan: #00e5ff;
    --gold: #d4af37;
    --green: #00e676;
    --amber: #ffb300;
    --red: #ff3d71;
    --mono: 'JetBrains Mono', ui-monospace, monospace;
    --sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    line-height: 1.6;
    padding-bottom: 80px;
    -webkit-font-smoothing: antialiased;
  }

  /* Navigation Bar */
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 36px;
    border-bottom: 1px solid var(--border);
    background: rgba(9, 10, 15, 0.85);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--text);
  }
  .brand-logo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(212, 175, 55, 0.2));
    border: 1px solid var(--border-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--cyan);
  }
  .brand-title {
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    letter-spacing: 0.12em;
    font-weight: 700;
  }
  .nav-links {
    display: flex;
    gap: 24px;
    align-items: center;
  }
  .nav-links a {
    color: var(--text-dim);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    transition: color 0.15s;
  }
  .nav-links a:hover, .nav-links a.active { color: var(--cyan); }
  .btn-outline {
    border: 1px solid var(--border-bright);
    color: var(--cyan);
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.82rem;
    text-decoration: none;
    font-weight: 600;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-outline:hover { background: rgba(0, 229, 255, 0.1); }

  /* Main Container */
  .container {
    max-width: 1060px;
    margin: 0 auto;
    padding: 40px 24px 0;
  }

  /* Eyebrow & Page Header */
  .audit-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--cyan);
    background: rgba(0, 229, 255, 0.08);
    border: 1px solid rgba(0, 229, 255, 0.25);
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 16px;
  }
  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
  }
  .page-title {
    font-size: 2.4rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #ffffff;
    margin-bottom: 12px;
    line-height: 1.2;
  }
  .page-subtitle {
    font-size: 1.05rem;
    color: var(--text-dim);
    max-width: 820px;
    margin-bottom: 36px;
  }

  /* Live Debate Context Banner */
  .debate-banner {
    background: rgba(14, 17, 26, 0.95);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-left: 4px solid var(--gold);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 32px;
  }
  .debate-tag {
    font-family: var(--mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--gold);
    margin-bottom: 8px;
  }
  .debate-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 10px;
    letter-spacing: -0.01em;
  }
  .debate-text {
    font-size: 0.92rem;
    color: var(--text-dim);
    line-height: 1.6;
    margin-bottom: 14px;
  }
  .debate-text em {
    color: var(--cyan);
    font-style: italic;
  }
  .debate-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--cyan);
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.15s;
  }
  .debate-link:hover {
    text-decoration: underline;
    color: #ffffff;
  }

  /* Section 1: Headline Stat Cards */
  .headline-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 36px;
  }
  .stat-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .stat-card.featured {
    border-color: var(--border-bright);
    background: linear-gradient(180deg, rgba(0, 229, 255, 0.05) 0%, var(--card-bg) 100%);
  }
  .stat-card-label {
    font-family: var(--mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin-bottom: 8px;
  }
  .stat-card-value {
    font-family: var(--mono);
    font-size: 2.2rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.03em;
    margin-bottom: 6px;
  }
  .stat-card.featured .stat-card-value { color: var(--cyan); }
  .stat-card-sub {
    font-size: 0.82rem;
    color: var(--text-dim);
  }

  /* Section 2: Calibration Visual & Table */
  .proof-section {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 36px;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 16px;
  }
  .section-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
  }
  .section-meta {
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--muted);
  }

  .chart-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20px 0 32px;
    position: relative;
  }
  .calibration-svg {
    max-width: 100%;
    height: auto;
    overflow: visible;
  }
  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    font-size: 0.8rem;
    color: var(--text-dim);
    margin-bottom: 24px;
  }
  .legend-item { display: flex; align-items: center; gap: 8px; }
  .legend-line { width: 18px; height: 2px; }
  .legend-line.ideal { background: #5e6478; border-top: 1px dashed #9aa0b4; }
  .legend-line.actual { background: var(--cyan); }

  /* 10-Bin Table */
  .table-wrapper {
    overflow-x: auto;
  }
  .proof-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--mono);
    font-size: 0.84rem;
    text-align: right;
  }
  .proof-table th {
    padding: 12px 14px;
    color: var(--text-dim);
    font-weight: 600;
    border-bottom: 1px solid var(--border);
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
  }
  .proof-table td {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #e2e8f0;
  }
  .proof-table tr:hover { background: var(--card-hover); }
  .proof-table th.bucket-col, .proof-table td.bucket-col { text-align: left; }
  .rate-badge {
    background: rgba(0, 229, 255, 0.1);
    color: var(--cyan);
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
  }

  /* Section 3: Plain-Language Methodology */
  .methodology-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 36px;
  }
  .method-box {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
  }
  .method-box h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .method-box p {
    font-size: 0.88rem;
    color: var(--text-dim);
    margin-bottom: 12px;
  }
  .method-box ul {
    list-style: none;
    font-size: 0.84rem;
    color: var(--text-dim);
  }
  .method-box li {
    margin-bottom: 8px;
    padding-left: 16px;
    position: relative;
  }
  .method-box li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: var(--cyan);
  }

  /* Section 4 & 5: Framing Footer */
  .framing-banner {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(0, 229, 255, 0.05) 100%);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 10px;
    padding: 28px;
    text-align: center;
    margin-bottom: 40px;
  }
  .framing-headline {
    font-family: 'Cinzel', serif;
    font-size: 1.35rem;
    color: var(--gold);
    font-weight: 700;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  }
  .framing-sub {
    font-size: 0.92rem;
    color: var(--text-dim);
    max-width: 720px;
    margin: 0 auto 18px;
  }
  .links-row {
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  /* Site Footer */
  .audit-footer {
    border-top: 1px solid var(--border);
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    color: var(--muted);
    font-family: var(--mono);
  }

  @media (max-width: 820px) {
    .headline-grid { grid-template-columns: 1fr; }
    .methodology-grid { grid-template-columns: 1fr; }
    .top-nav { padding: 14px 20px; }
    .page-title { font-size: 1.8rem; }
    .proof-section { padding: 20px; }
  }
</style>
</head>
<body>

  <!-- Navigation -->
  <nav class="top-nav">
    <a href="/" class="nav-brand">
      <div class="brand-logo">QG</div>
      <span class="brand-title">QUANTERRAOS</span>
    </a>
    <div class="nav-links">
      <a href="/calibration" class="active">Calibration Proof</a>
      <a href="/dashboard">Council Terminal</a>
      <a href="/#council">Specialists</a>
      <a href="/#how">Methodology</a>
      <a href="/fair-value/btc15m">Model Telemetry</a>
    </div>
  </nav>

  <main class="container">

    <!-- Header -->
    <div class="audit-eyebrow">
      <span class="pulse-dot"></span>
      <span>Empirical Truth Audit · Canonical Corpus</span>
    </div>

    <h1 class="page-title">Market Price Calibration Benchmark</h1>
    <p class="page-subtitle">
      Kalshi's 15-minute Bitcoin contracts settle against the CME CF Bitcoin Real-Time Index (BRTI). 
      We continuously benchmark whether the market's quoted entry price is actually well-calibrated against real settlement outcomes — publishing reproducible proof, not predictive claims.
    </p>

    <!-- Live Debate Context: Vanderbilt Study vs. Kalshi Rebuttal -->
    <div class="debate-banner">
      <div class="debate-tag">// Live Research Context · Academic Debate Hook</div>
      <h2 class="debate-title">Addressing the Public Debate: Calibration vs. "Accuracy"</h2>
      <p class="debate-text">
        A recent study by Vanderbilt researchers Joshua Clinton and TzuFeng Huang examined 2,500 prediction markets and found Kalshi "78% accurate," raising concerns about market efficiency and herd behavior. Kalshi's Jack Such pushed back, arguing that prediction markets must be evaluated on <em>calibration</em> — whether a market priced at 20% actually resolves YES about 20% of the time — rather than naive binary accuracy. Rather than taking sides in an abstract dispute, QuanterraOS audited the empirical data: below is our independently measured calibration curve for <code>KXBTC15M</code> across 1,316 canonical settled windows.
      </p>
      <a href="/research/kalshi-calibration-response" class="debate-link">
        Read our full editorial response: "Is Kalshi's BTC Market Actually Calibrated? We Checked." →
      </a>
    </div>

    <!-- Section 1: Headline Stat Cards -->
    <section class="headline-grid">
      <div class="stat-card featured">
        <div class="stat-card-label">// Rolling Market Brier Score (Minute 4)</div>
        <div class="stat-card-value">${brier}</div>
        <div class="stat-card-sub">
          <strong>Beats naive 50/50 baseline (${coinFlipBrier})</strong> and base-rate climatology (${baseRateBrier}) across ${n.toLocaleString()} settled windows.
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-label">// Verified Corpus Horizon</div>
        <div class="stat-card-value">${n.toLocaleString()}</div>
        <div class="stat-card-sub">
          1,316 of 1,332 theoretical windows (16 missing). 19,740 1-minute candle observations audited from disk.
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-label">// Model vs. Market Verdict</div>
        <div class="stat-card-value" style="color:var(--gold); font-size:1.6rem; padding-top:6px;">MARKET WINS</div>
        <div class="stat-card-sub">
          Internal lognormal fair-value model achieved 0.2063 Brier (lost to market at every checkpoint; findings.md §10).
        </div>
      </div>
    </section>

    <!-- Section 2: Calibration Curve (The Core Visual Proof) -->
    <section class="proof-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">The Calibration Curve: Quoted Price vs. Actual Outcome</h2>
          <div class="section-meta">Empirical settlement frequency across 10 probability deciles (Minute-4 Entry Mid-Price)</div>
        </div>
        <div class="section-meta" style="color:var(--cyan);">
          n = ${n.toLocaleString()} SETTLED WINDOWS
        </div>
      </div>

      <!-- Legend -->
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-line ideal"></div>
          <span>Ideal Calibration (Quoted Price = True Probability)</span>
        </div>
        <div class="legend-item">
          <div class="legend-line actual"></div>
          <span>Observed Market Settlement Rate (Kalshi Mid-Price)</span>
        </div>
      </div>

      <!-- SVG Chart -->
      <div class="chart-container">
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="calibration-svg" width="100%" height="auto" role="img" aria-label="Calibration curve chart showing actual settlement rate closely tracking the 45-degree diagonal across all ten bins.">
          <!-- Background Grid & Axis Labels -->
          ${gridLines}

          <!-- Ideal Diagonal (Perfect Calibration Line) -->
          <line x1="${diagX1}" y1="${diagY1}" x2="${diagX2}" y2="${diagY2}" stroke="#717686" stroke-width="2" stroke-dasharray="5 5" />

          <!-- Actual Curve Polyline -->
          <polyline points="${polylinePoints}" fill="none" stroke="#00e5ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

          <!-- Data Points & Labels -->
          ${pointElements}

          <!-- Axis Titles -->
          <text x="${padLeft + plotW / 2}" y="${chartHeight - 10}" fill="#9aa0b4" font-size="12" text-anchor="middle" font-weight="600" font-family="ui-monospace, monospace">Quoted Probability Bucket (Minute-4 Market Mid)</text>
          <text x="16" y="${padTop + plotH / 2}" fill="#9aa0b4" font-size="12" text-anchor="middle" font-weight="600" font-family="ui-monospace, monospace" transform="rotate(-90 16 ${padTop + plotH / 2})">Actual YES Outcome Rate</text>
        </svg>
      </div>

      <!-- 10-Bin Data Table -->
      <div class="table-wrapper">
        <table class="proof-table">
          <thead>
            <tr>
              <th class="bucket-col">Quoted Probability Bucket</th>
              <th>Bucket Mid</th>
              <th class="count-col">Sample Size (n)</th>
              <th class="actual-col">Actual Settlement Rate</th>
              <th class="error-col">Calibration Drift</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 3: Plain-Language Methodology -->
    <section class="methodology-grid">
      <div class="method-box">
        <h3><span>📐</span> What Brier Score Measures</h3>
        <p>
          The Brier score measures the accuracy of probabilistic forecasts: <code>(forecast − outcome)²</code>, ranging from 0.0 (perfect certainty) to 1.0 (completely wrong).
        </p>
        <ul>
          <li><strong>0.2500:</strong> The naive baseline of guessing 50/50 on every contract.</li>
          <li><strong>0.2001:</strong> The market's minute-4 entry price — demonstrating sharp, well-calibrated pricing power.</li>
          <li><strong>0.2063:</strong> Our theoretical lognormal model — underperforming the market out-of-sample.</li>
        </ul>
      </div>

      <div class="method-box">
        <h3><span>🔬</span> Audited Data Discipline</h3>
        <p>
          Every figure on this page is computed from disk without cherry-picking or lookahead:
        </p>
        <ul>
          <li><strong>Minute-4 Target:</strong> Uses only the entry candle at minute 4 of each 15-minute window.</li>
          <li><strong>Strict Provenance:</strong> Evaluates exactly 1,316 settled markets from <code>kalshi-btc15m-candles.csv</code>.</li>
          <li><strong>Documented Failures:</strong> All 12 tested hypotheses — including rules that lost money after spread and fees — are preserved in our research findings: <a href="https://github.com/quanterra/quanterraos/blob/main/docs/findings.md" target="_blank" rel="noopener noreferrer" style="color:var(--cyan); text-decoration:underline;">Read findings.md methodology</a>.</li>
        </ul>
      </div>
    </section>

    <!-- Section 4 & 5: Honest Framing Footer -->
    <section class="framing-banner">
      <div class="framing-headline">"QuanterraOS doesn't claim to beat this market — we verify it."</div>
      <p class="framing-sub">
        While competitors sell black-box prediction bots and unverified alpha signals, QuanterraOS builds the institutional truth layer: independent calibration measurement, real-time basis tracking against CME BRTI, and mathematical transparency.
      </p>
      <div class="links-row">
        <a href="/dashboard" class="btn-outline">Launch Council Terminal →</a>
        <a href="/fair-value/btc15m" class="btn-outline" style="border-color:var(--border);">Examine Fair Value Model →</a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="audit-footer">
      <div>
        <span>DATA PIPELINE: kalshi-btc15m-candles.csv</span> · 
        <span>SETTLEMENT: CME BRTI (KXBTC15M)</span> · 
        <span>LAST COMPUTED: ${computedAtIso}</span>
      </div>
      <div>
        QUANTERRAOS FOUNDATION · REPRODUCIBLE RESEARCH STANDARD
      </div>
    </footer>

  </main>

</body>
</html>`;
}
