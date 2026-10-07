/**
 * QuanterraOS Personal Review & Outcome Analysis Screen (/review, /journal/review)
 *
 * Implements the second phase of the decision accountability loop:
 * - Shows recorded net results, total fees, and paper versus actual outcomes separately.
 * - Displays "Not enough information yet" until records support a useful analysis.
 * - Labels incomplete actual trade data clearly.
 * - Complies with Rule B4 (no superlatives) and Rule B5 ($0 live capital claims, paper separation).
 */

import type { UserRecord, UserTier } from "./auth.ts";
import { renderBetaFeedbackWidgetHtml } from "./feedback-widget.ts";

export interface ReviewEntry {
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
  breakevenWinProb: number;
  assessedWinProb: number;
  netExpectedValue: number;
  decisionAction?: string;
  notes?: string | null;
  reasoning?: string | null;
  outcome?: string | null;
  realizedPnl?: number | null;
  actualQuantity?: number | null;
  actualFillPrice?: number | null;
  actualFees?: number | null;
  exitProceeds?: number | null;
  outcomeStatus?: string | null;
  outcomeNotes?: string | null;
  isExample?: boolean | number;
  createdAt: string;
}

export function renderReviewPageHtml(
  user: UserRecord | null,
  tier: UserTier,
  entries: ReviewEntry[]
): string {
  // Exclude example preview entries from personal review metrics
  const cleanEntries = entries.filter(e => !e.isExample);

  // Separate decisions into Skipped, Paper trade, and Actual trade
  const skippedEntries = cleanEntries.filter(e => (e.decisionAction || "").toLowerCase() === "skipped");
  const paperEntries = cleanEntries.filter(e => !e.decisionAction || e.decisionAction.toLowerCase() === "paper_trade");
  const actualEntries = cleanEntries.filter(e => (e.decisionAction || "").toLowerCase() === "actual_trade");

  // Determine completeness of actual trades
  const isActualComplete = (e: ReviewEntry): boolean => {
    return (
      e.actualQuantity !== null &&
      e.actualQuantity !== undefined &&
      e.actualFillPrice !== null &&
      e.actualFillPrice !== undefined &&
      e.actualFees !== null &&
      e.actualFees !== undefined &&
      e.exitProceeds !== null &&
      e.exitProceeds !== undefined &&
      e.realizedPnl !== null &&
      e.realizedPnl !== undefined
    );
  };

  const completeActualTrades = actualEntries.filter(isActualComplete);
  const incompleteActualTrades = actualEntries.filter(e => !isActualComplete(e));

  // Settled paper trades
  const settledPaperTrades = paperEntries.filter(e => e.outcome === "WON" || e.outcome === "LOST" || e.outcome === "VOID");

  // Has enough information condition: requires at least 1 settled outcome (complete actual trade or settled paper trade)
  const hasEnoughInformation = completeActualTrades.length > 0 || settledPaperTrades.length > 0;

  // Actual trade metrics
  const actualNetPnl = completeActualTrades.reduce((acc, e) => acc + (e.realizedPnl || 0), 0);
  const actualTotalFees = completeActualTrades.reduce((acc, e) => acc + (e.actualFees || 0), 0);
  const actualTotalOutlay = completeActualTrades.reduce((acc, e) => acc + ((e.actualQuantity || 1) * (e.actualFillPrice || 0)), 0);
  const actualWonCount = completeActualTrades.filter(e => e.outcome === "WON").length;
  const actualLostCount = completeActualTrades.filter(e => e.outcome === "LOST").length;
  const actualWinRate = completeActualTrades.length > 0 ? ((actualWonCount / completeActualTrades.length) * 100).toFixed(1) : "—";

  // Paper trade metrics (hypothetical)
  const paperRealizedPnl = settledPaperTrades.reduce((acc, e) => acc + (e.realizedPnl || 0), 0);
  const paperModeledFees = paperEntries.reduce((acc, e) => acc + (e.exchangeFee || 0), 0);
  const paperWonCount = settledPaperTrades.filter(e => e.outcome === "WON").length;
  const paperWinRate = settledPaperTrades.length > 0 ? ((paperWonCount / settledPaperTrades.length) * 100).toFixed(1) : "—";

  // Skipped metrics
  const skippedCount = skippedEntries.length;
  const skippedFrictionAvoided = skippedEntries.reduce((acc, e) => acc + (e.purchaseCost || 0) + (e.exchangeFee || 0), 0);
  const skippedFeesAvoided = skippedEntries.reduce((acc, e) => acc + (e.exchangeFee || 0), 0);

  // Overall fee friction
  const combinedTotalFees = actualTotalFees + (settledPaperTrades.length > 0 ? paperModeledFees : 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <title>Personal Outcome Review &amp; Fee Drag Audit — QuanterraOS</title>
  <meta name="description" content="Audit your recorded trading results, actual vs. paper performance, and total fee friction.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0E121B;
      --card-border: rgba(212, 175, 55, 0.22);
      --card-border-subtle: rgba(255, 255, 255, 0.08);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --text: #E2E8F0;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --green: #10B981;
      --rose: #F43F5E;
      --cyan: #38BDF8;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
    }

    .mono { font-family: var(--font-mono); }

    /* Nav */
    nav {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(6, 7, 10, 0.95);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
    }
    .nav-links {
      display: flex;
      gap: 18px;
      align-items: center;
      font-size: 0.85rem;
    }
    .nav-links a {
      color: var(--text-dim);
      text-decoration: none;
      transition: color 0.2s;
    }
    .nav-links a:hover, .nav-links a.active { color: #FFFFFF; }
    .nav-links a.active { color: var(--accent); font-weight: 700; }

    .container {
      max-width: 1100px;
      margin: 32px auto 60px;
      padding: 0 20px;
      width: 100%;
    }

    .header-block {
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
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }
    .lead {
      color: var(--text-dim);
      font-size: 0.88rem;
      max-width: 720px;
      margin-top: 6px;
    }

    /* KPI Summary Row */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }
    .kpi-card {
      background: var(--card);
      border: 1px solid var(--card-border-subtle);
      border-radius: 8px;
      padding: 20px;
    }
    .kpi-label {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--muted);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .kpi-val {
      font-family: var(--font-mono);
      font-size: 1.6rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .kpi-sub {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 4px;
    }

    /* Comparison Section: Paper vs Actual */
    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    @media (max-width: 820px) {
      .split-grid { grid-template-columns: 1fr; }
    }

    .track-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 24px;
    }
    .track-badge {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .badge-actual {
      background: rgba(223, 184, 67, 0.15);
      border: 1px solid var(--accent);
      color: var(--accent);
    }
    .badge-paper {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid var(--cyan);
      color: var(--cyan);
    }
    .badge-skipped {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--green);
      color: var(--green);
    }
    .badge-incomplete {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid var(--rose);
      color: var(--rose);
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.85rem;
    }
    .metric-row:last-child { border-bottom: none; }
    .metric-key { color: var(--text-dim); }
    .metric-val { font-family: var(--font-mono); font-weight: 600; color: #FFFFFF; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 12px; }
    th {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--muted);
      text-transform: uppercase;
      padding: 8px 10px;
      border-bottom: 1px solid var(--card-border-subtle);
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
    }

    /* Empty state */
    .empty-card {
      background: var(--card);
      border: 1px dashed rgba(212, 175, 55, 0.35);
      border-radius: 8px;
      padding: 48px 24px;
      text-align: center;
      margin-bottom: 30px;
    }
    .empty-icon { font-size: 2.2rem; margin-bottom: 12px; }
    .empty-title { font-size: 1.25rem; font-weight: 700; color: #FFFFFF; margin-bottom: 8px; }
    .empty-desc { color: var(--text-dim); font-size: 0.88rem; max-width: 540px; margin: 0 auto 20px; line-height: 1.5; }
    .btn-gold {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      color: #07080B;
      font-weight: 700;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      padding: 10px 18px;
      border-radius: 4px;
      text-decoration: none;
      border: 1px solid #DFB843;
    }
  </style>
</head>
<body>
  <nav>
    <a href="/" class="brand"><span class="brand-dot"></span> quanterraos</a>
    <div class="nav-links">
      <a href="/calculator">Check</a>
      <a href="/journal">Journal</a>
      <a href="/review" class="active">Review</a>
      <a href="/learn">Learn</a>
      <a href="/access">Sign in</a>
    </div>
  </nav>

  <main class="container">
    <div class="header-block">
      <div class="eyebrow">
        <span>●</span> Personal Decision Review &amp; Performance Audit
      </div>
      <h1>Post-Trade Outcome &amp; Cost Review</h1>
      <p class="lead">
        Reconcile your recorded trading outcomes, evaluate actual fees against modeling,
        and observe your paper vs. actual trade discipline separately.
      </p>
    </div>

    ${!hasEnoughInformation ? `
      <!-- Priority Requirement: Empty / Insufficient Data State -->
      <div class="empty-card">
        <div class="empty-icon">📊</div>
        <div class="empty-title">Not enough information yet</div>
        <p class="empty-desc">
          Your personal review requires at least one completed outcome record (an actual trade with recorded fill and exit proceeds, or a settled paper trade) to generate a statistically useful analysis.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <a href="/calculator" class="btn-gold">Run Pre-Trade Check &rarr;</a>
          <a href="/journal" class="btn-gold" style="background:rgba(56,189,248,0.15); color:var(--cyan); border-color:var(--cyan);">
            Open Journal &amp; Record Outcomes &rarr;
          </a>
        </div>
      </div>
    ` : `
      <!-- KPI Summary Row -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Actual Realized Net P&amp;L</div>
          <div class="kpi-val" style="color: ${actualNetPnl >= 0 ? 'var(--green)' : 'var(--rose)'};">
            ${actualNetPnl >= 0 ? '+' : ''}$${actualNetPnl.toFixed(2)}
          </div>
          <div class="kpi-sub">${completeActualTrades.length} complete trade(s) after fees</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Total Fees Recorded</div>
          <div class="kpi-val" style="color: var(--accent);">
            $${combinedTotalFees.toFixed(2)}
          </div>
          <div class="kpi-sub">$${actualTotalFees.toFixed(2)} actual paid · $${paperModeledFees.toFixed(2)} paper</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Capital Preserved (Skipped)</div>
          <div class="kpi-val" style="color: var(--green);">
            $${skippedFrictionAvoided.toFixed(2)}
          </div>
          <div class="kpi-sub">${skippedCount} bad setups avoided · $${skippedFeesAvoided.toFixed(2)} fees saved</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Trade Discipline Split</div>
          <div class="kpi-val" style="font-size:1.3rem;">
            ${actualEntries.length}A · ${paperEntries.length}P · ${skippedCount}S
          </div>
          <div class="kpi-sub">Actual vs. Paper vs. Skipped decisions</div>
        </div>
      </div>

      <!-- Comparison: Actual vs Paper Trade Outcomes -->
      <div class="section-title">
        <span>⚔️</span> Paper versus Actual Outcomes
      </div>

      <div class="split-grid">
        <!-- Actual Trades Card -->
        <div class="track-card">
          <span class="track-badge badge-actual">Actual Trades (Live Capital)</span>
          <div class="metric-row">
            <span class="metric-key">Completed Trades:</span>
            <span class="metric-val">${completeActualTrades.length}</span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Incomplete Trades:</span>
            <span class="metric-val" style="color:${incompleteActualTrades.length > 0 ? 'var(--rose)' : 'var(--muted)'};">
              ${incompleteActualTrades.length > 0 ? `${incompleteActualTrades.length} (Action Required)` : '0'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Actual Win Rate:</span>
            <span class="metric-val" style="color:var(--accent);">${actualWinRate}${actualWinRate !== '—' ? '%' : ''}</span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Total Executed Outlay:</span>
            <span class="metric-val">$${actualTotalOutlay.toFixed(2)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Total Exchange Taker Fees:</span>
            <span class="metric-val" style="color:var(--rose);">-$${actualTotalFees.toFixed(2)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Net Realized P&amp;L:</span>
            <span class="metric-val" style="color:${actualNetPnl >= 0 ? 'var(--green)' : 'var(--rose)'};">
              ${actualNetPnl >= 0 ? '+' : ''}$${actualNetPnl.toFixed(2)}
            </span>
          </div>
        </div>

        <!-- Paper Trades Card -->
        <div class="track-card">
          <span class="track-badge badge-paper">Paper Trades ($0 Live Capital)</span>
          <div class="metric-row">
            <span class="metric-key">Total Paper Positions:</span>
            <span class="metric-val">${paperEntries.length}</span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Settled Outcomes:</span>
            <span class="metric-val">${settledPaperTrades.length}</span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Hypothetical Win Rate:</span>
            <span class="metric-val" style="color:var(--cyan);">${paperWinRate}${paperWinRate !== '—' ? '%' : ''}</span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Modeled Fee Friction:</span>
            <span class="metric-val" style="color:var(--muted);">-$${paperModeledFees.toFixed(2)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Hypothetical Net P&amp;L:</span>
            <span class="metric-val" style="color:${paperRealizedPnl >= 0 ? 'var(--green)' : 'var(--rose)'};">
              ${paperRealizedPnl >= 0 ? '+' : ''}$${paperRealizedPnl.toFixed(2)}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-key">Live Risk Incurred:</span>
            <span class="metric-val" style="color:var(--green); font-weight:700;">$0.00 (Rule B5)</span>
          </div>
        </div>
      </div>

      <!-- Actual Trades Breakdown Table -->
      <div style="background:var(--card); border:1px solid var(--card-border); border-radius:8px; padding:20px; margin-bottom:30px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:0.95rem; font-weight:700; color:#FFFFFF;">Actual Trade Audit Trail</h3>
          <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--muted);">
            ${actualEntries.length} total actual trades recorded
          </span>
        </div>

        ${actualEntries.length === 0 ? `
          <div style="padding:20px; text-align:center; color:var(--muted); font-size:0.85rem;">
            No actual live trades recorded. Marking a check "Actual trade" in your Journal will populate this audit trail.
          </div>
        ` : `
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Contract</th>
                  <th>Qty</th>
                  <th>Fill Price</th>
                  <th>Fees Paid</th>
                  <th>Proceeds</th>
                  <th>Net P&amp;L</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${actualEntries.map(e => {
                  const complete = isActualComplete(e);
                  return `
                    <tr>
                      <td class="mono" style="color:var(--muted); font-size:0.75rem;">${(e.createdAt || '').slice(0, 10)}</td>
                      <td class="mono" style="color:var(--accent); font-weight:700;">${e.contractTicker}</td>
                      <td class="mono">${e.actualQuantity ?? e.contractCount ?? '—'}</td>
                      <td class="mono">${e.actualFillPrice !== null && e.actualFillPrice !== undefined ? `$${e.actualFillPrice.toFixed(2)}` : '—'}</td>
                      <td class="mono" style="color:var(--rose);">${e.actualFees !== null && e.actualFees !== undefined ? `-$${e.actualFees.toFixed(2)}` : '—'}</td>
                      <td class="mono">${e.exitProceeds !== null && e.exitProceeds !== undefined ? `$${e.exitProceeds.toFixed(2)}` : '—'}</td>
                      <td class="mono" style="font-weight:700; color:${(e.realizedPnl || 0) >= 0 ? 'var(--green)' : 'var(--rose)'};">
                        ${e.realizedPnl !== null && e.realizedPnl !== undefined ? `${e.realizedPnl >= 0 ? '+' : ''}$${e.realizedPnl.toFixed(2)}` : '—'}
                      </td>
                      <td>
                        ${complete ? `
                          <span class="track-badge badge-actual" style="margin-bottom:0; font-size:0.65rem;">COMPLETE</span>
                        ` : `
                          <span class="track-badge badge-incomplete" style="margin-bottom:0; font-size:0.65rem;" title="Missing fill price, fees, or settlement proceeds">
                            INCOMPLETE
                          </span>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `}
  </main>

  ${renderBetaFeedbackWidgetHtml()}
</body>
</html>`;
}
