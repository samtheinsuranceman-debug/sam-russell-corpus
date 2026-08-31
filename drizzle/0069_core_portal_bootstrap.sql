CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`actorUserId` int,
	`action` varchar(200) NOT NULL,
	`entityType` varchar(100),
	`entityId` varchar(100),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`actorName` varchar(200),
	`actorUserId` int,
	`entityType` varchar(50),
	`entityId` int,
	`summary` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`fileKey` varchar(1000) NOT NULL,
	`url` varchar(2000) NOT NULL,
	`mimeType` varchar(200),
	`sizeBytes` int,
	`category` enum('TAX_RETURN','ESTATE_PLAN','INSURANCE_POLICY','INVESTMENT_STATEMENT','TRUST_DOCUMENT','LEGAL_AGREEMENT','FINANCIAL_PLAN','OTHER') NOT NULL DEFAULT 'OTHER',
	`uploadedBy` int,
	`uploadedByName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`scheduledAt` timestamp NOT NULL,
	`durationMin` int NOT NULL DEFAULT 60,
	`location` varchar(500),
	`meetingType` enum('IN_PERSON','VIDEO','PHONE','OTHER') NOT NULL DEFAULT 'VIDEO',
	`status` enum('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
	`notes` text,
	`createdBy` int,
	`createdByName` varchar(200),
	`reminderSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(200),
	`noteType` enum('CALL','MEETING','EMAIL','TASK','GENERAL') NOT NULL DEFAULT 'GENERAL',
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_portal_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`label` varchar(200),
	`createdByUserId` int,
	`expiresAt` timestamp NOT NULL,
	`lastAccessedAt` timestamp,
	`accessCount` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_portal_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_portal_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `client_tag_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_tag_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#4f8cff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`household` varchar(200),
	`email` varchar(320),
	`phone` varchar(30),
	`age` int,
	`state` varchar(50),
	`filingStatus` enum('single','joint','hoh') DEFAULT 'joint',
	`income` decimal(15,2),
	`iraBalance` decimal(15,2),
	`rothBalance` decimal(15,2),
	`taxableAssets` decimal(15,2),
	`realEstateEquity` decimal(15,2),
	`lifeInsuranceCv` decimal(15,2),
	`firstName` varchar(100),
	`lastName` varchar(100),
	`riskTolerance` enum('conservative','moderate','aggressive','very_aggressive'),
	`annualIncome` decimal(15,2),
	`totalNetWorth` decimal(15,2),
	`retirementAge` int,
	`spouseName` varchar(200),
	`spouseAge` int,
	`dependents` int,
	`spouseIncome` decimal(15,2),
	`monthlyExpenses` decimal(15,2),
	`cashSavings` decimal(15,2),
	`homeValue` decimal(15,2),
	`k401Balance` decimal(15,2),
	`pensionIncome` decimal(15,2),
	`socialSecurityEstimate` decimal(15,2),
	`lifeInsuranceDb` decimal(15,2),
	`annualPremium` decimal(15,2),
	`annuityValue` decimal(15,2),
	`hasLTC` boolean DEFAULT false,
	`mortgageBalance` decimal(15,2),
	`mortgageRate` decimal(5,4),
	`mortgageYearsLeft` int,
	`totalMortgageInterest` decimal(15,2),
	`otherDebt` decimal(15,2),
	`helocRate` decimal(5,4),
	`ficoScore` int,
	`notes` text,
	`tags` json,
	`opportunityScore` int,
	`hubspotContactId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_widget_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`widgetId` varchar(100) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`size` enum('SMALL','MEDIUM','LARGE','FULL') NOT NULL DEFAULT 'MEDIUM',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_widget_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`stage` enum('LEAD','QUALIFIED','STRATEGY','PROPOSAL','CLOSED_WON','CLOSED_LOST') NOT NULL DEFAULT 'LEAD',
	`ownerName` varchar(200),
	`value` decimal(15,2),
	`probability` decimal(5,4),
	`notes` text,
	`closedAt` timestamp,
	`hubspotDealId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
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
CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int,
	`type` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(1000),
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`docType` enum('MESSAGING_LIBRARY','OBJECTION_GUIDE','OFFER_POSITIONING','RENEWAL_POSITIONING','TONE_RULE','COMPLIANCE_RULE','PLAYBOOK_GUIDANCE') NOT NULL DEFAULT 'PLAYBOOK_GUIDANCE',
	`status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`summary` text,
	`content` text,
	`tags` json,
	`sourceLabel` varchar(100),
	`versionLabel` varchar(50),
	`chunkCount` int NOT NULL DEFAULT 0,
	`fileUrl` varchar(1000),
	`fileKey` varchar(500),
	`fileMime` varchar(100),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('SUPER_ADMIN','ADMIN','ADVISOR','ANALYST','VIEWER') NOT NULL DEFAULT 'VIEWER',
	`status` enum('ACTIVE','SUSPENDED','PENDING') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`pagePath` varchar(500) NOT NULL,
	`pageTitle` varchar(200) NOT NULL,
	`enteredAt` timestamp NOT NULL DEFAULT (now()),
	`exitedAt` timestamp,
	`durationSecs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`name` varchar(200) NOT NULL,
	`inputs` json NOT NULL,
	`projectionData` json NOT NULL,
	`tags` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`advisorId` int NOT NULL,
	`advisorName` varchar(200),
	`version` int NOT NULL DEFAULT 1,
	`parentStrategyId` int,
	`strategyType` varchar(50) NOT NULL,
	`strategyLabel` varchar(200) NOT NULL,
	`carrierId` varchar(50),
	`carrierName` varchar(200),
	`inputsJson` json NOT NULL,
	`summaryJson` json NOT NULL,
	`iulProjectionJson` json,
	`strProjectionJson` json,
	`notes` text,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenario_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`name` varchar(200) NOT NULL,
	`scenarioType` enum('ROTH','IUL','REAL_ESTATE','COMBINED','ROTH_CONVERSION_STR','OIL_GAS_ROTH','MORTGAGE_KILLER') NOT NULL DEFAULT 'COMBINED',
	`inputJson` json,
	`outputJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenario_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sidebar_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`label` varchar(200) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sidebar_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`summary` text,
	`taxPlan` text,
	`insurancePlan` text,
	`investmentPlan` text,
	`advisorScript` text,
	`generatedBy` enum('AI','MANUAL','HYBRID') NOT NULL DEFAULT 'MANUAL',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspace_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`invitedByUserId` int,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`role` enum('SUPER_ADMIN','ADMIN','ADVISOR','ANALYST','VIEWER') NOT NULL DEFAULT 'ANALYST',
	`status` enum('PENDING','ACCEPTED','EXPIRED','REVOKED') NOT NULL DEFAULT 'PENDING',
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `workspace_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`planSlug` varchar(50) NOT NULL DEFAULT 'growth',
	`status` enum('TRIALING','ACTIVE','PAST_DUE','CANCELED','PAUSED') NOT NULL DEFAULT 'TRIALING',
	`billingInterval` enum('MONTHLY','ANNUAL') NOT NULL DEFAULT 'MONTHLY',
	`seats` int NOT NULL DEFAULT 1,
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`ownerId` int NOT NULL,
	`logoUrl` varchar(2000),
	`primaryColor` varchar(20),
	`accentColor` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);
