import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSignalsPageHtml } from "../signals-page.ts";
import {
  createAlertEvent,
  createSampleAlertEvent,
  createDiscrepancyAlert,
  createResolutionRiskAlert,
  formatDiscordAlertPayload,
  formatTelegramAlertPayload,
  formatXBroadcastPayload,
  dispatchAlertWebhook,
  getRecentDispatchedAlerts,
  resetAlertDispatcherState,
} from "../alert-dispatcher.ts";

test("1. Signals Page HTML rendering and compliance guardrails", () => {
  const html = renderSignalsPageHtml("trader@example.com", "pro");

  // Core header and brand
  assert.ok(html.includes("Discord &amp; Telegram Signal Dispatcher") || html.includes("Discord & Telegram Signal Dispatcher"));
  assert.ok(html.includes("QUANTERRA"));
  assert.ok(html.includes("PRO"));

  // Platform switcher tabs
  assert.ok(html.includes("Discord Embed"));
  assert.ok(html.includes("Telegram Bot"));
  assert.ok(html.includes("Custom JSON"));

  // Interactive controls and preview mockups
  assert.ok(html.includes("id=\"sim-url\""));
  assert.ok(html.includes("id=\"sim-event-type\""));
  assert.ok(html.includes("id=\"btn-dispatch\""));
  assert.ok(html.includes("mock-discord"));
  assert.ok(html.includes("mock-telegram"));

  // Starter code blocks
  assert.ok(html.includes("discord.py"));
  assert.ok(html.includes("Express"));
  assert.ok(html.includes("cURL"));

  // Rule B4 & Rule B5 Compliance
  assert.ok(html.includes("Rule B5: $0.00 Capital Deployed"));
  assert.ok(!html.includes("guaranteed profits"));
  assert.ok(!html.includes("beat the market"));
  assert.ok(!html.includes("arbitrage opportunity"));
});

test("2. createSampleAlertEvent generates valid events with SHA-256 provenance", () => {
  const discrepancy = createSampleAlertEvent("DISCREPANCY_SCANNER_DETECTED");
  assert.equal(discrepancy.eventType, "DISCREPANCY_SCANNER_DETECTED");
  assert.ok(discrepancy.eventId.startsWith("alt_"));
  assert.equal(discrepancy.provenanceHash.length, 64);
  assert.ok(discrepancy.metrics.GROSS_SPREAD);
  assert.ok(discrepancy.metrics.REALIZED_NET);

  const dispute = createSampleAlertEvent("RESOLUTION_RISK_SPIKE");
  assert.equal(dispute.eventType, "RESOLUTION_RISK_SPIKE");
  assert.ok(dispute.metrics.AMBIGUITY_SCORE);
  assert.equal(dispute.provenanceHash.length, 64);

  const twap = createSampleAlertEvent("SETTLEMENT_ORACLE_DANGER");
  assert.equal(twap.eventType, "SETTLEMENT_ORACLE_DANGER");
  assert.ok(twap.metrics.SPOT);
  assert.ok(twap.metrics.TIME_LEFT);

  const digest = createSampleAlertEvent("DAILY_DISCIPLINE_DIGEST");
  assert.equal(digest.eventType, "DAILY_DISCIPLINE_DIGEST");
  assert.equal(digest.metrics.SETTLED_WINDOWS, 1316);
});

test("3. Discord Rich Embed payload format adheres to Gold Standard tokens", () => {
  const event = createSampleAlertEvent("DISCREPANCY_SCANNER_DETECTED");
  const payload = formatDiscordAlertPayload(event);

  assert.ok(payload.embeds && payload.embeds.length === 1);
  const embed = payload.embeds[0];
  assert.ok(embed.title.includes("QuanterraOS //"));
  assert.ok(embed.color === 0xDFB843 || embed.color === 0xF59E0B || embed.color === 0xEF4444);
  assert.ok(embed.fields.length >= 3);
  assert.ok(embed.footer.text.includes("Rule B4/B5"));
  assert.ok(embed.url.startsWith("https://quanterraos.com"));
});

test("4. Telegram HTML message payload format complies with Bot API standards", () => {
  const event = createSampleAlertEvent("RESOLUTION_RISK_SPIKE");
  const payload = formatTelegramAlertPayload(event);

  assert.equal(payload.parse_mode, "HTML");
  assert.ok(payload.text.includes("<b>QUANTERRAOS //"));
  assert.ok(payload.text.includes("<code>"));
  assert.ok(payload.text.includes("Rule B5: $0.00 capital deployed"));
  assert.ok(payload.text.includes("Provenance:"));
});

test("5. Automated Social Broadcast payload complies with 280-character limit", () => {
  const event = createSampleAlertEvent("DISCREPANCY_SCANNER_DETECTED");
  const broadcast = formatXBroadcastPayload(event);

  assert.ok(broadcast.isWithinLimit);
  assert.ok(broadcast.charCount <= 280);
  assert.ok(broadcast.text.includes("spread between Kalshi & Polymarket"));
  assert.ok(broadcast.text.includes(broadcast.url));
});

test("6. dispatchAlertWebhook executes simulated dry-run and logs telemetry", async () => {
  resetAlertDispatcherState();
  const event = createSampleAlertEvent("SETTLEMENT_ORACLE_DANGER");

  // Simulated dry-run
  const result = await dispatchAlertWebhook(event, "https://discord.com/api/webhooks/test-hook", true);
  assert.equal(result.success, true);
  assert.equal(result.simulated, true);
  assert.equal(result.destination, "discord");
  assert.equal(result.eventId, event.eventId);
  assert.ok(result.latencyMs >= 0);

  // Appears in recent history
  const history = getRecentDispatchedAlerts();
  assert.ok(history.length >= 1);
  assert.equal(history[0].eventId, event.eventId);

  // Second immediate dispatch triggers active 60s cooldown suppression
  const throttled = await dispatchAlertWebhook(event, "https://discord.com/api/webhooks/test-hook", true);
  assert.equal(throttled.success, false);
  assert.ok(throttled.error?.includes("cooldown"));
});
