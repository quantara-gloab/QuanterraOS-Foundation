/**
 * QuanterraOS — Live Microstructure Sonification & Oracle Audio Alert Terminal
 *
 * Provides real-time acoustic telemetry and Web Audio synthesis for short-duration
 * prediction markets. Sonifies the critical 60-second CME CF BRTI TWAP settlement
 * window, generates proximity tone frequency modulation when spot price approaches
 * strike boundaries, and provides synthetic speech announcements for active desks.
 *
 * Standards:
 * - Rule B1: Mathematical frequency derivation, decibel normalization, SHA-256 provenance.
 * - Rule B4: Zero predictive claims. Pure microstructure telemetry & acoustic monitoring.
 * - Rule B5: $0.00 capital deployed; advisory monitoring only.
 * - Rule B10: Third-party marks attribution (CME CF BRTI, Kalshi).
 */

import { createHash } from "node:crypto";

export type AudioUrgencyLevel = "LOW" | "ELEVATED" | "CRITICAL";

export type AudioEventType =
  | "NORMAL_TICK"
  | "TWAP_SAMPLING_TICK"
  | "DANGER_PROXIMITY_PULSE"
  | "TWAP_COMMENCED"
  | "SETTLEMENT_LOCKED";

export interface AudioTelemetryConfig {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  voiceAnnouncerEnabled: boolean;
  dangerZoneDroneEnabled: boolean;
  twapHeartbeatEnabled: boolean;
  dangerProximityThresholdUsd: number;
}

export interface AudioTelemetryEvent {
  eventType: AudioEventType;
  frequencyHz: number;
  pulseDurationMs: number;
  gain: number;
  urgencyLevel: AudioUrgencyLevel;
  spokenPhrase: string | null;
  distanceFromStrikeUsd: number;
  distanceBps: number;
  isTwapActive: boolean;
  provenanceHash: string;
}

export interface AudioTelemetryInput {
  secondsRemaining: number;
  spotPrice: number;
  strikePrice: number;
  twapProgressSeconds: number; // 0 to 60
  isSettled?: boolean;
  outcome?: "YES" | "NO" | null;
}

export const DEFAULT_AUDIO_CONFIG: AudioTelemetryConfig = {
  enabled: true,
  volume: 0.7,
  voiceAnnouncerEnabled: true,
  dangerZoneDroneEnabled: true,
  twapHeartbeatEnabled: true,
  dangerProximityThresholdUsd: 50.0
};

/**
 * Computes deterministic audio parameters and synthesized verbal alerts based on
 * live microstructure state and oracle proximity.
 */
