CREATE TABLE IF NOT EXISTS `commitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int,
	`version` int NOT NULL DEFAULT 1,
	`goals` text,
	`answers` json,
	`signedName` varchar(160),
	`signedAt` timestamp,
	`supersededAt` timestamp,
	`commitmentStatus` enum('draft','signed') NOT NULL DEFAULT 'draft',
	`reminderChannel` enum('none','email','text') NOT NULL DEFAULT 'none',
	`reminderPhone` varchar(32),
	`reminderTimezone` varchar(64),
	`reminderConsentAt` timestamp,
	`reminderStartAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `trackerCycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int,
	`cycleNumber` int NOT NULL DEFAULT 1,
	`days` int NOT NULL DEFAULT 30,
	`journalText` text NOT NULL,
	`summary` text,
	`adjustments` json,
	`freshVision` text,
	`adherenceNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trackerCycles_id` PRIMARY KEY(`id`)
);
