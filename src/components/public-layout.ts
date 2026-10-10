/**
 * QuanterraOS Flagship Public Layout (Flight Deck Mode)
 *
 * Requirements:
 * - Clean, minimal Flight-grade aesthetic: pure obsidian, full-bleed panels, <=6 nav items.
 * - Public top nav: Check · Radar · Journal · Crew · Learn · Pricing · [Sign in] · [Get my receipt]
 * - Mobile: Full-screen menu containing same items + persistent bottom "Get my receipt" bar.
 * - Global footer: Part 7 disclaimer, responsible-trading notices, research/institutional links, and unified sitemap.
 */

export interface PublicLayoutOptions {
  activePath?: string;
  user?: { email?: string; tier?: string } | null;
  includeAssistant?: boolean;
}

export const PUBLIC_NAV_ITEMS = [
  { label: "Check", href: "/check" },
  { label: "Radar", href: "/radar" },
  { label: "Journal", href: "/journal" },
  { label: "Gear", href: "/merchandise" },
  { label: "Learn", href: "/learn" },
  { label: "Pricing", href: "/pricing" },
] as const;

export const PUBLIC_LAYOUT_CSS = `
  /* --- QuanterraOS Flight Deck Global Design Tokens --- */
  :root {
    --public-bg: #080B18;
    --public-card-bg: rgba(18, 23, 43, 0.85);
    --public-surface: #12172B;
    --public-fg: #F4F5FF;
    --public-muted: #AFB6CE;
    --public-border: rgba(175, 182, 206, 0.15);
    --public-border-purple: rgba(148, 104, 255, 0.4);
    --public-accent-purple: #9468FF;
    --public-accent-cyan: #59DDEC;
    --public-accent-gold: #C9A24A;
    --public-accent-yes: #86F94A;
    --public-accent-no: #FF55C8;
    --public-font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --public-font-mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;
  }

  /* Sticky Flight Minimal Nav */
  .flight-header {
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    background: rgba(8, 11, 24, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--public-border);
    transition: background 0.3s ease, border-color 0.3s ease;
  }

  .flight-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .flight-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--public-font-sans);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #F4F5FF;
    text-decoration: none;
    cursor: pointer;
  }

  .flight-brand-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--public-accent-purple);
    box-shadow: 0 0 10px var(--public-accent-purple);
  }

  .flight-nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .flight-nav-link {
    font-family: var(--public-font-sans);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--public-muted);
    text-decoration: none;
    transition: color 0.15s ease;
    padding: 6px 0;
    position: relative;
  }

  .flight-nav-link:hover {
    color: #FFFFFF;
  }

  .flight-nav-link.active {
    color: #FFFFFF;
    font-weight: 600;
  }

  .flight-nav-link.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--public-accent-purple);
  }

  .flight-nav-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .flight-btn-signin {
    font-family: var(--public-font-sans);
    font-size: 0.88rem;
    font-weight: 500;
    color: #E2E8F0;
    text-decoration: none;
    padding: 8px 14px;
    border-radius: 6px;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .flight-btn-signin:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.05);
  }

  .flight-btn-freecheck {
    font-family: var(--public-font-sans);
    font-size: 0.88rem;
    font-weight: 600;
    color: #080B18;
    background: #FFFFFF;
    text-decoration: none;
    padding: 8px 18px;
    border-radius: 20px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 10px rgba(148, 104, 255, 0.2);
    white-space: nowrap;
  }

  .flight-btn-freecheck:hover {
    background: var(--public-accent-purple);
    color: #FFFFFF;
    box-shadow: 0 4px 18px rgba(148, 104, 255, 0.4);
    transform: translateY(-1px);
  }

  /* Hamburger Button */
  .flight-hamburger {
    display: none;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px;
    color: #FFFFFF;
  }

  .flight-hamburger svg {
    width: 24px;
    height: 24px;
    stroke: currentColor;
  }

  /* Full Screen Mobile Menu */
  .flight-mobile-menu {
    display: none;
    position: fixed;
    top: 64px;
    left: 0;
    width: 100%;
    height: calc(100vh - 64px);
    background: rgba(8, 11, 24, 0.98);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    z-index: 999;
    flex-direction: column;
    padding: 32px 24px;
    overflow-y: auto;
  }

  .flight-mobile-menu.open {
    display: flex;
  }

  .flight-mobile-menu-links {
    display: flex;
    flex-direction: column;
    gap: 20px;
    list-style: none;
    margin: 0 0 32px 0;
    padding: 0;
  }

  .flight-mobile-nav-link {
    font-size: 1.35rem;
    font-weight: 600;
    color: #E2E8F0;
    text-decoration: none;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .flight-mobile-nav-link.active {
    color: var(--public-accent-purple);
  }

  .flight-mobile-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Persistent Mobile Bottom Action Bar */
  .flight-mobile-bottom-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 950;
    padding: 12px 16px;
    background: rgba(8, 11, 24, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--public-border);
    box-sizing: border-box;
  }

  .flight-mobile-bottom-btn {
    display: block;
    width: 100%;
    text-align: center;
    background: var(--public-accent-purple);
    color: #FFFFFF;
    font-weight: 700;
    font-size: 0.95rem;
    text-decoration: none;
    padding: 14px 20px;
    border-radius: 28px;
    box-shadow: 0 4px 16px rgba(148, 104, 255, 0.3);
    box-sizing: border-box;
  }

  /* Flight Footer */
  .flight-footer {
    background: #060812;
    border-top: 1px solid var(--public-border);
    color: var(--public-muted);
    font-family: var(--public-font-sans);
    padding: 64px 24px 96px;
  }

  .flight-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .flight-footer-grid {
    display: grid;
    grid-template-columns: 2fr repeat(3, 1fr);
    gap: 48px;
    margin-bottom: 48px;
  }

  .flight-footer-brand {
    font-size: 1.1rem;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 12px;
  }

  .flight-footer-tagline {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--public-muted);
    max-width: 380px;
    margin-bottom: 16px;
  }

  .flight-footer-col h4 {
    font-size: 0.8rem;
    font-family: var(--public-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #FFFFFF;
    margin-bottom: 16px;
  }

  .flight-footer-col ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .flight-footer-col a {
    color: var(--public-muted);
    font-size: 0.88rem;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .flight-footer-col a:hover {
    color: #FFFFFF;
  }

  .flight-footer-legal-box {
    border-top: 1px solid var(--public-border);
    padding-top: 28px;
    font-size: 0.78rem;
    line-height: 1.65;
    color: #94A3B8;
    margin-bottom: 24px;
  }

  .flight-footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    color: #94A3B8;
    flex-wrap: wrap;
    gap: 12px;
  }

  /* Accessibility & Focus-Visible Standards */
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid var(--public-accent-purple) !important;
    outline-offset: 2px !important;
  }

  /* Prefers Reduced Motion Standards */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  @media (max-width: 900px) {
    .flight-nav-links, .flight-nav-actions {
      display: none;
    }
    .flight-hamburger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      min-height: 44px;
    }
    .flight-mobile-bottom-bar {
      display: block;
    }
    .flight-footer-grid {
      grid-template-columns: 1fr;
      gap: 32px;
    }
  }
`;

