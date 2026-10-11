# QuanterraOS Elite Eleven — Implementation & Technical Handoff Document

**Owner:** Michael Quanterra  
**Revision:** 10 October 2026  
**Document Status:** Complete Implementation Handoff & Generated Design Package  
**Supersedes:** 144- and 81-piece active gallery plans  

---

## 1. Executive Summary & Identity Architecture

This revision implements **The Elite Eleven** as the unified product identity for QuanterraOS across web, mobile, decision workspaces, and creative collections.

### Exactly Eleven Members (Not Twelve)
1. **Michael Quanterra (Founder & Creator)**:
   - **Visual Signature:** Capital **M on helmet forehead**, entirely digital LED face, violet star eyes, cyan smile, black/pearl/gold founder suit.
   - **Product Responsibility:** Founder story and creative provenance. Brand character and architectural guide, *never a trading engine or execution algorithm*.
2. **Quanta (Assistant & Global Galactic Leader)**:
   - **Visual Signature:** Paired green up arrow and pink down arrow LED eyes together, violet smile, gold crown and purple orb.
   - **Product Responsibility:** Orchestration, explanation, and persistent flight guide.
3. **Quantana (Queen & Companion)**:
   - **Visual Signature:** Violet curved smiling eyes, celestial tiara, cosmic ribbon veil.
   - **Product Responsibility:** Onboarding, education, and Queen collection host. *Distinct identity; not a rename of Quanta.*
4. **Draco (Data Quality Specialist)**: Amber angular eyes, red dragon crest. Checks feeds for anomalies, missing prints, and outliers.
5. **Wolf (Order Book & Liquidity Specialist)**: Ice-cyan chevrons, wolf fins. Analyzes queue depth, bid-ask spreads, and realistic slippage.
6. **Falcon (Short-Horizon Research Specialist)**: Electric blue wing eyes, aerodynamic fins. Computes timestamped probabilistic distributions on calibrated horizons.
7. **Quantum Fox (Calibration & Uncertainty Auditor)**: Violet diamond eyes, fox fins. Evaluates out-of-sample calibration, reliability curves, and Brier scores.
8. **Sentinel (Feed Health & Risk Monitor)**: Green hexagon eyes, diagnostic shield. Tracks socket staleness, sequence gaps, and circuit breaker states.
9. **Kraken (Basis & Settlement Rules Specialist)**: Aqua spirals, sensor arms. Audits CME CF BRTI index calculation, UMA oracle rules, and contract boundary conditions.
10. **Lion (Synthesis & Disagreement Summarizer)**: Amber sun discs, mechanical solar mane. Synthesizes conflicting inputs and highlights model divergences.
11. **Phoenix (Recovery & Incident Guardian)**: Coral pink curved eyes, feather crest. Manages reconnection states, gap refills, and failover diagnostics.

*Note on Statistical Honesty:* Multiple character stations agreeing does not constitute independent statistical evidence. UI stations represent analytical explainers over bounded underlying data.

---

## 2. Asset Allocation & Master Files

All 58 master assets are generated as valid PNGs on disk with SHA-256 validation in `asset-validation.json`:

### The 44 Art Collection (`q44-001` through `q44-044`)
- Located in: `assets/art-44/` and `public/assets/art-44/`
- Four Chapters (11 artworks each):
  1. **Origin Command** (`q44-001` to `q44-011`)
  2. **Cosmic Street** (`q44-012` to `q44-022`)
  3. **Executive Orbit** (`q44-023` to `q44-033`)
  4. **Royal Ascension** (`q44-034` to `q44-044`)
- Canonical order in every chapter:
  - #1: Founder Michael Quanterra
  - #2: Leader Quanta
  - #3: Leader Quantana
  - #4–11: Specialists (Draco, Wolf, Falcon, Quantum Fox, Sentinel, Kraken, Lion, Phoenix)
- Source of truth: `asset-catalog.json`

### Apparel Concepts (13 Boards, 78 Garment Concepts)
- Located in: `assets/apparel/` and `public/assets/apparel/`
- 11 Member Boards (6 looks each):
  - `michael-apparel-board.png` (Founder M Edition)
  - `quanta-leader-apparel-board.png` (Crew Essentials)
  - `quantana-apparel-board.png` (Executive Orbit)
  - 8 Specialist Boards (`draco`, `wolf`, `falcon`, `quantum-fox`, `sentinel`, `kraken`, `lion`, `phoenix`)
- 2 Royal Galactic Boards (6 looks each):
  - `king-royal-galactic-board.png` (Imperial deep violet velvet, 24k gold leaf)
  - `queen-royal-galactic-board.png` (Astral silk, rose-gold filigree)
- 78 Concept SKUs recorded in `merchandise-catalog.json`. All flagged `concept_only`, checkout disabled, price `null`.
- 1 Campaign Portrait: `elite-eleven-campaign-portrait.png` in `assets/` and `public/assets/`.

---

## 3. Web & Mobile Routes

| Route | Implementation File | Function & State |
|---|---|---|
| `/` | `src/landing-page.ts` | Clean hero, 3-step evidence workflow, compact crew preview, footer |
| `/cockpit` | `src/cockpit-page.ts` | Decision workspace, Quanta guide, 8-specialist dock, scenario builder, Quanta Decision Receipt, View on venue link |
| `/crew` | `src/crew-page.ts` | Eleven member profiles, Founder M spotlight, product role bindings, statistical notice |
| `/art-gallery` | `src/art-gallery-44-page.ts` | Active 44 gallery, 12/page pagination, chapter/member filters, modal; link to rollback archive |
| `/art-gallery?archive=rollback` | `src/art-gallery-144-page.ts` | Preserved rollback archive for previous collections |
| `/gear` | `src/gear-page.ts` | 5 collections, 78 concepts, concept disclosures, interest modal |
| `/pricing` | `src/pricing-page.ts` | Canonical price source, actual verified tool limits |

---

## 4. Local Preview

The local interactive preview switcher is available at:
`website-mobile-preview.html`

Supports instant switching between:
- Pages: **Home**, **Cockpit**, **Gallery**, **Gear**
- Viewports: **Desktop (1440px)** and **Mobile (390px iPhone frame)**
- Interactive controls: Crew station selector, scenario YES/NO toggle, chapter filters, concept modal.

---

## 5. Verification & Testing Commands

To run all acceptance tests:
```bash
node --experimental-strip-types --test src/__tests__/elite-eleven-catalog.test.ts
```

To run core regression suites:
```bash
node --experimental-strip-types --test src/__tests__/art-144-gallery.test.ts src/__tests__/home-panels.test.ts src/__tests__/global-layout.test.ts src/__tests__/merchandise-and-gamification.test.ts
```

All 43 tests pass cleanly.
