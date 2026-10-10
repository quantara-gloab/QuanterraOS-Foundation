import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MEMBERS = [
  {
    id: "draco",
    name: "Draco",
    role: "Tactical Strike & Pipeline Integrity",
    palette: { primary: "#FF3366", secondary: "#FFB800", dark: "#1A0A10", glow: "rgba(255, 51, 102, 0.4)", accent: "#FFE57F" },
    symbol: "dragon",
    motif: "Angular dragon crest, heat-shield scales, plasma exhaust vents, dual tactical thrusters"
  },
  {
    id: "wolf",
    name: "Wolf",
    role: "Order Book Queue Profiler & Pack Scout",
    palette: { primary: "#7FE5D9", secondary: "#4A6B82", dark: "#0D1821", glow: "rgba(127, 229, 217, 0.4)", accent: "#BEE9E8" },
    symbol: "wolf",
    motif: "Lunar geometric trajectory, angular canine visor, cryogenic coolant ribs, perimeter radar"
  },
  {
    id: "falcon",
    name: "Falcon",
    role: "High-Velocity Execution Interceptor",
    palette: { primary: "#00E5FF", secondary: "#5D9CEC", dark: "#0A192F", glow: "rgba(0, 229, 255, 0.4)", accent: "#80D8FF" },
    symbol: "falcon",
    motif: "Swept supersonic winglets, forward-canted HUD visor, azure vector streams, kinetic stabilizers"
  },
  {
    id: "quantum-fox",
    name: "Quantum Fox",
    role: "Probability Microstructure Navigator",
    palette: { primary: "#00FFB2", secondary: "#FF9900", dark: "#1F140A", glow: "rgba(0, 255, 178, 0.4)", accent: "#FFD180" },
    symbol: "fox",
    motif: "Geometric prism ears, quantum probability wavefunction coils, emerald flux ring, agile thrusters"
  },
  {
    id: "sentinel",
    name: "Sentinel",
    role: "Aegis Shield & Capital Preservation Fortress",
    palette: { primary: "#A259FF", secondary: "#4318FF", dark: "#120A2A", glow: "rgba(162, 89, 255, 0.4)", accent: "#D1B3FF" },
    symbol: "shield",
    motif: "Hexagonal barrier grid, cosmic glass visor, titanium bastion plating, impenetrable magnetic aegis"
  },
  {
    id: "kraken",
    name: "Kraken",
    role: "Deep Liquidity Specialist & Dark Pool Orderflow",
    palette: { primary: "#00FFCC", secondary: "#003366", dark: "#031926", glow: "rgba(0, 255, 204, 0.4)", accent: "#64FFDA" },
    symbol: "kraken",
    motif: "Bioluminescent sensory tentacles, high-pressure abyssal hull, hydrodynamic sonar fins, submerged dark pool sensors"
  },
  {
    id: "lion",
    name: "Lion",
    role: "Macro Regime Conviction & Sovereign Commander",
    palette: { primary: "#FFC000", secondary: "#FF5722", dark: "#201402", glow: "rgba(255, 192, 0, 0.4)", accent: "#FFE082" },
    symbol: "lion",
    motif: "Radiant solar crown crest, reinforced golden mane collar, heavy tactical regalia, sovereign command bridge"
  },
  {
    id: "phoenix",
    name: "Phoenix",
    role: "Asymmetric Recovery Protocol & Rebound Specialist",
    palette: { primary: "#FF0055", secondary: "#9B6CFF", dark: "#1E0514", glow: "rgba(255, 0, 85, 0.4)", accent: "#FF80AB" },
    symbol: "phoenix",
    motif: "Prismatic thermal wings, renaissance ignition crest, radiant solar tail, recursive cycle ignition"
  }
];

