import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeSpreadReport } from "../spread-monitor.ts";

describe("computeSpreadReport", () => {
  const observedAt = "2026-09-26T00:00:00.000Z";
  const quotes = [
    { source: "BRTI", price: 63_250, observedAt },
    { source: "Coinbase", price: 63_254, observedAt },
    { source: "Kraken", price: 63_244, observedAt },
    { source: "Outlier", price: 63_370, observedAt },
  ];

  test("computes zero spread for the reference row itself", () => {
    const report = computeSpreadReport(quotes, "BRTI");
    const referenceRow = report.rows.find((row) => row.source === "BRTI");
    assert.equal(referenceRow?.spreadAbs, 0);
    assert.equal(referenceRow?.spreadBps, 0);
    assert.equal(referenceRow?.flagged, false);
  });

  test("computes signed absolute and bps spreads against the reference", () => {
    const signedQuotes = [
      { source: "REF", price: 100, observedAt },
      { source: "A", price: 100.1, observedAt }, // +10 bps
      { source: "B", price: 99.5, observedAt }, // -50 bps
    ];
    const report = computeSpreadReport(signedQuotes, "REF", 15);
    const a = report.rows.find((row) => row.source === "A")!;
    const b = report.rows.find((row) => row.source === "B")!;
    assert.equal(report.referencePrice, 100);
    assert.ok(Math.abs(a.spreadBps - 10) < 1e-9);
    assert.ok(Math.abs(b.spreadBps - -50) < 1e-9);
  });

  test("flags rows beyond the threshold and leaves others unflagged", () => {
    const report = computeSpreadReport(quotes, "BRTI", 15);
    const flagged = report.rows.filter((row) => row.flagged).map((row) => row.source);
    assert.deepEqual(flagged, ["Outlier"]);
    assert.equal(report.flaggedCount, 1);
  });

  test("sorts rows by widest absolute spread first", () => {
    const report = computeSpreadReport(quotes, "BRTI");
    const spreadsDescending = report.rows.map((row) => Math.abs(row.spreadBps));
    for (let index = 1; index < spreadsDescending.length; index += 1) {
      assert.ok(spreadsDescending[index - 1] >= spreadsDescending[index]);
    }
  });

  test("widestSpreadBps matches the largest absolute spread in the report", () => {
    const report = computeSpreadReport(quotes, "BRTI");
    assert.equal(report.widestSpreadBps, Math.abs(report.rows[0].spreadBps));
  });

  test("throws when the reference source is not present in quotes", () => {
    assert.throws(() => computeSpreadReport(quotes, "Missing"), /not present in quotes/);
  });

  test("treats a zero reference price as zero spread rather than dividing by zero", () => {
    const zeroQuotes = [
      { source: "BRTI", price: 0, observedAt },
      { source: "Coinbase", price: 5, observedAt },
    ];
    const report = computeSpreadReport(zeroQuotes, "BRTI");
    const coinbaseRow = report.rows.find((row) => row.source === "Coinbase");
    assert.equal(coinbaseRow?.spreadBps, 0);
  });
});
