/**
 * QuanterraOS Retained Backup File Cold-Recovery Drill CLI
 *
 * Runs a standalone recovery drill:
 * 1. Creates an immutable retained backup snapshot file on disk.
 * 2. Initializes an isolated physical SQLite database file on disk.
 * 3. Restores all accounts, risk plans, journals, imports, tickets, and attributions.
 * 4. Runs SQLite integrity checks, row-count parity, and cryptographic SHA-256 validation.
 * 5. Exercises isolated write durability.
 *
 * Usage:
 *   node --experimental-strip-types scripts/run-retained-recovery-drill.ts
 */

import { executeRetainedRecoveryDrill } from "../src/retained-recovery-drill.ts";

console.log("\n============================================================");
console.log(" QuanterraOS Retained File Recovery Drill");
console.log(" Timestamp:", new Date().toISOString());
console.log("============================================================\n");

const report = executeRetainedRecoveryDrill();

console.log("Status:                 ", report.status);
console.log("Success:                ", report.success);
console.log("Backup File:            ", report.backupFilePath);
console.log("Backup File Size:       ", report.backupFileSizeBytes.toLocaleString(), "bytes");
console.log("Isolated DB Path:       ", report.isolatedDbPath);
console.log("Duration:               ", `${report.durationMs}ms`);
console.log("PRAGMA Integrity Check: ", report.integrityCheckPassed ? "PASSED" : "FAILED");
console.log("Isolation Write Verified:", report.isolationVerified ? "PASSED" : "FAILED");
console.log("SHA-256 Checksum Match: ", report.checksums.match ? "PASSED (100% PARITY)" : "FAILED");
console.log("\nRecord Counts Parity:");
for (const [k, v] of Object.entries(report.sourceCounts)) {
  console.log(`  - ${k.padEnd(24)}: Source = ${v}, Restored = ${(report.restoredCounts as any)[k]}`);
}

console.log("\nSupporting Log:");
console.log(report.supportingLog);

if (report.errors.length > 0) {
  console.error("\nErrors encountered:");
  for (const err of report.errors) {
    console.error("  ✖", err);
  }
  process.exit(1);
} else {
  console.log("\n✔ Drill completed successfully! Retained cold-recovery verified on disk.\n");
  process.exit(0);
}
