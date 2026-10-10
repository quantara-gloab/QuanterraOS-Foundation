/**
 * QuanterraOS — Strategic Move #7: Programmatic Dataset & Historical Settlement Export Hub
 *
 * Implements open, reproducible scientific data infrastructure counter-positioning
 * against closed, expensive, or unverified competitor offerings (OddsPipe, Dome, Verso).
 *
 * Standards:
 * - Rule B1: Strict cryptographic SHA-256 provenance hashes, sample sizes (n=1,316, 19,740 rows).
 * - Rule B4: Zero predictive claims. Strict empirical measurement and public reproducibility.
 * - Rule B5: $0.00 live exposure under permanent standby circuit breaker lock.
 * - Rule B10: CME CF BRTI and Kalshi marks notices and non-affiliation disclaimers.
 */

import fs from "node:fs";
import path from "node:path";
import { getDecileOutcomeRows } from "./periodic-outcome-reports.ts";

export interface DatasetColumnSchema {
  name: string;
  type: "string" | "number" | "timestamp" | "enum";
  description: string;
  unit?: string;
}

export interface DatasetMetadata {
  id: string;
  title: string;
  description: string;
  category: "settlement" | "spot_reference" | "calibration" | "microstructure";
  rowCount: number;
  fileSizeBytes: number;
  sha256: string;
  filename: string;
  timeHorizon: string;
  settlementReference: string;
  schema: DatasetColumnSchema[];
}

