/**
 * QuanterraOS Methodology Documentation Page (/methodology, /methodology/index)
 * 
 * Spec: HANDOFF.md Section E1-E4, F1, H2, Section I
 * Architectural blueprint aesthetic:
 * Gold Standard palette (#06070A, #0C0F17, #DFB843, #F43F5E), Inter + IBM Plex Mono.
 */
import { COMPOSITE_METHODOLOGY_VERSION } from "./composite-index.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderMethodologyPageHtml(subtopic?: "index"): string {
  const isIndexSubtopic = subtopic === "index";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>${isIndexSubtopic ? "Composite Index Methodology v0.1" : "Methodology & Mathematical Formulas"} — QuanterraOS</title>
  <meta name="description" content="Open, reproducible methodology and mathematical formulas for QuanterraOS calibration scoring, Brier decomposition, and spot composite index v0.1.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --panel: rgba(14, 18, 27, 0.85);
      --panel-border: rgba(212, 175, 55, 0.16);
      --panel-border-subtle: rgba(212, 175, 55, 0.08);
      --panel-border-highlight: rgba(223, 184, 67, 0.45);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --warning: #F43F5E;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 50% at 50% -20%, rgba(223, 184, 67, 0.1), transparent 70%),
        radial-gradient(ellipse 60% 40% at 85% 10%, rgba(163, 125, 36, 0.05), transparent 60%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
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
      background: linear-gradient(135deg, rgba(223, 184, 67, 0.25), rgba(6, 8, 14, 0.9));
      border: 1px solid rgba(223, 184, 67, 0.45);
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
      color: var(--accent-light);
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
      border: 1px solid rgba(223, 184, 67, 0.4);
      color: #FFFFFF;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-family: var(--font-mono);
      text-decoration: none;
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.14) 0%, rgba(163, 125, 36, 0.05) 100%);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.2), 0 0 15px rgba(223, 184, 67, 0.1);
    }
    .btn-outline:hover {
      border-color: var(--accent);
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.25) 0%, rgba(163, 125, 36, 0.1) 100%);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.35), 0 0 25px rgba(223, 184, 67, 0.25);
      color: #FFFFFF;
      transform: translateY(-1px);
    }

    .container { max-width: 960px; margin: 0 auto; padding: 48px 32px 0; }

    /* Header Eyebrow */
    .blueprint-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent-light);
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.15) 0%, rgba(163, 125, 36, 0.05) 100%);
      border: 1px solid rgba(223, 184, 67, 0.35);
      padding: 5px 12px;
      border-radius: 3px;
      margin-bottom: 16px;
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25);
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
    
    /* Table of Contents */
    .toc {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      padding: 20px 24px;
      margin-bottom: 40px;
    }
    .toc h3 {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 14px;
      letter-spacing: 0.1em;
      font-family: var(--font-mono);
    }
    .toc ul {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      font-size: 0.85rem;
      font-family: var(--font-mono);
    }
    .toc a {
      color: var(--accent);
      text-decoration: none;
      transition: color 0.15s;
    }
    .toc a:hover {
      text-decoration: underline;
    }

    section { margin-bottom: 48px; }
    h2 {
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text);
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--panel-border);
    }
    h3 {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 20px 0 8px;
      color: var(--text);
    }
    p { margin-bottom: 14px; color: var(--muted); font-size: 0.92rem; line-height: 1.65; }
    strong { color: var(--text); }
    code {
      font-family: var(--font-mono);
      font-size: 0.85em;
      background: rgba(232, 234, 237, 0.05);
      border: 1px solid var(--panel-border);
      padding: 2px 6px;
      border-radius: 2px;
      color: var(--accent);
    }
    
    /* Technical Formula Card */
    .formula-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-left: 2px solid var(--accent);
      border-radius: 6px;
      padding: 18px 22px;
      margin: 18px 0;
      font-family: var(--font-mono);
      font-size: 0.84rem;
      color: var(--text);
      line-height: 1.7;
      overflow-x: auto;
    }
    
    /* Table */
    .table-container {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      overflow: hidden;
      margin: 20px 0 28px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th {
      background: rgba(232, 234, 237, 0.02);
      padding: 12px 16px;
      text-align: left;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      border-bottom: 1px solid var(--panel-border);
      font-family: var(--font-mono);
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--panel-border-subtle);
      color: var(--text);
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: rgba(232, 234, 237, 0.02); }
    
    footer {
      border-top: 1px solid var(--panel-border);
      padding-top: 24px;
      font-size: 0.78rem;
      color: var(--muted);
      line-height: 1.6;
      font-family: var(--font-mono);
    }
    footer strong { color: var(--text); }

    @media (max-width: 820px) {
      .top-nav { padding: 16px 20px; flex-direction: column; align-items: flex-start; gap: 12px; }
      .container { padding: 32px 20px 0; }
      h1 { font-size: 1.8rem; }
      .toc ul { flex-direction: column; gap: 8px; }
    }
  </style>
