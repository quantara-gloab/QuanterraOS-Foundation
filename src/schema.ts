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
  })
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
  })
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
      table.contract
    ),
  })
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
      table.observedAt
    ),
  })
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
      table.computedAt
    ),
  })
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
      table.contract
    ),
    bucketIdx: index("edge_scores_bucket").on(table.bucket),
  })
);
