import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  renderEmbedCalculatorHtml,
  renderEmbedDispersionHtml,
  renderEmbedCountdownHtml,
  renderEmbedCalibrationHtml,
  renderEmbedComparatorHtml,
  renderEmbedLoaderJs,
} from "../embed-widget.ts";
import {
  CANONICAL_V2_WIDGETS,
  WIDGET_CATALOG_LIST,
  renderWidgetCatalogHtml,
} from "../widget-catalog.ts";

describe("Phase 7 Task 7.4 Acceptance: Widgets (Part 3.9), /widgets Gallery & White-Label Flag", () => {
  describe("1. Canonical 5 Embeddable Widgets (Part 3.9)", () => {
    it("exports exactly 5 canonical distribution widgets defined in Part 3.9", () => {
      assert.equal(CANONICAL_V2_WIDGETS.length, 5, "Must define exactly 5 canonical v2 widgets");
      const urls = CANONICAL_V2_WIDGETS.map((w) => w.embedUrl);
      assert.ok(urls.includes("/embed/calculator"), "Must include calculator");
      assert.ok(urls.includes("/embed/dispersion"), "Must include dispersion ticker");
      assert.ok(urls.includes("/embed/countdown"), "Must include countdown timer");
      assert.ok(urls.includes("/embed/calibration"), "Must include calibration badge");
      assert.ok(urls.includes("/embed/comparator"), "Must include cross-venue comparator");
    });

    it("renders Widget 1: Kalshi Fee & Breakeven Calculator (/embed/calculator)", () => {
      const html = renderEmbedCalculatorHtml({ price: 50, count: 10 });
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("id=\"slider-price\""));
      assert.ok(html.includes("id=\"input-count\""));
      assert.ok(html.includes("id=\"res-breakeven\""));
      assert.ok(html.includes("0.07 * count * price * (1 - price)"));
      assert.ok(html.includes("Coin-Flip Hazard Zone"));
      assert.ok(html.includes("CME CF BRTI 60s TWAP"));
    });

    it("renders Widget 2: BRTI-vs-Spot Dispersion Ticker (/embed/dispersion)", () => {
      const html = renderEmbedDispersionHtml({ spotPrice: 91250 });
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("Dispersion"));
      assert.ok(html.includes("Coinbase"));
      assert.ok(html.includes("Kraken"));
      assert.ok(html.includes("Bitstamp"));
      assert.ok(html.includes("Gemini"));
      assert.ok(html.includes("BRTI 60s TWAP Proxy"));
      assert.ok(html.includes("bps"));
      assert.ok(html.includes("Kalshi BTC contracts settle on the 60-second TWAP of the CME CF BRTI index"));
    });

    it("renders Widget 3: Live 15-Min BTC Countdown with Strike Distance (/embed/countdown)", () => {
      const html = renderEmbedCountdownHtml({ spotPrice: 91250 });
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("KXBTC15M"));
      assert.ok(html.includes("Window Expiry In"));
      assert.ok(html.includes("id=\"timer-val\""));
      assert.ok(html.includes("Strike Delta"));
      assert.ok(html.includes("Coin-Flip Zone Alert"));
    });

    it("renders Widget 4: Market vs Model Calibration Badge (/embed/calibration)", () => {
      const html = renderEmbedCalibrationHtml();
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("Market Beats Our Model"));
      assert.ok(html.includes("0.2001"), "Must cite Kalshi Market Mid 0.2001 Brier score");
      assert.ok(html.includes("0.2063"), "Must cite QuanterraOS Model 0.2063 Brier score");
      assert.ok(html.includes("0.2500"), "Must cite Naive Coin-Flip 0.2500 baseline");
      assert.ok(html.includes("n=1,316 SETTLED WINDOWS"));
    });

    it("renders Widget 5: Kalshi vs Polymarket Net-Price Comparator (/embed/comparator)", () => {
      const html = renderEmbedComparatorHtml({ price: 0.51, count: 10 });
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("Kalshi"));
      assert.ok(html.includes("Polymarket"));
      assert.ok(html.includes("CFTC DCM"));
      assert.ok(html.includes("Taker Fee"));
      assert.ok(html.includes("Oracle Settlement Disparity"));
      assert.ok(html.includes("BRTI 60s TWAP"));
      assert.ok(html.includes("UMA Optimistic"));
    });
  });

  describe("2. Theme Switching (Dark & Light)", () => {
    it("applies dark theme styling tokens by default", () => {
      const html = renderEmbedCalculatorHtml({ theme: "dark" });
      assert.ok(html.includes("theme-dark"));
      assert.ok(html.includes("--bg: #06070A"));
    });

    it("applies light theme styling tokens when requested", () => {
      const html = renderEmbedCalculatorHtml({ theme: "light" });
      assert.ok(html.includes("theme-light"));
      assert.ok(html.includes("--bg: #F8FAFC"));
      assert.ok(html.includes("--panel: #FFFFFF"));
    });

    it("supports light theme across all canonical widgets", () => {
      const dispersion = renderEmbedDispersionHtml({ theme: "light" });
      assert.ok(dispersion.includes("theme-light"));

      const countdown = renderEmbedCountdownHtml({ theme: "light" });
      assert.ok(countdown.includes("theme-light"));

      const calibration = renderEmbedCalibrationHtml({ theme: "light" });
      assert.ok(calibration.includes("theme-light"));

      const comparator = renderEmbedComparatorHtml({ theme: "light" });
      assert.ok(comparator.includes("theme-light"));
    });
  });

  describe("3. White-Label Flag Support", () => {
    it("renders 'Powered by QuanterraOS' backlink when whiteLabel is false", () => {
      const calc = renderEmbedCalculatorHtml({ whiteLabel: false });
      assert.ok(calc.includes("Powered by QuanterraOS"), "Must include backlink on free/unbranded mode");
      assert.ok(calc.includes("https://quanterraos.com"), "Must link to QuanterraOS");

      const dispersion = renderEmbedDispersionHtml({ whiteLabel: false });
      assert.ok(dispersion.includes("Powered by QuanterraOS"));

      const countdown = renderEmbedCountdownHtml({ whiteLabel: false });
      assert.ok(countdown.includes("Powered by QuanterraOS"));

      const calibration = renderEmbedCalibrationHtml({ whiteLabel: false });
      assert.ok(calibration.includes("Powered by QuanterraOS"));

      const comparator = renderEmbedComparatorHtml({ whiteLabel: false });
      assert.ok(comparator.includes("Powered by QuanterraOS"));
    });

    it("suppresses 'Powered by QuanterraOS' backlink when whiteLabel is true", () => {
      const calc = renderEmbedCalculatorHtml({ whiteLabel: true });
      assert.ok(!calc.includes("Powered by QuanterraOS"), "Must suppress 'Powered by QuanterraOS'");
      assert.ok(calc.includes("whitelabel-watermark"), "Must render neutral watermark");

      const dispersion = renderEmbedDispersionHtml({ whiteLabel: true });
      assert.ok(!dispersion.includes("Powered by QuanterraOS"));

      const countdown = renderEmbedCountdownHtml({ whiteLabel: true });
      assert.ok(!countdown.includes("Powered by QuanterraOS"));

      const calibration = renderEmbedCalibrationHtml({ whiteLabel: true });
      assert.ok(!calibration.includes("Powered by QuanterraOS"));

      const comparator = renderEmbedComparatorHtml({ whiteLabel: true });
      assert.ok(!comparator.includes("Powered by QuanterraOS"));
    });
  });

  describe("4. Universal JavaScript Embed Loader (/embed/widget.js)", () => {
    it("renders embed loader script with attribute queries and iframe injection", () => {
      const js = renderEmbedLoaderJs();
      assert.ok(js.includes("data-quanterraos-widget") || js.includes("data-widget"));
      assert.ok(js.includes("document.createElement('iframe')"));
      assert.ok(js.includes("postMessage") || js.includes("addEventListener"));
      assert.ok(js.includes("/embed/calculator"));
      assert.ok(js.includes("/embed/dispersion"));
      assert.ok(js.includes("/embed/countdown"));
      assert.ok(js.includes("/embed/calibration"));
      assert.ok(js.includes("/embed/comparator"));
    });
  });

  describe("5. Interactive /widgets Gallery & Code Generation", () => {
    it("renders gallery with theme controls, white-label toggles, and script tab", () => {
      const html = renderWidgetCatalogHtml();
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("Distribution Cards &amp; Embeddable Widgets"));

      // Customizer controls
      assert.ok(html.includes("id=\"btn-theme-dark\""), "Must include dark mode toggle");
      assert.ok(html.includes("id=\"btn-theme-light\""), "Must include light mode toggle");
      assert.ok(html.includes("id=\"btn-wl-standard\""), "Must include standard branding toggle");
      assert.ok(html.includes("id=\"btn-wl-active\""), "Must include white-label toggle");

      // Snippet tabs
      assert.ok(html.includes("id=\"tab-iframe\""), "Must include iframe tab");
      assert.ok(html.includes("id=\"tab-script\""), "Must include script tab");
      assert.ok(html.includes("id=\"tab-markdown\""), "Must include markdown tab");
      assert.ok(html.includes("id=\"btn-copy-snippet\""), "Must include copy code button");

      // Preview iframe
      assert.ok(html.includes("id=\"preview-iframe\""));
      assert.ok(html.includes("id=\"btn-vp-full\""));
      assert.ok(html.includes("id=\"btn-vp-tablet\""));
      assert.ok(html.includes("id=\"btn-vp-mobile\""));
    });

    it("strictly adheres to Rule B4 (zero superlatives) and Rule B5 ($0 live capital)", () => {
      const html = renderWidgetCatalogHtml();
      const lower = html.toLowerCase();
      assert.strictEqual(lower.includes("guaranteed profit"), false);
      assert.strictEqual(lower.includes("beat the market"), false);
      assert.strictEqual(lower.includes("alpha generation"), false);
      assert.ok(html.includes("LOCKED_RULE_B5 ($0.00 CAPITAL RISK)"));
      assert.ok(html.includes("Rule B10"));
    });
  });
});
