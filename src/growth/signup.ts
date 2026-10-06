// Signup capture. The disclosure wording lives here on the server, so the
// ledger always stores exactly what the person was shown — the page renders
// these same strings via GET /api/growth/disclosures.

import { type DB, getContactByEmail, normEmail, normPhone, nowIso } from "./db.ts";
import { recordConsent } from "./consent.ts";
import { scheduleCallback } from "./voice.ts";

export const DISCLOSURES = {
  email:
    "Email me product updates and onboarding tips from QuanterraOS (Quantara Global LLC). I can unsubscribe anytime.",
  call:
    "Call me at the number above. I agree that QuanterraOS (Quantara Global LLC) may call me using an AI voice assistant about my signup. Consent is not required to create an account, and I can say \"stop calling\" anytime.",
};

export interface SignupInput {
  name?: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  consentEmail?: boolean | string;
  consentCall?: boolean | string;
  website?: string; // honeypot — real people leave it blank
}

export interface SignupMeta {
  ip?: string;
  userAgent?: string;
  now?: Date;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const truthy = (v: unknown) => v === true || v === "true" || v === "on" || v === "1";
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function validTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export type SignupResult =
  | { ok: true; contactId: number; callbackScheduled: boolean; isNew: boolean }
  | { ok: false; error: string };

export function handleSignup(db: DB, input: SignupInput, meta: SignupMeta): SignupResult {
  if (input.website) return { ok: false, error: "rejected" };
  const email = normEmail(clip(input.email, 254));
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  const wantsCall = truthy(input.consentCall);
  const phone = normPhone(clip(input.phone, 32));
  if (wantsCall && phone.replace(/\D/g, "").length < 8) return { ok: false, error: "Add a phone number so we can call you." };
  const tzRaw = clip(input.timezone, 64);
  const tz = tzRaw && validTimezone(tzRaw) ? tzRaw : null;
  const country = clip(input.country, 2).toUpperCase() || null;

  const existing = getContactByEmail(db, email);
  let id: number;
  if (existing) {
    db.prepare(
      `UPDATE contacts SET kind='signup', lawful_basis='consent', status='signed_up', next_touch_at=NULL,
       name=COALESCE(?,name), company=COALESCE(?,company), title=COALESCE(?,title),
       phone=COALESCE(?,phone), country=COALESCE(?,country), timezone=COALESCE(?,timezone) WHERE id=?`,
    ).run(
      clip(input.name, 120) || null, clip(input.company, 160) || null, clip(input.title, 120) || null,
      phone || null, country, tz, existing.id,
    );
    id = existing.id;
  } else {
    const r = db
      .prepare(
        `INSERT INTO contacts (email, phone, name, company, title, country, timezone, source, lawful_basis, kind, status)
         VALUES (?,?,?,?,?,?,?,?, 'consent', 'signup', 'signed_up')`,
      )
      .run(email, phone || null, clip(input.name, 120) || null, clip(input.company, 160) || null, clip(input.title, 120) || null, country, tz, "signup-form");
    id = Number(r.lastInsertRowid);
  }

  const base = { contactId: id, source: "signup-form", ip: meta.ip, userAgent: meta.userAgent, at: meta.now ? meta.now.toISOString() : nowIso() };
  if (truthy(input.consentEmail)) recordConsent(db, { ...base, subject: email, channel: "email", action: "grant", disclosureText: DISCLOSURES.email });
  let callbackScheduled = false;
  if (wantsCall && phone) {
    recordConsent(db, { ...base, subject: phone, channel: "call", action: "grant", disclosureText: DISCLOSURES.call });
    scheduleCallback(db, id, phone, meta.now);
    callbackScheduled = true;
  }
  return { ok: true, contactId: id, callbackScheduled, isNew: !existing };
}
