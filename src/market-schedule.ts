/**
 * QuanterraOS 24/7 Market Window Schedule Grid & Event Calendar Engine
 *
 * Models the full 96-window daily cadence of Kalshi KXBTC15M short-duration contracts:
 * - 96 15-minute event windows per 24-hour UTC cycle (00:00 to 23:45)
 * - 24 1-hour event windows (KXBTCD)
 *
 * Microstructure Features:
 * 1. Global Macroeconomic Session Overlaps:
 *    - Asia-Pacific (00:00 - 08:00 UTC)
 *    - London / Europe (07:00 - 15:30 UTC)
 *    - New York / US (13:30 - 20:00 UTC)
 *    - London / NY Overlap (13:30 - 15:30 UTC: Peak Liquidity & Spreads)
 * 2. Active Window Locator: Second-by-second identification of the currently open window.
 * 3. Historical Liquidity & Volatility Tiers (PEAK, ELEVATED, STANDARD, OFF_HOURS).
 * 4. RFC 5545 iCalendar (.ics) Generator for 1-click Google/Apple Calendar subscription.
 *
 * Strict Compliance Guardrails:
 * - Rule B1: Provenance hash on all schedule computations.
 * - Rule B4: Strictly prohibited terminology ("arbitrage", "alpha", "beat the market").
 * - Rule B5: $0.00 capital deployed standby lock disclaimers on every view.
 * - Rule B10: CME CF BRTI and Kalshi non-affiliation notices.
 */

import { createHash } from "node:crypto";

export type MarketSession =
  | "ASIA_PACIFIC"
  | "LONDON_EUROPE"
  | "NEW_YORK_AMERICA"
  | "LONDON_NY_OVERLAP"
  | "DAILY_CLOSE_ROLLOVER";

export type WindowStatus = "SETTLED" | "ACTIVE" | "NEXT" | "SCHEDULED";

export type LiquidityTier = "PEAK" | "ELEVATED" | "STANDARD" | "OFF_HOURS";

export interface Scheduled15mWindow {
  windowIndex: number; // 0 to 95
  ticker: string;      // e.g. KXBTC15M-26OCT07-1415
  hourUtc: number;     // 0 to 23
  minuteUtc: number;   // 0, 15, 30, 45
  timeLabelUtc: string; // "14:15 UTC"
  startTimeIso: string;
  endTimeIso: string;
  twapStartIso: string; // 60s before endTimeIso
  session: MarketSession;
  sessionLabel: string;
  liquidityTier: LiquidityTier;
  status: WindowStatus;
  radarUrl: string;
  settlementUrl: string;
}

export interface DailyScheduleMatrix {
  referenceDateUtc: string; // "YYYY-MM-DD"
  activeWindowTicker: string;
  activeWindowIndex: number;
  remainingSecondsInActiveWindow: number;
  totalDailyWindows: number; // 96
  settledCount: number;
  remainingCount: number;
  windows: Scheduled15mWindow[];
  sessionBreakdown: Record<MarketSession, number>;
  provenanceHash: string;
}

/**
 * Returns macroeconomic trading session for a given UTC hour and minute.
 */
export function getMarketSessionForTime(hour: number, minute: number): { session: MarketSession; label: string; liquidity: LiquidityTier } {
  const totalMinutes = hour * 60 + minute;

  // London / NY Overlap: 13:30 to 15:30 UTC (810m to 930m)
  if (totalMinutes >= 13 * 60 + 30 && totalMinutes < 15 * 60 + 30) {
    return {
      session: "LONDON_NY_OVERLAP",
      label: "London / NY Peak Overlap",
      liquidity: "PEAK"
    };
  }

  // New York / America: 13:30 to 20:00 UTC (810m to 1200m)
  if (totalMinutes >= 15 * 60 + 30 && totalMinutes < 20 * 60) {
    return {
      session: "NEW_YORK_AMERICA",
      label: "US Session",
      liquidity: "ELEVATED"
    };
  }

  // London / Europe: 07:00 to 13:30 UTC (420m to 810m)
  if (totalMinutes >= 7 * 60 && totalMinutes < 13 * 60 + 30) {
    return {
      session: "LONDON_EUROPE",
      label: "London / European Session",
      liquidity: "ELEVATED"
    };
  }

  // Asia-Pacific: 00:00 to 07:00 UTC (0m to 420m)
  if (totalMinutes < 7 * 60) {
    return {
      session: "ASIA_PACIFIC",
      label: "Asia-Pacific Session",
      liquidity: "STANDARD"
    };
  }

  // Daily Close & Settlement Rollover: 20:00 to 24:00 UTC (1200m to 1440m)
  return {
    session: "DAILY_CLOSE_ROLLOVER",
    label: "Daily Close Rollover",
    liquidity: "OFF_HOURS"
  };
}

