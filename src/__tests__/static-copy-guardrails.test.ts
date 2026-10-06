import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCouncilDashboardPage } from '../dashboard-terminal.ts';
import { renderLandingPage } from '../landing-page.ts';
import { renderPredictionsPage } from '../predictions-page.ts';
import { renderAutopilotPage } from '../autopilot-page.ts';
import { renderPricingPageHtml } from '../pricing-page.ts';
import { renderTwoStrategiesLostPageHtml } from '../blog-page.ts';
import { renderAccountPageHtml } from '../account-page.ts';
import { renderKalshiTerminalHtml } from '../kalshi-terminal-page.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');

describe('Static Copy Guardrail Audit — Rule B4 Compliance', () => {
  const serverPath = path.join(srcDir, 'server.ts');
  const dashboardPath = path.join(srcDir, 'dashboard-terminal.ts');
  const calibrationPagePath = path.join(srcDir, 'calibration-page.ts');
  const landingPagePath = path.join(srcDir, 'landing-page.ts');
  const indexPagePath = path.join(srcDir, 'index-page.ts');
  const legalPagePath = path.join(srcDir, 'legal-page.ts');
  const statusPagePath = path.join(srcDir, 'status-page.ts');
  const predictionsPagePath = path.join(srcDir, 'predictions-page.ts');
  const autopilotPagePath = path.join(srcDir, 'autopilot-page.ts');
  const kalshiPagePath = path.join(srcDir, 'kalshi-terminal-page.ts');

  const serverContent = fs.readFileSync(serverPath, 'utf8');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const calibrationContent = fs.readFileSync(calibrationPagePath, 'utf8');
  const landingContent = fs.readFileSync(landingPagePath, 'utf8');
  const indexPageContent = fs.readFileSync(indexPagePath, 'utf8');
  const legalPageContent = fs.readFileSync(legalPagePath, 'utf8');
  const statusPageContent = fs.readFileSync(statusPagePath, 'utf8');
  const predictionsPageContent = fs.readFileSync(predictionsPagePath, 'utf8');
  const autopilotPageContent = fs.readFileSync(autopilotPagePath, 'utf8');
  const kalshiContent = fs.readFileSync(kalshiPagePath, 'utf8');

  // Extract /subscribe and /account rendered templates from server.ts
  const subscribeMatch = serverContent.match(/const clerkSubscribePage = `([\s\S]*?)`;/);
  const accountMatch = serverContent.match(/const clerkAccountPage = `([\s\S]*?)`;/);
  const clerkSubscribeHtml = subscribeMatch ? subscribeMatch[1] : '';
  const clerkAccountHtml = accountMatch ? accountMatch[1] : '';

  const renderedDashboardHtml = renderCouncilDashboardPage();
  const renderedLandingHtml = renderLandingPage();
  const renderedPredictionsLiveHtml = renderPredictionsPage({ isReplay: false });
  const renderedPredictionsReplayHtml = renderPredictionsPage({ isReplay: true });
  const renderedAutopilotHtml = renderAutopilotPage();
  const renderedPricingHtml = renderPricingPageHtml();
  const renderedBlogHtml = renderTwoStrategiesLostPageHtml();
  const renderedAccountHtml = renderAccountPageHtml(null, "free");
  const renderedKalshiHtml = renderKalshiTerminalHtml();

  const allStaticSources = [
    { name: 'server.ts', content: serverContent },
    { name: 'dashboard-terminal.ts', content: dashboardContent },
    { name: 'calibration-page.ts', content: calibrationContent },
    { name: 'landing-page.ts', content: landingContent },
    { name: 'index-page.ts', content: indexPageContent },
    { name: 'legal-page.ts', content: legalPageContent },
    { name: 'status-page.ts', content: statusPageContent },
    { name: '/subscribe (clerkSubscribePage)', content: clerkSubscribeHtml },
    { name: '/account (clerkAccountPage)', content: clerkAccountHtml },
    { name: 'renderedDashboardHtml', content: renderedDashboardHtml },
    { name: 'renderedLandingHtml', content: renderedLandingHtml },
    { name: 'predictions-page.ts', content: predictionsPageContent },
    { name: 'autopilot-page.ts', content: autopilotPageContent },
    { name: 'renderedPredictionsLiveHtml', content: renderedPredictionsLiveHtml },
    { name: 'renderedPredictionsReplayHtml', content: renderedPredictionsReplayHtml },
    { name: 'renderedAutopilotHtml', content: renderedAutopilotHtml },
    { name: 'renderedPricingHtml', content: renderedPricingHtml },
    { name: 'renderedBlogHtml', content: renderedBlogHtml },
    { name: 'renderedAccountHtml', content: renderedAccountHtml },
    { name: 'kalshi-terminal-page.ts', content: kalshiContent },
    { name: 'renderedKalshiHtml', content: renderedKalshiHtml },
  ];

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

    for (const source of allStaticSources) {
      for (const pattern of prohibitedSuperlatives) {
        assert.strictEqual(
          pattern.test(source.content),
          false,
          `${source.name} contains prohibited term matching ${pattern}`
        );
      }
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

    for (const source of allStaticSources) {
      for (const phrase of ruleB4BannedPhrases) {
        const regex = new RegExp(phrase, 'i');
        assert.strictEqual(
          regex.test(source.content),
          false,
          `${source.name} must not contain banned phrase: "${phrase}"`
        );
      }
    }
  });

  it('verifies that /subscribe and /account tier copy contains no predictive edge claims and enforces Rule B5', () => {
    assert.ok(clerkSubscribeHtml.length > 0, '/subscribe HTML template must exist');
    assert.ok(clerkAccountHtml.length > 0, '/account HTML template must exist');

    // Rule B5 must be explicitly disclosed on monetization pages
    assert.match(clerkSubscribeHtml, /Rule B5/i, '/subscribe must explicitly reference Rule B5');
    assert.match(clerkAccountHtml, /Rule B5/i, '/account must explicitly reference Rule B5');
    assert.match(clerkSubscribeHtml, /\$0\.00/i, '/subscribe must state $0.00 live capital');
    assert.match(clerkAccountHtml, /\$0\.00/i, '/account must state $0.00 live capital');

    // Zero predictive edge claims in tier descriptions
    const forbiddenTierClaims = [
      /\bbetter signals\b/i,
      /\bpredictive advantage\b/i,
      /\bunlock.*edge\b/i,
      /\btrading edge\b/i,
      /\bbeat.*market\b/i,
      /\btrading signals\b/i,
      /\bprofit\b/i,
      /\balpha\b/i,
    ];
    for (const pattern of forbiddenTierClaims) {
      assert.strictEqual(
        pattern.test(clerkSubscribeHtml),
        false,
        `/subscribe tier copy must not contain predictive edge claim matching ${pattern}`
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

  it('strictly validates Council specialist roster alignment across rendered landing and dashboard templates', () => {
    const canonicalRoster = [
      'draco',
      'wolf',
      'falcon',
      'quantum-fox',
      'sentinel',
      'kraken',
      'lion',
      'phoenix'
    ];

    // Verify all 8 canonical specialists are present in landing page
    for (const agentId of canonicalRoster) {
      assert.strictEqual(
        renderedLandingHtml.includes(`openSpecialistModal('${agentId}'`),
        true,
        `Landing page must render modal link for canonical specialist: ${agentId}`
      );
      assert.strictEqual(
        renderedDashboardHtml.includes(`data-agent-id="${agentId}"`),
        true,
        `Dashboard console must render specialist item for canonical specialist: ${agentId}`
      );
    }

    // Verify rogue IDs (lyra, orion) do not exist
    const rogueIds = ['lyra', 'orion'];
    for (const rogue of rogueIds) {
      assert.strictEqual(
        renderedLandingHtml.toLowerCase().includes(rogue),
        false,
        `Landing page must not reference rogue specialist: ${rogue}`
      );
      assert.strictEqual(
        renderedDashboardHtml.toLowerCase().includes(rogue),
        false,
        `Dashboard console must not reference rogue specialist: ${rogue}`
      );
    }
  });

  it('verifies that /predictions and /autopilot strictly enforce Rule B5, label backtest replay, and contain no unbacked accuracy claims', () => {
    // Rule B5 must be explicitly disclosed
    assert.match(renderedPredictionsLiveHtml, /Rule B5/i, '/predictions must cite Rule B5');
    assert.match(renderedAutopilotHtml, /Rule B5/i, '/autopilot must cite Rule B5');
    assert.match(renderedAutopilotHtml, /\$0\.00/i, '/autopilot must state $0.00 capital');
    assert.match(renderedAutopilotHtml, /MODE: PAPER/i, '/autopilot must state MODE: PAPER');

    // Replay view must prominently label backtest replay
    assert.match(
      renderedPredictionsReplayHtml,
      /Backtest replay \(historical, not live\)/i,
      'Replay view must explicitly label backtest replay'
    );

    // Unbacked superlatives must not exist
    const forbiddenClaims = [
      /\b94% accuracy\b/i,
      /\bguaranteed\b/i,
      /\bbeat the market\b/i,
      /\bunlock.*edge\b/i,
      /\btrading edge\b/i,
    ];

    for (const pattern of forbiddenClaims) {
      assert.strictEqual(
        pattern.test(renderedPredictionsLiveHtml),
        false,
        'predictions HTML must not contain unbacked claim'
      );
      assert.strictEqual(
        pattern.test(renderedAutopilotHtml),
        false,
        'autopilot HTML must not contain unbacked claim'
      );
    }

    // CFTC Rule 4.41 mandatory disclaimer must be present on both pages
    assert.match(renderedPredictionsLiveHtml, /CFTC Rule 4\.41/i, '/predictions must display CFTC Rule 4.41 disclosure');
    assert.match(renderedAutopilotHtml, /CFTC Rule 4\.41/i, '/autopilot must display CFTC Rule 4.41 disclosure');
    assert.match(renderedAutopilotHtml, /HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS/i, '/autopilot must display full CFTC disclosure text');
    assert.match(renderedPredictionsLiveHtml, /HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS/i, '/predictions must display full CFTC disclosure text');
  });

  it('enforces that UI copy never falsely claims a live CME CF BRTI index feed and properly designates the Quanterra Composite Proxy', () => {
    // Prohibit UI claiming direct live CME CF BRTI as our active feed
    const prohibitedDirectBrtiFeedClaims = [
      /\bBRTI SPOT INDEX\b/i,
      /\bCME CF BRTI composite indices\b/i,
      /\bLive CME CF BRTI settlement basis\b/i,
      /CME CF BRTI BASIS:\s*\+/i,
    ];

    for (const source of allStaticSources) {
      for (const pattern of prohibitedDirectBrtiFeedClaims) {
        assert.strictEqual(
          pattern.test(source.content),
          false,
          `${source.name} must not claim direct live CME CF BRTI feed: ${pattern}`
        );
      }
    }

    // Both /kalshi and / (index) must explicitly disclose that BRTI is proprietary and requires an institutional license
    assert.match(renderedKalshiHtml, /BENCHMARK &amp; SETTLEMENT DESIGNATION/i, '/kalshi must render benchmark disclosure');
    assert.match(renderedKalshiHtml, /requires an institutional feed license and is never synthesized/i, '/kalshi must disclose BRTI licensing requirement');
    assert.match(renderedLandingHtml, /SPOT DISPERSION/i, 'Landing page must track spot dispersion, not claim live BRTI basis');
  });
});
