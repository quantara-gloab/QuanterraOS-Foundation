// One supervisor tick — run from cron/systemd timer if you don't want the in-process interval.
import { loadConfig, openDb, tick } from "../src/growth/index.ts";
import { makeClaude } from "../src/growth/llm.ts";
import { makeSender } from "../src/growth/email.ts";
import { makeTwilioDialer } from "../src/growth/voice.ts";

const cfg = loadConfig();
const db = openDb(cfg.dbPath);
const r = await tick({ db, cfg, send: makeSender(cfg), dial: makeTwilioDialer(cfg), llm: cfg.anthropicApiKey ? makeClaude(cfg) : null });
console.log(JSON.stringify(r, null, 2));
