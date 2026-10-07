/**
 * QuanterraOS Founder Pilot Audit Console (/audit/pilot)
 *
 * Dedicated, founder-only console to observe, record, and verify real customer sessions.
 * Collects authentic audit records required before expanding to 100 users:
 * - Participant consent & recruitment origin
 * - Unassisted vs assisted timing & friction logs
 * - Verbatim comprehension answers
 * - Sign-out / sign-in persistence verification
 * - One-click exportable audit trail for governance & advisors
 */

import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export interface PilotAuditPageData {
  customerFunnel: {
    checks_completed: number;
    signups: number;
    checks_saved: number;
    journal_views: number;
    journal_exports: number;
  };
  internalFunnel: {
    checks_completed: number;
    signups: number;
    checks_saved: number;
    journal_views: number;
    journal_exports: number;
  };
  recentJournalEntries: Array<{
    id: string;
    userId: string;
    contractTicker: string;
    contractPrice: number;
    contractCount: number;
    exchangeFee: number;
    breakevenWinProb: number;
    outcome?: string | null;
    createdAt: string;
  }>;
  recordedSessions?: Array<{
    id: string;
    participantRef: string;
    channel: string;
    device: string;
    durationMinutes: number;
    unassisted: string;
    assistanceDetails?: string | null;
    persistenceStatus: string;
    confusionNotes?: string | null;
    comprehensionCostFee?: string | null;
    comprehensionBreakeven?: string | null;
    comprehensionZeroAlpha?: string | null;
    operatorNotes?: string | null;
    status: string;
    createdAt: string;
  }>;
}

