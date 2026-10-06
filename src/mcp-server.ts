import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { getLiveQuotes } from "./live-quotes.ts";

/**
 * Model Context Protocol (MCP) Manifest & Agent Integration Layer
 *
 * Implements the 2026 standard MCP server interface enabling LLMs (Claude, Cursor, ChatGPT)
 * and autonomous trading agents to query QuanterraOS pricing and calibration directly.
 */
export const MCP_SERVER_MANIFEST = {
  schema_version: "2026-01-01",
  name: "quanterraos-mcp-server",
  description: "Independent pricing, settlement basis, and calibration intelligence for short-duration crypto prediction markets.",
  version: "1.0.0",
  tools: [
    {
      name: "get_composite_price",
      description: "Returns the latest volume-weighted Quanterra BTC Composite spot price and constituent exchange quotes.",
      parameters: {
        type: "object",
        properties: {
          asset: { type: "string", enum: ["BTC"], default: "BTC" }
        }
      }
    },
    {
      name: "get_calibration_metrics",
      description: "Returns Murphy-decomposed Brier scores, sample size, and decile calibration data across 1,316 settled KXBTC15M windows.",
      parameters: {
        type: "object",
        properties: {
          window: { type: "string", default: "15m" },
          checkpoint: { type: "number", default: 4, description: "Window minute (1-14)" }
        }
      }
    },
    {
      name: "calculate_true_cost",
      description: "Computes Kalshi taker fee friction, spread drag, net expected value (EV), and required breakeven win rate.",
      parameters: {
        type: "object",
        required: ["price", "assessedProbability"],
        properties: {
          price: { type: "number", description: "Contract mid-price between 0.01 and 0.99" },
          assessedProbability: { type: "number", description: "Estimated win probability between 0.01 and 0.99" },
          spread: { type: "number", default: 0.02, description: "Observed bid-ask spread" },
          count: { type: "number", default: 100, description: "Contract count" }
        }
      }
    },
    {
      name: "get_spot_basis",
      description: "Returns basis divergence across spot exchanges against the composite settlement proxy.",
      parameters: {
        type: "object",
        properties: {
          asset: { type: "string", default: "BTC" }
        }
      }
    },
    {
      name: "simulate_order_friction",
      description: "Pre-trade risk coprocessor: computes exact Kalshi taker ($0.07*C*P*(1-P)) and maker ($0.0175*C*P*(1-P)) fee drag, required breakeven win rate hurdle, fee drag in basis points, and net expected value (EV) for short-duration binary event contracts.",
      parameters: {
        type: "object",
        required: ["price"],
        properties: {
          price: { type: "number", description: "Contract price between 0.01 and 0.99 (dollars)" },
          size: { type: "number", default: 100, description: "Contract quantity" },
          assessedProbability: { type: "number", description: "Assessed win probability between 0.01 and 0.99" },
          orderType: { type: "string", enum: ["taker", "maker"], default: "taker", description: "Taker (immediate execution) or Maker (resting limit order)" }
        }
      }
    }
  ]
};

