/**
 * QuanterraOS: The 44 — Official Elite Eleven Active Artwork Gallery
 *
 * Implements Elite Eleven Revision (10 October 2026):
 * - Active collection: The 44 (supersedes 144 and 81 active plans)
 * - 4 Chapters: Origin Command, Cosmic Street, Executive Orbit, Royal Ascension
 * - 11 Members: Michael Quanterra (Founder), Quanta & Quantana (Leaders), 8 Specialists
 * - Pagination: 12 cards/page (12 + 12 + 12 + 8)
 * - Grid: 3 columns desktop, 2 mobile, 1 narrow
 * - Accessible artwork details modal, Web Share API, permalinks, sibling favorite button
 * - Preserves link to historical private/rollback archive for previously issued collectibles
 * - Quanta guide host in Cosmic Street attire
 */

import {
  THE_44_CATALOG,
  ELITE_ELEVEN_MEMBERS_LIST,
  CHAPTERS_44_LIST,
  getArtwork44ById,
  getArtwork44BySlug,
  filter44Artworks,
  type Artwork44Item
} from "./lib/art-44-catalog.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS
} from "./components/public-layout.ts";
import { renderArtGallery144PageHtml } from "./art-gallery-144-page.ts";

export interface ArtGallery44PageOptions {
  user?: { email?: string; tier?: string } | null;
  activeArtIdOrSlug?: string;
  chapterFilter?: string;
  chapter?: string;
  crewFilter?: string;
  member?: string;
  searchQuery?: string;
  page?: number;
  showRollbackArchive?: boolean;
}

