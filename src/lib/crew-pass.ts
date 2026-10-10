/**
 * QuanterraOS Free Crew Pass & Spacecraft Council System
 *
 * Implements:
 * - Free account-bound server entitlement (no wallet required, no gas, no mint).
 * - Spacecraft Council roster (Quanta, Aria, Atlas, Lyra, Orion, Vela).
 * - 6 Cosmetic Art Variants (Genesis, Liquid Chrome, Graffiti Pop, Cosmic Crystal, Neon Mecha, 2D Anime).
 * - Zero financialized promises: cosmetics are strictly visual, never tied to trade volume, losses, or profits.
 * - Interactive claim, skin selector, and responsive public showcase pages.
 */

import { randomUUID } from "node:crypto";
import { db } from "../db.ts";
import { crewPasses } from "../schema.ts";
import { eq } from "drizzle-orm";
import { renderPublicHeader, renderPublicFooter, PUBLIC_LAYOUT_CSS } from "../components/public-layout.ts";

export interface CouncilOfficer {
  id: string;
  name: string;
  title: string;
  functionalStation: string;
  visualIdentity: string;
  cosmeticReward: string;
  description: string;
  image: string;
}

export const COUNCIL_OFFICERS: CouncilOfficer[] = [
  {
    id: "quanta",
    name: "Quanta",
    title: "Flight Deck Pilot",
    functionalStation: "Neutral Cost Guardian",
    visualIdentity: "Ceramic white suit, purple accents, glossy black visor, paired equal green up-arrow and pink down-arrow eyes",
    cosmeticReward: "Genesis Pilot Suit",
    description: "Reveals execution drag, spreads, and fee schedules. The paired arrows represent two possible directions, never a recommendation. Users choose their own side.",
    image: "/assets/hero-flight-deck.png"
  },
  {
    id: "aria",
    name: "Aria",
    title: "Chief Navigator",
    functionalStation: "Concierge & Navigation",
    visualIdentity: "Pearl & lavender android chassis with cyan atmospheric halo",
    cosmeticReward: "Navigation Trim",
    description: "Guides ship stations and routes cross-venue market queries with zero directional bias.",
    image: "/assets/council-concepts.png"
  },
  {
    id: "atlas",
    name: "Atlas",
    title: "Lead Engineer",
    functionalStation: "Fee Engineering",
    visualIdentity: "Graphite armor, amber reactor vents, geometric hexagon eyes",
    cosmeticReward: "Engine-Room Skin",
    description: "Monitors exchange taker curves and parabolic fee formulas to calculate instantaneous Maker/Taker spread savings.",
    image: "/assets/council-concepts.png"
  },
  {
    id: "lyra",
    name: "Lyra",
    title: "Settlement Specialist",
    functionalStation: "Settlement Science",
    visualIdentity: "Deep teal flight suit with astral star-map motifs and chronometer HUD",
    cosmeticReward: "Radar Trail",
    description: "Tracks CME CF BRTI 60-second TWAP window averaging and constituent exchange basis divergence.",
    image: "/assets/council-concepts.png"
  },
  {
    id: "orion",
    name: "Orion",
    title: "Calibration Officer",
    functionalStation: "Probabilistic Calibration",
    visualIdentity: "Silver & cobalt exoskeleton with concentric probability-ring eyes",
    cosmeticReward: "Observatory Skin",
    description: "Audits empirical Brier scores and decomposes forecast reliability, resolution, and uncertainty.",
    image: "/assets/council-concepts.png"
  },
  {
    id: "vela",
    name: "Vela",
    title: "Mission Archivist",
    functionalStation: "Mission Journal",
    visualIdentity: "Coral & violet tunic with holographic archival tablet",
    cosmeticReward: "Logbook Theme",
    description: "Maintains immutable mission thesis logs, pre-flight checklists, and anti-tilt cool-down records.",
    image: "/assets/council-concepts.png"
  }
];

export interface QuantaSkinOption {
  id: string;
  name: string;
  style: string;
  description: string;
  image: string;
}

