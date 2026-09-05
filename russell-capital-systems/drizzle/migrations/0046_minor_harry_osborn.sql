CREATE TABLE `tutorial_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(50),
	`questionnaireAnswers` json,
	`questionnaireCompleted` boolean NOT NULL DEFAULT false,
	`completedSections` json,
	`completedSubSections` json,
	`currentStep` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`badges` json,
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutorial_progress_id` PRIMARY KEY(`id`)
);