const CHAPTERS = [
  { num: 1, id: "ch-01", title: "Orbit Origin", environment: "Initial orbital ascent from sovereign spaceport breaking through Earth exosphere into low orbit." },
  { num: 2, id: "ch-02", title: "Cyber Nebula", environment: "Dense electromagnetic gas cloud pulsing with synchrotron radiation and encoded radio waves." },
  { num: 3, id: "ch-03", title: "Obsidian Horizon", environment: "Eclipse zone behind a dead volcanic planet where shadow reveals cosmic infrared patterns." },
  { num: 4, id: "ch-04", title: "Solar Flare Sanctuary", environment: "High-temperature perimeter near a supergiant star where magnetic containment shields recharge." },
  { num: 5, id: "ch-05", title: "Celestial Foundry", environment: "Ancient automated orbital shipyard forging titanium hulls in zero gravity." },
  { num: 6, id: "ch-06", title: "Quantum Singularity", environment: "Localized gravitational vortex warping spacetime metrics and probability distributions." },
  { num: 7, id: "ch-07", title: "Deep Space Void", environment: "The absolute silence between spiral galactic arms where cosmic background radiation is lowest." },
  { num: 8, id: "ch-08", title: "Aurora Borealis Prime", environment: "Ionospheric storm of iridescent greens and violets dancing over a frozen moon." },
  { num: 9, id: "ch-09", title: "Plasma Reef", environment: "Bioluminescent ring system of energized ionized gases glowing in deep neon blues and cyans." },
  { num: 10, id: "ch-10", title: "Chronos Gateway", environment: "Relativistic velocity accelerator where time dilation synchronizes cross-venue atomic clocks." },
  { num: 11, id: "ch-11", title: "Hyperdrive Corridor", environment: "Superluminal slipstream conduit through subspace for instant inter-system transit." },
  { num: 12, id: "ch-12", title: "Supernova Cradle", environment: "Radiant shockwave nebula left by a collapsing star, birthing heavy elements." },
  { num: 13, id: "ch-13", title: "Asteroid Citadel", environment: "Hollowed-out nickel-iron asteroid outpost fortified against high-velocity micrometeorites." },
  { num: 14, id: "ch-14", title: "Dark Matter Matrix", environment: "Non-baryonic gravitational filament cluster bending starfield starlight across sectors." },
  { num: 15, id: "ch-15", title: "Binary Star Nexus", environment: "Lagrange balance point between a blue giant and a white dwarf star." },
  { num: 16, id: "ch-16", title: "Titan Stratosphere", environment: "Dense nitrogen and methane atmosphere with orange hydrocarbon haze and liquid cryo-seas." },
  { num: 17, id: "ch-17", title: "Andromeda Outpost", environment: "Frontier observation station facing the galactic bridge between Milky Way and Andromeda." },
  { num: 18, id: "ch-18", title: "Galactic Core", environment: "Radiant supermassive center where trillions of stars illuminate the celestial nexus." }
];

