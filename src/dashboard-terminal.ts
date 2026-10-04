/**
 * Live Terminal Dashboard View (/dashboard & /council)
 *
 * Celestial Alien Spaceship Bridge Console — Tactical Trading & Calibration Horizon
 * Implements a clean, organized, hyper-advanced extraterrestrial flagship interface
 * designed specifically for institutional quants, macro investors, and sovereign funds.
 *
 * "The Tesla of Intelligence":
 * - Full Self-Calibration (FSC) Multi-Agent Sensor Fusion Architecture
 * - 3D Perspective Space-Warp Starfield with mouse parallax & warp acceleration
 * - 360° Interactive Tactical Radar Sweeper with orbiting specialist blips
 * - Zero-dependency Web Audio API sound synthesis engine (warp, comms, clicks, radar, alerts, triumphs)
 * - Institutional Keyboard Flight Controls (Space/R cycle, M mute, 1-8 hail, H hotkeys, D drill, C Tesla matrix, Esc close)
 * - The Alpha Citadel Combat Readiness Drill minigame (testing empirical calibration against findings.md)
 * - The Tesla Competitive Intelligence Matrix (Head-to-head contrast vs Bloomberg $32k, Kalshi, Polymarket, Kaiko)
 */

export function renderCouncilDashboardPage(clerkScripts: string = "", clerkConfigured: boolean = false): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Celestial Council Bridge // The Tesla of Intelligence</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,500;1,9..144,600&family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
${clerkScripts}
<style>
  :root {
    --bg-void: #020409;
    --bg-deep: #050b18;
    --bg-panel: rgba(8, 16, 32, 0.78);
    --bg-panel-hover: rgba(13, 24, 46, 0.90);
    --panel-border: rgba(0, 240, 255, 0.22);
    --panel-border-glow: rgba(0, 240, 255, 0.50);
    --panel-border-gold: rgba(255, 215, 0, 0.35);
    
    --cyan-core: #00f0ff;
    --cyan-glow: rgba(0, 240, 255, 0.4);
    --plasma-blue: #38bdf8;
    --plasma-violet: #818cf8;
    --nebula-glow: rgba(129, 140, 248, 0.2);
    
    --gold-pulsar: #ffd700;
    --gold-glow: rgba(255, 215, 0, 0.4);
    
    --green-warp: #00ff88;
    --green-glow: rgba(0, 255, 136, 0.35);
    
    --alert-crimson: #ff3366;
    --alert-amber: #ffaa00;
    
    --text-primary: #f0f9ff;
    --text-stellar: #bae6fd;
    --text-dim: #7dd3fc;
    --text-muted: #64748b;
    
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: var(--bg-void);
    color: var(--text-primary);
    font-family: "Space Grotesk", "Outfit", -apple-system, sans-serif;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    letter-spacing: -0.01em;
    user-select: text;
  }

  /* Interactive 3D Canvas Starfield Backdrop */
  #celestial-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -3;
    pointer-events: none;
  }

  /* Deep Celestial Void with Nebula Overlay */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background: 
      radial-gradient(1200px 600px at 50% 0%, rgba(0, 240, 255, 0.07) 0%, transparent 70%),
      radial-gradient(900px 700px at 85% 85%, rgba(129, 140, 248, 0.06) 0%, transparent 60%),
      radial-gradient(800px 500px at 15% 70%, rgba(255, 215, 0, 0.04) 0%, transparent 50%),
      linear-gradient(180deg, rgba(2,4,9,0.7) 0%, rgba(4,9,20,0.85) 100%);
    pointer-events: none;
    z-index: -2;
  }

  /* Holographic Star Coordinates Grid Overlay */
  body::after {
    content: "";
    position: fixed;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 240, 255, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.035) 1px, transparent 1px);
    background-size: 48px 48px;
    background-position: -1px -1px;
    pointer-events: none;
    z-index: -1;
  }

  /* Futuristic Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: rgba(4, 8, 16, 0.8); }
  ::-webkit-scrollbar-thumb { background: rgba(0, 240, 255, 0.25); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--cyan-core); }

  /* ==========================================================================
     Top Bridge Star-Deck HUD
     ========================================================================== */
  .hud-deck {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 28px;
    border-bottom: 1px solid var(--panel-border);
    font-size: 0.74rem;
    font-family: "Space Mono", monospace;
    color: var(--text-dim);
    background: rgba(2, 6, 14, 0.88);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(0, 240, 255, 0.15);
  }

  .hud-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--green-warp);
    box-shadow: 0 0 10px var(--green-warp), 0 0 20px rgba(0, 255, 136, 0.4);
    display: inline-block;
    animation: celestialPulse 2.4s infinite ease-in-out;
  }

  @keyframes celestialPulse {
    0%, 100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 8px #00ff88); }
    50% { transform: scale(0.85); opacity: 0.4; filter: drop-shadow(0 0 2px #00ff88); }
  }

  .hud-ship-tag {
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--text-primary);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hud-badge-gold {
    background: rgba(255, 215, 0, 0.12);
    border: 1px solid var(--panel-border-gold);
    color: var(--gold-pulsar);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
  }

  .hud-center {
    font-family: "Space Grotesk", sans-serif;
    font-weight: 600;
    letter-spacing: 0.16em;
    font-size: 0.8rem;
    color: var(--cyan-core);
    text-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hud-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .hud-clock {
    color: var(--cyan-core);
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  .hud-action-btn {
    background: rgba(0, 240, 255, 0.08);
    border: 1px solid var(--panel-border);
    color: var(--text-dim);
    font-family: "Space Mono", monospace;
    font-size: 0.68rem;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .hud-action-btn:hover {
    background: rgba(0, 240, 255, 0.2);
    color: var(--cyan-core);
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
    transform: translateY(-1px);
  }

  .hud-action-btn.gold-btn {
    background: rgba(255, 215, 0, 0.08);
    border-color: var(--panel-border-gold);
    color: var(--gold-pulsar);
  }
  .hud-action-btn.gold-btn:hover {
    background: rgba(255, 215, 0, 0.2);
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.35);
  }

  .hud-nav-link {
    color: var(--text-dim);
    text-decoration: none;
    transition: all 0.2s;
    font-size: 0.72rem;
  }
  .hud-nav-link:hover {
    color: var(--cyan-core);
    text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
  }

  /* ==========================================================================
     Main Bridge Tactical Layout
     ========================================================================== */
  .bridge-container {
    max-width: 1640px;
    margin: 0 auto;
    padding: 24px;
    display: grid;
    grid-template-columns: 350px 1fr 360px;
    gap: 22px;
    align-items: start;
  }

  @media (max-width: 1340px) {
    .bridge-container { grid-template-columns: 1fr; }
  }

  .bridge-col {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Celestial Glass Console Panel */
  .celestial-panel {
    background: var(--bg-panel);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    padding: 20px;
    position: relative;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transition: border-color 0.25s, box-shadow 0.25s;
    overflow: hidden;
  }

  .celestial-panel:hover {
    border-color: var(--panel-border-glow);
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 240, 255, 0.1);
  }

  .celestial-panel.gold-matrix {
    border-color: var(--panel-border-gold);
  }

  /* Spaceship Viewport Corner Brackets */
  .celestial-panel::before {
    content: "◤";
    position: absolute;
    top: 6px;
    left: 8px;
    font-size: 0.7rem;
    color: var(--cyan-core);
    opacity: 0.4;
    pointer-events: none;
  }
  .celestial-panel::after {
    content: "◢";
    position: absolute;
    bottom: 6px;
    right: 8px;
    font-size: 0.7rem;
    color: var(--cyan-core);
    opacity: 0.4;
    pointer-events: none;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0, 240, 255, 0.12);
  }

  .panel-header-title {
    font-family: "Space Mono", monospace;
    font-size: 0.74rem;
    letter-spacing: 0.14em;
    color: var(--text-dim);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }

  .title-icon-orb {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cyan-core);
    box-shadow: 0 0 8px var(--cyan-core);
  }
  .title-icon-orb.gold { background: var(--gold-pulsar); box-shadow: 0 0 8px var(--gold-pulsar); }
  .title-icon-orb.green { background: var(--green-warp); box-shadow: 0 0 8px var(--green-warp); }

  /* ==========================================================================
     LEFT COLUMN: 8-Officer Fleet Matrix & Subsystems
     ========================================================================== */
  .officer-fleet-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .officer-matrix-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: rgba(3, 8, 18, 0.65);
    border: 1px solid rgba(0, 240, 255, 0.1);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    position: relative;
  }

  .officer-matrix-card:hover {
    background: rgba(0, 240, 255, 0.08);
    border-color: var(--cyan-core);
    transform: translateX(4px);
    box-shadow: 0 0 16px rgba(0, 240, 255, 0.2);
  }

  .officer-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .officer-radar-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .officer-radar-dot.green {
    background: var(--green-warp);
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.7);
  }
  .officer-radar-dot.amber {
    background: var(--alert-amber);
    box-shadow: 0 0 10px rgba(255, 170, 0, 0.7);
  }
  .officer-radar-dot.red {
    background: var(--alert-crimson);
    box-shadow: 0 0 10px rgba(255, 51, 102, 0.7);
  }

  .officer-identity {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .officer-name {
    font-weight: 700;
    color: var(--text-primary);
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.82rem;
  }

  .officer-role {
    font-size: 0.66rem;
    color: var(--text-dim);
    font-family: "Space Mono", monospace;
  }

  .officer-status-telemetry {
    text-align: right;
    font-family: "Space Mono", monospace;
  }

  .officer-status-label {
    font-size: 0.68rem;
    color: var(--cyan-core);
    font-weight: 600;
  }

  .officer-status-time {
    font-size: 0.6rem;
    color: var(--text-muted);
  }

  /* Subsystems Telemetry Grid */
  .subsystem-metrics-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: "Space Mono", monospace;
    font-size: 0.74rem;
  }

  .subsystem-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid rgba(0, 240, 255, 0.06);
  }
  .subsystem-row:last-child { border-bottom: none; }

  .subsystem-key { color: var(--text-muted); font-size: 0.7rem; }
  .subsystem-val { color: var(--text-primary); font-weight: 600; text-align: right; }

  /* ==========================================================================
     CENTER COMMAND DECK: Lion Consensus Reactor & Tactical Coordination
     ========================================================================== */
  .center-console-deck {
    background: rgba(5, 12, 26, 0.82);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-lg);
    padding: 26px;
    position: relative;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .center-console-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 22px;
  }

  .center-eyebrow {
    font-family: "Space Mono", monospace;
    font-size: 0.68rem;
    color: var(--cyan-core);
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .center-title {
    font-size: 1.45rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  .stats-trio-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 22px;
  }

  .stat-trio-box {
    background: rgba(3, 8, 18, 0.6);
    border: 1px solid rgba(0, 240, 255, 0.15);
    border-radius: var(--radius-sm);
    padding: 14px;
    position: relative;
    overflow: hidden;
  }

  .stat-trio-label {
    font-family: "Space Mono", monospace;
    font-size: 0.64rem;
    text-transform: uppercase;
    color: var(--text-dim);
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }

  .stat-trio-num {
    font-size: 1.25rem;
    font-weight: 700;
    font-family: "Space Grotesk", sans-serif;
    color: var(--text-primary);
  }

  .stat-trio-sub {
    font-size: 0.64rem;
    color: var(--text-muted);
    margin-top: 4px;
    font-family: "Space Mono", monospace;
  }

  /* Synthesis Verdict Reactor Chamber */
  .lion-synthesis-chamber {
    background: linear-gradient(135deg, rgba(8, 20, 42, 0.85) 0%, rgba(3, 10, 22, 0.95) 100%);
    border: 1px solid var(--panel-border-glow);
    border-radius: var(--radius-md);
    padding: 20px;
    margin-bottom: 24px;
    position: relative;
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.15), inset 0 0 20px rgba(0, 240, 255, 0.05);
  }

  .chamber-tagline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: "Space Mono", monospace;
    font-size: 0.68rem;
    color: var(--cyan-core);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .lion-verdict-banner {
    font-size: 0.98rem;
    font-weight: 500;
    line-height: 1.5;
    color: #e0f2fe;
    font-family: "Space Grotesk", sans-serif;
  }

  /* 8-Node Pipeline Warp Array */
  .pipeline-nodes-array {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 24px;
  }

  @media (max-width: 900px) {
    .pipeline-nodes-array { grid-template-columns: repeat(2, 1fr); }
  }

  .tactical-node-card {
    background: rgba(3, 9, 20, 0.7);
    border: 1px solid rgba(0, 240, 255, 0.15);
    border-radius: var(--radius-sm);
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
  }

  .tactical-node-card:hover {
    border-color: var(--cyan-core);
    background: rgba(0, 240, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 240, 255, 0.25);
  }

  .tactical-node-card.active-tactical {
    border-color: var(--gold-pulsar);
    background: rgba(255, 215, 0, 0.08);
    box-shadow: 0 0 16px rgba(255, 215, 0, 0.3);
  }

  .node-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .node-step-tag {
    font-size: 0.6rem;
    font-family: "Space Mono", monospace;
    color: var(--text-dim);
  }

  .node-name-text {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .node-role-text {
    font-size: 0.62rem;
    color: var(--text-muted);
    font-family: "Space Mono", monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-telemetry-badge {
    margin-top: 6px;
    font-size: 0.6rem;
    font-family: "Space Mono", monospace;
    color: var(--cyan-core);
    background: rgba(0, 240, 255, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Node Detail Hologram Drawer */
  .node-detail-hologram {
    background: rgba(2, 6, 14, 0.85);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    padding: 16px;
    margin-bottom: 22px;
    font-family: "Space Mono", monospace;
    font-size: 0.72rem;
    display: none;
    animation: fadeInHolo 0.3s ease;
  }
  .node-detail-hologram.show { display: block; }

  @keyframes fadeInHolo {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Phoenix Singularity Shield Barrier */
  .phoenix-barrier-card {
    background: rgba(18, 5, 12, 0.6);
    border: 1px solid rgba(255, 51, 102, 0.35);
    border-radius: var(--radius-sm);
    padding: 14px 18px;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .barrier-icon-seal {
    font-size: 1.4rem;
    filter: drop-shadow(0 0 10px #ff3366);
  }

  .barrier-title {
    font-family: "Space Mono", monospace;
    font-size: 0.74rem;
    color: var(--alert-crimson);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .barrier-desc {
    font-size: 0.74rem;
    color: var(--text-dim);
    margin-top: 3px;
    line-height: 1.4;
  }

  /* Chronological Subspace Log Stream */
  .stream-log-view {
    background: rgba(2, 5, 12, 0.9);
    border: 1px solid rgba(0, 240, 255, 0.15);
    border-radius: var(--radius-sm);
    padding: 12px;
    font-family: "Space Mono", monospace;
    font-size: 0.7rem;
    height: 140px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stream-log-row {
    display: flex;
    gap: 10px;
    line-height: 1.35;
  }

  .log-chronos { color: var(--text-muted); flex-shrink: 0; }
  .log-agent-glyph { color: var(--cyan-core); font-weight: 600; flex-shrink: 0; }
  .log-payload { color: var(--text-stellar); }

  /* Tactical Trigger Bar */
  .tactical-trigger-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(0, 240, 255, 0.12);
  }

  .warp-cycle-btn {
    background: linear-gradient(135deg, rgba(0, 240, 255, 0.25) 0%, rgba(129, 140, 248, 0.25) 100%);
    border: 1px solid var(--cyan-core);
    color: var(--text-primary);
    font-family: "Space Mono", monospace;
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 12px rgba(0, 240, 255, 0.2);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .warp-cycle-btn:hover {
    background: linear-gradient(135deg, rgba(0, 240, 255, 0.45) 0%, rgba(129, 140, 248, 0.45) 100%);
    box-shadow: 0 0 32px rgba(0, 240, 255, 0.6), inset 0 0 16px rgba(0, 240, 255, 0.4);
    transform: translateY(-2px);
  }

  .warp-cycle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* ==========================================================================
     RIGHT COLUMN: 360° Tactical Radar & Market Calibration Horizon
     ========================================================================== */
  .radar-scope-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 14px;
  }

  #tactical-radar-canvas {
    width: 100%;
    max-width: 320px;
    height: 220px;
    background: rgba(2, 6, 14, 0.92);
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: var(--radius-sm);
    box-shadow: 0 0 24px rgba(0, 240, 255, 0.15) inset, 0 4px 16px rgba(0, 0, 0, 0.7);
    cursor: crosshair;
  }

  .radar-legend {
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin-top: 8px;
    font-size: 0.62rem;
    font-family: "Space Mono", monospace;
    color: var(--text-dim);
  }

  .radar-legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .market-pulse-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 14px;
  }

  .market-metric-box {
    background: rgba(3, 8, 18, 0.6);
    border: 1px solid rgba(0, 240, 255, 0.12);
    border-radius: var(--radius-sm);
    padding: 10px;
  }

  .metric-label {
    font-size: 0.62rem;
    color: var(--text-muted);
    font-family: "Space Mono", monospace;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .metric-val {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
    font-family: "Space Mono", monospace;
  }

  .brier-meter-block {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 215, 0, 0.15);
  }

  /* ==========================================================================
     SUBSPACE COMMS MODAL (Live Interrogation Stream)
     ========================================================================== */
  .subspace-comms-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(1, 4, 10, 0.85);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }

  .subspace-comms-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  .subspace-comms-window {
    background: #040a18;
    border: 1px solid var(--panel-border-glow);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 240, 255, 0.25);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 680px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .subspace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 22px;
    border-bottom: 1px solid rgba(0, 240, 255, 0.18);
    background: rgba(8, 16, 32, 0.85);
  }

  .subspace-header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: "Space Mono", monospace;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--cyan-core);
    text-transform: uppercase;
  }

  .audio-waveform-bars {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 16px;
  }

  .audio-bar {
    width: 3px;
    height: 100%;
    background: var(--cyan-core);
    border-radius: 2px;
    animation: wavePulse 1.2s infinite ease-in-out;
  }
  .audio-bar:nth-child(2) { animation-delay: 0.2s; height: 65%; }
  .audio-bar:nth-child(3) { animation-delay: 0.4s; height: 85%; }
  .audio-bar:nth-child(4) { animation-delay: 0.1s; height: 45%; }

  @keyframes wavePulse {
    0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
    50% { transform: scaleY(1); opacity: 1; filter: drop-shadow(0 0 6px #00f0ff); }
  }

  .subspace-close-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
  }
  .subspace-close-btn:hover { color: var(--alert-crimson); }

  .subspace-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    flex: 1;
  }

  .subspace-governance-strip {
    background: rgba(0, 240, 255, 0.06);
    border: 1px solid rgba(0, 240, 255, 0.15);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-size: 0.72rem;
    color: var(--text-dim);
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .subspace-chat-stream {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 320px;
    overflow-y: auto;
    padding-right: 6px;
  }

  .subspace-msg {
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .subspace-msg.agent {
    background: rgba(8, 16, 32, 0.85);
    border: 1px solid rgba(0, 240, 255, 0.2);
    color: var(--text-primary);
  }

  .subspace-msg.user {
    background: rgba(0, 240, 255, 0.12);
    border: 1px solid rgba(0, 240, 255, 0.35);
    color: var(--cyan-core);
    align-self: flex-end;
    max-width: 85%;
  }

  .subspace-msg-header {
    display: flex;
    justify-content: space-between;
    font-family: "Space Mono", monospace;
    font-size: 0.65rem;
    color: var(--text-dim);
    margin-bottom: 6px;
  }

  .citation-crystal-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .crystal-pill {
    background: rgba(0, 240, 255, 0.1);
    border: 1px solid rgba(0, 240, 255, 0.25);
    color: var(--cyan-core);
    font-size: 0.64rem;
    font-family: "Space Mono", monospace;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .subspace-prompts-matrix {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .tactical-prompt-btn {
    background: rgba(3, 9, 20, 0.8);
    border: 1px solid rgba(0, 240, 255, 0.2);
    color: var(--text-dim);
    font-family: "Space Mono", monospace;
    font-size: 0.68rem;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  .tactical-prompt-btn:hover {
    border-color: var(--cyan-core);
    color: var(--cyan-core);
    background: rgba(0, 240, 255, 0.12);
  }

  .subspace-input-row {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .subspace-input {
    flex: 1;
    background: rgba(2, 6, 14, 0.85);
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: var(--text-primary);
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .subspace-input:focus {
    border-color: var(--cyan-core);
    box-shadow: 0 0 16px rgba(0, 240, 255, 0.25);
  }

  .subspace-send-btn {
    background: var(--cyan-core);
    border: none;
    color: #020612;
    font-family: "Space Mono", monospace;
    font-weight: 700;
    font-size: 0.76rem;
    letter-spacing: 0.1em;
    padding: 10px 20px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
  }
  .subspace-send-btn:hover {
    background: #e0f9ff;
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.7);
  }

  /* ==========================================================================
     TACTICAL FLIGHT MANUAL / HOTKEYS MODAL
     ========================================================================== */
  .hud-hotkeys-overlay {
    position: fixed;
    inset: 0;
    background: rgba(1, 4, 10, 0.88);
    backdrop-filter: blur(16px);
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .hud-hotkeys-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .hotkeys-card {
    background: #040916;
    border: 1px solid var(--panel-border-glow);
    border-radius: var(--radius-lg);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 240, 255, 0.2);
    width: 100%;
    max-width: 620px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .hotkey-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .hotkey-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(8, 16, 32, 0.6);
    border: 1px solid rgba(0, 240, 255, 0.12);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
  }

  .kbd-key {
    background: rgba(0, 240, 255, 0.15);
    border: 1px solid var(--cyan-core);
    color: var(--cyan-core);
    font-family: "Space Mono", monospace;
    font-weight: 700;
    font-size: 0.72rem;
    padding: 2px 7px;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 240, 255, 0.2);
  }

  .hotkey-desc {
    font-size: 0.72rem;
    color: var(--text-dim);
    font-family: "Space Mono", monospace;
  }

  /* ==========================================================================
     THE ALPHA CITADEL: COMBAT READINESS DRILL MODAL
     ========================================================================== */
  .drill-overlay {
    position: fixed;
    inset: 0;
    background: rgba(1, 4, 10, 0.9);
    backdrop-filter: blur(18px);
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .drill-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .drill-card {
    background: #040a1a;
    border: 1px solid var(--panel-border-gold);
    border-radius: var(--radius-lg);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.95), 0 0 50px rgba(255, 215, 0, 0.25);
    width: 100%;
    max-width: 740px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .drill-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    padding-bottom: 14px;
  }

  .drill-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--gold-pulsar);
    font-family: "Space Grotesk", sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .drill-scoreboard {
    display: flex;
    gap: 16px;
    background: rgba(255, 215, 0, 0.08);
    border: 1px solid rgba(255, 215, 0, 0.25);
    border-radius: var(--radius-sm);
    padding: 10px 16px;
    font-family: "Space Mono", monospace;
    font-size: 0.74rem;
  }

  .drill-scenario-box {
    background: rgba(6, 14, 30, 0.8);
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: var(--radius-sm);
    padding: 16px;
  }

  .drill-scenario-title {
    color: var(--cyan-core);
    font-family: "Space Mono", monospace;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
  }

  .drill-scenario-body {
    font-size: 0.85rem;
    line-height: 1.55;
    color: #f0f9ff;
  }

  .drill-options-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 14px;
  }

  .drill-choice-btn {
    background: rgba(8, 18, 38, 0.75);
    border: 1px solid rgba(0, 240, 255, 0.25);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    color: var(--text-primary);
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.82rem;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .drill-choice-btn:hover {
    border-color: var(--cyan-core);
    background: rgba(0, 240, 255, 0.14);
    transform: translateX(4px);
  }

  .drill-result-box {
    padding: 14px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    line-height: 1.5;
    font-family: "Space Mono", monospace;
    display: none;
    animation: fadeInHolo 0.25s ease;
  }
  .drill-result-box.pass {
    display: block;
    background: rgba(0, 255, 136, 0.12);
    border: 1px solid var(--green-warp);
    color: #afffd5;
  }
  .drill-result-box.fail {
    display: block;
    background: rgba(255, 51, 102, 0.12);
    border: 1px solid var(--alert-crimson);
    color: #ffb3c6;
  }

  /* ==========================================================================
     THE TESLA OF INTELLIGENCE: COMPETITIVE ARCHITECTURE & BENCHMARK MODAL
     ========================================================================== */
  .tesla-matrix-overlay {
    position: fixed;
    inset: 0;
    background: rgba(1, 4, 10, 0.92);
    backdrop-filter: blur(20px);
    z-index: 1150;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .tesla-matrix-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .tesla-matrix-card {
    background: #030713;
    border: 1px solid var(--panel-border-glow);
    border-radius: var(--radius-lg);
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.95), 0 0 60px rgba(0, 240, 255, 0.25);
    width: 100%;
    max-width: 980px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
  }

  .tesla-tabs-bar {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid rgba(0, 240, 255, 0.15);
    padding-bottom: 12px;
  }

  .tesla-tab-btn {
    background: rgba(8, 16, 32, 0.6);
    border: 1px solid rgba(0, 240, 255, 0.15);
    color: var(--text-dim);
    font-family: "Space Mono", monospace;
    font-size: 0.72rem;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tesla-tab-btn.active {
    background: rgba(0, 240, 255, 0.18);
    border-color: var(--cyan-core);
    color: var(--cyan-core);
    font-weight: 700;
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
  }

  .tesla-matrix-table {
    width: 100%;
    border-collapse: collapse;
    font-family: "Space Grotesk", sans-serif;
    font-size: 0.78rem;
    margin-top: 10px;
  }
  .tesla-matrix-table th {
    text-align: left;
    padding: 10px 12px;
    font-family: "Space Mono", monospace;
    font-size: 0.7rem;
    color: var(--cyan-core);
    border-bottom: 1px solid rgba(0, 240, 255, 0.25);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .tesla-matrix-table td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(0, 240, 255, 0.08);
    color: var(--text-stellar);
    vertical-align: top;
    line-height: 1.45;
  }
  .tesla-matrix-table tr:hover td {
    background: rgba(0, 240, 255, 0.04);
  }
  .tesla-highlight-cell {
    color: var(--gold-pulsar) !important;
    font-weight: 700;
  }

  /* ==========================================================================
     HUD TOAST NOTIFICATIONS
     ========================================================================== */
  .hud-toast-wrap {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .hud-toast {
    background: rgba(4, 10, 24, 0.94);
    border: 1px solid var(--cyan-core);
    box-shadow: 0 4px 20px rgba(0, 240, 255, 0.3);
    border-radius: var(--radius-sm);
    padding: 10px 16px;
    font-family: "Space Mono", monospace;
    font-size: 0.72rem;
    color: var(--cyan-core);
    animation: toastSlide 0.25s ease;
  }

  @keyframes toastSlide {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Footer Command Deck */
  .footer-subspace-bar {
    text-align: center;
    padding: 24px;
    border-top: 1px solid rgba(0, 240, 255, 0.12);
    font-size: 0.68rem;
    color: var(--text-muted);
    font-family: "Space Mono", monospace;
    letter-spacing: 0.12em;
    background: rgba(2, 4, 10, 0.95);
    margin-top: 40px;
  }
</style>
</head>
<body>

  <!-- 3D Perspective Canvas Starfield Backdrop -->
  <canvas id="celestial-canvas"></canvas>

  <!-- HUD Toast Stream -->
  <div class="hud-toast-wrap" id="hud-toast-container"></div>

  <!-- Top Star-Deck Bridge Header -->
  <header class="hud-deck">
    <div class="hud-left">
      <span class="beacon-dot"></span>
      <span class="hud-ship-tag">
        <span>QUANTERRAOS</span>
        <span class="hud-badge-gold">THE TESLA OF INTEL</span>
      </span>
      <span>•</span>
      <span style="color:var(--text-primary); font-weight:600;">BTC/USD 15M TACTICAL DECK</span>
      <span>•</span>
      <span id="cycle-badge" style="color:var(--cyan-core); font-weight:700;">CYCLE #--</span>
    </div>

    <div class="hud-center">
      <span>CELESTIAL COUNCIL BRIDGE</span>
    </div>

    <div class="hud-right">
      <span class="hud-clock" id="utc-clock">00:00:00 UTC</span>
      <button type="button" class="hud-action-btn gold-btn" onclick="openTeslaMatrix()" title="The Tesla of Intelligence: Competitive Architecture [C]">
        <span>⚡</span><span>TESLA MATRIX [C]</span>
      </button>
      <button type="button" class="hud-action-btn gold-btn" onclick="openCombatDrill()" title="Launch Combat Readiness Drill [D]">
        <span>⚔️</span><span>COMBAT DRILL [D]</span>
      </button>
      <button type="button" class="hud-action-btn" onclick="toggleHotkeysHelp()" title="Flight Controls & Hotkeys [H]">
        <span>⌨️</span><span>HOTKEYS [H]</span>
      </button>
      <button type="button" class="hud-action-btn" id="sfx-toggle" onclick="toggleSfx()" title="Toggle Web Audio SFX [M]">
        <span>🔊</span><span>AUDIO: ON</span>
      </button>
      <a href="/calibration" class="hud-nav-link" target="_blank">Calibration Report &rarr;</a>
    </div>
  </header>

  <!-- Main Bridge Tactical Layout -->
  <main class="bridge-container">

    <!-- LEFT COLUMN: 8-Officer Fleet Matrix & Subsystems -->
    <div class="bridge-col">
      
      <!-- 8-Specialist Operational Array -->
      <section class="celestial-panel">
        <div class="panel-header">
          <div class="panel-header-title">
            <span class="title-icon-orb green"></span>
            <span>COUNCIL SPECIALISTS (8)</span>
          </div>
          <span style="color:var(--cyan-core); font-size:0.68rem; font-family:'Space Mono', monospace; font-weight:700;">LIVE LINKS</span>
        </div>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:12px; font-family:'Space Mono', monospace;">
          Select officer or press [1-8] to hail subspace channel:
        </div>
        <div class="officer-fleet-list" id="officer-matrix-list">
          <!-- Populated dynamically via JS -->
        </div>
      </section>

      <!-- Subsystems Telemetry Grid -->
      <section class="celestial-panel">
        <div class="panel-header">
          <div class="panel-header-title">
            <span class="title-icon-orb"></span>
            <span>VESSEL SUBSYSTEMS</span>
          </div>
          <span style="color:var(--green-warp); font-size:0.68rem; font-family:'Space Mono', monospace;">100% HEALTHY</span>
        </div>
        <div class="subsystem-metrics-list">
          <div class="subsystem-row">
            <span class="subsystem-key">Feed Latency</span>
            <span class="subsystem-val" id="stat-latency">-- ms</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Swing Logger (§12)</span>
            <span class="subsystem-val" id="stat-swings" style="color:var(--cyan-core);">245 (131 settled)</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Rule B5 Risk Envelope</span>
            <span class="subsystem-val" style="color:var(--green-warp);">$0.00 Live Deployed</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Calibration Sample</span>
            <span class="subsystem-val" style="color:var(--gold-pulsar);">1,316 Markets</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Single Source of Truth</span>
            <span class="subsystem-val">docs/findings.md</span>
          </div>
        </div>
      </section>

    </div>

    <!-- CENTER COLUMN: Lion Consensus Reactor & Tactical Coordination -->
    <div class="bridge-col">
      
      <section class="center-console-deck">
        <div class="center-console-header">
          <div>
            <div class="center-eyebrow">
              <span class="title-icon-orb gold"></span>
              <span>SYNTHESIS REACTOR · SINGLE SOURCE OF TRUTH</span>
            </div>
            <h1 class="center-title">Lion Calibration & Risk Deck</h1>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.65rem; color:var(--text-muted); font-family:'Space Mono', monospace;">COORDINATION PROTOCOL</div>
            <div style="font-size:0.8rem; color:var(--green-warp); font-weight:700; font-family:'Space Mono', monospace;">NOMINAL_STANDBY</div>
          </div>
        </div>

        <!-- Telemetry Stats Trio -->
        <div class="stats-trio-grid">
          <div class="stat-trio-box">
            <div class="stat-trio-label">Market Calibration</div>
            <div class="stat-trio-num" style="color:var(--green-warp);">NOMINAL</div>
            <div class="stat-trio-sub">Brier 0.2001 (Beats 0.2500)</div>
          </div>
          <div class="stat-trio-box">
            <div class="stat-trio-label">Quantum Fox Alpha Gate</div>
            <div class="stat-trio-num" style="color:var(--alert-amber);">NO EDGE</div>
            <div class="stat-trio-sub">Market mid beats model (+0.0062)</div>
          </div>
          <div class="stat-trio-box">
            <div class="stat-trio-label">Phoenix Live Risk Gate</div>
            <div class="stat-trio-num" style="color:var(--cyan-core);">LOCKED</div>
            <div class="stat-trio-sub">Zero live capital ($0.00)</div>
          </div>
        </div>

        <!-- Lion Synthesis Verdict Chamber -->
        <div class="lion-synthesis-chamber">
          <div class="chamber-tagline">
            <span>🦁 LION CONSENSUS AUDIT VERDICT</span>
            <span id="verdict-timestamp">REAL-TIME TELEMETRY</span>
          </div>
          <div class="lion-verdict-banner" id="verdict-text">
            Calibrating cross-council telemetry stream…
          </div>
        </div>

        <!-- 8-Node Pipeline Warp Array -->
        <div style="font-size:0.68rem; color:var(--text-dim); font-family:'Space Mono', monospace; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.12em;">
          Tactical Pipeline Coordination Array (Select Node for Subsystem Telemetry):
        </div>
        <div class="pipeline-nodes-array" id="pipeline-nodes-grid">
          <!-- Populated dynamically via JS -->
        </div>
        <div class="node-detail-hologram" id="node-detail-box">
          <!-- Populated upon node selection -->
        </div>
      </section>

      <!-- Phoenix Singularity Shield Barrier -->
      <section class="phoenix-barrier-card">
        <div class="barrier-icon-seal">🔒</div>
        <div>
          <div class="barrier-title" id="phoenix-gate-title">CONTAINMENT SHIELD ARMED // EXECUTION CIRCUIT-BREAKER ENGAGED</div>
          <div class="barrier-desc" id="phoenix-gate-desc">
            Under QuanterraOS governance rules, zero live capital is deployed until an empirical signal demonstrates verified out-of-sample positive expectancy after fees. Active capital: <strong>$0.00</strong>. Live orders: <strong>0</strong>.
          </div>
        </div>
      </section>

      <!-- Chronological Subspace Log Stream -->
      <div style="font-size:0.68rem; color:var(--text-dim); font-family:'Space Mono', monospace; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.12em;">
        Subspace Telemetry Stream Log
      </div>
      <div class="stream-log-view" id="terminal-log-box">
        <div class="stream-log-row">
          <span class="log-chronos">[00:00:00]</span>
          <span class="log-agent-glyph">BRIDGE:</span>
          <span class="log-payload">Awaiting orbital coordination pulse…</span>
        </div>
      </div>

      <!-- Tactical Trigger Bar -->
      <div class="tactical-trigger-bar">
        <button type="button" class="warp-cycle-btn" id="run-cycle-btn">
          <span>⚡</span>
          <span>INITIATE COORDINATION CYCLE NOW [SPACE]</span>
        </button>
        <div style="display:flex; align-items:center; gap:8px; font-family:'Space Mono', monospace; font-size:0.7rem; color:var(--text-dim);">
          <span class="beacon-dot"></span>
          <span id="poll-indicator">AUTOPILOT POLLING (15S INTERVAL)</span>
        </div>
      </div>

    </div>

    <!-- RIGHT COLUMN: 360° Tactical Radar & Market Calibration Horizon -->
    <div class="bridge-col">
      
      <!-- 360° Tactical Radar Scope Widget -->
      <section class="celestial-panel">
        <div class="panel-header">
          <div class="panel-header-title">
            <span class="title-icon-orb green"></span>
            <span>360° TACTICAL RADAR SCOPE</span>
          </div>
          <span id="radar-status-text" style="color:var(--green-warp); font-size:0.65rem; font-family:'Space Mono', monospace;">SWEEPING ACTIVE</span>
        </div>

        <div class="radar-scope-wrapper">
          <canvas id="tactical-radar-canvas" width="320" height="220"></canvas>
          <div class="radar-legend">
            <div class="radar-legend-item">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#00f0ff;"></span>
              <span>Specialists</span>
            </div>
            <div class="radar-legend-item">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ffd700;"></span>
              <span>Lion Synthesizer</span>
            </div>
            <div class="radar-legend-item">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#00ff88;"></span>
              <span>Calibrated Range</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Market Pulse Scanner (KXBTC15M) -->
      <section class="celestial-panel">
        <div class="panel-header">
          <div class="panel-header-title">
            <span class="title-icon-orb"></span>
            <span>MARKET PULSE (KXBTC15M)</span>
          </div>
          <span id="market-ticker-badge" style="color:var(--cyan-core); font-size:0.68rem; font-family:'Space Mono', monospace; font-weight:700;">ACTIVE TARGET</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-dim); font-family:'Space Grotesk', sans-serif;" id="market-contract-name">
          Acquiring contract telemetry…
        </div>

        <div class="market-pulse-grid">
          <div class="market-metric-box">
            <div class="metric-label">Strike Target</div>
            <div class="metric-val" id="quote-strike">$85,260</div>
          </div>
          <div class="market-metric-box">
            <div class="metric-label">Time to Horizon</div>
            <div class="metric-val" id="quote-countdown" style="color:var(--cyan-core);">--m --s</div>
          </div>
          <div class="market-metric-box">
            <div class="metric-label">YES Bid / Ask</div>
            <div class="metric-val" id="quote-yes" style="color:var(--green-warp);">$0.44 / $0.45</div>
          </div>
          <div class="market-metric-box">
            <div class="metric-label">NO Bid / Ask</div>
            <div class="metric-val" id="quote-no" style="color:var(--alert-amber);">$0.55 / $0.56</div>
          </div>
        </div>

        <div class="subsystem-metrics-list" style="margin-top:14px;">
          <div class="subsystem-row">
            <span class="subsystem-key">Market Mid Price</span>
            <span class="subsystem-val" id="stat-mid" style="color:var(--cyan-core);">$0.4450</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Bid-Ask Spread</span>
            <span class="subsystem-val" id="stat-spread">$0.0100</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Settlement Anchor</span>
            <span class="subsystem-val">CME CF BRTI 60s Avg</span>
          </div>
        </div>
      </section>

      <!-- Institutional Calibration Benchmark -->
      <section class="celestial-panel gold-matrix">
        <div class="panel-header">
          <div class="panel-header-title">
            <span class="title-icon-orb gold"></span>
            <span>CALIBRATION BENCHMARK RADAR</span>
          </div>
          <span style="color:var(--gold-pulsar); font-size:0.68rem; font-family:'Space Mono', monospace; font-weight:700;">N=1,316</span>
        </div>
        
        <div class="subsystem-metrics-list">
          <div class="subsystem-row">
            <span class="subsystem-key">Market Mid Brier</span>
            <span class="subsystem-val" style="color:var(--green-warp);">0.2001 (Calibrated)</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Internal Model Brier</span>
            <span class="subsystem-val" style="color:var(--alert-amber);">0.2063 (Loses to Market)</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Base-Rate Coin Flip</span>
            <span class="subsystem-val">0.2500 (Random Walk)</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Held-Out Simulated EV</span>
            <span class="subsystem-val" style="color:var(--alert-crimson);">-2.15¢ / contract</span>
          </div>
        </div>

        <div class="brier-meter-block">
          <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px;">
            Murphy Calibration Decomposition
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Reliability (Loss)</span>
            <span class="subsystem-val">0.0031</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Resolution (Skill)</span>
            <span class="subsystem-val">0.0528</span>
          </div>
          <div class="subsystem-row">
            <span class="subsystem-key">Uncertainty (Entropy)</span>
            <span class="subsystem-val">0.2498</span>
          </div>
        </div>

        <!-- Section 12 Sudden Price-Swing Audit Callout -->
        <div style="margin-top:14px; padding:10px; border-radius:6px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,215,0,0.2); font-family:'Space Mono', monospace; font-size:0.68rem;">
          <div style="color:var(--gold-pulsar); font-weight:700; margin-bottom:4px;">§12 PRICE-SWING AUDIT: NO EDGE</div>
          <div style="color:var(--text-muted); line-height:1.45;">
            Walk-forward split (n=131): 95% CI spans zero [-$0.067, +$0.147]. Market mid beats momentum rules.
          </div>
        </div>

      </section>

    </div>

  </main>

  <!-- Subspace Holographic Comms Interrogation Modal -->
  <div class="subspace-comms-backdrop" id="terminal-chat-backdrop" role="presentation" aria-hidden="true">
    <div class="subspace-comms-window" role="dialog" aria-modal="true" aria-labelledby="term-chat-name">
      <div class="subspace-header">
        <div class="subspace-header-title">
          <div class="audio-waveform-bars">
            <span class="audio-bar"></span>
            <span class="audio-bar"></span>
            <span class="audio-bar"></span>
            <span class="audio-bar"></span>
          </div>
          <span id="term-chat-name">SUBSPACE TRANSMISSION // OFFICER LINE</span>
        </div>
        <button type="button" class="subspace-close-btn" id="term-chat-close-btn" onclick="closeTerminalAgentChat()" aria-label="Close transmission">&times;</button>
      </div>
      <div class="subspace-body">
        <div class="subspace-governance-strip">
          <span>🔒</span>
          <span><strong>RULE B5 GOVERNANCE:</strong> Specialization voice only. Zero capital deployed ($0.00). Live execution gate locked.</span>
        </div>
        <div class="subspace-chat-stream" id="term-chat-stream" aria-live="polite">
          <!-- Live conversation stream -->
        </div>
        <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.1em; font-family:'Space Mono', monospace;">
          Tactical Command Shortcuts:
        </div>
        <div class="subspace-prompts-matrix" id="term-chat-prompts">
          <!-- Suggested query buttons -->
        </div>
        <form class="subspace-input-row" id="term-chat-form" onsubmit="event.preventDefault(); sendTerminalChatMessage();">
          <input type="text" class="subspace-input" id="term-chat-input" placeholder="Transmit query on track record, capital, findings.md..." autocomplete="off">
          <button type="submit" class="subspace-send-btn" id="term-chat-send-btn">TRANSMIT &rarr;</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Tactical Hotkeys / Flight Manual Modal -->
  <div class="hud-hotkeys-overlay" id="hotkeys-modal" role="presentation" aria-hidden="true">
    <div class="hotkeys-card" role="dialog" aria-modal="true">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,240,255,0.2); padding-bottom:12px;">
        <div style="font-family:'Space Mono', monospace; font-size:0.9rem; color:var(--cyan-core); font-weight:700;">
          ⌨️ CELESTIAL BRIDGE FLIGHT MANUAL & HOTKEYS
        </div>
        <button type="button" class="subspace-close-btn" onclick="toggleHotkeysHelp()">&times;</button>
      </div>
      <div class="hotkey-grid">
        <div class="hotkey-row">
          <span class="kbd-key">SPACE / R</span>
          <span class="hotkey-desc">Initiate Warp Coordination Cycle</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">M</span>
          <span class="hotkey-desc">Toggle Web Audio Sound Engine</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">C</span>
          <span class="hotkey-desc">Open Tesla Competitive Matrix</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">D</span>
          <span class="hotkey-desc">Launch Combat Readiness Drill</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">H / ?</span>
          <span class="hotkey-desc">Toggle Flight Manual Overlay</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">ESC</span>
          <span class="hotkey-desc">Close Active Comms or Modals</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">1</span>
          <span class="hotkey-desc">Hail Draco (Index Aggregation)</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">2</span>
          <span class="hotkey-desc">Hail Wolf (Volatility Surface)</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">3</span>
          <span class="hotkey-desc">Hail Falcon (Order Book Signal)</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">4</span>
          <span class="hotkey-desc">Hail Quantum Fox (Validation Gate)</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">5</span>
          <span class="hotkey-desc">Hail Sentinel (Systems Surveillance)</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">6</span>
          <span class="hotkey-desc">Hail Kraken (Risk Envelope)</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">7</span>
          <span class="hotkey-desc">Hail Lion (Consensus Synthesis)</span>
        </div>
        <div class="hotkey-row">
          <span class="kbd-key">8</span>
          <span class="hotkey-desc">Hail Phoenix (Execution Circuit)</span>
        </div>
      </div>
      <div style="font-size:0.68rem; color:var(--text-muted); font-family:'Space Mono', monospace; text-align:center;">
        Designed for institutional desk ergonomics. All keys trigger physical sound feedback and tactical state shifts.
      </div>
    </div>
  </div>

  <!-- The Alpha Citadel: Combat Readiness Drill Modal -->
  <div class="drill-overlay" id="combat-drill-modal" role="presentation" aria-hidden="true">
    <div class="drill-card" role="dialog" aria-modal="true">
      <div class="drill-header">
        <div class="drill-title">
          <span>⚔️</span>
          <span>THE ALPHA CITADEL // COMBAT READINESS DRILL</span>
        </div>
        <button type="button" class="subspace-close-btn" onclick="closeCombatDrill()">&times;</button>
      </div>

      <div class="drill-scoreboard">
        <div>SCORE: <strong id="drill-score" style="color:var(--gold-pulsar);">0 XP</strong></div>
        <div>CALIBRATION RATING: <strong id="drill-rank" style="color:var(--green-warp);">CADET ALLOCATOR</strong></div>
        <div>DRILLS COMPLETED: <strong id="drill-counter">0 / 3</strong></div>
      </div>

      <div class="drill-scenario-box">
        <div class="drill-scenario-title" id="drill-scenario-heading">SCENARIO 1: THE SUDDEN PRICE-SWING MOMENTUM TRAP</div>
        <div class="drill-scenario-body" id="drill-scenario-text">
          BTC swings +6.2¢ in 30 seconds on Kalshi. In-sample momentum win rate looks like 75.6%. Falcon is firing BUY YES. But out-of-sample walk-forward Brier is 0.1863 vs market 0.1838 (Held-out profit CI spans -$0.067 to +$0.147). What is your tactical order?
        </div>
        <div class="drill-options-list" id="drill-options-box">
          <!-- Dynamic options -->
        </div>
      </div>

      <div class="drill-result-box" id="drill-feedback-box">
        <!-- Results and explanation citing findings.md -->
      </div>
    </div>
  </div>

  <!-- The Tesla of Intelligence: Competitive Architecture & Benchmark Modal -->
  <div class="tesla-matrix-overlay" id="tesla-matrix-modal" role="presentation" aria-hidden="true">
    <div class="tesla-matrix-card" role="dialog" aria-modal="true">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(0,240,255,0.25); padding-bottom:14px;">
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:0.68rem; color:var(--gold-pulsar); letter-spacing:0.14em; text-transform:uppercase; margin-bottom:4px;">
            ⚡ ARCHITECTURAL PARADIGM SHIFT // THE TESLA OF INTEL
          </div>
          <div style="font-family:'Space Grotesk', sans-serif; font-size:1.25rem; font-weight:700; color:var(--text-primary);">
            Competitive Intelligence & Autonomous Benchmark
          </div>
        </div>
        <button type="button" class="subspace-close-btn" onclick="closeTeslaMatrix()">&times;</button>
      </div>

      <!-- Tab Switcher -->
      <div class="tesla-tabs-bar">
        <button type="button" class="tesla-tab-btn active" id="tesla-tab-btn-bench" onclick="switchTeslaTab('bench')">Head-to-Head Matrix</button>
        <button type="button" class="tesla-tab-btn" id="tesla-tab-btn-fsc" onclick="switchTeslaTab('fsc')">FSC Sensor Fusion</button>
        <button type="button" class="tesla-tab-btn" id="tesla-tab-btn-brake" onclick="switchTeslaTab('brake')">Autonomous Circuit-Breaker</button>
      </div>

      <!-- Pane 1: Head to Head Table -->
      <div id="tesla-pane-bench">
        <div style="font-size:0.75rem; color:var(--text-dim); margin-bottom:12px; font-family:'Space Mono', monospace;">
          Why QuanterraOS replaces $31,980/yr legacy terminals and naked retail prediction market order books:
        </div>
        <table class="tesla-matrix-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th style="color:var(--gold-pulsar);">QuanterraOS (Tesla of Intel)</th>
              <th>Bloomberg ($31,980/yr)</th>
              <th>Kalshi Native</th>
              <th>Polymarket</th>
              <th>Kaiko / Metrics</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Primary Architecture</strong></td>
              <td class="tesla-highlight-cell">Neural Council Multi-Agent Sensor Fusion</td>
              <td>1982 Monolithic Mainframe Menus</td>
              <td>Single-Exchange CLOB</td>
              <td>Web3 Polygon / UMA Oracle</td>
              <td>Raw JSON Data Feeds</td>
            </tr>
            <tr>
              <td><strong>Calibration Rigor</strong></td>
              <td class="tesla-highlight-cell">Murphy Brier Decomposition (10 Bins, Wilson CIs)</td>
              <td>None for short-duration contracts</td>
              <td>None (Last traded price only)</td>
              <td>None (Volatile token price)</td>
              <td>None (Raw unweighted L2 book)</td>
            </tr>
            <tr>
              <td><strong>Autonomous Risk Brake</strong></td>
              <td class="tesla-highlight-cell">Phoenix Gate (AEB: Locks execution when no edge)</td>
              <td>None (Manual order entry)</td>
              <td>None (Retail liquidity taker trap)</td>
              <td>None (Variable pool slippage)</td>
              <td>None (Data-only vendor)</td>
            </tr>
            <tr>
              <td><strong>Sensor Fusion</strong></td>
              <td class="tesla-highlight-cell">Draco Synthetic BRTI (<0.5% Outlier Rejection)</td>
              <td>Unconnected multi-window tabs</td>
              <td>Single Kalshi order-book</td>
              <td>Single Polymarket pool</td>
              <td>Raw tables without synthesis</td>
            </tr>
            <tr>
              <td><strong>Auditable Truth</strong></td>
              <td class="tesla-highlight-cell">100% Open CI/CD Statistical Provenance</td>
              <td>Proprietary black-box calculation</td>
              <td>Proprietary exchange logs</td>
              <td>On-chain token votes</td>
              <td>Enterprise private database</td>
            </tr>
            <tr>
              <td><strong>Ergonomics & Ergonomics</strong></td>
              <td class="tesla-highlight-cell">Tactile Web Audio, 3D Warp HUD, 360° Radar</td>
              <td>Keyboard codes (<GO>, DES, HP)</td>
              <td>Basic web candlestick chart</td>
              <td>Standard Web3 crypto interface</td>
              <td>Grafana / API code endpoints</td>
            </tr>
            <tr>
              <td><strong>Annual Cost</strong></td>
              <td class="tesla-highlight-cell">$0 Open Research / Pro Tier</td>
              <td>$31,980 / seat / year</td>
              <td>Taker fees up to 1.75¢ / trade</td>
              <td>Gas & pool fees</td>
              <td>$15,000–$50,000+ / yr</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pane 2: FSC Sensor Fusion -->
      <div id="tesla-pane-fsc" style="display:none;">
        <div style="font-size:0.8rem; color:var(--text-stellar); line-height:1.55; margin-bottom:14px;">
          Like Tesla’s Full Self-Driving vision network that converts 8 cameras into a 3D vector occupancy space, QuanterraOS’s <strong>Full Self-Calibration (FSC)</strong> converts multi-venue liquidity into an actionable, auditable single source of truth.
        </div>
        <div style="background:rgba(4,10,24,0.85); border:1px solid rgba(0,240,255,0.2); border-radius:var(--radius-sm); padding:16px; font-family:'Space Mono', monospace; font-size:0.72rem; line-height:1.7;">
          <div style="color:var(--cyan-core); font-weight:700; margin-bottom:8px;">[STAGE 1: MULTI-SPECTRAL SENSOR INGESTION]</div>
          <div>&bull; Coinbase Exchange Live Ticker (Fixed stale-endpoint bug via live ticker WS/REST)</div>
          <div>&bull; Kraken Live Spot & Orderbook Imbalance Feed</div>
          <div>&bull; Bitstamp & Gemini Spot Liquidity Anchors</div>
          <div>&bull; CME CF Bitcoin Real-Time Index (BRTI 60s Moving Benchmark)</div>
          <div style="color:var(--gold-pulsar); font-weight:700; margin:10px 0 6px;">[STAGE 2: 8-AGENT NEURAL COUNCIL FILTERING]</div>
          <div>&bull; <strong>Draco:</strong> Filters outliers (>0.5% deviation) and builds volume-weighted composite index</div>
          <div>&bull; <strong>Wolf:</strong> Real-time volatility surface (per-second realized σ)</div>
          <div>&bull; <strong>Falcon:</strong> Microstructure order-book depth imbalance calculation</div>
          <div>&bull; <strong>Quantum Fox:</strong> 5-fold walk-forward held-out Brier validation safety check</div>
          <div>&bull; <strong>Sentinel:</strong> Continuous platform surveillance & swing-event capture</div>
          <div>&bull; <strong>Kraken:</strong> Rule B5 live capital boundary enforcement ($0.00 live exposure)</div>
          <div>&bull; <strong>Lion:</strong> Consensus synthesis & Murphy calibration decomposition</div>
          <div>&bull; <strong>Phoenix:</strong> Autonomous execution circuit-breaker & gate actuator</div>
        </div>
      </div>

      <!-- Pane 3: Autonomous Risk Brake -->
      <div id="tesla-pane-brake" style="display:none;">
        <div style="font-size:0.8rem; color:var(--text-stellar); line-height:1.55; margin-bottom:14px;">
          In automotive safety, Tesla’s Automatic Emergency Braking (AEB) engages when human perception fails to avoid a crash. In institutional finance, QuanterraOS’s <strong>Phoenix Gate</strong> performs the identical role for capital preservation.
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <div style="background:rgba(255,51,102,0.08); border:1px solid rgba(255,51,102,0.3); border-radius:var(--radius-sm); padding:14px; font-family:'Space Mono', monospace; font-size:0.7rem; line-height:1.5;">
            <div style="color:var(--alert-crimson); font-weight:700; margin-bottom:6px;">✖ THE RETAIL TRAP (COMPETITION)</div>
            <p>On Kalshi & Polymarket, when BTC swings 6¢ in 30 seconds, retail traders rush to chase the momentum or fade it. In-sample backtests show 75.6% win rates, but traders get crushed by bid-ask spreads and taker fees (<code>0.07 * p * (1-p)</code>), losing money out-of-sample.</p>
          </div>
          <div style="background:rgba(0,255,136,0.08); border:1px solid rgba(0,255,136,0.3); border-radius:var(--radius-sm); padding:14px; font-family:'Space Mono', monospace; font-size:0.7rem; line-height:1.5;">
            <div style="color:var(--green-warp); font-weight:700; margin-bottom:6px;">✔ THE QUANTERRAOS AUTONOMOUS BRAKE</div>
            <p>QuanterraOS proves in <strong>findings.md §12</strong> that out-of-sample walk-forward Brier (0.1863) loses to the calibrated market mid-price (0.1838). Phoenix automatically locks the execution gate. Capital preserved: <strong>$0.00 lost</strong>.</p>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; border-top:1px solid rgba(0,240,255,0.15); padding-top:14px;">
        <button type="button" class="warp-cycle-btn" style="padding:6px 16px; font-size:0.72rem;" onclick="closeTeslaMatrix()">
          <span>Return to Flight Deck</span>
        </button>
      </div>
    </div>
  </div>

  <footer class="footer-subspace-bar">
    QUANTERRAOS CELESTIAL BRIDGE CONSOLE · AUDITABLE EMPIRICAL BENCHMARKS · RULE B5 LOCKED · ZERO LIVE CAPITAL DEPLOYED
  </footer>

<script>
let lastResult = null;
let selectedNodeId = null;
let lastFetchTimestamp = 0;
let sfxEnabled = true;
let audioCtx = null;
let warpSpeed = 1;
let targetWarpSpeed = 1;

// ============================================================================
// 1. TACTILE AUDIO SYNTHESIS ENGINE (Web Audio API)
// ============================================================================
function playUiSound(type) {
  if (!sfxEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const t = audioCtx.currentTime;

    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.03);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    } else if (type === 'comms') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(550, t);
      osc1.frequency.exponentialRampToValueAtTime(880, t + 0.06);
      osc2.frequency.setValueAtTime(880, t + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(1100, t + 0.12);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      osc1.start(t);
      osc2.start(t + 0.06);
      osc1.stop(t + 0.06);
      osc2.stop(t + 0.14);
    } else if (type === 'warp') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.35);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.7);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.75);
    } else if (type === 'radar') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (type === 'alert') {
      [0, 0.08, 0.16].forEach((delay) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t + delay);
        gain.gain.setValueAtTime(0.04, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.06);
      });
    } else if (type === 'success') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.05, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.18);
      });
    } else if (type === 'fail') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.3);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    }
  } catch (_e) {}
}

