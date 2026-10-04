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
import { getCouncilAgentsData } from "./agents/council-data.ts";

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

app.get("/api/council/agents", (_req, res) => {
  res.json(getCouncilAgentsData());
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
  <nav class="site-nav"><a href="/">← QuanterraOS Home</a><div class="auth-links"><a class="auth-link" href="/calibration/market-price">Calibration Dashboard</a><a class="auth-link" href="/subscribe">Plans</a><span id="clerk-controls">${clerkConfigured ? "Loading account…" : "Sign-in setup pending"}</span></div></nav>
  <h1>Market Calibration</h1>
  <div class="panel" style="border-left: 4px solid #f0b3b3; margin: 16px 0 20px;">
    <div style="font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase; color: #f0b3b3; font-weight: 700; margin-bottom: 4px;">Calibration verdict: computing — methodology in progress</div>
    <div style="font-size: 0.95rem; color: #e8edf2; margin-bottom: 6px;">Scoring Kalshi 15-minute BTC entry mid-prices directly against real settlement outcomes without lookahead.</div>
    <div style="font-size: 0.8rem; color: #91a1af;">Benchmarks contract pricing against the empirical base-rate (climatology) Brier score and evaluates calibration consistency per probability bin. Historical calibration measures past markets and is not a forecast or investment advice.</div>
  </div>
  <p class="claim" id="claim">Loading…</p>
  <p class="not-claim" id="not-claim"></p>
  <div class="panel">
    <div class="stat-row">
      <div class="stat"><div class="value" id="brier">—</div><div class="label">Market Mid Brier Score</div></div>
      <div class="stat"><div class="value" id="base-rate-brier" style="color: #9ee0b8;">—</div><div class="label">Base-Rate Climatology Brier</div></div>
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
  document.getElementById("base-rate-brier").textContent = report.baseRateBrierScore === null ? "n/a" : report.baseRateBrierScore.toFixed(4);
  document.getElementById("sample-size").textContent = report.sampleSize;

  const fullTable = report.calibration.every(function (bin) { return "count" in bin; });
  const thinBins = report.calibration.filter(function (bin) { return fullTable ? bin.count > 0 && bin.count < lowConfidenceThreshold : bin.lowSample; });
  document.getElementById("caption").textContent = thinBins.length
    ? "Green points are well-populated bins; red points (" + thinBins.map(function (b) { return fullTable ? b.label + ", n=" + b.count : b.label; }).join("; ") + ") are thin-sample and lower-confidence, not equally reliable."
    : "All bins shown have at least " + lowConfidenceThreshold + " settled contracts.";
  document.getElementById("freshness").textContent = (report.realtime ? "Live: recomputed on this request at " : "Updated daily; last computed ") + report.computedAt + ". Auto-refreshes every 30s.";

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
setInterval(load, 30000);
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

function renderLandingPage(): string {
  const councilAgents = getCouncilAgentsData();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Sovereign Enterprise Intelligence</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,600;1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
${clerkScripts}
<style>
  :root {
    --ink: #0B0D10;
    --panel: #14171C;
    --panel-line: rgba(243,241,234,0.08);
    --text: #F3F1EA;
    --muted: #A9A79C;
    --accent: #C9A227;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--ink);
    color: var(--text);
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.6;
  }
  h1, h2, .serif-headline { font-family: "Fraunces", serif; font-weight: 340; font-size: 2.25rem; }
  .serif-emphasis { font-family: "Fraunces", serif; font-weight: 600; }
  .serif-italic { font-family: "Fraunces", serif; font-style: italic; font-weight: 500; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* Navy gradient background with subtle texture */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background: radial-gradient(1200px 600px at 50% 30%, rgba(13,20,31,0.8), var(--ink));
    pointer-events: none;
    z-index: -1;
  }

  /* Top Nav */
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 64px;
    border-bottom: 1px solid var(--panel-line);
    position: sticky;
    top: 0;
    background: rgba(11,13,16,0.8);
    backdrop-filter: blur(8px);
    z-index: 100;
  }
  .nav .left { display: flex; align-items: center; gap: 16px; }
  .nav .logo-circle {
    width: 32px; height: 32px;
    background: var(--accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Fraunces", serif;
    font-weight: 700;
    font-size: 16px;
    color: var(--ink);
  }
  .nav .wordmark { font-family: "Fraunces", serif; font-weight: 600; font-size: 1.1rem; color: var(--text); }
  .nav .links { display: flex; gap: 24px; }
  .nav .links a { color: var(--muted); font-size: 0.9rem; transition: color 0.2s; }
  .nav .links a:hover { color: var(--text); }
  .nav .auth { display: flex; align-items: center; gap: 16px; }
  .nav .ghost-btn {
    border: 1px solid var(--panel-line);
    padding: 8px 20px;
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--text);
    transition: all 0.2s;
  }
  .nav .ghost-btn:hover { border-color: var(--accent); background: rgba(201,162,39,0.08); }

  /* Hero */
  .hero {
    padding: 100px 64px 80px;
    text-align: center;
    max-width: 900px;
    margin: 0 auto;
  }
  .hero .eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 24px;
  }
  .hero h1 {
    font-size: 2.75rem;
    margin-bottom: 24px;
    color: var(--text);
  }
  .hero p.subhead {
    font-size: 1.125rem;
    color: var(--muted);
    margin-bottom: 32px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  .hero .cta-group {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-bottom: 60px;
  }
  .hero .primary-btn {
    background: var(--accent);
    color: var(--ink);
    border: none;
    padding: 14px 36px;
    border-radius: 8px;
    font-family: "IBM Plex Sans", sans-serif;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .hero .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(201,162,39,0.3);
  }
  .hero .secondary-btn {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--panel-line);
    padding: 14px 36px;
    border-radius: 8px;
    font-family: "IBM Plex Sans", sans-serif;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .hero .secondary-btn:hover { border-color: var(--accent); }

  /* Radial seal */
  .seal-container {
    margin: 40px auto 0;
    width: 240px;
    height: 240px;
    position: relative;
  }
  .seal {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(201,162,39,0.2), transparent 60%);
    box-shadow: 0 0 40px rgba(201,162,39,0.15);
  }
  .seal .hub {
    position: absolute;
    inset: 50%;
    width: 20px;
    height: 20px;
    background: var(--accent);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }
  .seal .ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(201,162,39,0.1);
  }
  .seal .ring.outer { width: 100%; height: 100%; }
  .seal .ring.middle { width: 68%; height: 68%; top: 16%; left: 16%; }
  .seal .ring.inner { width: 36%; height: 36%; top: 32%; left: 32%; }
  .seal .nodes {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  .seal .node {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--accent);
    border-radius: 50%;
    top: 0;
    left: 50%;
    transform: translate(-50%, 0);
    box-shadow: 0 0 8px rgba(201,162,39,0.4);
  }
  /* 8 nodes around the circle */
  ${Array.from({length: 8}, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const x = 50 + Math.sin(angle) * 40;
    const y = 50 + Math.cos(angle) * 40;
    const nx = -Math.sin(angle) * 40;
    const ny = Math.cos(angle) * 40;
    return `.seal .node:nth-child(${i + 1}) { transform: translate(calc(-50% + ${nx}px), calc(0% + ${ny}px)); }`;
  }).join("\n")}

  /* The Council section */
  .council-section {
    padding: 80px 64px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .section-header {
    text-align: center;
    margin-bottom: 20px;
  }
  .section-header .eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .section-header h2 {
    font-size: 1.75rem;
    font-family: "Fraunces", serif;
    font-weight: 340;
  }
  .section-subhead {
    color: var(--muted);
    margin-top: 12px;
    font-size: 0.95rem;
  }
  .council-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-top: 40px;
  }
  .agent-card {
    background: var(--panel);
    border: 1px solid var(--panel-line);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    outline: none;
    position: relative;
    user-select: none;
  }
  .agent-card:hover {
    border-color: var(--accent);
    box-shadow: 0 8px 28px rgba(201,162,39,0.12);
    transform: translateY(-3px);
  }
  .agent-card:focus-visible {
    border-color: var(--accent);
    outline: 2px solid var(--accent);
    outline-offset: 4px;
    box-shadow: 0 0 20px rgba(201,162,39,0.25);
  }
  .agent-card .icon {
    width: 44px;
    height: 44px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .agent-card .icon svg { width: 28px; height: 28px; fill: var(--accent); }
  .agent-card .role {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .agent-card .name {
    font-family: "Fraunces", serif;
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 8px;
  }
  .agent-card .desc {
    color: var(--muted);
    font-size: 0.8rem;
    line-height: 1.5;
  }
  .agent-card .card-footer-action {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(243,241,234,0.05);
  }
  .view-telemetry-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-family: ui-monospace, SFMono-Regular, monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
    opacity: 0.85;
    transition: opacity 0.15s;
  }
  .agent-card:hover .view-telemetry-pill {
    opacity: 1;
    text-decoration: underline;
  }

  /* Council Specialist Detail Modal */
  .council-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(11, 13, 16, 0.78);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s;
  }
  .council-modal-backdrop.open {
    opacity: 1;
    visibility: visible;
  }
  .council-modal {
    background: #14171C;
    border: 1px solid rgba(201,162,39,0.25);
    border-radius: 16px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(243,241,234,0.06);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 28px;
    transform: scale(0.96) translateY(12px);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .council-modal-backdrop.open .council-modal {
    transform: scale(1) translateY(0);
  }
  .council-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }
  .council-modal-identity {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .council-modal-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: rgba(201,162,39,0.12);
    border: 1px solid rgba(201,162,39,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .council-modal-icon svg {
    width: 24px;
    height: 24px;
    fill: var(--accent);
  }
  .council-modal-role {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--muted);
  }
  .council-modal-name {
    font-family: "Fraunces", serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--text);
    margin: 2px 0 0;
  }
  .council-modal-close {
    background: transparent;
    border: 1px solid var(--panel-line);
    color: var(--muted);
    font-size: 1.4rem;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: all 0.15s;
    outline: none;
  }
  .council-modal-close:hover, .council-modal-close:focus-visible {
    color: var(--text);
    border-color: var(--accent);
    background: rgba(201,162,39,0.1);
  }
  .council-modal-status-wrapper {
    margin: 8px 0 16px;
  }
  .agent-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 6px;
  }
  .status-research {
    background: rgba(201,162,39,0.15);
    color: #ffd768;
    border: 1px solid rgba(201,162,39,0.35);
  }
  .status-verified {
    background: rgba(46,125,50,0.15);
    color: #a5d6a7;
    border: 1px solid rgba(129,199,132,0.3);
  }
  .status-active {
    background: rgba(33,150,243,0.15);
    color: #90caf9;
    border: 1px solid rgba(100,181,246,0.3);
  }
  .status-standby {
    background: rgba(169,167,156,0.12);
    color: #d0cebe;
    border: 1px solid rgba(169,167,156,0.25);
  }
  .status-monitoring {
    background: rgba(79,224,255,0.12);
    color: #80deea;
    border: 1px solid rgba(79,224,255,0.28);
  }
  .council-modal-desc {
    color: var(--text);
    font-size: 0.92rem;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  .council-modal-telemetry {
    background: rgba(11,13,16,0.7);
    border: 1px solid var(--panel-line);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .telemetry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(243,241,234,0.06);
  }
  .telemetry-title {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    font-weight: 600;
  }
  .telemetry-badge {
    font-size: 0.65rem;
    font-family: ui-monospace, SFMono-Regular, monospace;
    background: rgba(201,162,39,0.1);
    color: var(--accent);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .telemetry-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .telemetry-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.82rem;
    gap: 12px;
  }
  .telemetry-label {
    color: var(--muted);
    font-size: 0.75rem;
    flex-shrink: 0;
  }
  .telemetry-value {
    color: var(--text);
    font-family: ui-monospace, SFMono-Regular, monospace;
    text-align: right;
    word-break: break-all;
  }
  .council-modal-footer {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 12px;
    border-top: 1px solid rgba(243,241,234,0.06);
  }
  .council-modal-note {
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
  }
  .council-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  /* How it works */
  .how-section {
    padding: 80px 64px;
    background: var(--panel);
    border-top: 1px solid var(--panel-line);
    border-bottom: 1px solid var(--panel-line);
  }
  .how-content {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }
  .how-steps {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-top: 40px;
    flex-wrap: wrap;
  }
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 140px;
  }
  .step .number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(201,162,39,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "IBM Plex Sans", sans-serif;
    font-weight: 600;
    color: var(--accent);
  }
  .step .label { font-weight: 500; }
  .step .detail {
    font-size: 0.8rem;
    color: var(--muted);
    text-align: center;
  }

  /* Dashboard preview */
  .dashboard-section {
    padding: 80px 64px;
    max-width: 1000px;
    margin: 0 auto;
  }
  .dashboard-section .eyebrow { text-align: center; }
  .dashboard-section h2 { text-align: center; font-size: 1.75rem; }
  .dashboard-preview {
    background: var(--panel);
    border: 1px solid var(--panel-line);
    border-radius: 12px;
    padding: 24px;
    margin-top: 32px;
  }
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--panel-line);
    padding-bottom: 12px;
  }
  .preview-header .label { font-size: 0.8rem; color: var(--muted); }
  .preview-header .badge {
    font-size: 0.7rem;
    color: var(--muted);
    border: 1px solid var(--panel-line);
    padding: 4px 10px;
    border-radius: 6px;
  }
  .preview-rows { display: flex; flex-direction: column; gap: 12px; }
  .preview-row {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .preview-row .bar {
    flex: 1;
    height: 14px;
    background: rgba(243,241,234,0.05);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  }
  .preview-row .bar::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, var(--accent), transparent 70%)';
    width: var(--width, 50%);
    opacity: 0.6;
  }
  .preview-row .placeholder-text {
    font-size: 0.75rem;
    color: var(--muted);
    min-width: 120px;
    text-align: right;
  }

  /* Footer CTA */
  .footer-section {
    padding: 80px 64px;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }
  .footer-section h2 { font-size: 1.5rem; }
  .footer-section p { color: var(--muted); margin: 16px 0 32px; font-size: 0.9rem; }
  .footer-section .primary-btn { width: 100%; }

  .footer {
    padding: 32px 64px;
    text-align: center;
    border-top: 1px solid var(--panel-line);
    color: var(--muted);
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    .hero h1 { font-size: 1.8rem; }
    .hero .cta-group { flex-direction: column; align-items: center; }
    .council-grid { grid-template-columns: repeat(2, 1fr); }
    .how-steps { gap: 16px; }
  }
  @media (max-width: 540px) {
    .council-grid { grid-template-columns: 1fr; }
    .council-modal { padding: 20px; }
  }
