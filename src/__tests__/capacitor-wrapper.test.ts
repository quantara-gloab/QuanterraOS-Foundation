/**
 * Acceptance Test Suite: Phase 8 Task 8.4
 * Mobile Polish: Capacitor Native Wrapper & Submittal Gate
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  canSubmitNativeApp,
  getCapacitorConfigSummary,
  getAppStoreReviewNotes,
} from "../lib/capacitor-wrapper.ts";

describe("Phase 8 Task 8.4 Acceptance: Capacitor Wrapper & Submission Gate (Part 3.11)", () => {
  describe("1. Capacitor Configuration Integrity (capacitor.config.json)", () => {
    const configPath = path.resolve("capacitor.config.json");
    assert.ok(fs.existsSync(configPath), "capacitor.config.json must exist in root");

    it("declares production app identification and secure server wrapping", () => {
      const summary = getCapacitorConfigSummary();
      assert.strictEqual(summary.appId, "global.quantara.quanterraos");
      assert.strictEqual(summary.appName, "QuanterraOS");
      assert.strictEqual(summary.webDir, "public");
      assert.strictEqual(summary.serverUrl, "https://quanterraos.com");
      assert.strictEqual(summary.hasPushPlugin, true);
      assert.strictEqual(summary.hasHapticsPlugin, true);
    });

    it("strictly disallows unencrypted cleartext HTTP traffic", () => {
      const raw = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(raw);
      assert.strictEqual(config.server?.cleartext, false, "Must prohibit cleartext HTTP");
    });
  });

  describe("2. App Store Review Documentation (CAPACITOR_APP_STORE_REVIEW_NOTES.md)", () => {
    const reviewNotes = getAppStoreReviewNotes();

    it("verifies review notes file exists and contains mandatory regulatory declarations", () => {
      assert.ok(reviewNotes.length > 500, "Review notes must contain comprehensive instructions");
      assert.ok(reviewNotes.includes("Non-Gambling Declaration"), "Must declare non-gambling status");
      assert.ok(reviewNotes.includes("Zero Live Capital Exposure ($0.00)"), "Must state Rule B5 $0.00 exposure");
      assert.ok(reviewNotes.includes("Rule B5"), "Must cite Rule B5");
      assert.ok(reviewNotes.includes("Finance"), "Must specify primary Finance category");
    });

    it("includes demo reviewer credentials and testing instructions", () => {
      assert.ok(reviewNotes.includes("reviewer@quanterraos.com"), "Must provide reviewer email");
      assert.ok(reviewNotes.includes("/check") && reviewNotes.includes("True-Cost Check"), "Must detail /check testing");
      assert.ok(reviewNotes.includes("/radar") && reviewNotes.includes("Settlement Radar"), "Must detail /radar testing");
      assert.ok(reviewNotes.includes("/proof") && reviewNotes.includes("Proof Ledger"), "Must detail /proof testing");
    });
  });

  describe("3. Native App Store Submission Gate (D30 >= 25% & Founder Approval)", () => {
    it("strictly blocks submission when D30 retention is below 25%", () => {
      const gate = canSubmitNativeApp({
        d30RetentionPct: 18.2, // Below 25% threshold
        founderApproved: true,
      });

      assert.strictEqual(gate.canSubmit, false);
      assert.ok(gate.blockers.length >= 1);
      assert.ok(
        gate.blockers.some((b) => b.includes("below the required 25.0% threshold")),
        "Must specify D30 retention blocker"
      );
    });

    it("strictly blocks submission when founder approval is missing", () => {
      const gate = canSubmitNativeApp({
        d30RetentionPct: 29.5, // Satisfies D30 threshold
        founderApproved: false, // Lacks founder approval
      });

      assert.strictEqual(gate.canSubmit, false);
      assert.ok(gate.blockers.length >= 1);
      assert.ok(
        gate.blockers.some((b) => b.includes("Explicit founder written authorization required")),
        "Must specify founder approval blocker"
      );
    });

    it("allows submission ONLY when both D30 >= 25% and founder approval are satisfied", () => {
      const gate = canSubmitNativeApp({
        d30RetentionPct: 27.4,
        founderApproved: true,
      });

      assert.strictEqual(gate.canSubmit, true);
      assert.strictEqual(gate.blockers.length, 0);
      assert.strictEqual(gate.appStoreReviewNotesReady, true);
      assert.strictEqual(gate.capacitorConfigValid, true);
    });
  });

  describe("4. Non-Advisory & Rule B5 Compliance Proof", () => {
    it("confirms zero order routing in Capacitor wrapper and review notes", () => {
      const notes = getAppStoreReviewNotes();
      const code = fs.readFileSync(path.resolve("src/lib/capacitor-wrapper.ts"), "utf-8");
      const combined = (notes + code).toLowerCase();

      assert.ok(!combined.includes("placeorder("));
      assert.ok(!combined.includes("routeorder("));
      assert.ok(combined.includes("$0.00"));
      assert.ok(!combined.includes("guaranteed win"));
    });
  });
});
