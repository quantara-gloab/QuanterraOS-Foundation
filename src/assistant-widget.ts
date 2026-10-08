/**
 * QuanterraOS Virtual Desk Assistant & Customer Support Widget
 *
 * Featured Persona: Aria · Lead Executive Concierge & Market Surveillance Specialist
 *
 * Implements:
 * 1. Bottom-right floating interactive assistant with photographic avatar, glowing gold halo, and audio speech (Web Speech API).
 * 2. Verified contact channels (email only until a live, staffed phone line exists):
 *    - Primary Support: support@quanterraos.com
 *    - Legal & Securities: compliance@quanterraos.com
 * 3. Interactive conversational engine hooked to /api/assistant/chat (Aria Concierge persona).
 * 4. Strict Rule B4 & Rule B5 guardrails: zero unbacked claims, 0.2001 Brier baseline, $0.00 paper safety.
 *
 * Security: user input is rendered with textContent; assistant replies are HTML-escaped
 * before a minimal formatting pass (line breaks and **bold** only). No raw server HTML is injected.
 */

export const ASSISTANT_WIDGET_HTML = `
<!-- QuanterraOS Virtual Desk Assistant Widget -->
<div id="qos-assistant-root">
  <!-- Floating Launcher Bubble (Bottom-Right) -->
  <button id="qos-assistant-bubble" aria-label="Open Aria Desk Assistant" aria-expanded="false" aria-controls="qos-assistant-drawer" title="Aria · QuanterraOS Executive Concierge">
    <div class="qos-bubble-inner">
      <div class="qos-pulse-ring"></div>
      <div class="qos-bubble-avatar-wrap">
        <img src="/assets/assistant-avatar.jpg" alt="Aria" class="qos-bubble-avatar" />
        <span class="qos-bubble-online-badge" aria-hidden="true"></span>
      </div>
      <div class="qos-bubble-text">
        <span class="qos-bubble-name">Aria</span>
        <span class="qos-bubble-role">Concierge</span>
      </div>
    </div>
  </button>

  <!-- Assistant Pop-up Window -->
  <div id="qos-assistant-drawer" class="qos-drawer-hidden" role="dialog" aria-label="Customer Support and Assistant">
    <!-- Header -->
    <div class="qos-drawer-header">
      <div class="qos-header-left">
        <div class="qos-header-avatar">
          <img src="/assets/assistant-avatar.jpg" alt="Aria" class="qos-avatar-photo" />
          <span class="qos-avatar-pulse"></span>
        </div>
        <div>
          <div class="qos-header-title">Aria <span class="qos-title-badge">Concierge</span></div>
          <div class="qos-header-sub">Online · Market Specialist 24/7</div>
        </div>
      </div>
      <div class="qos-header-actions">
        <button id="qos-voice-toggle" class="qos-tool-btn qos-voice-active" title="Toggle Voice / Read Aloud" aria-pressed="true">
          <span id="qos-voice-icon">🔊 Voice ON</span>
        </button>
        <button id="qos-close-btn" class="qos-tool-btn" title="Minimize Drawer" aria-label="Close assistant">✕</button>
      </div>
    </div>

    <!-- Official Contact Banner (verified channels only) -->
    <div class="qos-contact-strip">
      <div class="qos-contact-item">
        <span class="qos-contact-lbl">SUPPORT:</span>
        <a href="mailto:support@quanterraos.com" class="qos-contact-val">support@quanterraos.com</a>
      </div>
      <div class="qos-contact-item">
        <span class="qos-contact-lbl">COMPLIANCE:</span>
        <a href="mailto:compliance@quanterraos.com" class="qos-contact-val">compliance@quanterraos.com</a>
      </div>
    </div>

    <!-- Chat Messages Scroll Area -->
    <div id="qos-chat-messages" class="qos-messages-container" aria-live="polite">
      <!-- Aria Welcome Hero Card -->
      <div class="qos-aria-hero-card">
        <img src="/assets/assistant-avatar.jpg" alt="Aria" class="qos-hero-img" />
        <div class="qos-hero-body">
          <div class="qos-hero-name">Aria <span class="qos-hero-verified">✓ Concierge</span></div>
          <div class="qos-hero-tagline">Executive Concierge &amp; Risk Guide</div>
          <div class="qos-hero-desc">Ask me to explain contract costs, save your check to your journal, or locate your records.</div>
        </div>
      </div>

      <!-- Initial greeting -->
      <div class="qos-msg qos-msg-assistant">
        <img src="/assets/assistant-avatar.jpg" alt="Aria" class="qos-msg-avatar" />
        <div class="qos-msg-content">
          <div class="qos-msg-bubble">
Hello! I am <strong>Aria</strong>, your QuanterraOS executive concierge.
<br><br>
I'm here to help you <strong>explain your contract costs</strong>, <strong>save your checks</strong> to your personal decision journal, or locate your trading records.
<br><br>
For direct human support, our team is reachable at <strong>support@quanterraos.com</strong>. How may I assist you today?
          </div>
          <div class="qos-msg-meta">Aria · Just now</div>
        </div>
      </div>
    </div>

    <!-- Quick Question Chips -->
    <div class="qos-quick-chips">
      <button class="qos-chip" data-q="Explain my costs">Explain my costs</button>
      <button class="qos-chip" data-q="Save my check">Save my check</button>
      <button class="qos-chip" data-q="Find my journal">Find my journal</button>
      <button class="qos-chip" data-q="How do fees work on Kalshi?">Kalshi fee formula?</button>
      <button class="qos-chip" data-q="How do I contact customer support?">Contact support</button>
    </div>

    <!-- Chat Input Area -->
    <form id="qos-chat-form" class="qos-input-bar">
      <input type="text" id="qos-chat-input" placeholder="Ask Aria to explain costs, save your check, or find your journal…" autocomplete="off" maxlength="1000" aria-label="Message Aria" />
      <button type="button" id="qos-mic-btn" class="qos-mic-btn" title="Speak to Aria (Speech-to-Text)" aria-label="Voice input">
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
  z-index: 10000;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Bubble Button */
#qos-assistant-bubble {
  background: #0E131A;
  border: 1px solid rgba(223, 184, 67, 0.45);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65), 0 0 24px rgba(223, 184, 67, 0.22);
  border-radius: 36px;
  padding: 6px 16px 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}
#qos-assistant-bubble:hover {
  transform: translateY(-2px);
  border-color: #DFB843;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.75), 0 0 32px rgba(223, 184, 67, 0.4);
}
#qos-assistant-bubble:focus-visible { border-color: #DFB843; }

.qos-bubble-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}
.qos-bubble-avatar-wrap {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
}
.qos-bubble-avatar {
  width: 100%;
  height: 100%;
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
  height: 560px;
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
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #DFB843;
  box-shadow: 0 0 10px rgba(223, 184, 67, 0.35);
}
.qos-avatar-pulse {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #10B981;
  border: 1.5px solid #0E131A;
  box-shadow: 0 0 6px #10B981;
}
.qos-header-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 6px;
}
.qos-title-badge {
  font-size: 0.62rem;
  color: #DFB843;
  background: rgba(223, 184, 67, 0.12);
  border: 1px solid rgba(223, 184, 67, 0.35);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: "IBM Plex Mono", monospace;
  text-transform: uppercase;
}
.qos-header-sub {
  font-size: 0.7rem;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94A3B8;
  font-size: 0.72rem;
  font-family: "IBM Plex Mono", monospace;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.qos-tool-btn:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.1);
}
.qos-voice-active {
  color: #DFB843 !important;
  border-color: #DFB843 !important;
  background: rgba(223, 184, 67, 0.15) !important;
}

/* Contact Strip */
.qos-contact-strip {
  background: rgba(223, 184, 67, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-family: "IBM Plex Mono", monospace;
  flex-wrap: wrap;
  gap: 6px;
}
.qos-contact-item { display: flex; align-items: center; gap: 4px; }
.qos-contact-lbl { color: #64748B; font-size: 0.68rem; }
.qos-contact-val { color: #DFB843; text-decoration: none; font-weight: 500; }
.qos-contact-val:hover { text-decoration: underline; }

/* Messages Area */
.qos-messages-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Aria Hero Card */
.qos-aria-hero-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(20, 27, 38, 0.9) 0%, rgba(14, 19, 26, 0.95) 100%);
  border: 1px solid rgba(223, 184, 67, 0.25);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 4px;
}
.qos-hero-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #DFB843;
  box-shadow: 0 0 12px rgba(223, 184, 67, 0.35);
  flex-shrink: 0;
}
.qos-hero-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.qos-hero-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 6px;
}
.qos-hero-verified {
  font-size: 0.65rem;
  color: #10B981;
  font-weight: 600;
}
.qos-hero-tagline {
  font-size: 0.7rem;
  color: #DFB843;
  font-family: "IBM Plex Mono", monospace;
}
.qos-hero-desc {
  font-size: 0.72rem;
  color: #94A3B8;
  line-height: 1.35;
}

/* Chat Messages */
.qos-msg {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 92%;
}
.qos-msg-assistant { align-self: flex-start; }
.qos-msg-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.qos-msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(223, 184, 67, 0.6);
  flex-shrink: 0;
  margin-top: 2px;
}
.qos-msg-content {
  display: flex;
  flex-direction: column;
}
.qos-msg-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.qos-msg-assistant .qos-msg-bubble {
  background: #141B26;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #E2E8F0;
}
.qos-msg-user .qos-msg-bubble {
  background: rgba(223, 184, 67, 0.15);
  border: 1px solid rgba(223, 184, 67, 0.4);
  color: #FFFFFF;
}
.qos-msg-typing .qos-msg-bubble {
  color: #94A3B8;
  font-style: italic;
}
.qos-msg-meta {
  font-size: 0.65rem;
  color: #64748B;
  font-family: "IBM Plex Mono", monospace;
  margin-top: 4px;
  padding: 0 2px;
}
.qos-msg-user .qos-msg-meta { text-align: right; }

/* Chips */
.qos-quick-chips {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  gap: 6px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}
.qos-quick-chips::-webkit-scrollbar { display: none; }
.qos-chip {
  background: #0E131A;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94A3B8;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-family: "IBM Plex Mono", monospace;
  cursor: pointer;
  transition: all 0.15s;
}
.qos-chip:hover {
  color: #DFB843;
  border-color: rgba(223, 184, 67, 0.4);
  background: rgba(223, 184, 67, 0.08);
}

/* Input Bar */
.qos-input-bar {
  padding: 10px 12px;
  background: #0E131A;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 8px;
}
.qos-input-bar input {
  flex-grow: 1;
  background: #06080E;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
  color: #FFFFFF;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s;
}
.qos-input-bar input:focus { border-color: #DFB843; }
.qos-input-bar button {
  background: linear-gradient(180deg, #FBF3D5 0%, #DFB843 35%, #B88E28 100%);
  border: 1px solid #DFB843;
  border-radius: 6px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #07080B;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 6px rgba(0, 0, 0, 0.35);
  transition: opacity 0.15s, transform 0.15s;
}
.qos-input-bar button:hover { opacity: 0.95; transform: scale(1.04); }
.qos-input-bar button:disabled { opacity: 0.5; cursor: default; transform: none; }
.qos-input-bar button svg { width: 14px; height: 14px; }

.qos-mic-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(223, 184, 67, 0.3);
  border-radius: 6px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #DFB843;
}
.qos-mic-btn:hover {
  background: rgba(223, 184, 67, 0.15);
  border-color: #DFB843;
}
.qos-mic-btn.qos-mic-active {
  background: rgba(244, 63, 94, 0.3) !important;
  border-color: #F43F5E !important;
  animation: qosMicPulse 0.9s infinite alternate;
}
@keyframes qosMicPulse {
  0% { transform: scale(1); box-shadow: 0 0 4px rgba(244, 63, 94, 0.5); }
  100% { transform: scale(1.1); box-shadow: 0 0 14px rgba(244, 63, 94, 0.9); }
}

/* Mobile: full-screen drawer below 480px */
@media (max-width: 480px) {
  #qos-assistant-root { bottom: 16px; right: 16px; }
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
  let isVoiceEnabled = true; // Active by default
  let isOpen = false;
  let isSending = false;
  let hasSpokenWelcome = false;
  let conversationHistory = [];

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

  const FALLBACK_REPLY = 'Aria is active and monitoring telemetry. For dedicated support, please email support@quanterraos.com. All operations adhere strictly to Rule B5 paper execution.';

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
        speakText('Hello! I am Aria, your executive concierge. I am active and ready to communicate with you.');
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
    return escapeHtml(str).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
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
        .replace(/[*_#\x60~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!clean) return;

      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.02;
      utter.pitch = 1.05; // warm feminine tone

      const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(function(v) {
        return (
          v.name.match(/samantha|victoria|karen|zira|jenny|moira|fiona|serena|stephanie|female/i) ||
          v.voiceURI.match(/female|zira|samantha/i)
        ) && v.lang.startsWith('en');
      }) || voices.find(function(v) { return v.lang.startsWith('en'); });

      if (femaleVoice) utter.voice = femaleVoice;
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
      chatInput.placeholder = 'Ask Aria about market calibration, telemetry, or support…';
    };

    recognition.onend = function() {
      isListening = false;
      micBtn.classList.remove('qos-mic-active');
      if (micIcon) micIcon.textContent = '🎙️';
      chatInput.placeholder = 'Ask Aria about market calibration, telemetry, or support…';
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
      avatarImg.src = '/assets/assistant-avatar.jpg';
      avatarImg.alt = 'Aria';
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
      : 'Aria · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    avatarImg.src = '/assets/assistant-avatar.jpg';
    avatarImg.alt = 'Aria';
    avatarImg.className = 'qos-msg-avatar';
    el.appendChild(avatarImg);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'qos-msg-content';

    const b = document.createElement('div');
    b.className = 'qos-msg-bubble';
    b.textContent = 'Aria is analyzing telemetry…';
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
        body: JSON.stringify({ message: trimmed, agentId: 'aria', history: conversationHistory.slice(-10) }),
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
      console.warn('Aria request failed:', err);
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
