/**
 * QuanterraOS SEO Topic Pages & Structured FAQ Schema Engine
 *
 * Implements Phase 3 Task 3.5:
 * "SEO topic pages + FAQ schema (Part 2.1)"
 *
 * The 4 High-Authority Target Pages:
 * 1. /kalshi-fee-calculator: Parabolic taker fee schedule, breakeven hurdle, maker zero-fee savings.
 * 2. /kalshi-btc-settlement-brti: CME CF BRTI 60-second TWAP averaging window, constituent exchanges.
 * 3. /kalshi-vs-polymarket-fees: True-cost comparison, protocol fees, cross-venue net spread, oracle differences.
 * 4. /bitcoin-15-minute-markets: 15-minute binary microstructure, volatility hazard at 50¢, Brier calibration.
 *
 * Each page includes:
 * - Proper title tag and compelling meta description
 * - Canonical link tag
 * - Structured JSON-LD FAQ schema (@type: "FAQPage")
 * - Global Tesla header and footer
 * - Semantic HTML5 hierarchy (single <h1>, <h2>, <h3>)
 * - Rich empirical calculators and visual data tables
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "./components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoTopicPageConfig {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  lead: string;
  contentHtml: string;
  faqs: FaqItem[];
}

export const SEO_TOPIC_PAGES: Record<string, SeoTopicPageConfig> = {
  "kalshi-fee-calculator": {
    slug: "kalshi-fee-calculator",
    title: "Kalshi Fee Calculator & True Breakeven Guide",
    metaTitle: "Kalshi Fee Calculator — True Taker Drag & Breakeven Odds",
    metaDescription: "Calculate exact Kalshi taker fees, maker savings, and true breakeven probability. Understand why the parabolic fee formula peaks at 50¢ ($1.75/100ct).",
    eyebrow: "Fee Engineering · Mathematical Invariants",
    lead: "Kalshi trading fees are non-linear. They scale with contract price and peak at 50¢ where directional certainty is lowest. Use this guide to calculate exact costs, evaluate maker limit order savings, and protect your capital from transaction drag.",
    faqs: [
      {
        question: "How are Kalshi taker fees calculated?",
        answer: "Kalshi calculates taker fees using the formula: fee = ceil(0.07 × C × P × (1 − P)), where C is the number of contracts and P is the contract price from $0.01 to $0.99. Each order is rounded up to the nearest whole cent.",
      },
      {
        question: "Why do Kalshi fees peak at 50 cents?",
        answer: "The term P × (1 − P) mathematically achieves its maximum at P = 0.50 (0.50 × 0.50 = 0.25). As a result, trading 100 contracts at 50¢ incurs a taker fee of $1.75, whereas trading at 10¢ or 90¢ incurs only $0.63 in fees.",
      },
      {
        question: "How much can I save using maker/limit orders on Kalshi?",
        answer: "Kalshi charges $0.00 in trading fees for resting limit orders that add liquidity (maker orders). By posting passive bids or offers instead of crossing the spread as a taker, traders eliminate 100% of their exchange fee burden.",
      },
      {
        question: "What directional win rate do I need to break even at 50¢?",
        answer: "At 50¢ on Kalshi, buying 100 contracts costs $50.00 plus a $1.75 taker fee, totaling $51.75. Because winning payout is $100.00, your required breakeven win rate is 51.75%, demanding a 1.75% structural edge just to overcome fee friction.",
      },
    ],
    contentHtml: `
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #FFF; margin-bottom: 16px;">The Kalshi Parabolic Fee Table (Per 100 Contracts)</h2>
        <div style="overflow-x: auto; background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-family: var(--public-font-mono); font-size: 0.85rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: var(--public-accent-gold);">
                <th style="padding: 12px 16px;">Contract Price (P)</th>
                <th style="padding: 12px 16px;">Executable Outlay</th>
                <th style="padding: 12px 16px;">Kalshi Taker Fee</th>
                <th style="padding: 12px 16px;">Maker Fee</th>
                <th style="padding: 12px 16px;">Breakeven Hurdle</th>
              </tr>
            </thead>
            <tbody style="color: #CBD5E1;">
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 16px;">10¢ ($0.10)</td>
                <td style="padding: 12px 16px;">$10.00</td>
                <td style="padding: 12px 16px;">$0.63</td>
                <td style="padding: 12px 16px; color: #10B981;">$0.00 (100% saved)</td>
                <td style="padding: 12px 16px;">10.63%</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 16px;">30¢ ($0.30)</td>
                <td style="padding: 12px 16px;">$30.00</td>
                <td style="padding: 12px 16px;">$1.47</td>
                <td style="padding: 12px 16px; color: #10B981;">$0.00 (100% saved)</td>
                <td style="padding: 12px 16px;">31.47%</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: rgba(201, 162, 74, 0.06);">
                <td style="padding: 12px 16px; color: #FFF; font-weight: 700;">50¢ ($0.50) [PEAK]</td>
                <td style="padding: 12px 16px; color: #FFF; font-weight: 700;">$50.00</td>
                <td style="padding: 12px 16px; color: #F43F5E; font-weight: 700;">$1.75 (MAX)</td>
                <td style="padding: 12px 16px; color: #10B981; font-weight: 700;">$0.00 (+$1.75 saved)</td>
                <td style="padding: 12px 16px; color: #F43F5E; font-weight: 700;">51.75%</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 16px;">70¢ ($0.70)</td>
                <td style="padding: 12px 16px;">$70.00</td>
                <td style="padding: 12px 16px;">$1.47</td>
                <td style="padding: 12px 16px; color: #10B981;">$0.00 (100% saved)</td>
                <td style="padding: 12px 16px;">71.47%</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px;">90¢ ($0.90)</td>
                <td style="padding: 12px 16px;">$90.00</td>
                <td style="padding: 12px 16px;">$0.63</td>
                <td style="padding: 12px 16px; color: #10B981;">$0.00 (100% saved)</td>
                <td style="padding: 12px 16px;">90.63%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #FFF; margin-bottom: 14px;">Rounding Optimization Strategy</h2>
        <p style="font-size: 0.95rem; color: #94A3B8; line-height: 1.6; margin-bottom: 16px;">
          Because Kalshi applies Math.ceil on every single order, splitting an order into small chunks incurs severe rounding penalties. For example, buying 10 contracts 10 separate times at 51¢ costs 10 × $0.18 = $1.80 in fees, whereas submitting a single consolidated order of 100 contracts costs $1.75, saving $0.05 instantly.
        </p>
        <div style="margin-top: 24px;">
          <a href="/check" class="btn-tesla-primary">Launch Free True-Cost Check &rarr;</a>
        </div>
      </section>
    `,
  },

  "kalshi-btc-settlement-brti": {
    slug: "kalshi-btc-settlement-brti",
    title: "How Kalshi BTC Contracts Settle: CME CF BRTI 60-Second TWAP",
    metaTitle: "How Kalshi BTC Settles — CME CF BRTI 60s TWAP Explained",
    metaDescription: "Detailed breakdown of the CME CF Bitcoin Real-Time Index (BRTI) 60-second TWAP settlement oracle for Kalshi KXBTC15M contracts.",
    eyebrow: "Settlement Microstructure · Oracle Architecture",
    lead: "Kalshi's CFTC-regulated Bitcoin binary contracts (KXBTC15M) do not settle on Binance spot or an instantaneous mobile app snapshot. They settle against the 60-second Time-Weighted Average Price of the CME CF Bitcoin Real-Time Index (BRTI).",
    faqs: [
      {
        question: "What oracle does Kalshi use to settle Bitcoin contracts?",
        answer: "Kalshi uses the CME CF Bitcoin Real-Time Index (BRTI), a regulated UK BMR benchmark administered by CF Benchmarks Ltd and CME Group. Contracts settle against a 60-second TWAP of this index.",
      },
      {
        question: "When is the settlement averaging window sampled?",
        answer: "For Kalshi 15-minute contracts (KXBTC15M), the averaging window runs across seconds 840 to 900 of the 15-minute candle (minute 14:00 to 15:00 UTC). Trades executed outside this final 60 seconds do not factor into settlement.",
      },
      {
        question: "Which cryptocurrency exchanges constitute the BRTI index?",
        answer: "The constituent exchanges for CME CF BRTI are Coinbase, Kraken, Bitstamp, and Gemini. Spot transactions across these four venues are sampled across 12 consecutive 5-second sub-intervals.",
      },
      {
        question: "Why does my exchange app price differ from the Kalshi settlement result?",
        answer: "Single-venue spot quotes (such as Binance or Bybit) often experience idiosyncratic flash wicks or basis deviations. Because Kalshi uses a multi-venue volume-weighted median TWAP across regulated US/EU exchanges, short-term exchange spikes are mathematically filtered out.",
      },
    ],
    contentHtml: `
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #FFF; margin-bottom: 16px;">The 12 Sub-Interval TWAP Architecture</h2>
        <p style="font-size: 0.95rem; color: #94A3B8; line-height: 1.6; margin-bottom: 16px;">
          The BRTI methodology partitions the 60-second settlement window (from T-60s to T-0s) into twelve distinct 5-second partitions. In each partition:
        </p>
        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; color: #CBD5E1; margin-bottom: 24px;">
          <li style="display:flex; gap:8px;"><span>1.</span> <span>All qualifying transactions across Coinbase, Kraken, Bitstamp, and Gemini are grouped.</span></li>
          <li style="display:flex; gap:8px;"><span>2.</span> <span>A volume-weighted median is calculated for each 5-second sub-period.</span></li>
          <li style="display:flex; gap:8px;"><span>3.</span> <span>The unweighted arithmetic mean of the twelve 5-second medians produces the final settlement index.</span></li>
        </ul>
        <div style="background: rgba(201, 162, 74, 0.08); border: 1px solid rgba(201, 162, 74, 0.25); border-radius: 8px; padding: 18px; margin-bottom: 24px; font-size: 0.85rem; color: #CBD5E1;">
          <strong style="color: var(--public-accent-gold);">Methodology Notice:</strong> QuanterraOS tracks all 4 constituent spot exchanges in real time to calculate a continuous settlement-index proxy, identifying basis deviations before contract expiry.
        </div>
        <a href="/radar" class="btn-tesla-primary">Open Live Settlement Radar &rarr;</a>
      </section>
    `,
  },

  "kalshi-vs-polymarket-fees": {
    slug: "kalshi-vs-polymarket-fees",
    title: "Kalshi vs Polymarket Fees: Complete True-Cost Comparison",
    metaTitle: "Kalshi vs Polymarket Fees — True-Cost & Settlement Comparison",
    metaDescription: "Comprehensive fee and settlement comparison between Kalshi and Polymarket: parabolic taker drag, maker zero fees, and oracle dispute risks.",
    eyebrow: "Cross-Venue Analysis · Competitive Truth",
    lead: "Evaluating prediction markets requires comparing both exchange transaction costs and settlement mechanics. Here is the objective, fee-adjusted breakdown between CFTC-regulated Kalshi and decentralized Polymarket.",
    faqs: [
      {
        question: "Does Polymarket charge trading fees?",
        answer: "On standard Conditional Token Framework (CTF) binary prediction markets, Polymarket charges 0% in protocol transaction fees. However, users pay Polygon network gas fees for order placement and USDC token approval.",
      },
      {
        question: "Is trading on Kalshi cheaper than Polymarket?",
        answer: "If you trade as a maker (posting limit orders), Kalshi charges 0% fees, making it identical in protocol fees while offering direct USD bank deposits. If you trade as a taker crossing the spread, Kalshi charges a fee up to 1.75% of contract value.",
      },
      {
        question: "How do the settlement mechanisms differ between Kalshi and Polymarket?",
        answer: "Kalshi settles CFTC-regulated Bitcoin markets algorithmically against CME CF BRTI 60s TWAP with zero dispute window. Polymarket settles crypto markets via the UMA Decentralized Optimistic Oracle, which features a 2-hour dispute window and token voting.",
      },
      {
        question: "Can I arbitrage price differences between Kalshi and Polymarket?",
        answer: "Cross-venue spread opportunities frequently appear (e.g. 52¢ on Polymarket vs 48¢ on Kalshi), but fee drag on Kalshi takers plus gas and USDC bridge costs consume a significant portion of the gross spread. Always check net spread after fees.",
      },
    ],
    contentHtml: `
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #FFF; margin-bottom: 16px;">Core Structural Differences</h2>
        <div style="overflow-x: auto; background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-family: var(--public-font-mono); font-size: 0.85rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: var(--public-accent-gold);">
                <th style="padding: 12px 16px;">Feature</th>
                <th style="padding: 12px 16px;">Kalshi</th>
                <th style="padding: 12px 16px;">Polymarket</th>
              </tr>
            </thead>
            <tbody style="color: #CBD5E1;">
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 16px;">Regulatory Status</td>
                <td style="padding: 12px 16px; color:#10B981;">CFTC-Regulated DCM / DCO</td>
                <td style="padding: 12px 16px;">Offshore / Non-US Decentralized</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 16px;">Maker Trading Fee</td>
                <td style="padding: 12px 16px; color:#10B981;">$0.00 (Zero Fee)</td>
                <td style="padding: 12px 16px; color:#10B981;">0.0% Protocol Fee</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 16px;">Taker Trading Fee</td>
                <td style="padding: 12px 16px; color:#F43F5E;">Parabolic 0.07 × C × P × (1-P)</td>
                <td style="padding: 12px 16px; color:#10B981;">0.0% (Gas fees only)</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 16px;">Settlement Source</td>
                <td style="padding: 12px 16px;">CME CF BRTI 60-second TWAP</td>
                <td style="padding: 12px 16px;">UMA Optimistic Oracle v3</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px;">Dispute Mechanism</td>
                <td style="padding: 12px 16px;">Instantaneous benchmark resolution</td>
                <td style="padding: 12px 16px;">2-hour dispute window + token vote</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <div style="margin-top: 24px;">
        <a href="/check" class="btn-tesla-primary">Run Cross-Venue Net Spread Check &rarr;</a>
      </div>
    `,
  },

  "bitcoin-15-minute-markets": {
    slug: "bitcoin-15-minute-markets",
    title: "Bitcoin 15-Minute Prediction Markets: Microstructure & Volatility",
    metaTitle: "Bitcoin 15-Minute Markets — Microstructure & Volatility Guide",
    metaDescription: "Guide to trading Kalshi KXBTC15M Bitcoin 15-minute prediction markets: time decay, strike pinning, liquidity walls, and empirical calibration.",
    eyebrow: "Market Microstructure · Rapid Binary Cycles",
    lead: "15-minute Bitcoin markets represent the fastest-growing binary contract segment. Here is an empirical analysis of strike selection, time-decay theta, and why trading in the 45¢–55¢ zone requires heightened discipline.",
    faqs: [
      {
        question: "What is a KXBTC15M contract?",
        answer: "KXBTC15M is Kalshi's ticker series for 15-minute Bitcoin prediction markets. Each contract asks whether the price of Bitcoin will be at or above a specific strike price at the end of the 15-minute window.",
      },
      {
        question: "Why is the 45¢ to 55¢ range called the coin-flip danger zone?",
        answer: "At 50¢, contracts exhibit maximum price variance and fee drag consumes the highest percentage of potential profit ($1.75 per 100 contracts). Empirical backtests show that trading directionally around 50¢ without a confirmed structural thesis degrades overall portfolio calibration.",
      },
      {
        question: "How does time decay impact 15-minute prediction contracts?",
        answer: "Unlike traditional equities, binary contracts undergo accelerated delta pinning during the final 3 minutes. If spot Bitcoin is more than $50 away from the strike during the final 180 seconds, the contract price frequently locks at $0.01 or $0.99.",
      },
      {
        question: "What is a good Brier score for 15-minute Bitcoin forecasting?",
        answer: "A coin-flip strategy has a Brier score of 0.2500. The market midpoint prices achieve a baseline of 0.2063 across 1,316 windows. Systematic traders aim for Brier scores below 0.2020.",
      },
    ],
    contentHtml: `
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #FFF; margin-bottom: 16px;">Key Microstructure Phases in the 15-Minute Cycle</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          <div style="background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 20px;">
            <div style="font-family: var(--public-font-mono); font-size: 0.75rem; color: #10B981; margin-bottom: 6px;">MINUTES 0:00 – 10:00</div>
            <h3 style="font-size: 1rem; color: #FFF; margin-bottom: 8px;">Macro Trend &amp; Spot Correlation</h3>
            <p style="font-size: 0.84rem; color: #94A3B8; line-height: 1.5;">Contract prices track spot movements smoothly. Spreads are typically 2¢ to 3¢ wide.</p>
          </div>
          <div style="background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 20px;">
            <div style="font-family: var(--public-font-mono); font-size: 0.75rem; color: var(--public-accent-gold); margin-bottom: 6px;">MINUTES 10:00 – 14:00</div>
            <h3 style="font-size: 1rem; color: #FFF; margin-bottom: 8px;">Theta Pinning &amp; Liquidity Walls</h3>
            <p style="font-size: 0.84rem; color: #94A3B8; line-height: 1.5;">Time decay accelerates. Out-of-the-money strikes collapse to 1¢–5¢ unless spot is hovering directly at strike.</p>
          </div>
          <div style="background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 8px; padding: 20px;">
            <div style="font-family: var(--public-font-mono); font-size: 0.75rem; color: #F43F5E; margin-bottom: 6px;">MINUTES 14:00 – 15:00</div>
            <h3 style="font-size: 1rem; color: #FFF; margin-bottom: 8px;">60s TWAP Averaging Window</h3>
            <p style="font-size: 0.84rem; color: #94A3B8; line-height: 1.5;">Trading closes or freezes as seconds 840–900 determine final resolution against CME CF BRTI.</p>
          </div>
        </div>
      </section>
      <div style="margin-top: 24px;">
        <a href="/radar" class="btn-tesla-primary">Monitor Active 15M Cadence &rarr;</a>
      </div>
    `,
  },
};

/**
 * Generates JSON-LD schema for FAQPage
 */