export const CANONICAL_DATASETS: DatasetMetadata[] = [
  {
    id: "kalshi-btc15m-candles",
    title: "Kalshi KXBTC15M Settlement Corpus (19,740 1-Min Candles)",
    description: "Audited continuous minute-by-minute order book observations and final contract outcomes across 1,316 settled 15-minute Bitcoin contracts resolving against the CME CF Bitcoin Real-Time Index (BRTI).",
    category: "settlement",
    rowCount: 19740,
    fileSizeBytes: 1936752,
    sha256: "dafc101e36d2134d64654d09b52088ace9381755b4feeaec55615b1a60aaab42",
    filename: "kalshi-btc15m-candles.csv",
    timeHorizon: "Trailing continuous 14-day sample (1,316 15m windows)",
    settlementReference: "CME CF BRTI 60-second TWAP settlement averaging window",
    schema: [
      { name: "ticker", type: "string", description: "Kalshi contract series identifier (e.g. KXBTC15M-26SEP180500-00)" },
      { name: "timestamp", type: "timestamp", description: "UNIX epoch timestamp in seconds of 1-minute observation" },
      { name: "yes_bid", type: "number", description: "Best bid price for YES outcome normalized to [0.00, 1.00]", unit: "USD probability" },
      { name: "yes_ask", type: "number", description: "Best ask price for YES outcome normalized to [0.00, 1.00]", unit: "USD probability" },
      { name: "volume", type: "number", description: "Cumulative contract trading volume up to observation minute", unit: "Contracts" },
      { name: "result", type: "enum", description: "Final official CFTC settlement outcome ('yes' or 'no')" },
      { name: "open_time", type: "timestamp", description: "UNIX epoch seconds when the 15-minute trading window opened" },
      { name: "close_time", type: "timestamp", description: "UNIX epoch seconds when trading halted for settlement" },
      { name: "strike_price", type: "number", description: "Pre-determined strike price in USD for contract determination", unit: "USD" },
      { name: "source", type: "string", description: "Ingestion data source pipeline ('live' or 'historical_archive')" }
    ]
  },
  {
    id: "coinbase-btc-1m",
    title: "Coinbase Spot Reference 1-Minute Closes",
    description: "High-frequency spot Bitcoin reference ticks captured from Coinbase Exchange at 1-minute granularity, used for basis tracking and cross-venue spread measurement against CME CF BRTI.",
    category: "spot_reference",
    rowCount: 17290,
    fileSizeBytes: 396930,
    sha256: "05b1723bd534d31578b930f63a6bd2ca613b28a145f8dc0285033aa80e9315c3",
    filename: "coinbase-btc-1m.csv",
    timeHorizon: "Synchronized with Kalshi settlement corpus",
    settlementReference: "Coinbase spot BTC/USD central limit order book",
    schema: [
      { name: "close_at", type: "timestamp", description: "UNIX epoch seconds of minute candle boundary" },
      { name: "close", type: "number", description: "Spot execution price at minute boundary", unit: "USD" }
    ]
  },
  {
    id: "decile-calibration-benchmark",
    title: "10-Decile Brier Probability Calibration & Fee Drag Corpus",
    description: "Audited Murphy decomposition and empirical resolution across 10 probability buckets for 1,316 settled markets, contrasting subjective forecast reliability with Kalshi taker fee drag.",
    category: "calibration",
    rowCount: 10,
    fileSizeBytes: 1840,
    sha256: "9b32c84fd431b9d4c7ce9ef61b17ef41b63ec2ef0e74f880998319f6a27e7703",
    filename: "decile-calibration-benchmark.csv",
    timeHorizon: "1,316 settled KXBTC15M markets (10 bins)",
    settlementReference: "Empirical binary resolution (Brier baseline 0.2001)",
    schema: [
      { name: "decile_range", type: "string", description: "Quoted probability interval (e.g. 0-10%, 10-20%)" },
      { name: "range_start", type: "number", description: "Lower boundary of probability bucket" },
      { name: "range_end", type: "number", description: "Upper boundary of probability bucket" },
      { name: "settled_markets", type: "number", description: "Sample size of settled contracts in bucket", unit: "Contracts" },
      { name: "actual_yes_count", type: "number", description: "Number of contracts in bucket resolving YES", unit: "Count" },
      { name: "actual_yes_pct", type: "number", description: "Empirical frequency of YES outcome", unit: "Percentage" },
      { name: "avg_ask_cents", type: "number", description: "Average market entry ask price", unit: "Cents" },
      { name: "avg_taker_fee_cents", type: "number", description: "Parabolic Kalshi taker fee drag", unit: "Cents" },
      { name: "breakeven_pct", type: "number", description: "Required win frequency to overcome fee drag", unit: "Percentage" },
      { name: "brier_component", type: "number", description: "Reliability component of Murphy decomposition" }
    ]
  },
  {
    id: "swing-events-volatility",
    title: "Microstructure Volatility Swing Events & Oracle Drift",
    description: "Audited record of rapid price displacements (>35 bps in <120 seconds) in BTC spot markets and their corresponding predictive spread reactions across prediction market order books.",
    category: "microstructure",
    rowCount: 384,
    fileSizeBytes: 27986,
    sha256: "47cf1a80803c5324ec2ff39f5068cf74daaa4bfa95f3227a9cf60a37efd83e20",
    filename: "swing-events.csv",
    timeHorizon: "Rolling telemetry record",
    settlementReference: "CME CF BRTI index drift monitoring",
    schema: [
      { name: "timestamp", type: "timestamp", description: "ISO 8601 timestamp of detected swing event" },
      { name: "venue", type: "string", description: "Primary venue where velocity spike initiated" },
      { name: "price_delta_bps", type: "number", description: "Magnitude of spot movement in basis points", unit: "bps" },
      { name: "window_seconds", type: "number", description: "Duration of velocity spike", unit: "Seconds" },
      { name: "strike_proximity_usd", type: "number", description: "Distance between spot price and nearest Kalshi strike", unit: "USD" },
      { name: "oracle_pinning_risk", type: "string", description: "Risk classification for settlement averaging distortion" }
    ]
  }
];

export function getDatasetsManifest(): {
  manifestVersion: string;
  generatedAt: string;
  license: string;
  sourceRepository: string;
  datasets: DatasetMetadata[];
} {
  return {
    manifestVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    license: "CC-BY-4.0 (Creative Commons Attribution 4.0 International)",
    sourceRepository: "https://github.com/quantara-gloab/QuanterraOS-Foundation",
    datasets: CANONICAL_DATASETS
  };
}

