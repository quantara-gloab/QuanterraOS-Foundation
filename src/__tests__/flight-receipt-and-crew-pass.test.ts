import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runMigrations } from '../db.ts';

runMigrations();

import {
  resolveFlightReceipt,
  createFlightReceipt,
  getFlightReceiptById,
  getFlightReceiptByPublicId,
  publishFlightReceipt,
  unpublishFlightReceipt,
  generateFlightReceiptCardSvg,
} from '../lib/flight-receipt.ts';

import {
  claimCrewPass,
  getUserCrewPass,
  selectPassSkin,
  renderCrewShowcasePageHtml,
  renderCrewPassClaimPageHtml,
  renderArtGalleryPageHtml,
  COUNCIL_OFFICERS,
  QUANTA_SKINS,
} from '../lib/crew-pass.ts';

describe('Flight Receipt Engine & Canonical Contract Audits', () => {
  it('1. Canonical arithmetic: accurately calculates fee, outlay, and breakeven hurdle for 10 contracts @ $0.51 ask', () => {
    const result = resolveFlightReceipt({
      urlOrTicker: 'KXBTC15M',
      side: 'yes',
      quantity: 10,
      entryPrice: 0.51,
    });

    assert.strictEqual(result.venue, 'kalshi');
    assert.strictEqual(result.quantity, '10.00');
    assert.strictEqual(result.selectedSide, 'yes');

    const yesSide = result.sides.yes;
    assert.ok(yesSide, 'YES side quote must exist');
    assert.strictEqual(yesSide.entryPrice, '0.5100');
    assert.strictEqual(yesSide.purchaseAmount, '5.10');
    assert.strictEqual(yesSide.fee, '0.18', 'Fee for 10 contracts at 51¢ must be $0.18');
    assert.strictEqual(yesSide.feePerContract, '0.0180', 'Fee per contract must be 1.80¢');
    assert.strictEqual(yesSide.outlay, '5.28', 'Total outlay must be $5.28');
    assert.strictEqual(yesSide.breakevenProbability, '0.5280', 'Breakeven probability must be 0.5280');
    assert.strictEqual(yesSide.breakevenPercent, '52.80%');
    assert.strictEqual(yesSide.isAttainable, true);
  });

  it('2. Anti-SSRF & Security: rejects non-HTTPS, credentials, private IPs, and unsupported hosts', () => {
    // Non-HTTPS
    assert.throws(
      () => resolveFlightReceipt({ urlOrTicker: 'http://kalshi.com/markets/kxbtc15m' }),
      /Only secure HTTPS URLs are supported/i
    );

    // Private IP SSRF
    assert.throws(
      () => resolveFlightReceipt({ urlOrTicker: 'https://169.254.169.254/latest/meta-data' }),
      /Private IP addresses and localhost destinations are prohibited/i
    );

    // Embedded credentials
    assert.throws(
      () => resolveFlightReceipt({ urlOrTicker: 'https://user:pass@kalshi.com/markets/kxbtc15m' }),
      /URLs containing embedded user credentials are prohibited/i
    );

    // Unsupported host
    assert.throws(
      () => resolveFlightReceipt({ urlOrTicker: 'https://malicious-exchange.com/markets/btc' }),
      /Unsupported venue host/i
    );
  });

  it('3. Lifecycle: draft creation, retrieval, privacy-preserving publish, and unpublish', () => {
    const receipt = createFlightReceipt({
      urlOrTicker: 'https://kalshi.com/markets/kxbtc15m',
      side: 'yes',
      quantity: 10,
      entryPrice: 0.51,
    }, 'user_pilot_123');

    assert.ok(receipt.id);
    assert.strictEqual(receipt.userId, 'user_pilot_123');
    assert.strictEqual(receipt.publicSharing, false);
    assert.strictEqual(receipt.publicId, null);

    // Retrieve by ID
    const retrieved = getFlightReceiptById(receipt.id);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.id, receipt.id);

    // Publish (stripping private fields)
    const published = publishFlightReceipt(receipt.id, 'user_pilot_123');
    assert.strictEqual(published.success, true);
    assert.strictEqual(published.receipt.publicSharing, true);
    assert.ok(published.publicId, 'Published receipt must have random publicId');
    assert.ok(published.publicId.length >= 8);

    // Retrieve by Public ID
    const publicView = getFlightReceiptByPublicId(published.publicId);
    assert.ok(publicView);
    assert.strictEqual(publicView.publicId, published.publicId);
    assert.strictEqual(publicView.userId, null, 'Public view must strip author userId');

    // Unpublish
    const unpublished = unpublishFlightReceipt(receipt.id, 'user_pilot_123');
    assert.ok(unpublished);
    assert.strictEqual(unpublished.publicSharing, false);
  });

  it('4. Social Card SVG Generation: produces high-fidelity vector card with Flight Pilot Quanta in corner', () => {
    const receipt = resolveFlightReceipt({
      urlOrTicker: 'KXBTC15M',
      side: 'yes',
      quantity: 10,
      entryPrice: 0.51,
    });

    const svg = generateFlightReceiptCardSvg(receipt);
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('width="1200"'));
    assert.ok(svg.includes('height="630"'));
    assert.ok(svg.includes('QUANTERRAOS'));
    assert.ok(svg.includes('FLIGHT RECEIPT'));
    assert.ok(svg.includes('$5.28'));
    assert.ok(svg.includes('52.80%'));
    assert.ok(svg.includes('STATUS: FRESH'));
    assert.ok(svg.includes('SEE THE COST. CHOOSE YOUR SIDE.'));
    assert.ok(svg.includes('quanterraos.com/check'));
  });
});