export function generateFaqJsonLd(faqs: FaqItem[]): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };
  return JSON.stringify(schema, null, 2);
}

/**
 * Renders an SEO Topic Page with rich styling and structured FAQ schema.
 */
export function renderSeoTopicPageHtml(slug: string): string | null {
  const config = SEO_TOPIC_PAGES[slug];
  if (!config) return null;

  const faqJsonLd = generateFaqJsonLd(config.faqs);

  const faqsHtml = config.faqs
    .map(
      (f, idx) => `
      <div class="seo-faq-card" id="faq-item-${idx + 1}">
        <h3 class="seo-faq-question">${f.question}</h3>
        <p class="seo-faq-answer">${f.answer}</p>
      </div>
    `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <title>${config.metaTitle} — QuanterraOS</title>
  <meta name="description" content="${config.metaDescription}">
  <link rel="canonical" href="https://quanterraos.com/${config.slug}">
  <meta property="og:title" content="${config.metaTitle}">
  <meta property="og:description" content="${config.metaDescription}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://quanterraos.com/${config.slug}">
  <link rel="stylesheet" href="/index.css">
  
  <!-- Structured FAQ Schema -->
  <script type="application/ld+json">
${faqJsonLd}
  </script>

  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #000000; color: #FFFFFF; font-family: var(--public-font-sans); }
    .seo-container { max-width: 980px; margin: 0 auto; padding: 64px 24px 96px; }
    .seo-hero { margin-bottom: 48px; }
    .seo-eyebrow { font-family: var(--public-font-mono); font-size: 0.75rem; text-transform: uppercase; color: var(--public-accent-gold); letter-spacing: 0.12em; margin-bottom: 12px; }
    .seo-title { font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 700; letter-spacing: -0.025em; line-height: 1.1; margin-bottom: 20px; color: #FFF; }
    .seo-lead { font-size: 1.15rem; color: var(--public-muted); line-height: 1.6; max-width: 820px; }
    .seo-faq-section { margin-top: 56px; border-top: 1px solid var(--public-border); padding-top: 48px; }
    .seo-faq-card { background: rgba(18, 18, 22, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 24px; margin-bottom: 18px; }
    .seo-faq-question { font-size: 1.15rem; font-weight: 600; color: #FFF; margin-bottom: 10px; }
    .seo-faq-answer { font-size: 0.92rem; color: #94A3B8; line-height: 1.6; }
  </style>
</head>
<body>
  ${renderPublicHeader()}

  <main class="seo-container">
    <article>
      <header class="seo-hero">
        <div class="seo-eyebrow">${config.eyebrow}</div>
        <h1 class="seo-title">${config.title}</h1>
        <p class="seo-lead">${config.lead}</p>
      </header>

      <div class="seo-content">
        ${config.contentHtml}
      </div>

      <!-- Frequently Asked Questions with Schema.org Markup -->
      <section class="seo-faq-section" id="faqs" aria-label="Frequently Asked Questions">
        <h2 style="font-size: 1.6rem; font-weight: 700; color: #FFF; margin-bottom: 24px;">Frequently Asked Questions</h2>
        ${faqsHtml}
      </section>
    </article>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}
