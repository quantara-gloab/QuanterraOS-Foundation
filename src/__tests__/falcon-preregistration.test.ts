import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('Phase 5 — Falcon Pre-Registration & Evaluation Units (HANDOFF.md Section H)', () => {
  const preregPath = path.join(rootDir, 'docs', 'falcon-preregistration.md');
  const servicePath = path.join(rootDir, 'deploy', 'systemd', 'quanterra-falcon-eval.service');
  const timerPath = path.join(rootDir, 'deploy', 'systemd', 'quanterra-falcon-eval.timer');
  const deployScriptPath = path.join(rootDir, 'deploy', 'deploy.sh');

  it('docs/falcon-preregistration.md exists and contains fixed hypothesis and thresholds', () => {
    assert.strictEqual(fs.existsSync(preregPath), true, 'docs/falcon-preregistration.md must exist');
    const content = fs.readFileSync(preregPath, 'utf8');

    // H2 criteria: Brier vs market mid, n >= 500 threshold, BSS > 0 with 95% CI excluding 0
    assert.match(content, /500 settled/i, 'Must define minimum sample size of 500 settled markets');
    assert.match(content, /Brier Skill Score/i, 'Must specify Brier Skill Score metric');
    assert.match(content, /bootstrap/i, 'Must specify bootstrap confidence interval methodology');
    assert.match(content, /Rule B5/i, 'Must reiterate Rule B5 capital lock');
    assert.match(content, /reports\/falcon-backtest/i, 'Must document reports logging path');
  });

  it('deploy/systemd/quanterra-falcon-eval.service exists and runs falcon-backtest.ts to reports/', () => {
    assert.strictEqual(fs.existsSync(servicePath), true, 'quanterra-falcon-eval.service must exist');
    const content = fs.readFileSync(servicePath, 'utf8');

    assert.match(content, /User=quanterraos/, 'Service must run under quanterraos user');
    assert.match(content, /src\/falcon-backtest\.ts/, 'Service must invoke src/falcon-backtest.ts');
    assert.match(content, /reports\/falcon-backtest/, 'Service must output to reports directory');
  });

  it('deploy/systemd/quanterra-falcon-eval.timer exists with daily calendar schedule', () => {
    assert.strictEqual(fs.existsSync(timerPath), true, 'quanterra-falcon-eval.timer must exist');
    const content = fs.readFileSync(timerPath, 'utf8');

    assert.match(content, /OnCalendar=daily/, 'Timer must run daily');
    assert.match(content, /Persistent=true/, 'Timer must have Persistent=true');
  });

  it('deploy/deploy.sh exists with strict bash safety flags and healthz check', () => {
    assert.strictEqual(fs.existsSync(deployScriptPath), true, 'deploy/deploy.sh must exist');
    const content = fs.readFileSync(deployScriptPath, 'utf8');

    assert.match(content, /set -euo pipefail/, 'Must use strict bash safety flags');
    assert.match(content, /sudo -u quanterraos git fetch origin main/, 'Must run git as service user');
    assert.match(content, /git reset --hard origin\/main/, 'Must reset cleanly to origin/main');
    assert.match(content, /systemctl restart quanterra-web/, 'Must restart web service');
    assert.match(content, /healthz/, 'Must verify endpoint healthz before completing');
  });
});
