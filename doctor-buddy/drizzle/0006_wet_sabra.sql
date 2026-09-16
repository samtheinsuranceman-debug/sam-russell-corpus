CREATE TABLE `brain_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`featureId` varchar(64) NOT NULL,
	`category` varchar(64) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`weight` int NOT NULL DEFAULT 5,
	`processed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brain_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctor_patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorUserId` int NOT NULL,
	`patientUserId` int NOT NULL,
	`clinicalNotes` text,
	`whispererSuggestions` json,
	`patientConsentGiven` boolean NOT NULL DEFAULT false,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doctor_patients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_buddy_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(255),
	`messages` json NOT NULL,
	`contextSnapshot` json,
	`sessionType` enum('general','condition_specific','treatment_planning','crisis','medication_review','progress_review') DEFAULT 'general',
	`crisisEscalated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_buddy_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `brain_events` ADD CONSTRAINT `brain_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctor_patients` ADD CONSTRAINT `doctor_patients_doctorUserId_users_id_fk` FOREIGN KEY (`doctorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctor_patients` ADD CONSTRAINT `doctor_patients_patientUserId_users_id_fk` FOREIGN KEY (`patientUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dr_buddy_sessions` ADD CONSTRAINT `dr_buddy_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;