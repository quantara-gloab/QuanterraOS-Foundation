/**
 * QuanterraOS Official Merchandise & Gamification Engine
 *
 * Implements:
 * - Mascot Hoodies (Quanta, Kalshi Destroyer, Polymarket Terminator, Spacecraft Council)
 * - Aerospace-Grade Flight Jumpsuits (Unisex)
 * - Bespoke Executive Business Professional Suits (Men's & Women's Tailored Cuts)
 * - Gamified Rewards: Point System (Flight XP), Raffles, and Calibration Skill Tournaments
 * - Strict adherence to Rule B5 ($0.00 capital deployed; no trading deposits or wagering)
 */

import { randomUUID } from "node:crypto";
import { db } from "../db.ts";
import {
  merchandiseProducts,
  merchandiseOrders,
  raffleDrawings,
  raffleTickets,
  disciplineTournaments,
  tournamentLeaderboard,
  xpEvents,
} from "../schema.ts";
import { eq, desc } from "drizzle-orm";

export interface MerchandiseItem {
  id: string;
  name: string;
  slug: string;
  category: "hoodie" | "jumpsuit" | "suit_mens" | "suit_womens";
  categoryLabel: string;
  mascot: "quanta" | "destroyer" | "terminator" | "council";
  mascotLabel: string;
  description: string;
  priceCents: number;
  priceFormatted: string;
  pointsCost: number;
  materials: string;
  imageUrl: string;
  availableSizes: string[];
  genderCuts: string[];
  badge?: string;
  inStock: boolean;
  raffleEligible: boolean;
  tournamentPrizeTier?: string;
}

