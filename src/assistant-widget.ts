/**
 * QuanterraOS Virtual Desk Assistant & Customer Support Widget
 *
 * Implements:
 * 1. Bottom-right floating interactive assistant that pops up and speaks (Text-to-Speech via Web Speech API).
 * 2. Verified contact channels (email only until a live, staffed phone line exists):
 *    - Primary Support: support@quanterraos.com
 *    - Legal & Securities: compliance@quanterraos.com
 * 3. Interactive conversational engine hooked to /api/assistant/chat (Sentinel Operational Watchdog persona).
 * 4. Strict Rule B4 & Rule B5 guardrails: zero unbacked claims, 0.2001 Brier baseline, $0.00 paper safety.
 *
 * Security: user input is rendered with textContent; assistant replies are HTML-escaped
 * before a minimal formatting pass (line breaks and **bold** only). No raw server HTML is injected.
 */

export const ASSISTANT_WIDGET_HTML = `
<!-- QuanterraOS Virtual Desk Assistant Widget -->
<div id="qos-assistant-root">
  <!-- Floating Launcher Bubble (Bottom-Right) -->
  <button id="qos-assistant-bubble" aria-label="Open QuanterraOS Desk Assistant" aria-expanded="false" aria-controls="qos-assistant-drawer" title="QuanterraOS Desk Assistant & Support">
    <div class="qos-bubble-inner">
      <div class="qos-pulse-ring"></div>
      <div class="qos-avatar-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="22"></line>
        </svg>
      </div>
      <span class="qos-bubble-label">Desk Assistant</span>
      <span class="qos-bubble-status" aria-hidden="true">●</span>
    </div>
  </button>

  <!-- Assistant Pop-up Window -->
  <div id="qos-assistant-drawer" class="qos-drawer-hidden" role="dialog" aria-label="Customer Support and Assistant">
    <!-- Header -->
    <div class="qos-drawer-header">
      <div class="qos-header-left">
        <div class="qos-header-avatar">
          <span aria-hidden="true">🛡️</span>
          <span class="qos-avatar-pulse"></span>
        </div>
        <div>
          <div class="qos-header-title">Sentinel Desk Assistant</div>
          <div class="qos-header-sub">AI assistant 24/7 · Human support by email</div>
        </div>
      </div>
      <div class="qos-header-actions">
        <button id="qos-voice-toggle" class="qos-tool-btn" title="Toggle Voice / Read Aloud" aria-pressed="false">
          <span id="qos-voice-icon">🔇 Voice OFF</span>
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
      <!-- Initial greeting (static, trusted markup) -->
      <div class="qos-msg qos-msg-assistant">
        <div class="qos-msg-bubble">
Hello operator. I am <strong>Sentinel</strong>, QuanterraOS's operational watchdog.
<br><br>
I can assist you with live prediction ledger auditing, account clearance, the <strong>$0.00 paper mode (Rule B5)</strong>, or support requests.
<br><br>
For a human response, email <strong>support@quanterraos.com</strong>. How can I assist you today?
        </div>
        <div class="qos-msg-meta">Sentinel · Just now</div>
      </div>
    </div>

    <!-- Quick Question Chips -->
    <div class="qos-quick-chips">
      <button class="qos-chip" data-q="How does the 20-min delayed free tier work?">Delayed free feed?</button>
      <button class="qos-chip" data-q="What is the canonical Brier baseline?">Brier baseline (0.2001)?</button>
      <button class="qos-chip" data-q="Is any real customer money being traded?">Is capital at risk?</button>
      <button class="qos-chip" data-q="How do I contact customer support?">Contact support</button>
      <button class="qos-chip" data-q="How do I subscribe to Pro Terminal ($199/mo)?">Upgrade to Pro?</button>
    </div>

    <!-- Chat Input Area -->
    <form id="qos-chat-form" class="qos-input-bar">
      <input type="text" id="qos-chat-input" placeholder="Ask Sentinel about telemetry, pricing, or support…" autocomplete="off" maxlength="1000" aria-label="Message Sentinel" />
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
  border: 1px solid rgba(223, 184, 67, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(223, 184, 67, 0.2);
  border-radius: 30px;
  padding: 8px 16px 8px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}
#qos-assistant-bubble:hover {
  transform: translateY(-2px);
  border-color: #DFB843;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.7), 0 0 28px rgba(223, 184, 67, 0.35);
}
#qos-assistant-bubble:focus-visible { border-color: #DFB843; }

.qos-bubble-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}
.qos-avatar-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(223, 184, 67, 0.15);
  border: 1px solid rgba(223, 184, 67, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #DFB843;
}
.qos-avatar-icon svg { width: 16px; height: 16px; }
.qos-bubble-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #F8FAFC;
  letter-spacing: -0.01em;
}
.qos-bubble-status {
  color: #DFB843;
  font-size: 0.65rem;
  animation: qosPulse 2s infinite;
}
@keyframes qosPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* Pop-up Drawer Card */
#qos-assistant-drawer {
  width: 380px;
  max-width: calc(100vw - 32px);
  height: 540px;
  max-height: calc(100vh - 100px);
  background: #0A0E14;
  border: 1px solid rgba(223, 184, 67, 0.35);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(223, 184, 67, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: absolute;
  bottom: 60px;
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
  gap: 10px;
}
.qos-header-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(223, 184, 67, 0.15);
  border: 1px solid rgba(223, 184, 67, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  position: relative;
}
.qos-avatar-pulse {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #DFB843;
  box-shadow: 0 0 6px #DFB843;
}
.qos-header-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #FFFFFF;
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
.qos-msg {
  display: flex;
  flex-direction: column;
  max-width: 86%;
}
.qos-msg-assistant { align-self: flex-start; }
.qos-msg-user { align-self: flex-end; }
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
  let isVoiceEnabled = false;
  let isOpen = false;
  let isSending = false;

  const bubble = document.getElementById('qos-assistant-bubble');
  const drawer = document.getElementById('qos-assistant-drawer');
  const closeBtn = document.getElementById('qos-close-btn');
  const voiceToggle = document.getElementById('qos-voice-toggle');
  const voiceIcon = document.getElementById('qos-voice-icon');
  const chatForm = document.getElementById('qos-chat-form');
  const chatInput = document.getElementById('qos-chat-input');
  const sendBtn = document.getElementById('qos-send-btn');
  const messagesContainer = document.getElementById('qos-chat-messages');

  const FALLBACK_REPLY = 'Sentinel is temporarily unavailable. For a human response, email support@quanterraos.com. QuanterraOS operates on $0.00 live funds under the Rule B5 circuit lock.';

  function setOpen(open, focusInput) {
    isOpen = open;
    drawer.classList.toggle('qos-drawer-hidden', !open);
    bubble.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && focusInput) chatInput.focus();
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

  // Escape all HTML, then allow only line breaks and **bold**.
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
      const clean = String(text).replace(/<[^>]*>/g, '').replace(/[*_#]/g, '');
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.05;
      utter.pitch = 0.95;
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
      speakText('Voice output activated. Sentinel will speak responses.');
    } else {
      voiceIcon.textContent = '🔇 Voice OFF';
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  });

  // Append message to UI. User text is never parsed as HTML.
  function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'qos-msg qos-msg-' + (role === 'user' ? 'user' : 'assistant');

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
      : 'Sentinel · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgDiv.appendChild(bubbleDiv);
    msgDiv.appendChild(metaDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if (role === 'assistant') speakText(text);
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'qos-msg qos-msg-assistant qos-msg-typing';
    const b = document.createElement('div');
    b.className = 'qos-msg-bubble';
    b.textContent = 'Sentinel is analyzing telemetry…';
    el.appendChild(b);
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
    chatInput.value = '';

    const typingIndicator = showTyping();

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, agentId: 'sentinel' }),
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
        : 'Operational standby.';
      appendMessage('assistant', reply);
    } catch (err) {
      console.warn('Sentinel request failed:', err);
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

  // Auto-pop greeting after 3 seconds on first visit (desktop only; no input focus,
  // so mobile keyboards are not forced open).
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
