/**
 * QuanterraOS Standalone SMS Opt-In Page (/sms)
 *
 * Provides a dedicated, TCPA- and 10DLC-compliant capture portal
 * for operators and researchers seeking real-time text alerts.
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { SMS_MARKETING_DISCLOSURE } from "./sms-marketing.ts";

export function renderSmsOptInPageHtml(error?: string, success?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>SMS Market Telemetry &amp; Signal Alerts — QuanterraOS</title>
  <meta name="description" content="Subscribe to 10DLC-compliant, verified SMS updates for QuanterraOS short-duration crypto prediction market telemetry and calibration milestones.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-highlight: #111624;
      --border: rgba(212, 175, 55, 0.16);
      --border-subtle: rgba(212, 175, 55, 0.08);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --warning: #F43F5E;
      --text: #F8FAFC;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(223, 184, 67, 0.12), transparent 70%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 48px 48px, 48px 48px;
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
    }
    .nav-brand span { color: var(--accent); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 400; }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--text-dim); text-decoration: none; font-size: 0.85rem; transition: color 0.15s; }
    .nav-links a:hover { color: var(--text); }
    .btn-pricing {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      text-decoration: none;
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.15) 0%, rgba(163, 125, 36, 0.05) 100%);
      border: 1px solid rgba(223, 184, 67, 0.4);
      color: var(--accent-light);
    }

    .container {
      max-width: 680px;
      margin: 48px auto 0;
      padding: 0 24px;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.25);
      border-radius: 20px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--accent-light);
      margin-bottom: 20px;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
    }

    h1 {
      font-size: 2.1rem;
      font-weight: 700;
      line-height: 1.25;
      margin-bottom: 12px;
      background: linear-gradient(180deg, #FFFFFF 0%, #D1D5DB 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.lead {
      color: var(--text-dim);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
      position: relative;
    }

    .alert {
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 0.88rem;
      font-family: var(--font-mono);
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .alert-error {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid var(--warning);
      color: #FDA4AF;
    }
    .alert-success {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #86EFAC;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 28px;
    }
    .feature-pill {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 0.8rem;
    }
    .feature-pill strong {
      display: block;
      color: var(--accent-light);
      margin-bottom: 2px;
      font-family: var(--font-mono);
    }
    .feature-pill span { color: var(--text-dim); }

    .form-group {
      margin-bottom: 22px;
    }
    .form-group label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      font-family: var(--font-mono);
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 13px 16px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-group input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 10px var(--accent-glow);
    }
    .input-hint {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 6px;
      font-family: var(--font-mono);
    }

    /* Consent Checkbox Box */
    .consent-box {
      margin-top: 24px;
      margin-bottom: 24px;
      padding: 16px;
      background: rgba(223, 184, 67, 0.04);
      border: 1px solid rgba(223, 184, 67, 0.22);
      border-radius: 8px;
    }
    .consent-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 0.82rem;
      color: var(--text-dim);
      line-height: 1.5;
      cursor: pointer;
    }
    .consent-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      accent-color: var(--accent);
      cursor: pointer;
      flex-shrink: 0;
    }
    .consent-label strong {
      color: var(--text);
    }

    .btn-submit {
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(180deg, #FAF1D4 0%, #DFB843 40%, #B88E28 100%);
      border: 1px solid rgba(223, 184, 67, 0.6);
      border-radius: 6px;
      color: #06070A;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.9rem;
      letter-spacing: 0.02em;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(223, 184, 67, 0.25);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(223, 184, 67, 0.4);
    }

    .compliance-footer {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      color: var(--muted);
      line-height: 1.5;
    }
    .compliance-footer p {
      margin-bottom: 6px;
    }

    footer {
      max-width: 680px;
      margin: 64px auto 0;
      padding-top: 24px;
      border-top: 1px solid var(--border);
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
      <span>/ SMS TELEMETRY</span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/research">Research</a>
      <a href="/predictions">Predictions</a>
      <a href="/spread">Spread</a>
      <a href="/account">Account</a>
      <a href="/pricing" class="btn-pricing">Pricing</a>
    </div>
  </nav>

  <main class="container">
    <div class="header-badge">
      <span class="badge-dot"></span>
      10DLC REGISTERED A2P MESSAGING CAMPAIGN
    </div>

    <h1>Direct SMS Telemetry &amp; Signal Alerts</h1>
    <p class="lead">
      Receive real-time 15-minute crypto prediction market dispersion alerts, calibration milestone reports, and institutional fee drag analyses sent directly to your mobile terminal.
    </p>

    <div class="card">
      ${error ? `
        <div class="alert alert-error">
          <span>⚠</span>
          <div>${error}</div>
        </div>
      ` : ""}

      ${success ? `
        <div class="alert alert-success">
          <span>✔</span>
          <div>${success}</div>
        </div>
      ` : ""}

      <div class="feature-grid">
        <div class="feature-pill">
          <strong>Cross-Venue Basis Alerts</strong>
          <span>Instant alerts when cross-venue spot dispersion exceeds 30 bps.</span>
        </div>
        <div class="feature-pill">
          <strong>Calibration Surfaces</strong>
          <span>Weekly empirical Brier score updates across 1,316+ settled KXBTC15M windows.</span>
        </div>
        <div class="feature-pill">
          <strong>Release Intelligence</strong>
          <span>Model Context Protocol (MCP) server updates and institutional tier access.</span>
        </div>
        <div class="feature-pill">
          <strong>TCPA &amp; 10DLC Compliant</strong>
          <span>Zero cold texts. Instant 1-keyword STOP fulfillment guaranteed in code.</span>
        </div>
      </div>

      <form action="/api/sms/opt-in" method="POST">
        <div class="form-group">
          <label for="phone">MOBILE PHONE NUMBER (E.164 OR US 10-DIGIT)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="+1 (312) 555-0199"
            required
            autocomplete="tel"
          />
          <div class="input-hint">Standard format: +13125550199 or 3125550199 (U.S. / Canada).</div>
        </div>

        <div class="form-group">
          <label for="name">OPERATOR OR FIRM NAME (OPTIONAL)</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Michael Q. or Apex Alpha LLC"
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label for="interest">PRIMARY RESEARCH INTEREST</label>
          <select id="interest" name="interest">
            <option value="kalshi_15m">Kalshi KXBTC15M Basis &amp; Dispersion</option>
            <option value="polymarket_5m">Polymarket 5m/15m Latency Inefficiencies</option>
            <option value="mcp_tools">Model Context Protocol (MCP) Server Updates</option>
            <option value="all_telemetry">All Platform Releases &amp; Calibration Reports</option>
          </select>
        </div>

        <!-- Explicit Opt-In Checkbox (Unchecked by Default) -->
        <div class="consent-box">
          <label class="consent-label" for="smsConsent">
            <input type="checkbox" id="smsConsent" name="smsConsent" value="true" required />
            <span>
              <strong>${SMS_MARKETING_DISCLOSURE}</strong>
            </span>
          </label>
        </div>

        <button type="submit" class="btn-submit">
          SUBSCRIBE TO QUANTERRAOS SMS ALERTS →
        </button>

        <div class="compliance-footer">
          <p>
            <strong>Regulatory &amp; Carrier Disclosures:</strong> QuanterraOS marketing messages are transmitted over registered A2P 10DLC carrier routes under internal safety Rule B5 ($0.00 live exposure). We do not buy, rent, or scrape phone numbers. Your phone number is never shared with third parties.
          </p>
          <p>
            Reply <strong>STOP</strong> at any time to immediately cancel all text alerts. Reply <strong>HELP</strong> for assistance or email <a href="mailto:team@quanterraos.com" style="color:var(--accent);">team@quanterraos.com</a>. Message and data rates may apply. Frequency: approx 1–3 msgs/week.
          </p>
        </div>
      </form>
    </div>
  </main>

  <footer>
    <div>QuanterraOS Operational Foundation · 10DLC &amp; TCPA Compliant</div>
    <div><a href="/pricing">Pricing</a> · <a href="/legal">Legal</a> · <a href="/status">Status</a></div>
  </footer>

${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
