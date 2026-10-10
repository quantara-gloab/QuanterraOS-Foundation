/**
 * QuanterraOS Original Flight Crew Apparel Collections Page
 *
 * Routes:
 * - /merchandise/crew
 * - /merchandise/crew/:crewSlug
 *
 * Implements:
 * - Eight original Council apparel collections (Draco, Wolf, Falcon, Quantum Fox, Sentinel, Kraken, Lion, Phoenix)
 * - Leader Collection: Quanta & Quantana (Global Galactic Leader)
 * - 32 proposed outfits + 4 leader concepts across Men's and Women's Street and Flight Sets
 * - High-resolution landscape concept boards with zoom inspection modal
 * - Interactive crew selector, fit and outfit filters
 * - Transparent non-commercial status: "Design previews. Final materials, fit, pricing and availability will be confirmed before sales open."
 * - Consented email interest registration (POST /api/merchandise/interest)
 */

import {
  ORIGINAL_EIGHT_COLLECTIONS,
  CREW_OUTFIT_CATALOG,
  getCrewCollection,
  getCrewOutfits,
  type CrewApparelCollection,
  type CrewOutfitItem
} from "./lib/crew-apparel-catalog.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS
} from "./components/public-layout.ts";

export function renderCrewApparelPageHtml(options?: {
  selectedCrewSlug?: string;
  selectedFit?: string;
  selectedCategory?: string;
  user?: { email?: string } | null;
}): string {
  const currentSlug = options?.selectedCrewSlug?.toLowerCase() || "draco";
  const currentCollection = getCrewCollection(currentSlug) || ORIGINAL_EIGHT_COLLECTIONS[0];
  const fitFilter = options?.selectedFit || "all";
  const categoryFilter = options?.selectedCategory || "all";

  const outfits = getCrewOutfits(currentCollection.slug, {
    fit: fitFilter,
    category: categoryFilter
  });

  const crewTabsHtml = ORIGINAL_EIGHT_COLLECTIONS.map(col => {
    const isActive = col.slug === currentCollection.slug;
    return `
      <a href="/merchandise/crew/${col.slug}" class="crew-pill-btn ${isActive ? 'active' : ''}" data-crew="${col.slug}">
        ${col.name} ${col.isLeader ? '⭐' : ''}
      </a>
    `;
  }).join("\n");

  const outfitCardsHtml = outfits.map(outfit => `
    <article class="outfit-card" id="card-${outfit.productId}">
      <div class="outfit-card-header">
        <span class="outfit-fit-tag">${outfit.designFit.toUpperCase()} · ${outfit.categoryLabel}</span>
        <span class="outfit-concept-tag">CONCEPT PREVIEW</span>
      </div>
      <h3 class="outfit-title">${outfit.displayName}</h3>
      <div class="outfit-pieces-strip">
        <strong>Included Pieces:</strong> ${outfit.includedPieces.join(" + ")}
      </div>
      <p class="outfit-desc">${outfit.piecesDescription}</p>
      <div class="outfit-footer">
        <span class="outfit-pricing-note">Pricing to be confirmed upon physical sampling</span>
        <button type="button" class="btn-notify-outfit" onclick="openInterestModal('${currentCollection.slug}', '${outfit.productId}', '${outfit.displayName}')">
          Notify Me &rarr;
        </button>
      </div>
    </article>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Wear your Flight Crew — Original Eight Apparel Collections — QuanterraOS</title>
  <meta name="description" content="Official QuanterraOS original Flight Crew apparel collections: Draco, Wolf, Falcon, Quantum Fox, Sentinel, Kraken, Lion, Phoenix, and Quanta Leader. Street Sets and Flight Sets for men and women.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --apparel-bg: #090D1A;
      --apparel-surface: #12182B;
      --apparel-border: rgba(148, 104, 255, 0.2);
      --apparel-purple: #9468FF;
      --apparel-cyan: #59DDEC;
      --apparel-gold: #DFB843;
      --apparel-muted: #94A3B8;
    }

    body {
      background: var(--apparel-bg);
      color: #F8FAFC;
      font-family: var(--public-font-sans);
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }

    .apparel-container {
      max-width: 1260px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    /* Hero Header */
    .apparel-hero {
      text-align: center;
      max-width: 860px;
      margin: 0 auto 36px;
    }
    .apparel-eyebrow {
      display: inline-block;
      font-family: var(--public-font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--apparel-purple);
      background: rgba(148, 104, 255, 0.1);
      border: 1px solid rgba(148, 104, 255, 0.25);
      border-radius: 999px;
      padding: 4px 14px;
      margin-bottom: 14px;
    }
    .apparel-headline {
      font-size: clamp(2.2rem, 4vw, 3.4rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.1;
      margin-bottom: 14px;
      color: #FFFFFF;
    }
    .apparel-subtitle {
      font-size: 1.05rem;
      color: var(--apparel-muted);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    /* Mandatory Notice */
    .apparel-notice-box {
      background: rgba(30, 20, 50, 0.7);
      border: 1px solid rgba(148, 104, 255, 0.35);
      border-radius: 12px;
      padding: 16px 22px;
      font-size: 0.88rem;
      color: #E2E8F0;
      text-align: left;
      margin-bottom: 36px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .notice-icon { font-size: 1.4rem; flex-shrink: 0; }

    /* Crew Navigation Tabs */
    .crew-tabs-wrap {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 32px;
      scrollbar-width: thin;
      scrollbar-color: var(--apparel-purple) transparent;
    }
    .crew-pill-btn {
      flex-shrink: 0;
      background: var(--apparel-surface);
      border: 1px solid var(--apparel-border);
      color: #CBD5E1;
      text-decoration: none;
      font-family: var(--public-font-sans);
      font-weight: 600;
      font-size: 0.9rem;
      padding: 10px 20px;
      border-radius: 24px;
      transition: all 0.2s ease;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
    }
    .crew-pill-btn.active, .crew-pill-btn:hover {
      background: var(--apparel-purple);
      color: #FFFFFF;
      border-color: var(--apparel-purple);
      box-shadow: 0 4px 16px rgba(148, 104, 255, 0.3);
    }

    /* Collection Showcase Header */
    .collection-meta-bar {
      background: var(--apparel-surface);
      border: 1px solid var(--apparel-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .collection-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
    }
    .collection-name {
      font-size: 1.8rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 6px;
    }
    .collection-role {
      font-family: var(--public-font-mono);
      font-size: 0.8rem;
      color: var(--apparel-cyan);
    }
    .collection-palette {
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
      color: var(--apparel-gold);
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.25);
      padding: 6px 14px;
      border-radius: 8px;
    }
    .collection-desc {
      font-size: 0.92rem;
      color: #CBD5E1;
      line-height: 1.6;
      margin: 0;
    }

    /* Concept Board Image Stage */
    .concept-board-stage {
      position: relative;
      background: #000;
      border: 1px solid var(--apparel-border);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 36px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
    }
    .concept-board-img {
      width: 100%;
      height: auto;
      display: block;
      cursor: zoom-in;
      transition: transform 0.3s ease;
    }
    .concept-board-img:hover {
      transform: scale(1.01);
    }
    .board-overlay-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 6px 14px;
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: #E2E8F0;
      backdrop-filter: blur(8px);
    }
    .board-caption {
      padding: 12px 18px;
      font-size: 0.78rem;
      font-family: var(--public-font-mono);
      color: #94A3B8;
      background: rgba(18, 24, 43, 0.85);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    /* Filter Controls Row */
    .filter-controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .filter-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-subfilter {
      background: var(--apparel-surface);
      border: 1px solid var(--apparel-border);
      color: #94A3B8;
      font-size: 0.82rem;
      font-family: var(--public-font-sans);
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 18px;
      cursor: pointer;
      min-height: 38px;
      transition: all 0.2s ease;
    }
    .btn-subfilter.active, .btn-subfilter:hover {
      background: rgba(148, 104, 255, 0.25);
      color: #FFFFFF;
      border-color: var(--apparel-purple);
    }

    /* Outfit Cards Grid */
    .outfits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 56px;
    }
    .outfit-card {
      background: var(--apparel-surface);
      border: 1px solid var(--apparel-border);
      border-radius: 14px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .outfit-card:hover {
      transform: translateY(-4px);
      border-color: rgba(148, 104, 255, 0.5);
    }
    .outfit-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .outfit-fit-tag {
      font-family: var(--public-font-mono);
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--apparel-cyan);
      letter-spacing: 0.06em;
    }
    .outfit-concept-tag {
      font-family: var(--public-font-mono);
      font-size: 0.65rem;
      background: rgba(223, 184, 67, 0.12);
      border: 1px solid rgba(223, 184, 67, 0.3);
      color: var(--apparel-gold);
      padding: 2px 8px;
      border-radius: 4px;
    }
    .outfit-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 10px;
    }
    .outfit-pieces-strip {
      font-size: 0.8rem;
      font-family: var(--public-font-mono);
      color: var(--apparel-purple);
      background: rgba(148, 104, 255, 0.08);
      padding: 6px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .outfit-desc {
      font-size: 0.84rem;
      color: #CBD5E1;
      line-height: 1.5;
      margin-bottom: 18px;
      flex-grow: 1;
    }
    .outfit-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .outfit-pricing-note {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: #94A3B8;
    }
    .btn-notify-outfit {
      background: var(--apparel-purple);
      color: #FFFFFF;
      border: none;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      min-height: 44px;
      transition: all 0.2s ease;
      width: 100%;
    }
    .btn-notify-outfit:hover {
      background: #8048FF;
      box-shadow: 0 4px 16px rgba(148, 104, 255, 0.4);
    }

    /* Interest Form Section */
    .apparel-interest-section {
      background: linear-gradient(180deg, rgba(18, 24, 43, 0.7) 0%, rgba(10, 14, 28, 0.95) 100%);
      border: 1px solid var(--apparel-border);
      border-radius: 16px;
      padding: 36px 28px;
      max-width: 760px;
      margin: 0 auto;
      text-align: center;
    }
    .apparel-interest-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .apparel-interest-desc {
      font-size: 0.88rem;
      color: var(--apparel-muted);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .interest-form-row {
      display: flex;
      gap: 10px;
      max-width: 520px;
      margin: 0 auto 14px;
    }
    .interest-input {
      flex: 1;
      background: #080B18;
      border: 1px solid rgba(148, 104, 255, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      color: #FFF;
      font-size: 0.9rem;
      outline: none;
    }
    .interest-input:focus {
      border-color: var(--apparel-cyan);
    }
    .interest-submit-btn {
      background: var(--apparel-cyan);
      color: #080B18;
      font-weight: 700;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      min-height: 44px;
    }
    .interest-consent-note {
      font-size: 0.72rem;
      color: #64748B;
      font-family: var(--public-font-mono);
      line-height: 1.4;
    }

    /* Modal for Image Zoom */
    .zoom-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      z-index: 10000;
      padding: 20px;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
    }
    .zoom-modal-backdrop.open { display: flex; }
    .zoom-modal-img {
      max-width: 95vw;
      max-height: 90vh;
      border-radius: 12px;
      box-shadow: 0 0 50px rgba(148, 104, 255, 0.4);
    }
    .zoom-close-btn {
      position: absolute;
      top: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #FFF;
      font-size: 1.4rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .apparel-container { padding: 24px 16px 60px; }
      .interest-form-row { flex-direction: column; }
      .interest-submit-btn { width: 100%; }
      .outfits-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  ${renderPublicHeader({ activePath: "/merchandise", user: options?.user ? { email: options.user.email } : null })}

  <main class="apparel-container">

    <!-- Top Hero -->
    <header class="apparel-hero">
      <div class="apparel-eyebrow">⚡ ORIGINAL FLIGHT CREW APPAREL // 32 OUTFITS</div>
      <h1 class="apparel-headline">Wear your Flight Crew.</h1>
      <p class="apparel-subtitle">
        Eight original Council identities. Men's and women's Street Sets and Flight Sets inspired by the original Flight Crew. Explore the proposed palettes, cut patterns, and character back-views.
      </p>
    </header>

    <!-- Persistent Compliance Notice -->
    <aside class="apparel-notice-box" role="note" aria-label="Apparel Design Preview Notice">
      <span class="notice-icon">📋</span>
      <div>
        <strong>Design previews.</strong> Final materials, fit, pricing and availability will be confirmed before sales open. All pieces are realistic lifestyle garments (hoodie + trousers Street Sets; jacket + trousers Flight Sets) — not armor, protective equipment, or aerospace-certified uniforms.
      </div>
    </aside>

    <!-- Crew Member Selector Tabs -->
    <nav class="crew-tabs-wrap" aria-label="Select Crew Member Collection">
      ${crewTabsHtml}
    </nav>

    <!-- Selected Collection Header -->
    <section class="collection-meta-bar" aria-labelledby="col-heading">
      <div class="collection-header-row">
        <div>
          <h2 id="col-heading" class="collection-name">${currentCollection.name} Collection</h2>
          <div class="collection-role">Station Role: ${currentCollection.stationRole} &bull; Motif: ${currentCollection.apparelMotif}</div>
        </div>
        <div class="collection-palette">
          🎨 Palette: ${currentCollection.signaturePalette}
        </div>
      </div>
      <p class="collection-desc">${currentCollection.description}</p>
    </section>

    <!-- Landscape Concept Board Artwork -->
    <section class="concept-board-stage" aria-label="${currentCollection.name} Concept Board">
      <span class="board-overlay-badge">CLICK TO ZOOM FULL BOARD 🔍</span>
      <img
        src="${currentCollection.boardImage}"
        alt="${currentCollection.name} men's and women's Street Set and Flight Set apparel design board"
        class="concept-board-img"
        onclick="openZoomModal('${currentCollection.boardImage}')"
        loading="eager"
      />
      <div class="board-caption">
        <span>Includes 4 Complete Outfits: Men's Street, Men's Flight, Women's Street, and Women's Flight with back insets.</span>
        <button type="button" class="btn-subfilter" onclick="openZoomModal('${currentCollection.boardImage}')">
          Inspect Full Resolution &rarr;
        </button>
      </div>
    </section>

    <!-- Filter Controls -->
    <div class="filter-controls-row">
      <div class="filter-group">
        <span style="font-family:var(--public-font-mono); font-size:0.8rem; color:#94A3B8; align-self:center; margin-right:4px;">Fit:</span>
        <button type="button" class="btn-subfilter ${fitFilter === 'all' ? 'active' : ''}" data-fit="all" onclick="applyFitFilter('all')">All Design Lines</button>
        <button type="button" class="btn-subfilter ${fitFilter === 'men' ? 'active' : ''}" data-fit="men" onclick="applyFitFilter('men')">Men's Line</button>
        <button type="button" class="btn-subfilter ${fitFilter === 'women' ? 'active' : ''}" data-fit="women" onclick="applyFitFilter('women')">Women's Line</button>
      </div>

      <div class="filter-group">
        <span style="font-family:var(--public-font-mono); font-size:0.8rem; color:#94A3B8; align-self:center; margin-right:4px;">Set:</span>
        <button type="button" class="btn-subfilter ${categoryFilter === 'all' ? 'active' : ''}" data-category="all" onclick="applyCategoryFilter('all')">All Outfits</button>
        <button type="button" class="btn-subfilter ${categoryFilter === 'street' ? 'active' : ''}" data-category="street" onclick="applyCategoryFilter('street')">Street Sets (Hoodies)</button>
        <button type="button" class="btn-subfilter ${categoryFilter === 'flight' ? 'active' : ''}" data-category="flight" onclick="applyCategoryFilter('flight')">Flight Sets (Jackets)</button>
      </div>
    </div>

    <!-- Outfits Catalog Grid -->
    <section class="outfits-grid" aria-label="Proposed Outfit Concepts">
      ${outfitCardsHtml}
    </section>

    <!-- Consented Interest Form -->
    <section class="apparel-interest-section" aria-labelledby="interest-title">
      <h3 id="interest-title" class="apparel-interest-title">Stay Notified for ${currentCollection.name} Drops</h3>
      <p class="apparel-interest-desc">
        Register with your email to receive notice when initial sample batches, sizing charts, and verified production pricing are announced for the <strong>${currentCollection.name}</strong> collection.
      </p>

      <form id="interest-form" onsubmit="submitInterest(event)">
        <input type="hidden" id="interest-crew-slug" value="${currentCollection.slug}">
        <input type="hidden" id="interest-product-id" value="">
        <div class="interest-form-row">
          <input
            type="email"
            id="interest-email-input"
            class="interest-input"
            placeholder="Enter your email address…"
            required
            aria-label="Email for collection updates"
          />
          <button type="submit" id="btn-interest-submit" class="interest-submit-btn">
            Notify Me
          </button>
        </div>
        <div id="interest-feedback" style="display:none; font-family:var(--public-font-mono); font-size:0.82rem; margin-bottom:8px;"></div>
        <div class="interest-consent-note">
          We collect your email solely to send production updates for this apparel line. No spam, no card required. Unsubscribe at any time.
        </div>
      </form>
    </section>

  </main>

  <!-- Zoom Modal -->
  <div id="zoom-modal" class="zoom-modal-backdrop" onclick="closeZoomModal(event)">
    <button type="button" class="zoom-close-btn" onclick="closeZoomModal(event)" aria-label="Close image zoom">✕</button>
    <img id="zoom-target-img" src="" alt="Zoomed concept board" class="zoom-modal-img" />
  </div>

  ${renderPublicFooter()}

  <script>
    function openZoomModal(src) {
      const modal = document.getElementById('zoom-modal');
      const img = document.getElementById('zoom-target-img');
      img.src = src;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    const openBoardZoomModal = openZoomModal;

    function closeZoomModal(e) {
      if (e.target.id === 'zoom-modal' || e.target.classList.contains('zoom-close-btn')) {
        const modal = document.getElementById('zoom-modal');
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const modal = document.getElementById('zoom-modal');
        if (modal && modal.classList.contains('open')) {
          modal.classList.remove('open');
          document.body.style.overflow = '';
        }
      }
    });

    function applyFitFilter(fit) {
      const url = new URL(window.location.href);
      url.searchParams.set('fit', fit);
      window.location.href = url.toString();
    }

    function applyCategoryFilter(cat) {
      const url = new URL(window.location.href);
      url.searchParams.set('cat', cat);
      window.location.href = url.toString();
    }

    function openInterestModal(crewSlug, productId, displayName) {
      document.getElementById('interest-crew-slug').value = crewSlug;
      document.getElementById('interest-product-id').value = productId;
      const title = document.getElementById('interest-title');
      if (title && displayName) {
        title.textContent = 'Stay Notified for ' + displayName;
      }
      const formSection = document.querySelector('.apparel-interest-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
      const emailInput = document.getElementById('interest-email-input');
      if (emailInput) emailInput.focus();
    }

    async function submitInterest(e) {
      e.preventDefault();
      const email = document.getElementById('interest-email-input').value.trim();
      const crewSlug = document.getElementById('interest-crew-slug').value;
      const productId = document.getElementById('interest-product-id').value;
      const feedback = document.getElementById('interest-feedback');
      const btn = document.getElementById('btn-interest-submit');

      if (!email) return;

      btn.disabled = true;
      btn.textContent = 'Saving…';

      try {
        const res = await fetch('/api/merchandise/interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, crewSlug, productId })
        });
        const data = await res.json();
        feedback.style.display = 'block';
        if (res.ok && data.success) {
          feedback.style.color = '#10B981';
          feedback.textContent = '✓ ' + data.message;
          document.getElementById('interest-email-input').value = '';
        } else {
          feedback.style.color = '#F43F5E';
          feedback.textContent = '✗ ' + (data.error || 'Could not register email.');
        }
      } catch (err) {
        feedback.style.display = 'block';
        feedback.style.color = '#F43F5E';
        feedback.textContent = '✗ Network error. Please try again.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Notify Me';
      }
    }
  </script>

</body>
</html>
`;
}
