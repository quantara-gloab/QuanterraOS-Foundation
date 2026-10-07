# Prediction Market Contract Mapping & Settlement Discrepancy Policy

**Series:** Short-Duration Bitcoin Contracts (Kalshi vs. Polymarket)  
**Governing Policy:** HANDOFF.md Section G (Cross-Venue Divergence Monitor) & Rule B4/B5  
**Effective Date:** 6 October 2026  

---

## 1. Scope & Objective

This document establishes the official cross-venue contract mapping specifications for QuanterraOS's Cross-Venue Divergence Terminal (`/compare`) and API (`/api/venues/compare`). 

Per **HANDOFF.md Section G1**, contracts from different prediction venues are compared **only where** the underlying economic exposure, strike definitions, window durations, and settlement criteria are systematically mapped and audited. Unmatched contracts are excluded.

---

## 2. Venue Specifications & Microstructure Comparison

| Dimension | Kalshi (`KXBTC15M` / `KXBTCD`) | Polymarket (`BTC 15M` / `BTC 5M`) |
| :--- | :--- | :--- |
| **Regulatory Jurisdiction** | United States (CFTC-Designated Contract Market) | Decentralized / Offshore (Polygon Network) |
| **Settlement Currency** | United States Dollar (USD via Bank ACH / Wire) | Bridged USD Coin (USDC on Polygon PoS) |
| **Cadence & Window** | 15-Minute Fixed Intervals (`:00`, `:15`, `:30`, `:45` UTC) | 15-Minute and 5-Minute Continuous Windows |
| **Strike Formulation** | Absolute Price Threshold ($S_T \ge K$) | Relative Price Direction ("Up/Down" vs Start Price) or Fixed Strike |
| **Settlement Oracle** | **CME CF Bitcoin Real Time Index (BRTI)** | **Binance / Coinbase Composite via UMA Oracle** |
| **Settlement Averaging** | 60-Second TWAP immediately preceding expiry ($T$) | Point-in-time spot or 60s TWAP reported by UMA Proposers |
| **Resolution Time** | Deterministic math (~3 minutes post-expiration) | Optimistic Liveness Window (~2 hours dispute period) |
| **Dispute Rate** | 0.00% (Deterministic exchange rulebook) | ~0.35% (Ambiguous or contested oracle challenges) |
| **Taker Fee Formula** | $\lceil 0.07 \times \text{count} \times P \times (1-P) \rceil$ (Capped at 1.75¢/ct) | 0.0% protocol fee; ~0.5¢/ct effective maker/taker slippage |
| **Network Gas / Bridge Friction** | $0.00 (Standard Web2 ACH/Wire banking) | ~$0.15 flat gas ($0.08 for orders $\ge 50$ ct) + bridge overhead |

---

## 3. Settlement Oracle Divergence & Basis Risk

Traders must account for structural basis risk between the two venues' settlement mechanisms:

1. **CME CF BRTI (Kalshi):**
   - Regulated benchmark administered by CF Benchmarks Ltd.
   - Calculated by aggregating order books of eligible spot constituent exchanges (Coinbase, Kraken, Bitstamp, Gemini, itBit, LMAX).
   - Resistant to single-exchange flash crashes or wick manipulation due to volume-weighted multi-exchange median filtering.

2. **UMA Optimistic Oracle (Polymarket):**
   - Proposers assert the settlement value based on Binance, Coinbase, or CoinGecko spot data.
   - If an assertion is challenged, resolution escalates to UMA tokenholder voting over a 48–72 hour window.
   - Historical dispute analysis shows a 0.35% contested resolution frequency across crypto prediction markets.

**Rule:** QuanterraOS displays settlement risk as:
- **Kalshi:** `LOW` (Deterministic TWAP, regulated rulebook).
- **Polymarket:** `MODERATE` (UMA 2-hour dispute window and decentralized oracle latency).

---

## 4. Fee & Friction Calculation Model

Per **HANDOFF.md Section G2**, all divergence metrics must account for all-in transaction costs on both venues.

### Kalshi All-In Cost:
$$\text{Cost}_{\text{Kalshi}} = (\text{Price} \times \text{Count}) + \text{Ceil}(0.07 \times \text{Count} \times \text{Price} \times (1 - \text{Price}))$$
$$\text{Breakeven}_{\text{Kalshi}} = \text{Price} + \frac{\text{Fee}_{\text{Kalshi}}}{\text{Count}}$$

### Polymarket All-In Cost:
$$\text{Cost}_{\text{Polymarket}} = (\text{Price} \times \text{Count}) + (0.005 \times \text{Count}) + \text{Gas}_{\text{amortized}}$$
$$\text{Breakeven}_{\text{Polymarket}} = \text{Price} + 0.005 + \frac{\text{Gas}_{\text{amortized}}}{\text{Count}}$$
Where:
- $\text{Gas}_{\text{amortized}} = \$0.15$ for $\text{Count} < 50$
- $\text{Gas}_{\text{amortized}} = \$0.08$ for $\text{Count} \ge 50$

---

## 5. Required Disclaimers & Copy Guardrails

Per **Rule B4** and **Rule B5**:
1. Differences in implied probabilities between Kalshi and Polymarket are labeled **"DIVERGENCE"**, **NEVER "ARBITRAGE"** or "free lunch".
2. The UI must state that divergence reflects:
   - Differences in exchange fees and network gas drag.
   - Settlement benchmark discrepancies (CME CF BRTI TWAP vs. UMA Optimistic Oracle).
   - Liquidity depth and order book execution slippage.
   - Regulatory and geographic access restrictions.
3. Neither calculation constitutes an offer, solicitation, or recommendation to trade.
