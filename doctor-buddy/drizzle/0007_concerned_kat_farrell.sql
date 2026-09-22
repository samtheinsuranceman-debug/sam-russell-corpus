ALTER TABLE `crisis_events` ADD `tier` enum('tier1_emergency','tier2_high_risk','tier3_elevated');--> statement-breakpoint
ALTER TABLE `crisis_events` ADD `matchedKeywords` json;--> statement-breakpoint
ALTER TABLE `crisis_events` ADD `deescalationUsed` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `crisis_events` ADD `nearestErShown` boolean DEFAULT false;