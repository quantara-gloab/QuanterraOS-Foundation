CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  title TEXT,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  tier_interest TEXT NOT NULL DEFAULT 'free',
  touches INTEGER NOT NULL DEFAULT 0,
  last_contact_at TEXT,
  next_followup_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);

CREATE TABLE IF NOT EXISTS ad_spend_caps (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL UNIQUE,
  daily_cap_usd REAL NOT NULL DEFAULT 100.0,
  monthly_cap_usd REAL NOT NULL DEFAULT 2500.0,
  current_day_spend_usd REAL NOT NULL DEFAULT 0.0,
  current_month_spend_usd REAL NOT NULL DEFAULT 0.0,
  circuit_locked INTEGER NOT NULL DEFAULT 1,
  approved_by TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ad_spend_ledger (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_drafts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  draft_text TEXT NOT NULL,
  provenance_sources TEXT NOT NULL,
  guardrail_status TEXT NOT NULL,
  guardrail_violations TEXT,
  review_status TEXT NOT NULL DEFAULT 'PENDING_HUMAN_APPROVAL',
  approved_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS institutional_pipeline (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  target_desk TEXT NOT NULL,
  target_tier TEXT NOT NULL DEFAULT 'INSTITUTIONAL',
  stage TEXT NOT NULL DEFAULT 'IDENTIFIED',
  research_dossier TEXT,
  auto_send_blocked INTEGER NOT NULL DEFAULT 1,
  owner TEXT NOT NULL DEFAULT 'Michael Quantara',
  deal_value_monthly_usd REAL NOT NULL DEFAULT 750.0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS inst_pipe_lead_id_idx ON institutional_pipeline(lead_id);
CREATE INDEX IF NOT EXISTS inst_pipe_stage_idx ON institutional_pipeline(stage);
