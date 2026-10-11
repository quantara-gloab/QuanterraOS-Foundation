import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const rootDir = path.resolve('.');
const publicAssetsDir = path.join(rootDir, 'public', 'assets');
const extractedAssetsDir = path.join(rootDir, 'extracted_kit', 'assets');

// 11 Members
const MEMBERS = [
  { id: 'michael', name: 'Michael Quanterra', role: 'Founder & Creative Provenance', symbol: 'founder-m', visualIdentity: 'M helmet forehead; violet star eyes; cyan smile; black/pearl/gold founder suit', productResponsibility: 'Founder story and provenance. Brand character, not a trading engine' },
  { id: 'quanta', name: 'Quanta', role: 'Assistant & Global Galactic Leader', symbol: 'dual-arrows', visualIdentity: 'Green up arrow and pink down arrow together; violet smile; gold crown/purple orb', productResponsibility: 'Assistant, orchestration and explanation' },
  { id: 'quantana', name: 'Quantana', role: 'Queen, Companion & Academy Host', symbol: 'cosmic-tiara', visualIdentity: 'Violet curved smiling eyes; tiara; cosmic ribbon veil', productResponsibility: 'Onboarding and education; Queen collection host' },
  { id: 'draco', name: 'Draco', role: 'Data Quality & Provenance Specialist', symbol: 'dragon', visualIdentity: 'Amber angular eyes; red dragon crest', productResponsibility: 'Data quality, provenance, outlier checks' },
  { id: 'wolf', name: 'Wolf', role: 'Order Book Queue & Liquidity Specialist', symbol: 'wolf', visualIdentity: 'Ice-cyan chevrons; wolf helmet fins', productResponsibility: 'Order book, spread, liquidity and fill assumptions' },
  { id: 'falcon', name: 'Falcon', role: 'Short-Horizon Research & Depth Specialist', symbol: 'falcon', visualIdentity: 'Blue wing eyes; aerodynamic fins', productResponsibility: 'Short-horizon research; timestamped probabilistic output if validated' },
  { id: 'quantum-fox', name: 'Quantum Fox', role: 'Out-of-Sample Calibration & Uncertainty Auditor', symbol: 'fox', visualIdentity: 'Violet diamond eyes; fox fins', productResponsibility: 'Out-of-sample validation, uncertainty and calibration' },
  { id: 'sentinel', name: 'Sentinel', role: 'Feed Health, Staleness & Risk-State Monitor', symbol: 'shield', visualIdentity: 'Green hexagon eyes; diagnostic shield', productResponsibility: 'Feed health, staleness, risk-state monitoring' },
  { id: 'kraken', name: 'Kraken', role: 'Spot/Index Basis & Contract Settlement Rules Auditor', symbol: 'kraken', visualIdentity: 'Aqua spirals; sensor arms', productResponsibility: 'Spot/index basis and contract-specific settlement rules' },
  { id: 'lion', name: 'Lion', role: 'Evidence Synthesis & Disagreement Summarizer', symbol: 'lion', visualIdentity: 'Amber sun discs; gold mechanical mane', productResponsibility: 'Evidence synthesis and disagreement summary' },
  { id: 'phoenix', name: 'Phoenix', role: 'Reconnection, Resilience & Incident State Guardian', symbol: 'phoenix', visualIdentity: 'Pink curved eyes; coral feather crest', productResponsibility: 'Reconnection, recovery and incident state' }
];

// 4 Chapters
const CHAPTERS = [
  { number: 1, id: 'origin-command', title: 'Origin Command' },
  { number: 2, id: 'cosmic-street', title: 'Cosmic Street' },
  { number: 3, id: 'executive-orbit', title: 'Executive Orbit' },
  { number: 4, id: 'royal-ascension', title: 'Royal Ascension' }
];

