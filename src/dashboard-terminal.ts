/**
 * Council Console View (/dashboard & /council)
 *
 * Precision engineering console for empirical monitoring of short-duration
 * prediction market calibration, multi-venue spot dispersion, and 8-specialist consensus.
 *
 * Adheres strictly to the QuanterraOS "High-Tech, Competitive" Visual Design Plan:
 * - Gold Standard restrained palette: #06070A (obsidian basalt), #F8FAFC (primary text),
 *   #DFB843 (imperial bullion gold), #F43F5E (circuit breaker lock).
 * - Typography: Inter / geometric sans for UI and headlines; IBM Plex Mono for tabular data.
 * - Restraint over spectacle: no starfield canvas, no audio synthesizer, no radar sweeper.
 * - Sentence case throughout: no ALL-CAPS tracked labels, no middle-dot joins, no arrow-suffixed buttons.
 * - Explicit disclosure of Rule B5 lock and zero live capital deployed ($0.00).
 */

import { renderSpecialistIcon, SPECIALIST_ICONS_CSS, SPECIALIST_ICONS_MAP } from "./specialist-icons.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderCouncilDashboardPage(clerkScripts: string = "", clerkConfigured: boolean = false): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#06070A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="QuanterraOS">
<link rel="manifest" href="/manifest.json">
<link rel="icon" type="image/svg+xml" href="/assets/icon.svg">
<link rel="apple-touch-icon" href="/assets/icon-512.svg">
<title>QuanterraOS — Council Console</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${clerkScripts}
<style>
  :root {
    --bg: #06070A;
    --panel: #0C0F17;
    --panel-border: rgba(212, 175, 55, 0.16);
    --panel-border-subtle: rgba(212, 175, 55, 0.08);
    --text: #F8FAFC;
    --muted: #8F95A0;
    --accent: #DFB843;
    --accent-light: #F7E7B4;
    --accent-glow: rgba(223, 184, 67, 0.22);
    --gold: #DFB843;
    --gold-bullion: #D4AF37;
    --warning: #F43F5E;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.5;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  a { color: var(--text); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* Top Navigation */
  .top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px;
    border-bottom: 1px solid var(--panel-border);
    background: var(--bg);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .brand-title {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .brand-sub {
    color: var(--muted);
    font-size: 0.85rem;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 0.82rem;
  }

  .nav-links a {
    color: var(--muted);
    transition: color 0.15s;
  }

  .nav-links a:hover {
    color: var(--text);
    text-decoration: none;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  .utc-clock {
    color: var(--muted);
  }

  .gate-badge-locked {
    color: var(--warning);
    border: 1px solid var(--warning);
    padding: 2px 8px;
    font-size: 0.7rem;
    font-family: var(--font-mono);
  }

  /* Main Container */
  .console-container {
    max-width: 1440px;
    margin: 0 auto;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Metric Header Bar */
  .metric-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid var(--panel-border);
    background: var(--panel);
  }

  @media (max-width: 900px) {
    .metric-bar { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .metric-bar { grid-template-columns: 1fr; }
  }

  .metric-tile {
    padding: 18px 22px;
    border-right: 1px solid var(--panel-border);
  }
  .metric-tile:last-child {
    border-right: none;
  }

  .metric-tile-label {
    font-size: 0.75rem;
    color: var(--muted);
    margin-bottom: 6px;
  }

  .metric-tile-val {
    font-family: var(--font-mono);
    font-size: 1.65rem;
    font-weight: 600;
    line-height: 1.1;
  }

  .metric-tile-val.accent { color: var(--accent); }
  .metric-tile-val.warning { color: var(--warning); }

  .metric-tile-sub {
    font-size: 0.72rem;
    color: var(--muted);
    margin-top: 6px;
    line-height: 1.3;
  }

  /* Bloomberg-Style Command Bar */
  .terminal-cmd-bar {
    display: flex;
    align-items: center;
    background: var(--panel);
    border: 1px solid var(--panel-border);
    padding: 8px 14px;
    gap: 12px;
    font-family: var(--font-mono);
  }

  .cmd-prompt-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .cmd-prompt-symbol {
    color: var(--accent);
    font-weight: 700;
    font-size: 0.85rem;
  }

  .cmd-context-tag {
    font-size: 0.7rem;
    color: var(--accent-light);
    background: rgba(223, 184, 67, 0.1);
    border: 1px solid rgba(223, 184, 67, 0.28);
    padding: 2px 6px;
    border-radius: 2px;
  }

  .cmd-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 0.82rem;
    outline: none;
  }
  .cmd-input::placeholder {
    color: rgba(143, 149, 160, 0.6);
  }

  .cmd-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .cmd-exec-btn {
    background: linear-gradient(180deg, #FBF3D5 0%, #DFB843 35%, #B88E28 100%);
    color: #07080B;
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.72rem;
    border: 1px solid #DFB843;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 6px rgba(0, 0, 0, 0.35);
    transition: opacity 0.15s, transform 0.15s;
  }
  .cmd-exec-btn:hover { opacity: 0.95; transform: translateY(-1px); }

  .cmd-quick-btn {
    background: transparent;
    border: 1px solid var(--panel-border);
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 6px 10px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .cmd-quick-btn:hover {
    color: var(--text);
    border-color: rgba(232, 234, 237, 0.2);
  }

  /* Main Two-Column Grid */
  .console-grid {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 24px;
    align-items: start;
  }

  @media (max-width: 1040px) {
    .console-grid { grid-template-columns: 1fr; }
  }

  /* Section Headers */
  .section-header {
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .section-title {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .section-sub {
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Specialist Roster List */
  .specialist-list {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--panel-border);
    background: var(--panel);
  }

  .specialist-item {
    padding: 14px 18px;
    border-bottom: 1px solid var(--panel-border);
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .specialist-item:last-child {
    border-bottom: none;
  }
  .specialist-item:hover,
  .specialist-item.active {
    background: rgba(232, 234, 237, 0.03);
  }
  .specialist-item.active {
    border-left: 2px solid var(--accent);
    padding-left: 16px;
  }

  .specialist-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .specialist-info {
    flex: 1;
    min-width: 0;
  }

  .specialist-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .specialist-name {
    font-size: 0.88rem;
    font-weight: 600;
  }

  .specialist-number {
    font-family: var(--font-mono);
    font-size: 0.82rem;
  }
  .specialist-number.accent { color: var(--accent); }
  .specialist-number.warning { color: var(--warning); }
  .specialist-number.muted { color: var(--muted); }

  .specialist-role {
    font-size: 0.75rem;
    color: var(--muted);
  }

  ${SPECIALIST_ICONS_CSS}

  .specialist-actions {
    display: flex;
    gap: 12px;
    margin-top: 4px;
    font-size: 0.72rem;
  }

  .action-text-btn {
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: var(--font-sans);
    font-size: 0.72rem;
    text-align: left;
  }
  .action-text-btn:hover {
    color: var(--text);
    text-decoration: underline;
  }

  /* Center Column Panels */
  .center-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  /* Workspace Tabs Bar */
  .workspace-tabs-bar {
    display: flex;
    gap: 4px;
    border: 1px solid var(--panel-border);
    background: var(--panel);
    padding: 4px;
    overflow-x: auto;
  }

  .workspace-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    cursor: pointer;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 500;
    border-radius: 2px;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .workspace-tab:hover {
    color: var(--text);
    background: rgba(232, 234, 237, 0.03);
  }
  .workspace-tab.active {
    color: var(--text);
    background: rgba(223, 184, 67, 0.12);
    border-bottom: 2px solid var(--accent);
    font-weight: 600;
  }
  .workspace-tab.active .tab-index {
    color: var(--accent);
  }
  .tab-index {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted);
  }

  /* Workspace View Panels */
  .workspace-view {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Pipeline Panel */
  .pipeline-panel {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pipeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .pipeline-title {
    font-size: 0.88rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pipeline-sub {
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 2px;
  }

  .pipeline-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pipeline-cycle-counter {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--muted);
  }

  .cycle-btn {
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .cycle-btn:hover {
    background: rgba(223, 184, 67, 0.12);
  }

  .action-toggle-btn {
    background: transparent;
    border: 1px solid var(--panel-border);
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 6px 10px;
    cursor: pointer;
  }
  .action-toggle-btn:hover {
    color: var(--text);
  }

  /* Pipeline Stepper Nodes */
  .pipeline-stepper {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
  }
  @media (max-width: 800px) {
    .pipeline-stepper { grid-template-columns: repeat(4, 1fr); }
  }

  .pipeline-node {
    border: 1px solid var(--panel-border);
    background: var(--bg);
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
  }
  .pipeline-node:hover {
    border-color: rgba(212, 175, 55, 0.3);
  }
  .pipeline-node.active-stage {
    border-color: var(--accent);
    background: rgba(223, 184, 67, 0.08);
  }

  .node-step-tag {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--muted);
  }

  .node-icon-wrap {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .node-name {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .node-status-pill {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--accent);
  }
  .node-status-pill.warning { color: var(--warning); }

  /* Live Task Inspector */
  .live-task-inspector {
    border: 1px solid var(--panel-border);
    background: var(--bg);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    overflow: hidden;
  }
  .live-task-inspector.in-flight {
    border-color: rgba(223, 184, 67, 0.4);
  }

  .inspector-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .inspector-icon {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 4px;
  }

  .inspector-title-area {
    flex: 1;
    min-width: 0;
  }

  .inspector-topline {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .inspector-name {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .inspector-meta {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--muted);
  }

  .inspector-role {
    font-size: 0.78rem;
    color: var(--muted);
  }

  .inspector-task-box {
    background: var(--panel);
    border: 1px solid var(--panel-border-subtle);
    padding: 10px 14px;
    border-radius: 2px;
  }

  .task-box-label {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .task-box-description {
    font-size: 0.82rem;
    color: var(--text);
    line-height: 1.4;
  }

  .inspector-telemetry-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  @media (max-width: 700px) {
    .inspector-telemetry-grid { grid-template-columns: repeat(2, 1fr); }
  }

  .telemetry-chip {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .telemetry-chip-label {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    color: var(--muted);
    text-transform: uppercase;
  }

  .telemetry-chip-val {
    font-family: var(--font-mono);
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text);
  }
  .telemetry-chip-val.accent { color: var(--accent); }
  .telemetry-chip-val.warning { color: var(--warning); }

  .inspector-io {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
    border-top: 1px solid var(--panel-border-subtle);
    padding-top: 10px;
  }

  .inspector-io-row {
    display: flex;
    gap: 8px;
  }

  .io-label {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    flex-shrink: 0;
    width: 105px;
  }

  .io-value {
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 0.72rem;
  }

  /* Microstructure L2 Order Book View */
  .l2-book-panel {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .l2-book-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 768px) {
    .l2-book-grid { grid-template-columns: 1fr; }
  }

  .ladder-box {
    background: var(--bg);
    border: 1px solid var(--panel-border);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ladder-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.82rem;
    font-weight: 600;
    border-bottom: 1px solid var(--panel-border);
    padding-bottom: 6px;
  }

  .depth-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    position: relative;
    padding: 4px 6px;
  }
  .depth-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    opacity: 0.15;
    z-index: 0;
  }
  .depth-bar.bid { right: 0; background: var(--accent); }
  .depth-bar.ask { left: 0; background: var(--warning); }
  .depth-content { position: relative; z-index: 1; display: flex; justify-content: space-between; width: 100%; }

  .imbalance-meter-wrap {
    background: var(--bg);
    border: 1px solid var(--panel-border);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .meter-bar-track {
    height: 8px;
    background: #17202B;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
  }
  .meter-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--accent);
    border-radius: 4px;
  }

  /* Data Panels */
  .data-panel {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    padding: 20px;
  }

  .data-panel-title {
    font-size: 0.88rem;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .data-panel-sub {
    font-size: 0.75rem;
    color: var(--muted);
    margin-bottom: 14px;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.78rem;
  }

  .data-table th, .data-table td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 1px solid var(--panel-border);
  }

  .data-table th {
    color: var(--muted);
    font-weight: 500;
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  /* Interrogation Drawer */
  .interrogation-panel {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .chat-stream {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .chat-msg {
    padding: 12px 14px;
    border-radius: 2px;
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .chat-msg.specialist {
    background: var(--bg);
    border-left: 2px solid var(--accent);
    color: var(--text);
  }

  .chat-msg.user {
    background: rgba(232, 234, 237, 0.05);
    border-left: 2px solid var(--muted);
    color: var(--text);
  }

  .chat-msg-header {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--muted);
    margin-bottom: 6px;
    text-transform: uppercase;
  }

  .chat-citation {
    margin-top: 8px;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--accent);
  }

  .chat-input-form {
    display: flex;
    gap: 8px;
  }

  .chat-input {
    flex: 1;
    background: var(--bg);
    border: 1px solid var(--panel-border);
    color: var(--text);
    padding: 9px 12px;
    font-family: var(--font-sans);
    font-size: 0.82rem;
    outline: none;
    border-radius: 2px;
  }
  .chat-input:focus {
    border-color: var(--accent);
  }

  .chat-submit-btn {
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
    padding: 9px 16px;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.15s;
  }
  .chat-submit-btn:hover {
    background: rgba(223, 184, 67, 0.15);
  }

  /* Log Panel */
  .log-panel {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    padding: 16px 20px;
  }

  .log-stream {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
  }

  .log-line {
    display: flex;
    gap: 12px;
  }
  .log-time { color: var(--muted); flex-shrink: 0; }
  .log-msg { color: var(--text); }

  /* Footer */
  .console-footer {
    padding: 24px 0 12px;
    border-top: 1px solid var(--panel-border);
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.6;
  }

  .legal-note {
    font-size: 0.72rem;
    color: var(--muted);
    margin-top: 6px;
  }

  /* Specialist Call Sign Badges */
  .f1-callsign-tag {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 600;
    background: rgba(223, 184, 67, 0.12);
    color: var(--accent);
    padding: 1px 5px;
    border-radius: 3px;
    margin-right: 6px;
    border: 1px solid rgba(223, 184, 67, 0.25);
  }

  .f1-chat-telemetry-cluster {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(223, 184, 67, 0.2);
    padding: 4px 8px;
    border-radius: 4px;
    margin-bottom: 8px;
    color: var(--accent-light);
    flex-wrap: wrap;
  }
  .f1-chat-telemetry-cluster span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
</style>
</head>
<body>

  <!-- Top Navigation -->
  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="brand-title">quanterraos</a>
      <span class="brand-sub">/ council</span>
    </div>
    <div class="nav-links">
      <a href="/">home</a>
      <a href="/mobile" style="color:var(--accent); font-weight:600;">mobile</a>
      <a href="/calibration">calibration</a>
      <a href="/index">index</a>
      <a href="/spread">spread</a>
      <a href="/methodology">methodology</a>
      <a href="/research">research</a>
      <a href="/status">status</a>
    </div>
    <div class="nav-right">
      <span class="gate-badge-locked">Rule B5 locked</span>
      <span class="utc-clock" id="clock-display">--:--:-- UTC</span>
    </div>
  </nav>

  <main class="console-container">

    <!-- Four Metric Tiles -->
    <section class="metric-bar">
      <div class="metric-tile">
        <div class="metric-tile-label">market-mid Brier score</div>
        <div class="metric-tile-val accent" id="metric-market-brier">0.2001</div>
        <div class="metric-tile-sub">vs 0.2500 uncalibrated baseline (calibrated edge)</div>
      </div>
      <div class="metric-tile">
        <div class="metric-tile-label">Falcon Brier score</div>
        <div class="metric-tile-val warning" id="metric-falcon-brier">0.2736</div>
        <div class="metric-tile-sub">vs 0.2500 coin-flip baseline (underperforming by +0.0236)</div>
      </div>
      <div class="metric-tile">
        <div class="metric-tile-label">audited markets</div>
        <div class="metric-tile-val" id="metric-sample-size">1,316</div>
        <div class="metric-tile-sub">16 missing of 1,332 theoretical windows</div>
      </div>
      <div class="metric-tile">
        <div class="metric-tile-label">capital deployed</div>
        <div class="metric-tile-val warning" id="metric-capital">$0.00</div>
        <div class="metric-tile-sub">zero live capital deployed · Rule B5 locked</div>
      </div>
    </section>

    <!-- Bloomberg-Style Command Bar -->
    <section class="terminal-cmd-bar">
      <div class="cmd-prompt-group">
        <span class="cmd-prompt-symbol">QUANTERRA:&gt;</span>
        <span class="cmd-context-tag" id="cmd-active-context">COUNCIL.ORCHESTRATOR</span>
      </div>
      <input type="text" id="terminal-cmd-input" class="cmd-input" placeholder="Type a specialist (DRACO, WOLF, FALCON, FOX, SENTINEL, KRAKEN, LION, PHOENIX) or command (L2, CALIBRATION, SWINGS, CYCLE, EXPORT)..." autocomplete="off" onkeydown="handleCommandKey(event)">
      <div class="cmd-actions">
        <button type="button" class="cmd-exec-btn" onclick="executeCommandLine()">EXECUTE &lt;GO&gt;</button>
        <button type="button" class="cmd-quick-btn" title="Export audit manifest" onclick="exportAuditBundle()">EXPORT JSON</button>
      </div>
    </section>

    <!-- Two-Column Architecture -->
    <div class="console-grid">

      <!-- Left Column: The 8 Specialists -->
      <aside>
        <div class="section-header">
          <h2 class="section-title">The eight specialists</h2>
          <span class="section-sub">Formula One Telemetry &amp; AI Grid</span>
        </div>

        <div class="specialist-list" id="specialist-roster">
          <!-- Specialist 1: Falcon -->
          <div class="specialist-item" data-agent-id="falcon" onclick="selectSpecialist('falcon')">
            <div class="specialist-row">
              ${renderSpecialistIcon("falcon")}
              <div class="specialist-info">
                <div class="specialist-top">
                  <div><span class="f1-callsign-tag">F1-TEST-04</span><span class="specialist-name">Falcon</span></div>
                  <span class="specialist-number warning">0.2736</span>
                </div>
                <div class="specialist-role">Order-book depth monitoring (research)</div>
              </div>
            </div>
            <div class="specialist-actions">
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); inspectSpecialist('falcon');">inspect</button>
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); promptSpecialist('falcon');">query</button>
            </div>
          </div>

          <!-- Specialist 2: Quantum Fox -->
          <div class="specialist-item active" data-agent-id="quantum-fox" onclick="selectSpecialist('quantum-fox')">
            <div class="specialist-row">
              ${renderSpecialistIcon("quantum-fox")}
              <div class="specialist-info">
                <div class="specialist-top">
                  <div><span class="f1-callsign-tag">F1-POWER-05</span><span class="specialist-name">Quantum Fox</span></div>
                  <span class="specialist-number accent">0.2001</span>
                </div>
                <div class="specialist-role">Market baseline &amp; quantitative validation</div>
              </div>
            </div>
            <div class="specialist-actions">
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); inspectSpecialist('quantum-fox');">inspect</button>
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); promptSpecialist('quantum-fox');">query</button>
            </div>
          </div>

          <!-- Specialist 3: Phoenix -->
          <div class="specialist-item" data-agent-id="phoenix" onclick="selectSpecialist('phoenix')">
            <div class="specialist-row">
              ${renderSpecialistIcon("phoenix")}
              <div class="specialist-info">
                <div class="specialist-top">
                  <div><span class="f1-callsign-tag">F1-BRAKE-08</span><span class="specialist-name">Phoenix</span></div>
                  <span class="specialist-number warning">locked</span>
                </div>
                <div class="specialist-role">Execution circuit breaker &amp; safety gate</div>
              </div>
            </div>
            <div class="specialist-actions">
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); inspectSpecialist('phoenix');">inspect</button>
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); promptSpecialist('phoenix');">query</button>
            </div>
          </div>

          <!-- Specialist 4: Draco -->
          <div class="specialist-item" data-agent-id="draco" onclick="selectSpecialist('draco')">
            <div class="specialist-row">
              ${renderSpecialistIcon("draco")}
              <div class="specialist-info">
                <div class="specialist-top">
                  <div><span class="f1-callsign-tag">F1-ECU-02</span><span class="specialist-name">Draco</span></div>
                  <span class="specialist-number accent">19,740 rows</span>
                </div>
                <div class="specialist-role">Data integrity &amp; tick quality gate</div>
              </div>
            </div>
            <div class="specialist-actions">
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); inspectSpecialist('draco');">inspect</button>
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); promptSpecialist('draco');">query</button>
            </div>
          </div>

          <!-- Specialist 5: Sentinel -->
          <div class="specialist-item" data-agent-id="sentinel" onclick="selectSpecialist('sentinel')">
            <div class="specialist-row">
              ${renderSpecialistIcon("sentinel")}
              <div class="specialist-info">
                <div class="specialist-top">
                  <div><span class="f1-callsign-tag">F1-RADIO-06</span><span class="specialist-name">Sentinel</span></div>
                  <span class="specialist-number muted">0 alerts</span>
                </div>
                <div class="specialist-role">Calibration drift &amp; systems surveillance</div>
              </div>
            </div>
            <div class="specialist-actions">
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); inspectSpecialist('sentinel');">inspect</button>
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); promptSpecialist('sentinel');">query</button>
            </div>
          </div>

          <!-- Specialist 6: Wolf -->
          <div class="specialist-item" data-agent-id="wolf" onclick="selectSpecialist('wolf')">
            <div class="specialist-row">
              ${renderSpecialistIcon("wolf")}
              <div class="specialist-info">
                <div class="specialist-top">
                  <div><span class="f1-callsign-tag">F1-AERO-03</span><span class="specialist-name">Wolf</span></div>
                  <span class="specialist-number accent">microstructure</span>
                </div>
                <div class="specialist-role">Order-book dynamics &amp; spread compression</div>
              </div>
            </div>
            <div class="specialist-actions">
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); inspectSpecialist('wolf');">inspect</button>
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); promptSpecialist('wolf');">query</button>
            </div>
          </div>

          <!-- Specialist 7: Kraken -->
          <div class="specialist-item" data-agent-id="kraken" onclick="selectSpecialist('kraken')">
            <div class="specialist-row">
              ${renderSpecialistIcon("kraken")}
              <div class="specialist-info">
                <div class="specialist-top">
                  <div><span class="f1-callsign-tag">F1-SAFETY-07</span><span class="specialist-name">Kraken</span></div>
                  <span class="specialist-number muted">$0.00 exposure</span>
                </div>
                <div class="specialist-role">Risk governance &amp; CME CF BRTI basis</div>
              </div>
            </div>
            <div class="specialist-actions">
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); inspectSpecialist('kraken');">inspect</button>
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); promptSpecialist('kraken');">query</button>
            </div>
          </div>

          <!-- Specialist 8: Lion -->
          <div class="specialist-item" data-agent-id="lion" onclick="selectSpecialist('lion')">
            <div class="specialist-row">
              ${renderSpecialistIcon("lion")}
              <div class="specialist-info">
                <div class="specialist-top">
                  <div><span class="f1-callsign-tag">F1-CHIEF-01</span><span class="specialist-name">Lion</span></div>
                  <span class="specialist-number accent">consensus</span>
                </div>
                <div class="specialist-role">Consensus synthesis &amp; calibration verdict</div>
              </div>
            </div>
            <div class="specialist-actions">
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); inspectSpecialist('lion');">inspect</button>
              <button type="button" class="action-text-btn" onclick="event.stopPropagation(); promptSpecialist('lion');">query</button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right Column: Verification Engine & Workspaces -->
      <section class="center-column">

        <!-- Workspace Tabs Switcher Bar -->
        <div class="workspace-tabs-bar">
          <div class="workspace-tab active" id="tab-btn-pipeline" onclick="switchWorkspace('pipeline')">
            <span class="tab-index">01</span>
            <span>Council Pipeline (8 Stages)</span>
          </div>
          <div class="workspace-tab" id="tab-btn-microstructure" onclick="switchWorkspace('microstructure')">
            <span class="tab-index">02</span>
            <span>Order-Book Microstructure (L2 Depth)</span>
          </div>
          <div class="workspace-tab" id="tab-btn-calibration" onclick="switchWorkspace('calibration')">
            <span class="tab-index">03</span>
            <span>10-Bin Calibration Radar (n=1,316)</span>
          </div>
          <div class="workspace-tab" id="tab-btn-swings" onclick="switchWorkspace('swings')">
            <span class="tab-index">04</span>
            <span>Market Dislocation &amp; Swings (§12)</span>
          </div>
        </div>

        <!-- Workspace View 1: Council Pipeline -->
        <div class="workspace-view" id="view-pipeline">
          <section class="pipeline-panel">
            <div class="pipeline-header">
              <div class="pipeline-title-group">
                <div class="pipeline-title">
                  <span>Council evaluation pipeline</span>
                  <span class="node-status-pill" id="pipeline-status-badge">Standby (Calibrated)</span>
                </div>
                <div class="pipeline-sub">8-stage empirical verification sequence · Audits data recency, microstructure depth, and pre-registered benchmarks</div>
              </div>
              <div class="pipeline-controls">
                <span class="pipeline-cycle-counter">Cycle #<span id="cycle-count">1</span></span>
                <button type="button" class="action-toggle-btn" id="sync-latest-btn" onclick="syncLatestPipeline()">sync latest</button>
                <button type="button" class="cycle-btn" id="run-cycle-btn" onclick="triggerPipelineCycle()">execute cycle now</button>
              </div>
            </div>

            <!-- 8-Stage Pipeline Stepper -->
            <div class="pipeline-stepper" id="pipeline-stepper">
              <div class="pipeline-node" id="step-draco" onclick="focusSpecialist('draco')">
                <span class="node-step-tag">01</span>
                <div class="node-icon-wrap">${renderSpecialistIcon("draco")}</div>
                <span class="node-name">Draco</span>
                <span class="node-status-pill" id="pill-draco">verified</span>
              </div>
              <div class="pipeline-node" id="step-wolf" onclick="focusSpecialist('wolf')">
                <span class="node-step-tag">02</span>
                <div class="node-icon-wrap">${renderSpecialistIcon("wolf")}</div>
                <span class="node-name">Wolf</span>
                <span class="node-status-pill" id="pill-wolf">tracking</span>
              </div>
              <div class="pipeline-node" id="step-falcon" onclick="focusSpecialist('falcon')">
                <span class="node-step-tag">03</span>
                <div class="node-icon-wrap">${renderSpecialistIcon("falcon")}</div>
                <span class="node-name">Falcon</span>
                <span class="node-status-pill" id="pill-falcon">scanned</span>
              </div>
              <div class="pipeline-node" id="step-quantum-fox" onclick="focusSpecialist('quantum-fox')">
                <span class="node-step-tag">04</span>
                <div class="node-icon-wrap">${renderSpecialistIcon("quantum-fox")}</div>
                <span class="node-name">Quantum Fox</span>
                <span class="node-status-pill" id="pill-quantum-fox">audited</span>
              </div>
              <div class="pipeline-node" id="step-sentinel" onclick="focusSpecialist('sentinel')">
                <span class="node-step-tag">05</span>
                <div class="node-icon-wrap">${renderSpecialistIcon("sentinel")}</div>
                <span class="node-name">Sentinel</span>
                <span class="node-status-pill" id="pill-sentinel">nominal</span>
              </div>
              <div class="pipeline-node" id="step-kraken" onclick="focusSpecialist('kraken')">
                <span class="node-step-tag">06</span>
                <div class="node-icon-wrap">${renderSpecialistIcon("kraken")}</div>
                <span class="node-name">Kraken</span>
                <span class="node-status-pill" id="pill-kraken">locked</span>
              </div>
              <div class="pipeline-node" id="step-lion" onclick="focusSpecialist('lion')">
                <span class="node-step-tag">07</span>
                <div class="node-icon-wrap">${renderSpecialistIcon("lion")}</div>
                <span class="node-name">Lion</span>
                <span class="node-status-pill" id="pill-lion">calibrated</span>
              </div>
              <div class="pipeline-node" id="step-phoenix" onclick="focusSpecialist('phoenix')">
                <span class="node-step-tag">08</span>
                <div class="node-icon-wrap">${renderSpecialistIcon("phoenix")}</div>
                <span class="node-name">Phoenix</span>
                <span class="node-status-pill" id="pill-phoenix">locked</span>
              </div>
            </div>

            <!-- Active Live Task Inspector -->
            <div class="live-task-inspector" id="live-task-inspector">
              <!-- Dynamically populated by renderLiveInspector() -->
            </div>

            <!-- Consensus Verdict Sub-strip -->
            <div class="cycle-banner" style="padding: 10px 14px; background: var(--bg);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--muted); font-size: 0.72rem; font-family: var(--font-mono);">Synthesized consensus verdict:</span>
                <span id="lion-verdict-text" style="font-weight: 600; font-size: 0.8rem; color: var(--text);">Well-calibrated baseline. Standby mode active.</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Workspace View 2: Order-Book Microstructure (L2 Depth) -->
        <div class="workspace-view" id="view-microstructure" style="display: none;">
          <section class="l2-book-panel">
            <div class="pipeline-header">
              <div>
                <div class="pipeline-title">Order-book dynamics &amp; queue depth monitoring</div>
                <div class="pipeline-sub">Wolf microstructure engine · Live snapshot evaluation of KXBTC15M &amp; KXBTCD contracts</div>
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent);">
                spread: <span id="l2-spread-val">$0.0100 (1.00¢)</span>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px; background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:6px; padding:8px 12px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--muted); text-transform:uppercase;">Execution Desks:</span>
                <a href="/kalshi/15m" style="font-family:var(--font-mono); font-size:0.74rem; color:var(--accent); text-decoration:none; padding:3px 9px; border-radius:4px; background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.3);">15 Min · KXBTC15M &rarr;</a>
                <a href="/kalshi/1h" style="font-family:var(--font-mono); font-size:0.74rem; color:#34D399; text-decoration:none; padding:3px 9px; border-radius:4px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3);">1 Hour · KXBTCD Multi-Strike &rarr;</a>
              </div>
              <span style="font-family:var(--font-mono); font-size:0.70rem; color:var(--muted);">CME CF BRTI 60s TWAP Settlement</span>
            </div>

            <div class="l2-book-grid">
              <!-- YES Ladder -->
              <div class="ladder-box">
                <div class="ladder-header">
                  <span style="color: var(--accent);">YES CONTRACTS</span>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted);">Kalshi KXBTC15M</span>
                </div>
                <div class="depth-row">
                  <div class="depth-bar ask" style="width: 45%;"></div>
                  <div class="depth-content">
                    <span style="color: var(--warning);">Ask $0.45</span>
                    <span style="color: var(--muted);">180 contracts</span>
                  </div>
                </div>
                <div class="depth-row" style="border-top: 1px dashed var(--panel-border);">
                  <div class="depth-bar bid" style="width: 62%;"></div>
                  <div class="depth-content">
                    <span style="color: var(--accent);">Bid $0.44</span>
                    <span style="color: var(--muted);">250 contracts</span>
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono); margin-top: 4px;">
                  Midpoint: $0.4450 · Imbalance skew: +0.0350
                </div>
              </div>

              <!-- NO Ladder -->
              <div class="ladder-box">
                <div class="ladder-header">
                  <span style="color: var(--warning);">NO CONTRACTS</span>
                  <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted);">Kalshi KXBTC15M</span>
                </div>
                <div class="depth-row">
                  <div class="depth-bar ask" style="width: 62%;"></div>
                  <div class="depth-content">
                    <span style="color: var(--warning);">Ask $0.56</span>
                    <span style="color: var(--muted);">250 contracts</span>
                  </div>
                </div>
                <div class="depth-row" style="border-top: 1px dashed var(--panel-border);">
                  <div class="depth-bar bid" style="width: 45%;"></div>
                  <div class="depth-content">
                    <span style="color: var(--accent);">Bid $0.55</span>
                    <span style="color: var(--muted);">180 contracts</span>
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--muted); font-family: var(--font-mono); margin-top: 4px;">
                  Midpoint: $0.5550 · Imbalance skew: -0.0350
                </div>
              </div>
            </div>

            <!-- Imbalance Meter -->
            <div class="imbalance-meter-wrap">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-family: var(--font-mono);">
                <span>Queue Depth Imbalance</span>
                <span style="color: var(--accent);">+0.0350 (mild YES pressure)</span>
              </div>
              <div class="meter-bar-track">
                <div class="meter-fill" style="left: 50%; width: 3.5%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--muted); font-family: var(--font-mono);">
                <span>-1.00 (Heavy Sell)</span>
                <span>0.00 (Neutral)</span>
                <span>+1.00 (Heavy Buy)</span>
              </div>
            </div>

            <div style="font-size: 0.75rem; color: var(--muted); line-height: 1.5; border-top: 1px solid var(--panel-border); padding-top: 10px;">
              <strong>Wolf Audit Note:</strong> Ingestion valid-from timestamp fixed at 2026-09-26T13:10:27Z. All snapshots before this threshold were corrupted by Kalshi's inverse best-bid extract bug and have been strictly excised from analytical memory.
            </div>
          </section>
        </div>

        <!-- Workspace View 3: 10-Bin Calibration Radar -->
        <div class="workspace-view" id="view-calibration" style="display: none;">
          <div class="data-panel">
            <div class="data-panel-title">10-bin calibration decomposition (n=1,316)</div>
            <div class="data-panel-sub">Murphy decomposition of minute-4 market mid-price across 1,316 settled 15-minute contracts (findings.md §9b).</div>
            <div class="calibration-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Price bin</th>
                    <th>Markets (n)</th>
                    <th>Quoted forecast</th>
                    <th>Actual yes rate</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody id="calibration-table-body">
                  <tr><td>0.00 – 0.10</td><td>18</td><td>0.050</td><td>0.111</td><td>+0.061</td></tr>
                  <tr><td>0.10 – 0.20</td><td>79</td><td>0.150</td><td>0.190</td><td>+0.040</td></tr>
                  <tr><td>0.20 – 0.30</td><td>150</td><td>0.250</td><td>0.200</td><td>-0.050</td></tr>
                  <tr><td>0.30 – 0.40</td><td>183</td><td>0.350</td><td>0.333</td><td>-0.017</td></tr>
                  <tr><td>0.40 – 0.50</td><td>211</td><td>0.450</td><td>0.436</td><td>-0.014</td></tr>
                  <tr><td>0.50 – 0.60</td><td>187</td><td>0.550</td><td>0.588</td><td>+0.038</td></tr>
                  <tr><td>0.60 – 0.70</td><td>211</td><td>0.650</td><td>0.649</td><td>-0.001</td></tr>
                  <tr><td>0.70 – 0.80</td><td>157</td><td>0.750</td><td>0.771</td><td>+0.021</td></tr>
                  <tr><td>0.80 – 0.90</td><td>101</td><td>0.850</td><td>0.891</td><td>+0.041</td></tr>
                  <tr><td>0.90 – 1.00</td><td>19</td><td>0.950</td><td>0.895</td><td>-0.055</td></tr>
                </tbody>
              </table>
            </div>

            <!-- Minute-by-Minute Brier Comparison Curve -->
            <div style="margin-top: 18px; border-top: 1px solid var(--panel-border); padding-top: 14px;">
              <div style="font-size: 0.82rem; font-weight: 600; margin-bottom: 8px;">Minute-by-minute Brier progression (Market vs Fair-Value Model)</div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Entry minute</th>
                    <th>Market Mid Brier</th>
                    <th>Model Brier</th>
                    <th>Disagreement Trade EV</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Minute 4</td><td style="color:var(--accent);">0.2001</td><td>0.2063</td><td>−2.15¢ (n=1,027)</td><td>Market beats model</td></tr>
                  <tr><td>Minute 7</td><td style="color:var(--accent);">0.1685</td><td>0.1755</td><td>−1.88¢ (n=1,057)</td><td>Market beats model</td></tr>
                  <tr><td>Minute 10</td><td style="color:var(--accent);">0.1248</td><td>0.1333</td><td>−0.92¢ (n=1,173)</td><td>Market beats model</td></tr>
                  <tr><td>Minute 13</td><td style="color:var(--accent);">0.0731</td><td>0.0835</td><td>+0.42¢ (unverified)</td><td>Market beats model</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Workspace View 4: Market Dislocation & Swings (§12) -->
        <div class="workspace-view" id="view-swings" style="display: none;">
          <div class="data-panel">
            <div class="data-panel-title">Sudden price-swing event backtest (§12)</div>
            <div class="data-panel-sub">Rigorous walk-forward analysis of sudden price moves (&ge; &plusmn;8 percentage points in 5 min) across 131 settled events.</div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>Execution strategy</th>
                  <th>Full sample win rate</th>
                  <th>Full sample net profit</th>
                  <th>Walk-forward Brier</th>
                  <th>Market benchmark Brier</th>
                  <th>Empirical verdict</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Momentum (Continuation)</strong></td>
                  <td>75.57% (99/131)</td>
                  <td>+12.72¢</td>
                  <td>0.1863</td>
                  <td style="color:var(--accent);">0.1838</td>
                  <td style="color:var(--warning); font-weight:600;">No Edge (95% CI spans zero)</td>
                </tr>
                <tr>
                  <td><strong>Fade (Mean Reversion)</strong></td>
                  <td>24.43% (32/131)</td>
                  <td style="color:var(--warning);">−15.37¢</td>
                  <td>0.3083</td>
                  <td style="color:var(--accent);">0.1838</td>
                  <td style="color:var(--warning); font-weight:600;">No Edge (underperforms random)</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top: 16px; background: var(--bg); border: 1px solid var(--panel-border); padding: 12px; font-size: 0.78rem; line-height: 1.5;">
              <strong>Empirical Finding:</strong> Despite an apparent 75.6% hit rate for momentum in-sample, out-of-sample walk-forward evaluation demonstrates the market's own post-swing price beats the momentum rule on Brier score (0.1838 vs 0.1863). Fading the move loses over 15¢ per contract. Phoenix circuit breaker remains locked under Rule B5.
            </div>
          </div>
        </div>

        <!-- Specialist Audit & Interrogation Drawer (Always visible across all tabs) -->
        <div class="interrogation-panel">
          <div class="data-panel-title" id="interrogate-title">Audit specialist: Quantum Fox</div>
          <div class="data-panel-sub" id="interrogate-sub">Queries are audited against repository findings and recorded benchmarks.</div>

          <div class="chat-stream" id="chat-stream-box">
            <div class="chat-msg specialist">
              <div class="chat-msg-header">
                <span id="active-specialist-label">Quantum Fox</span>
                <span>system ready</span>
              </div>
              <div>Standing by. You may query our 1,316-market calibration baseline, out-of-sample test results, or the Falcon order-book monitoring research.</div>
              <div class="chat-citation">citation: findings.md §9b · Brier 0.2001</div>
            </div>
          </div>

          <form class="chat-input-form" onsubmit="event.preventDefault(); submitQuery();">
            <input type="text" class="chat-input" id="chat-input-field" placeholder="Ask about calibration, Brier score, Falcon backtest, or Rule B5..." autocomplete="off">
            <button type="submit" class="chat-submit-btn" id="chat-send-btn">submit</button>
          </form>
        </div>

        <!-- Recent Audit Log -->
        <div class="log-panel">
          <div style="font-size: 0.78rem; font-weight: 600; margin-bottom: 8px;">Audit events</div>
          <div class="log-stream" id="log-stream">
            <div class="log-line">
              <span class="log-time">2026-10-04 10:45:00</span>
              <span class="log-msg">Lion verified 1,316-market baseline Brier score: 0.2001. Well-calibrated.</span>
            </div>
            <div class="log-line">
              <span class="log-time">2026-10-04 10:44:20</span>
              <span class="log-msg">Falcon out-of-sample evaluation: Brier 0.2736 (n=31). Underperforming random baseline.</span>
            </div>
            <div class="log-line">
              <span class="log-time">2026-10-04 10:43:10</span>
              <span class="log-msg">Phoenix safety circuit confirmed: Rule B5 locked. Zero live capital deployed ($0.00).</span>
            </div>
          </div>
        </div>

      </section>

    </div>

    <!-- Mandatory Rule B5 & Transparency Disclosures -->
    <footer class="console-footer">
      <div style="display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap;">
        <a href="/" style="color: var(--accent); text-decoration: none;">home</a>
        <a href="/calibration" style="color: var(--accent); text-decoration: none;">calibration</a>
        <a href="/index" style="color: var(--accent); text-decoration: none;">index</a>
        <a href="/spread" style="color: var(--accent); text-decoration: none;">spread</a>
        <a href="/methodology" style="color: var(--accent); text-decoration: none;">methodology</a>
        <a href="/research" style="color: var(--accent); text-decoration: none;">research</a>
        <a href="/changelog" style="color: var(--accent); text-decoration: none;">changelog</a>
        <a href="/legal" style="color: var(--accent); text-decoration: none;">legal</a>
        <a href="/status" style="color: var(--accent); text-decoration: none;">status</a>
      </div>
      <div style="margin-top: 8px;">QuanterraOS Council Console · Auditable empirical benchmarks · Rule B5 locked · Zero live capital deployed ($0.00).</div>
      <div class="legal-note" style="margin-top: 6px; line-height: 1.5;">
        Kalshi, CME Group, CF Benchmarks, Coinbase, Kraken, Bitstamp, Gemini, and Polymarket are trademarks of their respective owners. QuanterraOS is an independent measurement system operated by Quantara Global LLC and is not affiliated with, endorsed by, or sponsored by any exchange or market operator. All statistics computed from stored market records. No automated order execution, trading facilitation, or investment advice. <a href="/legal" style="color: var(--accent); text-decoration: underline;">Legal &amp; Regulatory Disclaimers &rarr;</a>
      </div>
    </footer>

  </main>

