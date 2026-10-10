/**
 * QuanterraOS Institutional Inquiries & Lead Intake Engine
 *
 * Implements Master Blueprint v2 Part 3.10 & Part 4:
 * - Segmented buyer intake: Market Makers, Prop Desks, Macro Funds, Media Partners
 * - Enterprise SLA tagging (<1h response time)
 * - Validation & lead dispatch
 */

export type InstitutionalBuyerType = "market-maker" | "prop-desk" | "macro-fund" | "media-partner";

export interface InstitutionalInquiryInput {
  fullName: string;
  workEmail: string;
  firmName: string;
  buyerType: InstitutionalBuyerType;
  estimatedVolumeOrAum?: string;
  notes?: string;
}

export interface InstitutionalInquiryRecord extends InstitutionalInquiryInput {
  id: string;
  createdAt: string;
  status: "RECEIVED" | "IN_REVIEW" | "CALL_SCHEDULED";
  slaHours: number;
  assignedChannel: string;
}

// In-memory store for institutional leads
const INQUIRIES_STORE: InstitutionalInquiryRecord[] = [];

/**
 * Validates and records an enterprise institutional inquiry.
 */
export function recordInstitutionalInquiry(input: InstitutionalInquiryInput): {
  success: boolean;
  inquiry?: InstitutionalInquiryRecord;
  error?: string;
} {
  if (!input.fullName || input.fullName.trim().length < 2) {
    return { success: false, error: "Full name is required." };
  }

  if (!input.workEmail || !input.workEmail.includes("@") || !input.workEmail.includes(".")) {
    return { success: false, error: "A valid corporate or institutional email is required." };
  }

  if (!input.firmName || input.firmName.trim().length < 2) {
    return { success: false, error: "Firm or organization name is required." };
  }

  const validBuyerTypes: InstitutionalBuyerType[] = [
    "market-maker",
    "prop-desk",
    "macro-fund",
    "media-partner",
  ];
  if (!validBuyerTypes.includes(input.buyerType)) {
    return { success: false, error: "A valid institutional segment is required." };
  }

  const inquiry: InstitutionalInquiryRecord = {
    id: "inst_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
    fullName: input.fullName.trim(),
    workEmail: input.workEmail.trim().toLowerCase(),
    firmName: input.firmName.trim(),
    buyerType: input.buyerType,
    estimatedVolumeOrAum: input.estimatedVolumeOrAum?.trim() || "Not specified",
    notes: input.notes?.trim() || "General enterprise infrastructure inquiry",
    createdAt: new Date().toISOString(),
    status: "RECEIVED",
    slaHours: 1, // Part 3.7 Institutional dedicated channel <1h SLA
    assignedChannel: "institutional@quanterraos.com",
  };

  INQUIRIES_STORE.push(inquiry);
  return { success: true, inquiry };
}

/**
 * Returns all recorded institutional inquiries (for auditing & admin review).
 */
export function getInstitutionalInquiries(): InstitutionalInquiryRecord[] {
  return [...INQUIRIES_STORE];
}

/**
 * Returns a human-readable label for the buyer segment.
 */
export function getBuyerTypeLabel(type: InstitutionalBuyerType): string {
  switch (type) {
    case "market-maker":
      return "Market Maker & Liquidity Provider";
    case "prop-desk":
      return "Proprietary Trading Desk";
    case "macro-fund":
      return "Fund & Macro Research";
    case "media-partner":
      return "Media & Distribution Partner";
    default:
      return "Institutional Partner";
  }
}
