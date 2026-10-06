// Callback agent: an AI voice assistant that ONLY calls people who ticked
// "Call me" on the signup form. It discloses that it is an AI at the start,
// honors "stop calling" instantly, and stays inside local calling hours.
// Uses Twilio's REST API and TwiML (speech <Gather>) — no SDK required.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { GrowthConfig } from "./config.ts";
import { type Contact, type DB, getContact, nowIso } from "./db.ts";
import { canCall } from "./compliance.ts";
import { recordConsent } from "./consent.ts";
import { type Complete, type Msg, PRODUCT_BRIEF } from "./llm.ts";

export interface Callback {
  id: number;
  contact_id: number;
  phone: string;
  requested_at: string;
  scheduled_for: string;
  attempts: number;
  status: string;
  call_sid: string | null;
  transcript: string;
}

export type PlaceCall = (to: string, callbackId: number) => Promise<{ ok: boolean; sid?: string; error?: string }>;

export function scheduleCallback(db: DB, contactId: number, phone: string, when: Date = new Date()): number {
  const open = db.prepare("SELECT id FROM callbacks WHERE contact_id = ? AND status IN ('pending','calling')").get(contactId) as
    | { id: number }
    | undefined;
  if (open) return open.id;
  const r = db
    .prepare("INSERT INTO callbacks (contact_id, phone, requested_at, scheduled_for) VALUES (?,?,?,?)")
    .run(contactId, phone, nowIso(), when.toISOString());
  return Number(r.lastInsertRowid);
}

