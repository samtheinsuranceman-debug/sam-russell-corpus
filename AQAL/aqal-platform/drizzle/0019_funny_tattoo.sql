CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int NOT NULL,
	`content` text,
	`attachmentKey` varchar(512),
	`attachmentName` varchar(255),
	`attachmentType` varchar(100),
	`attachmentSize` int,
	`attachmentExpiresAt` timestamp,
	`attachmentExpired` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
