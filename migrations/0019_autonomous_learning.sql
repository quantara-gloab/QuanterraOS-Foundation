-- Autonomous Executive AI Self-Training & Continuous Learning Table
CREATE TABLE IF NOT EXISTS autonomous_learning_cycles (
  id TEXT PRIMARY KEY,
  cycle_number INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  brier_baseline REAL NOT NULL,
  model_divergence REAL NOT NULL,
  hypotheses_evaluated INTEGER NOT NULL DEFAULT 0,
  hypotheses_passed INTEGER NOT NULL DEFAULT 0,
  stress_scenarios_run INTEGER NOT NULL DEFAULT 0,
  risk_verdict TEXT NOT NULL,
  funnel_insights_json TEXT NOT NULL,
  executive_brief_markdown TEXT NOT NULL,
  acceleration_score REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS autonomous_learning_cycle_num_idx ON autonomous_learning_cycles(cycle_number);
CREATE INDEX IF NOT EXISTS autonomous_learning_created_at_idx ON autonomous_learning_cycles(created_at);
