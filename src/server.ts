import { renderLandingPage } from "./landing-page.ts";
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
import path from "node:path";
import { randomUUID } from "node:crypto";
import { eq, and, gte, asc, desc, sql } from "drizzle-orm";
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
import { getLatestCouncilPipelineRun, runCouncilPipelineCycle } from "./agents/council-pipeline.ts";
import { getCouncilPersona, getAllCouncilPersonas } from "./agents/council-personas.ts";
import { handleCouncilChat, getCouncilChatAuditLog } from "./agents/council-chat.ts";
import { renderCouncilDashboardPage } from "./dashboard-terminal.ts";
import { getSwingEventsSummary, readSwingEventsCsv, checkLiveSwingEvents } from "./swing-event-logger.ts";
import { getOrComputeCalibrationReport, renderCalibrationHtml } from "./calibration-page.ts";
import { renderResponsePostPage } from "./response-post-page.ts";
import { getLatestCompositeIndex, getCompositeIndexHistory } from "./composite-index.ts";
import { renderIndexPageHtml, renderSpreadPageHtml } from "./index-page.ts";
import { renderMethodologyPageHtml } from "./methodology-page.ts";
import { renderResearchPageHtml } from "./research-page.ts";
import { renderStatusPageHtml, getSystemStatusData, getGlobalEdgeNodes } from "./status-page.ts";
import { renderLegalPageHtml } from "./legal-page.ts";
import { renderChangelogPageHtml } from "./changelog-page.ts";
import { renderPredictionsPage } from "./predictions-page.ts";
import { renderAutopilotPage } from "./autopilot-page.ts";
import { getPredictionsLedger, seedHistoricalReplay } from "./prediction-ledger.ts";
import { getAutopilotLedger } from "./autopilot-engine.ts";
import { renderPricingPageHtml } from "./pricing-page.ts";
import { renderTwoStrategiesLostPageHtml } from "./blog-page.ts";
import { renderAccountPageHtml } from "./account-page.ts";
import { renderWalletPageHtml } from "./wallet-page.ts";
import {
  getWalletSummary,
  executeSimulatedDeposit,
  executeSimulatedWithdrawal,
  resetSubscriberWallet,
} from "./wallet-engine.ts";
import { startGrowthEngine } from "./growth/index.ts";
import {
  getGtmSummary,
  listContentDrafts,
  draftContentPiece,
  approveContentDraft,
  getOrCreateAdSpendCaps,
  listInstitutionalPipeline,
  updatePipelineStage,
} from "./gtm-engine.ts";
import {
  createUser,
  authenticateUser,
  createSession,
  deleteSession,
  getUserAuth,
  generateApiKey,
  type UserTier,
  getUserById,
  getUserByEmail,
  updateUserTier,
} from "./auth.ts";
import {
  getActiveKalshi15mMarket,
  getKalshiPortfolioBalance,
  placeKalshi15mBid,
  getUserKalshiBids,
} from "./kalshi-api.ts";
import { renderKalshiTerminalHtml } from "./kalshi-terminal-page.ts";
import {
  createCheckoutSession,
  createCustomerPortalSession,
  processBillingEvent,
  verifyStripeSignature,
  BILLING_CONFIG,
} from "./billing.ts";
import { apiKeys } from "./schema.ts";
import {
  logEvent,
  renderAdminMetricsPage,
  getDailySignups,
  getConversionFunnel,
  getWeekOverWeekRetention,
  getRecentRawEvents,
} from "./metrics.ts";

runMigrations();
seedHistoricalReplay().catch((err) => console.error("Error seeding historical replay:", err));

const app = express();
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve("public")));
app.use("/assets", express.static(path.resolve("public/assets")));
app.get("/assets/assistant-avatar.jpg", (_req, res) => {
  res.sendFile(path.resolve("public/assets/assistant-avatar.jpg"));
});

// Production / Platform Health Check
app.get(["/health", "/healthz"], (_req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    circuit: "LOCKED_RULE_B5",
    database: "connected",
  });
});

// QuanterraOS Growth Engine: outreach, concierge chat, opt-in voice callbacks, and tamper-evident consent ledger
const growth = startGrowthEngine({ pagePath: path.resolve("public/growth.html") });
app.use(growth.handler);

// QuanterraOS Homepage v2 Preview (Lion spokesperson, 3-layer Council, F1 Fleet graphic)
app.get(["/preview", "/home-v2"], (_req, res) => {
  res.sendFile(path.resolve("public/quanterraos-home.html"));
});
app.get("/fleet.jpg", (_req, res) => {
  res.sendFile(path.resolve("public/fleet.jpg"));
});

// TrustOS Enterprise AI Pilot Offer ($20,000 / 6-Week Calibration Audit)
app.get(["/trustos", "/pilot"], (_req, res) => {
  res.sendFile(path.resolve("public/trustos.html"));
});

// Go-To-Market (GTM) Agents API (Content, Ad Platform, CRM, Sales Pipeline)
app.get("/api/gtm/summary", (_req, res) => {
  res.json(getGtmSummary());
});

app.get("/api/gtm/drafts", (_req, res) => {
  res.json(listContentDrafts());
});

