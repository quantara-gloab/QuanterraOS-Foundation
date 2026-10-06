import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type DB = DatabaseSync;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS contacts (
  id            INTEGER PRIMARY KEY,
  email         TEXT UNIQUE,
  phone         TEXT,
  name          TEXT,
  company       TEXT,
  title         TEXT,
  country       TEXT,            -- ISO 3166-1 alpha-2
  timezone      TEXT,            -- IANA, e.g. America/Chicago
  source        TEXT NOT NULL,   -- where the record came from (import file, signup form, chat)
  lawful_basis  TEXT NOT NULL,   -- 'consent' | 'b2b_cold'
  kind          TEXT NOT NULL,   -- 'prospect' | 'signup'
  status        TEXT NOT NULL DEFAULT 'new',
  touches       INTEGER NOT NULL DEFAULT 0,
  last_touch_at TEXT,
  next_touch_at TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Append-only, hash-chained record of every consent grant and revocation.
CREATE TABLE IF NOT EXISTS consent_events (
  seq             INTEGER PRIMARY KEY,
  contact_id      INTEGER REFERENCES contacts(id),
  subject         TEXT NOT NULL,   -- normalized email or E.164 phone
  channel         TEXT NOT NULL,   -- 'email' | 'call'
  action          TEXT NOT NULL,   -- 'grant' | 'revoke'
  disclosure_text TEXT,            -- exact wording the person agreed to
  source          TEXT NOT NULL,
  ip              TEXT,
  user_agent      TEXT,
  at              TEXT NOT NULL,
  prev_hash       TEXT NOT NULL,
  hash            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppression (
  value   TEXT NOT NULL,
  channel TEXT NOT NULL,           -- 'email' | 'call' | 'all'
  reason  TEXT NOT NULL,
  at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (value, channel)
);

CREATE TABLE IF NOT EXISTS outreach_log (
  id          INTEGER PRIMARY KEY,
  contact_id  INTEGER REFERENCES contacts(id),
  channel     TEXT NOT NULL,
  kind        TEXT NOT NULL,       -- 'cold_1' | 'follow_up' | 'welcome' | 'call' ...
  subject     TEXT,
  body        TEXT,
  provider_id TEXT,
  status      TEXT NOT NULL,       -- 'sent' | 'blocked' | 'failed' | 'dry_run'
  detail      TEXT,
  at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS callbacks (
  id            INTEGER PRIMARY KEY,
  contact_id    INTEGER NOT NULL REFERENCES contacts(id),
  phone         TEXT NOT NULL,
  requested_at  TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | calling | done | failed | cancelled
  call_sid      TEXT,
  transcript    TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_contacts_next ON contacts(next_touch_at);
CREATE INDEX IF NOT EXISTS idx_callbacks_due ON callbacks(status, scheduled_for);
`;

export function openDb(path: string): DB {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

export function nowIso(d: Date = new Date()): string {
  return d.toISOString();
}

export function normEmail(e: string): string {
  return e.trim().toLowerCase();
}

/** Very small E.164 normalizer: keeps a leading + and digits. */
export function normPhone(p: string): string {
  const t = p.trim();
  const digits = t.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (t.startsWith("+")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits; // assume NANP when no country code
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return "+" + digits;
}

export interface Contact {
  id: number;
  email: string | null;
  phone: string | null;
  name: string | null;
  company: string | null;
  title: string | null;
  country: string | null;
  timezone: string | null;
  source: string;
  lawful_basis: "consent" | "b2b_cold";
  kind: "prospect" | "signup";
  status: string;
  touches: number;
  last_touch_at: string | null;
  next_touch_at: string | null;
  notes: string | null;
  created_at: string;
}

export function getContact(db: DB, id: number): Contact | undefined {
  return db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Contact | undefined;
}

export function getContactByEmail(db: DB, email: string): Contact | undefined {
  return db.prepare("SELECT * FROM contacts WHERE email = ?").get(normEmail(email)) as Contact | undefined;
}
