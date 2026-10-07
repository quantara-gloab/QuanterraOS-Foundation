/**
 * QuanterraOS core schema.
 *
 * Founder/audit/observation tables are reconstructed from the column
 * names documented in the 2026-09-20 merge patch's SQL comments — they
 * were never seen directly, so verify field names against your real
 * schema.ts before running this against production data. Everything
 * from `researchResolutions` down is new: the outcome-resolution half
 * from the merge patch, plus the currency-index tables needed for the
 * edge-score product (raw ticks, the composite index, and computed
 * edge scores per contract).
 */
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Existing tables (reconstructed — verify against your real schema.ts)
// ---------------------------------------------------------------------------

export const founderAudit = sqliteTable("founder_audit", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  action: text("action").notNull(),
  detail: text("detail"),
  at: text("at").notNull(),
});

export const founderControls = sqliteTable(
  "founder_controls",
  {
    owner: text("owner").notNull(),
    key: text("key").notNull(),
    verified: integer("verified").notNull().default(0),
    note: text("note"),
    updated: text("updated").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.owner, table.key] }),
  }),
);

export const researchObservations = sqliteTable("research_observations", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  contract: text("contract").notNull(),
  source: text("source").notNull(),
  direction: text("direction").notNull(),
  hypothesis: text("hypothesis").notNull(),
  probability: real("probability"), // null = abstained
  created: text("created").notNull(),
});

// ---------------------------------------------------------------------------
// Outcome resolution (from the 2026-09-20 merge patch)
// ---------------------------------------------------------------------------

export const researchResolutions = sqliteTable(
  "research_resolutions",
  {
    owner: text("owner").notNull(),
    contract: text("contract").notNull(),
    outcome: text("outcome").notNull(), // 'YES' | 'NO' | 'VOID'
    officialSource: text("official_source").notNull(),
    resolvedAt: text("resolved_at").notNull(),
    correctionOf: text("correction_of"),
    correctionReason: text("correction_reason"),
    finalized: integer("finalized").notNull().default(1),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.owner, table.contract] }),
  }),
);

export const researchResolutionHistory = sqliteTable(
  "research_resolution_history",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    contract: text("contract").notNull(),
    outcome: text("outcome").notNull(),
    officialSource: text("official_source").notNull(),
    resolvedAt: text("resolved_at").notNull(),
    reason: text("reason"),
    finalized: integer("finalized").notNull().default(1),
  },
  (table) => ({
    ownerContractIdx: index("resolution_history_owner_contract").on(
      table.owner,
      table.contract,
    ),
  }),
);

// ---------------------------------------------------------------------------
// Currency-index / edge-score tables (new)
// ---------------------------------------------------------------------------

/** One row per (venue, asset, timestamp) tick pulled from the licensed
 * aggregator. Kept raw and short-lived — roll up into composite_index_ticks
 * and prune old rows once the composite has been computed. */
export const exchangeTicks = sqliteTable(
  "exchange_ticks",
  {
    id: text("id").primaryKey(),
    venue: text("venue").notNull(),
    asset: text("asset").notNull(),
    price: real("price").notNull(),
    volume: real("volume").notNull(),
    observedAt: text("observed_at").notNull(),
  },
  (table) => ({
    assetTimeIdx: index("exchange_ticks_asset_time").on(
      table.asset,
      table.observedAt,
    ),
  }),
);

/** One row per (asset, timestamp): the computed composite index value,
 * with the inputs that produced it kept for audit/backtesting. */
export const compositeIndexTicks = sqliteTable(
  "composite_index_ticks",
  {
    id: text("id").primaryKey(),
    asset: text("asset").notNull(),
    compositePrice: real("composite_price").notNull(),
    venuesUsed: integer("venues_used").notNull(),
    venuesRejected: integer("venues_rejected").notNull().default(0),
    computedAt: text("computed_at").notNull(),
  },
  (table) => ({
    assetTimeIdx: index("composite_index_asset_time").on(
      table.asset,
      table.computedAt,
    ),
  }),
);