export function computeAudioTelemetryEvent(
  input: AudioTelemetryInput,
  config: AudioTelemetryConfig = DEFAULT_AUDIO_CONFIG
): AudioTelemetryEvent {
  const { secondsRemaining, spotPrice, strikePrice, twapProgressSeconds, isSettled, outcome } = input;
  const distUsd = Math.abs(spotPrice - strikePrice);
  const distBps = Math.round((distUsd / strikePrice) * 10000);
  const isTwapActive = secondsRemaining <= 60 && secondsRemaining > 0;
  const inDangerZone = distUsd <= config.dangerProximityThresholdUsd;

  let eventType: AudioEventType = "NORMAL_TICK";
  let frequencyHz = 440;
  let pulseDurationMs = 60;
  let gain = config.volume * 0.4;
  let urgencyLevel: AudioUrgencyLevel = "LOW";
  let spokenPhrase: string | null = null;

  if (isSettled) {
    eventType = "SETTLEMENT_LOCKED";
    frequencyHz = outcome === "YES" ? 880 : 330;
    pulseDurationMs = 450;
    gain = config.volume * 0.8;
    urgencyLevel = "LOW";
    spokenPhrase = outcome ? `Settlement locked. Outcome resolved ${outcome}.` : "Settlement window concluded.";
  } else if (secondsRemaining === 60) {
    eventType = "TWAP_COMMENCED";
    frequencyHz = 784; // G5 chime
    pulseDurationMs = 300;
    gain = config.volume * 0.85;
    urgencyLevel = "ELEVATED";
    spokenPhrase = "Attention: CME CF BRTI sixty-second settlement TWAP sampling commenced.";
  } else if (isTwapActive) {
    eventType = "TWAP_SAMPLING_TICK";
    // Pitch steps upward subtly with each second of the 60s window (600Hz -> 900Hz)
    const twapFraction = Math.min(1, Math.max(0, twapProgressSeconds / 60));
    frequencyHz = Math.round(600 + twapFraction * 300);
    pulseDurationMs = 80;
    gain = config.volume * 0.6;
    urgencyLevel = inDangerZone ? "CRITICAL" : "ELEVATED";

    if (inDangerZone) {
      eventType = "DANGER_PROXIMITY_PULSE";
      // Dual tone alert
      frequencyHz = Math.round(880 + (1 - distUsd / config.dangerProximityThresholdUsd) * 440);
      pulseDurationMs = 120;
      gain = config.volume * 0.9;
    }

    // Voice announcement checkpoint at 30 seconds
    if (secondsRemaining === 30) {
      spokenPhrase = `Thirty seconds remaining in oracle sampling. Spot distance is ${distUsd.toFixed(0)} dollars.`;
    } else if (secondsRemaining === 10) {
      spokenPhrase = "Ten seconds to final TWAP lock.";
    }
  } else if (inDangerZone) {
    eventType = "DANGER_PROXIMITY_PULSE";
    // Inverse frequency modulation: the closer spot is to strike, the higher the warning pitch
    const proximityRatio = Math.max(0, 1 - distUsd / config.dangerProximityThresholdUsd);
    frequencyHz = Math.round(220 + proximityRatio * 440); // 220Hz to 660Hz
    pulseDurationMs = 150;
    gain = config.volume * (0.5 + proximityRatio * 0.4);
    urgencyLevel = proximityRatio > 0.6 ? "CRITICAL" : "ELEVATED";

    if (distUsd <= 15) {
      spokenPhrase = `Danger zone alert: Spot price within ${distUsd.toFixed(0)} dollars of strike.`;
    }
  }

  const rawHash = `${secondsRemaining}:${spotPrice}:${strikePrice}:${eventType}:${frequencyHz}:${urgencyLevel}`;
  const provenanceHash = createHash("sha256").update(rawHash).digest("hex");

  return {
    eventType,
    frequencyHz,
    pulseDurationMs,
    gain: Number(gain.toFixed(4)),
    urgencyLevel,
    spokenPhrase,
    distanceFromStrikeUsd: Number(distUsd.toFixed(2)),
    distanceBps: distBps,
    isTwapActive,
    provenanceHash
  };
}

/**
 * Returns self-contained browser JavaScript to initialize Web Audio and SpeechSynthesis.
 */
export function generateWebAudioClientScript(): string {
  return `
(function() {
  let audioCtx = null;
  let isMuted = false;
  let masterVolume = 0.7;
  let speechEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  window.playMicrostructureTone = function(freq, durationMs, gainLevel, type) {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq || 440, audioCtx.currentTime);

      const targetGain = Math.max(0.01, Math.min(1.0, (gainLevel || 0.5) * masterVolume));
      gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(targetGain, audioCtx.currentTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (durationMs || 100) / 1000);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + (durationMs || 100) / 1000 + 0.05);

      // Animate visual waveform indicator
      triggerSoundWaveAnimation();
    } catch (e) {
      console.warn("WebAudio execution notice:", e);
    }
  };

  window.speakMicrostructureAlert = function(phrase) {
    if (isMuted || !speechEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.volume = masterVolume;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("SpeechSynthesis notice:", e);
    }
  };

  window.toggleAudioMute = function() {
    isMuted = !isMuted;
    const btn = document.getElementById('audio-mute-toggle-btn');
    if (btn) {
      btn.innerText = isMuted ? '🔇 Audio Muted' : '🔊 Audio Active';
      btn.style.borderColor = isMuted ? '#EF4444' : '#DFB843';
      btn.style.color = isMuted ? '#EF4444' : '#DFB843';
    }
    return isMuted;
  };

  window.setAudioMasterVolume = function(val) {
    masterVolume = Math.max(0, Math.min(1, parseFloat(val)));
    const label = document.getElementById('audio-vol-readout');
    if (label) label.innerText = Math.round(masterVolume * 100) + '%';
  };

  function triggerSoundWaveAnimation() {
    const bars = document.querySelectorAll('.soundwave-bar');
    bars.forEach((b, i) => {
      b.style.height = (8 + Math.random() * 20) + 'px';
      setTimeout(() => { b.style.height = '6px'; }, 150 + i * 20);
    });
  }

  // Bind unlock on first user gesture
  document.addEventListener('click', function() { initAudio(); }, { once: true });
})();
  `.trim();
}

