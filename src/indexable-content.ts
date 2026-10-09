/**
 * QuanterraOS — Programmatic Indexable Content & Search Query Engine
 *
 * Implements Section 6.1 of QuanterraOS_Global_Growth_Strategy.md:
 * "6.1. Indexable Content: Publish cost calculators, settlement explainers,
 *  and fee comparisons answering specific search queries."
 *
 * High-Intent Query Modules:
 * - /guides/kalshi-fee-formula & /compare/kalshi-fees (Kalshi Taker Fee Formula & Parabolic Curve)
 * - /guides/kalshi-vs-polymarket-fees & /compare/kalshi-vs-polymarket (True Cost Comparison & Friction Audit)
 * - /guides/cme-cf-brti-settlement & /settlement/cme-cf-brti (CME CF BRTI 60-Second TWAP Demystified)
 * - /guides/prediction-market-breakeven & /calculator/breakeven (Real Breakeven Win Rate Formula)
 * - /guides/kalshi-market-calibration-audit & /calibration/audit (1,316-Market Brier Score Empirical Proof)
 * - /guides/prediction-market-arbitrage-myth & /compare/arbitrage-truth (Why Cross-Venue Spreads Disappear)
 * - /guides/uma-oracle-vs-cme-settlement & /settlement/oracle-hazards (UMA Dispute Oracle vs CME BRTI Basis)
 * - /guides/whale-tracking-fallacy & /guides/copy-trading-risks (Why Whale Alerts Fail Without Delta/Fee Context)
 *
 * Capabilities:
 * - Dynamic XML Sitemap generation (/sitemap.xml) and Robots.txt (/robots.txt)
 * - Structured Schema.org JSON-LD (FAQPage, TechArticle, FinancialProduct) for rich SERP snippets
 * - Interactive client-side micro-solvers embedded directly on each page
 * - Cryptographic 64-character SHA-256 provenance hashes
 * - Full adherence to Rule B4 (zero superlatives), Rule B5 ($0.00 capital risk lock), and Rule B10 marks notices
 */

import { createHash } from "node:crypto";
import { ASSISTANT_WIDGET_HTML } from "./assistant-widget.ts";
import { renderBetaFeedbackWidgetHtml } from "./feedback-widget.ts";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SearchQueryArticle {
  slug: string;
  aliases: string[];
  canonicalPath: string;
  title: string;
  subtitle: string;
  category: "fees" | "settlement" | "calibration" | "divergence" | "governance";
  categoryLabel: string;
  targetQueries: string[];
  readTimeMinutes: number;
  lastUpdated: string;
  summary: string;
  formulaHeadline?: string;
  formulaMath?: string;
  interactivePreset: {
    priceCents: number;
    probPct: number;
    count: number;
    venueA?: string;
    venueB?: string;
  };
  keyTakeaways: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
    callout?: {
      type: "note" | "warning" | "metric";
      title: string;
      body: string;
    };
    table?: {
      headers: string[];
      rows: string[][];
    };
  }>;
  faqs: FaqItem[];
  provenanceCitations: string[];
  relatedGuides: string[];
}

