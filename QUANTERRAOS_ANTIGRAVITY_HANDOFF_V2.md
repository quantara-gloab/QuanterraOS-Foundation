# QuanterraOS — Complete Antigravity Handoff (v2)
**Supersedes:** `QUANTERRAOS_MASTER_BLUEPRINT.md` (v1) / `HANDOFF.md`. Where they conflict, v2 wins.
**Owner:** Michael — Quantara Global LLC · **Date:** 2026-10-09
**Repo:** `quantara-gloab/QuanterraOS-Foundation` — public site `src/server.ts` → `quanterra-web.service` (port 3102); calibration/API `src/dashboard-server.mjs` (port 3000); Lightsail `/opt/quanterraos/app`; Caddy → 3102; auth + billing via Clerk / Clerk Billing.

> **Antigravity — operating rules**
> 1. Read Parts 0–2 before writing code. Execute Part 6 phases in order.
> 2. Branch `v2-flightdeck`. One commit per task ID. Every task has an acceptance test; it is not done until the test passes.
> 3. The **Guardrails (Part 0.3)** are non-negotiable. If a task seems to require breaking one, stop and write the conflict into `HANDOFF_QUESTIONS.md` instead.
> 4. Do not delete data, tables, or the calibration corpus. Retire routes with 301 redirects.

---

## PART 0 — Strategy in one page

### 0.1 Positioning
**QuanterraOS is the independent flight deck for prediction-market traders.** Every competitor tells you *what others are betting*. QuanterraOS tells you *what this trade will really cost you, how it settles, and whether you're getting better* — and turns disciplined trading into a game you level up in.

Tagline: **"Trade like a pilot, not a passenger."**
Sub-line: **"True cost, settlement radar, and a mission log that makes you sharper every trade — across Kalshi and Polymarket."**

### 0.2 Two surfaces, one product
| Surface | Feel | Purpose |
|---|---|---|
| **Public site** (`quanterraos.com`, signed-out) | **Tesla**: black, full-bleed panels, one idea per screen, ≤6 nav items | Convert visitors → Free Check → signup |
| **Flight Deck** (`/deck`, signed-in, web + mobile PWA) | **Celestial spacecraft terminal that feels like a video game** | Daily-use cockpit: Check, Radar, Journal, Crew AI, missions, ranks |

The marketing site stays calm and premium. The game lives *inside* the ship.

### 0.3 Guardrails (non-negotiable)
QuanterraOS's own published data shows the Kalshi market mid (Brier 0.2001) beats our model (0.2063) and Falcon (0.2736) underperforms a coin flip. Therefore:
1. **No promises of winning.** Never use "win," "winning," "guaranteed," "beat the market," "edge," "profit," or win-rate claims in marketing copy, push notifications, Aria responses, or coach scripts. Allowed: "lower your costs," "avoid overpaying," "know your breakeven," "track your calibration."
2. **No buy/sell recommendations** from Aria, crew, coaches, alerts, or widgets. Outputs are arithmetic, measurements, and reflections on the user's own data.
3. **No execution, custody, deposits, wallets, or copy-trading.** (Rule B5 stays locked.)
4. **The game rewards discipline, never volume or P&L.** XP is never earned by placing trades, trading more, trading bigger, or winning. No confetti/celebration on wins. No leaderboards ranked by profit.
5. **Responsible-trading layer is mandatory** (Part 3.6): session limits, loss-limit reminders, tilt cooldown, 18+ age gate, help links.
6. **No named-competitor attack claims** without a dated, linked source.
7. **Coaches teach process**, not picks (Part 3.8).

*Founder note: have a commodities/securities attorney review alerts, coaching scripts, and any future "signals" product before launch. This document is not legal advice.*

---

## PART 1 — Competitor teardown: what we acquire, what we exploit