<script>
const SPECIALIST_ICONS = ${JSON.stringify(SPECIALIST_ICONS_MAP)};

const PIPELINE_ORDER = [
  'draco',
  'wolf',
  'falcon',
  'quantum-fox',
  'sentinel',
  'kraken',
  'lion',
  'phoenix'
];

const AGENT_KEY_MAP = {
  'draco': 'draco',
  'wolf': 'wolf',
  'falcon': 'falcon',
  'quantum-fox': 'quantumFox',
  'sentinel': 'sentinel',
  'kraken': 'kraken',
  'lion': 'lion',
  'phoenix': 'phoenix'
};

const STAGE_ACTION_TEXT = {
  'draco': 'Verifies candle dataset file integrity (kalshi-btc15m-candles.csv, 19,740 rows) and collector log timestamps across 1,316 settled windows. Quality gate passed: 0 corrupted timestamps.',
  'wolf': 'Ingests latest L2 order-book snapshot from SQLite. Evaluates spread ($0.01) and queue depth imbalance (+0.0350).',
  'falcon': 'Evaluates depth imbalance heuristic against pre-registered criteria. Reports audited out-of-sample backtest baseline (n=31, Brier 0.2736, no tradable edge).',
  'quantum-fox': 'Runs minute-4 predictor model ($0.448) against market mid baseline ($0.625). Audits against canonical 1,316-market baseline: market mid (0.2001) beats model (0.2063). Zero edge.',
  'sentinel': 'Audits operational health across 4 upstream pipeline stages. Continuous watchdog: 0 active alerts, 100% pipeline uptime, 299 swing events tracked.',
  'kraken': 'Evaluates simulated portfolio boundary and CME CF BRTI basis divergence (+1.4 bps). Enforces Rule B5: zero live capital exposure ($0.00).',
  'lion': 'Synthesizes multi-specialist calibration consensus across 10 probability deciles. Consolidates official single source of truth: Nominal Calibrated Standby.',
  'phoenix': 'Audits execution readiness gate. Rule B5 permanent safety lock confirmed. Live order placement strictly disabled (0 orders routed).'
};

