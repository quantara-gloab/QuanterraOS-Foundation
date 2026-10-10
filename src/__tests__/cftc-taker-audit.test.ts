import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";

describe("Phase 1 Task 1.4 Acceptance: legacy fee label removal", () => {
  it("verifies grep for legacy taker label returns zero matches across the codebase", () => {
    const target = ["CFTC", "taker"].join(" ");
    let output = "";
    try {
      // Exclude this test file itself from git grep
      output = execSync(`git grep -i "${target}" -- ":!src/__tests__/cftc-taker-audit.test.ts"`, { encoding: "utf8" });
    } catch {
      // Exit code 1 means 0 matches found, which is what we require
      output = "";
    }
    assert.strictEqual(output.trim(), "", `Expected 0 matches for legacy fee label, but found:\n${output}`);
  });
});
