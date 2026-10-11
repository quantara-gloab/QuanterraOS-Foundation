/**
 * QuanterraOS Pilot Customizer & Spaceship Embarkation Catalog
 *
 * Implements:
 * - 6 Character Archetypes / Base Pilots
 * - 6 QuanterraOS Apparel Lines
 * - 7 Hair Styles
 * - 6 Facial Expressions / Visor LED Displays
 * - Procedural SVG visual avatar renderer
 * - Spaceship Embarkation dialogues with Quanta (Celestial Man), Quantana (Celestial Woman), and Crew
 */

export interface CharacterArchetype {
  id: string;
  name: string;
  category: string;
  tagline: string;
  accentColor: string;
  baseSkinTone: string;
}

export interface ApparelOption {
  id: string;
  name: string;
  collection: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  trimColor: string;
  hasCrest: boolean;
  crestSymbol: string;
}

export interface HairStyleOption {
  id: string;
  name: string;
  styleClass: string;
  description: string;
  defaultColor: string;
}

export interface ExpressionOption {
  id: string;
  name: string;
  visorLedColor: string;
  eyeShape: "focused" | "smirk" | "analytical" | "stoic" | "wonder" | "resilient";
  mouthShape: "neutral" | "smirk" | "calm" | "firm" | "smile" | "warm";
  dialogueTone: string;
}

export const CHARACTER_ARCHETYPES: CharacterArchetype[] = [
  {
    id: "cadet-vanguard",
    name: "Cadet Vanguard",
    category: "Recruit & Agile Scout",
    tagline: "High-agility spaceport recruit with rapid low-gravity reflex calibration.",
    accentColor: "#CBFF69",
    baseSkinTone: "#F0E4D2"
  },
  {
    id: "cosmic-commander",
    name: "Cosmic Commander",
    category: "Veteran Fleet Leader",
    tagline: "Battle-hardened analytical leader trained on high-volatility event markets.",
    accentColor: "#9B6CFF",
    baseSkinTone: "#C8A185"
  },
  {
    id: "cyber-specialist",
    name: "Cybernetic Specialist",
    category: "Neural Telemetry Auditor",
    tagline: "Equipped with direct optical data-feed implants for nanosecond spread detection.",
    accentColor: "#00E5FF",
    baseSkinTone: "#E8D8C8"
  },
  {
    id: "celestial-pioneer",
    name: "Celestial Pioneer",
    category: "Deep-Space Sovereign",
    tagline: "Drawn to astral horizons, harmonic frequencies, and mathematical truth.",
    accentColor: "#F472B6",
    baseSkinTone: "#684838"
  },
  {
    id: "quantum-navigator",
    name: "Quantum Navigator",
    category: "Multidimensional Tactician",
    tagline: "Models probability density surfaces across non-linear market regimes.",
    accentColor: "#A855F7",
    baseSkinTone: "#A87B5E"
  },
  {
    id: "orbital-scout",
    name: "Orbital Scout",
    category: "Reconnaissance Pilot",
    tagline: "Specializes in early exchange anomaly warning and orderbook queue shifts.",
    accentColor: "#DFB843",
    baseSkinTone: "#F4DFC8"
  }
];