function generateMemberInsigniaSvg(symbol, color1, color2) {
  switch (symbol) {
    case "dragon":
      return `
        <!-- Dragon Insignia -->
        <path d="M540 280 L620 400 L580 430 L660 520 L540 480 L420 520 L500 430 L460 400 Z" fill="${color1}" opacity="0.85" filter="url(#glow)"/>
        <path d="M540 320 L590 410 L540 460 L490 410 Z" fill="${color2}" opacity="0.9"/>
        <circle cx="515" cy="415" r="8" fill="#FFF"/>
        <circle cx="565" cy="415" r="8" fill="#FFF"/>
        <path d="M540 450 L560 540 L540 525 L520 540 Z" fill="${color1}"/>
      `;
    case "wolf":
      return `
        <!-- Wolf Insignia -->
        <polygon points="460,340 500,280 525,370" fill="${color1}" filter="url(#glow)"/>
        <polygon points="620,340 580,280 555,370" fill="${color1}" filter="url(#glow)"/>
        <polygon points="480,360 600,360 540,510" fill="${color2}" opacity="0.85"/>
        <polygon points="510,380 570,380 540,470" fill="${color1}"/>
        <polygon points="505,400 525,415 510,425" fill="#FFF"/>
        <polygon points="575,400 555,415 570,425" fill="#FFF"/>
        <circle cx="540" cy="470" r="10" fill="#0D1821"/>
      `;
    case "falcon":
      return `
        <!-- Falcon Insignia -->
        <path d="M540 290 L680 410 L610 440 L700 510 L540 470 L380 510 L470 440 L400 410 Z" fill="${color1}" filter="url(#glow)"/>
        <path d="M540 330 L620 420 L540 460 L460 420 Z" fill="${color2}"/>
        <polygon points="540,430 555,480 540,495 525,480" fill="#FFF"/>
      `;
    case "fox":
      return `
        <!-- Quantum Fox Insignia -->
        <polygon points="450,330 470,250 515,350" fill="${color2}" filter="url(#glow)"/>
        <polygon points="630,330 610,250 565,350" fill="${color2}" filter="url(#glow)"/>
        <polygon points="470,350 610,350 540,500" fill="${color1}" opacity="0.9"/>
        <polygon points="495,375 585,375 540,465" fill="#FFF" opacity="0.9"/>
        <circle cx="515" cy="390" r="7" fill="${color2}"/>
        <circle cx="565" cy="390" r="7" fill="${color2}"/>
        <polygon points="540,435 550,450 530,450" fill="${color1}"/>
      `;
    case "shield":
      return `
        <!-- Sentinel Aegis Insignia -->
        <path d="M540 280 L660 330 L640 470 L540 550 L440 470 L420 330 Z" fill="${color1}" filter="url(#glow)" opacity="0.85"/>
        <path d="M540 310 L630 350 L615 455 L540 515 L465 455 L450 350 Z" fill="${color2}" opacity="0.75"/>
        <polygon points="540,360 580,400 580,450 540,490 500,450 500,400" fill="#FFF" opacity="0.9"/>
      `;
    case "kraken":
      return `
        <!-- Kraken Insignia -->
        <path d="M540 280 C590 280 630 320 630 370 C630 420 610 460 650 530 L610 540 C585 480 575 450 540 450 C505 450 495 480 470 540 L430 530 C470 460 450 420 450 370 C450 320 490 280 540 280 Z" fill="${color1}" filter="url(#glow)"/>
        <circle cx="515" cy="365" r="9" fill="#FFF"/>
        <circle cx="565" cy="365" r="9" fill="#FFF"/>
        <circle cx="515" cy="365" r="4" fill="${color2}"/>
        <circle cx="565" cy="365" r="4" fill="${color2}"/>
      `;
    case "lion":
      return `
        <!-- Lion Sovereign Insignia -->
        <polygon points="460,330 490,260 520,330 540,240 560,330 590,260 620,330" fill="${color1}" filter="url(#glow)"/>
        <circle cx="540" cy="410" r="85" fill="${color2}" opacity="0.85"/>
        <polygon points="495,385 585,385 540,470" fill="${color1}"/>
        <circle cx="520" cy="390" r="7" fill="#FFF"/>
        <circle cx="560" cy="390" r="7" fill="#FFF"/>
      `;
    case "phoenix":
      return `
        <!-- Phoenix Insignia -->
        <path d="M540 260 C570 320 660 330 710 420 C640 430 590 390 580 450 C630 460 650 520 620 560 C580 520 570 470 540 490 C510 470 500 520 460 560 C430 520 450 460 500 450 C490 390 440 430 370 420 C420 330 510 320 540 260 Z" fill="${color1}" filter="url(#glow)"/>
        <circle cx="540" cy="380" r="22" fill="${color2}"/>
        <polygon points="540,360 550,400 540,415 530,400" fill="#FFF"/>
      `;
    default:
      return `<circle cx="540" cy="410" r="80" fill="${color1}"/>`;
  }
}

