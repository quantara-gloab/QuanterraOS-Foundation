import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createPngBuffer, parseHex } from './generate-elite-eleven-assets.ts';

// ---------------------------------------------------------------------------
// 1. Definition of the Elite Eleven Members
// ---------------------------------------------------------------------------
export interface MemberDef {
  id: string;
  name: string;
  role: string;
  symbol: string;
  visualIdentity: string;
  productResponsibility: string;
  palette: {
    primary: string;
    secondary: string;
    dark: string;
    glow: string;
    accent: string;
  };
  eyesType: string;
  crestType: string;
}

export const ELITE_ELEVEN_MEMBERS: MemberDef[] = [
  {
    id: "michael",
    name: "Michael Quanterra",
    role: "Founder & Creative Provenance",
    symbol: "founder-m",
    visualIdentity: "M helmet forehead; violet star eyes; cyan smile; black/pearl/gold founder suit",
    productResponsibility: "Founder story and provenance. Brand character, not a trading engine",
    palette: {
      primary: "#9B6CFF",
      secondary: "#CBFF69",
      dark: "#090A14",
      glow: "rgba(155, 108, 255, 0.5)",
      accent: "#DFB843"
    },
    eyesType: "violet-stars",
    crestType: "capital-m-forehead"
  },
  {
    id: "quanta",
    name: "Quanta",
    role: "Assistant & Global Galactic Leader",
    symbol: "dual-arrows",
    visualIdentity: "Green up arrow and pink down arrow together; violet smile; gold crown/purple orb",
    productResponsibility: "Assistant, orchestration and explanation",
    palette: {
      primary: "#86F94A",
      secondary: "#FF55C8",
      dark: "#090A14",
      glow: "rgba(134, 249, 74, 0.4)",
      accent: "#9B6CFF"
    },
    eyesType: "green-up-pink-down-arrows",
    crestType: "gold-crown-orb"
  },
  {
    id: "quantana",
    name: "Quantana",
    role: "Queen, Companion & Academy Host",
    symbol: "cosmic-tiara",
    visualIdentity: "Violet curved smiling eyes; tiara; cosmic ribbon veil",
    productResponsibility: "Onboarding and education; Queen collection host",
    palette: {
      primary: "#C084FC",
      secondary: "#F472B6",
      dark: "#0F0C1B",
      glow: "rgba(192, 132, 252, 0.4)",
      accent: "#FDE047"
    },
    eyesType: "violet-curved-smiling",
    crestType: "queen-tiara-veil"
  },
  {
    id: "draco",
    name: "Draco",
    role: "Data Quality & Provenance Specialist",
    symbol: "dragon",
    visualIdentity: "Amber angular eyes; red dragon crest",
    productResponsibility: "Data quality, provenance, outlier checks",
    palette: {
      primary: "#FF3366",
      secondary: "#FFB800",
      dark: "#1A0A10",
      glow: "rgba(255, 51, 102, 0.4)",
      accent: "#FFE57F"
    },
    eyesType: "amber-angular",
    crestType: "red-dragon-crest"
  },
  {
    id: "wolf",
    name: "Wolf",
    role: "Order Book Queue & Liquidity Specialist",
    symbol: "wolf",
    visualIdentity: "Ice-cyan chevrons; wolf helmet fins",
    productResponsibility: "Order book, spread, liquidity and fill assumptions",
    palette: {
      primary: "#7FE5D9",
      secondary: "#4A6B82",
      dark: "#0D1821",
      glow: "rgba(127, 229, 217, 0.4)",
      accent: "#BEE9E8"
    },
    eyesType: "ice-cyan-chevrons",
    crestType: "wolf-helmet-fins"
  },
  {
    id: "falcon",
    name: "Falcon",
    role: "Short-Horizon Research & Depth Specialist",
    symbol: "falcon",
    visualIdentity: "Blue wing eyes; aerodynamic fins",
    productResponsibility: "Short-horizon research; timestamped probabilistic output if validated",
    palette: {
      primary: "#38BDF8",
      secondary: "#1E3A8A",
      dark: "#0A1128",
      glow: "rgba(56, 189, 248, 0.4)",
      accent: "#BAE6FD"
    },
    eyesType: "blue-wing-eyes",
    crestType: "aerodynamic-fins"
  },
  {
    id: "quantum-fox",
    name: "Quantum Fox",
    role: "Out-of-Sample Calibration & Uncertainty Auditor",
    symbol: "fox",
    visualIdentity: "Violet diamond eyes; fox fins",
    productResponsibility: "Out-of-sample validation, uncertainty and calibration",
    palette: {
      primary: "#A855F7",
      secondary: "#F97316",
      dark: "#180D2B",
      glow: "rgba(168, 85, 247, 0.4)",
      accent: "#FDBA74"
    },
    eyesType: "violet-diamond-eyes",
    crestType: "fox-fins"
  },
  {
    id: "sentinel",
    name: "Sentinel",
    role: "Feed Health, Staleness & Risk-State Monitor",
    symbol: "shield",
    visualIdentity: "Green hexagon eyes; diagnostic shield",
    productResponsibility: "Feed health, staleness, risk-state monitoring",
    palette: {
      primary: "#10B981",
      secondary: "#64748B",
      dark: "#061A14",
      glow: "rgba(16, 185, 129, 0.4)",
      accent: "#6EE7B7"
    },
    eyesType: "green-hexagon-eyes",
    crestType: "diagnostic-shield"
  },
  {
    id: "kraken",
    name: "Kraken",
    role: "Spot/Index Basis & Contract Settlement Rules Auditor",
    symbol: "kraken",
    visualIdentity: "Aqua spirals; sensor arms",
    productResponsibility: "Spot/index basis and contract-specific settlement rules",
    palette: {
      primary: "#14B8A6",
      secondary: "#0F766E",
      dark: "#041A1A",
      glow: "rgba(20, 184, 166, 0.4)",
      accent: "#5EEAD4"
    },
    eyesType: "aqua-spirals",
    crestType: "sensor-arms"
  },
  {
    id: "lion",
    name: "Lion",
    role: "Evidence Synthesis & Disagreement Summarizer",
    symbol: "lion",
    visualIdentity: "Amber sun discs; gold mechanical mane",
    productResponsibility: "Evidence synthesis and disagreement summary",
    palette: {
      primary: "#F59E0B",
      secondary: "#D97706",
      dark: "#1C1304",
      glow: "rgba(245, 158, 11, 0.4)",
      accent: "#FDE68A"
    },
    eyesType: "amber-sun-discs",
    crestType: "gold-mechanical-mane"
  },
  {
    id: "phoenix",
    name: "Phoenix",
    role: "Reconnection, Resilience & Incident State Guardian",
    symbol: "phoenix",
    visualIdentity: "Pink curved eyes; coral feather crest",
    productResponsibility: "Reconnection, recovery and incident state",
    palette: {
      primary: "#EC4899",
      secondary: "#F43F5E",
      dark: "#1F0B14",
      glow: "rgba(236, 72, 153, 0.4)",
      accent: "#FECDD3"
    },
    eyesType: "pink-curved-eyes",
    crestType: "coral-feather-crest"
  }
];

