import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Phase 1 Task 1.5 Acceptance: removal of competitor 'Fatal Flaw' attack cards", () => {
  it("verifies landing page contains no 'Fatal Flaw' cards and contains the neutral independence statement", () => {
    const landingPath = path.resolve("src/landing-page.ts");
    const content = fs.readFileSync(landingPath, "utf8");

    assert.ok(
      !content.includes("Fatal Flaw:"),
      "Landing page must not contain 'Fatal Flaw:' competitor attack cards"
    );

    assert.ok(
      content.includes("Independent Venue-Neutral Architecture"),
      "Landing page must contain neutral independence section"
    );
    assert.ok(
      content.includes("QuanterraOS is an independent analytics flight deck"),
      "Landing page must contain independent flight deck copy"
    );
  });

  it("verifies competitive benchmark template does not use 'Fatal Flaw' UI labels", () => {
    const benchmarkPath = path.resolve("src/competitive-benchmark.ts");
    const content = fs.readFileSync(benchmarkPath, "utf8");

    assert.ok(
      !content.includes("<strong>Fatal Flaw:</strong>"),
      "Competitive benchmark must not use 'Fatal Flaw' UI label"
    );
    assert.ok(
      content.includes("<strong>Structural Limitation:</strong>"),
      "Competitive benchmark must use neutral 'Structural Limitation' label"
    );
  });
});
