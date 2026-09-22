CREATE TABLE `digital_twins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`domainScores` json NOT NULL,
	`compositeScore` float NOT NULL DEFAULT 50,
	`currentState` enum('stable','improving','deteriorating','critical') NOT NULL DEFAULT 'stable',
	`trajectoryHistory` json NOT NULL,
	`alertThresholds` json,
	`activeAlerts` json,
	`lastUpdateSource` varchar(64),
	`lastAssessmentId` int,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `digital_twins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `digital_twins` ADD CONSTRAINT `digital_twins_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;