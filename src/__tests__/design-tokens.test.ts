import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getUnifiedDesignTokensCss } from '../styles/tokens.ts';

describe('Phase 3 Task 3.2 Acceptance: Design Tokens (Part 5) in One Stylesheet', () => {
  test('public/index.css contains Part 5 Tesla mode public tokens', () => {
    const css = getUnifiedDesignTokensCss();
    assert.ok(css.length > 500, 'Stylesheet must be populated');

    // Part 5 Tesla tokens
    assert.ok(css.includes('--bg: #000000'), 'Must define --bg: #000000');
    assert.ok(css.includes('--fg: #FFFFFF'), 'Must define --fg: #FFFFFF');
    assert.ok(css.includes('--muted: #8A8F98'), 'Must define --muted: #8A8F98');
    assert.ok(css.includes('--accent-gold: #C9A24A'), 'Must define --accent-gold: #C9A24A');

    // Font definitions
    assert.ok(css.includes('Inter'), 'Must include Inter sans font');
    assert.ok(css.includes('IBM Plex Mono') || css.includes('JetBrains Mono'), 'Must include monospace telemetry font');

    // Desktop/mobile headline clamp
    assert.ok(css.includes('--headline-hero: clamp('), 'Must define hero headline scale');
  });

  test('public/index.css contains Part 5 Flight Deck celestial mode tokens', () => {
    const css = getUnifiedDesignTokensCss();

    assert.ok(css.includes('--space-900: #05060B'), 'Must define --space-900');
    assert.ok(css.includes('--space-700: #0D1120'), 'Must define --space-700');
    assert.ok(css.includes('--hud-cyan: #4FD1E8'), 'Must define --hud-cyan');
    assert.ok(css.includes('--hud-gold: #C9A24A'), 'Must define --hud-gold');
    assert.ok(css.includes('--alert-red: #E5484D'), 'Must define --alert-red');
    assert.ok(css.includes('--ok-green: #30A46C'), 'Must define --ok-green');
    assert.ok(css.includes('--glass: rgba(255, 255, 255, 0.06)'), 'Must define --glass token');
    assert.ok(css.includes('--scanline-opacity: 0.02'), 'Must define scanline microtexture token');
  });

  test('public/index.css includes accessibility and reduced motion overrides', () => {
    const css = getUnifiedDesignTokensCss();

    assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Must support prefers-reduced-motion');
    assert.ok(css.includes('scroll-snap-align: start'), 'Must support full-viewport panels');
    assert.ok(css.includes('scroll-snap-type: y mandatory'), 'Must support scroll snapping');
  });
});
