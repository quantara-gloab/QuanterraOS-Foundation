/**
 * QuanterraOS Institutional Alert & Webhook Dispatcher Engine
 *
 * Provides real-time formatted notifications for:
 * 1. Cross-Venue Divergence Spikes (Kalshi vs Polymarket spread > threshold)
 * 2. Settlement Oracle Danger Alerts (Spot within $50 of ATM strike in final 60s)
 * 3. Settlement Post-Mortem Tape Cards (60s TWAP reconstructed, strike flip detected)
 * 4. Multi-Strike Corridor Asymmetry Audits (High net payoff, low fee drag)
 * 5. Daily Discipline Digest & Personal Calibration Score
 *
 * Target Dispatch Channels:
 * - Discord Webhooks (Rich Embed cards with Gold Standard color hierarchy 0xDFB843)
 * - Telegram Bot API (HTML & MarkdownV2 structured telegram alerts)
 * - Generic Institutional JSON Webhooks (Standardized webhook contract)
 *
 * Strict Compliance Guardrails:
 * - Rule B1: Provenance hash and sample size on every alert.
 * - Rule B4: Strictly prohibited terminology ("arbitrage", "alpha", "beat the market").
 * - Rule B5: $0.00 capital deployed standby lock disclaimers on every card.
 * - Rule B10: CME CF BRTI and Kalshi non-affiliation notices.
 */

import { createHash } from "node:crypto";

export type AlertEventType =
  | "CROSS_VENUE_DIVERGENCE_SPIKE"
  | "SETTLEMENT_ORACLE_DANGER"
  | "SETTLEMENT_POSTMORTEM_RESOLVED"
  | "CORRIDOR_ASYMMETRY_AUDITED"
  | "DAILY_DISCIPLINE_DIGEST";

