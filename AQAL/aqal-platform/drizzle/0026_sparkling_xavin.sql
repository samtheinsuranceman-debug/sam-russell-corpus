CREATE TABLE `dailyAccountability` (
  `id` int AUTO_INCREMENT NOT NULL,
  `commitmentId` int NOT NULL,
  `userId` int NOT NULL,
  `localDate` varchar(10) NOT NULL,
  `channel` enum('email','text') NOT NULL,
  `status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `reply` enum('yes','no','stop'),
  `sourceMessageSid` varchar(64),
  `sentAt` timestamp,
  `repliedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `dailyAccountability_id` PRIMARY KEY(`id`),
  CONSTRAINT `daily_accountability_commitment_day_uq` UNIQUE(`commitmentId`,`localDate`),
  CONSTRAINT `daily_accountability_message_sid_uq` UNIQUE(`sourceMessageSid`)
);
--> statement-breakpoint
ALTER TABLE `trackerCycles` ADD `testimonialInvite` boolean DEFAULT false NOT NULL;
