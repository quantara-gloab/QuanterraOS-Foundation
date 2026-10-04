# QuanterraOS Institutional Index & Competitor Mathematical Formulations

This document formalizes the mathematical specifications of the top 9 institutional cryptocurrency benchmark indices and prediction market competitor mechanisms integrated into the QuanterraOS engine (`src/index-engine.ts` and `src/scoring.ts`).

---

## 1. CME CF Bitcoin Real-Time Index (BRTI)
**Standard:** Regulated benchmark for CME BTC Futures and Kalshi event contract settlement (`KXBTC15M`).  
**Core Math:** Partitioned Multi-Interval Volume-Weighted Median (VWM).

### Formulation
To protect against spoofing, latency gaming, and block manipulation within a single second, the 1-minute calculation period is split into $M = 12$ distinct 5-second observation sub-intervals:
$$T = \bigcup_{k=1}^{12} I_k, \quad |I_k| = 5\text{ s}$$

Within each sub-interval $k$, collect all constituent trades/quotes $(p_{i,k}, v_{i,k})$. The **Volume-Weighted Median** $P_k^*$ is the price satisfying:
$$\sum_{i: p_{i,k} < P_k^*} v_{i,k} \le \frac{1}{2} \sum_{i} v_{i,k} \quad \text{and} \quad \sum_{i: p_{i,k} > P_k^*} v_{i,k} \le \frac{1}{2} \sum_{i} v_{i,k}$$

The final index price is the unweighted arithmetic mean across all valid sub-interval medians:
$$P_{\text{BRTI}} = \frac{1}{|K_{\text{valid}}|} \sum_{k \in K_{\text{valid}}} P_k^*$$

