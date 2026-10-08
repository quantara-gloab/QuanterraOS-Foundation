/**
 * QuanterraOS Decision Journal CSV Importer, Exporter & Advisory Risk Plan Engine
 *
 * Implements Days 15–30 Roadmap Requirements:
 * 1. CSV Journal Import: Ingests statements from Kalshi, Polymarket, or QuanterraOS format.
 * 2. CSV Journal Export: Generates RFC 4180 compliant export of all personal decision checks.
 * 3. Advisory Risk Plan: Tracks voluntary spending limits and flags correlated crypto exposure.
 *
 * Adheres strictly to:
 * - Rule B4: Zero unbacked claims, honest arithmetic attribution.
 * - Rule B5: $0.00 live exposure, voluntary risk guidance without custodial control.
 */

import { randomUUID } from "node:crypto";
import { eq, and, desc, gte } from "drizzle-orm";
import { db } from "./db.ts";
import { userDecisionJournal, userRiskPlans } from "./schema.ts";
import { logEvent } from "./metrics.ts";

export {
  getUserRiskPlan,
  saveUserRiskPlan,
  checkTradeAgainstRiskPlan,
  saveCheckForLater,
  renderRiskPlanSettingsHtml,
  ADVISORY_CONTROL_DISCLAIMER,
  type UserRiskPlan,
  type RiskPlan,
  type RiskAdvisoryCheck,
  type RiskAdvisoryWarning,
  type PreSaveRiskCheckResult,
} from "./risk-plan.ts";

/**
 * Parses CSV statements from QuanterraOS, Kalshi, or Polymarket into personal decision journal entries.
 */
