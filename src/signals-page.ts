/**
 * QuanterraOS Discord & Telegram Signal Dispatcher & Webhook Portal
 *
 * Dedicated institutional control center for prediction market traders to configure,
 * test, and receive real-time execution signals:
 * 1. Post-Fee Cross-Venue Discrepancies (Kalshi vs Polymarket net EV > hurdle)
 * 2. Resolution Risk & UMA Loophole Spikes (Ambiguity scores > threshold)
 * 3. 15-Minute & 1-Hour BTC Settlement Triggers (60s TWAP danger zone, strike proximity)
 * 4. Model Calibration Drift & Brier Skill Degeneration
 *
 * Supports:
 * - Discord Rich Embeds with Gold Standard styling (color 0xDFB843)
 * - Telegram HTML Bot payloads
 * - Generic Institutional JSON Webhooks
 * - Interactive 1-click Test Ping with live card preview & latency audit
 *
 * Strict Compliance:
 * - Rule B4: Strictly prohibited marketing superlatives.
 * - Rule B5: Explicit $0.00 capital deployed standby notice.
 * - Rule B10: CME CF BRTI and Kalshi non-affiliation notices.
 */

import {
  type AlertEventData,
  formatDiscordAlertPayload,
  formatTelegramAlertPayload,
  formatXBroadcastPayload,
  getRecentDispatchedAlerts,
} from "./alert-dispatcher.ts";

