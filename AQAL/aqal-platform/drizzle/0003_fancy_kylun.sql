ALTER TABLE `users` ADD `stripe_customer_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_subscription_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `membership_tier` enum('free','silver','gold','platinum') DEFAULT 'free' NOT NULL;