// Usage: npm run import-prospects -- path/to/prospects.csv "source-label"
import { readFileSync } from "node:fs";
import { loadConfig, openDb, importProspects, parseCsv } from "../src/growth/index.ts";

const [file, source] = process.argv.slice(2);
if (!file) { console.error("usage: import-prospects <file.csv> [source-label]"); process.exit(1); }
const db = openDb(loadConfig().dbPath);
console.log(importProspects(db, parseCsv(readFileSync(file, "utf8")), source ?? file));
