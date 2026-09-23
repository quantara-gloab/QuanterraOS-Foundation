import { test } from "node:test";
import assert from "node:assert/strict";
import { handleResolve } from "../routes/workspace.ts";
import type { ResolutionRow } from "../scoring.ts";

test("resolution handler rejects silent overwrites and links explicit corrections", async () => {
  let existing: ResolutionRow | null = null;
  const saved: Array<ResolutionRow & { correctionReason?: string | null }> = [];
  const deps = {
    getExistingResolution: async () => existing,
    saveResolution: async (row: ResolutionRow & { correctionReason?: string | null }) => {
      saved.push(row);
      existing = row;
    },
  };

  const first = await handleResolve(
    { owner: "alex", contract: "TEST", outcome: "YES", officialSource: "manual" },
    deps
  );
  assert.equal(first.status, 200);
  assert.equal(saved[0].correctionOf, null);

  const rejected = await handleResolve(
    { owner: "alex", contract: "TEST", outcome: "NO", officialSource: "manual" },
    deps
  );
  assert.equal(rejected.status, 409);
  assert.equal(saved.length, 1);

  const correction = await handleResolve(
    {
      owner: "alex",
      contract: "TEST",
      outcome: "NO",
      officialSource: "manual-correction",
      isCorrection: true,
      correctionReason: "Official source corrected the result",
    },
    deps
  );
  assert.equal(correction.status, 200);
  assert.equal(saved.length, 2);
  assert.equal(saved[1].correctionOf, saved[0].resolvedAt);
});