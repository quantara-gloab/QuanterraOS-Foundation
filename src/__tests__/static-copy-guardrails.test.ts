import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCouncilDashboardPage } from '../dashboard-terminal.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');

describe('Static Copy Guardrail Audit — Rule B4 Compliance', () => {
  const serverPath = path.join(srcDir, 'server.ts');
  const dashboardPath = path.join(srcDir, 'dashboard-terminal.ts');
  const calibrationPagePath = path.join(srcDir, 'calibration-page.ts');

  const serverContent = fs.readFileSync(serverPath, 'utf8');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const calibrationContent = fs.readFileSync(calibrationPagePath, 'utf8');

  const renderedDashboardHtml = renderCouncilDashboardPage();

  it('no banned marketing superlatives or unvalidated comparisons (Tesla, Citadel)', () => {
    const prohibitedSuperlatives = [
      /\bTesla of\b/i,
      /\bTesla\b/i,
      /\bAlpha Citadel\b/i,
      /\bCombat Readiness\b/i,
      /\bCadet Allocator\b/i,
      /\bSovereign Risk Marshal\b/i,
      /\bCalibrated Alpha Commander\b/i,
    ];

    for (const pattern of prohibitedSuperlatives) {
      assert.strictEqual(
        pattern.test(serverContent),
        false,
        `server.ts contains prohibited term matching ${pattern}`
      );
      assert.strictEqual(
        pattern.test(dashboardContent),
        false,
        `dashboard-terminal.ts contains prohibited term matching ${pattern}`
      );
      assert.strictEqual(
        pattern.test(renderedDashboardHtml),
        false,
        `Rendered dashboard HTML contains prohibited term matching ${pattern}`
      );
    }
  });

  it('strictly adheres to HANDOFF.md Rule B4 banned language across public UI templates', () => {
    // Rule B4: "working your capital," "mispriced opportunities," "guaranteed,"
    // "verified trustworthy" (as static label), "order routing," "arbitrage opportunity," "beat the market"
    const ruleB4BannedPhrases = [
      'working your capital',
      'mispriced opportunities',
      'guaranteed profit',
      'guaranteed return',
      'verified trustworthy',
      'order routing',
      'arbitrage opportunity',
    ];

    for (const phrase of ruleB4BannedPhrases) {
      const regex = new RegExp(phrase, 'i');
      assert.strictEqual(
        regex.test(serverContent),
        false,
        `server.ts must not contain banned phrase: "${phrase}"`
      );
      assert.strictEqual(
        regex.test(dashboardContent),
        false,
        `dashboard-terminal.ts must not contain banned phrase: "${phrase}"`
      );
      assert.strictEqual(
        regex.test(calibrationContent),
        false,
        `calibration-page.ts must not contain banned phrase: "${phrase}"`
      );
      assert.strictEqual(
        regex.test(renderedDashboardHtml),
        false,
        `rendered dashboard HTML must not contain banned phrase: "${phrase}"`
      );
    }
  });

  it('verifies that the bridge console explicitly displays Rule B5 and zero live capital status', () => {
    assert.match(
      renderedDashboardHtml,
      /RULE B5 LOCKED/i,
      'Dashboard must state Rule B5 is locked'
    );
    assert.match(
      renderedDashboardHtml,
      /ZERO LIVE CAPITAL DEPLOYED/i,
      'Dashboard must disclose zero live capital is deployed'
    );
  });
});
