-- Seven tables that exist in drizzle/schema.ts but were never given a
-- migration by the foundation. Found on the first Railway deploy, when 0011
-- tried to ALTER `breach_incidents` on a database that had never created it.
-- Sorts between 0010 and 0011 on purpose. `breach_incidents` is created here
-- as it stood before 0011 so 0011 still applies its column.

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `actorId` int,
  `subjectId` int,
  `action` varchar(80) NOT NULL,
  `resourceType` varchar(60),
  `resourceId` int,
  `outcome` enum('success','denied','error') NOT NULL DEFAULT 'success',
  `detail` json,
  `ipAddress` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`),
  CONSTRAINT `audit_logs_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `audit_logs_subjectId_users_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS `breach_incidents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `breachType` varchar(80) NOT NULL,
  `description` text NOT NULL,
  `severity` enum('low','medium','high','critical') NOT NULL,
  `affectedUsers` json NOT NULL,
  `affectedCount` int NOT NULL,
  `containmentActions` text NOT NULL,
  `reportedBy` int NOT NULL,
  `discoveredAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notificationDeadline` timestamp NOT NULL,
  `requiresMediaNotice` boolean NOT NULL DEFAULT false,
  `status` enum('open','contained','resolved') NOT NULL DEFAULT 'open',
  `resolvedAt` timestamp NULL,
  `resolutionNotes` text,
  CONSTRAINT `breach_incidents_id` PRIMARY KEY(`id`),
  CONSTRAINT `breach_incidents_reportedBy_users_id_fk` FOREIGN KEY (`reportedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS `client_leads` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int,
  `fullName` varchar(160) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(40),
  `agreedToContact` boolean NOT NULL DEFAULT false,
  `currentSession` int NOT NULL DEFAULT 0,
  `sessionsCompleted` json DEFAULT ('[]'),
  `lastActiveAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `client_leads_id` PRIMARY KEY(`id`),
  CONSTRAINT `client_leads_email_unique` UNIQUE(`email`),
  CONSTRAINT `client_leads_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS `deletion_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected','cancelled','executed') NOT NULL DEFAULT 'pending',
  `requestedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewedBy` int,
  `reviewedAt` timestamp NULL,
  `executedAt` timestamp NULL,
  `recordsAffected` json,
  `resolutionNotes` text,
  CONSTRAINT `deletion_requests_id` PRIMARY KEY(`id`),
  CONSTRAINT `deletion_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `deletion_requests_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS `mental_credit_scores` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `score` int NOT NULL,
  `riskZone` enum('critical','elevated','guarded','resilient','optimal') NOT NULL,
  `breakdown` json NOT NULL,
  `triggerSource` varchar(32) NOT NULL,
  `referenceId` int,
  `referenceType` varchar(32),
  `delta` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `mental_credit_scores_id` PRIMARY KEY(`id`),
  CONSTRAINT `mental_credit_scores_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS `personality_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `needSocialInteraction` int,
  `needSolitude` int,
  `needNovelty` int,
  `needRoutine` int,
  `needSensoryStimulation` int,
  `needEmotionalSecurity` int,
  `needAutonomy` int,
  `needConnection` int,
  `needAchievement` int,
  `needCreativeExpression` int,
  `openness` int,
  `conscientiousness` int,
  `extraversion` int,
  `agreeableness` int,
  `neuroticism` int,
  `cognitiveAnalytical` int,
  `cognitiveDetail` int,
  `commDirect` int,
  `commWritten` int,
  `commEmotional` int,
  `calibratedNeeds` json,
  `needsGapAnalysis` json,
  `realityCalibration` json,
  `remodeledScores` json,
  `scores` json,
  `needs` json,
  `storyTrueSelf` text,
  `storyCurrentJourney` text,
  `transformationRoadmap` json,
  `interpretationNarrative` text,
  `needsPrescription` text,
  `healthyActivities` json,
  `drainingActivities` json,
  `primaryDiagnoses` json,
  `completedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `personality_profiles_id` PRIMARY KEY(`id`),
  CONSTRAINT `personality_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS `personality_responses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `profileId` int,
  `responses` json NOT NULL,
  `lastQuestionIndex` int NOT NULL DEFAULT 0,
  `isComplete` boolean NOT NULL DEFAULT false,
  `completedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `personality_responses_id` PRIMARY KEY(`id`),
  CONSTRAINT `personality_responses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `personality_responses_profileId_personality_profiles_id_fk` FOREIGN KEY (`profileId`) REFERENCES `personality_profiles`(`id`) ON DELETE no action ON UPDATE no action
);
