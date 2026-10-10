import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderLandingPage } from "../landing-page.ts";

describe("Landing Page — 90-Day Execution Roadmap & Microstructure Cockpit Verification", () => {
  const html = renderLandingPage();

  it("1. Navigation Links: includes all 6 core 90-day plan tools in primary consumer navigation", () => {
    assert.ok(html.includes('href="/calculator"'));
    assert.ok(html.includes('href="/paper"'));
    assert.ok(html.includes('href="/compare"'));
    assert.ok(html.includes('href="/radar"'));
    assert.ok(html.includes('href="/flow"'));
    assert.ok(html.includes('href="/matrix"'));
    assert.ok(html.includes('href="/journal"'));
    assert.ok(html.includes('href="/settlement"'));
  });

  it("2. Microstructure Cockpit Section: renders all 6 specialized terminal cards with deep links", () => {
    assert.ok(html.includes('id="roadmap-cockpit"'));
    assert.ok(html.includes("Active Prediction Market Microstructure Cockpit"));

    // Card 1: Realistic Paper Mode
    assert.ok(html.includes("Simulation Mode &bull; Realistic Paper Mode"));
    assert.ok(html.includes("Practice Without Deposits"));
    assert.ok(html.includes('href="/paper"'));

    // Card 2: Validated Forecast Comparison
    assert.ok(html.includes("Calibration Audit &bull; Prospective Value Study"));
    assert.ok(html.includes("Forecast Comparison &amp; Audit"));
    assert.ok(html.includes('href="/compare"'));

    // Card 3: All-Strike Depth Matrix
    assert.ok(html.includes("All-Strike Liquidity Wall Matrix"));
    assert.ok(html.includes('href="/matrix"'));

    // Card 4: Order Book Liquidity Flow
    assert.ok(html.includes("Order Book Liquidity Flow"));
    assert.ok(html.includes('href="/flow"'));

    // Card 5: Audio Sonification
    assert.ok(html.includes("Live Microstructure Sonification"));
    assert.ok(html.includes('href="/radar/audio"'));

    // Card 6: Calibration Decomposition
    assert.ok(html.includes("Calibration Explorer &amp; Decomposition"));
    assert.ok(html.includes('href="/calibration/explorer"'));
  });

  it("3. Strict Regulatory Guardrails: satisfies Rule B4, Rule B5, and Rule B10", () => {
    // Rule B5: $0.00 Live Exposure
    assert.ok(html.includes("$0.00"));
    assert.ok(html.includes("RULE B5 LOCKED") || html.includes("zero live capital"));

    // Rule B10: Marks notice
    assert.ok(html.includes("Kalshi"));
    assert.ok(html.includes("CME Group"));
    assert.ok(html.includes("CF Benchmarks"));

    // Rule B4: Banned language audit (no promotional edge/alpha/guarantee claims)
    const bannedPhrases = [
      /\balpha\b/i,
      /\bguaranteed\b/i,
      /\bwe beat the market\b/i,
      /\bcan beat the market\b/i,
      /\barbitrage opportunity\b/i,
      /\bmispriced opportunities\b/i,
      /\bworking your capital\b/i,
    ];

    for (const pattern of bannedPhrases) {
      assert.doesNotMatch(html, pattern, `Landing page HTML must not contain banned word: ${pattern}`);
    }
  });

  it("4. Competitive Showcase: renders 2026 Competitive Teardown, simulator sliders, and Independent Referee section", () => {
    assert.ok(html.includes('id="why-quanterraos-showcase"'));
    assert.ok(html.includes("The Independent Referee in an Acquired Market"));
    assert.ok(html.includes('id="home-teardown-price"'));
    assert.ok(html.includes('id="home-teardown-prob"'));
    assert.ok(html.includes('id="home-teardown-count"'));
    assert.ok(html.includes('id="home-out-comp-ev"'));
    assert.ok(html.includes('id="home-out-real-ev"'));
    assert.ok(html.includes('id="home-out-real-hurdle"'));
    assert.ok(html.includes('href="/why"'));
  });

  it("5. Contender Matrix & Hero Proof Strip: verifies leading contender architectural superiority", () => {
    // Hero proof strip
    assert.ok(html.includes("hero-contender-proof-strip"));
    assert.ok(html.includes("1,316 Settled Contracts"));
    assert.ok(html.includes("0.2001 Brier Benchmark Verified"));
    assert.ok(html.includes("100% Venue-Neutral"));

    // Battlecard matrix
    assert.ok(html.includes("ARCHITECTURAL SUPERIORITY // 2026 BENCHMARK MATRIX"));
    assert.ok(html.includes("Why QuanterraOS Leads the Field"));
    assert.ok(html.includes("battlecard-matrix-wrap"));
    assert.ok(html.includes("filterBattlecard"));
    assert.ok(html.includes("Parabolic Fee Deduction Engine"));
    assert.ok(html.includes("Empirical Murphy Brier Decomposition"));
    assert.ok(html.includes("Anti-Dispute AI Auditor"));
    assert.ok(html.includes("CC-BY-4.0 Canonical Datasets Hub"));

    // Neutral Sourced Independence Architecture (Task 1.5)
    assert.ok(html.includes("Independent Venue-Neutral Architecture"));
    assert.ok(html.includes("QuanterraOS is an independent analytics flight deck"));
    assert.ok(html.includes("zero exchange kickbacks or referral fees"));
  });

  it("6. Mobile App Gateway: renders prominent iPhone & Samsung direct links next to Sign up and in hero", () => {
    // Top banner
    assert.ok(html.includes("mobile-app-top-strip"));
    assert.ok(html.includes("Apple iPhone &amp; Samsung Galaxy"));
    assert.ok(html.includes('href="/mobile"'));

    // Top navbar action group (Mobile App next to Sign up and Sign in)
    assert.ok(html.includes("nav-pill-mobile-app"));
    assert.ok(html.includes("iPhone &amp; Samsung App"));
    assert.ok(html.includes('href="/account?flow=sign-up"'));
    assert.ok(html.includes("Sign up"));
    assert.ok(html.includes("Sign in"));

    // Hero action button
    assert.ok(html.includes("Mobile App: iPhone &amp; Samsung"));
  });
});
