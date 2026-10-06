// Sentinel: the supervising agent. Each tick it runs the outreach agent,
// dispatches due callbacks, verifies the consent ledger and reports metrics.
// If the ledger ever fails verification, all outbound activity stops.

import type { GrowthConfig } from "./config.ts";
import { outboundReadinessProblems } from "./config.ts";
import type { DB } from "./db.ts";
import { verifyLedger } from "./consent.ts";
import { runOutreach, type SendEmail } from "./email.ts";
import { runCallbacks, type PlaceCall } from "./voice.ts";
import type { Complete } from "./llm.ts";

export interface SupervisorDeps {
  db: DB;
  cfg: GrowthConfig;
  send: SendEmail;
  dial: PlaceCall;
  llm: Complete | null;
}

export async function tick(d: SupervisorDeps, now = new Date()) {
  const problems = outboundReadinessProblems(d.cfg);
  const ledger = verifyLedger(d.db);
  if (!ledger.ok) problems.push(`consent ledger failed verification at entry ${ledger.brokenAt} — outbound halted`);
  if (problems.length) return { halted: true, problems, ledger };
  const email = await runOutreach(d.db, d.cfg, d.send, d.llm, now);
  const calls = await runCallbacks(d.db, d.cfg, d.dial, now);
  return { halted: false, problems, ledger, email, calls };
}

export function metrics(db: DB) {
  const one = (sql: string, ...p: any[]) => Number((db.prepare(sql).get(...p) as { n: number }).n);
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  return {
    contacts: {
      prospects: one("SELECT COUNT(*) n FROM contacts WHERE kind='prospect'"),
      signups: one("SELECT COUNT(*) n FROM contacts WHERE kind='signup'"),
      signups7d: one("SELECT COUNT(*) n FROM contacts WHERE kind='signup' AND created_at >= ?", since),
      replied: one("SELECT COUNT(*) n FROM contacts WHERE status='replied'"),
      unsubscribed: one("SELECT COUNT(*) n FROM contacts WHERE status='unsubscribed'"),
    },
    email7d: {
      sent: one("SELECT COUNT(*) n FROM outreach_log WHERE channel='email' AND status IN ('sent','dry_run') AND at >= ?", since),
      blocked: one("SELECT COUNT(*) n FROM outreach_log WHERE channel='email' AND status='blocked' AND at >= ?", since),
      failed: one("SELECT COUNT(*) n FROM outreach_log WHERE channel='email' AND status='failed' AND at >= ?", since),
    },
    calls7d: {
      started: one("SELECT COUNT(*) n FROM outreach_log WHERE channel='call' AND status IN ('sent','dry_run') AND at >= ?", since),
      pending: one("SELECT COUNT(*) n FROM callbacks WHERE status='pending'"),
      completed: one("SELECT COUNT(*) n FROM callbacks WHERE status='done'"),
    },
    suppressed: one("SELECT COUNT(*) n FROM suppression"),
    ledger: verifyLedger(db),
  };
}
