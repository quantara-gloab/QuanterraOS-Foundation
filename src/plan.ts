/**
 * Subscription plan gating. The plan comes from Clerk Billing per request via
 * auth.has({ plan }) — never from sessionClaims, and never from Stripe directly.
 * Governed strictly by QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md (Part 4).
 *
 * Supported Clerk Billing Plans:
 * - cadet (free forever, $0)
 * - pilot ($39/mo or $349/yr, 14-day trial)
 * - commander ($399/mo annual)
 * - builder ($49/mo API)
 * - institutional (custom anchor $1,500+/mo)
 *
 * Backward-compatible aliases:
 * - free = cadet
 * - plus = intermediate journal/alert tier
 * - pro = pilot
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import { createClerkClient, type ClerkClient } from "@clerk/backend";
import { getUserAuth } from "./auth.ts";

export type Plan =
  | "free"
  | "cadet"
  | "plus"
  | "pro"
  | "pilot"
  | "commander"
  | "builder"
  | "institutional";

export type Feature =
  // Part 4 Canonical Features
  | "radar:realtime"
  | "saver:true-cost"
  | "rounding:optimizer"
  | "journal:cloud"
  | "csv:kalshi-import"
  | "shadow:mode"
  | "crew:full"
  | "missions:all-ranks"
  | "support:priority-24h"
  | "scanner:cross-venue"
  | "feed:websocket-live"
  | "exports:tick-ledger"
  | "coaching:monthly-session"
  | "support:desk-4h"
  | "api:mcp-developer"
  | "institutional:unmetered"
  // Legacy Backward-Compatible Features
  | "calibration:realtime"
  | "calibration:bin-table"
  | "index:history-extended"
  | "journal:personal"
  | "risk:custom-alerts"
  | "imports:multi-venue";

const PILOT_FEATURES: Feature[] = [
  "radar:realtime",
  "saver:true-cost",
  "rounding:optimizer",
  "journal:cloud",
  "csv:kalshi-import",
  "shadow:mode",
  "crew:full",
  "missions:all-ranks",
  "support:priority-24h",
  "calibration:realtime",
  "calibration:bin-table",
  "index:history-extended",
  "journal:personal",
  "risk:custom-alerts",
  "imports:multi-venue",
];

const COMMANDER_FEATURES: Feature[] = [
  ...PILOT_FEATURES,
  "scanner:cross-venue",
  "feed:websocket-live",
  "exports:tick-ledger",
  "coaching:monthly-session",
  "support:desk-4h",
];

const BUILDER_FEATURES: Feature[] = [
  "api:mcp-developer",
  "calibration:realtime",
  "calibration:bin-table",
  "index:history-extended",
];

const INSTITUTIONAL_FEATURES: Feature[] = [
  ...COMMANDER_FEATURES,
  "api:mcp-developer",
  "institutional:unmetered",
];

export const PLAN_FEATURES: Record<Plan, readonly Feature[]> = {
  free: [],
  cadet: [],
  plus: ["journal:personal", "risk:custom-alerts", "imports:multi-venue"],
  pro: PILOT_FEATURES,
  pilot: PILOT_FEATURES,
  commander: COMMANDER_FEATURES,
  builder: BUILDER_FEATURES,
  institutional: INSTITUTIONAL_FEATURES,
};

export const PLAN_HIERARCHY: Record<Plan, number> = {
  free: 0,
  cadet: 0,
  plus: 1,
  builder: 2,
  pro: 3,
  pilot: 3,
  commander: 4,
  institutional: 5,
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

export function isPlanEligible(userPlan: Plan, requiredPlan: Plan): boolean {
  return (PLAN_HIERARCHY[userPlan] ?? 0) >= (PLAN_HIERARCHY[requiredPlan] ?? 0);
}

export interface PlanQuota {
  plan: Plan;
  monthlyApiRequests: number;
  webSocketAccess: boolean;
  supportSlaHours: number;
  shadowModeEnabled: boolean;
  crewOfficersCount: number;
}

export function getPlanQuota(plan: Plan): PlanQuota {
  switch (plan) {
    case "commander":
      return {
        plan,
        monthlyApiRequests: 250_000,
        webSocketAccess: true,
        supportSlaHours: 4,
        shadowModeEnabled: true,
        crewOfficersCount: 8,
      };
    case "institutional":
      return {
        plan,
        monthlyApiRequests: 10_000_000,
        webSocketAccess: true,
        supportSlaHours: 1,
        shadowModeEnabled: true,
        crewOfficersCount: 8,
      };
    case "builder":
      return {
        plan,
        monthlyApiRequests: 50_000,
        webSocketAccess: false,
        supportSlaHours: 48,
        shadowModeEnabled: false,
        crewOfficersCount: 1,
      };
    case "pro":
    case "pilot":
      return {
        plan: "pilot",
        monthlyApiRequests: 10_000,
        webSocketAccess: false,
        supportSlaHours: 24,
        shadowModeEnabled: true,
        crewOfficersCount: 8,
      };
    case "plus":
      return {
        plan,
        monthlyApiRequests: 5_000,
        webSocketAccess: false,
        supportSlaHours: 48,
        shadowModeEnabled: false,
        crewOfficersCount: 1,
      };
    case "cadet":
    case "free":
    default:
      return {
        plan: "cadet",
        monthlyApiRequests: 1_000,
        webSocketAccess: false,
        supportSlaHours: 72,
        shadowModeEnabled: false,
        crewOfficersCount: 1,
      };
  }
}

/** Clerk's authenticateRequest() takes a Fetch API Request, not Node's IncomingMessage. */
export function toFetchRequest(req: IncomingMessage & { originalUrl?: string }): Request {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(",")[0].trim() ?? "http";
  const url = new URL(req.originalUrl ?? req.url ?? "/", `${protocol}://${req.headers.host ?? "localhost"}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  return new Request(url, { method: req.method ?? "GET", headers });
}

let clerk: ClerkClient | null | undefined;

function getClerk(): ClerkClient | null {
  if (clerk === undefined) {
    const { CLERK_SECRET_KEY: secretKey, CLERK_PUBLISHABLE_KEY: publishableKey } = process.env;
    clerk = secretKey && publishableKey ? createClerkClient({ secretKey, publishableKey }) : null;
  }
  return clerk;
}

export async function currentPlan(req: IncomingMessage): Promise<Plan> {
  const localAuth = getUserAuth(req);
  if (localAuth.tier === "institutional") {
    return "institutional";
  }
  if (localAuth.tier === "pro") {
    return "pilot";
  }
  if (localAuth.tier === "plus") {
    return "plus";
  }

  const client = getClerk();
  if (!client) return "free";
  try {
    const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES?.split(",").map((party) => party.trim()).filter(Boolean);
    const state = await client.authenticateRequest(toFetchRequest(req), { authorizedParties });
    const auth = state.toAuth();
    if (auth?.has({ plan: "institutional" })) return "institutional";
    if (auth?.has({ plan: "commander" })) return "commander";
    if (auth?.has({ plan: "builder" })) return "builder";
    if (auth?.has({ plan: "pilot" })) return "pilot";
    if (auth?.has({ plan: "pro" })) return "pilot";
    if (auth?.has({ plan: "plus" })) return "plus";
    if (auth?.has({ plan: "cadet" })) return "cadet";
    return "free";
  } catch (error) {
    console.error("Clerk plan check failed; serving free tier:", (error as Error).message);
    return "free";
  }
}

/**
 * Express middleware that gates routes by required feature or plan.
 * Returns HTTP 403 with upgrade path or renders paywall dialog.
 */
export function requireFeatureGate(feature: Feature, requiredPlan: Plan = "pilot") {
  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    const plan = await currentPlan(req);
    if (hasFeature(plan, feature)) {
      return next();
    }

    if (req.accepts("json") && !req.accepts("html")) {
      return res.status(403).json({
        error: "upgrade_required",
        message: `Feature '${feature}' requires the ${requiredPlan.toUpperCase()} plan or higher.`,
        currentPlan: plan,
        requiredPlan,
        upgradeUrl: `/pricing?plan=${requiredPlan}`,
      });
    }

    res.status(403).type("html").send(renderPaywallNoticeHtml(feature, requiredPlan, plan));
  };
}

/**
 * Render structured Tesla-grade Paywall Gate notice
 */
export function renderPaywallNoticeHtml(
  feature: Feature,
  requiredPlan: Plan,
  currentPlan: Plan = "free"
): string {
  const planNames: Record<string, string> = {
    pilot: "Pilot ($39/mo)",
    commander: "Commander ($399/mo)",
    builder: "Builder API ($49/mo)",
    institutional: "Institutional",
  };
  const planLabel = planNames[requiredPlan] || requiredPlan.toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upgrade Required — QuanterraOS Flight Deck</title>
  <style>
    :root {
      --bg: #05060B;
      --card: #0D1120;
      --hud-gold: #C9A24A;
      --hud-cyan: #4FD1E8;
      --alert-red: #E5484D;
      --fg-muted: #8A8F98;
    }
    body {
      background: var(--bg);
      color: #FFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .paywall-card {
      background: var(--card);
      border: 1px solid rgba(201,162,74,0.3);
      border-radius: 8px;
      max-width: 480px;
      width: 100%;
      padding: 32px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(201,162,74,0.1);
    }
    .badge {
      display: inline-block;
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(201,162,74,0.15);
      color: var(--hud-gold);
      border: 1px solid var(--hud-gold);
      margin-bottom: 16px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: #FFF;
    }
    p {
      font-size: 0.9rem;
      color: var(--fg-muted);
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn-upgrade {
      display: inline-block;
      width: 100%;
      background: var(--hud-gold);
      color: #000;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 12px 20px;
      border-radius: 6px;
      text-decoration: none;
      box-sizing: border-box;
      transition: background 0.2s;
    }
    .btn-upgrade:hover {
      background: #dfb843;
    }
    .btn-back {
      display: inline-block;
      margin-top: 14px;
      color: var(--fg-muted);
      font-size: 0.8rem;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="paywall-card">
    <div class="badge">FLIGHT DECK ACCESS GATE // ${requiredPlan.toUpperCase()} TIER</div>
    <h1>Unlock ${feature}</h1>
    <p>
      This flight deck capability is available on the <strong>${planLabel}</strong> tier.
      Your current active access is <strong>${currentPlan.toUpperCase()}</strong>.
    </p>
    <a href="/pricing?plan=${requiredPlan}" class="btn-upgrade">View Upgrade Options &rarr;</a>
    <div>
      <a href="/deck" class="btn-back">&larr; Return to Flight Deck</a>
    </div>
  </div>
</body>
</html>`;
}
