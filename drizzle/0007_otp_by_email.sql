-- Signup OTP moves from phone to email verification.
--   1. registration_otps: `phone` column becomes `email`.
--   2. Rows keyed by phone are meaningless after the switch — clear them.
ALTER TABLE `registration_otps`
  CHANGE COLUMN `phone` `email` varchar(255) NOT NULL;

DELETE FROM `registration_otps`;
