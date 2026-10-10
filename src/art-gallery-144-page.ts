/**
 * QuanterraOS: The 144 — Canonical Artwork Gallery Page
 *
 * Implements AGENT_HANDOFF.md:
 * - Headline: "Eight guardians. Eighteen worlds. One connected universe."
 * - Support: "Explore 144 original Flight Crew artworks inspired by Michael Quantara's QuanterraOS universe."
 * - Primary CTA: "Explore the collection" (scrolls to explorer)
 * - Secondary CTA: "Meet Quanta"
 * - 8 Original Council Members: Draco, Wolf, Falcon, Quantum Fox, Sentinel, Kraken, Lion, Phoenix
 * - Quanta leads outside those eight as lead mascot, virtual assistant, and fictional Global Galactic Leader
 * - 18 Cosmic Chapters: 8 x 18 = 144 individually generated, verified artworks
 * - Visual System: Ink #090A14, Violet #9B6CFF, Bright Mint #CBFF69, Chalk #F4F3FA, Muted #A6A4BA
 * - Features: Search, crew filter, chapter filter, favorites toggle, 24-item accessible pagination,
 *   artwork detail modal, Web Share API, clipboard permalink, AI provenance disclosure,
 *   and internal rollback archive for legacy campaign assets.
 */

import {
  THE_144_CATALOG,
  COUNCIL_MEMBERS_LIST,
  CHAPTERS_LIST,
  getArtworkById,
  getArtworkBySlug,
  type Artwork144Item
} from "./lib/art-144-catalog.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS
} from "./components/public-layout.ts";

export interface ArtGalleryPageOptions {
  user?: { email?: string; tier?: string } | null;
  activeArtIdOrSlug?: string;
  crewFilter?: string;
  chapterFilter?: string;
  searchQuery?: string;
  page?: number;
  showRollbackArchive?: boolean;
}

