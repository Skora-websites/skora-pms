-- Doctor profile: specialization (profession) shown in "Doctors at this clinic".
ALTER TABLE `users`
  ADD COLUMN `specialization` varchar(255) NULL AFTER `qualification`;
