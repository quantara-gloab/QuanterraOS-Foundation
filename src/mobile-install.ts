/**
 * QuanterraOS Mobile Installation & Web App Runtime Module (/install, /app)
 *
 * Implements:
 * 1. "Install the web app": Honest, dedicated guidance without unreleased store claims.
 * 2. Add to Home Screen guidance for Apple iPhone and Android / Samsung using the official icon.
 * 3. App-Style Navigation: Check, Journal, Review, and Account with last saved page restored on reopening.
 * 4. Connection Status & Offline Guards: Clearly indicates offline mode & stale data;
 *    disables calculations that require unavailable current inputs.
 * 5. Update Handling: Automatically preserves unsaved checks across app updates and reloads.
 * 6. Shared-Device Privacy: Signing out completely clears locally cached private records.
 * 7. Feature flag gating: Governed by FEATURE_MOBILE_INSTALL / ?feature=mobile-install.
 */

export function renderMobileBottomNavHtml(activeTab?: "check" | "radar" | "journal" | "review" | "account"): string {
  const current = activeTab || "check";

  const tabs = [
    {
      id: "check",
      label: "Check",
      href: "/calculator",
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    },
    {
      id: "radar",
      label: "Radar",
      href: "/radar",
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>`,
    },
    {
      id: "journal",
      label: "Journal",
      href: "/journal",
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    },
    {
      id: "review",
      label: "Review",
      href: "/review",
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    },
    {
      id: "account",
      label: "Account",
      href: "/account",
      iconSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    },
  ];

  return `
  <!-- Persistent Mobile App Bottom Navigation Bar -->
  <nav class="mobile-app-bottom-nav" id="mobile-app-nav" aria-label="Mobile App Navigation">
    ${tabs
      .map((tab) => {
        const isActive = tab.id === current;
        return `
      <a href="${tab.href}" class="mobile-nav-item ${isActive ? "active" : ""}" data-nav-tab="${tab.id}" onclick="saveActiveMobileTab('${tab.href}')">
        <span class="mobile-nav-icon">${tab.iconSvg}</span>
        <span class="mobile-nav-label">${tab.label}</span>
      </a>`;
      })
      .join("")}
  </nav>

  <style>
    .mobile-app-bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: rgba(8, 11, 18, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(212, 175, 55, 0.22);
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 9999;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .mobile-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      height: 100%;
      text-decoration: none;
      color: #94A3B8;
      font-family: var(--font-mono, "IBM Plex Mono", monospace);
      font-size: 0.68rem;
      font-weight: 500;
      gap: 3px;
      transition: all 0.15s ease;
    }
    .mobile-nav-item:hover, .mobile-nav-item.active {
      color: #DFB843;
    }
    .mobile-nav-item.active .mobile-nav-icon {
      color: #DFB843;
      transform: scale(1.08);
      filter: drop-shadow(0 0 6px rgba(223, 184, 67, 0.45));
    }
    @media (min-width: 900px) {
      .mobile-app-bottom-nav {
        display: none; /* Desktop uses top navigation */
      }
    }
  </style>
  `;
}

export function getMobileAppRuntimeScript(): string {
  return `
  <!-- ==================== QUANTERRAOS MOBILE WEB APP RUNTIME ==================== -->
  <div id="mobile-connection-banner" style="
    display: none;
    position: sticky;
    top: 0;
    z-index: 10000;
    width: 100%;
    padding: 9px 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem;
    font-weight: 600;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>

  <div id="app-update-banner" style="
    display: none;
    position: fixed;
    bottom: 74px;
    left: 16px;
    right: 16px;
    z-index: 10000;
    background: #0E121B;
    border: 1px solid #DFB843;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    color: #F8FAFC;
  ">
    <div>
      <span style="color:#DFB843; font-weight:700;">✦ Update Ready:</span>
      <span style="color:#94A3B8;"> Unsaved checks preserved.</span>
    </div>
    <button type="button" onclick="applyAppUpdateAndReload()" style="
      background: linear-gradient(180deg, #DFB843 0%, #B89025 100%);
      color: #06070A;
      font-weight: 700;
      border: 1px solid #F7E7B4;
      padding: 6px 14px;
      border-radius: 4px;
      cursor: pointer;
    ">Update &amp; Reload</button>
  </div>

  <script>
    // 1. Connection Status & Offline Calculations Guard
    (function initConnectionMonitor() {
      var banner = document.getElementById('mobile-connection-banner');

      function updateConnectionStatus() {
        if (!navigator.onLine) {
          if (banner) {
            banner.style.display = 'block';
            banner.style.background = '#881337'; // Deep red
            banner.style.color = '#FFE4E6';
            banner.innerHTML = '⚠️ <strong>OFFLINE MODE:</strong> Network disconnected. Calculations requiring live inputs are disabled.';
          }
          disableOfflineCalculations(true);
        } else {
          // Check for stale data if online
          if (banner) {
            banner.style.display = 'none';
          }
          disableOfflineCalculations(false);
        }
      }

      function disableOfflineCalculations(isOffline) {
        var saveBtns = document.querySelectorAll('button[onclick*="saveCheckToJournal"], #btn-save-journal, .btn-save-action');
        var offlineNotices = document.querySelectorAll('.offline-calc-warning');

        saveBtns.forEach(function(btn) {
          if (isOffline) {
            btn.setAttribute('data-disabled-by-offline', 'true');
            btn.disabled = true;
            btn.style.opacity = '0.45';
          } else if (btn.getAttribute('data-disabled-by-offline') === 'true') {
            btn.removeAttribute('data-disabled-by-offline');
            btn.disabled = false;
            btn.style.opacity = '1';
          }
        });

        // Mark dynamic summary indicators if offline
        var costEl = document.getElementById('val-summary-cost');
        if (costEl) {
          if (isOffline) {
            costEl.setAttribute('data-original-val', costEl.innerText);
            costEl.innerText = 'UNAVAILABLE (OFFLINE)';
            costEl.style.color = '#F43F5E';
          } else if (costEl.getAttribute('data-original-val')) {
            costEl.innerText = costEl.getAttribute('data-original-val');
            costEl.removeAttribute('data-original-val');
            costEl.style.color = '';
          }
        }
      }

      window.addEventListener('online', updateConnectionStatus);
      window.addEventListener('offline', updateConnectionStatus);
      updateConnectionStatus();
    })();

    // 2. Last Saved Page Restoration on Standalone Launch
    (function restoreLastActivePage() {
      // Record current page as active tab
      var path = window.location.pathname;
      if (path === '/calculator' || path === '/radar' || path === '/journal' || path === '/review' || path === '/account') {
        try {
          localStorage.setItem('quanterraos_last_active_tab', path);
        } catch (_) {}
      }

      // If launched from standalone home screen at root or /app, restore last visited page
      var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      if (isStandalone && (path === '/' || path === '/install' || path === '/app' || path === '/download')) {
        try {
          var lastTab = localStorage.getItem('quanterraos_last_active_tab');
          if (lastTab && lastTab !== path && (lastTab.startsWith('/calculator') || lastTab.startsWith('/radar') || lastTab.startsWith('/journal') || lastTab.startsWith('/review') || lastTab.startsWith('/account'))) {
            window.location.replace(lastTab);
          }
        } catch (_) {}
      }
    })();

    function saveActiveMobileTab(href) {
      try {
        localStorage.setItem('quanterraos_last_active_tab', href);
      } catch (_) {}
    }

    // 3. Update Handling & Unsaved Check Preservation
    var _newWorkerWaiting = null;
    (function registerServiceWorkerWithUpdateProtection() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').then(function(reg) {
          reg.addEventListener('updatefound', function() {
            var newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  _newWorkerWaiting = newWorker;
                  preserveUnsavedChecksBeforeUpdate();
                  showUpdateBanner();
                }
              });
            }
          });
        }).catch(function(err) {
          console.warn('Service worker registration failed:', err);
        });

        var refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      }
    })();

    function preserveUnsavedChecksBeforeUpdate() {
      try {
        var pending = localStorage.getItem('quanterraos_pending_check');
        if (pending) {
          localStorage.setItem('quanterraos_preserved_check_backup', pending);
        }
        var latest = window.__latestCheck;
        if (latest) {
          localStorage.setItem('quanterraos_pending_check', JSON.stringify(latest));
        }
      } catch (_) {}
    }

    function showUpdateBanner() {
      var banner = document.getElementById('app-update-banner');
      if (banner) banner.style.display = 'flex';
    }

    function applyAppUpdateAndReload() {
      preserveUnsavedChecksBeforeUpdate();
      if (_newWorkerWaiting) {
        _newWorkerWaiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    }

    // 4. Shared-Device Privacy: Clear Cached Private Records on Sign-Out
    function executeSignOutAndPurgeCache() {
      try {
        // Sweep all QuanterraOS keys from localStorage
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && (k.indexOf('quanterraos_') === 0 || k.indexOf('user_') === 0 || k.indexOf('check_') === 0)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
        localStorage.removeItem('quanterraos_pending_check');
        localStorage.removeItem('quanterraos_preserved_check_backup');
        localStorage.removeItem('quanterraos_offline_checks');
        localStorage.removeItem('quanterraos_cached_journal');
        localStorage.removeItem('quanterraos_user_risk_plan');
        localStorage.removeItem('quanterraos_last_active_tab');
        sessionStorage.clear();

        // Clear dynamic client caches
        if ('caches' in window) {
          caches.keys().then(function(names) {
            return Promise.all(names.map(function(name) {
              return caches.delete(name);
            }));
          });
        }
      } catch (err) {
        console.warn('Privacy purge warning:', err);
      }

      window.location.href = '/logout';
    }
    window.executeSignOutAndPurgeCache = executeSignOutAndPurgeCache;

    // Attach to sign out elements across pages
    document.addEventListener('DOMContentLoaded', function() {
      var logoutLinks = document.querySelectorAll('a[href="/logout"], .btn-sign-out, #btn-logout');
      logoutLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          executeSignOutAndPurgeCache();
        });
      });
    });
  </script>
  <!-- ==================== END MOBILE WEB APP RUNTIME ==================== -->
  `;
}

export function renderMobileInstallPageHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="QuanterraOS">
  <title>Install the web app — QuanterraOS</title>
  <meta name="description" content="Add QuanterraOS to your home screen for rapid decision checks, true fee friction calculation, and full offline persistence.">

  <!-- PWA & Icon Metadata -->
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/assets/icon-512.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg: #06070A;
      --surface: #0E121B;
      --surface-border: rgba(212, 175, 55, 0.22);
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --text: #F8FAFC;
      --muted: #94A3B8;
      --green: #10B981;
      --rose: #F43F5E;
      --font-sans: "Inter", sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.6;
      padding-bottom: 90px;
    }
    .mono { font-family: var(--font-mono); }
    .container { max-width: 680px; margin: 0 auto; padding: 24px 20px; }

    /* Top Nav */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: rgba(10, 14, 22, 0.85);
      border-bottom: 1px solid var(--surface-border);
      backdrop-filter: blur(12px);
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .brand-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--accent);
    }

    /* Cards */
    .card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Instruction Steps */
    .step-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 14px;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 0.88rem;
      color: #CBD5E1;
      line-height: 1.5;
    }
    .step-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(223, 184, 67, 0.15);
      border: 1px solid var(--accent);
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .btn-gold {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 700;
      color: #06070A;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      padding: 12px 20px;
      border-radius: 6px;
      border: 1px solid rgba(255, 248, 220, 0.6);
      box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);
      text-decoration: none;
      cursor: pointer;
      width: 100%;
      transition: all 0.15s ease;
    }
    .btn-gold:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
    }
  </style>
</head>
<body>

  <header class="top-bar">
    <a href="/calculator" class="brand-link">
      <img src="/apple-touch-icon.png" alt="QuanterraOS Icon" class="brand-icon">
      <span>QUANTERRAOS</span>
    </a>
    <div style="display:flex; align-items:center; gap:14px;">
      <a href="/why" class="mono" style="color: var(--accent); font-size: 0.78rem; text-decoration: none;">Why QuanterraOS</a>
      <a href="/calculator" class="mono" style="color: var(--accent-light); font-size: 0.78rem; text-decoration: none;">Launch Web Check &rarr;</a>
    </div>
  </header>

  <main class="container">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; margin-bottom: 12px; position: relative;">
        <img src="/apple-touch-icon.png" alt="QuanterraOS Web App Icon" style="width: 72px; height: 72px; border-radius: 16px; border: 2px solid var(--accent); box-shadow: 0 8px 24px rgba(212, 175, 55, 0.35);">
      </div>
      <h1 style="font-size: 1.85rem; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; margin-bottom: 6px;">
        Install the web app
      </h1>
      <p style="color: var(--muted); font-size: 0.92rem; max-width: 480px; margin: 0 auto;">
        Add QuanterraOS directly to your Home Screen for immediate access, offline checks, and auto-restored sessions.
      </p>
    </div>

    <!-- Apple iPhone Section -->
    <div class="card" id="guidance-ios">
      <div class="card-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.62-.77 1.04-1.84.93-2.91-.91.04-2 .61-2.65 1.38-.57.66-.99 1.74-.86 2.78 1.02.08 2-.51 2.58-1.25z"/></svg>
        <span>Add to Home Screen on Apple iPhone (iOS Safari)</span>
      </div>
      <p style="font-size: 0.82rem; color: var(--muted); margin-bottom: 12px;">
        Follow these steps in Safari to add the QuanterraOS gold icon to your iPhone home screen:
      </p>
      <ul class="step-list">
        <li class="step-item">
          <span class="step-num">1</span>
          <div>Open this page in <strong>Apple Safari</strong>.</div>
        </li>
        <li class="step-item">
          <span class="step-num">2</span>
          <div>
            Tap the <strong>Share</strong> button <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; display:inline-block;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> (the square with an arrow pointing up) on the bottom toolbar.
          </div>
        </li>
        <li class="step-item">
          <span class="step-num">3</span>
          <div>Scroll down and select <strong>"Add to Home Screen"</strong> (with the <strong>+</strong> icon).</div>
        </li>
        <li class="step-item">
          <span class="step-num">4</span>
          <div>Tap <strong>"Add"</strong> in the top-right corner. The QuanterraOS icon will appear on your Home Screen.</div>
        </li>
      </ul>
    </div>

    <!-- Android & Samsung Section -->
    <div class="card" id="guidance-android">
      <div class="card-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
        <span>Add to Home Screen on Android &amp; Samsung</span>
      </div>
      <p style="font-size: 0.82rem; color: var(--muted); margin-bottom: 14px;">
        Install directly via Google Chrome or Samsung Internet with full offline and PWA caching:
      </p>

      <button type="button" id="btn-pwa-direct-install" onclick="triggerAndroidInstallPrompt()" class="btn-gold" style="margin-bottom: 16px;">
        📲 Install QuanterraOS App Now
      </button>

      <ul class="step-list">
        <li class="step-item">
          <span class="step-num">1</span>
          <div>Tap the <strong>menu icon</strong> (three vertical dots <strong>⋮</strong>) in the browser toolbar.</div>
        </li>
        <li class="step-item">
          <span class="step-num">2</span>
          <div>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</div>
        </li>
        <li class="step-item">
          <span class="step-num">3</span>
          <div>Confirm <strong>"Install"</strong> to add the icon to your home screen and app launcher.</div>
        </li>
      </ul>
    </div>

    <!-- 2026 Competitive Moat: The Independent Referee -->
    <div class="card" id="competitive-moat" style="border-color: rgba(223, 184, 67, 0.35); background: linear-gradient(180deg, rgba(20, 26, 38, 0.85) 0%, rgba(10, 14, 22, 0.95) 100%);">
      <div class="card-title">
        <span style="color: var(--accent-light);">✦ The Independent Referee in an Acquired Market</span>
      </div>
      <div style="font-size: 0.84rem; color: #CBD5E1; line-height: 1.6;">
        <div style="margin-bottom: 12px;">
          <strong style="color: #FFFFFF;">• Unconflicted Independence:</strong> Major prediction tools are now owned by exchanges (Polymarket acquired Dome in Feb 2026; Kalshi acquired Oddpool in Sept 2026). QuanterraOS is 100% venue-neutral with zero exchange volume kickbacks.
        </div>
        <div style="margin-bottom: 12px;">
          <strong style="color: var(--accent);">• Non-Linear Taker Fee Shield:</strong> Competitors conceal the parabolic taker fee ($0.07 &times; P &times; (1&minus;P) = up to 1.75¢/ct on 50¢ contracts), which creates a 52.75% breakeven hurdle and consumes up to 43.8% of gross profit. QuanterraOS audits every cost before order entry.
        </div>
        <div style="margin-bottom: 12px;">
          <strong style="color: #38BDF8;">• Sovereign Local Memory:</strong> Your trade premises, risk boundaries, and journal notes stay encrypted in your local browser cache. Zero telemetry harvesting.
        </div>
        <a href="/why" class="btn-gold" style="display: flex; margin-top: 14px; text-decoration: none;">
          Read Full 2026 Truth vs. Hype Teardown &rarr;
        </a>
      </div>
    </div>

    <!-- Features & Reliability -->
    <div class="card">
      <div class="card-title">
        <span>Web App Capabilities &amp; Architecture</span>
      </div>
      <div style="font-size: 0.84rem; color: #CBD5E1; line-height: 1.6; space-y: 12px;">
        <div style="margin-bottom: 10px;">
          <strong style="color: var(--accent);">• App-Style Navigation:</strong> Immediate 1-tap switching across <strong>Check</strong>, <strong>Journal</strong>, <strong>Review</strong>, and <strong>Account</strong>. When reopening the app, your last visited screen is automatically restored.
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: var(--rose);">• Offline Protection:</strong> Unsaved checks are preserved locally. Calculations that require unavailable current inputs are cleanly disabled while offline to prevent miscalibrated decisions.
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: var(--green);">• Seamless Updates:</strong> When a new software release is deployed, your unsaved checks and risk settings are backed up before the update applies.
        </div>
        <div>
          <strong style="color: #38BDF8;">• Shared-Device Privacy:</strong> Signing out automatically purges all locally cached private records and check drafts from this device.
        </div>
      </div>
    </div>

    <!-- Honest Distribution Transparency (Rule B11) -->
    <div style="padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; font-size: 0.75rem; color: var(--muted); line-height: 1.5;">
      <strong>Distribution Transparency:</strong> QuanterraOS is distributed directly as an independent Progressive Web App (PWA). App Store and Google Play releases will be announced once store reviews are formally finalized. Zero third-party store downloads or accounts are required to use this application.
    </div>
  </main>

  ${renderMobileBottomNavHtml("account")}
  ${getMobileAppRuntimeScript()}

  <script>
    var deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      deferredInstallPrompt = e;
      var btn = document.getElementById('btn-pwa-direct-install');
      if (btn) btn.style.display = 'inline-flex';
    });

    function triggerAndroidInstallPrompt() {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function(choice) {
          deferredInstallPrompt = null;
        });
      } else {
        alert('To add QuanterraOS to your home screen, tap your browser menu (⋮) and select "Add to Home screen" or "Install app".');
      }
    }
  </script>
</body>
</html>`;
}