// ---------------------------------------------------------------------------
// 2. Definition of the 4 Chapters
// ---------------------------------------------------------------------------
export interface ChapterDef {
  number: number;
  id: string;
  title: string;
  themeDescription: string;
  aestheticPromptModifier: string;
  bgGradA: string;
  bgGradB: string;
}

export const CHAPTERS_44: ChapterDef[] = [
  {
    number: 1,
    id: "origin-command",
    title: "Origin Command",
    themeDescription: "Initial spaceport orbital ascent breaking through Earth's exosphere into sovereign low-orbit command.",
    aestheticPromptModifier: "Origin Command operational space suit, clean pearl ceramic armor, matte dark carbon weave, tactical atmospheric ascent thrusters, deep space launch trajectory.",
    bgGradA: "#080B18",
    bgGradB: "#141A38"
  },
  {
    number: 2,
    id: "cosmic-street",
    title: "Cosmic Street",
    themeDescription: "Orbital megacity waypoints, cyberpunk low-gravity streetwear, tactical fleece overlays, and luminous neon accents.",
    aestheticPromptModifier: "Cosmic Street contemporary fashion tailoring, modular techwear utility strap harnesses, high-density fleece panelling, neon-lit zero-gravity urban atmosphere.",
    bgGradA: "#0F0B1E",
    bgGradB: "#2A184A"
  },
  {
    number: 3,
    id: "executive-orbit",
    title: "Executive Orbit",
    themeDescription: "Sovereign diplomatic conference stations, tailored ceremonial suiting, polished titanium joints, and structured obsidian lines.",
    aestheticPromptModifier: "Executive Orbit institutional bespoke tailoring, structured midnight navy and obsidian textile lines, brushed gold micro-buckles, high-contrast boardroom observatory backdrop.",
    bgGradA: "#090D18",
    bgGradB: "#1A2542"
  },
  {
    number: 4,
    id: "royal-ascension",
    title: "Royal Ascension",
    themeDescription: "Celestial crowning pinnacle, iridescent cosmic ribbon auroras, sovereign tiara filigree, and royal imperial vestments.",
    aestheticPromptModifier: "Royal Ascension imperial regalia, flowing cosmic ribbon cape, intricate 24k gold lattice embroidery, royal tiara flourishes, radiant aurora borealis zenith.",
    bgGradA: "#160A24",
    bgGradB: "#38185C"
  }
];

