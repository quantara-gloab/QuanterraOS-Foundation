/**
 * Prediction Log Page: Live Immutable Ledger & Historical Replay
 *
 * Implements Phase 1 of prediction-ledger spec:
 * - Live dashboard view ("Prediction Log") showing recent predictions with status badge:
 *     PENDING (market still open)
 *     SETTLED: correct-direction / Brier 0.0X
 * - Historical replay view seeded from the 1,316-market corpus, clearly labeled
 *   "Backtest replay (historical, not live)".
 * - Strictly pulls from the immutable ledger — no narrative, pure data.
 */
import { getPredictionsLedger, type PredictionRecord } from "./prediction-ledger.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderPredictionsPage(options?: { isReplay?: boolean; tier?: string }): string {
  const isReplay = Boolean(options?.isReplay);
  const tier = options?.tier ?? "free";
  const ledger = getPredictionsLedger({ isReplay, limit: 100, tier: tier as any });


  const rowsHtml = ledger.items.length === 0
    ? `<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--muted); font-family: 'IBM Plex Mono', monospace;">No predictions recorded in this ledger yet. Active council pipeline cycles will write here automatically.</td></tr>`
    : ledger.items.map((item) => {
        let statusBadge = "";
        if (item.status === "PENDING") {
          statusBadge = `<span class="badge-pending"><span class="pulse-dot"></span>PENDING</span>`;
        } else if (item.status === "SETTLED") {
          const isCorrect = (item.outcome === "YES" && item.predictedProb >= 0.5) ||
                            (item.outcome === "NO" && item.predictedProb < 0.5);
          const dirClass = isCorrect ? "badge-correct" : "badge-incorrect";
          const brierStr = item.brierScore !== null ? `Brier ${item.brierScore.toFixed(4)}` : "VOID";
          statusBadge = `<span class="${dirClass}">SETTLED: ${item.outcome ?? "N/A"} · ${brierStr}</span>`;
        }

        const probPct = (item.predictedProb * 100).toFixed(1);
        const timeFormatted = item.timestamp.replace("T", " ").replace("Z", "").slice(0, 19);

        return `
          <tr>
            <td class="mono-cell">${timeFormatted}</td>
            <td class="mono-cell font-bold">${escapeHtml(item.marketId)}</td>
            <td class="mono-cell highlight-cell">${probPct}%</td>
            <td>${statusBadge}</td>
            <td class="mono-cell muted-cell">${escapeHtml(item.modelVersion)}</td>
            <td class="mono-cell muted-cell">${escapeHtml(item.notes ?? (item.isReplay ? "Backtest replay" : "Live pipeline"))}</td>
          </tr>
        `;
      }).join("\n");

  const brierDisplay = ledger.averageBrierScore !== null ? ledger.averageBrierScore.toFixed(4) : "—";
  const accDisplay = ledger.directionalAccuracyPct !== null ? `${ledger.directionalAccuracyPct.toFixed(1)}%` : "—";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#06070A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="QuanterraOS">
