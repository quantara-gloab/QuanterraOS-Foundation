import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  renderFlightDeckPageHtml,
  FLIGHT_DECK_STATIONS,
  type FlightDeckStationId,
} from "../flight-deck-page.ts";

describe("Phase 4 Task 4.1 Acceptance: Flight Deck Shell (/deck)", () => {
  const defaultHtml = renderFlightDeckPageHtml();

  test("defines exactly 7 ship stations matching Part 2.3 specification", () => {
    assert.equal(FLIGHT_DECK_STATIONS.length, 7, "Flight Deck must define exactly 7 stations");

    const expectedStations: { id: FlightDeckStationId; name: string; metaphor: string }[] = [
      { id: "bridge", name: "Bridge", metaphor: "Main Viewscreen" },
      { id: "navigation", name: "Navigation", metaphor: "Star Map" },
      { id: "engineering", name: "Engineering", metaphor: "Fuel & Reactor" },
      { id: "mission-log", name: "Mission Log", metaphor: "Captain's Log" },
      { id: "sensors", name: "Sensors", metaphor: "Long-Range Scanners" },
      { id: "crew", name: "Crew", metaphor: "Crew Quarters" },
      { id: "hangar", name: "Hangar", metaphor: "Ship Config" },
    ];

    for (const expected of expectedStations) {
      const found = FLIGHT_DECK_STATIONS.find((s) => s.id === expected.id);
      assert.ok(found, `Station ${expected.id} must be present in FLIGHT_DECK_STATIONS`);
      assert.equal(found.name, expected.name, `Station name must match ${expected.name}`);
      assert.equal(found.shipMetaphor, expected.metaphor, `Station metaphor must match ${expected.metaphor}`);
      assert.ok(found.tagline.length > 10, "Station must have descriptive tagline");
      assert.ok(found.iconSvg.includes("<svg"), "Station must include valid SVG icon");
    }
  });

  test("renders all 7 station panels with unique IDs in HTML", () => {
    for (const station of FLIGHT_DECK_STATIONS) {
      const panelId = `station-panel-${station.id}`;
      assert.match(
        defaultHtml,
        new RegExp(`id=["']${panelId}["']`, "i"),
        `HTML must contain station panel element with id="${panelId}"`
      );
    }
  });

  test("defaults to Bridge active station, and supports initialStation override", () => {
    // Default: Bridge is active
    assert.match(
      defaultHtml,
      /<section[^>]*id=["']station-panel-bridge["'][^>]*class=["'][^"']*active[^"']*["']|<section[^>]*class=["'][^"']*active[^"']*["'][^>]*id=["']station-panel-bridge["']/i,
      "Default active panel must be Bridge"
    );

    // Override with Navigation
    const navHtml = renderFlightDeckPageHtml({ initialStation: "navigation" });
    assert.match(
      navHtml,
      /<section[^>]*id=["']station-panel-navigation["'][^>]*class=["'][^"']*active[^"']*["']|<section[^>]*class=["'][^"']*active[^"']*["'][^>]*id=["']station-panel-navigation["']/i,
      "Overridden active panel must be Navigation"
    );

    // Override with Engineering
    const engHtml = renderFlightDeckPageHtml({ initialStation: "engineering" });
    assert.match(
      engHtml,
      /<section[^>]*id=["']station-panel-engineering["'][^>]*class=["'][^"']*active[^"']*["']|<section[^>]*class=["'][^"']*active[^"']*["'][^>]*id=["']station-panel-engineering["']/i,
      "Overridden active panel must be Engineering"
    );
  });

  test("includes desktop left navigation rail with 7 stations and pilot rank card", () => {
    assert.match(defaultHtml, /id=["']cockpit-desktop-rail["']/i, "Desktop rail must exist");
    assert.match(defaultHtml, /class=["'][^"']*cockpit-pilot-card[^"']*["']/i, "Pilot rank card must be rendered");
    assert.match(defaultHtml, /PILOT RANK/i, "Pilot rank label must be present");
    assert.match(defaultHtml, /Discipline XP/i, "Discipline XP must be tracked");

    for (const station of FLIGHT_DECK_STATIONS) {
      assert.match(
        defaultHtml,
        new RegExp(`id=["']deck-nav-${station.id}["']`, "i"),
        `Desktop rail must contain nav item for ${station.id}`
      );
    }
  });

  test("includes mobile bottom navigation tab bar with touch targets", () => {
    assert.match(defaultHtml, /id=["']cockpit-mobile-tabs["']/i, "Mobile tabs nav must exist");

    for (const station of FLIGHT_DECK_STATIONS) {
      assert.match(
        defaultHtml,
        new RegExp(`id=["']deck-tab-${station.id}["']`, "i"),
        `Mobile tabs must contain tab for ${station.id}`
      );
    }
  });

  test("implements Part 5 Celestial tokens in CSS", () => {
    assert.match(defaultHtml, /--space-900:\s*#05060B/i, "Celestial token --space-900 must be defined");
    assert.match(defaultHtml, /--hud-cyan:\s*#4FD1E8/i, "Celestial token --hud-cyan must be defined");
    assert.match(defaultHtml, /--hud-gold:\s*#C9A24A/i, "Celestial token --hud-gold must be defined");
    assert.match(defaultHtml, /--alert-red:\s*#E5484D/i, "Celestial token --alert-red must be defined");
    assert.match(defaultHtml, /--ok-green:\s*#30A46C/i, "Celestial token --ok-green must be defined");
  });

  test("enforces Part 0.3 Guardrails (Rule B5 locked, non-advisory Aria, anti-volume gamification)", () => {
    // Rule B5 status in top bar
    assert.match(defaultHtml, /RULE B5 LOCKED \(\$0 RISK\)/i, "Top bar must affirm Rule B5 locked");

    // Aria non-advisory disclaimer
    assert.match(
      defaultHtml,
      /I cannot tell you what to trade/i,
      "Aria prompt must explicitly refuse buy/sell calls"
    );

    // Anti-volume discipline rewards
    assert.match(
      defaultHtml,
      /No XP is ever awarded for trade count, volume, or winning/i,
      "Mission panel must state anti-volume discipline policy"
    );
  });

  test("client-side station switching script switchStation is included", () => {
    assert.match(defaultHtml, /function\s+switchStation\s*\(/i, "switchStation function must be defined");
    assert.match(defaultHtml, /url\.searchParams\.set\('station',\s*stationId\)/i, "switchStation must update URL query");
  });
});