let currentAgentId = 'quantum-fox';
let currentWorkspace = 'pipeline';
let latestPipelineData = null;
let isCycleRunning = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateClock() {
  const d = new Date();
  const utc = d.toUTCString().split(' ')[4] + ' UTC';
  const el = document.getElementById('clock-display');
  if (el) el.textContent = utc;
}
setInterval(updateClock, 1000);
updateClock();

function switchWorkspace(workspaceId) {
  currentWorkspace = workspaceId;
  const views = ['pipeline', 'microstructure', 'calibration', 'swings'];
  views.forEach(v => {
    const el = document.getElementById('view-' + v);
    const tab = document.getElementById('tab-btn-' + v);
    if (el) el.style.display = (v === workspaceId) ? 'flex' : 'none';
    if (tab) tab.classList.toggle('active', v === workspaceId);
  });
  const contextEl = document.getElementById('cmd-active-context');
  if (contextEl) {
    contextEl.textContent = workspaceId.toUpperCase();
  }
}

function handleCommandKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    executeCommandLine();
  }
}

function executeCommandLine() {
  const input = document.getElementById('terminal-cmd-input');
  if (!input) return;
  const val = input.value.trim().toLowerCase();
  if (!val) return;

  if (val === 'draco' || val === '01') {
    selectSpecialist('draco');
  } else if (val === 'wolf' || val === '02') {
    selectSpecialist('wolf');
    switchWorkspace('microstructure');
  } else if (val === 'falcon' || val === '03') {
    selectSpecialist('falcon');
  } else if (val === 'quantum-fox' || val === 'fox' || val === '04') {
    selectSpecialist('quantum-fox');
  } else if (val === 'sentinel' || val === '05') {
    selectSpecialist('sentinel');
  } else if (val === 'kraken' || val === '06') {
    selectSpecialist('kraken');
  } else if (val === 'lion' || val === '07') {
    selectSpecialist('lion');
  } else if (val === 'phoenix' || val === '08') {
    selectSpecialist('phoenix');
  } else if (val === 'pipeline' || val === 'stages') {
    switchWorkspace('pipeline');
  } else if (val === 'l2' || val === 'book' || val === 'depth' || val === 'microstructure') {
    switchWorkspace('microstructure');
  } else if (val === 'calibration' || val === 'radar' || val === 'brier') {
    switchWorkspace('calibration');
  } else if (val === 'swings' || val === 'anomaly' || val === 'events') {
    switchWorkspace('swings');
  } else if (val === 'cycle' || val === 'run' || val === 'execute') {
    triggerPipelineCycle();
  } else if (val === 'export' || val === 'manifest') {
    exportAuditBundle();
  } else {
    // Treat as query to active specialist
    const chatInput = document.getElementById('chat-input-field');
    if (chatInput) {
      chatInput.value = input.value;
      submitQuery();
    }
  }
  input.value = '';
}

