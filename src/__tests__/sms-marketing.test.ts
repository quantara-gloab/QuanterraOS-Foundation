import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { runMigrations } from "../db.ts";
import {
  SMS_MARKETING_DISCLOSURE,
  normalizeE164Phone,
  recordSmsOptIn,
  recordSmsOptOut,
  getSmsConsent,
  handleInboundSms,
  validateSmsCopy,
  sendMarketingSms,
  validTwilioSmsSignature,
} from "../sms-marketing.ts";

// Ensure database migrations have run
runMigrations();

test("1. Phone Number Validation & E.164 Normalization", () => {
  // Valid formats
  assert.equal(normalizeE164Phone("+13125550199"), "+13125550199");
  assert.equal(normalizeE164Phone("3125550199"), "+13125550199");
  assert.equal(normalizeE164Phone("(312) 555-0199"), "+13125550199");
  assert.equal(normalizeE164Phone("13125550199"), "+13125550199");
  assert.equal(normalizeE164Phone("+442071838750"), "+442071838750");

  // Invalid formats
  assert.equal(normalizeE164Phone(""), null);
  assert.equal(normalizeE164Phone("123"), null);
  assert.equal(normalizeE164Phone("abcdefg"), null);
  assert.equal(normalizeE164Phone("0000000000"), "+10000000000"); // 10 digits gets +1
  assert.equal(normalizeE164Phone("++13125550199"), "+13125550199");
});

test("2. Opt-In Storage & Audit Trail", () => {
  const testPhone = "+13125550" + Math.floor(1000 + Math.random() * 9000);
  const optIn = recordSmsOptIn({
    phone: testPhone,
    source: "signup_form",
    disclosureText: SMS_MARKETING_DISCLOSURE,
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0 TestSuite",
  });

  assert.equal(optIn.phone, testPhone);
  assert.equal(optIn.status, "subscribed");
  assert.equal(optIn.consentSource, "signup_form");
  assert.equal(optIn.disclosureText, SMS_MARKETING_DISCLOSURE);
  assert.ok(optIn.consentTimestamp);
  assert.equal(optIn.optOutTimestamp, null);

  // Retrieve and verify persistent state
  const fetched = getSmsConsent(testPhone);
  assert.ok(fetched);
  assert.equal(fetched.phone, testPhone);
  assert.equal(fetched.status, "subscribed");
});

test("3. Application-Layer Gate: Blocks Unconsented Numbers (Anti-Cold Text)", async () => {
  const unconsentedPhone = "+1999555" + Math.floor(1000 + Math.random() * 9000);

  // Attempting to send to an unconsented number MUST throw an error
  await assert.rejects(
    async () => {
      await sendMarketingSms({
        to: unconsentedPhone,
        message: "QuanterraOS: Test telemetry update. Reply STOP to cancel.",
        dryRun: true,
      });
    },
    (err: Error) => {
      assert.match(err.message, /TCPA_VIOLATION_BLOCKED/);
      assert.match(err.message, /has NO consent record/);
      return true;
    },
  );
});