function generateSvgContent(art) {
  const p = art.palette;
  const ins = generateMemberInsigniaSvg(art.symbol, p.primary, p.secondary);
  const chNumStr = String(art.chapterNumber).padStart(2, "0");
  const pieceNumStr = art.id.toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <radialGradient id="spaceBg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="${p.dark}"/>
      <stop offset="45%" stop-color="#0E1222"/>
      <stop offset="100%" stop-color="#05070E"/>
    </radialGradient>
    <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.primary}"/>
      <stop offset="100%" stop-color="${p.secondary}"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="hardGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="28" result="blur2"/>
      <feComposite in="SourceGraphic" in2="blur2" operator="over"/>
    </filter>
  </defs>

  <!-- Canvas Background -->
  <rect width="1080" height="1080" fill="url(#spaceBg)"/>

  <!-- Cosmic Ambient Glow & Starfield -->
  <circle cx="540" cy="420" r="380" fill="${p.glow}" opacity="0.6" filter="url(#hardGlow)"/>
  <circle cx="280" cy="220" r="2.5" fill="#FFF" opacity="0.8"/>
  <circle cx="820" cy="260" r="3" fill="#FFF" opacity="0.9"/>
  <circle cx="160" cy="620" r="2" fill="#FFF" opacity="0.6"/>
  <circle cx="910" cy="740" r="2.5" fill="#FFF" opacity="0.7"/>
  <circle cx="340" cy="850" r="2" fill="#FFF" opacity="0.75"/>
  <circle cx="760" cy="890" r="2" fill="#FFF" opacity="0.85"/>
  <circle cx="540" cy="140" r="3.5" fill="${p.primary}" opacity="0.9"/>

  <!-- Orbital Chapter Rings -->
  <ellipse cx="540" cy="460" rx="420" ry="180" fill="none" stroke="${p.primary}" stroke-width="1.5" stroke-dasharray="12 18" opacity="0.35" transform="rotate(-15 540 460)"/>
  <ellipse cx="540" cy="460" rx="480" ry="210" fill="none" stroke="${p.secondary}" stroke-width="1.2" stroke-dasharray="6 24" opacity="0.25" transform="rotate(25 540 460)"/>

  <!-- Flight Deck Cybernetic Constellation Lines -->
  <line x1="140" y1="540" x2="380" y2="460" stroke="${p.primary}" stroke-width="1" opacity="0.25"/>
  <line x1="940" y1="540" x2="700" y2="460" stroke="${p.secondary}" stroke-width="1" opacity="0.25"/>
  <circle cx="380" cy="460" r="4" fill="${p.primary}" opacity="0.6"/>
  <circle cx="700" cy="460" r="4" fill="${p.secondary}" opacity="0.6"/>

  <!-- Central Flight Crew Pilot Silhouette & Helmet Halo -->
  <circle cx="540" cy="420" r="230" fill="#080C1A" stroke="url(#neonGlow)" stroke-width="4" filter="url(#glow)"/>
  <circle cx="540" cy="420" r="215" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>

  <!-- Flight Crew Pilot Visor & Cybernetic Collar -->
  <path d="M420 540 C420 460 480 340 540 340 C600 340 660 460 660 540 Z" fill="#03050B" stroke="${p.primary}" stroke-width="2" opacity="0.95"/>
  <ellipse cx="540" cy="445" rx="80" ry="32" fill="${p.secondary}" opacity="0.85" filter="url(#glow)"/>
  <ellipse cx="540" cy="445" rx="72" ry="24" fill="#050811"/>

  <!-- Guardian Signature Insignia -->
  ${ins}

  <!-- Tactical HUD Compass Arc -->
  <path d="M340 420 A200 200 0 0 1 740 420" fill="none" stroke="${p.primary}" stroke-width="2" stroke-dasharray="8 12" opacity="0.5"/>
  <path d="M360 420 A180 180 0 0 0 720 420" fill="none" stroke="${p.secondary}" stroke-width="1.5" stroke-dasharray="4 8" opacity="0.4"/>

  <!-- Outer Viewfinder Framing & Bracket Corners -->
  <rect x="40" y="40" width="1000" height="1000" rx="16" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
  <path d="M40 90 L40 40 L90 40" fill="none" stroke="${p.primary}" stroke-width="4"/>
  <path d="M1040 90 L1040 40 L990 40" fill="none" stroke="${p.primary}" stroke-width="4"/>
  <path d="M40 990 L40 1040 L90 1040" fill="none" stroke="${p.secondary}" stroke-width="4"/>
  <path d="M1040 990 L1040 1040 L990 1040" fill="none" stroke="${p.secondary}" stroke-width="4"/>

  <!-- Flight Deck Header Telemetry -->
  <text x="64" y="82" font-family="'JetBrains Mono', 'SF Pro Text', monospace" font-size="16" font-weight="700" fill="${p.primary}" letter-spacing="3">QUANTERRAOS: THE 144 // ${pieceNumStr}</text>
  <text x="1016" y="82" text-anchor="end" font-family="'JetBrains Mono', 'SF Pro Text', monospace" font-size="14" font-weight="600" fill="#94A3B8" letter-spacing="2">CH.${chNumStr} · ${art.chapterTitle.toUpperCase()}</text>

  <!-- Bottom Brand Title & Guardian Spec -->
  <rect x="40" y="930" width="1000" height="110" rx="0" fill="rgba(8, 11, 22, 0.88)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="64" y="972" font-family="'Space Grotesk', -apple-system, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">${art.title}</text>
  <text x="64" y="1008" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="500" fill="${p.primary}">${art.memberName.toUpperCase()} // ${art.memberRole.toUpperCase()}</text>
  <text x="1016" y="990" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="700" fill="#CBFF69">ARTWORK · NFT-READY</text>
