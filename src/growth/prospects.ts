// Import B2B prospects from a CSV you have the right to use (your CRM,
// conference attendee lists you're licensed for, inbound inquiries, a
// reputable B2B data provider). Required columns: email, country.
// Optional: name, company, title, phone, timezone, source.
//
// Imported prospects are email-only. Phone numbers are stored for the human
// team but the AI voice agent never calls a prospect who hasn't opted in.

import { type DB, normEmail } from "./db.ts";
import { isSuppressed } from "./consent.ts";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

export function importProspects(db: DB, records: Record<string, string>[], defaultSource: string) {
  const s = { added: 0, skippedExisting: 0, skippedSuppressed: 0, invalid: 0 };
  const ins = db.prepare(
    `INSERT INTO contacts (email, phone, name, company, title, country, timezone, source, lawful_basis, kind)
     VALUES (?,?,?,?,?,?,?,?, 'b2b_cold', 'prospect')`,
  );
  const exists = db.prepare("SELECT 1 FROM contacts WHERE email = ?");
  for (const r of records) {
    const email = normEmail(r.email ?? "");
    const country = (r.country ?? "").trim().toUpperCase().slice(0, 2);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || country.length !== 2) {
      s.invalid++;
      continue;
    }
    if (isSuppressed(db, "email", email)) {
      s.skippedSuppressed++;
      continue;
    }
    if (exists.get(email)) {
      s.skippedExisting++;
      continue;
    }
    ins.run(email, r.phone || null, r.name || null, r.company || null, r.title || null, country, r.timezone || null, r.source || defaultSource);
    s.added++;
  }
  return s;
}