| # | Competitor | Strengths to **ACQUIRE** (build our version) | Weaknesses to **EXPLOIT** |
|---|---|---|---|
| 1 | **Oddpool** (now inside Kalshi) | Institutional page segmented by buyer (market makers / prop / macro funds); self-serve API with free tier (1,000 req/mo), Pro $30, Premium $100; `llms.txt` so coding agents can integrate first try; "Book a call" CTA; Fed/BTC topic landing pages; paper trading; Oddbot chat | Owned by an exchange → not neutral; breadth over depth — no settlement-index (BRTI) math, no per-trade cost audit, no user discipline layer |
| 2 | **Stand.trade** | Free pro terminal; both venues; up to 8 markets on one screen; whale alerts; advanced order types | Built around copy-trading and execution → churn and loss-chasing; no fee/breakeven education; no calibration feedback |
| 3 | **Unusual Predictions (Unusual Whales)** | Massive audience/brand; "insider-style" unusual-activity flags; smart-money by category; API upsell | Polymarket-only now — **Kalshi traders get nothing**; no cost math; "follow the whale" without fee/settlement context |
| 4 | **Verso** | "Bloomberg Terminal for prediction markets" positioning; live Kalshi data; news engine; real-time alerts | Terminal-dense, intimidating; no coaching, no progression, no mobile-first story |
| 5 | **Kalshinomics** | Clean tables & fast filters; news + weekly digest; Labs (e.g., oil spot vs probability); media citations (WSJ, Verge, Blockworks); KalshiEco partnership; free | Discloses Kalshi referral relationship → not fully independent; no personal tools (journal, cost check, calibration); no app |
| 6 | **Polymarket Analytics** | Free, no account; wallet lookup & portfolio; trader leaderboard; historical data & exports; SEO-rich FAQ; mobile bottom nav; Telegram + X community | Polymarket-only; leaderboards by P&L encourage chasing; no Kalshi, no BRTI, no fee math |
| 7 | **0xinsider** | Wallet grades S→F from settled P&L; "Pick of the Day" on a public record; best-in-class agent/dev surface (OpenAPI 3.1, remote MCP, CLI, `agents.md`, `llms.txt`); Discord | Sports/esports-focused; picks = advice-like; Polymarket-centric; no cost/settlement layer |
| 8 | **Predictu** | Breadth (24,000+ markets); AI agents; discover feed; integrated X feed; copy trading | Breadth without depth; AI "agents" with no published calibration; execution-heavy |
| 9 | **Auspex Terminal** | Closest to us: unified books, **fee-aware arbitrage**, basis-point alerts, tick export, portfolio/sizing overlay | Private beta; legal/custody details thin; pro-only, no education or retail on-ramp |
| 10 | **Polymarket APIs + open-source SDKs (PMXT etc.)** | Free, developer-loved | Raw data, no product, no neutrality across venues |

**The gap nobody fills:** independent, venue-neutral, *settlement-aware* cost and calibration intelligence, wrapped in a product people *enjoy* using every day. That is QuanterraOS.

**Kill shots (our "first in the world" claims — each must be true before we market it):**
1. First prediction-market terminal that scores **you** (calibration + discipline), not other people's wallets.
2. First to show **net-after-fees** on every number — whale flow, spreads, your trades.
3. First **settlement-index radar** for Kalshi BTC (CME CF BRTI 60s average vs. spot exchanges, live).
4. First **"Shadow Mode"**: paper-follow any public whale/strategy and see what *you* would have netted after fees and slippage — without copy-trading.
5. First game where you level up by **paying less and forecasting better**, not by trading more.

---

## PART 2 — Information architecture

### 2.1 Public site (Tesla mode, signed-out)
Top nav: `QuanterraOS` · **Check** · **Radar** · **Flight Deck** · **Institutional** · **Pricing** · [Sign in] · [**Free Check**]
Mobile: same items in a full-screen menu; persistent bottom "Free Check" button.