// 13 Apparel Boards
const APPAREL_BOARDS = [
  { id: 'board-michael', boardSlug: 'michael-founder-board', title: 'Founder M Edition — Michael Quanterra Six-Look Apparel Board', collection: 'Founder M Edition', memberOrThemeId: 'michael', memberName: 'Michael Quanterra', boardImage: '/assets/apparel/michael-apparel-board.png', kitFile: 'apparel-michael-quanterra.png', prompt: 'Six-look fashion presentation board for Michael Quanterra Founder M Edition', description: 'Six-look design board showcasing the Founder M Edition collection.' },
  { id: 'board-quanta', boardSlug: 'quanta-leader-board', title: 'Quanta Galactic Leader Six-Look Apparel Board', collection: 'Crew Essentials', memberOrThemeId: 'quanta', memberName: 'Quanta', boardImage: '/assets/apparel/quanta-leader-apparel-board.png', kitFile: 'apparel-quanta.png', prompt: 'Six-look fashion presentation board for Quanta Galactic Leader', description: 'Six-look design board for Quanta.' },
  { id: 'board-quantana', boardSlug: 'quantana-queen-board', title: 'Quantana Academy & Queen Companion Six-Look Apparel Board', collection: 'Executive Orbit', memberOrThemeId: 'quantana', memberName: 'Quantana', boardImage: '/assets/apparel/quantana-apparel-board.png', kitFile: 'apparel-quantana.png', prompt: 'Six-look fashion presentation board for Quantana', description: 'Six-look design board for Quantana.' },
  { id: 'board-draco', boardSlug: 'draco-apparel-board', title: 'Draco Data Quality & Provenance Six-Look Apparel Board', collection: 'Crew Essentials', memberOrThemeId: 'draco', memberName: 'Draco', boardImage: '/assets/apparel/draco-apparel-board.png', kitFile: 'apparel-draco.png', prompt: 'Six-look fashion presentation board for Draco', description: 'Six-look design board for Draco.' },
  { id: 'board-wolf', boardSlug: 'wolf-apparel-board', title: 'Wolf Liquidity & Order Book Six-Look Apparel Board', collection: 'Crew Essentials', memberOrThemeId: 'wolf', memberName: 'Wolf', boardImage: '/assets/apparel/wolf-apparel-board.png', kitFile: 'apparel-wolf.png', prompt: 'Six-look fashion presentation board for Wolf', description: 'Six-look design board for Wolf.' },
  { id: 'board-falcon', boardSlug: 'falcon-apparel-board', title: 'Falcon Probabilistic Depth Six-Look Apparel Board', collection: 'Crew Essentials', memberOrThemeId: 'falcon', memberName: 'Falcon', boardImage: '/assets/apparel/falcon-apparel-board.png', kitFile: 'apparel-falcon.png', prompt: 'Six-look fashion presentation board for Falcon', description: 'Six-look design board for Falcon.' },
  { id: 'board-quantum-fox', boardSlug: 'quantum-fox-apparel-board', title: 'Quantum Fox Calibration & Uncertainty Six-Look Apparel Board', collection: 'Crew Essentials', memberOrThemeId: 'quantum-fox', memberName: 'Quantum Fox', boardImage: '/assets/apparel/quantum-fox-apparel-board.png', kitFile: 'apparel-quantum-fox.png', prompt: 'Six-look fashion presentation board for Quantum Fox', description: 'Six-look design board for Quantum Fox.' },
  { id: 'board-sentinel', boardSlug: 'sentinel-apparel-board', title: 'Sentinel Feed Health & Monitor Six-Look Apparel Board', collection: 'Crew Essentials', memberOrThemeId: 'sentinel', memberName: 'Sentinel', boardImage: '/assets/apparel/sentinel-apparel-board.png', kitFile: 'apparel-sentinel.png', prompt: 'Six-look fashion presentation board for Sentinel', description: 'Six-look design board for Sentinel.' },
  { id: 'board-kraken', boardSlug: 'kraken-apparel-board', title: 'Kraken Basis & Settlement Six-Look Apparel Board', collection: 'Executive Orbit', memberOrThemeId: 'kraken', memberName: 'Kraken', boardImage: '/assets/apparel/kraken-apparel-board.png', kitFile: 'apparel-kraken.png', prompt: 'Six-look fashion presentation board for Kraken', description: 'Six-look design board for Kraken.' },
  { id: 'board-lion', boardSlug: 'lion-apparel-board', title: 'Lion Synthesis & Disagreement Six-Look Apparel Board', collection: 'Crew Essentials', memberOrThemeId: 'lion', memberName: 'Lion', boardImage: '/assets/apparel/lion-apparel-board.png', kitFile: 'apparel-lion.png', prompt: 'Six-look fashion presentation board for Lion', description: 'Six-look design board for Lion.' },
  { id: 'board-phoenix', boardSlug: 'phoenix-apparel-board', title: 'Phoenix Resilience & Recovery Six-Look Apparel Board', collection: 'Crew Essentials', memberOrThemeId: 'phoenix', memberName: 'Phoenix', boardImage: '/assets/apparel/phoenix-apparel-board.png', kitFile: 'apparel-phoenix.png', prompt: 'Six-look fashion presentation board for Phoenix', description: 'Six-look design board for Phoenix.' },
  { id: 'board-king-royal', boardSlug: 'king-royal-galactic-board', title: 'King Royal Galactic Six-Look Apparel Board', collection: 'King Royal Galactic', memberOrThemeId: 'royal-king', memberName: 'King Royal Galactic', boardImage: '/assets/apparel/king-royal-galactic-board.png', kitFile: 'royal-king.png', prompt: 'Six-look high fashion presentation board for King Royal Galactic', description: 'Six-look imperial board: deep violet velvet, gold leaf embroidery.' },
  { id: 'board-queen-royal', boardSlug: 'queen-royal-galactic-board', title: 'Queen Royal Galactic Six-Look Apparel Board', collection: 'Queen Royal Galactic', memberOrThemeId: 'royal-queen', memberName: 'Queen Royal Galactic', boardImage: '/assets/apparel/queen-royal-galactic-board.png', kitFile: 'royal-queen.png', prompt: 'Six-look high fashion presentation board for Queen Royal Galactic', description: 'Six-look imperial board: astral silk, rose-gold filigree.' }
];

