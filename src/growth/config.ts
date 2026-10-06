// Central configuration. Every value comes from the environment so nothing
// secret is committed. See .env.example for the full list.

export interface GrowthConfig {
  dbPath: string;
  publicBaseUrl: string; // e.g. https://quanterraos.com
  companyName: string;
  companyPostalAddress: string; // required in every commercial email (CAN-SPAM)
  senderName: string;
  senderEmail: string; // must be a domain you own, with SPF/DKIM/DMARC set up
  replyToEmail: string;
  hmacSecret: string; // signs unsubscribe links
  adminToken: string; // protects /api/growth/metrics and webhooks you call yourself

  anthropicApiKey: string;
  anthropicModel: string;

  emailProvider: "resend" | "postmark" | "console";
  emailApiKey: string;
  dailyEmailCap: number; // hard ceiling on cold sends per day
  maxColdTouches: number; // first email + follow-ups, then stop

  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
  callWindowStartHour: number; // recipient local time
  callWindowEndHour: number;
  maxCallAttempts: number;

  // Countries where cold B2B email is allowed. Defaults to US only.
  // Adding EU/UK/CA requires a documented lawful basis — see README.
  coldEmailCountries: string[];
}

function num(v: string | undefined, d: number): number {
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== "" ? n : d;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): GrowthConfig {
  const cfg: GrowthConfig = {
    dbPath: env.GROWTH_DB_PATH ?? "./data/growth.db",
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? "http://localhost:3102").replace(/\/$/, ""),
    companyName: env.COMPANY_NAME ?? "Quantara Global LLC",
    companyPostalAddress: env.COMPANY_POSTAL_ADDRESS ?? "",
    senderName: env.SENDER_NAME ?? "QuanterraOS",
    senderEmail: env.SENDER_EMAIL ?? "",
    replyToEmail: env.REPLY_TO_EMAIL ?? env.SENDER_EMAIL ?? "",
    hmacSecret: env.GROWTH_HMAC_SECRET ?? "",
    adminToken: env.GROWTH_ADMIN_TOKEN ?? "",

    anthropicApiKey: env.ANTHROPIC_API_KEY ?? "",
    anthropicModel: env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",

    emailProvider: (env.EMAIL_PROVIDER as GrowthConfig["emailProvider"]) ?? "console",
    emailApiKey: env.EMAIL_API_KEY ?? "",
    dailyEmailCap: num(env.DAILY_EMAIL_CAP, 200),
    maxColdTouches: num(env.MAX_COLD_TOUCHES, 3),

    twilioAccountSid: env.TWILIO_ACCOUNT_SID ?? "",
    twilioAuthToken: env.TWILIO_AUTH_TOKEN ?? "",
    twilioFromNumber: env.TWILIO_FROM_NUMBER ?? "",
    callWindowStartHour: num(env.CALL_WINDOW_START_HOUR, 9),
    callWindowEndHour: num(env.CALL_WINDOW_END_HOUR, 20),
    maxCallAttempts: num(env.MAX_CALL_ATTEMPTS, 2),

    coldEmailCountries: (env.COLD_EMAIL_COUNTRIES ?? "US")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
  };
  return cfg;
}

/** Problems that must be fixed before any outbound message is sent. */
export function outboundReadinessProblems(cfg: GrowthConfig): string[] {
  const p: string[] = [];
  if (!cfg.companyPostalAddress) p.push("COMPANY_POSTAL_ADDRESS is required in every commercial email");
  if (!cfg.senderEmail) p.push("SENDER_EMAIL is not set");
  if (cfg.hmacSecret.length < 32) p.push("GROWTH_HMAC_SECRET must be at least 32 characters");
  if (!cfg.publicBaseUrl.startsWith("https://") && cfg.emailProvider !== "console")
    p.push("PUBLIC_BASE_URL must be https for live sending (unsubscribe links)");
  return p;
}
