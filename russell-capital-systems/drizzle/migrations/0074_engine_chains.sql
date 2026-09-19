-- Engine chaining: saved pipelines across the sister-invention engines, and
-- their execution history. The tables existed in the original build's schema
-- while the router that used them did not; both arrive together here.
CREATE TABLE IF NOT EXISTS `engine_chains` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `steps` json NOT NULL,
  `isTemplate` boolean NOT NULL DEFAULT false,
  `runCount` int NOT NULL DEFAULT 0,
  `lastRunAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `engine_chains_id` PRIMARY KEY(`id`),
  KEY `engine_chains_user` (`userId`)
);

CREATE TABLE IF NOT EXISTS `engine_chain_runs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chainId` int NOT NULL,
  `userId` int NOT NULL,
  `status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
  `stepResults` json,
  `totalTimeMs` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `engine_chain_runs_id` PRIMARY KEY(`id`),
  KEY `engine_chain_runs_chain` (`chainId`),
  KEY `engine_chain_runs_user` (`userId`)
);
