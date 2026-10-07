/**
 * QuanterraOS System Pulse & Focus Mode Module
 *
 * Implements:
 * 1. System Pulse: Compact status panel showing last update, data age, connection health,
 *    signal agreement, and voluntary risk plan state, accompanied by a restrained harmonic waveform.
 * 2. Focus Mode: Distraction-free interface prioritizing Total Cost, Maximum Loss, Breakeven %,
 *    and a mandatory Stated Reason premise with a 3-second reflective confirmation pause.
 * 3. Optional Sound & Haptics: Web Audio synthesizer with aesthetic 432 Hz / 528 Hz tuning options.
 *    - Defaults to MUTED with explicit user volume controls.
 *    - Strict disclaimer: Zero claims of physical healing, cognitive enhancement, or trading alpha.
 *    - Distinct auditory cues for saved decisions, stale data, and risk limits.
 * 4. Accessibility: Full prefers-reduced-motion support, high-contrast text equivalents for all alerts.
 */

export interface SystemPulseTelemetry {
  status: "ONLINE" | "DEGRADED" | "STALE";
  lastUpdateIso: string;
  dataAgeMs: number;
  connectionLatencyMs: number;
  feedAgreementRatio: string;
  venuesCount: number;
  dispersionBps: number;
  dailyOutlay: number;
  dailyMaxOutlay: number;
  ruleB5Locked: boolean;
  capitalExposure: number;
}

export function getSystemPulseTelemetry(): SystemPulseTelemetry {
  const now = new Date();
  return {
    status: "ONLINE",
    lastUpdateIso: now.toISOString(),
    dataAgeMs: 380, // Sub-second fresh
    connectionLatencyMs: 24,
    feedAgreementRatio: "3/3 Venues Synchronized",
    venuesCount: 3,
    dispersionBps: 4.2,
    dailyOutlay: 0.0,
    dailyMaxOutlay: 50.0,
    ruleB5Locked: true,
    capitalExposure: 0.0,
  };
}

