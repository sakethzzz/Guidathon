CREATE TABLE `workspace_snapshots` (
  `storage_key` varchar(160) NOT NULL,
  `owner_open_id` varchar(64) NOT NULL,
  `workspace_id` varchar(96) NOT NULL DEFAULT 'main',
  `snapshot` mediumtext NOT NULL,
  `revision` int NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `workspace_snapshots_storage_key` PRIMARY KEY(`storage_key`),
  INDEX `workspace_snapshots_owner_workspace_idx` (`owner_open_id`, `workspace_id`)
);
--> statement-breakpoint
CREATE TABLE `agent_conversations` (
  `storage_key` varchar(160) NOT NULL,
  `owner_open_id` varchar(64) NOT NULL,
  `agent_id` varchar(24) NOT NULL,
  `messages` mediumtext NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `agent_conversations_storage_key` PRIMARY KEY(`storage_key`),
  INDEX `agent_conversations_owner_agent_idx` (`owner_open_id`, `agent_id`)
);
--> statement-breakpoint
CREATE TABLE `judge_evaluations` (
  `id` varchar(64) NOT NULL,
  `owner_open_id` varchar(64) NOT NULL,
  `score` int NOT NULL,
  `payload` mediumtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `judge_evaluations_id` PRIMARY KEY(`id`),
  INDEX `judge_evaluations_owner_created_idx` (`owner_open_id`, `created_at`)
);