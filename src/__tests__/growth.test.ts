import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import { loadConfig } from "../growth/config.ts";
import { openDb, getContactByEmail, type Contact } from "../growth/db.ts";
import { recordConsent, hasConsent, verifyLedger } from "../growth/consent.ts";
import { canEmail, canCall, isFreemail } from "../growth/compliance.ts";
import { makeUnsubToken, readUnsubToken } from "../growth/unsubscribe.ts";
import { runOutreach, type OutgoingEmail } from "../growth/email.ts";
import { importProspects, parseCsv } from "../growth/prospects.ts";
import { handleSignup } from "../growth/signup.ts";
import { runCallbacks, callTurn, validTwilioSignature, answerCall } from "../growth/voice.ts";
import { createGrowthHandler } from "../growth/router.ts";
import { tick } from "../growth/supervisor.ts";

const SECRET = "x".repeat(40);
const cfg = () =>
  loadConfig({
    COMPANY_POSTAL_ADDRESS: "123 Example St, Los Angeles, CA 90001",
    SENDER_EMAIL: "hello@mail.quanterraos.com",
    GROWTH_HMAC_SECRET: SECRET,
    GROWTH_ADMIN_TOKEN: "admin-token",
    PUBLIC_BASE_URL: "https://quanterraos.com",
    DAILY_EMAIL_CAP: "3",
  });

function seedProspects(db = openDb(":memory:")) {
  importProspects(db, parseCsv(
    `email,name,company,title,country,timezone
ana@acmebank.com,Ana Ruiz,Acme Bank,CRO,US,America/Chicago
"bo@clinic.org","Bo, Jr.",Clinic Co,CIO,US,America/New_York
eu@firma.de,Eva,Firma GmbH,CTO,DE,Europe/Berlin
someone@gmail.com,Sam,Self,,US,America/Denver
bad-email,X,Y,Z,US,
ca@maple.ca,Cam,Maple,VP,CA,America/Toronto`), "test-list");
  return db;
}

test("csv import validates rows and handles quoted commas", () => {
  const db = openDb(":memory:");
  const r = importProspects(db, parseCsv(`email,name,country\n"a@b.com","Smith, J",us\nnope,X,US\n`), "t");
  assert.deepEqual(r, { added: 1, skippedExisting: 0, skippedSuppressed: 0, invalid: 1 });
  assert.equal(getContactByEmail(db, "a@b.com")!.name, "Smith, J");
  assert.equal(getContactByEmail(db, "a@b.com")!.country, "US");
});

test("cold email gating: country, freemail, touch limit", () => {
  const db = seedProspects();
  const c = cfg();
  const get = (e: string) => getContactByEmail(db, e)!;
  assert.equal(canEmail(db, c, get("ana@acmebank.com"), "cold").allow, true);
  assert.match(canEmail(db, c, get("eu@firma.de"), "cold").reason, /DE not enabled/);
  assert.match(canEmail(db, c, get("ca@maple.ca"), "cold").reason, /CA not enabled/);
  assert.match(canEmail(db, c, get("someone@gmail.com"), "cold").reason, /personal mailbox/);
  assert.ok(isFreemail("x@Outlook.com"));
  const maxed = { ...get("ana@acmebank.com"), touches: 3 } as Contact;
  assert.match(canEmail(db, c, maxed, "cold").reason, /3-touch limit/);
});

test("consent ledger: grant, revoke, tamper detection", () => {
  const db = openDb(":memory:");
  recordConsent(db, { contactId: null, subject: "A@X.com", channel: "email", action: "grant", source: "t" });
  assert.equal(hasConsent(db, "email", "a@x.com"), true);
  recordConsent(db, { contactId: null, subject: "(555) 222-3333", channel: "call", action: "grant", source: "t" });
  assert.equal(hasConsent(db, "call", "+15552223333"), true);
  recordConsent(db, { contactId: null, subject: "a@x.com", channel: "email", action: "revoke", source: "t" });
  assert.equal(hasConsent(db, "email", "a@x.com"), false);
  // a later re-grant cannot override the suppression list
  recordConsent(db, { contactId: null, subject: "a@x.com", channel: "email", action: "grant", source: "t" });
  assert.equal(hasConsent(db, "email", "a@x.com"), false);
  assert.deepEqual(verifyLedger(db), { ok: true, entries: 4 });
  db.prepare("UPDATE consent_events SET action='grant' WHERE seq=3").run();
  assert.deepEqual(verifyLedger(db), { ok: false, entries: 4, brokenAt: 3 });
});

test("unsubscribe tokens round-trip and reject tampering", () => {
  const t = makeUnsubToken(SECRET, "Ana@AcmeBank.com");
  assert.equal(readUnsubToken(SECRET, t), "ana@acmebank.com");
  assert.equal(readUnsubToken("y".repeat(40), t), null);
  const forged = Buffer.from("victim@x.com").toString("base64url") + "." + t.split(".")[1];
  assert.equal(readUnsubToken(SECRET, forged), null);
});

