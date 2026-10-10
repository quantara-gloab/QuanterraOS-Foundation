/**
 * CME CF BRTI Licensing & Settlement Display Configuration
 *
 * Implements Phase 2 Task 2.7:
 * "Verify BRTI display licensing; if not licensed, display 'settlement-index proxy'
 * from constituent exchanges with methodology note."
 *
 * In accordance with Part 8 (Decision #2: "CF Benchmarks licensing for displaying BRTI values"),
 * raw proprietary index values require an active enterprise display license from CF Benchmarks Ltd.
 * Until commercial licensing is completed and verified, QuanterraOS computes and displays an
 * independent settlement-index proxy derived directly from the underlying constituent exchanges
 * (Coinbase, Kraken, Bitstamp, Gemini).
 */

export interface BrtiLicensingMetadata {
  isLicensed: boolean;
  status: "LICENSED" | "UNLICENSED_PROXY";
  label: string;
  shortLabel: string;
  fullTitle: string;
  settlementSourceLabel: string;
  constituentExchanges: readonly string[];
  methodologyNote: string;
  trademarkDisclaimer: string;
}

export const BRTI_CONSTITUENT_EXCHANGES = [
  "Coinbase Pro",
  "Kraken",
  "Bitstamp",
  "Gemini",
] as const;

export const BRTI_PROXY_METHODOLOGY_NOTE =
  "Methodology Note: Kalshi KXBTC15M contracts settle against the official CME CF Bitcoin Real-Time Index (BRTI) 60-second TWAP. Due to CF Benchmarks proprietary index licensing requirements (commercial display licensing pending founder execution), QuanterraOS calculates and displays an independent real-time settlement-index proxy derived from the underlying constituent spot exchanges (Coinbase, Kraken, Bitstamp, Gemini).";

export const BRTI_TRADEMARK_DISCLAIMER =
  "CME CF Bitcoin Real-Time Index (BRTI) is a registered trademark of CF Benchmarks Ltd and CME Group Inc. QuanterraOS is an independent analytics platform and is not affiliated with, endorsed by, or sponsored by CF Benchmarks Ltd or CME Group Inc.";

/**
 * Returns true if CF Benchmarks commercial display licensing has been verified.
 */
export function isBrtiLicensed(): boolean {
  return process.env.CF_BENCHMARKS_LICENSED === "true";
}

/**
 * Returns complete display metadata and methodology notes based on current licensing verification.
 */
export function getBrtiDisplayMetadata(): BrtiLicensingMetadata {
  const licensed = isBrtiLicensed();

  if (licensed) {
    return {
      isLicensed: true,
      status: "LICENSED",
      label: "CME CF BRTI",
      shortLabel: "BRTI",
      fullTitle: "CME CF Bitcoin Real-Time Index (BRTI)",
      settlementSourceLabel: "CME CF BRTI 60s TWAP",
      constituentExchanges: BRTI_CONSTITUENT_EXCHANGES,
      methodologyNote:
        "Official CME CF Bitcoin Real-Time Index (BRTI) real-time feed licensed under enterprise agreement with CF Benchmarks Ltd and CME Group.",
      trademarkDisclaimer: BRTI_TRADEMARK_DISCLAIMER,
    };
  }

  return {
    isLicensed: false,
    status: "UNLICENSED_PROXY",
    label: "Settlement-Index Proxy",
    shortLabel: "Settlement Proxy",
    fullTitle: "Settlement-Index Proxy (Constituent Composite)",
    settlementSourceLabel: "Settlement-Index Proxy (BRTI Constituents)",
    constituentExchanges: BRTI_CONSTITUENT_EXCHANGES,
    methodologyNote: BRTI_PROXY_METHODOLOGY_NOTE,
    trademarkDisclaimer: BRTI_TRADEMARK_DISCLAIMER,
  };
}