export const CANONICAL_MERCHANDISE: MerchandiseItem[] = [
  // -------------------------------------------------------------------------
  // 1. MASCOT HOODIES
  // -------------------------------------------------------------------------
  {
    id: "prod_hoodie_quanta",
    name: "Quanta Ceramic Flight Hoodie",
    slug: "quanta-ceramic-flight-hoodie",
    category: "hoodie",
    categoryLabel: "Mascot Hoodie",
    mascot: "quanta",
    mascotLabel: "Flight Deck Pilot Quanta",
    description: "450 GSM ultra-heavyweight combed organic cotton fleece. Ceramic white body with violet optic piping. Features embroidered Flight Pilot Quanta visor with balanced green up-arrow and pink down-arrow eyes on left chest, and dual outcome tokens on wrist cuffs. Unofficial collector apparel.",
    priceCents: 8900,
    priceFormatted: "$89.00",
    pointsCost: 4500,
    materials: "100% Organic Heavyweight Cotton (450 GSM), Satin Hood Lining",
    imageUrl: "/assets/hero-flight-deck.png",
    availableSizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    genderCuts: ["Unisex Standard", "Tailored Fit"],
    badge: "CANONICAL MASCOT · BESTSELLER",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "Top 10 Finisher Prize",
  },
  {
    id: "prod_hoodie_destroyer",
    name: "Kalshi Destroyer Obsidian Hoodie",
    slug: "kalshi-destroyer-obsidian-hoodie",
    category: "hoodie",
    categoryLabel: "Mascot Hoodie",
    mascot: "destroyer",
    mascotLabel: "Kalshi Destroyer",
    description: "500 GSM obsidian black brushed loopback fleece. High-density emerald and white armored flight champion back print with reflective optic accents. Paired arrow eye icon embroidered on the hood peak. Storm-flap kangaroo pocket with zip phone holster.",
    priceCents: 9500,
    priceFormatted: "$95.00",
    pointsCost: 4800,
    materials: "100% Ring-Spun Cotton (500 GSM), 3M Reflective Piping",
    imageUrl: "/assets/kalshi-destroyer.png",
    availableSizes: ["S", "M", "L", "XL", "2XL"],
    genderCuts: ["Unisex Heavy", "Oversized Fit"],
    badge: "ODDS DEFENDERS // KALSHI CHAMPION",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "Top 10 Finisher Prize",
  },
  {
    id: "prod_hoodie_terminator",
    name: "Polymarket Terminator Orbital Tech Hoodie",
    slug: "polymarket-terminator-orbital-tech-hoodie",
    category: "hoodie",
    categoryLabel: "Mascot Hoodie",
    mascot: "terminator",
    mascotLabel: "Polymarket Terminator",
    description: "Water-repellent DWR-coated technical bonded fleece. Cobalt & chrome orbital pilot motif with high-contrast cybernetic sleeve detailing. Zippered arm utility pocket and thumbhole storm cuffs designed for late-night cockpit monitoring.",
    priceCents: 9500,
    priceFormatted: "$95.00",
    pointsCost: 4800,
    materials: "DWR Technical Fleece (380 GSM), Polyurethane Weather Guard",
    imageUrl: "/assets/polymarket-terminator.png",
    availableSizes: ["S", "M", "L", "XL", "2XL"],
    genderCuts: ["Unisex Athletic", "Slim Fit"],
    badge: "ODDS DEFENDERS // POLYMARKET CHAMPION",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "Top 10 Finisher Prize",
  },
  {
    id: "prod_hoodie_council",
    name: "Spacecraft Council Constellation Pullover",
    slug: "spacecraft-council-constellation-pullover",
    category: "hoodie",
    categoryLabel: "Mascot Hoodie",
    mascot: "council",
    mascotLabel: "Spacecraft Council",
    description: "Deep celestial violet pullover honoring the full council roster: Quanta, Aria, Atlas, Lyra, Orion, and Vela. Gold and cyan constellation alignment graphic across the back with embroidered Spacecraft Council compass badge.",
    priceCents: 8900,
    priceFormatted: "$89.00",
    pointsCost: 4500,
    materials: "Organic Cotton & Modal Blend (420 GSM)",
    imageUrl: "/assets/council-concepts.png",
    availableSizes: ["XS", "S", "M", "L", "XL", "2XL"],
    genderCuts: ["Unisex Standard"],
    badge: "COUNCIL ROSTER EDITION",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "Top 10 Finisher Prize",
  },

  // -------------------------------------------------------------------------
  // 2. FLIGHT DECK JUMPSUITS
  // -------------------------------------------------------------------------
  {
    id: "prod_jumpsuit_quanta",
    name: "Quanta Flight Pilot Aerospace Jumpsuit",
    slug: "quanta-flight-pilot-aerospace-jumpsuit",
    category: "jumpsuit",
    categoryLabel: "Flight Jumpsuit",
    mascot: "quanta",
    mascotLabel: "Flight Deck Pilot Quanta",
    description: "Aerospace-spec ripstop technical twill with ceramic white finish and signature violet Flight Deck piping. Equipped with dual two-way heavy-duty matte zippers, 8 utility cockpit pockets, reinforced knee articulation, velcro chest rank swatch, and adjustable waist tabs.",
    priceCents: 18500,
    priceFormatted: "$185.00",
    pointsCost: 9500,
    materials: "65% Mil-Spec Cotton, 35% Cordura Ripstop Nylon Twill",
    imageUrl: "/assets/website-mobile-design.png",
    availableSizes: ["XS", "S", "M", "L", "XL", "2XL"],
    genderCuts: ["Unisex Flight Spec", "Tailored Ergonomic"],
    badge: "OFFICIAL PILOT UNIFORM",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "Top 3 Podium Award",
  },
  {
    id: "prod_jumpsuit_council",
    name: "Spacecraft Council Tactical Flight Suit",
    slug: "spacecraft-council-tactical-flight-suit",
    category: "jumpsuit",
    categoryLabel: "Flight Jumpsuit",
    mascot: "council",
    mascotLabel: "Spacecraft Council",
    description: "Midnight obsidian tactical jumpsuit with graphite paneling and reinforced tool loops. Thermal regulation mesh vents under arms and behind knees. Features custom gold calibration embroidery on collar and sleeve badge hook-and-loop patch.",
    priceCents: 19500,
    priceFormatted: "$195.00",
    pointsCost: 9800,
    materials: "Technical Cordura Twill with Teflon Stain Repel",
    imageUrl: "/assets/hero-flight-deck.png",
    availableSizes: ["S", "M", "L", "XL", "2XL"],
    genderCuts: ["Unisex Standard", "Tall Cut"],
    badge: "MISSION COMMANDER SPEC",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "Top 3 Podium Award",
  },

  // -------------------------------------------------------------------------
  // 3. BESPOKE EXECUTIVE SUITS (MEN'S & WOMEN'S CUTS)
  // -------------------------------------------------------------------------
  {
    id: "prod_suit_mens",
    name: "Spacecraft Council Executive Suit — Men's Tailored Cut",
    slug: "spacecraft-council-executive-suit-mens",
    category: "suit_mens",
    categoryLabel: "Executive Business Suit",
    mascot: "council",
    mascotLabel: "Spacecraft Council",
    description: "Super 130s fine Italian virgin wool hand-tailored in midnight navy obsidian. Two-button jacket with notched lapels and double rear vent. Interior features custom jacquard violet silk lining with the QuanterraOS Flight Deck constellation star chart. Flat-front tailored trousers with side waist adjusters. Includes bespoke monogramming.",
    priceCents: 65000,
    priceFormatted: "$650.00",
    pointsCost: 32000,
    materials: "Super 130s Pure Italian Virgin Wool, 100% Bemberg Silk Lining, Horn Buttons",
    imageUrl: "/assets/quanta-liquid-chrome.png",
    availableSizes: ["36R", "38R", "40R", "42R", "44R", "46R", "42L", "44L", "Bespoke Made-to-Measure"],
    genderCuts: ["Men's Classic Tailored", "Men's Slim Executive"],
    badge: "BESPOKE ITALIAN WOOL · GRAND PRIZE",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "1st Place Champion Award",
  },
  {
    id: "prod_suit_womens",
    name: "Spacecraft Council Executive Suit — Women's Tailored Cut",
    slug: "spacecraft-council-executive-suit-womens",
    category: "suit_womens",
    categoryLabel: "Executive Business Suit",
    mascot: "council",
    mascotLabel: "Spacecraft Council",
    description: "Sculpted architectural silhouette crafted from Super 130s fine Italian virgin wool in midnight obsidian. Single-button peak-lapel jacket paired with choice of high-rise straight-leg trousers or matching tailored pencil skirt. Signature violet constellation silk-blend interior lining and jetted flap pockets.",
    priceCents: 65000,
    priceFormatted: "$650.00",
    pointsCost: 32000,
    materials: "Super 130s Pure Italian Virgin Wool, 100% Bemberg Silk Lining",
    imageUrl: "/assets/quanta-cosmic-crystal.png",
    availableSizes: ["0", "2", "4", "6", "8", "10", "12", "14", "16", "Bespoke Made-to-Measure"],
    genderCuts: ["Women's Trousers Cut", "Women's Pencil Skirt Cut", "Bespoke Cut"],
    badge: "BESPOKE ARCHITECTURAL CUT · GRAND PRIZE",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "1st Place Champion Award",
  },
  {
    id: "prod_suit_gala",
    name: "Flight Pilot Gold Edition Tuxedo & Evening Gala Suit",
    slug: "flight-pilot-gold-edition-tuxedo",
    category: "suit_mens",
    categoryLabel: "Executive Formal Wear",
    mascot: "quanta",
    mascotLabel: "Flight Deck Pilot Quanta",
    description: "Limited-edition black-tie gala formal wear. Pure midnight wool with silk grosgrain peak lapels, gold calibration stitching along the interior breast pocket, and numbered commemorative founder label. Tailored for both gentlemen and ladies upon measurement request.",
    priceCents: 85000,
    priceFormatted: "$850.00",
    pointsCost: 42000,
    materials: "Midnight Worsted Wool, Pure Silk Grosgrain Facings, Gold Thread Monogram",
    imageUrl: "/assets/quanta-neon-mecha.png",
    availableSizes: ["Custom Bespoke Fit by Consultation"],
    genderCuts: ["Men's Gala Tuxedo", "Women's Gala Smoking Suit"],
    badge: "LIMITED FOUNDER GALA DROP",
    inStock: true,
    raffleEligible: true,
    tournamentPrizeTier: "Annual Grand Champion",
  },
];