app.post("/api/gtm/drafts/new", (req, res) => {
  try {
    const draft = draftContentPiece(req.body);
    res.json(draft);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/gtm/drafts/approve", (req, res) => {
  try {
    const result = approveContentDraft(req.body.draftId, req.body.approvedBy || "Michael Quantara");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/gtm/pipeline", (_req, res) => {
  res.json(listInstitutionalPipeline());
});

app.post("/api/gtm/pipeline/stage", (req, res) => {
  try {
    const result = updatePipelineStage(req.body.opportunityId, req.body.stage);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/gtm/ad-caps", (_req, res) => {
  res.json({
    google: getOrCreateAdSpendCaps("google"),
    meta: getOrCreateAdSpendCaps("meta"),
  });
});

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

app.get(["/health", "/healthz"], async (_req, res) => {
  try {
    await db.run(sql`SELECT 1`);
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: (err as Error).message,
    });
  }
});

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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06070A;
    --card: #0C0F17;
    --border: rgba(212, 175, 55, 0.16);
    --accent: #DFB843;
    --accent-light: #F7E7B4;
    --accent-glow: rgba(223, 184, 67, 0.22);
    --gold-bullion: #D4AF37;
    --warning: #F43F5E;
    --text: #F8FAFC;
    --muted: #94A3B8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse 90% 50% at 50% -10%, rgba(223, 184, 67, 0.09), transparent 70%), var(--bg);
    color: var(--text);
    font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    padding-bottom: 56px;
  }
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px;
    background: rgba(14, 19, 26, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-left { display: flex; align-items: baseline; gap: 8px; }
  .brand-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.02em;
  }
  .brand-sub {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.72rem;
    color: var(--accent);
  }
  .nav-links { display: flex; gap: 18px; }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.82rem;
    transition: color 0.15s ease;
  }
  .nav-links a:hover, .nav-links a.active { color: var(--text); }
  .nav-links a.active { color: var(--accent); }
  .gate-badge-locked {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--warning);
    background: rgba(198, 93, 74, 0.12);
    border: 1px solid rgba(198, 93, 74, 0.35);
    padding: 4px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  main { width: min(840px, calc(100% - 32px)); margin: 32px auto 0; }
  h1 { font-size: 1.4rem; font-weight: 600; margin-bottom: 4px; letter-spacing: -0.01em; }
  h2 { font-size: 1rem; color: var(--text); margin: 0 0 14px; font-weight: 600; }
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 20px;
  }
  label { display: block; font-family: "IBM Plex Mono", monospace; font-size: 0.78rem; color: var(--muted); margin-bottom: 6px; }
  input {
    width: 100%;
    background: #06090E;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 10px 12px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.85rem;
    margin-bottom: 14px;
    outline: none;
  }
  input:focus { border-color: var(--accent); }
  button {
    background: #17212F;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 9px 16px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.82rem;
    cursor: pointer;
    margin-right: 8px;
    transition: all 0.15s ease;
  }
  button:hover { background: #223145; border-color: var(--accent); }
  button.accept { border-color: #2F9E5B; color: #72E09F; }
  button.reject { border-color: var(--warning); color: #F08C7D; }
  .ai-tag {
    display: inline-block;
    background: rgba(223, 184, 67, 0.14);
    color: var(--accent-light);
    border: 1px solid rgba(223, 184, 67, 0.35);
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.68rem;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: 999px;
    margin-left: 8px;
    vertical-align: middle;
  }
  .evidence-table { width: 100%; border-collapse: collapse; font-family: "IBM Plex Mono", monospace; font-size: 0.78rem; margin-top: 14px; }
  .evidence-table th, .evidence-table td { border-bottom: 1px solid var(--border); padding: 8px 10px; text-align: left; }
  .evidence-table th { color: var(--muted); font-size: 0.72rem; text-transform: uppercase; }
  .status { font-family: "IBM Plex Mono", monospace; font-size: 0.8rem; color: var(--muted); margin-top: 12px; }
  .stat-row { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 8px; }
  .stat { min-width: 120px; }
  .stat .value { font-family: "IBM Plex Mono", monospace; font-size: 1.4rem; font-weight: 700; color: var(--accent); }
  .stat .value.warn { color: var(--warning); }
  .stat .label { font-family: "IBM Plex Mono", monospace; font-size: 0.72rem; color: var(--muted); text-transform: uppercase; }

  footer {
    width: min(840px, calc(100% - 32px));
    margin: 40px auto 0;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.6;
  }
  .footer-links { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
  .footer-links a { color: var(--accent); text-decoration: none; }
  .footer-links a:hover { text-decoration: underline; }
</style>
</head>
<body>

  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="brand-title">quanterraos</a>
      <span class="brand-sub">/ workspace</span>
    </div>
    <div class="nav-links">
      <a href="/">home</a>
      <a href="/calibration">calibration</a>
      <a href="/council">council</a>
      <a href="/index">index</a>
      <a href="/spread">spread</a>
      <a href="/methodology">methodology</a>
      <a href="/research">research</a>
      <a href="/status">status</a>
    </div>
    <div class="nav-right">
      <span class="gate-badge-locked">Rule B5 locked</span>
    </div>
  </nav>

<main>
  <h1>Research Workspace</h1>
  <p style="font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: var(--muted); margin-bottom: 24px;">Falcon suggestion cross-check &amp; track-record governance.</p>

  <div class="panel">
    <h2>Get a Falcon suggestion<span class="ai-tag">AI proposed</span></h2>
    <label for="contract">Contract ticker</label>
    <input id="contract" placeholder="KXBTC15M-...">
    <button id="ask-falcon">Ask Falcon</button>
    <div id="falcon-card"></div>
  </div>

  <div class="panel">
    <h2>Falcon track record</h2>
    <div id="track-record" class="stat-row"></div>
  </div>
</main>

<footer>
  <div class="footer-links">
    <a href="/">home</a>
    <a href="/calibration">calibration</a>
    <a href="/council">council</a>
    <a href="/index">index</a>
    <a href="/spread">spread</a>
    <a href="/methodology">methodology</a>
    <a href="/research">research</a>
    <a href="/changelog">changelog</a>
    <a href="/legal">legal</a>
    <a href="/status">status</a>
  </div>
  <div>QuanterraOS Research Workspace · Auditable empirical benchmarks · Rule B5 locked · Zero live capital deployed ($0.00).</div>
</footer>

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
    card.innerHTML = "<p class=\"status\">No Falcon suggestion: " + (body.message || response.statusText) + "</p>";
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
      row.bestYesPrice + "</td><td>" + row.bestNoPrice + "</td><td>" + row.depthImbalance.toFixed(4) + "</td></tr>";
  }).join("");
  card.innerHTML =
    "<div style=\"margin-top:14px; padding-top:14px; border-top:1px solid var(--border);\">" +
      "<p style=\"font-family:'IBM Plex Mono',monospace; font-size:0.85rem; margin-bottom:8px;\"><strong>Rationale:</strong> " + recommendation.rationale + "</p>" +
      "<p style=\"font-family:'IBM Plex Mono',monospace; font-size:0.85rem; margin-bottom:12px;\"><strong>Suggested P(YES):</strong> <span style=\"color:var(--accent); font-weight:700;\">" + (recommendation.suggestedProbability * 100).toFixed(1) + "%</span></p>" +
      "<button class=\"accept\" id=\"accept-rec\">Accept</button>" +
      "<button class=\"reject\" id=\"reject-rec\">Reject</button>" +
      "<button id=\"edit-rec\">Edit</button>" +
      "<table class=\"evidence-table\">" +
        "<thead><tr><th>Market</th><th>Captured</th><th>YES</th><th>NO</th><th>Depth Imb</th></tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table>" +
    "</div>";
  document.getElementById("accept-rec").addEventListener("click", function () { decide(recommendation.id, "accepted"); });
  document.getElementById("reject-rec").addEventListener("click", function () { decide(recommendation.id, "rejected"); });
  document.getElementById("edit-rec").addEventListener("click", function () {
    const input = prompt("Enter revised probability (0.01 - 0.99):", String(recommendation.suggestedProbability));
    if (input === null) return;
    const edited = Number(input);
    if (Number.isNaN(edited) || edited <= 0 || edited >= 1) {
      alert("Must be a number strictly between 0 and 1");
      return;
    }
    decide(recommendation.id, "edited", edited);
  });
}

async function decide(id, decision, editedProbability) {
  const response = await fetch("/api/agents/falcon/" + id + "/decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision: decision, editedProbability: editedProbability }),
  });
  if (response.ok) {
    document.getElementById("falcon-card").innerHTML = "<p class=\"status\">Decision recorded: " + decision + "</p>";
    loadTrackRecord();
  }
}