function toggleSfx() {
  sfxEnabled = !sfxEnabled;
  const el = document.getElementById('sfx-toggle');
  if (el) {
    el.innerHTML = sfxEnabled ? '<span>🔊</span><span>AUDIO: ON</span>' : '<span>🔇</span><span>AUDIO: MUTED</span>';
    el.style.borderColor = sfxEnabled ? 'var(--panel-border)' : 'var(--alert-crimson)';
  }
  showHudToast(sfxEnabled ? 'AUDIO ENGINE ARMED' : 'AUDIO MUTED');
  if (sfxEnabled) playUiSound('click');
}

// ============================================================================
// 2. 3D INTERACTIVE SPACE-WARP STARFIELD WITH PARALLAX
// ============================================================================
const starCanvas = document.getElementById('celestial-canvas');
const starCtx = starCanvas ? starCanvas.getContext('2d') : null;
let starfield = [];
const STAR_COUNT = 380;
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

function initStarfield() {
  if (!starCanvas) return;
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  starfield = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    starfield.push({
      x: (Math.random() - 0.5) * starCanvas.width * 2,
      y: (Math.random() - 0.5) * starCanvas.height * 2,
      z: Math.random() * starCanvas.width,
      pz: Math.random() * starCanvas.width,
      color: Math.random() > 0.8 ? '#00f0ff' : (Math.random() > 0.9 ? '#ffd700' : '#ffffff')
    });
  }
}

