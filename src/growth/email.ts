// Outreach + transactional email. Every message carries a real sender,
// the company's postal address, a one-click unsubscribe (RFC 8058) and a
// plain statement of why the person is receiving it.

import type { GrowthConfig } from "./config.ts";
import { type Contact, type DB, nowIso } from "./db.ts";
import { canEmail } from "./compliance.ts";
import { unsubUrl } from "./unsubscribe.ts";
import { type Complete, PRODUCT_BRIEF } from "./llm.ts";

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  headers: Record<string, string>;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export type SendEmail = (m: OutgoingEmail) => Promise<SendResult>;

export function wrapEmail(cfg: GrowthConfig, to: string, subject: string, body: string, why: string): OutgoingEmail {
  const unsub = unsubUrl(cfg.publicBaseUrl, cfg.hmacSecret, to);
  const footer = [
    "",
    "—",
    `${cfg.senderName} · ${cfg.companyName}`,
    cfg.companyPostalAddress,
    why,
    `Unsubscribe in one click: ${unsub}`,
  ].join("\n");
  return {
    to,
    subject,
    text: `${body.trim()}\n${footer}`,
    headers: {
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export function makeSender(cfg: GrowthConfig): SendEmail {
  const from = `${cfg.senderName} <${cfg.senderEmail}>`;
  if (cfg.emailProvider === "resend") {
    return async (m) => {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${cfg.emailApiKey}` },
        body: JSON.stringify({ from, to: [m.to], subject: m.subject, text: m.text, reply_to: cfg.replyToEmail, headers: m.headers }),
      });
      const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
      return r.ok ? { ok: true, id: j.id } : { ok: false, error: j.message ?? `HTTP ${r.status}` };
    };
  }
  if (cfg.emailProvider === "postmark") {
    return async (m) => {
      const r = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json", "X-Postmark-Server-Token": cfg.emailApiKey },
        body: JSON.stringify({
          From: from, To: m.to, Subject: m.subject, TextBody: m.text, ReplyTo: cfg.replyToEmail,
          Headers: Object.entries(m.headers).map(([Name, Value]) => ({ Name, Value })),
          MessageStream: "outbound",
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { MessageID?: string; Message?: string };
      return r.ok ? { ok: true, id: j.MessageID } : { ok: false, error: j.Message ?? `HTTP ${r.status}` };
    };
  }
  // console: dry run, prints instead of sending
  return async (m) => {
    console.log(`[email:dry-run] to=${m.to} subject=${JSON.stringify(m.subject)}\n${m.text}\n`);
    return { ok: true, id: "dry-run" };
  };
}

const DRAFT_SYSTEM = `${PRODUCT_BRIEF}

You write first-touch and follow-up B2B emails for QuanterraOS. Output ONLY JSON:
{"subject": "...", "body": "..."}
Rules:
- Subject must honestly describe the email. No "Re:", "Fwd:", fake urgency, or clickbait.
- Under 120 words, plain text, no links (the signup link is added for you), no attachments.
- Address the person by first name if known. Reference their company and role only if provided.
- Make one specific, verifiable point about why auditable AI matters for their sector; no invented stats.
- One clear ask: create a free account or reply to set up a short call.
- Sign off as "The QuanterraOS team". Do not impersonate a named human.
- Follow-ups are shorter and reference the earlier note. The final follow-up says it is the last one.`;

export interface Draft {
  subject: string;
  body: string;
}

export async function draftEmail(llm: Complete | null, c: Contact, touchNumber: number, maxTouches: number): Promise<Draft> {
  const signupLine = "\n\nYou can create an account here: https://quanterraos.com/growth#signup";
  if (llm) {
    const facts = { first_name: c.name?.split(" ")[0] ?? null, company: c.company, title: c.title, country: c.country, touch: touchNumber, of: maxTouches };
    try {
      const raw = await llm(DRAFT_SYSTEM, [{ role: "user", content: `Write touch ${touchNumber} of ${maxTouches}. Prospect facts: ${JSON.stringify(facts)}` }], 500);
      const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as Draft;
      if (json.subject && json.body && !/^(re|fwd?):/i.test(json.subject)) return { subject: json.subject.slice(0, 120), body: json.body + signupLine };
    } catch {
      // fall through to the template
    }
  }
  const first = c.name?.split(" ")[0] ?? "there";
  if (touchNumber === 1)
    return {
      subject: "Making your AI decisions auditable",
      body: `Hi ${first},\n\nQuanterraOS traces every automated decision back to the rule, data and model behind it, and measures whether its confidence holds up against real outcomes${c.company ? ` — useful for a team like ${c.company}'s` : ""}.\n\nIf auditable AI is on your roadmap, I'd be glad to show you how it works.\n\nThe QuanterraOS team${signupLine}`,
    };
  const last = touchNumber >= maxTouches;
  return {
    subject: last ? "Closing the loop on auditable AI" : "Following up: auditable AI",
    body: `Hi ${first},\n\n${last ? "This is my last note on this." : "Quick follow-up on my earlier note."} If explaining and verifying AI decisions matters to your team, QuanterraOS is built for exactly that. Happy to set up a short call.\n\nThe QuanterraOS team${signupLine}`,
  };
}

const DAY = 86_400_000;
const FOLLOW_UP_GAPS_DAYS = [4, 7]; // after touch 1, after touch 2

function sentToday(db: DB, now: Date): number {
  const r = db
    .prepare("SELECT COUNT(*) AS n FROM outreach_log WHERE channel='email' AND kind IN ('cold','follow_up') AND status IN ('sent','dry_run') AND at >= ?")
    .get(new Date(now.getTime() - DAY).toISOString()) as { n: number };
  return Number(r.n);
}

function log(db: DB, c: Contact, kind: string, status: string, detail: string, subject?: string, body?: string, providerId?: string, at?: string) {
  if (at) {
    db.prepare("INSERT INTO outreach_log (contact_id, channel, kind, subject, body, provider_id, status, detail, at) VALUES (?,?,?,?,?,?,?,?,?)")
      .run(c.id, "email", kind, subject ?? null, body ?? null, providerId ?? null, status, detail, at);
  } else {
    db.prepare("INSERT INTO outreach_log (contact_id, channel, kind, subject, body, provider_id, status, detail) VALUES (?,?,?,?,?,?,?,?)")
      .run(c.id, "email", kind, subject ?? null, body ?? null, providerId ?? null, status, detail);
  }
}

export interface OutreachSummary {
  considered: number;
  sent: number;
  blocked: number;
  failed: number;
  capped: boolean;
}

/** One pass of the outreach agent. Safe to run repeatedly (e.g. every 15 minutes). */
export async function runOutreach(db: DB, cfg: GrowthConfig, send: SendEmail, llm: Complete | null, now = new Date()): Promise<OutreachSummary> {
  const s: OutreachSummary = { considered: 0, sent: 0, blocked: 0, failed: 0, capped: false };
  let budget = cfg.dailyEmailCap - sentToday(db, now);
  const due = db
    .prepare(
      `SELECT * FROM contacts WHERE kind='prospect' AND email IS NOT NULL
       AND status IN ('new','contacted')
       AND ((touches = 0 AND next_touch_at IS NULL) OR next_touch_at <= ?)
       ORDER BY touches ASC, id ASC LIMIT 500`,
    )
    .all(now.toISOString()) as unknown as Contact[];

  for (const c of due) {
    s.considered++;
    if (budget <= 0) {
      s.capped = true;
      break;
    }
    const d = canEmail(db, cfg, c, "cold");
    if (!d.allow) {
      s.blocked++;
      log(db, c, c.touches === 0 ? "cold" : "follow_up", "blocked", d.reason, undefined, undefined, undefined, nowIso(now));
      db.prepare("UPDATE contacts SET next_touch_at = NULL, status = CASE WHEN touches=0 THEN 'held' ELSE 'done' END WHERE id = ?").run(c.id);
      continue;
    }
    const touch = c.touches + 1;
    const draft = await draftEmail(llm, c, touch, cfg.maxColdTouches);
    const why =
      c.lawful_basis === "consent"
        ? "You're receiving this because you signed up at quanterraos.com."
        : `You're receiving this one-to-one business note because of your role${c.company ? ` at ${c.company}` : ""}. Reply "stop" or use the link below and we won't contact you again.`;
    const mail = wrapEmail(cfg, c.email!, draft.subject, draft.body, why);
    const r = await send(mail);
    if (r.ok) {
      s.sent++;
      budget--;
      const gap = FOLLOW_UP_GAPS_DAYS[touch - 1];
      const next = touch < cfg.maxColdTouches && gap ? new Date(now.getTime() + gap * DAY).toISOString() : null;
      db.prepare("UPDATE contacts SET touches = ?, last_touch_at = ?, next_touch_at = ?, status = ? WHERE id = ?")
        .run(touch, nowIso(now), next, next ? "contacted" : "done", c.id);
      log(db, c, touch === 1 ? "cold" : "follow_up", cfg.emailProvider === "console" ? "dry_run" : "sent", d.reason, mail.subject, mail.text, r.id, nowIso(now));
    } else {
      s.failed++;
      log(db, c, touch === 1 ? "cold" : "follow_up", "failed", r.error ?? "unknown error", mail.subject, undefined, undefined, nowIso(now));
    }
  }
  return s;
}
