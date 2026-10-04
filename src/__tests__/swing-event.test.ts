import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  readSwingEventsCsv,
  writeSwingEventsCsv,
  appendSwingEvent,
  getSwingEventsSummary,
  type SwingEvent,
} from "../swing-event-logger.ts";
import {
  takerFee,
  bootstrapCi,
  evaluateRuleOnSet,
  type SettledSwingRecord,
} from "../swing-event-backtest.ts";

test("takerFee accurately implements Kalshi fee model", () => {
  assert.equal(takerFee(0.5), 0.07 * 0.5 * 0.5);
  // Clamping prevents division by zero or negative fees
  assert.ok(takerFee(0.001) > 0);
  assert.ok(takerFee(0.999) > 0);
});

test("bootstrapCi generates valid confidence intervals", () => {
  const values = [0.1, 0.2, 0.15, 0.18, 0.22, 0.19, 0.25, 0.12];
  const ci = bootstrapCi(values, [1, 2], 500);
  assert.ok(ci !== null);
  assert.ok(ci[0] <= ci[1]);
  assert.ok(ci[0] >= 0.05 && ci[1] <= 0.35);
});

test("readSwingEventsCsv and writeSwingEventsCsv maintain exact round-trip integrity", () => {
  const tempCsvPath = path.resolve("data/test-temp-swing-events.csv");
  try {
    const mockEvents: SwingEvent[] = [
      {
        ticker: "KXBTC15M-TEST-1",
        trigger_time: "2026-10-04T00:00:00.000Z",
        minutes_left: 4.5,
        price_before: 0.12,
        price_after: 0.25,
        spot_price: 84000.5,
        settlement_outcome: "YES",
      },
      {
        ticker: "KXBTC15M-TEST-2",
        trigger_time: "2026-10-04T00:15:00.000Z",
        minutes_left: 2.1,
        price_before: 0.65,
        price_after: 0.52,
        spot_price: 83950.0,
        settlement_outcome: "NO",
      },
      {
        ticker: "KXBTC15M-TEST-3",
        trigger_time: "2026-10-04T00:30:00.000Z",
        minutes_left: 10.0,
        price_before: 0.45,
        price_after: 0.55,
        spot_price: null,
        settlement_outcome: null,
      },
    ];

    writeSwingEventsCsv(mockEvents, tempCsvPath);
    const readBack = readSwingEventsCsv(tempCsvPath);

    assert.equal(readBack.length, 3);
    assert.equal(readBack[0].ticker, "KXBTC15M-TEST-1");
    assert.equal(readBack[0].price_before, 0.12);
    assert.equal(readBack[0].price_after, 0.25);
    assert.equal(readBack[0].spot_price, 84000.5);
    assert.equal(readBack[0].settlement_outcome, "YES");

    assert.equal(readBack[2].spot_price, null);
    assert.equal(readBack[2].settlement_outcome, null);

    // Test append
    appendSwingEvent(
      {
        ticker: "KXBTC15M-TEST-4",
        trigger_time: "2026-10-04T00:45:00.000Z",
        minutes_left: 1.0,
        price_before: 0.3,
        price_after: 0.42,
        spot_price: 84100.0,
        settlement_outcome: "YES",
      },
      tempCsvPath
    );

    const summary = getSwingEventsSummary(tempCsvPath);
    assert.equal(summary.totalLogged, 4);
    assert.equal(summary.settledCount, 3);
    assert.equal(summary.pendingCount, 1);
  } finally {
    if (fs.existsSync(tempCsvPath)) {
      fs.unlinkSync(tempCsvPath);
    }
  }
});

test("evaluateRuleOnSet correctly scores momentum vs fade rules", () => {
  const records: SettledSwingRecord[] = [
    {
      ticker: "M1",
      triggerTime: "2026-10-04T01:00:00Z",
      minutesLeft: 5,
      priceBefore: 0.3,
      priceAfter: 0.45,
      spotPrice: 84000,
      outcomeYes: true, // Up swing won
      swingDelta: 0.15,
      direction: "UP",
    },
    {
      ticker: "M2",
      triggerTime: "2026-10-04T01:15:00Z",
      minutesLeft: 5,
      priceBefore: 0.7,
      priceAfter: 0.55,
      spotPrice: 84100,
      outcomeYes: false, // Down swing won
      swingDelta: -0.15,
      direction: "DOWN",
    },
    {
      ticker: "M3",
      triggerTime: "2026-10-04T01:30:00Z",
      minutesLeft: 5,
      priceBefore: 0.4,
      priceAfter: 0.55,
      spotPrice: 83900,
      outcomeYes: false, // Up swing lost
      swingDelta: 0.15,
      direction: "UP",
    },
  ];

  const mom = evaluateRuleOnSet(records, "momentum");
  assert.equal(mom.trades, 3);
  assert.equal(mom.wins, 2);
  assert.equal(mom.winRate, 0.6667);

  const fade = evaluateRuleOnSet(records, "fade");
  assert.equal(fade.trades, 3);
  assert.equal(fade.wins, 1);
  assert.equal(fade.winRate, 0.3333);
});
