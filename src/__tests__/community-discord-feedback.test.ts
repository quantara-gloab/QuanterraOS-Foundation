import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DISCORD_COMMUNITY_CONFIG,
  getFeedbackItems,
  upvoteFeedbackItem,
  submitFeedbackItem,
  renderCommunityDiscordPageHtml,
  renderFeedbackBoardHtml,
} from "../lib/community-feedback.ts";
import { renderChangelogPageHtml } from "../changelog-page.ts";

describe("Phase 7 Task 7.3 Acceptance: Discord Launch, Moderation Rules & Feedback Voting Board", () => {
  describe("Discord Launch & Cockpit Moderation Rules (Part 3.7)", () => {
    it("configures official server name, invite URL, and the 4 required launch channels", () => {
      assert.ok(DISCORD_COMMUNITY_CONFIG.serverName.includes("QuanterraOS"));
      assert.ok(DISCORD_COMMUNITY_CONFIG.inviteUrl.includes("discord.gg"));

      const channelNames = DISCORD_COMMUNITY_CONFIG.channels.map(c => c.name);
      assert.ok(channelNames.includes("#bridge-general"), "channel #bridge-general is defined");
      assert.ok(channelNames.includes("#flight-school"), "channel #flight-school is defined");
      assert.ok(channelNames.includes("#feature-requests"), "channel #feature-requests is defined");
      assert.ok(channelNames.includes("#bug-reports"), "channel #bug-reports is defined");
    });

    it("strictly enforces anti-trade-calling moderation rules (Rule 1: Zero trade calls)", () => {
      const rule1 = DISCORD_COMMUNITY_CONFIG.moderationRules.find(r => r.number === 1);
      assert.ok(rule1);
      assert.ok(rule1.rule.includes("Zero Trade-Calling"));
      assert.ok(rule1.description.includes("Posting trade calls, buy/sell recommendations, or speculative signals is strictly prohibited"));

      // Zero trade-calling channels exist
      const hasTradeChannel = DISCORD_COMMUNITY_CONFIG.channels.some(c =>
        c.name.includes("trade") || c.name.includes("calls") || c.name.includes("picks") || c.name.includes("signals")
      );
      assert.equal(hasTradeChannel, false, "No trade-calling channels are permitted");
    });
  });

  describe("Public Feature Feedback & Voting Board (Part 3.7)", () => {
    it("returns ranked feedback items sorted by votes descending", () => {
      const items = getFeedbackItems();
      assert.ok(items.length >= 4);
      for (let i = 0; i < items.length - 1; i++) {
        assert.ok(items[i].votes >= items[i + 1].votes, "Items must be sorted by vote count descending");
      }
    });

    it("allows upvoting feature proposals and increments counter", () => {
      const itemsBefore = getFeedbackItems();
      const target = itemsBefore[0];
      const initialVotes = target.votes;

      const updated = upvoteFeedbackItem(target.id);
      assert.ok(updated);
      assert.equal(updated.votes, initialVotes + 1);
    });

    it("allows pilots to submit valid feature proposals with UNDER_REVIEW status", () => {
      const proposal = submitFeedbackItem({
        title: "CME CF BRTI Historical Kurtosis Visualizer",
        category: "radar",
        description: "Visual overlay showing fat-tail risk during high-volatility macroeconomic release windows.",
        authorCallsign: "Pilot-Alpha",
      });

      assert.ok(proposal.id.startsWith("fb_"));
      assert.equal(proposal.title, "CME CF BRTI Historical Kurtosis Visualizer");
      assert.equal(proposal.category, "radar");
      assert.equal(proposal.votes, 1);
      assert.equal(proposal.status, "UNDER_REVIEW");
    });

    it("rejects proposal submissions with empty title or description", () => {
      assert.throws(() => {
        submitFeedbackItem({
          title: "",
          category: "radar",
          description: "Description",
        });
      }, /title is required/);

      assert.throws(() => {
        submitFeedbackItem({
          title: "Title",
          category: "radar",
          description: "",
        });
      }, /description is required/);
    });
  });

  describe("HTML UI Rendering Integrity (/community, /feedback & /changelog)", () => {
    it("renders Community Discord page with channels, rules, and invite button", () => {
      const html = renderCommunityDiscordPageHtml();
      assert.ok(html.includes("QuanterraOS Flight Crew"), "Server name rendered");
      assert.ok(html.includes("#bridge-general"), "#bridge-general channel rendered");
      assert.ok(html.includes("#flight-school"), "#flight-school channel rendered");
      assert.ok(html.includes("#feature-requests"), "#feature-requests channel rendered");
      assert.ok(html.includes("#bug-reports"), "#bug-reports channel rendered");
      assert.ok(html.includes("Rule 1: Zero Trade-Calling"), "Rule 1 rendered");
      assert.ok(html.includes('id="btn-join-discord"'), "Join button rendered");
    });

    it("renders Feature Feedback Board with voting cards and submission form", () => {
      const html = renderFeedbackBoardHtml();
      assert.ok(html.includes("Feature Voting Board"), "Header is present");
      assert.ok(html.includes('id="btn-suggest-feature"'), "Propose feature button is present");
      assert.ok(html.includes('id="proposal-form-container"'), "Proposal form is present");
      assert.ok(html.includes("function upvoteFeature"), "Upvote script is defined");
      assert.ok(html.includes("function handleProposalSubmit"), "Submit script is defined");
    });

    it("renders Release Changelog with v2.0.0 milestone and link to /feedback", () => {
      const html = renderChangelogPageHtml();
      assert.ok(html.includes("v2.0.0 — Celestial Flight Deck"), "v2.0.0 release notes are rendered");
      assert.ok(html.includes('href="/feedback"'), "Link to feature voting board is present");
      assert.ok(html.includes("Open Feature Voting Board"), "CTA button is present");
    });
  });
});