window.addEventListener('resize', initStarfield);
document.addEventListener('mousemove', (e) => {
  targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
  targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
});

function animateStarfield() {
  if (!starCtx || !starCanvas) return;
  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;
  warpSpeed += (targetWarpSpeed - warpSpeed) * 0.04;

  starCtx.fillStyle = 'rgba(2, 4, 9, 0.4)';
  starCtx.fillRect(0, 0, starCanvas.width, starCanvas.height);

  const cx = starCanvas.width / 2 + mouseX;
  const cy = starCanvas.height / 2 + mouseY;

  for (let i = 0; i < starfield.length; i++) {
    const s = starfield[i];
    s.pz = s.z;
    s.z -= 1.8 * warpSpeed;

    if (s.z <= 0) {
      s.z = starCanvas.width;
      s.pz = starCanvas.width;
      s.x = (Math.random() - 0.5) * starCanvas.width * 2;
      s.y = (Math.random() - 0.5) * starCanvas.height * 2;
    }

    const k = 250 / s.z;
    const px = s.x * k + cx;
    const py = s.y * k + cy;

    const pk = 250 / s.pz;
    const prevX = s.x * pk + cx;
    const prevY = s.y * pk + cy;

    if (px >= 0 && px <= starCanvas.width && py >= 0 && py <= starCanvas.height) {
      const alpha = Math.min(1, (1 - s.z / starCanvas.width) * 1.3);
      starCtx.strokeStyle = s.color;
      starCtx.globalAlpha = alpha;
      starCtx.lineWidth = Math.max(1, (1 - s.z / starCanvas.width) * (warpSpeed > 2 ? 3 : 1.5));
      starCtx.beginPath();
      starCtx.moveTo(prevX, prevY);
      starCtx.lineTo(px, py);
      starCtx.stroke();
    }
  }
  starCtx.globalAlpha = 1;
  requestAnimationFrame(animateStarfield);
}

