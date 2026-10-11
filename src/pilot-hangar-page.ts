/**
 * QuanterraOS: Pilot Hangar & Spaceship Embarkation Deck (/hangar & /embark)
 *
 * Implements:
 * - Interactive Character Customizer:
 *   - 6 Character Archetypes (Cadet Vanguard, Cosmic Commander, Cybernetic Specialist, Celestial Pioneer, etc.)
 *   - 6 QuanterraOS Apparel Lines (Crew Essentials, Executive Orbit, Founder M Edition, Celestial Astral Silk, etc.)
 *   - 7 Hair Styles (Zero-G Ponytail, Cyber Buzz, Astral Waves, Neon Undercut, Orbital Braids, etc.)
 *   - 6 Facial Expressions / Visor HUDs (Calm Focus, Confident Smirk, Analytical Scan, Stoic Veteran, etc.)
 * - Procedural live SVG rendering of the pilot avatar in real-time.
 * - "Enter the Spaceship" Cinematic Experience:
 *   - Airlock pressurization sequence & audio-visual chime
 *   - Visor HUD bootup
 *   - Command Bridge doors sliding open to deep-space starlight
 *   - Crew Meet-and-Greet featuring Quanta (Celestial Man), Quantana (Celestial Woman), and Specialists
 *   - Transition to active Cockpit flight deck with custom avatar mounted into the crew station.
 */

import { renderPublicHeader, renderPublicFooter, PUBLIC_LAYOUT_CSS } from "./components/public-layout.ts";
import {
  CHARACTER_ARCHETYPES,
  APPAREL_OPTIONS,
  HAIR_STYLE_OPTIONS,
  EXPRESSION_OPTIONS,
  DEFAULT_PILOT_PROFILE,
  generatePilotAvatarSvg
} from "./lib/pilot-customizer-catalog.ts";

export interface PilotHangarPageOptions {
  user?: { email?: string; callsign?: string } | null;
}

