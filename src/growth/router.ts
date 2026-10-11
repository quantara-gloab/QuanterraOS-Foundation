// HTTP layer. createGrowthHandler returns a plain Node (req, res, next)
// handler, so it mounts on the raw http server in src/server.ts or on
// Express/Connect with app.use(handler). It answers /growth and /api/growth/*
// and calls next() (or 404s) for everything else.

import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import type { GrowthConfig } from "./config.ts";
import { type DB, getContactByEmail } from "./db.ts";
import { recordConsent, suppress } from "./consent.ts";
import { readUnsubToken } from "./unsubscribe.ts";
import { handleSignup, DISCLOSURES } from "./signup.ts";
import { concierge, sanitizeHistory, makeRateLimiter } from "./chat.ts";
import { answerCall, callTurn, callStatus, validTwilioSignature } from "./voice.ts";
import { metrics } from "./supervisor.ts";
import { wrapEmail, type SendEmail } from "./email.ts";
import type { Complete } from "./llm.ts";

export interface GrowthDeps {
  db: DB;
  cfg?: GrowthConfig;
  config?: GrowthConfig;
  llm?: Complete | null;
  send?: SendEmail;
  pagePath?: string; // path to growth.html; served at GET /growth
}

type Next = (err?: unknown) => void;
type Req = IncomingMessage & { body?: unknown };

const MAX_BODY = 64 * 1024;

async function readBody(req: Req): Promise<Record<string, any>> {
  if (req.body && typeof req.body === "object") return req.body as Record<string, any>;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_BODY) throw Object.assign(new Error("body too large"), { status: 413 });
    chunks.push(c as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  const type = String(req.headers["content-type"] ?? "");
  if (!raw) return {};
  if (type.includes("application/json")) return JSON.parse(raw);
  return Object.fromEntries(new URLSearchParams(raw));
}

function send(res: ServerResponse, status: number, body: string, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(body);
}
const json = (res: ServerResponse, status: number, obj: unknown) => send(res, status, JSON.stringify(obj));
const xml = (res: ServerResponse, body: string) => send(res, 200, body, "text/xml; charset=utf-8");

function clientIp(req: IncomingMessage): string {
  const xff = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  return xff || req.socket.remoteAddress || "";
}

