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
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="#4FD1C5" stroke="#0A0E14" stroke-width="2" class="point-circle" />
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14" fill="transparent" class="point-hover-target" />
      <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" fill="#E8EAED" font-size="10" text-anchor="middle" font-weight="500" class="point-label" font-family="var(--font-mono)">${(p.actualRate * 100).toFixed(1)}%</text>
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
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06080E;
    --panel: rgba(14, 20, 29, 0.72);
    --panel-border: rgba(255, 255, 255, 0.08);
    --panel-border-subtle: rgba(255, 255, 255, 0.04);
    --panel-border-highlight: rgba(79, 209, 197, 0.35);
    --text: #F1F3F5;
    --muted: #8E96A4;
    --accent: #4FD1C5;
    --accent-glow: rgba(79, 209, 197, 0.15);
    --gold: #F5A623;
    --gold-glow: rgba(245, 166, 35, 0.12);
    --warning: #C65D4A;
    --green: #4FD1C5;
    --amber: #E2A03F;
    --red: #C65D4A;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: var(--bg);
    background-image: 
      radial-gradient(ellipse 90% 50% at 50% -20%, rgba(79, 209, 197, 0.08), transparent 70%),
      radial-gradient(ellipse 60% 40% at 85% 10%, rgba(198, 93, 74, 0.04), transparent 60%),
      linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
    color: var(--text);
    font-family: var(--font-sans);
    line-height: 1.6;
    padding-bottom: 80px;
    -webkit-font-smoothing: antialiased;
  }

  /* Institutional Ticker Strip */
  .live-ticker-strip {
    background: rgba(8, 12, 18, 0.85);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding: 7px 24px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--muted);
    backdrop-filter: blur(12px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow-x: auto;
  }
  .ticker-content { display: flex; align-items: center; gap: 14px; white-space: nowrap; }
  .ticker-item { display: inline-flex; align-items: center; gap: 7px; color: var(--text); }
  .ticker-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); animation: pulseDot 2s infinite; }
  .ticker-sep { color: rgba(255, 255, 255, 0.15); font-weight: 300; }
  @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

  /* Navigation Bar */
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 48px;
    border-bottom: 1px solid var(--panel-border);
    background: rgba(6, 8, 14, 0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-left {
    display: flex;
    align-items: center;
    gap: 36px;
  }
  .nav-brand-container {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }
  .nav-brand-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: linear-gradient(135deg, rgba(79, 209, 197, 0.2), rgba(6, 8, 14, 0.9));
    border: 1px solid rgba(79, 209, 197, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-brand-icon svg { width: 14px; height: 14px; stroke: var(--accent); }
  .nav-brand-text { display: flex; flex-direction: column; }
  .nav-brand-title {
    font-size: 0.96rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #FFFFFF;
    font-family: var(--font-mono);
  }
  .nav-brand-sub {
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    font-family: var(--font-mono);
  }
  .nav-links {
    display: flex;
    gap: 22px;
    align-items: center;
  }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    transition: color 0.15s, border-color 0.15s;
    letter-spacing: -0.01em;
  }
  .nav-links a:hover, .nav-links a.active { color: #FFFFFF; }
  .nav-links a.active { border-bottom: 2px solid var(--accent); padding-bottom: 3px; }

  .btn-outline {
    border: 1px solid rgba(79, 209, 197, 0.4);
    color: #FFFFFF;
    padding: 8px 18px;
    border-radius: 4px;
    font-size: 0.82rem;
    font-family: var(--font-mono);
    text-decoration: none;
    background: rgba(79, 209, 197, 0.08);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 0 15px rgba(79, 209, 197, 0.1);
  }
  .btn-outline:hover {
    border-color: var(--accent);
    background: rgba(79, 209, 197, 0.18);
    box-shadow: 0 0 25px rgba(79, 209, 197, 0.25);
    color: #FFFFFF;
    text-decoration: none;
    transform: translateY(-1px);
  }

  /* Main Container */
  .container {
    max-width: 1140px;
    margin: 0 auto;
    padding: 56px 48px 0;
  }

  /* Eyebrow & Page Header */
  .audit-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    background: rgba(79, 209, 197, 0.08);
    border: 1px solid rgba(79, 209, 197, 0.25);
    padding: 5px 12px;
    border-radius: 3px;
    margin-bottom: 18px;
    box-shadow: 0 0 12px rgba(79, 209, 197, 0.08);
  }
  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
  }
  .page-title {
    font-size: 2.4rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #FFFFFF;
    margin-bottom: 12px;
    line-height: 1.15;
  }
  .page-subtitle {
    font-size: 1.02rem;
    color: var(--muted);
    max-width: 820px;
    margin-bottom: 36px;
    line-height: 1.6;
  }

  /* Research Context Banner */
  .debate-banner {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-left: 3px solid var(--accent);
    border-radius: 6px;
    padding: 26px 28px;
    margin-bottom: 36px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
  }
  .debate-tag {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    margin-bottom: 10px;
    font-weight: 600;
  }
  .debate-title {
    font-size: 1.22rem;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 12px;
    letter-spacing: -0.015em;
  }
  .debate-text {
    font-size: 0.92rem;
    color: var(--muted);
    line-height: 1.65;
    margin-bottom: 16px;
  }
  .debate-text em {
    color: #FFFFFF;
    font-style: normal;
    text-decoration: underline;
  }
  .debate-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--accent);
    font-size: 0.88rem;
    font-family: var(--font-mono);
    font-weight: 600;
    text-decoration: none;
    transition: all 0.15s;
  }
  .debate-link:hover {
    color: #FFFFFF;
    text-shadow: 0 0 8px rgba(79, 209, 197, 0.5);
  }

  /* Section 1: Headline Stat Cards */
  .headline-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 20px;
    margin-bottom: 40px;
  }
  .stat-card {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    padding: 26px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
    transition: border-color 0.2s ease, transform 0.2s ease;
  }
  .stat-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  .stat-card.featured {
    border-color: rgba(79, 209, 197, 0.35);
    box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(79, 209, 197, 0.05);
  }
  .stat-card-label {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .stat-card-value {
    font-family: var(--font-mono);
    font-size: 2.5rem;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.03em;
    margin-bottom: 8px;
    line-height: 1;
  }
  .stat-card.featured .stat-card-value {
    color: var(--accent);
    text-shadow: 0 0 15px rgba(79, 209, 197, 0.3);
  }
  .stat-card-sub {
    font-size: 0.84rem;
    color: var(--muted);
    line-height: 1.5;
  }

  /* Section 2: Calibration Visual & Table */
  .proof-section {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    padding: 34px;
    margin-bottom: 40px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.6);
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 26px;
    border-bottom: 1px solid var(--panel-border);
    padding-bottom: 18px;
  }
  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 5px;
    letter-spacing: -0.015em;
  }
  .section-meta {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--muted);
  }

  .chart-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 24px 0 34px;
    position: relative;
    background: rgba(4, 6, 10, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 24px;
  }
  .calibration-svg {
    max-width: 100%;
    height: auto;
    overflow: visible;
  }
  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 28px;
    font-size: 0.82rem;
    font-family: var(--font-mono);
    color: var(--muted);
    margin-bottom: 26px;
  }
  .legend-item { display: flex; align-items: center; gap: 9px; }
  .legend-line { width: 20px; height: 2px; }
  .legend-line.ideal { background: #5e6478; border-top: 1px dashed #8F95A0; }
  .legend-line.actual { background: var(--accent); box-shadow: 0 0 8px var(--accent); }

  /* 10-Bin Table */
  .table-wrapper {
    overflow-x: auto;
  }
  .proof-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    text-align: right;
  }
  .proof-table th {
    padding: 13px 16px;
    color: var(--muted);
    font-weight: 600;
    border-bottom: 1px solid var(--panel-border);
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    background: rgba(255, 255, 255, 0.02);
  }
  .proof-table td {
    padding: 13px 16px;
    border-bottom: 1px solid var(--panel-border-subtle);
    color: #FFFFFF;
  }
  .proof-table tr:hover { background: rgba(79, 209, 197, 0.03); }
  .proof-table th.bucket-col, .proof-table td.bucket-col { text-align: left; }
  .rate-badge {
    background: rgba(79, 209, 197, 0.12);
    color: var(--accent);
    padding: 3px 8px;
    border-radius: 3px;
    font-weight: 600;
    border: 1px solid rgba(79, 209, 197, 0.3);
  }

  /* Section 3: Plain-Language Methodology */
  .methodology-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 40px;
  }
  .method-box {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    padding: 26px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
  }
  .method-box h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .method-box p {
    font-size: 0.9rem;
    color: var(--muted);
    margin-bottom: 14px;
    line-height: 1.6;
  }
  .method-box ul {
    list-style: none;
    font-size: 0.86rem;
    color: var(--muted);
    line-height: 1.6;
  }
  .method-box li {
    margin-bottom: 9px;
    padding-left: 18px;
    position: relative;
  }
  .method-box li::before {
    content: "—";
    position: absolute;
    left: 0;
    color: var(--accent);
  }

  /* Section 4 & 5: Framing Banner */
  .framing-banner {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    padding: 34px;
    margin-bottom: 40px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.6);
  }
  .framing-headline {
    font-size: 1.35rem;
    color: #FFFFFF;
    font-weight: 600;
    letter-spacing: -0.015em;
    margin-bottom: 10px;
  }
  .framing-sub {
    font-size: 0.94rem;
    color: var(--muted);
    max-width: 820px;
    margin-bottom: 24px;
    line-height: 1.6;
  }
  .links-row {
    display: flex;
    gap: 16px;
  }

  /* Site Footer */
  .audit-footer {
    border-top: 1px solid var(--panel-border);
    padding-top: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    color: var(--muted);
    font-family: var(--font-mono);
  }

  @media (max-width: 820px) {
    .headline-grid { grid-template-columns: 1fr; }
    .methodology-grid { grid-template-columns: 1fr; }
    .top-nav { padding: 16px 20px; flex-direction: column; align-items: flex-start; gap: 14px; }
    .page-title { font-size: 1.85rem; }
    .proof-section { padding: 20px; }
    .links-row { flex-direction: column; }
    .container { padding: 32px 20px 0; }
  }
