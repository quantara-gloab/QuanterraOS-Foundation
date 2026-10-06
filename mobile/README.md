# QuanterraOS Mobile App Architecture

Unified mobile distribution for **Apple iPhone** (iOS) and **Samsung Galaxy / Android** (Google Play Store & Samsung Galaxy Store).

---

## 1. Distribution Channels

| Platform | Channel | Technology | Identifier |
| :--- | :--- | :--- | :--- |
| **Android / Samsung** | **Google Play Store** | Trusted Web Activity (TWA) / WebAPK | `com.quanterraos.app` |
| **Samsung Galaxy** | **Samsung Galaxy Store** | Samsung Galaxy Store TWA Package | `com.quanterraos.app` |
| **Apple iPhone / iPad** | **Apple App Store** | Universal Links + WKWebView Shell | `com.quanterraos.app` (App ID `6504938210`) |
| **Universal (All Phones)**| **Progressive Web App** | W3C PWA + Service Worker Edge Cache | Domain Root `/manifest.json` |

---

## 2. Google Play Store & Samsung Galaxy Store Build Workflow

QuanterraOS uses the official Google Chrome / Android **Bubblewrap CLI** to package the Trusted Web Activity into production `.aab` (Android App Bundle) and `.apk` binaries.

### Build Steps:
```bash
# 1. Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Build production Android App Bundle (.aab)
bubblewrap build --manifest mobile/android/twa-manifest.json

# 3. Output files:
#    - app-release-bundle.aab -> Upload to Google Play Console
#    - app-release-signed.apk -> Upload to Samsung Galaxy Store Developer Portal
```

### Digital Asset Links Verification:
Google Play and Samsung One UI automatically verify the SHA-256 fingerprint hosted at:
- `https://quanterraos.com/.well-known/assetlinks.json`

When verified, the browser URL bar is hidden and the app runs in full-screen native standalone mode.

---

## 3. Apple iPhone (iOS) Universal Links & WebClip Setup

### Apple App Site Association (AASA):
Hosted at:
- `https://quanterraos.com/.well-known/apple-app-site-association`
- `https://quanterraos.com/apple-app-site-association`

### Capabilities:
- **Instant WebClip**: Users browsing Safari on iPhone can tap **Share** -> **Add to Home Screen** for an instant app installation with the high-resolution vector icon.
- **Microphone Access**: Speech-to-text voice interaction with Aria AI Executive Voice Agent and Dr. Elena Vance.
- **Dynamic Island Integration**: Audio waveform indicator during live specialist briefings.

---

## 4. Mobile URLs & Endpoints

- **Mobile Landing Portal**: `/mobile`, `/download`, `/app`
- **PWA Manifest**: `/manifest.json`
- **Offline Service Worker**: `/service-worker.js`
- **Mobile Config API**: `/api/mobile/config`
- **Android Asset Links**: `/.well-known/assetlinks.json`
- **Apple App Association**: `/.well-known/apple-app-site-association`