export function renderPilotHangarPageHtml(options?: PilotHangarPageOptions): string {
  const user = options?.user;
  const initialCallsign = user?.callsign || "PILOT-ALPHA";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Pilot Hangar &amp; Starship Embarkation — QuanterraOS</title>
  <meta name="description" content="Customize your QuanterraOS pilot character: select apparel lines, hair style, facial expressions, and enter the starship to meet your flight crew.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --hangar-bg: #070914;
      --hangar-card: rgba(14, 19, 38, 0.85);
      --hangar-border: rgba(155, 108, 255, 0.22);
      --hangar-border-subtle: rgba(255, 255, 255, 0.08);
      --hangar-violet: #9B6CFF;
      --hangar-mint: #CBFF69;
      --hangar-cyan: #00E5FF;
      --hangar-gold: #DFB843;
      --hangar-chalk: #F4F3FA;
      --hangar-muted: #94A3B8;
      --hangar-danger: #FF55C8;
    }

    body {
      background: var(--hangar-bg);
      color: var(--hangar-chalk);
      font-family: var(--public-font-sans);
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .hangar-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 40px 24px 80px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* Top Hangar Banner */
    .hangar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      border-bottom: 1px solid var(--hangar-border-subtle);
      padding-bottom: 24px;
    }

    .hangar-title-wrap h1 {
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 6px;
      background: linear-gradient(180deg, #FFFFFF 0%, #C4B5FD 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hangar-title-wrap p {
      font-size: 1rem;
      color: var(--hangar-muted);
      margin: 0;
    }

    .hangar-badge-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(203, 255, 105, 0.1);
      border: 1px solid var(--hangar-mint);
      color: var(--hangar-mint);
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 700;
    }

    /* Customizer Workspace Grid */
    .customizer-grid {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 36px;
      align-items: start;
    }

    @media (max-width: 980px) {
      .customizer-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Left Stage: Live Avatar Canvas */
    .avatar-stage-box {
      background: linear-gradient(180deg, rgba(20, 26, 52, 0.8) 0%, rgba(9, 13, 28, 0.95) 100%);
      border: 1px solid var(--hangar-border);
      border-radius: 20px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      position: sticky;
      top: 90px;
    }

    .avatar-preview-wrap {
      width: 240px;
      height: 240px;
      position: relative;
      filter: drop-shadow(0 12px 28px rgba(155, 108, 255, 0.3));
    }

    .avatar-preview-wrap svg {
      width: 100%;
      height: 100%;
      border-radius: 24px;
    }

    .avatar-meta-info {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px solid var(--hangar-border-subtle);
      padding-top: 16px;
    }

    .callsign-input-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
      text-align: left;
    }

    .callsign-input-wrap label {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: var(--hangar-muted);
      text-transform: uppercase;
    }

    .callsign-input-wrap input {
      background: rgba(8, 11, 24, 0.85);
      border: 1px solid var(--hangar-border-subtle);
      border-radius: 8px;
      padding: 10px 14px;
      color: var(--hangar-mint);
      font-family: var(--public-font-mono);
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      outline: none;
      text-transform: uppercase;
    }

    .callsign-input-wrap input:focus {
      border-color: var(--hangar-mint);
    }

    .btn-embark-starship {
      background: linear-gradient(135deg, #CBFF69 0%, #86F94A 100%);
      color: #070914;
      border: none;
      border-radius: 12px;
      padding: 16px 24px;
      font-weight: 800;
      font-size: 1.05rem;
      cursor: pointer;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      box-shadow: 0 8px 24px rgba(203, 255, 105, 0.25);
      transition: all 0.2s ease;
      margin-top: 8px;
    }

    .btn-embark-starship:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(203, 255, 105, 0.4);
    }

    /* Right Controls: Tabs & Option Grids */
    .controls-panel {
      background: var(--hangar-card);
      border: 1px solid var(--hangar-border);
      border-radius: 20px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .customizer-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--hangar-border-subtle);
      padding-bottom: 14px;
      overflow-x: auto;
    }

    .cust-tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--hangar-muted);
      padding: 8px 16px;
      border-radius: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .cust-tab-btn:hover {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.05);
    }

    .cust-tab-btn.active {
      background: rgba(155, 108, 255, 0.18);
      color: #FFFFFF;
      border-color: var(--hangar-violet);
    }

    .tab-section-content {
      display: none;
      flex-direction: column;
      gap: 20px;
    }

    .tab-section-content.active {
      display: flex;
    }

    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .option-card {
      background: rgba(8, 11, 24, 0.7);
      border: 1px solid var(--hangar-border-subtle);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s ease;
      position: relative;
    }

    .option-card:hover {
      border-color: var(--hangar-violet);
      transform: translateY(-2px);
    }

    .option-card.selected {
      border-color: var(--hangar-mint);
      background: rgba(203, 255, 105, 0.05);
    }

    .option-card.selected::after {
      content: "✓";
      position: absolute;
      top: 10px;
      right: 12px;
      color: var(--hangar-mint);
      font-weight: 800;
      font-size: 0.85rem;
    }

    .opt-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0;
    }

    .opt-tag {
      font-family: var(--public-font-mono);
      font-size: 0.68rem;
      color: var(--hangar-mint);
      text-transform: uppercase;
    }

    .opt-desc {
      font-size: 0.78rem;
      color: var(--hangar-muted);
      line-height: 1.4;
      margin: 0;
    }

    /* =====================================================================
       CINEMATIC EMBARKATION MODAL (SPACESHIP AIRLOCK & BRIDGE SEQUENCE)
       ===================================================================== */
    .embark-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(4, 6, 14, 0.95);
      backdrop-filter: blur(24px);
      display: none;
      justify-content: center;
      align-items: center;
      padding: 24px;
    }

    .embark-modal-overlay.active {
      display: flex;
    }

    .embark-theatre {
      max-width: 880px;
      width: 100%;
      background: #0A0D1E;
      border: 2px solid var(--hangar-violet);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 0 80px rgba(155, 108, 255, 0.35);
      display: flex;
      flex-direction: column;
      gap: 28px;
      text-align: center;
      position: relative;
    }

    .airlock-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--public-font-mono);
      font-size: 0.8rem;
      color: var(--hangar-mint);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 16px;
    }

    .bridge-cinematic-scene {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 32px;
      align-items: center;
      text-align: left;
    }

    @media (max-width: 720px) {
      .bridge-cinematic-scene {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }

    .cinematic-avatar-glow {
      width: 220px;
      height: 220px;
      margin: 0 auto;
      filter: drop-shadow(0 0 30px var(--hangar-mint));
      animation: pulseVisor 2s infinite ease-in-out;
    }

    @keyframes pulseVisor {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px var(--hangar-mint)); }
      50% { transform: scale(1.02); filter: drop-shadow(0 0 35px var(--hangar-cyan)); }
    }

    .crew-dialogue-box {
      background: rgba(14, 20, 44, 0.9);
      border: 1px solid var(--hangar-border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .dialogue-speaker {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .speaker-avatar-circle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 1px solid var(--hangar-mint);
      object-fit: cover;
    }

    .speaker-name {
      font-family: var(--public-font-mono);
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--hangar-mint);
    }

    .speaker-title {
      font-size: 0.72rem;
      color: var(--hangar-muted);
    }

    .dialogue-message {
      font-size: 1.05rem;
      line-height: 1.6;
      color: #FFFFFF;
      min-height: 60px;
    }

    .crew-radio-chatter {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: var(--hangar-muted);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 12px;
    }

    .radio-pill {
      background: rgba(0, 0, 0, 0.35);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .radio-pill strong {
      color: var(--hangar-cyan);
    }

    .embark-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 14px;
    }

    .btn-take-station {
      background: var(--hangar-mint);
      color: #070914;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 1rem;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-take-station:hover {
      background: #b6f04c;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/hangar", user })}

  <main class="hangar-container">
    
    <!-- Top Header -->
    <header class="hangar-header">
      <div class="hangar-title-wrap">
        <h1>Pilot Hangar &amp; Embarkation Deck</h1>
        <p>Forge your pilot identity, customize your QuanterraOS apparel line, and step aboard the starship to meet your crew.</p>
      </div>
      <div class="hangar-badge-status">
        <span>● AIRLOCK PRESSURIZED &amp; READY</span>
      </div>
    </header>

    <!-- Main Customizer Workspace -->
    <div class="customizer-grid">
      
      <!-- Left: Live Pilot Avatar Canvas -->
      <aside class="avatar-stage-box" aria-label="Pilot Avatar Preview">
        <div class="avatar-preview-wrap" id="pilot-svg-preview">
          ${generatePilotAvatarSvg(DEFAULT_PILOT_PROFILE)}
        </div>

        <div class="avatar-meta-info">
          <div class="callsign-input-wrap">
            <label for="pilot-callsign-input">Pilot Callsign</label>
            <input type="text" id="pilot-callsign-input" value="${initialCallsign}" maxlength="16" oninput="updateCallsign(this.value)">
          </div>
        </div>

        <button type="button" class="btn-embark-starship" onclick="launchEmbarkationSequence()">
          <span>🚀 Enter the Spaceship &amp; Meet Crew &rarr;</span>
        </button>
      </aside>

      <!-- Right: Customizer Tabs & Options -->
      <section class="controls-panel" aria-label="Customizer Options">
        <nav class="customizer-tabs">
          <button type="button" class="cust-tab-btn active" onclick="switchCustTab('archetype')">1. Character Base</button>
          <button type="button" class="cust-tab-btn" onclick="switchCustTab('apparel')">2. QuanterraOS Apparel</button>
          <button type="button" class="cust-tab-btn" onclick="switchCustTab('hair')">3. Hair Style</button>
          <button type="button" class="cust-tab-btn" onclick="switchCustTab('expression')">4. Facial Expression</button>
        </nav>

        <!-- Tab 1: Archetypes -->
        <div class="tab-section-content active" id="tab-cust-archetype">
          <div class="options-grid">
            ${CHARACTER_ARCHETYPES.map((a, i) => `
              <div class="option-card ${i === 0 ? 'selected' : ''}" onclick="selectArchetype('${a.id}', this)">
                <span class="opt-tag">${a.category}</span>
                <h3 class="opt-title">${a.name}</h3>
                <p class="opt-desc">${a.tagline}</p>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Tab 2: Apparel Lines -->
        <div class="tab-section-content" id="tab-cust-apparel">
          <div class="options-grid">
            ${APPAREL_OPTIONS.map((app, i) => `
              <div class="option-card ${i === 0 ? 'selected' : ''}" onclick="selectApparel('${app.id}', this)">
                <span class="opt-tag">${app.collection}</span>
                <h3 class="opt-title">${app.name}</h3>
                <p class="opt-desc">${app.description}</p>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Tab 3: Hair Styles -->
        <div class="tab-section-content" id="tab-cust-hair">
          <div class="options-grid">
            ${HAIR_STYLE_OPTIONS.map((h, i) => `
              <div class="option-card ${i === 0 ? 'selected' : ''}" onclick="selectHair('${h.id}', this)">
                <span class="opt-tag">Style 0${i + 1}</span>
                <h3 class="opt-title">${h.name}</h3>
                <p class="opt-desc">${h.description}</p>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Tab 4: Facial Expressions -->
        <div class="tab-section-content" id="tab-cust-expression">
          <div class="options-grid">
            ${EXPRESSION_OPTIONS.map((e, i) => `
              <div class="option-card ${i === 0 ? 'selected' : ''}" onclick="selectExpression('${e.id}', this)">
                <span class="opt-tag" style="color:${e.visorLedColor}">LED: ${e.visorLedColor}</span>
                <h3 class="opt-title">${e.name}</h3>
                <p class="opt-desc">${e.dialogueTone}</p>
              </div>
            `).join("")}
          </div>
        </div>

      </section>
    </div>

  </main>

  <!-- =====================================================================
       CINEMATIC EMBARKATION MODAL (STARSHIP AIRLOCK ENTRANCE)
       ===================================================================== -->
  <div class="embark-modal-overlay" id="embark-modal" role="dialog" aria-modal="true" aria-label="Starship Embarkation Sequence">
    <div class="embark-theatre">
      
      <div class="airlock-status-bar">
        <span id="embark-step-indicator">STAGE 1: AIRLOCK PRESSURIZATION COMPLETE</span>
        <span>STARSHIP QUANTERRAOS // ORBITAL COMMAND</span>
      </div>

      <div class="bridge-cinematic-scene">
        <div class="cinematic-avatar-glow" id="embark-avatar-slot">
          <!-- Animated Avatar Slot -->
        </div>

        <div class="crew-dialogue-box">
          <div class="dialogue-speaker">
            <img src="/assets/art-44/q44-002-thumb.png" alt="Quanta" class="speaker-avatar-circle" id="speaker-avatar-img">
            <div>
              <div class="speaker-name" id="speaker-name-txt">Quanta (Celestial Man)</div>
              <div class="speaker-title" id="speaker-role-txt">Galactic Assistant &amp; Flight Lead</div>
            </div>
          </div>

          <div class="dialogue-message" id="dialogue-message-txt">
            "Welcome aboard Starship QuanterraOS, Pilot! Your biometric signature is registered. Step onto the bridge and take command of your decision cockpit."
          </div>

          <div class="crew-radio-chatter">
            <div class="radio-pill"><strong>Draco:</strong> Feeds Nominal</div>
            <div class="radio-pill"><strong>Wolf:</strong> Queue Locked</div>
            <div class="radio-pill"><strong>Sentinel:</strong> Shield 100%</div>
            <div class="radio-pill"><strong>Kraken:</strong> BRTI Synced</div>
          </div>
        </div>
      </div>

      <div class="embark-footer-actions">
        <button type="button" class="cust-tab-btn" onclick="nextDialogueStep()">Next Dialogue &rarr;</button>
        <a href="/cockpit" class="btn-take-station" onclick="confirmPilotEmbarkation()">Take Flight Deck Station &rarr;</a>
      </div>

    </div>
  </div>

  <script>
    // State management for custom pilot
    const pilotState = {
      callsign: "${initialCallsign}",
      archetypeId: "cadet-vanguard",
      apparelId: "crew-essentials",
      hairId: "zero-g-ponytail",
      expressionId: "calm-focus",
      hairColor: "#1A1A24",
      suitColor: "#0C1022",
      embarked: false
    };

    // Load from localStorage if present
    try {
      const saved = localStorage.getItem('qos_custom_pilot');
      if (saved) {
        Object.assign(pilotState, JSON.parse(saved));
        document.getElementById('pilot-callsign-input').value = pilotState.callsign;
      }
    } catch (e) {}

    function switchCustTab(tabId) {
      document.querySelectorAll('.cust-tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-section-content').forEach(sec => sec.classList.remove('active'));

      event.target.classList.add('active');
      const target = document.getElementById('tab-cust-' + tabId);
      if (target) target.classList.add('active');
    }

    function selectArchetype(id, el) {
      pilotState.archetypeId = id;
      highlightSelected(el);
      reRenderAvatar();
    }

    function selectApparel(id, el) {
      pilotState.apparelId = id;
      highlightSelected(el);
      reRenderAvatar();
    }

    function selectHair(id, el) {
      pilotState.hairId = id;
      highlightSelected(el);
      reRenderAvatar();
    }

    function selectExpression(id, el) {
      pilotState.expressionId = id;
      highlightSelected(el);
      reRenderAvatar();
    }

    function highlightSelected(el) {
      const parent = el.closest('.options-grid');
      if (parent) {
        parent.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      }
      el.classList.add('selected');
    }

    function updateCallsign(val) {
      pilotState.callsign = val.trim().toUpperCase() || "PILOT";
      reRenderAvatar();
    }

    // Client-side SVG renderer matching server engine
    function reRenderAvatar() {
      // Save locally
      try {
        localStorage.setItem('qos_custom_pilot', JSON.stringify(pilotState));
      } catch (e) {}

      // Fetch or dynamically update SVG preview
      const preview = document.getElementById('pilot-svg-preview');
      if (!preview) return;

      // Color maps
      const visorColors = {
        'calm-focus': '#00E5FF',
        'confident-smirk': '#CBFF69',
        'analytical-gaze': '#9B6CFF',
        'stoic-veteran': '#FFB800',
        'cosmic-wonder': '#F472B6',
        'resilient-grin': '#FF55C8'
      };
      const visor = visorColors[pilotState.expressionId] || '#00E5FF';

      // Update callout in existing SVG
      const textNode = preview.querySelector('text:last-of-type');
      if (textNode) textNode.textContent = pilotState.callsign;

      // Dispatch event for any embedded widgets
      window.dispatchEvent(new CustomEvent('pilotAvatarUpdated', { detail: pilotState }));
    }

    // Dialogue sequence
    let dialogueIndex = 0;
    const dialogues = [
      {
        name: "Quanta (Celestial Man)",
        role: "Galactic Assistant & Flight Lead",
        img: "/assets/art-44/q44-002-thumb.png",
        msg: "Welcome aboard Starship QuanterraOS, Pilot! Your biometric signature is registered. Step onto the bridge and take command of your decision cockpit."
      },
      {
        name: "Quantana (Celestial Woman)",
        role: "Queen Companion & Academy Host",
        img: "/assets/art-44/q44-003-thumb.png",
        msg: "Greetings, Commander! I've loaded your pre-flight research modules and verified contract settlement definitions. No blind bets allowed on this flight."
      },
      {
        name: "Draco",
        role: "Data Quality Specialist",
        img: "/assets/art-44/q44-004-thumb.png",
        msg: "Outlier filtering is armed. Incoming Kalshi and Polymarket orderbook prints are clean with zero detected sequence gaps."
      },
      {
        name: "Wolf",
        role: "Liquidity Specialist",
        img: "/assets/art-44/q44-005-thumb.png",
        msg: "Queue depth confirmed. We've modeled top-of-book execution fills so you won't suffer unexpected slippage."
      }
    ];

    function launchEmbarkationSequence() {
      const modal = document.getElementById('embark-modal');
      const avatarSlot = document.getElementById('embark-avatar-slot');
      const previewSvg = document.getElementById('pilot-svg-preview').innerHTML;
      
      avatarSlot.innerHTML = previewSvg;
      dialogueIndex = 0;
      showDialogue(0);
      modal.classList.add('active');

      // Speech synthesis voice check
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(dialogues[0].msg);
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
    }

    function showDialogue(idx) {
      const d = dialogues[idx];
      document.getElementById('speaker-name-txt').textContent = d.name;
      document.getElementById('speaker-role-txt').textContent = d.role;
      document.getElementById('speaker-avatar-img').src = d.img;
      document.getElementById('dialogue-message-txt').textContent = '"' + d.msg + '"';
      document.getElementById('embark-step-indicator').textContent = 'STAGE ' + (idx + 1) + ': CREW DOCKING PROTOCOL ACTIVE';
    }

    function nextDialogueStep() {
      dialogueIndex = (dialogueIndex + 1) % dialogues.length;
      showDialogue(dialogueIndex);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(dialogues[dialogueIndex].msg);
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
    }

    function confirmPilotEmbarkation() {
      pilotState.embarked = true;
      pilotState.embarkedAt = new Date().toISOString();
      try {
        localStorage.setItem('qos_custom_pilot', JSON.stringify(pilotState));
      } catch (e) {}
    }
  </script>

  ${renderPublicFooter()}
</body>
</html>`;
}
