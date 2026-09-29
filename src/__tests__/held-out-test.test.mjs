import assert from "node:assert/strict";
import { test } from "node:test";
import { runHeldOutTest } from "../held-out-test.mjs";

test("runHeldOutTest learns groups from training and evaluates only the held-out half", () => {
  const data = [
    { signal: 0, result: "yes" }, { signal: 1, result: "yes" },
    { signal: 2, result: "yes" }, { signal: 3, result: "no" },
    { signal: 10, result: "no" }, { signal: 11, result: "no" },
    { signal: 12, result: "no" }, { signal: 13, result: "no" },
    { signal: 0, result: "yes" }, { signal: 1, result: "yes" },
    { signal: 10, result: "no" }, { signal: 11, result: "no" },
  ].map((entry) => ({ ...entry, yesAsk: 0.4, noAsk: 0.4 }));
  const result = runHeldOutTest("signal", data, {
    comparisonCount: 2,
    bootstrapIterations: 100,
    random: () => 0.5,
  });

  assert.equal(result.threshold, 2.5);
  assert.equal(result.trainingMarkets, 6);
  assert.equal(result.heldOutMarkets, 6);
  assert.equal(result.heldOut.wins, 6);
  assert.equal(result.heldOut.winRate, 100);
  assert.equal(result.bootstrap.bonferroniAlpha, 0.025);
});

test("runHeldOutTest reports insufficient data rather than inventing a result", () => {
  const result = runHeldOutTest("signal", [
    { signal: 1, result: "yes", yesAsk: 0.5, noAsk: 0.5 },
  ]);

  assert.equal(result.threshold, null);
  assert.match(result.reason, /Insufficient eligible data/);
});