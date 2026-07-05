CREATE TABLE `challenge_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(128) NOT NULL,
	`senderRarity` int NOT NULL,
	`recipientEmail` varchar(320),
	`token` varchar(64) NOT NULL,
	`challengeStatus` enum('pending','accepted','completed','expired') NOT NULL DEFAULT 'pending',
	`acceptedAt` bigint,
	`completedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `challenge_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `coaching_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`letterTier` enum('silver','gold','platinum') NOT NULL,
	`subject` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`repSystemUsed` varchar(20),
	`sensoryPredicatesUsed` json,
	`metaProgramsAddressed` json,
	`sentAt` bigint,
	`readAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaderboard_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`compositeRarity` int NOT NULL,
	`topPowerCombo` varchar(128),
	`isPublic` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nlp_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`visualPercent` int NOT NULL DEFAULT 0,
	`auditoryPercent` int NOT NULL DEFAULT 0,
	`kinestheticPercent` int NOT NULL DEFAULT 0,
	`olfactoryGustatoryPercent` int NOT NULL DEFAULT 0,
	`primaryRepSystem` enum('visual','auditory','kinesthetic','olfactory_gustatory'),
	`repSystemSequence` varchar(20),
	`towardAway` float,
	`internalExternal` float,
	`optionsProcedures` float,
	`bigPictureDetail` float,
	`proactiveReactive` float,
	`matcherMismatcher` float,
	`selfOther` float,
	`possibilityNecessity` float,
	`wordsPerMinute` float,
	`avgPauseDurationMs` int,
	`hesitationFrequency` float,
	`confidenceScore` float,
	`sensoryPredicates` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nlp_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promoCodeId` int NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`amountCents` int NOT NULL,
	`commissionCents` int NOT NULL,
	`commissionPercent` int NOT NULL,
	`referralStatus` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_payments_id` PRIMARY KEY(`id`)
);