test("outreach run: sends only eligible, adds compliance footer, schedules follow-ups, honors cap", async () => {
  const db = seedProspects();
  const sent: OutgoingEmail[] = [];
  const send = async (m: OutgoingEmail) => (sent.push(m), { ok: true, id: "m" + sent.length });
  const now = new Date("2026-10-06T16:00:00Z");
  const s = await runOutreach(db, cfg(), send, null, now);
  assert.equal(s.sent, 2); // ana + bo
  assert.equal(s.blocked, 3); // DE, CA, gmail
  const m = sent[0];
  assert.match(m.text, /123 Example St/);
  assert.match(m.text, /Unsubscribe in one click: https:\/\/quanterraos\.com\/api\/growth\/unsubscribe\?t=/);
  assert.equal(m.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.doesNotMatch(m.subject, /^re:/i);
  const ana = getContactByEmail(db, "ana@acmebank.com")!;
  assert.equal(ana.touches, 1);
  assert.equal(ana.next_touch_at, "2026-10-10T16:00:00.000Z");
  // nothing due again until follow-up date
  assert.equal((await runOutreach(db, cfg(), send, null, now)).sent, 0);
  // follow-up day: both get touch 2, flagged as follow-ups
  const s2 = await runOutreach(db, cfg(), send, null, new Date("2026-10-10T17:00:00Z"));
  assert.equal(s2.sent, 2);
  assert.match(sent[2].subject, /Following up/);
  // final touch, then the sequence ends
  const s3 = await runOutreach(db, cfg(), send, null, new Date("2026-10-17T18:00:00Z"));
  assert.equal(s3.sent, 2);
  assert.match(sent[4].subject, /Closing the loop/);
  assert.equal(getContactByEmail(db, "ana@acmebank.com")!.status, "done");
  assert.equal((await runOutreach(db, cfg(), send, null, new Date("2026-12-01T00:00:00Z"))).sent, 0);
});

test("daily cap is enforced", async () => {
  const db = openDb(":memory:");
  importProspects(db, [1, 2, 3, 4, 5].map((i) => ({ email: `p${i}@co${i}.com`, country: "US" })), "t");
  const s = await runOutreach(db, cfg(), async () => ({ ok: true }), null, new Date("2026-10-06T16:00:00Z"));
  assert.equal(s.sent, 3);
  assert.equal(s.capped, true);
});

test("reply stops the sequence", async () => {
  const db = seedProspects();
  const handler = createGrowthHandler({ db, cfg: cfg(), llm: null, send: async () => ({ ok: true }) });
  const { status } = await call(handler, "POST", "/api/growth/email-events", { type: "reply", email: "ana@acmebank.com" }, { authorization: "Bearer admin-token" });
  assert.equal(status, 200);
  assert.equal(getContactByEmail(db, "ana@acmebank.com")!.status, "replied");
  const d = canEmail(db, cfg(), getContactByEmail(db, "ana@acmebank.com")!, "cold");
  assert.equal(d.allow, false);
  const unauth = await call(handler, "POST", "/api/growth/email-events", { type: "reply", email: "bo@clinic.org" });
  assert.equal(unauth.status, 401);
});

test("signup records exact disclosures, converts prospect, and schedules a callback only with consent", () => {
  const db = seedProspects();
  const r = handleSignup(db, { email: "ana@acmebank.com", name: "Ana", phone: "312-555-0100", timezone: "America/Chicago", consentEmail: "on", consentCall: "on" }, { ip: "1.2.3.4" });
  assert.ok(r.ok && r.callbackScheduled && !r.isNew);
  const ana = getContactByEmail(db, "ana@acmebank.com")!;
  assert.equal(ana.kind, "signup");
  assert.equal(ana.lawful_basis, "consent");
  const ev = db.prepare("SELECT channel, disclosure_text, ip FROM consent_events ORDER BY seq").all() as any[];
  assert.equal(ev.length, 2);
  assert.match(ev[1].disclosure_text, /AI voice assistant/);
  assert.equal(ev[1].ip, "1.2.3.4");
  const noCall = handleSignup(db, { email: "new@co.com", phone: "312-555-0101", consentCall: false }, {});
  assert.ok(noCall.ok && !noCall.callbackScheduled);
  assert.equal(handleSignup(db, { email: "x@co.com", consentCall: "on" }, {}).ok, false); // call w/o phone
  assert.equal(handleSignup(db, { email: "not-an-email" }, {}).ok, false);
});

test("voice: never calls without consent, respects local hours, and 'stop calling' revokes", async () => {
  const db = openDb(":memory:");
  handleSignup(db, { email: "p@co.com", name: "Pat Lee", phone: "+13125550100", timezone: "America/Chicago", consentCall: "on" }, {});
  const c = cfg();
  const dialed: string[] = [];
  const dial = async (to: string) => (dialed.push(to), { ok: true, sid: "CA1" });
  // 03:00 Chicago → held
  let s = await runCallbacks(db, c, dial, new Date("2026-10-06T08:00:00Z"));
  assert.equal(s.held, 1);
  assert.equal(dialed.length, 0);
  // 11:00 Chicago → dials
  s = await runCallbacks(db, c, dial, new Date("2026-10-06T16:00:00Z"));
  assert.equal(s.started, 1);
  assert.deepEqual(dialed, ["+13125550100"]);
  const contact = getContactByEmail(db, "p@co.com")!;
  assert.match(answerCall(db, c, 1, "human"), /AI assistant — an automated agent, not a person/);
  const out = await callTurn(db, c, async () => "should not be called", 1, "please stop calling me");
  assert.match(out, /won't call this number again/);
  assert.equal(hasConsent(db, "call", "+13125550100"), false);
  assert.equal(canCall(db, c, contact, "+13125550100", 0, new Date("2026-10-06T16:00:00Z")).allow, false);
  // a prospect with a phone number but no consent is never callable
  const db2 = seedProspects();
  const ana = getContactByEmail(db2, "ana@acmebank.com")!;
  assert.match(canCall(db2, c, ana, "+13125559999", 0, new Date("2026-10-06T16:00:00Z")).reason, /no express consent/);
});

test("twilio signature check", () => {
  const params = { CallSid: "CA123", SpeechResult: "hello" };
  const url = "https://quanterraos.com/api/growth/voice/turn?cb=1";
  const sig = createHmac("sha1", "tok").update(url + "CallSidCA123SpeechResulthello").digest("base64");
  assert.equal(validTwilioSignature("tok", url, params, sig), true);
  assert.equal(validTwilioSignature("tok", url, { ...params, SpeechResult: "x" }, sig), false);
});

test("supervisor halts all outbound when config is incomplete or the ledger is broken", async () => {
  const db = seedProspects();
  const sent: unknown[] = [];
  const deps = { db, send: async (m: any) => (sent.push(m), { ok: true }), dial: async () => ({ ok: true }), llm: null };
  const bad = await tick({ ...deps, cfg: loadConfig({}) });
  assert.equal(bad.halted, true);
  recordConsent(db, { contactId: null, subject: "a@b.com", channel: "email", action: "grant", source: "t" });
  db.prepare("UPDATE consent_events SET subject='z@b.com'").run();
  const broken = await tick({ ...deps, cfg: cfg() });
  assert.equal(broken.halted, true);
  assert.match(broken.problems.join(), /ledger failed/);
  assert.equal(sent.length, 0);
});

test("http: signup + one-click unsubscribe end to end", async () => {
  const db = openDb(":memory:");
  const mails: OutgoingEmail[] = [];
  const handler = createGrowthHandler({ db, cfg: cfg(), llm: null, send: async (m) => (mails.push(m), { ok: true }) });
  const r = await call(handler, "POST", "/api/growth/signup", { email: "z@co.com", consentEmail: true });
  assert.equal(r.status, 200);
  await new Promise((res) => setTimeout(res, 10));
  assert.equal(mails.length, 1);
  assert.equal(hasConsent(db, "email", "z@co.com"), true);
  const unsub = new URL(mails[0].headers["List-Unsubscribe"].slice(1, -1));
  const g = await call(handler, "GET", unsub.pathname + unsub.search);
  assert.equal(g.status, 200);
  assert.equal(hasConsent(db, "email", "z@co.com"), true); // GET alone doesn't unsubscribe (link scanners)
  const p = await call(handler, "POST", unsub.pathname + unsub.search, "List-Unsubscribe=One-Click", { "content-type": "application/x-www-form-urlencoded" });
  assert.equal(p.status, 200);
  assert.equal(hasConsent(db, "email", "z@co.com"), false);
  assert.equal(getContactByEmail(db, "z@co.com")!.status, "unsubscribed");
  const m = await call(handler, "GET", "/api/growth/metrics", undefined, { authorization: "Bearer admin-token" });
  assert.equal(JSON.parse(m.body).ledger.ok, true);
  assert.equal((await call(handler, "GET", "/api/growth/metrics")).status, 401);
  assert.equal((await call(handler, "POST", "/api/growth/chat", { messages: [{ role: "user", content: "hi" }] })).status, 503);
});

// --- helper: run the handler on a real ephemeral http server
async function call(handler: any, method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const srv = createServer((req, res) => handler(req, res, () => res.writeHead(404).end()));
  await new Promise<void>((r) => srv.listen(0, r));
  const port = (srv.address() as any).port;
  const isStr = typeof body === "string";
  const r = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { ...(body !== undefined && !isStr ? { "content-type": "application/json" } : {}), ...headers },
    body: body === undefined ? undefined : isStr ? (body as string) : JSON.stringify(body),
  });
  const text = await r.text();
  srv.close();
  return { status: r.status, body: text };
}
