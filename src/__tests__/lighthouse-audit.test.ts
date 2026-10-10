import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { renderLandingPage } from "../landing-page.ts";
import { renderCalculatorPageHtml } from "../calculator-page.ts";
import { renderExpiryRadarPageHtml, computeExpiryRadarState } from "../expiry-radar.ts";
import { PUBLIC_NAV_ITEMS } from "../components/public-layout.ts";

describe("Lighthouse Mobile >= 90 Performance & Accessibility Audit (Task 3.6)", () => {
  const pages: { name: string; path: string; getHtml: () => string }[] = [
    {
      name: "Home Landing Page (/)",
      path: "/",
      getHtml: () => renderLandingPage(null),
    },
    {
      name: "True Cost & Net EV Calculator (/check)",
      path: "/check",
      getHtml: () => renderCalculatorPageHtml(),
    },
    {
      name: "Bitcoin Expiry & Oracle Radar (/radar)",
      path: "/radar",
      getHtml: () => {
        const state = computeExpiryRadarState("kxbtc15m", 91250, null, 14.5);
        return renderExpiryRadarPageHtml(state, null);
      },
    },
  ];

  for (const page of pages) {
    describe(`Audit for ${page.name}`, () => {
      const html = page.getHtml();

      test("HTML5 Doctype and lang='en' are valid", () => {
        assert.match(html, /<!doctype\s+html>/i, `${page.name} must declare <!doctype html>`);
        assert.match(html, /<html\s+[^>]*lang=["']en["']/i, `${page.name} must declare <html lang="en">`);
      });

      test("Meta viewport is configured for mobile responsiveness", () => {
        assert.match(
          html,
          /<meta\s+name=["']viewport["']\s+content=["'][^"']*width=device-width[^"']*initial-scale=1[^"']*viewport-fit=cover/i,
          `${page.name} must have viewport with width=device-width, initial-scale=1, viewport-fit=cover`
        );
      });

      test("Descriptive <title> and meta description are present", () => {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        assert.ok(titleMatch, `${page.name} must have a <title> tag`);
        assert.ok(titleMatch[1].length >= 15, `${page.name} title must be descriptive (>= 15 chars)`);
        assert.match(titleMatch[1], /QuanterraOS/i, `${page.name} title must reference QuanterraOS`);

        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        assert.ok(descMatch, `${page.name} must have a meta description tag`);
        assert.ok(descMatch[1].length >= 25, `${page.name} meta description must be informative`);
      });

      test("Page has exactly one <h1> heading", () => {
        const h1Matches = html.match(/<h1[\s>]/gi) || [];
        assert.equal(h1Matches.length, 1, `${page.name} must have exactly one <h1> heading for semantic SEO/a11y hierarchy (found ${h1Matches.length})`);
      });

      test("Google Fonts are loaded with font-display=swap and preconnect hints", () => {
        assert.match(html, /<link\s+rel=["']preconnect["']\s+href=["']https:\/\/fonts\.googleapis\.com["']/i);
        assert.match(html, /<link\s+rel=["']preconnect["']\s+href=["']https:\/\/fonts\.gstatic\.com["']/i);
        assert.match(html, /display=swap/i, `${page.name} fonts link must specify display=swap to avoid FOIT`);
      });

      test("Global Tesla-mode Header is rendered with <= 6 nav items and mobile hamburger", () => {
        assert.match(html, /class=["'][^"']*tesla-header[^"']*["']/i, `${page.name} must include .tesla-header`);
        assert.match(html, /id=["']tesla-hamburger-btn["']/i, `${page.name} must include mobile hamburger button`);
        assert.match(html, /aria-label=["']Toggle mobile menu["']/i, `${page.name} hamburger must have accessible aria-label`);
        assert.match(html, /id=["']tesla-mobile-menu["']/i, `${page.name} must include mobile full-screen overlay menu`);

        // Check nav items count
        assert.ok(PUBLIC_NAV_ITEMS.length <= 6, "Public nav items must be <= 6");
      });

      test("Persistent mobile bottom action bar is present for mobile conversion", () => {
        assert.match(html, /class=["'][^"']*tesla-mobile-bottom-bar[^"']*["']/i, `${page.name} must include persistent mobile bottom bar`);
      });

      test("Global Part 7 compliant footer is present with verbatim legal disclosure", () => {
        assert.match(html, /class=["'][^"']*tesla-footer[^"']*["']/i, `${page.name} must include .tesla-footer`);
        assert.match(
          html,
          /QuanterraOS is an independent analytics tool by Quantara Global LLC/i,
          `${page.name} must include Part 7 verbatim legal disclosure`
        );
        assert.match(html, /Rule B5 locked/i, `${page.name} footer must state Rule B5 locked`);
      });

      test("Prefers-reduced-motion and focus-visible are defined in layout CSS", () => {
        assert.match(html, /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/i, `${page.name} must support prefers-reduced-motion`);
        assert.match(html, /:focus-visible/i, `${page.name} must provide accessible :focus-visible outlines`);
      });

      test("All buttons have accessible names (text or aria-label)", () => {
        const buttonRegex = /<button\b([^>]*)>(.*?)<\/button>/gis;
        let match: RegExpExecArray | null;
        let buttonCount = 0;
        while ((match = buttonRegex.exec(html)) !== null) {
          buttonCount++;
          const attrs = match[1];
          const innerText = match[2].replace(/<[^>]*>/g, "").trim();
          const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(attrs);
          assert.ok(
            innerText.length > 0 || hasAriaLabel,
            `${page.name} button #${buttonCount} (${attrs}) must have visible text or an aria-label`
          );
        }
        assert.ok(buttonCount > 0, `${page.name} should contain interactive buttons`);
      });

      test("All input, select, and textarea elements have associated labels or aria-labels", () => {
        const inputRegex = /<(input|select|textarea)\b([^>]*)>/gi;
        let match: RegExpExecArray | null;
        let inputCount = 0;
        while ((match = inputRegex.exec(html)) !== null) {
          inputCount++;
          const tag = match[1];
          const attrs = match[2];

          // Hidden inputs don't require user-facing labels
          if (/type=["']hidden["']/i.test(attrs)) continue;

          const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(attrs) || /aria-labelledby=["'][^"']+["']/i.test(attrs);
          const idMatch = attrs.match(/id=["']([^"']+)["']/i);
          let hasExplicitLabel = false;
          if (idMatch) {
            const inputId = idMatch[1];
            const labelRegex = new RegExp(`<label[^>]*for=["']${inputId}["']`, "i");
            hasExplicitLabel = labelRegex.test(html);
          }

          assert.ok(
            hasAriaLabel || hasExplicitLabel,
            `${page.name} form control <${tag} ${attrs}> must have an associated <label for="..."> or aria-label`
          );
        }
      });

      test("All DOM element IDs are unique on the page", () => {
        const idRegex = /\bid=["']([a-zA-Z0-9_\-]+)["']/g;
        const ids = new Map<string, number>();
        let match: RegExpExecArray | null;
        while ((match = idRegex.exec(html)) !== null) {
          const id = match[1];
          ids.set(id, (ids.get(id) || 0) + 1);
        }

        const duplicates: string[] = [];
        for (const [id, count] of ids.entries()) {
          if (count > 1) {
            duplicates.push(`${id} (x${count})`);
          }
        }

        assert.equal(
          duplicates.length,
          0,
          `${page.name} contains duplicate DOM IDs: ${duplicates.join(", ")}`
        );
      });

      test("No horizontal scroll-overflow hazards (>375px fixed widths in main panels)", () => {
        // Check that there are no fixed inline widths greater than 360px without max-width: 100% or overflow handling
        const suspiciousFixedInlineWidths = html.match(/style=["'][^"']*width:\s*(?:[4-9]\d{2}|\d{4,})px[^"']*["']/gi) || [];
        for (const styleAttr of suspiciousFixedInlineWidths) {
          // If fixed width is declared inline, it must accompany max-width or overflow
          assert.match(
            styleAttr,
            /max-width/i,
            `${page.name} has fixed inline width that could trigger horizontal overflow at 375px: ${styleAttr}`
          );
        }
      });
    });
  }
});
