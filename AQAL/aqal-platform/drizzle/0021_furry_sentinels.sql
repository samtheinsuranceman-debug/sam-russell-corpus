CREATE TABLE `blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockerUserId` int NOT NULL,
	`blockedUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterUserId` int NOT NULL,
	`reportedUserId` int NOT NULL,
	`reason` text,
	`status` enum('open','reviewed','actioned') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `message_digest_last_sent_at` timestamp;