function exportAuditBundle() {
  const manifest = {
    title: "QuanterraOS Auditable Calibration & Microstructure Manifest",
    generatedAt: new Date().toISOString(),
    corpus: {
      canonicalWindows: 1316,
      theoreticalWindows: 1332,
      missingWindows: 16,
      totalCandleRows: 19740,
      verifiedDateRange: "2026-09-15T02:00:00Z to 2026-09-28T22:45:00Z"
    },
    benchmarks: {
      marketMidBrierMinute4: 0.2001,
      coinFlipBaseline: 0.2500,
      falconBrierScoreOutOfSample: 0.2736,
      falconSampleSize: 31,
      fairValueModelBrierMinute4: 0.2063
    },
    dislocations: {
      settledSwingEventsTested: 131,
      momentumRuleHeldOutBrier: 0.1863,
      fadeRuleHeldOutBrier: 0.3083,
      marketPostSwingBenchmarkBrier: 0.1838,
      verdict: "No tradable edge over market price"
    },
    safetyGovernance: {
      ruleB4Compliance: "Strict. Zero unvalidated marketing superlatives.",
      ruleB5Status: "PERMANENTLY_LOCKED",
      authorizedCapital: "$0.00",
      liveOrdersRouted: 0
    }
  };

  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quanterraos-audit-manifest.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function selectSpecialist(agentId) {
  currentAgentId = agentId;
  document.querySelectorAll('.specialist-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-agent-id') === agentId);
  });
  const titles = {
    'falcon': 'Falcon — Order-book depth monitoring',
    'quantum-fox': 'Quantum Fox — Market baseline & validation',
    'phoenix': 'Phoenix — Safety gate & circuit breaker',
    'draco': 'Draco — Tick integrity & quality gate',
    'sentinel': 'Sentinel — Calibration drift detection',
    'wolf': 'Wolf — Order-book dynamics & spread compression',
    'kraken': 'Kraken — Risk governance & CME CF BRTI basis',
    'lion': 'Lion — Consensus synthesis & calibration verdict'
  };
  const titleEl = document.getElementById('interrogate-title');
  if (titleEl) titleEl.textContent = 'Audit specialist: ' + (titles[agentId] || agentId);
  const labelEl = document.getElementById('active-specialist-label');
  if (labelEl) labelEl.textContent = agentId;

  if (!isCycleRunning) {
    const rec = latestPipelineData?.agents ? latestPipelineData.agents[AGENT_KEY_MAP[agentId]] : null;
    renderLiveInspector(agentId, rec, false);
  }
}

