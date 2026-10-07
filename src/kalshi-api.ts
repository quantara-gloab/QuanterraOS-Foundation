/**
 * QuanterraOS Kalshi Integration & 15-Minute High/Low Bidding Engine
 *
 * Supports:
 * 1. Live market queries for Kalshi KXBTC15M series (public & authenticated)
 * 2. Cryptographic RSA-PSS signing using KALSHI_KEY_ID & KALSHI_PRIVATE_KEY_PATH
 * 3. Portfolio balance verification
 * 4. Dual-mode order placement:
 *    - Mode "sandbox" (default): Simulated execution using subscriber wallet ($10,000 USD allocation)
 *    - Mode "live": Direct signed API execution to Kalshi Exchange
 * 5. Orderbook snapshot and fair-value evaluation
 */

import fs from "node:fs";
import crypto from "node:crypto";
import { db } from "./db.ts";
import { paperTrades, walletTransactions, subscriberWallets } from "./schema.ts";
import { getOrCreateSubscriberWallet } from "./wallet-engine.ts";
import { eq, desc } from "drizzle-orm";
import {
  type KalshiTimeframe,
  selectAtmHourlyMarket,
  buildStrikeLadder,
  type KalshiStrikeLadderEntry,
} from "./kalshi-contracts.ts";

export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  timeframe?: KalshiTimeframe;
  floor_strike: number;
  yes_bid: number; // in dollars (e.g. 0.51)
  yes_ask: number; // in dollars (e.g. 0.52)
  no_bid: number;  // in dollars (e.g. 0.48)
  no_ask: number;  // in dollars (e.g. 0.49)
  close_time: string;
  open_time: string;
  minutes_left: number;
  status: string;
}

export interface KalshiBalance {
  balance_dollars: number;
  portfolio_value_dollars: number;
  authenticated: boolean;
}

export interface PlaceBidInput {
  userId: string;
  ticker: string;
  side: "yes" | "no";
  price: number; // in dollars, e.g. 0.51
  count: number; // quantity of contracts
  mode: "sandbox" | "live";
}

export interface BidResult {
  success: boolean;
  orderId: string;
  ticker: string;
  side: "yes" | "no";
  price: number;
  count: number;
  totalCost: number;
  mode: "sandbox" | "live";
  status: "FILLED" | "RESTING" | "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  message: string;
  timestamp: string;
  walletBalanceRemaining?: number;
}

function getKalshiCredentials() {
  const keyId = process.env.KALSHI_KEY_ID;
  const keyPath = process.env.KALSHI_PRIVATE_KEY_PATH;
  if (!keyId || !keyPath) return null;
  try {
    const resolvedPath = keyPath.replace(/^%USERPROFILE%/i, process.env.USERPROFILE ?? "");
    if (!fs.existsSync(resolvedPath)) return null;
    const privateKey = fs.readFileSync(resolvedPath);
    return { keyId, privateKey };
  } catch {
    return null;
  }
}

function signKalshiRequest(keyId: string, privateKey: Buffer, method: string, pathWithoutQuery: string) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}${method}${pathWithoutQuery}`;
  const signature = crypto.sign("sha256", Buffer.from(message), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return {
    "KALSHI-ACCESS-KEY": keyId,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
    "KALSHI-ACCESS-SIGNATURE": signature.toString("base64"),
    "Content-Type": "application/json",
  };
}

/**
 * Fetches the active Kalshi contract for the specified timeframe (15m or 1h).
 */
export async function getActiveKalshiMarket(
  timeframe: KalshiTimeframe = "15m",
  spotPrice?: number
): Promise<KalshiMarket | null> {
  const creds = getKalshiCredentials();
  const seriesTicker = timeframe === "15m" ? "KXBTC15M" : "KXBTCD";
  const limit = timeframe === "15m" ? 5 : 50;
  const url = `https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=${seriesTicker}&status=open&limit=${limit}`;
  const pathWithoutQuery = "/trade-api/v2/markets";

  try {
    const headers = creds
      ? signKalshiRequest(creds.keyId, creds.privateKey, "GET", pathWithoutQuery)
      : { "Content-Type": "application/json" };

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      // Fallback to public external API
      const fallbackUrl = `https://external-api.kalshi.com/trade-api/v2/markets?series_ticker=${seriesTicker}&status=open&limit=${limit}`;
      const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(5000) });
      if (fallbackRes.ok) {
        const d = await fallbackRes.json();
        return parseMarketsResponse(d, timeframe, spotPrice);
      }
      return null;
    }
    const data = await res.json();
    return parseMarketsResponse(data, timeframe, spotPrice);
  } catch (err) {
    console.warn(`Failed to fetch Kalshi ${timeframe} market:`, err);
    return null;
  }
}

/**
 * Fetches the active 15-minute Kalshi KXBTC15M market.
 */