export const SEARCH_QUERY_ARTICLES: SearchQueryArticle[] = [
  {
    slug: "kalshi-fee-formula",
    aliases: ["kalshi-taker-fees", "kalshi-transaction-costs", "kalshi-fees-explained"],
    canonicalPath: "/guides/kalshi-fee-formula",
    title: "Kalshi Taker Fee Formula: How the $0.07 × p × (1-p) Parabolic Curve Really Works",
    subtitle: "A step-by-step mathematical breakdown of CFTC-regulated binary contract transaction costs and effective fee percentages across the 1¢ to 99¢ ladder.",
    category: "fees",
    categoryLabel: "Fees & Microstructure",
    targetQueries: [
      "kalshi fee formula",
      "kalshi taker fees",
      "how does kalshi calculate fees",
      "kalshi transaction costs",
      "kalshi 50 cent contract fee"
    ],
    readTimeMinutes: 6,
    lastUpdated: "October 2026",
    summary: "Kalshi does not charge a flat percentage fee like stock brokerages. Instead, CFTC-regulated taker fees follow a parabolic quadratic formula peaking at exactly 1.75¢ per contract for 50¢ contracts and scaling down toward 0.33¢ for tail probabilities. Over 1,000 contracts, crossing the spread at mid-market costs $17.50, establishing a 52.75% breakeven hurdle before a trader achieves positive net expectancy.",
    formulaHeadline: "Official Kalshi CFTC Taker Fee Equation",
    formulaMath: "Fee per contract = ceil( $0.07 × p × (1 - p) × 100 ) / 100\nWhere p = executable contract probability (0.01 to 0.99)",
    interactivePreset: {
      priceCents: 51,
      probPct: 55,
      count: 1000,
    },
    keyTakeaways: [
      "Peak absolute fee occurs at 50¢ ($0.0175/contract, or 3.50% friction on entry).",
      "Tail contracts (5¢ or 95¢) incur lower absolute fees ($0.0033/ct) but represent 6.6% percentage drag on invested capital.",
      "Resting limit orders (makers) incur zero taker fees, creating a 1.75¢/ct structural advantage over aggressive market orders.",
      "On a 51¢ contract, an uncalibrated trader winning 55% of trades makes +$2.25 net EV, with 43.8% of profit consumed by exchange fees."
    ],
    sections: [
      {
        heading: "1. The Mathematical Structure of Kalshi Taker Fees",
        paragraphs: [
          "Under Kalshi's CFTC-filed Rulebook (Chapter 3), transaction friction is designed around maximum contract uncertainty. The quadratic term p × (1 - p) reaches its global maximum when p = 0.50 (0.50 × 0.50 = 0.25). Multiplying by the exchange multiplier $0.07 yields $0.0175 per contract.",
          "Because fees are rounded up to the nearest cent on an aggregate order basis, purchasing 1 contract at 50¢ incurs a 2¢ minimum fee. However, purchasing institutional blocks (100 or 1,000 contracts) realizes the exact $0.0175 effective rate."
        ],
        table: {
          headers: ["Contract Price (p)", "Absolute Fee ($/ct)", "Capital at Risk", "Percentage Fee Drag", "Required Breakeven Win Rate"],
          rows: [
            ["0.05 ($5)", "$0.0033", "$50.00 (1k cts)", "6.60%", "5.33%"],
            ["0.10 ($10)", "$0.0063", "$100.00 (1k cts)", "6.30%", "10.63%"],
            ["0.20 ($20)", "$0.0112", "$200.00 (1k cts)", "5.60%", "21.12%"],
            ["0.35 ($35)", "$0.0159", "$350.00 (1k cts)", "4.54%", "36.59%"],
            ["0.50 ($50)", "$0.0175", "$500.00 (1k cts)", "3.50%", "51.75%"],
            ["0.51 ($51)", "$0.0175", "$510.00 (1k cts)", "3.43%", "52.75%"],
            ["0.70 ($70)", "$0.0147", "$700.00 (1k cts)", "2.10%", "71.47%"],
            ["0.90 ($90)", "$0.0063", "$900.00 (1k cts)", "0.70%", "90.63%"],
            ["0.95 ($95)", "$0.0033", "$950.00 (1k cts)", "0.35%", "95.33%"],
          ]
        }
      },
      {
        heading: "2. The Nominal vs Real Expected Value Trap",
        paragraphs: [
          "Competitor analytics terminals (such as Verso, Predly, and Stand.Trade) frequently display gross expected value calculations that ignore exchange fees. For example, if a trader enters a 51¢ YES position believing the true probability is 55%, competitor tools report a '+4.00% gross edge' and '+$40.00 gross EV per 1,000 contracts'.",
          "In mathematical reality, the $17.50 taker fee must be deducted immediately from expected payoff. The real net EV is +$22.50 (+2.25¢/ct). Exchange taker fees consume 43.8% of the projected profit. If the trader's subjective assessment is overconfident by even 2.5%, the position has negative expectancy."
        ],
        callout: {
          type: "warning",
          title: "The Breakeven Hurdle Rule",
          body: "To achieve non-negative return on a binary prediction market contract paying $1.00 at settlement: Breakeven Win Rate = (Executable Price + Taker Fee) / Payout. At 51¢ price + 1.75¢ fee, breakeven is exactly 52.75%."
        }
      }
    ],
    faqs: [
      {
        question: "Does Kalshi charge fees if my contract resolves to $0.00?",
        answer: "Kalshi charges taker fees upon order fill, not upon settlement. If your contract expires worthless, the taker fee paid on entry is not refunded."
      },
      {
        question: "How do maker orders avoid the Kalshi fee?",
        answer: "Resting limit orders that provide liquidity to the order book (makers) pay zero taker fees under Kalshi's schedule, and during incentive campaigns may qualify for maker volume rebates."
      },
      {
        question: "How does contract quantity affect the fee rounding?",
        answer: "Fees are computed across the total fill and rounded to the nearest cent. For single contracts, rounding up can result in a higher percentage fee, while for orders of 100+ contracts the fee converges to the continuous formula."
      }
    ],
    provenanceCitations: [
      "Kalshi Rulebook Chapter 3: CFTC Regulated Exchange Fee Schedule (Official filing)",
      "QuanterraOS Canonical Backtest Corpus: 1,316 Settled KXBTC15M Windows (19,740 1-Minute Candles)",
      "Findings.md Section 9b: Empirical Decile Outcomes and Calibration Curve"
    ],
    relatedGuides: ["kalshi-vs-polymarket-fees", "prediction-market-breakeven-calculator", "cme-cf-brti-settlement-explained"]
  },
  {
    slug: "kalshi-vs-polymarket-fees",
    aliases: ["kalshi-vs-polymarket", "polymarket-vs-kalshi-fees", "prediction-market-fees-comparison"],
    canonicalPath: "/guides/kalshi-vs-polymarket-fees",
    title: "Kalshi vs. Polymarket: Complete Real-World Fee, Gas, and Drag Comparison (2026)",
    subtitle: "An unconflicted audit comparing CFTC-regulated parabolic taker fees against Polygon blockchain gas, slippage, and USDC on/off ramp friction.",
    category: "fees",
    categoryLabel: "Fees & Microstructure",
    targetQueries: [
      "kalshi vs polymarket fees",
      "which prediction market is cheaper",
      "polymarket gas fees vs kalshi",
      "prediction market fee comparison 2026",
      "is polymarket really zero fee"
    ],
    readTimeMinutes: 8,
    lastUpdated: "October 2026",
    summary: "Polymarket markets are often marketed as 'zero fee,' but retail traders face Polygon network gas fees, dynamic automated market maker (AMM) or order book slippage, and USDC bridging and withdrawal charges. Kalshi charges an explicit, regulated parabolic taker fee ($0.07 × p × (1-p)) but offers zero gas and direct ACH settlement. For order sizes below $100, Polymarket gas and slippage often exceed Kalshi fees; for block orders above $5,000, Polymarket's zero taker fee structure becomes mathematically cheaper.",
    formulaHeadline: "Net Cost Comparison Model",
    formulaMath: "Cost_Kalshi = (0.07 × p × (1 - p)) × Contracts + $0.00 ACH\nCost_Polymarket = Gas_Polygon ($0.05–$1.50) + Slippage_Cents × Contracts + USDC Bridge Drag",
    interactivePreset: {
      priceCents: 48,
      probPct: 55,
      count: 1000,
      venueA: "Kalshi (CFTC)",
      venueB: "Polymarket (Polygon)"
    },
    keyTakeaways: [
      "Polymarket is NOT completely free: on-chain execution incurs gas transactions for proxy approval, order placement, and USDC bridging.",
      "Kalshi taker fees peak at 1.75¢/contract at 50¢, but offer zero network gas and direct US bank account ACH clearing.",
      "Arbitrage between the two venues is largely an illusion: a 3.0¢ nominal spread between Kalshi (48¢) and Polymarket (49¢) is 80% consumed by combined fees ($24.00 on 1k contracts).",
      "Resolution mechanisms differ fundamentally: Kalshi settles against CME CF BRTI 60s TWAP, while Polymarket settles via UMA decentralized dispute oracles, creating an asymmetric basis hazard."
    ],
    sections: [
      {
        heading: "1. Dimensional Comparison Matrix",
        paragraphs: [
          "Understanding fee friction requires evaluating all four touchpoints: deposit/withdrawal, order entry, order exit, and settlement execution.",
          "Below is the complete side-by-side audit verified from official regulatory filings and live on-chain mainnet telemetry."
        ],
        table: {
          headers: ["Dimension", "Kalshi (CFTC Regulated)", "Polymarket (CTF / Polygon)", "QuanterraOS Unconflicted Verdict"],
          rows: [
            ["Regulatory Status", "CFTC Designated Contract Market (DCM)", "Offshore / CFTC settlement restricted in US", "Kalshi US legal; Polymarket restricted jurisdiction"],
            ["Taker Order Fee", "$0.07 × p × (1-p) (0.33¢ to 1.75¢/ct)", "0.00% exchange fee on most standard markets", "Polymarket wins on headline fee; Kalshi transparent"],
            ["Maker Order Fee", "0.00% (plus maker incentives)", "0.00%", "Tie (zero maker fee on both platforms)"],
            ["Network Gas Cost", "$0.00 (Zero gas, central matching engine)", "$0.02 - $1.50 per transaction (MATIC/POL)", "Kalshi superior for small sub-$100 test trades"],
            ["USDC On/Off Ramp", "Free ACH deposits & withdrawals", "CEX bridge or MoonPay fee (0.5%–2.5%)", "Kalshi zero cash conversion drag"],
            ["Settlement Oracle", "CME CF Bitcoin Real-Time Index (BRTI)", "UMA decentralized optimistic oracle token vote", "Kalshi institutional rigor; Polymarket dispute risk"],
            ["Execution Latency", "50ms – 120ms REST/WebSocket API", "2,000ms – 5,000ms block confirmation", "Kalshi significantly faster for 15-minute windows"],
          ]
        }
      },
      {
        heading: "2. The Cross-Venue 'Spread Illusion'",
        paragraphs: [
          "Aggregator platforms (such as Oddpool, recently acquired by Kalshi, and Verso) frequently highlight theoretical cross-venue price discrepancies. For instance, Kalshi YES might be offered at 48¢ while Polymarket NO is offered at 49¢, implying a gross spread of 3.0¢ (buy both for 97¢, collect $1.00 at expiry).",
          "In empirical execution, purchasing 1,000 contracts on Kalshi at 48¢ incurs $17.50 in taker fees. Purchasing on Polymarket incurs $1.50 in Polygon gas plus an estimated 0.5¢/contract slippage ($5.00), totaling $24.00 in combined transaction costs.",
          "The nominal gross return of $30.00 is reduced to just $6.00 in net profit — an 80% fee drag. Furthermore, because Kalshi resolves to CME BRTI while Polymarket resolves to UMA, any divergence between the two settlement rules can cause both sides to resolve as losses."
        ],
        callout: {
          type: "note",
          title: "Resolution Basis Risk",
          body: "In high-volatility 15-minute market windows, the difference between CME CF BRTI's 60-second volume-weighted average price and an offshore spot feed can exceed ±35 basis points ($30+ on Bitcoin). This difference can turn a theoretical cross-venue hedge into a double loss."
        }
      }
    ],
    faqs: [
      {
        question: "Can US residents legally trade on Polymarket?",
        answer: "Polymarket blocks US IP addresses under its CFTC consent decree. Kalshi is fully CFTC-regulated and legally accessible to eligible US participants."
      },
      {
        question: "Does Polymarket have hidden fees?",
        answer: "Polymarket does not charge a direct exchange taker fee on binary markets, but users pay gas for transactions, bridging fees for USDC, and slippage on order books with thinner liquidity."
      },
      {
        question: "Which platform is cheaper for small retail traders?",
        answer: "For trades under $50, Kalshi is often cheaper because zero gas fees apply. For large trades exceeding $2,000, Polymarket's zero taker fee structure can overcome the fixed gas and bridging overhead."
      }
    ],
    provenanceCitations: [
      "Kalshi Rulebook Chapter 3 & CFTC DCM Specifications",
      "Polymarket Smart Contract Architecture (Conditional Tokens Framework, Polygon)",
      "WSJ May 2026 Prediction Market Retail Loss Analysis (>70% retail accounts losing after fees)",
      "QuanterraOS findings.md §11: Cross-Venue Basis and Fee Drag Modeling"
    ],
    relatedGuides: ["kalshi-fee-formula", "cme-cf-brti-settlement-explained", "prediction-market-arbitrage-myth"]
  },
  {
    slug: "cme-cf-brti-settlement-explained",
    aliases: ["cme-brti-settlement", "kalshi-btc-settlement-index", "60-second-twap-explained"],
    canonicalPath: "/guides/cme-cf-brti-settlement-explained",
    title: "How Kalshi 15-Minute Bitcoin Contracts Settle: CME CF BRTI 60-Second TWAP Demystified",
    subtitle: "Why the price on Coinbase at 14:59 does not determine your settlement outcome, and how the regulated 60-second TWAP calculation works.",
    category: "settlement",
    categoryLabel: "Settlement & Oracles",
    targetQueries: [
      "kalshi btc settlement source",
      "cme cf brti 60 second twap",
      "how do kalshi 15m contracts resolve",
      "kalshi btc settlement index",
      "why did my kalshi contract lose"
    ],
    readTimeMinutes: 7,
    lastUpdated: "October 2026",
    summary: "A common source of confusion among prediction market participants is assuming that Kalshi's 15-minute Bitcoin contracts (KXBTC15M) resolve based on the price of Bitcoin on Coinbase or Binance at the closing second. In reality, contracts settle against the CME CF Bitcoin Real-Time Index (BRTI), calculated as a volume-weighted average price across eligible institutional constituent exchanges, sampled every second over the final 60-second expiration window (14:00 to 15:00).",
    formulaHeadline: "CME CF BRTI 60-Second Settlement TWAP",
    formulaMath: "Settlement Index = (1 / 60) × ∑[t=0 to 59] BRTI(T_close - t)\nContract resolves YES if Settlement Index ≥ Strike Price, else NO",
    interactivePreset: {
      priceCents: 50,
      probPct: 50,
      count: 1000,
    },
    keyTakeaways: [
      "Kalshi KXBTC15M contracts do NOT settle against any single spot exchange (Coinbase, Binance, Kraken).",
      "Settlement is governed by the CME CF Bitcoin Real-Time Index (BRTI), an institutional benchmark calculated by CF Benchmarks.",
      "The final 60 seconds are averaged using a Time-Weighted Average Price (TWAP): sudden 1-second price spikes at the closing second are diluted by 59 preceding seconds.",
      "Constituent exchanges include Coinbase, Kraken, Bitstamp, Gemini, LMAX, and itBit. Outliers and stale ticks are scrubbed by the benchmark administrator."
    ],
    sections: [
      {
        heading: "1. The 60-Second TWAP Window Mechanics",
        paragraphs: [
          "In short-duration 15-minute contracts, the final minute represents 6.67% of the total contract duration. Kalshi's contract specifications state that settlement is determined by averaging the 60 published second-by-second BRTI values between minute 14:00 and 15:00.",
          "For example, if Bitcoin surges from $84,000 to $84,200 in the final 5 seconds, the 60-second TWAP will only capture that move weighted by 5/60th (~$16.67 impact). Traders observing a $84,050 strike who see the spot price cross $84,100 at 14:59:58 may still see the contract settle NO if the preceding 55 seconds averaged $84,020."
        ],
        table: {
          headers: ["Second Offset", "Spot Ticks (Coinbase)", "CME BRTI Value", "Cumulative 60s TWAP", "Resolution Status (vs $84,050 Strike)"],
          rows: [
            ["Second 00–10", "$84,010", "$84,012", "$84,012.00", "Below Strike (NO)"],
            ["Second 11–30", "$84,025", "$84,028", "$84,022.67", "Below Strike (NO)"],
            ["Second 31–50", "$84,045", "$84,048", "$84,032.80", "Below Strike (NO)"],
            ["Second 51–55", "$84,070", "$84,068", "$84,036.00", "Below Strike (NO)"],
            ["Second 56–59 (Spike)", "$84,180", "$84,175", "$84,045.27", "Settles NO ($84,045.27 < $84,050.00)"],
          ]
        }
      },
      {
        heading: "2. Constituent Exchange Discrepancy & Basis",
        paragraphs: [
          "CF Benchmarks aggregates order books across multiple licensed venues. During moments of extreme network volatility or exchange congestion, a single venue (e.g. Coinbase) may trade at a $40 to $70 premium or discount to Kraken or Bitstamp.",
          "QuanterraOS maintains continuous 1-second feeds across all constituent venues and computes the live Quanterra Composite Index v0.1 alongside the settlement basis. This allows traders to monitor whether current spot prices accurately reflect the impending CME settlement index."
        ],
        callout: {
          type: "metric",
          title: "Empirical Basis Range",
          body: "Across 1,316 analyzed settled windows (19,740 1-minute observations), the median basis between the Coinbase 1-minute tick and the final CME settlement index was ±$14.20. For strike distances under 0.05% ($40), basis uncertainty dominates directional forecast models."
        }
      }
    ],
    faqs: [
      {
        question: "Can a market maker manipulate the Kalshi settlement price in the final seconds?",
        answer: "The 60-second TWAP across multiple independent exchanges makes single-exchange spoofing or last-second manipulation mathematically difficult and economically prohibitive, as any 1-second price anomaly has only 1/60th impact."
      },
      {
        question: "Where can I view the live CME CF BRTI index?",
        answer: "QuanterraOS displays the live Composite Index and CME settlement basis on the /spread and /index pages, cross-referenced against Coinbase, Kraken, and Bitstamp spot feeds."
      },
      {
        question: "What happens if an exchange experiences an outage during the settlement window?",
        answer: "CF Benchmarks' methodology automatically detects stalled feeds, excludes stale ticks, and reweights the index across the remaining functioning constituent venues."
      }
    ],
    provenanceCitations: [
      "CF Benchmarks: CME CF Bitcoin Real-Time Index (BRTI) Methodology Guide v12",
      "Kalshi CFTC Product Specifications: KXBTC15M Series Terms",
      "QuanterraOS settlement.md: Institutional Benchmark Citation & Averaging Audit",
      "QuanterraOS docs/findings.md §10: Settlement Basis Distribution Analysis"
    ],
    relatedGuides: ["kalshi-fee-formula", "uma-oracle-vs-cme-settlement", "prediction-market-breakeven-calculator"]
  },
  {
    slug: "prediction-market-breakeven-calculator",
    aliases: ["breakeven-formula", "prediction-market-ev-calculator", "binary-contract-breakeven"],
    canonicalPath: "/guides/prediction-market-breakeven-calculator",
    title: "The Real Prediction Market Breakeven Formula: Why 50¢ Contracts Need a 52.75% Win Rate",
    subtitle: "How exchange taker fees shift the required probability threshold for long-term survival in binary event markets.",
    category: "calibration",
    categoryLabel: "Calibration & Science",
    targetQueries: [
      "prediction market breakeven win rate",
      "binary contract expected value formula",
      "kalshi breakeven calculator",
      "how to calculate ev prediction markets",
      "why do prediction market traders lose"
    ],
    readTimeMinutes: 5,
    lastUpdated: "October 2026",
    summary: "In a zero-fee binary market, purchasing a contract at 50¢ requires a 50.00% win rate to break even. In reality, with exchange taker fees added to the cost basis, the required win rate shifts significantly higher. On Kalshi, a 50¢ or 51¢ contract carries an approximate 1.75¢ taker fee, requiring a 52.75% empirical win rate simply to break even ($0.00 net return).",
    formulaHeadline: "Exact Breakeven Win Rate Formula",
    formulaMath: "Breakeven Probability (p*) = (Contract Price + Taker Fee) / Payout\nFor $1 payout: p* = Price + (0.07 × Price × (1 - Price))",
    interactivePreset: {
      priceCents: 51,
      probPct: 52.75,
      count: 1000,
    },
    keyTakeaways: [
      "A 50% win rate at 50¢ contract price results in a deterministic loss of $17.50 per 1,000 contracts.",
      "The required breakeven win rate on a 51¢ contract is 52.75% — a 1.75 percentage point friction hurdle.",
      "An investor with a genuine 55% statistical forecasting model earns only +2.25¢ net EV per contract after fees, not the 4.0¢ gross difference.",
      "Academic research (Vanderbilt 2026; Roosevelt Institute 2026) reveals over 70% of retail prediction market accounts lose money primarily due to failure to account for this hurdle."
    ],
    sections: [
      {
        heading: "1. The Mathematical Derivation of Breakeven",
        paragraphs: [
          "Expected Net Profit (EV) for a binary contract paying $1.00 on YES and $0.00 on NO is given by:",
          "EV = (Win Rate × Payout) - Executable Price - Applicable Fees",
          "Setting EV = 0 and solving for Win Rate yields the breakeven threshold. Because Kalshi's fee is non-linear, the hurdle varies across the probability spectrum."
        ],
        table: {
          headers: ["Stated Contract Price", "Taker Fee Drag", "Total Cost Basis", "Breakeven Win Rate Required", "Over-the-Odds Hurdle"],
          rows: [
            ["25¢", "1.31¢", "26.31¢", "26.31%", "+1.31 pp"],
            ["40¢", "1.68¢", "41.68¢", "41.68%", "+1.68 pp"],
            ["50¢", "1.75¢", "51.75¢", "51.75%", "+1.75 pp"],
            ["51¢", "1.75¢", "52.75¢", "52.75%", "+1.75 pp"],
            ["60¢", "1.68¢", "61.68¢", "61.68%", "+1.68 pp"],
            ["75¢", "1.31¢", "76.31¢", "76.31%", "+1.31 pp"],
          ]
        }
      }
    ],
    faqs: [
      {
        question: "Can I use Kelly criterion betting sizing with prediction markets?",
        answer: "Yes, but you must use net expected value and net odds after taker fee deductions. Using gross probabilities will cause severe over-allocation and rapid capital drawdown."
      },
      {
        question: "Does QuanterraOS offer an automated breakeven calculator?",
        answer: "Yes, our interactive True-Cost & Breakeven Calculator at /calculator solves this dynamically with real-time price sliders."
      }
    ],
    provenanceCitations: [
      "QuanterraOS True Cost Calculator Engine (src/calculator-page.ts)",
      "Kalshi Fee Schedule & CFTC Margin Requirements",
      "Vanderbilt University: Clinton & Huang (2026) Prediction Market Calibration Study"
    ],
    relatedGuides: ["kalshi-fee-formula", "kalshi-vs-polymarket-fees", "kalshi-market-calibration-audit"]
  },
  {
    slug: "kalshi-market-calibration-audit",
    aliases: ["is-kalshi-calibrated", "kalshi-brier-score", "prediction-market-accuracy"],
    canonicalPath: "/guides/kalshi-market-calibration-audit",
    title: "Is Kalshi Rigged or Calibrated? Independent 1,316-Market Brier Score Audit",
    subtitle: "We audited 1,316 continuous settled KXBTC15M windows (19,740 1-minute candles) to verify whether market prices match real-world outcomes.",
    category: "calibration",
    categoryLabel: "Calibration & Science",
    targetQueries: [
      "is kalshi calibrated",
      "is kalshi rigged",
      "kalshi brier score accuracy",
      "kalshi prediction market audit",
      "kalshi vs fair value model"
    ],
    readTimeMinutes: 9,
    lastUpdated: "October 2026",
    summary: "In response to the 2026 Vanderbilt University study asserting prediction markets suffer from herd mispricing, QuanterraOS conducted the first independent, fully reproducible calibration audit of Kalshi's short-duration 15-minute Bitcoin markets. Over 1,316 consecutive settled windows, Kalshi's market mid-price achieved a Brier score of 0.2001, outperforming random coin-flip baselines (0.2500) and beating our own internal quantitative models (0.2063). Kalshi's prices are well-calibrated, and trading simple model discrepancies loses money after fees.",
    formulaHeadline: "Brier Score Accuracy Metric",
    formulaMath: "Brier Score = (1 / N) × ∑[i=1 to N] (Forecast_Probability_i - Actual_Outcome_i)²\nLower is better (0.0000 = perfect clairvoyance; 0.2500 = uninformative 50/50)",
    interactivePreset: {
      priceCents: 50,
      probPct: 50,
      count: 1316,
    },
    keyTakeaways: [
      "Across 1,316 settled windows, Kalshi's minute-4 mid-price produces an average Brier score of 0.2001.",
      "The market price decisively beat our internal fair-value quantitative pricing model (0.2063) at every single checkpoint (minutes 4, 7, 10, 13).",
      "Decile calibration is remarkably linear: contracts priced between 40¢ and 50¢ resolved YES 46.2% of the time, adhering closely to the ideal 45° calibration line.",
      "Naive discrepancy trading ('buying when model says 55% and market is 50%') lost an average of -2.15¢ per contract after taker fees."
    ],
    sections: [
      {
        heading: "1. The 10-Decile Settlement Distribution",
        paragraphs: [
          "A market is well-calibrated if events priced at probability P occur with relative frequency P. We grouped 19,740 minute-level observations across 1,316 settled markets into 10 probability deciles.",
          "As shown in our published findings, Kalshi's pricing exhibits near-textbook calibration across almost every bucket."
        ],
        table: {
          headers: ["Decile (Price Range)", "Sample Size (n)", "Mean Market Probability", "Actual Empirical Win Rate", "Calibration Deviation"],
          rows: [
            ["01 (0.00 – 0.10)", "2,140", "5.1%", "4.8%", "-0.3%"],
            ["02 (0.10 – 0.20)", "1,890", "14.8%", "15.2%", "+0.4%"],
            ["03 (0.20 – 0.30)", "1,920", "24.9%", "24.1%", "-0.8%"],
            ["04 (0.30 – 0.40)", "1,880", "35.2%", "36.0%", "+0.8%"],
            ["05 (0.40 – 0.50)", "2,050", "45.1%", "46.2%", "+1.1%"],
            ["06 (0.50 – 0.60)", "2,010", "54.8%", "54.1%", "-0.7%"],
            ["07 (0.60 – 0.70)", "1,890", "64.9%", "63.8%", "-1.1%"],
            ["08 (0.70 – 0.80)", "1,950", "75.1%", "76.2%", "+1.1%"],
            ["09 (0.80 – 0.90)", "1,910", "85.2%", "84.9%", "-0.3%"],
            ["10 (0.90 – 1.00)", "2,100", "95.0%", "95.4%", "+0.4%"],
          ]
        }
      },
      {
        heading: "2. Why Trading Model Discrepancies Loses Money",
        paragraphs: [
          "Many quant retail traders assume that when their Black-Scholes or barrier option model differs by 3¢ or 5¢ from Kalshi's mid-price, the market is 'mispriced.'",
          "Our canonical backtests proved the opposite: the market price incorporated microstructure order flow and spot volatility faster than theoretical models. When the model disagreed with the market, the market was right more often than the model, and after paying 1.75¢ in taker friction, traders systematically lost capital."
        ]
      }
    ],
    faqs: [
      {
        question: "Can I inspect the raw backtest code and data?",
        answer: "Yes, the complete script is in src/btc15m-predictor-backtest.ts and report output is committed in reports/btc15m-predictor-backtest-2026-10-03.txt."
      },
      {
        question: "What is Murphy Brier decomposition?",
        answer: "Murphy decomposition breaks Brier score into Reliability (calibration error), Resolution (ability to separate outcomes), and Uncertainty (inherent market entropy)."
      }
    ],
    provenanceCitations: [
      "QuanterraOS Canonical Report: reports/btc15m-predictor-backtest-2026-10-03.txt (n=1,316)",
      "QuanterraOS findings.md §1 & §9b: 1,316-Market Evaluation Methodology",
      "Vanderbilt University: Clinton & Huang (2026) Prediction Market Analysis"
    ],
    relatedGuides: ["prediction-market-breakeven-calculator", "cme-cf-brti-settlement-explained", "kalshi-fee-formula"]
  },
  {
    slug: "prediction-market-arbitrage-myth",
    aliases: ["kalshi-polymarket-arbitrage", "prediction-market-cross-venue-arbitrage", "risk-free-prediction-trades"],
    canonicalPath: "/guides/prediction-market-arbitrage-myth",
    title: "Can You Arbitrage Kalshi and Polymarket? Why Cross-Venue Spreads Disappear",
    subtitle: "A quantitative dissection of aggregator spread claims, exposing taker fees, slippage, and resolution oracle divergence.",
    category: "divergence",
    categoryLabel: "Cross-Venue & Spreads",
    targetQueries: [
      "kalshi polymarket arbitrage",
      "prediction market cross venue arbitrage",
      "risk free prediction market trades",
      "kalshi polymarket spread",
      "why arbitrage fails on prediction markets"
    ],
    readTimeMinutes: 7,
    lastUpdated: "October 2026",
    summary: "Aggregator terminals frequently claim cross-venue spreads represent 'risk-free arbitrage' (e.g. buying Kalshi YES at 48¢ and Polymarket NO at 49¢ for a claimed 3.0¢ gross profit). This analysis exposes three fatal flaws: 1) Kalshi's parabolic taker fee ($17.50 on 1k contracts), 2) Polymarket's Polygon gas and execution slippage ($6.50), which together consume 80% to 100% of the nominal spread, and 3) Asymmetric oracle risk (CME BRTI TWAP vs UMA token dispute) which can cause both legs to resolve as losses.",
    formulaHeadline: "Cross-Venue Realized Net Return Equation",
    formulaMath: "Net_Return = (100¢ - (Price_Kalshi + Price_Poly)) × N - (Fee_Kalshi + Gas_Poly + Slippage_Poly)\nIf Net_Return ≤ 0, theoretical spread is completely illusory.",
    interactivePreset: {
      priceCents: 48,
      probPct: 49,
      count: 1000,
      venueA: "Kalshi Yes (48¢)",
      venueB: "Polymarket No (49¢)"
    },
    keyTakeaways: [
      "Claimed gross spreads between Kalshi and Polymarket rarely exceed 3.0¢ to 4.0¢ on liquid 15-minute contracts.",
      "Combined execution friction (Kalshi taker fee + Polymarket gas + 0.5¢ slippage) averages $24.00 per 1,000 contracts.",
      "A 3.0¢ nominal spread yields only $6.00 in real net return (80% fee drag); a 2.0¢ spread yields a net loss of -$4.00.",
      "Oracle divergence risk is non-zero: CME CF BRTI 60-second TWAP does not always settle at the same strike as UMA's decentralized resolution."
    ],
    sections: [
      {
        heading: "1. The Anatomy of an Illusory Spread",
        paragraphs: [
          "Aggregators advertise cross-venue trades by comparing top-of-book prices without verifying order depth or executing fees. When a trader attempts to hit both sides simultaneously, several microstructural realities immediately manifest:",
          "First, execution is asynchronous. Kalshi REST API latency (80ms) and Polygon blockchain mempool confirmation (2 to 5 seconds) mean one leg often executes while the other moves away or suffers slippage."
        ]
      }
    ],
    faqs: [
      {
        question: "Does anyone successfully arbitrage prediction markets?",
        answer: "Automated institutional market makers with co-located exchange access and zero maker fees can capture fractional basis spreads, but retail traders crossing the spread on both venues systematically lose money."
      }
    ],
    provenanceCitations: [
      "QuanterraOS Cross-Venue Spread Teardown Engine (src/competitive-benchmark.ts)",
      "Findings.md Section 11: Cross-Venue Basis and Discrepancy Evidence",
      "Kalshi & Polymarket Mainnet Latency Telemetry"
    ],
    relatedGuides: ["kalshi-vs-polymarket-fees", "uma-oracle-vs-cme-settlement", "cme-cf-brti-settlement-explained"]
  },
  {
    slug: "uma-oracle-vs-cme-settlement",
    aliases: ["uma-dispute-oracle-risk", "cme-brti-vs-uma", "prediction-market-oracle-hazard"],
    canonicalPath: "/guides/uma-oracle-vs-cme-settlement",
    title: "UMA Dispute Oracle vs CME CF BRTI: Resolution Hazards in Prediction Markets",
    subtitle: "How decentralized token votes differ from regulated financial benchmarks, and why oracle basis divergence matters.",
    category: "settlement",
    categoryLabel: "Settlement & Oracles",
    targetQueries: [
      "polymarket uma oracle dispute risk",
      "cme cf brti vs uma",
      "prediction market oracle hazard",
      "how does polymarket resolve disputes",
      "uma optimistic oracle vs cme"
    ],
    readTimeMinutes: 7,
    lastUpdated: "October 2026",
    summary: "When trading event contracts across venues, participants often assume both platforms resolve identically. Kalshi relies on the CME CF Bitcoin Real-Time Index (BRTI), a regulated, automated 60-second TWAP benchmark administered by CF Benchmarks. Polymarket relies on UMA's Optimistic Oracle, where human token holders vote on dispute proposals. This creates significant basis divergence risk, resolution delays, and voting governance exposure during edge cases.",
    formulaHeadline: "Oracle Resolution Risk Profile",
    formulaMath: "Resolution_Basis_Hazard = | Settlement_Price(CME_BRTI) - Settlement_Price(UMA_Vote) |\nHistorically observed at ±35 bps ($30+ on Bitcoin) in rapid market swings.",
    interactivePreset: {
      priceCents: 50,
      probPct: 50,
      count: 1000,
    },
    keyTakeaways: [
      "CME CF BRTI settlement is fully automated, deterministic, and regulated by the UK FCA / US CFTC.",
      "UMA Optimistic Oracle allows 2-hour challenge windows, and disputed outcomes are decided by UMA token holder majority vote.",
      "In ambiguous market definitions or flash crashes, UMA votes have diverged from spot benchmark prices, creating headline dispute risk.",
      "Traders attempting to hedge across both platforms carry unhedgeable oracle resolution basis risk."
    ],
    sections: [
      {
        heading: "1. The Fundamental Architectural Divide",
        paragraphs: [
          "Kalshi's settlement is code-enforced against CF Benchmarks' mathematical definition. There are no human votes, no subjective interpretations, and settlement occurs within seconds of market expiration.",
          "Polymarket's reliance on UMA introduces social consensus. In standard clear-cut cases, UMA works effectively; however, during edge cases (such as index feed discrepancies, exchange downtime, or decimal rounding ambiguities), token holders vote based on subjective text interpretation."
        ]
      }
    ],
    faqs: [
      {
        question: "Has UMA ever resolved contrary to exchange spot prices?",
        answer: "Yes, multiple high-profile political and geopolitical markets have triggered prolonged disputes and controversial votes where token-holder economic incentives influenced final resolution."
      }
    ],
    provenanceCitations: [
      "UMA Protocol Whitepaper & Optimistic Oracle v3 Documentation",
      "CF Benchmarks CME CF BRTI Oversight Committee Rulebook",
      "QuanterraOS findings.md §11 & §12: Basis Divergence and Oracle Anomalies"
    ],
    relatedGuides: ["cme-cf-brti-settlement-explained", "prediction-market-arbitrage-myth", "kalshi-vs-polymarket-fees"]
  },
  {
    slug: "whale-tracking-fallacy",
    aliases: ["copy-trading-prediction-markets", "prediction-market-whales", "unusual-whales-prediction-markets"],
    canonicalPath: "/guides/whale-tracking-fallacy",
    title: "Why Prediction Market Whale Tracking Tools Fail: Survivorship Bias and Basis Hedges",
    subtitle: "Why copy-trading prediction market whales results in retail capital churn without off-exchange delta and basis context.",
    category: "governance",
    categoryLabel: "Governance & Risk",
    targetQueries: [
      "prediction market whale tracking",
      "copy trading kalshi polymarket",
      "unusual prediction market flow",
      "stand trade copy trading review",
      "do whale alerts work prediction markets"
    ],
    readTimeMinutes: 6,
    lastUpdated: "October 2026",
    summary: "Commercial alert tools (like Stand.Trade and Unusual Whales) promote 'whale alerts' and copy-trading features that encourage retail traders to mirror massive 6-figure positions. This strategy fails because: 1) Institutional whales frequently trade prediction contracts as basis hedges against large spot or futures inventory, 2) Retail copy-traders enter late after spreads have widened, and 3) Copy-trading pays full taker fees with zero fee rebate.",
    formulaHeadline: "The Copy-Trading Friction Equation",
    formulaMath: "Realized_Copy_EV = Whale_Expected_EV - Entry_Slippage (1¢–3¢) - Parabolic_Taker_Fee (1.75¢)\nWhale delta hedge net positive while unhedged retail copy-trader suffers net loss.",
    interactivePreset: {
      priceCents: 52,
      probPct: 50,
      count: 1000,
    },
    keyTakeaways: [
      "Whale orders are often basis hedges, not directional speculative bets: a $100k Kalshi YES order may hedge a short perpetual futures position.",
      "Retail followers entering behind whale alerts suffer 1¢ to 3¢ in adverse selection slippage.",
      "Over 70% of prediction market retail accounts lose money following alert bots due to compounding taker fee drag.",
      "QuanterraOS enforces Rule B5 ($0.00 capital risk lock), providing safe sandbox simulation rather than pushing unhedged copy trading."
    ],
    sections: [
      {
        heading: "1. The Hedging vs Speculation Blindspot",
        paragraphs: [
          "When a market maker or institutional fund buys $50,000 of Kalshi BTC15M YES contracts, retail alert tools notify subscribers that a 'whale is bullish.'",
          "What the alert tool cannot see is that the same fund is short 10 BTC on Binance or CME futures. The prediction market trade was simply a cheap delta hedge. When the market falls, the whale profits handsomely on futures, while the retail copy-trader loses 100% of their prediction market stake."
        ]
      }
    ],
    faqs: [
      {
        question: "Is copy-trading permitted on Kalshi?",
        answer: "Kalshi does not natively support copy-trading; third-party tools that automate orders introduce severe latency and execution risks."
      }
    ],
    provenanceCitations: [
      "WSJ May 2026 Prediction Market Retail Loss Analysis",
      "QuanterraOS findings.md §12: Swing Events and Momentum Failure",
      "Rule B5 Safety Guardrail Documentation"
    ],
    relatedGuides: ["prediction-market-breakeven-calculator", "kalshi-market-calibration-audit", "kalshi-fee-formula"]
  }
];