describe('Free Crew Pass & Spacecraft Council Entitlements', () => {
  it('1. Free Crew Pass Claim: free server entitlement, no wallet required', () => {
    const userId = 'pilot_cadet_' + Date.now();
    const pass = claimCrewPass(userId);

    assert.ok(pass.id);
    assert.strictEqual(pass.userId, userId);
    assert.strictEqual(pass.passTier, 'free_crew_pass');
    assert.strictEqual(pass.selectedSkin, 'genesis');
    assert.strictEqual(pass.unlockedSkins.length, 6);
    assert.ok(pass.unlockedSkins.includes('genesis'));
    assert.ok(pass.unlockedSkins.includes('liquid_chrome'));

    const fetched = getUserCrewPass(userId);
    assert.ok(fetched);
    assert.strictEqual(fetched.id, pass.id);
  });

  it('2. Skin Customization: switches active pilot skin among unlocked styles', () => {
    const userId = 'pilot_cadet_skin_' + Date.now();
    claimCrewPass(userId);

    const updateRes = selectPassSkin(userId, 'liquid_chrome');
    assert.strictEqual(updateRes.success, true);
    assert.strictEqual(updateRes.skinId, 'liquid_chrome');

    const updated = getUserCrewPass(userId);
    assert.strictEqual(updated?.selectedSkin, 'liquid_chrome');

    assert.throws(
      () => selectPassSkin(userId, 'nonexistent_gold_skin'),
      /Invalid skin ID specified/i
    );
  });

  it('3. Renders public showcase pages (/crew, /pass, /art-gallery) with responsive layouts', () => {
    const crewHtml = renderCrewShowcasePageHtml(null, null);
    assert.ok(crewHtml.includes('Meet Your Flight Deck Officers'));
    assert.ok(crewHtml.includes('Quanta'));
    assert.ok(crewHtml.includes('Spacecraft Council'));
    assert.ok(crewHtml.includes('/pass'));

    const passHtml = renderCrewPassClaimPageHtml(null, null);
    assert.ok(passHtml.includes('Free Crew Pass'));
    assert.ok(passHtml.includes('Claim Free Crew Pass'));
    assert.ok(passHtml.includes('Liquid Chrome'));
    assert.ok(passHtml.includes('Graffiti Pop'));

    const galleryHtml = renderArtGalleryPageHtml(null);
    assert.ok(galleryHtml.includes('Official Artwork Gallery'));
    assert.ok(galleryHtml.includes('Flight Deck Pilot Quanta'));
    assert.ok(galleryHtml.includes('Liquid Chrome'));
  });
});