export function makeTwilioDialer(cfg: GrowthConfig): PlaceCall {
  return async (to, callbackId) => {
    if (!cfg.twilioAccountSid) {
      console.log(`[voice:dry-run] would call ${to} for callback ${callbackId}`);
      return { ok: true, sid: "dry-run" };
    }
    const base = `${cfg.publicBaseUrl}/api/growth/voice`;
    const form = new URLSearchParams({
      To: to,
      From: cfg.twilioFromNumber,
      Url: `${base}/answer?cb=${callbackId}`,
      StatusCallback: `${base}/status?cb=${callbackId}`,
      MachineDetection: "Enable",
      Timeout: "25",
    });
    const auth = Buffer.from(`${cfg.twilioAccountSid}:${cfg.twilioAuthToken}`).toString("base64");
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.twilioAccountSid}/Calls.json`, {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const j = (await r.json().catch(() => ({}))) as { sid?: string; message?: string };
    return r.ok ? { ok: true, sid: j.sid } : { ok: false, error: j.message ?? `HTTP ${r.status}` };
  };
}

/** Twilio request signature check (X-Twilio-Signature). */
export function validTwilioSignature(authToken: string, url: string, params: Record<string, string>, signature: string): boolean {
  if (!authToken || !signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(data).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Dispatch due callbacks. Returns how many calls were started / held. */
export async function runCallbacks(db: DB, cfg: GrowthConfig, dial: PlaceCall, now = new Date()) {
  const s = { started: 0, held: 0, failed: 0, closed: 0 };
  // A call stuck in 'calling' for 30+ minutes never reported back — release it.
  db.prepare("UPDATE callbacks SET status='pending' WHERE status='calling' AND scheduled_for < ?").run(
    new Date(now.getTime() - 30 * 60_000).toISOString(),
  );
  const due = db
    .prepare("SELECT * FROM callbacks WHERE status='pending' AND scheduled_for <= ? ORDER BY scheduled_for LIMIT 50")
    .all(now.toISOString()) as unknown as Callback[];
  for (const cb of due) {
    const c = getContact(db, cb.contact_id);
    if (!c) continue;
    const d = canCall(db, cfg, c, cb.phone, cb.attempts, now);
    if (!d.allow) {
      const permanent = !/calling hours/.test(d.reason);
      if (permanent) {
        db.prepare("UPDATE callbacks SET status='cancelled' WHERE id=?").run(cb.id);
        s.closed++;
      } else {
        // try again in an hour; the window check will pass during business hours
        db.prepare("UPDATE callbacks SET scheduled_for=? WHERE id=?").run(new Date(now.getTime() + 60 * 60_000).toISOString(), cb.id);
        s.held++;
      }
      logCall(db, c, "blocked", d.reason);
      continue;
    }
    const r = await dial(cb.phone, cb.id);
    if (r.ok) {
      db.prepare("UPDATE callbacks SET status='calling', attempts=attempts+1, call_sid=?, scheduled_for=? WHERE id=?").run(
        r.sid ?? null, now.toISOString(), cb.id,
      );
      logCall(db, c, cfg.twilioAccountSid ? "sent" : "dry_run", d.reason, r.sid);
      s.started++;
    } else {
      db.prepare("UPDATE callbacks SET attempts=attempts+1, scheduled_for=? WHERE id=?").run(
        new Date(now.getTime() + 2 * 3600_000).toISOString(), cb.id,
      );
      logCall(db, c, "failed", r.error ?? "dial failed");
      s.failed++;
    }
  }
  return s;
}

function logCall(db: DB, c: Contact, status: string, detail: string, sid?: string) {
  db.prepare("INSERT INTO outreach_log (contact_id, channel, kind, provider_id, status, detail) VALUES (?,?,?,?,?,?)").run(
    c.id, "call", "callback", sid ?? null, status, detail,
  );
}

// ---------- TwiML ----------

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[ch]!);
}

function twiml(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
}

function gather(cfg: GrowthConfig, cbId: number, say: string): string {
  const action = esc(`${cfg.publicBaseUrl}/api/growth/voice/turn?cb=${cbId}`);
  return twiml(
    `<Gather input="speech" action="${action}" method="POST" speechTimeout="auto" language="en-US"><Say voice="Polly.Joanna">${esc(say)}</Say></Gather>` +
      `<Say voice="Polly.Joanna">I didn't catch that. We'll follow up by email. Goodbye.</Say><Hangup/>`,
  );
}

const STOP_RE = /\b(stop( calling)?|do not call|don'?t call|remove me|unsubscribe|not interested)\b/i;
const MAX_TURNS = 12;

const VOICE_SYSTEM = `${PRODUCT_BRIEF}

You are the QuanterraOS AI assistant on a phone call the person requested from quanterraos.com.
- Speak naturally in 1–2 short sentences per turn; this is read aloud.
- Learn what they want to use QuanterraOS for and answer questions from the brief only.
- If they want to talk to a person, a demo, or pricing, say a team member will email them to schedule, then say goodbye.
- Never pressure, never claim to be human, never ask for payment or sensitive data.
- When the conversation is complete, end your reply with the token [END].`;

export function answerCall(db: DB, cfg: GrowthConfig, cbId: number, answeredBy: string | undefined): string {
  const cb = db.prepare("SELECT * FROM callbacks WHERE id = ?").get(cbId) as Callback | undefined;
  const c = cb ? getContact(db, cb.contact_id) : undefined;
  if (!cb || !c) return twiml(`<Hangup/>`);
  const first = c.name?.split(" ")[0] ?? "there";
  if (answeredBy && answeredBy.startsWith("machine")) {
    db.prepare("UPDATE callbacks SET status='done' WHERE id=?").run(cbId);
    return twiml(
      `<Say voice="Polly.Joanna">${esc(`Hi ${first}, this is the QuanterraOS AI assistant returning the call you requested at quanterraos.com. We'll follow up by email. Thanks!`)}</Say><Hangup/>`,
    );
  }
  const opening =
    `Hi ${first}, this is the QuanterraOS AI assistant — an automated agent, not a person — calling because you asked for a call at quanterraos.com. ` +
    `We keep a text transcript to follow up. You can say "stop calling" anytime. What would you like to know about QuanterraOS?`;
  return gather(cfg, cbId, opening);
}

export async function callTurn(db: DB, cfg: GrowthConfig, llm: Complete, cbId: number, speech: string): Promise<string> {
  const cb = db.prepare("SELECT * FROM callbacks WHERE id = ?").get(cbId) as Callback | undefined;
  const c = cb ? getContact(db, cb.contact_id) : undefined;
  if (!cb || !c) return twiml(`<Hangup/>`);
  const transcript = JSON.parse(cb.transcript) as Msg[];
  const said = (speech ?? "").trim();

  if (STOP_RE.test(said)) {
    recordConsent(db, { contactId: c.id, subject: cb.phone, channel: "call", action: "revoke", source: "voice:stop-request" });
    transcript.push({ role: "user", content: said });
    db.prepare("UPDATE callbacks SET status='done', transcript=? WHERE id=?").run(JSON.stringify(transcript), cbId);
    return twiml(`<Say voice="Polly.Joanna">Understood. We won't call this number again. Goodbye.</Say><Hangup/>`);
  }

  transcript.push({ role: "user", content: said || "(no answer)" });
  let reply: string;
  try {
    reply = await llm(VOICE_SYSTEM, transcript, 200);
  } catch {
    reply = "Sorry, I'm having trouble right now. A team member will follow up by email. Goodbye. [END]";
  }
  const end = reply.includes("[END]") || transcript.length >= MAX_TURNS * 2;
  const spoken = reply.replace("[END]", "").trim();
  transcript.push({ role: "assistant", content: spoken });
  db.prepare("UPDATE callbacks SET transcript=?, status=? WHERE id=?").run(JSON.stringify(transcript), end ? "done" : "calling", cbId);
  if (end) return twiml(`<Say voice="Polly.Joanna">${esc(spoken)}</Say><Hangup/>`);
  return gather(cfg, cbId, spoken);
}

export function callStatus(db: DB, cbId: number, status: string): void {
  // Twilio final statuses: completed, busy, no-answer, failed, canceled
  if (status === "completed") {
    db.prepare("UPDATE callbacks SET status='done' WHERE id=? AND status IN ('calling','pending')").run(cbId);
  } else if (["busy", "no-answer", "failed", "canceled"].includes(status)) {
    db.prepare("UPDATE callbacks SET status='pending', scheduled_for=? WHERE id=? AND status='calling'").run(
      new Date(Date.now() + 3 * 3600_000).toISOString(), cbId,
    );
  }
}