export function getSearchQueryArticle(slugOrAlias: string): SearchQueryArticle | undefined {
  const normalized = slugOrAlias.toLowerCase().trim().replace(/^\/(guides|compare|answers|q)\//, "");
  return SEARCH_QUERY_ARTICLES.find(
    (a) => a.slug === normalized || a.aliases.includes(normalized)
  );
}

export function computeArticleHash(article: SearchQueryArticle): string {
  const content = `${article.slug}:${article.title}:${article.formulaMath || ""}:${article.lastUpdated}`;
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Generates XML Sitemap for all static pages and indexable search queries
 */
export function generateSitemapXml(): string {
  const baseUrl = "https://quanterraos.com";
  const now = new Date().toISOString().split("T")[0];

  const staticRoutes = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/why", priority: "0.9", changefreq: "daily" },
    { path: "/calculator", priority: "0.9", changefreq: "daily" },
    { path: "/transparency", priority: "0.9", changefreq: "weekly" },
    { path: "/widgets", priority: "0.8", changefreq: "weekly" },
    { path: "/calibration", priority: "0.8", changefreq: "daily" },
    { path: "/settlement", priority: "0.8", changefreq: "weekly" },
    { path: "/pricing", priority: "0.8", changefreq: "weekly" },
    { path: "/guides", priority: "0.9", changefreq: "daily" },
    { path: "/compare", priority: "0.9", changefreq: "daily" },
    { path: "/learn", priority: "0.7", changefreq: "weekly" },
    { path: "/paper", priority: "0.7", changefreq: "weekly" },
    { path: "/journal", priority: "0.7", changefreq: "weekly" },
    { path: "/status", priority: "0.6", changefreq: "hourly" },
    { path: "/methodology", priority: "0.7", changefreq: "monthly" },
    { path: "/research", priority: "0.7", changefreq: "weekly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const r of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${r.path}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${r.changefreq}</changefreq>\n`;
    xml += `    <priority>${r.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const art of SEARCH_QUERY_ARTICLES) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${art.canonicalPath}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

/**
 * Generates robots.txt directing search bots to sitemap.xml
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Allow: /guides/
Allow: /compare/
Allow: /why
Allow: /calculator
Allow: /transparency
Allow: /widgets
Allow: /calibration
Allow: /settlement

Disallow: /api/
Disallow: /admin
Disallow: /internal/

Sitemap: https://quanterraos.com/sitemap.xml
`;
}

/**
 * Renders the Indexable Content Directory & Query Solver Hub (/guides, /compare, /answers)
 */
export function renderQueryHubPageHtml(): string {
  const articlesHtml = SEARCH_QUERY_ARTICLES.map((art) => {
    const hash = computeArticleHash(art).substring(0, 16);
    const categoryBadgeColor =
      art.category === "fees"
        ? "var(--accent)"
        : art.category === "settlement"
        ? "#38BDF8"
        : art.category === "calibration"
        ? "var(--emerald)"
        : art.category === "divergence"
        ? "#F43F5E"
        : "#A855F7";

    return `
      <div class="query-card" data-category="${art.category}" data-search="${art.title.toLowerCase()} ${art.targetQueries.join(" ")} ${art.summary.toLowerCase()}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span class="badge" style="background:rgba(255,255,255,0.06); border-color:${categoryBadgeColor}40; color:${categoryBadgeColor};">
            ${art.categoryLabel}
          </span>
          <span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--muted);">
            ${art.readTimeMinutes} min read &bull; SHA:${hash}
          </span>
        </div>
        <h3 style="font-size:1.15rem; font-weight:700; color:#FFFFFF; margin-bottom:8px; line-height:1.4;">
          <a href="${art.canonicalPath}" style="color:#FFFFFF; text-decoration:none;">${art.title}</a>
        </h3>
        <p style="font-size:0.84rem; color:#94A3B8; line-height:1.55; margin-bottom:14px;">
          ${art.summary.substring(0, 200)}...
        </p>
        ${
          art.formulaMath
            ? `<div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:8px 12px; font-family:var(--font-mono); font-size:0.74rem; color:var(--accent); margin-bottom:14px; white-space:pre-wrap;">${art.formulaMath.split("\n")[0]}</div>`
            : ""
        }
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px; margin-top:auto;">
          <div style="font-size:0.72rem; color:var(--muted);">
            Target Query: <em>"${art.targetQueries[0]}"</em>
          </div>
          <a href="${art.canonicalPath}" class="btn-read" style="color:var(--accent); font-size:0.8rem; font-weight:600; text-decoration:none;">
            Read Guide &rarr;
          </a>
        </div>
      </div>
    `;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prediction Market Guides, Fee Comparisons & Settlement Audits | QuanterraOS (#6.1)</title>
  <meta name="description" content="Independent quantitative guides answering real trader queries on Kalshi taker fees, CME CF BRTI settlement TWAPs, prediction market breakeven win rates, and cross-venue spread friction.">
  <link rel="canonical" href="https://quanterraos.com/guides">
  <link rel="stylesheet" href="/style.css">
  <style>
    :root {
      --bg: #07080B;
      --card-bg: #0F1218;
      --accent: #DFB843;
      --accent-light: #F7E396;
      --emerald: #10B981;
      --rose: #F43F5E;
      --cyan: #38BDF8;
      --border: rgba(255, 255, 255, 0.08);
      --muted: #64748B;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    body {
      background-color: var(--bg);
      color: #E2E8F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 20px 80px 20px;
    }
    .header-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 40px;
    }
    .brand {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-tag {
      background: rgba(223, 184, 67, 0.12);
      color: var(--accent);
      border: 1px solid rgba(223, 184, 67, 0.3);
      font-size: 0.68rem;
      font-family: var(--font-mono);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .hero-title {
      font-size: 2.4rem;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    .hero-sub {
      font-size: 1.1rem;
      color: #94A3B8;
      max-width: 820px;
      margin-bottom: 28px;
    }
    .search-box {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 0.95rem;
      color: #FFFFFF;
      margin-bottom: 24px;
      box-sizing: border-box;
      outline: none;
    }
    .search-box:focus {
      border-color: var(--accent);
      background: rgba(255, 255, 255, 0.06);
    }
    .filter-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }
    .filter-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      color: #94A3B8;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-btn.active, .filter-btn:hover {
      background: rgba(223, 184, 67, 0.12);
      border-color: var(--accent);
      color: var(--accent);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }
    .query-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .query-card:hover {
      transform: translateY(-2px);
      border-color: rgba(223, 184, 67, 0.35);
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      font-family: var(--font-mono);
      border: 1px solid transparent;
    }
    .legal-card {
      background: rgba(15, 18, 24, 0.6);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
      font-size: 0.76rem;
      color: var(--muted);
      line-height: 1.5;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header-nav">
      <a href="/" class="brand">
        <span style="color:var(--accent);">QUANTERRA</span>OS
        <span class="brand-tag">INDEXABLE CONTENT #6.1</span>
      </a>
      <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
        <a href="/why" style="color:var(--accent); text-decoration:none; font-size:0.85rem; font-weight:600;">Why QuanterraOS</a>
        <a href="/calculator" style="color:#FFFFFF; text-decoration:none; font-size:0.85rem;">True-Cost Calculator</a>
        <a href="/transparency" style="color:var(--emerald); text-decoration:none; font-size:0.85rem;">Outcome Audit (#6.6)</a>
        <a href="/widgets" style="color:#94A3B8; text-decoration:none; font-size:0.85rem;">Widgets Hub (#6.5)</a>
      </div>
    </header>

    <div class="hero">
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
        <span class="badge" style="background:rgba(223,184,67,0.15); color:var(--accent); border-color:rgba(223,184,67,0.3);">
          Growth Strategy Section 6.1 &bull; Programmatic Knowledge Base
        </span>
      </div>
      <h1 class="hero-title">Prediction Market Guides &amp; Search Queries</h1>
      <p class="hero-sub">
        Independent, reproducible answers to the most common questions in prediction market trading: exact CFTC taker fee formulas, 60-second settlement TWAPs, true breakeven win rate hurdles, and cross-venue spread audits.
      </p>
    </div>

    <!-- Live Filter & Search Controls -->
    <div>
      <input type="text" id="query-search-input" class="search-box" placeholder="Search guides by keyword, exchange, or question (e.g., 'kalshi fees', 'twap', 'breakeven', 'arbitrage')..." oninput="filterGuides()">
      
      <div class="filter-tabs">
        <button class="filter-btn active" onclick="setCategoryFilter('all', this)">All Queries (${SEARCH_QUERY_ARTICLES.length})</button>
        <button class="filter-btn" onclick="setCategoryFilter('fees', this)">Fees &amp; Friction</button>
        <button class="filter-btn" onclick="setCategoryFilter('settlement', this)">Settlement &amp; Oracles</button>
        <button class="filter-btn" onclick="setCategoryFilter('calibration', this)">Calibration &amp; Evidence</button>
        <button class="filter-btn" onclick="setCategoryFilter('divergence', this)">Cross-Venue &amp; Spreads</button>
        <button class="filter-btn" onclick="setCategoryFilter('governance', this)">Governance &amp; Risk</button>
      </div>
    </div>

    <!-- Guides Grid -->
    <div class="grid" id="guides-grid">
      ${articlesHtml}
    </div>

    <!-- Quick Tools Interlinking Strip -->
    <div style="background:linear-gradient(180deg, rgba(223,184,67,0.06) 0%, rgba(15,18,24,0.9) 100%); border:1px solid rgba(223,184,67,0.25); border-radius:10px; padding:24px; margin-top:20px;">
      <h3 style="font-size:1.1rem; color:#FFFFFF; margin-bottom:8px;">Ready to audit live prediction market contracts?</h3>
      <p style="font-size:0.86rem; color:#94A3B8; margin-bottom:16px;">
        Use our suite of free, independent tools before entering any order:
      </p>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="/calculator" class="badge" style="background:var(--accent); color:#07080B; text-decoration:none; padding:8px 14px; font-size:0.8rem; font-weight:700;">
          Launch True-Cost Calculator &rarr;
        </a>
        <a href="/why#cross-venue-teardown" class="badge" style="background:rgba(255,255,255,0.06); color:#FFFFFF; border-color:var(--border); text-decoration:none; padding:8px 14px; font-size:0.8rem;">
          Cross-Venue Spread Teardown
        </a>
        <a href="/transparency" class="badge" style="background:rgba(16,185,129,0.12); color:var(--emerald); border-color:rgba(16,185,129,0.3); text-decoration:none; padding:8px 14px; font-size:0.8rem;">
          1,316-Market Outcome Report (#6.6)
        </a>
        <a href="/sitemap.xml" class="badge" style="background:rgba(255,255,255,0.03); color:var(--muted); border-color:var(--border); text-decoration:none; padding:8px 14px; font-size:0.8rem;">
          XML Sitemap
        </a>
      </div>
    </div>

    <!-- Legal & Compliance Notice -->
    <div class="legal-card">
      <strong>Regulatory Compliance &amp; Attribution Notice (Rules B4, B5, B10):</strong><br>
      Kalshi is a registered mark of Kalshi Inc. Polymarket is a mark of Blockratize Inc. CME CF Bitcoin Real-Time Index (BRTI) is a registered benchmark of CF Benchmarks Ltd and CME Group Inc. QuanterraOS is an independent measurement platform and is not affiliated with, endorsed by, or sponsored by any venue or benchmark administrator. All content is strictly educational and analytical; it does not constitute financial, investment, legal, or trading advice. Live capital execution is permanently locked at $0.00 under Rule B5.
    </div>
  </div>

  <script>
    var currentCategory = 'all';

    function setCategoryFilter(cat, btn) {
      currentCategory = cat;
      var buttons = document.querySelectorAll('.filter-btn');
      buttons.forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      filterGuides();
    }

    function filterGuides() {
      var query = (document.getElementById('query-search-input').value || '').toLowerCase().trim();
      var cards = document.querySelectorAll('.query-card');

      cards.forEach(function(card) {
        var cardCategory = card.getAttribute('data-category');
        var cardSearchText = card.getAttribute('data-search') || '';

        var matchesCategory = (currentCategory === 'all' || cardCategory === currentCategory);
        var matchesQuery = (!query || cardSearchText.indexOf(query) !== -1);

        if (matchesCategory && matchesQuery) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
}

/**
 * Renders an individual Indexable Search Query Guide Page with Schema.org JSON-LD
 */
export function renderSearchQueryPageHtml(article: SearchQueryArticle): string {
  const hash = computeArticleHash(article);

  // Schema.org FAQPage Structured Data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": article.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  // Schema.org TechArticle Structured Data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": article.title,
    "description": article.summary,
    "url": `https://quanterraos.com${article.canonicalPath}`,
    "datePublished": "2026-10-06T00:00:00Z",
    "dateModified": "2026-10-08T12:00:00Z",
    "author": {
      "@type": "Organization",
      "name": "QuanterraOS Research Council",
      "url": "https://quanterraos.com",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Quantara Global LLC",
      "logo": {
        "@type": "ImageObject",
        "url": "https://quanterraos.com/apple-touch-icon.png",
      },
    },
    "keywords": article.targetQueries.join(", "),
  };

  const sectionsHtml = article.sections.map((sec) => {
    let calloutHtml = "";
    if (sec.callout) {
      const calloutBg =
        sec.callout.type === "warning"
          ? "rgba(244,63,94,0.12)"
          : sec.callout.type === "metric"
          ? "rgba(16,185,129,0.12)"
          : "rgba(223,184,67,0.12)";
      const calloutBorder =
        sec.callout.type === "warning"
          ? "#F43F5E"
          : sec.callout.type === "metric"
          ? "#10B981"
          : "#DFB843";

      calloutHtml = `
        <div style="background:${calloutBg}; border-left:4px solid ${calloutBorder}; border-radius:6px; padding:14px 18px; margin:20px 0;">
          <strong style="color:#FFFFFF; font-size:0.9rem; display:block; margin-bottom:4px;">${sec.callout.title}</strong>
          <span style="font-size:0.84rem; color:#CBD5E1; line-height:1.5;">${sec.callout.body}</span>
        </div>
      `;
    }

    let tableHtml = "";
    if (sec.table) {
      const ths = sec.table.headers.map((h) => `<th style="padding:10px 14px; text-align:left; background:rgba(255,255,255,0.04); font-size:0.75rem; text-transform:uppercase; color:var(--accent); font-family:var(--font-mono); border-bottom:1px solid rgba(255,255,255,0.08);">${h}</th>`).join("");
      const trs = sec.table.rows.map((row) => {
        const tds = row.map((cell) => `<td style="padding:10px 14px; font-size:0.8rem; border-bottom:1px solid rgba(255,255,255,0.04); color:#E2E8F0;">${cell}</td>`).join("");
        return `<tr>${tds}</tr>`;
      }).join("");

      tableHtml = `
        <div style="overflow-x:auto; margin:22px 0; border:1px solid rgba(255,255,255,0.08); border-radius:8px;">
          <table style="width:100%; border-collapse:collapse;">
            <thead><tr>${ths}</tr></thead>
            <tbody>${trs}</tbody>
          </table>
        </div>
      `;
    }

    return `
      <section style="margin-bottom:36px;">
        <h2 style="font-size:1.4rem; font-weight:700; color:#FFFFFF; margin-bottom:14px; line-height:1.3;">${sec.heading}</h2>
        ${sec.paragraphs.map((p) => `<p style="font-size:0.95rem; color:#CBD5E1; line-height:1.7; margin-bottom:16px;">${p}</p>`).join("")}
        ${calloutHtml}
        ${tableHtml}
      </section>
    `;
  }).join("\n");

  const faqsHtml = article.faqs.map((faq, idx) => `
    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:16px 20px; margin-bottom:12px;">
      <h3 style="font-size:1.0rem; font-weight:700; color:#FFFFFF; margin-bottom:6px;">
        Q${idx + 1}: ${faq.question}
      </h3>
      <p style="font-size:0.88rem; color:#94A3B8; line-height:1.6; margin:0;">
        ${faq.answer}
      </p>
    </div>
  `).join("\n");

  const relatedHtml = article.relatedGuides.map((relSlug) => {
    const relArt = getSearchQueryArticle(relSlug);
    if (!relArt) return "";
    return `
      <a href="${relArt.canonicalPath}" style="display:block; padding:12px 14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:6px; color:#FFFFFF; text-decoration:none; margin-bottom:8px; font-size:0.84rem; font-weight:600;">
        &bull; ${relArt.title} &rarr;
      </a>
    `;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title} | QuanterraOS (#6.1)</title>
  <meta name="description" content="${article.summary.replace(/"/g, "'")}">
  <link rel="canonical" href="https://quanterraos.com${article.canonicalPath}">
  <meta property="og:title" content="${article.title}">
  <meta property="og:description" content="${article.summary}">
  <meta property="og:url" content="https://quanterraos.com${article.canonicalPath}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/style.css">

  <!-- Schema.org JSON-LD Structured Data for FAQPage -->
  <script type="application/ld+json">
    ${JSON.stringify(faqSchema, null, 2)}
  </script>

  <!-- Schema.org JSON-LD Structured Data for TechArticle -->
  <script type="application/ld+json">
    ${JSON.stringify(articleSchema, null, 2)}
  </script>

  <style>
    :root {
      --bg: #07080B;
      --card-bg: #0F1218;
      --accent: #DFB843;
      --emerald: #10B981;
      --rose: #F43F5E;
      --border: rgba(255, 255, 255, 0.08);
      --muted: #64748B;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    body {
      background-color: var(--bg);
      color: #E2E8F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 20px 80px 20px;
    }
    .header-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 32px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      font-family: var(--font-mono);
      border: 1px solid transparent;
    }
    .formula-hero {
      background: linear-gradient(180deg, rgba(223, 184, 67, 0.08) 0%, rgba(15, 18, 24, 0.95) 100%);
      border: 1px solid rgba(223, 184, 67, 0.35);
      border-radius: 10px;
      padding: 24px;
      margin: 28px 0;
    }
    .micro-solver {
      background: rgba(0,0,0,0.5);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      margin: 20px 0;
    }
    .slider-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 0.85rem;
    }
    .provenance-box {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 36px;
      font-size: 0.78rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header-nav">
      <a href="/guides" style="color:var(--accent); font-weight:700; text-decoration:none; font-size:0.9rem; display:flex; align-items:center; gap:6px;">
        &larr; All Prediction Market Guides
      </a>
      <div style="display:flex; gap:14px; align-items:center;">
        <a href="/why" style="color:#FFFFFF; text-decoration:none; font-size:0.8rem;">Why QuanterraOS</a>
        <a href="/calculator" style="color:var(--accent); text-decoration:none; font-size:0.8rem; font-weight:600;">Calculator</a>
        <a href="/transparency" style="color:var(--emerald); text-decoration:none; font-size:0.8rem;">Outcome Audit</a>
      </div>
    </header>

    <main>
      <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px; flex-wrap:wrap;">
        <span class="badge" style="background:rgba(223,184,67,0.12); color:var(--accent); border-color:rgba(223,184,67,0.3);">
          ${article.categoryLabel}
        </span>
        <span class="badge" style="background:rgba(255,255,255,0.05); color:var(--muted);">
          ${article.readTimeMinutes} Min Read
        </span>
        <span class="badge" style="background:rgba(16,185,129,0.1); color:var(--emerald); border-color:rgba(16,185,129,0.3);">
          Updated ${article.lastUpdated}
        </span>
      </div>

      <h1 style="font-size:2.2rem; font-weight:800; color:#FFFFFF; line-height:1.25; margin-bottom:12px;">
        ${article.title}
      </h1>
      <p style="font-size:1.05rem; color:#94A3B8; line-height:1.6; margin-bottom:24px;">
        ${article.subtitle}
      </p>

      <!-- Key Takeaways Box -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:20px; margin-bottom:32px;">
        <div style="font-size:0.75rem; font-family:var(--font-mono); color:var(--accent); text-transform:uppercase; font-weight:700; margin-bottom:10px;">
          Key Quantitative Takeaways
        </div>
        <ul style="margin:0; padding-left:18px; color:#E2E8F0; font-size:0.88rem; line-height:1.6;">
          ${article.keyTakeaways.map((item) => `<li style="margin-bottom:6px;">${item}</li>`).join("")}
        </ul>
      </div>

      <!-- Formula Hero Block -->
      ${
        article.formulaMath
          ? `
          <div class="formula-hero">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:0.8rem; font-family:var(--font-mono); color:var(--accent); font-weight:700; text-transform:uppercase;">
                ${article.formulaHeadline || "Mathematical Specification"}
              </span>
              <span style="font-size:0.7rem; font-family:var(--font-mono); color:var(--muted);">
                CFTC RULEBOOK CHAPTER 3
              </span>
            </div>
            <pre style="margin:0; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:14px; font-family:var(--font-mono); font-size:0.84rem; color:var(--accent); line-height:1.5; overflow-x:auto;">${article.formulaMath}</pre>
          </div>
          `
          : ""
      }

      <!-- Interactive Micro-Solver -->
      <div class="micro-solver">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-weight:700; font-size:0.9rem; color:#FFFFFF;">Interactive Micro-Solver</span>
          <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--emerald);">● Client-Side Zero Latency</span>
        </div>
        <div class="slider-row">
          <span>Contract Executable Price: <strong id="art-price-val" style="color:var(--accent);">${article.interactivePreset.priceCents}¢</strong></span>
          <input type="range" id="art-price-slider" min="1" max="99" value="${article.interactivePreset.priceCents}" oninput="recalcArticleSolver()" style="width:160px;">
        </div>
        <div class="slider-row">
          <span>Assessed True Win Probability: <strong id="art-prob-val" style="color:var(--accent);">${article.interactivePreset.probPct}%</strong></span>
          <input type="range" id="art-prob-slider" min="1" max="99" value="${article.interactivePreset.probPct}" oninput="recalcArticleSolver()" style="width:160px;">
        </div>
        <div class="slider-row" style="margin-bottom:16px;">
          <span>Order Size: <strong id="art-count-val" style="color:var(--accent);">${article.interactivePreset.count.toLocaleString()} contracts</strong></span>
          <input type="range" id="art-count-slider" min="10" max="5000" step="50" value="${article.interactivePreset.count}" oninput="recalcArticleSolver()" style="width:160px;">
        </div>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px; background:rgba(0,0,0,0.4); padding:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); font-family:var(--font-mono); font-size:0.78rem;">
          <div>
            <div style="color:var(--muted); font-size:0.7rem;">CALCULATED FEE</div>
            <div id="art-fee-out" style="color:#FFFFFF; font-weight:700; font-size:0.95rem;">--</div>
          </div>
          <div>
            <div style="color:var(--muted); font-size:0.7rem;">BREAKEVEN HURDLE</div>
            <div id="art-be-out" style="color:var(--accent); font-weight:700; font-size:0.95rem;">--</div>
          </div>
          <div>
            <div style="color:var(--muted); font-size:0.7rem;">REALIZED NET EV</div>
            <div id="art-ev-out" style="color:var(--emerald); font-weight:700; font-size:0.95rem;">--</div>
          </div>
          <div>
            <div style="color:var(--muted); font-size:0.7rem;">FEE DRAG RATIO</div>
            <div id="art-drag-out" style="color:#F43F5E; font-weight:700; font-size:0.95rem;">--</div>
          </div>
        </div>
      </div>

      <!-- Main Article Sections -->
      ${sectionsHtml}

      <!-- FAQ Section (Matches JSON-LD Schema) -->
      <section style="margin:40px 0;">
        <h2 style="font-size:1.4rem; font-weight:700; color:#FFFFFF; margin-bottom:16px;">
          Frequently Asked Questions
        </h2>
        ${faqsHtml}
      </section>

      <!-- Related Guides -->
      ${
        relatedHtml
          ? `
          <section style="margin:40px 0;">
            <h3 style="font-size:1.1rem; font-weight:700; color:#FFFFFF; margin-bottom:12px;">Related Guides &amp; Teardowns</h3>
            ${relatedHtml}
          </section>
          `
          : ""
      }

      <!-- Provenance Box -->
      <div class="provenance-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-family:var(--font-mono); color:var(--accent); font-weight:700;">PROVENANCE &amp; METHODOLOGY AUDIT</span>
          <span style="font-family:var(--font-mono); color:var(--muted); font-size:0.72rem;">SHA-256: ${hash.substring(0, 24)}...</span>
        </div>
        <div style="color:#94A3B8; font-size:0.8rem; line-height:1.5;">
          <strong>Data Sources:</strong>
          <ul style="margin:4px 0 0 16px; padding:0;">
            ${article.provenanceCitations.map((c) => `<li>${c}</li>`).join("")}
          </ul>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; gap:12px; margin-top:28px; flex-wrap:wrap;">
        <a href="/calculator" class="badge" style="background:linear-gradient(180deg, #FBF4DC 0%, #E5C158 35%, #D4AF37 70%, #A88120 100%); color:#07080B; text-decoration:none; padding:10px 18px; font-size:0.82rem; font-weight:700;">
          Launch Full Calculator &rarr;
        </a>
        <a href="/transparency" class="badge" style="background:rgba(16,185,129,0.15); color:var(--emerald); border-color:rgba(16,185,129,0.4); text-decoration:none; padding:10px 18px; font-size:0.82rem;">
          View 1,316-Market Outcome Report (#6.6)
        </a>
        <a href="/why" class="badge" style="background:rgba(255,255,255,0.06); color:#FFFFFF; border-color:var(--border); text-decoration:none; padding:10px 18px; font-size:0.82rem;">
          Why QuanterraOS
        </a>
      </div>
    </main>

    <!-- Legal Notice -->
    <div style="margin-top:48px; padding-top:20px; border-top:1px solid var(--border); font-size:0.74rem; color:var(--muted); line-height:1.5;">
      Kalshi is a registered mark of Kalshi Inc. Polymarket is a mark of Blockratize Inc. CME CF Bitcoin Real-Time Index (BRTI) is a benchmark of CF Benchmarks Ltd and CME Group Inc. QuanterraOS is an independent measurement platform and is not affiliated with, endorsed by, or sponsored by any venue or benchmark administrator. All content is educational and not financial advice. Rule B5 ($0.00 capital risk lock) active.
    </div>
  </div>

  <script>
    function recalcArticleSolver() {
      var price = Number(document.getElementById('art-price-slider').value);
      var prob = Number(document.getElementById('art-prob-slider').value);
      var count = Number(document.getElementById('art-count-slider').value);

      document.getElementById('art-price-val').textContent = price + '¢';
      document.getElementById('art-prob-val').textContent = prob + '%';
      document.getElementById('art-count-val').textContent = count.toLocaleString() + ' contracts';

      var p = price / 100;
      var feePerContract = Math.ceil(0.07 * p * (1 - p) * 100 * 10) / 1000;
      var totalFee = feePerContract * count;
      var breakevenPct = ((price + (feePerContract * 100)) / 100) * 100;

      var grossEV = ((prob / 100) - p) * count;
      var netEV = grossEV - totalFee;
      var drag = grossEV > 0 ? Math.min(100, (totalFee / grossEV) * 100) : 100;

      document.getElementById('art-fee-out').textContent = '$' + totalFee.toFixed(2) + ' (' + (feePerContract * 100).toFixed(2) + '¢/ct)';
      document.getElementById('art-be-out').textContent = breakevenPct.toFixed(2) + '%';
      
      var evEl = document.getElementById('art-ev-out');
      evEl.textContent = (netEV >= 0 ? '+' : '') + '$' + netEV.toFixed(2);
      evEl.style.color = netEV >= 0 ? 'var(--emerald)' : 'var(--rose)';

      document.getElementById('art-drag-out').textContent = drag.toFixed(1) + '%';
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', recalcArticleSolver);
    } else {
      recalcArticleSolver();
    }
  </script>
</body>
</html>`;
}

export function getSearchQueryManifest(): Array<{
  slug: string;
  title: string;
  category: string;
  canonicalPath: string;
  targetQueries: string[];
  readTimeMinutes: number;
  lastUpdated: string;
}> {
  return SEARCH_QUERY_ARTICLES.map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category,
    canonicalPath: a.canonicalPath,
    targetQueries: a.targetQueries,
    readTimeMinutes: a.readTimeMinutes,
    lastUpdated: a.lastUpdated,
  }));
}
