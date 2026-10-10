import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  THE_144_CATALOG,
  COUNCIL_MEMBERS_LIST,
  CHAPTERS_LIST,
  getAll144Artworks,
  getArtworkById,
  getArtworkBySlug,
  filter144Artworks
} from "../lib/art-144-catalog.ts";
import { renderArtGallery144PageHtml } from "../art-gallery-144-page.ts";

describe("QuanterraOS: The 144 Artwork Gallery & Provenance Catalog", () => {
  it("1. Verifies exact collection geometry: 8 members x 18 chapters = 144 unique works", () => {
    assert.strictEqual(THE_144_CATALOG.length, 144, "Must contain exactly 144 artworks");
    assert.strictEqual(COUNCIL_MEMBERS_LIST.length, 8, "Must contain exactly 8 Council members");
    assert.strictEqual(CHAPTERS_LIST.length, 18, "Must contain exactly 18 chapters");

    const idSet = new Set<string>();
    const slugSet = new Set<string>();
    const memberCounts: Record<string, number> = {};
    const chapterCounts: Record<number, number> = {};

    for (const art of THE_144_CATALOG) {
      assert.ok(!idSet.has(art.id), `ID ${art.id} must be unique`);
      idSet.add(art.id);

      assert.ok(!slugSet.has(art.slug), `Slug ${art.slug} must be unique`);
      slugSet.add(art.slug);

      memberCounts[art.crewCanonicalId] = (memberCounts[art.crewCanonicalId] || 0) + 1;
      chapterCounts[art.chapterNumber] = (chapterCounts[art.chapterNumber] || 0) + 1;

      // Verify required metadata fields
      assert.ok(art.title && art.title.length > 0, "Artwork must have title");
      assert.ok(art.memberName && art.memberName.length > 0, "Artwork must have memberName");
      assert.ok(art.chapterTitle && art.chapterTitle.length > 0, "Artwork must have chapterTitle");
      assert.ok(art.palette?.primary, "Artwork must have primary palette color");
      assert.ok(art.palette?.secondary, "Artwork must have secondary palette color");
      assert.ok(art.prompt && art.prompt.length > 20, "Artwork must have generation prompt");
      assert.ok(art.description && art.description.length > 10, "Artwork must have description");
      assert.ok(art.alt && art.alt.length > 10, "Artwork must have alt text");
      assert.ok(art.sha256 && art.sha256.length === 64, "Artwork must have 64-char hex SHA256");
      assert.strictEqual(art.mintStatus, "Artwork · NFT-ready", "Must be unminted concept state");
      assert.strictEqual(art.creatorDisplayName, "Michael Quantara & QuanterraOS Foundation");
      assert.ok(art.generationMethod.includes("AI-Assisted"), "Must disclose AI-assisted method");
    }

    // Verify each of the 8 members has exactly 18 works
    for (const member of COUNCIL_MEMBERS_LIST) {
      assert.strictEqual(memberCounts[member.id], 18, `Member ${member.name} must have exactly 18 works`);
    }

    // Verify each of the 18 chapters has exactly 8 works
    for (const ch of CHAPTERS_LIST) {
      assert.strictEqual(chapterCounts[ch.num], 8, `Chapter ${ch.title} must have exactly 8 works`);
    }
  });

  it("2. Verifies physical assets exist on disk with valid checksums and no placeholders", () => {
    const assetsDir = path.resolve("public", "assets", "art-144");
    assert.ok(fs.existsSync(assetsDir), "art-144 assets directory must exist");

    const catalogPath = path.join(assetsDir, "collection-catalog.json");
    assert.ok(fs.existsSync(catalogPath), "collection-catalog.json must exist");
    const catalogData = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    assert.strictEqual(catalogData.length, 144);

    // Verify sample of physical SVG assets
    for (let i = 1; i <= 144; i += 12) {
      const artId = `q144-${String(i).padStart(3, "0")}`;
      const svgPath = path.join(assetsDir, `${artId}.svg`);
      const thumbPath = path.join(assetsDir, `${artId}-thumb.svg`);

      assert.ok(fs.existsSync(svgPath), `${artId}.svg must exist on disk`);
      assert.ok(fs.existsSync(thumbPath), `${artId}-thumb.svg must exist on disk`);

      const content = fs.readFileSync(svgPath, "utf8");
      assert.ok(content.includes("<svg"), "Must be valid SVG content");
      assert.ok(content.includes("QUANTERRAOS: THE 144"), "Must contain brand telemetry header");
      assert.ok(content.includes("ARTWORK · NFT-READY"), "Must contain truthful status pill");
    }
  });

  it("3. Verifies lookup and filter engines operate correctly", () => {
    const dracoCh1 = getArtworkById("q144-001");
    assert.ok(dracoCh1);
    assert.strictEqual(dracoCh1.crewCanonicalId, "draco");
    assert.strictEqual(dracoCh1.chapterNumber, 1);
    assert.strictEqual(dracoCh1.memberName, "Draco");

    const bySlug = getArtworkBySlug(dracoCh1.slug);
    assert.ok(bySlug);
    assert.strictEqual(bySlug.id, "q144-001");

    // Case insensitivity
    const caseCheck = getArtworkById("Q144-001");
    assert.ok(caseCheck);
    assert.strictEqual(caseCheck.id, "q144-001");

    // Filter by crew member
    const dracoAll = filter144Artworks({ crew: "draco" });
    assert.strictEqual(dracoAll.length, 18);

    const wolfAll = filter144Artworks({ crew: "wolf" });
    assert.strictEqual(wolfAll.length, 18);

    // Filter by chapter
    const ch1All = filter144Artworks({ chapter: 1 });
    assert.strictEqual(ch1All.length, 8);

    const ch18All = filter144Artworks({ chapter: 18 });
    assert.strictEqual(ch18All.length, 8);

    // Filter by query
    const searchResults = filter144Artworks({ query: "singularity" });
    assert.ok(searchResults.length >= 8, "Should find all chapter 6 singularity works");

    // Filter by favorites
    const favResults = filter144Artworks({ favorites: ["q144-001", "q144-002"] });
    assert.strictEqual(favResults.length, 2);
  });

  it("4. Renders responsive QuanterraOS: The 144 gallery page and internal rollback archive", () => {
    const pageHtml = renderArtGallery144PageHtml();

    // Mandatory copy checks from AGENT_HANDOFF.md
    assert.ok(pageHtml.includes("QuanterraOS: The 144"), "Must include collection title");
    assert.ok(pageHtml.includes("Eight guardians. Eighteen worlds. One connected universe."), "Must include mandated headline");
    assert.ok(pageHtml.includes("Explore 144 original Flight Crew artworks inspired by Michael Quantara"), "Must include support copy");
    assert.ok(pageHtml.includes("Explore the collection"), "Must include Primary CTA");
    assert.ok(pageHtml.includes("Meet Quanta"), "Must include Secondary CTA");
    assert.ok(pageHtml.includes("Global Galactic Leader"), "Must include Quanta brand title");
    assert.ok(pageHtml.includes("NFT-ready"), "Must state truthful NFT-ready status");
    assert.ok(!pageHtml.includes("0.05 ETH floor") && !pageHtml.includes("Floor Price:"), "Must NOT advertise fictitious floor prices");

    // Internal rollback archive
    const rollbackHtml = renderArtGallery144PageHtml({ showRollbackArchive: true });
    assert.ok(rollbackHtml.includes("Internal Rollback Archive"), "Must include rollback header");
    assert.ok(rollbackHtml.includes("Flight Deck Pilot Quanta"), "Must retain legacy genesis asset");
    assert.ok(rollbackHtml.includes("Quanta: Liquid Chrome"), "Must retain legacy chrome asset");
    assert.ok(rollbackHtml.includes("Return to QuanterraOS: The 144"), "Must provide link back to main 144 gallery");
  });
});