/** One row per edge-score computation shown to a user for a specific
 * live Kalshi (or similar) contract. Kept even when no edge was found,
 * so the calibration page can show "flagged vs. skipped" performance
 * side by side, not just the trades we recommended. */
export const edgeScores = sqliteTable(
  "edge_scores",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    contract: text("contract").notNull(),
    bucket: text("bucket").notNull(), // '15min' | '1hr' | '1day'
    fairProbability: real("fair_probability").notNull(),
    breakevenProbability: real("breakeven_probability").notNull(),
    edge: real("edge").notNull(), // fairProbability - breakevenProbability
    flagged: integer("flagged").notNull(), // 1 if edge cleared the threshold
    marketAsk: real("market_ask").notNull(),
    feeEstimate: real("fee_estimate").notNull(),
    computedAt: text("computed_at").notNull(),
  },
  (table) => ({
    ownerContractIdx: index("edge_scores_owner_contract").on(
      table.owner,
      table.contract,
    ),
    bucketIdx: index("edge_scores_bucket").on(table.bucket),
  }),
);

export const btcIndexTicks = sqliteTable(
  "btc_index_ticks",
  {
    id: text("id").primaryKey(),
    receivedAt: integer("received_at").notNull(),
    loggedAt: text("logged_at").notNull(),
    rawValue: text("raw_value").notNull(),
    trailing60sAvg: text("trailing_60s_avg"),
    rawJson: text("raw_json").notNull(),
    asset: text("asset").notNull().default("BTC"),
  },
  (table) => ({
    receivedAtIdx: index("btc_index_ticks_received_at").on(table.receivedAt),
  }),
);

export const exchangePrices = sqliteTable(
  "exchange_prices",
  {
    id: text("id").primaryKey(),
    exchangeName: text("exchange_name").notNull(),
    price: real("price").notNull(),
    fetchedAt: integer("fetched_at").notNull(),
    asset: text("asset").notNull().default("BTC"),
  },
  (table) => ({
    exchangeTimeIdx: index("exchange_prices_exchange_time").on(
      table.exchangeName,
      table.fetchedAt,
    ),
  }),
);

export const marketOutcomes = sqliteTable(
  "market_outcomes",
  {
    id: text("id").primaryKey(),
    marketTicker: text("market_ticker").notNull().unique(),
    strikePrice: real("strike_price"),
    openTime: integer("open_time").notNull(),
    closeTime: integer("close_time").notNull(),
    result: text("result").notNull(),
    fetchedAt: integer("fetched_at").notNull(),
    asset: text("asset").notNull().default("BTC"),
  },
  (table) => ({
    closeTimeIdx: index("market_outcomes_close_time").on(table.closeTime),
  }),
);

export const orderbookSnapshots = sqliteTable(
  "orderbook_snapshots",
  {
    id: text("id").primaryKey(),
    asset: text("asset").notNull(),
    marketTicker: text("market_ticker").notNull(),
    capturedAt: integer("captured_at").notNull(),
    bestYesPrice: real("best_yes_price"),
    bestNoPrice: real("best_no_price"),
    bestYesSize: real("best_yes_size"),
    bestNoSize: real("best_no_size"),
    topImbalance: real("top_imbalance"),
    depthImbalance: real("depth_imbalance"),
    yesLevelsJson: text("yes_levels_json").notNull(),
    noLevelsJson: text("no_levels_json").notNull(),
  },
  (table) => ({
    assetMarketTimeIdx: index("orderbook_snapshots_asset_market_time").on(
      table.asset,
      table.marketTicker,
      table.capturedAt,
    ),
  }),
);

export const falconRecommendations = sqliteTable(
  "falcon_recommendations",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    contract: text("contract").notNull(),
    suggestedProbability: real("suggested_probability").notNull(),
    rationale: text("rationale").notNull(),
    evidenceJson: text("evidence_json").notNull(),
    status: text("status").notNull().default("proposed"),
    finalProbability: real("final_probability"),
    observationId: text("observation_id"),
    createdAt: text("created_at").notNull(),
    decidedAt: text("decided_at"),
  },
  (table) => ({
    ownerContractIdx: index("falcon_recommendations_owner_contract").on(
      table.owner,
      table.contract,
    ),
  }),
);

