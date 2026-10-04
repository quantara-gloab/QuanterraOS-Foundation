/**
 * Council Specialist Animated Schematic Line-Art Icons
 *
 * Adheres strictly to the QuanterraOS "High-Tech, Competitive" Visual Design Plan:
 * - Line-art only (1.5px stroke, no fill except accent dots)
 * - 3 tokens only: --text (#E8EAED), --accent (#4FD1C5), --warning (#C65D4A)
 * - Self-contained inline SVGs (48x48)
 * - One restrained animation per icon encoding the persona's functional role
 * - Strict prefers-reduced-motion media query guard
 */

export const SPECIALIST_ICONS_CSS = `
/* Shared Council Specialist Icons & Animations */
.council-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: block;
}

@media (prefers-reduced-motion: reduce) {
  .council-icon * { animation: none !important; }
}

/* 1. Falcon — Order-Book Depth Monitoring: sweeping horizontal scan line */
.falcon-scan { animation: falconScan 4s ease-in-out infinite; opacity: 0.8; }
@keyframes falconScan {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(28px); }
  100% { transform: translateY(0); }
}

/* 2. Quantum Fox — Quantitative Volatility Modeling: ear tips pulse faintly in teal */
.fox-pulse { animation: foxPulse 2.5s ease-in-out infinite; }
@keyframes foxPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* 3. Phoenix — Execution Readiness & Circuit Breaker Gate: slow breathing opacity on lock glyph */
.phoenix-lock { animation: phoenixBreathe 6s ease-in-out infinite; }
@keyframes phoenixBreathe {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* 4. Draco — Data Integrity: scale-row verification flash */
.draco-scale-check { animation: dracoCheck 3.5s ease-in-out infinite; }
@keyframes dracoCheck {
  0%, 75%, 100% { opacity: 0.35; stroke: var(--text); }
  85% { opacity: 1; stroke: var(--accent); }
}

/* 5. Wolf — Market Microstructure: tracking dot moving left-right across book */
.wolf-track { animation: wolfTrack 3s ease-in-out infinite; }
@keyframes wolfTrack {
  0%, 100% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
}

/* 6. Sentinel — Systems Monitoring: slow 5s radar line rotation */
.sentinel-sweep {
  transform-origin: 24px 24px;
  animation: sentinelSweep 5s linear infinite;
}
@keyframes sentinelSweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 7. Kraken — Risk Governance: containment boundary ring pulses gently */
.kraken-boundary { animation: krakenBoundary 4s ease-in-out infinite; }
@keyframes krakenBoundary {
  0%, 100% { opacity: 0.25; transform: scale(0.96); transform-origin: 24px 24px; }
  50% { opacity: 0.85; transform: scale(1.02); transform-origin: 24px 24px; }
}

/* 8. Lion — Calibration Synthesis: radiating mane lines synthesize in sync */
.lion-mane {
  transform-origin: 24px 24px;
  animation: lionSynthesize 3s ease-in-out infinite;
}
@keyframes lionSynthesize {
  0%, 100% { transform: scale(0.92); opacity: 0.6; }
  50% { transform: scale(1.06); opacity: 1; }
}
`;

