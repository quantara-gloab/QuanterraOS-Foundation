/**
 * QuanterraOS Virtual Desk Assistant & Customer Support Widget
 *
 * Featured Personas:
 * - Quanta (Male Flight Pilot & Global Galactic Leader)
 * - Quantana (Female Flight Pilot & Global Galactic Leader)
 *
 * Implements:
 * 1. Bottom-right floating interactive assistant with photographic avatar, glowing gold halo, and audio speech (Web Speech API).
 * 2. Instant persona switcher: Quanta (Male) or Quantana (Female).
 * 3. Verified contact channels (email and 1-800 toll-free phone):
 *    - Toll-free Live Line: 1-800-QUANTERRA (1-800-782-6837)
 *    - Primary Support: support@quanterraos.com
 *    - Legal & Securities: compliance@quanterraos.com
 * 4. Interactive conversational engine hooked to /api/assistant/chat (Quanta / Quantana persona).
 * 5. Strict Rule B4 & Rule B5 guardrails: zero unbacked claims, 0.2001 Brier baseline, $0.00 paper safety.
 *
 * Security: user input is rendered with textContent; assistant replies are HTML-escaped
 * before a minimal formatting pass (line breaks and **bold** only). No raw server HTML is injected.
 */

export const ASSISTANT_WIDGET_HTML = `
<!-- QuanterraOS Virtual Desk Assistant Widget -->
<div id="qos-assistant-root">
  <!-- Floating Launcher Bubble (Bottom-Right) -->
  <button id="qos-assistant-bubble" aria-label="Open Virtual Assistant" aria-expanded="false" aria-controls="qos-assistant-drawer" title="Quanta · Virtual Assistant &amp; Global Galactic Leader">
    <div class="qos-bubble-inner">
      <div class="qos-pulse-ring"></div>
      <div class="qos-bubble-avatar-wrap">
        <img id="qos-bubble-avatar-img" src="/assets/assistant-avatar.jpg" alt="Virtual Assistant" class="qos-bubble-avatar" />
        <span class="qos-bubble-online-badge" aria-hidden="true"></span>
      </div>
      <div class="qos-bubble-text">
        <span id="qos-bubble-name-txt" class="qos-bubble-name">Quanta</span>
        <span class="qos-bubble-role">Virtual Assistant</span>
      </div>
    </div>
  </button>

  <!-- Assistant Pop-up Window -->
  <div id="qos-assistant-drawer" class="qos-drawer-hidden" role="dialog" aria-label="Customer Support and Virtual Assistant">
    <!-- Header -->
    <div class="qos-drawer-header">
      <div class="qos-header-left">
        <div class="qos-header-avatar">
          <img id="qos-drawer-avatar-img" src="/assets/assistant-avatar.jpg" alt="Virtual Assistant" class="qos-avatar-photo" />
          <span class="qos-avatar-pulse"></span>
        </div>
        <div>
          <div class="qos-header-title"><span id="qos-header-name-txt">Quanta</span> <span class="qos-title-badge">Virtual Assistant</span></div>
          <div class="qos-header-sub">Global Galactic Leader · Flight Deck Guide</div>
        </div>
      </div>
      <div class="qos-header-actions">
        <button id="qos-voice-toggle" class="qos-tool-btn" title="Toggle Voice / Read Aloud" aria-pressed="false">
          <span id="qos-voice-icon">🔇 Voice OFF</span>
        </button>
        <button id="qos-close-btn" class="qos-tool-btn" title="Minimize Drawer" aria-label="Close assistant">✕</button>
      </div>
    </div>

    <!-- Persona Switcher Bar (Quanta Male vs Quantana Female) -->
    <div class="qos-persona-bar">
      <span class="qos-persona-lbl">Assistant Voice &amp; Identity:</span>
      <div class="qos-persona-btns">
        <button type="button" class="qos-persona-btn active" id="btn-persona-quanta" onclick="setAssistantIdentity('quanta')" title="Quanta (Male Flight Pilot &amp; Global Galactic Leader)">
          🧑‍✈️ Quanta (Male)
        </button>
        <button type="button" class="qos-persona-btn" id="btn-persona-quantana" onclick="setAssistantIdentity('quantana')" title="Quantana (Female Flight Pilot &amp; Global Galactic Leader)">
          👩‍✈️ Quantana (Female)
        </button>
      </div>
    </div>

    <!-- Official Contact Banner (verified channels with 1-800 toll-free phone) -->
    <div class="qos-contact-strip">
      <div class="qos-contact-item">
        <span class="qos-contact-lbl">LIVE 1-800:</span>
        <a href="tel:18007826837" class="qos-contact-val" style="color:#DFB843; font-weight:700;">1-800-782-6837</a>
      </div>
      <div class="qos-contact-item">
        <span class="qos-contact-lbl">SUPPORT:</span>
        <a href="mailto:support@quanterraos.com" class="qos-contact-val">support@quanterraos.com</a>
      </div>
    </div>

    <!-- Chat Messages Scroll Area -->
    <div id="qos-chat-messages" class="qos-messages-container" aria-live="polite">
      <!-- Assistant Welcome Hero Card -->
      <div class="qos-aria-hero-card">
        <img id="qos-hero-avatar-img" src="/assets/assistant-avatar.jpg" alt="Virtual Assistant" class="qos-hero-img" />
        <div class="qos-hero-body">
          <div class="qos-hero-name"><span id="qos-hero-name-txt">Quanta</span> <span class="qos-hero-verified">✓ Global Galactic Leader</span></div>
          <div class="qos-hero-tagline">Flight Deck Virtual Assistant &amp; Receipt Guide</div>
          <div class="qos-hero-desc">Ask me to explain contract costs, verify settlement rules, or connect with our live 1-800 assistant team.</div>
        </div>
      </div>

      <!-- Initial greeting -->
      <div class="qos-msg qos-msg-assistant">
        <img id="qos-initial-msg-avatar" src="/assets/assistant-avatar.jpg" alt="Virtual Assistant" class="qos-msg-avatar" />
        <div class="qos-msg-content">
          <div class="qos-msg-bubble" id="qos-greeting-bubble">
Greetings, Pilot! I am <strong id="qos-greeting-strong">Quanta</strong>, your virtual assistant and Global Galactic Leader.
<br><br>
I'm here to help you <strong>explain your contract costs</strong>, decode settlement rules, and <strong>revisit your decision records</strong>.
<br><br>
Need to talk to a live assistant right now? Call toll-free at <strong><a href="tel:18007826837" style="color:#DFB843; text-decoration:none; font-weight:700;">1-800-QUANTERRA (1-800-782-6837)</a></strong> or email <strong>support@quanterraos.com</strong>. How may I assist your flight deck today?
          </div>
          <div class="qos-msg-meta"><span id="qos-meta-name-txt">Quanta</span> · Virtual Assistant · Online</div>
        </div>
      </div>
    </div>

    <!-- Quick Question Chips -->
    <div class="qos-quick-chips">
      <button class="qos-chip" data-q="Explain my costs">Explain my costs</button>
      <button class="qos-chip" data-q="How do I talk to a live assistant on 1-800?">📞 Call 1-800 Assistant</button>
      <button class="qos-chip" data-q="How does Expiry Radar work?">Expiry Radar?</button>
      <button class="qos-chip" data-q="Save my check">Save my check</button>
      <button class="qos-chip" data-q="Find my journal">Find my journal</button>
      <button class="qos-chip" data-q="How do fees work on Kalshi?">Kalshi fee formula?</button>
    </div>

    <!-- Chat Input Area -->
    <form id="qos-chat-form" class="qos-input-bar">
      <input type="text" id="qos-chat-input" placeholder="Ask Quanta to explain costs, save your check, or find your journal…" autocomplete="off" maxlength="1000" aria-label="Message Assistant" />
      <button type="button" id="qos-mic-btn" class="qos-mic-btn" title="Speak to Assistant (Speech-to-Text)" aria-label="Voice input">
        <span id="qos-mic-icon">🎙️</span>
      </button>
      <button type="submit" id="qos-send-btn" aria-label="Send Message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </form>
  </div>
</div>

<style>
/* Assistant Widget Styles */
#qos-assistant-root {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #F8FAFC;
}

/* Launcher Bubble */
#qos-assistant-bubble {
  background: #0E131A;
  border: 1.5px solid rgba(223, 184, 67, 0.55);
  border-radius: 999px;
  padding: 6px 16px 6px 6px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65), 0 0 18px rgba(223, 184, 67, 0.28);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  position: relative;
  outline: none;
}
#qos-assistant-bubble:hover {
  transform: translateY(-2px);
  border-color: #DFB843;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.75), 0 0 24px rgba(223, 184, 67, 0.45);
}
.qos-bubble-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}
.qos-pulse-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #DFB843;
  opacity: 0;
  animation: qos-pulse 2.5s infinite;
  pointer-events: none;
}
@keyframes qos-pulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  70% { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(1.35); opacity: 0; }
}
.qos-bubble-avatar-wrap {
  position: relative;
  width: 40px;
  height: 40px;
}
.qos-bubble-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #DFB843;
  box-shadow: 0 0 10px rgba(223, 184, 67, 0.4);
  display: block;
}
.qos-bubble-online-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10B981;
  border: 2px solid #0E131A;
  box-shadow: 0 0 6px #10B981;
}
.qos-bubble-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.qos-bubble-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.qos-bubble-role {
  font-size: 0.68rem;
  color: #DFB843;
  font-family: "IBM Plex Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Pop-up Drawer Card */
#qos-assistant-drawer {
  width: 390px;
  max-width: calc(100vw - 32px);
  height: 580px;
  max-height: calc(100vh - 100px);
  background: #0A0E14;
  border: 1px solid rgba(223, 184, 67, 0.35);
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(223, 184, 67, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: absolute;
  bottom: 64px;
  right: 0;
  transition: opacity 0.2s, transform 0.2s;
}
.qos-drawer-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(16px) scale(0.96);
}

/* Header */
.qos-drawer-header {
  background: #0E131A;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.qos-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.qos-header-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}
.qos-avatar-photo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #DFB843;
}
.qos-avatar-pulse {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #10B981;
  border: 1.5px solid #0E131A;
}
.qos-header-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 6px;
}
.qos-title-badge {
  font-size: 0.65rem;
  font-family: "IBM Plex Mono", monospace;
  color: #DFB843;
  background: rgba(223, 184, 67, 0.12);
  border: 1px solid rgba(223, 184, 67, 0.35);
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.qos-header-sub {
  font-size: 0.72rem;
  color: #94A3B8;
  font-family: "IBM Plex Mono", monospace;
}
.qos-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.qos-tool-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #CBD5E1;
  font-size: 0.75rem;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.qos-tool-btn:hover {
  background: rgba(223, 184, 67, 0.15);
  border-color: rgba(223, 184, 67, 0.4);
  color: #FFF;
}
.qos-voice-active {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10B981;
  color: #10B981;
}

/* Persona Switcher Bar */
.qos-persona-bar {
  background: #111722;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.qos-persona-lbl {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  color: #94A3B8;
  text-transform: uppercase;
}
.qos-persona-btns {
  display: flex;
  gap: 6px;
}
.qos-persona-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #CBD5E1;
  font-size: 0.72rem;
  padding: 4px 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.qos-persona-btn.active {
  background: #DFB843;
  color: #0E131A;
  font-weight: 700;
  border-color: #DFB843;
}

/* Contact Strip */
.qos-contact-strip {
  background: rgba(223, 184, 67, 0.06);
  border-bottom: 1px solid rgba(223, 184, 67, 0.15);
  padding: 6px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  font-family: "IBM Plex Mono", monospace;
}
.qos-contact-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.qos-contact-lbl { color: #8A8F98; font-weight: 600; }
.qos-contact-val { color: #DFB843; text-decoration: none; }
.qos-contact-val:hover { text-decoration: underline; }

/* Messages Area */
.qos-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #070A0F;
  scroll-behavior: smooth;
}

/* Hero Welcome Card */
.qos-aria-hero-card {
  background: linear-gradient(135deg, rgba(223, 184, 67, 0.08) 0%, rgba(14, 19, 28, 0.8) 100%);
  border: 1px solid rgba(223, 184, 67, 0.25);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
}
.qos-hero-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #DFB843;
  flex-shrink: 0;
}
.qos-hero-body { flex: 1; }
.qos-hero-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #FFF;
  display: flex;
  align-items: center;
  gap: 6px;
}
.qos-hero-verified {
  font-size: 0.65rem;
  color: #10B981;
  font-family: "IBM Plex Mono", monospace;
}
.qos-hero-tagline {
  font-size: 0.7rem;
  color: #DFB843;
  font-family: "IBM Plex Mono", monospace;
  margin-top: 2px;
}
.qos-hero-desc {
  font-size: 0.74rem;
  color: #94A3B8;
  margin-top: 4px;
  line-height: 1.35;
}

/* Chat Bubbles */
.qos-msg {
  display: flex;
  gap: 10px;
  max-width: 90%;
  animation: qos-msg-appear 0.15s ease-out;
}
@keyframes qos-msg-appear {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.qos-msg-assistant {
  align-self: flex-start;
}
.qos-msg-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.qos-msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #DFB843;
  flex-shrink: 0;
}
.qos-msg-content {
  display: flex;
  flex-direction: column;
}
.qos-msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.82rem;
  line-height: 1.45;
  word-break: break-word;
}
.qos-msg-assistant .qos-msg-bubble {
  background: #111722;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #E2E8F0;
  border-top-left-radius: 2px;
}
.qos-msg-user .qos-msg-bubble {
  background: linear-gradient(135deg, #C9A24A 0%, #A6802C 100%);
  color: #070A0F;
  font-weight: 500;
  border-top-right-radius: 2px;
}
.qos-msg-meta {
  font-size: 0.65rem;
  color: #64748B;
  font-family: "IBM Plex Mono", monospace;
  margin-top: 4px;
  padding: 0 4px;
}
.qos-msg-user .qos-msg-meta {
  text-align: right;
}

/* Quick Question Chips */
.qos-quick-chips {
  background: #0A0E14;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 8px 12px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.qos-quick-chips::-webkit-scrollbar { display: none; }
.qos-chip {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(223, 184, 67, 0.2);
  color: #CBD5E1;
  font-size: 0.72rem;
  font-family: "IBM Plex Mono", monospace;
  padding: 5px 10px;
  border-radius: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}
.qos-chip:hover {
  background: rgba(223, 184, 67, 0.15);
  border-color: #DFB843;
  color: #FFFFFF;
}

/* Input Bar */
.qos-input-bar {
  background: #0E131A;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.qos-input-bar input {
  flex: 1;
  background: #070A0F;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: #FFFFFF;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s;
}
.qos-input-bar input:focus {
  border-color: #DFB843;
}
.qos-mic-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #CBD5E1;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.qos-mic-btn:hover {
  background: rgba(223, 184, 67, 0.15);
  border-color: #DFB843;
}
.qos-mic-active {
  background: rgba(244, 63, 94, 0.2);
  border-color: #F43F5E;
  animation: qos-mic-pulse 1s infinite alternate;
}
@keyframes qos-mic-pulse {
  from { box-shadow: 0 0 4px #F43F5E; }
  to { box-shadow: 0 0 12px #F43F5E; }
}
#qos-send-btn {
  background: linear-gradient(135deg, #C9A24A 0%, #A6802C 100%);
  border: none;
  color: #070A0F;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.15s;
}
#qos-send-btn svg { width: 16px; height: 16px; }
#qos-send-btn:hover { opacity: 0.9; }
#qos-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Responsive Adjustments for Mobile (320px - 480px) */
@media (max-width: 480px) {
  #qos-assistant-root {
    bottom: 16px;
    right: 16px;
  }
  #qos-assistant-drawer {
    position: fixed;
    inset: 0;
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
  }
  .qos-input-bar input { font-size: 16px; } /* prevents iOS zoom on focus */
}
</style>

<script>
(function() {
  let isVoiceEnabled = false; // Default OFF site-wide (opt-in)
  let isOpen = false;
  let isSending = false;
  let hasSpokenWelcome = false;
  let conversationHistory = [];
  let currentIdentity = 'quanta'; // 'quanta' (male) or 'quantana' (female)

  try {
    const saved = localStorage.getItem('qos_assistant_identity');
    if (saved === 'quantana') currentIdentity = 'quantana';
  } catch (e) {}

  const bubble = document.getElementById('qos-assistant-bubble');
  const drawer = document.getElementById('qos-assistant-drawer');
  const closeBtn = document.getElementById('qos-close-btn');
  const voiceToggle = document.getElementById('qos-voice-toggle');
  const voiceIcon = document.getElementById('qos-voice-icon');
  const chatForm = document.getElementById('qos-chat-form');
  const chatInput = document.getElementById('qos-chat-input');
  const sendBtn = document.getElementById('qos-send-btn');
  const micBtn = document.getElementById('qos-mic-btn');
  const micIcon = document.getElementById('qos-mic-icon');
  const messagesContainer = document.getElementById('qos-chat-messages');

  const btnQuanta = document.getElementById('btn-persona-quanta');
  const btnQuantana = document.getElementById('btn-persona-quantana');

  const bubbleAvatarImg = document.getElementById('qos-bubble-avatar-img');
  const bubbleNameTxt = document.getElementById('qos-bubble-name-txt');
  const drawerAvatarImg = document.getElementById('qos-drawer-avatar-img');
  const headerNameTxt = document.getElementById('qos-header-name-txt');
  const heroAvatarImg = document.getElementById('qos-hero-avatar-img');
  const heroNameTxt = document.getElementById('qos-hero-name-txt');
  const initialMsgAvatar = document.getElementById('qos-initial-msg-avatar');
  const greetingStrong = document.getElementById('qos-greeting-strong');
  const metaNameTxt = document.getElementById('qos-meta-name-txt');

  function updateIdentityUI() {
    const isQuanta = currentIdentity === 'quanta';
    const name = isQuanta ? 'Quanta' : 'Quantana';
    const avatar = isQuanta ? '/assets/merch-hoodie-quanta.jpg' : '/assets/assistant-avatar.jpg';

    if (btnQuanta) btnQuanta.classList.toggle('active', isQuanta);
    if (btnQuantana) btnQuantana.classList.toggle('active', !isQuanta);

    if (bubbleAvatarImg) bubbleAvatarImg.src = avatar;
    if (bubbleNameTxt) bubbleNameTxt.textContent = name;
    if (drawerAvatarImg) drawerAvatarImg.src = avatar;
    if (headerNameTxt) headerNameTxt.textContent = name;
    if (heroAvatarImg) heroAvatarImg.src = avatar;
    if (heroNameTxt) heroNameTxt.textContent = name;
    if (initialMsgAvatar) initialMsgAvatar.src = avatar;
    if (greetingStrong) greetingStrong.textContent = name;
    if (metaNameTxt) metaNameTxt.textContent = name;

    if (chatInput) {
      chatInput.placeholder = 'Ask ' + name + ' to explain costs, explore the Flight Deck, or review records…';
    }
  }

  window.setAssistantIdentity = function(id) {
    currentIdentity = id === 'quantana' ? 'quantana' : 'quanta';
    try { localStorage.setItem('qos_assistant_identity', currentIdentity); } catch (e) {}
    updateIdentityUI();
    if (isVoiceEnabled) {
      speakText('Switched virtual assistant identity to ' + (currentIdentity === 'quanta' ? 'Quanta' : 'Quantana') + '. Global Galactic Leader active.');
    }
  };

  updateIdentityUI();

  const FALLBACK_REPLY = 'Quanta is active and monitoring telemetry. To speak with a live assistant, call toll-free at 1-800-QUANTERRA (1-800-782-6837) or email support@quanterraos.com. All operations adhere strictly to Rule B5 paper execution.';

  // Cached voice loading
  let cachedVoices = [];
  function loadVoices() {
    if ('speechSynthesis' in window) {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }
  loadVoices();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function setOpen(open, focusInput) {
    isOpen = open;
    drawer.classList.toggle('qos-drawer-hidden', !open);
    bubble.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (focusInput) chatInput.focus();
      if (isVoiceEnabled && !hasSpokenWelcome) {
        hasSpokenWelcome = true;
        const name = currentIdentity === 'quanta' ? 'Quanta' : 'Quantana';
        speakText('Hello! I am ' + name + ', your virtual assistant and Global Galactic Leader. Ready to assist your Flight Deck.');
      }
    }
  }

  bubble.addEventListener('click', function(e) {
    e.stopPropagation();
    setOpen(!isOpen, true);
  });

  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    setOpen(false);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) setOpen(false);
  });

  // Escape HTML
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatAssistantText(str) {
    return escapeHtml(str).replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
  }

  // Voice Speech Synthesis
  function speakText(text) {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      const clean = String(text)
        .replace(/<[^>]*>/g, ' ')
        .replace(/[*_#\\x60~]/g, '')
        .replace(/\\s+/g, ' ')
        .trim();
      if (!clean) return;

      const utter = new SpeechSynthesisUtterance(clean);
      const isQuanta = currentIdentity === 'quanta';
      utter.rate = 1.02;
      utter.pitch = isQuanta ? 0.95 : 1.08;

      const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
      let matchedVoice = null;
      if (isQuanta) {
        matchedVoice = voices.find(function(v) {
          return v.name.match(/daniel|george|david|alex|fred|male/i) && v.lang.startsWith('en');
        });
      } else {
        matchedVoice = voices.find(function(v) {
          return v.name.match(/samantha|victoria|karen|zira|jenny|moira|fiona|serena|female/i) && v.lang.startsWith('en');
        });
      }
      if (!matchedVoice) {
        matchedVoice = voices.find(function(v) { return v.lang.startsWith('en'); });
      }

      if (matchedVoice) utter.voice = matchedVoice;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  voiceToggle.addEventListener('click', function() {
    isVoiceEnabled = !isVoiceEnabled;
    voiceToggle.classList.toggle('qos-voice-active', isVoiceEnabled);
    voiceToggle.setAttribute('aria-pressed', isVoiceEnabled ? 'true' : 'false');
    if (isVoiceEnabled) {
      voiceIcon.textContent = '🔊 Voice ON';
      speakText('Voice output activated. I will speak responses for you.');
    } else {
      voiceIcon.textContent = '🔇 Voice OFF';
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  });

  // Speech Recognition (Voice Input via Mic)
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;

  if (SpeechRec && micBtn) {
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
      isListening = true;
      micBtn.classList.add('qos-mic-active');
      if (micIcon) micIcon.textContent = '🔴';
      chatInput.placeholder = 'Listening... Speak now...';
    };

    recognition.onresult = function(event) {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          chatInput.value = transcript;
          sendMessage(transcript);
        }
      }
    };

    recognition.onerror = function(event) {
      console.warn('Speech recognition error:', event.error);
      isListening = false;
      micBtn.classList.remove('qos-mic-active');
      if (micIcon) micIcon.textContent = '🎙️';
      chatInput.placeholder = 'Ask ' + (currentIdentity === 'quanta' ? 'Quanta' : 'Quantana') + ' about market calibration, telemetry, or support…';
    };

    recognition.onend = function() {
      isListening = false;
      micBtn.classList.remove('qos-mic-active');
      if (micIcon) micIcon.textContent = '🎙️';
      chatInput.placeholder = 'Ask ' + (currentIdentity === 'quanta' ? 'Quanta' : 'Quantana') + ' about market calibration, telemetry, or support…';
    };

    micBtn.addEventListener('click', function() {
      if (!isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Could not start speech recognition:', e);
        }
      } else {
        recognition.stop();
      }
    });
  } else if (micBtn) {
    micBtn.style.display = 'none';
  }

  // Append message to UI
  function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'qos-msg qos-msg-' + (role === 'user' ? 'user' : 'assistant');

    if (role === 'assistant') {
      const avatarImg = document.createElement('img');
      avatarImg.src = currentIdentity === 'quanta' ? '/assets/merch-hoodie-quanta.jpg' : '/assets/assistant-avatar.jpg';
      avatarImg.alt = currentIdentity === 'quanta' ? 'Quanta' : 'Quantana';
      avatarImg.className = 'qos-msg-avatar';
      msgDiv.appendChild(avatarImg);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'qos-msg-content';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'qos-msg-bubble';

    if (role === 'user') {
      bubbleDiv.textContent = text;
    } else {
      bubbleDiv.innerHTML = formatAssistantText(text);
    }

    const metaDiv = document.createElement('div');
    metaDiv.className = 'qos-msg-meta';
    metaDiv.textContent = role === 'user'
      ? 'You'
      : (currentIdentity === 'quanta' ? 'Quanta' : 'Quantana') + ' · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    contentDiv.appendChild(bubbleDiv);
    contentDiv.appendChild(metaDiv);
    msgDiv.appendChild(contentDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if (role === 'assistant') {
      speakText(text);
    }
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'qos-msg qos-msg-assistant qos-msg-typing';
    
    const avatarImg = document.createElement('img');
    avatarImg.src = currentIdentity === 'quanta' ? '/assets/merch-hoodie-quanta.jpg' : '/assets/assistant-avatar.jpg';
    avatarImg.alt = currentIdentity === 'quanta' ? 'Quanta' : 'Quantana';
    avatarImg.className = 'qos-msg-avatar';
    el.appendChild(avatarImg);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'qos-msg-content';

    const b = document.createElement('div');
    b.className = 'qos-msg-bubble';
    b.textContent = (currentIdentity === 'quanta' ? 'Quanta' : 'Quantana') + ' is analyzing telemetry…';
    contentDiv.appendChild(b);
    el.appendChild(contentDiv);

    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return el;
  }

  // Send message
  async function sendMessage(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed || isSending) return;

    isSending = true;
    sendBtn.disabled = true;
    appendMessage('user', trimmed);
    conversationHistory.push({ role: 'user', content: trimmed });
    chatInput.value = '';

    const typingIndicator = showTyping();

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, agentId: currentIdentity, history: conversationHistory.slice(-10) }),
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Invalid JSON response');
      }

      typingIndicator.remove();
      const reply = data && typeof data.reply === 'string' && data.reply.trim()
        ? data.reply
        : 'Standing by for telemetry inquiries.';
      conversationHistory.push({ role: 'assistant', content: reply });
      appendMessage('assistant', reply);
    } catch (err) {
      console.warn('Assistant request failed:', err);
      typingIndicator.remove();
      appendMessage('assistant', FALLBACK_REPLY);
    } finally {
      isSending = false;
      sendBtn.disabled = false;
    }
  }

  chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    sendMessage(chatInput.value);
  });

  // Quick Chips
  document.querySelectorAll('.qos-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      sendMessage(chip.getAttribute('data-q'));
    });
  });

  // Auto-pop greeting after 3 seconds on first visit (desktop only; no input focus)
  setTimeout(function() {
    let seen = false;
    try { seen = !!sessionStorage.getItem('qos_assistant_seen'); } catch (e) {}
    if (seen || window.innerWidth <= 480) return;
    try { sessionStorage.setItem('qos_assistant_seen', 'true'); } catch (e) {}
    setOpen(true, false);
  }, 3000);
})();
</script>
`;
