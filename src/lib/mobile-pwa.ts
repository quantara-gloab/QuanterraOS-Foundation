/**
 * QuanterraOS Mobile PWA & Push Telemetry Engine
 * Implements Part 3.11 & Task 8.1:
 *
 * - PWA Manifest metadata & verification
 * - Offline shell and service worker registration
 * - Web Push subscription registry with non-advisory payload enforcement
 * - Install prompt UI helper (Celestial theme)
 *
 * Strict Compliance:
 * - Rule B4: Zero superlatives ("win", "winning", "guaranteed", "beat the market", "profit", "edge").
 * - Rule B5: $0.00 capital deployed; zero order routing.
 */

export interface WebPushSubscription {
  id: string;
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  userId?: string;
  deviceLabel?: string;
  subscribedAt: string;
  active: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url: string;
  category: "settlement_basis" | "fee_divergence" | "calibration_update" | "macro_calendar";
  timestamp: string;
}

// In-memory push subscription store
const PUSH_SUBSCRIPTIONS = new Map<string, WebPushSubscription>();

/**
 * Validates and records a client Web Push subscription.
 */
export function registerPushSubscription(input: {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
  userId?: string;
  deviceLabel?: string;
}): { success: boolean; subscription?: WebPushSubscription; message: string } {
  if (!input.endpoint || typeof input.endpoint !== "string" || !input.endpoint.startsWith("https://")) {
    return { success: false, message: "A secure HTTPS push endpoint is required." };
  }

  const id = `sub_${Buffer.from(input.endpoint).toString("base64url").slice(0, 16)}`;
  const sub: WebPushSubscription = {
    id,
    endpoint: input.endpoint,
    keys: input.keys,
    userId: input.userId || "anonymous_pilot",
    deviceLabel: input.deviceLabel || "Mobile PWA Client",
    subscribedAt: new Date().toISOString(),
    active: true
  };

  PUSH_SUBSCRIPTIONS.set(id, sub);

  return {
    success: true,
    subscription: sub,
    message: "Web Push notifications enabled for QuanterraOS Flight Deck alerts."
  };
}

export function getAllPushSubscriptions(): WebPushSubscription[] {
  return Array.from(PUSH_SUBSCRIPTIONS.values());
}

/**
 * Formats a non-advisory Web Push alert payload, strictly stripping banned superlatives.
 */
export function createSafePushAlert(params: {
  title?: string;
  body: string;
  url?: string;
  category?: PushNotificationPayload["category"];
}): PushNotificationPayload {
  let title = params.title || "QuanterraOS Flight Deck Telemetry";
  let body = params.body;

  // Strict Rule B4 Sanitization
  const bannedSuperlatives = /\b(win|winning|guaranteed|beat the market|profit|edge|sure thing)\b/gi;
  if (bannedSuperlatives.test(body)) {
    body = body.replace(bannedSuperlatives, "observed metric");
  }

  const targetUrl = params.url || "/deck";

  return {
    title,
    body,
    url: targetUrl,
    category: params.category || "settlement_basis",
    timestamp: new Date().toISOString()
  };
}

/**
 * Returns HTML snippet for the PWA Install Prompt component.
 * Features Celestial styling and auto-hiding when standalone.
 */
export function renderInstallPromptHtml(): string {
  return `
  <div id="pwa-install-banner" class="pwa-install-banner" style="display: none;">
    <div class="pwa-install-content">
      <div class="pwa-install-icon">
        <img src="/assets/icon-192.svg" alt="QuanterraOS" width="36" height="36" style="border-radius: 8px;">
      </div>
      <div class="pwa-install-text">
        <div class="pwa-install-title">Install QuanterraOS Flight Deck</div>
        <div class="pwa-install-sub">One-tap mobile access, settlement radar, and offline telemetry.</div>
      </div>
      <div class="pwa-install-actions">
        <button id="pwa-install-btn" type="button" class="pwa-btn-install">Install App</button>
        <button id="pwa-dismiss-btn" type="button" class="pwa-btn-dismiss" aria-label="Dismiss">&times;</button>
      </div>
    </div>
  </div>

  <style>
    .pwa-install-banner {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 32px);
      max-width: 480px;
      background: rgba(13, 17, 32, 0.95);
      border: 1px solid rgba(201, 162, 74, 0.4);
      border-radius: 12px;
      padding: 14px 18px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(12px);
      z-index: 9999;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp {
      from { transform: translate(-50%, 20px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .pwa-install-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .pwa-install-text {
      flex: 1;
      min-width: 0;
    }
    .pwa-install-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 2px;
    }
    .pwa-install-sub {
      font-size: 0.75rem;
      color: #94A3B8;
      line-height: 1.3;
    }
    .pwa-install-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pwa-btn-install {
      background: #C9A24A;
      color: #000000;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 8px 14px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    .pwa-btn-install:hover { opacity: 0.9; }
    .pwa-btn-dismiss {
      background: transparent;
      border: none;
      color: #64748B;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 4px;
    }
    .pwa-btn-dismiss:hover { color: #FFFFFF; }
  </style>

  <script>
    (function() {
      let deferredPrompt = null;
      const banner = document.getElementById('pwa-install-banner');
      const installBtn = document.getElementById('pwa-install-btn');
      const dismissBtn = document.getElementById('pwa-dismiss-btn');

      // Check if already in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      if (isStandalone) {
        return;
      }

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (banner && !sessionStorage.getItem('pwa_prompt_dismissed')) {
          banner.style.display = 'block';
        }
      });

      if (installBtn) {
        installBtn.addEventListener('click', async () => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] User response to install prompt:', outcome);
          deferredPrompt = null;
          if (banner) banner.style.display = 'none';
        });
      }

      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          if (banner) banner.style.display = 'none';
          sessionStorage.setItem('pwa_prompt_dismissed', 'true');
        });
      }

      // Register service worker if supported
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').catch((err) => {
          console.warn('[SW] Registration failed:', err);
        });
      }
    })();
  </script>
  `;
}
