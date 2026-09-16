CREATE TABLE `activity_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`page` varchar(512),
	`metadata` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`referrer` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hipaa_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(64) NOT NULL,
	`ipAddress` varchar(64),
	`userAgent` text,
	`fullName` varchar(255),
	`email` varchar(320),
	`consentVersion` varchar(16) NOT NULL DEFAULT '1.0',
	`consentTextSnapshot` text,
	`agreedToTerms` boolean NOT NULL DEFAULT false,
	`agreedToHipaa` boolean NOT NULL DEFAULT false,
	`agreedToActivityLogging` boolean NOT NULL DEFAULT false,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hipaa_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessments` MODIFY COLUMN `answers` json;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hipaa_consents` ADD CONSTRAINT `hipaa_consents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;