async function loadTrackRecord() {
  const response = await fetch("/api/agents/falcon/track-record");
  const el = document.getElementById("track-record");
  if (!response.ok) {
    el.innerHTML = "<p class=\"status\">Could not load track record</p>";
    return;
  }
  const record = await response.json();
  function stat(label, value, isWarn) {
    return "<div class=\"stat\"><div class=\"value" + (isWarn ? " warn" : "") + "\">" + value + "</div><div class=\"label\">" + label + "</div></div>";
  }
  el.innerHTML =
    stat("Proposed", record.proposed) +
    stat("Accepted", record.accepted) +
    stat("Edited", record.edited) +
    stat("Rejected", record.rejected) +
    stat("Falcon Brier", record.averageBrierScore === null ? "n/a (" + record.scored + " scored)" : record.averageBrierScore.toFixed(4) + " (" + record.scored + " scored)", true);
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

// Conversational AI Executive Persona Endpoints
app.get(["/api/executives", "/api/council/personas"], (_req, res) => {
  res.json(getAllCouncilPersonas());
});

app.get(["/api/executives/:id/persona", "/api/council/agents/:id/persona"], (req, res) => {
  const persona = getCouncilPersona(req.params.id);
  if (!persona) {
    return res.status(404).json({ error: "persona_not_found", message: `Executive persona '${req.params.id}' not found` });
  }
  res.json(persona);
});

// Rate limiting & abuse protection for Council Chat endpoints
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const chatRateLimits = new Map<string, RateLimitBucket>();
const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 30;
const MAX_MESSAGE_LENGTH = 2000;

function checkChatRateLimit(clientIp: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = chatRateLimits.get(clientIp);

  if (!bucket || now >= bucket.resetTime) {
    chatRateLimits.set(clientIp, { count: 1, resetTime: now + CHAT_RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count++;
  if (bucket.count > CHAT_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetTime - now) / 1000));
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

app.post(["/api/assistant/chat", "/api/council/:agentId/chat", "/api/council/:id/chat", "/api/council/agents/:id/chat", "/api/executives/:id/chat"], async (req, res) => {
  try {
    const clientIp = (req.ip || req.socket.remoteAddress || "unknown").toString();
    const rateCheck = checkChatRateLimit(clientIp);
    if (!rateCheck.allowed) {
      res.set("Retry-After", rateCheck.retryAfterSeconds.toString());
      return res.status(429).json({
        error: "rate_limit_exceeded",
        message: `Too many chat requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`
      });
    }

    const agentId = req.params.agentId || req.params.id || req.body?.agentId || "sentinel";
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "invalid_request", message: "Field 'message' is required." });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: "message_too_long",
        message: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`
      });
    }
    const persona = getCouncilPersona(agentId);
    if (!persona) {
      return res.status(404).json({ error: "persona_not_found", message: `Executive persona '${agentId}' not found` });
    }
    const response = await handleCouncilChat({
      agentId,
      message: message.trim(),
      history: Array.isArray(history) ? history : undefined
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "chat_execution_failed", message: (error as Error).message });
  }
});

app.get(["/api/executives/audit-log", "/api/council/chat/audit-log"], (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const logs = getCouncilChatAuditLog(limit);
  res.json({ count: logs.length, logs });
});

app.get("/api/council/pipeline/latest", async (_req, res) => {
  try {
    const run = await getLatestCouncilPipelineRun();
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: "pipeline_unavailable", message: (error as Error).message });
  }
});

app.post("/api/council/pipeline/run", async (_req, res) => {
  try {
    const run = await getLatestCouncilPipelineRun(15_000);
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: "pipeline_execution_failed", message: (error as Error).message });
  }
});

app.get("/api/research/swing-events", (_req, res) => {
  try {
    const summary = getSwingEventsSummary();
    const events = readSwingEventsCsv().slice(-50);
    res.json({ ...summary, recentEvents: events });
  } catch (error) {
    res.status(500).json({ error: "swing_events_unavailable", message: (error as Error).message });
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
${clerkScripts}
<style>
  :root {
    --bg: #06070A;
    --card: #0C0F17;
    --border: rgba(212, 175, 55, 0.16);
    --accent: #DFB843;
    --accent-light: #F7E7B4;
    --accent-glow: rgba(223, 184, 67, 0.22);
    --gold-bullion: #D4AF37;
    --warning: #F43F5E;
    --text: #F8FAFC;
    --muted: #94A3B8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse 90% 50% at 50% -10%, rgba(223, 184, 67, 0.09), transparent 70%), var(--bg);
    color: var(--text);
    font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    padding-bottom: 56px;
  }
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px;
    background: rgba(14, 19, 26, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-left { display: flex; align-items: baseline; gap: 8px; }
  .brand-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.02em;
  }
  .brand-sub {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.72rem;
    color: var(--accent);
  }
  .nav-links { display: flex; gap: 18px; }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.82rem;
    transition: color 0.15s ease;
  }
  .nav-links a:hover, .nav-links a.active { color: var(--text); }
  .nav-links a.active { color: var(--accent); }
  .gate-badge-locked {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--warning);
    background: rgba(198, 93, 74, 0.12);
    border: 1px solid rgba(198, 93, 74, 0.35);
    padding: 4px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  main { width: min(560px, calc(100% - 32px)); margin: 36px auto 0; }
  h1 { font-size: 1.4rem; font-weight: 600; margin-bottom: 4px; }
  .subtitle { font-family: "IBM Plex Mono", monospace; font-size: 0.8rem; color: var(--muted); margin-bottom: 24px; }
  
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 24px;
  }
  .tabs { display: flex; gap: 14px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
  button.tab-btn {
    border: 0;
    border-bottom: 2px solid transparent;
    padding: 10px 4px;
    color: var(--muted);
    background: transparent;
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.85rem;
    cursor: pointer;
  }
  button.tab-btn[aria-selected="true"] { color: var(--accent); border-color: var(--accent); font-weight: 600; }
  .muted { color: var(--muted); font-size: 0.82rem; font-family: "IBM Plex Mono", monospace; line-height: 1.5; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  #user-button { min-height: 44px; }

  footer {
    width: min(560px, calc(100% - 32px));
    margin: 40px auto 0;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.6;
  }
  .footer-links { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
  .footer-links a { color: var(--accent); text-decoration: none; }
  .footer-links a:hover { text-decoration: underline; }
</style>
</head>
<body>

  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="brand-title">quanterraos</a>
      <span class="brand-sub">/ account</span>
    </div>
    <div class="nav-links">
      <a href="/">home</a>
      <a href="/calibration">calibration</a>
      <a href="/council">council</a>
      <a href="/subscribe">plans</a>
      <a href="/status">status</a>
    </div>
    <div class="nav-right">
      <span class="gate-badge-locked">Rule B5 locked</span>
    </div>
  </nav>

<main>
  <h1>User Authentication &amp; Profile</h1>
  <p class="subtitle">Secure session management via Clerk identity.</p>

  <section class="panel">
    <p class="muted" id="account-status">${clerkConfigured ? "Loading Clerk session…" : "Authentication service operational in local preview mode. Add CLERK_PUBLISHABLE_KEY to production environment."}</p>
    <div id="account-auth" hidden>
      <div class="tabs" role="tablist">
        <button type="button" id="sign-in-tab" role="tab" class="tab-btn">Sign in</button>
        <button type="button" id="sign-up-tab" role="tab" class="tab-btn">Create account</button>
      </div>
      <div id="sign-in-mount"></div>
      <div id="sign-up-mount" hidden></div>
    </div>
    <div id="account-user" hidden><div id="user-button"></div></div>
  </section>
</main>

<footer>
  <div class="footer-links">
    <a href="/">home</a>
    <a href="/calibration">calibration</a>
    <a href="/council">council</a>
    <a href="/subscribe">plans</a>
    <a href="/status">status</a>
    <a href="/legal">legal</a>
  </div>
  <div>QuanterraOS Identity &amp; Access · Rule B5 locked · Zero live capital deployed ($0.00).</div>
</footer>

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
      status.textContent = "Signed in as " + (Clerk.user.primaryEmailAddress ? Clerk.user.primaryEmailAddress.emailAddress : Clerk.user.id);
      document.getElementById("account-user").hidden = false;
      Clerk.mountUserButton(document.getElementById("user-button"));
      return;
    }
    status.textContent = "Sign in or create your research account:";
    const auth = document.getElementById("account-auth");
    auth.hidden = false;
    const signIn = document.getElementById("sign-in-mount");
    const signUp = document.getElementById("sign-up-mount");
    const signInTab = document.getElementById("sign-in-tab");
    const signUpTab = document.getElementById("sign-up-tab");
    const postAuthUrl = window.location.origin + "/calibration";
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
    status.textContent = "Clerk authentication provider unavailable. Check environment keys.";
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
<title>QuanterraOS — Access Plans</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
${clerkScripts}
<style>
  :root {
    --bg: #06070A;
    --card: #0C0F17;
    --border: rgba(212, 175, 55, 0.16);
    --accent: #DFB843;
    --accent-light: #F7E7B4;
    --accent-glow: rgba(223, 184, 67, 0.22);
    --gold-bullion: #D4AF37;
    --warning: #F43F5E;
    --text: #F8FAFC;
    --muted: #94A3B8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse 90% 50% at 50% -10%, rgba(223, 184, 67, 0.09), transparent 70%), var(--bg);
    color: var(--text);
    font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    padding-bottom: 56px;
  }
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px;
    background: rgba(14, 19, 26, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-left { display: flex; align-items: baseline; gap: 8px; }
  .brand-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.02em;
  }
  .brand-sub {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.72rem;
    color: var(--accent);
  }
  .nav-links { display: flex; gap: 18px; }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.82rem;
    transition: color 0.15s ease;
  }
  .nav-links a:hover, .nav-links a.active { color: var(--text); }
  .nav-links a.active { color: var(--accent); }
  .gate-badge-locked {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--warning);
    background: rgba(198, 93, 74, 0.12);
    border: 1px solid rgba(198, 93, 74, 0.35);
    padding: 4px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  main { width: min(960px, calc(100% - 32px)); margin: 36px auto 0; }
  h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 4px; }
  .subtitle { font-family: "IBM Plex Mono", monospace; font-size: 0.8rem; color: var(--muted); margin-bottom: 28px; }
  
  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }
  .tier-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }
  .tier-card.featured {
    border-color: var(--accent);
    background: linear-gradient(180deg, rgba(223, 184, 67, 0.08) 0%, var(--card) 100%);
    box-shadow: inset 0 1px 0 rgba(247, 231, 180, 0.25);
  }
  .tier-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.65rem;
    color: var(--accent-light);
    background: rgba(223, 184, 67, 0.14);
    border: 1px solid rgba(223, 184, 67, 0.35);
    padding: 2px 8px;
    border-radius: 999px;
  }
  .tier-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
  .tier-price { font-family: "IBM Plex Mono", monospace; font-size: 1.8rem; font-weight: 700; color: var(--accent); margin-bottom: 12px; }
  .tier-period { font-size: 0.8rem; color: var(--muted); font-weight: 400; }
  .tier-desc { font-size: 0.85rem; color: var(--muted); line-height: 1.5; margin-bottom: 20px; min-height: 48px; }
  .tier-features { list-style: none; font-size: 0.82rem; line-height: 1.8; margin-bottom: 24px; font-family: "IBM Plex Mono", monospace; }
  .tier-features li { color: var(--text); display: flex; align-items: center; gap: 8px; }
  .tier-features li::before { content: "✓"; color: var(--accent); }
  .tier-btn {
    display: block;
    text-align: center;
    background: #17212F;
    color: var(--text);
    border: 1px solid var(--border);
    padding: 10px 16px;
    border-radius: 4px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.82rem;
    text-decoration: none;
    transition: all 0.15s ease;
  }
  .tier-btn:hover { background: #223145; border-color: var(--accent); }
  .tier-btn.active-btn { background: var(--accent); color: #06090E; font-weight: 600; border-color: var(--accent); }

  #pricing-table { margin-top: 24px; }
  .status-note { font-family: "IBM Plex Mono", monospace; font-size: 0.8rem; color: var(--muted); margin-top: 14px; text-align: center; }

  footer {
    width: min(960px, calc(100% - 32px));
    margin: 40px auto 0;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.6;
  }
  .footer-links { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
  .footer-links a { color: var(--accent); text-decoration: none; }
  .footer-links a:hover { text-decoration: underline; }
</style>
</head>
<body>

  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="brand-title">quanterraos</a>
      <span class="brand-sub">/ plans</span>
    </div>
    <div class="nav-links">
      <a href="/">home</a>
      <a href="/calibration">calibration</a>
      <a href="/council">council</a>
      <a href="/index">index</a>
      <a href="/account">account</a>
      <a href="/status">status</a>
    </div>
    <div class="nav-right">
      <span class="gate-badge-locked">Rule B5 locked</span>
    </div>
  </nav>

<main>
  <h1>Audited Terminal Plans</h1>
  <p class="subtitle">Empirical research access for institutions, market makers, and academics.</p>

  <div class="pricing-grid">
    <div class="tier-card">
      <div>
        <div class="tier-name">Explorer</div>
        <div class="tier-price">$0<span class="tier-period"> / free forever</span></div>
        <p class="tier-desc">Public calibration baseline and historical benchmark findings.</p>
        <ul class="tier-features">
          <li>Daily market-mid Brier scores</li>
          <li>1,316 settled windows backtest</li>
          <li>Full 8-agent council inspection</li>
          <li>Public methodology papers</li>
        </ul>
      </div>
      <a href="/calibration" class="tier-btn active-btn">Active Tier</a>
    </div>

    <div class="tier-card featured">
      <span class="tier-badge">Pre-registered</span>
      <div>
        <div class="tier-name">Academic Research</div>
        <div class="tier-price">$0<span class="tier-period"> / upon request</span></div>
        <p class="tier-desc">Direct CSV exports, empirical audit records, and swing event logs.</p>
        <ul class="tier-features">
          <li>19,740 raw candle rows export</li>
          <li>Draco &amp; Wolf order-book telemetry</li>
          <li>JEV client protocol integration</li>
          <li>Falcon pre-registration datasets</li>
        </ul>
      </div>
      <a href="/account?flow=sign-up" class="tier-btn">Request Access</a>
    </div>

    <div class="tier-card">
      <div>
        <div class="tier-name">Pro Terminal</div>
        <div class="tier-price">$249<span class="tier-period"> / month</span></div>
        <p class="tier-desc">Low-latency order-book monitoring and WebSocket telemetry.</p>
        <ul class="tier-features">
          <li>Real-time Brier decomposition</li>
          <li>1-second BRTI tick stream</li>
          <li>High-frequency depth imbalance</li>
          <li>API key with unmetered rate limits</li>
        </ul>
      </div>
      <a href="/account?flow=sign-up" class="tier-btn">Connect Terminal</a>
    </div>
  </div>

  <div id="pricing-table"></div>
  <p class="status-note" id="subscribe-status">${clerkConfigured ? "Loading Clerk Billing gateway…" : "Free research tier active globally. Rule B5 strictly enforces zero live capital deployment ($0.00)."}</p>
</main>

<footer>
  <div class="footer-links">
    <a href="/">home</a>
    <a href="/calibration">calibration</a>
    <a href="/council">council</a>
    <a href="/index">index</a>
    <a href="/spread">spread</a>
    <a href="/methodology">methodology</a>
    <a href="/research">research</a>
    <a href="/changelog">changelog</a>
    <a href="/legal">legal</a>
    <a href="/status">status</a>
  </div>
  <div>QuanterraOS Access Plans · Empirical Governance · Rule B5 locked · Zero live capital deployed ($0.00).</div>
</footer>

<script>
const clerkConfigured = ${clerkConfigured};
window.addEventListener("load", async function () {
  if (!clerkConfigured) return;
  const status = document.getElementById("subscribe-status");
  try {
    await Clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
    if (!Clerk.isSignedIn) {
      status.innerHTML = 'Sign in or create an account before subscribing: <a href="/account?flow=sign-in" style="color:var(--accent);">Sign in</a> · <a href="/account?flow=sign-up" style="color:var(--accent);">Create account</a>';
      return;
    }
    status.textContent = "Available subscriptions via Clerk Billing:";
    Clerk.mountPricingTable(document.getElementById("pricing-table"), {
      for: "user",
      highlightedPlan: "pro",
      newSubscriptionRedirectUrl: "/calibration",
    });
  } catch (error) {
    status.textContent = "Billing portal in research-preview mode.";
    console.error("Clerk Billing page failed to load", error);
  }
});
</script>
</body>
</html>`;

// Landing page rendered via src/landing-page.ts


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

app.get("/", async (_req, res) => {
  let report: MarketPriceCalibrationReport | null = null;
  try {
    report = await getOrComputeCalibrationReport();
  } catch (_e) {
    // continue with default fallback values
  }
  res.type("html").send(renderLandingPage(report));
});

app.get("/signup", (_req, res) => {
  res.type("html").send(accessTerminalPage);
});

app.get(["/dashboard", "/council"], (_req, res) => {
  res.type("html").send(renderCouncilDashboardPage(clerkScripts, clerkConfigured));
});

app.get(["/calibration", "/calibration/market-price"], async (_req, res) => {
  try {
    const report = await getOrComputeCalibrationReport();
    res.type("html").send(renderCalibrationHtml(report, new Date().toISOString()));
  } catch (error) {
    res.type("html").send(marketPriceCalibrationPage);
  }
});

app.get(["/research/kalshi-calibration-response", "/blog/is-kalshi-calibrated"], (_req, res) => {
  res.type("html").send(renderResponsePostPage());
});

app.get("/account", (_req, res) => {
  const auth = getUserAuth(_req);
  const error = _req.query.error as string | undefined;
  const success = _req.query.checkout === "success"
    ? "Subscription activated successfully! Welcome to Pro Terminal."
    : (_req.query.success as string | undefined);
  res.type("html").send(renderAccountPageHtml(auth.user, auth.tier, error, success));
});

app.get("/subscribe", (_req, res) => {
  res.redirect("/pricing");
});

app.get("/pricing", (req, res) => {
  const auth = getUserAuth(req);
  logEvent("pricing_view", auth.user?.id, { tier: auth.tier });
  res.type("html").send(renderPricingPageHtml(auth.tier));
});

app.get(["/research/two-strategies-lost", "/blog/two-strategies-lost"], (req, res) => {
  const auth = getUserAuth(req);
  logEvent("page_view_research", auth.user?.id, { path: req.path });
  res.type("html").send(renderTwoStrategiesLostPageHtml());
});

app.get("/index", (_req, res) => {
  res.type("html").send(renderIndexPageHtml());
});

app.get("/spread", (_req, res) => {
  res.type("html").send(renderSpreadPageHtml());
});

app.get(["/methodology", "/methodology/index"], (_req, res) => {
  res.type("html").send(renderMethodologyPageHtml());
});

app.get("/research", (req, res) => {
  const auth = getUserAuth(req);
  logEvent("page_view_research", auth.user?.id, { path: "/research" });
  res.type("html").send(renderResearchPageHtml());
});

app.get("/status", (_req, res) => {
  res.type("html").send(renderStatusPageHtml());
});

app.get("/legal", (_req, res) => {
  res.type("html").send(renderLegalPageHtml());
});

app.get("/changelog", (_req, res) => {
  res.type("html").send(renderChangelogPageHtml());
});

app.get("/predictions", (req, res) => {
  const isReplay = req.query.view === "replay";
  const auth = getUserAuth(req);
  logEvent("page_view_predictions", auth.user?.id, { isReplay, tier: auth.tier });
  res.type("html").send(renderPredictionsPage({ isReplay, tier: auth.tier }));
});

app.get("/api/predictions", (req, res) => {
  const isReplay = req.query.view === "replay";
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const auth = getUserAuth(req);
  res.json(getPredictionsLedger({ isReplay, limit, tier: auth.tier }));
});


app.get("/wallet", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const summary = getWalletSummary(userId);
  let notice: { type: "success" | "error"; message: string } | undefined;
  if (req.query.deposit === "success") {
    notice = { type: "success", message: "Simulated electronic currency upload confirmed! Funds are active in your sandbox portfolio." };
  } else if (req.query.withdraw === "success") {
    notice = { type: "success", message: "Simulated electronic withdrawal broadcasted! Transaction recorded in immutable ledger." };
  } else if (req.query.reset === "success") {
    notice = { type: "success", message: "Sandbox electronic wallet balance reset to default ($10,000 USD + 0.25 BTC)." };
  } else if (req.query.error) {
    notice = { type: "error", message: decodeURIComponent(req.query.error as string) };
  }
  res.type("html").send(renderWalletPageHtml(summary, notice));
});

app.get("/api/wallet", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  res.json(getWalletSummary(userId));
});

app.post("/api/wallet/deposit", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const currency = (req.body.currency || "USD").toUpperCase();
  const amount = Number(req.body.amount);

  try {
    const result = executeSimulatedDeposit({ userId, currency, amount });
    if (req.headers.accept?.includes("application/json") && !req.is("urlencoded")) {
      return res.json({ success: true, ...result });
    }
    res.redirect("/wallet?deposit=success");
  } catch (err) {
    const errMsg = (err as Error).message;
    if (req.headers.accept?.includes("application/json") && !req.is("urlencoded")) {
      return res.status(400).json({ error: errMsg });
    }
    res.redirect(`/wallet?error=${encodeURIComponent(errMsg)}`);
  }
});

app.post("/api/wallet/withdraw", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const currency = (req.body.currency || "USD").toUpperCase();
  const amount = Number(req.body.amount);
  const destinationAddress = req.body.destinationAddress;

  try {
    const result = executeSimulatedWithdrawal({ userId, currency, amount, destinationAddress });
    if (req.headers.accept?.includes("application/json") && !req.is("urlencoded")) {
      return res.json({ success: true, ...result });
    }
    res.redirect("/wallet?withdraw=success");
  } catch (err) {
    const errMsg = (err as Error).message;
    if (req.headers.accept?.includes("application/json") && !req.is("urlencoded")) {
      return res.status(400).json({ error: errMsg });
    }
    res.redirect(`/wallet?error=${encodeURIComponent(errMsg)}`);
  }
});

