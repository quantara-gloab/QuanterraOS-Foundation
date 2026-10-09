import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SEARCH_QUERY_ARTICLES,
  getSearchQueryArticle,
  computeArticleHash,
  generateSitemapXml,
  generateRobotsTxt,
  renderQueryHubPageHtml,
  renderSearchQueryPageHtml,
  getSearchQueryManifest,
} from "../indexable-content.ts";
import { calculateKalshiTakerFee } from "../kalshi-contracts.ts";

describe("Programmatic Indexable Content Engine (Section 6.1)", () => {
  it("1. Article Catalog Completeness: verifies all 8 core query guides exist with metadata", () => {
    assert.equal(SEARCH_QUERY_ARTICLES.length, 8, "Must contain exactly 8 comprehensive search query guides");

    const categories = new Set(SEARCH_QUERY_ARTICLES.map((a) => a.category));
    assert.ok(categories.has("fees"), "Must cover fees category");
    assert.ok(categories.has("settlement"), "Must cover settlement category");
    assert.ok(categories.has("calibration"), "Must cover calibration category");
    assert.ok(categories.has("divergence"), "Must cover divergence category");
    assert.ok(categories.has("governance"), "Must cover governance category");

    for (const art of SEARCH_QUERY_ARTICLES) {
      assert.ok(art.slug.length > 0, "Slug must not be empty");
      assert.ok(art.title.length > 10, "Title must be descriptive");
      assert.ok(art.summary.length > 50, "Summary must be substantive");
      assert.ok(art.targetQueries.length >= 3, "Must target at least 3 high-intent search queries");
      assert.ok(art.keyTakeaways.length >= 3, "Must have at least 3 key takeaways");
      assert.ok(art.faqs.length >= 1, "Must contain at least 1 FAQ item for JSON-LD schema");
      assert.ok(art.provenanceCitations.length >= 2, "Must contain provenance citations");
      assert.ok(art.readTimeMinutes > 0, "Read time must be positive");
    }
  });

  it("2. Canonical Route & Slug Lookup: resolves primary slugs and aliases", () => {
    const feeGuide = getSearchQueryArticle("kalshi-fee-formula");
    assert.ok(feeGuide, "Must resolve primary slug");
    assert.equal(feeGuide?.slug, "kalshi-fee-formula");

    const feeAlias = getSearchQueryArticle("kalshi-taker-fees");
    assert.ok(feeAlias, "Must resolve alias");
    assert.equal(feeAlias?.slug, "kalshi-fee-formula");

    const pathLookup = getSearchQueryArticle("/guides/cme-cf-brti-settlement-explained");
    assert.ok(pathLookup, "Must resolve full path lookup");
    assert.equal(pathLookup?.slug, "cme-cf-brti-settlement-explained");

    const nonExistent = getSearchQueryArticle("non-existent-guide-xyz");
    assert.equal(nonExistent, undefined, "Non-existent slug returns undefined");
  });

  it("3. Mathematical Consistency: verifies formula specifications and breakeven calculations", () => {
    const feeGuide = getSearchQueryArticle("kalshi-fee-formula")!;
    assert.ok(feeGuide.formulaMath?.includes("$0.07 × p × (1 - p)"), "Must include official CFTC quadratic formula");

    // Test breakeven calculation at 51¢
    const p = 0.51;
    const fee = calculateKalshiTakerFee(p);
    assert.equal(fee, 0.0175, "Fee at 51¢ must equal 1.75¢ per contract");
    const breakeven = ((p + fee) / 1.0) * 100;
    assert.equal(breakeven.toFixed(2), "52.75", "Breakeven at 51¢ must equal 52.75%");

    // Test hash calculation
    const hash = computeArticleHash(feeGuide);
    assert.equal(hash.length, 64, "Provenance hash must be a 64-character SHA-256 string");
  });

  it("4. Schema.org JSON-LD Structured Data: validates FAQPage and TechArticle schemas", () => {
    const art = SEARCH_QUERY_ARTICLES[0];
    const html = renderSearchQueryPageHtml(art);

    assert.ok(html.includes('"@type": "FAQPage"'), "Rendered HTML must contain FAQPage schema");
    assert.ok(html.includes('"@type": "TechArticle"'), "Rendered HTML must contain TechArticle schema");
    assert.ok(html.includes(art.faqs[0].question), "Schema must contain the first FAQ question");
    assert.ok(html.includes(art.faqs[0].answer), "Schema must contain the first FAQ answer");
    assert.ok(html.includes(art.canonicalPath), "Schema must reference canonical URL");
  });

  it("5. XML Sitemap & Robots.txt Generation: produces valid search engine specifications", () => {
    const sitemap = generateSitemapXml();
    assert.ok(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "Must be valid XML header");
    assert.ok(sitemap.includes("<urlset xmlns="), "Must contain valid urlset opening");
    assert.ok(sitemap.includes("<loc>https://quanterraos.com/guides/kalshi-fee-formula</loc>"), "Must index query guide");
    assert.ok(sitemap.includes("<loc>https://quanterraos.com/why</loc>"), "Must index core platform routes");
    assert.ok(sitemap.includes("<loc>https://quanterraos.com/transparency</loc>"), "Must index outcome report route");
    assert.ok(sitemap.includes("<changefreq>daily</changefreq>"), "Must specify changefreq");
    assert.ok(sitemap.includes("</urlset>"), "Must close urlset");

    const robots = generateRobotsTxt();
    assert.ok(robots.includes("User-agent: *"), "Robots.txt must allow search agents");
    assert.ok(robots.includes("Sitemap: https://quanterraos.com/sitemap.xml"), "Must reference sitemap location");
    assert.ok(robots.includes("Allow: /guides/"), "Must explicitly allow /guides/");
    assert.ok(robots.includes("Allow: /why"), "Must explicitly allow /why");
  });

  it("6. Directory Hub HTML Rendering: renders filterable search interface", () => {
    const hubHtml = renderQueryHubPageHtml();
    assert.ok(hubHtml.includes("Prediction Market Guides &amp; Search Queries"), "Must contain hero title");
    assert.ok(hubHtml.includes("query-search-input"), "Must contain search input box");
    assert.ok(hubHtml.includes("filter-tabs"), "Must contain category filter tabs");
    assert.ok(hubHtml.includes("Section 6.1"), "Must cite Growth Strategy Section 6.1");

    for (const art of SEARCH_QUERY_ARTICLES) {
      assert.ok(hubHtml.includes(art.title), `Hub must index title: ${art.title}`);
      assert.ok(hubHtml.includes(art.canonicalPath), `Hub must link to canonical: ${art.canonicalPath}`);
    }
  });

  it("7. Manifest API: produces structured summary for agents and integrations", () => {
    const manifest = getSearchQueryManifest();
    assert.equal(manifest.length, 8, "Manifest must include all 8 articles");
    assert.equal(manifest[0].slug, "kalshi-fee-formula");
    assert.ok(manifest[0].targetQueries.length >= 3, "Manifest must list target queries");
  });

  it("8. Strict Compliance Guardrails (Rules B4, B5, B10)", () => {
    const hubHtml = renderQueryHubPageHtml();
    const bannedSuperlatives = [
      /\balpha\b/i,
      /\bguaranteed\b/i,
      /\bbeat the market\b/i,
      /\bfree money\b/i,
      /\barbitrage opportunity\b/i,
      /\bmispriced opportunities\b/i,
      /\bworking your capital\b/i,
    ];

    for (const regex of bannedSuperlatives) {
      assert.ok(!regex.test(hubHtml), `Hub HTML must not contain banned word: ${regex}`);
    }

    // Rule B5 check
    assert.ok(hubHtml.includes("Rule B5"), "Hub HTML must reference Rule B5 capital risk lock");

    // Rule B10 mark notices
    assert.ok(hubHtml.includes("Kalshi is a registered mark"), "Hub HTML must include Kalshi mark notice");
    assert.ok(hubHtml.includes("Polymarket is a mark"), "Hub HTML must include Polymarket mark notice");
    assert.ok(hubHtml.includes("CME CF Bitcoin Real-Time Index"), "Hub HTML must include CME benchmark notice");

    // Test individual page
    for (const art of SEARCH_QUERY_ARTICLES) {
      const pageHtml = renderSearchQueryPageHtml(art);
      for (const regex of bannedSuperlatives) {
        assert.ok(!regex.test(pageHtml), `Page ${art.slug} must not contain banned word: ${regex}`);
      }
      assert.ok(pageHtml.includes("Rule B5"), `Page ${art.slug} must cite Rule B5`);
      assert.ok(pageHtml.includes("Kalshi is a registered mark"), `Page ${art.slug} must include Rule B10 notice`);
    }
  });
});
