-- Council Chat Audit Log table
-- Stores every conversational exchange with Council specialists in SQLite.
-- Serves as an auditable public-facing record verifying that no agent
-- claims unproven trading edge or active capital management.
CREATE TABLE IF NOT EXISTS `council_chat_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `agent_id` text NOT NULL,
  `agent_name` text NOT NULL,
  `user_message` text NOT NULL,
  `assistant_reply` text NOT NULL,
  `citations_json` text NOT NULL,
  `guarded` integer NOT NULL DEFAULT 0,
  `violations_json` text,
  `pipeline_cycle_number` integer,
  `duration_ms` integer NOT NULL,
  `created_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `council_chat_logs_agent_idx`
  ON `council_chat_logs` (`agent_id`);

CREATE INDEX IF NOT EXISTS `council_chat_logs_created_at_idx`
  ON `council_chat_logs` (`created_at`);