**Implementation:** [`computeVolumeWeightedMedian`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts) and [`computeCmeBrtiPartitionedIndex`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 2. CoinDesk Bitcoin Price Index (XBX)
**Standard:** High-frequency spot benchmark with adaptive outlier trimming.  
**Core Math:** Median Absolute Deviation (MAD) Dynamic Trimming + Recency Exponential Decay.

### Formulation
1. **Dynamic Outlier Trim:**
   The cross-venue median is computed: $\tilde{P} = \text{median}(p_1, \dots, p_n)$.
   The Median Absolute Deviation is calculated:
   $$\text{MAD} = \text{median}\left(|p_i - \tilde{P}|\right)$$
   Constituents deviating beyond tolerance are pruned:
   $$\text{Reject if } |p_i - \tilde{P}| > \kappa \cdot 1.4826 \cdot \text{MAD}$$
   where $\kappa = 3.0$ approximates a 3-sigma normal envelope.

2. **Time-Decay Volume Weighting:**
   Each accepted venue's weight accounts for volume and age:
   $$w_i(t) = v_i \cdot \exp\left(-\frac{\ln 2}{\tau} \cdot (t - t_i)\right)$$
   where $\tau$ is the half-life parameter (e.g. 15 seconds).

**Implementation:** [`computeMedianAbsoluteDeviation`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts) and [`computeCoinDeskXbxIndex`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 3. Bloomberg Galaxy Crypto Index (BGCI)
**Standard:** Institutional multi-venue weighting with liquidity penalties and concentration limits.  
**Core Math:** Bid-Ask Spread Downweighting & 35% Iterative Constituent Capping.

### Formulation
1. **Spread Penalty Factor:**
   Venues with wide bid-ask spreads reflect lower execution certainty:
   $$\phi(s_i) = \frac{1}{1 + \frac{s_i}{s_{\text{norm}}}}, \quad s_i = \frac{p_{\text{ask}, i} - p_{\text{bid}, i}}{p_{\text{mid}, i}} \times 10^4 \text{ bps}$$
   Raw weight: $w_{i, \text{raw}} = v_i \cdot \phi(s_i)$.

2. **35% Concentration Cap:**
   No single constituent venue may exceed maximum share $w_{\max} = 0.35$. Excess weight is redistributed proportionally among uncapped venues until convergence:
   $$w_i^{(m+1)} = \min\left(w_{\max}, w_i^{(m)} + \Delta_{\text{excess}} \cdot \frac{w_i^{(m)}}{\sum_{j \notin \text{Capped}} w_j^{(m)}}\right)$$

**Implementation:** [`computeBloombergBgciIndex`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 4. S&P Cryptocurrency Indices (Lukka Prime FMV)
**Standard:** Fair Market Value (FMV) accounting and clearing standards.  
**Core Math:** Size-Weighted Order Book Clearing & Volatility Fence.

### Formulation
1. **Standardized Lot Sizing:**
   Small odd-lot trades are elevated to a standardized lot size threshold $L_0$ to prevent micro-order tick spoofing:
   $$v_i^* = \max(v_i, L_0)$$
2. **Historical Volatility Dispersion Fence:**
   A venue quote is flagged and rejected if its price deviation from the median exceeds historical realized volatility:
   $$|p_i - \tilde{P}| > \tilde{P} \cdot z_{\text{tol}} \cdot \sigma_{\text{hist}}$$
   with $z_{\text{tol}} = 2.5$.

**Implementation:** [`computeLukkaPrimeFmvIndex`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 5. Coinbase 50 Index (COIN50 / CESR)
**Standard:** Benchmark capitalization and staking yield indices.  
**Core Math:** Exponential Decay Moving Average + Harmonic Mean Skew Verification.

### Formulation
1. **Exponential Decay Moving Weight:**
   $$w_i = \exp(-\lambda \Delta t_i) \cdot v_i, \quad \lambda = \frac{\ln 2}{\tau_{1/2}}$$
2. **Harmonic Mean Divergence (Skewness Gauge):**
   Compares the volume-weighted Arithmetic Mean (AM) against the Harmonic Mean (HM):
   $$\text{AM} = \frac{\sum w_i p_i}{\sum w_i}, \quad \text{HM} = \frac{\sum w_i}{\sum \frac{w_i}{p_i}}$$
   $$\text{Skew}_{\%} = \frac{\text{AM} - \text{HM}}{\text{AM}} \times 100$$
   A significant divergence ($\text{Skew}_{\%} > 0.1\%$) signals severe downward quoting pressure or asymmetric book depth.

**Implementation:** [`computeCoinbaseDecayIndex`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 6. Pyth Network Oracle Aggregation
**Standard:** Sub-second institutional oracle pricing for high-throughput DeFi and prediction venues.  
**Core Math:** Inverse-Variance Confidence Weighting ($1/\sigma^2$) + Inter-Venue Dispersion.

### Formulation
Each publishing venue reports a price estimate $p_i$ and a 1-sigma uncertainty confidence interval $\sigma_i$.
1. **Inverse-Variance Weight:**
   $$w_i = \frac{1}{\sigma_i^2 + \epsilon}$$
   Venues with tighter spreads/uncertainties receive mathematically optimal precision weighting.
2. **Composite Confidence Interval:**
   $$\sigma_{\text{composite}} = \frac{1}{\sqrt{\sum w_i}} + \frac{1}{n} \sum_{i=1}^n |p_i - P_{\text{composite}}|$$
   Combines statistical estimation error with empirical venue dispersion.

**Implementation:** [`computePythConfidenceIndex`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 7. Chainlink Off-Chain Reporting (OCR)
**Standard:** Industry-wide decentralized oracle network consensus.  
**Core Math:** Byzantine Fault Tolerant (BFT) Sorted Median & Heartbeat Stale Gating.

### Formulation
1. **Byzantine Fault Tolerance (BFT) Committee & Quorum Verification:**
   To tolerate $f$ arbitrary Byzantine (malicious or conflicting) nodes, the total committee size $N$ must satisfy:
   $$N \ge 3f + 1$$
   *(Note: $N \ge 2f + 1$ is the lower bound for crash-fault tolerance (CFT) where nodes fail silently; tolerating Byzantine behavior strictly requires $N \ge 3f + 1$).*
   To tolerate at least $f = 1$ Byzantine failure, the committee must have at least $N = 3(1) + 1 = 4$ nodes, requiring a quorum of at least $2f + 1 = 3$ agreeing reports.
2. **Sorted Median Order Statistic:**
   Sort accepted ticks $p_{(1)} \le p_{(2)} \le \dots \le p_{(m)}$. The price is the $(f+1)$-th median order statistic.
3. **Heartbeat Staleness Filter:**
   Reject any tick where $(t_{\text{now}} - t_i) > t_{\text{heartbeat}}$ (default 5.0 seconds).

**Implementation:** [`computeChainlinkOcrIndex`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts), [`bftMinimumCommitteeSize`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts), [`bftMaxFaults`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 8. Binance / CoinMarketCap Crypto Index (CMC200)
**Standard:** Retail & derivative market global composite pricing.  
**Core Math:** Tukey's Interquartile Range (IQR) Fences + Geometric Mean.

### Formulation
1. **Tukey's Fences:**
   Compute the 25th percentile ($Q_1$) and 75th percentile ($Q_3$):
   $$\text{IQR} = Q_3 - Q_1$$
   $$\text{Acceptance Range} = [Q_1 - 1.5 \cdot \text{IQR}, \; Q_3 + 1.5 \cdot \text{IQR}]$$
2. **Volume-Weighted Geometric Mean:**
   $$\ln P_{\text{geom}} = \frac{\sum w_i \ln p_i}{\sum w_i} \implies P_{\text{geom}} = \exp\left(\frac{\sum w_i \ln p_i}{\sum w_i}\right)$$
   Protects against high-price exponential tail distortion.

**Implementation:** [`computeTukeyIqrFences`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts) and [`computeBinanceCmcIndex`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 9. Prediction Market Competitors (Polymarket / Kalshi CLOB)
**Standard:** Binary event contracts, implied probability extraction, and cross-venue spread arbitrage/divergence.  
**Core Math:** Quadratic Taker Fee Modeling + Net Tradable Divergence.

### Formulation
1. **Nonlinear Taker Fee Model:**
   For binary contracts trading on probability interval $[0, 1]$, taker fees scale with uncertainty, peaking at $P = 0.50$:
   $$f(P) = P \cdot (1 - P) \cdot \gamma_{\text{fee}}$$
   where $\gamma_{\text{fee}} = 0.07$ on Kalshi.
2. **Effective Entry Probability:**
   $$P_{\text{eff, BUY}} = P_{\text{ask}} + f(P_{\text{ask}}), \quad P_{\text{eff, SELL}} = P_{\text{bid}} - f(P_{\text{bid}})$$
3. **Net Tradable Cross-Venue Divergence:**
   $$\text{Divergence}_{\text{net}}(A, B) = \max\left(0, \; |P_{A, \text{mid}} - P_{B, \text{mid}}| - \left[ f_A(P_A) + f_B(P_B) + \frac{s_A + s_B}{2} \right] \right)$$
   Prevents phantom signals where gross probability divergence is consumed by fees and spreads.

**Implementation:** [`computePredictionMarketDivergence`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/index-engine.ts).

---

## 10. Probabilistic Calibration Mathematics (HANDOFF.md Phase 2)

Integrated in [`src/scoring.ts`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/scoring.ts):

### Murphy Decomposition
Decomposes the mean Brier score into three distinct orthogonal components:
$$\text{Brier} = \text{Reliability} - \text{Resolution} + \text{Uncertainty}$$
$$\text{Reliability} = \sum_{k=1}^K \frac{n_k}{N} (p_k - \bar{o}_k)^2 \quad (\text{measures calibration error; 0 is ideal})$$
$$\text{Resolution} = \sum_{k=1}^K \frac{n_k}{N} (\bar{o}_k - \bar{o})^2 \quad (\text{measures discriminative sorting power; higher is better})$$
$$\text{Uncertainty} = \bar{o}(1 - \bar{o}) \quad (\text{intrinsic base-rate variance of the dataset})$$

### Brier Skill Score (BSS)
$$BSS = 1 - \frac{\text{Brier}}{\text{Brier}_{\text{reference}}}$$
- Versus naive 50/50 baseline: $\text{Brier}_{\text{ref}} = 0.2500$.
- Versus climatology (base rate): $\text{Brier}_{\text{ref}} = \bar{o}(1 - \bar{o}) = 0.2498$.

### Log Loss (Cross-Entropy)
$$\text{LogLoss} = -\frac{1}{N} \sum_{i=1}^N \left[ y_i \ln(p_i) + (1 - y_i) \ln(1 - p_i) \right]$$

### Wilson Score Confidence Interval for Decile Bins
$$\text{CI}_{1-\alpha} = \frac{\hat{p} + \frac{z^2}{2n} \pm z \sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$
Ensures that decile bins with small samples ($n < 30$) do not produce overstated confidence.
