/**
 * Acceptance Test Suite: Flagship Landing Page & Mobile App Onboarding Tutorial Gateway
 *
 * Verifies:
 * 1. Mind-blowing interactive Cockpit Video Briefing / Tutorial player on the homepage:
 *    - Presence of #video-briefing-modal, canvas #tutorial-hud-canvas, and Web Audio sound controls
 *    - All 4 guided tutorial acts (Fee Drag & $142.50/mo savings, 60s TWAP Radar, Copilot Aria, Subscribe & Launch)
 *    - Direct high-converting subscription CTA to /pricing
 * 2. Downloadable Mobile App Gateway on the homepage:
 *    - #mobile-app-top-strip banner
 *    - #mobile-app-download-modal with 1-click PWA install button
 *    - Step-by-step Apple iOS Add-to-Home-Screen instructions
 *    - Step-by-step Android/Samsung Galaxy instructions
 *    - Desktop-to-mobile camera scan vector QR code
 * 3. Welcoming experience inside the mobile app (/deck):
 *    - Bridge station onboarding briefing card (deck-welcome-briefing-card)
 *    - Video tutorial briefing modal (#deck-video-briefing-modal) inside /deck
 *    - Direct Pro subscription upgrade button
 * 4. Microstructure cockpit tools & legacy proof:
 *    - Microstructure cockpit station section (#roadmap-cockpit) with all 6 specialized tools
 *    - 2026 Competitive Referee Showcase (#why-quanterraos-showcase)
 *    - Rule B4 & Rule B5 regulatory guardrail compliance
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderLandingPage } from "../landing-page.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Flagship Landing Page & Mobile App Gateway Acceptance", () => {
  const landingHtml = renderLandingPage();
  const deckHtml = renderFlightDeckPageHtml({ initialStation: "bridge" });

  describe("1. Mind-Blowing Interactive Cockpit Video Briefing Player", () => {
    it("renders the interactive video briefing modal and HUD canvas on the homepage", () => {
      assert.ok(landingHtml.includes('id="video-briefing-modal"'), "Must contain video briefing modal");
      assert.ok(landingHtml.includes('id="tutorial-hud-canvas"'), "Must contain tutorial HUD canvas");
      assert.ok(landingHtml.includes('btn-video-briefing'), "Must contain hero video briefing button");
      assert.ok(landingHtml.includes("Watch 60-Second Cockpit Briefing"), "Must label video tutorial");
    });

    it("includes all 4 guided tutorial chapters with synchronized captions and audio controls", () => {
      // Act 1: Fee Drag & North Star savings
      assert.ok(landingHtml.includes("Fee Drag ($142.50 Saved)"), "Must include Act 1 button");
      assert.ok(landingHtml.includes("$142.50/month in avoidable drag") || landingHtml.includes("$142.50 SAVED / MO"), "Must explain North-Star fee savings");

      // Act 2: 60s Settlement Radar
      assert.ok(landingHtml.includes("Settlement Radar (60s TWAP)"), "Must include Act 2 button");
      assert.ok(landingHtml.includes("CME CF BRTI 60-second TWAP"), "Must explain settlement radar index");

      // Act 3: Autonomous Copilot Aria
      assert.ok(landingHtml.includes("Copilot Aria &amp; Stations"), "Must include Act 3 button");
      assert.ok(landingHtml.includes("Rule B5 Standard: $0.00 Live Exposure"), "Must emphasize Rule B5");

      // Act 4: Subscribe & Launch Deck
      assert.ok(landingHtml.includes("Subscribe &amp; Launch Deck"), "Must include Act 4 button");
      assert.ok(landingHtml.includes("Start 7-Day Free Flight Check &rarr;"), "Must provide direct conversion button");

      // Audio Controls
      assert.ok(landingHtml.includes("btn-tutorial-audio"), "Must include sound toggle button");
      assert.ok(landingHtml.includes("toggleTutorialAudio"), "Must provide Web Audio toggle function");
    });
  });

  describe("2. Downloadable Mobile App Gateway on the Homepage", () => {
    it("renders the top mobile app gateway banner and navigation pill", () => {
      assert.ok(landingHtml.includes('id="mobile-app-top-strip"'), "Must contain mobile app top strip");
      assert.ok(landingHtml.includes("Apple iPhone &amp; Samsung Galaxy"), "Must reference iOS and Android");
      assert.ok(landingHtml.includes("nav-pill-mobile-app"), "Must contain mobile app nav pill");
      assert.ok(landingHtml.includes("openMobileAppDownloadModal()"), "Must link to download modal");
    });

    it("renders the mobile app download modal with 1-click PWA, iOS instructions, and QR code", () => {
      assert.ok(landingHtml.includes('id="mobile-app-download-modal"'), "Must contain mobile download modal");
      assert.ok(landingHtml.includes('id="btn-pwa-direct-install"'), "Must contain 1-click PWA install button");

      // iOS Safari guide
      assert.ok(landingHtml.includes("Apple iPhone / iPad"), "Must have iOS section");
      assert.ok(landingHtml.includes("Add to Home Screen"), "Must guide users to Add to Home Screen");

      // Android guide
      assert.ok(landingHtml.includes("Android / Samsung"), "Must have Android section");

      // Desktop-to-mobile QR Code
      assert.ok(landingHtml.includes("POINT PHONE CAMERA TO SCAN &amp; LAUNCH"), "Must contain QR code scanner guide");
    });
  });

  describe("3. Welcoming Mobile App Experience (/deck)", () => {
    it("renders the welcoming 60-second onboarding briefing card inside the Bridge station", () => {
      assert.ok(deckHtml.includes("deck-welcome-briefing-card"), "Must contain welcome card in flight deck");
      assert.ok(deckHtml.includes("WELCOME CADET // ONBOARDING COCKPIT BRIEFING"), "Must have welcoming title");
      assert.ok(deckHtml.includes("How Pre-Flight Checks Save $142.50/mo"), "Must highlight North-Star metric");
      assert.ok(deckHtml.includes('id="btn-open-deck-briefing"'), "Must have briefing trigger button");
    });

    it("embeds the video briefing tutorial modal directly in the mobile app", () => {
      assert.ok(deckHtml.includes('id="deck-video-briefing-modal"'), "Flight deck must embed briefing modal");
      assert.ok(deckHtml.includes('id="deck-tutorial-hud-canvas"'), "Flight deck must have HUD tutorial canvas");
      assert.ok(deckHtml.includes("openDeckVideoBriefingModal()"), "Must provide opening controller");
      assert.ok(deckHtml.includes("Upgrade Pro ($29/mo)"), "Must provide direct subscription upgrade link");
    });
  });

  describe("4. Microstructure Cockpit Tools & Regulatory Compliance", () => {
    it("renders the active microstructure cockpit station grid with all 6 tools", () => {
      assert.ok(landingHtml.includes('id="roadmap-cockpit"'), "Must contain roadmap cockpit section");
      assert.ok(landingHtml.includes("Active Prediction Market Microstructure Cockpit"));
      assert.ok(landingHtml.includes('href="/paper"'));
      assert.ok(landingHtml.includes('href="/compare"'));
      assert.ok(landingHtml.includes('href="/matrix"'));
      assert.ok(landingHtml.includes('href="/flow"'));
      assert.ok(landingHtml.includes('href="/radar/audio"'));
      assert.ok(landingHtml.includes('href="/calibration/explorer"'));
    });

    it("strictly adheres to Rule B4 (non-advisory, zero superlatives) and Rule B5 ($0 live capital)", () => {
      assert.ok(landingHtml.includes("$0.00"), "Must display $0.00 live risk");
      assert.ok(landingHtml.includes("RULE B5 LOCKED"), "Must state Rule B5 locked");

      const banned = [
        /\balpha\b/i,
        /\bguaranteed\b/i,
        /\bwe beat the market\b/i,
        /\barbitrage opportunity\b/i,
      ];
      for (const pattern of banned) {
        assert.doesNotMatch(landingHtml, pattern, `Must not contain banned phrase: ${pattern}`);
      }
    });
  });
});
