import { describe, it } from "node:test";
import assert from "node:assert";
import {
  KALSHI_CONTRACT_SPECS,
  calculateKalshiTakerFee,
  calculateBreakevenProbability,
  normalizeKalshiContract,
  selectAtmHourlyMarket,
  buildStrikeLadder,
  parseQuotePrice,
} from "../kalshi-contracts.ts";
import { placeKalshi15mBid } from "../kalshi-api.ts";
import { renderKalshiTerminalHtml } from "../kalshi-terminal-page.ts";

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

  it("renders 15-minute desk by default with dual-desk switcher and 15m active state", () => {
    const html15m = renderKalshiTerminalHtml("trader@test.com", "pro", "15m");
    assert.ok(html15m.includes("15-Minute Above/Below Desk"), "must contain 15-Minute Desk card");
    assert.ok(html15m.includes("1-Hour Multi-Strike Ladder Desk"), "must contain 1-Hour Desk card");
    assert.ok(html15m.includes("desk-card active") && html15m.includes("id=\"desk-card-15m\" class=\"desk-card active\""), "15m card must be active");
    assert.ok(html15m.includes("KXBTC15M"), "must reference KXBTC15M");
    assert.ok(html15m.includes("/kalshi/1h"), "must link to 1h desk");
    assert.ok(html15m.includes("/kalshi/15m"), "must link to 15m desk");
    assert.ok(html15m.includes("PLACE 15M BID"), "ticket button must target 15m");
    assert.ok(html15m.includes("BENCHMARK &amp; SETTLEMENT DESIGNATION"), "must preserve BRTI benchmark designation");
  });

  it("renders dedicated 1-hour desk with multi-strike ladder matrix and 1h active state", () => {
    const html1h = renderKalshiTerminalHtml("trader@test.com", "pro", "1h");
    assert.ok(html1h.includes("id=\"desk-card-1h\" class=\"desk-card active\""), "1h card must be active");
    assert.ok(html1h.includes("KXBTCD"), "must reference KXBTCD");
    assert.ok(html1h.includes("KXBTCD 1-HOUR MULTI-STRIKE LADDER"), "must render 1-Hour Strike Ladder header");
    assert.ok(html1h.includes("ladder-table"), "must include ladder table markup");
    assert.ok(html1h.includes("PLACE 1H BID"), "ticket button must target 1h");
    assert.ok(html1h.includes("1H HOURLY MULTI-STRIKE TELEMETRY"), "telemetry panel must reflect 1h horizon");
    assert.ok(html1h.includes("FINAL 60s HOURLY SETTLEMENT TWAP WINDOW (MINUTE 59)"), "TWAP window must designate minute 59");
    assert.ok(html1h.includes("KALSHI 1H HOURLY DESK"), "brand sub-badge must reflect 1h desk");
  });

  it("safely parses quote prices without fabricating fake prices or misinterpreting cents as dollars", () => {
    // Dollar string
    assert.strictEqual(parseQuotePrice("0.4800", undefined), 0.48);
    assert.strictEqual(parseQuotePrice("0.52", "52"), 0.52);

    // Cents integer correctly normalized to dollars (45 cents -> $0.45, NOT $45)
    assert.strictEqual(parseQuotePrice(undefined, 45), 0.45);
    assert.strictEqual(parseQuotePrice(undefined, 99), 0.99);
    assert.strictEqual(parseQuotePrice(undefined, 1), 0.01);

    // Missing or zero quotes return null (empty book), NEVER fabricated 0.50 or 0.48
    assert.strictEqual(parseQuotePrice(undefined, undefined), null);
    assert.strictEqual(parseQuotePrice("", 0), null);
    assert.strictEqual(parseQuotePrice(null, null), null);
  });

  it("filters strike ladder to the nearest hourly event window so different hours are not mixed together", () => {
    const now = Date.now();
    const nearestHourClose = new Date(now + 20 * 60000).toISOString();
    const nextHourClose = new Date(now + 80 * 60000).toISOString(); // 1 hour later

    const mixedMarkets = [
      { ticker: "KXBTCD-NEAR-1", floor_strike: 85000, yes_ask_dollars: "0.60", yes_bid_dollars: "0.58", close_time: nearestHourClose },
      { ticker: "KXBTCD-NEAR-2", floor_strike: 85500, yes_ask_dollars: "0.40", yes_bid_dollars: "0.38", close_time: nearestHourClose },
      // Later hour markets:
      { ticker: "KXBTCD-FAR-1", floor_strike: 86000, yes_ask_dollars: "0.50", yes_bid_dollars: "0.48", close_time: nextHourClose },
      { ticker: "KXBTCD-FAR-2", floor_strike: 86500, yes_ask_dollars: "0.30", yes_bid_dollars: "0.28", close_time: nextHourClose },
    ];

    const ladder = buildStrikeLadder(mixedMarkets, 85200);
    // Ladder must only contain the 2 nearest markets
    assert.strictEqual(ladder.length, 2);
    assert.ok(ladder.every(entry => entry.ticker.startsWith("KXBTCD-NEAR")));
  });

  it("preserves null for empty orderbook quotes instead of fabricating 0.50 / 0.48", () => {
    const now = Date.now();
    const futureClose = new Date(now + 30 * 60000).toISOString();

    const emptyBookMarkets = [
      { ticker: "KXBTCD-EMPTY", floor_strike: 85000, close_time: futureClose }, // no quotes at all
      { ticker: "KXBTCD-BID-ONLY", floor_strike: 85500, yes_bid: 40, close_time: futureClose }, // bid only (cents)
    ];

    const ladder = buildStrikeLadder(emptyBookMarkets, 85200);
    assert.strictEqual(ladder.length, 2);

    const emptyEntry = ladder.find(e => e.ticker === "KXBTCD-EMPTY");
    assert.ok(emptyEntry);
    assert.strictEqual(emptyEntry.yesBid, null, "empty book must have null bid");
    assert.strictEqual(emptyEntry.yesAsk, null, "empty book must have null ask");
    assert.strictEqual(emptyEntry.takerFee, null, "empty book must have null taker fee");
    assert.strictEqual(emptyEntry.netEvAtFiftyPctWin, null, "empty book must have null EV");

    const bidOnlyEntry = ladder.find(e => e.ticker === "KXBTCD-BID-ONLY");
    assert.ok(bidOnlyEntry);
    assert.strictEqual(bidOnlyEntry.yesBid, 0.40, "40 cents must parse to 0.40");
    assert.strictEqual(bidOnlyEntry.yesAsk, null, "missing ask must remain null");
  });

  it("strictly blocks live Kalshi order placement under Rule B5 when KALSHI_LIVE is not true", async () => {
    delete process.env.KALSHI_LIVE;

    await assert.rejects(
      async () => {
        await placeKalshi15mBid({
          userId: "test-user",
          ticker: "KXBTC15M-TEST",
          side: "yes",
          price: 0.50,
          count: 1,
          mode: "live",
        });
      },
      /Rule B5/
    );
  });
});
