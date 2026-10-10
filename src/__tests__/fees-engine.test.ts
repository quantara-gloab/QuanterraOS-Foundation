import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeKalshiTakerFee,
  computeTrueCostCheck,
  computeMakerTakerSaver,
  computeRoundingOptimizer,
  computeCrossVenueNetSpread,
  KALSHI_FEE_SCHEDULES,
  POLYMARKET_FEE_SCHEDULES,
  ceilToCent,
} from "../lib/fees.ts";

describe("Phase 2 Task 2.5 Acceptance: src/lib/fees.ts True-Cost Engine", () => {
  it("enforces acceptance criteria: 10 ct @ $0.51 -> fee $0.18", () => {
    // 0.07 * 10 * 0.51 * (1 - 0.51) = 0.17493 -> ceil to cent = $0.18
    const fee = computeKalshiTakerFee(10, 0.51);
    assert.strictEqual(fee, 0.18);
  });

  it("enforces acceptance criteria: 100 ct @ $0.50 -> fee $1.75", () => {
    // 0.07 * 100 * 0.50 * 0.50 = 1.75 -> ceil to cent = $1.75
    const fee = computeKalshiTakerFee(100, 0.50);
    assert.strictEqual(fee, 1.75);
  });

  it("enforces acceptance criteria: breakeven at 51¢ = 52.75% raw / matches rounded fee for given C", () => {
    const result100 = computeTrueCostCheck({
      venue: "kalshi",
      price: 0.51,
      contracts: 100,
    });

    // Raw continuous breakeven = 51¢ + 1.7493¢ fee = 52.75%
    assert.strictEqual(result100.rawBreakevenPct, 52.75);
    // For 100 contracts: total cost = 51.00 + 1.75 fee = $52.75 -> 52.75%
    assert.strictEqual(result100.discreteBreakevenPct, 52.75);

    // For 10 contracts: total cost = 5.10 + 0.18 fee = $5.28 -> 52.80%
    const result10 = computeTrueCostCheck({
      venue: "kalshi",
      price: 0.51,
      contracts: 10,
    });
    assert.strictEqual(result10.fee, 0.18);
    assert.strictEqual(result10.discreteBreakevenPct, 52.80);
  });

  it("verifies fee schedules carry source_url and effective_date", () => {
    for (const [name, schedule] of Object.entries(KALSHI_FEE_SCHEDULES)) {
      assert.ok(schedule.source_url.startsWith("http"), `Kalshi schedule ${name} must have valid source_url`);
      assert.ok(schedule.effective_date.length >= 8, `Kalshi schedule ${name} must have effective_date`);
    }

    for (const [name, schedule] of Object.entries(POLYMARKET_FEE_SCHEDULES)) {
      assert.ok(schedule.source_url.startsWith("http"), `Polymarket schedule ${name} must have valid source_url`);
      assert.ok(schedule.effective_date.length >= 8, `Polymarket schedule ${name} must have effective_date`);
    }
  });

  it("flags danger-zone on 50¢ coin-flip entries and includes educational warning", () => {
    const dangerCheck = computeTrueCostCheck({
      venue: "kalshi",
      price: 0.50,
      contracts: 100,
    });
    assert.strictEqual(dangerCheck.dangerZoneFlag, true);
    assert.ok(dangerCheck.dangerZoneNotice?.includes("Coin-Flip Danger Zone"));

    const safeCheck = computeTrueCostCheck({
      venue: "kalshi",
      price: 0.85,
      contracts: 100,
    });
    assert.strictEqual(safeCheck.dangerZoneFlag, false);
    assert.strictEqual(safeCheck.dangerZoneNotice, undefined);
  });

  it("evaluates Maker vs Taker Saver accurately", () => {
    const saver = computeMakerTakerSaver(100, 0.50);
    assert.strictEqual(saver.takerFee, 1.75);
    assert.strictEqual(saver.makerFee, 0.0);
    assert.strictEqual(saver.dollarSavings, 1.75);
    assert.strictEqual(saver.savingsBps, 350); // 350 bps on $50 outlay
    assert.strictEqual(saver.hurdleReductionPct, 1.75); // Breakeven drops from 51.75% to 50.00%
    assert.ok(saver.methodologyNote.includes("Maker orders on Kalshi incur $0.00 fee"));
  });

  it("calculates Rounding Optimizer consolidation savings", () => {
    // 10 separate orders of 1 contract @ $0.50
    // 1 contract @ 0.50 -> 0.07 * 1 * 0.25 = 0.0175 -> ceil = $0.02 each -> $0.20 total
    // 1 order of 10 contracts @ 0.50 -> 0.07 * 10 * 0.25 = 0.175 -> ceil = $0.18
    // Rounding drag = $0.20 - $0.18 = $0.02 (2 cents saved)
    const opt = computeRoundingOptimizer(1, 10, 0.50);
    assert.strictEqual(opt.currentFee, 0.20);
    assert.strictEqual(opt.consolidatedFee, 0.18);
    assert.strictEqual(opt.roundingDragCents, 2);
    assert.ok(opt.recommendation.includes("saves $0.02 (2¢)"));
  });

  it("computes Cross-Venue Net Spread with settlement mismatch warning", () => {
    const cross = computeCrossVenueNetSpread({
      kalshiPrice: 0.50,
      polymarketPrice: 0.54, // 4¢ gross spread
      contracts: 100,
    });
    assert.strictEqual(cross.grossSpreadCents, 4.00);
    assert.strictEqual(cross.kalshiTakerFee, 1.75); // 1.75¢ per contract
    // Net spread = 4.00 - 1.75 = 2.25¢
    assert.strictEqual(cross.netSpreadCents, 2.25);
    assert.strictEqual(cross.isNetArbitrageViable, true);
    assert.ok(cross.settlementMismatchNotice.includes("CME CF BRTI 60-second TWAP"));
    assert.ok(cross.settlementMismatchNotice.includes("UMA decentralized oracle"));
  });
});
