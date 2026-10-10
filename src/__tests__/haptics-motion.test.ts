/**
 * Acceptance Test Suite: Phase 8 Task 8.3
 * Mobile Polish: Haptics (Web Vibration API) & Accessibility (prefers-reduced-motion)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  HAPTIC_PATTERNS,
  validateHapticPattern,
  REDUCED_MOTION_CSS,
  HAPTICS_AND_MOTION_CLIENT_SCRIPT,
} from "../lib/haptics-motion.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 8 Task 8.3 Acceptance: Haptics & prefers-reduced-motion Handling (Part 3.11 & Part 5)", () => {
  describe("1. Haptic Vibration Patterns Specification", () => {
    it("defines the canonical tactile feedback patterns", () => {
      assert.ok(HAPTIC_PATTERNS.light, "Must define light pattern");
      assert.ok(HAPTIC_PATTERNS.medium, "Must define medium pattern");
      assert.ok(HAPTIC_PATTERNS.warning, "Must define warning pattern");
      assert.ok(HAPTIC_PATTERNS.success, "Must define success pattern");
      assert.ok(HAPTIC_PATTERNS.selection, "Must define selection pattern");

      assert.strictEqual(HAPTIC_PATTERNS.light.pattern, 10);
      assert.strictEqual(HAPTIC_PATTERNS.medium.pattern, 25);
      assert.deepStrictEqual(HAPTIC_PATTERNS.warning.pattern, [40, 40, 40]);
      assert.deepStrictEqual(HAPTIC_PATTERNS.success.pattern, [20, 50, 30]);
      assert.strictEqual(HAPTIC_PATTERNS.selection.pattern, 8);
    });

    it("validates safe vibration intervals and rejects hazardous durations", () => {
      assert.strictEqual(validateHapticPattern(10), true);
      assert.strictEqual(validateHapticPattern([40, 40, 40]), true);
      assert.strictEqual(validateHapticPattern(-5), false);
      assert.strictEqual(validateHapticPattern(5000), false); // Over 1s
      assert.strictEqual(validateHapticPattern([]), false);
    });
  });

  describe("2. Accessibility & Reduced-Motion CSS (Part 5)", () => {
    it("provides strict prefers-reduced-motion media query rules", () => {
      assert.ok(REDUCED_MOTION_CSS.includes("@media (prefers-reduced-motion: reduce)"));
      assert.ok(REDUCED_MOTION_CSS.includes("animation-duration: 0.001ms !important"));
      assert.ok(REDUCED_MOTION_CSS.includes("animation: none !important"));
      assert.ok(REDUCED_MOTION_CSS.includes(".hud-starfield-canvas"));
      assert.ok(REDUCED_MOTION_CSS.includes(".radar-sweep"));
    });

    it("verifies public/index.css includes prefers-reduced-motion resets", () => {
      const indexCss = fs.readFileSync(path.resolve("public/index.css"), "utf-8");
      assert.ok(
        indexCss.includes("@media (prefers-reduced-motion: reduce)"),
        "public/index.css must include prefers-reduced-motion"
      );
      assert.ok(indexCss.includes("scroll-behavior: auto !important"));
    });
  });

  describe("3. Client Haptics Engine & Motion Preference Script", () => {
    it("implements window.QOSHaptics with user toggle and reduced-motion suppression", () => {
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("window.QOSHaptics = {"));
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("quanterraos_haptics_enabled"));
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("prefers-reduced-motion: reduce"));
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("navigator.vibrate"));
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("light: function()"));
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("warning: function()"));
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("success: function()"));
    });

    it("wires tactile feedback to nav tabs, sliders, and haptic test buttons", () => {
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes(".deck-nav-item, .deck-mobile-tab"));
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("input[type=\"range\"]"));
      assert.ok(HAPTICS_AND_MOTION_CLIENT_SCRIPT.includes("setting-haptics-toggle"));
    });
  });

  describe("4. Flight Deck Cockpit HTML UI Integration (/deck)", () => {
    it("renders haptics card, toggle, and reduced-motion CSS in /deck HTML", () => {
      const html = renderFlightDeckPageHtml({
        initialStation: "hangar",
        user: { id: "test", email: "pilot@quanterraos.com", rank: "Commander" },
      });

      // Reduced-motion CSS present
      assert.ok(html.includes("prefers-reduced-motion: reduce"), "Must contain reduced-motion media query");

      // Hangar haptics card present
      assert.ok(html.includes("id=\"hangar-haptics-card\""), "Hangar haptics card missing");
      assert.ok(html.includes("id=\"setting-haptics-toggle\""), "Hangar haptics toggle missing");
      assert.ok(html.includes("Test Light Tick"), "Test light tick button missing");
      assert.ok(html.includes("Test Hazard Buzz"), "Test hazard buzz button missing");

      // Injected script present
      assert.ok(html.includes("window.QOSHaptics = {"), "Haptics client script missing from /deck");
    });
  });

  describe("5. Regulatory Compliance & Non-Advisory Guardrails (Rule B4 & Rule B5)", () => {
    it("confirms $0.00 capital risk and zero order execution code in haptics module", () => {
      const code = fs.readFileSync(path.resolve("src/lib/haptics-motion.ts"), "utf-8");
      assert.ok(!code.includes("placeOrder"), "Zero live order placement");
      assert.ok(!code.includes("executeTrade"), "Zero live trade routing");
      assert.ok(code.includes("$0.00"), "Must state $0.00 capital exposure");
    });
  });
});
