ALTER TABLE `evidence` ADD `category` varchar(64);--> statement-breakpoint
ALTER TABLE `evidence` ADD `institution` varchar(256);--> statement-breakpoint
ALTER TABLE `evidence` ADD `evidence_date` varchar(32);--> statement-breakpoint
ALTER TABLE `evidence` ADD `significance` text;--> statement-breakpoint
ALTER TABLE `evidence` ADD `reviewer_notes` text;