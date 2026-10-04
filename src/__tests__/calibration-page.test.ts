import assert from "node:assert/strict";
import test from "node:test";
import { getOrComputeCalibrationReport, renderCalibrationHtml } from "../calibration-page.ts";

test("getOrComputeCalibrationReport computes the canonical 1,316-market baseline", async () => {
  const report = await getOrComputeCalibrationReport();
  assert.equal(report.sampleSize, 1316);
  assert.ok(report.averageBrierScore !== null);
  assert.equal(report.averageBrierScore.toFixed(4), "0.2001");
  assert.equal(report.calibration.length, 10);

  // Check key bin counts
  assert.equal(report.calibration[0].count, 18);
  assert.equal(report.calibration[1].count, 79);
  assert.equal(report.calibration[2].count, 150);
  assert.equal(report.calibration[9].count, 19);
});

test("renderCalibrationHtml renders headline stat, 10-bin table, and SVG curve", async () => {
  const report = await getOrComputeCalibrationReport();
  const html = renderCalibrationHtml(report, "2026-10-04T00:00:00Z");

  assert.ok(html.includes("Market Price Calibration Benchmark"));
  assert.ok(html.includes("0.2001"));
  assert.ok(html.includes("1,316"));
  assert.ok(html.includes("MARKET WINS"));
  assert.ok(html.includes("calibration-svg"));
  assert.ok(html.includes("QuanterraOS doesn't claim to beat this market — we verify it."));
  assert.ok(html.includes("0-10%"));
  assert.ok(html.includes("90-100%"));
});
