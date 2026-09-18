CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`googleEventId` varchar(255),
	`title` varchar(255) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`location` text,
	`meetingType` varchar(50) DEFAULT 'general',
	`status` varchar(20) DEFAULT 'scheduled',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_portal_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastAccessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_portal_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deal_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`score` int NOT NULL,
	`confidence` varchar(10) NOT NULL DEFAULT 'medium',
	`factors` json,
	`recommendation` text,
	`scoredAt` timestamp NOT NULL DEFAULT (now()),
	`scoredBy` varchar(10) NOT NULL DEFAULT 'ai',
	CONSTRAINT `deal_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`source` varchar(20) NOT NULL DEFAULT 'client',
	`level` varchar(10) NOT NULL DEFAULT 'error',
	`message` text NOT NULL,
	`stack` text,
	`componentStack` text,
	`url` text,
	`userAgent` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `morning_rituals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`stepsCompleted` json,
	`totalSteps` int NOT NULL DEFAULT 7,
	`isComplete` boolean NOT NULL DEFAULT false,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`streakDay` int NOT NULL DEFAULT 1,
	`xpEarned` int NOT NULL DEFAULT 0,
	`coinsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `morning_rituals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prediction_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`question` varchar(500) NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'general',
	`endDate` timestamp NOT NULL,
	`yesCount` int NOT NULL DEFAULT 0,
	`noCount` int NOT NULL DEFAULT 0,
	`totalWager` int NOT NULL DEFAULT 0,
	`status` enum('open','resolved_yes','resolved_no','cancelled') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prediction_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`reportType` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`fileUrl` text,
	`fileKey` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `report_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenue_guarantee_calcs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentAUM` decimal(15,2) NOT NULL,
	`currentRevenue` decimal(15,2) NOT NULL,
	`projectedAUM` decimal(15,2) NOT NULL,
	`projectedRevenue` decimal(15,2) NOT NULL,
	`subscriptionCost` decimal(10,2) NOT NULL,
	`roiMultiple` decimal(8,2) NOT NULL,
	`breakEvenDays` int NOT NULL,
	`guaranteeTier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revenue_guarantee_calcs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_pets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`speciesId` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`xp` int NOT NULL DEFAULT 0,
	`xpToNext` int NOT NULL DEFAULT 100,
	`happiness` int NOT NULL DEFAULT 100,
	`hunger` int NOT NULL DEFAULT 100,
	`strength` int NOT NULL DEFAULT 5,
	`wisdom` int NOT NULL DEFAULT 5,
	`charisma` int NOT NULL DEFAULT 5,
	`luck` int NOT NULL DEFAULT 5,
	`evolutionStage` enum('hatchling','juvenile','adolescent','adult','elder','legendary') NOT NULL DEFAULT 'hatchling',
	`totalFeedings` int NOT NULL DEFAULT 0,
	`totalDeals` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastFedAt` timestamp,
	`lastInteractedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_pets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_engagement_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`viewerType` enum('client','advisor','anonymous') NOT NULL DEFAULT 'anonymous',
	`viewerId` int,
	`eventType` enum('play','pause','seek','chapter_enter','chapter_exit','complete','replay_section') NOT NULL,
	`chapterIndex` int,
	`videoTimestamp` int,
	`watchDuration` int,
	`totalWatchTime` int,
	`percentWatched` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_engagement_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_proposal_chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`chapterIndex` int NOT NULL,
	`chapterType` enum('introduction','current_situation','recommended_strategy','twenty_year_projection','next_steps','custom') NOT NULL,
	`title` varchar(300) NOT NULL,
	`script` text NOT NULL,
	`durationEstimate` int,
	`dataSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_proposal_chapters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','generating_script','script_ready','generating_video','processing','completed','failed') NOT NULL DEFAULT 'draft',
	`avatarId` varchar(200),
	`voiceId` varchar(200),
	`heygenVideoId` varchar(200),
	`videoUrl` text,
	`thumbnailUrl` text,
	`shareToken` varchar(100),
	`totalDuration` int,
	`resolution` enum('1080p','720p') NOT NULL DEFAULT '1080p',
	`errorMessage` text,
	`generatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawal_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`triggerType` enum('gentle_nudge','fomo_alert','pet_sad','streak_warning','loot_expiring','quest_expiring','rival_passed','market_move') NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`urgency` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`channel` enum('in_app','email','push','sms') NOT NULL DEFAULT 'in_app',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawal_triggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reel_interactions` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reel_interactions` ADD `reelId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reel_interactions` DROP COLUMN `user_id`;--> statement-breakpoint
ALTER TABLE `reel_interactions` DROP COLUMN `reel_id`;