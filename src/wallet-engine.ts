/**
 * QuanterraOS Subscriber Simulated Electronic Currency Wallet Engine
 *
 * Implements:
 * 1. Sandboxed electronic currency wallet ($0.00 live exposure, Rule B5 compliant).
 * 2. Multi-currency balances: USD (Paper Dollar), BTC (Simulated Bitcoin), USDC (USD Coin).
 * 3. Simulated deposits ("Upload Electronic Currency") with simulated cryptographic tx hashes.
 * 4. Simulated withdrawals ("Withdraw Electronic Currency") to user-specified addresses.
 * 5. Full audit trail recorded in SQLite wallet_transactions table.
 * 6. Portfolio valuation converted dynamically via Quanterra Composite Index spot prices.
 */

import { randomUUID, randomBytes } from "node:crypto";
import { eq, desc } from "drizzle-orm";
import { db } from "./db.ts";
import { subscriberWallets, walletTransactions } from "./schema.ts";
import { getLatestCompositeIndex } from "./composite-index.ts";
import { logEvent } from "./metrics.ts";

export type SupportedCurrency = "USD" | "BTC" | "USDC";

export interface SubscriberWalletRecord {
  id: string;
  userId: string;
  balanceUsd: number;
  balanceBtc: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionRecord {
  id: string;
  walletId: string;
  userId: string;
  type: "SIMULATED_DEPOSIT" | "SIMULATED_WITHDRAWAL" | "RESET";
  currency: SupportedCurrency;
  amount: number;
  txHash: string;
  status: "CONFIRMED" | "PENDING";
  destinationAddress?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface WalletSummary {
  wallet: SubscriberWalletRecord;
  btcPriceUsd: number;
  totalEquityUsd: number;
  availableCashUsd: number;
  btcHoldings: number;
  btcValueUsd: number;
  recentTransactions: WalletTransactionRecord[];
}

const DEFAULT_USD_BALANCE = 10000.0;
const DEFAULT_BTC_BALANCE = 0.25;
const FALLBACK_BTC_PRICE = 64500.0;

function generateSimulatedTxHash(): string {
  return "0x" + randomBytes(32).toString("hex");
}

export function getCurrentBtcPrice(): number {
  try {
    const composite = getLatestCompositeIndex();
    if (composite && composite.compositePrice && composite.compositePrice > 0) {
      return composite.compositePrice;
    }
  } catch (err) {
    // fallback gracefully
  }
  return FALLBACK_BTC_PRICE;
}

/**
 * Retrieves an existing subscriber wallet or provisions a new one with initial demo balances.
 */
export function getOrCreateSubscriberWallet(userId: string): SubscriberWalletRecord {
  const existing = db
    .select()
    .from(subscriberWallets)
    .where(eq(subscriberWallets.userId, userId))
    .get();

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const walletId = randomUUID();

  const newWallet: SubscriberWalletRecord = {
    id: walletId,
    userId,
    balanceUsd: DEFAULT_USD_BALANCE,
    balanceBtc: DEFAULT_BTC_BALANCE,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(subscriberWallets).values(newWallet).run();

  // Record initial simulated genesis deposit
  const genesisTx: WalletTransactionRecord = {
    id: randomUUID(),
    walletId,
    userId,
    type: "SIMULATED_DEPOSIT",
    currency: "USD",
    amount: DEFAULT_USD_BALANCE,
    txHash: generateSimulatedTxHash(),
    status: "CONFIRMED",
    destinationAddress: null,
    description: "Sandbox Genesis Deposit — Rule B5 Paper Mode Initial Allocation",
    createdAt: now,
  };

  db.insert(walletTransactions).values(genesisTx).run();

  logEvent(userId, "wallet_provisioned", { walletId, defaultUsd: DEFAULT_USD_BALANCE, defaultBtc: DEFAULT_BTC_BALANCE });

  return newWallet;
}

/**
 * Returns full wallet summary with portfolio valuations and recent transactions.
 */
export function getWalletSummary(userId: string): WalletSummary {
  const wallet = getOrCreateSubscriberWallet(userId);
  const btcPriceUsd = getCurrentBtcPrice();
  const btcValueUsd = Math.round(wallet.balanceBtc * btcPriceUsd * 100) / 100;
  const totalEquityUsd = Math.round((wallet.balanceUsd + btcValueUsd) * 100) / 100;

  const recentTransactions = db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(25)
    .all() as WalletTransactionRecord[];

  return {
    wallet,
    btcPriceUsd,
    totalEquityUsd,
    availableCashUsd: Math.round(wallet.balanceUsd * 100) / 100,
    btcHoldings: wallet.balanceBtc,
    btcValueUsd,
    recentTransactions,
  };
}

/**
 * Executes a simulated electronic currency deposit ("Upload").
 */
export function executeSimulatedDeposit(params: {
  userId: string;
  currency: SupportedCurrency;
  amount: number;
  description?: string;
}): { wallet: SubscriberWalletRecord; transaction: WalletTransactionRecord } {
  const { userId, currency, amount, description } = params;

  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    throw new Error("Deposit amount must be a positive number.");
  }

  if (currency === "BTC" && amount > 100) {
    throw new Error("Maximum simulated BTC deposit per transaction is 100 BTC.");
  }

  if ((currency === "USD" || currency === "USDC") && amount > 1_000_000) {
    throw new Error("Maximum simulated USD/USDC deposit per transaction is $1,000,000.");
  }

  const wallet = getOrCreateSubscriberWallet(userId);
  const now = new Date().toISOString();
  const txHash = generateSimulatedTxHash();

  let updatedUsd = wallet.balanceUsd;
  let updatedBtc = wallet.balanceBtc;

  if (currency === "BTC") {
    updatedBtc = Math.round((updatedBtc + amount) * 100000000) / 100000000;
  } else {
    // USD or USDC both credit USD cash balance
    updatedUsd = Math.round((updatedUsd + amount) * 100) / 100;
  }

  db.update(subscriberWallets)
    .set({
      balanceUsd: updatedUsd,
      balanceBtc: updatedBtc,
      updatedAt: now,
    })
    .where(eq(subscriberWallets.id, wallet.id))
    .run();

  const transaction: WalletTransactionRecord = {
    id: randomUUID(),
    walletId: wallet.id,
    userId,
    type: "SIMULATED_DEPOSIT",
    currency,
    amount,
    txHash,
    status: "CONFIRMED",
    destinationAddress: null,
    description: description || `Simulated ${currency} Deposit (Paper Currency Upload)`,
    createdAt: now,
  };

  db.insert(walletTransactions).values(transaction).run();

  logEvent(userId, "wallet_simulated_deposit", {
    currency,
    amount,
    txHash,
    newBalanceUsd: updatedUsd,
    newBalanceBtc: updatedBtc,
  });

  return {
    wallet: {
      ...wallet,
      balanceUsd: updatedUsd,
      balanceBtc: updatedBtc,
      updatedAt: now,
    },
    transaction,
  };
}

/**
 * Executes a simulated electronic currency withdrawal.
 */
export function executeSimulatedWithdrawal(params: {
  userId: string;
  currency: SupportedCurrency;
  amount: number;
  destinationAddress: string;
  description?: string;
}): { wallet: SubscriberWalletRecord; transaction: WalletTransactionRecord } {
  const { userId, currency, amount, destinationAddress, description } = params;

  if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
    throw new Error("Withdrawal amount must be a positive number.");
  }

  if (!destinationAddress || typeof destinationAddress !== "string" || destinationAddress.trim().length < 8) {
    throw new Error("A valid destination electronic currency address is required (e.g. Bitcoin or Ethereum address).");
  }

  const wallet = getOrCreateSubscriberWallet(userId);
  const now = new Date().toISOString();
  const txHash = generateSimulatedTxHash();

  let updatedUsd = wallet.balanceUsd;
  let updatedBtc = wallet.balanceBtc;

  if (currency === "BTC") {
    if (wallet.balanceBtc < amount) {
      throw new Error(`Insufficient simulated Bitcoin balance. Available: ${wallet.balanceBtc} BTC, requested: ${amount} BTC.`);
    }
    updatedBtc = Math.round((updatedBtc - amount) * 100000000) / 100000000;
  } else {
    // USD or USDC
    if (wallet.balanceUsd < amount) {
      throw new Error(`Insufficient simulated USD cash balance. Available: $${wallet.balanceUsd.toFixed(2)}, requested: $${amount.toFixed(2)}.`);
    }
    updatedUsd = Math.round((updatedUsd - amount) * 100) / 100;
  }

  db.update(subscriberWallets)
    .set({
      balanceUsd: updatedUsd,
      balanceBtc: updatedBtc,
      updatedAt: now,
    })
    .where(eq(subscriberWallets.id, wallet.id))
    .run();

  const transaction: WalletTransactionRecord = {
    id: randomUUID(),
    walletId: wallet.id,
    userId,
    type: "SIMULATED_WITHDRAWAL",
    currency,
    amount,
    txHash,
    status: "CONFIRMED",
    destinationAddress: destinationAddress.trim(),
    description: description || `Simulated ${currency} Transfer to ${destinationAddress.trim().slice(0, 10)}…`,
    createdAt: now,
  };

  db.insert(walletTransactions).values(transaction).run();

  logEvent(userId, "wallet_simulated_withdrawal", {
    currency,
    amount,
    destinationAddress: destinationAddress.trim(),
    txHash,
    newBalanceUsd: updatedUsd,
    newBalanceBtc: updatedBtc,
  });

  return {
    wallet: {
      ...wallet,
      balanceUsd: updatedUsd,
      balanceBtc: updatedBtc,
      updatedAt: now,
    },
    transaction,
  };
}

/**
 * Resets the subscriber's sandbox wallet balance to default ($10,000 USD and 0.25 BTC).
 */
export function resetSubscriberWallet(userId: string): SubscriberWalletRecord {
  const wallet = getOrCreateSubscriberWallet(userId);
  const now = new Date().toISOString();
  const txHash = generateSimulatedTxHash();

  db.update(subscriberWallets)
    .set({
      balanceUsd: DEFAULT_USD_BALANCE,
      balanceBtc: DEFAULT_BTC_BALANCE,
      updatedAt: now,
    })
    .where(eq(subscriberWallets.id, wallet.id))
    .run();

  const resetTx: WalletTransactionRecord = {
    id: randomUUID(),
    walletId: wallet.id,
    userId,
    type: "RESET",
    currency: "USD",
    amount: DEFAULT_USD_BALANCE,
    txHash,
    status: "CONFIRMED",
    destinationAddress: null,
    description: "Sandbox Balance Reset to Default ($10,000 USD + 0.25 BTC)",
    createdAt: now,
  };

  db.insert(walletTransactions).values(resetTx).run();

  logEvent(userId, "wallet_sandbox_reset", { defaultUsd: DEFAULT_USD_BALANCE, defaultBtc: DEFAULT_BTC_BALANCE });

  return {
    ...wallet,
    balanceUsd: DEFAULT_USD_BALANCE,
    balanceBtc: DEFAULT_BTC_BALANCE,
    updatedAt: now,
  };
}
