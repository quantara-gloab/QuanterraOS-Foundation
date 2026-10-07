/**
 * QuanterraOS Beta Feedback & Problem Reporter Component
 *
 * Implements a non-intrusive "Report a problem" trigger on consumer pages.
 * Strictly adheres to privacy and security requirements:
 * - Captures: current page URL, app version, non-identifying browser agent, and optional user comment.
 * - NEVER attaches credentials, cookies, tokens, or private financial details.
 */

export const BETA_APP_VERSION = "0.1.0-pilot";

export function renderBetaFeedbackWidgetHtml(): string {
  return `
  <!-- Beta Feedback Trigger Button -->
  <button type="button" id="btn-beta-feedback-trigger" onclick="openBetaFeedbackModal()" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 990;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(14, 18, 27, 0.92);
    border: 1px solid rgba(212, 175, 55, 0.35);
    color: #DFB843;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(12px);
    cursor: pointer;
    transition: all 0.2s ease;
  " onmouseover="this.style.borderColor='#DFB843'; this.style.transform='translateY(-1px)';" onmouseout="this.style.borderColor='rgba(212, 175, 55, 0.35)'; this.style.transform='none';">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    Report a problem
  </button>

  <!-- Beta Feedback Modal -->
  <div id="beta-feedback-modal" style="
    display: none;
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(4, 6, 10, 0.85);
    backdrop-filter: blur(8px);
    align-items: center;
    justify-content: center;
    padding: 16px;
  ">
    <div style="
      background: #0E121B;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 8px;
      max-width: 500px;
      width: 100%;
      padding: 24px;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.7);
      color: #F8FAFC;
      font-family: 'Inter', -apple-system, sans-serif;
    ">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(212, 175, 55, 0.15); padding-bottom:10px;">
        <div style="font-family:'IBM Plex Mono', monospace; font-size:0.85rem; font-weight:700; color:#DFB843; display:flex; align-items:center; gap:6px;">
          <span>💬</span> Report a Problem / Beta Feedback
        </div>
        <button type="button" onclick="closeBetaFeedbackModal()" style="background:none; border:none; color:#94A3B8; font-size:1.3rem; cursor:pointer;">&times;</button>
      </div>

      <p style="font-size:0.8rem; color:#94A3B8; margin-bottom:14px; line-height:1.45;">
        Encountered confusion, friction, or unexpected behavior? Let our engineering team know. Only the current page URL and app version are captured—<strong>no credentials, cookies, or financial details are ever attached</strong>.
      </p>

      <div style="margin-bottom:12px;">
        <label for="fb-category" style="display:block; font-size:0.75rem; color:#FFFFFF; margin-bottom:4px; font-weight:600;">Issue Category</label>
        <select id="fb-category" style="width:100%; background:#06080E; border:1px solid rgba(212,175,55,0.25); border-radius:4px; color:#F8FAFC; padding:8px 10px; font-size:0.8rem; font-family:'IBM Plex Mono', monospace;">
          <option value="friction">Friction / Confusing Button or Flow</option>
          <option value="calculation">Calculation / Number Disagreement</option>
          <option value="bug">Bug / Broken UI Element</option>
          <option value="general">General Improvement Idea</option>
        </select>
      </div>

      <div style="margin-bottom:12px;">
        <label for="fb-comment" style="display:block; font-size:0.75rem; color:#FFFFFF; margin-bottom:4px; font-weight:600;">What happened? (Optional details)</label>
        <textarea id="fb-comment" rows="3" placeholder="Describe what you were trying to do and what felt confusing or failed..." style="width:100%; background:#06080E; border:1px solid rgba(212,175,55,0.25); border-radius:4px; color:#F8FAFC; padding:8px 10px; font-size:0.8rem; font-family:'Inter', sans-serif; resize:none;"></textarea>
      </div>

      <div style="margin-bottom:16px;">
        <label for="fb-email" style="display:block; font-size:0.72rem; color:#94A3B8; margin-bottom:4px;">Contact Email (Optional, if you'd like a follow-up reply)</label>
        <input type="email" id="fb-email" placeholder="you@example.com" style="width:100%; background:#06080E; border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#F8FAFC; padding:6px 10px; font-size:0.78rem;">
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-family:'IBM Plex Mono', monospace; font-size:0.68rem; color:#64748B;">
          Page: <span id="fb-page-display">/</span> · v${BETA_APP_VERSION}
        </span>
        <div style="display:flex; gap:8px;">
          <button type="button" onclick="closeBetaFeedbackModal()" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#F8FAFC; padding:7px 12px; border-radius:4px; font-size:0.75rem; cursor:pointer;">
            Cancel
          </button>
          <button type="button" id="btn-submit-feedback" onclick="submitBetaFeedback()" style="background:linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%); border:1px solid #DFB843; color:#07080B; font-weight:700; padding:7px 14px; border-radius:4px; font-size:0.75rem; font-family:'IBM Plex Mono', monospace; cursor:pointer;">
            Submit Report
          </button>
        </div>
      </div>

      <div id="fb-status-msg" style="display:none; margin-top:12px; padding:8px 12px; border-radius:4px; font-size:0.75rem; font-family:'IBM Plex Mono', monospace;"></div>
    </div>
  </div>

  <script>
    function openBetaFeedbackModal() {
      const modal = document.getElementById('beta-feedback-modal');
      const pageDisplay = document.getElementById('fb-page-display');
      if (pageDisplay) pageDisplay.textContent = window.location.pathname;
      if (modal) modal.style.display = 'flex';
      const commentInput = document.getElementById('fb-comment');
      if (commentInput) commentInput.focus();
    }

    function closeBetaFeedbackModal() {
      const modal = document.getElementById('beta-feedback-modal');
      if (modal) modal.style.display = 'none';
    }

    function submitBetaFeedback() {
      const category = document.getElementById('fb-category').value;
      const comment = (document.getElementById('fb-comment').value || '').trim();
      const email = (document.getElementById('fb-email').value || '').trim();
      const submitBtn = document.getElementById('btn-submit-feedback');
      const statusMsg = document.getElementById('fb-status-msg');

      if (!comment && category === 'friction') {
        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.style.background = 'rgba(244,63,94,0.12)';
          statusMsg.style.border = '1px solid rgba(244,63,94,0.3)';
          statusMsg.style.color = '#F43F5E';
          statusMsg.textContent = 'Please enter a brief note about what felt confusing.';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      // Security check: Payload strictly contains only non-sensitive diagnostic info.
      const payload = {
        page: window.location.pathname + window.location.search,
        appVersion: '${BETA_APP_VERSION}',
        category: category,
        comment: comment || 'Reported via feedback button',
        contactEmail: email || null,
        deviceInfo: navigator.userAgent ? navigator.userAgent.slice(0, 180) : 'Unknown Browser'
      };

      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.style.background = 'rgba(16,185,129,0.15)';
          statusMsg.style.border = '1px solid rgba(16,185,129,0.4)';
          statusMsg.style.color = '#10B981';
          statusMsg.textContent = '✓ Thank you! Problem report logged for operator review.';
        }
        setTimeout(function() {
          closeBetaFeedbackModal();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Report';
          }
          if (document.getElementById('fb-comment')) document.getElementById('fb-comment').value = '';
          if (statusMsg) statusMsg.style.display = 'none';
        }, 1800);
      })
      .catch(function(err) {
        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.style.background = 'rgba(244,63,94,0.12)';
          statusMsg.style.border = '1px solid rgba(244,63,94,0.3)';
          statusMsg.style.color = '#F43F5E';
          statusMsg.textContent = 'Submission error. Please retry.';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Report';
        }
      });
    }
  </script>
  `;
}
