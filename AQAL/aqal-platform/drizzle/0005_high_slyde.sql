ALTER TABLE `challenge_invites` ADD `recipientId` int;--> statement-breakpoint
ALTER TABLE `challenge_invites` ADD `recipientName` varchar(128);--> statement-breakpoint
ALTER TABLE `challenge_invites` ADD `recipientRarity` int;