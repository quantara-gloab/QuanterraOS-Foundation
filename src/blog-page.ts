/**
 * QuanterraOS Research & Empirical Analysis Post
 * "We tested two trading strategies against the market. Both lost."
 * Published Oct 4, 2026 · QuanterraOS Research
 */

export function renderTwoStrategiesLostPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We tested two trading strategies against the market. Both lost. — QuanterraOS Research</title>
  <meta name="description" content="Empirical backtest findings on 131 short-duration Bitcoin prediction market swing events: why momentum and fade heuristics failed to beat the market baseline.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --panel: rgba(14, 18, 27, 0.85);
      --panel-border: rgba(212, 175, 55, 0.16);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --warning: #F43F5E;
      --amber: #f59e0b;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 50% at 50% -20%, rgba(223, 184, 67, 0.1), transparent 70%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.7;
      font-size: 16px;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }

    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 48px;
      border-bottom: 1px solid var(--panel-border);
      background: rgba(6, 8, 14, 0.85);
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
      font-size: 1rem;
    }
    .nav-brand span { color: var(--accent); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 400; }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.85rem; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .nav-btn {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      text-decoration: none;
      font-weight: 500;
    }
    .btn-pricing {
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.15) 0%, rgba(163, 125, 36, 0.05) 100%);
      border: 1px solid rgba(223, 184, 67, 0.4);
      color: var(--accent-light);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.2);
    }

    .article-container {
      max-width: 780px;
      margin: 48px auto 0;
      padding: 0 24px;
    }
    .meta-tag {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.02em;
      margin-bottom: 16px;
      color: #FFFFFF;
    }
    .byline {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--muted);
      padding-bottom: 24px;
      border-bottom: 1px solid var(--panel-border);
      margin-bottom: 32px;
    }
    .lead-paragraph {
      font-size: 1.15rem;
      line-height: 1.6;
      color: #E2E8F0;
      margin-bottom: 28px;
    }
    h2 {
      font-size: 1.4rem;
      font-weight: 600;
      margin: 36px 0 16px;
      color: #F8FAFC;
      letter-spacing: -0.01em;
    }
    p {
      margin-bottom: 20px;
      color: #CBD5E1;
    }
    p strong { color: #FFFFFF; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 28px 0;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      overflow: hidden;
    }
    .data-table th, .data-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--panel-border);
    }
    .data-table th {
      background: rgba(255, 255, 255, 0.03);
      color: var(--muted);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .badge-baseline { color: var(--accent); font-weight: 600; }
    .badge-loss { color: #f87171; font-weight: 600; }

    .quote-callout {
      margin: 32px 0;
      padding: 20px 24px;
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.06) 0%, rgba(14, 18, 27, 0.8) 100%);
      border-left: 3px solid var(--accent);
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: #E2E8F0;
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.15);
    }

    .cftc-card {
      margin-top: 48px;
      padding: 20px 24px;
      background: rgba(245, 158, 11, 0.04);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 8px;
      font-size: 0.8rem;
      line-height: 1.6;
      color: #94A3B8;
    }
    .cftc-card strong {
      color: var(--amber);
      display: block;
      margin-bottom: 8px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    footer {
      max-width: 780px;
      margin: 64px auto 0;
      padding-top: 24px;
      border-top: 1px solid var(--panel-border);
      display: flex;
      justify-content: space-between;
      color: var(--muted);
      font-size: 0.8rem;
      font-family: var(--font-mono);
    }
    footer a { color: var(--accent); text-decoration: none; }
  </style>
</head>
<body>

  <nav class="top-nav">
    <a href="/" class="nav-brand">
      QUANTERRAOS
      <span>/ RESEARCH</span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/research" class="active">Research</a>
      <a href="/predictions">Predictions</a>
      <a href="/autopilot">Autopilot</a>
      <a href="/calibration">Calibration</a>
      <a href="/pricing" class="nav-btn btn-pricing">Pricing</a>
    </div>
  </nav>

  <article class="article-container">
    <div class="meta-tag">Empirical Research Paper · Published Oct 4, 2026</div>
    <h1>We tested two trading strategies against the market. Both lost.</h1>
    <div class="byline">By QuanterraOS Research Team · 15-Minute BTC Binary Prediction Markets</div>

    <p class="lead-paragraph">
      Most trading products lead with their best quarter. We're leading with a negative result, because it's real, and a positive-sounding version wouldn't be.
    </p>

    <p>
      Here's what we did, what we found, and why publishing this instead of quietly shelving it is the actual product.
    </p>

    <h2>The setup</h2>
    <p>
      We've been building an audit trail for short-duration Bitcoin prediction markets on Kalshi (15-minute contracts). Before testing any trading strategy, we asked a simpler question first: how good is the market's own price, on its own, at predicting the outcome?
    </p>
    <p>
      Across <strong>1,316 settled markets</strong>, the market's own mid-price — what the crowd was willing to pay, four minutes into each 15-minute window — scored a <strong>Brier score of 0.2001</strong>. (Brier score measures how well-calibrated a probability forecast is: 0 is perfect, 0.25 is what you'd get guessing 50/50 every time, lower is better.) 0.2001 against a 0.25 baseline means the market is already doing real work pricing these contracts. That's the bar any strategy has to clear.
    </p>

    <h2>What we actually tested</h2>
    <p>
      We then asked: can a simple, well-known trading heuristic beat that bar? We tested two, on a conditioned subset of <strong>131 markets</strong> that had already seen a sudden price swing (≥8 percentage points in 5 minutes) — the kind of moment where a trading rule would expect to have an edge:
    </p>

    <table class="data-table">
      <thead>
        <tr>
          <th>Strategy / Metric</th>
          <th>Out-of-Sample Brier</th>
          <th>Performance vs. Benchmark</th>
          <th>Economic Outcome</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Market Entry Benchmark</strong></td>
          <td class="badge-baseline">0.1838</td>
          <td>Baseline (Market Consensus)</td>
          <td>Efficient benchmark</td>
        </tr>
        <tr>
          <td><strong>Momentum Continuation</strong></td>
          <td class="badge-loss">0.1863</td>
          <td>Underperformed benchmark</td>
          <td>Failed fee hurdle</td>
        </tr>
        <tr>
          <td><strong>Fade / Mean-Reversion</strong></td>
          <td class="badge-loss">0.3083</td>
          <td>Decisively beaten by market</td>
          <td>−15.37¢ / contract net loss</td>
        </tr>
      </tbody>
    </table>

    <p>
      The baseline for that same subset — just the market's own price — was <strong>0.1838</strong>.
    </p>
    <p>
      <strong>Neither strategy beat the market.</strong> Momentum came close but still lost. Fade lost badly — over 15¢ per contract, simulated, after the trade was already "obviously" set up by the swing.
    </p>

    <div class="quote-callout">
      "Publishing an audit of why your own models lost to the market mid is the highest test of research integrity. An immutable record doesn't pick favorites."
    </div>

    <h2>Why we're telling you this</h2>
    <p>Two reasons, and neither is modesty for its own sake:</p>
    <p>
      <strong>First, it's true, and a lot of what gets published in this space isn't checkable.</strong> Plenty of products in and around prediction markets and crypto trading lead with backtested returns that can't be independently verified. We built the opposite: every prediction we make is logged before the market settles, timestamped, and scored after — and that record is never edited. You can go look at it on our <a href="/predictions" style="color:var(--accent); text-decoration: underline;">/predictions ledger</a>. The negative result above came out of that same ledger, which means the positive results we publish later (if and when we have any) come with the same guarantee.
    </p>
    <p>
      <strong>Second, "the market is hard to beat" is itself useful information if you trade these markets.</strong> If you've been assuming a simple momentum or mean-reversion rule gives you an edge on short-duration BTC contracts, this is evidence against that, on real settled data, not a hunch.
    </p>

    <h2>What this means for what we're building</h2>
    <p>
      We haven't found a strategy that beats the market yet. Our live automated system (<a href="/autopilot" style="color:var(--accent); text-decoration: underline;">/autopilot</a>) reflects that honestly: it runs continuously, making the same decisions a real strategy would, but on <strong>$0.00 of real capital</strong> — a hard-coded safety lock (<strong>Rule B5</strong>), not a toggle we're planning to quietly flip. It stays that way until a strategy clears a pre-registered bar on genuinely new, out-of-sample data — decided in advance, not after seeing results that happen to look good.
    </p>
    <p>
      In the meantime, what we can offer is the infrastructure itself: a live, append-only, checkable record of predictions and outcomes for this market, open for anyone to audit — including us.
    </p>

    <p style="font-size: 0.9rem; color: var(--muted); margin-top: 32px;">
      <strong>Methodology notes:</strong> all figures above are computed directly from settled Kalshi 15-minute BTC contracts; full dataset and calculation details are on our <a href="/methodology" style="color:var(--accent);">methodology page</a> and <a href="/calibration" style="color:var(--accent);">calibration audit</a>.
    </p>

    <div class="cftc-card">
      <strong>Regulatory Disclosure &amp; Hypothetical Trading Notice (CFTC Rule 4.41)</strong>
      HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS HAVE CERTAIN INHERENT LIMITATIONS. UNLIKE AN ACTUAL PERFORMANCE RECORD, SIMULATED RESULTS DO NOT REPRESENT ACTUAL TRADING. ALSO, SINCE THE TRADES HAVE NOT ACTUALLY BEEN EXECUTED, THE RESULTS MAY HAVE UNDER- OR OVER-COMPENSATED FOR THE IMPACT, IF ANY, OF CERTAIN MARKET FACTORS, SUCH AS LACK OF LIQUIDITY. SIMULATED TRADING PROGRAMS IN GENERAL ARE ALSO SUBJECT TO THE FACT THAT THEY ARE DESIGNED WITH THE BENEFIT OF HINDSIGHT. NO REPRESENTATION IS BEING MADE THAT ANY ACCOUNT WILL OR IS LIKELY TO ACHIEVE PROFITS OR LOSSES SIMILAR TO THOSE SHOWN.
      <div style="margin-top: 8px; font-size: 0.75rem; color: #64748b;">
        QuanterraOS operates strictly under paper simulation mode ($0.00 live funds committed). Prediction ledger records reflect timestamped model probabilities scored strictly ex-post against settled market outcomes.
      </div>
    </div>
  </article>

  <footer>
    <div>QuanterraOS Research Hub · Empirical Market Calibration</div>
    <div><a href="/research">← All Research Papers</a></div>
  </footer>

</body>
</html>`;
}
