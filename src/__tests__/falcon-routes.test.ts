import { test } from "node:test";
import assert from "node:assert/strict";
import { handleFalconRecommend, handleFalconDecision, type FalconRecommendationRow } from "../routes/falcon.ts";
import type { ObservationRow } from "../scoring.ts";

function makeStore() {
  const recommendations = new Map<string, FalconRecommendationRow>();
  const observations: ObservationRow[] = [];
  let nextId = 0;
  return {
    recommendations,
    observations,
    generateId: () => `id-${nextId++}`,
    saveRecommendation: async (row: FalconRecommendationRow) => {
      recommendations.set(row.id, row);
    },
    getRecommendation: async (id: string) => recommendations.get(id) ?? null,
    updateRecommendation: async (row: FalconRecommendationRow) => {
      recommendations.set(row.id, row);
    },
    observeDeps: {
      generateId: () => `obs-${observations.length}`,
      saveObservation: async (row: ObservationRow) => {
        observations.push(row);
      },
    },
  };
}

test("recommend stores a proposed recommendation from real evidence", async () => {
  const store = makeStore();
  const result = await handleFalconRecommend(
    {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      evidence: [
        { marketTicker: "KXBTC15M-TEST", capturedAt: 1, bestYesPrice: 0.5, bestNoPrice: 0.48, topImbalance: 0, depthImbalance: 0.3 },
      ],
    },
    store
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.status, "proposed");
  assert.equal(store.recommendations.size, 1);
});

test("accept records a real observation via the shared handleObserve path", async () => {
  const store = makeStore();
  const created = await handleFalconRecommend(
    {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      evidence: [
        { marketTicker: "KXBTC15M-TEST", capturedAt: 1, bestYesPrice: 0.5, bestNoPrice: 0.48, topImbalance: 0, depthImbalance: 0.3 },
      ],
    },
    store
  );

  const decision = await handleFalconDecision(
    { owner: "alex", recommendationId: created.body.id, action: "accept" },
    store
  );

  assert.equal(decision.status, 200);
  assert.equal(store.observations.length, 1);
  assert.equal(store.observations[0].probability, created.body.suggestedProbability);
  assert.equal(store.recommendations.get(created.body.id)?.status, "accepted");
  assert.equal(store.recommendations.get(created.body.id)?.observationId, store.observations[0].id);
});

test("edit records the human-edited probability, not Falcon's suggestion", async () => {
  const store = makeStore();
  const created = await handleFalconRecommend(
    {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      evidence: [
        { marketTicker: "KXBTC15M-TEST", capturedAt: 1, bestYesPrice: 0.5, bestNoPrice: 0.48, topImbalance: 0, depthImbalance: 0.3 },
      ],
    },
    store
  );

  const decision = await handleFalconDecision(
    { owner: "alex", recommendationId: created.body.id, action: "edit", probability: 0.77 },
    store
  );

  assert.equal(decision.status, 200);
  assert.equal(store.observations[0].probability, 0.77);
  assert.equal(store.recommendations.get(created.body.id)?.status, "edited");
});

test("edit without a probability is rejected rather than silently falling back", async () => {
  const store = makeStore();
  const created = await handleFalconRecommend(
    {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      evidence: [
        { marketTicker: "KXBTC15M-TEST", capturedAt: 1, bestYesPrice: 0.5, bestNoPrice: 0.48, topImbalance: 0, depthImbalance: 0.3 },
      ],
    },
    store
  );

  const decision = await handleFalconDecision(
    { owner: "alex", recommendationId: created.body.id, action: "edit" },
    store
  );

  assert.equal(decision.status, 400);
  assert.equal(store.observations.length, 0);
});

test("reject never touches research_observations", async () => {
  const store = makeStore();
  const created = await handleFalconRecommend(
    {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      evidence: [
        { marketTicker: "KXBTC15M-TEST", capturedAt: 1, bestYesPrice: 0.5, bestNoPrice: 0.48, topImbalance: 0, depthImbalance: 0.3 },
      ],
    },
    store
  );

  const decision = await handleFalconDecision(
    { owner: "alex", recommendationId: created.body.id, action: "reject" },
    store
  );

  assert.equal(decision.status, 200);
  assert.equal(store.observations.length, 0);
  assert.equal(store.recommendations.get(created.body.id)?.status, "rejected");
});

test("a recommendation cannot be decided twice", async () => {
  const store = makeStore();
  const created = await handleFalconRecommend(
    {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      evidence: [
        { marketTicker: "KXBTC15M-TEST", capturedAt: 1, bestYesPrice: 0.5, bestNoPrice: 0.48, topImbalance: 0, depthImbalance: 0.3 },
      ],
    },
    store
  );

  await handleFalconDecision({ owner: "alex", recommendationId: created.body.id, action: "reject" }, store);
  const second = await handleFalconDecision({ owner: "alex", recommendationId: created.body.id, action: "accept" }, store);

  assert.equal(second.status, 409);
});

test("a different owner cannot decide on someone else's recommendation", async () => {
  const store = makeStore();
  const created = await handleFalconRecommend(
    {
      owner: "alex",
      contract: "KXBTC15M-TEST",
      evidence: [
        { marketTicker: "KXBTC15M-TEST", capturedAt: 1, bestYesPrice: 0.5, bestNoPrice: 0.48, topImbalance: 0, depthImbalance: 0.3 },
      ],
    },
    store
  );

  const decision = await handleFalconDecision(
    { owner: "someone-else", recommendationId: created.body.id, action: "accept" },
    store
  );

  assert.equal(decision.status, 404);
});
