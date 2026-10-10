import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HELP_ARTICLES,
  getPlanSupportSla,
  searchHelpArticles,
  createSupportTicket,
  getAllSupportTickets,
} from "../lib/support-escalation.ts";
import { renderHelpPageHtml } from "../help-page.ts";

describe("Phase 7 Task 7.2 Acceptance: /help Center, Aria Escalation & Plan SLAs", () => {
  describe("Knowledge Articles & Verbatim Still Stuck Banner (Part 3.7)", () => {
    it("contains comprehensive Flight School and FAQ articles", () => {
      assert.ok(HELP_ARTICLES.length >= 6);
      const categories = new Set(HELP_ARTICLES.map(a => a.category));
      assert.ok(categories.has("fees"));
      assert.ok(categories.has("settlement"));
      assert.ok(categories.has("responsible-trading"));
      assert.ok(categories.has("flight-deck"));
      assert.ok(categories.has("billing"));
    });

    it("verifies every article ends with verbatim 'Still stuck? Ask Aria.' in rendered HTML", () => {
      const html = renderHelpPageHtml("pilot");
      const stuckMatches = html.match(/Still stuck\? <strong>Ask Aria\.<\/strong>/g);
      assert.ok(stuckMatches);
      assert.equal(stuckMatches.length, HELP_ARTICLES.length, "Every article must conclude with 'Still stuck? Ask Aria.'");
    });

    it("filters articles accurately based on search keyword", () => {
      const feeArticles = searchHelpArticles("fees");
      assert.ok(feeArticles.length >= 1);
      assert.ok(feeArticles.some(a => a.id === "art-kalshi-fees"));

      const twapArticles = searchHelpArticles("twap");
      assert.ok(twapArticles.length >= 1);
      assert.ok(twapArticles.some(a => a.id === "art-settlement-twap"));

      const emptyArticles = searchHelpArticles("nonexistent-query-xyz");
      assert.equal(emptyArticles.length, 0);
    });
  });

  describe("SLA Tagging by Plan Tier (Part 3.7 & Part 4)", () => {
    it("tags Pilot (Pro) with <24h SLA", () => {
      const sla = getPlanSupportSla("pilot");
      assert.equal(sla.maxHours, 24);
      assert.ok(sla.slaTag.includes("<24"));
    });

    it("tags Commander (Desk) with <4 business hours SLA", () => {
      const sla = getPlanSupportSla("commander");
      assert.equal(sla.maxHours, 4);
      assert.ok(sla.slaTag.includes("<4"));
    });

    it("tags Institutional with <1h dedicated channel SLA", () => {
      const sla = getPlanSupportSla("institutional");
      assert.equal(sla.maxHours, 1);
      assert.ok(sla.slaTag.includes("<1h"));
    });

    it("tags Cadet (Free) with <72h standard community SLA", () => {
      const sla = getPlanSupportSla("cadet");
      assert.equal(sla.maxHours, 72);
      assert.ok(sla.slaTag.includes("<72"));
    });
  });

  describe("Human Escalation Dispatch & Consent Guardrails (Part 3.7)", () => {
    it("creates support ticket routed to support@quanterraos.com with plan SLA", () => {
      const ticket = createSupportTicket({
        userId: "usr_pilot_test",
        email: "pilot@example.com",
        plan: "pilot",
        subject: "Discrepancy in simulated maker fee discount",
        message: "When testing Maker Saver at 48¢, I observed an interesting spread pattern.",
        userConsentGiven: true,
      });

      assert.ok(ticket.ticketId.startsWith("tkt_"));
      assert.equal(ticket.destinationEmail, "support@quanterraos.com");
      assert.equal(ticket.slaMaxHours, 24);
      assert.equal(ticket.status, "ROUTED");
      assert.ok(ticket.slaTag.includes("<24"));
    });

    it("strictly requires explicit user consent when attaching Aria conversation transcript", () => {
      const transcript = [
        { role: "user", content: "What is the fee for 100 contracts at 50c?" },
        { role: "aria", content: "Kalshi taker fee is $1.75." },
      ];

      // Throws error if consent is false
      assert.throws(
        () => {
          createSupportTicket({
            userId: "usr_no_consent",
            email: "user@example.com",
            plan: "cadet",
            subject: "Help needed",
            message: "See attached conversation",
            attachedAriaTranscript: transcript,
            userConsentGiven: false,
          });
        },
        /Consent required/
      );

      // Succeeds when consent is explicitly true
      const consentedTicket = createSupportTicket({
        userId: "usr_consented",
        email: "user@example.com",
        plan: "cadet",
        subject: "Help needed with calculations",
        message: "See attached conversation",
        attachedAriaTranscript: transcript,
        userConsentGiven: true,
      });

      assert.ok(consentedTicket.attachedAriaTranscript);
      assert.equal(consentedTicket.attachedAriaTranscript?.length, 2);
    });

    it("rejects ticket submissions with missing email or subject", () => {
      assert.throws(() => {
        createSupportTicket({
          email: "invalid-email",
          subject: "Test",
          message: "Message",
          userConsentGiven: false,
        });
      }, /valid email/);

      assert.throws(() => {
        createSupportTicket({
          email: "pilot@example.com",
          subject: "",
          message: "Message",
          userConsentGiven: false,
        });
      }, /subject is required/);
    });
  });

  describe("Help Center HTML UI Integrity (/help)", () => {
    it("renders search input, category cards, and human escalation box", () => {
      const html = renderHelpPageHtml("pilot", "pilot@example.com");
      assert.ok(html.includes('id="help-search-input"'), "Search input is present");
      assert.ok(html.includes('id="human-escalation-card"'), "Human escalation card is present");
      assert.ok(html.includes('id="ticket-consent"'), "Transcript consent checkbox is present");
      assert.ok(html.includes("PILOT PRO PRIORITY (<24 HOURS SLA)"), "User plan SLA is rendered");
      assert.ok(html.includes("support@quanterraos.com"), "Support destination email is present");
      assert.ok(html.includes("function filterHelpArticles"), "Search filter script is defined");
      assert.ok(html.includes("function submitSupportTicket"), "Ticket submit script is defined");
    });
  });
});
