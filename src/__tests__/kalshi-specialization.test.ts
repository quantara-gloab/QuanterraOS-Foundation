import { describe, it } from "node:test";
import assert from "node:assert";
import {
  KALSHI_CONTRACT_SPECS,
  calculateKalshiTakerFee,
  calculateBreakevenProbability,
  normalizeKalshiContract,
  selectAtmHourlyMarket,
  buildStrikeLadder,
} from "../kalshi-contracts.ts";

describe("Kalshi Specialization Engine: 15-Minute & 1-Hour Above/Below", () => {
  it("defines formal contract specifications for both KXBTC15M and KXBTCD", () => {
    assert.strictEqual(KALSHI_CONTRACT_SPECS["15m"].seriesTicker, "KXBTC15M");
    assert.strictEqual(KALSHI_CONTRACT_SPECS["15m"].cadenceMinutes, 15);
    assert.strictEqual(KALSHI_CONTRACT_SPECS["15m"].strikeStructure, "at_open_relative");

    assert.strictEqual(KALSHI_CONTRACT_SPECS["1h"].seriesTicker, "KXBTCD");
    assert.strictEqual(KALSHI_CONTRACT_SPECS["1h"].cadenceMinutes, 60);
    assert.strictEqual(KALSHI_CONTRACT_SPECS["1h"].strikeStructure, "fixed_strike_ladder");
  });

  it("calculates exact non-linear Kalshi taker fees ($0.07 * P * (1 - P))", () => {
    // At P = 0.50, fee peaks at $0.0175 (1.75¢)
    const peakFee = calculateKalshiTakerFee(0.50);
    assert.strictEqual(peakFee, 0.0175);

    // At P = 0.00 and P = 1.00, fee is 0
    assert.strictEqual(calculateKalshiTakerFee(0.00), 0);
    assert.strictEqual(calculateKalshiTakerFee(1.00), 0);

    // At P = 0.10, fee is 0.07 * 0.10 * 0.90 = 0.0063
    assert.strictEqual(calculateKalshiTakerFee(0.10), 0.0063);

    // At P = 0.90, fee is 0.07 * 0.90 * 0.10 = 0.0063
    assert.strictEqual(calculateKalshiTakerFee(0.90), 0.0063);
  });

  it("calculates breakeven win rate hurdle accounting for taker fees", () => {
    // At 50¢ entry price, fee is 1.75¢, so required breakeven win probability is 51.75%
    const be = calculateBreakevenProbability(0.50, true);
    assert.strictEqual(be, 0.5175);

    // At 80¢ entry price, fee is 0.07 * 0.8 * 0.2 = 0.0112, breakeven is 81.12%
    const be80 = calculateBreakevenProbability(0.80, true);
    assert.strictEqual(be80, 0.8112);
  });

  it("normalizes Kalshi contract payloads for both 15m and 1h cadences", () => {
    const raw15m = {
      ticker: "KXBTC15M-26OCT061600-00",
      series_ticker: "KXBTC15M",
      title: "BTC price up in next 15 mins?",
      floor_strike: 85500,
      yes_ask_dollars: "0.5200",
      yes_bid_dollars: "0.5000",
      no_ask_dollars: "0.5000",
      no_bid_dollars: "0.4800",
      close_time: new Date(Date.now() + 10 * 60000).toISOString(),
    };

    const norm15m = normalizeKalshiContract(raw15m, "15m");
    assert.strictEqual(norm15m.timeframe, "15m");
    assert.strictEqual(norm15m.seriesTicker, "KXBTC15M");
    assert.strictEqual(norm15m.yesAsk, 0.52);
    assert.strictEqual(norm15m.takerFeeYes, calculateKalshiTakerFee(0.52));

    const raw1h = {
      ticker: "KXBTCD-26OCT0616-T85600",
      series_ticker: "KXBTCD",
      title: "Bitcoin price on Oct 6, 2026?",
      subtitle: "$85,600 or above",
      floor_strike: 85600,
      yes_ask_dollars: "0.4900",
      yes_bid_dollars: "0.4700",
      close_time: new Date(Date.now() + 45 * 60000).toISOString(),
    };

    const norm1h = normalizeKalshiContract(raw1h, "1h");
    assert.strictEqual(norm1h.timeframe, "1h");
    assert.strictEqual(norm1h.seriesTicker, "KXBTCD");
    assert.strictEqual(norm1h.strike, 85600);
    assert.strictEqual(norm1h.subtitle, "$85,600 or above");
  });

  it("selects the closest At-The-Money (ATM) contract from an hourly ladder", () => {
    const now = Date.now();
    const futureClose = new Date(now + 30 * 60000).toISOString();
    const markets = [
      { ticker: "KXBTCD-1", floor_strike: 85000, close_time: futureClose },
      { ticker: "KXBTCD-2", floor_strike: 85500, close_time: futureClose },
      { ticker: "KXBTCD-3", floor_strike: 86000, close_time: futureClose },
      { ticker: "KXBTCD-4", floor_strike: 86500, close_time: futureClose },
    ];

    // Spot is 85,520 -> closest strike is 85,500 (KXBTCD-2)
    const atm = selectAtmHourlyMarket(markets, 85520);
    assert.ok(atm);
    assert.strictEqual(atm.ticker, "KXBTCD-2");
    assert.strictEqual(atm.floor_strike, 85500);
  });

  it("builds a full strike ladder with distance, implied probability, and net EV", () => {
    const now = Date.now();
    const futureClose = new Date(now + 40 * 60000).toISOString();
    const markets = [
      { ticker: "KXBTCD-LOW", floor_strike: 85000, yes_ask_dollars: "0.8000", yes_bid_dollars: "0.7800", close_time: futureClose },
      { ticker: "KXBTCD-MID", floor_strike: 85500, yes_ask_dollars: "0.5200", yes_bid_dollars: "0.5000", close_time: futureClose },
      { ticker: "KXBTCD-HIGH", floor_strike: 86000, yes_ask_dollars: "0.2500", yes_bid_dollars: "0.2300", close_time: futureClose },
    ];

    const ladder = buildStrikeLadder(markets, 85550);
    assert.strictEqual(ladder.length, 3);

    // Highest strike first in ladder
    assert.strictEqual(ladder[0].strike, 86000);
    assert.strictEqual(ladder[0].distanceFromSpot, -450); // 85550 - 86000
    assert.strictEqual(ladder[0].impliedProb, 0.24);

    // Mid strike
    const mid = ladder.find(e => e.strike === 85500);
    assert.ok(mid);
    assert.strictEqual(mid.distanceFromSpot, 50); // 85550 - 85500
    assert.strictEqual(mid.impliedProb, 0.51);
  });
});
