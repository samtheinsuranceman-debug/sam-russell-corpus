-- 0083_owner_vault: the owner panel's 40 API-key + 40 MCP-URL slots.
-- Secrets arrive sealed (AES-256-GCM under OWNER_VAULT_KEY); this table never holds plaintext.
CREATE TABLE `owner_vault_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('api','mcp') NOT NULL,
	`slot` int NOT NULL,
	`providerId` varchar(64) NOT NULL,
	`label` varchar(120) NOT NULL,
	`sealed` text NOT NULL,
	`model` varchar(120),
	`domains` json,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `owner_vault_slots_id` PRIMARY KEY(`id`),
	CONSTRAINT `owner_vault_slots_kind_slot` UNIQUE(`kind`,`slot`)
);
