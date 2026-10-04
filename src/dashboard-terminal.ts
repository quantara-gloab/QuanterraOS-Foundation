/**
 * Live Terminal Dashboard View (/dashboard)
 *
 * Implements the sci-fi terminal console view using the access-terminal visual aesthetic:
 * - Dark background (#060A12)
 * - Cyan & gold accents (#4FE0FF, #C9A227)
 * - Corner-bracket panels (◐ ◓)
 * - Monospace HUD type (IBM Plex Mono)
 * - Connected directly to the real 8-agent Council Coordination Pipeline
 * - Lion's synthesized calibration verdict as the single source of truth
 * - Calibration-first framing (verified state of market & pipeline, zero live capital)
 */

export function renderCouncilDashboardPage(clerkScripts: string = "", clerkConfigured: boolean = false): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Live Council Coordination Terminal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,500;1,9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
${clerkScripts}
<style>
  :root {
    --bg: #060A12;
    --panel: rgba(13,20,31,0.78);
    --panel-border: rgba(79,224,255,0.18);
    --panel-border-gold: rgba(201,162,39,0.22);
    --text: #E7F6FB;
    --text-dim: #7FA9B6;
    --muted: #587582;
    --accent: #4FE0FF;
    --gold: #C9A227;
    --gold-glow: rgba(201,162,39,0.35);
    --green: #42D392;
    --amber: #FFB347;
    --red: #FF5A5F;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: "IBM Plex Mono", monospace;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background: 
      radial-gradient(circle at 50% 30%, rgba(79,224,255,0.035) 0%, transparent 60%),
      radial-gradient(circle at 80% 80%, rgba(201,162,39,0.025) 0%, transparent 50%),
      repeating-radial-gradient(circle, rgba(79,224,255,0.015) 1px, transparent 1px);
    pointer-events: none;
    z-index: -1;
  }

  /* Top HUD */
  .hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 24px;
    border-bottom: 1px solid var(--panel-border);
    font-size: 0.76rem;
    color: var(--text-dim);
    background: rgba(6,10,18,0.85);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .hud .left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .hud .status-tag {
    color: var(--green);
    animation: pulse 2s infinite ease-in-out;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.92); }
  }
  .hud .center-tag {
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text);
  }
  .hud .right {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--accent);
  }
  .hud a {
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.2s;
  }
  .hud a:hover { color: var(--accent); }

  /* Main Grid */
  .main-container {
    max-width: 1560px;
    margin: 0 auto;
    padding: 24px;
    display: grid;
    grid-template-columns: 340px 1fr 340px;
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 1200px) {
    .main-container { grid-template-columns: 1fr; }
  }

  .column { display: flex; flex-direction: column; gap: 18px; }

  /* Telemetry Panel Box */
  .telemetry-panel {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    padding: 16px;
    position: relative;
    backdrop-filter: blur(6px);
  }
  .telemetry-panel.gold-panel {
    border-color: var(--panel-border-gold);
  }
  .telemetry-panel .panel-title {
    color: var(--text-dim);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .telemetry-panel .panel-title-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .telemetry-panel .dot {
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--accent);
  }
  .telemetry-panel .dot.gold {
    background: var(--gold);
    box-shadow: 0 0 6px var(--gold);
  }
  .telemetry-panel .dot.green {
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
  }

  /* Council Status List */
  .agent-status-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .agent-status-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(79,224,255,0.08);
    border-radius: 6px;
    font-size: 0.73rem;
    transition: all 0.2s;
  }
  .agent-status-item:hover {
    border-color: var(--panel-border);
    background: rgba(79,224,255,0.04);
  }
  .agent-status-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .agent-indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .agent-indicator-dot.green {
    background: var(--green);
    box-shadow: 0 0 8px rgba(66,211,146,0.6);
  }
  .agent-indicator-dot.amber {
    background: var(--amber);
    box-shadow: 0 0 8px rgba(255,179,71,0.6);
  }
  .agent-indicator-dot.red {
    background: var(--red);
    box-shadow: 0 0 8px rgba(255,90,95,0.6);
  }
  .agent-status-name {
    font-weight: 600;
    color: var(--text);
  }
  .agent-status-role {
    font-size: 0.65rem;
    color: var(--text-dim);
  }
  .agent-status-badge {
    text-align: right;
  }
  .agent-status-label {
    font-size: 0.68rem;
    color: var(--accent);
  }
  .agent-status-time {
    font-size: 0.62rem;
    color: var(--muted);
  }

  /* Center Terminal HUD */
  .terminal-hud {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 16px;
    padding: 24px;
    position: relative;
    backdrop-filter: blur(8px);
  }
  .terminal-hud::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 16px;
    background: rgba(0,0,0,0.3);
    border-radius: 16px 16px 0 0;
  }
  .corner-brackets {
    position: absolute;
    top: 24px; left: 20px; right: 20px;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    font-size: 0.85rem;
    color: var(--accent);
    opacity: 0.6;
  }
  .terminal-header {
    margin-bottom: 20px;
  }
  .terminal-eyebrow {
    font-size: 0.7rem;
    color: var(--text-dim);
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .terminal-title {
    font-family: "Fraunces", serif;
    font-style: italic;
    font-size: 1.35rem;
    font-weight: 500;
    color: var(--text);
  }

  /* Lion Verdict Box (Single Source of Truth) */
  .lion-verdict-box {
    background: rgba(20,25,35,0.92);
    border: 1px solid var(--gold);
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 22px;
    box-shadow: 0 0 24px rgba(201,162,39,0.12), inset 0 0 16px rgba(201,162,39,0.04);
  }
  .verdict-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .verdict-badge {
    background: rgba(201,162,39,0.15);
    border: 1px solid var(--gold);
    color: var(--gold);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .verdict-source-tag {
    font-size: 0.68rem;
    color: var(--text-dim);
  }
  .verdict-text {
    font-size: 0.95rem;
    line-height: 1.55;
    color: #FFF;
    margin-bottom: 14px;
    font-family: "IBM Plex Sans", sans-serif;
  }
  .verdict-checklist {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid rgba(201,162,39,0.18);
    font-size: 0.72rem;
  }
  @media (max-width: 640px) {
    .verdict-checklist { grid-template-columns: 1fr; }
  }
  .verdict-check-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-dim);
  }
  .check-icon {
    font-weight: bold;
    font-size: 0.85rem;
  }
  .check-icon.passed { color: var(--green); }
  .check-icon.failed { color: var(--amber); }
  .check-icon.locked { color: var(--gold); }

  /* Pipeline Coordination Flow Visualizer */
  .pipeline-flow-section {
    margin-bottom: 22px;
  }
  .section-label-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.7rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 10px;
  }
  .pipeline-nodes-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  @media (max-width: 800px) {
    .pipeline-nodes-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .pipeline-node-card {
    background: rgba(8,13,20,0.8);
    border: 1px solid rgba(79,224,255,0.12);
    border-radius: 8px;
    padding: 10px 12px;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
  }
  .pipeline-node-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(79,224,255,0.1);
  }
  .pipeline-node-card.active-selected {
    border-color: var(--accent);
    background: rgba(79,224,255,0.06);
  }
  .node-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .node-step-badge {
    font-size: 0.6rem;
    color: var(--muted);
  }
  .node-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
  }
  .node-role {
    font-size: 0.65rem;
    color: var(--text-dim);
    margin-bottom: 6px;
  }
  .node-output {
    font-size: 0.68rem;
    color: var(--accent);
    line-height: 1.35;
    background: rgba(0,0,0,0.25);
    padding: 4px 6px;
    border-radius: 4px;
    min-height: 34px;
  }

  /* Node Detail Box (Expandable) */
  .node-detail-box {
    background: rgba(6,10,18,0.95);
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    padding: 14px;
    margin-top: 10px;
    font-size: 0.72rem;
    display: none;
  }
  .node-detail-box.show { display: block; }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid rgba(79,224,255,0.06);
  }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { color: var(--text-dim); }
  .detail-val { color: var(--text); font-weight: 500; text-align: right; }

  /* Phoenix Gate Banner */
  .phoenix-gate-card {
    background: rgba(18,15,10,0.85);
    border: 1px solid var(--gold);
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .gate-icon {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(201,162,39,0.15);
    border: 1px solid var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .gate-text-title {
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--gold);
    letter-spacing: 0.08em;
  }
  .gate-text-desc {
    font-size: 0.72rem;
    color: var(--text-dim);
    margin-top: 2px;
    line-height: 1.4;
  }

  /* Event Stream Terminal Log */
  .terminal-log-box {
    background: rgba(0,0,0,0.45);
    border: 1px solid rgba(79,224,255,0.12);
    border-radius: 8px;
    padding: 12px;
    font-size: 0.7rem;
    max-height: 140px;
    overflow-y: auto;
    color: var(--text-dim);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .log-line {
    display: flex;
    gap: 8px;
  }
  .log-time { color: var(--muted); flex-shrink: 0; }
  .log-agent { color: var(--accent); font-weight: 600; flex-shrink: 0; }
  .log-msg { color: var(--text); }

  /* Action Controls */
  .hud-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 18px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .run-cycle-btn {
    background: var(--accent);
    color: var(--bg);
    border: none;
    padding: 10px 18px;
    border-radius: 6px;
    font-family: "IBM Plex Sans", sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }
  .run-cycle-btn:hover {
    box-shadow: 0 0 16px rgba(79,224,255,0.4);
    transform: translateY(-1px);
  }
  .run-cycle-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .live-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: var(--green);
  }

  /* Market Pulse Panel */
  .quote-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin: 12px 0;
  }
  .quote-box {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(79,224,255,0.1);
    border-radius: 6px;
    padding: 8px 10px;
    text-align: center;
  }
  .quote-label {
    font-size: 0.65rem;
    color: var(--text-dim);
    text-transform: uppercase;
  }
  .quote-val {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--text);
    margin-top: 2px;
  }

  /* Stats List */
  .stat-kv-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .stat-kv {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(79,224,255,0.06);
  }
  .stat-k { color: var(--text-dim); }
  .stat-v { color: var(--text); font-weight: 600; }

  /* Footer */
  .footer-bar {
    text-align: center;
    padding: 24px;
    font-size: 0.7rem;
    color: var(--muted);
    border-top: 1px solid rgba(79,224,255,0.1);
    margin-top: 40px;
    letter-spacing: 0.08em;
  }

  /* Terminal Chat Modal Drawer */
  .terminal-chat-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(4, 7, 13, 0.85);
    backdrop-filter: blur(8px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }
  .terminal-chat-backdrop.open { display: flex; }
  .terminal-chat-modal {
    background: #090E17;
    border: 1px solid var(--accent);
    box-shadow: 0 0 30px rgba(79,224,255,0.25);
    border-radius: 12px;
    width: 100%;
    max-width: 620px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
  .terminal-chat-header {
    background: rgba(13,20,31,0.9);
    border-bottom: 1px solid var(--panel-border);
    padding: 12px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .terminal-chat-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.08em;
  }
  .terminal-chat-close {
    background: transparent;
    border: 1px solid var(--panel-border);
    color: var(--text-dim);
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .terminal-chat-close:hover {
    border-color: var(--red);
    color: var(--red);
  }
  .terminal-chat-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .terminal-chat-governance {
    background: rgba(201,162,39,0.1);
    border: 1px solid rgba(201,162,39,0.3);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 0.68rem;
    color: var(--gold);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .terminal-chat-stream {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(79,224,255,0.12);
    border-radius: 8px;
    padding: 12px;
    max-height: 280px;
    min-height: 180px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .term-msg {
    max-width: 88%;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.73rem;
    line-height: 1.5;
  }
  .term-msg.user {
    align-self: flex-end;
    background: rgba(79,224,255,0.14);
    border: 1px solid rgba(79,224,255,0.3);
    color: var(--text);
  }
  .term-msg.agent {
    align-self: flex-start;
    background: rgba(13,20,31,0.95);
    border: 1px solid rgba(79,224,255,0.18);
    color: var(--text);
  }
  .term-msg-head {
    font-size: 0.62rem;
    color: var(--accent);
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    gap: 6px;
  }
  .term-msg-citations {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid rgba(79,224,255,0.08);
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .term-citation {
    font-size: 0.6rem;
    background: rgba(201,162,39,0.12);
    color: var(--gold);
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid rgba(201,162,39,0.25);
  }
  .term-guarded-badge {
    font-size: 0.58rem;
    background: rgba(66,211,146,0.18);
    color: var(--green);
    padding: 1px 4px;
    border-radius: 3px;
  }
  .terminal-chat-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .term-prompt-btn {
    background: rgba(79,224,255,0.06);
    border: 1px solid rgba(79,224,255,0.15);
    color: var(--text-dim);
    font-family: inherit;
    font-size: 0.68rem;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
  }
  .term-prompt-btn:hover {
    background: rgba(79,224,255,0.12);
    border-color: var(--accent);
    color: var(--accent);
  }
  .terminal-chat-form {
    display: flex;
    gap: 8px;
  }
  .terminal-chat-input {
    flex: 1;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(79,224,255,0.2);
    color: var(--text);
    font-family: inherit;
    font-size: 0.75rem;
    padding: 8px 12px;
    border-radius: 6px;
    outline: none;
  }
  .terminal-chat-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 8px rgba(79,224,255,0.2);
  }
  .terminal-chat-send {
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    padding: 8px 14px;
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: all 0.2s;
  }
  .terminal-chat-send:hover:not(:disabled) {
    box-shadow: 0 0 10px rgba(79,224,255,0.4);
  }
  .terminal-chat-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
</head>
<body>

  <!-- Top HUD Bar -->
  <header class="hud">
    <div class="left">
      <span><span class="status-tag">●</span> NODE US-WEST-1</span>
      <span>· SECURE WEBSOCKET</span>
      <span>· CALIBRATION GATE: <strong style="color:var(--gold);">ENGAGED</strong></span>
    </div>
    <div class="center-tag">QUANTERRAOS COUNCIL COORDINATION TERMINAL</div>
    <div class="right">
      <span id="session-clock">00:00:00 UTC</span>
      <a href="/">[ Home ]</a>
      <a href="/calibration/market-price">[ Calibration Curve ]</a>
    </div>
  </header>

  <!-- Main Grid Layout -->
  <main class="main-container">

    <!-- LEFT COLUMN: Council Status & Data Ingest -->
    <div class="column">
      
      <!-- Council Health Panel (8 Dots) -->
      <section class="telemetry-panel" id="panel-council-status">
        <div class="panel-title">
          <div class="panel-title-left">
            <span class="dot green"></span>
            <span>COUNCIL STATUS (8/8)</span>
          </div>
          <span id="council-health-tag" style="color:var(--green); font-size:0.68rem;">HEALTHY</span>
        </div>
        <div class="agent-status-list" id="agent-status-list">
          <!-- Populated dynamically via JS -->
          <div style="font-size:0.75rem; color:var(--text-dim);">Streaming council health telemetry…</div>
        </div>
      </section>

      <!-- Data Throughput & Freshness Panel -->
      <section class="telemetry-panel">
        <div class="panel-title">
          <div class="panel-title-left">
            <span class="dot"></span>
            <span>DATA THROUGHPUT & PIPELINE</span>
          </div>
          <span id="cycle-badge" style="color:var(--accent); font-size:0.68rem;">CYCLE #--</span>
        </div>
        <div class="stat-kv-list">
          <div class="stat-kv">
            <span class="stat-k">Verified Dataset</span>
            <span class="stat-v" id="stat-dataset">kalshi-btc15m-candles.csv</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Scored Windows</span>
            <span class="stat-v" id="stat-windows">1,316 windows</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Total Candle Rows</span>
            <span class="stat-v" id="stat-rows">19,740 rows</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Orderbook Collector</span>
            <span class="stat-v" id="stat-collector" style="color:var(--green);">ACTIVE (Cutoff verified)</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Pipeline Exec Latency</span>
            <span class="stat-v" id="stat-latency">-- ms</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Swing Events Logged</span>
            <span class="stat-v" id="stat-swings" style="color:var(--text);">245 (131 settled)</span>
          </div>
        </div>
      </section>

    </div>

    <!-- CENTER COLUMN: Terminal HUD, Lion Verdict & Coordination Chain -->
    <div class="column">
      
      <section class="terminal-hud">
        <div class="corner-brackets">
          <span>◐</span>
          <span>◓</span>
        </div>

        <div class="terminal-header">
          <div class="terminal-eyebrow">
            <span>// COUNCIL COORDINATION HUD · SINGLE SOURCE OF TRUTH</span>
            <span id="last-updated-badge" style="color:var(--accent);">SYNCING…</span>
          </div>
          <h1 class="terminal-title">Council Calibration & Synthesis Engine</h1>
        </div>

        <!-- Lion's Synthesized Verdict (Single Source of Truth) -->
        <div class="lion-verdict-box" id="lion-box">
          <div class="verdict-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="dot gold"></span>
              <strong style="color:var(--gold); font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase;">LION SYNTHESIZED VERDICT</strong>
            </div>
            <span class="verdict-badge" id="verdict-badge">CALIBRATED · STANDBY</span>
          </div>
          <p class="verdict-text" id="verdict-text">
            Initializing pipeline coordination cycle. Aggregating verification reports from Draco through Kraken…
          </p>
          <div class="verdict-checklist">
            <div class="verdict-check-item">
              <span class="check-icon passed">✓</span>
              <span>Market Calibrated: <strong style="color:var(--green);">YES (Brier 0.2001)</strong></span>
            </div>
            <div class="verdict-check-item">
              <span class="check-icon failed">✗</span>
              <span>Predictive Edge: <strong style="color:var(--amber);">UNPROVEN</strong></span>
            </div>
            <div class="verdict-check-item">
              <span class="check-icon locked">🔒</span>
              <span>Execution Gate: <strong style="color:var(--gold);">LOCKED</strong></span>
            </div>
          </div>
        </div>

        <!-- 8-Agent Coordination Pipeline Workflow -->
        <div class="pipeline-flow-section">
          <div class="section-label-bar">
            <span>Agent-to-Agent Coordination Chain</span>
            <span style="font-size:0.65rem; color:var(--muted);">Click any node to inspect telemetry</span>
          </div>
          <div class="pipeline-nodes-grid" id="pipeline-nodes-grid">
            <!-- Populated via JS -->
          </div>
          <div class="node-detail-box" id="node-detail-box">
            <!-- Expanded telemetry details -->
          </div>
        </div>

        <!-- Phoenix Execution Readiness Gate Banner -->
        <div class="phoenix-gate-card">
          <div class="gate-icon">🔒</div>
          <div>
            <div class="gate-text-title" id="phoenix-gate-title">CIRCUIT BREAKER ENGAGED — EXECUTION GATE LOCKED</div>
            <div class="gate-text-desc" id="phoenix-gate-desc">
              Under QuanterraOS governance rules, zero live capital is deployed until a predictive signal establishes out-of-sample statistical edge (BSS &gt; 0, EV &gt; spread + fees). Active capital: <strong>$0.00</strong>. Live orders: <strong>0</strong>.
            </div>
          </div>
        </div>

        <!-- Live Terminal Stream Logs -->
        <div style="font-size:0.68rem; color:var(--text-dim); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.1em;">
          Chronological Pipeline Execution Stream
        </div>
        <div class="terminal-log-box" id="terminal-log-box">
          <div class="log-line">
            <span class="log-time">[--:--:--]</span>
            <span class="log-agent">SYSTEM:</span>
            <span class="log-msg">Ready. Waiting for pipeline cycle…</span>
          </div>
        </div>

        <!-- Interactive HUD Controls -->
        <div class="hud-actions">
          <button class="run-cycle-btn" id="run-cycle-btn">
            <span>⚡</span>
            <span>Run Pipeline Cycle Now</span>
          </button>
          <div class="live-badge">
            <span class="status-tag">●</span>
            <span id="poll-indicator">AUTO-POLLING (15s INTERVAL)</span>
          </div>
        </div>

      </section>

    </div>

    <!-- RIGHT COLUMN: Market Pulse & Quantitative Benchmark -->
    <div class="column">
      
      <!-- Market Pulse Panel -->
      <section class="telemetry-panel">
        <div class="panel-title">
          <div class="panel-title-left">
            <span class="dot"></span>
            <span>MARKET PULSE (KXBTC15M)</span>
          </div>
          <span id="market-ticker-badge" style="color:var(--accent); font-size:0.68rem;">ACTIVE</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-dim);" id="market-contract-name">
          Loading active market…
        </div>
        
        <div class="quote-grid">
          <div class="quote-box">
            <div class="quote-label">Strike Target</div>
            <div class="quote-val" id="quote-strike">$85,260</div>
          </div>
          <div class="quote-box">
            <div class="quote-label">Time Remaining</div>
            <div class="quote-val" id="quote-countdown" style="color:var(--accent);">--m --s</div>
          </div>
          <div class="quote-box">
            <div class="quote-label">YES Bid / Ask</div>
            <div class="quote-val" id="quote-yes" style="color:var(--green);">$0.44 / $0.45</div>
          </div>
          <div class="quote-box">
            <div class="quote-label">NO Bid / Ask</div>
            <div class="quote-val" id="quote-no" style="color:var(--amber);">$0.55 / $0.56</div>
          </div>
        </div>

        <div class="stat-kv-list" style="margin-top:12px;">
          <div class="stat-kv">
            <span class="stat-k">Market Mid Price</span>
            <span class="stat-v" id="stat-mid">$0.4450</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Spread Width</span>
            <span class="stat-v" id="stat-spread">$0.0100</span>
          </div>
        </div>
      </section>

      <!-- Quantitative Research Benchmark Panel -->
      <section class="telemetry-panel gold-panel">
        <div class="panel-title">
          <div class="panel-title-left">
            <span class="dot gold"></span>
            <span>QUANTUM FOX BENCHMARK</span>
          </div>
          <span style="color:var(--gold); font-size:0.68rem;">AUDITED n=1,316</span>
        </div>

        <div class="stat-kv-list">
          <div class="stat-kv">
            <span class="stat-k">Market Mid Brier</span>
            <span class="stat-v" style="color:var(--green);">0.2001 (Calibrated)</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Lognormal Model Brier</span>
            <span class="stat-v">0.2063</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Naive 50/50 Baseline</span>
            <span class="stat-v" style="color:var(--muted);">0.2500</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Brier Difference</span>
            <span class="stat-v" style="color:var(--amber);">-0.0062 (Market Mid Wins)</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">95% Bootstrap CI</span>
            <span class="stat-v">[+0.0041, +0.0139]</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Held-Out EV / Trade</span>
            <span class="stat-v" style="color:var(--red);">-2.15¢ (Negative EV)</span>
          </div>
        </div>

        <div style="margin-top:12px; font-size:0.68rem; color:var(--text-dim); line-height:1.4; padding:8px; background:rgba(0,0,0,0.3); border-radius:6px;">
          *Historical evidence (findings.md §10-11) confirms the market's own price is well-calibrated. No predictive model has established held-out positive expectancy after spread and fees.
        </div>
      </section>

      <!-- Sudden Price-Swing Event Telemetry Panel (Quantum Fox / Sentinel) -->
      <section class="telemetry-panel">
        <div class="panel-title">
          <div class="panel-title-left">
            <span class="dot purple"></span>
            <span>SUDDEN PRICE-SWING MONITOR</span>
          </div>
          <span style="color:var(--accent); font-size:0.68rem;">n=131 SETTLED</span>
        </div>

        <div class="stat-kv-list">
          <div class="stat-kv">
            <span class="stat-k">Logged Events</span>
            <span class="stat-v" id="stat-swing-total">245 events (131 settled)</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Trigger Threshold</span>
            <span class="stat-v">±8 pp in 5m</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Momentum Win Rate</span>
            <span class="stat-v">75.57% (99/131)</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Walk-Forward Market Brier</span>
            <span class="stat-v" style="color:var(--green);">0.1838 (Market Beats Heuristic)</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Held-Out Profit 95% CI</span>
            <span class="stat-v" style="color:var(--amber);">[-$0.067, +$0.147]</span>
          </div>
          <div class="stat-kv">
            <span class="stat-k">Empirical Verdict</span>
            <span class="stat-v" style="color:var(--red);">NO EDGE (findings.md §12)</span>
          </div>
        </div>

        <div style="margin-top:12px; font-size:0.68rem; color:var(--text-dim); line-height:1.4; padding:8px; background:rgba(0,0,0,0.3); border-radius:6px;">
          *Per findings.md §12: high in-sample hit rate reflects already-expensive post-swing quotes. Walk-forward testing proves market price beats momentum heuristics.
        </div>
      </section>

    </div>

  <!-- Live Conversational Terminal Modal -->
  <div class="terminal-chat-backdrop" id="terminal-chat-backdrop" role="presentation" aria-hidden="true">
    <div class="terminal-chat-modal" role="dialog" aria-modal="true" aria-labelledby="term-chat-title">
      <div class="terminal-chat-header">
        <div class="terminal-chat-title">
          <span class="status-tag">●</span>
          <span id="term-chat-name">SPECIALIST INTERROGATION</span>
        </div>
        <button type="button" class="terminal-chat-close" id="term-chat-close-btn" onclick="closeTerminalAgentChat()" aria-label="Close specialist chat">&times;</button>
      </div>
      <div class="terminal-chat-body">
        <div class="terminal-chat-governance">
          <span>🔒</span>
          <span><strong>RULE B5 GOVERNANCE:</strong> Specialization voice only. Zero capital deployed ($0.00). Live execution gate locked.</span>
        </div>
        <div class="terminal-chat-stream" id="term-chat-stream" aria-live="polite">
          <!-- Live conversation stream -->
        </div>
        <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.08em;">Auditable Query Shortcuts:</div>
        <div class="terminal-chat-prompts" id="term-chat-prompts">
          <!-- Suggested query buttons -->
        </div>
        <form class="terminal-chat-form" id="term-chat-form" onsubmit="event.preventDefault(); sendTerminalChatMessage();">
          <input type="text" class="terminal-chat-input" id="term-chat-input" placeholder="Query specialist on track record, capital, findings.md..." autocomplete="off">
          <button type="submit" class="terminal-chat-send" id="term-chat-send-btn">TRANSMIT &rarr;</button>
        </form>
      </div>
    </div>
  </div>

  <footer class="footer-bar">
    QUANTERRAOS CALIBRATION-FIRST PLATFORM · AUDITABLE EMPIRICAL BENCHMARKS · ZERO LIVE TRADING CAPITAL DEPLOYED
  </footer>

<script>
let lastResult = null;
let selectedNodeId = null;
let lastFetchTimestamp = 0;

// Clock
function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById('session-clock').textContent = h + ':' + m + ':' + s + ' UTC';

  if (lastFetchTimestamp > 0) {
    const elapsedSec = Math.max(0, Math.floor((Date.now() - lastFetchTimestamp) / 1000));
    document.getElementById('last-updated-badge').textContent = 'UPDATED ' + elapsedSec + 'S AGO';
  }
}
setInterval(updateClock, 1000);
updateClock();

// Render council status panel
function renderCouncilStatus(agents) {
  const container = document.getElementById('agent-status-list');
  if (!agents || !container) return;

  const agentOrder = ['draco', 'wolf', 'falcon', 'quantumFox', 'sentinel', 'kraken', 'lion', 'phoenix'];
  const now = Date.now();

  const html = agentOrder.map(key => {
    const a = agents[key];
    if (!a) return '';
    const runTime = a.lastRunAt ? new Date(a.lastRunAt).getTime() : now;
    const diffSec = Math.max(0, Math.floor((now - runTime) / 1000));
    const timeText = diffSec < 60 ? diffSec + 's ago' : Math.floor(diffSec / 60) + 'm ago';

    return \`
      <div class="agent-status-item" onclick="openTerminalAgentChat('\${a.id}')" style="cursor:pointer;" title="Consult \${a.name} (Live Voice)">
        <div class="agent-status-info">
          <span class="agent-indicator-dot \${a.dotColor}"></span>
          <div>
            <div class="agent-status-name">\${a.name}</div>
            <div class="agent-status-role">\${a.role}</div>
          </div>
        </div>
        <div class="agent-status-badge">
          <div class="agent-status-label">\${a.statusLabel}</div>
          <div class="agent-status-time">\${timeText}</div>
        </div>
      </div>
    \`;
  }).join('');

  container.innerHTML = html;
}

// Render pipeline coordination nodes
function renderPipelineNodes(agents) {
  const container = document.getElementById('pipeline-nodes-grid');
  if (!agents || !container) return;

  const agentOrder = ['draco', 'wolf', 'falcon', 'quantumFox', 'sentinel', 'kraken', 'lion', 'phoenix'];

  const html = agentOrder.map((key, idx) => {
    const a = agents[key];
    if (!a) return '';
    const isSelected = selectedNodeId === a.id;

    return \`
      <div class="pipeline-node-card \${isSelected ? 'active-selected' : ''}" onclick="selectNode('\${a.id}')">
        <div class="node-header">
          <span class="node-step-badge">STEP 0\${idx + 1}</span>
          <span class="agent-indicator-dot \${a.dotColor}" style="width:6px;height:6px;"></span>
        </div>
        <div class="node-name">\${a.name}</div>
        <div class="node-role">\${a.role}</div>
        <div class="node-output">\${a.statusLabel}</div>
      </div>
    \`;
  }).join('');

  container.innerHTML = html;

  if (selectedNodeId && agents[selectedNodeId]) {
    renderNodeDetail(agents[selectedNodeId]);
  }
}

// Select a node to view full detail
function selectNode(agentId) {
  selectedNodeId = agentId;
  if (!lastResult || !lastResult.agents) return;
  const a = lastResult.agents[agentId];
  if (a) renderNodeDetail(a);
  renderPipelineNodes(lastResult.agents);
}

function renderNodeDetail(agent) {
  const box = document.getElementById('node-detail-box');
  if (!box || !agent) return;

  box.classList.add('show');
  let teleRows = '';
  if (agent.telemetry) {
    teleRows = Object.entries(agent.telemetry)
      .slice(0, 6)
      .map(([k, v]) => \`
        <div class="detail-row">
          <span class="detail-label">\${k}</span>
          <span class="detail-val">\${typeof v === 'object' ? JSON.stringify(v) : v}</span>
        </div>
      \`).join('');
  }

  box.innerHTML = \`
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <strong style="color:var(--accent);">[\${agent.name.toUpperCase()}] TELEMETRY INSPECTION</strong>
      <span style="color:var(--muted); cursor:pointer;" onclick="document.getElementById('node-detail-box').classList.remove('show');">[close ×]</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Input</span>
      <span class="detail-val">\${agent.inputDescription}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Output</span>
      <span class="detail-val">\${agent.outputDescription}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Summary</span>
      <span class="detail-val" style="color:var(--gold);">\${agent.summary}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Execution Latency</span>
      <span class="detail-val">\${agent.latencyMs} ms</span>
    </div>
    \${teleRows}
    <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(79,224,255,0.1); display:flex; justify-content:flex-end;">
      <button type="button" class="run-cycle-btn" style="padding:6px 14px; font-size:0.72rem; background:rgba(79,224,255,0.12); border:1px solid var(--accent); color:var(--accent);" onclick="openTerminalAgentChat('\${agent.id}')">
        💬 Consult \${agent.name} (Live Voice) &rarr;
      </button>
    </div>
  \`;
}

// Render Market Pulse quotes
function renderMarketPulse(quote) {
  if (!quote) return;
  const tickerEl = document.getElementById('market-ticker-badge');
  const contractEl = document.getElementById('market-contract-name');
  const strikeEl = document.getElementById('quote-strike');
  const yesEl = document.getElementById('quote-yes');
  const noEl = document.getElementById('quote-no');
  const midEl = document.getElementById('stat-mid');
  const spreadEl = document.getElementById('stat-spread');
  const countdownEl = document.getElementById('quote-countdown');

  if (tickerEl) tickerEl.textContent = quote.ticker;
  if (contractEl) contractEl.textContent = 'BTC-USD 15-Minute Expiry Horizon';
  if (strikeEl) strikeEl.textContent = '$' + Number(quote.strike).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  if (yesEl) yesEl.textContent = '$' + quote.yesBid.toFixed(2) + ' / $' + quote.yesAsk.toFixed(2);
  if (noEl) noEl.textContent = '$' + quote.noBid.toFixed(2) + ' / $' + quote.noAsk.toFixed(2);
  if (midEl) midEl.textContent = '$' + quote.midPrice.toFixed(4);
  if (spreadEl) spreadEl.textContent = '$' + quote.spread.toFixed(4);

  if (countdownEl) {
    const mins = Math.floor(quote.minutesLeft);
    const secs = Math.floor((quote.minutesLeft - mins) * 60);
    countdownEl.textContent = String(mins).padStart(2, '0') + 'm ' + String(secs).padStart(2, '0') + 's';
  }
}

// Append log stream
function appendLogStream(data) {
  const box = document.getElementById('terminal-log-box');
  if (!box || !data.agents) return;

  const now = new Date();
  const timeStr = String(now.getUTCHours()).padStart(2, '0') + ':' +
                  String(now.getUTCMinutes()).padStart(2, '0') + ':' +
                  String(now.getUTCSeconds()).padStart(2, '0');

  const agents = ['draco', 'wolf', 'falcon', 'quantumFox', 'sentinel', 'kraken', 'lion', 'phoenix'];
  const lines = agents.map(k => {
    const a = data.agents[k];
    if (!a) return '';
    return \`
      <div class="log-line">
        <span class="log-time">[\${timeStr}]</span>
        <span class="log-agent">\${a.name.toUpperCase()}:</span>
        <span class="log-msg">\${a.summary}</span>
      </div>
    \`;
  }).join('');

  box.innerHTML = lines;
  box.scrollTop = box.scrollHeight;
}

// Apply pipeline result to DOM
function applyPipelineData(data) {
  lastResult = data;
  lastFetchTimestamp = Date.now();

  // Cycle badge & latency
  const cycleEl = document.getElementById('cycle-badge');
  if (cycleEl) cycleEl.textContent = 'CYCLE #' + data.cycleNumber;
  const latEl = document.getElementById('stat-latency');
  if (latEl) latEl.textContent = data.durationMs + ' ms';

  // Lion verdict
  const verdictEl = document.getElementById('verdict-text');
  if (verdictEl) verdictEl.textContent = data.lionVerdict;

  // Swing event stats from Sentinel telemetry
  if (data.agents && data.agents.sentinel && data.agents.sentinel.telemetry) {
    const swTotal = data.agents.sentinel.telemetry.swingEventsLogged;
    const swSettled = data.agents.sentinel.telemetry.swingEventsSettled;
    if (swTotal !== undefined) {
      const swEl = document.getElementById('stat-swings');
      if (swEl) swEl.textContent = swTotal + ' (' + swSettled + ' settled)';
      const swTotalEl = document.getElementById('stat-swing-total');
      if (swTotalEl) swTotalEl.textContent = swTotal + ' events (' + swSettled + ' settled)';
    }
  }

  // Render components
  renderCouncilStatus(data.agents);
  renderPipelineNodes(data.agents);
  renderMarketPulse(data.marketQuote);
  appendLogStream(data);
}

// Fetch latest pipeline telemetry
async function fetchLatestPipeline() {
  try {
    const res = await fetch('/api/council/pipeline/latest');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    applyPipelineData(data);
  } catch (err) {
    console.error('Failed to fetch pipeline telemetry:', err);
  }
}

// Run cycle manually
async function triggerCycle() {
  const btn = document.getElementById('run-cycle-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'EXECUTING CYCLE…';
  }
  try {
    const res = await fetch('/api/council/pipeline/run', { method: 'POST' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    applyPipelineData(data);
  } catch (err) {
    console.error('Failed to run cycle:', err);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>⚡</span><span>Run Pipeline Cycle Now</span>';
    }
  }
}

document.getElementById('run-cycle-btn').addEventListener('click', triggerCycle);

// Initial load & 15-second polling loop
fetchLatestPipeline();
setInterval(fetchLatestPipeline, 15000);

// Terminal Executive Chat Controller
let currentTerminalChatAgentId = null;

async function openTerminalAgentChat(agentId) {
  currentTerminalChatAgentId = agentId;
  const backdrop = document.getElementById('terminal-chat-backdrop');
  const titleEl = document.getElementById('term-chat-name');
  const streamEl = document.getElementById('term-chat-stream');
  const promptsEl = document.getElementById('term-chat-prompts');
  const inputEl = document.getElementById('term-chat-input');
  if (!backdrop) return;

  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  if (streamEl) streamEl.innerHTML = '<div style="font-size:0.7rem; color:var(--text-dim); text-align:center;">Establishing encrypted console stream…</div>';
  if (promptsEl) promptsEl.innerHTML = '';

  try {
    const res = await fetch('/api/executives/' + agentId + '/persona');
    if (!res.ok) throw new Error('Persona not found');
    const p = await res.json();
    if (titleEl) titleEl.textContent = p.name.toUpperCase() + ' · ' + p.role.toUpperCase();

    if (streamEl) {
      streamEl.innerHTML = 
        '<div class="term-msg agent">' +
          '<div class="term-msg-head">' +
            '<span>' + escapeTerminalText(p.name) + ' [' + escapeTerminalText(p.role) + ']</span>' +
            '<span>' + new Date().toLocaleTimeString() + '</span>' +
          '</div>' +
          '<div>' + escapeTerminalText(p.initialGreeting) + '</div>' +
        '</div>';
    }

    if (promptsEl && Array.isArray(p.suggestedQuestions)) {
      promptsEl.innerHTML = p.suggestedQuestions.map(function(q) {
        var safeQ = q.replace(/'/g, "\\'");
        return '<button type="button" class="term-prompt-btn" onclick="sendTerminalChatMessage(\'' + safeQ + '\')">' + escapeTerminalText(q) + '</button>';
      }).join('');
    }

    if (inputEl) {
      setTimeout(() => inputEl.focus(), 60);
    }
  } catch (err) {
    if (streamEl) streamEl.innerHTML = '<div style="color:var(--red); font-size:0.7rem;">Failed to load specialist telemetry.</div>';
  }
}

function closeTerminalAgentChat() {
  const backdrop = document.getElementById('terminal-chat-backdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }
}

async function sendTerminalChatMessage(customText) {
  const inputEl = document.getElementById('term-chat-input');
  const streamEl = document.getElementById('term-chat-stream');
  const sendBtn = document.getElementById('term-chat-send-btn');
  const text = (customText || (inputEl ? inputEl.value : '')).trim();
  if (!text || !currentTerminalChatAgentId || !streamEl) return;

  if (inputEl) inputEl.value = '';
  if (sendBtn) sendBtn.disabled = true;

  // Append user bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'term-msg user';
  userDiv.innerHTML = 
    '<div class="term-msg-head" style="justify-content:flex-end;">' +
      '<span>OPERATOR · ' + new Date().toLocaleTimeString() + '</span>' +
    '</div>' +
    '<div>' + escapeTerminalText(text) + '</div>';
  streamEl.appendChild(userDiv);

  // Append typing indicator
  const waitDiv = document.createElement('div');
  waitDiv.className = 'term-msg agent';
  waitDiv.id = 'term-typing-indicator';
  waitDiv.innerHTML = '<span style="color:var(--accent);">Evaluating query against verified platform records…</span>';
  streamEl.appendChild(waitDiv);
  streamEl.scrollTop = streamEl.scrollHeight;

  try {
    const res = await fetch('/api/executives/' + currentTerminalChatAgentId + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    const ind = document.getElementById('term-typing-indicator');
    if (ind) ind.remove();

    const agentDiv = document.createElement('div');
    agentDiv.className = 'term-msg agent';
    let citationsHtml = '';
    if (Array.isArray(data.citations) && data.citations.length > 0) {
      citationsHtml = '<div class="term-msg-citations">' +
        data.citations.map(c => '<span class="term-citation">' + escapeTerminalText(c) + '</span>').join('') +
        '</div>';
    }
    const guardedBadge = data.guarded ? '<span class="term-guarded-badge">AUDITED RECORD</span>' : '';

    agentDiv.innerHTML = 
      '<div class="term-msg-head">' +
        '<span>' + escapeTerminalText(data.agentName || 'SPECIALIST') + ' ' + guardedBadge + '</span>' +
        '<span>' + new Date().toLocaleTimeString() + '</span>' +
      '</div>' +
      '<div>' + escapeTerminalText(data.reply || '') + '</div>' +
      citationsHtml;
    streamEl.appendChild(agentDiv);
  } catch (err) {
    const ind = document.getElementById('term-typing-indicator');
    if (ind) ind.remove();
    const errDiv = document.createElement('div');
    errDiv.className = 'term-msg agent';
    errDiv.innerHTML = '<span style="color:var(--red);">Transmission failed. Specialist unavailable.</span>';
    streamEl.appendChild(errDiv);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (inputEl) inputEl.focus();
    streamEl.scrollTop = streamEl.scrollHeight;
  }
}

function escapeTerminalText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTerminalAgentChat();
});
</script>
</body>
</html>`;
}
