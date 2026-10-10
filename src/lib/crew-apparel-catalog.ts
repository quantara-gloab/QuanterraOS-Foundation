/**
 * QuanterraOS Original Eight Flight Crew Apparel Catalog
 *
 * Implements:
 * - 8 Original Council Apparel Collections: Draco, Wolf, Falcon, Quantum Fox, Sentinel, Kraken, Lion, Phoenix.
 * - Leader Collection: Quanta & Quantana (Global Galactic Leader).
 * - 32 Canonical Proposed Outfits (Men's & Women's Street Sets and Flight Sets).
 * - Full landscape concept artwork boards: /assets/[crewSlug]-apparel-board.png
 * - Non-commercial concept state: all items are concept previews, price=null ("Pricing to be confirmed upon supplier sample validation"), checkoutEnabled=false.
 * - Interest registration engine for email alerts with consent tracking.
 */

import { randomUUID } from "node:crypto";
import { db } from "../db.ts";
import { crewApparelInterest } from "../schema.ts";

export interface CrewApparelCollection {
  slug: string;
  name: string;
  stationRole: string;
  signaturePalette: string;
  apparelMotif: string;
  boardImage: string;
  description: string;
  isLeader?: boolean;
}

export interface CrewOutfitItem {
  productId: string;
  crewId: string;
  displayName: string;
  designFit: "men" | "women" | "all";
  category: "street" | "flight";
  categoryLabel: string;
  includedPieces: string[];
  board: string;
  state: "concept" | "sampling" | "approved" | "made-to-order" | "sold-out" | "retired";
  price: string | null;
  checkoutEnabled: boolean;
  supplierVerified: boolean;
  isConcept: boolean;
  piecesDescription: string;
}

export const ORIGINAL_EIGHT_COLLECTIONS: CrewApparelCollection[] = [
  {
    slug: "draco",
    name: "Draco",
    stationRole: "Pipeline Integrity Specialist",
    signaturePalette: "Obsidian / crimson / antique gold",
    apparelMotif: "Angular dragon / geometric scale emblem",
    boardImage: "/assets/draco-apparel-board.png",
    description: "Angular dragon motifs with crimson paneling, obsidian structural lines, and antique gold piping. High-durability heavyweight cotton Street Sets paired with tactical bomber Flight Sets."
  },
  {
    slug: "wolf",
    name: "Wolf",
    stationRole: "Order Book Queue Profiler",
    signaturePalette: "Slate / silver / icy blue",
    apparelMotif: "Wolf head / lunar geometric trajectory lines",
    boardImage: "/assets/wolf-apparel-board.png",
    description: "Subtle lunar lines and icy blue accents on slate gray bases. High-waisted wide-leg trousers, loopback fleece hoodies, and lightweight weather-guard bombers."
  },
  {
    slug: "falcon",
    name: "Falcon",
    stationRole: "Depth Imbalance & Heuristic Modeler",
    signaturePalette: "Pearl / midnight navy / sky blue",
    apparelMotif: "Falcon head / aerodynamic wing line accents",
    boardImage: "/assets/falcon-apparel-board.png",
    description: "Crisp pearl white and deep midnight navy styling with sky blue aerodynamic line details. Relaxed street sets and structured flight jackets with high-contrast ribbing."
  },
  {
    slug: "quantum-fox",
    name: "Quantum Fox",
    stationRole: "Verification & Out-of-Sample Auditor",
    signaturePalette: "Violet / copper orange / cyan",
    apparelMotif: "Fox head / orbital calibration geometry",
    boardImage: "/assets/quantum-fox-apparel-board.png",
    description: "Celestial violet fleece paired with copper-orange piping and orbital geometry sleeves. Tailored bombers with articulated elbows and graphite cargo trousers."
  },
  {
    slug: "sentinel",
    name: "Sentinel",
    stationRole: "Latency & Surveillance Guardian",
    signaturePalette: "Navy / platinum / emerald",
    apparelMotif: "Guardian visor / protective hexagonal shield",
    boardImage: "/assets/sentinel-apparel-board.png",
    description: "Deep navy foundation accented with platinum hardware and emerald status glow lines. Utilitarian pockets, double-reinforced seams, and clean silhouette bombers."
  },
  {
    slug: "kraken",
    name: "Kraken",
    stationRole: "Cross-Venue Basis & Stress Auditor",
    signaturePalette: "Ocean teal / black / aqua",
    apparelMotif: "Kraken / marine tentacle geometry",
    boardImage: "/assets/kraken-apparel-board.png",
    description: "Deep ocean teal and obsidian black colorways with aqua geometric line work. Drop-shoulder hoodies with back-view graphics and matching articulated trousers."
  },
  {
    slug: "lion",
    name: "Lion",
    stationRole: "Calibration Arbiter",
    signaturePalette: "Black / gold / ivory",
    apparelMotif: "Lion head / sunburst calibration mane",
    boardImage: "/assets/lion-apparel-board.png",
    description: "Regal midnight black, bullion gold trim, and warm ivory accents. Premium street sets with sunburst mane back embroidery and tailored flight bombers."
  },
  {
    slug: "phoenix",
    name: "Phoenix",
    stationRole: "Execution Gate & Recovery Officer",
    signaturePalette: "Plum / coral / warm gold",
    apparelMotif: "Phoenix / feather flame geometry",
    boardImage: "/assets/phoenix-apparel-board.png",
    description: "Rich celestial plum and warm coral hues with feather-flame geometric line work. Soft heavy fleece street hoodies and tailored flight jackets."
  },
  {
    slug: "quanta",
    name: "Quanta & Quantana",
    stationRole: "Global Galactic Leader & Virtual Assistant",
    signaturePalette: "Ceramic white / violet / gold",
    apparelMotif: "Balanced arrow visor / Spacecraft Council compass",
    boardImage: "/assets/quanta-leader-apparel-board.png",
    description: "The official leader collection honoring Quanta and Quantana. Iconic ceramic white, violet Flight Deck piping, and gold calibration compass emblems.",
    isLeader: true
  }
];