export function renderSpecialistIcon(agentId: string): string {
  switch (agentId) {
    case "falcon":
      return `<svg class="council-icon" viewBox="0 0 48 48" width="48" height="48" aria-label="Falcon">
  <path d="M24 6 L34 18 L30 20 L24 14 L18 20 L14 18 Z" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <path d="M14 20 Q24 30 34 20 L30 36 L24 42 L18 36 Z" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <line class="falcon-scan" x1="10" y1="10" x2="38" y2="10" stroke="var(--accent)" stroke-width="1"/>
</svg>`;

    case "quantum-fox":
      return `<svg class="council-icon" viewBox="0 0 48 48" width="48" height="48" aria-label="Quantum Fox">
  <polygon points="24,8 30,2 32,14" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <polygon points="24,8 18,2 16,14" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <path d="M14 14 L24 10 L34 14 L30 32 L24 38 L18 32 Z" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <circle class="fox-pulse" cx="32" cy="4" r="1.5" fill="var(--accent)"/>
  <circle class="fox-pulse" cx="16" cy="4" r="1.5" fill="var(--accent)"/>
</svg>`;

    case "phoenix":
      return `<svg class="council-icon" viewBox="0 0 48 48" width="48" height="48" aria-label="Phoenix">
  <path d="M24 4 C30 10 34 18 34 26 C34 34 30 40 24 44 C18 40 14 34 14 26 C14 18 18 10 24 4 Z" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <rect x="18" y="20" width="12" height="10" rx="1" fill="none" stroke="var(--warning)" stroke-width="1.5" class="phoenix-lock"/>
  <circle cx="24" cy="25" r="1.5" fill="var(--warning)"/>
</svg>`;

    case "draco":
      return `<svg class="council-icon" viewBox="0 0 48 48" width="48" height="48" aria-label="Draco">
  <path d="M14 14 L24 6 L34 14 L34 28 L24 42 L14 28 Z" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <polyline points="18,18 24,23 30,18" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <polyline class="draco-scale-check" points="18,26 24,31 30,26" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
  <circle cx="24" cy="36" r="1.5" fill="var(--accent)"/>
</svg>`;

    case "wolf":
      return `<svg class="council-icon" viewBox="0 0 48 48" width="48" height="48" aria-label="Wolf">
  <polygon points="12,12 18,4 22,14" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <polygon points="26,14 30,4 36,12" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <path d="M12 14 L24 20 L36 14 L38 28 L24 40 L10 28 Z" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <line x1="16" y1="24" x2="32" y2="24" stroke="rgba(232, 234, 237, 0.2)" stroke-width="1" stroke-dasharray="2 2"/>
  <circle class="wolf-track" cx="24" cy="24" r="1.5" fill="var(--accent)"/>
</svg>`;

    case "sentinel":
      return `<svg class="council-icon" viewBox="0 0 48 48" width="48" height="48" aria-label="Sentinel">
  <circle cx="24" cy="24" r="16" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <circle cx="24" cy="24" r="8" fill="none" stroke="rgba(232, 234, 237, 0.25)" stroke-width="1"/>
  <line class="sentinel-sweep" x1="24" y1="24" x2="24" y2="8" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="24" cy="24" r="2" fill="var(--text)"/>
</svg>`;

    case "kraken":
      return `<svg class="council-icon" viewBox="0 0 48 48" width="48" height="48" aria-label="Kraken">
  <circle class="kraken-boundary" cx="24" cy="24" r="18" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M16 22 C16 14 32 14 32 22 C32 28 28 32 28 36" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <path d="M20 22 C20 28 24 32 24 38" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <path d="M28 22 C28 28 20 32 20 36" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <circle cx="24" cy="18" r="1.5" fill="var(--text)"/>
</svg>`;

    case "lion":
      return `<svg class="council-icon" viewBox="0 0 48 48" width="48" height="48" aria-label="Lion">
  <polygon points="24,18 29,26 24,32 19,26" fill="none" stroke="var(--text)" stroke-width="1.5"/>
  <circle cx="24" cy="24" r="2" fill="var(--accent)"/>
  <g class="lion-mane">
    <line x1="24" y1="12" x2="24" y2="7" stroke="var(--text)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="33" y1="16" x2="37" y2="12" stroke="var(--text)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="24" x2="41" y2="24" stroke="var(--text)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="33" y1="32" x2="37" y2="36" stroke="var(--text)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="24" y1="36" x2="24" y2="41" stroke="var(--text)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="15" y1="32" x2="11" y2="36" stroke="var(--text)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="24" x2="7" y2="24" stroke="var(--text)" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="15" y1="16" x2="11" y2="12" stroke="var(--text)" stroke-width="1.5" stroke-linecap="round"/>
  </g>
</svg>`;

    default:
      return "";
  }
}

export const SPECIALIST_ICONS_MAP: Record<string, string> = {
  draco: renderSpecialistIcon("draco"),
  wolf: renderSpecialistIcon("wolf"),
  falcon: renderSpecialistIcon("falcon"),
  "quantum-fox": renderSpecialistIcon("quantum-fox"),
  sentinel: renderSpecialistIcon("sentinel"),
  kraken: renderSpecialistIcon("kraken"),
  lion: renderSpecialistIcon("lion"),
  phoenix: renderSpecialistIcon("phoenix"),
};

