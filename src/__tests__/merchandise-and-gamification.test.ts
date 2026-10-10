/**
 * Acceptance Test Suite: QuanterraOS Official Merchandise, Raffles & Tournaments
 *
 * Verifies:
 * 1. Product Catalog: Mascot Hoodies, Flight Jumpsuits, and Executive Suits (Men's & Women's)
 * 2. Order Creation: Sizing, Gender Cuts, Cash and Flight XP Points checkout
 * 3. Gamification Rewards: Raffles, Point System (Flight XP), and Calibration Tournaments
 * 4. Storefront HTML Rendering: /merchandise, Category Filters, Interactive Modals
 * 5. Compliance & Safety: Rule B5 locked ($0.00 capital deployed; non-wagering), 18+ disclosures
 * 6. Navigation Integrity: PUBLIC_NAV_ITEMS length <= 6
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  CANONICAL_MERCHANDISE,
  ACTIVE_RAFFLES,
  ACTIVE_TOURNAMENTS,
  getMerchandiseCatalog,
  getMerchandiseProduct,
  createMerchandiseOrder,
  enterRaffle,
  joinTournament,
  getUserGamificationSummary,
} from "../lib/merchandise.ts";
import { renderMerchandisePageHtml } from "../merchandise-page.ts";
import { PUBLIC_NAV_ITEMS, renderPublicFooter } from "../components/public-layout.ts";

describe("QuanterraOS Merchandise & Gamification Rewards Acceptance Suite", () => {
  describe("1. Mascot Apparel Catalog & Category Diversity", () => {
    it("contains all required product categories: hoodies, jumpsuits, and suits for men & women", () => {
      const all = getMerchandiseCatalog("all");
      assert.ok(all.length >= 8, "Must contain at least 8 flagship products");

      // Hoodies
      const hoodies = getMerchandiseCatalog("hoodie");
      assert.ok(hoodies.length >= 3, "Must have at least 3 mascot hoodies");
      const quantaHoodie = hoodies.find(h => h.mascot === "quanta");
      const destroyerHoodie = hoodies.find(h => h.mascot === "destroyer");
      const terminatorHoodie = hoodies.find(h => h.mascot === "terminator");
      assert.ok(quantaHoodie, "Must include Quanta hoodie");
      assert.ok(destroyerHoodie, "Must include Kalshi Destroyer hoodie");
      assert.ok(terminatorHoodie, "Must include Polymarket Terminator hoodie");

      // Jumpsuits
      const jumpsuits = getMerchandiseCatalog("jumpsuit");
      assert.ok(jumpsuits.length >= 2, "Must have at least 2 flight jumpsuits");
      const quantaJumpsuit = jumpsuits.find(j => j.mascot === "quanta");
      assert.ok(quantaJumpsuit, "Must include Quanta Flight Jumpsuit");

      // Business Professional Suits (Men's & Women's)
      const suits = getMerchandiseCatalog("suits");
      assert.ok(suits.length >= 2, "Must have executive suits");
      const mensSuit = suits.find(s => s.category === "suit_mens");
      const womensSuit = suits.find(s => s.category === "suit_womens");
      assert.ok(mensSuit, "Must include Men's tailored executive suit");
      assert.ok(womensSuit, "Must include Women's tailored executive suit");
      assert.ok(mensSuit.description.includes("Super 130s"), "Suit must feature premium Italian virgin wool");
      assert.ok(womensSuit.description.includes("Super 130s"), "Women's suit must feature premium Italian virgin wool");
    });

    it("verifies dual currency pricing (USD and Flight XP points)", () => {
      for (const product of CANONICAL_MERCHANDISE) {
        assert.ok(product.priceCents > 0, `${product.name} must have USD price`);
        assert.ok(product.pointsCost > 0, `${product.name} must have Flight XP points cost`);
        assert.ok(product.availableSizes.length > 0, `${product.name} must provide sizes`);
        assert.ok(product.genderCuts.length > 0, `${product.name} must provide gender cuts`);
      }
    });
  });

  describe("2. Order Dispatch Engine & Points Redemption", () => {
    it("creates a standard USD order with size and tailored cut", () => {
      const order = createMerchandiseOrder({
        userId: "pilot_michael",
        customerName: "Michael Quantara",
        customerEmail: "michael@quanterraos.com",
        productId: "prod_suit_mens",
        size: "40R",
        genderCut: "Men's Classic Tailored",
        quantity: 1,
        shippingAddress: {
          street: "1201 N Orange St",
          city: "Wilmington",
          state: "DE",
          zip: "19801",
          country: "US",
        },
      });

      assert.strictEqual(order.success, true);
      assert.ok(order.orderId.startsWith("ord_"));
      assert.strictEqual(order.order.productName, "Spacecraft Council Executive Suit — Men's Tailored Cut");
      assert.strictEqual(order.order.size, "40R");
      assert.strictEqual(order.order.genderCut, "Men's Classic Tailored");
      assert.strictEqual(order.order.totalCents, 65000);
      assert.strictEqual(order.order.pointsSpent, 0);
      assert.strictEqual(order.xpEarned, 6500, "Must earn 10 XP per dollar spent");
      assert.ok(order.trackingNumberPreview.startsWith("QOS-FLIGHT-"));
    });

    it("creates a Flight XP points redemption order with zero cash outlay", () => {
      const order = createMerchandiseOrder({
        userId: "cadet_winner",
        customerName: "Flight Cadet Winner",
        customerEmail: "cadet@quanterraos.com",
        productId: "prod_hoodie_destroyer",
        size: "L",
        genderCut: "Unisex Heavy",
        quantity: 1,
        usePoints: true,
        shippingAddress: {
          street: "Flight Deck Hangar 4",
          city: "Wilmington",
          state: "DE",
          zip: "19801",
          country: "US",
        },
      });

      assert.strictEqual(order.success, true);
      assert.strictEqual(order.order.totalCents, 0, "Points orders must have $0 cash total");
      assert.strictEqual(order.order.pointsSpent, 4800, "Must deduct points");
    });

    it("rejects order with invalid product ID", () => {
      assert.throws(
        () => createMerchandiseOrder({
          customerName: "Jane Doe",
          customerEmail: "jane@test.com",
          productId: "nonexistent_fake_item",
          size: "M",
          shippingAddress: { street: "123 Main", city: "X", state: "Y", zip: "Z", country: "US" },
        }),
        /Invalid product ID/i
      );
    });
  });

  describe("3. Gamification: Raffles & Calibration Tournaments", () => {
    it("enters user into active gear raffle", () => {
      const ticket = enterRaffle({
        userId: "pilot_sarah",
        raffleId: "raffle_october_2026_suit",
        source: "daily_check_reward",
      });

      assert.strictEqual(ticket.success, true);
      assert.ok(ticket.ticketNumber.startsWith("TKT-"));
      assert.strictEqual(ticket.raffleTitle, "October 2026 Grand Raffle");
      assert.ok(ticket.prizeName.includes("Executive Suit"));
    });

    it("registers user for discipline calibration tournament", () => {
      const entry = joinTournament({
        userId: "pilot_sarah",
        callsign: "VALKYRIE-1",
        tournamentId: "tourn_season_4_brier_cup",
      });

      assert.strictEqual(entry.success, true);
      assert.strictEqual(entry.callsign, "VALKYRIE-1");
      assert.strictEqual(entry.tournamentTitle, "Season 4: CME CF BRTI 60s Dispersion Cup");
      assert.ok(entry.prizes.includes("Bespoke Executive Suit"));
    });

    it("fetches user gamification profile summary", () => {
      const profile = getUserGamificationSummary("cadet-1");
      assert.ok(profile.flightXp > 0);
      assert.ok(profile.streakDays > 0);
      assert.ok(profile.raffleTicketsCount >= 0);
      assert.ok(profile.tournamentRank > 0);
    });
  });

  describe("4. Storefront HTML Rendering & UI Integrity (/merchandise)", () => {
    it("renders full merchandise catalog, category filters, and interactive modals", () => {
      const html = renderMerchandisePageHtml(null);

      // Hero & Headline
      assert.ok(html.includes("QUANTERRAOS FLIGHT GEAR // OFFICIAL MERCHANDISE"), "Must render eyebrow");
      assert.ok(html.includes("Wear the Discipline. Master the Odds."), "Must render headline");

      // Categories
      assert.ok(html.includes("Mascot Hoodies"), "Must include Mascot Hoodies tab");
      assert.ok(html.includes("Flight Jumpsuits"), "Must include Flight Jumpsuits tab");
      assert.ok(html.includes("Executive Suits (Men&#39;s)") || html.includes("Executive Suits (Men's)"), "Must include Men's suits tab");
      assert.ok(html.includes("Executive Suits (Women&#39;s)") || html.includes("Executive Suits (Women's)"), "Must include Women's suits tab");
      assert.ok(html.includes("Win Prizes (Raffles &amp; Tournaments)"), "Must include Raffles & Tournaments tab");

      // Specific Products
      assert.ok(html.includes("Quanta Ceramic Flight Hoodie"), "Must render Quanta Hoodie");
      assert.ok(html.includes("Kalshi Destroyer Obsidian Hoodie"), "Must render Kalshi Destroyer Hoodie");
      assert.ok(html.includes("Polymarket Terminator Orbital Tech Hoodie"), "Must render Polymarket Terminator Hoodie");
      assert.ok(html.includes("Quanta Flight Pilot Aerospace Jumpsuit"), "Must render Quanta Jumpsuit");
      assert.ok(html.includes("Spacecraft Council Executive Suit — Men&#39;s Tailored Cut") || html.includes("Spacecraft Council Executive Suit — Men's Tailored Cut"), "Must render Men's Suit");
      assert.ok(html.includes("Spacecraft Council Executive Suit — Women&#39;s Tailored Cut") || html.includes("Spacecraft Council Executive Suit — Women's Tailored Cut"), "Must render Women's Suit");

      // Raffles & Tournaments
      assert.ok(html.includes("October 2026 Grand Raffle"), "Must render Grand Raffle");
      assert.ok(html.includes("Season 4: CME CF BRTI 60s Dispersion Cup"), "Must render Tournament");
      assert.ok(html.includes("PILOT-VALKYRIE"), "Must render Leaderboard top pilot");

      // Interactive Order Modal
      assert.ok(html.includes('id="order-modal-backdrop"'), "Must include order modal");
      assert.ok(html.includes('id="modal-size-select"'), "Must include size selector");
      assert.ok(html.includes('id="modal-cut-select"'), "Must include cut selector");
    });

    it("strictly displays Rule B5 and non-gambling statutory disclosures", () => {
      const html = renderMerchandisePageHtml(null);

      assert.ok(html.includes("Rule B5 locked ($0.00 capital deployed)"), "Must disclose Rule B5 lock");
      assert.ok(html.includes("18+"), "Must disclose 18+ age restriction");
      assert.ok(html.includes("non-gambling educational features"), "Must explicitly state non-gambling rewards");
    });
  });

  describe("5. Navigation & Layout Integration", () => {
    it("ensures public navigation items count is <= 6 with Gear included", () => {
      assert.ok(PUBLIC_NAV_ITEMS.length <= 6, `PUBLIC_NAV_ITEMS length (${PUBLIC_NAV_ITEMS.length}) must be <= 6`);
      const gearNav = PUBLIC_NAV_ITEMS.find(item => item.label === "Gear");
      assert.ok(gearNav, "PUBLIC_NAV_ITEMS must include Gear");
      assert.strictEqual(gearNav.href, "/merchandise");
    });

    it("verifies public footer includes link to /merchandise", () => {
      const footerHtml = renderPublicFooter();
      assert.ok(footerHtml.includes("/merchandise"), "Footer must include link to /merchandise");
      assert.ok(footerHtml.includes("Mascot Gear &amp; Suits"), "Footer must have Mascot Gear & Suits label");
    });
  });
});