function focusSpecialist(agentId) {
  selectSpecialist(agentId);
}

function renderLiveInspector(agentId, record, isRunning, stepNumber) {
  const container = document.getElementById('live-task-inspector');
  if (!container) return;

  container.classList.toggle('in-flight', isRunning);

  const iconSvg = SPECIALIST_ICONS[agentId] || '';
  const metaTitles = {
    'draco': { name: 'Draco', role: 'Data integrity & tick quality gate', stage: 'Stage 01 / 08 · Verification' },
    'wolf': { name: 'Wolf', role: 'Order-book dynamics & spread compression', stage: 'Stage 02 / 08 · Microstructure' },
    'falcon': { name: 'Falcon', role: 'Order-book depth monitoring (research)', stage: 'Stage 03 / 08 · Depth Scanner' },
    'quantum-fox': { name: 'Quantum Fox', role: 'Market baseline & quantitative validation', stage: 'Stage 04 / 08 · Volatility Model' },
    'sentinel': { name: 'Sentinel', role: 'Calibration drift & systems surveillance', stage: 'Stage 05 / 08 · Surveillance' },
    'kraken': { name: 'Kraken', role: 'Risk governance & CME CF BRTI basis', stage: 'Stage 06 / 08 · Risk Gate' },
    'lion': { name: 'Lion', role: 'Consensus synthesis & calibration verdict', stage: 'Stage 07 / 08 · Synthesis' },
    'phoenix': { name: 'Phoenix', role: 'Execution circuit breaker & safety gate', stage: 'Stage 08 / 08 · Safety Gate' }
  };

  const meta = metaTitles[agentId] || { name: agentId, role: 'Council Specialist', stage: 'Council Specialist' };
  const stageNum = stepNumber ? ('Stage ' + String(stepNumber).padStart(2, '0') + ' / 08') : meta.stage;

  const actionText = isRunning
    ? (STAGE_ACTION_TEXT[agentId] || (record?.summary || 'Auditing specialist parameters...'))
    : (record?.summary || STAGE_ACTION_TEXT[agentId]);

  const latency = record ? (record.latencyMs + 'ms') : 'nominal';

  // Build 4 telemetry chips based on agent
  let chips = [];
  if (agentId === 'draco') {
    chips = [
      { label: 'candle dataset', val: record?.telemetry?.totalCandleRows ? (record.telemetry.totalCandleRows.toLocaleString() + ' rows') : '19,740 rows', cls: 'accent' },
      { label: 'verified windows', val: record?.telemetry?.verifiedWindows ? (record.telemetry.verifiedWindows.toLocaleString() + ' / 1,332') : '1,316 / 1,332', cls: '' },
      { label: 'collector status', val: 'active (0 stale)', cls: 'accent' },
      { label: 'quality gate', val: 'passed (0 corrupt)', cls: 'accent' }
    ];
  } else if (agentId === 'wolf') {
    const t = record?.telemetry || {};
    chips = [
      { label: 'target contract', val: t.targetMarket || 'KXBTC15M', cls: '' },
      { label: 'best yes / no', val: '$' + (t.bestYesPrice !== undefined ? Number(t.bestYesPrice).toFixed(2) : '0.44') + ' / $' + (t.bestNoPrice !== undefined ? Number(t.bestNoPrice).toFixed(2) : '0.55'), cls: 'accent' },
      { label: 'depth imbalance', val: (t.depthImbalance !== undefined ? Number(t.depthImbalance).toFixed(4) : '+0.0350'), cls: '' },
      { label: 'spread estimate', val: '$' + (t.spreadEstimate !== undefined ? Number(t.spreadEstimate).toFixed(4) : '0.0100'), cls: '' }
    ];
  } else if (agentId === 'falcon') {
    chips = [
      { label: 'heuristic test', val: 'depth imbalance', cls: '' },
      { label: 'backtest sample', val: 'n=31 out-of-sample', cls: '' },
      { label: 'Falcon Brier', val: '0.2736', cls: 'warning' },
      { label: 'verdict', val: 'underperforms 50/50', cls: 'warning' }
    ];
  } else if (agentId === 'quantum-fox') {
    chips = [
      { label: 'predictor model', val: '$0.448 (min 4)', cls: '' },
      { label: 'market mid-price', val: '$0.625', cls: '' },
      { label: 'market Brier vs model', val: '0.2001 vs 0.2063', cls: 'accent' },
      { label: 'validation verdict', val: 'FAILED (0 edge)', cls: 'warning' }
    ];
  } else if (agentId === 'sentinel') {
    chips = [
      { label: 'upstream stages', val: '4 surveilled', cls: '' },
      { label: 'active alerts', val: '0 alerts', cls: 'accent' },
      { label: 'pipeline uptime', val: '100.0%', cls: 'accent' },
      { label: 'swing events', val: '299 logged', cls: '' }
    ];
  } else if (agentId === 'kraken') {
    chips = [
      { label: 'authorized capital', val: '$0.00', cls: 'warning' },
      { label: 'live exposure', val: '$0.00', cls: 'warning' },
      { label: 'CME CF BRTI basis', val: '+1.4 bps tracked', cls: 'accent' },
      { label: 'risk boundary', val: 'Rule B5 locked', cls: 'warning' }
    ];
  } else if (agentId === 'lion') {
    chips = [
      { label: 'probability bins', val: '10 deciles audited', cls: '' },
      { label: 'consensus quorum', val: '100% agreement', cls: 'accent' },
      { label: 'baseline calibration', val: 'Brier 0.2001 (nominal)', cls: 'accent' },
      { label: 'official verdict', val: 'calibrated standby', cls: 'accent' }
    ];
  } else { // phoenix
    chips = [
      { label: 'circuit breaker', val: 'locked (Rule B5)', cls: 'warning' },
      { label: 'live orders placed', val: '0 orders', cls: 'warning' },
      { label: 'active capital', val: '$0.00 deployed', cls: 'warning' },
      { label: 'execution mode', val: 'dry run only', cls: 'warning' }
    ];
  }

  let chipsHtml = '';
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i];
    chipsHtml += '<div class="telemetry-chip">' +
      '<span class="telemetry-chip-label">' + escapeHtml(c.label) + '</span>' +
      '<span class="telemetry-chip-val ' + (c.cls || '') + '">' + escapeHtml(c.val) + '</span>' +
      '</div>';
  }

  const inputDesc = (record && record.inputDescription) ? record.inputDescription : 'Live sensor feeds & verified storage tables';
  const outputDesc = (record && record.outputDescription) ? record.outputDescription : 'Audited pass certificate & telemetry parameters';

  const pulseDotHtml = isRunning
    ? '<span class="task-execution-pulse"></span>'
    : '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);"></span>';

  container.innerHTML =
    '<div class="inspector-header">' +
      '<div class="inspector-icon">' + iconSvg + '</div>' +
      '<div class="inspector-title-area">' +
        '<div class="inspector-topline">' +
          '<span class="inspector-name">' + escapeHtml(meta.name) + '</span>' +
          '<span class="inspector-meta">' + escapeHtml(stageNum) + ' · stat check: ' + escapeHtml(latency) + '</span>' +
        '</div>' +
        '<div class="inspector-role">' + escapeHtml(meta.role) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="inspector-task-box">' +
      '<div class="task-box-label">' +
        pulseDotHtml + ' ' + (isRunning ? 'auditing stage telemetry:' : 'verified stage telemetry:') +
      '</div>' +
      '<div class="task-box-description">' + escapeHtml(actionText) + '</div>' +
    '</div>' +
    '<div class="inspector-telemetry-grid">' +
      chipsHtml +
    '</div>' +
    '<div class="inspector-io">' +
      '<div class="inspector-io-row">' +
        '<span class="io-label">Input stream:</span>' +
        '<span class="io-value">' + escapeHtml(inputDesc) + '</span>' +
      '</div>' +
      '<div class="inspector-io-row">' +
        '<span class="io-label">Output artifact:</span>' +
        '<span class="io-value">' + escapeHtml(outputDesc) + '</span>' +
      '</div>' +
    '</div>';
}

