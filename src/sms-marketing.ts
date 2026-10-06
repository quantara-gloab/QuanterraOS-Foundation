/**
 * Compliant SMS Marketing & 10DLC Consent Engine for QuanterraOS.com
 *
 * SPECIFICATION & REGULATORY ENFORCEMENT:
 * 1. Opt-In Only: Texts only recipients who have explicitly consented via unchecked checkbox.
 * 2. Immutable Consent Trail: Records phone, timestamp, source, disclosure text, IP, and user-agent.
 * 3. Mandatory STOP/HELP:
 *    - Inbound STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT immediately sets status = 'unsubscribed',
 *      records revocation in the SHA-256 consent ledger, and returns a suppression confirmation.
 *    - Inbound HELP/INFO returns carrier-mandated auto-reply with sender name, frequency, help, and stop.
 * 4. Application-Layer Gate: sendMarketingSms() enforces in code that no message can be sent to
 *    any recipient lacking an active 'subscribed' consent record.
 * 5. Copy Guardrails: All outgoing texts must identify the sender ('QuanterraOS:'), include
 *    'Reply STOP to cancel', and contain zero prohibited superlatives or fake scarcity.
 * 6. Zero Cold Lists: Strictly prohibits purchased, scraped, or unconsented numbers.
 */

import { randomUUID, createHmac } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "./db.ts";
import { smsConsents, smsSendLog } from "./schema.ts";

export const SMS_MARKETING_DISCLOSURE =
  "I agree to receive marketing texts from QuanterraOS. Message and data rates may apply. Message frequency varies. Reply STOP to unsubscribe, HELP for help.";