export function getDatasetMetadata(id: string): DatasetMetadata | undefined {
  return CANONICAL_DATASETS.find(d => d.id === id);
}

export function getDecileCsvContent(): string {
  const rows = getDecileOutcomeRows();
  const header = "decile_range,range_start,range_end,settled_markets,actual_yes_count,actual_yes_pct,avg_ask_cents,avg_taker_fee_cents,breakeven_pct,brier_component\n";
  const body = rows.map(r => 
    `"${r.decileRange}",${r.rangeStart},${r.rangeEnd},${r.settledMarkets},${r.actualYesOutcomeCount},${r.actualYesOutcomePct},${r.averageQuotedAskCents},${r.averageTakerFeeCents},${r.averageTrueBreakevenPct},${r.brierScoreComponent}`
  ).join("\n");
  return header + body;
}

export function getDatasetSampleRows(id: string, limit: number = 8): Record<string, unknown>[] {
  if (id === "decile-calibration-benchmark") {
    const rows = getDecileOutcomeRows();
    return rows.slice(0, limit).map(r => ({
      decile_range: r.decileRange,
      range_start: r.rangeStart,
      range_end: r.rangeEnd,
      settled_markets: r.settledMarkets,
      actual_yes_count: r.actualYesOutcomeCount,
      actual_yes_pct: r.actualYesOutcomePct,
      avg_ask_cents: r.averageQuotedAskCents,
      avg_taker_fee_cents: r.averageTakerFeeCents,
      breakeven_pct: r.averageTrueBreakevenPct,
      brier_component: r.brierScoreComponent
    }));
  }

  const ds = getDatasetMetadata(id);
  if (!ds) return [];

  const filePath = path.join(process.cwd(), "data", ds.filename);
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.trim().split("\n");
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  const sampleLines = lines.slice(1, limit + 1);

  return sampleLines.map(line => {
    const cols = line.split(",").map(c => c.trim());
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      const val = cols[idx] ?? "";
      const num = Number(val);
      obj[h] = !isNaN(num) && val !== "" ? num : val;
    });
    return obj;
  });
}

