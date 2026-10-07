/**
 * QuanterraOS Fee and Settlement-Rule Monitor
 *
 * Implements:
 * 1. Venue Fee Schedule Tracking: Tracks formula, source citation, effective dates, and versioning.
 * 2. Settlement Rule Tracking: Tracks underlying settlement indices (e.g. CME CF BRTI 60s TWAP) and averaging rules.
 * 3. Outdated / Change Detection: Flags rules that need human operator review before applying new formulas.
 * 4. Audit Trail: Maintains explicit governance state preventing silent algorithmic modifications.
 */

export interface TrackedFeeRule {
  venue: string;
  ruleType: "taker_fee" | "maker_fee" | "settlement_oracle";
  version: string;
  sourceCitation: string;
  effectiveDate: string;
  lastVerifiedDate: string;
  reviewStatus: "VERIFIED_CURRENT" | "NEEDS_REVIEW" | "DEPRECATED";
  formulaDescription: string;
  computation: (params: { price: number; count: number }) => number;
  reviewedBy?: string;
  changeNotes?: string;
}

export interface SettlementOracleRule {
  series: string;
  underlyingAsset: string;
  primaryOracle: string;
  averagingWindowSeconds: number;
  calculationMethod: string;
  sourceCitation: string;
  effectiveDate: string;
  lastVerifiedDate: string;
  reviewStatus: "VERIFIED_CURRENT" | "NEEDS_REVIEW" | "DEPRECATED";
  fallbackRule: string;
  reviewedBy?: string;
}

export const CURRENT_FEE_RULES: Record<string, TrackedFeeRule> = {
  "kalshi-taker-15m": {
    venue: "Kalshi",
    ruleType: "taker_fee",
    version: "2026.1",
    sourceCitation: "Kalshi Rulebook §4.2 (KXBTC15M Fee Schedule)",
    effectiveDate: "2026-01-01",
    lastVerifiedDate: "2026-10-07",
    reviewStatus: "VERIFIED_CURRENT",
    formulaDescription: "ceil(0.07 * count * price * (1 - price) * 100) / 100",
    computation: ({ price, count }) => {
      const p = Math.max(0.01, Math.min(0.99, price));
      const n = Math.max(1, Math.floor(count));
      return Math.ceil(0.07 * n * p * (1 - p) * 100) / 100;
    },
    reviewedBy: "Michael (Founder)",
  },
  "polymarket-taker-btc": {
    venue: "Polymarket",
    ruleType: "taker_fee",
    version: "2026.1",
    sourceCitation: "Polymarket Operator Documentation (Zero exchange fee + Polygon network gas drag)",
    effectiveDate: "2026-01-01",
    lastVerifiedDate: "2026-10-07",
    reviewStatus: "VERIFIED_CURRENT",
    formulaDescription: "0.00 exchange fee + estimated $0.015 gas per transaction",
    computation: () => 0.015,
    reviewedBy: "Michael (Founder)",
  },
};

export const CURRENT_SETTLEMENT_RULES: Record<string, SettlementOracleRule> = {
  "KXBTC15M": {
    series: "KXBTC15M",
    underlyingAsset: "BTC",
    primaryOracle: "CME CF Bitcoin Real-Time Index (BRTI)",
    averagingWindowSeconds: 60,
    calculationMethod: "60-second time-weighted average price (TWAP) across 1-second calculations",
    sourceCitation: "Kalshi Contract Specifications KXBTC15M Rule 12.4",
    effectiveDate: "2026-01-01",
    lastVerifiedDate: "2026-10-07",
    reviewStatus: "VERIFIED_CURRENT",
    fallbackRule: "If BRTI is delayed >300s, contract resolves via Kalshi spot composite methodology.",
    reviewedBy: "Michael (Founder)",
  },
};

/**
 * Validates whether all tracked fee and settlement rules are current.
 * Flags any rule older than 90 days or marked as NEEDS_REVIEW.
 */
export function checkFeeAndSettlementRulesFreshness(): {
  allCurrent: boolean;
  flaggedRules: Array<{ ruleKey: string; reason: string; status: string }>;
  verifiedRulesCount: number;
} {
  const flaggedRules: Array<{ ruleKey: string; reason: string; status: string }> = [];
  let verifiedRulesCount = 0;
  const now = Date.now();
  const maxAllowedAgeDays = 90;

  for (const [key, rule] of Object.entries(CURRENT_FEE_RULES)) {
    if (rule.reviewStatus !== "VERIFIED_CURRENT") {
      flaggedRules.push({
        ruleKey: key,
        reason: `Fee rule marked as ${rule.reviewStatus}. Requires founder verification.`,
        status: rule.reviewStatus,
      });
      continue;
    }

    const verifiedMs = new Date(rule.lastVerifiedDate).getTime();
    const ageDays = (now - verifiedMs) / (1000 * 60 * 60 * 24);
    if (ageDays > maxAllowedAgeDays) {
      flaggedRules.push({
        ruleKey: key,
        reason: `Fee rule verification is ${Math.floor(ageDays)} days old (exceeds ${maxAllowedAgeDays}d review cycle).`,
        status: "NEEDS_REVIEW",
      });
    } else {
      verifiedRulesCount++;
    }
  }

  for (const [key, rule] of Object.entries(CURRENT_SETTLEMENT_RULES)) {
    if (rule.reviewStatus !== "VERIFIED_CURRENT") {
      flaggedRules.push({
        ruleKey: key,
        reason: `Settlement rule marked as ${rule.reviewStatus}.`,
        status: rule.reviewStatus,
      });
      continue;
    }

    const verifiedMs = new Date(rule.lastVerifiedDate).getTime();
    const ageDays = (now - verifiedMs) / (1000 * 60 * 60 * 24);
    if (ageDays > maxAllowedAgeDays) {
      flaggedRules.push({
        ruleKey: key,
        reason: `Settlement rule verification is ${Math.floor(ageDays)} days old.`,
        status: "NEEDS_REVIEW",
      });
    } else {
      verifiedRulesCount++;
    }
  }

  return {
    allCurrent: flaggedRules.length === 0,
    flaggedRules,
    verifiedRulesCount,
  };
}
