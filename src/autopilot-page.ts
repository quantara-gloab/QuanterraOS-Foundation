/**
 * Autopilot Page: Autonomous Paper-Trading Console (Rule B5 Enforced)
 *
 * Implements Phase 2 of prediction-ledger spec:
 * - Autopilot workspace view: "Autopilot — Paper Trading"
 * - Displays simulated cumulative P&L next to the market baseline's simulated P&L.
 * - Every row and header explicitly tagged capital: $0.00, mode: PAPER.
 * - Driven strictly by the paper_trades ledger.
 * - Zero live execution path; hardcoded to PAPER mode under Rule B5.
 */
import { getAutopilotLedger, type AutopilotSummary } from "./autopilot-engine.ts";

export function renderAutopilotPage(options?: { tier?: string }): string {
  const tier = options?.tier ?? "free";
  const summary = getAutopilotLedger(100, tier as any);


  const rowsHtml = summary.trades.length === 0
    ? `<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--muted); font-family: 'IBM Plex Mono', monospace;">No automated paper orders evaluated yet. The debounced council pipeline will write simulated decisions here.</td></tr>`
    : summary.trades.map((t) => {
        let decisionBadge = "";
        if (t.decision === "buy") {
          const sideColor = t.side === "yes" ? "badge-side-yes" : "badge-side-no";
          decisionBadge = `<span class="${sideColor}">BUY ${t.side?.toUpperCase()}</span>`;
        } else {
          decisionBadge = `<span class="badge-side-skip">SKIP</span>`;
        }

        let pnlDisplay = "—";
        if (t.pnl !== null) {
          const isPos = t.pnl > 0;
          const pnlClass = isPos ? "pnl-pos" : t.pnl < 0 ? "pnl-neg" : "pnl-zero";
          pnlDisplay = `<span class="${pnlClass}">${isPos ? "+" : ""}$${t.pnl.toFixed(2)}</span>`;
        }

        const modelProbPct = (t.modelProbability * 100).toFixed(1);
        const entryStr = t.entryPrice !== null ? `$${t.entryPrice.toFixed(2)}` : "—";
        const feeStr = t.decision === "buy" ? `$${(t.feeEstimate * 100).toFixed(2)}` : "$0.00";
        const timeFormatted = t.timestamp.replace("T", " ").replace("Z", "").slice(0, 19);

        return `
          <tr>
            <td class="mono-cell">${timeFormatted}</td>
            <td class="mono-cell font-bold">${escapeHtml(t.marketId)}</td>
            <td><span class="paper-badge">PAPER · $0.00</span></td>
            <td>${decisionBadge}</td>
            <td class="mono-cell highlight-cell">${modelProbPct}%</td>
            <td class="mono-cell muted-cell">${entryStr}</td>
            <td class="mono-cell muted-cell">${feeStr}</td>
            <td class="mono-cell">${pnlDisplay}</td>
          </tr>
        `;
      }).join("\n");

  const cumPnlClass = summary.cumulativePnl >= 0 ? "accent" : "warning";
  const cumBaseClass = summary.cumulativeBaselinePnl >= 0 ? "accent" : "warning";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Autopilot (Paper Trading)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06090E;
    --card: #0D131C;
    --card-header: #141B26;
    --border: #1C2636;
    --accent: #4FD1C5;
    --accent-subtle: rgba(79, 209, 197, 0.12);
    --warning: #C65D4A;
    --amber: #D97706;
    --text: #E8EAED;
    --muted: #8892B0;
    --mono: "IBM Plex Mono", monospace;
    --sans: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
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

  .header-banner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .header-title-block h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 6px; }
  .subtitle { font-family: var(--mono); font-size: 0.85rem; color: var(--muted); }

  .safety-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pill {
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .pill-paper {
    background: rgba(79, 209, 197, 0.1);
    color: var(--accent);
    border: 1px solid rgba(79, 209, 197, 0.3);
  }
  .pill-lock {
    background: rgba(198, 93, 74, 0.12);
    color: var(--warning);
    border: 1px solid rgba(198, 93, 74, 0.35);
  }

  .pnl-comparison-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }
  .pnl-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px;
    position: relative;
  }
  .pnl-card.primary {
    border-color: rgba(79, 209, 197, 0.4);
    background: linear-gradient(180deg, rgba(79, 209, 197, 0.03) 0%, var(--card) 100%);
  }
  .card-label {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .card-val {
    font-family: var(--mono);
    font-size: 1.8rem;
    font-weight: 700;
  }
  .card-val.accent { color: var(--accent); }
  .card-val.warning { color: var(--warning); }
  .card-subtext {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 8px;
  }

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

  .paper-badge {
    font-family: var(--mono);
    font-size: 0.68rem;
    color: var(--accent);
    background: var(--accent-subtle);
    border: 1px solid rgba(79, 209, 197, 0.25);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .badge-side-yes {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 700;
    color: #34D399;
    background: rgba(52, 211, 153, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.35);
    padding: 3px 8px;
    border-radius: 4px;
  }
  .badge-side-no {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 700;
    color: #F87171;
    background: rgba(248, 113, 113, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.35);
    padding: 3px 8px;
    border-radius: 4px;
  }
  .badge-side-skip {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    background: rgba(136, 146, 176, 0.1);
    border: 1px solid rgba(136, 146, 176, 0.25);
    padding: 3px 8px;
    border-radius: 4px;
  }

  .pnl-pos { color: #34D399; font-weight: 600; }
  .pnl-neg { color: #F87171; font-weight: 600; }
  .pnl-zero { color: var(--muted); }

  
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
      <span class="brand-sub">/ autopilot</span>
    </div>
    <div class="nav-links">
      <a href="/">home</a>
      <a href="/calibration">calibration</a>
      <a href="/council">council</a>
      <a href="/predictions">predictions</a>
      <a href="/autopilot" class="active">autopilot</a>
      <a href="/index">index</a>
      <a href="/spread">spread</a>
      <a href="/status">status</a>
    </div>
    <div class="nav-right">
      <span class="gate-badge-locked">Rule B5 locked · $0.00</span>
    </div>
  </nav>

  <main>
    <div class="header-banner">
      <div class="header-title-block">
        <h1>Autopilot — Paper Trading</h1>
        <p class="subtitle">Autonomous decision engine operating unattended under hardcoded Rule B5 zero-capital lock.</p>
      </div>
      <div class="safety-pills">
        <span class="pill pill-paper">Mode: Paper</span>
        <span class="pill pill-paper">Capital: $0.00</span>
        <span class="pill pill-lock">Rule B5 Circuit Lock</span>
        <span class="pill pill-lock">Zero Order Transmission</span>
      </div>
    </div>

    ${tier === "free" ? `
      <div class="tier-indicator-banner" style="margin-bottom: 20px; padding: 12px 18px; background: rgba(79, 209, 197, 0.05); border: 1px solid rgba(79, 209, 197, 0.25); border-radius: 6px; font-family: var(--mono); font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
        <span><strong>FREE EXPLORER:</strong> Showing daily paper P&amp;L snapshot</span>
        <a href="/pricing" style="color: var(--accent); font-weight: 600; text-decoration: none;">Upgrade to Pro for Continuous Live Autopilot Telemetry →</a>
      </div>
    ` : `
      <div class="tier-indicator-banner pro" style="margin-bottom: 20px; padding: 12px 18px; background: rgba(79, 209, 197, 0.1); border: 1px solid var(--accent); border-radius: 6px; font-family: var(--mono); font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
        <span><span style="color:var(--accent); font-weight:700;">● LIVE TELEMETRY STREAM</span> (${tier.toUpperCase()}) · Continuous paper trade updates</span>
        <a href="/api/export/autopilot.csv" style="color: var(--accent); font-weight: 600; text-decoration: underline;">Download Autopilot CSV ↓</a>
      </div>
    `}

    <div class="pnl-comparison-strip">
      <div class="pnl-card primary">
        <div class="card-label">Autopilot Simulated P&amp;L</div>
        <div class="card-val ${cumPnlClass}">${summary.cumulativePnl >= 0 ? "+" : ""}$${summary.cumulativePnl.toFixed(2)}</div>
        <div class="card-subtext">Cumulative across ${summary.resolvedCount} settled paper trades (100-contract size)</div>
      </div>
      <div class="pnl-card">
        <div class="card-label">Market Baseline Simulated P&amp;L</div>
        <div class="card-val ${cumBaseClass}">${summary.cumulativeBaselinePnl >= 0 ? "+" : ""}$${summary.cumulativeBaselinePnl.toFixed(2)}</div>
        <div class="card-subtext">Passive Kalshi market-mid consensus baseline</div>
      </div>
      <div class="pnl-card">
        <div class="card-label">Decisions &amp; Selectivity</div>
        <div class="card-val">${summary.totalDecisions}</div>
        <div class="card-subtext">${summary.buyCount} Buys · ${summary.skipCount} Skips (${summary.winRatePct !== null ? `${summary.winRatePct}% Win Rate` : "Awaiting resolutions"})</div>
      </div>
      <div class="pnl-card">
        <div class="card-label">Estimated Fee Friction</div>
        <div class="card-val warning">-$${summary.averageFeeDrag.toFixed(2)}</div>
        <div class="card-subtext">Avg fee drag per executed paper contract [0.07 * p * (1-p)]</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-card-header">
        <div class="table-title">Simulated Order Ledger (Unattended Execution)</div>
        <div class="table-badge">Rule B5 Hardcoded Paper Mode</div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Contract</th>
              <th>Mode / Capital</th>
              <th>Action</th>
              <th>Model Prob</th>
              <th>Entry Price</th>
              <th>Est. Fee Drag</th>
              <th>Simulated P&amp;L</th>
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
      QuanterraOS Autopilot Console · CFTC Rule 4.41 Simulated Performance Disclosure · Rule B5 locked: zero live capital deployed ($0.00).
    </div>
  </footer>

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
