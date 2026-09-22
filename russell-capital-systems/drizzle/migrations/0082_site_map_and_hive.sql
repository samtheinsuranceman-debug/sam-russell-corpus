-- 0082_site_map_and_hive: Site Map visits (neon-green persistence) + Hive Mind working memory.
-- Numbered per docs/architecture/MIGRATION_LEDGER.md (0075-0081 reserved for earlier rows).
CREATE TABLE `site_map_visits` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `routePath` varchar(200) NOT NULL,
  `visitCount` int NOT NULL DEFAULT 1,
  `firstVisitedAt` timestamp NOT NULL DEFAULT (now()),
  `lastVisitedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `site_map_visits_id` PRIMARY KEY(`id`),
  CONSTRAINT `site_map_visits_user_route` UNIQUE(`userId`,`routePath`)
);
--> statement-breakpoint
CREATE INDEX `site_map_visits_user` ON `site_map_visits` (`userId`);
--> statement-breakpoint
CREATE TABLE `hive_memory_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `kind` enum('page_visit','page_close','calc_result','forecast_toggle','verification','decision','question','nudge','note') NOT NULL,
  `routePath` varchar(200),
  `engine` varchar(120),
  `payload` json,
  `source` varchar(200),
  `asOf` varchar(40),
  `outcome` enum('pass','fail','unverified'),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `hive_memory_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `hive_memory_events_user_time` ON `hive_memory_events` (`userId`,`createdAt`);