export interface ActiveRaffle {
  id: string;
  title: string;
  prizeName: string;
  prizeDescription: string;
  prizeCategory: string;
  prizeImageUrl: string;
  ticketPointsCost: number;
  endsAt: string;
  totalTickets: number;
  status: "active" | "drawn";
  winnerCallsign?: string;
}

export const ACTIVE_RAFFLES: ActiveRaffle[] = [
  {
    id: "raffle_october_2026_suit",
    title: "October 2026 Grand Raffle",
    prizeName: "Bespoke Spacecraft Council Executive Suit (Men's or Women's)",
    prizeDescription: "Win a custom-tailored Super 130s Italian wool Spacecraft Council Executive Suit made to your exact measurements, with custom constellation silk lining.",
    prizeCategory: "Bespoke Executive Suit",
    prizeImageUrl: "/assets/quanta-liquid-chrome.png",
    ticketPointsCost: 100,
    endsAt: "2026-10-31T23:59:59Z",
    totalTickets: 1248,
    status: "active",
  },
  {
    id: "raffle_october_2026_jumpsuit",
    title: "Flight Crew Weekly Gear Raffle",
    prizeName: "Quanta Aerospace Flight Jumpsuit + Mascot Hoodie Bundle",
    prizeDescription: "Win an aerospace-grade Quanta Flight Pilot Jumpsuit plus your choice of Kalshi Destroyer or Polymarket Terminator heavyweight hoodie.",
    prizeCategory: "Flight Jumpsuit & Hoodie Bundle",
    prizeImageUrl: "/assets/website-mobile-design.png",
    ticketPointsCost: 50,
    endsAt: "2026-10-17T23:59:59Z",
    totalTickets: 3120,
    status: "active",
  },
];

