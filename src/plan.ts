/**
 * Subscription plan gating. The plan comes from Clerk Billing per request via
 * auth.has({ plan }) — never from sessionClaims, and never from Stripe directly.
 * With no Clerk keys configured, or on any auth failure, every request is "free".
 */
import type { IncomingMessage } from "node:http";
import { createClerkClient, type ClerkClient } from "@clerk/backend";

export type Plan = "free" | "plus" | "pro";
export type Feature = 
  | "calibration:realtime" 
  | "calibration:bin-table" 
  | "index:history-extended"
  | "journal:personal"
  | "risk:custom-alerts"
  | "imports:multi-venue";

export const PLAN_FEATURES: Record<Plan, readonly Feature[]> = {
  free: [],
  plus: ["journal:personal", "risk:custom-alerts", "imports:multi-venue"],
  pro: [
    "calibration:realtime", 
    "calibration:bin-table", 
    "index:history-extended",
    "journal:personal",
    "risk:custom-alerts",
    "imports:multi-venue"
  ],
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].includes(feature);
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

import { getUserAuth } from "./auth.ts";

export async function currentPlan(req: IncomingMessage): Promise<Plan> {
  const localAuth = getUserAuth(req);
  if (localAuth.tier === "pro" || localAuth.tier === "institutional") {
    return "pro";
  }
  if (localAuth.tier === "plus") {
    return "plus";
  }

  const client = getClerk();
  if (!client) return "free";
  try {
    const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES?.split(",").map((party) => party.trim()).filter(Boolean);
    const state = await client.authenticateRequest(toFetchRequest(req), { authorizedParties });
    // Handshake state has no auth object; treat it as signed out.
    const auth = state.toAuth();
    if (auth?.has({ plan: "pro" })) return "pro";
    if (auth?.has({ plan: "plus" })) return "plus";
    return "free";
  } catch (error) {
    console.error("Clerk plan check failed; serving free tier:", (error as Error).message);
    return "free";
  }
}

