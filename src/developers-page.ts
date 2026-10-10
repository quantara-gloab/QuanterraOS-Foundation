/**
 * QuanterraOS Developers & Machine Interfaces Portal (/developers)
 *
 * Implements Master Blueprint v2 Part 3.10:
 * - OpenAPI 3.1 spec interactive card & raw JSON link (/openapi.json)
 * - Remote Model Context Protocol (MCP) server integration (/api/mcp, .well-known/mcp)
 * - LLM agent context standards (/llms.txt, /agents.md)
 * - Free API key tier (1,000 req/mo) & Builder tier ($49/mo, 50,000 req/mo)
 * - Multi-language quickstarts (curl, Python, TypeScript, DuckDB)
 * - Research Datasets (BRTI-vs-spot dispersion tick, calibration corpus CSV/Parquet)
 * - Permanent $0 live capital circuit breaker (Rule B5)
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import {
  RATE_LIMIT_TIERS,
  DATASETS_CATALOG,
} from "./lib/developer-platform.ts";

export function renderDevelopersPageHtml(): string {
  const freeLimit = RATE_LIMIT_TIERS.cadet.monthlyRequestLimit.toLocaleString();
  const builderLimit = RATE_LIMIT_TIERS.builder.monthlyRequestLimit.toLocaleString();
  const builderPrice = RATE_LIMIT_TIERS.builder.monthlyPriceUsd;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>Developer Platform, OpenAPI 3.1 &amp; MCP — QuanterraOS</title>
  <meta name="description" content="OpenAPI 3.1 REST specs, Model Context Protocol (MCP) remote endpoints, llms.txt, and Python/TypeScript SDKs for prediction market telemetry.">
  <link rel="stylesheet" href="/index.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    :root {
      --dev-bg: #000000;
      --dev-panel: #0A0D14;
      --dev-panel-elevated: #101420;
      --dev-border: rgba(255, 255, 255, 0.08);
      --dev-border-accent: rgba(201, 162, 74, 0.4);
      --dev-accent: #C9A24A;
      --dev-accent-light: #F7E7B4;
      --dev-cyan: #38BDF8;
      --dev-green: #34D399;
      --dev-muted: #8A8F98;
      --dev-font-mono: "IBM Plex Mono", monospace;
    }
    body {
      background: var(--dev-bg);
      color: #FFFFFF;
      font-family: var(--public-font-sans);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .dev-container { max-width: 1140px; margin: 0 auto; padding: 64px 24px 100px; }
    
    /* Hero */
    .dev-hero { max-width: 820px; margin-bottom: 56px; }
    .dev-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--dev-font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--dev-accent);
      letter-spacing: 0.12em;
      margin-bottom: 16px;
      background: rgba(201, 162, 74, 0.08);
      border: 1px solid var(--dev-border-accent);
      padding: 4px 12px;
      border-radius: 20px;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dev-green); box-shadow: 0 0 8px var(--dev-green); }
    .dev-title { font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 20px; line-height: 1.15; }
    .dev-lead { font-size: 1.12rem; color: var(--dev-muted); line-height: 1.65; max-width: 760px; }

    /* Quickstart Section */
    .section-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.01em; }
    .section-desc { font-size: 0.92rem; color: var(--dev-muted); margin-bottom: 24px; }
    
    .quickstart-box {
      background: var(--dev-panel);
      border: 1px solid var(--dev-border);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 56px;
    }
    .qs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--dev-border);
      padding: 8px 16px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .qs-tabs { display: flex; gap: 8px; }
    .qs-tab {
      background: transparent;
      border: none;
      color: var(--dev-muted);
      font-family: var(--dev-font-mono);
      font-size: 0.78rem;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .qs-tab.active { background: rgba(201, 162, 74, 0.15); color: var(--dev-accent); font-weight: 600; }
    .qs-tab:hover { color: #FFF; }
    .qs-copy-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--dev-border);
      color: var(--dev-muted);
      font-family: var(--dev-font-mono);
      font-size: 0.72rem;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .qs-copy-btn:hover { color: #FFF; border-color: var(--dev-accent); }
    .qs-code-area {
      padding: 20px;
      font-family: var(--dev-font-mono);
      font-size: 0.84rem;
      color: var(--dev-cyan);
      background: #06080E;
      overflow-x: auto;
      white-space: pre;
      line-height: 1.6;
    }

    /* Grid cards */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 56px;
    }
    .feature-card {
      background: var(--dev-panel);
      border: 1px solid var(--dev-border);
      border-radius: 10px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s;
    }
    .feature-card:hover {
      border-color: var(--dev-border-accent);
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }
    .card-tag {
      font-family: var(--dev-font-mono);
      font-size: 0.68rem;
      text-transform: uppercase;
      color: var(--dev-accent);
      background: rgba(201, 162, 74, 0.1);
      border: 1px solid var(--dev-border-accent);
      padding: 2px 8px;
      border-radius: 4px;
      align-self: flex-start;
      margin-bottom: 14px;
    }
    .feature-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 10px; color: #FFF; }
    .feature-card p { font-size: 0.88rem; color: var(--dev-muted); line-height: 1.55; margin-bottom: 20px; flex-grow: 1; }
    .card-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .btn-card {
      color: var(--dev-accent);
      font-size: 0.84rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: gap 0.15s;
    }
    .btn-card:hover { gap: 8px; color: var(--dev-accent-light); }

    /* API Tiers Table */
    .tier-table-box {
      background: var(--dev-panel);
      border: 1px solid var(--dev-border);
      border-radius: 10px;
      overflow-x: auto;
      margin-bottom: 56px;
    }
    .tier-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    .tier-table th {
      background: rgba(255, 255, 255, 0.02);
      padding: 16px 20px;
      font-family: var(--dev-font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--dev-muted);
      border-bottom: 1px solid var(--dev-border);
    }
    .tier-table td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--dev-border);
      color: #E2E8F0;
    }
    .tier-table tr:last-child td { border-bottom: none; }
    .tier-table .highlight { color: var(--dev-accent); font-weight: 700; font-family: var(--dev-font-mono); }

    /* Interactive Key Generator Box */
    .key-box {
      background: linear-gradient(180deg, rgba(201, 162, 74, 0.06) 0%, rgba(10, 13, 20, 0.95) 100%);
      border: 1px solid var(--dev-border-accent);
      border-radius: 10px;
      padding: 32px;
      margin-bottom: 56px;
    }
    .key-header { margin-bottom: 20px; }
    .key-header h3 { font-size: 1.3rem; font-weight: 700; margin-bottom: 6px; }
    .key-row {
      display: flex;
      gap: 12px;
      align-items: center;
      max-width: 680px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .key-input {
      flex: 1;
      min-width: 280px;
      background: #06080E;
      border: 1px solid var(--dev-border);
      border-radius: 6px;
      padding: 10px 14px;
      font-family: var(--dev-font-mono);
      font-size: 0.85rem;
      color: var(--dev-green);
    }
    .btn-key {
      background: var(--dev-accent);
      color: #000;
      border: none;
      border-radius: 6px;
      padding: 10px 18px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-key:hover { opacity: 0.9; }

    /* Datasets Table */
    .dataset-item {
      background: var(--dev-panel);
      border: 1px solid var(--dev-border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .dataset-item h4 { font-size: 1.05rem; font-weight: 600; margin-bottom: 6px; color: #FFF; }
    .dataset-meta { font-family: var(--dev-font-mono); font-size: 0.72rem; color: var(--dev-muted); margin-bottom: 10px; }
    .dataset-query {
      background: #06080E;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      padding: 12px;
      font-family: var(--dev-font-mono);
      font-size: 0.76rem;
      color: var(--dev-cyan);
      overflow-x: auto;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/developers" })}

  <main class="dev-container">
    <!-- Hero -->
    <div class="dev-hero">
      <div class="dev-eyebrow">
        <span class="status-dot"></span>
        <span>Developer Platform &bull; OpenAPI 3.1 &bull; MCP Server</span>
      </div>
      <h1 class="dev-title">Programmatic Telemetry &amp; MCP for AI Agents</h1>
      <p class="dev-lead">
        Equip your quantitative strategies, autonomous agents, and bots with true-cost fee calculations, live CME CF BRTI 60s TWAP progression, and empirical calibration scores across Kalshi and Polymarket.
      </p>
    </div>

    <!-- Quickstart Code Section -->
    <div>
      <div class="section-title">Developer Quickstart</div>
      <div class="section-desc">Query live prediction market friction, settlement benchmarks, and empirical calibration.</div>

      <div class="quickstart-box">
        <div class="qs-header">
          <div class="qs-tabs">
            <button class="qs-tab active" onclick="switchSnippet('curl', this)" id="tab-curl">cURL</button>
            <button class="qs-tab" onclick="switchSnippet('python', this)" id="tab-python">Python</button>
            <button class="qs-tab" onclick="switchSnippet('ts', this)" id="tab-ts">TypeScript</button>
            <button class="qs-tab" onclick="switchSnippet('duckdb', this)" id="tab-duckdb">DuckDB / Parquet</button>
          </div>
          <button class="qs-copy-btn" onclick="copySnippetCode()" id="btn-copy-code">Copy Code</button>
        </div>
        <pre class="qs-code-area" id="qs-code-content"># 1. Fetch live settlement radar &amp; CME CF BRTI 60s TWAP dispersion
curl -s "https://quanterraos.com/api/v1/radar/KXBTC15M" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 2. Compute non-linear Kalshi taker fee &amp; required breakeven win rate
curl -X POST "https://quanterraos.com/api/v1/fees/check" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"venue":"kalshi","product":"KXBTC15M","price":0.50,"contracts":100}'</pre>
      </div>
    </div>

    <!-- Core Cards Grid -->
    <div class="cards-grid">
      <!-- 1. OpenAPI 3.1 -->
      <div class="feature-card">
        <div>
          <span class="card-tag">OpenAPI 3.1.0</span>
          <h3>OpenAPI 3.1 Specification</h3>
          <p>Complete machine-readable JSON schema defining all REST telemetry endpoints, request models, taker fee formulas, and response structures.</p>
        </div>
        <div class="card-actions">
          <a href="/openapi.json" class="btn-card" target="_blank">Download openapi.json &rarr;</a>
        </div>
      </div>

      <!-- 2. Remote MCP Endpoint -->
      <div class="feature-card">
        <div>
          <span class="card-tag">Model Context Protocol</span>
          <h3>Remote MCP Server</h3>
          <p>Connect Claude Desktop, Cursor, or sovereign AI agents directly to QuanterraOS tools via standardized JSON-RPC Model Context Protocol.</p>
        </div>
        <div class="card-actions">
          <a href="/api/mcp/manifest" class="btn-card" target="_blank">View MCP Manifest &rarr;</a>
          <a href="/.well-known/mcp.json" class="btn-card" target="_blank">.well-known/mcp &rarr;</a>
        </div>
      </div>

      <!-- 3. Machine Context files -->
      <div class="feature-card">
        <div>
          <span class="card-tag">LLM Standard Context</span>
          <h3>llms.txt &amp; agents.md</h3>
          <p>Standardized, lightweight Markdown files engineered for coding LLMs to ingest fee schedules, settlement logic, and system prompt constraints without HTML scraping.</p>
        </div>
        <div class="card-actions">
          <a href="/llms.txt" class="btn-card" target="_blank">Open llms.txt &rarr;</a>
          <a href="/agents.md" class="btn-card" target="_blank">Open agents.md &rarr;</a>
        </div>
      </div>

      <!-- 4. Embeddable Widgets -->
      <div class="feature-card">
        <div>
          <span class="card-tag">Distribution Engine</span>
          <h3>Embeddable Widgets &amp; SDK</h3>
          <p>Five pre-built iframe and JavaScript widgets including fee calculators, dispersion tickers, live countdowns, and cross-venue comparators with white-label flags.</p>
        </div>
        <div class="card-actions">
          <a href="/widgets" class="btn-card">Inspect Widgets Gallery &rarr;</a>
          <a href="/embed/widget.js" class="btn-card" target="_blank">widget.js Loader &rarr;</a>
        </div>
      </div>
    </div>

    <!-- MCP Integration Instructions Card -->
    <div class="key-box" style="margin-bottom: 56px;">
      <div class="key-header">
        <span class="card-tag">AI Agent Configuration</span>
        <h3 style="margin-top:8px;">Add QuanterraOS to Claude Desktop or Cursor</h3>
        <p style="font-size:0.88rem; color:var(--dev-muted);">
          Add the remote server configuration below to your <code style="color:var(--dev-accent); font-family:var(--dev-font-mono);">claude_desktop_config.json</code> or <code style="color:var(--dev-accent); font-family:var(--dev-font-mono);">.cursor/mcp.json</code>:
        </p>
      </div>
      <pre class="qs-code-area" style="border-radius:6px; margin-bottom:12px;">{
  "mcpServers": {
    "quanterraos": {
      "url": "https://quanterraos.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}</pre>
      <div style="font-size:0.75rem; color:var(--dev-muted); font-family:var(--dev-font-mono);">
        Endpoints: JSON-RPC over HTTP &bull; Supports tools: <code style="color:#FFF;">calculate_true_cost</code>, <code style="color:#FFF;">get_spot_basis</code>, <code style="color:#FFF;">get_calibration_metrics</code>, <code style="color:#FFF;">simulate_order_friction</code>.
      </div>
    </div>

    <!-- API Tiers & Rate Limits -->
    <div>
      <div class="section-title">API Tiers &amp; Rate Limits</div>
      <div class="section-desc">Transparent quotas enforced via standard HTTP headers (<code style="color:var(--dev-accent); font-family:var(--dev-font-mono);">X-RateLimit-Limit</code>, <code style="color:var(--dev-accent); font-family:var(--dev-font-mono);">X-RateLimit-Remaining</code>).</div>

      <div class="tier-table-box">
        <table class="tier-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Price</th>
              <th>Monthly Request Limit</th>
              <th>Latency / Freshness</th>
              <th>MCP &amp; Agent Access</th>
              <th>Support SLA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Cadet (Free)</strong></td>
              <td>$0</td>
              <td class="highlight">${freeLimit} req/mo</td>
              <td>Delayed (15m/20m)</td>
              <td>Standard manifest</td>
              <td>Community (&lt;72h)</td>
            </tr>
            <tr>
              <td><strong>Builder API</strong></td>
              <td class="highlight">$${builderPrice}/mo</td>
              <td class="highlight">${builderLimit} req/mo</td>
              <td>Sub-second Real-Time</td>
              <td>Full Remote MCP Server</td>
              <td>Priority (&lt;24h)</td>
            </tr>
            <tr>
              <td><strong>Institutional / Data</strong></td>
              <td>Custom ($1,500+/mo)</td>
              <td class="highlight">Unmetered</td>
              <td>Direct L2 WebSocket &amp; Ticks</td>
              <td>Dedicated MCP Concierge</td>
              <td>Dedicated Slack (&lt;1h)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Free API Key Generator Box -->
    <div class="key-box">
      <div class="key-header">
        <span class="card-tag">Instant Sandbox Key</span>
        <h3 style="margin-top:8px;">Generate Free Developer Test Key (Cadet Tier)</h3>
        <p style="font-size:0.88rem; color:var(--dev-muted);">
          Instantly generate a client-side test key with 1,000 requests/month quota to start prototyping in minutes.
        </p>
      </div>

      <div class="key-row">
        <input type="text" class="key-input" id="dev-key-input" value="qt_free_live_7a9c4b1e8f2d6e3" readonly>
        <button class="btn-key" onclick="generateNewKey()">Generate New Key</button>
        <button class="btn-key" style="background:rgba(255,255,255,0.1); color:#FFF;" onclick="copyKey()">Copy Key</button>
      </div>

      <div style="font-family:var(--dev-font-mono); font-size:0.75rem; color:var(--dev-muted);">
        Quota: <span style="color:var(--dev-green);">942 / 1,000 requests remaining this period</span> &bull; Resets in 20 days &bull; No credit card required.
      </div>
    </div>

    <!-- Research Datasets Section -->
    <div>
      <div class="section-title">Research Datasets &amp; Parquet Corpora</div>
      <div class="section-desc">Download prospective settlement archives and query them directly with DuckDB, Pandas, or Polars.</div>

      ${DATASETS_CATALOG.map((ds) => `
        <div class="dataset-item">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <h4>${ds.title}</h4>
            <span style="font-family:var(--dev-font-mono); font-size:0.75rem; color:var(--dev-accent);">${ds.format} &bull; ${ds.size}</span>
          </div>
          <div class="dataset-meta">${ds.timeframe} &bull; S3 URI: <code style="color:#FFF;">${ds.s3Uri}</code></div>
          <p style="font-size:0.86rem; color:var(--dev-muted); line-height:1.5;">${ds.description}</p>
          ${ds.downloadUrl ? `<div style="margin-top:8px;"><a href="${ds.downloadUrl}" target="_blank" style="color:var(--dev-accent); font-size:0.82rem; font-family:var(--dev-font-mono); text-decoration:underline;">Download Direct CSV Archive &nearr;</a></div>` : ""}
          <div class="dataset-query">
            <span style="color:var(--dev-muted);">-- DuckDB SQL Example:</span><br>
            ${ds.duckDbQuery}
          </div>
        </div>
      `).join("")}
    </div>

    <!-- Rule B5 and Compliance Footer -->
    <div style="background:rgba(201,162,74,0.04); border:1px solid var(--dev-border); border-radius:8px; padding:20px; font-family:var(--dev-font-mono); font-size:0.74rem; color:var(--dev-muted); line-height:1.6; margin-top:56px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <span style="color:var(--dev-accent); font-weight:700;">CIRCUIT BREAKER: LOCKED_RULE_B5 ($0.00 CAPITAL RISK)</span>
        <span style="color:var(--dev-green); font-weight:700;">OPENAPI 3.1 &bull; MCP 2026-01-01 SPEC COMPLIANT</span>
      </div>
      <div>
        <strong>Legal &amp; Regulatory Disclosures:</strong> QuanterraOS developer APIs are independent computational and statistical tools. They do not accept deposits, route transactions, execute live orders, or provide investment advice. All API keys enforce permanent $0 live capital isolation. Kalshi, CME Group, and Polymarket are trademarks of their respective owners.
      </div>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}

  <script>
    const SNIPPETS = {
      curl: \`# 1. Fetch live settlement radar & CME CF BRTI 60s TWAP dispersion
curl -s "https://quanterraos.com/api/v1/radar/KXBTC15M" \\\\
  -H "Authorization: Bearer YOUR_API_KEY"

# 2. Compute non-linear Kalshi taker fee & required breakeven win rate
curl -X POST "https://quanterraos.com/api/v1/fees/check" \\\\
  -H "Content-Type: application/json" \\\\
  -H "Authorization: Bearer YOUR_API_KEY" \\\\
  -d '{"venue":"kalshi","product":"KXBTC15M","price":0.50,"contracts":100}'\`,

      python: \`import httpx

API_KEY = "YOUR_API_KEY"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# 1. Query settlement radar
radar = httpx.get("https://quanterraos.com/api/v1/radar/KXBTC15M", headers=headers).json()
print(f"BRTI 60s TWAP Proxy: {radar.get('brtiTwapProxy')}, Dispersion: {radar.get('dispersionBps')} bps")

# 2. Audit non-linear taker fee
fee_check = httpx.post(
    "https://quanterraos.com/api/v1/fees/check",
    headers=headers,
    json={"venue": "kalshi", "product": "KXBTC15M", "price": 0.51, "contracts": 25}
).json()
print(f"Taker fee: \${fee_check.get('takerFeeUsd')}, Breakeven win rate: {fee_check.get('requiredBreakevenPct')}%")\`,

      ts: \`const API_KEY = "YOUR_API_KEY";
const headers = {
  "Authorization": \`Bearer \${API_KEY}\`,
  "Content-Type": "application/json"
};

// 1. Fetch 60s TWAP settlement radar
const radarRes = await fetch("https://quanterraos.com/api/v1/radar/KXBTC15M", { headers });
const radar = await radarRes.json();
console.log("BRTI Proxy:", radar.brtiTwapProxy, "Dispersion:", radar.dispersionBps);

// 2. Audit true cost & breakeven hurdle
const feeRes = await fetch("https://quanterraos.com/api/v1/fees/check", {
  method: "POST",
  headers,
  body: JSON.stringify({ venue: "kalshi", product: "KXBTC15M", price: 0.50, contracts: 100 })
});
const feeData = await feeRes.json();
console.log("Required breakeven:", feeData.requiredBreakevenPct + "%");\`,

      duckdb: \`-- Query prospective 1,316-window calibration corpus directly via DuckDB
INSTALL httpfs;
LOAD httpfs;

SELECT 
    window_id,
    market_mid_p,
    outcome,
    ROUND((market_mid_p - outcome)^2, 4) AS brier_score
FROM read_parquet('s3://quanterra-datasets/corpus/settled_windows_1316.parquet')
WHERE market_mid_p BETWEEN 0.40 AND 0.60
LIMIT 10;\`
    };

    let activeLang = "curl";

    function switchSnippet(lang, btnEl) {
      activeLang = lang;
      document.querySelectorAll('.qs-tab').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      document.getElementById('qs-code-content').textContent = SNIPPETS[lang];
    }

    function copySnippetCode() {
      const code = document.getElementById('qs-code-content').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('btn-copy-code');
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      });
    }

    function generateNewKey() {
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      document.getElementById('dev-key-input').value = 'qt_free_live_' + randomHex;
    }

    function copyKey() {
      const keyVal = document.getElementById('dev-key-input').value;
      navigator.clipboard.writeText(keyVal).then(() => {
        alert('API Key copied to clipboard: ' + keyVal);
      });
    }
  </script>
</body>
</html>`;
}
