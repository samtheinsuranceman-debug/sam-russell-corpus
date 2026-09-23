-- 0086_council_runs: the Council's audit log (multi-model consensus runs).
-- Additive only. Numbered 0086 because master's latest is 0082 and open
-- branches hold 0083 (genome), 0084 (skins) and 0085 (workspace scoping). Stores a SHA-256 of the question, never its
-- text; the workspace id is the only household link.
CREATE TABLE `council_runs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int,
  `room` varchar(40) NOT NULL,
  `questionHash` varchar(64) NOT NULL,
  `outcome` enum('council','single','degraded','refused') NOT NULL,
  `forced` boolean NOT NULL DEFAULT false,
  `decisionReason` varchar(300),
  `panel` json,
  `judgeProviderId` varchar(80),
  `judgeModel` varchar(120),
  `judge` json,
  `judgeRepaired` boolean NOT NULL DEFAULT false,
  `confidence` enum('high','medium','low'),
  `factsProviderId` varchar(80),
  `factCount` int NOT NULL DEFAULT 0,
  `totalTokens` int NOT NULL DEFAULT 0,
  `latencyMs` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `council_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `council_runs_created` ON `council_runs` (`createdAt`);
--> statement-breakpoint
CREATE INDEX `council_runs_workspace_time` ON `council_runs` (`workspaceId`,`createdAt`);
