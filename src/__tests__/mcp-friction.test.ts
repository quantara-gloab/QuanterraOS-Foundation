import { describe, it } from "node:test";
import assert from "node:assert";
import {
  simulateOrderFriction,
  executeMcpTool,
  MCP_SERVER_MANIFEST,
} from "../mcp-server.ts";

describe("MCP Pre-Trade Risk Coprocessor & Friction Simulator", () => {
  it("includes simulate_order_friction in MCP tool manifest", () => {
    const tool = MCP_SERVER_MANIFEST.tools.find((t) => t.name === "simulate_order_friction");
    assert.ok(tool, "simulate_order_friction should be registered in MCP manifest");
    const props = tool.parameters.properties as Record<string, any>;
    assert.strictEqual(props.price?.type, "number");
    assert.strictEqual(props.orderType?.type, "string");
  });

  it("calculates non-linear Kalshi taker fee drag and breakeven hurdle correctly", () => {
    // 100 contracts at 50¢ ($0.50)
    // Total notional = $50.00
    // Taker fee = ceil(0.07 * 100 * 0.5 * 0.5 * 100) / 100 = ceil(175) / 100 = $1.75
    // Maker fee = ceil(0.0175 * 100 * 0.5 * 0.5 * 100) / 100 = ceil(43.75) / 100 = $0.44
    const simTaker = simulateOrderFriction({
      price: 0.50,
      size: 100,
      assessedProbability: 0.55,
      orderType: "taker",
    });

    assert.strictEqual(simTaker.price, 0.50);
    assert.strictEqual(simTaker.size, 100);
    assert.strictEqual(simTaker.totalNotional, 50.00);
    assert.strictEqual(simTaker.takerFeeDollars, 1.75);
    assert.strictEqual(simTaker.makerFeeDollars, 0.44);
    assert.strictEqual(simTaker.effectiveFeeDollars, 1.75);
    assert.strictEqual(simTaker.feeSavingsIfMaker, 1.31); // $1.75 - $0.44
    assert.strictEqual(simTaker.feePercentOfCost, 3.5); // $1.75 / $50.00 * 100%
    assert.strictEqual(simTaker.breakevenWinRate, 0.5175); // 50¢ + 1.75¢
    assert.strictEqual(simTaker.feeDragBps, 350);

    // Expected gross profit with assessed prob 0.55 = 100 * (0.55 - 0.50) = $5.00
    assert.strictEqual(simTaker.expectedGrossProfit, 5.00);
    // Net profit = $5.00 - $1.75 = $3.25
    assert.strictEqual(simTaker.expectedNetProfit, 3.25);
    assert.strictEqual(simTaker.isPositiveEv, true);
    assert.strictEqual(simTaker.netEvRoiPercent, 6.5); // $3.25 / $50 * 100%
  });

  it("detects when fee drag destroys marginal gross alpha", () => {
    // Trader thinks probability is 51% (gross edge +1%), price is 50¢, taker fee is 1.75¢
    // Breakeven is 51.75%, so net EV is negative
    const simEatenByFees = simulateOrderFriction({
      price: 0.50,
      size: 100,
      assessedProbability: 0.51,
      orderType: "taker",
    });

    assert.strictEqual(simEatenByFees.expectedGrossProfit, 1.00);
    assert.strictEqual(simEatenByFees.effectiveFeeDollars, 1.75);
    assert.strictEqual(simEatenByFees.expectedNetProfit, -0.75);
    assert.strictEqual(simEatenByFees.isPositiveEv, false);
    assert.ok(simEatenByFees.verdict.includes("NEGATIVE EV (FEE DRAG)"));
  });

  it("proves Maker resting order restores positive EV by cutting fee drag by 75%", () => {
    // Same 51% assessed probability, but with maker order (fee $0.44 instead of $1.75)
    // Gross edge = +$1.00, Maker fee = $0.44 -> Net EV = +$0.56!
    const simMaker = simulateOrderFriction({
      price: 0.50,
      size: 100,
      assessedProbability: 0.51,
      orderType: "maker",
    });

    assert.strictEqual(simMaker.orderType, "maker");
    assert.strictEqual(simMaker.effectiveFeeDollars, 0.44);
    assert.strictEqual(simMaker.expectedGrossProfit, 1.00);
    assert.strictEqual(simMaker.expectedNetProfit, 0.56);
    assert.strictEqual(simMaker.isPositiveEv, true);
    assert.ok(simMaker.verdict.includes("POSITIVE EV"));
  });

  it("executes simulate_order_friction through executeMcpTool dispatcher", async () => {
    const result = await executeMcpTool("simulate_order_friction", {
      price: 0.40,
      size: 50,
      assessedProbability: 0.45,
      orderType: "taker",
    });

    assert.strictEqual(result.price, 0.40);
    assert.strictEqual(result.size, 50);
    assert.strictEqual(result.totalNotional, 20.00);
    // Taker fee = ceil(0.07 * 50 * 0.4 * 0.6 * 100) / 100 = ceil(84) / 100 = $0.84
    assert.strictEqual(result.effectiveFeeDollars, 0.84);
  });

  it("executes get_spot_basis through executeMcpTool and maintains BRTI disclaimer", async () => {
    const basis = await executeMcpTool("get_spot_basis", { asset: "BTC" });
    assert.ok(basis.referenceIndex.includes("Quanterra BTC Spot Composite"));
    assert.ok(basis.disclaimer.includes("does not represent its composite index as the official CME CF BRTI benchmark"));
  });
});
