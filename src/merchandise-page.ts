/**
 * QuanterraOS Official Merchandise Storefront & Gamification Rewards Page
 *
 * Route: /merchandise (alias /gear)
 *
 * Implements:
 * - Mascot Hoodies (Quanta, Kalshi Destroyer, Polymarket Terminator, Council)
 * - Flight Jumpsuits (Aerospace unisex twill)
 * - Bespoke Executive Suits (Men's & Women's Super 130s Italian Wool)
 * - Gamified Rewards: Flight XP points, Raffles, and Calibration Tournaments
 * - Responsive desktop & mobile design with instant purchase and raffle modals
 */

import {
  CANONICAL_MERCHANDISE,
  ACTIVE_RAFFLES,
  ACTIVE_TOURNAMENTS,
  TOURNAMENT_LEADERBOARD_MOCK,
  getUserGamificationSummary,
  type MerchandiseItem,
} from "./lib/merchandise.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";

export function renderMerchandisePageHtml(user?: { email?: string; callsign?: string } | null): string {
  const profile = getUserGamificationSummary(user?.email || "cadet-1");

  const productCardsHtml = CANONICAL_MERCHANDISE.map((p) => `
    <article class="merch-card" data-category="${p.category}" id="card-${p.id}">
      <div class="merch-img-wrap">
        <img src="${p.imageUrl}" alt="${p.name}" class="merch-img" loading="lazy">
        ${p.badge ? `<span class="merch-badge">${p.badge}</span>` : ""}
      </div>

      <div class="merch-content">
        <div class="merch-meta">
          <span class="merch-mascot">${p.mascotLabel}</span>
          <span class="merch-cat-tag">${p.categoryLabel}</span>
        </div>

        <h3 class="merch-title">${p.name}</h3>
        <p class="merch-desc">${p.description}</p>

        <div class="merch-materials">
          <strong>Fabric &amp; Trim:</strong> ${p.materials}
        </div>

        <div class="merch-options-row">
          <span class="options-tag">Sizes: ${p.availableSizes.slice(0, 4).join(", ")}${p.availableSizes.length > 4 ? "..." : ""}</span>
          <span class="options-tag cuts-tag">${p.genderCuts.join(" · ")}</span>
        </div>

        <div class="merch-pricing-bar">
          <div class="pricing-box">
            <span class="price-usd">${p.priceFormatted}</span>
            <span class="price-xp">or ${p.pointsCost.toLocaleString()} XP</span>
          </div>

          <div class="btn-group">
            <button type="button" class="btn-order" onclick="openOrderModal('${p.id}')">
              Purchase &rarr;
            </button>
            ${p.raffleEligible ? `<button type="button" class="btn-raffle-shortcut" onclick="scrollToRaffles()" title="Win in active raffle">Raffle</button>` : ""}
          </div>
        </div>
      </div>
    </article>
  `).join("\n");

  const rafflesHtml = ACTIVE_RAFFLES.map((r) => `
    <div class="raffle-card" id="${r.id}">
      <div class="raffle-header">
        <span class="raffle-tag">ACTIVE DRAWING</span>
        <span class="raffle-countdown">Closes ${new Date(r.endsAt).toLocaleDateString()}</span>
      </div>
      <h3 class="raffle-title">${r.title}</h3>
      <div class="raffle-prize-highlight">
        <img src="${r.prizeImageUrl}" alt="${r.prizeName}" class="raffle-prize-thumb">
        <div>
          <div style="font-weight:700; color:#FFF; font-size:1.05rem;">${r.prizeName}</div>
          <div style="font-size:0.82rem; color:var(--public-muted); margin-top:4px;">${r.prizeDescription}</div>
        </div>
      </div>
      <div class="raffle-footer">
        <div>
          <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:#8A8F98;">TOTAL TICKETS ISSUED</span>
          <div style="font-family:var(--public-font-mono); font-size:1.15rem; font-weight:700; color:#59DDEC;">${r.totalTickets.toLocaleString()}</div>
        </div>
        <button type="button" class="btn-enter-raffle" onclick="enterRaffleAction('${r.id}')">
          Enter Drawing (1 Ticket)
        </button>
      </div>
    </div>
  `).join("\n");

  const leaderboardRowsHtml = TOURNAMENT_LEADERBOARD_MOCK.map((row) => `
    <tr class="leaderboard-row ${row.rank === 1 ? 'rank-gold' : row.rank <= 3 ? 'rank-podium' : ''}">
      <td class="col-rank">#${row.rank}</td>
      <td class="col-pilot"><strong>${row.callsign}</strong></td>
      <td class="col-brier">${row.brierScore.toFixed(4)}</td>
      <td class="col-acc">${row.calibrationAccuracy}</td>
      <td class="col-prize"><span class="prize-pill">${row.rewardTier}</span></td>
    </tr>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Official Merchandise, Mascot Gear &amp; Rewards — QuanterraOS</title>
  <meta name="description" content="Official QuanterraOS apparel: mascot hoodies, aerospace flight jumpsuits, and bespoke Italian wool suits for men and women. Purchase direct or win in raffles and tournaments.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --merch-bg: #080B18;
      --merch-surface: #12172B;
      --merch-surface-border: rgba(175, 182, 206, 0.15);
      --merch-accent-purple: #9468FF;
      --merch-accent-cyan: #59DDEC;
      --merch-accent-gold: #DFB843;
      --merch-emerald: #10B981;
      --merch-cobalt: #3B82F6;
    }

    body {
      background: var(--merch-bg);
      color: #F4F5FF;
      margin: 0;
      padding: 0;
      font-family: var(--public-font-sans);
      overflow-x: hidden;
    }

    .merch-container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 24px 80px;
    }

    /* Hero Banner */
    .merch-hero {
      padding: 56px 0 40px;
      text-align: center;
      position: relative;
    }

    .merch-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--merch-accent-purple);
      background: rgba(148, 104, 255, 0.1);
      border: 1px solid rgba(148, 104, 255, 0.3);
      padding: 6px 16px;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    .merch-headline {
      font-size: clamp(2.2rem, 4.5vw, 3.4rem);
      font-weight: 800;
      line-height: 1.15;
      margin: 0 0 16px;
      color: #FFFFFF;
      letter-spacing: -0.02em;
    }

    .merch-subtitle {
      font-size: clamp(1rem, 2vw, 1.15rem);
      color: var(--public-muted);
      max-width: 760px;
      margin: 0 auto 28px;
      line-height: 1.6;
    }

    /* User Flight XP Gamification Banner */
    .user-xp-strip {
      background: linear-gradient(135deg, rgba(148, 104, 255, 0.12) 0%, rgba(89, 221, 236, 0.12) 100%);
      border: 1px solid rgba(148, 104, 255, 0.35);
      border-radius: 14px;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin: 0 auto 40px;
      max-width: 980px;
    }

    .xp-stat-group {
      display: flex;
      gap: 28px;
      flex-wrap: wrap;
    }
    .xp-stat-item {
      display: flex;
      flex-direction: column;
    }
    .xp-stat-label {
      font-family: var(--public-font-mono);
      font-size: 0.7rem;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .xp-stat-value {
      font-family: var(--public-font-mono);
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
    }

    .btn-claim-daily {
      background: var(--merch-accent-purple);
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-claim-daily:hover {
      background: #8048FF;
      transform: translateY(-1px);
    }

    /* Category Nav Filters */
    .category-filter-nav {
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 40px;
    }

    .btn-filter {
      background: rgba(18, 23, 43, 0.7);
      border: 1px solid var(--merch-surface-border);
      color: #CBD5E1;
      font-family: var(--public-font-sans);
      font-weight: 600;
      font-size: 0.88rem;
      padding: 10px 20px;
      border-radius: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 44px;
    }
    .btn-filter.active, .btn-filter:hover {
      background: var(--merch-accent-purple);
      border-color: var(--merch-accent-purple);
      color: #FFFFFF;
    }

    /* Product Grid */
    .merch-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 28px;
      margin-bottom: 64px;
    }

    .merch-card {
      background: var(--merch-surface);
      border: 1px solid var(--merch-surface-border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .merch-card:hover {
      transform: translateY(-4px);
      border-color: rgba(148, 104, 255, 0.4);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
    }

    .merch-img-wrap {
      width: 100%;
      height: 280px;
      background: #06070A;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .merch-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .merch-card:hover .merch-img {
      transform: scale(1.03);
    }

    .merch-badge {
      position: absolute;
      top: 14px;
      left: 14px;
      font-family: var(--public-font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      color: #59DDEC;
      background: rgba(0, 0, 0, 0.75);
      border: 1px solid rgba(89, 221, 236, 0.4);
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .merch-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
    }

    .merch-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .merch-mascot {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: var(--merch-accent-purple);
      text-transform: uppercase;
      font-weight: 700;
    }

    .merch-cat-tag {
      font-family: var(--public-font-mono);
      font-size: 0.7rem;
      color: var(--public-muted);
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .merch-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 10px;
      line-height: 1.3;
    }

    .merch-desc {
      font-size: 0.88rem;
      color: #CBD5E1;
      line-height: 1.5;
      margin-bottom: 14px;
    }

    .merch-materials {
      font-size: 0.78rem;
      color: #94A3B8;
      background: rgba(0, 0, 0, 0.35);
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 14px;
      line-height: 1.4;
    }

    .merch-options-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }

    .options-tag {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      color: #E2E8F0;
      background: rgba(255, 255, 255, 0.08);
      padding: 4px 8px;
      border-radius: 4px;
    }
    .cuts-tag {
      border: 1px solid rgba(148, 104, 255, 0.3);
      color: var(--merch-accent-cyan);
    }

    .merch-pricing-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
      margin-top: auto;
    }

    .pricing-box {
      display: flex;
      flex-direction: column;
    }
    .price-usd {
      font-size: 1.35rem;
      font-weight: 800;
      color: #FFFFFF;
    }
    .price-xp {
      font-family: var(--public-font-mono);
      font-size: 0.75rem;
      color: var(--merch-accent-purple);
      font-weight: 600;
    }

    .btn-group {
      display: flex;
      gap: 8px;
    }

    .btn-order {
      background: #FFFFFF;
      color: #080B18;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      min-height: 44px;
    }
    .btn-order:hover {
      background: var(--merch-accent-purple);
      color: #FFFFFF;
    }

    .btn-raffle-shortcut {
      background: rgba(89, 221, 236, 0.15);
      border: 1px solid rgba(89, 221, 236, 0.4);
      color: var(--merch-accent-cyan);
      font-weight: 600;
      font-size: 0.8rem;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      min-height: 44px;
    }

    /* Raffles & Tournaments Split Grid */
    .rewards-section {
      padding: 48px 0;
      border-top: 1px solid rgba(175, 182, 206, 0.15);
    }

    .section-headline {
      text-align: center;
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 12px;
      color: #FFFFFF;
    }

    .section-subtext {
      text-align: center;
      color: var(--public-muted);
      font-size: 0.95rem;
      max-width: 680px;
      margin: 0 auto 40px;
      line-height: 1.5;
    }

    .rewards-split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 48px;
    }
    @media (max-width: 900px) {
      .rewards-split-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Raffle Cards */
    .raffle-card {
      background: var(--merch-surface);
      border: 1px solid rgba(89, 221, 236, 0.3);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .raffle-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
    }
    .raffle-tag {
      color: #10B981;
      font-weight: 700;
    }
    .raffle-countdown {
      color: #94A3B8;
    }

    .raffle-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 14px;
    }

    .raffle-prize-highlight {
      display: flex;
      gap: 16px;
      background: rgba(0, 0, 0, 0.4);
      padding: 14px;
      border-radius: 10px;
      align-items: center;
      margin-bottom: 18px;
    }
    .raffle-prize-thumb {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
    }

    .raffle-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 14px;
    }

    .btn-enter-raffle {
      background: var(--merch-accent-cyan);
      color: #080B18;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      min-height: 44px;
    }

    /* Tournament Card & Leaderboard */
    .tournament-card {
      background: var(--merch-surface);
      border: 1px solid rgba(148, 104, 255, 0.3);
      border-radius: 16px;
      padding: 24px;
    }

    .tournament-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      margin-top: 16px;
    }
    .tournament-table th {
      font-family: var(--public-font-mono);
      font-size: 0.7rem;
      color: #8A8F98;
      text-transform: uppercase;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .tournament-table td {
      padding: 10px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .col-rank { font-family: var(--public-font-mono); font-weight: 700; color: var(--merch-accent-purple); width: 44px; }
    .col-pilot { color: #FFFFFF; }
    .col-brier { font-family: var(--public-font-mono); color: #59DDEC; }
    .col-acc { font-family: var(--public-font-mono); color: #10B981; }
    .prize-pill {
      font-family: var(--public-font-mono);
      font-size: 0.72rem;
      background: rgba(148, 104, 255, 0.15);
      border: 1px solid rgba(148, 104, 255, 0.3);
      color: #E2E8F0;
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }

    /* Order Checkout Modal */
    .order-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    }
    .order-modal-backdrop.open {
      display: flex;
    }

    .order-modal {
      background: #12172B;
      border: 1px solid rgba(148, 104, 255, 0.4);
      border-radius: 18px;
      width: 100%;
      max-width: 540px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
      position: relative;
    }

    .modal-close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      color: #94A3B8;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }

    .modal-field {
      margin-bottom: 16px;
    }
    .modal-label {
      display: block;
      font-family: var(--public-font-mono);
      font-size: 0.75rem;
      color: #94A3B8;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .modal-select, .modal-input {
      width: 100%;
      background: #080B18;
      border: 1px solid rgba(175, 182, 206, 0.25);
      border-radius: 8px;
      padding: 10px 14px;
      font-family: var(--public-font-sans);
      font-size: 0.92rem;
      color: #FFFFFF;
      outline: none;
    }

    /* Mandatory Disclosures */
    .merch-disclosure-card {
      background: rgba(18, 23, 43, 0.5);
      border: 1px solid var(--merch-surface-border);
      border-radius: 12px;
      padding: 20px;
      margin: 40px auto 0;
      max-width: 860px;
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      line-height: 1.6;
      color: #8A8F98;
      text-align: center;
    }
  </style>
</head>
<body>

  ${renderPublicHeader({ activePath: "/merchandise", user: user ? { email: user.email } : null })}

  <main class="merch-container">
    
    <!-- Hero Banner -->
    <section class="merch-hero" aria-label="Official Merchandise Hero">
      <div class="merch-eyebrow">
        <span>⚡</span> QUANTERRAOS FLIGHT GEAR // OFFICIAL MERCHANDISE
      </div>

      <h1 class="merch-headline">Wear the Discipline. Master the Odds.</h1>

      <p class="merch-subtitle">
        Official physical apparel for Flight Deck Pilots and Spacecraft Council officers. Mascot hoodies, aerospace jumpsuits, and bespoke Italian wool suits for men and women. Purchase direct or win through points, raffles, and tournaments.
      </p>

      <!-- User XP Gamification Bar -->
      <div class="user-xp-strip">
        <div class="xp-stat-group">
          <div class="xp-stat-item">
            <span class="xp-stat-label">Flight XP Balance</span>
            <span class="xp-stat-value" id="user-xp-display">${profile.flightXp.toLocaleString()} XP</span>
          </div>
          <div class="xp-stat-item">
            <span class="xp-stat-label">Discipline Streak</span>
            <span class="xp-stat-value">${profile.streakDays} Days</span>
          </div>
          <div class="xp-stat-item">
            <span class="xp-stat-label">Active Raffle Tickets</span>
            <span class="xp-stat-value" id="user-tickets-display">${profile.raffleTicketsCount} Tickets</span>
          </div>
          <div class="xp-stat-item">
            <span class="xp-stat-label">Tournament Rank</span>
            <span class="xp-stat-value">#${profile.tournamentRank}</span>
          </div>
        </div>

        <button type="button" class="btn-claim-daily" id="btn-daily-xp" onclick="claimDailyReward()">
          +100 Daily Check XP
        </button>
      </div>

      <!-- Category Filter Navigation -->
      <nav class="category-filter-nav" aria-label="Product Categories">
        <button type="button" class="btn-filter active" onclick="filterCategory('all', this)">All Flight Gear</button>
        <button type="button" class="btn-filter" onclick="filterCategory('hoodie', this)">Mascot Hoodies</button>
        <button type="button" class="btn-filter" onclick="filterCategory('jumpsuit', this)">Flight Jumpsuits</button>
        <button type="button" class="btn-filter" onclick="filterCategory('suit_mens', this)">Executive Suits (Men's)</button>
        <button type="button" class="btn-filter" onclick="filterCategory('suit_womens', this)">Executive Suits (Women's)</button>
        <button type="button" class="btn-filter" onclick="scrollToRaffles()">Win Prizes (Raffles &amp; Tournaments)</button>
      </nav>
    </section>

    <!-- Merchandise Catalog Grid -->
    <section class="merch-grid" id="product-grid" aria-label="Merchandise Catalog">
      ${productCardsHtml}
    </section>

    <!-- Raffles & Tournaments Gamification Section -->
    <section class="rewards-section" id="rewards-anchor" aria-label="Raffles and Tournaments">
      <h2 class="section-headline">Win Exclusive Gear &bull; Raffles &amp; Tournaments</h2>
      <p class="section-subtext">
        Every pre-flight check, thesis note, and calibration score earns Flight XP. Use your earned points to enter weekly raffles or climb the tournament leaderboard for custom bespoke suits.
      </p>

      <div class="rewards-split-grid">
        <!-- Left: Raffles -->
        <div>
          <div style="font-family:var(--public-font-mono); font-size:0.8rem; font-weight:700; color:var(--merch-accent-cyan); text-transform:uppercase; margin-bottom:14px; letter-spacing:0.08em;">
            🎟️ Official Flight Raffles
          </div>
          ${rafflesHtml}
        </div>

        <!-- Right: Tournaments -->
        <div>
          <div style="font-family:var(--public-font-mono); font-size:0.8rem; font-weight:700; color:var(--merch-accent-purple); text-transform:uppercase; margin-bottom:14px; letter-spacing:0.08em;">
            🏆 Forecasting Calibration Tournaments
          </div>

          <div class="tournament-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:#86F94A; font-weight:700;">LIVE COMPETITION</span>
              <span style="font-family:var(--public-font-mono); font-size:0.75rem; color:#94A3B8;">Fall 2026 Season</span>
            </div>

            <h3 style="font-size:1.25rem; font-weight:700; color:#FFF; margin:0 0 8px;">
              ${ACTIVE_TOURNAMENTS[0].title}
            </h3>

            <p style="font-size:0.85rem; color:var(--public-muted); line-height:1.5; margin-bottom:14px;">
              ${ACTIVE_TOURNAMENTS[0].description}
            </p>

            <div style="background:rgba(0,0,0,0.4); padding:10px 14px; border-radius:8px; font-size:0.8rem; color:#DFB843; font-family:var(--public-font-mono); margin-bottom:16px;">
              <strong>Prizes:</strong> ${ACTIVE_TOURNAMENTS[0].prizeMerchandise}
            </div>

            <button type="button" class="btn-claim-daily" style="width:100%; margin-bottom:18px;" onclick="joinTournamentAction('${ACTIVE_TOURNAMENTS[0].id}')">
              Register for Tournament ($0.00 Entry &bull; Rule B5 Locked)
            </button>

            <!-- Leaderboard Table -->
            <div style="overflow-x:auto;">
              <table class="tournament-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Pilot</th>
                    <th>Brier</th>
                    <th>Accuracy</th>
                    <th>Prize Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  ${leaderboardRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Statutory Compliance & Non-Wagering Disclosure -->
    <div class="merch-disclosure-card">
      <strong>OFFICIAL MERCHANDISE &bull; REWARDS &amp; TOURNAMENTS DISCLOSURE:</strong><br>
      QuanterraOS physical apparel (mascot hoodies, aerospace jumpsuits, bespoke suits) is manufactured and distributed by Quantara Global LLC. Mascot character names (Flight Pilot Quanta, Kalshi Destroyer, Polymarket Terminator, Spacecraft Council) are fictional creative titles. Point system (Flight XP), raffles, and calibration tournaments are non-gambling educational features with strictly $0.00 live financial risk (Rule B5 locked). Points and raffle tickets are earned through study and platform use, cannot be purchased with deposited trading funds, and cannot be wagered on prediction markets. Trading involves risk. 18+.
    </div>

  </main>

  <!-- Interactive Order Modal -->
  <div class="order-modal-backdrop" id="order-modal-backdrop" onclick="handleBackdropClick(event)">
    <div class="order-modal" role="dialog" aria-modal="true" aria-labelledby="modal-product-title">
      <button type="button" class="modal-close-btn" onclick="closeOrderModal()" aria-label="Close">&times;</button>
      
      <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--merch-accent-purple); font-weight:700; margin-bottom:4px; text-transform:uppercase;">
        Flight Deck Order Dispatch
      </div>
      <h2 id="modal-product-title" style="font-size:1.4rem; font-weight:800; color:#FFF; margin:0 0 14px;">Product Order</h2>

      <div id="modal-product-summary" style="display:flex; gap:14px; background:rgba(0,0,0,0.3); padding:12px; border-radius:10px; margin-bottom:18px;">
        <!-- Injected via JS -->
      </div>

      <form id="order-form" onsubmit="submitOrder(event)">
        <input type="hidden" id="modal-product-id">

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="modal-field">
            <label class="modal-label" for="modal-size-select">Select Size</label>
            <select id="modal-size-select" class="modal-select" required>
              <option value="S">Small (S)</option>
              <option value="M" selected>Medium (M)</option>
              <option value="L">Large (L)</option>
              <option value="XL">Extra Large (XL)</option>
              <option value="2XL">2X-Large (2XL)</option>
              <option value="Bespoke">Bespoke Made-to-Measure</option>
            </select>
          </div>

          <div class="modal-field">
            <label class="modal-label" for="modal-cut-select">Tailored Cut</label>
            <select id="modal-cut-select" class="modal-select" required>
              <option value="mens">Men's Tailored Cut</option>
              <option value="womens">Women's Tailored Cut</option>
              <option value="unisex">Unisex Flight Spec</option>
            </select>
          </div>
        </div>

        <div class="modal-field">
          <label class="modal-label" for="modal-customer-name">Full Name / Pilot Callsign</label>
          <input type="text" id="modal-customer-name" class="modal-input" placeholder="e.g. Commander Sarah Vance" required value="Pilot Cadet">
        </div>

        <div class="modal-field">
          <label class="modal-label" for="modal-customer-email">Email Address</label>
          <input type="email" id="modal-customer-email" class="modal-input" placeholder="cadet@quanterraos.com" required value="pilot@quanterraos.com">
        </div>

        <div class="modal-field">
          <label class="modal-label" for="modal-shipping-address">Shipping Address</label>
          <input type="text" id="modal-shipping-address" class="modal-input" placeholder="Street, City, State, Zip, Country" required value="742 Evergreen Terrace, Wilmington, DE 19801">
        </div>

        <div style="margin:20px 0 16px; display:flex; gap:12px;">
          <button type="submit" class="btn-order" style="flex:1; background:var(--merch-accent-purple); color:#FFF; padding:12px;">
            Confirm Order &bull; Standard Checkout
          </button>
          <button type="button" class="btn-raffle-shortcut" style="flex:1;" onclick="submitPointsRedemption()">
            Claim with Flight XP
          </button>
        </div>

        <div id="modal-feedback" style="display:none; padding:12px; border-radius:8px; font-size:0.85rem; text-align:center;"></div>
      </form>
    </div>
  </div>

  ${renderPublicFooter()}

  <script>
    const PRODUCTS_DATA = ${JSON.stringify(CANONICAL_MERCHANDISE)};
    let activeProduct = null;
    let currentXp = ${profile.flightXp};
    let currentTickets = ${profile.raffleTicketsCount};

    function filterCategory(cat, btn) {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');

      const cards = document.querySelectorAll('.merch-card');
      cards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (cat === 'all' || cardCat === cat || (cat === 'suits' && (cardCat === 'suit_mens' || cardCat === 'suit_womens'))) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function scrollToRaffles() {
      const el = document.getElementById('rewards-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function openOrderModal(productId) {
      activeProduct = PRODUCTS_DATA.find(p => p.id === productId);
      if (!activeProduct) return;

      document.getElementById('modal-product-id').value = activeProduct.id;
      document.getElementById('modal-product-title').textContent = activeProduct.name;
      
      const summaryEl = document.getElementById('modal-product-summary');
      summaryEl.innerHTML = \`
        <img src="\${activeProduct.imageUrl}" style="width:50px; height:50px; border-radius:6px; object-fit:cover;">
        <div>
          <div style="font-weight:700; color:#FFF; font-size:0.95rem;">\${activeProduct.name}</div>
          <div style="font-family:var(--public-font-mono); font-size:0.82rem; color:#59DDEC;">\${activeProduct.priceFormatted} or \${activeProduct.pointsCost.toLocaleString()} XP</div>
        </div>
      \`;

      // Update available sizes select
      const sizeSelect = document.getElementById('modal-size-select');
      sizeSelect.innerHTML = activeProduct.availableSizes.map(s => \`<option value="\${s}">\${s}</option>\`).join('');

      document.getElementById('modal-feedback').style.display = 'none';
      document.getElementById('order-modal-backdrop').classList.add('open');
    }

    function closeOrderModal() {
      document.getElementById('order-modal-backdrop').classList.remove('open');
    }

    function handleBackdropClick(e) {
      if (e.target.id === 'order-modal-backdrop') {
        closeOrderModal();
      }
    }

    async function submitOrder(e) {
      e.preventDefault();
      if (!activeProduct) return;

      const payload = {
        productId: activeProduct.id,
        customerName: document.getElementById('modal-customer-name').value,
        customerEmail: document.getElementById('modal-customer-email').value,
        size: document.getElementById('modal-size-select').value,
        genderCut: document.getElementById('modal-cut-select').value,
        shippingAddress: {
          address: document.getElementById('modal-shipping-address').value
        }
      };

      const fb = document.getElementById('modal-feedback');
      fb.style.display = 'block';
      fb.style.background = 'rgba(16, 185, 129, 0.2)';
      fb.style.color = '#86F94A';
      fb.style.border = '1px solid #10B981';
      fb.innerHTML = '<strong>Order Dispatched!</strong> Tracking #QOS-FLIGHT-' + Math.floor(100000 + Math.random()*900000) + ' confirmed. Confirmation sent to email.';

      currentXp += Math.round(activeProduct.priceCents / 10);
      document.getElementById('user-xp-display').textContent = currentXp.toLocaleString() + ' XP';

      setTimeout(() => {
        closeOrderModal();
      }, 2200);
    }

    function submitPointsRedemption() {
      if (!activeProduct) return;
      const fb = document.getElementById('modal-feedback');
      fb.style.display = 'block';

      if (currentXp < activeProduct.pointsCost) {
        fb.style.background = 'rgba(239, 68, 68, 0.2)';
        fb.style.color = '#FCA5A5';
        fb.style.border = '1px solid #EF4444';
        fb.innerHTML = '<strong>Insufficient Flight XP.</strong> You need ' + activeProduct.pointsCost.toLocaleString() + ' XP (Current: ' + currentXp.toLocaleString() + ' XP). Complete pre-flight checks to earn points!';
        return;
      }

      currentXp -= activeProduct.pointsCost;
      document.getElementById('user-xp-display').textContent = currentXp.toLocaleString() + ' XP';

      fb.style.background = 'rgba(16, 185, 129, 0.2)';
      fb.style.color = '#86F94A';
      fb.style.border = '1px solid #10B981';
      fb.innerHTML = '<strong>XP Redemption Confirmed!</strong> ' + activeProduct.pointsCost.toLocaleString() + ' Flight XP redeemed. Order dispatched to your flight locker.';

      setTimeout(() => {
        closeOrderModal();
      }, 2200);
    }

    function claimDailyReward() {
      const btn = document.getElementById('btn-daily-xp');
      currentXp += 100;
      currentTickets += 1;
      document.getElementById('user-xp-display').textContent = currentXp.toLocaleString() + ' XP';
      document.getElementById('user-tickets-display').textContent = currentTickets + ' Tickets';
      btn.textContent = '✓ Claimed (+100 XP & 1 Ticket)';
      btn.style.background = '#10B981';
      btn.disabled = true;
    }

    function enterRaffleAction(raffleId) {
      currentTickets += 1;
      document.getElementById('user-tickets-display').textContent = currentTickets + ' Tickets';
      alert('🎟️ Ticket Entered! Your ticket #TKT-' + Math.floor(100000 + Math.random()*900000) + ' has been entered into the drawing.');
    }

    function joinTournamentAction(tournamentId) {
      alert('🏆 Tournament Registration Confirmed! You are registered for the CME CF BRTI 60s Dispersion Cup. Head over to /radar to start your calibration series ($0.00 capital deployed).');
    }
  </script>
</body>
</html>
`;
}
