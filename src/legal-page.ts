/**
 * QuanterraOS Legal Disclaimers & Terms Page (/legal)
 * 
 * Spec: HANDOFF.md Section I, Rule B5, Rule B10
 * Architectural blueprint aesthetic:
 * 4-color palette (#0A0E14, #0E131A, #4FD1C5, #C65D4A), Inter + IBM Plex Mono.
 */
export function renderLegalPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legal Notice, Terms & Disclaimers — QuanterraOS</title>
  <meta name="description" content="Legal disclaimers, trademark attributions, not-investment-advice statement, and non-affiliation notice for QuanterraOS.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
      --warning: #C65D4A;
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
      min-height: 100vh;
      line-height: 1.6;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }
    
    /* Top Live Telemetry Ticker Strip */
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
    }
    .nav-links a:hover, .nav-links a.active { color: #FFFFFF; }
    .nav-links a.active { border-bottom: 2px solid var(--accent); padding-bottom: 3px; }
    .btn-outline {
      border: 1px solid rgba(79, 209, 197, 0.4);
      color: #FFFFFF;
      padding: 8px 18px;
      border-radius: 6px;
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
      transform: translateY(-1px);
    }

    .container { max-width: 900px; margin: 0 auto; padding: 48px 32px 0; }

    /* Header Eyebrow */
    .blueprint-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent);
      background: rgba(79, 209, 197, 0.08);
      border: 1px solid rgba(79, 209, 197, 0.2);
      padding: 4px 10px;
      border-radius: 2px;
      margin-bottom: 16px;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--text);
      margin-bottom: 12px;
      line-height: 1.2;
    }
    p.lead {
      color: var(--muted);
      font-size: 0.98rem;
      max-width: 820px;
      margin-bottom: 36px;
      line-height: 1.6;
    }

    .callout {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-left: 3px solid var(--accent);
      border-radius: 6px;
      padding: 24px 28px;
      margin: 24px 0 36px;
      font-size: 0.94rem;
      color: var(--text);
      line-height: 1.65;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
    }
    .callout strong { color: var(--accent); }

    section { margin-bottom: 36px; }
    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text);
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--panel-border);
    }
    p { margin-bottom: 14px; color: var(--muted); font-size: 0.92rem; line-height: 1.65; }

    footer {
      border-top: 1px solid var(--panel-border);
      padding-top: 24px;
      margin-top: 48px;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.6;
      font-family: var(--font-mono);
    }

    @media (max-width: 820px) {
      .top-nav { padding: 16px 20px; flex-direction: column; align-items: flex-start; gap: 12px; }
      .container { padding: 32px 20px 0; }
      h1 { font-size: 1.8rem; }
    }
  </style>
