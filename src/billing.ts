/**
 * Stripe Billing, Checkout, Customer Portal, and Webhook processing.
 *
 * Implements self-serve checkout for Pro ($199/mo) and Institutional ($750/mo) tiers.
 * Handles webhook events: checkout.session.completed, customer.subscription.updated,
 * customer.subscription.deleted (auto-downgrade to free).
 *
 * When Stripe keys are pending (e.g. IRS business EIN pending), operates gracefully in
 * sandbox mode to allow full end-to-end testing and verification.
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db.ts";
import { users, billingEvents } from "./schema.ts";
import { updateUserTier, getUserById, type UserTier } from "./auth.ts";
import { logEvent } from "./metrics.ts";

export interface CheckoutConfig {
  proPriceId: string;
  institutionalPriceId: string;
  secretKey?: string;
  webhookSecret?: string;
  publishableKey?: string;
}

export const BILLING_CONFIG: CheckoutConfig = {
  proPriceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_pro_199_monthly",
  institutionalPriceId: process.env.STRIPE_INSTITUTIONAL_PRICE_ID ?? "price_inst_750_monthly",
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
};

export interface CreateCheckoutParams {
  userId: string;
  tier: "pro" | "institutional";
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<{ url: string; sessionId: string }> {
  const user = getUserById(params.userId);
  if (!user) throw new Error("User not found");

  const priceId = params.tier === "institutional" ? BILLING_CONFIG.institutionalPriceId : BILLING_CONFIG.proPriceId;

  // Real Stripe Integration if API key is present
  if (BILLING_CONFIG.secretKey && !BILLING_CONFIG.secretKey.startsWith("mock_")) {
    const body = new URLSearchParams({
      "mode": "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "client_reference_id": user.id,
      "customer_email": user.email,
      "success_url": params.successUrl,
      "cancel_url": params.cancelUrl,
      "metadata[tier]": params.tier,
      "metadata[userId]": user.id,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BILLING_CONFIG.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Stripe API error: ${err}`);
    }

    const data = await response.json();
    return { url: data.url, sessionId: data.id };
  }

  // In production, never silently fall back to sandbox checkout when Stripe keys are missing
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Live payment processor is awaiting EIN activation. Sandbox checkout fallback is disabled in production to protect commercial integrity."
    );
  }

  // Sandbox / Test Mode (only in non-production environments)
  const sessionId = `cs_test_${randomUUID()}`;
  const mockUrl = `${params.successUrl}${params.successUrl.includes("?") ? "&" : "?"}mock_checkout=true&session_id=${sessionId}&tier=${params.tier}&user_id=${user.id}`;
  return { url: mockUrl, sessionId };
}

export async function createCustomerPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
  const user = getUserById(userId);
  if (!user) throw new Error("User not found");

  if (BILLING_CONFIG.secretKey && user.stripeCustomerId && !BILLING_CONFIG.secretKey.startsWith("mock_")) {
    const body = new URLSearchParams({
      "customer": user.stripeCustomerId,
      "return_url": returnUrl,
    });

    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BILLING_CONFIG.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Stripe Portal error: ${err}`);
    }

    const data = await response.json();
    return { url: data.url };
  }

  // Sandbox portal simulator
  return { url: `/account?portal_simulated=true&tier=${user.tier}` };
}

// ---------------------------------------------------------------------------
// Webhook Processing & Cryptographic Signature Verification
// ---------------------------------------------------------------------------

/**
 * Verifies the Stripe v1 cryptographic signature against STRIPE_WEBHOOK_SECRET.
 * Equivalent to stripe.webhooks.constructEvent() verification logic:
 * 1. Extracts timestamp 't' and v1 signature(s) from 'stripe-signature' header.
 * 2. Checks timestamp tolerance to prevent replay attacks (default 300s).
 * 3. Computes HMAC-SHA256 of `${timestamp}.${rawBody}` with secret.
 * 4. Compares using constant-time timingSafeEqual to prevent timing attacks.
 */
