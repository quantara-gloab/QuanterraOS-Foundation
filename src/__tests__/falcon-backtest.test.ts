import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

test("Falcon CI smoke test initializes a fresh database without inventing results", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "falcon-backtest-"));
  const dbPath = path.join(directory, "quanterraos.db");
  const cwd = fileURLToPath(new URL("../../", import.meta.url));
  const run = (script: string) => spawnSync(
    process.execPath,
    ["--experimental-strip-types", script],
    { cwd, env: { ...process.env, DB_PATH: dbPath }, encoding: "utf8" },
  );

  try {
    const missingDatabase = run("src/falcon-backtest.ts");
    assert.equal(missingDatabase.status, 1);
    assert.match(missingDatabase.stderr, /SQLITE_CANTOPEN/);
    assert.equal(existsSync(dbPath), false);

    const initialization = run("scripts/initialize-db.ts");
    assert.equal(initialization.status, 0, initialization.stderr);
    assert.equal(existsSync(dbPath), true);

    const backtest = run("src/falcon-backtest.ts");
    assert.equal(backtest.status, 0, backtest.stderr);
    const report = JSON.parse(backtest.stdout);
    assert.equal(report.source, "falcon-backtest");
    assert.equal(report.settledMarketsConsidered, 0);
    assert.equal(report.sampleSize, 0);
    assert.equal(report.dateRange, null);
    assert.equal(report.falconAverageBrier, null);
    assert.equal(report.naiveFiftyFiftyAverageBrier, null);
    assert.equal(report.naiveEntryPriceAverageBrier, null);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
