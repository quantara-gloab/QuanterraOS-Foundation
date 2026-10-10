import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isBrtiLicensed,
  getBrtiDisplayMetadata,
  BRTI_CONSTITUENT_EXCHANGES,
} from '../config/licensing.ts';
import { computeExpiryRadarState, renderExpiryRadarPageHtml } from '../expiry-radar.ts';
import { computeTrueCostCheck } from '../lib/fees.ts';

describe('Phase 2 Task 2.7: BRTI Display Licensing & Settlement-Index Proxy Verification', () => {
  test('unlicensed mode displays settlement-index proxy with methodology note and constituent exchanges', () => {
    delete process.env.CF_BENCHMARKS_LICENSED;

    assert.equal(isBrtiLicensed(), false);
    const meta = getBrtiDisplayMetadata();
    assert.equal(meta.isLicensed, false);
    assert.equal(meta.status, 'UNLICENSED_PROXY');
    assert.equal(meta.label, 'Settlement-Index Proxy');
    assert.equal(meta.shortLabel, 'Settlement Proxy');
    assert.equal(meta.fullTitle, 'Settlement-Index Proxy (Constituent Composite)');
    assert.equal(meta.settlementSourceLabel, 'Settlement-Index Proxy (BRTI Constituents)');

    // Verify constituent exchanges are documented
    assert.deepEqual([...meta.constituentExchanges], ['Coinbase Pro', 'Kraken', 'Bitstamp', 'Gemini']);

    // Verify methodology note is present and informative
    assert.ok(meta.methodologyNote.includes('Methodology Note:'));
    assert.ok(meta.methodologyNote.includes('Coinbase, Kraken, Bitstamp, Gemini'));
    assert.ok(meta.methodologyNote.includes('CF Benchmarks proprietary index licensing'));

    // Verify Expiry Radar state reflects proxy
    const radar = computeExpiryRadarState({ series: '15m' });
    assert.equal(radar.licensing.isLicensed, false);
    assert.equal(radar.licensing.label, 'Settlement-Index Proxy');

    // Verify HTML renders the proxy banner and methodology note
    const html = renderExpiryRadarPageHtml(radar);
    assert.ok(html.includes('Settlement-Index Proxy (Constituent Composite)'));
    assert.ok(html.includes('proxy-methodology-banner'));
    assert.ok(html.includes('Coinbase, Kraken, Bitstamp, Gemini'));

    // Verify fee engine outputs settlement proxy source
    const check = computeTrueCostCheck({
      venue: 'kalshi',
      product: 'KXBTC15M',
      price: 0.50,
      contracts: 10,
    });
    assert.equal(check.settlementSource, 'Settlement-Index Proxy (BRTI Constituents)');
  });

  test('licensed mode displays official CME CF BRTI labels when license is verified', () => {
    process.env.CF_BENCHMARKS_LICENSED = 'true';

    assert.equal(isBrtiLicensed(), true);
    const meta = getBrtiDisplayMetadata();
    assert.equal(meta.isLicensed, true);
    assert.equal(meta.status, 'LICENSED');
    assert.equal(meta.label, 'CME CF BRTI');
    assert.equal(meta.fullTitle, 'CME CF Bitcoin Real-Time Index (BRTI)');
    assert.equal(meta.settlementSourceLabel, 'CME CF BRTI 60s TWAP');

    const radar = computeExpiryRadarState({ series: '15m' });
    assert.equal(radar.licensing.isLicensed, true);
    assert.equal(radar.licensing.label, 'CME CF BRTI');

    const html = renderExpiryRadarPageHtml(radar);
    assert.ok(html.includes('CME CF Bitcoin Real-Time Index (BRTI)'));
    assert.ok(!html.includes('proxy-methodology-banner'));

    const check = computeTrueCostCheck({
      venue: 'kalshi',
      product: 'KXBTC15M',
      price: 0.50,
      contracts: 10,
    });
    assert.equal(check.settlementSource, 'CME CF BRTI 60s TWAP');

    // Clean up
    delete process.env.CF_BENCHMARKS_LICENSED;
  });
});
