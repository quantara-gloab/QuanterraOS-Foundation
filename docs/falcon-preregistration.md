# Falcon Research Program: Formal Pre-Registration Specification

**Status:** PRE-REGISTERED · ACTIVE RESEARCH GATE  
**Date of Pre-Registration:** 2026-10-04  
**Target Program:** Order-Book Depth Imbalance Heuristic (Falcon)  
**Governing Policy:** QuanterraOS Handover Rule B5 (Zero Live Capital) & Section H  

---

## 1. Executive Summary & Purpose

This pre-registration document permanently fixes the hypothesis, evaluation methodology, success criteria, and stopping rules for **Falcon** before further order-book depth data is accrued.

Under QuanterraOS engineering principles, no trading signal, execution pipeline, or marketing claim may be deployed without pre-registered statistical validation. Until the criteria specified in this document are satisfied over held-out out-of-sample data, Falcon remains strictly classified as an internal research experiment.

---

## 2. Research Hypothesis

**Formal Hypothesis:**  
Microstructure depth imbalance extracted from Kalshi L2 order books at minute 4 of a 15-minute Bitcoin contract (`KXBTC15M`) contains statistically significant incremental information over the contemporaneous market mid-price, achieving a lower Brier score than the market mid-price after accounting for exchange taker fees.

**Null Hypothesis ($H_0$):**  
$BSS_{\text{market\_mid}} \le 0$  
The forecast probability produced by Falcon does not outperform the Kalshi market mid-price out-of-sample, and produces zero or negative economic value after execution fees.

---

## 3. Fixed Heuristic Specification (Frozen Parameters)

The algorithmic specification of Falcon is frozen as implemented in `src/agents/falcon.ts` and will not be tuned, re-parameterized, or post-hoc fitted to backtest results:

1. **Input Features:**
   - Top-of-book imbalance: $(Q_{\text{yes\_bid}} - Q_{\text{no\_bid}}) / (Q_{\text{yes\_bid}} + Q_{\text{no\_bid}})$
   - Depth imbalance (across available levels): $(D_{\text{yes}} - D_{\text{no}}) / (D_{\text{yes}} + D_{\text{no}})$
2. **Fixed Formulation:**
   $$\hat{p} = \text{clamp}(0.5 + 0.3 \times \text{depth\_imbalance}, 0.05, 0.95)$$
   - Sensitivity factor: **0.3** (fixed *a priori*, unlearned).
   - Conservative probability clamps: **[0.05, 0.95]**.
   - Evidence aggregation window: Most recent **5** valid L2 snapshots captured before the contract checkpoint.
3. **Evaluation Checkpoint:**
   - **Minute 4** (240 seconds from market open, $\pm 60$ seconds matching tolerance).

---

## 4. Benchmark & Metrics

Falcon is benchmarked against two standards:
1. **Primary Baseline:** Contemporaneous Kalshi market mid-price probability at minute 4.
2. **Secondary Baseline:** Unconditional climatology (0.2500 Brier score).

### Quantitative Metrics:
- **Brier Score:**
  $$BS = \frac{1}{n} \sum_{i=1}^n (f_i - o_i)^2$$
  where $f_i \in [0, 1]$ is the forecast and $o_i \in \{0, 1\}$ is the settled CME CF BRTI contract outcome.
- **Brier Skill Score (BSS) vs. Market Mid:**
  $$BSS = 1 - \frac{BS_{\text{falcon}}}{BS_{\text{market\_mid}}}$$
- **95% Bootstrap Confidence Interval:**
  Computed across 2,000 resamples (fixed seed `42`).

---

## 5. Sample Size Threshold & Stopping Rules

- **Minimum Sample Size Threshold ($n$):** **500 settled, verified contracts**.
- **Data Source:** Verified live collection stored in SQLite `market_snapshots` and `market_outcomes` with `PRAGMA integrity_check = ok`, strictly following the clean-cutoff timestamp (`data/orderbook-valid-from-ms.txt`).
- **Interim Evaluation Rule:** Daily automated evaluation runs via `quanterra-falcon-eval.timer`. Results are logged to `reports/falcon-backtest-YYYY-MM-DD.txt`. Interim reads with $n < 500$ are reported as *provisional research status* and cannot authorize deployment or public copy promotion.

---

## 6. Pre-Registered Success Criteria

To achieve graduation from Research to Production Execution consideration, Falcon must achieve **all three** of the following conditions across the $n \ge 500$ sample:

1. **Brier Skill Superiority:**
   $$BSS_{\text{market\_mid}} > 0$$
2. **Statistical Significance:**
   The 95% bootstrap confidence interval of $(BS_{\text{market\_mid}} - BS_{\text{falcon}})$ must **strictly exclude zero** (lower bound $> 0$).
3. **Economic Viability After Taker Fees:**
   Simulated trading on model edge must yield positive net expected value after applying Kalshi's fee schedule:
   $$\text{Fee}(p) = 0.07 \times p \times (1 - p)$$

---

## 7. Current Empirical Baseline (as of 2026-10-04)

- **Audited Sample Size:** $n = 31$ settled markets (`reports/falcon-backtest-2026-10-03.txt`).
- **Falcon Brier Score:** **0.2736**
- **Market Mid Brier Score:** **0.2106**
- **Naive Baseline:** **0.2500**
- **Current Read:** **FAIL / UNDERPERFORMING** (Falcon currently underperforms random guessing and significantly underperforms the market mid-price).

---

## 8. Governance Commitments

- **Rule B5 Enforced:** Under no circumstances will live orders be routed or live capital deployed based on Falcon heuristics ($0.00 live exposure).
- **Public Copy Restrictions:** Until all Section 6 criteria are met over $n \ge 500$ markets, Falcon is described in public copy strictly as *"Order-Book Depth Monitoring (research)"*. No claim of predictive edge or execution alpha may be published.
