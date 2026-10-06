import { loadConfig, openDb, verifyLedger } from "../src/growth/index.ts";
const r = verifyLedger(openDb(loadConfig().dbPath));
console.log(r.ok ? `Consent ledger intact (${r.entries} entries).` : `LEDGER BROKEN at entry ${r.brokenAt}.`);
process.exit(r.ok ? 0 : 1);