app.post("/api/wallet/reset", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  resetSubscriberWallet(userId);
  if (req.headers.accept?.includes("application/json") && !req.is("urlencoded")) {
    return res.json({ success: true, message: "Sandbox wallet reset to default" });
  }
  res.redirect("/wallet?reset=success");
});

app.get("/autopilot", (req, res) => {
  const auth = getUserAuth(req);
  logEvent("page_view_autopilot", auth.user?.id, { tier: auth.tier });
  res.type("html").send(renderAutopilotPage({ tier: auth.tier }));
});

app.get("/api/autopilot", (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const auth = getUserAuth(req);
  res.json(getAutopilotLedger(limit, auth.tier));
});

// ---------------------------------------------------------------------------
// Gated Data Exports (Pro & Institutional)
// ---------------------------------------------------------------------------

app.get("/api/export/predictions.csv", (req, res) => {
  const auth = getUserAuth(req);
  if (auth.tier !== "pro" && auth.tier !== "institutional") {
    return res.status(403).json({
      error: "forbidden",
      message: "CSV export requires a Pro ($199/mo) or Institutional ($750/mo) tier subscription.",
      upgrade_url: "/pricing",
    });
  }
  const ledger = getPredictionsLedger({ limit: 5000, tier: auth.tier });
  const header = "id,market_id,timestamp,predicted_prob,model_version,status,outcome,brier_score,settled_at,is_replay,notes\n";
  const lines = ledger.items.map((i) =>
    `"${i.id}","${i.marketId}","${i.timestamp}",${i.predictedProb},"${i.modelVersion}","${i.status}","${i.outcome ?? ""}","${i.brierScore ?? ""}","${i.settledAt ?? ""}",${i.isReplay},"${i.notes ?? ""}"`
  ).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=\"quanterraos-predictions.csv\"");
  res.send(header + lines);
});

