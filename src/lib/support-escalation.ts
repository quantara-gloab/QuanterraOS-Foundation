/**
 * QuanterraOS Support Escalation & Help Center Knowledge Engine (Task 7.2)
 *
 * Implements QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md (Part 3.7 & Part 4):
 * - Aria 24/7 in-app for product questions + "Talk to a human" escalation
 *   to support@quanterraos.com with conversation attached (consent-gated).
 * - Human SLA tagging by plan:
 *     - Cadet (Free): < 72 hours
 *     - Builder API: < 48 hours
 *     - Pilot (Pro): < 24 hours
 *     - Commander (Desk): < 4 business hours
 *     - Institutional: < 1 hour (dedicated Slack/Teams)
 * - /help center: searchable articles generated from Flight School + FAQ;
 *   each article ends with "Still stuck? Ask Aria."
 */

import { type Plan } from "../plan.ts";

export interface SupportTicket {
  ticketId: string;
  userId: string;
  email: string;
  plan: Plan;
  slaTag: string;
  slaMaxHours: number;
  subject: string;
  message: string;
  attachedAriaTranscript?: Array<{ role: string; content: string }>;
  userConsentGiven: boolean;
  destinationEmail: string;
  status: "OPEN" | "ROUTED" | "RESOLVED";
  createdAt: string;
}

export interface HelpArticle {
  id: string;
  category: "fees" | "settlement" | "flight-deck" | "billing" | "responsible-trading";
  title: string;
  summary: string;
  content: string;
  tags: string[];
  askAriaPrompt: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "art-kalshi-fees",
    category: "fees",
    title: "Understanding the Parabolic Kalshi Taker Fee Schedule",
    summary: "Why taker fees peak at 50¢ ($1.75 per 100 contracts) and how maker limit orders eliminate 100% of exchange friction.",
    content: "Kalshi taker fees follow the regulatory formula $0.07 × C × P × (1 - P), rounded up to the nearest cent. Trading at 50¢ incurs maximum friction ($1.75 per 100 contracts), shifting your required breakeven win rate to 51.75%. Posting resting limit orders (Maker mode) incurs $0.00 in trading fees.",
    tags: ["fees", "kalshi", "maker", "taker", "saver"],
    askAriaPrompt: "Explain the Kalshi parabolic fee curve and calculate the breakeven hurdle for 50¢ contracts",
  },
  {
    id: "art-settlement-twap",
    category: "settlement",
    title: "How CME CF BRTI 60-Second TWAP Settlement Works",
    summary: "Kalshi KXBTC15M contracts resolve against the CME CF Bitcoin Real-Time Index TWAP, not spot prices on retail apps.",
    content: "Settlement occurs across seconds 840–900 (the final 60 seconds) of the 15-minute contract window. CME CF calculates a Time-Weighted Average Price across 4 constituent spot exchanges: Coinbase, Kraken, Bitstamp, and Gemini. If spot swings in the final seconds, TWAP dampens the move.",
    tags: ["settlement", "brti", "twap", "cme", "navigation"],
    askAriaPrompt: "How does the CME CF BRTI 60-second TWAP settlement calculate constituent dispersion?",
  },
  {
    id: "art-responsible-tilt",
    category: "responsible-trading",
    title: "Responsible Trading: Loss Limits & the 15-Minute Tilt Shield",
    summary: "Built-in behavioral protections: setting daily/weekly max losses and understanding automated tilt cooldowns.",
    content: "When 3 consecutive losses occur within 60 minutes or rapid re-entry is detected, QuanterraOS engages a 15-minute system cooldown overlay. While dismissable, respecting the cooldown earns +25 XP toward your Pilot Rank. Loss limits and fee budgets persist across your devices.",
    tags: ["risk", "tilt", "cooldown", "limits", "discipline"],
    askAriaPrompt: "How does the 15-minute tilt shield protect my loss limits and reward discipline XP?",
  },
  {
    id: "art-shadow-mode",
    category: "flight-deck",
    title: "Shadow Mode: Paper-Following Public Flow Without Live Routing",
    summary: "Paper-record copy fills on public Polymarket wallets or whale filters with realistic slippage and fee friction.",
    content: "Under CFTC Rule 4.41 compliance, Shadow Mode models what you would have netted after fees, slippage (+1¢), and latency (250–350ms) without risking live capital or connecting brokerages. QuanterraOS never routes orders to exchanges.",
    tags: ["shadow", "paper", "sensors", "whales", "rule-441"],
    askAriaPrompt: "How does Shadow Mode track public whale transactions without routing orders?",
  },
  {
    id: "art-clerk-billing",
    category: "billing",
    title: "Clerk Billing Plans, Tiers, and Feature Gates",
    summary: "A breakdown of Cadet ($0), Pilot ($39/mo), Commander ($399/mo), and Builder API ($49/mo) plans.",
    content: "Subscriptions are managed securely via Clerk Billing. Cadet includes unlimited true-cost checks and delayed Radar. Pilot unlocks real-time Radar, Maker Saver, cloud logs, and Shadow Mode. Commander adds cross-venue spread scanning, live WebSockets, and 1 human coaching session per month.",
    tags: ["billing", "pricing", "plans", "clerk", "pilot", "commander"],
    askAriaPrompt: "What features are included in the Pilot and Commander plans?",
  },
  {
    id: "art-flight-instructors",
    category: "flight-deck",
    title: "Flight Instructors: 1-on-1 Human Process Coaching",
    summary: "How our human instructors coach decision hygiene, probability calibration, and fee avoidance without giving trade calls.",
    content: "Flight Instructors are experienced market coaches who review your Mission Log, avoidable fee friction, and Brier calibration. Under Part 3.8 and Rule B5 policies, instructors never provide buy/sell picks or speculative advice.",
    tags: ["coaching", "instructors", "flight-school", "review"],
    askAriaPrompt: "How can I book a session with a human Flight Instructor?",
  },
];