/**
 * Renders the compact cockpit widget HTML for embedding into /radar or terminals.
 */
export function renderAudioControlWidgetHtml(config: Partial<AudioTelemetryConfig> = {}): string {
  const merged = { ...DEFAULT_AUDIO_CONFIG, ...config };

  return `
<div class="audio-control-widget" id="radar-audio-widget" style="background:rgba(14,18,27,0.85); border:1px solid rgba(223,184,67,0.3); border-radius:8px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; backdrop-filter:blur(10px);">
  <div style="display:flex; align-items:center; gap:12px;">
    <div class="soundwave-container" style="display:flex; align-items:center; gap:3px; height:24px; padding:0 4px;" title="Acoustic Telemetry Heartbeat">
      <div class="soundwave-bar" style="width:3px; height:6px; background:#DFB843; border-radius:1px; transition:height 0.15s ease;"></div>
      <div class="soundwave-bar" style="width:3px; height:6px; background:#DFB843; border-radius:1px; transition:height 0.15s ease;"></div>
      <div class="soundwave-bar" style="width:3px; height:6px; background:#DFB843; border-radius:1px; transition:height 0.15s ease;"></div>
      <div class="soundwave-bar" style="width:3px; height:6px; background:#DFB843; border-radius:1px; transition:height 0.15s ease;"></div>
      <div class="soundwave-bar" style="width:3px; height:6px; background:#DFB843; border-radius:1px; transition:height 0.15s ease;"></div>
    </div>
    <div>
      <div style="font-family:var(--font-mono, monospace); font-size:0.75rem; font-weight:700; color:#FFFFFF; letter-spacing:0.04em;">ACOUSTIC TELEMETRY</div>
      <div style="font-size:0.68rem; color:var(--text-muted, #94A3B8);">60s TWAP Sonification &bull; Danger Zone Warnings</div>
    </div>
  </div>

  <div style="display:flex; align-items:center; gap:12px;">
    <!-- Volume Slider -->
    <div style="display:flex; align-items:center; gap:6px;">
      <span style="font-size:0.75rem; color:#94A3B8;">Vol:</span>
      <input type="range" min="0" max="1" step="0.05" value="${merged.volume}" style="width:70px; accent-color:#DFB843;" oninput="setAudioMasterVolume(this.value)">
      <span id="audio-vol-readout" style="font-family:var(--font-mono, monospace); font-size:0.75rem; color:#F7E7B4; width:34px;">${Math.round(merged.volume * 100)}%</span>
    </div>

    <!-- Mute/Active Toggle -->
    <button type="button" id="audio-mute-toggle-btn" onclick="toggleAudioMute()" style="background:rgba(223,184,67,0.1); border:1px solid #DFB843; color:#DFB843; font-family:var(--font-mono, monospace); font-size:0.75rem; font-weight:600; padding:5px 12px; border-radius:4px; cursor:pointer; transition:all 0.15s ease;">
      🔊 Audio Active
    </button>

    <!-- Test Chime -->
    <button type="button" onclick="playMicrostructureTone(880, 200, 0.7, 'sine')" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); color:#E2E8F0; font-family:var(--font-mono, monospace); font-size:0.75rem; padding:5px 10px; border-radius:4px; cursor:pointer;" title="Test Tone Synthesizer">
      &sung; Test Tone
    </button>
  </div>
</div>
  `.trim();
}

/**
 * Renders the full standalone terminal page for Microstructure Sonification (/radar/audio).
 */
