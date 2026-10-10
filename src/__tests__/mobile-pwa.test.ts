/**
 * Acceptance Test Suite: Phase 8 Task 8.1
 * Mobile Polish: PWA Manifest, Icons, Offline Shell, Install Prompt & Web Push
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  registerPushSubscription,
  getAllPushSubscriptions,
  createSafePushAlert,
  renderInstallPromptHtml,
} from "../lib/mobile-pwa.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 8 Task 8.1 Acceptance: PWA Manifest, Icons, Offline Shell, Install Prompt & Web Push", () => {
  describe("1. PWA Manifest Integrity (/manifest.json)", () => {
    const manifestPath = path.resolve("public/manifest.json");
    assert.ok(fs.existsSync(manifestPath), "public/manifest.json must exist");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    it("specifies canonical Flight Deck name and branding", () => {
      assert.strictEqual(manifest.name, "QuanterraOS Flight Deck");
      assert.strictEqual(manifest.short_name, "QuanterraOS");
      assert.strictEqual(manifest.start_url, "/deck");
      assert.strictEqual(manifest.id, "/deck");
      assert.strictEqual(manifest.display, "standalone");
      assert.strictEqual(manifest.background_color, "#05060B");
      assert.strictEqual(manifest.theme_color, "#000000");
    });

    it("includes required responsive icons (192, 512, maskable, SVG)", () => {
      assert.ok(Array.isArray(manifest.icons), "icons must be an array");
      assert.ok(manifest.icons.some((i: any) => i.sizes === "192x192"));
      assert.ok(manifest.icons.some((i: any) => i.sizes === "512x512"));
      assert.ok(manifest.icons.some((i: any) => i.purpose === "maskable"));
      assert.ok(manifest.icons.some((i: any) => i.type === "image/svg+xml"));

      // Verify that all icon files actually exist on disk
      for (const icon of manifest.icons) {
        const iconPath = path.resolve(`public${icon.src}`);
        assert.ok(fs.existsSync(iconPath), `Icon file ${icon.src} must exist on disk`);
      }
    });

    it("defines essential 4-station app shortcuts", () => {
      assert.ok(Array.isArray(manifest.shortcuts), "shortcuts must be an array");
      const urls = manifest.shortcuts.map((s: any) => s.url);
      assert.ok(urls.includes("/deck"), "Must include /deck shortcut");
      assert.ok(urls.includes("/check"), "Must include /check shortcut");
      assert.ok(urls.includes("/radar"), "Must include /radar shortcut");
      assert.ok(urls.includes("/proof"), "Must include /proof shortcut");
    });

    it("pre-configures Web Share Target API for contract ingestion (Part 3.11)", () => {
      assert.ok(manifest.share_target, "Must specify share_target");
      assert.strictEqual(manifest.share_target.action, "/deck");
      assert.strictEqual(manifest.share_target.method, "GET");
      assert.ok(manifest.share_target.params.url, "Must map share url parameter");
    });
  });

  describe("2. Offline Shell & Service Worker (/offline.html & service-worker.js)", () => {
    const swPath = path.resolve("public/service-worker.js");
    assert.ok(fs.existsSync(swPath), "service-worker.js must exist");
    const swContent = fs.readFileSync(swPath, "utf-8");

    const offlinePath = path.resolve("public/offline.html");
    assert.ok(fs.existsSync(offlinePath), "public/offline.html must exist");
    const offlineHtml = fs.readFileSync(offlinePath, "utf-8");

    it("pre-caches static shell assets and offline fallback in service worker", () => {
      assert.ok(swContent.includes("/offline.html"), "Service worker must pre-cache offline.html");
      assert.ok(swContent.includes("/manifest.json"), "Service worker must pre-cache manifest.json");
      assert.ok(swContent.includes("/index.css"), "Service worker must pre-cache index.css");
      assert.ok(swContent.includes("quanterraos-flightdeck-v2"), "Must use v2 cache name");
    });

    it("serves offline.html when navigation requests fail offline", () => {
      assert.ok(
        swContent.includes("event.request.mode === 'navigate'"),
        "SW must check for navigate mode"
      );
      assert.ok(
        swContent.includes("caches.match('/offline.html')"),
        "SW must return offline.html on navigation failure"
      );
    });

    it("protects API routes from stale execution caching and enforces Rule B5", () => {
      assert.ok(
        swContent.includes("Rule B5 active ($0.00 capital risk; zero order routing)"),
        "Offline API response must state Rule B5 protection"
      );
    });

    it("renders celestial-themed offline.html with auto-reconnect listeners", () => {
      assert.ok(offlineHtml.includes("Flight Deck Offline Shell"), "Offline shell title missing");
      assert.ok(offlineHtml.includes("RULE B5 GUARD ACTIVE"), "Rule B5 badge missing");
      assert.ok(offlineHtml.includes("$0.00 Live Capital Exposure"), "Must state $0.00 capital exposure");
      assert.ok(offlineHtml.includes("window.addEventListener('online'"), "Must listen for online event");
    });
  });

  describe("3. Web Push Notification Engine (Part 3.11 & Part 0.3)", () => {
    it("registers valid HTTPS push endpoints and maintains subscription registry", () => {
      const result = registerPushSubscription({
        endpoint: "https://fcm.googleapis.com/fcm/send/sample_push_token_982",
        keys: { p256dh: "key_p256", auth: "auth_token" },
        userId: "pilot_user_test",
        deviceLabel: "iPhone Safari PWA",
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.subscription);
      assert.strictEqual(result.subscription.userId, "pilot_user_test");

      const allSubs = getAllPushSubscriptions();
      assert.ok(allSubs.length >= 1);
    });

    it("rejects insecure HTTP push endpoints", () => {
      const bad = registerPushSubscription({
        endpoint: "http://insecure.endpoint.example/push",
      });
      assert.strictEqual(bad.success, false);
      assert.match(bad.message, /secure HTTPS push endpoint/);
    });

    it("sanitizes push payloads to strictly obey Rule B4 (zero win/profit claims)", () => {
      const unsafe = createSafePushAlert({
        title: "Guaranteed Winning Signal!",
        body: "Enter now for a guaranteed 100% win rate and beat the market profit edge!",
        url: "/deck?station=navigation",
        category: "settlement_basis",
      });

      // Must be stripped of banned superlatives
      assert.ok(!unsafe.body.toLowerCase().includes("guaranteed"));
      assert.ok(!unsafe.body.toLowerCase().includes("win rate"));
      assert.ok(!unsafe.body.toLowerCase().includes("beat the market"));
      assert.ok(!unsafe.body.toLowerCase().includes("profit"));
      assert.ok(!unsafe.body.toLowerCase().includes("edge"));
    });

    it("service worker push handler also sanitizes inbound notifications before display", () => {
      const swContent = fs.readFileSync(path.resolve("public/service-worker.js"), "utf-8");
      assert.ok(
        swContent.includes("forbidden = /\\b(win|winning|guaranteed|beat the market|profit|edge)\\b/gi"),
        "SW push listener must include superlative regex sanitizer"
      );
      assert.ok(
        swContent.includes("url: data.url || '/deck'"),
        "SW push must route to /deck cockpit"
      );
    });
  });

  describe("4. PWA Install Prompt & UI Integration", () => {
    it("renders Celestial-themed install banner with trigger and dismiss buttons", () => {
      const html = renderInstallPromptHtml();
      assert.ok(html.includes("id=\"pwa-install-banner\""));
      assert.ok(html.includes("id=\"pwa-install-btn\""));
      assert.ok(html.includes("id=\"pwa-dismiss-btn\""));
      assert.ok(html.includes("Install QuanterraOS Flight Deck"));
      assert.ok(html.includes("window.addEventListener('beforeinstallprompt'"));
      assert.ok(html.includes("display-mode: standalone"));
    });

    it("integrates manifest link and install banner inside /deck HTML", () => {
      const deckHtml = renderFlightDeckPageHtml({
        user: { id: "test", email: "test@example.com", tier: "cadet", callsign: "Prowler", xp: 120 },
        activeStation: "bridge",
      });

      assert.ok(
        deckHtml.includes('<link rel="manifest" href="/manifest.json">'),
        "/deck must include manifest link"
      );
      assert.ok(
        deckHtml.includes('id="pwa-install-banner"'),
        "/deck must include install banner component"
      );
      assert.ok(
        deckHtml.includes('<link rel="apple-touch-icon" href="/assets/icon-192.png">'),
        "/deck must include apple touch icon"
      );
    });
  });

  describe("5. Regulatory Compliance & Non-Advisory Guardrails (Part 0.3)", () => {
    it("proves $0.00 capital deployed and no order routing in mobile/pwa code", () => {
      const swContent = fs.readFileSync(path.resolve("public/service-worker.js"), "utf-8");
      const offlineHtml = fs.readFileSync(path.resolve("public/offline.html"), "utf-8");
      const manifest = fs.readFileSync(path.resolve("public/manifest.json"), "utf-8");

      const combined = (swContent + offlineHtml + manifest).toLowerCase();
      assert.ok(!combined.includes("placeorder("), "No order placement in PWA code");
      assert.ok(!combined.includes("routeorder("), "No order routing in PWA code");
      assert.ok(combined.includes("$0.00"), "Must state $0.00 capital risk");
    });
  });
});
