/**
 * QuanterraOS Consent-Based Beta Booking Flow (/beta/book)
 *
 * Allows prospective pilot participants to request a 15-minute 1-on-1 observation session.
 * Captures contact, device type, availability, and explicit informed consent.
 * Advances participant to "INTERESTED" state with zero automatic completion claims.
 */

import { renderBetaFeedbackWidgetHtml } from "./feedback-widget.ts";

export function renderBetaBookingPageHtml(error?: string, success?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <title>Request 15-Minute Usability Pilot Session — QuanterraOS</title>
  <meta name="description" content="Request a 15-minute 1-on-1 observation session to test pre-trade cost and journal tools with the QuanterraOS founder.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --card: #0E121B;
      --card-border: rgba(212, 175, 55, 0.25);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --text: #E2E8F0;
      --text-dim: #94A3B8;
      --muted: #64748B;
      --green: #10B981;
      --rose: #F43F5E;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
    }

    nav {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(6, 7, 10, 0.95);
      backdrop-filter: blur(10px);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .brand-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
    }
    .nav-links {
      display: flex;
      gap: 16px;
      align-items: center;
      font-size: 0.85rem;
    }
    .nav-links a {
      color: var(--text-dim);
      text-decoration: none;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: #FFFFFF; }

    .container {
      max-width: 680px;
      margin: 40px auto 60px;
      padding: 0 20px;
      width: 100%;
    }

    .booking-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 32px 28px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
    }

    .badge-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }

    h1 {
      font-size: 1.6rem;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }

    .desc {
      color: var(--text-dim);
      font-size: 0.88rem;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 0.78rem;
      font-family: var(--font-mono);
      color: var(--accent-light);
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      background: rgba(6, 9, 14, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      padding: 10px 14px;
      color: #FFFFFF;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--accent);
    }

    .consent-box {
      background: rgba(223, 184, 67, 0.06);
      border: 1px solid rgba(223, 184, 67, 0.25);
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .consent-checkbox {
      margin-top: 3px;
      accent-color: var(--accent);
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .consent-label {
      font-size: 0.8rem;
      color: var(--text);
      line-height: 1.4;
      cursor: pointer;
    }

    .btn-submit {
      width: 100%;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      color: #07080B;
      font-weight: 800;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      padding: 14px;
      border: 1px solid #DFB843;
      border-radius: 6px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      transition: opacity 0.2s;
    }
    .btn-submit:hover { opacity: 0.95; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .status-notice {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      padding: 14px;
      color: var(--green);
      font-size: 0.85rem;
      margin-bottom: 20px;
    }
    .status-error {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: 6px;
      padding: 14px;
      color: var(--rose);
      font-size: 0.85rem;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <nav>
    <a href="/" class="brand"><span class="brand-dot"></span> quanterraos</a>
    <div class="nav-links">
      <a href="/calculator">Check</a>
      <a href="/journal">Journal</a>
      <a href="/review">Review</a>
      <a href="/learn">Learn</a>
      <a href="/access">Sign in</a>
    </div>
  </nav>

  <main class="container">
    ${success ? `<div class="status-notice">✓ ${success}</div>` : ""}
    ${error ? `<div class="status-error">⚠️ ${error}</div>` : ""}

    <div class="booking-card">
      <div class="badge-eyebrow">
        <span>⚡</span> 15-Minute Usability Pilot Observation
      </div>
      <h1>Request a 1-on-1 Usability Session</h1>
      <p class="desc">
        Help shape QuanterraOS by participating in an uncoached 15-minute usability session with the founder.
        You will test the pre-trade True-Cost check and personal decision journal on your actual device.
        <strong>Zero live capital, $0 exposure, zero passwords or keys requested.</strong>
      </p>

      <form id="pilot-booking-form" onsubmit="handleBookingSubmit(event)">
        <div class="form-group">
          <label class="form-label" for="book-contact">Your Contact (Email or Phone)</label>
          <input type="text" id="book-contact" class="form-input" placeholder="e.g. trader@example.com or +13125550199" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="book-device">Device &amp; Primary Browser</label>
          <select id="book-device" class="form-select" required>
            <option value="iPhone (iOS Safari)" selected>iPhone (iOS Safari)</option>
            <option value="Android (Chrome)">Android (Chrome)</option>
            <option value="Mac (Safari)">Mac (Safari)</option>
            <option value="Mac (Chrome)">Mac (Chrome)</option>
            <option value="Windows (Chrome / Edge)">Windows (Chrome / Edge)</option>
            <option value="Linux / Other">Linux / Other</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="book-availability">Your Availability</label>
          <input type="text" id="book-availability" class="form-input" placeholder="e.g. Weekday mornings 9-11 AM ET, or weekends anytime" required>
        </div>

        <div class="consent-box">
          <input type="checkbox" id="book-consent" class="consent-checkbox" required>
          <label class="consent-label" for="book-consent">
            <strong>Informed Consent:</strong> I agree to participate in a 15-minute 1-on-1 observation session.
            I understand QuanterraOS will observe task completion and interface comprehension to improve usability.
            No private passwords, recovery phrases, or financial account keys will ever be requested.
          </label>
        </div>

        <button type="submit" id="btn-submit-booking" class="btn-submit">
          Request Session (Advances to: Interested) &rarr;
        </button>
      </form>

      <div id="booking-confirmation" style="display:none; margin-top:20px; background:rgba(6,9,14,0.9); border:1px solid var(--card-border); border-radius:6px; padding:20px; text-align:center;">
        <div style="font-size:2rem; margin-bottom:8px;">📬</div>
        <h3 style="color:#FFFFFF; margin-bottom:6px;">Booking Request Logged</h3>
        <p style="font-size:0.85rem; color:var(--text-dim); margin-bottom:12px;">
          Your request is logged in the observation pipeline with status: <strong style="color:var(--accent);">INTERESTED</strong>.
        </p>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--muted); background:rgba(0,0,0,0.4); padding:8px; border-radius:4px; margin-bottom:14px;">
          Founder status: Interested &rarr; Scheduled &rarr; Observed (Strict zero-automatic claims)
        </div>
        <a href="/calculator" style="color:var(--accent); text-decoration:none; font-size:0.82rem; font-weight:700;">
          &larr; Return to True-Cost Calculator
        </a>
      </div>
    </div>
  </main>

  <script>
    async function handleBookingSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-booking');
      const contact = document.getElementById('book-contact').value.trim();
      const deviceType = document.getElementById('book-device').value;
      const availability = document.getElementById('book-availability').value.trim();
      const consentGiven = document.getElementById('book-consent').checked;

      if (!contact || !availability || !consentGiven) {
        alert('Please fill out all fields and provide informed consent.');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Submitting Request...';

      try {
        const res = await fetch('/api/pilot/booking-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact: contact,
            deviceType: deviceType,
            availability: availability,
            consentGiven: consentGiven
          })
        });

        const data = await res.json();
        if (data.success) {
          document.getElementById('pilot-booking-form').style.display = 'none';
          document.getElementById('booking-confirmation').style.display = 'block';
        } else {
          alert('Error submitting request: ' + (data.error || 'Please try again.'));
          btn.disabled = false;
          btn.textContent = 'Request Session (Advances to: Interested) →';
        }
      } catch (err) {
        alert('Network error submitting request. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Request Session (Advances to: Interested) →';
      }
    }
  </script>

  ${renderBetaFeedbackWidgetHtml()}
</body>
</html>`;
}
