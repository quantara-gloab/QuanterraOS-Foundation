/**
 * QuanterraOS: The Elite Eleven Roster & Product Identity Registry
 *
 * Implements:
 * - Exactly eleven members: Founder Michael Quanterra + Leaders Quanta & Quantana + 8 Specialists
 * - Visual identities (helmets, LED eyes, crests, suit fabrics)
 * - Actual product responsibilities bound to tested code, explicit inputs and outputs
 * - Quanta on every page with restrained outfits
 * - Cockpit crew assembly rules (Quanta fixed guide; Draco, Wolf, Kraken, Sentinel default; up to all 8 specialists)
 */

export interface VisualIdentityDetails {
  summary: string;
  helmetSymbol: string;
  faceStyle: string;
  eyeStyle: string;
  crestType?: string;
  toString(): string;
  toJSON(): string;
}

function createVisualIdentity(
  summary: string,
  details: {
    helmetSymbol: string;
    faceStyle: string;
    eyeStyle: string;
    crestType?: string;
  }
): VisualIdentityDetails {
  return {
    summary,
    helmetSymbol: details.helmetSymbol,
    faceStyle: details.faceStyle,
    eyeStyle: details.eyeStyle,
    crestType: details.crestType,
    toString() {
      return this.summary;
    },
    toJSON() {
      return this.summary;
    },
  };
}

export interface EliteCrewMember {
  id: string;
  canonicalId: string;
  name: string;
  category: "founder" | "leader" | "specialist";
  title: string;
  role: string;
  visualIdentity: VisualIdentityDetails;
  helmetIdentity: string;
  eyesDescription: string;
  smileDescription?: string;
  suitMaterials: string;
  productResponsibility: string;
  stationType: "story" | "assistant" | "education" | "data_quality" | "orderbook" | "research" | "calibration" | "feed_health" | "settlement" | "synthesis" | "recovery";
  cockpitDefaultEquipped: boolean;
  avatarImage: string;
  palette: {
    primary: string;
    secondary: string;
    dark: string;
    glow: string;
    accent: string;
  };
}

