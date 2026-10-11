/**
 * QuanterraOS Polymarket Intelligence Terminal (/polymarket, /wallet)
 *
 * Dedicated institutional and consumer intelligence terminal for Polymarket
 * and on-chain prediction market participants:
 * 1. On-chain Polymarket Wallet Calibration Auditor (Brier scoring & Favorite-Chaser bias)
 * 2. UMA Optimistic Oracle Resolution & Dispute Risk Monitor
 * 3. Cross-Venue Net Price Arbitrage & Friction Comparator (Kalshi vs Polymarket)
 * 4. AI Fighter Pilots Council Guidance (Kraken basis, Draco depth, Sentinel lockout)
 *
 * Strict Compliance:
 * - Rule B4: Honest empirical calibration, zero banned superlatives.
 * - Rule B5: $0.00 capital deployed; zero order routing; decision companion only.
 * - CFTC Rule 4.41: Mandatory hypothetical and simulated performance disclosure.
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
  type PublicLayoutOptions,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { getCuratedBenchmarkWallets } from "./lib/wallet-cards.ts";

export interface PolymarketTerminalOptions extends PublicLayoutOptions {
  initialAddress?: string;
}

export function renderPolymarketTerminalHtml(options: PolymarketTerminalOptions = {}): string {
  const headerHtml = renderPublicHeader({ ...options, activePath: "/polymarket" });
  const footerHtml = renderPublicFooter();
  const benchmarks = getCuratedBenchmarkWallets();
  const initialAddr = options.initialAddress || "0x71c83497c385a8efb54a2221dc371e549d4fc70a";
  const benchmarkChipsHtml = benchmarks
    .map(
      (b) =>
        `<button type="button" class="chip-btn" onclick="selectBenchmark('${b.address}')">${b.callsign} (${b.grade})</button>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Polymarket Intelligence Terminal &amp; Wallet Calibration — QuanterraOS</title>
  <meta name="description" content="Audit Polymarket on-chain wallet calibration, analyze UMA dispute risk, and compare net executable prices vs Kalshi. Zero live capital exposure ($0.00).">
  <link rel="canonical" href="https://quanterraos.com/polymarket">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-border: rgba(0, 242, 254, 0.22);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --gold: #DFB843;
      --gold-glow: rgba(223, 184, 67, 0.25);
      --cyan: #00F2FE;
      --cyan-glow: rgba(0, 242, 254, 0.25);
      --emerald: #10B981;
      --crimson: #F43F5E;
      --muted: #8F95A0;
      --chalk: #F8FAFC;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--chalk);
      font-family: var(--public-font-sans);
      min-height: 100vh;
      line-height: 1.6;
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 242, 254, 0.12), transparent),
        radial-gradient(ellipse 60% 40% at 50% 120%, rgba(223, 184, 67, 0.08), transparent);
    }

    .container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 40px 20px 80px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(0, 242, 254, 0.1);
      border: 1px solid rgba(0, 242, 254, 0.35);
      color: var(--cyan);
      font-family: var(--public-font-mono);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      margin-bottom: 20px;
      text-transform: uppercase;
    }

    .hero-title {
      font-size: clamp(32px, 4.8vw, 54px);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 20px;
      background: linear-gradient(180deg, #FFFFFF 40%, #A0AEC0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: clamp(16px, 1.8vw, 19px);
      color: var(--muted);
      max-width: 780px;
      margin: 0 auto 36px;
      line-height: 1.6;
    }

    /* Terminal Panels */
    .terminal-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 32px;
      margin-bottom: 40px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px var(--cyan-glow);
      text-align: left;
    }

    .search-bar-wrap {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .search-input {
      flex: 1;
      min-width: 280px;
      background: rgba(6, 7, 10, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 0.92rem;
      font-family: var(--public-font-mono);
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 12px var(--cyan-glow);
    }

    .btn-cyan {
      background: var(--cyan);
      color: #000;
      border: none;
      padding: 14px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      font-family: var(--public-font-mono);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-cyan:hover {
      background: #38bdf8;
      box-shadow: 0 0 16px var(--cyan-glow);
    }

    /* Benchmark Chips */
    .chip-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .chip-label {
      font-size: 0.75rem;
      font-family: var(--public-font-mono);
      color: var(--muted);
      text-transform: uppercase;
    }

    .chip-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--chalk);
      font-family: var(--public-font-mono);
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .chip-btn:hover {
      background: rgba(0, 242, 254, 0.15);
      border-color: var(--cyan);
      color: var(--cyan);
    }

    /* Grid Layouts */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .feature-box {
      background: var(--card);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 24px;
      text-align: left;
    }

    .feature-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--chalk);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .feature-desc {
      color: var(--muted);
      font-size: 0.85rem;
      line-height: 1.6;
    }

    /* Stat Rows */
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
    }
    .stat-row span:first-child { color: var(--muted); }
    .stat-row span:last-child { color: var(--chalk); font-weight: 600; }
  </style>
