/**
 * Acceptance Test Suite: Phase 8 Task 8.2
 * Mobile Polish: Share-Sheet Intake (Web Share Target API & Contract Pre-filling)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseSharedContractInput } from "../lib/share-target.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";

describe("Phase 8 Task 8.2 Acceptance: Share-Sheet Intake Engine (Part 3.11)", () => {
  describe("1. URL & Text Parser Engine (parseSharedContractInput)", () => {
    it("parses canonical Kalshi market URLs and query parameters", () => {
      const url = "https://kalshi.com/markets/kxbtc15m/bitcoin-15-minute?price=54&count=25&strike=88500";
      const parsed = parseSharedContractInput(url);

      assert.strictEqual(parsed.isRecognized, true);
      assert.strictEqual(parsed.venue, "kalshi");
      assert.strictEqual(parsed.ticker, "KXBTC15M");
      assert.strictEqual(parsed.price, 0.54);
      assert.strictEqual(parsed.priceCents, 54);
      assert.strictEqual(parsed.contracts, 25);
      assert.strictEqual(parsed.strike, 88500);
    });

    it("parses Kalshi anchor hash tickers", () => {
      const url = "https://kalshi.com/markets/kxbtc/bitcoin-price#KXBTC15M-25OCT14-0445";
      const parsed = parseSharedContractInput(url);

      assert.strictEqual(parsed.venue, "kalshi");
      assert.strictEqual(parsed.ticker, "KXBTC15M-25OCT14-0445");
      assert.strictEqual(parsed.isRecognized, true);
    });

    it("parses Polymarket event URLs", () => {
      const url = "https://polymarket.com/event/bitcoin-above-88000-on-october-14?price=53&count=15";
      const parsed = parseSharedContractInput(url);

      assert.strictEqual(parsed.isRecognized, true);
      assert.strictEqual(parsed.venue, "polymarket");
      assert.strictEqual(parsed.price, 0.53);
      assert.strictEqual(parsed.priceCents, 53);
      assert.strictEqual(parsed.contracts, 15);
    });

    it("parses unstructured shared social/chat text snippets", () => {
      const snippet = "Take a look at KXBTC15M-25OCT14-0445 @ 52c x20 contracts https://kalshi.com";
      const parsed = parseSharedContractInput(snippet);

      assert.strictEqual(parsed.isRecognized, true);
      assert.strictEqual(parsed.venue, "kalshi");
      assert.strictEqual(parsed.ticker, "KXBTC15M-25OCT14-0445");
      assert.strictEqual(parsed.price, 0.52);
      assert.strictEqual(parsed.priceCents, 52);
      assert.strictEqual(parsed.contracts, 20);
    });

    it("handles fallback and invalid inputs gracefully without throwing", () => {
      const empty = parseSharedContractInput("");
      assert.strictEqual(empty.isRecognized, false);
      assert.strictEqual(empty.ticker, "KXBTC15M");
      assert.strictEqual(empty.price, 0.51);

      const garbage = parseSharedContractInput("hello world random text");
      assert.strictEqual(garbage.isRecognized, false);
      assert.ok(garbage.price > 0);
    });
  });

  describe("2. Flight Deck Server-Side Pre-Filling (/deck?url=...)", () => {
    it("automatically selects Engineering station and displays shared intake banner", () => {
      const shared = parseSharedContractInput(
        "https://kalshi.com/markets/kxbtc15m/bitcoin-15-minute?price=56&count=40"
      );

      const html = renderFlightDeckPageHtml({
        sharedContract: shared,
        user: { id: "test", email: "pilot@quanterraos.com", tier: "pilot", xp: 300 },
      });

      // Engineering station must be active
      assert.ok(
        html.includes('id="station-panel-engineering" aria-label="Engineering Station"'),
        "Engineering station panel must exist"
      );
      assert.ok(
        html.includes('station-panel active" id="station-panel-engineering"'),
        "Engineering station must be set to active panel"
      );

      // Shared contract banner must be visible
      assert.ok(
        html.includes('id="shared-contract-banner"'),
        "Shared contract banner must be rendered"
      );
      assert.ok(
        html.includes('style="display:flex;'),
        "Shared banner must be visible with display:flex"
      );
      assert.ok(
        html.includes("WEB SHARE TARGET INTAKE // CONTRACT PRE-FILLED"),
        "Banner eyebrow missing"
      );
      assert.ok(
        html.includes("KXBTC15M"),
        "Shared ticker must appear in banner"
      );
      assert.ok(
        html.includes("56¢"),
        "Shared price must appear in pre-fill summary"
      );
      assert.ok(
        html.includes("40 ct"),
        "Shared contracts quantity must appear in pre-fill summary"
      );
    });

    it("hides the shared banner when no shared link is provided", () => {
      const html = renderFlightDeckPageHtml({
        initialStation: "bridge",
        user: { id: "test", email: "pilot@quanterraos.com" },
      });

      assert.ok(
        html.includes('id="shared-contract-banner" class="hud-card" style="display:none;'),
        "Shared banner must be hidden (display:none) when no share payload provided"
      );
    });
  });

  describe("3. Client-Side Web Share Target Script Integrity", () => {
    it("contains client script to inspect URL share parameters and update inputs", () => {
      const html = renderFlightDeckPageHtml();
      assert.ok(
        html.includes("params.get('url') || params.get('text') || params.get('share')"),
        "Client script must check for URL share parameters"
      );
      assert.ok(
        html.includes("switchStation('engineering')"),
        "Client script must switch to engineering station on shared input"
      );
      assert.ok(
        html.includes("/api/share/parse?input="),
        "Client script must query share parser API"
      );
    });
  });

  describe("4. Web Manifest Share Target Specification", () => {
    it("verifies public/manifest.json contains valid share_target declaration", () => {
      const manifest = JSON.parse(fs.readFileSync(path.resolve("public/manifest.json"), "utf-8"));
      assert.ok(manifest.share_target, "manifest.json must declare share_target");
      assert.strictEqual(manifest.share_target.action, "/deck");
      assert.strictEqual(manifest.share_target.method, "GET");
      assert.strictEqual(manifest.share_target.params.url, "url");
      assert.strictEqual(manifest.share_target.params.text, "text");
    });
  });

  describe("5. Regulatory & Non-Advisory Guardrails (Rule B4 & Rule B5)", () => {
    it("confirms zero order routing and zero buy/sell recommendations in share intake", () => {
      const code = fs.readFileSync(path.resolve("src/lib/share-target.ts"), "utf-8");
      assert.ok(!code.includes("placeOrder"), "Zero live order placement");
      assert.ok(!code.includes("executeTrade"), "Zero trade execution");
      assert.ok(!code.toLowerCase().includes("buy recommendation"), "Zero buy recommendations");
      assert.ok(!code.toLowerCase().includes("guaranteed profit"), "Zero profit claims");
    });
  });
});