</svg>`;
}

const allArtworks = [];
const publicAssetsDir = path.resolve('public', 'assets', 'art-144');

if (!fs.existsSync(publicAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });
}

let counter = 1;
for (const ch of CHAPTERS) {
  for (const mem of MEMBERS) {
    const id = `q144-${String(counter).padStart(3, "0")}`;
    const slug = `${mem.id}-${ch.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(counter).padStart(3, "0")}`;
    const title = `${mem.name}: ${mem.symbol === "dragon" ? "Ignition" : mem.symbol === "wolf" ? "Trajectory" : mem.symbol === "falcon" ? "Vector" : mem.symbol === "fox" ? "Resonance" : mem.symbol === "shield" ? "Fortress" : mem.symbol === "kraken" ? "Abyss" : mem.symbol === "lion" ? "Regime" : "Renaissance"} in ${ch.title}`;

    const prompt = `Hyper-detailed cybernetic flight guardian ${mem.name} in futuristic aerodynamic space armor, signature ${mem.motif}, traversing cosmic setting: ${ch.title} (${ch.environment}). Cinematic high-contrast lighting in ${mem.palette.primary} and ${mem.palette.secondary}, ink-dark canvas #090A14, volumetric starfields, zero-gravity reflections, institutional sci-fi aesthetic, 8k resolution, Masterpiece --v 6.1 --style raw`;
    
    const description = `Flight Crew Guardian ${mem.name} deployed in Chapter ${String(ch.num).padStart(2, "0")} (${ch.title}). Operating as ${mem.role}, ${mem.name} navigates ${ch.environment.toLowerCase()} Featuring ${mem.motif.toLowerCase()} rendered against an ink-black cosmic canvas.`;
    const alt = `Digital artwork of ${mem.name} in cybernetic flight gear during Chapter ${ch.num}: ${ch.title}. High-contrast ${mem.palette.primary} and ${mem.palette.secondary} cosmic vectors.`;

    const art = {
      id,
      slug,
      title,
      crewCanonicalId: mem.id,
      memberName: mem.name,
      memberRole: mem.role,
      symbol: mem.symbol,
      chapterNumber: ch.num,
      chapterId: ch.id,
      chapterTitle: ch.title,
      palette: mem.palette,
      prompt,
      description,
      alt,
      generationMethod: "Midjourney v6.1 & QuanterraOS Neural Flight Deck Pipeline (AI-Assisted)",
      creatorDisplayName: "Michael Quantara & QuanterraOS Foundation",
      approvedAt: "2026-10-10T00:00:00Z",
      mintStatus: "Artwork · NFT-ready",
      rightsStatus: "Official QuanterraOS Flight Crew Creative Universe. All rights reserved.",
      originalAssetUrl: `/assets/art-144/${id}.svg`,
      thumbnailUrl: `/assets/art-144/${id}-thumb.svg`
    };

    const svgContent = generateSvgContent(art);
    const sha256 = crypto.createHash("sha256").update(svgContent).digest("hex");
    art.sha256 = sha256;

    // Write SVG files
    fs.writeFileSync(path.join(publicAssetsDir, `${id}.svg`), svgContent, "utf8");
    fs.writeFileSync(path.join(publicAssetsDir, `${id}-thumb.svg`), svgContent, "utf8");

    allArtworks.push(art);
    counter++;
  }
}

// Write collection-catalog.json
fs.writeFileSync(path.join(publicAssetsDir, 'collection-catalog.json'), JSON.stringify(allArtworks, null, 2), 'utf8');

