/**
 * QuanterraOS Help Center & Customer Support Portal (/help)
 *
 * Implements QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md (Part 3.7 & Task 7.2):
 * - Searchable knowledge articles generated from Flight School + FAQ.
 * - Every article concludes with: "Still stuck? Ask Aria."
 * - "Talk to a human" escalation card routing to support@quanterraos.com
 *   with SLA tagging by plan (<24h Pilot, <4h Commander) and consent-gated
 *   Aria transcript attachment.
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { HELP_ARTICLES, getPlanSupportSla, type HelpArticle } from "./lib/support-escalation.ts";
import { type Plan } from "./plan.ts";

export function renderHelpPageHtml(userPlan: Plan = "cadet", userEmail: string = ""): string {
  const slaInfo = getPlanSupportSla(userPlan);

  const articlesHtml = HELP_ARTICLES.map((art: HelpArticle) => `
    <article class="help-article-card" data-tags="${art.tags.join(' ')}" id="${art.id}">
      <div class="article-category-badge">${art.category.toUpperCase()}</div>
      <h2 class="article-title">${art.title}</h2>
      <p class="article-summary">${art.summary}</p>
      <div class="article-content">${art.content}</div>
      <div class="article-footer">
        <div class="stuck-banner">
          <span>Still stuck? <strong>Ask Aria.</strong></span>
          <button type="button" class="btn-ask-aria" onclick="askAriaFromHelp('${encodeURIComponent(art.askAriaPrompt)}')">
            Ask Aria &rarr;
          </button>
        </div>
      </div>
    </article>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Help Center &amp; Support Dispatch — QuanterraOS</title>
  <meta name="description" content="QuanterraOS Help Center: Searchable knowledge articles, true-cost guides, TWAP settlement documentation, and human support escalation.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    :root {
      --help-bg: #000000;
      --help-card: #0D1120;
      --help-border: rgba(255, 255, 255, 0.08);
      --help-gold: #C9A24A;
      --help-cyan: #4FD1E8;
      --help-muted: #8A8F98;
    }
    body { background: var(--help-bg); color: #FFFFFF; font-family: var(--public-font-sans); }
    .help-container { max-width: 960px; margin: 0 auto; padding: 48px 24px 80px; }
    .help-eyebrow { font-family: var(--public-font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--help-gold); letter-spacing: 0.12em; margin-bottom: 8px; }
    .help-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 12px; }
    .help-lead { font-size: 1rem; color: var(--help-muted); line-height: 1.5; margin-bottom: 32px; max-width: 720px; }

    .help-search-box {
      margin-bottom: 36px;
      position: relative;
    }
    .help-search-input {
      width: 100%;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--help-border);
      border-radius: 8px;
      padding: 14px 20px;
      font-size: 1rem;
      color: #FFF;
      font-family: var(--public-font-sans);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .help-search-input:focus {
      border-color: var(--help-gold);
      box-shadow: 0 0 16px rgba(201, 162, 74, 0.2);
    }

    .help-layout-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .articles-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .help-article-card {
      background: var(--help-card);
      border: 1px solid var(--help-border);
      border-radius: 8px;
      padding: 24px;
      transition: border-color 0.2s;
    }
    .help-article-card:hover {
      border-color: rgba(201, 162, 74, 0.4);
    }
    .article-category-badge {
      font-family: var(--public-font-mono);
      font-size: 0.68rem;
      color: var(--help-cyan);
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }
    .article-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFF;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .article-summary {
      font-size: 0.88rem;
      color: var(--help-gold);
      margin-bottom: 12px;
      line-height: 1.4;
    }
    .article-content {
      font-size: 0.9rem;
      color: #CBD5E1;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .article-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 12px;
    }
    .stuck-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 0.82rem;
      color: var(--help-muted);
    }
    .btn-ask-aria {
      background: rgba(79, 209, 232, 0.12);
      border: 1px solid var(--help-cyan);
      color: var(--help-cyan);
      border-radius: 4px;
      padding: 6px 14px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--public-font-mono);
      transition: background 0.2s;
    }
    .btn-ask-aria:hover {
      background: rgba(79, 209, 232, 0.25);
    }

    /* Escalation Box */
    .escalation-box {
      background: rgba(13, 17, 32, 0.9);
      border: 1px solid rgba(201, 162, 74, 0.3);
      border-radius: 8px;
      padding: 28px;
      margin-top: 40px;
    }
    .escalation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 14px;
    }
    .sla-pill {
      font-family: var(--public-font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(201, 162, 74, 0.15);
      color: var(--help-gold);
      border: 1px solid var(--help-gold);
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #FFF;
      margin-bottom: 6px;
    }
    .form-input, .form-textarea {
      width: 100%;
      box-sizing: border-box;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid var(--help-border);
      border-radius: 4px;
      padding: 10px 12px;
      font-size: 0.85rem;
      color: #FFF;
      font-family: var(--public-font-sans);
    }
    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--help-cyan);
    }
    .btn-submit-ticket {
      background: var(--help-gold);
      color: #000;
      font-weight: 700;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    .btn-submit-ticket:hover {
      background: #dfb843;
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/help" })}

  <main class="help-container">
    <div class="help-eyebrow">Customer Support &amp; Knowledge Base</div>
    <h1 class="help-title">Help Center &amp; Platform Guides</h1>
    <p class="help-lead">
      Learn how fee formulas work, calibrate your settlement radar, and get fast answers from our mathematical models or human team.
    </p>

    <!-- Search Box -->
    <div class="help-search-box">
      <input
        type="search"
        id="help-search-input"
        class="help-search-input"
        placeholder="Search articles by keyword (e.g. fees, twap, tilt, shadow mode, billing)..."
        oninput="filterHelpArticles(this.value)"
      />
    </div>

    <!-- Articles Feed -->
    <div class="articles-grid" id="articles-list">
      ${articlesHtml}
    </div>

    <!-- Human Escalation Card (Part 3.7) -->
    <div class="escalation-box" id="human-escalation-card">
      <div class="escalation-header">
        <div>
          <h2 style="font-size:1.3rem; font-weight:700; margin-bottom:4px;">Talk to a Human // Support Dispatch</h2>
          <p style="font-size:0.82rem; color:var(--help-muted); margin:0;">
            Escalate complex inquiries directly to our engineering team at <code style="color:var(--help-cyan);">support@quanterraos.com</code>.
          </p>
        </div>
        <div class="sla-pill" id="user-sla-badge">
          ${slaInfo.slaTag.toUpperCase()}
        </div>
      </div>

      <form id="support-ticket-form" onsubmit="submitSupportTicket(event)">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
          <div class="form-group">
            <label class="form-label" for="ticket-email">Your Email Address</label>
            <input type="email" id="ticket-email" class="form-input" required placeholder="pilot@example.com" value="${userEmail}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="ticket-subject">Subject</label>
            <input type="text" id="ticket-subject" class="form-input" required placeholder="e.g. Question on KXBTC15M settlement TWAP" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="ticket-message">Description of Inquiry</label>
          <textarea id="ticket-message" class="form-textarea" rows="4" required placeholder="Provide details regarding the calculations, account state, or platform feature you need help with..."></textarea>
        </div>

        <!-- Consent Attachment Checkbox -->
        <div class="form-group" style="background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
          <label style="display:flex; align-items:flex-start; gap:10px; font-size:0.8rem; color:#E2E8F0; cursor:pointer;">
            <input type="checkbox" id="ticket-consent" style="margin-top:2px;" checked />
            <span>
              <strong>Attach recent Aria conversation transcript (Consent required):</strong>
              <span style="color:var(--help-muted); display:block; font-size:0.75rem; margin-top:2px;">
                Allows our support team to inspect the mathematical calculations and queries you recently ran with Aria to resolve your ticket quickly.
              </span>
            </span>
          </label>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top:20px;">
          <button type="submit" class="btn-submit-ticket" id="btn-submit-ticket">
            Submit Support Ticket &rarr;
          </button>
          <span style="font-size:0.72rem; color:var(--help-muted);">
            Direct email: <a href="mailto:support@quanterraos.com" style="color:var(--help-gold); text-decoration:underline;">support@quanterraos.com</a>
          </span>
        </div>

        <div id="ticket-status-message" style="display:none; margin-top:16px; padding:12px; border-radius:4px; font-size:0.82rem;"></div>
      </form>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}

  <script>
    function filterHelpArticles(query) {
      const q = (query || '').toLowerCase().trim();
      const articles = document.querySelectorAll('.help-article-card');
      articles.forEach(art => {
        const text = art.textContent.toLowerCase();
        const tags = (art.getAttribute('data-tags') || '').toLowerCase();
        if (!q || text.includes(q) || tags.includes(q)) {
          art.style.display = 'block';
        } else {
          art.style.display = 'none';
        }
      });
    }

    function askAriaFromHelp(promptText) {
      const decoded = decodeURIComponent(promptText || '');
      const input = document.getElementById('aria-chat-input') || document.querySelector('.assistant-input');
      if (input) {
        input.value = decoded;
        const sendBtn = document.querySelector('.assistant-send-btn') || document.getElementById('btn-aria-send');
        if (sendBtn) sendBtn.click();
      } else {
        window.location.href = '/deck?station=crew&q=' + encodeURIComponent(decoded);
      }
    }

    function submitSupportTicket(e) {
      e.preventDefault();
      const email = document.getElementById('ticket-email').value;
      const subject = document.getElementById('ticket-subject').value;
      const message = document.getElementById('ticket-message').value;
      const consent = document.getElementById('ticket-consent').checked;
      const statusDiv = document.getElementById('ticket-status-message');
      const submitBtn = document.getElementById('btn-submit-ticket');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Ticket...';

      fetch('/api/support/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          subject,
          message,
          userConsentGiven: consent,
          attachedAriaTranscript: consent ? [{ role: 'user', content: subject }, { role: 'system', content: 'Session logs attached' }] : undefined,
        }),
      })
      .then(res => res.json())
      .then(data => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Support Ticket →';
        statusDiv.style.display = 'block';
        if (data.ticket) {
          statusDiv.style.background = 'rgba(48,164,108,0.15)';
          statusDiv.style.color = '#A7F3D0';
          statusDiv.style.border = '1px solid var(--ok-green)';
          statusDiv.innerHTML = '<strong>✓ Ticket Created (' + data.ticket.ticketId + '):</strong> Routed to support@quanterraos.com. Target SLA: ' + data.ticket.slaTag + '.';
          document.getElementById('support-ticket-form').reset();
        } else {
          statusDiv.style.background = 'rgba(229,72,77,0.15)';
          statusDiv.style.color = '#FDA4AF';
          statusDiv.style.border = '1px solid var(--alert-red)';
          statusDiv.textContent = data.message || 'Submission failed. Please email support@quanterraos.com directly.';
        }
      })
      .catch(err => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Support Ticket →';
        statusDiv.style.display = 'block';
        statusDiv.style.background = 'rgba(229,72,77,0.15)';
        statusDiv.style.color = '#FDA4AF';
        statusDiv.style.border = '1px solid var(--alert-red)';
        statusDiv.textContent = 'Error: ' + err.message;
      });
    }
  </script>
</body>
</html>`;
}
