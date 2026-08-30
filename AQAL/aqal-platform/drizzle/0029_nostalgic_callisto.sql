CREATE TABLE `auditLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` varchar(32) NOT NULL,
	`payload` json NOT NULL,
	`prevHash` varchar(64) NOT NULL,
	`hash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLedger_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_ledger_hash_uq` UNIQUE(`hash`)
);
--> statement-breakpoint
CREATE TABLE `modelCalibration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model` varchar(64) NOT NULL,
	`axisIndex` int NOT NULL,
	`n` int NOT NULL DEFAULT 0,
	`sumAbsErr` float NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modelCalibration_id` PRIMARY KEY(`id`),
	CONSTRAINT `model_calibration_model_axis_uq` UNIQUE(`model`,`axisIndex`)
);