initStarfield();
requestAnimationFrame(animateStarfield);

// ============================================================================
// 3. 360° TACTICAL RADAR SCOPE ENGINE
// ============================================================================
const radarCanvas = document.getElementById('tactical-radar-canvas');
const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;
let radarAngle = 0;
const radarBlips = [
  { id: 'draco', name: 'Draco', dist: 0.35, angle: 0.2, color: '#00f0ff' },
  { id: 'wolf', name: 'Wolf', dist: 0.50, angle: 0.9, color: '#00f0ff' },
  { id: 'falcon', name: 'Falcon', dist: 0.65, angle: 1.8, color: '#00f0ff' },
  { id: 'quantumFox', name: 'Q-Fox', dist: 0.80, angle: 2.7, color: '#ffaa00' },
  { id: 'sentinel', name: 'Sentinel', dist: 0.45, angle: 3.6, color: '#00ff88' },
  { id: 'kraken', name: 'Kraken', dist: 0.60, angle: 4.3, color: '#00ff88' },
  { id: 'lion', name: 'Lion', dist: 0.22, angle: 5.1, color: '#ffd700' },
  { id: 'phoenix', name: 'Phoenix', dist: 0.75, angle: 5.8, color: '#00ff88' }
];

function drawTacticalRadar() {
  if (!radarCtx || !radarCanvas) return;
  const w = radarCanvas.width;
  const h = radarCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(cx, cy) - 16;

  radarCtx.fillStyle = 'rgba(2, 6, 14, 0.25)';
  radarCtx.fillRect(0, 0, w, h);

  // Range rings
  [0.33, 0.66, 1.0].forEach((rMult, idx) => {
    radarCtx.strokeStyle = idx === 2 ? 'rgba(0, 240, 255, 0.35)' : 'rgba(0, 240, 255, 0.15)';
    radarCtx.lineWidth = 1;
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, maxR * rMult, 0, Math.PI * 2);
    radarCtx.stroke();
  });

  // Crosshairs
  radarCtx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
  radarCtx.beginPath();
  radarCtx.moveTo(cx - maxR, cy);
  radarCtx.lineTo(cx + maxR, cy);
  radarCtx.moveTo(cx, cy - maxR);
  radarCtx.lineTo(cx, cy + maxR);
  radarCtx.stroke();

  // Azimuth labels
  radarCtx.fillStyle = 'rgba(0, 240, 255, 0.4)';
  radarCtx.font = '8px "Space Mono", monospace';
  radarCtx.fillText('000°', cx - 10, cy - maxR + 10);
  radarCtx.fillText('090°', cx + maxR - 22, cy - 3);
  radarCtx.fillText('180°', cx - 10, cy + maxR - 4);
  radarCtx.fillText('270°', cx - maxR + 4, cy - 3);

  // Sweep ray
  radarAngle += 0.035;
  const sweepX = cx + Math.cos(radarAngle) * maxR;
  const sweepY = cy + Math.sin(radarAngle) * maxR;

  const grad = radarCtx.createRadialGradient(cx, cy, 2, cx, cy, maxR);
  grad.addColorStop(0, 'rgba(0, 255, 136, 0.5)');
  grad.addColorStop(1, 'rgba(0, 255, 136, 0.05)');

  radarCtx.save();
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.arc(cx, cy, maxR, radarAngle - 0.4, radarAngle);
  radarCtx.closePath();
  radarCtx.fillStyle = 'rgba(0, 255, 136, 0.15)';
  radarCtx.fill();
  radarCtx.restore();

  radarCtx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
  radarCtx.lineWidth = 1.5;
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.lineTo(sweepX, sweepY);
  radarCtx.stroke();

  // Render specialist blips
  radarBlips.forEach((b) => {
    const r = b.dist * maxR;
    const bx = cx + Math.cos(b.angle) * r;
    const by = cy + Math.sin(b.angle) * r;

    // Check sweep proximity for ping
    const diff = (radarAngle - b.angle) % (Math.PI * 2);
    const isPinged = diff > 0 && diff < 0.25;

    radarCtx.fillStyle = b.color;
    radarCtx.beginPath();
    radarCtx.arc(bx, by, isPinged ? 4.5 : 3, 0, Math.PI * 2);
    radarCtx.fill();

    if (isPinged) {
      radarCtx.strokeStyle = b.color;
      radarCtx.beginPath();
      radarCtx.arc(bx, by, 8, 0, Math.PI * 2);
      radarCtx.stroke();
    }

    radarCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    radarCtx.font = '8px "Space Mono", monospace';
    radarCtx.fillText(b.name, bx + 5, by + 3);
  });

  requestAnimationFrame(drawTacticalRadar);
}

