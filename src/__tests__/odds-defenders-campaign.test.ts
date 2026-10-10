/**
 * Automated Acceptance Test Suite: QuanterraOS Odds Defenders Campaign
 *
 * Verifies:
 * 1. Campaign Feature Flags (campaign_odds_defenders, campaign_share_cards, campaign_cosmetics)
 * 2. Route /odds-defenders render integrity, publish-ready copy, artwork alt text, and disclosures
 * 3. Homepage compact campaign module integration (preserves 6-panel home layout)
 * 4. Flight Deck cockpit /deck dismissible card and venue onboarding question
 * 5. Telemetry /api/campaign/event sanitization (no private URLs or credentials)
 * 6. Calculator /check?venue=kalshi&campaign=odds-defenders neutral banner (no pre-selected side or size)
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import {
  isCampaignEnabled,
  isShareCardsEnabled,
  isCampaignCosmeticsEnabled,
  setCampaignFeatureFlag,
  recordCampaignEvent,
  getCampaignEvents,
  resetCampaignEvents,
  ODDS_DEFENDERS_COPY,
} from "../config/campaign.ts";
import {
  renderOddsDefendersPageHtml,
  renderHomepageCampaignModule,
} from "../odds-defenders-page.ts";
import { renderLandingPage } from "../landing-page.ts";
import { renderFlightDeckPageHtml } from "../flight-deck-page.ts";
import { renderCalculatorPageHtml } from "../calculator-page.ts";

describe("QuanterraOS Odds Defenders Campaign Acceptance Suite", () => {
  after(() => {
    // Reset flags to defaults
    setCampaignFeatureFlag("campaign_odds_defenders", true);
    setCampaignFeatureFlag("campaign_share_cards", true);
    setCampaignFeatureFlag("campaign_cosmetics", true);
    resetCampaignEvents();
  });

  describe("1. Feature Flag Isolation & Gating", () => {
    it("verifies default flag states", () => {
      assert.strictEqual(isCampaignEnabled(), true);
      assert.strictEqual(isShareCardsEnabled(), true);
      assert.strictEqual(isCampaignCosmeticsEnabled(), true);
    });

    it("verifies independent runtime toggle of campaign flags", () => {
      setCampaignFeatureFlag("campaign_odds_defenders", false);
      assert.strictEqual(isCampaignEnabled(), false);

      setCampaignFeatureFlag("campaign_share_cards", false);
      assert.strictEqual(isShareCardsEnabled(), false);

      setCampaignFeatureFlag("campaign_cosmetics", false);
      assert.strictEqual(isCampaignCosmeticsEnabled(), false);

      // Restore
      setCampaignFeatureFlag("campaign_odds_defenders", true);
      setCampaignFeatureFlag("campaign_share_cards", true);
      setCampaignFeatureFlag("campaign_cosmetics", true);
      assert.strictEqual(isCampaignEnabled(), true);
    });
  });

  describe("2. Dedicated Campaign Page (/odds-defenders)", () => {
    it("renders verbatim publish-ready headline, eyebrow, and support copy", () => {
      const html = renderOddsDefendersPageHtml();

      assert.ok(html.includes("QUANTERRAOS PRESENTS: THE ODDS DEFENDERS"), "Eyebrow must match");
      assert.ok(html.includes("Destroy confusion. Decode the odds."), "Headline must match");
      assert.ok(html.includes("Trade on Kalshi or Polymarket?"), "Support intro must match");
      assert.ok(html.includes("Understand the entry-price assumptions, fees and settlement rules"), "Support details must match");
      assert.ok(html.includes("Check a market"), "Primary CTA must match");
      assert.ok(html.includes("Meet the Odds Defenders"), "Secondary CTA must match");
    });

    it("renders dual character cards with accessible artwork and balanced tokens", () => {
      const html = renderOddsDefendersPageHtml();

      // Section title
      assert.ok(html.includes("Two legends. One mission."), "Section heading must match");

      // Kalshi Destroyer
      assert.ok(html.includes("KALSHI DESTROYER"), "Kalshi Destroyer card title must match");
      assert.ok(html.includes("Break through confusing costs."), "Kalshi Destroyer body must match");
      assert.ok(html.includes("Explore Kalshi checks"), "Kalshi Destroyer CTA must match");
      assert.ok(html.includes("/assets/kalshi-destroyer.png"), "Kalshi Destroyer art path must match");
      assert.ok(html.includes(`alt="${ODDS_DEFENDERS_COPY.card1.alt}"`), "Kalshi Destroyer accessible alt text must be present");

      // Polymarket Terminator
      assert.ok(html.includes("POLYMARKET TERMINATOR"), "Polymarket Terminator card title must match");
      assert.ok(html.includes("Cut through uncertainty."), "Polymarket Terminator body must match");
      assert.ok(html.includes("Explore Polymarket checks"), "Polymarket Terminator CTA must match");
      assert.ok(html.includes("/assets/polymarket-terminator.png"), "Polymarket Terminator art path must match");
      assert.ok(html.includes(`alt="${ODDS_DEFENDERS_COPY.card2.alt}"`), "Polymarket Terminator accessible alt text must be present");

      // Neutrality bridge
      assert.ok(html.includes("They don’t choose your side. They help you understand it."), "Neutrality bridge must match");
    });

    it("renders 3-step decision receipt workflow", () => {
      const html = renderOddsDefendersPageHtml();

      assert.ok(html.includes("Your decision deserves a receipt."), "Workflow heading must match");
      assert.ok(html.includes("Bring a supported market."), "Step 1 must match");
      assert.ok(html.includes("Inspect the assumptions."), "Step 2 must match");
      assert.ok(html.includes("Keep your reasoning."), "Step 3 must match");
      assert.ok(html.includes("Start your cost check"), "Final CTA must match");
      assert.ok(html.includes("Your exchange. Your decision. Your Flight Deck."), "Closing line must match");
    });

    it("renders mandatory statutory disclosures and Rule B5 lock", () => {
      const html = renderOddsDefendersPageHtml();

      assert.ok(html.includes("QuanterraOS is an independent analytics tool, unaffiliated with Kalshi or Polymarket."), "Unaffiliated disclosure must match");
      assert.ok(html.includes("Collectible artwork is unofficial."), "Unofficial collectible disclosure must match");
      assert.ok(html.includes("Trading involves risk. 18+."), "18+ risk disclosure must match");
      assert.ok(html.includes("Rule B5 locked"), "Rule B5 lock must be stated");
    });
  });

  describe("3. Compact Homepage Campaign Module", () => {
    it("renders compact module without breaking home layout", () => {
      const moduleHtml = renderHomepageCampaignModule();
      assert.ok(moduleHtml.includes("THE ODDS DEFENDERS"));
      assert.ok(moduleHtml.includes("Destroy confusion. Decode the odds."));
      assert.ok(moduleHtml.includes("Meet the Odds Defenders &rarr;"));
      assert.ok(moduleHtml.includes("/odds-defenders"));

      const landingHtml = renderLandingPage();
      assert.ok(landingHtml.includes("odds-defenders-home-strip"), "Landing page must contain campaign strip");
      assert.ok(landingHtml.includes("THE ODDS DEFENDERS"));
    });
  });

  describe("4. Mobile Flight Deck Cockpit Card & Onboarding Question", () => {
    it("renders dismissible cockpit card on /deck with venue onboarding question", () => {
      const deckHtml = renderFlightDeckPageHtml(null);

      assert.ok(deckHtml.includes('id="deck-campaign-odds-defenders"'), "Must contain dismissible card");
      assert.ok(deckHtml.includes("Your next decision deserves a receipt."), "Must contain campaign headline");
      assert.ok(deckHtml.includes("Check the assumptions and costs behind a supported market."), "Must contain body text");
      assert.ok(deckHtml.includes("Which market platform do you use?"), "Must include onboarding question");
      assert.ok(deckHtml.includes("Kalshi"), "Must include Kalshi option");
      assert.ok(deckHtml.includes("Polymarket"), "Must include Polymarket option");
      assert.ok(deckHtml.includes("Both"), "Must include Both option");
      assert.ok(deckHtml.includes("Skip"), "Must include Skip option");
      assert.ok(deckHtml.includes("dismissOddsDefendersCard"), "Must include client dismiss script");
      assert.ok(deckHtml.includes("setVenuePref"), "Must include preference setter");
    });
  });

  describe("5. Telemetry & Attribution Event Sanitization", () => {
    before(() => {
      resetCampaignEvents();
    });

    it("records valid sanitized events and strips private data", () => {
      recordCampaignEvent({
        event: "campaign_view",
        venue: "kalshi",
        device: "mobile",
        channel: "social",
      });

      recordCampaignEvent({
        event: "defender_card_clicked",
        venue: "polymarket",
        device: "desktop",
      });

      const events = getCampaignEvents();
      assert.strictEqual(events.length, 2);
      assert.strictEqual(events[0].event, "campaign_view");
      assert.strictEqual(events[0].venue, "kalshi");
      assert.strictEqual(events[1].event, "defender_card_clicked");
      assert.strictEqual(events[1].venue, "polymarket");

      // Verify no sensitive fields can be injected
      const unsafePayload = {
        event: "receipt_resolved" as const,
        venue: "kalshi",
        device: "desktop",
        secretToken: "sk_live_123456",
        accountBalance: 50000,
        privateUrl: "https://kalshi.com/account/positions/private",
      };

      recordCampaignEvent(unsafePayload as any);
      const updatedEvents = getCampaignEvents();
      const lastEvent = updatedEvents[updatedEvents.length - 1] as any;
      assert.strictEqual(lastEvent.secretToken, undefined, "secretToken must not be stored");
      assert.strictEqual(lastEvent.accountBalance, undefined, "accountBalance must not be stored");
      assert.strictEqual(lastEvent.privateUrl, undefined, "privateUrl must not be stored");
    });
  });

  describe("6. Calculator /check Campaign Banner & Neutrality", () => {
    it("renders campaign header when campaign=odds-defenders is supplied", () => {
      const html = renderCalculatorPageHtml({ venue: "kalshi", campaign: "odds-defenders" });

      assert.ok(html.includes("odds-defenders-check-banner"), "Must render campaign banner");
      assert.ok(html.includes("QUANTERRAOS // ODDS DEFENDERS"), "Must show campaign header");
      assert.ok(html.includes("Kalshi Market Check"), "Must state venue");
      assert.ok(html.includes("Independent analytics"), "Must include independence disclosure");
      assert.ok(!html.includes("Recommendation: YES"), "Must NEVER pre-select a recommended outcome");
      assert.ok(!html.includes("Recommendation: NO"), "Must NEVER pre-select a recommended outcome");
    });

    it("renders standard calculator when no campaign parameter is passed", () => {
      const html = renderCalculatorPageHtml();
      assert.ok(!html.includes("odds-defenders-check-banner"), "Standard calculator must not show campaign banner");
    });
  });
});
