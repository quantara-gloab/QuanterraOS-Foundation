/**
 * QuanterraOS Share-Sheet Intake Engine (Web Share Target API)
 * Implements Part 3.11 & Task 8.2:
 *
 * "Share-sheet intake: user shares a Kalshi/Polymarket link to QuanterraOS ->
 *  opens Engineering with fields pre-filled."
 *
 * Supports:
 * - Direct Kalshi URLs (markets, contracts, tickers, query strings)
 * - Direct Polymarket URLs (events, markets, token IDs)
 * - Raw shared text or snippets containing contract tickers and prices
 * - Normalization into Engineering station form inputs (price, count, venue, ticker)
 *
 * Strict Compliance:
 * - Rule B4: Zero superlatives ("alpha", "win", "guaranteed").
 * - Rule B5: $0.00 live capital exposure; zero order routing.
 */

export interface ParsedSharedContract {
  isRecognized: boolean;
  venue: "kalshi" | "polymarket" | "unknown";
  ticker: string;
  marketTitle: string;
  price: number; // e.g. 0.52
  priceCents: number; // e.g. 52
  contracts: number; // e.g. 10
  strike?: number;
  assumedProbability: number;
  rawInput: string;
  detectionSource: "url_path" | "query_param" | "text_regex" | "default_fallback";
}

/**
 * Parses a raw shared URL or text snippet into structured contract inputs.
 */
export function parseSharedContractInput(rawInput: string): ParsedSharedContract {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      isRecognized: false,
      venue: "unknown",
      ticker: "KXBTC15M",
      marketTitle: "Bitcoin 15-Minute Expiry",
      price: 0.51,
      priceCents: 51,
      contracts: 10,
      assumedProbability: 0.55,
      rawInput: "",
      detectionSource: "default_fallback"
    };
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  let venue: "kalshi" | "polymarket" | "unknown" = "unknown";
  let ticker = "KXBTC15M";
  let marketTitle = "Bitcoin 15-Minute Prediction Contract";
  let price = 0.51;
  let contracts = 10;
  let strike: number | undefined;
  let detectionSource: ParsedSharedContract["detectionSource"] = "default_fallback";

  // Check URL query parameters if clean input looks like a URL
  try {
    const urlObj = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    
    // Check venue
    if (urlObj.hostname.includes("kalshi.com")) {
      venue = "kalshi";
      detectionSource = "url_path";
    } else if (urlObj.hostname.includes("polymarket.com")) {
      venue = "polymarket";
      detectionSource = "url_path";
    }

    // Check query params: e.g. ?price=54 or ?p=0.54 or ?strike=88500 or ?count=25
    const qPrice = urlObj.searchParams.get("price") || urlObj.searchParams.get("p") || urlObj.searchParams.get("ask");
    if (qPrice) {
      const num = parseFloat(qPrice);
      if (!isNaN(num)) {
        price = num > 1.0 ? num / 100 : num;
        detectionSource = "query_param";
      }
    }

    const qCount = urlObj.searchParams.get("count") || urlObj.searchParams.get("contracts") || urlObj.searchParams.get("qty");
    if (qCount) {
      const num = parseInt(qCount, 10);
      if (!isNaN(num) && num > 0) {
        contracts = num;
        detectionSource = "query_param";
      }
    }

    const qStrike = urlObj.searchParams.get("strike") || urlObj.searchParams.get("k");
    if (qStrike) {
      const num = parseFloat(qStrike);
      if (!isNaN(num)) {
        strike = num;
      }
    }

    // Inspect pathname for tickers
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    for (const part of pathParts) {
      const upperPart = part.toUpperCase();
      if (upperPart.startsWith("KXBTC") || upperPart.startsWith("INX") || upperPart.startsWith("FED")) {
        ticker = upperPart;
        marketTitle = `Kalshi ${upperPart}`;
        venue = "kalshi";
        break;
      }
      if (part.includes("bitcoin") || part.includes("btc")) {
        marketTitle = "Bitcoin Prediction Market";
        if (part.includes("15m") || part.includes("15-minute")) {
          ticker = "KXBTC15M";
        }
      }
    }

    // Check hash anchor e.g. #KXBTC15M-25OCT14-0445
    if (urlObj.hash) {
      const hashUpper = urlObj.hash.replace("#", "").toUpperCase();
      if (hashUpper.startsWith("KXBTC") || hashUpper.startsWith("INX")) {
        ticker = hashUpper;
        venue = "kalshi";
      }
    }
  } catch (_) {
    // If not a parseable URL, fall through to text regex matching
  }

  // Text Regex Matching for shared text snippets
  // 1. Ticker regex: find all matches and select the most specific (longest) contract ticker
  const tickerMatches = Array.from(clean.matchAll(/\b(KXBTC[A-Z0-9-]*|FED-[A-Z0-9-]*|CPI-[A-Z0-9-]*)\b/gi));
  if (tickerMatches.length > 0) {
    const sorted = tickerMatches.map((m) => m[1].toUpperCase()).sort((a, b) => b.length - a.length);
    const bestTicker = sorted[0];
    if (bestTicker.length >= ticker.length) {
      ticker = bestTicker;
      venue = "kalshi";
      marketTitle = `Kalshi ${ticker}`;
      detectionSource = "text_regex";
    }
  }

  // 2. Price regex: e.g. "52c", "52¢", "$0.52", "0.52", "@ 52"
  const priceMatch = clean.match(/(@\s*|\$|at\s+)?(\d{1,2}(?:\.\d{1,2})?)\s*(?:c|¢|cents|\$)/i) ||
                     clean.match(/@\s*(0\.\d{1,2}|\d{1,2})/);
  if (priceMatch) {
    const rawVal = parseFloat(priceMatch[2] || priceMatch[1]);
    if (!isNaN(rawVal)) {
      price = rawVal > 1.0 ? rawVal / 100 : rawVal;
      detectionSource = "text_regex";
    }
  }

  // 3. Contract quantity regex: e.g. "10 contracts", "10 ct", "x10"
  const countMatch = clean.match(/\b(\d+)\s*(?:contracts?|cts?|shares?)\b/i) || clean.match(/x(\d+)\b/i);
  if (countMatch) {
    const num = parseInt(countMatch[1], 10);
    if (!isNaN(num) && num > 0 && num <= 1000) {
      contracts = num;
    }
  }

  // 4. Strike price regex: e.g. "above $88,500" or "> 88500"
  const strikeMatch = clean.match(/(?:above|>|\$)\s*([6-9]\d{4}|1\d{5})/i);
  if (strikeMatch) {
    const s = parseFloat(strikeMatch[1]);
    if (!isNaN(s)) {
      strike = s;
    }
  }

  // Format final price and cents
  price = Number(Math.max(0.01, Math.min(0.99, price)).toFixed(2));
  const priceCents = Math.round(price * 100);

  const isRecognized = venue !== "unknown" || detectionSource !== "default_fallback";

  return {
    isRecognized,
    venue: venue === "unknown" ? (lower.includes("poly") ? "polymarket" : "kalshi") : venue,
    ticker,
    marketTitle,
    price,
    priceCents,
    contracts,
    strike,
    assumedProbability: 0.55,
    rawInput: clean,
    detectionSource
  };
}