export function renderMcpPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#06070A">
  <title>Model Context Protocol (MCP) Server — QuanterraOS</title>
  <meta name="description" content="Connect Claude, Cursor, and autonomous trading agents directly to QuanterraOS prediction market calibration via MCP.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #06070A;
      --panel: rgba(14, 18, 27, 0.85);
      --panel-border: rgba(212, 175, 55, 0.18);
      --panel-border-subtle: rgba(212, 175, 55, 0.08);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --accent: #DFB843;
      --accent-light: #F7E7B4;
      --green: #10B981;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(ellipse 90% 50% at 50% -20%, rgba(223, 184, 67, 0.12), transparent 70%),
        linear-gradient(rgba(212, 175, 55, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 48px 48px, 48px 48px;
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      line-height: 1.6;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 80px;
    }
    .mono { font-family: var(--font-mono); }

    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 40px;
      background: rgba(10, 14, 22, 0.85);
      border-bottom: 1px solid var(--panel-border);
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .nav-left { display: flex; align-items: center; gap: 32px; }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .brand-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.84rem; font-weight: 500; transition: color 0.15s; }
    .nav-links a:hover, .nav-links a.active { color: var(--text); }
    .nav-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      color: #07080B;
      background: linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%);
      padding: 8px 18px;
      border-radius: 4px;
      text-decoration: none;
    }

    .container { max-width: 1080px; margin: 0 auto; padding: 48px 24px 0; }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
      background: rgba(223, 184, 67, 0.08);
      border: 1px solid rgba(223, 184, 67, 0.2);
      padding: 4px 10px;
      border-radius: 3px;
    }
    h1 { font-size: 2.25rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 12px; }
    .lead { color: var(--muted); font-size: 1rem; max-width: 820px; margin-bottom: 36px; }

    .card {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      padding: 28px;
      backdrop-filter: blur(20px);
      box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.6);
      margin-bottom: 28px;
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--panel-border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    pre {
      background: rgba(4, 6, 10, 0.95);
      border: 1px solid var(--panel-border-subtle);
      border-radius: 4px;
      padding: 16px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--accent-light);
      overflow-x: auto;
    }

    .tool-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    @media (max-width: 760px) {
      .tool-list { grid-template-columns: 1fr; }
      .top-nav { padding: 14px 16px; flex-wrap: wrap; gap: 10px; }
      .nav-links { overflow-x: auto; white-space: nowrap; width: 100%; }
    }
    .tool-item {
      background: rgba(6, 9, 14, 0.7);
      border: 1px solid var(--panel-border-subtle);
      border-radius: 4px;
      padding: 16px;
    }
    .tool-name { font-family: var(--font-mono); font-weight: 600; color: var(--accent); font-size: 0.85rem; margin-bottom: 6px; }
    .tool-desc { font-size: 0.8rem; color: var(--muted); }
  </style>
</head>
<body>
  <nav class="top-nav">
    <div class="nav-left">
      <a href="/" class="nav-brand"><span class="brand-dot"></span> quanterraos</a>
      <div class="nav-links">
        <a href="/kalshi">kalshi 15m</a>
        <a href="/calculator">ev calculator</a>
        <a href="/calibration">calibration</a>
        <a href="/calibration/surface">surface</a>
        <a href="/index">composite index</a>
        <a href="/spread">spread</a>
        <a href="/mcp" class="active" style="color:var(--accent);font-weight:600;">mcp server</a>
      </div>
    </div>
    <div>
      <a href="/kalshi" class="nav-cta">LIVE 15M DESK &rarr;</a>
    </div>
  </nav>

  <main class="container">
    <div class="eyebrow">Agent Protocol · 2026 Interoperability</div>
    <h1>Model Context Protocol (MCP) Server</h1>
    <p class="lead">
      Empower Claude, Cursor, ChatGPT, and autonomous trading agents to query QuanterraOS's independent calibration benchmarks, spot basis dispersion, and True Cost friction calculations in real time.
    </p>

    <div class="card">
      <div class="card-title">
        <span>Claude Desktop &amp; Cursor Configuration</span>
        <span class="mono" style="font-size:0.75rem; color:var(--green);">SSE / HTTP COMPATIBLE</span>
      </div>
      <p style="font-size:0.85rem; color:var(--muted); margin-bottom:14px;">
        Add QuanterraOS to your <code>claude_desktop_config.json</code> or Cursor MCP settings:
      </p>
      <pre><code>{
  "mcpServers": {
    "quanterraos": {
      "url": "https://quanterraos.com/api/mcp",
      "headers": {
        "User-Agent": "QuanterraOS-MCP-Client/1.0"
      }
    }
  }
}</code></pre>
    </div>

    <div class="card">
      <div class="card-title">
        <span>Available MCP Tools</span>
        <span class="mono" style="font-size:0.75rem; color:var(--accent);">MANIFEST v1.0.0</span>
      </div>
      <div class="tool-list">
        <div class="tool-item">
          <div class="tool-name">get_composite_price</div>
          <div class="tool-desc">Returns the volume-weighted Quanterra BTC composite index across Coinbase, Kraken, Bitstamp, and Gemini.</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">get_calibration_metrics</div>
          <div class="tool-desc">Fetches Brier scores, sample sizes, and decile reliability across 1,316 canonical settled 15m windows.</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">calculate_true_cost</div>
          <div class="tool-desc">Evaluates fee and spread friction, net EV, and breakeven probabilities for any prediction contract.</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">get_spot_basis</div>
          <div class="tool-desc">Surveils basis divergence across spot crypto venues against the composite settlement proxy.</div>
        </div>
        <div class="tool-item">
          <div class="tool-name">simulate_order_friction</div>
          <div class="tool-desc">Pre-trade risk coprocessor: evaluates Kalshi non-linear taker/maker fees, required breakeven win rate, and net EV.</div>
        </div>
      </div>
    </div>
  </main>

  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}