export function renderArtGallery44PageHtml(options?: ArtGallery44PageOptions): string {
  const user = options?.user;
  const chapterFilter = options?.chapterFilter || options?.chapter;
  const crewFilter = options?.crewFilter || options?.member;
  
  if (options?.showRollbackArchive) {
    return renderArtGallery144PageHtml({ user, showRollbackArchive: true });
  }

  const initialArt = options?.activeArtIdOrSlug
    ? (getArtwork44ById(options.activeArtIdOrSlug) || getArtwork44BySlug(options.activeArtIdOrSlug))
    : undefined;

  const catalogJsonSafe = JSON.stringify(THE_44_CATALOG).replace(/</g, '\\u003c');
  const membersJsonSafe = JSON.stringify(ELITE_ELEVEN_MEMBERS_LIST).replace(/</g, '\\u003c');
  const chaptersJsonSafe = JSON.stringify(CHAPTERS_44_LIST).replace(/</g, '\\u003c');
  const initialArtJsonSafe = initialArt ? JSON.stringify(initialArt).replace(/</g, '\\u003c') : 'null';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>QuanterraOS 44 NFTs — QuanterraOS Fighter Pilots Official Collectible Art Gallery</title>
  <meta name="description" content="Explore QuanterraOS 44 NFTs: forty-four original collectible artworks across four cosmic chapters, featuring Founder Michael Quanterra, Quanta, Quantana, and the eight specialists.">
  <meta property="og:title" content="QuanterraOS 44 NFTs — QuanterraOS Fighter Pilots Artwork Collection">
  <meta property="og:description" content="Eleven members. Four cosmic chapters. QuanterraOS 44 NFTs verified master artworks. Assemble your crew.">
  <meta property="og:image" content="assets/art-44/q44-001.png">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --q-ink: #080B18;
      --q-card-bg: rgba(18, 23, 43, 0.85);
      --q-card-border: rgba(155, 108, 255, 0.2);
      --q-violet: #9B6CFF;
      --q-mint: #CBFF69;
      --q-chalk: #F4F3FA;
      --q-muted: #A6A4BA;
      --q-surface: #101426;
      --q-hover: #192038;
      --q-gold: #DFB843;
    }

    body {
      background: var(--q-ink);
      color: var(--q-chalk);
      font-family: var(--public-font-sans);
      margin: 0;
      padding: 0;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .gallery-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    /* Guide Banner */
    .quanta-host-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: linear-gradient(135deg, rgba(155, 108, 255, 0.12), rgba(203, 255, 105, 0.06));
      border: 1px solid var(--q-card-border);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 32px;
    }
    .quanta-host-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid var(--q-violet);
      object-fit: cover;
    }
    .quanta-host-meta {
      flex: 1;
    }
    .quanta-host-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--q-mint);
      font-family: var(--public-font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .quanta-host-text {
      font-size: 0.9rem;
      color: var(--q-chalk);
      margin: 2px 0 0;
    }

    /* Hero section */
    .gallery-hero {
      text-align: center;
      margin-bottom: 40px;
    }
    .gallery-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(155, 108, 255, 0.15);
      border: 1px solid rgba(155, 108, 255, 0.35);
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--q-mint);
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .gallery-title {
      font-size: 2.8rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 12px;
      background: linear-gradient(180deg, #FFFFFF 0%, #C4B5FD 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .gallery-subhead {
      font-size: 1.15rem;
      color: var(--q-muted);
      max-width: 760px;
      margin: 0 auto 24px;
    }
    .gallery-provenance-bar {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      font-size: 0.82rem;
      font-family: var(--public-font-mono);
      color: var(--q-muted);
      background: rgba(255, 255, 255, 0.03);
      padding: 8px 20px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .provenance-item span {
      color: var(--q-chalk);
      font-weight: 600;
    }

    /* Filter cluster */
    .filter-cluster {
      background: var(--q-card-bg);
      border: 1px solid var(--q-card-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 36px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .search-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .search-input-wrap {
      flex: 1;
      position: relative;
    }
    .search-input {
      width: 100%;
      background: rgba(9, 13, 26, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 12px 16px 12px 42px;
      color: var(--q-chalk);
      font-size: 0.95rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .search-input:focus {
      border-color: var(--q-violet);
    }
    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--q-muted);
      pointer-events: none;
    }
    .btn-archive-toggle {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--q-chalk);
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-family: var(--public-font-mono);
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .btn-archive-toggle:hover {
      background: rgba(155, 108, 255, 0.2);
      border-color: var(--q-violet);
    }

    /* Chapter tabs */
    .filter-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 16px;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--q-muted);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--q-chalk);
    }
    .tab-btn.active {
      background: var(--q-violet);
      color: #FFFFFF;
      border-color: var(--q-violet);
      font-weight: 600;
    }

    /* Member pills */
    .member-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .pill-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--q-chalk);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-family: var(--public-font-mono);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .pill-btn:hover {
      background: rgba(203, 255, 105, 0.1);
      border-color: var(--q-mint);
    }
    .pill-btn.active {
      background: var(--q-mint);
      color: #090A14;
      border-color: var(--q-mint);
      font-weight: 700;
    }

    /* Grid layout */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      margin-bottom: 40px;
    }
    @media (max-width: 980px) {
      .gallery-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
    }
    @media (max-width: 640px) {
      .gallery-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
    }

    /* Card styling */
    .art-card {
      background: var(--q-card-bg);
      border: 1px solid var(--q-card-border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }
    .art-card:hover {
      transform: translateY(-4px);
      border-color: rgba(155, 108, 255, 0.45);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    }
    .art-img-wrap {
      position: relative;
      width: 100%;
      padding-top: 100%; /* 1:1 Aspect Ratio */
      background: #0D1122;
      cursor: pointer;
      overflow: hidden;
    }
    .art-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .art-card:hover .art-img {
      transform: scale(1.03);
    }
    .art-chapter-badge {
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
      color: var(--q-chalk);
    }
    .art-fav-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(9, 13, 26, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--q-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: all 0.2s ease;
      z-index: 2;
    }
    .art-fav-btn:hover {
      color: #FF55C8;
      border-color: #FF55C8;
    }
    .art-fav-btn.favorited {
      color: #FF55C8;
      background: rgba(255, 85, 200, 0.15);
      border-color: #FF55C8;
    }

    .art-info {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .art-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .art-id {
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--q-mint);
      font-weight: 600;
    }
    .art-status-pill {
      font-family: var(--public-font-mono);
      font-size: 0.7rem;
      color: var(--q-muted);
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .art-card-title {
      font-size: 1.08rem;
      font-weight: 700;
      margin: 0 0 6px;
      color: var(--q-chalk);
    }
    .art-card-desc {
      font-size: 0.82rem;
      color: var(--q-muted);
      margin: 0 0 16px;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .art-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 12px;
    }
    .art-responsibility-tag {
      font-size: 0.75rem;
      color: var(--q-violet);
      font-weight: 600;
    }
    .btn-view-details {
      background: rgba(155, 108, 255, 0.15);
      border: 1px solid var(--q-violet);
      color: var(--q-chalk);
      font-size: 0.78rem;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-view-details:hover {
      background: var(--q-violet);
      color: #FFFFFF;
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin: 40px 0;
    }
    .page-btn {
      background: var(--q-card-bg);
      border: 1px solid var(--q-card-border);
      color: var(--q-chalk);
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-family: var(--public-font-mono);
      font-size: 0.85rem;
    }
    .page-btn.active {
      background: var(--q-violet);
      border-color: var(--q-violet);
      font-weight: 700;
    }
    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Modal */
    .art-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 6, 14, 0.85);
      backdrop-filter: blur(12px);
      z-index: 2000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .art-modal-overlay.open {
      display: flex;
    }
    .art-modal {
      background: #0E1326;
      border: 1px solid var(--q-card-border);
      border-radius: 16px;
      max-width: 960px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
      position: relative;
    }
    @media (max-width: 800px) {
      .art-modal {
        grid-template-columns: 1fr;
      }
    }
    .modal-img-col {
      background: #070914;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
    }
    .modal-img {
      max-width: 100%;
      height: auto;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }
    .modal-info-col {
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #FFFFFF;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-title {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0;
      color: #FFFFFF;
    }
    .modal-meta-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.75rem;
    }
    .modal-meta-pill {
      background: rgba(255, 255, 255, 0.06);
      padding: 4px 8px;
      border-radius: 4px;
      color: var(--q-chalk);
    }
    .modal-field-title {
      font-size: 0.75rem;
      font-family: var(--public-font-mono);
      color: var(--q-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .modal-field-content {
      font-size: 0.88rem;
      color: var(--q-chalk);
      line-height: 1.5;
    }
    .modal-code-box {
      background: #080A16;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 10px 12px;
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--q-mint);
      word-break: break-all;
    }
    .modal-action-row {
      display: flex;
      gap: 12px;
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .btn-share {
      flex: 1;
      background: var(--q-violet);
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-copy-link {
      background: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 0.88rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/art-gallery", user })}

  <main class="gallery-container">
    <!-- Quanta Restrained Guide Banner -->
    <div class="quanta-host-card">
      <img src="/assets/art-44/q44-002-thumb.png" alt="Quanta Guide" class="quanta-host-avatar">
      <div class="quanta-host-meta">
        <div class="quanta-host-title">Quanta // Cosmic Street Guide</div>
        <p class="quanta-host-text">Welcome to <strong>QuanterraOS 44 NFTs — The 44 — QuanterraOS Fighter Pilots</strong>. Explore forty-four collectible master artworks across four chapters. No wallet required to browse.</p>
      </div>
      <a href="/art-gallery?archive=rollback" class="btn-archive-toggle">View Rollback Archive &rarr;</a>
    </div>

    <!-- Gallery Hero -->
    <header class="gallery-hero">
      <div class="gallery-badge">QuanterraOS 44 NFTs · QuanterraOS Fighter Pilots Collection</div>
      <h1 class="gallery-title">Assemble your crew. Explore QuanterraOS 44 NFTs.</h1>
      <p class="gallery-subhead">
        Forty-four original collectible masterworks by Michael Quanterra and QuanterraOS Foundation. Exactly eleven members across four cosmic chapters: Origin Command, Cosmic Street, Executive Orbit, and Royal Ascension.
      </p>
      <div class="gallery-provenance-bar">
        <div class="provenance-item">Collection: <span>QuanterraOS 44 NFTs</span></div>
        <div class="provenance-item">Members: <span>11 (Founder + 2 Leaders + 8 Specialists)</span></div>
        <div class="provenance-item">Chapters: <span>4 (11 per chapter)</span></div>
        <div class="provenance-item">Status: <span>Artwork · NFT-Ready (Unminted)</span></div>
        <div class="provenance-item">Format: <span>High-Res PNG Masters</span></div>
      </div>
    </header>

    <!-- Filter Cluster -->
    <section class="filter-cluster" aria-label="Gallery Filters">
      <div class="search-row">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="gallery-search" class="search-input" placeholder="Search by member, chapter, visual identity, or prompt keywords..." oninput="handleSearch(this.value)">
        </div>
        <button type="button" class="btn-archive-toggle" onclick="resetFilters()">Reset</button>
      </div>

      <!-- Chapter Tabs -->
      <div class="filter-tabs" id="chapter-tabs">
        <button type="button" class="tab-btn active" data-chapter="all" onclick="setChapter('all')">All 4 Chapters</button>
        <button type="button" class="tab-btn" data-chapter="origin-command" onclick="setChapter('origin-command')">Ch 1: Origin Command</button>
        <button type="button" class="tab-btn" data-chapter="cosmic-street" onclick="setChapter('cosmic-street')">Ch 2: Cosmic Street</button>
        <button type="button" class="tab-btn" data-chapter="executive-orbit" onclick="setChapter('executive-orbit')">Ch 3: Executive Orbit</button>
        <button type="button" class="tab-btn" data-chapter="royal-ascension" onclick="setChapter('royal-ascension')">Ch 4: Royal Ascension</button>
      </div>

      <!-- Member Pills -->
      <div class="member-pills" id="member-pills">
        <button type="button" class="pill-btn active" data-crew="all" onclick="setMember('all')">All 11 Members</button>
        <button type="button" class="pill-btn" data-crew="michael" onclick="setMember('michael')">👑 Michael Quanterra (Founder)</button>
        <button type="button" class="pill-btn" data-crew="quanta" onclick="setMember('quanta')">✦ Quanta (Leader)</button>
        <button type="button" class="pill-btn" data-crew="quantana" onclick="setMember('quantana')">✦ Quantana (Queen)</button>
        <button type="button" class="pill-btn" data-crew="draco" onclick="setMember('draco')">Draco</button>
        <button type="button" class="pill-btn" data-crew="wolf" onclick="setMember('wolf')">Wolf</button>
        <button type="button" class="pill-btn" data-crew="falcon" onclick="setMember('falcon')">Falcon</button>
        <button type="button" class="pill-btn" data-crew="quantum-fox" onclick="setMember('quantum-fox')">Quantum Fox</button>
        <button type="button" class="pill-btn" data-crew="sentinel" onclick="setMember('sentinel')">Sentinel</button>
        <button type="button" class="pill-btn" data-crew="kraken" onclick="setMember('kraken')">Kraken</button>
        <button type="button" class="pill-btn" data-crew="lion" onclick="setMember('lion')">Lion</button>
        <button type="button" class="pill-btn" data-crew="phoenix" onclick="setMember('phoenix')">Phoenix</button>
      </div>
    </section>

    <!-- Artworks Grid (Rendered by client-side engine with server-side hydration) -->
    <div class="gallery-grid" id="gallery-grid">
      <!-- Populated via script below -->
    </div>

    <!-- Pagination (12 per page: 12 + 12 + 12 + 8) -->
    <div class="pagination-bar" id="pagination-bar"></div>
  </main>

  <!-- Artwork Detail Modal -->
  <div class="art-modal-overlay" id="art-modal-overlay" onclick="closeModalOnOverlay(event)">
    <div class="art-modal" id="art-modal">
      <button type="button" class="modal-close-btn" onclick="closeModal()">&times;</button>
      <div class="modal-img-col">
        <img src="" alt="" id="modal-img" class="modal-img">
      </div>
      <div class="modal-info-col">
        <div>
          <div class="modal-meta-strip">
            <span class="modal-meta-pill" id="modal-id"></span>
            <span class="modal-meta-pill" id="modal-chapter"></span>
            <span class="modal-meta-pill" style="color:var(--q-mint);">Artwork · NFT-ready</span>
          </div>
          <h2 class="modal-title" id="modal-title" style="margin-top:8px;"></h2>
        </div>

        <div>
          <div class="modal-field-title">Visual Identity Signature</div>
          <div class="modal-field-content" id="modal-visual"></div>
        </div>

        <div>
          <div class="modal-field-title">Product & Analytical Responsibility</div>
          <div class="modal-field-content" id="modal-responsibility" style="color:var(--q-mint);"></div>
        </div>

        <div>
          <div class="modal-field-title">Description</div>
          <div class="modal-field-content" id="modal-desc"></div>
        </div>

        <div>
          <div class="modal-field-title">Generation Prompt</div>
          <div class="modal-code-box" id="modal-prompt"></div>
        </div>

        <div>
          <div class="modal-field-title">SHA-256 Provenance Hash</div>
          <div class="modal-code-box" id="modal-sha" style="font-size:0.7rem;"></div>
        </div>

        <div class="modal-action-row">
          <button type="button" class="btn-share" onclick="shareCurrentArt()">Share Artwork</button>
          <button type="button" class="btn-copy-link" onclick="copyPermalink()">Copy Link</button>
        </div>
      </div>
    </div>
  </div>

  ${renderPublicFooter()}

  <!-- Client-side Interactive Engine -->
  <script>
    const CATALOG = ${catalogJsonSafe};
    const MEMBERS = ${membersJsonSafe};
    const CHAPTERS = ${chaptersJsonSafe};
    const INITIAL_ART = ${initialArtJsonSafe};

    let currentChapter = "${options?.chapterFilter || 'all'}";
    let currentMember = "${options?.crewFilter || 'all'}";
    let currentSearch = "${options?.searchQuery || ''}";
    let currentPage = ${options?.page || 1};
    const PAGE_SIZE = 12;

    let favorites = new Set();
    try {
      const saved = localStorage.getItem("quanterra_art_favs");
      if (saved) favorites = new Set(JSON.parse(saved));
    } catch (e) {}

    let currentModalArt = null;

    function renderGallery() {
      let filtered = CATALOG.filter(art => {
        if (currentChapter !== "all" && art.chapterId !== currentChapter) return false;
        if (currentMember !== "all" && art.crewCanonicalId !== currentMember) return false;
        if (currentSearch) {
          const q = currentSearch.toLowerCase();
          const match = art.id.toLowerCase().includes(q) ||
                        art.title.toLowerCase().includes(q) ||
                        art.memberName.toLowerCase().includes(q) ||
                        art.chapterTitle.toLowerCase().includes(q) ||
                        art.visualIdentity.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
      if (currentPage > totalPages) currentPage = totalPages;

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

      const grid = document.getElementById("gallery-grid");
      if (pageItems.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--q-muted);">' +
          '<div style="font-size: 2rem; margin-bottom: 8px;">🛸</div>' +
          '<div style="font-size: 1.1rem; font-weight: 700; color: var(--q-chalk);">No artworks found</div>' +
          '<div style="font-size: 0.9rem; margin-top: 4px;">Try clearing your filters or search keywords.</div>' +
          '</div>';
      } else {
        grid.innerHTML = pageItems.map(art => {
          const isFav = favorites.has(art.id);
          return \`
            <article class="art-card" id="card-\${art.id}">
              <div class="art-img-wrap" onclick="openModal('\${art.id}')">
                <img src="\${art.originalAssetUrl}" alt="\${art.alt}" class="art-img" loading="lazy" onerror="if(!this.dataset.tried){this.dataset.tried='1'; this.src=this.src.startsWith('/')?this.src.slice(1):'/'+this.src;}">
                <div class="art-chapter-badge">Ch 0\${art.chapterNumber}: \${art.chapterTitle}</div>
                <button type="button" class="art-fav-btn \${isFav ? 'favorited' : ''}" onclick="toggleFav(event, '\${art.id}')" aria-label="Favorite \${art.title}">
                  \${isFav ? '♥' : '♡'}
                </button>
              </div>
              <div class="art-info">
                <div class="art-meta-row">
                  <span class="art-id">\${art.id.toUpperCase()}</span>
                  <span class="art-status-pill">Artwork · NFT-ready</span>
                </div>
                <h3 class="art-card-title">\${art.title}</h3>
                <p class="art-card-desc">\${art.visualIdentity}</p>
                <div class="art-card-footer">
                  <span class="art-responsibility-tag">\${art.productResponsibility}</span>
                  <button type="button" class="btn-view-details" onclick="openModal('\${art.id}')">Inspect &rarr;</button>
                </div>
              </div>
            </article>
          \`;
        }).join("");
      }

      renderPagination(totalPages);
      updateUrl();
    }

    function renderPagination(totalPages) {
      const container = document.getElementById("pagination-bar");
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }

      let html = \`<button class="page-btn" onclick="goToPage(\${currentPage - 1})" \${currentPage === 1 ? 'disabled' : ''}>&larr; Prev</button>\`;
      for (let i = 1; i <= totalPages; i++) {
        html += \`<button class="page-btn \${i === currentPage ? 'active' : ''}" onclick="goToPage(\${i})">\${i}</button>\`;
      }
      html += \`<button class="page-btn" onclick="goToPage(\${currentPage + 1})" \${currentPage === totalPages ? 'disabled' : ''}>Next &rarr;</button>\`;
      container.innerHTML = html;
    }

    function goToPage(p) {
      currentPage = p;
      renderGallery();
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }

    function setChapter(ch) {
      currentChapter = ch;
      currentPage = 1;
      document.querySelectorAll("#chapter-tabs .tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.chapter === ch);
      });
      renderGallery();
    }

    function setMember(m) {
      currentMember = m;
      currentPage = 1;
      document.querySelectorAll("#member-pills .pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.crew === m);
      });
      renderGallery();
    }

    function handleSearch(q) {
      currentSearch = q;
      currentPage = 1;
      renderGallery();
    }

    function resetFilters() {
      currentChapter = "all";
      currentMember = "all";
      currentSearch = "";
      currentPage = 1;
      document.getElementById("gallery-search").value = "";
      document.querySelectorAll("#chapter-tabs .tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.chapter === "all"));
      document.querySelectorAll("#member-pills .pill-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.crew === "all"));
      renderGallery();
    }

    function toggleFav(e, id) {
      e.stopPropagation();
      if (favorites.has(id)) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }
      try {
        localStorage.setItem("quanterra_art_favs", JSON.stringify(Array.from(favorites)));
      } catch (err) {}
      renderGallery();
    }

    function openModal(id) {
      const art = CATALOG.find(a => a.id.toLowerCase() === id.toLowerCase() || a.slug === id);
      if (!art) return;
      currentModalArt = art;

      document.getElementById("modal-img").src = art.originalAssetUrl;
      document.getElementById("modal-img").alt = art.alt;
      document.getElementById("modal-id").textContent = art.id.toUpperCase();
      document.getElementById("modal-chapter").textContent = "Ch 0" + art.chapterNumber + ": " + art.chapterTitle;
      document.getElementById("modal-title").textContent = art.title;
      document.getElementById("modal-visual").textContent = art.visualIdentity;
      document.getElementById("modal-responsibility").textContent = art.productResponsibility;
      document.getElementById("modal-desc").textContent = art.description;
      document.getElementById("modal-prompt").textContent = art.prompt;
      document.getElementById("modal-sha").textContent = art.sha256;

      document.getElementById("art-modal-overlay").classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      document.getElementById("art-modal-overlay").classList.remove("open");
      document.body.style.overflow = "";
      currentModalArt = null;
    }

    function closeModalOnOverlay(e) {
      if (e.target === document.getElementById("art-modal-overlay")) {
        closeModal();
      }
    }

    function shareCurrentArt() {
      if (!currentModalArt) return;
      const permalink = window.location.origin + '/art-gallery?art=' + currentModalArt.id;
      if (navigator.share) {
        navigator.share({
          title: currentModalArt.title,
          text: currentModalArt.description,
          url: permalink
        }).catch(() => {});
      } else {
        copyPermalink();
      }
    }

    function copyPermalink() {
      if (!currentModalArt) return;
      const permalink = window.location.origin + '/art-gallery?art=' + currentModalArt.id;
      navigator.clipboard.writeText(permalink).then(() => {
        alert("Permalink copied to clipboard: " + permalink);
      });
    }

    function updateUrl() {
      const params = new URLSearchParams();
      if (currentChapter !== "all") params.set("chapter", currentChapter);
      if (currentMember !== "all") params.set("crew", currentMember);
      if (currentSearch) params.set("q", currentSearch);
      if (currentPage > 1) params.set("page", currentPage);
      const str = params.toString();
      const newUrl = str ? "/art-gallery?" + str : "/art-gallery";
      window.history.replaceState({}, "", newUrl);
    }

    // Initialize
    document.addEventListener("DOMContentLoaded", () => {
      renderGallery();
      if (INITIAL_ART) {
        openModal(INITIAL_ART.id);
      }
    });
  </script>
</body>
</html>`;
}