</head>
<body>
  <!-- Top Live Telemetry Ticker Strip -->
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>LIVE QUANTITATIVE CORE TELEMETRY</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SECTION: LEGAL & COMPLIANCE</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">AUDIT HORIZON: 1,316 SETTLED MARKETS</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SAFETY GATE: RULE B5 LOCKED ($0.00 CAPITAL)</span>
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
        <a href="/calibration">Calibration Proof</a>
        <a href="/council">Council Terminal</a>
        <a href="/index">Composite Index</a>
        <a href="/spread">Spread Monitor</a>
        <a href="/status">System Status</a>
        <a href="/methodology">Methodology</a>
        <a href="/research">Research</a>
        <a href="/legal" class="active">Legal &amp; Terms</a>
      </div>
    </div>
    <div class="nav-right">
      <a href="/council" class="btn-outline">Launch Terminal →</a>
    </div>
  </nav>

  <main class="container">
    <div class="blueprint-eyebrow">
      <span class="pulse-dot"></span>
      <span>Governance &amp; Regulatory Compliance · Comprehensive Disclosures</span>
    </div>

    <h1>Legal Notice, Terms &amp; Regulatory Disclaimers</h1>
    <p class="lead">
      Review these regulatory notices, CFTC Rule 4.41 disclosures, intellectual property attributions, non-custodial declarations, and non-affiliation disclaimers.
    </p>

    <div class="callout">
      <strong>NOT INVESTMENT ADVICE:</strong> QuanterraOS is an independent software research and statistical measurement platform operated by Quantara Global LLC. Nothing on this website, in our API responses, terminal workspaces, or research publications constitutes financial, investment, legal, tax, or trading advice.
    </div>

    <section>
      <h2>1. Regulatory Status &amp; Non-Registration Disclosure</h2>
      <p>
        Quantara Global LLC and QuanterraOS are not registered as broker-dealers, investment advisers, or transfer agents with the U.S. Securities and Exchange Commission (SEC), FINRA, or any state securities regulatory authority. Furthermore, Quantara Global LLC is not registered as a Commodity Trading Advisor (CTA), Commodity Pool Operator (CPO), Introducing Broker (IB), or Futures Commission Merchant (FCM) with the Commodity Futures Trading Commission (CFTC) or the National Futures Association (NFA).
      </p>
      <p>
        QuanterraOS does not provide personalized investment recommendations, does not assess the suitability of any financial instrument for any user, and does not solicit orders for prediction market contracts, derivatives, digital assets, or securities.
      </p>
    </section>

    <section>
      <h2>2. CFTC Rule 4.41 — Hypothetical &amp; Simulated Performance Disclaimer</h2>
      <p style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.6; background: rgba(0,0,0,0.3); padding: 18px; border-radius: 4px; border: 1px solid var(--panel-border);">
        HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS HAVE CERTAIN INHERENT LIMITATIONS. UNLIKE AN ACTUAL PERFORMANCE RECORD, SIMULATED RESULTS DO NOT REPRESENT ACTUAL TRADING. ALSO, SINCE THE TRADES HAVE NOT ACTUALLY BEEN EXECUTED, THE RESULTS MAY HAVE UNDER- OR OVER-COMPENSATED FOR THE IMPACT, IF ANY, OF CERTAIN MARKET FACTORS, SUCH AS LACK OF LIQUIDITY. SIMULATED TRADING PROGRAMS IN GENERAL ARE ALSO SUBJECT TO THE FACT THAT THEY ARE DESIGNED WITH THE BENEFIT OF HINDSIGHT. NO REPRESENTATION IS BEING MADE THAT ANY ACCOUNT WILL OR IS LIKELY TO ACHIEVE PROFITS OR LOSSES SIMILAR TO THOSE SHOWN.
      </p>
    </section>

    <section>
      <h2>3. Third-Party Trademarks &amp; Non-Affiliation Policy (Rule B10)</h2>
      <p>
        "Kalshi" is a registered trademark of Kalshi Inc. "CME", "CME Group", and "CF Benchmarks" are registered trademarks of CME Group Index Services LLC and CF Benchmarks Ltd. "Coinbase" is a registered trademark of Coinbase Global, Inc. "Kraken" is a registered trademark of Payward, Inc. "Bitstamp" is a registered trademark of Bitstamp Ltd. "Gemini" is a registered trademark of Gemini Trust Company, LLC. "Polymarket" is a registered trademark of Blockratize, Inc.
      </p>
      <p>
        QuanterraOS is an independent measurement system created and operated by Quantara Global LLC. QuanterraOS is not affiliated with, sponsored by, endorsed by, or partnered with Kalshi, CME Group, CF Benchmarks, Coinbase, Kraken, Bitstamp, Gemini, Polymarket, or any other market operator or index provider. Any reference to these entities or their trademarks is solely for nominative fair-use identification of market data sources, contract specifications, and settlement benchmarks.
      </p>
    </section>

    <section>
      <h2>4. Benchmark &amp; Settlement Index Designation (docs/settlement.md)</h2>
      <p>
        Kalshi's KXBTC15M contract series settles against the official CME CF Bitcoin Real-Time Index (BRTI). QuanterraOS computes an independent spot composite ("Quanterra BTC Composite") across Tier 1 US-accessible spot exchanges (Coinbase, Kraken, Bitstamp, Gemini) as an empirical approximation of spot conditions. QuanterraOS does not represent its composite index as the official BRTI or CME benchmark.
      </p>
    </section>

    <section>
      <h2>5. Zero Live Capital Deployed &amp; Non-Custodial Architecture (Rule B5)</h2>
      <p>
        QuanterraOS does not hold custody of, accept deposits for, transfer, or manage fiat currency, digital assets, prediction market contracts, or collateral on behalf of users. In accordance with internal safety Rule B5, zero live capital is deployed ($0.00 exposure) and live order execution paths are permanently disabled. QuanterraOS does not provide trade execution or order transmission services.
      </p>
    </section>

    <section>
      <h2>6. Market Data Integrity &amp; Latency Disclaimers</h2>
      <p>
        All market prices, order book snapshots, trade logs, and composite index metrics are captured via public exchange APIs and websockets. Network transit latency, queue buffering, exchange API throttling, and unexpected exchange downtime can introduce variance in price timestamps. All metrics and reports are provided strictly "as is" and "as available" without warranty of continuous uptime or sub-millisecond precision.
      </p>
    </section>

    <section>
      <h2>7. Terms of Service &amp; Permitted Use</h2>
      <p>
        Access to QuanterraOS, its dashboard terminals, and API endpoints is granted solely for research, analytical, and informational purposes. Users may not attempt to reverse engineer, decompile, disrupt the integrity of the data pipeline, or circumvent rate limits. This service is governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
      </p>
    </section>

    <section>
      <h2>8. Privacy Policy &amp; Data Security</h2>
      <p>
        Quantara Global LLC collects only essential telemetry required for session authentication (via Clerk), API rate limiting, and server diagnostic security. We do not sell, rent, or monetize personal user data or trading logs to third parties. All communication is encrypted via TLS 1.3.
      </p>
    </section>

    <footer>
      <p>
        &copy; 2026 Quantara Global LLC. All rights reserved. QuanterraOS is an independent measurement system. Rule B5 strictly enforced: zero live capital deployed ($0.00).
      </p>
    </footer>
  </main>
</body>
</html>`;
}