export function renderArtGallery144PageHtml(options?: ArtGalleryPageOptions): string {
  const user = options?.user;
  const showRollback = Boolean(options?.showRollbackArchive);

  // If user requested rollback archive, render the private archive view
  if (showRollback) {
    return renderRollbackArchiveHtml(user);
  }

  const initialArt = options?.activeArtIdOrSlug 
    ? (getArtworkById(options.activeArtIdOrSlug) || getArtworkBySlug(options.activeArtIdOrSlug)) 
    : undefined;

  const catalogJsonSafe = JSON.stringify(THE_144_CATALOG).replace(/</g, '\\u003c');
  const membersJsonSafe = JSON.stringify(COUNCIL_MEMBERS_LIST).replace(/</g, '\\u003c');
  const chaptersJsonSafe = JSON.stringify(CHAPTERS_LIST).replace(/</g, '\\u003c');
  const initialArtJsonSafe = initialArt ? JSON.stringify(initialArt).replace(/</g, '\\u003c') : 'null';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>QuanterraOS: The 144 — Official Flight Crew Artwork Gallery</title>
  <meta name="description" content="Eight guardians. Eighteen worlds. One connected universe. Explore 144 original Flight Crew artworks inspired by Michael Quantara's QuanterraOS universe.">
  <meta property="og:title" content="QuanterraOS: The 144 — Official Artwork Collection">
  <meta property="og:description" content="Eight guardians. Eighteen worlds. One connected universe. 144 individually generated Flight Crew artworks.">
  <meta property="og:image" content="https://quanterraos.com/assets/art-144/q144-001.svg">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --q-ink: #090A14;
      --q-card-bg: rgba(18, 22, 38, 0.85);
      --q-card-border: rgba(155, 108, 255, 0.18);
      --q-violet: #9B6CFF;
      --q-mint: #CBFF69;
      --q-chalk: #F4F3FA;
      --q-muted: #A6A4BA;
      --q-surface: #101426;
      --q-hover: #192038;
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
      padding: 32px 24px 96px;
    }

    /* Restrained Universe Hero */
    .universe-hero {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 40px;
      align-items: center;
      background: linear-gradient(135deg, rgba(22, 27, 49, 0.7) 0%, rgba(14, 18, 33, 0.95) 100%);
      border: 1px solid var(--q-card-border);
      border-radius: 20px;
      padding: 48px;
      margin-bottom: 40px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }

    .hero-glow-orb {
      position: absolute;
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, rgba(155, 108, 255, 0.15) 0%, rgba(203, 255, 105, 0.05) 50%, transparent 70%);
      top: -100px;
      right: -100px;
      border-radius: 50%;
      pointer-events: none;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
      color: var(--q-mint);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .hero-eyebrow-badge {
      background: rgba(203, 255, 105, 0.15);
      border: 1px solid rgba(203, 255, 105, 0.4);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
    }

    .hero-title {
      font-size: clamp(2.4rem, 4vw, 3.8rem);
      font-weight: 800;
      color: #FFFFFF;
      line-height: 1.12;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
    }

    .hero-headline {
      font-size: clamp(1.2rem, 2vw, 1.5rem);
      font-weight: 600;
      color: var(--q-violet);
      margin: 0 0 16px;
    }

    .hero-support {
      font-size: 1.05rem;
      color: var(--q-muted);
      max-width: 620px;
      line-height: 1.65;
      margin: 0 0 28px;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }

    .btn-primary-explore {
      background: var(--q-mint);
      color: #090A14;
      font-weight: 700;
      font-size: 0.98rem;
      padding: 14px 28px;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
      box-sizing: border-box;
      border: none;
      cursor: pointer;
    }
    .btn-primary-explore:hover {
      background: #D9FF85;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(203, 255, 105, 0.3);
    }

    .btn-secondary-quanta {
      background: rgba(155, 108, 255, 0.12);
      border: 1px solid var(--q-violet);
      color: #FFFFFF;
      font-weight: 600;
      font-size: 0.98rem;
      padding: 14px 24px;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
      box-sizing: border-box;
      cursor: pointer;
    }
    .btn-secondary-quanta:hover {
      background: rgba(155, 108, 255, 0.24);
      border-color: #B58EFF;
      transform: translateY(-2px);
    }

    .hero-visual-card {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--q-card-border);
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
      background: #05070E;
    }
    .hero-visual-img {
      width: 100%;
      height: auto;
      display: block;
      aspect-ratio: 1 / 1;
      object-fit: contain;
    }
    .hero-visual-badge {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      background: rgba(9, 10, 20, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hero-visual-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #FFF;
    }
    .hero-visual-tag {
      font-family: var(--public-font-mono);
      font-size: 0.75rem;
      color: var(--q-mint);
      font-weight: 700;
    }

    /* Three Quick Orientation Tiles */
    .orientation-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 48px;
    }
    .orient-card {
      background: var(--q-card-bg);
      border: 1px solid rgba(155, 108, 255, 0.14);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .orient-card:hover {
      border-color: var(--q-violet);
      transform: translateY(-3px);
      background: var(--q-hover);
    }
    .orient-badge {
      font-family: var(--public-font-mono);
      font-size: 0.74rem;
      color: var(--q-mint);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }
    .orient-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFF;
      margin: 0 0 8px;
    }
    .orient-desc {
      font-size: 0.92rem;
      color: var(--q-muted);
      line-height: 1.55;
      margin: 0 0 16px;
    }
    .orient-link {
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--q-violet);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .orient-link:hover {
      color: var(--q-mint);
      text-decoration: underline;
    }

    /* Collection Explorer Controls */
    .explorer-panel {
      background: var(--q-surface);
      border: 1px solid rgba(155, 108, 255, 0.2);
      border-radius: 18px;
      padding: 28px;
      margin-bottom: 36px;
    }
    .explorer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .explorer-title-wrap h2 {
      font-size: 1.6rem;
      font-weight: 800;
      color: #FFF;
      margin: 0 0 4px;
    }
    .explorer-stats {
      font-family: var(--public-font-mono);
      font-size: 0.84rem;
      color: var(--q-mint);
      font-weight: 600;
    }

    .explorer-controls {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1.2fr auto auto;
      gap: 14px;
      align-items: center;
    }

    .search-input-wrap {
      position: relative;
    }
    .search-input {
      width: 100%;
      background: rgba(9, 10, 20, 0.8);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 12px 16px;
      color: #FFF;
      font-size: 0.95rem;
      font-family: var(--public-font-sans);
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
      min-height: 44px;
    }
    .search-input:focus {
      border-color: var(--q-mint);
      box-shadow: 0 0 12px rgba(203, 255, 105, 0.2);
    }
    .search-input::placeholder {
      color: #64748B;
    }

    .filter-select {
      background: rgba(9, 10, 20, 0.8);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 12px 14px;
      color: #FFF;
      font-size: 0.92rem;
      font-family: var(--public-font-sans);
      outline: none;
      cursor: pointer;
      min-height: 44px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }
    .filter-select:focus {
      border-color: var(--q-violet);
    }
    .filter-select option {
      background: #090A14;
      color: #FFF;
    }

    .btn-toggle-fav {
      background: rgba(255, 51, 102, 0.12);
      border: 1px solid rgba(255, 51, 102, 0.3);
      color: #FF6688;
      border-radius: 10px;
      padding: 0 18px;
      font-size: 0.88rem;
      font-weight: 700;
      min-height: 44px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .btn-toggle-fav.active {
      background: #FF3366;
      color: #FFF;
      border-color: #FF3366;
      box-shadow: 0 0 16px rgba(255, 51, 102, 0.4);
    }

    .btn-reset-filters {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.12);
      color: var(--q-muted);
      border-radius: 10px;
      padding: 0 16px;
      font-size: 0.84rem;
      font-family: var(--public-font-mono);
      min-height: 44px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-reset-filters:hover {
      color: #FFF;
      border-color: rgba(255,255,255,0.3);
    }

    /* Crew Fast-Pills */
    .crew-pills-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .crew-pill {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--q-muted);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .crew-pill:hover {
      background: rgba(155, 108, 255, 0.15);
      color: #FFF;
      border-color: var(--q-violet);
    }
    .crew-pill.active {
      background: var(--q-violet);
      color: #FFF;
      border-color: var(--q-violet);
      box-shadow: 0 0 12px rgba(155, 108, 255, 0.35);
    }

    /* Artwork Grid */
    .art-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 48px;
    }
    @media (max-width: 1200px) {
      .art-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 860px) {
      .art-grid { grid-template-columns: repeat(2, 1fr); }
      .explorer-controls { grid-template-columns: 1fr; }
      .universe-hero { grid-template-columns: 1fr; padding: 28px; }
      .orientation-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) {
      .art-grid { grid-template-columns: 1fr; }
    }

    .art-card {
      background: var(--q-card-bg);
      border: 1px solid var(--q-card-border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
      cursor: pointer;
      position: relative;
    }
    .art-card:hover {
      transform: translateY(-4px);
      border-color: var(--q-mint);
      box-shadow: 0 14px 32px rgba(0,0,0,0.6);
    }
    .art-card:focus-visible {
      outline: 2px solid var(--q-mint);
      outline-offset: 2px;
    }

    .art-img-wrap {
      width: 100%;
      aspect-ratio: 1 / 1;
      background: #05070E;
      position: relative;
      overflow: hidden;
    }
    .art-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .art-card:hover .art-thumb-img {
      transform: scale(1.02);
    }

    .art-card-fav-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(9, 10, 20, 0.75);
      border: 1px solid rgba(255,255,255,0.15);
      color: #CBD5E1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
      z-index: 2;
    }
    .art-card-fav-btn:hover {
      background: #FF3366;
      color: #FFF;
      border-color: #FF3366;
      transform: scale(1.1);
    }
    .art-card-fav-btn.favorited {
      background: #FF3366;
      color: #FFF;
      border-color: #FF3366;
    }

    .art-card-id-tag {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(9, 10, 20, 0.85);
      border: 1px solid rgba(255,255,255,0.15);
      color: var(--q-mint);
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .art-card-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
    }
    .art-card-chapter {
      font-family: var(--public-font-mono);
      font-size: 0.74rem;
      color: var(--q-violet);
      margin-bottom: 4px;
      font-weight: 600;
    }
    .art-card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 10px;
      line-height: 1.35;
    }
    .art-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 12px;
      margin-top: 6px;
    }
    .art-card-member {
      font-size: 0.82rem;
      font-weight: 600;
      color: #CBD5E1;
    }
    .art-status-pill {
      font-family: var(--public-font-mono);
      font-size: 0.7rem;
      color: var(--q-mint);
      background: rgba(203, 255, 105, 0.1);
      border: 1px solid rgba(203, 255, 105, 0.25);
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 80px 24px;
      background: var(--q-card-bg);
      border: 1px dashed rgba(255,255,255,0.15);
      border-radius: 18px;
    }
    .empty-icon {
      font-size: 42px;
      margin-bottom: 16px;
    }
    .empty-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #FFF;
      margin: 0 0 8px;
    }
    .empty-desc {
      color: var(--q-muted);
      max-width: 480px;
      margin: 0 auto 20px;
      font-size: 0.95rem;
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-bottom: 64px;
      flex-wrap: wrap;
    }
    .page-btn {
      background: var(--q-surface);
      border: 1px solid rgba(255,255,255,0.15);
      color: #FFF;
      font-family: var(--public-font-mono);
      font-size: 0.88rem;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      min-height: 44px;
      min-width: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .page-btn:hover:not(:disabled) {
      border-color: var(--q-mint);
      color: var(--q-mint);
    }
    .page-btn.active {
      background: var(--q-mint);
      color: #090A14;
      border-color: var(--q-mint);
      font-weight: 800;
    }
    .page-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    /* Provenance Panel */
    .provenance-section {
      background: var(--q-card-bg);
      border: 1px solid var(--q-card-border);
      border-radius: 20px;
      padding: 40px;
      margin-bottom: 48px;
    }
    .provenance-header {
      margin-bottom: 24px;
    }
    .provenance-eyebrow {
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--q-violet);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .provenance-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: #FFF;
      margin: 0;
    }
    .provenance-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-top: 24px;
    }
    @media (max-width: 860px) {
      .provenance-grid { grid-template-columns: 1fr; }
    }
    .prov-item {
      background: rgba(9, 10, 20, 0.6);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 20px;
    }
    .prov-label {
      font-family: var(--public-font-mono);
      font-size: 0.76rem;
      color: var(--q-mint);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .prov-val {
      font-size: 0.94rem;
      color: #E2E8F0;
      line-height: 1.5;
    }

    /* Rollback Archive Link Banner */
    .archive-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(14, 18, 33, 0.6);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 16px 24px;
      font-size: 0.88rem;
      color: var(--q-muted);
    }
    .archive-link {
      color: var(--q-violet);
      font-family: var(--public-font-mono);
      font-weight: 600;
      text-decoration: none;
    }
    .archive-link:hover {
      text-decoration: underline;
      color: var(--q-mint);
    }

    /* Artwork Detail Modal */
    .art-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(5, 7, 14, 0.88);
      backdrop-filter: blur(12px);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-y: auto;
    }
    .art-modal-overlay.open {
      display: flex;
    }

    .art-modal-content {
      background: #0D1120;
      border: 1px solid var(--q-violet);
      border-radius: 20px;
      max-width: 1040px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 24px 60px rgba(0,0,0,0.8);
      display: grid;
      grid-template-columns: 1fr 1fr;
      position: relative;
    }
    @media (max-width: 860px) {
      .art-modal-content { grid-template-columns: 1fr; }
    }

    .modal-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #FFF;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      z-index: 10;
      transition: all 0.2s ease;
    }
    .modal-close-btn:hover {
      background: #FF3366;
      border-color: #FF3366;
    }

    .modal-media-wrap {
      background: #05070E;
      padding: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-right: 1px solid rgba(255,255,255,0.08);
    }
    .modal-art-img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 12px 30px rgba(0,0,0,0.7);
    }

    .modal-info-wrap {
      padding: 36px 32px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .modal-header-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .modal-id-badge {
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      background: rgba(203, 255, 105, 0.15);
      border: 1px solid var(--q-mint);
      color: var(--q-mint);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
    }
    .modal-chapter-tag {
      font-family: var(--public-font-mono);
      font-size: 0.8rem;
      color: var(--q-violet);
      font-weight: 600;
    }
    .modal-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #FFF;
      margin: 0 0 12px;
      line-height: 1.25;
    }
    .modal-narrative {
      font-size: 0.95rem;
      color: #CBD5E1;
      line-height: 1.6;
      margin: 0 0 20px;
    }
    .modal-meta-table {
      background: rgba(5, 7, 14, 0.6);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 0.84rem;
    }
    .modal-meta-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .modal-meta-row:last-child {
      border-bottom: none;
    }
    .modal-meta-label {
      color: var(--q-muted);
      font-family: var(--public-font-mono);
    }
    .modal-meta-val {
      color: #FFF;
      font-weight: 600;
      text-align: right;
    }

    .modal-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .modal-btn {
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      transition: all 0.2s ease;
      text-decoration: none;
      box-sizing: border-box;
    }
    .modal-btn-primary {
      background: var(--q-mint);
      color: #090A14;
      border: none;
    }
    .modal-btn-primary:hover {
      background: #D9FF85;
    }
    .modal-btn-secondary {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #FFF;
    }
    .modal-btn-secondary:hover {
      background: rgba(255,255,255,0.16);
    }
    .modal-btn-fav {
      background: rgba(255, 51, 102, 0.15);
      border: 1px solid #FF3366;
      color: #FF3366;
    }
    .modal-btn-fav.active {
      background: #FF3366;
      color: #FFF;
    }

    /* Quanta Guidance Drawer / Modal */
    .quanta-modal {
      background: #0E1224;
      border: 1px solid var(--q-mint);
      border-radius: 20px;
      max-width: 680px;
      width: 100%;
      padding: 36px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.85);
      position: relative;
    }
    .quanta-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .quanta-avatar-box {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid var(--q-mint);
      box-shadow: 0 0 16px rgba(203, 255, 105, 0.4);
    }
    .quanta-avatar-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .quanta-title-wrap h3 {
      font-size: 1.3rem;
      font-weight: 800;
      color: #FFF;
      margin: 0 0 4px;
    }
    .quanta-role-badge {
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--q-mint);
      font-weight: 600;
    }

    /* Accessibility focus */
    button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {
      outline: 2px solid var(--q-mint);
      outline-offset: 2px;
    }

    /* Toast Notification */
    .toast-msg {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0E1428;
      border: 1px solid var(--q-mint);
      color: #FFF;
      padding: 12px 20px;
      border-radius: 10px;
      font-family: var(--public-font-mono);
      font-size: 0.88rem;
      box-shadow: 0 12px 30px rgba(0,0,0,0.6);
      z-index: 10000;
      display: none;
      animation: fadeIn 0.2s ease;
    }
    .toast-msg.show {
      display: block;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/art-gallery", user })}

  <main class="gallery-container">
    <!-- Universe Hero -->
    <section class="universe-hero" aria-labelledby="hero-title-h1">
      <div class="hero-glow-orb"></div>
      <div class="hero-content">
        <div class="hero-eyebrow">
          <span class="hero-eyebrow-badge">COLLECTION ARCHIVE</span>
          <span>QUANTERRAOS: THE 144</span>
        </div>
        <h1 class="hero-title" id="hero-title-h1">QuanterraOS: The 144</h1>
        <div class="hero-headline">Eight guardians. Eighteen worlds. One connected universe.</div>
        <p class="hero-support">
          Explore 144 original Flight Crew artworks inspired by Michael Quantara’s QuanterraOS universe.
          Eight original Council guardians journeying through eighteen planetary sectors.
          NFT-ready digital artwork created for deep narrative exploration.
        </p>
        <div class="hero-actions">
          <a href="#collection-explorer" class="btn-primary-explore" id="btn-explore-anchor">
            <span>Explore the collection</span> &darr;
          </a>
          <button type="button" class="btn-secondary-quanta" id="btn-meet-quanta">
            <span>👑 Meet Quanta</span>
          </button>
        </div>
      </div>
      <div class="hero-visual-card">
        <img src="/assets/art-144/q144-001.svg" alt="Draco: Ignition in Orbit Origin (QuanterraOS: The 144)" class="hero-visual-img" id="hero-feature-img">
        <div class="hero-visual-badge">
          <div>
            <div class="hero-visual-title">Piece #001 · Draco in Orbit Origin</div>
            <div style="font-size:0.75rem; color:#94A3B8;">8 Guardians &times; 18 Chapters</div>
          </div>
          <span class="hero-visual-tag">144 / 144 WORKS</span>
        </div>
      </div>
    </section>

    <!-- Three Quick Orientation Tiles -->
    <section class="orientation-grid" aria-label="Orientation Overview">
      <div class="orient-card">
        <div>
          <div class="orient-badge">COUNCIL ROSTER</div>
          <h3 class="orient-title">Meet the Eight</h3>
          <p class="orient-desc">
            Draco, Wolf, Falcon, Quantum Fox, Sentinel, Kraken, Lion, and Phoenix.
            Eight canonical flight guardians safeguarding prediction and capital integrity.
          </p>
        </div>
        <a href="#collection-explorer" class="orient-link" onclick="window.filterByCrew('draco'); return false;">
          <span>Filter by guardians</span> &rarr;
        </a>
      </div>

      <div class="orient-card">
        <div>
          <div class="orient-badge">COSMIC ATLAS</div>
          <h3 class="orient-title">Explore Eighteen Worlds</h3>
          <p class="orient-desc">
            From Orbit Origin and Cyber Nebula to Chronos Gateway and Galactic Core.
            Eighteen planetary sectors illustrating relativistic flight mechanics.
          </p>
        </div>
        <a href="#collection-explorer" class="orient-link" onclick="window.filterByChapter(1); return false;">
          <span>Explore worlds</span> &rarr;
        </a>
      </div>

      <div class="orient-card">
        <div>
          <div class="orient-badge">ORIGIN &amp; RIGHTS</div>
          <h3 class="orient-title">Read Creator Story</h3>
          <p class="orient-desc">
            Created by Michael Quantara. Digital art creator face, balanced perspective arrows,
            and neural generation provenance. Zero unverified minting claims.
          </p>
        </div>
        <a href="#provenance-section" class="orient-link">
          <span>View provenance</span> &rarr;
        </a>
      </div>
    </section>

    <!-- Collection Explorer -->
    <section class="explorer-panel" id="collection-explorer" aria-label="Artwork Explorer">
      <div class="explorer-header">
        <div class="explorer-title-wrap">
          <h2>Collection Explorer</h2>
          <div class="explorer-stats" id="explorer-results-count">Showing 144 of 144 artworks</div>
        </div>
        <div style="font-family:var(--public-font-mono); font-size:0.78rem; color:var(--q-muted);">
          STATUS: <strong style="color:var(--q-mint);">ALL 144 WORKS RESOLVED</strong>
        </div>
      </div>

      <div class="explorer-controls">
        <div class="search-input-wrap">
          <input type="search" class="search-input" id="search-input" placeholder="Search by title, guardian, chapter, or ID..." aria-label="Search artworks">
        </div>

        <select class="filter-select" id="crew-select" aria-label="Filter by Crew Member">
          <option value="all">All Guardians (8)</option>
          ${COUNCIL_MEMBERS_LIST.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join("\n")}
        </select>

        <select class="filter-select" id="chapter-select" aria-label="Filter by Chapter">
          <option value="all">All Worlds (18 Chapters)</option>
          ${CHAPTERS_LIST.map(ch => `<option value="${ch.num}">Ch.${String(ch.num).padStart(2, "0")}: ${ch.title}</option>`).join("\n")}
        </select>

        <button type="button" class="btn-toggle-fav" id="btn-favorites-toggle" aria-pressed="false">
          <span>&hearts; Favorites</span>
          <span id="fav-count-badge" style="background:rgba(255,255,255,0.2); padding:1px 6px; border-radius:10px; font-size:0.75rem;">0</span>
        </button>

        <button type="button" class="btn-reset-filters" id="btn-reset-filters">Clear</button>
      </div>

      <!-- Quick Crew Pills -->
      <div class="crew-pills-bar" id="crew-pills-bar">
        <button type="button" class="crew-pill active" data-crew="all">All Roster</button>
        ${COUNCIL_MEMBERS_LIST.map(m => `
          <button type="button" class="crew-pill" data-crew="${m.id}">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${m.color};"></span>
            <span>${m.name}</span>
          </button>
        `).join("\n")}
      </div>
    </section>

    <!-- Artwork Grid -->
    <section class="art-grid" id="art-grid" aria-label="Artworks Display">
      <!-- Populated dynamically via JS -->
    </section>

    <!-- Accessible Pagination -->
    <nav class="pagination-bar" id="pagination-bar" aria-label="Artwork pagination">
      <!-- Populated dynamically via JS -->
    </nav>

    <!-- Provenance & Integrity Section -->
    <section class="provenance-section" id="provenance-section" aria-labelledby="provenance-title">
      <div class="provenance-header">
        <div class="provenance-eyebrow">INTEGRITY &amp; PROVENANCE ARCHIVE</div>
        <h2 class="provenance-title" id="provenance-title">Creative Provenance &amp; Rights</h2>
        <p style="color:var(--q-muted); margin-top:8px; max-width:780px;">
          QuanterraOS: The 144 is an original art suite combining founder-directed worldbuilding with
          high-resolution neural synthesis. Every artwork is mapped through a deterministic registry.
        </p>
      </div>

      <div class="provenance-grid">
        <div class="prov-item">
          <div class="prov-label">Collection Hierarchy</div>
          <div class="prov-val">
            Exactly 8 Council Guardians &times; 18 Universe Chapters = 144 canonical works.
            Quanta is the separate lead mascot, virtual assistant, and fictional Global Galactic Leader.
          </div>
        </div>

        <div class="prov-item">
          <div class="prov-label">Generation Method &amp; Pipeline</div>
          <div class="prov-val">
            AI-assisted neural synthesis (Midjourney v6.1 &amp; QuanterraOS Flight Deck Pipeline).
            Visual attributes, color palettes, and lore engineered by Michael Quantara.
          </div>
        </div>

        <div class="prov-item">
          <div class="prov-label">Rights &amp; Non-Financial Policy</div>
          <div class="prov-val">
            Artwork is NFT-ready and unminted. No blockchain contract address, no floor value speculation,
            and no financial claims. Digital exploration and personal favorites only.
          </div>
        </div>
      </div>
    </section>

    <!-- Private Rollback Archive Link -->
    <div class="archive-banner">
      <div>
        <strong>Rollback Archive:</strong> Prior campaign concepts, early 6-officer sheets, and share receipts are preserved internally for audit integrity.
      </div>
      <a href="/art-gallery?archive=rollback" class="archive-link">Open Rollback Archive &rarr;</a>
    </div>
  </main>

  <!-- Artwork Detail Modal -->
  <div class="art-modal-overlay" id="art-detail-modal" role="dialog" aria-modal="true" aria-labelledby="modal-art-title">
    <div class="art-modal-content" id="modal-container">
      <button type="button" class="modal-close-btn" id="modal-close-btn" aria-label="Close dialog">&times;</button>
      <div class="modal-media-wrap">
        <img src="" alt="" class="modal-art-img" id="modal-img">
      </div>
      <div class="modal-info-wrap">
        <div>
          <div class="modal-header-meta">
            <span class="modal-id-badge" id="modal-id">Q144-001</span>
            <span class="modal-chapter-tag" id="modal-chapter">Chapter 01 · Orbit Origin</span>
          </div>
          <h2 class="modal-title" id="modal-art-title">Artwork Title</h2>
          <p class="modal-narrative" id="modal-desc">Artwork narrative lore.</p>

          <div class="modal-meta-table">
            <div class="modal-meta-row">
              <span class="modal-meta-label">Guardian Member</span>
              <span class="modal-meta-val" id="modal-member">Draco</span>
            </div>
            <div class="modal-meta-row">
              <span class="modal-meta-label">Functional Role</span>
              <span class="modal-meta-val" id="modal-role">Tactical Strike</span>
            </div>
            <div class="modal-meta-row">
              <span class="modal-meta-label">Status</span>
              <span class="modal-meta-val" style="color:var(--q-mint);" id="modal-status">Artwork · NFT-ready</span>
            </div>
            <div class="modal-meta-row">
              <span class="modal-meta-label">Generation</span>
              <span class="modal-meta-val" id="modal-gen" style="font-size:0.78rem;">AI-Assisted (MJ v6.1)</span>
            </div>
            <div class="modal-meta-row">
              <span class="modal-meta-label">SHA-256 Hash</span>
              <span class="modal-meta-val" id="modal-sha" style="font-family:var(--public-font-mono); font-size:0.72rem; word-break:break-all;"></span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="modal-btn modal-btn-fav" id="modal-fav-btn">
            <span>&hearts; Favorite</span>
          </button>
          <button type="button" class="modal-btn modal-btn-secondary" id="modal-share-btn">
            <span>Share Artwork</span>
          </button>
          <button type="button" class="modal-btn modal-btn-secondary" id="modal-copy-link-btn">
            <span>Copy Link</span>
          </button>
          <a href="" target="_blank" rel="noopener" class="modal-btn modal-btn-primary" id="modal-view-original-btn">
            <span>View Full Resolution &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Quanta Assistant Modal -->
  <div class="art-modal-overlay" id="quanta-modal" role="dialog" aria-modal="true" aria-labelledby="quanta-modal-title">
    <div class="quanta-modal">
      <button type="button" class="modal-close-btn" id="quanta-modal-close" aria-label="Close dialog">&times;</button>
      <div class="quanta-header">
        <div class="quanta-avatar-box">
          <img src="/assets/quanta-avatar.jpg" alt="Quanta Virtual Assistant">
        </div>
        <div class="quanta-title-wrap">
          <h3 id="quanta-modal-title">Quanta · Virtual Assistant</h3>
          <div class="quanta-role-badge">Global Galactic Leader &bull; Fictional Brand Mascot</div>
        </div>
      </div>
      <p style="color:#CBD5E1; font-size:0.96rem; line-height:1.6; margin-bottom:16px;">
        "Welcome to <strong>QuanterraOS: The 144</strong>. This collection illustrates our eight Council flight guardians across eighteen deep-space sectors.
        My green up-arrow and pink down-arrow eyes represent balanced perspective across market dimensions &mdash; never a financial direction or speculative signal."
      </p>
      <div style="background:rgba(5,7,14,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:18px; margin-bottom:20px; font-size:0.88rem; color:var(--q-muted);">
        <strong style="color:#FFF; display:block; margin-bottom:4px;">How to navigate the collection:</strong>
        &bull; Filter by any of the 8 canonical Council guardians or 18 cosmic chapters.<br>
        &bull; Click any artwork card to inspect high-resolution vectors, prompt specs, and SHA-256 provenance.<br>
        &bull; Save favorites locally to your browser without requiring a crypto wallet.<br>
        &bull; All 144 works are concept previews &mdash; no tokens are minted or sold.
      </div>
      <div style="text-align:right;">
        <button type="button" class="btn-primary-explore" onclick="document.getElementById('quanta-modal').classList.remove('open');">
          Continue Exploring &rarr;
        </button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div class="toast-msg" id="toast-msg">Link copied to clipboard!</div>

  ${renderPublicFooter()}

  <script>
    (function() {
      const CATALOG = ${catalogJsonSafe};
      const MEMBERS = ${membersJsonSafe};
      const CHAPTERS = ${chaptersJsonSafe};
      const INITIAL_ART = ${initialArtJsonSafe};

      const PAGE_SIZE = 24;
      let currentPage = 1;
      let activeCrew = 'all';
      let activeChapter = 'all';
      let activeQuery = '';
      let showOnlyFavorites = false;
      let favorites = [];

      // Load favorites from localStorage
      try {
        const stored = localStorage.getItem('quanterra_art144_favorites');
        if (stored) favorites = JSON.parse(stored);
      } catch (e) {
        favorites = [];
      }

      function updateFavCountBadge() {
        const badge = document.getElementById('fav-count-badge');
        if (badge) badge.textContent = favorites.length;
      }
      updateFavCountBadge();

      function isFavorited(id) {
        return favorites.includes(id);
      }

      function toggleFavorite(id) {
        const idx = favorites.indexOf(id);
        if (idx >= 0) {
          favorites.splice(idx, 1);
        } else {
          favorites.push(id);
        }
        try {
          localStorage.setItem('quanterra_art144_favorites', JSON.stringify(favorites));
        } catch (e) {}
        updateFavCountBadge();
        renderGallery();
        updateModalFavButton(id);
      }

      function showToast(msg) {
        const t = document.getElementById('toast-msg');
        if (t) {
          t.textContent = msg;
          t.classList.add('show');
          setTimeout(() => t.classList.remove('show'), 2400);
        }
      }

      // Filter Logic
      function getFilteredList() {
        return CATALOG.filter(art => {
          if (activeCrew !== 'all' && art.crewCanonicalId !== activeCrew) return false;
          if (activeChapter !== 'all' && String(art.chapterNumber) !== String(activeChapter)) return false;
          if (showOnlyFavorites && !favorites.includes(art.id)) return false;
          if (activeQuery) {
            const q = activeQuery.toLowerCase();
            const match = art.title.toLowerCase().includes(q) ||
                          art.memberName.toLowerCase().includes(q) ||
                          art.chapterTitle.toLowerCase().includes(q) ||
                          art.id.toLowerCase().includes(q) ||
                          art.description.toLowerCase().includes(q);
            if (!match) return false;
          }
          return true;
        });
      }

      function renderGallery() {
        const grid = document.getElementById('art-grid');
        const stats = document.getElementById('explorer-results-count');
        const filtered = getFilteredList();

        if (stats) {
          stats.textContent = 'Showing ' + filtered.length + ' of ' + CATALOG.length + ' artworks';
        }

        const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
        if (currentPage > totalPages) currentPage = 1;

        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

        if (pageItems.length === 0) {
          grid.innerHTML = \`
            <div class="empty-state">
              <div class="empty-icon">&#128301;</div>
              <h3 class="empty-title">No artworks match your filters</h3>
              <p class="empty-desc">Try clearing your search query, selecting "All Guardians" or disabling the favorites toggle.</p>
              <button type="button" class="btn-primary-explore" onclick="window.resetAllFilters()">Reset All Filters</button>
            </div>
          \`;
          renderPagination(0, 1);
          return;
        }

        grid.innerHTML = pageItems.map(art => {
          const favClass = isFavorited(art.id) ? 'favorited' : '';
          return \`
            <article class="art-card" tabindex="0" role="button" aria-label="\${art.title}" data-id="\${art.id}">
              <div class="art-img-wrap">
                <span class="art-card-id-tag">\${art.id.toUpperCase()}</span>
                <button type="button" class="art-card-fav-btn \${favClass}" data-fav="\${art.id}" aria-label="Favorite \${art.title}">&hearts;</button>
                <img src="\${art.thumbnailUrl}" alt="\${art.alt}" class="art-thumb-img" loading="lazy" width="340" height="340">
              </div>
              <div class="art-card-body">
                <div>
                  <div class="art-card-chapter">CH.\${String(art.chapterNumber).padStart(2, '0')} &bull; \${art.chapterTitle.toUpperCase()}</div>
                  <h3 class="art-card-title">\${art.title}</h3>
                </div>
                <div class="art-card-footer">
                  <span class="art-card-member">\${art.memberName}</span>
                  <span class="art-status-pill">NFT-READY</span>
                </div>
              </div>
            </article>
          \`;
        }).join('');

        // Attach card click handlers
        grid.querySelectorAll('.art-card').forEach(card => {
          card.addEventListener('click', (e) => {
            if (e.target.closest('.art-card-fav-btn')) return;
            const id = card.getAttribute('data-id');
            openArtworkModal(id);
          });
          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const id = card.getAttribute('data-id');
              openArtworkModal(id);
            }
          });
        });

        // Attach fav button handlers
        grid.querySelectorAll('.art-card-fav-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-fav');
            toggleFavorite(id);
          });
        });

        renderPagination(filtered.length, totalPages);
      }

      function renderPagination(totalItems, totalPages) {
        const bar = document.getElementById('pagination-bar');
        if (!bar) return;
        if (totalPages <= 1) {
          bar.innerHTML = '';
          return;
        }

        let html = '';
        html += \`<button type="button" class="page-btn" \${currentPage === 1 ? 'disabled' : ''} id="page-prev" aria-label="Previous page">&larr; Prev</button>\`;

        for (let i = 1; i <= totalPages; i++) {
          html += \`<button type="button" class="page-btn \${i === currentPage ? 'active' : ''}" data-page="\${i}" aria-label="Page \${i}">\${i}</button>\`;
        }

        html += \`<button type="button" class="page-btn" \${currentPage === totalPages ? 'disabled' : ''} id="page-next" aria-label="Next page">Next &rarr;</button>\`;
        bar.innerHTML = html;

        bar.querySelectorAll('.page-btn[data-page]').forEach(btn => {
          btn.addEventListener('click', () => {
            currentPage = parseInt(btn.getAttribute('data-page'), 10);
            renderGallery();
            document.getElementById('collection-explorer')?.scrollIntoView({ behavior: 'smooth' });
          });
        });

        document.getElementById('page-prev')?.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            renderGallery();
            document.getElementById('collection-explorer')?.scrollIntoView({ behavior: 'smooth' });
          }
        });

        document.getElementById('page-next')?.addEventListener('click', () => {
          if (currentPage < totalPages) {
            currentPage++;
            renderGallery();
            document.getElementById('collection-explorer')?.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      // Modal Logic
      let currentModalArt = null;
      let lastFocusedElement = null;

      function updateModalFavButton(id) {
        const favBtn = document.getElementById('modal-fav-btn');
        if (!favBtn) return;
        if (isFavorited(id)) {
          favBtn.classList.add('active');
          favBtn.innerHTML = '<span>&hearts; Favorited</span>';
        } else {
          favBtn.classList.remove('active');
          favBtn.innerHTML = '<span>&hearts; Favorite</span>';
        }
      }

      function openArtworkModal(idOrSlug) {
        const art = CATALOG.find(a => a.id.toLowerCase() === idOrSlug.toLowerCase() || a.slug.toLowerCase() === idOrSlug.toLowerCase());
        if (!art) return;

        currentModalArt = art;
        lastFocusedElement = document.activeElement;

        document.getElementById('modal-img').src = art.originalAssetUrl;
        document.getElementById('modal-img').alt = art.alt;
        document.getElementById('modal-id').textContent = art.id.toUpperCase();
        document.getElementById('modal-chapter').textContent = 'Chapter ' + String(art.chapterNumber).padStart(2, '0') + ' · ' + art.chapterTitle;
        document.getElementById('modal-art-title').textContent = art.title;
        document.getElementById('modal-desc').textContent = art.description;
        document.getElementById('modal-member').textContent = art.memberName;
        document.getElementById('modal-role').textContent = art.memberRole;
        document.getElementById('modal-status').textContent = art.mintStatus;
        document.getElementById('modal-sha').textContent = art.sha256;
        document.getElementById('modal-view-original-btn').href = art.originalAssetUrl;

        updateModalFavButton(art.id);

        const modal = document.getElementById('art-detail-modal');
        modal.classList.add('open');
        document.getElementById('modal-close-btn').focus();

        // Update URL query state
        const url = new URL(window.location);
        url.searchParams.set('art', art.id);
        window.history.replaceState({}, '', url);
      }

      function closeArtworkModal() {
        const modal = document.getElementById('art-detail-modal');
        modal.classList.remove('open');
        currentModalArt = null;

        const url = new URL(window.location);
        url.searchParams.delete('art');
        window.history.replaceState({}, '', url);

        if (lastFocusedElement) {
          lastFocusedElement.focus();
        }
      }

      // Event Listeners for Filters
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          activeQuery = e.target.value.trim();
          currentPage = 1;
          renderGallery();
        });
      }

      const crewSelect = document.getElementById('crew-select');
      if (crewSelect) {
        crewSelect.addEventListener('change', (e) => {
          activeCrew = e.target.value;
          updateCrewPillsActive(activeCrew);
          currentPage = 1;
          renderGallery();
        });
      }

      const chapterSelect = document.getElementById('chapter-select');
      if (chapterSelect) {
        chapterSelect.addEventListener('change', (e) => {
          activeChapter = e.target.value;
          currentPage = 1;
          renderGallery();
        });
      }

      const favToggle = document.getElementById('btn-favorites-toggle');
      if (favToggle) {
        favToggle.addEventListener('click', () => {
          showOnlyFavorites = !showOnlyFavorites;
          favToggle.classList.toggle('active', showOnlyFavorites);
          favToggle.setAttribute('aria-pressed', showOnlyFavorites ? 'true' : 'false');
          currentPage = 1;
          renderGallery();
        });
      }

      function updateCrewPillsActive(crewId) {
        document.querySelectorAll('#crew-pills-bar .crew-pill').forEach(pill => {
          pill.classList.toggle('active', pill.getAttribute('data-crew') === crewId);
        });
      }

      document.querySelectorAll('#crew-pills-bar .crew-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const crew = pill.getAttribute('data-crew');
          activeCrew = crew;
          if (crewSelect) crewSelect.value = crew;
          updateCrewPillsActive(crew);
          currentPage = 1;
          renderGallery();
        });
      });

      window.resetAllFilters = function() {
        activeCrew = 'all';
        activeChapter = 'all';
        activeQuery = '';
        showOnlyFavorites = false;
        currentPage = 1;

        if (searchInput) searchInput.value = '';
        if (crewSelect) crewSelect.value = 'all';
        if (chapterSelect) chapterSelect.value = 'all';
        if (favToggle) {
          favToggle.classList.remove('active');
          favToggle.setAttribute('aria-pressed', 'false');
        }
        updateCrewPillsActive('all');
        renderGallery();
      };

      document.getElementById('btn-reset-filters')?.addEventListener('click', window.resetAllFilters);

      window.filterByCrew = function(crewId) {
        activeCrew = crewId;
        if (crewSelect) crewSelect.value = crewId;
        updateCrewPillsActive(crewId);
        currentPage = 1;
        renderGallery();
        document.getElementById('collection-explorer')?.scrollIntoView({ behavior: 'smooth' });
      };

      window.filterByChapter = function(chNum) {
        activeChapter = String(chNum);
        if (chapterSelect) chapterSelect.value = String(chNum);
        currentPage = 1;
        renderGallery();
        document.getElementById('collection-explorer')?.scrollIntoView({ behavior: 'smooth' });
      };

      // Modal Events
      document.getElementById('modal-close-btn')?.addEventListener('click', closeArtworkModal);
      document.getElementById('art-detail-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'art-detail-modal') closeArtworkModal();
      });

      document.getElementById('modal-fav-btn')?.addEventListener('click', () => {
        if (currentModalArt) {
          toggleFavorite(currentModalArt.id);
        }
      });

      document.getElementById('modal-copy-link-btn')?.addEventListener('click', () => {
        if (!currentModalArt) return;
        const permalink = window.location.origin + '/art-gallery?art=' + currentModalArt.id;
        navigator.clipboard.writeText(permalink).then(() => {
          showToast('Permalink copied to clipboard!');
        }).catch(() => {
          showToast('Direct link: ' + permalink);
        });
      });

      document.getElementById('modal-share-btn')?.addEventListener('click', () => {
        if (!currentModalArt) return;
        const shareData = {
          title: currentModalArt.title + ' — QuanterraOS: The 144',
          text: currentModalArt.description,
          url: window.location.origin + '/art-gallery?art=' + currentModalArt.id
        };
        if (navigator.share) {
          navigator.share(shareData).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareData.url).then(() => {
            showToast('Share link copied to clipboard!');
          });
        }
      });

      // Meet Quanta Modal
      document.getElementById('btn-meet-quanta')?.addEventListener('click', () => {
        document.getElementById('quanta-modal')?.classList.add('open');
      });
      document.getElementById('quanta-modal-close')?.addEventListener('click', () => {
        document.getElementById('quanta-modal')?.classList.remove('open');
      });
      document.getElementById('quanta-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'quanta-modal') {
          document.getElementById('quanta-modal').classList.remove('open');
        }
      });

      // Keyboard Esc handler
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (document.getElementById('art-detail-modal')?.classList.contains('open')) {
            closeArtworkModal();
          }
          if (document.getElementById('quanta-modal')?.classList.contains('open')) {
            document.getElementById('quanta-modal').classList.remove('open');
          }
        }
      });

      // Initialize
      renderGallery();

      // Open initial art if specified in URL
      const urlParams = new URLSearchParams(window.location.search);
      const urlArtId = urlParams.get('art');
      if (urlArtId) {
        openArtworkModal(urlArtId);
      } else if (INITIAL_ART) {
        openArtworkModal(INITIAL_ART.id);
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Internal private rollback archive view for legacy campaign assets.
 */
function renderRollbackArchiveHtml(user?: { email?: string; tier?: string } | null): string {
  const rollbackItems = [
    { title: "Flight Deck Pilot Quanta", style: "Canonical Genesis Artwork", img: "/assets/hero-flight-deck.png" },
    { title: "Spacecraft Council Roster", style: "Legacy Concept Sheet (6 Officers)", img: "/assets/council-concepts.png" },
    { title: "Quanta: Liquid Chrome", style: "Specular Nebula Reflection", img: "/assets/quanta-liquid-chrome.png" },
    { title: "Quanta: Graffiti Pop", style: "Street Art Neon Stencil", img: "/assets/quanta-graffiti-pop.png" },
    { title: "Quanta: Cosmic Crystal", style: "Prismatic Faceted Quartz", img: "/assets/quanta-cosmic-crystal.png" },
    { title: "Quanta: Neon Mecha", style: "Titanium Exoskeleton", img: "/assets/quanta-neon-mecha.png" },
    { title: "Quanta: 2D Cel Anime", style: "Retro Sci-Fi Animation", img: "/assets/quanta-2d-anime.png" },
    { title: "Flight Receipt Campaign", style: "1080x1350 Share Format (Moved to Share Studio)", img: "/assets/campaign-receipt.png" }
  ];

  const cardsHtml = rollbackItems.map(item => `
    <div style="background:rgba(18,23,43,0.8); border:1px solid rgba(175,182,206,0.15); border-radius:14px; overflow:hidden; display:flex; flex-direction:column;">
      <img src="${item.img}" alt="${item.title}" style="width:100%; height:280px; object-fit:cover; background:#05070D;">
      <div style="padding:18px; display:flex; flex-direction:column; flex:1; justify-content:space-between;">
        <h3 style="font-size:1.15rem; font-weight:700; color:#FFF; margin:0 0 4px;">${item.title}</h3>
        <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:#A259FF; margin-bottom:12px;">${item.style}</div>
        <a href="${item.img}" target="_blank" style="color:#CBFF69; font-family:var(--public-font-mono); font-size:0.78rem; text-decoration:none; font-weight:600;">View Rollback File &rarr;</a>
      </div>
    </div>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Internal Rollback Archive &bull; QuanterraOS</title>
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #080B18; color: #F4F5FF; font-family: var(--public-font-sans); margin: 0; }
    .page-wrap { max-width: 1200px; margin: 0 auto; padding: 48px 24px 80px; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/art-gallery", user })}
  <div class="page-wrap">
    <div style="text-align:center; margin-bottom:40px;">
      <div style="font-family:var(--public-font-mono); font-size:0.78rem; color:#FFB800; letter-spacing:0.1em; margin-bottom:8px;">INTERNAL AUDIT ARCHIVE // PRIVATE ROLLBACK</div>
      <h1 style="font-size:2.4rem; font-weight:800; color:#FFF; margin:0 0 12px;">Legacy Artwork Archive</h1>
      <p style="color:#94A3B8; max-width:680px; margin:0 auto 20px;">
        Preserved for audit trail and token continuity. These assets are retained for rollback verification and historical records.
      </p>
      <a href="/art-gallery" style="display:inline-block; background:#CBFF69; color:#090A14; font-weight:700; padding:10px 20px; border-radius:8px; text-decoration:none;">
        &larr; Return to QuanterraOS: The 144
      </a>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
      ${cardsHtml}
    </div>
  </div>
  ${renderPublicFooter()}
</body>
</html>`;
}
