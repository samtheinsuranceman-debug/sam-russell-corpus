ALTER TABLE `breach_incidents`
  ADD COLUMN `affectedJurisdictions` json NULL AFTER `affectedCount`;
