/**
 * QuanterraOS Capacitor Native Wrapper & Submittal Gate Safeguard
 * Implements Part 3.11 & Task 8.4:
 *
 * "Capacitor wrapper prepared but NOT submitted until founder approval
 *  and D30 retention >= 25%."
 *
 * Gating Logic:
 * - Checks 30-day cohort retention (D30 >= 25.0%)
 * - Checks explicit founder written authorization
 * - Provides verified review notes for Apple & Google review teams
 *
 * Strict Compliance:
 * - Rule B4: Zero superlatives ("alpha", "guaranteed", "beat the market").
 * - Rule B5: $0.00 capital deployed; zero order routing.
 */

import fs from "node:fs";
import path from "node:path";

export interface NativeSubmissionGateResult {
  canSubmit: boolean;
  blockers: string[];
  d30RetentionPct: number;
  founderApproved: boolean;
  appStoreReviewNotesReady: boolean;
  capacitorConfigValid: boolean;
}

export interface CapacitorConfigSummary {
  appId: string;
  appName: string;
  webDir: string;
  serverUrl: string;
  hasPushPlugin: boolean;
  hasHapticsPlugin: boolean;
}

/**
 * Evaluates whether the native app packaging is legally and operationally authorized for store submission.
 */
export function canSubmitNativeApp(input: {
  d30RetentionPct: number;
  founderApproved: boolean;
}): NativeSubmissionGateResult {
  const blockers: string[] = [];

  // Gate 1: D30 user retention threshold (must be >= 25%)
  if (input.d30RetentionPct < 25.0) {
    blockers.push(
      `Native submission blocked: 30-day user retention is currently ${input.d30RetentionPct.toFixed(1)}%, below the required 25.0% threshold (Part 3.11).`
    );
  }

  // Gate 2: Explicit founder approval
  if (!input.founderApproved) {
    blockers.push(
      "Native submission blocked: Explicit founder written authorization required before submitting binary to App Store Connect or Google Play (Task 8.4)."
    );
  }

  // Gate 3: App Store review documentation exists
  const reviewNotesPath = path.resolve("CAPACITOR_APP_STORE_REVIEW_NOTES.md");
  const appStoreReviewNotesReady = fs.existsSync(reviewNotesPath);
  if (!appStoreReviewNotesReady) {
    blockers.push("Native submission blocked: CAPACITOR_APP_STORE_REVIEW_NOTES.md is missing.");
  }

  // Gate 4: Capacitor configuration exists
  const configPath = path.resolve("capacitor.config.json");
  const capacitorConfigValid = fs.existsSync(configPath);
  if (!capacitorConfigValid) {
    blockers.push("Native submission blocked: capacitor.config.json is missing.");
  }

  return {
    canSubmit: blockers.length === 0,
    blockers,
    d30RetentionPct: input.d30RetentionPct,
    founderApproved: input.founderApproved,
    appStoreReviewNotesReady,
    capacitorConfigValid
  };
}

/**
 * Loads and validates the Capacitor configuration.
 */
export function getCapacitorConfigSummary(): CapacitorConfigSummary {
  const configPath = path.resolve("capacitor.config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("capacitor.config.json does not exist");
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = JSON.parse(raw);

  return {
    appId: parsed.appId,
    appName: parsed.appName,
    webDir: parsed.webDir,
    serverUrl: parsed.server?.url || "",
    hasPushPlugin: Boolean(parsed.plugins?.PushNotifications),
    hasHapticsPlugin: Boolean(parsed.plugins?.Haptics)
  };
}

/**
 * Returns the text of the App Store Review notes.
 */
export function getAppStoreReviewNotes(): string {
  const reviewNotesPath = path.resolve("CAPACITOR_APP_STORE_REVIEW_NOTES.md");
  if (!fs.existsSync(reviewNotesPath)) {
    return "";
  }
  return fs.readFileSync(reviewNotesPath, "utf-8");
}
