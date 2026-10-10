import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSystemStatusData, renderStatusPageHtml } from '../status-page.ts';

test('Task 2.6: /status data reports feed freshness, reconciler lag, and uptime', () => {
  const statusData = getSystemStatusData();

  // 1. Verify feedFreshness
  assert.ok(statusData.feedFreshness, 'feedFreshness must be defined');
  assert.ok(['REALTIME', 'HEALTHY', 'DEGRADED'].includes(statusData.feedFreshness.status));
  assert.equal(typeof statusData.feedFreshness.ageSeconds, 'number');
  assert.equal(typeof statusData.feedFreshness.label, 'string');
  assert.ok(statusData.feedFreshness.lastTickIso);

  // 2. Verify reconciler lag & compliance
  assert.ok(statusData.reconciler, 'reconciler metrics must be defined');
  assert.equal(typeof statusData.reconciler.reconcilerLagSeconds, 'number');
  assert.equal(typeof statusData.reconciler.complianceRatePct, 'number');
  assert.equal(typeof statusData.reconciler.pendingOver30Minutes, 'number');
  assert.equal(statusData.reconciler.pendingOver30Minutes, 0, 'No pending markets >30m per reconciler rule');
  assert.equal(statusData.reconciler.complianceRatePct, 100);

  // 3. Verify uptime
  assert.ok(statusData.uptime, 'uptime object must be defined');
  assert.equal(typeof statusData.uptime.uptimeSeconds, 'number');
  assert.equal(typeof statusData.uptime.uptimePct, 'number');
  assert.equal(typeof statusData.uptime.uptimeFormatted, 'string');
  assert.ok(statusData.uptime.uptimePct >= 99.0);

  // 4. Verify rendered HTML contains feed freshness, reconciler lag, and uptime
  const html = renderStatusPageHtml();
  assert.ok(html.includes('Feed Freshness (Latency)'), 'HTML must display Feed Freshness');
  assert.ok(html.includes('Settlement Reconciler Lag'), 'HTML must display Settlement Reconciler Lag');
  assert.ok(html.includes('System Uptime'), 'HTML must display System Uptime');
  assert.ok(html.includes('feed-freshness-val'), 'HTML must contain feed freshness element');
  assert.ok(html.includes('reconciler-lag-val'), 'HTML must contain reconciler lag element');
  assert.ok(html.includes('uptime-val'), 'HTML must contain uptime element');
});