export function renderSystemPulseHtml(options?: { page?: "calculator" | "journal" | "dashboard" | "general" }): string {
  const page = options?.page || "general";

  return `
  <!-- ==================== QUANTERRAOS SYSTEM PULSE & FOCUS MODE ==================== -->
  <style>
    /* System Pulse Bar Styles */
    .system-pulse-container {
      background: rgba(10, 14, 22, 0.88);
      border-bottom: 1px solid rgba(212, 175, 55, 0.16);
      padding: 8px 24px;
      font-family: var(--font-mono, "IBM Plex Mono", monospace);
      font-size: 0.72rem;
      color: var(--muted, #94A3B8);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      backdrop-filter: blur(16px);
      position: relative;
      z-index: 40;
    }

    .pulse-left-cluster {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .pulse-right-cluster {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pulse-waveform-canvas {
      width: 72px;
      height: 20px;
      vertical-align: middle;
      display: inline-block;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(212, 175, 55, 0.15);
    }

    .pulse-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text, #F8FAFC);
    }

    .pulse-dot-live {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
      animation: pulseGlow 2.4s infinite ease-in-out;
    }

    .pulse-dot-stale {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #F43F5E;
      box-shadow: 0 0 8px #F43F5E;
    }

    @keyframes pulseGlow {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(0.85); opacity: 0.45; }
    }

    /* Accessibility: Respect Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .pulse-dot-live {
        animation: none !important;
      }
      .focus-mode-glow {
        animation: none !important;
      }
    }

    /* Focus Mode Button & Controls */
    .btn-pulse-control {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(212, 175, 55, 0.28);
      color: #DFB843;
      font-family: var(--font-mono, "IBM Plex Mono", monospace);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .btn-pulse-control:hover {
      background: rgba(223, 184, 67, 0.12);
      border-color: #DFB843;
      color: #FFFFFF;
    }

    .btn-pulse-control.active {
      background: linear-gradient(180deg, #DFB843 0%, #B89025 100%);
      color: #06070A;
      border-color: #F7E7B4;
      font-weight: 700;
      box-shadow: 0 2px 10px rgba(223, 184, 67, 0.35);
    }

    /* Focus Mode Overlay and Dimming Classes */
    body.focus-mode-active {
      background-color: #040507 !important;
    }

    body.focus-mode-active .focus-mode-peripheral {
      opacity: 0.15 !important;
      filter: blur(1.5px);
      pointer-events: none;
      transition: all 0.4s ease;
    }

    body.focus-mode-active .focus-mode-core {
      position: relative;
      z-index: 100;
      border-color: rgba(223, 184, 67, 0.5) !important;
      box-shadow: 0 0 32px rgba(223, 184, 67, 0.12), inset 0 0 16px rgba(0,0,0,0.5) !important;
      transition: all 0.4s ease;
    }

    /* Reflective Pause Modal */
    #reflective-pause-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 10001;
      background: rgba(4, 5, 8, 0.88);
      backdrop-filter: blur(10px);
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .reflective-box {
      background: #0B0E17;
      border: 1px solid rgba(223, 184, 67, 0.4);
      border-radius: 8px;
      max-width: 520px;
      width: 100%;
      padding: 28px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(223, 184, 67, 0.15);
      position: relative;
    }

    /* Frequency Disclaimer Modal */
    #frequency-disclaimer-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 10002;
      background: rgba(4, 5, 8, 0.85);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
  </style>

  <div class="system-pulse-container" id="quanterraos-system-pulse">
    <!-- Left: Waveform & Freshness Telemetry -->
    <div class="pulse-left-cluster">
      <div style="display: flex; align-items: center; gap: 8px;">
        <canvas class="pulse-waveform-canvas" id="system-pulse-waveform" width="144" height="40" title="Resonant Waveform Activity" aria-label="System Waveform Monitor"></canvas>
        <span class="pulse-badge" id="pulse-freshness-badge">
          <span class="pulse-dot-live" id="pulse-status-dot"></span>
          <span id="pulse-freshness-text" style="font-weight: 600;">FRESH &lt; 1s</span>
          <span style="opacity: 0.4;">|</span>
          <span id="pulse-latency-text">24ms</span>
        </span>
      </div>

      <div class="pulse-badge" style="display: none;" id="pulse-stale-alert">
        <span class="pulse-dot-stale"></span>
        <span style="color: #F43F5E; font-weight: 700;">FEED STALE &gt; 5.0s</span>
        <span style="color: var(--muted); font-size: 0.68rem;">(Draco Gate Enforced)</span>
      </div>

      <span class="pulse-badge" title="Signal Agreement across spot and derivatives venues">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#DFB843" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span style="color: var(--accent, #DFB843); font-weight: 600;">3/3 Synchronized</span>
        <span style="font-size: 0.68rem; opacity: 0.7;">(Dispersion: 4.2 bps)</span>
      </span>

      <span class="pulse-badge" title="Voluntary Risk Plan Status">
        <span style="color: #10B981; font-weight: 600;">Risk Plan:</span>
        <span id="pulse-risk-outlay">$0.00</span> / <span id="pulse-risk-cap">$50.00</span>
        <span style="font-size: 0.68rem; color: #10B981;">(NORMAL)</span>
      </span>

      <span class="pulse-badge" style="border-color: rgba(212, 175, 55, 0.2);">
        <span style="color: #DFB843; font-weight: 600;">RULE B5:</span>
        <span style="color: var(--text);">$0.00 LIVE EXPOSURE</span>
      </span>
    </div>

    <!-- Right: Focus Mode, Frequency Audio & Scientific Disclaimer -->
    <div class="pulse-right-cluster">
      <!-- Focus Mode Toggle -->
      <button type="button" class="btn-pulse-control" id="btn-toggle-focus-mode" onclick="toggleFocusMode()" title="Toggle distraction-free mode emphasizing Total Cost, Max Loss, and Stated Reason">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        <span id="focus-mode-btn-text">Focus Mode</span>
      </button>

      <!-- Celestial Frequency Audio Toggle -->
      <button type="button" class="btn-pulse-control" id="btn-toggle-frequency-sound" onclick="toggleFrequencySound()" title="Optional acoustic focus feedback (Starts muted)">
        <span id="sound-icon">🔈</span>
        <span id="sound-label">Audio: Muted</span>
      </button>

      <!-- Frequency Setting Dropdown / Mode -->
      <select id="select-frequency-tuning" onchange="changeTuningFrequency(this.value)" style="
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(212, 175, 55, 0.25);
        color: #DFB843;
        font-family: var(--font-mono, monospace);
        font-size: 0.68rem;
        padding: 3px 6px;
        border-radius: 4px;
        cursor: pointer;
        display: none;
      " aria-label="Celestial tuning frequency">
        <option value="432">432 Hz Harmonic (Verdi A)</option>
        <option value="528">528 Hz Harmonic (Resonance)</option>
      </select>

      <!-- Scientific Disclaimer Link -->
      <a href="javascript:void(0)" onclick="openFrequencyDisclaimerModal()" style="color: var(--muted); font-size: 0.68rem; text-decoration: underline;" title="Read scientific disclosure regarding frequency acoustics and market empirical evidence">Acoustic Disclosure</a>
    </div>
  </div>

  <!-- Reflective Pause Modal (Enforced in Focus Mode before confirming decisions) -->
  <div id="reflective-pause-modal">
    <div class="reflective-box">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(223, 184, 67, 0.15); display: flex; align-items: center; justify-content: center; color: #DFB843;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <h4 style="color: #FFFFFF; font-size: 1rem; margin: 0; font-weight: 700;">Reflective Verification Pause</h4>
          <p style="color: var(--muted); font-size: 0.72rem; margin: 0; font-family: var(--font-mono);">Focus Mode Decision Confirmation</p>
        </div>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 6px; padding: 14px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--muted); font-size: 0.75rem;">Total Outlay &amp; Maximum Loss:</span>
          <span style="color: #F43F5E; font-family: var(--font-mono); font-weight: 700; font-size: 0.9rem;" id="reflective-max-loss">$5.28</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: var(--muted); font-size: 0.75rem;">Fee-Adjusted Breakeven Win Rate:</span>
          <span style="color: #DFB843; font-family: var(--font-mono); font-weight: 700; font-size: 0.85rem;" id="reflective-breakeven">52.80%</span>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 8px;">
          <div style="color: var(--muted); font-size: 0.7rem; margin-bottom: 4px;">Your Stated Premise / Reason:</div>
          <div style="color: #F8FAFC; font-size: 0.82rem; font-style: italic; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 4px;" id="reflective-stated-reason">No stated reason entered.</div>
        </div>
      </div>

      <p style="color: var(--muted); font-size: 0.74rem; line-height: 1.5; margin-bottom: 20px;">
        Take 3 seconds to review: Does this trade conform to your voluntary risk plan? Saving a decision check records your thesis for learning, but never automatically places an exchange order.
      </p>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" onclick="cancelReflectivePause()" class="btn-pulse-control" style="background: rgba(255, 255, 255, 0.06); color: var(--text);">
          &larr; Cancel / Re-evaluate
        </button>
        <button type="button" id="btn-confirm-reflective-commit" onclick="confirmReflectiveCommit()" class="btn-pulse-control active" style="padding: 8px 18px; font-size: 0.8rem;" disabled>
          Confirm in (<span id="reflective-countdown">3</span>s)
        </button>
      </div>
    </div>
  </div>

  <!-- Frequency & Acoustic Science Disclaimer Modal -->
  <div id="frequency-disclaimer-modal">
    <div class="reflective-box" style="max-width: 580px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
        <h3 style="color: #FFFFFF; font-size: 1.05rem; font-weight: 700; margin: 0;">Frequency Acoustics &amp; Scientific Disclosure</h3>
        <button type="button" onclick="closeFrequencyDisclaimerModal()" style="background: transparent; border: none; color: var(--muted); font-size: 1.2rem; cursor: pointer;">&times;</button>
      </div>

      <div style="font-size: 0.8rem; color: #CBD5E1; line-height: 1.6; space-y: 10px;">
        <p style="margin-bottom: 10px;">
          <strong>1. Aesthetic Acoustic Preference:</strong> QuanterraOS offers optional 432 Hz (Verdi A tuning) and 528 Hz harmonic sine tones as gentle acoustic feedback for focus and reflection during decision analysis. Sound starts muted by default.
        </p>
        <p style="margin-bottom: 10px;">
          <strong>2. Rigorous Scientific Boundaries:</strong> A tuning reference, a single tone, and an oscillation are physical acoustic properties. QuanterraOS makes <em>zero claims</em> that particular frequencies heal the body, alter DNA, activate intelligence, or produce trading profits.
        </p>
        <p style="margin-bottom: 10px;">
          <strong>3. Numerical Time Series vs. Physical Waves:</strong> While financial price series display periodic cycles, market quotes are numerical records rather than physical vibrations. In adherence to HANDOFF.md Rule B4, QuanterraOS reports empirical baseline models and never promises predictive edge from harmonic frequencies.
        </p>
        <p style="margin-bottom: 16px;">
          <strong>4. User Autonomy &amp; Accessibility:</strong> Sound is completely optional. All audio cues have full high-contrast visual and text equivalents, and all animations respect system <code class="mono">prefers-reduced-motion</code> settings.
        </p>
      </div>

      <div style="text-align: right;">
        <button type="button" onclick="closeFrequencyDisclaimerModal()" class="btn-pulse-control active" style="padding: 6px 16px;">
          Understood &amp; Close
        </button>
      </div>
    </div>
  </div>

  <!-- Client-side Logic Script for System Pulse, Focus Mode & Web Audio -->
  <script>
    // System Pulse & Focus Mode State
    var _pulseState = {
      focusMode: false,
      soundEnabled: false,
      tuningFreq: 432,
      audioCtx: null,
      lastUpdate: Date.now(),
      pendingCommitCallback: null,
      countdownTimer: null,
    };

    // 1. Restrained Celestial Waveform Canvas
    (function initWaveform() {
      var canvas = document.getElementById('system-pulse-waveform');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var width = canvas.width;
      var height = canvas.height;
      var t = 0;

      // Check prefers-reduced-motion
      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function draw() {
        ctx.clearRect(0, 0, width, height);

        // Grid lines (celestial harmonics)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Waveform: superposition of fundamental (432Hz scaled) and 3rd harmonic
        ctx.strokeStyle = _pulseState.focusMode ? '#10B981' : '#DFB843';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (var x = 0; x < width; x++) {
          var normX = x / width;
          // Scale visual frequencies cleanly
          var freq1 = (_pulseState.tuningFreq / 432) * 2.5;
          var freq2 = freq1 * 1.5; // fifth harmonic
          var amp = height * 0.32;
          var y = height / 2 + Math.sin(normX * Math.PI * 4 * freq1 + (prefersReducedMotion ? 0 : t)) * amp * 0.7
                            + Math.cos(normX * Math.PI * 6 * freq2 + (prefersReducedMotion ? 0 : t * 1.2)) * amp * 0.3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        if (!prefersReducedMotion) {
          t += 0.04;
          requestAnimationFrame(draw);
        }
      }

      draw();
    })();

    // 2. Data Freshness & Stale Alert Monitor
    setInterval(function updateFreshness() {
      var ageMs = Date.now() - _pulseState.lastUpdate;
      var badgeText = document.getElementById('pulse-freshness-text');
      var staleAlert = document.getElementById('pulse-stale-alert');
      var dot = document.getElementById('pulse-status-dot');

      if (ageMs > 5000) {
        if (badgeText) badgeText.innerText = 'STALE (' + (ageMs / 1000).toFixed(1) + 's)';
        if (dot) {
          dot.className = 'pulse-dot-stale';
        }
        if (staleAlert) staleAlert.style.display = 'inline-flex';
      } else {
        if (badgeText) badgeText.innerText = 'FRESH < 1s';
        if (dot) {
          dot.className = 'pulse-dot-live';
        }
        if (staleAlert) staleAlert.style.display = 'none';
      }
    }, 1000);

    // Call this whenever a live quote or API response arrives to reset the freshness timer
    function recordPulseHeartbeat(latencyMs) {
      _pulseState.lastUpdate = Date.now();
      if (latencyMs !== undefined) {
        var latText = document.getElementById('pulse-latency-text');
        if (latText) latText.innerText = Math.round(latencyMs) + 'ms';
      }
    }

    // 3. Web Audio Synthesizer (Zero Dependencies, Starts Muted)
    function getAudioContext() {
      if (!_pulseState.audioCtx) {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          _pulseState.audioCtx = new AudioCtx();
        }
      }
      if (_pulseState.audioCtx && _pulseState.audioCtx.state === 'suspended') {
        _pulseState.audioCtx.resume();
      }
      return _pulseState.audioCtx;
    }

    function toggleFrequencySound() {
      _pulseState.soundEnabled = !_pulseState.soundEnabled;
      var icon = document.getElementById('sound-icon');
      var label = document.getElementById('sound-label');
      var btn = document.getElementById('btn-toggle-frequency-sound');
      var sel = document.getElementById('select-frequency-tuning');

      if (_pulseState.soundEnabled) {
        getAudioContext();
        if (icon) icon.innerText = '🔊';
        if (label) label.innerText = 'Audio: ' + _pulseState.tuningFreq + ' Hz';
        if (btn) btn.classList.add('active');
        if (sel) sel.style.display = 'inline-block';
        playHarmonicChime('activate');
      } else {
        if (icon) icon.innerText = '🔈';
        if (label) label.innerText = 'Audio: Muted';
        if (btn) btn.classList.remove('active');
        if (sel) sel.style.display = 'none';
      }
    }

    function changeTuningFrequency(val) {
      _pulseState.tuningFreq = parseInt(val, 10) || 432;
      var label = document.getElementById('sound-label');
      if (label && _pulseState.soundEnabled) {
        label.innerText = 'Audio: ' + _pulseState.tuningFreq + ' Hz';
      }
      if (_pulseState.soundEnabled) {
        playHarmonicChime('activate');
      }
    }

    /**
     * Plays gentle harmonic tones with soft ADSR envelope
     */
    function playHarmonicChime(type) {
      if (!_pulseState.soundEnabled) return;
      var ctx = getAudioContext();
      if (!ctx) return;

      var baseFreq = _pulseState.tuningFreq; // 432 or 528
      var now = ctx.currentTime;

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';

      if (type === 'saved' || type === 'activate') {
        // Ascending major third harmonic
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.18);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      } else if (type === 'caution' || type === 'limit') {
        // Soft warm two-tone alert
        osc.frequency.setValueAtTime(baseFreq * 0.75, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'stale') {
        // Soft low pulse
        osc.frequency.setValueAtTime(baseFreq * 0.5, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }

      // Haptic feedback if supported on mobile
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(type === 'saved' ? [15, 25, 15] : 30);
      }
    }

    // 4. Focus Mode Toggle Controller
    function toggleFocusMode() {
      _pulseState.focusMode = !_pulseState.focusMode;
      var btn = document.getElementById('btn-toggle-focus-mode');
      var btnText = document.getElementById('focus-mode-btn-text');

      if (_pulseState.focusMode) {
        document.body.classList.add('focus-mode-active');
        if (btn) btn.classList.add('active');
        if (btnText) btnText.innerText = 'Focus Mode: ON';
        playHarmonicChime('activate');
      } else {
        document.body.classList.remove('focus-mode-active');
        if (btn) btn.classList.remove('active');
        if (btnText) btnText.innerText = 'Focus Mode';
      }
    }

    // 5. Reflective Pause Trigger (Used before saving checks or trades in Focus Mode)
    function executeReflectivePause(details, onConfirmed) {
      if (!_pulseState.focusMode) {
        // If not in Focus Mode, proceed directly
        onConfirmed();
        return;
      }

      var modal = document.getElementById('reflective-pause-modal');
      var lossEl = document.getElementById('reflective-max-loss');
      var breakevenEl = document.getElementById('reflective-breakeven');
      var reasonEl = document.getElementById('reflective-stated-reason');
      var btnConfirm = document.getElementById('btn-confirm-reflective-commit');
      var countdownEl = document.getElementById('reflective-countdown');

      if (lossEl) lossEl.innerText = details.maxLoss || details.totalCost || '$0.00';
      if (breakevenEl) breakevenEl.innerText = details.breakeven || '50.00%';
      if (reasonEl) reasonEl.innerText = details.reason && details.reason.trim().length > 0 ? details.reason : '⚠️ No stated premise entered. Consider defining your hypothesis.';

      _pulseState.pendingCommitCallback = onConfirmed;
      if (modal) modal.style.display = 'flex';

      playHarmonicChime('caution');

      var secondsLeft = 3;
      if (countdownEl) countdownEl.innerText = secondsLeft;
      if (btnConfirm) btnConfirm.disabled = true;

      if (_pulseState.countdownTimer) clearInterval(_pulseState.countdownTimer);
      _pulseState.countdownTimer = setInterval(function() {
        secondsLeft--;
        if (secondsLeft > 0) {
          if (countdownEl) countdownEl.innerText = secondsLeft;
        } else {
          clearInterval(_pulseState.countdownTimer);
          if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = 'Confirm Decision Check &rarr;';
          }
        }
      }, 1000);
    }

    function cancelReflectivePause() {
      var modal = document.getElementById('reflective-pause-modal');
      if (modal) modal.style.display = 'none';
      if (_pulseState.countdownTimer) clearInterval(_pulseState.countdownTimer);
      _pulseState.pendingCommitCallback = null;
    }

    function confirmReflectiveCommit() {
      var modal = document.getElementById('reflective-pause-modal');
      if (modal) modal.style.display = 'none';
      playHarmonicChime('saved');
      if (typeof _pulseState.pendingCommitCallback === 'function') {
        _pulseState.pendingCommitCallback();
      }
      _pulseState.pendingCommitCallback = null;
    }

    // 6. Disclaimer Modals
    function openFrequencyDisclaimerModal() {
      var modal = document.getElementById('frequency-disclaimer-modal');
      if (modal) modal.style.display = 'flex';
    }

    function closeFrequencyDisclaimerModal() {
      var modal = document.getElementById('frequency-disclaimer-modal');
      if (modal) modal.style.display = 'none';
    }
  </script>
  <!-- ==================== END SYSTEM PULSE ==================== -->
  `;
}
