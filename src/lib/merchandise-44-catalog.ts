/**
 * QuanterraOS: Elite Eleven 78 Garment Concepts & 13 Apparel Boards
 *
 * Implements:
 * - 13 Apparel Boards: 11 Members + 2 Royal Galactic (King & Queen)
 * - Exactly 78 Garment Concepts (6 looks per board: Men's/Women's Hoodie, Jumpsuit, Business Attire)
 * - Source of truth: merchandise-catalog.json
 * - All items in concept_only state, price: null, checkoutEnabled: false
 * - Notice: "Design concept — final product may vary"
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ApparelBoardItem {
  id: string;
  boardSlug: string;
  title: string;
  collection: "Crew Essentials" | "Executive Orbit" | "King Royal Galactic" | "Queen Royal Galactic" | "Founder M Edition";
  memberOrThemeId: string;
  memberName: string;
  boardImage: string;
  prompt: string;
  description: string;
}

export const APPAREL_13_BOARDS: ApparelBoardItem[] = [
  // 11 Member Boards
  {
    id: "board-michael",
    boardSlug: "michael-founder-board",
    title: "Founder M Edition — Michael Quanterra Six-Look Apparel Board",
    collection: "Founder M Edition",
    memberOrThemeId: "michael",
    memberName: "Michael Quanterra",
    boardImage: "/assets/apparel/michael-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Michael Quanterra Founder M Edition: Men's Hoodie, Women's Hoodie, Men's Jumpsuit, Women's Jumpsuit, Men's Business Attire, Women's Business Attire. Obsidian heavyweight loopback fleece, pearl ceramic accents, 24k gold piping, embroidered M helmet crest on chest and lapel, cosmic violet inner lining.",
    description: "Six-look design board showcasing the Founder M Edition collection: obsidian black bases, pearl fabric contrast, gold micro-piping, and capital M embroidery."
  },
  {
    id: "board-quanta",
    boardSlug: "quanta-leader-board",
    title: "Quanta Galactic Leader Six-Look Apparel Board",
    collection: "Crew Essentials",
    memberOrThemeId: "quanta",
    memberName: "Quanta",
    boardImage: "/assets/apparel/quanta-leader-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Quanta Galactic Leader: Men's and Women's hoodies, jumpsuits, and tailored business attire featuring subtle paired green up arrow and pink down arrow chest insignias, lavender fleece, and reflective gold trims.",
    description: "Six-look design board for Quanta: balanced market perspective dual arrow emblems, lavender structural panels, and modern aerodynamic silhouettes."
  },
  {
    id: "board-quantana",
    boardSlug: "quantana-queen-board",
    title: "Quantana Academy & Queen Companion Six-Look Apparel Board",
    collection: "Executive Orbit",
    memberOrThemeId: "quantana",
    memberName: "Quantana",
    boardImage: "/assets/apparel/quantana-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Quantana: Men's and Women's hoodies, flight jumpsuits, and structured suits with celestial tiara micro-embroidery, cosmic ribbon sleeve tapes, and rose-gold accents.",
    description: "Six-look design board for Quantana: tiara motif, cosmic ribbon trims, and rose-gold detailing across everyday and tailored garments."
  },
  {
    id: "board-draco",
    boardSlug: "draco-apparel-board",
    title: "Draco Data Quality & Provenance Six-Look Apparel Board",
    collection: "Crew Essentials",
    memberOrThemeId: "draco",
    memberName: "Draco",
    boardImage: "/assets/apparel/draco-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Draco: Men's and Women's hoodies, flight jumpsuits, and tailored suits with crimson paneling, obsidian structural lines, geometric dragon crests, and antique gold piping.",
    description: "Six-look design board for Draco: crimson and obsidian colorways, geometric dragon emblem, reinforced seams, and durable construction."
  },
  {
    id: "board-wolf",
    boardSlug: "wolf-apparel-board",
    title: "Wolf Order Book & Liquidity Six-Look Apparel Board",
    collection: "Crew Essentials",
    memberOrThemeId: "wolf",
    memberName: "Wolf",
    boardImage: "/assets/apparel/wolf-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Wolf: Men's and Women's hoodies, jumpsuits, and tailored suits with slate gray base, icy blue chevron stitching, lunar trajectory sleeve lines, and silver hardware.",
    description: "Six-look design board for Wolf: slate bases, ice-cyan accents, lunar lines, and weather-guard shell materials."
  },
  {
    id: "board-falcon",
    boardSlug: "falcon-apparel-board",
    title: "Falcon Research & Depth Six-Look Apparel Board",
    collection: "Crew Essentials",
    memberOrThemeId: "falcon",
    memberName: "Falcon",
    boardImage: "/assets/apparel/falcon-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Falcon: Men's and Women's hoodies, jumpsuits, and business attire featuring crisp pearl white and midnight navy contrasts, aerodynamic sky blue wing piping, and ribbed cuffs.",
    description: "Six-look design board for Falcon: pearl white, midnight navy, and sky blue aerodynamic lines."
  },
  {
    id: "board-quantum-fox",
    boardSlug: "quantum-fox-apparel-board",
    title: "Quantum Fox Calibration & Uncertainty Six-Look Apparel Board",
    collection: "Executive Orbit",
    memberOrThemeId: "quantum-fox",
    memberName: "Quantum Fox",
    boardImage: "/assets/apparel/quantum-fox-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Quantum Fox: Men's and Women's hoodies, jumpsuits, and tailored suits in celestial violet fleece, copper-orange piping, diamond insignia, and articulated joints.",
    description: "Six-look design board for Quantum Fox: violet and copper color-blocking with diamond visor detailing."
  },
  {
    id: "board-sentinel",
    boardSlug: "sentinel-apparel-board",
    title: "Sentinel Feed Health & Monitor Six-Look Apparel Board",
    collection: "Crew Essentials",
    memberOrThemeId: "sentinel",
    memberName: "Sentinel",
    boardImage: "/assets/apparel/sentinel-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Sentinel: Men's and Women's hoodies, jumpsuits, and suits with deep emerald and platinum status lines, hexagonal shield patch, and utilitarian cargo pockets.",
    description: "Six-look design board for Sentinel: emerald status piping, diagnostic shield motifs, and double-reinforced structure."
  },
  {
    id: "board-kraken",
    boardSlug: "kraken-apparel-board",
    title: "Kraken Basis & Settlement Six-Look Apparel Board",
    collection: "Executive Orbit",
    memberOrThemeId: "kraken",
    memberName: "Kraken",
    boardImage: "/assets/apparel/kraken-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Kraken: Men's and Women's hoodies, jumpsuits, and suits in ocean teal and obsidian black, aqua spiral geometry, and drop-shoulder relaxed fits.",
    description: "Six-look design board for Kraken: deep ocean teal base, aqua spiral geometry, and structured tailoring."
  },
  {
    id: "board-lion",
    boardSlug: "lion-apparel-board",
    title: "Lion Synthesis & Disagreement Six-Look Apparel Board",
    collection: "Crew Essentials",
    memberOrThemeId: "lion",
    memberName: "Lion",
    boardImage: "/assets/apparel/lion-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Lion: Men's and Women's hoodies, jumpsuits, and suits in dark amber, raw silk and gold mane detailing, solar disc embroidery, and structured lapels.",
    description: "Six-look design board for Lion: amber and gold detailing, solar disc insignia, and tailored luxury cuts."
  },
  {
    id: "board-phoenix",
    boardSlug: "phoenix-apparel-board",
    title: "Phoenix Resilience & Recovery Six-Look Apparel Board",
    collection: "Crew Essentials",
    memberOrThemeId: "phoenix",
    memberName: "Phoenix",
    boardImage: "/assets/apparel/phoenix-apparel-board.png",
    prompt: "Six-look fashion presentation concept board for Phoenix: Men's and Women's hoodies, jumpsuits, and suits in coral pink, ruby micro-cables, feather crest embroidery on sleeves, and thermal fleece linings.",
    description: "Six-look design board for Phoenix: coral and pink hues, feather embroidery, and thermal-regulating fabrics."
  },
  // 2 Royal Galactic Boards (King and Queen)
  {
    id: "board-king-royal",
    boardSlug: "king-royal-galactic-board",
    title: "King Royal Galactic Six-Look Apparel Board",
    collection: "King Royal Galactic",
    memberOrThemeId: "royal-king",
    memberName: "King Royal Galactic",
    boardImage: "/assets/apparel/king-royal-galactic-board.png",
    prompt: "Six-look high fashion presentation board for King Royal Galactic: Men's Hoodie, Women's Hoodie, Men's Jumpsuit, Women's Jumpsuit, Men's Business Attire, Women's Business Attire. Deep imperial violet velvet, 24k gold leaf embroidery, sovereign celestial star charts, brushed brass fasteners, tailored for all fits.",
    description: "Six-look imperial board: deep violet velvet, gold leaf embroidery, and cosmic star charts across both men's and women's fits."
  },
  {
    id: "board-queen-royal",
    boardSlug: "queen-royal-galactic-board",
    title: "Queen Royal Galactic Six-Look Apparel Board",
    collection: "Queen Royal Galactic",
    memberOrThemeId: "royal-queen",
    memberName: "Queen Royal Galactic",
    boardImage: "/assets/apparel/queen-royal-galactic-board.png",
    prompt: "Six-look high fashion presentation board for Queen Royal Galactic: Men's Hoodie, Women's Hoodie, Men's Jumpsuit, Women's Jumpsuit, Men's Business Attire, Women's Business Attire. Luminous astral silk, rose-gold filigree tiara lines, iridescent lilac overlays, tailored for all fits.",
    description: "Six-look imperial board: astral silk, rose-gold filigree, and iridescent lilac tones across both men's and women's fits."
  }
];

export const APPAREL_BOARDS = APPAREL_13_BOARDS;

export interface GarmentConceptItem {
  sku: string;
  parentBoardId: string;
  parentBoardSlug: string;
  parentBoardImage: string;
  collection: string;
  memberOrThemeId: string;
  memberName: string;
  garmentType: "hoodie" | "jumpsuit" | "business_attire";
  garmentTypeLabel: string;
  fit: "mens" | "womens";
  fitLabel: string;
  displayName: string;
  description: string;
  includedPieces: string[];
  state: "concept_only" | "sample_in_review" | "approved_product" | "preorder_or_in_stock";
  statusNotice: string;
  checkoutEnabled: boolean;
  price: number | null;
  currency: string | null;
  materials: string | null;
  dimensions: string | null;
  shipping: string | null;
  returns: string | null;
  stock: number | null;
  supplierVerified: boolean;
  inStock?: boolean;
  materialsApproved?: boolean;
  disclaimer?: string;
}

let loadedMerch: GarmentConceptItem[] = [];
try {
  const merchPath = path.resolve("merchandise-catalog.json");
    const raw: any[] = JSON.parse(fs.readFileSync(merchPath, "utf8"));
    loadedMerch = raw.map(item => ({
      ...item,
      state: item.state || item.status || "concept_only",
      status: item.status || item.state || "concept_only",
      price: item.price ?? null,
      checkoutEnabled: false,
      inStock: item.stock !== null && item.stock !== undefined && item.stock > 0 ? true : false,
      materialsApproved: item.supplierVerified === true,
      disclaimer: item.disclaimer || "Design concept — final product may vary. Not yet manufactured.",
    }));
} catch {
  loadedMerch = [];
}

export const MERCHANDISE_78_CATALOG: GarmentConceptItem[] = loadedMerch;
export const MERCHANDISE_78_CONCEPTS: GarmentConceptItem[] = MERCHANDISE_78_CATALOG;

export const APPAREL_COLLECTIONS_LIST = [
  { id: "all", name: "All Collections" },
  { id: "crew-essentials", name: "Crew Essentials", collection: "Crew Essentials" },
  { id: "executive-orbit", name: "Executive Orbit", collection: "Executive Orbit" },
  { id: "king-royal-galactic", name: "King Royal Galactic", collection: "King Royal Galactic" },
  { id: "queen-royal-galactic", name: "Queen Royal Galactic", collection: "Queen Royal Galactic" },
  { id: "founder-m-edition", name: "Founder M Edition", collection: "Founder M Edition" },
];

export const APPAREL_COLLECTIONS = APPAREL_COLLECTIONS_LIST;

export function getAllGarmentConcepts(): GarmentConceptItem[] {
  return MERCHANDISE_78_CATALOG;
}

export function getGarmentBySku(sku: string): GarmentConceptItem | undefined {
  const norm = sku.toUpperCase().trim();
  return MERCHANDISE_78_CATALOG.find(g => g.sku.toUpperCase() === norm);
}

export function getMerchandiseByCollection(collection: string): GarmentConceptItem[] {
  const col = collection.toLowerCase().replace(/-/g, ' ');
  return MERCHANDISE_78_CATALOG.filter(g => g.collection.toLowerCase().includes(col));
}

export function getMerchandiseByMember(memberId: string): GarmentConceptItem[] {
  const mem = memberId.toLowerCase();
  return MERCHANDISE_78_CATALOG.filter(g => g.memberOrThemeId.toLowerCase() === mem);
}

export function filterGarments(options?: {
  collection?: string;
  memberId?: string;
  garmentType?: string;
  fit?: string;
  searchQuery?: string;
}): GarmentConceptItem[] {
  let list = [...MERCHANDISE_78_CATALOG];

  if (options?.collection && options.collection !== "all") {
    const col = options.collection.toLowerCase().replace(/-/g, ' ');
    list = list.filter(g => g.collection.toLowerCase().includes(col));
  }

  if (options?.memberId && options.memberId !== "all") {
    const mem = options.memberId.toLowerCase();
    list = list.filter(g => g.memberOrThemeId.toLowerCase() === mem);
  }

  if (options?.garmentType && options.garmentType !== "all") {
    const type = options.garmentType.toLowerCase();
    list = list.filter(g => g.garmentType.toLowerCase() === type);
  }

  if (options?.fit && options.fit !== "all") {
    const fit = options.fit.toLowerCase();
    list = list.filter(g => g.fit.toLowerCase() === fit);
  }

  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase().trim();
    list = list.filter(g =>
      g.sku.toLowerCase().includes(q) ||
      g.displayName.toLowerCase().includes(q) ||
      g.memberName.toLowerCase().includes(q) ||
      g.collection.toLowerCase().includes(q)
    );
  }

  return list;
}
