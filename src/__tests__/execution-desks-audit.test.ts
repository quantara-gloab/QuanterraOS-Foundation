import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

describe("Phase 1 Task 1.8 Acceptance: 'Execution Desks' -> 'Market View'", () => {
  it("verifies git grep for 'Execution Desk' returns 0 matches in code and docs (excluding handoff docs)", () => {
    let output = "";
    try {
      output = execSync(
        'git grep -i "Execution Desk" -- ":!QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md" ":!src/__tests__/execution-desks-audit.test.ts"',
        { encoding: "utf8" }
      );
    } catch {
      // Exit code 1 means 0 matches, which is expected
      output = "";
    }
    assert.strictEqual(output.trim(), "", `Expected 0 matches for 'Execution Desk', but found:\n${output}`);
  });

  it("verifies that dashboard terminal renders 'Market View:' where Execution Desks was previously located", () => {
    const content = fs.readFileSync(path.join(process.cwd(), "src/dashboard-terminal.ts"), "utf8");
    assert.match(content, /Market View:<\/span>/, "Expected dashboard terminal to display 'Market View:'");
  });
});
