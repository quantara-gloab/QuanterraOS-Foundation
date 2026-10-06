# QuanterraOS Mobile Architecture & Distribution Guide

**Reality vs Scaffolding Notice**:
- **Active Channel**: Direct browser Progressive Web App (PWA) via standard W3C Web App Manifest and Service Worker. This is live and installable directly from Safari (iOS "Add to Home Screen") and Chrome/Samsung Internet (WebAPK 1-Tap install).
- **Scaffolding Channels**: Android Trusted Web Activity (`mobile/android/`) and Apple iOS Xcode template (`mobile/ios/`). These are developer templates and scaffolding. There are currently **no** submitted or active listings on the Google Play Store, Samsung Galaxy Store, or Apple App Store.

---

## 1. Active Channel: Progressive Web App (PWA)

Users can install QuanterraOS today with zero app stores or third-party gatekeepers:

| Feature | Implementation | Notes |
| :--- | :--- | :--- |
| **Manifest** | `public/manifest.json` | Standalone display mode, dark theme `#06070A`, routes to `/dashboard` |
| **Icons** | `public/assets/icon-192.png`, `icon-512.png` | W3C standard PNG binaries, `maskable` and `any` purpose |
| **iOS WebClip** | `public/apple-touch-icon.png` | 180x180 PNG referenced in HTML `<head>` |
| **Offline Shell** | `public/service-worker.js` | Caches static assets, HTML shell, and branding |
| **Financial Safety Guard** | `public/service-worker.js` | **Strictly network-only**. Never caches `/api/`, `/kalshi`, `/wallet`, or pricing feeds. Returns 503 if offline to prevent stale pricing execution. |

### Installing:
- **Apple iOS (iPhone/iPad)**: Open in Safari -> Tap Share -> Tap **Add to Home Screen**.
- **Android / Samsung Galaxy**: Open in Chrome or Samsung Internet -> Tap **Install QuanterraOS App** (or browser menu -> **Add to Home Screen**).

---

## 2. Store Listings Roadmap & Prerequisites (If Pursued)

If official store listings are desired in the future, follow these concrete technical steps:

### A. Google Play Store (Android / Samsung Galaxy)
1. **Developer Account**: Register a Google Play Console account ($25 one-time registration fee).
2. **Keystore Generation**:
   Run Bubblewrap CLI to initialize and generate a cryptographic release keystore:
   ```bash
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest https://quanterraos.com/manifest.json
   ```
   This generates `android.keystore` and outputs its SHA-256 fingerprint.
3. **Update Digital Asset Links**:
   Replace the placeholder fingerprint in `public/.well-known/assetlinks.json` with your real release signing key SHA-256 fingerprint:
   ```json
   {
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.quanterraos.app",
       "sha256_cert_fingerprints": [
         "PASTE_REAL_RELEASE_KEYSTORE_SHA256_HERE"
       ]
     }
   }
   ```
4. **Build & Upload Binary**:
   ```bash
   bubblewrap build
   ```
   Upload the resulting `app-release-bundle.aab` to Google Play Console.
5. **Regulatory & Policy Review**: Prediction market, derivative, or financial-oriented apps trigger Google Play Financial Services declarations and require compliance disclosures.

### B. Apple App Store (iOS)
1. **Developer Account**: Enroll in the Apple Developer Program ($99/year).
2. **App ID & Universal Links**:
   - Create an App ID in Apple Developer Portal under your Team.
   - Replace `TEAMID12345` in `public/.well-known/apple-app-site-association` with your real Apple Team ID (e.g. `ABC123XYZ.com.quanterraos.app`).
3. **App Store Guideline 4.2 Compliance**:
   - Apple routinely rejects apps that are simply a website loaded in a WKWebView wrapper.
   - The native Xcode project (`mobile/ios/`) must provide genuine native value (e.g., native APNs push notification handling, native biometric authentication, background refresh, speech synthesis/audio session management).
4. **App Store Connect & App ID**:
   - Apple only assigns a numeric App Store ID (e.g., `idXXXXXXXXXX`) *after* you create the app entry in App Store Connect.
   - Do **not** create or publish an App Store link until this ID exists and the binary is approved by Apple Review.
5. **Financial Regulatory Review**: Financial market applications must satisfy Apple Guideline 3.1.5 (Cryptocurrencies and Financial Trading) including appropriate jurisdictional licensing.

---

## 3. Standing Engineering Instructions

> **Standing Rule**: Never report something as "live," "linked," or "published" unless it can show a URL that actually loads. Never publish or advertise store links for apps that have not been submitted, reviewed, and approved. Scaffolding must always be explicitly designated as scaffolding.