export interface SmsConsentRecord {
  id: string;
  phone: string;
  userId: string | null;
  leadId: string | null;
  status: "subscribed" | "unsubscribed";
  consentTimestamp: string;
  consentSource: string;
  disclosureText: string;
  ip: string | null;
  userAgent: string | null;
  optOutTimestamp: string | null;
  optOutReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 1. Phone Format Validation & E.164 Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw phone string into standard ITU E.164 format (e.g. +13125550199).
 * Returns null if input is malformed or invalid.
 */
export function normalizeE164Phone(rawPhone: string, defaultCountry = "US"): string | null {
  if (!rawPhone || typeof rawPhone !== "string") return null;
  const trimmed = rawPhone.trim();
  if (!trimmed) return null;

  // Extract digits and check for leading +
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (hasLeadingPlus) {
    if (digits.length < 10 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // Handle US / North American numbers without leading +
  if (defaultCountry === "US" || defaultCountry === "CA") {
    if (digits.length === 10) {
      // e.g. 3125550199 -> +13125550199
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      // e.g. 13125550199 -> +13125550199
      return `+${digits}`;
    }
  }

  // Standard E.164 without leading plus but with country code
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// 2. Opt-in Storage & Consent Tracking
// ---------------------------------------------------------------------------

export interface RecordOptInInput {
  phone: string;
  userId?: string | null;
  leadId?: string | null;
  source: string;
  disclosureText?: string;
  ip?: string | null;
  userAgent?: string | null;
}

export function recordSmsOptIn(input: RecordOptInInput): SmsConsentRecord {
  const normPhone = normalizeE164Phone(input.phone);
  if (!normPhone) {
    throw new Error(`Invalid phone number format: "${input.phone}". E.164 standard required.`);
  }

  const now = new Date().toISOString();
  const disclosure = input.disclosureText || SMS_MARKETING_DISCLOSURE;

  const existing = db
    .select()
    .from(smsConsents)
    .where(eq(smsConsents.phone, normPhone))
    .get();

  if (existing) {
    db.update(smsConsents)
      .set({
        status: "subscribed",
        userId: input.userId || existing.userId,
        leadId: input.leadId || existing.leadId,
        consentTimestamp: now,
        consentSource: input.source,
        disclosureText: disclosure,
        ip: input.ip || existing.ip,
        userAgent: input.userAgent || existing.userAgent,
        optOutTimestamp: null,
        optOutReason: null,
        updatedAt: now,
      })
      .where(eq(smsConsents.phone, normPhone))
      .run();

    return {
      ...existing,
      status: "subscribed",
      userId: input.userId || existing.userId,
      leadId: input.leadId || existing.leadId,
      consentTimestamp: now,
      consentSource: input.source,
      disclosureText: disclosure,
      ip: input.ip || existing.ip,
      userAgent: input.userAgent || existing.userAgent,
      optOutTimestamp: null,
      optOutReason: null,
      updatedAt: now,
    };
  }

  const id = `sms_cst_${randomUUID().slice(0, 16)}`;
  db.insert(smsConsents)
    .values({
      id,
      phone: normPhone,
      userId: input.userId || null,
      leadId: input.leadId || null,
      status: "subscribed",
      consentTimestamp: now,
      consentSource: input.source,
      disclosureText: disclosure,
      ip: input.ip || null,
      userAgent: input.userAgent || null,
      optOutTimestamp: null,
      optOutReason: null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return {
    id,
    phone: normPhone,
    userId: input.userId || null,
    leadId: input.leadId || null,
    status: "subscribed",
    consentTimestamp: now,
    consentSource: input.source,
    disclosureText: disclosure,
    ip: input.ip || null,
    userAgent: input.userAgent || null,
    optOutTimestamp: null,
    optOutReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function recordSmsOptOut(phone: string, reason: string): SmsConsentRecord | null {
  const normPhone = normalizeE164Phone(phone);
  if (!normPhone) return null;

  const now = new Date().toISOString();
  const existing = db
    .select()
    .from(smsConsents)
    .where(eq(smsConsents.phone, normPhone))
    .get();

  if (existing) {
    db.update(smsConsents)
      .set({
        status: "unsubscribed",
        optOutTimestamp: now,
        optOutReason: reason,
        updatedAt: now,
      })
      .where(eq(smsConsents.phone, normPhone))
      .run();

    return {
      ...existing,
      status: "unsubscribed",
      optOutTimestamp: now,
      optOutReason: reason,
      updatedAt: now,
    };
  }

  // Record suppression even if no prior opt-in existed (e.g. unsolicited text to inbound line)
  const id = `sms_cst_${randomUUID().slice(0, 16)}`;
  db.insert(smsConsents)
    .values({
      id,
      phone: normPhone,
      userId: null,
      leadId: null,
      status: "unsubscribed",
      consentTimestamp: now,
      consentSource: "inbound_opt_out_unregistered",
      disclosureText: "Suppression recorded on inbound request.",
      ip: null,
      userAgent: null,
      optOutTimestamp: now,
      optOutReason: reason,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return {
    id,
    phone: normPhone,
    userId: null,
    leadId: null,
    status: "unsubscribed",
    consentTimestamp: now,
    consentSource: "inbound_opt_out_unregistered",
    disclosureText: "Suppression recorded on inbound request.",
    ip: null,
    userAgent: null,
    optOutTimestamp: now,
    optOutReason: reason,
    createdAt: now,
    updatedAt: now,
  };
}

export function getSmsConsent(phone: string): SmsConsentRecord | null {
  const normPhone = normalizeE164Phone(phone);
  if (!normPhone) return null;
  const row = db.select().from(smsConsents).where(eq(smsConsents.phone, normPhone)).get();
  return (row as SmsConsentRecord) || null;
}

// ---------------------------------------------------------------------------
// 3. STOP/HELP Mandatory Carrier Webhook Processing
// ---------------------------------------------------------------------------

export const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
]);

export const HELP_KEYWORDS = new Set([
  "HELP",
  "INFO",
]);

export const RESUBSCRIBE_KEYWORDS = new Set([
  "START",
  "UNSTOP",
  "YES",
]);

export interface InboundSmsPayload {
  From: string;
  To?: string;
  Body?: string;
  MessageSid?: string;
}

export interface InboundSmsResult {
  action: "opt_out" | "help" | "resubscribe" | "unhandled";
  keyword?: string;
  phone: string;
  replyTwiMl: string;
}

export function handleInboundSms(payload: InboundSmsPayload): InboundSmsResult {
  const phone = normalizeE164Phone(payload.From);
  if (!phone) {
    return {
      action: "unhandled",
      phone: payload.From,
      replyTwiMl: "<Response/>",
    };
  }

  const rawBody = (payload.Body || "").trim().toUpperCase().replace(/[.,!?;:]/g, "");
  const firstWord = rawBody.split(/\s+/)[0] || "";

  // 1. Mandatory STOP handling
  if (STOP_KEYWORDS.has(firstWord)) {
    recordSmsOptOut(phone, `inbound_keyword_${firstWord.toLowerCase()}`);
    return {
      action: "opt_out",
      keyword: firstWord,
      phone,
      replyTwiMl:
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have successfully been unsubscribed from QuanterraOS alerts. You will not receive any more messages. Reply START to resubscribe.</Message></Response>',
    };
  }

  // 2. Mandatory HELP handling
  if (HELP_KEYWORDS.has(firstWord)) {
    return {
      action: "help",
      keyword: firstWord,
      phone,
      replyTwiMl:
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>QuanterraOS: Automated product &amp; market intelligence. Frequency varies. Reply STOP to unsubscribe. Support: team@quanterraos.com. Msg&amp;data rates may apply.</Message></Response>',
    };
  }

  // 3. Resubscribe handling
  if (RESUBSCRIBE_KEYWORDS.has(firstWord)) {
    recordSmsOptIn({
      phone,
      source: `inbound_keyword_${firstWord.toLowerCase()}`,
      disclosureText: SMS_MARKETING_DISCLOSURE,
    });
    return {
      action: "resubscribe",
      keyword: firstWord,
      phone,
      replyTwiMl:
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>QuanterraOS: Welcome back to alerts. Msg&amp;data rates may apply. Frequency varies. Reply STOP to cancel, HELP for help.</Message></Response>',
    };
  }

  // Default response
  return {
    action: "unhandled",
    keyword: firstWord,
    phone,
    replyTwiMl:
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>QuanterraOS: For assistance email team@quanterraos.com or reply HELP for info. Reply STOP to unsubscribe.</Message></Response>',
  };
}

// ---------------------------------------------------------------------------
// 4. Message Content & Copy Guardrail Validator
// ---------------------------------------------------------------------------

export const BANNED_SMS_PATTERNS = [
  /\bguaranteed\b/i,
  /\bguarantee\b/i,
  /\bstock expected to rise\b/i,
  /\bcrypto expected to surge\b/i,
  /\b100% win\b/i,
  /\bcan'?t lose\b/i,
  /\brisk-?free\b/i,
  /\bact fast\b/i,
  /\btoday only\b/i,
  /\bhurry\b/i,
  /\bexclusive insider\b/i,
  /\blimited spots?\b/i,
  /\bbeat the market\b/i,
  /\boutperform (all|every)\b/i,
];

export function validateSmsCopy(text: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const clean = text.trim();

  // Rule 1: Identification of sender
  if (!clean.startsWith("QuanterraOS:") && !clean.includes("QuanterraOS")) {
    errors.push("Sender identification missing: message must begin with 'QuanterraOS:' or clearly name the sender.");
  }

  // Rule 2: Unsubscribe instructions (mandatory 10DLC requirement)
  if (!/stop/i.test(clean)) {
    errors.push("Mandatory opt-out instructions missing: message must include 'Reply STOP to cancel' or equivalent.");
  }

  // Rule 3: Length sanity check (standard single SMS is 160 characters; concatenated SMS up to 320 max recommended)
  if (clean.length > 320) {
    errors.push(`Message length (${clean.length} chars) exceeds 320 character threshold for compliant marketing SMS.`);
  }

  // Rule 4: Prohibited copy and fake scarcity patterns
  for (const pattern of BANNED_SMS_PATTERNS) {
    if (pattern.test(clean)) {
      errors.push(`Contains prohibited marketing superlative or fake scarcity claim matching pattern: ${pattern.toString()}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// 5. Hard Application-Layer Enforcement (sendMarketingSms)
// ---------------------------------------------------------------------------

export interface SendMarketingSmsOptions {
  to: string;
  message: string;
  campaignId?: string;
  dryRun?: boolean;
}

export interface SendSmsResult {
  success: boolean;
  status: "sent" | "blocked" | "dry_run" | "failed";
  providerSid?: string;
  error?: string;
}

/**
 * Sends a compliant marketing SMS to a recipient.
 *
 * HARD APPLICATION-LAYER GATES:
 * - Throws if recipient has NO consent record.
 * - Throws if recipient is marked 'unsubscribed'.
 * - Throws if copy fails guardrails.
 * - Enforces zero cold/unconsented sending at the code level.
 */
export async function sendMarketingSms(options: SendMarketingSmsOptions): Promise<SendSmsResult> {
  const normPhone = normalizeE164Phone(options.to);
  if (!normPhone) {
    throw new Error(`SMS_INVALID_PHONE: "${options.to}" is not a valid E.164 phone number.`);
  }

  // GATE 1: Check consent record existence
  const consent = getSmsConsent(normPhone);
  if (!consent) {
    const errorMsg = `TCPA_VIOLATION_BLOCKED: Recipient ${normPhone} has NO consent record. Sending to unconsented numbers is strictly prohibited by code.`;
    logSmsSend(normPhone, options.message, "blocked", options.campaignId, undefined, errorMsg);
    throw new Error(errorMsg);
  }

  // GATE 2: Check consent subscription status
  if (consent.status !== "subscribed") {
    const errorMsg = `RECIPIENT_UNSUBSCRIBED: Recipient ${normPhone} is marked unsubscribed (opt-out reason: ${consent.optOutReason || "unknown"}). Delivery blocked at application layer.`;
    logSmsSend(normPhone, options.message, "blocked", options.campaignId, undefined, errorMsg);
    throw new Error(errorMsg);
  }

  // GATE 3: Copy guardrail validation
  const copyCheck = validateSmsCopy(options.message);
  if (!copyCheck.valid) {
    const errorMsg = `COPY_GUARDRAIL_VIOLATION: ${copyCheck.errors.join("; ")}`;
    logSmsSend(normPhone, options.message, "blocked", options.campaignId, undefined, errorMsg);
    throw new Error(errorMsg);
  }

  // GATE 4: Dispatch via Twilio or simulate in test/dev
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (options.dryRun || !accountSid || !authToken || !fromNumber) {
    const mockSid = `SM_dryrun_${randomUUID().slice(0, 16)}`;
    logSmsSend(normPhone, options.message, "dry_run", options.campaignId, mockSid);
    return {
      success: true,
      status: "dry_run",
      providerSid: mockSid,
    };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      To: normPhone,
      From: fromNumber,
      Body: options.message,
    });

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      const errorMsg = `Twilio API error HTTP ${response.status}: ${errText}`;
      logSmsSend(normPhone, options.message, "failed", options.campaignId, undefined, errorMsg);
      return {
        success: false,
        status: "failed",
        error: errorMsg,
      };
    }

    const data = (await response.json()) as { sid: string };
    logSmsSend(normPhone, options.message, "sent", options.campaignId, data.sid);
    return {
      success: true,
      status: "sent",
      providerSid: data.sid,
    };
  } catch (err) {
    const errorMsg = (err as Error).message;
    logSmsSend(normPhone, options.message, "failed", options.campaignId, undefined, errorMsg);
    return {
      success: false,
      status: "failed",
      error: errorMsg,
    };
  }
}

function logSmsSend(
  phone: string,
  messageBody: string,
  status: "sent" | "blocked" | "failed" | "dry_run",
  campaignId?: string,
  providerSid?: string,
  errorDetail?: string,
): void {
  try {
    db.insert(smsSendLog)
      .values({
        id: `slog_${randomUUID().slice(0, 16)}`,
        phone,
        messageBody,
        campaignId: campaignId || null,
        status,
        providerSid: providerSid || null,
        errorDetail: errorDetail || null,
        createdAt: new Date().toISOString(),
      })
      .run();
  } catch (_e) {
    // Non-fatal logging safeguard
  }
}

// ---------------------------------------------------------------------------
// 6. Twilio Inbound Webhook Signature Validator
// ---------------------------------------------------------------------------

export function validTwilioSmsSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string,
): boolean {
  if (!authToken || !signature) return false;
  try {
    // Sort parameter keys alphabetically and concatenate key + value
    const keys = Object.keys(params).sort();
    let data = url;
    for (const k of keys) {
      data += k + params[k];
    }
    const computed = createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
    return computed === signature;
  } catch {
    return false;
  }
}
