CREATE TABLE `crisis_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`source` varchar(40) NOT NULL,
	`excerpt` varchar(300),
	`status` enum('open','reviewed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `crisis_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocol_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`practiceId` varchar(64) NOT NULL,
	`stars` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocol_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pulse_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`line` varchar(64) NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pulse_checks_id` PRIMARY KEY(`id`)
);
