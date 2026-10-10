/**
 * QuanterraOS Flagship Public Layout (Tesla Mode)
 *
 * Implements Phase 3 Task 3.1:
 * "Global header/footer components; remove all per-page navs."
 *
 * Requirements (Parts 0.2, 2.1, 5, 7):
 * - Clean, minimal Tesla-grade aesthetic: pure obsidian, full-bleed panels, ≤6 nav items.
 * - Public top nav: QuanterraOS · Check · Radar · Flight Deck · Institutional · Pricing · [Sign in] · [Free Check]
 * - Mobile: Full-screen menu containing same items + persistent bottom "Free Check" bar.
 * - Global footer: Verbatim Part 7 disclaimer, responsible-trading notices, and unified sitemap.
 */

export interface PublicLayoutOptions {
  activePath?: string;
  user?: { email?: string; tier?: string } | null;
  includeAssistant?: boolean;
}

export const PUBLIC_NAV_ITEMS = [
  { label: "Check", href: "/check" },
  { label: "Radar", href: "/radar" },
  { label: "Flight Deck", href: "/deck" },
  { label: "Institutional", href: "/institutional" },
  { label: "Pricing", href: "/pricing" },
] as const;

export const PUBLIC_LAYOUT_CSS = `
  /* --- QuanterraOS Tesla-Mode Global Design Tokens --- */
  :root {
    --public-bg: #000000;
    --public-card-bg: rgba(18, 18, 20, 0.75);
    --public-fg: #FFFFFF;
    --public-muted: #8A8F98;
    --public-border: rgba(255, 255, 255, 0.09);
    --public-border-gold: rgba(201, 162, 74, 0.35);
    --public-accent-gold: #C9A24A;
    --public-accent-gold-glow: rgba(201, 162, 74, 0.2);
    --public-font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --public-font-mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;
  }

  /* Sticky Tesla Minimal Nav */
  .tesla-header {
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--public-border);
    transition: background 0.3s ease, border-color 0.3s ease;
  }

  .tesla-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tesla-brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--public-font-sans);
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #FFFFFF;
    text-decoration: none;
    cursor: pointer;
  }

  .tesla-brand-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--public-accent-gold);
    box-shadow: 0 0 10px var(--public-accent-gold);
  }

  .tesla-nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .tesla-nav-link {
    font-family: var(--public-font-sans);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--public-muted);
    text-decoration: none;
    transition: color 0.15s ease;
    padding: 6px 0;
    position: relative;
  }

  .tesla-nav-link:hover {
    color: #FFFFFF;
  }

  .tesla-nav-link.active {
    color: #FFFFFF;
    font-weight: 600;
  }

  .tesla-nav-link.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--public-accent-gold);
  }

  .tesla-nav-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tesla-btn-signin {
    font-family: var(--public-font-sans);
    font-size: 0.88rem;
    font-weight: 500;
    color: #E2E8F0;
    text-decoration: none;
    padding: 8px 14px;
    border-radius: 6px;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .tesla-btn-signin:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.05);
  }

  .tesla-btn-freecheck {
    font-family: var(--public-font-sans);
    font-size: 0.88rem;
    font-weight: 600;
    color: #000000;
    background: #FFFFFF;
    text-decoration: none;
    padding: 8px 18px;
    border-radius: 20px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 10px rgba(255, 255, 255, 0.15);
    white-space: nowrap;
  }

  .tesla-btn-freecheck:hover {
    background: var(--public-accent-gold);
    color: #000000;
    box-shadow: 0 4px 18px var(--public-accent-gold-glow);
    transform: translateY(-1px);
  }

  /* Hamburger Button */
  .tesla-hamburger {
    display: none;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px;
    color: #FFFFFF;
  }

  .tesla-hamburger svg {
    width: 24px;
    height: 24px;
    stroke: currentColor;
  }

  /* Full Screen Mobile Menu */
  .tesla-mobile-menu {
    display: none;
    position: fixed;
    top: 64px;
    left: 0;
    width: 100%;
    height: calc(100vh - 64px);
    background: rgba(0, 0, 0, 0.98);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    z-index: 999;
    flex-direction: column;
    padding: 32px 24px;
    overflow-y: auto;
  }

  .tesla-mobile-menu.open {
    display: flex;
  }

  .tesla-mobile-menu-links {
    display: flex;
    flex-direction: column;
    gap: 20px;
    list-style: none;
    margin: 0 0 32px 0;
    padding: 0;
  }

  .tesla-mobile-nav-link {
    font-size: 1.35rem;
    font-weight: 600;
    color: #E2E8F0;
    text-decoration: none;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .tesla-mobile-nav-link.active {
    color: var(--public-accent-gold);
  }

  .tesla-mobile-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Persistent Mobile Bottom Action Bar */
  .tesla-mobile-bottom-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 950;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--public-border);
    box-sizing: border-box;
  }

  .tesla-mobile-bottom-btn {
    display: block;
    width: 100%;
    text-align: center;
    background: #FFFFFF;
    color: #000000;
    font-weight: 700;
    font-size: 0.95rem;
    text-decoration: none;
    padding: 14px 20px;
    border-radius: 28px;
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
    box-sizing: border-box;
  }

  /* Tesla Footer */
  .tesla-footer {
    background: #000000;
    border-top: 1px solid var(--public-border);
    color: var(--public-muted);
    font-family: var(--public-font-sans);
    padding: 64px 24px 96px;
  }

  .tesla-footer-inner {
    max-width: 1280px;
    margin: 0 auto;
  }

  .tesla-footer-grid {
    display: grid;
    grid-template-columns: 2fr repeat(3, 1fr);
    gap: 48px;
    margin-bottom: 48px;
  }

  .tesla-footer-brand {
    font-size: 1.1rem;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 12px;
  }

  .tesla-footer-tagline {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--public-muted);
    max-width: 380px;
    margin-bottom: 16px;
  }

  .tesla-footer-col h4 {
    font-size: 0.8rem;
    font-family: var(--public-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #FFFFFF;
    margin-bottom: 16px;
  }

  .tesla-footer-col ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tesla-footer-col a {
    color: var(--public-muted);
    font-size: 0.88rem;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .tesla-footer-col a:hover {
    color: #FFFFFF;
  }

  .tesla-footer-legal-box {
    border-top: 1px solid var(--public-border);
    padding-top: 28px;
    font-size: 0.78rem;
    line-height: 1.65;
    color: #64748B;
    margin-bottom: 24px;
  }

  .tesla-footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    color: #475569;
    flex-wrap: wrap;
    gap: 12px;
  }

  @media (max-width: 900px) {
    .tesla-nav-links, .tesla-nav-actions {
      display: none;
    }
    .tesla-hamburger {
      display: block;
    }
    .tesla-mobile-bottom-bar {
      display: block;
    }
    .tesla-footer-grid {
      grid-template-columns: 1fr;
      gap: 32px;
    }
  }
`;

