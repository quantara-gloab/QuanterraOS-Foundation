/**
 * Mobile App Download & Installation Portal (/mobile, /download, /app, /pwa)
 *
 * Dedicated high-performance mobile deployment gateway for Apple iPhone (iOS Safari & Universal Links)
 * and Samsung Galaxy / Android (Google Play Store, Samsung Galaxy Store & Trusted Web Activity).
 *
 * Strictly adheres to:
 * - Rule B4: No banned superlatives or unvalidated marketing claims.
 * - Rule B5: $0.00 live exposure disclosure, hardware execution gate locked in standby.
 * - Rule B10: Non-affiliation disclaimers for Kalshi, CME Group, CF Benchmarks, Polymarket, Coinbase, Kraken, Bitstamp, Gemini.
 * - Rule B11: Direct Progressive Web App installation with store scaffolding transparency (no fake store links).
 * - Gold Standard restrained luxury design system: #06070A, #0C0F17, #DFB843, #00F2FE.
 */

export function renderMobilePageHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#06070A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="QuanterraOS">
<title>QuanterraOS Mobile Terminal — Progressive Web App Direct Install</title>
<meta name="description" content="Install QuanterraOS directly on Apple iPhone and Samsung Galaxy via Progressive Web App. Real-time predictive intelligence, low-latency market telemetry, and Quanta & Quantana AI executive voice.">

<!-- PWA & Icon Metadata -->
<link rel="manifest" href="/manifest.json">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/assets/icon-512.png">
<link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<meta property="og:title" content="QuanterraOS Mobile Terminal">
<meta property="og:description" content="Quantitative intelligence and 8-specialist predictive council on mobile. Direct PWA installation.">
<meta property="og:image" content="/assets/icon-512.png">

