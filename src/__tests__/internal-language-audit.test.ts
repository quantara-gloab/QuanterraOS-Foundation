import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { renderLandingPage } from "../landing-page.ts";
import { renderCouncilDashboardPage } from "../dashboard-terminal.ts";
import { renderRealisticPaperPageHtml } from "../realistic-paper-mode.ts";
import {
  evaluateForecastComparison,
  getMockProspectiveStudyCohort,
  summarizeCohortEvaluation,
  renderForecastComparisonPageHtml,
} from "../forecast-comparison.ts";

describe("Phase 1 Task 1.6 Acceptance: Strip internal language from public surfaces", () => {
  it("verifies landing page contains no internal build / wedge / study jargon", () => {
    const landingHtml = renderLandingPage();

    assert.ok(!landingHtml.includes("Acquisition Wedge"), "Landing page must not contain 'Acquisition Wedge'");
    assert.ok(!landingHtml.includes("Build Order #"), "Landing page must not contain 'Build Order #'");
    assert.ok(!landingHtml.includes("90-Day Plan"), "Landing page must not contain '90-Day Plan'");
    assert.ok(!landingHtml.includes("Sovereign Agent Deployment"), "Landing page must not contain 'Sovereign Agent Deployment'");
    assert.ok(!landingHtml.includes("Study #6.4"), "Landing page must not contain 'Study #6.4'");
  });

  it("verifies dashboard terminal strips internal engineering schedule and validation language", () => {
    const dashHtml = renderCouncilDashboardPage();

    assert.ok(!dashHtml.includes("ENGINEERING MILESTONE DELIVERED · CUSTOMER VALIDATION UNDERWAY"), "Must strip internal milestone badge");
    assert.ok(!dashHtml.includes("Engineering Days Saved"), "Must strip internal 'Engineering Days Saved'");
  });

  it("verifies realistic paper mode and forecast comparison have clean public eyebrows", () => {
    const paperHtml = renderRealisticPaperPageHtml();
    assert.ok(!paperHtml.includes("90-Day Plan Build Order"), "Realistic paper mode must not contain '90-Day Plan Build Order'");

    const result = evaluateForecastComparison({ userProbability: 0.55 });
    const records = getMockProspectiveStudyCohort();
    const summary = summarizeCohortEvaluation(records);
    const forecastHtml = renderForecastComparisonPageHtml(result, summary, records);
    assert.ok(!forecastHtml.includes("90-Day Execution Roadmap &bull; Build Order"), "Forecast comparison must not contain '90-Day Execution Roadmap &bull; Build Order'");
  });

  it("verifies plain-English compliance footer is present on landing page", () => {
    const landingHtml = renderLandingPage();
    assert.ok(
      landingHtml.includes("QuanterraOS is an independent analytics tool by Quantara Global LLC"),
      "Must include plain-English ownership declaration"
    );
    assert.ok(
      landingHtml.includes("We don't place trades, hold funds, or give investment advice"),
      "Must include clear negative covenant declaration"
    );
    assert.ok(
      landingHtml.includes("Prediction-market trading can lose money. 18+"),
      "Must include 18+ and risk warning"
    );
  });
});