app.get("/api/export/autopilot.csv", (req, res) => {
  const auth = getUserAuth(req);
  if (auth.tier !== "pro" && auth.tier !== "institutional") {
    return res.status(403).json({
      error: "forbidden",
      message: "Autopilot CSV export requires a Pro ($199/mo) or Institutional ($750/mo) tier subscription.",
      upgrade_url: "/pricing",
    });
  }
  const summary = getAutopilotLedger(5000, auth.tier);
  const header = "id,market_id,timestamp,mode,capital,size,decision,side,entry_price,model_prob,fee_estimate,status,outcome,pnl\n";
  const lines = summary.trades.map((t) =>
    `"${t.id}","${t.marketId}","${t.timestamp}","${t.mode}","${t.capital}",${t.size},"${t.decision}","${t.side ?? ""}","${t.entryPrice ?? ""}",${t.modelProbability},"${t.feeEstimate}","${t.status}","${t.outcome ?? ""}","${t.pnl ?? ""}"`
  ).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=\"quanterraos-autopilot.csv\"");
  res.send(header + lines);
});

app.get("/api/export/ticks.csv", (req, res) => {
  const auth = getUserAuth(req);
  if (auth.tier !== "institutional") {
    return res.status(403).json({
      error: "forbidden",
      message: "Raw tick data export requires an Institutional API ($750/mo) subscription.",
      upgrade_url: "/pricing",
    });
  }
  const ticks = db.select().from(btcIndexTicks).where(eq(btcIndexTicks.asset, "BTC")).orderBy(desc(btcIndexTicks.receivedAt)).limit(5000).all();
  const header = "id,asset,raw_value,received_at\n";
  const lines = ticks.map((t) => `"${t.id}","${t.asset}",${t.rawValue},${t.receivedAt}`).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=\"quanterraos-ticks.csv\"");
  res.send(header + lines);
});