test("4. Inbound STOP and Carrier Opt-Out Keywords", async () => {
  const testPhone = "+13125550" + Math.floor(1000 + Math.random() * 9000);

  // 1. First record an opt-in
  recordSmsOptIn({
    phone: testPhone,
    source: "test_suite",
  });
  assert.equal(getSmsConsent(testPhone)?.status, "subscribed");

  // 2. Simulate inbound STOP webhook from carrier
  const stopResult = handleInboundSms({
    From: testPhone,
    Body: "STOP",
  });

  assert.equal(stopResult.action, "opt_out");
  assert.match(stopResult.replyTwiMl, /unsubscribed/i);

  // 3. Verify status in database flipped to unsubscribed
  const updated = getSmsConsent(testPhone);
  assert.ok(updated);
  assert.equal(updated.status, "unsubscribed");
  assert.ok(updated.optOutTimestamp);
  assert.equal(updated.optOutReason, "inbound_keyword_stop");

  // 4. Verify application-layer gate blocks future sends
  await assert.rejects(
    async () => {
      await sendMarketingSms({
        to: testPhone,
        message: "QuanterraOS: Live market update. Reply STOP to cancel.",
        dryRun: true,
      });
    },
    (err: Error) => {
      assert.match(err.message, /RECIPIENT_UNSUBSCRIBED/);
      return true;
    },
  );

  // 5. Test alternate mandatory opt-out aliases
  for (const kw of ["STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]) {
    const aliasPhone = "+13125550" + Math.floor(1000 + Math.random() * 9000);
    recordSmsOptIn({ phone: aliasPhone, source: "test_suite" });
    const res = handleInboundSms({ From: aliasPhone, Body: kw });
    assert.equal(res.action, "opt_out");
    assert.equal(getSmsConsent(aliasPhone)?.status, "unsubscribed");
  }
});

test("5. Inbound HELP and Information Keywords", () => {
  const testPhone = "+13125550199";
  for (const kw of ["HELP", "INFO", "help", "info"]) {
    const res = handleInboundSms({ From: testPhone, Body: kw });
    assert.equal(res.action, "help");
    assert.match(res.replyTwiMl, /QuanterraOS/);
    assert.match(res.replyTwiMl, /Reply STOP to unsubscribe/);
    assert.match(res.replyTwiMl, /team@quanterraos\.com/);
  }
});

test("6. Inbound Resubscribe (START / YES / UNSTOP)", () => {
  const testPhone = "+13125550" + Math.floor(1000 + Math.random() * 9000);
  recordSmsOptIn({ phone: testPhone, source: "test_suite" });
  recordSmsOptOut(testPhone, "user_stop");
  assert.equal(getSmsConsent(testPhone)?.status, "unsubscribed");

  // Inbound START
  const res = handleInboundSms({ From: testPhone, Body: "START" });
  assert.equal(res.action, "resubscribe");
  assert.match(res.replyTwiMl, /Welcome back/i);
  assert.equal(getSmsConsent(testPhone)?.status, "subscribed");
});

test("7. Copy Guardrail Validation for Outbound SMS", () => {
  // Valid compliant message
  const validMsg = "QuanterraOS: BTC-to-BRTI basis dispersion reached 34 bps. Monitor live at https://quanterraos.com/spread. Reply STOP to cancel.";
  const resValid = validateSmsCopy(validMsg);
  assert.equal(resValid.valid, true);
  assert.equal(resValid.errors.length, 0);

  // Missing sender identification
  const noSender = "BTC-to-BRTI basis dispersion reached 34 bps. Reply STOP to cancel.";
  const resNoSender = validateSmsCopy(noSender);
  assert.equal(resNoSender.valid, false);
  assert.match(resNoSender.errors[0], /Sender identification missing/);

  // Missing STOP instructions
  const noStop = "QuanterraOS: BTC-to-BRTI basis dispersion reached 34 bps. Monitor live at https://quanterraos.com/spread.";
  const resNoStop = validateSmsCopy(noStop);
  assert.equal(resNoStop.valid, false);
  assert.match(resNoStop.errors[0], /opt-out instructions missing/);

  // Prohibited superlatives and fake scarcity
  const bannedCases = [
    "QuanterraOS: Guaranteed returns on prediction contracts. Reply STOP to cancel.",
    "QuanterraOS: Stock expected to rise 20% today. Reply STOP to cancel.",
    "QuanterraOS: 100% win rate strategy unlocked. Reply STOP to cancel.",
    "QuanterraOS: Act fast! Today only pricing. Reply STOP to cancel.",
    "QuanterraOS: Beat the market with our secret algorithm. Reply STOP to cancel.",
  ];

  for (const msg of bannedCases) {
    const res = validateSmsCopy(msg);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes("prohibited marketing superlative")));
  }
});

test("8. Twilio Signature Verification", () => {
  const token = "secret_auth_token_12345";
  const url = "https://quanterraos.com/api/sms/webhook";
  const params = {
    From: "+13125550199",
    To: "+18005550100",
    Body: "HELP",
  };

  // Compute expected signature
  const keys = Object.keys(params).sort();
  let data = url;
  for (const k of keys) {
    data += k + (params as any)[k];
  }
  const validSig = createHmac("sha1", token).update(Buffer.from(data, "utf-8")).digest("base64");

  assert.equal(validTwilioSmsSignature(token, url, params, validSig), true);
  assert.equal(validTwilioSmsSignature(token, url, params, "invalid_sig"), false);
  assert.equal(validTwilioSmsSignature(token, url, { ...params, Body: "STOP" }, validSig), false);
});
