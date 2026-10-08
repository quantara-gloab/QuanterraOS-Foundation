/**
 * Automated Acceptance Test Suite: Forensic Post-Mortem Settlement Dissection Engine
 *
 * Verifies:
 * 1. Window Cadence & Window History (15m spacing, KXBTC15M format).
 * 2. 60-Second TWAP Reconstruction & Rolling Arithmetic:
 *    - Validates 60 ticks per window.
 *    - Verifies cumulative TWAP equals running mean of instantaneous prices.
 *    - Verifies final TWAP matches the 60th second cumulative TWAP.
 * 3. Strike Resolution & Flip Matrix (Pre-Sampling vs Final Settlement State).
 * 4. CME CF BRTI Constituent Exchange Weighting (Coinbase, Kraken, Bitstamp, Gemini, itBit).
 * 5. Cryptographic SHA-256 Provenance Hash Integrity.
 * 6. High-Resolution Shareable SVG Forensic Settlement Receipt.
 * 7. HTML Rendering & Rule B4 / Rule B5 compliance.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getRecentSettledWindows,
  computeSettlementDissection,
  renderSettlementForensicCardSvg,
  renderSettlementDissectionPageHtml,
} from "../settlement-dissection.ts";

describe("Forensic Post-Mortem Settlement Dissection Engine", () => {
  it("1. Window Cadence: generates recent settled 15m windows with valid ticker format", () => {
    const fixedNow = 1760000000000;
    const windows = getRecentSettledWindows(fixedNow);

    assert.equal(windows.length, 6, "Should return 6 recent settled windows");
    for (const w of windows) {
      assert.match(w.ticker, /^KXBTC15M-\d{2}[A-Z]{3}\d{2}-\d{4}$/, "Ticker must follow KXBTC15M-YYMMMDD-HHMM");
      assert.ok(Date.parse(w.closeTimeIso) > 0, "closeTimeIso must be valid ISO timestamp");
    }

    // Windows must be spaced by exactly 15 minutes (900,000 ms)
    for (let i = 0; i < windows.length - 1; i++) {
      const t1 = Date.parse(windows[i].closeTimeIso);
      const t2 = Date.parse(windows[i + 1].closeTimeIso);
      assert.equal(t1 - t2, 15 * 60 * 1000, "Adjacent windows must have 15m cadence delta");
    }
  });

  it("2. 60-Second TWAP Reconstruction: validates 60 ticks and exact rolling mean arithmetic", () => {
    const dissection = computeSettlementDissection({
      nowMs: 1760000000000,
      anchorBasePrice: 91500,
    });

    assert.equal(dissection.ticks.length, 60, "Must contain exactly 60 seconds of sampling ticks");
    assert.equal(dissection.samplingDurationSeconds, 60);

    let sum = 0;
    for (let i = 0; i < 60; i++) {
      const tick = dissection.ticks[i];
      assert.equal(tick.second, i + 1);
      sum += tick.instantaneousPrice;

      const expectedTwap = Number((sum / (i + 1)).toFixed(2));
      assert.equal(tick.cumulativeTwap, expectedTwap, `Tick ${i + 1} cumulative TWAP must equal running mean`);
    }

    assert.equal(dissection.finalTwapPrice, dissection.ticks[59].cumulativeTwap, "Final TWAP must equal tick 60's cumulative TWAP");
  });

  it("3. Strike Resolution & Flip Matrix: evaluates strike outcomes and flags reversals", () => {
    const dissection = computeSettlementDissection({
      nowMs: 1760000000000,
      anchorBasePrice: 91250,
    });

    assert.ok(dissection.strikes.length >= 5, "Must evaluate at least 5 strikes around spot");

    for (const stk of dissection.strikes) {
      if (dissection.finalTwapPrice >= stk.strike) {
        assert.equal(stk.finalSettlementState, "SETTLED_YES");
        assert.ok(stk.marginFromTwapUsd >= 0);
      } else {
        assert.equal(stk.finalSettlementState, "SETTLED_NO");
        assert.ok(stk.marginFromTwapUsd < 0);
      }

      // Check flip detection logic
      const shouldFlip =
        (stk.preSamplingState === "ABOVE" && stk.finalSettlementState === "SETTLED_NO") ||
        (stk.preSamplingState === "BELOW" && stk.finalSettlementState === "SETTLED_YES");
      assert.equal(stk.flippedDuringSampling, shouldFlip);
    }
  });

  it("4. Constituent Exchange Weighting: verifies CME CF BRTI constituent weights sum to 100%", () => {
    const dissection = computeSettlementDissection();
    assert.equal(dissection.constituents.length, 5, "Must evaluate 5 constituent exchanges");

    const totalWeight = dissection.constituents.reduce((acc, c) => acc + c.weightPct, 0);
    assert.equal(Math.round(totalWeight), 100, "Constituent weights must sum to 100%");

    for (const c of dissection.constituents) {
      assert.ok(c.meanPrice > 0, "Mean price must be positive");
      assert.ok(c.dispersionBps >= 0, "Dispersion must be non-negative");
    }
  });

  it("5. Cryptographic SHA-256 Provenance Hash: produces consistent 64-char hex hash", () => {
    const dissection = computeSettlementDissection({ anchorBasePrice: 92000 });
    assert.equal(dissection.forensicIntegrityHash.length, 64, "SHA-256 hash must be 64 characters hex");
    assert.match(dissection.forensicIntegrityHash, /^[0-9a-f]{64}$/);
  });

  it("6. Shareable SVG Forensic Receipt: produces valid XML with Gold Standard styling", () => {
    const dissection = computeSettlementDissection();
    const svg = renderSettlementForensicCardSvg(dissection);

    assert.ok(svg.startsWith("<svg"), "Must produce valid SVG root");
    assert.ok(svg.endsWith("</svg>"), "Must close SVG tag");
    assert.ok(svg.includes("QUANTERRA") && svg.includes("FORENSIC SETTLEMENT RECEIPT"));
    assert.ok(svg.includes("CME CF BRTI 60-SECOND TWAP AUDIT"));
    assert.ok(svg.includes(dissection.windowTicker));
    assert.ok(svg.includes("SHA-256:"));
    assert.ok(svg.includes("Rule B5 Standby Lock"));
  });

  it("7. Full HTML Rendering & Rule B4 / Rule B5 Compliance", () => {
    const dissection = computeSettlementDissection();
    const recent = getRecentSettledWindows();
    const html = renderSettlementDissectionPageHtml(dissection, recent);

    assert.ok(html.includes("<!DOCTYPE html>"), "Must be valid HTML5");
    assert.ok(html.includes("Settlement Dissection &amp; TWAP Audit"));
    assert.ok(html.includes("60-Second TWAP Convergence Trajectory"));
    assert.ok(html.includes("Contract Resolution Audit Matrix"));
    assert.ok(html.includes("CME CF BRTI Constituent Exchange Weighting"));
    assert.ok(html.includes("Forensic Second-by-Second Tick Tape"));

    // Rule B5 Compliance
    assert.ok(html.includes("Rule B5: $0.00 Live Capital Deployed"));

    // Rule B4 Compliance: No banned marketing words
    assert.strictEqual(/\balpha\b/i.test(html), false);
    assert.strictEqual(/\bguaranteed\b/i.test(html), false);
    assert.strictEqual(/\bbeat the market\b/i.test(html), false);
    assert.strictEqual(/\barbitrage opportunity\b/i.test(html), false);
  });
});