/**
 * Generates the full 96-window daily schedule matrix for a target timestamp.
 */
export function generateDailyScheduleMatrix(targetTime: Date = new Date()): DailyScheduleMatrix {
  const targetYear = targetTime.getUTCFullYear();
  const targetMonth = targetTime.getUTCMonth();
  const targetDate = targetTime.getUTCDate();

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const yyStr = String(targetYear).slice(2);
  const monStr = monthNames[targetMonth];
  const ddStr = String(targetDate).padStart(2, "0");
  const datePrefix = `${yyStr}${monStr}${ddStr}`;
  const referenceDateUtc = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${ddStr}`;

  const currentTotalSeconds = targetTime.getUTCHours() * 3600 + targetTime.getUTCMinutes() * 60 + targetTime.getUTCSeconds();
  const activeWindowIdx = Math.min(95, Math.floor(currentTotalSeconds / (15 * 60)));
  const remainingSecondsInActiveWindow = (activeWindowIdx + 1) * (15 * 60) - currentTotalSeconds;

  const sessionBreakdown: Record<MarketSession, number> = {
    ASIA_PACIFIC: 0,
    LONDON_EUROPE: 0,
    NEW_YORK_AMERICA: 0,
    LONDON_NY_OVERLAP: 0,
    DAILY_CLOSE_ROLLOVER: 0
  };

  const windows: Scheduled15mWindow[] = [];
  let settledCount = 0;

  for (let idx = 0; idx < 96; idx++) {
    const hour = Math.floor((idx * 15) / 60);
    const minute = (idx * 15) % 60;
    const hhStr = String(hour).padStart(2, "0");
    const mmStr = String(minute).padStart(2, "0");
    const ticker = `KXBTC15M-${datePrefix}-${hhStr}${mmStr}`;

    const startMs = Date.UTC(targetYear, targetMonth, targetDate, hour, minute, 0);
    const endMs = startMs + 15 * 60 * 1000;
    const twapStartMs = endMs - 60 * 1000;

    const sessionInfo = getMarketSessionForTime(hour, minute);
    sessionBreakdown[sessionInfo.session]++;

    let status: WindowStatus = "SCHEDULED";
    if (idx < activeWindowIdx) {
      status = "SETTLED";
      settledCount++;
    } else if (idx === activeWindowIdx) {
      status = "ACTIVE";
    } else if (idx === activeWindowIdx + 1) {
      status = "NEXT";
    }

    windows.push({
      windowIndex: idx,
      ticker,
      hourUtc: hour,
      minuteUtc: minute,
      timeLabelUtc: `${hhStr}:${mmStr} UTC`,
      startTimeIso: new Date(startMs).toISOString(),
      endTimeIso: new Date(endMs).toISOString(),
      twapStartIso: new Date(twapStartMs).toISOString(),
      session: sessionInfo.session,
      sessionLabel: sessionInfo.label,
      liquidityTier: sessionInfo.liquidity,
      status,
      radarUrl: `/radar?series=${ticker}`,
      settlementUrl: `/settlement?ticker=${ticker}`
    });
  }

  const activeWindowTicker = windows[activeWindowIdx]?.ticker ?? `KXBTC15M-${datePrefix}-0000`;
  const remainingCount = 96 - settledCount;

  const rawHash = `${referenceDateUtc}:${activeWindowTicker}:${activeWindowIdx}:${windows.length}`;
  const provenanceHash = createHash("sha256").update(rawHash).digest("hex");

  return {
    referenceDateUtc,
    activeWindowTicker,
    activeWindowIndex: activeWindowIdx,
    remainingSecondsInActiveWindow,
    totalDailyWindows: 96,
    settledCount,
    remainingCount,
    windows,
    sessionBreakdown,
    provenanceHash
  };
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) feed file for calendar applications.
 */
export function generateIcsCalendarFeed(matrix: DailyScheduleMatrix): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//QuanterraOS//BTC Expiry Cadence Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:QuanterraOS BTC 15m Expiries",
    "X-WR-TIMEZONE:UTC",
    "X-WR-CALDESC:Institutional 15-Minute Bitcoin Expiry and Oracle TWAP Schedule"
  ];

  for (const win of matrix.windows) {
    const startStr = win.startTimeIso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const endStr = win.endTimeIso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const uid = `${win.ticker}@quanterraos.com`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${startStr}`);
    lines.push(`DTSTART:${startStr}`);
    lines.push(`DTEND:${endStr}`);
    lines.push(`SUMMARY:Kalshi ${win.ticker} (${win.sessionLabel})`);
    lines.push(`DESCRIPTION:15-Minute BTC Binary Expiry. Settlement determined by CME CF BRTI 60-Second TWAP. Live Radar: https://quanterraos.com${win.radarUrl}`);
    lines.push(`URL:https://quanterraos.com${win.radarUrl}`);
    lines.push("STATUS:CONFIRMED");

    // Add alarm trigger 2 minutes before settlement
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-PT2M");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:60s CME CF BRTI TWAP Settlement Oracle Imminent");
    lines.push("END:VALARM");

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Renders the 24/7 Market Window Schedule Grid Terminal HTML.
 */