/**
 * Paper trades — every BUY/SKIP decision from the high/low barrier model
 * is logged here unconditionally, so the track record shows flag rate
 * alongside hit rate (mirroring falcon_recommendations' "log always,
 * score later" convention).
 */
export const paperTrades = sqliteTable(
  "paper_trades",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    contract: text("contract").notNull(),
    modelProbability: real("model_probability").notNull(),
    modelSource: text("model_source").notNull(), // 'quant' | 'jev'
    barrierType: text("barrier_type").notNull(), // 'high' | 'low'
    side: text("side"), // 'yes' | 'no' | null (null = skip)
    decision: text("decision").notNull(), // 'buy' | 'skip'
    entryPrice: real("entry_price"), // null when skipped
    breakevenProbability: real("breakeven_probability").notNull(),
    edge: real("edge").notNull(),
    feeEstimate: real("fee_estimate").notNull(),
    rationale: text("rationale").notNull(),
    evidenceJson: text("evidence_json").notNull(),
    status: text("status").notNull().default("proposed"), // 'proposed' | 'resolved'
    resolvedAt: text("resolved_at"),
    outcome: text("outcome"), // 'YES' | 'NO' | 'VOID' | null
    brierScore: real("brier_score"),
    pnl: real("pnl"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    ownerContractIdx: index("paper_trades_owner_contract").on(
      table.owner,
      table.contract,
    ),
    statusIdx: index("paper_trades_status").on(table.status),
  }),
);

export const councilPipelineRuns = sqliteTable(
  "council_pipeline_runs",
  {
    id: text("id").primaryKey(),
    runAt: text("run_at").notNull(),
    cycleNumber: integer("cycle_number").notNull(),
    lionVerdict: text("lion_verdict").notNull(),
    lionVerdictCode: text("lion_verdict_code").notNull(),
    marketCalibrated: integer("market_calibrated").notNull().default(1),
    signalValidated: integer("signal_validated").notNull().default(0),
    executionAuthorized: integer("execution_authorized").notNull().default(0),
    phoenixStatus: text("phoenix_status").notNull(),
    dracoStatus: text("draco_status").notNull(),
    wolfStatus: text("wolf_status").notNull(),
    falconStatus: text("falcon_status").notNull(),
    quantumFoxStatus: text("quantum_fox_status").notNull(),
    sentinelStatus: text("sentinel_status").notNull(),
    krakenStatus: text("kraken_status").notNull(),
    marketTicker: text("market_ticker"),
    marketQuoteJson: text("market_quote_json"),
    allAgentsJson: text("all_agents_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    runAtIdx: index("council_pipeline_runs_run_at").on(table.runAt),
    cycleIdx: index("council_pipeline_runs_cycle").on(table.cycleNumber),
  }),
);

export const councilChatLogs = sqliteTable(
  "council_chat_logs",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    agentName: text("agent_name").notNull(),
    userMessage: text("user_message").notNull(),
    assistantReply: text("assistant_reply").notNull(),
    citationsJson: text("citations_json").notNull(),
    guarded: integer("guarded").notNull().default(0),
    violationsJson: text("violations_json"),
    pipelineCycleNumber: integer("pipeline_cycle_number"),
    durationMs: integer("duration_ms").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    agentIdx: index("council_chat_logs_agent_idx").on(table.agentId),
    createdAtIdx: index("council_chat_logs_created_at_idx").on(table.createdAt),
  }),
);

/**
 * Immutable Prediction Ledger.
 * Written before the market settles; immutable once written.
 * Only the settlement scorer writes outcome and brier_score upon market resolution.
 */