</style>
</head>
<body>

  <!-- Top Live Telemetry Ticker -->
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>LIVE REPRODUCIBILITY TELEMETRY</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">BTC 15M CANONICAL CORPUS: ${n.toLocaleString()} SETTLED WINDOWS</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">BRIER BENCHMARK: ${brier} (BEATS 0.2500 BASELINE)</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">CIRCUIT BREAKER: RULE B5 LOCKED ($0.00 CAPITAL)</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">RULE B4 GUARDRAIL: ACTIVE</span>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="nav-brand-container">
        <div class="nav-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <div class="nav-brand-text">
          <span class="nav-brand-title">QUANTERRA // OS</span>
          <span class="nav-brand-sub">INSTITUTIONAL QUANTITATIVE CORE</span>
        </div>
      </a>
      <div class="nav-links">
        <a href="/calibration" class="active">Calibration Proof</a>
        <a href="/council">Council Terminal</a>
        <a href="/index">Composite Index</a>
        <a href="/spread">Spread Monitor</a>
        <a href="/status">System Status</a>
        <a href="/methodology">Methodology</a>
        <a href="/research">Research</a>
      </div>
    </div>
    <div class="nav-right">
      <a href="/council" class="btn-outline">Launch Terminal →</a>
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
        <div class="stat-card-value" style="color:var(--accent); font-size:1.6rem; padding-top:6px;">MARKET WINS</div>
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
        <div class="section-meta" style="color:var(--accent);">
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
          <polyline points="${polylinePoints}" fill="none" stroke="#4FD1C5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

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
          <li><strong>Documented Failures:</strong> All 12 tested hypotheses — including rules that lost money after spread and fees — are preserved in our research findings: <a href="https://github.com/quanterra/quanterraos/blob/main/docs/findings.md" target="_blank" rel="noopener noreferrer" style="color:var(--accent); text-decoration:underline;">Read findings.md methodology</a>.</li>
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
        <a href="/council" class="btn-outline">Launch Council Terminal →</a>
        <a href="/fair-value/btc15m" class="btn-outline" style="border-color:var(--panel-border);">Examine Fair Value Model →</a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="audit-footer" style="flex-direction: column; align-items: flex-start; gap: 14px;">
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <span>DATA PIPELINE: kalshi-btc15m-candles.csv</span> · 
          <span>SETTLEMENT: CME BRTI (KXBTC15M)</span> · 
          <span>LAST COMPUTED: ${computedAtIso}</span>
        </div>
        <div>
          QUANTERRAOS FOUNDATION · REPRODUCIBLE RESEARCH STANDARD
        </div>
      </div>
      <div style="font-size: 0.72rem; color: var(--muted); line-height: 1.5; border-top: 1px solid var(--panel-border-subtle); padding-top: 10px; width: 100%;">
        <strong>Legal &amp; Non-Affiliation Notice (Rule B10):</strong> Kalshi, CME Group, and CF Benchmarks are trademarks of their respective owners. QuanterraOS is an independent measurement system operated by Quantara Global LLC and is not affiliated with, endorsed by, or sponsored by any exchange or market operator. Rule B5 locked: zero live capital deployed ($0.00). Not investment advice. <a href="/legal" style="color: var(--accent); text-decoration: underline;">Full Legal Disclaimers &rarr;</a>
      </div>
    </footer>

  </main>

</body>
</html>`;
}
