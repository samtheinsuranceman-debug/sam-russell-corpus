CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64) NOT NULL,
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`currentQuestionIndex` int NOT NULL DEFAULT 0,
	`answers` json,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cardiac_mortality_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`week` int,
	`ageGroup` varchar(16) NOT NULL,
	`deaths` int NOT NULL,
	`source` varchar(64) DEFAULT 'CDC_WONDER',
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cardiac_mortality_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `covid_vaccine_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`month` varchar(7) NOT NULL,
	`totalDoses` int NOT NULL,
	`firstDoses` int,
	`secondDoses` int,
	`boosterDoses` int,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `covid_vaccine_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `covid_vaccine_cache_month_unique` UNIQUE(`month`)
);
--> statement-breakpoint
CREATE TABLE `diagnostic_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`userId` int,
	`provisionalDiagnoses` json NOT NULL,
	`symptomProfile` json NOT NULL,
	`treatmentRecommendations` json,
	`pubmedArticles` json,
	`shareToken` varchar(64),
	`sharedWithProvider` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diagnostic_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `diagnostic_reports_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `flu_surveillance_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`season` varchar(16) NOT NULL,
	`week` varchar(8) NOT NULL,
	`stateData` json NOT NULL,
	`nationalLevel` float,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flu_surveillance_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnostic_reports` ADD CONSTRAINT `diagnostic_reports_assessmentId_assessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnostic_reports` ADD CONSTRAINT `diagnostic_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;