export const ELITE_ELEVEN_REGISTRY: EliteCrewMember[] = [
  {
    id: "michael-quanterra",
    canonicalId: "michael",
    name: "Michael Quanterra",
    category: "founder",
    title: "Founder, Creator & Systems Architect",
    role: "Founder & Creator",
    visualIdentity: createVisualIdentity(
      "M helmet forehead; violet star eyes; cyan smile; black/pearl/gold founder suit",
      {
        helmetSymbol: "Capital M on helmet forehead",
        faceStyle: "Entirely digital LED face",
        eyeStyle: "Violet star eyes",
        crestType: "Capital M helmet crest",
      }
    ),
    helmetIdentity: "Permanent visual signature capital M on helmet forehead, entirely digital LED face. Never a human portrait.",
    eyesDescription: "Violet star eyes",
    smileDescription: "Cyan smile",
    suitMaterials: "Black/pearl ceramic suit with gold articulated joints and obsidian utility trim",
    productResponsibility: "Founder story and provenance. Brand character, not a trading engine",
    stationType: "story",
    cockpitDefaultEquipped: false,
    avatarImage: "/assets/art-44/q44-001.png",
    palette: {
      primary: "#9B6CFF",
      secondary: "#CBFF69",
      dark: "#090A14",
      glow: "rgba(155, 108, 255, 0.5)",
      accent: "#DFB843"
    }
  },
  {
    id: "quanta",
    canonicalId: "quanta",
    name: "Quanta",
    category: "leader",
    title: "Virtual Assistant & Global Galactic Leader",
    role: "Assistant & Global Galactic Leader",
    visualIdentity: createVisualIdentity(
      "Green up arrow and pink down arrow together; violet smile; gold crown/purple orb",
      {
        helmetSymbol: "Gold crown and purple orb",
        faceStyle: "Entirely digital LED face",
        eyeStyle: "Green up arrow and pink down arrow together",
        crestType: "Crown and orb",
      }
    ),
    helmetIdentity: "Quanta alone carries the paired green up arrow and pink down arrow LED eyes, violet smile, gold crown and purple orb.",
    eyesDescription: "Green up arrow and pink down arrow together",
    smileDescription: "Violet smile",
    suitMaterials: "Pearl ceramic flight suit with lavender glow lines and actual fabric accents",
    productResponsibility: "Assistant, orchestration and explanation",
    stationType: "assistant",
    cockpitDefaultEquipped: true, // Fixed guide in Cockpit
    avatarImage: "/assets/art-44/q44-002.png",
    palette: {
      primary: "#86F94A",
      secondary: "#FF55C8",
      dark: "#090A14",
      glow: "rgba(134, 249, 74, 0.4)",
      accent: "#9B6CFF"
    }
  },
  {
    id: "quantana",
    canonicalId: "quantana",
    name: "Quantana",
    category: "leader",
    title: "Queen, Companion & Academy Host",
    role: "Queen & Companion",
    visualIdentity: createVisualIdentity(
      "Violet curved smiling eyes; tiara; cosmic ribbon veil",
      {
        helmetSymbol: "Celestial tiara and cosmic ribbon veil",
        faceStyle: "Entirely digital LED face",
        eyeStyle: "Violet curved smiling eyes",
        crestType: "Celestial tiara",
      }
    ),
    helmetIdentity: "Queen companion featuring violet curved smiling LED eyes, radiant celestial tiara, and cosmic ribbon veil. Not a rename of Quanta.",
    eyesDescription: "Violet curved smiling eyes",
    suitMaterials: "Pearl ceramic and astral silk regalia with rose-gold filigree",
    productResponsibility: "Onboarding and education; Queen collection host",
    stationType: "education",
    cockpitDefaultEquipped: false,
    avatarImage: "/assets/art-44/q44-003.png",
    palette: {
      primary: "#C084FC",
      secondary: "#F472B6",
      dark: "#0F0C1B",
      glow: "rgba(192, 132, 252, 0.4)",
      accent: "#FDE047"
    }
  },
  {
    id: "draco",
    canonicalId: "draco",
    name: "Draco",
    category: "specialist",
    title: "Data Quality & Anomaly Specialist",
    role: "Data Quality Specialist",
    visualIdentity: createVisualIdentity(
      "Amber angular eyes; red dragon crest",
      {
        helmetSymbol: "Red dragon crest",
        faceStyle: "Digital LED face",
        eyeStyle: "Amber angular eyes",
        crestType: "Red dragon crest",
      }
    ),
    helmetIdentity: "Aggressive aerodynamic helmet with red dragon crest and amber angular LED eyes.",
    eyesDescription: "Amber angular eyes",
    suitMaterials: "Crimson thermal plates with reinforced carbon joints",
    productResponsibility: "Data quality, provenance, outlier checks",
    stationType: "data_quality",
    cockpitDefaultEquipped: true, // Default 1 of 4
    avatarImage: "/assets/art-44/q44-004.png",
    palette: {
      primary: "#FF3366",
      secondary: "#FFB800",
      dark: "#1A0A10",
      glow: "rgba(255, 51, 102, 0.4)",
      accent: "#FFE57F"
    }
  },
  {
    id: "wolf",
    canonicalId: "wolf",
    name: "Wolf",
    category: "specialist",
    title: "Order Book Queue & Liquidity Specialist",
    role: "Liquidity Specialist",
    visualIdentity: createVisualIdentity(
      "Ice-cyan chevrons; wolf helmet fins",
      {
        helmetSymbol: "Wolf helmet fins",
        faceStyle: "Digital LED face",
        eyeStyle: "Ice-cyan chevrons",
        crestType: "Wolf fins",
      }
    ),
    helmetIdentity: "Streamlined helmet with swept-back wolf aerodynamic fins and ice-cyan chevron LED eyes.",
    eyesDescription: "Ice-cyan chevrons",
    suitMaterials: "Matte slate utility suit with cryo-coolant micro-tubing",
    productResponsibility: "Order book, spread, liquidity and fill assumptions",
    stationType: "orderbook",
    cockpitDefaultEquipped: true, // Default 2 of 4
    avatarImage: "/assets/art-44/q44-005.png",
    palette: {
      primary: "#00E5FF",
      secondary: "#7C4DFF",
      dark: "#06131D",
      glow: "rgba(0, 229, 255, 0.4)",
      accent: "#E0F7FA"
    }
  },
  {
    id: "falcon",
    canonicalId: "falcon",
    name: "Falcon",
    category: "specialist",
    title: "Short-Horizon Research & Depth Specialist",
    role: "Research Specialist",
    visualIdentity: createVisualIdentity(
      "Blue wing eyes; aerodynamic fins",
      {
        helmetSymbol: "Aerodynamic fins",
        faceStyle: "Digital LED face",
        eyeStyle: "Blue wing eyes",
        crestType: "Falcon wing fins",
      }
    ),
    helmetIdentity: "Supersonic aerodynamic visor with wing-tip sensor fins and electric blue wing LED eyes.",
    eyesDescription: "Electric blue wing eyes",
    suitMaterials: "Lightweight pearl ceramic with blue aero-stabilizers",
    productResponsibility: "Short-horizon research; timestamped probabilistic output if validated",
    stationType: "research",
    cockpitDefaultEquipped: false,
    avatarImage: "/assets/art-44/q44-006.png",
    palette: {
      primary: "#2979FF",
      secondary: "#00E676",
      dark: "#081024",
      glow: "rgba(41, 121, 255, 0.4)",
      accent: "#B9F6CA"
    }
  },
  {
    id: "quantum-fox",
    canonicalId: "quantum-fox",
    name: "Quantum Fox",
    category: "specialist",
    title: "Calibration & Out-of-Sample Auditor",
    role: "Validation Specialist",
    visualIdentity: createVisualIdentity(
      "Violet diamond eyes; fox fins",
      {
        helmetSymbol: "Fox fins",
        faceStyle: "Digital LED face",
        eyeStyle: "Violet diamond eyes",
        crestType: "Quantum fox fins",
      }
    ),
    helmetIdentity: "Agile modular helmet with dual antenna ear fins and violet diamond LED eyes.",
    eyesDescription: "Violet diamond eyes",
    suitMaterials: "Violet woven carbon fleece with copper grounding strips",
    productResponsibility: "Out-of-sample validation, uncertainty and calibration",
    stationType: "calibration",
    cockpitDefaultEquipped: false,
    avatarImage: "/assets/art-44/q44-007.png",
    palette: {
      primary: "#A855F7",
      secondary: "#FB923C",
      dark: "#140924",
      glow: "rgba(168, 85, 247, 0.4)",
      accent: "#FED7AA"
    }
  },
  {
    id: "sentinel",
    canonicalId: "sentinel",
    name: "Sentinel",
    category: "specialist",
    title: "Feed Health, Staleness & Risk-State Monitor",
    role: "Feed Monitor Specialist",
    visualIdentity: createVisualIdentity(
      "Green hexagon eyes; diagnostic shield",
      {
        helmetSymbol: "Diagnostic shield",
        faceStyle: "Digital LED face",
        eyeStyle: "Green hexagon eyes",
        crestType: "Diagnostic shield crest",
      }
    ),
    helmetIdentity: "Reinforced blast-shield visor with tactical status HUD and emerald green hexagon LED eyes.",
    eyesDescription: "Green hexagon eyes",
    suitMaterials: "Heavy ballistic ceramic plates with diagnostic fiber-optic weave",
    productResponsibility: "Feed health, staleness, risk-state monitoring",
    stationType: "feed_health",
    cockpitDefaultEquipped: true, // Default 3 of 4
    avatarImage: "/assets/art-44/q44-008.png",
    palette: {
      primary: "#10B981",
      secondary: "#06B6D4",
      dark: "#061A14",
      glow: "rgba(16, 185, 129, 0.4)",
      accent: "#A7F3D0"
    }
  },
  {
    id: "kraken",
    canonicalId: "kraken",
    name: "Kraken",
    category: "specialist",
    title: "Spot/Index Basis & Contract Settlement Rules Auditor",
    role: "Settlement Specialist",
    visualIdentity: createVisualIdentity(
      "Aqua spirals; sensor arms",
      {
        helmetSymbol: "Sensor arms",
        faceStyle: "Digital LED face",
        eyeStyle: "Aqua spirals",
        crestType: "Kraken sensor arms",
      }
    ),
    helmetIdentity: "Deep-submersible helmet with atmospheric sensor arms and hypnotic aqua spiral LED eyes.",
    eyesDescription: "Aqua spiral eyes",
    suitMaterials: "Hydrophobic dark teal shell with pressurized joint seals",
    productResponsibility: "Spot/index basis and contract-specific settlement rules",
    stationType: "settlement",
    cockpitDefaultEquipped: true, // Default 4 of 4
    avatarImage: "/assets/art-44/q44-009.png",
    palette: {
      primary: "#06B6D4",
      secondary: "#6366F1",
      dark: "#05161C",
      glow: "rgba(6, 182, 212, 0.4)",
      accent: "#CFFAFE"
    }
  },
  {
    id: "lion",
    canonicalId: "lion",
    name: "Lion",
    category: "specialist",
    title: "Evidence Synthesis & Disagreement Summarizer",
    role: "Synthesis Specialist",
    visualIdentity: createVisualIdentity(
      "Amber sun discs; gold mechanical mane",
      {
        helmetSymbol: "Gold mechanical mane",
        faceStyle: "Digital LED face",
        eyeStyle: "Amber sun discs",
        crestType: "Mechanical solar mane",
      }
    ),
    helmetIdentity: "Command helmet framed by articulating gold radiator vane collar resembling a mechanical solar mane, with amber sun-disc LED eyes.",
    eyesDescription: "Amber sun disc eyes",
    suitMaterials: "Gold-threaded ballistic mesh with polished brass shoulder cowls",
    productResponsibility: "Evidence synthesis and disagreement summary",
    stationType: "synthesis",
    cockpitDefaultEquipped: false,
    avatarImage: "/assets/art-44/q44-010.png",
    palette: {
      primary: "#F59E0B",
      secondary: "#EC4899",
      dark: "#1F1304",
      glow: "rgba(245, 158, 11, 0.4)",
      accent: "#FDE68A"
    }
  },
  {
    id: "phoenix",
    canonicalId: "phoenix",
    name: "Phoenix",
    category: "specialist",
    title: "Reconnection, Resilience & Incident State Guardian",
    role: "Recovery Specialist",
    visualIdentity: createVisualIdentity(
      "Pink curved eyes; coral feather crest",
      {
        helmetSymbol: "Coral feather crest",
        faceStyle: "Digital LED face",
        eyeStyle: "Pink curved eyes",
        crestType: "Coral feather crest",
      }
    ),
    helmetIdentity: "Thermal-cycling helmet with crest of heat-dissipation feathers and resilient coral-pink curved LED eyes.",
    eyesDescription: "Pink curved eyes",
    suitMaterials: "Ablative ceramic shell with radiant thermal micro-channels",
    productResponsibility: "Reconnection, recovery and incident state",
    stationType: "recovery",
    cockpitDefaultEquipped: false,
    avatarImage: "/assets/art-44/q44-011.png",
    palette: {
      primary: "#EC4899",
      secondary: "#F97316",
      dark: "#200612",
      glow: "rgba(236, 72, 153, 0.4)",
      accent: "#FCE7F3"
    }
  }
];

