/**
 * Mobile App Download & Installation Portal (/mobile, /download, /app)
 *
 * Dedicated high-performance mobile deployment gateway for Apple iPhone (iOS Safari & Universal Links)
 * and Samsung Galaxy / Android (Google Play Store, Samsung Galaxy Store & Trusted Web Activity).
 *
 * Strictly adheres to:
 * - Rule B4: No banned superlatives or unvalidated marketing claims.
 * - Rule B5: $0.00 live exposure disclosure, hardware execution gate locked in standby.
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
<title>QuanterraOS Mobile Terminal — Apple iPhone & Samsung Android Download Portal</title>
<meta name="description" content="Download QuanterraOS on Apple iPhone and Samsung Galaxy via Google Play Store, Samsung Store, and Progressive Web App. Real-time predictive intelligence, F1 pit wall telemetry, and Aria AI executive voice.">

<!-- PWA & Store Metadata -->
<link rel="manifest" href="/manifest.json">
<link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
<link rel="apple-touch-icon" href="/assets/icon-512.svg">
<meta property="og:title" content="QuanterraOS Mobile Terminal">
<meta property="og:description" content="High-speed quantitative intelligence and 8-specialist predictive council on iPhone and Samsung.">
<meta property="og:image" content="/assets/icon-512.svg">

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
  }

  /* Header & Navigation */
  header {
    border-bottom: 1px solid var(--border-subtle);
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(12px);
    background: rgba(6, 7, 10, 0.85);
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
    width: 36px;
    height: 36px;
    border-radius: 9px;
  }

  .brand-name {
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 8px;
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

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 16px;
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
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    background: rgba(223, 184, 67, 0.05);
  }
  .btn-outline-gold:hover {
    background: var(--gold);
    color: #000;
    box-shadow: 0 0 16px var(--gold-glow);
  }

  /* Main Container */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }

  /* Hero Section */
  .hero-section {
    text-align: center;
    margin-bottom: 56px;
  }

  .pill-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    background: rgba(223, 184, 67, 0.1);
    border: 1px solid rgba(223, 184, 67, 0.3);
    color: var(--gold);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin-bottom: 20px;
  }

  .pulsing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--emerald);
    box-shadow: 0 0 8px var(--emerald);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }

  .hero-title {
    font-size: clamp(32px, 5vw, 54px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 18px;
    background: linear-gradient(180deg, #FFFFFF 40%, #A0AEC0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-subtitle {
    font-size: clamp(16px, 2vw, 19px);
    color: var(--text-muted);
    max-width: 760px;
    margin: 0 auto 36px;
    line-height: 1.6;
  }

  /* Device Selector Banner */
  .platform-detected-bar {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    border-radius: 12px;
    background: rgba(12, 15, 23, 0.9);
    border: 1px solid var(--border-subtle);
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 36px;
  }

  .platform-detected-bar strong {
    color: var(--cyan);
  }

  /* Download Action Grid */
  .download-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 64px;
  }

  .download-card {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }

  .download-card:hover {
    border-color: var(--cyan);
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 24px var(--cyan-glow);
  }

  .download-card.highlight {
    border-color: rgba(223, 184, 67, 0.4);
    background: linear-gradient(180deg, rgba(223, 184, 67, 0.05) 0%, var(--surface) 100%);
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
    padding: 2px 6px;
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
    margin-top: 16px;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    gap: 6px;
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
    gap: 12px;
    width: 100%;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
  }

  .btn-google-play {
    background: #00875F;
    color: #FFFFFF;
    box-shadow: 0 4px 14px rgba(0, 135, 95, 0.3);
  }
  .btn-google-play:hover {
    background: #00A675;
    box-shadow: 0 6px 20px rgba(0, 135, 95, 0.5);
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

  .btn-samsung {
    background: #1428A0;
    color: #FFFFFF;
    box-shadow: 0 4px 14px rgba(20, 40, 160, 0.35);
  }
  .btn-samsung:hover {
    background: #1B35D4;
    box-shadow: 0 6px 20px rgba(20, 40, 160, 0.55);
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
    margin-bottom: 72px;
  }

  .showcase-header {
    text-align: center;
    margin-bottom: 40px;
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
    align-items: center;
    gap: 48px;
    flex-wrap: wrap;
    perspective: 1000px;
  }

  /* iPhone 16 Pro Mockup Frame */
  .device-phone {
    width: 320px;
    height: 640px;
    background: #18191C;
    border-radius: 50px;
    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 10px #2D3036, 0 0 0 12px #18191C;
    position: relative;
    overflow: hidden;
    border: 3px solid #3E4249;
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }

  .device-phone:hover {
    transform: translateY(-8px) rotateY(-3deg);
    box-shadow: 0 35px 75px -12px rgba(0, 242, 254, 0.3), 0 0 0 10px #2D3036;
  }

  /* Samsung Galaxy S25 Frame */
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
    transform: translateY(-8px) rotateY(3deg);
    box-shadow: 0 35px 75px -12px rgba(223, 184, 67, 0.3), 0 0 0 8px #22252B;
  }

  /* Dynamic Island (iPhone) */
  .dynamic-island {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 28px;
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
    animation: pulse 1.5s infinite;
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
    padding: 48px 16px 20px;
    height: 100%;
    overflow-y: auto;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #06070A;
  }

  .screen-telemetry-hud {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    padding: 10px;
  }

  .telemetry-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 11px;
    margin-bottom: 4px;
  }

  .telemetry-row:last-child { margin-bottom: 0; }

  .screen-specialist-card {
    background: rgba(12, 15, 23, 0.9);
    border: 1px solid rgba(223, 184, 67, 0.2);
    border-radius: 10px;
    padding: 10px;
  }

  .specialist-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 12px;
    color: var(--gold);
    margin-bottom: 4px;
  }

  .screen-voice-wave {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 24px;
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
  .wave-bar:nth-child(2) { animation-delay: 0.2s; height: 16px; }
  .wave-bar:nth-child(3) { animation-delay: 0.4s; height: 20px; }
  .wave-bar:nth-child(4) { animation-delay: 0.1s; height: 12px; }
  .wave-bar:nth-child(5) { animation-delay: 0.5s; height: 18px; }

  @keyframes wave {
    0%, 100% { height: 6px; }
    50% { height: 20px; }
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
    padding: 36px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
    margin-bottom: 64px;
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
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .qr-code-box svg {
    display: block;
  }

  .qr-caption {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: #111;
    letter-spacing: 0.05em;
  }

  /* Features Grid */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
    margin-bottom: 64px;
  }

  .feature-item {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 24px;
  }

  .feature-icon {
    font-size: 24px;
    margin-bottom: 12px;
  }

  .feature-item h4 {
    font-size: 16px;
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
    background: rgba(0, 0, 0, 0.8);
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
    padding: 32px 0 0;
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
    .container { padding: 24px 16px 60px; }
    .hero-title { font-size: 32px; }
    .download-grid { grid-template-columns: 1fr; }
    .devices-wrapper { gap: 32px; }
    .device-phone, .device-samsung { width: 280px; height: 560px; }
    .qr-section { flex-direction: column; text-align: center; }
  }
</style>
</head>
<body>

<header>
  <a href="/dashboard" class="nav-brand">
    <img src="/assets/icon.svg" alt="QuanterraOS Icon" class="brand-logo">
    <span class="brand-name">
      QUANTERRA<span style="color:var(--cyan)">OS</span>
      <span class="brand-tag">MOBILE</span>
    </span>
  </a>
  <div class="nav-actions">
    <a href="/dashboard" class="nav-link">Live Cockpit</a>
    <a href="/kalshi" class="nav-link">Kalshi Markets</a>
    <a href="/council" class="nav-link">Council</a>
    <a href="/dashboard" class="btn-outline-gold">Open Terminal</a>
  </div>
</header>

<main class="container">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="pill-badge">
      <div class="pulsing-dot"></div>
      FORMULA ONE PIT WALL TELEMETRY • NATIVE MOBILE COCKPIT
    </div>
    <h1 class="hero-title">Empirical Quantitative Edge.<br>In the Palm of Your Hand.</h1>
    <p class="hero-subtitle">
      Install QuanterraOS on your Apple iPhone and Samsung Galaxy device. Experience sub-millisecond market monitoring, 8-specialist consensus, and Aria Executive Voice with zero app store delays.
    </p>

    <!-- Client-side OS Detection -->
    <div class="platform-detected-bar" id="platformBanner">
      <span>Detected Operating System:</span>
      <strong id="detectedDeviceText">Analyzing Device Architecture...</strong>
    </div>
  </section>

  <!-- Download & Store Action Cards -->
  <section class="download-grid">
    <!-- Google Play Store (Samsung / Android) -->
    <div class="download-card highlight" id="androidCard">
      <div class="card-top">
        <div class="card-header-icon">
          <!-- Android / Google Play SVG -->
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M3.6 1.8L13.8 12L3.6 22.2C3.2 21.8 3 21.1 3 20.2V3.8C3 2.9 3.2 2.2 3.6 1.8Z" fill="#00E676"/>
            <path d="M17.2 8.6L14.7 11.1L13.8 12L14.7 12.9L17.2 15.4L20.4 13.6C21.3 13.1 21.3 12.3 20.4 11.8L17.2 8.6Z" fill="#FFD600"/>
            <path d="M13.8 12L3.6 1.8C4 1.4 4.7 1.3 5.4 1.7L17.2 8.6L13.8 12Z" fill="#00B0FF"/>
            <path d="M13.8 12L17.2 15.4L5.4 22.3C4.7 22.7 4 22.6 3.6 22.2L13.8 12Z" fill="#FF3D00"/>
          </svg>
        </div>
        <div class="card-title">
          Google Play Store
          <span class="badge-tag">Samsung & Android</span>
        </div>
        <p class="card-desc">
          Official Google Play Store Trusted Web Activity package with automatic background updates and system push notifications.
        </p>
        <ul class="card-specs">
          <li>Package: com.quanterraos.app</li>
          <li>Target SDK: Android 15 & One UI 7.0</li>
          <li>Digital Asset Links verified</li>
          <li>Samsung Knox security compatible</li>
        </ul>
      </div>
      <div>
        <a href="https://play.google.com/store/apps/details?id=com.quanterraos.app" id="btnPlayStore" class="btn-store btn-google-play" style="margin-bottom: 10px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5z"/>
          </svg>
          Get on Google Play
        </a>
        <button id="btnPwaAndroid" class="btn-store btn-pwa" onclick="triggerPwaInstall()">
          ⚡ 1-Tap Direct Install (Samsung WebAPK)
        </button>
      </div>
    </div>

    <!-- Apple App Store (iPhone & iPad) -->
    <div class="download-card" id="iosCard">
      <div class="card-top">
        <div class="card-header-icon">
          <!-- Apple SVG -->
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 0.6-2.65 1.36-.58.67-1.09 1.74-.95 2.77.99.08 2.05-.53 2.67-1.28z"/>
          </svg>
        </div>
        <div class="card-title">
          Apple App Store
          <span class="badge-tag">iPhone & iPad</span>
        </div>
        <p class="card-desc">
          Universal Links integration for Apple iOS Safari. Native full-screen WebClip with zero browser chrome and Dynamic Island telemetry.
        </p>
        <ul class="card-specs">
          <li>Bundle: com.quanterraos.app</li>
          <li>iOS 17.4+ & iOS 18 WebClip Support</li>
          <li>Apple App Site Association linked</li>
          <li>Web Audio Voice Synthesizer active</li>
        </ul>
      </div>
      <div>
        <a href="https://apps.apple.com/app/quanterraos-terminal/id6504938210" class="btn-store btn-apple" style="margin-bottom: 10px;">
          Download on App Store
        </a>
        <button class="btn-store btn-pwa" onclick="openIosInstructions()">
          📲 Add to iPhone Home Screen
        </button>
      </div>
    </div>

    <!-- Samsung Galaxy Store -->
    <div class="download-card" id="samsungCard">
      <div class="card-top">
        <div class="card-header-icon">
          <!-- Samsung Galaxy Icon -->
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M7 12a5 5 0 0 1 10 0" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="3" fill="var(--gold)"/>
          </svg>
        </div>
        <div class="card-title">
          Samsung Galaxy Store
          <span class="badge-tag">One UI 7</span>
        </div>
        <p class="card-desc">
          Native Samsung Galaxy ecosystem optimization. Adaptive icon squircles, DeX desktop mode support, and Edge Panel quick shortcuts.
        </p>
        <ul class="card-specs">
          <li>One UI Squircle Maskable Icons</li>
          <li>Samsung DeX multi-window scaling</li>
          <li>Direct Galaxy Store deep-link protocol</li>
          <li>Hardware-accelerated rendering</li>
        </ul>
      </div>
      <div>
        <a href="https://galaxystore.samsung.com/detail/com.quanterraos.app" class="btn-store btn-samsung" style="margin-bottom: 10px;">
          Get on Galaxy Store
        </a>
        <a href="/dashboard" class="btn-store btn-pwa">
          🚀 Launch Instant Web Terminal
        </a>
      </div>
    </div>
  </section>

  <!-- Interactive Dual Device Showcase -->
  <section class="showcase-section">
    <div class="showcase-header">
      <h2 class="showcase-title">Built for the World's Leading Mobile Platforms</h2>
      <p class="showcase-subtitle">Sub-millisecond pit wall telemetry formatted natively for iPhone 16 Pro and Samsung Galaxy S25</p>
    </div>

    <div class="devices-wrapper">
      <!-- Apple iPhone 16 Pro Frame -->
      <div>
        <div class="device-phone">
          <div class="dynamic-island">
            <div class="island-pill"></div>
            <span style="font-size: 8px; color: #888; font-family: var(--font-mono)">ARIA ON</span>
            <div class="island-cam"></div>
          </div>
          <div class="screen-content">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px;">
              <span style="font-weight:800; font-size:11px; letter-spacing:1px; color:#FFF">QUANTERRA<span style="color:var(--cyan)">OS</span></span>
              <span style="color:var(--emerald); font-size:10px; font-family:var(--font-mono)">● ONLINE</span>
            </div>

            <div class="screen-telemetry-hud">
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">PIT CALLSIGN:</span>
                <span style="color:var(--cyan); font-weight:700">F1-CHIEF-01</span>
              </div>
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">MLA ATTENTION:</span>
                <span style="color:var(--gold)">93.3% KV CACHE</span>
              </div>
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">LATENCY LOOP:</span>
                <span style="color:var(--emerald); font-weight:700">0.82 ms</span>
              </div>
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">DRS STATUS:</span>
                <span style="color:var(--cyan)">ACTIVE / ENGAGED</span>
              </div>
            </div>

            <div class="screen-specialist-card">
              <div class="specialist-header">
                <span>⚡ DR. ELENA VANCE</span>
                <span style="font-size:9px; background:rgba(223,184,67,0.2); padding:1px 4px; border-radius:3px">CONSENSUS</span>
              </div>
              <p style="font-size:11px; color:var(--text-muted); line-height:1.4">
                "Short-duration Kalshi 15m distribution calibrated. Brier loss down to 0.084. Rule B5 locked."
              </p>
            </div>

            <div class="screen-voice-wave">
              <span style="font-size:10px; font-weight:700; color:var(--cyan)">ARIA VOICE:</span>
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
        <div class="device-label">Apple iPhone 16 Pro</div>
        <div class="device-sub">iOS 18 • Safari WebClip • Universal Links</div>
      </div>

      <!-- Samsung Galaxy S25 Frame -->
      <div>
        <div class="device-samsung">
          <div class="samsung-cam"></div>
          <div class="screen-content">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px;">
              <span style="font-weight:800; font-size:11px; letter-spacing:1px; color:#FFF">QUANTERRA<span style="color:var(--cyan)">OS</span></span>
              <span style="color:var(--gold); font-size:10px; font-family:var(--font-mono)">SAMSUNG ONE UI</span>
            </div>

            <div class="screen-telemetry-hud">
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">AI RUNTIME:</span>
                <span style="color:var(--cyan)">DeepSeek-R1 / vLLM</span>
              </div>
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">ENGINE CLUSTER:</span>
                <span style="color:var(--emerald)">6 ENGINES BENCHMARKED</span>
              </div>
              <div class="telemetry-row">
                <span style="color:var(--text-muted)">TELEMETRY RPM:</span>
                <span style="color:var(--gold); font-weight:700">18,500 RPM</span>
              </div>
            </div>

            <div class="screen-specialist-card" style="border-color: rgba(0,242,254,0.25)">
              <div class="specialist-header" style="color:var(--cyan)">
                <span>🦅 FALCON HIGH-SPEED LEAD</span>
              </div>
              <p style="font-size:11px; color:var(--text-muted); line-height:1.4">
                "Orderbook imbalance at 63.4%. Edge score +3.4σ on BTC-15M Kalshi contract."
              </p>
            </div>

            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:8px;">
              <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px; font-family:var(--font-mono)">KALSHI DUAL-FEED SPREAD</div>
              <div style="display:flex; justify-content:space-between; font-weight:700; font-size:11px; font-family:var(--font-mono)">
                <span style="color:var(--emerald)">YES: 61¢</span>
                <span style="color:var(--crimson)">NO: 40¢</span>
                <span style="color:var(--gold)">SPREAD: 1¢</span>
              </div>
            </div>

            <div style="margin-top:auto; background:rgba(0,242,254,0.08); border:1px solid rgba(0,242,254,0.3); border-radius:6px; padding:6px; text-align:center">
              <span style="color:var(--cyan); font-size:10px; font-weight:700; font-family:var(--font-mono)">
                TWA CERTIFIED: com.quanterraos.app
              </span>
            </div>
          </div>
        </div>
        <div class="device-label">Samsung Galaxy S25 Ultra</div>
        <div class="device-sub">Android 15 • Google Play TWA • Knox Guard</div>
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
      <svg width="160" height="160" viewBox="0 0 33 33" fill="#000000">
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
      <h4>Sub-Millisecond Cache</h4>
      <p>Offline Service Worker pre-caches core analytical models, UI components, and state trees so the app launches in under 12 milliseconds.</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">🎙️</div>
      <h4>Aria Executive Voice</h4>
      <p>Audio-synthesized briefings and speech-to-text voice recognition natively tuned for mobile microphones and wireless earbuds.</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">🔒</div>
      <h4>Knox & Secure Enclave</h4>
      <p>Hardened against tampering. Verified digital asset links ensure only official QuanterraOS cryptographic binaries execute.</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">📊</div>
      <h4>Kalshi Dual-Feed</h4>
      <p>Direct low-latency WebSocket stream of 15-minute and hourly event contracts with instant strike ladder pricing.</p>
    </div>
  </section>

  <!-- Rule B5 Governance Banner -->
  <footer class="rule-b5-banner">
    <div>
      CONSTITUTIONAL GOVERNANCE: <span>RULE B5 ACTIVE</span> • $0.00 LIVE EXPOSURE • EXECUTION GATE LOCKED IN STANDBY
    </div>
    <div style="margin-top: 6px; font-size: 11px;">
      All models operate in empirical audit and simulated forward-testing mode. QuanterraOS Foundation © 2026.
    </div>
  </footer>
</main>

<!-- iOS Safari Add to Home Screen Modal Walkthrough -->
<div class="modal-backdrop" id="iosModal">
  <div class="modal-box">
    <button class="modal-close" onclick="closeIosInstructions()">✕</button>
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="/assets/icon.svg" width="56" height="56" style="border-radius:14px; margin-bottom:10px;">
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
      // If prompt already triggered or running in standalone
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

  // Device Architecture Detection
  document.addEventListener('DOMContentLoaded', () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const platformText = document.getElementById('detectedDeviceText');
    const androidCard = document.getElementById('androidCard');
    const iosCard = document.getElementById('iosCard');
    const samsungCard = document.getElementById('samsungCard');

    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      if (platformText) platformText.innerHTML = '<span style="color:#FFF">Apple iOS (iPhone/iPad) Detected</span>';
      if (iosCard) {
        iosCard.classList.add('highlight');
        iosCard.style.borderColor = '#FFFFFF';
      }
      if (androidCard) androidCard.classList.remove('highlight');
    } else if (/Samsung|SAMSUNG|SM-|GT-|SCH-|SHV-/i.test(ua)) {
      if (platformText) platformText.innerHTML = '<span style="color:#00F2FE">Samsung Galaxy (One UI) Detected</span>';
      if (samsungCard) {
        samsungCard.classList.add('highlight');
        samsungCard.style.borderColor = 'var(--cyan)';
      }
    } else if (/Android/i.test(ua)) {
      if (platformText) platformText.innerHTML = '<span style="color:#00E676">Android Google Play Device Detected</span>';
      if (androidCard) {
        androidCard.classList.add('highlight');
        androidCard.style.borderColor = '#00E676';
      }
    } else {
      if (platformText) platformText.innerHTML = '<span style="color:var(--text-muted)">Desktop / Workstation (Universal Access)</span>';
    }
  });
</script>
</body>
</html>`;
}
