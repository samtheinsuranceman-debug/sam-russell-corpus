CREATE TABLE `identity_access_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scope` varchar(32) NOT NULL,
	`endpoint` varchar(64) NOT NULL,
	`accessorEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `identity_access_log_id` PRIMARY KEY(`id`)
);