export const APPAREL_OPTIONS: ApparelOption[] = [
  {
    id: "crew-essentials",
    name: "Crew Essentials Flight Suit",
    collection: "Crew Essentials",
    description: "Matte obsidian loopback ballistic weave with pearl ceramic panels and mint green telemetry status piping.",
    primaryColor: "#0C1022",
    secondaryColor: "#E2E8F0",
    trimColor: "#CBFF69",
    hasCrest: true,
    crestSymbol: "Q-FLEET"
  },
  {
    id: "executive-orbit",
    name: "Executive Orbit Structured Suit",
    collection: "Executive Orbit",
    description: "Tailored diplomatic suiting with polished titanium magnetic closures and cosmic violet accents.",
    primaryColor: "#100D20",
    secondaryColor: "#9B6CFF",
    trimColor: "#C084FC",
    hasCrest: true,
    crestSymbol: "EXEC"
  },
  {
    id: "founder-m",
    name: "Founder M Edition Regalia",
    collection: "Founder M Edition",
    description: "Deepest obsidian velvet trimmed with 24K gold micro-piping and capital M embroidered crest.",
    primaryColor: "#080911",
    secondaryColor: "#DFB843",
    trimColor: "#9B6CFF",
    hasCrest: true,
    crestSymbol: "M"
  },
  {
    id: "celestial-astral",
    name: "Celestial Astral Silk Robe",
    collection: "Celestial Collection",
    description: "Luminous astral silk drape with iridescent lilac overlays and sovereign cosmic ribbon tapes.",
    primaryColor: "#1B0F2B",
    secondaryColor: "#F472B6",
    trimColor: "#DFB843",
    hasCrest: true,
    crestSymbol: "SOL"
  },
  {
    id: "cosmic-street",
    name: "Cosmic Street Heavy Hoodie",
    collection: "Cosmic Street",
    description: "500 GSM loopback cotton heavyweight street drape with articulated utility elbows and reflective logos.",
    primaryColor: "#141726",
    secondaryColor: "#00E5FF",
    trimColor: "#FF55C8",
    hasCrest: false,
    crestSymbol: ""
  },
  {
    id: "deep-space-eva",
    name: "Deep Space Ballistic EVA Armor",
    collection: "Heavy EVA Line",
    description: "Triple-reinforced atmospheric blast ceramic armor with diagnostic fiber-optic weave and sealed joints.",
    primaryColor: "#182032",
    secondaryColor: "#FFB800",
    trimColor: "#10B981",
    hasCrest: true,
    crestSymbol: "EVA-1"
  }
];

export const HAIR_STYLE_OPTIONS: HairStyleOption[] = [
  {
    id: "zero-g-ponytail",
    name: "Zero-G High Ponytail",
    styleClass: "hair-ponytail",
    description: "Sculpted high ponytail suspended in graceful anti-gravity curvature.",
    defaultColor: "#1A1A24"
  },
  {
    id: "cyber-buzz",
    name: "Sleek Cyber Buzzcut",
    styleClass: "hair-buzz",
    description: "Sharp geometric skin fade accented by an integrated LED neural circuit line.",
    defaultColor: "#101018"
  },
  {
    id: "astral-waves",
    name: "Sovereign Astral Waves",
    styleClass: "hair-waves",
    description: "Voluminous textured waves styled with soft luminescent violet highlights.",
    defaultColor: "#2E1A47"
  },
  {
    id: "neon-undercut",
    name: "Neon Undercut & Fringe",
    styleClass: "hair-undercut",
    description: "High-contrast disconnected undercut with dynamic side-swept fringe.",
    defaultColor: "#0D2E3D"
  },
  {
    id: "orbital-braids",
    name: "Braided Orbital Cornrows",
    styleClass: "hair-braids",
    description: "Intricately woven geometric braids locked with micro-titanium cuff rings.",
    defaultColor: "#120D1A"
  },
  {
    id: "tactical-crop",
    name: "Tactical Flight Crop",
    styleClass: "hair-crop",
    description: "Clean, low-maintenance flight deck crop engineered for seamless helmet docking.",
    defaultColor: "#262626"
  },
  {
    id: "energy-crown",
    name: "Luminous Energy Halo",
    styleClass: "hair-halo",
    description: "Short cropped hair crowned with a soft, ethereal ultraviolet ambient particle glow.",
    defaultColor: "#4C1D95"
  }
];

