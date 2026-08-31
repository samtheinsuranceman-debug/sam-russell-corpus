CREATE TABLE IF NOT EXISTS `slide_usage` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int,
  `email` varchar(320),
  `accessTier` enum('trial','unlimited','subscriber','owner') NOT NULL DEFAULT 'trial',
  `topic` varchar(200),
  `toolName` varchar(200),
  `slideCount` int NOT NULL DEFAULT 0,
  `audience` enum('client','advisor','team') NOT NULL DEFAULT 'client',
  `action` enum('generate','export_pptx','save') NOT NULL DEFAULT 'generate',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
