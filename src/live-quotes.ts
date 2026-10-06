/**
 * Real Live Exchange Quotes Engine
 *
 * Fetches actual, real-time spot prices from public, unauthenticated exchange APIs:
 * - Coinbase: https://api.coinbase.com/v2/prices/BTC-USD/spot
 * - Kraken: https://api.kraken.com/0/public/Ticker?pair=XBTUSD
 * - Bitstamp: https://www.bitstamp.net/api/v2/ticker/btcusd/
 *
 * Strictly adheres to rule: ZERO FABRICATED OR HARDCODED VENUE PRICES.
 * If an exchange is unreachable, price is null and status is OFFLINE.
 * CME CF BRTI is explicitly marked as requiring institutional feed, never synthesized.
 */

export interface VenueQuote {
  venue: string;
  type: string;
  price: number | null;
  spread: number | null;
  spreadBps: number | null;
  status: "BENCHMARK" | "NORMAL" | "DISPERSED" | "OFFLINE" | "REQUIRES CME FEED";
  lastUpdated: number | null;
  note?: string;
}

export interface LiveQuotesReport {
  asset: string;
  timestamp: number;
  compositePrice: number | null;
  quorumMet: boolean;
  activeVenuesCount: number;
  venues: VenueQuote[];
}

interface CacheEntry {
  data: LiveQuotesReport;
  expiresAt: number;
}

let quoteCache: CacheEntry | null = null;
const CACHE_TTL_MS = 2500; // 2.5-second caching to prevent rate-limiting

async function fetchWithTimeout(url: string, timeoutMs: number = 2500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "QuanterraOS-LiveQuotes/1.0" },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function fetchCoinbasePrice(): Promise<number | null> {
  try {
    const res = await fetchWithTimeout("https://api.coinbase.com/v2/prices/BTC-USD/spot");
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { amount?: string } };
    const p = parseFloat(json.data?.amount ?? "");
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch {
    return null;
  }
}

async function fetchKrakenPrice(): Promise<number | null> {
  try {
    const res = await fetchWithTimeout("https://api.kraken.com/0/public/Ticker?pair=XBTUSD");
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: { XXBTZUSD?: { c?: string[] } } };
    const p = parseFloat(json.result?.XXBTZUSD?.c?.[0] ?? "");
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch {
    return null;
  }
}

async function fetchBitstampPrice(): Promise<number | null> {
  try {
    const res = await fetchWithTimeout("https://www.bitstamp.net/api/v2/ticker/btcusd/");
    if (!res.ok) return null;
    const json = (await res.json()) as { last?: string };
    const p = parseFloat(json.last ?? "");
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch {
    return null;
  }
}

async function fetchGeminiPrice(): Promise<number | null> {
  try {
    const res = await fetchWithTimeout("https://api.gemini.com/v1/pubticker/btcusd");
    if (!res.ok) return null;
    const json = (await res.json()) as { last?: string };
    const p = parseFloat(json.last ?? "");
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch {
    return null;
  }
}

export async function getLiveQuotes(asset: string = "BTC"): Promise<LiveQuotesReport> {
  const now = Date.now();
  if (quoteCache && quoteCache.expiresAt > now) {
    return quoteCache.data;
  }

  // Fetch all 4 CME CF BRTI constituent venues in parallel
  const [cbPrice, krPrice, bsPrice, gemPrice] = await Promise.all([
    fetchCoinbasePrice(),
    fetchKrakenPrice(),
    fetchBitstampPrice(),
    fetchGeminiPrice(),
  ]);

  const activePrices = [cbPrice, krPrice, bsPrice, gemPrice].filter((p): p is number => p !== null);
  const activeCount = activePrices.length;

  // Compute live median of valid active prices
  let liveMedian: number | null = null;
  if (activeCount >= 2) {
    const sorted = [...activePrices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    liveMedian = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    liveMedian = Math.round(liveMedian * 100) / 100;
  } else if (activeCount === 1) {
    liveMedian = activePrices[0];
  }

  const computeSpread = (p: number | null) => {
    if (p === null || liveMedian === null) return { spread: null, spreadBps: null, status: "OFFLINE" as const };
    const spread = Math.round((p - liveMedian) * 100) / 100;
    const spreadBps = Math.round(((p - liveMedian) / liveMedian) * 10000 * 10) / 10;
    const status = Math.abs(spreadBps) > 15 ? ("DISPERSED" as const) : ("NORMAL" as const);
    return { spread, spreadBps, status };
  };

  const cbMetrics = computeSpread(cbPrice);
  const krMetrics = computeSpread(krPrice);
  const bsMetrics = computeSpread(bsPrice);
  const gemMetrics = computeSpread(gemPrice);

  const venues: VenueQuote[] = [
    {
      venue: "Quanterra Composite Benchmark",
      type: "Constituent Spot Median",
      price: liveMedian,
      spread: liveMedian !== null ? 0.00 : null,
      spreadBps: liveMedian !== null ? 0.0 : null,
      status: "BENCHMARK",
      lastUpdated: now,
      note: `Median of ${activeCount}/4 active public exchanges`,
    },
    {
      venue: "Coinbase (BTC-USD)",
      type: "Constituent Spot",
      price: cbPrice,
      spread: cbMetrics.spread,
      spreadBps: cbMetrics.spreadBps,
      status: cbPrice !== null ? cbMetrics.status : "OFFLINE",
      lastUpdated: cbPrice !== null ? now : null,
    },
    {
      venue: "Kraken (XBT/USD)",
      type: "Constituent Spot",
      price: krPrice,
      spread: krMetrics.spread,
      spreadBps: krMetrics.spreadBps,
      status: krPrice !== null ? krMetrics.status : "OFFLINE",
      lastUpdated: krPrice !== null ? now : null,
    },
    {
      venue: "Bitstamp (BTC/USD)",
      type: "Constituent Spot",
      price: bsPrice,
      spread: bsMetrics.spread,
      spreadBps: bsMetrics.spreadBps,
      status: bsPrice !== null ? bsMetrics.status : "OFFLINE",
      lastUpdated: bsPrice !== null ? now : null,
    },
    {
      venue: "Gemini (BTC/USD)",
      type: "Constituent Spot",
      price: gemPrice,
      spread: gemMetrics.spread,
      spreadBps: gemMetrics.spreadBps,
      status: gemPrice !== null ? gemMetrics.status : "OFFLINE",
      lastUpdated: gemPrice !== null ? now : null,
    },
    {
      venue: "CME CF BRTI Reference",
      type: "Kalshi Settlement Benchmark",
      price: null,
      spread: null,
      spreadBps: null,
      status: "REQUIRES CME FEED",
      lastUpdated: null,
      note: "Proprietary CF Benchmarks index feed requires institutional license. Zero synthetic quotes.",
    },
  ];

  const report: LiveQuotesReport = {
    asset: asset.toUpperCase(),
    timestamp: now,
    compositePrice: liveMedian,
    quorumMet: activeCount >= 2,
    activeVenuesCount: activeCount,
    venues,
  };

  quoteCache = {
    data: report,
    expiresAt: now + CACHE_TTL_MS,
  };

  return report;
}
