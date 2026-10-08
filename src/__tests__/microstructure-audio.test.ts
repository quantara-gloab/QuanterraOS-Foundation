import { describe, it } from "node:test";
import assert from "node:assert";
import {
  computeAudioTelemetryEvent,
  generateWebAudioClientScript,
  renderAudioControlWidgetHtml,
  renderMicrostructureAudioPageHtml,
  DEFAULT_AUDIO_CONFIG
} from "../microstructure-audio.ts";

describe("Live Microstructure Sonification & Web Audio Synthesizer Engine", () => {
  it("1. Baseline State: produces standard 440 Hz cadence tick when unthreatened", () => {
    const event = computeAudioTelemetryEvent({
      secondsRemaining: 300,
      spotPrice: 91500,
      strikePrice: 91250,
      twapProgressSeconds: 0
    });

    assert.strictEqual(event.eventType, "NORMAL_TICK");
    assert.strictEqual(event.frequencyHz, 440);
    assert.strictEqual(event.urgencyLevel, "LOW");
    assert.strictEqual(event.isTwapActive, false);
    assert.strictEqual(event.distanceFromStrikeUsd, 250);
    assert.ok(event.provenanceHash.length === 64, "Provenance hash must be a 64-char SHA-256 hex string");
  });

  it("2. Danger Zone Alert: elevates frequency and triggers voice callout when spot approaches strike", () => {
    const event = computeAudioTelemetryEvent({
      secondsRemaining: 180,
      spotPrice: 91262,
      strikePrice: 91250, // $12 distance <= $50 threshold and <= $15 voice trigger
      twapProgressSeconds: 0
    });

    assert.strictEqual(event.eventType, "DANGER_PROXIMITY_PULSE");
    assert.ok(event.frequencyHz > 440, `Frequency should exceed 440Hz, got ${event.frequencyHz}`);
    assert.ok(event.urgencyLevel === "CRITICAL" || event.urgencyLevel === "ELEVATED");
    assert.ok(event.spokenPhrase !== null, "Should produce spoken danger phrase when within $15");
    assert.ok(event.spokenPhrase.includes("Danger zone alert"), `Spoken phrase should contain danger alert: ${event.spokenPhrase}`);
  });

  it("3. TWAP Oracle Sampling: modulates upward frequency progression across 60 seconds", () => {
    const startEvent = computeAudioTelemetryEvent({
      secondsRemaining: 60,
      spotPrice: 91400,
      strikePrice: 91250,
      twapProgressSeconds: 0
    });
    assert.strictEqual(startEvent.eventType, "TWAP_COMMENCED");
    assert.strictEqual(startEvent.frequencyHz, 784);
    assert.ok(startEvent.spokenPhrase?.includes("TWAP sampling commenced"));

    const midEvent = computeAudioTelemetryEvent({
      secondsRemaining: 30,
      spotPrice: 91400,
      strikePrice: 91250,
      twapProgressSeconds: 30
    });
    assert.strictEqual(midEvent.eventType, "TWAP_SAMPLING_TICK");
    assert.strictEqual(midEvent.isTwapActive, true);
    // At 30/60 fraction, 600 + 0.5 * 300 = 750Hz
    assert.strictEqual(midEvent.frequencyHz, 750);
    assert.ok(midEvent.spokenPhrase?.includes("Thirty seconds remaining"));

    const endEvent = computeAudioTelemetryEvent({
      secondsRemaining: 5,
      spotPrice: 91400,
      strikePrice: 91250,
      twapProgressSeconds: 55
    });
    assert.ok(endEvent.frequencyHz >= 870, `Final seconds frequency should approach 900Hz, got ${endEvent.frequencyHz}`);
  });

  it("4. Settlement Resolution: sounds distinctive outcome chimes for YES vs NO", () => {
    const yesEvent = computeAudioTelemetryEvent({
      secondsRemaining: 0,
      spotPrice: 91300,
      strikePrice: 91250,
      twapProgressSeconds: 60,
      isSettled: true,
      outcome: "YES"
    });
    assert.strictEqual(yesEvent.eventType, "SETTLEMENT_LOCKED");
    assert.strictEqual(yesEvent.frequencyHz, 880);
    assert.ok(yesEvent.spokenPhrase?.includes("resolved YES"));

    const noEvent = computeAudioTelemetryEvent({
      secondsRemaining: 0,
      spotPrice: 91200,
      strikePrice: 91250,
      twapProgressSeconds: 60,
      isSettled: true,
      outcome: "NO"
    });
    assert.strictEqual(noEvent.eventType, "SETTLEMENT_LOCKED");
    assert.strictEqual(noEvent.frequencyHz, 330);
    assert.ok(noEvent.spokenPhrase?.includes("resolved NO"));
  });

  it("5. Client Script & Cockpit Widget: generates zero-dependency Web Audio code and HTML", () => {
    const script = generateWebAudioClientScript();
    assert.ok(script.includes("AudioContext"), "Script must reference Web Audio AudioContext");
    assert.ok(script.includes("speechSynthesis"), "Script must reference browser speechSynthesis");
    assert.ok(script.includes("playMicrostructureTone"), "Script must export tone synthesizer");
    assert.ok(script.includes("toggleAudioMute"), "Script must export mute toggle function");

    const widgetHtml = renderAudioControlWidgetHtml({ volume: 0.8 });
    assert.ok(widgetHtml.includes("soundwave-bar"), "Widget must include animated soundwave bars");
    assert.ok(widgetHtml.includes("audio-vol-readout"), "Widget must include volume readout element");
    assert.ok(widgetHtml.includes("80%"), "Widget should reflect 80% volume");
  });

  it("6. Full Terminal HTML & Compliance: strictly conforms to Rule B4, Rule B5, and Rule B10", () => {
    const html = renderMicrostructureAudioPageHtml();
    assert.ok(html.includes("Acoustic Microstructure Sonification"), "HTML must render page title");
    assert.ok(html.includes("CME CF BRTI"), "HTML must mention CME CF BRTI index standard");

    // Rule B5 check: Zero live capital deployed
    assert.ok(html.includes("$0.00 capital deployed"), "Must declare $0.00 capital deployed per Rule B5");
    assert.ok(html.includes("standby lock"), "Must state standby lock per Rule B5");

    // Rule B10 check: Third-party marks attribution
    assert.ok(html.includes("CF Benchmarks Ltd"), "Must attribute CF Benchmarks per Rule B10");
    assert.ok(html.includes("Kalshi is a trademark"), "Must attribute Kalshi per Rule B10");

    // Rule B4 check: Strictly ban hype and predictive language
    const bannedPatterns = [
      /\balpha\b/i,
      /\bbeat the market\b/i,
      /\bguaranteed\b/i,
      /\barbitrage\b/i,
      /\bmispriced opportunities\b/i
    ];
    for (const pattern of bannedPatterns) {
      assert.strictEqual(
        pattern.test(html),
        false,
        `Page HTML violates Rule B4 with banned pattern: ${pattern}`
      );
    }
  });
});
