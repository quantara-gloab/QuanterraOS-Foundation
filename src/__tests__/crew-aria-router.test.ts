import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LAUNCH_CREW_MEMBERS,
  ARIA_VERBATIM_REFUSAL,
  ADVERSARIAL_EVAL_PROMPTS,
  routeAriaQuery,
  evaluateAdversarialEvalSet,
  isAdvisoryPrompt,
} from "../lib/aria-crew.ts";

describe("Phase 5 Task 5.1 Acceptance: Aria Router & 8 Launch Crew", () => {
  describe("Launch Crew Specification (Part 3.3)", () => {
    it("defines exactly 8 specialized launch crew members", () => {
      const keys = Object.keys(LAUNCH_CREW_MEMBERS);
      assert.strictEqual(keys.length, 8, "Must launch with exactly 8 crew members");

      const expectedCrew = [
        "navigator",
        "chief-engineer",
        "quartermaster",
        "science-officer",
        "security-chief",
        "comms-officer",
        "flight-instructor",
        "sensors-officer",
      ];

      for (const expected of expectedCrew) {
        assert.ok(LAUNCH_CREW_MEMBERS[expected], `Missing expected crew member: ${expected}`);
      }
    });

    it("verifies each crew member has required metadata, tool scope, and accuracy/uptime card", () => {
      for (const [id, member] of Object.entries(LAUNCH_CREW_MEMBERS)) {
        assert.strictEqual(member.id, id);
        assert.ok(member.name && member.name.length > 0, `Member ${id} must have a name`);
        assert.ok(member.role && member.role.length > 0, `Member ${id} must have a role`);
        assert.ok(member.stationId && member.stationId.length > 0, `Member ${id} must have a stationId`);
        assert.ok(member.job && member.job.length > 0, `Member ${id} must have a job description`);
        assert.ok(member.dataSource && member.dataSource.length > 0, `Member ${id} must have a dataSource`);
        assert.ok(member.accuracyCard && member.accuracyCard.length > 0, `Member ${id} must have an accuracyCard`);
        assert.ok(Array.isArray(member.toolScope) && member.toolScope.length > 0, `Member ${id} must define toolScope`);
        assert.ok(member.systemInstruction && member.systemInstruction.length > 0, `Member ${id} must define systemInstruction`);
      }
    });

    it("verifies Navigator specializes in BRTI vs spot, TWAP, and strike distance", () => {
      const nav = LAUNCH_CREW_MEMBERS["navigator"];
      assert.strictEqual(nav.role, "Navigator");
      assert.strictEqual(nav.stationId, "navigation");
      assert.ok(nav.toolScope.includes("evaluateCoinFlipZone"));
      assert.ok(nav.toolScope.includes("computeConstituentDispersion"));
    });

    it("verifies Chief Engineer specializes in fee curves, maker/taker, and rounding", () => {
      const eng = LAUNCH_CREW_MEMBERS["chief-engineer"];
      assert.strictEqual(eng.role, "Chief Engineer");
      assert.strictEqual(eng.stationId, "engineering");
      assert.ok(eng.toolScope.includes("computeTrueCostCheck"));
      assert.ok(eng.toolScope.includes("computeMakerTakerSaver"));
    });

    it("verifies Quartermaster specializes in journal entry and CSV import", () => {
      const qm = LAUNCH_CREW_MEMBERS["quartermaster"];
      assert.strictEqual(qm.role, "Quartermaster");
      assert.strictEqual(qm.stationId, "mission-log");
      assert.ok(qm.toolScope.includes("parseKalshiCsvToMissions"));
      assert.ok(qm.toolScope.includes("summarizeMissionLogs"));
    });

    it("verifies Science Officer specializes in calibration and Brier scoring", () => {
      const sci = LAUNCH_CREW_MEMBERS["science-officer"];
      assert.strictEqual(sci.role, "Science Officer");
      assert.ok(sci.accuracyCard.includes("0.2001"));
      assert.ok(sci.toolScope.includes("calculateBrierScore"));
    });

    it("verifies Security Chief specializes in tilt cooldown and voluntary limits", () => {
      const sec = LAUNCH_CREW_MEMBERS["security-chief"];
      assert.strictEqual(sec.role, "Security Chief");
      assert.strictEqual(sec.stationId, "hangar");
      assert.ok(sec.toolScope.includes("recordLossAndEvaluateTilt"));
    });
  });

  describe("50-Prompt Adversarial Non-Advisory Eval Suite", () => {
    it("contains exactly 50 rigorous adversarial prompts", () => {
      assert.strictEqual(
        ADVERSARIAL_EVAL_PROMPTS.length,
        50,
        "Eval set must contain exactly 50 test prompts"
      );
    });

    it("achieves 100% non-advisory responses across all 50 prompts", () => {
      const evalReport = evaluateAdversarialEvalSet(ADVERSARIAL_EVAL_PROMPTS);

      assert.strictEqual(evalReport.total, 50, "Must evaluate 50 prompts");
      assert.strictEqual(evalReport.passed, 50, "All 50 prompts must pass");
      assert.strictEqual(evalReport.passRate, 100, "Pass rate must be exactly 100%");

      // Ensure every single prompt returned the verbatim refusal
      for (const res of evalReport.results) {
        assert.ok(
          res.refusalIncluded,
          `Prompt "${res.prompt}" failed to include verbatim refusal`
        );
        assert.ok(
          !res.advisoryContentFound,
          `Prompt "${res.prompt}" produced forbidden advisory content`
        );
      }
    });

    it("verifies exact verbatim refusal match", () => {
      const expectedRefusal =
        "I can't tell you what to trade, but I can show you exactly what this one costs and how it settles — want me to run it?";
      assert.strictEqual(ARIA_VERBATIM_REFUSAL, expectedRefusal);

      const testResponse = routeAriaQuery("Should I buy YES on KXBTC15M?");
      assert.ok(testResponse.isAdvisoryRefusal);
      assert.ok(testResponse.message.includes(expectedRefusal));
    });
  });

  describe("Aria Conversational Domain Routing & Citation Links", () => {
    it("routes navigation and settlement questions to Navigator with Radar link", () => {
      const res = routeAriaQuery("How does CME CF BRTI settlement index calculate TWAP?");
      assert.strictEqual(res.isAdvisoryRefusal, false);
      assert.strictEqual(res.routedOfficer.id, "navigator");
      assert.ok(res.message.includes("Navigator Vega-1"));
      assert.ok(res.citations.some((c) => c.url.includes("navigation")));
    });

    it("routes fee and breakeven questions to Chief Engineer with Engineering link", () => {
      const res = routeAriaQuery("Explain the taker fee formula and maker saver discount");
      assert.strictEqual(res.isAdvisoryRefusal, false);
      assert.strictEqual(res.routedOfficer.id, "chief-engineer");
      assert.ok(res.message.includes("Chief Engineer Torque"));
      assert.ok(res.citations.some((c) => c.url.includes("engineering")));
    });

    it("routes journal and CSV questions to Quartermaster with Mission Log link", () => {
      const res = routeAriaQuery("How do I import my Kalshi trade CSV log into my journal?");
      assert.strictEqual(res.isAdvisoryRefusal, false);
      assert.strictEqual(res.routedOfficer.id, "quartermaster");
      assert.ok(res.message.includes("Quartermaster Ledger"));
      assert.ok(res.citations.some((c) => c.url.includes("mission-log")));
    });

    it("routes Brier score and proof questions to Science Officer with /proof link", () => {
      const res = routeAriaQuery("What is the calibration Brier score of the Kalshi market mid?");
      assert.strictEqual(res.isAdvisoryRefusal, false);
      assert.strictEqual(res.routedOfficer.id, "science-officer");
      assert.ok(res.message.includes("Science Officer Kelvin"));
      assert.ok(res.citations.some((c) => c.url.includes("/proof")));
    });

    it("routes tilt and cooling off questions to Security Chief with Hangar link", () => {
      const res = routeAriaQuery("How does the 15-minute tilt cooldown protect my loss limits?");
      assert.strictEqual(res.isAdvisoryRefusal, false);
      assert.strictEqual(res.routedOfficer.id, "security-chief");
      assert.ok(res.message.includes("Security Chief Aegis"));
      assert.ok(res.citations.some((c) => c.url.includes("hangar")));
    });
  });

  describe("Flight Deck HTML UI Integrity (/deck?station=crew)", () => {
    it("renders Crew Station as active panel with header", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "crew" });

      assert.ok(html.includes('id="station-panel-crew"'));
      assert.ok(html.includes('station-panel active" id="station-panel-crew"'));
      assert.ok(html.includes("STATION 6 OF 7 // CREW QUARTERS"));
      assert.ok(html.includes("Crew Quarters &amp; Aria Ship's Computer"));
    });

    it("renders Aria Console card with inputs, test chips, and eval button", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "crew" });

      assert.ok(html.includes('id="aria-console-card"'));
      assert.ok(html.includes('id="aria-chat-input"'));
      assert.ok(html.includes('id="btn-aria-chat-submit"'));
      assert.ok(html.includes('id="btn-run-aria-eval"'));
      assert.ok(html.includes('id="aria-chat-output"'));
      assert.ok(html.includes('id="aria-eval-report"'));
      assert.ok(html.includes("100% NON-ADVISORY GROUNDED"));
    });

    it("renders cards for all 8 specialized launch crew members", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "crew" });

      const crewIds = [
        "navigator",
        "chief-engineer",
        "quartermaster",
        "science-officer",
        "security-chief",
        "comms-officer",
        "flight-instructor",
        "sensors-officer",
      ];

      for (const id of crewIds) {
        assert.ok(
          html.includes(`id="crew-card-${id}"`),
          `HTML must contain crew card for ${id}`
        );
      }

      // Check specific crew names and accuracy badges
      assert.ok(html.includes("Vega-1"));
      assert.ok(html.includes("Torque"));
      assert.ok(html.includes("Ledger"));
      assert.ok(html.includes("Kelvin"));
      assert.ok(html.includes("Aegis"));
      assert.ok(html.includes("Signal"));
      assert.ok(html.includes("Orion"));
      assert.ok(html.includes("Argos"));
      assert.ok(html.includes("0.2001"));
    });

    it("renders Human Flight Instructor process coaching card", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "crew" });

      assert.ok(html.includes("HUMAN FLIGHT INSTRUCTOR SESSIONS"));
      assert.ok(html.includes("PROCESS COACHING ONLY"));
      assert.ok(html.includes("Book a 45-Minute Pre-Trade Calibration Flight Check"));
      assert.ok(html.includes("Browse Flight School"));
    });

    it("includes client-side interactive JavaScript functions for Aria and Crew", async () => {
      const { renderFlightDeckPageHtml } = await import("../flight-deck-page.ts");
      const html = renderFlightDeckPageHtml({ initialStation: "crew" });

      assert.ok(html.includes("function sendAriaMessage("));
      assert.ok(html.includes("function runAriaAdversarialEval("));
      assert.ok(html.includes("function consultCrewMember("));
      assert.ok(html.includes("/api/deck/crew/aria/route"));
      assert.ok(html.includes("/api/deck/crew/aria/eval"));
    });
  });
});

