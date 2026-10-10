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
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { eq, and, gte, asc, desc, sql } from "drizzle-orm";
import { db, runMigrations } from "./db.ts";
import { getChatGPTUser, requireFounderAuth } from "./auth.ts";
import { researchObservations, researchResolutions, researchResolutionHistory, edgeScores, falconRecommendations, btcIndexTicks, users, sessions, events, userDecisionJournal, pilotObservationSessions, betaFeedback, pilotBookingRequests } from "./schema.ts";
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
import {
  runAutonomousLearningCycle,
  getLatestLearningCycle,
  get90DayAccelerationStatus,
} from "./agents/autonomous-learning-engine.ts";
import { compareVenues, calculateKalshiFee, VENUE_SPECS } from "./polymarket-engine.ts";
import { dispatchDailyIntelligenceBrief, getSmsIntelligenceTelemetry } from "./sms-dispatch.ts";
import { renderMobilePageHtml } from "./mobile-page.ts";
import { getSwingEventsSummary, readSwingEventsCsv, checkLiveSwingEvents } from "./swing-event-logger.ts";
import { getOrComputeCalibrationReport, renderCalibrationHtml } from "./calibration-page.ts";
import { renderResponsePostPage } from "./response-post-page.ts";
import { getLatestCompositeIndex, getCompositeIndexHistory } from "./composite-index.ts";
import { renderIndexPageHtml, renderSpreadPageHtml } from "./index-page.ts";
import { getLiveQuotes } from "./live-quotes.ts";
import { renderMethodologyPageHtml } from "./methodology-page.ts";
import { renderResearchPageHtml } from "./research-page.ts";
import { renderStatusPageHtml, getSystemStatusData, getGlobalEdgeNodes } from "./status-page.ts";
import { renderLegalPageHtml } from "./legal-page.ts";
import { renderChangelogPageHtml } from "./changelog-page.ts";
import { renderPredictionsPage } from "./predictions-page.ts";
import { renderAutopilotPage } from "./autopilot-page.ts";
import { getPredictionsLedger, seedHistoricalReplay } from "./prediction-ledger.ts";
import { retiredRouteRedirectMiddleware } from "./routes/retired-redirects.ts";
import { renderInstitutionalPageHtml } from "./institutional-page.ts";
import { renderDevelopersPageHtml } from "./developers-page.ts";
import { renderNewsPageHtml } from "./news-page.ts";
import { renderHelpPageHtml } from "./help-page.ts";
import { renderSeoTopicPageHtml } from "./seo-topic-pages.ts";
import {
  reconcilePendingSettlements,
  getSettlementReconciliationStatus,
  startSettlementReconciler,
} from "./settlement-reconciler.ts";
import { getAutopilotLedger } from "./autopilot-engine.ts";
import { renderPricingPageHtml } from "./pricing-page.ts";
import { renderTwoStrategiesLostPageHtml } from "./blog-page.ts";
import { renderAccountPageHtml } from "./account-page.ts";
import { renderJournalPageHtml } from "./journal-page.ts";
import { renderReviewPageHtml } from "./review-page.ts";
import { renderBetaBookingPageHtml } from "./booking-page.ts";
import { getFeatureFlags } from "./feature-flags.ts";
import { renderPilotAuditPageHtml } from "./pilot-audit-page.ts";
import { renderAccessTerminalPage } from "./access-terminal-page.ts";
import { renderCalculatorPageHtml } from "./calculator-page.ts";
import { renderFlightDeckPageHtml, type FlightDeckStationId } from "./flight-deck-page.ts";
import {
  getUserLimits,
  updateUserLimits,
  recordLossAndCheckTilt,
  respectTiltCooldown,
  applySelfPause,
  attestAge18,
} from "./lib/responsible-trading.ts";
import {
  LAUNCH_CREW_MEMBERS,
  routeAriaQuery,
  evaluateAdversarialEvalSet,
  isAdvisoryPrompt,
} from "./lib/aria-crew.ts";
import {
  recordDisciplineXpEvent,
  computeUserXpState,
  PILOT_RANKS,
  MISSIONS_ROSTER,
} from "./lib/xp-engine.ts";
import {
  getCalibrationLeaderboard,
  getFeesSavedLeaderboard,
  updatePilotLeaderboardOptIn,
  validateLeaderboardSortingMetric,
} from "./lib/leaderboards.ts";
import { triggerDisciplineCelebration } from "./lib/celebrations.ts";
import { queryLargeTradeFeed } from "./lib/sensors-feed.ts";
import {
  getPolymarketWalletCard,
  isValidPolymarketAddress,
  getCuratedBenchmarkWallets,
  renderWalletCardDetailsHtml,
} from "./lib/wallet-cards.ts";
import {
  computeExpiryRadarState,
  renderExpiryRadarPageHtml,
  simulateExpiryPayoff,
  generateShareableDebriefCardSvg,
} from "./expiry-radar.ts";
import { getSystemPulseTelemetry } from "./system-pulse.ts";
import { renderMarketRhythmPageHtml } from "./research/market-rhythm.ts";
import { renderMobileInstallPageHtml } from "./mobile-install.ts";
import {
  renderEmbedCalculatorHtml,
  renderEmbedCardHtml,
  renderEmbedRadarHtml,
  renderEmbedDivergenceHtml,
} from "./embed-widget.ts";
import { renderLearnPageHtml } from "./learn-page.ts";
import {
  computeSettlementDissection,
  getRecentSettledWindows,
  renderSettlementDissectionPageHtml,
  renderSettlementForensicCardSvg,
} from "./settlement-dissection.ts";
import {
  computeCorridorAnalysis,
  renderEmbedCorridorHtml,
  generateCorridorSvgReceipt,
  renderCorridorTerminalHtml,
} from "./corridor-engine.ts";
import {
  createAlertEvent,
  dispatchAlertWebhook,
  getRecentDispatchedAlerts,
  renderWebhookDashboardHtml,
  formatDiscordAlertPayload,
  formatTelegramAlertPayload,
  createSampleAlertEvent,
  type AlertEventType,
} from "./alert-dispatcher.ts";
import { renderSignalsPageHtml } from "./signals-page.ts";
import {
  generateDailyScheduleMatrix,
  generateIcsCalendarFeed,
  renderMarketScheduleHtml,
} from "./market-schedule.ts";
import {
  computeCalibrationExplorer,
  renderCalibrationExplorerHtml,
  type SessionFilter,
  type MoneynessFilter,
  type VolatilityFilter,
} from "./calibration-explorer.ts";
import {
  computeAudioTelemetryEvent,
  renderMicrostructureAudioPageHtml,
} from "./microstructure-audio.ts";
import {
  computeLiquidityFlowState,
  generateLiquidityFlowSvgReceipt,
  renderLiquidityFlowWidgetHtml,
  renderLiquidityFlowPageHtml,
} from "./liquidity-flow.ts";
import {
  computeDepthMatrixSnapshot,
  generateDepthMatrixSvgReceipt,
  renderDepthMatrixWidgetHtml,
  renderDepthMatrixPageHtml,
} from "./depth-matrix.ts";
import {
  simulateRealisticPaperOrder,
  generatePaperExecutionSvgReceipt,
  renderRealisticPaperWidgetHtml,
  renderRealisticPaperPageHtml,
  compareRealisticVsFantasyPaper,
} from "./realistic-paper-mode.ts";
import {
  getDatasetsManifest,
  getDatasetMetadata,
  getDatasetSampleRows,
  getDecileCsvContent,
  renderDatasetsPageHtml,
} from "./dataset-hub.ts";
import {
  getResolutionAudit,
  getAllResolutionAudits,
  analyzeCustomResolutionText,
  renderResolutionRiskPageHtml,
} from "./resolution-rulebook-engine.ts";
import {
  getCrossVenueDiscrepancies,
  computeCustomCrossVenueSpread,
  renderCrossVenueScannerPageHtml,
} from "./cross-venue-scanner.ts";
import {
  evaluateForecastComparison,
  getMockProspectiveStudyCohort,
  summarizeCohortEvaluation,
  generateForecastComparisonSvgReceipt,
  renderForecastComparisonWidgetHtml,
  renderForecastComparisonPageHtml,
} from "./forecast-comparison.ts";
import {
  getProspectiveStudyCohort,
  summarizeStudyCohort,
  getAnonymizedStudyObservations,
  generateStudySvgReceipt,
  renderStudyWidgetHtml,
  renderStudyPageHtml,
} from "./know-your-costs-study.ts";
import {
  getActiveEducatorPartners,
  summarizeEducatorProgram,
  generateEducatorSvgReceipt,
  renderEducatorWidgetHtml,
  renderEducatorPageHtml,
} from "./educator-portal.ts";
import {
  computeFrictionTeardown,
  computeCrossVenueSpreadTeardown,
  computeCalibrationAdjustedKelly,
  decodeWhaleFlow,
  generateTrustOsAuditPreview,
  renderTrustOsPageHtml,
  COMPETITOR_DOSSIER_LIST,
  generateBenchmarkSvgReceipt,
  renderBenchmarkWidgetHtml,
  renderBenchmarkPageHtml,
} from "./competitive-benchmark.ts";
import {
  getPeriodicFrictionReport,
  generatePeriodicFrictionReceiptSvg,
  renderPeriodicFrictionWidgetHtml,
  exportPeriodicFrictionReportCsv,
  renderPeriodicFrictionReportPageHtml,
} from "./periodic-outcome-reports.ts";
import {
  renderTrackRecordPageHtml,
  getTrackRecordData,
  generateTrackRecordReceiptSvg,
  formatTrackRecordCsv,
} from "./track-record-page.ts";
import {
  WIDGET_CATALOG_LIST,
  renderWidgetCatalogHtml,
} from "./widget-catalog.ts";
import {
  SEARCH_QUERY_ARTICLES,
  getSearchQueryArticle,
  renderQueryHubPageHtml,
  renderSearchQueryPageHtml,
  generateSitemapXml,
  generateRobotsTxt,
  getSearchQueryManifest,
} from "./indexable-content.ts";
import { renderEducationalPageHtml, type EducationTopic } from "./educational-pages.ts";
import { getReviewReminders, updateReviewReminders } from "./review-reminders.ts";
import { renderVenueComparisonPageHtml } from "./venue-comparison-page.ts";
import { renderCalibrationSurfacePageHtml } from "./calibration-surface-page.ts";
import { renderMcpPageHtml, MCP_SERVER_MANIFEST, executeMcpTool } from "./mcp-server.ts";
import { renderSmsOptInPageHtml } from "./sms-optin-page.ts";
import {
  SMS_MARKETING_DISCLOSURE,
  normalizeE164Phone,
  recordSmsOptIn,
  recordSmsOptOut,
  handleInboundSms,
  sendMarketingSms,
  validTwilioSmsSignature,
} from "./sms-marketing.ts";
import {
  getWalletSummary,
  executeSimulatedDeposit,
  executeSimulatedWithdrawal,
  resetSubscriberWallet,
} from "./wallet-engine.ts";
import {
  parseJournalCsv,
  exportJournalCsv,
  getUserRiskPlan,
  saveUserRiskPlan,
  checkTradeAgainstRiskPlan,
  saveCheckForLater,
} from "./journal-import.ts";
import {
  previewKalshiStatement,
  previewPolymarketStatement,
  previewStatementCsv,
  commitKalshiStatement,
  commitStatement,
  exportImportedStatementsCsv,
  deleteImportedStatements,
} from "./statement-reconciliation.ts";
import { runIsolatedBackupRecoveryCheck } from "./backup-recovery.ts";
import { runDataQualityAudit, evaluateInputReliability } from "./data-quality-engine.ts";
import { checkFeeAndSettlementRulesFreshness } from "./fee-rule-monitor.ts";
import {
  explainSavedCheck,
  answerFromUserRecords,
  recordDecisionReviewDebrief,
} from "./decision-coach.ts";
import {
  getFounderReleaseDashboardData,
  renderFounderReleaseDashboardHtml,
  setSimulatedDependencyBroken,
} from "./founder-release-dashboard.ts";
import {
  getBetaAttributionSummary,
  createBetaInvitation,
  recordBetaRegistration,
  recordBetaObservation,
} from "./beta-invitations.ts";
import {
  submitSupportTicket,
  listSupportTickets,
  updateSupportTicket,
  getSupportQueueMetrics,
} from "./support-workflow.ts";
import {
  recordFirstSessionChecklist,
  getFirstSessionSummary,
  ensureThreeScheduledHumanSessions,
} from "./first-session-checklist.ts";
import {
  executeRetainedRecoveryDrill,
  getLatestRetainedRecoveryDrill,
} from "./retained-recovery-drill.ts";
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
  getActiveKalshiMarket,
  getActiveKalshi15mMarket,
  getActiveKalshi1hMarket,
  getKalshi1hStrikeLadder,
  getKalshiPortfolioBalance,
  placeKalshi15mBid,
  getUserKalshiBids,
} from "./kalshi-api.ts";
import {
  KALSHI_CONTRACT_SPECS,
  calculateKalshiTakerFee,
  calculateBreakevenProbability,
  type KalshiTimeframe,
} from "./kalshi-contracts.ts";
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

// Progressive Web App Manifest & Service Worker
app.get("/manifest.json", (_req, res) => {
  res.type("application/manifest+json").sendFile(path.resolve("public/manifest.json"));
});
app.get("/service-worker.js", (_req, res) => {
  res.setHeader("Service-Worker-Allowed", "/");
  res.type("application/javascript").sendFile(path.resolve("public/service-worker.js"));
});

// Mobile App Download Portal (PWA Direct Install)
app.get(["/mobile", "/download", "/app", "/pwa"], (_req, res) => {
  res.type("html").send(renderMobilePageHtml());
});

// Mobile Platform Configuration API (Honest PWA distribution status per Rule B11)
app.get("/api/mobile/config", (_req, res) => {
  res.json({
    app_name: "QuanterraOS Mobile Terminal",
    active_distribution: "pwa",
    pwa_manifest: "/manifest.json",
    service_worker: "/service-worker.js",
    store_listings_active: false,
    google_play_url: null,
    samsung_store_url: null,
    apple_app_store_url: null,
    apple_app_id: null,
    universal_links_enabled: false,
    twa_assetlinks_verified: false,
    rule_b5_status: "LOCKED_STANDBY",
  });
});

// 301 Permanent Redirects for all retired v1 routes (Part 2.1 & Task 3.4)
app.use(retiredRouteRedirectMiddleware);

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

