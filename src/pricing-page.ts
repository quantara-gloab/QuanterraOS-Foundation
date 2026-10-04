/**
 * QuanterraOS Pricing Page (/pricing)
 *
 * Implements Section 4 of the Handoff Spec:
 * - Three-tier structure: Free Explorer ($0), Pro Terminal ($199/mo), Institutional API ($750/mo)
 * - Clear, honest positioning: "Everything here is checkable before you pay — the free tier shows the same methodology, just not in real time."
 * - Zero artificial urgency, zero fake countdowns, strictly compliant with static-copy guardrails.
 */

export function renderPricingPageHtml(userTier: string = "free"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing & Subscriptions — QuanterraOS</title>
  <meta name="description" content="Transparent pricing for QuanterraOS short-duration prediction market telemetry, real-time prediction ledgers, and institutional APIs.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-highlight: #111624;
      --border: rgba(212, 175, 55, 0.16);
      --border-accent: rgba(223, 184, 67, 0.5);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --gold-glow: rgba(223, 184, 67, 0.35);
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --warning: #F43F5E;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 60% at 50% -10%, rgba(223, 184, 67, 0.12), transparent 70%),
        radial-gradient(700px 400px at 80% 30%, rgba(163, 125, 36, 0.05), transparent 60%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.6;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }

    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 48px;
      border-bottom: 1px solid var(--border);
      background: rgba(6, 7, 10, 0.88);
      backdrop-filter: blur(20px) saturate(180%);
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
      letter-spacing: -0.01em;
    }
    .nav-brand span { color: var(--accent); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 400; }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--text-dim); text-decoration: none; font-size: 0.85rem; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .btn-account {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      text-decoration: none;
      background: rgba(212, 175, 55, 0.06);
      border: 1px solid var(--border);
      color: var(--text);
      transition: border-color 0.15s, background-color 0.15s;
    }
    .btn-account:hover {
      border-color: var(--border-accent);
      background: rgba(212, 175, 55, 0.12);
    }

    .container {
      max-width: 1100px;
      margin: 48px auto 0;
      padding: 0 24px;
    }
    .hero-header {
      text-align: center;
      margin-bottom: 48px;
    }
    .hero-tag {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--accent-light);
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.15) 0%, rgba(163, 125, 36, 0.05) 100%);
      border: 1px solid rgba(223, 184, 67, 0.35);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25);
      padding: 5px 14px;
      border-radius: 20px;
      margin-bottom: 18px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 14px;
      letter-spacing: -0.02em;
    }
    .hero-subtitle {
      font-size: 1.1rem;
      color: var(--text-dim);
      max-width: 720px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .honest-callout {
      margin: 28px auto 0;
      padding: 14px 24px;
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.08) 0%, rgba(12, 15, 23, 0.8) 100%);
      border: 1px solid rgba(223, 184, 67, 0.25);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.15);
      border-radius: 8px;
      max-width: 700px;
      font-size: 0.9rem;
      color: #E2E8F0;
      text-align: center;
    }

    /* Pricing Grid */
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-top: 40px;
    }
    @media (max-width: 860px) {
      .pricing-grid { grid-template-columns: 1fr; }
    }

    .pricing-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 34px 28px;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 12px 28px rgba(0, 0, 0, 0.4);
    }
    .pricing-card:hover {
      border-color: rgba(212, 175, 55, 0.35);
      transform: translateY(-2px);
    }
    .pricing-card.featured {
      background: linear-gradient(180deg, rgba(20, 26, 40, 0.92) 0%, rgba(13, 17, 26, 0.96) 100%);
      border-color: var(--border-accent);
      box-shadow: inset 0 1px 0 0 rgba(247, 231, 180, 0.4), 0 0 35px rgba(223, 184, 67, 0.18), 0 16px 36px rgba(0, 0, 0, 0.5);
    }
    .featured-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(180deg, #FBF3D5 0%, #DFB843 40%, #B88E28 100%);
      color: #07080B;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 14px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4);
      white-space: nowrap;
    }
    .tier-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 6px;
    }
    .tier-desc {
      font-size: 0.85rem;
      color: var(--muted);
      min-height: 40px;
      margin-bottom: 20px;
    }
    .price-box {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }
    .price-amount {
      font-size: 2.3rem;
      font-weight: 700;
      font-family: var(--font-mono);
      color: #FFFFFF;
    }
    .price-period {
      font-size: 0.85rem;
      color: var(--muted);
    }

    .features-list {
      list-style: none;
      margin-bottom: 32px;
      flex-grow: 1;
    }
    .features-list li {
      font-size: 0.88rem;
      color: #CBD5E1;
      margin-bottom: 12px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .check-icon {
      color: var(--accent);
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1.2;
    }
    .dash-icon {
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.9rem;
      line-height: 1.2;
    }

    .action-btn {
      width: 100%;
      padding: 13px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: var(--font-mono);
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
      display: block;
    }
    .action-btn:hover {
      transform: translateY(-1px);
    }
    .btn-free {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-free:hover {
      background: rgba(212, 175, 55, 0.08);
      border-color: rgba(212, 175, 55, 0.3);
    }
    /* Gold Bullion Gloss Action Button */
    .btn-pro {
      background: linear-gradient(180deg, #FAF1D4 0%, #DFB843 35%, #B88E28 100%);
      color: #07080B;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 20px rgba(223, 184, 67, 0.35), 0 1px 3px rgba(0, 0, 0, 0.5);
      border: 1px solid #DFB843;
    }
    .btn-pro:hover {
      background: linear-gradient(180deg, #FFFFFF 0%, #E8C353 35%, #C2962C 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 6px 24px rgba(223, 184, 67, 0.45);
    }
    .btn-inst {
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.12) 0%, rgba(163, 125, 36, 0.05) 100%);
      border: 1px solid rgba(223, 184, 67, 0.5);
      color: var(--accent-light);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.2);
    }
    .btn-inst:hover {
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.2) 0%, rgba(163, 125, 36, 0.1) 100%);
      border-color: var(--accent);
      color: #FFFFFF;
    }

    /* Comparison Table */
    .comparison-section {
      margin-top: 64px;
    }
    .comparison-section h2 {
      font-size: 1.4rem;
      margin-bottom: 20px;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .comp-table th, .comp-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .comp-table th {
      background: rgba(212, 175, 55, 0.04);
      color: var(--accent-light);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .comp-table tr:last-child td { border-bottom: none; }

    footer {
      max-width: 1100px;
      margin: 64px auto 0;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      color: var(--muted);
      font-size: 0.8rem;
      font-family: var(--font-mono);
    }
    footer a { color: var(--accent); text-decoration: none; transition: color 0.15s; }
    footer a:hover { color: var(--accent-light); text-decoration: underline; }
  </style>
</head>
<body>

  <nav class="top-nav">
    <a href="/" class="nav-brand">
      QUANTERRAOS
      <span>/ PRICING</span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/research">Research</a>
      <a href="/predictions">Predictions</a>
      <a href="/autopilot">Autopilot</a>
      <a href="/calibration">Calibration</a>
      <a href="/account" class="btn-account">Account / Login</a>
    </div>
  </nav>

  <main class="container">
    <div class="hero-header">
      <div class="hero-tag">Zero Unbacked Marketing Claims · Falsifiable Telemetry</div>
      <h1>Predictable, Transparent Pricing</h1>
      <p class="hero-subtitle">
        Everything here is checkable before you pay — the free tier shows the same methodology, just not in real time.
      </p>
      <div class="honest-callout">
        <strong>The Paywall Boundary:</strong> You pay for <em>immediacy</em> and <em>actionability</em> (real-time streaming, live execution telemetry, CSV/API exports), never for concealed results.
      </div>
    </div>

    <div class="pricing-grid">
      <!-- Free Explorer -->
      <div class="pricing-card">
        <div class="tier-name">Free Explorer</div>
        <div class="tier-desc">Open research & complete verification for curious quants and students.</div>
        <div class="price-box">
          <div class="price-amount">$0</div>
          <div class="price-period">Free forever · No card required</div>
        </div>
        <ul class="features-list">
          <li><span class="check-icon">✓</span> <span><strong>/predictions</strong>: 20-min delayed live feed</span></li>
          <li><span class="check-icon">✓</span> <span><strong>1,316 settled markets</strong> full historical replay</span></li>
          <li><span class="check-icon">✓</span> <span><strong>/autopilot</strong>: Daily paper P&L snapshot</span></li>
          <li><span class="check-icon">✓</span> <span><strong>/calibration</strong>: Daily refreshed Brier audit</span></li>
          <li><span class="check-icon">✓</span> <span>Full methodology & research access</span></li>
          <li><span class="dash-icon">—</span> <span style="color:var(--muted);">No real-time WebSocket stream</span></li>
          <li><span class="dash-icon">—</span> <span style="color:var(--muted);">No automated CSV exports</span></li>
        </ul>
        <a href="/account?flow=sign-up&tier=free" class="action-btn btn-free">
          ${userTier === "free" ? "Current Tier (Active)" : "Downgrade to Free"}
        </a>
      </div>

      <!-- Pro Terminal -->
      <div class="pricing-card featured">
        <div class="featured-badge">Active Quantitative Traders</div>
        <div class="tier-name">Pro Terminal</div>
        <div class="tier-desc">Sub-second live prediction feed and continuous simulated P&L telemetry.</div>
        <div class="price-box">
          <div class="price-amount">$199<span style="font-size:1rem; font-weight:400; color:var(--muted);"> / mo</span></div>
          <div class="price-period">Billed monthly · Self-serve cancellation</div>
        </div>
        <ul class="features-list">
          <li><span class="check-icon">✓</span> <span><strong>Real-time /predictions feed</strong> (sub-second)</span></li>
          <li><span class="check-icon">✓</span> <span><strong>Live continuous /autopilot</strong> P&L tracking</span></li>
          <li><span class="check-icon">✓</span> <span><strong>Real-time /calibration</strong> 10-bin curve</span></li>
          <li><span class="check-icon">✓</span> <span><strong>Automated CSV export</strong> (predictions & autopilot)</span></li>
          <li><span class="check-icon">✓</span> <span>Swing-event telemetry alerts</span></li>
          <li><span class="check-icon">✓</span> <span>Depth imbalance & basis monitor</span></li>
          <li><span class="dash-icon">—</span> <span style="color:var(--muted);">Raw tick feeds reserved for Institutional</span></li>
        </ul>
        <form action="/api/billing/checkout" method="POST">
          <input type="hidden" name="tier" value="pro" />
          <button type="submit" class="action-btn btn-pro">
            ${userTier === "pro" ? "Current Plan (Manage)" : "Upgrade to Pro →"}
          </button>
        </form>
      </div>

      <!-- Institutional API -->
      <div class="pricing-card">
        <div class="tier-name">Institutional API</div>
        <div class="tier-desc">Direct high-throughput WebSocket streams and raw tick data for market makers.</div>
        <div class="price-box">
          <div class="price-amount">$750<span style="font-size:1rem; font-weight:400; color:var(--muted);"> / mo</span></div>
          <div class="price-period">Billed monthly · High-throughput quota</div>
        </div>
        <ul class="features-list">
          <li><span class="check-icon">✓</span> <span><strong>Everything in Pro Terminal</strong></span></li>
          <li><span class="check-icon">✓</span> <span><strong>Raw tick data exports</strong> (19,740 candle rows)</span></li>
          <li><span class="check-icon">✓</span> <span><strong>Unmetered WebSocket telemetry stream</strong></span></li>
          <li><span class="check-icon">✓</span> <span><strong>Rate-limited API access keys</strong> (REST + WS)</span></li>
          <li><span class="check-icon">✓</span> <span>Full order-book depth JSON snapshots</span></li>
          <li><span class="check-icon">✓</span> <span>Pre-registration datasets & JEV protocol feeds</span></li>
          <li><span class="check-icon">✓</span> <span>Dedicated desk technical support</span></li>
        </ul>
        <form action="/api/billing/checkout" method="POST">
          <input type="hidden" name="tier" value="institutional" />
          <button type="submit" class="action-btn btn-inst">
            ${userTier === "institutional" ? "Current Plan (Manage)" : "Get Institutional Access →"}
          </button>
        </form>
      </div>
    </div>

    <!-- Feature Comparison Table -->
    <div class="comparison-section">
      <h2>Detailed Feature Matrix</h2>
      <table class="comp-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Free Explorer</th>
            <th>Pro Terminal ($199/mo)</th>
            <th>Institutional ($750/mo)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>/predictions live ledger</td>
            <td>Delayed 20 min</td>
            <td style="color:var(--accent);">Real-time</td>
            <td style="color:var(--accent);">Real-time</td>
          </tr>
          <tr>
            <td>Historical replay (1,316 markets)</td>
            <td>Full access</td>
            <td>Full access</td>
            <td>Full access</td>
          </tr>
          <tr>
            <td>/autopilot simulated P&L</td>
            <td>Daily snapshot</td>
            <td style="color:var(--accent);">Live, continuous</td>
            <td style="color:var(--accent);">Live, continuous</td>
          </tr>
          <tr>
            <td>/calibration audit charts</td>
            <td>Daily refresh</td>
            <td style="color:var(--accent);">Real-time</td>
            <td style="color:var(--accent);">Real-time</td>
          </tr>
          <tr>
            <td>Swing-event alerts</td>
            <td>—</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>CSV export</td>
            <td>—</td>
            <td>Predictions + Autopilot</td>
            <td>Full + Raw tick data</td>
          </tr>
          <tr>
            <td>API access keys</td>
            <td>—</td>
            <td>—</td>
            <td style="color:var(--accent);">Yes (Rate-limited)</td>
          </tr>
          <tr>
            <td>Empirical findings & methodology</td>
            <td>Full access</td>
            <td>Full access</td>
            <td>Full access</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <footer>
    <div>QuanterraOS Foundation · Infrastructure for Short-Duration Prediction Markets</div>
    <div><a href="/legal">Legal & Compliance</a> · <a href="/status">System Status</a></div>
  </footer>

</body>
</html>`;
}
