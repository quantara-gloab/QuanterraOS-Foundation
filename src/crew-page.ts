/**
 * QuanterraOS: The Elite Eleven Crew Page (/crew)
 *
 * Implements:
 * - Exactly eleven members: Founder Michael Quanterra + Leaders Quanta & Quantana + 8 Specialists
 * - Visual identities: Helmets, LED eyes, suit materials, crests
 * - Actual product responsibilities bound to tested code
 * - Founder story & creative provenance (never human portrait, capital M helmet)
 * - Quanta in Executive Orbit attire as page co-host
 * - Non-negotiable honesty: characters are explainers/monitors, multiple characters agreeing != statistical independence
 */

import { ELITE_ELEVEN_REGISTRY, type EliteCrewMember } from "./lib/elite-eleven-catalog.ts";
import { renderPublicHeader, renderPublicFooter, PUBLIC_LAYOUT_CSS } from "./components/public-layout.ts";

export function renderCrewPageHtml(options?: { user?: { email?: string } | null }): string {
  const user = options?.user;

  const founder = ELITE_ELEVEN_REGISTRY.find(m => m.category === "founder" || m.id === "michael" || m.id === "michael-quanterra")!;
  const leaders = ELITE_ELEVEN_REGISTRY.filter(m => m.category === "leader");
  const specialists = ELITE_ELEVEN_REGISTRY.filter(m => m.category === "specialist");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>QuanterraOS Fighter Pilots — Flight Crew & Founder Provenance</title>
  <meta name="description" content="Meet the QuanterraOS Fighter Pilots: Founder Michael Quanterra, Galactic Leaders Quanta and Quantana, and the eight analytical specialists.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}

    :root {
      --crew-bg: #080B18;
      --crew-card: rgba(18, 23, 43, 0.85);
      --crew-border: rgba(155, 108, 255, 0.2);
      --crew-violet: #9B6CFF;
      --crew-mint: #CBFF69;
      --crew-chalk: #F4F3FA;
      --crew-muted: #A6A4BA;
      --crew-gold: #DFB843;
    }

    body {
      background: var(--crew-bg);
      color: var(--crew-chalk);
      font-family: var(--public-font-sans);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }

    .crew-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }

    .crew-hero {
      text-align: center;
      margin-bottom: 48px;
    }
    .crew-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(155, 108, 255, 0.15);
      border: 1px solid rgba(155, 108, 255, 0.35);
      font-family: var(--public-font-mono);
      font-size: 0.78rem;
      color: var(--crew-mint);
      margin-bottom: 16px;
      text-transform: uppercase;
    }
    .crew-title {
      font-size: 2.8rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 12px;
      background: linear-gradient(180deg, #FFFFFF 0%, #C4B5FD 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .crew-subhead {
      font-size: 1.15rem;
      color: var(--crew-muted);
      max-width: 760px;
      margin: 0 auto 24px;
    }

    /* Founder Spotlight */
    .founder-card {
      background: linear-gradient(135deg, rgba(155, 108, 255, 0.15), rgba(9, 13, 26, 0.95));
      border: 1px solid rgba(155, 108, 255, 0.35);
      border-radius: 20px;
      padding: 36px;
      margin-bottom: 56px;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 32px;
      align-items: center;
    }
    @media (max-width: 800px) {
      .founder-card {
        grid-template-columns: 1fr;
        padding: 24px;
      }
    }
    .founder-img-wrap {
      text-align: center;
    }
    .founder-avatar {
      width: 220px;
      height: 220px;
      border-radius: 20px;
      border: 2px solid var(--crew-gold);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
      object-fit: cover;
    }
    .founder-content h2 {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 0 0 8px;
      color: #FFFFFF;
    }
    .founder-title-badge {
      font-family: var(--public-font-mono);
      font-size: 0.82rem;
      color: var(--crew-gold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 14px;
    }
    .founder-story {
      color: var(--crew-chalk);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .founder-signature-box {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 12px 16px;
      font-family: var(--public-font-mono);
      font-size: 0.8rem;
      color: var(--crew-mint);
    }

    /* Section Headers */
    .section-title-wrap {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 6px;
    }
    .section-desc {
      font-size: 0.92rem;
      color: var(--crew-muted);
      margin: 0;
    }

    /* Cards Grid */
    .roster-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 56px;
    }
    .member-card {
      background: var(--crew-card);
      border: 1px solid var(--crew-border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .member-card:hover {
      transform: translateY(-4px);
      border-color: rgba(155, 108, 255, 0.45);
    }
    .member-card-top {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .member-avatar {
      width: 72px;
      height: 72px;
      border-radius: 12px;
      object-fit: cover;
      border: 1px solid var(--crew-border);
    }
    .member-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 4px;
    }
    .member-role {
      font-size: 0.78rem;
      font-family: var(--public-font-mono);
      color: var(--crew-mint);
      margin: 0;
    }
    .member-signature {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 0.8rem;
      color: var(--crew-chalk);
    }
    .member-responsibility {
      background: rgba(155, 108, 255, 0.08);
      border: 1px solid rgba(155, 108, 255, 0.2);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 0.8rem;
      color: #D8B4FE;
    }
    .member-responsibility strong {
      color: #FFFFFF;
    }

    /* Integrity banner */
    .integrity-banner {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      color: var(--crew-muted);
      font-size: 0.88rem;
      line-height: 1.6;
    }
    .integrity-banner strong {
      color: var(--crew-chalk);
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/crew", user })}

  <main class="crew-container">
    <header class="crew-hero">
      <div class="crew-badge">QuanterraOS Fighter Pilots Roster</div>
      <h1 class="crew-title">Meet the QuanterraOS Fighter Pilots</h1>
      <p class="crew-subhead">
        One calm product organized around eleven distinct identities. Founder Michael Quanterra, Galactic Leaders Quanta and Quantana, and eight specialized analytical copilots.
      </p>
    </header>

    <!-- Founder Spotlight -->
    <section class="founder-card" aria-label="Founder Spotlight">
      <div class="founder-img-wrap">
        <img src="${founder.avatarImage}" alt="${founder.name}" class="founder-avatar">
      </div>
      <div class="founder-content">
        <h2>${founder.name}</h2>
        <div class="founder-title-badge">Founder, Creator & Systems Architect</div>
        <p class="founder-story">
          Michael Quanterra created QuanterraOS to bring radical transparency and empirical measurement to prediction markets. Built around the permanent visual signature of a capital <strong>M on his helmet forehead</strong> and an entirely digital LED visor face, Michael embodies creative provenance and brand architecture—never a trading algorithm or execution model.
        </p>
        <div class="founder-signature-box">
          Permanent Signature: Capital M on helmet forehead · Violet star eyes · Cyan smile · Black/pearl ceramic founder suit.
        </div>
        <div class="member-responsibility" style="margin-top: 14px;">
          <strong>Product Role:</strong> ${founder.productResponsibility}
        </div>
      </div>
    </section>

    <!-- Galactic Leaders -->
    <div class="section-title-wrap">
      <h2 class="section-title">Galactic Leadership (2)</h2>
      <p class="section-desc">Quanta orchestrates operational analysis; Quantana leads onboarding and education.</p>
    </div>

    <div class="roster-grid">
      ${leaders.map(m => `
        <article class="member-card" id="crew-${m.id}">
          <div class="member-card-top">
            <img src="${m.avatarImage}" alt="${m.name}" class="member-avatar">
            <div>
              <h3 class="member-name">${m.name}</h3>
              <p class="member-role">${m.title}</p>
            </div>
          </div>
          <div class="member-signature">
            <strong>Visual Signature:</strong> ${m.visualIdentity}
          </div>
          <div class="member-responsibility">
            <strong>Product Role:</strong> ${m.productResponsibility}
          </div>
        </article>
      `).join("")}
    </div>

    <!-- The Eight Specialists -->
    <div class="section-title-wrap">
      <h2 class="section-title">The Eight Specialists (8)</h2>
      <p class="section-desc">Each specialist is bound to tested code, explicit data inputs, and verifiable outputs.</p>
    </div>

    <div class="roster-grid">
      ${specialists.map(m => `
        <article class="member-card" id="crew-${m.id}">
          <div class="member-card-top">
            <img src="${m.avatarImage}" alt="${m.name}" class="member-avatar">
            <div>
              <h3 class="member-name">${m.name}</h3>
              <p class="member-role">${m.title}</p>
            </div>
          </div>
          <div class="member-signature">
            <strong>Visual Signature:</strong> ${m.visualIdentity}
          </div>
          <div class="member-responsibility">
            <strong>Product Role:</strong> ${m.productResponsibility}
          </div>
        </article>
      `).join("")}
    </div>

    <!-- Statistical Independence & Honesty Banner -->
    <footer class="integrity-banner">
      <strong>Statistical Independence Notice:</strong> These proposed responsibilities represent UI stations bound to explicit verified code. Multiple characters agreeing on the same underlying market data must never be interpreted as independent statistical confirmation. QuanterraOS does not promise trading profits or predictive certainty.
    </footer>
  </main>

  ${renderPublicFooter()}
</body>
</html>`;
}