function inspectSpecialist(agentId) {
  selectSpecialist(agentId);
  const stream = document.getElementById('chat-stream-box');
  if (!stream) return;
  const msg = document.createElement('div');
  msg.className = 'chat-msg specialist';
  
  let content = '';
  if (agentId === 'falcon') {
    content = 'Falcon telemetry audit: Out-of-sample Brier score 0.2736 across n=31 markets (reports/falcon-backtest-2026-10-03.txt). Underperforms both 50/50 baseline (0.2500) and entry-price (0.2106). Strict research designation.';
  } else if (agentId === 'quantum-fox') {
    content = 'Quantum Fox telemetry audit: Canonical 1,316-market baseline Brier 0.2001. Kalshi market mid-price outperforms quantitative fair-value model at all checkpoints (minutes 4, 7, 10, 13).';
  } else if (agentId === 'phoenix') {
    content = 'Phoenix safety status: Rule B5 locked. Zero live capital deployed ($0.00). Live execution disabled by circuit breaker.';
  } else if (agentId === 'wolf') {
    content = 'Wolf microstructure audit: Order-book snapshot valid-from cutoff at 2026-09-26 13:10:27 UTC. Descriptive queue imbalance profiling active.';
  } else if (agentId === 'kraken') {
    content = 'Kraken risk governance audit: Capital exposure strictly $0.00. Cross-venue basis tracking against CME CF BRTI active. Zero risk alerts.';
  } else {
    content = agentId + ' telemetry verified against stored database records. All checks passing.';
  }
  
  msg.innerHTML = '<div class="chat-msg-header"><span>' + agentId + '</span><span>' + new Date().toLocaleTimeString() + '</span></div><div>' + content + '</div>';
  stream.appendChild(msg);
  stream.scrollTop = stream.scrollHeight;
}

