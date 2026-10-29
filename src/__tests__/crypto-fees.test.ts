import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateCryptoTrueCost, computeKalshiCryptoTakerFee } from "../lib/crypto-fees.ts";

describe("Crypto True-Cost & Friction Engine", () => {
  test("Kalshi parabolic taker fee calculation", () => {
    // At 50c: 0.07 * 50 * 50 / 100 = 1.75 -> ceil = 2c
    const fee50 = computeKalshiCryptoTakerFee(50, 10);
    assert.equal(fee50, 20); // 2c * 10 = 20c

    // At 10c: 0.07 * 10 * 90 / 100 = 0.63 -> ceil = 1c
    const fee10 = computeKalshiCryptoTakerFee(10, 10);
    assert.equal(fee10, 10); // 1c * 10 = 10c
  });

  test("Kalshi BTC trade hurdle calculation", () => {
    const res = calculateCryptoTrueCost({
      venue: "KALSHI",
      asset: "BTC",
      strikePrice: 100000,
      contractPriceCents: 50,
      quantity: 10,
      isTaker: true,
      estimatedSlippageCents: 0,
    });

    assert.equal(res.nominalExposureCents, 500); // $5.00
    assert.equal(res.tradingFeeCents, 20);        // $0.20
    assert.equal(res.totalCostCents, 520);         // $5.20
    assert.equal(res.grossWinningPayoutCents, 1000);// $10.00
    assert.equal(res.netProfitIfWonCents, 480);    // $4.80
    assert.equal(res.breakEvenProbability, 0.52);  // 52% hurdle
    assert.equal(res.dragBps, 400);                // 400 bps drag
  });

  test("Polymarket ETH trade includes gas overhead", () => {
    const res = calculateCryptoTrueCost({
      venue: "POLYMARKET",
      asset: "ETH",
      strikePrice: 3500,
      contractPriceCents: 60,
      quantity: 5,
      isTaker: true,
      relayerGasFeeCents: 2,
    });

    assert.equal(res.nominalExposureCents, 300);
    assert.equal(res.tradingFeeCents, 0);
    assert.equal(res.executionOverheadCents, 2);
    assert.equal(res.totalCostCents, 302);
    assert.equal(res.breakEvenProbability, 0.604);
  });
});
