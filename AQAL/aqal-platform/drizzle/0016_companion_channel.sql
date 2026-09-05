-- Companion mode: informant read stored separately from the member's own scores.
-- Idempotent so re-running is safe across environments.
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'companion');
SET @ddl := IF(@col = 0, 'ALTER TABLE `assessments` ADD COLUMN `companion` json NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
