-- Demo-booking leads: persist the clinic/organisation name the form collects.
ALTER TABLE `leads`
  ADD COLUMN `clinic` varchar(255) NULL AFTER `phone`;