const inMemoryTickets: SupportTicket[] = [];

/**
 * Determine SLA response target and badge by user plan
 */
export function getPlanSupportSla(plan: Plan): { slaTag: string; maxHours: number } {
  switch (plan) {
    case "institutional":
      return { slaTag: "Institutional Priority (<1h Dedicated Slack/Teams)", maxHours: 1 };
    case "commander":
      return { slaTag: "Commander Desk Priority (<4 Business Hours SLA)", maxHours: 4 };
    case "pro":
    case "pilot":
      return { slaTag: "Pilot Pro Priority (<24 Hours SLA)", maxHours: 24 };
    case "builder":
      return { slaTag: "Builder Developer Support (<48 Hours SLA)", maxHours: 48 };
    case "cadet":
    case "plus":
    case "free":
    default:
      return { slaTag: "Standard Cadet Community Support (<72 Hours SLA)", maxHours: 72 };
  }
}

/**
 * Search help articles by query string
 */
export function searchHelpArticles(query?: string): HelpArticle[] {
  if (!query || !query.trim()) {
    return HELP_ARTICLES;
  }
  const q = query.toLowerCase().trim();
  return HELP_ARTICLES.filter((art) => {
    return (
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      art.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/**
 * Create a new customer support escalation ticket
 */
export function createSupportTicket(params: {
  userId?: string;
  email: string;
  plan?: Plan;
  subject: string;
  message: string;
  attachedAriaTranscript?: Array<{ role: string; content: string }>;
  userConsentGiven: boolean;
}): SupportTicket {
  if (!params.email || !params.email.includes("@")) {
    throw new Error("A valid email address is required to submit a support ticket.");
  }
  if (!params.subject || !params.subject.trim()) {
    throw new Error("Ticket subject is required.");
  }
  if (!params.message || !params.message.trim()) {
    throw new Error("Ticket description message is required.");
  }

  // If transcript is attached, user consent MUST be explicitly true
  if (params.attachedAriaTranscript && params.attachedAriaTranscript.length > 0 && !params.userConsentGiven) {
    throw new Error("Consent required: You must explicitly authorize attaching your Aria conversation transcript.");
  }

  const plan = params.plan || "cadet";
  const { slaTag, maxHours } = getPlanSupportSla(plan);

  const ticket: SupportTicket = {
    ticketId: `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: params.userId || "anonymous",
    email: params.email.trim(),
    plan,
    slaTag,
    slaMaxHours: maxHours,
    subject: params.subject.trim(),
    message: params.message.trim(),
    attachedAriaTranscript: params.userConsentGiven ? params.attachedAriaTranscript : undefined,
    userConsentGiven: Boolean(params.userConsentGiven),
    destinationEmail: "support@quanterraos.com",
    status: "ROUTED",
    createdAt: new Date().toISOString(),
  };

  inMemoryTickets.unshift(ticket);
  return ticket;
}

export function getAllSupportTickets(): SupportTicket[] {
  return inMemoryTickets;
}