export async function getActiveKalshi15mMarket(): Promise<KalshiMarket | null> {
  return getActiveKalshiMarket("15m");
}

/**
 * Fetches the active 1-hour Kalshi KXBTCD market (ATM strike relative to spot).
 */
export async function getActiveKalshi1hMarket(spotPrice?: number): Promise<KalshiMarket | null> {
  return getActiveKalshiMarket("1h", spotPrice);
}

/**
 * Fetches the full strike ladder for Kalshi 1-hour KXBTCD contracts.
 */
export async function getKalshi1hStrikeLadder(spotPrice: number = 85000): Promise<KalshiStrikeLadderEntry[]> {
  const hosts = [
    "https://api.elections.kalshi.com",
    "https://external-api.kalshi.com"
  ];
  for (const host of hosts) {
    try {
      const url = `${host}/trade-api/v2/markets?series_ticker=KXBTCD&status=open&limit=100`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const ladder = buildStrikeLadder(data.markets ?? [], spotPrice);
        if (ladder.length > 0) return ladder;
      }
    } catch (err) {
      console.warn(`Failed to fetch 1h strike ladder from ${host}:`, err);
    }
  }

  // Return empty array if live markets unavailable — NEVER synthesize fake prices
  return [];
}

function parseMarketsResponse(data: any, timeframe: KalshiTimeframe = "15m", spotPrice?: number): KalshiMarket | null {
  const now = Date.now();
  const allMarkets = ((data?.markets ?? []) as any[])
    .filter((m) => Date.parse(m.close_time) > now);

  if (allMarkets.length === 0) return null;

  let m: any = null;
  if (timeframe === "1h" && spotPrice && spotPrice > 0) {
    m = selectAtmHourlyMarket(allMarkets, spotPrice);
  }

  if (!m) {
    const sorted = [...allMarkets].sort((a, b) => Date.parse(a.close_time) - Date.parse(b.close_time));
    m = sorted[0];
  }

  const closeMs = Date.parse(m.close_time);
  const minutesLeft = Math.max(0, Math.round(((closeMs - now) / 60000) * 10) / 10);
  const strike = Number(m.floor_strike || m.cap_strike || 0);

  return {
    ticker: m.ticker,
    title: m.title || `BTC > $${strike.toLocaleString()} at close?`,
    subtitle: m.subtitle || (strike > 0 ? `$${strike.toLocaleString()} or above` : undefined),
    timeframe,
    floor_strike: strike,
    yes_bid: Number(m.yes_bid_dollars || m.yes_bid || 0.50),
    yes_ask: Number(m.yes_ask_dollars || m.yes_ask || 0.51),
    no_bid: Number(m.no_bid_dollars || m.no_bid || 0.49),
    no_ask: Number(m.no_ask_dollars || m.no_ask || 0.50),
    close_time: m.close_time,
    open_time: m.open_time,
    minutes_left: minutesLeft,
    status: m.status || "active",
  };
}

/**
 * Gets real Kalshi portfolio balance if RSA credentials are valid.
 */
export async function getKalshiPortfolioBalance(): Promise<KalshiBalance> {
  const creds = getKalshiCredentials();
  if (!creds) {
    return { balance_dollars: 0, portfolio_value_dollars: 0, authenticated: false };
  }

  try {
    const path = "/trade-api/v2/portfolio/balance";
    const headers = signKalshiRequest(creds.keyId, creds.privateKey, "GET", path);
    const res = await fetch(`https://api.elections.kalshi.com${path}`, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return { balance_dollars: 0, portfolio_value_dollars: 0, authenticated: false };
    }
    const data = await res.json();
    return {
      balance_dollars: Number(data.balance_dollars || (data.balance ? data.balance / 100 : 0)),
      portfolio_value_dollars: Number(data.portfolio_value ? data.portfolio_value / 100 : 0),
      authenticated: true,
    };
  } catch (err) {
    return { balance_dollars: 0, portfolio_value_dollars: 0, authenticated: false };
  }
}

/**
 * Executes a 15-Minute High/Low Bid.
 *
 * In sandbox mode:
 *  - Checks simulated USD balance from subscriber_wallets
 *  - Deducts totalCost = price * count
 *  - Records trade in paper_trades table
 *  - Records transaction in wallet_transactions table
 *  - Returns instant confirmation
 *
 * In live mode:
 *  - Submits signed order to Kalshi API: POST /trade-api/v2/portfolio/orders
 */
