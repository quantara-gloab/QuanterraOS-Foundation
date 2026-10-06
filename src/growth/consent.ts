// Consent ledger. Every grant/revoke is appended with a SHA-256 hash that
// covers the previous entry, so any edit or deletion breaks the chain and
// `verifyLedger` reports exactly where. This is the audit trail regulators,
// carriers and enterprise buyers ask for — and it's the QuanterraOS thesis
// (verifiable, attributable actions) applied to our own growth.

import { createHash } from "node:crypto";
import { type DB, nowIso, normEmail, normPhone } from "./db.ts";

export type Channel = "email" | "call";
export type ConsentAction = "grant" | "revoke";

export interface ConsentInput {
  contactId: number | null;
  subject: string; // email or phone
  channel: Channel;
  action: ConsentAction;
  disclosureText?: string;
  source: string;
  ip?: string;
  userAgent?: string;
  at?: string;
}

const GENESIS = "0".repeat(64);

function normSubject(channel: Channel, subject: string): string {
  return channel === "email" ? normEmail(subject) : normPhone(subject);
}

function hashEntry(prev: string, e: Required<Omit<ConsentInput, "contactId">> & { contactId: number | null }): string {
  const canonical = JSON.stringify([
    prev, e.contactId, e.subject, e.channel, e.action, e.disclosureText, e.source, e.ip, e.userAgent, e.at,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

export function recordConsent(db: DB, input: ConsentInput): { seq: number; hash: string } {
  const e = {
    contactId: input.contactId,
    subject: normSubject(input.channel, input.subject),
    channel: input.channel,
    action: input.action,
    disclosureText: input.disclosureText ?? "",
    source: input.source,
    ip: input.ip ?? "",
    userAgent: input.userAgent ?? "",
    at: input.at ?? nowIso(),
  };
  const last = db.prepare("SELECT hash FROM consent_events ORDER BY seq DESC LIMIT 1").get() as
    | { hash: string }
    | undefined;
  const prev = last?.hash ?? GENESIS;
  const hash = hashEntry(prev, e);
  const r = db
    .prepare(
      `INSERT INTO consent_events
       (contact_id, subject, channel, action, disclosure_text, source, ip, user_agent, at, prev_hash, hash)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(e.contactId, e.subject, e.channel, e.action, e.disclosureText, e.source, e.ip, e.userAgent, e.at, prev, hash);

  if (e.action === "revoke") suppress(db, e.subject, e.channel, `revoked via ${e.source}`);
  return { seq: Number(r.lastInsertRowid), hash };
}

/** True only if the latest event for this subject+channel is a grant and it is not suppressed. */
export function hasConsent(db: DB, channel: Channel, subject: string): boolean {
  const s = normSubject(channel, subject);
  if (isSuppressed(db, channel, s)) return false;
  const row = db
    .prepare("SELECT action FROM consent_events WHERE subject = ? AND channel = ? ORDER BY seq DESC LIMIT 1")
    .get(s, channel) as { action: string } | undefined;
  return row?.action === "grant";
}

export function suppress(db: DB, value: string, channel: Channel | "all", reason: string): void {
  db.prepare("INSERT OR IGNORE INTO suppression (value, channel, reason) VALUES (?,?,?)").run(value, channel, reason);
}

export function isSuppressed(db: DB, channel: Channel, value: string): boolean {
  const v = channel === "email" ? normEmail(value) : normPhone(value);
  const row = db
    .prepare("SELECT 1 FROM suppression WHERE value = ? AND (channel = ? OR channel = 'all') LIMIT 1")
    .get(v, channel);
  if (row) return true;
  if (channel === "email") {
    // Domain-level suppression, e.g. a company that asked us to stop entirely.
    const domain = v.split("@")[1];
    if (domain && db.prepare("SELECT 1 FROM suppression WHERE value = ? LIMIT 1").get("@" + domain)) return true;
  }
  return false;
}

export interface LedgerReport {
  ok: boolean;
  entries: number;
  brokenAt?: number;
}

export function verifyLedger(db: DB): LedgerReport {
  const rows = db.prepare("SELECT * FROM consent_events ORDER BY seq ASC").all() as Array<Record<string, any>>;
  let prev = GENESIS;
  for (const r of rows) {
    const expected = hashEntry(prev, {
      contactId: r.contact_id ?? null,
      subject: r.subject,
      channel: r.channel,
      action: r.action,
      disclosureText: r.disclosure_text ?? "",
      source: r.source,
      ip: r.ip ?? "",
      userAgent: r.user_agent ?? "",
      at: r.at,
    });
    if (r.prev_hash !== prev || r.hash !== expected) return { ok: false, entries: rows.length, brokenAt: r.seq };
    prev = r.hash;
  }
  return { ok: true, entries: rows.length };
}
