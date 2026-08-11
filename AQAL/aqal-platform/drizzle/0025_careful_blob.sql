CREATE TABLE `beliefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`text` varchar(500) NOT NULL,
	`kind` enum('limiting','empowering') NOT NULL,
	`evidence` text,
	`touches` varchar(300),
	`status` enum('active','revised','dismissed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `beliefs_id` PRIMARY KEY(`id`)
);