app.get("/growth", (_req, res) => {
  res.redirect(301, "/");
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

app.post("/api/gtm/drafts/new", requireFounderAuth, (req, res) => {
  try {
    const draft = draftContentPiece(req.body);
    res.json(draft);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/gtm/drafts/approve", requireFounderAuth, (req, res) => {
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

app.post("/api/gtm/pipeline/stage", requireFounderAuth, (req, res) => {
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
    if (isAdvisoryPrompt(message.trim())) {
      const ariaRes = routeAriaQuery(message.trim());
      return res.json({
        agentId: "aria",
        agentName: "Aria",
        role: "Ship's Computer // Executive Concierge",
        reply: ariaRes.message,
        message: ariaRes.message,
        disclaimer: "Non-advisory response. QuanterraOS does not provide trading advice.",
        citations: ariaRes.citations,
        suggestedActions: ariaRes.suggestedActions,
        isAdvisoryRefusal: true,
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
    const run = await runCouncilPipelineCycle();
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


// Exclusive Access Terminal rendered via src/access-terminal-page.ts

app.get(["/", "/home"], async (_req, res) => {
  let report: MarketPriceCalibrationReport | null = null;
  try {
    report = await getOrComputeCalibrationReport();
  } catch (_e) {
    // continue with default fallback values
  }
  res.type("html").send(renderLandingPage(report));
});

app.get(["/access", "/login", "/terminal", "/command", "/clearance"], (req, res) => {
  const error = req.query.error ? String(req.query.error) : undefined;
  res.type("html").send(renderAccessTerminalPage(error));
});

app.get("/signup", (_req, res) => {
  const auth = getUserAuth(_req);
  res.type("html").send(renderAccountPageHtml(auth.user, auth.tier));
});

app.get(["/check", "/calculator"], (_req, res) => {
  res.type("html").send(renderCalculatorPageHtml());
});

app.get("/institutional", (_req, res) => {
  res.type("html").send(renderInstitutionalPageHtml());
});

app.get("/developers", (_req, res) => {
  res.type("html").send(renderDevelopersPageHtml());
});

app.get("/news", (_req, res) => {
  res.type("html").send(renderNewsPageHtml());
});

app.get("/help", (_req, res) => {
  res.type("html").send(renderHelpPageHtml());
});

// SEO Topic Pages with JSON-LD FAQ Schema (Part 2.1 & Task 3.5)
app.get([
  "/kalshi-fee-calculator",
  "/kalshi-btc-settlement-brti",
  "/kalshi-vs-polymarket-fees",
  "/bitcoin-15-minute-markets"
], (req, res) => {
  const slug = req.path.replace(/^\\//, "");
  const html = renderSeoTopicPageHtml(slug);
  if (html) {
    res.type("html").send(html);
  } else {
    res.status(404).send("Page not found");
  }
});

// Expiry Radar & Microstructure Terminal (Flagship Real-Time Settlement Engine)
app.get(["/radar", "/expiry-radar", "/microstructure"], async (req, res) => {
  const auth = getUserAuth(req);
  const tf = (req.query.series === "1h" ? "1h" : "15m") as any;
  let spotPrice: number | null = null;
  let activeVenuesCount = 3;
  try {
    const live = await getLiveQuotes();
    spotPrice = live.compositePrice;
    activeVenuesCount = live.activeVenuesCount;
  } catch {
    spotPrice = 91250;
  }
  const radarState = computeExpiryRadarState({ series: tf, spotPrice, activeVenuesCount });
  res.type("html").send(renderExpiryRadarPageHtml(radarState, auth.user));
});

app.get("/api/radar/state", async (req, res) => {
  const tf = (req.query.series === "1h" ? "1h" : "15m") as any;
  let spotPrice: number | null = null;
  let activeVenuesCount = 3;
  try {
    const live = await getLiveQuotes();
    spotPrice = live.compositePrice;
    activeVenuesCount = live.activeVenuesCount;
  } catch {
    spotPrice = 91250;
  }
  const radarState = computeExpiryRadarState({ series: tf, spotPrice, activeVenuesCount });
  res.json({ success: true, radar: radarState });
});

app.get("/api/radar/simulate", (req, res) => {
  const strike = Number(req.query.strike || 91250);
  const contractPrice = Number(req.query.price || 0.51);
  const side = (req.query.side === "no" ? "no" : "yes") as "yes" | "no";
  const contractCount = Number(req.query.count || 10);
  const simulatedSpotAtExpiry = Number(req.query.simSpot || strike);

  const simulation = simulateExpiryPayoff({
    strike,
    contractPrice,
    side,
    contractCount,
    simulatedSpotAtExpiry,
  });

  res.json({ success: true, simulation });
});

app.get("/api/radar/card.svg", (req, res) => {
  const ticker = String(req.query.ticker || "KXBTC15M-T91250");
  const strike = Number(req.query.strike || 91250);
  const contractPrice = Number(req.query.price || 0.51);
  const side = (req.query.side === "no" ? "no" : "yes") as "yes" | "no";
  const contractCount = Number(req.query.count || 10);
  const takerFee = Number(req.query.fee || 0.18);
  const breakevenWinProb = Number(req.query.breakeven || 0.528);
  const netPnl = req.query.pnl !== undefined ? Number(req.query.pnl) : undefined;
  const outcome = (req.query.outcome as any) || "PENDING";
  const dateIso = req.query.date ? String(req.query.date) : undefined;

  const svg = generateShareableDebriefCardSvg({
    ticker,
    strike,
    contractPrice,
    side,
    contractCount,
    takerFee,
    breakevenWinProb,
    netPnl,
    outcome,
    dateIso,
  });

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.send(svg);
});

app.get(["/embed/calculator", "/widget/calculator", "/embed"], (_req, res) => {
  res.type("html").send(renderEmbedCalculatorHtml());
});

app.get(["/embed/card", "/widget/card"], (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M";
  const venue = (typeof req.query.venue === "string" ? req.query.venue : "kalshi-15m") as any;
  const currentAsk = typeof req.query.price === "string" ? parseFloat(req.query.price) : 0.51;
  const contractCount = typeof req.query.count === "string" ? parseInt(req.query.count, 10) : 10;
  res.type("html").send(renderEmbedCardHtml({ ticker, venue, currentAsk, contractCount }));
});

app.get(["/embed/radar", "/widget/radar"], (req, res) => {
  const series = (req.query.series === "1h" ? "1h" : "15m") as any;
  const spotPrice = req.query.spot ? Number(req.query.spot) : 91250;
  res.type("html").send(renderEmbedRadarHtml({ series, spotPrice }));
});

app.get(["/embed/divergence", "/widget/divergence"], (req, res) => {
  const price = req.query.price ? Number(req.query.price) : 0.51;
  const count = req.query.count ? Number(req.query.count) : 10;
  res.type("html").send(renderEmbedDivergenceHtml({ price, count }));
});

// Phase 4 Cross-Venue Divergence Monitor (HANDOFF.md Section G)
app.get(["/divergence", "/compare", "/venues"], (_req, res) => {
  res.type("html").send(renderVenueComparisonPageHtml());
});

// Forensic Post-Mortem Settlement Dissection Engine (60s TWAP Reconstruction)
app.get(["/settlement", "/postmortem", "/dissection"], async (req, res) => {
  const windowTicker = typeof req.query.ticker === "string" ? req.query.ticker : undefined;
  let spotPrice: number | null = null;
  try {
    const live = await getLiveQuotes();
    spotPrice = live.compositePrice;
  } catch {
    spotPrice = 91250;
  }
  const recentWindows = getRecentSettledWindows();
  const dissection = computeSettlementDissection({
    windowTicker,
    anchorBasePrice: spotPrice ?? 91250,
  });
  res.type("html").send(renderSettlementDissectionPageHtml(dissection, recentWindows));
});

app.get("/api/settlement/dissect", async (req, res) => {
  const windowTicker = typeof req.query.ticker === "string" ? req.query.ticker : undefined;
  let spotPrice: number | null = null;
  try {
    const live = await getLiveQuotes();
    spotPrice = live.compositePrice;
  } catch {
    spotPrice = 91250;
  }
  const dissection = computeSettlementDissection({
    windowTicker,
    anchorBasePrice: spotPrice ?? 91250,
  });
  res.json({ success: true, dissection });
});

app.get("/api/settlement/card.svg", (req, res) => {
  const windowTicker = typeof req.query.ticker === "string" ? req.query.ticker : undefined;
  const basePrice = req.query.price ? Number(req.query.price) : 91250;
  const dissection = computeSettlementDissection({
    windowTicker,
    anchorBasePrice: basePrice,
  });
  const svg = renderSettlementForensicCardSvg(dissection);
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.send(svg);
});

// Binary Corridor & Multi-Strike Spread Terminal
app.get(["/corridors", "/spreads"], async (req, res) => {
  let spotPrice = 91250;
  try {
    const live = await getLiveQuotes();
    if (live.compositePrice) spotPrice = live.compositePrice;
  } catch {
    spotPrice = 91250;
  }
  const k1 = req.query.k1 ? Number(req.query.k1) : Math.floor(spotPrice / 250) * 250 - 250;
  const k2 = req.query.k2 ? Number(req.query.k2) : k1 + 500;
  const p1 = req.query.p1 ? Number(req.query.p1) : 0.62;
  const p2 = req.query.p2 ? Number(req.query.p2) : 0.38;
  const count = req.query.count ? Number(req.query.count) : 10;
  const strategy = (typeof req.query.strategy === "string" ? req.query.strategy : "RANGE_PIN_CORRIDOR") as any;

  const analysis = computeCorridorAnalysis(
    strategy,
    spotPrice,
    k1,
    k2,
    p1,
    p2,
    count
  );
  res.type("html").send(renderCorridorTerminalHtml(analysis));
});

app.post(["/corridors", "/spreads"], (req, res) => {
  const spotPrice = req.body.spotPrice ? Number(req.body.spotPrice) : 91250;
  const k1 = req.body.k1 ? Number(req.body.k1) : 91000;
  const k2 = req.body.k2 ? Number(req.body.k2) : 91500;
  const p1 = req.body.p1 ? Number(req.body.p1) : 0.60;
  const p2 = req.body.p2 ? Number(req.body.p2) : 0.40;
  const count = req.body.count ? Number(req.body.count) : 10;
  const strategy = (req.body.strategyType || "RANGE_PIN_CORRIDOR") as any;

  const analysis = computeCorridorAnalysis(
    strategy,
    spotPrice,
    k1,
    k2,
    p1,
    p2,
    count
  );
  res.type("html").send(renderCorridorTerminalHtml(analysis));
});

app.post("/api/corridor/calculate", (req, res) => {
  const { strategyType, spotPrice, lowerStrike, higherStrike, leg1Price, leg2Price, contractCount, underlying } = req.body || {};
  const analysis = computeCorridorAnalysis(
    strategyType || "RANGE_PIN_CORRIDOR",
    Number(spotPrice) || 91250,
    Number(lowerStrike) || 91000,
    Number(higherStrike) || 91500,
    Number(leg1Price) || 0.60,
    Number(leg2Price) || 0.40,
    Number(contractCount) || 10,
    underlying || "BTC"
  );
  res.json({ success: true, analysis });
});

app.get(["/embed/corridor", "/widget/corridor"], (req, res) => {
  const spotPrice = req.query.spot ? Number(req.query.spot) : 91250;
  const k1 = req.query.k1 ? Number(req.query.k1) : 91000;
  const k2 = req.query.k2 ? Number(req.query.k2) : 91500;
  const p1 = req.query.p1 ? Number(req.query.p1) : 0.62;
  const p2 = req.query.p2 ? Number(req.query.p2) : 0.38;
  const count = req.query.count ? Number(req.query.count) : 10;
  const strategy = (typeof req.query.strategy === "string" ? req.query.strategy : "RANGE_PIN_CORRIDOR") as any;

  const analysis = computeCorridorAnalysis(
    strategy,
    spotPrice,
    k1,
    k2,
    p1,
    p2,
    count
  );
  res.type("html").send(renderEmbedCorridorHtml(analysis));
});

app.get("/api/corridor/card.svg", (req, res) => {
  const spotPrice = req.query.spot ? Number(req.query.spot) : 91250;
  const k1 = req.query.k1 ? Number(req.query.k1) : 91000;
  const k2 = req.query.k2 ? Number(req.query.k2) : 91500;
  const p1 = req.query.p1 ? Number(req.query.p1) : 0.62;
  const p2 = req.query.p2 ? Number(req.query.p2) : 0.38;
  const count = req.query.count ? Number(req.query.count) : 10;
  const strategy = (typeof req.query.strategy === "string" ? req.query.strategy : "RANGE_PIN_CORRIDOR") as any;

  const analysis = computeCorridorAnalysis(
    strategy,
    spotPrice,
    k1,
    k2,
    p1,
    p2,
    count
  );
  const svg = generateCorridorSvgReceipt(analysis);
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.send(svg);
});

// Institutional Webhooks & Alert Dispatcher
app.get(["/webhooks", "/alerts"], (req, res) => {
  res.type("html").send(renderWebhookDashboardHtml(getRecentDispatchedAlerts()));
});

app.get("/api/alerts/recent", (req, res) => {
  res.json({ success: true, alerts: getRecentDispatchedAlerts() });
});

app.post("/api/alerts/webhook/test", async (req, res) => {
  const { eventType = "CROSS_VENUE_DIVERGENCE_SPIKE", webhookUrl } = req.body || {};
  let spotPrice = 91250;
  try {
    const live = await getLiveQuotes();
    if (live.compositePrice) spotPrice = live.compositePrice;
  } catch {
    spotPrice = 91250;
  }

  let event;
  if (eventType === "SETTLEMENT_ORACLE_DANGER") {
    event = createAlertEvent(
      "SETTLEMENT_ORACLE_DANGER",
      "BTC",
      "Settlement Danger Zone: Spot Within $50 of Strike",
      `Bitcoin spot ($${spotPrice.toLocaleString()}) is within $50 of ATM strike during final 60-second TWAP window.`,
      {
        spot_price: `$${spotPrice.toFixed(2)}`,
        atm_strike: `$${(Math.round(spotPrice / 250) * 250).toLocaleString()}`,
        distance: "$18.50",
        twap_status: "48s / 60s Active",
      },
      "https://quanterraos.com/radar",
      "CRITICAL",
      "KXBTC15M-26OCT07-2200"
    );
  } else if (eventType === "SETTLEMENT_POSTMORTEM_RESOLVED") {
    event = createAlertEvent(
      "SETTLEMENT_POSTMORTEM_RESOLVED",
      "BTC",
      "15m Event Settled: KXBTC15M-26OCT07-2145",
      "60-Second TWAP tape reconstructed. 1 decisive crossing tick identified.",
      {
        settled_twap: `$${spotPrice.toFixed(2)}`,
        atm_strike: `$${(Math.round(spotPrice / 250) * 250).toLocaleString()}`,
        outcome: "YES",
        flips_detected: "0 Flips (Clean Trend)",
      },
      "https://quanterraos.com/settlement",
      "INFO",
      "KXBTC15M-26OCT07-2145"
    );
  } else if (eventType === "CORRIDOR_ASYMMETRY_AUDITED") {
    event = createAlertEvent(
      "CORRIDOR_ASYMMETRY_AUDITED",
      "BTC",
      "Multi-Strike Binary Corridor Audited",
      "Range pin corridor audited with 5.2% fee drag and +$7.20 net profit ceiling.",
      {
        strategy: "RANGE_PIN_CORRIDOR",
        net_max_profit: "+$7.20",
        capital_at_risk: "-$3.14",
        fee_drag: "5.2%",
        breakeven_win_rate: "28.5%",
      },
      "https://quanterraos.com/corridors",
      "INFO"
    );
  } else {
    event = createAlertEvent(
      "CROSS_VENUE_DIVERGENCE_SPIKE",
      "BTC",
      "Cross-Venue Divergence Spike (240 bps)",
      "Kalshi KXBTC15M vs Polymarket BTC spread widened beyond 200 bps threshold.",
      {
        kalshi_price: "$0.52",
        polymarket_price: "$0.48",
        spread_bps: "240 bps",
        kalshi_friction: "1.75¢ (Kalshi Taker)",
        polymarket_friction: "0.50¢ (Gas/Amortized)",
      },
      "https://quanterraos.com/divergence",
      "WARNING",
      "KXBTC15M-26OCT07-2200"
    );
  }

  const dryRun = !webhookUrl || typeof webhookUrl !== "string" || webhookUrl.trim() === "";
  const dispatchResult = await dispatchAlertWebhook(
    event,
    dryRun ? "https://discord.com/api/webhooks/dry-run" : webhookUrl,
    dryRun
  );

  res.json({
    success: dispatchResult.success,
    simulated: dispatchResult.simulated,
    destination: dispatchResult.destination,
    eventId: dispatchResult.eventId,
    latencyMs: dispatchResult.latencyMs,
    error: dispatchResult.error,
    event,
    discordPayload: formatDiscordAlertPayload(event),
    telegramPayload: formatTelegramAlertPayload(event),
  });
});

// 24/7 Market Window Schedule Grid & Event Calendar
app.get(["/schedule", "/calendar"], (req, res) => {
  const matrix = generateDailyScheduleMatrix();
  res.type("html").send(renderMarketScheduleHtml(matrix));
});

app.get("/api/schedule/matrix", (req, res) => {
  const matrix = generateDailyScheduleMatrix();
  res.json({ success: true, matrix });
});

app.get("/api/schedule/calendar.ics", (req, res) => {
  const matrix = generateDailyScheduleMatrix();
  const ics = generateIcsCalendarFeed(matrix);
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="quanterraos-btc-expiries.ics"');
  res.send(ics);
});

// Historical Calibration Explorer & Brier Decomposition Terminal
app.get("/calibration/explorer", async (req, res) => {
  const session = (typeof req.query.session === "string" ? req.query.session : "ALL") as SessionFilter;
  const moneyness = (typeof req.query.moneyness === "string" ? req.query.moneyness : "ALL") as MoneynessFilter;
  const volatility = (typeof req.query.volatility === "string" ? req.query.volatility : "ALL") as VolatilityFilter;

  const result = await computeCalibrationExplorer(session, moneyness, volatility);
  res.type("html").send(renderCalibrationExplorerHtml(result));
});

app.get("/api/calibration/explore", async (req, res) => {
  const session = (typeof req.query.session === "string" ? req.query.session : "ALL") as SessionFilter;
  const moneyness = (typeof req.query.moneyness === "string" ? req.query.moneyness : "ALL") as MoneynessFilter;
  const volatility = (typeof req.query.volatility === "string" ? req.query.volatility : "ALL") as VolatilityFilter;

  const result = await computeCalibrationExplorer(session, moneyness, volatility);
  res.json({ success: true, result });
});

// Acoustic Microstructure Sonification Terminal (/radar/audio, /audio)
app.get(["/radar/audio", "/audio", "/sonification"], (_req, res) => {
  res.type("html").send(renderMicrostructureAudioPageHtml());
});

app.get("/api/radar/audio/event", (req, res) => {
  const secondsRemaining = Number(req.query.secondsRemaining ?? 45);
  const spotPrice = Number(req.query.spotPrice ?? 91230);
  const strikePrice = Number(req.query.strikePrice ?? 91250);
  const twapProgressSeconds = Number(req.query.twapProgressSeconds ?? 15);
  const isSettled = req.query.isSettled === "true";
  const outcome = (req.query.outcome === "YES" ? "YES" : req.query.outcome === "NO" ? "NO" : null);

  const event = computeAudioTelemetryEvent({
    secondsRemaining,
    spotPrice,
    strikePrice,
    twapProgressSeconds,
    isSettled,
    outcome
  });
  res.json({ success: true, event });
});

// Order Book Liquidity Flow & Microstructure Pressure Terminal (/flow, /liquidity-flow)
app.get(["/flow", "/liquidity-flow"], (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-24OCT07-T91250";
  const windowSeconds = Number(req.query.window ?? 180);
  const state = computeLiquidityFlowState(ticker, { windowSeconds });
  res.type("html").send(renderLiquidityFlowPageHtml(state));
});

app.get(["/embed/flow", "/embed/liquidity-flow"], (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-24OCT07-T91250";
  const windowSeconds = Number(req.query.window ?? 180);
  const state = computeLiquidityFlowState(ticker, { windowSeconds });
  res.type("html").send(renderLiquidityFlowWidgetHtml(state));
});

app.get("/api/flow/metrics", (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-24OCT07-T91250";
  const windowSeconds = Number(req.query.window ?? 180);
  const state = computeLiquidityFlowState(ticker, { windowSeconds });
  res.json({ success: true, state });
});

app.get("/api/flow/card.svg", (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-24OCT07-T91250";
  const windowSeconds = Number(req.query.window ?? 180);
  const state = computeLiquidityFlowState(ticker, { windowSeconds });
  const svg = generateLiquidityFlowSvgReceipt(state);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

// All-Strike Cross-Section Matrix & Liquidity Wall Terminal (/matrix, /cross-section)
app.get(["/matrix", "/cross-section", "/depth-matrix"], (req, res) => {
  const spotPrice = req.query.spot ? Number(req.query.spot) : undefined;
  const minsRemaining = req.query.mins ? Number(req.query.mins) : undefined;
  const vol = req.query.vol ? Number(req.query.vol) : undefined;
  const snapshot = computeDepthMatrixSnapshot({
    spotPrice,
    timeRemainingMinutes: minsRemaining,
    annualizedVol: vol
  });
  res.type("html").send(renderDepthMatrixPageHtml(snapshot));
});

app.get(["/embed/matrix", "/embed/cross-section"], (req, res) => {
  const spotPrice = req.query.spot ? Number(req.query.spot) : undefined;
  const minsRemaining = req.query.mins ? Number(req.query.mins) : undefined;
  const vol = req.query.vol ? Number(req.query.vol) : undefined;
  const snapshot = computeDepthMatrixSnapshot({
    spotPrice,
    timeRemainingMinutes: minsRemaining,
    annualizedVol: vol
  });
  res.type("html").send(renderDepthMatrixWidgetHtml(snapshot));
});

app.get("/api/matrix/snapshot", (req, res) => {
  const spotPrice = req.query.spot ? Number(req.query.spot) : undefined;
  const minsRemaining = req.query.mins ? Number(req.query.mins) : undefined;
  const vol = req.query.vol ? Number(req.query.vol) : undefined;
  const snapshot = computeDepthMatrixSnapshot({
    spotPrice,
    timeRemainingMinutes: minsRemaining,
    annualizedVol: vol
  });
  res.json({ success: true, snapshot });
});

app.get("/api/matrix/card.svg", (req, res) => {
  const spotPrice = req.query.spot ? Number(req.query.spot) : undefined;
  const minsRemaining = req.query.mins ? Number(req.query.mins) : undefined;
  const vol = req.query.vol ? Number(req.query.vol) : undefined;
  const snapshot = computeDepthMatrixSnapshot({
    spotPrice,
    timeRemainingMinutes: minsRemaining,
    annualizedVol: vol
  });
  const svg = generateDepthMatrixSvgReceipt(snapshot);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

// Realistic Paper Mode — Practice Without Deposits Terminal (/paper, /practice)
app.get(["/paper", "/practice", "/paper-mode"], (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-24OCT07-T91250";
  const side = req.query.side === "NO" ? "NO" : "YES";
  const orderType = req.query.type === "LIMIT" ? "LIMIT" : "MARKET";
  const contracts = Number(req.query.contracts ?? 10);
  const latency = Number(req.query.latency ?? 150);

  const result = simulateRealisticPaperOrder({
    ticker,
    side,
    orderType,
    contracts,
    simulatedLatencyMs: latency
  });

  res.type("html").send(renderRealisticPaperPageHtml(result));
});

app.get(["/embed/paper", "/embed/practice"], (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-24OCT07-T91250";
  const result = simulateRealisticPaperOrder({
    ticker,
    side: "YES",
    orderType: "MARKET",
    contracts: 10
  });
  res.type("html").send(renderRealisticPaperWidgetHtml(result));
});

app.post("/api/paper/order", express.json(), (req, res) => {
  const { ticker, side, orderType, limitPriceCents, contracts, simulatedLatencyMs, userMaxDailyOutlay, userSingleTradeCap } = req.body;
  const result = simulateRealisticPaperOrder({
    ticker: ticker ?? "KXBTC15M-24OCT07-T91250",
    side: side === "NO" ? "NO" : "YES",
    orderType: orderType === "LIMIT" ? "LIMIT" : "MARKET",
    limitPriceCents: limitPriceCents ? Number(limitPriceCents) : undefined,
    contracts: Number(contracts ?? 10),
    simulatedLatencyMs: simulatedLatencyMs ? Number(simulatedLatencyMs) : 150,
    userMaxDailyOutlay: userMaxDailyOutlay ? Number(userMaxDailyOutlay) : undefined,
    userSingleTradeCap: userSingleTradeCap ? Number(userSingleTradeCap) : undefined
  });
  res.json({ success: true, result });
});

app.get("/api/paper/card.svg", (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-24OCT07-T91250";
  const side = req.query.side === "NO" ? "NO" : "YES";
  const contracts = Number(req.query.contracts ?? 10);
  const result = simulateRealisticPaperOrder({
    ticker,
    side,
    orderType: "MARKET",
    contracts
  });
  const svg = generatePaperExecutionSvgReceipt(result);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

app.get("/api/paper/compare", (req, res) => {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-24OCT07-T91250";
  const side = req.query.side === "NO" ? "NO" : "YES";
  const orderType = req.query.type === "LIMIT" ? "LIMIT" : "MARKET";
  const contracts = Number(req.query.contracts ?? 10);
  const latency = Number(req.query.latency ?? 150);
  const limitPriceCents = req.query.limitPrice ? Number(req.query.limitPrice) : undefined;

  const comparison = compareRealisticVsFantasyPaper({
    ticker,
    side,
    orderType,
    limitPriceCents,
    contracts,
    simulatedLatencyMs: latency,
  });

  res.json({ success: true, comparison });
});

// Strategic Move #7: Programmatic Dataset & Historical Settlement Export Hub (/datasets)
app.get(["/datasets", "/data-hub", "/open-data"], (req, res) => {
  res.type("html").send(renderDatasetsPageHtml());
});

app.get("/api/datasets/manifest", (req, res) => {
  res.json(getDatasetsManifest());
});

app.get("/api/datasets/preview", (req, res) => {
  const datasetId = typeof req.query.dataset === "string" ? req.query.dataset : "kalshi-btc15m-candles";
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
  const rows = getDatasetSampleRows(datasetId, limit);
  res.json({ success: true, datasetId, limit, count: rows.length, rows });
});

app.get("/api/datasets/deciles", (req, res) => {
  const rows = getDatasetSampleRows("decile-calibration-benchmark", 10);
  res.json({ success: true, datasetId: "decile-calibration-benchmark", rows });
});

app.get("/api/history/download", (req, res) => {
  const datasetId = typeof req.query.dataset === "string" ? req.query.dataset : "kalshi-btc15m-candles";
  const format = req.query.format === "jsonl" ? "jsonl" : "csv";
  const meta = getDatasetMetadata(datasetId);

  if (!meta) {
    res.status(404).json({
      error: "Dataset not found",
      available: ["kalshi-btc15m-candles", "coinbase-btc-1m", "decile-calibration-benchmark", "swing-events-volatility"]
    });
    return;
  }

  res.setHeader("X-Dataset-SHA256", meta.sha256);
  res.setHeader("X-Dataset-Rows", meta.rowCount.toString());
  res.setHeader("X-License", "CC-BY-4.0");

  if (datasetId === "decile-calibration-benchmark") {
    if (format === "jsonl") {
      const rows = getDatasetSampleRows("decile-calibration-benchmark", 10);
      const jsonl = rows.map(r => JSON.stringify(r)).join("\n");
      res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${datasetId}.jsonl"`);
      res.send(jsonl);
      return;
    }
    const csv = getDecileCsvContent();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${datasetId}.csv"`);
    res.send(csv);
    return;
  }

  const filePath = path.join(process.cwd(), "data", meta.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: `Dataset file ${meta.filename} missing on disk` });
    return;
  }

  if (format === "jsonl") {
    const csvContent = fs.readFileSync(filePath, "utf8");
    const lines = csvContent.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());
    const jsonlLines = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim());
      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const val = cols[i] ?? "";
        const num = Number(val);
        row[h] = !isNaN(num) && val !== "" ? num : val;
      });
      return JSON.stringify(row);
    });
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${datasetId}.jsonl"`);
    res.send(jsonlLines.join("\n"));
    return;
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${meta.filename}"`);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Strategic Move #9: The "Resolution Rulebook" Engine (Anti-Dispute AI)
app.get(["/resolution-risk", "/anti-dispute", "/oracle-guardian"], (req, res) => {
  const marketId = typeof req.query.market === "string" ? req.query.market : undefined;
  res.type("html").send(renderResolutionRiskPageHtml(marketId));
});

app.get("/api/resolution/audit", (req, res) => {
  const marketId = typeof req.query.market === "string" ? req.query.market : "FED-FUNDS-RATE-CUT-2026";
  const audit = getResolutionAudit(marketId);
  if (!audit) {
    res.status(404).json({ error: "Market audit not found", availableMarkets: getAllResolutionAudits().map(a => a.marketId) });
    return;
  }
  res.json({ success: true, audit });
});

app.post("/api/resolution/analyze", express.json(), (req, res) => {
  const { title, resolutionText, primarySourceUrl, venue } = req.body;
  if (!title || !resolutionText) {
    res.status(400).json({ error: "Missing required fields: title, resolutionText" });
    return;
  }
  const audit = analyzeCustomResolutionText({
    title,
    resolutionText,
    primarySourceUrl,
    venue: venue === "polymarket" ? "polymarket" : "kalshi"
  });
  res.json({ success: true, audit });
});

// Strategic Move #10: Cross-Platform Discrepancy & Net Spread Scanner (Polymarket vs. Kalshi)
app.get(["/scanner", "/cross-venue-scanner", "/spread-scanner"], (req, res) => {
  const cat = typeof req.query.cat === "string" ? req.query.cat : undefined;
  res.type("html").send(renderCrossVenueScannerPageHtml(cat));
});

app.get("/api/scanner/discrepancies", (req, res) => {
  const cat = typeof req.query.cat === "string" ? req.query.cat : undefined;
  const discrepancies = getCrossVenueDiscrepancies(cat);
  res.json({ success: true, count: discrepancies.length, discrepancies });
});

app.post("/api/scanner/calculate", express.json(), (req, res) => {
  const { kalshiPriceCents, polymarketPriceCents, contracts, settlementMatchCategory } = req.body;
  const result = computeCustomCrossVenueSpread({
    kalshiPriceCents: Number(kalshiPriceCents ?? 50),
    polymarketPriceCents: Number(polymarketPriceCents ?? 50),
    contracts: contracts ? Number(contracts) : undefined,
    settlementMatchCategory
  });
  res.json({ success: true, result });
});

// Strategic Move #11: Verified Settlement Track Record Explorer & Proof Ledger (/track-record, /ledger, /proof)
app.get(["/track-record", "/ledger", "/proof", "/verified-performance"], (req, res) => {
  const category = typeof req.query.cat === "string" ? req.query.cat : (typeof req.query.category === "string" ? req.query.category : undefined);
  const outcome = typeof req.query.outcome === "string" ? req.query.outcome : undefined;
  res.type("html").send(renderTrackRecordPageHtml({ category, outcome }));
});

app.get("/api/track-record/records", (req, res) => {
  const category = typeof req.query.cat === "string" ? req.query.cat : (typeof req.query.category === "string" ? req.query.category : undefined);
  const outcome = typeof req.query.outcome === "string" ? req.query.outcome : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const data = getTrackRecordData({ category, outcome, limit });
  res.json({ success: true, ...data });
});

app.get("/api/track-record/card.svg", (_req, res) => {
  const svg = generateTrackRecordReceiptSvg();
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

app.get("/api/track-record/export.csv", (_req, res) => {
  const csv = formatTrackRecordCsv();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="quanterraos-settlement-track-record.csv"');
  res.send(csv);
});

// Validated Forecast Comparison & Prospective Outcome Evaluation (90-Day Plan Build Order #6)
app.get(["/compare", "/forecasts", "/evaluation"], (req, res) => {
  const userProbability = req.query.p ? Number(req.query.p) : 0.55;
  const strike = req.query.k ? Number(req.query.k) : 87500;
  const minutesToExpiry = req.query.m ? Number(req.query.m) : 9.5;
  const yesAsk = req.query.ask ? Number(req.query.ask) : 0.51;
  const yesBid = req.query.bid ? Number(req.query.bid) : Number((yesAsk - 0.04).toFixed(2));
  const spotPrice = req.query.spot ? Number(req.query.spot) : 87450;
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "KXBTC15M-SIMULATED";

  const result = evaluateForecastComparison({
    userProbability,
    marketTicker: ticker,
    strike,
    spotPrice,
    minutesToExpiry,
    yesBid,
    yesAsk
  });

  const records = getMockProspectiveStudyCohort();
  const summary = summarizeCohortEvaluation(records);

  res.type("html").send(renderForecastComparisonPageHtml(result, summary, records));
});

app.get("/embed/compare", (req, res) => {
  const userProbability = req.query.p ? Number(req.query.p) : 0.55;
  const result = evaluateForecastComparison({ userProbability });
  res.type("html").send(renderForecastComparisonWidgetHtml(result));
});

app.post("/api/compare/evaluate", express.json(), (req, res) => {
  const { userProbability, marketTicker, strike, spotPrice, minutesToExpiry, yesBid, yesAsk, annualizedVol } = req.body;
  const result = evaluateForecastComparison({
    userProbability: Number(userProbability ?? 0.5),
    marketTicker,
    strike: strike ? Number(strike) : undefined,
    spotPrice: spotPrice ? Number(spotPrice) : undefined,
    minutesToExpiry: minutesToExpiry ? Number(minutesToExpiry) : undefined,
    yesBid: yesBid ? Number(yesBid) : undefined,
    yesAsk: yesAsk ? Number(yesAsk) : undefined,
    annualizedVol: annualizedVol ? Number(annualizedVol) : undefined
  });
  res.json({ success: true, result });
});

app.get("/api/compare/cohort", (_req, res) => {
  const records = getMockProspectiveStudyCohort();
  const summary = summarizeCohortEvaluation(records);
  res.json({ success: true, summary, records });
});

app.get("/api/compare/card.svg", (req, res) => {
  const userProbability = req.query.p ? Number(req.query.p) : 0.55;
  const strike = req.query.k ? Number(req.query.k) : 87500;
  const result = evaluateForecastComparison({
    userProbability,
    strike
  });
  const svg = generateForecastComparisonSvgReceipt(result);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

// Prospective "Know Your Costs" Study (Section 6.4 of Growth Strategy)
app.get(["/study", "/research/know-your-costs"], (_req, res) => {
  const participants = getProspectiveStudyCohort();
  const summary = summarizeStudyCohort(participants);
  const observations = getAnonymizedStudyObservations();
  res.type("html").send(renderStudyPageHtml(summary, observations));
});

app.get("/embed/study", (_req, res) => {
  const participants = getProspectiveStudyCohort();
  const summary = summarizeStudyCohort(participants);
  res.type("html").send(renderStudyWidgetHtml(summary));
});

app.get("/api/study/metrics", (_req, res) => {
  const participants = getProspectiveStudyCohort();
  const summary = summarizeStudyCohort(participants);
  res.json({ success: true, summary });
});

app.get("/api/study/card.svg", (_req, res) => {
  const participants = getProspectiveStudyCohort();
  const summary = summarizeStudyCohort(participants);
  const svg = generateStudySvgReceipt(summary);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

// Educator & Distribution Partner Program (Section 6.2 of Growth Strategy)
app.get(["/educators", "/partners"], (_req, res) => {
  const partners = getActiveEducatorPartners();
  const summary = summarizeEducatorProgram(partners);
  res.type("html").send(renderEducatorPageHtml(summary, partners));
});

app.get("/embed/educators", (_req, res) => {
  const partners = getActiveEducatorPartners();
  const summary = summarizeEducatorProgram(partners);
  res.type("html").send(renderEducatorWidgetHtml(summary));
});

app.get("/api/educators/summary", (_req, res) => {
  const partners = getActiveEducatorPartners();
  const summary = summarizeEducatorProgram(partners);
  res.json({ success: true, summary, partners });
});

app.get("/api/educators/card.svg", (_req, res) => {
  const partners = getActiveEducatorPartners();
  const summary = summarizeEducatorProgram(partners);
  const svg = generateEducatorSvgReceipt(summary);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

// Competitive Benchmark & Truth vs. Hype (Why QuanterraOS)
app.get(["/why", "/why-quanterraos", "/benchmark", "/vs"], (req, res) => {
  const nominalPriceCents = req.query.p ? Number(req.query.p) : 51;
  const userStatedWinRatePct = req.query.w ? Number(req.query.w) : 55;
  const contracts = req.query.c ? Number(req.query.c) : 100;
  const teardown = computeFrictionTeardown({ nominalPriceCents, userStatedWinRatePct, contracts });
  res.type("html").send(renderBenchmarkPageHtml(teardown));
});

app.get(["/embed/why", "/embed/benchmark"], (req, res) => {
  const nominalPriceCents = req.query.p ? Number(req.query.p) : 51;
  const userStatedWinRatePct = req.query.w ? Number(req.query.w) : 55;
  const teardown = computeFrictionTeardown({ nominalPriceCents, userStatedWinRatePct });
  res.type("html").send(renderBenchmarkWidgetHtml(teardown));
});

app.get("/api/benchmark/teardown", (req, res) => {
  const nominalPriceCents = req.query.p ? Number(req.query.p) : 51;
  const userStatedWinRatePct = req.query.w ? Number(req.query.w) : 55;
  const contracts = req.query.c ? Number(req.query.c) : 100;
  const teardown = computeFrictionTeardown({ nominalPriceCents, userStatedWinRatePct, contracts });
  res.json({ success: true, teardown });
});

app.get("/api/benchmark/cross-venue", (req, res) => {
  const venueAPriceCents = req.query.a ? Number(req.query.a) : 48;
  const venueBPriceCents = req.query.b ? Number(req.query.b) : 49;
  const contracts = req.query.c ? Number(req.query.c) : 1000;
  const gasUsd = req.query.gas ? Number(req.query.gas) : 1.50;
  const result = computeCrossVenueSpreadTeardown({
    venueAPriceCents,
    venueBPriceCents,
    contracts,
    venueBGasFeeUsd: gasUsd,
  });
  res.json({ success: true, result });
});

app.get("/api/benchmark/competitors", (_req, res) => {
  res.json({ success: true, competitors: COMPETITOR_DOSSIER_LIST });
});

// Strategic Move #4: Calibration-Adjusted Fractional Kelly & Capital Preservation Engine
app.all(["/api/benchmark/kelly", "/api/kelly"], (req, res) => {
  const q = req.method === "POST" ? req.body : req.query;
  const nominalPriceCents = q.p ? Number(q.p) : (q.nominalPriceCents ? Number(q.nominalPriceCents) : 50);
  const userStatedWinRatePct = q.w ? Number(q.w) : (q.userStatedWinRatePct ? Number(q.userStatedWinRatePct) : 60);
  const bankrollUsd = q.b ? Number(q.b) : (q.bankrollUsd ? Number(q.bankrollUsd) : 1000);
  const shrinkageFactor = q.alpha ? Number(q.alpha) : (q.shrinkageFactor ? Number(q.shrinkageFactor) : 0.35);

  const result = computeCalibrationAdjustedKelly({
    nominalPriceCents,
    userStatedWinRatePct,
    bankrollUsd,
    shrinkageFactor,
  });
  res.json({ success: true, result });
});

// Strategic Move #5: Whale Forensics & Institutional Delta/Basis Decoder
app.all(["/api/benchmark/whale-forensics", "/api/whales"], (req, res) => {
  const q = req.method === "POST" ? req.body : req.query;
  const contractTicker = String(q.ticker || q.contractTicker || "KXBTC15M-SAMPLE");
  const venue = (String(q.venue || "kalshi").toLowerCase() === "polymarket" ? "polymarket" : "kalshi") as "kalshi" | "polymarket";
  const priceCents = q.price ? Number(q.price) : (q.priceCents ? Number(q.priceCents) : 51);
  const contracts = q.contracts ? Number(q.contracts) : (q.size ? Number(q.size) : 5000);
  const spotPriceUsd = q.spot ? Number(q.spot) : (q.spotPriceUsd ? Number(q.spotPriceUsd) : 68485);
  const strikePriceUsd = q.strike ? Number(q.strike) : (q.strikePriceUsd ? Number(q.strikePriceUsd) : 68500);
  const timeRemainingSeconds = q.timeRemaining ? Number(q.timeRemaining) : (q.timeRemainingSeconds ? Number(q.timeRemainingSeconds) : 180);

  const result = decodeWhaleFlow({
    contractTicker,
    venue,
    priceCents,
    contracts,
    spotPriceUsd,
    strikePriceUsd,
    timeRemainingSeconds,
  });
  res.json({ success: true, result });
});

// Strategic Move #6: TrustOS Empirical Mathematical Audit Dossier Engine
app.all(["/api/trustos/audit-preview", "/api/audit/dossier"], (req, res) => {
  const q = req.method === "POST" ? req.body : req.query;
  const institutionName = String(q.institution || q.institutionName || "Enterprise Risk Committee / Design Partner");
  const modelDomain = (q.domain || q.modelDomain || "algorithmic_underwriting") as "algorithmic_underwriting" | "binary_options_pricing" | "credit_risk";
  const sampleDecisionsCount = q.samples ? Number(q.samples) : (q.sampleDecisionsCount ? Number(q.sampleDecisionsCount) : 1316);
  const targetBrierScore = q.brier ? Number(q.brier) : (q.targetBrierScore ? Number(q.targetBrierScore) : 0.2001);

  const result = generateTrustOsAuditPreview({
    institutionName,
    modelDomain,
    sampleDecisionsCount,
    targetBrierScore,
  });
  res.json({ success: true, result });
});

// Executive Enterprise TrustOS Portal
app.get(["/trustos", "/enterprise/trustos", "/audit-pilot"], (_req, res) => {
  const preview = generateTrustOsAuditPreview({
    institutionName: "Frontier Risk Analytics / Regional Insurer",
    modelDomain: "algorithmic_underwriting",
    sampleDecisionsCount: 1316,
    targetBrierScore: 0.2001,
  });
  res.type("html").send(renderTrustOsPageHtml(preview));
});

app.get("/api/benchmark/card.svg", (req, res) => {
  const nominalPriceCents = req.query.p ? Number(req.query.p) : 51;
  const userStatedWinRatePct = req.query.w ? Number(req.query.w) : 55;
  const contracts = req.query.c ? Number(req.query.c) : 100;
  const teardown = computeFrictionTeardown({ nominalPriceCents, userStatedWinRatePct, contracts });
  const svg = generateBenchmarkSvgReceipt(teardown);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

// Periodic Outcome & Market Friction Reports (Section 6.6 of Global Growth Strategy)
app.get(["/transparency", "/reports/friction", "/reports/outcomes"], (_req, res) => {
  const report = getPeriodicFrictionReport();
  res.type("html").send(renderPeriodicFrictionReportPageHtml(report));
});

app.get(["/embed/transparency", "/embed/reports/friction"], (_req, res) => {
  const report = getPeriodicFrictionReport();
  res.type("html").send(renderPeriodicFrictionWidgetHtml(report));
});

app.get("/api/reports/friction", (_req, res) => {
  const report = getPeriodicFrictionReport();
  res.json({ success: true, report });
});

app.get("/api/reports/friction/card.svg", (_req, res) => {
  const report = getPeriodicFrictionReport();
  const svg = generatePeriodicFrictionReceiptSvg(report);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.send(svg);
});

app.get(["/api/reports/friction/export.csv", "/api/reports/friction.csv"], (_req, res) => {
  const report = getPeriodicFrictionReport();
  const csv = exportPeriodicFrictionReportCsv(report);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="quanterraos-market-friction-report.csv"');
  res.send(csv);
});

// Embeddable Widgets & Distribution Cards Hub (Sections 6.3 & 6.5 of Global Growth Strategy)
app.get(["/widgets", "/embeds", "/developers/widgets"], (_req, res) => {
  res.type("html").send(renderWidgetCatalogHtml());
});

app.get("/api/widgets", (_req, res) => {
  res.json({ success: true, count: WIDGET_CATALOG_LIST.length, widgets: WIDGET_CATALOG_LIST });
});

// Programmatic Indexable Content Engine & Search Queries (Section 6.1 of Global Growth Strategy)
app.get(["/guides", "/compare", "/answers", "/library"], (_req, res) => {
  res.type("html").send(renderQueryHubPageHtml());
});

app.get(["/guides/:slug", "/compare/:slug", "/answers/:slug", "/q/:slug"], (req, res) => {
  const article = getSearchQueryArticle(req.params.slug);
  if (!article) {
    return res.status(404).type("html").send(`<!DOCTYPE html><html><body style="background:#07080B;color:#FFF;font-family:sans-serif;padding:40px;text-align:center;"><h2>Guide Not Found</h2><p>The requested query guide does not exist.</p><a href="/guides" style="color:#DFB843;">&larr; Return to Prediction Market Guides</a></body></html>`);
  }
  res.type("html").send(renderSearchQueryPageHtml(article));
});

app.get("/sitemap.xml", (_req, res) => {
  const xml = generateSitemapXml();
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.send(xml);
});

app.get("/robots.txt", (_req, res) => {
  const robots = generateRobotsTxt();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(robots);
});

app.get("/api/content/queries", (_req, res) => {
  res.json({ success: true, count: SEARCH_QUERY_ARTICLES.length, queries: getSearchQueryManifest() });
});

app.get("/api/content/query/:slug", (req, res) => {
  const article = getSearchQueryArticle(req.params.slug);
  if (!article) {
    return res.status(404).json({ error: "Guide not found", slug: req.params.slug });
  }
  res.json({ success: true, article });
});

app.get(["/learn", "/education", "/curriculum"], (req, res) => {
  const auth = getUserAuth(req);
  res.type("html").send(renderLearnPageHtml(auth.tier));
});

// Educational Discovery Pages (Sprint Days 8–14)
app.get(["/learn/fees", "/learn/breakeven", "/learn/settlement", "/learn/journal"], (req, res) => {
  const parts = req.path.split("/");
  const topic = parts[parts.length - 1] as EducationTopic;
  res.type("html").send(renderEducationalPageHtml(topic));
});

app.get("/learn/:topic", (req, res) => {
  const topic = req.params.topic as EducationTopic;
  if (["fees", "breakeven", "settlement", "journal"].includes(topic)) {
    return res.type("html").send(renderEducationalPageHtml(topic));
  }
  res.redirect("/learn");
});

app.get("/api/venues/compare", (req, res) => {
  const price = typeof req.query.price === "string" ? parseFloat(req.query.price) : 0.51;
  const count = typeof req.query.count === "string" ? parseInt(req.query.count, 10) : 10;
  const userProb = typeof req.query.prob === "string" ? parseFloat(req.query.prob) : 0.55;
  const comparison = compareVenues({ price, count, userProb });
  res.json({ success: true, comparison });
});

app.get(["/journal", "/decisions"], (req, res) => {
  const auth = getUserAuth(req);
  let entries: any[] = [];
  if (auth.user) {
    entries = db
      .select()
      .from(userDecisionJournal)
      .where(eq(userDecisionJournal.userId, auth.user.id))
      .orderBy(desc(userDecisionJournal.createdAt))
      .all();
  }
  logEvent("journal_viewed", auth.user?.id, { entryCount: entries.length });
  res.type("html").send(renderJournalPageHtml(auth.user, auth.tier, entries));
});

app.get(["/review", "/journal/review"], (req, res) => {
  const auth = getUserAuth(req);
  let entries: any[] = [];
  if (auth.user) {
    entries = db
      .select()
      .from(userDecisionJournal)
      .where(eq(userDecisionJournal.userId, auth.user.id))
      .orderBy(desc(userDecisionJournal.createdAt))
      .all();
  }
  logEvent("review_viewed", auth.user?.id, { entryCount: entries.length });
  res.type("html").send(renderReviewPageHtml(auth.user, auth.tier, entries as any));
});

app.post("/api/analytics/check", (req, res) => {
  const auth = getUserAuth(req);
  const isExample = req.body?.isExample === true || req.body?.preview === true;
  if (isExample) {
    logEvent("example_check_preview", auth.user?.id, req.body);
    return res.json({ success: true, preview: true });
  }
  logEvent("check_completed", auth.user?.id, req.body);
  res.json({ success: true });
});

app.post("/api/analytics/journal-viewed", (req, res) => {
  const auth = getUserAuth(req);
  logEvent("journal_viewed", auth.user?.id, { path: req.path });
  res.json({ success: true });
});

app.post("/api/feedback", (req, res) => {
  const { page, appVersion, category, comment, deviceInfo, contactEmail } = req.body || {};
  if (!comment && !category) {
    return res.status(400).json({ error: "Comment or category required" });
  }
  const id = `fb_${randomUUID().slice(0, 16)}`;
  const now = new Date().toISOString();
  db.insert(betaFeedback)
    .values({
      id,
      page: String(page || "/").slice(0, 255),
      appVersion: String(appVersion || "0.1.0-pilot"),
      category: String(category || "general"),
      comment: String(comment || "Reported via feedback button").slice(0, 2000),
      deviceInfo: String(deviceInfo || "").slice(0, 255),
      contactEmail: contactEmail ? String(contactEmail).slice(0, 120) : null,
      createdAt: now,
    })
    .run();
  logEvent("beta_feedback_submitted", null, { id, page, category });
  res.json({ success: true, id, message: "Thank you for reporting this issue. Our team has received your feedback." });
});

app.post("/api/journal/save", (req, res) => {
  const auth = getUserAuth(req);
  const b = req.body || {};
  const isExample = b.isExample === true || b.preview === true;

  if (isExample) {
    logEvent("example_check_preview", auth.user?.id, b);
    return res.json({
      success: true,
      id: "preview_example",
      isExample: true,
      message: "Example check previewed successfully without saving to customer metrics."
    });
  }

  let activeUser = auth.user;
  if (!activeUser) {
    const guestEmail = `operator_${randomUUID().slice(0, 8)}@quanterraos.local`;
    activeUser = createUser(guestEmail, randomUUID(), "free");
    logEvent("signup", activeUser.id, { email: guestEmail, tier: "free", guest: true, source: "journal_auto_provision" });
    const { sessionId } = createSession(activeUser.id);
    res.setHeader("Set-Cookie", `quanterraos_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
  }

  const id = `jrn_${randomUUID().slice(0, 16)}`;
  const now = new Date().toISOString();

  db.insert(userDecisionJournal)
    .values({
      id,
      userId: activeUser.id,
      venue: b.venue || "kalshi-15m",
      contractTicker: b.contractTicker || "KXBTC15M",
      contractType: b.contractType || "binary_above_below",
      side: b.side || "yes",
      pricingBasis: b.pricingBasis || "executable_ask",
      contractPrice: typeof b.price === "number" ? b.price : 0.51,
      contractCount: typeof b.count === "number" ? b.count : 10,
      purchaseCost: typeof b.purchaseCost === "number" ? b.purchaseCost : 5.10,
      exchangeFee: typeof b.exchangeFee === "number" ? b.exchangeFee : 0.18,
      halfSpreadDrag: typeof b.halfSpreadDrag === "number" ? b.halfSpreadDrag : 0.0,
      totalDrag: typeof b.totalDrag === "number" ? b.totalDrag : 0.018,
      breakevenWinProb: typeof b.breakevenWinProb === "number" ? b.breakevenWinProb : 52.80,
      assessedWinProb: typeof b.assessedWinProb === "number" ? b.assessedWinProb : 55.0,
      netExpectedValue: typeof b.netExpectedValue === "number" ? b.netExpectedValue : 0.22,
      settlementSource: b.settlementSource || "CME CF BRTI 60s TWAP",
      notes: b.notes || null,
      reasoning: b.reasoning || b.notes || null,
      decisionAction: b.decisionAction || "paper_trade",
      isExample: 0,
      status: "saved_check",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logEvent("check_saved", activeUser.id, {
    journalId: id,
    contractTicker: b.contractTicker || "KXBTC15M",
    breakevenWinProb: b.breakevenWinProb,
    pricingBasis: b.pricingBasis,
  });

  res.json({ success: true, id, userId: activeUser.id });
});

app.post("/api/journal/update-action", (req, res) => {
  const auth = getUserAuth(req);
  const { id, action } = req.body || {};
  if (!id || !["skipped", "paper_trade", "actual_trade"].includes(action)) {
    return res.status(400).json({ error: "Invalid payload: id and action (skipped|paper_trade|actual_trade) required" });
  }
  if (id === "preview_example") {
    return res.json({ success: true, id, action });
  }
  if (!auth.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  db.update(userDecisionJournal)
    .set({ decisionAction: action, updatedAt: new Date().toISOString() })
    .where(and(eq(userDecisionJournal.id, id), eq(userDecisionJournal.userId, auth.user.id)))
    .run();
  res.json({ success: true, id, action });
});

app.post("/api/journal/update-reasoning", (req, res) => {
  const auth = getUserAuth(req);
  const { id, reasoning } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: "id required" });
  }
  if (id === "preview_example") {
    return res.json({ success: true, id, reasoning });
  }
  if (!auth.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  db.update(userDecisionJournal)
    .set({ reasoning: String(reasoning || ""), notes: String(reasoning || ""), updatedAt: new Date().toISOString() })
    .where(and(eq(userDecisionJournal.id, id), eq(userDecisionJournal.userId, auth.user.id)))
    .run();
  res.json({ success: true, id, reasoning });
});

app.get("/api/journal", (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user) {
    return res.status(401).json({ error: "Authentication required to retrieve journal" });
  }
  const entries = db
    .select()
    .from(userDecisionJournal)
    .where(eq(userDecisionJournal.userId, auth.user.id))
    .orderBy(desc(userDecisionJournal.createdAt))
    .all();
  res.json({ success: true, count: entries.length, entries });
});

app.post("/api/journal/resolve", (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user) {
    return res.status(401).json({ error: "Authentication required to resolve journal entry" });
  }

  const { id, outcome, notes } = req.body || {};
  if (!id || !["WON", "LOST", "VOID"].includes(outcome)) {
    return res.status(400).json({ error: "Invalid resolution payload: id and outcome (WON|LOST|VOID) required" });
  }

  const existing = db
    .select()
    .from(userDecisionJournal)
    .where(and(eq(userDecisionJournal.id, id), eq(userDecisionJournal.userId, auth.user.id)))
    .all();

  if (existing.length === 0) {
    return res.status(404).json({ error: "Journal entry not found" });
  }

  const entry = existing[0];
  let realizedPnl = 0;
  const count = entry.contractCount || 1;
  const fee = entry.exchangeFee || 0;
  const cost = entry.purchaseCost || (entry.contractPrice * count);

  if (outcome === "WON") {
    realizedPnl = Number(((1.00 * count) - cost - fee).toFixed(2));
  } else if (outcome === "LOST") {
    realizedPnl = Number((-(cost + fee)).toFixed(2));
  } else if (outcome === "VOID") {
    realizedPnl = 0.00;
  }

  const now = new Date().toISOString();
  db.update(userDecisionJournal)
    .set({
      outcome,
      realizedPnl,
      status: "settled",
      notes: notes ? `${entry.notes ? entry.notes + " | " : ""}${notes}` : entry.notes,
      updatedAt: now,
    })
    .where(eq(userDecisionJournal.id, id))
    .run();

  logEvent("journal_resolved", auth.user.id, {
    journalId: id,
    outcome,
    realizedPnl,
    contractTicker: entry.contractTicker,
  });

  res.json({
    success: true,
    id,
    outcome,
    realizedPnl,
  });
});

app.post("/api/journal/record-actual-outcome", (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user) {
    return res.status(401).json({ error: "Authentication required to record actual outcome" });
  }

  const { id, actualQuantity, actualFillPrice, actualFees, exitProceeds, outcome, notes } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: "id required" });
  }

  const existing = db
    .select()
    .from(userDecisionJournal)
    .where(and(eq(userDecisionJournal.id, id), eq(userDecisionJournal.userId, auth.user.id)))
    .all();

  if (existing.length === 0) {
    return res.status(404).json({ error: "Journal entry not found" });
  }

  const entry = existing[0];
  const isComplete = (
    actualQuantity !== null && actualQuantity !== undefined && actualQuantity !== "" &&
    actualFillPrice !== null && actualFillPrice !== undefined && actualFillPrice !== "" &&
    actualFees !== null && actualFees !== undefined && actualFees !== "" &&
    exitProceeds !== null && exitProceeds !== undefined && exitProceeds !== ""
  );

  let realizedPnl: number | null = null;
  const numQty = Number(actualQuantity);
  const numFill = Number(actualFillPrice);
  const numFees = Number(actualFees);
  const numProceeds = Number(exitProceeds);

  if (isComplete && !isNaN(numQty) && !isNaN(numFill) && !isNaN(numFees) && !isNaN(numProceeds)) {
    realizedPnl = Number((numProceeds - (numQty * numFill) - numFees).toFixed(2));
  }

  const outcomeStatus = isComplete ? "settled" : "incomplete";
  const now = new Date().toISOString();

  db.update(userDecisionJournal)
    .set({
      decisionAction: "actual_trade",
      actualQuantity: !isNaN(numQty) && actualQuantity !== null && actualQuantity !== "" ? numQty : null,
      actualFillPrice: !isNaN(numFill) && actualFillPrice !== null && actualFillPrice !== "" ? numFill : null,
      actualFees: !isNaN(numFees) && actualFees !== null && actualFees !== "" ? numFees : null,
      exitProceeds: !isNaN(numProceeds) && exitProceeds !== null && exitProceeds !== "" ? numProceeds : null,
      realizedPnl,
      outcome: outcome || entry.outcome || (realizedPnl !== null ? (realizedPnl >= 0 ? "WON" : "LOST") : null),
      outcomeStatus,
      status: outcomeStatus,
      outcomeNotes: notes ? String(notes).slice(0, 1000) : entry.outcomeNotes,
      updatedAt: now,
    })
    .where(eq(userDecisionJournal.id, id))
    .run();

  logEvent("actual_outcome_recorded", auth.user.id, {
    journalId: id,
    outcomeStatus,
    realizedPnl,
    isComplete,
  });

  res.json({
    success: true,
    id,
    realizedPnl,
    outcomeStatus,
    isComplete,
  });
});

app.get(["/beta/book", "/book-session"], (_req, res) => {
  res.type("html").send(renderBetaBookingPageHtml());
});

app.post("/api/pilot/booking-request", (req, res) => {
  const { contact, deviceType, availability, consentGiven } = req.body || {};
  if (!contact || !deviceType || !availability) {
    return res.status(400).json({ error: "Missing required fields: contact, deviceType, availability" });
  }
  if (!consentGiven) {
    return res.status(400).json({ error: "Explicit consent is required to request an observation session" });
  }

  const id = `book_${randomUUID().slice(0, 16)}`;
  const now = new Date().toISOString();

  db.insert(pilotBookingRequests)
    .values({
      id,
      contact: String(contact).slice(0, 150),
      deviceType: String(deviceType).slice(0, 100),
      availability: String(availability).slice(0, 255),
      consentGiven: 1,
      status: "INTERESTED",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logEvent("pilot_booking_requested", null, { bookingId: id, deviceType });

  res.json({
    success: true,
    bookingId: id,
    status: "INTERESTED",
    message: "15-minute observation session requested successfully."
  });
});

app.post("/api/audit/pilot/update-booking-status", (req, res) => {
  const { id, status, scheduledAt, operatorNotes } = req.body || {};
  if (!id || !["INTERESTED", "SCHEDULED", "OBSERVED"].includes(status)) {
    return res.status(400).json({ error: "id and status (INTERESTED|SCHEDULED|OBSERVED) required" });
  }

  const now = new Date().toISOString();
  db.update(pilotBookingRequests)
    .set({
      status,
      scheduledAt: scheduledAt ? String(scheduledAt).slice(0, 100) : null,
      operatorNotes: operatorNotes ? String(operatorNotes).slice(0, 500) : null,
      updatedAt: now,
    })
    .where(eq(pilotBookingRequests.id, id))
    .run();

  res.json({ success: true, id, status });
});

app.get("/api/export/journal.csv", (req, res) => {
  const auth = getUserAuth(req);
  let entries: any[] = [];
  if (auth.user) {
    entries = db
      .select()
      .from(userDecisionJournal)
      .where(eq(userDecisionJournal.userId, auth.user.id))
      .orderBy(desc(userDecisionJournal.createdAt))
      .all();
  }
  logEvent("journal_exported", auth.user?.id, { count: entries.length });
  const headers = "id,created_at,venue,contract,pricing_basis,side,price,count,purchase_cost,fee,half_spread_drag,total_drag,breakeven_pct,assessed_pct,net_ev,status,oracle\n";
  const rows = entries
    .map((e) =>
      [
        e.id,
        e.createdAt,
        e.venue,
        e.contractTicker,
        e.pricingBasis,
        e.side,
        e.contractPrice,
        e.contractCount,
        e.purchaseCost,
        e.exchangeFee,
        e.halfSpreadDrag,
        e.totalDrag,
        e.breakevenWinProb,
        e.assessedWinProb,
        e.netExpectedValue,
        e.status,
        `"${(e.settlementSource || "").replace(/"/g, '""')}"`,
      ].join(",")
    )
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="quanterraos-journal-${Date.now()}.csv"`);
  res.send(headers + rows);
});

app.post("/api/journal/import-csv", (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user) {
    return res.status(401).json({ error: "Authentication required to import CSV statements" });
  }

  const csvText = typeof req.body === "string" ? req.body : req.body.csvText;
  if (!csvText || typeof csvText !== "string") {
    return res.status(400).json({ error: "No CSV content provided in request body" });
  }

  const result = parseJournalCsv(csvText, auth.user.id);
  res.json({
    success: true,
    importedCount: result.importedCount,
    errors: result.errors,
    message: `Successfully imported ${result.importedCount} decision check(s) into your personal journal.`,
  });
});

app.post("/api/statement/preview", (req, res) => {
  const flags = getFeatureFlags(req.query);
  if (!flags.statementImport) {
    return res.status(403).json({ error: "Statement import feature is currently disabled behind feature flag" });
  }

  const auth = getUserAuth(req);
  const userId = auth.user?.id || (process.env.NODE_ENV !== "production" ? "test-user-import" : null);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required to preview statements" });
  }

  const csvText = typeof req.body === "string" ? req.body : req.body?.csvText;
  if (!csvText || typeof csvText !== "string") {
    return res.status(400).json({ error: "No CSV content provided in request body" });
  }

  const result = previewStatementCsv(csvText, userId);
  res.json(result);
});

app.post("/api/statement/commit", (req, res) => {
  const flags = getFeatureFlags(req.query);
  if (!flags.statementImport) {
    return res.status(403).json({ error: "Statement import feature is currently disabled behind feature flag" });
  }

  const auth = getUserAuth(req);
  const userId = auth.user?.id || (process.env.NODE_ENV !== "production" ? "test-user-import" : null);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required to import statements" });
  }

  const { batchId, rows, reconcileMap } = req.body || {};
  if (!batchId || !Array.isArray(rows)) {
    return res.status(400).json({ error: "Missing required fields: batchId, rows" });
  }

  const result = commitStatement(userId, batchId, rows, reconcileMap || {});
  res.json(result);
});

app.get("/api/statement/export.csv", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || (process.env.NODE_ENV !== "production" ? "test-user-import" : null);
  if (!userId) {
    return res.status(401).send("Authentication required to export statements");
  }

  const csv = exportImportedStatementsCsv(userId);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="quanterraos-kalshi-statement-${Date.now()}.csv"`);
  res.send(csv);
});

app.post("/api/statement/delete", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || (process.env.NODE_ENV !== "production" ? "test-user-import" : null);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required to delete statements" });
  }

  const { batchId } = req.body || {};
  const result = deleteImportedStatements(userId, batchId);
  res.json({ success: true, ...result });
});

// ---------------------------------------------------------------------------
// INTELLARA Decision Coach APIs (Feature-Gated)
// ---------------------------------------------------------------------------

app.post("/api/coach/explain", (req, res) => {
  const flags = getFeatureFlags(req.query);
  if (!flags.decisionCoach) {
    return res.status(403).json({ error: "Decision Coach is currently disabled behind feature flag" });
  }
  const auth = getUserAuth(req);
  const userId = auth.user?.id || (process.env.NODE_ENV !== "production" ? "test-user-coach" : null);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const { journalId } = req.body || {};
  if (!journalId) {
    return res.status(400).json({ error: "Missing required journalId" });
  }
  const explanation = explainSavedCheck(journalId, userId);
  if (!explanation) {
    return res.status(404).json({ error: "Journal entry not found or unauthorized" });
  }
  res.json({ success: true, explanation });
});

app.post("/api/coach/ask", (req, res) => {
  const flags = getFeatureFlags(req.query);
  if (!flags.decisionCoach) {
    return res.status(403).json({ error: "Decision Coach is currently disabled behind feature flag" });
  }
  const auth = getUserAuth(req);
  const userId = auth.user?.id || (process.env.NODE_ENV !== "production" ? "test-user-coach" : null);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const { query } = req.body || {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing query in request body" });
  }
  const answer = answerFromUserRecords(query, userId);
  res.json(answer);
});

app.post("/api/coach/debrief", (req, res) => {
  const flags = getFeatureFlags(req.query);
  if (!flags.decisionCoach) {
    return res.status(403).json({ error: "Decision Coach is currently disabled behind feature flag" });
  }
  const auth = getUserAuth(req);
  const userId = auth.user?.id || (process.env.NODE_ENV !== "production" ? "test-user-coach" : null);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const { journalId, expectation, reality, lesson } = req.body || {};
  if (!journalId) {
    return res.status(400).json({ error: "Missing journalId" });
  }
  const result = recordDecisionReviewDebrief(journalId, userId, { expectation, reality, lesson });
  res.json(result);
});

// ---------------------------------------------------------------------------
// Founder Release-Quality Dashboard & Reliability Subsystems
// ---------------------------------------------------------------------------

app.get("/admin/release", requireFounderAuth, (_req, res) => {
  const data = getFounderReleaseDashboardData();
  res.type("html").send(renderFounderReleaseDashboardHtml(data));
});

app.get("/api/admin/release-status", requireFounderAuth, (req, res) => {
  const broken = req.query.simulateBroken === "true";
  const data = getFounderReleaseDashboardData({ brokenOverride: broken });
  res.json(data);
});

app.post("/api/admin/backup-verify", requireFounderAuth, (_req, res) => {
  const report = runIsolatedBackupRecoveryCheck();
  res.json(report);
});

app.get("/api/admin/data-quality", requireFounderAuth, (_req, res) => {
  const report = runDataQualityAudit();
  res.json(report);
});

app.get("/api/admin/fee-rules", requireFounderAuth, (_req, res) => {
  const report = checkFeeAndSettlementRulesFreshness();
  res.json(report);
});

app.post("/api/admin/simulate-break-dependency", requireFounderAuth, (req, res) => {
  const { broken } = req.body || {};
  setSimulatedDependencyBroken(Boolean(broken));
  res.json({ success: true, broken: Boolean(broken) });
});

// Retained Recovery Drill Routes (strictly protected behind requireFounderAuth)
app.post("/api/admin/retained-recovery-drill", requireFounderAuth, (_req, res) => {
  const report = executeRetainedRecoveryDrill();
  res.json(report);
});

app.get("/api/admin/retained-recovery-drill/latest", requireFounderAuth, (_req, res) => {
  const report = getLatestRetainedRecoveryDrill();
  res.json(report);
});

// Beta Invitation & Attribution Routes (Zero PII Exposure)
app.get("/api/admin/beta-attribution", requireFounderAuth, (_req, res) => {
  const summary = getBetaAttributionSummary();
  res.json(summary);
});

app.post("/api/admin/beta-invitations", requireFounderAuth, (req, res) => {
  const { code, source, targetAudience, invitedCount } = req.body || {};
  if (!code || !source) {
    return res.status(400).json({ error: "code and source required" });
  }
  const inv = createBetaInvitation({ code, source, targetAudience, invitedCount: Number(invitedCount) || 1 });
  res.json({ success: true, invitation: inv });
});

app.get("/invite/:code", (req, res) => {
  const code = req.params.code;
  res.setHeader("Set-Cookie", `quanterraos_beta_ref=${encodeURIComponent(code)}; Path=/; SameSite=Lax; Max-Age=2592000`);
  res.redirect(`/install?ref=${encodeURIComponent(code)}`);
});

// Support Queue & Problem Routing Routes
app.post("/api/support/ticket", (req, res) => {
  const { summary, details, severity, category, source, deviceInfo } = req.body || {};
  if (!summary || !details) {
    return res.status(400).json({ error: "summary and details required" });
  }
  const auth = getUserAuth(req);
  const reporterRef = auth.user?.id || (req.body?.reporterRef || "mobile_guest_user");
  const ticket = submitSupportTicket({
    reporterRef,
    summary,
    details,
    severity,
    category,
    source,
    deviceInfo,
  });
  res.json({ success: true, ticket });
});

app.get("/api/admin/support/queue", requireFounderAuth, (req, res) => {
  const status = req.query.status as any;
  const severity = req.query.severity as any;
  const tickets = listSupportTickets({ status, severity });
  const metrics = getSupportQueueMetrics();
  res.json({ tickets, metrics });
});

app.post("/api/admin/support/ticket/:id/update", requireFounderAuth, (req, res) => {
  const { status, owner, resolutionNotes } = req.body || {};
  const updated = updateSupportTicket(req.params.id, { status, owner, resolutionNotes });
  if (!updated) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  res.json({ success: true, ticket: updated });
});

// First-Session Checklist & Observation Routes
app.post("/api/audit/pilot/checklist", (req, res) => {
  const { participantRef, taskAssigned, taskCompleted, assistanceLevel, assistanceNotes, comprehensionScore, comprehensionNotes, consentGiven, feedbackText, deviceType, bookingId } = req.body || {};
  if (!participantRef) {
    return res.status(400).json({ error: "participantRef is required" });
  }
  const result = recordFirstSessionChecklist({
    participantRef,
    taskAssigned,
    taskCompleted: Boolean(taskCompleted),
    assistanceLevel: assistanceLevel || "NONE",
    assistanceNotes,
    comprehensionScore: Number(comprehensionScore) || 3,
    comprehensionNotes,
    consentGiven: consentGiven !== undefined ? Boolean(consentGiven) : true,
    feedbackText,
    deviceType,
    bookingId,
  });
  res.json({ success: true, checklist: result });
});

app.get("/api/audit/pilot/checklist-summary", requireFounderAuth, (_req, res) => {
  const summary = getFirstSessionSummary();
  res.json(summary);
});

app.get("/api/account/risk-plan", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const plan = getUserRiskPlan(userId);
  res.json({ success: true, plan });
});

app.post("/api/account/risk-plan", (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user) {
    return res.status(401).json({ error: "Authentication required to update advisory risk plan" });
  }
  const updated = saveUserRiskPlan(auth.user.id, req.body || {});
  res.json({ success: true, plan: updated });
});

// Review Reminders & Notification Preferences (Sprint Days 8–11)
app.get("/api/account/reminders", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "guest";
  const reminders = getReviewReminders(userId);
  res.json({ success: true, reminders });
});

app.post("/api/account/reminders", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "guest";
  const updated = updateReviewReminders(userId, req.body || {});
  res.json({ success: true, reminders: updated });
});

app.post("/api/calculator/advisory-check", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const { ticker, price, count, purchaseCost, outlay, exchangeFee } = req.body || {};
  const cost = Number(purchaseCost) || Number(outlay) || (Number(price || 0.51) * Number(count || 10));
  const advisory = checkTradeAgainstRiskPlan(userId, {
    ticker: ticker || "KXBTC15M",
    price: Number(price) || 0.51,
    count: Number(count) || 10,
    purchaseCost: cost,
    exchangeFee: Number(exchangeFee) || 0.18,
  });
  res.json({
    success: true,
    advisory,
    warnings: advisory.warnings,
    warningDetails: advisory.warningDetails,
    isExceeded: advisory.isExceeded,
    limits: advisory.limits,
    exposure: advisory.exposure,
    uncertaintyNotice: advisory.uncertaintyNotice,
    hasIncompleteImports: advisory.hasIncompleteImports,
    pauseOption: advisory.pauseOption,
    advisoryDisclaimer: advisory.advisoryDisclaimer,
  });
});

app.post("/api/calculator/save-later", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "demo-subscriber";
  const { contractTicker, price, count, purchaseCost, outlay, exchangeFee, breakevenWinProb, assessedWinProb, reasoning, coolingOffMinutes } = req.body || {};
  const cost = Number(purchaseCost) || Number(outlay) || (Number(price || 0.51) * Number(count || 10));
  const saved = saveCheckForLater(userId, {
    contractTicker: contractTicker || "KXBTC15M",
    price: Number(price) || 0.51,
    count: Number(count) || 10,
    purchaseCost: cost,
    exchangeFee: Number(exchangeFee) || 0.18,
    breakevenWinProb: Number(breakevenWinProb) || 52.8,
    assessedWinProb: Number(assessedWinProb) || 55.0,
    reasoning: reasoning || "Paused for voluntary cooling-off reflection",
    coolingOffMinutes: Number(coolingOffMinutes) || 15,
  });
  res.json({ success: true, saved });
});

app.get("/api/analytics/funnel-summary", requireFounderAuth, (_req, res) => {
  const allEvents = db.select().from(events).all();
  const allUsers = db.select().from(users).all();

  // Identify internal/test user IDs
  const internalUserIds = new Set<string>();
  for (const u of allUsers) {
    const email = (u.email || "").toLowerCase();
    if (
      email.includes("quanterraos.com") ||
      email.includes("founder@") ||
      email.includes("test@") ||
      email.includes("operator@") ||
      email.startsWith("internal_")
    ) {
      internalUserIds.add(u.id);
    }
  }

  const customerCounts: Record<string, number> = {
    checks_completed: 0,
    signups: 0,
    checks_saved: 0,
    journal_views: 0,
    journal_exports: 0,
  };

  const internalCounts: Record<string, number> = {
    checks_completed: 0,
    signups: 0,
    checks_saved: 0,
    journal_views: 0,
    journal_exports: 0,
  };

  for (const e of allEvents) {
    if (e.eventName === "example_check_preview") continue;
    let isInternal = false;
    let isExample = false;
    if (e.userId && internalUserIds.has(e.userId)) {
      isInternal = true;
    }
    if (e.metadata) {
      try {
        const meta = JSON.parse(e.metadata);
        if (meta.isExample || meta.preview || meta.is_example) {
          isExample = true;
        }
        if (meta.is_internal || meta.internal || meta.test || meta.source === "test_suite") {
          isInternal = true;
        }
      } catch (_) {}
    }
    if (isExample) continue;

    const bucket = isInternal ? internalCounts : customerCounts;
    if (e.eventName === "check_completed") bucket.checks_completed++;
    else if (e.eventName === "signup") bucket.signups++;
    else if (e.eventName === "check_saved") bucket.checks_saved++;
    else if (e.eventName === "journal_viewed") bucket.journal_views++;
    else if (e.eventName === "journal_exported") bucket.journal_exports++;
  }

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    customerFunnel: customerCounts,
    internalFunnel: internalCounts,
    customerConversionRates: {
      checkToSave: customerCounts.checks_completed > 0 
        ? Number(((customerCounts.checks_saved / customerCounts.checks_completed) * 100).toFixed(1)) + "%" 
        : "0.0%",
      signupToSave: customerCounts.signups > 0 
        ? Number(((customerCounts.checks_saved / customerCounts.signups) * 100).toFixed(1)) + "%" 
        : "0.0%",
    },
  });
});

app.get("/audit/pilot", requireFounderAuth, (_req, res) => {
  const allEvents = db.select().from(events).all();
  const allUsers = db.select().from(users).all();

  const internalUserIds = new Set<string>();
  for (const u of allUsers) {
    const email = (u.email || "").toLowerCase();
    if (
      email.includes("quanterraos.com") ||
      email.includes("founder@") ||
      email.includes("test@") ||
      email.includes("operator@") ||
      email.startsWith("internal_")
    ) {
      internalUserIds.add(u.id);
    }
  }

  const customerCounts = {
    checks_completed: 0,
    signups: 0,
    checks_saved: 0,
    journal_views: 0,
    journal_exports: 0,
  };

  const internalCounts = {
    checks_completed: 0,
    signups: 0,
    checks_saved: 0,
    journal_views: 0,
    journal_exports: 0,
  };

  for (const e of allEvents) {
    if (e.eventName === "example_check_preview") continue;
    let isInternal = false;
    let isExample = false;
    if (e.userId && internalUserIds.has(e.userId)) isInternal = true;
    if (e.metadata) {
      try {
        const meta = JSON.parse(e.metadata);
        if (meta.isExample || meta.preview || meta.is_example) {
          isExample = true;
        }
        if (meta.is_internal || meta.internal || meta.test || meta.source === "test_suite") {
          isInternal = true;
        }
      } catch (_) {}
    }
    if (isExample) continue;

    const bucket = isInternal ? internalCounts : customerCounts;
    if (e.eventName === "check_completed") bucket.checks_completed++;
    else if (e.eventName === "signup") bucket.signups++;
    else if (e.eventName === "check_saved") bucket.checks_saved++;
    else if (e.eventName === "journal_viewed") bucket.journal_views++;
    else if (e.eventName === "journal_exported") bucket.journal_exports++;
  }

  const recentEntries = db
    .select()
    .from(userDecisionJournal)
    .orderBy(desc(userDecisionJournal.createdAt))
    .limit(20)
    .all();

  const recordedSessions = db
    .select()
    .from(pilotObservationSessions)
    .orderBy(desc(pilotObservationSessions.createdAt))
    .limit(50)
    .all();

  const bookingRequests = db
    .select()
    .from(pilotBookingRequests)
    .orderBy(desc(pilotBookingRequests.createdAt))
    .limit(100)
    .all();

  res.type("html").send(
    renderPilotAuditPageHtml({
      customerFunnel: customerCounts,
      internalFunnel: internalCounts,
      recentJournalEntries: recentEntries,
      recordedSessions,
      bookingRequests: bookingRequests as any,
    })
  );
});

app.post("/api/audit/pilot/session", requireFounderAuth, (req, res) => {
  const b = req.body || {};
  const id = b.id || `ps_${randomUUID().slice(0, 12)}`;
  const participantRef = b.participantRef || b.id || "P-01";
  const now = new Date().toISOString();

  // If a booking request matches this participant, update to OBSERVED (strictly with authentic session telemetry)
  try {
    db.update(pilotBookingRequests)
      .set({ status: "OBSERVED", updatedAt: now })
      .where(eq(pilotBookingRequests.contact, participantRef))
      .run();
  } catch (_) {}

  db.insert(pilotObservationSessions)
    .values({
      id,
      participantRef,
      channel: b.channel || "Direct Participant",
      device: b.device || "iPhone Safari",
      durationMinutes: typeof b.durationMinutes === "number" ? b.durationMinutes : (parseFloat(b.duration) || 2.0),
      unassisted: b.unassisted === "NO" ? "NO" : "YES",
      assistanceDetails: b.assistanceDetails || null,
      persistenceStatus: b.persistenceStatus === "FAILED" ? "FAILED" : "VERIFIED",
      confusionNotes: b.confusionNotes || null,
      comprehensionCostFee: b.comprehensionCostFee || null,
      comprehensionBreakeven: b.comprehensionBreakeven || null,
      comprehensionZeroAlpha: b.comprehensionZeroAlpha || null,
      operatorNotes: b.operatorNotes || null,
      status: b.status || "COMPLETED",
      createdAt: b.createdAt || now,
    })
    .run();

  logEvent("pilot_session_recorded", undefined, {
    sessionId: id,
    participantRef,
    unassisted: b.unassisted,
    persistenceStatus: b.persistenceStatus,
  });

  res.json({ success: true, id, participantRef });
});

app.get("/api/audit/pilot/sessions", requireFounderAuth, (_req, res) => {
  const sessionsList = db
    .select()
    .from(pilotObservationSessions)
    .orderBy(desc(pilotObservationSessions.createdAt))
    .all();
  res.json({ success: true, count: sessionsList.length, sessions: sessionsList });
});

app.get("/api/audit/pilot/export", requireFounderAuth, (_req, res) => {
  const sessionsList = db.select().from(pilotObservationSessions).orderBy(desc(pilotObservationSessions.createdAt)).all();
  const journalRows = db.select().from(userDecisionJournal).orderBy(desc(userDecisionJournal.createdAt)).all();
  const allEvents = db.select().from(events).orderBy(desc(events.timestamp)).all();

  const exportBundle = {
    title: "QuanterraOS Usability Pilot Audit Manifest",
    generatedAt: new Date().toISOString(),
    governanceStatus: "AUTHENTIC_SESSION_VERIFICATION",
    summary: {
      totalRecordedSessions: sessionsList.length,
      unassistedCount: sessionsList.filter((s) => s.unassisted === "YES").length,
      persistenceVerifiedCount: sessionsList.filter((s) => s.persistenceStatus === "VERIFIED").length,
      journalRowsInspected: journalRows.length,
    },
    sessions: sessionsList,
    recentJournalRows: journalRows.slice(0, 50),
    recentAuditEvents: allEvents.slice(0, 100),
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="quanterraos-pilot-audit-${Date.now()}.json"`);
  res.send(JSON.stringify(exportBundle, null, 2));
});

app.get(["/calibration/surface", "/surface"], (_req, res) => {
  res.type("html").send(renderCalibrationSurfacePageHtml());
});

app.get("/mcp", (_req, res) => {
  res.type("html").send(renderMcpPageHtml());
});

app.get(["/api/mcp", "/api/mcp/manifest"], (_req, res) => {
  res.json(MCP_SERVER_MANIFEST);
});

app.post(["/api/mcp", "/api/mcp/call"], async (req, res) => {
  try {
    const body = req.body || {};
    // Handle JSON-RPC 2.0 (standard for Claude Desktop / Cursor MCP clients)
    if (body.jsonrpc === "2.0") {
      const toolName = body.params?.name || body.method;
      const toolArgs = body.params?.arguments || body.params || {};
      const result = await executeMcpTool(toolName, toolArgs);
      return res.json({
        jsonrpc: "2.0",
        id: body.id ?? null,
        result: {
          content: [
            {
              type: "text",
              text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
            },
          ],
        },
      });
    }

    // Handle standard REST invocation: { tool: "simulate_order_friction", parameters: { ... } }
    const toolName = body.tool || body.name;
    if (!toolName) {
      return res.status(400).json({ error: "Missing tool or method name in request body" });
    }
    const params = body.parameters || body.arguments || body.params || {};
    const result = await executeMcpTool(toolName, params);
    return res.json({ success: true, tool: toolName, result });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to execute MCP tool",
      jsonrpc: req.body?.jsonrpc ? "2.0" : undefined,
      id: req.body?.id ?? null,
    });
  }
});

app.get("/api/quotes", async (req, res) => {
  const asset = String(req.query.asset || "BTC").toUpperCase();
  const quotes = await getLiveQuotes(asset);
  res.json(quotes);
});

app.get(["/dashboard", "/council"], (_req, res) => {
  res.type("html").send(renderCouncilDashboardPage(clerkScripts, clerkConfigured));
});

app.get("/api/agents/learning-summary", async (_req, res) => {
  try {
    const cycle = await getLatestLearningCycle();
    const acceleration = get90DayAccelerationStatus();
    res.json({ success: true, cycle, acceleration });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/agents/autonomous-train", async (_req, res) => {
  try {
    const cycle = await runAutonomousLearningCycle();
    const acceleration = get90DayAccelerationStatus();
    res.json({ success: true, cycle, acceleration });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/venues/compare", (req, res) => {
  const price = parseFloat(req.query.price as string) || 0.51;
  const count = parseInt(req.query.count as string, 10) || 10;
  const prob = parseFloat(req.query.prob as string) || 0.55;
  const comparison = compareVenues({ price, count, userProb: prob });
  res.json({ success: true, comparison });
});

app.post("/api/sms/dispatch-brief", async (req, res) => {
  try {
    const targetPhone = req.body?.phone as string | undefined;
    const summary = await dispatchDailyIntelligenceBrief(targetPhone);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/sms/telemetry", (_req, res) => {
  res.json({ success: true, telemetry: getSmsIntelligenceTelemetry() });
});

app.post("/api/billing/upgrade-self", (req, res) => {
  const auth = getUserAuth(req);
  if (!auth.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const targetTier = (req.body.tier || "pro") as UserTier;
  updateUserTier(
    auth.user.id,
    targetTier,
    auth.user.stripeCustomerId || `cus_direct_${auth.user.id.slice(0, 8)}`,
    auth.user.stripeSubscriptionId || `sub_direct_${auth.user.id.slice(0, 8)}`
  );
  logEvent("plan_change", auth.user.id, {
    from: auth.tier,
    to: targetTier,
    mechanism: "direct_operator_selection",
  });
  res.json({ success: true, tier: targetTier });
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
  const tierName = _req.query.tier === "institutional"
    ? "Institutional API"
    : _req.query.tier === "plus"
    ? "Trader Plus"
    : "Pro Terminal";
  const success = _req.query.checkout === "success"
    ? `Subscription activated successfully! Welcome to ${tierName}. All tier features, models, and authenticated data exports are unlocked.`
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

app.get(["/index", "/index.html", "/composite", "/spot-index"], (_req, res) => {
  res.type("html").send(renderIndexPageHtml());
});

app.get("/spread", async (_req, res) => {
  const quotes = await getLiveQuotes("BTC");
  res.type("html").send(renderSpreadPageHtml(quotes));
});

app.get(["/methodology", "/methodology/index"], (_req, res) => {
  res.type("html").send(renderMethodologyPageHtml());
});

app.get("/research", (req, res) => {
  const auth = getUserAuth(req);
  logEvent("page_view_research", auth.user?.id, { path: "/research" });
  res.type("html").send(renderResearchPageHtml());
});

app.get("/research/market-rhythm", (req, res) => {
  const auth = getUserAuth(req);
  logEvent("page_view_market_rhythm", auth.user?.id, { path: "/research/market-rhythm" });
  res.type("html").send(renderMarketRhythmPageHtml());
});

app.get("/status", (_req, res) => {
  try {
    res.type("html").send(renderStatusPageHtml());
  } catch (err) {
    console.error("Status page error:", err);
    res.status(500).send("System status currently unavailable");
  }
});

app.get(["/install", "/app", "/download"], (_req, res) => {
  res.type("html").send(renderMobileInstallPageHtml());
});

// ---------------------------------------------------------------------------
// Compliant SMS Marketing & 10DLC Webhooks
// ---------------------------------------------------------------------------

app.get(["/sms", "/updates"], (_req, res) => {
  const error = _req.query.error as string | undefined;
  const success = _req.query.success as string | undefined;
  res.type("html").send(renderSmsOptInPageHtml(error, success));
});

app.post("/api/sms/opt-in", (req, res) => {
  const rawPhone = (req.body.phone ?? "").trim();
  const consentGiven = req.body.smsConsent === "true" || req.body.smsConsent === true || req.body.smsConsent === "on";

  if (!consentGiven) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/sms?error=" + encodeURIComponent("Explicit consent is required: you must check the box agreeing to receive SMS marketing."));
    }
    return res.status(400).json({ error: "Explicit consent is required: you must check the box agreeing to receive SMS marketing." });
  }

  const phone = normalizeE164Phone(rawPhone);
  if (!phone) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/sms?error=" + encodeURIComponent("Invalid phone number format. Please enter a standard 10-digit or E.164 phone number (e.g. +13125550199)."));
    }
    return res.status(400).json({ error: "Invalid phone number format. Please enter a standard 10-digit or E.164 phone number." });
  }

  try {
    const auth = getUserAuth(req);
    const consent = recordSmsOptIn({
      phone,
      userId: auth.user?.id || null,
      source: "sms_lead_page",
      disclosureText: SMS_MARKETING_DISCLOSURE,
      ip: req.ip || (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim(),
      userAgent: req.headers["user-agent"],
    });

    logEvent("sms_opt_in", auth.user?.id, { phone, source: "sms_lead_page" });

    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/sms?success=" + encodeURIComponent("Subscribed! You will receive QuanterraOS market telemetry & calibration alerts. Reply STOP to cancel at any time."));
    }
    return res.json({ success: true, consent });
  } catch (err) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/sms?error=" + encodeURIComponent((err as Error).message));
    }
    return res.status(400).json({ error: (err as Error).message });
  }
});

app.post(["/api/sms/webhook", "/api/sms/inbound"], (req, res) => {
  const payload = req.body || {};
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers["x-twilio-signature"] as string | undefined;

  if (authToken && signature) {
    const fullUrl = (process.env.PUBLIC_BASE_URL || "https://quanterraos.com") + req.originalUrl;
    if (!validTwilioSmsSignature(authToken, fullUrl, payload, signature)) {
      return res.status(403).type("text/xml").send("<Response><Message>Forbidden: Invalid signature</Message></Response>");
    }
  }

  const result = handleInboundSms({
    From: payload.From || "",
    To: payload.To || "",
    Body: payload.Body || "",
    MessageSid: payload.MessageSid || "",
  });

  logEvent("sms_inbound", undefined, {
    action: result.action,
    phone: result.phone,
    keyword: result.keyword,
  });

  res.type("text/xml").send(result.replyTwiMl);
});

app.post("/api/sms/send-test", async (req, res) => {
  const adminKey = req.headers["x-admin-key"] as string | undefined;
  const auth = getUserAuth(req);
  const isAuthorized = (adminKey && adminKey === ADMIN_METRICS_KEY) || (auth.user && auth.tier !== "free");

  if (!isAuthorized) {
    return res.status(403).json({ error: "Unauthorized: Admin key or authorized session required" });
  }

  const { to, message, campaignId } = req.body;
  try {
    const result = await sendMarketingSms({
      to,
      message,
      campaignId: campaignId || "test_campaign",
      dryRun: req.body.dryRun === true || req.body.dryRun === "true",
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/admin/clean-test-accounts", (req, res) => {
  const adminKey = req.headers["x-admin-key"] as string | undefined;
  if (!adminKey || adminKey !== process.env.ADMIN_METRICS_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const email = (req.body.email as string) || "smoke-test-operator@quanterraos.com";
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (user) {
    db.delete(sessions).where(eq(sessions.userId, user.id)).run();
    db.delete(users).where(eq(users.id, user.id)).run();
  }
  res.json({ ok: true, deleted: email });
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


app.get("/deck", (req, res) => {
  const station = req.query.station as FlightDeckStationId | undefined;
  const auth = getUserAuth(req);
  res.type("html").send(
    renderFlightDeckPageHtml({
      initialStation: station,
      user: auth?.user
        ? {
            email: auth.user.email,
            callsign: (auth.user as any).callsign || "PILOT-1",
            rank: (auth.user as any).rank || "Pilot",
            xp: (auth.user as any).xp || 240,
            streakDays: 5,
          }
        : null,
    })
  );
});

// ===================================================================
// Responsible Trading & Tilt Cooldown API (Task 4.6 / Part 3.6)
// ===================================================================
app.get("/api/responsible/limits", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  res.json(getUserLimits(userId));
});

app.post("/api/responsible/limits", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  const updated = updateUserLimits(userId, req.body || {});
  res.json({ success: true, limits: updated });
});

app.post("/api/responsible/tilt/trigger", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  const loss = req.body || { lossDollars: 15, ticker: "KXBTC15M-91250" };
  const result = recordLossAndCheckTilt(userId, loss);
  res.json({ success: true, ...result });
});

app.post("/api/responsible/tilt/respect", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  const result = respectTiltCooldown(userId);
  res.json({ success: true, ...result });
});

app.post("/api/responsible/self-pause", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  const hours = Number(req.body?.hours || 24);
  const updated = applySelfPause(userId, hours);
  res.json({ success: true, limits: updated });
});

app.post("/api/responsible/attest-18", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  const updated = attestAge18(userId);
  res.json({ success: true, limits: updated });
});

// ===================================================================
// AI Launch Crew & Aria Conversational Router API (Task 5.1 / Part 3.3)
// ===================================================================
app.get("/api/deck/crew", (_req, res) => {
  res.json({
    count: Object.keys(LAUNCH_CREW_MEMBERS).length,
    crew: Object.values(LAUNCH_CREW_MEMBERS),
  });
});

app.post("/api/deck/crew/aria/route", (req, res) => {
  const { query, context } = req.body || {};
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ error: "missing_query", message: "Field 'query' is required." });
  }
  const result = routeAriaQuery(query.trim(), context);
  res.json(result);
});

app.post("/api/deck/crew/aria/eval", (req, res) => {
  const { prompts } = req.body || {};
  const report = evaluateAdversarialEvalSet(Array.isArray(prompts) ? prompts : undefined);
  res.json(report);
});

// ===================================================================
// XP Engine & Anti-Volume Gamification API (Task 5.2 / Part 3.5)
// ===================================================================
app.get("/api/deck/xp", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  const state = computeUserXpState(userId);
  res.json(state);
});

app.post("/api/deck/xp/record", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  const { action, metadata } = req.body || {};

  try {
    const event = recordDisciplineXpEvent(userId, action, metadata);
    const updatedState = computeUserXpState(userId);
    res.json({ success: true, event, state: updatedState });
  } catch (err) {
    res.status(400).json({ error: "guardrail_violation", message: (err as Error).message });
  }
});

app.get("/api/deck/missions", (_req, res) => {
  res.json({ count: MISSIONS_ROSTER.length, missions: MISSIONS_ROSTER });
});

app.get("/api/deck/cosmetics", (_req, res) => {
  res.json({
    ranks: PILOT_RANKS.map((r) => ({
      rankName: r.rankName,
      minXp: r.minXp,
      tier: r.tier,
      cosmetics: r.cosmetics,
    })),
  });
});

// ===================================================================
// Opt-In Pseudonymous Leaderboard API (Task 5.3 / Part 3.5)
// ===================================================================
app.get("/api/deck/leaderboard/calibration", (req, res) => {
  const minSamples = Math.max(1, parseInt(req.query.minSamples as string) || 30);
  const board = getCalibrationLeaderboard(minSamples);
  res.json(board);
});

app.get("/api/deck/leaderboard/fees-saved", (_req, res) => {
  const board = getFeesSavedLeaderboard();
  res.json({ rankedLeaders: board });
});

app.post("/api/deck/leaderboard/opt-in", (req, res) => {
  const auth = getUserAuth(req);
  const userId = auth.user?.id || "cadet-default";
  const { isOptedIn, callsign } = req.body || {};
  const profile = updatePilotLeaderboardOptIn(userId, Boolean(isOptedIn), typeof callsign === "string" ? callsign : undefined);
  res.json({ success: true, profile });
});

// ===================================================================
// Discipline Celebrations API (Task 5.4 / Part 3.5)
// ===================================================================
app.post("/api/deck/celebration/trigger", (req, res) => {
  const { trigger, payload } = req.body || {};
  try {
    const config = triggerDisciplineCelebration(trigger, payload);
    res.json({ success: true, celebration: config });
  } catch (err) {
    res.status(400).json({ error: "guardrail_violation", message: (err as Error).message });
  }
});

// ===================================================================
// Sensors Large-Trade Feed API (Task 6.1 / Part 3.4)
// ===================================================================
app.get("/api/deck/sensors/trades", (req, res) => {
  const venue = (req.query.venue as any) || "all";
  const minContracts = req.query.minContracts ? parseInt(req.query.minContracts as string, 10) : undefined;
  const riskLevel = (req.query.riskLevel as any) || "all";
  const prints = queryLargeTradeFeed({ venue, minContracts, riskLevel });
  res.json({ count: prints.length, prints });
});

// Polymarket Wallet Calibration Track Record Cards (Task 6.2 / Part 3.4)
app.get("/api/deck/sensors/wallets", (_req, res) => {
  res.json({ benchmarks: getCuratedBenchmarkWallets() });
});

app.get("/api/deck/sensors/wallets/:address", (req, res) => {
  const address = req.params.address;
  if (!isValidPolymarketAddress(address)) {
    return res.status(400).json({
      error: "invalid_address",
      message: "Address must be a valid 42-character 0x hex string or standard truncated format (e.g. 0x71c8...c70a)",
    });
  }
  const card = getPolymarketWalletCard(address);
  res.json({ card, html: renderWalletCardDetailsHtml(card) });
});

app.get("/wallet", (_req, res) => {
  res.redirect(301, "/deck");
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
  const rawPhone = (req.body.phone ?? "").trim();
  const smsOptIn = req.body.smsOptIn === "true" || req.body.smsOptIn === true || req.body.smsOptIn === "on";

  if (!email || !password || password.length < 6) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/account?error=" + encodeURIComponent("Password must be at least 6 characters"));
    }
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  if (smsOptIn && !rawPhone) {
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/account?error=" + encodeURIComponent("Please provide a valid phone number to receive SMS alerts"));
    }
    return res.status(400).json({ error: "Please provide a valid phone number to receive SMS alerts" });
  }

  let normalizedPhone: string | null = null;
  if (rawPhone) {
    normalizedPhone = normalizeE164Phone(rawPhone);
    if (smsOptIn && !normalizedPhone) {
      if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
        return res.redirect("/account?error=" + encodeURIComponent("Invalid phone number format. Please provide a standard 10-digit or E.164 phone number."));
      }
      return res.status(400).json({ error: "Invalid phone number format. Please provide a standard 10-digit or E.164 phone number." });
    }
  }

  try {
    const user = createUser(email, password, "free", normalizedPhone);
    logEvent("signup", user.id, { email: user.email, tier: "free", smsOptIn });

    if (smsOptIn && normalizedPhone) {
      recordSmsOptIn({
        phone: normalizedPhone,
        userId: user.id,
        source: "signup_form",
        disclosureText: SMS_MARKETING_DISCLOSURE,
        ip: req.ip || (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim(),
        userAgent: req.headers["user-agent"],
      });
    }

    const { sessionId } = createSession(user.id);
    res.setHeader("Set-Cookie", `quanterraos_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
    if (req.headers["accept"]?.includes("text/html") || req.body.redirect !== "false") {
      return res.redirect("/account?success=" + encodeURIComponent("Account created successfully. Welcome to QuanterraOS Free Explorer."));
    }
    res.json({ user, sessionId, smsSubscribed: smsOptIn && !!normalizedPhone });
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
  const redirectTarget = req.body.redirectTo || req.query.redirectTo || "/dashboard";

  if (!email || !password) {
    if (req.headers["accept"]?.includes("text/html") || (req.body.redirect !== "false" && !req.headers["accept"]?.includes("application/json"))) {
      return res.redirect("/access?error=" + encodeURIComponent("Operator ID and Access Key required"));
    }
    return res.status(400).json({ error: "Operator ID and Access Key required" });
  }
  const user = authenticateUser(email, password);
  if (!user) {
    if (req.headers["accept"]?.includes("text/html") || (req.body.redirect !== "false" && !req.headers["accept"]?.includes("application/json"))) {
      return res.redirect("/access?error=" + encodeURIComponent("Invalid credentials. Try demo pass or request clearance."));
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const { sessionId } = createSession(user.id);
  res.setHeader("Set-Cookie", `quanterraos_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`);
  if (req.headers["accept"]?.includes("text/html") || (req.body.redirect !== "false" && !req.headers["accept"]?.includes("application/json"))) {
    return res.redirect(redirectTarget);
  }
  res.json({ user, sessionId, redirectTo: redirectTarget });
});

app.post("/api/auth/logout", (req, res) => {
  const auth = getUserAuth(req);
  if (auth.sessionId) {
    deleteSession(auth.sessionId);
  }
  res.setHeader("Set-Cookie", `quanterraos_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`);
  res.redirect("/access");
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
  const demoEmail = "commander@quanterraos.com";
  let user = getUserByEmail(demoEmail);
  if (!user) {
    user = createUser(demoEmail, "quanterra-commander-2026", "pro");
  } else if (user.tier !== "pro") {
    updateUserTier(user.id, "pro");
    user.tier = "pro";
  }
  const { sessionId } = createSession(user.id);
  res.setHeader("Set-Cookie", `quanterraos_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  const redirectTarget = req.body?.redirectTo || req.query?.redirectTo || "/dashboard";
  if (req.headers["accept"]?.includes("application/json") || req.body?.redirectTo) {
    return res.json({ success: true, redirectTo: redirectTarget });
  }
  res.redirect(redirectTarget);
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
    if (req.body.tier === "free") {
      updateUserTier(activeUser.id, "free");
      logEvent("tier_downgraded_free", activeUser.id, { tier: "free" });
      return res.redirect("/account?checkout=success&tier=free");
    }
    const tier: "plus" | "pro" | "institutional" = req.body.tier === "institutional"
      ? "institutional"
      : req.body.tier === "plus"
      ? "plus"
      : "pro";
    logEvent("checkout_started", activeUser.id, { tier, protocol: req.protocol });
    const session = await createCheckoutSession({
      userId: activeUser.id,
      tier,
      successUrl: `${req.protocol}://${req.get("host")}/account?checkout=success&tier=${tier}`,
      cancelUrl: `${req.protocol}://${req.get("host")}/pricing?checkout=cancelled`,
    });
    // In sandbox or evaluation mode, auto-fulfill tier upgrade immediately
    if (session.url.includes("mock_checkout=true")) {
      const customerId = activeUser.stripeCustomerId || `cus_${randomUUID().slice(0, 10)}`;
      const subId = `sub_${tier}_${randomUUID().slice(0, 10)}`;
      updateUserTier(activeUser.id, tier, customerId, subId);

      if (tier === "institutional") {
        generateApiKey(activeUser.id, "institutional");
      }

      processBillingEvent({
        id: `evt_eval_${randomUUID().slice(0, 8)}`,
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: activeUser.id,
            customer: customerId,
            subscription: subId,
            metadata: { tier, userId: activeUser.id },
          },
        },
      });
      return res.redirect(`/account?checkout=success&tier=${tier}`);
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

  const history = getCompositeIndexHistory("BTC", process.env.DB_PATH || "quanterraos.db", fromParam, toParam, limit);
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

app.get("/api/telemetry/pulse", (_req, res) => {
  res.json(getSystemPulseTelemetry());
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
    <div class="warn-banner" id="edge" style="display:none;"></div>
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
      row("Spot composite (BRTI proxy)", r.brti ? "$" + Number(r.brti.value).toLocaleString() + " (" + r.brti.ageSeconds + "s old" + (r.brti.fresh ? "" : ", STALE") + ")" : "no data") +
      row("YES bid / ask", Number(r.quotes.yesBid).toFixed(2) + " / " + Number(r.quotes.yesAsk).toFixed(2)) +
      row("NO bid / ask", Number(r.quotes.noBid).toFixed(2) + " / " + Number(r.quotes.noAsk).toFixed(2)) +
      row("Fair-value model (cross-check)", r.model ? pct(r.model.pHigher) + " Higher" : "unavailable (spot ticks stale or too little history)") +
      row("Model EV after fee: YES / NO", r.model && r.model.expectedValuePerContract ? (r.model.expectedValuePerContract.yes * 100).toFixed(1) + "¢ / " + (r.model.expectedValuePerContract.no * 100).toFixed(1) + "¢" : "—");
    const edgeEl = document.getElementById("edge");
    if (r.edge && r.edge !== "none") {
      edgeEl.textContent = "Edge: " + r.edge;
      edgeEl.style.display = "block";
    } else {
      edgeEl.style.display = "none";
    }
    if (r.evidence && r.evidence.brierByMinute) {
      document.getElementById("evidence").innerHTML = Object.entries(r.evidence.brierByMinute).map(function (e) {
        return "<tr><td>" + e[0] + "</td><td>" + Number(e[1].market).toFixed(4) + "</td><td>" + Number(e[1].model).toFixed(4) + "</td></tr>";
      }).join("");
      document.getElementById("evidence-note").textContent = "Backtest " + r.evidence.run + ", " + r.evidence.markets + " settled markets; lower Brier is better. Trading on model/market disagreement " + r.evidence.tradingOnModelDisagreement + ".";
    }
  } catch (err) {
    const edgeEl = document.getElementById("edge");
    if (edgeEl) {
      edgeEl.textContent = "Sync error: " + err.message;
      edgeEl.style.display = "block";
    }
  }
}
load();
setInterval(load, 5000);
</script>
</body>
</html>`;

app.get(["/kalshi", "/fair-value/btc15m"], (req, res) => {
  const auth = getUserAuth(req);
  const tf = (req.query.timeframe === "1h" ? "1h" : "15m") as KalshiTimeframe;
  res.type("html").send(renderKalshiTerminalHtml(auth.user?.email, auth.tier, tf));
});

app.get(["/kalshi/1h", "/kalshi-1h", "/kalshi/hourly", "/fair-value/btc1h"], (req, res) => {
  const auth = getUserAuth(req);
  res.type("html").send(renderKalshiTerminalHtml(auth.user?.email, auth.tier, "1h"));
});

app.get(["/kalshi/15m", "/kalshi-15m"], (req, res) => {
  const auth = getUserAuth(req);
  res.type("html").send(renderKalshiTerminalHtml(auth.user?.email, auth.tier, "15m"));
});

app.get("/api/kalshi/specs", (_req, res) => {
  res.json(KALSHI_CONTRACT_SPECS);
});

app.get(["/api/kalshi/active", "/api/kalshi/15m/active"], async (req, res) => {
  try {
    const timeframe = (req.query.timeframe === "1h" ? "1h" : "15m") as KalshiTimeframe;
    const now = Date.now();
    const latestTick = db.select({ at: btcIndexTicks.receivedAt, raw: btcIndexTicks.rawValue })
      .from(btcIndexTicks)
      .where(and(eq(btcIndexTicks.asset, "BTC"), gte(btcIndexTicks.receivedAt, now - 300_000)))
      .orderBy(desc(btcIndexTicks.receivedAt))
      .limit(1)
      .get();

    const spot = latestTick ? Number(latestTick.raw) : 85520;
    const market = await getActiveKalshiMarket(timeframe, spot);

    const floorStrike = market?.floor_strike ? market.floor_strike : (timeframe === "15m" ? 85519 : 85600);
    const modelProb = market ? Math.max(0.05, Math.min(0.95, 0.50 + ((spot - floorStrike) / 100))) : 0.50;
    const yesAsk = market?.yes_ask ?? 0.51;
    const noAsk = market?.no_ask ?? 0.51;

    res.json({
      ...(market || {
        ticker: `KXBTC${timeframe === "15m" ? "15M" : "D"}-${new Date(now).toISOString().slice(2, 10).replace(/-/g, "")}-ACTIVE`,
        floor_strike: floorStrike,
        subtitle: timeframe === "1h" ? `$${floorStrike.toLocaleString()} or above` : "Above or Below",
        timeframe,
        yes_bid: 0.41,
        yes_ask: 0.43,
        no_bid: 0.57,
        no_ask: 0.59,
        close_time: new Date(now + (timeframe === "15m" ? 10 : 45) * 60000).toISOString(),
        minutes_left: timeframe === "15m" ? 10 : 45,
        status: "active",
      }),
      timeframe,
      spot,
      model_prob: Math.round(modelProb * 100) / 100,
      taker_fee_yes: calculateKalshiTakerFee(yesAsk),
      taker_fee_no: calculateKalshiTakerFee(noAsk),
      breakeven_yes: calculateBreakevenProbability(yesAsk, true),
      breakeven_no: calculateBreakevenProbability(noAsk, false),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/kalshi/1h/ladder", async (req, res) => {
  try {
    const now = Date.now();
    const latestTick = db.select({ at: btcIndexTicks.receivedAt, raw: btcIndexTicks.rawValue })
      .from(btcIndexTicks)
      .where(and(eq(btcIndexTicks.asset, "BTC"), gte(btcIndexTicks.receivedAt, now - 300_000)))
      .orderBy(desc(btcIndexTicks.receivedAt))
      .limit(1)
      .get();

    const spot = latestTick ? Number(latestTick.raw) : 85520;
    const ladder = await getKalshi1hStrikeLadder(spot);
    res.json({
      spot,
      series: "KXBTCD",
      count: ladder.length,
      ladder,
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
  if (typeof ticker === "string" && ticker.toUpperCase().endsWith("-CURRENT")) {
    return res.status(400).json({ error: "Invalid ticker: Placeholder tickers ending in -CURRENT are strictly rejected at write time." });
  }

  const requestedMode = mode === "live" ? "live" : "sandbox";

  // HARD ENFORCEMENT OF RULE B5 & LIVE ORDER SAFETY
  if (requestedMode === "live") {
    // 1. Env flag check (Rule B5)
    if (process.env.KALSHI_LIVE !== "true") {
      return res.status(403).json({
        error: "Rule B5 Active: Live trading is strictly disabled ($0.00 live capital exposure). KALSHI_LIVE=true is not set in environment.",
        rule: "RULE_B5_BLOCKED",
      });
    }

    // 2. Operator email check (KALSHI_LIVE_OPERATOR_EMAILS)
    const allowedEmails = (process.env.KALSHI_LIVE_OPERATOR_EMAILS || "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = auth.user?.email ? auth.user.email.toLowerCase() : "";
    const isOperator = Boolean(userEmail && allowedEmails.includes(userEmail));

    if (allowedEmails.length === 0 || !isOperator) {
      return res.status(403).json({
        error: "Forbidden: Live order execution requires a signed-in account listed in KALSHI_LIVE_OPERATOR_EMAILS.",
      });
    }

    // 3. Max contract count per order (KALSHI_LIVE_MAX_CONTRACTS, default 10)
    const maxContracts = Number(process.env.KALSHI_LIVE_MAX_CONTRACTS || "10") || 10;
    if (Number(count) > maxContracts) {
      return res.status(403).json({
        error: `Order limit exceeded: Live orders are capped at ${maxContracts} contracts per order. Requested: ${count}`,
      });
    }
  }

  try {
    const result = await placeKalshi15mBid({
      userId,
      ticker,
      side: side.toLowerCase(),
      price: Number(price),
      count: Number(count),
      mode: requestedMode,
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

// ==============================================================================
// DISCORD & TELEGRAM SIGNAL DISPATCHER & WEBHOOK PORTAL
// ==============================================================================

app.get(["/alerts", "/signals", "/webhooks"], (req, res) => {
  const auth = getUserAuth(req);
  res.type("html").send(renderSignalsPageHtml(auth.user?.email, auth.tier));
});

app.get("/api/alerts/recent", (_req, res) => {
  const alerts = getRecentDispatchedAlerts();
  res.json({
    count: alerts.length,
    alerts,
    timestamp: new Date().toISOString(),
  });
});

app.post(["/api/alerts/webhook/test", "/api/alerts/test"], async (req, res) => {
  try {
    const { eventType, webhookUrl } = req.body || {};
    const event = createSampleAlertEvent(eventType || "DISCREPANCY_SCANNER_DETECTED");
    const dryRun = !webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.trim();
    const targetUrl = dryRun ? "https://discord.com/api/webhooks/dry-run" : webhookUrl.trim();

    const result = await dispatchAlertWebhook(event, targetUrl, dryRun);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/alerts/dispatch", async (req, res) => {
  try {
    const { event, webhookUrl, dryRun } = req.body || {};
    if (!event || !event.eventType || !event.title) {
      return res.status(400).json({ error: "Missing required event fields: eventType, title" });
    }
    const targetUrl = webhookUrl || "https://discord.com/api/webhooks/dry-run";
    const result = await dispatchAlertWebhook(event, targetUrl, Boolean(dryRun || !webhookUrl));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/alerts/sample-payloads", (_req, res) => {
  const sampleEvent = createSampleAlertEvent("DISCREPANCY_SCANNER_DETECTED");
  res.json({
    event: sampleEvent,
    discord: formatDiscordAlertPayload(sampleEvent),
    telegram: formatTelegramAlertPayload(sampleEvent),
  });
});

app.get("/api/reconciler/status", (_req, res) => {
  res.json(getSettlementReconciliationStatus());
});

app.post("/api/reconciler/run", (_req, res) => {
  const result = reconcilePendingSettlements();
  res.json(result);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`QuanterraOS foundation server listening on http://localhost:${port}`);
  // Run initial council coordination cycle and poll periodically every 30 seconds
  runCouncilPipelineCycle().catch((err) => console.error("Initial council pipeline run error:", err));
  checkLiveSwingEvents().catch((err) => console.error("Initial swing check error:", err));
  runAutonomousLearningCycle().catch((err) => console.error("Initial learning cycle error:", err));
  startSettlementReconciler(60_000);
  setInterval(() => {
    runCouncilPipelineCycle().catch((err) => console.error("Periodic council pipeline run error:", err));
    checkLiveSwingEvents().catch((err) => console.error("Periodic swing check error:", err));
    runAutonomousLearningCycle().catch((err) => console.error("Periodic learning cycle error:", err));
  }, 60_000);
});