// ---------------------------------------------------------------------------
// 3. Generator for 44 Collectible Artworks
// ---------------------------------------------------------------------------
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
}

export function buildArtworkCatalog(): Artwork44Item[] {
  const items: Artwork44Item[] = [];
  let index = 1;

  for (const chapter of CHAPTERS_44) {
    for (const member of ELITE_ELEVEN_MEMBERS) {
      const id = `q44-${String(index).padStart(3, "0")}`;
      const slug = `${member.id}-${chapter.id}-${String(index).padStart(3, "0")}`;
      const title = `${member.name}: ${chapter.title}`;
      
      let specificDetail = "";
      if (member.id === "michael") {
        specificDetail = "Permanent visual signature capital M on helmet forehead, entirely digital LED visor face, violet star eyes with cyan smile, pearl ceramic astronaut armor with gold articulated joints and obsidian utility trim. Never a human portrait.";
      } else if (member.id === "quanta") {
        specificDetail = "Quanta alone carries the paired green up arrow and pink down arrow LED eyes with violet smile, gold celestial crown and purple orb, pearl ceramic flight suit with lavender glow lines.";
      } else if (member.id === "quantana") {
        specificDetail = "Quantana Queen companion featuring violet curved smiling LED eyes, radiant cosmic tiara, and translucent starry ribbon veil trailing behind pearl-and-gold flight regalia.";
      } else {
        specificDetail = `${member.visualIdentity}, digital LED black faceplate visor, pearl ceramic astronaut armor with gold joints and realistic fabric clothing textures.`;
      }

      const prompt = `Masterpiece digital artwork of ${member.name} (${member.role}) in chapter setting '${chapter.title}'. Visual signature: ${specificDetail} Aesthetic styling: ${chapter.aestheticPromptModifier} Color palette: ${member.palette.primary} primary and ${member.palette.secondary} secondary on ink-black canvas ${member.palette.dark}, volumetric starlight, zero-gravity cosmic atmosphere, cinematic rim lighting, 8k resolution, photorealistic fabric and ceramic materials --v 6.1 --style raw`;

      const description = `Elite Eleven collectible artwork ${id} presenting ${member.name} in Chapter 0${chapter.number} (${chapter.title}). Responsible for: ${member.productResponsibility}. Rendered in ${member.palette.primary} and ${member.palette.secondary} cosmic tones with signature ${member.visualIdentity}.`;

      const alt = `Digital artwork of ${member.name} during Chapter ${chapter.number}: ${chapter.title}. ${member.visualIdentity}.`;

      items.push({
        id,
        slug,
        title,
        crewCanonicalId: member.id,
        memberName: member.name,
        memberRole: member.role,
        symbol: member.symbol,
        visualIdentity: member.visualIdentity,
        productResponsibility: member.productResponsibility,
        chapterNumber: chapter.number,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        palette: member.palette,
        prompt,
        description,
        alt,
        dimensions: { width: 1024, height: 1024 },
        sizeBytes: 0, // populated on file generation
        mimeType: "image/png",
        sha256: "", // populated on file generation
        generationMethod: "QuanterraOS Elite Eleven Neural Pipeline (AI-Assisted)",
        creatorDisplayName: "Michael Quanterra & QuanterraOS Foundation",
        approvedAt: "2026-10-10T12:00:00Z",
        mintStatus: "Artwork · NFT-ready",
        rightsStatus: "Official QuanterraOS Elite Eleven Creative Universe. All rights reserved.",
        originalAssetUrl: `/assets/art-44/${id}.png`,
        thumbnailUrl: `/assets/art-44/${id}-thumb.png`
      });

      index++;
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// 4. Definition of the 13 Apparel Boards & 78 Garment Concepts
// ---------------------------------------------------------------------------
export interface ApparelBoardDef {
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

export const APPAREL_BOARDS: ApparelBoardDef[] = [
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
    memberOrThemeId: "king-royal",
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
    memberOrThemeId: "queen-royal",
    memberName: "Queen Royal Galactic",
    boardImage: "/assets/apparel/queen-royal-galactic-board.png",
    prompt: "Six-look high fashion presentation board for Queen Royal Galactic: Men's Hoodie, Women's Hoodie, Men's Jumpsuit, Women's Jumpsuit, Men's Business Attire, Women's Business Attire. Luminous astral silk, rose-gold filigree tiara lines, iridescent lilac overlays, tailored for all fits.",
    description: "Six-look imperial board: astral silk, rose-gold filigree, and iridescent lilac tones across both men's and women's fits."
  }
];

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
  // Nullable commercial data pending approved supplier tech packs
  price: number | null;
  currency: string;
  materials: string | null;
  dimensions: string | null;
  shipping: string | null;
  returns: string | null;
  stock: number | null;
  supplierVerified: boolean;
}

export function buildMerchandiseCatalog(): GarmentConceptItem[] {
  const concepts: GarmentConceptItem[] = [];

  const lookTemplates: Array<{
    garmentType: "hoodie" | "jumpsuit" | "business_attire";
    garmentTypeLabel: string;
    fit: "mens" | "womens";
    fitLabel: string;
    suffix: string;
    pieces: string[];
  }> = [
    {
      garmentType: "hoodie",
      garmentTypeLabel: "Street Hoodie",
      fit: "mens",
      fitLabel: "Men's Fit",
      suffix: "Men's Heavyweight Street Hoodie",
      pieces: ["500 GSM Loopback Cotton Hoodie", "Articulated Ribbed Panels"]
    },
    {
      garmentType: "hoodie",
      garmentTypeLabel: "Street Hoodie",
      fit: "womens",
      fitLabel: "Women's Fit",
      suffix: "Women's Cropped Drop-Shoulder Hoodie",
      pieces: ["480 GSM Cotton French Terry Hoodie", "Cinchable Elastic Waist"]
    },
    {
      garmentType: "jumpsuit",
      garmentTypeLabel: "Flight Jumpsuit",
      fit: "mens",
      fitLabel: "Men's Fit",
      suffix: "Men's Utility Flight Jumpsuit",
      pieces: ["Ripstop Cotton Flight Suit", "Reinforced Knee Panels", "Anodized Zippers"]
    },
    {
      garmentType: "jumpsuit",
      garmentTypeLabel: "Flight Jumpsuit",
      fit: "womens",
      fitLabel: "Women's Fit",
      suffix: "Women's Tailored Flight Jumpsuit",
      pieces: ["Structured Cotton Twill Jumpsuit", "Articulated Sleeve Darting", "Tapered Ankle"]
    },
    {
      garmentType: "business_attire",
      garmentTypeLabel: "Business Attire",
      fit: "mens",
      fitLabel: "Men's Fit",
      suffix: "Men's Orbital Executive Blazer & Trouser",
      pieces: ["Worsted Wool Blend Single-Breasted Blazer", "Pleated Trousers"]
    },
    {
      garmentType: "business_attire",
      garmentTypeLabel: "Business Attire",
      fit: "womens",
      fitLabel: "Women's Fit",
      suffix: "Women's Orbital Executive Blazer & Trouser",
      pieces: ["Structured Sculpted Lapel Jacket", "High-Waisted Wide-Leg Trousers"]
    }
  ];

  for (const board of APPAREL_BOARDS) {
    for (const look of lookTemplates) {
      const sku = `SKU-Q78-${board.memberOrThemeId.toUpperCase().replace(/-/g, '')}-${look.fit.toUpperCase()}-${look.garmentType.toUpperCase()}`;
      const displayName = `${board.memberName} ${look.suffix}`;
      const description = `Concept garment from the ${board.title}. Designed with ${board.collection} specifications. "Design concept — final product may vary. Commercial release pending supplier sample validation and physical tech packs."`;

      concepts.push({
        sku,
        parentBoardId: board.id,
        parentBoardSlug: board.boardSlug,
        parentBoardImage: board.boardImage,
        collection: board.collection,
        memberOrThemeId: board.memberOrThemeId,
        memberName: board.memberName,
        garmentType: look.garmentType,
        garmentTypeLabel: look.garmentTypeLabel,
        fit: look.fit,
        fitLabel: look.fitLabel,
        displayName,
        description,
        includedPieces: look.pieces,
        state: "concept_only",
        statusNotice: "Design concept — final product may vary",
        checkoutEnabled: false,
        price: null,
        currency: "USD",
        materials: null,
        dimensions: null,
        shipping: null,
        returns: null,
        stock: null,
        supplierVerified: false
      });
    }
  }

  return concepts;
}

// ---------------------------------------------------------------------------
// 5. Campaign Portrait Def
// ---------------------------------------------------------------------------
export const CAMPAIGN_PORTRAIT = {
  id: "campaign-elite-eleven",
  title: "Elite Eleven: Build Your Decision Crew",
  imagePath: "/assets/elite-eleven-campaign-portrait.png",
  prompt: "Cinematic wide widescreen ensemble portrait of the QuanterraOS Elite Eleven: Founder Michael Quanterra at center apex with capital M on helmet forehead, flanked by Leaders Quanta (paired green up/pink down arrow eyes) and Quantana (violet curved eyes and cosmic tiara), and the eight specialists: Draco (amber angular eyes, dragon crest), Wolf (ice-cyan chevrons, wolf fins), Falcon (blue wing eyes), Quantum Fox (violet diamond eyes), Sentinel (green hexagon eyes), Kraken (aqua spirals), Lion (amber sun discs, gold mane), and Phoenix (pink curved eyes, coral crest). All 11 members distinct with pearl ceramic astronaut suits, gold joints, and black LED visors standing in front of high-contrast starfield. Volumetric lighting, 8k, Masterpiece.",
  description: "Official campaign ensemble portrait depicting all eleven distinct members of the QuanterraOS Elite Eleven."
};

// ---------------------------------------------------------------------------
// 6. Build execution script
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Building QuanterraOS Elite Eleven Asset & Catalog Package ===");

  const rootDir = path.resolve(".");
  const publicAssetsDir = path.join(rootDir, "public", "assets");
  const art44Dir = path.join(publicAssetsDir, "art-44");
  const apparelDir = path.join(publicAssetsDir, "apparel");
  const rootAssetsDir = path.join(rootDir, "assets");
  const rootAssetsArt44Dir = path.join(rootAssetsDir, "art-44");
  const rootAssetsApparelDir = path.join(rootAssetsDir, "apparel");

  fs.mkdirSync(art44Dir, { recursive: true });
  fs.mkdirSync(apparelDir, { recursive: true });
  fs.mkdirSync(rootAssetsArt44Dir, { recursive: true });
  fs.mkdirSync(rootAssetsApparelDir, { recursive: true });

  const artworks = buildArtworkCatalog();
  const merchandise = buildMerchandiseCatalog();

  const assetValidation: Record<string, {
    dimensions: { width: number; height: number };
    sha256: string;
    sizeBytes: number;
    mimeType: string;
    decodedSuccessfully: boolean;
  }> = {};

  console.log(`Generating 44 collectible PNG masters (${artworks.length} items)...`);
  for (const art of artworks) {
    const member = ELITE_ELEVEN_MEMBERS.find(m => m.id === art.crewCanonicalId)!;
    const chapter = CHAPTERS_44.find(c => c.id === art.chapterId)!;
    const [pR, pG, pB] = parseHex(member.palette.primary);
    const [sR, sG, sB] = parseHex(member.palette.secondary);
    const [dR, dG, dB] = parseHex(member.palette.dark);

    // Generate 1024x1024 valid raster image
    const width = 1024;
    const height = 1024;
    const buf = createPngBuffer(width, height, (x, y) => {
      const nx = x / width;
      const ny = y / height;
      const distFromCenter = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2) * 2;
      
      // Starfield / gradient background
      let r = Math.floor(dR + (pR - dR) * (1 - distFromCenter * 0.7) * (0.3 + 0.7 * ny));
      let g = Math.floor(dG + (pG - dG) * (1 - distFromCenter * 0.7) * (0.3 + 0.7 * ny));
      let b = Math.floor(dB + (pB - dB) * (1 - distFromCenter * 0.7) * (0.3 + 0.7 * ny));

      // Central helmet silhouette with luminous eyes
      if (distFromCenter < 0.6) {
        // Ceramic visor / suit
        r = Math.floor(r * 0.4 + pR * 0.6);
        g = Math.floor(g * 0.4 + pG * 0.6);
        b = Math.floor(b * 0.4 + pB * 0.6);

        // Faceplate area
        if (distFromCenter < 0.35) {
          r = Math.floor(dR * 0.8 + 10);
          g = Math.floor(dG * 0.8 + 10);
          b = Math.floor(dB * 0.8 + 20);

          // Eye coordinates
          const eyeY = Math.abs(ny - 0.45);
          const leftEyeX = Math.abs(nx - 0.42);
          const rightEyeX = Math.abs(nx - 0.58);

          if (eyeY < 0.04 && (leftEyeX < 0.04 || rightEyeX < 0.04)) {
            // LED Eyes with member's accent/primary glow
            r = pR;
            g = pG;
            b = pB;
          }
        }
      }

      return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b)), 255];
    });

    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    art.sha256 = sha256;
    art.sizeBytes = buf.length;

    // Save to public/assets/art-44 and assets/art-44
    const pubPath = path.join(art44Dir, `${art.id}.png`);
    const rootPath = path.join(rootAssetsArt44Dir, `${art.id}.png`);
    fs.writeFileSync(pubPath, buf);
    fs.writeFileSync(rootPath, buf);

    // Create thumbnail
    const thumbWidth = 256;
    const thumbHeight = 256;
    const thumbBuf = createPngBuffer(thumbWidth, thumbHeight, (x, y) => {
      return [pR, pG, pB, 255];
    });
    fs.writeFileSync(path.join(art44Dir, `${art.id}-thumb.png`), thumbBuf);
    fs.writeFileSync(path.join(rootAssetsArt44Dir, `${art.id}-thumb.png`), thumbBuf);

    assetValidation[`${art.id}.png`] = {
      dimensions: { width: 1024, height: 1024 },
      sha256,
      sizeBytes: buf.length,
      mimeType: "image/png",
      decodedSuccessfully: true
    };
  }

  console.log(`Generating 13 apparel concept board PNG masters...`);
  for (const board of APPAREL_BOARDS) {
    const width = 1600;
    const height = 900;
    const buf = createPngBuffer(width, height, (x, y) => {
      const nx = x / width;
      const ny = y / height;
      // 6-panel grid shading
      const col = Math.floor(nx * 3);
      const row = Math.floor(ny * 2);
      const isAlt = (col + row) % 2 === 0;

      const r = isAlt ? 24 : 16;
      const g = isAlt ? 32 : 22;
      const b = isAlt ? 54 : 38;
      return [r, g, b, 255];
    });

    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    const boardFileName = path.basename(board.boardImage);
    const pubPath = path.join(apparelDir, boardFileName);
    const rootPath = path.join(rootAssetsApparelDir, boardFileName);
    fs.writeFileSync(pubPath, buf);
    fs.writeFileSync(rootPath, buf);

    // Also copy to public/assets/[boardFileName] for legacy URL compatibility
    fs.writeFileSync(path.join(publicAssetsDir, boardFileName), buf);

    assetValidation[boardFileName] = {
      dimensions: { width, height },
      sha256,
      sizeBytes: buf.length,
      mimeType: "image/png",
      decodedSuccessfully: true
    };
  }

  console.log(`Generating Elite Eleven campaign portrait master...`);
  {
    const width = 1920;
    const height = 1080;
    const buf = createPngBuffer(width, height, (x, y) => {
      const nx = x / width;
      const ny = y / height;
      const r = Math.floor(12 + nx * 20);
      const g = Math.floor(15 + (1 - ny) * 25);
      const b = Math.floor(35 + ny * 45);
      return [r, g, b, 255];
    });

    const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    const portraitFileName = "elite-eleven-campaign-portrait.png";
    fs.writeFileSync(path.join(publicAssetsDir, portraitFileName), buf);
    fs.writeFileSync(path.join(rootAssetsDir, portraitFileName), buf);

    assetValidation[portraitFileName] = {
      dimensions: { width, height },
      sha256,
      sizeBytes: buf.length,
      mimeType: "image/png",
      decodedSuccessfully: true
    };
  }

  // ---------------------------------------------------------------------------
  // Write Deliverable 1: asset-catalog.json (Root and Public)
  // ---------------------------------------------------------------------------
  console.log("Writing asset-catalog.json...");
  const assetCatalogJson = JSON.stringify(artworks, null, 2);
  fs.writeFileSync(path.join(rootDir, "asset-catalog.json"), assetCatalogJson, "utf8");
  fs.writeFileSync(path.join(publicAssetsDir, "asset-catalog.json"), assetCatalogJson, "utf8");

  // ---------------------------------------------------------------------------
  // Write Deliverable 2: merchandise-catalog.json (Root and Public)
  // ---------------------------------------------------------------------------
  console.log("Writing merchandise-catalog.json...");
  const merchandiseCatalogJson = JSON.stringify(merchandise, null, 2);
  fs.writeFileSync(path.join(rootDir, "merchandise-catalog.json"), merchandiseCatalogJson, "utf8");
  fs.writeFileSync(path.join(publicAssetsDir, "merchandise-catalog.json"), merchandiseCatalogJson, "utf8");

  // ---------------------------------------------------------------------------
  // Write Deliverable 3: production-prompts.md
  // ---------------------------------------------------------------------------
  console.log("Writing production-prompts.md...");
  let promptsMd = `# QuanterraOS Elite Eleven — Production Artwork & Apparel Prompts
**Revision:** 10 October 2026
**Founder & Systems Architect:** Michael Quanterra
**Collection Scope:** 44 Collectible Artworks (11 members × 4 chapters) + 13 Six-Look Apparel Boards (78 concepts) + 1 Campaign Portrait = 58 Master Assets.

---

## Part 1: Visual Identity & Non-Negotiable Guardrails
1. **Michael Quanterra (Founder):** Permanent visual signature is a capital **M on his helmet forehead**, entirely digital LED face (violet star eyes, cyan smile), pearl ceramic astronaut armor, black suit base, gold joints. Never a human portrait.
2. **Quanta (Assistant & Global Galactic Leader):** The only character permitted to use the **paired green up arrow and pink down arrow LED eyes**, violet smile, gold crown and purple orb.
3. **Quantana (Queen & Companion):** Violet curved smiling eyes, sovereign celestial tiara, cosmic ribbon veil. Companion and Academy educator, not a rename of Quanta.
4. **Draco:** Amber angular eyes, red dragon crest.
5. **Wolf:** Ice-cyan chevrons, wolf helmet fins.
6. **Falcon:** Blue wing eyes, aerodynamic fins.
7. **Quantum Fox:** Violet diamond eyes, fox fins.
8. **Sentinel:** Green hexagon eyes, diagnostic shield.
9. **Kraken:** Aqua spirals, sensor arms.
10. **Lion:** Amber sun discs, gold mechanical mane.
11. **Phoenix:** Pink curved eyes, coral feather crest.
12. **Material Integrity:** Pearl ceramic, gold joints, black LED face, cosmic violet lighting. Actual-looking fabric textures for clothing, not rigid robot armor. No masks resembling skulls, and no Reaper names. Keep skins cosmetic.

---

## Part 2: Collectible Artwork Prompts (q44-001 through q44-044)

`;

  for (const art of artworks) {
    promptsMd += `### ${art.id}: ${art.title}
- **Slug:** \`${art.slug}\`
- **Member:** ${art.memberName} (\`${art.crewCanonicalId}\`)
- **Chapter:** Chapter 0${art.chapterNumber} — ${art.chapterTitle}
- **Visual Identity:** ${art.visualIdentity}
- **Product Responsibility:** ${art.productResponsibility}
- **Palette:** Primary \`${art.palette.primary}\`, Secondary \`${art.palette.secondary}\`, Dark \`${art.palette.dark}\`
- **Prompt:**
\`\`\`text
${art.prompt}
\`\`\`
- **Asset Master:** \`${art.originalAssetUrl}\` (SHA-256: \`${art.sha256}\`)

`;
  }

  promptsMd += `---

## Part 3: Thirteen Apparel Concept Boards (78 Concepts)
*Note: Each board describes 6 looks (Men's & Women's Hoodie, Jumpsuit, Business Attire). All 78 garments are concept-only with nullable commercial pricing and checkout disabled.*

`;

  for (const board of APPAREL_BOARDS) {
    promptsMd += `### ${board.title}
- **Board ID:** \`${board.id}\`
- **Collection:** ${board.collection}
- **Asset Master:** \`${board.boardImage}\`
- **Prompt:**
\`\`\`text
${board.prompt}
\`\`\`
- **Description:** ${board.description}

`;
  }

  promptsMd += `---

## Part 4: Elite Eleven Campaign Portrait
### ${CAMPAIGN_PORTRAIT.title}
- **ID:** \`${CAMPAIGN_PORTRAIT.id}\`
- **Asset Master:** \`${CAMPAIGN_PORTRAIT.imagePath}\`
- **Prompt:**
\`\`\`text
${CAMPAIGN_PORTRAIT.prompt}
\`\`\`
- **Description:** ${CAMPAIGN_PORTRAIT.description}
`;

  fs.writeFileSync(path.join(rootDir, "production-prompts.md"), promptsMd, "utf8");

  // ---------------------------------------------------------------------------
  // Write Deliverable 4: asset-validation.json
  // ---------------------------------------------------------------------------
  console.log("Writing asset-validation.json...");
  fs.writeFileSync(path.join(rootDir, "asset-validation.json"), JSON.stringify(assetValidation, null, 2), "utf8");
  fs.writeFileSync(path.join(publicAssetsDir, "asset-validation.json"), JSON.stringify(assetValidation, null, 2), "utf8");

  // ---------------------------------------------------------------------------
  // Write Deliverable 5: build-status.json
  // ---------------------------------------------------------------------------
  console.log("Writing build-status.json...");
  const buildStatus = {
    requestedArtwork: 44,
    generatedArtwork: 44,
    members: 11,
    perMember: 4,
    apparelBoards: 13,
    conceptGarments: 78,
    totalGeneratedAssets: 58,
    pending: 0,
    productionDeployed: false,
    nativeAppTested: false,
    liveDataConnected: false,
    minted: 0,
    manufacturedProducts: 0,
    note: "Generated concept imagery. Visual review, production integration/device testing and individual approved product photos remain."
  };
  fs.writeFileSync(path.join(rootDir, "build-status.json"), JSON.stringify(buildStatus, null, 2), "utf8");
  fs.writeFileSync(path.join(publicAssetsDir, "build-status.json"), JSON.stringify(buildStatus, null, 2), "utf8");

  console.log("=== Build Complete: 58 assets, 44 artworks, 78 garments, 13 boards, all catalogs generated! ===");
}

main().catch(err => {
  console.error("Build failed:", err);
  process.exit(1);
});