export const predictions = sqliteTable(
  "predictions",
  {
    id: text("id").primaryKey(),
    marketId: text("market_id").notNull(),
    timestamp: text("timestamp").notNull(),
    predictedProb: real("predicted_prob").notNull(),
    modelVersion: text("model_version").notNull(),
    status: text("status").notNull().default("PENDING"), // 'PENDING' | 'SETTLED'
    outcome: text("outcome"), // 'YES' | 'NO' | 'VOID'
    brierScore: real("brier_score"),
    settledAt: text("settled_at"),
    isReplay: integer("is_replay").notNull().default(0),
    notes: text("notes"),
  },
  (table) => ({
    marketIdx: index("predictions_market_id_idx").on(table.marketId),
    statusIdx: index("predictions_status_idx").on(table.status),
    isReplayIdx: index("predictions_is_replay_idx").on(table.isReplay),
    timestampIdx: index("predictions_timestamp_idx").on(table.timestamp),
  }),
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    tier: text("tier").notNull().default("free"), // 'free' | 'pro' | 'institutional'
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    tierIdx: index("users_tier_idx").on(table.tier),
    stripeCustIdx: index("users_stripe_cust_idx").on(table.stripeCustomerId),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
  }),
);

export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    tier: text("tier").notNull().default("institutional"),
    createdAt: text("created_at").notNull(),
    revokedAt: text("revoked_at"),
  },
  (table) => ({
    userIdIdx: index("api_keys_user_id_idx").on(table.userId),
    keyHashIdx: index("api_keys_key_hash_idx").on(table.keyHash),
  }),
);

export const billingEvents = sqliteTable(
  "billing_events",
  {
    id: text("id").primaryKey(),
    stripeEventId: text("stripe_event_id"),
    eventType: text("event_type").notNull(),
    userId: text("user_id"),
    payloadJson: text("payload_json"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("billing_events_user_id_idx").on(table.userId),
    typeIdx: index("billing_events_type_idx").on(table.eventType),
  }),
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    eventName: text("event_name").notNull(),
    timestamp: text("timestamp").notNull(),
    metadata: text("metadata"),
  },
  (table) => ({
    userIdIdx: index("events_user_id_idx").on(table.userId),
    nameIdx: index("events_name_idx").on(table.eventName),
    timestampIdx: index("events_timestamp_idx").on(table.timestamp),
  }),
);

export const subscriberWallets = sqliteTable(
  "subscriber_wallets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    balanceUsd: real("balance_usd").notNull().default(10000.0),
    balanceBtc: real("balance_btc").notNull().default(0.25),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("subscriber_wallets_user_id_idx").on(table.userId),
  }),
);

export const walletTransactions = sqliteTable(
  "wallet_transactions",
  {
    id: text("id").primaryKey(),
    walletId: text("wallet_id").notNull(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(), // 'SIMULATED_DEPOSIT' | 'SIMULATED_WITHDRAWAL' | 'RESET'
    currency: text("currency").notNull(), // 'USD' | 'BTC' | 'USDC'
    amount: real("amount").notNull(),
    txHash: text("tx_hash").notNull(),
    status: text("status").notNull().default("CONFIRMED"),
    destinationAddress: text("destination_address"),
    description: text("description"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    walletIdIdx: index("wallet_transactions_wallet_id_idx").on(table.walletId),
    userIdIdx: index("wallet_transactions_user_id_idx").on(table.userId),
    createdAtIdx: index("wallet_transactions_created_at_idx").on(table.createdAt),
  }),
);

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    company: text("company"),
    title: text("title"),
    source: text("source").notNull(),
    status: text("status").notNull().default("new"),
    tierInterest: text("tier_interest").notNull().default("free"),
    touches: integer("touches").notNull().default(0),
    lastContactAt: text("last_contact_at"),
    nextFollowupAt: text("next_followup_at"),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    emailIdx: index("leads_email_idx").on(table.email),
    statusIdx: index("leads_status_idx").on(table.status),
  }),
);

export const adSpendCaps = sqliteTable(
  "ad_spend_caps",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull().unique(), // 'google' | 'meta'
    dailyCapUsd: real("daily_cap_usd").notNull().default(100.0),
    monthlyCapUsd: real("monthly_cap_usd").notNull().default(2500.0),
    currentDaySpendUsd: real("current_day_spend_usd").notNull().default(0.0),
    currentMonthSpendUsd: real("current_month_spend_usd").notNull().default(0.0),
    circuitLocked: integer("circuit_locked").notNull().default(1),
    approvedBy: text("approved_by"),
    updatedAt: text("updated_at").notNull(),
  },
);