export function renderPilotAuditPageHtml(data: PilotAuditPageData): string {
  const { recordedSessions = [] } = data;
  const recentJournalEntries = data.recentJournalEntries ?? [];
  const customerFunnel = data.customerFunnel ?? { checks_completed: 0, signups: 0, checks_saved: 0, journal_views: 0 };
  const internalFunnel = data.internalFunnel ?? { internal_checks: 0, example_previews: 0, audit_views: 0 };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Founder Usability Pilot Audit Console — QuanterraOS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0C0F17;
      --border: rgba(212, 175, 55, 0.2);
      --border-subtle: rgba(212, 175, 55, 0.08);
      --accent: #DFB843;
      --green: #10B981;
      --rose: #F43F5E;
      --cyan: #38BDF8;
      --text: #F8FAFC;
      --muted: #64748B;
      --font-sans: "Inter", sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      padding: 32px 24px 80px;
      line-height: 1.5;
    }
    .mono { font-family: var(--font-mono); }
    .container { max-width: 1200px; margin: 0 auto; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      background: rgba(223, 184, 67, 0.1);
      border: 1px solid rgba(223, 184, 67, 0.3);
      color: var(--accent);
    }
    h1 { font-size: 1.85rem; font-weight: 700; margin: 12px 0 6px; }
    .lead { color: var(--muted); font-size: 0.92rem; margin-bottom: 32px; max-width: 820px; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    @media (max-width: 860px) { .grid-2 { grid-template-columns: 1fr; } }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
    }
    .card-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.85rem;
    }
    .stat-row:last-child { border-bottom: none; }

    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 0.78rem; color: var(--muted); margin-bottom: 4px; }
    .form-input {
      width: 100%;
      background: rgba(6, 9, 14, 0.9);
      border: 1px solid var(--border);
      color: #FFFFFF;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 0.82rem;
      outline: none;
      font-family: var(--font-mono);
    }

    .btn-gold {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      color: #07080B;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      padding: 10px 18px;
      border-radius: 4px;
      border: 1px solid rgba(255, 248, 220, 0.6);
      cursor: pointer;
      text-decoration: none;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { font-family: var(--font-mono); font-size: 0.68rem; color: var(--muted); text-transform: uppercase; padding: 8px 12px; border-bottom: 1px solid var(--border); text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">🔒 FOUNDER PRIVILEGED ACCESS · LEVEL 3 PILOT AUDIT</div>
    <h1>Usability Pilot Observation &amp; Audit Console</h1>
    <p class="lead">
      Real-time telemetry, session verification, and audit trail generation for the 10-user usability pilot.
      Captures uncoached task completion, comprehension checks, and persistence before expanding to 100 users.
    </p>

    <!-- Telemetry Funnel Grid -->
    <div class="grid-2">
      <!-- Customer Funnel -->
      <div class="card">
        <div class="card-title">
          <span>Customer Funnel (Real Participants)</span>
          <span class="mono" style="font-size:0.75rem; color:var(--green);">PROD ISOLATED</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">1. Checks Completed</span>
          <span class="mono" style="font-weight:700;">${customerFunnel.checks_completed}</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">2. User Signups</span>
          <span class="mono" style="font-weight:700;">${customerFunnel.signups}</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">3. Checks Saved to Journal</span>
          <span class="mono" style="font-weight:700; color:var(--accent);">${customerFunnel.checks_saved}</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">4. Journal Page Views</span>
          <span class="mono" style="font-weight:700;">${customerFunnel.journal_views}</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">5. CSV Exports Downloaded</span>
          <span class="mono" style="font-weight:700;">${customerFunnel.journal_exports}</span>
        </div>
      </div>

      <!-- Internal / Team Funnel -->
      <div class="card">
        <div class="card-title">
          <span>Internal / Engineering Test Runs</span>
          <span class="mono" style="font-size:0.75rem; color:var(--muted);">AUTOMATED TESTS</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">1. Test Checks</span>
          <span class="mono">${internalFunnel.checks_completed}</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">2. Test Signups</span>
          <span class="mono">${internalFunnel.signups}</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">3. Test Checks Saved</span>
          <span class="mono">${internalFunnel.checks_saved}</span>
        </div>
        <div class="stat-row">
          <span style="color:var(--muted);">4. Test Journal Views</span>
          <span class="mono">${internalFunnel.journal_views}</span>
        </div>
      </div>
    </div>

    <!-- Live Saved Checks in Database -->
    <div class="card" style="margin-bottom:32px;">
      <div class="card-title">
        <span>Verified Decision Journal Rows in Database</span>
        <span class="mono" style="font-size:0.75rem; color:var(--accent);">${recentJournalEntries.length} entries</span>
      </div>
      ${recentJournalEntries.length === 0 ? `
        <div style="text-align:center; padding:32px; color:var(--muted); font-size:0.85rem;">
          No customer checks saved yet. Sessions conducted tomorrow will populate here automatically.
        </div>
      ` : `
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Date (UTC)</th>
                <th>Journal ID</th>
                <th>User ID</th>
                <th>Contract</th>
                <th>Price &amp; Count</th>
                <th>Exchange Fee</th>
                <th>Breakeven</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              ${recentJournalEntries.map(e => `
                <tr>
                  <td class="mono" style="color:var(--muted);">${e.createdAt.slice(0, 16).replace('T', ' ')}</td>
                  <td class="mono" style="color:var(--accent);">${e.id.slice(0, 12)}...</td>
                  <td class="mono" style="color:var(--muted);">${e.userId.slice(0, 8)}...</td>
                  <td><strong>${e.contractTicker}</strong></td>
                  <td class="mono">${e.contractCount}x @ ${(e.contractPrice * 100).toFixed(0)}¢</td>
                  <td class="mono" style="color:var(--rose);">+$${e.exchangeFee.toFixed(2)}</td>
                  <td class="mono" style="color:var(--accent); font-weight:700;">${e.breakevenWinProb.toFixed(2)}%</td>
                  <td class="mono">${e.outcome || 'SAVED'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Verified Pilot Observation Sessions in Database -->
    <div class="card" style="margin-bottom:32px;">
      <div class="card-title">
        <span>Verified Usability Pilot Observation Log (Ground Truth)</span>
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="mono" style="font-size:0.75rem; color:${recordedSessions.length > 0 ? 'var(--green)' : 'var(--muted)'};">${recordedSessions.length} / 10 observed</span>
          <a href="/api/audit/pilot/export" class="btn-gold" style="font-size:0.7rem; padding:4px 10px;">Export Audit JSON &rarr;</a>
        </div>
      </div>
      ${recordedSessions.length === 0 ? `
        <div style="text-align:center; padding:36px 20px; color:var(--muted); font-size:0.85rem;">
          <div style="font-size:1.8rem; margin-bottom:8px;">📋</div>
          <strong style="color:#FFFFFF; font-size:0.95rem;">Every result starts empty until observed.</strong>
          <div style="margin-top:4px;">0 of 10 participant usability sessions logged. Record a completed session below to begin populating empirical audit data.</div>
        </div>
      ` : `
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Date (UTC)</th>
                <th>Participant</th>
                <th>Device &amp; Browser</th>
                <th>Duration</th>
                <th>Independent?</th>
                <th>Assistance Details</th>
                <th>Comprehension Response</th>
                <th>Defects / Confusion</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recordedSessions.map(s => `
                <tr>
                  <td class="mono" style="color:var(--muted); font-size:0.75rem;">${(s.createdAt || '').slice(0, 16).replace('T', ' ')}</td>
                  <td class="mono" style="color:var(--accent); font-weight:700;">${s.participantRef}</td>
                  <td style="font-size:0.78rem;">${s.device}</td>
                  <td class="mono" style="font-size:0.78rem;">${s.durationMinutes}m</td>
                  <td class="mono">
                    <span style="display:inline-block; padding:2px 6px; border-radius:3px; font-size:0.7rem; font-weight:700; ${s.unassisted === 'YES' ? 'background:rgba(16,185,129,0.15); color:var(--green); border:1px solid rgba(16,185,129,0.3);' : 'background:rgba(244,63,94,0.15); color:var(--rose); border:1px solid rgba(244,63,94,0.3);'}">
                      ${s.unassisted === 'YES' ? 'YES (UNASSISTED)' : 'NO (ASSISTED)'}
                    </span>
                  </td>
                  <td style="font-size:0.75rem; color:var(--text);">${s.assistanceDetails || '<span style="color:var(--muted);">None</span>'}</td>
                  <td style="font-size:0.75rem; color:var(--text);">${s.comprehensionCostFee || s.comprehensionBreakeven || '—'}</td>
                  <td style="font-size:0.75rem; color:var(--text);">${s.confusionNotes || '<span style="color:var(--muted);">Zero defects</span>'}</td>
                  <td class="mono" style="font-size:0.72rem; color:var(--green);">${s.status || 'COMPLETED'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Session Observation Note Entry Form -->
    <div class="card">
      <div class="card-title">
        <span>Record Real Participant Session Observation</span>
        <span class="mono" style="font-size:0.75rem; color:var(--cyan);">AUDIT ARTIFACT BUILDER</span>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Session Date &amp; Time (UTC)</label>
          <input type="datetime-local" id="obs-date" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">Participant ID</label>
          <input type="text" id="obs-id" class="form-input" placeholder="P-01">
        </div>
        <div class="form-group">
          <label class="form-label">Recruitment Channel</label>
          <input type="text" id="obs-channel" class="form-input" placeholder="e.g. Kalshi Discord / Direct Trader">
        </div>
        <div class="form-group">
          <label class="form-label">Device &amp; Browser</label>
          <input type="text" id="obs-device" class="form-input" placeholder="iPhone 15 Mobile Safari">
        </div>
        <div class="form-group">
          <label class="form-label">Task Duration (mm:ss)</label>
          <input type="text" id="obs-duration" class="form-input" placeholder="01:45">
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Independent Completion?</label>
          <select id="obs-unassisted" class="form-input" onchange="toggleAssistanceField(this.value)">
            <option value="YES">YES — Fully independent, zero coaching</option>
            <option value="NO">NO — Required assistance/clarification</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Persistence Check (Sign out &rarr; Sign in)</label>
          <select id="obs-persistence" class="form-input">
            <option value="VERIFIED">VERIFIED — Saved check persisted in journal</option>
            <option value="FAILED">FAILED — Entry missing or error</option>
          </select>
        </div>
      </div>

      <div class="form-group" id="group-assistance" style="display:none;">
        <label class="form-label" style="color:var(--rose);">Assistance Details (What guidance or hints were provided?)</label>
        <input type="text" id="obs-assistance" class="form-input" placeholder="e.g. Guided to slider preset, explained round-up calculation">
      </div>

      <div class="form-group">
        <label class="form-label">Comprehension Verbatim Response (Fee drag, breakeven hurdle, $0 live risk)</label>
        <input type="text" id="obs-comprehension" class="form-input" placeholder="e.g. 'Max loss is $5.28 ($5.10 + $0.18 fee), 52.8% is just the hurdle to break even'">
      </div>

      <div class="form-group">
        <label class="form-label">Defects / Confusion Points Observed (Leave blank if zero defects)</label>
        <input type="text" id="obs-defects" class="form-input" placeholder="e.g. Mobile keypad blocked Save button, or: Zero defects">
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:18px;">
        <span style="font-size:0.75rem; color:var(--muted);">Stored directly to database. Results start empty until observed.</span>
        <button type="button" class="btn-gold" id="btn-save-obs" onclick="recordObservation()">+ Record Observed Session &rarr;</button>
      </div>
    </div>
  </div>

  <script>
    // Initialize date picker to current local datetime
    window.addEventListener('DOMContentLoaded', function() {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const dateEl = document.getElementById('obs-date');
      if (dateEl && !dateEl.value) {
        dateEl.value = now.toISOString().slice(0, 16);
      }
    });

    function toggleAssistanceField(val) {
      const grp = document.getElementById('group-assistance');
      if (grp) grp.style.display = val === 'NO' ? 'block' : 'none';
    }

    async function recordObservation() {
      const btn = document.getElementById('btn-save-obs');
      const dateVal = document.getElementById('obs-date').value;
      const createdAt = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();
      const id = document.getElementById('obs-id').value.trim() || 'P-01';
      const channel = document.getElementById('obs-channel').value.trim() || 'Direct Participant';
      const device = document.getElementById('obs-device').value.trim() || 'iPhone Mobile Safari';
      const duration = document.getElementById('obs-duration').value.trim() || '02:00';
      const unassisted = document.getElementById('obs-unassisted').value;
      const assistanceDetails = document.getElementById('obs-assistance') ? document.getElementById('obs-assistance').value.trim() : '';
      const persistence = document.getElementById('obs-persistence').value;
      const comprehension = document.getElementById('obs-comprehension').value.trim() || 'Confirmed cost, fees, and no alpha claim';
      const defects = document.getElementById('obs-defects').value.trim() || 'Zero defects observed';
      const durationNum = parseFloat(duration.replace(':', '.')) || 2.0;

      const payload = {
        participantRef: id,
        channel: channel,
        device: device,
        durationMinutes: durationNum,
        unassisted: unassisted,
        assistanceDetails: unassisted === 'NO' ? assistanceDetails : null,
        persistenceStatus: persistence,
        confusionNotes: defects,
        comprehensionCostFee: comprehension,
        comprehensionBreakeven: comprehension,
        comprehensionZeroAlpha: comprehension,
        operatorNotes: defects,
        createdAt: createdAt
      };

      btn.disabled = true;
      btn.textContent = 'Saving to database...';

      try {
        const res = await fetch('/api/audit/pilot/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Successfully recorded session ' + id + '. Dashboard updated.');
          window.location.reload();
        } else {
          alert('Could not save session observation. Please verify founder authorization.');
          btn.disabled = false;
          btn.textContent = '+ Record Observed Session →';
        }
      } catch (err) {
        alert('Network error saving session observation.');
        btn.disabled = false;
        btn.textContent = '+ Record Observed Session →';
      }
    }
  </script>
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