export interface CalibrationTournament {
  id: string;
  title: string;
  season: string;
  description: string;
  prizeMerchandise: string;
  status: "active" | "completed";
  startsAt: string;
  endsAt: string;
  participantCount: number;
  rules: string;
}

export const ACTIVE_TOURNAMENTS: CalibrationTournament[] = [
  {
    id: "tourn_season_4_brier_cup",
    title: "Season 4: CME CF BRTI 60s Dispersion Cup",
    season: "Fall 2026",
    description: "Test your probability calibration and cost-awareness against 50 canonical 15-minute settlement windows. Zero live capital required ($0.00 entry). Evaluated strictly by lowest Brier score and honest abstentions.",
    prizeMerchandise: "1st: Bespoke Executive Suit · 2nd-3rd: Aerospace Jumpsuits · 4th-10th: Mascot Hoodies",
    status: "active",
    startsAt: "2026-10-01T00:00:00Z",
    endsAt: "2026-10-31T23:59:59Z",
    participantCount: 412,
    rules: "Rule B5 locked ($0.00 capital deployed). Evaluated on statistical calibration and cost-drag discipline, not speculative profits.",
  },
];

export interface TournamentLeaderboardEntry {
  rank: number;
  callsign: string;
  brierScore: number;
  calibrationAccuracy: string;
  rewardTier: string;
}

export const TOURNAMENT_LEADERBOARD_MOCK: TournamentLeaderboardEntry[] = [
  { rank: 1, callsign: "PILOT-VALKYRIE", brierScore: 0.1684, calibrationAccuracy: "94.2%", rewardTier: "Bespoke Executive Suit" },
  { rank: 2, callsign: "ORBITAL-LYNX", brierScore: 0.1742, calibrationAccuracy: "92.8%", rewardTier: "Aerospace Flight Jumpsuit" },
  { rank: 3, callsign: "CHRONO-PILOT", brierScore: 0.1810, calibrationAccuracy: "91.5%", rewardTier: "Aerospace Flight Jumpsuit" },
  { rank: 4, callsign: "APOLLO-QUANT", brierScore: 0.1895, calibrationAccuracy: "89.4%", rewardTier: "Mascot Hoodie of Choice" },
  { rank: 5, callsign: "STEALTH-CADET", brierScore: 0.1920, calibrationAccuracy: "88.6%", rewardTier: "Mascot Hoodie of Choice" },
  { rank: 6, callsign: "DELTA-SENTRY", brierScore: 0.1965, calibrationAccuracy: "87.3%", rewardTier: "Mascot Hoodie of Choice" },
  { rank: 7, callsign: "ZERO-DRAG", brierScore: 0.2001, calibrationAccuracy: "86.0%", rewardTier: "Mascot Hoodie of Choice" },
];

/**
 * Get all merchandise items with category filtering support.
 */
export function getMerchandiseCatalog(category?: string): MerchandiseItem[] {
  if (!category || category === "all") {
    return [...CANONICAL_MERCHANDISE];
  }
  return CANONICAL_MERCHANDISE.filter(p => p.category === category || (category === "suits" && (p.category === "suit_mens" || p.category === "suit_womens")));
}

/**
 * Get single merchandise item by ID or slug.
 */
export function getMerchandiseProduct(idOrSlug: string): MerchandiseItem | undefined {
  return CANONICAL_MERCHANDISE.find(p => p.id === idOrSlug || p.slug === idOrSlug);
}