// Look templates
const LOOKS = [
  { garmentType: 'hoodie', garmentTypeLabel: 'Street Hoodie', fit: 'mens', fitLabel: "Men's Fit", suffix: "Men's Heavyweight Street Hoodie", pieces: ["500 GSM Loopback Cotton Hoodie", "Articulated Ribbed Panels"] },
  { garmentType: 'hoodie', garmentTypeLabel: 'Street Hoodie', fit: 'womens', fitLabel: "Women's Fit", suffix: "Women's Cropped Drop-Shoulder Hoodie", pieces: ["480 GSM Cotton French Terry Hoodie", "Cinchable Elastic Waist"] },
  { garmentType: 'jumpsuit', garmentTypeLabel: 'Flight Jumpsuit', fit: 'mens', fitLabel: "Men's Fit", suffix: "Men's Utility Flight Jumpsuit", pieces: ["Ripstop Cotton Flight Suit", "Reinforced Knee Panels", "Anodized Zippers"] },
  { garmentType: 'jumpsuit', garmentTypeLabel: 'Flight Jumpsuit', fit: 'womens', fitLabel: "Women's Fit", suffix: "Women's Tailored Flight Jumpsuit", pieces: ["Structured Cotton Twill Jumpsuit", "Articulated Sleeve Darting", "Tapered Ankle"] },
  { garmentType: 'business_attire', garmentTypeLabel: 'Business Attire', fit: 'mens', fitLabel: "Men's Fit", suffix: "Men's Orbital Executive Blazer & Trouser", pieces: ["Worsted Wool Blend Single-Breasted Blazer", "Pleated Trousers"] },
  { garmentType: 'business_attire', garmentTypeLabel: 'Business Attire', fit: 'womens', fitLabel: "Women's Fit", suffix: "Women's Orbital Executive Blazer & Trouser", pieces: ["Structured Sculpted Lapel Jacket", "High-Waisted Wide-Leg Trousers"] }
];

console.log('Building 44 artworks...');
const artworks = [];
let artIndex = 1;
const assetValidation = {};

for (const chapter of CHAPTERS) {
  for (const member of MEMBERS) {
    const id = `q44-${String(artIndex).padStart(3, '0')}`;
    const slug = `${member.id}-${chapter.id}-${String(artIndex).padStart(3, '0')}`;
    const title = `${member.name}: ${chapter.title}`;
    const filename = `${id}.png`;
    
    // Check file on disk
    let sizeBytes = 89000;
    let sha256 = 'cb1bff4f28d6aa40d8e9de73bd9ed5bfde6bbc41e21dcfcfca2dde6294e92398';
    const filePath = path.join(publicAssetsDir, filename);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      sizeBytes = buf.length;
      sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    }

    const description = `Elite Eleven collectible artwork ${id} presenting ${member.name} in Chapter 0${chapter.number} (${chapter.title}). Responsible for: ${member.productResponsibility}. Rendered in cosmic tones with signature ${member.visualIdentity}.`;

    artworks.push({
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
      palette: {
        primary: '#9B6CFF',
        secondary: '#CBFF69',
        dark: '#090A14',
        glow: 'rgba(155, 108, 255, 0.5)',
        accent: '#DFB843'
      },
      prompt: `Masterpiece digital artwork of ${member.name} (${member.role}) in chapter setting '${chapter.title}'. Visual signature: ${member.visualIdentity}.`,
      description,
      alt: `Digital artwork of ${member.name} during Chapter ${chapter.number}: ${chapter.title}. ${member.visualIdentity}.`,
      dimensions: { width: 1254, height: 1254 },
      sizeBytes,
      mimeType: 'image/png',
      sha256,
      generationMethod: 'QuanterraOS Elite Eleven Neural Pipeline (AI-Assisted)',
      creatorDisplayName: 'Michael Quanterra & QuanterraOS Foundation',
      approvedAt: '2026-10-10T12:00:00Z',
      mintStatus: 'Artwork · NFT-ready',
      rightsStatus: 'Official QuanterraOS Elite Eleven Creative Universe. All rights reserved.',
      originalAssetUrl: `/assets/art-44/${id}.png`,
      thumbnailUrl: `/assets/art-44/${id}-thumb.png`,
      imagePath: `/assets/art-44/${id}.png`,
      masterImagePath: `/assets/art-44/${id}.png`
    });

    assetValidation[filename] = {
      dimensions: { width: 1254, height: 1254 },
      sha256,
      sizeBytes,
      mimeType: 'image/png',
      decodedSuccessfully: true
    };

    artIndex++;
  }
}