export const EXPRESSION_OPTIONS: ExpressionOption[] = [
  {
    id: "calm-focus",
    name: "Calm Focus & Clarity",
    visorLedColor: "#00E5FF",
    eyeShape: "focused",
    mouthShape: "calm",
    dialogueTone: "Composed, analytical, and entirely unhurried."
  },
  {
    id: "confident-smirk",
    name: "Confident Smirk",
    visorLedColor: "#CBFF69",
    eyeShape: "smirk",
    mouthShape: "smirk",
    dialogueTone: "Self-assured and ready to out-calculate the spread."
  },
  {
    id: "analytical-gaze",
    name: "Analytical Piercing Scan",
    visorLedColor: "#9B6CFF",
    eyeShape: "analytical",
    mouthShape: "firm",
    dialogueTone: "Auditing orderbook depth and fee hurdles with zero illusions."
  },
  {
    id: "stoic-veteran",
    name: "Stoic Tactical Veteran",
    visorLedColor: "#FFB800",
    eyeShape: "stoic",
    mouthShape: "neutral",
    dialogueTone: "Unflinching discipline tested against adversarial volatility."
  },
  {
    id: "cosmic-wonder",
    name: "Cosmic Wonder",
    visorLedColor: "#F472B6",
    eyeShape: "wonder",
    mouthShape: "smile",
    dialogueTone: "Curious, perceptive, and in awe of the celestial horizon."
  },
  {
    id: "resilient-grin",
    name: "Resilient Courage Grin",
    visorLedColor: "#FF55C8",
    eyeShape: "resilient",
    mouthShape: "warm",
    dialogueTone: "High morale and fearless persistence across any market turbulence."
  }
];

export interface CustomPilotProfile {
  callsign: string;
  archetypeId: string;
  apparelId: string;
  hairId: string;
  expressionId: string;
  hairColor: string;
  suitColor: string;
  embarked: boolean;
  embarkedAt?: string;
}

export const DEFAULT_PILOT_PROFILE: CustomPilotProfile = {
  callsign: "PILOT-ALPHA",
  archetypeId: "cadet-vanguard",
  apparelId: "crew-essentials",
  hairId: "zero-g-ponytail",
  expressionId: "calm-focus",
  hairColor: "#1A1A24",
  suitColor: "#0C1022",
  embarked: false,
};

/**
 * Generates an SVG vector graphic representing the customized pilot.
 */