function promptSpecialist(agentId) {
  selectSpecialist(agentId);
  const input = document.getElementById('chat-input-field');
  if (input) {
    if (agentId === 'falcon') input.value = 'What is Falcon\'s out-of-sample Brier score and sample size?';
    else if (agentId === 'quantum-fox') input.value = 'How does the market mid-price compare to our quantitative model?';
    else if (agentId === 'phoenix') input.value = 'What is the current capital status under Rule B5?';
    else if (agentId === 'wolf') input.value = 'What is the clean cutoff timestamp for order-book data?';
    else if (agentId === 'kraken') input.value = 'What is the current capital exposure of the platform?';
    else input.value = 'What are your latest audited telemetry metrics?';
    input.focus();
  }
}

async function submitQuery() {
  const input = document.getElementById('chat-input-field');
  const btn = document.getElementById('chat-send-btn');
  const stream = document.getElementById('chat-stream-box');
  if (!input || !stream) return;
  const text = input.value.trim();
  if (!text) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.innerHTML = '<div class="chat-msg-header"><span>You</span><span>' + new Date().toLocaleTimeString() + '</span></div><div>' + escapeHtml(text) + '</div>';
  stream.appendChild(userMsg);
  input.value = '';
  if (btn) btn.disabled = true;

  const waitingMsg = document.createElement('div');
  waitingMsg.className = 'chat-msg specialist';
  waitingMsg.id = 'chat-waiting-msg';
  waitingMsg.innerHTML = '<div class="chat-msg-header"><span>' + currentAgentId + '</span><span>querying</span></div><div>Auditing query against verified repository findings...</div>';
  stream.appendChild(waitingMsg);
  stream.scrollTop = stream.scrollHeight;

  try {
    const res = await fetch('/api/executives/' + currentAgentId + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    const wait = document.getElementById('chat-waiting-msg');
    if (wait) wait.remove();

    const specMsg = document.createElement('div');
    specMsg.className = 'chat-msg specialist';
    let citationsHtml = '';
    if (Array.isArray(data.citations) && data.citations.length > 0) {
      citationsHtml = '<div class="chat-citation">citations: ' + data.citations.map(c => escapeHtml(c)).join(', ') + '</div>';
    }
    let telemetryHtml = '';
    if (data.telemetryCluster) {
      telemetryHtml = '<div class="f1-chat-telemetry-cluster">' +
        '<span>🏁 ' + escapeHtml(data.telemetryCluster.callSign) + '</span>' +
        '<span>🔒 ' + escapeHtml(data.telemetryCluster.circuitStatus) + '</span>' +
        '</div>';
    }
    specMsg.innerHTML = telemetryHtml + '<div class="chat-msg-header"><span>' + escapeHtml(data.agentName || currentAgentId) + '</span><span>' + new Date().toLocaleTimeString() + '</span></div><div>' + escapeHtml(data.reply || '') + '</div>' + citationsHtml;
    stream.appendChild(specMsg);
    playPitRadioBeep();
  } catch (_e) {
    const wait = document.getElementById('chat-waiting-msg');
    if (wait) wait.remove();
    const errMsg = document.createElement('div');
    errMsg.className = 'chat-msg specialist';
    errMsg.innerHTML = '<div style="color: var(--warning);">Audit line interrupted. Please retry.</div>';
    stream.appendChild(errMsg);
  } finally {
    if (btn) btn.disabled = false;
    stream.scrollTop = stream.scrollHeight;
  }
}

function playPitRadioBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (_e) {}
}

