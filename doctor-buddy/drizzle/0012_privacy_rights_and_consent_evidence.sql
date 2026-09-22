ALTER TABLE `billing_consents` MODIFY COLUMN `termsVersion` varchar(64) NOT NULL;

ALTER TABLE `hipaa_consents`
  ADD COLUMN `adult18Plus` boolean NOT NULL DEFAULT false,
  ADD COLUMN `termsVersion` varchar(64),
  ADD COLUMN `privacyVersion` varchar(64),
  ADD COLUMN `healthDataPolicyVersion` varchar(64),
  ADD COLUMN `medicalDisclaimerVersion` varchar(64),
  ADD COLUMN `processorDisclosureSnapshot` text;

CREATE TABLE `privacy_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `requestType` enum('access','correction','deletion','withdrawal','appeal','complaint') NOT NULL,
  `details` text,
  `status` enum('received','in_review','completed','denied','cancelled') NOT NULL DEFAULT 'received',
  `submittedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolvedAt` timestamp NULL,
  `resolutionNotes` text,
  CONSTRAINT `privacy_requests_id` PRIMARY KEY(`id`),
  CONSTRAINT `privacy_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);
