/**
 * QuanterraOS Odds Defenders Campaign Configuration & Feature Flags
 *
 * Platform: "Destroy confusion. Decode the odds."
 * Champions: Kalshi Destroyer & Polymarket Terminator
 */

export interface CampaignFeatureFlags {
  campaign_odds_defenders: boolean;
  campaign_share_cards: boolean;
  campaign_cosmetics: boolean;
}

// Default runtime flags (can be overridden by environment variables)
export const DEFAULT_CAMPAIGN_FLAGS: CampaignFeatureFlags = {
  campaign_odds_defenders: process.env.FEATURE_ODDS_DEFENDERS !== "false",
  campaign_share_cards: process.env.FEATURE_SHARE_CARDS !== "false",
  campaign_cosmetics: process.env.FEATURE_CAMPAIGN_COSMETICS !== "false",
};

let currentFlags: CampaignFeatureFlags = { ...DEFAULT_CAMPAIGN_FLAGS };

export function getCampaignFlags(): CampaignFeatureFlags {
  return { ...currentFlags };
}

export function setCampaignFlags(flags: Partial<CampaignFeatureFlags>): void {
  currentFlags = { ...currentFlags, ...flags };
}

export function resetCampaignFlags(): void {
  currentFlags = { ...DEFAULT_CAMPAIGN_FLAGS };
}

export function isCampaignEnabled(flag: keyof CampaignFeatureFlags = "campaign_odds_defenders"): boolean {
  return !!currentFlags[flag];
}

export function isShareCardsEnabled(): boolean {
  return !!currentFlags.campaign_share_cards;
}

export function isCampaignCosmeticsEnabled(): boolean {
  return !!currentFlags.campaign_cosmetics;
}

export function setCampaignFeatureFlag(flag: keyof CampaignFeatureFlags, enabled: boolean): void {
  currentFlags[flag] = enabled;
}

export const ODDS_DEFENDERS_COPY = {
  eyebrow: "QUANTERRAOS PRESENTS: THE ODDS DEFENDERS",
  headline: "Destroy confusion. Decode the odds.",
  support:
    "Trade on Kalshi or Polymarket? Bring your next decision into focus with Quanta and the Flight Crew. Check supported markets. Understand the entry-price assumptions, fees and settlement rules. See what’s known—and what still needs checking.",
  primaryCta: "Check a market",
  secondaryCta: "Meet the Odds Defenders",
  sectionHeading: "Two legends. One mission.",
  card1: {
    title: "KALSHI DESTROYER",
    character: "Emerald and white armored flight champion; arrow eyes; balanced YES/NO",
    body: "Break through confusing costs. Understand what your contract needs to overcome.",
    cta: "Explore Kalshi checks",
    venue: "kalshi" as const,
    image: "/assets/kalshi-destroyer.png",
    alt: "Kalshi Destroyer — Emerald and white armored flight champion; arrow eyes; balanced YES/NO",
    badge: "UNOFFICIAL COLLECTIBLE CONCEPT · KALSHI SPECIALIST"
  },
  card2: {
    title: "POLYMARKET TERMINATOR",
    character: "Cobalt/chrome orbital pilot; arrow eyes; balanced YES/NO",
    body: "Cut through uncertainty. Examine costs, liquidity assumptions and resolution rules.",
    cta: "Explore Polymarket checks",
    venue: "polymarket" as const,
    image: "/assets/polymarket-terminator.png",
    alt: "Polymarket Terminator — Cobalt and chrome orbital pilot; arrow eyes; balanced YES/NO",
    badge: "UNOFFICIAL COLLECTIBLE CONCEPT · POLYMARKET SPECIALIST"
  },
  bridge: "They don’t choose your side. They help you understand it.",
  howItWorksHeading: "Your decision deserves a receipt.",
  steps: [
    {
      num: 1,
      title: "Bring a supported market.",
      desc: "Paste its link or select a supported contract."
    },
    {
      num: 2,
      title: "Inspect the assumptions.",
      desc: "Review the price basis, calculated costs, settlement conditions and missing information."
    },
    {
      num: 3,
      title: "Keep your reasoning.",
      desc: "Save privately. Preview exactly what others will see before publishing a share card."
    }
  ],
  finalCta: "Start your cost check",
  closingLine: "Your exchange. Your decision. Your Flight Deck.",
  disclosure:
    "QuanterraOS is an independent analytics tool, unaffiliated with Kalshi or Polymarket. Collectible artwork is unofficial. Calculations depend on their inputs and sources; verify current information with your venue. Trading involves risk. 18+.",
  shareCaption: "I checked the assumptions before choosing a side. Here’s my Flight Receipt."
} as const;

export type CampaignEventType =
  | "campaign_view"
  | "defender_card_clicked"
  | "venue_selected"
  | "intake_started"
  | "receipt_resolved"
  | "receipt_failed"
  | "private_save_succeeded"
  | "share_preview_opened"
  | "receipt_publish_confirmed"
  | "share_link_copied"
  | "referral_landed"
  | "referred_valid_check"
  | "campaign_return_7d";

export interface CampaignEventRecord {
  id: string;
  eventType: CampaignEventType;
  event: CampaignEventType;
  venue?: "kalshi" | "polymarket" | "both" | "unknown";
  campaign: string;
  deviceClass: "desktop" | "mobile" | "tablet";
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

// In-memory sanitized analytics queue
const campaignEventQueue: CampaignEventRecord[] = [];

export function recordCampaignEvent(
  eventOrType: CampaignEventType | { event?: CampaignEventType; eventType?: CampaignEventType; venue?: any; device?: any; deviceClass?: any; channel?: any; metadata?: any },
  options: {
    venue?: "kalshi" | "polymarket" | "both" | "unknown";
    deviceClass?: "desktop" | "mobile" | "tablet";
    metadata?: Record<string, string | number | boolean>;
  } = {}
): CampaignEventRecord {
  let eventType: CampaignEventType;
  let venue: "kalshi" | "polymarket" | "both" | "unknown" = options.venue || "unknown";
  let deviceClass: "desktop" | "mobile" | "tablet" = options.deviceClass || "desktop";
  let metadata: Record<string, string | number | boolean> = options.metadata || {};

  if (typeof eventOrType === "object" && eventOrType !== null) {
    eventType = eventOrType.eventType || eventOrType.event || "campaign_view";
    if (eventOrType.venue) venue = eventOrType.venue;
    if (eventOrType.device) deviceClass = eventOrType.device === "mobile" ? "mobile" : eventOrType.device === "tablet" ? "tablet" : "desktop";
    if (eventOrType.deviceClass) deviceClass = eventOrType.deviceClass;
    if (eventOrType.channel) metadata.channel = eventOrType.channel;
    if (eventOrType.metadata) metadata = { ...metadata, ...eventOrType.metadata };
  } else {
    eventType = eventOrType;
  }

  const record: CampaignEventRecord = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    eventType,
    event: eventType,
    venue,
    campaign: "odds-defenders",
    deviceClass,
    timestamp: new Date().toISOString(),
    metadata
  };
  campaignEventQueue.push(record);
  if (campaignEventQueue.length > 1000) {
    campaignEventQueue.shift();
  }
  return record;
}

export function getCampaignEvents(): CampaignEventRecord[] {
  return [...campaignEventQueue];
}

export function clearCampaignEvents(): void {
  campaignEventQueue.length = 0;
}

export const resetCampaignEvents = clearCampaignEvents;
