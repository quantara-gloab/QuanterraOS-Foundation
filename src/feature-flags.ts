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
}

export function getFeatureFlags(query?: Record<string, any>): PilotFeatureFlags {
  // Configured via environment variables (default true in production/test unless set to "false")
  // or overridden via query string (?beta=1 or ?feature=outcome-tracking)
  const isQueryActive = query?.beta === "1" || query?.feature === "outcomes" || query?.pilot === "1";

  const outcomeTracking = process.env.FEATURE_OUTCOME_TRACKING !== "false" || isQueryActive;
  const personalReview = process.env.FEATURE_PERSONAL_REVIEW !== "false" || isQueryActive;
  const betaBooking = process.env.FEATURE_BETA_BOOKING !== "false" || isQueryActive;

  return {
    outcomeTracking,
    personalReview,
    betaBooking,
  };
}