</style>
</head>
<body>
  <nav class="nav">
    <div class="left">
      <div class="logo-circle">QG</div>
      <span class="wordmark">QUANTERRAOS</span>
    </div>
    <div class="links">
      <a href="/calibration/market-price">Verified Calibration</a>
      <a href="/#council">The Council</a>
      <a href="/#how">How it Works</a>
      <a href="/#dashboard">Calibration Telemetry</a>
    </div>
    <div class="auth">
      <a href="/calibration/market-price"><button class="ghost-btn" style="border-color: var(--accent); color: var(--accent);">Live Calibration</button></a>
      <button class="ghost-btn" onclick="window.location.href='${clerkConfigured ? '/signup' : '/account'}'">Request Access</button>
    </div>
  </nav>

  <section class="hero">
    <div class="eyebrow">PREDICTION MARKET PRICING &amp; CALIBRATION VERIFICATION</div>
    <h1 class="serif-headline">A council of AI specialists,<br>verifying market truth.</h1>
    <p class="subhead">Empirical prediction-market intelligence. A coordinated council of AI agents verifies market pricing efficiency, audits order-book dynamics, and benchmarks contract probabilities against real settlement data with mathematical transparency.</p>
    <div class="cta-group">
      <a href="/calibration/market-price"><button class="primary-btn">View Verified Calibration</button></a>
      <button class="secondary-btn" onclick="document.getElementById('how').scrollIntoView({behavior:'smooth'})">How it works</button>
    </div>
    <div class="seal-container">
      <div class="seal">
        <div class="ring outer"></div>
        <div class="ring middle"></div>
        <div class="ring inner"></div>
        <div class="hub"></div>
        <div class="nodes">
          ${Array.from({length: 8}, (_, i) => `<div class="node" style="--i:${i}"></div>`).join("")}
        </div>
      </div>
    </div>
  </section>

  <section class="council-section" id="council">
    <div class="section-header">
      <div class="eyebrow">The Council</div>
      <h2>Eight specialists. One objective: Pricing Truth.</h2>
      <p class="section-subhead">Each agent verifies, monitors, or stress-tests a different layer of the market — built for transparency first, execution only once a signal is proven.</p>
    </div>
    <div class="council-grid">
      ${councilAgents.map((agent) => `
      <div class="agent-card"
           role="button"
           tabindex="0"
           aria-haspopup="dialog"
           aria-expanded="false"
           aria-controls="council-modal"
           data-agent-id="${agent.id}"
           id="agent-card-${agent.id}">
        <div>
          <div class="icon">${agent.iconSvg}</div>
          <div class="role">${agent.role}</div>
          <div class="name">${agent.name}</div>
          <div class="desc">${agent.shortDesc}</div>
        </div>
        <div class="card-footer-action">
          <span class="view-telemetry-pill">Audit Telemetry &rarr;</span>
        </div>
      </div>`).join("")}
    </div>

    <!-- Council Specialist Detail Modal -->
    <div class="council-modal-backdrop" id="council-modal-backdrop" role="presentation" aria-hidden="true">
      <div class="council-modal"
           id="council-modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="council-modal-name"
           aria-describedby="council-modal-desc">
        <div class="council-modal-header">
          <div class="council-modal-identity">
            <div class="council-modal-icon" id="council-modal-icon"></div>
            <div>
              <div class="council-modal-role" id="council-modal-role"></div>
              <h3 class="council-modal-name" id="council-modal-name"></h3>
            </div>
          </div>
          <button type="button" class="council-modal-close" id="council-modal-close-btn" aria-label="Close specialist details">&times;</button>
        </div>
        <div class="council-modal-status-wrapper">
          <span class="agent-status-badge" id="council-modal-status"></span>
        </div>
        <p class="council-modal-desc" id="council-modal-desc"></p>
        <div class="council-modal-telemetry" id="council-modal-telemetry">
          <div class="telemetry-header">
            <span class="telemetry-title">Empirical Telemetry &amp; Provenance</span>
            <span class="telemetry-badge" id="council-modal-telemetry-badge">AUDITED RECORD</span>
          </div>
          <div class="telemetry-grid" id="council-modal-stats"></div>
        </div>
        <div class="council-modal-footer">
          <div class="council-modal-note">Independent truth layer &bull; Metrics computed from stored records. No simulated edge.</div>
          <div class="council-modal-actions">
            <a id="council-modal-link" href="#" class="primary-btn" style="display: none; padding: 8px 16px; font-size: 0.82rem;"></a>
            <button type="button" class="ghost-btn" id="council-modal-dismiss-btn" style="padding: 8px 16px; font-size: 0.82rem;">Close Details</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="how-section" id="how">
    <div class="how-content">
      <div class="eyebrow">How the Council moves</div>
      <h2>Three layers of verification. No ungrounded claims.</h2>
      <div class="how-steps">
        <div class="step">
          <div class="number">1</div>
          <div class="label">Ingest &amp; Verify</div>
          <div class="detail">Draco and Phoenix ingest multi-exchange feeds, filtering stale ticks and verifying data integrity</div>
        </div>
        <div class="step">
          <div class="number">2</div>
          <div class="label">Structure &amp; Scan</div>
          <div class="detail">Falcon and Wolf profile order-book depth, spread compression, and liquidity dynamics</div>
        </div>
        <div class="step">
          <div class="number">3</div>
          <div class="label">Calibrate &amp; Grade</div>
          <div class="detail">Lion, Quantum Fox, and Kraken score market-implied probabilities against actual settlement for reproducible calibration measurement</div>
        </div>
      </div>
    </div>
  </section>

  <section id="dashboard" class="dashboard-section">
    <div class="eyebrow">Empirical Verification</div>
    <h2>Live Market Calibration Telemetry</h2>
    <p style="text-align: center; color: var(--muted); margin-top: 12px; font-size: 0.85rem;">Scoring Kalshi market-implied probabilities against actual settlement outcomes.</p>
    <div class="dashboard-preview" style="padding: 28px;">
      <div class="preview-header">
        <span class="label" style="font-weight:600; color: var(--text);">Kalshi 15M BTC Empirical Benchmark</span>
        <span class="badge" id="home-cal-badge" style="color: #f0b3b3; border-color: rgba(240,179,179,0.3); background: rgba(58,30,30,0.5);">Calibration verdict: computing — methodology in progress</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 24px 0;">
        <div style="background: rgba(11,13,16,0.6); padding: 16px; border-radius: 8px; border: 1px solid var(--panel-line);">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--muted);">Market Mid Brier Score</div>
          <div id="home-brier" style="font-size: 1.8rem; font-weight: 700; color: #9ee0b8; margin-top: 4px;">—</div>
          <div style="font-size: 0.75rem; color: var(--muted); margin-top: 4px;">entry minute mid-price probability</div>
        </div>
        <div style="background: rgba(11,13,16,0.6); padding: 16px; border-radius: 8px; border: 1px solid var(--panel-line);">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--muted);">Base-Rate Climatology Brier</div>
          <div id="home-base-rate" style="font-size: 1.8rem; font-weight: 700; color: var(--text); margin-top: 4px;">—</div>
          <div style="font-size: 0.75rem; color: var(--muted); margin-top: 4px;">unconditional base-rate benchmark</div>
        </div>
        <div style="background: rgba(11,13,16,0.6); padding: 16px; border-radius: 8px; border: 1px solid var(--panel-line);">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--muted);">Scored Settlements</div>
          <div id="home-sample" style="font-size: 1.8rem; font-weight: 700; color: var(--text); margin-top: 4px;">—</div>
          <div style="font-size: 0.75rem; color: var(--muted); margin-top: 4px;">15-min contracts verified</div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="/calibration/market-price"><button class="primary-btn" style="padding: 10px 24px; font-size: 0.9rem;">Open Full Calibration Curve &amp; Bin Table →</button></a>
      </div>
    </div>
  </section>

  <section class="footer-section">
    <h2 class="serif-headline">Build your council.</h2>
    <p>Join the waitlist for early access to the QuanterraOS sovereign intelligence platform.</p>
    <a href="/signup"><button class="primary-btn">Request Access</button></a>
  </section>

  <footer class="footer">
    <p>© 2026 QuanterraOS. All rights reserved. · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
  </footer>