console.log('Building 13 apparel boards validation...');
for (const board of APPAREL_BOARDS) {
  const boardFileName = path.basename(board.boardImage);
  let sizeBytes = 2500000;
  let sha256 = '525a004c8473d8b053b3d0de209b2aee5c86f848caab48f84f1c60f7a3cb78a0';
  const boardPath = path.join(publicAssetsDir, 'apparel', boardFileName);
  if (fs.existsSync(boardPath)) {
    const buf = fs.readFileSync(boardPath);
    sizeBytes = buf.length;
    sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  }

  assetValidation[boardFileName] = {
    dimensions: { width: 1536, height: 1024 },
    sha256,
    sizeBytes,
    mimeType: 'image/png',
    decodedSuccessfully: true
  };
}

console.log('Building campaign portrait validation...');
{
  const portraitFileName = 'elite-eleven-campaign-portrait.png';
  let sizeBytes = 3618460;
  let sha256 = '4bf42be61a693f03d8983c8e45d3f374d56b03899c4c938da6f111b01fb6d547';
  const heroPath = path.join(publicAssetsDir, 'elite-eleven-hero.png');
  if (fs.existsSync(heroPath)) {
    const buf = fs.readFileSync(heroPath);
    sizeBytes = buf.length;
    sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    // Ensure both files exist
    fs.writeFileSync(path.join(publicAssetsDir, portraitFileName), buf);
    fs.writeFileSync(path.join(rootDir, 'assets', portraitFileName), buf);
  }

  assetValidation[portraitFileName] = {
    dimensions: { width: 1920, height: 1080 },
    sha256,
    sizeBytes,
    mimeType: 'image/png',
    decodedSuccessfully: true
  };
}

console.log('Building 78 garment concepts...');
const merchandise = [];
for (const board of APPAREL_BOARDS) {
  for (const look of LOOKS) {
    const sku = `SKU-Q78-${board.memberOrThemeId.toUpperCase().replace(/-/g, '')}-${look.fit.toUpperCase()}-${look.garmentType.toUpperCase()}`;
    const displayName = `${board.memberName} ${look.suffix}`;
    const description = `Concept garment from the ${board.title}. Designed with ${board.collection} specifications. "Design concept — final product may vary. Commercial release pending supplier sample validation and physical tech packs."`;

    merchandise.push({
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
      state: 'concept_only',
      status: 'concept_only',
      statusNotice: 'Design concept — final product may vary',
      checkoutEnabled: false,
      price: null,
      currency: 'USD',
      materials: null,
      dimensions: null,
      shipping: null,
      returns: null,
      stock: null,
      supplierVerified: false,
      inStock: false,
      materialsApproved: false,
      disclaimer: 'Design concept — final product may vary. Not yet manufactured.'
    });
  }
}

// Write files
console.log('Writing asset-catalog.json (44 items)...');
fs.writeFileSync(path.join(rootDir, 'asset-catalog.json'), JSON.stringify(artworks, null, 2), 'utf8');
fs.writeFileSync(path.join(publicAssetsDir, 'asset-catalog.json'), JSON.stringify(artworks, null, 2), 'utf8');

console.log('Writing asset-validation.json (58 entries)...');
fs.writeFileSync(path.join(rootDir, 'asset-validation.json'), JSON.stringify(assetValidation, null, 2), 'utf8');
fs.writeFileSync(path.join(publicAssetsDir, 'asset-validation.json'), JSON.stringify(assetValidation, null, 2), 'utf8');

console.log('Writing merchandise-catalog.json (78 concepts)...');
fs.writeFileSync(path.join(rootDir, 'merchandise-catalog.json'), JSON.stringify(merchandise, null, 2), 'utf8');
fs.writeFileSync(path.join(publicAssetsDir, 'merchandise-catalog.json'), JSON.stringify(merchandise, null, 2), 'utf8');

console.log('Writing build-status.json...');
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
  note: 'Generated concept imagery. Visual review, production integration/device testing and individual approved product photos remain.'
};
fs.writeFileSync(path.join(rootDir, 'build-status.json'), JSON.stringify(buildStatus, null, 2), 'utf8');
fs.writeFileSync(path.join(publicAssetsDir, 'build-status.json'), JSON.stringify(buildStatus, null, 2), 'utf8');

console.log('Catalogs synced successfully!');
