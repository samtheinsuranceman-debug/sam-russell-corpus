CREATE TABLE `page_audit_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`pageTitle` varchar(300),
	`componentName` varchar(200),
	`renderHealth` enum('untested','pass','warn','fail') NOT NULL DEFAULT 'untested',
	`navigationHealth` enum('untested','reachable','orphaned','broken') NOT NULL DEFAULT 'untested',
	`interactionHealth` enum('untested','working','partial','placeholder','broken') NOT NULL DEFAULT 'untested',
	`placeholderCount` int NOT NULL DEFAULT 0,
	`duplicateGroup` varchar(200),
	`usefulnessScore` int,
	`recommendation` enum('keep','improve','merge','secondary','retire'),
	`mergeTarget` varchar(500),
	`rationale` text,
	`improvementInstructions` text,
	`evidence` json,
	`auditedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_audit_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_audit_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initiatedBy` int NOT NULL,
	`routeCount` int NOT NULL DEFAULT 0,
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`methodologyVersion` varchar(50) NOT NULL DEFAULT '1.0',
	`summary` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_audit_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_case_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planningCaseId` int NOT NULL,
	`userId` int NOT NULL,
	`noteType` enum('advisor','client','compliance','system') NOT NULL DEFAULT 'advisor',
	`content` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_case_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planning_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`userId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`caseType` varchar(100) NOT NULL DEFAULT 'comprehensive',
	`status` enum('draft','active','review','completed','archived') NOT NULL DEFAULT 'draft',
	`currentStage` varchar(100) NOT NULL DEFAULT 'discovery',
	`assumptions` json,
	`results` json,
	`workflowState` json,
	`lastSavedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_portal_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int,
	`defaultLandingPath` varchar(500) NOT NULL DEFAULT '/portal/dashboard',
	`openNavGroups` json,
	`secondaryCategories` json,
	`compactSidebar` boolean NOT NULL DEFAULT false,
	`reduceMotion` boolean NOT NULL DEFAULT false,
	`lastVisitedPath` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_portal_preferences_id` PRIMARY KEY(`id`)
);
