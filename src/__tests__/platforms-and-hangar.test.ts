import test from "node:test";
import assert from "node:assert/strict";
import { renderPlatformsPageHtml } from "../platforms-page.ts";
import { renderPilotHangarPageHtml } from "../pilot-hangar-page.ts";
import {
  CHARACTER_ARCHETYPES,
  APPAREL_OPTIONS,
  HAIR_STYLE_OPTIONS,
  EXPRESSION_OPTIONS,
  generatePilotAvatarSvg,
} from "../lib/pilot-customizer-catalog.ts";
import { renderAssistantWidget } from "../assistant-widget.ts";

test("Platforms page layout: Flight Deck at top, True Cost Check at bottom right above pricing", () => {
  const html = renderPlatformsPageHtml();

  // Check key landmarks exist
  assert.ok(html.includes("id=\"flight-deck-top\""), "Flight Deck top landmark must be present");
  assert.ok(html.includes("id=\"true-cost-check\""), "True Cost Check landmark must be present");
  assert.ok(html.includes("id=\"pricing\""), "Platforms Pricing landmark must be present");

  // Verify ordering: Flight Deck < True Cost Check < Pricing
  const flightDeckIndex = html.indexOf("id=\"flight-deck-top\"");
  const trueCostIndex = html.indexOf("id=\"true-cost-check\"");
  const pricingIndex = html.indexOf("id=\"pricing\"");

  assert.ok(
    flightDeckIndex < trueCostIndex,
    `Flight Deck (${flightDeckIndex}) must appear before True Cost Check (${trueCostIndex})`
  );
  assert.ok(
    trueCostIndex < pricingIndex,
    `True Cost Check (${trueCostIndex}) must appear right before Pricing (${pricingIndex})`
  );

  // Check specific content
  assert.ok(html.includes("Flight Deck Command Suite"), "Must render Flight Deck header");
  assert.ok(html.includes("Interactive True Cost &amp; Breakeven Check"), "Must render True Cost Check header");
  assert.ok(html.includes("51.8%"), "Must show canonical 51.8% hurdle rate calculation");
  assert.ok(html.includes("Research Cadet"), "Must include Cadet pricing tier");
  assert.ok(html.includes("Flight Deck Pro"), "Must include Flight Deck Pro pricing tier");
  assert.ok(html.includes("Institutional Desk"), "Must include Institutional pricing tier");
});

test("Pilot Hangar & Customizer: options, apparel, hair, facial expressions, and embarkation", () => {
  // Check catalog options
  assert.equal(CHARACTER_ARCHETYPES.length, 6, "Must offer 6 character archetypes");
  assert.equal(APPAREL_OPTIONS.length, 6, "Must offer 6 QuanterraOS apparel lines");
  assert.equal(HAIR_STYLE_OPTIONS.length, 7, "Must offer 7 hair styles");
  assert.equal(EXPRESSION_OPTIONS.length, 6, "Must offer 6 facial expressions / visor LED displays");

  // Check procedural avatar generation
  const testSvg = generatePilotAvatarSvg({
    callsign: "PILOT-TEST",
    archetypeId: "cadet-vanguard",
    apparelId: "founder-m",
    hairId: "orbital-braids",
    expressionId: "calm-focus",
    hairColor: "#38bdf8",
    suitColor: "#080911",
    embarked: false,
  });

  assert.ok(testSvg.includes("<svg"), "Must output valid SVG");
  assert.ok(testSvg.includes("pilot-avatar-svg"), "Must have pilot-avatar-svg class");
  assert.ok(testSvg.includes("PILOT-TEST"), "Must include callsign in accessible label");

  // Check Hangar HTML
  const hangarHtml = renderPilotHangarPageHtml();
  assert.ok(hangarHtml.includes("Pilot Hangar &amp; Embarkation Deck"), "Must have page header");
  assert.ok(hangarHtml.includes("1. Character Base"), "Must have archetype selection section");
  assert.ok(hangarHtml.includes("2. QuanterraOS Apparel"), "Must have apparel selection section");
  assert.ok(hangarHtml.includes("3. Hair Style"), "Must have hair style section");
  assert.ok(hangarHtml.includes("4. Facial Expression"), "Must have expression section");
  assert.ok(hangarHtml.includes("Enter the Spaceship &amp; Meet Crew"), "Must have embarkation trigger button");
  assert.ok(hangarHtml.includes("id=\"embark-modal\""), "Must have cinematic embarkation modal");
  assert.ok(hangarHtml.includes("Celestial Man"), "Must reference Quanta as Celestial Man in bridge crew");
  assert.ok(hangarHtml.includes("Celestial Woman"), "Must reference Quantana as Celestial Woman in bridge crew");
});

test("Virtual Assistant: Updated role titles to Celestial Man and Celestial Woman", () => {
  const widgetHtml = renderAssistantWidget();

  // Must include Celestial Man and Celestial Woman
  assert.ok(widgetHtml.includes("Celestial Man"), "Widget must describe Quanta as Celestial Man");
  assert.ok(widgetHtml.includes("Celestial Woman"), "Widget must describe Quantana as Celestial Woman");

  // Must not have obsolete King or Queen role titles
  assert.ok(!widgetHtml.includes("Quanta (King"), "Must not call Quanta King");
  assert.ok(!widgetHtml.includes("Quantana (Queen"), "Must not call Quantana Queen");
  assert.ok(!widgetHtml.includes("Global King"), "Must not use Global King role");
  assert.ok(!widgetHtml.includes("Global Queen"), "Must not use Global Queen role");
});
