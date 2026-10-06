import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMobilePageHtml } from '../mobile-page.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('QuanterraOS Mobile App & Store Distribution Suite', () => {
  it('validates W3C Progressive Web App manifest (manifest.json)', () => {
    const manifestPath = path.join(rootDir, 'public', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in public directory');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.strictEqual(manifest.name, 'QuanterraOS Mobile Terminal');
    assert.strictEqual(manifest.short_name, 'QuanterraOS');
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.start_url, '/dashboard');
    assert.strictEqual(manifest.theme_color, '#06070A');
    assert.strictEqual(manifest.background_color, '#06070A');
    assert.strictEqual(manifest.prefer_related_applications, false, 'must not prefer related applications until store listings exist');

    // Check PNG & SVG icons
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 4, 'manifest must have at least 4 icon declarations');
    const has192Png = manifest.icons.some((i: any) => i.sizes === '192x192' && i.type === 'image/png');
    const has512Png = manifest.icons.some((i: any) => i.sizes === '512x512' && i.type === 'image/png');
    const hasMaskablePng = manifest.icons.some((i: any) => i.purpose === 'maskable' && i.type === 'image/png');
    assert.ok(has192Png, 'manifest must include 192x192 PNG icon for Android WebAPK');
    assert.ok(has512Png, 'manifest must include 512x512 PNG icon for splash screens');
    assert.ok(hasMaskablePng, 'manifest must include maskable PNG icon for Android adaptive launchers');

    // Verify icon files physically exist on disk and have non-zero size
    const icon192Path = path.join(rootDir, 'public', 'assets', 'icon-192.png');
    const icon512Path = path.join(rootDir, 'public', 'assets', 'icon-512.png');
    const appleTouchIconPath = path.join(rootDir, 'public', 'apple-touch-icon.png');
    assert.ok(fs.existsSync(icon192Path) && fs.statSync(icon192Path).size > 0, 'icon-192.png must exist');
    assert.ok(fs.existsSync(icon512Path) && fs.statSync(icon512Path).size > 0, 'icon-512.png must exist');
    assert.ok(fs.existsSync(appleTouchIconPath) && fs.statSync(appleTouchIconPath).size > 0, 'apple-touch-icon.png must exist');
  });

  it('validates Rule B11 enforcement: placeholder assetlinks and AASA files are not published until accounts are enrolled', () => {
    const assetlinksPath = path.join(rootDir, 'public', '.well-known', 'assetlinks.json');
    const aasaPath = path.join(rootDir, 'public', '.well-known', 'apple-app-site-association');
    const rootAasaPath = path.join(rootDir, 'public', 'apple-app-site-association');

    assert.strictEqual(fs.existsSync(assetlinksPath), false, 'placeholder assetlinks.json must NOT be published in public/.well-known');
    assert.strictEqual(fs.existsSync(aasaPath), false, 'placeholder apple-app-site-association must NOT be published in public/.well-known');
    assert.strictEqual(fs.existsSync(rootAasaPath), false, 'placeholder apple-app-site-association must NOT be published in public root');
  });

  it('validates Service Worker offline shell, financial no-cache guards, and push handlers', () => {
    const swPath = path.join(rootDir, 'public', 'service-worker.js');
    assert.ok(fs.existsSync(swPath), 'service-worker.js must exist');

    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.ok(swContent.includes('install'), 'must handle install event');
    assert.ok(swContent.includes('activate'), 'must handle activate event');
    assert.ok(swContent.includes('fetch'), 'must handle fetch caching');
    assert.ok(swContent.includes('push'), 'must handle Web Push notifications');
    assert.ok(swContent.includes('notificationclick'), 'must handle notification click navigation');

    // Strict financial safety rules: NEVER cache live prices, Kalshi, or wallet data
    assert.ok(swContent.includes('/api/'), 'must explicitly inspect /api/ routes');
    assert.ok(swContent.includes('/kalshi'), 'must explicitly inspect /kalshi routes');
    assert.ok(swContent.includes('/wallet'), 'must explicitly inspect /wallet routes');
    assert.ok(swContent.includes('status: 503'), 'must return 503 offline response for financial routes to prevent stale data execution');
  });

  it('validates rendered Mobile Download Portal HTML (/mobile)', () => {
    const html = renderMobilePageHtml();
    assert.ok(html.includes('QuanterraOS Mobile Terminal'), 'must have title');
    assert.ok(html.includes('Add to Home Screen'), 'must provide iOS Safari Add to Home Screen instructions');
    assert.ok(html.includes('Android &amp; Samsung') || html.includes('Android & Samsung'), 'must provide Android & Samsung direct install card');
    assert.ok(html.includes('triggerPwaInstall'), 'must wire triggerPwaInstall button');
    assert.ok(html.includes('beforeinstallprompt'), 'must wire native Android/Samsung PWA install prompt');
    assert.ok(html.includes('serviceWorker'), 'must register service worker');
    assert.ok(html.includes('Store Scaffolding &amp; Distribution Transparency') || html.includes('Store Scaffolding & Distribution Transparency'), 'must include store transparency disclosure');
    assert.ok(html.includes('apple-touch-icon.png'), 'must reference apple-touch-icon.png');
    assert.ok(html.includes('icon-192.png'), 'must reference 192px PNG icon');

    // Dead store link check: No fabricated store links or made-up App IDs
    assert.strictEqual(html.includes('play.google.com/store/apps'), false, 'must NOT contain non-existent Google Play link');
    assert.strictEqual(html.includes('apps.apple.com'), false, 'must NOT contain non-existent Apple App Store link');
    assert.strictEqual(html.includes('galaxystore.samsung.com'), false, 'must NOT contain non-existent Galaxy Store link');
    assert.strictEqual(html.includes('6504938210'), false, 'must NOT contain invented Apple App ID 6504938210');

    // Fabricated hardware claims check: No fake endorsement marketing
    assert.strictEqual(html.includes('iPhone 16 Pro'), false, 'must NOT use iPhone 16 Pro marketing as if endorsed');
    assert.strictEqual(html.includes('Galaxy S25 Ultra'), false, 'must NOT use Galaxy S25 Ultra marketing as if endorsed');
    assert.strictEqual(html.includes('<12ms offline launch'), false, 'must NOT make up offline launch latency figures');

    // Rule B4 Guardrail check on mobile page
    assert.strictEqual(/\bTesla\b/i.test(html), false, 'mobile page must NOT contain forbidden word Tesla');
    assert.strictEqual(/\bAlpha Citadel\b/i.test(html), false, 'mobile page must NOT contain Alpha Citadel');
    assert.strictEqual(/\bguaranteed profit\b/i.test(html), false, 'mobile page must NOT contain guaranteed profit');

    // Rule B5 Guardrail check
    assert.ok(html.includes('RULE B5 ACTIVE') || html.includes('RULE B5: $0.00 EXPOSURE'), 'must disclose Rule B5');
  });

  it('validates native packaging templates in mobile/ folder as developer scaffolding', () => {
    const twaManifest = path.join(rootDir, 'mobile', 'android', 'twa-manifest.json');
    const buildGradle = path.join(rootDir, 'mobile', 'android', 'app', 'build.gradle');
    const androidManifest = path.join(rootDir, 'mobile', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    const infoPlist = path.join(rootDir, 'mobile', 'ios', 'Info.plist');

    assert.ok(fs.existsSync(twaManifest), 'twa-manifest.json must exist');
    assert.ok(fs.existsSync(buildGradle), 'build.gradle must exist');
    assert.ok(fs.existsSync(androidManifest), 'AndroidManifest.xml must exist');
    assert.ok(fs.existsSync(infoPlist), 'Info.plist must exist');

    const twa = JSON.parse(fs.readFileSync(twaManifest, 'utf8'));
    assert.strictEqual(twa.packageId, 'com.quanterraos.app');

    const gradleContent = fs.readFileSync(buildGradle, 'utf8');
    assert.ok(gradleContent.includes('com.quanterraos.app'), 'gradle must specify applicationId');

    const manifestContent = fs.readFileSync(androidManifest, 'utf8');
    assert.ok(manifestContent.includes('package="com.quanterraos.app"'), 'manifest must specify package');
    assert.ok(manifestContent.includes('android.intent.action.VIEW'), 'manifest must specify VIEW intent filter');

    const plistContent = fs.readFileSync(infoPlist, 'utf8');
    assert.ok(plistContent.includes('com.quanterraos.app'), 'plist must specify bundle identifier');
  });
});

