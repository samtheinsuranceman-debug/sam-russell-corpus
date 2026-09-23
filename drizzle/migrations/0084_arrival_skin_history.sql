-- 0084_arrival_skin_history: per-user return-skin history for the arrival field (additive).
-- One row per user; `recent` is a JSON array of skin ids, most recent last.
CREATE TABLE `arrival_skin_history` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `sessionCount` int NOT NULL DEFAULT 0,
  `recent` json NOT NULL,
  `lastSkinId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `arrival_skin_history_id` PRIMARY KEY(`id`),
  CONSTRAINT `arrival_skin_history_user` UNIQUE(`userId`)
);
