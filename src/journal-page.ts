/**
 * QuanterraOS Personal Decision & Outcome Journal (/journal)
 *
 * Implements the consumer retention and accountability loop:
 * check -> register -> save -> journal
 *
 * Mobile-first, responsive design tailored for iPhone (iOS Safari & PWA) and desktop.
 * Adheres strictly to:
 * - Rule B4: Honest empirical tracking, zero banned superlatives.
 * - Rule B5: $0.00 live exposure, paper tracking and decision accountability.
 */

import type { UserRecord, UserTier } from "./auth.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export interface DecisionJournalEntry {
  id: string;
  userId: string;
  venue: string;
  contractTicker: string;
  contractType: string;
  side: string;
  pricingBasis: string;
  contractPrice: number;
  contractCount: number;
  purchaseCost: number;
  exchangeFee: number;
  halfSpreadDrag: number;
  totalDrag: number;
  breakevenWinProb: number;
  assessedWinProb: number;
  netExpectedValue: number;
  settlementSource: string;
  notes?: string | null;
  status: string;
  outcome?: string | null;
  realizedPnl?: number | null;
  createdAt: string;
}

export function renderJournalPageHtml(
  user: UserRecord | null,
  tier: UserTier,
  entries: DecisionJournalEntry[],
  error?: string,
  success?: string
): string {
  const isAuth = user !== null;
  const count = entries.length;
  const totalFeesTracked = entries.reduce((acc, e) => acc + (e.exchangeFee || 0), 0);
  const avgBreakeven = count > 0 ? (entries.reduce((acc, e) => acc + e.breakevenWinProb, 0) / count).toFixed(2) : "52.75";

  // Calculate settlement & outcome metrics
  const settledEntries = entries.filter(e => e.outcome === 'WON' || e.outcome === 'LOST' || e.outcome === 'VOID');
  const scoredEntries = entries.filter(e => e.outcome === 'WON' || e.outcome === 'LOST');
  const settledCount = settledEntries.length;
  const totalRealizedPnl = entries.reduce((acc, e) => acc + (e.realizedPnl || 0), 0);
  
  // Personal Brier Score
  let personalBrierStr = "—";
  if (scoredEntries.length > 0) {
    const sumSqErr = scoredEntries.reduce((acc, e) => {
      const p = (e.assessedWinProb || 50) / 100;
      const actual = e.outcome === 'WON' ? 1 : 0;
      return acc + Math.pow(p - actual, 2);
    }, 0);
    personalBrierStr = (sumSqErr / scoredEntries.length).toFixed(4);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Personal Decision &amp; Outcome Journal — QuanterraOS</title>
  <meta name="description" content="Personal decision journal tracking true costs, fee friction, and outcome accountability in prediction markets.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
  <link rel="manifest" href="/manifest.json">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-highlight: #111624;
      --border: rgba(212, 175, 55, 0.18);
      --border-subtle: rgba(212, 175, 55, 0.08);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --gold-bullion: #D4AF37;
      --green: #10B981;
      --rose: #F43F5E;
      --cyan: #00F2FE;
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 40% at 50% -10%, rgba(223, 184, 67, 0.12), transparent 70%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.5;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 90px;
    }
    .mono { font-family: var(--font-mono); }

    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 24px;
      background: rgba(6, 7, 10, 0.92);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(20px);
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
      font-size: 0.95rem;
    }
    .nav-brand span { color: var(--accent); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 400; }
    .brand-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
    .nav-links { display: flex; gap: 18px; align-items: center; }
    .nav-links a { color: var(--text-dim); text-decoration: none; font-size: 0.82rem; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    
    .btn-gold {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.76rem;
      font-weight: 700;
      color: #07080B;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      padding: 7px 14px;
      border-radius: 4px;
      border: 1px solid rgba(255, 248, 220, 0.6);
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
      cursor: pointer;
    }

    .container {
      max-width: 1080px;
      margin: 32px auto 0;
      padding: 0 20px;
    }

    .header-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 28px;
    }
    .eyebrow {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    h1 {
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #FFFFFF;
    }
    .lead {
      color: var(--text-dim);
      font-size: 0.88rem;
      max-width: 620px;
      margin-top: 6px;
      line-height: 1.5;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
    }
    .kpi-label {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-dim);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .kpi-val {
      font-family: var(--font-mono);
      font-size: 1.45rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .kpi-sub {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 4px;
    }

    .journal-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .journal-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .journal-card-title {
      font-size: 1rem;
      font-weight: 700;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Mobile-responsive table & cards */
    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      text-align: left;
    }
    th {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
      color: var(--text-dim);
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
      color: var(--text);
    }
    tr:hover td {
      background: rgba(223, 184, 67, 0.02);
    }

    .badge-status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-pending { background: rgba(223, 184, 67, 0.15); color: var(--accent); border: 1px solid rgba(223, 184, 67, 0.3); }
    .badge-won { background: rgba(16, 185, 129, 0.15); color: var(--green); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-lost { background: rgba(244, 63, 94, 0.15); color: var(--rose); border: 1px solid rgba(244, 63, 94, 0.3); }
    .badge-void { background: rgba(255, 255, 255, 0.1); color: var(--text-dim); border: 1px solid rgba(255, 255, 255, 0.2); }

    .btn-settle {
      background: rgba(223, 184, 67, 0.1);
      border: 1px solid rgba(223, 184, 67, 0.4);
      color: #DFB843;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-settle:hover {
      background: rgba(223, 184, 67, 0.25);
      color: #FFFFFF;
    }

    /* Modal Overlay & Card */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 2000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      background: #0C0F17;
      border: 1px solid var(--border);
      border-radius: 8px;
      max-width: 480px;
      width: 100%;
      padding: 24px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.8);
    }
    .btn-outcome {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .banner-onboarding {
      background: linear-gradient(135deg, rgba(223, 184, 67, 0.12) 0%, rgba(12, 15, 23, 0.9) 100%);
      border: 1px solid rgba(223, 184, 67, 0.35);
      border-radius: 8px;
      padding: 18px 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 0.82rem;
      margin-bottom: 20px;
      font-family: var(--font-mono);
    }
    .alert-success { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #6EE7B7; }
    .alert-error { background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); color: #FCA5A5; }

    .btn-card-export {
      background: rgba(223, 184, 67, 0.12);
      border: 1px solid rgba(223, 184, 67, 0.35);
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-card-export:hover {
      background: rgba(223, 184, 67, 0.25);
      color: #FFFFFF;
    }

    @media print {
      body { background: #FFFFFF !important; color: #000000 !important; }
      .top-nav, .header-block, .kpi-grid, .banner-onboarding, .journal-card-header, table, .btn-gold, .btn-settle, .btn-card-export { display: none !important; }
      #evidence-card-modal { position: static !important; background: transparent !important; display: block !important; padding: 0 !important; }
      #evidence-card-modal > div { border: 2px solid #000 !important; background: #FFF !important; color: #000 !important; box-shadow: none !important; max-width: 100% !important; }
      #evidence-card-modal * { color: #000 !important; }
    }

    @media (max-width: 640px) {
      .header-block { flex-direction: column; }
      .nav-links a:not(.active) { display: none; }
      h1 { font-size: 1.45rem; }
      .top-nav { padding: 12px 16px; }
      .container { padding: 0 14px; }
    }
  </style>
</head>
<body>

  <nav class="top-nav">
    <a href="/" class="nav-brand">
      <span class="brand-dot"></span>
      QUANTERRAOS
      <span>/ JOURNAL</span>
    </a>
    <div class="nav-links">
      <a href="/calculator">Calculator</a>
      <a href="/compare" style="color:#38BDF8; font-weight:600;">Compare Venues</a>
      <a href="/journal" class="active" style="color:var(--accent); font-weight:600;">Journal</a>
      <a href="/dashboard">Terminal</a>
      <a href="/account">Account</a>
    </div>
    <div>
      <a href="/calculator" class="btn-gold">+ New Check</a>
    </div>
  </nav>

  <main class="container">
    ${error ? `<div class="alert alert-error">${error}</div>` : ""}
    ${success ? `<div class="alert alert-success">${success}</div>` : ""}

    <div id="pending-save-banner" style="display:none;" class="banner-onboarding">
      <div>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent); font-weight:700; margin-bottom:3px;">
          ⚡ PENDING TRUE-COST CHECK FOUND
        </div>
        <div style="font-size:0.84rem; color:#FFFFFF;" id="pending-banner-desc">
          Saving your calculated check into your personal journal...
        </div>
      </div>
      <button type="button" id="btn-commit-pending" onclick="commitPendingCheck()" class="btn-gold">
        Commit to Journal &rarr;
      </button>
    </div>

    <div class="header-block">
      <div>
        <div class="eyebrow"><span style="width:6px; height:6px; border-radius:50%; background:var(--accent); display:inline-block;"></span> Personal Decision &amp; Outcome Journal</div>
        <h1>Decision Accountability Loop</h1>
        <p class="lead">
          Record your pre-trade cost checks, freeze your assessed probabilities, and track your realized outcomes against fee-adjusted breakeven hurdles.
        </p>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <a href="/api/export/journal.csv" class="btn-gold" style="background:rgba(255,255,255,0.06); color:var(--text); border-color:var(--border);">
          ↓ Export Journal CSV
        </a>
        <a href="/calculator" class="btn-gold">
          + Run True-Cost Check
        </a>
      </div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Tracked Decisions</div>
        <div class="kpi-val" id="kpi-total-checks">${count}</div>
        <div class="kpi-sub">${settledCount} settled · ${count - settledCount} pending</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Personal Brier Score</div>
        <div class="kpi-val" style="color:var(--accent);">${personalBrierStr}</div>
        <div class="kpi-sub">Market benchmark: 0.2001</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Realized Net P&amp;L</div>
        <div class="kpi-val" style="color:${totalRealizedPnl >= 0 ? 'var(--green)' : 'var(--rose)'};">
          ${totalRealizedPnl >= 0 ? '+' : ''}$${totalRealizedPnl.toFixed(2)}
        </div>
        <div class="kpi-sub">Net after all fees &amp; costs</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Cumulative Taker Fees</div>
        <div class="kpi-val" style="color:var(--rose);">$${totalFeesTracked.toFixed(2)}</div>
        <div class="kpi-sub">Rule B5 $0.00 Live Risk</div>
      </div>
    </div>

    <!-- Journal Entries Table -->
    <div class="journal-card">
      <div class="journal-card-header">
        <div class="journal-card-title">
          <span>Personal Decision Ledger</span>
          <span class="mono" style="font-size:0.75rem; color:var(--muted); font-weight:400;">(${count} entries)</span>
        </div>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-dim);">
          Sorted: Most Recent First
        </div>
      </div>

      ${count === 0 ? `
        <div style="text-align:center; padding:48px 20px;">
          <div style="font-size:2rem; margin-bottom:12px;">📓</div>
          <div style="font-weight:700; font-size:1.05rem; margin-bottom:6px; color:#FFFFFF;">Your Decision Journal is Ready</div>
          <p style="font-size:0.85rem; color:var(--muted); max-width:440px; margin:0 auto 20px;">
            Run a True-Cost check on any Kalshi or Polymarket contract to verify your fees and save your first decision card.
          </p>
          <a href="/calculator" class="btn-gold" style="padding:10px 20px; font-size:0.85rem;">
            Run First True-Cost Check &rarr;
          </a>
        </div>
      ` : `
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date (UTC)</th>
                <th>Contract</th>
                <th>Basis / Side</th>
                <th>Cost &amp; Fee</th>
                <th>Breakeven Hurdle</th>
                <th>Assessed p</th>
                <th>Realized P&amp;L</th>
                <th>Outcome / Action</th>
                <th>Notes / Benchmark</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr>
                  <td class="mono" style="color:var(--text-dim);">${e.createdAt ? e.createdAt.slice(0, 16).replace('T', ' ') : '—'}</td>
                  <td><strong style="color:#FFFFFF;">${e.contractTicker}</strong> <span style="font-size:0.75rem; color:var(--muted);">(${e.venue})</span></td>
                  <td class="mono">${e.pricingBasis === 'mid_price' ? 'Mid' : 'Ask'} · <span style="color:${e.side === 'yes' ? 'var(--green)' : 'var(--rose)'};">${e.side.toUpperCase()}</span></td>
                  <td class="mono">
                    $${(e.purchaseCost || 0).toFixed(2)}
                    <span style="font-size:0.72rem; color:var(--rose);"> (+$${(e.exchangeFee || 0).toFixed(2)} fee)</span>
                  </td>
                  <td class="mono" style="color:var(--accent); font-weight:700;">${(e.breakevenWinProb || 0).toFixed(2)}%</td>
                  <td class="mono">${(e.assessedWinProb || 0).toFixed(1)}%</td>
                  <td class="mono">
                    ${e.realizedPnl !== null && e.realizedPnl !== undefined ? `
                      <span style="font-weight:700; color:${e.realizedPnl >= 0 ? 'var(--green)' : 'var(--rose)'};">
                        ${e.realizedPnl >= 0 ? '+' : ''}$${e.realizedPnl.toFixed(2)}
                      </span>
                    ` : `<span style="color:var(--muted);">Pending</span>`}
                  </td>
                  <td>
                    <div style="display:flex; gap:6px; align-items:center;">
                      ${e.outcome ? `
                        <span class="badge-status ${e.outcome === 'WON' ? 'badge-won' : e.outcome === 'LOST' ? 'badge-lost' : 'badge-void'}">
                          ${e.outcome}
                        </span>
                      ` : `
                        <button type="button" class="btn-settle" onclick="openSettleModal('${e.id}', '${e.contractTicker}', ${e.contractCount || 10}, ${e.contractPrice || 0.51}, ${e.exchangeFee || 0.18})">
                          Log Outcome &rarr;
                        </button>
                      `}
                      <button type="button" class="btn-card-export" onclick="showEvidenceCard('${e.id}', '${e.contractTicker}', '${e.venue}', '${e.side}', '${e.pricingBasis}', ${e.contractPrice || 0.51}, ${e.contractCount || 10}, ${e.purchaseCost || 5.10}, ${e.exchangeFee || 0.18}, ${e.breakevenWinProb || 52.8}, ${e.assessedWinProb || 55.0}, ${e.netExpectedValue || 0.22}, '${(e.settlementSource || 'CME CF BRTI 60s TWAP').replace(/'/g, "\\'")}', '${e.createdAt ? e.createdAt.slice(0, 16).replace('T', ' ') : ''}')" title="View &amp; Print Evidence Card">
                        🖨 Card
                      </button>
                    </div>
                  </td>
                  <td style="font-size:0.75rem; color:var(--muted);">
                    ${e.notes ? `<div style="color:var(--text); margin-bottom:2px; font-weight:500;">${e.notes}</div>` : ''}
                    <div>${e.settlementSource || 'CME CF BRTI'}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Decision Guidance Section -->
    <div style="background:rgba(12,15,23,0.5); border:1px solid var(--border-subtle); border-radius:8px; padding:18px 20px; font-size:0.78rem; color:var(--muted); line-height:1.6;">
      <strong style="color:var(--text);">How to Use Your Decision Journal:</strong>
      <ol style="margin-left:18px; margin-top:6px;">
        <li><strong>Run Pre-Trade Checks:</strong> Calculate fee and spread drag on the <a href="/calculator" style="color:var(--accent);">True-Cost Calculator</a> before risking any capital.</li>
        <li><strong>Commit Freeze:</strong> Save the check to lock in your assessed probability ($p$) and required hurdle before market settlement.</li>
        <li><strong>Reconcile Actual Charges:</strong> Compare your realized monthly exchange statements against modeled fee drag to verify rounding impact.</li>
      </ol>
    </div>

    <!-- Settlement Logging Modal -->
    <div id="settle-modal" class="modal-overlay">
      <div class="modal-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-subtle); padding-bottom:10px;">
          <div style="font-weight:700; font-size:1.05rem; color:#FFFFFF;" id="modal-title">Log Market Settlement</div>
          <button type="button" onclick="closeSettleModal()" style="background:none; border:none; color:var(--muted); font-size:1.4rem; cursor:pointer;">&times;</button>
        </div>

        <div style="background:rgba(6,9,14,0.6); border:1px solid var(--border-subtle); border-radius:6px; padding:12px; margin-bottom:16px;">
          <div style="font-size:0.75rem; color:var(--muted); font-family:var(--font-mono);" id="modal-specs">10 contracts @ 51¢ · Fee: $0.18</div>
          <div style="font-size:0.82rem; color:var(--text); margin-top:4px;" id="modal-payout-preview">Win payout: +$4.72 · Loss: -$5.28</div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:0.8rem; color:var(--text-dim); display:block; margin-bottom:8px;">Settlement Outcome</label>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
            <button type="button" id="btn-outcome-won" class="btn-outcome" onclick="selectOutcome('WON')">
              WON (100¢)
            </button>
            <button type="button" id="btn-outcome-lost" class="btn-outcome" onclick="selectOutcome('LOST')">
              LOST (0¢)
            </button>
            <button type="button" id="btn-outcome-void" class="btn-outcome" onclick="selectOutcome('VOID')">
              VOID
            </button>
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <label style="font-size:0.8rem; color:var(--text-dim); display:block; margin-bottom:6px;">Post-Mortem &amp; Learning Note</label>
          <input type="text" id="input-modal-note" placeholder="e.g. Followed discipline, fee drag absorbed, BRTI target reached" style="width:100%; background:rgba(6,9,14,0.9); border:1px solid var(--border); color:#FFFFFF; padding:8px 12px; border-radius:4px; font-size:0.82rem; outline:none;">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" onclick="closeSettleModal()" class="btn-gold" style="background:rgba(255,255,255,0.06); color:var(--text); border-color:var(--border);">Cancel</button>
          <button type="button" onclick="submitSettlement()" class="btn-gold" id="btn-submit-settle">Commit Settlement &rarr;</button>
        </div>
      </div>
    </div>

    <!-- Evidence Card Modal -->
    <div id="evidence-card-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:300; align-items:center; justify-content:center; padding:16px;">
      <div style="background:#0C0F17; border:1px solid rgba(212,175,55,0.4); border-radius:8px; max-width:540px; width:100%; padding:28px; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid rgba(212,175,55,0.2); padding-bottom:12px;">
          <div>
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--accent); text-transform:uppercase; letter-spacing:0.08em;">QUANTERRAOS DECISION EVIDENCE CARD</div>
            <div style="font-size:1.25rem; font-weight:700; color:#FFFFFF;" id="card-modal-ticker">KXBTC15M YES</div>
          </div>
          <span id="card-modal-date" class="mono" style="font-size:0.75rem; color:var(--muted);">2026-10-06</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; font-size:0.82rem;">
          <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
            <div style="color:var(--muted); font-size:0.7rem; text-transform:uppercase;">Venue / Basis</div>
            <div id="card-modal-venue" class="mono" style="font-weight:600; color:#FFFFFF; margin-top:2px;">Kalshi (Ask)</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
            <div style="color:var(--muted); font-size:0.7rem; text-transform:uppercase;">Order Quantity</div>
            <div id="card-modal-count" class="mono" style="font-weight:600; color:var(--cyan); margin-top:2px;">10 contracts</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
            <div style="color:var(--muted); font-size:0.7rem; text-transform:uppercase;">Cost + Fee = Max Loss</div>
            <div id="card-modal-cost" class="mono" style="font-weight:600; color:var(--rose); margin-top:2px;">$5.10 + $0.18 = $5.28</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
            <div style="color:var(--muted); font-size:0.7rem; text-transform:uppercase;">Breakeven Hurdle</div>
            <div id="card-modal-breakeven" class="mono" style="font-weight:700; color:var(--accent); margin-top:2px;">52.80%</div>
          </div>
        </div>

        <div style="background:rgba(6,9,14,0.7); border:1px solid var(--border-subtle); border-radius:4px; padding:12px; margin-bottom:18px; font-size:0.78rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:var(--muted);">Assessed Probability:</span>
            <span id="card-modal-prob" class="mono" style="font-weight:600; color:#FFFFFF;">55.0%</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="color:var(--muted);">Net Expected Value (EV):</span>
            <span id="card-modal-ev" class="mono" style="font-weight:700; color:var(--green);">+$0.22</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--muted);">Settlement Benchmark:</span>
            <span id="card-modal-oracle" class="mono" style="font-size:0.72rem; color:var(--text-dim);">CME CF BRTI 60s TWAP</span>
          </div>
        </div>

        <div style="font-size:0.7rem; color:var(--muted); margin-bottom:20px; line-height:1.5; border-left:2px solid var(--accent); padding-left:10px;">
          <strong>Rule B5 &amp; B4 Safeguards:</strong> Independent pre-trade friction audit. All evaluations run under $0.00 capital risk. Calculation reflects arithmetic cost hurdle; does not forecast market direction or guarantee trading returns.
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span id="card-modal-id" class="mono" style="font-size:0.68rem; color:var(--muted);">ID: jrn_...</span>
          <div style="display:flex; gap:8px;">
            <button type="button" onclick="window.print()" class="btn-gold" style="font-size:0.75rem; padding:8px 14px;">🖨 Print / PDF</button>
            <button type="button" onclick="closeEvidenceCardModal()" class="btn-gold" style="background:rgba(255,255,255,0.06); color:var(--text); border-color:var(--border); font-size:0.75rem; padding:8px 14px;">Close</button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    let activeSettleId = null;
    let selectedOutcome = 'WON';

    function openSettleModal(id, ticker, count, price, fee) {
      activeSettleId = id;
      selectedOutcome = 'WON';
      document.getElementById('modal-title').textContent = 'Log Settlement: ' + ticker;
      document.getElementById('modal-specs').textContent = count + ' contracts @ ' + (price * 100).toFixed(0) + '¢ · Fee: $' + fee.toFixed(2);
      
      const cost = count * price;
      const winPnl = ((1.00 * count) - cost - fee).toFixed(2);
      const lossPnl = (-(cost + fee)).toFixed(2);
      document.getElementById('modal-payout-preview').innerHTML = 'Win net P&L: <strong style="color:var(--green);">+$' + winPnl + '</strong> · Loss net P&L: <strong style="color:var(--rose);">$' + lossPnl + '</strong>';

      selectOutcome('WON');
      document.getElementById('input-modal-note').value = '';
      document.getElementById('settle-modal').style.display = 'flex';
    }

    function closeSettleModal() {
      document.getElementById('settle-modal').style.display = 'none';
      activeSettleId = null;
    }

    function selectOutcome(outcome) {
      selectedOutcome = outcome;
      ['won', 'lost', 'void'].forEach(function(o) {
        const btn = document.getElementById('btn-outcome-' + o);
        if (o === outcome.toLowerCase()) {
          btn.style.background = o === 'won' ? 'rgba(16,185,129,0.2)' : o === 'lost' ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.15)';
          btn.style.borderColor = o === 'won' ? 'var(--green)' : o === 'lost' ? 'var(--rose)' : 'var(--text)';
          btn.style.color = '#FFFFFF';
        } else {
          btn.style.background = 'rgba(255,255,255,0.05)';
          btn.style.borderColor = 'var(--border)';
          btn.style.color = 'var(--text-dim)';
        }
      });
    }

    async function submitSettlement() {
      if (!activeSettleId) return;
      const notes = document.getElementById('input-modal-note').value;
      const btn = document.getElementById('btn-submit-settle');
      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/journal/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeSettleId,
            outcome: selectedOutcome,
            notes: notes
          })
        });
        if (res.ok) {
          window.location.reload();
        } else {
          alert('Error settling decision. Please try again.');
          btn.textContent = 'Commit Settlement →';
          btn.disabled = false;
        }
      } catch (err) {
        alert('Network error settling decision.');
        btn.textContent = 'Commit Settlement →';
        btn.disabled = false;
      }
    }

    // Check for pending check from True-Cost Calculator in localStorage
    window.addEventListener('DOMContentLoaded', function() {
      try {
        const raw = localStorage.getItem('quanterraos_pending_check');
        if (raw) {
          const item = JSON.parse(raw);
          const banner = document.getElementById('pending-save-banner');
          const desc = document.getElementById('pending-banner-desc');
          if (banner && desc) {
            desc.innerHTML = 'You checked <strong>' + (item.contractTicker || 'KXBTC15M') + '</strong> at ' + (item.price * 100).toFixed(0) + '¢. Breakeven Hurdle: <strong style="color:var(--accent);">' + (item.breakevenWinProb || 52.75) + '%</strong> (Fee: +$' + (item.exchangeFee || 0.18) + ').';
            banner.style.display = 'flex';
          }
        }
      } catch (_) {}

      // Log journal viewed event
      fetch('/api/analytics/journal-viewed', { method: 'POST' }).catch(function() {});
    });

    function showEvidenceCard(id, ticker, venue, side, basis, price, count, cost, fee, breakeven, prob, ev, oracle, date) {
      document.getElementById('card-modal-ticker').textContent = ticker + ' ' + (side ? side.toUpperCase() : 'YES');
      document.getElementById('card-modal-date').textContent = date || new Date().toISOString().slice(0, 10);
      document.getElementById('card-modal-venue').textContent = venue + ' (' + (basis === 'mid_price' ? 'Mid' : 'Ask') + ')';
      document.getElementById('card-modal-count').textContent = count + ' contracts';
      document.getElementById('card-modal-cost').textContent = '$' + Number(cost).toFixed(2) + ' + $' + Number(fee).toFixed(2) + ' = $' + (Number(cost) + Number(fee)).toFixed(2);
      document.getElementById('card-modal-breakeven').textContent = Number(breakeven).toFixed(2) + '%';
      document.getElementById('card-modal-prob').textContent = Number(prob).toFixed(1) + '%';
      document.getElementById('card-modal-ev').textContent = (ev >= 0 ? '+' : '') + '$' + Number(ev).toFixed(2);
      document.getElementById('card-modal-ev').style.color = ev >= 0 ? 'var(--green)' : 'var(--rose)';
      document.getElementById('card-modal-oracle').textContent = oracle || 'CME CF BRTI 60s TWAP';
      document.getElementById('card-modal-id').textContent = 'ID: ' + id;
      document.getElementById('evidence-card-modal').style.display = 'flex';
    }

    function closeEvidenceCardModal() {
      document.getElementById('evidence-card-modal').style.display = 'none';
    }

    async function commitPendingCheck() {
      try {
        const raw = localStorage.getItem('quanterraos_pending_check');
        if (!raw) return;
        const item = JSON.parse(raw);
        const res = await fetch('/api/journal/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (res.ok) {
          localStorage.removeItem('quanterraos_pending_check');
          window.location.reload();
        } else {
          alert('Could not save check to journal. Please log in or verify connection.');
        }
      } catch (err) {
        alert('Network error saving check.');
      }
    }
  </script>
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
