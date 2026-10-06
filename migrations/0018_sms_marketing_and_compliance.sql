-- Migration 0018: Compliant SMS Marketing & 10DLC Consent Ledger
-- Strictly enforces opt-in tracking, consent audit trails, and mandatory STOP/HELP handling.

CREATE TABLE IF NOT EXISTS sms_consents (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  user_id TEXT REFERENCES users(id),
  lead_id TEXT REFERENCES leads(id),
  status TEXT NOT NULL DEFAULT 'subscribed', -- 'subscribed' | 'unsubscribed'
  consent_timestamp TEXT NOT NULL,
  consent_source TEXT NOT NULL,             -- e.g. 'signup_form', 'sms_lead_page', 'concierge_chat'
  disclosure_text TEXT NOT NULL,            -- exact statutory disclosure agreed to
  ip TEXT,
  user_agent TEXT,
  opt_out_timestamp TEXT,
  opt_out_reason TEXT,                      -- e.g. 'inbound_stop', 'inbound_unsubscribe', 'account_toggle'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sms_consents_phone_idx ON sms_consents(phone);
CREATE INDEX IF NOT EXISTS sms_consents_status_idx ON sms_consents(status);
CREATE INDEX IF NOT EXISTS sms_consents_user_id_idx ON sms_consents(user_id);

CREATE TABLE IF NOT EXISTS sms_send_log (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  campaign_id TEXT,
  status TEXT NOT NULL,                     -- 'sent' | 'blocked' | 'failed' | 'dry_run'
  provider_sid TEXT,
  error_detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sms_send_log_phone_idx ON sms_send_log(phone);
CREATE INDEX IF NOT EXISTS sms_send_log_created_at_idx ON sms_send_log(created_at);