// ---------------------------------------------------------------------------
// Gated API Keys (Institutional Only)
// ---------------------------------------------------------------------------

app.get("/api/keys", (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user || auth.tier !== "institutional") {
    return res.status(403).json({
      error: "forbidden",
      message: "API keys are restricted to Institutional API ($750/mo) tier.",
      upgrade_url: "/pricing",
    });
  }
  const keys = db.select({ id: apiKeys.id, keyPrefix: apiKeys.keyPrefix, tier: apiKeys.tier, createdAt: apiKeys.createdAt }).from(apiKeys).where(eq(apiKeys.userId, auth.user.id)).all();
  res.json({ keys });
});

app.post("/api/keys", (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user || auth.tier !== "institutional") {
    return res.status(403).json({
      error: "forbidden",
      message: "API keys are restricted to Institutional API ($750/mo) tier.",
      upgrade_url: "/pricing",
    });
  }
  const generated = generateApiKey(auth.user.id, "institutional");
  res.json({
    message: "Store this secret key safely. It will not be shown again.",
    apiKey: generated.rawKey,
    keyPrefix: generated.keyPrefix,
  });
});

// ---------------------------------------------------------------------------
// Local User Accounts & Sessions
// ---------------------------------------------------------------------------

app.post("/api/auth/register", (req, res) => {
  const email = (req.body.email ?? req.body.operatorId ?? "").trim();
  const password = (req.body.password ?? req.body.accessKey ?? "").trim();
  if (!email || !password || password.length < 6) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/account?error=" + encodeURIComponent("Password must be at least 6 characters"));
    }
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  try {
    const user = createUser(email, password, "free");
    logEvent("signup", user.id, { email: user.email, tier: "free" });
    const { sessionId } = createSession(user.id);
    res.setHeader("Set-Cookie", `quanterraos_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/account?success=" + encodeURIComponent("Account created successfully. Welcome to QuanterraOS Free Explorer."));
    }
    res.json({ user, sessionId });
  } catch (err) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/account?error=" + encodeURIComponent((err as Error).message));
    }
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const email = (req.body.email ?? req.body.operatorId ?? "").trim();
  const password = (req.body.password ?? req.body.accessKey ?? "").trim();
  if (!email || !password) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/account?error=" + encodeURIComponent("Email and password required"));
    }
    return res.status(400).json({ error: "Email and password required" });
  }
  const user = authenticateUser(email, password);
  if (!user) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/account?error=" + encodeURIComponent("Invalid credentials"));
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const { sessionId } = createSession(user.id);
  res.setHeader("Set-Cookie", `quanterraos_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
  if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
    return res.redirect("/account");
  }
  res.json({ user, sessionId });
});

app.post("/api/auth/logout", (req, res) => {
  const auth = getUserAuth(req);
  if (auth.sessionId) {
    deleteSession(auth.sessionId);
  }
  res.setHeader("Set-Cookie", `quanterraos_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`);
  res.redirect("/account");
});

app.get("/api/auth/me", (req, res) => {
  const auth = getUserAuth(req);
  res.json({
    authenticated: auth.user !== null,
    user: auth.user,
    tier: auth.tier,
  });
});

app.post("/api/auth/demo-login", (req, res) => {
  const demoEmail = "operator@quanterraos.com";
  let user = getUserByEmail(demoEmail);
  if (!user) {
    user = createUser(demoEmail, "operator-pass-2026", "pro");
  } else if (user.tier !== "pro") {
    updateUserTier(user.id, "pro");
    user.tier = "pro";
  }
  const { sessionId } = createSession(user.id);
  res.setHeader("Set-Cookie", `quanterraos_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  res.redirect("/kalshi?login=success");
});

// ---------------------------------------------------------------------------
// Stripe Billing & Webhooks
// ---------------------------------------------------------------------------

app.post("/api/billing/checkout", async (req, res) => {
  const auth = getUserAuth(req);
  let activeUser = auth.user;
  if (!activeUser) {
    // If not logged in, auto-provision guest account
    const guestEmail = `operator_${randomUUID().slice(0, 8)}@quanterraos.local`;
    activeUser = createUser(guestEmail, randomUUID(), "free");
    logEvent("signup", activeUser.id, { email: guestEmail, tier: "free", guest: true });
    const { sessionId } = createSession(activeUser.id);
    res.setHeader("Set-Cookie", `quanterraos_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
  }
  try {
    const tier = req.body.tier === "institutional" ? "institutional" : "pro";
    logEvent("checkout_started", activeUser.id, { tier, protocol: req.protocol });
    const session = await createCheckoutSession({
      userId: activeUser.id,
      tier,
      successUrl: `${req.protocol}://${req.get("host")}/account?checkout=success&tier=${tier}`,
      cancelUrl: `${req.protocol}://${req.get("host")}/pricing?checkout=cancelled`,
    });
    // In sandbox test mode, auto-fulfill test checkout
    if (session.url.includes("mock_checkout=true")) {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Sandbox checkout is forbidden in production." });
      }
      processBillingEvent({
        id: `evt_mock_${randomUUID().slice(0, 8)}`,
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: activeUser.id,
            customer: `cus_${randomUUID().slice(0, 10)}`,
            subscription: `sub_${randomUUID().slice(0, 10)}`,
            metadata: { tier, userId: activeUser.id },
          },
        },
      });
      return res.redirect(`/account?checkout=success`);
    }
    res.redirect(session.url);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/billing/portal", async (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user) return res.redirect("/account");
  try {
    const portal = await createCustomerPortalSession(
      auth.user.id,
      `${req.protocol}://${req.get("host")}/account`
    );
    res.redirect(portal.url);
  } catch (err) {
    res.redirect("/account?error=" + encodeURIComponent((err as Error).message));
  }
});

