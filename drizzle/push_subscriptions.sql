-- ─────────────────────────────────────────────────────────────────────
-- Migration: PWA Web Push subscriptions
-- Apply:
--   Get-Content drizzle/push_subscriptions.sql -Raw | mysql -u root -h 127.0.0.1 -P 3307 skoracares_db
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `id` bigint unsigned AUTO_INCREMENT NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `endpoint` text NOT NULL,
  `auth` varchar(255) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`),
  CONSTRAINT `push_subscriptions_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `push_subscriptions_user_id_index` ON `push_subscriptions` (`user_id`);
