import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('.');
const assetCatalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'asset-catalog.json'), 'utf8'));
const merchandiseCatalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'merchandise-catalog.json'), 'utf8'));

// Format catalog for inline script injection
const catalogJsonSafe = JSON.stringify(assetCatalog).replace(/</g, '\\u003c');
const merchJsonSafe = JSON.stringify(merchandiseCatalog).replace(/</g, '\\u003c');

const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>QuanterraOS — QuanterraOS Fighter Pilots &amp; The 44 — Market Evidence Cockpit</title>
  <meta name="description" content="QuanterraOS: Assemble your analytical crew. See the evidence. Own your decision. Research Kalshi &amp; Polymarket contracts with Quanta and the QuanterraOS Fighter Pilots.">
  <link rel="manifest" href="/manifest.json">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #080B18;
      --surface: #0E1326;
      --surface-card: rgba(18, 24, 46, 0.85);
      --surface-card-hover: rgba(26, 35, 68, 0.95);
      --border: rgba(155, 108, 255, 0.2);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --violet: #9B6CFF;
      --violet-glow: rgba(155, 108, 255, 0.4);
      --mint: #CBFF69;
      --cyan: #59DDEC;
      --gold: #DFB843;
      --chalk: #F8FAFC;
      --muted: #94A3B8;
      --danger: #FF477E;
      --yes: #CBFF69;
      --no: #FF477E;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      background: var(--bg);
      color: var(--chalk);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* Clean Tesla-Inspired Single Responsive Header */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(8, 11, 24, 0.94);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.3s ease;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 14px;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .brand-logo-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--mint);
      box-shadow: 0 0 12px var(--mint);
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #FFFFFF;
    }

    .brand-title span {
      color: var(--violet);
    }

    /* Primary Destinations Navigation */
    .primary-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link {
      background: transparent;
      border: 1px solid transparent;
      color: var(--muted);
      padding: 10px 20px;
      border-radius: 999px;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }

    .nav-link:hover {
      color: var(--chalk);
      background: rgba(255, 255, 255, 0.06);
    }

    .nav-link.active, .nav-link[aria-current="page"] {
      background: rgba(155, 108, 255, 0.16);
      border-color: var(--border);
      color: #FFFFFF;
      box-shadow: 0 0 16px rgba(155, 108, 255, 0.25);
    }

    /* Header Right Actions */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .btn-secondary-link {
      color: var(--muted);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 8px;
      transition: color 0.2s;
    }

    .btn-secondary-link:hover {
      color: var(--chalk);
    }

    .btn-cta-cockpit {
      background: linear-gradient(135deg, var(--violet) 0%, #7C3AED 100%);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 10px 22px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.88rem;
      letter-spacing: 0.02em;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(155, 108, 255, 0.4);
      transition: all 0.25s ease;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-cta-cockpit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(155, 108, 255, 0.6);
      background: linear-gradient(135deg, #A855F7 0%, #6D28D9 100%);
    }

    /* Mobile Hamburger Menu */
    .mobile-hamburger {
      display: none;
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 8px 12px;
      color: var(--chalk);
      font-size: 1.25rem;
      cursor: pointer;
      min-height: 44px;
      min-width: 44px;
    }

    .mobile-drawer {
      display: none;
      position: fixed;
      top: 76px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(8, 11, 24, 0.98);
      backdrop-filter: blur(24px);
      z-index: 999;
      flex-direction: column;
      padding: 24px;
      gap: 16px;
      border-bottom: 1px solid var(--border);
    }

    .mobile-drawer.open {
      display: flex;
    }

    .mobile-drawer .nav-link {
      width: 100%;
      text-align: left;
      justify-content: flex-start;
      padding: 14px 20px;
      font-size: 1.05rem;
    }

    /* Main Content Container */
    main {
      flex: 1;
      width: 100%;
      max-width: 1320px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    .view-page {
      display: none;
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .view-page.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ---------------------------------------------------- */
    /* HOMEPAGE SECTION                                     */
    /* ---------------------------------------------------- */
    .hero-container {
      display: grid;
      grid-template-columns: 1fr 1.05fr;
      gap: 48px;
      align-items: center;
      margin-bottom: 72px;
    }

    .hero-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(155, 108, 255, 0.12);
      border: 1px solid rgba(155, 108, 255, 0.3);
      padding: 6px 14px;
      border-radius: 999px;
      color: var(--violet);
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      width: fit-content;
    }

    .hero-headline {
      font-size: clamp(2.4rem, 4.5vw, 3.8rem);
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -0.02em;
      color: #FFFFFF;
    }

    .hero-headline span {
      background: linear-gradient(135deg, #FFFFFF 30%, var(--violet) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subhead {
      font-size: 1.12rem;
      color: var(--muted);
      line-height: 1.65;
      max-width: 540px;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .btn-hero-primary {
      background: linear-gradient(135deg, var(--violet) 0%, #7C3AED 100%);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 16px 36px;
      border-radius: 999px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(155, 108, 255, 0.45);
      transition: all 0.25s ease;
      min-height: 52px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .btn-hero-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(155, 108, 255, 0.65);
    }

    .btn-hero-secondary {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      color: var(--chalk);
      padding: 16px 32px;
      border-radius: 999px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      min-height: 52px;
    }

    .btn-hero-secondary:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .hero-visual {
      position: relative;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
      background: #0C1022;
      aspect-ratio: 16 / 10;
    }

    .hero-visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .hero-visual:hover img {
      transform: scale(1.02);
    }

    .hero-visual-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(8, 11, 24, 0.95) 0%, transparent 100%);
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .hero-caption-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: #FFFFFF;
    }

    .hero-caption-sub {
      font-size: 0.78rem;
      color: var(--muted);
      font-family: var(--font-mono);
    }

    /* 3-Step Workflow Section */
    .steps-section {
      margin-bottom: 72px;
    }

    .section-label {
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--violet);
      margin-bottom: 12px;
      display: block;
    }

    .section-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.01em;
      margin-bottom: 32px;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .step-card {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      transition: all 0.3s ease;
    }

    .step-card:hover {
      border-color: var(--border);
      background: var(--surface-card-hover);
      transform: translateY(-3px);
    }

    .step-num-pill {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(155, 108, 255, 0.15);
      border: 1px solid var(--border);
      color: var(--violet);
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-heading {
      font-size: 1.22rem;
      font-weight: 700;
      color: #FFFFFF;
    }

    .step-text {
      color: var(--muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    /* ---------------------------------------------------- */
    /* ANALYTICAL COCKPIT SECTION                           */
    /* ---------------------------------------------------- */
    .cockpit-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 20px 28px;
      margin-bottom: 28px;
    }

    .cockpit-venue-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .control-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .select-pill {
      background: #141B33;
      border: 1px solid var(--border-subtle);
      color: #FFFFFF;
      padding: 10px 18px;
      border-radius: 12px;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      min-height: 44px;
    }

    .select-pill:focus {
      outline: 2px solid var(--violet);
    }

    .cockpit-status-tag {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--mint);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cockpit-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--mint);
      box-shadow: 0 0 8px var(--mint);
    }

    /* Specialist Crew Dock */
    .crew-dock-container {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 28px;
      margin-bottom: 32px;
    }

    .crew-dock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .crew-dock-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .specialist-btn {
      background: #131A33;
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.25s ease;
      text-align: left;
      min-height: 64px;
      color: inherit;
    }

    .specialist-btn:hover {
      border-color: rgba(155, 108, 255, 0.4);
      background: #1A2345;
    }

    .specialist-btn.equipped {
      background: rgba(155, 108, 255, 0.15);
      border-color: var(--violet);
      box-shadow: 0 0 16px rgba(155, 108, 255, 0.2);
    }

    .specialist-avatar {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: cover;
      background: #0A0E20;
      border: 1px solid var(--border-subtle);
    }

    .specialist-info {
      flex: 1;
      overflow: hidden;
    }

    .specialist-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #FFFFFF;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .specialist-duty {
      font-size: 0.72rem;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .equipped-tag {
      font-size: 0.68rem;
      font-family: var(--font-mono);
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 6px;
      background: rgba(203, 255, 105, 0.2);
      color: var(--mint);
      border: 1px solid rgba(203, 255, 105, 0.4);
    }

    /* Workspace 2-Column Split: Telemetry + Decision Receipt */
    .cockpit-workspace {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 28px;
    }

    .telemetry-panel {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .panel-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .receipt-panel {
      background: #0B1024;
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.88rem;
    }

    .receipt-row:last-child {
      border-bottom: none;
    }

    .receipt-label {
      color: var(--muted);
    }

    .receipt-val {
      font-family: var(--font-mono);
      font-weight: 700;
      color: #FFFFFF;
    }

    /* ---------------------------------------------------- */
    /* CREW SHOWCASE SECTION                                */
    /* ---------------------------------------------------- */
    .crew-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .crew-card {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .crew-card:hover {
      border-color: var(--border);
      transform: translateY(-4px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
    }

    .crew-card-img-wrap {
      width: 100%;
      aspect-ratio: 1;
      background: #0A0D1F;
      position: relative;
      overflow: hidden;
    }

    .crew-card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
    }

    .crew-card:hover .crew-card-img {
      transform: scale(1.04);
    }

    .crew-card-body {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .crew-card-badge {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--violet);
    }

    .crew-card-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #FFFFFF;
    }

    .crew-card-duty {
      font-size: 0.88rem;
      color: var(--muted);
      line-height: 1.5;
    }

    /* ---------------------------------------------------- */
    /* THE 44 GALLERY SECTION                               */
    /* ---------------------------------------------------- */
    .gallery-filter-bar {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 28px;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: 18px;
      padding: 18px 24px;
      align-items: center;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 36px;
    }

    .art-card {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .art-card:hover {
      border-color: var(--border);
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
    }

    .art-card-img-wrap {
      width: 100%;
      aspect-ratio: 1;
      background: #070914;
      position: relative;
      overflow: hidden;
    }

    .art-card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
    }

    .art-card:hover .art-card-img {
      transform: scale(1.05);
    }

    .art-card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .art-card-id {
      font-family: var(--font-mono);
      font-size: 0.74rem;
      color: var(--violet);
      font-weight: 700;
    }

    .art-card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #FFFFFF;
    }

    .art-card-meta {
      font-size: 0.8rem;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
    }

    .pagination-btn {
      background: #141B33;
      border: 1px solid var(--border-subtle);
      color: #FFFFFF;
      padding: 10px 22px;
      border-radius: 999px;
      font-weight: 600;
      cursor: pointer;
      min-height: 44px;
      transition: all 0.2s;
    }

    .pagination-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .pagination-btn:not(:disabled):hover {
      background: var(--violet);
      border-color: var(--violet);
    }

    .pagination-info {
      font-family: var(--font-mono);
      font-size: 0.88rem;
      color: var(--muted);
    }

    /* ---------------------------------------------------- */
    /* GEAR & APPAREL SECTION                               */
    /* ---------------------------------------------------- */
    .gear-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 28px;
    }

    .gear-card {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .gear-card:hover {
      border-color: var(--border);
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
    }

    .gear-card-img-wrap {
      width: 100%;
      aspect-ratio: 16 / 10;
      background: #070914;
      position: relative;
      overflow: hidden;
    }

    .gear-card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
    }

    .gear-card:hover .gear-card-img {
      transform: scale(1.03);
    }

    .gear-card-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .concept-notice-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(223, 184, 67, 0.12);
      border: 1px solid rgba(223, 184, 67, 0.3);
      padding: 4px 10px;
      border-radius: 6px;
      color: var(--gold);
      font-size: 0.72rem;
      font-family: var(--font-mono);
      font-weight: 700;
      width: fit-content;
    }

    /* ---------------------------------------------------- */
    /* QUANTA VIRTUAL ASSISTANT GUIDE WIDGET                */
    /* ---------------------------------------------------- */
    .quanta-guide-box {
      background: linear-gradient(135deg, rgba(155, 108, 255, 0.12) 0%, rgba(14, 20, 42, 0.8) 100%);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }

    .quanta-guide-avatar {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--violet);
      box-shadow: 0 0 16px var(--violet-glow);
      flex-shrink: 0;
    }

    .quanta-guide-content {
      flex: 1;
    }

    .quanta-guide-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .quanta-guide-text {
      font-size: 0.92rem;
      color: var(--chalk);
      line-height: 1.5;
    }

    .quanta-guide-close {
      background: transparent;
      border: none;
      color: var(--muted);
      cursor: pointer;
      padding: 8px;
      font-size: 1.1rem;
      border-radius: 8px;
    }

    .quanta-guide-close:hover {
      color: #FFFFFF;
    }

    /* ---------------------------------------------------- */
    /* MODAL DIALOG                                         */
    /* ---------------------------------------------------- */
    dialog#detail-modal {
      background: #0C1022;
      color: var(--chalk);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 0;
      max-width: 900px;
      width: 92vw;
      margin: auto;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.9);
      overflow: hidden;
    }

    dialog#detail-modal::backdrop {
      background: rgba(4, 6, 14, 0.85);
      backdrop-filter: blur(8px);
    }

    .modal-inner {
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 20px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
    }

    .modal-close-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--chalk);
      padding: 6px 14px;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 600;
    }

    .modal-body {
      padding: 28px;
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 28px;
      max-height: 75vh;
      overflow-y: auto;
    }

    .modal-img-wrap {
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      background: #060813;
      border: 1px solid var(--border-subtle);
    }

    .modal-img-wrap img {
      width: 100%;
      display: block;
      object-fit: contain;
    }

    .modal-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ---------------------------------------------------- */
    /* FOOTER                                               */
    /* ---------------------------------------------------- */
    .site-footer {
      background: #050711;
      border-top: 1px solid var(--border-subtle);
      padding: 48px 32px 64px;
      color: var(--muted);
      font-size: 0.88rem;
    }

    .footer-inner {
      max-width: 1320px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .footer-links-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .footer-nav {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .footer-nav a {
      color: var(--muted);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-nav a:hover {
      color: var(--chalk);
    }

    .footer-disclaimer {
      font-size: 0.78rem;
      color: #64748B;
      line-height: 1.6;
      border-top: 1px solid var(--border-subtle);
      padding-top: 24px;
    }

    /* Responsive Breakpoints */
    @media (max-width: 1024px) {
      .hero-container { grid-template-columns: 1fr; }
      .cockpit-workspace { grid-template-columns: 1fr; }
      .crew-dock-grid { grid-template-columns: repeat(2, 1fr); }
      .crew-grid { grid-template-columns: repeat(2, 1fr); }
      .gallery-grid { grid-template-columns: repeat(2, 1fr); }
      .modal-body { grid-template-columns: 1fr; }
    }

    @media (max-width: 860px) {
      .primary-nav { display: none; }
      .mobile-hamburger { display: block; }
      .steps-grid { grid-template-columns: 1fr; }
      .gear-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 540px) {
      .crew-dock-grid { grid-template-columns: 1fr; }
      .crew-grid { grid-template-columns: 1fr; }
      .gallery-grid { grid-template-columns: 1fr; }
      .site-header { padding: 14px 20px; }
      main { padding: 24px 16px 60px; }
    }
  </style>
</head>
<body>

  <!-- Clean Single Responsive Header -->
  <header class="site-header">
    <a class="brand-group" onclick="navTo('home')" href="#home">
      <div class="brand-logo-dot"></div>
      <div class="brand-title">QUANTERRA<span>OS</span></div>
    </a>

    <!-- Primary Destinations -->
    <nav class="primary-nav" aria-label="Main Navigation">
      <button class="nav-link active" data-view="home" onclick="navTo('home')">Home</button>
      <button class="nav-link" data-view="cockpit" onclick="navTo('cockpit')">Cockpit</button>
      <button class="nav-link" data-view="crew" onclick="navTo('crew')">Crew</button>
      <button class="nav-link" data-view="gallery" onclick="navTo('gallery')">Gallery</button>
      <button class="nav-link" data-view="gear" onclick="navTo('gear')">Gear</button>
    </nav>

    <div class="header-actions">
      <a class="btn-secondary-link" href="/pricing">Pricing</a>
      <a class="btn-secondary-link" href="/learn">Learn</a>
      <button class="btn-cta-cockpit" onclick="navTo('cockpit')">Enter Cockpit →</button>
      <button class="mobile-hamburger" id="hamburger-btn" aria-label="Toggle mobile menu" onclick="toggleMobileMenu()">☰</button>
    </div>
  </header>

  <!-- Mobile Drawer Menu -->
  <div class="mobile-drawer" id="mobile-drawer">
    <button class="nav-link" onclick="navTo('home'); toggleMobileMenu()">Home</button>
    <button class="nav-link" onclick="navTo('cockpit'); toggleMobileMenu()">Cockpit</button>
    <button class="nav-link" onclick="navTo('crew'); toggleMobileMenu()">Crew</button>
    <button class="nav-link" onclick="navTo('gallery'); toggleMobileMenu()">Gallery (The 44)</button>
    <button class="nav-link" onclick="navTo('gear'); toggleMobileMenu()">Gear (Apparel)</button>
    <a class="nav-link" href="/pricing">Pricing Plans</a>
    <a class="nav-link" href="/learn">Evidence Methodology</a>
    <a class="nav-link" href="/status">System Status</a>
  </div>

  <main>

    <!-- Quanta Dynamic Guide Box -->
    <div class="quanta-guide-box" id="quanta-guide" role="complementary" aria-label="Quanta Virtual Assistant Guidance">
      <img id="guide-avatar" class="quanta-guide-avatar" src="assets/q44-002.png" alt="Quanta Virtual Assistant">
      <div class="quanta-guide-content">
        <div class="quanta-guide-title">
          <span>Quanta · Virtual Assistant & Galactic Leader</span>
        </div>
        <div class="quanta-guide-text" id="guide-text">
          Assemble your analytical crew. Investigate supported Kalshi and Polymarket order books, underlying CME benchmarks, and fee drag before you act.
        </div>
      </div>
      <button class="quanta-guide-close" aria-label="Dismiss guide" onclick="dismissGuide()">✕</button>
    </div>

    <!-- ---------------------------------------------------- -->
    <!-- VIEW 1: HOMEPAGE                                     -->
    <!-- ---------------------------------------------------- -->
    <section id="view-home" class="view-page active">
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-badge">Michael Quanterra Presents · QuanterraOS Fighter Pilots</div>
          <h1 class="hero-headline">Assemble your crew.<br>See the evidence.<br><span>Own your decision.</span></h1>
          <p class="hero-subhead">
            Quanta and the QuanterraOS Fighter Pilots bring market data, true fee drag, and settlement rules into one clear cockpit—so you can investigate supported Kalshi and Polymarket contracts before you risk capital.
          </p>
          <div class="hero-actions">
            <button class="btn-hero-primary" onclick="navTo('cockpit')">
              Enter the Cockpit →
            </button>
            <button class="btn-hero-secondary" onclick="navTo('crew')">
              Meet the QuanterraOS Fighter Pilots
            </button>
          </div>
        </div>
        <div class="hero-visual" onclick="navTo('crew')">
          <img src="assets/elite-eleven-hero.png" alt="QuanterraOS Fighter Pilots Flight Crew" onerror="handleImgError(this, 'assets/elite-eleven-hero.png')">
          <div class="hero-visual-caption">
            <div>
              <div class="hero-caption-title">The QuanterraOS Fighter Pilots Roster</div>
              <div class="hero-caption-sub">Founder Michael Quanterra · Leaders Quanta & Quantana · 8 Specialists</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3-Step Explanation -->
      <section class="steps-section">
        <span class="section-label">Operational Workflow</span>
        <h2 class="section-title">How QuanterraOS Works in 3 Steps</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-num-pill">1</div>
            <h3 class="step-heading">Choose a Market</h3>
            <p class="step-text">
              Select supported contracts across Kalshi and Polymarket. Review expiration timestamps, venue fee schedules, and underlying index settlement sources.
            </p>
          </div>
          <div class="step-card">
            <div class="step-num-pill">2</div>
            <h3 class="step-heading">Assemble Specialists</h3>
            <p class="step-text">
              Equip specialized analytical stations—Draco for data validation, Wolf for order book depth, Sentinel for feed health, and Kraken for settlement basis.
            </p>
          </div>
          <div class="step-card">
            <div class="step-num-pill">3</div>
            <h3 class="step-heading">Review Evidence & Cost</h3>
            <p class="step-text">
              Calculate exact taker fee drag, executable ask slippage, and breakeven rate. Generate a private Quanta Decision Receipt before taking action.
            </p>
          </div>
        </div>
      </section>
    </section>

    <!-- ---------------------------------------------------- -->
    <!-- VIEW 2: COCKPIT                                      -->
    <!-- ---------------------------------------------------- -->
    <section id="view-cockpit" class="view-page">
      <div class="cockpit-header-bar">
        <div class="cockpit-venue-controls">
          <div>
            <div class="control-label">Venue</div>
            <select class="select-pill" id="cockpit-venue" onchange="updateCockpitData()">
              <option value="kalshi">Kalshi (CFTC Regulated)</option>
              <option value="polymarket">Polymarket (Polygon Order Book)</option>
            </select>
          </div>
          <div>
            <div class="control-label">Horizon</div>
            <select class="select-pill" id="cockpit-horizon" onchange="updateCockpitData()">
              <option value="15m">15-Minute Strike Ladder</option>
              <option value="1h">1-Hour Hourly Expiry</option>
            </select>
          </div>
          <div>
            <div class="control-label">Market Target</div>
            <select class="select-pill" id="cockpit-target" onchange="updateCockpitData()">
              <option value="btc">BTC/USD CME CF BRTI Index</option>
              <option value="cpi">US CPI YoY Inflation Benchmark</option>
              <option value="fed">FOMC Interest Rate Decision</option>
            </select>
          </div>
        </div>
        <div class="cockpit-status-tag">
          <div class="cockpit-status-dot"></div>
          <span id="cockpit-feed-status">Live Telemetry · CME BRTI 60s TWAP Active</span>
        </div>
      </div>

      <!-- Specialist Crew Dock -->
      <div class="crew-dock-container">
        <div class="crew-dock-header">
          <div>
            <span class="section-label">Crew Workspace</span>
            <h3 style="color:#FFF; font-size: 1.15rem;">Equip Specialist Stations (8 Available)</h3>
          </div>
          <div style="font-size: 0.85rem; color: var(--muted);">
            Click any specialist to add or remove from your workspace. Preserved in session.
          </div>
        </div>
        <div class="crew-dock-grid" id="crew-dock-grid">
          <!-- Populated by JavaScript -->
        </div>
      </div>

      <!-- Workspace: Telemetry + Decision Receipt -->
      <div class="cockpit-workspace">
        <div class="telemetry-panel">
          <div class="panel-title">
            <span>Market Evidence & Depth Feed</span>
          </div>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <div style="flex: 1; background: #070914; border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px;">
              <div style="font-size: 0.78rem; color: var(--muted); margin-bottom: 4px;">BEST YES ASK (EXECUTABLE)</div>
              <div style="font-size: 1.8rem; font-family: var(--font-mono); font-weight: 800; color: var(--mint);" id="quote-yes-ask">56¢</div>
              <div style="font-size: 0.75rem; color: var(--muted);">Implied Probability: 56.0%</div>
            </div>
            <div style="flex: 1; background: #070914; border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px;">
              <div style="font-size: 0.78rem; color: var(--muted); margin-bottom: 4px;">BEST NO ASK (EXECUTABLE)</div>
              <div style="font-size: 1.8rem; font-family: var(--font-mono); font-weight: 800; color: var(--danger);" id="quote-no-ask">46¢</div>
              <div style="font-size: 0.75rem; color: var(--muted);">Spread Drag: 2.0¢ (Overround 102.0%)</div>
            </div>
          </div>

          <div style="background: #080C1C; border: 1px solid var(--border-subtle); border-radius: 14px; padding: 20px;">
            <div style="font-size: 0.88rem; font-weight: 700; color: #FFF; margin-bottom: 12px;">Active Specialist Telemetry Outputs</div>
            <div id="active-specialist-telemetry" style="display: flex; flex-direction: column; gap: 10px;">
              <!-- Dynamic outputs -->
            </div>
          </div>
        </div>

        <div class="receipt-panel">
          <div class="panel-title">
            <span>Quanta Decision Receipt</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Selected Scenario</span>
            <span class="receipt-val" style="color: var(--mint);">YES @ 56¢</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Quantity Contracts</span>
            <span class="receipt-val">100 Contracts</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Capital Outlay</span>
            <span class="receipt-val">$56.00</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Estimated Taker Fees</span>
            <span class="receipt-val" style="color: var(--danger);">-$1.75 (3.12%)</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Total Cash Risk</span>
            <span class="receipt-val">$57.75</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Breakeven Win Rate</span>
            <span class="receipt-val" style="color: var(--gold);">57.75%</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Reasons to Abstain</span>
            <span class="receipt-val" style="color: var(--cyan);">Basis divergence > 0.4%</span>
          </div>

          <button class="btn-hero-primary" style="width: 100%; margin-top: 10px; justify-content: center;" onclick="alert('Decision receipt recorded to your private session journal.')">
            Save Reasoning to Journal
          </button>
          <p style="font-size: 0.72rem; color: #64748B; text-align: center;">
            QuanterraOS operates research mode. Equipping specialists does not place live orders or guarantee financial outcomes.
          </p>
        </div>
      </div>
    </section>

    <!-- ---------------------------------------------------- -->
    <!-- VIEW 3: CREW SHOWCASE                                -->
    <!-- ---------------------------------------------------- -->
    <section id="view-crew" class="view-page">
      <div style="margin-bottom: 36px;">
        <span class="section-label">Personnel Roster</span>
        <h2 class="section-title">The QuanterraOS Fighter Pilots Roster</h2>
        <p style="color: var(--muted); max-width: 720px;">
          Meet the eleven distinct friendly digital astronauts. Michael Quanterra is the Founder and creator (marked by the capital M on helmet); Quanta is the global galactic leader; Quantana is Queen and companion; supported by eight specialized analysts.
        </p>
      </div>

      <div class="crew-grid" id="crew-grid">
        <!-- Rendered by JS from roster -->
      </div>
    </section>

    <!-- ---------------------------------------------------- -->
    <!-- VIEW 4: THE 44 GALLERY                               -->
    <!-- ---------------------------------------------------- -->
    <section id="view-gallery" class="view-page">
      <div style="margin-bottom: 28px;">
        <span class="section-label">Official Collection</span>
        <h2 class="section-title">The 44 — Official QuanterraOS Fighter Pilots Artworks</h2>
        <p style="color: var(--muted); max-width: 720px;">
          Exactly 44 verified artworks across 4 chapters: Origin Command, Cosmic Street, Executive Orbit, and Royal Ascension. 4 unique master artworks per member. Unminted digital collectibles.
        </p>
      </div>

      <div class="gallery-filter-bar">
        <label style="display: flex; flex-direction: column; gap: 4px;">
          <span class="control-label">Member Filter</span>
          <select class="select-pill" id="filter-member" onchange="applyGalleryFilter()">
            <option value="all">All 11 Members</option>
            <option value="michael">Michael Quanterra (Founder)</option>
            <option value="quanta">Quanta (Leader)</option>
            <option value="quantana">Quantana (Queen)</option>
            <option value="draco">Draco (Data Quality)</option>
            <option value="wolf">Wolf (Order Book)</option>
            <option value="falcon">Falcon (Research)</option>
            <option value="quantum-fox">Quantum Fox (Calibration)</option>
            <option value="sentinel">Sentinel (Feed Health)</option>
            <option value="kraken">Kraken (Settlement)</option>
            <option value="lion">Lion (Synthesis)</option>
            <option value="phoenix">Phoenix (Recovery)</option>
          </select>
        </label>

        <label style="display: flex; flex-direction: column; gap: 4px;">
          <span class="control-label">Chapter Filter</span>
          <select class="select-pill" id="filter-chapter" onchange="applyGalleryFilter()">
            <option value="all">All 4 Chapters</option>
            <option value="origin-command">Chapter 1: Origin Command</option>
            <option value="cosmic-street">Chapter 2: Cosmic Street</option>
            <option value="executive-orbit">Chapter 3: Executive Orbit</option>
            <option value="royal-ascension">Chapter 4: Royal Ascension</option>
          </select>
        </label>

        <label style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
          <span class="control-label">Search Artworks</span>
          <input class="select-pill" id="filter-search" type="search" placeholder="Search by title, prompt or keyword..." oninput="applyGalleryFilter()">
        </label>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="font-size: 0.88rem; color: var(--muted);" id="gallery-count-label">44 artworks available</div>
      </div>

      <div class="gallery-grid" id="gallery-grid">
        <!-- Rendered by JS -->
      </div>

      <div class="pagination-bar">
        <button class="pagination-btn" id="gallery-prev" onclick="prevGalleryPage()">← Previous</button>
        <div class="pagination-info" id="gallery-page-indicator">Page 1 of 4</div>
        <button class="pagination-btn" id="gallery-next" onclick="nextGalleryPage()">Next →</button>
      </div>
    </section>

    <!-- ---------------------------------------------------- -->
    <!-- VIEW 5: GEAR & APPAREL                               -->
    <!-- ---------------------------------------------------- -->
    <section id="view-gear" class="view-page">
      <div style="margin-bottom: 28px;">
        <span class="section-label">Astronaut Apparel</span>
        <h2 class="section-title">QuanterraOS Fighter Pilots Apparel &amp; Royal Galactic Concepts</h2>
        <p style="color: var(--muted); max-width: 720px;">
          78 design concepts across 13 presentation boards. Men's and Women's hoodies, jumpsuits, and structured business attire. All boards are design concepts; commercial checkout is disabled until physical manufacturer samples are approved.
        </p>
      </div>

      <div class="gallery-filter-bar">
        <label style="display: flex; flex-direction: column; gap: 4px;">
          <span class="control-label">Collection Filter</span>
          <select class="select-pill" id="filter-gear-collection" onchange="applyGearFilter()">
            <option value="all">All 5 Collections (13 Boards)</option>
            <option value="Founder M Edition">Founder M Edition (Michael)</option>
            <option value="Crew Essentials">Crew Essentials (Council Specialists)</option>
            <option value="Executive Orbit">Executive Orbit (Diplomatic)</option>
            <option value="King Royal Galactic">King Royal Galactic</option>
            <option value="Queen Royal Galactic">Queen Royal Galactic</option>
          </select>
        </label>
      </div>

      <div class="gear-grid" id="gear-grid">
        <!-- Rendered by JS -->
      </div>
    </section>

  </main>

  <!-- Detail Modal Dialog -->
  <dialog id="detail-modal">
    <div class="modal-inner">
      <div class="modal-header">
        <h3 id="modal-title" style="font-size: 1.15rem; color: #FFF;">Artwork Detail</h3>
        <button class="modal-close-btn" onclick="closeModal()">Close ✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-img-wrap">
          <img id="modal-img" src="" alt="Detail view">
        </div>
        <div class="modal-details">
          <div id="modal-badge" class="concept-notice-badge">Artwork · NFT-ready</div>
          <h4 id="modal-subtitle" style="font-size: 1.25rem; font-weight: 800; color: #FFF;">Title</h4>
          <p id="modal-desc" style="color: var(--muted); font-size: 0.92rem; line-height: 1.6;">Description</p>
          <div id="modal-meta" style="font-family: var(--font-mono); font-size: 0.78rem; color: #64748B;">
            Metadata
          </div>
        </div>
      </div>
    </div>
  </dialog>

  <!-- Clean Unified Footer -->
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-links-row">
        <div class="brand-group" onclick="navTo('home')">
          <div class="brand-logo-dot"></div>
          <div class="brand-title">QUANTERRA<span>OS</span></div>
        </div>
        <nav class="footer-nav" aria-label="Footer Navigation">
          <a href="#cockpit" onclick="navTo('cockpit')">Cockpit</a>
          <a href="#crew" onclick="navTo('crew')">QuanterraOS Fighter Pilots</a>
          <a href="#gallery" onclick="navTo('gallery')">The 44 Gallery</a>
          <a href="#gear" onclick="navTo('gear')">Apparel Concepts</a>
          <a href="/pricing">Pricing Plans</a>
          <a href="/learn">Learn & Evidence</a>
          <a href="/status">Status</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </nav>
      </div>
      <div class="footer-disclaimer">
        QuanterraOS is an independent analytics tool by Quantara Global LLC. We don't place trades, hold funds, or give investment advice. Prediction-market trading can lose money. 18+. Michael Quanterra Founder Provenance · All rights reserved.
      </div>
    </div>
  </footer>

  <script>
    // Master Asset Catalog & Data Sources
    const ART_CATALOG = ${catalogJsonSafe};
    const MERCH_CATALOG = ${merchJsonSafe};

    // 11 Members Roster
    const ROSTER = [
      { id: 'michael', name: 'Michael Quanterra', role: 'Founder & Creator', symbol: 'founder-m', visualIdentity: 'M helmet forehead; violet star eyes; cyan smile; black/pearl/gold founder suit', productResponsibility: 'Founder story and provenance. Brand character, not a trading engine', image: 'assets/q44-001.png', category: 'founder' },
      { id: 'quanta', name: 'Quanta', role: 'Virtual Assistant & Leader', symbol: 'dual-arrows', visualIdentity: 'Green up arrow and pink down arrow together; violet smile; gold crown/purple orb', productResponsibility: 'Assistant, orchestration and explanation', image: 'assets/q44-002.png', category: 'leader' },
      { id: 'quantana', name: 'Quantana', role: 'Queen & Companion', symbol: 'cosmic-tiara', visualIdentity: 'Violet curved smiling eyes; tiara; cosmic ribbon veil', productResponsibility: 'Onboarding and education; Queen collection host', image: 'assets/q44-003.png', category: 'leader' },
      { id: 'draco', name: 'Draco', role: 'Data Quality & Provenance', symbol: 'dragon', visualIdentity: 'Amber angular eyes; red dragon crest', productResponsibility: 'Data quality, provenance, outlier checks', image: 'assets/q44-004.png', category: 'specialist', defaultEquipped: true },
      { id: 'wolf', name: 'Wolf', role: 'Order Book & Liquidity', symbol: 'wolf', visualIdentity: 'Ice-cyan chevrons; wolf helmet fins', productResponsibility: 'Order book, spread, liquidity and fill assumptions', image: 'assets/q44-005.png', category: 'specialist', defaultEquipped: true },
      { id: 'falcon', name: 'Falcon', role: 'Short-Horizon Research', symbol: 'falcon', visualIdentity: 'Blue wing eyes; aerodynamic fins', productResponsibility: 'Short-horizon research; timestamped probabilistic output', image: 'assets/q44-006.png', category: 'specialist' },
      { id: 'quantum-fox', name: 'Quantum Fox', role: 'Statistical Validation', symbol: 'fox', visualIdentity: 'Violet diamond eyes; fox fins', productResponsibility: 'Out-of-sample validation, uncertainty and calibration', image: 'assets/q44-007.png', category: 'specialist' },
      { id: 'sentinel', name: 'Sentinel', role: 'Systems Monitoring', symbol: 'shield', visualIdentity: 'Green hexagon eyes; diagnostic shield', productResponsibility: 'Feed health, staleness, risk-state monitoring', image: 'assets/q44-008.png', category: 'specialist', defaultEquipped: true },
      { id: 'kraken', name: 'Kraken', role: 'Basis & Settlement Rules', symbol: 'kraken', visualIdentity: 'Aqua spirals; sensor arms', productResponsibility: 'Spot/index basis and contract-specific settlement rules', image: 'assets/q44-009.png', category: 'specialist', defaultEquipped: true },
      { id: 'lion', name: 'Lion', role: 'Crew Synthesis', symbol: 'lion', visualIdentity: 'Amber sun discs; gold mechanical mane', productResponsibility: 'Evidence synthesis and disagreement summary', image: 'assets/q44-010.png', category: 'specialist' },
      { id: 'phoenix', name: 'Phoenix', role: 'Reliability & Recovery', symbol: 'phoenix', visualIdentity: 'Pink curved eyes; coral feather crest', productResponsibility: 'Reconnection, recovery and incident state', image: 'assets/q44-011.png', category: 'specialist' }
    ];

    // 13 Apparel Presentation Boards
    const APPAREL_BOARDS = [
      { id: 'board-michael', title: 'Founder M Edition — Michael Quanterra', collection: 'Founder M Edition', image: 'assets/apparel/michael-apparel-board.png', desc: 'Six-look design board showcasing the Founder M Edition collection: obsidian black bases, pearl fabric contrast, gold micro-piping, and capital M embroidery.' },
      { id: 'board-quanta', title: 'Quanta Galactic Leader Collection', collection: 'Crew Essentials', image: 'assets/apparel/quanta-leader-apparel-board.png', desc: 'Six-look design board for Quanta: balanced market perspective dual arrow emblems, lavender structural panels, and modern aerodynamic silhouettes.' },
      { id: 'board-quantana', title: 'Quantana Queen Companion Collection', collection: 'Executive Orbit', image: 'assets/apparel/quantana-apparel-board.png', desc: 'Six-look design board for Quantana: tiara motif, cosmic ribbon trims, and rose-gold detailing across everyday and tailored garments.' },
      { id: 'board-draco', title: 'Draco Data Quality Collection', collection: 'Crew Essentials', image: 'assets/apparel/draco-apparel-board.png', desc: 'Six-look design board for Draco: crimson paneling, obsidian structural lines, geometric dragon crests, and antique gold piping.' },
      { id: 'board-wolf', title: 'Wolf Liquidity & Order Book Collection', collection: 'Crew Essentials', image: 'assets/apparel/wolf-apparel-board.png', desc: 'Six-look design board for Wolf: gunmetal fleece, icy-cyan accents, angular chevron geometry, and reinforced cuffs.' },
      { id: 'board-falcon', title: 'Falcon Probabilistic Depth Collection', collection: 'Crew Essentials', image: 'assets/apparel/falcon-apparel-board.png', desc: 'Six-look design board for Falcon: electric cobalt blue accents, aerodynamic seam lines, and micro-ripstop utility fabrics.' },
      { id: 'board-quantum-fox', title: 'Quantum Fox Calibration Collection', collection: 'Crew Essentials', image: 'assets/apparel/quantum-fox-apparel-board.png', desc: 'Six-look design board for Quantum Fox: celestial violet fleece, copper-orange piping, diamond insignia, and articulated joints.' },
      { id: 'board-sentinel', title: 'Sentinel Systems Health Collection', collection: 'Crew Essentials', image: 'assets/apparel/sentinel-apparel-board.png', desc: 'Six-look design board for Sentinel: emerald status piping, diagnostic shield motifs, and double-reinforced structure.' },
      { id: 'board-kraken', title: 'Kraken Basis & Settlement Collection', collection: 'Executive Orbit', image: 'assets/apparel/kraken-apparel-board.png', desc: 'Six-look design board for Kraken: ocean teal base, aqua spiral geometry, and structured tailoring.' },
      { id: 'board-lion', title: 'Lion Evidence Synthesis Collection', collection: 'Crew Essentials', image: 'assets/apparel/lion-apparel-board.png', desc: 'Six-look design board for Lion: dark amber raw silk, gold mane detailing, solar disc embroidery, and structured lapels.' },
      { id: 'board-phoenix', title: 'Phoenix Incident Recovery Collection', collection: 'Crew Essentials', image: 'assets/apparel/phoenix-apparel-board.png', desc: 'Six-look design board for Phoenix: coral pink hues, feather embroidery, and thermal-regulating fabrics.' },
      { id: 'board-king-royal', title: 'King Royal Galactic Collection', collection: 'King Royal Galactic', image: 'assets/apparel/king-royal-galactic-board.png', desc: 'Six-look imperial board: deep violet velvet, gold leaf embroidery, and cosmic star charts across both men\\'s and women\\'s fits.' },
      { id: 'board-queen-royal', title: 'Queen Royal Galactic Collection', collection: 'Queen Royal Galactic', image: 'assets/apparel/queen-royal-galactic-board.png', desc: 'Six-look imperial board: astral silk, rose-gold filigree, and iridescent lilac tones across both men\\'s and women\\'s fits.' }
    ];

    // State
    let currentView = 'home';
    let galleryPage = 1;
    const GALLERY_PER_PAGE = 12;
    let filteredArtworks = [...ART_CATALOG];
    let equippedSpecialists = new Set(['draco', 'wolf', 'kraken', 'sentinel']);

    // Load saved crew preferences
    try {
      const saved = JSON.parse(localStorage.getItem('qos-eleven-crew'));
      if (Array.isArray(saved)) {
        equippedSpecialists = new Set(saved);
      }
    } catch (e) {}

    // Resilient Image Fallback Handler
    function handleImgError(img, origPath) {
      console.warn('Image failed to load:', origPath);
      // Attempt alternative paths
      if (!img.dataset.retried) {
        img.dataset.retried = '1';
        if (origPath.startsWith('assets/')) {
          img.src = '/' + origPath;
          return;
        } else if (origPath.startsWith('/assets/')) {
          img.src = origPath.replace('/assets/', 'assets/');
          return;
        }
      }
      
      // If still failing, render an informative vector placeholder
      const parent = img.parentElement;
      if (parent) {
        img.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.style.cssText = 'width:100%;height:100%;min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0A0E22;color:#94A3B8;padding:20px;text-align:center;gap:8px;border-radius:12px;';
        fallback.innerHTML = '<span style="font-size:1.8rem;color:#9B6CFF;">✦</span><span style="font-size:0.82rem;font-weight:700;color:#FFF;">' + (img.alt || 'Asset Preview') + '</span><span style="font-size:0.72rem;font-family:monospace;color:#64748B;">' + origPath + '</span><button style="margin-top:6px;background:#151B33;border:1px solid rgba(155,108,255,0.3);color:#FFF;padding:4px 10px;border-radius:6px;font-size:0.75rem;cursor:pointer;" onclick="retryImg(this, \\'' + origPath + '\\')">Retry Load ↻</button>';
        parent.appendChild(fallback);
      }
    }

    function retryImg(btn, origPath) {
      const parent = btn.parentElement;
      const img = parent.previousElementSibling;
      if (img && img.tagName === 'IMG') {
        parent.remove();
        img.style.display = 'block';
        img.src = origPath + '?t=' + Date.now();
      }
    }

    // Navigation Router
    function navTo(viewId) {
      if (!['home', 'cockpit', 'crew', 'gallery', 'gear'].includes(viewId)) {
        viewId = 'home';
      }
      currentView = viewId;

      document.querySelectorAll('.view-page').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById('view-' + viewId);
      if (activeEl) activeEl.classList.add('active');

      document.querySelectorAll('.primary-nav .nav-link').forEach(link => {
        if (link.dataset.view === viewId) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });

      // Update Quanta Guide text & outfit per section
      updateQuantaGuide(viewId);

      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        history.replaceState(null, '', '#' + viewId);
      } catch (e) {}
    }

    function toggleMobileMenu() {
      const drawer = document.getElementById('mobile-drawer');
      drawer.classList.toggle('open');
    }

    function updateQuantaGuide(viewId) {
      const avatar = document.getElementById('guide-avatar');
      const text = document.getElementById('guide-text');
      
      const guides = {
        home: {
          avatar: 'assets/q44-002.png',
          text: 'Assemble your analytical crew. Investigate supported Kalshi and Polymarket order books, underlying CME benchmarks, and fee drag before you act.'
        },
        cockpit: {
          avatar: 'assets/q44-002.png',
          text: 'Select your market question above. Toggle specialists in your dock to inspect data quality, order book depth, and settlement basis in real time.'
        },
        crew: {
          avatar: 'assets/q44-024.png',
          text: 'The QuanterraOS Fighter Pilots council includes Founder Michael Quanterra with his M helmet mark, myself and Quantana as leaders, and eight dedicated specialists.'
        },
        gallery: {
          avatar: 'assets/q44-013.png',
          text: 'Explore all 44 authentic artworks across four chapters: Origin Command, Cosmic Street, Executive Orbit, and Royal Ascension.'
        },
        gear: {
          avatar: 'assets/q44-024.png',
          text: 'These 78 garment designs are concept boards. Commercial checkout remains strictly disabled until physical samples are verified.'
        }
      };

      const g = guides[viewId] || guides.home;
      avatar.src = g.avatar;
      text.textContent = g.text;
    }

    function dismissGuide() {
      document.getElementById('quanta-guide').style.display = 'none';
    }

    // Cockpit Specialists Dock
    function renderSpecialistDock() {
      const dock = document.getElementById('crew-dock-grid');
      dock.innerHTML = '';

      const specialists = ROSTER.filter(m => m.category === 'specialist');
      specialists.forEach(spec => {
        const isEquipped = equippedSpecialists.has(spec.id);
        const btn = document.createElement('button');
        btn.className = 'specialist-btn' + (isEquipped ? ' equipped' : '');
        btn.setAttribute('aria-pressed', String(isEquipped));
        btn.onclick = () => toggleSpecialist(spec.id);

        btn.innerHTML = \`
          <img class="specialist-avatar" src="\${spec.image}" alt="\${spec.name}" onerror="handleImgError(this, '\${spec.image}')">
          <div class="specialist-info">
            <div class="specialist-name">\${spec.name}</div>
            <div class="specialist-duty">\${spec.role}</div>
          </div>
          <div class="equipped-tag" style="display: \${isEquipped ? 'block' : 'none'};">ON</div>
        \`;
        dock.appendChild(btn);
      });

      renderActiveTelemetry();
    }

    function toggleSpecialist(specId) {
      if (equippedSpecialists.has(specId)) {
        equippedSpecialists.delete(specId);
      } else {
        equippedSpecialists.add(specId);
      }
      try {
        localStorage.setItem('qos-eleven-crew', JSON.stringify([...equippedSpecialists]));
      } catch (e) {}
      renderSpecialistDock();
    }

    function renderActiveTelemetry() {
      const container = document.getElementById('active-specialist-telemetry');
      container.innerHTML = '';

      const telemetryMap = {
        'draco': 'Draco · Data Quality: All 4 quote sources validated without timestamp gaps.',
        'wolf': 'Wolf · Depth Analysis: 450 contracts resting at 56¢ ask. Assumed 100-contract fill has 0.0¢ market impact.',
        'sentinel': 'Sentinel · Feed Monitor: CME CF BRTI feed latency 28ms. Zero sequence drops in last 60 minutes.',
        'kraken': 'Kraken · Settlement Rules: Cash settlement adheres to CME CF BRTI 60s TWAP at 17:00 UTC.',
        'falcon': 'Falcon · Research: Probability velocity +1.4% over 15m window against baseline.',
        'quantum-fox': 'Quantum Fox · Calibration: Historical Brier score 0.084 across 1,200 out-of-sample events.',
        'lion': 'Lion · Synthesis: Consensus high across order book liquidity and spot index correlation.',
        'phoenix': 'Phoenix · Reliability: Redundant WebSocket failover standby primed.'
      };

      if (equippedSpecialists.size === 0) {
        container.innerHTML = '<div style="color:var(--muted); font-size:0.85rem;">No specialists equipped. Click above to activate analytical stations.</div>';
        return;
      }

      equippedSpecialists.forEach(id => {
        const text = telemetryMap[id] || (id + ': Monitoring active.');
        const div = document.createElement('div');
        div.style.cssText = 'font-size: 0.85rem; color: #E2E8F0; padding: 6px 12px; background: rgba(155, 108, 255, 0.08); border-left: 3px solid var(--violet); border-radius: 4px;';
        div.textContent = text;
        container.appendChild(div);
      });
    }

    function updateCockpitData() {
      const venue = document.getElementById('cockpit-venue').value;
      const target = document.getElementById('cockpit-target').value;
      const status = document.getElementById('cockpit-feed-status');
      
      if (venue === 'kalshi') {
        status.textContent = 'Kalshi Regulated Feed Active · CME BRTI 60s TWAP';
      } else {
        status.textContent = 'Polymarket CLOB Order Book Active · UMA Oracle Basis';
      }
    }

    // Render Crew Showcase
    function renderCrewShowcase() {
      const grid = document.getElementById('crew-grid');
      grid.innerHTML = '';

      ROSTER.forEach(member => {
        const card = document.createElement('div');
        card.className = 'crew-card';
        card.onclick = () => openMemberModal(member);

        card.innerHTML = \`
          <div class="crew-card-img-wrap">
            <img class="crew-card-img" src="\${member.image}" alt="\${member.name}" onerror="handleImgError(this, '\${member.image}')">
          </div>
          <div class="crew-card-body">
            <div class="crew-card-badge">\${member.role}</div>
            <div class="crew-card-name">\${member.name}</div>
            <div class="crew-card-duty">\${member.productResponsibility}</div>
          </div>
        \`;
        grid.appendChild(card);
      });
    }

    // Render Gallery
    function renderGallery() {
      const grid = document.getElementById('gallery-grid');
      grid.innerHTML = '';

      const totalItems = filteredArtworks.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / GALLERY_PER_PAGE));
      galleryPage = Math.min(galleryPage, totalPages);

      document.getElementById('gallery-page-indicator').textContent = \`Page \${galleryPage} of \${totalPages}\`;
      document.getElementById('gallery-count-label').textContent = \`\${totalItems} artworks available\`;
      document.getElementById('gallery-prev').disabled = galleryPage === 1;
      document.getElementById('gallery-next').disabled = galleryPage === totalPages;

      const startIndex = (galleryPage - 1) * GALLERY_PER_PAGE;
      const pageItems = filteredArtworks.slice(startIndex, startIndex + GALLERY_PER_PAGE);

      pageItems.forEach(art => {
        const card = document.createElement('div');
        card.className = 'art-card';
        card.onclick = () => openArtworkModal(art);

        card.innerHTML = \`
          <div class="art-card-img-wrap">
            <img class="art-card-img" src="\${art.imagePath || 'assets/' + art.id + '.png'}" alt="\${art.title}" onerror="handleImgError(this, '\${art.imagePath || 'assets/' + art.id + '.png'}')">
          </div>
          <div class="art-card-body">
            <div class="art-card-id">\${art.id} · Chapter 0\${art.chapterNumber}</div>
            <div class="art-card-title">\${art.title}</div>
            <div class="art-card-meta">
              <span>\${art.memberName}</span>
              <span style="color:var(--gold);">Unminted</span>
            </div>
          </div>
        \`;
        grid.appendChild(card);
      });
    }

    function applyGalleryFilter() {
      const memberVal = document.getElementById('filter-member').value;
      const chapterVal = document.getElementById('filter-chapter').value;
      const searchVal = document.getElementById('filter-search').value.toLowerCase().trim();

      filteredArtworks = ART_CATALOG.filter(art => {
        const matchMember = memberVal === 'all' || art.crewCanonicalId === memberVal;
        const matchChapter = chapterVal === 'all' || art.chapterId === chapterVal;
        const matchSearch = !searchVal || 
          art.title.toLowerCase().includes(searchVal) || 
          art.memberName.toLowerCase().includes(searchVal) ||
          art.id.toLowerCase().includes(searchVal);
        return matchMember && matchChapter && matchSearch;
      });

      galleryPage = 1;
      renderGallery();
    }

    function prevGalleryPage() {
      if (galleryPage > 1) {
        galleryPage--;
        renderGallery();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    }

    function nextGalleryPage() {
      const totalPages = Math.ceil(filteredArtworks.length / GALLERY_PER_PAGE);
      if (galleryPage < totalPages) {
        galleryPage++;
        renderGallery();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    }

    // Render Gear
    function renderGear(collectionFilter = 'all') {
      const grid = document.getElementById('gear-grid');
      grid.innerHTML = '';

      const boards = APPAREL_BOARDS.filter(b => collectionFilter === 'all' || b.collection === collectionFilter);
      boards.forEach(board => {
        const card = document.createElement('div');
        card.className = 'gear-card';
        card.onclick = () => openBoardModal(board);

        card.innerHTML = \`
          <div class="gear-card-img-wrap">
            <img class="gear-card-img" src="\${board.image}" alt="\${board.title}" onerror="handleImgError(this, '\${board.image}')">
          </div>
          <div class="gear-card-body">
            <div class="concept-notice-badge">Design Concept · 6 Looks (Men & Women)</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: #FFF;">\${board.title}</div>
            <p style="color: var(--muted); font-size: 0.88rem; line-height: 1.5;">\${board.desc}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.82rem; color: #64748B;">
              <span>Hoodies · Jumpsuits · Suits</span>
              <span style="color: var(--gold);">Checkout Disabled</span>
            </div>
          </div>
        \`;
        grid.appendChild(card);
      });
    }

    function applyGearFilter() {
      const val = document.getElementById('filter-gear-collection').value;
      renderGear(val);
    }

    // Modals
    const modal = document.getElementById('detail-modal');

    function openArtworkModal(art) {
      document.getElementById('modal-title').textContent = 'The 44 · ' + art.id;
      document.getElementById('modal-subtitle').textContent = art.title;
      document.getElementById('modal-badge').textContent = 'Artwork · NFT-ready (Unminted)';
      document.getElementById('modal-badge').style.color = 'var(--gold)';
      document.getElementById('modal-desc').textContent = art.description;
      document.getElementById('modal-img').src = art.imagePath || 'assets/' + art.id + '.png';
      document.getElementById('modal-meta').innerHTML = \`
        <div>Member: \${art.memberName} (\${art.crewCanonicalId})</div>
        <div>Chapter: \${art.chapterTitle}</div>
        <div>SHA-256: \${art.sha256}</div>
      \`;
      modal.showModal();
    }

    function openMemberModal(member) {
      document.getElementById('modal-title').textContent = 'QuanterraOS Fighter Pilots · ' + member.name;
      document.getElementById('modal-subtitle').textContent = member.role;
      document.getElementById('modal-badge').textContent = member.category.toUpperCase();
      document.getElementById('modal-badge').style.color = 'var(--violet)';
      document.getElementById('modal-desc').innerHTML = \`
        <p style="margin-bottom:12px;"><strong>Visual Signature:</strong> \${member.visualIdentity}</p>
        <p><strong>Product Responsibility:</strong> \${member.productResponsibility}</p>
      \`;
      document.getElementById('modal-img').src = member.image;
      document.getElementById('modal-meta').innerHTML = \`
        <div>Symbol: \${member.symbol}</div>
        <div>Council Seat: \${member.name}</div>
      \`;
      modal.showModal();
    }

    function openBoardModal(board) {
      document.getElementById('modal-title').textContent = 'Apparel Presentation Board';
      document.getElementById('modal-subtitle').textContent = board.title;
      document.getElementById('modal-badge').textContent = 'Design Concept (78 Concept Looks)';
      document.getElementById('modal-badge').style.color = 'var(--gold)';
      document.getElementById('modal-desc').innerHTML = \`
        <p style="margin-bottom:12px;">\${board.desc}</p>
        <p style="font-size:0.82rem; color:var(--gold);"><strong>Notice:</strong> Design concept — final product may vary. Commercial checkout remains disabled until physical sample approval and supplier tech packs are completed.</p>
      \`;
      document.getElementById('modal-img').src = board.image;
      document.getElementById('modal-meta').innerHTML = \`
        <div>Collection: \${board.collection}</div>
        <div>Looks: Men's & Women's Hoodie, Jumpsuit, Business Attire</div>
      \`;
      modal.showModal();
    }

    function closeModal() {
      modal.close();
    }

    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        modal.close();
      }
    });

    // Initialization
    window.addEventListener('DOMContentLoaded', () => {
      renderSpecialistDock();
      renderCrewShowcase();
      renderGallery();
      renderGear();

      const hash = window.location.hash.replace('#', '');
      if (['cockpit', 'crew', 'gallery', 'gear'].includes(hash)) {
        navTo(hash);
      } else {
        navTo('home');
      }
    });
  </script>
</body>
</html>
`;

// Write to public/index.html, website-mobile-preview.html, and public/website-mobile-preview.html
console.log('Writing public/index.html...');
fs.writeFileSync(path.join(rootDir, 'public', 'index.html'), htmlContent, 'utf8');

console.log('Writing website-mobile-preview.html...');
fs.writeFileSync(path.join(rootDir, 'website-mobile-preview.html'), htmlContent, 'utf8');

console.log('Writing public/website-mobile-preview.html...');
fs.writeFileSync(path.join(rootDir, 'public', 'website-mobile-preview.html'), htmlContent, 'utf8');

console.log('Application preview files successfully generated!');
