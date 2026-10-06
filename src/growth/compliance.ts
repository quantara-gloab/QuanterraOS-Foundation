// Every outbound action goes through one of these gates. They return a
// decision plus a reason, and the reason is logged either way, so the
// Supervisor can show why something was or wasn't sent.

import type { GrowthConfig } from "./config.ts";
import { type Contact, type DB } from "./db.ts";
import { hasConsent, isSuppressed } from "./consent.ts";

export interface Decision {
  allow: boolean;
  reason: string;
}

const allow = (reason: string): Decision => ({ allow: true, reason });
const block = (reason: string): Decision => ({ allow: false, reason });

// Personal mailbox providers. Cold B2B outreach only goes to company domains;
// a gmail.com address is a consumer, and consumers need consent.
const FREEMAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com", "outlook.com", "live.com",
  "msn.com", "aol.com", "icloud.com", "me.com", "mac.com", "proton.me", "protonmail.com", "gmx.com",
  "gmx.de", "web.de", "mail.com", "yandex.com", "yandex.ru", "qq.com", "163.com", "126.com", "zoho.com",
]);

export function isFreemail(email: string): boolean {
  const d = email.split("@")[1]?.toLowerCase() ?? "";
  return FREEMAIL.has(d);
}

const TERMINAL_STATUSES = new Set(["unsubscribed", "replied", "bounced", "complained", "signed_up", "do_not_contact"]);

export function canEmail(db: DB, cfg: GrowthConfig, c: Contact, purpose: "cold" | "transactional"): Decision {
  if (!c.email) return block("no email address");
  if (isSuppressed(db, "email", c.email)) return block("address or domain is on the suppression list");

  if (purpose === "transactional") {
    // Replies to something the person asked for (signup confirmation, requested info).
    return hasConsent(db, "email", c.email) ? allow("person opted in") : block("no email consent on record");
  }

  if (c.lawful_basis === "consent") {
    if (!hasConsent(db, "email", c.email)) return block("consent-based contact without a grant in the ledger");
    if (TERMINAL_STATUSES.has(c.status) && c.status !== "signed_up") return block(`status is ${c.status}`);
    return allow("person opted in");
  }

  // b2b_cold
  if (TERMINAL_STATUSES.has(c.status)) return block(`status is ${c.status}`);
  const country = (c.country ?? "").toUpperCase();
  if (!country) return block("country unknown — cannot determine which law applies");
  if (!cfg.coldEmailCountries.includes(country))
    return block(`cold email to ${country} not enabled (requires consent or a documented lawful basis there)`);
  if (isFreemail(c.email)) return block("personal mailbox — cold outreach is limited to company domains");
  if (c.touches >= cfg.maxColdTouches) return block(`reached the ${cfg.maxColdTouches}-touch limit`);
  return allow(`B2B outreach permitted in ${country} with opt-out`);
}

/** Hour (0-23) in the recipient's time zone, or null if the zone is unknown/invalid. */
export function localHour(timezone: string | null, now: Date = new Date()): number | null {
  if (!timezone) return null;
  try {
    const h = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).format(now);
    return Number(h);
  } catch {
    return null;
  }
}

export function canCall(
  db: DB,
  cfg: GrowthConfig,
  c: Contact,
  phone: string,
  attempts: number,
  now: Date = new Date(),
): Decision {
  // Voice is consent-only. The AI agent never dials a cold number.
  if (!phone) return block("no phone number");
  if (isSuppressed(db, "call", phone)) return block("number is on the do-not-call list");
  if (!hasConsent(db, "call", phone)) return block("no express consent to call this number");
  if (attempts >= cfg.maxCallAttempts) return block(`reached ${cfg.maxCallAttempts} call attempts`);
  const h = localHour(c.timezone, now);
  if (h === null) return block("recipient time zone unknown — cannot confirm calling hours");
  if (h < cfg.callWindowStartHour || h >= cfg.callWindowEndHour)
    return block(`outside calling hours (${h}:00 local)`);
  return allow("express consent on record, within calling hours");
}