| Route | Content |
|---|---|
| `/` | 6 full-viewport panels (2.2) |
| `/check` | Free True-Cost & Breakeven Check (no account) |
| `/radar` | Public BTC Settlement Radar (20-min delayed for signed-out) |
| `/deck` | Flight Deck tour/teaser → signup |
| `/proof` | Public audit: calibration, methodology, "market beats our model" |
| `/institutional` | Segmented by buyer type (copy Oddpool's structure), API, data licensing, MCP, book-a-call |
| `/developers` | API docs, OpenAPI, `llms.txt`, MCP card, free key |
| `/pricing` | Single pricing table (Part 4) |
| `/learn` | Flight School (lessons, glossary) |
| `/widgets` | Embed gallery |
| `/news` | Weekly "Mission Brief" digest + market context |
| `/legal`, `/status`, `/changelog`, `/help` | Footer |
| SEO topic pages | `/kalshi-fee-calculator`, `/kalshi-btc-settlement-brti`, `/kalshi-vs-polymarket-fees`, `/bitcoin-15-minute-markets` |

### 2.2 Home page panels
1. **Hero** (animated starfield, very subtle): "Trade like a pilot, not a passenger." — [Run Free Check] [Enter the Flight Deck]
2. **Cost**: live Kalshi fee curve; "At 50¢ you need 51.75% just to break even." — [Check a contract]
3. **Settlement**: live BRTI vs Coinbase/Kraken gap + countdown. "Kalshi settles on the index, not your app." — [Open Radar]
4. **Flight Deck preview**: looping 8-second capture of the cockpit, ranks, missions. "Get sharper every trade." — [Start free]
5. **Proof**: "We publish when the market beats us." Brier 0.2001 vs 0.2063, n=1,316. — [See the proof]
6. **Institutional**: "Neutral data for desks." — [Talk to us] [Get API key]

### 2.3 Flight Deck (signed-in app) — stations
Bottom tab bar on mobile / left rail on desktop:

| Station | Ship metaphor | Function |
|---|---|---|
| **Bridge** | Main viewscreen | Home: today's missions, rank, hull/fuel gauges, alerts, Aria |
| **Navigation** | Star map | Radar: BTC 15m/1h settlement board, BRTI vs spot, strikes, time-to-expiry, liquidity walls |
| **Engineering** | Fuel & reactor | Check: true cost, maker-vs-taker saver, rounding optimizer, cross-venue net spread |
| **Mission Log** | Captain's log | Journal: thesis → trade → settlement; Kalshi CSV import; fees paid/avoidable; personal Brier |
| **Sensors** | Long-range scanners | Flow: whale/large-trade feed **with net-after-fees and settlement context**; Shadow Mode |
| **Crew** | Crew quarters | AI crew (Part 3.3) + book a human Flight Instructor |
| **Hangar** | Ship config | Account, plan, alerts, limits, widgets, API keys |

---

## PART 3 — Feature specifications

### 3.1 Engineering (cost engine) — core value
`src/lib/fees.ts` (unit-tested, config-driven, each schedule carries `source_url` and `effective_date`):
- Kalshi general: `fee = ceil_to_cent(0.07 × C × P × (1−P))` per order. Product-specific schedules overrideable by config.
- Polymarket: category fee table from config.
- Outputs per check: executable cost, fee, max loss, **breakeven probability**, EV at user's p (labeled "your assumption"), settlement source, **danger-zone flag**.
- **Maker vs Taker Saver**: savings if posting a limit vs taking; fill-probability estimate from current depth with method note.
- **Rounding Optimizer**: consolidation savings.
- **Cross-Venue Net Spread**: net after both venues' fees + settlement-source mismatch (BRTI vs UMA).
*Accept:* 10 ct @ $0.51 → fee $0.18; 100 ct @ $0.50 → $1.75; breakeven at 51¢ = 52.75% (raw) / matches rounded fee for given C.

### 3.2 Navigation (Settlement Radar)
- Live BRTI (or best available licensed proxy — **verify data licensing with CF Benchmarks before displaying the index itself**), vs Coinbase, Kraken, Bitstamp, Gemini spot; dispersion in bps.
- Active KXBTC15M / KXBTCD strikes: distance-to-strike, seconds left, fee drag per strike, top-of-book, liquidity walls.
- "Coin-flip zone" overlay: within last N minutes and within $X of strike.
- Signed-out: 20-min delay. Pro: real-time + push alerts.

### 3.3 Crew — AI layer (fulfills the "30 agents" vision honestly)
- **Aria = ship's computer.** One conversational entry point. Grounded strictly on: calculator outputs, user's own journal, `/proof` findings, Flight School content. Refuses buy/sell questions with: *"I can't tell you what to trade, but I can show you exactly what this one costs and how it settles — want me to run it?"*
- **Crew stations** (each a tool-scoped sub-agent Aria routes to; shown as crew portraits in the Crew station). Launch with 8, roadmap to 30. Each has a single job, a data source, and a published accuracy/uptime card where applicable.

| Launch crew | Station | Job |
|---|---|---|
| Navigator | Navigation | Explains BRTI vs spot, time-to-expiry, strike distance |
| Chief Engineer | Engineering | Fee, breakeven, maker/taker, rounding |
| Quartermaster | Mission Log | Journal entry, CSV import, fees-paid report |
| Science Officer | Proof | Calibration math, Brier, "is the market mid well-calibrated?" |
| Security Chief | Hangar | Limits, tilt cooldown, session timer |
| Comms Officer | News | Macro/BTC event calendar, Mission Brief digest |
| Flight Instructor | Flight School | Lessons, quizzes, mission explanations |
| Sensors Officer | Sensors | Whale feed with net-after-fees context, Shadow Mode setup |

Roadmap crew (to 30): station specialists per venue, per market type (weather, Fed, CPI), onboarding guide, support agent, institutional data concierge, widget builder, accessibility guide, etc. **Only ship a crew member when it has a concrete tool and an eval set.**
- Voice: off by default; opt-in.
- Every Aria answer that cites a number links to its source (calculator run, proof section, journal entry).
*Accept:* eval set of 50 adversarial prompts ("should I buy YES?", "guarantee me", "which whale should I copy") → 100% non-advisory responses.

### 3.4 Sensors — whale flow, done better
- Large-trade feed for Kalshi (trade size, price, time — no identities) and Polymarket (on-chain wallet).
- **Every row shows net-after-fees and settlement context**, not just size.
- Wallet "track record" cards for Polymarket wallets: **calibration score**, not just P&L.
- **Shadow Mode**: user selects a public wallet or a rule ("follow buys >$10k"); system paper-records what the user *would* have netted after fees, slippage, and latency. Lives in Mission Log under a "Shadow" tab with CFTC Rule 4.41 hypothetical disclosure. No order routing.

### 3.5 Game layer — the celestial spacecraft terminal
**Visual:** deep-space dark UI, subtle parallax starfield, glassmorphic HUD panels, gold/cyan accents, monospace telemetry numerals, orbit rings around the active market. Performance budget: 60fps on mid-range phones; `prefers-reduced-motion` disables animation; sound off by default with optional ambient bridge hum and UI blips.
**Core loop:** *Pre-flight check → Launch (user trades on their exchange) → Log → Debrief (settlement + calibration) → Rank up.*
**Ship gauges (on Bridge):**
- **Fuel** = monthly fee budget remaining (user-set). Burning fuel faster than plan → warning.
- **Hull integrity** = loss-limit headroom (user-set daily/weekly max loss). Under 30% → Security Chief suggests standing down.
- **Navigation accuracy** = rolling personal Brier score.
- **Discipline** = % of logged trades with a pre-flight check and written thesis.

**XP is earned only for:**
| Action | XP |
|---|---|
| Run a pre-flight Check before a logged trade | +10 |
| Write a thesis + max-loss before entry | +15 |
| Choose maker/limit when Saver showed savings | +10 |
| Avoid a flagged coin-flip-zone entry (dismiss with "standing down") | +20 |
| Complete a Flight School lesson / quiz | +25 |
| Weekly debrief completed | +30 |
| Improve 30-day Brier vs prior 30 days | +100 |
| Respect a tilt cooldown | +25 |

**XP is never earned for:** placing trades, trade count, trade size, P&L, wins, streaks of trading days.
**Ranks** (calibration + discipline gated, not money): Cadet → Pilot → Lieutenant → Commander → Captain → Admiral. Each rank unlocks cosmetic ship skins, HUD themes, crew portraits — **never** trading features or discounts tied to volume.
**Missions:** daily (e.g., "Run 3 pre-flight checks"), weekly ("Log every trade with a thesis"), campaign ("Flight School: Settlement Mastery"). Missions never require trading.
**Leaderboards (opt-in, pseudonymous):** ranked by **calibration** (min sample size) and **fees saved** — never profit, ROI, or volume.
**Celebrations:** animations fire for rank-ups, mission completion, and calibration improvement — **not** for winning trades.

### 3.6 Responsible-trading layer (mandatory)
- 18+ age gate at signup (Kalshi requires 18+); store only a boolean attestation.
- User-set daily/weekly loss limit and fee budget; gauges + reminders.
- **Tilt detection:** 3+ logged losses within 60 min or rapid re-entry after loss → 15-minute "systems cooldown" overlay (dismissable, but XP rewarded for respecting it).
- Session timer reminder (default 60 min, adjustable).
- "Take a break" self-pause (24h / 7d / 30d) hides Radar alerts.
- Help link in Hangar and footer to gambling/trading-harm resources (e.g., 1-800-GAMBLER in the U.S.).
*Accept:* QA script triggers tilt overlay; limits persist across devices.

### 3.7 Customer service (beat everyone)
- Aria 24/7 in-app for product questions + "Talk to a human" escalation → ticket to `support@quanterraos.com` with conversation attached (with consent).
- **Human SLA:** Pro < 24h, Desk < 4 business hours, Institutional dedicated Slack/Teams channel.
- `/help` center: searchable articles generated from Flight School + FAQ; each article ends with "Still stuck? Ask Aria."
- Discord community (channels: #bridge-general, #flight-school, #feature-requests, #bug-reports) — moderated, no trade-calling channels.
- In-app bug reporter (already exists — keep; v0.1.0-pilot label → real version).
- `/status` public page with feed freshness, reconciler lag, uptime history.
- Public changelog + feature voting (copy Oddpool's feedback board).

### 3.8 Flight Instructors (business coaches)
- Human coaches offered as an add-on and in Desk tier.
- **Scope:** process coaching — journal review, cost discipline, risk limits, calibration practice, tool mastery. **Out of scope:** recommending specific trades, markets, sides, or sizes.
- Coach console: read-only view of the client's Mission Log (with explicit client consent), session notes, homework missions.
- Booking via embedded scheduler; 30/60-min sessions.
- Coach onboarding includes a written script and a "do not advise" policy acknowledgment.
- *Founder: confirm with counsel whether coaching triggers CTA registration before charging for it.*

### 3.9 Widgets (distribution engine)
Embeddable, lightweight, branded "Powered by QuanterraOS" with backlink:
1. Kalshi fee & breakeven calculator
2. BRTI-vs-spot dispersion ticker
3. Live 15-min BTC countdown with strike distance
4. "Market vs model" calibration badge
5. Kalshi vs Polymarket net-price comparator (single market)
Embed via `<script>` + iframe fallback; light/dark; responsive; free tier rate-limited, paid tier white-label for media partners.

### 3.10 Developers & institutions (acquire Oddpool's and 0xinsider's best)
- `/developers`: OpenAPI 3.1 spec, quickstart (curl, Python, TS), `llms.txt`, `agents.md`, remote MCP endpoint (expand existing `/mcp` manifest), `.well-known/mcp`.
- Free API key: 1,000 req/mo, delayed data. Paid tiers in Part 4.
- Datasets: BRTI-vs-spot dispersion (tick), Kalshi BTC 15m book snapshots, 1,316-window calibration corpus, fee-adjusted spread history. Parquet + DuckDB examples.
- `/institutional` sections: Market makers · Prop desks · Funds & macro research · Media & data partners. Each with 4 concrete bullets and "Book a call."

### 3.11 Mobile app
- **PWA first** (same codebase): install prompt, offline shell, bottom tab bar, haptic feedback on gauges (where supported), web push.
- **Share-sheet intake:** user shares a Kalshi/Polymarket link to QuanterraOS → opens Engineering with fields pre-filled.
- Home-screen widget (native phase): countdown + fuel/hull gauges.
- Native wrappers (Capacitor) for iOS/Android **after** PWA retention ≥ 25% D30. Prepare App Store review notes: analytics-only, no wagering, no execution.

### 3.12 News & content (acquire Kalshinomics' strength)
- Weekly **Mission Brief** email + `/news` page: "What fees cost BTC traders this week," settlement-gap events, calibration update, upcoming macro events.
- Monthly **Proof Report** (auto-generated from ledger).
- Press kit page for media citations.

---

## PART 4 — Pricing (single source of truth: `src/config/pricing.ts`)
| Plan | Price | Includes |
|---|---|---|
| **Cadet (Free)** | $0 | Unlimited Free Check, delayed Radar, local Mission Log, 3 missions/day, Aria (limited), Flight School basics, widgets (rate-limited), API free key |
| **Pilot (Pro)** | **$39/mo · $349/yr** · 14-day trial | Real-time Radar & push alerts, Maker/Taker Saver, Rounding Optimizer, cloud Mission Log, Kalshi CSV import, fees-paid dashboard, Shadow Mode, full Crew, all missions/ranks/skins, priority support (<24h) |
| **Commander (Desk)** | **$399/mo** (annual) | Everything in Pilot, multi-account log, cross-venue net-spread scanner, WebSocket feed, exports, 1 Flight Instructor session/month, <4h support |
| **Builder API** | **$49/mo** | 50k req/mo, real-time REST, MCP access |
| **Institutional / Data** | Custom (anchor $1,500+/mo) | Unmetered WS, datasets, SLA, dedicated channel, white-label widgets |
| **Flight Instructor add-on** | $149/session or $399/mo (4 sessions) | Human process coaching |

Gating via Clerk Billing plans: `free`, `pilot`, `commander`, `builder`; `institutional` = manual invoice. Founder must complete EIN → connect Stripe in Clerk.

---

## PART 5 — Design system
**Public site (Tesla mode):** `--bg #000`, `--fg #FFF`, `--muted #8A8F98`, `--accent-gold #C9A24A`. One sans family (Inter or similar), weights 400/600. Headlines 56–72px desktop / 34–40px mobile. Full-viewport sections. ≤3 numbers per screen. No more than 2 buttons per panel.
**Flight Deck (Celestial mode):** add `--space-900 #05060B`, `--space-700 #0D1120`, `--hud-cyan #4FD1E8`, `--hud-gold #C9A24A`, `--alert-red #E5484D`, `--ok-green #30A46C`, `--glass rgba(255,255,255,0.06)` with 12px blur. Telemetry font: a monospace (e.g., JetBrains Mono). Starfield via lightweight canvas/WebGL (Three.js only if bundle ≤ 150 KB gzipped for the deck route). HUD corner brackets, scanline micro-texture at 2% opacity.
Tokens on `:root`, dark only for deck; public site dark-default with light-mode support. Respect `prefers-reduced-motion`. WCAG AA contrast. Do not use Tesla's logo, fonts, imagery, or trade dress — mirror principles only. No copyrighted sci-fi IP (no Star Trek/Star Wars ship designs, fonts, or sounds).

---

## PART 6 — Execution plan (phased, with acceptance tests)

### PHASE 1 — Stop the bleeding (Day 0–1)
- [x] **1.1** Delete `/wallet` (remove BTC deposit address). 301 → `/deck`. *Accept:* grep `bc1q` = 0; `/wallet` → 301.
- [x] **1.2** Move `/growth` off this domain. 301 → `/`.
- [x] **1.3** Create `src/config/pricing.ts` (Part 4); homepage + `/pricing` render from it. *Accept:* no hard-coded prices elsewhere.
- [x] **1.4** Rename legacy fee labels → "Kalshi taker fee" everywhere. *Accept:* legacy taker fee label count = 0.
- [x] **1.5** Remove named-competitor "Fatal Flaw" cards; keep a neutral, sourced independence line.
- [x] **1.6** Strip internal language ("Acquisition Wedge," "Build Order #," "90-Day Plan," "Engineering Days Saved," "Customer Validation," "Sovereign Agent Deployment," "Study #6.4," "Rule B5/B10" labels) from public pages; replace with plain-English compliance footer.
- [x] **1.7** Sync-error banner only on actual failure.
- [ ] **1.8** "Execution Desks" → "Market View."
- [ ] **1.9** Aria voice default OFF site-wide.

### PHASE 2 — Data integrity (Week 1)
- [ ] **2.1** Settlement reconciler; backfill all `PENDING` rows for closed markets. *Accept:* closed >30 min = 100% settled.
- [ ] **2.2** Reject placeholder tickers (`*-CURRENT`) at write.
- [ ] **2.3** Paper entries require real ask price; no $0.00 buys.
- [ ] **2.4** One prediction per market per checkpoint (min 4/7/10/13).
- [ ] **2.5** `src/lib/fees.ts` with tests (Part 3.1).
- [ ] **2.6** `/status` shows feed freshness, reconciler lag, uptime.
- [ ] **2.7** Verify BRTI display licensing; if not licensed, display "settlement-index proxy" from constituent exchanges with methodology note.

### PHASE 3 — Public site rebuild, Tesla mode (Week 1–2)
- [ ] **3.1** Global header/footer components; remove all per-page navs.
- [ ] **3.2** Design tokens (Part 5) in one stylesheet.
- [ ] **3.3** Home = 6 panels (2.2). Test at 375px.
- [ ] **3.4** Route map (2.1) + 301s for every retired URL (`/calculator`→`/check`, `/compare`→`/check`, `/paper`→`/deck`, `/spread` `/matrix` `/flow` `/settlement` `/corridors` `/divergence` `/index`→`/radar`, `/calibration*` `/study` `/methodology` `/research` `/transparency` `/council` `/why`→`/proof`, `/predictions` `/autopilot` `/journal`→`/deck`, `/educators`→`/learn`, `/mcp`→`/developers`, `/radar/audio`→`/proof#sonification`, `/mobile`→`/deck`). *Accept:* old sitemap crawl → 0 × 404.
- [ ] **3.5** SEO topic pages + FAQ schema (Part 2.1).
- [ ] **3.6** Lighthouse mobile ≥ 90 perf/a11y on `/`, `/check`, `/radar`.

### PHASE 4 — Flight Deck core (Weeks 2–4)
- [ ] **4.1** `/deck` shell: stations (2.3), bottom tabs (mobile), left rail (desktop), celestial theme (Part 5).
- [ ] **4.2** Engineering: Maker/Taker Saver, Rounding Optimizer, Cross-Venue Net Spread.
- [ ] **4.3** Navigation: live Settlement Radar + coin-flip-zone overlay.
- [ ] **4.4** Mission Log: thesis → trade → settle; Kalshi CSV import; fees paid/avoidable; personal Brier.
- [ ] **4.5** Bridge gauges: Fuel, Hull, Navigation accuracy, Discipline.
- [ ] **4.6** Responsible-trading layer (3.6). *Accept:* QA script triggers tilt cooldown; limits sync across devices.

### PHASE 5 — Crew & game (Weeks 3–5)
- [ ] **5.1** Aria router + 8 launch crew (3.3), each with tool scope and eval set. *Accept:* 50-prompt adversarial eval = 100% non-advisory.
- [ ] **5.2** XP engine (event-sourced table `xp_events`), ranks, missions, cosmetic unlocks. *Accept:* unit tests prove no XP path from trade count, size, P&L, or wins.
- [ ] **5.3** Opt-in leaderboards by calibration (min n=30 settled logs) and fees saved.
- [ ] **5.4** Celebration animations only on rank-up, mission complete, calibration improvement.

### PHASE 6 — Sensors & Shadow Mode (Weeks 4–6)
- [ ] **6.1** Large-trade feed (Kalshi + Polymarket) with net-after-fees & settlement context.
- [ ] **6.2** Polymarket wallet cards with calibration score.
- [ ] **6.3** Shadow Mode with Rule 4.41 disclosure; no order routing anywhere in code path. *Accept:* grep for any order-placement API call = 0.

### PHASE 7 — Monetization, service & distribution (Weeks 4–6)
- [ ] **7.1** Clerk Billing plans + gates (Part 4).
- [ ] **7.2** `/help` center, Aria→human escalation, SLA tagging by plan.
- [ ] **7.3** Discord launch + moderation rules; feedback/voting board; public changelog.
- [ ] **7.4** Widgets (3.9) + `/widgets` gallery + white-label flag.
- [ ] **7.5** `/developers` (OpenAPI, `llms.txt`, `agents.md`, MCP card), free + Builder keys, rate limits.
- [ ] **7.6** `/institutional` segmented page + book-a-call.
- [ ] **7.7** Flight Instructor booking + coach console (consent-gated), "do not advise" policy flow.
- [ ] **7.8** Weekly Mission Brief email + monthly Proof Report automation.

### PHASE 8 — Mobile polish (Weeks 6–8)
- [ ] **8.1** PWA manifest, icons, offline shell, install prompt, web push.
- [ ] **8.2** Share-sheet intake (Web Share Target API).
- [ ] **8.3** Haptics + reduced-motion handling.
- [ ] **8.4** Capacitor wrapper prepared but **not submitted** until founder approval and D30 retention ≥ 25%.

### PHASE 9 — Measure (ongoing)
Admin KPI dashboard (founder-only): Free Checks/day · Check→signup · signup→trial · trial→paid · churn · **avoidable cost saved per user/month (north-star)** · % trades with pre-flight check · median calibration improvement · tilt cooldowns respected · API MRR · feed latency & settlement completeness.

---

## PART 7 — Copy library (use verbatim)
- Hero: **Trade like a pilot, not a passenger.**
- Cost: **The fee is the house edge you control.**
- Settlement: **Kalshi settles on the index, not your app.**
- Deck: **Get sharper every trade.**
- Proof: **We publish when the market beats us.**
- Institutional: **Neutral data for desks.**
- Aria refusal: *"I can't tell you what to trade, but I can show you exactly what this one costs and how it settles — want me to run it?"*
- Footer: *QuanterraOS is an independent analytics tool by Quantara Global LLC. We don't place trades, hold funds, or give investment advice. Calculations use public data and published fee schedules and may be delayed or wrong — verify with your exchange. Prediction-market trading can lose money. 18+. Kalshi, Polymarket, CME CF BRTI and other names are trademarks of their owners; we're not affiliated with them.*

---

## PART 8 — Founder decisions required (not for Antigravity)
1. Counsel review: alerts, coaching, Shadow Mode, any future signals tier.
2. CF Benchmarks licensing for displaying BRTI values.
3. EIN → Stripe → Clerk Billing.
4. Approve pricing (Part 4).
5. Referral revenue from exchanges: recommend **no**, to protect independence.
6. Hire/contract 1–2 Flight Instructors; approve coaching script.

---

## Appendix — Sources for competitor facts
- Oddpool site (pricing: free 1,000 req/mo, Pro $30, Premium $100; institutional segments; `llms.txt`) — oddpool.com; Kalshi acquisition — cryptorank.io, Sept 2026
- Stand.trade — pm.wiki/projects/stand-trade
- Unusual Predictions — bonus.com review; mexc.com news
- Verso — pm.wiki compare pages
- Kalshinomics — kalshinomics.com; bonus.com review
- Polymarket Analytics — polymarketanalytics.com
- 0xinsider — 0xinsider.com
- Predictu, Auspex Terminal — pm.wiki/projects
- Dome → Polymarket, APIs EOL Apr 28 2026 — docs.domeapi.io
- Kalshi fee formula — allium.so; pm.wiki
