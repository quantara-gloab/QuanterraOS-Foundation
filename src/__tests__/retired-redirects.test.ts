import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getRetiredRouteRedirect,
  retiredRouteRedirectMiddleware,
  RETIRED_URL_REDIRECTS,
} from '../routes/retired-redirects.ts';

describe('Phase 3 Task 3.4 Acceptance: Route Map & 301 Redirects for Retired URLs', () => {
  // Full list of retired URLs from Task 3.4 & Part 2.1
  const retiredSpecs: Array<{ url: string; expected: string }> = [
    { url: '/calculator', expected: '/check' },
    { url: '/compare', expected: '/check' },
    { url: '/paper', expected: '/deck' },
    { url: '/spread', expected: '/radar' },
    { url: '/matrix', expected: '/radar' },
    { url: '/flow', expected: '/radar' },
    { url: '/settlement', expected: '/radar' },
    { url: '/corridors', expected: '/radar' },
    { url: '/divergence', expected: '/radar' },
    { url: '/index', expected: '/radar' },
    { url: '/calibration', expected: '/proof' },
    { url: '/calibration/explorer', expected: '/proof' },
    { url: '/calibration-surface', expected: '/proof' },
    { url: '/calibration/surface', expected: '/proof' },
    { url: '/study', expected: '/proof' },
    { url: '/methodology', expected: '/proof' },
    { url: '/research', expected: '/proof' },
    { url: '/transparency', expected: '/proof' },
    { url: '/council', expected: '/proof' },
    { url: '/why', expected: '/proof' },
    { url: '/predictions', expected: '/deck' },
    { url: '/autopilot', expected: '/deck' },
    { url: '/journal', expected: '/deck' },
    { url: '/educators', expected: '/learn' },
    { url: '/mcp', expected: '/developers' },
    { url: '/radar/audio', expected: '/proof#sonification' },
    { url: '/mobile', expected: '/deck' },
    { url: '/wallet', expected: '/deck' },
    { url: '/growth', expected: '/' },
  ];

  test('all retired URLs resolve to canonical destinations with 0 x 404', () => {
    for (const item of retiredSpecs) {
      const destination = getRetiredRouteRedirect(item.url);
      assert.equal(
        destination,
        item.expected,
        `Expected ${item.url} to redirect to ${item.expected}, but got ${destination}`
      );
    }
  });

  test('redirects are robust to trailing slashes and uppercase characters', () => {
    assert.equal(getRetiredRouteRedirect('/CALCULATOR/'), '/check');
    assert.equal(getRetiredRouteRedirect('/Matrix///'), '/radar');
    assert.equal(getRetiredRouteRedirect('/Calibration/Explorer/'), '/proof');
    assert.equal(getRetiredRouteRedirect('/JOURNAL'), '/deck');
  });

  test('express middleware executes HTTP 301 Permanent Redirect on retired URLs', () => {
    for (const item of retiredSpecs) {
      let statusCode = 0;
      let redirectLocation = '';
      let nextCalled = false;

      const mockReq = { path: item.url } as any;
      const mockRes = {
        redirect: (code: number, location: string) => {
          statusCode = code;
          redirectLocation = location;
        },
      } as any;
      const mockNext = () => {
        nextCalled = true;
      };

      retiredRouteRedirectMiddleware(mockReq, mockRes, mockNext);

      assert.equal(statusCode, 301, `URL ${item.url} must return HTTP 301`);
      assert.equal(
        redirectLocation,
        item.expected,
        `URL ${item.url} must redirect to ${item.expected}`
      );
      assert.equal(nextCalled, false, `next() must not be called when redirecting ${item.url}`);
    }
  });

  test('non-retired canonical routes pass through cleanly to next()', () => {
    const canonicalRoutes = [
      '/',
      '/check',
      '/radar',
      '/deck',
      '/proof',
      '/institutional',
      '/developers',
      '/pricing',
      '/learn',
      '/widgets',
      '/news',
      '/legal',
      '/status',
      '/changelog',
    ];

    for (const route of canonicalRoutes) {
      let nextCalled = false;
      const mockReq = { path: route } as any;
      const mockRes = {
        redirect: () => {
          assert.fail(`Canonical route ${route} should not be redirected!`);
        },
      } as any;

      retiredRouteRedirectMiddleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true, `Canonical route ${route} must call next()`);
    }
  });
});