</head>
<body>

${headerHtml}

<main class="container">
  <header style="text-align:center; margin-bottom: 36px;">
    <div class="hero-badge">
      <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--cyan);"></span>
      Polymarket Microstructure &amp; On-Chain Risk Engine
    </div>
    <h1 class="hero-title">
      Polymarket Intelligence Terminal.<br>
      Audited Calibration &amp; UMA Oracle Risk.
    </h1>
    <p class="hero-subtitle">
      Audit any Polymarket on-chain wallet address by probabilistic calibration (Brier score) rather than raw P&amp;L. Evaluate UMA optimistic oracle resolution delays, Polygon gas friction, and side-by-side net price spreads against Kalshi.
    </p>
  </header>

  <!-- Wallet Calibration Auditor -->
  <section class="terminal-card">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
      <h2 style="font-size:1.2rem; font-weight:700; color:#FFF; display:flex; align-items:center; gap:8px;">
        <span>🔍</span> Polymarket On-Chain Wallet Calibration Auditor
      </h2>
      <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--cyan);">
        Evaluates Brier Reliability vs Favorite-Chaser Bias
      </span>
    </div>

    <div class="search-bar-wrap">
      <input type="text" id="wallet-input" class="search-input" value="${initialAddr}" placeholder="Enter Polygon / Polymarket address (0x...)">
      <button type="button" class="btn-cyan" onclick="auditWallet()">Audit Wallet ⚡</button>
    </div>

    <div class="chip-bar">
      <span class="chip-label">Curated Benchmarks:</span>
      ${benchmarkChipsHtml}
    </div>

    <!-- Live Card Output Container -->
    <div id="wallet-card-output" style="margin-top:24px;">
      <div style="background:rgba(6,7,10,0.85); border:1px solid var(--border-subtle); border-radius:12px; padding:24px; text-align:center; color:var(--muted); font-family:var(--public-font-mono); font-size:0.85rem;">
        Click <strong>Audit Wallet</strong> or select a benchmark above to inspect calibration data.
      </div>
    </div>
  </section>

  <!-- 3 Pillars of Polymarket Microstructure -->
  <section class="feature-grid">
    <div class="feature-box">
      <h3 class="feature-title">
        <span style="color:var(--cyan);">⚖️</span> UMA Optimistic Oracle Risk
      </h3>
      <p class="feature-desc" style="margin-bottom:14px;">
        Unlike Kalshi which settles deterministically on CME CF BRTI 60s TWAP arithmetic, Polymarket utilizes UMA tokenholder voting. Ambiguous market wording creates resolution risk.
      </p>
      <div class="stat-row">
        <span>Standard Liveness Window</span>
        <span style="color:var(--gold);">2.0 Hours</span>
      </div>
      <div class="stat-row">
        <span>Dispute Probability</span>
        <span style="color:var(--crimson);">0.35% Historical</span>
      </div>
      <div class="stat-row">
        <span>Resolution Settlement</span>
        <span style="color:var(--cyan);">Polygon USDC</span>
      </div>
    </div>

    <div class="feature-box">
      <h3 class="feature-title">
        <span style="color:var(--emerald);">⚡</span> Cross-Venue Net Price Arbitrage
      </h3>
      <p class="feature-desc" style="margin-bottom:14px;">
        Polymarket charges 0% protocol taker fees on select order books, but participants face AMM slippage, Polygon gas, and bridge amortizations.
      </p>
      <div class="stat-row">
        <span>Typical Slippage &amp; Spread</span>
        <span>~0.50¢ / contract</span>
      </div>
      <div class="stat-row">
        <span>Gas &amp; Bridge Friction</span>
        <span style="color:var(--muted);">$0.15 / transaction</span>
      </div>
      <div class="stat-row">
        <span>Break-even vs Kalshi</span>
        <span style="color:var(--emerald);">&gt; 50 Contracts</span>
      </div>
    </div>

    <div class="feature-box">
      <h3 class="feature-title">
        <span style="color:var(--gold);">🎯</span> The Favorite-Chaser Paradox
      </h3>
      <p class="feature-desc" style="margin-bottom:14px;">
        Many Polymarket accounts show 80%+ raw win rates by betting on 85¢-95¢ heavy favorites. Our Brier audit reveals these accounts actually lose money post-friction.
      </p>
      <div class="stat-row">
        <span>Benchmark Coin-Flip Brier</span>
        <span>0.2500</span>
      </div>
      <div class="stat-row">
        <span>QuanterraOS Model Brier</span>
        <span style="color:var(--emerald);">0.2063 (Audited)</span>
      </div>
      <div class="stat-row">
        <span>Market Consensus Brier</span>
        <span style="color:var(--cyan);">0.2001</span>
      </div>
    </div>
  </section>

  <!-- Cross-Link to Cockpit & Transfer -->
  <section style="background:var(--card); border:1px solid var(--card-border); border-radius:18px; padding:36px; text-align:center;">
    <h2 style="font-size:1.6rem; font-weight:800; color:#FFF; margin-bottom:8px;">
      Evaluate Any Polymarket Trade in the Cockpit
    </h2>
    <p style="color:var(--muted); max-width:640px; margin:0 auto 20px; font-size:0.92rem;">
      Use the QuanterraOS AI Fighter Pilots Cockpit to verify L2 order-book depth, calculate cross-venue savings, and test trades in realistic paper mode.
    </p>
    <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
      <a href="/cockpit?venue=polymarket" class="btn-cyan" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
        🚀 Open Cockpit for Polymarket &rarr;
      </a>
      <a href="/transfer" style="background:rgba(223,184,67,0.1); border:1px solid var(--gold); color:var(--gold); padding:14px 24px; border-radius:8px; font-weight:700; font-size:0.95rem; font-family:var(--public-font-mono); text-decoration:none;">
        📊 Transfer Calculator
      </a>
      <a href="/mobile" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:14px 24px; border-radius:8px; font-weight:700; font-size:0.95rem; font-family:var(--public-font-mono); text-decoration:none;">
        📱 Install Mobile App
      </a>
    </div>

    <!-- CFTC 4.41 Compliance Footnote -->
    <div style="margin-top:32px; padding-top:16px; border-top:1px solid var(--border-subtle); font-size:11px; color:var(--muted); line-height:1.5; text-align:left;">
      <strong style="color:#CBD5E1;">CFTC RULE 4.41 HYPOTHETICAL DISCLAIMER:</strong> Simulated and paper performance results have certain inherent limitations. Unlike an actual performance record, simulated results do not represent actual trading. QuanterraOS enforces Rule B5 permanent circuit breakers: $0.00 live capital deployed, zero order routing. QuanterraOS is an independent analytics tool and is not affiliated with or endorsed by Polymarket, UMA Protocol, or the Polygon Foundation.
    </div>
  </section>