if (radarCanvas) {
  drawTacticalRadar();
  radarCanvas.addEventListener('click', (e) => {
    const rect = radarCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = radarCanvas.width / 2;
    const cy = radarCanvas.height / 2;
    const maxR = Math.min(cx, cy) - 16;

    radarBlips.forEach(b => {
      const bx = cx + Math.cos(b.angle) * (b.dist * maxR);
      const by = cy + Math.sin(b.angle) * (b.dist * maxR);
      const d = Math.hypot(x - bx, y - by);
      if (d < 16) {
        playUiSound('radar');
        showHudToast('HAILING ' + b.name.toUpperCase() + ' VIA RADAR');
        openTerminalAgentChat(b.id);
      }
    });
  });
}

// ============================================================================
// 4. THE ALPHA CITADEL: COMBAT READINESS DRILL MINIGAME
// ============================================================================
let drillXP = 0;
let drillIndex = 0;

const DRILL_SCENARIOS = [
  {
    title: "SCENARIO 1: SUDDEN PRICE-SWING MOMENTUM TRAP (§12)",
    text: "BTC 15-minute contract suddenly swings +6.2¢ in 30 seconds. Historical in-sample data shows a 75.6% win rate chasing the swing. Falcon fires BUY YES at 82.5¢. However, walk-forward out-of-sample testing yields Brier 0.1863 vs market 0.1838, and net held-out profit CI spans -$0.067 to +$0.147. What is your command?",
    options: [
      { text: "A) Follow the Momentum: Buy YES immediately to catch continuation", correct: false, note: "FAILED: In-sample win-rate illusion. Out-of-sample walk-forward Brier loses to market, and profit CI spans zero after Kalshi taker fees per findings.md §12." },
      { text: "B) Fade the Swing: Buy NO anticipating sharp mean-reversion", correct: false, note: "FAILED: Fading the swing loses on 0 of 5 walk-forward folds with average loss of over 15¢ per contract. The market absorbs information rapidly." },
      { text: "C) Stand Down & Gate Locked: Honor calibrated mid-price baseline", correct: true, note: "VICTORY (+100 XP): Calibrated sovereign discipline. Neither chasing nor fading beats the calibrated market price. Zero capital exposed." }
    ]
  },
  {
    title: "SCENARIO 2: THE MINUTE-13 DRIFT MIRAGE (§1)",
    text: "At minute 13 of a 15-minute contract, Draco composite index indicates a +$85 upward drift. Direction accuracy historically measures 62.4%. Phoenix execution gate is waiting for your manual override. Do you execute?",
    options: [
      { text: "A) Force Order Execution: 62.4% direction accuracy guarantees profit", correct: false, note: "FAILED: Direction accuracy alone is insufficient. By minute 13, executable market spreads and Kalshi fees swallow all apparent edge. BSS is non-positive." },
      { text: "B) Reject Execution: Stand by per single-source findings.md", correct: true, note: "VICTORY (+100 XP): Realized execution pricing incorporates drift. Standing by preserves capital from negative EV." }
    ]
  },
  {
    title: "SCENARIO 3: QUANTUM FOX HELD-OUT BRIER VALIDATION (§11)",
    text: "An analyst proposes an order-book imbalance rule with a backtested Sharpe of 2.1. Quantum Fox runs 5-fold walk-forward validation and reports Brier Difference CI [+0.0041, +0.0139] and net held-out EV -2.15¢. How do you instruct Lion?",
    options: [
      { text: "A) Ratify NOMINAL_CALIBRATED_STANDBY: Signal fails out-of-sample", correct: true, note: "VICTORY (+100 XP): Lion consensus rule requires model to beat market Brier on all folds. Model fails; standby ratified." },
      { text: "B) Authorize Live Trial: Overrule Quantum Fox based on Sharpe ratio", correct: false, note: "FAILED: In-sample Sharpe ratio without walk-forward calibration is how hedge funds blow up. Rule B5 forbids unvalidated live capital." }
    ]
  }
];

