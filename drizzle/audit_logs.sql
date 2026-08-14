-- ─────────────────────────────────────────────────────────────────────
-- Migration: create `audit_logs` table (S4 defense-in-depth)
-- Apply against the existing skoracare DB:
--   mysql -u root -p skoracare < drizzle/audit_logs.sql
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `user_id` bigint,
  `action` varchar(100) NOT NULL,
  `ip_address` varchar(45),
  `metadata` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `audit_logs_user_id_index` ON `audit_logs` (`user_id`);
CREATE INDEX `audit_logs_action_index` ON `audit_logs` (`action`);
CREATE INDEX `audit_logs_created_at_index` ON `audit_logs` (`created_at`);
