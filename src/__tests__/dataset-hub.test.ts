import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getDatasetsManifest,
  getDatasetMetadata,
  getDatasetSampleRows,
  getDecileCsvContent,
  renderDatasetsPageHtml,
  CANONICAL_DATASETS
} from "../dataset-hub.ts";

describe("Strategic Move #7 — Open Data & Historical Settlement Export Hub", () => {
  it("1. Manifest Verification: returns valid Data Package manifest with SHA-256 checksums", () => {
    const manifest = getDatasetsManifest();

    assert.strictEqual(manifest.manifestVersion, "1.0.0");
    assert.ok(manifest.license.includes("CC-BY-4.0"));
    assert.strictEqual(manifest.datasets.length, 4);

    const kalshiDs = manifest.datasets.find(d => d.id === "kalshi-btc15m-candles");
    assert.ok(kalshiDs);
    assert.strictEqual(kalshiDs?.rowCount, 19740);
    assert.strictEqual(kalshiDs?.fileSizeBytes, 1936752);
    assert.strictEqual(kalshiDs?.sha256, "dafc101e36d2134d64654d09b52088ace9381755b4feeaec55615b1a60aaab42");
    assert.ok(kalshiDs?.schema.length >= 8);

    const coinbaseDs = manifest.datasets.find(d => d.id === "coinbase-btc-1m");
    assert.ok(coinbaseDs);
    assert.strictEqual(coinbaseDs?.rowCount, 17290);
    assert.strictEqual(coinbaseDs?.sha256, "05b1723bd534d31578b930f63a6bd2ca613b28a145f8dc0285033aa80e9315c3");
  });

  it("2. Metadata Lookup: fetches specific dataset with complete column dictionary", () => {
    const ds = getDatasetMetadata("kalshi-btc15m-candles");
    assert.ok(ds);
    assert.strictEqual(ds?.category, "settlement");
    assert.ok(ds?.description.includes("1,316 settled"));

    const schemaFieldNames = ds?.schema.map(s => s.name);
    assert.ok(schemaFieldNames?.includes("ticker"));
    assert.ok(schemaFieldNames?.includes("yes_bid"));
    assert.ok(schemaFieldNames?.includes("yes_ask"));
    assert.ok(schemaFieldNames?.includes("result"));
    assert.ok(schemaFieldNames?.includes("strike_price"));

    const missingDs = getDatasetMetadata("non-existent-dataset");
    assert.strictEqual(missingDs, undefined);
  });

  it("3. Sample Row Parsing: reads preview observations accurately", () => {
    const candleRows = getDatasetSampleRows("kalshi-btc15m-candles", 5);
    assert.strictEqual(candleRows.length, 5);
    assert.ok(candleRows[0].ticker);
    assert.ok(typeof candleRows[0].yes_bid === "number");
    assert.ok(typeof candleRows[0].yes_ask === "number");

    const decileRows = getDatasetSampleRows("decile-calibration-benchmark", 10);
    assert.strictEqual(decileRows.length, 10);
    assert.strictEqual(decileRows[0].decile_range, "0–10%");
    assert.ok(typeof decileRows[0].avg_taker_fee_cents === "number");
  });

  it("4. Decile CSV Generation: formats 10-decile calibration report as valid CSV string", () => {
    const csv = getDecileCsvContent();
    const lines = csv.trim().split("\n");

    assert.strictEqual(lines.length, 11); // header + 10 rows
    assert.ok(lines[0].includes("decile_range,range_start,range_end"));
    assert.ok(lines[1].includes("0–10%"));
    assert.ok(lines[10].includes("90–100%"));
  });

  it("5. Portal HTML Rendering & Institutional Standards Compliance", () => {
    const html = renderDatasetsPageHtml();

    // Structural checks
    assert.ok(html.includes("Open Historical Datasets"));
    assert.ok(html.includes("19,740"));
    assert.ok(html.includes("1,316 settled"));
    assert.ok(html.includes("dafc101e36d2134d64654d09b52088ace9381755b4feeaec55615b1a60aaab42"));
    assert.ok(html.includes("Python (pandas)"));
    assert.ok(html.includes("cURL"));

    // Counter-positioning check against competitors
    assert.ok(html.includes("OddsPipe"));
    assert.ok(html.includes("Dome"));
    assert.ok(html.includes("Verso"));

    // Rule B5 check: Zero live capital deployed
    assert.ok(html.includes("$0.00 capital deployed"), "Must cite $0.00 capital deployed per Rule B5");
    assert.ok(html.includes("standby lock"), "Must state standby lock per Rule B5");

    // Rule B10 check: Third-party marks attribution
    assert.ok(html.includes("CME CF Bitcoin Real-Time Index (BRTI)"), "Must attribute BRTI per Rule B10");
    assert.ok(html.includes("Kalshi is a trademark"), "Must attribute Kalshi per Rule B10");
    assert.ok(html.includes("Coinbase is a trademark"), "Must attribute Coinbase per Rule B10");

    // Rule B4 check: Strictly ban hype and predictive language
    const bannedPatterns = [
      /\balpha\b/i,
      /\bbeat the market\b/i,
      /\bguaranteed\b/i,
      /\barbitrage\b/i,
      /\bmispriced opportunities\b/i
    ];
    for (const pattern of bannedPatterns) {
      assert.strictEqual(
        pattern.test(html),
        false,
        `Datasets HTML violates Rule B4 with banned pattern: ${pattern}`
      );
    }
  });
});
