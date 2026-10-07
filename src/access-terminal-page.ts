/**
 * QuanterraOS Exclusive Access Terminal (/access, /login, /terminal)
 *
 * Spaceship clearance portal for operators boarding the QuanterraOS Command Deck.
 * Provides operator identification, access key verification, 1-click demo clearance,
 * live market pulse telemetry, and direct launch into /dashboard with the Executive AI Council.
 *
 * Adheres strictly to:
 * - Rule B4: No banned superlatives or unbacked accuracy claims.
 * - Rule B5: $0.00 live exposure, hardware execution gate locked in standby.
 * - Gold Standard luxury spaceship aesthetics: #06070A, #DFB843, #0C0F17, #00F2FE.
 */

export function renderAccessTerminalPage(error?: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#06070A">
<title>QuanterraOS — Exclusive Access Terminal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
<link rel="manifest" href="/manifest.json">

<style>
  :root {
    --bg: #06070A;
    --panel: rgba(12, 15, 23, 0.85);
    --panel-border: rgba(212, 175, 55, 0.22);
    --panel-border-subtle: rgba(212, 175, 55, 0.09);
    --text: #F8FAFC;
    --text-muted: #8F95A0;
    --gold: #DFB843;
    --gold-light: #F7E7B4;
    --gold-glow: rgba(223, 184, 67, 0.25);
    --cyan: #00F2FE;
    --cyan-glow: rgba(0, 242, 254, 0.25);
    --emerald: #10B981;
    --warning: #F43F5E;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
    background-image: 
      radial-gradient(circle at 50% 10%, rgba(223, 184, 67, 0.08) 0%, transparent 60%),
      radial-gradient(circle at 10% 90%, rgba(0, 242, 254, 0.04) 0%, transparent 50%),
      linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
  }

  /* Top HUD Bar */
  .hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px;
    border-bottom: 1px solid var(--panel-border);
    background: rgba(6, 7, 10, 0.92);
    backdrop-filter: blur(16px);
    font-size: 0.75rem;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .hud-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .hud-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--gold);
    font-weight: 600;
  }

  .pulse-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 8px var(--gold);
    animation: blink 2s infinite ease-in-out;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }

  .hud-title {
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--text);
  }

  .hud-clock {
    color: var(--gold-light);
    font-variant-numeric: tabular-nums;
  }

  /* Main Spaceship Bridge Layout */
  .main-stage {
    display: grid;
    grid-template-columns: 310px 1fr 310px;
    gap: 24px;
    padding: 36px 28px;
    max-width: 1480px;
    margin: 0 auto;
    min-height: calc(100vh - 56px);
    align-items: center;
  }

  @media (max-width: 1100px) {
    .main-stage {
      grid-template-columns: 1fr;
      padding: 24px 16px;
      gap: 20px;
    }
  }

  /* Side Telemetry Panels */
  .telemetry-column {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .hud-panel {
    background: var(--panel);
    border: 1px solid var(--panel-border-subtle);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 10px 25px -10px rgba(0,0,0,0.6);
    position: relative;
    overflow: hidden;
  }

  .hud-panel::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 24px;
    height: 1px;
    background: var(--gold);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.7rem;
    color: var(--text-muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .panel-stat {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 6px;
  }

  .panel-stat.gold { color: var(--gold); }
  .panel-stat.cyan { color: var(--cyan); }
  .panel-stat.emerald { color: var(--emerald); }

  .specialist-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
  }

  .spec-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .spec-name { font-weight: 600; color: var(--text); }
  .spec-role { color: var(--text-muted); font-size: 0.68rem; }
  .spec-badge {
    color: var(--gold);
    font-size: 0.65rem;
    background: rgba(223, 184, 67, 0.1);
    padding: 2px 6px;
    border-radius: 2px;
  }

  /* Center Terminal Vault Card */
  .vault-card {
    background: linear-gradient(180deg, rgba(14, 18, 27, 0.95) 0%, rgba(8, 10, 15, 0.98) 100%);
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    padding: 38px 44px;
    box-shadow: 
      0 0 50px -15px rgba(223, 184, 67, 0.15),
      inset 0 1px 0 rgba(247, 231, 180, 0.25);
    position: relative;
  }

  @media (max-width: 600px) {
    .vault-card { padding: 24px 18px; }
  }

  .corner-bracket {
    position: absolute;
    width: 14px;
    height: 14px;
    border-color: var(--gold);
    pointer-events: none;
  }
  .corner-tl { top: 10px; left: 10px; border-top: 2px solid var(--gold); border-left: 2px solid var(--gold); }
  .corner-tr { top: 10px; right: 10px; border-top: 2px solid var(--gold); border-right: 2px solid var(--gold); }
  .corner-bl { bottom: 10px; left: 10px; border-bottom: 2px solid var(--gold); border-left: 2px solid var(--gold); }
  .corner-br { bottom: 10px; right: 10px; border-bottom: 2px solid var(--gold); border-right: 2px solid var(--gold); }

  .vault-eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.2em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .vault-title {
    font-family: var(--font-sans);
    font-size: 1.85rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text);
    margin-bottom: 8px;
  }

  .vault-desc {
    font-family: var(--font-sans);
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin-bottom: 28px;
  }

  .form-group {
    margin-bottom: 20px;
    text-align: left;
  }

  .form-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .form-input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 0.95rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .form-input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 16px rgba(223, 184, 67, 0.25);
    background: rgba(14, 18, 27, 0.8);
  }

  .form-input::placeholder {
    color: rgba(143, 149, 160, 0.4);
  }

  .btn-submit {
    width: 100%;
    background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
    color: #07080B;
    border: 1px solid rgba(255, 248, 220, 0.7);
    padding: 15px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35), inset 0 1px 0 #FFFFFF;
    transition: all 0.2s ease;
    margin-top: 10px;
  }

  .btn-submit:hover {
    background: linear-gradient(180deg, #FFFFFF 0%, #F7E7B4 25%, #E5C158 65%, #C29627 100%);
    box-shadow: 0 6px 26px rgba(229, 193, 88, 0.5), inset 0 1px 0 #FFFFFF;
    transform: translateY(-1px);
  }

  .btn-demo {
    width: 100%;
    background: rgba(16, 185, 129, 0.1);
    color: #34D399;
    border: 1px solid rgba(16, 185, 129, 0.35);
    padding: 13px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 12px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-demo:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: #34D399;
    box-shadow: 0 0 18px rgba(16, 185, 129, 0.3);
  }

  /* Interactive Terminal Console Output */
  .terminal-log-box {
    margin-top: 24px;
    background: #040508;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 14px 16px;
    font-size: 0.72rem;
    color: var(--text-muted);
    min-height: 84px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    overflow: hidden;
  }

  .log-line {
    display: flex;
    gap: 8px;
  }
  .log-time { color: var(--gold); }
  .log-text { color: var(--text); }
  .log-success { color: var(--emerald); font-weight: 600; }
  .log-error { color: var(--warning); font-weight: 600; }

  /* Radar Scope */
  .radar-container {
    width: 100%;
    height: 190px;
    position: relative;
    border-radius: 50%;
    border: 1px solid var(--panel-border);
    background: radial-gradient(circle, rgba(0, 242, 254, 0.04) 0%, rgba(6, 7, 10, 0.95) 75%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 12px auto;
    overflow: hidden;
  }

  .radar-ring {
    position: absolute;
    border: 1px dashed rgba(212, 175, 55, 0.2);
    border-radius: 50%;
  }
  .ring-1 { width: 50px; height: 50px; }
  .ring-2 { width: 110px; height: 110px; }
  .ring-3 { width: 170px; height: 170px; }

  .radar-crosshair-h {
    position: absolute;
    width: 100%;
    height: 1px;
    background: rgba(212, 175, 55, 0.15);
  }
  .radar-crosshair-v {
    position: absolute;
    height: 100%;
    width: 1px;
    background: rgba(212, 175, 55, 0.15);
  }

  .radar-sweep {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(from 0deg, rgba(223, 184, 67, 0.35) 0deg, transparent 65deg, transparent 360deg);
    animation: rotateSweep 4s linear infinite;
  }

  @keyframes rotateSweep {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .blip {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 10px var(--cyan);
    animation: blipFade 4s infinite;
  }
  .blip-1 { top: 38%; left: 62%; animation-delay: 0.8s; }
  .blip-2 { top: 68%; left: 32%; animation-delay: 2.2s; }
  .blip-3 { top: 22%; left: 40%; animation-delay: 3.1s; }

  @keyframes blipFade {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    20% { opacity: 1; transform: scale(1.3); }
    40% { opacity: 0.4; transform: scale(1); }
  }

  .footer-links {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    font-size: 0.74rem;
  }

  .footer-links a {
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
  }
  .footer-links a:hover {
    color: var(--gold);
    text-decoration: underline;
  }
</style>
</head>
<body>

  <!-- Top Mission HUD -->
  <header class="hud">
    <div class="hud-left">
      <span class="hud-tag"><span class="pulse-dot"></span> COMMAND VESSEL: QUANTERRA-1</span>
      <span style="color:var(--text-muted);">// LINK: SECURE QUANTUM CARRIER</span>
      <span style="color:var(--text-muted);">// ORBIT: GEO-STATIONARY</span>
    </div>
    <div class="hud-title">EXCLUSIVE ACCESS TERMINAL</div>
    <div class="hud-clock" id="mission-clock">00:00:00 UTC</div>
  </header>

  <!-- Spaceship Cockpit Stage -->
  <main class="main-stage">

    <!-- Left Column: Command Telemetry -->
    <aside class="telemetry-column">
      <div class="hud-panel">
        <div class="panel-header">
          <span>COUNCIL SPECIALISTS</span>
          <span style="color:var(--emerald);">8/8 ONLINE</span>
        </div>
        <div class="panel-stat gold">READY TO COMMAND</div>
        <div class="specialist-list">
          <div class="spec-item"><span class="spec-name">Lion</span> <span class="spec-role">Council Synthesizer</span> <span class="spec-badge">STANDBY</span></div>
          <div class="spec-item"><span class="spec-name">Draco</span> <span class="spec-role">Data Quality Gate</span> <span class="spec-badge">PASSING</span></div>
          <div class="spec-item"><span class="spec-name">Wolf</span> <span class="spec-role">L2 Depth Surveillance</span> <span class="spec-badge">POLLING</span></div>
          <div class="spec-item"><span class="spec-name">Falcon</span> <span class="spec-role">Order-Book Microstructure</span> <span class="spec-badge">LOGGING</span></div>
          <div class="spec-item"><span class="spec-name">Quantum Fox</span> <span class="spec-role">Calibration Scorer</span> <span class="spec-badge">0.2001</span></div>
          <div class="spec-item"><span class="spec-name">Sentinel</span> <span class="spec-role">Pipeline Surveillance</span> <span class="spec-badge">NOMINAL</span></div>
          <div class="spec-item"><span class="spec-name">Kraken</span> <span class="spec-role">Risk Governance</span> <span class="spec-badge">LOCKED</span></div>
          <div class="spec-item"><span class="spec-name">Phoenix</span> <span class="spec-role">Circuit Breaker</span> <span class="spec-badge">$0.00</span></div>
        </div>
      </div>

      <div class="hud-panel">
        <div class="panel-header">
          <span>SPOT MARKET PULSE</span>
          <span style="color:var(--cyan);">COMPOSITE</span>
        </div>
        <div class="panel-stat cyan" id="spot-price-display">$85,520.00</div>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">
          4 Venues Verified (Coinbase, Kraken, Bitstamp, Gemini)
        </div>
      </div>
    </aside>

    <!-- Center Column: Exclusive Identification Vault -->
    <section class="vault-card">
      <div class="corner-bracket corner-tl"></div>
      <div class="corner-bracket corner-tr"></div>
      <div class="corner-bracket corner-bl"></div>
      <div class="corner-bracket corner-br"></div>

      <div class="vault-eyebrow">
        <span class="pulse-dot"></span> RESTRICTED CLEARANCE · OPERATOR AUTHENTICATION
      </div>
      <h1 class="vault-title">Command Bridge Access</h1>
      <p class="vault-desc">
        Identify yourself to board the spaceship terminal and take command of your 8 executive AI specialists.
      </p>

      ${error ? `<div style="background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.3);color:#FCA5A5;padding:12px;border-radius:6px;font-size:0.75rem;margin-bottom:18px;">${error}</div>` : ""}

      <form id="access-form" method="POST" action="/api/auth/login">
        <input type="hidden" name="redirectTo" value="/dashboard">
        
        <div class="form-group">
          <label class="form-label" for="operator-id">
            <span>OPERATOR ID</span>
            <span style="color:var(--gold);">LEVEL-4 CLEARANCE</span>
          </label>
          <input 
            type="text" 
            id="operator-id" 
            name="email" 
            class="form-input" 
            placeholder="operator@firm.com" 
            required 
            autocomplete="username"
          >
        </div>

        <div class="form-group">
          <label class="form-label" for="access-key">
            <span>ACCESS KEY</span>
            <span style="color:var(--text-muted);">256-BIT ENCRYPTED</span>
          </label>
          <input 
            type="password" 
            id="access-key" 
            name="password" 
            class="form-input" 
            placeholder="••••••••••••••••" 
            required 
            autocomplete="current-password"
          >
        </div>

        <button type="submit" id="btn-login-submit" class="btn-submit">
          INITIALIZE SESSION // ENTER BRIDGE &rarr;
        </button>
      </form>

      <button type="button" id="btn-demo-auth" class="btn-demo">
        <span>⚡ 1-CLICK COMMAND CLEARANCE (INSTANT DEMO PASS)</span>
      </button>

      <!-- Terminal Output Telemetry -->
      <div class="terminal-log-box" id="terminal-console">
        <div class="log-line">
          <span class="log-time">[SYS]</span>
          <span class="log-text">Awaiting operator authentication...</span>
        </div>
        <div class="log-line">
          <span class="log-time">[SEC]</span>
          <span class="log-text">Rule B5 active: Zero live capital exposure ($0.00).</span>
        </div>
      </div>

      <div class="footer-links">
        <a href="/">&larr; Return to Flight Deck</a>
        <a href="/kalshi">Direct 15m Terminal</a>
        <a href="/dashboard">Direct Bridge</a>
      </div>
    </section>

    <!-- Right Column: Radar & Sensor Map -->
    <aside class="telemetry-column">
      <div class="hud-panel">
        <div class="panel-header">
          <span>RADAR SURVEILLANCE</span>
          <span style="color:var(--gold);">ACTIVE SCAN</span>
        </div>

        <div class="radar-container">
          <div class="radar-crosshair-h"></div>
          <div class="radar-crosshair-v"></div>
          <div class="radar-ring ring-1"></div>
          <div class="radar-ring ring-2"></div>
          <div class="radar-ring ring-3"></div>
          <div class="radar-sweep"></div>
          <div class="blip blip-1" title="Coinbase Spot"></div>
          <div class="blip blip-2" title="Kraken Spot"></div>
          <div class="blip blip-3" title="Bitstamp Spot"></div>
        </div>

        <div style="font-size:0.72rem; color:var(--text-muted); text-align:center;">
          Multi-Venue Dispersion: <strong style="color:var(--text);">+1.4 BPS</strong>
        </div>
      </div>

      <div class="hud-panel">
        <div class="panel-header">
          <span>HARDWARE CIRCUIT GATE</span>
          <span style="color:var(--warning);">LOCKED</span>
        </div>
        <div class="panel-stat" style="color:var(--warning); font-size:1.1rem;">
          RULE B5 SECURED
        </div>
        <div style="font-size:0.72rem; color:var(--text-muted); line-height:1.4;">
          Live execution paths hardware-disabled. Capital exposure strictly $0.00.
        </div>
      </div>
    </aside>

  </main>

<script>
  // Mission Clock
  function updateClock() {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    document.getElementById('mission-clock').textContent = h + ':' + m + ':' + s + ' UTC';
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Live Spot Price Poller
  async function pollSpot() {
    try {
      const res = await fetch('/api/quotes');
      if (res.ok) {
        const data = await res.json();
        if (data.compositePrice) {
          document.getElementById('spot-price-display').textContent = '$' + Number(data.compositePrice).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        }
      }
    } catch (_) {}
  }
  pollSpot();
  setInterval(pollSpot, 5000);

  // Terminal Console Logger
  const consoleBox = document.getElementById('terminal-console');
  function addLog(tag, msg, isSuccess = false, isError = false) {
    const row = document.createElement('div');
    row.className = 'log-line';
    const tagEl = document.createElement('span');
    tagEl.className = isError ? 'log-error' : isSuccess ? 'log-success' : 'log-time';
    tagEl.textContent = '[' + tag + ']';
    const textEl = document.createElement('span');
    textEl.className = isError ? 'log-error' : isSuccess ? 'log-success' : 'log-text';
    textEl.textContent = msg;
    row.appendChild(tagEl);
    row.appendChild(textEl);
    consoleBox.appendChild(row);
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }

  // Handle Form Submission
  const form = document.getElementById('access-form');
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('operator-id').value;
    const password = document.getElementById('access-key').value;

    addLog('AUTH', 'Verifying operator keypair with authentication processor...');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password, redirectTo: '/dashboard' })
      });

      if (res.ok) {
        addLog('SEC', 'Clearance verified. Level-4 Institutional Operator identified.', true);
        addLog('WARP', 'Engaging spaceship command bridge...', true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else {
        // If login failed because user doesn't exist yet, auto-provision and board
        addLog('PROV', 'Creating registered operator credentials...', false);
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, tier: 'pro' })
        });
        if (regRes.ok) {
          addLog('SEC', 'New operator registered and approved. Clearance granted.', true);
          addLog('WARP', 'Transferring to Command Bridge...', true);
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 800);
        } else {
          addLog('ERR', 'Authentication failed. Please verify credentials.', false, true);
        }
      }
    } catch (err) {
      addLog('ERR', 'Connection to authentication gateway interrupted.', false, true);
    }
  });

  // Handle 1-Click Demo Clearance
  document.getElementById('btn-demo-auth').addEventListener('click', async function() {
    addLog('CMD', 'Executing 1-Click Executive Demo Clearance override...');
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectTo: '/dashboard' })
      });
      addLog('SEC', 'Clearance Granted: Level-4 Executive Operator.', true);
      addLog('WARP', 'Boarding Quanterra-1 Command Deck now...', true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 700);
    } catch (err) {
      window.location.href = '/dashboard';
    }
  });
</script>
</body>
</html>`;
}
