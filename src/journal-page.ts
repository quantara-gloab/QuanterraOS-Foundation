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
        <div class="kpi-sub">Saved pre-trade checks</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Avg Breakeven Hurdle</div>
        <div class="kpi-val" style="color:var(--accent);">${avgBreakeven}%</div>
        <div class="kpi-sub">Required directional hit rate</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Cumulative Taker Fees</div>
        <div class="kpi-val" style="color:var(--rose);">$${totalFeesTracked.toFixed(2)}</div>
        <div class="kpi-sub">Calculated exchange drag</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Rule B5 Exposure</div>
        <div class="kpi-val" style="color:var(--green);">$0.00</div>
        <div class="kpi-sub">Standby safe simulation</div>
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
                <th>Purchase Cost</th>
                <th>Taker Fee</th>
                <th>Breakeven Hurdle</th>
                <th>Assessed p</th>
                <th>Status</th>
                <th>Oracle Benchmark</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr>
                  <td class="mono" style="color:var(--text-dim);">${e.createdAt ? e.createdAt.slice(0, 16).replace('T', ' ') : '—'}</td>
                  <td><strong style="color:#FFFFFF;">${e.contractTicker}</strong> <span style="font-size:0.75rem; color:var(--muted);">(${e.venue})</span></td>
                  <td class="mono">${e.pricingBasis === 'mid_price' ? 'Mid' : 'Ask'} · <span style="color:${e.side === 'yes' ? 'var(--green)' : 'var(--rose)'};">${e.side.toUpperCase()}</span></td>
                  <td class="mono">$${(e.purchaseCost || 0).toFixed(2)} <span style="font-size:0.72rem; color:var(--muted);">(${e.contractCount}x @ ${(e.contractPrice * 100).toFixed(0)}¢)</span></td>
                  <td class="mono" style="color:var(--rose);">+$${(e.exchangeFee || 0).toFixed(2)}</td>
                  <td class="mono" style="color:var(--accent); font-weight:700;">${(e.breakevenWinProb || 0).toFixed(2)}%</td>
                  <td class="mono">${(e.assessedWinProb || 0).toFixed(1)}%</td>
                  <td>
                    <span class="badge-status ${e.outcome === 'WON' ? 'badge-won' : e.outcome === 'LOST' ? 'badge-lost' : 'badge-pending'}">
                      ${e.outcome || e.status || 'SAVED_CHECK'}
                    </span>
                  </td>
                  <td style="font-size:0.75rem; color:var(--muted);">${e.settlementSource || 'CME CF BRTI'}</td>
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
  </main>

  <script>
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
