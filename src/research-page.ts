/**
 * QuanterraOS Research Hub (/research)
 * 
 * Spec: HANDOFF.md Section I
 * All published findings, empirical backtests, and negative results.
 * Architectural blueprint aesthetic:
 * Gold Standard palette (#06070A, #0C0F17, #DFB843, #F43F5E), Inter + IBM Plex Mono.
 */
export function renderResearchPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Research & Empirical Findings — QuanterraOS</title>
  <meta name="description" content="Published research papers, backtest results, and negative findings on short-duration BTC prediction markets.">
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
      background: linear-gradient(135deg, rgba(223, 184, 67, 0.2), rgba(6, 8, 14, 0.9));
      border: 1px solid rgba(223, 184, 67, 0.4);
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
      border: 1px solid rgba(223, 184, 67, 0.4);
      color: #FFFFFF;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-family: var(--font-mono);
      text-decoration: none;
      background: rgba(223, 184, 67, 0.08);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 0 15px rgba(223, 184, 67, 0.1);
    }
    .btn-outline:hover {
      border-color: var(--accent);
      background: rgba(223, 184, 67, 0.18);
      box-shadow: 0 0 25px rgba(223, 184, 67, 0.25);
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
      color: var(--accent);
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.2);
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

    /* Paper Cards */
    .paper-card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      padding: 28px;
      margin-bottom: 20px;
      transition: border-color 0.15s;
    }
    .paper-card:hover { border-color: rgba(223, 184, 67, 0.3); }
    .paper-meta {
      font-size: 0.72rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 10px;
      font-family: var(--font-mono);
    }
    .paper-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text);
      text-decoration: none;
      display: block;
      letter-spacing: -0.01em;
    }
    .paper-title:hover { color: var(--accent); }
    .paper-summary {
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 20px;
      line-height: 1.65;
    }
    .paper-tags-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .paper-tag {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 2px;
      font-family: var(--font-mono);
      letter-spacing: 0.05em;
    }
    .tag-negative {
      background: rgba(198, 93, 74, 0.1);
      color: var(--warning);
      border: 1px solid rgba(198, 93, 74, 0.3);
    }
    .tag-calibration {
      background: rgba(223, 184, 67, 0.1);
      color: var(--accent);
      border: 1px solid rgba(223, 184, 67, 0.3);
    }
    .tag-research {
      background: rgba(232, 234, 237, 0.05);
      color: var(--muted);
      border: 1px solid var(--panel-border);
    }
    .read-paper-link {
      color: var(--accent);
      font-size: 0.82rem;
      text-decoration: none;
      font-weight: 500;
      font-family: var(--font-mono);
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .read-paper-link:hover { text-decoration: underline; }

    footer {
      border-top: 1px solid var(--panel-border);
      padding-top: 24px;
      margin-top: 40px;
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
      .read-paper-link { margin-left: 0; width: 100%; margin-top: 8px; }
    }
  </style>
</head>
<body>
  <!-- Top Live Telemetry Ticker Strip -->
  <div class="live-ticker-strip">
    <div class="ticker-content">
      <span class="ticker-item"><span class="ticker-pulse"></span>LIVE QUANTITATIVE CORE TELEMETRY</span>
      <span class="ticker-sep">//</span>
      <span class="ticker-item">SECTION: RESEARCH & FINDINGS</span>
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
        <a href="/research" class="active">Research</a>
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
      <span>Empirical Research Archive · Reproducible Standards</span>
    </div>

    <h1>Empirical Research &amp; Findings</h1>
    <p class="lead">
      We publish full backtest reports, data corpora, and negative findings. Losing to the market is a scientific finding we display, not hide.
    </p>

    <div class="paper-card" style="border-color: rgba(223, 184, 67, 0.45); background: linear-gradient(180deg, rgba(20, 26, 38, 0.85) 0%, rgba(12, 15, 23, 0.95) 100%); box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25);">
      <div class="paper-meta">// Research Paper · 4 October 2026 · Featured</div>
      <a href="/research/two-strategies-lost" class="paper-title" style="color: var(--accent);">We tested two trading strategies against the market. Both lost.</a>
      <p class="paper-summary">
        Most trading products lead with their best quarter. We're leading with a negative result, because it's real, and a positive-sounding version wouldn't be. An empirical examination of momentum and fade heuristics across 131 conditioned price-swing events on Kalshi 15-minute BTC prediction markets.
      </p>
      <div class="paper-tags-row">
        <span class="paper-tag tag-negative">EMPIRICAL LOSS AUDIT</span>
        <span class="paper-tag tag-calibration">SWING EVENTS n=131</span>
        <a href="/research/two-strategies-lost" class="read-paper-link">Read Full Post &rarr;</a>
      </div>
    </div>

    <div class="paper-card">
      <div class="paper-meta">// Working Paper · 4 October 2026</div>
      <a href="/research/kalshi-calibration-response" class="paper-title">Is Kalshi's BTC Market Actually Calibrated? We Checked.</a>
      <p class="paper-summary">
        An empirical audit of 1,316 consecutive settled 15-minute BTC contracts (19,740 1-minute candles) resolving against the CME CF Bitcoin Real-Time Index (BRTI). We evaluate probabilistic calibration against the Vanderbilt study claims and demonstrate that Kalshi market entry prices achieve a 0.2001 Brier score, tracking the 45° calibration line across all 10 deciles.
      </p>
      <div class="paper-tags-row">
        <span class="paper-tag tag-calibration">CALIBRATION AUDIT</span>
        <span class="paper-tag tag-research">CORPUS n=1,316</span>
        <a href="/research/kalshi-calibration-response" class="read-paper-link">Read Full Paper &rarr;</a>
      </div>
    </div>

    <div class="paper-card">
      <div class="paper-meta">// Negative Result · findings.md §1 &amp; §3</div>
      <div class="paper-title">Canonical 15-Minute Fair-Value Model vs Kalshi Market Mid-Price</div>
      <p class="paper-summary">
        Over 1,316 continuous 15-minute contracts, our structural fair-value model (Black-Scholes-Merton with It&ocirc; drift adjustment) was tested against the Kalshi mid-price at minutes 4, 7, 10, and 13. At every checkpoint, the market's own price beat our fair-value model in Brier score (0.2001 vs 0.2063 at minute 4). Trading on model-market divergence after taker fees produced negative expected value across early checkpoints and zero statistical edge at minute 13.
      </p>
      <div class="paper-tags-row">
        <span class="paper-tag tag-negative">NEGATIVE RESULT</span>
        <span class="paper-tag tag-research">n=1,316 MARKETS</span>
      </div>
    </div>

    <div class="paper-card">
      <div class="paper-meta">// Walk-Forward Backtest · findings.md §12</div>
      <div class="paper-title">Sudden Price-Swing Event Backtest: In-Sample Fit vs Out-of-Sample Failure</div>
      <p class="paper-summary">
        Analysis of 245 sudden &plusmn;8pp price moves within a 5-minute window across active KXBTC15M contracts (131 settled). While in-sample training showed an apparent 75.6% win rate, a 5-fold chronological walk-forward backtest revealed that momentum fails out-of-sample (Brier 0.1863 vs market 0.1838; profit CI includes zero) due to time-clustering into 21 independent hourly windows. Mean-reversion (fade) failed decisively (-15.37&cent;/contract).
      </p>
      <div class="paper-tags-row">
        <span class="paper-tag tag-negative">NO STATISTICAL EDGE</span>
        <span class="paper-tag tag-research">WALK-FORWARD AUDIT</span>
      </div>
    </div>

    <div class="paper-card">
      <div class="paper-meta">// Pre-Registered Research Program · docs/falcon-preregistration.md</div>
      <div class="paper-title">Falcon Order-Book Depth Monitoring: Early Sample Status (n=31)</div>
      <p class="paper-summary">
        Falcon monitors top-of-book and depth imbalance on Kalshi order books. In its pre-registered out-of-sample window (n=31), Falcon produced an average Brier score of 0.2736, underperforming both a coin flip (0.2500) and market mid (0.2106). Per the pre-registration protocol, Falcon remains strictly an offline research experiment until n &ge; 500 settled markets are accumulated.
      </p>
      <div class="paper-tags-row">
        <span class="paper-tag tag-negative">UNDERPERFORMING BASELINE</span>
        <span class="paper-tag tag-research">RESEARCH-ONLY (n=31 / 500)</span>
      </div>
    </div>

    <footer>
      <p>
        <strong>Attribution &amp; Legal Disclaimers (Rule B10):</strong> Kalshi, CME Group, CF Benchmarks, Coinbase, Kraken, Bitstamp, and Gemini are trademarks of their respective owners. QuanterraOS is an independent measurement system. Rule B5 locked: zero live capital deployed.
      </p>
    </footer>
  </main>
</body>
</html>`;
}