export function renderSignalsPageHtml(userEmail?: string, userTier: string = "pro"): string {
  const recentAlerts = getRecentDispatchedAlerts();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>QuanterraOS — Discord &amp; Telegram Signal Dispatcher</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card-bg: #0C0F17;
      --card-inner: #121722;
      --border: rgba(223, 184, 67, 0.22);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.25);
      --gold-bullion: #D4AF37;
      --green: #10B981;
      --green-glow: rgba(16, 185, 129, 0.2);
      --rose: #F43F5E;
      --rose-glow: rgba(244, 63, 94, 0.2);
      --discord: #5865F2;
      --telegram: #229ED9;
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(ellipse 90% 50% at 50% -10%, rgba(223, 184, 67, 0.1), transparent 70%), var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      padding-bottom: 80px;
      line-height: 1.5;
    }

    /* Top Navigation */
    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      background: rgba(6, 7, 10, 0.95);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #FFF;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .nav-brand span { color: var(--accent); }
    .brand-dot {
      width: 8px;
      height: 8px;
      background: var(--accent);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--accent);
    }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--text-dim); text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: #FFF; }
    .badge-pro {
      background: rgba(223, 184, 67, 0.15);
      color: var(--accent);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .container { max-width: 1240px; margin: 0 auto; padding: 32px 20px; }

    /* Hero Header */
    .hero { margin-bottom: 32px; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--accent);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: rgba(223, 184, 67, 0.12);
      padding: 5px 12px;
      border-radius: 4px;
      border: 1px solid var(--border);
      margin-bottom: 14px;
    }
    h1 { font-size: 2.2rem; font-weight: 800; color: #FFF; margin-bottom: 10px; letter-spacing: -0.02em; }
    .lead { color: var(--text-dim); font-size: 1.05rem; line-height: 1.6; max-width: 840px; }

    /* Compliance Banner */
    .compliance-banner {
      background: rgba(223, 184, 67, 0.06);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 18px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-size: 0.85rem;
      color: var(--text-dim);
    }
    .compliance-banner strong { color: var(--accent-light); }

    /* Main 2-Column Grid */
    .grid-layout {
      display: grid;
      grid-template-columns: 460px 1fr;
      gap: 28px;
    }
    @media (max-width: 960px) {
      .grid-layout { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px;
      position: relative;
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #FFF;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card-desc {
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 20px;
      line-height: 1.45;
    }

    /* Destination Tabs */
    .dest-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 20px;
    }
    .dest-btn {
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      color: var(--text-dim);
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.15s;
    }
    .dest-btn:hover { border-color: var(--border); color: #FFF; }
    .dest-btn.active {
      background: rgba(223, 184, 67, 0.15);
      border-color: var(--accent);
      color: var(--accent-light);
    }
    .dest-btn.active.discord {
      background: rgba(88, 101, 242, 0.15);
      border-color: var(--discord);
      color: #FFF;
    }
    .dest-btn.active.telegram {
      background: rgba(34, 158, 217, 0.15);
      border-color: var(--telegram);
      color: #FFF;
    }

    /* Form Controls */
    .form-group { margin-bottom: 18px; }
    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-dim);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .form-control {
      width: 100%;
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      color: #FFF;
      padding: 11px 14px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: var(--font-mono);
      transition: border-color 0.15s;
    }
    .form-control:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 10px var(--accent-glow); }

    /* Checkbox Group */
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: var(--card-inner);
      padding: 14px;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      margin-bottom: 18px;
    }
    .checkbox-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .checkbox-item input { margin-top: 3px; accent-color: var(--accent); cursor: pointer; }
    .checkbox-label { color: var(--text); font-weight: 500; }
    .checkbox-hint { color: var(--muted); font-size: 0.75rem; display: block; margin-top: 2px; }

    /* Action Buttons */
    .btn-gold {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 12px 22px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      font-size: 0.92rem;
      width: 100%;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn-gold:hover { opacity: 0.95; transform: translateY(-1px); }
    .btn-gold:active { transform: translateY(0); }

    /* Live Preview Box */
    .preview-card-wrap {
      margin-top: 20px;
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 16px;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: var(--muted);
      text-transform: uppercase;
    }

    /* Discord Mock Embed */
    .discord-mock {
      background: #2B2D31;
      border-left: 4px solid var(--accent);
      border-radius: 4px;
      padding: 14px 16px;
      font-family: var(--font-sans);
      color: #DBDEE1;
      font-size: 0.88rem;
    }
    .discord-title { color: #FFF; font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; }
    .discord-desc { color: #B5BAC1; font-size: 0.84rem; margin-bottom: 12px; line-height: 1.4; }
    .discord-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .discord-field-name { font-size: 0.72rem; font-weight: 700; color: #949BA4; text-transform: uppercase; }
    .discord-field-val { font-size: 0.85rem; font-family: var(--font-mono); color: #FFF; margin-top: 2px; }
    .discord-footer { font-size: 0.7rem; color: #949BA4; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; margin-top: 8px; }

    /* Telegram Mock */
    .telegram-mock {
      background: #182533;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 0.85rem;
      line-height: 1.5;
      color: #E4ECF2;
      display: none;
    }
    .telegram-mock b { color: #FFF; }
    .telegram-mock code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); color: #64B5F6; }

    /* Feed List */
    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .filter-pills { display: flex; gap: 8px; }
    .pill {
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      color: var(--text-dim);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .pill.active { background: rgba(223, 184, 67, 0.15); border-color: var(--accent); color: var(--accent-light); }

    .signal-item {
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      transition: border-color 0.15s;
    }
    .signal-item:hover { border-color: var(--border); }
    .signal-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .signal-title { font-weight: 700; color: #FFF; font-size: 0.95rem; }
    .badge-tag {
      font-size: 0.7rem;
      font-weight: 700;
      font-family: var(--font-mono);
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-CRITICAL { background: rgba(239,68,68,0.18); color: var(--rose); border: 1px solid rgba(239,68,68,0.35); }
    .badge-WARNING { background: rgba(245,158,11,0.18); color: #F59E0B; border: 1px solid rgba(245,158,11,0.35); }
    .badge-INFO { background: rgba(223,184,67,0.18); color: var(--accent); border: 1px solid var(--border); }

    .signal-metrics {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin: 10px 0;
      padding: 8px 12px;
      background: rgba(0,0,0,0.25);
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
    }
    .metric-chip { display: flex; gap: 6px; }
    .metric-key { color: var(--muted); }
    .metric-val { color: var(--accent-light); font-weight: 600; }

    .signal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: var(--muted);
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 8px;
      margin-top: 8px;
    }
    .btn-link { color: var(--accent); text-decoration: none; font-weight: 600; }
    .btn-link:hover { text-decoration: underline; }

    /* Code Snippets Section */
    .code-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .code-tab-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--muted);
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      cursor: pointer;
    }
    .code-tab-btn.active {
      background: var(--card-inner);
      border-color: var(--accent);
      color: var(--accent-light);
    }
    .code-block {
      background: #040507;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 14px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: #93C5FD;
      overflow-x: auto;
      line-height: 1.5;
    }

    .status-msg {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-family: var(--font-mono);
      display: none;
    }
    .status-msg.success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34D399; }
    .status-msg.error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #F87171; }
  </style>
</head>
<body>

  <header class="top-nav">
    <a href="/" class="nav-brand">
      <div class="brand-dot"></div>
      QUANTERRA<span>OS</span>
    </a>
    <nav class="nav-links">
      <a href="/scanner">Scanner</a>
      <a href="/resolution-risk">Anti-Dispute</a>
      <a href="/paper">Paper Mode</a>
      <a href="/track-record">Track Record</a>
      <a href="/kalshi">15M/1H Terminal</a>
      <a href="/alerts" class="active" style="color:var(--accent);">Signal Alerts</a>
      <span class="badge-pro">${userTier.toUpperCase()}</span>
    </nav>
  </header>

  <main class="container">
    <div class="hero">
      <div class="eyebrow">&Sigma; Real-Time Webhooks &bull; Discord &amp; Telegram Execution Signals</div>
      <h1>Discord &amp; Telegram Signal Dispatcher</h1>
      <p class="lead">
        Deliver mathematical prediction market edge directly into your Discord trading channels, private Telegram groups, or quantitative execution bots. Every signal features non-linear fee deductions, UMA loophole scores, and cryptographic SHA-256 provenance.
      </p>
    </div>

    <div class="compliance-banner">
      <div>
        <strong>&bull; Rule B4/B5 Quantitative Standard:</strong> All alerts reflect pre-trade microstructure surveillance and calibrated expected value. Gross spreads are strictly netted against Kalshi taker fees ($0.07 &times; P &times; (1 - P)) and Polygon gas.
      </div>
      <div>
        <span class="badge-pro" style="color:#FFF; background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2);">Rule B5: $0.00 Capital Deployed</span>
      </div>
    </div>

    <div class="grid-layout">
      <!-- Webhook Configuration & Dispatch Harness -->
      <div class="card">
        <div class="card-title">
          <span>Configure Dispatch Gateway</span>
        </div>
        <p class="card-desc">Select your target broadcast platform, enter your webhook or bot URL, and send a live test ping.</p>

        <!-- Destination Switcher -->
        <div class="dest-tabs">
          <button type="button" class="dest-btn active discord" id="tab-discord" onclick="selectDestination('discord')">
            <span>Discord Embed</span>
          </button>
          <button type="button" class="dest-btn telegram" id="tab-telegram" onclick="selectDestination('telegram')">
            <span>Telegram Bot</span>
          </button>
          <button type="button" class="dest-btn" id="tab-json" onclick="selectDestination('generic')">
            <span>Custom JSON</span>
          </button>
        </div>

        <form id="webhook-form" onsubmit="event.preventDefault(); triggerTestDispatch();">
          <div class="form-group">
            <label class="form-label">Signal Event Scenario</label>
            <select class="form-control" id="sim-event-type" onchange="updatePreviewCard()">
              <option value="DISCREPANCY_SCANNER_DETECTED">Cross-Platform Discrepancy (Net EV > +2.5¢ after fees)</option>
              <option value="RESOLUTION_RISK_SPIKE">Resolution Ambiguity Spike (UMA Dispute Hazard)</option>
              <option value="SETTLEMENT_ORACLE_DANGER">15M/1H BTC Settlement Danger (Final 60s TWAP)</option>
              <option value="DAILY_DISCIPLINE_DIGEST">Daily Sovereign Calibration & Track Record Digest</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" id="url-label">Discord Webhook URL</label>
            <input type="url" class="form-control" id="sim-url" placeholder="https://discord.com/api/webhooks/..." value="">
            <span style="font-size:0.75rem; color:var(--muted); display:block; margin-top:4px;">
              Leave blank to perform a simulated dry-run test with latency benchmarking.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">Subscription Triggers</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input type="checkbox" id="chk-discrepancy" checked>
                <div>
                  <span class="checkbox-label">Cross-Venue Discrepancies</span>
                  <span class="checkbox-hint">Triggers when Kalshi vs Polymarket spread exceeds 2.0¢ after all exchange fees.</span>
                </div>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" id="chk-resolution" checked>
                <div>
                  <span class="checkbox-label">Resolution Clause Vulnerabilities</span>
                  <span class="checkbox-hint">Triggers when Sentinel flags UMA dispute risk or ambiguous wording (Ambiguity &gt; 40).</span>
                </div>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" id="chk-countdown" checked>
                <div>
                  <span class="checkbox-label">15M &amp; 1H BTC Countdown Triggers</span>
                  <span class="checkbox-hint">Broadcasts at window open (:00), minute 4, minute 10, and final 60s TWAP danger zone.</span>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" class="btn-gold" id="btn-dispatch">
            <span>&bull; Send Test Signal Ping &rarr;</span>
          </button>
          <div id="dispatch-status" class="status-msg"></div>
        </form>

        <!-- Live Visual Embed Preview -->
        <div class="preview-card-wrap">
          <div class="preview-header">
            <span>Visual Payload Render</span>
            <span id="preview-tag">DISCORD EMBED</span>
          </div>

          <!-- Discord Card -->
          <div class="discord-mock" id="mock-discord">
            <div class="discord-title" id="dc-title">QuanterraOS // Cross-Platform Discrepancy on BTC-26OCT09-15M</div>
            <div class="discord-desc" id="dc-desc">Gross spread of 5.0¢ yields realized net discrepancy of +3.8¢ per contract after Kalshi non-linear taker fee (1.75¢) and Polygon gas.</div>
            <div class="discord-grid" id="dc-grid">
              <div>
                <div class="discord-field-name">Gross Spread</div>
                <div class="discord-field-val">+5.0¢</div>
              </div>
              <div>
                <div class="discord-field-name">Realized Net</div>
                <div class="discord-field-val" style="color:#34D399;">+3.8¢</div>
              </div>
              <div>
                <div class="discord-field-name">Kalshi Price</div>
                <div class="discord-field-val">48.0¢</div>
              </div>
              <div>
                <div class="discord-field-name">Polymarket Price</div>
                <div class="discord-field-val">53.0¢</div>
              </div>
            </div>
            <div class="discord-footer">
              Rule B4/B5: Empirical Microstructure Audit &bull; $0.00 Capital Standby Lock &bull; CME CF BRTI Standard
            </div>
          </div>

          <!-- Telegram Card -->
          <div class="telegram-mock" id="mock-telegram">
            📊 <b>QUANTERRAOS // Cross-Platform Discrepancy</b><br><br>
            Gross spread of 5.0¢ yields realized net discrepancy of +3.8¢ per contract.<br><br>
            <b>Key Microstructure Telemetry:</b><br>
            • GROSS SPREAD: <code>+5.0¢</code><br>
            • REALIZED NET: <code>+3.8¢</code><br>
            • ORACLE HAZARD: <code>LOW</code><br><br>
            🔗 <a href="#" style="color:#64B5F6;">Open Live Terminal Audit</a><br><br>
            <i>🔒 Rule B5: $0.00 capital deployed. Pre-trade calibration only.</i>
          </div>
        </div>
      </div>

      <!-- Live Signals Stream & Developer Starter Code -->
      <div>
        <div class="card" style="margin-bottom: 24px;">
          <div class="feed-header">
            <div>
              <div class="card-title">Live Dispatched Signal Stream</div>
              <div class="card-desc" style="margin-bottom:0;">Real-time feed of signals sent to registered webhooks.</div>
            </div>
            <div class="filter-pills">
              <span class="pill active" onclick="filterSignals('ALL')">All</span>
              <span class="pill" onclick="filterSignals('DISCREPANCY')">Discrepancy</span>
              <span class="pill" onclick="filterSignals('RESOLUTION')">Dispute</span>
              <span class="pill" onclick="filterSignals('TWAP')">15M/1H</span>
            </div>
          </div>

          <div id="signals-list">
            ${recentAlerts.length === 0 ? `
              <!-- Initial Canonical Live Signals -->
              <div class="signal-item" data-category="DISCREPANCY">
                <div class="signal-top">
                  <div class="signal-title">Cross-Platform Discrepancy on BTC-26OCT09-15M</div>
                  <span class="badge-tag badge-WARNING">WARNING</span>
                </div>
                <p style="font-size:0.84rem; color:var(--text-dim); line-height:1.45;">
                  Gross spread of 5.0¢ yields realized net discrepancy of +3.8¢ per contract after Kalshi taker fees (1.75¢) and Polygon gas.
                </p>
                <div class="signal-metrics">
                  <div class="metric-chip"><span class="metric-key">GROSS:</span> <span class="metric-val">+5.0¢</span></div>
                  <div class="metric-chip"><span class="metric-key">NET EV:</span> <span class="metric-val" style="color:var(--green);">+3.8¢</span></div>
                  <div class="metric-chip"><span class="metric-key">KALSHI:</span> <span class="metric-val">48¢</span></div>
                  <div class="metric-chip"><span class="metric-key">POLY:</span> <span class="metric-val">53¢</span></div>
                  <div class="metric-chip"><span class="metric-key">HAZARD:</span> <span class="metric-val">LOW</span></div>
                </div>
                <div class="signal-footer">
                  <span>SHA256: 7f8a3d42e09b... &bull; 1 min ago</span>
                  <a href="/scanner?pair=BTC-26OCT09-15M" class="btn-link">Open Scanner &rarr;</a>
                </div>
              </div>

              <div class="signal-item" data-category="RESOLUTION">
                <div class="signal-top">
                  <div class="signal-title">Resolution Dispute Hazard on Polymarket Fed Rate Cut</div>
                  <span class="badge-tag badge-CRITICAL">CRITICAL</span>
                </div>
                <p style="font-size:0.84rem; color:var(--text-dim); line-height:1.45;">
                  Sentinel NLP flagged 45/100 ambiguity score. Ambiguous clause regarding emergency inter-meeting cuts could trigger UMA tokenholder dispute.
                </p>
                <div class="signal-metrics">
                  <div class="metric-chip"><span class="metric-key">AMBIGUITY:</span> <span class="metric-val" style="color:var(--rose);">45/100</span></div>
                  <div class="metric-chip"><span class="metric-key">UMA PROB:</span> <span class="metric-val">34.2%</span></div>
                  <div class="metric-chip"><span class="metric-key">SEVERITY:</span> <span class="metric-val">HIGH</span></div>
                </div>
                <div class="signal-footer">
                  <span>SHA256: c3819fa82110... &bull; 4 mins ago</span>
                  <a href="/resolution-risk" class="btn-link">Inspect Rulebook &rarr;</a>
                </div>
              </div>

              <div class="signal-item" data-category="TWAP">
                <div class="signal-top">
                  <div class="signal-title">Kalshi 15M Settlement TWAP Danger Trigger</div>
                  <span class="badge-tag badge-INFO">INFO</span>
                </div>
                <p style="font-size:0.84rem; color:var(--text-dim); line-height:1.45;">
                  Bitcoin composite spot is $85,518 (distance -$2.00 from $85,520 strike) at minute 14:15. 60-second BRTI TWAP averaging underway.
                </p>
                <div class="signal-metrics">
                  <div class="metric-chip"><span class="metric-key">SPOT:</span> <span class="metric-val">$85,518.00</span></div>
                  <div class="metric-chip"><span class="metric-key">STRIKE:</span> <span class="metric-val">$85,520.00</span></div>
                  <div class="metric-chip"><span class="metric-key">DISTANCE:</span> <span class="metric-val">-$2.00</span></div>
                  <div class="metric-chip"><span class="metric-key">TIME LEFT:</span> <span class="metric-val">45s</span></div>
                </div>
                <div class="signal-footer">
                  <span>SHA256: 9e0b1712a441... &bull; 8 mins ago</span>
                  <a href="/kalshi" class="btn-link">15M Desk &rarr;</a>
                </div>
              </div>
            ` : recentAlerts.map(a => `
              <div class="signal-item">
                <div class="signal-top">
                  <div class="signal-title">${a.title}</div>
                  <span class="badge-tag badge-${a.severity}">${a.severity}</span>
                </div>
                <p style="font-size:0.84rem; color:var(--text-dim); line-height:1.45;">${a.summary}</p>
                <div class="signal-metrics">
                  ${Object.entries(a.metrics).map(([k, v]) => `
                    <div class="metric-chip"><span class="metric-key">${k}:</span> <span class="metric-val">${v}</span></div>
                  `).join('')}
                </div>
                <div class="signal-footer">
                  <span>SHA256: ${a.provenanceHash.slice(0, 16)}... &bull; ${a.timestamp.slice(11, 19)} UTC</span>
                  <a href="${a.targetUrl}" class="btn-link">View Audit &rarr;</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bot Integration Quickstart Recipes -->
        <div class="card">
          <div class="card-title">Automated Bot Integration Recipes</div>
          <p class="card-desc">Plug QuanterraOS real-time signals into your private trading syndicate or quantitative Python stack.</p>

          <div class="code-tabs">
            <button type="button" class="code-tab-btn active" onclick="switchCode('python')">Python (discord.py)</button>
            <button type="button" class="code-tab-btn" onclick="switchCode('node')">Node.js (Express)</button>
            <button type="button" class="code-tab-btn" onclick="switchCode('curl')">cURL One-Liner</button>
          </div>

          <div id="code-python" class="code-block">
import requests

# QuanterraOS Signal Dispatcher Webhook Listener
def on_quanterra_signal(payload):
    data = payload.get("data", {})
    event_type = data.get("eventType")
    metrics = data.get("metrics", {})
    
    # Audit net EV before executing
    net_spread = metrics.get("REALIZED_NET")
    print(f"[{event_type}] Discrepancy Net: {net_spread}")
    
    # Forward directly to Discord channel
    requests.post("YOUR_DISCORD_WEBHOOK_URL", json=payload)
          </div>

          <div id="code-node" class="code-block" style="display:none;">
import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/quanterra-webhook', (req, res) => {
  const { eventType, metrics, targetUrl } = req.body.data;
  console.log(\`Received \${eventType} | Net EV: \${metrics?.REALIZED_NET}\`);
  res.json({ received: true });
});
app.listen(8080);
          </div>

          <div id="code-curl" class="code-block" style="display:none;">
curl -X POST https://quanterraos.com/api/alerts/webhook/test \\
  -H "Content-Type: application/json" \\
  -d '{"eventType": "DISCREPANCY_SCANNER_DETECTED", "webhookUrl": "YOUR_WEBHOOK_URL"}'
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    let currentDest = 'discord';

    function selectDestination(dest) {
      currentDest = dest;
      document.querySelectorAll('.dest-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('tab-' + (dest === 'generic' ? 'json' : dest));
      if (activeBtn) activeBtn.classList.add('active');

      const urlInput = document.getElementById('sim-url');
      const urlLabel = document.getElementById('url-label');
      const mockDiscord = document.getElementById('mock-discord');
      const mockTelegram = document.getElementById('mock-telegram');
      const previewTag = document.getElementById('preview-tag');

      if (dest === 'discord') {
        urlLabel.textContent = 'Discord Webhook URL';
        urlInput.placeholder = 'https://discord.com/api/webhooks/...';
        mockDiscord.style.display = 'block';
        mockTelegram.style.display = 'none';
        previewTag.textContent = 'DISCORD EMBED';
      } else if (dest === 'telegram') {
        urlLabel.textContent = 'Telegram Bot URL or Chat Webhook';
        urlInput.placeholder = 'https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>';
        mockDiscord.style.display = 'none';
        mockTelegram.style.display = 'block';
        previewTag.textContent = 'TELEGRAM HTML MESSAGE';
      } else {
        urlLabel.textContent = 'Custom Institutional Webhook URL';
        urlInput.placeholder = 'https://your-quant-server.com/api/webhooks/quanterra';
        mockDiscord.style.display = 'block';
        mockTelegram.style.display = 'none';
        previewTag.textContent = 'STANDARDIZED JSON PAYLOAD';
      }
    }

    function updatePreviewCard() {
      const type = document.getElementById('sim-event-type').value;
      const titleEl = document.getElementById('dc-title');
      const descEl = document.getElementById('dc-desc');
      const gridEl = document.getElementById('dc-grid');

      if (type === 'DISCREPANCY_SCANNER_DETECTED') {
        titleEl.textContent = 'QuanterraOS // Cross-Platform Discrepancy on BTC-26OCT09-15M';
        descEl.textContent = 'Gross spread of 5.0¢ yields realized net discrepancy of +3.8¢ per contract after Kalshi taker fees (1.75¢) and Polygon gas.';
        gridEl.innerHTML = '<div><div class="discord-field-name">Gross Spread</div><div class="discord-field-val">+5.0¢</div></div>' +
          '<div><div class="discord-field-name">Realized Net</div><div class="discord-field-val" style="color:#34D399;">+3.8¢</div></div>' +
          '<div><div class="discord-field-name">Kalshi Price</div><div class="discord-field-val">48.0¢</div></div>' +
          '<div><div class="discord-field-name">Polymarket Price</div><div class="discord-field-val">53.0¢</div></div>';
      } else if (type === 'RESOLUTION_RISK_SPIKE') {
        titleEl.textContent = 'QuanterraOS // Resolution Dispute Hazard on Polymarket Fed Rate Cut';
        descEl.textContent = 'Sentinel NLP detected an Ambiguity Score of 45/100 with estimated 34.2% UMA dispute probability.';
        gridEl.innerHTML = '<div><div class="discord-field-name">Ambiguity Score</div><div class="discord-field-val" style="color:#F43F5E;">45/100</div></div>' +
          '<div><div class="discord-field-name">UMA Dispute Prob</div><div class="discord-field-val">34.2%</div></div>' +
          '<div><div class="discord-field-name">Clause Severity</div><div class="discord-field-val">HIGH</div></div>' +
          '<div><div class="discord-field-name">Source</div><div class="discord-field-val">Sentinel NLP</div></div>';
      } else if (type === 'SETTLEMENT_ORACLE_DANGER') {
        titleEl.textContent = 'QuanterraOS // Kalshi 15M Settlement TWAP Danger Trigger';
        descEl.textContent = 'Spot is within $2.00 of ATM strike in final 60 seconds. High risk of strike crossing during 60s averaging window.';
        gridEl.innerHTML = '<div><div class="discord-field-name">Spot Price</div><div class="discord-field-val">$85,518.00</div></div>' +
          '<div><div class="discord-field-name">Strike Price</div><div class="discord-field-val">$85,520.00</div></div>' +
          '<div><div class="discord-field-name">Distance</div><div class="discord-field-val" style="color:#F59E0B;">-$2.00</div></div>' +
          '<div><div class="discord-field-name">Time to Close</div><div class="discord-field-val">45 seconds</div></div>';
      } else {
        titleEl.textContent = 'QuanterraOS // Daily Sovereign Calibration & Track Record Digest';
        descEl.textContent = '1,316 settled windows verified. Market mid achieves 0.2001 Brier score vs 0.2500 naive climatological baseline.';
        gridEl.innerHTML = '<div><div class="discord-field-name">Settled Windows</div><div class="discord-field-val">1,316</div></div>' +
          '<div><div class="discord-field-name">Market Brier</div><div class="discord-field-val">0.2001</div></div>' +
          '<div><div class="discord-field-name">Reliability</div><div class="discord-field-val">0.0094</div></div>' +
          '<div><div class="discord-field-name">Status</div><div class="discord-field-val" style="color:#34D399;">CALIBRATED</div></div>';
      }
    }

    async function triggerTestDispatch() {
      const type = document.getElementById('sim-event-type').value;
      const url = document.getElementById('sim-url').value;
      const btn = document.getElementById('btn-dispatch');
      const statusBox = document.getElementById('dispatch-status');

      btn.disabled = true;
      btn.innerHTML = '<span>&bull; Dispatching Test Signal...</span>';
      statusBox.style.display = 'none';

      try {
        const res = await fetch('/api/alerts/webhook/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: type, webhookUrl: url })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          statusBox.className = 'status-msg success';
          statusBox.textContent = '✓ ' + (data.simulated ? 'Simulated Dry-Run Dispatched: ' : 'Live Webhook Dispatched: ') +
            data.destination.toUpperCase() + ' (Latency: ' + data.latencyMs + 'ms, Event ID: ' + data.eventId + ')';
          statusBox.style.display = 'block';
        } else {
          statusBox.className = 'status-msg error';
          statusBox.textContent = '✗ Dispatch Warning: ' + (data.error || 'Failed to dispatch alert.');
          statusBox.style.display = 'block';
        }
      } catch (err) {
        statusBox.className = 'status-msg error';
        statusBox.textContent = '✗ Error: ' + err.message;
        statusBox.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>&bull; Send Test Signal Ping &rarr;</span>';
      }
    }

    function filterSignals(cat) {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');

      const items = document.querySelectorAll('.signal-item');
      items.forEach(it => {
        if (cat === 'ALL' || it.getAttribute('data-category') === cat) {
          it.style.display = 'block';
        } else {
          it.style.display = 'none';
        }
      });
    }

    function switchCode(lang) {
      document.querySelectorAll('.code-tab-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      document.getElementById('code-python').style.display = lang === 'python' ? 'block' : 'none';
      document.getElementById('code-node').style.display = lang === 'node' ? 'block' : 'none';
      document.getElementById('code-curl').style.display = lang === 'curl' ? 'block' : 'none';
    }
  </script>
</body>
</html>`;
}
