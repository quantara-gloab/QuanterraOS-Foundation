/**
 * The actual running server. This is what turns everything else in
 * this repo from "code that type-checks" into "a program you can
 * send a real HTTP request to and get a real answer back."
 *
 * Run it with: npm run dev
 * Test it with the curl commands in README.md's "Testing the server" section.
 */
import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import { eq, and, gte, asc } from "drizzle-orm";
import { db, runMigrations } from "./db.ts";
import { getChatGPTUser } from "./auth.ts";
import { researchObservations, researchResolutions, researchResolutionHistory, edgeScores, falconRecommendations, btcIndexTicks } from "./schema.ts";
import { buildPrediction, type LiveMarket } from "./btc15m-predictor.ts";
import { handleResolve, handleEdgeScore, handleObserve } from "./routes/workspace.ts";
import { handleFalconRecommend, handleFalconJevRecommend, handleFalconDecision, type FalconRecommendationRow } from "./routes/falcon.ts";

import { latestOrderbookEvidence, computeFalconTrackRecord } from "./agents/falcon.ts";
import { computeMarketPriceCalibration, type MarketPriceCalibrationReport } from "./market-price-calibration.ts";
import { currentPlan, hasFeature } from "./plan.ts";
import { computeCalibrationCurve, computeStreak, scoreObservation, summarizePerformance } from "./scoring.ts";
import type { ObservationRow, ResolutionRow } from "./scoring.ts";

runMigrations();

const app = express();
app.use(express.json());

app.post("/api/workspace/resolve", async (req, res) => {
  const user = getChatGPTUser(req);

  const result = await handleResolve(
    { ...req.body, owner: user.ownerId },
    {
      getExistingResolution: async (owner, contract): Promise<ResolutionRow | null> => {
        const row = db
          .select()
          .from(researchResolutions)
          .where(and(eq(researchResolutions.owner, owner), eq(researchResolutions.contract, contract)))
          .get();
        if (!row) return null;
        return {
          owner: row.owner,
          contract: row.contract,
          outcome: row.outcome as ResolutionRow["outcome"],
          officialSource: row.officialSource,
          resolvedAt: row.resolvedAt,
          correctionOf: row.correctionOf,
          finalized: row.finalized === 1,
        };
      },
      saveResolution: async (row) => {
        db.transaction((tx) => {
          tx.insert(researchResolutions)
            .values({
              owner: row.owner,
              contract: row.contract,
              outcome: row.outcome,
              officialSource: row.officialSource,
              resolvedAt: row.resolvedAt,
              correctionOf: row.correctionOf ?? null,
              correctionReason: row.correctionReason ?? null,
              finalized: row.finalized ? 1 : 0,
            })
            .onConflictDoUpdate({
              target: [researchResolutions.owner, researchResolutions.contract],
              set: {
                outcome: row.outcome,
                officialSource: row.officialSource,
                resolvedAt: row.resolvedAt,
                correctionOf: row.correctionOf ?? null,
                correctionReason: row.correctionReason ?? null,
                finalized: row.finalized ? 1 : 0,
              },
            })
            .run();

          tx.insert(researchResolutionHistory)
            .values({
              id: randomUUID(),
              owner: row.owner,
              contract: row.contract,
              outcome: row.outcome,
              officialSource: row.officialSource,
              resolvedAt: row.resolvedAt,
              reason: row.correctionReason ?? null,
              finalized: row.finalized ? 1 : 0,
            })
            .run();
        });
      },
    }
  );

  res.status(result.status).json(result.body);
});

app.get("/api/workspace/calibration", (req, res) => {
  const user = getChatGPTUser(req);
  const rows = db
    .select()
    .from(researchObservations)
    .where(eq(researchObservations.owner, user.ownerId))
    .all();
  const resolutions = db
    .select()
    .from(researchResolutions)
    .where(eq(researchResolutions.owner, user.ownerId))
    .all();
  const byContract = new Map(resolutions.map((row) => [row.contract, row]));
  const scored = rows.flatMap((row) => {
    const resolution = byContract.get(row.contract);
    if (!resolution) return [];
    const observation: ObservationRow = {
      ...row,
      probability: row.probability ?? null,
    };
    const normalizedResolution: ResolutionRow = {
      owner: resolution.owner,
      contract: resolution.contract,
      outcome: resolution.outcome as ResolutionRow["outcome"],
      officialSource: resolution.officialSource,
      resolvedAt: resolution.resolvedAt,
      correctionOf: resolution.correctionOf,
      finalized: resolution.finalized === 1,
    };
    return [scoreObservation(observation, normalizedResolution)];
  });

  res.json({
    summary: summarizePerformance(scored),
    calibration: computeCalibrationCurve(scored),
    streak: computeStreak(rows.map((row) => row.created)),
  });
});