function openCombatDrill() {
  playUiSound('comms');
  const modal = document.getElementById('combat-drill-modal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    renderDrillScenario();
  }
}

function closeCombatDrill() {
  playUiSound('click');
  const modal = document.getElementById('combat-drill-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function renderDrillScenario() {
  const sc = DRILL_SCENARIOS[drillIndex % DRILL_SCENARIOS.length];
  const headEl = document.getElementById('drill-scenario-heading');
  const bodyEl = document.getElementById('drill-scenario-text');
  const optBox = document.getElementById('drill-options-box');
  const fbBox = document.getElementById('drill-feedback-box');
  if (fbBox) fbBox.style.display = 'none';

  if (headEl) headEl.textContent = sc.title;
  if (bodyEl) bodyEl.textContent = sc.text;

  if (optBox) {
    optBox.innerHTML = sc.options.map((opt, idx) => \`
      <button type="button" class="drill-choice-btn" onclick="submitDrillChoice(\${idx})">
        <span>\${escapeTerminalText(opt.text)}</span>
        <span style="font-family:'Space Mono', monospace; font-size:0.7rem; color:var(--cyan-core);">&rarr;</span>
      </button>
    \`).join('');
  }
}

function submitDrillChoice(optIdx) {
  const sc = DRILL_SCENARIOS[drillIndex % DRILL_SCENARIOS.length];
  const opt = sc.options[optIdx];
  const fbBox = document.getElementById('drill-feedback-box');
  if (!fbBox || !opt) return;

  if (opt.correct) {
    playUiSound('success');
    drillXP += 100;
    fbBox.className = 'drill-result-box pass';
    fbBox.innerHTML = '<strong>' + escapeTerminalText(opt.note) + '</strong><div style="margin-top:8px;"><button class="warp-cycle-btn" style="padding:4px 12px; font-size:0.7rem;" onclick="advanceDrill()">Next Tactical Scenario &rarr;</button></div>';
  } else {
    playUiSound('fail');
    drillXP = Math.max(0, drillXP - 30);
    fbBox.className = 'drill-result-box fail';
    fbBox.innerHTML = '<strong>' + escapeTerminalText(opt.note) + '</strong><div style="margin-top:8px;"><button class="tactical-prompt-btn" onclick="renderDrillScenario()">Retry Scenario &rarr;</button></div>';
  }
  updateDrillScoreboard();
}

function advanceDrill() {
  drillIndex++;
  renderDrillScenario();
  updateDrillScoreboard();
}

function updateDrillScoreboard() {
  const scoreEl = document.getElementById('drill-score');
  const rankEl = document.getElementById('drill-rank');
  const countEl = document.getElementById('drill-counter');

  if (scoreEl) scoreEl.textContent = drillXP + ' XP';
  if (countEl) countEl.textContent = drillIndex + ' / ' + DRILL_SCENARIOS.length;

  if (rankEl) {
    if (drillXP >= 300) rankEl.textContent = 'SOVEREIGN RISK MARSHAL';
    else if (drillXP >= 200) rankEl.textContent = 'CALIBRATED ALPHA COMMANDER';
    else if (drillXP >= 100) rankEl.textContent = 'TACTICAL QUANT STRATEGIST';
    else rankEl.textContent = 'CADET ALLOCATOR';
  }
}

// ============================================================================
// 5. THE TESLA OF INTELLIGENCE: COMPETITIVE MATRIX CONTROLLER
// ============================================================================
function openTeslaMatrix() {
  playUiSound('comms');
  showHudToast('ENGAGING TESLA COMPETITIVE ARCHITECTURE MATRIX');
  const modal = document.getElementById('tesla-matrix-modal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeTeslaMatrix() {
  playUiSound('click');
  const modal = document.getElementById('tesla-matrix-modal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function switchTeslaTab(tabId) {
  playUiSound('click');
  ['bench', 'fsc', 'brake'].forEach(t => {
    const btn = document.getElementById('tesla-tab-btn-' + t);
    const pane = document.getElementById('tesla-pane-' + t);
    if (btn) btn.classList.toggle('active', t === tabId);
    if (pane) pane.style.display = t === tabId ? 'block' : 'none';
  });
}

// ============================================================================
// 6. TACTICAL FLIGHT CONTROLS & KEYBOARD HOTKEYS
// ============================================================================
function toggleHotkeysHelp() {
  playUiSound('click');
  const modal = document.getElementById('hotkeys-modal');
  if (modal) {
    const isOpen = modal.classList.contains('open');
    if (isOpen) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    } else {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }
}

function showHudToast(text) {
  const wrap = document.getElementById('hud-toast-container');
  if (!wrap) return;
  const toast = document.createElement('div');
  toast.className = 'hud-toast';
  toast.innerHTML = '⚡ ' + escapeTerminalText(text);
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

document.addEventListener('keydown', (e) => {
  // If user is typing in chat input or an input field, do not trigger single-key hotkeys
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (activeTag === 'input' || activeTag === 'textarea') {
    if (e.key === 'Escape') closeTerminalAgentChat();
    return;
  }

  if (e.key === 'Escape') {
    closeTerminalAgentChat();
    closeCombatDrill();
    closeTeslaMatrix();
    const hk = document.getElementById('hotkeys-modal');
    if (hk) hk.classList.remove('open');
    playUiSound('click');
  } else if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    showHudToast('KEYBOARD ENGAGED: INITIATING COORDINATION CYCLE');
    triggerCycle();
  } else if (e.key === 'm' || e.key === 'M') {
    toggleSfx();
  } else if (e.key === 'c' || e.key === 'C') {
    openTeslaMatrix();
  } else if (e.key === 'h' || e.key === 'H' || e.key === '?') {
    toggleHotkeysHelp();
  } else if (e.key === 'd' || e.key === 'D') {
    openCombatDrill();
  } else if (e.key >= '1' && e.key <= '8') {
    const agentMap = {
      '1': 'draco', '2': 'wolf', '3': 'falcon', '4': 'quantumFox',
      '5': 'sentinel', '6': 'kraken', '7': 'lion', '8': 'phoenix'
    };
    const aid = agentMap[e.key];
    if (aid) {
      showHudToast('HAILING SPECIALIST ' + e.key + ' // ' + aid.toUpperCase());
      openTerminalAgentChat(aid);
    }
  }
});

// ============================================================================
// 7. PIPELINE TELEMETRY CONTROLLER & DATA BINDINGS
// ============================================================================
function updateClock() {
  const el = document.getElementById('utc-clock');
  if (el) {
    const d = new Date();
    el.textContent = d.toISOString().substring(11, 19) + ' UTC';
  }
}
setInterval(updateClock, 1000);
updateClock();

function renderCouncilStatus(agents) {
  const container = document.getElementById('officer-matrix-list');
  if (!agents || !container) return;

  const agentOrder = ['draco', 'wolf', 'falcon', 'quantumFox', 'sentinel', 'kraken', 'lion', 'phoenix'];

  const html = agentOrder.map((key, idx) => {
    const a = agents[key];
    if (!a) return '';

    return \`
      <div class="officer-matrix-card" onclick="playUiSound('click'); openTerminalAgentChat('\${a.id}')" title="Click to hail \${a.name} or press [\${idx + 1}]">
        <div class="officer-left">
          <span style="font-family:'Space Mono', monospace; font-size:0.68rem; color:var(--text-muted);">[\${idx + 1}]</span>
          <span class="officer-radar-dot \${a.dotColor}"></span>
          <div class="officer-identity">
            <span class="officer-name">\${a.name}</span>
            <span class="officer-role">\${a.role}</span>
          </div>
        </div>
        <div class="officer-status-telemetry">
          <div class="officer-status-label">\${a.statusLabel}</div>
          <div class="officer-status-time">\${a.latencyMs}ms</div>
        </div>
      </div>
    \`;
  }).join('');

  container.innerHTML = html;
}

function renderPipelineNodes(agents) {
  const container = document.getElementById('pipeline-nodes-grid');
  if (!agents || !container) return;

  const agentOrder = ['draco', 'wolf', 'falcon', 'quantumFox', 'sentinel', 'kraken', 'lion', 'phoenix'];

  const html = agentOrder.map((key, idx) => {
    const a = agents[key];
    if (!a) return '';
    const isSelected = selectedNodeId === a.id;

    return \`
      <div class="tactical-node-card \${isSelected ? 'active-tactical' : ''}" onclick="playUiSound('click'); selectNode('\${a.id}')">
        <div class="node-top-bar">
          <span class="node-step-tag">NODE 0\${idx + 1}</span>
          <span class="officer-radar-dot \${a.dotColor}" style="width:7px;height:7px;"></span>
        </div>
        <div class="node-name-text">\${a.name}</div>
        <div class="node-role-text">\${a.role}</div>
        <div class="node-telemetry-badge">\${a.statusLabel}</div>
      </div>
    \`;
  }).join('');

  container.innerHTML = html;

  if (selectedNodeId && agents[selectedNodeId]) {
    renderNodeDetail(agents[selectedNodeId]);
  }
}

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
        <div class="subsystem-row">
          <span class="subsystem-key">\${k}</span>
          <span class="subsystem-val">\${typeof v === 'object' ? JSON.stringify(v) : v}</span>
        </div>
      \`).join('');
  }

  box.innerHTML = \`
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid rgba(0,240,255,0.2); padding-bottom:6px;">
      <strong style="color:var(--cyan-core); letter-spacing:0.1em;">[\${agent.name.toUpperCase()}] TACTICAL ORBITAL TELEMETRY</strong>
      <span style="color:var(--text-muted); cursor:pointer;" onclick="document.getElementById('node-detail-box').classList.remove('show');">[close ×]</span>
    </div>
    <div class="subsystem-row">
      <span class="subsystem-key">Subspace Input</span>
      <span class="subsystem-val">\${agent.inputDescription}</span>
    </div>
    <div class="subsystem-row">
      <span class="subsystem-key">Subspace Output</span>
      <span class="subsystem-val">\${agent.outputDescription}</span>
    </div>
    <div class="subsystem-row">
      <span class="subsystem-key">Operational Summary</span>
      <span class="subsystem-val" style="color:var(--gold-pulsar);">\${agent.summary}</span>
    </div>
    <div class="subsystem-row">
      <span class="subsystem-key">Processing Latency</span>
      <span class="subsystem-val">\${agent.latencyMs} ms</span>
    </div>
    \${teleRows}
    <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(0,240,255,0.15); display:flex; justify-content:flex-end;">
      <button type="button" class="warp-cycle-btn" style="padding:6px 14px; font-size:0.72rem;" onclick="playUiSound('comms'); openTerminalAgentChat('\${agent.id}')">
        💬 Open Subspace Comms Channel (\${agent.name}) &rarr;
      </button>
    </div>
  \`;
}

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
      <div class="stream-log-row">
        <span class="log-chronos">[\${timeStr}]</span>
        <span class="log-agent-glyph">\${a.name.toUpperCase()}:</span>
        <span class="log-payload">\${a.summary}</span>
      </div>
    \`;
  }).join('');

  box.innerHTML = lines;
  box.scrollTop = box.scrollHeight;
}

function applyPipelineData(data) {
  lastResult = data;
  lastFetchTimestamp = Date.now();

  const cycleEl = document.getElementById('cycle-badge');
  if (cycleEl) cycleEl.textContent = 'CYCLE #' + data.cycleNumber;
  const latEl = document.getElementById('stat-latency');
  if (latEl) latEl.textContent = data.durationMs + ' ms';

  const verdictEl = document.getElementById('verdict-text');
  if (verdictEl) verdictEl.textContent = data.lionVerdict;

  if (data.agents && data.agents.sentinel && data.agents.sentinel.telemetry) {
    const swTotal = data.agents.sentinel.telemetry.swingEventsLogged;
    const swSettled = data.agents.sentinel.telemetry.swingEventsSettled;
    if (swTotal !== undefined) {
      const swEl = document.getElementById('stat-swings');
      if (swEl) swEl.textContent = swTotal + ' (' + swSettled + ' settled)';
    }
  }

  renderCouncilStatus(data.agents);
  renderPipelineNodes(data.agents);
  renderMarketPulse(data.marketQuote);
  appendLogStream(data);
}

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

async function triggerCycle() {
  playUiSound('warp');
  targetWarpSpeed = 16;
  setTimeout(() => { targetWarpSpeed = 1; }, 1400);

  const btn = document.getElementById('run-cycle-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'WARP HARNESS RUNNING…';
  }
  try {
    const res = await fetch('/api/council/pipeline/run', { method: 'POST' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    applyPipelineData(data);
    showHudToast('COORDINATION CYCLE #' + data.cycleNumber + ' COMPLETED (' + data.durationMs + 'MS)');
  } catch (err) {
    console.error('Failed to run cycle:', err);
    showHudToast('CYCLE EXECUTION FAILED');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>⚡</span><span>INITIATE COORDINATION CYCLE NOW [SPACE]</span>';
    }
  }
}

document.getElementById('run-cycle-btn').addEventListener('click', triggerCycle);

fetchLatestPipeline();
setInterval(fetchLatestPipeline, 15000);

// ============================================================================
// 8. SUBSPACE COMMS EXECUTIVE CHAT CONTROLLER
// ============================================================================
let currentTerminalChatAgentId = null;

async function openTerminalAgentChat(agentId) {
  playUiSound('comms');
  currentTerminalChatAgentId = agentId;
  const backdrop = document.getElementById('terminal-chat-backdrop');
  const titleEl = document.getElementById('term-chat-name');
  const streamEl = document.getElementById('term-chat-stream');
  const promptsEl = document.getElementById('term-chat-prompts');
  const inputEl = document.getElementById('term-chat-input');
  if (!backdrop) return;

  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  if (streamEl) streamEl.innerHTML = '<div style="font-size:0.74rem; color:var(--cyan-core); text-align:center; font-family:\\'Space Mono\\', monospace;">Establishing encrypted subspace channel…</div>';
  if (promptsEl) promptsEl.innerHTML = '';

  try {
    const res = await fetch('/api/executives/' + agentId + '/persona');
    if (!res.ok) throw new Error('Persona not found');
    const p = await res.json();
    if (titleEl) titleEl.textContent = p.name.toUpperCase() + ' // ' + p.role.toUpperCase();

    if (streamEl) {
      streamEl.innerHTML = 
        '<div class="subspace-msg agent">' +
          '<div class="subspace-msg-header">' +
            '<span>' + escapeTerminalText(p.name) + ' [' + escapeTerminalText(p.role) + ']</span>' +
            '<span>' + new Date().toLocaleTimeString() + '</span>' +
          '</div>' +
          '<div>' + escapeTerminalText(p.initialGreeting) + '</div>' +
        '</div>';
    }

    if (promptsEl && Array.isArray(p.suggestedQuestions)) {
      promptsEl.innerHTML = p.suggestedQuestions.map(function(q) {
        var safeQ = q.replace(/'/g, "\\'");
        return '<button type="button" class="tactical-prompt-btn" onclick="playUiSound(\\'click\\'); sendTerminalChatMessage(\'' + safeQ + '\')">' + escapeTerminalText(q) + '</button>';
      }).join('');
    }

    if (inputEl) {
      setTimeout(() => inputEl.focus(), 60);
    }
  } catch (err) {
    if (streamEl) streamEl.innerHTML = '<div style="color:var(--alert-crimson); font-size:0.72rem; font-family:\\'Space Mono\\', monospace;">Subspace link interrupted.</div>';
  }
}

function closeTerminalAgentChat() {
  playUiSound('click');
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

  playUiSound('click');
  if (inputEl) inputEl.value = '';
  if (sendBtn) sendBtn.disabled = true;

  const userDiv = document.createElement('div');
  userDiv.className = 'subspace-msg user';
  userDiv.innerHTML = 
    '<div class="subspace-msg-header" style="justify-content:flex-end;">' +
      '<span>COMMAND DECK OPERATOR · ' + new Date().toLocaleTimeString() + '</span>' +
    '</div>' +
    '<div>' + escapeTerminalText(text) + '</div>';
  streamEl.appendChild(userDiv);

  const waitDiv = document.createElement('div');
  waitDiv.className = 'subspace-msg agent';
  waitDiv.id = 'term-typing-indicator';
  waitDiv.innerHTML = '<span style="color:var(--cyan-core); font-family:\\'Space Mono\\', monospace;">Processing tactical query against verified telemetry records…</span>';
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

    playUiSound('comms');
    const agentDiv = document.createElement('div');
    agentDiv.className = 'subspace-msg agent';
    let citationsHtml = '';
    if (Array.isArray(data.citations) && data.citations.length > 0) {
      citationsHtml = '<div class="citation-crystal-tags">' +
        data.citations.map(c => '<span class="crystal-pill">' + escapeTerminalText(c) + '</span>').join('') +
        '</div>';
    }
    const guardedBadge = data.guarded ? '<span style="color:var(--green-warp); border:1px solid var(--green-warp); padding:1px 5px; border-radius:3px; font-size:0.6rem;">AUDITED TRUTH</span>' : '';

    agentDiv.innerHTML = 
      '<div class="subspace-msg-header">' +
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
    errDiv.className = 'subspace-msg agent';
    errDiv.innerHTML = '<span style="color:var(--alert-crimson); font-family:\\'Space Mono\\', monospace;">Subspace carrier signal lost. Please retry.</span>';
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
</script>
</body>
</html>`;
}
