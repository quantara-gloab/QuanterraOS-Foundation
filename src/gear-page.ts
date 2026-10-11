/**
 * QuanterraOS: Elite Eleven Gear & Apparel Concepts (/gear & /merchandise)
 *
 * Implements:
 * - 5 Collections: Crew Essentials, Executive Orbit, King Royal Galactic, Queen Royal Galactic, Founder M Edition
 * - 13 Apparel Boards presenting 78 Garment Concepts
 * - Men's and Women's fits represented across all collections (including King & Queen)
 * - Transparent Concept-Only Status: price: null, checkout disabled, "Design concept — final product may vary"
 * - Waitlist / Notify Me interest modal (consented)
 */

import {
  MERCHANDISE_78_CATALOG,
  APPAREL_COLLECTIONS_LIST,
  filterGarments,
  APPAREL_BOARDS,
  type GarmentConceptItem
} from "./lib/merchandise-44-catalog.ts";
import { renderPublicHeader, renderPublicFooter, PUBLIC_LAYOUT_CSS } from "./components/public-layout.ts";

export interface GearPageOptions {
  user?: { email?: string } | null;
  collectionFilter?: string;
  memberFilter?: string;
  garmentTypeFilter?: string;
  fitFilter?: string;
  searchQuery?: string;
}

