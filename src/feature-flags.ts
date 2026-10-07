/**
 * QuanterraOS Feature Flags
 *
 * Provides controlled gating for new pilot capabilities to ensure
 * existing calculator and registration flows remain completely stable
 * during the active observation of the first ten users.
 */

export interface PilotFeatureFlags {
  outcomeTracking: boolean;
  personalReview: boolean;
  betaBooking: boolean;
  statementImport: boolean;
  mobileInstall: boolean;
  decisionCoach: boolean;
}

export function getFeatureFlags(query?: Record<string, any>): PilotFeatureFlags {
  // Configured via environment variables (default true in production/test unless set to "false")
  // or overridden via query string (?beta=1, ?feature=coach, ?feature=mobile-install, or ?pilot=1)
  const isQueryActive =
    query?.beta === "1" ||
    query?.feature === "outcomes" ||
    query?.feature === "statement-import" ||
    query?.feature === "mobile-install" ||
    query?.feature === "coach" ||
    query?.feature === "decision-coach" ||
    query?.pilot === "1";

  const outcomeTracking = process.env.FEATURE_OUTCOME_TRACKING !== "false" || isQueryActive;
  const personalReview = process.env.FEATURE_PERSONAL_REVIEW !== "false" || isQueryActive;
  const betaBooking = process.env.FEATURE_BETA_BOOKING !== "false" || isQueryActive;
  const statementImport = process.env.FEATURE_STATEMENT_IMPORT !== "false" || isQueryActive;
  const mobileInstall = process.env.FEATURE_MOBILE_INSTALL !== "false" || isQueryActive;
  const decisionCoach = process.env.FEATURE_DECISION_COACH !== "false" || isQueryActive;

  return {
    outcomeTracking,
    personalReview,
    betaBooking,
    statementImport,
    mobileInstall,
    decisionCoach,
  };
}
