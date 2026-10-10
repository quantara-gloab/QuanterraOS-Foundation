import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Phase 1 Task 1.7 Acceptance: sync-error and warning banners only on actual failure", () => {
  it("verifies that #edge warning banner is hidden by default and only shown on actual discrepancy or error", () => {
    const serverTs = fs.readFileSync(path.join(process.cwd(), "src/server.ts"), "utf8");
    
    // Check initial HTML template does not show warning banner by default
    assert.match(
      serverTs,
      /<div class="warn-banner" id="edge" style="display:none;"><\/div>/,
      "Expected #edge to be hidden by default with style='display:none;' and empty content"
    );

    // Verify it doesn't have the old default text "Checking model edge…" in HTML template
    assert.doesNotMatch(
      serverTs,
      /<div class="warn-banner" id="edge">Checking model edge…<\/div>/,
      "Expected #edge not to have default 'Checking model edge…' banner"
    );

    // Verify error catch block sets the error and displays the banner
    assert.match(
      serverTs,
      /edgeEl\.textContent = "Sync error: " \+ err\.message;\s*edgeEl\.style\.display = "block";/,
      "Expected catch block to set Sync error text and show banner only on actual error"
    );
  });
});
