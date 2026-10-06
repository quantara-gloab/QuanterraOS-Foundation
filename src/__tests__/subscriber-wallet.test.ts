import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { runMigrations } from "../db.ts";
import {
  getOrCreateSubscriberWallet,
  getWalletSummary,
  executeSimulatedDeposit,
  executeSimulatedWithdrawal,
  resetSubscriberWallet,
} from "../wallet-engine.ts";
import { renderWalletPageHtml } from "../wallet-page.ts";

describe("Subscriber Electronic Currency Sandbox Wallet Engine", () => {
  before(() => {
    runMigrations();
  });

  const testUserId = "test-subscriber-" + Date.now();

  it("provisions new wallet with default sandbox balance ($10,000 USD + 0.25 BTC)", () => {
    const wallet = getOrCreateSubscriberWallet(testUserId);
    assert.ok(wallet.id, "Wallet must have generated id");
    assert.strictEqual(wallet.userId, testUserId);
    assert.strictEqual(wallet.balanceUsd, 10000.0);
    assert.strictEqual(wallet.balanceBtc, 0.25);

    const summary = getWalletSummary(testUserId);
    assert.strictEqual(summary.availableCashUsd, 10000.0);
    assert.strictEqual(summary.btcHoldings, 0.25);
    assert.ok(summary.totalEquityUsd > 10000.0, "Total equity includes BTC holdings at market price");
    assert.ok(summary.recentTransactions.length >= 1, "Genesis deposit transaction recorded");
  });

  it("executes simulated electronic currency deposits (USD & BTC)", () => {
    // Deposit USD
    const depositUsd = executeSimulatedDeposit({
      userId: testUserId,
      currency: "USD",
      amount: 2500.50,
    });
    assert.strictEqual(depositUsd.wallet.balanceUsd, 12500.50);
    assert.strictEqual(depositUsd.transaction.type, "SIMULATED_DEPOSIT");
    assert.strictEqual(depositUsd.transaction.currency, "USD");
    assert.strictEqual(depositUsd.transaction.amount, 2500.50);
    assert.ok(depositUsd.transaction.txHash.startsWith("0x"), "Generates realistic simulated blockchain hash");

    // Deposit BTC
    const depositBtc = executeSimulatedDeposit({
      userId: testUserId,
      currency: "BTC",
      amount: 0.15,
    });
    assert.strictEqual(depositBtc.wallet.balanceBtc, 0.40);
    assert.strictEqual(depositBtc.transaction.currency, "BTC");
  });

  it("rejects invalid deposit amounts", () => {
    assert.throws(
      () => executeSimulatedDeposit({ userId: testUserId, currency: "USD", amount: -50 }),
      /must be a positive number/
    );
    assert.throws(
      () => executeSimulatedDeposit({ userId: testUserId, currency: "USD", amount: 0 }),
      /must be a positive number/
    );
    assert.throws(
      () => executeSimulatedDeposit({ userId: testUserId, currency: "BTC", amount: 150 }),
      /Maximum simulated BTC deposit/
    );
  });

  it("executes simulated electronic currency withdrawals with balance validation", () => {
    // Insufficient funds withdrawal
    assert.throws(
      () =>
        executeSimulatedWithdrawal({
          userId: testUserId,
          currency: "USD",
          amount: 50000.0,
          destinationAddress: "0x71C569E9F097d740E7D2E0B2c129eE9a03975C41",
        }),
      /Insufficient simulated USD cash balance/
    );

    // Missing destination address
    assert.throws(
      () =>
        executeSimulatedWithdrawal({
          userId: testUserId,
          currency: "USD",
          amount: 500.0,
          destinationAddress: "",
        }),
      /valid destination electronic currency address is required/
    );

    // Valid withdrawal
    const validWithdrawal = executeSimulatedWithdrawal({
      userId: testUserId,
      currency: "USD",
      amount: 1000.50,
      destinationAddress: "0x71C569E9F097d740E7D2E0B2c129eE9a03975C41",
    });

    assert.strictEqual(validWithdrawal.wallet.balanceUsd, 11500.00);
    assert.strictEqual(validWithdrawal.transaction.type, "SIMULATED_WITHDRAWAL");
    assert.strictEqual(validWithdrawal.transaction.destinationAddress, "0x71C569E9F097d740E7D2E0B2c129eE9a03975C41");
    assert.ok(validWithdrawal.transaction.txHash.startsWith("0x"));
  });

  it("resets sandbox balance to default allocation", () => {
    const reset = resetSubscriberWallet(testUserId);
    assert.strictEqual(reset.balanceUsd, 10000.0);
    assert.strictEqual(reset.balanceBtc, 0.25);
  });

  it("renders /wallet HTML complying with Rule B5 safety disclosures and Gold Standard tokens", () => {
    const summary = getWalletSummary(testUserId);
    const html = renderWalletPageHtml(summary);

    assert.ok(html.includes("Subscriber Electronic Currency Wallet"), "Title renders");
    assert.ok(html.includes("RULE B5 SANDBOX"), "Rule B5 banner renders");
    assert.ok(html.includes("$0.00 live exposure") || html.includes("$0.00 REAL EXPOSURE"), "Zero real exposure disclosed");
    assert.ok(html.includes("Upload Electronic Currency"), "Upload electronic currency form present");
    assert.ok(html.includes("Withdraw Electronic Currency"), "Withdraw electronic currency form present");
    assert.ok(html.includes("Electronic Wallet Audit Trail"), "Audit trail table present");
    assert.ok(html.includes("Aria"), "Aria concierge present in page");
    assert.ok(html.includes("/assets/assistant-avatar.jpg"), "Avatar reference present");
  });
});