/**
 * Renders the global, minimal Tesla-mode header.
 * Conforms to ≤6 nav items: Check · Radar · Flight Deck · Institutional · Pricing
 */
export function renderPublicHeader(options: PublicLayoutOptions = {}): string {
  const activePath = options.activePath || "/";
  const user = options.user;

  const navLinksHtml = PUBLIC_NAV_ITEMS.map((item) => {
    const isActive = activePath === item.href || (item.href !== "/" && activePath.startsWith(item.href));
    return `<li><a href="${item.href}" class="tesla-nav-link ${isActive ? 'active' : ''}">${item.label}</a></li>`;
  }).join("\n");

  const mobileNavLinksHtml = PUBLIC_NAV_ITEMS.map((item) => {
    const isActive = activePath === item.href || (item.href !== "/" && activePath.startsWith(item.href));
    return `<li><a href="${item.href}" class="tesla-mobile-nav-link ${isActive ? 'active' : ''}">${item.label}</a></li>`;
  }).join("\n");

  const authActionHtml = user
    ? `<a href="/deck" class="tesla-btn-signin">Flight Deck →</a>`
    : `<a href="/login" class="tesla-btn-signin">Sign in</a>`;

  return `
  <header class="tesla-header" id="main-header">
    <div class="tesla-header-inner">
      <a href="/" class="tesla-brand">
        <span class="tesla-brand-dot"></span>
        <span>QuanterraOS</span>
      </a>

      <!-- Desktop Nav (≤6 items) -->
      <nav aria-label="Main Navigation">
        <ul class="tesla-nav-links">
          ${navLinksHtml}
        </ul>
      </nav>

      <!-- Desktop Actions -->
      <div class="tesla-nav-actions">
        ${authActionHtml}
        <a href="/check" class="tesla-btn-freecheck" id="nav-free-check-btn">Free Check</a>
      </div>

      <!-- Mobile Hamburger Button -->
      <button class="tesla-hamburger" id="tesla-hamburger-btn" aria-label="Toggle mobile menu" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Mobile Full-Screen Overlay Menu -->
    <div class="tesla-mobile-menu" id="tesla-mobile-menu">
      <ul class="tesla-mobile-menu-links">
        ${mobileNavLinksHtml}
      </ul>
      <div class="tesla-mobile-actions">
        ${user ? `<a href="/deck" class="tesla-btn-freecheck" style="text-align:center;">Launch Flight Deck</a>` : `<a href="/login" class="tesla-btn-signin" style="text-align:center; border:1px solid rgba(255,255,255,0.15);">Sign in</a>`}
        <a href="/check" class="tesla-btn-freecheck" style="text-align:center; background:var(--public-accent-gold); color:#000;">Run Free Check</a>
      </div>
    </div>
  </header>

  <!-- Persistent Mobile Bottom Bar -->
  <div class="tesla-mobile-bottom-bar" id="mobile-sticky-action">
    <a href="/check" class="tesla-mobile-bottom-btn">Run Free Check →</a>
  </div>

  <script>
    (function() {
      const btn = document.getElementById('tesla-hamburger-btn');
      const menu = document.getElementById('tesla-mobile-menu');
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
 * Renders the global, Part 7 compliant Tesla-mode footer.
 */
export function renderPublicFooter(): string {
  return `
  <footer class="tesla-footer">
    <div class="tesla-footer-inner">
      <div class="tesla-footer-grid">
        <div class="tesla-footer-about">
          <div class="tesla-footer-brand">QuanterraOS</div>
          <p class="tesla-footer-tagline">
            Trade like a pilot, not a passenger. True cost, settlement radar, and calibration intelligence across prediction markets.
          </p>
          <div style="font-size:0.75rem; color:#475569; font-family:var(--public-font-mono);">
            Quantara Global LLC · Wilmington, DE
          </div>
        </div>

        <div class="tesla-footer-col">
          <h4>Platform</h4>
          <ul>
            <li><a href="/check">True-Cost Check</a></li>
            <li><a href="/radar">Settlement Radar</a></li>
            <li><a href="/deck">Flight Deck Cockpit</a></li>
            <li><a href="/proof">Calibration Proof</a></li>
            <li><a href="/pricing">Pricing Plans</a></li>
          </ul>
        </div>

        <div class="tesla-footer-col">
          <h4>Institutional</h4>
          <ul>
            <li><a href="/institutional">Institutional Overview</a></li>
            <li><a href="/developers">Developer API &amp; MCP</a></li>
            <li><a href="/status">System Ingestion Status</a></li>
            <li><a href="/changelog">Public Changelog</a></li>
          </ul>
        </div>

        <div class="tesla-footer-col">
          <h4>Flight School</h4>
          <ul>
            <li><a href="/learn">Flight School &amp; Glossary</a></li>
            <li><a href="/news">Mission Brief Digest</a></li>
            <li><a href="/help">Help Center &amp; Support</a></li>
            <li><a href="/legal">Legal &amp; Risk Disclosure</a></li>
          </ul>
        </div>
      </div>

      <!-- Verbatim Part 7 Compliance Footer -->
      <div class="tesla-footer-legal-box">
        QuanterraOS is an independent analytics tool by Quantara Global LLC. We don't place trades, hold funds, or give investment advice. Calculations use public data and published fee schedules and may be delayed or wrong — verify with your exchange. Prediction-market trading can lose money. 18+. Kalshi, Polymarket, CME CF BRTI and other names are trademarks of their owners; we're not affiliated with them.
      </div>

      <div class="tesla-footer-bottom">
        <div>&copy; 2026 Quantara Global LLC. All rights reserved. Rule B5 locked ($0.00 capital deployed).</div>
        <div style="display:flex; gap:16px;">
          <a href="/legal" style="color:#64748B; text-decoration:none;">Terms of Service</a>
          <a href="/legal#privacy" style="color:#64748B; text-decoration:none;">Privacy Policy</a>
          <a href="/status" style="color:#64748B; text-decoration:none;">Status</a>
        </div>
      </div>
    </div>
  </footer>
  `;
}
