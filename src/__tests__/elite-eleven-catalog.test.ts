import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ELITE_ELEVEN_REGISTRY,
  getEliteElevenMember,
  getSpecialists,
  getLeaders,
  getFounder,
  getQuantaGuideConfig,
} from "../lib/elite-eleven-catalog.ts";
import {
  ART_44_CATALOG,
  getArt44ById,
  getArt44ByMember,
  getArt44ByChapter,
  ART_44_CHAPTERS,
} from "../lib/art-44-catalog.ts";
import {
  MERCHANDISE_78_CONCEPTS,
  APPAREL_13_BOARDS,
  getMerchandiseByCollection,
  getMerchandiseByMember,
  APPAREL_COLLECTIONS,
} from "../lib/merchandise-44-catalog.ts";
import { renderArtGallery44PageHtml } from "../art-gallery-44-page.ts";
import { renderCockpitPageHtml } from "../cockpit-page.ts";
import { renderCrewPageHtml } from "../crew-page.ts";
import { renderGearPageHtml } from "../gear-page.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Elite Eleven Registry & Roster Specification", () => {
  it("1. Contains exactly 11 members (1 Founder, 2 Leaders, 8 Specialists)", () => {
    assert.strictEqual(ELITE_ELEVEN_REGISTRY.length, 11, "Must contain exactly 11 members");

    const founder = getFounder();
    assert.ok(founder, "Founder must be defined");
    assert.strictEqual(founder.id, "michael-quanterra");
    assert.strictEqual(founder.name, "Michael Quanterra");
    assert.strictEqual(founder.role, "Founder & Creator");
    assert.strictEqual(founder.visualIdentity.helmetSymbol, "Capital M on helmet forehead");
    assert.strictEqual(founder.visualIdentity.faceStyle, "Entirely digital LED face");
    assert.ok(founder.productResponsibility.includes("Brand character, not a trading engine"));

    const leaders = getLeaders();
    assert.strictEqual(leaders.length, 2, "Must contain exactly 2 leaders");
    assert.deepStrictEqual(leaders.map((l) => l.id), ["quanta", "quantana"]);

    const quanta = leaders.find((l) => l.id === "quanta")!;
    assert.strictEqual(quanta.name, "Quanta");
    assert.ok(quanta.visualIdentity.eyeStyle.includes("Green up arrow and pink down arrow together"));
    assert.ok(quanta.productResponsibility.includes("Assistant, orchestration and explanation"));

    const quantana = leaders.find((l) => l.id === "quantana")!;
    assert.strictEqual(quantana.name, "Quantana");
    assert.strictEqual(quantana.role, "Queen & Companion");
    assert.ok(quantana.productResponsibility.includes("Onboarding and education"));

    const specialists = getSpecialists();
    assert.strictEqual(specialists.length, 8, "Must contain exactly 8 specialists");
    const specialistIds = specialists.map((s) => s.id);
    assert.deepStrictEqual(specialistIds, [
      "draco",
      "wolf",
      "falcon",
      "quantum-fox",
      "sentinel",
      "kraken",
      "lion",
      "phoenix",
    ]);
  });

  it("2. Removes Aria as an active crew identity and has no obsolete Lyra/Orion/Vela/Reaper names", () => {
    const allIds = ELITE_ELEVEN_REGISTRY.map((m) => m.id.toLowerCase());
    const allNames = ELITE_ELEVEN_REGISTRY.map((m) => m.name.toLowerCase());

    assert.ok(!allIds.includes("aria"), "Aria must not be in active registry IDs");
    assert.ok(!allNames.includes("aria"), "Aria must not be in active registry names");
    assert.ok(!allIds.includes("lyra"), "Lyra must not be in active registry IDs");
    assert.ok(!allIds.includes("orion"), "Orion must not be in active registry IDs");
    assert.ok(!allIds.includes("vela"), "Vela must not be in active registry IDs");
    assert.ok(!allIds.includes("reaper"), "Reaper must not be in active registry IDs");
  });

  it("3. Provides Quanta guide configurations across routes without intrusive popups", () => {
    const homeGuide = getQuantaGuideConfig("home");
    assert.strictEqual(homeGuide.chapter, "Origin Command");
    assert.strictEqual(homeGuide.styleVariant, "compact");

    const cockpitGuide = getQuantaGuideConfig("cockpit");
    assert.strictEqual(cockpitGuide.chapter, "Origin Command");
    assert.ok(cockpitGuide.greeting.includes("Cockpit"));

    const gearGuide = getQuantaGuideConfig("gear");
    assert.strictEqual(gearGuide.styleVariant, "inline");
  });
});

