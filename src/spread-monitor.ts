/**
 * Multi-platform BTC/ETH/SOL/XRP price spread monitor.
 *
 * Pure, dependency-free logic: compare the top exchange price platforms
 * side by side against the reference index Kalshi settles on (CF
 * Benchmarks' BRTI/RTI series), and flag where the spread is wide
 * enough to matter for a 15-minute event contract.
 *
 * Ported from a standalone research-core prototype. Unlike that
 * prototype, this project already collects real exchange and index
 * quotes (see exchange-price-poller.mjs and kalshi-btc-logger.mjs), so
 * there is a real `latestQuotes()` data source below instead of a
 * sample-data placeholder.
 */
import Database from "better-sqlite3";

export interface PriceQuote {
  source: string;
  price: number;
  observedAt: string; // ISO 8601
}

export interface SpreadRow {
  source: string;
  price: number;
  observedAt: string;
  /** price - reference price */
  spreadAbs: number;
  /** spreadAbs / reference price, in basis points */
  spreadBps: number;
  /** true when |spreadBps| exceeds the given threshold */
  flagged: boolean;
}

export interface SpreadReport {
  referenceSource: string;
  referencePrice: number;
  rows: SpreadRow[];
  widestSpreadBps: number;
  flaggedCount: number;
}

/**
 * Compares every quote (including the reference itself, at zero spread)
 * against the named reference source's price.
 *
 * @param thresholdBps spread beyond which a row is flagged as
 *   arbitrage-worthy. Defaults to 15 bps - arbitrary starting point,
 *   not a validated trading threshold; tune once real fee schedules
 *   and settlement timing are known.
 */
export function computeSpreadReport(
  quotes: PriceQuote[],
  referenceSource: string,
  thresholdBps = 15,
): SpreadReport {
  const reference = quotes.find((quote) => quote.source === referenceSource);
  if (!reference) {
    throw new Error(`Reference source "${referenceSource}" not present in quotes`);
  }

  const rows: SpreadRow[] = quotes.map((quote) => {
    const spreadAbs = quote.price - reference.price;
    const spreadBps = reference.price === 0 ? 0 : (spreadAbs / reference.price) * 10_000;
    return {
      source: quote.source,
      price: quote.price,
      observedAt: quote.observedAt,
      spreadAbs,
      spreadBps,
      flagged: Math.abs(spreadBps) > thresholdBps,
    };
  });

  const widestSpreadBps = rows.reduce((max, row) => Math.max(max, Math.abs(row.spreadBps)), 0);
  const flaggedCount = rows.filter((row) => row.flagged).length;

  return {
    referenceSource,
    referencePrice: reference.price,
    rows: rows.sort((a, b) => Math.abs(b.spreadBps) - Math.abs(a.spreadBps)),
    widestSpreadBps,
    flaggedCount,
  };
}

const referenceSourceName = "CF Benchmarks index (Kalshi settlement reference)";

/**
 * Pulls the most recent real index tick and exchange prices for an
 * asset from the database this project already populates. Returns an
 * empty array (not fabricated data) when no rows exist yet for that
 * asset, so callers can render an honest "no data yet" state.
 */
interface LatestIndexRow {
  observedAt: number;
  price: number;
}

interface LatestExchangeRow {
  exchange: string;
  observedAt: number;
  price: number;
}

export function latestQuotes(asset = "BTC", dbPath = "quanterraos.db"): PriceQuote[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    const index = db
      .prepare(
        "SELECT received_at AS observedAt, CAST(raw_value AS REAL) AS price FROM btc_index_ticks WHERE raw_value IS NOT NULL AND asset = ? ORDER BY received_at DESC LIMIT 1",
      )
      .get(asset) as LatestIndexRow | undefined;
    const exchanges = db
      .prepare(
        "SELECT exchange_name AS exchange, fetched_at AS observedAt, price FROM exchange_prices WHERE asset = ? GROUP BY exchange_name HAVING fetched_at = MAX(fetched_at) ORDER BY exchange_name",
      )
      .all(asset) as LatestExchangeRow[];
    if (!index) return [];
    const quotes: PriceQuote[] = [
      { source: referenceSourceName, price: index.price, observedAt: new Date(index.observedAt).toISOString() },
    ];
    for (const row of exchanges) {
      quotes.push({ source: row.exchange, price: row.price, observedAt: new Date(row.observedAt).toISOString() });
    }
    return quotes;
  } finally {
    db.close();
  }
}

export { referenceSourceName };