export const adSpendLedger = sqliteTable(
  "ad_spend_ledger",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(),
    campaignName: text("campaign_name").notNull(),
    targetUrl: text("target_url").notNull(),
    amountUsd: real("amount_usd").notNull(),
    status: text("status").notNull(), // 'APPROVED' | 'BLOCKED_CAP_EXCEEDED'
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull(),
  },
);

export const contentDrafts = sqliteTable(
  "content_drafts",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    category: text("category").notNull(), // 'weekly_ledger' | 'findings_faq' | 'predictions_social' | 'blog'
    draftText: text("draft_text").notNull(),
    provenanceSources: text("provenance_sources").notNull(), // JSON array
    guardrailStatus: text("guardrail_status").notNull(), // 'PASSED' | 'FLAGGED'
    guardrailViolations: text("guardrail_violations"), // JSON array
    reviewStatus: text("review_status").notNull().default("PENDING_HUMAN_APPROVAL"),
    approvedAt: text("approved_at"),
    createdAt: text("created_at").notNull(),
  },
);

export const institutionalPipeline = sqliteTable(
  "institutional_pipeline",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id").notNull(),
    targetDesk: text("target_desk").notNull(),
    targetTier: text("target_tier").notNull().default("INSTITUTIONAL"),
    stage: text("stage").notNull().default("IDENTIFIED"),
    researchDossier: text("research_dossier"),
    autoSendBlocked: integer("auto_send_blocked").notNull().default(1),
    owner: text("owner").notNull().default("Michael Quantara"),
    dealValueMonthlyUsd: real("deal_value_monthly_usd").notNull().default(750.0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    leadIdIdx: index("inst_pipe_lead_id_idx").on(table.leadId),
    stageIdx: index("inst_pipe_stage_idx").on(table.stage),
  }),
);

// ---------------------------------------------------------------------------
// Compliant SMS Marketing & 10DLC Consent Ledger
// ---------------------------------------------------------------------------

export const smsConsents = sqliteTable(
  "sms_consents",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull().unique(), // E.164 formatted
    userId: text("user_id"),
    leadId: text("lead_id"),
    status: text("status").notNull().default("subscribed"), // 'subscribed' | 'unsubscribed'
    consentTimestamp: text("consent_timestamp").notNull(),
    consentSource: text("consent_source").notNull(),
    disclosureText: text("disclosure_text").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    optOutTimestamp: text("opt_out_timestamp"),
    optOutReason: text("opt_out_reason"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    phoneIdx: index("sms_consents_phone_idx").on(table.phone),
    statusIdx: index("sms_consents_status_idx").on(table.status),
    userIdIdx: index("sms_consents_user_id_idx").on(table.userId),
  }),
);

