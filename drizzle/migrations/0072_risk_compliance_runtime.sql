CREATE TABLE IF NOT EXISTS `risk_score_history` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `clientId` int NOT NULL,
  `workspaceId` int NOT NULL,
  `score` int NOT NULL,
  `level` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  `factors` json,
  `snapshotDate` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `compliance_alerts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `clientId` int NOT NULL,
  `workspaceId` int NOT NULL,
  `alertType` enum('RMD_DEADLINE','CONTRIBUTION_LIMIT','FILING_DEADLINE','REBALANCE_OVERDUE','REVIEW_OVERDUE','AGE_MILESTONE','HIGH_CONCENTRATION','STALE_STRATEGY') NOT NULL,
  `severity` enum('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
  `title` varchar(300) NOT NULL,
  `message` text NOT NULL,
  `dueDate` timestamp NULL,
  `dismissed` boolean NOT NULL DEFAULT false,
  `dismissedBy` int NULL,
  `dismissedAt` timestamp NULL,
  `resolvedAt` timestamp NULL,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