<script>
document.addEventListener('DOMContentLoaded', async function() {
  const seal = document.querySelector('.seal');
  if (seal) {
    // Animate nodes connecting to hub after load
    const nodes = seal.querySelectorAll('.node');
    nodes.forEach((node, i) => {
      setTimeout(() => node.style.opacity = '1', i * 100);
    });
  }
  try {
    const res = await fetch('/api/calibration/market-price');
    if (res.ok) {
      const data = await res.json();
      if (data.averageBrierScore !== null && document.getElementById('home-brier')) {
        document.getElementById('home-brier').textContent = data.averageBrierScore.toFixed(4);
      }
      if (data.baseRateBrierScore !== null && document.getElementById('home-base-rate')) {
        document.getElementById('home-base-rate').textContent = data.baseRateBrierScore.toFixed(4);
      }
      if (data.sampleSize && document.getElementById('home-sample')) {
        document.getElementById('home-sample').textContent = data.sampleSize.toLocaleString();
      }
    }
  } catch (e) {
    console.error('Failed to load homepage calibration telemetry', e);
  }

  // Council Specialist Modal Controller
  (function initCouncilModal() {
    const councilAgents = ${JSON.stringify(councilAgents)};
    const backdrop = document.getElementById('council-modal-backdrop');
    const closeBtn = document.getElementById('council-modal-close-btn');
    const dismissBtn = document.getElementById('council-modal-dismiss-btn');
    const modalIcon = document.getElementById('council-modal-icon');
    const modalRole = document.getElementById('council-modal-role');
    const modalName = document.getElementById('council-modal-name');
    const modalStatus = document.getElementById('council-modal-status');
    const modalDesc = document.getElementById('council-modal-desc');
    const modalStats = document.getElementById('council-modal-stats');
    const modalLink = document.getElementById('council-modal-link');
    let activeCard = null;

    function openModal(agentId) {
      const agent = councilAgents.find(a => a.id === agentId);
      if (!agent || !backdrop) return;

      if (modalIcon) modalIcon.innerHTML = agent.iconSvg;
      if (modalRole) modalRole.textContent = agent.role;
      if (modalName) modalName.textContent = agent.name;
      if (modalDesc) modalDesc.textContent = agent.expandedDesc;

      if (modalStatus) {
        modalStatus.textContent = agent.status;
        modalStatus.className = 'agent-status-badge status-' + (agent.statusType || 'monitoring');
      }

      if (modalStats) {
        modalStats.innerHTML = '';
        agent.stats.forEach(stat => {
          const row = document.createElement('div');
          row.className = 'telemetry-row';
          const label = document.createElement('span');
          label.className = 'telemetry-label';
          label.textContent = stat.label;
          const val = document.createElement('span');
          val.className = 'telemetry-value';
          val.textContent = stat.value;
          row.appendChild(label);
          row.appendChild(val);
          modalStats.appendChild(row);
        });
      }

      if (modalLink) {
        if (agent.learnMoreUrl) {
          modalLink.href = agent.learnMoreUrl;
          modalLink.textContent = agent.learnMoreText || 'View Related Telemetry →';
          modalLink.style.display = 'inline-flex';
        } else {
          modalLink.style.display = 'none';
        }
      }

      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      activeCard = document.getElementById('agent-card-' + agentId);
      if (activeCard) {
        activeCard.setAttribute('aria-expanded', 'true');
      }

      setTimeout(() => {
        if (closeBtn) closeBtn.focus();
      }, 50);
    }

    function closeModal() {
      if (!backdrop) return;
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (activeCard) {
        activeCard.setAttribute('aria-expanded', 'false');
        activeCard.focus();
        activeCard = null;
      }
    }

    document.querySelectorAll('.agent-card[data-agent-id]').forEach(card => {
      const agentId = card.getAttribute('data-agent-id');
      card.addEventListener('click', () => openModal(agentId));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(agentId);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop && backdrop.classList.contains('open')) {
        closeModal();
      }
    });

    if (backdrop) {
      backdrop.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || !backdrop.classList.contains('open')) return;
        const focusable = backdrop.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    }
  })();
});
</script>
</body>
</html>`;
}

const landingPage = renderLandingPage();

const accessTerminalPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — Access Terminal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
${clerkScripts}
<style>
  :root {
    --bg: #060A12;
    --panel: rgba(13,20,31,0.72);
    --panel-line: rgba(79,224,255,0.16);
    --text: #E7F6FB;
    --text-dim: #7FA9B6;
    --accent: #4FE0FF;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: "IBM Plex Mono", monospace;
    min-height: 100vh;
    overflow: hidden;
    position: relative;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background: 
      radial-gradient(circle at 50% 50%, rgba(79,224,255,0.03) 0%, transparent 60%),
      repeating-radial-gradient(circle, rgba(79,224,255,0.02) 1px, transparent 1px);
    pointer-events: none;
    z-index: -1;
  }

  /* Top HUD */
  .hud {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 32px;
    border-bottom: 1px solid var(--panel-line);
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.8rem;
    color: var(--text-dim);
    height: 48px;
  }
  .hud .left span { display: flex; align-items: center; gap: 12px; }
  .hud .center { position: absolute; left: 50%; transform: translateX(-50%); }
  .hud .status-tag { color: var(--accent); }
  .hud .right { color: var(--accent); }

  /* Layout */
  .main {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    gap: 24px;
    padding: 48px 32px;
    max-width: 1400px;
    margin: 0 auto;
    height: calc(100vh - 48px);
    align-items: center;
  }
  .column { display: flex; flex-direction: column; gap: 20px; }

  /* Telemetry panel */
  .telemetry-panel {
    background: var(--panel);
    border: 1px solid var(--panel-line);
    border-radius: 12px;
    padding: 18px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.75rem;
  }
  .telemetry-panel .panel-title {
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .telemetry-panel .panel-title .dot {
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--accent);
  }
  .telemetry-panel .value {
    color: var(--text);
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 8px;
  }
  .telemetry-panel .bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 48px;
    margin-top: 8px;
  }
  .telemetry-panel .bar {
    flex: 1;
    min-width: 2px;
    background: var(--accent);
    border-radius: 2px 2px 0 0;
    opacity: 0.4;
    transition: opacity 0.3s;
  }
  .telemetry-panel .bar.active { opacity: 1; }

  /* Sparkline */
  .sparkline {
    width: 100%;
    height: 40px;
  }
  .sparkline line {
    stroke: var(--accent);
    stroke-width: 1.5;
    fill: none;
  }

  /* Gauge */
  .gauge {
    width: 100%;
    text-align: center;
  }
  .gauge .track {
    width: 100%;
    height: 8px;
    background: rgba(127,169,182,0.2);
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
  }
  .gauge .fill {
    height: 100%;
    background: var(--accent);
    width: 30%;
  }
  .gauge .label {
    color: var(--text-dim);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Signal map radar */
  .radar {
    width: 160px;
    height: 160px;
    margin: 0 auto;
    position: relative;
  }
  .radar .rings {
    position: absolute;
    inset: 0;
    border: 1px solid var(--panel-line);
    border-radius: 50%;
  }
  .radar .rings:nth-child(1) { width: 100%; height: 100%; }
  .radar .rings:nth-child(2) { width: 70%; height: 70%; top: 15%; left: 15%; }
  .radar .rings:nth-child(3) { width: 40%; height: 40%; top: 30%; left: 30%; }
  .radar .blip {
    position: absolute;
    width: 8px;
    height: 8px;
    background: var(--accent);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--accent);
    top: 25%;
    left: 60%;
  }
  .radar .center {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--accent);
  }

  /* Terminal card */
  .terminal {
    background: var(--panel);
    border: 1px solid var(--panel-line);
    border-radius: 16px;
    padding: 32px;
    position: relative;
    backdrop-filter: blur(4px);
  }
  .terminal::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: rgba(0,0,0,0.2);
    border-radius: 16px 16px 0 0;
    display: flex;
    gap: 6px;
    padding: 0 8px;
  }
  .terminal::before {
    content: "";
  }
  .terminal .corner-brackets {
    position: absolute;
    top: 32px;
    left: 24px;
    right: 24px;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  }
  .terminal .corner-brackets .bracket {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.8rem;
    color: var(--accent);
    opacity: 0.5;
  }

  .terminal .section-label {
    font-size: 0.7rem;
    color: var(--text-dim);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  .terminal h1 {
    font-family: "Fraunces", serif;
    font-style: italic;
    font-weight: 500;
    font-size: 1.5rem;
    color: var(--text);
    margin-bottom: 32px;
  }

  .form-group {
    margin-bottom: 24px;
  }
  .form-group label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 8px;
  }
  .form-group input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--panel-line);
    border-radius: 8px;
    color: var(--text);
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-group input:focus {
    border-color: var(--accent);
  }
  .form-group input::placeholder {
    color: var(--text-dim);
  }

  .submit-btn {
    width: 100%;
    background: var(--accent);
    color: var(--bg);
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-family: "IBM Plex Sans", sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: all 0.2s;
  }
  .submit-btn:hover {
    box-shadow: 0 0 20px rgba(79,224,255,0.3);
  }

  .signup-link {
    text-align: center;
    margin-top: 20px;
    font-size: 0.8rem;
  }
  .signup-link a {
    color: var(--accent);
    font-family: "IBM Plex Sans", sans-serif;
    font-weight: 500;
  }
  .signup-link a:hover { text-decoration: underline; }

  .session-clock {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.85rem;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }

  .footer-honesty {
    position: fixed;
    bottom: 16px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 0.7rem;
    color: var(--text-dim);
    font-family: "IBM Plex Mono", monospace;
  }
</style>
</head>
<body>
  <div class="hud">
    <div class="left">
      <span><span class="status-tag">●</span> NODE US-WEST-1</span>
      <span>· LINK SECURE</span>
      <span>· STATUS NOMINAL</span>
    </div>
    <div class="center">QUANTERRAOS ACCESS TERMINAL v1.0</div>
    <div class="right">
      <span id="session-clock" class="session-clock">00:00:00</span>
    </div>
  </div>

  <div class="main">
    <!-- Left column: telemetry panels -->
    <div class="column">
      <div class="telemetry-panel">
        <div class="panel-title"><span class="dot"></span> COUNCIL STATUS</div>
        <div class="value">8/8 ONLINE</div>
        <div class="bars">
          ${Array.from({length: 8}, (_, i) => 
            `<div class="bar${i < 8 ? ' active' : ''}" style="--delay:${i * 0.1}s"></div>`
          ).join("")}
        </div>
      </div>

      <div class="telemetry-panel">
        <div class="panel-title"><span class="dot"></span> MARKET PULSE</div>
        <div class="value" id="btc-price">83,013</div>
        <svg class="sparkline" id="sparkline">
          ${Array.from({length: 20}, (_, i) => 
            `<line x1="${i * 12}" y1="${60 - Math.random() * 30}" x2="${(i + 1) * 12}" y2="${60 - Math.random() * 30}"></line>`
          ).join("")}
        </svg>
      </div>

      <div class="telemetry-panel">
        <div class="panel-title">THREAT LEVEL</div>
        <div class="gauge">
          <div class="track"><div class="fill"></div></div>
          <div class="value">NOMINAL</div>
        </div>
      </div>

      <div class="telemetry-panel">
        <div class="panel-title">DATA THROUGHPUT</div>
        <div class="value" id="throughput">0</div>
        <div class="bars" id="throughput-bars">
          ${Array.from({length: 12}, (_, i) => 
            `<div class="bar" style="--delay:${i * 0.05}s"></div>`
          ).join("")}
        </div>
      </div>
    </div>

    <!-- Center: terminal card -->
    <div class="terminal">
      <div class="corner-brackets">
        <span class="bracket">◐</span>
        <span class="bracket">◓</span>
      </div>
      <div class="section-label">// ACCESS TERMINAL</div>
      <h1>Identify yourself.</h1>
      <div class="form-group">
        <label for="operator-id">OPERATOR ID</label>
        <input type="text" id="operator-id" name="operatorId" placeholder="alex@quanterraos.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label for="access-key">ACCESS KEY</label>
        <input type="password" id="access-key" name="accessKey" placeholder="••••••••••••••••" autocomplete="off" />
      </div>
      <button class="submit-btn" id="init-session">INITIALIZE SESSION →</button>
      <div class="signup-link">
        New operator? <a href="/signup">Request clearance →</a>
      </div>

      <div id="terminal-status" style="font-size:0.75rem; color: var(--text-dim); margin-top: 16px; min-height: 20px;"></div>
    </div>

    <!-- Right column: more telemetry -->
    <div class="column">
      <div class="telemetry-panel">
        <div class="panel-title"><span class="dot"></span> SESSION CLOCK</div>
        <div class="value session-clock" id="session-display">00:00:00</div>
      </div>

      <div class="telemetry-panel">
        <div class="panel-title"><span class="dot"></span> SIGNAL MAP</div>
        <div class="radar">
          <div class="rings"></div>
          <div class="rings"></div>
          <div class="rings"></div>
          <div class="center"></div>
          <div class="blip"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-honesty">ALL INDICATORS ARE ILLUSTRATIVE — LIVE TELEMETRY CONNECTS ON LAUNCH</div>

<script>
const clerkConfigured = ${clerkConfigured};

// Session clock
function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  const timeStr = h + ':' + m + ':' + s;
  document.querySelectorAll('#session-clock, #session-display').forEach(el => {
    if (el) el.textContent = timeStr;
  });
}
updateClock();
setInterval(updateClock, 1000);

// Animate telemetry bars
function animateBars() {
  const bars = document.querySelectorAll('.telemetry-panel .bar');
  bars.forEach((bar, i) => {
    setTimeout(() => {
      if (bar instanceof HTMLElement) {
        const height = 10 + Math.random() * 30;
        bar.style.height = height + 'px';
        bar.classList.add('active');
        setTimeout(() => bar.classList.remove('active'), 1000 + Math.random() * 500);
      }
    }, i * 100);
  });
}
animateBars();
setInterval(animateBars, 3000);

// Update throughput counter
let rate = 0;
setInterval(() => {
  rate = Math.floor(9000 + Math.random() * 12000);
  if (document.getElementById('throughput')) {
    document.getElementById('throughput').textContent = rate.toLocaleString();
  }
}, 1000);

// Terminal form submission — uses Clerk via /account sign-up flow
document.getElementById('init-session').addEventListener('click', async function() {
  const status = document.getElementById('terminal-status');
  if (!clerkConfigured) {
    status.textContent = 'CLERK NOT CONFIGURED — add CLERK_PUBLISHABLE_KEY to server environment';
    return;
  }
  status.textContent = 'INITIALIZING…';
  window.location.href = '/account?flow=sign-up';
});
</script>
</body>
</html>`;

app.get("/", (_req, res) => {
  res.type("html").send(renderLandingPage());
});

app.get("/signup", (_req, res) => {
  res.type("html").send(accessTerminalPage);
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