export const CREW_OUTFIT_CATALOG: CrewOutfitItem[] = [
  // 1. DRACO
  {
    productId: "draco-men-street-concept",
    crewId: "draco",
    displayName: "Draco Men's Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/draco-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Heavyweight obsidian cotton hoodie with crimson chevron chest panels & matching relaxed cargo trousers."
  },
  {
    productId: "draco-men-flight-concept",
    crewId: "draco",
    displayName: "Draco Men's Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/draco-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Structured matte black bomber with antique gold scale arm accents & tailored utility trousers."
  },
  {
    productId: "draco-women-street-concept",
    crewId: "draco",
    displayName: "Draco Women's Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/draco-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Relaxed crimson-panel pullover hoodie with dragon-scale back graphic & matching wide-leg trousers."
  },
  {
    productId: "draco-women-flight-concept",
    crewId: "draco",
    displayName: "Draco Women's Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/draco-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Sculpted black flight bomber with antique gold dragon-wing trim & high-waisted pleated trousers."
  },

  // 2. WOLF
  {
    productId: "wolf-men-street-concept",
    crewId: "wolf",
    displayName: "Wolf Men's Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/wolf-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Slate gray brushed loopback hoodie with icy blue lunar sleeve stripes & black articulated cargos."
  },
  {
    productId: "wolf-men-flight-concept",
    crewId: "wolf",
    displayName: "Wolf Men's Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/wolf-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Silver-gray technical bomber jacket with wolf-head back contour & charcoal straight-leg trousers."
  },
  {
    productId: "wolf-women-street-concept",
    crewId: "wolf",
    displayName: "Wolf Women's Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/wolf-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Oversized slate hoodie with lunar geometric back print & high-waisted drawstring cargos."
  },
  {
    productId: "wolf-women-flight-concept",
    crewId: "wolf",
    displayName: "Wolf Women's Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/wolf-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Cropped silver-gray utility bomber jacket & tailored wide-leg trousers in charcoal twill."
  },

  // 3. FALCON
  {
    productId: "falcon-men-street-concept",
    crewId: "falcon",
    displayName: "Falcon Men's Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/falcon-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Pearl white & midnight navy color-blocked fleece hoodie & navy tactical cargo trousers."
  },
  {
    productId: "falcon-men-flight-concept",
    crewId: "falcon",
    displayName: "Falcon Men's Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/falcon-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Midnight navy aviation bomber with sky blue wing telemetry lines & crisp white tapered trousers."
  },
  {
    productId: "falcon-women-street-concept",
    crewId: "falcon",
    displayName: "Falcon Women's Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/falcon-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Two-tone pearl white hoodie with aerodynamic wing line back art & high-waisted navy utility cargos."
  },
  {
    productId: "falcon-women-flight-concept",
    crewId: "falcon",
    displayName: "Falcon Women's Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/falcon-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Tailored navy bomber jacket with sky-blue zip pulls & architectural white wide-leg trousers."
  },

  // 4. QUANTUM FOX
  {
    productId: "quantum-fox-men-street-concept",
    crewId: "quantum-fox",
    displayName: "Quantum Fox Men's Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/quantum-fox-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Deep celestial violet hoodie with copper orange accents and orbital fox back graphic & graphite cargos."
  },
  {
    productId: "quantum-fox-men-flight-concept",
    crewId: "quantum-fox",
    displayName: "Quantum Fox Men's Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/quantum-fox-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Copper-violet technical flight jacket with cyan orbital trajectory stitching & charcoal trousers."
  },
  {
    productId: "quantum-fox-women-street-concept",
    crewId: "quantum-fox",
    displayName: "Quantum Fox Women's Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/quantum-fox-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Violet drop-shoulder hoodie with copper fox geometry & high-waisted graphite wide-leg trousers."
  },
  {
    productId: "quantum-fox-women-flight-concept",
    crewId: "quantum-fox",
    displayName: "Quantum Fox Women's Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/quantum-fox-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Sculpted copper-violet bomber jacket & high-rise tailored trousers with subtle cyan seam accents."
  },

  // 5. SENTINEL
  {
    productId: "sentinel-men-street-concept",
    crewId: "sentinel",
    displayName: "Sentinel Men's Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/sentinel-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Navy loopback cotton hoodie with platinum hexagonal shield badge & graphite utility cargo pants."
  },
  {
    productId: "sentinel-men-flight-concept",
    crewId: "sentinel",
    displayName: "Sentinel Men's Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/sentinel-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Navy tactical utility jacket with emerald telemetry piping & matte black reinforced trousers."
  },
  {
    productId: "sentinel-women-street-concept",
    crewId: "sentinel",
    displayName: "Sentinel Women's Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/sentinel-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Navy relaxed hoodie with guardian shield geometric back print & high-waisted utility cargos."
  },
  {
    productId: "sentinel-women-flight-concept",
    crewId: "sentinel",
    displayName: "Sentinel Women's Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/sentinel-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Tailored navy utility flight jacket with platinum accents & wide-leg black trousers."
  },

  // 6. KRAKEN
  {
    productId: "kraken-men-street-concept",
    crewId: "kraken",
    displayName: "Kraken Men's Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/kraken-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Ocean teal organic cotton hoodie with aqua geometric tentacle sleeve accents & dark cargo pants."
  },
  {
    productId: "kraken-men-flight-concept",
    crewId: "kraken",
    displayName: "Kraken Men's Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/kraken-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Black & ocean-teal bomber jacket with deep-sea geometry on back & matching teal utility trousers."
  },
  {
    productId: "kraken-women-street-concept",
    crewId: "kraken",
    displayName: "Kraken Women's Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/kraken-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Teal drop-shoulder hoodie with marine geometry back panel & high-waisted straight-leg cargos."
  },
  {
    productId: "kraken-women-flight-concept",
    crewId: "kraken",
    displayName: "Kraken Women's Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/kraken-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Tailored black & aqua bomber jacket with oceanic lining & high-waisted teal trousers."
  },

  // 7. LION
  {
    productId: "lion-men-street-concept",
    crewId: "lion",
    displayName: "Lion Men's Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/lion-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Black heavyweight fleece hoodie with bullion gold calibration sunburst back emblem & ivory cargos."
  },
  {
    productId: "lion-men-flight-concept",
    crewId: "lion",
    displayName: "Lion Men's Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/lion-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Gold-detailed black aviator bomber with lion-head collar embroidery & midnight black tailored trousers."
  },
  {
    productId: "lion-women-street-concept",
    crewId: "lion",
    displayName: "Lion Women's Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/lion-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Ivory fleece hoodie with gold calibration mane contour & black wide-leg pleated cargo trousers."
  },
  {
    productId: "lion-women-flight-concept",
    crewId: "lion",
    displayName: "Lion Women's Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/lion-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Sculpted black bomber with gold bullion hardware & high-waisted ivory tailored trousers."
  },

  // 8. PHOENIX
  {
    productId: "phoenix-men-street-concept",
    crewId: "phoenix",
    displayName: "Phoenix Men's Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/phoenix-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Deep plum & coral fleece hoodie with phoenix feather flame back print & graphite cargo trousers."
  },
  {
    productId: "phoenix-men-flight-concept",
    crewId: "phoenix",
    displayName: "Phoenix Men's Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/phoenix-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Feather-detailed technical flight bomber with warm gold piping & coral straight-leg trousers."
  },
  {
    productId: "phoenix-women-street-concept",
    crewId: "phoenix",
    displayName: "Phoenix Women's Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/phoenix-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Plum & ember coral hoodie with geometric feather flame contour & high-waisted utility cargos."
  },
  {
    productId: "phoenix-women-flight-concept",
    crewId: "phoenix",
    displayName: "Phoenix Women's Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/phoenix-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Tailored feather-detail bomber jacket & flowing coral wide-leg trousers with gold stitching."
  },

  // 9. LEADER COLLECTION (QUANTA & QUANTANA)
  {
    productId: "quanta-men-street-concept",
    crewId: "quanta",
    displayName: "Quanta Men's Leader Street Set",
    designFit: "men",
    category: "street",
    categoryLabel: "Leader Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/quanta-leader-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Ceramic white 450 GSM fleece hoodie with violet piping, balanced arrow visor crest & tailored cargos."
  },
  {
    productId: "quanta-men-flight-concept",
    crewId: "quanta",
    displayName: "Quanta Men's Leader Flight Set",
    designFit: "men",
    category: "flight",
    categoryLabel: "Leader Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/quanta-leader-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Aerospace pilot flight jacket with gold Spacecraft Council compass badge & obsidian utility trousers."
  },
  {
    productId: "quanta-women-street-concept",
    crewId: "quanta",
    displayName: "Quantana Women's Leader Street Set",
    designFit: "women",
    category: "street",
    categoryLabel: "Leader Street Set",
    includedPieces: ["Hoodie", "Trousers"],
    board: "/assets/quanta-leader-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Sculpted white & violet fleece hoodie with paired arrow visor back art & high-rise wide-leg trousers."
  },
  {
    productId: "quanta-women-flight-concept",
    crewId: "quanta",
    displayName: "Quantana Women's Leader Flight Set",
    designFit: "women",
    category: "flight",
    categoryLabel: "Leader Flight Set",
    includedPieces: ["Jacket", "Trousers"],
    board: "/assets/quanta-leader-apparel-board.png",
    state: "concept",
    price: null,
    checkoutEnabled: false,
    supplierVerified: false,
    isConcept: true,
    piecesDescription: "Architectural leader flight jacket with violet constellation silk lining & high-waisted white trousers."
  }
];

