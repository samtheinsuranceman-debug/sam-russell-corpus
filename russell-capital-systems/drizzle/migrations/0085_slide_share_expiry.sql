-- 0085_slide_share_expiry: optional expiry on slide deck share links (security review C-2).
-- Additive and nullable: existing shares keep working (NULL = no expiry).
-- Numbered 0085 because master ends at 0082 and sibling branches have taken
-- 0083 (genome intake) and 0084 (arrival skin history).
ALTER TABLE `slide_shares` ADD COLUMN `expiresAt` timestamp NULL;
