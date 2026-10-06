# 10DLC SMS Compliance & Carrier Registration Guide: QuanterraOS

**Scope:** Step-by-step carrier filing and technical operational guide for registered Application-to-Person (A2P) 10DLC messaging for `quanterraos.com`.

> [!IMPORTANT]
> **Strict Anti-Spam / Anti-Scam Standard:**
> QuanterraOS transmits marketing and informational SMS **only** to individuals who have given prior express written consent via an explicit, unchecked checkbox.
> **Zero purchased, scraped, or "nationwide" cold lists.** Any cold text is a severe TCPA violation with statutory damages ($500–$1,500 per message) and causes immediate carrier suspension.

---

## 1. 10DLC Registration Requirements (Twilio Console)

U.S. wireless carriers (AT&T, T-Mobile, Verizon) require all A2P messaging from 10-digit long code numbers to be vetted through The Campaign Registry (TCR).

### Phase 1: Brand Registration (Legal Entity)
Navigate to **Twilio Console → Messaging → Regulatory Compliance → A2P 10DLC → Brands**:
- **Legal Business Name:** Quantara Global LLC
- **Country of Registration:** United States
- **Tax ID Type:** EIN (Employer Identification Number)
- **Tax ID Number:** *(Enter Quantara Global LLC EIN)*
- **Company Address:** Quantara Global LLC address (must match IRS EIN registration document verbatim)
- **Vertical:** Technology / Financial Technology / Software
- **Contact:** `team@quanterraos.com`

---

### Phase 2: Campaign Registration

Under the approved Brand, create a new Campaign:
- **Campaign Use Case:** `Marketing` or `Customer Care / Mixed`
- **Campaign Description:**
  > *"QuanterraOS (Quantara Global LLC) provides independent pricing, settlement, and transaction friction intelligence for prediction markets. This campaign delivers real-time market dispersion telemetry, weekly empirical calibration reports, and software platform release announcements to users who have explicitly opted in on our website."*

#### Sample Messages (Must Include Sender Name + STOP):
1. **Sample Message 1 (Market Telemetry Alert):**
   > *"QuanterraOS: BTC-to-BRTI basis dispersion on KXBTC15M reached 38 bps. Live cross-venue monitor updated at https://quanterraos.com/spread. Reply STOP to cancel."*
2. **Sample Message 2 (Calibration Milestone):**
   > *"QuanterraOS: Weekly calibration report published across 1,316 settled windows. View minute-by-minute calibration surface: https://quanterraos.com/calibration/surface. Reply STOP to cancel."*
3. **Sample Message 3 (Product Release):**
   > *"QuanterraOS: Model Context Protocol (MCP) server integration is now live for Pro subscribers. Details at https://quanterraos.com/mcp. Reply STOP to cancel."*

#### Opt-In Information & Proof:
- **How do users opt in?**
  > *"End users opt in by providing their mobile phone number and checking an explicit, separate, unchecked-by-default checkbox on our registration portal (https://quanterraos.com/account) or our dedicated telemetry subscription page (https://quanterraos.com/sms). Consent is not bundled with account creation or terms of service."*
- **Opt-In Message / Disclosure Text:**
  > *"I agree to receive marketing texts from QuanterraOS. Message and data rates may apply. Message frequency varies. Reply STOP to unsubscribe, HELP for help."*
- **Opt-In Keywords:**
  > `START`, `YES`, `UNSTOP`

---

## 2. Inbound Keyword Handling (Mandatory)

The QuanterraOS backend automates carrier-mandated keyword responses via `/api/sms/webhook`:

| Inbound Keyword(s) | Action Taken in Code | Auto-Reply Transmitted (TwiML) |
| :--- | :--- | :--- |
| **`STOP`, `STOPALL`, `UNSUBSCRIBE`, `CANCEL`, `END`, `QUIT`** | Status immediately flipped to `unsubscribed` in database; suppression ledger updated; future sends blocked in application code. | *"You have successfully been unsubscribed from QuanterraOS alerts. You will not receive any more messages. Reply START to resubscribe."* |
| **`HELP`, `INFO`** | Logs inquiry; returns legal sender identity, frequency, and support email. | *"QuanterraOS: Automated product & market intelligence. Frequency varies. Reply STOP to unsubscribe. Support: team@quanterraos.com. Msg&data rates may apply."* |
| **`START`, `UNSTOP`, `YES`** | Re-activates consent with fresh timestamp. | *"QuanterraOS: Welcome back to alerts. Msg&data rates may apply. Frequency varies. Reply STOP to cancel, HELP for help."* |

---

## 3. Application-Layer Hard Enforcement

In [`src/sms-marketing.ts`](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/src/sms-marketing.ts), `sendMarketingSms()` enforces the following checks before dispatching any SMS:

```typescript
// 1. Phone validation (E.164 normalization)
const normPhone = normalizeE164Phone(options.to);

// 2. Consent presence check
const consent = getSmsConsent(normPhone);
if (!consent) {
  throw new Error("TCPA_VIOLATION_BLOCKED: Recipient has NO consent record.");
}

// 3. Subscription status check
if (consent.status !== "subscribed") {
  throw new Error("RECIPIENT_UNSUBSCRIBED: Recipient is opted out. Send blocked.");
}

// 4. Copy guardrail validation
const check = validateSmsCopy(options.message);
if (!check.valid) {
  throw new Error("COPY_GUARDRAIL_VIOLATION: " + check.errors.join("; "));
}
```

---

## 4. Verification Checklist

1. [x] **Unchecked by default:** Checkbox on `/account` and `/sms` requires deliberate user interaction.
2. [x] **Separation of consent:** Account creation succeeds without phone number or SMS opt-in.
3. [x] **Audit trail:** Database records `phone`, `consent_timestamp`, `consent_source`, `disclosure_text`, `ip`, and `user_agent`.
4. [x] **Zero cold texting:** No CSV upload or batch import path can send texts without an active `subscribed` consent row.
5. [x] **Instant STOP suppression:** Inbound STOP immediately sets `status = 'unsubscribed'` and halts all future messages.
6. [x] **Sender branding:** All outbound messages lead with `"QuanterraOS:"` and close with opt-out instructions.
