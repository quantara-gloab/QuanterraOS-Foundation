-- Falcon (Opportunity Intel) agent recommendations. Logged unconditionally
-- (proposed/accepted/edited/rejected) so Falcon's own calibration can be
-- scored later, separate from the human-confirmed research_observations row.
CREATE TABLE IF NOT EXISTS `falcon_recommendations` (
  `id` text PRIMARY KEY NOT NULL,
  `owner` text NOT NULL,
  `contract` text NOT NULL,
  `suggested_probability` real NOT NULL,
  `rationale` text NOT NULL,
  `evidence_json` text NOT NULL,
  `status` text NOT NULL DEFAULT 'proposed',
  `final_probability` real,
  `observation_id` text,
  `created_at` text NOT NULL,
  `decided_at` text
);

CREATE INDEX IF NOT EXISTS `falcon_recommendations_owner_contract`
  ON `falcon_recommendations` (`owner`, `contract`);
