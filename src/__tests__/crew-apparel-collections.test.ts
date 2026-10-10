import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ORIGINAL_EIGHT_COLLECTIONS,
  CREW_OUTFIT_CATALOG,
  getCrewCollection,
  getCrewOutfits,
  recordApparelInterest,
} from "../lib/crew-apparel-catalog.ts";
import { renderCrewApparelPageHtml } from "../crew-apparel-page.ts";

describe("Original Eight Council Apparel Collections & Leader Line", () => {
  it("defines the eight canonical council collections and one leader collection", () => {
    const expectedCouncilSlugs = [
      "draco",
      "wolf",
      "falcon",
      "quantum-fox",
      "sentinel",
      "kraken",
      "lion",
      "phoenix",
    ];

    const councilCollections = ORIGINAL_EIGHT_COLLECTIONS.filter((c) => !c.isLeader);
    assert.strictEqual(councilCollections.length, 8, "Must contain exactly 8 original council collections");

    for (const slug of expectedCouncilSlugs) {
      const col = getCrewCollection(slug);
      assert.ok(col, `Missing collection for slug: ${slug}`);
      assert.ok(col.signaturePalette, `Collection ${slug} must have signaturePalette`);
      assert.ok(col.apparelMotif, `Collection ${slug} must have apparelMotif`);
      assert.ok(col.boardImage, `Collection ${slug} must have boardImage`);
      assert.strictEqual(col.boardImage, `/assets/${slug}-apparel-board.png`);
    }

    const leaderCol = getCrewCollection("quanta");
    assert.ok(leaderCol, "Quanta & Quantana leader collection must exist");
    assert.strictEqual(leaderCol.isLeader, true);
    assert.ok(
      leaderCol.boardImage === "/assets/king-queen-galaxy-board.png" ||
      leaderCol.boardImage === "/assets/quanta-leader-apparel-board.png"
    );
  });

  it("contains 32 council outfits plus 4 leader outfits (36 total) with strict concept state", () => {
    assert.strictEqual(CREW_OUTFIT_CATALOG.length, 36, "Must define 32 council outfits + 4 leader outfits = 36 total");

    for (const outfit of CREW_OUTFIT_CATALOG) {
      assert.strictEqual(outfit.state, "concept", `Outfit ${outfit.productId} must be in concept state`);
      assert.strictEqual(outfit.price, null, `Outfit ${outfit.productId} price must be null`);
      assert.strictEqual(outfit.checkoutEnabled, false, `Outfit ${outfit.productId} checkout must be disabled`);
      assert.strictEqual(outfit.supplierVerified, false, `Outfit ${outfit.productId} supplier must not be verified`);
      assert.strictEqual(outfit.isConcept, true, `Outfit ${outfit.productId} must have isConcept=true`);
      assert.ok(outfit.includedPieces.length >= 2, `Outfit ${outfit.productId} must include at least 2 pieces`);
      assert.ok(outfit.piecesDescription, `Outfit ${outfit.productId} must have piecesDescription`);
    }
  });

  it("filters outfits by fit (men/women) and category (street/flight)", () => {
    const dracoAll = getCrewOutfits("draco");
    assert.strictEqual(dracoAll.length, 4);

    const dracoMen = getCrewOutfits("draco", { fit: "men" });
    assert.strictEqual(dracoMen.length, 2);

    const dracoWomen = getCrewOutfits("draco", { fit: "women" });
    assert.strictEqual(dracoWomen.length, 2);

    const dracoStreet = getCrewOutfits("draco", { category: "street" });
    assert.strictEqual(dracoStreet.length, 2);

    const dracoFlight = getCrewOutfits("draco", { category: "flight" });
    assert.strictEqual(dracoFlight.length, 2);
  });

  it("renders collection page HTML with notice, filters, board artwork, and modal markup", () => {
    const html = renderCrewApparelPageHtml({ selectedCrewSlug: "draco" });

    // Headline and support copy
    assert.ok(html.includes("Wear your Flight Crew"), "Must include headline 'Wear your Flight Crew'");
    assert.ok(html.includes("Design previews"), "Must include 'Design previews'");
    assert.ok(html.includes("Final materials, fit, pricing and availability will be confirmed before sales open"), "Must include persistent notice text");
    assert.ok(html.includes("Pricing to be confirmed upon physical sampling"), "Must render null price as confirmation disclosure, not $0");
    assert.ok(html.includes("/assets/draco-apparel-board.png"), "Must render the Draco apparel board asset");
    assert.ok(html.includes("Draco Men's Street Set"), "Must render outfit cards");
    assert.ok(html.includes("Draco Women's Flight Set"), "Must render women's flight set");
    assert.ok(html.includes("data-fit=\"all\""), "Must include fit filter controls");
    assert.ok(html.includes("data-category=\"all\""), "Must include category filter controls");
    assert.ok(html.includes("openBoardZoomModal"), "Must include zoom modal support");
    assert.ok(html.includes("openInterestModal"), "Must include consented interest modal");
  });

  it("records apparel interest with email validation and consent tracking", () => {
    const result = recordApparelInterest({
      email: "flightpilot@quanterraos.com",
      crewSlug: "draco",
      fitPreference: "men",
      productId: "draco-men-street-concept"
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes("registered"));

    assert.throws(() => {
      recordApparelInterest({
        email: "not-an-email",
        crewSlug: "draco"
      });
    }, /A valid email address is required/);
  });
});