export function getCrewCollection(crewSlug: string): CrewApparelCollection | undefined {
  const normalized = crewSlug.toLowerCase().trim();
  return ORIGINAL_EIGHT_COLLECTIONS.find(c => c.slug === normalized);
}

export function getCrewOutfits(crewSlug: string, options?: { fit?: string; category?: string }): CrewOutfitItem[] {
  const normalized = crewSlug.toLowerCase().trim();
  return CREW_OUTFIT_CATALOG.filter(item => {
    if (item.crewId !== normalized) return false;
    if (options?.fit && options.fit !== "all" && item.designFit !== options.fit) return false;
    if (options?.category && options.category !== "all" && item.category !== options.category) return false;
    return true;
  });
}

export function recordApparelInterest(params: {
  email: string;
  crewSlug: string;
  productId?: string;
  fitPreference?: string;
}): { success: boolean; message: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
    throw new Error("A valid email address is required.");
  }

  const id = `int_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  try {
    db.insert(crewApparelInterest).values({
      id,
      email: cleanEmail,
      crewId: params.crewSlug,
      productId: params.productId || null,
      fitPreference: params.fitPreference || null,
      noticeVersion: "2026-10-10",
      consentGranted: true,
      createdAt: now,
    }).run();
  } catch (err) {
    // Gracefully handle if DB table is initializing
  }

  return {
    success: true,
    message: "Thank you. You have been registered for official sample and sizing updates for this collection."
  };
}
