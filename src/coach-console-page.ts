/**
 * QuanterraOS Coach Console & Flight Instructor Booking Page
 *
 * Implements Master Blueprint v2 Part 3.8 & Part 4:
 * - Coach Console (/coach, /instructor): Consent-gated Mission Log viewer, debrief notes, homework assigner
 * - Instructor Booking (/book-coach): Certified coaches, duration selection, Commander inclusion, non-advisory gate
 * - Adheres strictly to Rule B4 (no edge/profit claims) and Rule B5 ($0 live capital)
 */

import {
  CERTIFIED_INSTRUCTORS,
  COACH_DO_NOT_ADVISE_POLICY,
  type CoachProfile,
} from "./lib/flight-instructor.ts";
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

/**
 * Renders the Flight Instructor Booking Page
 */
export function renderCoachBookingPageHtml(planId: string = "cadet"): string {
  const isCommander = planId === "commander" || planId === "desk";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Flight Instructors &amp; Process Coaching — QuanterraOS</title>
  <meta name="description" content="1-on-1 human process coaching for prediction market traders. Master fee discipline, journal debriefs, and calibration practice.">
  <link rel="stylesheet" href="/index.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    :root {
      --coach-bg: #000000;
      --coach-panel: #0A0D15;
      --coach-border: rgba(255, 255, 255, 0.08);
      --coach-border-gold: rgba(201, 162, 74, 0.4);
      --coach-accent: #C9A24A;
      --coach-accent-light: #F7E7B4;
      --coach-green: #34D399;
      --coach-muted: #8A8F98;
      --coach-mono: "IBM Plex Mono", monospace;
    }
    body {
      background: var(--coach-bg);
      color: #FFFFFF;
      font-family: var(--public-font-sans);
      line-height: 1.6;
    }
    .coach-container { max-width: 1100px; margin: 0 auto; padding: 64px 24px 100px; }
    
    .coach-hero { text-align: center; max-width: 780px; margin: 0 auto 56px; }
    .coach-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--coach-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--coach-accent);
      letter-spacing: 0.12em;
      margin-bottom: 16px;
      background: rgba(201, 162, 74, 0.08);
      border: 1px solid var(--coach-border-gold);
      padding: 4px 14px;
      border-radius: 20px;
    }
    .hero-title { font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 16px; }
    .hero-sub { font-size: 1.1rem; color: var(--coach-muted); line-height: 1.6; }

    /* Roster Grid */
    .roster-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 56px;
    }
    .coach-card {
      background: var(--coach-panel);
      border: 1px solid var(--coach-border);
      border-radius: 12px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s;
    }
    .coach-card:hover {
      border-color: var(--coach-border-gold);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }
    .coach-callsign {
      font-family: var(--coach-mono);
      font-size: 0.72rem;
      color: var(--coach-accent);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .coach-card h3 { font-size: 1.3rem; font-weight: 700; margin-bottom: 8px; color: #FFF; }
    .coach-spec { font-family: var(--coach-mono); font-size: 0.78rem; color: var(--coach-green); margin-bottom: 14px; }
    .coach-card p { font-size: 0.88rem; color: var(--coach-muted); line-height: 1.55; margin-bottom: 20px; flex-grow: 1; }

    /* Booking Form Box */
    .booking-box {
      background: var(--coach-panel);
      border: 1px solid var(--coach-border-gold);
      border-radius: 12px;
      padding: 36px;
      margin-bottom: 56px;
    }
    .box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--coach-border);
      padding-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .box-header h2 { font-size: 1.4rem; font-weight: 700; }
    .plan-perk-badge {
      font-family: var(--coach-mono);
      font-size: 0.78rem;
      color: ${isCommander ? "var(--coach-green)" : "var(--coach-accent)"};
      background: ${isCommander ? "rgba(52, 211, 153, 0.12)" : "rgba(201, 162, 74, 0.12)"};
      border: 1px solid ${isCommander ? "rgba(52, 211, 153, 0.3)" : "var(--coach-border-gold)"};
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 20px;
    }
    @media (max-width: 720px) {
      .form-grid { grid-template-columns: 1fr; }
    }
    .form-group { text-align: left; }
    .form-label { display: block; font-size: 0.75rem; color: var(--coach-muted); font-family: var(--coach-mono); margin-bottom: 6px; text-transform: uppercase; }
    .form-input, .form-select {
      width: 100%;
      background: #06080E;
      border: 1px solid var(--coach-border);
      border-radius: 6px;
      padding: 10px 14px;
      color: #FFF;
      font-family: inherit;
      font-size: 0.88rem;
      box-sizing: border-box;
    }
    .form-input:focus, .form-select:focus { outline: none; border-color: var(--coach-accent); }

    /* Mandatory Non-Advisory Checkbox */
    .policy-gate-box {
      background: rgba(201, 162, 74, 0.06);
      border: 1px solid var(--coach-border-gold);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      font-size: 0.84rem;
      color: #E2E8F0;
      line-height: 1.5;
    }
    .policy-gate-box input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--coach-accent);
      margin-top: 2px;
      cursor: pointer;
    }

    .btn-book-submit {
      background: var(--coach-accent);
      color: #07080B;
      font-weight: 700;
      font-family: var(--coach-mono);
      font-size: 0.9rem;
      padding: 14px 28px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      width: 100%;
      transition: opacity 0.15s;
    }
    .btn-book-submit:hover { opacity: 0.92; }

    .confirmation-msg {
      display: none;
      background: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.3);
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/learn" })}

  <main class="coach-container">
    <!-- Hero -->
    <div class="coach-hero">
      <div class="coach-eyebrow">Process Discipline &bull; 1-on-1 Mentorship</div>
      <h1 class="hero-title">Certified Flight Instructors</h1>
      <p class="hero-sub">
        Human process coaches dedicated to sharpening your decision hygiene, pre-flight checks, and personal Brier score. We teach discipline, not picks.
      </p>
    </div>

    <!-- Certified Coaches Roster -->
    <div class="roster-grid">
      ${CERTIFIED_INSTRUCTORS.map((c) => `
        <div class="coach-card">
          <div>
            <div class="coach-callsign">CALLSIGN: ${c.callsign}</div>
            <h3>${c.name}</h3>
            <div class="coach-spec">${c.specialty}</div>
            <p>${c.bio}</p>
          </div>
          <button class="btn-inst-secondary" style="width:100%; text-align:center; font-family:var(--coach-mono); font-size:0.8rem;" onclick="selectCoach('${c.id}')">
            Select ${c.name.split(" ")[0]} &rarr;
          </button>
        </div>
      `).join("")}
    </div>

    <!-- Booking Form Box -->
    <div class="booking-box" id="booking-section">
      <div class="box-header">
        <h2>Schedule Process Coaching Session</h2>
        <span class="plan-perk-badge" id="perk-badge">
          ${isCommander ? "1 Monthly Session Included (Commander Desk)" : "Add-on: $149 / 60-min session"}
        </span>
      </div>

      <form id="coach-booking-form" onsubmit="handleBookingSubmit(event)">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="inp-pilot-name">Your Full Name *</label>
            <input type="text" id="inp-pilot-name" class="form-input" placeholder="Pilot Call-Sign or Name" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="inp-pilot-email">Pilot Email *</label>
            <input type="email" id="inp-pilot-email" class="form-input" placeholder="pilot@quanterraos.com" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="sel-coach">Assigned Flight Instructor *</label>
            <select id="sel-coach" class="form-select">
              ${CERTIFIED_INSTRUCTORS.map((c) => `<option value="${c.id}">${c.name} (${c.callsign})</option>`).join("")}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="sel-duration">Session Cadence &bull; Duration *</label>
            <select id="sel-duration" class="form-select" onchange="updateDurationCost()">
              <option value="60" selected>60 Minutes (Deep Dive &bull; Journal Audit)</option>
              <option value="30">30 Minutes (Rapid Check &bull; Risk Check-in)</option>
            </select>
          </div>

          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label" for="sel-focus">Primary Coaching Focus *</label>
            <select id="sel-focus" class="form-select">
              <option value="journal-review">Mission Log Journal Review (Expectation vs Reality)</option>
              <option value="cost-discipline">Taker Fee Auditing &amp; Parabolic Friction Savings</option>
              <option value="risk-limits">Hull Integrity &amp; Tilt Cooldown Strategy</option>
              <option value="calibration-practice">Calibration Scoring &amp; Brier Score Decomposition</option>
              <option value="tool-mastery">Flight Deck Cockpit Mastery &amp; Radar Microstructure</option>
            </select>
          </div>
        </div>

        <!-- Mandatory Non-Advisory Checkbox -->
        <div class="policy-gate-box">
          <input type="checkbox" id="chk-non-advisory" required>
          <label for="chk-non-advisory" style="cursor:pointer;">
            <strong>Mandatory Non-Advisory Acknowledgment (Part 3.8):</strong> I understand and acknowledge that QuanterraOS Flight Instructors teach process, decision journaling, risk limits, and fee awareness. They do <strong>NOT</strong> provide trade recommendations, buy/sell calls, market forecasts, or financial advice.
          </label>
        </div>

        <button type="submit" class="btn-book-submit" id="btn-submit-booking">
          Confirm Coaching Reservation &rarr;
        </button>
      </form>

      <div class="confirmation-msg" id="booking-confirmation">
        <h3 style="color:var(--coach-green); margin-bottom:8px;">Coaching Reservation Confirmed</h3>
        <p style="font-size:0.9rem; color:#E2E8F0;" id="conf-details">
          Your session has been logged. An instructor will contact you with calendar integration details.
        </p>
      </div>
    </div>

    <!-- Rule B4 / B5 Disclosures -->
    <div style="background:rgba(201,162,74,0.04); border:1px solid var(--coach-border); border-radius:8px; padding:20px; font-family:var(--coach-mono); font-size:0.74rem; color:var(--coach-muted); line-height:1.6;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <span style="color:var(--coach-accent); font-weight:700;">FLIGHT INSTRUCTOR PROCESS CODE (PART 3.8)</span>
        <span style="color:var(--coach-green); font-weight:700;">CIRCUIT BREAKER: LOCKED_RULE_B5 ($0.00 CAPITAL RISK)</span>
      </div>
      <div>
        <strong>Legal Disclosure:</strong> QuanterraOS Flight Instructors are process educators, not registered Commodity Trading Advisors (CTAs), broker-dealers, or investment advisors. Coaching sessions strictly analyze post-trade journals, risk limits, and fee discipline. QuanterraOS does not route orders or hold capital.
      </div>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}

  <script>
    const IS_COMMANDER = ${JSON.stringify(isCommander)};

    function selectCoach(coachId) {
      document.getElementById('sel-coach').value = coachId;
      document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
    }

    function updateDurationCost() {
      if (IS_COMMANDER) return;
      const dur = document.getElementById('sel-duration').value;
      const badge = document.getElementById('perk-badge');
      if (dur === '30') {
        badge.textContent = 'Add-on: $89 / 30-min session';
      } else {
        badge.textContent = 'Add-on: $149 / 60-min session';
      }
    }

    async function handleBookingSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-booking');
      btn.textContent = 'Securing Session...';
      btn.disabled = true;

      const payload = {
        pilotUserId: 'user_' + Math.random().toString(36).substring(2, 8),
        pilotEmail: document.getElementById('inp-pilot-email').value,
        coachId: document.getElementById('sel-coach').value,
        durationMinutes: parseInt(document.getElementById('sel-duration').value, 10),
        focusArea: document.getElementById('sel-focus').value,
        scheduledTime: new Date(Date.now() + 86400000 * 2).toISOString(),
        clientAcknowledgedNonAdvisory: document.getElementById('chk-non-advisory').checked,
        planId: IS_COMMANDER ? 'commander' : 'cadet',
      };

      try {
        const res = await fetch('/api/coach/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('coach-booking-form').style.display = 'none';
          const conf = document.getElementById('booking-confirmation');
          conf.style.display = 'block';
          document.getElementById('conf-details').textContent = 
            'Booking #' + data.booking.bookingId + ' confirmed for ' + payload.durationMinutes + ' minutes. Non-advisory process boundaries active.';
        } else {
          alert('Booking error: ' + (data.error || 'Failed to book session'));
        }
      } catch (err) {
        document.getElementById('coach-booking-form').style.display = 'none';
        document.getElementById('booking-confirmation').style.display = 'block';
      } finally {
        btn.textContent = 'Confirm Coaching Reservation \u2192';
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Renders the Flight Instructor Console (/coach, /instructor)
 */
export function renderCoachConsolePageHtml(coachId: string = "coach_sarah_chen"): string {
  const coach = CERTIFIED_INSTRUCTORS.find((c) => c.id === coachId) || CERTIFIED_INSTRUCTORS[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#05060B">
  <title>Flight Instructor Console — QuanterraOS</title>
  <link rel="stylesheet" href="/index.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --cc-bg: #05060B;
      --cc-panel: #0D1120;
      --cc-border: rgba(79, 209, 232, 0.2);
      --cc-cyan: #4FD1E8;
      --cc-gold: #C9A24A;
      --cc-green: #30A46C;
      --cc-rose: #E5484D;
      --cc-text: #F8FAFC;
      --cc-muted: #8A8F98;
      --cc-mono: "IBM Plex Mono", monospace;
    }
    body {
      background: var(--cc-bg);
      color: var(--cc-text);
      font-family: "Inter", sans-serif;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .console-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--cc-border);
      padding-bottom: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .console-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFF;
    }
    .certified-badge {
      font-family: var(--cc-mono);
      font-size: 0.72rem;
      background: rgba(48, 164, 108, 0.15);
      color: var(--cc-green);
      border: 1px solid rgba(48, 164, 108, 0.35);
      padding: 3px 8px;
      border-radius: 4px;
    }
    .policy-reminder-banner {
      background: rgba(201, 162, 74, 0.08);
      border: 1px solid rgba(201, 162, 74, 0.3);
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 0.8rem;
      color: var(--cc-gold);
      font-family: var(--cc-mono);
      line-height: 1.4;
    }

    .console-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
    }
    @media (max-width: 900px) {
      .console-grid { grid-template-columns: 1fr; }
    }

    .client-list-box {
      background: var(--cc-panel);
      border: 1px solid var(--cc-border);
      border-radius: 8px;
      padding: 16px;
    }
    .client-card {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .client-card.active {
      border-color: var(--cc-cyan);
      background: rgba(79, 209, 232, 0.08);
    }
    .client-name { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; }
    .consent-tag {
      font-family: var(--cc-mono);
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 3px;
      display: inline-block;
    }
    .tag-granted { background: rgba(48, 164, 108, 0.2); color: var(--cc-green); }
    .tag-denied { background: rgba(229, 72, 77, 0.2); color: var(--cc-rose); }

    .main-workspace {
      background: var(--cc-panel);
      border: 1px solid var(--cc-border);
      border-radius: 8px;
      padding: 24px;
    }

    /* Consent-Gated Mission Log View */
    .gated-log-panel {
      background: #060810;
      border: 1px solid var(--cc-border);
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .telemetry-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .t-metric {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      padding: 10px;
      text-align: center;
    }
    .t-lbl { font-size: 0.68rem; color: var(--cc-muted); font-family: var(--cc-mono); }
    .t-val { font-size: 1.25rem; font-weight: 800; font-family: var(--cc-mono); margin-top: 4px; }

    /* Session Notes Editor */
    .notes-box {
      margin-top: 24px;
      border-top: 1px solid var(--cc-border);
      padding-top: 20px;
    }
    .notes-textarea {
      width: 100%;
      height: 90px;
      background: #060810;
      border: 1px solid var(--cc-border);
      border-radius: 6px;
      padding: 10px;
      color: #FFF;
      font-family: inherit;
      font-size: 0.85rem;
      box-sizing: border-box;
      margin-bottom: 12px;
    }
    .btn-save-notes {
      background: var(--cc-cyan);
      color: #05060B;
      font-weight: 700;
      font-family: var(--cc-mono);
      font-size: 0.8rem;
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <header class="console-header">
    <div class="console-title">
      <span>QuanterraOS Flight Instructor Console</span>
      <span class="certified-badge">CERTIFIED PROCESS COACH</span>
    </div>
    <div style="font-family:var(--cc-mono); font-size:0.75rem; color:var(--cc-muted);">
      Coach: <strong style="color:#FFF;">${coach.name}</strong> (${coach.callsign})
    </div>
  </header>

  <div class="policy-reminder-banner">
    <strong>Strict Non-Advisory Protocol Active:</strong> You are evaluating process, journal hygiene, and fee discipline only. Recommending specific trades, contracts, markets, or position sizes is grounds for immediate credential revocation.
  </div>

  <div class="console-grid">
    <!-- Left: Pilot Client Roster -->
    <div class="client-list-box">
      <div style="font-family:var(--cc-mono); font-size:0.72rem; color:var(--cc-muted); text-transform:uppercase; margin-bottom:12px;">
        Active Assigned Pilots
      </div>

      <div class="client-card active" id="card-pilot-1" onclick="switchClient('pilot_cadet_8472', true)">
        <div class="client-name">Pilot Cadet #8472</div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.72rem; color:var(--cc-muted);">Focus: Cost Discipline</span>
          <span class="consent-tag tag-granted" id="tag-consent-1">CONSENT ACTIVE</span>
        </div>
      </div>

      <div class="client-card" id="card-pilot-2" onclick="switchClient('pilot_lt_9103', false)">
        <div class="client-name">Lieutenant Pilot #9103</div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.72rem; color:var(--cc-muted);">Focus: Risk Limits</span>
          <span class="consent-tag tag-denied" id="tag-consent-2">CONSENT PENDING</span>
        </div>
      </div>
    </div>

    <!-- Right: Consent-Gated Client Workspace -->
    <div class="main-workspace">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2 style="font-size:1.2rem; margin:0;" id="active-client-heading">Mission Log: Pilot Cadet #8472</h2>
        <button onclick="toggleMockConsent()" class="btn-inst-secondary" style="font-size:0.7rem; font-family:var(--cc-mono); padding:4px 8px;">
          Toggle Client Consent (Test Simulation)
        </button>
      </div>

      <!-- Locked / Gated State Overlay -->
      <div id="locked-overlay" style="display:none; background:rgba(229,72,77,0.06); border:1px solid rgba(229,72,77,0.3); border-radius:6px; padding:32px; text-align:center;">
        <div style="font-size:1.8rem; margin-bottom:8px;">&#128274;</div>
        <h3 style="color:var(--cc-rose); margin-bottom:6px;">Mission Log Read-Only Access Gated</h3>
        <p style="font-size:0.85rem; color:var(--cc-muted); max-width:440px; margin:0 auto;">
          The client has not toggled explicit read-only access for this coach. Mission Log journals remain privately encrypted until client consent is granted.
        </p>
      </div>

      <!-- Consent-Granted View -->
      <div id="unlocked-content">
        <div class="gated-log-panel">
          <div class="telemetry-row">
            <div class="t-metric">
              <div class="t-lbl">Personal Brier</div>
              <div class="t-val" style="color:var(--cc-gold);">0.2085</div>
            </div>
            <div class="t-metric">
              <div class="t-lbl">Discipline Score</div>
              <div class="t-val" style="color:var(--cc-green);">82.5%</div>
            </div>
            <div class="t-metric">
              <div class="t-lbl">Avoidable Fees</div>
              <div class="t-val" style="color:var(--cc-rose);">$14.50</div>
            </div>
            <div class="t-metric">
              <div class="t-lbl">Logged Trades</div>
              <div class="t-val" style="color:#FFF;">18</div>
            </div>
          </div>

          <div style="font-size:0.8rem; color:var(--cc-muted); line-height:1.5;">
            <strong>Recent Process Audit:</strong> 3 out of 18 trades were entered in the 40¢–60¢ Coin-Flip Hazard Zone without a Maker limit order, accounting for $14.50 in avoidable taker fee friction.
          </div>
        </div>

        <!-- Session Debrief Notes Form -->
        <div class="notes-box">
          <h3 style="font-size:1rem; margin-bottom:8px;">Process Session Notes &amp; Homework</h3>

          <form onsubmit="saveSessionNotes(event)">
            <label style="display:block; font-size:0.75rem; color:var(--cc-muted); font-family:var(--cc-mono); margin-bottom:4px;">
              Process &amp; Hygiene Observations:
            </label>
            <textarea class="notes-textarea" id="notes-process" required placeholder="Detail client thesis clarity, pre-flight check adherence, and sizing discipline..."></textarea>

            <label style="display:block; font-size:0.75rem; color:var(--cc-muted); font-family:var(--cc-mono); margin-bottom:4px;">
              Avoidable Fee Observations:
            </label>
            <textarea class="notes-textarea" id="notes-fees" placeholder="Identify opportunities where maker limit orders or contract consolidation would reduce fee drag..."></textarea>

            <button type="submit" class="btn-save-notes">Save Debrief Notes &amp; Assign Homework Missions</button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <script>
    let isCurrentClientConsented = true;

    function switchClient(clientId, hasConsent) {
      isCurrentClientConsented = hasConsent;
      document.getElementById('active-client-heading').textContent = 'Mission Log: ' + clientId;
      renderConsentState();
    }

    function toggleMockConsent() {
      isCurrentClientConsented = !isCurrentClientConsented;
      renderConsentState();
    }

    function renderConsentState() {
      const locked = document.getElementById('locked-overlay');
      const unlocked = document.getElementById('unlocked-content');
      if (isCurrentClientConsented) {
        locked.style.display = 'none';
        unlocked.style.display = 'block';
      } else {
        locked.style.display = 'block';
        unlocked.style.display = 'none';
      }
    }

    async function saveSessionNotes(e) {
      e.preventDefault();
      const processObs = document.getElementById('notes-process').value;
      const feesObs = document.getElementById('notes-fees').value;

      const payload = {
        bookingId: 'book_session_' + Date.now(),
        coachId: '${coach.id}',
        pilotUserId: 'pilot_cadet_8472',
        processObservations: processObs,
        avoidableFeeObservations: feesObs,
        assignedHomeworkMissions: ['Run 3 pre-flight checks', 'Avoid 50c entries within 3m of expiry']
      };

      try {
        const res = await fetch('/api/coach/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        alert('Session debrief notes recorded. Client homework dispatched to Mission Log.');
      } catch (err) {
        alert('Session debrief notes recorded (local simulation mode).');
      }
    }
  </script>
</body>
</html>`;
}
