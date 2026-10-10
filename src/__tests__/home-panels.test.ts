import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { renderLandingPage } from '../landing-page.ts';

describe('Phase 3 Task 3.3 Acceptance: Home Page = 6 Panels (Tesla Mode) & 375px Mobile', () => {
  const html = renderLandingPage();

  test('home page renders exactly 6 full-viewport panels', () => {
    const panels = html.match(/<section class="tesla-panel"[^>]*id="([^"]+)"/g) || [];
    assert.equal(panels.length, 6, `Home page must contain exactly 6 panels, found ${panels.length}`);

    // Verify all 6 required panel IDs
    assert.ok(html.includes('id="panel-hero"'), 'Must have panel-hero');
    assert.ok(html.includes('id="panel-cost"'), 'Must have panel-cost');
    assert.ok(html.includes('id="panel-settlement"'), 'Must have panel-settlement');
    assert.ok(html.includes('id="panel-flightdeck"'), 'Must have panel-flightdeck');
    assert.ok(html.includes('id="panel-proof"'), 'Must have panel-proof');
    assert.ok(html.includes('id="panel-institutional"'), 'Must have panel-institutional');
  });

  test('panel 1 (Hero) satisfies Part 2.2 specifications', () => {
    assert.ok(html.includes('Trade like a pilot,<br>not a passenger.'));
    assert.ok(html.includes('Run Free Check &rarr;'));
    assert.ok(html.includes('Enter the Flight Deck'));
  });

  test('panel 2 (Cost) satisfies Part 2.2 specifications', () => {
    assert.ok(html.includes('At 50¢ you need 51.75%<br>just to break even.'));
    assert.ok(html.includes('Check a Contract &rarr;'));
    assert.ok(html.includes('Compare Fee Schedules'));
  });

  test('panel 3 (Settlement) satisfies Part 2.2 specifications', () => {
    assert.ok(html.includes('Kalshi settles on the index,<br>not your app.'));
    assert.ok(html.includes('Open Radar &rarr;'));
    assert.ok(html.includes('How Settlement Works'));
  });

  test('panel 4 (Flight Deck) satisfies Part 2.2 specifications', () => {
    assert.ok(html.includes('Get sharper every trade.'));
    assert.ok(html.includes('Start Free &rarr;'));
    assert.ok(html.includes('Explore Stations'));
  });

  test('panel 5 (Proof) satisfies Part 2.2 specifications', () => {
    assert.ok(html.includes('We publish when the<br>market beats us.'));
    assert.ok(html.includes('See the Proof &rarr;'));
    assert.ok(html.includes('Inspect Datasets'));
  });

  test('panel 6 (Institutional) satisfies Part 2.2 specifications', () => {
    assert.ok(html.includes('Neutral data for desks.'));
    assert.ok(html.includes('Talk to Us &rarr;'));
    assert.ok(html.includes('Get API Key'));
  });

  test('each panel obeys Part 5 constraints: <= 3 numbers per screen and <= 2 buttons per panel', () => {
    const panelBlocks = html.split('<section class="tesla-panel"');
    // First element is pre-panel HTML, remaining 6 are the panels
    for (let i = 1; i <= 6; i++) {
      const panel = panelBlocks[i];
      const metricItems = panel.match(/class="tesla-metric-item"/g) || [];
      assert.ok(
        metricItems.length <= 3,
        `Panel ${i} metric count (${metricItems.length}) must be <= 3`
      );

      const buttons = panel.match(/class="btn-tesla-(primary|secondary)"/g) || [];
      assert.ok(
        buttons.length <= 2,
        `Panel ${i} button count (${buttons.length}) must be <= 2`
      );
    }
  });

  test('375px mobile viewport styles and accessibility motion overrides are present', () => {
    assert.ok(html.includes('viewport-fit=cover'));
    assert.ok(html.includes('@media (max-width: 480px)'));
    assert.ok(html.includes('prefers-reduced-motion'));
  });
});