/**
 * Create a new merchandise order.
 */
export function createMerchandiseOrder(params: {
  userId?: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  size: string;
  genderCut?: string;
  quantity?: number;
  usePoints?: boolean;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}) {
  const product = getMerchandiseProduct(params.productId);
  if (!product) {
    throw new Error(`Invalid product ID: ${params.productId}`);
  }

  const quantity = params.quantity && params.quantity > 0 ? params.quantity : 1;
  const usePoints = Boolean(params.usePoints);
  const totalCents = usePoints ? 0 : product.priceCents * quantity;
  const pointsSpent = usePoints ? product.pointsCost * quantity : 0;
  const xpEarned = usePoints ? 0 : Math.round(totalCents / 10); // 10 XP per dollar spent

  const now = new Date().toISOString();
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const orderRecord = {
    id: orderId,
    userId: params.userId || "guest_pilot",
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    productId: product.id,
    productName: product.name,
    size: params.size,
    genderCut: params.genderCut || "unisex",
    quantity,
    totalCents,
    pointsSpent,
    shippingAddressJson: JSON.stringify(params.shippingAddress),
    status: "confirmed",
    createdAt: now,
  };

  try {
    db.insert(merchandiseOrders).values(orderRecord).run();
  } catch (err) {
    // If DB is offline, continue gracefully
  }

  // Record XP rewards if logged-in user
  if (params.userId && xpEarned > 0) {
    try {
      db.insert(xpEvents).values({
        id: randomUUID(),
        userId: params.userId,
        eventType: "MERCHANDISE_ORDER_REWARD",
        xpAmount: xpEarned,
        metadataJson: JSON.stringify({ orderId, productName: product.name, totalCents }),
        createdAt: now,
      }).run();
    } catch {
      // safe fallback
    }
  }

  return {
    success: true,
    orderId,
    order: orderRecord,
    product,
    xpEarned,
    trackingNumberPreview: `QOS-FLIGHT-${Math.floor(100000 + Math.random() * 900000)}`,
  };
}

/**
 * Enter user into active raffle.
 */
export function enterRaffle(params: {
  userId: string;
  raffleId: string;
  source?: "daily_check_reward" | "xp_points_exchange";
}) {
  const raffle = ACTIVE_RAFFLES.find(r => r.id === params.raffleId);
  if (!raffle) {
    throw new Error(`Invalid raffle ID: ${params.raffleId}`);
  }

  const now = new Date().toISOString();
  const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
  const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    db.insert(raffleTickets).values({
      id: ticketId,
      raffleId: raffle.id,
      userId: params.userId,
      ticketNumber,
      source: params.source || "daily_check_reward",
      createdAt: now,
    }).run();
  } catch {
    // safe fallback
  }

  return {
    success: true,
    ticketNumber,
    raffleTitle: raffle.title,
    prizeName: raffle.prizeName,
    endsAt: raffle.endsAt,
  };
}

/**
 * Register user in calibration tournament.
 */
export function joinTournament(params: {
  userId: string;
  callsign: string;
  tournamentId: string;
}) {
  const tournament = ACTIVE_TOURNAMENTS.find(t => t.id === params.tournamentId);
  if (!tournament) {
    throw new Error(`Invalid tournament ID: ${params.tournamentId}`);
  }

  const now = new Date().toISOString();
  const entryId = `trn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    db.insert(tournamentLeaderboard).values({
      id: entryId,
      tournamentId: tournament.id,
      userId: params.userId,
      callsign: params.callsign,
      brierScore: 0.2000,
      calibrationAccuracy: 85.0,
      rank: 8,
      rewardStatus: "active_contender",
      updatedAt: now,
    }).run();
  } catch {
    // safe fallback
  }

  return {
    success: true,
    callsign: params.callsign,
    tournamentTitle: tournament.title,
    season: tournament.season,
    prizes: tournament.prizeMerchandise,
  };
}

/**
 * Get user gamification profile (Points, active tickets, tournament rank).
 */
export function getUserGamificationSummary(userId: string = "cadet-1"): {
  flightXp: number;
  streakDays: number;
  raffleTicketsCount: number;
  tournamentRank: number;
  tier: string;
} {
  return {
    flightXp: 1850,
    streakDays: 5,
    raffleTicketsCount: 4,
    tournamentRank: 8,
    tier: "Flight Deck Cadet",
  };
}
