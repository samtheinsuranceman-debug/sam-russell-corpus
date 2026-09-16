ALTER TABLE `hipaa_consents`
  ADD COLUMN `withdrawnAt` timestamp NULL,
  ADD COLUMN `withdrawalReason` varchar(255) NULL;

CREATE TABLE `subscriptions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL UNIQUE,
  `provider` varchar(32) NOT NULL DEFAULT 'stripe',
  `customerId` varchar(255),
  `subscriptionId` varchar(255) UNIQUE,
  `planId` varchar(64) NOT NULL DEFAULT 'insight',
  `status` varchar(40) NOT NULL DEFAULT 'inactive',
  `currentPeriodEnd` timestamp NULL,
  `cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

CREATE TABLE `billing_consents` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `planId` varchar(64) NOT NULL,
  `amountCents` int NOT NULL,
  `currency` varchar(8) NOT NULL DEFAULT 'usd',
  `cadence` varchar(24) NOT NULL DEFAULT 'month',
  `termsVersion` varchar(24) NOT NULL,
  `adult18Plus` boolean NOT NULL,
  `recurringBillingAccepted` boolean NOT NULL,
  `userAgent` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `billing_consents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

CREATE TABLE `billing_events` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `providerEventId` varchar(255) NOT NULL UNIQUE,
  `eventType` varchar(120) NOT NULL,
  `processedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
