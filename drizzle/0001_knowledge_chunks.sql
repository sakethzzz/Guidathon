CREATE TABLE `knowledge_chunks` (
  `storage_key` varchar(191) NOT NULL,
  `id` varchar(191) NOT NULL,
  `workspace_id` varchar(96) NOT NULL,
  `source_name` varchar(255) NOT NULL,
  `heading` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `provenance` varchar(500) NOT NULL,
  `embedding` text,
  `status` enum('verified','unverified') NOT NULL DEFAULT 'unverified',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `knowledge_chunks_storage_key` PRIMARY KEY(`storage_key`),
  INDEX `knowledge_chunks_workspace_status_idx` (`workspace_id`, `status`)
);