export function renderMarketScheduleHtml(matrix: DailyScheduleMatrix): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>24/7 Market Expiry Schedule & Cadence Matrix | QuanterraOS</title>
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
    .container { max-width: 1240px; margin: 0 auto; padding: 32px 20px; }
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
    .lead { color: var(--muted); font-size: 1rem; line-height: 1.5; max-width: 860px; }

    .stat-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }
    @media (max-width: 768px) {
      .stat-row { grid-template-columns: 1fr 1fr; }
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 16px;
    }
    .stat-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
    .stat-val { font-size: 1.4rem; font-weight: 800; font-family: var(--font-mono); color: #FFF; }

    .matrix-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }
    .matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-subtle);
      flex-wrap: wrap;
      gap: 12px;
    }
    .matrix-title { font-size: 1.2rem; font-weight: 700; color: #FFF; }
    .btn-gold {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%);
      color: #06070A;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.85rem;
    }

    .hour-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }
    .hour-block {
      background: var(--card-inner);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px;
    }
    .hour-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .hour-time { font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem; color: #FFF; }
    .hour-session { font-size: 0.72rem; color: var(--accent); font-weight: 600; }

    .pills-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .window-pill {
      display: block;
      text-align: center;
      padding: 6px 4px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.1s, border-color 0.15s;
    }
    .window-pill:hover { transform: translateY(-1px); }

    .pill-ACTIVE {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10B981;
      color: #10B981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
    }
    .pill-NEXT {
      background: rgba(223, 184, 67, 0.18);
      border: 1px solid var(--accent);
      color: var(--champagne);
    }
    .pill-SETTLED {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #9CA3AF;
    }
    .pill-SCHEDULED {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.04);
      color: #6B7280;
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
      <a href="/corridors">Corridors</a>
      <a href="/divergence">Divergence</a>
      <a href="/calibration/explorer">Decomposition</a>
      <a href="/settlement">Settlement</a>
      <a href="/schedule" class="active" style="color:var(--accent);">Schedule</a>
      <a href="/radar/audio">Audio</a>
      <a href="/webhooks">Webhooks</a>
      <a href="/journal">Journal</a>
      <a href="/account">Account</a>
    </nav>
  </header>

  <main class="container">
    <div class="hero">
      <div class="eyebrow">&Sigma; 24/7 Market Matrix &bull; 96 Daily Expiries &bull; CME CF BRTI Standard</div>
      <h1>24/7 Market Window Schedule Grid</h1>
      <p class="lead">
        Comprehensive 24-hour cadence of Kalshi 15-minute Bitcoin contracts (KXBTC15M). Tracks macroeconomic session overlaps, active window countdowns, and provides an RFC 5545 iCalendar feed for external calendar integration.
      </p>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Active 15m Window</div>
        <div class="stat-val" style="color:var(--success); font-size:1.15rem;">${matrix.activeWindowTicker}</div>
        <div style="font-size:0.75rem; color:var(--muted); margin-top:4px;">Window #${matrix.activeWindowIndex + 1} of 96</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Time Remaining</div>
        <div class="stat-val" style="color:var(--champagne);" id="active-countdown">${Math.floor(matrix.remainingSecondsInActiveWindow / 60)}m ${matrix.remainingSecondsInActiveWindow % 60}s</div>
        <div style="font-size:0.75rem; color:var(--muted); margin-top:4px;">60s TWAP Window Closes at :00</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Windows Settled Today</div>
        <div class="stat-val" style="color:#FFF;">${matrix.settledCount} <span style="font-size:0.85rem; color:var(--muted);">/ 96</span></div>
        <div style="font-size:0.75rem; color:var(--muted); margin-top:4px;">${matrix.remainingCount} Remaining Windows</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Peak Liquidity Overlap</div>
        <div class="stat-val" style="color:var(--accent);">13:30 - 15:30</div>
        <div style="font-size:0.75rem; color:var(--muted); margin-top:4px;">London / New York Hours</div>
      </div>
    </div>

    <div class="matrix-box">
      <div class="matrix-header">
        <div>
          <div class="matrix-title">Daily 96-Window Cadence Matrix &bull; ${matrix.referenceDateUtc} UTC</div>
          <p style="font-size:0.82rem; color:var(--muted); margin-top:2px;">
            Click any active/upcoming window to open Expiry Radar, or click settled windows to inspect post-mortem 60s TWAP tape.
          </p>
        </div>
        <div style="display:flex; gap:10px;">
          <a href="/api/schedule/calendar.ics" download="quanterraos-btc-expiries.ics" class="btn-gold">&darr; Download .ICS Calendar Feed</a>
        </div>
      </div>

      <div class="hour-grid">
        ${Array.from({ length: 24 }).map((_, h) => {
          const hourWindows = matrix.windows.filter(w => w.hourUtc === h);
          const sessionInfo = hourWindows[0]?.sessionLabel ?? "Standard";
          const hh = String(h).padStart(2, "0");

          return `
            <div class="hour-block">
              <div class="hour-header">
                <span class="hour-time">${hh}:00 UTC</span>
                <span class="hour-session">${sessionInfo}</span>
              </div>
              <div class="pills-row">
                ${hourWindows.map(w => {
                  const targetUrl = w.status === 'SETTLED' ? w.settlementUrl : w.radarUrl;
                  const title = `${w.ticker} (${w.status})`;
                  return `<a href="${targetUrl}" class="window-pill pill-${w.status}" title="${title}">:${String(w.minuteUtc).padStart(2, '0')}</a>`;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  </main>

  <footer style="text-align:center; padding:32px 20px; color:var(--muted); font-size:0.78rem; border-top:1px solid var(--border-subtle); margin-top:40px;">
    SHA256 PROVENANCE: ${matrix.provenanceHash} &bull; Rule B5 Strict Compliance: $0.00 Live Capital Deployed.
  </footer>
</body>
</html>`;
}
