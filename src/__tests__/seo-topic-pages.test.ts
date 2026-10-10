import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderSeoTopicPageHtml,
  SEO_TOPIC_PAGES,
} from '../seo-topic-pages.ts';

describe('Phase 3 Task 3.5 Acceptance: SEO Topic Pages + Structured FAQ Schema', () => {
  const targetSlugs = [
    'kalshi-fee-calculator',
    'kalshi-btc-settlement-brti',
    'kalshi-vs-polymarket-fees',
    'bitcoin-15-minute-markets',
  ];

  test('all 4 required SEO topic pages exist in config and render valid HTML', () => {
    assert.deepEqual(Object.keys(SEO_TOPIC_PAGES).sort(), targetSlugs.sort());

    for (const slug of targetSlugs) {
      const html = renderSeoTopicPageHtml(slug);
      assert.ok(html !== null, `Page ${slug} must render HTML`);
      assert.ok(html.length > 500, `Page ${slug} must have substantive content`);
    }
  });

  test('each SEO page includes title tag, meta description, and canonical link', () => {
    for (const slug of targetSlugs) {
      const html = renderSeoTopicPageHtml(slug)!;

      // Title tag
      assert.ok(html.includes('<title>'), `Page ${slug} must contain <title>`);
      assert.ok(html.includes('— QuanterraOS</title>'), `Page ${slug} title must include brand`);

      // Meta description
      assert.ok(html.includes('<meta name="description" content="'), `Page ${slug} must have meta description`);

      // Canonical link
      assert.ok(
        html.includes(`<link rel="canonical" href="https://quanterraos.com/${slug}">`),
        `Page ${slug} must contain canonical link`
      );

      // Single <h1> tag
      const h1Matches = html.match(/<h1[^>]*>/g) || [];
      assert.equal(h1Matches.length, 1, `Page ${slug} must have exactly one <h1> tag`);

      // Global Tesla header and footer
      assert.ok(html.includes('tesla-header'), `Page ${slug} must have global tesla-header`);
      assert.ok(html.includes('tesla-footer'), `Page ${slug} must have global tesla-footer`);
    }
  });

  test('each SEO page contains valid, parseable JSON-LD FAQ schema (@type: FAQPage)', () => {
    for (const slug of targetSlugs) {
      const html = renderSeoTopicPageHtml(slug)!;

      // Extract JSON-LD script block
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      assert.ok(jsonLdMatch, `Page ${slug} must contain a JSON-LD script block`);

      const jsonString = jsonLdMatch[1].trim();
      let parsedSchema: any;
      try {
        parsedSchema = JSON.parse(jsonString);
      } catch (err) {
        assert.fail(`JSON-LD on ${slug} failed to parse: ${(err as Error).message}`);
      }

      assert.equal(parsedSchema['@context'], 'https://schema.org');
      assert.equal(parsedSchema['@type'], 'FAQPage');
      assert.ok(Array.isArray(parsedSchema.mainEntity), 'mainEntity must be an array of questions');
      assert.ok(parsedSchema.mainEntity.length >= 3, `Page ${slug} must have at least 3 FAQ items`);

      for (const item of parsedSchema.mainEntity) {
        assert.equal(item['@type'], 'Question');
        assert.ok(item.name && item.name.length > 5, 'Question name must be populated');
        assert.ok(item.acceptedAnswer, 'Question must have acceptedAnswer');
        assert.equal(item.acceptedAnswer['@type'], 'Answer');
        assert.ok(item.acceptedAnswer.text && item.acceptedAnswer.text.length > 10, 'Answer text must be substantive');
      }
    }
  });
});
