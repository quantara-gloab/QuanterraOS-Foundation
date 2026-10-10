import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_NAV_ITEMS,
} from '../components/public-layout.ts';
import { renderLandingPage } from '../landing-page.ts';
import { renderPricingPageHtml } from '../pricing-page.ts';
import { renderStatusPageHtml } from '../status-page.ts';
import { computeExpiryRadarState, renderExpiryRadarPageHtml } from '../expiry-radar.ts';

describe('Phase 3 Task 3.1 Acceptance: Global Header & Footer Components (Tesla Mode)', () => {
  test('header adheres strictly to <= 6 nav items requirement and includes essential CTAs', () => {
    assert.ok(PUBLIC_NAV_ITEMS.length <= 6, `Nav items count (${PUBLIC_NAV_ITEMS.length}) must be <= 6`);
    assert.deepEqual(
      PUBLIC_NAV_ITEMS.map((i) => i.label),
      ['Check', 'Radar', 'Flight Deck', 'Institutional', 'Pricing']
    );

    const headerHtml = renderPublicHeader({ activePath: '/pricing' });
    assert.ok(headerHtml.includes('QuanterraOS'));
    assert.ok(headerHtml.includes('tesla-header'));
    assert.ok(headerHtml.includes('tesla-hamburger'));
    assert.ok(headerHtml.includes('tesla-mobile-menu'));
    assert.ok(headerHtml.includes('tesla-mobile-bottom-bar'));
    assert.ok(headerHtml.includes('Free Check'));
    assert.ok(headerHtml.includes('Sign in'));
    assert.ok(headerHtml.includes('Run Free Check →'));
  });

  test('footer includes verbatim Part 7 compliance disclaimer and essential routes', () => {
    const footerHtml = renderPublicFooter();
    assert.ok(footerHtml.includes('tesla-footer'));
    assert.ok(
      footerHtml.includes(
        "QuanterraOS is an independent analytics tool by Quantara Global LLC. We don't place trades, hold funds, or give investment advice."
      )
    );
    assert.ok(footerHtml.includes('Prediction-market trading can lose money. 18+.'));
    assert.ok(footerHtml.includes('Quantara Global LLC'));
    assert.ok(footerHtml.includes('/legal'));
    assert.ok(footerHtml.includes('/status'));
    assert.ok(footerHtml.includes('/changelog'));
    assert.ok(footerHtml.includes('/help'));
    assert.ok(footerHtml.includes('/proof'));
    assert.ok(footerHtml.includes('/learn'));
    assert.ok(footerHtml.includes('/developers'));
  });

  test('public pages (Home, Pricing, Status, Radar) use global layout and have 0 per-page dropdown navs', () => {
    const landingHtml = renderLandingPage();
    assert.ok(landingHtml.includes('tesla-header'), 'Home page must use global tesla-header');
    assert.ok(landingHtml.includes('tesla-footer'), 'Home page must use global tesla-footer');
    assert.equal(landingHtml.includes('class="nav-dropdown"'), false, 'Old nav dropdowns must be removed from Home');

    const pricingHtml = renderPricingPageHtml();
    assert.ok(pricingHtml.includes('tesla-header'), 'Pricing page must use global tesla-header');
    assert.ok(pricingHtml.includes('tesla-footer'), 'Pricing page must use global tesla-footer');

    const statusHtml = renderStatusPageHtml();
    assert.ok(statusHtml.includes('tesla-header'), 'Status page must use global tesla-header');
    assert.ok(statusHtml.includes('tesla-footer'), 'Status page must use global tesla-footer');

    const radar = computeExpiryRadarState({ series: '15m' });
    const radarHtml = renderExpiryRadarPageHtml(radar);
    assert.ok(radarHtml.includes('tesla-header'), 'Radar page must use global tesla-header');
    assert.ok(radarHtml.includes('tesla-footer'), 'Radar page must use global tesla-footer');
  });
});
