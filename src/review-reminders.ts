/**
 * QuanterraOS Review Reminders & Notification Preferences Module
 * 
 * Implements Days 8–11 of the 90-Day Sprint:
 * - Incomplete journal entry reminders (prompting users to record post-settlement reconciliation or missing thesis)
 * - Weekly trading discipline and calibration digest reminders
 * - User notification preferences (in-app banner, browser notification, email)
 * - 1-click easy disabling and opt-out
 */

export interface ReviewReminderPreferences {
  userId: string;
  incompleteEntriesReminder: boolean;
  weeklyReviewReminder: boolean;
  channel: "in_app" | "browser" | "email";
  email: string | null;
  enabled: boolean;
  updatedAt: string;
}

const DEFAULT_PREFERENCES: Omit<ReviewReminderPreferences, "userId" | "updatedAt"> = {
  incompleteEntriesReminder: true,
  weeklyReviewReminder: true,
  channel: "in_app",
  email: null,
  enabled: true,
};

// In-memory / local storage backing with fallback for anonymous / guest sessions
const remindersStore = new Map<string, ReviewReminderPreferences>();

export function getReviewReminders(userId: string = "anonymous"): ReviewReminderPreferences {
  const existing = remindersStore.get(userId);
  if (existing) {
    return { ...existing };
  }
  const defaultPrefs: ReviewReminderPreferences = {
    userId,
    ...DEFAULT_PREFERENCES,
    updatedAt: new Date().toISOString()
  };
  remindersStore.set(userId, defaultPrefs);
  return defaultPrefs;
}

export function updateReviewReminders(
  userId: string = "anonymous",
  updates: Partial<Omit<ReviewReminderPreferences, "userId" | "updatedAt">>
): ReviewReminderPreferences {
  const current = getReviewReminders(userId);
  const updated: ReviewReminderPreferences = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  remindersStore.set(userId, updated);
  return updated;
}

export function disableAllReviewReminders(userId: string = "anonymous"): ReviewReminderPreferences {
  return updateReviewReminders(userId, { enabled: false });
}