/**
 * Renders the global, minimal Flight Deck header.
 */
export function renderPublicHeader(options: PublicLayoutOptions = {}): string {
  const activePath = options.activePath || "/";
  const user = options.user;

  const navLinksHtml = PUBLIC_NAV_ITEMS.map((item) => {
    const isActive = activePath === item.href || (activePath !== "/" && activePath.startsWith(item.href));
    return `<li><a href="${item.href}" class="flight-nav-link ${isActive ? 'active' : ''}">${item.label}</a></li>`;
  }).join("\n");

  const mobileNavLinksHtml = PUBLIC_NAV_ITEMS.map((item) => {
    const isActive = activePath === item.href || (activePath !== "/" && activePath.startsWith(item.href));
    return `<li><a href="${item.href}" class="flight-mobile-nav-link ${isActive ? 'active' : ''}">${item.label}</a></li>`;
  }).join("\n");

  const authActionHtml = user
    ? `<a href="/deck" class="flight-btn-signin">Flight Deck &rarr;</a>`
    : `<a href="/login" class="flight-btn-signin">Sign in</a>`;

  return `
  <header class="flight-header" id="main-header">
    <div class="flight-header-inner">
      <a href="/" class="flight-brand">
        <span class="flight-brand-dot"></span>
        <span>QuanterraOS</span>
      </a>

      <!-- Desktop Nav -->
      <nav aria-label="Main Navigation">
        <ul class="flight-nav-links">
          ${navLinksHtml}
        </ul>
      </nav>

      <!-- Desktop Actions -->
      <div class="flight-nav-actions">
        <a href="tel:18007826837" class="flight-btn-phone" title="Call 1-800-QUANTERRA to talk to a live assistant now" style="display:inline-flex; align-items:center; gap:6px; color:#DFB843; font-family:var(--public-font-mono); font-size:0.8rem; font-weight:700; text-decoration:none; padding:6px 12px; border-radius:6px; border:1px solid rgba(223,184,67,0.35); background:rgba(223,184,67,0.1); transition:all 0.2s ease;">
          <span>📞</span> <span>1-800-782-6837</span>
        </a>
        ${authActionHtml}
        <a href="/check" class="flight-btn-freecheck" id="nav-free-check-btn">Get my receipt</a>
      </div>

      <!-- Mobile Hamburger Button -->
      <button class="flight-hamburger" id="flight-hamburger-btn" aria-label="Toggle mobile menu" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Mobile Full-Screen Overlay Menu -->
    <div class="flight-mobile-menu" id="flight-mobile-menu">
      <ul class="flight-mobile-menu-links">
        ${mobileNavLinksHtml}
      </ul>
      <div class="flight-mobile-actions">
        <a href="tel:18007826837" class="flight-btn-phone" style="text-align:center; display:flex; justify-content:center; align-items:center; gap:8px; padding:12px; border-radius:8px; border:1px solid rgba(223,184,67,0.4); background:rgba(223,184,67,0.12); color:#DFB843; text-decoration:none; font-family:var(--public-font-mono); font-weight:700; font-size:0.88rem;">📞 Call 1-800-QUANTERRA (Live Assistant)</a>
        ${user ? `<a href="/deck" class="flight-btn-freecheck" style="text-align:center;">Launch Flight Deck</a>` : `<a href="/login" class="flight-btn-signin" style="text-align:center; border:1px solid rgba(255,255,255,0.15);">Sign in</a>`}
        <a href="/check" class="flight-btn-freecheck" style="text-align:center; background:var(--public-accent-purple); color:#FFFFFF;">Get my receipt</a>
      </div>
    </div>
  </header>

  <!-- Persistent Mobile Bottom Bar -->
  <div class="flight-mobile-bottom-bar" id="mobile-sticky-action">
    <a href="/check" class="flight-mobile-bottom-btn">Get my receipt →</a>
  </div>

  <script>
    (function() {
      const btn = document.getElementById('flight-hamburger-btn');
      const menu = document.getElementById('flight-mobile-menu');
      if (btn && menu) {
        btn.addEventListener('click', function() {
          const isOpen = menu.classList.toggle('open');
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          btn.innerHTML = isOpen
            ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
        });
      }
    })();
  </script>
  `;
}

