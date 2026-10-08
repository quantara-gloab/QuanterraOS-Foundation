/**
 * Acceptance Test Suite: 24/7 Market Window Schedule Grid & Event Calendar
 *
 * Validates:
 * 1. Exactly 96 windows generated across 24 hours (00:00 to 23:45).
 * 2. Canonical Kalshi ticker format validation (KXBTC15M-YYMONDD-HHMM).
 * 3. Session categorization (London/NY overlap, US session, Asia-Pacific).
 * 4. Second-by-second active window location and countdown arithmetic.
 * 5. RFC 5545 iCalendar (.ics) export formatting and 2-minute alarm trigger.
 * 6. HTML terminal rendering and strict Rule B4 / Rule B5 compliance.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateDailyScheduleMatrix,
  generateIcsCalendarFeed,
  getMarketSessionForTime,
  renderMarketScheduleHtml
} from "../market-schedule.ts";

describe("24/7 Market Window Schedule Grid & Calendar Engine", () => {
  it("1. 96-Window Cadence: generates exactly 96 15m windows spanning 00:00 to 23:45", () => {
    const fixedTime = new Date("2026-10-07T14:22:00Z");
    const matrix = generateDailyScheduleMatrix(fixedTime);

    assert.equal(matrix.totalDailyWindows, 96);
    assert.equal(matrix.windows.length, 96);
    assert.equal(matrix.windows[0].hourUtc, 0);
    assert.equal(matrix.windows[0].minuteUtc, 0);
    assert.equal(matrix.windows[95].hourUtc, 23);
    assert.equal(matrix.windows[95].minuteUtc, 45);
  });

  it("2. Ticker Schema: validates authoritative Kalshi ticker string pattern", () => {
    const fixedTime = new Date("2026-10-07T14:22:00Z");
    const matrix = generateDailyScheduleMatrix(fixedTime);

    const tickerRegex = /^KXBTC15M-\d{2}[A-Z]{3}\d{2}-\d{4}$/;
    for (const win of matrix.windows) {
      assert.match(win.ticker, tickerRegex, `Ticker ${win.ticker} must match canonical pattern`);
    }
  });

  it("3. Session Overlap: correctly classifies macroeconomic liquidity windows", () => {
    // 14:15 UTC is London / NY Overlap
    const overlap = getMarketSessionForTime(14, 15);
    assert.equal(overlap.session, "LONDON_NY_OVERLAP");
    assert.equal(overlap.liquidity, "PEAK");

    // 03:00 UTC is Asia-Pacific
    const asia = getMarketSessionForTime(3, 0);
    assert.equal(asia.session, "ASIA_PACIFIC");

    // 17:30 UTC is US Session
    const us = getMarketSessionForTime(17, 30);
    assert.equal(us.session, "NEW_YORK_AMERICA");
  });

  it("4. Active Window Detection: locates the current running window and countdown", () => {
    // 14:22:00 UTC -> 14:15 to 14:30 window (index = 14 * 4 + 1 = 57)
    const fixedTime = new Date("2026-10-07T14:22:00Z");
    const matrix = generateDailyScheduleMatrix(fixedTime);

    assert.equal(matrix.activeWindowIndex, 57);
    assert.equal(matrix.windows[57].status, "ACTIVE");
    assert.equal(matrix.windows[57].minuteUtc, 15);
    assert.equal(matrix.windows[56].status, "SETTLED");
    assert.equal(matrix.windows[58].status, "NEXT");

    // 14:22 has 8 minutes remaining until 14:30 (480 seconds)
    assert.equal(matrix.remainingSecondsInActiveWindow, 480);
  });

  it("5. RFC 5545 iCalendar Feed: produces valid .ics calendar with events and alarm triggers", () => {
    const fixedTime = new Date("2026-10-07T14:22:00Z");
    const matrix = generateDailyScheduleMatrix(fixedTime);
    const ics = generateIcsCalendarFeed(matrix);

    assert.ok(ics.startsWith("BEGIN:VCALENDAR"));
    assert.ok(ics.includes("VERSION:2.0"));
    assert.ok(ics.includes("PRODID:-//QuanterraOS//BTC Expiry Cadence Calendar//EN"));
    assert.ok(ics.includes("BEGIN:VEVENT"));
    assert.ok(ics.includes("BEGIN:VALARM"));
    assert.ok(ics.includes("TRIGGER:-PT2M"));
    assert.ok(ics.endsWith("END:VCALENDAR"));
  });

  it("6. HTML Terminal Rendering: verifies 24-hour grid and Rule B4/B5 compliance", () => {
    const fixedTime = new Date("2026-10-07T14:22:00Z");
    const matrix = generateDailyScheduleMatrix(fixedTime);
    const html = renderMarketScheduleHtml(matrix);

    assert.ok(html.includes("24/7 Market Window Schedule Grid"));
    assert.ok(html.includes("Daily 96-Window Cadence Matrix"));
    assert.ok(html.includes("Download .ICS Calendar Feed"));
    assert.ok(html.includes("Rule B5 Strict Compliance: $0.00 Live Capital Deployed"));

    // Verify Rule B4 compliance
    const bannedTerms = [
      /\balpha\b/i,
      /\bbeat the market\b/i,
      /\bguaranteed\b/i,
      /\barbitrage\b/i,
      /\bmispriced opportunities\b/i
    ];

    for (const pat of bannedTerms) {
      assert.ok(!pat.test(html), `Found prohibited marketing term matching ${pat}`);
    }
  });
});