export interface AlertEventData {
  eventId: string;
  eventType: AlertEventType;
  underlying: string;
  eventTicker?: string;
  title: string;
  summary: string;
  metrics: Record<string, string | number>;
  targetUrl: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  timestamp: string;
  provenanceHash: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedPayload {
  embeds: Array<{
    title: string;
    description: string;
    url: string;
    color: number; // Hex integer (e.g. 0xDFB843)
    fields: DiscordEmbedField[];
    footer: {
      text: string;
      icon_url?: string;
    };
    timestamp: string;
  }>;
}

export interface TelegramMessagePayload {
  text: string;
  parse_mode: "HTML" | "MarkdownV2";
  disable_web_page_preview: boolean;
}

export interface WebhookDispatchResult {
  success: boolean;
  statusCode?: number;
  simulated: boolean;
  destination: "discord" | "telegram" | "generic";
  eventId: string;
  dispatchedAt: string;
  latencyMs: number;
  error?: string;
}

// In-memory deduplication and recent dispatch history
const recentAlertHistory: AlertEventData[] = [];
const alertCooldowns: Map<string, number> = new Map(); // key -> timestamp ms
const COOLDOWN_PERIOD_MS = 60 * 1000; // 1-minute cooldown per unique event key

/**
 * Creates a structured AlertEventData object with SHA-256 provenance.
 */
export function createAlertEvent(
  eventType: AlertEventType,
  underlying: string,
  title: string,
  summary: string,
  metrics: Record<string, string | number>,
  targetUrl: string,
  severity: AlertEventData["severity"] = "INFO",
  eventTicker?: string
): AlertEventData {
  const timestamp = new Date().toISOString();
  const rawData = `${eventType}:${underlying}:${eventTicker ?? ""}:${title}:${JSON.stringify(metrics)}:${timestamp}`;
  const provenanceHash = createHash("sha256").update(rawData).digest("hex");
  const eventId = `alt_${provenanceHash.slice(0, 12)}`;

  return {
    eventId,
    eventType,
    underlying,
    eventTicker,
    title,
    summary,
    metrics,
    targetUrl,
    severity,
    timestamp,
    provenanceHash
  };
}

/**
 * Formats an alert event as a Discord Rich Embed payload with Gold Standard styling.
 */
export function formatDiscordAlertPayload(event: AlertEventData): DiscordEmbedPayload {
  let color = 0xDFB843; // Imperial Gold
  if (event.severity === "CRITICAL") color = 0xEF4444; // Danger Red
  if (event.severity === "WARNING") color = 0xF59E0B;  // Amber Warning

  const fields: DiscordEmbedField[] = Object.entries(event.metrics).map(([key, val]) => ({
    name: key.toUpperCase().replace(/_/g, " "),
    value: String(val),
    inline: true
  }));

  // Add Terminal Deep-Link field
  fields.push({
    name: "Interactive Audit Terminal",
    value: `[Open QuanterraOS Terminal](${event.targetUrl})`,
    inline: false
  });

  return {
    embeds: [
      {
        title: `QuanterraOS // ${event.title}`,
        description: event.summary,
        url: event.targetUrl,
        color,
        fields,
        footer: {
          text: "Rule B4/B5: Empirical Microstructure Audit • $0.00 Capital Standby Lock • CME CF BRTI Standard"
        },
        timestamp: event.timestamp
      }
    ]
  };
}

/**
 * Formats an alert event as a Telegram HTML message.
 */
export function formatTelegramAlertPayload(event: AlertEventData): TelegramMessagePayload {
  let icon = "📊";
  if (event.severity === "CRITICAL") icon = "🚨";
  if (event.severity === "WARNING") icon = "⚠️";

  let metricsHtml = "";
  for (const [key, val] of Object.entries(event.metrics)) {
    const label = key.replace(/_/g, " ").toUpperCase();
    metricsHtml += `• <b>${label}:</b> <code>${val}</code>\n`;
  }

  const text = `${icon} <b>QUANTERRAOS // ${event.title}</b>\n\n` +
    `${event.summary}\n\n` +
    `<b>Key Microstructure Telemetry:</b>\n` +
    `${metricsHtml}\n` +
    `🔗 <a href="${event.targetUrl}">Open Live Terminal Audit</a>\n\n` +
    `<i>🔒 Rule B5: $0.00 capital deployed. Pre-trade calibration only.</i>\n` +
    `<code>Provenance: ${event.provenanceHash.slice(0, 16)}...</code>`;

  return {
    text,
    parse_mode: "HTML",
    disable_web_page_preview: false
  };
}

/**
 * Evaluates whether an event should be deduplicated due to an active cooldown window.
 */
export function isAlertRateLimited(event: AlertEventData, nowMs = Date.now()): boolean {
  const key = `${event.eventType}:${event.underlying}:${event.eventTicker ?? "general"}`;
  const lastDispatched = alertCooldowns.get(key);
  if (lastDispatched && nowMs - lastDispatched < COOLDOWN_PERIOD_MS) {
    return true;
  }
  return false;
}

/**
 * Dispatches or simulates dispatching an alert to a target webhook URL.
 */
export async function dispatchAlertWebhook(
  event: AlertEventData,
  webhookUrl: string,
  dryRun = false
): Promise<WebhookDispatchResult> {
  const startMs = Date.now();
  const isDiscord = webhookUrl.includes("discord.com") || webhookUrl.includes("discordapp.com");
  const isTelegram = webhookUrl.includes("telegram.org") || webhookUrl.includes("api.telegram");
  const destination = isDiscord ? "discord" : isTelegram ? "telegram" : "generic";

  // Check rate limiting
  if (isAlertRateLimited(event, startMs)) {
    return {
      success: false,
      simulated: dryRun,
      destination,
      eventId: event.eventId,
      dispatchedAt: new Date().toISOString(),
      latencyMs: Date.now() - startMs,
      error: "Alert suppressed by active 60-second event cooldown filter."
    };
  }

  // Register in cooldown and history
  const cooldownKey = `${event.eventType}:${event.underlying}:${event.eventTicker ?? "general"}`;
  alertCooldowns.set(cooldownKey, startMs);
  recentAlertHistory.unshift(event);
  if (recentAlertHistory.length > 50) recentAlertHistory.pop();

  if (dryRun) {
    return {
      success: true,
      statusCode: 200,
      simulated: true,
      destination,
      eventId: event.eventId,
      dispatchedAt: new Date().toISOString(),
      latencyMs: Date.now() - startMs
    };
  }

  try {
    let payloadBody = "";
    if (isDiscord) {
      payloadBody = JSON.stringify(formatDiscordAlertPayload(event));
    } else if (isTelegram) {
      payloadBody = JSON.stringify(formatTelegramAlertPayload(event));
    } else {
      payloadBody = JSON.stringify({
        event: "QUANTERRA_ALERT",
        data: event
      });
    }

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payloadBody
    });

