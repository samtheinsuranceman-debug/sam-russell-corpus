ALTER TABLE `assessments` ADD `companion` json;--> statement-breakpoint
ALTER TABLE `users` ADD `underwritten_trial_started_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `underwritten_unlocked_at` timestamp;