export const QUANTA_SKINS: QuantaSkinOption[] = [
  {
    id: "genesis",
    name: "Genesis Ceramic",
    style: "Flight Deck Pilot Standard",
    description: "Glossy black visor with green up-arrow & pink down-arrow eyes, purple suit accents, and balanced YES/NO coins.",
    image: "/assets/hero-flight-deck.png"
  },
  {
    id: "liquid_chrome",
    name: "Liquid Chrome",
    style: "Reflective Metallic Specular",
    description: "Polished liquid chrome chassis reflecting deep space nebulae with glowing cyan/violet optic telemetry.",
    image: "/assets/quanta-liquid-chrome.png"
  },
  {
    id: "graffiti_pop",
    name: "Graffiti Pop",
    style: "Urban Cyberpunk Street Art",
    description: "Vibrant spray-painted stencils, dripping neon overlays, and high-contrast street art typography.",
    image: "/assets/quanta-graffiti-pop.png"
  },
  {
    id: "cosmic_crystal",
    name: "Cosmic Crystal",
    style: "Prismatic Faceted Quartz",
    description: "Translucent crystalline facets refracting internal light spectra into iridescent rainbow caustic patterns.",
    image: "/assets/quanta-cosmic-crystal.png"
  },
  {
    id: "neon_mecha",
    name: "Neon Mecha",
    style: "Heavy Industrial Exoskeleton",
    description: "Reinforced titanium plating, exposed hydraulic servos, and radiant ultraviolet hazard striping.",
    image: "/assets/quanta-neon-mecha.png"
  },
  {
    id: "anime_2d",
    name: "2D Cel Anime",
    style: "Retro Sci-Fi Cel Animation",
    description: "Hand-inked line art, rich cel shading, and classic 90s space anime cockpit aesthetic.",
    image: "/assets/quanta-2d-anime.png"
  },
  {
    id: "kalshi_destroyer",
    name: "Kalshi Destroyer",
    style: "Odds Defender (Emerald/White)",
    description: "Emerald and white armored flight champion with balanced YES/NO tokens and paired arrow eyes. Dedicated to Kalshi cost clarity.",
    image: "/assets/kalshi-destroyer.png"
  },
  {
    id: "polymarket_terminator",
    name: "Polymarket Terminator",
    style: "Odds Defender (Cobalt/Chrome)",
    description: "Cobalt and chrome orbital pilot with balanced YES/NO tokens and paired arrow eyes. Dedicated to Polymarket fee & resolution transparency.",
    image: "/assets/polymarket-terminator.png"
  }
];

export interface CrewPassRecord {
  id: string;
  userId: string;
  passTier: string;
  selectedSkin: string;
  unlockedSkins: string[];
  claimedAt: string;
  updatedAt: string;
}

/**
 * Claim or retrieve the Free Crew Pass for an account.
 * Server-entitled, zero wallet requirement, free forever.
 */
export function claimCrewPass(userId: string): CrewPassRecord {
  const existing = db.select().from(crewPasses).where(eq(crewPasses.userId, userId)).get();
  if (existing) {
    let unlockedSkins: string[] = [];
    try {
      unlockedSkins = JSON.parse(existing.unlockedSkinsJson);
    } catch {
      unlockedSkins = ["genesis", "liquid_chrome", "graffiti_pop", "cosmic_crystal", "neon_mecha", "anime_2d"];
    }
    return {
      id: existing.id,
      userId: existing.userId,
      passTier: existing.passTier,
      selectedSkin: existing.selectedSkin,
      unlockedSkins,
      claimedAt: existing.claimedAt,
      updatedAt: existing.updatedAt,
    };
  }

  const now = new Date().toISOString();
  const unlocked = ["genesis", "liquid_chrome", "graffiti_pop", "cosmic_crystal", "neon_mecha", "anime_2d"];
  const newPass = {
    id: randomUUID(),
    userId,
    passTier: "free_crew_pass",
    selectedSkin: "genesis",
    unlockedSkinsJson: JSON.stringify(unlocked),
    claimedAt: now,
    updatedAt: now,
  };

  db.insert(crewPasses).values(newPass).run();

  return {
    id: newPass.id,
    userId: newPass.userId,
    passTier: newPass.passTier,
    selectedSkin: newPass.selectedSkin,
    unlockedSkins: unlocked,
    claimedAt: now,
    updatedAt: now,
  };
}

/**
 * Get crew pass for a user if it exists.
 */