export function generatePilotAvatarSvg(profile: CustomPilotProfile): string {
  const archetype = CHARACTER_ARCHETYPES.find(a => a.id === profile.archetypeId) || CHARACTER_ARCHETYPES[0];
  const apparel = APPAREL_OPTIONS.find(a => a.id === profile.apparelId) || APPAREL_OPTIONS[0];
  const hair = HAIR_STYLE_OPTIONS.find(h => h.id === profile.hairId) || HAIR_STYLE_OPTIONS[0];
  const expr = EXPRESSION_OPTIONS.find(e => e.id === profile.expressionId) || EXPRESSION_OPTIONS[0];

  const skin = archetype.baseSkinTone;
  const suit = profile.suitColor || apparel.primaryColor;
  const trim = apparel.trimColor;
  const accent = apparel.secondaryColor;
  const visor = expr.visorLedColor;
  const hairColor = profile.hairColor || hair.defaultColor;

  // Render SVG
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" class="pilot-avatar-svg" role="img" aria-label="Customized Pilot Avatar: ${profile.callsign}">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${trim}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#070914" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${suit}"/>
      <stop offset="100%" stop-color="#05060C"/>
    </linearGradient>
    <linearGradient id="visorGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${visor}" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${visor}" stop-opacity="0.8"/>
    </linearGradient>
    <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background Ambience -->
  <rect width="240" height="240" rx="24" fill="#090C1B"/>
  <circle cx="120" cy="110" r="95" fill="url(#bgGlow)"/>

  <!-- Starship Command Collar / Apparel Base -->
  <path d="M 40 240 L 50 180 Q 75 160 120 160 Q 165 160 190 180 L 200 240 Z" fill="url(#suitGrad)" stroke="${trim}" stroke-width="2"/>
  
  <!-- Suit Accent Panels -->
  <path d="M 75 170 L 60 240 L 95 240 L 105 185 Z" fill="${accent}" opacity="0.6"/>
  <path d="M 165 170 L 180 240 L 145 240 L 135 185 Z" fill="${accent}" opacity="0.6"/>

  <!-- Neck / Throat Guard -->
  <rect x="98" y="140" width="44" height="28" rx="6" fill="#141829" stroke="${trim}" stroke-width="1.5"/>
  <line x1="120" y1="142" x2="120" y2="166" stroke="${visor}" stroke-width="2" opacity="0.8"/>

  <!-- Head Base / Jawline -->
  <path d="M 85 95 Q 85 145 120 148 Q 155 145 155 95 Q 155 60 120 60 Q 85 60 85 95 Z" fill="${skin}"/>

  <!-- Hair Style Render -->
  ${renderHairStyleSvg(hair.id, hairColor, visor)}

  <!-- Helmet / Visor / Eye LED Display -->
  <path d="M 88 92 Q 120 86 152 92 Q 154 116 120 118 Q 86 116 88 92 Z" fill="#080A14" stroke="${trim}" stroke-width="1.5"/>
  
  <!-- Visor LED Eyes / Expression -->
  ${renderVisorExpressionSvg(expr.id, visor)}

  <!-- Mouth / Facial Expression -->
  ${renderMouthExpressionSvg(expr.mouthShape, visor)}

  <!-- Chest Insignia / Crest -->
  ${apparel.hasCrest ? `
    <rect x="110" y="195" width="20" height="20" rx="4" fill="#080B18" stroke="${trim}" stroke-width="1.5"/>
    <text x="120" y="209" fill="${trim}" font-size="10" font-family="'IBM Plex Mono', monospace" font-weight="bold" text-anchor="middle">${apparel.crestSymbol === 'M' ? 'M' : '✦'}</text>
  ` : ''}

  <!-- Callout Label -->
  <rect x="55" y="218" width="130" height="16" rx="4" fill="rgba(8, 11, 24, 0.9)" stroke="rgba(255, 255, 255, 0.1)"/>
  <text x="120" y="229" fill="${trim}" font-size="8.5" font-family="'IBM Plex Mono', monospace" font-weight="bold" text-anchor="middle" letter-spacing="0.5">${profile.callsign.toUpperCase()}</text>
</svg>`;
}

function renderHairStyleSvg(styleId: string, hairColor: string, visorGlow: string): string {
  switch (styleId) {
    case "zero-g-ponytail":
      return `
        <!-- High Zero-G Ponytail -->
        <path d="M 80 82 Q 78 45 120 45 Q 162 45 160 82 Q 148 65 120 65 Q 92 65 80 82 Z" fill="${hairColor}"/>
        <!-- Dynamic Anti-Gravity Topknot Flow -->
        <path d="M 120 45 Q 135 20 165 22 Q 185 24 195 45 Q 170 36 145 42 Q 130 45 120 45 Z" fill="${hairColor}" opacity="0.95"/>
        <circle cx="120" cy="45" r="5" fill="${visorGlow}"/>
      `;
    case "cyber-buzz":
      return `
        <!-- Crisp Cyber Buzzcut with Neon Circuit Line -->
        <path d="M 84 82 Q 84 52 120 52 Q 156 52 156 82 Q 148 66 120 66 Q 92 66 84 82 Z" fill="${hairColor}"/>
        <path d="M 90 70 Q 120 62 150 70" stroke="${visorGlow}" stroke-width="2" fill="none" opacity="0.8"/>
      `;
    case "astral-waves":
      return `
        <!-- Voluminous Astral Waves -->
        <path d="M 75 95 Q 70 42 120 42 Q 170 42 165 95 Q 175 115 170 140 Q 158 85 152 75 Q 120 60 88 75 Q 82 85 70 140 Q 65 115 75 95 Z" fill="${hairColor}"/>
        <path d="M 76 100 Q 65 125 78 145" stroke="#C084FC" stroke-width="2" fill="none" opacity="0.7"/>
      `;
    case "neon-undercut":
      return `
        <!-- Swept Undercut -->
        <path d="M 82 78 Q 80 48 115 46 Q 165 44 165 72 Q 145 60 115 62 Q 88 65 82 78 Z" fill="${hairColor}"/>
        <path d="M 95 54 L 160 52" stroke="${visorGlow}" stroke-width="2.5" fill="none"/>
      `;
    case "orbital-braids":
      return `
        <!-- Intricate Braids -->
        <path d="M 82 80 Q 82 48 120 48 Q 158 48 158 80 Z" fill="${hairColor}"/>
        <line x1="95" y1="52" x2="80" y2="120" stroke="#DFB843" stroke-width="2" stroke-dasharray="4,2"/>
        <line x1="110" y1="49" x2="105" y2="125" stroke="#DFB843" stroke-width="2" stroke-dasharray="4,2"/>
        <line x1="130" y1="49" x2="135" y2="125" stroke="#DFB843" stroke-width="2" stroke-dasharray="4,2"/>
        <line x1="145" y1="52" x2="160" y2="120" stroke="#DFB843" stroke-width="2" stroke-dasharray="4,2"/>
      `;
    case "energy-crown":
      return `
        <!-- Ambient Energy Crown -->
        <path d="M 82 78 Q 82 50 120 50 Q 158 50 158 78 Z" fill="${hairColor}"/>
        <circle cx="120" cy="50" r="14" fill="none" stroke="${visorGlow}" stroke-width="2" opacity="0.8" filter="url(#neonBlur)"/>
      `;
    default: // tactical-crop
      return `
        <!-- Short Flight Crop -->
        <path d="M 82 82 Q 80 50 120 50 Q 160 50 158 82 Q 145 66 120 66 Q 95 66 82 82 Z" fill="${hairColor}"/>
      `;
  }
}

function renderVisorExpressionSvg(exprId: string, visorColor: string): string {
  switch (exprId) {
    case "confident-smirk":
      return `
        <!-- Confident Smirk Visor LED -->
        <path d="M 98 103 Q 108 97 114 102" stroke="${visorColor}" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#neonBlur)"/>
        <path d="M 126 102 Q 132 97 142 103" stroke="${visorColor}" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#neonBlur)"/>
        <circle cx="106" cy="101" r="2" fill="#FFFFFF"/>
        <circle cx="134" cy="101" r="2" fill="#FFFFFF"/>
      `;
    case "analytical-gaze":
      return `
        <!-- Analytical Reticle Visor -->
        <circle cx="106" cy="102" r="6" fill="none" stroke="${visorColor}" stroke-width="2" filter="url(#neonBlur)"/>
        <line x1="102" y1="102" x2="110" y2="102" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="134" cy="102" r="6" fill="none" stroke="${visorColor}" stroke-width="2" filter="url(#neonBlur)"/>
        <line x1="130" y1="102" x2="138" y2="102" stroke="#FFFFFF" stroke-width="2"/>
      `;
    case "stoic-veteran":
      return `
        <!-- Steady Horizontal HUD Bar -->
        <line x1="96" y1="102" x2="144" y2="102" stroke="${visorColor}" stroke-width="3.5" stroke-linecap="round" filter="url(#neonBlur)"/>
      `;
    case "cosmic-wonder":
      return `
        <!-- Wide Radiant Wonder Eyes -->
        <circle cx="106" cy="102" r="7" fill="none" stroke="${visorColor}" stroke-width="2.5" filter="url(#neonBlur)"/>
        <circle cx="106" cy="102" r="3" fill="#FFFFFF"/>
        <circle cx="134" cy="102" r="7" fill="none" stroke="${visorColor}" stroke-width="2.5" filter="url(#neonBlur)"/>
        <circle cx="134" cy="102" r="3" fill="#FFFFFF"/>
      `;
    case "resilient-grin":
      return `
        <!-- Warm Resilient Eye Arcs -->
        <path d="M 98 100 Q 106 95 114 100" stroke="${visorColor}" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#neonBlur)"/>
        <path d="M 126 100 Q 134 95 142 100" stroke="${visorColor}" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#neonBlur)"/>
      `;
    default: // calm-focus
      return `
        <!-- Calm Focus Dual LED Slits -->
        <line x1="98" y1="102" x2="114" y2="102" stroke="${visorColor}" stroke-width="3" stroke-linecap="round" filter="url(#neonBlur)"/>
        <line x1="126" y1="102" x2="142" y2="102" stroke="${visorColor}" stroke-width="3" stroke-linecap="round" filter="url(#neonBlur)"/>
      `;
  }
}

function renderMouthExpressionSvg(shape: string, color: string): string {
  switch (shape) {
    case "smirk":
      return `<path d="M 112 133 Q 120 134 128 130" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    case "smile":
      return `<path d="M 110 131 Q 120 138 130 131" stroke="${color}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
    case "warm":
      return `<path d="M 112 132 Q 120 136 128 132" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    case "firm":
      return `<line x1="112" y1="133" x2="128" y2="133" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    default: // calm
      return `<path d="M 114 133 Q 120 135 126 133" stroke="${color}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`;
  }
}