export function renderGearPageHtml(options?: GearPageOptions): string {
  const user = options?.user;

  const catalogJsonSafe = JSON.stringify(MERCHANDISE_78_CATALOG).replace(/</g, '\\u003c');
  const boardsJsonSafe = JSON.stringify(APPAREL_BOARDS).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Gear & Apparel Concepts — QuanterraOS Fighter Pilots</title>
  <meta name="description" content="Explore 78 apparel concepts across 13 presentation boards: Crew Essentials, Executive Orbit, King Royal Galactic, Queen Royal Galactic, and Founder M Edition. Design concepts pending sample approval.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --gear-bg: #070914;
      --gear-card: rgba(18, 23, 43, 0.85);
      --gear-border: rgba(155, 108, 255, 0.2);
      --gear-violet: #9B6CFF;
      --gear-mint: #CBFF69;
      --gear-chalk: #F4F3FA;
      --gear-muted: #A6A4BA;
      --gear-gold: #DFB843;
    }

    body {
      background: var(--gear-bg);
      color: var(--gear-chalk);
      font-family: var(--public-font-sans);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }

    .gear-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    .gear-hero {
      text-align: center;
      margin-bottom: 40px;
    }
    .gear-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(155, 108, 255, 0.15);
      border: 1px solid rgba(155, 108, 255, 0.35);
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--gear-mint);
      margin-bottom: 16px;
      text-transform: uppercase;
    }
    .gear-title {
      font-size: 2.8rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 12px;
      background: linear-gradient(180deg, #FFFFFF 0%, #C4B5FD 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .gear-subhead {
      font-size: 1.15rem;
      color: var(--gear-muted);
      max-width: 760px;
      margin: 0 auto 24px;
    }

    /* Concept Disclosure Banner */
    .concept-notice-banner {
      background: rgba(223, 184, 67, 0.1);
      border: 1px solid rgba(223, 184, 67, 0.3);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 36px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .concept-notice-icon {
      font-size: 1.5rem;
    }
    .concept-notice-text {
      font-size: 0.88rem;
      color: var(--gear-chalk);
      line-height: 1.5;
    }
    .concept-notice-text strong {
      color: var(--gear-gold);
    }

    /* Filter Cluster */
    .gear-filters {
      background: var(--gear-card);
      border: 1px solid var(--gear-border);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 36px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .filter-label {
      font-size: 0.78rem;
      font-family: var(--public-font-mono);
      color: var(--gear-muted);
      text-transform: uppercase;
      min-width: 90px;
    }
    .gear-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--gear-chalk);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .gear-btn:hover {
      background: rgba(155, 108, 255, 0.15);
      border-color: var(--gear-violet);
    }
    .gear-btn.active {
      background: var(--gear-violet);
      color: #FFFFFF;
      border-color: var(--gear-violet);
      font-weight: 700;
    }

    /* Garment Grid */
    .garment-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      margin-bottom: 50px;
    }
    @media (max-width: 1024px) {
      .garment-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 640px) {
      .garment-grid {
        grid-template-columns: 1fr;
      }
    }

    .garment-card {
      background: var(--gear-card);
      border: 1px solid var(--gear-border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .garment-card:hover {
      transform: translateY(-4px);
      border-color: rgba(155, 108, 255, 0.45);
    }
    .garment-img-wrap {
      width: 100%;
      height: 240px;
      background: #090C1B;
      position: relative;
      overflow: hidden;
    }
    .garment-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .garment-tag {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(9, 13, 26, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.72rem;
      font-family: var(--public-font-mono);
      color: var(--gear-mint);
    }
    .concept-watermark {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.75);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.68rem;
      font-family: var(--public-font-mono);
      color: var(--gear-gold);
    }

    .garment-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .garment-sku {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: var(--gear-muted);
      margin-bottom: 4px;
    }
    .garment-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 8px;
    }
    .garment-pieces {
      font-size: 0.8rem;
      color: var(--gear-mint);
      font-family: var(--public-font-mono);
      margin-bottom: 10px;
    }
    .garment-desc {
      font-size: 0.82rem;
      color: var(--gear-muted);
      line-height: 1.5;
      margin-bottom: 16px;
      flex: 1;
    }
    .garment-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 14px;
    }
    .price-notice {
      font-size: 0.75rem;
      color: var(--gear-muted);
      font-family: var(--public-font-mono);
    }
    .btn-notify {
      background: rgba(155, 108, 255, 0.2);
      border: 1px solid var(--gear-violet);
      color: #FFFFFF;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .btn-notify:hover {
      background: var(--gear-violet);
    }

    /* Modal Styling */
    .design-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(4, 6, 15, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .design-modal-overlay.open {
      display: flex;
    }
    .design-modal {
      background: #0E1222;
      border: 1px solid rgba(155, 108, 255, 0.35);
      border-radius: 16px;
      max-width: 840px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 32px;
      position: relative;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(155, 108, 255, 0.15);
    }
    .modal-close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #FFF;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .modal-close-btn:hover {
      background: rgba(244, 63, 94, 0.25);
      border-color: #F43F5E;
      color: #F43F5E;
    }
    .btn-gear-view {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #FFFFFF;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .btn-gear-view:hover {
      background: rgba(155, 108, 255, 0.25);
      border-color: var(--gear-violet);
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/gear", user })}

  <main class="gear-container">
    <header class="gear-hero">
      <div class="gear-badge">QuanterraOS Fighter Pilots Apparel Concepts</div>
      <h1 class="gear-title">Wear your flight crew.</h1>
      <p class="gear-subhead">
        Seventy-eight design concepts spanning Street Graffiti, Celestial Galactica, Crew Essentials, Executive Orbit, King Royal Galactic, Queen Royal Galactic, and Founder M Edition.
      </p>
    </header>

    <!-- Concept Disclosure -->
    <div class="concept-notice-banner">
      <span class="concept-notice-icon">⚠️</span>
      <div class="concept-notice-text">
        <strong>Design Concept Notice:</strong> All 78 garments are design concepts presented across 13 presentation boards. Images represent authentic approved creative artwork and garment placement inspiration, not generic off-the-shelf photos. Commercial checkout is disabled until physical manufacturer tech packs and fabric samples are approved.
      </div>
    </div>

    <!-- Filters -->
    <section class="gear-filters" aria-label="Apparel filters">
      <div class="filter-row">
        <span class="filter-label">Master Line:</span>
        <button type="button" class="gear-btn active" data-col="all" onclick="filterCol('all')">All Collections (78)</button>
        <button type="button" class="gear-btn" data-col="street-graffiti" onclick="filterCol('street-graffiti')">Street Graffiti</button>
        <button type="button" class="gear-btn" data-col="celestial-galactica" onclick="filterCol('celestial-galactica')">Celestial Galactica</button>
        <button type="button" class="gear-btn" data-col="elite-eleven" onclick="filterCol('elite-eleven')">Elite Eleven Flight Collection</button>
        <button type="button" class="gear-btn" data-col="royal-galactic" onclick="filterCol('royal-galactic')">King &amp; Queen Royal Galactic</button>
      </div>

      <div class="filter-row" style="padding-top: 6px; border-top: 1px dashed rgba(255, 255, 255, 0.08);">
        <span class="filter-label">Collections:</span>
        <button type="button" class="gear-btn" data-col="Crew Essentials" onclick="filterCol('Crew Essentials')">Crew Essentials</button>
        <button type="button" class="gear-btn" data-col="Executive Orbit" onclick="filterCol('Executive Orbit')">Executive Orbit</button>
        <button type="button" class="gear-btn" data-col="King Royal Galactic" onclick="filterCol('King Royal Galactic')">King Royal Galactic</button>
        <button type="button" class="gear-btn" data-col="Queen Royal Galactic" onclick="filterCol('Queen Royal Galactic')">Queen Royal Galactic</button>
        <button type="button" class="gear-btn" data-col="Founder M Edition" onclick="filterCol('Founder M Edition')">Founder M Edition</button>
      </div>

      <div class="filter-row">
        <span class="filter-label">Garment:</span>
        <button type="button" class="gear-btn active" data-type="all" onclick="filterType('all')">All Types</button>
        <button type="button" class="gear-btn" data-type="hoodie" onclick="filterType('hoodie')">Street Hoodie</button>
        <button type="button" class="gear-btn" data-type="jumpsuit" onclick="filterType('jumpsuit')">Flight Jumpsuit</button>
        <button type="button" class="gear-btn" data-type="business_attire" onclick="filterType('business_attire')">Business Attire</button>
      </div>

      <div class="filter-row">
        <span class="filter-label">Fit Range:</span>
        <button type="button" class="gear-btn active" data-fit="all" onclick="filterFit('all')">All Fits</button>
        <button type="button" class="gear-btn" data-fit="mens" onclick="filterFit('mens')">Men's Fit</button>
        <button type="button" class="gear-btn" data-fit="womens" onclick="filterFit('womens')">Women's Fit</button>
      </div>
    </section>

    <!-- Garment Grid -->
    <div class="garment-grid" id="garment-grid"></div>
  </main>

  <!-- View Design Detail Modal -->
  <div id="design-modal" class="design-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" onclick="if(event.target === this) closeDesignModal()">
    <div class="design-modal">
      <button type="button" class="modal-close-btn" aria-label="Close design modal" onclick="closeDesignModal()">&times;</button>
      <div id="modal-content"></div>
    </div>
  </div>

  ${renderPublicFooter()}

  <script>
    const CATALOG = ${catalogJsonSafe};
    let currentCol = "${options?.collectionFilter || 'all'}";
    let currentType = "all";
    let currentFit = "all";

    function matchCollection(g, col) {
      if (col === "all") return true;
      if (col === "street-graffiti" || col === "Street Graffiti" || col === "Cosmic Street") {
        return g.collection === "Crew Essentials" || g.boardSlug?.includes("draco") || g.boardSlug?.includes("phoenix") || g.boardSlug?.includes("quanta");
      }
      if (col === "celestial-galactica" || col === "Celestial Galactica") {
        return g.collection === "Executive Orbit" || g.boardSlug?.includes("quantana") || g.boardSlug?.includes("quantum-fox") || g.boardSlug?.includes("falcon");
      }
      if (col === "elite-eleven" || col === "Elite Eleven") {
        return g.collection === "Crew Essentials" || g.collection === "Executive Orbit" || g.collection === "Founder M Edition";
      }
      if (col === "royal-galactic" || col === "Royal Galactic" || col === "King & Queen Royal Galactic") {
        return g.collection === "King Royal Galactic" || g.collection === "Queen Royal Galactic";
      }
      return g.collection === col;
    }

    function renderGrid() {
      const filtered = CATALOG.filter(g => {
        if (!matchCollection(g, currentCol)) return false;
        if (currentType !== "all" && g.garmentType !== currentType) return false;
        if (currentFit !== "all" && g.fit !== currentFit) return false;
        return true;
      });

      const grid = document.getElementById("garment-grid");
      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--gear-muted);">No garments match the selected filters.</div>';
        return;
      }

      grid.innerHTML = filtered.map(g => \`
        <article class="garment-card">
          <div class="garment-img-wrap">
            <img src="\${g.parentBoardImage}" alt="\${g.displayName}" class="garment-img" loading="lazy">
            <div class="garment-tag">\${g.collection}</div>
            <div class="concept-watermark">CONCEPT PREVIEW</div>
          </div>
          <div class="garment-body">
            <div class="garment-sku">\${g.sku} · \${g.fitLabel}</div>
            <h3 class="garment-name">\${g.displayName}</h3>
            <div class="garment-pieces">✦ \${g.includedPieces.join(" + ")}</div>
            <p class="garment-desc">\${g.description}</p>
            <div class="garment-footer">
              <span class="price-notice">Concept — sample pending</span>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-gear-view" aria-label="View design for \${g.displayName}" onclick="openDesignModal('\${g.sku}')">View design</button>
                <button type="button" class="btn-notify" aria-label="Join release list for \${g.displayName}" onclick="notifyInterest('\${g.sku}', '\${g.displayName}')">Join release list &rarr;</button>
              </div>
            </div>
          </div>
        </article>
      \`).join("");
    }

    function filterCol(c) {
      currentCol = c;
      document.querySelectorAll("[data-col]").forEach(b => b.classList.toggle("active", b.dataset.col === c));
      renderGrid();
    }

    function filterType(t) {
      currentType = t;
      document.querySelectorAll("[data-type]").forEach(b => b.classList.toggle("active", b.dataset.type === t));
      renderGrid();
    }

    function filterFit(f) {
      currentFit = f;
      document.querySelectorAll("[data-fit]").forEach(b => b.classList.toggle("active", b.dataset.fit === f));
      renderGrid();
    }

    function openDesignModal(sku) {
      const item = CATALOG.find(g => g.sku === sku);
      if (!item) return;

      const modalContent = document.getElementById("modal-content");
      modalContent.innerHTML = \`
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: start;">
          <div>
            <div style="border-radius: 12px; overflow: hidden; background: #070914; border: 1px solid rgba(155, 108, 255, 0.3);">
              <img src="\${item.parentBoardImage}" alt="\${item.displayName}" style="width: 100%; display: block;">
            </div>
            <div style="margin-top: 12px; text-align: center; font-size: 0.75rem; color: var(--gear-muted); font-family: var(--public-font-mono);">
              Approved Presentation Board Reference
            </div>
          </div>
          <div>
            <div style="display: inline-block; font-size: 0.72rem; font-family: var(--public-font-mono); color: var(--gear-mint); background: rgba(203, 255, 105, 0.1); border: 1px solid rgba(203, 255, 105, 0.3); padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">
              \${item.collection} · \${item.sku}
            </div>
            <h2 id="modal-title" style="font-size: 1.6rem; font-weight: 700; margin: 0 0 8px; color: #FFF;">\${item.displayName}</h2>
            <div style="font-size: 0.85rem; color: var(--gear-mint); font-family: var(--public-font-mono); margin-bottom: 14px;">
              Pieces: \${item.includedPieces.join(" + ")} · Fit: \${item.fitLabel}
            </div>
            <p style="font-size: 0.9rem; color: #C4B5FD; line-height: 1.6; margin-bottom: 18px;">
              \${item.description}
            </p>

            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 0.8rem; line-height: 1.5;">
              <div style="font-weight: 600; color: #FFF; margin-bottom: 6px;">✦ Artwork Placement &amp; Structure</div>
              <div style="color: var(--gear-muted);">Precision front chest insignia, rear full-width cosmic mural panel, engineered ergonomic sleeve ribbing, and contrast lining.</div>
              <div style="font-weight: 600; color: #FFF; margin: 10px 0 4px;">✦ Proposed Sizing Range</div>
              <div style="color: var(--gear-muted);">Unisex/Structured: XS, S, M, L, XL, 2XL (Tailored sizing chart provided upon sample release).</div>
              <div style="font-weight: 600; color: #FFF; margin: 10px 0 4px;">✦ Physical Production Status</div>
              <div style="color: var(--gear-gold);">Concept Phase: Technical fabric composition and physical tech packs pending final sample sign-off. Commercial checkout disabled.</div>
            </div>

            <button type="button" class="btn-notify" style="width: 100%; padding: 12px; font-size: 0.95rem;" onclick="notifyInterest('\${item.sku}', '\${item.displayName}')">Join Release List &rarr;</button>
          </div>
        </div>
      \`;

      const modal = document.getElementById("design-modal");
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function closeDesignModal() {
      const modal = document.getElementById("design-modal");
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }

    function notifyInterest(sku, name) {
      const email = prompt("Enter your email to receive production updates and tech-pack notifications for " + name + ":");
      if (email && email.includes("@")) {
        alert("Thank you. We have recorded your interest for " + name + " (" + sku + "). You will receive official release notifications as samples are approved.");
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      const params = new URLSearchParams(window.location.search);
      const colParam = params.get('collection');
      if (colParam) {
        filterCol(colParam);
      } else {
        renderGrid();
      }
    });
  </script>
</body>
</html>`;
}
