/**
 * Public Research Response Post
 *
 * Title: "Is Kalshi's BTC Market Actually Calibrated? We Checked."
 * Path: /research/kalshi-calibration-response (aliased at /blog/is-kalshi-calibrated)
 *
 * Designed as a long-form, highly readable editorial essay with elegant typography
 * and clear, transparent citations linking directly to the live /calibration proof.
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderResponsePostPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#06070A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="QuanterraOS">
<title>Is Kalshi's BTC Market Actually Calibrated? We Checked. — QuanterraOS Research</title>
<meta name="description" content="An independent calibration check of Kalshi's 15-minute BTC markets, using 1,316 settled contracts and full disclosed methodology.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06070A;
    --card-bg: #0C0F17;
    --border: rgba(212, 175, 55, 0.16);
    --text: #F8FAFC;
    --text-dim: #94A3B8;
    --muted: #94A3B8;
    --accent: #DFB843;
    --cyan: #DFB843;
    --accent-light: #F7E7B4;
    --gold-bullion: #D4AF37;
    --serif: 'Fraunces', Georgia, serif;
    --sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --mono: 'IBM Plex Mono', ui-monospace, monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse 90% 50% at 50% -20%, rgba(223, 184, 67, 0.1), transparent 70%), var(--bg);
    color: var(--text);
    font-family: var(--sans);
    line-height: 1.75;
    font-size: 17px;
    padding-bottom: 96px;
    -webkit-font-smoothing: antialiased;
  }

  /* Nav */
  .post-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 48px;
    border-bottom: 1px solid var(--border);
    background: rgba(11, 13, 18, 0.9);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .nav-left {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--text);
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.08em;
  }
  .nav-left .logo {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(201, 162, 39, 0.2), rgba(0, 229, 255, 0.2));
    border: 1px solid var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    font-size: 0.72rem;
  }
  .nav-right {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .nav-right a {
    color: var(--text-dim);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    transition: color 0.15s;
  }
  .nav-right a:hover { color: var(--cyan); }
  .btn-proof {
    border: 1px solid var(--accent);
    color: var(--accent);
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }
  .btn-proof:hover {
    background: rgba(201, 162, 39, 0.1);
  }

  /* Article Wrapper */
  .article-container {
    max-width: 740px;
    margin: 56px auto 0;
    padding: 0 24px;
  }

  /* Article Header */
  .article-tag {
    font-family: var(--mono);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    margin-bottom: 16px;
    display: inline-block;
  }
  .article-title {
    font-family: var(--serif);
    font-size: 2.75rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: #ffffff;
    margin-bottom: 20px;
  }
  .article-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 0.86rem;
    color: var(--muted);
    font-family: var(--mono);
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 40px;
  }

  /* Article Typography */
  .article-body p {
    margin-bottom: 24px;
    color: #d1d7e5;
    font-size: 1.05rem;
  }
  .article-body h2 {
    font-family: var(--serif);
    font-size: 1.65rem;
    font-weight: 600;
    color: #ffffff;
    margin: 44px 0 18px;
    letter-spacing: -0.01em;
  }
  .article-body strong {
    color: #ffffff;
    font-weight: 600;
  }
  .article-body em {
    font-family: var(--serif);
    font-style: italic;
    color: var(--accent);
  }

  /* Callout Card */
  .callout-box {
    background: var(--card-bg);
    border-left: 3px solid var(--accent);
    border-radius: 0 8px 8px 0;
    padding: 24px;
    margin: 32px 0;
  }
  .callout-box p {
    margin-bottom: 0;
    font-size: 0.95rem;
    color: var(--text);
  }

  /* Key Stat Highlights */
  .stats-banner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    background: rgba(19, 23, 34, 0.7);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px 24px;
    margin: 32px 0;
  }
  .stat-item-label {
    font-family: var(--mono);
    font-size: 0.72rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }
  .stat-item-val {
    font-family: var(--mono);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--cyan);
  }

  /* Call to action at bottom */
  .post-cta {
    background: linear-gradient(135deg, rgba(201, 162, 39, 0.08) 0%, rgba(0, 229, 255, 0.05) 100%);
    border: 1px solid rgba(201, 162, 39, 0.25);
    border-radius: 10px;
    padding: 32px;
    text-align: center;
    margin-top: 56px;
  }
  .post-cta h3 {
    font-family: var(--serif);
    font-size: 1.35rem;
    color: var(--accent);
    margin-bottom: 10px;
  }
  .post-cta p {
    font-size: 0.92rem;
    color: var(--text-dim);
    margin-bottom: 20px;
  }
  .btn-primary {
    background: var(--accent);
    color: #0b0d12;
    padding: 10px 24px;
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
    display: inline-block;
    transition: opacity 0.2s;
  }
  .btn-primary:hover { opacity: 0.9; }

  @media (max-width: 640px) {
    .article-title { font-size: 2.1rem; }
    .post-nav { padding: 16px 20px; }
    .stats-banner { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

  <!-- Navigation -->
  <nav class="post-nav">
    <a href="/" class="nav-left">
      <div class="logo">QG</div>
      <span>QUANTERRAOS</span>
    </a>
    <div class="nav-right">
      <a href="/calibration">Calibration Proof</a>
      <a href="/council">Council Terminal</a>
      <a href="/calibration" class="btn-proof">View Live Proof →</a>
    </div>
  </nav>

  <!-- Article -->
  <main class="article-container">
    
    <div class="article-tag">// Public Research Note · Market Efficiency Audit</div>
    <h1 class="article-title">Is Kalshi's BTC Market Actually Calibrated? We Checked.</h1>
    <div class="article-meta">
      <span>OCTOBER 2026</span> · 
      <span>CANONICAL CORPUS (n=1,316)</span> · 
      <span>QUANTERRAOS RESEARCH</span>
    </div>

    <article class="article-body">
      <p>
        A recent study by Vanderbilt researchers Joshua Clinton and TzuFeng Huang examined 2,500 markets across Polymarket, Kalshi, and PredictIt and found Kalshi "78% accurate," raising concerns about herd behavior and disconnected pricing between related markets. Kalshi's Jack Such pushed back, arguing that accuracy should be measured as <em>calibration</em> — whether a market priced at 20% actually resolves YES about 20% of the time — and that by that standard, Kalshi performs far better.
      </p>

      <p>
        Both sides have a point, and the disagreement partly comes down to which markets you're measuring and how. So rather than taking either side's word for it, we checked — for the specific market we operate in.
      </p>

      <h2>What we measured</h2>

      <p>
        We pulled <strong>1,316 settled Kalshi 15-minute BTC high/low markets</strong> (<code>KXBTC15M</code>), covering roughly two weeks of continuous trading, and scored the market's own minute-4 entry price as a probability estimate against what actually happened at settlement, using Brier score — the standard scoring rule for calibrated forecasts (lower is better; 0.25 is what a coin flip gets).
      </p>

      <div class="stats-banner">
        <div>
          <div class="stat-item-label">Market Brier Score (Minute 4)</div>
          <div class="stat-item-val">0.2001</div>
        </div>
        <div>
          <div class="stat-item-label">Coin-Flip Baseline</div>
          <div class="stat-item-val" style="color:var(--muted);">0.2500</div>
        </div>
      </div>

      <h2>What we found</h2>

      <p>
        The market's price scored a Brier of <strong>0.1988–0.2001</strong>, well below the coin-flip baseline. More importantly, when we broke the data into ten probability bins — markets priced 0–10%, 10–20%, and so on — the actual settlement rate in each bin tracked closely with the priced probability.
      </p>

      <p>
        A market priced 70–80% resolved YES <strong>75.9%</strong> of the time. One priced 40–50% resolved YES <strong>43.6%</strong> of the time. The fit holds across the well-populated middle of the distribution, with more noise only in the thinnest tail bins (fewer than 20 markets each).
      </p>

      <h2>What this doesn't mean</h2>

      <p>
        It doesn't mean nobody can ever find an edge, and it doesn't mean every Kalshi market behaves this way — our data covers one specific, fast-settling product, not the broader platform.
      </p>

      <p>
        We also tested twelve different approaches — fair-value models, order-book imbalance, momentum on sudden swings, cross-exchange lead-lag — looking for a way to beat this price. None of them did, after fees, out of sample. We've published that full methodology and every result, including the failures, because a calibration claim means nothing if you only show the wins.
      </p>

      <h2>Why we're publishing this</h2>

      <p>
        Most tools in this space are built to help you trade against the market. We built something different: a way to check whether the market itself can be trusted. For the product we operate in, the answer — checked with real, disclosed data — is yes.
      </p>

      <p style="font-size: 1.05rem; margin-top: 28px;">
        <strong>Full methodology and calibration curve:</strong> <a href="/calibration" style="color:var(--accent); font-weight:600; text-decoration: underline;">/calibration</a>
      </p>

      <!-- CTA Box -->
      <div class="post-cta">
        <h3>Examine the Live Proof</h3>
        <p>Inspect the full 10-bin calibration table, interactive chart, and reproducible methodology.</p>
        <a href="/calibration" class="btn-primary">View Calibration Curve &amp; Decile Table →</a>
      </div>
    </article>

  </main>

${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