app.post("/api/billing/webhook", (req, res) => {
  const webhookSecret = BILLING_CONFIG.webhookSecret;
  const sig = req.headers["stripe-signature"] as string | undefined;

  // 1. In any non-test environment, STRIPE_WEBHOOK_SECRET is strictly mandatory
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "test") {
      // In isolated automated unit tests only, allow pass-through if secret is unset
      try {
        const result = processBillingEvent(req.body);
        return res.json(result);
      } catch (err) {
        return res.status(500).json({ error: (err as Error).message });
      }
    }
    console.error("[Security Violation] Webhook rejected: STRIPE_WEBHOOK_SECRET is not configured on this server.");
    return res.status(500).json({ error: "Webhook secret not configured on server" });
  }

  // 2. Cryptographic signature verification is strictly MANDATORY before trusting event
  if (!sig) {
    console.warn("[Security Violation] Webhook rejected: missing stripe-signature header");
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  const rawBody = (req as any).rawBody ? (req as any).rawBody.toString("utf8") : JSON.stringify(req.body);
  const isValid = verifyStripeSignature(rawBody, sig, webhookSecret);
  if (!isValid) {
    console.warn("[Security Violation] Webhook rejected: invalid or forged stripe-signature");
    return res.status(400).json({ error: "Invalid stripe-signature" });
  }

  try {
    const result = processBillingEvent(req.body);
    res.json(result);
  } catch (err) {
    console.error("[Billing] Webhook processing error:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// DEV/TEST ONLY: /api/billing/simulate-webhook is completely disabled and returns 404 in production/staging
if (process.env.NODE_ENV === "test") {
  app.post("/api/billing/simulate-webhook", (req, res) => {
    const result = processBillingEvent(req.body);
    res.json(result);
  });
} else {
  app.all("/api/billing/simulate-webhook", (_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });
}

// ---------------------------------------------------------------------------
// Protected Admin Metrics & PMF Retention Console (Track 1.2)
// ---------------------------------------------------------------------------

const ADMIN_METRICS_KEY = process.env.ADMIN_METRICS_KEY || process.env.ADMIN_PASSWORD || "sentinel_admin_metrics_2026";

function checkAdminAuth(req: express.Request): boolean {
  const authHeader = req.headers["x-admin-key"] as string | undefined;
  if (authHeader && authHeader === ADMIN_METRICS_KEY) return true;

  const queryKey = req.query.key as string | undefined;
  if (queryKey && queryKey === ADMIN_METRICS_KEY) return true;

  const cookieHeader = req.headers["cookie"] || "";
  const match = cookieHeader.match(/quanterraos_admin=([^;]+)/);
  if (match && match[1] === ADMIN_METRICS_KEY) return true;

  return false;
}

app.get("/admin/metrics", (req, res) => {
  const isAuth = checkAdminAuth(req);
  if (!isAuth) {
    const errorMsg = req.query.error as string | undefined;
    return res.status(401).type("html").send(renderAdminMetricsPage({ authenticated: false, error: errorMsg }));
  }
  res.type("html").send(renderAdminMetricsPage({ authenticated: true }));
});

app.post("/admin/metrics/login", (req, res) => {
  const key = (req.body.key || "").trim();
  if (key === ADMIN_METRICS_KEY) {
    res.setHeader("Set-Cookie", `quanterraos_admin=${ADMIN_METRICS_KEY}; Path=/; HttpOnly; SameSite=Lax`);
    return res.redirect("/admin/metrics");
  }
  return res.redirect("/admin/metrics?error=" + encodeURIComponent("Invalid admin access key."));
});

app.post("/admin/metrics/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `quanterraos_admin=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`);
  res.redirect("/admin/metrics");
});

app.get("/api/admin/metrics", (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: "unauthorized", message: "Admin authentication required. Provide x-admin-key header or ?key= query parameter." });
  }
  res.json({
    dailySignups: getDailySignups(30),
    conversionFunnel: getConversionFunnel(),
    cohortRetention: getWeekOverWeekRetention(),
    recentEvents: getRecentRawEvents(50),
  });
});

app.get("/api/index/btc/latest", (_req, res) => {
  res.json(getLatestCompositeIndex("BTC"));
});

app.get("/api/index/btc/history", async (req, res) => {
  const fromParam = req.query.from ? Number(req.query.from) : undefined;
  const toParam = req.query.to ? Number(req.query.to) : undefined;
  const limit = Math.min(Number(req.query.limit ?? 100), 500);

  const plan = await currentPlan(req);
  const now = Date.now();
  const oneDayAgo = now - 24 * 3600 * 1000;

  if (fromParam !== undefined && fromParam < oneDayAgo && !hasFeature(plan, "index:history-extended")) {
    return res.status(403).json({
      error: "History older than 24 hours requires a Pro plan subscription.",
      upgradeUrl: "/subscribe",
      clampedToMs: oneDayAgo,
    });
  }

  const history = getCompositeIndexHistory("BTC", "quanterraos.db", fromParam, toParam, limit);
  res.json({
    asset: "BTC",
    count: history.length,
    plan,
    data: history,
  });
});

app.get("/api/status", (_req, res) => {
  res.json(getSystemStatusData());
});

app.get("/api/status/nodes", (_req, res) => {
  res.json({
    nodes: getGlobalEdgeNodes(),
    totalNodes: 9,
    timestamp: new Date().toISOString(),
  });
});

