// QuanterraOS Growth Engine — public entry point.
//
//   import { startGrowthEngine } from "./growth/index.ts";
//   const growth = startGrowthEngine({ pagePath: "public/growth.html" });
//   // raw http:   if (await growth.handle(req, res)) return;
//   // express:    app.use(growth.handler);

import type { IncomingMessage, ServerResponse } from "node:http";
import { loadConfig, outboundReadinessProblems, type GrowthConfig } from "./config.ts";
import { openDb, type DB } from "./db.ts";
import { makeClaude } from "./llm.ts";
import { makeSender } from "./email.ts";
import { makeTwilioDialer } from "./voice.ts";
import { createGrowthHandler } from "./router.ts";
import { tick } from "./supervisor.ts";

export interface StartOptions {
  pagePath?: string;
  runSupervisor?: boolean; // default true: tick every intervalMs inside this process
  intervalMs?: number;
  config?: GrowthConfig;
}

export function startGrowthEngine(opts: StartOptions = {}) {
  const cfg = opts.config ?? loadConfig();
  const db: DB = openDb(cfg.dbPath);
  const llm = cfg.anthropicApiKey ? makeClaude(cfg) : null;
  const send = makeSender(cfg);
  const dial = makeTwilioDialer(cfg);
  const handler = createGrowthHandler({ db, cfg, llm, send, pagePath: opts.pagePath });

  const problems = outboundReadinessProblems(cfg);
  if (problems.length) console.warn("[growth] outbound paused until fixed:\n  - " + problems.join("\n  - "));

  let timer: NodeJS.Timeout | undefined;
  if (opts.runSupervisor !== false) {
    const run = () =>
      tick({ db, cfg, send, dial, llm })
        .then((r) => { if (!r.halted && (r.email?.sent || r.calls?.started)) console.log("[growth] tick", JSON.stringify({ email: r.email, calls: r.calls })); })
        .catch((e) => console.error("[growth] tick failed", e));
    timer = setInterval(run, opts.intervalMs ?? 15 * 60_000);
    timer.unref();
    setTimeout(run, 10_000).unref();
  }

  /** For a raw http server: returns true if the request was handled. */
  async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    let passed = false;
    await handler(req, res, () => { passed = true; });
    return !passed;
  }

  return { cfg, db, handler, handle, stop: () => timer && clearInterval(timer) };
}

export { loadConfig } from "./config.ts";
export { openDb } from "./db.ts";
export { tick, metrics } from "./supervisor.ts";
export { importProspects, parseCsv } from "./prospects.ts";
export { verifyLedger } from "./consent.ts";
