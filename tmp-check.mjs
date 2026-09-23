import Database from "better-sqlite3";
import { runMigrations } from "./src/db.ts";
runMigrations();
const db = new Database("./quanterraos.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
console.log(JSON.stringify(tables));
db.close();
