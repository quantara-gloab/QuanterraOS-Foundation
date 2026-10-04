# Settlement Reference Citation & Benchmark Policy

**Series:** Kalshi KXBTC15M (Bitcoin 15-Minute Price Contracts)  
**Governing Policy:** HANDOFF.md Section D2 & Rule B10  
**Effective Date:** 4 October 2026  

---

## 1. Official Settlement Source & Specifications

Kalshi's Rulebook and Product Specifications for the `KXBTC15M` series designate the contract settlement value:

- **Settlement Benchmark:** **CME CF Bitcoin Real-Time Index (BRTI)**
- **Benchmark Administrator:** CF Benchmarks Ltd (registered under UK Benchmarks Regulation).
- **Underlying Constituents:** Real-time order book and trade data from major spot exchanges (including Coinbase, Kraken, Bitstamp, Gemini, itBit, and LMAX Digital).
- **Averaging Rule & Window:**
  - Kalshi evaluates the index value during the final sixty (60) seconds of the 15-minute contract window.
  - The settlement value is determined by the published tick or 60-second trailing calculation at the contract expiration timestamp ($T$).
  - For binary outcome contracts ($S_T \ge K$), the contract settles to 100¢ (YES) if the settlement value is greater than or equal to strike $K$, and 0¢ (NO) otherwise.

---

## 2. QuanterraOS Benchmark Designation & IP Policy

1. **Licensing Status:**
   - The CME CF Bitcoin Real-Time Index (BRTI) is a registered trademark of CME Group Index Services LLC and CF Benchmarks Ltd.
   - QuanterraOS does **NOT** hold a direct real-time commercial redistribution license from CF Benchmarks Ltd.
2. **Labeling Requirement (Non-Negotiable):**
   - Our internal multi-exchange aggregated spot benchmark must be displayed as:
     **`Quanterra BTC Composite (Approximation)`** or **`Quanterra BTC Spot Composite`**.
   - It must **NEVER** be labelled or marketed as the official BRTI.
   - Any UI element, API documentation, or table displaying this index must carry the explicit disclaimer:
     > *"Quanterra BTC Composite is an independent volume-weighted median of Tier 1 US-accessible spot exchanges (Coinbase, Kraken, Bitstamp, Gemini). It serves as an empirical approximation of spot conditions and is not the official CME CF Bitcoin Real-Time Index (BRTI). Kalshi contracts settle against the official BRTI."*
3. **Settlement Basis Tracking:**
   - Where public snapshot or tick references to BRTI are recorded from official post-settlement resolution records, they are stored with provenance (`source: "BRTI"`).
   - In live real-time monitoring (`/spread` and `/index`), the basis between Quanterra Composite and Kalshi's contract implied prices is measured and reported with explicit methodology.