export const smsSendLog = sqliteTable(
  "sms_send_log",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull(),
    messageBody: text("message_body").notNull(),
    campaignId: text("campaign_id"),
    status: text("status").notNull(), // 'sent' | 'blocked' | 'failed' | 'dry_run'
    providerSid: text("provider_sid"),
    errorDetail: text("error_detail"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    phoneIdx: index("sms_send_log_phone_idx").on(table.phone),
    createdAtIdx: index("sms_send_log_created_at_idx").on(table.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// Autonomous Executive AI Continuous Learning & Self-Training Cycles
// ---------------------------------------------------------------------------

export const autonomousLearningCycles = sqliteTable(
  "autonomous_learning_cycles",
  {
    id: text("id").primaryKey(),
    cycleNumber: integer("cycle_number").notNull(),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at").notNull(),
    durationMs: integer("duration_ms").notNull(),
    brierBaseline: real("brier_baseline").notNull(),
    modelDivergence: real("model_divergence").notNull(),
    hypothesesEvaluated: integer("hypotheses_evaluated").notNull().default(0),
    hypothesesPassed: integer("hypotheses_passed").notNull().default(0),
    stressScenariosRun: integer("stress_scenarios_run").notNull().default(0),
    riskVerdict: text("risk_verdict").notNull(),
    funnelInsightsJson: text("funnel_insights_json").notNull(),
    executiveBriefMarkdown: text("executive_brief_markdown").notNull(),
    accelerationScore: real("acceleration_score").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    cycleNumIdx: index("autonomous_learning_cycle_num_idx").on(table.cycleNumber),
    createdAtIdx: index("autonomous_learning_created_at_idx").on(table.createdAt),
  }),
);

export const userDecisionJournal = sqliteTable(
  "user_decision_journal",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    venue: text("venue").notNull(), // 'kalshi-15m' | 'kalshi-1h' | 'polymarket'
    contractTicker: text("contract_ticker").notNull(), // e.g. 'KXBTC15M'
    contractType: text("contract_type").notNull().default("binary_above_below"),
    side: text("side").notNull().default("yes"),
    pricingBasis: text("pricing_basis").notNull().default("executable_ask"), // 'executable_ask' | 'mid_price'
    contractPrice: real("contract_price").notNull(),
    contractCount: integer("contract_count").notNull().default(1),
    purchaseCost: real("purchase_cost").notNull(),
    exchangeFee: real("exchange_fee").notNull(),
    halfSpreadDrag: real("half_spread_drag").notNull().default(0.0),
    totalDrag: real("total_drag").notNull(),
    breakevenWinProb: real("breakeven_win_prob").notNull(),
    assessedWinProb: real("assessed_win_prob").notNull(),
    netExpectedValue: real("net_expected_value").notNull(),
    settlementSource: text("settlement_source").notNull(),
    notes: text("notes"),
    reasoning: text("reasoning"),
    decisionAction: text("decision_action").notNull().default("paper_trade"), // 'skipped' | 'paper_trade' | 'actual_trade'
    isExample: integer("is_example").notNull().default(0),
    status: text("status").notNull().default("saved_check"), // 'saved_check' | 'paper_tracked' | 'executed_live'
    outcome: text("outcome"), // 'WON' | 'LOST' | 'VOID' | 'PENDING'
    realizedPnl: real("realized_pnl"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("user_decision_journal_user_id_idx").on(table.userId),
    createdAtIdx: index("user_decision_journal_created_at_idx").on(table.createdAt),
  })
);

export const betaFeedback = sqliteTable(
  "beta_feedback",
  {
    id: text("id").primaryKey(),
    page: text("page").notNull(),
    appVersion: text("app_version").notNull().default("0.1.0-pilot"),
    category: text("category").notNull(), // 'friction' | 'calculation' | 'bug' | 'general'
    comment: text("comment").notNull(),
    deviceInfo: text("device_info"),
    contactEmail: text("contact_email"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    createdAtIdx: index("beta_feedback_created_at_idx").on(table.createdAt),
  })
);

export const pilotObservationSessions = sqliteTable(
  "pilot_observation_sessions",
  {
    id: text("id").primaryKey(),
    participantRef: text("participant_ref").notNull(),
    channel: text("channel").notNull(),
    device: text("device").notNull(),
    durationMinutes: real("duration_minutes").notNull(),
    unassisted: text("unassisted").notNull(),
    assistanceDetails: text("assistance_details"),
    persistenceStatus: text("persistence_status").notNull(),
    confusionNotes: text("confusion_notes"),
    comprehensionCostFee: text("comprehension_cost_fee"),
    comprehensionBreakeven: text("comprehension_breakeven"),
    comprehensionZeroAlpha: text("comprehension_zero_alpha"),
    operatorNotes: text("operator_notes"),
    status: text("status").notNull().default("COMPLETED"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    participantRefIdx: index("pilot_sessions_participant_ref_idx").on(table.participantRef),
    createdAtIdx: index("pilot_sessions_created_at_idx").on(table.createdAt),
  })
);

export const userRiskPlans = sqliteTable(
  "user_risk_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    dailyMaxOutlay: real("daily_max_outlay").notNull().default(50.0),
    singleTradeMaxOutlay: real("single_trade_max_outlay").notNull().default(25.0),
    maxConcurrentPositions: integer("max_concurrent_positions").notNull().default(3),
    correlatedMarketAlert: integer("correlated_market_alert").notNull().default(1),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("user_risk_plans_user_id_idx").on(table.userId),
  })
);