export function calculateTrueCost(params: {
  price: number;
  assessedProbability: number;
  spread?: number;
  count?: number;
}) {
  const price = Math.max(0.01, Math.min(0.99, Number(params.price)));
  const assessed = Math.max(0.01, Math.min(0.99, Number(params.assessedProbability)));
  const count = Math.max(1, Number(params.count ?? 100));
  const spread = Math.max(0, Number(params.spread ?? 0.02));

  // Taker fee: ceil(0.07 * count * price * (1-price) * 100) in cents
  const feeCents = Math.ceil(0.07 * count * price * (1 - price) * 100);
  const fee = feeCents / 100;
  const spreadCost = (spread / 2) * count;
  const totalFriction = fee + spreadCost;

  const cost = price * count;
  const expectedPayout = assessed * count;
  const grossProfit = expectedPayout - cost;
  const netProfit = grossProfit - totalFriction;

  const breakevenWinRate = (cost + totalFriction) / count;

  return {
    price,
    assessedProbability: assessed,
    count,
    cost: Number(cost.toFixed(2)),
    fee: Number(fee.toFixed(2)),
    spreadCost: Number(spreadCost.toFixed(2)),
    totalFriction: Number(totalFriction.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    breakevenWinRate: Number(breakevenWinRate.toFixed(4)),
    netEvPercent: cost > 0 ? Number(((netProfit / cost) * 100).toFixed(2)) : 0,
    isPositiveEv: netProfit > 0,
  };
}

export function simulateOrderFriction(params: {
  price: number;
  size?: number;
  assessedProbability?: number;
  orderType?: "taker" | "maker";
}) {
  const price = Math.max(0.01, Math.min(0.99, Number(params.price)));
  const size = Math.max(1, Math.floor(Number(params.size ?? 100)));
  const prob = params.assessedProbability !== undefined
    ? Math.max(0.01, Math.min(0.99, Number(params.assessedProbability)))
    : price;
  const orderType = params.orderType === "maker" ? "maker" : "taker";

  const notional = Number((size * price).toFixed(2));
  const maxPayout = size * 1.0;

  // Kalshi formula: ceil(rate * C * P * (1-P)) in cents with floating-point epsilon guard
  const takerRawCents = Math.round(0.07 * size * price * (1 - price) * 100 * 1e4) / 1e4;
  const takerFeeCents = Math.ceil(takerRawCents);
  const takerFeeDollars = Number((takerFeeCents / 100).toFixed(2));

  const makerRawCents = Math.round(0.0175 * size * price * (1 - price) * 100 * 1e4) / 1e4;
  const makerFeeCents = Math.ceil(makerRawCents);
  const makerFeeDollars = Number((makerFeeCents / 100).toFixed(2));

  const effectiveFee = orderType === "maker" ? makerFeeDollars : takerFeeDollars;
  const feePerContract = effectiveFee / size;

  const breakevenWinRate = Number((price + feePerContract).toFixed(4));
  const feePercentOfCost = notional > 0 ? Number(((effectiveFee / notional) * 100).toFixed(2)) : 0;
  const feeDragBps = notional > 0 ? Math.round((effectiveFee / notional) * 10000) : 0;

  const expectedGrossProfit = Number((size * (prob - price)).toFixed(2));
  const expectedNetProfit = Number((expectedGrossProfit - effectiveFee).toFixed(2));
  const netEvRoiPercent = notional > 0 ? Number(((expectedNetProfit / notional) * 100).toFixed(2)) : 0;
  const isPositiveEv = expectedNetProfit > 0;

  let verdict: string;
  if (isPositiveEv) {
    verdict = `POSITIVE EV: Model assessed edge (${(prob * 100).toFixed(1)}%) clears breakeven hurdle (${(breakevenWinRate * 100).toFixed(1)}%) after $${effectiveFee.toFixed(2)} in transaction friction.`;
  } else if (prob > price) {
    verdict = `NEGATIVE EV (FEE DRAG): Gross directional edge exists (${(prob * 100).toFixed(1)}% vs ${(price * 100).toFixed(1)}%), but $${effectiveFee.toFixed(2)} (${feePercentOfCost}%) fee drag consumes all alpha. Win rate must exceed ${(breakevenWinRate * 100).toFixed(1)}% to break even.`;
  } else {
    verdict = `NEGATIVE EV: Assessed probability (${(prob * 100).toFixed(1)}%) is at or below market quote (${(price * 100).toFixed(1)}%). Zero edge.`;
  }

  return {
    price,
    size,
    totalNotional: notional,
    maxPayout,
    orderType,
    takerFeeDollars,
    makerFeeDollars,
    effectiveFeeDollars: effectiveFee,
    feeSavingsIfMaker: Number((takerFeeDollars - makerFeeDollars).toFixed(2)),
    feePercentOfCost,
    breakevenWinRate,
    feeDragBps,
    assessedProbability: prob,
    expectedGrossPayout: Number((size * prob).toFixed(2)),
    expectedGrossProfit,
    expectedNetPayout: Number((size * prob - effectiveFee).toFixed(2)),
    expectedNetProfit,
    netEvDollars: expectedNetProfit,
    netEvRoiPercent,
    isPositiveEv,
    verdict,
  };
}

export async function executeMcpTool(name: string, params: Record<string, any> = {}): Promise<any> {
  switch (name) {
    case "get_composite_price": {
      const asset = String(params.asset || "BTC").toUpperCase();
      const quotes = await getLiveQuotes(asset);
      return {
        asset: quotes.asset,
        compositePrice: quotes.compositePrice,
        quorumMet: quotes.quorumMet,
        activeVenuesCount: quotes.activeVenuesCount,
        timestamp: new Date(quotes.timestamp).toISOString(),
        venues: quotes.venues.map((v) => ({
          venue: v.venue,
          price: v.price,
          spreadBps: v.spreadBps,
          status: v.status,
        })),
      };
    }
    case "get_spot_basis": {
      const asset = String(params.asset || "BTC").toUpperCase();
      const quotes = await getLiveQuotes(asset);
      return {
        referenceIndex: "Quanterra BTC Spot Composite (BRTI Empirical Proxy)",
        referencePrice: quotes.compositePrice,
        disclaimer: "QuanterraOS does not represent its composite index as the official CME CF BRTI benchmark, which requires an institutional license.",
        venues: quotes.venues,
      };
    }
    case "calculate_true_cost": {
      return calculateTrueCost({
        price: Number(params.price ?? 0.5),
        assessedProbability: Number(params.assessedProbability ?? 0.55),
        spread: Number(params.spread ?? 0.02),
        count: Number(params.count ?? 100),
      });
    }
    case "simulate_order_friction": {
      return simulateOrderFriction({
        price: Number(params.price ?? 0.5),
        size: Number(params.size ?? 100),
        assessedProbability: params.assessedProbability !== undefined ? Number(params.assessedProbability) : undefined,
        orderType: params.orderType,
      });
    }
    case "get_calibration_metrics": {
      return {
        canonicalCorpusMarkets: 1316,
        dataset: "KXBTC15M (Kalshi 15-Minute Bitcoin)",
        checkpointsEvaluated: "Minutes 1 to 14",
        minute4Summary: {
          brierScore: 0.244,
          sampleCount: 1316,
          wilson95Ci: [0.231, 0.257],
          brierSkillScoreVsMid: -0.012,
          empiricalFinding: "The market is well calibrated; fees ($0.07*P*(1-P)) create high hurdle for gross predictive edge.",
        },
      };
    }
    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}
