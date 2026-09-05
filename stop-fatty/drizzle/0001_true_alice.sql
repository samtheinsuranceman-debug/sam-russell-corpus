CREATE TABLE `calibration_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`visualTrigger` text,
	`visualScene` text,
	`visualFuture` text,
	`auditoryDialog` text,
	`auditoryTone` text,
	`auditoryPermission` text,
	`kinestheticFeeling` text,
	`kinestheticLocation` text,
	`kinestheticIntensity` text,
	`triggerSequence` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibration_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('failure','victory') NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`duration` int,
	`howTheyFeel` text,
	`whatTheySaid` text,
	`futureOutlook` text,
	`prideDescription` text,
	`reinforcement` text,
	`transcription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `temptation_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sawFood` text NOT NULL,
	`saidToSelf` text NOT NULL,
	`createdFeeling` text NOT NULL,
	`outcome` enum('resisted','gave_in') NOT NULL,
	`outcomeDescription` text,
	`patternInterruptPlayed` boolean NOT NULL DEFAULT false,
	`recordingPlayedId` int,
	`temptationIntensity` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `temptation_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('free_trial','active','expired','cancelled') DEFAULT 'free_trial' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;