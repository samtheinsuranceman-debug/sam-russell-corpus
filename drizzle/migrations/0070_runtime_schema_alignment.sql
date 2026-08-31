ALTER TABLE `users`
  ADD COLUMN `firstName` varchar(100) NULL,
  ADD COLUMN `lastName` varchar(100) NULL,
  ADD COLUMN `passwordHash` varchar(255) NULL,
  ADD COLUMN `resetToken` varchar(255) NULL,
  ADD COLUMN `resetTokenExpiry` timestamp NULL,
  ADD COLUMN `onboardingCompleted` boolean NOT NULL DEFAULT false,
  ADD COLUMN `loginCount` int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `report_schedules` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `clientId` int NOT NULL,
  `workspaceId` int NOT NULL,
  `frequency` enum('MONTHLY','QUARTERLY') NOT NULL DEFAULT 'MONTHLY',
  `recipientEmail` varchar(320),
  `active` boolean NOT NULL DEFAULT true,
  `lastSentAt` timestamp NULL,
  `nextSendAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `meeting_reminder_prefs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `workspaceId` int NOT NULL,
  `userId` int NOT NULL,
  `meetingType` enum('IN_PERSON','VIDEO','PHONE','OTHER') NOT NULL,
  `enabled` boolean NOT NULL DEFAULT true,
  `leadTimeMinutes` int NOT NULL DEFAULT 1440,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `client_properties` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `clientId` int NOT NULL,
  `workspaceId` int NOT NULL,
  `propertyName` varchar(300) NOT NULL,
  `propertyType` enum('PRIMARY','INVESTMENT','SHORT_TERM_RENTAL','COMMERCIAL','LAND') NOT NULL DEFAULT 'PRIMARY',
  `propertyValue` decimal(15,2),
  `monthlyMortgagePayment` decimal(12,2),
  `monthlyInterestOnlyPayment` decimal(12,2),
  `totalInterestPayment` decimal(15,2),
  `monthlyRentalIncome` decimal(12,2),
  `annualAppreciation` decimal(5,4),
  `isPrimary` boolean NOT NULL DEFAULT false,
  `mortgageBalance` decimal(15,2),
  `interestRate` decimal(5,4),
  `loanTermYears` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `client_crypto_holdings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `clientId` int NOT NULL,
  `workspaceId` int NOT NULL,
  `coinId` varchar(100) NOT NULL,
  `coinName` varchar(200) NOT NULL,
  `coinSymbol` varchar(20),
  `quantity` decimal(20,8) NOT NULL,
  `avgPurchasePrice` decimal(15,2) NOT NULL,
  `amountStaked` decimal(20,8),
  `stakingPercentage` decimal(8,4),
  `predictedStakingIncome` decimal(15,2),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `compliance_signatures` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `userName` varchar(200) NOT NULL,
  `userEmail` varchar(320),
  `signedName` varchar(200) NOT NULL,
  `signedDate` varchar(20) NOT NULL,
  `ipAddress` varchar(45),
  `userAgent` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `userName` varchar(200) NOT NULL,
  `userEmail` varchar(320),
  `loginAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logoutAt` timestamp NULL,
  `durationSecs` int,
  `ipAddress` varchar(45),
  `userAgent` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
