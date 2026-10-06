# Kalshi Contract Specialization Guide: 15-Minute & 1-Hour Above/Below

**Status:** Specialized Institutional Architecture (6 October 2026)  
**Governing Standard:** CFTC Regulated Event Contracts & QuanterraOS Quantitative Discipline (Rule B5)

---

## 1. Executive Overview

QuanterraOS specializes directly in high-velocity, short-duration Bitcoin prediction market contracts traded on **Kalshi** (CFTC-regulated designated contract market). 

Traders in these markets face non-linear transaction costs and time decay. QuanterraOS provides independent measurement, basis surveillance, and mathematical expected value (EV) evaluation across Kalshi's two primary short-duration contract families:
1. **15-Minute Above/Below:** Series `KXBTC15M`
2. **1-Hour Above/Below:** Series `KXBTCD`

Both series settle strictly on the **CME CF Bitcoin Real-Time Index (BRTI)** calculated over the final 60 seconds of the contract window.

---

## 2. Contract Specifications Matrix

| Dimension | 15-Minute Contracts (`KXBTC15M`) | 1-Hour Contracts (`KXBTCD`) |
| :--- | :--- | :--- |
| **Series Ticker** | `KXBTC15M` | `KXBTCD` |
| **Market Title Format** | *"BTC price up in next 15 mins?"* | *"Bitcoin price on [Date]?"* |
| **Cadence / Frequency** | Every 15 minutes (:00, :15, :30, :45) | Hourly at top of the hour (:00 UTC) |
| **Strike Structure** | **At-Open Relative:** Strike is established at window open | **Fixed Dollar Ladder:** Strikes in $100 increments (e.g. $85,000, $85,100, etc.) |
| **Binary Direction** | **Above (YES):** $P_{\text{settle}} > S_{\text{open}}$<br>**Below (NO):** $P_{\text{settle}} \le S_{\text{open}}$ | **Above (YES):** $P_{\text{settle}} > K$<br>**Below (NO):** $P_{\text{settle}} \le K$ |
| **Settlement Reference** | CME CF BRTI 60-second simple average before close | CME CF BRTI 60-second simple average before top of the hour |
| **Payout Mechanics** | $1.00 per winning contract, $0.00 for losing contract | $1.00 per winning contract, $0.00 for losing contract |
| **Exchange Taker Fee** | $0.07 \times P \times (1 - P)$ | $0.07 \times P \times (1 - P)$ |
| **Peak Fee Level** | 1.75¢ per contract at $P = 0.50$ | 1.75¢ per contract at $P = 0.50$ |

---

## 3. The CME CF BRTI Settlement Rule

Both `KXBTC15M` and `KXBTCD` resolve using the official CF Benchmarks / CME Group index methodology:
$$\bar{P}_{\text{settlement}} = \frac{1}{60} \sum_{t=1}^{60} \text{BRTI}_t$$

- Sixty individual 1-second snapshots of the CME CF BRTI are recorded during the final minute before expiration.
- The simple arithmetic mean determines binary settlement.
- **Payoff Rule:**
  - If $\bar{P}_{\text{settlement}} > \text{Strike}$, **YES settles at $1.00** and **NO settles at $0.00**.
  - If $\bar{P}_{\text{settlement}} \le \text{Strike}$, **NO settles at $1.00** and **YES settles at $0.00**.

*Note: QuanterraOS tracks the constituent median spot price across Coinbase, Kraken, Bitstamp, and Gemini as an empirical approximation of spot conditions. The official BRTI is proprietary to CME Group / CF Benchmarks.*

---

## 4. Transaction Friction & Mathematical Drag

### 4.1. Non-Linear Kalshi Taker Fee Formula
$$\text{Fee}(P) = \lceil 0.07 \times P \times (1 - P) \times 100 \rceil / 100$$

The fee curve is strictly parabolic:
- At extremes ($P = 0.05$ or $P = 0.95$): Fee $\approx 0.33¢$ per contract.
- At the 50/50 moneyness inflection ($P = 0.50$): Fee peaks at **1.75¢ per contract**.

### 4.2. Total Entry Drag (Fees + Half-Spread)
$$\text{Drag}_{\text{entry}} = \text{Fee}(P) + \frac{\text{Spread}}{2}$$
With a standard 2¢ bid-ask spread and 1.75¢ taker fee, a trader at 50¢ incurs **2.75¢ of frictional drag per contract** on entry.

### 4.3. Required Breakeven Win Rate
$$\text{Breakeven Win Rate} = \frac{P_{\text{entry}} + \text{Drag}_{\text{entry}}}{\$1.00}$$
- A trader entering at 50¢ requires a **52.75% win rate** simply to break even.
- A 51.5% "edge" loses money monotonically after fees.

---

## 5. Microstructure Differences: 15M vs 1H

### 15-Minute Contracts (`KXBTC15M`)
- **Queue Dynamics:** Shorter time to resolution concentrates liquidity in top-of-book depth.
- **Surface Evolution:** Calibration drift peaks in minutes 1–4 before converging towards resolution in minutes 11–14.
- **Model Disadvantage:** As established in canonical backtests across 1,316 settled windows, the Kalshi market mid-price beats statistical fair-value models at all checkpoints.

### 1-Hour Contracts (`KXBTCD`)
- **Strike Ladder:** Dozens of strikes open concurrently across the price distribution ($100 spacing).
- **Moneyness Migration:** Bitcoin spot drift ($S - K$) produces shifting delta and non-linear theta decay across the hour.
- **Order-Book Distribution:** Liquidity clusters at round strikes near current spot (At-The-Money) and spreads thin at out-of-the-money tails.

---

## 6. Regulatory & Operational Guardrails

- **CFTC Rule 4.41 Compliance:** All backtests, models, and simulations represent hypothetical performance with inherent limitations.
- **Rule B5 Enforced:** Zero live capital is deployed by QuanterraOS algorithms ($0.00 exposure). The execution circuit is permanently locked in research/standby mode.