export function getUserCrewPass(userId: string): CrewPassRecord | null {
  const row = db.select().from(crewPasses).where(eq(crewPasses.userId, userId)).get();
  if (!row) return null;
  let unlockedSkins: string[] = [];
  try {
    unlockedSkins = JSON.parse(row.unlockedSkinsJson);
  } catch {
    unlockedSkins = ["genesis"];
  }
  return {
    id: row.id,
    userId: row.userId,
    passTier: row.passTier,
    selectedSkin: row.selectedSkin,
    unlockedSkins,
    claimedAt: row.claimedAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Update active cosmetic skin.
 */
export function selectPassSkin(userId: string, skinId: string): { success: boolean; skinId: string } {
  const pass = getUserCrewPass(userId);
  if (!pass) {
    throw new Error("No Crew Pass found for this account. Claim your free pass first.");
  }
  const valid = QUANTA_SKINS.some(s => s.id === skinId);
  if (!valid) {
    throw new Error("Invalid skin ID specified.");
  }
  const now = new Date().toISOString();
  db.update(crewPasses)
    .set({ selectedSkin: skinId, updatedAt: now })
    .where(eq(crewPasses.userId, userId))
    .run();
  return { success: true, skinId };
}

// ---------------------------------------------------------------------------
// HTML Page Renderers
// ---------------------------------------------------------------------------

/**
 * Renders /crew showcase page.
 */
export function renderCrewShowcasePageHtml(user?: { email?: string; tier?: string } | null, pass?: CrewPassRecord | null): string {
  const officersHtml = COUNCIL_OFFICERS.map((officer) => `
    <div class="officer-card">
      <div class="officer-badge">${officer.functionalStation}</div>
      <h3 class="officer-name">${officer.name}</h3>
      <div class="officer-title">${officer.title}</div>
      <p class="officer-desc">${officer.description}</p>
      <div class="officer-visual">
        <span class="visual-label">Visual ID:</span>
        <span class="visual-val">${officer.visualIdentity}</span>
      </div>
      <div class="officer-reward">
        <span class="reward-tag">Cosmetic Reward:</span>
        <strong style="color:var(--public-accent-purple);">${officer.cosmeticReward}</strong>
      </div>
    </div>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Spacecraft Council &amp; Flight Crew — QuanterraOS</title>
  <meta name="description" content="Meet the Spacecraft Council officers and discover your Flight Deck crew. Unlock free cosmetic pilot passes without crypto wallets.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #080B18; color: #F4F5FF; font-family: var(--public-font-sans); margin: 0; }
    .page-wrap { max-width: 1200px; margin: 0 auto; padding: 48px 24px 80px; }
    .hero-banner { text-align: center; margin-bottom: 48px; }
    .hero-eyebrow { font-family: var(--public-font-mono); font-size: 0.78rem; color: var(--public-accent-purple); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }
    .hero-title { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 800; margin: 0 0 16px; color: #FFFFFF; }
    .hero-desc { font-size: 1.05rem; color: var(--public-muted); max-width: 720px; margin: 0 auto 28px; line-height: 1.6; }
    .council-banner-img { width: 100%; max-width: 960px; height: auto; border-radius: 16px; border: 1px solid rgba(148, 104, 255, 0.3); box-shadow: 0 16px 40px rgba(0,0,0,0.6); margin-bottom: 40px; }
    
    .officers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 56px; }
    .officer-card { background: rgba(18, 23, 43, 0.8); border: 1px solid rgba(175, 182, 206, 0.15); border-radius: 14px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; }
    .officer-badge { font-family: var(--public-font-mono); font-size: 0.72rem; color: var(--public-accent-cyan); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
    .officer-name { font-size: 1.4rem; font-weight: 700; color: #FFFFFF; margin: 0 0 4px; }
    .officer-title { font-family: var(--public-font-mono); font-size: 0.8rem; color: var(--public-muted); margin-bottom: 12px; }
    .officer-desc { font-size: 0.88rem; color: #CBD5E1; line-height: 1.5; margin-bottom: 16px; }
    .officer-visual { font-size: 0.78rem; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px; margin-bottom: 12px; color: #94A3B8; }
    .visual-label { color: var(--public-accent-purple); font-weight: 600; display: block; margin-bottom: 2px; }
    .officer-reward { font-size: 0.8rem; font-family: var(--public-font-mono); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; }

    .cta-banner { background: linear-gradient(135deg, rgba(148, 104, 255, 0.15) 0%, rgba(89, 221, 236, 0.15) 100%); border: 1px solid rgba(148, 104, 255, 0.35); border-radius: 16px; padding: 36px; text-align: center; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/crew", user })}
  <div class="page-wrap">
    <div class="hero-banner">
      <div class="hero-eyebrow">FLIGHT CREW // SPACECRAFT COUNCIL</div>
      <h1 class="hero-title">Meet Your Flight Deck Officers</h1>
      <p class="hero-desc">
        Fictional station officers representing key disciplines across prediction market analytics. Lead with Flight Deck Pilot Quanta, our neutral cost guardian who reveals fees, spreads, and assumptions without taking a side.
      </p>
      <img src="/assets/council-concepts.png" alt="Spacecraft Council Concept Sheet" class="council-banner-img">
    </div>

    <div class="officers-grid">
      ${officersHtml}
    </div>

    <div class="cta-banner">
      <h2 style="font-size:1.8rem; font-weight:800; margin:0 0 12px; color:#FFF;">Claim Your Free Crew Pass</h2>
      <p style="color:var(--public-muted); font-size:0.95rem; max-width:600px; margin:0 auto 20px; line-height:1.5;">
        Account-bound server entitlement. No wallet connection, no gas fees, and no financial risk. Unlock collectible pilot cosmetics across the Flight Deck.
      </p>
      <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
        <a href="/pass" class="flight-btn-freecheck" style="background:var(--public-accent-purple); color:#FFF; padding:12px 28px; font-size:0.95rem;">Claim Free Pass &rarr;</a>
        <a href="/art-gallery" class="flight-btn-signin" style="border:1px solid rgba(255,255,255,0.15); padding:12px 24px; font-size:0.95rem;">Explore The 144 Gallery &rarr;</a>
      </div>
    </div>
  </div>
  ${renderPublicFooter()}
</body>
</html>`;
}

/**
 * Renders /pass Free Crew Pass claim page.
 */
export function renderCrewPassClaimPageHtml(user?: { email?: string; tier?: string } | null, pass?: CrewPassRecord | null): string {
  const isClaimed = Boolean(pass);
  const selectedSkinId = pass?.selectedSkin || "genesis";

  const skinsSelectorHtml = QUANTA_SKINS.map((skin) => `
    <div class="skin-card ${skin.id === selectedSkinId ? 'active' : ''}" id="skin-card-${skin.id}">
      <img src="${skin.image}" alt="${skin.name}" class="skin-thumb">
      <div class="skin-info">
        <div class="skin-title">${skin.name}</div>
        <div class="skin-style">${skin.style}</div>
        <p class="skin-desc">${skin.description}</p>
        <button type="button" class="btn-skin-select ${skin.id === selectedSkinId ? 'selected' : ''}" onclick="selectSkin('${skin.id}')">
          ${skin.id === selectedSkinId ? '✓ Active Skin' : 'Equip Skin'}
        </button>
      </div>
    </div>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Free Crew Pass &bull; QuanterraOS</title>
  <meta name="description" content="Claim your Free Crew Pass. Unlock all 6 Flight Deck pilot cosmetic skins with zero wallet requirements.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #080B18; color: #F4F5FF; font-family: var(--public-font-sans); margin: 0; }
    .page-wrap { max-width: 1100px; margin: 0 auto; padding: 48px 24px 80px; }
    .pass-hero { text-align: center; margin-bottom: 40px; }
    .pass-tag { font-family: var(--public-font-mono); font-size: 0.78rem; color: var(--public-accent-purple); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 12px; }
    .pass-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; color: #FFFFFF; margin: 0 0 14px; }
    .pass-subtitle { font-size: 1.05rem; color: var(--public-muted); max-width: 680px; margin: 0 auto; line-height: 1.6; }

    .claim-box { background: rgba(18, 23, 43, 0.9); border: 1px solid rgba(148, 104, 255, 0.4); border-radius: 16px; padding: 32px; text-align: center; max-width: 680px; margin: 0 auto 48px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; font-family: var(--public-font-mono); font-size: 0.8rem; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px; }
    .status-badge.claimed { background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; color: #10B981; }
    .status-badge.unclaimed { background: rgba(148, 104, 255, 0.15); border: 1px solid var(--public-accent-purple); color: var(--public-accent-purple); }

    .btn-claim-action { background: linear-gradient(135deg, #9468FF 0%, #7B42FF 100%); color: #FFF; font-family: var(--public-font-mono); font-weight: 700; font-size: 1rem; padding: 14px 32px; border-radius: 28px; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 18px rgba(148, 104, 255, 0.4); }
    .btn-claim-action:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(148, 104, 255, 0.6); }

    .skins-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .skin-card { background: rgba(18, 23, 43, 0.7); border: 1px solid rgba(175, 182, 206, 0.15); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: all 0.2s; }
    .skin-card.active { border-color: var(--public-accent-purple); box-shadow: 0 0 20px rgba(148, 104, 255, 0.3); }
    .skin-thumb { width: 100%; height: 260px; object-fit: cover; background: #05070D; }
    .skin-info { padding: 18px; display: flex; flex-direction: column; flex: 1; justify-content: space-between; }
    .skin-title { font-size: 1.15rem; font-weight: 700; color: #FFF; margin-bottom: 4px; }
    .skin-style { font-family: var(--public-font-mono); font-size: 0.74rem; color: var(--public-accent-cyan); margin-bottom: 8px; }
    .skin-desc { font-size: 0.82rem; color: #94A3B8; line-height: 1.5; margin-bottom: 16px; }
    .btn-skin-select { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #FFF; font-family: var(--public-font-mono); font-size: 0.78rem; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
    .btn-skin-select:hover { background: rgba(148, 104, 255, 0.25); border-color: var(--public-accent-purple); }
    .btn-skin-select.selected { background: var(--public-accent-purple); border-color: var(--public-accent-purple); font-weight: 700; }

    .terms-box { margin-top: 48px; padding: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.78rem; color: #64748B; line-height: 1.6; text-align: center; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/crew", user })}
  <div class="page-wrap">
    <div class="pass-hero">
      <div class="pass-tag">ACCOUNT ENTITLEMENT // COSMETIC REWARDS</div>
      <h1 class="pass-title">Free Crew Pass</h1>
      <p class="pass-subtitle">
        Equip all 6 Flight Deck pilot cosmetic skins. Server-entitled to your QuanterraOS account with zero wallet requirement, no transaction fees, and no financial risk.
      </p>
    </div>

    <div class="claim-box">
      ${isClaimed ? `
        <div class="status-badge claimed">
          <span>✓</span>
          <span>PASS ACTIVE &bull; FREE CREW ENTITLEMENT UNLOCKED</span>
        </div>
        <p style="font-size:0.9rem; color:#CBD5E1; margin:0 0 16px;">
          Your Free Crew Pass is active! Select your active pilot skin below to customize your Flight Deck cockpit and receipt card headers.
        </p>
      ` : `
        <div class="status-badge unclaimed">
          <span>●</span>
          <span>PASS READY TO CLAIM &bull; 100% FREE</span>
        </div>
        <p style="font-size:0.9rem; color:#CBD5E1; margin:0 0 20px;">
          Claim your free pass in 1 click. Zero crypto wallet required. Cosmetic pilot skins are instantly added to your account.
        </p>
        <button type="button" class="btn-claim-action" onclick="claimPass()">Claim Free Crew Pass &rarr;</button>
      `}
    </div>

    <h2 style="font-size:1.5rem; font-weight:800; color:#FFF; margin-bottom:20px;">Available Quanta Pilot Skins</h2>
    <div class="skins-grid">
      ${skinsSelectorHtml}
    </div>

    <div class="terms-box">
      <strong>Cosmetic Pass Terms &amp; Disclosure:</strong> The Free Crew Pass and cosmetic artwork skins are strictly aesthetic UI enhancements. They do not constitute company equity, governance voting authority, revenue sharing, trade execution priority, or investment products. Cosmetic rewards are never based on trade count, dollar volume, deposited funds, profits, or losses.
    </div>
  </div>
  ${renderPublicFooter()}

  <script>
    async function claimPass() {
      try {
        const res = await fetch('/api/pass/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.error || 'Failed to claim Crew Pass.');
        }
      } catch (err) {
        alert('Network error claiming Crew Pass.');
      }
    }

    async function selectSkin(skinId) {
      try {
        const res = await fetch('/api/pass/skin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skinId })
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.error || 'Failed to equip skin.');
        }
      } catch (err) {
        alert('Network error selecting skin.');
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Renders /art-gallery high-res artwork showcase page.
 */
export function renderArtGalleryPageHtml(user?: { email?: string; tier?: string } | null): string {
  const galleryItems = [
    { title: "Flight Deck Pilot Quanta", style: "Canonical Genesis Artwork", img: "/assets/hero-flight-deck.png" },
    { title: "Spacecraft Council Roster", style: "Concept Sheet (6 Officers)", img: "/assets/council-concepts.png" },
    { title: "Quanta: Liquid Chrome", style: "Specular Nebula Reflection", img: "/assets/quanta-liquid-chrome.png" },
    { title: "Quanta: Graffiti Pop", style: "Street Art Neon Stencil", img: "/assets/quanta-graffiti-pop.png" },
    { title: "Quanta: Cosmic Crystal", style: "Prismatic Faceted Quartz", img: "/assets/quanta-cosmic-crystal.png" },
    { title: "Quanta: Neon Mecha", style: "Titanium Exoskeleton", img: "/assets/quanta-neon-mecha.png" },
    { title: "Quanta: 2D Cel Anime", style: "Retro Sci-Fi Animation", img: "/assets/quanta-2d-anime.png" },
    { title: "Flight Receipt Campaign", style: "1080x1350 Share Format", img: "/assets/campaign-receipt.png" }
  ];

  const galleryHtml = galleryItems.map((item) => `
    <div class="art-card">
      <img src="${item.img}" alt="${item.title}" class="art-img">
      <div class="art-meta">
        <h3 class="art-title">${item.title}</h3>
        <div class="art-style">${item.style}</div>
        <a href="${item.img}" target="_blank" class="art-link">View Full Resolution &rarr;</a>
      </div>
    </div>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Official Artwork Gallery &bull; QuanterraOS</title>
  <meta name="description" content="Explore official artwork variants of Flight Deck Pilot Quanta and the Spacecraft Council.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #080B18; color: #F4F5FF; font-family: var(--public-font-sans); margin: 0; }
    .page-wrap { max-width: 1200px; margin: 0 auto; padding: 48px 24px 80px; }
    .gallery-hero { text-align: center; margin-bottom: 48px; }
    .gallery-eyebrow { font-family: var(--public-font-mono); font-size: 0.78rem; color: var(--public-accent-purple); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }
    .gallery-title { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 800; color: #FFFFFF; margin: 0 0 16px; }
    .gallery-desc { font-size: 1.05rem; color: var(--public-muted); max-width: 720px; margin: 0 auto; line-height: 1.6; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 28px; }
    .art-card { background: rgba(18, 23, 43, 0.8); border: 1px solid rgba(175, 182, 206, 0.15); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
    .art-img { width: 100%; height: 320px; object-fit: cover; background: #05070D; }
    .art-meta { padding: 18px; display: flex; flex-direction: column; flex: 1; justify-content: space-between; }
    .art-title { font-size: 1.15rem; font-weight: 700; color: #FFF; margin: 0 0 4px; }
    .art-style { font-family: var(--public-font-mono); font-size: 0.75rem; color: var(--public-accent-cyan); margin-bottom: 12px; }
    .art-link { color: var(--public-accent-purple); font-family: var(--public-font-mono); font-size: 0.78rem; text-decoration: none; font-weight: 600; }
    .art-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/crew", user })}
  <div class="page-wrap">
    <div class="gallery-hero">
      <div class="gallery-eyebrow">CREATIVE DIRECTION // CAMPAIGN ASSETS</div>
      <h1 class="gallery-title">Official Artwork Gallery</h1>
      <p class="gallery-desc">
        All five campaign artwork styles for Flight Deck Pilot Quanta, the Spacecraft Council concept sheet, and shareable receipt templates.
      </p>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
  </div>
  ${renderPublicFooter()}
</body>
</html>`;
}
