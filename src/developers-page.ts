/**
 * QuanterraOS Developers & API Page (/developers)
 *
 * Implements Part 2.1 & 3.10:
 * - OpenAPI 3.1 spec overview
 * - Remote Model Context Protocol (MCP) endpoint (/mcp)
 * - LLM agent integration (llms.txt, agents.md)
 * - Free API key tier (1,000 req/mo) & quickstarts (curl, Python, TypeScript)
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export function renderDevelopersPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Developer API, OpenAPI &amp; MCP — QuanterraOS</title>
  <meta name="description" content="OpenAPI 3.1 REST specs, Model Context Protocol (MCP) remote endpoints, and Python/TypeScript SDKs for prediction market telemetry.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #000000; color: #FFFFFF; font-family: var(--public-font-sans); }
    .dev-container { max-width: 1100px; margin: 0 auto; padding: 64px 24px 96px; }
    .dev-hero { max-width: 760px; margin-bottom: 48px; }
    .dev-eyebrow { font-family: var(--public-font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--public-accent-gold); letter-spacing: 0.12em; margin-bottom: 12px; }
    .dev-title { font-size: clamp(2rem, 4.5vw, 3.2rem); font-weight: 700; letter-spacing: -0.02em; margin-bottom: 16px; }
    .dev-lead { font-size: 1.05rem; color: var(--public-muted); line-height: 1.6; }
    .code-block { background: rgba(14, 17, 24, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 18px; font-family: var(--public-font-mono); font-size: 0.84rem; color: #38BDF8; overflow-x: auto; margin-bottom: 28px; line-height: 1.6; }
    .dev-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 48px; }
    .dev-card { background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 24px; }
    .dev-card h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 10px; color: #FFF; }
    .dev-card p { font-size: 0.88rem; color: var(--public-muted); line-height: 1.5; margin-bottom: 16px; }
    .dev-link { color: var(--public-accent-gold); font-size: 0.85rem; font-weight: 600; text-decoration: none; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/developers" })}

  <main class="dev-container">
    <div class="dev-hero">
      <div class="dev-eyebrow">Developer Platform · Machine Interfaces</div>
      <h1 class="dev-title">Programmatic Telemetry &amp; MCP for AI Agents</h1>
      <p class="dev-lead">
        Equip your quantitative strategies, autonomous agents, and bots with true-cost fee calculations, live settlement TWAP progression, and empirical calibration scores.
      </p>
    </div>

    <!-- Quickstart Code Sample -->
    <div style="font-family:var(--public-font-mono); font-size:0.75rem; color:var(--public-muted); margin-bottom:8px; text-transform:uppercase;">
      REST API Quickstart (cURL)
    </div>
    <div class="code-block">
# Fetch live settlement radar &amp; 60s TWAP progression
curl -s "https://quanterraos.com/api/v1/radar/KXBTC15M" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Compute True-Cost, Taker Fee &amp; Breakeven Hurdle
curl -X POST "https://quanterraos.com/api/v1/fees/check" \\
  -H "Content-Type: application/json" \\
  -d '{"venue":"kalshi","product":"KXBTC15M","price":0.50,"contracts":100}'
    </div>

    <div class="dev-grid">
      <!-- 1. OpenAPI 3.1 -->
      <div class="dev-card">
        <h3>OpenAPI 3.1 Specification</h3>
        <p>Complete machine-readable JSON schema defining all REST telemetry endpoints, parameters, and response structures.</p>
        <a href="/api-docs" class="dev-link">Explore OpenAPI Schema &rarr;</a>
      </div>

      <!-- 2. Remote MCP Endpoint -->
      <div class="dev-card">
        <h3>Model Context Protocol (MCP)</h3>
        <p>Connect Claude, Cursor, or sovereign AI agents directly to QuanterraOS tools via standardized JSON-RPC MCP server.</p>
        <a href="/api/mcp/manifest" class="dev-link">View MCP Manifest &rarr;</a>
      </div>

      <!-- 3. LLMs Context -->
      <div class="dev-card">
        <h3>Agent Context Files</h3>
        <p>Direct consumption targets formatted for Large Language Models to read fee schedules and settlement rules without scraping.</p>
        <a href="/llms.txt" class="dev-link" target="_blank">Read llms.txt &rarr;</a>
      </div>

      <!-- 4. Free API Tier -->
      <div class="dev-card">
        <h3>Free API Access Key</h3>
        <p>Includes 1,000 requests/month with delayed settlement radar and fee computation endpoints for personal backtests.</p>
        <a href="/deck" class="dev-link">Generate Developer Key &rarr;</a>
      </div>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