export function renderReviewRemindersHtml(prefs: ReviewReminderPreferences): string {
  const isEnabled = prefs.enabled;
  return `
  <div class="reminders-card" id="reminders-settings-card" style="background: rgba(14, 20, 30, 0.75); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 24px; margin-top: 24px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
      <div>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent); text-transform:uppercase; letter-spacing:0.06em;">Notification Preferences</div>
        <h3 style="font-size:1.1rem; font-weight:700; color:#FFFFFF; margin-top:2px;">Review &amp; Journal Reminders</h3>
      </div>
      <div>
        <span class="status-badge ${isEnabled ? 'badge-active' : 'badge-disabled'}" id="reminders-status-badge" style="font-family:var(--font-mono); font-size:0.72rem; padding:4px 10px; border-radius:4px; font-weight:700; ${isEnabled ? 'background:rgba(16,185,129,0.15); color:#10B981; border:1px solid rgba(16,185,129,0.3);' : 'background:rgba(148,163,184,0.12); color:#94A3B8; border:1px solid rgba(148,163,184,0.3);'}">
          ${isEnabled ? '● REMINDERS ACTIVE' : '○ REMINDERS DISABLED'}
        </span>
      </div>
    </div>

    <p style="font-size:0.86rem; color:var(--muted); line-height:1.5; margin-bottom:20px;">
      Maintain systematic discipline. QuanterraOS can notify you when settled contracts need reconciliation or when your weekly calibration summary is ready for audit.
    </p>

    <form id="reminders-form" onsubmit="event.preventDefault(); saveRemindersPreferences();" style="display:flex; flex-direction:column; gap:16px;">
      <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer;">
        <input type="checkbox" id="pref-incomplete" ${prefs.incompleteEntriesReminder && isEnabled ? 'checked' : ''} style="margin-top:4px; accent-color:var(--accent); width:16px; height:16px;">
        <div>
          <strong style="color:var(--text); font-size:0.88rem; display:block;">Incomplete Journal Entry Alerts</strong>
          <span style="color:var(--muted); font-size:0.8rem;">Prompt for post-settlement reconciliation when a contract settles without recorded notes or actual result.</span>
        </div>
      </label>

      <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer;">
        <input type="checkbox" id="pref-weekly" ${prefs.weeklyReviewReminder && isEnabled ? 'checked' : ''} style="margin-top:4px; accent-color:var(--accent); width:16px; height:16px;">
        <div>
          <strong style="color:var(--text); font-size:0.88rem; display:block;">Weekly Trading Discipline Digest</strong>
          <span style="color:var(--muted); font-size:0.8rem;">A Sunday evening review comparing your stated win probability vs realized Brier calibration score.</span>
        </div>
      </label>

      <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:16px; margin-top:4px;">
        <label style="display:block; font-size:0.8rem; font-family:var(--font-mono); color:var(--accent-light); margin-bottom:8px;">DELIVERY METHOD</label>
        <div style="display:flex; gap:18px; flex-wrap:wrap;">
          <label style="display:flex; align-items:center; gap:8px; font-size:0.84rem; color:var(--text); cursor:pointer;">
            <input type="radio" name="pref-channel" value="in_app" ${prefs.channel === 'in_app' ? 'checked' : ''} style="accent-color:var(--accent);"> In-App Banner
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:0.84rem; color:var(--text); cursor:pointer;">
            <input type="radio" name="pref-channel" value="browser" ${prefs.channel === 'browser' ? 'checked' : ''} style="accent-color:var(--accent);"> Browser Notification
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:0.84rem; color:var(--text); cursor:pointer;">
            <input type="radio" name="pref-channel" value="email" ${prefs.channel === 'email' ? 'checked' : ''} style="accent-color:var(--accent);"> Email Summary
          </label>
        </div>
      </div>

      <div style="display:flex; gap:12px; margin-top:10px; flex-wrap:wrap; align-items:center;">
        <button type="submit" class="btn-primary" style="padding:8px 18px; font-size:0.82rem; font-weight:700; background:linear-gradient(180deg, #FBF4DC 0%, #DFB843 100%); color:#06070A; border:1px solid #DFB843; border-radius:4px; cursor:pointer;">
          Save Notification Preferences
        </button>
        <button type="button" onclick="disableReminders()" class="btn-secondary" style="padding:8px 14px; font-size:0.82rem; background:rgba(255,255,255,0.05); color:var(--muted); border:1px solid rgba(255,255,255,0.15); border-radius:4px; cursor:pointer;">
          Disable All Reminders
        </button>
        <span id="reminders-feedback" style="font-family:var(--font-mono); font-size:0.75rem; color:#10B981; display:none;">✓ Preferences saved</span>
      </div>
    </form>
  </div>

  <script>
  async function saveRemindersPreferences() {
    const inc = document.getElementById('pref-incomplete') ? document.getElementById('pref-incomplete').checked : false;
    const weekly = document.getElementById('pref-weekly') ? document.getElementById('pref-weekly').checked : false;
    const channelEl = document.querySelector('input[name="pref-channel"]:checked');
    const channel = channelEl ? channelEl.value : 'in_app';

    try {
      const res = await fetch('/api/account/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incompleteEntriesReminder: inc,
          weeklyReviewReminder: weekly,
          channel: channel,
          enabled: true
        })
      });
      if (res.ok) {
        showRemindersFeedback('✓ Notification preferences updated');
        const badge = document.getElementById('reminders-status-badge');
        if (badge) {
          badge.textContent = '● REMINDERS ACTIVE';
          badge.style.background = 'rgba(16,185,129,0.15)';
          badge.style.color = '#10B981';
          badge.style.borderColor = 'rgba(16,185,129,0.3)';
        }
      }
    } catch (_e) {
      showRemindersFeedback('Error saving preferences', true);
    }
  }

  async function disableReminders() {
    try {
      const res = await fetch('/api/account/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false })
      });
      if (res.ok) {
        const inc = document.getElementById('pref-incomplete');
        const weekly = document.getElementById('pref-weekly');
        if (inc) inc.checked = false;
        if (weekly) weekly.checked = false;
        showRemindersFeedback('Reminders disabled');
        const badge = document.getElementById('reminders-status-badge');
        if (badge) {
          badge.textContent = '○ REMINDERS DISABLED';
          badge.style.background = 'rgba(148,163,184,0.12)';
          badge.style.color = '#94A3B8';
          badge.style.borderColor = 'rgba(148,163,184,0.3)';
        }
      }
    } catch (_e) {
      showRemindersFeedback('Error disabling reminders', true);
    }
  }

  function showRemindersFeedback(msg, isErr) {
    const el = document.getElementById('reminders-feedback');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isErr ? '#F43F5E' : '#10B981';
    el.style.display = 'inline-block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
  }
  </script>
  `;
}
