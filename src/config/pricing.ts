/**
 * QuanterraOS Pricing Configuration (Single Source of Truth)
 *
 * Governed strictly by QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md (Part 4).
 * Single source of truth for:
 * - Public site (/pricing and homepage)
 * - Clerk Billing plan mapping (free, pilot, commander, builder, institutional)
 * - Developer and coaching add-ons
 */

export interface PricingPlan {
  id: "cadet" | "pilot" | "commander" | "builder" | "institutional";
  name: string;
  badge?: string;
  priceMonthly: number;
  priceAnnual?: number;
  priceDisplay: string;
  billingPeriod: string;
  trialDays?: number;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  isPopular?: boolean;
}

export interface CoachingAddon {
  id: string;
  name: string;
  priceDisplay: string;
  description: string;
  sessions: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "cadet",
    name: "Cadet",
    badge: "Free Forever",
    priceMonthly: 0,
    priceDisplay: "$0",
    billingPeriod: "forever free",
    description: "Essential decision checks, delayed settlement radar, and disciplined local journaling.",
    features: [
      "Unlimited Free True-Cost & Breakeven Checks",
      "Public Settlement Radar (20-min delayed)",
      "Local browser-cached Mission Log",
      "3 daily discipline missions",
      "Aria ship's computer (basic arithmetic & help)",
      "Flight School foundational lessons",
      "Community widgets (rate-limited)",
      "Free developer API key (1,000 req/mo)"
    ],
    ctaText: "Start Free",
    ctaHref: "/check",
    isPopular: false,
  },
  {
    id: "pilot",
    name: "Pilot",
    badge: "Most Popular",
    priceMonthly: 39,
    priceAnnual: 349,
    priceDisplay: "$39",
    billingPeriod: "per month ($349/yr)",
    trialDays: 14,
    description: "Full real-time flight deck for active prediction market traders seeking fee reduction and calibrated forecasting.",
    features: [
      "Real-time Settlement Radar & browser push alerts",
      "Maker/Taker Saver ($0.07 friction audit)",
      "Rounding Optimizer (consolidation savings)",
      "Encrypted Cloud Mission Log with Kalshi CSV import",
      "Fees-paid vs avoidable fee dashboard",
      "Shadow Mode: paper-follow whale flow net-of-fees",
      "Full 8-specialist AI Crew station access",
      "All missions, cosmic ranks, and ship cosmetic skins",
      "Priority customer service (<24h SLA)"
    ],
    ctaText: "Start 14-Day Free Trial",
    ctaHref: "/account?plan=pilot",
    isPopular: true,
  },
  {
    id: "commander",
    name: "Commander",
    badge: "Professional Desk",
    priceMonthly: 399,
    priceDisplay: "$399",
    billingPeriod: "per month (annual)",
    description: "Institutional-grade cockpit with cross-venue net-spread scanning, multi-account ledger, and personal coaching.",
    features: [
      "Everything in Pilot tier included",
      "Multi-account Mission Log & portfolio segregation",
      "Cross-venue net-spread scanner (Kalshi vs Polymarket net-after-fees)",
      "Direct low-latency WebSocket live telemetry feed",
      "Full tick data & transaction ledger exports (CSV/JSON)",
      "1 Flight Instructor human coaching session / month (process-only)",
      "Rapid desk support (<4 business hours SLA)"
    ],
    ctaText: "Launch Commander Desk",
    ctaHref: "/account?plan=commander",
    isPopular: false,
  },
  {
    id: "builder",
    name: "Builder API",
    badge: "Developer",
    priceMonthly: 49,
    priceDisplay: "$49",
    billingPeriod: "per month",
    description: "Self-serve API access with OpenAPI 3.1 specs and remote Model Context Protocol (MCP) server endpoints.",
    features: [
      "50,000 API requests / month",
      "Real-time REST endpoints & live price feeds",
      "Remote MCP endpoint integration for AI coding agents",
      "OpenAPI 3.1 spec, llms.txt, and agents.md support",
      "Constituent exchange tick feeds (Coinbase, Kraken, Bitstamp)"
    ],
    ctaText: "Get API Key",
    ctaHref: "/developers",
    isPopular: false,
  },
  {
    id: "institutional",
    name: "Institutional / Data",
    badge: "Enterprise",
    priceMonthly: 1500,
    priceDisplay: "Custom",
    billingPeriod: "anchor $1,500+/mo",
    description: "Dedicated data licensing, custom unmetered streams, and historical research corpora for quant funds and market makers.",
    features: [
      "Unmetered dedicated WebSocket & historical data feeds",
      "1,316-window canonical calibration corpus & book snapshots",
      "White-label embeddable widgets for media partners",
      "Dedicated Slack / Microsoft Teams engineering channel",
      "Enterprise uptime Service Level Agreement (99.9%)",
      "Bespoke contract and manual invoicing support"
    ],
    ctaText: "Book Institutional Call",
    ctaHref: "/institutional",
    isPopular: false,
  },
];

export const COACHING_ADDON: CoachingAddon = {
  id: "flight-instructor",
  name: "Flight Instructor Coaching",
  priceDisplay: "$149 / session or $399 / mo (4 sessions)",
  description: "Human process coaching on trading discipline, journal analysis, fee auditing, and calibration mastery. Strictly process coaching — zero trade calling or buy/sell recommendations.",
  sessions: "30 or 60-minute confidential 1-on-1 sessions",
};
