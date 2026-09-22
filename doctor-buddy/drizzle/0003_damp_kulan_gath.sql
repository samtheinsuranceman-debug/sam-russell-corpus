CREATE TABLE `advisory_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(255),
	`messages` json NOT NULL,
	`conditionContext` varchar(128),
	`sessionType` enum('general','condition_specific','treatment_planning','crisis') DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisory_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crisis_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64),
	`triggerText` text,
	`triggerSource` varchar(64),
	`resourcesShown` json,
	`ipAddress` varchar(64),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crisis_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`promptId` varchar(32),
	`promptText` text,
	`moodTags` json,
	`triggers` json,
	`moodRating` int,
	`anxietyRating` int,
	`sleepHours` float,
	`isPrivate` boolean NOT NULL DEFAULT true,
	`aiReflection` text,
	`entryDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scores` json NOT NULL,
	`overallScore` float NOT NULL,
	`moodScore` float,
	`anxietyScore` float,
	`sleepScore` float,
	`energyScore` float,
	`socialScore` float,
	`notes` text,
	`aiInsight` text,
	`checkinDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `diagnostic_reports` ADD `prsScore` int;--> statement-breakpoint
ALTER TABLE `diagnostic_reports` ADD `prsBreakdown` json;--> statement-breakpoint
ALTER TABLE `advisory_sessions` ADD CONSTRAINT `advisory_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `crisis_events` ADD CONSTRAINT `crisis_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_entries` ADD CONSTRAINT `journal_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_checkins` ADD CONSTRAINT `progress_checkins_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;