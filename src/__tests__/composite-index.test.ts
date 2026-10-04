import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeCompositeV01, COMPOSITE_METHODOLOGY_VERSION, type VenueTick } from '../composite-index.ts';

describe('Quanterra Composite Index v0.1 Engine (HANDOFF.md Section F1)', () => {
  const baseTime = 1790800000000;

  it('computes volume-weighted composite when 3+ agreeing venues are present', () => {
    const ticks: VenueTick[] = [
      { venue: 'coinbase', asset: 'BTC', price: 65000, volume: 10, observedAt: baseTime, stale: false },
      { venue: 'kraken', asset: 'BTC', price: 65010, volume: 20, observedAt: baseTime, stale: false },
      { venue: 'bitstamp', asset: 'BTC', price: 65005, volume: 10, observedAt: baseTime, stale: false },
    ];

    const result = computeCompositeV01(ticks, { nowMs: baseTime });
    assert.strictEqual(result.status, 'ACTIVE');
    assert.strictEqual(result.methodologyVersion, COMPOSITE_METHODOLOGY_VERSION);
    assert.strictEqual(result.venuesUsed.length, 3);
    assert.strictEqual(result.venuesRejected.length, 0);
    // Weighted average: (65000*10 + 65010*20 + 65005*10) / 40 = 2600250 / 40 = 65006.25
    assert.strictEqual(result.compositePrice, 65006.25);
    assert.match(result.disclaimer, /empirical approximation/i);
    assert.match(result.disclaimer, /BRTI/i);
  });

  it('Draco gate rejects outlier venue deviating more than 0.5% from median', () => {
    const ticks: VenueTick[] = [
      { venue: 'coinbase', asset: 'BTC', price: 65000, volume: 10, observedAt: baseTime, stale: false },
      { venue: 'kraken', asset: 'BTC', price: 65010, volume: 10, observedAt: baseTime, stale: false },
      { venue: 'bitstamp', asset: 'BTC', price: 65005, volume: 10, observedAt: baseTime, stale: false },
      { venue: 'bad-feed', asset: 'BTC', price: 66000, volume: 10, observedAt: baseTime, stale: false }, // ~1.5% dev
    ];

    const result = computeCompositeV01(ticks, { nowMs: baseTime });
    assert.strictEqual(result.status, 'ACTIVE');
    assert.strictEqual(result.venuesUsed.includes('bad-feed'), false);
    assert.strictEqual(result.venuesRejected.length, 1);
    assert.strictEqual(result.venuesRejected[0].venue, 'bad-feed');
    assert.strictEqual(result.venuesRejected[0].reason, 'OUTLIER');
  });

  it('Draco gate rejects stale tick older than 5,000 ms', () => {
    const ticks: VenueTick[] = [
      { venue: 'coinbase', asset: 'BTC', price: 65000, volume: 10, observedAt: baseTime, stale: false },
      { venue: 'kraken', asset: 'BTC', price: 65010, volume: 10, observedAt: baseTime, stale: false },
      { venue: 'bitstamp', asset: 'BTC', price: 65005, volume: 10, observedAt: baseTime - 6000, stale: false }, // 6s old
    ];

    const result = computeCompositeV01(ticks, { nowMs: baseTime });
    // bitstamp is stale -> only 2 valid venues remain -> quorum of 3 fails -> SUPPRESSED
    assert.strictEqual(result.status, 'SUPPRESSED');
    assert.strictEqual(result.compositePrice, null);
    assert.strictEqual(result.venuesRejected.length, 1);
    assert.strictEqual(result.venuesRejected[0].venue, 'bitstamp');
    assert.strictEqual(result.venuesRejected[0].reason, 'STALE');
  });

  it('suppresses composite price if fewer than 3 venues pass quality filters', () => {
    const ticks: VenueTick[] = [
      { venue: 'coinbase', asset: 'BTC', price: 65000, volume: 10, observedAt: baseTime, stale: false },
      { venue: 'kraken', asset: 'BTC', price: 65010, volume: 10, observedAt: baseTime, stale: false },
    ];

    const result = computeCompositeV01(ticks, { nowMs: baseTime, minVenues: 3 });
    assert.strictEqual(result.status, 'SUPPRESSED');
    assert.strictEqual(result.compositePrice, null);
    assert.strictEqual(result.sampleSize, 2);
  });
});
