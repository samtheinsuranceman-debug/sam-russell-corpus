CREATE TABLE `medication_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicationId` int NOT NULL,
	`userId` int NOT NULL,
	`takenAt` timestamp NOT NULL DEFAULT (now()),
	`skipped` boolean NOT NULL DEFAULT false,
	`notes` text,
	CONSTRAINT `medication_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`genericName` varchar(255),
	`dosage` varchar(128),
	`frequency` varchar(128),
	`prescribedFor` varchar(255),
	`prescribedBy` varchar(255),
	`startDate` varchar(32),
	`endDate` varchar(32),
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mood_journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`moodScore` int,
	`emotionTags` json,
	`sentimentDimensions` json,
	`riskFlagged` boolean NOT NULL DEFAULT false,
	`riskIndicatorsFound` json,
	`aiInsight` text,
	`moodTrend` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mood_journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wellness_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`diagnoses` json,
	`planData` json,
	`weeklyThemes` json,
	`categories` json,
	`completedActions` json,
	`adherenceScore` float DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wellness_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `medication_logs` ADD CONSTRAINT `medication_logs_medicationId_medications_id_fk` FOREIGN KEY (`medicationId`) REFERENCES `medications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medication_logs` ADD CONSTRAINT `medication_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medications` ADD CONSTRAINT `medications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mood_journal_entries` ADD CONSTRAINT `mood_journal_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wellness_plans` ADD CONSTRAINT `wellness_plans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;