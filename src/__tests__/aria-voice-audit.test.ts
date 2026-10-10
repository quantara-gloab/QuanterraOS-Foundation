import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Phase 1 Task 1.9 Acceptance: Aria voice default OFF site-wide", () => {
  it("verifies Aria assistant widget defaults voice to OFF in markup and script", () => {
    const content = fs.readFileSync(path.join(process.cwd(), "src/assistant-widget.ts"), "utf8");

    // Markup verification
    assert.match(
      content,
      /<button id="qos-voice-toggle" class="qos-tool-btn" title="Toggle Voice \/ Read Aloud" aria-pressed="false">/,
      "Expected voice toggle button to be aria-pressed='false' and not have qos-voice-active class by default"
    );
    assert.match(
      content,
      /<span id="qos-voice-icon">🔇 Voice OFF<\/span>/,
      "Expected voice icon to indicate Voice OFF by default"
    );

    // Script variable verification
    assert.match(
      content,
      /let isVoiceEnabled = false;/,
      "Expected isVoiceEnabled script variable to be initialized to false"
    );
    assert.doesNotMatch(
      content,
      /let isVoiceEnabled = true;/,
      "Expected isVoiceEnabled NOT to be initialized to true"
    );
  });

  it("verifies dashboard terminal specialist voice defaults to OFF", () => {
    const content = fs.readFileSync(path.join(process.cwd(), "src/dashboard-terminal.ts"), "utf8");
    assert.match(
      content,
      /let isSpecVoiceEnabled = false;/,
      "Expected specialist voice toggle in dashboard terminal to default to false"
    );
    assert.match(
      content,
      /🔇 Voice OFF/,
      "Expected specialist voice toggle button text to show 'Voice OFF'"
    );
  });
});