</main>

${ASSISTANT_WIDGET_HTML}
${footerHtml}

<script>
  function selectBenchmark(addr) {
    document.getElementById("wallet-input").value = addr;
    auditWallet();
  }

  async function auditWallet() {
    const input = document.getElementById("wallet-input").value.trim();
    const out = document.getElementById("wallet-card-output");
    if (!input) return;

    out.innerHTML = '<div style="text-align:center; padding:24px; color:var(--cyan); font-family:var(--public-font-mono);">Auditing on-chain calibration ledger...</div>';

    try {
      const res = await fetch("/api/deck/sensors/wallets/" + encodeURIComponent(input));
      const data = await res.json();

      if (data.html) {
        out.innerHTML = data.html;
      } else if (data.card) {
        renderCardSimple(data.card);
      } else {
        out.innerHTML = '<div style="color:var(--crimson); text-align:center; padding:20px;">Address format invalid or no positions found.</div>';
      }
    } catch (e) {
      console.error("Wallet audit failed", e);
      out.innerHTML = '<div style="color:var(--crimson); text-align:center; padding:20px;">Unable to fetch calibration data. Try another benchmark address.</div>';
    }
  }

  function renderCardSimple(card) {
    const out = document.getElementById("wallet-card-output");
    const brierColor = card.brierScore <= 0.20 ? "var(--emerald)" : "var(--gold)";
    out.innerHTML =
      '<div style="background:rgba(6,7,10,0.85); border:1px solid rgba(0,242,254,0.3); border-radius:12px; padding:24px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<div>' +
            '<div style="font-size:1.1rem; font-weight:700; color:#FFF;">' + card.callsign + '</div>' +
            '<div style="font-family:var(--public-font-mono); font-size:0.78rem; color:var(--cyan);">' + card.truncatedAddress + '</div>' +
          '</div>' +
          '<span style="font-family:var(--public-font-mono); font-size:0.75rem; padding:4px 10px; border-radius:4px; background:rgba(0,242,254,0.15); color:var(--cyan); font-weight:700;">' +
            card.gradeLabel +
          '</span>' +
        '</div>' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:16px;">' +
          '<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:8px;">' +
            '<div style="font-size:10px; color:var(--muted); font-family:var(--public-font-mono);">BRIER SCORE</div>' +
            '<div style="font-size:20px; font-weight:800; color:' + brierColor + '; font-family:var(--public-font-mono);">' + card.brierScore.toFixed(4) + '</div>' +
          '</div>' +
          '<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:8px;">' +
            '<div style="font-size:10px; color:var(--muted); font-family:var(--public-font-mono);">RAW WIN RATE</div>' +
            '<div style="font-size:20px; font-weight:800; color:#FFF; font-family:var(--public-font-mono);">' + card.rawWinRatePct.toFixed(1) + '%</div>' +
          '</div>' +
          '<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:8px;">' +
            '<div style="font-size:10px; color:var(--muted); font-family:var(--public-font-mono);">TOTAL POSITIONS</div>' +
            '<div style="font-size:20px; font-weight:800; color:#FFF; font-family:var(--public-font-mono);">' + card.totalPositions + '</div>' +
          '</div>' +
          '<div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:8px;">' +
            '<div style="font-size:10px; color:var(--muted); font-family:var(--public-font-mono);">TOTAL FEES PAID</div>' +
            '<div style="font-size:20px; font-weight:800; color:var(--crimson); font-family:var(--public-font-mono);">$' + card.totalFeesPaidDollars.toFixed(2) + '</div>' +
          '</div>' +
        '</div>' +
        '<p style="font-size:0.82rem; color:var(--muted); line-height:1.5;">' + card.calibrationInterpretation + '</p>' +
      '</div>';
  }

  // Auto-run on load
  window.addEventListener("DOMContentLoaded", () => {
    auditWallet();
  });
</script>

</body>
</html>
`;
}