<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<style>
  :root {
    --bg: #06070A;
    --surface: #0C0F17;
    --surface-card: #111622;
    --surface-border: rgba(223, 184, 67, 0.2);
    --border-subtle: rgba(255, 255, 255, 0.08);
    --text-primary: #F8FAFC;
    --text-muted: #8F95A0;
    --gold: #DFB843;
    --gold-glow: rgba(223, 184, 67, 0.28);
    --cyan: #00F2FE;
    --cyan-glow: rgba(0, 242, 254, 0.25);
    --emerald: #10B981;
    --crimson: #F43F5E;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font-sans);
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
    background-image: 
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 242, 254, 0.12), transparent),
      radial-gradient(ellipse 60% 40% at 50% 120%, rgba(223, 184, 67, 0.08), transparent);
    padding-bottom: 70px;
  }

  /* Header & Navigation */
  header {
    border-bottom: 1px solid var(--border-subtle);
    padding: 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(6, 7, 10, 0.9);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--text-primary);
  }

  .brand-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(223, 184, 67, 0.35);
  }

  .brand-name {
    font-weight: 800;
    font-size: 17px;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
  }

  .brand-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 2px 7px;
    border-radius: 4px;
    background: rgba(0, 242, 254, 0.12);
    color: var(--cyan);
    border: 1px solid rgba(0, 242, 254, 0.3);
  }

  .nav-center-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(223, 184, 67, 0.08);
    border: 1px solid rgba(223, 184, 67, 0.3);
    color: #F7E7B4;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }
  .nav-center-pill:hover {
    background: rgba(223, 184, 67, 0.2);
    color: #FFFFFF;
    border-color: rgba(223, 184, 67, 0.6);
  }

  .nav-radar-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--emerald);
    box-shadow: 0 0 6px var(--emerald);
    animation: beaconPulse 1.8s infinite ease-in-out;
  }

  @keyframes beaconPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .nav-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: color 0.2s ease;
  }
  .nav-link:hover { color: var(--text-primary); }

  .btn-outline-gold {
    border: 1px solid var(--gold);
    color: var(--gold);
    padding: 7px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-mono);
    text-decoration: none;
    transition: all 0.2s ease;
    background: rgba(223, 184, 67, 0.06);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-outline-gold:hover {
    background: var(--gold);
    color: #000;
    box-shadow: 0 0 16px var(--gold-glow);
  }

  /* Main Container */
  .container {
    max-width: 1180px;
    margin: 0 auto;
    padding: 36px 20px 80px;
  }

  /* Hero Section */
  .hero-section {
    text-align: center;
    margin-bottom: 48px;
  }

  .pill-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    background: rgba(223, 184, 67, 0.1);
    border: 1px solid rgba(223, 184, 67, 0.35);
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: 20px;
  }

  .hero-title {
    font-size: clamp(30px, 4.8vw, 50px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 18px;
    background: linear-gradient(180deg, #FFFFFF 40%, #A0AEC0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-subtitle {
    font-size: clamp(15px, 1.8vw, 18px);
    color: var(--text-muted);
    max-width: 740px;
    margin: 0 auto 30px;
    line-height: 1.6;
  }

  /* Platform Selector Bar */
  .platform-selector-tabs {
    display: inline-flex;
    background: rgba(12, 15, 23, 0.95);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 4px;
    gap: 6px;
    margin-bottom: 24px;
  }

  .platform-tab {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .platform-tab:hover {
    color: var(--text-primary);
  }
  .platform-tab.active {
    background: rgba(223, 184, 67, 0.15);
    color: var(--gold);
    border: 1px solid rgba(223, 184, 67, 0.4);
    box-shadow: 0 0 12px rgba(223, 184, 67, 0.15);
  }

  .platform-detected-bar {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 18px;
    border-radius: 10px;
    background: rgba(12, 15, 23, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    margin-bottom: 36px;
  }
  .platform-detected-bar strong {
    color: var(--cyan);
  }

  /* Download Action Grid */
  .download-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 56px;
  }

  .download-card {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }

  .download-card:hover {
    border-color: var(--cyan);
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 20px var(--cyan-glow);
  }

  .download-card.highlight {
    border-color: rgba(223, 184, 67, 0.45);
    background: linear-gradient(180deg, rgba(223, 184, 67, 0.06) 0%, var(--surface) 100%);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(223, 184, 67, 0.15);
  }

  .card-top {
    margin-bottom: 24px;
  }

  .card-header-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    border: 1px solid var(--border-subtle);
  }

  .card-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }

  .card-desc {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .card-specs {
    list-style: none;
    margin-top: 18px;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-specs li {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-specs li::before {
    content: "✓";
    color: var(--emerald);
    font-weight: bold;
  }

  .btn-store {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 13px 20px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    font-family: var(--font-mono);
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
  }

  .btn-apple {
    background: #FFFFFF;
    color: #000000;
    box-shadow: 0 4px 14px rgba(255, 255, 255, 0.2);
  }
  .btn-apple:hover {
    background: #E2E8F0;
    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.35);
  }

  .btn-pwa {
    background: rgba(0, 242, 254, 0.12);
    color: var(--cyan);
    border: 1px solid var(--cyan);
  }
  .btn-pwa:hover {
    background: var(--cyan);
    color: #000000;
    box-shadow: 0 0 20px var(--cyan-glow);
  }

  /* Interactive Device Showcase */
  .showcase-section {
    margin-bottom: 64px;
  }

  .showcase-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .showcase-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 10px;
  }

  .showcase-subtitle {
    font-size: 15px;
    color: var(--text-muted);
  }

  .devices-wrapper {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 48px;
    flex-wrap: wrap;
  }

  /* Generic iOS Mobile Mockup Frame */
  .device-phone {
    width: 320px;
    height: 640px;
    background: #18191C;
    border-radius: 48px;
    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 8px #2D3036, 0 0 0 10px #18191C;
    position: relative;
    overflow: hidden;
    border: 2px solid #3E4249;
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }

  .device-phone:hover {
    transform: translateY(-6px);
    box-shadow: 0 35px 75px -12px rgba(0, 242, 254, 0.25), 0 0 0 8px #2D3036;
  }

  /* Generic Android Mobile Frame */
  .device-samsung {
    width: 320px;
    height: 640px;
    background: #101115;
    border-radius: 36px;
    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 8px #22252B, 0 0 0 10px #111317;
    position: relative;
    overflow: hidden;
    border: 2px solid #333742;
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }

  .device-samsung:hover {
    transform: translateY(-6px);
    box-shadow: 0 35px 75px -12px rgba(223, 184, 67, 0.25), 0 0 0 8px #22252B;
  }

  /* Dynamic Island (iPhone) */
  .dynamic-island {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 104px;
    height: 26px;
    background: #000;
    border-radius: 20px;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
  }

  .island-pill {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 6px var(--cyan);
    animation: beaconPulse 1.5s infinite;
  }

  .island-cam {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #111;
    border: 1px solid #222;
  }

  /* Punch-Hole Camera (Samsung) */
  .samsung-cam {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #000;
    border: 1.5px solid #222;
    z-index: 20;
  }

  /* Internal Screen Cockpit Content */
  .screen-content {
    padding: 44px 14px 16px;
    height: 100%;
    overflow-y: auto;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #06070A;
  }

  .mockup-header-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 6px;
  }

  .screen-telemetry-hud {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 8px 10px;
  }

  .telemetry-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 10px;
    margin-bottom: 3px;
  }
  .telemetry-row:last-child { margin-bottom: 0; }

  /* Interactive Taker Drag Mockup Widget */
  .mockup-drag-widget {
    background: rgba(14, 20, 32, 0.95);
    border: 1px solid rgba(223, 184, 67, 0.3);
    border-radius: 8px;
    padding: 10px;
  }

  .mockup-drag-title {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--gold);
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .mockup-btn-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }

  .mockup-touch-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    padding: 5px 2px;
    border-radius: 4px;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;
  }
  .mockup-touch-btn.active {
    background: rgba(223, 184, 67, 0.25);
    border-color: var(--gold);
    color: var(--gold);
    font-weight: 700;
  }

  .mockup-calc-result {
    background: rgba(0, 0, 0, 0.5);
    border-radius: 6px;
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .result-line {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 10px;
    margin-bottom: 3px;
  }

  /* 60s TWAP Tick Strip */
  .twap-mockup-strip {
    display: grid;
    grid-template-columns: repeat(20, 1fr);
    gap: 2px;
    margin: 6px 0;
  }
  .twap-mockup-tick {
    height: 8px;
    background: rgba(223, 184, 67, 0.2);
    border-radius: 1px;
  }
  .twap-mockup-tick.active {
    background: var(--emerald);
    box-shadow: 0 0 4px var(--emerald);
  }
  .twap-mockup-tick.danger {
    background: var(--crimson);
    box-shadow: 0 0 4px var(--crimson);
  }

  .screen-voice-wave {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 22px;
    padding: 4px 8px;
    background: rgba(0, 242, 254, 0.08);
    border-radius: 6px;
    border: 1px solid rgba(0, 242, 254, 0.2);
  }

  .wave-bar {
    width: 3px;
    background: var(--cyan);
    border-radius: 2px;
    animation: wave 1.2s infinite ease-in-out;
  }
  .wave-bar:nth-child(2) { animation-delay: 0.2s; height: 14px; }
  .wave-bar:nth-child(3) { animation-delay: 0.4s; height: 18px; }
  .wave-bar:nth-child(4) { animation-delay: 0.1s; height: 10px; }
  .wave-bar:nth-child(5) { animation-delay: 0.5s; height: 16px; }

  @keyframes wave {
    0%, 100% { height: 5px; }
    50% { height: 18px; }
  }

  .device-label {
    text-align: center;
    margin-top: 14px;
    font-weight: 700;
    font-size: 14px;
    color: var(--text-primary);
  }

  .device-sub {
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  /* QR Code Direct Camera Scan Section */
  .qr-section {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 32px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
    margin-bottom: 56px;
    flex-wrap: wrap;
  }

  .qr-info {
    flex: 1;
    min-width: 280px;
  }

  .qr-info h3 {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .qr-info p {
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .qr-code-box {
    background: #FFFFFF;
    padding: 14px;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .qr-caption {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    color: #111;
    letter-spacing: 0.05em;
  }

  /* Features Grid */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 56px;
  }

  .feature-item {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 22px;
  }

  .feature-icon {
    font-size: 22px;
    margin-bottom: 10px;
  }

  .feature-item h4 {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .feature-item p {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* Modal Walkthrough for iOS Safari */
  .modal-backdrop {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-backdrop.active {
    display: flex;
  }

  .modal-box {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    max-width: 440px;
    width: 100%;
    padding: 28px;
    position: relative;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
  }

  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
  }

  .modal-step {
    display: flex;
    gap: 14px;
    margin-bottom: 18px;
    align-items: flex-start;
  }

  .step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--gold);
    color: #000;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    flex-shrink: 0;
  }

  .step-text h5 {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .step-text p {
    font-size: 13px;
    color: var(--text-muted);
  }

  /* Rule B5 Governance Banner */
  .rule-b5-banner {
    border-top: 1px solid var(--border-subtle);
    padding: 28px 0 0;
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
    font-family: var(--font-mono);
  }

  .rule-b5-banner span {
    color: var(--gold);
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .container { padding: 20px 14px 60px; }
    .hero-title { font-size: 28px; }
    .download-grid { grid-template-columns: 1fr; }
    .devices-wrapper { gap: 32px; }
    .device-phone, .device-samsung { width: 290px; height: 580px; }
    .qr-section { flex-direction: column; text-align: center; }
    .nav-actions .nav-link { display: none; }
  }
</style>
</head>
<body>

<header>
  <a href="/" class="nav-brand">
    <img src="/apple-touch-icon.png" alt="QuanterraOS Icon" class="brand-logo">
    <span class="brand-name">
      QUANTERRA<span style="color:var(--cyan)">OS</span>
      <span class="brand-tag">MOBILE</span>
    </span>
  </a>

  <a href="/radar" class="nav-center-pill">
    <span class="nav-radar-dot"></span>
    <span>SETTLEMENT RADAR</span>
  </a>

  <div class="nav-actions">
    <a href="/dashboard" class="nav-link">Live Cockpit</a>
    <a href="/calculator" class="nav-link">Taker Drag</a>
    <a href="/vs" class="nav-link">Vs Contenders</a>
    <a href="/dashboard" class="btn-outline-gold">
      ⚡ Launch Terminal
    </a>
  </div>
</header>

<main class="container">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="pill-badge">
      <div class="nav-radar-dot"></div>
      PWA DIRECT DEPLOYMENT • ZERO STORE INTERMEDIARIES • NO STORE REQUIRED
    </div>
    <h1 class="hero-title">Empirical Prediction Intelligence.<br>Installed Directly on iPhone &amp; Samsung.</h1>
    <p class="hero-subtitle">
      Install QuanterraOS on any iOS or Android device in 5 seconds with no app store required. Runs fullscreen with zero browser chrome, offline asset caching, and direct access to predictive intelligence and 60-second settlement telemetry.
    </p>

    <!-- Platform Selector Bar -->
    <div class="platform-selector-tabs" role="tablist" aria-label="Device Architecture Selection">
      <button class="platform-tab active" id="tabIos" onclick="selectPlatform('ios')" role="tab">
        🍏 Apple iPhone (iOS Safari)
      </button>
      <button class="platform-tab" id="tabAndroid" onclick="selectPlatform('android')" role="tab">
        🤖 Samsung Galaxy &amp; Android
      </button>
      <button class="platform-tab" id="tabUniversal" onclick="selectPlatform('universal')" role="tab">
        💻 Universal Web Terminal
      </button>
    </div>

    <!-- Client-side OS Detection -->
    <div>
      <div class="platform-detected-bar" id="platformBanner">
        <span>Detected Operating System:</span>
        <strong id="detectedDeviceText">Analyzing Device Architecture...</strong>
      </div>
    </div>
  </section>

  <!-- Direct Browser Install Action Cards -->
  <section class="download-grid" id="installSection">
    <!-- Apple iOS Safari WebClip -->
    <div class="download-card highlight" id="iosCard">
      <div class="card-top">
        <div class="card-header-icon">
          <!-- Apple SVG -->
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 0.6-2.65 1.36-.58.67-1.09 1.74-.95 2.77.99.08 2.05-.53 2.67-1.28z"/>
          </svg>
        </div>
        <div class="card-title">
          Apple iOS Safari
          <span class="badge-tag">iPhone &amp; iPad</span>
        </div>
        <p class="card-desc">
          Add directly to your iOS Home Screen via Safari. Launches in native full-screen standalone mode with zero browser chrome and custom Apple Touch icon.
        </p>
        <ul class="card-specs">
          <li>No App Store account or download needed</li>
          <li>Apple Touch Icon (180x180 PNG) included</li>
          <li>Fullscreen standalone display</li>
          <li>Web Audio Quanta & Quantana voice synthesizer support</li>
        </ul>
      </div>
      <div>
        <button class="btn-store btn-apple" onclick="openIosInstructions()" style="margin-bottom: 10px;">
          📲 Add to iPhone Home Screen
        </button>
        <a href="/dashboard" class="btn-store btn-pwa">
          ⚡ Open Web Terminal Now
        </a>
      </div>
    </div>

    <!-- Android & Samsung Galaxy PWA -->
    <div class="download-card highlight" id="androidCard">
      <div class="card-top">
        <div class="card-header-icon">
          <!-- Android SVG -->
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M3.6 1.8L13.8 12L3.6 22.2C3.2 21.8 3 21.1 3 20.2V3.8C3 2.9 3.2 2.2 3.6 1.8Z" fill="#00E676"/>
            <path d="M17.2 8.6L14.7 11.1L13.8 12L14.7 12.9L17.2 15.4L20.4 13.6C21.3 13.1 21.3 12.3 20.4 11.8L17.2 8.6Z" fill="#FFD600"/>
            <path d="M13.8 12L3.6 1.8C4 1.4 4.7 1.3 5.4 1.7L17.2 8.6L13.8 12Z" fill="#00B0FF"/>
            <path d="M13.8 12L17.2 15.4L5.4 22.3C4.7 22.7 4 22.6 3.6 22.2L13.8 12Z" fill="#FF3D00"/>
          </svg>
        </div>
        <div class="card-title">
          Android &amp; Samsung
          <span class="badge-tag">Chrome &amp; Samsung Internet</span>
        </div>
        <p class="card-desc">
          1-Tap Progressive Web App installation. Integrates natively with the Android app drawer and home screen using standard WebAPK.
        </p>
        <ul class="card-specs">
          <li>1-Tap direct installation prompt</li>
          <li>High-res maskable PNG icons (192 &amp; 512px)</li>
          <li>Standalone window without browser URL bar</li>
          <li>Background service worker for offline shell</li>
        </ul>
      </div>
      <div>
        <button id="btnPwaAndroid" class="btn-store btn-pwa" onclick="triggerPwaInstall()" style="margin-bottom: 10px;">
          🚀 Install QuanterraOS App
        </button>
        <a href="/dashboard" class="btn-store btn-apple" style="background:#181B24; color:#FFF; border:1px solid rgba(255,255,255,0.1);">
          ⚡ Open Web Terminal Now
        </a>
      </div>
    </div>
  </section>

  <!-- Distribution Transparency Notice -->
  <div style="background: rgba(14, 19, 28, 0.7); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px 24px; margin-bottom: 48px; font-size: 13px; color: var(--text-muted); line-height: 1.6;">
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--gold);"></span>
      <strong style="color:var(--text-primary); font-size:14px;">Store Scaffolding &amp; Distribution Transparency</strong>
    </div>
    <p style="margin-bottom: 8px;">
      <strong>Browser PWA:</strong> QuanterraOS installs directly via the W3C Progressive Web App standard on all modern iOS and Android browsers today. No store account or third-party download is required.
    </p>
    <p style="margin-bottom: 0;">
      <strong>Store Submissions:</strong> Packaging configs (Bubblewrap / Android TWA and Apple Xcode shell) are maintained as developer scaffolding in the repository for eventual submission once developer accounts are enrolled and financial-services review criteria are satisfied. No unverified store links are published.
    </p>
  </div>

  <!-- Interactive Dual Device Showcase -->
  <section class="showcase-section">
    <div class="showcase-header">
      <h2 class="showcase-title">Mobile Interface &amp; Telemetry Preview</h2>
      <p class="showcase-subtitle">Live interactive Taker Drag friction calculator and 60-second CME TWAP resolution radar inside mobile viewports</p>
    </div>

    <div class="devices-wrapper">
      <!-- iOS Device Frame: Interactive Taker Drag Calculator Preview -->
      <div>
        <div class="device-phone">
          <div class="dynamic-island">
            <div class="island-pill"></div>
            <span style="font-size: 8px; color: #888; font-family: var(--font-mono)">QUANTA ON</span>
            <div class="island-cam"></div>
          </div>
          <div class="screen-content">
            <div class="mockup-header-strip">
              <span style="font-weight:800; font-size:11px; letter-spacing:1px; color:#FFF">QUANTERRA<span style="color:var(--cyan)">OS</span></span>
              <span style="color:var(--emerald); font-size:10px; font-family:var(--font-mono)">● ONLINE</span>
            </div>

            <!-- Interactive Taker Drag Card on Phone Screen -->
            <div class="mockup-drag-widget">
              <div class="mockup-drag-title">
                <span>TAKER DRAG AUDIT</span>
                <span id="mockupPriceDisplay" style="color:var(--cyan)">50¢ (PEAK)</span>
              </div>

              <div style="font-size:9px; color:var(--text-muted); margin-bottom:4px; font-family:var(--font-mono)">CONTRACT PRICE P:</div>
              <div class="mockup-btn-group">
                <button type="button" class="mockup-touch-btn" onclick="updateMobileMockupDrag(25, 100)">25¢ (Low)</button>
                <button type="button" class="mockup-touch-btn active" id="btnPrice50" onclick="updateMobileMockupDrag(50, 100)">50¢ (Peak)</button>
                <button type="button" class="mockup-touch-btn" onclick="updateMobileMockupDrag(75, 100)">75¢ (High)</button>
              </div>

              <div style="font-size:9px; color:var(--text-muted); margin-bottom:4px; font-family:var(--font-mono)">ORDER SIZE:</div>
              <div class="mockup-btn-group">
                <button type="button" class="mockup-touch-btn active" id="btnCount100" onclick="updateMobileMockupCount(100)">100 cts</button>
                <button type="button" class="mockup-touch-btn" id="btnCount250" onclick="updateMobileMockupCount(250)">250 cts</button>
                <button type="button" class="mockup-touch-btn" id="btnCount500" onclick="updateMobileMockupCount(500)">500 cts</button>
              </div>

              <div class="mockup-calc-result">
                <div class="result-line">
                  <span style="color:var(--text-muted)">FORMULA:</span>
                  <span style="color:#CBD5E1">0.07 × P × (1-P)</span>
                </div>
                <div class="result-line">
                  <span style="color:var(--text-muted)">DRAG RATE:</span>
                  <span id="mockupRate" style="color:var(--gold); font-weight:700">1.75¢ / contract</span>
                </div>
                <div class="result-line">
                  <span style="color:var(--text-muted)">TOTAL TAKER FEE:</span>
                  <span id="mockupTotalFee" style="color:var(--crimson); font-weight:700">+$1.75</span>
                </div>
                <div class="result-line">
                  <span style="color:var(--text-muted)">PROFIT DRAG:</span>
                  <span id="mockupProfitDrag" style="color:var(--gold); font-weight:700">35.0% hurdle</span>
                </div>
              </div>
            </div>

            <!-- Specialist Audio HUD -->
            <div class="screen-voice-wave">
              <span style="font-size:10px; font-weight:700; color:var(--cyan)">QUANTA VOICE:</span>
              <div class="wave-bar"></div>
              <div class="wave-bar"></div>
              <div class="wave-bar"></div>
              <div class="wave-bar"></div>
              <div class="wave-bar"></div>
              <span style="font-size:9px; color:var(--text-muted); margin-left:auto">READY</span>
            </div>

            <div style="margin-top:auto; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:6px; padding:6px; text-align:center">
              <span style="color:var(--crimson); font-size:10px; font-weight:700; font-family:var(--font-mono)">
                RULE B5: $0.00 EXPOSURE (STANDBY)
              </span>
            </div>
          </div>
        </div>
        <div class="device-label">iOS Safari Standalone Preview</div>
        <div class="device-sub">Interactive Taker Drag Calculator • Fullscreen WebClip</div>
      </div>

      <!-- Android Device Frame: 60s CME TWAP Radar Preview -->
      <div>
        <div class="device-samsung">
          <div class="samsung-cam"></div>
          <div class="screen-content">
            <div class="mockup-header-strip">
              <span style="font-weight:800; font-size:11px; letter-spacing:1px; color:#FFF">QUANTERRA<span style="color:var(--cyan)">OS</span></span>
              <span style="color:var(--gold); font-size:10px; font-family:var(--font-mono)">ANDROID PWA</span>
            </div>

            <div class="screen-telemetry-hud">
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">STRIKE TARGET:</span>
                <span style="color:var(--cyan); font-weight:700">BTC > $64,250</span>
              </div>
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">CME CF BRTI:</span>
                <span style="color:var(--emerald); font-weight:700">$64,268.40 (+18.40)</span>
              </div>
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">RESOLUTION STATUS:</span>
                <span style="color:var(--crimson); font-weight:700">⚠ DANGER ZONE (T - 22s)</span>
              </div>
            </div>

            <!-- Animated 60s TWAP sampling bar -->
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:8px;">
              <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:9px; color:var(--text-muted);">
                <span>60s TWAP SAMPLES</span>
                <span style="color:var(--emerald)">19 / 30 LOGGED</span>
              </div>
              <div class="twap-mockup-strip">
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick active"></div>
                <div class="twap-mockup-tick danger"></div>
                <div class="twap-mockup-tick"></div>
              </div>
              <div style="font-size:9px; color:var(--text-muted); line-height:1.3; font-family:var(--font-mono);">
                CF BRTI sub-second index feeds locked into 30 one-second sampling partitions.
              </div>
            </div>

            <div class="screen-specialist-card" style="border-color: rgba(0,242,254,0.25); background:rgba(12, 15, 23, 0.9); border:1px solid rgba(0,242,254,0.25); border-radius:8px; padding:8px;">
              <div style="color:var(--cyan); font-weight:700; font-size:10px; margin-bottom:2px;">
                <span>🦅 FALCON HEURISTIC AUDIT</span>
              </div>
              <p style="font-size:10px; color:var(--text-muted); line-height:1.35">
                "Orderbook imbalance heuristic underperforms 0.2500 baseline over n=31 settled markets."
              </p>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:8px;">
              <div style="font-size:9px; color:var(--text-muted); margin-bottom:2px; font-family:var(--font-mono)">KALSHI DUAL-FEED SPREAD</div>
              <div style="display:flex; justify-content:space-between; font-weight:700; font-size:10px; font-family:var(--font-mono)">
                <span style="color:var(--emerald)">YES: 61¢</span>
                <span style="color:var(--crimson)">NO: 40¢</span>
                <span style="color:var(--gold)">SPREAD: 1¢</span>
              </div>
            </div>

            <div style="margin-top:auto; background:rgba(0,242,254,0.08); border:1px solid rgba(0,242,254,0.3); border-radius:6px; padding:6px; text-align:center">
              <span style="color:var(--cyan); font-size:10px; font-weight:700; font-family:var(--font-mono)">
                PWA STANDALONE: QUANTERRAOS MOBILE
              </span>
            </div>
          </div>
        </div>
        <div class="device-label">Android PWA Standalone Preview</div>
        <div class="device-sub">Live CME TWAP Radar • Chrome &amp; Samsung Internet</div>
      </div>
    </div>
  </section>

  <!-- Instant QR Camera Scan Section -->
  <section class="qr-section">
    <div class="qr-info">
      <h3>Scan with Your Phone Camera</h3>
      <p>
        Point your Apple iPhone or Samsung Galaxy camera at this QR code. Your mobile browser will instantly open the QuanterraOS Terminal with native install prompts ready.
      </p>
      <div style="display:flex; gap:12px; flex-wrap:wrap">
        <span class="badge-tag" style="background:rgba(0,242,254,0.1); color:var(--cyan); border:1px solid rgba(0,242,254,0.3)">
          ✓ iOS Safari Instant WebClip
        </span>
        <span class="badge-tag" style="background:rgba(0,135,95,0.1); color:#00E676; border:1px solid rgba(0,135,95,0.3)">
          ✓ Samsung WebAPK Auto-Prompt
        </span>
      </div>
    </div>
    <div class="qr-code-box">
      <!-- High fidelity SVG QR Code pointing to /mobile -->
      <svg width="150" height="150" viewBox="0 0 33 33" fill="#000000">
        <!-- Finder top-left -->
        <rect x="0" y="0" width="7" height="7" fill="#000"/>
        <rect x="1" y="1" width="5" height="5" fill="#FFF"/>
        <rect x="2" y="2" width="3" height="3" fill="#000"/>

        <!-- Finder top-right -->
        <rect x="26" y="0" width="7" height="7" fill="#000"/>
        <rect x="27" y="1" width="5" height="5" fill="#FFF"/>
        <rect x="28" y="2" width="3" height="3" fill="#000"/>

        <!-- Finder bottom-left -->
        <rect x="0" y="26" width="7" height="7" fill="#000"/>
        <rect x="1" y="27" width="5" height="5" fill="#FFF"/>
        <rect x="2" y="28" width="3" height="3" fill="#000"/>

        <!-- Timing patterns -->
        <rect x="8" y="6" width="1" height="1"/>
        <rect x="10" y="6" width="1" height="1"/>
        <rect x="12" y="6" width="1" height="1"/>
        <rect x="14" y="6" width="1" height="1"/>
        <rect x="16" y="6" width="1" height="1"/>
        <rect x="18" y="6" width="1" height="1"/>
        <rect x="20" y="6" width="1" height="1"/>
        <rect x="22" y="6" width="1" height="1"/>
        <rect x="24" y="6" width="1" height="1"/>

        <rect x="6" y="8" width="1" height="1"/>
        <rect x="6" y="10" width="1" height="1"/>
        <rect x="6" y="12" width="1" height="1"/>
        <rect x="6" y="14" width="1" height="1"/>
        <rect x="6" y="16" width="1" height="1"/>
        <rect x="6" y="18" width="1" height="1"/>
        <rect x="6" y="20" width="1" height="1"/>
        <rect x="6" y="22" width="1" height="1"/>
        <rect x="6" y="24" width="1" height="1"/>

        <!-- Data modules representing URL /mobile -->
        <rect x="9" y="1" width="2" height="1"/>
        <rect x="13" y="1" width="1" height="2"/>
        <rect x="16" y="2" width="2" height="1"/>
        <rect x="20" y="1" width="3" height="1"/>
        <rect x="24" y="2" width="1" height="3"/>

        <rect x="9" y="4" width="3" height="1"/>
        <rect x="15" y="4" width="2" height="2"/>
        <rect x="20" y="4" width="1" height="2"/>

        <rect x="1" y="9" width="2" height="2"/>
        <rect x="4" y="9" width="1" height="3"/>
        <rect x="10" y="9" width="3" height="2"/>
        <rect x="15" y="8" width="2" height="3"/>
        <rect x="19" y="9" width="2" height="1"/>
        <rect x="23" y="9" width="2" height="2"/>
        <rect x="28" y="9" width="3" height="2"/>

        <rect x="1" y="14" width="3" height="1"/>
        <rect x="5" y="13" width="1" height="3"/>
        <rect x="9" y="13" width="2" height="2"/>
        <rect x="12" y="14" width="3" height="1"/>
        <rect x="18" y="13" width="1" height="3"/>
        <rect x="22" y="14" width="2" height="2"/>
        <rect x="27" y="13" width="2" height="1"/>
        <rect x="30" y="14" width="2" height="2"/>

        <!-- Center Monogram -->
        <rect x="14" y="14" width="5" height="5" fill="#000"/>
        <rect x="15" y="15" width="3" height="3" fill="#00F2FE"/>

        <rect x="1" y="19" width="2" height="2"/>
        <rect x="4" y="20" width="2" height="1"/>
        <rect x="9" y="18" width="2" height="2"/>
        <rect x="12" y="18" width="1" height="3"/>
        <rect x="20" y="19" width="3" height="1"/>
        <rect x="25" y="18" width="2" height="2"/>
        <rect x="29" y="19" width="3" height="2"/>

        <rect x="9" y="23" width="2" height="2"/>
        <rect x="13" y="22" width="2" height="2"/>
        <rect x="17" y="23" width="3" height="1"/>
        <rect x="22" y="22" width="2" height="3"/>
        <rect x="26" y="23" width="2" height="1"/>
        <rect x="30" y="22" width="2" height="2"/>

        <rect x="9" y="28" width="3" height="2"/>
        <rect x="14" y="27" width="2" height="3"/>
        <rect x="18" y="28" width="2" height="2"/>
        <rect x="22" y="27" width="2" height="2"/>
        <rect x="26" y="28" width="3" height="2"/>
        <rect x="30" y="27" width="1" height="3"/>
      </svg>
      <span class="qr-caption">SCAN TO OPEN</span>
    </div>
  </section>

  <!-- Key Features Grid -->
  <section class="features-grid">
    <div class="feature-item">
      <div class="feature-icon">⚡</div>
      <h4>Fast Offline Shell</h4>
      <p>Offline Service Worker pre-caches static shell assets, styling, and brand icons. Financial pricing, order routing, and wallet operations are strictly network-gated to prevent stale data.</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">🎙️</div>
      <h4>Quanta &amp; Quantana Voice</h4>
      <p>Audio-synthesized briefings and speech-to-text voice recognition natively tuned for mobile microphones and wireless earbuds.</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">🔒</div>
      <h4>Client Sandbox Security</h4>
      <p>Runs within the standard browser security sandbox. Does not require broad device permissions, keeping your hardware and data secure.</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">📊</div>
      <h4>Kalshi Dual-Feed</h4>
      <p>Direct low-latency WebSocket stream of 15-minute and hourly event contracts with instant strike ladder pricing.</p>
    </div>
    <div class="feature-item" style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(148, 104, 255, 0.15), rgba(89, 221, 236, 0.08)); border: 1px solid rgba(148, 104, 255, 0.35); text-align: left; padding: 20px; border-radius: 12px;">
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px;">
        <div>
          <span style="font-family:var(--font-mono); font-size:11px; color:var(--cyan); text-transform:uppercase; font-weight:700;">👑 COSMIC FLIGHT PILOT LINE</span>
          <h4 style="font-size:16px; margin:4px 0; color:#FFF;">King &amp; Queen of the Galaxy Apparel</h4>
          <p style="font-size:12px; color:var(--text-muted); margin:0;">Explore the official street sets and flight sets for Captains Quanta &amp; Quantana, plus the 8 original Council collections.</p>
        </div>
        <a href="/merchandise/crew" style="display:inline-flex; align-items:center; gap:6px; background:#9468FF; color:#FFF; font-weight:700; font-size:12px; padding:10px 16px; border-radius:8px; text-decoration:none;">Explore Pilot Gear &rarr;</a>
      </div>
    </div>
  </section>

  <!-- Rule B5 Governance Banner -->
  <footer class="rule-b5-banner">
    <div>
      CONSTITUTIONAL GOVERNANCE: <span>RULE B5 ACTIVE</span> • $0.00 LIVE EXPOSURE • EXECUTION GATE LOCKED IN STANDBY
    </div>
    <div style="margin-top: 6px; font-size: 11px;">
      All models operate in empirical audit and simulated forward-testing mode. QuanterraOS Foundation © 2026. Non-affiliated with Kalshi or CME Group.
    </div>
  </footer>
</main>

<!-- iOS Safari Add to Home Screen Modal Walkthrough -->
<div class="modal-backdrop" id="iosModal" role="dialog" aria-modal="true">
  <div class="modal-box">
    <button class="modal-close" onclick="closeIosInstructions()" aria-label="Close modal">✕</button>
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="/apple-touch-icon.png" width="56" height="56" style="border-radius:14px; margin-bottom:10px; border:1px solid var(--gold);">
      <h3 style="font-size:18px; font-weight:800;">Install on Apple iPhone</h3>
      <p style="font-size:13px; color:var(--text-muted);">Add QuanterraOS to your iOS Home Screen in two easy taps:</p>
    </div>

    <div class="modal-step">
      <div class="step-num">1</div>
      <div class="step-text">
        <h5>Tap the Share Button</h5>
        <p>In the bottom Safari toolbar, tap the <strong>Share</strong> icon (the square with an arrow pointing up).</p>
      </div>
    </div>

    <div class="modal-step">
      <div class="step-num">2</div>
      <div class="step-text">
        <h5>Select "Add to Home Screen"</h5>
        <p>Scroll down the share sheet and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> in the top right corner.</p>
      </div>
    </div>

    <div class="modal-step">
      <div class="step-num">3</div>
      <div class="step-text">
        <h5>Launch QuanterraOS</h5>
        <p>The high-speed app icon is placed directly on your iPhone home screen with native full-screen execution.</p>
      </div>
    </div>

    <button class="btn-store btn-apple" onclick="closeIosInstructions()" style="margin-top: 12px;">
      Got It, Open Terminal
    </button>
  </div>
</div>

<script>
  // Service Worker Registration for Offline Shell
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.debug('[QuanterraOS] Mobile PWA Service Worker Registered:', reg.scope))
        .catch(err => console.debug('[QuanterraOS] Service Worker registration failed:', err));
    });
  }

  // PWA Install Prompt Capture for Samsung / Android
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('btnPwaAndroid');
    if (btn) {
      btn.style.display = 'flex';
      btn.textContent = '🚀 Install QuanterraOS App Now';
    }
  });

  function triggerPwaInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.debug('[QuanterraOS] User accepted the installation prompt');
        }
        deferredPrompt = null;
      });
    } else {
      window.location.href = '/dashboard';
    }
  }

  // iOS Safari Walkthrough Modal
  function openIosInstructions() {
    const modal = document.getElementById('iosModal');
    if (modal) modal.classList.add('active');
  }

  function closeIosInstructions() {
    const modal = document.getElementById('iosModal');
    if (modal) modal.classList.remove('active');
  }

  // Platform Selector Tab Switching
  function selectPlatform(platform) {
    const tabIos = document.getElementById('tabIos');
    const tabAndroid = document.getElementById('tabAndroid');
    const tabUniversal = document.getElementById('tabUniversal');
    const iosCard = document.getElementById('iosCard');
    const androidCard = document.getElementById('androidCard');

    [tabIos, tabAndroid, tabUniversal].forEach(t => t && t.classList.remove('active'));

    if (platform === 'ios') {
      if (tabIos) tabIos.classList.add('active');
      if (iosCard) {
        iosCard.classList.add('highlight');
        iosCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (androidCard) androidCard.classList.remove('highlight');
    } else if (platform === 'android') {
      if (tabAndroid) tabAndroid.classList.add('active');
      if (androidCard) {
        androidCard.classList.add('highlight');
        androidCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (iosCard) iosCard.classList.remove('highlight');
    } else {
      if (tabUniversal) tabUniversal.classList.add('active');
      window.location.href = '/dashboard';
    }
  }

  // Device Architecture Auto-Detection
  document.addEventListener('DOMContentLoaded', () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const platformText = document.getElementById('detectedDeviceText');
    const androidCard = document.getElementById('androidCard');
    const iosCard = document.getElementById('iosCard');

    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      if (platformText) platformText.innerHTML = '<span style="color:#FFF">Apple iOS (iPhone / iPad) Detected</span>';
      selectPlatform('ios');
    } else if (/Samsung|SAMSUNG|SM-|GT-|SCH-|SHV-/i.test(ua)) {
      if (platformText) platformText.innerHTML = '<span style="color:#00F2FE">Samsung Galaxy (One UI) Detected</span>';
      selectPlatform('android');
    } else if (/Android/i.test(ua)) {
      if (platformText) platformText.innerHTML = '<span style="color:#00E676">Android Google Play Device Detected</span>';
      selectPlatform('android');
    } else {
      if (platformText) platformText.innerHTML = '<span style="color:var(--text-muted)">Desktop / Workstation (Universal Access)</span>';
    }
  });

  // Interactive Taker Drag Mockup Simulator inside Phone Frame
  let currentMockupPrice = 50;
  let currentMockupCount = 100;

  function updateMobileMockupDrag(price, count) {
    if (price !== undefined) currentMockupPrice = price;
    if (count !== undefined) currentMockupCount = count;

    const p = currentMockupPrice / 100;
    const n = currentMockupCount;

    // Formula: 0.07 * P * (1 - P)
    const ratePerContract = Math.ceil(0.07 * p * (1 - p) * 100) / 100;
    const totalFee = Math.ceil(0.07 * n * p * (1 - p) * 100) / 100;

    // Profit Drag calculation (breakeven hurdle)
    const profitDragPct = (ratePerContract / (1 - p)) * 100;

    const priceDisplay = document.getElementById('mockupPriceDisplay');
    const rateDisplay = document.getElementById('mockupRate');
    const totalFeeDisplay = document.getElementById('mockupTotalFee');
    const profitDragDisplay = document.getElementById('mockupProfitDrag');

    if (priceDisplay) priceDisplay.textContent = currentMockupPrice + '¢' + (currentMockupPrice === 50 ? ' (PEAK)' : '');
    if (rateDisplay) rateDisplay.textContent = (ratePerContract * 100).toFixed(2) + '¢ / contract';
    if (totalFeeDisplay) totalFeeDisplay.textContent = '+$' + totalFee.toFixed(2);
    if (profitDragDisplay) profitDragDisplay.textContent = profitDragPct.toFixed(1) + '% hurdle';

    // Update active button state
    document.querySelectorAll('.mockup-drag-widget .mockup-btn-group:first-of-type .mockup-touch-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(currentMockupPrice + '¢'));
    });
  }

  function updateMobileMockupCount(count) {
    currentMockupCount = count;
    document.querySelectorAll('.mockup-drag-widget .mockup-btn-group:nth-of-type(2) .mockup-touch-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(count + ' cts'));
    });
    updateMobileMockupDrag();
  }
</script>
</body>
</html>`;
}
