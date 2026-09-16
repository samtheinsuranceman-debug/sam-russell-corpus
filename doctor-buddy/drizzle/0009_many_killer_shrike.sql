CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(32) NOT NULL,
	`title` varchar(128) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`xpAwarded` int DEFAULT 0,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `career_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`predictions` json,
	`currentSkills` json,
	`skillGaps` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `career_predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edu_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(32) NOT NULL,
	`subject` varchar(64),
	`questions` json,
	`responses` json,
	`score` float,
	`maxScore` float,
	`insights` json,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edu_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `edu_chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(64),
	`messages` json,
	`emotionalTone` varchar(32),
	`frustrationLevel` float,
	`topicsCovered` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edu_chat_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`learningStyle` varchar(32),
	`cognitiveProfile` json,
	`emotionalState` json,
	`knowledgeGraph` json,
	`skillProficiency` json,
	`careerAspirations` json,
	`accessibilityNeeds` json,
	`selIndicators` json,
	`overallScore` float,
	`streakDays` int NOT NULL DEFAULT 0,
	`totalXp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`lastActiveAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learner_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subject` varchar(64) NOT NULL,
	`difficulty` varchar(16),
	`modules` json,
	`progress` float DEFAULT 0,
	`estimatedHours` float,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_paths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `career_predictions` ADD CONSTRAINT `career_predictions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `edu_assessments` ADD CONSTRAINT `edu_assessments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `edu_chat_sessions` ADD CONSTRAINT `edu_chat_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD CONSTRAINT `learner_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_paths` ADD CONSTRAINT `learning_paths_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;