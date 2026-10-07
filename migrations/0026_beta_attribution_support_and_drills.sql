-- Migration 0026: Beta attribution, support workflow, first-session checklists, and retained recovery drills
CREATE TABLE IF NOT EXISTS beta_invitations (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  target_audience TEXT,
  invited_count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS beta_invitations_source_idx ON beta_invitations (source);
CREATE INDEX IF NOT EXISTS beta_invitations_code_idx ON beta_invitations (code);

CREATE TABLE IF NOT EXISTS beta_attribution (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  invitation_code TEXT,
  user_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'REGISTERED',
  registered_at TEXT NOT NULL,
  observed_at TEXT,
  actions_count INTEGER NOT NULL DEFAULT 0,
  device_category TEXT,
  last_active_at TEXT
);
CREATE INDEX IF NOT EXISTS beta_attribution_source_idx ON beta_attribution (source);
CREATE INDEX IF NOT EXISTS beta_attribution_status_idx ON beta_attribution (status);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  ticket_number INTEGER NOT NULL,
  reporter_ref TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'mobile_app',
  severity TEXT NOT NULL DEFAULT 'P2_USABILITY',
  category TEXT NOT NULL DEFAULT 'UI_MOBILE',
  summary TEXT NOT NULL,
  details TEXT NOT NULL,
  device_info TEXT,
  owner TEXT NOT NULL DEFAULT 'founder',
  status TEXT NOT NULL DEFAULT 'OPEN',
  resolution_notes TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (status);
CREATE INDEX IF NOT EXISTS support_tickets_severity_idx ON support_tickets (severity);
CREATE INDEX IF NOT EXISTS support_tickets_owner_idx ON support_tickets (owner);

CREATE TABLE IF NOT EXISTS first_session_checklists (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  participant_ref TEXT NOT NULL,
  task_assigned TEXT NOT NULL,
  task_completed INTEGER NOT NULL DEFAULT 0,
  assistance_level TEXT NOT NULL DEFAULT 'NONE',
  assistance_notes TEXT,
  comprehension_score INTEGER NOT NULL DEFAULT 3,
  comprehension_notes TEXT,
  consent_given INTEGER NOT NULL DEFAULT 1,
  consent_timestamp TEXT NOT NULL,
  feedback_text TEXT,
  device_type TEXT NOT NULL DEFAULT 'iPhone Safari',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS first_session_checklists_ref_idx ON first_session_checklists (participant_ref);

CREATE TABLE IF NOT EXISTS retained_backup_drills (
  id TEXT PRIMARY KEY,
  backup_file_path TEXT NOT NULL,
  backup_file_size_bytes INTEGER NOT NULL,
  backup_hash TEXT NOT NULL,
  isolated_db_path TEXT NOT NULL,
  status TEXT NOT NULL,
  records_restored_count INTEGER NOT NULL,
  verified_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  details TEXT
);
CREATE INDEX IF NOT EXISTS retained_backup_drills_status_idx ON retained_backup_drills (status);
