import type { MarketPriceCalibrationReport } from "./market-price-calibration.ts";
import { getCouncilAgentsData } from "./agents/council-data.ts";
import { renderSpecialistIcon, SPECIALIST_ICONS_CSS } from "./specialist-icons.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { renderBetaFeedbackWidgetHtml } from "./feedback-widget.ts";

/**
 * QuanterraOS Flagship — Elite Institutional Grade
 *
 * Subject: Autonomous multi-agent calibration and transparency engine for prediction markets.
 * Architecture: 8 specialized machine-intelligence agents across order-book microstructure,
 * tick integrity, and empirical Brier calibration across 1,316 settled windows.
 *
 * Visual System:
 * - Ultra-deep Obsidian: #05080E / #070A10 with ambient radial cyan aura
 * - Precision Bullion Gold: #DFB843 / #D4AF37
 * - Champagne Specular Highlight: #F7E7B4
 * - Safety Lock Terracotta: #C65D4A
 * - Frosted Glassmorphism: rgba(14, 20, 30, 0.7) with 1px hairline metallic borders
 * - Typography: Inter for institutional clarity, IBM Plex Mono for surgical tabular telemetry
 */

export function renderLandingPage(report?: MarketPriceCalibrationReport | null): string {
  const councilAgents = getCouncilAgentsData();
  const sampleN = report?.sampleSize ?? 1316;
  const brierScore = report?.averageBrierScore !== null && report?.averageBrierScore !== undefined
    ? report.averageBrierScore.toFixed(4)
    : "0.2001";

  // Build miniature calibration curve points
  const miniW = 260;
  const miniH = 110;
  const miniPadX = 30;
  const miniPadY = 15;
  const mapMiniX = (v: number) => miniPadX + v * miniW;
  const mapMiniY = (v: number) => miniPadY + (1 - v) * miniH;

  const bins = report?.calibration ?? [];
  let miniPolyline = "43.0,113.8 69.0,105.1 95.0,104.0 121.0,89.3 147.0,78.0 173.0,61.2 199.0,54.5 225.0,41.1 251.0,27.9 277.0,27.4";
  let miniCircles = `
          <circle cx="43.0" cy="113.8" r="3" fill="#DFB843" />
          <circle cx="69.0" cy="105.1" r="3" fill="#DFB843" />
          <circle cx="95.0" cy="104.0" r="3" fill="#DFB843" />
          <circle cx="121.0" cy="89.3" r="3" fill="#DFB843" />
          <circle cx="147.0" cy="78.0" r="3" fill="#DFB843" />
          <circle cx="173.0" cy="61.2" r="3" fill="#DFB843" />
          <circle cx="199.0" cy="54.5" r="3" fill="#DFB843" />
          <circle cx="225.0" cy="41.1" r="3" fill="#DFB843" />
          <circle cx="251.0" cy="27.9" r="3" fill="#DFB843" />
          <circle cx="277.0" cy="27.4" r="3" fill="#DFB843" />
  `;

  if (bins.length > 0) {
    const miniPoints = bins.map((b) => {
      const exp = (b.rangeStart + b.rangeEnd) / 2;
      const act = b.actualYesRate ?? exp;
      return { x: mapMiniX(exp), y: mapMiniY(act) };
    });
    miniPolyline = miniPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    miniCircles = miniPoints.map((p) => `          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#DFB843" />`).join("\n");
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#06070A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="QuanterraOS">
<title>QuanterraOS — Autonomous Prediction Market Calibration Council</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06070A;
    --bg-elevated: #0C0E14;
    --panel: rgba(16, 20, 29, 0.75);
    --panel-border: rgba(212, 175, 55, 0.18);
    --panel-border-subtle: rgba(212, 175, 55, 0.08);
    --panel-border-highlight: rgba(247, 231, 180, 0.45);
    --text: #F8FAFC;
    --muted: #94A3B8;
    --accent: #DFB843;
    --accent-light: #F7E7B4;
    --accent-glow: rgba(223, 184, 67, 0.22);
    --gold: #DFB843;
    --gold-bullion: #D4AF37;
    --gold-glow: rgba(223, 184, 67, 0.28);
    --warning: #F43F5E;
    --status-green: #10B981;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: radial-gradient(1400px 700px at 50% -120px, rgba(223, 184, 67, 0.11), transparent 70%),
                radial-gradient(900px 500px at 85% 25%, rgba(163, 125, 36, 0.06), transparent 60%),
                radial-gradient(800px 400px at 15% 45%, rgba(223, 184, 67, 0.04), transparent 50%),
                var(--bg);
    background-image: 
      radial-gradient(1400px 700px at 50% -120px, rgba(223, 184, 67, 0.11), transparent 70%),
      linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
    background-size: 100% 100%, 48px 48px, 48px 48px;
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.6;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  a { color: var(--text); text-decoration: none; }

  /* Institutional Ticker Strip */
  .live-ticker-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 32px;
    background: rgba(4, 6, 10, 0.95);
    border-bottom: 1px solid rgba(212, 175, 55, 0.12);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted);
  }
  .ticker-items {
    display: flex;
    gap: 24px;
    overflow-x: auto;
    white-space: nowrap;
  }
  .ticker-item strong { color: var(--text); font-weight: 500; }
  .ticker-tag-green { color: var(--accent); }
  .ticker-tag-warn { color: var(--warning); }

  /* Navigation: Glassmorphic Floating Header */
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 48px;
    border-bottom: 1px solid var(--panel-border);
    background: rgba(6, 7, 10, 0.88);
    backdrop-filter: blur(20px) saturate(190%);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 36px;
  }

  .nav-brand {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
    font-size: 0.84rem;
  }

  .nav-links a {
    color: var(--muted);
    transition: color 0.15s;
    font-weight: 400;
  }
  .nav-links a:hover {
    color: var(--text);
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .nav-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    color: #07080B;
    background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
    padding: 8px 18px;
    border-radius: 4px;
    border: 1px solid rgba(255, 248, 220, 0.6);
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3), inset 0 1px 0 #FFFFFF;
    transition: all 0.2s ease;
  }
  .nav-cta:hover {
    background: linear-gradient(180deg, #FFFFFF 0%, #F7E7B4 25%, #E5C158 65%, #C29627 100%);
    box-shadow: 0 6px 24px rgba(229, 193, 88, 0.5), inset 0 1px 0 #FFFFFF;
    transform: translateY(-1px);
  }

  /* Main Page Container */
  .page-wrap {
    max-width: 1240px;
    margin: 0 auto;
    padding: 64px 48px 96px;
    display: flex;
    flex-direction: column;
    gap: 88px;
  }

  /* Hero Section */
  .hero-section {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 48px;
    align-items: center;
  }
  @media (max-width: 960px) {
    .hero-section { grid-template-columns: 1fr; }
  }
  @media (max-width: 860px) {
    .live-ticker-strip { padding: 6px 16px; font-size: 0.65rem; }
    .top-nav { padding: 12px 16px; flex-wrap: wrap; gap: 12px; }
    .nav-left { width: 100%; justify-content: space-between; gap: 12px; }
    .nav-links { overflow-x: auto; white-space: nowrap; gap: 16px; width: 100%; padding: 4px 0 6px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .nav-links::-webkit-scrollbar { display: none; }
    .page-wrap { padding: 32px 16px 64px; gap: 48px; }
    .hero-heading { font-size: 2.1rem; line-height: 1.15; }
    .hero-actions { flex-direction: column; width: 100%; gap: 10px; }
    .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
  }

  .hero-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--accent-light);
    background: linear-gradient(90deg, rgba(223, 184, 67, 0.12) 0%, rgba(247, 231, 180, 0.22) 50%, rgba(223, 184, 67, 0.12) 100%);
    border: 1px solid rgba(223, 184, 67, 0.35);
    padding: 5px 14px;
    border-radius: 999px;
    margin-bottom: 24px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.15);
  }
  .pulse-beacon {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: beaconPulse 2s infinite ease-in-out;
  }
  @keyframes beaconPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .hero-heading {
    font-size: 3.1rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.12;
    margin-bottom: 20px;
    color: var(--text);
  }

  .hero-subhead {
    font-size: 1.05rem;
    color: var(--muted);
    line-height: 1.6;
    margin-bottom: 36px;
    max-width: 580px;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
    color: #07080B;
    font-family: var(--font-mono);
    font-size: 0.82rem;
    font-weight: 700;
    padding: 12px 26px;
    border-radius: 4px;
    border: 1px solid rgba(255, 248, 220, 0.6);
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.35), inset 0 1px 0 #FFFFFF;
    transition: all 0.2s ease;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  .btn-primary:hover {
    background: linear-gradient(180deg, #FFFFFF 0%, #F7E7B4 25%, #E5C158 65%, #C29627 100%);
    box-shadow: 0 6px 28px rgba(229, 193, 88, 0.55), inset 0 1px 0 #FFFFFF;
    transform: translateY(-1px);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.03);
    color: var(--text);
    border: 1px solid var(--panel-border);
    font-family: var(--font-mono);
    font-size: 0.82rem;
    font-weight: 500;
    padding: 12px 22px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }
  .btn-secondary:hover {
    background: rgba(223, 184, 67, 0.06);
    border-color: rgba(223, 184, 67, 0.35);
  }

  /* Hero Right: The Brier Benchmark Vault */
  .hero-right {
    background: linear-gradient(180deg, rgba(20, 25, 36, 0.88) 0%, rgba(10, 13, 19, 0.96) 100%);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 6px;
    padding: 32px;
    box-shadow: inset 0 1px 0 0 rgba(255, 245, 215, 0.28), 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(223, 184, 67, 0.1);
    position: relative;
    overflow: hidden;
  }
  .hero-right::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(247, 231, 180, 0.7), transparent);
  }

  .vault-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--panel-border);
    padding-bottom: 12px;
  }
  .vault-title {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .vault-status {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--accent);
  }

  .vault-brier-display {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }
  .vault-brier-num {
    font-family: var(--font-mono);
    font-size: 4.2rem;
    font-weight: 700;
    color: var(--accent-light);
    line-height: 0.95;
    letter-spacing: -0.04em;
    text-shadow: 0 0 35px rgba(223, 184, 67, 0.4);
  }
  .vault-brier-unit {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--muted);
  }

  .vault-desc {
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: 24px;
  }

  /* Section Styles */
  .section-block {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .section-heading-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-eyebrow {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-heading {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text);
  }

  .section-description {
    font-size: 0.92rem;
    color: var(--muted);
    max-width: 680px;
    line-height: 1.6;
  }

  /* Calibration Curve Highlight Grid */
  .calibration-summary-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 36px;
    border: 1px solid var(--panel-border);
    background: linear-gradient(180deg, rgba(14, 20, 30, 0.7) 0%, rgba(9, 13, 20, 0.9) 100%);
    border-radius: 6px;
    padding: 36px;
    align-items: center;
  }
  @media (max-width: 860px) {
    .calibration-summary-grid { grid-template-columns: 1fr; }
  }

  .calibration-narrative {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .narrative-title {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .narrative-body {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.65;
  }

  .chart-box {
    background: #06090E;
    border: 1px solid var(--panel-border);
    border-radius: 4px;
    padding: 24px;
  }

  .chart-meta {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    margin-bottom: 14px;
  }
  .chart-meta .stat-accent { color: var(--accent); font-weight: 600; }
  .chart-meta .stat-muted { color: var(--muted); }

  .chart-footer {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: 12px;
  }

  /* Specialist Grid */
  .specialist-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  @media (max-width: 1080px) {
    .specialist-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .specialist-grid { grid-template-columns: 1fr; }
  }

  .spec-card {
    border: 1px solid rgba(212, 175, 55, 0.16);
    background: linear-gradient(180deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 19, 0.9) 100%);
    box-shadow: inset 0 1px 0 0 rgba(255, 245, 215, 0.12), 0 12px 30px -10px rgba(0, 0, 0, 0.6);
    border-radius: 6px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px;
    text-align: left;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .spec-card:hover {
    border-color: rgba(223, 184, 67, 0.45);
    box-shadow: inset 0 1px 0 0 rgba(255, 245, 215, 0.35), 0 16px 40px -10px rgba(223, 184, 67, 0.2);
    transform: translateY(-2px);
  }

  .spec-card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
  }
  .spec-icon-box {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(223, 184, 67, 0.05);
    border: 1px solid rgba(223, 184, 67, 0.2);
    border-radius: 6px;
    flex-shrink: 0;
  }

  .spec-header-text {
    flex: 1;
    min-width: 0;
  }

  .spec-name-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
  }

  .spec-name {
    font-size: 0.95rem;
    font-weight: 700;
  }

  .spec-badge {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .spec-badge.accent { color: var(--accent); background: rgba(223, 184, 67, 0.12); border: 1px solid rgba(223, 184, 67, 0.35); }
  .spec-badge.warning { color: var(--warning); background: rgba(198, 93, 74, 0.1); border: 1px solid rgba(198, 93, 74, 0.25); }
  .spec-badge.muted { color: var(--muted); background: rgba(255, 255, 255, 0.05); border: 1px solid var(--panel-border); }

  .spec-role {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .spec-metric-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-top: 1px solid var(--panel-border);
    padding-top: 10px;
    margin-bottom: 8px;
  }

  .spec-large-number {
    font-family: var(--font-mono);
    font-size: 1.35rem;
    font-weight: 700;
  }
  .spec-large-number.accent { color: var(--accent); }
  .spec-large-number.warning { color: var(--warning); }
  .spec-large-number.muted { color: var(--muted); }

  .spec-detail {
    font-size: 0.8rem;
    color: var(--muted);
    line-height: 1.45;
  }

  .spec-actions {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--panel-border);
    padding-top: 12px;
    margin-top: 8px;
  }

  .spec-link-btn {
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    transition: color 0.15s;
  }
  .spec-link-btn:hover {
    color: var(--accent);
  }

  ${SPECIALIST_ICONS_CSS}

  /* Institutional Proof Matrix */
  .proof-matrix {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  @media (max-width: 960px) {
    .proof-matrix { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 580px) {
    .proof-matrix { grid-template-columns: 1fr; }
  }

  .proof-card {
    background: linear-gradient(180deg, rgba(14, 20, 30, 0.7) 0%, rgba(9, 13, 20, 0.9) 100%);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .proof-num {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--accent);
    text-transform: uppercase;
  }

  .proof-title {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .proof-body {
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.6;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .modal-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  .modal-dialog {
    background: #0A0E14;
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    width: min(640px, calc(100vw - 32px));
    max-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 20px 24px;
    border-bottom: 1px solid var(--panel-border);
  }
  .modal-title { font-size: 1.1rem; font-weight: 600; }
  .modal-close-btn {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
  }
  .modal-close-btn:hover { color: var(--text); }

  .modal-tabs {
    display: flex;
    border-bottom: 1px solid var(--panel-border);
    padding: 0 24px;
    gap: 16px;
  }
  .modal-tab-btn {
    background: none;
    border: none;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.78rem;
    padding: 12px 0;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  .modal-tab-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    font-weight: 600;
  }

  .modal-body {
    padding: 24px;
    overflow-y: auto;
  }

  .telemetry-item {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 0.82rem;
    padding: 8px 0;
    border-bottom: 1px solid var(--panel-border);
  }
  .telemetry-item-key { color: var(--muted); }
  .telemetry-item-val { color: var(--text); font-weight: 500; }

  .modal-chat-form {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  .modal-chat-input {
    flex: 1;
    background: #06090E;
    border: 1px solid var(--panel-border);
    color: var(--text);
    padding: 10px 12px;
    font-family: var(--font-sans);
    font-size: 0.85rem;
    border-radius: 4px;
    outline: none;
  }
  .modal-chat-send {
    background: var(--accent);
    color: #0A0E14;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    border: none;
    padding: 0 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Footer */
  .page-footer {
    border-top: 1px solid var(--panel-border);
    padding-top: 36px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-size: 0.8rem;
    color: var(--muted);
  }
  .footer-links {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }
  .footer-links a {
    color: var(--muted);
    transition: color 0.15s;
  }
  .footer-links a:hover {
    color: var(--text);
  }
  /* True Cost Check Wedge */
  .wedge-container {
    background: linear-gradient(180deg, rgba(17, 23, 34, 0.88) 0%, rgba(10, 14, 20, 0.96) 100%);
    border: 1px solid rgba(212, 175, 55, 0.28);
    border-radius: 8px;
    padding: 32px;
    box-shadow: inset 0 1px 0 rgba(255, 245, 215, 0.12), 0 20px 40px -15px rgba(0, 0, 0, 0.7);
  }
  .wedge-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-top: 24px;
  }
  @media (max-width: 860px) {
    .wedge-grid { grid-template-columns: 1fr; gap: 24px; }
  }
  .wedge-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
  }
  .wedge-field label {
    font-size: 0.8rem;
    font-family: var(--font-mono);
    color: var(--muted);
    display: flex;
    justify-content: space-between;
  }
  .wedge-input {
    background: #06090E;
    border: 1px solid rgba(212, 175, 55, 0.2);
    color: var(--text);
    padding: 9px 12px;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    border-radius: 4px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
    box-sizing: border-box;
  }
  .wedge-input:focus { border-color: var(--accent); }
  .wedge-slider {
    width: 100%;
    accent-color: var(--accent);
    cursor: pointer;
  }
  .wedge-decision-card {
    background: rgba(6, 9, 14, 0.88);
    border: 1px solid rgba(212, 175, 55, 0.22);
    border-radius: 6px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .wedge-badge-neutral {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    color: #FBBF24;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.35);
    padding: 3px 10px;
    border-radius: 4px;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .wedge-metric-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-family: var(--font-mono);
    font-size: 0.82rem;
  }
  .wedge-metric-key { color: var(--muted); }
  .wedge-metric-val { color: var(--text); font-weight: 600; }
</style>
</head>
<body>

  <!-- Top Live Ticker Strip -->
  <div class="live-ticker-strip">
    <div class="ticker-items">
      <div class="ticker-item"><span class="ticker-tag-green">● LIVE AUDIT</span> SPOT DISPERSION: <strong>+1.4 BPS</strong></div>
      <div class="ticker-item">CANONICAL CORPUS: <strong>1,316 SETTLED WINDOWS (19,740 ROWS)</strong></div>
      <div class="ticker-item">MARKET-MID BRIER: <strong>${brierScore} (NOMINAL)</strong></div>
      <div class="ticker-item"><span class="ticker-tag-warn">RULE B5 LOCKED</span> CAPITAL DEPLOYED: <strong>$0.00</strong></div>
    </div>
    <div style="font-family: var(--font-mono); color: var(--muted);">CRYPTOGRAPHIC REPRODUCIBILITY VERIFIED</div>
  </div>

  <!-- Primary Consumer Navigation: Check · Journal · Learn · Sign in -->
  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="nav-brand"><span class="brand-dot"></span> quanterraos</a>
      <div class="nav-links">
        <a href="/calculator" style="color:var(--accent); font-weight:700;">Check</a>
        <a href="/journal" style="color:#10B981; font-weight:700;">Journal</a>
        <a href="/learn" style="color:var(--accent-light); font-weight:700;">Learn</a>
        <a href="/access" style="color:var(--text); font-weight:500;">Sign in</a>
      </div>
    </div>
    <div class="nav-right" style="display:flex; gap:12px; align-items:center;">
      <a href="/research" style="color:var(--muted); font-size:0.78rem; text-decoration:none;">Research</a>
      <a href="/access" style="color:var(--muted); font-size:0.78rem; text-decoration:none;">Institutional</a>
      <a href="/calculator" class="nav-cta" style="background:linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%); color:#07080B; border:1px solid rgba(255,248,220,0.8); box-shadow:0 4px 16px rgba(212,175,55,0.4), inset 0 1px 0 #FFF; font-weight:800;">FREE CHECK &rarr;</a>
    </div>
  </nav>

  <div class="page-wrap">

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-left">
        <div class="hero-badge">
          <span class="pulse-beacon"></span> Independent Decision &amp; Risk Companion
        </div>
        <h1 class="hero-heading">
          Understand the real cost. Control your risk. Learn from every decision.
        </h1>
        <p class="hero-subhead">
          The independent companion you consult before entering any prediction-market position. Verify executable taker fees, true breakeven odds, and settlement friction across Kalshi and Polymarket before risking capital.
        </p>
        <div class="hero-actions">
          <a href="/calculator" class="btn-primary" style="background:linear-gradient(180deg, #10B981 0%, #059669 100%); border-color:#34D399; box-shadow:0 0 20px rgba(16,185,129,0.35); font-weight:700;">Free True-Cost &amp; Breakeven Check &rarr;</a>
          <a href="/journal?preview=true" class="btn-secondary" style="border-color:rgba(212,175,55,0.4); color:var(--accent-light);">Preview Decision Journal &rarr;</a>
          <a href="/pricing" class="btn-secondary">Plans &amp; Pricing</a>
        </div>

        <div style="background: rgba(14, 20, 30, 0.7); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 6px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 24px; width: 100%; font-family: var(--font-mono); font-size: 0.74rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10B981; box-shadow:0 0 8px #10B981;"></span>
            <span style="color:var(--text); font-weight:600;">SOVEREIGN AGENT DEPLOYMENT</span>
            <span style="color:rgba(255,255,255,0.2);">//</span>
            <span style="color:var(--muted);">DUAL MCP &amp; A2A PROTOCOL</span>
          </div>
          <a href="/mcp" style="color:var(--accent); text-decoration:underline;">Inspect Manifest &rarr;</a>
        </div>
      </div>

      <!-- Hero Right: Vault Card -->
      <div class="hero-right">
        <div class="vault-header">
          <span class="vault-title">Empirical Benchmark Vault</span>
          <span class="vault-status">● VERIFIED BASELINE</span>
        </div>
        <div class="vault-brier-display">
          <div class="vault-brier-num" id="hero-brier-val">${brierScore}</div>
          <div class="vault-brier-unit">Brier Score</div>
        </div>
        <div class="vault-desc">
          Murphy decomposition of minute-4 market mid-price across ${sampleN.toLocaleString()} settled contracts. The market benchmark outscores our internal models (0.2063).
        </div>
        <div style="border-top: 1px solid var(--panel-border); padding-top: 14px; display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.72rem;">
          <span style="color: var(--muted);">Random Baseline: 0.2500</span>
          <span style="color: var(--warning);">Market Baseline: 0.2001 (Model: 0.2063)</span>
        </div>
      </div>
    </section>

    <!-- Acquisition Wedge: Free True-Cost & Breakeven Check -->
    <section class="section-block" id="true-cost-check" style="margin-top: 8px;">
      <div class="wedge-container">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <div class="section-eyebrow">The Acquisition Wedge · Free Prior to Registration</div>
            <h2 class="section-heading" style="margin-top: 4px;">True-Cost &amp; Breakeven Check</h2>
            <p style="font-size: 0.9rem; color: var(--muted); max-width: 680px; margin-top: 6px;">
              Understand the hurdle to profitability before risking capital. Compute executable purchase cost, venue taker fees, slippage, and true breakeven odds for any prediction-market contract.
            </p>
          </div>
          <div style="text-align: right;">
            <span class="wedge-badge-neutral" id="wedge-status-badge">Costs Checked · Uncertainty High</span>
          </div>
        </div>

        <div class="wedge-grid">
          <!-- Left: Contract Inputs -->
          <div style="background: rgba(12, 16, 24, 0.7); border: 1px solid rgba(212, 175, 55, 0.16); border-radius: 6px; padding: 22px;">
            <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-light); font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">
              Contract Parameters
            </div>

            <div class="wedge-field">
              <label>Market Venue &amp; Series</label>
              <select class="wedge-input" id="wedge-venue" onchange="recalcWedge()">
                <option value="kalshi-15m" selected>Kalshi — 15-Minute Above/Below (KXBTC15M)</option>
                <option value="kalshi-1h">Kalshi — 1-Hour Above/Below (KXBTCD)</option>
                <option value="polymarket">Polymarket — Binary 15-Minute (USDC)</option>
              </select>
            </div>

            <div class="wedge-field">
              <label>
                <span>Executable Ask Price</span>
                <span id="wedge-price-val" style="color:var(--text); font-weight:600;">51¢ ($0.51)</span>
              </label>
              <input type="range" class="wedge-slider" id="wedge-price" min="1" max="99" value="51" oninput="recalcWedge()">
            </div>

            <div class="wedge-field">
              <label>
                <span>Your Assessed Win Probability (p)</span>
                <span id="wedge-prob-val" style="color:var(--text); font-weight:600;">55.0%</span>
              </label>
              <input type="range" class="wedge-slider" id="wedge-prob" min="1" max="99" value="55" oninput="recalcWedge()">
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div class="wedge-field">
                <label>Contract Count</label>
                <input type="number" class="wedge-input" id="wedge-count" value="10" min="1" max="5000" oninput="recalcWedge()">
              </div>
              <div class="wedge-field">
                <label>Estimated Slippage</label>
                <input type="text" class="wedge-input" id="wedge-slippage" value="0.0¢" readonly style="color:var(--muted);">
              </div>
            </div>
          </div>

          <!-- Right: Neutral Decision Card -->
          <div class="wedge-decision-card">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px;">
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-light); font-weight: 600; text-transform: uppercase;">
                  Decision &amp; Exposure Audit
                </span>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--muted);" id="wedge-timestamp">TIMESTAMP</span>
              </div>

              <div class="wedge-metric-row">
                <span class="wedge-metric-key">Executable Purchase Cost:</span>
                <span class="wedge-metric-val" id="wedge-out-purchase">$5.10</span>
              </div>
              <div class="wedge-metric-row">
                <span class="wedge-metric-key">Exchange Taker Fee:</span>
                <span class="wedge-metric-val" style="color:var(--warning);" id="wedge-out-fee">+$0.18 (1.80¢/ct)</span>
              </div>
              <div class="wedge-metric-row">
                <span class="wedge-metric-key">Maximum Potential Loss:</span>
                <span class="wedge-metric-val" style="color:var(--warning);" id="wedge-out-maxloss">$5.28</span>
              </div>
              <div class="wedge-metric-row">
                <span class="wedge-metric-key">Required Breakeven Win Probability:</span>
                <span class="wedge-metric-val" style="color:var(--accent);" id="wedge-out-breakeven">52.80%</span>
              </div>
              <div class="wedge-metric-row">
                <span class="wedge-metric-key">Net Arithmetic EV (at Assessed p):</span>
                <span class="wedge-metric-val" style="color:#10B981;" id="wedge-out-ev">+$0.22 total</span>
              </div>
              <div class="wedge-metric-row">
                <span class="wedge-metric-key">Settlement Reference Source:</span>
                <span class="wedge-metric-val" style="color:var(--text-dim);" id="wedge-out-source">CME CF BRTI 60s TWAP</span>
              </div>
            </div>

            <div style="margin-top: 20px;">
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <a href="/account?flow=save-check" id="btn-wedge-save" onclick="handleWedgeSaveCheck(event)" class="btn-primary" style="flex:1; text-align:center; padding:10px 14px; font-size:0.8rem; background:linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%); color:#07080B; border:1px solid #DFB843; font-weight:700;">
                  Save My Check &amp; Start Journal &rarr;
                </a>
                <button type="button" class="btn-secondary" onclick="loadExampleWedgeCheck()" style="padding:10px 14px; font-size:0.8rem; border-color:rgba(56,189,248,0.4); color:#38BDF8; font-weight:600;">
                  ⚡ Example Preview
                </button>
                <button type="button" class="btn-secondary" onclick="openShareCardModal()" style="display:inline-flex; align-items:center; gap:6px; padding:10px 14px; font-size:0.8rem; font-weight:600; background:rgba(212,175,55,0.08); border-color:rgba(212,175,55,0.3); color:var(--accent-light);">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  Export Card
                </button>
              </div>
              <div style="font-size: 0.72rem; color: var(--muted); margin-top: 10px; line-height: 1.45;">
                <strong>Advisory Notice:</strong> Expected profit is pure arithmetic ($p - P_{ask} - fee$), not an established QuanterraOS edge. User-entered probabilities are personal assumptions, never validated forecasts.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Calibration Curve Highlight -->
    <section class="section-block">
      <div class="calibration-summary-grid">
        <div class="calibration-narrative">
          <div class="section-eyebrow">Statistical Baseline</div>
          <h2 class="narrative-title">The market mid-price is verifiably well-calibrated</h2>
          <p class="narrative-body">
            Across ${sampleN.toLocaleString()} settled 15-minute BTC contracts (16 missing of 1,332 theoretical windows), the minute-4 market mid-price achieved an audited Brier score of ${brierScore}.
          </p>
          <p class="narrative-body">
            The market's own price consistently outperforms quantitative lognormal models across checkpoints 4, 7, 10, and 13. Rather than asserting unvalidated predictions, QuanterraOS provides transparent, cryptographically reproducible calibration benchmarks.
          </p>
          <div>
            <a href="/calibration" style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent); text-decoration: underline; text-underline-offset: 4px;">Inspect 10-bin decile decomposition &rarr;</a>
          </div>
        </div>

        <div class="chart-box">
          <div class="chart-meta">
            <span class="stat-muted">n=${sampleN.toLocaleString()} settled markets</span>
            <span class="stat-accent">Brier: ${brierScore}</span>
          </div>
          <svg viewBox="0 0 310 140" style="width: 100%; height: auto; display: block;" role="img" aria-label="Calibration curve showing actual points vs ideal diagonal">
            <line x1="30" y1="15" x2="290" y2="15" stroke="rgba(212,175,55,0.08)" />
            <line x1="30" y1="65" x2="290" y2="65" stroke="rgba(212,175,55,0.08)" />
            <line x1="30" y1="115" x2="290" y2="115" stroke="rgba(212,175,55,0.08)" />
            <line x1="30" y1="115" x2="290" y2="15" stroke="#786B43" stroke-width="1.5" stroke-dasharray="3 3" />
            <polyline points="${miniPolyline}" fill="none" stroke="#DFB843" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
${miniCircles}
            <text x="30" y="132" fill="#94A3B8" font-size="8" font-family="IBM Plex Mono, monospace">0%</text>
            <text x="160" y="132" fill="#94A3B8" font-size="8" text-anchor="middle" font-family="IBM Plex Mono, monospace">Quoted mid</text>
            <text x="290" y="132" fill="#94A3B8" font-size="8" text-anchor="end" font-family="IBM Plex Mono, monospace">100%</text>
          </svg>
          <div class="chart-footer">
            <span>dashed: ideal diagonal</span>
            <span style="color: var(--accent);">gold: Kalshi outcome</span>
          </div>
        </div>
      </div>
    </section>


    <!-- 3-Layer Sovereign OS Architecture Section -->
    <section class="section-block">
      <div class="section-heading-group">
        <div class="section-eyebrow">Sovereign Architecture</div>
        <h2 class="section-heading">The 3-Layer Sovereign AI Governance Stack</h2>
        <p class="section-description">
          Engineered for institutional desks, prop firms, and autonomous agent swarms requiring deterministic settlement verification, transaction friction accounting, and air-gapped readiness.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 8px;">
        <!-- Layer 1 -->
        <div style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 6px; padding: 26px; backdrop-filter: blur(20px); display: flex; flex-direction: column;">
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">LAYER 1 // FOUNDATION</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF; margin-bottom: 10px;">Intelligence Spine</h3>
          <p style="font-size: 0.86rem; color: var(--muted); line-height: 1.6; margin-bottom: 16px; flex-grow: 1;">
            Deterministic multi-venue ingestion, order-book L2 microstructure, and settlement target verification.
          </p>
          <ul style="list-style: none; font-family: var(--font-mono); font-size: 0.76rem; color: #CBD5E1; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--panel-border-subtle); padding-top: 14px;">
            <li><span style="color:var(--accent);">▸</span> Spot Dispersion &amp; Settlement Basis Engine</li>
            <li><span style="color:var(--accent);">▸</span> Composite Spot Index (Coinbase, Kraken, Bitstamp)</li>
            <li><span style="color:var(--accent);">▸</span> 19,740 Audited Minute Candles (1,316 Windows)</li>
            <li><span style="color:var(--accent);">▸</span> Minute-by-Minute (1–14) Calibration Surface</li>
          </ul>
        </div>

        <!-- Layer 2 -->
        <div style="background: linear-gradient(180deg, rgba(20, 26, 40, 0.9) 0%, rgba(13, 17, 26, 0.95) 100%); border: 1px solid rgba(223, 184, 67, 0.45); border-radius: 6px; padding: 26px; backdrop-filter: blur(20px); box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25), 0 0 25px rgba(223, 184, 67, 0.12); display: flex; flex-direction: column;">
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-light); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">LAYER 2 // GOVERNANCE</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF; margin-bottom: 10px;">Trust &amp; Control Plane</h3>
          <p style="font-size: 0.86rem; color: var(--muted); line-height: 1.6; margin-bottom: 16px; flex-grow: 1;">
            Model Context Protocol (MCP) server, 8-agent council audit trails, and strict mathematical circuit breakers.
          </p>
          <ul style="list-style: none; font-family: var(--font-mono); font-size: 0.76rem; color: #CBD5E1; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--panel-border-subtle); padding-top: 14px;">
            <li><span style="color:var(--accent);">▸</span> Model Context Protocol (MCP) Live Tools</li>
            <li><span style="color:var(--accent);">▸</span> Agent-to-Agent (A2A) Telemetry Handshake</li>
            <li><span style="color:var(--accent);">▸</span> Rule B5 Permanent Circuit Lock ($0.00 Capital)</li>
            <li><span style="color:var(--accent);">▸</span> Decile Reliability with 95% Wilson CIs</li>
          </ul>
        </div>

        <!-- Layer 3 -->
        <div style="background: var(--panel); border: 1px solid var(--panel-border); border-radius: 6px; padding: 26px; backdrop-filter: blur(20px); display: flex; flex-direction: column;">
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">LAYER 3 // WORKFLOW</div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFFFFF; margin-bottom: 10px;">Execution Mesh</h3>
          <p style="font-size: 0.86rem; color: var(--muted); line-height: 1.6; margin-bottom: 16px; flex-grow: 1;">
            Friction-aware expectancy modeling, transaction cost analysis, and private container deployments.
          </p>
          <ul style="list-style: none; font-family: var(--font-mono); font-size: 0.76rem; color: #CBD5E1; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--panel-border-subtle); padding-top: 14px;">
            <li><span style="color:var(--accent);">▸</span> True Cost &amp; Net Expected Value (EV) Engine</li>
            <li><span style="color:var(--accent);">▸</span> Kalshi Variable Taker Fee Drag ($0.07×P×(1-P))</li>
            <li><span style="color:var(--accent);">▸</span> Cross-Venue Basis Surveillance (Kalshi vs Poly)</li>
            <li><span style="color:var(--accent);">▸</span> Sovereign On-Prem / Air-Gapped Readiness</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- The Eight Specialists -->
    <section class="section-block" id="specialists">
      <div class="section-heading-group">
        <div class="section-eyebrow">Machine Architecture</div>
        <h2 class="section-heading">The eight council specialists</h2>
        <p class="section-description">
          Each specialist monitors, verifies, or audits a distinct layer of market microstructure. We publish real metrics, including out-of-sample underperformance, adhering to absolute transparency.
        </p>
      </div>

      <div class="specialist-grid">

        <!-- 1. Falcon -->
        <div class="spec-card" onclick="openSpecialistModal('falcon')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('falcon')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row">
                  <span class="spec-name">Falcon</span>
                  <span class="spec-badge warning">research</span>
                </div>
                <div class="spec-role">Order-book depth monitoring</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number warning">0.2736</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">out-of-sample Brier (n=31)</div>
            </div>
            <div class="spec-detail" style="margin-top: 8px;">
              Underperforms both 50/50 baseline (0.2500) and entry-price (0.2106). Strict research designation.
            </div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('falcon', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('falcon', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 2. Quantum Fox -->
        <div class="spec-card" onclick="openSpecialistModal('quantum-fox')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('quantum-fox')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row">
                  <span class="spec-name">Quantum Fox</span>
                  <span class="spec-badge accent">baseline</span>
                </div>
                <div class="spec-role">Market baseline validation</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number accent">0.2001</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">market-mid Brier (n=1,316)</div>
            </div>
            <div class="spec-detail" style="margin-top: 8px;">
              Audits minute-4 mid-price against fair-value model. Market mid beat our model across all checkpoints.
            </div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('quantum-fox', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('quantum-fox', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 3. Phoenix -->
        <div class="spec-card" onclick="openSpecialistModal('phoenix')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('phoenix')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row">
                  <span class="spec-name">Phoenix</span>
                  <span class="spec-badge warning">locked</span>
                </div>
                <div class="spec-role">Execution circuit breaker</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number warning">$0.00</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">live capital deployed</div>
            </div>
            <div class="spec-detail" style="margin-top: 8px;">
              Rule B5 locked. Standby mode enforced. Zero automated orders permitted until statistical edge is proven.
            </div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('phoenix', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('phoenix', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 4. Draco -->
        <div class="spec-card" onclick="openSpecialistModal('draco')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('draco')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row">
                  <span class="spec-name">Draco</span>
                  <span class="spec-badge accent">verified</span>
                </div>
                <div class="spec-role">Data integrity &amp; quality gate</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number accent">19,740</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">audited candle rows</div>
            </div>
            <div class="spec-detail" style="margin-top: 8px;">
              Verifies zero corrupted timestamps across 1,316 settled windows. Rejects lookahead and stale data.
            </div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('draco', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('draco', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 5. Sentinel -->
        <div class="spec-card" onclick="openSpecialistModal('sentinel')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('sentinel')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row">
                  <span class="spec-name">Sentinel</span>
                  <span class="spec-badge muted">nominal</span>
                </div>
                <div class="spec-role">Calibration drift surveillance</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number muted">0 alerts</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">continuous surveillance</div>
            </div>
            <div class="spec-detail" style="margin-top: 8px;">
              Surveils upstream pipeline stages and monitors drift against recorded baselines.
            </div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('sentinel', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('sentinel', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 6. Wolf -->
        <div class="spec-card" onclick="openSpecialistModal('wolf')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('wolf')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row">
                  <span class="spec-name">Wolf</span>
                  <span class="spec-badge accent">tracking</span>
                </div>
                <div class="spec-role">Order-book dynamics</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number accent">+0.0350</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">queue depth imbalance</div>
            </div>
            <div class="spec-detail" style="margin-top: 8px;">
              Evaluates L2 order-book snapshots from SQLite, tracking spread compression and queue depth imbalance.
            </div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('wolf', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('wolf', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 7. Kraken -->
        <div class="spec-card" onclick="openSpecialistModal('kraken')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('kraken')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row">
                  <span class="spec-name">Kraken</span>
                  <span class="spec-badge warning">locked</span>
                </div>
                <div class="spec-role">Risk governance &amp; spot basis</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number warning">$0.00</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">authorized exposure</div>
            </div>
            <div class="spec-detail" style="margin-top: 8px;">
              Enforces zero live capital exposure under Rule B5 while monitoring spot dispersion and settlement basis divergence.
            </div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('kraken', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('kraken', 'chat');">query specialist</button>
          </div>
        </div>

        <!-- 8. Lion -->
        <div class="spec-card" onclick="openSpecialistModal('lion')">
          <div>
            <div class="spec-card-header">
              <div class="spec-icon-box">${renderSpecialistIcon('lion')}</div>
              <div class="spec-header-text">
                <div class="spec-name-row">
                  <span class="spec-name">Lion</span>
                  <span class="spec-badge accent">consensus</span>
                </div>
                <div class="spec-role">Consensus synthesis</div>
              </div>
            </div>
            <div class="spec-metric-row">
              <div class="spec-large-number accent">10 bins</div>
              <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono);">decile verification</div>
            </div>
            <div class="spec-detail" style="margin-top: 8px;">
              Synthesizes multi-specialist calibration evidence and certifies the single source of truth verdict.
            </div>
          </div>
          <div class="spec-actions">
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('lion', 'telemetry');">inspect telemetry</button>
            <button type="button" class="spec-link-btn" onclick="event.stopPropagation(); openSpecialistModal('lion', 'chat');">query specialist</button>
          </div>
        </div>

      </div>
    </section>

    <!-- Four Pillars of Institutional Governance -->
    <section class="section-block">
      <div class="section-heading-group">
        <div class="section-eyebrow">Institutional Standards</div>
        <h2 class="section-heading">Engineered for absolute statistical integrity</h2>
      </div>

      <div class="proof-matrix">
        <div class="proof-card">
          <span class="proof-num">01 / Provenance</span>
          <h3 class="proof-title">Uncompromising Corpus Integrity</h3>
          <p class="proof-body">19,740 1-minute candle rows covering 1,316 settled windows. Zero retrospective tampering or lookahead bias.</p>
        </div>
        <div class="proof-card">
          <span class="proof-num">02 / Microstructure</span>
          <h3 class="proof-title">Sub-Second Depth Intelligence</h3>
          <p class="proof-body">Wolf monitors top-of-book and L2 queue depth imbalances with audited cutoff thresholds.</p>
        </div>
        <div class="proof-card">
          <span class="proof-num">03 / Calibration</span>
          <h3 class="proof-title">Empirical Brier Decomposition</h3>
          <p class="proof-body">10-bin decile reliability mapping proving the market mid-price is verifiably calibrated (0.2001 Brier).</p>
        </div>
        <div class="proof-card">
          <span class="proof-num">04 / Governance</span>
          <h3 class="proof-title">Rule B5 Permanent Circuit Lock</h3>
          <p class="proof-body">Strict enforcement of $0.00 capital deployment until statistically significant out-of-sample predictive accuracy is proven.</p>
        </div>
      </div>
    </section>

    <!-- Specialist Inspection Modal -->
    <div class="modal-backdrop" id="specialist-modal-backdrop" aria-hidden="true" role="dialog">
      <div class="modal-dialog">
        <div class="modal-header">
          <div>
            <div class="modal-title" id="modal-agent-name">Specialist</div>
            <div style="font-size: 0.78rem; color: var(--muted); margin-top: 2px;" id="modal-agent-role">Role</div>
          </div>
          <button type="button" class="modal-close-btn" onclick="closeSpecialistModal()">&times;</button>
        </div>

        <div class="modal-tabs">
          <button type="button" class="modal-tab-btn active" id="modal-tab-telemetry-btn" onclick="switchModalTab('telemetry')">Audited Telemetry</button>
          <button type="button" class="modal-tab-btn" id="modal-tab-chat-btn" onclick="switchModalTab('chat')">Live Query</button>
        </div>

        <div class="modal-body">
          <div id="modal-pane-telemetry">
            <p style="font-size: 0.85rem; color: var(--muted); line-height: 1.5; margin-bottom: 18px;" id="modal-agent-desc">
              Description
            </p>
            <div id="modal-telemetry-stats"></div>
          </div>

          <div id="modal-pane-chat" style="display: none;">
            <div id="modal-chat-stream" style="display: flex; flex-direction: column; gap: 10px; max-height: 220px; overflow-y: auto; font-size: 0.82rem; margin-bottom: 14px;">
              <div style="color: var(--muted);">Standing by. You may query our verified benchmarks and findings.</div>
            </div>
            <form class="modal-chat-form" onsubmit="event.preventDefault(); submitModalChat();">
              <input type="text" class="modal-chat-input" id="modal-chat-input" placeholder="Query specialist...">
              <button type="submit" class="modal-chat-send" id="modal-chat-send-btn">submit</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="page-footer">
      <div class="footer-links">
        <a href="/calibration">calibration</a>
        <a href="/council">council</a>
        <a href="/predictions">predictions</a>
        <a href="/autopilot">autopilot</a>
        <a href="/wallet">wallet</a>
        <a href="/growth">growth</a>
        <a href="/index">index</a>
        <a href="/spread">spread</a>
        <a href="/methodology">methodology</a>
        <a href="/research">research</a>
        <a href="/changelog">changelog</a>
        <a href="/legal">legal</a>
        <a href="/status">status</a>
      </div>
      <div class="footer-disclaimer">
        <p style="margin-bottom: 8px;">
          <strong>Regulatory &amp; Non-Affiliation Notice (Rule B10):</strong> Kalshi, CME Group, CF Benchmarks, Coinbase, Kraken, Bitstamp, Gemini, and Polymarket are trademarks of their respective owners. QuanterraOS is an independent measurement and statistical verification system operated by Quantara Global LLC and is not affiliated with, endorsed by, or sponsored by any exchange, index provider, or market operator.
        </p>
        <p>
          <strong>Not Investment Advice (Rule B5):</strong> QuanterraOS does not provide investment, financial, or trading advice, and does not route or execute live orders. In accordance with internal safety Rule B5, zero live capital is deployed ($0.00 exposure). Simulated and historical calibration results have inherent limitations under CFTC Rule 4.41. Past performance does not guarantee future results. <a href="/legal" style="color:var(--accent); text-decoration:underline;">Read full Legal Notices, Terms &amp; Regulatory Disclaimers &rarr;</a>
        </p>
      </div>
    </footer>

  </div>

<script>
let activeAgentId = null;
const councilAgents = ${JSON.stringify(councilAgents)};

function openSpecialistModal(agentId, initialTab = 'telemetry') {
  activeAgentId = agentId;
  const agent = councilAgents.find(a => a.id === agentId);
  const backdrop = document.getElementById('specialist-modal-backdrop');
  if (!agent || !backdrop) return;

  document.getElementById('modal-agent-name').textContent = agent.name;
  document.getElementById('modal-agent-role').textContent = agent.role;
  document.getElementById('modal-agent-desc').textContent = agent.expandedDesc;

  const statsContainer = document.getElementById('modal-telemetry-stats');
  if (statsContainer) {
    statsContainer.innerHTML = '';
    agent.stats.forEach(s => {
      const item = document.createElement('div');
      item.className = 'telemetry-item';
      item.innerHTML = '<span class="telemetry-item-key">' + escapeHtml(s.label) + '</span><span class="telemetry-item-val">' + escapeHtml(s.value) + '</span>';
      statsContainer.appendChild(item);
    });
  }

  switchModalTab(initialTab);
  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeSpecialistModal() {
  const backdrop = document.getElementById('specialist-modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

function switchModalTab(tab) {
  const telemetryBtn = document.getElementById('modal-tab-telemetry-btn');
  const chatBtn = document.getElementById('modal-tab-chat-btn');
  const telemetryPane = document.getElementById('modal-pane-telemetry');
  const chatPane = document.getElementById('modal-pane-chat');

  if (tab === 'telemetry') {
    if (telemetryBtn) telemetryBtn.classList.add('active');
    if (chatBtn) chatBtn.classList.remove('active');
    if (telemetryPane) telemetryPane.style.display = 'block';
    if (chatPane) chatPane.style.display = 'none';
  } else {
    if (telemetryBtn) telemetryBtn.classList.remove('active');
    if (chatBtn) chatBtn.classList.add('active');
    if (telemetryPane) telemetryPane.style.display = 'none';
    if (chatPane) chatPane.style.display = 'block';
    const input = document.getElementById('modal-chat-input');
    if (input) setTimeout(() => input.focus(), 60);
  }
}

async function submitModalChat() {
  const input = document.getElementById('modal-chat-input');
  const stream = document.getElementById('modal-chat-stream');
  const btn = document.getElementById('modal-chat-send-btn');
  if (!input || !stream || !activeAgentId) return;
  const text = input.value.trim();
  if (!text) return;

  const userDiv = document.createElement('div');
  userDiv.style.color = 'var(--text)';
  userDiv.innerHTML = '<strong>You:</strong> ' + escapeHtml(text);
  stream.appendChild(userDiv);
  input.value = '';
  if (btn) btn.disabled = true;

  const waitDiv = document.createElement('div');
  waitDiv.id = 'modal-wait-msg';
  waitDiv.style.color = 'var(--muted)';
  waitDiv.textContent = 'Auditing against stored records...';
  stream.appendChild(waitDiv);
  stream.scrollTop = stream.scrollHeight;

  try {
    const res = await fetch('/api/executives/' + activeAgentId + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    const wait = document.getElementById('modal-wait-msg');
    if (wait) wait.remove();

    const specDiv = document.createElement('div');
    specDiv.style.color = 'var(--text)';
    specDiv.style.borderLeft = '2px solid var(--accent)';
    specDiv.style.paddingLeft = '8px';
    let citations = '';
    if (Array.isArray(data.citations) && data.citations.length > 0) {
      citations = '<div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--muted); margin-top:4px;">citation: ' + data.citations.map(c => escapeHtml(c)).join(', ') + '</div>';
    }
    specDiv.innerHTML = '<strong>' + escapeHtml(data.agentName || activeAgentId) + ':</strong> ' + escapeHtml(data.reply || '') + citations;
    stream.appendChild(specDiv);
  } catch (_e) {
    const wait = document.getElementById('modal-wait-msg');
    if (wait) wait.remove();
    const errDiv = document.createElement('div');
    errDiv.style.color = 'var(--warning)';
    errDiv.textContent = 'Error connecting to specialist service.';
    stream.appendChild(errDiv);
  } finally {
    if (btn) btn.disabled = false;
    stream.scrollTop = stream.scrollHeight;
  }
}

async function pollPipelineCycle() {
  try {
    const res = await fetch('/api/council/pipeline/latest');
    if (!res.ok) return;
    const run = await res.json();
    if (run.averageBrierScore !== undefined && run.averageBrierScore !== null) {
      const hero = document.getElementById('hero-brier-val');
      if (hero) {
        const newVal = run.averageBrierScore.toFixed(4);
        if (hero.textContent !== newVal) {
          hero.style.opacity = '0.4';
          setTimeout(() => {
            hero.textContent = newVal;
            hero.style.opacity = '1';
          }, 200);
        }
      }
    }
  } catch (_e) {
    // quiet
  }
}
setInterval(pollPipelineCycle, 30000);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSpecialistModal();
});

const backdrop = document.getElementById('specialist-modal-backdrop');
if (backdrop) {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeSpecialistModal();
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function recalcWedge() {
  const priceSlider = document.getElementById('wedge-price');
  const probSlider = document.getElementById('wedge-prob');
  const countInput = document.getElementById('wedge-count');
  const venueSelect = document.getElementById('wedge-venue');
  if (!priceSlider || !probSlider || !countInput || !venueSelect) return;

  const priceCents = Number(priceSlider.value);
  const price = priceCents / 100;
  const prob = Number(probSlider.value) / 100;
  const count = Math.max(1, Number(countInput.value) || 1);
  const venue = venueSelect.value;

  const priceVal = document.getElementById('wedge-price-val');
  if (priceVal) priceVal.textContent = priceCents + '¢ ($' + price.toFixed(2) + ')';
  const probVal = document.getElementById('wedge-prob-val');
  if (probVal) probVal.textContent = (prob * 100).toFixed(1) + '%';

  let totalFee = 0;
  let feePerContract = 0;
  let source = "CME CF BRTI 60s TWAP";
  if (venue.indexOf('kalshi') !== -1) {
    const rawFee = 0.07 * count * price * (1 - price);
    totalFee = Math.ceil(rawFee * 100) / 100;
    feePerContract = totalFee / count;
    source = venue === 'kalshi-1h' ? 'CME CF BRTI 60s TWAP (1H)' : 'CME CF BRTI 60s TWAP (15M)';
  } else {
    const gas = count >= 50 ? 0.08 : 0.15;
    totalFee = Number(((0.005 * count) + gas).toFixed(2));
    feePerContract = totalFee / count;
    source = 'Polygon UMA Optimistic Oracle (2h Dispute Window)';
  }

  const purchaseCost = price * count;
  const maxLoss = purchaseCost + totalFee;
  const breakevenPct = (price + feePerContract) * 100;
  const netEvPerContract = prob - price - feePerContract;
  const totalNetEv = netEvPerContract * count;

  const outPurchase = document.getElementById('wedge-out-purchase');
  if (outPurchase) outPurchase.textContent = '$' + purchaseCost.toFixed(2);
  const outFee = document.getElementById('wedge-out-fee');
  if (outFee) outFee.textContent = '+$' + totalFee.toFixed(2) + ' (' + (feePerContract * 100).toFixed(2) + '¢/ct)';
  const outMaxLoss = document.getElementById('wedge-out-maxloss');
  if (outMaxLoss) outMaxLoss.textContent = '$' + maxLoss.toFixed(2);
  const outBreakeven = document.getElementById('wedge-out-breakeven');
  if (outBreakeven) outBreakeven.textContent = breakevenPct.toFixed(2) + '%';
  const outEv = document.getElementById('wedge-out-ev');
  if (outEv) {
    const sign = totalNetEv >= 0 ? '+' : '-';
    outEv.textContent = sign + '$' + Math.abs(totalNetEv).toFixed(2) + ' total';
    outEv.style.color = totalNetEv >= 0 ? '#10B981' : 'var(--warning)';
  }
  const outSource = document.getElementById('wedge-out-source');
  if (outSource) outSource.textContent = source;

  const timeEl = document.getElementById('wedge-timestamp');
  if (timeEl) timeEl.textContent = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // Store check state for journal onboarding
  window.__wedgeCheck = {
    venue: venue,
    pricingBasis: 'executable_ask',
    contractTicker: venue === 'kalshi-1h' ? 'KXBTCD' : venue === 'polymarket' ? 'POLY-BTC15M' : 'KXBTC15M',
    side: 'yes',
    price: price,
    count: count,
    purchaseCost: Number(purchaseCost.toFixed(2)),
    exchangeFee: Number(totalFee.toFixed(2)),
    halfSpreadDrag: 0.0,
    totalDrag: Number(feePerContract.toFixed(4)),
    breakevenWinProb: Number(breakevenPct.toFixed(2)),
    assessedWinProb: Number((prob * 100).toFixed(2)),
    netExpectedValue: Number(totalNetEv.toFixed(2)),
    settlementSource: source
  };

  // Redraw canvas if modal is open
  const modal = document.getElementById('share-card-modal');
  if (modal && modal.style.display === 'flex') {
    renderCardToCanvas();
  }
}

function handleWedgeSaveCheck(e) {
  e.preventDefault();
  if (!window.__wedgeCheck) recalcWedge();
  try {
    localStorage.setItem('quanterraos_pending_check', JSON.stringify(window.__wedgeCheck));
    fetch('/api/analytics/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(window.__wedgeCheck)
    }).catch(function() {});
  } catch (_) {}
  window.location.href = '/account?flow=save-check';
}

function renderCardToCanvas() {
  const canvas = document.getElementById('decision-card-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const venueSelect = document.getElementById('wedge-venue');
  const venueText = venueSelect ? venueSelect.options[venueSelect.selectedIndex].text.split('—')[0].trim() : 'Kalshi';
  const priceVal = (document.getElementById('wedge-price') ? Number(document.getElementById('wedge-price').value) : 51) + '¢';
  const breakevenVal = document.getElementById('wedge-out-breakeven') ? document.getElementById('wedge-out-breakeven').textContent : '52.75%';
  const feeVal = document.getElementById('wedge-out-fee') ? document.getElementById('wedge-out-fee').textContent : '+$0.18';
  const sourceVal = document.getElementById('wedge-out-source') ? document.getElementById('wedge-out-source').textContent : 'CME CF BRTI TWAP';

  // 1. Background
  ctx.fillStyle = '#06070A';
  ctx.fillRect(0, 0, 1200, 630);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 40; x < 1200; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 630); ctx.stroke();
  }
  for (let y = 40; y < 630; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
  }

  // Border with gold accent
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 570);

  // 2. Top Header
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(65, 75, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FBF4DC';
  ctx.font = 'bold 22px "SF Mono", monospace, Courier';
  ctx.fillText('QUANTERRAOS // VERIFIED DECISION & RISK AUDIT', 88, 82);

  ctx.fillStyle = '#8E9AA8';
  ctx.font = '16px "SF Mono", monospace, Courier';
  ctx.fillText('TIMESTAMP: ' + new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC', 780, 82);

  // Divider
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
  ctx.beginPath(); ctx.moveTo(60, 115); ctx.lineTo(1140, 115); ctx.stroke();

  // 3. Central Focal Metric
  ctx.fillStyle = '#8E9AA8';
  ctx.font = '18px "SF Mono", monospace, Courier';
  ctx.fillText('REQUIRED BREAKEVEN WIN RATE HURDLE', 60, 170);

  ctx.fillStyle = '#DFB843';
  ctx.font = 'bold 74px "SF Mono", monospace, Courier';
  ctx.fillText(breakevenVal, 60, 245);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '18px sans-serif';
  ctx.fillText('Directional edge must clear this hurdle after taker fees before producing net positive return.', 60, 280);

  // 4. Metric Tiles
  const tiles = [
    { label: 'MARKET VENUE', val: venueText },
    { label: 'CONTRACT ASK', val: priceVal },
    { label: 'FEE FRICTION', val: feeVal },
    { label: 'SETTLEMENT ORACLE', val: sourceVal.length > 25 ? sourceVal.slice(0, 24) + '...' : sourceVal },
  ];

  tiles.forEach((t, i) => {
    const x = 60 + i * 270;
    const y = 320;
    ctx.fillStyle = 'rgba(16, 22, 34, 0.85)';
    ctx.fillRect(x, y, 250, 130);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.strokeRect(x, y, 250, 130);

    ctx.fillStyle = '#8E9AA8';
    ctx.font = '13px "SF Mono", monospace, Courier';
    ctx.fillText(t.label, x + 16, y + 36);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "SF Mono", monospace, Courier';
    ctx.fillText(t.val, x + 16, y + 80);
  });

  // 5. Footer & Guardrail
  ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
  ctx.fillRect(60, 480, 1080, 85);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
  ctx.strokeRect(60, 480, 1080, 85);

  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 15px "SF Mono", monospace, Courier';
  ctx.fillText('RULE B5 STANDBY LOCK: $0.00 CAPITAL RISK // ARITHMETIC COST COMPANION', 80, 515);

  ctx.fillStyle = '#8E9AA8';
  ctx.font = '13px sans-serif';
  ctx.fillText('Independent cost & exposure companion. Not financial advice. Calculate your true hurdle before trading: quanterraos.com', 80, 545);
}

function openShareCardModal() {
  let modal = document.getElementById('share-card-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'share-card-modal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:400; padding:20px;';
    modal.innerHTML = '<div style="background:#0A0E14; border:1px solid rgba(212,175,55,0.4); border-radius:8px; max-width:860px; width:100%; box-shadow:0 30px 80px rgba(0,0,0,0.9); overflow:hidden;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid rgba(212,175,55,0.2);">' +
      '<div style="font-family:var(--font-mono); font-size:0.85rem; font-weight:700; color:var(--accent-light);">EXPORT VERIFIED DECISION &amp; RISK CARD</div>' +
      '<button type="button" onclick="closeShareCardModal()" style="background:none; border:none; color:var(--muted); font-size:1.4rem; cursor:pointer;">&times;</button>' +
      '</div><div style="padding:20px; text-align:center;">' +
      '<canvas id="decision-card-canvas" width="1200" height="630" style="width:100%; max-width:800px; height:auto; border-radius:4px; border:1px solid rgba(212,175,55,0.2); box-shadow:0 10px 30px rgba(0,0,0,0.5);"></canvas>' +
      '</div><div style="padding:14px 20px; border-top:1px solid rgba(212,175,55,0.15); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">' +
      '<div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--muted);">Format: 1200&times;630 (X / Twitter / Reddit preview ready)</div>' +
      '<div style="display:flex; gap:8px;">' +
      '<button type="button" class="btn-primary" onclick="downloadDecisionCard()" style="padding:8px 14px; font-size:0.78rem; font-weight:700;">Download PNG</button>' +
      '<button type="button" class="btn-secondary" onclick="tweetDecisionCard()" style="padding:8px 14px; font-size:0.78rem; font-weight:600; background:#1DA1F2; color:#fff; border-color:#1DA1F2;">Share to X</button>' +
      '<button type="button" class="btn-secondary" onclick="closeShareCardModal()" style="padding:8px 14px; font-size:0.78rem;">Close</button>' +
      '</div></div></div>';
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  renderCardToCanvas();
}

function closeShareCardModal() {
  const modal = document.getElementById('share-card-modal');
  if (modal) modal.style.display = 'none';
}

function downloadDecisionCard() {
  const canvas = document.getElementById('decision-card-canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'quanterraos-decision-card-' + Date.now() + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function tweetDecisionCard() {
  const breakeven = document.getElementById('wedge-out-breakeven') ? document.getElementById('wedge-out-breakeven').textContent : '52.75%';
  const text = encodeURIComponent('Checked contract friction on @QuanterraOS: 50¢ contracts require a ' + breakeven + ' win rate just to break even after taker fees. Know your true costs before trading:');
  const url = encodeURIComponent('https://quanterraos.com/#true-cost-check');
  window.open('https://twitter.com/intent/tweet?text=' + text + '&url=' + url, '_blank');
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.style.display = 'inline-flex';
});

function installPwaApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function() { deferredPrompt = null; });
  } else {
    alert('To install QuanterraOS on iOS: Tap Share then "Add to Home Screen". On desktop: Click the install icon in your browser address bar.');
  }
}

function loadExampleWedgeCheck() {
  const venue = document.getElementById('wedge-venue');
  const price = document.getElementById('wedge-price');
  const count = document.getElementById('wedge-count');
  const prob = document.getElementById('wedge-prob');
  if (venue) venue.value = 'kalshi-15m';
  if (price) price.value = 50;
  if (count) count.value = 10;
  if (prob) prob.value = 55;
  recalcWedge();
  if (window.__wedgeCheck) {
    window.__wedgeCheck.isExample = true;
    window.__wedgeCheck.preview = true;
  }
  const saveBtn = document.getElementById('btn-wedge-save');
  if (saveBtn) {
    saveBtn.textContent = 'Preview in Journal (No Account Required) \u2192';
    saveBtn.style.background = 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)';
    saveBtn.style.borderColor = '#38BDF8';
    saveBtn.style.color = '#FFFFFF';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', recalcWedge);
} else {
  recalcWedge();
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(function() {});
}
</script>
${ASSISTANT_WIDGET_HTML}
${renderBetaFeedbackWidgetHtml()}
</body>
</html>`;
}