/**
 * Renders the global, Part 7 compliant Flight Deck footer.
 */
export function renderPublicFooter(): string {
  return `
  <footer class="flight-footer">
    <div class="flight-footer-inner">
      <div class="flight-footer-grid">
        <div class="flight-footer-about">
          <div class="flight-footer-brand">QuanterraOS</div>
          <p class="flight-footer-tagline">
            See the cost. Choose your side. Check fees, spreads and settlement rules before you decide.
          </p>
          <div style="font-size:0.75rem; color:#8A8F98; font-family:var(--public-font-mono);">
            Quantara Global LLC · Wilmington, DE
          </div>
        </div>

        <div class="flight-footer-col">
          <h4>Platform</h4>
          <ul>
            <li><a href="/check">True-Cost Check</a></li>
            <li><a href="/radar">Settlement Radar</a></li>
            <li><a href="/journal">Calibration Journal</a></li>
            <li><a href="/deck">Flight Deck Cockpit</a></li>
            <li><a href="/proof">Calibration Proof</a></li>
            <li><a href="/pricing">Pricing Plans</a></li>
          </ul>
        </div>

        <div class="flight-footer-col">
          <h4>Crew &amp; Cosmetics</h4>
          <ul>
            <li><a href="/crew">Flight Deck Crew</a></li>
            <li><a href="/pass">Free Crew Pass</a></li>
            <li><a href="/art-gallery">Artwork Gallery</a></li>
            <li><a href="/merchandise">Mascot Gear &amp; Suits</a></li>
            <li><a href="/research">Research</a></li>
            <li><a href="/access">Institutional</a></li>
            <li><a href="/developers">Developers API &amp; MCP</a></li>
          </ul>
        </div>

        <div class="flight-footer-col">
          <h4>Flight School</h4>
          <ul>
            <li><a href="/learn">Flight School &amp; Glossary</a></li>
            <li><a href="/news">Mission Brief Digest</a></li>
            <li><a href="/changelog">Changelog</a></li>
            <li><a href="/help">Help &amp; Support</a></li>
            <li><a href="/status">System Ingestion Status</a></li>
            <li><a href="/legal">Legal &amp; Risk Disclosure</a></li>
          </ul>
        </div>
      </div>

      <!-- Verbatim Part 7 Compliance Footer -->
      <div class="flight-footer-legal-box">
        QuanterraOS is an independent analytics tool by Quantara Global LLC. We don't place trades, hold funds, or give investment advice. Calculations use public data and published fee schedules and may be delayed or wrong — verify with your exchange. Prediction-market trading can lose money. 18+. Kalshi, Polymarket, CME CF BRTI and other names are trademarks of their owners; we're not affiliated with them.
      </div>

      <div class="flight-footer-bottom">
        <div>&copy; 2026 Quantara Global LLC. All rights reserved. Rule B5 locked ($0.00 capital deployed).</div>
        <div style="display:flex; gap:16px;">
          <a href="/legal" style="color:#94A3B8; text-decoration:none;">Terms of Service</a>
          <a href="/legal#privacy" style="color:#94A3B8; text-decoration:none;">Privacy Policy</a>
          <a href="/status" style="color:#94A3B8; text-decoration:none;">Status</a>
        </div>
      </div>
    </div>
  </footer>
  `;
}