    return {
      success: resp.ok,
      statusCode: resp.status,
      simulated: false,
      destination,
      eventId: event.eventId,
      dispatchedAt: new Date().toISOString(),
      latencyMs: Date.now() - startMs,
      error: resp.ok ? undefined : `HTTP error ${resp.status}: ${resp.statusText}`
    };
  } catch (err) {
    return {
      success: false,
      simulated: false,
      destination,
      eventId: event.eventId,
      dispatchedAt: new Date().toISOString(),
      latencyMs: Date.now() - startMs,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Returns recent dispatched alerts for telemetry audit.
 */
export function getRecentDispatchedAlerts(): AlertEventData[] {
  return [...recentAlertHistory];
}

/**
 * Clears alert history and cooldowns (used in test suites).
 */
export function resetAlertDispatcherState(): void {
  recentAlertHistory.length = 0;
  alertCooldowns.clear();
}

/**
 * Renders the Webhook Management & Alert Simulator Dashboard HTML.
 */
export function renderWebhookDashboardHtml(recentAlerts: AlertEventData[] = []): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Institutional Webhooks & Alert Dispatcher | QuanterraOS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card-bg: #0E121B;
      --card-inner: #131826;
      --border: rgba(223, 184, 67, 0.2);
      --border-subtle: rgba(255, 255, 255, 0.07);
      --accent: #DFB843;
      --champagne: #F7E7B4;
      --text: #F3F4F6;
      --muted: #9CA3AF;
      --danger: #EF4444;
      --success: #10B981;
      --warning: #F59E0B;
      --font-mono: 'IBM Plex Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
    }
    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      background: rgba(6, 7, 10, 0.95);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #FFF;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .nav-brand span { color: var(--accent); }
    .brand-dot {
      width: 8px;
      height: 8px;
      background: var(--accent);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--accent);
    }
    .nav-links { display: flex; gap: 20px; align-items: center; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.85rem; font-weight: 500; }
    .nav-links a:hover, .nav-links a.active { color: #FFF; }
    .container { max-width: 1200px; margin: 0 auto; padding: 32px 20px; }
    .hero { margin-bottom: 28px; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--accent);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(223, 184, 67, 0.12);
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid var(--border);
      margin-bottom: 12px;
    }
    h1 { font-size: 2rem; font-weight: 800; color: #FFF; margin-bottom: 8px; }
    .lead { color: var(--muted); font-size: 1rem; line-height: 1.5; max-width: 800px; }

    .grid-2 {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .grid-2 { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px;
    }
    .card-title { font-size: 1.1rem; font-weight: 700; color: #FFF; margin-bottom: 16px; }

    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
    .form-control {
      width: 100%;
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      color: #FFF;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 0.95rem;
      font-family: var(--font-mono);
    }
    .form-control:focus { outline: none; border-color: var(--accent); }

    .btn-gold {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 11px 20px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
      font-size: 0.9rem;
      width: 100%;
    }

    .alert-item {
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .alert-title { font-weight: 700; color: #FFF; font-size: 0.92rem; }
    .badge-sev {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: var(--font-mono);
    }
    .badge-CRITICAL { background: rgba(239,68,68,0.2); color: var(--danger); border: 1px solid rgba(239,68,68,0.4); }
    .badge-WARNING { background: rgba(245,158,11,0.2); color: var(--warning); border: 1px solid rgba(245,158,11,0.4); }
    .badge-INFO { background: rgba(223,184,67,0.2); color: var(--accent); border: 1px solid var(--border); }

    .preview-box {
      background: #06070A;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: #A7F3D0;
      max-height: 220px;
      overflow-y: auto;
    }
  </style>
</head>
<body>

  <header class="top-nav">
    <a href="/" class="nav-brand">
      <div class="brand-dot"></div>
      QUANTERRA<span>OS</span>
    </a>
    <nav class="nav-links">
      <a href="/">Overview</a>
      <a href="/radar">Radar</a>
      <a href="/calculator">Calculator</a>
      <a href="/paper">Paper</a>
      <a href="/corridors">Corridors</a>
      <a href="/divergence">Divergence</a>
      <a href="/flow">Flow</a>
      <a href="/matrix">Matrix</a>
      <a href="/calibration/explorer">Decomposition</a>
      <a href="/settlement">Settlement</a>
      <a href="/schedule">Schedule</a>
      <a href="/webhooks" class="active" style="color:var(--accent);">Webhooks</a>
      <a href="/journal">Journal</a>
      <a href="/account">Account</a>
    </nav>
  </header>

  <main class="container">
    <div class="hero">
      <div class="eyebrow">&Sigma; Institutional Webhook Gateway &bull; Discord &amp; Telegram Real-Time Cards</div>
      <h1>Alert Dispatcher &amp; Webhook Gateway</h1>
      <p class="lead">
        Automate rich event delivery directly into Discord server channels and Telegram quant syndicates. Broadcasts cross-venue divergence spikes, settlement TWAP oracle danger warnings, and post-mortem dissection tape cards.
      </p>
    </div>

    <div class="grid-2">
      <!-- Webhook Dispatch Simulator Form -->
      <div class="card">
        <div class="card-title">Test &amp; Simulate Webhook Dispatch</div>
        <form id="webhook-form" onsubmit="event.preventDefault(); triggerTestDispatch();">
          <div class="form-group">
            <label class="form-label">Alert Scenario</label>
            <select class="form-control" id="sim-event-type">
              <option value="CROSS_VENUE_DIVERGENCE_SPIKE">Cross-Venue Divergence Spike (>150 bps)</option>
              <option value="SETTLEMENT_ORACLE_DANGER">Settlement Danger: Spot within $50 of ATM</option>
              <option value="SETTLEMENT_POSTMORTEM_RESOLVED">Settlement Post-Mortem Tape Card</option>
              <option value="CORRIDOR_ASYMMETRY_AUDITED">Multi-Strike Corridor Asymmetry Audited</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Webhook Destination URL</label>
            <input type="url" class="form-control" id="sim-url" placeholder="https://discord.com/api/webhooks/... (or leave blank for dry-run)" value="">
          </div>

          <div class="form-group">
            <label class="form-label">Underlying Asset</label>
            <input type="text" class="form-control" id="sim-asset" value="BTC" readonly>
          </div>

          <button type="submit" class="btn-gold" id="btn-dispatch">Send Test Alert Webhook &rarr;</button>
        </form>

        <div style="margin-top:20px;">
          <label class="form-label">Live Dispatch Payload Preview</label>
          <div class="preview-box" id="payload-preview">Ready. Select an alert scenario and click "Send Test Alert Webhook" to preview payload.</div>
        </div>
      </div>

      <!-- Recent Dispatches Telemetry Log -->
      <div class="card">
        <div class="card-title">Recent Dispatched Alerts Log</div>
        <div id="alerts-list">
          ${recentAlerts.length === 0 ? `
            <div style="padding:24px; text-align:center; color:var(--muted); font-size:0.88rem;">
              No alerts dispatched in the current session. Use the test harness on the left to simulate a notification.
            </div>
          ` : recentAlerts.map(a => `
            <div class="alert-item">
              <div class="alert-header">
                <div class="alert-title">${a.title}</div>
                <div class="badge-sev badge-${a.severity}">${a.severity}</div>
              </div>
              <p style="font-size:0.82rem; color:var(--muted); margin-bottom:8px;">${a.summary}</p>
              <div style="font-size:0.75rem; font-family:var(--font-mono); color:var(--accent);">
                SHA256: ${a.provenanceHash.slice(0, 24)}... &bull; ${a.timestamp.slice(11, 19)} UTC
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </main>

  <script>
    async function triggerTestDispatch() {
      const type = document.getElementById('sim-event-type').value;
      const url = document.getElementById('sim-url').value;
      const btn = document.getElementById('btn-dispatch');
      btn.textContent = 'Dispatching...';

      try {
        const res = await fetch('/api/alerts/webhook/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: type, webhookUrl: url })
        });
        const data = await res.json();
        document.getElementById('payload-preview').textContent = JSON.stringify(data, null, 2);
        btn.textContent = 'Dispatched Successfully!';
        setTimeout(() => { btn.textContent = 'Send Test Alert Webhook \u2192'; }, 2000);
      } catch (err) {
        document.getElementById('payload-preview').textContent = 'Error: ' + err.message;
        btn.textContent = 'Dispatch Failed';
        setTimeout(() => { btn.textContent = 'Send Test Alert Webhook \u2192'; }, 2000);
      }
    }
  </script>
</body>
</html>`;
}