app.post("/api/workspace/edge-score", async (req, res) => {
  const user = getChatGPTUser(req);

  const result = await handleEdgeScore(
    { ...req.body, owner: user.ownerId },
    {
      saveEdgeScore: async (row) => {
        db.insert(edgeScores)
          .values({
            id: randomUUID(),
            owner: row.owner,
            contract: row.contract,
            bucket: row.bucket,
            fairProbability: row.fairProbability,
            breakevenProbability: row.breakevenProbability,
            edge: row.edge,
            flagged: row.flagged ? 1 : 0,
            marketAsk: row.marketAsk,
            feeEstimate: row.feeEstimate,
            computedAt: row.computedAt,
          })
          .run();
      },
    }
  );

  res.status(result.status).json(result.body);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

function toFalconRow(row: typeof falconRecommendations.$inferSelect): FalconRecommendationRow {
  return {
    id: row.id,
    owner: row.owner,
    contract: row.contract,
    suggestedProbability: row.suggestedProbability,
    rationale: row.rationale,
    evidenceJson: row.evidenceJson,
    status: row.status as FalconRecommendationRow["status"],
    finalProbability: row.finalProbability,
    observationId: row.observationId,
    createdAt: row.createdAt,
    decidedAt: row.decidedAt,
  };
}

app.post("/api/workspace/observe", async (req, res) => {
  const user = getChatGPTUser(req);
  const result = await handleObserve(
    { ...req.body, owner: user.ownerId },
    {
      generateId: () => randomUUID(),
      saveObservation: async (row) => {
        db.insert(researchObservations).values(row).run();
      },
    }
  );
  res.status(result.status).json(result.body);
});

// Falcon (Opportunity Intel): proposes a probability from real collected
// order-book evidence. It never resolves/settles contracts and never
// records a forecast on its own — only handleFalconDecision does, and
// only by reusing the same handleObserve() a manual forecast uses.
app.post("/api/agents/falcon/recommend", async (req, res) => {
  const user = getChatGPTUser(req);
  const contract = req.body.contract as string;
  const evidence = latestOrderbookEvidence(contract);
  try {
    const result = await handleFalconRecommend(
      { owner: user.ownerId, contract, evidence },
      {
        generateId: () => randomUUID(),
        saveRecommendation: async (row) => {
          db.insert(falconRecommendations).values(row).run();
        },
      }
    );
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(422).json({ error: "no_evidence", message: (error as Error).message });
  }
});

app.post(["/api/agents/falcon/recommend-jev", "/api/falcon/recommend-jev"], async (req, res) => {
  const user = getChatGPTUser(req);
  const contract = req.body.contract as string;
  const evidence = latestOrderbookEvidence(contract);
  try {
    const result = await handleFalconJevRecommend(
      {
        owner: user.ownerId,
        contract,
        strike: req.body.strike ? Number(req.body.strike) : undefined,
        barrierType: req.body.barrierType,
        remainingSeconds: req.body.remainingSeconds ? Number(req.body.remainingSeconds) : undefined,
        pricesOrTicks: req.body.pricesOrTicks,
        evidence,
      },
      {
        generateId: () => randomUUID(),
        saveRecommendation: async (row) => {
          db.insert(falconRecommendations).values(row).run();
        },
      }
    );
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(422).json({ error: "error", message: (error as Error).message });
  }
});


app.post("/api/agents/falcon/:id/decision", async (req, res) => {
  const user = getChatGPTUser(req);
  const result = await handleFalconDecision(
    { ...req.body, owner: user.ownerId, recommendationId: req.params.id },
    {
      getRecommendation: async (id) => {
        const row = db.select().from(falconRecommendations).where(eq(falconRecommendations.id, id)).get();
        return row ? toFalconRow(row) : null;
      },
      updateRecommendation: async (row) => {
        db.update(falconRecommendations)
          .set({
            status: row.status,
            finalProbability: row.finalProbability,
            observationId: row.observationId,
            decidedAt: row.decidedAt,
          })
          .where(eq(falconRecommendations.id, row.id))
          .run();
      },
      observeDeps: {
        generateId: () => randomUUID(),
        saveObservation: async (row) => {
          db.insert(researchObservations).values(row).run();
        },
      },
    }
  );
  res.status(result.status).json(result.body);
});

// Falcon's own accuracy, visible next to human calibration: proposed vs.
// accepted/edited/rejected counts, and a Brier score computed only over
// recommendations a human actually acted on (never over rejected ones).
app.get("/api/agents/falcon/track-record", (req, res) => {
  const user = getChatGPTUser(req);
  const recommendationRows = db
    .select()
    .from(falconRecommendations)
    .where(eq(falconRecommendations.owner, user.ownerId))
    .all();
  const resolutionRows = db
    .select()
    .from(researchResolutions)
    .where(eq(researchResolutions.owner, user.ownerId))
    .all();
  const resolutionsByContract = new Map(
    resolutionRows.map((row) => [
      row.contract,
      {
        owner: row.owner,
        contract: row.contract,
        outcome: row.outcome as ResolutionRow["outcome"],
        officialSource: row.officialSource,
        resolvedAt: row.resolvedAt,
        correctionOf: row.correctionOf,
        finalized: row.finalized === 1,
      } satisfies ResolutionRow,
    ])
  );
  const trackRecord = computeFalconTrackRecord(
    recommendationRows.map((row) => ({
      status: row.status as FalconRecommendationRow["status"],
      contract: row.contract,
      owner: row.owner,
      suggestedProbability: row.suggestedProbability,
      rationale: row.rationale,
      createdAt: row.createdAt,
    })),
    resolutionsByContract
  );
  res.json(trackRecord);
});

const workspacePage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS Research Workspace</title>
<style>
  :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: #10151b; color: #e8edf2; }
  main { width: min(760px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 56px; }
  h1 { font-size: 1.5rem; margin-bottom: 4px; }
  h2 { font-size: 1rem; color: #c9d3dc; margin: 28px 0 10px; }
  .panel { border: 1px solid #2b3641; background: #171e26; border-radius: 6px; padding: 18px; margin-bottom: 16px; }
  label { display: block; font-size: .78rem; color: #91a1af; margin-bottom: 4px; }
  input { width: 100%; background: #10151b; color: #e8edf2; border: 1px solid #2b3641; border-radius: 4px; padding: 8px 10px; font: inherit; margin-bottom: 10px; }
  button { background: #2b3641; color: #e8edf2; border: 1px solid #3a4753; border-radius: 4px; padding: 8px 14px; font: inherit; cursor: pointer; margin-right: 8px; }
  button:hover { background: #3a4753; }
  button.accept { border-color: #2f9e5b; }
  button.reject { border-color: #b23b3b; }
  .ai-tag { display: inline-block; background: #3a2e57; color: #d9c8ff; font-size: .68rem; letter-spacing: .04em; padding: 2px 8px; border-radius: 999px; margin-left: 8px; vertical-align: middle; }
  .evidence-table { width: 100%; border-collapse: collapse; font-size: .78rem; margin-top: 10px; }
  .evidence-table th, .evidence-table td { border-bottom: 1px solid #2b3641; padding: 6px 8px; text-align: left; }
  .status { font-size: .78rem; color: #91a1af; margin-top: 10px; }
  .stat-row { display: flex; gap: 18px; flex-wrap: wrap; }
  .stat { min-width: 110px; }
  .stat .value { font-size: 1.3rem; font-weight: 700; }
  .stat .label { font-size: .72rem; color: #91a1af; }
</style>
</head>
<body>
<main>
  <h1>Research Workspace</h1>
  <div class="panel">
    <h2 style="margin-top:0">Get a Falcon suggestion<span class="ai-tag">AI proposed</span></h2>
    <label for="contract">Contract ticker</label>
    <input id="contract" placeholder="KXBTC15M-...">
    <button id="ask-falcon">Ask Falcon</button>
    <div id="falcon-card"></div>
  </div>
  <div class="panel">
    <h2 style="margin-top:0">Falcon track record</h2>
    <div id="track-record" class="stat-row"></div>
  </div>
</main>
<script>
async function askFalcon() {
  const contract = document.getElementById("contract").value.trim();
  const card = document.getElementById("falcon-card");
  card.innerHTML = "";
  if (!contract) return;
  const response = await fetch("/api/agents/falcon/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contract }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    card.innerHTML = "<p class=\\"status\\">No Falcon suggestion: " + (body.message || response.statusText) + "</p>";
    return;
  }
  const recommendation = await response.json();
  renderCard(recommendation);
}

function renderCard(recommendation) {
  const card = document.getElementById("falcon-card");
  const evidence = JSON.parse(recommendation.evidenceJson);
  const rows = evidence.map(function (row) {
    return "<tr><td>" + row.marketTicker + "</td><td>" + new Date(row.capturedAt).toISOString() + "</td><td>" +
      (row.topImbalance ?? "") + "</td><td>" + (row.depthImbalance ?? "") + "</td></tr>";
  }).join("");
  card.innerHTML =
    "<p><strong>Falcon suggests " + (recommendation.suggestedProbability * 100).toFixed(1) + "%</strong><span class=\\"ai-tag\\">AI proposed, not yet recorded</span></p>" +
    "<p class=\\"status\\">" + recommendation.rationale + "</p>" +
    "<table class=\\"evidence-table\\"><thead><tr><th>Market</th><th>Captured at</th><th>Top imbalance</th><th>Depth imbalance</th></tr></thead><tbody>" + rows + "</tbody></table>" +
    "<div style=\\"margin-top:12px\\">" +
    "<button class=\\"accept\\" id=\\"accept-btn\\">Accept</button>" +
    "<input id=\\"edit-value\\" placeholder=\\"edit probability (0-1)\\" style=\\"width:180px;display:inline-block;margin:0 8px\\">" +
    "<button id=\\"edit-btn\\">Edit &amp; record</button>" +
    "<button class=\\"reject\\" id=\\"reject-btn\\">Reject</button>" +
    "</div><div id=\\"decision-status\\" class=\\"status\\"></div>";

  document.getElementById("accept-btn").addEventListener("click", function () { decide(recommendation.id, "accept"); });
  document.getElementById("reject-btn").addEventListener("click", function () { decide(recommendation.id, "reject"); });
  document.getElementById("edit-btn").addEventListener("click", function () {
    const value = Number(document.getElementById("edit-value").value);
    decide(recommendation.id, "edit", value);
  });
}

async function decide(id, action, probability) {
  const body = { action };
  if (action === "edit") body.probability = probability;
  const response = await fetch("/api/agents/falcon/" + id + "/decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  const statusEl = document.getElementById("decision-status");
  if (!response.ok) {
    statusEl.textContent = "Error: " + (result.error || response.statusText);
    return;
  }
  if (action === "reject") {
    statusEl.textContent = "Rejected. Not recorded as a forecast, never sent to resolution.";
  } else {
    statusEl.textContent = (action === "edit" ? "Edited and recorded" : "Accepted and recorded") + " as a real forecast (observation id " + result.observation.id + ").";
  }
  loadTrackRecord();
}

async function loadTrackRecord() {
  const response = await fetch("/api/agents/falcon/track-record");
  const record = await response.json();
  const el = document.getElementById("track-record");
  function stat(label, value) {
    return "<div class=\\"stat\\"><div class=\\"value\\">" + value + "</div><div class=\\"label\\">" + label + "</div></div>";
  }
  el.innerHTML =
    stat("Proposed", record.proposed) +
    stat("Accepted", record.accepted) +
    stat("Edited", record.edited) +
    stat("Rejected", record.rejected) +
    stat("Falcon Brier (accepted/edited only)", record.averageBrierScore === null ? "n/a (" + record.scored + " scored)" : record.averageBrierScore.toFixed(4) + " (" + record.scored + " scored)");
}

document.getElementById("ask-falcon").addEventListener("click", askFalcon);
loadTrackRecord();
</script>
</body>
</html>`;

app.get("/workspace", (_req, res) => {
  res.type("html").send(workspacePage);
});

// The public-facing result: the market's own entry price, verified
// well-calibrated against real settlement. This is deliberately a separate
// surface from Falcon's track record: it makes a different, currently-supported
// claim ("the price is verifiably reliable"), not "we predict better than the
// market" (unsupported). Free tier: recomputed at most once a day. Pro:
// recomputed on every request, plus the full per-bin table.
const dailyCacheMs = 24 * 60 * 60 * 1000;
let dailyCalibration: { report: MarketPriceCalibrationReport; computedAt: number } | null = null;

function clerkBrowserScripts() {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
  const encodedDomain = publishableKey?.split("_")[2];
  if (!publishableKey || !encodedDomain) return "";
  const frontendDomain = Buffer.from(encodedDomain, "base64").toString("utf8").replace(/\$$/, "");
  if (!/^[a-z0-9.-]+$/i.test(frontendDomain)) return "";
  return `<script defer crossorigin="anonymous" src="https://${frontendDomain}/npm/@clerk/ui@1/dist/ui.browser.js"></script>
<script defer crossorigin="anonymous" data-clerk-publishable-key="${publishableKey}" src="https://${frontendDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"></script>`;
}

const clerkScripts = clerkBrowserScripts();
const clerkConfigured = Boolean(clerkScripts);

async function calibrationReport(realtime: boolean) {
  if (realtime) return { report: await computeMarketPriceCalibration(), computedAt: Date.now() };
  if (!dailyCalibration || Date.now() - dailyCalibration.computedAt >= dailyCacheMs) {
    dailyCalibration = { report: await computeMarketPriceCalibration(), computedAt: Date.now() };
  }
  return dailyCalibration;
}

app.get("/api/calibration/market-price", async (req, res) => {
  try {
    const plan = await currentPlan(req);
    const realtime = hasFeature(plan, "calibration:realtime");
    const { report, computedAt } = await calibrationReport(realtime);
    const calibration = hasFeature(plan, "calibration:bin-table")
      ? report.calibration
      : report.calibration.map(({ label, rangeStart, rangeEnd, actualYesRate, count }) => ({
        label, rangeStart, rangeEnd, actualYesRate, lowSample: count > 0 && count < 20,
      }));
    res.json({ ...report, calibration, plan, realtime, computedAt: new Date(computedAt).toISOString() });
  } catch (error) {
    res.status(500).json({ error: "calibration_unavailable", message: (error as Error).message });
  }
});

const marketPriceCalibrationPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Verified Calibration</title>
${clerkScripts}
<style>
  :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: #10151b; color: #e8edf2; }
  main { width: min(820px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 56px; }
  h1 { font-size: 1.5rem; margin-bottom: 4px; }
  .claim { font-size: 1rem; color: #d6e7ff; margin: 10px 0 4px; }
  .not-claim { font-size: .82rem; color: #91a1af; margin-bottom: 20px; }
  .panel { border: 1px solid #2b3641; background: #171e26; border-radius: 6px; padding: 18px; margin-bottom: 16px; }
  .stat-row { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 6px; }
  .stat .value { font-size: 1.6rem; font-weight: 700; }
  .stat .label { font-size: .72rem; color: #91a1af; }
  table { width: 100%; border-collapse: collapse; font-size: .82rem; }
  th, td { border-bottom: 1px solid #2b3641; padding: 8px 10px; text-align: left; }
  .low-confidence { color: #91a1af; }
  .low-confidence .n-tag { background: #3a2e2e; color: #f0b3b3; padding: 1px 6px; border-radius: 999px; font-size: .68rem; margin-left: 6px; }
  .n-tag-ok { background: #1e3a2e; color: #9ee0b8; padding: 1px 6px; border-radius: 999px; font-size: .68rem; margin-left: 6px; }
  canvas { display: block; width: 100%; height: 320px; background: #131a21; border: 1px solid #2b3641; border-radius: 4px; }
  .caption { font-size: .72rem; color: #71808e; margin-top: 10px; }
  .site-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .site-nav a, .auth-link { color: #9ee0b8; text-decoration: none; }
  .auth-links { display: flex; gap: 16px; align-items: center; font-size: .85rem; }
  #clerk-user-button { min-height: 40px; }
</style>
</head>
<body>
<main>
  <nav class="site-nav"><a href="/calibration/market-price">QuanterraOS</a><div class="auth-links"><a class="auth-link" href="/subscribe">Plans</a><span id="clerk-controls">${clerkConfigured ? "Loading account…" : "Sign-in setup pending"}</span></div></nav>
  <h1>Verified Calibration</h1>
  <p class="claim" id="claim">Loading…</p>
  <p class="not-claim" id="not-claim"></p>
  <div class="panel">
    <div class="stat-row">
      <div class="stat"><div class="value" id="brier">—</div><div class="label">Average Brier score</div></div>
      <div class="stat"><div class="value" id="sample-size">—</div><div class="label">Settled contracts scored</div></div>
    </div>
  </div>
  <div class="panel">
    <h2 style="margin-top:0;font-size:1rem;color:#c9d3dc">Calibration curve (predicted vs. actual, per bin)</h2>
    <canvas id="chart" width="760" height="320"></canvas>
    <p class="caption" id="caption"></p>
  </div>
  <div class="panel">
    <p class="caption" id="freshness"></p>
    <table id="calibration-table">
      <thead><tr><th>Predicted range</th><th>Sample size</th><th>Actual YES rate</th></tr></thead>
      <tbody id="calibration-rows"></tbody>
    </table>
  </div>
</main>
<script>
const clerkConfigured = ${clerkConfigured};
window.addEventListener("load", async function () {
  const controls = document.getElementById("clerk-controls");
  if (!clerkConfigured) return;
  try {
    await Clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor },
      allowedRedirectOrigins: [window.location.origin],
    });
    if (Clerk.isSignedIn) {
      controls.innerHTML = '<div id="clerk-user-button"></div>';
      Clerk.mountUserButton(document.getElementById("clerk-user-button"));
    } else {
      controls.innerHTML = '<a class="auth-link" href="/account?flow=sign-in">Sign in</a><a class="auth-link" href="/account?flow=sign-up">Create account</a>';
    }
  } catch (error) {
    controls.textContent = "Sign-in unavailable";
    console.error("Clerk frontend failed to load", error);
  }
});
</script>
<script>
const lowConfidenceThreshold = 20;

function drawChart(bins) {
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width, height = canvas.height, pad = 40;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#2b3641";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  function toX(p) { return pad + p * (width - pad * 2); }
  function toY(p) { return height - pad - p * (height - pad * 2); }

  // Perfect-calibration diagonal reference line.
  ctx.strokeStyle = "#3a4753";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(0));
  ctx.lineTo(toX(1), toY(1));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#91a1af";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("predicted \\u2192", width - pad - 70, height - pad + 20);
  ctx.save();
  ctx.translate(pad - 24, pad + 10);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("actual \\u2192", 0, 0);
  ctx.restore();

  const maxCount = Math.max(1, ...bins.map(function (b) { return b.count || 0; }));
  for (const bin of bins) {
    if (bin.actualYesRate === null) continue;
    const predicted = (bin.rangeStart + bin.rangeEnd) / 2;
    const lowConfidence = "count" in bin ? bin.count < lowConfidenceThreshold : bin.lowSample;
    const radius = "count" in bin ? 4 + (bin.count / maxCount) * 10 : 8;
    ctx.beginPath();
    ctx.fillStyle = lowConfidence ? "rgba(240,179,179,0.55)" : "rgba(158,224,184,0.85)";
    ctx.arc(toX(predicted), toY(bin.actualYesRate), radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function load() {
  const response = await fetch("/api/calibration/market-price");
  const report = await response.json();
  if (!response.ok) {
    document.getElementById("claim").textContent = "Calibration unavailable: " + (report.message || response.statusText);
    return;
  }
  document.getElementById("claim").textContent = report.claim;
  document.getElementById("not-claim").textContent = report.notTheClaim;
  document.getElementById("brier").textContent = report.averageBrierScore === null ? "n/a" : report.averageBrierScore.toFixed(4);
  document.getElementById("sample-size").textContent = report.sampleSize;

  const fullTable = report.calibration.every(function (bin) { return "count" in bin; });
  const thinBins = report.calibration.filter(function (bin) { return fullTable ? bin.count > 0 && bin.count < lowConfidenceThreshold : bin.lowSample; });
  document.getElementById("caption").textContent = thinBins.length
    ? "Green points are well-populated bins; red points (" + thinBins.map(function (b) { return fullTable ? b.label + ", n=" + b.count : b.label; }).join("; ") + ") are thin-sample and lower-confidence, not equally reliable."
    : "All bins shown have at least " + lowConfidenceThreshold + " settled contracts.";
  document.getElementById("freshness").textContent = (report.realtime ? "Live: recomputed on this request at " : "Updated daily; last computed ") + report.computedAt + ".";

  drawChart(report.calibration);
  if (!fullTable) {
    document.getElementById("calibration-table").outerHTML = "<p class=\\"caption\\">The full per-bin table with sample sizes, plus live recomputation, is part of the Pro plan.</p>";
    return;
  }

  const rows = report.calibration.map(function (bin) {
    const lowConfidence = bin.count < lowConfidenceThreshold;
    const tag = lowConfidence
      ? "<span class=\\"n-tag\\">low sample</span>"
      : "<span class=\\"n-tag-ok\\">n=" + bin.count + "</span>";
    const rowClass = lowConfidence ? " class=\\"low-confidence\\"" : "";
    return "<tr" + rowClass + "><td>" + bin.label + "</td><td>" + bin.count + tag + "</td><td>" +
      (bin.actualYesRate === null ? "—" : (bin.actualYesRate * 100).toFixed(1) + "%") + "</td></tr>";
  }).join("");
  document.getElementById("calibration-rows").innerHTML = rows;
}
load();
</script>
</body>
</html>`;

const clerkAccountPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Account</title>
${clerkScripts}
<style>
  :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: #10151b; color: #e8edf2; }
  main { width: min(520px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 56px; }
  h1 { font-size: 1.4rem; }
  .panel { border: 1px solid #2b3641; background: #171e26; border-radius: 6px; padding: 18px; }
  .tabs { display: flex; gap: 12px; border-bottom: 1px solid #2b3641; margin-bottom: 18px; }
  button { border: 0; border-bottom: 2px solid transparent; padding: 10px 4px; color: #aebbc7; background: transparent; font: inherit; cursor: pointer; }
  button[aria-selected="true"] { color: #9ee0b8; border-color: #9ee0b8; }
  .muted { color: #91a1af; font-size: .82rem; }
  a { color: #9ee0b8; }
  #user-button { min-height: 44px; }
</style>
</head>
<body>
<main>
  <p><a href="/calibration/market-price">Verified Calibration</a> · <a href="/subscribe">Plans</a></p>
  <h1>Account</h1>
  <section class="panel">
    <p class="muted" id="account-status">${clerkConfigured ? "Loading Clerk…" : "Clerk setup is pending. Add CLERK_PUBLISHABLE_KEY to the server environment."}</p>
    <div id="account-auth" hidden>
      <div class="tabs" role="tablist">
        <button type="button" id="sign-in-tab" role="tab">Sign in</button>
        <button type="button" id="sign-up-tab" role="tab">Create account</button>
      </div>
      <div id="sign-in-mount"></div>
      <div id="sign-up-mount" hidden></div>
    </div>
    <div id="account-user" hidden><div id="user-button"></div></div>
  </section>
</main>
<script>
const clerkConfigured = ${clerkConfigured};
window.addEventListener("load", async function () {
  if (!clerkConfigured) return;
  const status = document.getElementById("account-status");
  try {
    await Clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor },
      allowedRedirectOrigins: [window.location.origin],
    });
    if (Clerk.isSignedIn) {
      status.textContent = "Signed in";
      document.getElementById("account-user").hidden = false;
      Clerk.mountUserButton(document.getElementById("user-button"));
      return;
    }
    status.textContent = "Sign in or create your account.";
    const auth = document.getElementById("account-auth");
    auth.hidden = false;
    const signIn = document.getElementById("sign-in-mount");
    const signUp = document.getElementById("sign-up-mount");
    const signInTab = document.getElementById("sign-in-tab");
    const signUpTab = document.getElementById("sign-up-tab");
    const postAuthUrl = window.location.origin + "/calibration/market-price";
    let mountedFlow = null;
    function select(flow) {
      const showSignUp = flow === "sign-up";
      if (mountedFlow === flow) return;
      if (mountedFlow === "sign-in") Clerk.unmountSignIn(signIn);
      if (mountedFlow === "sign-up") Clerk.unmountSignUp(signUp);
      signIn.hidden = showSignUp;
      signUp.hidden = !showSignUp;
      if (showSignUp) {
        Clerk.mountSignUp(signUp, {
          forceRedirectUrl: postAuthUrl,
          fallbackRedirectUrl: postAuthUrl,
          signInForceRedirectUrl: postAuthUrl,
          signInFallbackRedirectUrl: postAuthUrl,
        });
      } else {
        Clerk.mountSignIn(signIn, {
          forceRedirectUrl: postAuthUrl,
          fallbackRedirectUrl: postAuthUrl,
          signUpForceRedirectUrl: postAuthUrl,
          signUpFallbackRedirectUrl: postAuthUrl,
        });
      }
      mountedFlow = flow;
      signInTab.setAttribute("aria-selected", String(!showSignUp));
      signUpTab.setAttribute("aria-selected", String(showSignUp));
    }
    signInTab.addEventListener("click", function () { select("sign-in"); });
    signUpTab.addEventListener("click", function () { select("sign-up"); });
    select(new URLSearchParams(location.search).get("flow") === "sign-up" ? "sign-up" : "sign-in");
  } catch (error) {
    status.textContent = "Clerk could not be loaded. Check the publishable key and frontend domain.";
    console.error("Clerk account page failed to load", error);
  }
});
</script>
</body>
</html>`;

const clerkSubscribePage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Plans</title>
${clerkScripts}
<style>
  :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: #10151b; color: #e8edf2; }
  main { width: min(960px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 56px; }
  h1 { font-size: 1.4rem; }
  .muted { color: #91a1af; font-size: .85rem; }
  a { color: #9ee0b8; }
  #pricing-table { margin-top: 24px; }
</style>
</head>
<body>
<main>
  <p><a href="/calibration/market-price">Verified Calibration</a> · <a href="/account">Account</a></p>
  <h1>QuanterraOS Pro</h1>
  <p class="muted">Choose a plan to continue. Plan details and pricing are managed in Clerk Billing.</p>
  <p class="muted" id="subscribe-status">${clerkConfigured ? "Loading…" : "Billing setup is pending. Configure Clerk keys to continue."}</p>
  <div id="pricing-table"></div>
</main>
<script>
const clerkConfigured = ${clerkConfigured};
window.addEventListener("load", async function () {
  if (!clerkConfigured) return;
  const status = document.getElementById("subscribe-status");
  try {
    await Clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
    if (!Clerk.isSignedIn) {
      status.innerHTML = 'Sign in or create an account before subscribing: <a href="/account?flow=sign-in">Sign in</a> · <a href="/account?flow=sign-up">Create account</a>';
      return;
    }
    status.textContent = "Available subscriptions";
    Clerk.mountPricingTable(document.getElementById("pricing-table"), {
      for: "user",
      highlightedPlan: "pro",
      newSubscriptionRedirectUrl: "/calibration/market-price",
    });
  } catch (error) {
    status.textContent = "Clerk Billing could not load. Confirm Billing is enabled and a user Plan is published in the Clerk Dashboard.";
    console.error("Clerk Billing page failed to load", error);
  }
});
</script>
</body>
</html>`;

app.get("/", (_req, res) => {
  res.redirect(302, "/calibration/market-price");
});

app.get("/calibration/market-price", (_req, res) => {
  res.type("html").send(marketPriceCalibrationPage);
});

app.get("/account", (_req, res) => {
  res.type("html").send(clerkAccountPage);
});

app.get("/subscribe", (_req, res) => {
  res.type("html").send(clerkSubscribePage);
});

// Kalshi's market-data endpoints are public, so no API key is needed here.
app.get("/api/fair-value/btc15m", async (_req, res) => {
  try {
    const response = await fetch("https://external-api.kalshi.com/trade-api/v2/markets?series_ticker=KXBTC15M&status=open&limit=5", { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Kalshi markets ${response.status}`);
    const markets = ((await response.json()).markets ?? []) as LiveMarket[];
    const now = Date.now();
    const market = markets
      .filter((m) => Date.parse(m.close_time) > now)
      .sort((a, b) => Date.parse(a.close_time) - Date.parse(b.close_time))[0];
    if (!market) {
      res.status(404).json({ error: "no_open_market" });
      return;
    }
    const ticks = db.select({ at: btcIndexTicks.receivedAt, raw: btcIndexTicks.rawValue })
      .from(btcIndexTicks)
      .where(and(eq(btcIndexTicks.asset, "BTC"), gte(btcIndexTicks.receivedAt, now - 61 * 60_000)))
      .orderBy(asc(btcIndexTicks.receivedAt))
      .all()
      .map((t) => ({ at: t.at, value: Number(t.raw) }))
      .filter((t) => Number.isFinite(t.value));
    res.json(buildPrediction(market, ticks, now));
  } catch (error) {
    res.status(502).json({ error: "prediction_unavailable", message: (error as Error).message });
  }
});

// Internal research tool, not a subscriber surface.
const btc15mFairValuePage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — BTC 15-min Market vs. Fair-Value Check</title>
<style>
  :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  body { margin: 0; background: #10151b; color: #e8edf2; }
  main { width: min(760px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 56px; }
  h1 { font-size: 1.4rem; margin-bottom: 4px; }
  .panel { border: 1px solid #2b3641; background: #171e26; border-radius: 6px; padding: 18px; margin-bottom: 16px; }
  .big { font-size: 1.6rem; font-weight: 700; }
  .muted { color: #91a1af; font-size: .8rem; }
  .warn { color: #f0d49e; font-size: .85rem; }
  table { width: 100%; border-collapse: collapse; font-size: .82rem; }
  td, th { border-bottom: 1px solid #2b3641; padding: 6px 8px; text-align: left; }
</style>
</head>
<body>
<main>
  <h1>BTC 15-minute: Market vs. fair-value check</h1>
  <p class="muted" id="market">Loading…</p>
  <div class="panel">
    <div class="big" id="headline">—</div>
    <div class="muted" id="headline-source"></div>
  </div>
  <div class="panel">
    <table><tbody id="details"></tbody></table>
  </div>
  <div class="panel">
    <p class="warn" id="edge"></p>
    <table><thead><tr><th>Minute</th><th>Market Brier</th><th>Model Brier</th></tr></thead><tbody id="evidence"></tbody></table>
    <p class="muted" id="evidence-note"></p>
  </div>
</main>
<script>
function pct(p) { return (p * 100).toFixed(1) + "%"; }
function row(label, value) { return "<tr><td>" + label + "</td><td>" + value + "</td></tr>"; }
async function load() {
  const response = await fetch("/api/fair-value/btc15m");
  const r = await response.json();
  if (!response.ok) { document.getElementById("market").textContent = "Unavailable: " + (r.message || r.error); return; }
  document.getElementById("market").textContent = r.ticker + " \u00b7 closes " + new Date(r.closeTime).toLocaleTimeString() + " \u00b7 " + r.minutesLeft.toFixed(1) + " min left";
  const headline = document.getElementById("headline");
  if (r.prediction) {
    headline.textContent = "Market-implied P(settle \u2265 target): " + pct(r.prediction.pHigher);
    document.getElementById("headline-source").textContent = "Best available estimate: " + r.prediction.source + ". Settles Higher if BRTI 60s average at close \u2265 target.";
  }
  document.getElementById("details").innerHTML =
    row("Target (strike)", "$" + r.target.toLocaleString()) +
    row("BRTI now", r.brti ? "$" + r.brti.value.toLocaleString() + " (" + r.brti.ageSeconds + "s old" + (r.brti.fresh ? "" : ", STALE") + ")" : "no data") +
    row("YES bid / ask", r.quotes.yesBid.toFixed(2) + " / " + r.quotes.yesAsk.toFixed(2)) +
    row("NO bid / ask", r.quotes.noBid.toFixed(2) + " / " + r.quotes.noAsk.toFixed(2)) +
    row("Fair-value model (cross-check)", r.model ? pct(r.model.pHigher) + " Higher" : "unavailable (BRTI stale or too little history)") +
    row("Model EV after fee: YES / NO", r.model && r.model.expectedValuePerContract ? (r.model.expectedValuePerContract.yes * 100).toFixed(1) + "\u00a2 / " + (r.model.expectedValuePerContract.no * 100).toFixed(1) + "\u00a2" : "\u2014");
  document.getElementById("edge").textContent = "Edge: " + r.edge;
  document.getElementById("evidence").innerHTML = Object.entries(r.evidence.brierByMinute).map(function (e) {
    return "<tr><td>" + e[0] + "</td><td>" + e[1].market.toFixed(4) + "</td><td>" + e[1].model.toFixed(4) + "</td></tr>";
  }).join("");
  document.getElementById("evidence-note").textContent = "Backtest " + r.evidence.run + ", " + r.evidence.markets + " settled markets; lower Brier is better. Trading on model/market disagreement " + r.evidence.tradingOnModelDisagreement + ".";
}
load();
setInterval(load, 5000);
</script>
</body>
</html>`;

app.get("/fair-value/btc15m", (_req, res) => {
  res.type("html").send(btc15mFairValuePage);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`QuanterraOS foundation server listening on http://localhost:${port}`);
});
