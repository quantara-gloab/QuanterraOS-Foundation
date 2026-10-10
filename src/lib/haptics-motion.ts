/**
 * QuanterraOS Haptics & Reduced-Motion Engine
 * Implements Part 3.11 & Task 8.3:
 *
 * - Mobile Web Vibration API micro-feedback for gauges, sliders, tabs, and alerts
 * - Strict adherence to WCAG AA and prefers-reduced-motion accessibility
 * - User-configurable haptics toggle with localStorage persistence
 *
 * Strict Compliance:
 * - Rule B4: Zero superlatives ("win", "guaranteed").
 * - Rule B5: $0.00 live capital exposure; zero order routing.
 */

export type HapticType = "light" | "medium" | "warning" | "success" | "selection";

export interface HapticPatternConfig {
  type: HapticType;
  pattern: number | number[];
  description: string;
}

export const HAPTIC_PATTERNS: Record<HapticType, HapticPatternConfig> = {
  light: {
    type: "light",
    pattern: 10,
    description: "10ms subtle tick for station switching, buttons, and navigation"
  },
  medium: {
    type: "medium",
    pattern: 25,
    description: "25ms bump for slider snap points and pre-flight check confirmations"
  },
  warning: {
    type: "warning",
    pattern: [40, 40, 40],
    description: "40ms triple-pulse for coin-flip hazard zone entry, hull integrity <30%, and tilt alerts"
  },
  success: {
    type: "success",
    pattern: [20, 50, 30],
    description: "Multi-pulse confirmation for thesis logged, calibration review submitted, and rank up"
  },
  selection: {
    type: "selection",
    pattern: 8,
    description: "8ms ultra-light tactile tick for slider increments and toggles"
  }
};

/**
 * Validates if the given pattern is a valid vibration duration or array.
 */
export function validateHapticPattern(pattern: number | number[]): boolean {
  if (typeof pattern === "number") {
    return pattern >= 0 && pattern <= 1000;
  }
  if (Array.isArray(pattern)) {
    return pattern.length > 0 && pattern.length <= 10 && pattern.every((p) => typeof p === "number" && p >= 0 && p <= 1000);
  }
  return false;
}

/**
 * Returns CSS styles enforcing prefers-reduced-motion across Flight Deck and cockpit surfaces.
 */
export const REDUCED_MOTION_CSS = `
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  .hud-starfield-canvas,
  .scanline-overlay,
  .pulse-dot,
  .radar-sweep,
  .deck-nav-pill {
    animation: none !important;
    transition: none !important;
  }
  .station-panel {
    transition: none !important;
  }
}
`;

/**
 * Standalone client JavaScript injected into the Flight Deck cockpit.
 * Provides window.QOSHaptics and coordinates motion preference listening.
 */
export const HAPTICS_AND_MOTION_CLIENT_SCRIPT = `
(function() {
  const HAPTICS_STORAGE_KEY = 'quanterraos_haptics_enabled';

  function isHapticsAllowed() {
    // Respect user setting (default true)
    const stored = localStorage.getItem(HAPTICS_STORAGE_KEY);
    if (stored === 'false') return false;

    // Respect system reduced-motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }

    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  function triggerVibrate(pattern) {
    if (!isHapticsAllowed()) return false;
    try {
      return navigator.vibrate(pattern);
    } catch (_) {
      return false;
    }
  }

  window.QOSHaptics = {
    light: function() { return triggerVibrate(10); },
    medium: function() { return triggerVibrate(25); },
    warning: function() { return triggerVibrate([40, 40, 40]); },
    success: function() { return triggerVibrate([20, 50, 30]); },
    selection: function() { return triggerVibrate(8); },
    isSupported: function() { return typeof navigator !== 'undefined' && 'vibrate' in navigator; },
    isEnabled: function() { return localStorage.getItem(HAPTICS_STORAGE_KEY) !== 'false'; },
    setEnabled: function(val) {
      localStorage.setItem(HAPTICS_STORAGE_KEY, val ? 'true' : 'false');
      const toggle = document.getElementById('setting-haptics-toggle');
      if (toggle) toggle.checked = val;
    }
  };

  // Attach haptics to station navigation and slider interactions
  document.addEventListener('DOMContentLoaded', function() {
    // Nav buttons
    document.querySelectorAll('.deck-nav-item, .deck-mobile-tab').forEach(function(el) {
      el.addEventListener('click', function() {
        window.QOSHaptics.light();
      });
    });

    // Sliders
    document.querySelectorAll('input[type="range"]').forEach(function(slider) {
      slider.addEventListener('input', function() {
        window.QOSHaptics.selection();
      });
    });

    // Sync Hangar haptics toggle if present
    const toggle = document.getElementById('setting-haptics-toggle');
    if (toggle) {
      toggle.checked = window.QOSHaptics.isEnabled();
      toggle.addEventListener('change', function(e) {
        window.QOSHaptics.setEnabled(e.target.checked);
        if (e.target.checked) window.QOSHaptics.success();
      });
    }

    // Listen for system motion preference changes
    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      motionQuery.addEventListener('change', function(e) {
        console.log('[A11y] prefers-reduced-motion changed:', e.matches);
        if (e.matches) {
          // Disable any running celebration canvas animations
          const confetti = document.getElementById('celebration-canvas');
          if (confetti) confetti.style.display = 'none';
        }
      });
    }
  });
})();
`;
