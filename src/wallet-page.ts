/**
 * QuanterraOS Subscriber Electronic Currency Wallet Portal (/wallet)
 *
 * Implements:
 * 1. Sandboxed electronic currency wallet ($0.00 live exposure, Rule B5 compliant).
 * 2. Visual portfolio balance cards (Total Equity, Cash USD, Bitcoin Holdings, Spot Price).
 * 3. Interactive Deposit ("Upload Electronic Currency") and Withdrawal forms.
 * 4. Transaction audit trail with simulated blockchain transaction hashes.
 * 5. Instant reset capability to default demo allocation.
 * 6. Full Gold Standard aesthetic with Obsidian & Bullion Gold styling.
 * 7. Aria Concierge embedded on page.
 */

import type { WalletSummary } from "./wallet-engine.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderWalletPageHtml(summary: WalletSummary, notice?: { type: "success" | "error"; message: string }): string {
  const { wallet, btcPriceUsd, totalEquityUsd, availableCashUsd, btcHoldings, btcValueUsd, recentTransactions } = summary;

  const formattedTotal = totalEquityUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedCash = availableCashUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedBtcValue = btcValueUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedBtcPrice = btcPriceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Subscriber Electronic Currency Wallet — QuanterraOS</title>
  <meta name="description" content="Manage simulated electronic currency, upload paper funds, and execute test withdrawals in the QuanterraOS sandbox wallet.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --card-inner: #111624;
      --border: rgba(212, 175, 55, 0.16);
      --border-focus: #DFB843;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --accent-glow: rgba(223, 184, 67, 0.22);
      --gold-bullion: #D4AF37;
      --success: #10B981;
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
      padding-bottom: 90px;
    }
    .mono { font-family: var(--font-mono); }

    /* Nav */
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 40px;
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
    .nav-brand-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: rgba(223, 184, 67, 0.15);
      border: 1px solid var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .nav-brand span { color: var(--accent); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 400; }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--text-dim); text-decoration: none; font-size: 0.85rem; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .nav-links a.active { color: var(--accent); font-weight: 600; }
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
      max-width: 1100px;
      margin: 36px auto 0;
      padding: 0 24px;
    }

    /* Governance Banner */
    .governance-strip {
      background: rgba(223, 184, 67, 0.07);
      border: 1px solid rgba(223, 184, 67, 0.35);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.15);
      border-radius: 8px;
      padding: 12px 18px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .gov-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      background: rgba(223, 184, 67, 0.2);
      border: 1px solid var(--accent);
      color: var(--accent-light);
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .gov-text {
      font-size: 0.8rem;
      color: var(--text-dim);
      flex: 1;
    }
    .gov-reset-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--text-dim);
      font-size: 0.75rem;
      font-family: var(--font-mono);
      padding: 5px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .gov-reset-btn:hover {
      border-color: var(--warning);
      color: #FDA4AF;
      background: rgba(244, 63, 94, 0.1);
    }

    /* Notice Alert */
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
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid var(--success);
      color: #6EE7B7;
    }

    /* Stat Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
      margin-bottom: 32px;
    }
    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 500px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 24px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
    }
    .stat-card-featured {
      border-color: rgba(223, 184, 67, 0.45);
      background: linear-gradient(135deg, rgba(20, 27, 38, 0.95) 0%, rgba(12, 15, 23, 0.95) 100%);
      box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25), 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(223, 184, 67, 0.12);
    }
    .stat-card-featured::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #DFB843, transparent);
    }
    .stat-label {
      font-size: 0.72rem;
      color: var(--text-dim);
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 1.55rem;
      font-weight: 700;
      color: #FFFFFF;
      font-family: var(--font-mono);
      letter-spacing: -0.02em;
    }
    .stat-value-gold { color: var(--accent-light); }
    .stat-sub {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 6px;
      font-family: var(--font-mono);
    }

    /* Main Console Split */
    .console-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 36px;
    }
    @media (max-width: 820px) {
      .console-split { grid-template-columns: 1fr; }
    }

    .action-panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 26px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 10px 28px rgba(0, 0, 0, 0.45);
    }
    .action-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 14px;
    }
    .action-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-badge {
      font-size: 0.65rem;
      padding: 2px 7px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-deposit {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #6EE7B7;
    }
    .badge-withdraw {
      background: rgba(223, 184, 67, 0.15);
      border: 1px solid rgba(223, 184, 67, 0.4);
      color: var(--accent-light);
    }

    .form-group {
      margin-bottom: 18px;
    }
    .form-label {
      display: block;
      font-size: 0.76rem;
      font-family: var(--font-mono);
      color: var(--text-dim);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .currency-selector {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .curr-btn {
      background: var(--card-inner);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 8px 10px;
      color: var(--text-dim);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .curr-btn:hover {
      border-color: rgba(223, 184, 67, 0.4);
      color: var(--text);
    }
    .curr-btn.active {
      background: rgba(223, 184, 67, 0.15);
      border-color: var(--accent);
      color: var(--accent-light);
      box-shadow: 0 0 12px rgba(223, 184, 67, 0.2);
    }

    .chip-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .amount-chip {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 4px 10px;
      font-size: 0.72rem;
      font-family: var(--font-mono);
      color: var(--text-dim);
      cursor: pointer;
      transition: all 0.15s;
    }
    .amount-chip:hover {
      border-color: var(--accent);
      color: var(--accent-light);
      background: rgba(223, 184, 67, 0.08);
    }

    .input-field {
      width: 100%;
      background: #07090F;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      padding: 10px 14px;
      color: #FFFFFF;
      font-family: var(--font-mono);
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .input-field:focus { border-color: var(--border-focus); }

    .address-preview {
      background: #05070B;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: var(--accent-light);
      word-break: break-all;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    /* Bullion Button */
    .btn-bullion {
      width: 100%;
      background: linear-gradient(180deg, #FBF3D5 0%, #DFB843 35%, #B88E28 100%);
      border: 1px solid #DFB843;
      border-radius: 6px;
      padding: 12px 18px;
      color: #07080B;
      font-family: var(--font-mono);
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4);
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 14px;
    }
    .btn-bullion:hover {
      transform: translateY(-1px);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 6px 16px rgba(223, 184, 67, 0.35);
    }
    .btn-bullion:active { transform: translateY(0); }

    /* Transactions Table */
    .ledger-section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 26px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 10px 28px rgba(0, 0, 0, 0.45);
    }
    .ledger-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .ledger-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .ledger-sub {
      font-size: 0.75rem;
      color: var(--muted);
      font-family: var(--font-mono);
    }

    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 0.78rem;
    }
    th {
      text-align: left;
      padding: 10px 12px;
      color: var(--text-dim);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.04em;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text);
    }
    tr:hover td {
      background: rgba(223, 184, 67, 0.03);
    }
    .tx-type-deposit { color: #10B981; font-weight: 600; }
    .tx-type-withdraw { color: #DFB843; font-weight: 600; }
    .tx-type-reset { color: #94A3B8; }
    .tx-hash-link {
      color: var(--text-dim);
      text-decoration: none;
      font-size: 0.72rem;
    }
    .tx-hash-link:hover { color: var(--accent); }
    .tx-status-confirmed {
      color: #10B981;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
    }
    .empty-state {
      text-align: center;
      padding: 36px 12px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <!-- Nav -->
  <header class="top-nav">
    <a href="/" class="nav-brand">
      <div class="nav-brand-icon">Q</div>
      QuanterraOS <span>/ WALLET</span>
    </a>
    <nav class="nav-links">
      <a href="/calibration">Calibration</a>
      <a href="/predictions">Ledger</a>
      <a href="/autopilot">Autopilot</a>
      <a href="/wallet" class="active">Wallet</a>
      <a href="/account">Account</a>
      <a href="/pricing" class="btn-pricing">Pricing</a>
    </nav>
  </header>

  <main class="container">
    <!-- Notice -->
    ${notice ? `<div class="alert alert-${notice.type}">${notice.message}</div>` : ""}

    <!-- Governance Banner -->
    <div class="governance-strip">
      <div class="gov-badge">RULE B5 SANDBOX</div>
      <div class="gov-text">
        <strong>Simulated Electronic Currency Wallet:</strong> All balances, deposits, and transfers are paper-simulation credits ($0.00 live exposure). Practice algorithmic prediction market sizing risk-free.
      </div>
      <form action="/api/wallet/reset" method="POST" onsubmit="return confirm('Reset your sandbox electronic wallet to default $10,000 USD and 0.25 BTC?');">
        <button type="submit" class="gov-reset-btn">↺ Reset Sandbox</button>
      </form>
    </div>

    <!-- Stat Metric Cards -->
    <div class="stats-grid">
      <div class="stat-card stat-card-featured">
        <div class="stat-label">Total Simulated Portfolio</div>
        <div class="stat-value stat-value-gold">$${formattedTotal}</div>
        <div class="stat-sub">USD + BTC Combined</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Available Cash (USD)</div>
        <div class="stat-value">$${formattedCash}</div>
        <div class="stat-sub">Paper Dollar Balance</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Bitcoin Holdings</div>
        <div class="stat-value">${btcHoldings.toFixed(4)} <span style="font-size:0.9rem; color:var(--accent);">BTC</span></div>
        <div class="stat-sub">≈ $${formattedBtcValue} USD</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Composite Index Reference</div>
        <div class="stat-value" style="font-size:1.35rem;">$${formattedBtcPrice}</div>
        <div class="stat-sub">Quanterra Spot Composite</div>
      </div>
    </div>

    <!-- Main Actions Split -->
    <div class="console-split">
      <!-- Upload / Deposit Panel -->
      <section class="action-panel" aria-label="Simulated Electronic Currency Deposit">
        <div class="action-panel-header">
          <div class="action-title">
            <span>↑</span> Upload Electronic Currency
          </div>
          <span class="action-badge badge-deposit">Simulated Inflow</span>
        </div>

        <form action="/api/wallet/deposit" method="POST">
          <div class="form-group">
            <label class="form-label">Select Currency</label>
            <div class="currency-selector" id="deposit-curr-selector">
              <button type="button" class="curr-btn active" data-curr="USD">USD (Cash)</button>
              <button type="button" class="curr-btn" data-curr="BTC">BTC (Bitcoin)</button>
              <button type="button" class="curr-btn" data-curr="USDC">USDC (Stable)</button>
            </div>
            <input type="hidden" name="currency" id="deposit-currency-input" value="USD" />
          </div>

          <div class="form-group">
            <label class="form-label">Fast Add Amount</label>
            <div class="chip-row">
              <button type="button" class="amount-chip" onclick="setDepositAmount(1000)">+$1,000</button>
              <button type="button" class="amount-chip" onclick="setDepositAmount(5000)">+$5,000</button>
              <button type="button" class="amount-chip" onclick="setDepositAmount(10000)">+$10,000</button>
              <button type="button" class="amount-chip" onclick="setDepositAmount(0.1)">+0.1 BTC</button>
              <button type="button" class="amount-chip" onclick="setDepositAmount(0.5)">+0.5 BTC</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Upload Amount</label>
            <input type="number" step="any" min="0.0001" name="amount" id="deposit-amount-input" class="input-field" placeholder="1000.00" required />
          </div>

          <div class="form-group">
            <label class="form-label">Sandbox Inflow Network Address</label>
            <div class="address-preview">
              <span id="deposit-address-text">bc1q9u4zq87w2y4vpll9x3m7kd8c0j4e7f8h1g9s0a</span>
              <button type="button" style="background:none; border:none; color:var(--text-dim); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('deposit-address-text').textContent)">📋 Copy</button>
            </div>
          </div>

          <button type="submit" class="btn-bullion">
            Confirm Electronic Currency Upload →
          </button>
        </form>
      </section>

      <!-- Withdraw / Transfer Panel -->
      <section class="action-panel" aria-label="Simulated Electronic Currency Withdrawal">
        <div class="action-panel-header">
          <div class="action-title">
            <span>↓</span> Withdraw Electronic Currency
          </div>
          <span class="action-badge badge-withdraw">Simulated Outflow</span>
        </div>

        <form action="/api/wallet/withdraw" method="POST">
          <div class="form-group">
            <label class="form-label">Select Currency</label>
            <div class="currency-selector" id="withdraw-curr-selector">
              <button type="button" class="curr-btn active" data-curr="USD">USD (Cash)</button>
              <button type="button" class="curr-btn" data-curr="BTC">BTC (Bitcoin)</button>
              <button type="button" class="curr-btn" data-curr="USDC">USDC (Stable)</button>
            </div>
            <input type="hidden" name="currency" id="withdraw-currency-input" value="USD" />
          </div>

          <div class="form-group">
            <label class="form-label">Destination Electronic Address</label>
            <input type="text" name="destinationAddress" class="input-field" placeholder="bc1q... or 0x71C..." required />
          </div>

          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="form-label" style="margin:0;">Withdrawal Amount</label>
              <button type="button" style="background:none; border:none; color:var(--accent); font-family:var(--font-mono); font-size:0.7rem; cursor:pointer;" onclick="setMaxWithdrawal()">MAX AVAILABLE</button>
            </div>
            <input type="number" step="any" min="0.0001" name="amount" id="withdraw-amount-input" class="input-field" placeholder="0.00" required />
          </div>

          <div class="form-group">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--muted); font-family:var(--font-mono); padding:8px 0;">
              <span>Network Protocol Fee:</span>
              <span style="color:#10B981;">$0.00 (Zero Fee Sandbox)</span>
            </div>
          </div>

          <button type="submit" class="btn-bullion" style="background:linear-gradient(180deg, #1A2230 0%, #0E141F 100%); border-color:rgba(223,184,67,0.5); color:var(--accent-light);">
            Execute Simulated Withdrawal →
          </button>
        </form>
      </section>
    </div>

    <!-- Ledger & Audit Log -->
    <section class="ledger-section" aria-label="Electronic Wallet Ledger">
      <div class="ledger-header">
        <div>
          <div class="ledger-title">Electronic Wallet Audit Trail</div>
          <div class="ledger-sub">Immutable ledger of simulated electronic deposits, withdrawals, and initial allocations</div>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Action</th>
              <th>Currency</th>
              <th>Amount</th>
              <th>Simulated Blockchain Tx Hash</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              recentTransactions.length === 0
                ? `<tr><td colspan="6" class="empty-state">No transaction records found in ledger.</td></tr>`
                : recentTransactions
                    .map((tx) => {
                      const isDeposit = tx.type === "SIMULATED_DEPOSIT";
                      const isWithdraw = tx.type === "SIMULATED_WITHDRAWAL";
                      const typeClass = isDeposit ? "tx-type-deposit" : isWithdraw ? "tx-type-withdraw" : "tx-type-reset";
                      const typeLabel = isDeposit ? "+ UPLOAD" : isWithdraw ? "- WITHDRAW" : "↺ RESET";
                      const amountPrefix = isDeposit ? "+" : isWithdraw ? "-" : "";

                      return `<tr>
                        <td style="color:var(--text-dim);">${new Date(tx.createdAt).toLocaleString()}</td>
                        <td class="${typeClass}">${typeLabel}</td>
                        <td style="font-weight:600;">${tx.currency}</td>
                        <td style="font-weight:600;">${amountPrefix}${tx.currency === "BTC" ? tx.amount.toFixed(4) : tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>
                          <span class="tx-hash-link" title="${tx.txHash}" onclick="navigator.clipboard.writeText('${tx.txHash}'); alert('Copied Tx Hash: ' + '${tx.txHash}');" style="cursor:pointer;">
                            ${tx.txHash.slice(0, 10)}…${tx.txHash.slice(-8)} 📋
                          </span>
                        </td>
                        <td><span class="tx-status-confirmed">${tx.status}</span></td>
                      </tr>`;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <script>
    // Tab switching for deposit currency
    document.querySelectorAll('#deposit-curr-selector .curr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#deposit-curr-selector .curr-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const curr = btn.dataset.curr;
        document.getElementById('deposit-currency-input').value = curr;
        if (curr === 'BTC') {
          document.getElementById('deposit-address-text').textContent = 'bc1q9u4zq87w2y4vpll9x3m7kd8c0j4e7f8h1g9s0a';
          document.getElementById('deposit-amount-input').placeholder = '0.25';
        } else {
          document.getElementById('deposit-address-text').textContent = '0x71C569E9F097d740E7D2E0B2c129eE9a03975C41';
          document.getElementById('deposit-amount-input').placeholder = '1000.00';
        }
      });
    });

    // Tab switching for withdrawal currency
    document.querySelectorAll('#withdraw-curr-selector .curr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#withdraw-curr-selector .curr-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('withdraw-currency-input').value = btn.dataset.curr;
      });
    });

    function setDepositAmount(val) {
      document.getElementById('deposit-amount-input').value = val;
    }

    function setMaxWithdrawal() {
      const curr = document.getElementById('withdraw-currency-input').value;
      if (curr === 'BTC') {
        document.getElementById('withdraw-amount-input').value = ${wallet.balanceBtc};
      } else {
        document.getElementById('withdraw-amount-input').value = ${wallet.balanceUsd};
      }
    }
  </script>

  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