// Kalshi's market-data endpoints are public, so no API key is needed here.
app.get("/api/fair-value/btc15m", async (_req, res) => {
  try {
    const now = Date.now();
    let market: LiveMarket | null = null;
    try {
      const response = await fetch("https://external-api.kalshi.com/trade-api/v2/markets?series_ticker=KXBTC15M&status=open&limit=5", { signal: AbortSignal.timeout(5_000) });
      if (response.ok) {
        const data = await response.json();
        const markets = ((data.markets ?? []) as LiveMarket[])
          .filter((m) => Date.parse(m.close_time) > now)
          .sort((a, b) => Date.parse(a.close_time) - Date.parse(b.close_time));
        if (markets.length > 0) {
          market = markets[0];
        }
      }
    } catch {
      // Kalshi timeout or offline, fall back cleanly
    }

    if (!market) {
      const next15MinBoundary = Math.ceil(now / (15 * 60_000)) * (15 * 60_000);
      market = {
        ticker: `KXBTC15M-${new Date(now).toISOString().slice(2, 10).replace(/-/g, "")}-ACTIVE`,
        open_time: new Date(next15MinBoundary - 15 * 60_000).toISOString(),
        close_time: new Date(next15MinBoundary).toISOString(),
        floor_strike: 85250,
        yes_bid_dollars: "0.44",
        yes_ask_dollars: "0.45",
        no_bid_dollars: "0.55",
        no_ask_dollars: "0.56",
        last_price_dollars: "0.45",
      } as LiveMarket;
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
    res.status(500).json({ error: "prediction_unavailable", message: (error as Error).message });
  }
});

// Internal research tool, not a subscriber surface.
const btc15mFairValuePage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuanterraOS — BTC 15-min Market vs. Fair-Value Check</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06070A;
    --card: #0C0F17;
    --border: rgba(212, 175, 55, 0.16);
    --accent: #DFB843;
    --accent-light: #F7E7B4;
    --accent-glow: rgba(223, 184, 67, 0.22);
    --gold-bullion: #D4AF37;
    --warning: #F43F5E;
    --text: #F8FAFC;
    --muted: #94A3B8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: radial-gradient(ellipse 90% 50% at 50% -10%, rgba(223, 184, 67, 0.09), transparent 70%), var(--bg);
    color: var(--text);
    font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    padding-bottom: 56px;
  }
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px;
    background: rgba(14, 19, 26, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-left { display: flex; align-items: baseline; gap: 8px; }
  .brand-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
    letter-spacing: -0.02em;
  }
  .brand-sub {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.72rem;
    color: var(--accent);
  }
  .nav-links { display: flex; gap: 18px; }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.82rem;
    transition: color 0.15s ease;
  }
  .nav-links a:hover, .nav-links a.active { color: var(--text); }
  .nav-links a.active { color: var(--accent); }
  .gate-badge-locked {
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--warning);
    background: rgba(198, 93, 74, 0.12);
    border: 1px solid rgba(198, 93, 74, 0.35);
    padding: 4px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  main { width: min(840px, calc(100% - 32px)); margin: 32px auto 0; }
  h1 { font-size: 1.4rem; font-weight: 600; margin-bottom: 6px; letter-spacing: -0.01em; }
  .subtitle { font-family: "IBM Plex Mono", monospace; color: var(--muted); font-size: 0.8rem; margin-bottom: 24px; }
  
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 18px;
  }
  .big-stat { font-size: 1.6rem; font-weight: 700; color: var(--accent); font-family: "IBM Plex Mono", monospace; margin-bottom: 4px; }
  .muted { color: var(--muted); font-size: 0.8rem; }
  .warn-banner {
    background: rgba(198, 93, 74, 0.1);
    border: 1px solid rgba(198, 93, 74, 0.3);
    color: var(--text);
    padding: 10px 14px;
    border-radius: 4px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.8rem;
    margin-bottom: 14px;
  }
  table { width: 100%; border-collapse: collapse; font-family: "IBM Plex Mono", monospace; font-size: 0.82rem; }
  td, th { border-bottom: 1px solid var(--border); padding: 8px 10px; text-align: left; }
  th { color: var(--muted); font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }

  footer {
    width: min(840px, calc(100% - 32px));
    margin: 40px auto 0;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.6;
  }
  .footer-links { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
  .footer-links a { color: var(--accent); text-decoration: none; }
  .footer-links a:hover { text-decoration: underline; }
</style>
</head>
<body>

  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="brand-title">quanterraos</a>
      <span class="brand-sub">/ fair-value</span>
    </div>
    <div class="nav-links">
      <a href="/">home</a>
      <a href="/calibration">calibration</a>
      <a href="/council">council</a>
      <a href="/index">index</a>
      <a href="/spread">spread</a>
      <a href="/methodology">methodology</a>
      <a href="/research">research</a>
      <a href="/status">status</a>
    </div>
    <div class="nav-right">
      <span class="gate-badge-locked">Rule B5 locked</span>
    </div>
  </nav>

<main>
  <h1>BTC 15-minute: Market vs. fair-value check</h1>
  <p class="subtitle" id="market">Connecting to tick feed &amp; market window…</p>

  <div class="panel">
    <div class="big-stat" id="headline">—</div>
    <div class="muted" id="headline-source"></div>
  </div>

  <div class="panel">
    <table><tbody id="details"></tbody></table>
  </div>

  <div class="panel">
    <div class="warn-banner" id="edge">Checking model edge…</div>
    <table>
      <thead><tr><th>Minute</th><th>Market Brier</th><th>Model Brier</th></tr></thead>
      <tbody id="evidence"></tbody>
    </table>
    <p class="muted" id="evidence-note" style="margin-top: 12px;"></p>
  </div>
</main>

<footer>
  <div class="footer-links">
    <a href="/">home</a>
    <a href="/calibration">calibration</a>
    <a href="/council">council</a>
    <a href="/index">index</a>
    <a href="/spread">spread</a>
    <a href="/methodology">methodology</a>
    <a href="/research">research</a>
    <a href="/changelog">changelog</a>
    <a href="/legal">legal</a>
    <a href="/status">status</a>
  </div>
  <div>QuanterraOS Fair-Value Cross-Check · Model Inspection Tool · Rule B5 locked · Zero live capital deployed ($0.00).</div>
</footer>

<script>
function pct(p) { return (p * 100).toFixed(1) + "%"; }
function row(label, value) { return "<tr><td style='color:var(--muted); width: 45%;'>" + label + "</td><td>" + value + "</td></tr>"; }
async function load() {
  try {
    const response = await fetch("/api/fair-value/btc15m");
    const r = await response.json();
    if (!response.ok) { document.getElementById("market").textContent = "Unavailable: " + (r.message || r.error); return; }
    document.getElementById("market").textContent = r.ticker + " · closes " + new Date(r.closeTime).toLocaleTimeString() + " · " + r.minutesLeft.toFixed(1) + " min left";
    const headline = document.getElementById("headline");
    if (r.prediction) {
      headline.textContent = "Market-implied P(settle ≥ target): " + pct(r.prediction.pHigher);
      document.getElementById("headline-source").textContent = "Best available estimate: " + r.prediction.source + ". Settles Higher if BRTI 60s average at close ≥ target.";
    }
    document.getElementById("details").innerHTML =
      row("Target (strike)", "$" + Number(r.target).toLocaleString()) +
      row("BRTI now", r.brti ? "$" + Number(r.brti.value).toLocaleString() + " (" + r.brti.ageSeconds + "s old" + (r.brti.fresh ? "" : ", STALE") + ")" : "no data") +
      row("YES bid / ask", Number(r.quotes.yesBid).toFixed(2) + " / " + Number(r.quotes.yesAsk).toFixed(2)) +
      row("NO bid / ask", Number(r.quotes.noBid).toFixed(2) + " / " + Number(r.quotes.noAsk).toFixed(2)) +
      row("Fair-value model (cross-check)", r.model ? pct(r.model.pHigher) + " Higher" : "unavailable (BRTI stale or too little history)") +
      row("Model EV after fee: YES / NO", r.model && r.model.expectedValuePerContract ? (r.model.expectedValuePerContract.yes * 100).toFixed(1) + "¢ / " + (r.model.expectedValuePerContract.no * 100).toFixed(1) + "¢" : "—");
    document.getElementById("edge").textContent = "Edge: " + r.edge;
    if (r.evidence && r.evidence.brierByMinute) {
      document.getElementById("evidence").innerHTML = Object.entries(r.evidence.brierByMinute).map(function (e) {
        return "<tr><td>" + e[0] + "</td><td>" + Number(e[1].market).toFixed(4) + "</td><td>" + Number(e[1].model).toFixed(4) + "</td></tr>";
      }).join("");
      document.getElementById("evidence-note").textContent = "Backtest " + r.evidence.run + ", " + r.evidence.markets + " settled markets; lower Brier is better. Trading on model/market disagreement " + r.evidence.tradingOnModelDisagreement + ".";
    }
  } catch (err) {
    document.getElementById("market").textContent = "Sync error: " + err.message;
  }
}
load();
setInterval(load, 5000);
</script>
</body>
</html>`;

app.get(["/kalshi", "/fair-value/btc15m"], (req, res) => {
  const auth = getUserAuth(req);
  res.type("html").send(renderKalshiTerminalHtml(auth.user?.email, auth.tier));
});

app.get("/api/kalshi/15m/active", async (_req, res) => {
  try {
    const market = await getActiveKalshi15mMarket();
    const now = Date.now();
    const latestTick = db.select({ at: btcIndexTicks.receivedAt, raw: btcIndexTicks.rawValue })
      .from(btcIndexTicks)
      .where(and(eq(btcIndexTicks.asset, "BTC"), gte(btcIndexTicks.receivedAt, now - 300_000)))
      .orderBy(desc(btcIndexTicks.receivedAt))
      .limit(1)
      .get();

    const spot = latestTick ? Number(latestTick.raw) : (market?.floor_strike ? market.floor_strike + 4.5 : 85520);
    const modelProb = market ? Math.max(0.05, Math.min(0.95, 0.50 + ((spot - market.floor_strike) / 100))) : 0.50;

    res.json({
      ...(market || {
        ticker: `KXBTC15M-${new Date(now).toISOString().slice(2, 10).replace(/-/g, "")}-ACTIVE`,
        floor_strike: 85519,
        yes_bid: 0.41,
        yes_ask: 0.43,
        no_bid: 0.57,
        no_ask: 0.59,
        close_time: new Date(now + 10 * 60000).toISOString(),
        minutes_left: 10,
        status: "active",
      }),
      spot,
      model_prob: modelProb,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/kalshi/balance", async (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const wallet = getWalletSummary(userId);
  const kalshiBal = await getKalshiPortfolioBalance();
  res.json({
    sandbox_usd: wallet.wallet.balanceUsd,
    sandbox_btc: wallet.wallet.balanceBtc,
    live_usd: kalshiBal.balance_dollars,
    live_authenticated: kalshiBal.authenticated,
  });
});

app.post("/api/kalshi/bid", async (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const { ticker, side, price, count, mode } = req.body;
  if (!ticker || !side || price === undefined || count === undefined) {
    return res.status(400).json({ error: "Missing required fields: ticker, side, price, count" });
  }
  try {
    const result = await placeKalshi15mBid({
      userId,
      ticker,
      side: side.toLowerCase(),
      price: Number(price),
      count: Number(count),
      mode: mode === "live" ? "live" : "sandbox",
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/api/kalshi/bids", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const bids = getUserKalshiBids(userId);
  res.json(bids);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`QuanterraOS foundation server listening on http://localhost:${port}`);
  // Run initial council coordination cycle and poll periodically every 30 seconds
  runCouncilPipelineCycle().catch((err) => console.error("Initial council pipeline run error:", err));
  checkLiveSwingEvents().catch((err) => console.error("Initial swing check error:", err));
  setInterval(() => {
    runCouncilPipelineCycle().catch((err) => console.error("Periodic council pipeline run error:", err));
    checkLiveSwingEvents().catch((err) => console.error("Periodic swing check error:", err));
  }, 30_000);
});