</head>
<body>
  <!-- Top Live Telemetry Ticker Strip -->
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>LIVE QUANTITATIVE CORE TELEMETRY</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SECTION: METHODOLOGY & MATHEMATICS</span>
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
        <a href="/methodology" class="active">Methodology</a>
        <a href="/research">Research</a>
        <a href="/legal">Legal &amp; Terms</a>
      </div>
    </div>
    <div class="nav-right">
      <a href="/council" class="btn-outline">Launch Terminal →</a>
    </div>
  </nav>

  <main class="container">
    <div class="blueprint-eyebrow">
      <span class="pulse-dot"></span>
      <span>Mathematical Ground Truth · Open Specifications</span>
    </div>

    <h1>QuanterraOS Public Methodology</h1>
    <p class="lead">
      Full technical specification and mathematical foundations for the QuanterraOS verification layer. Every metric published on the platform is computed strictly according to these formulas with zero selective reporting.
    </p>

    <div class="toc">
      <h3>// Methodology Sections</h3>
      <ul>
        <li><a href="#calibration">1. Market Price Calibration &amp; Brier Score</a></li>
        <li><a href="#murphy">2. Murphy Score Decomposition</a></li>
        <li><a href="#composite">3. Quanterra BTC Composite v${COMPOSITE_METHODOLOGY_VERSION}</a></li>
        <li><a href="#draco">4. Draco Data-Quality Gate</a></li>
        <li><a href="#falcon">5. Falcon Research Pre-Registration</a></li>
      </ul>
    </div>

    <section id="calibration">
      <h2>1. Market Price Calibration &amp; Brier Scoring</h2>
      <p>
        For binary prediction markets (such as Kalshi's 15-minute BTC contracts), the contract resolves to 1 (YES) or 0 (NO). The market price <code>p_t &isin; [0, 1]</code> represents the market's implied probability that the contract will settle to YES.
      </p>
      <p>
        The mean squared error of the forecast across <code>N</code> settled contracts is measured by the standard Brier Score:
      </p>
      <div class="formula-card">
        BS = (1 / N) * &sum;_{i=1}^N (p_i - o_i)&sup2;
      </div>
      <p>
        where <code>p_i</code> is the market's entry price at minute 4, and <code>o_i &isin; {0, 1}</code> is the actual settlement outcome. A lower score indicates superior probabilistic accuracy. A naive coin-flip forecast (<code>p=0.50</code>) achieves an expected Brier score of <strong>0.2500</strong>.
      </p>
      <p>
        Across our canonical corpus of <strong>1,316 settled 15-minute contracts</strong> (19,740 minute candles), Kalshi's minute-4 entry price achieves an average Brier score of <strong>0.2001</strong>, beating both coin-flip baselines (0.2500) and internal quantitative fair-value models (0.2063).
      </p>
    </section>

    <section id="murphy">
      <h2>2. Murphy Score Decomposition</h2>
      <p>
        Per Allan Murphy (1973), the Brier score is decomposed into three orthogonal components across <code>K</code> discrete probability bins:
      </p>
      <div class="formula-card">
        BS = Uncertainty + Reliability - Resolution<br><br>
        Uncertainty = &omacr; * (1 - &omacr;)<br>
        Reliability = &sum;_{k=1}^K (n_k / N) * (p_k - &omacr;_k)&sup2;<br>
        Resolution  = &sum;_{k=1}^K (n_k / N) * (&omacr;_k - &omacr;)&sup2;
      </div>
      <p>
        <strong>Reliability (Calibration Error):</strong> Measures how closely empirical event frequencies match stated probabilities. Perfect calibration yields Reliability = 0.
      </p>
      <p>
        <strong>Resolution:</strong> Measures how effectively the market sorts events into outcomes different from the sample base rate <code>&omacr;</code>. Higher resolution reduces total Brier score.
      </p>
    </section>

    <section id="composite">
      <h2>3. Quanterra BTC Composite Index (v${COMPOSITE_METHODOLOGY_VERSION})</h2>
      <p>
        The Quanterra BTC Composite is designed as an independent volume-weighted median spot benchmark across Tier 1 US-accessible exchanges: Coinbase, Kraken, Bitstamp, and Gemini.
      </p>
      <div class="formula-card">
        1. Calculate Unweighted Median: M = median({P_v})_{v &isin; V_valid}<br>
        2. Draco Filter: Reject venue v if |P_v - M| / M &gt; 0.005 (50 bps) or Age(v) &gt; 5,000 ms<br>
        3. Quorum Gate: If |V_clean| &lt; 3, Composite = NULL (SUPPRESSED)<br>
        4. Volume-Weighted Price: P_composite = (&sum;_{v &isin; V_clean} P_v * W_v) / &sum;_{v &isin; V_clean} W_v
      </div>
      <p>
        <strong>Benchmark Designation:</strong> Quanterra BTC Composite is an empirical approximation. Kalshi KXBTC15M contracts settle against the CME CF Bitcoin Real-Time Index (BRTI). QuanterraOS does not represent its composite as the official BRTI.
      </p>
    </section>

    <section id="draco">
      <h2>4. Draco Data-Quality Standards</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Filter</th>
              <th>Threshold</th>
              <th>Action on Trigger</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="mono" style="font-weight:600; color:var(--text);">Stale Feed Filter</td>
              <td class="mono" style="color:var(--accent);">&gt; 5,000 ms age</td>
              <td>Tick discarded; excluded from composite calculation</td>
            </tr>
            <tr>
              <td class="mono" style="font-weight:600; color:var(--text);">Cross-Venue Outlier</td>
              <td class="mono" style="color:var(--accent);">&gt; &plusmn;0.50% from cross-venue median</td>
              <td>Tick flagged as anomalous; discarded from composite</td>
            </tr>
            <tr>
              <td class="mono" style="font-weight:600; color:var(--text);">Quorum Failure</td>
              <td class="mono" style="color:var(--warning);">&lt; 3 valid venues</td>
              <td>Composite value SUPPRESSED; returns null</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="falcon">
      <h2>5. Falcon Research Pre-Registration</h2>
      <p>
        Falcon is an experimental order-book depth monitoring heuristic. To prevent p-hacking and hindsight bias, its evaluation criteria were pre-registered in <code>docs/falcon-preregistration.md</code>:
      </p>
      <div class="formula-card">
        Sample Size Threshold: n &ge; 500 settled markets (current sample n=31)<br>
        Primary Metric: Brier Skill Score (BSS) vs Kalshi Market Mid-Price<br>
        Success Criterion: BSS &gt; 0 with 95% bootstrap confidence interval strictly excluding 0<br>
        Fee Hurdle: 0.07 * p * (1 - p) per contract
      </div>
      <p>
        <strong>Current Read:</strong> On its out-of-sample window (n=31), Falcon produced an average Brier score of 0.2736, underperforming both coin-flip (0.2500) and market mid (0.2106). In accordance with Rule B5, Falcon remains strictly a research module with zero live capital deployed.
      </p>
    </section>

    <footer>
      <p>
        <strong>Attribution &amp; Legal Disclaimers (Rule B10):</strong> Kalshi, CME Group, CF Benchmarks, Coinbase, Kraken, Bitstamp, and Gemini are trademarks of their respective owners. QuanterraOS is an independent measurement system. Rule B5 locked: zero live capital deployed.
      </p>
    </footer>
  </main>
${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
