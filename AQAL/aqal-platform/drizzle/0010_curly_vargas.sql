CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(48) NOT NULL,
	`userId` int,
	`sessionId` varchar(64),
	`numericValue` float,
	`ok` boolean,
	`meta` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_spend` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodStart` timestamp NOT NULL,
	`amountCents` int NOT NULL,
	`channel` varchar(64),
	`note` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketing_spend_id` PRIMARY KEY(`id`)
);