export async function placeKalshi15mBid(input: PlaceBidInput): Promise<BidResult> {
  const price = Math.max(0.01, Math.min(0.99, Number(input.price)));
  const count = Math.max(1, Math.floor(Number(input.count)));
  const totalCost = Number((price * count).toFixed(2));
  const orderId = `ord_${input.side.toUpperCase()}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  if (input.mode === "live") {
    // 1. Enforce KALSHI_LIVE environment guard (Rule B5)
    if (process.env.KALSHI_LIVE !== "true") {
      throw new Error(
        "Rule B5 Violation: Live trading blocked ($0.00 capital exposure). KALSHI_LIVE=true is not set in environment."
      );
    }

    // 2. Enforce max contract count
    const MAX_LIVE_CONTRACTS = 10;
    if (count > MAX_LIVE_CONTRACTS) {
      throw new Error(`Risk limit exceeded: Live orders are capped at ${MAX_LIVE_CONTRACTS} contracts per order.`);
    }

    const creds = getKalshiCredentials();
    if (!creds) {
      throw new Error("Live Kalshi credentials not configured or private key missing.");
    }

    const path = "/trade-api/v2/portfolio/orders";
    const headers = signKalshiRequest(creds.keyId, creds.privateKey, "POST", path);
    const priceCents = Math.round(price * 100);

    const body = JSON.stringify({
      action: "buy",
      client_order_id: orderId,
      count: count,
      side: input.side,
      ticker: input.ticker,
      type: "limit",
      yes_price: input.side === "yes" ? priceCents : (100 - priceCents),
    });

    const res = await fetch(`https://api.elections.kalshi.com${path}`, {
      method: "POST",
      headers,
      body,
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.error?.message || data?.error?.details || JSON.stringify(data);
      throw new Error(`Kalshi API rejected order: ${errMsg}`);
    }

    const kalshiStatus = (data.order?.status || "").toUpperCase();
    const orderStatus: "FILLED" | "PENDING" =
      kalshiStatus === "EXECUTED" || kalshiStatus === "FILLED" ? "FILLED" : "PENDING";

    return {
      success: true,
      orderId: data.order?.order_id || orderId,
      ticker: input.ticker,
      side: input.side,
      price,
      count,
      totalCost,
      mode: "live",
      status: orderStatus,
      message: `Live Kalshi order placed. Status: ${orderStatus}. Order ID: ${data.order?.order_id || orderId}`,
      timestamp: now,
    };
  }

  // SANDBOX PAPER MODE (Rule B5 Compliant)
  const wallet = getOrCreateSubscriberWallet(input.userId);
  if (wallet.balanceUsd < totalCost) {
    throw new Error(
      `Insufficient sandbox balance. Cost: $${totalCost.toFixed(2)}, Available USD: $${wallet.balanceUsd.toFixed(2)}. Deposit simulated funds at /wallet.`
    );
  }

  // Deduct from subscriber wallet
  const newUsdBalance = Number((wallet.balanceUsd - totalCost).toFixed(2));
  db.update(subscriberWallets)
    .set({ balanceUsd: newUsdBalance, updatedAt: now })
    .where(eq(subscriberWallets.id, wallet.id))
    .run();

  // Record transaction audit trail
  db.insert(walletTransactions)
    .values({
      id: `tx_${orderId}`,
      walletId: wallet.id,
      userId: input.userId,
      type: "SIMULATED_WITHDRAWAL",
      currency: "USD",
      amount: totalCost,
      status: "CONFIRMED",
      txHash: `0x${crypto.randomBytes(16).toString("hex")}`,
      description: `15m Kalshi Bid: ${count}x ${input.side.toUpperCase()} @ $${price.toFixed(2)} (${input.ticker})`,
      createdAt: now,
    })
    .run();

  // Insert into paper_trades table (Rule B5 paper logging)
  db.insert(paperTrades)
    .values({
      id: orderId,
      owner: input.userId,
      contract: input.ticker,
      modelProbability: price,
      modelSource: "quant",
      barrierType: "high",
      side: input.side,
      decision: "buy",
      entryPrice: price,
      breakevenProbability: price,
      edge: 0.0,
      feeEstimate: 0.01,
      rationale: `Manual operator bid placed via Kalshi 15m terminal: ${count} contracts on ${input.side.toUpperCase()} at $${price.toFixed(2)}`,
      evidenceJson: JSON.stringify({
        ticker: input.ticker,
        strike: input.ticker.split("-").pop(),
        price,
        count,
        totalCost,
        mode: "sandbox",
      }),
      status: "proposed",
      createdAt: now,
    })
    .run();

  return {
    success: true,
    orderId,
    ticker: input.ticker,
    side: input.side,
    price,
    count,
    totalCost,
    mode: "sandbox",
    status: "FILLED",
    message: `Sandbox bid filled! ${count}x ${input.side.toUpperCase()} @ $${price.toFixed(2)} ($${totalCost.toFixed(2)} total cost deducted from paper wallet).`,
    timestamp: now,
    walletBalanceRemaining: newUsdBalance,
  };
}

/**
 * Returns recent bids placed by the user.
 */
export function getUserKalshiBids(userId: string) {
  return db
    .select()
    .from(paperTrades)
    .where(eq(paperTrades.owner, userId))
    .orderBy(desc(paperTrades.createdAt))
    .limit(50)
    .all();
}
