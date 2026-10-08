/**
 * Acceptance Test Suite: QuanterraOS Institutional Alert & Webhook Dispatcher
 *
 * Validates:
 * 1. Deterministic AlertEvent creation with SHA-256 cryptographic provenance.
 * 2. Discord Rich Embed payload generation (color hierarchy, fields, footer disclaimers).
 * 3. Telegram HTML message payload generation (HTML tags, key metrics, deep links).
 * 4. Deduplication & 60-second cooldown window enforcement.
 * 5. Dry-run simulated webhook dispatch without network calls.
 * 6. Webhook Management & Alert Simulator Dashboard HTML rendering.
 * 7. Strict Rule B4 and Rule B5 static compliance (zero banned language, $0.00 live risk lock).
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createAlertEvent,
  formatDiscordAlertPayload,
  formatTelegramAlertPayload,
  isAlertRateLimited,
  dispatchAlertWebhook,
  getRecentDispatchedAlerts,
  resetAlertDispatcherState,
  renderWebhookDashboardHtml
} from "../alert-dispatcher.ts";

describe("Institutional Alert & Webhook Dispatcher Engine", () => {
  beforeEach(() => {
    resetAlertDispatcherState();
  });

  it("1. Event Creation & Provenance: produces structured alert with 64-char SHA-256 hash", () => {
    const event = createAlertEvent(
      "CROSS_VENUE_DIVERGENCE_SPIKE",
      "BTC",
      "Cross-Venue Divergence Spike (240 bps)",
      "Kalshi vs Polymarket spread widened beyond 200 bps on ATM strike.",
      {
        kalshi_price: "$0.52",
        polymarket_price: "$0.48",
        spread_bps: "240 bps",
        fee_drag_advantage: "Kalshi +1.2%"
      },
      "https://quanterraos.com/divergence",
      "WARNING",
      "KXBTC15M-26OCT07-2200"
    );

    assert.ok(event.eventId.startsWith("alt_"));
    assert.equal(event.underlying, "BTC");
    assert.equal(event.eventTicker, "KXBTC15M-26OCT07-2200");
    assert.equal(event.severity, "WARNING");
    assert.equal(event.provenanceHash.length, 64);
  });

  it("2. Discord Rich Embed: formats valid embed with Gold Standard colors and Rule B4/B5 footer", () => {
    const event = createAlertEvent(
      "SETTLEMENT_ORACLE_DANGER",
      "BTC",
      "Settlement Danger Zone: Spot Within $50 of Strike",
      "Bitcoin spot is $28 from $67,500 strike during final 60 seconds.",
      {
        spot_price: "$67,472.00",
        strike_price: "$67,500.00",
        distance_usd: "$28.00",
        twap_window_sec: "42s / 60s"
      },
      "https://quanterraos.com/radar",
      "CRITICAL",
      "KXBTC15M-26OCT07-2200"
    );

    const discord = formatDiscordAlertPayload(event);
    assert.equal(discord.embeds.length, 1);
    const embed = discord.embeds[0];

    // Critical severity uses danger red (0xEF4444)
    assert.equal(embed.color, 0xEF4444);
    assert.ok(embed.title.includes("Settlement Danger Zone"));
    assert.ok(embed.url.includes("/radar"));
    assert.ok(embed.footer.text.includes("Rule B4/B5"));
    assert.ok(embed.footer.text.includes("$0.00 Capital Standby Lock"));

    // Check fields
    const spotField = embed.fields.find(f => f.name.includes("SPOT PRICE"));
    assert.ok(spotField);
    assert.equal(spotField.value, "$67,472.00");
  });

  it("3. Telegram HTML Payload: formats compliant HTML message with metrics and deep links", () => {
    const event = createAlertEvent(
      "SETTLEMENT_POSTMORTEM_RESOLVED",
      "BTC",
      "15m Event Settled: KXBTC15M-26OCT07-2145",
      "60-Second TWAP tape reconstructed. Decisive crossing tick identified at second 882.",
      {
        settled_twap: "$67,494.20",
        atm_strike: "$67,500.00",
        outcome: "NO",
        flips_detected: "1 Intra-Minute Flip"
      },
      "https://quanterraos.com/settlement",
      "INFO",
      "KXBTC15M-26OCT07-2145"
    );

    const tg = formatTelegramAlertPayload(event);
    assert.equal(tg.parse_mode, "HTML");
    assert.ok(tg.text.includes("QUANTERRAOS // 15m Event Settled"));
    assert.ok(tg.text.includes("<b>SETTLED TWAP:</b> <code>$67,494.20</code>"));
    assert.ok(tg.text.includes("<a href=\"https://quanterraos.com/settlement\">"));
    assert.ok(tg.text.includes("Rule B5: $0.00 capital deployed"));
  });

  it("4. Deduplication & Cooldown: suppresses duplicate alerts within 60 seconds", () => {
    const event = createAlertEvent(
      "CROSS_VENUE_DIVERGENCE_SPIKE",
      "BTC",
      "Divergence Spike",
      "Summary",
      { spread: "180 bps" },
      "https://quanterraos.com/divergence",
      "WARNING",
      "KXBTC15M-26OCT07-2200"
    );

    // Initial check: not rate limited
    const now = Date.now();
    assert.equal(isAlertRateLimited(event, now), false);

    // After dispatch, should be rate limited immediately
    dispatchAlertWebhook(event, "https://discord.com/api/webhooks/mock", true);
    assert.equal(isAlertRateLimited(event, now + 1000), true);

    // After 65 seconds, rate limit should clear
    assert.equal(isAlertRateLimited(event, now + 65000), false);
  });

  it("5. Dry-Run Dispatch: successfully simulates dispatch without triggering network requests", async () => {
    const event = createAlertEvent(
      "CORRIDOR_ASYMMETRY_AUDITED",
      "BTC",
      "Multi-Strike Corridor Audited",
      "Range pin corridor $67,250/$67,750 net max profit exceeds 3x capital at risk.",
      {
        strategy: "RANGE_PIN_CORRIDOR",
        net_max_profit: "+$7.40",
        fee_drag: "4.8%",
        breakeven_win_rate: "26.0%"
      },
      "https://quanterraos.com/corridors",
      "INFO"
    );

    const res = await dispatchAlertWebhook(event, "https://discord.com/api/webhooks/dummy", true);
    assert.equal(res.success, true);
    assert.equal(res.simulated, true);
    assert.equal(res.destination, "discord");
    assert.equal(res.statusCode, 200);

    const history = getRecentDispatchedAlerts();
    assert.equal(history.length, 1);
    assert.equal(history[0].eventId, event.eventId);
  });

  it("6. Dashboard Rendering: renders full HTML terminal and verifies Rule B4/B5 compliance", () => {
    const event = createAlertEvent(
      "DAILY_DISCIPLINE_DIGEST",
      "BTC",
      "Daily Trading Discipline & Calibration Digest",
      "Personal Brier calibration score: 0.182 across 14 logged decisions.",
      {
        brier_score: "0.182",
        logged_decisions: "14",
        total_fees_saved: "$4.20"
      },
      "https://quanterraos.com/journal",
      "INFO"
    );

    const html = renderWebhookDashboardHtml([event]);
    assert.ok(html.includes("Alert Dispatcher &amp; Webhook Gateway"));
    assert.ok(html.includes("Daily Trading Discipline & Calibration Digest"));
    assert.ok(html.includes("SHA256:"));

    // Verify Rule B4 banned language
    const banned = [
      /\balpha\b/i,
      /\bbeat the market\b/i,
      /\bguaranteed\b/i,
      /\barbitrage\b/i,
      /\bmispriced opportunities\b/i
    ];

    for (const pat of banned) {
      assert.ok(!pat.test(html), `Found prohibited phrase matching ${pat} in webhook dashboard`);
    }
  });
});