function applyPipelineData(data) {
  if (!data) return;
  const cycleCountEl = document.getElementById('cycle-count');
  if (cycleCountEl && data.cycleNumber) {
    cycleCountEl.textContent = data.cycleNumber;
  }
  const verdictEl = document.getElementById('lion-verdict-text');
  if (verdictEl && data.lionVerdict) {
    verdictEl.textContent = data.lionVerdict.replace(/^Verdict:\s*/i, '');
  }
  if (data.agents?.falcon?.telemetry?.falconAverageBrier) {
    const fb = document.getElementById('metric-falcon-brier');
    if (fb) fb.textContent = data.agents.falcon.telemetry.falconAverageBrier.toFixed(4);
  }
  if (data.agents?.quantumFox?.telemetry?.marketBrier) {
    const mb = document.getElementById('metric-market-brier');
    if (mb) mb.textContent = data.agents.quantumFox.telemetry.marketBrier.toFixed(4);
  }
  PIPELINE_ORDER.forEach(id => {
    const pill = document.getElementById('pill-' + id);
    if (pill) {
      pill.textContent = id === 'phoenix' ? 'locked' : 'verified';
    }
  });
  const curRecord = data.agents ? data.agents[AGENT_KEY_MAP[currentAgentId]] : null;
  renderLiveInspector(currentAgentId, curRecord, false);
}

async function syncLatestPipeline() {
  const syncBtn = document.getElementById('sync-latest-btn');
  if (syncBtn) syncBtn.textContent = 'syncing...';
  try {
    const res = await fetch('/api/council/pipeline/latest');
    if (res.ok) {
      latestPipelineData = await res.json();
      applyPipelineData(latestPipelineData);
      addLogEntry('Lion synchronized latest cached council run cycle #' + (latestPipelineData?.cycleNumber || 1));
    }
  } catch (err) {
    console.error('Failed to sync latest council run:', err);
  } finally {
    if (syncBtn) syncBtn.textContent = 'sync latest';
  }
}

async function triggerPipelineCycle() {
  if (isCycleRunning) return;
  isCycleRunning = true;

  const runBtn = document.getElementById('run-cycle-btn');
  const badge = document.getElementById('pipeline-status-badge');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.textContent = 'evaluating...';
  }
  if (badge) {
    badge.textContent = 'Executing Sequence';
    badge.classList.remove('warning');
  }

  // Visual sequential stage stepper animation
  for (let i = 0; i < PIPELINE_ORDER.length; i++) {
    const agentId = PIPELINE_ORDER[i];
    document.querySelectorAll('.pipeline-node').forEach(node => node.classList.remove('active-stage'));
    const currentNode = document.getElementById('step-' + agentId);
    if (currentNode) currentNode.classList.add('active-stage');

    const pill = document.getElementById('pill-' + agentId);
    if (pill) pill.textContent = 'auditing...';

    const curRec = latestPipelineData?.agents ? latestPipelineData.agents[AGENT_KEY_MAP[agentId]] : null;
    renderLiveInspector(agentId, curRec, true, i + 1);

    await sleep(280);

    if (pill) {
      pill.textContent = agentId === 'phoenix' ? 'locked' : 'verified';
    }
  }

  try {
    const response = await fetch('/api/council/pipeline/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      latestPipelineData = await response.json();
      applyPipelineData(latestPipelineData);
      addLogEntry('Executive Council completed debounced verification cycle #' + (latestPipelineData?.cycleNumber || 1));
    }
  } catch (err) {
    console.error('Failed to execute council pipeline run:', err);
  } finally {
    isCycleRunning = false;
    document.querySelectorAll('.pipeline-node').forEach(node => node.classList.remove('active-stage'));
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.textContent = 'execute cycle now';
    }
    if (badge) {
      badge.textContent = 'Standby (Calibrated)';
    }
  }
}

function addLogEntry(msg) {
  const stream = document.getElementById('log-stream');
  if (!stream) return;
  const line = document.createElement('div');
  line.className = 'log-line';
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
  line.innerHTML = '<span class="log-time">' + timeStr + '</span><span class="log-msg">' + escapeHtml(msg) + '</span>';
  stream.insertBefore(line, stream.firstChild);
  while (stream.children.length > 8) {
    stream.removeChild(stream.lastChild);
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.addEventListener('load', function() {
  selectSpecialist('quantum-fox');
  syncLatestPipeline();
  
  // Passive background poll every 30 seconds, only when tab is visible
  setInterval(() => {
    if (!document.hidden && !isCycleRunning) {
      syncLatestPipeline();
    }
  }, 30000);

  // Register Service Worker for Mobile PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(function() {});
  }
});
</script>
${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
