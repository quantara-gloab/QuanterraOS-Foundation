/**
 * QuanterraOS: The 44 — Official Elite Eleven Artwork Catalog
 *
 * Implements Elite Eleven Revision (10 October 2026):
 * - Exactly 44 individually generated, verified collectible artworks
 * - 11 Members: Michael Quanterra (Founder), Quanta (Leader & Assistant), Quantana (Queen & Companion),
 *   and 8 Specialists: Draco, Wolf, Falcon, Quantum Fox, Sentinel, Kraken, Lion, Phoenix.
 * - 4 Chapters: Origin Command, Cosmic Street, Executive Orbit, Royal Ascension.
 * - 11 members per chapter; 4 chapters per member.
 * - Founder is first in each chapter, Quanta second, Quantana third, followed by eight specialists.
 * - Source of truth: asset-catalog.json
 * - Status: Artwork · NFT-ready (Unminted). No prices, no floor values, no fake scarcity.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface Artwork44Item {
  id: string;
  slug: string;
  title: string;
  crewCanonicalId: string;
  memberName: string;
  memberRole: string;
  symbol: string;
  visualIdentity: string;
  productResponsibility: string;
  chapterNumber: number;
  chapterId: string;
  chapterTitle: string;
  palette: {
    primary: string;
    secondary: string;
    dark: string;
    glow: string;
    accent: string;
  };
  prompt: string;
  description: string;
  alt: string;
  dimensions: { width: number; height: number };
  sizeBytes: number;
  mimeType: string;
  sha256: string;
  generationMethod: string;
  creatorDisplayName: string;
  approvedAt: string;
  mintStatus: string;
  rightsStatus: string;
  originalAssetUrl: string;
  thumbnailUrl: string;
  imagePath?: string;
  masterImagePath?: string;
  memberId?: string;
}

export interface EliteMemberMeta {
  id: string;
  name: string;
  role: string;
  symbol: string;
  visualIdentity: string;
  productResponsibility: string;
  isFounder?: boolean;
  isLeader?: boolean;
}

export interface ChapterMeta {
  number: number;
  id: string;
  title: string;
  themeDescription: string;
}

export const CHAPTERS_44_LIST: ChapterMeta[] = [
  {
    number: 1,
    id: "origin-command",
    title: "Origin Command",
    themeDescription: "Initial spaceport orbital ascent breaking through Earth's exosphere into sovereign low-orbit command."
  },
  {
    number: 2,
    id: "cosmic-street",
    title: "Cosmic Street",
    themeDescription: "Orbital megacity waypoints, cyberpunk low-gravity streetwear, tactical fleece overlays, and luminous neon accents."
  },
  {
    number: 3,
    id: "executive-orbit",
    title: "Executive Orbit",
    themeDescription: "Sovereign diplomatic conference stations, tailored ceremonial suiting, polished titanium joints, and structured obsidian lines."
  },
  {
    number: 4,
    id: "royal-ascension",
    title: "Royal Ascension",
    themeDescription: "Celestial crowning pinnacle, iridescent cosmic ribbon auroras, sovereign tiara filigree, and royal imperial vestments."
  }
];

export const ELITE_ELEVEN_MEMBERS_LIST: EliteMemberMeta[] = [
  {
    id: "michael",
    name: "Michael Quanterra",
    role: "Founder & Creative Provenance",
    symbol: "founder-m",
    visualIdentity: "M helmet forehead; violet star eyes; cyan smile; black/pearl/gold founder suit",
    productResponsibility: "Founder story and provenance. Brand character, not a trading engine",
    isFounder: true
  },
  {
    id: "quanta",
    name: "Quanta",
    role: "Assistant & Global Galactic Leader",
    symbol: "dual-arrows",
    visualIdentity: "Green up arrow and pink down arrow together; violet smile; gold crown/purple orb",
    productResponsibility: "Assistant, orchestration and explanation",
    isLeader: true
  },
  {
    id: "quantana",
    name: "Quantana",
    role: "Queen, Companion & Academy Host",
    symbol: "cosmic-tiara",
    visualIdentity: "Violet curved smiling eyes; tiara; cosmic ribbon veil",
    productResponsibility: "Onboarding and education; Queen collection host",
    isLeader: true
  },
  {
    id: "draco",
    name: "Draco",
    role: "Data Quality & Provenance Specialist",
    symbol: "dragon",
    visualIdentity: "Amber angular eyes; red dragon crest",
    productResponsibility: "Data quality, provenance, outlier checks"
  },
  {
    id: "wolf",
    name: "Wolf",
    role: "Order Book Queue & Liquidity Specialist",
    symbol: "wolf",
    visualIdentity: "Ice-cyan chevrons; wolf helmet fins",
    productResponsibility: "Order book, spread, liquidity and fill assumptions"
  },
  {
    id: "falcon",
    name: "Falcon",
    role: "Short-Horizon Research & Depth Specialist",
    symbol: "falcon",
    visualIdentity: "Blue wing eyes; aerodynamic fins",
    productResponsibility: "Short-horizon research; timestamped probabilistic output if validated"
  },
  {
    id: "quantum-fox",
    name: "Quantum Fox",
    role: "Out-of-Sample Calibration & Uncertainty Auditor",
    symbol: "fox",
    visualIdentity: "Violet diamond eyes; fox fins",
    productResponsibility: "Out-of-sample validation, uncertainty and calibration"
  },
  {
    id: "sentinel",
    name: "Sentinel",
    role: "Feed Health, Staleness & Risk-State Monitor",
    symbol: "shield",
    visualIdentity: "Green hexagon eyes; diagnostic shield",
    productResponsibility: "Feed health, staleness, risk-state monitoring"
  },
  {
    id: "kraken",
    name: "Kraken",
    role: "Spot/Index Basis & Contract Settlement Rules Auditor",
    symbol: "kraken",
    visualIdentity: "Aqua spirals; sensor arms",
    productResponsibility: "Spot/index basis and contract-specific settlement rules"
  },
  {
    id: "lion",
    name: "Lion",
    role: "Evidence Synthesis & Disagreement Summarizer",
    symbol: "lion",
    visualIdentity: "Amber sun discs; gold mechanical mane",
    productResponsibility: "Evidence synthesis and disagreement summary"
  },
  {
    id: "phoenix",
    name: "Phoenix",
    role: "Reconnection, Resilience & Incident State Guardian",
    symbol: "phoenix",
    visualIdentity: "Pink curved eyes; coral feather crest",
    productResponsibility: "Reconnection, recovery and incident state"
  }
];

// Load catalog from asset-catalog.json
let loadedCatalog: Artwork44Item[] = [];
try {
  const catalogPath = path.resolve("asset-catalog.json");
  if (fs.existsSync(catalogPath)) {
    loadedCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  }
} catch {
  loadedCatalog = [];
}

// Normalize items to ensure imagePath, masterImagePath, and description are always present
const normalizedCatalog: Artwork44Item[] = loadedCatalog.map((item: any) => ({
  ...item,
  imagePath: `/assets/art-44/${item.id}.png`,
  masterImagePath: `/assets/art-44/${item.id}.png`,
  originalAssetUrl: item.originalAssetUrl || `/assets/art-44/${item.id}.png`,
  description: item.description || item.prompt || `Official QuanterraOS Fighter Pilots artwork for ${item.id}`,
  memberId: item.crewCanonicalId === 'michael' ? 'michael-quanterra' : item.crewCanonicalId,
}));

export const THE_44_CATALOG: Artwork44Item[] = normalizedCatalog;
export const ART_44_CATALOG: Artwork44Item[] = THE_44_CATALOG;
export const ART_44_CHAPTERS: string[] = CHAPTERS_44_LIST.map(c => c.title);

export function getAll44Artworks(): Artwork44Item[] {
  return THE_44_CATALOG;
}

export function getArtwork44ById(id: string): Artwork44Item | undefined {
  const norm = id.toLowerCase().trim();
  return THE_44_CATALOG.find(a => a.id.toLowerCase() === norm);
}

export const getArt44ById = getArtwork44ById;

export function getArtwork44BySlug(slug: string): Artwork44Item | undefined {
  const norm = slug.toLowerCase().trim();
  return THE_44_CATALOG.find(a => a.slug.toLowerCase() === norm);
}

export function getArt44ByMember(memberId: string): Artwork44Item[] {
  const norm = memberId.toLowerCase().trim();
  return THE_44_CATALOG.filter(a =>
    a.crewCanonicalId.toLowerCase() === norm ||
    (a as any).memberId?.toLowerCase() === norm ||
    (norm === 'michael-quanterra' && a.crewCanonicalId === 'michael') ||
    (norm === 'michael' && a.crewCanonicalId === 'michael')
  );
}

export function getArt44ByChapter(chapter: string): Artwork44Item[] {
  const norm = chapter.toLowerCase().trim();
  return THE_44_CATALOG.filter(a =>
    a.chapterTitle.toLowerCase() === norm ||
    a.chapterId.toLowerCase() === norm ||
    String(a.chapterNumber) === norm
  );
}

export function filter44Artworks(options?: {
  chapterId?: string;
  crewId?: string;
  searchQuery?: string;
}): Artwork44Item[] {
  let list = [...THE_44_CATALOG];

  if (options?.chapterId && options.chapterId !== "all") {
    const ch = options.chapterId.toLowerCase();
    list = list.filter(a => a.chapterId.toLowerCase() === ch || String(a.chapterNumber) === ch);
  }

  if (options?.crewId && options.crewId !== "all") {
    const crew = options.crewId.toLowerCase();
    list = list.filter(a => a.crewCanonicalId.toLowerCase() === crew);
  }

  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase().trim();
    list = list.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.memberName.toLowerCase().includes(q) ||
      a.chapterTitle.toLowerCase().includes(q) ||
      a.visualIdentity.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }

  return list;
}