describe("The 44 Art Collection (q44-001 through q44-044)", () => {
  it("4. Contains exactly 44 artworks across 4 chapters and 11 members", () => {
    assert.strictEqual(ART_44_CATALOG.length, 44, "Catalog must contain exactly 44 artworks");
    assert.strictEqual(ART_44_CHAPTERS.length, 4, "Must contain exactly 4 chapters");

    for (const chapter of ART_44_CHAPTERS) {
      const inChapter = getArt44ByChapter(chapter);
      assert.strictEqual(inChapter.length, 11, `Chapter ${chapter} must have 11 artworks`);
      // Founder is first in each chapter
      assert.strictEqual(inChapter[0].crewCanonicalId, "michael");
      // Quanta is second
      assert.strictEqual(inChapter[1].crewCanonicalId, "quanta");
      // Quantana is third
      assert.strictEqual(inChapter[2].crewCanonicalId, "quantana");
    }

    // Exactly 4 per member
    for (const member of ELITE_ELEVEN_REGISTRY) {
      const perMember = getArt44ByMember(member.id);
      assert.strictEqual(perMember.length, 4, `Member ${member.id} must have 4 artworks`);
    }
  });

  it("5. Has sequential IDs q44-001 through q44-044 with corresponding master files", () => {
    for (let i = 1; i <= 44; i++) {
      const id = `q44-${String(i).padStart(3, "0")}`;
      const item = getArt44ById(id);
      assert.ok(item, `Item ${id} must exist in catalog`);
      assert.strictEqual(item!.id, id);
      assert.strictEqual(item!.imagePath, `/assets/art-44/${id}.png`);
      assert.strictEqual(item!.masterImagePath, `/assets/art-44/${id}.png`);
      assert.ok(item!.title.length > 0);
      assert.ok(item!.description.length > 0);
    }
  });

  it("6. Validates asset-catalog.json on disk contains 44 entries and SHA-256 hashes", () => {
    const catalogPath = path.resolve(__dirname, "../../asset-catalog.json");
    assert.ok(fs.existsSync(catalogPath), "asset-catalog.json must exist");

    const data = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    assert.ok(Array.isArray(data), "asset-catalog.json must be an array of artworks");
    assert.strictEqual(data.length, 44, "asset-catalog.json must contain 44 entries");

    const first = data[0];
    assert.strictEqual(first.id, "q44-001");
    assert.strictEqual(first.crewCanonicalId, "michael");
    assert.match(first.sha256, /^[a-f0-9]{64}$/);
  });

  it("7. Validates asset-validation.json records all 58 master assets decoded", () => {
    const valPath = path.resolve(__dirname, "../../asset-validation.json");
    assert.ok(fs.existsSync(valPath), "asset-validation.json must exist");

    const val = JSON.parse(fs.readFileSync(valPath, "utf8"));
    const keys = Object.keys(val);
    assert.strictEqual(keys.length, 58, "asset-validation.json must record all 58 assets");

    for (const key of keys) {
      const asset = val[key];
      assert.strictEqual(asset.decodedSuccessfully, true, `${key} must be decoded successfully`);
      assert.ok(asset.dimensions.width >= 1024, `${key} width must be >= 1024`);
      assert.ok(asset.dimensions.height >= 900, `${key} height must be >= 900`);
      assert.ok(asset.sizeBytes > 0, `${key} sizeBytes must be > 0`);
      assert.match(asset.sha256, /^[a-f0-9]{64}$/, `${key} sha256 must be valid hex`);
    }
  });
});

