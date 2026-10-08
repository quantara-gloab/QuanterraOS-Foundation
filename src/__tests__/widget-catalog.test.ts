import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WIDGET_CATALOG_LIST,
  renderWidgetCatalogHtml,
  type WidgetDefinition,
} from "../widget-catalog.ts";

describe("Widget Catalog & Embed Hub Engine (Sections 6.3 & 6.5)", () => {
  it("1. Catalog Completeness: verifies all 8 sovereign distribution widgets exist", () => {
    assert.equal(WIDGET_CATALOG_LIST.length, 8, "Must contain exactly 8 cataloged embed widgets");

    const ids = WIDGET_CATALOG_LIST.map((w) => w.id);
    assert.ok(ids.includes("friction-calculator"), "Must include friction calculator");
    assert.ok(ids.includes("competitive-referee"), "Must include competitive referee");
    assert.ok(ids.includes("transparency-audit"), "Must include transparency audit");
    assert.ok(ids.includes("settlement-radar"), "Must include settlement radar");
    assert.ok(ids.includes("cross-venue-divergence"), "Must include cross-venue divergence");
    assert.ok(ids.includes("prospective-study"), "Must include prospective study");
    assert.ok(ids.includes("educator-portal"), "Must include educator portal");
    assert.ok(ids.includes("realistic-paper"), "Must include realistic paper mode");
  });

  it("2. Category Coverage: verifies friction, microstructure, and education categorization", () => {
    const categories = new Set(WIDGET_CATALOG_LIST.map((w) => w.category));
    assert.ok(categories.has("friction"), "Must cover friction category");
    assert.ok(categories.has("microstructure"), "Must cover microstructure category");
    assert.ok(categories.has("education"), "Must cover education category");

    for (const widget of WIDGET_CATALOG_LIST) {
      assert.ok(widget.title.length > 5, `Widget ${widget.id} title must be descriptive`);
      assert.ok(widget.description.length > 20, `Widget ${widget.id} description must be detailed`);
      assert.ok(widget.embedUrl.startsWith("/embed/"), `Widget ${widget.id} embedUrl must start with /embed/`);
      assert.ok(widget.keyFeatures.length >= 3, `Widget ${widget.id} must list at least 3 key features`);
      assert.ok(widget.defaultWidth.includes("px") || widget.defaultWidth.includes("%"));
      assert.ok(widget.defaultHeight.includes("px"));
    }
  });

  it("3. Catalog HTML Rendering: verifies layout, interactive controls, and viewport toggles", () => {
    const html = renderWidgetCatalogHtml();

    assert.ok(html.includes("<!DOCTYPE html>"), "Must be valid HTML document");
    assert.ok(html.includes("Distribution Cards &amp; Embeddable Widgets"));
    assert.ok(html.includes('id="filter-bar"'));
    assert.ok(html.includes('id="btn-filter-friction"'));
    assert.ok(html.includes('id="btn-filter-microstructure"'));
    assert.ok(html.includes('id="btn-filter-education"'));
    assert.ok(html.includes('id="preview-iframe"'));
    assert.ok(html.includes('id="code-content"'));
    assert.ok(html.includes('id="btn-copy-snippet"'));
    assert.ok(html.includes('id="btn-vp-full"'));
    assert.ok(html.includes('id="btn-vp-tablet"'));
    assert.ok(html.includes('id="btn-vp-mobile"'));
  });

  it("4. Compliance Guardrails: strictly satisfies Rule B4, Rule B5, and Rule B10", () => {
    const html = renderWidgetCatalogHtml();
    const lower = html.toLowerCase();

    // Rule B4: Zero banned superlatives
    assert.ok(!lower.includes("guaranteed profit"), "Rule B4 violation: guaranteed profit");
    assert.ok(!lower.includes("beat the market"), "Rule B4 violation: beat the market");
    assert.ok(!lower.includes("alpha generation"), "Rule B4 violation: alpha generation");

    // Rule B5: $0.00 capital risk lock
    assert.ok(html.includes("CIRCUIT BREAKER: LOCKED_RULE_B5 ($0.00 CAPITAL RISK)"));

    // Rule B10: Marks notice
    assert.ok(html.includes("Legal &amp; Regulatory Disclosures (Rule B10)"));
    assert.ok(html.includes("Kalshi"));
    assert.ok(html.includes("CME Group"));
    assert.ok(html.includes("Polymarket"));
  });
});