export function verifyStripeSignature(
  rawBody: string | Buffer,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300
): boolean {
  try {
    const rawBodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const parts = signatureHeader.split(",");
    let timestamp = "";
    const signatures: string[] = [];
    for (const part of parts) {
      const [k, v] = part.trim().split("=");
      if (k === "t") timestamp = v;
      if (k === "v1" && v) signatures.push(v);
    }
    if (!timestamp || signatures.length === 0) return false;

    // Tolerance check against replay attacks (default 5 minutes)
    if (toleranceSeconds > 0) {
      const timestampSec = parseInt(timestamp, 10);
      const nowSec = Math.floor(Date.now() / 1000);
      if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > toleranceSeconds) {
        return false;
      }
    }

    const payload = `${timestamp}.${rawBodyStr}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");

    return signatures.some((sig) => {
      const sigBuf = Buffer.from(sig, "utf8");
      return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
    });
  } catch {
    return false;
  }
}

export interface StripeEventPayload {
  id: string;
  type: string;
  data: {
    object: Record<string, any>;
  };
}

export function processBillingEvent(event: StripeEventPayload): { handled: boolean; action: string } {
  const now = new Date().toISOString();
  const eventId = event.id ?? `evt_${randomUUID().slice(0, 16)}`;
  const eventType = event.type;
  const obj = event.data?.object ?? {};

  // Idempotency check: don't process same event twice
  const existing = db.select().from(billingEvents).where(eq(billingEvents.stripeEventId, eventId)).get();
  if (existing) {
    return { handled: true, action: "already_processed" };
  }

  let affectedUserId: string | null = null;
  let actionTaken = "logged";

  switch (eventType) {
    case "checkout.session.completed": {
      const userId = obj.client_reference_id ?? obj.metadata?.userId;
      const tier: UserTier = obj.metadata?.tier === "institutional" ? "institutional" : "pro";
      const customerId = obj.customer ?? null;
      const subscriptionId = obj.subscription ?? null;

      if (userId) {
        updateUserTier(userId, tier, customerId, subscriptionId);
        affectedUserId = userId;
        actionTaken = `upgraded_to_${tier}`;
      } else if (obj.customer_email) {
        const u = db.select().from(users).where(eq(users.email, obj.customer_email.toLowerCase())).get();
        if (u) {
          updateUserTier(u.id, tier, customerId, subscriptionId);
          affectedUserId = u.id;
          actionTaken = `upgraded_to_${tier}_by_email`;
        }
      }
      if (affectedUserId) {
        logEvent("checkout_completed", affectedUserId, { tier, customerId, subscriptionId });
      }
      break;
    }

    case "customer.subscription.updated": {
      const status = obj.status; // 'active' | 'past_due' | 'canceled' | 'unpaid'
      const subscriptionId = obj.id;
      const customerId = obj.customer;

      const user = db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId)).get()
        ?? (customerId ? db.select().from(users).where(eq(users.stripeCustomerId, customerId)).get() : null);

      if (user) {
        affectedUserId = user.id;
        if (status === "active") {
          // Determine tier from price ID if present
          const priceId = obj.items?.data?.[0]?.price?.id;
          const tier: UserTier = priceId === BILLING_CONFIG.institutionalPriceId ? "institutional" : "pro";
          updateUserTier(user.id, tier, customerId, subscriptionId);
          actionTaken = `maintained_${tier}`;
        } else if (["canceled", "past_due", "unpaid", "incomplete_expired"].includes(status)) {
          // Immediately downgrade to free
          updateUserTier(user.id, "free", customerId, null);
          actionTaken = "downgraded_to_free_unpaid";
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscriptionId = obj.id;
      const customerId = obj.customer;

      const user = db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId)).get()
        ?? (customerId ? db.select().from(users).where(eq(users.stripeCustomerId, customerId)).get() : null);

      if (user) {
        affectedUserId = user.id;
        updateUserTier(user.id, "free", customerId, null);
        actionTaken = "downgraded_to_free_canceled";
      }
      break;
    }

    default:
      actionTaken = `ignored_${eventType}`;
  }

  // Log billing event
  db.insert(billingEvents)
    .values({
      id: `bevt_${randomUUID()}`,
      stripeEventId: eventId,
      eventType,
      userId: affectedUserId,
      payloadJson: JSON.stringify(obj),
      createdAt: now,
    })
    .run();

  return { handled: true, action: actionTaken };
}