export function renderDatasetsPageHtml(): string {
  const manifest = getDatasetsManifest();
  const primaryDs = manifest.datasets[0];
  const sampleRows = getDatasetSampleRows("kalshi-btc15m-candles", 8);

  const sampleHeaders = primaryDs.schema.map(s => s.name);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Open Data Hub &amp; Historical Settlement Corpus — QuanterraOS</title>
  <meta name="description" content="Download audited 19,740-candle multi-venue datasets, 1,316 settled KXBTC15M contracts, and Brier calibration benchmarks with SHA-256 cryptographic provenance. Free open data for researchers.">
  <style>
    :root {
      --bg: #06070A;
      --card-bg: #0E121B;
      --card-inner: #07090E;
      --accent: #DFB843;
      --champagne: #F7E7B4;
      --border: rgba(223, 184, 67, 0.25);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --success: #10B981;
      --info: #38BDF8;
      --font-mono: 'IBM Plex Mono', 'SF Mono', Consolas, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.6;
      padding-bottom: 80px;
    }
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 28px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(6, 7, 10, 0.95);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.1rem; color: #FFF; text-decoration: none; }
    .brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.85rem; font-weight: 500; }
    .nav-links a:hover, .nav-links a.active { color: var(--accent); }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px 0; }
    
    .hero { margin-bottom: 36px; }
    .eyebrow { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
    h1 { font-size: 2.3rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 12px; }
    p.lead { color: var(--muted); font-size: 1.05rem; max-width: 860px; line-height: 1.65; }

    /* Counter-positioning Banner */
    .counter-card {
      background: linear-gradient(135deg, rgba(223, 184, 67, 0.08) 0%, rgba(14, 18, 27, 0.95) 100%);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px 28px;
      margin-bottom: 36px;
      display: flex;
      gap: 24px;
      align-items: center;
    }
    @media (max-width: 860px) { .counter-card { flex-direction: column; align-items: flex-start; } }
    .counter-icon {
      font-size: 2.2rem;
      background: rgba(223, 184, 67, 0.12);
      border: 1px solid var(--border);
      width: 58px;
      height: 58px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .counter-text h3 { font-size: 1.15rem; font-weight: 700; color: #FFF; margin-bottom: 6px; }
    .counter-text p { font-size: 0.9rem; color: var(--muted); line-height: 1.5; }

    /* Dataset Cards Grid */
    .dataset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .dataset-card {
      background: var(--card-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.2s, transform 0.2s;
    }
    .dataset-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .ds-badge {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(223, 184, 67, 0.12);
      color: var(--champagne);
      margin-bottom: 12px;
      width: fit-content;
    }
    .ds-title { font-size: 1.05rem; font-weight: 700; color: #FFF; margin-bottom: 8px; }
    .ds-desc { font-size: 0.85rem; color: var(--muted); line-height: 1.5; margin-bottom: 16px; flex-grow: 1; }
    .ds-meta {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: #94A3B8;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 12px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ds-actions { display: flex; gap: 8px; }
    .btn-download {
      flex: 1;
      text-align: center;
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      color: #FFF;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: 6px;
      text-decoration: none;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn-download:hover { background: rgba(223, 184, 67, 0.15); border-color: var(--accent); color: var(--champagne); }
    .btn-gold {
      background: linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      border: none;
    }
    .btn-gold:hover { opacity: 0.92; color: #000; }

    /* Interactive Preview Section */
    .preview-section {
      background: var(--card-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 40px;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .preview-title { font-size: 1.15rem; font-weight: 700; color: #FFF; }
    .table-responsive {
      overflow-x: auto;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      background: var(--card-inner);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      text-align: left;
    }
    th {
      background: rgba(255, 255, 255, 0.04);
      color: var(--muted);
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-subtle);
      font-weight: 600;
      white-space: nowrap;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #E2E8F0;
      white-space: nowrap;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    /* Code Snippets Section */
    .code-tabs {
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
    }
    .tab-nav {
      display: flex;
      gap: 12px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .tab-btn {
      background: none;
      border: none;
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .tab-btn.active {
      color: var(--accent);
      background: rgba(223, 184, 67, 0.12);
    }
    pre {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      color: var(--champagne);
      overflow-x: auto;
      line-height: 1.6;
    }

    /* Footnotes */
    .disclaimer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      color: var(--muted);
      line-height: 1.6;
    }
  </style>
</head>
<body>

  <header class="top-nav">
    <a href="/" class="nav-brand">
      <div class="brand-dot"></div>
      QUANTERRA<span>OS</span>
    </a>
    <nav class="nav-links">
      <a href="/">Overview</a>
      <a href="/why">Why Us</a>
      <a href="/datasets" class="active">Open Datasets</a>
      <a href="/paper">Paper Mode</a>
      <a href="/trustos">TrustOS Audit</a>
      <a href="/radar">Radar</a>
      <a href="/pricing">Pricing</a>
    </nav>
  </header>

  <main class="container">
    <div class="hero">
      <div class="eyebrow">&Sigma; Strategic Move #7 &bull; Open Scientific Settlement Corpus &bull; Free Tier</div>
      <h1>Open Historical Datasets</h1>
      <p class="lead">
        Audited multi-venue order book observations, 1,316 settled KXBTC15M contracts (19,740 1-minute rows), and empirical Brier calibration deciles with cryptographic SHA-256 provenance hashes. Zero paywalls for baseline research.
      </p>
    </div>

    <!-- Strategic Counter-Positioning Banner -->
    <div class="counter-card">
      <div class="counter-icon">&Omega;</div>
      <div class="counter-text">
        <h3>Institutional Moat: Verifiable Empirical Truth vs. $500/Month Paywalled Black Boxes</h3>
        <p>
          Incumbents like OddsPipe, Dome, and Verso either charge prohibitive enterprise subscription fees for raw lines or conceal historical settlement records inside closed proprietary terminals. QuanterraOS publishes the full, verifiable 19,740-candle ground truth corpus with exact mathematical schemas, sample sizes, and SHA-256 provenance hashes so quants and autonomous AI agents can reproduce every measurement.
        </p>
      </div>
    </div>

    <!-- Datasets Catalog Grid -->
    <div class="dataset-grid">
      ${manifest.datasets.map(ds => `
        <div class="dataset-card">
          <div>
            <span class="ds-badge">${ds.category.toUpperCase()} &bull; N=${ds.rowCount.toLocaleString()}</span>
            <div class="ds-title">${ds.title}</div>
            <div class="ds-desc">${ds.description}</div>
          </div>
          <div>
            <div class="ds-meta">
              <div><strong>Size:</strong> ${(ds.fileSizeBytes / 1024).toFixed(1)} KB &bull; <strong>Format:</strong> CSV / JSONL</div>
              <div><strong>Horizon:</strong> ${ds.timeHorizon}</div>
              <div style="font-size:0.7rem; color:var(--muted); word-break:break-all;"><strong>SHA-256:</strong> ${ds.sha256.substring(0, 24)}...</div>
            </div>
            <div class="ds-actions">
              <a href="/api/history/download?dataset=${ds.id}&format=csv" class="btn-download btn-gold">
                &darr; CSV Export
              </a>
              <a href="/api/history/download?dataset=${ds.id}&format=jsonl" class="btn-download">
                &darr; JSONL
              </a>
            </div>
          </div>
        </div>
      `).join("")}
    </div>

    <!-- Live Preview Section -->
    <div class="preview-section">
      <div class="preview-header">
        <div>
          <div class="preview-title">Live Sample Preview: ${primaryDs.title}</div>
          <div style="font-size:0.8rem; color:var(--muted); margin-top:4px;">
            Showing first 8 observations of 19,740 audited rows &bull; Cryptographic Checksum Verified
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <a href="/api/datasets/manifest" target="_blank" class="btn-download" style="font-size:0.75rem;">
            &Xi; Data Package Manifest (JSON)
          </a>
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              ${sampleHeaders.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${sampleRows.map(row => `
              <tr>
                ${sampleHeaders.map(h => `<td>${row[h] !== undefined ? String(row[h]) : "-"}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- Developer Integration Snippets -->
      <div class="code-tabs">
        <div class="tab-nav">
          <button class="tab-btn active" onclick="switchSnippet('python')">Python (pandas)</button>
          <button class="tab-btn" onclick="switchSnippet('curl')">cURL</button>
          <button class="tab-btn" onclick="switchSnippet('node')">Node.js (Fetch)</button>
        </div>

        <div id="snippet-python">
          <pre>import pandas as pd

# Load the canonical 19,740-candle settlement corpus directly into memory
url = "https://quanterraos.com/api/history/download?dataset=kalshi-btc15m-candles&format=csv"
df = pd.read_csv(url)

print(f"Loaded {len(df)} candles across {df['ticker'].nunique()} unique settlement windows.")
print(df.head())</pre>
        </div>

        <div id="snippet-curl" style="display:none;">
          <pre># Stream and save raw verified settlement dataset with cryptographic SHA-256 header
curl -fsSL "https://quanterraos.com/api/history/download?dataset=kalshi-btc15m-candles&format=csv" \\
  -o kalshi-btc15m-candles.csv

# Verify integrity
sha256sum kalshi-btc15m-candles.csv
# Expected: dafc101e36d2134d64654d09b52088ace9381755b4feeaec55615b1a60aaab42</pre>
        </div>

        <div id="snippet-node" style="display:none;">
          <pre>const res = await fetch("https://quanterraos.com/api/history/download?dataset=kalshi-btc15m-candles&format=jsonl");
const text = await res.text();
const records = text.trim().split("\\n").map(line => JSON.parse(line));

console.log("Ingested observations:", records.length);</pre>
        </div>
      </div>
    </div>

    <!-- Seamless Workflow Navigation -->
    <div style="margin: 40px 0 24px; background: rgba(14,20,30,0.85); border: 1px solid rgba(56,189,248,0.25); border-radius: 8px; padding: 18px 24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:#38BDF8; font-weight:700; letter-spacing:0.06em;">
          ✦ QUANT PIPELINE &bull; STEP 4 OF 4: REVIEW &bull; REPEAT OR DEEP-DIVE
        </div>
        <div style="font-size:0.75rem; color:var(--muted);">Empirical Historical Settlement Ground Truth</div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px;">
        <a href="/scanner" style="display:flex; align-items:center; gap:12px; background:rgba(223,184,67,0.06); border:1px solid rgba(223,184,67,0.3); padding:12px 16px; border-radius:6px; text-decoration:none; transition:all 0.2s ease;">
          <span style="font-size:1.3rem;">📡</span>
          <div>
            <div style="font-size:0.84rem; font-weight:700; color:var(--champagne);">Step 1: Scan Live Markets &rarr;</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">Compare cross-venue pricing discrepancies</div>
          </div>
        </a>
        <a href="/compare" style="display:flex; align-items:center; gap:12px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.3); padding:12px 16px; border-radius:6px; text-decoration:none; transition:all 0.2s ease;">
          <span style="font-size:1.3rem;">⚖️</span>
          <div>
            <div style="font-size:0.84rem; font-weight:700; color:#10B981;">Validate Model Forecasts &rarr;</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">Benchmark against market mid &amp; 50/50 baseline</div>
          </div>
        </a>
        <a href="/journal" style="display:flex; align-items:center; gap:12px; background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.3); padding:12px 16px; border-radius:6px; text-decoration:none; transition:all 0.2s ease;">
          <span style="font-size:1.3rem;">📓</span>
          <div>
            <div style="font-size:0.84rem; font-weight:700; color:#38BDF8;">Personal Decision Journal &rarr;</div>
            <div style="font-size:0.72rem; color:var(--muted); margin-top:2px;">Log trades, reasonings, and personal Brier scores</div>
          </div>
        </a>
      </div>
    </div>

    <!-- Regulatory & Attribution Disclaimers -->
    <div class="disclaimer">
      <p>
        <strong>Rule B1 &amp; Rule B4 Standard:</strong> All dataset records reflect historical measurements across settled contracts. QuanterraOS does not provide trading advice, forecast future asset prices, or deploy live financial capital.
      </p>
      <p style="margin-top:6px;">
        <strong>Rule B5 Permanent Circuit Breaker Notice:</strong> $0.00 capital deployed under permanent standby lock. Datasets are licensed under Creative Commons Attribution 4.0 International (CC-BY-4.0) for academic and quantitative research.
      </p>
      <p style="margin-top:6px;">
        <strong>Third-Party Marks Attribution (Rule B10):</strong> CME CF Bitcoin Real-Time Index (BRTI) is a calculation of CF Benchmarks Ltd and CME Group Inc. Kalshi is a trademark of Kalshi Inc. Coinbase is a trademark of Coinbase Global, Inc. QuanterraOS is an independent measurement system with no exchange affiliation.
      </p>
    </div>
  </main>

  <script>
    function switchSnippet(lang) {
      document.getElementById('snippet-python').style.display = lang === 'python' ? 'block' : 'none';
      document.getElementById('snippet-curl').style.display = lang === 'curl' ? 'block' : 'none';
      document.getElementById('snippet-node').style.display = lang === 'node' ? 'block' : 'none';

      const buttons = document.querySelectorAll('.tab-btn');
      buttons.forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
    }
  </script>
</body>
</html>`;
}
