/**
 * QuanterraOS Account & Session Portal (/account)
 *
 * Provides self-serve account registration, login, tier inspection,
 * CSV download links, API key management (for Institutional), and Stripe billing portal link.
 */
import type { UserRecord, UserTier } from "./auth.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderAccountPageHtml(user: UserRecord | null, tier: UserTier, error?: string, success?: string): string {
  const isAuth = user !== null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Account &amp; Billing — QuanterraOS</title>
  <meta name="description" content="Manage your QuanterraOS subscription, API credentials, and data exports.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-highlight: #111624;
      --border: rgba(212, 175, 55, 0.16);
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
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(223, 184, 67, 0.1), transparent 70%),
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
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
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
      max-width: 800px;
      margin: 48px auto 0;
      padding: 0 24px;
    }

    .auth-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 36px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 12px 32px rgba(0, 0, 0, 0.45);
    }

    h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 8px;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    .subtitle {
      font-size: 0.95rem;
      color: var(--text-dim);
      margin-bottom: 28px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 24px;
      font-family: var(--font-mono);
    }
    .alert-error {
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid var(--warning);
      color: #FDA4AF;
    }
    .alert-success {
      background: rgba(223, 184, 67, 0.12);
      border: 1px solid var(--accent);
      color: var(--accent-light);
    }

    .status-badge {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-free { background: rgba(255, 255, 255, 0.08); color: var(--text-dim); border: 1px solid var(--border); }
    .badge-pro {
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.2) 0%, rgba(163, 125, 36, 0.08) 100%);
      color: var(--accent-light);
      border: 1px solid var(--accent);
    }
    .badge-institutional {
      background: linear-gradient(180deg, rgba(247, 231, 180, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
      color: #FFF0C2;
      border: 1px solid rgba(247, 231, 180, 0.5);
    }

    .grid-row {
      display: grid;
      grid-template-columns: 140px 1fr;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }
    .grid-label { color: var(--muted); font-family: var(--font-mono); font-size: 0.8rem; }
    .grid-val { color: var(--text); }

    .actions-bar {
      margin-top: 32px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-family: var(--font-mono);
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.15s, opacity 0.15s;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary {
      background: linear-gradient(180deg, #FBF3D5 0%, #DFB843 35%, #B88E28 100%);
      color: #07080B;
      font-weight: 700;
      border: 1px solid #DFB843;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 18px rgba(223, 184, 67, 0.35), 0 1px 3px rgba(0, 0, 0, 0.5);
    }
    .btn-secondary { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); color: var(--text); }
    .btn-danger { background: rgba(244, 63, 94, 0.1); border: 1px solid var(--warning); color: #FDA4AF; }

    /* Auth Form Tabs */
    .tabs-header {
      display: flex;
      border-bottom: 1px solid var(--border);
      margin-bottom: 28px;
    }
    .tab-btn {
      padding: 10px 20px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

    .form-group { margin-bottom: 20px; }
    .form-group label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      font-family: var(--font-mono);
    }
    .form-group input {
      width: 100%;
      padding: 12px 14px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 0.9rem;
      outline: none;
    }
    .form-group input:focus { border-color: var(--accent); }

    .downloads-box {
      margin-top: 28px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
    }
    .downloads-box h3 {
      font-size: 0.95rem;
      margin-bottom: 12px;
      color: var(--text);
    }
    .download-links {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .download-link {
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 0.82rem;
      text-decoration: underline;
    }

    footer {
      max-width: 800px;
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
      <span>/ ACCOUNT</span>
    </a>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/research">Research</a>
      <a href="/predictions">Predictions</a>
      <a href="/autopilot">Autopilot</a>
      <a href="/wallet">Wallet</a>
      <a href="/growth">Growth</a>
      <a href="/pricing" class="btn-pricing">Pricing</a>
    </div>
  </nav>

  <main class="container">
    ${error ? `<div class="alert alert-error">${error}</div>` : ""}
    ${success ? `<div class="alert alert-success">${success}</div>` : ""}

    ${isAuth ? `
      <!-- Authenticated View -->
      <div class="auth-card">
        <h1>Operator Console</h1>
        <p class="subtitle">Account parameters, active subscription tier, and authenticated telemetry routes.</p>

        <div class="grid-row">
          <div class="grid-label">OPERATOR EMAIL</div>
          <div class="grid-val font-mono">${user.email}</div>
        </div>

        <div class="grid-row">
          <div class="grid-label">ACTIVE TIER</div>
          <div class="grid-val">
            <span class="status-badge badge-${tier}">
              ${tier === "institutional" ? "INSTITUTIONAL API" : tier === "pro" ? "PRO TERMINAL" : tier === "plus" ? "TRADER PLUS" : "FREE EXPLORER"}
            </span>
          </div>
        </div>

        <div class="grid-row">
          <div class="grid-label">TELEMETRY ACCESS</div>
          <div class="grid-val">
            ${tier === "free" ? "20-minute delayed live feed · Full 1,316 historical replay" : "Sub-second real-time live feed active"}
          </div>
        </div>

        <div class="grid-row">
          <div class="grid-label">SAFETY GATE</div>
          <div class="grid-val font-mono" style="color:var(--accent);">RULE B5 LOCKED · $0.00 CAPITAL DEPLOYED</div>
        </div>

        
        <!-- Subscriber Sandbox Electronic Wallet -->
        <div class="downloads-box" style="margin-top: 20px; border-color: rgba(223,184,67,0.35); background: linear-gradient(135deg, rgba(20,27,38,0.7) 0%, rgba(12,15,23,0.7) 100%);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <h3 style="color:#FFFFFF; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                <span>💳</span> Subscriber Electronic Currency Wallet
              </h3>
              <p style="font-size:0.82rem; color:var(--text-dim);">
                Rule B5 paper sandbox wallet. Upload electronic test funds, simulate crypto withdrawals, and test prediction sizing risk-free.
              </p>
            </div>
            <a href="/wallet" class="btn btn-primary" style="display:inline-block; font-size:0.82rem; padding:8px 18px; text-decoration:none;">
              Launch Wallet Portal →
            </a>
          </div>
        </div>

        <!-- Growth Engine Card -->
        <div class="downloads-box" style="margin-top: 16px; border-color: rgba(94,234,212,0.35); background: linear-gradient(135deg, rgba(14,21,38,0.7) 0%, rgba(7,11,22,0.7) 100%);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <h3 style="color:#FFFFFF; margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                <span style="color:#5EEAD4;">⚡</span> QuanterraOS Growth Engine
              </h3>
              <p style="font-size:0.82rem; color:var(--text-dim);">
                Auditable B2B pipeline: Scout, Herald, Concierge, opt-in Voice Callback, and Sentinel supervisor backed by a tamper-evident consent ledger.
              </p>
            </div>
            <a href="/growth" class="btn btn-primary" style="display:inline-block; font-size:0.82rem; padding:8px 18px; text-decoration:none; background:#5EEAD4; color:#052B26;">
              Open Growth Engine →
            </a>
          </div>
        </div>

        <!-- Downloads & Data Exports (Gated) -->
        <div class="downloads-box">
          <h3>Authenticated Data Exports</h3>
          ${tier === "free" ? `
            <p style="font-size:0.85rem; color:var(--muted); margin-bottom: 12px;">
              Automated CSV exports require a Pro or Institutional subscription.
            </p>
            <a href="/pricing" class="btn btn-primary" style="display:inline-block; font-size:0.8rem; padding:8px 16px;">
              Upgrade to Unlock CSV Exports →
            </a>
          ` : `
            <div class="download-links">
              <a href="/api/export/predictions.csv" class="download-link">↓ Download Predictions Ledger CSV</a>
              <a href="/api/export/autopilot.csv" class="download-link">↓ Download Autopilot Paper Trades CSV</a>
              ${tier === "institutional" ? `
                <a href="/api/export/ticks.csv" class="download-link">↓ Download Raw Market Ticks CSV (19,740 rows)</a>
              ` : ""}
            </div>
          `}
        </div>

        <!-- Actions -->
        <div class="actions-bar">
          ${tier === "free" ? `
            <a href="/pricing" class="btn btn-primary">Upgrade Plan →</a>
          ` : `
            <form action="/api/billing/portal" method="POST" style="margin:0;">
              <button type="submit" class="btn btn-secondary">Manage Billing &amp; Invoices</button>
            </form>
          `}
          <form action="/api/auth/logout" method="POST" style="margin:0;">
            <button type="submit" class="btn btn-danger">Log Out</button>
          </form>
        </div>
      </div>
    ` : `
      <!-- Unauthenticated Login / Register -->
      <div class="auth-card">
        <h1>Clearance Terminal</h1>
        <p class="subtitle">Sign in or register an operator account to manage your QuanterraOS telemetry tier.</p>

        <!-- 1-Click Instant Test Operator Login -->
        <div style="margin-bottom: 24px; padding: 18px 20px; background: linear-gradient(135deg, rgba(223,184,67,0.14) 0%, rgba(14,19,26,0.85) 100%); border: 1px solid rgba(223,184,67,0.38); border-radius: 8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
            <div>
              <div style="font-weight:700; color:#FFFFFF; font-size:0.95rem; margin-bottom:3px; display:flex; align-items:center; gap:8px;">
                <span>⚡</span> Instant 1-Click Test Operator Login
              </div>
              <div style="font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
                Authenticate immediately as <strong>operator@quanterraos.com</strong> (PRO tier) to run test bids on Kalshi 15m.
              </div>
            </div>
            <form action="/api/auth/demo-login" method="POST" style="margin:0;">
              <button type="submit" class="btn btn-primary" style="padding:10px 18px; font-weight:700; font-size:0.85rem; white-space:nowrap; background:linear-gradient(180deg, #FAF1D4 0%, #DFB843 40%, #B88E28 100%); color:#000;">
                Log In As Test Operator →
              </button>
            </form>
          </div>
        </div>

        <div class="tabs-header">
          <button class="tab-btn active" id="tab-login" onclick="switchTab('login')">Sign In</button>
          <button class="tab-btn" id="tab-register" onclick="switchTab('register')">Create Account</button>
        </div>

        <!-- Login Form -->
        <form id="form-login" action="/api/auth/login" method="POST">
          <div class="form-group">
            <label for="login-email">OPERATOR EMAIL</label>
            <input type="email" id="login-email" name="email" placeholder="operator@firm.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="login-password">ACCESS KEY / PASSWORD</label>
            <input type="password" id="login-password" name="password" placeholder="••••••••••••" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">AUTHENTICATE SESSION →</button>
        </form>

        <!-- Register Form -->
        <form id="form-register" action="/api/auth/register" method="POST" style="display:none;">
          <div class="form-group">
            <label for="reg-email">OPERATOR EMAIL</label>
            <input type="email" id="reg-email" name="email" placeholder="operator@firm.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="reg-password">NEW PASSWORD (SCRYPT ENCRYPTED)</label>
            <input type="password" id="reg-password" name="password" placeholder="••••••••••••" required autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label for="reg-phone">MOBILE PHONE (OPTIONAL FOR SMS ALERTS)</label>
            <input type="tel" id="reg-phone" name="phone" placeholder="+1 (312) 555-0199" autocomplete="tel" />
          </div>
          <div style="margin-bottom: 22px; padding: 14px; background: rgba(223, 184, 67, 0.05); border: 1px solid rgba(223, 184, 67, 0.2); border-radius: 6px;">
            <label style="display:flex; align-items:flex-start; gap:10px; font-size:0.78rem; color:var(--text-dim); line-height:1.45; cursor:pointer;" for="reg-sms-optin">
              <input type="checkbox" id="reg-sms-optin" name="smsOptIn" value="true" style="width:16px; height:16px; margin-top:2px; accent-color:var(--accent); cursor:pointer; flex-shrink:0;" />
              <span>I agree to receive marketing texts from QuanterraOS. Message and data rates may apply. Message frequency varies. Reply STOP to unsubscribe, HELP for help.</span>
            </label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">CREATE OPERATOR ACCOUNT →</button>
        </form>
      </div>

      <script>
        function switchTab(mode) {
          const loginTab = document.getElementById('tab-login');
          const regTab = document.getElementById('tab-register');
          const loginForm = document.getElementById('form-login');
          const regForm = document.getElementById('form-register');
          if (mode === 'login') {
            loginTab.classList.add('active');
            regTab.classList.remove('active');
            loginForm.style.display = 'block';
            regForm.style.display = 'none';
          } else {
            loginTab.classList.remove('active');
            regTab.classList.add('active');
            loginForm.style.display = 'none';
            regForm.style.display = 'block';
          }
        }
      </script>
    `}
  </main>

  <footer>
    <div>QuanterraOS Operational Foundation · SEC Reg D &amp; CFTC 4.41 Compliant</div>
    <div><a href="/pricing">Pricing</a> · <a href="/legal">Legal</a></div>
  </footer>

${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