describe("Apparel Concepts Specification (78 Concepts across 13 Boards)", () => {
  it("8. Contains exactly 13 presentation boards (11 members + 2 Royal Galactic)", () => {
    assert.strictEqual(APPAREL_13_BOARDS.length, 13);

    const memberBoards = APPAREL_13_BOARDS.filter(
      (b) => b.collection === "Crew Essentials" || b.collection === "Executive Orbit" || b.collection === "Founder M Edition"
    );
    assert.strictEqual(memberBoards.length, 11);

    const royalBoards = APPAREL_13_BOARDS.filter((b) => b.collection.includes("Royal Galactic"));
    assert.strictEqual(royalBoards.length, 2);
    assert.deepStrictEqual(royalBoards.map((b) => b.memberOrThemeId), ["royal-king", "royal-queen"]);
  });

  it("9. Contains exactly 78 garment concepts (6 per board: Men/Women Hoodie, Jumpsuit, Business)", () => {
    assert.strictEqual(MERCHANDISE_78_CONCEPTS.length, 78);

    for (const concept of MERCHANDISE_78_CONCEPTS) {
      assert.strictEqual(concept.state, "concept_only");
      assert.strictEqual(concept.price, null);
      assert.strictEqual(concept.checkoutEnabled, false);
      assert.strictEqual(concept.inStock, false);
      assert.strictEqual(concept.materialsApproved, false);
      assert.strictEqual(concept.disclaimer, "Design concept — final product may vary. Not yet manufactured.");
    }
  });

  it("10. Validates merchandise-catalog.json on disk matches the 78 concepts", () => {
    const merchPath = path.resolve(__dirname, "../../merchandise-catalog.json");
    assert.ok(fs.existsSync(merchPath), "merchandise-catalog.json must exist");

    const data = JSON.parse(fs.readFileSync(merchPath, "utf8"));
    assert.ok(Array.isArray(data), "merchandise-catalog.json must be an array");
    assert.strictEqual(data.length, 78);
  });
});

describe("Build Status & Production Package", () => {
  it("11. Verifies build-status.json strictly matches the requested handoff status", () => {
    const statusPath = path.resolve(__dirname, "../../build-status.json");
    assert.ok(fs.existsSync(statusPath), "build-status.json must exist");

    const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
    assert.strictEqual(status.requestedArtwork, 44);
    assert.strictEqual(status.generatedArtwork, 44);
    assert.strictEqual(status.members, 11);
    assert.strictEqual(status.perMember, 4);
    assert.strictEqual(status.apparelBoards, 13);
    assert.strictEqual(status.conceptGarments, 78);
    assert.strictEqual(status.totalGeneratedAssets, 58);
    assert.strictEqual(status.pending, 0);
    assert.strictEqual(status.productionDeployed, false);
    assert.strictEqual(status.nativeAppTested, false);
    assert.strictEqual(status.liveDataConnected, false);
    assert.strictEqual(status.minted, 0);
    assert.strictEqual(status.manufacturedProducts, 0);
  });
});

describe("Page Rendering & Guardrails", () => {
  it("12. Renders Art Gallery 44 with pagination, filters, and rollback archive link", () => {
    const html = renderArtGallery44PageHtml({ chapter: "All", member: "All", page: 1 });
    assert.ok(html.includes("The 44 — QuanterraOS Fighter Pilots") || html.includes("The 44 — Elite Eleven"));
    assert.ok(html.includes("q44-001"));
    assert.ok(html.includes("Rollback Archive"));
    assert.ok(html.includes("archive=rollback"));
    assert.ok(html.includes("Origin Command"));
    assert.ok(html.includes("Cosmic Street"));
  });

  it("13. Renders Cockpit page with Quanta guide, 8 specialist dock, scenario cost math and receipt", () => {
    const html = renderCockpitPageHtml();
    assert.ok(html.includes("QuanterraOS Fighter Pilots Decision Workspace") || html.includes("Elite Eleven Decision Workspace"));
    assert.ok(html.includes("Quanta // Lead Cockpit Guide:"));
    assert.ok(html.includes("Quanta Decision Receipt"));
    assert.ok(html.includes("View official contract on"));
    assert.ok(html.includes("Draco"));
    assert.ok(html.includes("Wolf"));
    assert.ok(html.includes("Kraken"));
    assert.ok(html.includes("Sentinel"));
    assert.ok(html.includes("Breakeven"));
  });

  it("14. Renders Crew page with 11 members, Founder M spotlight, and statistical notice", () => {
    const html = renderCrewPageHtml();
    assert.ok(html.includes("Meet the QuanterraOS Fighter Pilots") || html.includes("Meet the Elite Eleven"));
    assert.ok(html.includes("Michael Quanterra"));
    assert.ok(html.includes("Quanta"));
    assert.ok(html.includes("Quantana"));
    assert.ok(html.includes("Brand character, not a trading engine"));
    assert.ok(html.includes("Statistical Independence Notice"));
  });

  it("15. Renders Gear page with 5 collections, 78 concepts, and concept-only badge", () => {
    const html = renderGearPageHtml();
    assert.ok(html.includes("QuanterraOS Fighter Pilots Apparel Concepts") || html.includes("Elite Eleven Apparel Concepts"));
    assert.ok(html.includes("Design Concept Notice"));
    assert.ok(html.includes("checkout is disabled"));
    assert.ok(html.includes("Crew Essentials"));
    assert.ok(html.includes("King Royal Galactic"));
    assert.ok(html.includes("Queen Royal Galactic"));
  });
});
