import test from "node:test";
import assert from "node:assert/strict";
import { getFounderPhase9Kpis, renderAdminMetricsPage } from "../metrics.ts";

test("Phase 9: getFounderPhase9Kpis returns all 12 operational dimensions and North-Star metric", () => {
  const kpis = getFounderPhase9Kpis();

  // 1. Top of Funnel & Conversion Funnel
  assert.ok(typeof kpis.freeChecksPerDay === "number" && kpis.freeChecksPerDay > 0, "freeChecksPerDay must be positive");
  assert.ok(typeof kpis.checkToSignupPct === "number" && kpis.checkToSignupPct >= 0, "checkToSignupPct must be non-negative");
  assert.ok(typeof kpis.signupToTrialPct === "number" && kpis.signupToTrialPct >= 0, "signupToTrialPct must be non-negative");
  assert.ok(typeof kpis.trialToPaidPct === "number" && kpis.trialToPaidPct >= 0, "trialToPaidPct must be non-negative");
  assert.ok(typeof kpis.churnPct === "number" && kpis.churnPct >= 0, "churnPct must be non-negative");

  // 2. North-Star Metric: Avoidable Cost Saved per User/Month
  assert.ok(typeof kpis.avoidableCostSavedPerUserMonth === "number" && kpis.avoidableCostSavedPerUserMonth > 0, "avoidableCostSavedPerUserMonth North-Star must be positive");
  assert.equal(kpis.avoidableCostSavedPerUserMonth, 142.50, "North-Star metric matches modeled baseline savings");

  // 3. Discipline & Calibration
  assert.ok(typeof kpis.pctTradesWithPreFlightCheck === "number" && kpis.pctTradesWithPreFlightCheck > 0, "pctTradesWithPreFlightCheck must be positive");
  assert.ok(typeof kpis.medianCalibrationImprovementPct === "number" && kpis.medianCalibrationImprovementPct > 0, "medianCalibrationImprovementPct must be positive");
  assert.ok(typeof kpis.tiltCooldownsRespected === "number" && kpis.tiltCooldownsRespected >= 0, "tiltCooldownsRespected must be non-negative");

  // 4. Commercial & Infrastructure Health
  assert.ok(typeof kpis.apiMrrDollars === "number" && kpis.apiMrrDollars > 0, "apiMrrDollars must be positive");
  assert.ok(typeof kpis.feedLatencyMs === "number" && kpis.feedLatencyMs > 0, "feedLatencyMs must be positive");
  assert.ok(typeof kpis.settlementCompletenessPct === "number" && kpis.settlementCompletenessPct >= 0 && kpis.settlementCompletenessPct <= 100, "settlementCompletenessPct must be percentage");

  // 5. ISO Timestamp
  assert.ok(!isNaN(Date.parse(kpis.generatedAt)), "generatedAt must be a valid ISO date string");
});

test("Phase 9: renderAdminMetricsPage includes Founder Command Strip and North-Star card when authenticated", () => {
  const html = renderAdminMetricsPage({ authenticated: true });

  assert.ok(html.includes("Founder Command Strip — Phase 9 North-Star &amp; KPI Board") || html.includes("Founder Command Strip — Phase 9 North-Star & KPI Board"), "Must contain Phase 9 command strip title");
  assert.ok(html.includes("Avoidable Cost Saved per User / Month"), "Must contain North-Star metric title");
  assert.ok(html.includes("Primary North-Star Metric"), "Must highlight North-Star metric");
  assert.ok(html.includes("Free Checks / Day"), "Must contain Free Checks / Day");
  assert.ok(html.includes("Check → Signup"), "Must contain Check to Signup");
  assert.ok(html.includes("Signup → Trial"), "Must contain Signup to Trial");
  assert.ok(html.includes("Trial → Paid"), "Must contain Trial to Paid");
  assert.ok(html.includes("Monthly Churn"), "Must contain Monthly Churn");
  assert.ok(html.includes("% Trades Pre-Flight Checked"), "Must contain Pre-Flight Check rate");
  assert.ok(html.includes("Median Calibration Imprv."), "Must contain Calibration Improvement");
  assert.ok(html.includes("Tilt Cooldowns Respected"), "Must contain Tilt Cooldowns");
  assert.ok(html.includes("API MRR"), "Must contain API MRR");
  assert.ok(html.includes("Feed Latency"), "Must contain Feed Latency");
  assert.ok(html.includes("Settlement Completeness"), "Must contain Settlement Completeness");

  // Non-advisory & $0 live exposure notices
  assert.ok(html.includes("$0.00 Live Exposure (Rule B5)"), "Must display Rule B5 guardrail");
  assert.ok(html.includes("Non-Advisory (Rule B4)"), "Must display Rule B4 guardrail");
});

test("Phase 9: renderAdminMetricsPage gates unauthenticated access", () => {
  const html = renderAdminMetricsPage({ authenticated: false, error: "Access Denied" });

  assert.ok(html.includes("ADMIN ACCESS KEY"), "Must display authentication key input");
  assert.ok(html.includes("Access Denied"), "Must display authentication error");
  assert.ok(!html.includes("Founder Command Strip"), "Must NOT reveal Founder Command Strip to unauthenticated users");
  assert.ok(!html.includes("Avoidable Cost Saved"), "Must NOT reveal North-Star metric to unauthenticated users");
});

test("Phase 9 Compliance: Rule B5 zero live capital exposure and non-advisory verification", async () => {
  const fs = await import("node:fs/promises");
  const metricsSource = await fs.readFile(new URL("../metrics.ts", import.meta.url), "utf-8");

  // Rule B5: Zero order routing / live broker placement anywhere in metrics code path
  assert.ok(!metricsSource.includes("placeOrder"), "metrics.ts must not contain placeOrder");
  assert.ok(!metricsSource.includes("executeTrade"), "metrics.ts must not contain executeTrade");
  assert.ok(!metricsSource.includes("submitOrder"), "metrics.ts must not contain submitOrder");

  // Rule B4: Zero superlatives / non-advisory compliance
  assert.ok(!metricsSource.toLowerCase().includes("guaranteed profit"), "Must not claim guaranteed profit");
  assert.ok(!metricsSource.toLowerCase().includes("guaranteed edge"), "Must not claim guaranteed edge");
});

