CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('in_progress','processing','complete','failed') NOT NULL DEFAULT 'in_progress',
	`totalQuestions` int NOT NULL DEFAULT 10,
	`completedQuestions` int NOT NULL DEFAULT 0,
	`compositeRarity` int,
	`promoCode` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`userId` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(256) NOT NULL,
	`fileName` varchar(256),
	`fileType` varchar(64),
	`description` text,
	`axisTargets` text,
	`evidenceStatus` enum('pending','reviewed','accepted','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `power_combinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`axes` text,
	`rarityMultiplier` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `power_combinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`influencerName` varchar(128) NOT NULL,
	`influencerEmail` varchar(320),
	`discountPercent` int NOT NULL DEFAULT 0,
	`commissionPercent` int NOT NULL DEFAULT 10,
	`usageCount` int NOT NULL DEFAULT 0,
	`maxUses` int,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promo_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promo_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`questionIndex` int NOT NULL,
	`audioUrl` text,
	`audioKey` varchar(256),
	`transcript` text,
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`axisIndex` int NOT NULL,
	`axisName` varchar(64) NOT NULL,
	`score` float NOT NULL,
	`confidence` float,
	`reasoning` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scores_id` PRIMARY KEY(`id`)
);
