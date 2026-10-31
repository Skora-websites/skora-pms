-- 0024: Native push device tokens for the React Native app.
--
-- Web Push (push_subscriptions) only reaches browsers. The native app registers
-- an Expo push token, which lib/push/native.ts exchanges for an FCM/APNs
-- delivery via the Expo push service — the channel the SOS emergency alerts
-- and every other native push need.
--
-- The token is UNIQUE: the same device re-registering (app reinstall, second
-- account signed in) must not accumulate rows, or one SOS would ring twice.
-- The FK cascades so deleting a user drops their devices.

CREATE TABLE IF NOT EXISTS `device_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `platform` varchar(16) NOT NULL,
  `token` varchar(512) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_tokens_token_unique` (`token`),
  CONSTRAINT `device_tokens_user_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `device_tokens_user_id_index` ON `device_tokens` (`user_id`);