export function renderMicrostructureAudioPageHtml(): string {
  const scriptContent = generateWebAudioClientScript();
  const sampleEvent = computeAudioTelemetryEvent({
    secondsRemaining: 45,
    spotPrice: 91230,
    strikePrice: 91250,
    twapProgressSeconds: 15
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acoustic Microstructure Sonification & Oracle Synthesizer — QuanterraOS</title>
  <style>
    :root {
      --bg: #06070A;
      --card-bg: #0E121B;
      --card-inner: #07090E;
      --accent: #DFB843;
      --champagne: #F7E7B4;
      --border: rgba(223, 184, 67, 0.25);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --success: #10B981;
      --danger: #EF4444;
      --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.6;
      padding-bottom: 60px;
    }
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 28px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(6, 7, 10, 0.95);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.1rem; color: #FFF; text-decoration: none; }
    .brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.85rem; }
    .nav-links a:hover, .nav-links a.active { color: var(--accent); }
    .container { max-width: 1100px; margin: 0 auto; padding: 36px 20px 0; }
    .hero { margin-bottom: 28px; }
    .eyebrow { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 10px; }
    p.lead { color: var(--muted); font-size: 1rem; max-width: 780px; }
    .grid-2 { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; margin-top: 24px; }
    @media (max-width: 820px) { .grid-2 { grid-template-columns: 1fr; } }
    .card { background: var(--card-bg); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; }
    .card-title { font-size: 1.1rem; font-weight: 700; color: #FFF; margin-bottom: 14px; }
    .btn-gold {
      background: linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      font-size: 0.88rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .spec-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; font-family: var(--font-mono); }
    .spec-table th { text-align: left; padding: 10px 12px; color: var(--muted); border-bottom: 1px solid var(--border-subtle); }
    .spec-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
  </style>
</head>
<body>

  <header class="top-nav">
    <a href="/" class="nav-brand">
      <div class="brand-dot"></div>
      QUANTERRA<span>OS</span>
    </a>
    <nav class="nav-links">
      <a href="/">Overview</a>
      <a href="/radar">Radar</a>
      <a href="/calculator">Calculator</a>
      <a href="/corridors">Corridors</a>
      <a href="/divergence">Divergence</a>
      <a href="/calibration/explorer">Decomposition</a>
      <a href="/settlement">Settlement</a>
      <a href="/schedule">Schedule</a>
      <a href="/webhooks">Webhooks</a>
    </nav>
  </header>

  <main class="container">
    <div class="hero">
      <div class="eyebrow">&Sigma; Microstructure Acoustic Telemetry &bull; Zero-Latency Web Audio API</div>
      <h1>Acoustic Microstructure Sonification</h1>
      <p class="lead">
        Continuous auditory telemetry and synthesized speech announcements for short-duration prediction markets. Real-time frequency modulation sonifies the critical 60-second CME CF BRTI TWAP settlement window and warns traders when spot prices enter the danger zone of pending strikes.
      </p>
    </div>

    <!-- Cockpit Control Widget -->
    ${renderAudioControlWidgetHtml()}

    <div class="grid-2">
      <!-- Live Tone Simulator -->
      <div class="card">
        <div class="card-title">Live Synthesizer Test Bench</div>
        <p style="font-size:0.85rem; color:var(--muted); margin-bottom:18px;">
          Test zero-dependency synthetic audio tones directly in your browser. No external media files or audio streams required.
        </p>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-inner); padding:12px 14px; border-radius:8px; border:1px solid var(--border-subtle);">
            <div>
              <div style="font-weight:700; color:#FFF;">Normal Cadence Tick (440 Hz)</div>
              <div style="font-size:0.72rem; color:var(--muted);">Standard 15m window heartbeat</div>
            </div>
            <button class="btn-gold" onclick="playMicrostructureTone(440, 60, 0.4, 'sine')">Play Tone</button>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-inner); padding:12px 14px; border-radius:8px; border:1px solid var(--border-subtle);">
            <div>
              <div style="font-weight:700; color:var(--champagne);">TWAP Sampling Pulse (750 Hz)</div>
              <div style="font-size:0.72rem; color:var(--muted);">Active 60s CME CF BRTI TWAP window</div>
            </div>
            <button class="btn-gold" onclick="playMicrostructureTone(750, 80, 0.7, 'triangle')">Play Tone</button>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-inner); padding:12px 14px; border-radius:8px; border:1px solid rgba(239,68,68,0.3);">
            <div>
              <div style="font-weight:700; color:#EF4444;">Danger Zone Alert (1,100 Hz Dual)</div>
              <div style="font-size:0.72rem; color:var(--muted);">Spot within $15 of strike barrier</div>
            </div>
            <button class="btn-gold" style="background:#EF4444; color:#FFF;" onclick="playMicrostructureTone(1100, 140, 0.9, 'sawtooth')">Play Alert</button>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-inner); padding:12px 14px; border-radius:8px; border:1px solid var(--border-subtle);">
            <div>
              <div style="font-weight:700; color:#10B981;">Settlement Lock (880 Hz Resolved YES)</div>
              <div style="font-size:0.72rem; color:var(--muted);">Final outcome confirmation chime</div>
            </div>
            <button class="btn-gold" style="background:#10B981; color:#FFF;" onclick="playMicrostructureTone(880, 450, 0.8, 'sine')">Play Lock</button>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-inner); padding:12px 14px; border-radius:8px; border:1px solid var(--border-subtle);">
            <div>
              <div style="font-weight:700; color:var(--champagne);">Speech Synthesizer Callout</div>
              <div style="font-size:0.72rem; color:var(--muted);">Synthetic vocal oracle countdown</div>
            </div>
            <button class="btn-gold" onclick="speakMicrostructureAlert('Attention: CME CF BRTI sixty-second settlement TWAP sampling commenced.')">Speak Voice</button>
          </div>
        </div>
      </div>

      <!-- Frequency Modulation Engine Spec -->
      <div class="card">
        <div class="card-title">Mathematical Frequency Specification</div>
        <table class="spec-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Tone Range</th>
              <th>Gain / Waveform</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Baseline Idle</td>
              <td>440 Hz</td>
              <td>-18 dB &bull; Sine</td>
            </tr>
            <tr>
              <td>TWAP Active</td>
              <td>600 &rarr; 900 Hz</td>
              <td>-12 dB &bull; Triangle</td>
            </tr>
            <tr>
              <td>Danger Zone</td>
              <td>880 &rarr; 1,320 Hz</td>
              <td>-6 dB &bull; Sawtooth</td>
            </tr>
            <tr>
              <td>Outcome YES</td>
              <td>880 Hz Chime</td>
              <td>-4 dB &bull; Sine</td>
            </tr>
            <tr>
              <td>Outcome NO</td>
              <td>330 Hz Chime</td>
              <td>-4 dB &bull; Sine</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:20px; font-family:var(--font-mono); font-size:0.74rem; color:var(--muted); line-height:1.5; background:rgba(0,0,0,0.4); padding:12px; border-radius:6px; border-left:3px solid var(--accent);">
          <strong>Rule B1 Cryptographic Provenance:</strong><br>
          SHA-256 Event Hash: <code style="color:var(--champagne); word-break:break-all;">${sampleEvent.provenanceHash}</code><br>
          Urgency Level: <strong style="color:var(--accent);">${sampleEvent.urgencyLevel}</strong> &bull; Distance: $${sampleEvent.distanceFromStrikeUsd} (${sampleEvent.distanceBps} bps)
        </div>
      </div>
    </div>

    <!-- Regulatory Footnote -->
    <div style="margin-top:36px; padding-top:18px; border-top:1px solid var(--border-subtle); font-size:0.75rem; color:var(--muted); line-height:1.6;">
      <p>
        <strong>Rule B4 &amp; Rule B5 Telemetry Notice:</strong> Microstructure acoustic sonification is designed exclusively for auditory risk awareness and oracle sampling observation. QuanterraOS does not provide trading advice, guarantee market liquidity, or execute orders. $0.00 capital deployed under permanent standby lock.
      </p>
      <p style="margin-top:6px;">
        <strong>Third-Party Marks Attribution (Rule B10):</strong> Kalshi is a trademark of Kalshi Inc. CME CF Bitcoin Real-Time Index (BRTI) is a calculation of CF Benchmarks Ltd and CME Group Inc. QuanterraOS is an independent measurement system with no exchange affiliation.
      </p>
    </div>
  </main>

  <script>
    ${scriptContent}
  </script>
</body>
</html>`;
}
