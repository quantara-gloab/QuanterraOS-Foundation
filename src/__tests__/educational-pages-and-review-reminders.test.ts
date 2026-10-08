/**
 * Automated Acceptance Test Suite: Educational Discovery Pages, Review Reminders & Concierge Workflows
 * 
 * Verifies:
 * 1. Educational Discovery Pages (/learn/fees, /learn/breakeven, /learn/settlement, /learn/journal):
 *    - Renders topic-specific content, citations, and interactive True-Cost Check widgets.
 *    - Enforces Rule B4 (zero marketing superlatives, no edge claims) and Rule B5 ($0.00 capital lock).
 * 2. Review Reminders & Notification Preferences:
 *    - Stores, updates, and disables incomplete journal alerts and weekly digests.
 *    - Renders HTML settings component with accurate active/disabled state and channel selectors.
 * 3. Priority Concierge Queries (Aria):
 *    - Answers "Explain my costs" with parabolic taker fee breakdown and breakeven win rate.
 *    - Answers "Save my check" with local storage preservation details and journal links.
 *    - Answers "Find my journal" with authentication requirements and record privacy disclosures.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderEducationalPageHtml, type EducationTopic } from "../educational-pages.ts";
import {
  getReviewReminders,
  updateReviewReminders,
  disableAllReviewReminders,
  renderReviewRemindersHtml
} from "../review-reminders.ts";
import { generatePersonaDomainResponse } from "../agents/council-chat.ts";
import { VIRTUAL_ASSISTANT_PERSONA } from "../agents/council-personas.ts";

describe("Educational Discovery Pages, Review Reminders & Concierge Test Suite", () => {

  describe("1. Educational Discovery Pages (/learn/*)", () => {
    const topics: EducationTopic[] = ["fees", "breakeven", "settlement", "journal"];

    for (const topic of topics) {
      it(`renders valid, fully compliant HTML for topic: /learn/${topic}`, () => {
        const html = renderEducationalPageHtml(topic);
        assert.ok(html.includes("<!DOCTYPE html>"), "Should produce full HTML document");
        assert.ok(html.includes("quanterraos"), "Should contain brand header");
        assert.ok(html.includes("Live Interactive Check"), "Should embed interactive check");
        assert.ok(html.includes("embedded-check-wrap"), "Should have interactive calculator wedge");
        assert.ok(html.includes("Source &amp; Methodology Attribution:"), "Should include verified source attribution");

        // Rule B4 & B5 checks
        assert.ok(!html.includes("guaranteed profit"), "Must not claim guaranteed profit");
        assert.ok(!html.includes("arbitrage opportunity"), "Must not claim arbitrage");
        assert.ok(!html.includes("beat the market"), "Must not claim beating the market");
        assert.ok(html.includes("$0.00"), "Should reaffirm $0.00 paper mode / capital lock");
      });
    }

    it("verifies specific mathematical concepts in topic bodies", () => {
      const feesHtml = renderEducationalPageHtml("fees");
      assert.ok(feesHtml.includes("0.07"), "Fees guide must cite the 0.07 parabolic formula");
      assert.ok(feesHtml.includes("Parabolic Taker Fee"), "Fees guide must explain parabolic curve");

      const breakevenHtml = renderEducationalPageHtml("breakeven");
      assert.ok(breakevenHtml.includes("True Breakeven"), "Breakeven guide must explain true hurdle rate");
      assert.ok(breakevenHtml.includes("52.80%"), "Breakeven guide must demonstrate fee drag on 51¢ ask");

      const settlementHtml = renderEducationalPageHtml("settlement");
      assert.ok(settlementHtml.includes("BRTI"), "Settlement guide must reference CME CF BRTI");
      assert.ok(settlementHtml.includes("TWAP"), "Settlement guide must reference TWAP");

      const journalHtml = renderEducationalPageHtml("journal");
      assert.ok(journalHtml.includes("pre-trade hypothesis"), "Journal guide must emphasize pre-trade hypotheses");
      assert.ok(journalHtml.includes("Reconciling Statement Proof"), "Journal guide must explain statement reconciliation");
    });
  });

  describe("2. Review Reminders & Discipline Notifications", () => {
    const testUser = "user_test_reminders_001";

    it("initializes with default preferences enabled", () => {
      const prefs = getReviewReminders(testUser);
      assert.strictEqual(prefs.userId, testUser);
      assert.strictEqual(prefs.enabled, true);
      assert.strictEqual(prefs.incompleteEntriesReminder, true);
      assert.strictEqual(prefs.weeklyReviewReminder, true);
      assert.strictEqual(prefs.channel, "in_app");
    });

    it("updates preferences accurately", () => {
      const updated = updateReviewReminders(testUser, {
        channel: "email",
        email: "quant@example.com",
        incompleteEntriesReminder: false
      });
      assert.strictEqual(updated.channel, "email");
      assert.strictEqual(updated.email, "quant@example.com");
      assert.strictEqual(updated.incompleteEntriesReminder, false);
      assert.strictEqual(updated.weeklyReviewReminder, true);
      assert.strictEqual(updated.enabled, true);

      // Verify persistence in store
      const retrieved = getReviewReminders(testUser);
      assert.strictEqual(retrieved.email, "quant@example.com");
      assert.strictEqual(retrieved.incompleteEntriesReminder, false);
    });

    it("allows 1-click disabling of all reminders", () => {
      const disabled = disableAllReviewReminders(testUser);
      assert.strictEqual(disabled.enabled, false);

      const retrieved = getReviewReminders(testUser);
      assert.strictEqual(retrieved.enabled, false);
    });

    it("renders settings HTML with correct active vs disabled status", () => {
      const activePrefs = {
        userId: "active_user",
        incompleteEntriesReminder: true,
        weeklyReviewReminder: true,
        channel: "in_app" as const,
        email: null,
        enabled: true,
        updatedAt: new Date().toISOString()
      };
      const activeHtml = renderReviewRemindersHtml(activePrefs);
      assert.ok(activeHtml.includes("REMINDERS ACTIVE"), "Should indicate active status");
      assert.ok(activeHtml.includes("id=\"reminders-settings-card\""), "Should render card");
      assert.ok(activeHtml.includes("Incomplete Journal Entry Alerts"), "Should include incomplete alerts");

      const disabledPrefs = {
        ...activePrefs,
        enabled: false
      };
      const disabledHtml = renderReviewRemindersHtml(disabledPrefs);
      assert.ok(disabledHtml.includes("REMINDERS DISABLED"), "Should indicate disabled status");
    });
  });

  describe("3. Virtual Concierge (Aria) High-Priority Query Handlers", () => {
    it("answers 'Explain my costs' with clear fee formula and breakeven arithmetic", () => {
      const res = generatePersonaDomainResponse(
        VIRTUAL_ASSISTANT_PERSONA,
        "Explain my costs for a Kalshi contract"
      );

      assert.ok(res.reply.includes("Parabolic") || res.reply.includes("0.07"), "Must mention taker fee formula");
      assert.ok(res.reply.includes("52.80%"), "Must compute exact 52.80% breakeven on 51¢ ask");
      assert.ok(res.citations.includes("Kalshi Rulebook Chapter 3"), "Must cite Kalshi Rulebook");
    });

    it("answers 'Save my check' with local storage and journal guidance", () => {
      const res = generatePersonaDomainResponse(
        VIRTUAL_ASSISTANT_PERSONA,
        "How do I save my check to my journal?"
      );

      assert.ok(res.reply.includes("Save My Check & Start Journal") || res.reply.includes("Decision Journal"), "Must instruct on saving checks");
      assert.ok(res.reply.includes("local storage"), "Must mention local preservation");
      assert.ok(res.citations.includes("src/journal-page.ts"), "Must cite journal page");
    });

    it("answers 'Find my journal' with authentication and privacy requirements", () => {
      const res = generatePersonaDomainResponse(
        VIRTUAL_ASSISTANT_PERSONA,
        "Where can I find my journal records?"
      );

      assert.ok(res.reply.includes("Authentication Required") || res.reply.includes("sign in"), "Must state authentication requirement");
      assert.ok(res.reply.includes("/account") || res.reply.includes("/journal"), "Must reference account or journal routes");
      assert.ok(res.reply.includes("privacy"), "Must emphasize privacy protections");
    });
  });
});
