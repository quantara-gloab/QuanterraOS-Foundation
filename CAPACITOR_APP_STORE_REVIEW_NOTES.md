# QuanterraOS — Native App Store Review Notes & Regulatory Dossier
**Application:** QuanterraOS Flight Deck  
**Developer:** Quantara Global LLC (Wilmington, DE)  
**Target Platforms:** Apple App Store (iOS/iPadOS) · Google Play (Android)  
**Primary Category:** Finance  
**Secondary Category:** Reference / Utilities  

---

## 1. Executive Summary & Product Classification
QuanterraOS is a **decision-support analytics and market telemetry tool** designed for market participants researching event contract markets (Kalshi and Polymarket).

**Critical Classification Clarifications:**
1. **Analytics-Only:** QuanterraOS is **not an exchange, broker, bookmaker, or gambling operator**.
2. **Zero Live Capital Exposure ($0.00):** The application contains **zero trade routing, zero order placement, zero deposit custody, and zero wallet funding**. (Hardcoded Rule B5 permanent circuit breaker).
3. **Pure Arithmetic & Published Benchmarks:** All tools (True-Cost Check, Rounding Optimizer, Maker/Taker Saver) compute discrete arithmetic based on publicly published CFTC fee schedules and the CME CF BRTI index.

---

## 2. Compliance with Apple App Store Review Guidelines

### 2.1 Guideline 5.3 — Gaming, Gambling, and Lotteries
- **Non-Gambling Declaration:** QuanterraOS **does not facilitate real-money gambling, sports betting, prediction market execution, or lotteries**.
- **No Betting Functionality:** Users cannot place bets, purchase contracts, fund betting balances, or withdraw funds in the app.
- **No Edge or Profit Promises:** Marketing and copy strictly adhere to non-advisory boundaries. The application never claims an "edge", "sure thing", "guaranteed profit", or "winning signals". In fact, QuanterraOS publishes audited data showing that the market mid-price beats internal models (`/proof`).

### 2.2 Guideline 3.1.1 — In-App Purchase & Business Model
- QuanterraOS operates on a multi-tier SaaS model for analytical tooling (Cadet free tier, Pilot and Commander subscriptions).
- No currency or tokens that can be exchanged for real money are sold in the app.
- Experience points (XP) earned within the Flight Deck are strictly non-monetary and unlock only visual cosmetic themes (HUD skins and badges). XP is earned solely through disciplined pre-flight checklist completion and calibration review — never through trading volume or financial returns.

---

## 3. Compliance with Google Play Developer Policies

### 3.1 Real-Money Gambling Policy
- QuanterraOS is categorized under **Finance**, not Gambling.
- The app contains no mechanisms to accept or stake currency on real-world outcomes.
- QuanterraOS complies with responsible trading standards (Part 3.6): including voluntary 18+ age verification, user-defined loss limit reminders, and a 15-minute cognitive tilt cooldown overlay.

---

## 4. App Store Reviewer Test Guide & Verification Walkthrough

To review the core features of the QuanterraOS Flight Deck:

### Step 1: Free Unauthenticated Analytics (Public Site)
- **True-Cost Check (`/check`):** Tap "Free Check". Enter 10 contracts at 51¢. Observe the discrete breakdown of exchange taker fees and required breakeven probabilities.
- **Settlement Radar (`/radar`):** Observe the live 60-second TWAP calculation of the CME CF BRTI index against constituent exchange spot prices (Coinbase, Kraken, Bitstamp, Gemini). Note the methodology disclosure explaining that Kalshi contracts settle on the benchmark TWAP, not instantaneous retail spot prices.
- **Audited Proof Ledger (`/proof`):** Review the 1,316 settled contract calibration corpus with Brier scores and Murphy/Yates decompositions.

### Step 2: Flight Deck Cockpit (`/deck`)
- Tap "Enter Flight Deck" or use demo reviewer credentials:
  - **Email:** `reviewer@quanterraos.com`
  - **Role:** Pilot Reviewer (Read-Only Demo Mode)
- **Navigation Station:** Tap the Navigation tab to inspect the strike ladder and 60-second TWAP sub-interval visualizer.
- **Engineering Station:** Tap the Engineering tab to inspect the Maker/Taker Saver and Rounding Optimizer.
- **Mission Log Station:** Tap the Mission Log to inspect trade thesis logging and calibration review. Observe the mandatory CFTC Rule 4.41 hypothetical performance disclosure.
- **Hangar Station:** Tap the Hangar tab to view voluntary responsible-trading boundaries, session limit controls, and helpline resources (1-800-GAMBLER).

---

## 5. Submittal Gate Requirements (Part 3.11 / Task 8.4)
Per QuanterraOS Master Blueprint Part 3.11 and Task 8.4:
> "Capacitor wrapper prepared but **not submitted** until founder approval and D30 retention ≥ 25%."

Native binary submission to App Store Connect and Google Play Console is programmatically gated by `canSubmitNativeApp()` in `src/lib/capacitor-wrapper.ts`. Submission requires:
1. Written founder approval from Quantara Global LLC.
2. Verified 30-day cohort retention (D30) of at least 25% on the PWA surface.

---

## 6. Official Contact for App Review Queries
**Quantara Global LLC**  
Wilmington, Delaware  
- Reviewer Support Hotline: `compliance@quanterraos.com`
- Founder Direct: `founder@quantara.global`
