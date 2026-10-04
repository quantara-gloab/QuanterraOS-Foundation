# QuanterraOS Visual Design Plan — "High-Tech, Competitive" Pass

## Subject, audience, job

**Subject:** A calibration/transparency engine for Kalshi BTC prediction markets — the product's entire value proposition is "we show you real numbers, including the ones that make us look bad."  
**Audience:** Traders and quant-adjacent people evaluating whether to trust this data. They're skeptical by default — they've seen "AI trading edge" hype before and don't believe it.  
**Job:** The page's one job is to make skepticism give way to trust, through precision and restraint — not through spectacle. A skeptical trader trusts a page that looks like a Bloomberg terminal more than one that looks like a trailer for a space game.

This reframes "high-tech like Tesla/Nvidia" correctly: those brands earn trust through *confidence expressed as restraint* — one hero number, enormous negative space, no decoration that isn't load-bearing. That's the actual target, not sci-fi chrome.

---

## Design plan (pass 1)

**Color** (4 values, not 6 — this product doesn't need a wide palette):
- `#0A0E14` — near-black ink, background. (Deliberately bluer/cooler than the generic `#0B0B0B`/`#111` AI-default — this one has a faint navy cast, like an oscilloscope screen, not a "dark mode toggle.")
- `#E8EAED` — primary text, soft white (not pure `#FFF` — slightly warm-grey to reduce glare on a data-dense page).
- `#4FD1C5` — single accent: a desaturated teal, used ONLY for the live/calibrated state and the one hero number. Chosen because it's unlike the generic acid-green or vermilion defaults, and teal reads as "measurement/signal" rather than "alert" or "brand."
- `#C65D4A` — single warning/divergence accent, used ONLY when a number represents underperformance or a locked gate (Falcon's 0.2736, Phoenix's locked status). Muted terracotta-adjacent but desaturated enough not to read as a decoration color.

**Type:**
- Display/headline: **General Sans / Inter** (geometric, confident, a little cold) — one weight (600) for all headlines, no italics, no single-word color accents.
- Body/data: **IBM Plex Mono is fine to KEEP for actual numbers** (Brier scores, timestamps, dollar figures) — monospace is correct here because it's tabular data a trader expects to line up in columns, not decoration. Monospace is never used for prose/labels where it isn't information.
- Drop ALL-CAPS tracked labels and middle-dot (`·`) joins — both are on the cliché list and don't appear anywhere in how Bloomberg, Tesla's spec sheets, or Nvidia's technical pages actually set small labels (they use sentence case, smaller size, more whitespace instead of letter-spacing-as-emphasis).

**Layout (ASCII wireframe):**

```
┌─────────────────────────────────────────────┐
│  quanterraos                      council    │  <- thin, quiet nav. no pulsing dot here.
├─────────────────────────────────────────────┤
│                                               │
│  0.2001                                      │  <- ONE enormous number. nothing else
│  market-mid Brier score                      │     competes with it on this screen.
│  across 1,316 settled markets                │
│                                               │
│  see the full calibration curve              │  <- text link, not a gold-glow button
│                                               │
├─────────────────────────────────────────────┤
│  The eight specialists                       │  <- sentence case, not "COUNCIL ROSTER"
│  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │ Falcon  │ │ Q. Fox  │ │ Phoenix │  ...    │  <- cards differ by CONTENT density,
│  │ 0.2736  │ │ 0.2001  │ │ LOCKED  │         │     not by identical rounded-shadow kit
│  └─────────┘ └─────────┘ └─────────┘         │
└─────────────────────────────────────────────┘
```

Alignment: left-aligned throughout, generous left margin (not centered hero text) — left-aligned reads as "data product," centered reads as "landing page selling something."

**Principles:**
1. One number per screen gets to be large. Everything else is quiet.
2. Monospace is reserved for actual tabular data, never for labels/prose.
3. No card gets a border-radius + drop-shadow by default — differentiate cards by what they contain (Falcon's card shows a number and a trend line; Phoenix's shows a lock icon and a gate status; they should NOT look like the same template with swapped text).
4. Motion: one orchestrated moment only — when the live pipeline cycle actually completes, the hero number can tick/update with a brief (200ms) crossfade. No hover-lift on every card, no scroll-triggered fade-ins on every section.

---

## Review against the brief (pass 2 — self-critique)

Checking this plan against the cliché list before building:
- Avoided: cream/terracotta Claude-tell — not used.
- Avoided: near-black + single acid-green — used near-black + teal/terracotta-desaturated pair instead, and restricted terracotta to a semantic (bad-news) role rather than decoration.
- Avoided: identical rounded SaaS cards with soft shadow — cards differentiate by content shape.
- Avoided: ALL-CAPS tracked eyebrows, middle-dot meta strings, arrow-suffixed buttons, "→" on every CTA — removed; text links use plain sentence case without arrow glyphs.
- Kept monospace — justified because it's genuinely tabular financial data, not decoration.
- Hero number: 0.2001 market-mid Brier is the actual headline fact of the product.

---

## Guardrails

- No copy comparing QuanterraOS to third-party companies.
- No gamification, rank titles, sound effects, or sci-fi chrome.
- Run `static-copy-guardrails.test.ts` and entire test suite after restyling.