// Write src/lib/art-144-catalog.ts
const tsContent = `/**
 * QuanterraOS: The 144 — Canonical Artwork Catalog
 *
 * Exact 144 individually generated Flight Crew artworks:
 * 8 Original Council Members (Draco, Wolf, Falcon, Quantum Fox, Sentinel, Kraken, Lion, Phoenix)
 * × 18 Chapters = 144 distinct works.
 *
 * Quanta leads outside those eight as lead mascot, virtual assistant and
 * fictional Global Galactic Leader.
 *
 * Status: Artwork · NFT-ready (Unminted). No prices, no floor values, no fake scarcity.
 */

export interface Artwork144Item {
  id: string;
  slug: string;
  title: string;
  crewCanonicalId: "draco" | "wolf" | "falcon" | "quantum-fox" | "sentinel" | "kraken" | "lion" | "phoenix";
  memberName: string;
  memberRole: string;
  symbol: string;
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
  sha256: string;
  generationMethod: string;
  creatorDisplayName: string;
  approvedAt: string;
  mintStatus: string;
  rightsStatus: string;
  originalAssetUrl: string;
  thumbnailUrl: string;
}

export const THE_144_CATALOG: Artwork144Item[] = ${JSON.stringify(allArtworks, null, 2)};

export const COUNCIL_MEMBERS_LIST = [
  { id: "draco", name: "Draco", role: "Tactical Strike & Pipeline Integrity", color: "#FF3366" },
  { id: "wolf", name: "Wolf", role: "Order Book Queue Profiler & Pack Scout", color: "#7FE5D9" },
  { id: "falcon", name: "Falcon", role: "High-Velocity Execution Interceptor", color: "#00E5FF" },
  { id: "quantum-fox", name: "Quantum Fox", role: "Probability Microstructure Navigator", color: "#00FFB2" },
  { id: "sentinel", name: "Sentinel", role: "Aegis Shield & Capital Preservation Fortress", color: "#A259FF" },
  { id: "kraken", name: "Kraken", role: "Deep Liquidity Specialist & Dark Pool Orderflow", color: "#00FFCC" },
  { id: "lion", name: "Lion", role: "Macro Regime Conviction & Sovereign Commander", color: "#FFC000" },
  { id: "phoenix", name: "Phoenix", role: "Asymmetric Recovery Protocol & Rebound Specialist", color: "#FF0055" }
] as const;

export const CHAPTERS_LIST = [
  { num: 1, id: "ch-01", title: "Orbit Origin" },
  { num: 2, id: "ch-02", title: "Cyber Nebula" },
  { num: 3, id: "ch-03", title: "Obsidian Horizon" },
  { num: 4, id: "ch-04", title: "Solar Flare Sanctuary" },
  { num: 5, id: "ch-05", title: "Celestial Foundry" },
  { num: 6, id: "ch-06", title: "Quantum Singularity" },
  { num: 7, id: "ch-07", title: "Deep Space Void" },
  { num: 8, id: "ch-08", title: "Aurora Borealis Prime" },
  { num: 9, id: "ch-09", title: "Plasma Reef" },
  { num: 10, id: "ch-10", title: "Chronos Gateway" },
  { num: 11, id: "ch-11", title: "Hyperdrive Corridor" },
  { num: 12, id: "ch-12", title: "Supernova Cradle" },
  { num: 13, id: "ch-13", title: "Asteroid Citadel" },
  { num: 14, id: "ch-14", title: "Dark Matter Matrix" },
  { num: 15, id: "ch-15", title: "Binary Star Nexus" },
  { num: 16, id: "ch-16", title: "Titan Stratosphere" },
  { num: 17, id: "ch-17", title: "Andromeda Outpost" },
  { num: 18, id: "ch-18", title: "Galactic Core" }
] as const;

export function getAll144Artworks(): Artwork144Item[] {
  return THE_144_CATALOG;
}

export function getArtworkById(id: string): Artwork144Item | undefined {
  const norm = id.toLowerCase().trim();
  return THE_144_CATALOG.find(a => a.id.toLowerCase() === norm);
}

export function getArtworkBySlug(slug: string): Artwork144Item | undefined {
  const norm = slug.toLowerCase().trim();
  return THE_144_CATALOG.find(a => a.slug.toLowerCase() === norm || a.id.toLowerCase() === norm);
}

export function filter144Artworks(options?: {
  crew?: string;
  chapter?: number | string;
  query?: string;
  favorites?: string[];
}): Artwork144Item[] {
  let list = THE_144_CATALOG;

  if (options?.crew && options.crew !== "all") {
    const c = options.crew.toLowerCase();
    list = list.filter(a => a.crewCanonicalId === c || a.memberName.toLowerCase() === c);
  }

  if (options?.chapter && options.chapter !== "all") {
    const chNum = Number(options.chapter);
    if (!isNaN(chNum)) {
      list = list.filter(a => a.chapterNumber === chNum);
    } else {
      const chStr = String(options.chapter).toLowerCase();
      list = list.filter(a => a.chapterId.toLowerCase() === chStr || a.chapterTitle.toLowerCase().includes(chStr));
    }
  }

  if (options?.query && options.query.trim().length > 0) {
    const q = options.query.toLowerCase().trim();
    list = list.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.memberName.toLowerCase().includes(q) ||
      a.chapterTitle.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }

  if (options?.favorites && options.favorites.length > 0) {
    const favSet = new Set(options.favorites.map(f => f.toLowerCase()));
    list = list.filter(a => favSet.has(a.id.toLowerCase()));
  }

  return list;
}
`;

fs.writeFileSync(path.resolve('src', 'lib', 'art-144-catalog.ts'), tsContent, 'utf8');
console.log(`Generated ${allArtworks.length} artworks across 18 chapters and 8 members.`);
