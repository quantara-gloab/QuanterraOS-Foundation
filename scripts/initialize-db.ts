import { closeDb, db, runMigrations } from "../src/db.ts";

try {
  runMigrations();
  console.log("Database migrations completed.");
} finally {
  closeDb();
}