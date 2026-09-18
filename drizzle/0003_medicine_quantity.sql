-- Medicine inventory stock count: number of units of each medicine available
-- at the clinic (shown and managed on the doctor's Medicine Inventory page).
ALTER TABLE `medicines`
  ADD COLUMN `quantity_available` INT NOT NULL DEFAULT 0 AFTER `unit`;