export function getEliteElevenMember(id: string): EliteCrewMember | undefined {
  const norm = id.toLowerCase().trim();
  return ELITE_ELEVEN_REGISTRY.find(m =>
    m.id.toLowerCase() === norm ||
    m.canonicalId.toLowerCase() === norm ||
    (norm === "michael" && m.id === "michael-quanterra") ||
    (norm === "michael-quanterra" && m.canonicalId === "michael")
  );
}

export function getFounder(): EliteCrewMember {
  return ELITE_ELEVEN_REGISTRY.find(m => m.category === "founder")!;
}

export function getLeaders(): EliteCrewMember[] {
  return ELITE_ELEVEN_REGISTRY.filter(m => m.category === "leader");
}

export function getSpecialists(): EliteCrewMember[] {
  return ELITE_ELEVEN_REGISTRY.filter(m => m.category === "specialist");
}

export interface QuantaGuideConfig {
  chapter: string;
  outfitName: string;
  styleVariant: "compact" | "dock" | "inline" | "drawer";
  badge: string;
  greeting: string;
}

export const QUANTA_PAGE_GUIDES: Record<string, QuantaGuideConfig> = {
  "/": {
    chapter: "Origin Command",
    outfitName: "Origin Command",
    styleVariant: "compact",
    badge: "Origin Flight Suit",
    greeting: "Welcome to QuanterraOS. Assemble your crew and inspect real contract data before you act."
  },
  "home": {
    chapter: "Origin Command",
    outfitName: "Origin Command",
    styleVariant: "compact",
    badge: "Origin Flight Suit",
    greeting: "Welcome to QuanterraOS. Assemble your crew and inspect real contract data before you act."
  },
  "/cockpit": {
    chapter: "Origin Command",
    outfitName: "Origin Flight Suit",
    styleVariant: "dock",
    badge: "Cockpit Navigation Guide",
    greeting: "Quanterra Cockpit: Select a market and equip specialist stations to examine fees, order books, and settlement rules."
  },
  "cockpit": {
    chapter: "Origin Command",
    outfitName: "Origin Flight Suit",
    styleVariant: "dock",
    badge: "Cockpit Navigation Guide",
    greeting: "Quanterra Cockpit: Select a market and equip specialist stations to examine fees, order books, and settlement rules."
  },
  "/crew": {
    chapter: "Executive Orbit",
    outfitName: "Executive Orbit",
    styleVariant: "compact",
    badge: "Executive Diplomatic",
    greeting: "Meet the QuanterraOS Fighter Pilots: eleven distinct identities, each bound to specific verifiable tools."
  },
  "crew": {
    chapter: "Executive Orbit",
    outfitName: "Executive Orbit",
    styleVariant: "compact",
    badge: "Executive Diplomatic",
    greeting: "Meet the QuanterraOS Fighter Pilots: eleven distinct identities, each bound to specific verifiable tools."
  },
  "/art-gallery": {
    chapter: "Cosmic Street",
    outfitName: "Cosmic Street",
    styleVariant: "compact",
    badge: "Streetwear Utility",
    greeting: "The 44 — QuanterraOS Fighter Pilots collectible artworks across four cosmic chapters. Unminted concept masters."
  },
  "art-gallery": {
    chapter: "Cosmic Street",
    outfitName: "Cosmic Street",
    styleVariant: "compact",
    badge: "Streetwear Utility",
    greeting: "The 44 — QuanterraOS Fighter Pilots collectible artworks across four cosmic chapters. Unminted concept masters."
  },
  "/gear": {
    chapter: "Cosmic Street",
    outfitName: "Apparel Preview Host",
    styleVariant: "inline",
    badge: "Apparel Host",
    greeting: "78 design concepts across 13 apparel boards. Commercial checkout remains disabled until physical sample approval."
  },
  "gear": {
    chapter: "Cosmic Street",
    outfitName: "Apparel Preview Host",
    styleVariant: "inline",
    badge: "Apparel Host",
    greeting: "78 design concepts across 13 apparel boards. Commercial checkout remains disabled until physical sample approval."
  },
  "/merchandise": {
    chapter: "Cosmic Street",
    outfitName: "Apparel Preview Host",
    styleVariant: "inline",
    badge: "Apparel Host",
    greeting: "78 design concepts across 13 apparel boards. Commercial checkout remains disabled until physical sample approval."
  },
  "/pricing": {
    chapter: "Executive Orbit",
    outfitName: "Executive Orbit",
    styleVariant: "compact",
    badge: "Executive Advisory",
    greeting: "Independent pricing for research tools. No trading volume requirements, no hidden fees."
  },
  "/learn": {
    chapter: "Origin Command",
    outfitName: "Instructor Origin",
    styleVariant: "compact",
    badge: "Flight School Instructor",
    greeting: "Learn how event contracts settle, why taker fees distort breakevens, and how to calibrate forecasts."
  },
  "/journal": {
    chapter: "Executive Orbit",
    outfitName: "Quieter Executive",
    styleVariant: "compact",
    badge: "Private Records",
    greeting: "Your decision journal is private. Audit your reasoning before the outcome resolves."
  }
};

export function getQuantaGuideConfig(routeOrKey: string): QuantaGuideConfig {
  const norm = routeOrKey.toLowerCase().trim();
  return QUANTA_PAGE_GUIDES[norm] || QUANTA_PAGE_GUIDES["/"] || {
    chapter: "Origin Command",
    outfitName: "Origin Flight Suit",
    styleVariant: "compact",
    badge: "Navigation Guide",
    greeting: "QuanterraOS: Assemble your crew. See the evidence. Own your decision."
  };
}