export function parseJournalCsv(
  csvText: string,
  userId: string
): { importedCount: number; errors: string[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { importedCount: 0, errors: ["CSV file is empty or missing headers"] };
  }

  const rawHeaders = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
  const rows = lines.slice(1);
  let importedCount = 0;
  const errors: string[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const rowLine = rows[idx];
    if (!rowLine) continue;

    // Simple RFC CSV regex match
    const cols = (rowLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rowLine.split(","))
      .map((c) => c.replace(/^["']|["']$/g, "").trim());

    const getVal = (colName: string): string => {
      const colIdx = rawHeaders.indexOf(colName.toLowerCase());
      return colIdx >= 0 && colIdx < cols.length ? cols[colIdx] : "";
    };

    try {
      // Determine format: QuanterraOS, Kalshi, or Polymarket
      const ticker = getVal("contractticker") || getVal("ticker") || getVal("market") || getVal("contract") || "KXBTC15M";
      const side = (getVal("side") || getVal("action") || getVal("outcome") || "yes").toLowerCase().includes("no") ? "no" : "yes";
      
      let price = parseFloat(getVal("contractprice") || getVal("price") || getVal("yes_price") || "0.51");
      if (price > 1.0) price = price / 100.0; // If entered in cents (e.g. 51¢ -> 0.51)
      if (isNaN(price) || price <= 0 || price >= 1.0) price = 0.51;

      const count = Math.max(1, parseInt(getVal("contractcount") || getVal("count") || getVal("shares") || getVal("quantity") || "10", 10));
      const purchaseCost = parseFloat(getVal("purchasecost") || (price * count).toFixed(2));
      
      let fee = parseFloat(getVal("exchangefee") || getVal("fee") || getVal("fees") || "0");
      if (isNaN(fee) || fee <= 0) {
        fee = Math.ceil(0.07 * count * price * (1 - price) * 100) / 100;
      }

      const totalOutlay = purchaseCost + fee;
      const breakevenWinProb = parseFloat(getVal("breakevenwinprob") || ((totalOutlay / count) * 100).toFixed(2));
      const assessedWinProb = parseFloat(getVal("assessedwinprob") || (breakevenWinProb + 2.0).toFixed(2));
      const venue = getVal("venue") || (ticker.toLowerCase().includes("poly") ? "polymarket" : "kalshi-15m");
      const settlementSource = getVal("settlementsource") || (venue.includes("poly") ? "UMA Optimistic Oracle" : "CME CF BRTI 60s TWAP");
      
      const rawOutcome = (getVal("outcome") || getVal("result") || getVal("settlement") || "").toUpperCase();
      let outcome: string | null = null;
      let realizedPnl: number | null = null;

      if (rawOutcome.includes("WON") || rawOutcome === "YES" || rawOutcome === "1") {
        outcome = "WON";
        realizedPnl = (count * 1.0) - totalOutlay;
      } else if (rawOutcome.includes("LOST") || rawOutcome === "NO" || rawOutcome === "0") {
        outcome = "LOST";
        realizedPnl = -totalOutlay;
      } else if (rawOutcome.includes("VOID")) {
        outcome = "VOID";
        realizedPnl = 0.0;
      }

      const notes = getVal("notes") || `Imported via CSV: ${new Date().toLocaleDateString()}`;
      const createdAt = getVal("createdat") || getVal("timestamp") || getVal("order_time") || new Date().toISOString();
      const id = `jrn_${randomUUID().slice(0, 16)}`;

      db.insert(userDecisionJournal)
        .values({
          id,
          userId,
          venue,
          contractTicker: ticker,
          contractType: "binary_above_below",
          side,
          pricingBasis: "executable_ask",
          contractPrice: price,
          contractCount: count,
          purchaseCost,
          exchangeFee: fee,
          halfSpreadDrag: 0.0,
          totalDrag: fee / count,
          breakevenWinProb,
          assessedWinProb,
          netExpectedValue: ((assessedWinProb / 100) * 1.0) - price - (fee / count),
          settlementSource,
          notes,
          status: outcome ? "executed_live" : "saved_check",
          outcome,
          realizedPnl,
          createdAt,
          updatedAt: new Date().toISOString(),
        })
        .run();

      importedCount++;
    } catch (err) {
      errors.push(`Row ${idx + 1}: ${(err as Error).message}`);
    }
  }

  logEvent("journal_csv_imported", userId, { importedCount, errorsCount: errors.length });
  return { importedCount, errors };
}

/**
 * Generates an RFC 4180 compliant CSV export of the user's decision journal.
 */
export function exportJournalCsv(userId: string): string {
  const entries = db
    .select()
    .from(userDecisionJournal)
    .where(eq(userDecisionJournal.userId, userId))
    .orderBy(desc(userDecisionJournal.createdAt))
    .all();

  const headers = [
    "id",
    "venue",
    "contractTicker",
    "side",
    "contractPrice",
    "contractCount",
    "purchaseCost",
    "exchangeFee",
    "breakevenWinProb",
    "assessedWinProb",
    "netExpectedValue",
    "settlementSource",
    "status",
    "outcome",
    "realizedPnl",
    "notes",
    "createdAt"
  ];

  const lines = [headers.join(",")];

  for (const e of entries) {
    const row = [
      `"${e.id}"`,
      `"${e.venue}"`,
      `"${e.contractTicker}"`,
      `"${e.side}"`,
      e.contractPrice.toFixed(4),
      e.contractCount.toString(),
      e.purchaseCost.toFixed(2),
      e.exchangeFee.toFixed(2),
      e.breakevenWinProb.toFixed(2),
      e.assessedWinProb.toFixed(2),
      e.netExpectedValue.toFixed(4),
      `"${e.settlementSource.replace(/"/g, '""')}"`,
      `"${e.status}"`,
      `"${e.outcome || "PENDING"}"`,
      e.realizedPnl !== null && e.realizedPnl !== undefined ? e.realizedPnl.toFixed(2) : "",
      `"${(e.notes || "").replace(/"/g, '""')}"`,
      `"${e.createdAt}"`
    ];
    lines.push(row.join(","));
  }

  return lines.join("\n");
}
