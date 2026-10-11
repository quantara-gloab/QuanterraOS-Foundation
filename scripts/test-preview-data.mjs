import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('.');
const assetCatalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'asset-catalog.json'), 'utf8'));
const merchandiseCatalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'merchandise-catalog.json'), 'utf8'));

console.log(`Loaded ${assetCatalog.length} artworks and ${merchandiseCatalog.length} merchandise items.`);

// Extract the 13 unique boards from merchandise catalog or define them cleanly
const uniqueBoards = [
  { id: "board-michael", name: "Founder M Edition Presentation Board", crew: "michael", file: "michael-apparel-board.png", col: "Founder M Edition" },
  { id: "board-quanta", name: "Quanta Leader Presentation Board", crew: "quanta", file: "quanta-leader-apparel-board.png", col: "Crew Essentials" },
  { id: "board-king", name: "Celestial Man Royal Galactic Board", crew: "king", file: "king-royal-galactic-board.png", col: "Celestial Collection" },
  { id: "board-queen", name: "Celestial Woman Royal Galactic Board", crew: "queen", file: "queen-royal-galactic-board.png", col: "Celestial Collection" },
  { id: "board-draco", name: "Draco Utility Flight Board", crew: "draco", file: "draco-apparel-board.png", col: "Crew Essentials" },
  { id: "board-wolf", name: "Wolf Arctic Loopback Board", crew: "wolf", file: "wolf-apparel-board.png", col: "Crew Essentials" },
  { id: "board-falcon", name: "Falcon Aerodynamic Flight Board", crew: "falcon", file: "falcon-apparel-board.png", col: "Executive Orbit" },
  { id: "board-quantum-fox", name: "Quantum Fox Diamond Weave Board", crew: "quantum-fox", file: "quantum-fox-apparel-board.png", col: "Executive Orbit" },
  { id: "board-sentinel", name: "Sentinel Armored Shield Board", crew: "sentinel", file: "sentinel-apparel-board.png", col: "Crew Essentials" },
  { id: "board-kraken", name: "Kraken Deep Orbit Hydro-Weave Board", crew: "kraken", file: "kraken-apparel-board.png", col: "Executive Orbit" },
  { id: "board-lion", name: "Lion Imperial Solar Silk Board", crew: "lion", file: "lion-apparel-board.png", col: "Celestial Collection" },
  { id: "board-phoenix", name: "Phoenix Thermal Re-entry Board", crew: "phoenix", file: "phoenix-apparel-board.png", col: "Crew Essentials" },
  { id: "board-quantana", name: "Quantana Queen Academy Board", crew: "quantana", file: "quantana-apparel-board.png", col: "Celestial Collection" },
];

console.log(`Prepared ${uniqueBoards.length} apparel boards.`);
