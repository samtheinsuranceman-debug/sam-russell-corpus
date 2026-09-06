-- Russell Capital Systems — complete database schema
-- Generated from drizzle/schema.ts by scripts/export_schema_sql.sh; do not hand-edit.
-- Tables: 122
-- Import: mysql -u USER -p DBNAME < database/rcs-schema.sql   (or phpMyAdmin → Import)
-- The database itself must already exist (create it in cPanel → MySQL Databases).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `advisor_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`accessTier` enum('trial','unlimited','subscriber') NOT NULL DEFAULT 'trial',
	`trialSecondsUsed` int NOT NULL DEFAULT 0,
	`lastHeartbeatAt` timestamp,
	`stripeCustomerId` varchar(100),
	`subscriptionStatus` enum('none','active','past_due','canceled') NOT NULL DEFAULT 'none',
	`stripeSubscriptionId` varchar(100),
	`trialAccessCount` int NOT NULL DEFAULT 0,
	`passwordType` enum('none','trial','eternal') NOT NULL DEFAULT 'none',
	`planSlug` varchar(50),
	`emailVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisor_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `advisor_accounts_email_unique` UNIQUE(`email`)
);
CREATE TABLE `advisor_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`goalType` enum('AUM_TARGET','DEALS_CLOSED','NEW_CLIENTS','REVENUE') NOT NULL,
	`targetValue` decimal(15,2) NOT NULL,
	`period` varchar(20) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisor_goals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `agency_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`role` enum('supervisor','agent') NOT NULL DEFAULT 'agent',
	`status` enum('active','pending','suspended','removed') NOT NULL DEFAULT 'pending',
	`agreementSigned` boolean NOT NULL DEFAULT false,
	`agreementSignedAt` timestamp,
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agency_team_members_id` PRIMARY KEY(`id`)
);
CREATE TABLE `agency_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`supervisorId` int NOT NULL,
	`supervisorName` varchar(200) NOT NULL,
	`supervisorEmail` varchar(320),
	`workspaceId` int NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agency_teams_id` PRIMARY KEY(`id`)
);
CREATE TABLE `ai_memory_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`content` text NOT NULL,
	`source` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_memory_notes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `allocation_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`assetClass` varchar(100) NOT NULL,
	`targetPct` decimal(5,2) NOT NULL,
	`currentPct` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `allocation_targets_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `batch_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`templateType` varchar(100) NOT NULL,
	`frequency` varchar(50) NOT NULL DEFAULT 'weekly',
	`paused` boolean NOT NULL DEFAULT false,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`runCount` int NOT NULL DEFAULT 0,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_schedules_id` PRIMARY KEY(`id`)
);
CREATE TABLE `calculation_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`clientId` int,
	`clientName` varchar(200),
	`calculationType` varchar(100) NOT NULL,
	`pagePath` varchar(500),
	`inputs` json,
	`outputs` json,
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calculation_audit_logs_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `campaign_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`campaignId` int NOT NULL,
	`clientId` int NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientName` varchar(200),
	`status` enum('active','completed','unsubscribed') NOT NULL DEFAULT 'active',
	`currentStep` int NOT NULL DEFAULT 0,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	CONSTRAINT `campaign_enrollments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `carrier_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`carrierId` varchar(50) NOT NULL,
	`carrierName` varchar(200) NOT NULL,
	`loadFee` decimal(6,4),
	`coiRate` decimal(6,4),
	`capRate` decimal(6,4),
	`floorRate` decimal(6,4),
	`avgReturn` decimal(6,4),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carrier_overrides_id` PRIMARY KEY(`id`)
);
CREATE TABLE `carrier_quote_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientEmail` varchar(320),
	`advisorId` int NOT NULL,
	`advisorName` varchar(200),
	`advisorEmail` varchar(320),
	`carrierId` varchar(50) NOT NULL,
	`carrierName` varchar(200) NOT NULL,
	`productName` varchar(200),
	`formData` json NOT NULL,
	`status` enum('draft','submitted','pending_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carrier_quote_requests_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `client_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`badgeType` varchar(100) NOT NULL,
	`badgeName` varchar(200) NOT NULL,
	`badgeEmoji` varchar(20) NOT NULL,
	`badgeDescription` text,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`level` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_badges_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_crypto_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`coinId` varchar(100) NOT NULL,
	`coinName` varchar(200) NOT NULL,
	`coinSymbol` varchar(20),
	`quantity` decimal(20,8) NOT NULL,
	`avgPurchasePrice` decimal(15,2) NOT NULL,
	`amountStaked` decimal(20,8),
	`stakingPercentage` decimal(8,4),
	`predictedStakingIncome` decimal(15,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_crypto_holdings_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `client_fact_finders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`data` json NOT NULL,
	`completeness` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_fact_finders_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_fact_finders_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE `client_journeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questions` json NOT NULL,
	`journey` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_journeys_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_life_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`targetAge` int NOT NULL,
	`goalCategory` enum('retirement','travel','education','home_purchase','debt_free','business','charity','health','family','luxury','legacy','other') NOT NULL DEFAULT 'other',
	`goalTitle` varchar(300) NOT NULL,
	`goalDescription` text,
	`estimatedCost` decimal(15,2),
	`priority` enum('must_have','nice_to_have','dream') NOT NULL DEFAULT 'nice_to_have',
	`achievabilityScore` int,
	`isAchieved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_life_goals_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `client_properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`propertyName` varchar(300) NOT NULL,
	`propertyType` enum('PRIMARY','INVESTMENT','SHORT_TERM_RENTAL','COMMERCIAL','LAND') NOT NULL DEFAULT 'PRIMARY',
	`propertyValue` decimal(15,2),
	`monthlyMortgagePayment` decimal(12,2),
	`monthlyInterestOnlyPayment` decimal(12,2),
	`totalInterestPayment` decimal(15,2),
	`monthlyRentalIncome` decimal(12,2),
	`annualAppreciation` decimal(5,4),
	`isPrimary` boolean NOT NULL DEFAULT false,
	`mortgageBalance` decimal(15,2),
	`interestRate` decimal(5,4),
	`loanTermYears` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_properties_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`category` enum('asset_allocation','spending','savings','insurance','tax_strategy','debt_management','retirement_timing','estate_planning','behavior','education') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`scoreImpact` int NOT NULL,
	`difficulty` enum('easy','moderate','challenging') NOT NULL DEFAULT 'moderate',
	`estimatedTimeframe` varchar(100),
	`isAccepted` boolean NOT NULL DEFAULT false,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`suggestedTab` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_recommendations_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_risk_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`marketDropReaction` int,
	`timeHorizon` int,
	`incomeStability` int,
	`investmentExperience` int,
	`riskCapacity` int,
	`volatilityComfort` int,
	`guaranteePreference` int,
	`growthVsIncome` int,
	`riskScore` int,
	`riskCategory` enum('conservative','moderate_conservative','moderate','moderate_aggressive','aggressive'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_risk_assessments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`overallScore` int NOT NULL DEFAULT 50,
	`financialHealthScore` int,
	`goalAlignmentScore` int,
	`behaviorScore` int,
	`diversificationScore` int,
	`level` int NOT NULL DEFAULT 1,
	`levelName` varchar(100) NOT NULL DEFAULT 'Starter',
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_scores_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_session_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`sessionId` int,
	`rating` decimal(3,1) NOT NULL,
	`explanation` text,
	`behaviors` json,
	`actions` json,
	`learningApproaches` json,
	`scoreEnhancementSteps` json,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_session_ratings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_tag_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_tag_assignments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#4f8cff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_tags_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `compliance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`alertType` enum('RMD_DEADLINE','CONTRIBUTION_LIMIT','FILING_DEADLINE','REBALANCE_OVERDUE','REVIEW_OVERDUE','AGE_MILESTONE','HIGH_CONCENTRATION','STALE_STRATEGY') NOT NULL,
	`severity` enum('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`dueDate` timestamp,
	`dismissed` boolean NOT NULL DEFAULT false,
	`dismissedBy` int,
	`dismissedAt` timestamp,
	`resolvedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_alerts_id` PRIMARY KEY(`id`)
);
CREATE TABLE `compliance_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`signedName` varchar(200) NOT NULL,
	`signedDate` varchar(20) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_signatures_id` PRIMARY KEY(`id`)
);
CREATE TABLE `daily_reward_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`rewardType` enum('xp','coin','loot','booster') NOT NULL,
	`rewardAmount` int NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_reward_claims_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`campaignType` enum('welcome','nurture','reengagement','educational','custom') NOT NULL DEFAULT 'custom',
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
CREATE TABLE `email_opt_outs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'link',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_opt_outs_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_opt_outs_email_unique` UNIQUE(`email`)
);
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`campaignId` int,
	`name` varchar(200) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
CREATE TABLE `email_verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`code` varchar(6) NOT NULL,
	`purpose` varchar(50) NOT NULL DEFAULT 'pre_checkout',
	`verified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_codes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `encouragement_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`emailType` enum('weekly_check_in','goal_reminder','level_up','badge_earned','score_boost','habit_tip') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encouragement_emails_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `family_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`inviteCode` varchar(20) NOT NULL,
	`createdBy` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_groups_inviteCode_unique` UNIQUE(`inviteCode`)
);
CREATE TABLE `family_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_members_id` PRIMARY KEY(`id`)
);
CREATE TABLE `financial_reels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`hook_text` text NOT NULL,
	`slides` json NOT NULL,
	`emotion` varchar(50) NOT NULL DEFAULT 'educational',
	`is_mega` boolean NOT NULL DEFAULT false,
	`cta_text` varchar(200) DEFAULT 'Learn More',
	`cta_action` varchar(200) DEFAULT '',
	`music_mood` varchar(100) DEFAULT 'neutral',
	`bg_gradient` varchar(200) DEFAULT '',
	`icon_emoji` varchar(20) DEFAULT '💰',
	`read_time_seconds` int DEFAULT 30,
	`sort_order` int DEFAULT 0,
	`view_count` int NOT NULL DEFAULT 0,
	`like_count` int NOT NULL DEFAULT 0,
	`save_count` int NOT NULL DEFAULT 0,
	`share_count` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financial_reels_id` PRIMARY KEY(`id`)
);
CREATE TABLE `follow_up_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sharedProjectionId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientEmail` varchar(320) NOT NULL,
	`advisorName` varchar(200),
	`emailType` enum('3day','7day') NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sent','cancelled','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follow_up_emails_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hidden_material_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hidden_material_config_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hidden_material_reset_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(6) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hidden_material_reset_codes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `household_fact_finders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`primaryAge` int,
	`primaryIncome` decimal(15,2),
	`primaryIra` decimal(15,2),
	`primaryRothIra` decimal(15,2),
	`primaryCash` decimal(15,2),
	`primaryHomeValue` decimal(15,2),
	`primaryHomeEquity` decimal(15,2),
	`primaryMortgageBalance` decimal(15,2),
	`primaryMortgageRate` decimal(5,4),
	`primaryMortgageYearsLeft` int,
	`primaryTotalInterest` decimal(15,2),
	`primaryAnnualPremium` decimal(15,2),
	`primaryDeathBenefit` decimal(15,2),
	`spouseName` varchar(200),
	`spouseAge` int,
	`spouseIncome` decimal(15,2),
	`spouseIra` decimal(15,2),
	`spouseRothIra` decimal(15,2),
	`spouseCash` decimal(15,2),
	`helocRate` decimal(5,4),
	`helocMaxLtv` decimal(5,4),
	`rentBasement` boolean DEFAULT false,
	`children` json,
	`grandchildren` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `household_fact_finders_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hubspot_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`direction` enum('PUSH','PULL') NOT NULL,
	`objectType` enum('CONTACT','DEAL') NOT NULL,
	`hubspotId` varchar(100),
	`localId` int,
	`status` enum('SUCCESS','FAILED','SKIPPED') NOT NULL DEFAULT 'SUCCESS',
	`errorMessage` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hubspot_sync_log_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hubspot_sync_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`syncEnabled` boolean NOT NULL DEFAULT false,
	`syncContacts` boolean NOT NULL DEFAULT true,
	`syncDeals` boolean NOT NULL DEFAULT true,
	`syncDirection` enum('BIDIRECTIONAL','PUSH_ONLY','PULL_ONLY') NOT NULL DEFAULT 'BIDIRECTIONAL',
	`lastSyncAt` timestamp,
	`lastSyncStatus` enum('SUCCESS','PARTIAL','FAILED') DEFAULT 'SUCCESS',
	`lastSyncContactsPushed` int DEFAULT 0,
	`lastSyncContactsPulled` int DEFAULT 0,
	`lastSyncDealsPushed` int DEFAULT 0,
	`lastSyncDealsPulled` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hubspot_sync_settings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `illustration_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`fileName` varchar(500) NOT NULL,
	`fileUrl` varchar(2000) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`carrier` varchar(200),
	`productName` varchar(300),
	`insuredName` varchar(200),
	`insuredAge` int,
	`insuredGender` varchar(20),
	`insuredState` varchar(50),
	`annualPremium` decimal(15,2),
	`deathBenefit` decimal(15,2),
	`illustratedRate` decimal(6,4),
	`extractedData` json,
	`yearByYear` json,
	`status` enum('uploading','extracting','ready','error') NOT NULL DEFAULT 'uploading',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `illustration_uploads_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `lead_followups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`step` varchar(60) NOT NULL,
	`channel` enum('email','sms') NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','sent','skipped','failed','cancelled') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`reason` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_followups_id` PRIMARY KEY(`id`)
);
CREATE TABLE `leaderboard_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`optedIn` boolean NOT NULL DEFAULT false,
	`respondedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaderboard_consents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `leaderboard_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`handle` varchar(50) NOT NULL,
	`useRealName` boolean NOT NULL DEFAULT false,
	`currentlyOptedIn` boolean NOT NULL DEFAULT false,
	`baselineAnnualCommissions` decimal(15,2),
	`platformJoinDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_profiles_id` PRIMARY KEY(`id`)
);
CREATE TABLE `legal_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentType` enum('supervisor_monitoring_agreement','compliance_disclaimer','terms_of_service','privacy_policy','nda','other') NOT NULL,
	`title` varchar(500) NOT NULL,
	`signerUserId` int NOT NULL,
	`signerName` varchar(200) NOT NULL,
	`signerEmail` varchar(320),
	`relatedTeamId` int,
	`relatedTeamName` varchar(300),
	`supervisorId` int,
	`supervisorName` varchar(200),
	`signatureName` varchar(200) NOT NULL,
	`signatureDate` varchar(50) NOT NULL,
	`documentContent` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legal_documents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `market_data_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`series` varchar(40) NOT NULL,
	`value` decimal(14,4) NOT NULL,
	`asOf` varchar(10) NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'fred',
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_data_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `market_data_points_series_unique` UNIQUE(`series`)
);
CREATE TABLE `meeting_reminder_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`meetingType` enum('IN_PERSON','VIDEO','PHONE','OTHER') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`leadTimeMinutes` int NOT NULL DEFAULT 1440,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_reminder_prefs_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `outbound_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int,
	`clientId` int,
	`leadId` int,
	`userId` int,
	`channel` enum('email','sms') NOT NULL,
	`category` enum('transactional','marketing') NOT NULL DEFAULT 'transactional',
	`toAddress` varchar(320) NOT NULL,
	`subject` varchar(300),
	`body` text NOT NULL,
	`template` varchar(60),
	`status` enum('sent','failed','suppressed') NOT NULL,
	`via` varchar(20),
	`reason` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outbound_messages_id` PRIMARY KEY(`id`)
);
CREATE TABLE `owner_trusted_ips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`label` varchar(200),
	`loginCount` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `owner_trusted_ips_id` PRIMARY KEY(`id`),
	CONSTRAINT `owner_trusted_ips_ipAddress_unique` UNIQUE(`ipAddress`)
);
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
CREATE TABLE `payment_disclosures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int,
	`planSlug` varchar(50) NOT NULL,
	`billingInterval` enum('MONTHLY','ANNUAL') NOT NULL,
	`priceAtAcceptance` decimal(10,2) NOT NULL,
	`payorFirstName` varchar(100) NOT NULL,
	`payorLastName` varchar(100) NOT NULL,
	`payorBusinessEntity` varchar(200),
	`payorAddress` varchar(300) NOT NULL,
	`payorCity` varchar(100) NOT NULL,
	`payorState` varchar(50) NOT NULL,
	`payorZip` varchar(20) NOT NULL,
	`payorPhone` varchar(30) NOT NULL,
	`payorEmail` varchar(320),
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` varchar(500),
	`pinVerifiedAt` timestamp,
	`signatureText` varchar(300) NOT NULL,
	`signatureHash` varchar(128) NOT NULL,
	`disclosureVersion` varchar(20) NOT NULL DEFAULT '1.0',
	`governingLaw` varchar(50) NOT NULL DEFAULT 'Delaware',
	`agreedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_disclosures_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `prediction_bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` varchar(500) NOT NULL,
	`prediction` varchar(100) NOT NULL,
	`wager` int NOT NULL,
	`status` enum('open','won','lost','cancelled') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`payout` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prediction_bets_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `public_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(40) NOT NULL,
	`firstName` varchar(120),
	`lastName` varchar(120),
	`email` varchar(320),
	`phone` varchar(40),
	`bestTimeToContact` varchar(200),
	`consentedAt` timestamp,
	`consentVersion` varchar(40),
	`lastIp` varchar(64),
	`ipHistory` json,
	`question` text,
	`factFinder` json,
	`analysis` json,
	`status` enum('new','contacted','qualified','client') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_leads_publicId_unique` UNIQUE(`publicId`)
);
CREATE TABLE `rebalance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`assetClass` varchar(100) NOT NULL,
	`targetPct` decimal(5,2) NOT NULL,
	`currentPct` decimal(5,2) NOT NULL,
	`driftPct` decimal(5,2) NOT NULL,
	`threshold` decimal(5,2) NOT NULL,
	`status` enum('OPEN','ACKNOWLEDGED','RESOLVED') NOT NULL DEFAULT 'OPEN',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rebalance_alerts_id` PRIMARY KEY(`id`)
);
CREATE TABLE `recommendation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientAge` int,
	`riskTolerance` varchar(20),
	`annualPremium` decimal(15,2),
	`recommendedCarrierId` varchar(50) NOT NULL,
	`recommendedCarrierName` varchar(200) NOT NULL,
	`totalScore` decimal(6,2) NOT NULL,
	`allScoresJson` json NOT NULL,
	`advisorId` int,
	`advisorName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendation_history_id` PRIMARY KEY(`id`)
);
CREATE TABLE `reel_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reelId` int NOT NULL,
	`action` enum('view','like','save','share') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reel_interactions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `referral_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`createdBy` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`partnerName` varchar(200) NOT NULL,
	`partnerEmail` varchar(320),
	`partnerType` enum('client','cpa','attorney','financial_advisor','other') NOT NULL DEFAULT 'client',
	`commissionPct` decimal(5,2),
	`clicks` int NOT NULL DEFAULT 0,
	`signups` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(15,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_links_id` PRIMARY KEY(`id`)
);
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`referrerName` varchar(200) NOT NULL,
	`referredName` varchar(200) NOT NULL,
	`referredEmail` varchar(320),
	`referredPhone` varchar(30),
	`source` enum('Client','Professional','Event','Online','Other') NOT NULL DEFAULT 'Client',
	`status` enum('pending','contacted','meeting_scheduled','converted','lost') NOT NULL DEFAULT 'pending',
	`estimatedValue` decimal(15,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `report_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`frequency` enum('MONTHLY','QUARTERLY') NOT NULL DEFAULT 'MONTHLY',
	`recipientEmail` varchar(320),
	`active` boolean NOT NULL DEFAULT true,
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_schedules_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `risk_score_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`score` int NOT NULL,
	`level` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`factors` json,
	`snapshotDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_score_history_id` PRIMARY KEY(`id`)
);
CREATE TABLE `risk_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`advisorId` int,
	`overallScore` int NOT NULL,
	`depthLevel` int NOT NULL,
	`questionsAnswered` int NOT NULL,
	`categories` json,
	`marketContext` json,
	`riskCategory` varchar(50),
	`trigger` varchar(50) NOT NULL DEFAULT 'initial',
	`driftScore` int,
	`flaggedForReassessment` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_snapshots_id` PRIMARY KEY(`id`)
);
CREATE TABLE `russellcoin_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`balance` int NOT NULL,
	`txType` enum('earn','spend','bonus','refund') NOT NULL,
	`source` varchar(100) NOT NULL,
	`sourceId` varchar(100),
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `russellcoin_transactions_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `saved_slide_decks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`toolName` varchar(200) NOT NULL,
	`clientName` varchar(200),
	`audience` enum('client','advisor','team') NOT NULL DEFAULT 'client',
	`slideCount` int NOT NULL,
	`slides` json NOT NULL,
	`pptxUrl` varchar(2000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_slide_decks_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `shared_projections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`advisorName` varchar(200),
	`token` varchar(64) NOT NULL,
	`projectionData` json NOT NULL,
	`inputData` json NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_projections_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_projections_token_unique` UNIQUE(`token`)
);
CREATE TABLE `sidebar_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`label` varchar(200) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sidebar_favorites_id` PRIMARY KEY(`id`)
);
CREATE TABLE `skill_tree_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillSlug` varchar(100) NOT NULL,
	`skillName` varchar(200) NOT NULL,
	`currentLevel` int NOT NULL DEFAULT 0,
	`maxLevel` int NOT NULL DEFAULT 5,
	`xpInvested` int NOT NULL DEFAULT 0,
	`mastered` boolean NOT NULL DEFAULT false,
	`masteredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skill_tree_progress_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slack_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`teamId` varchar(100),
	`teamName` varchar(200),
	`botToken` varchar(500),
	`channelId` varchar(100),
	`channelName` varchar(200),
	`webhookUrl` varchar(1000),
	`active` boolean NOT NULL DEFAULT true,
	`configJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slack_integrations_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slide_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`slideIndex` int,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`content` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slide_comments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slide_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`sharedWithEmail` varchar(320) NOT NULL,
	`sharedWithUserId` int,
	`permission` enum('view','comment','edit') NOT NULL DEFAULT 'comment',
	`shareToken` varchar(255) NOT NULL,
	`accessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slide_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `slide_shares_shareToken_unique` UNIQUE(`shareToken`)
);
CREATE TABLE `slide_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`email` varchar(320),
	`accessTier` enum('trial','unlimited','subscriber','owner') NOT NULL DEFAULT 'trial',
	`topic` varchar(200),
	`toolName` varchar(200),
	`slideCount` int NOT NULL DEFAULT 0,
	`audience` enum('client','advisor','team') NOT NULL DEFAULT 'client',
	`action` enum('generate','export_pptx','save') NOT NULL DEFAULT 'generate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slide_usage_id` PRIMARY KEY(`id`)
);
CREATE TABLE `sms_opt_outs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(24) NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'reply',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_opt_outs_id` PRIMARY KEY(`id`),
	CONSTRAINT `sms_opt_outs_phone_unique` UNIQUE(`phone`)
);
CREATE TABLE `sms_verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(30) NOT NULL,
	`code` varchar(10) NOT NULL,
	`purpose` varchar(50) NOT NULL DEFAULT 'payment_disclosure',
	`verified` boolean NOT NULL DEFAULT false,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_verification_codes_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `supervisor_monitoring_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`teamId` int NOT NULL,
	`teamName` varchar(300) NOT NULL,
	`supervisorId` int NOT NULL,
	`supervisorName` varchar(200) NOT NULL,
	`signatureName` varchar(200) NOT NULL,
	`signatureDate` varchar(50) NOT NULL,
	`agreementVersion` varchar(20) NOT NULL DEFAULT '1.0',
	`agreementText` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supervisor_monitoring_agreements_id` PRIMARY KEY(`id`)
);
CREATE TABLE `trial_logins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`ipAddress` varchar(100) NOT NULL,
	`userAgent` text,
	`sessionToken` varchar(255) NOT NULL,
	`accessTier` enum('trial','unlimited','subscriber') NOT NULL DEFAULT 'trial',
	`expiresAt` timestamp NOT NULL,
	`loggedOutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trial_logins_id` PRIMARY KEY(`id`),
	CONSTRAINT `trial_logins_sessionToken_unique` UNIQUE(`sessionToken`)
);
CREATE TABLE `tutorial_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(50),
	`questionnaireAnswers` json,
	`questionnaireCompleted` boolean NOT NULL DEFAULT false,
	`completedSections` json,
	`completedSubSections` json,
	`currentStep` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`badges` json,
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutorial_progress_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementSlug` varchar(100) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`emoji` varchar(20) NOT NULL DEFAULT '🏆',
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`xpReward` int NOT NULL DEFAULT 100,
	`coinReward` int NOT NULL DEFAULT 50,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_loot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemSlug` varchar(100) NOT NULL,
	`itemName` varchar(300) NOT NULL,
	`itemType` enum('cosmetic','booster','title','pet','theme','sound','shield') NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`quantity` int NOT NULL DEFAULT 1,
	`equipped` boolean NOT NULL DEFAULT false,
	`acquiredVia` enum('purchase','quest','achievement','loot_drop','daily_reward','gift') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_loot_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `user_quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questSlug` varchar(100) NOT NULL,
	`questType` enum('daily','weekly','epic','legendary') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`xpReward` int NOT NULL DEFAULT 50,
	`coinReward` int NOT NULL DEFAULT 10,
	`progress` int NOT NULL DEFAULT 0,
	`target` int NOT NULL DEFAULT 1,
	`status` enum('active','completed','expired','claimed') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`completedAt` timestamp,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_quests_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`loginAt` timestamp NOT NULL DEFAULT (now()),
	`logoutAt` timestamp,
	`durationSecs` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_xp_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`levelName` varchar(100) NOT NULL DEFAULT 'Rookie',
	`russellCoin` int NOT NULL DEFAULT 0,
	`lifetimeRussellCoin` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastCheckInDate` varchar(10),
	`totalCheckIns` int NOT NULL DEFAULT 0,
	`avatarUrl` varchar(2000),
	`avatarOriginalUrl` varchar(2000),
	`spouseAvatarUrl` varchar(2000),
	`spouseAvatarOriginalUrl` varchar(2000),
	`avatarTitle` varchar(200) DEFAULT 'Newcomer',
	`avatarBorder` varchar(50) DEFAULT 'default',
	`petType` varchar(50) DEFAULT 'eagle',
	`petLevel` int NOT NULL DEFAULT 1,
	`addictionScore` int NOT NULL DEFAULT 0,
	`reputationScore` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_xp_profiles_id` PRIMARY KEY(`id`)
);
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`firstName` varchar(100),
	`lastName` varchar(100),
	`passwordHash` varchar(255),
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`onboardingCompleted` boolean NOT NULL DEFAULT false,
	`loginCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
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
CREATE TABLE `war_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` enum('roth_conversion','iul_strategy','tax_savings','estate_planning','annuity_win','general') NOT NULL DEFAULT 'general',
	`dollarImpact` decimal(15,2),
	`likes` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`isAnonymous` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `war_stories_id` PRIMARY KEY(`id`)
);
CREATE TABLE `webhook_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`url` varchar(1000) NOT NULL,
	`label` varchar(200),
	`events` json NOT NULL,
	`secret` varchar(128),
	`active` boolean NOT NULL DEFAULT true,
	`lastTriggeredAt` timestamp,
	`failCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
CREATE TABLE `will_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`workspaceId` int,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','review','finalized') NOT NULL DEFAULT 'draft',
	`tone` enum('formal','heartfelt','spiritual','practical') NOT NULL DEFAULT 'heartfelt',
	`personalLetter` text,
	`assetDistribution` json,
	`guardianDesignations` json,
	`specialBequests` json,
	`finalWishes` text,
	`executorName` varchar(200),
	`executorRelation` varchar(100),
	`witnessNames` json,
	`generatedDocument` text,
	`familyContext` json,
	`pdfUrl` varchar(2000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `will_drafts_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `xp_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`source` varchar(100) NOT NULL,
	`sourceId` varchar(100),
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xp_transactions_id` PRIMARY KEY(`id`)
);

SET FOREIGN_KEY_CHECKS = 1;
