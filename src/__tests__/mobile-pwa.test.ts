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

    // Check icons
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest must have at least 2 icons');
    const has192 = manifest.icons.some((i: any) => i.sizes === '192x192');
    const has512 = manifest.icons.some((i: any) => i.sizes === '512x512');
    const hasMaskable = manifest.icons.some((i: any) => i.purpose === 'maskable');
    assert.ok(has192, 'manifest must include 192x192 icon');
    assert.ok(has512, 'manifest must include 512x512 icon');
    assert.ok(hasMaskable, 'manifest must include maskable icon for Samsung One UI');

    // Check related applications (Google Play & Apple iTunes)
    assert.ok(Array.isArray(manifest.related_applications), 'manifest must declare related_applications');
    const playApp = manifest.related_applications.find((a: any) => a.platform === 'play');
    assert.ok(playApp, 'must declare Google Play platform');
    assert.strictEqual(playApp.id, 'com.quanterraos.app');

    const appleApp = manifest.related_applications.find((a: any) => a.platform === 'itunes');
    assert.ok(appleApp, 'must declare Apple iTunes platform');
    assert.ok(appleApp.url.includes('quanterraos-terminal'), 'must point to QuanterraOS on App Store');
  });

  it('validates Google Play / Samsung Android Digital Asset Links (assetlinks.json)', () => {
    const assetlinksPath = path.join(rootDir, 'public', '.well-known', 'assetlinks.json');
    assert.ok(fs.existsSync(assetlinksPath), 'assetlinks.json must exist in public/.well-known');

    const assetlinks = JSON.parse(fs.readFileSync(assetlinksPath, 'utf8'));
    assert.ok(Array.isArray(assetlinks), 'assetlinks must be an array');
    assert.ok(assetlinks.length >= 1, 'assetlinks must have at least one statement');

    const handleUrlsStmt = assetlinks.find((stmt: any) =>
      stmt.relation && stmt.relation.includes('delegate_permission/common.handle_all_urls')
    );
    assert.ok(handleUrlsStmt, 'must include handle_all_urls permission for TWA');
    assert.strictEqual(handleUrlsStmt.target.package_name, 'com.quanterraos.app');
    assert.ok(Array.isArray(handleUrlsStmt.target.sha256_cert_fingerprints), 'must have sha256 fingerprints');
    assert.ok(handleUrlsStmt.target.sha256_cert_fingerprints.length >= 1, 'must have at least one fingerprint');
  });

  it('validates Apple iOS Universal Links (apple-app-site-association)', () => {
    const aasaPath = path.join(rootDir, 'public', '.well-known', 'apple-app-site-association');
    const rootAasaPath = path.join(rootDir, 'public', 'apple-app-site-association');
    assert.ok(fs.existsSync(aasaPath), 'apple-app-site-association must exist in public/.well-known');
    assert.ok(fs.existsSync(rootAasaPath), 'apple-app-site-association must exist at root of public');

    const aasa = JSON.parse(fs.readFileSync(aasaPath, 'utf8'));
    assert.ok(aasa.applinks, 'must define applinks object');
    assert.ok(Array.isArray(aasa.applinks.details), 'applinks details must be an array');
    
    const primaryApp = aasa.applinks.details[0];
    assert.ok(primaryApp.appID.includes('com.quanterraos.app'), 'must target com.quanterraos.app bundle');
    assert.ok(primaryApp.paths.includes('/dashboard*'), 'must link /dashboard*');
    assert.ok(primaryApp.paths.includes('/mobile*'), 'must link /mobile*');
  });

  it('validates Service Worker offline shell and push notification handlers', () => {
    const swPath = path.join(rootDir, 'public', 'service-worker.js');
    assert.ok(fs.existsSync(swPath), 'service-worker.js must exist');

    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.ok(swContent.includes('install'), 'must handle install event');
    assert.ok(swContent.includes('activate'), 'must handle activate event');
    assert.ok(swContent.includes('fetch'), 'must handle fetch caching');
    assert.ok(swContent.includes('push'), 'must handle Web Push notifications');
    assert.ok(swContent.includes('notificationclick'), 'must handle notification click navigation');
  });

  it('validates rendered Mobile Download Portal HTML (/mobile)', () => {
    const html = renderMobilePageHtml();
    assert.ok(html.includes('QuanterraOS Mobile Terminal'), 'must have title');
    assert.ok(html.includes('Google Play Store'), 'must mention Google Play Store');
    assert.ok(html.includes('Apple App Store'), 'must mention Apple App Store');
    assert.ok(html.includes('Samsung Galaxy Store'), 'must mention Samsung Galaxy Store');
    assert.ok(html.includes('com.quanterraos.app'), 'must include package identifier');
    assert.ok(html.includes('iPhone 16 Pro'), 'must showcase Apple iPhone 16 Pro');
    assert.ok(html.includes('Samsung Galaxy S25'), 'must showcase Samsung Galaxy S25');
    assert.ok(html.includes('RULE B5 ACTIVE') || html.includes('RULE B5: $0.00 EXPOSURE'), 'must disclose Rule B5');
    assert.ok(html.includes('serviceWorker'), 'must register service worker');
    assert.ok(html.includes('beforeinstallprompt'), 'must wire native Android/Samsung PWA install prompt');

    // Rule B4 Guardrail check on mobile page
    assert.strictEqual(/\bTesla\b/i.test(html), false, 'mobile page must NOT contain forbidden word Tesla');
    assert.strictEqual(/\bAlpha Citadel\b/i.test(html), false, 'mobile page must NOT contain Alpha Citadel');
    assert.strictEqual(/\bguaranteed profit\b/i.test(html), false, 'mobile page must NOT contain guaranteed profit');
  });

  it('validates native packaging templates in mobile/ folder', () => {
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
