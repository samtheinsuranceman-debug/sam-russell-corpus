-- 0083_genome_intake: Wealth Genome intake, first build. Additive only.
-- genome_intake_sessions = the consent record (timestamp, consent text version and snapshot, acknowledgements) and cluster yes/no.
-- genome_raw_answers     = mind ("destroy"-class) answers, each with an expiry; deleted at close and by the sweep unless on legal hold.
--                          Money answers are kept in the household fact-finder (client_fact_finders), not here.
-- genome_maps            = the kept map (pattern axes + approximate money bands only), one per user.
-- The same statements run on first use from server/genomeIntakeDb.ts, so the host needs no manual step.
CREATE TABLE IF NOT EXISTS `genome_intake_sessions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `consentVersion` varchar(64) NOT NULL,
  `consentedAt` timestamp NOT NULL,
  `consentTextSnapshot` text NOT NULL,
  `adult18Plus` boolean NOT NULL DEFAULT false,
  `ackNotDiagnosis` boolean NOT NULL DEFAULT false,
  `ackDestroyKeep` boolean NOT NULL DEFAULT false,
  `withdrawnAt` timestamp NULL,
  `status` enum('open','closed','abandoned') NOT NULL DEFAULT 'open',
  `mindDecision` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `moneyDecision` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `preview` boolean NOT NULL DEFAULT false,
  `legalHold` boolean NOT NULL DEFAULT false,
  `expiresAt` timestamp NOT NULL,
  `closedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `genome_intake_sessions_id` PRIMARY KEY(`id`),
  KEY `genome_intake_sessions_user` (`userId`),
  KEY `genome_intake_sessions_expiry` (`status`,`expiresAt`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `genome_raw_answers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sessionId` int NOT NULL,
  `userId` int NOT NULL,
  `questionId` varchar(64) NOT NULL,
  `answer` json NOT NULL,
  `legalHold` boolean NOT NULL DEFAULT false,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `genome_raw_answers_id` PRIMARY KEY(`id`),
  CONSTRAINT `genome_raw_answers_session_question` UNIQUE(`sessionId`,`questionId`),
  KEY `genome_raw_answers_expiry` (`expiresAt`),
  KEY `genome_raw_answers_created` (`createdAt`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `genome_maps` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `map` json NOT NULL,
  `consentVersion` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `genome_maps_id` PRIMARY KEY(`id`),
  CONSTRAINT `genome_maps_user` UNIQUE(`userId`)
);
