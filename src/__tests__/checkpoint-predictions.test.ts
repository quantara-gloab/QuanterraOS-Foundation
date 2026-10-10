import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  recordPrediction,
  deriveCheckpointMinute,
  CANONICAL_CHECKPOINTS,
} from "../prediction-ledger.ts";
import { db } from "../db.ts";
import { predictions } from "../schema.ts";
import { eq } from "drizzle-orm";

describe("Phase 2 Task 2.4 Acceptance: One prediction per market per checkpoint (min 4/7/10/13)", () => {
  it("derives canonical checkpoints accurately (min 4, 7, 10, 13)", () => {
    assert.deepStrictEqual(CANONICAL_CHECKPOINTS, [4, 7, 10, 13]);

    const marketId = "KXBTC15M-26OCT151430-30"; // Close: 14:30 UTC, Open: 14:15 UTC

    // Minute 4: 14:19 UTC
    const min4 = deriveCheckpointMinute(marketId, "2026-10-15T14:19:10Z");
    assert.strictEqual(min4, 4);

    // Minute 7: 14:22 UTC
    const min7 = deriveCheckpointMinute(marketId, "2026-10-15T14:22:30Z");
    assert.strictEqual(min7, 7);

    // Minute 10: 14:25 UTC
    const min10 = deriveCheckpointMinute(marketId, "2026-10-15T14:25:00Z");
    assert.strictEqual(min10, 10);

    // Minute 13: 14:28 UTC
    const min13 = deriveCheckpointMinute(marketId, "2026-10-15T14:28:45Z");
    assert.strictEqual(min13, 13);
  });

  it("permits one prediction per checkpoint (4, 7, 10, 13) for a given market", () => {
    const marketId = `KXBTC15M-TESTCHK-${Date.now()}`;

    // Record checkpoint 4
    const p4 = recordPrediction({
      marketId,
      predictedProb: 0.52,
      modelVersion: "model-v2",
      checkpointMinute: 4,
    });
    assert.strictEqual(p4.checkpointMinute, 4);

    // Record checkpoint 7
    const p7 = recordPrediction({
      marketId,
      predictedProb: 0.54,
      modelVersion: "model-v2",
      checkpointMinute: 7,
    });
    assert.strictEqual(p7.checkpointMinute, 7);

    // Record checkpoint 10
    const p10 = recordPrediction({
      marketId,
      predictedProb: 0.58,
      modelVersion: "model-v2",
      checkpointMinute: 10,
    });
    assert.strictEqual(p10.checkpointMinute, 10);

    // Record checkpoint 13
    const p13 = recordPrediction({
      marketId,
      predictedProb: 0.61,
      modelVersion: "model-v2",
      checkpointMinute: 13,
    });
    assert.strictEqual(p13.checkpointMinute, 13);

    // Clean up
    db.delete(predictions).where(eq(predictions.marketId, marketId)).run();
  });

  it("strictly rejects a duplicate prediction for the same market at the same checkpoint", () => {
    const marketId = `KXBTC15M-TESTDUP-${Date.now()}`;

    // Initial prediction at checkpoint 4
    recordPrediction({
      marketId,
      predictedProb: 0.50,
      modelVersion: "model-v2",
      checkpointMinute: 4,
    });

    // Attempting a second prediction at checkpoint 4 on the same market MUST throw
    assert.throws(
      () => {
        recordPrediction({
          marketId,
          predictedProb: 0.55,
          modelVersion: "model-v2",
          checkpointMinute: 4,
        });
      },
      /Duplicate prediction violation.*checkpoint minute 4/
    );

    // Clean up
    db.delete(predictions).where(eq(predictions.marketId, marketId)).run();
  });
});
