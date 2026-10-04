# Spot Venue Verification & Ingestion Matrix

**Status:** Reviewed & Audited (4 October 2026)  
**Governing Policy:** HANDOFF.md Section D2 & Rule B10 (Third-Party Marks & Terms)

---

## 1. Executive Summary

QuanterraOS calculates an independent, volume-weighted composite spot price to monitor basis and spread against prediction market contracts (specifically Kalshi's `KXBTC15M` series). In compliance with HANDOFF.md Section D2, all candidate spot venues must be evaluated for:
1. **US Host Reachability:** AWS Lightsail host located in `us-east-1` (IP `172.26.2.42` / public `100.57.177.136`).
2. **Terms of Service & API Redistribution Rights:** Permitted use of public market data feeds without proprietary redistributor violations.
3. **Draco Quality Standards:** Sub-second latency, depth reliability, and cross-venue median alignment.

---

## 2. Venue Evaluation Matrix

| Venue | Primary Protocol | Endpoint | US Geo-Reachable (AWS us-east-1) | Terms Permit Public Data Read | Inclusion Status | Rationale / Restrictions |
|---|---|---|---|---|---|---|
| **Coinbase** | WebSocket / REST | `wss://ws-feed.exchange.coinbase.com` / `api.exchange.coinbase.com` | **YES** | **YES** | **ACTIVE (Tier 1)** | Core US liquid venue; CME CF BRTI constituent exchange. |
| **Kraken** | WebSocket / REST | `wss://ws.kraken.com/v2` / `api.kraken.com` | **YES** | **YES** | **ACTIVE (Tier 1)** | Core US liquid venue; CME CF BRTI constituent exchange. |
| **Bitstamp** | WebSocket / REST | `wss://ws.bitstamp.net` / `www.bitstamp.net/api` | **YES** | **YES** | **ACTIVE (Tier 1)** | Longstanding liquid European/US spot book; CME CF BRTI constituent exchange. |
| **Gemini** | WebSocket / REST | `wss://api.gemini.com/v1/marketdata` / `api.gemini.com` | **YES** | **YES** | **ACTIVE (Tier 1)** | NYDFS-regulated US venue; CME CF BRTI constituent exchange. |
| **Binance.US** | REST / WebSocket | `api.binance.us` | **YES** | **CONDITIONAL** | **CANDIDATE (Tier 2)** | Reachable, but liquidity is fragmented compared to Tier 1 venues. Not a BRTI constituent. Secondary verification only. |
| **OKX** | REST / WebSocket | `www.okx.com/api` | **NO (Blocked)** | **NO** | **EXCLUDED** | Geo-blocks US IP addresses (HTTP 451/403). Terms explicitly prohibit US connections and entities. |
| **Bybit** | REST / WebSocket | `api.bybit.com` | **NO (Blocked)** | **NO** | **EXCLUDED** | Geo-blocks US IP addresses. Strict exclusion of US jurisdiction. |
| **Binance.com** | REST / WebSocket | `api.binance.com` | **NO (Blocked)** | **NO** | **EXCLUDED** | Strictly geo-blocks US connections. Non-US regulatory domain. |

---

## 3. Active Constituents (Quanterra BTC Composite v0.1)

Per Section F1, the composite index requires a minimum of **3 active, non-stale, non-outlier venues** to emit a published price:

1. **Coinbase** (`BTC-USD`)
2. **Kraken** (`XBT/USD`)
3. **Bitstamp** (`BTC/USD`)
4. **Gemini** (`BTC/USD`)

All four active venues are constituent exchanges of the CME CF Bitcoin Reference Rate (BRR) and Real-Time Index (BRTI).

---

## 4. Draco Data-Quality Gate Rules

Data ingestion services must enforce the Draco quality filters prior to writing to `spot_ticks` or aggregating into `btc_index_ticks`:

1. **Stale Tick Filter (`stale_flag = 1`):**
   - Any tick older than 5,000 ms (5 seconds) from current system clock is marked stale.
   - Stale ticks are excluded from real-time composite calculations.
2. **Outlier Gate (`outlier_flag = 1`):**
   - If a venue's price deviates by more than **±0.50%** (50 bps) from the cross-venue median at the same epoch, it is flagged as an anomaly/outlier.
   - Outlier ticks are logged for audit but rejected by the composite aggregator.
3. **Minimum Quorum Rule:**
   - If fewer than 3 valid venues pass the freshness and outlier checks, the composite index status is set to **`SUPPRESSED`** (returns `null`), preventing degraded figures from displaying on public dashboards.
4. **Draco Public Health Counter:**
   - Total processed ticks, stale tick count, outlier count, and active quorum status must be tracked and surfaced at `/status` and `/api/status`.

---

## 5. Third-Party Marks & Legal Attribution

Per HANDOFF.md Rule B10:
- "Coinbase", "Kraken", "Bitstamp", and "Gemini" are trademarks of their respective owners.
- QuanterraOS is an independent measurement system and is not affiliated with, endorsed by, or sponsored by any exchange or market operator.
