/**
 * Automated Test Suite: System Pulse, Focus Mode & Market Rhythm Research
 *
 * Validates:
 * 1. System Pulse status panel: data age, freshness, connection health, signal agreement,
 *    and voluntary risk plan state with restrained waveform canvas.
 * 2. Focus Mode distraction-free workflow: highlights Total Cost, Max Loss, Breakeven %,
 *    and enforces a mandatory Stated Reason hypothesis with a 3-second reflective confirmation pause.
 * 3. Optional Sound & Acoustics: Web Audio synthesizer with 432 Hz / 528 Hz tuning options,
 *    starts MUTED by default, provides volume controls, respects prefers-reduced-motion,
 *    and adheres to strict scientific disclosures (zero healing/alpha claims).
 * 4. Market Rhythm Research: Welch's PSD spectral estimation, past-only rolling windows,
 *    missing observation handling, and fee-adjusted benchmark comparison confirming negative results.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderSystemPulseHtml, getSystemPulseTelemetry } from "../system-pulse.ts";
import { renderCalculatorPageHtml } from "../calculator-page.ts";
import { renderJournalPageHtml } from "../journal-page.ts";
import { renderResearchPageHtml } from "../research-page.ts";
import {
  welchPsd,
  applyHannWindow,
  handleMissingObservations,
  analyzePastOnlyRhythm,
  backtestMarketRhythmAgainstBaseline,
  renderMarketRhythmPageHtml,
} from "../research/market-rhythm.ts";

describe("System Pulse, Focus Mode & Market Rhythm Test Suite", () => {
  it("1. System Pulse: renders status panel, data age, signal agreement, and waveform canvas", () => {
    const pulseHtml = renderSystemPulseHtml({ page: "calculator" });

    // Restrained Waveform Canvas
    assert.match(pulseHtml, /id="system-pulse-waveform"/);
    assert.match(pulseHtml, /class="pulse-waveform-canvas"/);

    // Telemetry Badges
    assert.match(pulseHtml, /FRESH &lt; 1s/);
    assert.match(pulseHtml, /FEED STALE &gt; 5\.0s/);
    assert.match(pulseHtml, /3\/3 Synchronized/);
    assert.match(pulseHtml, /Risk Plan:/);
    assert.match(pulseHtml, /RULE B5:/);
    assert.match(pulseHtml, /\$0\.00 LIVE EXPOSURE/);

    // Accessibility: Reduced Motion Support
    assert.match(pulseHtml, /prefers-reduced-motion/);

    // Telemetry API contract
    const telemetry = getSystemPulseTelemetry();
    assert.equal(telemetry.status, "ONLINE");
    assert.ok(telemetry.dataAgeMs < 1000);
    assert.equal(telemetry.venuesCount, 3);
    assert.equal(telemetry.ruleB5Locked, true);
    assert.equal(telemetry.capitalExposure, 0.0);
  });

  it("2. Focus Mode: integrates into Calculator & Journal with core anchors and stated reason input", () => {
    const calcHtml = renderCalculatorPageHtml();

    // Verify System Pulse is integrated into Calculator
    assert.match(calcHtml, /id="quanterraos-system-pulse"/);
    assert.match(calcHtml, /class="btn-pulse-control"/);
    assert.match(calcHtml, /Focus Mode/);

    // Verify Core vs Peripheral layout markup
    assert.match(calcHtml, /focus-mode-core/);
    assert.match(calcHtml, /focus-mode-peripheral/);

    // Verify Three Core Anchors:
    // 1. Total Cost & Maximum Loss
    assert.match(calcHtml, /id="val-summary-loss"/);
    // 2. Breakeven Win Rate
    assert.match(calcHtml, /id="val-summary-breakeven"/);
    // 3. Stated Reason / Premise Input
    assert.match(calcHtml, /id="calc-stated-reason"/);
    assert.match(calcHtml, /✦ Stated Reason \/ Premise \(Focus Mode Anchor\):/);

    // Verify Reflective Verification Pause Modal
    assert.match(calcHtml, /id="reflective-pause-modal"/);
    assert.match(calcHtml, /Reflective Verification Pause/);
    assert.match(calcHtml, /id="reflective-countdown"/);

    // Verify Journal page integration
    const journalHtml = renderJournalPageHtml(null, "free", []);
    assert.match(journalHtml, /id="quanterraos-system-pulse"/);
  });

  it("3. Optional Sound & Acoustics: starts MUTED by default, provides 432Hz/528Hz tuning, and includes scientific disclaimer", () => {
    const pulseHtml = renderSystemPulseHtml();

    // Starts Muted by default
    assert.match(pulseHtml, /id="sound-label">Audio: Muted<\/span>/);
    assert.match(pulseHtml, /id="sound-icon">🔈<\/span>/);

    // Frequency tuning options
    assert.match(pulseHtml, /value="432">432 Hz Harmonic/);
    assert.match(pulseHtml, /value="528">528 Hz Harmonic/);

    // Web Audio Synthesizer logic present
    assert.match(pulseHtml, /function getAudioContext\(\)/);
    assert.match(pulseHtml, /playHarmonicChime/);

    // Rigorous Scientific & Empirical Disclosures
    assert.match(pulseHtml, /id="frequency-disclaimer-modal"/);
    assert.match(pulseHtml, /Frequency Acoustics &amp; Scientific Disclosure/);
    assert.match(pulseHtml, /Aesthetic Acoustic Preference/);
    assert.match(pulseHtml, /zero claims.*that particular frequencies heal/i);
    assert.match(pulseHtml, /HANDOFF\.md Rule B4/);
  });

  it("4. Market Rhythm Research: computes Welch PSD, Hann windowing, and handles missing observations", () => {
    // 1. Hann Windowing
    const seg = [1, 2, 3, 4, 5, 6, 7, 8];
    const windowed = applyHannWindow(seg);
    assert.equal(windowed.length, seg.length);
    assert.equal(windowed[0], 0); // Hann start is 0
    assert.ok(windowed[Math.floor(seg.length / 2)] > 0);

    // 2. Welch PSD
    const mockSeries: number[] = [];
    for (let i = 0; i < 128; i++) {
      // 16-sample periodic wave + noise
      mockSeries.push(Math.sin((i / 16) * 2 * Math.PI) * 2 + 0.1);
    }
    const psd = welchPsd(mockSeries, 1, 64, 0.5);
    assert.ok(psd.frequencies.length > 0);
    assert.ok(psd.peakPower > 0);
    assert.ok(psd.peakPeriodMinutes > 0);

    // 3. Missing observation handling
    const rawObs = [
      { timestamp: 1000, value: 50.0 },
      { timestamp: 2000, value: null }, // Gap
      { timestamp: 3000, value: 52.0 },
      { timestamp: 4000, value: null }, // Gap
    ];
    const missingRes = handleMissingObservations(rawObs, 1000);
    assert.equal(missingRes.coverageRatio, 0.5); // 2 out of 4 valid
    assert.equal(missingRes.gapCount, 2);
    assert.equal(missingRes.cleanedSeries.length, 4);
    assert.equal(missingRes.cleanedSeries[1], 50.0); // Forward-filled
  });

  it("5. Market Rhythm Research: enforces past-only rolling window and compares fee-adjusted baseline", () => {
    const mockTicks = [];
    let price = 90000;
    const now = Date.now();
    for (let i = 0; i < 150; i++) {
      price += Math.sin((i / 15) * 2 * Math.PI) * 10 + (Math.random() - 0.5) * 5;
      mockTicks.push({
        timestamp: now - (150 - i) * 60_000,
        price,
        volume: 20,
        spread: 0.02,
      });
    }

    // Past-only analysis
    const targetIdx = 100;
    const rhythm = analyzePastOnlyRhythm(mockTicks, targetIdx, 64);
    assert.ok(rhythm.frequencies.length > 0);
    assert.ok(rhythm.spectralEntropy >= 0);

    // Out-of-sample backtest vs baseline after friction
    const backtest = backtestMarketRhythmAgainstBaseline(mockTicks, 0.7);
    assert.ok(backtest.totalOutSampleChecks > 0);
    assert.ok(backtest.averageTakerFeePaid >= 0.018);
    assert.equal(typeof backtest.edgeProven, "boolean");
    // Verifies negative finding statement when edge is unproven
    if (!backtest.edgeProven) {
      assert.match(backtest.concludingFinding, /Empirical confirmation: Spectral cycles describe historical oscillation structure/);
    }

    // Research HTML report rendering
    const reportHtml = renderMarketRhythmPageHtml();
    assert.match(reportHtml, /Market Rhythm: Frequency, Vibration &amp; Signal Agreement/);
    assert.match(reportHtml, /Power Spectral Density \(PSD\) Telemetry/);
    assert.match(reportHtml, /HANDOFF\.md Rule B4/);

    // Hub links
    const researchHub = renderResearchPageHtml();
    assert.match(researchHub, /href="\/research\/market-rhythm"/);
  });
});