<title>QuanterraOS — Prediction Log &amp; Replay</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06070A;
    --card: #0C0F17;
    --card-header: #111624;
    --border: rgba(212, 175, 55, 0.16);
    --accent: #DFB843;
    --accent-subtle: rgba(223, 184, 67, 0.14);
    --warning: #F43F5E;
    --amber: #D97706;
    --text: #F8FAFC;
    --muted: #94A3B8;
    --mono: "IBM Plex Mono", monospace;
    --sans: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse 90% 50% at 50% -10%, rgba(223, 184, 67, 0.09), transparent 70%), var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    padding-bottom: 60px;
  }
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px;
    background: rgba(10, 15, 22, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-left { display: flex; align-items: baseline; gap: 8px; }
  .brand-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.02em;
  }
  .brand-sub { font-family: var(--mono); font-size: 0.72rem; color: var(--accent); }
  .nav-links { display: flex; gap: 16px; flex-wrap: wrap; }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.82rem;
    transition: color 0.15s ease;
  }
  .nav-links a:hover, .nav-links a.active { color: var(--text); }
  .nav-links a.active { color: var(--accent); }
  .gate-badge-locked {
    font-family: var(--mono);
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--warning);
    background: rgba(198, 93, 74, 0.12);
    border: 1px solid rgba(198, 93, 74, 0.35);
    padding: 4px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  main {
    width: min(1200px, calc(100% - 40px));
    margin: 32px auto 0;
  }

  .header-section { margin-bottom: 24px; }
  .header-section h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 6px; }
  .subtitle { font-family: var(--mono); font-size: 0.85rem; color: var(--muted); }

  .view-toggle-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 16px;
    flex-wrap: wrap;
  }
  .toggle-tabs { display: flex; gap: 8px; }
  .toggle-tab {
    padding: 8px 16px;
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 0.8rem;
    text-decoration: none;
    color: var(--muted);
    background: var(--card);
    border: 1px solid var(--border);
    transition: all 0.15s ease;
  }
  .toggle-tab:hover { color: var(--text); border-color: var(--accent); }
  .toggle-tab.active {
    background: var(--accent-subtle);
    color: var(--accent);
    border-color: var(--accent);
    font-weight: 600;
  }

  .replay-banner {
    background: rgba(217, 119, 6, 0.1);
    border: 1px solid rgba(217, 119, 6, 0.35);
    color: #FBBF24;
    padding: 12px 18px;
    border-radius: 6px;
    margin-bottom: 24px;
    font-family: var(--mono);
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .metric-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }
  .metric-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 18px 20px;
  }
  .metric-label {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .metric-value {
    font-family: var(--mono);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
  }
  .metric-value.accent { color: var(--accent); }

  .table-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .table-card-header {
    background: var(--card-header);
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .table-title { font-size: 0.92rem; font-weight: 600; }
  .table-badge {
    font-family: var(--mono);
    font-size: 0.7rem;
    color: var(--accent);
    background: var(--accent-subtle);
    padding: 3px 8px;
    border-radius: 4px;
  }

  .table-wrapper { overflow-x: auto; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
  }
  th {
    background: #090E16;
    padding: 12px 18px;
    text-align: left;
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    text-transform: uppercase;
    border-bottom: 1px solid var(--border);
  }
  td {
    padding: 12px 18px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255, 255, 255, 0.02); }

  .mono-cell { font-family: var(--mono); }
  .font-bold { font-weight: 600; }
  .highlight-cell { color: var(--accent); font-weight: 600; }
  .muted-cell { color: var(--muted); font-size: 0.78rem; }

  .badge-pending {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 600;
    color: #38BDF8;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.35);
    padding: 3px 8px;
    border-radius: 4px;
  }
  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #38BDF8;
    box-shadow: 0 0 6px #38BDF8;
    animation: blink 1.5s infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .badge-correct {
    display: inline-flex;
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 600;
    color: #34D399;
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.3);
    padding: 3px 8px;
    border-radius: 4px;
  }
  .badge-incorrect {
    display: inline-flex;
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 600;
    color: #F87171;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    padding: 3px 8px;
    border-radius: 4px;
  }

  
  .cftc-disclosure-card {
    background: #090D14;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 18px 22px;
    margin-top: 28px;
    font-size: 0.76rem;
    line-height: 1.6;
    color: var(--muted);
  }
  .cftc-title {
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }
  .cftc-text {
    font-family: var(--mono);
    font-size: 0.72rem;
    line-height: 1.55;
  }

  footer {
    width: min(1200px, calc(100% - 40px));
    margin: 48px auto 0;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.6;
  }
  .footer-links { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
  .footer-links a { color: var(--accent); text-decoration: none; }
  .footer-links a:hover { text-decoration: underline; }
</style>
</head>
<body>

  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="brand-title">quanterraos</a>
      <span class="brand-sub">/ predictions</span>
    </div>
    <div class="nav-links">
      <a href="/">home</a>
      <a href="/calibration">calibration</a>
      <a href="/council">council</a>
      <a href="/predictions" class="active">predictions</a>
      <a href="/autopilot">autopilot</a>
      <a href="/index">index</a>
      <a href="/spread">spread</a>
      <a href="/status">status</a>
    </div>
    <div class="nav-right">
      <span class="gate-badge-locked">Rule B5 locked · $0.00</span>
    </div>
  </nav>

  <main>
    <div class="header-section">
      <h1>Audited Prediction Ledger</h1>
      <p class="subtitle">Immutable pre-settlement forecast records and post-settlement Brier scoring.</p>
    </div>

    <div class="view-toggle-bar">
      <div class="toggle-tabs">
        <a href="/predictions" class="toggle-tab ${!isReplay ? "active" : ""}">Live Prediction Ledger</a>
        <a href="/predictions?view=replay" class="toggle-tab ${isReplay ? "active" : ""}">Historical Replay (1,316 Markets)</a>
      </div>
      <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--muted);">
        Rule B5: Zero live capital deployed ($0.00) · Insert-only ledger
      </div>
    </div>

    ${isReplay ? `
      <div class="replay-banner">
        <span>⚠</span>
        <div>
          <strong>Backtest replay (historical, not live)</strong> — Seeded from the canonical 1,316-market backtest corpus. Kept strictly partitioned to prevent lookahead bias.
        </div>
      </div>
    ` : (tier === "free" ? `
      <div class="tier-indicator-banner" style="margin-bottom: 20px; padding: 12px 18px; background: rgba(223, 184, 67, 0.08); border: 1px solid rgba(223, 184, 67, 0.3); border-radius: 6px; font-family: var(--mono); font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center; box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.15);">
        <span><strong>FREE EXPLORER:</strong> Live feed delayed 20 min · 1,316-market replay is 100% full access</span>
        <a href="/pricing" style="color: var(--accent); font-weight: 600; text-decoration: none;">Upgrade to Pro for Real-Time &amp; CSV Export →</a>
      </div>
    ` : `
      <div class="tier-indicator-banner pro" style="margin-bottom: 20px; padding: 12px 18px; background: rgba(223, 184, 67, 0.14); border: 1px solid var(--accent); border-radius: 6px; font-family: var(--mono); font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center; box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25);">
        <span><span style="color:var(--accent); font-weight:700;">● REAL-TIME FEED ACTIVE</span> (${tier.toUpperCase()}) · Sub-second live updates</span>
        <a href="/api/export/predictions.csv" style="color: var(--accent); font-weight: 600; text-decoration: underline;">Download CSV Export ↓</a>
      </div>
    `)}


    <div class="metric-strip">
      <div class="metric-card">
        <div class="metric-label">Total Logged</div>
        <div class="metric-value">${ledger.total.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Pending Settlement</div>
        <div class="metric-value accent">${ledger.pending.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Settled Records</div>
        <div class="metric-value">${ledger.settled.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Average Brier Score</div>
        <div class="metric-value">${brierDisplay}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Directional Hit Rate</div>
        <div class="metric-value">${accDisplay}</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-card-header">
        <div class="table-title">${isReplay ? "Historical Backtest Replay Corpus" : "Live Immutable Prediction Ledger"}</div>
        <div class="table-badge">${isReplay ? "1,316 Canonical Corpus" : "Pre-Settlement Proof"}</div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Market ID</th>
              <th>Predicted Prob</th>
              <th>Settlement Status</th>
              <th>Model Version</th>
              <th>Audit Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  
    <div class="cftc-disclosure-card">
      <div class="cftc-title">CFTC Rule 4.41 Mandatory Regulatory Disclosure</div>
      <p class="cftc-text">
        HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS HAVE CERTAIN INHERENT LIMITATIONS. UNLIKE AN ACTUAL PERFORMANCE RECORD, SIMULATED RESULTS DO NOT REPRESENT ACTUAL TRADING. ALSO, SINCE THE TRADES HAVE NOT ACTUALLY BEEN EXECUTED, THE RESULTS MAY HAVE UNDER- OR OVER-COMPENSATED FOR THE IMPACT, IF ANY, OF CERTAIN MARKET FACTORS, SUCH AS LACK OF LIQUIDITY. SIMULATED TRADING PROGRAMS IN GENERAL ARE ALSO SUBJECT TO THE FACT THAT THEY ARE DESIGNED WITH THE BENEFIT OF HINDSIGHT. NO REPRESENTATION IS BEING MADE THAT ANY ACCOUNT WILL OR IS LIKELY TO ACHIEVE PROFITS OR LOSSES SIMILAR TO THOSE SHOWN.
      </p>
      <p style="margin-top: 8px; font-size: 0.74rem;">
        QuanterraOS operates under internal safety Rule B5: zero live capital is deployed ($0.00 exposure) and live order execution paths are permanently disabled. All orders and metrics on this console represent simulated paper executions for research and evaluation purposes only.
      </p>
    </div>

  </main>

  <footer>
    <div class="footer-links">
      <a href="/">home</a>
      <a href="/calibration">calibration</a>
      <a href="/council">council</a>
      <a href="/predictions">predictions</a>
      <a href="/autopilot">autopilot</a>
      <a href="/index">index</a>
      <a href="/spread">spread</a>
      <a href="/methodology">methodology</a>
      <a href="/research">research</a>
      <a href="/legal">legal</a>
      <a href="/status">status</a>
    </div>
    <div>
      QuanterraOS Prediction Ledger · Auditable empirical benchmarks · Rule B5 locked: zero live capital deployed ($0.00).
    </div>
  </footer>

${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