function bearerOk(req: IncomingMessage, token: string): boolean {
  if (!token) return false;
  const got = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

function page(title: string, msg: string, form = ""): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;background:#0b1020;color:#e8ecf5;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}
main{max-width:440px;background:#121a2e;border:1px solid #24304d;border-radius:12px;padding:28px}button{font:inherit;background:#5eead4;color:#062a26;border:0;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer}</style></head>
<body><main><h1 style="font-size:20px;margin:0 0 8px">${title}</h1><p>${msg}</p>${form}</main></body></html>`;
}

export function createGrowthHandler(deps: GrowthDeps) {
  const db = deps.db;
  const cfg = (deps.cfg || deps.config)!;
  const chatLimit = makeRateLimiter(20, 60_000);
  const signupLimit = makeRateLimiter(5, 60_000);
  const pageHtml = deps.pagePath && existsSync(deps.pagePath) ? readFileSync(deps.pagePath, "utf8") : null;

  return async function growthHandler(req: Req, res: ServerResponse, next?: Next): Promise<void> {
    const url = new URL(req.url ?? "/", "http://local");
    const path = url.pathname.replace(/\/$/, "") || "/";
    const method = req.method ?? "GET";
    try {
      if (path === "/growth") {
        res.writeHead(301, { Location: "/" });
        res.end();
        return;
      }
      if (!path.startsWith("/api/growth")) return next ? next() : json(res, 404, { error: "not found" });
      const route = path.slice("/api/growth".length) || "/";

      // ---- public: disclosures shown next to the form checkboxes
      if (route === "/disclosures" && method === "GET") return json(res, 200, DISCLOSURES);

      // ---- public: signup
      if (route === "/signup" && method === "POST") {
        if (!signupLimit(clientIp(req))) return json(res, 429, { error: "Too many attempts. Try again in a minute." });
        const body = await readBody(req);
        const r = handleSignup(db, body, { ip: clientIp(req), userAgent: String(req.headers["user-agent"] ?? "").slice(0, 300) });
        if (!r.ok) return json(res, r.error === "rejected" ? 200 : 400, r.error === "rejected" ? { ok: true } : r);
        if (r.isNew && body.email) {
          const mail = wrapEmail(
            cfg, String(body.email), "Welcome to QuanterraOS",
            `Thanks for creating your QuanterraOS account.${r.callbackScheduled ? " Our AI assistant will call you during business hours, as you asked." : ""}\n\nReply to this email any time to reach the team.\n\nThe QuanterraOS team`,
            "You're receiving this because you created an account at quanterraos.com.",
          );
          if (deps.send) deps.send(mail).catch(() => {});
        }
        return json(res, 200, { ok: true, callbackScheduled: r.callbackScheduled });
      }

      // ---- public: concierge chat
      if (route === "/chat" && method === "POST") {
        if (!deps.llm) return json(res, 503, { error: "Chat is not configured yet." });
        if (!chatLimit(clientIp(req))) return json(res, 429, { error: "You're sending messages quickly — give it a moment." });
        const body = await readBody(req);
        const history = sanitizeHistory(body.messages);
        if (!history) return json(res, 400, { error: "invalid messages" });
        const reply = await concierge(deps.llm, history);
        return json(res, 200, { reply });
      }

      // ---- public: unsubscribe (GET shows a confirm page; POST does it — incl. RFC 8058 one-click)
      if (route === "/unsubscribe") {
        const token = url.searchParams.get("t") ?? "";
        const email = readUnsubToken(cfg.hmacSecret, token);
        if (!email) return send(res, 400, page("Link not valid", "This unsubscribe link is invalid or incomplete. Reply STOP to any of our emails and we'll remove you."), "text/html; charset=utf-8");
        if (method === "GET")
          return send(res, 200, page("Unsubscribe", `Stop all QuanterraOS emails to <b>${email.replace(/</g, "&lt;")}</b>?`,
            `<form method="post" action="?t=${encodeURIComponent(token)}"><button type="submit">Unsubscribe</button></form>`), "text/html; charset=utf-8");
        if (method === "POST") {
          await readBody(req).catch(() => ({}));
          unsubscribe(db, email, "unsubscribe-link");
          return send(res, 200, page("You're unsubscribed", "You won't receive further emails from QuanterraOS."), "text/html; charset=utf-8");
        }
      }

      // ---- your email provider's webhook: replies, bounces, complaints
      if (route === "/email-events" && method === "POST") {
        if (!bearerOk(req, cfg.adminToken)) return json(res, 401, { error: "unauthorized" });
        const body = await readBody(req);
        const events = Array.isArray(body.events) ? body.events : [body];
        for (const e of events) applyEmailEvent(db, String(e.type ?? ""), String(e.email ?? ""));
        return json(res, 200, { ok: true });
      }

      // ---- Twilio voice webhooks (signature-checked)
      if (route.startsWith("/voice/") && method === "POST") {
        const params = (await readBody(req)) as Record<string, string>;
        const fullUrl = cfg.publicBaseUrl + (req.url ?? "");
        if (cfg.twilioAuthToken && !validTwilioSignature(cfg.twilioAuthToken, fullUrl, params, String(req.headers["x-twilio-signature"] ?? "")))
          return json(res, 403, { error: "bad signature" });
        const cb = Number(url.searchParams.get("cb"));
        if (route === "/voice/answer") return xml(res, answerCall(db, cfg, cb, params.AnsweredBy));
        if (route === "/voice/turn") {
          if (!deps.llm) return xml(res, `<?xml version="1.0" encoding="UTF-8"?><Response><Say>A team member will follow up by email. Goodbye.</Say><Hangup/></Response>`);
          return xml(res, await callTurn(db, cfg, deps.llm, cb, params.SpeechResult ?? ""));
        }
        if (route === "/voice/status") {
          callStatus(db, cb, params.CallStatus ?? "");
          return json(res, 200, { ok: true });
        }
      }

      // ---- admin
      if (route === "/metrics" && method === "GET") {
        if (!bearerOk(req, cfg.adminToken)) return json(res, 401, { error: "unauthorized" });
        return json(res, 200, metrics(db));
      }

      return json(res, 404, { error: "not found" });
    } catch (err: any) {
      if (err?.status === 413) return json(res, 413, { error: "request too large" });
      if (err instanceof SyntaxError) return json(res, 400, { error: "invalid JSON" });
      console.error("[growth]", err);
      return json(res, 500, { error: "Something went wrong." });
    }
  };
}

export function unsubscribe(db: DB, email: string, source: string): void {
  const c = getContactByEmail(db, email);
  recordConsent(db, { contactId: c?.id ?? null, subject: email, channel: "email", action: "revoke", source });
  if (c) db.prepare("UPDATE contacts SET status='unsubscribed', next_touch_at=NULL WHERE id=?").run(c.id);
}

export function applyEmailEvent(db: DB, type: string, email: string): void {
  if (!email) return;
  const c = getContactByEmail(db, email);
  if (type === "reply") {
    // A human takes over from here; the outreach agent stops.
    if (c) db.prepare("UPDATE contacts SET status = CASE WHEN status='signed_up' THEN status ELSE 'replied' END, next_touch_at=NULL WHERE id=?").run(c.id);
  } else if (type === "bounce") {
    suppress(db, email.toLowerCase(), "email", "hard bounce");
    if (c) db.prepare("UPDATE contacts SET status='bounced', next_touch_at=NULL WHERE id=?").run(c.id);
  } else if (type === "complaint" || type === "unsubscribe") {
    unsubscribe(db, email, `provider:${type}`);
    if (type === "complaint" && c) db.prepare("UPDATE contacts SET status='complained' WHERE id=?").run(c.id);
  }
}
