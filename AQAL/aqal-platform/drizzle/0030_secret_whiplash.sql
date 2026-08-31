CREATE TABLE `achievement_floors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`axisIndex` int NOT NULL,
	`floor` float NOT NULL DEFAULT 0,
	`evidenceHours` float NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `achievement_floors_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievement_floors_user_axis_uq` UNIQUE(`userId`,`axisIndex`)
);
--> statement-breakpoint
CREATE TABLE `research_provenance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`axisIndex` int NOT NULL,
	`theoryName` varchar(255) NOT NULL,
	`authors` json,
	`doi` varchar(255),
	`peerReviewed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `research_provenance_id` PRIMARY KEY(`id`),
	CONSTRAINT `research_provenance_axisIndex_unique` UNIQUE(`axisIndex`)
);
--> statement-breakpoint
CREATE TABLE `voice_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentId` int,
	`responseId` int,
	`pitchMeanHz` float,
	`pitchRangeHz` float,
	`speakingRateWPM` float,
	`pauseCount` int,
	`avgPauseDurationMs` float,
	`hesitationFrequency` float,
	`jitter` float,
	`shimmer` float,
	`spectralCentroidMean` float,
	`rmsEnergyMean` float,
	`confidenceIndex` float,
	`arousalIndex` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_features_id` PRIMARY KEY(`id`)
);
