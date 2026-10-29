import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("True-Cost Regression Fixture", () => {
  test("50c entry, 1 qty, 2c fee yields 52c total, 48c net profit, 52% break-even", () => {
    const entryPriceCents = 50;
    const quantity = 1;
    const feeCents = 2;
    const grossPayoutCents = 100 * quantity;
    const totalCostCents = (entryPriceCents * quantity) + feeCents;
    const netProfitCents = grossPayoutCents - totalCostCents;
    const netLossCents = totalCostCents;
    const breakEvenProb = totalCostCents / grossPayoutCents;

    assert.equal(totalCostCents, 52);
    assert.equal(grossPayoutCents, 100);
    assert.equal(netProfitCents, 48);
    assert.equal(netLossCents, 52);
    assert.equal(breakEvenProb, 0.52);
  });
});
